// gRPC Generated Types (placeholder until proto compilation is set up)
// These would normally be generated from .proto files

export interface InventoryProductResponse {
  productCode: string;
  description: string;
  quantityOnHand: number;
  averageMonthlyConsumption: number;
  leadTimeDays: number;
  quantityOnOrder: number;
  lastUpdated: string;
  lastUpdatedBy: string;
  daysCoverRemaining: number;
  reorderPoint: number;
  stockStatus: number;
}

export interface ProcessScanRequest {
  productCode: string;
  quantityScanned: number;
  transactionType: number; // 0=StockCount, 1=Adjustment, 2=Receiving
  scannedBy: string;
  notes?: string;
}

export interface ProcessScanResponse {
  success: boolean;
  message: string;
  transactionId: string;
  previousQuantity: number;
  newQuantity: number;
  scanDateTime: string;
}

export interface UpdateProductRequest {
  productCode: string;
  description?: string;
  quantityOnHand?: number;
  averageMonthlyConsumption?: number;
  leadTimeDays?: number;
  quantityOnOrder?: number;
  updatedBy: string;
}

export interface UpdateProductResponse {
  success: boolean;
  message: string;
  updatedProduct?: InventoryProductResponse;
}

export interface BulkUpdateRequest {
  updates: Array<{
    productCode: string;
    description?: string;
    quantityOnHand?: number;
    averageMonthlyConsumption?: number;
    leadTimeDays?: number;
    quantityOnOrder?: number;
  }>;
  updatedBy: string;
}

export interface BulkUpdateResponse {
  updatedCount: number;
  errors: string[];
}

export interface BulkScanRequest {
  scans: Array<{
    productCode: string;
    quantity: number;
    notes?: string;
  }>;
  scannedBy: string;
}

export interface BulkScanResponse {
  processedCount: number;
  errors: string[];
}

// Product Service Types (placeholder)
export interface ProductCalculationRequest {
  productCode: string;
  currentQuantity: number;
  averageConsumption: number;
  leadTimeDays: number;
}

export interface ProductCalculationResponse {
  daysCoverRemaining: number;
  reorderPoint: number;
  stockStatus: number;
  recommendedOrderQuantity: number;
}

// Metrics Service Types (placeholder)
export interface MetricsRequest {
  startDate?: string;
  endDate?: string;
  includeProductDetails?: boolean;
}

export interface MetricsResponse {
  totalProducts: number;
  lowStockProducts: number;
  criticalStockProducts: number;
  averageDaysCover: number;
  topMovingProducts: Array<{
    productCode: string;
    transactionCount: number;
    volumeChange: number;
  }>;
  inventoryValue: number;
  turnoverRate: number;
}