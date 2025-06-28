import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
}

const confettiColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function SuccessAnimation({ isVisible, message = 'Scan completed successfully!', onComplete }: SuccessAnimationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti pieces
      const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -20,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      }));
      setConfetti(pieces);

      // Trigger completion callback after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setConfetti([]);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          {/* Confetti Container */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confetti.map((piece) => (
              <motion.div
                key={piece.id}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: piece.color,
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                }}
                initial={{
                  y: -20,
                  x: piece.x,
                  rotate: piece.rotation,
                  scale: piece.scale,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  x: piece.x + (Math.random() - 0.5) * 100,
                  rotate: piece.rotation + 360,
                  scale: 0,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  ease: 'easeOut',
                  delay: Math.random() * 0.5,
                }}
              />
            ))}
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-background rounded-lg p-8 shadow-lg border max-w-sm mx-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg font-semibold mb-2"
            >
              Success!
            </motion.h3>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-4"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inventory updated</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 