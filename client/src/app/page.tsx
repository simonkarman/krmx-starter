'use client';

import { useClient } from '@/utils/krmx';
import { capitalize } from '@/utils/text';

export default function MyApp() {
  const { status, username } = useClient();
  if (status !== 'linked') {
    return null;
  }

  return <div className='m-4'>
    <h1 className='font-bold text-lg'>Welcome, {capitalize(username!)}!</h1>
  </div>;
}
