using System.Net;

namespace ApiClientes.Tests;

/// <summary>
/// Tarefa 7.2 — cenarios de "Criacao de cliente" e "Consulta de cliente por
/// identificador" da spec gestao-clientes.
/// </summary>
public class CriacaoEConsultaTests
{
    [Fact]
    public async Task Criacao_bem_sucedida_responde_201_com_o_cliente_e_o_Location()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Diego Alves", "diego.alves@exemplo.com"));

        Assert.Equal(HttpStatusCode.Created, resposta.StatusCode);

        var corpo = await resposta.LerJson();
        Assert.True(corpo.GetProperty("id").GetInt32() > 0);
        Assert.Equal("Diego Alves", corpo.GetProperty("nome").GetString());
        Assert.Equal("diego.alves@exemplo.com", corpo.GetProperty("email").GetString());
        Assert.False(string.IsNullOrWhiteSpace(corpo.GetProperty("dataCadastro").GetString()));

        Assert.Equal($"/clientes/{corpo.GetProperty("id").GetInt32()}", resposta.Headers.Location!.ToString());
    }

    [Fact]
    public async Task Cliente_criado_fica_imediatamente_consultavel()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var id = await client.Criar("Diego Alves", "diego.alves@exemplo.com");

        var resposta = await client.GetAsync($"/clientes/{id}");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var corpo = await resposta.LerJson();
        Assert.Equal("Diego Alves", corpo.GetProperty("nome").GetString());
        Assert.Equal("diego.alves@exemplo.com", corpo.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Identificador_enviado_pelo_cliente_e_ignorado()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Json(
            """{"id":999,"nome":"Diego Alves","email":"diego.alves@exemplo.com"}"""));

        Assert.Equal(HttpStatusCode.Created, resposta.StatusCode);
        Assert.NotEqual(999, await resposta.LerId());
    }

    [Fact]
    public async Task Data_de_cadastro_enviada_pelo_cliente_e_ignorada()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Json(
            """{"nome":"Diego Alves","email":"diego.alves@exemplo.com","dataCadastro":"1999-01-01T00:00:00Z"}"""));

        Assert.Equal(HttpStatusCode.Created, resposta.StatusCode);
        Assert.DoesNotContain("1999", await resposta.LerDataCadastro());
    }

    [Fact]
    public async Task Consulta_de_cliente_existente_responde_200_com_os_quatro_campos()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.GetAsync("/clientes/1");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var corpo = await resposta.LerJson();
        Assert.Equal(1, corpo.GetProperty("id").GetInt32());
        Assert.Equal("Ana Souza", corpo.GetProperty("nome").GetString());
        Assert.Equal("ana.souza@exemplo.com", corpo.GetProperty("email").GetString());
        Assert.Equal("2026-01-15T09:00:00Z", corpo.GetProperty("dataCadastro").GetString());
    }

    [Fact]
    public async Task Consulta_de_cliente_inexistente_responde_404()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.GetAsync("/clientes/999");

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
    }
}
