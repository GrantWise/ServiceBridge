import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Skeleton } from '../../shared/components/skeleton';
import type { Product } from '../../../types/api';

interface ProductInfoProps {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

/**
 * Component for displaying product information during scanning
 * Follows Single Responsibility Principle - handles only product info display
 */
export const ProductInfo = memo(function ProductInfo({ product, loading, error }: ProductInfoProps) {
  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </motion.div>
      )}

      {product && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-secondary rounded-lg space-y-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{product.description}</p>
              <p className="text-sm text-muted-foreground">
                Current Stock: {product.quantityOnHand} units
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </motion.div>
      )}

      {error && !loading && !product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-destructive/10 text-destructive rounded-lg"
        >
          <p className="text-sm">{error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
});