import { motion } from 'framer-motion';

type Shape = {
  type: 'hexagon' | 'square' | 'triangle',
  positions: [{ x: string, y: string }, { x: string, y: string }],
  delay: number,
}

export const AnimatedBackground = () => {
  const shapePaths = {
    hexagon: 'M18 2.5L33 12V30.5L18 40L3 30.5V12L18 2.5',
    square: 'M5 5H35V35H5V5',
    triangle: 'M20 5L35 35H5L20 5',
  };
  const shapes: Shape[] = [
    { type: 'hexagon', positions: [{ x: '10%', y: '20%' }, { x: '90%', y: '80%' }], delay: 0 },
    { type: 'triangle', positions: [{ x: '80%', y: '70%' }, { x: '20%', y: '30%' }], delay: 1 },
    { type: 'triangle', positions: [{ x: '85%', y: '30%' }, { x: '15%', y: '70%' }], delay: 2 },
    { type: 'hexagon', positions: [{ x: '70%', y: '15%' }, { x: '30%', y: '85%' }], delay: 3 },
    { type: 'triangle', positions: [{ x: '40%', y: '80%' }, { x: '60%', y: '20%' }], delay: 4 },
    { type: 'square', positions: [{ x: '25%', y: '60%' }, { x: '75%', y: '40%' }], delay: 5 },
    { type: 'hexagon', positions: [{ x: '15%', y: '45%' }, { x: '18%', y: '55%' }], delay: 6 },
    { type: 'square', positions: [{ x: '60%', y: '40%' }, { x: '40%', y: '60%' }], delay: 7 },
  ];

  const fadeInOut = {
    initial: (custom: { shape: Shape, index: number }) => ({
      opacity: 0,
      left: custom.shape.positions[0].x,
      top: custom.shape.positions[0].y,
    }),
    animate: (custom: { shape: Shape, index: number }) => ({
      opacity: [
        0, 0.2, 0,
        0, 0.2, 0,
      ],
      left: [
        custom.shape.positions[0].x, custom.shape.positions[0].x, custom.shape.positions[0].x,
        custom.shape.positions[1].x, custom.shape.positions[1].x, custom.shape.positions[1].x,
      ],
      top: [
        custom.shape.positions[0].y, custom.shape.positions[0].y, custom.shape.positions[0].y,
        custom.shape.positions[1].y, custom.shape.positions[1].y, custom.shape.positions[1].y,
      ],
      rotateZ: [0, 180, 360, 0, 180, 360],
      x: [0, -50 + Number.parseInt(custom.shape.positions[0].x), 0, 0, -50 + Number.parseInt(custom.shape.positions[1].x), 0],
      y: [0, -50 + Number.parseInt(custom.shape.positions[0].y), 0, 0, -50 + Number.parseInt(custom.shape.positions[1].y), 0],
      transition: {
        duration: 12,
        delay: custom.shape.delay * 2,
        repeat: Infinity,
        ease: ['easeOut', 'easeIn', 'linear', 'easeOut', 'easeIn'],
      },
    }),
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
              className="fill-gray-200 stroke-gray-900 dark:fill-gray-500 dark:stroke-white"
              fill="none"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};
