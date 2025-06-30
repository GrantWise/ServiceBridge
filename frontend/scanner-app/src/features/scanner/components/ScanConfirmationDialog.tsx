import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../shared/components/alert-dialog';

interface ScanConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quantity?: number;
  expectedQuantity?: number;
  transactionType?: number;
  onConfirm: () => void;
}

/**
 * Component for confirming large variance in scanned quantity
 * Follows Single Responsibility Principle - handles only scan confirmation
 */
export function ScanConfirmationDialog({
  open,
  onOpenChange,
  quantity,
  expectedQuantity,
  transactionType,
  onConfirm,
}: ScanConfirmationDialogProps) {
  const isAdjustment = transactionType === 1; // TransactionType.Adjustment
  
  const getVarianceDisplay = () => {
    if (!expectedQuantity || !quantity) return { text: '0%', message: '' };
    
    if (isAdjustment) {
      // For adjustments, show the percentage of stock being adjusted
      const percentageChange = (Math.abs(quantity) / expectedQuantity * 100).toFixed(1);
      const changeText = quantity > 0 ? `+${quantity}` : `${quantity}`;
      return {
        text: `${percentageChange}% of current stock`,
        message: `Adjustment: ${changeText} units`
      };
    } else {
      // For stock counts, show the variance from expected
      const variance = ((quantity - expectedQuantity) / expectedQuantity * 100).toFixed(1);
      const varianceText = quantity > expectedQuantity ? `+${variance}%` : `${variance}%`;
      return {
        text: varianceText,
        message: 'Stock Count'
      };
    }
  };
  
  const { text: varianceText, message } = getVarianceDisplay();
    
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAdjustment ? 'Confirm Large Adjustment' : 'Confirm Large Variance'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {isAdjustment 
                  ? 'You are making a significant inventory adjustment:'
                  : 'You are scanning a quantity that differs significantly from the expected amount:'
                }
              </p>
              <div className="bg-muted p-3 rounded-md space-y-1 font-mono">
                <div>Current Stock: {expectedQuantity}</div>
                <div>{message}: {quantity}</div>
                <div className="font-semibold">
                  {isAdjustment ? 'Impact' : 'Variance'}: {varianceText}
                </div>
              </div>
              <p>Are you sure you want to proceed?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isAdjustment ? 'Confirm Adjustment' : 'Confirm Count'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}