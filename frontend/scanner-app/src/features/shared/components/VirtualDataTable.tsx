import { memo, useMemo } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { cn } from '../utils/cn';
import { Table, TableHeader, TableHead, TableRow, TableCell } from './table';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface VirtualDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  height: number;
  width?: number | string;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  getRowKey?: (item: T, index: number) => string | number;
  overscanCount?: number;
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VirtualDataTableInner<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 60,
  height,
  width = '100%',
  className,
  headerClassName,
  rowClassName,
  getRowKey,
  overscanCount = 5,
  emptyMessage = 'No data available',
}: VirtualDataTableProps<T>) {
  const Row = memo(({ index, style }: ListChildComponentProps) => {
    const item = data[index];
    const dynamicRowClassName = typeof rowClassName === 'function' ? rowClassName(item, index) : rowClassName;
    
    return (
      <div style={style}>
        <TableRow className={cn('border-b hover:bg-muted/50', dynamicRowClassName)}>
          {columns.map((column, colIndex) => {
            const value = column.render 
              ? column.render(item, index)
              : String(item[column.key as keyof T] || '');
            
            return (
              <TableCell
                key={`${index}-${colIndex}`}
                className={cn('px-4 py-2', column.className)}
                style={{ width: column.width }}
              >
                {value}
              </TableCell>
            );
          })}
        </TableRow>
      </div>
    );
  });

  Row.displayName = 'VirtualDataTableRow';

  const itemKey = useMemo(() => {
    if (getRowKey) {
      return (index: number) => getRowKey(data[index], index);
    }
    return (index: number) => index;
  }, [getRowKey, data]);

  if (data.length === 0) {
    return (
      <div className={cn('rounded-md border', className)}>
        <Table>
          <TableHeader className={headerClassName}>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={cn('px-4 py-2', column.className)}
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <div
          className="flex items-center justify-center text-muted-foreground py-8"
          style={{ height: Math.max(height - 60, 100) }}
        >
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border', className)} style={{ width }}>
      {/* Fixed Header */}
      <Table>
        <TableHeader className={headerClassName}>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className={cn('px-4 py-2', column.className)}
                style={{ width: column.width }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>
      
      {/* Virtual Scrolled Body */}
      <div style={{ height: height - 50 }}>
        <List
          height={height - 50}
          width={width}
          itemCount={data.length}
          itemSize={rowHeight}
          itemKey={itemKey}
          overscanCount={overscanCount}
        >
          {Row}
        </List>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VirtualDataTable = memo(VirtualDataTableInner as any) as <T extends Record<string, any>>(
  props: VirtualDataTableProps<T>
) => JSX.Element;

(VirtualDataTable as any).displayName = 'VirtualDataTable';