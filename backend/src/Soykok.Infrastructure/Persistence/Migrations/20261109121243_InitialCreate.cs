using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Soykok.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "catalog");

            migrationBuilder.EnsureSchema(
                name: "customers");

            migrationBuilder.EnsureSchema(
                name: "ordering");

            migrationBuilder.EnsureSchema(
                name: "reviews");

            migrationBuilder.EnsureSchema(
                name: "inventory");

            migrationBuilder.CreateTable(
                name: "categories",
                schema: "catalog",
                columns: table => new
                {
                    slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_categories", x => x.slug);
                });

            migrationBuilder.CreateTable(
                name: "category_groups",
                schema: "catalog",
                columns: table => new
                {
                    slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    label = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    category_slugs = table.Column<string[]>(type: "text[]", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category_groups", x => x.slug);
                });

            migrationBuilder.CreateTable(
                name: "customers",
                schema: "customers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    identity_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    marketing_consent = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    brand = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    category_slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    unit = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    image = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    old_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    rating = table.Column<double>(type: "double precision", nullable: false),
                    reviews = table.Column<int>(type: "integer", nullable: false),
                    badge = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    badge_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    added_at = table.Column<DateOnly>(type: "date", nullable: false),
                    sales = table.Column<int>(type: "integer", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    box_m2 = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    images = table.Column<string[]>(type: "text[]", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    features = table.Column<string[]>(type: "text[]", nullable: false),
                    specs = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_products", x => x.id);
                    table.ForeignKey(
                        name: "fk_products_categories_category_slug",
                        column: x => x.category_slug,
                        principalSchema: "catalog",
                        principalTable: "categories",
                        principalColumn: "slug",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "customer_addresses",
                schema: "customers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    recipient_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    address_city = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    address_district = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    address_line = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    address_postal_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    invoice_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    invoice_company_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    invoice_tax_office = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    invoice_tax_number = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customer_addresses", x => x.id);
                    table.ForeignKey(
                        name: "fk_customer_addresses_customers_customer_id",
                        column: x => x.customer_id,
                        principalSchema: "customers",
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "orders",
                schema: "ordering",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    buyer_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    buyer_first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    buyer_last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    buyer_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    delivery_method = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    shipping_address_city = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    shipping_address_district = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    shipping_address_line = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    shipping_address_postal_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    delivery_note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    invoice_type = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    invoice_company_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    invoice_tax_office = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    invoice_tax_number = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: true),
                    payment_method = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    subtotal = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    shipping_fee = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    total = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    marketing_consent = table.Column<bool>(type: "boolean", nullable: false),
                    placed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_orders", x => x.id);
                    table.CheckConstraint("ck_orders_amounts", "subtotal >= 0 AND shipping_fee >= 0 AND total = subtotal + shipping_fee");
                    table.ForeignKey(
                        name: "fk_orders_customers_customer_id",
                        column: x => x.customer_id,
                        principalSchema: "customers",
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "favorite_products",
                schema: "customers",
                columns: table => new
                {
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_favorite_products", x => new { x.customer_id, x.product_id });
                    table.ForeignKey(
                        name: "fk_favorite_products_customers_customer_id",
                        column: x => x.customer_id,
                        principalSchema: "customers",
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_favorite_products_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalog",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_reviews",
                schema: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    is_approved = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_reviews", x => x.id);
                    table.CheckConstraint("ck_product_reviews_rating", "rating BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "fk_product_reviews_customers_customer_id",
                        column: x => x.customer_id,
                        principalSchema: "customers",
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_product_reviews_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalog",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stock_items",
                schema: "inventory",
                columns: table => new
                {
                    product_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_stock_items", x => x.product_id);
                    table.CheckConstraint("ck_stock_items_quantity", "quantity >= 0");
                    table.ForeignKey(
                        name: "fk_stock_items_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "catalog",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "order_items",
                schema: "ordering",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    product_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    brand = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    image = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    unit = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    line_total = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_order_items", x => x.id);
                    table.CheckConstraint("ck_order_items_amounts", "unit_price > 0 AND line_total = unit_price * quantity");
                    table.CheckConstraint("ck_order_items_quantity", "quantity BETWEEN 1 AND 999");
                    table.ForeignKey(
                        name: "fk_order_items_orders_order_id",
                        column: x => x.order_id,
                        principalSchema: "ordering",
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "order_status_history",
                schema: "ordering",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    changed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_order_status_history", x => x.id);
                    table.ForeignKey(
                        name: "fk_order_status_history_orders_order_id",
                        column: x => x.order_id,
                        principalSchema: "ordering",
                        principalTable: "orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_customer_addresses_customer_id",
                schema: "customers",
                table: "customer_addresses",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_customers_email",
                schema: "customers",
                table: "customers",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "ix_customers_identity_id",
                schema: "customers",
                table: "customers",
                column: "identity_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_favorite_products_product_id",
                schema: "customers",
                table: "favorite_products",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_items_order_id",
                schema: "ordering",
                table: "order_items",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_items_product_id",
                schema: "ordering",
                table: "order_items",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_order_status_history_order_id",
                schema: "ordering",
                table: "order_status_history",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "ix_orders_buyer_email",
                schema: "ordering",
                table: "orders",
                column: "buyer_email");

            migrationBuilder.CreateIndex(
                name: "ix_orders_customer_id",
                schema: "ordering",
                table: "orders",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_orders_number",
                schema: "ordering",
                table: "orders",
                column: "number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_orders_placed_at",
                schema: "ordering",
                table: "orders",
                column: "placed_at");

            migrationBuilder.CreateIndex(
                name: "ix_orders_status",
                schema: "ordering",
                table: "orders",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_product_reviews_customer_id",
                schema: "reviews",
                table: "product_reviews",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_reviews_product_id_customer_id",
                schema: "reviews",
                table: "product_reviews",
                columns: new[] { "product_id", "customer_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_product_reviews_product_id_is_approved",
                schema: "reviews",
                table: "product_reviews",
                columns: new[] { "product_id", "is_approved" });

            migrationBuilder.CreateIndex(
                name: "ix_products_brand",
                schema: "catalog",
                table: "products",
                column: "brand");

            migrationBuilder.CreateIndex(
                name: "ix_products_category_slug",
                schema: "catalog",
                table: "products",
                column: "category_slug");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "category_groups",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "customer_addresses",
                schema: "customers");

            migrationBuilder.DropTable(
                name: "favorite_products",
                schema: "customers");

            migrationBuilder.DropTable(
                name: "order_items",
                schema: "ordering");

            migrationBuilder.DropTable(
                name: "order_status_history",
                schema: "ordering");

            migrationBuilder.DropTable(
                name: "product_reviews",
                schema: "reviews");

            migrationBuilder.DropTable(
                name: "stock_items",
                schema: "inventory");

            migrationBuilder.DropTable(
                name: "orders",
                schema: "ordering");

            migrationBuilder.DropTable(
                name: "products",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "customers",
                schema: "customers");

            migrationBuilder.DropTable(
                name: "categories",
                schema: "catalog");
        }
    }
}
