namespace PortalCopa26.Models;

public class Jogo
{
    public int Id { get; set; }
    public string Fase { get; set; } = string.Empty;
    public DateTime DataHora { get; set; }
    public string Estadio { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;

    // Fase de grupos: seleções definidas
    public int? SelecaoMandanteId { get; set; }
    public Selecao? SelecaoMandante { get; set; }

    public int? SelecaoVisitanteId { get; set; }
    public Selecao? SelecaoVisitante { get; set; }

    // Fases eliminatórias: rótulo da vaga (ex: "Venc. Segundafase 1")
    public string? RotuloMandante { get; set; }
    public string? RotuloVisitante { get; set; }

    public int? PlacarMandante { get; set; }
    public int? PlacarVisitante { get; set; }
}
