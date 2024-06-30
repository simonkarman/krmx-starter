'use client';

import { client, useClient } from '@/utils/krmx';
import { useEffect, useState } from 'react';

export function OverviewUI() {
  const { status, username, users } = useClient();

  // Keep track of link failures
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => { setFailure(null); }, [status]);

  if (status !== 'linked') {
    return null;
  }

  return <>
    <h2>Status: {status}</h2>
    <p>Welcome, <strong>{username}</strong>!</p>
    <button onClick={() => client.unlink().catch((e: Error) => setFailure(e.message))}>
        Unlink
    </button>
    <button onClick={() => client.leave().catch((e: Error) => setFailure(e.message))}>
        Leave
    </button>
    {failure && <p>{failure}</p>}
    <h2>Users</h2>
    <ul>
      {users.map(({ username: otherUsername, isLinked }) => (
        <li key={otherUsername}>
          {isLinked ? '🟢' : '🔴'} {otherUsername}
        </li>),
      )}
    </ul>
  </>;
}
