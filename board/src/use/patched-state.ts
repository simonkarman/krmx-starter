import { Message } from '@krmx/base';
import { z, ZodAny, ZodAnyDef, ZodType, ZodUndefined } from 'zod';
import { produce } from 'immer';
import { Delta, diff, patch } from 'jsondiffpatch';

type ActionDefinitions<State, View> = {
  [type: string]: {
    payloadSchema: ZodAny
    handler: <T extends State>(state: T, dispatcher: string, payload: ZodAnyDef) => T | void,
    optimisticHandler: (<T extends View>(view: T, dispatcher: string, payload: ZodAnyDef) => T | void) | undefined,
  }
};

export type ServerSubscription = (getDeltaFor: (username: string) => Delta | false, optimisticId: string | undefined) => void;
export type ClientSubscription<View> = (view: View) => void;

class PatchedStateClientInstance<View> {
  private view: View;
  private optimisticView: View;
  private optimisticEvents: { optimisticId: string, dispatcher: string, event: Message }[] = [];

  private subscriptions: ClientSubscription<View>[] = [];

  constructor(
    private readonly actionDefinitions: ActionDefinitions<unknown, View>,
  ) {
    this.view = undefined as View;
    this.optimisticView = undefined as View;
  }

  private emit() {
    this.subscriptions.forEach(sub => {
      try {
        sub(this.optimisticView);
      } catch (err) {
        // silently ignore errors in subscriptions
      }
    });
  }

  set(view: View) {
    this.view = view;
    this.optimisticView = structuredClone(view);
    this.optimisticEvents = [];
    this.emit();
  }

  apply(delta: Delta, optimisticId?: string): void {
    if (this.view === undefined) {
      throw new Error('cannot use patched state client instance before the view has been set, invoke clientInstance.set(...) first');
    }

    // apply the delta to the view
    this.view = patch(this.view, delta) as View; // should have a ViewSchema to and validate after each patch??
    this.optimisticView = structuredClone(this.view);

    // if this resolved an optimistic id, remove optimistic update with the id that is just applied
    if (optimisticId) {
      this.optimisticEvents = this.optimisticEvents.filter(e => e.optimisticId !== optimisticId);
    }

    // apply optimistic events on top of view
    this.optimisticEvents.forEach(({ dispatcher, event }) => {
      try {
        this.optimisticView = produce(this.optimisticView, (_optimisticView: View) => {
          const actionDefinition = this.actionDefinitions[event.type];
          if (actionDefinition === undefined || actionDefinition.optimisticHandler === undefined) {
            return;
          }
          const payload = actionDefinition.payloadSchema.safeParse(event.payload);
          if (!payload.success) {
            return;
          }
          return actionDefinition.optimisticHandler(_optimisticView, dispatcher, payload.data);
        });
      } catch (err) {
        // act as if this failed optimistic handler did not change the view
      }
    });

    // notify subscribers
    this.emit();
  }

  optimistic(dispatcher: string, event: Message): string | false | z.ZodError {
    if (this.view === undefined) {
      throw new Error('cannot use patched state client instance before the view has been set, invoke clientInstance.set(...) first');
    }

    // get the action definition corresponding to the dispatched event
    const actionDefinition = this.actionDefinitions[event.type];
    // if it does not exist, or no optimistic handler is used for this event type, skip it
    if (actionDefinition === undefined || actionDefinition.optimisticHandler === undefined) {
      return false;
    }

    // verify the payload is valid based on the schema of the action definition for this event
    const payload = actionDefinition.payloadSchema.safeParse(event.payload);
    if (!payload.success) {
      return payload.error;
    }

    // apply the optimistic event to the optimistic view
    try {
      this.optimisticView = produce(this.optimisticView, (_optimisticView: View) => {
        if (actionDefinition.optimisticHandler === undefined) {
          // this should never happen as events without an optimistic handler have already been filtered out
          return;
        }
        return actionDefinition.optimisticHandler(_optimisticView, dispatcher, payload.data);
      });
    } catch (err) {
      // act as if this failed optimistic handler did not change the view
      return false;
    }

    // notify subscribers
    this.emit();

    // save (and return the id of) the optimistic event
    const optimisticId = 'opt0-' + crypto.randomUUID();
    this.optimisticEvents.push({ optimisticId, dispatcher, event });
    return optimisticId;
  }

