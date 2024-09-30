import { createClient } from '@krmx/client-react';
import { alphabetModel, cardGameModel } from 'board';
import { registerAtoms, registerStream, registerProjection } from '@krmx/state-client-react';

// Create the client
export const { client, useClient } = createClient();

export const {
  use: useAlphabet,
  dispatch: dispatchAlphabetEvent,
} = registerStream(client, 'alphabet', alphabetModel, { optimisticSeconds: 10 });

export const {
  use: useCardGame,
  dispatch: dispatchCardGameEvent,
} = registerProjection(client, 'card-game', cardGameModel);

export const useAtom = registerAtoms(client);
