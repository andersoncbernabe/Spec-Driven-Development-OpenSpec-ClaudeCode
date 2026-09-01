## 1. Fundação do projeto

- [x] 1.1 Instalar a ferramenta de migrations com `dotnet tool install --global dotnet-ef` e verificar que `dotnet ef --version` responde sem erro
- [x] 1.2 Criar a solução `ApiClientes.slnx` com `dotnet new sln -n ApiClientes -f slnx` e verificar que o arquivo gerado tem extensão `.slnx` e conteúdo XML
- [x] 1.3 Criar o projeto de API em `src/ApiClientes` com `dotnet new web` (`net10.0`) e adicioná-lo à solução; verificar com `dotnet build` bem-sucedido
- [x] 1.4 Criar o projeto de testes em `tests/ApiClientes.Tests` com `dotnet new xunit`, referenciar o projeto de API e adicioná-lo à solução; verificar que `dotnet test` executa (ainda sem testes próprios)
- [x] 1.5 Adicionar ao projeto de API os pacotes `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.EntityFrameworkCore.Design` e `Swashbuckle.AspNetCore`; verificar que `dotnet restore` e `dotnet build` passam
- [x] 1.6 Adicionar ao projeto de testes os pacotes `Microsoft.AspNetCore.Mvc.Testing` e `Microsoft.EntityFrameworkCore.Sqlite`; verificar que `dotnet build` da solução inteira passa

## 2. Modelo de dados e dados iniciais

- [x] 2.1 Criar a entidade `Cliente` com `Id` (int), `Nome` (string), `Email` (string) e `DataCadastro` (DateTime); verificar que o projeto compila
- [x] 2.2 Criar o `ClienteDbContext` com `DbSet<Cliente>` e configurar `Nome` como obrigatório no schema; verificar que o projeto compila
- [x] 2.3 Configurar índice único em `Email` via `HasIndex(c => c.Email).IsUnique()` no `OnModelCreating`; verificar que a configuração aparece no schema gerado na tarefa 3.1
- [x] 2.4 Adicionar o seed com `HasData` dos três clientes fixos definidos na spec `gestao-clientes` (Ids 1/2/3, datas literais `2026-01-15T09:00:00Z`, `2026-02-20T14:30:00Z`, `2026-03-05T11:15:00Z`), usando **valores constantes** — nunca `DateTime.UtcNow`; verificar que o projeto compila
- [x] 2.5 Registrar o `ClienteDbContext` com provider SQLite e connection string em `appsettings.json`; verificar que a aplicação inicia sem erro de resolução de serviço
- [x] 2.6 Configurar o value converter de `DataCadastro` no `OnModelCreating` — `HasConversion(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc))`, decisão 6 — para que o valor nunca volte do SQLite com `Kind=Unspecified`; verificar que o projeto compila e que a migration gerada na tarefa 3.1 **não** altera o tipo da coluna

## 3. Schema versionado

- [x] 3.1 Gerar a migration inicial com `dotnet ef migrations add InitialCreate` (com o `HasData` da tarefa 2.4 já presente) e verificar que o arquivo gerado contém tanto `CreateTable` quanto `InsertData` com os três clientes e o `CREATE UNIQUE INDEX` sobre `Email`
- [x] 3.2 Executar `dotnet ef migrations add Verificacao` uma segunda vez e verificar que **nenhuma** migration com alterações é gerada (ausência de `PendingModelChangesWarning` confirma que o seed é determinístico); descartar a migration vazia em seguida
- [x] 3.3 Aplicar as migrations no startup com `Database.Migrate()` e verificar que, apagando o arquivo `.db` e iniciando a aplicação, o banco é recriado já com os três clientes

## 4. Endpoints CRUD

- [x] 4.1 Criar os DTOs de request (nome e email apenas — **sem** `Id` e **sem** `DataCadastro`) e o DTO de response (com os quatro campos); verificar que o projeto compila
- [x] 4.2 Registrar o grupo de rotas `app.MapGroup("/clientes")`; verificar que a aplicação inicia
- [x] 4.3 Implementar `GET /clientes` retornando `200 OK` com a coleção, e coleção vazia em vez de `404`; verificar manualmente que uma base nova retorna os três clientes semeados
- [x] 4.4 Implementar `GET /clientes/{id}` com `TypedResults.Ok` / `TypedResults.NotFound`; verificar que um id inexistente responde `404`
- [x] 4.5 Implementar `POST /clientes` atribuindo `DataCadastro = DateTime.UtcNow`, retornando `201 Created` com cabeçalho `Location`; verificar que o `Location` aponta para o recurso criado e que ele é consultável
- [x] 4.6 Implementar `PUT /clientes/{id}` atualizando nome e email, retornando `200 OK` com o recurso atualizado e preservando `Id` e `DataCadastro`; verificar que a data de cadastro não muda após a atualização
- [x] 4.7 Implementar `DELETE /clientes/{id}` retornando `204 No Content` ou `404 Not Found`; verificar que a segunda remoção do mesmo id responde `404`

## 5. Validação e regras de negócio

