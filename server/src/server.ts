import { createServer, Props } from '@krmx/server';
import { chat } from './chat';
import { cli } from './cli';
import { enableUnlinkedKicker } from './unlinked-kicker';
import { useSyncedValue } from './use/synced-value';
import { capitalize, exampleEventSource, toSyncedValue } from 'board';
import { useEventSource } from './use/event-source';

// Setup server
const props: Props = { /* configure here */ };
const server = createServer(props);
enableUnlinkedKicker(server);
cli(server);
const { get, set, getKeys } = useSyncedValue(server, {
  clearOnEmptyServer: true,
  strictKeyPrefixes: true,
});
useEventSource(server, 'example', exampleEventSource, { optimisticSeconds: 10 });

// Increase rotation by one every 1.3 seconds
const interval = setInterval(() => {
  if (server.getUsers().length === 0) {
    return;
  }
  const rotation = get('rotation');
  set(
    'rotation',
    typeof rotation === 'number'
      ? rotation + 1
      : 0,
  );
}, 1300);

// Support chat
chat(server, {
  'time': (_, args, sendServerMessage) => {
    if (args.length === 0) {
      sendServerMessage(new Date().toTimeString(), true);
    }
  },
  // Add custom commands for setting and getting synced values
  'set': (username, args, sendServerMessage) => {
    if (args.length === 2) {
      set(args[0], toSyncedValue(args[1]));
      sendServerMessage(`${capitalize(username)} set ${args[0]} to ${get(args[0]).toString()}`);
      return;
    }
    sendServerMessage('Usage /set <key> <value>', true);
  },
  'get': (_, args, sendServerMessage) => {
    if (args.length === 1) {
      sendServerMessage(`${args[0]} is ${get(args[0]).toString()}`, true);
      return;
    }
    sendServerMessage(getKeys().map(k => k + ' is ' + get(k)).join(', '), true);
  },
});

// Start server
server.listen(8084);
export default async () => {
  await server.close();
  clearInterval(interval);
};
