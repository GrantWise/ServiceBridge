using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false, comment: "Auto-increment primary key")
                        .Annotation("Sqlite:Autoincrement", true),
                    EntityType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false, comment: "Type of entity that was changed (Product, ScanTransaction)"),
                    EntityId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false, comment: "Primary key value(s) of the changed entity"),
                    Action = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, comment: "Action performed: Created, Updated, Deleted"),
                    OldValues = table.Column<string>(type: "TEXT", nullable: true, comment: "JSON representation of old values (null for Created)"),
                    NewValues = table.Column<string>(type: "TEXT", nullable: false, comment: "JSON representation of new values"),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false, comment: "ID of user who made the change"),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false, comment: "When the change occurred (UTC)"),
                    Source = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, comment: "Source of change: REST, gRPC, SignalR, EF"),
                    IpAddress = table.Column<string>(type: "TEXT", maxLength: 45, nullable: false, comment: "IP address of the client")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    ProductCode = table.Column<string>(type: "TEXT", maxLength: 6, nullable: false, comment: "Product code in format ABC123 (3 letters + 3 digits)"),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false, comment: "Product description"),
                    QuantityOnHand = table.Column<int>(type: "INTEGER", nullable: false, comment: "Current stock quantity"),
                    AverageMonthlyConsumption = table.Column<decimal>(type: "decimal(18,2)", nullable: false, comment: "Average monthly consumption for reorder calculations"),
                    LeadTimeDays = table.Column<int>(type: "INTEGER", nullable: false, comment: "Lead time in days (1-365)"),
                    QuantityOnOrder = table.Column<int>(type: "INTEGER", nullable: false, comment: "Quantity currently on order"),
                    LastUpdated = table.Column<DateTime>(type: "TEXT", nullable: false, comment: "Last update timestamp"),
                    LastUpdatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false, comment: "User who last updated the product")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.ProductCode);
                });

            migrationBuilder.CreateTable(
                name: "ScanTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false, comment: "Auto-increment primary key")
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductCode = table.Column<string>(type: "TEXT", maxLength: 6, nullable: false, comment: "Foreign key to Product"),
                    QuantityScanned = table.Column<int>(type: "INTEGER", nullable: false, comment: "Quantity scanned (can be negative for adjustments)"),
                    PreviousQuantity = table.Column<int>(type: "INTEGER", nullable: false, comment: "Stock quantity before scan"),
                    NewQuantity = table.Column<int>(type: "INTEGER", nullable: false, comment: "Stock quantity after scan"),
                    ScanDateTime = table.Column<DateTime>(type: "TEXT", nullable: false, comment: "When the scan occurred (UTC)"),
                    ScannedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false, comment: "User who performed the scan"),
                    TransactionType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, comment: "Type of transaction: StockCount, Adjustment, Receiving"),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true, comment: "Optional notes for the transaction")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScanTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScanTransactions_Products_ProductCode",
                        column: x => x.ProductCode,
                        principalTable: "Products",
                        principalColumn: "ProductCode",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_EntityId",
                table: "AuditEntries",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_EntityType",
                table: "AuditEntries",
                column: "EntityType");

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_EntityType_EntityId",
                table: "AuditEntries",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_EntityType_Timestamp",
                table: "AuditEntries",
                columns: new[] { "EntityType", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_Source",
                table: "AuditEntries",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_Timestamp",
                table: "AuditEntries",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_UserId",
                table: "AuditEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_UserId_Timestamp",
                table: "AuditEntries",
                columns: new[] { "UserId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Description",
                table: "Products",
                column: "Description");

            migrationBuilder.CreateIndex(
                name: "IX_Products_LastUpdated",
                table: "Products",
                column: "LastUpdated");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ProductCode",
                table: "Products",
                column: "ProductCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScanTransactions_ProductCode",
                table: "ScanTransactions",
                column: "ProductCode");

            migrationBuilder.CreateIndex(
                name: "IX_ScanTransactions_ProductCode_ScanDateTime",
                table: "ScanTransactions",
                columns: new[] { "ProductCode", "ScanDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ScanTransactions_ScanDateTime",
                table: "ScanTransactions",
                column: "ScanDateTime");

            migrationBuilder.CreateIndex(
                name: "IX_ScanTransactions_ScannedBy",
                table: "ScanTransactions",
                column: "ScannedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ScanTransactions_TransactionType",
                table: "ScanTransactions",
                column: "TransactionType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditEntries");

            migrationBuilder.DropTable(
                name: "ScanTransactions");

            migrationBuilder.DropTable(
                name: "Products");
        }
    }
}
