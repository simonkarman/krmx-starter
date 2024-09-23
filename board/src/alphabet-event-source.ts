import { z } from 'zod';
import { EventSource, Root } from './use';

export const alphabetEventSource = new EventSource({ letters: 'abc', claim: undefined as (string | undefined) });
export const extendAlphabet = alphabetEventSource.when('extend', z.undefined(), (state, dispatcher) => {
  if (state.claim !== undefined && state.claim !== dispatcher) {
    throw new Error('alphabet is not claimed by you');
  }
  if (state.letters.length >= 26) {
    throw new Error('alphabet cannot be extended as it is already full');
  }
  state.letters += String.fromCharCode(state.letters.length + 'a'.charCodeAt(0));
});
export const claimAlphabet = alphabetEventSource.when('claim', z.undefined(), (state, dispatcher) => {
  if (state.claim !== undefined) {
    throw new Error('alphabet is already claimed');
  }
  state.claim = dispatcher;
});
export const releaseAlphabet = alphabetEventSource.when('release', z.undefined(), (state, dispatcher) => {
  if (state.claim !== dispatcher) {
    throw new Error('alphabet is not claimed by you');
  }
  state.claim = undefined;
});
export const resetAlphabet = alphabetEventSource.when('reset', z.undefined(), (state, dispatcher) => {
  if (dispatcher !== Root) {
    throw new Error('alphabet can only be reset by the server');
  }
  state.claim = undefined;
  state.letters = 'abc';
});
