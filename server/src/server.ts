import { createServer, Props } from '@krmx/server';
import { cli } from './cli';
import { enableUnlinkedKicker } from './unlinked-kicker';

const props: Props = { /* configure here */ };
const server = createServer(props);
enableUnlinkedKicker(server);
cli(server);

// Enable this to limit the number of users that can join the server
// server.on('authenticate', (username, isNewUser, reject) => {
//   if (server.getUsers().length > 4 && isNewUser) {
//     reject('server is full');
//   }
// });

server.on('message', (username, message) => {
  if (message.type === 'chat/message') {
    server.broadcast({ type: 'chat/messaged', payload: { username, text: message.payload } });
  }
});

server.listen(8082);

export default async () => {
  await server.close();
};
