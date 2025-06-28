namespace ServiceBridge.Application.DTOs;

public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
    public string? SearchQuery { get; set; }
    public Dictionary<string, object>? Filters { get; set; }
}

public class PaginationRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? SearchQuery { get; set; }
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
    
    // Ensure valid pagination parameters
    public void Validate()
    {
        if (PageNumber < 1) PageNumber = 1;
        if (PageSize < 1) PageSize = 50;
        if (PageSize > 1000) PageSize = 1000; // Prevent excessive page sizes
    }
}