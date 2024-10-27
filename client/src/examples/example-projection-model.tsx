import { client, dispatchCardGameEvent, useCardGame, useClient } from '@/store/krmx';
import { capitalize, enumerate, Vector2 } from '@krmx/state';
import { drawCard, playCard, Rank, Suit } from 'board';
import { motion } from 'framer-motion';
import { useState } from 'react';

const cardSize = new Vector2(40, 56);

const CardBack = (props: { x: number, y: number, onClick?: () => void }) => {
  const locationX = props.x - cardSize.x / 2;
  const locationY = props.y - cardSize.y / 2;
  return <g transform={`translate(${locationX} ${locationY})`}>
    <rect
      x={0}
      y={0}
      width={cardSize.x - 1}
      height={cardSize.y - 1}
      className={`${props.onClick
        ? 'cursor-pointer hover:stroke-indigo-800 hover:shadow hover:dark:stroke-indigo-300'
        : ''
      } fill-indigo-600 stroke-indigo-400 dark:fill-indigo-700 dark:stroke-indigo-500`}
      strokeWidth={2}
      rx={3} ry={3}
      onClick={props.onClick}
    />
  </g>;
};

const CardFront = (props: { x: number, y: number, suit: Suit, rank: Rank, className?: string, rotation?: number, onClick?: () => void }) => {
  const isRed = props.suit === '♦' || props.suit === '♥';
  return <g transform={`translate(${props.x} ${props.y}) rotate(${props.rotation ?? 0}) translate(${- cardSize.x / 2} ${(- cardSize.y / 2)})`}>
    <rect
      x={0}
      y={0}
      width={cardSize.x}
      height={cardSize.y}
      className={`${props.onClick
        ? 'cursor-pointer hover:fill-gray-100 hover:stroke-black hover:shadow hover:dark:fill-gray-700 hover:dark:stroke-white'
        : ''
      } fill-white stroke-gray-300 dark:fill-slate-800 dark:stroke-gray-600`}
      strokeWidth={1}
      style={{ pointerEvents: 'all' }}
      rx={3} ry={3}
      onClick={props.onClick}
    />
    <text
      x={cardSize.x / 2}
      y={cardSize.y / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      className={`${isRed ? 'fill-red-600 dark:fill-pink-500' : 'fill-gray-800 dark:fill-slate-200'} pointer-events-none`}
    >
      {props.suit}
      {props.rank}
    </text>
  </g>;
};

export function ExampleProjectionModel() {
  const { username: self, users } = useClient();
  const [cardCount, setCardCount] = useState(3);
  const [showProjection, setShowProjection] = useState(false);
  const projection = useCardGame();
  const svgSize = { x: 400, y: 300 };
  const projectionAsText = JSON.stringify(projection, null, 2).split('\n');
  const columns = 3;
  const myTurn = projection.turn !== false && projection.order.length > 1 && projection.order[projection.turn] === self;

  return <>
    <div className="flex items-end justify-between border-b border-gray-100 pb-1 dark:border-gray-800">
      <h2 className="font-bold">Card Game</h2>
      <div className="mb-1 flex items-center gap-3">
        <button
          className="rounded bg-gray-200 px-2 py-0.5 text-sm font-bold text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200
                     dark:hover:bg-slate-600"
          onClick={() => setShowProjection(!showProjection)}
        >
          {showProjection ? 'Hide' : 'Show'} Projection JSON
        </button>
        <button
          className="rounded bg-blue-500 px-2 py-0.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={users.filter(u => u.isLinked).length < 2}
          onClick={() => {
            client.send({
              type: 'chat/message', payload: `/cards ${users.filter(u => u.isLinked).map(u => u.username).join(' ')} ${cardCount}`,
            });
            setCardCount(c => {
              if (c === 10) {
                return 3;
              }
              return c + 1;
            });
          }}
        >
          (Re-)Start with {cardCount} cards
        </button>
      </div>
    </div>
    {showProjection && <>
      <div
        className={'my-2 overflow-auto flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-3 ' +
          'dark:border-slate-950 dark:bg-slate-800'}
      >
        {Array.from({ length: columns }).map((_, i) => {
          const startColumn = Math.floor(i * projectionAsText.length / columns);
          const endColumn = Math.floor((i + 1) * projectionAsText.length / columns);
          return <pre className={`${i === 0 ? '' : 'border-l'} border-slate-200 pl-2 text-xs dark:border-slate-700`} key={i}>
            {projectionAsText.slice(startColumn, endColumn).join('\n')}
          </pre>;
        })}
      </div>
    </>}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      className="text-xs text-gray-600 dark:text-gray-300"
    >
      <p>
        This is a simple card game. The goal is to get rid of all your cards. You can play a card if it matches the suit or rank of the top card on
        the pile.
        If you can&#39;t play a card, you have to draw one. The game ends when a player has no cards left.
      </p>
      <p>
        You can play a card by clicking on it. If it&#39;s your turn, you can also draw a card by clicking on the deck.
      </p>
    </motion.div>
    <svg
      className="mb-5 mt-2 max-h-[75vh] w-full select-none rounded-xl border-slate-200 dark:border-slate-700"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`${-svgSize.x / 2} ${-svgSize.y / 2} ${svgSize.x} ${svgSize.y}`}
    >
      {projection.finishers.length > 0 && <>
        <text x={0} y={-cardSize.y} textAnchor="middle" dominantBaseline="middle" className="fill-current text-lg font-bold">
          {capitalize(projection.finishers[0])} has won!
          {projection.finishers.length > 2 && ` Also, ${enumerate(projection.finishers.slice(1, -1))} finished!`}
        </text>
      </>}
      {projection.order.map((username, i) => {
        const numberOfCards = projection.hands.find(h => h.username === username)!.handSize;
        return <g
          key={username}
          transform={`translate(${(i - (projection.order.length - 1) / 2) * cardSize.x * 1.5}, ${-svgSize.y / 2 + cardSize.y / 2}) scale(0.7)`}
        >
          {Array.from({ length: numberOfCards }).map((_, j) => {
            return <CardBack key={j} x={(j - (numberOfCards - 1) / 2) * 3} y={j * 3}/>;
          })}
          <text
            y={cardSize.y * 0.75 + numberOfCards * 3}
            className={`${projection.turn === i ? 'fill-amber-600 font-bold' : 'fill-current'} text-xs`}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {username === self ? 'you' : username} ({numberOfCards})
          </text>
        </g>;
      })}
      {projection.deckSize > 1 && <CardBack x={-cardSize.x} y={0}/>}
      <CardBack
        x={-cardSize.x + 3}
        y={3}
        onClick={myTurn ? () => dispatchCardGameEvent(drawCard()) : undefined}
      />
      <text
        x={-cardSize.x + 3}
        y={4}
        className={'pointer-events-none fill-gray-200 text-xs'}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {projection.deckSize}x
      </text>
      {projection.pile.length > 0 &&
        <CardFront
          x={cardSize.x - 3}
          y={0}
          suit={projection.pile[projection.pile.length - 1].suit}
          rank={projection.pile[projection.pile.length - 1].rank}
        />
      }
      {projection.order.length > 0 && projection.hand.map((card, i) => {
        const gap = 7 - projection.hand.length;
        const x = (i * (cardSize.x + gap)) - ((projection.hand.length - 1) / 2 * (cardSize.x + gap));
        const rotation = (i - (projection.hand.length - 1) / 2) * 7;
        const yOffset = -Math.cos(Math.abs(rotation) / (12 + projection.hand.length * 0.5)) * projection.hand.length * 3;
        return <CardFront
          key={card.id}
          x={x}
          y={svgSize.y / 2 - cardSize.y / 2 - 5 + yOffset}
          suit={card.suit}
          rank={card.rank}
          rotation={rotation}
          onClick={myTurn ? () => dispatchCardGameEvent(playCard(card.id)) : undefined}
        />;
      })}
      {projection.finishers.includes(self!) && <text
        x={0}
        y={svgSize.y / 2 - cardSize.y / 2 - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-current text-lg font-bold"
      >
        Well done!
      </text>}
    </svg>
  </>;
}
