'use client';

import { Chat } from '@/components/chat';
import { useClient } from '@/utils/krmx';
import { capitalize } from 'board';

export default function MyApp() {
  const { status, username } = useClient();
  if (status !== 'linked') {
    return null;
  }

  return <div className="m-4">
    <Chat/>
    <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
    <p>There is nothing here yet...</p>
  </div>;
}
