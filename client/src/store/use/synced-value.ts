import { isSyncedValueSetMessage, SyncedValue, SyncedValueSetMessage } from 'board';
import { createStore } from '@krmx/client-react';
import { client } from '@/store/krmx';

/**
 * Create a store for synced values received from the server.
 */
const useSyncedValues = createStore(
  client,
  /* the initial internal state */
  {} as { [key: string]: SyncedValue | undefined },
  /* a reducer handling state changes based on incoming messages */
  (state, message) => {
    if (!isSyncedValueSetMessage(message)) {
      return state;
    }
    return {
      ...state,
      [message.payload.key]: message.payload.value,
    };
  },
  /* a mapper that can map the internal state to a different format */
  s => s,
);

/**
 * Use a synced value.
 * Keeps track of a single value that is synced across all clients, no history, no validation, always overrides. Simple.
 *
 * @param key The key of the value to sync.
 * @param defaultValue The default value of the value to sync.
 */
export const useSyncedValue = <T extends (number | string | boolean)>(
  key: string,
  defaultValue: T,
): [
  value: T,
  setter: ((v: (T) | ((v: T) => T)) => void)
] => {
  const syncedValue = useSyncedValues()[key] as T | undefined;
  const value = syncedValue === undefined ? defaultValue : syncedValue;
  const setValue = (_v: (T) | ((v: T) => T)) => {
    const v = typeof _v === 'function' ? _v(value) : _v;
    if (v !== value) {
      client.send<SyncedValueSetMessage>({
        type: 'sv/set',
        payload: { key, value: v },
      });
    }
  };
  return [value, setValue];
};
