namespace PortalCopa26.Models;

public class Jogador
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Posicao { get; set; } = string.Empty;
    public int Numero { get; set; }
    public int Idade { get; set; }
    public int SelecaoId { get; set; }
    public Selecao Selecao { get; set; } = null!;
}
