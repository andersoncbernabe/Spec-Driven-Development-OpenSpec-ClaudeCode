using System.Net;

namespace ApiClientes.Tests;

/// <summary>Tarefa 7.1 — o alicerce: a fixture sobe e o seed esta presente.</summary>
public class FixtureTests
{
    [Fact]
    public async Task Base_de_teste_nasce_com_os_tres_clientes_semeados()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.GetAsync("/clientes");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Equal(3, (await resposta.LerLista()).Count);
    }

    [Fact]
    public async Task Cada_teste_recebe_um_banco_proprio()
    {
        using var primeira = new ClientesApiFactory();
        var clientA = primeira.CriarClient();
        await clientA.ApagarTodos();
        Assert.Empty(await (await clientA.GetAsync("/clientes")).LerLista());

        // Uma factory nova nao ve nada do que a anterior fez.
        using var segunda = new ClientesApiFactory();
        var clientB = segunda.CriarClient();
        Assert.Equal(3, (await (await clientB.GetAsync("/clientes")).LerLista()).Count);
    }
}
