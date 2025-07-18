import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, Vibrate } from 'lucide-react';
import { Button } from '../../shared/components/button';
import { cn } from '../../shared/utils/cn';

interface NumericKeypadProps {
  isVisible: boolean;
  onClose: () => void;
  onNumberPress: (number: number) => void;
  onBackspace: () => void;
  onEnter: () => void;
  className?: string;
}

const keypadNumbers = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [0]
];

export function NumericKeypad({ 
  isVisible, 
  onClose, 
  onNumberPress, 
  onBackspace, 
  onEnter,
  className 
}: NumericKeypadProps) {
  const [isHapticSupported, setIsHapticSupported] = useState(false);

  useEffect(() => {
    // Check if haptic feedback is supported
    setIsHapticSupported('vibrate' in navigator);
  }, []);

  const handleNumberPress = (number: number) => {
    // Haptic feedback if supported
    if (isHapticSupported && navigator.vibrate) {
      navigator.vibrate(50);
    }
    onNumberPress(number);
  };

  const handleBackspace = () => {
    if (isHapticSupported && navigator.vibrate) {
      navigator.vibrate(100);
    }
    onBackspace();
  };

  const handleEnter = () => {
    if (isHapticSupported && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
    onEnter();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'w-full bg-card/95 backdrop-blur-glass border-t border-border/50 rounded-t-2xl p-6 pb-safe shadow-elevation-4',
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Numeric Keypad</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Keypad Grid */}
            <div className="space-y-3">
              {keypadNumbers.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-3 justify-center">
                  {row.map((number) => (
                    <Button
                      key={number}
                      variant="outline"
                      size="lg"
                      animation="scale"
                      onClick={() => handleNumberPress(number)}
                      className="h-16 w-16 text-xl font-semibold rounded-xl shadow-elevation-2 hover:shadow-elevation-3"
                    >
                      {number}
                    </Button>
                  ))}
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center mt-4">
                <Button
                  variant="outline"
                  size="lg"
                  animation="scale"
                  onClick={handleBackspace}
                  className="h-16 w-16 rounded-xl shadow-elevation-2 hover:shadow-elevation-3"
                >
                  <Delete className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="success"
                  size="lg"
                  animation="scale"
                  onClick={handleEnter}
                  className="h-16 w-32 rounded-xl shadow-elevation-2 hover:shadow-elevation-3"
                >
                  Enter
                </Button>
              </div>
            </div>

            {/* Haptic Feedback Indicator */}
            {isHapticSupported && (
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <Vibrate className="h-3 w-3" />
                <span>Haptic feedback enabled</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 