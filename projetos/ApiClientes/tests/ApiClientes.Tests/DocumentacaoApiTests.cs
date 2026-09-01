using System.Net;

namespace ApiClientes.Tests;

/// <summary>Tarefa 7.10 — cenarios da spec documentacao-api.</summary>
public class DocumentacaoApiTests
{
    [Fact]
    public async Task Interface_do_swagger_responde_200()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        // /swagger redireciona para /swagger/index.html; o HttpClient da
        // WebApplicationFactory segue redirects, como um navegador.
        var resposta = await client.GetAsync("/swagger");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Contains("swagger", (await resposta.Content.ReadAsStringAsync()).ToLowerInvariant());
    }

    [Fact]
    public async Task Interface_esta_ligada_ao_documento_com_as_cinco_operacoes()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        // A UI e renderizada no navegador; o que se pode assertar por HTTP e que
        // ela aponta para o documento OpenAPI — e que esse documento e o que
        // descreve as cinco operacoes (coberto pelo teste abaixo).
        var init = await client.GetStringAsync("/swagger/index.js");
        Assert.Contains("v1/swagger.json", init);

        var documento = await (await client.GetAsync("/swagger/v1/swagger.json")).LerJson();
        Assert.Equal(5, documento.GetProperty("paths").EnumerateObject()
            .Sum(caminho => caminho.Value.EnumerateObject().Count()));
    }

    [Fact]
    public async Task Documento_openapi_esta_disponivel()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var documento = await resposta.LerJson();
        Assert.True(documento.TryGetProperty("openapi", out _));
        Assert.True(documento.TryGetProperty("paths", out _));
    }

    [Fact]
    public async Task Documento_descreve_as_cinco_operacoes_de_cliente()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var caminhos = (await (await client.GetAsync("/swagger/v1/swagger.json")).LerJson())
            .GetProperty("paths");

        var operacoes = caminhos.EnumerateObject()
            .SelectMany(caminho => caminho.Value.EnumerateObject()
                .Select(verbo => $"{verbo.Name.ToUpperInvariant()} {caminho.Name}"))
            .ToList();

        Assert.Equal(5, operacoes.Count);
        Assert.Contains("POST /clientes", operacoes);
        Assert.Contains("GET /clientes", operacoes);
        Assert.Contains("GET /clientes/{id}", operacoes);
        Assert.Contains("PUT /clientes/{id}", operacoes);
        Assert.Contains("DELETE /clientes/{id}", operacoes);
    }

    [Fact]
    public async Task Criacao_declara_201_400_e_409_e_as_operacoes_por_id_declaram_404()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var caminhos = (await (await client.GetAsync("/swagger/v1/swagger.json")).LerJson())
            .GetProperty("paths");

        var criacao = Codigos(caminhos, "/clientes", "post");
        Assert.Contains("201", criacao);
        Assert.Contains("400", criacao);
        Assert.Contains("409", criacao);

        foreach (var verbo in new[] { "get", "put", "delete" })
        {
            Assert.Contains("404", Codigos(caminhos, "/clientes/{id}", verbo));
        }

        static List<string> Codigos(System.Text.Json.JsonElement caminhos, string rota, string verbo) =>
        [
            .. caminhos.GetProperty(rota).GetProperty(verbo)
                .GetProperty("responses")
                .EnumerateObject()
                .Select(r => r.Name)
        ];
    }
}