  onChange(subscription: ClientSubscription<View>) {
    this.subscriptions.push(subscription);
  }
}

class PatchedStateServerInstance<State, View> {
  private subscriptions: ServerSubscription[] = [];

  constructor(
    private state: State,
    private readonly viewMapper: (state: State, username: string) => View,
    private readonly actionDefinitions: ActionDefinitions<State, View>,
  ) {}

  dispatch(dispatcher: string, event: Message, optimisticId?: string): boolean | z.ZodError {
    // get the action definition corresponding to the dispatched event
    const actionDefinition = this.actionDefinitions[event.type];
    if (actionDefinition === undefined) {
      return false;
    }

    // verify the payload is valid based on the schema of the action definition for this event
    const payload = actionDefinition.payloadSchema.safeParse(event.payload);
    if (!payload.success) {
      return payload.error;
    }

    // let's apply it to the source state (and reset the optimistic state to it)
    const previousState = this.state;
    try {
      this.state = produce(this.state, (_state: State) => {
        return actionDefinition.handler(_state, dispatcher, payload.data);
      });
    } catch (err) {
      // act as if this failed handler did not change the state
      return true;
    }

    // and broadcast changes to the source state
    this.subscriptions.forEach(subscription => {
      try {
        subscription((username: string) => {
          const delta = diff(
            this.viewMapper(previousState, username),
            this.viewMapper(this.state, username),
          );
          if (delta === undefined) {
            return false;
          }
          return delta;
        }, optimisticId);
      } catch (err) {
        // silently ignore errors in subscriptions
      }
    });
    return true;
  }

  onChange(subscription: ServerSubscription) {
    this.subscriptions.push(subscription);
  }

  view(username: string) {
    return this.viewMapper(this.state, username);
  }
}

export class PatchedState<State, View> {
  private actionDefinitions: ActionDefinitions<State, View> = {};

  /**
   * Create a new patched state.
   *  State only lives on server, clients will receive a view on this state and can send actions to try to alter the server
   *  state. Clients will receive updates on their view on the state in the form of a delta.
   *
   * Note: Keep in mind that the view should be safe to JSON decode and encode. Only use primitives, don't use classes, functions, or other complex
   *  types.
   *
   * @param initialState The initial state.
   * @param viewMapper A function that maps the state to a view. This function will be called for each client whenever the state changes, and the
   *  changes from the previous view to the new view will be sent to the client in the form of a delta. It will also be called once for each client
   *  without a username to get the initial view.
   */
  constructor(
    public readonly initialState: State,
    private readonly viewMapper: (state: State, username?: string) => View,
  ) {}

  /**
   * Adds a new handler for when a specific type of event is dispatched.
   *
   * @param type The identifier of the event. This must be unique for this event source. For example: 'increment'
   * @param payloadSchema The Zod schema to use for the payload of the event. For example z.number().int().min(1).max(5)
   * @param handler The handler that applies the payload to the state. This method receives the state, the dispatcher, and the payload.
   * @param optimisticHandler An optional handler that immediately applies the payload to the view. This method receives the view, the dispatcher,
   *  and the payload.
   *
   * Note: In the handlers you can manipulate the state or view object directly (made possible by Immer) or return a new object from the handler.
   *
   * @returns Returns a constructor for creating type safe events.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  when<Type extends string, PayloadSchema extends ZodType<any, any, any>>(
    type: Type,
    payloadSchema: PayloadSchema,
    handler: (state: State, dispatcher: string, payload: z.infer<PayloadSchema>) => State | void,
    optimisticHandler?: (view: View, dispatcher: string, payload: z.infer<PayloadSchema>) => View | void,
  ):
    PayloadSchema extends ZodUndefined
      ? () => { type: Type, payload: undefined }
      : (payload: z.infer<PayloadSchema>) => { type: Type, payload: z.infer<PayloadSchema> } {
    if (this.actionDefinitions[type] !== undefined) {
      throw new Error(`event type ${type} is already in use`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.actionDefinitions[type] = { payloadSchema, handler, optimisticHandler } as any;

    // @ts-expect-error as payload parameter could be undefined
    return (payload) => ({ type, payload });
  }

  spawnServer() {
    return new PatchedStateServerInstance<State, View>(this.initialState, this.viewMapper, this.actionDefinitions);
  }

  spawnClient() {
    return new PatchedStateClientInstance<View>(this.actionDefinitions);
  }
}
