'use client';

import { Chat } from '@/components/chat';
import { Line, Tile } from '@/components/tile';
import { useClient } from '@/store/krmx';
import { AxialCoordinate, capitalize, Vector2 } from 'board';
import { Random } from 'board';
import { useSyncedValue } from '@/store/use/synced-value';

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
  const [rotation, setRotation] = useSyncedValue<number>('rotation', 0);
  if (status !== 'linked') {
    return null;
  }

  const svgSize = new Vector2(310, 310);
  return <div className="m-2 space-y-2 sm:mx-4">
    <Chat/>
    <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
    <p>There is nothing here yet... {rotation}</p>
    <svg
      className='max-h-[75vh] w-full cursor-pointer rounded-xl'
      preserveAspectRatio='xMidYMid meet'
      viewBox={`${-svgSize.x / 2} ${-svgSize.y / 2} ${svgSize.x} ${svgSize.y}`}
      onClick={(e) => {
        setRotation((r) => r + 1);
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
