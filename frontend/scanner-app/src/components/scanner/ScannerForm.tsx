import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, Minus, Package, CheckCircle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { NumericKeypad } from './NumericKeypad'
import { isMobile } from '@/utils/isMobile'
import { addScan as addOfflineScan } from './OfflineQueue'

import { productsApi } from '@/services/api'
import { Product, TransactionType, CreateScanRequest } from '@/types/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SignalRService } from '@/services/signalr'

// Form validation schema
const productCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}\d{3}$/, 'Format: 3 letters + 3 numbers (e.g., ABC123)')
  .length(6, 'Product code must be 6 characters')

const formSchema = z.object({
  productCode: productCodeSchema,
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(9999, 'Quantity cannot exceed 9999'),
  transactionType: z.nativeEnum(TransactionType),
})

type FormValues = z.infer<typeof formSchema>

interface ScannerFormProps {
  onScanComplete?: (transaction: any) => void
  signalRService: SignalRService
}

export function ScannerForm({ onScanComplete, signalRService }: ScannerFormProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<FormValues | null>(null)
  const queryClient = useQueryClient()
  const [showKeypad, setShowKeypad] = useState(false)
  const quantityInputRef = useRef<HTMLInputElement>(null)
  const [optimisticScans, setOptimisticScans] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      productCode: '',
      quantity: 1,
      transactionType: TransactionType.StockCount,
    },
  })

  const productCode = watch('productCode') || ''
  const quantity = watch('quantity')
  const transactionType = watch('transactionType')

  // Product lookup query
  const { data: productData, isLoading: isLoadingProduct, error: productError } = useQuery({
    queryKey: ['product', productCode],
    queryFn: () => productsApi.getProduct(productCode),
    enabled: Boolean(productCode && productCode.length === 6 && /^[A-Z]{3}\d{3}$/.test(productCode)),
    retry: false,
  })

  // Scan submission mutation
  const scanMutation = useMutation({
    mutationFn: (data: CreateScanRequest) => 
      productsApi.submitScan(data.productCode, data),
    onSuccess: (response) => {
      toast.success('Scan submitted successfully!', {
        description: `${response.updatedProduct.description} - New quantity: ${response.updatedProduct.quantityOnHand}`,
      })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['product', productCode] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      
      // Reset form
      setValue('productCode', '')
      setValue('quantity', 1)
      setProduct(null)
      
      // Call callback if provided
      onScanComplete?.(response.transaction)
    },
    onError: (error: any) => {
      toast.error('Failed to submit scan', {
        description: error.message || 'Please try again',
      })
    },
  })

  // Auto-lookup on valid code
  async function lookupProduct(code: string) {
    setLoading(true)
    setError(null)
    setProduct(null)
    try {
      const prod = await productsApi.getProduct(code)
      setProduct(prod)
    } catch (err: any) {
      setError('Product not found')
    } finally {
      setLoading(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase()
    setValue('productCode', value, { shouldValidate: true })
    if (productCodeSchema.safeParse(value).success) {
      lookupProduct(value)
    } else {
      setProduct(null)
      setError(null)
    }
  }

  // Handle quantity adjustment
  const adjustQuantity = (increment: number) => {
    const newQty = Math.max(1, Math.min(9999, quantity + increment))
    setValue('quantity', newQty)
  }

  // Show keypad on mobile/touch focus
  function handleQuantityFocus() {
    if (isMobile()) setShowKeypad(true)
  }

  // Form submission
  const onSubmit = async (values: FormValues) => {
    if (!product) {
      toast.error('Please enter a valid product code')
      return
    }

    // Show confirmation for large quantity changes
    if (quantity > 100) {
      setPendingSubmit(values)
      setShowConfirmDialog(true)
      return
    }

    await submitScan(values)
  }

  // Optimistic scan submit
  const submitScan = async (values: FormValues) => {
    setSubmitting(true)
    const optimisticScan = {
      id: Date.now().toString(),
      productCode: product!.productCode,
      quantityScanned: values.quantity,
      transactionType: values.transactionType,
      scannedBy: 'Current User',
      createdAt: new Date().toISOString(),
      optimistic: true,
    }
    setOptimisticScans((prev) => [optimisticScan, ...prev])
    try {
      await productsApi.submitScan(product!.productCode, {
        productCode: product!.productCode,
        quantityScanned: values.quantity,
        transactionType: values.transactionType,
        scannedBy: 'Current User',
      })
      setValue('productCode', '')
      setValue('quantity', 1)
      setProduct(null)
      setError(null)
      // Remove optimistic scan
      setOptimisticScans((prev) => prev.filter((s) => s.id !== optimisticScan.id))
    } catch (err: any) {
      // If offline, queue for later
      if (!navigator.onLine) {
        await addOfflineScan({ ...optimisticScan })
        toast('Scan queued for sync when online')
      } else {
        toast.error(err.message || 'Failed to submit scan')
      }
      // Remove optimistic scan
      setOptimisticScans((prev) => prev.filter((s) => s.id !== optimisticScan.id))
    } finally {
      setSubmitting(false)
      setShowConfirmDialog(false)
      setPendingSubmit(null)
    }
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto scanner-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Product Scanner
          </CardTitle>
          <CardDescription>
            Scan or enter product code to update inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Code Input */}
            <div className="space-y-2">
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                placeholder="ABC123"
                {...register('productCode')}
                onChange={onInputChange}
                className={`scanner-input ${
                  errors.productCode
                    ? 'border-destructive focus-visible:ring-destructive'
                    : product
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : ''
                }`}
                maxLength={6}
              />
              {errors.productCode && (
                <p className="text-sm text-destructive">
                  {errors.productCode.message}
                </p>
              )}
            </div>

            {/* Product Info Display */}
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

              {error && !loading && (
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

            {/* Quantity Input with NumericKeypad */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustQuantity(-10)}
                  disabled={quantity <= 10}
                  className="h-12 w-12"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustQuantity(-1)}
                  disabled={quantity <= 1}
                  className="h-12 w-12"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  className="text-center text-lg font-semibold h-12 w-20 scanner-input"
                  min={1}
                  max={9999}
                  ref={quantityInputRef}
                  onFocus={handleQuantityFocus}
                  readOnly={isMobile()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustQuantity(1)}
                  disabled={quantity >= 9999}
                  className="h-12 w-12"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => adjustQuantity(10)}
                  disabled={quantity >= 9990}
                  className="h-12 w-12"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <NumericKeypad
              isVisible={showKeypad}
              onClose={() => setShowKeypad(false)}
              onNumberPress={(num) => setValue('quantity', Math.max(1, Math.min(9999, (quantity * 10 + num))))}
              onBackspace={() => setValue('quantity', Math.floor(quantity / 10) || 1)}
              onEnter={() => setShowKeypad(false)}
            />

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select
                value={transactionType.toString()}
                onValueChange={(value) => 
                  setValue('transactionType', parseInt(value) as TransactionType)
                }
              >
                <SelectTrigger id="transactionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionType.StockCount.toString()}>
                    Stock Count
                  </SelectItem>
                  <SelectItem value={TransactionType.Adjustment.toString()}>
                    Adjustment
                  </SelectItem>
                  <SelectItem value={TransactionType.Receiving.toString()}>
                    Receiving
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-lg scanner-button"
              disabled={!product || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Scan'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Large Quantity Changes */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Large Quantity Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit a scan with quantity {pendingSubmit?.quantity}. This is a significant change. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingSubmit && submitScan(pendingSubmit)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}