using Microsoft.EntityFrameworkCore;
using PortalCopa26.Data;
using PortalCopa26.Models;

namespace PortalCopa26.Services;

public class GruposService(AppDbContext db)
{
    public async Task<List<Grupo>> GetAllAsync()
        => await db.Grupos
            .Include(g => g.Selecoes)
            .OrderBy(g => g.Nome)
            .ToListAsync();

    public async Task<Grupo?> GetByNomeAsync(string nome)
        => await db.Grupos
            .Include(g => g.Selecoes)
            .FirstOrDefaultAsync(g => g.Nome == nome);
}
