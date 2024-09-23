import { Server } from '@krmx/server';
import { PatchedState, PatchedStatePatchEvent, PatchedStateReleaseEvent, PatchedStateSetEvent } from 'board';
import { Message } from '@krmx/base';

// usePatchedState
//  State only lives on server, clients will receive a view on this state and can send actions to try to alter the server
//  state. Clients will receive updates on their view on the state in the form of JSON patches.
export const usePatchedState = <View>(
  server: Server,
  domain: string,
  patchedState: PatchedState<unknown, View>,
): {
  dispatch: (dispatcher: string, event: Message) => ReturnType<ReturnType<PatchedState<unknown, View>['spawnServer']>['dispatch']>
} => {
  const instance = patchedState.spawnServer();

  instance.subscribe((getDeltaFor, optimisticId) => {
    server.getUsers().forEach((user) => {
      if (!user.isLinked) {
        return;
      }
      const delta = getDeltaFor(user.username);
      if (delta === false) {
        if (optimisticId) {
          server.send<PatchedStateReleaseEvent>(user.username, {
            type: 'ps/release',
            payload: { domain, optimisticId },
          });
        }
        return;
      }
      server.send<PatchedStatePatchEvent>(user.username, {
        type: 'ps/patch',
        payload: {
          domain,
          delta,
          optimisticId,
        },
      });
    });
  });
  server.on('link', (username) => {
    server.send<PatchedStateSetEvent<View>>(username, {
      type: 'ps/set',
      payload: {
        domain,
        view: instance.view(username),
      },
    });
  });
  return {
    dispatch: (dispatcher: string, event: Message) => instance.dispatch(dispatcher, event),
  };
};
