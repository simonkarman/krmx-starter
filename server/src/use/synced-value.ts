import { Server } from '@krmx/server';
import { isSyncedValueSetMessage, SyncedValue, SyncedValueSetMessage } from 'board';
/**
 * Properties to configure the synchronization of simple values.
 */
type UseSyncedValueProps = {
  /**
   * Clear the values when the server is empty.
   */
  clearOnEmptyServer?: boolean,

  /**
   * Only allow the user to set values with keys that are prefixed with their username and a slash.
   *
   * By default, or if set to false: all users can set any key with slashes.
   * If set to true: only the user with the username in the key can set the value. For example, if the user's username is 'alice', only they
   *                 can set values with keys like 'alice/rotation'.
   *
   * Note: Keys without a slash are always allowed to be set by any user.
   */
  strictKeyPrefixes?: boolean,
};

/**
 * Add support to this server to sync simple values across all clients.
 * Keeps track of a single value that is synced across all clients, no history, no validation, always overrides. Simple.
 *
 * @param server The server to support syncing values on.
 * @param props The properties to configure the syncing.
 *
 * @returns An object with methods to turn syncing off and to get and set values.
 */
export const useSyncedValue = (server: Server, props: UseSyncedValueProps) => {
  // Keep track of the synced values.
  let syncedValues: { [key: string]: SyncedValue } = {};

  // Everytime a message is received, check if it is a set value message, and if so, set the value and broadcast it.
  const offMessage = server.on('message', (username, message) => {
    if (isSyncedValueSetMessage(message)) {
      const { key, value } = message.payload;
      if (props.strictKeyPrefixes === true && key.includes('/') && !key.startsWith(`${username}/`)) {
        return;
      }
      syncedValues[key] = value;
      server.broadcast<SyncedValueSetMessage>({ type: 'sv/set', payload: { key, value } });
    }
  });

  // Everytime a client links, send all the values to the client.
  const offLink = server.on('link', (username) => {
    for (const key in syncedValues) {
      server.send<SyncedValueSetMessage>(username, { type: 'sv/set', payload: { key, value: syncedValues[key] } });
    }
  });

  // If configured to clear values when the server is empty, clear the values when the server is empty.
  const offLeave = props.clearOnEmptyServer
    ? server.on('leave', () => {
      if (server.getUsers().length === 0) {
        syncedValues = {};
      }
    })
    : () => {};

  // Return the methods to turn off syncing, and to get and set values.
  return {
    /**
     * Turn off the functionality to synchronize simple values.
     */
    off: () => {
      offMessage();
      offLink();
      offLeave();
    },

    /**
     * Get a value.
     *
     * @param key The key of the value to get.
     * @returns The value.
     */
    get(key: string): SyncedValue {
      return syncedValues[key];
    },

    /**
     * Set a value and immediately broadcast it to all clients.
     *
     * @param key The key of the value to set.
     * @param value The value to set.
     */
    set(key: string, value: SyncedValue) {
      syncedValues[key] = value;
      server.broadcast<SyncedValueSetMessage>({ type: 'sv/set', payload: { key, value } });
    },

    /**
     * Get all keys.
     *
     * @returns The keys of the values.
     */
    getKeys(): string[] {
      return Object.keys(syncedValues);
    },
  };
};
