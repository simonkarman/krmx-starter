/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { PatchedState, Root } from './use';
import { Random } from './math';
import { z } from 'zod';

export const suits = ['♠', '♣', '♥', '♦'] as const;
export const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Suit = typeof suits[number];
export type Rank = typeof ranks[number];
type Card = { id: string, suit: Suit, rank: Rank };

export const cardGamePatchedState = new PatchedState(
  {
    r: new Random(''),
    finishers: [] as string[],
    order: [] as string[],
    turn: 0,
    deck: [] as Card[],
    pile: [] as Card[],
    hands: {} as { [username: string]: Card[] },
  },
  (state, username) => ({
    finishers: state.finishers,
    order: state.order,
    turn: state.turn as false | number,
    deckSize: state.deck.length,
    pile: state.pile,
    hands: Object.entries(state.hands).map(([username, hand]) => ({ username, handSize: hand.length })),
    hand: state.hands[username] || [],
  }),
);

const startGamePayload = z.object({
  seed: z.string().min(3),
  players: z.array(z.string()).min(2),
  handSize: z.number().min(3).max(10),
});
export const startCardGame = cardGamePatchedState.when('start', startGamePayload, (state, dispatcher, payload) => {
  if (dispatcher !== Root) {
    throw new Error('only the server can start the game');
  }

  // Set the random seed and shuffle the order of the players
  state.r = new Random(payload.seed);
  state.finishers = [];
  state.order = state.r.asShuffledArray(payload.players);
  state.turn = 0;

  // Create a deck with enough cards. For each player we need at least their starting hand and 5 extra cards in the deck and one card in the pile.
  const numberOfCardsRequired = payload.players.length * (payload.handSize + 5) + 1;
  const numberOfDecks = Math.ceil(numberOfCardsRequired / 52);
  const randomCardId = () => 'c' + state.r.string(12);
  state.deck = state.r.asShuffledArray(
    Array.from({ length: numberOfDecks },
      () => suits.flatMap(suit => ranks.map(rank => ({ id: randomCardId(), suit, rank }))),
    ).flatMap(x => x),
  );
  state.pile = [state.deck.pop()!];

  // Deal the starting hands
  const draw = (amount: number) => Array.from({ length: amount }, () => state.deck.pop()!);
  state.hands = payload.players.reduce((hands, username) => ({ ...hands, [username]: draw(payload.handSize) }), {});
});

export const drawCard = cardGamePatchedState.when('draw', z.undefined(), (state, dispatcher) => {
  // Check if it is the dispatcher's turn
  if (!state.order.includes(dispatcher) || dispatcher !== state.order[state.turn]) {
    throw new Error('it is not your turn');
  }

  // Check if the deck is empty and shuffle the pile if needed
  if (state.deck.length === 0) {
    if (state.pile.length < 2) {
      // TODO: handle this case better
      throw new Error('the deck is empty and the pile has no cards to shuffle');
    }
    const oldPile = state.pile;
    state.pile = [oldPile.pop()!];
    state.deck = state.r.asShuffledArray(oldPile);
  }

  // Draw a card
  state.hands[dispatcher].push(state.deck.pop()!);

  // End the turn
  state.turn = (state.turn + 1) % state.order.length;
}, (view) => {
  view.turn = false;
  view.deckSize -= 1;
  view.hand.push({ id: `c?${view.hand.length}`, suit: '?', rank: '?' } as unknown as Card);
});

export const playCard = cardGamePatchedState.when('play', z.string().startsWith('c').length(13), (state, dispatcher, cardId) => {
  // Check if it is the dispatcher's turn
  if (!state.order.includes(dispatcher) || dispatcher !== state.order[state.turn]) {
    throw new Error('it is not your turn');
  }

  // Check if the card is in the hand
  const hand = state.hands[dispatcher];
  const cardIndex = hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    throw new Error('the card is not in your hand');
  }

  // Check if the card can be played
  const topCard = state.pile[state.pile.length - 1];
  if (topCard.suit !== hand[cardIndex].suit && topCard.rank !== hand[cardIndex].rank) {
    throw new Error('the card cannot be played');
  }

  // Play the card
  const card = hand.splice(cardIndex, 1)[0];
  state.pile.push(card);

  // Check if the player has finished
  if (hand.length === 0) {
    // remove the player from the order
    const playerIndex = state.order.indexOf(dispatcher);
    state.order.splice(playerIndex, 1);

    // add the player to the finishers
    state.finishers.push(dispatcher);

    // check if the game is over
    if (state.order.length === 1) {
      // add the last player to the finishers and end the game
      state.finishers.push(state.order[0]);
      state.order = [];
      state.turn = 0;
    } else {
      // if the game is not over...

      // then update the turn if needed due to the player being removed from the order
      if (state.turn >= playerIndex) {
        state.turn = (state.turn - 1 + state.order.length) % state.order.length;
      }

      // and move to the next player
      state.turn = (state.turn + 1) % state.order.length;
    }
  } else {
    // simply move to the next player
    state.turn = (state.turn + 1) % state.order.length;
  }
}, (view) => {
  view.turn = false;
});
