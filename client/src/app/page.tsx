'use client';

import { Chat } from '@/components/chat';
import { client, useClient, useGrid } from '@/utils/krmx';
import { capitalize } from '@/utils/text';
import { useEffect, useState } from 'react';

const moves = [
  { direction: 'up', emoji: '⬆️' },
  { direction: 'down', emoji: '⬇️' },
  { direction: 'left', emoji: '⬅️' },
  { direction: 'right', emoji: '➡️' },
  { direction: 'none', emoji: '🛑' },
];

const emptyEmoijs = ['🌱', '🌿', '🍃', '🌾', '🌵', '🌴', '🌳', '🌲'];

const ProgressBar = () => {
  const { gameLoopInterval, expectedNextGameLoop } = useGrid();
  const zeroOffset = 10;
  const percentage = Math.max(0, (expectedNextGameLoop - Date.now()) / gameLoopInterval * 100 - zeroOffset) / (100 - zeroOffset) * 100;
  const [ , rerender] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(() => {
      rerender((i: number) => i + 1);
    }, 100);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
    <div className="h-2.5 rounded-full bg-blue-600" style={{
      'width': `${percentage.toFixed()}%`,
      'transition': 'linear',
      'transitionDuration': percentage > 99 ? '0ms' : '150ms',
    }}/>
  </div>;
};

export default function MyApp() {
  const { status, username } = useClient();
  const { width, height, cells, currentMove } = useGrid();
  if (status !== 'linked') {
    return null;
  }

  const cellsPerRow = cells.reduce<{ content: string }[][]>((acc, next) => {
    if (acc[acc.length - 1].length === width) {
      acc.push([]);
    }
    acc[acc.length - 1].push(next);
    return acc;
  }, [[]]);

  return <div className="m-4">
    <Chat/>
    <div className='mx-auto max-w-md space-y-4'>
      <h1 className="text-lg font-bold">Welcome, {capitalize(username!)}!</h1>
      <div className='flex flex-col gap-2'>
        {cellsPerRow.map((row, y) => <div key={y} className='flex items-center justify-between gap-2'>
          {row.map((cell, x) => {
            const { content } = cell;
            return <div
              key={x}
              className={'flex w-1/5 grow aspect-square items-center justify-center rounded-lg border border-gray-200 bg-gray-100 p-4 text-center ' +
                'dark:border-gray-600 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'}
            >
              {content === 'empty'
                ? emptyEmoijs[(y * width + x) % emptyEmoijs.length]
                : content.startsWith('player:') ? content.substring('player:'.length).substring(0, 3) : content}
            </div>;
          })}
        </div>)}
      </div>
      {width === 0 && height === 0
        ? <p>Loading...</p>
        : <p className='w-full text-right text-xs'>Grid size: {width}x{height}</p>
      }
      <ProgressBar/>
      <div className='flex justify-between gap-4'>
        {moves.map(({ direction, emoji }) => <button
          onClick={() => client.send({ type: 'ao/move', payload: direction })}
          key={direction}
          className={`rounded-full border-4 bg-gray-100 px-2 py-1.5 text-4xl transition-transform dark:bg-gray-800 ${currentMove === direction
            ? 'border-blue-500 dark:border-blue-500'
            : 'border-gray-100 dark:border-gray-800'
          }`}
        >
          {emoji}
        </button>)}
      </div>
    </div>
  </div>;
}
