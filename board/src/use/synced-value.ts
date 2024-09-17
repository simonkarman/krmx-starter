import { Message } from '@krmx/base';

/**
 * Representation of a sync-able value. It can be a string, number, or boolean.
 */
export type SyncedValue = string | number | boolean;

/**
 * Convert a string value to a synced value.
 *  'abc' -> string
 *  '123' -> number
 *  'true' -> true
 *
 * @param value The value to convert.
 */
export const toSyncedValue = (value: string): SyncedValue => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  const number = Number(value);
  return isNaN(number) ? value : number;
};

/**
 * A message to set a synced value.
 */
export type SyncedValueSetMessage = { type: 'sv/set', payload: { key: string, value: SyncedValue } };

/**
 * Check if a message is a SyncedValueSetMessage.
 *
 * @param message The message to check.
 */
export const isSyncedValueSetMessage = (message: Message): message is SyncedValueSetMessage => {
  return message.type === 'sv/set'
    && typeof message.payload === 'object'
    && message.payload !== null
    && 'key' in message.payload
    && typeof message.payload.key === 'string'
    && 'value' in message.payload
    && (typeof message.payload.value === 'string' || typeof message.payload.value === 'number' || typeof message.payload.value === 'boolean');
};
