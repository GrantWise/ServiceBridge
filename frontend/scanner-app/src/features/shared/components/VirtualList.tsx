import { memo, useMemo } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { cn } from '../utils/cn';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: number | string;
  className?: string;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemKey?: (index: number, item: T) => string | number;
  overscanCount?: number;
}

const VirtualListInner = <T = unknown>({
  items,
  itemHeight,
  height,
  width = '100%',
  className,
  renderItem,
  getItemKey,
  overscanCount = 5,
}: VirtualListProps<T>) => {
  const Row = memo(({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    return (
      <div style={style}>
        {renderItem(item, index, style)}
      </div>
    );
  });

  Row.displayName = 'VirtualListRow';

  const itemKey = useMemo(() => {
    if (getItemKey) {
      return (index: number) => getItemKey(index, items[index]);
    }
    return (index: number) => index;
  }, [getItemKey, items]);

  if (items.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ height, width }}
      >
        No items to display
      </div>
    );
  }

  return (
    <List
      className={className}
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={itemHeight}
      itemKey={itemKey}
      overscanCount={overscanCount}
    >
      {Row}
    </List>
  );
};

// Create a properly typed component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VirtualList = memo(VirtualListInner as any) as <T>(props: VirtualListProps<T>) => JSX.Element;

(VirtualList as any).displayName = 'VirtualList';