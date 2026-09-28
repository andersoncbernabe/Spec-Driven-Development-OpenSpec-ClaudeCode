using Microsoft.EntityFrameworkCore;
using PortalCopa26.Models;

namespace PortalCopa26.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Grupo> Grupos => Set<Grupo>();
    public DbSet<Selecao> Selecoes => Set<Selecao>();
    public DbSet<Jogador> Jogadores => Set<Jogador>();
    public DbSet<Jogo> Jogos => Set<Jogo>();
    public DbSet<RankingFifa> RankingFifa => Set<RankingFifa>();
    public DbSet<Simulacao> Simulacoes => Set<Simulacao>();
    public DbSet<SimulacaoJogo> SimulacaoJogos => Set<SimulacaoJogo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Selecao>(e =>
        {
            e.HasOne(s => s.Grupo)
             .WithMany(g => g.Selecoes)
             .HasForeignKey(s => s.GrupoId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(s => s.CodigoFifa).IsUnique();
            e.HasIndex(s => s.Nome).IsUnique();
        });

        modelBuilder.Entity<Jogador>(e =>
        {
            e.HasOne(j => j.Selecao)
             .WithMany(s => s.Jogadores)
             .HasForeignKey(j => j.SelecaoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Jogo>(e =>
        {
            e.HasOne(j => j.SelecaoMandante)
             .WithMany()
             .HasForeignKey(j => j.SelecaoMandanteId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(j => j.SelecaoVisitante)
             .WithMany()
             .HasForeignKey(j => j.SelecaoVisitanteId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(j => j.Fase);
            e.HasIndex(j => j.DataHora);
        });

        modelBuilder.Entity<SimulacaoJogo>(e =>
        {
            e.HasOne(sj => sj.Simulacao)
             .WithMany(s => s.SimulacaoJogos)
             .HasForeignKey(sj => sj.SimulacaoId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(sj => sj.Jogo)
             .WithMany()
             .HasForeignKey(sj => sj.JogoId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Grupo>(e =>
        {
            e.HasIndex(g => g.Nome).IsUnique();
        });

        modelBuilder.Entity<RankingFifa>(e =>
        {
            e.HasIndex(r => r.Posicao).IsUnique();
        });
    }
}
