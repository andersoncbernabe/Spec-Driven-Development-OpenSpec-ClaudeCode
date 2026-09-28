using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using PortalCopa26.Models;

namespace PortalCopa26.Data;

public class DataSeeder(AppDbContext db, IWebHostEnvironment env, ILogger<DataSeeder> logger)
{
    private static readonly Dictionary<string, string> NomeNormalizacao = new(StringComparer.OrdinalIgnoreCase)
    {
        { "República Tcheca", "Tchéquia" }, { "Tchéquia", "Tchéquia" },
        { "Coreia do Sul", "República da Coreia" }, { "República da Coreia", "República da Coreia" },
        { "RD Congo", "República Democrática do Congo" }, { "República Democrática do Congo", "República Democrática do Congo" },
        { "Costa do Marfim", "Côte d'Ivoire" }, { "Côte d'Ivoire", "Côte d'Ivoire" },
        { "Curaçau", "Curaçao" }, { "Curaçao", "Curaçao" },
        { "Bósnia", "Bósnia e Herzegovina" }, { "Bósnia e Herzegovina", "Bósnia e Herzegovina" },
        { "Irã", "República Islâmica do Irã" }, { "República Islâmica do Irã", "República Islâmica do Irã" },
        { "EUA", "Estados Unidos" }, { "Estados Unidos", "Estados Unidos" },
        { "Coreia", "República da Coreia" },
    };

    private static readonly Dictionary<string, List<string>> GrupoSelecoes = new()
    {
        { "Grupo A", ["México", "África do Sul", "República da Coreia", "Tchéquia"] },
        { "Grupo B", ["Canadá", "Bósnia e Herzegovina", "Catar", "Suíça"] },
        { "Grupo C", ["Brasil", "Marrocos", "Haiti", "Escócia"] },
        { "Grupo D", ["Estados Unidos", "Paraguai", "Austrália", "Turquia"] },
        { "Grupo E", ["Alemanha", "Curaçao", "Côte d'Ivoire", "Equador"] },
        { "Grupo F", ["Holanda", "Japão", "Suécia", "Tunísia"] },
        { "Grupo G", ["Bélgica", "Egito", "República Islâmica do Irã", "Nova Zelândia"] },
        { "Grupo H", ["Espanha", "Cabo Verde", "Arábia Saudita", "Uruguai"] },
        { "Grupo I", ["França", "Senegal", "Iraque", "Noruega"] },
        { "Grupo J", ["Argentina", "Argélia", "Áustria", "Jordânia"] },
        { "Grupo K", ["Portugal", "República Democrática do Congo", "Uzbequistão", "Colômbia"] },
        { "Grupo L", ["Inglaterra", "Croácia", "Gana", "Panamá"] },
    };

    private static readonly Dictionary<string, string> CodigosFifa = new(StringComparer.OrdinalIgnoreCase)
    {
        { "México", "MEX" }, { "África do Sul", "RSA" }, { "República da Coreia", "KOR" }, { "Tchéquia", "CZE" },
        { "Canadá", "CAN" }, { "Bósnia e Herzegovina", "BIH" }, { "Catar", "QAT" }, { "Suíça", "SUI" },
        { "Brasil", "BRA" }, { "Marrocos", "MAR" }, { "Haiti", "HAI" }, { "Escócia", "SCO" },
        { "Estados Unidos", "USA" }, { "Paraguai", "PAR" }, { "Austrália", "AUS" }, { "Turquia", "TUR" },
        { "Alemanha", "GER" }, { "Curaçao", "CUW" }, { "Côte d'Ivoire", "CIV" }, { "Equador", "ECU" },
        { "Holanda", "NED" }, { "Japão", "JPN" }, { "Suécia", "SWE" }, { "Tunísia", "TUN" },
        { "Bélgica", "BEL" }, { "Egito", "EGY" }, { "República Islâmica do Irã", "IRN" }, { "Nova Zelândia", "NZL" },
        { "Espanha", "ESP" }, { "Cabo Verde", "CPV" }, { "Arábia Saudita", "KSA" }, { "Uruguai", "URU" },
        { "França", "FRA" }, { "Senegal", "SEN" }, { "Iraque", "IRQ" }, { "Noruega", "NOR" },
        { "Argentina", "ARG" }, { "Argélia", "ALG" }, { "Áustria", "AUT" }, { "Jordânia", "JOR" },
        { "Portugal", "POR" }, { "República Democrática do Congo", "COD" }, { "Uzbequistão", "UZB" }, { "Colômbia", "COL" },
        { "Inglaterra", "ENG" }, { "Croácia", "CRO" }, { "Gana", "GHA" }, { "Panamá", "PAN" },
    };

