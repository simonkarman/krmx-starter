'use client';

import { ConnectUI } from '@/components/connect-ui';
import { LinkUI } from '@/components/link-ui';
import { OverviewUI } from '@/components/overview-ui';
import { client, useClient, useMessages } from '@/utils/krmx';
import { useState } from 'react';

export default function MyApp() {
  const { status } = useClient();
  const messages = useMessages();
  const [message, setMessage] = useState<string>('');

  return <>
    <h1>Krmx Starter</h1>
    <ConnectUI serverUrl='ws://localhost:8082'/>
    <LinkUI/>
    <OverviewUI/>
    {status === 'linked' && <>
      <h2>Messages</h2>
      <input
        onChange={(e) => setMessage(e.target.value)}
        value={message}
        type='text'
        placeholder='Type your message here...'
      />
      <button
        disabled={message.length === 0}
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
    </>}
  </>;
}
