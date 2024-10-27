import { PropsWithChildren, SVGProps, useState } from 'react';
import { AxialCoordinate, Vector2 } from '@krmx/state';
import { dispatchHexagonWorldEvent, useAtom, useClient, useHexagonWorld } from '@/store/krmx';
import { move } from 'board';

// Precompute hexagon corners
const tileSize = 32;
const corners = [0, 1, 2, 3, 4, 5]
  .map((cornerId: number) => Vector2.fromDegrees((cornerId - 2) * 60))
  .map(corner => corner.multiply(tileSize - 2))
  .map(corner => `${corner.x},${corner.y}`).join(' ');

// Environment types and styles
type Environment = 'plains' | 'forest' | 'desert' | 'mountain' | 'water';
const environmentStyles: { [env: string]: { fill: string, border: string } } = {
  'plains': {
    fill: 'fill-green-300 dark:fill-green-600',
    border: 'stroke-green-400 dark:stroke-green-500 group-hover:stroke-green-500 group-hover:dark:stroke-green-400',
  },
  'forest': {
    fill: 'fill-green-500 dark:fill-green-800',
    border: 'stroke-green-600 dark:stroke-green-700 group-hover:stroke-green-700 group-hover:dark:stroke-green-600',
  },
  'desert': {
    fill: 'fill-yellow-400 dark:fill-yellow-700',
    border: 'stroke-yellow-500 dark:stroke-yellow-600 group-hover:stroke-yellow-600 group-hover:dark:stroke-yellow-500',
  },
  'mountain': {
    fill: 'fill-gray-300 dark:fill-gray-600',
    border: 'stroke-gray-400 dark:stroke-gray-500 group-hover:stroke-gray-600 group-hover:dark:stroke-gray-400',
  },
  'water': {
    fill: 'fill-blue-300 dark:fill-blue-600',
    border: 'stroke-blue-400 dark:stroke-blue-500 group-hover:stroke-blue-500 group-hover:dark:stroke-blue-400',
  },
};

const At = (props: PropsWithChildren<{
  coordinate: AxialCoordinate
  onMoved?: (diff: AxialCoordinate) => void
}>) => {
  const [draggedBy, setDraggedBy] = useAtom<string>(`dragged-by/${props.coordinate.q}/${props.coordinate.r}`, '');
  const [dragDiff, setDragDiff] = useAtom<string>(`drag-diff/${props.coordinate.q}/${props.coordinate.r}`, '0,0');
  const dragDiffVector = new Vector2(...dragDiff.split(',').map((v) => parseInt(v, 10)) as [number, number]);
  const { username } = useClient();
  const draggable = (draggedBy === '' || draggedBy === username) && props.onMoved !== undefined;
  const draggedBySomeoneElse = draggedBy !== '' && draggedBy !== username;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState(new Vector2(0, 0));
  const [dragCurrentOffset, setDragCurrentOffset] = useState(new Vector2(0, 0));
  return <g
    transform={`translate(${props.coordinate.toPixel(tileSize)
      .subtract(dragCurrentOffset).subtract(dragDiffVector.multiply(draggedBySomeoneElse ? 1 : 0))
      .toSvgString()})`}
    onPointerDown={(e) => {
      if (!draggable) {
        return;
      }
      setDraggedBy(username ?? '');
      const p = new DOMPointReadOnly(e.clientX, e.clientY);
      const ownerSVGElement = (e.target as SVGElement).ownerSVGElement;
      if (!ownerSVGElement) {
        return;
      }
      const t = p.matrixTransform(ownerSVGElement.getScreenCTM()!.inverse());
      (e.target as SVGElement).setPointerCapture(e.pointerId);
      setDragStartOffset(new Vector2(t.x, t.y));
      setIsDragging(true);
    }}
    onPointerMove={(e) => {
      if (!draggable || !isDragging) {
        return;
      }
      const p = new DOMPointReadOnly(e.clientX, e.clientY);
      const ownerSVGElement = (e.target as SVGElement).ownerSVGElement;
      if (!ownerSVGElement) {
        return;
      }
      const t = p.matrixTransform(ownerSVGElement.getScreenCTM()!.inverse());
      const dragDiff = dragStartOffset.subtract(new Vector2(t.x, t.y));
      setDragCurrentOffset(dragDiff);
      setDragDiff(dragDiff.toSvgString());
    }}
    onPointerUp={() => {
      if (!draggable || !isDragging) {
        return;
      }
      const diff = AxialCoordinate.fromPixel(dragCurrentOffset.multiply(-1), tileSize).rounded();
      setIsDragging(false);
      setDragCurrentOffset(Vector2.Zero);
      setDraggedBy('');
      !diff.approximatelyEqual(AxialCoordinate.Zero) && props.onMoved!(diff.add(props.coordinate));
    }}
  >
    {props.children}
    <text
      alignmentBaseline="middle"
      textAnchor="middle"
      className="select-none fill-gray-100 font-bold opacity-80 dark:fill-gray-900"
      y={tileSize * -0.4}
      fontSize={tileSize * 0.2}
    >
      {draggedBySomeoneElse && `🔒 ${draggedBy.substring(0, 9)}`}
    </text>
  </g>;
};

