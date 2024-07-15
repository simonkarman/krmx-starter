import { createServer, Props } from '@krmx/server';
import { enableOfflineKicker } from './offline-kicker';

const props: Props = { /* configure here */ };
const server = createServer(props);
enableOfflineKicker(server);

interface Tile {
  content: string;
}

type Move = 'up' | 'down' | 'right' | 'left' | 'none'

const gridWidth = 5;
const gridHeight = 5;
const worldGrid: Tile[] = [];
const gameLoopTime: number = 5000;
let moves: Record<string, Move> = {};
const playerGridIndices: Record<string, number> = {};
const direction: Record<Move, number> = {
  'up': -gridWidth,
  'down': gridWidth,
  'left': -1,
  'right': 1,
  'none': 0,
};

// Set up the world grid, by default all empty
for (let i = 0; i < gridWidth; i++) {
  for (let j = 0; j < gridHeight; j++) {
    const tile: Tile = { content: 'empty' };
    worldGrid.push(tile);
  }
}

server.on('leave', (username) => {
  worldGrid[playerGridIndices[username]].content = 'empty';
  server.broadcast({ type: 'ao/grid', payload: worldGrid });
});

server.on('join', (username) => {
  const playerGridIndex = worldGrid.findIndex(w => w.content == 'empty');
  playerGridIndices[username] = playerGridIndex;
  worldGrid[playerGridIndex].content = `player:${username}`;

  server.broadcast({ type: 'ao/grid', payload: worldGrid }, username);
});

server.on('link', (username) => {
  server.send(username, { type: 'ao/grid-size', payload: { width: gridWidth, height: gridHeight } });
  server.send(username, { type: 'ao/grid', payload: worldGrid });

});

server.on('message', (username, message) => {
  if (message.type === 'chat/message') {
    server.broadcast({ type: 'chat/messaged', payload: { username, text: message.payload } });
  }
  if (message.type === 'ao/move') {
    moves[username] = message.payload as Move;
    server.send(username, { type: 'ao/move-confirmed', payload: message.payload });
  }
});

function doGameLoop() {
  if (server.getStatus() !== 'listening') {
    return;
  }

  for (const userName in moves) {
    const move = moves[userName];
    const playerGridIndex = playerGridIndices[userName];
    if (playerGridIndex === undefined) {
      console.log('move found for non existing player' + userName);
      continue;
    }

    //Outside grid, do not move
    const modulesRemainder = playerGridIndex % gridWidth;
    if ((move === 'up' && playerGridIndex - gridWidth < 0)
      || (move === 'down' && playerGridIndex + gridWidth >= worldGrid.length)
      || (move === 'left' && modulesRemainder === 0)
      || (move === 'right' && modulesRemainder === (gridWidth - 1))) {
      console.log(`${userName} moves outside grid, do nothing`);
      server.send(userName, { type: 'ao/move-denied', payload: 'out-of-grid' });
      continue;
    }

    // Is tile available?
    const targetIndex = playerGridIndex + direction[move];
    if (worldGrid[targetIndex].content === 'empty') {
      worldGrid[playerGridIndex].content = 'empty';
      playerGridIndices[userName] += direction[move];
      worldGrid[targetIndex].content = `player:${userName}`;
      console.log(`player ${userName} moved to ${playerGridIndex}`);
    } else {
      server.send(userName, { type: 'ao/move-denied', payload: 'obstruction' });
      continue;
    }
  }

  // Reset the moves of each player
  moves = {};

  // Broadcast updated the world
  server.broadcast({ type: 'ao/grid', payload: worldGrid });
  server.broadcast({ type: 'ao/game-loop', payload: gameLoopTime });
}

const gameLoopIntervalId = setInterval(doGameLoop, gameLoopTime);

server.listen(8082);
export default async () => {
  clearInterval(gameLoopIntervalId);
  await server.close();
};
