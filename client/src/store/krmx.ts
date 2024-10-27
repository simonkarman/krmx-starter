import { createClient } from '@krmx/client-react';
import { alphabetModel, cardGameModel, hexagonWorldModel } from 'board';
import { registerAtoms, registerStream, registerProjection } from '@krmx/state-client-react';

// Create the client
export const { client, useClient } = createClient();

// Atoms
export const useAtom = registerAtoms(client);

// Streams
export const {
  use: useAlphabet,
  dispatch: dispatchAlphabetEvent,
} = registerStream(client, 'alphabet', alphabetModel, { optimisticSeconds: 10 });

// Projections
export const {
  use: useCardGame,
  dispatch: dispatchCardGameEvent,
} = registerProjection(client, 'card-game', cardGameModel);

export const {
  use: useHexagonWorld,
  dispatch: dispatchHexagonWorldEvent,
} = registerProjection(client, 'hexagon-world', hexagonWorldModel);
