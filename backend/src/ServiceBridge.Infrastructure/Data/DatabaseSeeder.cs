using ServiceBridge.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ServiceBridge.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ServiceBridgeDbContext context)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Check if products already exist
        if (await context.Products.AnyAsync())
        {
            return; // Database has been seeded
        }

        // Sample products with realistic inventory data
        var products = new List<Product>
        {
            new Product
            {
                ProductCode = "ABC123",
                Description = "Premium Widget Assembly",
                QuantityOnHand = 150,
                AverageMonthlyConsumption = 45.50m,
                LeadTimeDays = 14,
                QuantityOnOrder = 100,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "DEF456",
                Description = "Standard Bearing Component",
                QuantityOnHand = 75,
                AverageMonthlyConsumption = 30.25m,
                LeadTimeDays = 7,
                QuantityOnOrder = 0,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "GHI789",
                Description = "Heavy Duty Motor Unit",
                QuantityOnHand = 12,
                AverageMonthlyConsumption = 8.75m,
                LeadTimeDays = 30,
                QuantityOnOrder = 25,
                LastUpdated = DateTime.UtcNow.AddDays(-3),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "JKL012",
                Description = "Electronic Control Module",
                QuantityOnHand = 45,
                AverageMonthlyConsumption = 15.00m,
                LeadTimeDays = 21,
                QuantityOnOrder = 50,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "MNO345",
                Description = "Safety Valve Assembly",
                QuantityOnHand = 8,
                AverageMonthlyConsumption = 12.50m,
                LeadTimeDays = 10,
                QuantityOnOrder = 20,
                LastUpdated = DateTime.UtcNow.AddDays(-4),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "PQR678",
                Description = "Hydraulic Pump Component",
                QuantityOnHand = 200,
                AverageMonthlyConsumption = 25.75m,
                LeadTimeDays = 14,
                QuantityOnOrder = 0,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "STU901",
                Description = "Precision Gear Set",
                QuantityOnHand = 35,
                AverageMonthlyConsumption = 18.25m,
                LeadTimeDays = 28,
                QuantityOnOrder = 40,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "VWX234",
                Description = "Temperature Sensor Unit",
                QuantityOnHand = 120,
                AverageMonthlyConsumption = 22.00m,
                LeadTimeDays = 7,
                QuantityOnOrder = 0,
                LastUpdated = DateTime.UtcNow.AddDays(-3),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "YZA567",
                Description = "Filter Cartridge Set",
                QuantityOnHand = 300,
                AverageMonthlyConsumption = 85.50m,
                LeadTimeDays = 5,
                QuantityOnOrder = 200,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "BCD890",
                Description = "Cable Management System",
                QuantityOnHand = 60,
                AverageMonthlyConsumption = 35.75m,
                LeadTimeDays = 12,
                QuantityOnOrder = 100,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "EFG123",
                Description = "Mounting Bracket Assembly",
                QuantityOnHand = 180,
                AverageMonthlyConsumption = 42.25m,
                LeadTimeDays = 8,
                QuantityOnOrder = 0,
                LastUpdated = DateTime.UtcNow.AddDays(-4),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "HIJ456",
                Description = "Pressure Relief Valve",
                QuantityOnHand = 25,
                AverageMonthlyConsumption = 9.50m,
                LeadTimeDays = 18,
                QuantityOnOrder = 30,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "KLM789",
                Description = "LED Display Panel",
                QuantityOnHand = 40,
                AverageMonthlyConsumption = 16.75m,
                LeadTimeDays = 25,
                QuantityOnOrder = 50,
                LastUpdated = DateTime.UtcNow.AddDays(-3),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "NOP012",
                Description = "Power Supply Module",
                QuantityOnHand = 90,
                AverageMonthlyConsumption = 28.00m,
                LeadTimeDays = 15,
                QuantityOnOrder = 75,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "QRS345",
                Description = "Coupling Assembly",
                QuantityOnHand = 65,
                AverageMonthlyConsumption = 20.50m,
                LeadTimeDays = 11,
                QuantityOnOrder = 0,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "TUV678",
                Description = "Sealing Ring Pack",
                QuantityOnHand = 500,
                AverageMonthlyConsumption = 120.75m,
                LeadTimeDays = 3,
                QuantityOnOrder = 300,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "WXY901",
                Description = "Control Panel Interface",
                QuantityOnHand = 18,
                AverageMonthlyConsumption = 6.25m,
                LeadTimeDays = 35,
                QuantityOnOrder = 20,
                LastUpdated = DateTime.UtcNow.AddDays(-4),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "ZAB234",
                Description = "Maintenance Tool Kit",
                QuantityOnHand = 30,
                AverageMonthlyConsumption = 4.50m,
                LeadTimeDays = 20,
                QuantityOnOrder = 10,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "CDE567",
                Description = "Protective Housing Unit",
                QuantityOnHand = 85,
                AverageMonthlyConsumption = 24.25m,
                LeadTimeDays = 16,
                QuantityOnOrder = 60,
                LastUpdated = DateTime.UtcNow.AddDays(-3),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "FGH890",
                Description = "Calibration Equipment",
                QuantityOnHand = 5,
                AverageMonthlyConsumption = 2.75m,
                LeadTimeDays = 45,
                QuantityOnOrder = 8,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            },
            // Additional products to reach 50+
            new Product
            {
                ProductCode = "IJK123",
                Description = "Backup Battery Pack",
                QuantityOnHand = 110,
                AverageMonthlyConsumption = 32.50m,
                LeadTimeDays = 12,
                QuantityOnOrder = 80,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "LMN456",
                Description = "Antenna Assembly",
                QuantityOnHand = 22,
                AverageMonthlyConsumption = 8.25m,
                LeadTimeDays = 22,
                QuantityOnOrder = 25,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "OPQ789",
                Description = "Relay Switch Module",
                QuantityOnHand = 140,
                AverageMonthlyConsumption = 38.75m,
                LeadTimeDays = 9,
                QuantityOnOrder = 0,
                LastUpdated = DateTime.UtcNow.AddDays(-3),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "RST012",
                Description = "Cooling Fan Assembly",
                QuantityOnHand = 70,
                AverageMonthlyConsumption = 19.50m,
                LeadTimeDays = 13,
                QuantityOnOrder = 40,
                LastUpdated = DateTime.UtcNow.AddDays(-1),
                LastUpdatedBy = "admin"
            },
            new Product
            {
                ProductCode = "UVW345",
                Description = "Connector Cable Set",
                QuantityOnHand = 250,
                AverageMonthlyConsumption = 65.25m,
                LeadTimeDays = 6,
                QuantityOnOrder = 150,
                LastUpdated = DateTime.UtcNow.AddDays(-2),
                LastUpdatedBy = "admin"
            }
        };

        await context.Products.AddRangeAsync(products);

        // Add some sample scan transactions
        var scanTransactions = new List<ScanTransaction>
        {
            new ScanTransaction
            {
                ProductCode = "ABC123",
                QuantityScanned = 10,
                PreviousQuantity = 140,
                NewQuantity = 150,
                ScanDateTime = DateTime.UtcNow.AddDays(-2),
                ScannedBy = "warehouse_user",
                TransactionType = TransactionType.Receiving,
                Notes = "Weekly delivery received"
            },
            new ScanTransaction
            {
                ProductCode = "DEF456",
                QuantityScanned = -5,
                PreviousQuantity = 80,
                NewQuantity = 75,
                ScanDateTime = DateTime.UtcNow.AddDays(-1),
                ScannedBy = "warehouse_user",
                TransactionType = TransactionType.Adjustment,
                Notes = "Adjustment for damaged items"
            },
            new ScanTransaction
            {
                ProductCode = "GHI789",
                QuantityScanned = 0,
                PreviousQuantity = 12,
                NewQuantity = 12,
                ScanDateTime = DateTime.UtcNow.AddHours(-2),
                ScannedBy = "inventory_manager",
                TransactionType = TransactionType.StockCount,
                Notes = "Cycle count verification"
            }
        };

        await context.ScanTransactions.AddRangeAsync(scanTransactions);
        await context.SaveChangesAsync();
    }
}