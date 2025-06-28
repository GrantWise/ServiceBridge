using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.Commands;

public record ProcessScanCommand(
    string ProductCode,
    int QuantityScanned,
    TransactionType TransactionType,
    string ScannedBy,
    string? Notes = null
) : IRequest<CreateScanResponse>;