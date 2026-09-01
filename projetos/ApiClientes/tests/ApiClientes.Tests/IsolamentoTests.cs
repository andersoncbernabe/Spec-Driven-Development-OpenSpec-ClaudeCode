using System.Net;

namespace ApiClientes.Tests;

/// <summary>
/// Tarefa 7.11 — os tres cenarios destrutivos reunidos DE PROPOSITO na mesma
/// classe. Com uma factory compartilhada via IClassFixture, a ordem de execucao
/// do xUnit decidiria quem passa: o teste que apaga tudo quebraria o que espera
/// Id 4, e o que remove /clientes/2 quebraria a contagem. Passando os tres
/// juntos, o isolamento por factory (decisao 11) esta comprovado.
/// </summary>
public class IsolamentoTests
{
    [Fact]
    public async Task Cenario_destrutivo_apaga_todos_os_clientes()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        await client.ApagarTodos();

        Assert.Equal(0, await client.Contar());
    }

    [Fact]
    public async Task Cenario_destrutivo_remove_o_cliente_2()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/clientes/2")).StatusCode);
        Assert.Equal(2, await client.Contar());
    }

    [Fact]
    public async Task Cenario_que_exige_o_seed_intacto_recebe_Id_4()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(3, await client.Contar());
        Assert.Equal(4, await client.Criar("Quarto", "quarto@exemplo.com"));
    }
}
