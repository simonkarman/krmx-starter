import { Server } from '@krmx/server';
import { isSyncedValueSetMessage, SyncedValueSetMessage } from 'board';
/**
 * Properties to configure the synchronization of simple values.
 */
type UseSyncedValueProps = {
  /**
   * Clear the values when the server is empty.
   */
  clearOnEmptyServer?: boolean,
  // TODO: Add support for keys with '<username>/<key-name>' to only be set by the user with that username.
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
  let syncedValues: { [key: string]: unknown } = {};

  // Everytime a message is received, check if it is a set value message, and if so, set the value and broadcast it.
  const offMessage = server.on('message', (_, message) => {
    console.info('outside', message.type, message.payload);
    if (isSyncedValueSetMessage(message)) {
      console.info('inside', message.type, message.payload.key, message.payload.value);
      const { key, value } = message.payload;
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
    get(key: string): unknown {
      return syncedValues[key];
    },

    /**
     * Set a value and immediately broadcast it to all clients.
     *
     * @param key The key of the value to set.
     * @param value The value to set.
     */
    set(key: string, value: unknown) {
      syncedValues[key] = value;
      server.broadcast<SyncedValueSetMessage>({ type: 'sv/set', payload: { key, value } });
    },
  };
};
