import { createClient, createStore } from '@krmx/client-react';

// Create the client
export const { client, useClient } = createClient();
client.on('message', console.info);

// Create an example store for messages received from the server
let id = 0;
export const useMessages = createStore(
  client,
  /* the initial internal state */
  [] as { id: number, username: string, text: string }[],
  /* a reducer handling state changes based on incoming messages */
  (state, message) => {
    if (message.type !== 'chat/messaged') return state;
    id += 1;
    return [...state, { ...(message.payload as { username: string, text: string }), id }].slice(-10);
  },
  /* a mapper that can map the internal state to a different format */
  s => s,
);

// Create grid store for grid state
export const useGrid = createStore(
  client,
  /* the initial internal state */
  {
    currentMove: 'none',
    cells: [] as { content: string }[],
    width: 0,
    height: 0,
    expectedNextGameLoop: new Date().getTime() + 5000,
    gameLoopInterval: 5000,
  },
  /* a reducer handling state changes based on incoming messages */
  (state, message) => {
    if (message.type === 'ao/grid-size') {
      const { width, height } = message.payload as { width: number, height: number };
      return {
        expectedNextGameLoop: 0,
        gameLoopInterval: 100,
        width,
        height,
        currentMove: 'none',
        cells: Array.from({ length: height * width }, (_, i) => ({ content: 'empty' })),
      };
    }
    if (message.type === 'ao/grid') {
      return {
        ...state,
        currentMove: 'none',
        cells: message.payload as { content: string }[],
      };
    }
    if (message.type === 'ao/game-loop') {
      const interval = message.payload as number;
      return {
        ...state,
        expectedNextGameLoop: Date.now() + interval,
        gameLoopInterval: interval,
      };
    }
    if (message.type === 'ao/move-confirmed') {
      return { ...state, currentMove: message.payload as string };
    }
    return state;
  },
  /* a mapper that can map the internal state to a different format */
  s => s,
);
