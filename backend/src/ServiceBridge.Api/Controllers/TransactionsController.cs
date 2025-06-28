using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Queries;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[Authorize(Policy = "Scanner")] // All transaction endpoints require at least Scanner role
public class TransactionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<TransactionsController> _logger;

    public TransactionsController(IMediator mediator, ILogger<TransactionsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a paginated list of scan transactions with optional filtering
    /// </summary>
    /// <param name="query">Transaction query parameters including filtering and pagination</param>
    /// <returns>Paginated list of transactions</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ScanTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ScanTransactionDto>>> GetTransactions([FromQuery] GetTransactionsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Gets recent scan transactions (last 50)
    /// </summary>
    /// <returns>List of recent transactions</returns>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(PaginatedResponse<ScanTransactionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ScanTransactionDto>>> GetRecentTransactions()
    {
        var query = new GetTransactionsQuery
        {
            RecentOnly = true,
            RecentCount = 50,
            PageSize = 50,
            PageNumber = 1
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Gets transactions for a specific product
    /// </summary>
    /// <param name="productCode">Product code (format: ABC123)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20, max: 100)</param>
    /// <returns>Paginated list of transactions for the product</returns>
    [HttpGet("product/{productCode}")]
    [ProducesResponseType(typeof(PaginatedResponse<ScanTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ScanTransactionDto>>> GetTransactionsByProduct(
        string productCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetTransactionsQuery
        {
            ProductCode = productCode,
            PageNumber = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Gets transactions performed by a specific user
    /// </summary>
    /// <param name="userId">User ID who performed the scans</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20, max: 100)</param>
    /// <returns>Paginated list of transactions by the user</returns>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(PaginatedResponse<ScanTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ScanTransactionDto>>> GetTransactionsByUser(
        string userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new GetTransactionsQuery
        {
            UserId = userId,
            PageNumber = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Gets transactions of a specific type
    /// </summary>
    /// <param name="transactionType">Transaction type (Receiving, Adjustment, StockCount)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20, max: 100)</param>
    /// <returns>Paginated list of transactions of the specified type</returns>
    [HttpGet("type/{transactionType}")]
    [ProducesResponseType(typeof(PaginatedResponse<ScanTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ScanTransactionDto>>> GetTransactionsByType(
        string transactionType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (!Enum.TryParse<TransactionType>(transactionType, ignoreCase: true, out var parsedType))
        {
            return BadRequest($"Invalid transaction type: {transactionType}. Valid types are: {string.Join(", ", Enum.GetNames<TransactionType>())}");
        }

        var query = new GetTransactionsQuery
        {
            TransactionType = parsedType,
            PageNumber = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Gets transactions within a specific date range
    /// </summary>
    /// <param name="fromDate">Start date (ISO format: yyyy-MM-dd)</param>
    /// <param name="toDate">End date (ISO format: yyyy-MM-dd)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20, max: 100)</param>
    /// <returns>Paginated list of transactions within the date range</returns>
    [HttpGet("daterange")]
    [ProducesResponseType(typeof(PaginatedResponse<ScanTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ScanTransactionDto>>> GetTransactionsByDateRange(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (fromDate >= toDate)
        {
            return BadRequest("From date must be before to date");
        }

        if (toDate > DateTime.UtcNow)
        {
            return BadRequest("To date cannot be in the future");
        }

        var maxDateRange = TimeSpan.FromDays(365); // Limit to 1 year range
        if (toDate - fromDate > maxDateRange)
        {
            return BadRequest($"Date range cannot exceed {maxDateRange.TotalDays} days");
        }

        var query = new GetTransactionsQuery
        {
            FromDate = fromDate,
            ToDate = toDate,
            PageNumber = page,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
}