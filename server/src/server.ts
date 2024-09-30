import { createServer, Props } from '@krmx/server';
import { capitalize, enumerate, parseAtom } from '@krmx/state';
import { chat } from './chat';
import { cli } from './cli';
import { enableUnlinkedKicker } from './unlinked-kicker';
import {
  alphabetModel, releaseAlphabet, resetAlphabet,
  Root, cardGameModel, startCardGame,
} from 'board';
import { registerAtoms, registerStream, registerProjection } from '@krmx/state-server';

// Setup server
const props: Props = { /* configure here */ };
const server = createServer(props);
enableUnlinkedKicker(server);
cli(server);
const { get, set, getKeys } = registerAtoms(server, {
  clearOnEmptyServer: true,
  strictKeyPrefixes: true,
});
const { dispatch: dispatchAlphabet } = registerStream(server, 'alphabet', alphabetModel, { optimisticSeconds: 10 });
const { dispatch: dispatchCardGame } = registerProjection(server, 'card-game', cardGameModel);

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
}, 1_300);

// Release alphabet claim everytime a user unlinks
server.on('unlink', (username) => {
  dispatchAlphabet(username, releaseAlphabet());
});

// Reset alphabet when the last user leaves
server.on('leave', () => {
  if (server.getUsers().length === 0) {
    dispatchAlphabet(Root, resetAlphabet());
  }
});

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
      set(args[0], parseAtom(args[1]));
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
  'cards': (_, args, sendServerMessage) => {
    if (args.length >= 3) {
      const startConf = {
        seed: crypto.randomUUID(),
        players: args.slice(0, -1).map(p => p.toLowerCase()),
        handSize: parseInt(args[args.length - 1]),
      };
      if (!isNaN(startConf.handSize)) {
        const result = dispatchCardGame(Root, startCardGame(startConf));
        if (!result.success) {
          sendServerMessage('Failed to start gard game', true);
          return;
        }
        sendServerMessage(`Card Game started with ${enumerate(startConf.players.map(capitalize))} and hand size ${startConf.handSize}`);
        return;
      }
    }
    sendServerMessage('Usage /cards <player1> <player2> <player...> <handSize>', true);
  },
});

// Start server
server.listen(8084);
export default async () => {
  await server.close();
  clearInterval(interval);
};
