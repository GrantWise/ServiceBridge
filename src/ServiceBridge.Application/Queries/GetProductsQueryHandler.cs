using AutoMapper;
using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Domain.Entities;
using ServiceBridge.Domain.Interfaces;
using System.Linq.Expressions;

namespace ServiceBridge.Application.Queries;

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PaginatedResponse<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IMapper _mapper;

    public GetProductsQueryHandler(IProductRepository productRepository, IMapper mapper)
    {
        _productRepository = productRepository;
        _mapper = mapper;
    }

    public async Task<PaginatedResponse<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        // Validate pagination parameters
        request.Validate();

        // Build filter expression
        Expression<Func<Product, bool>>? filter = BuildFilterExpression(request);

        // Build ordering expression
        Func<IQueryable<Product>, IOrderedQueryable<Product>> orderBy = BuildOrderByExpression(request);

        // Get paginated products
        var products = await _productRepository.GetPagedAsync(
            request.PageNumber, 
            request.PageSize, 
            filter, 
            orderBy, 
            cancellationToken);

        // Get total count for pagination
        var totalCount = await _productRepository.CountAsync(filter, cancellationToken);

        // Map to DTOs
        var productDtos = _mapper.Map<List<ProductDto>>(products);

        return new PaginatedResponse<ProductDto>
        {
            Data = productDtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            SearchQuery = request.SearchQuery,
            Filters = BuildFiltersMetadata(request)
        };
    }

    private Expression<Func<Product, bool>>? BuildFilterExpression(GetProductsQuery request)
    {
        Expression<Func<Product, bool>>? filter = null;

        // Search by description or product code
        if (!string.IsNullOrWhiteSpace(request.SearchQuery))
        {
            var searchTerm = request.SearchQuery.ToLower();
            filter = CombineFilters(filter, p => 
                p.ProductCode.ToLower().Contains(searchTerm) || 
                p.Description.ToLower().Contains(searchTerm));
        }

        // Filter by stock status
        if (request.StockStatusFilter.HasValue)
        {
            filter = CombineFilters(filter, p => p.StockStatus == request.StockStatusFilter.Value);
        }

        // Filter for low stock only
        if (request.LowStockOnly == true)
        {
            filter = CombineFilters(filter, p => p.StockStatus == StockStatus.Low);
        }

        // Filter for overstocked only
        if (request.OverstockedOnly == true)
        {
            filter = CombineFilters(filter, p => p.StockStatus == StockStatus.Overstocked);
        }

        // Filter for products requiring reorder
        if (request.RequiresReorder == true)
        {
            filter = CombineFilters(filter, p => p.QuantityOnHand <= p.ReorderPoint);
        }

        return filter;
    }

    private Func<IQueryable<Product>, IOrderedQueryable<Product>> BuildOrderByExpression(GetProductsQuery request)
    {
        return request.SortBy?.ToLower() switch
        {
            "productcode" => query => request.SortDescending 
                ? query.OrderByDescending(p => p.ProductCode) 
                : query.OrderBy(p => p.ProductCode),
            "description" => query => request.SortDescending 
                ? query.OrderByDescending(p => p.Description) 
                : query.OrderBy(p => p.Description),
            "quantityonhand" => query => request.SortDescending 
                ? query.OrderByDescending(p => p.QuantityOnHand) 
                : query.OrderBy(p => p.QuantityOnHand),
            "dayscover" => query => request.SortDescending 
                ? query.OrderByDescending(p => p.DaysCoverRemaining) 
                : query.OrderBy(p => p.DaysCoverRemaining),
            "stockstatus" => query => request.SortDescending 
                ? query.OrderByDescending(p => p.StockStatus) 
                : query.OrderBy(p => p.StockStatus),
            "lastupdated" => query => request.SortDescending 
                ? query.OrderByDescending(p => p.LastUpdated) 
                : query.OrderBy(p => p.LastUpdated),
            _ => query => query.OrderBy(p => p.ProductCode) // Default sort
        };
    }

    private Expression<Func<Product, bool>>? CombineFilters(
        Expression<Func<Product, bool>>? existing, 
        Expression<Func<Product, bool>> additional)
    {
        if (existing == null)
            return additional;

        // Combine expressions using AND logic
        var parameter = Expression.Parameter(typeof(Product));
        var existingBody = Expression.Invoke(existing, parameter);
        var additionalBody = Expression.Invoke(additional, parameter);
        var combined = Expression.AndAlso(existingBody, additionalBody);
        
        return Expression.Lambda<Func<Product, bool>>(combined, parameter);
    }

    private Dictionary<string, object> BuildFiltersMetadata(GetProductsQuery request)
    {
        var filters = new Dictionary<string, object>();
        
        if (request.StockStatusFilter.HasValue)
            filters["StockStatus"] = request.StockStatusFilter.Value.ToString();
        
        if (request.LowStockOnly == true)
            filters["LowStockOnly"] = true;
        
        if (request.OverstockedOnly == true)
            filters["OverstockedOnly"] = true;
        
        if (request.RequiresReorder == true)
            filters["RequiresReorder"] = true;

        return filters;
    }
}