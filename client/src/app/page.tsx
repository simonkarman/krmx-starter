'use client';

import { Chat } from '@/components/chat';
import { ExampleBackgroundGraphic } from '@/components/example-background-graphic';
import { useCardGame, useClient } from '@/store/krmx';
import { capitalize } from 'board';
import { ExampleAlphabet } from '@/components/example-alphabet';

export default function Page() {
  const { status, username } = useClient();
  const view = useCardGame();
  if (status !== 'linked') {
    return null;
  }
  return <div className="m-2 sm:mx-4">
    <Chat/>
    <div className='space-y-0.5'>
      <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
      <p>This is the starter playground for Krmx.</p>
    </div>
    <ExampleBackgroundGraphic/>
    <ExampleAlphabet/>
    <h2>Card Game</h2>
    <pre>{JSON.stringify(view, null, 2)}</pre>
  </div>;
}
