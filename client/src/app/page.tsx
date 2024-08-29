'use client';

import { Chat } from '@/components/chat';
import { Tile } from '@/components/tile';
import { client, useClient } from '@/store/krmx';
import { Message } from '@krmx/base';
import { AxialCoordinate, capitalize, Vector2 } from 'board';
import { useEffect, useState } from 'react';

const useSyncedState = <T, >(key: string, defaultValue: T): [T, ((v: (T) | ((v: T) => T)) => void)] => {
  type SyncedStateMessage<T> = { type: 'sync/state', payload: { key: string, set: T } };
  const type = 'sync/state';
  const { status } = useClient();
  const [state, setState] = useState(defaultValue);
  useEffect(() => {
    const listener = (message: SyncedStateMessage<T>) => {
      // TODO: validate payload
      if (message.type === type && message.payload.key === key) {
        setState(message.payload.set as T);
      }
    };
    return client.on('message', listener as (message: Message) => void);
  }, [key]);
  useEffect(() => {
    if (status === 'linked') {
      client.send({ type, payload: { key, 'get': state } });
    }
  }, [key, status]);
  const setStateWrapper = (value: T | ((old: T) => T)) => {
    if (status !== 'linked') {
      return;
    }
    client.send<SyncedStateMessage<T>>({
      type,
      payload: {
        key,
        set: typeof value === 'function' ? (value as (v: T) => T)(state) : value,
      },
    });
  };
  return [state, setStateWrapper];
};

export default function Page() {
  const { status, username } = useClient();
  const [rotation, setRotation] = useSyncedState('rotation', 0);
  if (status !== 'linked') {
    return null;
  }

  const svgSize = new Vector2(200, 200);
  return <div className="m-4">
    <Chat/>
    <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
    <p>There is nothing here yet...</p>
    <p>Rotation {rotation}</p>
    <svg
      className='mb-1 max-h-[75vh] w-full'
      preserveAspectRatio='xMidYMid meet'
      viewBox={`${-svgSize.x / 2} ${-svgSize.y / 2} ${svgSize.x} ${svgSize.y}`}
      onClick={() => setRotation((r: number) => r + 1)}
    >
      <Tile
        tileSize={50}
        gridSize={52}
        location={new AxialCoordinate(0, 0)}
        rotation={rotation * 0.2}
        lines={[]}
      />
    </svg>
  </div>;
}
