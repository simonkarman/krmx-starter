import { z } from 'zod';
import { ProjectionModel } from '@krmx/state';

export type Environment = 'plains' | 'forest' | 'desert' | 'mountain' | 'water';

interface Tile {
  id: string,
  position: {
    q: number,
    r: number,
  },
  environment: Environment,
}

export const hexagonWorldModel = new ProjectionModel(
  { tiles: [
    { id: '0', position: { q: 0, r: 0 }, environment: 'plains' },
    { id: '1', position: { q: 1, r: 0 }, environment: 'forest' },
    { id: '2', position: { q: 0, r: 1 }, environment: 'desert' },
    { id: '3', position: { q: 1, r: 1 }, environment: 'mountain' },
    { id: '4', position: { q: 0, r: 2 }, environment: 'water' },
  ] as Tile[] },
  state => state,
);

const movePayloadSchema = z.object({ tileId: z.string().min(1), position: z.object({ q: z.number().int(), r: z.number().int() }) });
export const move = hexagonWorldModel.when('move', movePayloadSchema, (state, _, payload) => {
  // Ensure a tile with this id exists
  const tileIndex = state.tiles.findIndex(tile => tile.id === payload.tileId);
  if (tileIndex === -1) {
    return;
  }

  // Ensure the target tile is empty
  const current = state.tiles.findIndex(
    tile => tile.id !== payload.tileId && tile.position.q === payload.position.q && tile.position.r === payload.position.r,
  );
  if (current !== -1) {
    return;
  }

  // Move the tile
  state.tiles[tileIndex].position = payload.position;
}, (projection, _, payload) => {
  // Ensure a tile with this id exists
  const tileIndex = projection.tiles.findIndex(tile => tile.id === payload.tileId);
  if (tileIndex === -1) {
    return;
  }

  // Move the tile
  projection.tiles[tileIndex].position = payload.position;
});
