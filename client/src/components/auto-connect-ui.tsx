'use client';

import { FullScreenWrapper } from '@/components/full-screen-wrapper';
import { client, useClient } from '@/store/krmx';
import { useEffect, useState } from 'react';

export function AutoConnectUI() {
  const { status } = useClient();
  const [serverUrl] = useState<string>('ws://localhost:8084');
  const [isConnecting, setIsConnecting] = useState<boolean>(true);

  // When the server url changes, disconnect the client from the server
  useEffect(() => {
    if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
      client.disconnect(true)
        .catch((e: Error) => {
          console.error('error disconnecting while mounting', e);
        });
    }

    // Try to reconnect after every 2.5 seconds (if not yet connected)
    let tries = 0;
    const maxTries = 10;
    function tryConnect() {
      const status = client.getStatus();

      // Do not try to connect if already connected
      const isConnected = status !== 'initializing' && status !== 'closed' && status !== 'connecting' && status !== 'closing';
      if (isConnected) {
        // If component was not yet reset, reset it now
        if (tries > 0) {
          tries = 0;
          setIsConnecting(true);
        }
        return;
      }

      // Do not try to connect if already connecting or closing
      if (status === 'connecting' || status === 'closing') {
        return;
      }

      // If we've tried too many times, stop trying
      if (tries >= maxTries) {
        return;
      }
      tries += 1;

      // Try to connect
      client.connect(serverUrl)
        .catch((e: Error) => {
          console.error(`${tries}x: error connecting`, e);
        });

      // If we've tried too many times, set is connecting too false to update the UI
      if (tries >= maxTries) {
        setIsConnecting(false);
      }
    }
    const timeoutId = setTimeout(tryConnect, 50);
    const intervalId = setInterval(tryConnect, 2500);

    // And... disconnect from the server when the component unmounts
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
        client.disconnect(true)
          .catch((e: Error) => {
            console.error('error disconnecting while unmounting', e);
          });
      }
    };
  }, [serverUrl]);

  // Only render this component if the client is initializing, connecting, closing or closed
  if (status !== 'initializing' && status !== 'connecting' && status != 'closing' && status !== 'closed') {
    return null;
  }

  return <FullScreenWrapper>
    <div className="flex items-center gap-6 md:gap-8">
      <p className="text-6xl md:text-8xl">
        {
          isConnecting
            ? <span className={'block h-14 w-14 animate-spin rounded-full border-4 md:h-20 md:w-20 md:border-8 ' +
                               'border-t-blue-800 dark:border-t-blue-200 border-slate-100 dark:border-slate-800'}/>
            : '😵'
        }
      </p>
      <div className="space-y-6">
        <div className="dark:text-white md:text-xl">
          <p className="font-semibold">
            {isConnecting ? 'Waiting for a connection to the server' : 'Unable to connect to the server'}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {isConnecting ? 'Trying to connect...' : 'Please, come back later.'}
          </p>
        </div>
      </div>
    </div>
  </FullScreenWrapper>;
}
