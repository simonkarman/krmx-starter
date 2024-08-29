import { AxialCoordinate, Vector2 } from 'board';

export interface Line {
  fromAnchorId: number;
  toAnchorId: number;
}

const getCornerPosition = (cornerId: number) => Vector2.fromDegrees((cornerId - 2) * 60);
const getAnchorCorners = (anchorId: number): [Vector2, Vector2] => {
  const cornerIndexA = Math.floor(anchorId / 2);
  const cornerIndexB = cornerIndexA + 1;
  return [getCornerPosition(cornerIndexA), getCornerPosition(cornerIndexB % 6)];
};

const getAnchorPosition = (anchorId: number): Vector2 => {
  const corners = getAnchorCorners(anchorId);
  const diff = corners[1].subtract(corners[0]).multiply(0.33);
  return corners[0].add(diff.multiply(anchorId % 2 === 0 ? 1 : 2));
};
const getAnchorNormal = (anchorId: number): Vector2 => {
  const corners = getAnchorCorners(anchorId);
  const diff = corners[1].subtract(corners[0]);
  return new Vector2(diff.y, -diff.x).normalized();
};

const TileLine = (props: {
  tileSize: number, fromAnchorId: number, toAnchorId: number, strokeWidth: number, color: string, opacity: number
}) => {
  const from = getAnchorPosition(props.fromAnchorId).subtract(getAnchorNormal(props.fromAnchorId).multiply(0.0)).multiply(props.tileSize);
  const to = getAnchorPosition(props.toAnchorId).subtract(getAnchorNormal(props.toAnchorId).multiply(0.0)).multiply(props.tileSize);
  const distance = 0.25 + getAnchorPosition(props.fromAnchorId).distance(getAnchorPosition(props.toAnchorId)) * 0.15;
  const centerFrom = from.subtract(getAnchorNormal(props.fromAnchorId).multiply(props.tileSize * distance));
  const centerTo = to.subtract(getAnchorNormal(props.toAnchorId).multiply(props.tileSize * distance));
  return <>
    <path
      d={`M ${from.x} ${from.y} C ${centerFrom.x} ${centerFrom.y} ${centerTo.x} ${centerTo.y} ${to.x} ${to.y}`}
      stroke={props.color}
      strokeWidth={props.tileSize * props.strokeWidth}
      strokeOpacity={props.opacity}
      fill='transparent'
    />
  </>;
};

export const Tile = (props: {
  gridSize: number,
  tileSize: number,
  location: AxialCoordinate,
  lines: Line[],
  rotation: number | undefined,
}) => {
  const pixel = props.location.toPixel(props.gridSize);
  return (<g
    className='transition-transform duration-500'
    transform={`translate(${new Vector2(pixel.x, -pixel.y).toSvgString()}) rotate(${(props.rotation ?? 0) * 60})`}
  >
    <polygon
      points={
        [0, 1, 2, 3, 4, 5]
          .map(getCornerPosition)
          .map(corner => corner.multiply(props.tileSize))
          .map(corner => `${corner.x},${corner.y}`).join(' ')
      }
      fill={props.rotation !== undefined ? '#F7DC6F' : '#FCF3CF'}
      fillOpacity={0.8}
      stroke={'#FCF3CF'}
      strokeOpacity={1}
      strokeWidth={props.tileSize * 0.025}
    />
    {[...props.lines]
      .map(line => <g key={`${line.fromAnchorId}-${line.toAnchorId}`}>
        <TileLine
          tileSize={props.tileSize}
          fromAnchorId={line.fromAnchorId}
          toAnchorId={line.toAnchorId}
          color={'#F7DC6F'}
          opacity={0.5}
          strokeWidth={0.21}
        />
        <TileLine
          tileSize={props.tileSize}
          fromAnchorId={line.fromAnchorId}
          toAnchorId={line.toAnchorId}
          color={'white'}
          opacity={1}
          strokeWidth={0.13}
        />
      </g>)}
  </g>);
};
