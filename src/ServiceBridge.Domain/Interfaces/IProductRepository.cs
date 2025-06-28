using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Domain.Interfaces;

public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetByProductCodeAsync(string productCode, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> GetLowStockProductsAsync(decimal daysThreshold = 7, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> GetOverstockedProductsAsync(decimal daysThreshold = 60, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> SearchByDescriptionAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> GetProductsRequiringReorderAsync(CancellationToken cancellationToken = default);
    Task<bool> ProductCodeExistsAsync(string productCode, CancellationToken cancellationToken = default);
    Task<int> GetTotalProductCountAsync(CancellationToken cancellationToken = default);
}