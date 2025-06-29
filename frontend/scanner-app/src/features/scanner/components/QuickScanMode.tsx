import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, Keyboard } from 'lucide-react';
import { Button } from '../../shared/components/button';
import { Badge } from '../../shared/components/badge';
import { cn } from '../../shared/utils/cn';

interface QuickScanModeProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function QuickScanMode({ isEnabled, onToggle, className }: QuickScanModeProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'q') {
        event.preventDefault();
        onToggle(!isEnabled);
      }
    };

    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, onToggle]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggle(!isEnabled)}
            className={cn(
              'transition-all duration-200',
              isEnabled && 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
            )}
          >
            {isEnabled ? (
              <Zap className="h-4 w-4 mr-2" />
            ) : (
              <ZapOff className="h-4 w-4 mr-2" />
            )}
            Quick Scan Mode
          </Button>
          
          {isEnabled && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="h-6 w-6 p-0"
              >
                <Keyboard className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showShortcuts && isEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-muted/50 rounded-lg p-3 space-y-2"
          >
            <h4 className="text-sm font-medium">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded text-xs">Ctrl + Q</kbd>
                <span>Toggle Quick Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded text-xs">Enter</kbd>
                <span>Submit Scan</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded text-xs">+ / -</kbd>
                <span>Adjust Quantity</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-background border rounded text-xs">Tab</kbd>
                <span>Next Field</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800"
        >
          <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Quick Mode Active</p>
          <p className="text-blue-600 dark:text-blue-300">
            Simplified interface for rapid scanning. Use keyboard shortcuts for faster operation.
          </p>
        </motion.div>
      )}
    </div>
  );
} 