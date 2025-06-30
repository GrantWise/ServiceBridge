// Product Types
export interface Product {
  productCode: string;
  name?: string; // Display name for the product
  description: string;
  quantityOnHand: number;
  stockLevel?: number; // Alias for quantityOnHand for compatibility
  price?: number; // Sale price
  costPrice?: number; // Cost price
  averageMonthlyConsumption: number;
  leadTimeDays: number;
  quantityOnOrder: number;
  minStockLevel?: number; // Minimum stock level
  maxStockLevel?: number; // Maximum stock level
  lastUpdated: string;
  lastUpdatedBy: string;
  daysCoverRemaining: number;
  reorderPoint: number;
  stockStatus: StockStatus;
  category?: string; // Product category
  supplier?: string; // Supplier name
  location?: string; // Storage location
  createdAt?: string;
  updatedAt?: string;
}

export enum StockStatus {
  OutOfStock = 0,
  LowStock = 1,
  InStock = 2,
  Overstocked = 3,
  Discontinued = 4,
  // Legacy compatibility
  Low = 1,
  Adequate = 2,
}

export enum TransactionType {
  StockIn = 0,
  StockOut = 1,
  StockAdjustment = 2,
  StockTransfer = 3,
  // Legacy compatibility
  StockCount = 0,
  Adjustment = 2,
  Receiving = 0
}

// API Request/Response Types
export interface PaginatedResponse<T> {
  data: T[];
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
  productCode?: string;
  name?: string;
  description?: string;
  quantityOnHand?: number;
  stockLevel?: number; // Alias for quantityOnHand
  price?: number;
  costPrice?: number;
  averageMonthlyConsumption?: number;
  leadTimeDays?: number;
  quantityOnOrder?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  stockStatus?: StockStatus;
  category?: string;
  supplier?: string;
  location?: string;
  updatedBy?: string;
}

export interface UpdateProductResponse {
  success: boolean;
  message: string;
  updatedProduct?: Product;
}

export interface BulkUpdateRequest {
  updates: UpdateProductRequest[];
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
  quantity?: number; // New field name
  quantityScanned?: number; // Legacy compatibility
  transactionType: TransactionType;
  scannedBy?: string;
  notes?: string;
  location?: string;
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