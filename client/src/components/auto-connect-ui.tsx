'use client';

import { FullScreenWrapper } from '@/components/full-screen-wrapper';
import { client, useClient } from '@/utils/krmx';
import { capitalize } from '@/utils/text';
import { useEffect, useState } from 'react';

export function AutoConnectUI() {
  const { status } = useClient();
  const [serverUrl, setServerUrl] = useState<string>('ws://localhost:8082');

  // Keep track of connect failures
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => { setFailure(null); }, [status]);

  // When the server url changes, disconnect the client from the server
  useEffect(() => {
    if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
      client.disconnect(true)
        .catch((e: Error) => {
          console.error('error disconnecting while mounting', e);
          setFailure(e.message);
        });
    }

    // Try to reconnect after every 250ms (if not yet connected)
    const intervalId = setInterval(() => {
      if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
        return;
      }
      client.connect(serverUrl)
        .catch((e: Error) => {
          console.error('error connecting', e);
        });
    }, 250);

    // And... disconnect from the server when the component unmounts
    return () => {
      clearInterval(intervalId);
      if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
        client.disconnect(true)
          .catch((e: Error) => {
            console.error('error disconnecting while unmounting', e);
          });
      }
    };
  }, [serverUrl]);

  // Only render this component if the client is initializing or closed and ready to connect
  if (status !== 'initializing' && status !== 'closed') {
    return null;
  }

  return <FullScreenWrapper>
    <div className="flex items-center gap-10">
      <p className="text-6xl md:text-8xl">
        😵
      </p>
      <div className="space-y-6">
        <div className='md:text-xl dark:text-white'>
          <p className="font-semibold">
            Connection to the server was lost...
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Please, try again.
          </p>
          {failure && <p className="text-gray-700 dark:text-gray-300">
            {capitalize(failure)}
          </p>}
        </div>
        <div className="flex gap-4">
          <button
            className="grow rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700
                       focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
            onClick={() => client.connect(serverUrl)}
          >
            Reconnect
          </button>
          <button
            className="grow-0 rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700
                       focus:outline-none focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
            onClick={() => client.connect(serverUrl)}
          >
            Custom
          </button>
        </div>
      </div>
    </div>
  </FullScreenWrapper>;
}