- [x] 5.1 **Portão de verificação do mecanismo de validação:** habilitar `builder.Services.AddValidation()`, anotar um único DTO com `[Required]` e verificar que um `POST` com `nome` vazio responde `400` — confirmando que o filtro roda de fato, não apenas que compila. Se **não** responder `400`, adotar o fallback da decisão 2 (validação explícita no handler retornando `TypedResults.ValidationProblem`) antes de prosseguir; em qualquer dos dois caminhos nenhuma spec muda
- [x] 5.2 Anotar os DTOs de request com `[Required]` em `Nome` e `[EmailAddress]` em `Email`; verificar que nome vazio responde `400`, que email sem `@` responde `400` e que `a@b` é aceito
- [x] 5.3 Habilitar `builder.Services.AddProblemDetails()` e verificar que respostas `400` têm `Content-Type` `application/problem+json` com `status` igual a `400`
- [x] 5.4 Implementar a checagem de unicidade de email no `POST`, respondendo `409 Conflict` com corpo `ProblemDetails`; verificar que criar com `ana.souza@exemplo.com` responde `409`
- [x] 5.5 Implementar a checagem de unicidade no `PUT` **excluindo o próprio registro** (`c.Email == email && c.Id != id`); verificar que reenviar o próprio email do cliente responde `200`, não `409`
- [x] 5.6 Garantir a precedência `400` → `404` → `409` nos handlers de `PUT`, checando a existência do cliente antes do conflito de email; verificar que um id inexistente com email duplicado responde `404`
- [x] 5.7 Capturar `DbUpdateException` no `POST` e no `PUT` e traduzir para `409 Conflict`, cobrindo a corrida entre a checagem e a gravação; verificar que a tradução ocorre sem vazar `500`
- [x] 5.8 Verificar que `DataCadastro` sai em ISO-8601 UTC com sufixo `Z` de forma idêntica na criação e na releitura, graças ao value converter da tarefa 2.6; comparar as duas strings emitidas para o mesmo cliente e confirmar que são iguais caractere a caractere

## 6. Documentação e abertura do navegador

- [x] 6.1 Registrar `AddEndpointsApiExplorer()` e `AddSwaggerGen()`, e habilitar `UseSwagger()` + `UseSwaggerUI()`; verificar que `/swagger` responde `200` no navegador
- [x] 6.2 Confirmar que as cinco operações de cliente aparecem no documento OpenAPI com os códigos `201`/`400`/`404`/`409` derivados dos `TypedResults`; verificar inspecionando o documento gerado
- [x] 6.3 Criar `Properties/launchSettings.json` com `"launchBrowser": true` e `"launchUrl": "swagger"` no perfil de execução; verificar que `dotnet run` abre o navegador direto na UI do Swagger com os endpoints listados

## 7. Testes automatizados

- [x] 7.1 Criar a factory de teste (`WebApplicationFactory`) que substitui o `DbContext` por SQLite in-memory, mantém a `SqliteConnection` aberta enquanto a factory viver e cria o banco via `Database.Migrate()`; **instanciar uma factory nova dentro de cada teste** (`using var factory = new ClientesApiFactory();`), sem `IClassFixture` e sem `[Collection]`, conforme a decisão 11; verificar que um teste trivial de `GET /clientes` retorna os três clientes semeados
- [x] 7.2 Escrever os testes dos cenários de **Criação de cliente** e **Consulta por identificador** da spec `gestao-clientes`; verificar que passam
- [x] 7.3 Escrever os testes dos cenários de **Validação dos dados do cliente**, incluindo `a@b` aceito e `ana@`, `@b`, `@`, `ana@exemplo@com` rejeitados; verificar que passam
- [x] 7.4 Escrever os testes dos cenários de **Unicidade de email**, incluindo atualização mantendo o próprio email e reuso de email após remoção; verificar que passam
- [x] 7.5 Escrever os testes dos cenários de **Data de cadastro gerada pelo sistema**, incluindo a comparação caractere a caractere entre criação e releitura; verificar que passam
- [x] 7.6 Escrever os testes dos cenários de **Listagem**, **Atualização** e **Remoção**, incluindo lista vazia após apagar todos os clientes; verificar que passam
- [x] 7.7 Escrever os testes dos cenários de **Precedência entre condições de erro** (`404` antes de `409`, `400` antes de `404`); verificar que passam
- [x] 7.8 Escrever os testes dos cenários de **Clientes pré-cadastrados**, incluindo o `POST` em base nova recebendo `Id` 4; verificar que passam
- [x] 7.9 Escrever os testes de **Formato padronizado de erro** conferindo `Content-Type` e campo `status` em `400`, `404` e `409`; verificar que passam
- [x] 7.10 Escrever os testes da spec `documentacao-api` que verificam `200` em `/swagger` e a presença das cinco operações no documento OpenAPI; verificar que passam
- [x] 7.11 Verificar o isolamento entre os testes destrutivos: reunir na mesma classe o cenário que apaga todos os clientes, o que remove `/clientes/2` e o que exige o seed intacto para receber `Id` 4, e confirmar que os três passam juntos — repetindo `dotnet test` para checar que o resultado não depende da ordem de execução

## 8. Verificação final

- [x] 8.1 Executar `dotnet build` na solução e verificar que compila sem warnings novos
- [x] 8.2 Executar `dotnet test` e verificar que toda a suíte passa, com cada cenário das duas specs coberto
- [x] 8.3 Apagar o arquivo `.db`, executar `dotnet run` e verificar de ponta a ponta: banco recriado com os três clientes, navegador abrindo em `/swagger`, e um CRUD completo executado pela própria interface
- [x] 8.4 Executar `openspec validate add-clientes-crud-api --strict` e verificar que a change passa sem erros
