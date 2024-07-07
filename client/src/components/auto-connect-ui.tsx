'use client';

import { FullScreenWrapper } from '@/components/full-screen-wrapper';
import { client, useClient } from '@/utils/krmx';
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
          console.error('error connecting', e);
          setFailure(e.message);
        });
    }

    // And... disconnect from the server when the component unmounts
    return () => {
      if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
        client.disconnect(true);
      }
    };
  }, [serverUrl]);

  // Only render this component if the client is initializing or closed and ready to connect
  if (status !== 'initializing' && status !== 'closed') {
    return null;
  }

  return <FullScreenWrapper>
    <div className="flex items-center gap-8">
      <p className="text-6xl md:text-8xl">
        😵
      </p>
      <p className="md:text-xl dark:text-white">
        <span className="font-semibold">
          Connection to the server at was lost...
        </span>
        <br/>
        <span className="text-gray-700 dark:text-gray-300">
          Please, try again.
        </span>
        <br/>
        {failure && <>
          <span className="text-gray-700 dark:text-gray-300">{failure[0].toUpperCase() + failure.slice(1)}</span>
          <br/>
        </>}
        <button
          className='mt-6 rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700 focus:outline-none'
          onClick={() => client.connect(serverUrl)}
        >Connect to {serverUrl}</button>
      </p>
    </div>
  </FullScreenWrapper>;
}
