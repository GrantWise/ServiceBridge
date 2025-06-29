import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 60 }: PullToRefreshProps) {
  const startY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current !== null) {
      const distance = e.touches[0].clientY - startY.current;
      setPullDistance(Math.max(0, distance));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <AnimatePresence>
        {(pullDistance > 0 || refreshing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: pullDistance, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--background)' }}
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} />
            <span className="ml-2 text-xs">
              {refreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
} 