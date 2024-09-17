import { createServer, Props } from '@krmx/server';
import { chat } from './chat';
import { cli } from './cli';
import { enableUnlinkedKicker } from './unlinked-kicker';
import { useSyncedValue } from './use/synced-value';
import { toSyncedValue } from 'board';

// Setup server
const props: Props = { /* configure here */ };
const server = createServer(props);
enableUnlinkedKicker(server);
cli(server);
const { get, set, getKeys } = useSyncedValue(server, {
  clearOnEmptyServer: true,
  strictKeyPrefixes: true,
});

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
      sendServerMessage(new Date().toTimeString());
    }
  },
  // Add custom commands for setting and getting synced values
  'set': (_, args, sendServerMessage) => {
    if (args.length === 2) {
      set(args[0], toSyncedValue(args[1]));
      sendServerMessage(args[0] + ' is ' + get(args[0]).toString());
    } else {
      sendServerMessage('Usage /set <key> <value>');
    }
  },
  'get': (_, args, sendServerMessage) => {
    if (args.length === 1) {
      sendServerMessage(args[0] + ' is ' + get(args[0]).toString());
    } else {
      sendServerMessage(`Values: ${getKeys().map(k => k + ' is ' + get(k)).join(', ')}`);
    }
  },
});

// Start server
server.listen(8084);
export default async () => {
  await server.close();
  clearInterval(interval);
};
