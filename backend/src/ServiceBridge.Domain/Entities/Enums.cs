namespace ServiceBridge.Domain.Entities;

public enum StockStatus
{
    Low,
    Adequate,
    Overstocked
}

public enum TransactionType
{
    StockCount,
    Adjustment,
    Receiving
}
