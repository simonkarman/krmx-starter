'use client';

import { client, useClient, useMessages } from '@/utils/krmx';
import { useState } from 'react';

export function Chat() {
  const { status } = useClient();
  const messages = useMessages();
  const [message, setMessage] = useState<string>('');

  if (status !== 'linked') {
    return null;
  }

  return <>
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
  </>;
}
