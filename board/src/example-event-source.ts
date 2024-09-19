import { z } from 'zod';
import { EventSource } from './use';

export const exampleEventSource = new EventSource({ nested: { counter: 0 }, other: 'abc' });
export const exampleIncrement = exampleEventSource.when('increment', z.number().min(1).int(), (state, _, payload) => {
  state.nested.counter += payload;
});
export const exampleAlphabet = exampleEventSource.when('alphabet', z.undefined(), (state) => {
  if (state.other.length === 26) {
    throw new Error('Alphabet is full');
  }
  state.other += String.fromCharCode(state.other.length + 'a'.charCodeAt(0));
});
