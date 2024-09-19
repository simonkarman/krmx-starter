import { client } from '@/store/krmx';
import { EventSource, EventSourceInstance, EventSourceInstanceProps, exampleEventSource, isEventSourceEvent } from 'board';
import { Message } from '@krmx/base';
import { useSyncExternalStore } from 'react';

type Listener = () => void;

/**
 * Create a store for an event source.
 */
const supportEventSource = <State>(domain: string, eventSource: EventSource<State>, props: EventSourceInstanceProps): {
  use: () => State,
  send: (message: Message) => ReturnType<EventSourceInstance<State>['dispatch']>,
} => {
  if (client.getStatus() === 'linked') {
    throw new Error(
      'supportEventSource cannot be called with a client that is already linked to a user, as messages sent after linking but prior '
      + 'to the store being created would be lost.',
    );
  }

  // State
  const instance = eventSource.spawn(props);
  let state = instance.initialState;
  instance.onOptimisticChange(s => { state = s; });

  // Create listeners
  let listeners: Listener[] = [];
  function subscribe(listener: Listener) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }

  // Emit the state to the external state
  function emit() {
    listeners.forEach(l => l());
  }

  // Reset state when the client itself unlinks
  const resetIfSelf = (username: string) => {
    if (username === client.getUsername()) {
      state = instance.initialState;
      instance.reset();
      emit();
    }
  };
  client.on('link', resetIfSelf);
  client.on('unlink', resetIfSelf);

  // Allow the state to be altered once messages are received
  client.on('message', (message) => {
    if (!isEventSourceEvent(message) || message.payload.domain !== domain) {
      return;
    }
    const result = instance.dispatch(message.payload.dispatcher, message.payload.event);
    if (result !== true) {
      return;
    }
    emit();
  });

  const send = (event: Message) => {
    const result = instance.dispatch(client.getUsername() || 'self', event, true);
    if (result !== true) {
      return result;
    }
    client.send({ ...event, type: `${domain}/${event.type}` });
    emit();
    return true;
  };

  const use = () => {
    // Return the external state as synced with the client
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(subscribe, () => state, () => state);
  };

  return {
    use,
    send,
  };
};

export const {
  use: useExampleEventSource,
  send: sendExampleEvent,
} = supportEventSource('example', exampleEventSource, { optimisticSeconds: 10 });
