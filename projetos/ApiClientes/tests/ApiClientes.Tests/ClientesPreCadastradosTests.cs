using System.Net;

namespace ApiClientes.Tests;

/// <summary>Tarefa 7.8 — cenarios de "Clientes pre-cadastrados em base nova".</summary>
public class ClientesPreCadastradosTests
{
    private static readonly (int Id, string Nome, string Email, string Data)[] Esperados =
    [
        (1, "Ana Souza", "ana.souza@exemplo.com", "2026-01-15T09:00:00Z"),
        (2, "Bruno Lima", "bruno.lima@exemplo.com", "2026-02-20T14:30:00Z"),
        (3, "Carla Mendes", "carla.mendes@exemplo.com", "2026-03-05T11:15:00Z")
    ];

    [Fact]
    public async Task Base_nova_contem_exatamente_os_tres_clientes_da_spec()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var clientes = await (await client.GetAsync("/clientes")).LerLista();

        Assert.Equal(3, clientes.Count);

        foreach (var esperado in Esperados)
        {
            var encontrado = clientes.Single(c => c.GetProperty("id").GetInt32() == esperado.Id);
            Assert.Equal(esperado.Nome, encontrado.GetProperty("nome").GetString());
            Assert.Equal(esperado.Email, encontrado.GetProperty("email").GetString());
            Assert.Equal(esperado.Data, encontrado.GetProperty("dataCadastro").GetString());
        }
    }

    [Fact]
    public async Task Datas_dos_clientes_iniciais_sao_fixas_entre_bases_diferentes()
    {
        using var primeira = new ClientesApiFactory();
        using var segunda = new ClientesApiFactory();

        var datasA = await LerDatas(primeira.CriarClient());
        var datasB = await LerDatas(segunda.CriarClient());

        Assert.Equal(datasA, datasB);
        Assert.Equal(Esperados.Select(e => e.Data), datasA);

        static async Task<List<string>> LerDatas(HttpClient client) =>
        [
            .. (await (await client.GetAsync("/clientes")).LerLista())
                .OrderBy(c => c.GetProperty("id").GetInt32())
                .Select(c => c.GetProperty("dataCadastro").GetString()!)
        ];
    }

    [Fact]
    public async Task Cliente_criado_em_base_recem_criada_recebe_o_identificador_4()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var id = await client.Criar("Diego Alves", "diego.alves@exemplo.com");

        Assert.Equal(4, id);
    }

    [Fact]
    public async Task Cliente_inicial_pode_ser_atualizado()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/1", Ajudantes.Corpo("Ana Souza Atualizada", "ana.souza@exemplo.com"));

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Equal("Ana Souza Atualizada", (await resposta.LerJson()).GetProperty("nome").GetString());
    }

    [Fact]
    public async Task Cliente_inicial_pode_ser_removido()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/clientes/2")).StatusCode);
        Assert.Equal(2, await client.Contar());
    }

    [Fact]
    public async Task Email_de_cliente_inicial_participa_da_regra_de_unicidade()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Homonima", "ana.souza@exemplo.com"));

        Assert.Equal(HttpStatusCode.Conflict, resposta.StatusCode);
    }
}
