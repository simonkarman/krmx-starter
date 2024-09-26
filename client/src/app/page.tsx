'use client';

import { Chat } from '@/components/chat';
import { ExampleBackgroundGraphic } from '@/components/example-background-graphic';
import { useClient } from '@/store/krmx';
import { capitalize } from 'board';
import { ExampleAlphabet } from '@/components/example-alphabet';
import { ExampleCardGame } from '@/components/example-card-game';
import { useState } from 'react';

export default function Page() {
  const { status, username } = useClient();
  const [tabIndex, setTabIndex] = useState(0);

  if (status !== 'linked') {
    return null;
  }
  const tabs = [
    { component: <ExampleBackgroundGraphic />, title: 'Synced Value' },
    { component: <ExampleAlphabet />, title: 'Event Source' },
    { component: <ExampleCardGame />, title: 'Patched State' },
  ];

  return <div className="px-2 pb-16 pt-10 md:mx-4">
    <Chat/>
    <div className="space-y-0.5">
      <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
      <p>This is the starter playground for Krmx.</p>
    </div>
    <div className="mb-6 mt-2 flex gap-3">
      {tabs.map((tab, i) => <button
        key={i}
        onClick={() => setTabIndex(i)}
        className={`rounded border px-2 py-1 text-sm ${i === tabIndex
          ? 'border-slate-500 bg-gray-200 hover:bg-gray-300 dark:border-slate-500 dark:bg-slate-700 hover:dark:bg-slate-600'
          : 'border-slate-300 bg-gray-100 hover:bg-gray-200 dark:border-slate-700 dark:bg-slate-800 hover:dark:bg-slate-700'
        }`}
      >
        {tab.title}
      </button>,
      )}
    </div>
    {tabs[tabIndex].component}
  </div>;
}