const Background = (props: { size: Vector2 }) => {
  const rect = AxialCoordinate.circle(
    AxialCoordinate.Zero,
    Math.max(Math.ceil(props.size.y / tileSize / 2), Math.ceil(props.size.x / tileSize / 2)),
  );
  return <g className="opacity-35 dark:opacity-15">
    {rect.map(c => {
      return <g key={c.toString()} transform={`translate(${c.toPixel(tileSize).toSvgString()})`}>
        <polygon
          points={corners}
          className="fill-gray-100 stroke-gray-200 hover:stroke-gray-300 dark:fill-gray-950 dark:stroke-gray-800 hover:dark:stroke-gray-600"
        />
      </g>;
    })}
  </g>;
};

const Tile = (props: Omit<SVGProps<SVGPolygonElement>, 'points'> & {
  environment: Environment,
}) => {
  const styles = environmentStyles[props.environment];
  return <g className="group">
    <polygon
      {...props}
      points={corners}
      className={`${styles.fill} ${styles.border} ${props.className}`}
    />
    <text
      alignmentBaseline="middle"
      textAnchor="middle"
      className="select-none fill-white font-bold opacity-50 dark:fill-black dark:opacity-20"
      fontSize={tileSize * 0.25}
    >
      {props.environment}
    </text>
  </g>;
};

export const DraggableBackground = (props: PropsWithChildren<{ viewBoxSize: Vector2 }>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(new Vector2(0, 0));
  const [dragOffset, setDragOffset] = useState(new Vector2(0, 0));
  const [dragDiff, setDragDiff] = useState(new Vector2(0, 0));
  return <>
    <g transform={`translate(${position.x - dragDiff.x},${position.y - dragDiff.y})`}>
      <Background size={props.viewBoxSize}/>
    </g>
    <rect
      x={-props.viewBoxSize.x * 4}
      y={-props.viewBoxSize.y * 4}
      width={props.viewBoxSize.x * 8}
      height={props.viewBoxSize.y * 8}
      fill="transparent"
      onPointerDown={(e) => {
        const p = new DOMPointReadOnly(e.clientX, e.clientY);
        const ownerSVGElement = (e.target as SVGElement).ownerSVGElement;
        if (!ownerSVGElement) {
          return;
        }
        const t = p.matrixTransform(ownerSVGElement.getScreenCTM()!.inverse());
        (e.target as SVGElement).setPointerCapture(e.pointerId);
        setDragOffset(new Vector2(t.x, t.y));
        setIsDragging(true);
      }}
      onPointerMove={(e) => {
        if (!isDragging) {
          return;
        }
        const p = new DOMPointReadOnly(e.clientX, e.clientY);
        const ownerSVGElement = (e.target as SVGElement).ownerSVGElement;
        if (!ownerSVGElement) {
          return;
        }
        const t = p.matrixTransform(ownerSVGElement.getScreenCTM()!.inverse());
        const dragDiff = dragOffset.subtract(new Vector2(t.x, t.y));
        setDragDiff(dragDiff);
      }}
      onPointerUp={() => {
        setPosition(p => p.subtract(dragDiff));
        setDragDiff(Vector2.Zero);
        setIsDragging(false);
      }}
    />
    <g transform={`translate(${position.x - dragDiff.x},${position.y - dragDiff.y})`}>
      {props.children}
    </g>
  </>;
};

export const ExampleMultiModel = () => {
  const projection = useHexagonWorld();
  const viewBoxSize = new Vector2(320, 320);
  return <svg
    className="max-h-[75vh] w-full rounded border border-gray-200 dark:border-gray-800"
    preserveAspectRatio="xMidYMid meet"
    viewBox={`${-viewBoxSize.x / 2} ${-viewBoxSize.y / 2} ${viewBoxSize.x} ${viewBoxSize.y}`}
  >
    <DraggableBackground viewBoxSize={viewBoxSize}>
      {projection.tiles.map((tile) => {
        const coordinate = new AxialCoordinate(tile.position.q, tile.position.r);
        return <At
          key={tile.id}
          coordinate={coordinate}
          onMoved={(to) => dispatchHexagonWorldEvent(move({ tileId: tile.id, position: to }))}
        >
          <Tile environment={tile.environment}/>
        </At>;
      })}
    </DraggableBackground>
  </svg>
  ;
};
