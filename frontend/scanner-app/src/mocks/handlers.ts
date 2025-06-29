import { http, HttpResponse } from 'msw';
import { Product, ScanTransaction, LiveMetrics, CreateScanRequest, LoginRequest } from '../types/api';

// Mock data
const mockProducts: Product[] = [
  {
    productCode: 'ABC123',
    description: 'Widget A - Large Blue',
    quantityOnHand: 150,
    averageMonthlyConsumption: 50,
    leadTimeDays: 14,
    quantityOnOrder: 100,
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: 'system',
    daysCoverRemaining: 90,
    reorderPoint: 23,
    stockStatus: 1,
  },
  {
    productCode: 'DEF456',
    description: 'Gadget B - Small Red',
    quantityOnHand: 25,
    averageMonthlyConsumption: 100,
    leadTimeDays: 7,
    quantityOnOrder: 0,
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: 'system',
    daysCoverRemaining: 7,
    reorderPoint: 23,
    stockStatus: 0,
  },
];

const mockTransactions: ScanTransaction[] = [
  {
    id: 1,
    productCode: 'ABC123',
    quantityScanned: 150,
    previousQuantity: 200,
    newQuantity: 150,
    scanDateTime: new Date().toISOString(),
    scannedBy: 'Test User',
    transactionType: 0,
    notes: 'Regular stock count',
  },
];

const mockMetrics: LiveMetrics = {
  serverTime: new Date().toISOString(),
  activeConnections: 5,
  totalRequestsToday: 150,
  totalScansToday: 45,
  memoryUsageMb: 256.5,
};

// Request handlers
export const handlers = [
  // Products endpoints
  http.get('/api/v1/products', ({ request }) => {
    const url = new URL(request.url);
    const pageNumber = parseInt(url.searchParams.get('pageNumber') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    return HttpResponse.json({
      data: mockProducts,
      totalCount: mockProducts.length,
      pageNumber,
      pageSize,
      totalPages: Math.ceil(mockProducts.length / pageSize),
      hasNextPage: false,
      hasPreviousPage: false,
    });
  }),

  http.get('/api/v1/products/:code', ({ params }) => {
    const product = mockProducts.find(p => p.productCode === params.code);
    
    if (!product) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(product);
  }),

  http.post('/api/v1/products/:code/scan', async ({ request, params }) => {
    const body = await request.json() as CreateScanRequest;
    const product = mockProducts.find(p => p.productCode === params.code);
    
    if (!product) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    const transaction: ScanTransaction = {
      id: Date.now(),
      productCode: params.code as string,
      quantityScanned: body.quantityScanned,
      previousQuantity: product.quantityOnHand,
      newQuantity: body.quantityScanned,
      scanDateTime: new Date().toISOString(),
      scannedBy: body.scannedBy,
      transactionType: body.transactionType,
      notes: body.notes,
    };

    // Update product quantity
    product.quantityOnHand = body.quantityScanned;
    product.lastUpdated = new Date().toISOString();
    product.lastUpdatedBy = body.scannedBy;

    return HttpResponse.json({
      success: true,
      transaction,
      updatedProduct: product,
      message: 'Scan completed successfully',
    });
  }),

  // Transactions endpoints
  http.get('/api/v1/transactions/recent', () => {
    return HttpResponse.json(mockTransactions.slice(0, 5));
  }),

  // Metrics endpoints
  http.get('/api/v1/metrics/live', () => {
    return HttpResponse.json({
      ...mockMetrics,
      serverTime: new Date().toISOString(),
    });
  }),

  // Auth endpoints
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as LoginRequest;
    
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        token: 'mock-jwt-token',
        user: {
          id: '1',
          username: 'Test User',
          role: 'Scanner',
        },
      });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),
];