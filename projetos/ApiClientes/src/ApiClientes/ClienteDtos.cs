using System.ComponentModel.DataAnnotations;

namespace ApiClientes;

/// <summary>
/// Corpo aceito na criacao e na atualizacao. Nao expoe Id nem DataCadastro:
/// ambos sao atribuidos pelo sistema, entao e fisicamente impossivel o cliente
/// enviar um valor para eles.
/// </summary>
public class ClienteRequest
{
    [Required]
    public string? Nome { get; set; }

    [Required]
    [EmailAddress]
    public string? Email { get; set; }
}

public record ClienteResponse(int Id, string Nome, string Email, DateTime DataCadastro);
