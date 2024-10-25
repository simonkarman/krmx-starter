import { motion, Variants } from 'framer-motion';
import { Vector2 } from '@krmx/state';

type Shape = {
  type: 'hexagon' | 'square' | 'triangle',
  positions: [{ x: string, y: string }, { x: string, y: string }],
}

export const AnimatedBackground = () => {
  const shapePaths = {
    hexagon: 'M18 2.5L33 12V30.5L18 40L3 30.5V12L18 2.5',
    square: 'M5 5H35V35H5V5',
    triangle: 'M20 5L35 35H5L20 5',
  };
  const shapes: Shape[] = [
    { type: 'hexagon', positions: [{ x: '10%', y: '20%' }, { x: '90%', y: '80%' }] },
    { type: 'triangle', positions: [{ x: '80%', y: '70%' }, { x: '20%', y: '30%' }] },
    { type: 'triangle', positions: [{ x: '85%', y: '30%' }, { x: '15%', y: '70%' }] },
    { type: 'hexagon', positions: [{ x: '70%', y: '15%' }, { x: '30%', y: '85%' }] },
    { type: 'triangle', positions: [{ x: '40%', y: '80%' }, { x: '60%', y: '20%' }] },
    { type: 'square', positions: [{ x: '25%', y: '60%' }, { x: '75%', y: '40%' }] },
    { type: 'hexagon', positions: [{ x: '15%', y: '45%' }, { x: '18%', y: '55%' }] },
    { type: 'square', positions: [{ x: '60%', y: '40%' }, { x: '40%', y: '60%' }] },
  ];

  const fadeInOut: Variants = {
    initial: (custom: { shape: Shape, index: number }) => ({
      opacity: 0,
      left: custom.shape.positions[0].x,
      top: custom.shape.positions[0].y,
    }),
    animate: (custom: { shape: Shape, index: number }) => {
      const dir = (percentage: string) => -50 + Number.parseInt(percentage);
      const a = custom.shape.positions[0];
      const aDir = new Vector2(dir(a.x), dir(a.y)).normalized().multiply(50);
      const b = custom.shape.positions[1];
      const bDir = new Vector2(dir(b.x), dir(b.y)).normalized().multiply(50);
      return {
        opacity: [
          0, 0.3, 0,
          0, 0.3, 0,
        ],
        left: [a.x, a.x, a.x, b.x, b.x, b.x],
        top: [a.y, a.y, a.y, b.y, b.y, b.y],
        rotateZ: [0, 90, 180, 180, 270, 360],
        x: [0, aDir.x, 0, 0, bDir.x, 0],
        y: [0, aDir.y, 0, 0, bDir.y, 0],
        transition: {
          duration: 12,
          delay: custom.index * 1.5,
          repeat: Infinity,
          ease: ['easeOut', 'easeIn', 'linear', 'easeOut', 'easeIn'],
        },
      };
    },
  };

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute h-8 w-8"
          custom={{ shape, index }}
          initial="initial"
          animate="animate"
          variants={fadeInOut}
        >
          <svg
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={shapePaths[shape.type]}
              strokeWidth="2"
              className="fill-gray-200 stroke-gray-500 dark:fill-gray-600 dark:stroke-white"
              fill="none"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};
