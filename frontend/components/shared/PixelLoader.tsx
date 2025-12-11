// frontend/components/shared/PixelLoader.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PixelLoaderProps {
  isLoading: boolean;
  text?: string;
}

const PixelLoader: React.FC<PixelLoaderProps> = ({ isLoading, text = "LOADING..." }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  const pixelVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({
      opacity: [0, 1, 0.5, 0],
      scale: 1,
      transition: {
        delay: i * 0.02,
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="pixel-loader-overlay"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="pixel-grid">
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={i}
                className="pixel"
                custom={i}
                variants={pixelVariants}
                initial="hidden"
                animate="visible"
              />
            ))}
          </div>
          <p className="pixel-loader-text">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PixelLoader;
