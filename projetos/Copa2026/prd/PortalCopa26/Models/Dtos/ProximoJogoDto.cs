namespace PortalCopa26.Models.Dtos;

public class ProximoJogoDto
{
    public int Id { get; set; }
    public DateTime DataHora { get; set; }
    public string Cidade { get; set; } = string.Empty;
    public string? MandanteNome { get; set; }
    public string? MandanteCodigo { get; set; }
    public string? MandanteBandeiraUrl { get; set; }
    public string? RotuloMandante { get; set; }
    public string? VisitanteNome { get; set; }
    public string? VisitanteCodigo { get; set; }
    public string? VisitanteBandeiraUrl { get; set; }
    public string? RotuloVisitante { get; set; }
}
