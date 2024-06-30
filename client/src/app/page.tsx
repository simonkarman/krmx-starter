"use client";
import { useEffect, useState } from 'react';
import { client, useClient, useMessages } from './krmx';

// The example client component that you can use in your React app to connect to a Krmx server
export function KrmxExampleClient({ serverUrl }: { serverUrl: string }) {
  // Use the Krmx client and the example message store in this component
  const { status, username, users } = useClient();
  const messages = useMessages();

  // Keep track of failures
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => { setFailure(null); }, [status]);

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

  // Keep track of messages
  const [message, setMessage] = useState<string>('');
  const [linkUsername, setLinkUsername] = useState<string>('simon');

  // Your logic for when you're not (yet) connected to the server goes here
  if (status === 'initializing' || status === 'connecting' || status === 'closing' || status === 'closed') {
    return <>
      <h2>Status: {status}</h2>
      <p>No connection to the server...</p>
      <button onClick={() => {
        client.connect(serverUrl)
          .catch((e: Error) => setFailure(e.message));
      }}>
        Connect to {serverUrl}.
      </button>
    </>;
  }

  // Your logic for when your connection is not (yet) linked to a user goes here
  if (status === 'connected' || status === 'linking' || status === 'unlinking') {
    return (
      <>
        <h2>Status: {status}</h2>
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

  // Your logic for when you're ready to go goes here
  return (
    <>
      <h2>Status: {status}</h2>
      <p>Welcome, <strong>{username}</strong>!</p>
      <button onClick={() => client.unlink().catch((e: Error) => setFailure(e.message))}>
        Unlink
      </button>
      <button onClick={() => client.leave().catch((e: Error) => setFailure(e.message))}>
        Leave
      </button>
      <h2>Users</h2>
      <ul>
        {users.map(({ username: otherUsername, isLinked }) => (
          <li key={otherUsername}>
            {isLinked ? '🟢' : '🔴'} {otherUsername}
          </li>),
        )}
      </ul>
      <h2>Messages</h2>
      <input
        onChange={(e) => setMessage(e.target.value)}
        value={message}
        type='text'
        placeholder='Type your message here...'
      />
      <button
        disabled={message.length < 3}
        onClick={() => {
          client.send({ type: 'starter/message', payload: message });
          setMessage('');
        }}
      >
        Send my message!
      </button>
      <ul>
        {messages.map(({ id, username, text }) => <li
          key={id}
        >
          <strong>{username}</strong> says: {text}
        </li>)}
      </ul>
    </>
  );
}

export default function MyApp() {
  return <>
    <h1>Krmx Example Client</h1>
    <KrmxExampleClient serverUrl="ws://localhost:8082"/>
  </>;
}
