using System.Net;

namespace ApiClientes.Tests;

/// <summary>
/// Tarefa 7.9 — "Formato padronizado de erro": 400, 404 e 409 devem sair como
/// ProblemDetails, com Content-Type application/problem+json e campo status
/// coerente com o codigo HTTP.
/// </summary>
public class FormatoErroTests
{
    [Fact]
    public async Task Erro_400_e_um_ProblemDetails_com_status_400_e_os_campos_invalidos()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("", "invalido"));

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
        Assert.Equal("application/problem+json", resposta.Content.Headers.ContentType!.MediaType);

        var corpo = await resposta.LerJson();
        Assert.Equal(400, corpo.GetProperty("status").GetInt32());

        var invalidos = await resposta.LerCamposInvalidos();
        Assert.Contains("nome", invalidos);
        Assert.Contains("email", invalidos);
    }

    [Theory]
    [InlineData("GET")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task Erro_404_e_um_ProblemDetails_com_status_404(string metodo)
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = metodo switch
        {
            "GET" => await client.GetAsync("/clientes/999"),
            "PUT" => await client.PutAsync("/clientes/999", Ajudantes.Corpo("X", "x@exemplo.com")),
            _ => await client.DeleteAsync("/clientes/999")
        };

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
        Assert.Equal("application/problem+json", resposta.Content.Headers.ContentType!.MediaType);
        Assert.Equal(404, (await resposta.LerJson()).GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task Erro_409_e_um_ProblemDetails_com_status_409_e_mensagem_sobre_o_email()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Outra Ana", "ana.souza@exemplo.com"));

        Assert.Equal(HttpStatusCode.Conflict, resposta.StatusCode);
        Assert.Equal("application/problem+json", resposta.Content.Headers.ContentType!.MediaType);

        var corpo = await resposta.LerJson();
        Assert.Equal(409, corpo.GetProperty("status").GetInt32());

        var mensagem = corpo.GetProperty("title").GetString() + " " + corpo.GetProperty("detail").GetString();
        Assert.Contains("mail", mensagem, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ana.souza@exemplo.com", mensagem);
    }
}
