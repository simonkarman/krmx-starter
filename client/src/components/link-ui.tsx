'use client';

import { FullScreenWrapper } from '@/components/full-screen-wrapper';
import { client, useClient } from '@/store/krmx';
import { capitalize } from 'board';
import { useEffect, useState } from 'react';

export function LinkUI() {
  const { status } = useClient();

  // Keep track of link failures
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    setFailure(null);
  }, [status]);

  // Keep track of username input
  const [linkUsername, setLinkUsername] = useState<string>('');

  // Only render this component if the client is connected and ready to link
  if (status !== 'connected') {
    return null;
  }

  return (
    <FullScreenWrapper>
      <div className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white">
        <img className="mr-3 h-8 w-8" src="/apple-touch-icon.png" alt="logo"/>
        Krmx Starter
      </div>
      <div className="w-full rounded-lg bg-white shadow dark:border dark:border-slate-700 dark:bg-slate-800 sm:max-w-md md:mt-0">
        <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
            Join the server
          </h1>
          <form className="space-y-4 md:space-y-6" onSubmit={(e) => {
            client.link(linkUsername.toLowerCase().trim())
              .catch((e: Error) => setFailure(e.message));
            e.preventDefault();
          }}>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Your name
              </label>
              <input
                type="username" name="username" id="username"
                placeholder="username" required
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-gray-900 focus:border-orange-600
                         focus:ring-orange-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-gray-400
                         dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-sm"
                value={linkUsername}
                onChange={(event) => {
                  setLinkUsername(event.target.value);
                }}
              />
              <div className="w-full pt-1 text-right text-sm text-gray-300 dark:text-gray-600">you can only use a-z, A-Z and 0-9</div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700 focus:outline-none
                       focus:ring-4 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800">
              Join
            </button>
          </form>
          {failure && <p className="text-sm tracking-tight text-gray-700 dark:text-gray-300">
            Rejected:{' '}
            <span className="text-base font-bold tracking-normal text-red-600 dark:text-red-400">
              {capitalize(failure)}.
            </span>
          </p>}
        </div>
      </div>
    </FullScreenWrapper>
  );
}
