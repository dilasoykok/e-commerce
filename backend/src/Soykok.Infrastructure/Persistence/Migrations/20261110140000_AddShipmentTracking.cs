using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Soykok.Infrastructure.Persistence.Migrations
{
    /// <summary>Siparişe kargo firması ve takip numarası.</summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20261110140000_AddShipmentTracking")]
    public partial class AddShipmentTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "shipping_carrier",
                schema: "ordering",
                table: "orders",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tracking_number",
                schema: "ordering",
                table: "orders",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "shipping_carrier", schema: "ordering", table: "orders");
            migrationBuilder.DropColumn(name: "tracking_number", schema: "ordering", table: "orders");
        }
    }
}
