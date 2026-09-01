using System.Net;

namespace ApiClientes.Tests;

/// <summary>
/// Tarefa 7.6 — cenarios de "Listagem de clientes", "Atualizacao de cliente" e
/// "Remocao de cliente" da spec gestao-clientes.
/// </summary>
public class ListagemAtualizacaoRemocaoTests
{
    [Fact]
    public async Task Listagem_com_clientes_traz_todos_com_os_quatro_campos()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.GetAsync("/clientes");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);

        var clientes = await resposta.LerLista();
        Assert.NotEmpty(clientes);
        foreach (var cliente in clientes)
        {
            Assert.True(cliente.TryGetProperty("id", out _));
            Assert.True(cliente.TryGetProperty("nome", out _));
            Assert.True(cliente.TryGetProperty("email", out _));
            Assert.True(cliente.TryGetProperty("dataCadastro", out _));
        }
    }

    [Fact]
    public async Task Listagem_sem_nenhum_cliente_responde_200_com_colecao_vazia()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        await client.ApagarTodos();

        var resposta = await client.GetAsync("/clientes");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Empty(await resposta.LerLista());
    }

    [Fact]
    public async Task Cliente_removido_nao_aparece_na_listagem()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        await client.DeleteAsync("/clientes/2");

        var ids = (await (await client.GetAsync("/clientes")).LerLista())
            .Select(c => c.GetProperty("id").GetInt32())
            .ToList();

        Assert.DoesNotContain(2, ids);
    }

    [Fact]
    public async Task Atualizacao_bem_sucedida_responde_200_e_persiste()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/3", Ajudantes.Corpo("Carla Mendes Souza", "carla.nova@exemplo.com"));

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var corpo = await resposta.LerJson();
        Assert.Equal("Carla Mendes Souza", corpo.GetProperty("nome").GetString());
        Assert.Equal("carla.nova@exemplo.com", corpo.GetProperty("email").GetString());

        var relido = await (await client.GetAsync("/clientes/3")).LerJson();
        Assert.Equal("Carla Mendes Souza", relido.GetProperty("nome").GetString());
        Assert.Equal("carla.nova@exemplo.com", relido.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Atualizacao_de_cliente_inexistente_responde_404()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/999", Ajudantes.Corpo("Ninguem", "ninguem@exemplo.com"));

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
    }

    [Theory]
    [InlineData("", "valido@exemplo.com")]
    [InlineData("Nome Ok", "invalido")]
    public async Task Atualizacao_com_dados_invalidos_responde_400_sem_alterar_o_cliente(string nome, string email)
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/1", Ajudantes.Corpo(nome, email));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);

        var cliente = await (await client.GetAsync("/clientes/1")).LerJson();
        Assert.Equal("Ana Souza", cliente.GetProperty("nome").GetString());
        Assert.Equal("ana.souza@exemplo.com", cliente.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Identificador_nao_e_alterado_pela_atualizacao()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/1", Ajudantes.Corpo("Ana Nova", "ana.souza@exemplo.com"));

        Assert.Equal(1, await resposta.LerId());
    }

    [Fact]
    public async Task Remocao_bem_sucedida_responde_204_e_a_consulta_seguinte_da_404()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/clientes/1")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/clientes/1")).StatusCode);
    }

    [Fact]
    public async Task Remocao_de_cliente_inexistente_responde_404()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync("/clientes/999")).StatusCode);
    }

    [Fact]
    public async Task Remocao_repetida_responde_404_na_segunda_vez()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/clientes/1")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync("/clientes/1")).StatusCode);
    }
}
