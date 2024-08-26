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
  'time': (username, args, sendServerMessage) => {
    if (args.length === 0) {
      sendServerMessage(new Date().toTimeString());
    }
  },
});

server.listen(8084);

export default async () => {
  await server.close();
};
