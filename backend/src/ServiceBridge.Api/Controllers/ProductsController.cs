using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceBridge.Application.Commands;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Queries;

namespace ServiceBridge.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
[Authorize(Policy = "Scanner")] // All endpoints require at least Scanner role
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IMediator mediator, ILogger<ProductsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Gets a paginated list of products with optional filtering
    /// </summary>
    /// <param name="query">Product query parameters including filtering and pagination</param>
    /// <returns>Paginated list of products</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<ProductDto>>> GetProducts([FromQuery] GetProductsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Gets a single product by product code
    /// </summary>
    /// <param name="code">Product code (format: ABC123)</param>
    /// <returns>Product details</returns>
    [HttpGet("{code}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> GetProduct(string code)
    {
        var query = new GetProductQuery(code);
        var result = await _mediator.Send(query);
        
        if (result == null)
        {
            return NotFound($"Product with code '{code}' not found");
        }
        
        return Ok(result);
    }

    /// <summary>
    /// Processes an inventory scan for a specific product
    /// </summary>
    /// <param name="code">Product code (format: ABC123)</param>
    /// <param name="request">Scan transaction details</param>
    /// <returns>Scan processing result</returns>
    [HttpPost("{code}/scan")]
    [ProducesResponseType(typeof(CreateScanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CreateScanResponse>> ProcessScan(string code, [FromBody] CreateScanRequest request)
    {
        var command = new ProcessScanCommand(
            code,
            request.QuantityScanned,
            request.TransactionType,
            request.ScannedBy,
            request.Notes);

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Updates a single product's information
    /// </summary>
    /// <param name="code">Product code (format: ABC123)</param>
    /// <param name="request">Product update information</param>
    /// <returns>Update result</returns>
    [HttpPut("{code}")]
    [Authorize(Policy = "Manager")] // Only Managers and Admins can update products
    [ProducesResponseType(typeof(UpdateProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UpdateProductResponse>> UpdateProduct(string code, [FromBody] UpdateProductRequest request)
    {
        var command = new UpdateProductCommand(
            code,
            request.Description,
            request.QuantityOnHand,
            request.AverageMonthlyConsumption,
            request.LeadTimeDays,
            request.QuantityOnOrder,
            request.UpdatedBy ?? "API");

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Updates multiple products in a single operation
    /// </summary>
    /// <param name="request">Bulk update request with list of products</param>
    /// <returns>Bulk update results</returns>
    [HttpPut("bulk")]
    [Authorize(Policy = "Manager")] // Only Managers and Admins can perform bulk updates
    [ProducesResponseType(typeof(BulkUpdateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BulkUpdateResponse>> BulkUpdateProducts([FromBody] BulkUpdateRequest request)
    {
        var command = new BulkUpdateProductsCommand(
            request.Products,
            request.UpdatedBy ?? "API");

        var result = await _mediator.Send(command);
        return Ok(result);
    }
}