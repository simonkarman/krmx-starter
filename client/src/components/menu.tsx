'use client';

import { client, useClient } from '@/utils/krmx';
import { useEffect, useRef, useState } from 'react';

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

export function Menu(props: { showOthers?: boolean }) {
  const { status, username, users } = useClient();
  const [showLeave, setShowLeave] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowLeave(false);
  }, [status]);

  // Only render this component if the client is linked and ready to interact
  if (status !== 'linked') {
    return null;
  }

  return <div className='flex items-center gap-3 border-b border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-800'>
    <p className='border-r border-gray-200 px-3 py-0.5 dark:border-gray-700'>
      <strong><span className='text-sm'>👤</span> {capitalize(username!)}</strong>
    </p>
    <ul className='flex grow gap-3 text-sm text-gray-900 dark:text-gray-100'>
      {props.showOthers !== false && users.filter((user) => username !== user.username).map(({ username, isLinked }) => <li
        key={username}
        className={isLinked ? '' : 'text-gray-400 dark:text-gray-600'}
      >
        <span className='text-xs'>{isLinked ? '👤' : '🚫'}</span> {capitalize(username)}
      </li>)}
    </ul>
    {!showLeave &&
      <button
        className='pr-2'
        onClick={() => setShowLeave(true)}
      >
        ⏻
      </button>
    }
    {showLeave && <div
      ref={backgroundRef}
      className='absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.6)] dark:bg-[rgba(0,0,0,0.4)]'
      onClick={(e) => {
        if (e.target === backgroundRef.current) {
          setShowLeave(false);
        }
      }}
    >
      <div
        className='max-w-sm space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow
                   dark:border-gray-700 dark:bg-gray-800'
      >
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
          Leaving?
        </h2>
        <p className="text-gray-800 dark:text-gray-200">
          Are you sure you want to leave the server? All your progress will be lost.
        </p>
        <div className='flex gap-2'>
          <button
            className='grow rounded bg-green-600 px-3 py-1 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none
                       focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
            onClick={() => setShowLeave(false)}
          >
            Stay
          </button>
          <button
            className='grow rounded bg-red-600 px-3 py-1 text-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none
                       focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800'
            onClick={() => client.leave()}
          >
            Leave
          </button>
        </div>
      </div>
    </div>}
  </div>;
}
