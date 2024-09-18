import { approximatelyEqual, AxialCoordinate, Random, Vector2 } from 'board';
import { useSyncedValue } from '@/store/use/synced-value';

interface Line {
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
      className={`transition-colors duration-300 ${props.color}`}
      strokeWidth={props.tileSize * props.strokeWidth}
      strokeOpacity={props.opacity}
      fill='transparent'
    />
  </>;
};

const Tile = (props: {
  gridSize: number,
  tileSize: number,
  location: AxialCoordinate,
  lines: Line[],
  rotation: number | undefined,
  className?: string,
}) => {
  const pixel = props.location.toPixel(props.gridSize);
  const isAligned = approximatelyEqual((props.rotation ?? 0) % 60, 0);
  return (<g
    className='transition-transform duration-500'
    transform={`translate(${new Vector2(pixel.x, -pixel.y).toSvgString()}) rotate(${props.rotation ?? 0})`}
  >
    <polygon
      points={
        [0, 1, 2, 3, 4, 5]
          .map(getCornerPosition)
          .map(corner => corner.multiply(props.tileSize))
          .map(corner => `${corner.x},${corner.y}`).join(' ')
      }
      className={props.className}
      strokeWidth={props.tileSize * 0.05}
    />
    {[...props.lines]
      .map(line => <g key={`${line.fromAnchorId}-${line.toAnchorId}`}>
        <TileLine
          tileSize={props.tileSize}
          fromAnchorId={line.fromAnchorId}
          toAnchorId={line.toAnchorId}
          color={'stroke-indigo-600 dark:stroke-indigo-700'}
          opacity={1}
          strokeWidth={0.21}
        />
        <TileLine
          tileSize={props.tileSize}
          fromAnchorId={line.fromAnchorId}
          toAnchorId={line.toAnchorId}
          color={`${isAligned
            ? 'stroke-white'
            : 'stroke-indigo-300 dark:stroke-indigo-400'
          } hover:stroke-indigo-600 dark:hover:stroke-indigo-700`}
          opacity={1}
          strokeWidth={0.13}
        />
      </g>)}
  </g>);
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

export const ExampleBackgroundGraphic = () => {
  // TODO: resolve that the default value show not show up on first render if a rotation is set
  const [rotation, setRotation] = useSyncedValue<number>('rotation', 0);
  const svgSize = new Vector2(310, 310);
  return <svg
    className='max-h-[75vh] w-full cursor-pointer rounded-xl'
    preserveAspectRatio='xMidYMid meet'
    viewBox={`${-svgSize.x / 2} ${-svgSize.y / 2} ${svgSize.x} ${svgSize.y}`}
    onClick={(e) => {
      setRotation((r) => r + 1);
      e.stopPropagation();
      e.preventDefault();
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
    <text
      x={0}
      y={0}
      textAnchor='middle'
      dominantBaseline='middle'
      className='fill-slate-50 stroke-indigo-800 font-mono text-8xl font-bold dark:fill-current dark:stroke-indigo-900'
      strokeWidth={2}
    >
      {rotation}
    </text>
  </svg>;
};
