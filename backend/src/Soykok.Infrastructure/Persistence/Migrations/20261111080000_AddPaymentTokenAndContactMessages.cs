using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Soykok.Infrastructure.Persistence.Migrations
{
    /// <summary>Siparişe iyzico ödeme token'ı + iletişim formu mesajları (support.contact_messages).</summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20261111080000_AddPaymentTokenAndContactMessages")]
    public partial class AddPaymentTokenAndContactMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "payment_token",
                schema: "ordering",
                table: "orders",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.EnsureSchema(name: "support");

            migrationBuilder.CreateTable(
                name: "contact_messages",
                schema: "support",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    subject = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    order_number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_contact_messages", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_contact_messages_created_at",
                schema: "support",
                table: "contact_messages",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_contact_messages_is_read",
                schema: "support",
                table: "contact_messages",
                column: "is_read");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "contact_messages", schema: "support");
            migrationBuilder.DropColumn(name: "payment_token", schema: "ordering", table: "orders");
        }
    }
}
