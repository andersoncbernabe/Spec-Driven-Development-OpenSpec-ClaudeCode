using System.Net;

namespace ApiClientes.Tests;

/// <summary>Tarefa 7.4 — cenarios de "Unicidade de email" da spec gestao-clientes.</summary>
public class UnicidadeEmailTests
{
    [Fact]
    public async Task Criacao_com_email_ja_cadastrado_responde_409_e_nao_cria_ninguem()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var antes = await client.Contar();

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Outra Ana", "ana.souza@exemplo.com"));

        Assert.Equal(HttpStatusCode.Conflict, resposta.StatusCode);
        Assert.Equal(antes, await client.Contar());
    }

    [Fact]
    public async Task Atualizacao_com_email_de_outro_cliente_responde_409_sem_alterar_dados()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/1", Ajudantes.Corpo("Ana", "bruno.lima@exemplo.com"));

        Assert.Equal(HttpStatusCode.Conflict, resposta.StatusCode);

        var cliente = await (await client.GetAsync("/clientes/1")).LerJson();
        Assert.Equal("Ana Souza", cliente.GetProperty("nome").GetString());
        Assert.Equal("ana.souza@exemplo.com", cliente.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Atualizacao_mantendo_o_proprio_email_responde_200_e_atualiza_o_nome()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        var resposta = await client.PutAsync("/clientes/1", Ajudantes.Corpo("Ana Souza Silva", "ana.souza@exemplo.com"));

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Equal("Ana Souza Silva", (await resposta.LerJson()).GetProperty("nome").GetString());
    }

    [Fact]
    public async Task Email_liberado_apos_remocao_pode_ser_reutilizado()
    {
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/clientes/1")).StatusCode);

        var resposta = await client.PostAsync("/clientes", Ajudantes.Corpo("Ana Reaproveitada", "ana.souza@exemplo.com"));

        Assert.Equal(HttpStatusCode.Created, resposta.StatusCode);
    }
}
