'use client';

import { client, Message, useClient, useMessages } from '@/utils/krmx';
import { capitalize } from 'board';
import { useEffect, useState } from 'react';

export function Chat() {
  const { status, username: self } = useClient();
  const messages = useMessages();
  const [message, setMessage] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!open) {
      setUnread(messages.length > 0);
    }
  }, [messages]);

  const toggle = () => {
    setOpen(!open);
    setUnread(false);
  };

  if (status !== 'linked') {
    return null;
  }

  type UserMessages = { username: string, messages: { id: number, text: string }[] }[];
  const messagesPerUser = messages.toReversed().reduce<UserMessages>((acc: UserMessages, next: Message) => {
    if (acc.length > 0 && acc[acc.length - 1].username === next.username) {
      acc[acc.length - 1].messages.push({ id: next.id, text: next.text });
    } else {
      acc.push({ username: next.username, messages: [{ id: next.id, text: next.text }] });
    }
    return acc;
  }, []);

  return <div
    className="absolute bottom-0 right-4 min-w-72 space-y-3 rounded-t-lg border border-b-0 border-gray-200 bg-gray-100 px-4 pb-3
               pt-2 dark:border-gray-700 dark:bg-gray-800"
  >
    <div
      className="flex cursor-pointer justify-between"
      onClick={toggle}
    >
      <div className="flex items-center gap-2">
        <h2 className="font-bold">Chat</h2>
        {unread && <span className="block h-3 w-3 animate-pulse rounded-full bg-orange-700"/>}
      </div>
      {open && <button
        className="rounded-lg bg-gray-200 px-2 text-sm font-bold dark:bg-gray-700"
        onClick={toggle}
      >
        x
      </button>}
    </div>
    {open && <>
      <div className="my-7 border-t border-gray-300 dark:border-gray-700">
        <ul className="my-0 flex max-h-96 flex-col-reverse gap-4 overflow-x-scroll pr-3">
          {messagesPerUser.map(({ username, messages }) => {
            const isSelf = self === username;
            const isServer = username === '<server>';
            const headerColor = isSelf
              ? 'text-orange-600 dark:text-orange-200'
              : (isServer ? 'hidden text-gray-400 dark:text-gray-600' : 'text-blue-600 dark:text-blue-200');
            const messageColor = isServer ? 'text-sm py-2 text-gray-500 dark:text-gray-400' : '';
            const messageSideBorder = isSelf
              ? 'border-r pr-1 text-right'
              : 'border-l pl-1 text-left';
            return <li
              key={username + '-' + messages[0].id}
              className={`border-gray-300 dark:border-gray-700 ${isServer ? 'text-center' : messageSideBorder}`}
            >
              <p className={`inline-block px-1 pb-1 text-xs ${headerColor}`}>{capitalize(username)}</p>
              {messages.toReversed().map(({ text, id }) => <p
                key={id}
                className={`max-w-96 text-wrap px-1 ${messageColor}`}
              >
                {text}
              </p>)}
            </li>;
          })}
        </ul>
      </div>
      <form className="flex w-full gap-2 pb-2 pt-4">
        <input
          onChange={(e) => setMessage(e.target.value)}
          value={message}
          type="text"
          placeholder="Message"
          className="grow rounded-lg border border-gray-300 bg-gray-50 px-2 py-1 text-gray-900 focus:border-orange-600
                         focus:ring-orange-600 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white
                         dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        />
        <button
          disabled={message.length === 0}
          onClick={() => {
            client.send({ type: 'chat/message', payload: message });
            setMessage('');
          }}
          className="grow-0 rounded-lg bg-orange-600 px-3 text-center text-sm font-medium text-white hover:bg-orange-700 focus:outline-none
                       focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
        >
          Send
        </button>
      </form>
    </>}
  </div>;
}
