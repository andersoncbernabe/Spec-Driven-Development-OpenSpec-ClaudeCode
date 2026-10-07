namespace PortalCopa26.Models.Dtos;

public class RankingItemDto
{
    public int Posicao { get; set; }
    public string NomeSelecao { get; set; } = string.Empty;
    public string CodigoFifa { get; set; } = string.Empty;
    public decimal Pontuacao { get; set; }
}
