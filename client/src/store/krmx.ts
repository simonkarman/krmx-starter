import { createClient } from '@krmx/client-react';
import { alphabetEventSource, cardGamePatchedState } from 'board';
import { supportEventSource } from '@/store/use/event-source';
import { supportPatchedState } from '@/store/use/patched-state';

// Create the client
export const { client, useClient } = createClient();

// Support the alphabet event source
export const {
  use: useAlphabet,
  send: sendAlphabetEvent,
} = supportEventSource(client, 'alphabet', alphabetEventSource, { optimisticSeconds: 10 });

export const {
  use: useCardGame,
  send: sendCardGameEvent,
} = supportPatchedState(client, 'card-game', cardGamePatchedState);
