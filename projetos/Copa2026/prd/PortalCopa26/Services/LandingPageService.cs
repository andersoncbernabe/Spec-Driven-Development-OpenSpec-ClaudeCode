using Microsoft.EntityFrameworkCore;
using PortalCopa26.Data;
using PortalCopa26.Models;
using PortalCopa26.Models.Dtos;

namespace PortalCopa26.Services;

public class LandingPageService(AppDbContext db)
{
    private static string BandeiraUrl(string codigoFifa) =>
        $"https://api.fifa.com/api/v3/picture/flags-sq-4/{codigoFifa}";

    public async Task<ResumoTorneio> ObterResumoAsync()
    {
        var selecoes = await db.Selecoes.CountAsync();
        var grupos   = await db.Grupos.CountAsync();
        var jogos    = await db.Jogos.CountAsync();
        return new ResumoTorneio(selecoes, grupos, jogos, Estadios: 16);
    }

    public async Task<List<ProximoJogoDto>> ObterProximosJogosAsync(int quantidade)
    {
        var jogos = await db.Jogos
            .Include(j => j.SelecaoMandante)
            .Include(j => j.SelecaoVisitante)
            .OrderBy(j => j.DataHora)
            .Take(quantidade)
            .ToListAsync();

        return jogos.Select(j => new ProximoJogoDto
        {
            Id                  = j.Id,
            DataHora            = j.DataHora,
            Cidade              = j.Cidade,
            MandanteNome        = j.SelecaoMandante?.Nome,
            MandanteCodigo      = j.SelecaoMandante?.CodigoFifa,
            MandanteBandeiraUrl = j.SelecaoMandante is not null ? BandeiraUrl(j.SelecaoMandante.CodigoFifa) : null,
            RotuloMandante      = j.RotuloMandante,
            VisitanteNome       = j.SelecaoVisitante?.Nome,
            VisitanteCodigo     = j.SelecaoVisitante?.CodigoFifa,
            VisitanteBandeiraUrl = j.SelecaoVisitante is not null ? BandeiraUrl(j.SelecaoVisitante.CodigoFifa) : null,
            RotuloVisitante     = j.RotuloVisitante,
        }).ToList();
    }

    public async Task<List<RankingItemDto>> ObterTopRankingAsync(int quantidade)
    {
        return await db.RankingFifa
            .OrderBy(r => r.Posicao)
            .Take(quantidade)
            .Select(r => new RankingItemDto
            {
                Posicao     = r.Posicao,
                NomeSelecao = r.NomeSelecao,
                CodigoFifa  = r.CodigoFifa,
                Pontuacao   = r.Pontuacao,
            })
            .ToListAsync();
    }
}
