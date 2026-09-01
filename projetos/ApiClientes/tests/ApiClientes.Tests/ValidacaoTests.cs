using System.Net;

namespace ApiClientes.Tests;

/// <summary>
/// Tarefa 7.3 — cenarios de "Validacao dos dados do cliente" da spec
/// gestao-clientes. Email valido = exatamente um "@", com ao menos um caractere
/// antes e um depois.
/// </summary>
public class ValidacaoTests
{
    [Fact]
    public async Task Nome_ausente_responde_400_identificando_o_campo_nome()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Json(
            """{"email":"sem.nome@exemplo.com"}"""));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
        Assert.Contains("nome", await resposta.LerCamposInvalidos());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Nome_vazio_ou_apenas_espacos_responde_400(string nome)
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo(nome, "alguem@exemplo.com"));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }

    [Fact]
    public async Task Email_sem_arroba_responde_400_identificando_o_campo_email()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Ana", "anasouza"));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
        Assert.Contains("email", await resposta.LerCamposInvalidos());
    }

    [Theory]
    [InlineData("ana@")]
    [InlineData("@exemplo.com")]
    [InlineData("@")]
    public async Task Email_com_arroba_em_posicao_invalida_responde_400(string email)
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Ana", email));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }

    [Fact]
    public async Task Email_com_mais_de_uma_arroba_responde_400()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Ana", "ana@exemplo@com"));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }

    [Fact]
    public async Task Email_minimo_valido_e_aceito()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Minimo", "a@b"));

        Assert.Equal(HttpStatusCode.Created, resposta.StatusCode);
    }

    [Fact]
    public async Task Validacao_precede_o_efeito_colateral()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var antes = await client.Contar();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("", "invalido"));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
        Assert.Equal(antes, await client.Contar());
    }
}
