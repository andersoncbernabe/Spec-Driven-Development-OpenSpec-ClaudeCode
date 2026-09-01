using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ApiClientes;

public static class ClientesEndpoints
{
    public static RouteGroupBuilder MapClientes(this IEndpointRouteBuilder rotas)
    {
        var grupo = rotas.MapGroup("/clientes");

        grupo.MapGet("", async (ClienteDbContext db) =>
        {
            var clientes = await db.Clientes
                .AsNoTracking()
                .OrderBy(c => c.Id)
                .ToListAsync();

            return TypedResults.Ok(clientes.Select(Para).ToList());
        });

        grupo.MapGet("/{id:int}", async Task<Results<Ok<ClienteResponse>, NotFound>> (
            int id,
            ClienteDbContext db) =>
        {
            var cliente = await db.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);

            return cliente is null
                ? TypedResults.NotFound()
                : TypedResults.Ok(Para(cliente));
        });

        grupo.MapPost("", async Task<Results<Created<ClienteResponse>, ProblemHttpResult>> (
            ClienteRequest requisicao,
            ClienteDbContext db) =>
        {
            var email = requisicao.Email!;

            if (await db.Clientes.AnyAsync(c => c.Email == email))
            {
                return EmailEmUso(email);
            }

            var cliente = new Cliente
            {
                Nome = requisicao.Nome!,
                Email = email,
                DataCadastro = DateTime.UtcNow
            };

            db.Clientes.Add(cliente);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Corrida: outra requisicao gravou o mesmo email entre o AnyAsync
                // acima e este SaveChanges. O indice unico barrou a segunda; traduzir
                // para 409 mantem o contrato em vez de vazar um 500.
                return EmailEmUso(email);
            }

            return TypedResults.Created($"/clientes/{cliente.Id}", Para(cliente));
        })
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status409Conflict);

        grupo.MapPut("/{id:int}", async Task<Results<Ok<ClienteResponse>, NotFound, ProblemHttpResult>> (
            int id,
            ClienteRequest requisicao,
            ClienteDbContext db) =>
        {
            // Precedencia fixa: 400 (filtro de validacao, antes do handler)
            //                -> 404 (o cliente existe?)
            //                -> 409 (o email e de outro?)
            var cliente = await db.Clientes.FirstOrDefaultAsync(c => c.Id == id);
            if (cliente is null)
            {
                return TypedResults.NotFound();
            }

            var email = requisicao.Email!;

            // O proprio registro fica fora da checagem: sem o "c.Id != id", reenviar
            // o email que ja e do cliente responderia 409 indevidamente.
            if (await db.Clientes.AnyAsync(c => c.Email == email && c.Id != id))
            {
                return EmailEmUso(email);
            }

            // Id e DataCadastro ficam intocados de proposito: sao imutaveis.
            cliente.Nome = requisicao.Nome!;
            cliente.Email = email;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return EmailEmUso(email);
            }

            return TypedResults.Ok(Para(cliente));
        })
        .ProducesValidationProblem()
        .ProducesProblem(StatusCodes.Status409Conflict);

        grupo.MapDelete("/{id:int}", async Task<Results<NoContent, NotFound>> (
            int id,
            ClienteDbContext db) =>
        {
            var cliente = await db.Clientes.FirstOrDefaultAsync(c => c.Id == id);
            if (cliente is null)
            {
                return TypedResults.NotFound();
            }

            db.Clientes.Remove(cliente);
            await db.SaveChangesAsync();

            return TypedResults.NoContent();
        });

        return grupo;
    }

    private static ProblemHttpResult EmailEmUso(string email) =>
        TypedResults.Problem(
            detail: $"O email '{email}' ja esta em uso por outro cliente.",
            statusCode: StatusCodes.Status409Conflict,
            title: "Email ja cadastrado");

    private static ClienteResponse Para(Cliente cliente) =>
        new(cliente.Id, cliente.Nome, cliente.Email, cliente.DataCadastro);
}
