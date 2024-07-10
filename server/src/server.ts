import { createServer, Props } from '@krmx/server';
import { enableOfflineKicker } from './offline-kicker';

const props: Props = { /* configure here */ };
const server = createServer(props);
const disableOfflineKicker = enableOfflineKicker(server);

server.on('message', (username, message) => {
  if (message.type === 'chat/message') {
    server.broadcast({ type: 'chat/messaged', payload: { username, text: message.payload } });
  }
  if (message.type === 'starter/disable-offline-kicker') {
    disableOfflineKicker();
  }
});

server.listen(8082);
export default async () => server.close();
