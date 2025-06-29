import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, AlertTriangle, Upload, Download, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperation {
  id: string;
  type: 'update' | 'delete' | 'import' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  errorCount: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  results?: any[];
}

interface BulkEditorProps {
  selectedItems: any[];
  onClearSelection: () => void;
  onOperationComplete: (operation: BulkOperation) => void;
}

const BULK_OPERATIONS = [
  { value: 'update-category', label: 'Update Category', icon: '📝' },
  { value: 'update-status', label: 'Update Status', icon: '🔄' },
  { value: 'update-price', label: 'Update Pricing', icon: '💰' },
  { value: 'update-stock', label: 'Update Stock Levels', icon: '📦' },
  { value: 'export-selected', label: 'Export Selected', icon: '📤' },
  { value: 'delete-selected', label: 'Delete Selected', icon: '🗑️' }
];

export function BulkEditor({ selectedItems, onClearSelection, onOperationComplete }: BulkEditorProps) {
  const [selectedOperation, setSelectedOperation] = useState('');
  const [operationParams, setOperationParams] = useState<Record<string, any>>({});
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [operationHistory, setOperationHistory] = useState<BulkOperation[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Simulate bulk operation execution
  const executeBulkOperation = useCallback(async (operation: string, params: Record<string, any>) => {
    const operationId = crypto.randomUUID();
    const newOperation: BulkOperation = {
      id: operationId,
      type: operation.includes('update') ? 'update' : operation.includes('delete') ? 'delete' : 
            operation.includes('export') ? 'export' : 'import',
      status: 'running',
      progress: 0,
      totalItems: selectedItems.length,
      processedItems: 0,
      errorCount: 0,
      startedAt: new Date()
    };
    
    setCurrentOperation(newOperation);
    
    // Simulate progress
    for (let i = 0; i <= selectedItems.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
      
      const progress = (i / selectedItems.length) * 100;
      const errorRate = Math.random() * 0.1; // 10% chance of errors
      const errors = Math.random() < errorRate ? 1 : 0;
      
      setCurrentOperation(prev => prev ? {
        ...prev,
        progress,
        processedItems: i,
        errorCount: prev.errorCount + errors
      } : null);
    }
    
    // Complete operation
    const completedOperation: BulkOperation = {
      ...newOperation,
      status: 'completed',
      progress: 100,
      processedItems: selectedItems.length,
      completedAt: new Date(),
      results: selectedItems.map(item => ({ ...item, ...params }))
    };
    
    setCurrentOperation(completedOperation);
    setOperationHistory(prev => [completedOperation, ...prev]);
    onOperationComplete(completedOperation);
    
    setTimeout(() => {
      setCurrentOperation(null);
      toast.success(`Bulk ${operation} completed successfully`);
    }, 1000);
    
  }, [selectedItems, onOperationComplete]);

  const validateOperation = useCallback(() => {
    const errors: string[] = [];
    
    if (!selectedOperation) {
      errors.push('Please select an operation');
    }
    
    if (selectedItems.length === 0) {
      errors.push('No items selected');
    }
    
    // Operation-specific validation
    switch (selectedOperation) {
      case 'update-price':
        if (!operationParams.newPrice || operationParams.newPrice <= 0) {
          errors.push('Price must be greater than 0');
        }
        break;
      case 'update-stock':
        if (operationParams.newStock < 0) {
          errors.push('Stock level cannot be negative');
        }
        break;
      case 'update-category':
        if (!operationParams.newCategory) {
          errors.push('Please select a category');
        }
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [selectedOperation, selectedItems, operationParams]);

  const handleExecute = async () => {
    if (!validateOperation()) return;
    
    await executeBulkOperation(selectedOperation, operationParams);
  };

  const handleCancel = () => {
    if (currentOperation && currentOperation.status === 'running') {
      setCurrentOperation(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast.info('Operation cancelled');
    }
  };

  const renderOperationParams = () => {
    switch (selectedOperation) {
      case 'update-category':
        return (
          <div className=\"space-y-2\">
            <Label>New Category</Label>
            <Select 
              value={operationParams.newCategory || ''} 
              onValueChange={(value) => setOperationParams(prev => ({ ...prev, newCategory: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder=\"Select category\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"electronics\">Electronics</SelectItem>
                <SelectItem value=\"clothing\">Clothing</SelectItem>
                <SelectItem value=\"home-garden\">Home & Garden</SelectItem>
                <SelectItem value=\"sports\">Sports</SelectItem>
                <SelectItem value=\"books\">Books</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'update-status':
        return (
          <div className=\"space-y-2\">
            <Label>New Status</Label>
            <Select 
              value={operationParams.newStatus || ''} 
              onValueChange={(value) => setOperationParams(prev => ({ ...prev, newStatus: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder=\"Select status\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"active\">Active</SelectItem>
                <SelectItem value=\"inactive\">Inactive</SelectItem>
                <SelectItem value=\"discontinued\">Discontinued</SelectItem>
                <SelectItem value=\"backordered\">Back-ordered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'update-price':
        return (
          <div className=\"space-y-4\">
            <div className=\"space-y-2\">
              <Label>Price Update Method</Label>
              <Select 
                value={operationParams.priceMethod || 'absolute'} 
                onValueChange={(value) => setOperationParams(prev => ({ ...prev, priceMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"absolute\">Set Absolute Price</SelectItem>
                  <SelectItem value=\"percentage\">Percentage Change</SelectItem>
                  <SelectItem value=\"fixed-amount\">Fixed Amount Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className=\"space-y-2\">
              <Label>
                {operationParams.priceMethod === 'percentage' ? 'Percentage Change (%)' :
                 operationParams.priceMethod === 'fixed-amount' ? 'Amount Change ($)' :
                 'New Price ($)'}
              </Label>
              <Input
                type=\"number\"
                step=\"0.01\"
                value={operationParams.newPrice || ''}
                onChange={(e) => setOperationParams(prev => ({ ...prev, newPrice: parseFloat(e.target.value) }))}
                placeholder={operationParams.priceMethod === 'percentage' ? 'e.g., 10 for +10%' : '0.00'}
              />
            </div>
          </div>
        );
        
      case 'update-stock':
        return (
          <div className=\"space-y-4\">
            <div className=\"space-y-2\">
              <Label>Stock Update Method</Label>
              <Select 
                value={operationParams.stockMethod || 'set'} 
                onValueChange={(value) => setOperationParams(prev => ({ ...prev, stockMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"set\">Set Stock Level</SelectItem>
                  <SelectItem value=\"add\">Add to Current Stock</SelectItem>
                  <SelectItem value=\"subtract\">Subtract from Current Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className=\"space-y-2\">
              <Label>
                {operationParams.stockMethod === 'set' ? 'New Stock Level' :
                 operationParams.stockMethod === 'add' ? 'Amount to Add' :
                 'Amount to Subtract'}
              </Label>
              <Input
                type=\"number\"
                value={operationParams.newStock || ''}
                onChange={(e) => setOperationParams(prev => ({ ...prev, newStock: parseInt(e.target.value) }))}
                placeholder=\"0\"
              />
            </div>
          </div>
        );
        
      case 'delete-selected':
        return (
          <div className=\"p-4 bg-red-50 rounded-lg border border-red-200\">
            <div className=\"flex items-center gap-2 text-red-800 font-medium\">
              <AlertTriangle className=\"h-4 w-4\" />
              Dangerous Operation
            </div>
            <p className=\"text-sm text-red-700 mt-1\">
              This will permanently delete {selectedItems.length} selected items. This action cannot be undone.
            </p>
            <div className=\"mt-3\">
              <Label htmlFor=\"confirm-delete\">
                Type \"DELETE\" to confirm:
              </Label>
              <Input
                id=\"confirm-delete\"
                value={operationParams.confirmText || ''}
                onChange={(e) => setOperationParams(prev => ({ ...prev, confirmText: e.target.value }))}
                placeholder=\"DELETE\"
                className=\"mt-1\"
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const canExecute = () => {
    if (selectedOperation === 'delete-selected') {
      return operationParams.confirmText === 'DELETE';
    }
    return validateOperation();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className=\"flex items-center gap-2\">
          <Upload className=\"h-5 w-5\" />
          Bulk Operations
        </CardTitle>
        <CardDescription>
          Apply operations to {selectedItems.length} selected items
        </CardDescription>
      </CardHeader>
      <CardContent className=\"space-y-6\">
        {/* Operation Selection */}
        <div className=\"space-y-4\">
          <div className=\"space-y-2\">
            <Label>Select Operation</Label>
            <Select value={selectedOperation} onValueChange={setSelectedOperation}>
              <SelectTrigger>
                <SelectValue placeholder=\"Choose bulk operation\" />
              </SelectTrigger>
              <SelectContent>
                {BULK_OPERATIONS.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    <div className=\"flex items-center gap-2\">
                      <span>{op.icon}</span>
                      {op.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Operation Parameters */}
          {selectedOperation && renderOperationParams()}
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className=\"p-3 bg-red-50 rounded-lg border border-red-200\">
              <div className=\"flex items-center gap-2 text-red-800 font-medium mb-2\">
                <XCircle className=\"h-4 w-4\" />
                Validation Errors
              </div>
              <ul className=\"text-sm text-red-700 space-y-1\">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Operation Progress */}
        {currentOperation && (
          <Card>
            <CardHeader className=\"pb-3\">
              <div className=\"flex items-center justify-between\">
                <CardTitle className=\"text-lg\">Operation Progress</CardTitle>
                <Badge variant={currentOperation.status === 'completed' ? 'default' : 
                              currentOperation.status === 'failed' ? 'destructive' : 'secondary'}>
                  {currentOperation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <Progress value={currentOperation.progress} className=\"w-full\" />
              
              <div className=\"grid grid-cols-3 gap-4 text-sm\">
                <div className=\"text-center\">
                  <div className=\"text-2xl font-bold\">{currentOperation.processedItems}</div>
                  <div className=\"text-muted-foreground\">Processed</div>
                </div>
                <div className=\"text-center\">
                  <div className=\"text-2xl font-bold\">{currentOperation.totalItems}</div>
                  <div className=\"text-muted-foreground\">Total</div>
                </div>
                <div className=\"text-center\">
                  <div className=\"text-2xl font-bold text-red-600\">{currentOperation.errorCount}</div>
                  <div className=\"text-muted-foreground\">Errors</div>
                </div>
              </div>
              
              {currentOperation.status === 'running' && (
                <Button variant=\"outline\" onClick={handleCancel} className=\"w-full\">
                  Cancel Operation
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className=\"flex gap-3\">
          {selectedOperation === 'delete-selected' ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant=\"destructive\" 
                  disabled={!canExecute() || !!currentOperation}
                  className=\"flex-1\"
                >
                  <AlertTriangle className=\"h-4 w-4 mr-2\" />
                  Delete {selectedItems.length} Items
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete {selectedItems.length} items. 
                    This action cannot be undone and will remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleExecute}
                    className=\"bg-red-600 hover:bg-red-700\"
                  >
                    Delete Items
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button 
              onClick={handleExecute}
              disabled={!canExecute() || !!currentOperation}
              className=\"flex-1\"
            >
              <Play className=\"h-4 w-4 mr-2\" />
              Execute Operation
            </Button>
          )}
          
          <Button variant=\"outline\" onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>

        {/* Operation History */}
        {operationHistory.length > 0 && (
          <Card>
            <CardHeader className=\"pb-3\">
              <CardTitle className=\"text-lg\">Recent Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {operationHistory.slice(0, 3).map(operation => (
                  <div key={operation.id} className=\"flex items-center justify-between p-3 border rounded-lg\">
                    <div className=\"flex items-center gap-3\">
                      {operation.status === 'completed' ? (
                        <CheckCircle className=\"h-4 w-4 text-green-600\" />
                      ) : (
                        <XCircle className=\"h-4 w-4 text-red-600\" />
                      )}
                      <div>
                        <div className=\"font-medium capitalize\">
                          {operation.type} Operation
                        </div>
                        <div className=\"text-sm text-muted-foreground\">
                          {operation.processedItems} items • {operation.errorCount} errors
                        </div>
                      </div>
                    </div>
                    <div className=\"text-right text-sm text-muted-foreground\">
                      {operation.completedAt?.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}