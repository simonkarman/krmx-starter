'use client';

import { client, useClient } from '@/store/krmx';
import { capitalize } from '@krmx/state';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { AnimatedBackground } from '@/components/animated-background';

const PowerSvg = () => <svg className="fill-gray-700 dark:fill-gray-200" width="13" height="13" viewBox="0 0 556.568 556.568">
  <path d="M210.37 133.725V43.434c0-2.264.116-4.501.333-6.708C97.48 66.592 13.985 169.665 13.985 292.27c0 145.969 118.33 264.299 264.298 264.299
           145.967 0 264.299-118.33 264.299-264.299 0-122.605-83.496-225.678-196.719-255.543.217 2.207.334 4.443.334 6.708v90.292c61.441 26.42 104.58
           87.531 104.58 158.542 0 95.113-77.381 172.498-172.498 172.498-95.114 0-172.499-77.383-172.499-172.498.005-71.013 43.148-132.121
           104.59-158.544z"
  />
  <path d="M321.718 267.083V43.434c0-4.226-.635-8.299-1.76-12.164C314.694 13.21 298.048 0 278.284 0c-19.765 0-36.411 13.21-41.674 31.27a43.378 43.378
           0 0 0-1.759 12.164v223.653c0 23.988 19.443 43.434 43.434 43.434 23.989-.005 43.433-19.451 43.433-43.438z"
  />
</svg>;

export function Menu(props: { showOthers?: boolean }) {
  const { status, username, users } = useClient();
  const [showLeave, setShowLeave] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Reset the leave dialog when the status of the Krmx client changes
  useEffect(() => {
    setShowLeave(false);
  }, [status]);

  // Don't allow scrolling when the leave dialog is open
  useEffect(() => {
    document.body.style.overflow = showLeave ? 'hidden' : 'unset';
  }, [showLeave]);

  // Only render this component if the client is linked and ready to interact
  if (status !== 'linked') {
    return null;
  }

  return <header
    className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
  >
    <p className="border-r border-slate-200 px-3 py-0.5 dark:border-slate-700">
      <strong><span className="text-sm">👤</span> {capitalize(username!)}</strong>
    </p>
    <ul className="flex grow gap-3 text-sm text-gray-900 dark:text-gray-100">
      {props.showOthers !== false && users.filter((user) => username !== user.username).map(({ username, isLinked }) => <li
        key={username}
        className={isLinked ? '' : 'text-gray-400 dark:text-gray-600'}
      >
        <span className="text-xs">{isLinked ? '👤' : '🚫'}</span> {capitalize(username)}
      </li>)}
    </ul>
    <ThemeToggle/>
    <button
      className="pr-2"
      onClick={() => setShowLeave(true)}
    >
      <PowerSvg/>
    </button>
    {showLeave && <div
      ref={backgroundRef}
      className="fixed inset-0 z-10 flex items-center justify-center bg-[rgba(0,0,0,0.6)] px-2"
      onClick={(e) => {
        if (e.target === backgroundRef.current) {
          setShowLeave(false);
        }
      }}
    >
      <div
        className="max-w-sm space-y-4 rounded-lg border border-slate-300 bg-white p-4 shadow
                   dark:border-slate-700 dark:bg-slate-800"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Leaving?
        </h2>
        <p className="text-gray-800 dark:text-gray-200">
          Are you sure you want to leave the server? All your progress will be lost.
        </p>
        <div className="flex gap-2">
          <button
            className="grow rounded bg-green-600 px-3 py-1 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none
                       focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            onClick={() => setShowLeave(false)}
          >
            Stay
          </button>
          <button
            className="grow rounded bg-red-600 px-3 py-1 text-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none
                       focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
            onClick={() => client.leave()}
          >
            Leave
          </button>
        </div>
      </div>
    </div>}
  </header>;
}
