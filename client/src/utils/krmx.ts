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