    private static readonly Dictionary<string, int> MesesPt = new(StringComparer.OrdinalIgnoreCase)
    {
        { "janeiro", 1 }, { "fevereiro", 2 }, { "março", 3 }, { "abril", 4 },
        { "maio", 5 }, { "junho", 6 }, { "julho", 7 }, { "agosto", 8 },
        { "setembro", 9 }, { "outubro", 10 }, { "novembro", 11 }, { "dezembro", 12 },
    };

    public async Task SeedAsync()
    {
        if (await db.Grupos.AnyAsync()) return;

        logger.LogInformation("Iniciando carga de dados oficiais da Copa 2026...");
        await SeedGruposESelecoes();
        await SeedJogadores();
        await SeedJogosGrupos();
        await SeedJogosSegundaFase();
        await SeedJogosEliminatorios();
        await SeedRankingFifa();
        logger.LogInformation("Carga de dados concluída.");
    }

    private async Task SeedGruposESelecoes()
    {
        foreach (var (nomeGrupo, times) in GrupoSelecoes)
        {
            var grupo = new Grupo { Nome = nomeGrupo };
            db.Grupos.Add(grupo);
            foreach (var time in times)
            {
                var codigo = CodigosFifa.TryGetValue(time, out var c) ? c : time[..3].ToUpper();
                db.Selecoes.Add(new Selecao { Nome = time, CodigoFifa = codigo, Grupo = grupo });
            }
        }
        await db.SaveChangesAsync();
        logger.LogInformation("Grupos e seleções carregados: 12 grupos, 48 seleções.");
    }

    private async Task SeedJogadores()
    {
        var selecoesPorNome = await db.Selecoes.ToDictionaryAsync(s => s.Nome, StringComparer.OrdinalIgnoreCase);
        var jogadores = new List<Jogador>();
        Selecao? atual = null;

        foreach (var linha in await LerArquivoAsync("copa2026_selecoes_jogadores.txt"))
        {
            if (string.IsNullOrWhiteSpace(linha)) continue;

            if (linha.StartsWith('#'))
            {
                selecoesPorNome.TryGetValue(Normalizar(linha[1..].Trim()), out atual);
                if (atual is null) logger.LogWarning("Seleção não encontrada: {Nome}", linha[1..].Trim());
                continue;
            }

            if (atual is null) continue;
            var p = linha.Split('|');
            if (p.Length < 3) continue;

            jogadores.Add(new Jogador
            {
                Nome = p[0].Trim(),
                Idade = int.TryParse(p.ElementAtOrDefault(1)?.Trim(), out var idade) ? idade : 0,
                Posicao = p[2].Trim(),
                Numero = 0,
                SelecaoId = atual.Id,
            });
        }

        db.Jogadores.AddRange(jogadores);
        await db.SaveChangesAsync();
        logger.LogInformation("Jogadores carregados: {Total}.", jogadores.Count);
    }

    private async Task SeedJogosGrupos()
    {
        var selecoesPorNome = await db.Selecoes.ToDictionaryAsync(s => s.Nome, StringComparer.OrdinalIgnoreCase);
        var jogos = new List<Jogo>();
        var linhas = await LerArquivoAsync("copa2026_jogos_primeira_fase.txt");
        DateTime? dataAtual = null;

        for (int i = 0; i < linhas.Count; i++)
        {
            var linha = linhas[i].Trim();
            if (string.IsNullOrWhiteSpace(linha) || linha.StartsWith("---")) continue;

            if (TentarParsearData(linha, out var data)) { dataAtual = data; continue; }
            if (dataAtual is null) continue;

            var sepIdx = linha.IndexOf(" x ", StringComparison.Ordinal);
            if (sepIdx < 0) continue;

            var parteDireita = linha[(sepIdx + 3)..];
            var m = Regex.Match(parteDireita, @"^(.+?)\s{2,}(\d{2}:\d{2})\s*hs(.*)$");
            if (!m.Success) continue;

            var nomeTime1 = Normalizar(linha[..sepIdx].Trim());
            var nomeTime2 = Normalizar(m.Groups[1].Value.Trim());
            var horaStr = m.Groups[2].Value;
            var sufixo = m.Groups[3].Value.Trim();

            var dataJogo = dataAtual.Value;
            if (!string.IsNullOrEmpty(sufixo))
            {
                var mDia = Regex.Match(sufixo, @"\((\d+)\s+de\s+(\w+)\)");
                if (mDia.Success && MesesPt.TryGetValue(mDia.Groups[2].Value, out var mes))
                    dataJogo = new DateTime(2026, mes, int.Parse(mDia.Groups[1].Value));
            }

            if (!TimeSpan.TryParseExact(horaStr, @"hh\:mm", CultureInfo.InvariantCulture, out var hora)) continue;
            dataJogo = dataJogo.Add(hora);

            string? estadio = null, cidade = null, fase = "Fase de Grupos";
            if (i + 1 < linhas.Count)
            {
                var info = linhas[i + 1].Trim();
                var partes = info.Split('·', StringSplitOptions.TrimEntries);
                if (partes.Length >= 3)
                {
                    fase = partes[0];
                    var estadioRaw = partes[2];
                    var mCidade = Regex.Match(estadioRaw, @"^(.+?)\s*\((.+)\)$");
                    estadio = mCidade.Success ? mCidade.Groups[1].Value.Trim() : estadioRaw;
                    cidade = mCidade.Success ? mCidade.Groups[2].Value.Trim() : estadioRaw;
                }
                i++;
            }

            selecoesPorNome.TryGetValue(nomeTime1, out var s1);
            selecoesPorNome.TryGetValue(nomeTime2, out var s2);
            if (s1 is null) logger.LogWarning("Seleção não encontrada (grupos): '{Nome}'", nomeTime1);
            if (s2 is null) logger.LogWarning("Seleção não encontrada (grupos): '{Nome}'", nomeTime2);

            jogos.Add(new Jogo
            {
                Fase = fase,
                DataHora = dataJogo,
                Estadio = estadio ?? string.Empty,
                Cidade = cidade ?? string.Empty,
                SelecaoMandanteId = s1?.Id,
                SelecaoVisitanteId = s2?.Id,
            });
        }

        db.Jogos.AddRange(jogos);
        await db.SaveChangesAsync();
        logger.LogInformation("Jogos da fase de grupos carregados: {Total}.", jogos.Count);
    }

