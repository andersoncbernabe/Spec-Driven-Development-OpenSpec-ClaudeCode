namespace PortalCopa26.Models;

public class SimulacaoJogo
{
    public int Id { get; set; }
    public int SimulacaoId { get; set; }
    public Simulacao Simulacao { get; set; } = null!;
    public int JogoId { get; set; }
    public Jogo Jogo { get; set; } = null!;
    public int PlacarMandante { get; set; }
    public int PlacarVisitante { get; set; }
}
