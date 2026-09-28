using Microsoft.EntityFrameworkCore;
using PortalCopa26.Data;
using PortalCopa26.Models;

namespace PortalCopa26.Services;

public class SelecaoService(AppDbContext db)
{
    public async Task<List<Selecao>> GetAllAsync()
        => await db.Selecoes
            .Include(s => s.Grupo)
            .OrderBy(s => s.Nome)
            .ToListAsync();

    public async Task<Selecao?> GetByCodigoFifaAsync(string codigoFifa)
        => await db.Selecoes
            .Include(s => s.Grupo)
            .Include(s => s.Jogadores)
            .FirstOrDefaultAsync(s => s.CodigoFifa == codigoFifa);
}
