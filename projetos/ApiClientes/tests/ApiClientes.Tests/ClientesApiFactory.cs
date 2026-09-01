using ApiClientes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ApiClientes.Tests;

/// <summary>
/// Host de teste com o banco reapontado para SQLite in-memory.
///
/// A conexao fica aberta durante toda a vida da factory: fechada, o banco
/// in-memory deixa de existir. O schema vem de Database.Migrate(), o que exercita
/// a migration real e traz os tres clientes semeados.
///
/// IMPORTANTE: instancie uma factory por teste (`using var`), nunca via
/// IClassFixture. Varios cenarios das specs sao destrutivos — apagam todos os
/// clientes, removem /clientes/2, ou exigem o seed intacto para que o proximo
/// POST receba Id 4. Compartilhando banco, a ordem de execucao do xUnit decidiria
/// quem passa.
/// </summary>
public sealed class ClientesApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _conexao = new("DataSource=:memory:");

    public ClientesApiFactory()
    {
        _conexao.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ClienteDbContext>>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<ClienteDbContext>();

            services.AddDbContext<ClienteDbContext>(opcoes => opcoes.UseSqlite(_conexao));
        });
    }

    /// <summary>
    /// Cria o HttpClient e garante que o schema e o seed estao no banco in-memory.
    /// Database.Migrate() e idempotente, entao nao importa se o startup da
    /// aplicacao ja o executou.
    /// </summary>
    public HttpClient CriarClient()
    {
        var client = CreateClient();

        using var scope = Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<ClienteDbContext>().Database.Migrate();

        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _conexao.Dispose();
        }
    }
}
