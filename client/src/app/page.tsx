'use client';

import { Chat } from '@/components/chat';
import { ExampleBackgroundGraphic } from '@/components/example-background-graphic';
import { useClient } from '@/store/krmx';
import { capitalize, exampleAlphabet } from 'board';
import { sendExampleEvent, useExampleEventSource } from '@/store/use/event-source';

export default function Page() {
  const { status, username } = useClient();
  const example = useExampleEventSource();
  if (status !== 'linked') {
    return null;
  }
  return <div className="m-2 space-y-2 sm:mx-4">
    <Chat/>
    <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
    <p onClick={() => sendExampleEvent(exampleAlphabet())}>There is nothing here yet...{example.nested.counter} {example.other}</p>
    <ExampleBackgroundGraphic />
  </div>;
}
