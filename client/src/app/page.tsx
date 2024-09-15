'use client';

import { Chat } from '@/components/chat';
import { Line, Tile } from '@/components/tile';
import { client, useClient } from '@/store/krmx';
import { Message } from '@krmx/base';
import { AxialCoordinate, capitalize, Vector2 } from 'board';
import { useEffect, useState } from 'react';
import { Random } from 'board';

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

const getLines = (index: number): Line[] => {
  const r = new Random((index + 2).toString());
  const anchors = r.asShuffledArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const lines = [];
  r.next(); // skip one
  const count = Math.floor(r.next() * 3) + 1;
  for (let i = 0; i < count; i++) {
    lines.push({ fromAnchorId: anchors[i], toAnchorId: anchors[i + 6] });
  }
  return lines;
};

export default function Page() {
  const { status, username } = useClient();
  const [rotation, setRotation] = useSyncedState('rotation', 0);
  if (status !== 'linked') {
    return null;
  }

  const svgSize = new Vector2(310, 310);
  return <div className="m-2 space-y-2 sm:mx-4">
    <Chat/>
    <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
    <p>There is nothing here yet...</p>
    <svg
      className='max-h-[75vh] w-full cursor-pointer rounded-xl'
      preserveAspectRatio='xMidYMid meet'
      viewBox={`${-svgSize.x / 2} ${-svgSize.y / 2} ${svgSize.x} ${svgSize.y}`}
      onClick={(e) => {
        setRotation((r: number) => r + 1);
        e.stopPropagation();
      }}
    >
      <g transform={`rotate(${rotation})`} className={'transition-transform duration-700'}>
        {AxialCoordinate.circle(AxialCoordinate.Zero, 2).map((coordinate, i) => <Tile
          key={i}
          tileSize={45}
          gridSize={55}
          location={coordinate}
          rotation={(rotation ?? 0) * 6}
          lines={getLines(i)}
          className={'fill-indigo-500 stroke-indigo-600 dark:fill-indigo-600 dark:stroke-indigo-700'}
        />)}
      </g>
    </svg>
  </div>;
}
