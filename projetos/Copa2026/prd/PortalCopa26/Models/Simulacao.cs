namespace PortalCopa26.Models;

public class Simulacao
{
    public int Id { get; set; }
    public DateTime DataCriacao { get; set; }
    public string? Descricao { get; set; }
    public ICollection<SimulacaoJogo> SimulacaoJogos { get; set; } = new List<SimulacaoJogo>();
}
