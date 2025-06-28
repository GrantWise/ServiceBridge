/**
 * API Type Definitions
 * Following Interface Segregation Principle - separate interfaces for different concerns
 */

// Domain Entities - matching backend DTOs
export interface Product {
  productCode: string;
  description: string;
  quantityOnHand: number;
  averageMonthlyConsumption: number;
  leadTimeDays: number;
  quantityOnOrder: number;
  lastUpdated: string;
  lastUpdatedBy: string;
  daysCoverRemaining: number | null;
  reorderPoint: number;
  stockStatus: StockStatus;
}

export interface ScanTransaction {
  id: number;
  productCode: string;
  quantityScanned: number;
  previousQuantity: number;
  newQuantity: number;
  scanDateTime: string;
  scannedBy: string;
  transactionType: TransactionType;
  notes?: string;
}

export interface LiveMetrics {
  serverTime: string;
  activeConnections: number;
  totalRequestsToday: number;
  totalScansToday: number;
  memoryUsageMb: number;
}

// Enums - matching backend numeric values
export enum StockStatus {
  Low = 0,
  Adequate = 1,
  Overstocked = 2,
}

export enum TransactionType {
  StockCount = 0,
  Adjustment = 1,
  Receiving = 2,
}

// Request/Response DTOs
export interface CreateScanRequest {
  productCode: string;
  quantityScanned: number;
  transactionType: TransactionType;
  scannedBy: string;
  notes?: string;
}

export interface CreateScanResponse {
  success: boolean;
  transaction: ScanTransaction;
  updatedProduct: Product;
  message?: string;
}

export interface UpdateProductRequest {
  quantityOnHand?: number;
  averageMonthlyConsumption?: number;
  leadTimeDays?: number;
  quantityOnOrder?: number;
}

export interface UpdateProductResponse {
  success: boolean;
  product: Product;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Query Parameters
export interface ProductsQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  stockStatus?: StockStatus;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface TransactionsQueryParams {
  pageNumber?: number;
  pageSize?: number;
  productCode?: string;
  userId?: string;
  transactionType?: TransactionType;
  fromDate?: string;
  toDate?: string;
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken?: string; // Optional - backend doesn't provide this
  expiresIn?: number; // Optional - backend provides expiresAt instead
  expiresAt?: string; // Backend provides this
  user: User;
  message?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  permissions: string[];
}

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Scanner = 'Scanner',
  Viewer = 'Viewer'
}

// API Error Response
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}