
// usePatchedState
//  State only lives on server, clients will receive a view on this state and can send actions to try to alter the server
//  state. Clients will receive updates on their view on the state in the form of JSON patches.

import { Client } from '@krmx/client';
import { isPatchedStatePatchEvent, isPatchedStateReleaseEvent, isPatchedStateSetEvent, PatchedState, PatchedStateActionEvent } from 'board';
import { Message } from '@krmx/base';
import { useSyncExternalStore } from 'react';

const undefinedDispatcher = '<init>'; // TODO: Should this be handled differently?

export const supportPatchedState = <View>(client: Client, domain: string, patchedState: PatchedState<unknown, View>): {
  use: () => View,
  send: (message: Message) => void,
} => {
  if (client.getStatus() === 'linked') {
    throw new Error(
      'supportPatchedState cannot be called with a client that is already linked to a user, as messages sent after linking but prior '
      + 'to the patched state being created would be lost.',
    );
  }

  // State
  const instance = patchedState.spawnClient();
  let view = patchedState.spawnServer().view(undefinedDispatcher);
  instance.subscribe(v => { view = v; });

  // Create listeners
  type Listener = () => void;
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

  // Reset state when the client itself (un)links
  const resetIfSelf = (username: string) => {
    if (username === client.getUsername()) {
      instance.set(patchedState.spawnServer().view(undefinedDispatcher));
      emit();
    }
  };
  client.on('link', resetIfSelf);
  client.on('unlink', resetIfSelf);

  // Allow the state to be altered once messages are received
  client.on('message', (message) => {
    // Handle set event
    if (isPatchedStateSetEvent<View>(message) && message.payload.domain === domain) {
      instance.set(message.payload.view); // TODO: Should we validate the view? (there is no (zod) schema available tho)
      emit();
    }
    // Handle patch event
    else if (isPatchedStatePatchEvent(message) && message.payload.domain === domain) {
      try {
        instance.apply(message.payload.delta, message.payload.optimisticId);
        emit();
      } catch (e) {
        console.error('error while applying patch', e, message);
      }
    }
    // Handle release event
    else if (isPatchedStateReleaseEvent(message) && message.payload.domain === domain) {
      console.info('Releasing optimistic', message.payload.optimisticId);
      instance.releaseOptimistic(message.payload.optimisticId);
      emit();
    }
  });

  const send = (event: Message) => {
    // TODO: Should we only send when client is linked?
    const result = instance.optimistic(client.getUsername() || undefinedDispatcher, event);
    if (!result.success) {
      console.error(`Failed to send action ${event.type}`, result);
      return result.error;
    }
    console.info(`Sent action ${event.type}`, result);
    client.send<PatchedStateActionEvent>({
      type: 'ps/action',
      payload: {
        domain,
        event,
        optimisticId: result.optimisticId,
      },
    });
    emit();
    return true;
  };

  const use = () => {
    // Return the external state as synced with the client
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(subscribe, () => view, () => view);
  };

  return {
    use,
    send,
  };
};
