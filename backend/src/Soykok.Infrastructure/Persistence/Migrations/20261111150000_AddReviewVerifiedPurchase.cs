using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Soykok.Infrastructure.Persistence.Migrations
{
    /// <summary>Yoruma "doğrulanmış alıcı" işareti.</summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20261111150000_AddReviewVerifiedPurchase")]
    public partial class AddReviewVerifiedPurchase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_verified_purchase",
                schema: "reviews",
                table: "product_reviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_verified_purchase",
                schema: "reviews",
                table: "product_reviews");
        }
    }
}
