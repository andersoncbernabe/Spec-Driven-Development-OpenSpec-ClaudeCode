using System.Text.Json;

namespace ApiClientes.Tests;

/// <summary>
/// Cenarios da spec documentacao-api que dependem do fluxo de execucao, nao de
/// uma requisicao HTTP.
///
/// A abertura do navegador e responsabilidade do launchSettings.json, lido apenas
/// por "dotnet run" / F5. Nenhuma linha da aplicacao chama Process.Start, entao
/// uma aplicacao publicada nao tem como abrir navegador — e por isso que o
/// cenario "Publicacao nao abre navegador" e verdadeiro por construcao. O que da
/// para blindar contra regressao e a configuracao, e e o que estes testes fazem.
///
/// A janela do navegador em si e verificada visualmente na tarefa 8.3.
/// </summary>
public class AberturaNavegadorTests
{
    [Fact]
    public void Todo_perfil_de_execucao_abre_o_navegador_na_UI_do_swagger()
    {
        var caminho = Path.Combine(AppContext.BaseDirectory, "launchSettings.json");
        Assert.True(File.Exists(caminho), $"launchSettings.json nao encontrado em {caminho}");

        using var documento = JsonDocument.Parse(File.ReadAllText(caminho));
        var perfis = documento.RootElement.GetProperty("profiles").EnumerateObject().ToList();

        Assert.NotEmpty(perfis);

        foreach (var perfil in perfis)
        {
            // commandName "Project" = perfil de "dotnet run"/F5. Se algum dia
            // aparecer um perfil de outro tipo aqui, este teste obriga a decidir
            // conscientemente o que fazer com ele.
            Assert.Equal("Project", perfil.Value.GetProperty("commandName").GetString());
            Assert.True(perfil.Value.GetProperty("launchBrowser").GetBoolean());
            Assert.Equal("swagger", perfil.Value.GetProperty("launchUrl").GetString());
        }
    }

    [Fact]
    public async Task Aplicacao_hospedada_fora_do_dotnet_run_inicia_e_atende_requisicoes()
    {
        // A WebApplicationFactory sobe a aplicacao sem passar pelo launchSettings,
        // que e o mesmo caminho de uma publicacao: nenhum navegador e aberto e a
        // API atende normalmente.
        using var factory = new ClientesApiFactory();
        var client = factory.CriarClient();

        Assert.Equal(3, await client.Contar());
        Assert.Equal(System.Net.HttpStatusCode.OK, (await client.GetAsync("/swagger")).StatusCode);
    }
}
