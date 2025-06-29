import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../shared/components/alert-dialog';

interface ScanConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quantity?: number;
  onConfirm: () => void;
}

/**
 * Component for confirming large quantity scans
 * Follows Single Responsibility Principle - handles only scan confirmation
 */
export function ScanConfirmationDialog({
  open,
  onOpenChange,
  quantity,
  onConfirm,
}: ScanConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Large Quantity Change</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to submit a scan with quantity {quantity}. This is a significant change. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}