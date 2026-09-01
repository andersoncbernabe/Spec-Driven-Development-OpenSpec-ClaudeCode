using System.Text;
using System.Text.Json;

namespace ApiClientes.Tests;

internal static class Ajudantes
{
    /// <summary>
    /// Envia o corpo como JSON cru, para que cada teste controle exatamente o que
    /// vai na requisicao — inclusive omitir campos ou mandar um "id" que a API
    /// deve ignorar.
    /// </summary>
    public static StringContent Json(string json) =>
        new(json, Encoding.UTF8, "application/json");

    public static StringContent Corpo(string nome, string email) =>
        Json($"{{\"nome\":{JsonSerializer.Serialize(nome)},\"email\":{JsonSerializer.Serialize(email)}}}");

    public static async Task<JsonElement> LerJson(this HttpResponseMessage resposta)
    {
        var texto = await resposta.Content.ReadAsStringAsync();
        using var documento = JsonDocument.Parse(texto);
        return documento.RootElement.Clone();
    }

    /// <summary>
    /// Le dataCadastro como a string exata que a API emitiu, sem passar por
    /// DateTime — e a unica forma de comparar caractere a caractere.
    /// </summary>
    public static async Task<string> LerDataCadastro(this HttpResponseMessage resposta) =>
        (await resposta.LerJson()).GetProperty("dataCadastro").GetString()!;

    public static async Task<int> LerId(this HttpResponseMessage resposta) =>
        (await resposta.LerJson()).GetProperty("id").GetInt32();

    public static async Task<List<JsonElement>> LerLista(this HttpResponseMessage resposta) =>
        [.. (await resposta.LerJson()).EnumerateArray()];

    /// <summary>Nomes dos campos reportados como invalidos, em minusculas.</summary>
    public static async Task<List<string>> LerCamposInvalidos(this HttpResponseMessage resposta) =>
    [
        .. (await resposta.LerJson()).GetProperty("errors")
            .EnumerateObject()
            .Select(propriedade => propriedade.Name.ToLowerInvariant())
    ];

    /// <summary>Cria um cliente e devolve o id, falhando o teste se nao vier 201.</summary>
    public static async Task<int> Criar(this HttpClient client, string nome, string email)
    {
        var resposta = await client.PostAsync("/clientes", Corpo(nome, email));
        Assert.Equal(System.Net.HttpStatusCode.Created, resposta.StatusCode);
        return await resposta.LerId();
    }

    public static async Task<int> Contar(this HttpClient client) =>
        (await (await client.GetAsync("/clientes")).LerLista()).Count;

    public static async Task ApagarTodos(this HttpClient client)
    {
        var clientes = await (await client.GetAsync("/clientes")).LerLista();
        foreach (var cliente in clientes)
        {
            var resposta = await client.DeleteAsync($"/clientes/{cliente.GetProperty("id").GetInt32()}");
            Assert.Equal(System.Net.HttpStatusCode.NoContent, resposta.StatusCode);
        }
    }
}
