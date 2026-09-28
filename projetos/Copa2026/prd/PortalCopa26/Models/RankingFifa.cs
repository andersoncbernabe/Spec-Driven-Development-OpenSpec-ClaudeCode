namespace PortalCopa26.Models;

public class RankingFifa
{
    public int Id { get; set; }
    public int Posicao { get; set; }
    public string NomeSelecao { get; set; } = string.Empty;
    public string CodigoFifa { get; set; } = string.Empty;
    public decimal Pontuacao { get; set; }
}
