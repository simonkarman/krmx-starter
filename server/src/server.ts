import { createServer, Props } from '@krmx/server';
import { cli } from './cli';
import { enableUnlinkedKicker } from './unlinked-kicker';

const props: Props = { /* configure here */ };
const server = createServer(props);
enableUnlinkedKicker(server);
cli(server);

server.on('message', (username, message) => {
  if (message.type === 'chat/message') {
    server.broadcast({ type: 'chat/messaged', payload: { username, text: message.payload } });
  }
});

server.listen(8082);

export default async () => {
  await server.close();
};
