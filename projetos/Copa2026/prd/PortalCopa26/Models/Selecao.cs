namespace PortalCopa26.Models;

public class Selecao
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string CodigoFifa { get; set; } = string.Empty;
    public int GrupoId { get; set; }
    public Grupo Grupo { get; set; } = null!;
    public ICollection<Jogador> Jogadores { get; set; } = new List<Jogador>();
}
