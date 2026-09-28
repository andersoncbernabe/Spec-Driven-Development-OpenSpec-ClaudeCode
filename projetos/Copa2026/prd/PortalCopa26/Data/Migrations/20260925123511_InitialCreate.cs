using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalCopa26.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Grupos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Grupos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RankingFifa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Posicao = table.Column<int>(type: "INTEGER", nullable: false),
                    NomeSelecao = table.Column<string>(type: "TEXT", nullable: false),
                    CodigoFifa = table.Column<string>(type: "TEXT", nullable: false),
                    Pontuacao = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RankingFifa", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Simulacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DataCriacao = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Descricao = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Simulacoes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Selecoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    CodigoFifa = table.Column<string>(type: "TEXT", nullable: false),
                    GrupoId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Selecoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Selecoes_Grupos_GrupoId",
                        column: x => x.GrupoId,
                        principalTable: "Grupos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Jogadores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    Posicao = table.Column<string>(type: "TEXT", nullable: false),
                    Numero = table.Column<int>(type: "INTEGER", nullable: false),
                    Idade = table.Column<int>(type: "INTEGER", nullable: false),
                    SelecaoId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jogadores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Jogadores_Selecoes_SelecaoId",
                        column: x => x.SelecaoId,
                        principalTable: "Selecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Jogos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Fase = table.Column<string>(type: "TEXT", nullable: false),
                    DataHora = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Estadio = table.Column<string>(type: "TEXT", nullable: false),
                    Cidade = table.Column<string>(type: "TEXT", nullable: false),
                    SelecaoMandanteId = table.Column<int>(type: "INTEGER", nullable: true),
                    SelecaoVisitanteId = table.Column<int>(type: "INTEGER", nullable: true),
                    RotuloMandante = table.Column<string>(type: "TEXT", nullable: true),
                    RotuloVisitante = table.Column<string>(type: "TEXT", nullable: true),
                    PlacarMandante = table.Column<int>(type: "INTEGER", nullable: true),
                    PlacarVisitante = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jogos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Jogos_Selecoes_SelecaoMandanteId",
                        column: x => x.SelecaoMandanteId,
                        principalTable: "Selecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Jogos_Selecoes_SelecaoVisitanteId",
                        column: x => x.SelecaoVisitanteId,
                        principalTable: "Selecoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SimulacaoJogos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SimulacaoId = table.Column<int>(type: "INTEGER", nullable: false),
                    JogoId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlacarMandante = table.Column<int>(type: "INTEGER", nullable: false),
                    PlacarVisitante = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimulacaoJogos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimulacaoJogos_Jogos_JogoId",
                        column: x => x.JogoId,
                        principalTable: "Jogos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SimulacaoJogos_Simulacoes_SimulacaoId",
                        column: x => x.SimulacaoId,
                        principalTable: "Simulacoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Grupos_Nome",
                table: "Grupos",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Jogadores_SelecaoId",
                table: "Jogadores",
                column: "SelecaoId");

            migrationBuilder.CreateIndex(
                name: "IX_Jogos_DataHora",
                table: "Jogos",
                column: "DataHora");

            migrationBuilder.CreateIndex(
                name: "IX_Jogos_Fase",
                table: "Jogos",
                column: "Fase");

            migrationBuilder.CreateIndex(
                name: "IX_Jogos_SelecaoMandanteId",
                table: "Jogos",
                column: "SelecaoMandanteId");

            migrationBuilder.CreateIndex(
                name: "IX_Jogos_SelecaoVisitanteId",
                table: "Jogos",
                column: "SelecaoVisitanteId");

            migrationBuilder.CreateIndex(
                name: "IX_RankingFifa_Posicao",
                table: "RankingFifa",
                column: "Posicao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Selecoes_CodigoFifa",
                table: "Selecoes",
                column: "CodigoFifa",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Selecoes_GrupoId",
                table: "Selecoes",
                column: "GrupoId");

            migrationBuilder.CreateIndex(
                name: "IX_Selecoes_Nome",
                table: "Selecoes",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimulacaoJogos_JogoId",
                table: "SimulacaoJogos",
                column: "JogoId");

            migrationBuilder.CreateIndex(
                name: "IX_SimulacaoJogos_SimulacaoId",
                table: "SimulacaoJogos",
                column: "SimulacaoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Jogadores");

            migrationBuilder.DropTable(
                name: "RankingFifa");

            migrationBuilder.DropTable(
                name: "SimulacaoJogos");

            migrationBuilder.DropTable(
                name: "Jogos");

            migrationBuilder.DropTable(
                name: "Simulacoes");

            migrationBuilder.DropTable(
                name: "Selecoes");

            migrationBuilder.DropTable(
                name: "Grupos");
        }
    }
}
