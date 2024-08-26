import { createClient, createStore } from '@krmx/client-react';

// Create the client
export const { client, useClient } = createClient();
client.on('message', console.info);

// Create an example store for messages received from the server
let id = 0;
export type Message = { id: number, username: string, text: string };
export const useMessages = createStore(
  client,
  /* the initial internal state */
  [] as Message[],
  /* a reducer handling state changes based on incoming messages */
  (state, message) => {
    if (!message.type.startsWith('chat/')) {
      return state;
    }
    if (message.type === 'chat/history') {
      const messages = (message.payload as Message[]);
      id = messages.length;
      return messages.map((m, i) => ({ ...m, id: i }));
    }
    id += 1;
    return [...state, { ...(message.payload as { username: string, text: string }), id }].slice(-100);
  },
  /* a mapper that can map the internal state to a different format */
  s => s,
);
