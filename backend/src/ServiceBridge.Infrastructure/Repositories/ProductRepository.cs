using Microsoft.EntityFrameworkCore;
using ServiceBridge.Domain.Entities;
using ServiceBridge.Domain.Interfaces;
using ServiceBridge.Infrastructure.Data;

namespace ServiceBridge.Infrastructure.Repositories;

public class ProductRepository : RepositoryBase<Product>, IProductRepository
{
    public ProductRepository(ServiceBridgeDbContext context) : base(context)
    {
    }

    public async Task<Product?> GetByProductCodeAsync(string productCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.ScanTransactions)
            .FirstOrDefaultAsync(p => p.ProductCode == productCode.ToUpper(), cancellationToken);
    }

    public async Task<IEnumerable<Product>> GetLowStockProductsAsync(decimal daysThreshold = 7, CancellationToken cancellationToken = default)
    {
        var products = await _dbSet
            .Where(p => p.AverageMonthlyConsumption > 0)
            .ToListAsync(cancellationToken);
            
        return products
            .Where(p => p.DaysCoverRemaining < daysThreshold)
            .OrderBy(p => p.DaysCoverRemaining)
            .ToList();
    }

    public async Task<IEnumerable<Product>> GetOverstockedProductsAsync(decimal daysThreshold = 60, CancellationToken cancellationToken = default)
    {
        var products = await _dbSet
            .Where(p => p.AverageMonthlyConsumption > 0)
            .ToListAsync(cancellationToken);
            
        return products
            .Where(p => p.DaysCoverRemaining > daysThreshold)
            .OrderByDescending(p => p.DaysCoverRemaining)
            .ToList();
    }

    public async Task<IEnumerable<Product>> SearchByDescriptionAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return await GetAllAsync(cancellationToken);
        }

        var normalizedSearchTerm = searchTerm.ToLower();
        return await _dbSet
            .Where(p => p.Description.ToLower().Contains(normalizedSearchTerm) || 
                       p.ProductCode.ToLower().Contains(normalizedSearchTerm))
            .OrderBy(p => p.ProductCode)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Product>> GetProductsRequiringReorderAsync(CancellationToken cancellationToken = default)
    {
        var products = await _dbSet
            .Where(p => p.AverageMonthlyConsumption > 0)
            .ToListAsync(cancellationToken);
            
        return products
            .Where(p => p.QuantityOnHand <= p.ReorderPoint)
            .OrderBy(p => p.DaysCoverRemaining)
            .ToList();
    }

    public async Task<bool> ProductCodeExistsAsync(string productCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(p => p.ProductCode == productCode.ToUpper(), cancellationToken);
    }

    public async Task<int> GetTotalProductCountAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.CountAsync(cancellationToken);
    }

    public override async Task<IEnumerable<Product>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .OrderBy(p => p.ProductCode)
            .ToListAsync(cancellationToken);
    }
}