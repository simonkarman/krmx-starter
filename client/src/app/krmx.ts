import { createClient, createStore } from '@krmx/client-react';

// Create the client
export const { client, useClient } = createClient();

// Create an example store for messages received from the server
export const useMessages = createStore(
  client,
  /* the initial internal state */
  [] as { id: string, username: string, text: string }[],
  /* a reducer handling state changes based on incoming messages */
  (state, message) => {
    if (message.type !== 'starter/messaged') return state;
    return [...state, { ...(message.payload as { username: string, text: string }), id: crypto.randomUUID() }].slice(-10);
  },
  /* a mapper that can map the internal state to a different format */
  s => s
);
