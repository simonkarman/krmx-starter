import { z } from 'zod';
import { StreamModel } from '@krmx/state';

export const alphabetModel = new StreamModel({ letters: 'abc', claim: undefined as (string | undefined) });
export const extendAlphabet = alphabetModel.when('extend', z.undefined(), (state, dispatcher) => {
  if (state.claim !== undefined && state.claim !== dispatcher) {
    throw new Error('alphabet is not claimed by you');
  }
  if (state.letters.length >= 26) {
    throw new Error('alphabet cannot be extended as it is already full');
  }
  state.letters += String.fromCharCode(state.letters.length + 'a'.charCodeAt(0));
});
export const claimAlphabet = alphabetModel.when('claim', z.undefined(), (state, dispatcher) => {
  if (state.claim !== undefined) {
    throw new Error('alphabet is already claimed');
  }
  state.claim = dispatcher;
});
export const releaseAlphabet = alphabetModel.when('release', z.undefined(), (state, dispatcher) => {
  if (state.claim !== dispatcher) {
    throw new Error('alphabet is not claimed by you');
  }
  state.claim = undefined;
});
export const resetAlphabet = alphabetModel.when('reset', z.undefined(), (state, dispatcher) => {
  if (state.claim !== dispatcher) {
    throw new Error('alphabet is not claimed by you');
  }
  state.claim = undefined;
  state.letters = 'a';
});
