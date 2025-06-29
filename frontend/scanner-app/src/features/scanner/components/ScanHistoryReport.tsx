import { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/card';
import { Button } from '../../shared/components/button';
import { Input } from '../../shared/components/input';
import { VirtualDataTable, Column } from '../../shared/components/VirtualDataTable';
import { Badge } from '../../shared/components/badge';
import { cn } from '../../shared/utils/cn';
import { ScanTransaction, TransactionType } from '../../../types/api';
import { formatDateTime } from '../../shared/utils/date';

interface ScanHistoryReportProps {
  className?: string;
}

// Mock data generator for demonstration
function generateMockData(count: number): ScanTransaction[] {
  const transactionTypes = [TransactionType.StockCount, TransactionType.Adjustment, TransactionType.Receiving];
  const users = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown'];
  const productCodes = ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345', 'PQR678', 'STU901'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    productCode: productCodes[Math.floor(Math.random() * productCodes.length)],
    quantityScanned: Math.floor(Math.random() * 100) + 1,
    previousQuantity: Math.floor(Math.random() * 50),
    newQuantity: Math.floor(Math.random() * 100) + 1,
    transactionType: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
    scanDateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    scannedBy: users[Math.floor(Math.random() * users.length)],
    notes: Math.random() > 0.7 ? 'Sample note for this transaction' : undefined,
  }));
}

export function ScanHistoryReport({ className }: ScanHistoryReportProps) {
  const [data, setData] = useState<ScanTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Load mock data on component mount
  useEffect(() => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setData(generateMockData(1000)); // Generate 1000 mock records
      setLoading(false);
    }, 500);
  }, []);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data;
    }
    
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.productCode.toLowerCase().includes(term) ||
        item.scannedBy.toLowerCase().includes(term) ||
        item.notes?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.StockCount:
        return 'Stock Count';
      case TransactionType.Adjustment:
        return 'Adjustment';
      case TransactionType.Receiving:
        return 'Receiving';
      default:
        return 'Unknown';
    }
  };

  const getTransactionTypeBadgeVariant = (type: TransactionType) => {
    switch (type) {
      case TransactionType.StockCount:
        return 'default';
      case TransactionType.Adjustment:
        return 'secondary';
      case TransactionType.Receiving:
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const columns: Column<ScanTransaction>[] = useMemo(() => [
    {
      key: 'productCode',
      header: 'Product Code',
      width: 120,
      render: (item) => (
        <span className="font-mono text-sm">{item.productCode}</span>
      ),
    },
    {
      key: 'quantityScanned',
      header: 'Quantity',
      width: 100,
      render: (item) => (
        <span className="font-semibold">{item.quantityScanned}</span>
      ),
    },
    {
      key: 'transactionType',
      header: 'Type',
      width: 130,
      render: (item) => (
        <Badge variant={getTransactionTypeBadgeVariant(item.transactionType)}>
          {getTransactionTypeLabel(item.transactionType)}
        </Badge>
      ),
    },
    {
      key: 'scanDateTime',
      header: 'Scan Date',
      width: 180,
      render: (item) => (
        <span className="text-sm">{formatDateTime(item.scanDateTime)}</span>
      ),
    },
    {
      key: 'scannedBy',
      header: 'Scanned By',
      width: 140,
      render: (item) => (
        <span className="text-sm">{item.scannedBy}</span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (item) => (
        <span className="text-sm text-muted-foreground truncate">
          {item.notes || '-'}
        </span>
      ),
    },
  ], []);

  const handleExport = () => {
    // Mock export functionality
    const csvContent = [
      ['Product Code', 'Quantity', 'Type', 'Scan Date', 'Scanned By', 'Notes'],
      ...filteredData.map(item => [
        item.productCode,
        item.quantityScanned.toString(),
        getTransactionTypeLabel(item.transactionType),
        formatDateTime(item.scanDateTime),
        item.scannedBy,
        item.notes || '',
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scan History Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product code, user, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} of {data.length} records
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <VirtualDataTable
            data={filteredData}
            columns={columns}
            height={500}
            rowHeight={60}
            getRowKey={(item) => item.id.toString()}
            emptyMessage="No scan history found"
            className="border-0"
          />
        )}
      </CardContent>
    </Card>
  );
}