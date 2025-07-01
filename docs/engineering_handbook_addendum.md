# Engineering Handbook Addendum: Core Pattern Implementation

**Version:** 1.0  
**Status:** Active  
**Owner:** Engineering Leadership

---

## **Objective**

This document provides detailed implementation guidance and practical code examples for the core architectural patterns mandated in the **ServiceBridge Engineering Handbook**. It is intended as a practical guide for developers to ensure consistency and correctness in their implementations.

---

## **1. CQRS (Command Query Responsibility Segregation)**

**Reference:** Handbook, Section 2.2

**Why We Use It:** We separate write operations (Commands) from read operations (Queries) to optimize and scale each path independently. This prevents complex queries from impacting the performance of critical state-changing operations.

### **1.1. Command Implementation**

A Command is an object that encapsulates a request to change the state of the system. It should be named imperatively (e.g., `UpdateProductCommand`).

**Step 1: Define the Command**

Create a record in the `ServiceBridge.Application/Commands` directory. It must implement `IRequest<T>`, where `T` is the expected return type (often a `Result` object).

*Example: `UpdateProductCommand.cs`*
```csharp
using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Models;

namespace ServiceBridge.Application.Commands;

public record UpdateProductCommand(
    string ProductCode,
    string Description,
    int QuantityOnHand
) : IRequest<Result<UpdateProductResponse>>;
```

**Step 2: Define the Command Handler**

Create a handler in the same directory. It must implement `IRequestHandler<TCommand, TResponse>`. The handler contains the actual business logic.

*Example: `UpdateProductCommandHandler.cs`*
```csharp
using MediatR;
using ServiceBridge.Application.Models;
using ServiceBridge.Domain.Interfaces;

namespace ServiceBridge.Application.Commands;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<UpdateProductResponse>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateProductCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UpdateProductResponse>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductCode);

        if (product is null)
        {
            return Result.Failure<UpdateProductResponse>(new Error("Product.NotFound", "Product not found."));
        }

        // Business logic here
        product.Description = request.Description;
        product.QuantityOnHand = request.QuantityOnHand;

        await _unitOfWork.CompleteAsync();

        var response = new UpdateProductResponse { ProductCode = product.ProductCode, Success = true };
        return Result.Success(response);
    }
}
```

### **1.2. Query Implementation**

A Query is a request for data. It does not change the state of the system.

**Step 1: Define the Query**

Create a record in the `ServiceBridge.Application/Queries` directory.

*Example: `GetProductByCodeQuery.cs`*
```csharp
using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Application.Models;

namespace ServiceBridge.Application.Queries;

public record GetProductByCodeQuery(string ProductCode) : IRequest<Result<ProductDto>>;
```

**Step 2: Define the Query Handler**

Create a handler that reads data, typically using a more efficient, direct path than a command.

*Example: `GetProductByCodeQueryHandler.cs`*
```csharp
using AutoMapper;
using MediatR;
using ServiceBridge.Application.Models;
using ServiceBridge.Domain.Interfaces;

namespace ServiceBridge.Application.Queries;

public class GetProductByCodeQueryHandler : IRequestHandler<GetProductByCodeQuery, Result<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IMapper _mapper;

    public GetProductByCodeQueryHandler(IProductRepository productRepository, IMapper mapper)
    {
        _productRepository = productRepository;
        _mapper = mapper;
    }

    public async Task<Result<ProductDto>> Handle(GetProductByCodeQuery request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductCode);

        if (product is null)
        {
            return Result.Failure<ProductDto>(new Error("Product.NotFound", "Product not found."));
        }

        var productDto = _mapper.Map<ProductDto>(product);
        return Result.Success(productDto);
    }
}
```

---

## **2. Repository Pattern**

**Reference:** Handbook, Section 2.2

**Why We Use It:** To create a stable abstraction layer between our application's business logic and the data access technology (EF Core). This makes our application logic independent of the database, easier to test, and more maintainable.

**Step 1: Define the Interface in the Domain Layer**

The interface defines the contract for data operations. It lives in the Domain layer so that the Application layer can depend on it without knowing about the database implementation.

*Example: `IProductRepository.cs`*
```csharp
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Domain.Interfaces;

public interface IProductRepository : IRepository<Product>
{
    // Add product-specific methods here if needed
    Task<IEnumerable<Product>> GetProductsWithLowStockAsync(int threshold);
}
```

**Step 2: Implement the Interface in the Infrastructure Layer**

The concrete implementation uses `DbContext` to perform the data operations. It lives in the Infrastructure layer.

*Example: `ProductRepository.cs`*
```csharp
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

    public async Task<IEnumerable<Product>> GetProductsWithLowStockAsync(int threshold)
    {
        return await _context.Products
            .Where(p => p.QuantityOnHand < threshold)
            .ToListAsync();
    }
}
```

**Step 3: Use the Repository in Application Logic**

The Application layer (e.g., a CQRS handler) depends only on the `IProductRepository` interface, not the concrete class.

*Example: Inside a Command Handler*
```csharp
public class SomeCommandHandler
{
    private readonly IProductRepository _productRepository;

    public SomeCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task Handle(...)
    {
        var product = await _productRepository.GetByIdAsync("ABC123");
        // ...
    }
}
```

---

## **3. Result Pattern**

**Reference:** Handbook, Section 2.2

**Why We Use It:** To explicitly handle the success or failure of an operation without relying on exceptions for control flow. This makes the code more predictable, robust, and easier to reason about.

**Step 1: Define the Generic `Result` and `Error` Objects**

These are typically defined in a shared `Models` directory within the Application layer.

*Example: `Result.cs` & `Error.cs`*
```csharp
namespace ServiceBridge.Application.Models;

public record Error(string Code, string Description);

public class Result<T>
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public T Value { get; }
    public Error Error { get; }

    private Result(T value)
    {
        IsSuccess = true;
        Value = value;
        Error = default;
    }

    private Result(Error error)
    {
        IsSuccess = false;
        Value = default;
        Error = error;
    }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);
}
```

**Step 2: Return a `Result` from Application Services/Handlers**

All methods in the Application layer that can fail should return a `Result<T>`.

*Example: Inside a Command Handler*
```csharp
public async Task<Result<UpdateProductResponse>> Handle(UpdateProductCommand request, ...)
{
    var product = await _unitOfWork.Products.GetByIdAsync(request.ProductCode);

    if (product is null)
    {
        // Return a failure result
        return Result.Failure<UpdateProductResponse>(new Error("Product.NotFound", "Product not found."));
    }

    if (request.QuantityOnHand < 0)
    {
        // Return a failure result for a business rule violation
        return Result.Failure<UpdateProductResponse>(new Error("Validation.InvalidQuantity", "Quantity cannot be negative."));
    }

    product.QuantityOnHand = request.QuantityOnHand;
    await _unitOfWork.CompleteAsync();

    // Return a success result
    var response = new UpdateProductResponse { ... };
    return Result.Success(response);
}
```

**Step 3: Handle the `Result` in the API Layer (Controller)**

The API Controller is responsible for inspecting the `Result` and returning the appropriate HTTP response.

*Example: Inside a Controller Action*
```csharp
[HttpPost]
public async Task<IActionResult> UpdateProduct([FromBody] UpdateProductCommand command)
{
    var result = await _mediator.Send(command);

    if (result.IsFailure)
    {
        // Map the error type to an HTTP status code
        return result.Error.Code switch
        {
            "Product.NotFound" => NotFound(result.Error),
            "Validation.InvalidQuantity" => BadRequest(result.Error),
            _ => StatusCode(500, result.Error)
        };
    }

    return Ok(result.Value);
}
```
