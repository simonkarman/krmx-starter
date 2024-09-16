export * from './AxialCoordinate';
export * from './CubeCoordinate';
export * from './HexDirection';
export * from './Random';
export * from './Vector2';

export function approximatelyEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}
