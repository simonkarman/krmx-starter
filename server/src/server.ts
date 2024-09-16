import { createServer, Props } from '@krmx/server';
import { chat } from './chat';
import { cli } from './cli';
import { enableUnlinkedKicker } from './unlinked-kicker';
import { useSyncedValue } from './use/synced-value';

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

const { get, set } = useSyncedValue(server, { clearOnEmptyServer: true });
const interval = setInterval(() => {
  if (server.getUsers().length === 0) {
    return;
  }
  // const rotation = get('rotation');
  // set(
  //   'rotation',
  //   typeof rotation === 'number'
  //     ? rotation + 1
  //     : 0,
  // );
}, 1300);

server.listen(8084);

export default async () => {
  await server.close();
  clearInterval(interval);
};
