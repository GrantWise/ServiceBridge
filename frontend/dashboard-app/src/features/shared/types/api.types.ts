// Product Types
export interface Product {
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
  stockStatus: StockStatus;
}

export enum StockStatus {
  Normal = 0,
  Low = 1,
  Critical = 2,
  Overstock = 3
}

export enum TransactionType {
  StockCount = 0,
  Adjustment = 1,
  Receiving = 2
}

// API Request/Response Types
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetProductsQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  stockStatus?: StockStatus;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface UpdateProductRequest {
  productCode: string;
  description?: string;
  quantityOnHand?: number;
  averageMonthlyConsumption?: number;
  leadTimeDays?: number;
  quantityOnOrder?: number;
  updatedBy?: string;
}

export interface UpdateProductResponse {
  success: boolean;
  message: string;
  updatedProduct?: Product;
}

export interface BulkUpdateRequest {
  products: UpdateProductRequest[];
  updatedBy?: string;
}

export interface BulkUpdateResponse {
  successfulUpdates: number;
  results: Array<{
    productCode: string;
    success: boolean;
    message: string;
  }>;
}

export interface CreateScanRequest {
  quantityScanned: number;
  transactionType: TransactionType;
  scannedBy: string;
  notes?: string;
}

export interface CreateScanResponse {
  success: boolean;
  message: string;
  transactionId: number;
  previousQuantity: number;
  newQuantity: number;
  scanDateTime: string;
}

// Scan Transaction Types
export interface ScanTransaction {
  id: number;
  productCode: string;
  quantityScanned: number;
  transactionType: TransactionType;
  scanDateTime: string;
  scannedBy: string;
  notes?: string;
  product?: Product;
}

export interface GetTransactionsQuery {
  pageNumber?: number;
  pageSize?: number;
  productCode?: string;
  startDate?: string;
  endDate?: string;
  transactionType?: TransactionType;
  scannedBy?: string;
}

// API Error Types
export interface ApiError {
  message: string;
  details?: string;
  errors?: Record<string, string[]>;
}

// Common API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError;
}