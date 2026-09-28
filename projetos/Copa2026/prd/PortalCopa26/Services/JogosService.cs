using Microsoft.EntityFrameworkCore;
using PortalCopa26.Data;
using PortalCopa26.Models;

namespace PortalCopa26.Services;

public class JogosService(AppDbContext db)
{
    public async Task<List<Jogo>> GetAllAsync()
        => await db.Jogos
            .Include(j => j.SelecaoMandante)
            .Include(j => j.SelecaoVisitante)
            .OrderBy(j => j.DataHora)
            .ToListAsync();

    public async Task<List<Jogo>> GetByFaseAsync(string fase)
        => await db.Jogos
            .Include(j => j.SelecaoMandante)
            .Include(j => j.SelecaoVisitante)
            .Where(j => j.Fase == fase)
            .OrderBy(j => j.DataHora)
            .ToListAsync();
}
