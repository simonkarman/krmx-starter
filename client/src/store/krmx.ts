import { createClient } from '@krmx/client-react';
import { alphabetEventSource } from 'board';
import { supportEventSource } from '@/store/use/event-source';

// Create the client
export const { client, useClient } = createClient();

// Support the alphabet event source
export const {
  use: useAlphabet,
  send: sendAlphabetEvent,
} = supportEventSource(client, 'alphabet', alphabetEventSource, { optimisticSeconds: 10 });
