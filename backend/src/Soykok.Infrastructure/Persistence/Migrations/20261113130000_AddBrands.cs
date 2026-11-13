using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Soykok.Infrastructure.Persistence.Migrations
{
    /// <summary>Markalar (catalog.brands) — admin panelinden logo ve sırası yönetilir. Mevcut 8 marka logolarıyla eklenir.</summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20261113130000_AddBrands")]
    public partial class AddBrands : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "brands",
                schema: "catalog",
                columns: table => new
                {
                    slug = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    logo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    show_in_band = table.Column<bool>(type: "boolean", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_brands", x => x.slug);
                });

            migrationBuilder.CreateIndex(
                name: "ix_brands_name",
                schema: "catalog",
                table: "brands",
                column: "name",
                unique: true);

            // İlk markalar (elle yazılmış migration'da model olmadığı için InsertData yerine düz SQL)
            migrationBuilder.Sql("""
                INSERT INTO catalog.brands (slug, name, logo_url, sort_order, show_in_band) VALUES
                  ('filli-boya', 'Filli Boya', '/images/brands/filli-boya.png', 1, TRUE),
                  ('marshall',   'Marshall',   '/images/brands/marshall.png',   2, TRUE),
                  ('dyo',        'Dyo',        '/images/brands/dyo.png',        3, TRUE),
                  ('kalekim',    'Kalekim',    '/images/brands/kalekim.svg',    4, TRUE),
                  ('knauf',      'Knauf',      '/images/brands/knauf.svg',      5, TRUE),
                  ('bosch',      'Bosch',      '/images/brands/bosch.svg',      6, TRUE),
                  ('artema',     'Artema',     '/images/brands/artema.png',     7, TRUE),
                  ('akfix',      'Akfix',      '/images/brands/akfix.svg',      8, TRUE)
                ON CONFLICT (slug) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "brands", schema: "catalog");
        }
    }
}
