import { Skeleton } from './skeleton';

export function SkeletonList({ count = 5, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mb-3">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
} 