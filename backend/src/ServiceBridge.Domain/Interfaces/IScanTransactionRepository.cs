using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Domain.Interfaces;

public interface IScanTransactionRepository : IRepository<ScanTransaction>
{
    Task<IEnumerable<ScanTransaction>> GetByProductCodeAsync(string productCode, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScanTransaction>> GetRecentTransactionsAsync(int count = 10, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScanTransaction>> GetTransactionsByUserAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScanTransaction>> GetTransactionsByTypeAsync(TransactionType transactionType, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<ScanTransaction>> GetTransactionsByDateRangeAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);
    Task<int> GetTransactionCountTodayAsync(CancellationToken cancellationToken = default);
    Task<int> GetScanCountByUserTodayAsync(string userId, CancellationToken cancellationToken = default);
}