    private async Task SeedJogosSegundaFase()
    {
        var selecoesPorNome = await db.Selecoes.ToDictionaryAsync(s => s.Nome, StringComparer.OrdinalIgnoreCase);
        var linhas = await LerArquivoAsync("copa2026_Jogos_Segunda_fase.txt");
        var jogos = ParseJogosEliminatorios(linhas, "Segunda Fase", selecoesPorNome);
        db.Jogos.AddRange(jogos);
        await db.SaveChangesAsync();
        logger.LogInformation("Jogos da segunda fase carregados: {Total}.", jogos.Count);
    }

    private async Task SeedJogosEliminatorios()
    {
        Dictionary<string, Selecao>? vazio = null;
        var arquivos = new[]
        {
            ("copa2026_jogos_oitavas.txt", "Oitavas de Final"),
            ("copa2026_jogos_quartas.txt", "Quartas de Final"),
            ("copa2026_jogos_semifinal.txt", "Semifinal"),
            ("copa2026_jogo_terceiro_lugar.txt", "Terceiro Lugar"),
            ("copa2026_jogo_final.txt", "Final"),
        };

        foreach (var (arquivo, fase) in arquivos)
        {
            var jogos = ParseJogosEliminatorios(await LerArquivoAsync(arquivo), fase, vazio);
            db.Jogos.AddRange(jogos);
            logger.LogInformation("{Fase}: {Total} jogo(s).", fase, jogos.Count);
        }

        await db.SaveChangesAsync();
    }

    private List<Jogo> ParseJogosEliminatorios(
        List<string> linhas,
        string faseDefault,
        Dictionary<string, Selecao>? selecoesPorNome)
    {
        var jogos = new List<Jogo>();
        int i = 0;

        while (i < linhas.Count)
        {
            var linha = linhas[i++].Trim();
            if (string.IsNullOrWhiteSpace(linha)) continue;

            if (!IsLinhaId(linha)) continue;

            // Coleta linhas do bloco até encontrar o confronto (linha com " x ")
            var blocoInfo = new List<string>();
            string? confronto = null;

            while (i < linhas.Count)
            {
                var l = linhas[i++].Trim();
                if (string.IsNullOrWhiteSpace(l)) continue;

                if (l.Contains(" x ", StringComparison.Ordinal))
                {
                    confronto = l;
                    break;
                }
                blocoInfo.Add(l);
            }

            if (confronto is null) continue;

            // Extrair data e hora de qualquer linha do bloco
            var dataHora = ExtrairDataHora(blocoInfo);
            var cidade = ExtrairCidade(blocoInfo);

            var sepIdx = confronto.IndexOf(" x ", StringComparison.Ordinal);
            if (sepIdx < 0) continue;

            var lado1 = confronto[..sepIdx].Trim();
            var lado2 = confronto[(sepIdx + 3)..].Trim();

            var jogo = new Jogo
            {
                Fase = faseDefault,
                DataHora = dataHora,
                Estadio = string.Empty,
                Cidade = cidade,
            };

            if (selecoesPorNome != null)
            {
                var n1 = Normalizar(lado1);
                var n2 = Normalizar(lado2);
                selecoesPorNome.TryGetValue(n1, out var s1);
                selecoesPorNome.TryGetValue(n2, out var s2);
                if (s1 is null) logger.LogWarning("Seleção não encontrada (2ª fase): '{Nome}'", n1);
                if (s2 is null) logger.LogWarning("Seleção não encontrada (2ª fase): '{Nome}'", n2);
                jogo.SelecaoMandanteId = s1?.Id;
                jogo.SelecaoVisitanteId = s2?.Id;
            }
            else
            {
                jogo.RotuloMandante = lado1;
                jogo.RotuloVisitante = lado2;
            }

            jogos.Add(jogo);
        }

        return jogos;
    }

