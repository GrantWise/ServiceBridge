using AutoMapper;
using ServiceBridge.Application.DTOs;
using ServiceBridge.Domain.Entities;

namespace ServiceBridge.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMaps();
    }

    private void CreateMaps()
    {
        // Product mappings
        CreateMap<Product, ProductDto>()
            .ForMember(dest => dest.DaysCoverRemaining, opt => opt.MapFrom(src => src.DaysCoverRemaining))
            .ForMember(dest => dest.ReorderPoint, opt => opt.MapFrom(src => src.ReorderPoint))
            .ForMember(dest => dest.StockStatus, opt => opt.MapFrom(src => src.StockStatus));

        CreateMap<UpdateProductRequest, Product>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.ProductCode.ToUpper()))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description ?? string.Empty))
            .ForMember(dest => dest.QuantityOnHand, opt => opt.MapFrom(src => src.QuantityOnHand ?? 0))
            .ForMember(dest => dest.AverageMonthlyConsumption, opt => opt.MapFrom(src => src.AverageMonthlyConsumption ?? 0))
            .ForMember(dest => dest.LeadTimeDays, opt => opt.MapFrom(src => src.LeadTimeDays ?? 30))
            .ForMember(dest => dest.QuantityOnOrder, opt => opt.MapFrom(src => src.QuantityOnOrder ?? 0))
            .ForMember(dest => dest.LastUpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.LastUpdated, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.ScanTransactions, opt => opt.Ignore());

        // ScanTransaction mappings
        CreateMap<ScanTransaction, ScanTransactionDto>()
            .ForMember(dest => dest.ProductDescription, opt => opt.MapFrom(src => src.Product != null ? src.Product.Description : null));

        CreateMap<CreateScanRequest, ScanTransaction>()
            .ForMember(dest => dest.ProductCode, opt => opt.MapFrom(src => src.ProductCode.ToUpper()))
            .ForMember(dest => dest.QuantityScanned, opt => opt.MapFrom(src => src.QuantityScanned))
            .ForMember(dest => dest.TransactionType, opt => opt.MapFrom(src => src.TransactionType))
            .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
            .ForMember(dest => dest.ScannedBy, opt => opt.MapFrom(src => src.ScannedBy))
            .ForMember(dest => dest.ScanDateTime, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PreviousQuantity, opt => opt.Ignore())
            .ForMember(dest => dest.NewQuantity, opt => opt.Ignore())
            .ForMember(dest => dest.Product, opt => opt.Ignore());
    }
}