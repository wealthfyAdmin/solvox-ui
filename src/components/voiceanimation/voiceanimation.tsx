import React from 'react';
import { motion } from 'framer-motion';

interface VoiceAnimationProps {
  isActive?: boolean;
  color?: string;
  barCount?: number;
  size?: 'small' | 'medium' | 'large';
}

const VoiceAnimation: React.FC<VoiceAnimationProps> = ({ 
  isActive = false, 
  color = 'blue-500', 
  barCount = 7,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: { container: 'w-16 h-8', bar: 'w-1' },
    medium: { container: 'w-24 h-12', bar: 'w-1.5' },
    large: { container: 'w-32 h-16', bar: 'w-2' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-end justify-center gap-1 ${currentSize.container}`}>
      {Array.from({ length: barCount }).map((_, index) => (
        <motion.div
          key={index}
          className={`${currentSize.bar} bg-${color} rounded-full transition-all duration-300`}
          initial={{ height: '20%' }}
          animate={isActive ? {
            height: [`${20 + Math.random() * 60}%`, `${30 + Math.random() * 50}%`, `${20 + Math.random() * 60}%`],
            opacity: [0.7, 1, 0.7]
          } : { height: '20%', opacity: 0.3 }}
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut",
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
};

export default VoiceAnimation;
