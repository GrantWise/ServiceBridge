import { z } from 'zod';

/**
 * Business Rule Validation Utilities
 * Following Single Responsibility Principle - each function validates one thing
 */

// Product code validation schema
export const productCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}\d{3}$/, 'Product code must be 3 letters followed by 3 numbers')
  .transform(val => val.toUpperCase());

// Quantity validation schema
export const quantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .min(0, 'Quantity cannot be negative')
  .max(99999, 'Quantity cannot exceed 99,999');

// Lead time validation schema
export const leadTimeSchema = z
  .number()
  .int('Lead time must be in whole days')
  .min(1, 'Lead time must be at least 1 day')
  .max(365, 'Lead time cannot exceed 365 days');

// Monthly consumption validation schema
export const monthlyConsumptionSchema = z
  .number()
  .min(0, 'Monthly consumption cannot be negative')
  .max(999999, 'Monthly consumption is too high');

// Scan notes validation schema
export const scanNotesSchema = z
  .string()
  .max(500, 'Notes cannot exceed 500 characters')
  .optional();

// Create scan request validation schema
export const createScanRequestSchema = z.object({
  productCode: productCodeSchema,
  quantityScanned: quantitySchema,
  transactionType: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  scannedBy: z.string().min(1, 'Scanner name is required'),
  notes: scanNotesSchema,
});

// Update product request validation schema
export const updateProductRequestSchema = z.object({
  quantityOnHand: quantitySchema.optional(),
  averageMonthlyConsumption: monthlyConsumptionSchema.optional(),
  leadTimeDays: leadTimeSchema.optional(),
  quantityOnOrder: quantitySchema.optional(),
});

// Login request validation schema
export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Validation helper functions
 */
export const isValidProductCode = (code: string): boolean => {
  try {
    productCodeSchema.parse(code);
    return true;
  } catch {
    return false;
  }
};

export const validateQuantity = (quantity: number, allowNegative = false): { 
  isValid: boolean; 
  error?: string 
} => {
  try {
    if (allowNegative) {
      z.number().int('Quantity must be a whole number').parse(quantity);
    } else {
      quantitySchema.parse(quantity);
    }
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid quantity' };
  }
};

export const validateScanNotes = (notes: string): { 
  isValid: boolean; 
  error?: string 
} => {
  try {
    scanNotesSchema.parse(notes);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid notes' };
  }
};

/**
 * Business calculation utilities
 */
export const calculateDaysCover = (
  quantityOnHand: number,
  averageMonthlyConsumption: number
): number | null => {
  if (averageMonthlyConsumption <= 0) return null;
  const dailyConsumption = averageMonthlyConsumption / 30;
  return Math.round(quantityOnHand / dailyConsumption);
};

export const calculateReorderPoint = (
  averageMonthlyConsumption: number,
  leadTimeDays: number
): number => {
  const dailyConsumption = averageMonthlyConsumption / 30;
  return Math.ceil(dailyConsumption * leadTimeDays);
};

export const getStockStatusColor = (stockStatus: number): string => {
  switch (stockStatus) {
    case 0: // Low
      return 'text-red-600 bg-red-50';
    case 1: // Adequate
      return 'text-green-600 bg-green-50';
    case 2: // Overstocked
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getTransactionTypeLabel = (type: number): string => {
  switch (type) {
    case 0:
      return 'Stock Count';
    case 1:
      return 'Adjustment';
    case 2:
      return 'Receiving';
    default:
      return 'Unknown';
  }
};