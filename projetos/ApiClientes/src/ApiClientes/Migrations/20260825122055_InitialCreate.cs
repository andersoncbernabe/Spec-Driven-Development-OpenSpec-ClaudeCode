using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiClientes.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Clientes",
                columns: new[] { "Id", "DataCadastro", "Email", "Nome" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 15, 9, 0, 0, 0, DateTimeKind.Utc), "ana.souza@exemplo.com", "Ana Souza" },
                    { 2, new DateTime(2026, 2, 20, 14, 30, 0, 0, DateTimeKind.Utc), "bruno.lima@exemplo.com", "Bruno Lima" },
                    { 3, new DateTime(2026, 3, 5, 11, 15, 0, 0, DateTimeKind.Utc), "carla.mendes@exemplo.com", "Carla Mendes" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Email",
                table: "Clientes",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Clientes");
        }
    }
}
