using MediatR;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.Queries;

public class GetTransactionsQuery : PaginationRequest, IRequest<PaginatedResponse<ScanTransactionDto>>
{
    public string? ProductCode { get; set; }
    public string? UserId { get; set; }
    public TransactionType? TransactionType { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool RecentOnly { get; set; } = false;
    public int RecentCount { get; set; } = 10;
}