    private static bool IsLinhaId(string linha) =>
        linha.StartsWith("Oitavas", StringComparison.OrdinalIgnoreCase) ||
        linha.StartsWith("Segundafase", StringComparison.OrdinalIgnoreCase) ||
        linha.StartsWith("Quartas", StringComparison.OrdinalIgnoreCase) ||
        linha.StartsWith("Semifinal", StringComparison.OrdinalIgnoreCase) ||
        linha.Equals("Final", StringComparison.OrdinalIgnoreCase) ||
        linha.StartsWith("Terceiro", StringComparison.OrdinalIgnoreCase);

    private static DateTime ExtrairDataHora(List<string> linhas)
    {
        int? dia = null, mes = null;
        TimeSpan? hora = null;

        foreach (var l in linhas)
        {
            var mData = Regex.Match(l, @"(\d{1,2})/(\d{2})");
            if (mData.Success)
            {
                dia = int.Parse(mData.Groups[1].Value);
                mes = int.Parse(mData.Groups[2].Value);
            }

            var mHora = Regex.Match(l, @"(\d{2}:\d{2})");
            if (mHora.Success && TimeSpan.TryParseExact(mHora.Groups[1].Value, @"hh\:mm", CultureInfo.InvariantCulture, out var h))
                hora = h;
        }

        if (dia is null || mes is null) return new DateTime(2026, 7, 1);
        var data = new DateTime(2026, mes.Value, dia.Value);
        return hora.HasValue ? data.Add(hora.Value) : data;
    }

    private static string ExtrairCidade(List<string> linhas)
    {
        foreach (var l in linhas)
        {
            var mData = Regex.Match(l, @"\d{1,2}/\d{2}");
            if (mData.Success)
                return l[..mData.Index].Trim();
        }
        return linhas.FirstOrDefault() ?? string.Empty;
    }

    private async Task SeedRankingFifa()
    {
        var linhas = await LerArquivoAsync("copa2026_ranking_fifa.txt");
        var registros = new List<RankingFifa>();

        foreach (var linha in linhas)
        {
            if (string.IsNullOrWhiteSpace(linha)) continue;
            var partes = linha.Split('\t', StringSplitOptions.RemoveEmptyEntries);
            if (partes.Length < 3) continue;
            if (!int.TryParse(partes[0].Trim(), out var posicao)) continue;
            if (!decimal.TryParse(partes[^1].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var pontos)) continue;

            var nome = string.Join(" ", partes[1..^1]).Trim();
            var codigoFifa = CodigosFifa.TryGetValue(nome, out var c) ? c : string.Empty;

            registros.Add(new RankingFifa { Posicao = posicao, NomeSelecao = nome, CodigoFifa = codigoFifa, Pontuacao = pontos });
        }

        db.RankingFifa.AddRange(registros);
        await db.SaveChangesAsync();
        logger.LogInformation("Ranking FIFA carregado: {Total} posições.", registros.Count);
    }

    private bool TentarParsearData(string linha, out DateTime data)
    {
        data = default;
        var m = Regex.Match(linha, @"^\w[\w-]* (\d+) (\w+) (\d{4})$");
        if (!m.Success) return false;
        if (!MesesPt.TryGetValue(m.Groups[2].Value, out var mes)) return false;
        data = new DateTime(int.Parse(m.Groups[3].Value), mes, int.Parse(m.Groups[1].Value));
        return true;
    }

    private static string Normalizar(string nome)
    {
        var key = nome.Trim();
        return NomeNormalizacao.TryGetValue(key, out var canonico) ? canonico : key;
    }

    private async Task<List<string>> LerArquivoAsync(string nomeArquivo)
    {
        var caminho = Path.Combine(env.ContentRootPath, "fontes", nomeArquivo);
        if (!File.Exists(caminho))
        {
            logger.LogWarning("Arquivo de fonte não encontrado: {Caminho}", caminho);
            return [];
        }
        return [.. await File.ReadAllLinesAsync(caminho)];
    }
}
