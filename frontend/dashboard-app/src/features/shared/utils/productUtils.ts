import { Product } from '../types/api.types';

/**
 * Utility functions for handling product data compatibility
 */

export function getProductName(product: Product): string {
  return product.name || product.description || product.productCode;
}

export function getStockLevel(product: Product): number {
  return product.stockLevel ?? product.quantityOnHand;
}

export function setStockLevel(product: Product, value: number): Partial<Product> {
  return {
    stockLevel: value,
    quantityOnHand: value, // Keep both for compatibility
  };
}

export function getProductPrice(product: Product): number {
  return product.price || 0;
}

export function getProductCostPrice(product: Product): number {
  return product.costPrice || 0;
}

export function getMinStockLevel(product: Product): number {
  return product.minStockLevel || product.reorderPoint || 0;
}

export function getMaxStockLevel(product: Product): number {
  return product.maxStockLevel || 100;
}

export function getProductCategory(product: Product): string {
  return product.category || '';
}

export function getProductSupplier(product: Product): string {
  return product.supplier || '';
}

export function getProductLocation(product: Product): string {
  return product.location || '';
}

/**
 * Converts a product object to be compatible with both old and new API formats
 */
export function normalizeProduct(product: Partial<Product>): Partial<Product> {
  const normalized = { ...product };
  
  // Ensure stockLevel and quantityOnHand are in sync
  if (normalized.stockLevel !== undefined) {
    normalized.quantityOnHand = normalized.stockLevel;
  } else if (normalized.quantityOnHand !== undefined) {
    normalized.stockLevel = normalized.quantityOnHand;
  }
  
  // Ensure name is set (fallback to description)
  if (!normalized.name && normalized.description) {
    normalized.name = normalized.description;
  }
  
  return normalized;
}

/**
 * Creates a display-friendly product object
 */
export function getDisplayProduct(product: Product): Product & {
  displayName: string;
  displayStockLevel: number;
  displayPrice: number;
  displayCostPrice: number;
  displayMinStock: number;
  displayMaxStock: number;
  displayCategory: string;
  displaySupplier: string;
  displayLocation: string;
} {
  return {
    ...product,
    displayName: getProductName(product),
    displayStockLevel: getStockLevel(product),
    displayPrice: getProductPrice(product),
    displayCostPrice: getProductCostPrice(product),
    displayMinStock: getMinStockLevel(product),
    displayMaxStock: getMaxStockLevel(product),
    displayCategory: getProductCategory(product),
    displaySupplier: getProductSupplier(product),
    displayLocation: getProductLocation(product),
  };
}