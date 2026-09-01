using Microsoft.EntityFrameworkCore;

namespace ApiClientes;

public class ClienteDbContext(DbContextOptions<ClienteDbContext> options) : DbContext(options)
{
    public DbSet<Cliente> Clientes => Set<Cliente>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var cliente = modelBuilder.Entity<Cliente>();

        cliente.Property(c => c.Nome).IsRequired();
        cliente.Property(c => c.Email).IsRequired();

        cliente.HasIndex(c => c.Email).IsUnique();

        // O SQLite persiste DateTime como TEXT e devolve o valor com Kind=Unspecified,
        // o que apagaria o sufixo "Z" da serializacao ISO-8601. Marcar como UTC na
        // materializacao garante que DataCadastro nunca circule sem Kind (decisao 6).
        cliente.Property(c => c.DataCadastro)
            .HasConversion(
                v => v,
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        // Valores constantes: qualquer coisa que mude entre execucoes (DateTime.UtcNow)
        // faria o EF ver o modelo como alterado a cada "migrations add" (decisao 8).
        cliente.HasData(
            new Cliente
            {
                Id = 1,
                Nome = "Ana Souza",
                Email = "ana.souza@exemplo.com",
                DataCadastro = new DateTime(2026, 1, 15, 9, 0, 0, DateTimeKind.Utc)
            },
            new Cliente
            {
                Id = 2,
                Nome = "Bruno Lima",
                Email = "bruno.lima@exemplo.com",
                DataCadastro = new DateTime(2026, 2, 20, 14, 30, 0, DateTimeKind.Utc)
            },
            new Cliente
            {
                Id = 3,
                Nome = "Carla Mendes",
                Email = "carla.mendes@exemplo.com",
                DataCadastro = new DateTime(2026, 3, 5, 11, 15, 0, DateTimeKind.Utc)
            });
    }
}
