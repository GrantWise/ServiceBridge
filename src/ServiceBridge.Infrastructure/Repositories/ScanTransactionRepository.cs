using Microsoft.EntityFrameworkCore;
using ServiceBridge.Domain.Entities;
using ServiceBridge.Domain.Interfaces;
using ServiceBridge.Infrastructure.Data;

namespace ServiceBridge.Infrastructure.Repositories;

public class ScanTransactionRepository : RepositoryBase<ScanTransaction>, IScanTransactionRepository
{
    public ScanTransactionRepository(ServiceBridgeDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ScanTransaction>> GetByProductCodeAsync(string productCode, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(st => st.Product)
            .Where(st => st.ProductCode == productCode.ToUpper())
            .OrderByDescending(st => st.ScanDateTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ScanTransaction>> GetRecentTransactionsAsync(int count = 10, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(st => st.Product)
            .OrderByDescending(st => st.ScanDateTime)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ScanTransaction>> GetTransactionsByUserAsync(string userId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(st => st.Product)
            .Where(st => st.ScannedBy == userId);

        if (fromDate.HasValue)
        {
            query = query.Where(st => st.ScanDateTime >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(st => st.ScanDateTime <= toDate.Value);
        }

        return await query
            .OrderByDescending(st => st.ScanDateTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ScanTransaction>> GetTransactionsByTypeAsync(TransactionType transactionType, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(st => st.Product)
            .Where(st => st.TransactionType == transactionType);

        if (fromDate.HasValue)
        {
            query = query.Where(st => st.ScanDateTime >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(st => st.ScanDateTime <= toDate.Value);
        }

        return await query
            .OrderByDescending(st => st.ScanDateTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ScanTransaction>> GetTransactionsByDateRangeAsync(DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(st => st.Product)
            .Where(st => st.ScanDateTime >= fromDate && st.ScanDateTime <= toDate)
            .OrderByDescending(st => st.ScanDateTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTransactionCountTodayAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        return await _dbSet
            .CountAsync(st => st.ScanDateTime >= today && st.ScanDateTime < tomorrow, cancellationToken);
    }

    public async Task<int> GetScanCountByUserTodayAsync(string userId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        return await _dbSet
            .CountAsync(st => st.ScannedBy == userId && 
                             st.ScanDateTime >= today && 
                             st.ScanDateTime < tomorrow, cancellationToken);
    }
}