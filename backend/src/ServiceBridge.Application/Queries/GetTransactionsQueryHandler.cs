using AutoMapper;
using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Domain.Entities;
using ServiceBridge.Domain.Interfaces;
using System.Linq.Expressions;

namespace ServiceBridge.Application.Queries;

public class GetTransactionsQueryHandler : IRequestHandler<GetTransactionsQuery, PaginatedResponse<ScanTransactionDto>>
{
    private readonly IScanTransactionRepository _scanTransactionRepository;
    private readonly IMapper _mapper;

    public GetTransactionsQueryHandler(IScanTransactionRepository scanTransactionRepository, IMapper mapper)
    {
        _scanTransactionRepository = scanTransactionRepository;
        _mapper = mapper;
    }

    public async Task<PaginatedResponse<ScanTransactionDto>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        // Validate pagination parameters
        request.Validate();

        IEnumerable<ScanTransaction> transactions;

        // Handle specific query types that can use optimized repository methods
        if (request.RecentOnly)
        {
            transactions = await _scanTransactionRepository.GetRecentTransactionsAsync(
                request.RecentCount, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(request.ProductCode))
        {
            transactions = await _scanTransactionRepository.GetByProductCodeAsync(
                request.ProductCode, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(request.UserId))
        {
            transactions = await _scanTransactionRepository.GetTransactionsByUserAsync(
                request.UserId, request.FromDate, request.ToDate, cancellationToken);
        }
        else if (request.TransactionType.HasValue)
        {
            transactions = await _scanTransactionRepository.GetTransactionsByTypeAsync(
                request.TransactionType.Value, request.FromDate, request.ToDate, cancellationToken);
        }
        else if (request.FromDate.HasValue && request.ToDate.HasValue)
        {
            transactions = await _scanTransactionRepository.GetTransactionsByDateRangeAsync(
                request.FromDate.Value, request.ToDate.Value, cancellationToken);
        }
        else
        {
            // General query - use pagination with filters
            var filter = BuildFilterExpression(request);
            var orderBy = BuildOrderByExpression(request);
            
            transactions = await _scanTransactionRepository.GetPagedAsync(
                request.PageNumber, 
                request.PageSize, 
                filter, 
                orderBy, 
                cancellationToken);
        }

        // Apply additional filtering if needed (for cases where we got all results first)
        var filteredTransactions = ApplyAdditionalFilters(transactions, request);

        // Apply pagination if not already done
        var pagedTransactions = ApplyPagination(filteredTransactions, request);

        // Get total count for pagination
        var totalCount = request.RecentOnly ? pagedTransactions.Count() : filteredTransactions.Count();

        // Map to DTOs
        var transactionDtos = _mapper.Map<List<ScanTransactionDto>>(pagedTransactions);

        return new PaginatedResponse<ScanTransactionDto>
        {
            Data = transactionDtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            SearchQuery = request.SearchQuery,
            Filters = BuildFiltersMetadata(request)
        };
    }

    private Expression<Func<ScanTransaction, bool>>? BuildFilterExpression(GetTransactionsQuery request)
    {
        Expression<Func<ScanTransaction, bool>>? filter = null;

        // Search by product code or notes
        if (!string.IsNullOrWhiteSpace(request.SearchQuery))
        {
            var searchTerm = request.SearchQuery.ToLower();
            filter = CombineFilters(filter, t => 
                t.ProductCode.ToLower().Contains(searchTerm) || 
                (t.Notes != null && t.Notes.ToLower().Contains(searchTerm)));
        }

        // Filter by product code
        if (!string.IsNullOrWhiteSpace(request.ProductCode))
        {
            filter = CombineFilters(filter, t => t.ProductCode == request.ProductCode);
        }

        // Filter by user
        if (!string.IsNullOrWhiteSpace(request.UserId))
        {
            filter = CombineFilters(filter, t => t.ScannedBy == request.UserId);
        }

        // Filter by transaction type
        if (request.TransactionType.HasValue)
        {
            filter = CombineFilters(filter, t => t.TransactionType == request.TransactionType.Value);
        }

        // Filter by date range
        if (request.FromDate.HasValue)
        {
            filter = CombineFilters(filter, t => t.ScanDateTime >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            filter = CombineFilters(filter, t => t.ScanDateTime <= request.ToDate.Value);
        }

        return filter;
    }

    private Func<IQueryable<ScanTransaction>, IOrderedQueryable<ScanTransaction>> BuildOrderByExpression(GetTransactionsQuery request)
    {
        return request.SortBy?.ToLower() switch
        {
            "scandatetime" => query => request.SortDescending 
                ? query.OrderByDescending(t => t.ScanDateTime) 
                : query.OrderBy(t => t.ScanDateTime),
            "productcode" => query => request.SortDescending 
                ? query.OrderByDescending(t => t.ProductCode) 
                : query.OrderBy(t => t.ProductCode),
            "quantityscanned" => query => request.SortDescending 
                ? query.OrderByDescending(t => t.QuantityScanned) 
                : query.OrderBy(t => t.QuantityScanned),
            "scannedby" => query => request.SortDescending 
                ? query.OrderByDescending(t => t.ScannedBy) 
                : query.OrderBy(t => t.ScannedBy),
            "transactiontype" => query => request.SortDescending 
                ? query.OrderByDescending(t => t.TransactionType) 
                : query.OrderBy(t => t.TransactionType),
            _ => query => query.OrderByDescending(t => t.ScanDateTime) // Default: newest first
        };
    }

    private IEnumerable<ScanTransaction> ApplyAdditionalFilters(IEnumerable<ScanTransaction> transactions, GetTransactionsQuery request)
    {
        var query = transactions.AsQueryable();

        // Apply search filter if needed
        if (!string.IsNullOrWhiteSpace(request.SearchQuery))
        {
            var searchTerm = request.SearchQuery.ToLower();
            query = query.Where(t => 
                t.ProductCode.ToLower().Contains(searchTerm) || 
                (t.Notes != null && t.Notes.ToLower().Contains(searchTerm)));
        }

        return query;
    }

    private IEnumerable<ScanTransaction> ApplyPagination(IEnumerable<ScanTransaction> transactions, GetTransactionsQuery request)
    {
        if (request.RecentOnly)
        {
            return transactions; // Already limited by RecentCount
        }

        return transactions
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize);
    }

    private Expression<Func<ScanTransaction, bool>>? CombineFilters(
        Expression<Func<ScanTransaction, bool>>? existing, 
        Expression<Func<ScanTransaction, bool>> additional)
    {
        if (existing == null)
            return additional;

        // Combine expressions using AND logic
        var parameter = Expression.Parameter(typeof(ScanTransaction));
        var existingBody = Expression.Invoke(existing, parameter);
        var additionalBody = Expression.Invoke(additional, parameter);
        var combined = Expression.AndAlso(existingBody, additionalBody);
        
        return Expression.Lambda<Func<ScanTransaction, bool>>(combined, parameter);
    }

    private Dictionary<string, object> BuildFiltersMetadata(GetTransactionsQuery request)
    {
        var filters = new Dictionary<string, object>();
        
        if (!string.IsNullOrWhiteSpace(request.ProductCode))
            filters["ProductCode"] = request.ProductCode;
        
        if (!string.IsNullOrWhiteSpace(request.UserId))
            filters["UserId"] = request.UserId;
        
        if (request.TransactionType.HasValue)
            filters["TransactionType"] = request.TransactionType.Value.ToString();
        
        if (request.FromDate.HasValue)
            filters["FromDate"] = request.FromDate.Value.ToString("yyyy-MM-dd");
        
        if (request.ToDate.HasValue)
            filters["ToDate"] = request.ToDate.Value.ToString("yyyy-MM-dd");
        
        if (request.RecentOnly)
            filters["RecentOnly"] = request.RecentCount;

        return filters;
    }
}