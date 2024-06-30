'use client';
import { useEffect, useState } from 'react';
import { client, useClient } from '@/utils/krmx';

export function LinkUI() {
  const { status } = useClient();

  // Keep track of link failures
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => { setFailure(null); }, [status]);

  // Keep track of username input
  const [linkUsername, setLinkUsername] = useState<string>('simon');

  // Your logic for when your connection is not (yet) linked to a user goes here
  if (status !== 'connected') {
    return null;
  }

  return (
    <>
      <input
        onChange={(e) => setLinkUsername(e.target.value)}
        value={linkUsername}
        type="text"
        placeholder="Username..."
      />
      <button onClick={() => {
        client.link(linkUsername, 'no-auth')
          .catch((e: Error) => setFailure(e.message));
      }}>
        Link as {linkUsername}!
      </button>
      {failure && <p>Rejected: {failure}</p>}
      <button onClick={() => {
        client.disconnect()
          .catch((e: Error) => setFailure(e.message));
      }}>
        Disconnect!
      </button>
    </>
  );
}
