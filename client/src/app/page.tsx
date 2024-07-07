'use client';

import { Chat } from '@/components/chat';
import { useClient } from '@/utils/krmx';

export default function MyApp() {
  const { username, users } = useClient();
  return <>
    {<h1>Welcome, {username}!</h1>}
    {JSON.stringify(users)}
    {/*<Chat />*/}
  </>;
}
