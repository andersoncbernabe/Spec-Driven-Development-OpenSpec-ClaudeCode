using System.Net;

namespace ApiClientes.Tests;

/// <summary>
/// Tarefa 7.7 — cenarios de "Precedencia entre condicoes de erro".
/// Ordem obrigatoria: 400 (validacao) -> 404 (existencia) -> 409 (conflito).
/// Sem esses testes, duas implementacoes igualmente "corretas" discordam.
/// </summary>
public class PrecedenciaErroTests
{
    [Fact]
    public async Task Identificador_inexistente_com_email_duplicado_responde_404_e_nao_409()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/999", Ajudantes.Corpo("Qualquer", "ana.souza@exemplo.com"));

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
    }

    [Fact]
    public async Task Dados_invalidos_com_identificador_inexistente_responde_400_e_nao_404()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/999", Ajudantes.Corpo("Qualquer", "email-invalido"));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }

    [Fact]
    public async Task Nome_vazio_com_identificador_inexistente_responde_400()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/999", Ajudantes.Corpo("", "valido@exemplo.com"));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }
}
