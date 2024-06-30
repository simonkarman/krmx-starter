'use client';

import { useEffect, useState } from 'react';
import { client, useClient } from '@/utils/krmx';

export function ConnectUI({ serverUrl }: { serverUrl: string }) {
  const { status } = useClient();

  // When the server url changes, disconnect the client from the server
  useEffect(() => {
    if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
      client.disconnect(true)
        .catch((e: Error) => console.error('error disconnecting', e.message));
    }

    // And... disconnect from the server when the component unmounts
    return () => {
      if (client.getStatus() !== 'initializing' && client.getStatus() !== 'closed') {
        client.disconnect(true)
          .catch((e: Error) => console.error('error disconnecting', e.message));
      }
    };
  }, [serverUrl]);

  // Keep track of connect failures
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => { setFailure(null); }, [status]);

  if (status !== 'initializing' && status !== 'closed') {
    return null;
  }

  return <>
    <p>No connection to the server...</p>
    <button onClick={() => {
      client.connect(serverUrl)
        .catch((e: Error) => setFailure(e.message))
        .then(() => setFailure(null));
    }}>
      Connect to {serverUrl}.
    </button>
    {failure && <p>{failure}</p>}
  </>;
}
