using System.Globalization;
using System.Net;

namespace ApiClientes.Tests;

/// <summary>
/// Tarefa 7.5 — cenarios de "Data de cadastro gerada pelo sistema".
/// O teste central e o da representacao estavel: e ele que pega a perda de
/// DateTimeKind no round-trip do SQLite (decisao 6).
/// </summary>
public class DataCadastroTests
{
    [Fact]
    public async Task Data_atribuida_na_criacao_corresponde_ao_instante_em_UTC()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var antes = DateTime.UtcNow.AddSeconds(-5);
        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Diego", "diego@exemplo.com"));
        var depois = DateTime.UtcNow.AddSeconds(5);

        var texto = await resposta.LerDataCadastro();

        Assert.EndsWith("Z", texto);

        var data = DateTime.Parse(texto, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
        Assert.Equal(DateTimeKind.Utc, data.Kind);
        Assert.InRange(data, antes, depois);
    }

    [Fact]
    public async Task Representacao_e_identica_caractere_a_caractere_entre_criacao_e_consulta()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var criacao = await client.PostAsync("/clientes", Ajudantes.Corpo("Diego", "diego@exemplo.com"));
        var id = await criacao.LerId();
        var naCriacao = await criacao.LerDataCadastro();

        var naConsulta = await (await client.GetAsync($"/clientes/{id}")).LerDataCadastro();

        var naListagem = (await (await client.GetAsync("/clientes")).LerLista())
            .Single(c => c.GetProperty("id").GetInt32() == id)
            .GetProperty("dataCadastro")
            .GetString();

        Assert.Equal(naCriacao, naConsulta);
        Assert.Equal(naCriacao, naListagem);
    }

    [Fact]
    public async Task Atualizacao_nao_altera_a_data_de_cadastro()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var criacao = await client.PostAsync("/clientes", Ajudantes.Corpo("Diego", "diego@exemplo.com"));
        var id = await criacao.LerId();
        var original = await criacao.LerDataCadastro();

        var atualizacao = await client.PutAsync($"/clientes/{id}", Ajudantes.Corpo("Diego Alterado", "diego@exemplo.com"));

        Assert.Equal(HttpStatusCode.OK, atualizacao.StatusCode);
        Assert.Equal(original, await atualizacao.LerDataCadastro());
        Assert.Equal(original, await (await client.GetAsync($"/clientes/{id}")).LerDataCadastro());
    }
}
