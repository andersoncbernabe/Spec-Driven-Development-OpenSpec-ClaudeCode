using Microsoft.EntityFrameworkCore;
using PortalCopa26.Data;
using PortalCopa26.Models;

namespace PortalCopa26.Services;

public class RankingService(AppDbContext db)
{
    public async Task<List<RankingFifa>> GetAllAsync()
        => await db.RankingFifa
            .OrderBy(r => r.Posicao)
            .ToListAsync();
}
