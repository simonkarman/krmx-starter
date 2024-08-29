import { Message } from '@krmx/base';
import { createServer, Props } from '@krmx/server';
import { chat } from './chat';
import { cli } from './cli';
import { enableUnlinkedKicker } from './unlinked-kicker';

// Setup server
const props: Props = { /* configure here */ };
const server = createServer(props);
enableUnlinkedKicker(server);
cli(server);
chat(server, {
  'time': (_, args, sendServerMessage) => {
    if (args.length === 0) {
      sendServerMessage(new Date().toTimeString());
    }
  },
});

const syncStates: { [key: string]: unknown } = {};
const syncStateListener = (username: string, message: Message) => {
  if (message.type == 'sync/state') {
    const payload = message.payload as { key: string, get?: unknown, set: unknown };
    const key = payload.key;
    if (payload.get) {
      let state = syncStates[key];
      if (state === undefined) {
        state = payload.get;
      }
      syncStates[key] = state;
      server.send(username, { type: 'sync/state', payload: { key, set: state } });
    } else {
      syncStates[key] = payload.set;
      server.broadcast({ type: 'sync/state', payload: { key, set: syncStates[key] } });
    }
  }
};
server.on('message', syncStateListener);
const interval = setInterval(() => {
  syncStateListener('<server>', {
    type: 'sync/state',
    payload: { key: 'rotation', set: (syncStates['rotation'] as number ?? 0) - 1 } });
}, 700);

server.listen(8084);

export default async () => {
  await server.close();
  clearInterval(interval);
};
