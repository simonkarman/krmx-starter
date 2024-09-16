import { Message } from '@krmx/base';

/**
 * A message to set a simple value.
 */
export type SyncedValueSetMessage = { type: 'sv/set', payload: { key: string, value: unknown } };

/**
 * Check if a message is a SValueSetMessage.
 * @param message The message to check.
 */
export const isSyncedValueSetMessage = (message: Message): message is SyncedValueSetMessage => {
  return message.type === 'sv/set'
    && typeof message.payload === 'object'
    && message.payload !== null
    && 'key' in message.payload
    && typeof message.payload.key === 'string'
    && 'value' in message.payload;
};
