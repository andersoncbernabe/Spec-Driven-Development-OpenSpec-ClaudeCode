using ApiClientes;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddValidation();
builder.Services.AddProblemDetails();

builder.Services.AddDbContext<ClienteDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Clientes")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<ClienteDbContext>().Database.Migrate();
}

// Preenche com ProblemDetails as respostas de erro que saem sem corpo
// (o 404 de TypedResults.NotFound()), atendendo ao requisito de formato
// padronizado de erro para 400, 404 e 409.
app.UseStatusCodePages();

app.UseSwagger();
app.UseSwaggerUI();

app.MapClientes();

app.Run();
