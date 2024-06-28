import { createServer, Props } from '@krmx/server';
import { enableOfflineKicker } from './offline-kicker';

const props: Props = { /* configure here */ }
const server = createServer(props);
const disableOfflineKicker = enableOfflineKicker(server);

server.on('message', (username, message) => {
  if (message.type === 'starter/message') {
    server.broadcast({ type: 'starter/messaged', payload: { username, text: message.payload } });
  }
  if (message.type === 'starter/disable-offline-kicker') {
    disableOfflineKicker();
  }
});

server.listen(8082);
