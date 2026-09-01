## Context

Projeto vazio, sem código legado — todas as escolhas são de partida, nenhuma é migração. Ver `proposal.md` — Why para a motivação.

Restrições verificadas no ambiente antes de decidir:

| Verificação | Resultado |
| --- | --- |
| SDK instalado | `10.0.400` (único) |
| `dotnet new sln -f slnx` | Suportado; `.slnx` **já é o formato padrão** deste SDK |
| `builder.Services.AddValidation()` | Compila **sem PackageReference adicional**; comportamento em runtime confirmado na tarefa 5.1 antes de qualquer regra ser escrita sobre ele |
| `builder.Services.AddOpenApi()` | **Não** resolve sem `Microsoft.AspNetCore.OpenApi` |
| `Swashbuckle.AspNetCore` | `10.2.3` disponível no nuget.org |
| `dotnet-ef` | **Não instalado** — precisa ser instalado como tool |

## Goals / Non-Goals

**Goals:**

- Cada cenário de spec mapeia para um teste de integração executável.
- Regras de negócio expressas de forma declarativa sempre que o framework permitir.
- Base de dados utilizável no primeiro start, sem passo manual.
- Schema versionado e reproduzível.

**Non-Goals:**

- Arquitetura em camadas (Repository, Service, UnitOfWork). O escopo é um CRUD de uma entidade; camadas aqui adicionam indireção sem reduzir complexidade.
- Concorrência distribuída. Ver Risks.
- Validação de existência real de domínio de email (MX lookup).

## Decisions

### 1. Projeto único, endpoints agrupados por `MapGroup`

Um projeto Web (`Microsoft.NET.Sdk.Web`) com os endpoints registrados sob `app.MapGroup("/clientes")`.

*Alternativa considerada:* separar `Domain` / `Infrastructure` / `Api`. Rejeitada: uma entidade e cinco endpoints não justificam três assemblies, e a navegação fica pior, não melhor.

### 2. Validação declarativa via `AddValidation()` + DataAnnotations

`[Required]` em `Nome`, `[EmailAddress]` em `Email`, nos DTOs de request. O filtro de validação do .NET 10 responde `400` com `ProblemDetails` automaticamente, antes do handler executar.

*Alternativa considerada:* FluentValidation. Rejeitada: dependência externa para duas regras que o framework já cobre nativamente, sem pacote extra.

**Esta decisão é a base de sete cenários de `400`, então é verificada antes de ser construída sobre.** A tabela de Context registra que `AddValidation()` compila neste SDK — mas compilar não é o mesmo que o filtro efetivamente rodar e produzir `ProblemDetails` para os DTOs deste projeto. A primeira tarefa da fase de validação é um teste de fumaça isolado: um `POST` com `nome` vazio precisa responder `400` **antes** de qualquer outra regra existir.

*Se o teste de fumaça falhar,* o fallback é validação explícita nos handlers retornando `TypedResults.ValidationProblem`. Mesmo contrato observável, mais código, **nenhuma spec alterada** — as specs descrevem o `400` e o corpo `ProblemDetails`, nunca o mecanismo.

**Resultado do portão:** passou. `AddValidation()` compila e funciona em runtime sem `PackageReference` adicional — `nome` ausente, vazio e só com espaços responderam `400` nos três casos. O fallback não foi necessário. Efeito colateral útil: `RequiredAttribute` rejeita whitespace, então o cenário *"nome vazio ou apenas espaços"* sai coberto sem código extra.

### 3. `[EmailAddress]` como definição de "email válido"

O requisito original dizia "contém @". O comportamento real de `[EmailAddress]`, medido neste ambiente:

```
aceita:   ana@teste.com   a@b   a@b.c   ana+tag@teste.com   ana@localhost
rejeita:  abc   ""   " "   a@   @b   @   a@b@c   a@@b
```

`[EmailAddress]` é **estritamente mais rigoroso** que "contém @": nunca aceita algo que a regra original rejeitaria. A regra observável equivalente é *"exatamente um `@`, com ao menos um caractere antes e depois"*, e é assim que a spec a descreve — sem citar o atributo.

**Limitação conhecida e aceita:** `[EmailAddress]` aceita `ana teste@x.com` (com espaço) e `a@b` (sem domínio de topo). Endurecer isso é requisito novo, não bug.

### 4. Unicidade de email: validada pela API, com índice único como defesa em profundidade

O handler consulta antes de gravar e responde `409 Conflict`. Independentemente disso, o schema tem `HasIndex(c => c.Email).IsUnique()`.

Os dois mecanismos têm papéis distintos: o `409` é o **contrato** (previsível, com mensagem útil); o índice é a **garantia** de que nem um bug futuro grava duplicata.

*Alternativa considerada:* só capturar `DbUpdateException`. Rejeitada como mecanismo primário — exigiria inspecionar código de erro do SQLite para distinguir *qual* constraint falhou, acoplando o handler ao provider.

**No `PUT`, a checagem exclui o próprio registro** (`c.Email == email && c.Id != id`). Sem esse filtro, reenviar o mesmo email do próprio cliente retornaria `409` indevidamente.

### 5. Precedência de respostas de erro

Ordem fixa de avaliação, especialmente no `PUT`:

```
400 (validação, via filtro)  →  404 (id existe?)  →  409 (email de outro?)  →  2xx
```

`PUT` para um `id` inexistente **com** email duplicado responde `404`, não `409`. Sem essa ordem escrita, duas implementações corretas discordam.

### 6. `DataCadastro` gerada pelo servidor, em UTC, imutável

Atribuída com `DateTime.UtcNow` no handler de criação. Não existe no DTO de criação nem no de atualização — é fisicamente impossível o cliente enviá-la.

**Armadilha do SQLite:** o provider persiste `DateTime` como TEXT e o valor retorna com `DateTimeKind.Unspecified`, o que faz o sufixo `Z` sumir da serialização. O mesmo cliente serializaria diferente logo após o `POST` (instância ainda em memória, `Kind=Utc`) e depois de um `GET` (materializada do banco, `Kind=Unspecified`) — e a spec exige que as duas strings sejam idênticas caractere a caractere.

**Correção na fronteira do banco, via value converter no `DbContext`:**

```csharp
.Property(c => c.DataCadastro)
.HasConversion(
    v => v,                                            // grava como está (já é UTC)
    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));   // materializa marcado como UTC
```

Com isso `DataCadastro` **nunca** existe em memória com `Kind` diferente de `Utc`, e a serialização ISO-8601 com sufixo `Z` sai correta sem que nenhum handler, DTO ou teste precise saber do problema.

*Alternativa considerada:* normalizar na serialização — conversor customizado em `JsonSerializerOptions`, ou expor `DateTimeOffset` no DTO de response. Rejeitada: trata o sintoma na saída e deixa o valor errado circulando no domínio, de modo que qualquer comparação ou cálculo interno com `DataCadastro` continuaria operando sobre um `Kind=Unspecified`. O converter resolve uma única vez, no ponto exato onde a informação se perde.

### 7. Schema por migrations, não `EnsureCreated()`

`dotnet ef migrations add` + `Database.Migrate()` no startup. Requer `dotnet tool install --global dotnet-ef`.

*Alternativa considerada:* `EnsureCreated()`. Rejeitada: não versiona schema e não tem caminho de evolução. Como o seed é entregue **através** da migration (decisão 8), migrations também é o que torna os dados iniciais reproduzíveis.

### 8. Seed de 3 clientes via `HasData`

`modelBuilder.Entity<Cliente>().HasData(...)` no `OnModelCreating`, materializado como `InsertData` dentro da migration inicial.

*Alternativa considerada:* popular em código no startup (`if (!db.Clientes.Any()) db.AddRange(...)`). Rejeitada: roda a cada boot, exige guarda de idempotência e não fica versionado junto ao schema.

**`HasData` impõe duas restrições não negociáveis:**

1. **Chaves primárias explícitas.** Os três clientes têm `Id` 1, 2 e 3 fixos. Consequência: o primeiro cliente criado via `POST` numa base nova recebe `Id` 4.
2. **Valores determinísticos.** Qualquer valor que mude entre execuções — `DateTime.UtcNow`, `Guid.NewGuid()` — faz o EF detectar o modelo como alterado a cada `migrations add` e disparar `PendingModelChangesWarning`.

Isso cria uma **tensão aparente com a decisão 6**: `DataCadastro` é gerada pelo sistema, mas nos registros semeados ela é uma **data literal fixa**, escrita no código do modelo. Não é contradição — a regra "o sistema preenche, o cliente não envia" vale para o fluxo de criação via API; os registros de seed nascem com o schema, não passam pelo endpoint.

### 9. Swagger UI via Swashbuckle

`Swashbuckle.AspNetCore` 10.2.3, com `UseSwagger()` + `UseSwaggerUI()`, servindo a UI em `/swagger`.

Swashbuckle gera o próprio documento OpenAPI, então `Microsoft.AspNetCore.OpenApi` **não** é necessário — evita dois geradores de documento no mesmo app.

*Alternativa considerada:* `AddOpenApi()` nativo + Scalar. Igualmente válida e é o caminho que a Microsoft favorece no .NET 10; preterida por escolha explícita pela UI do Swagger.

Os handlers usam `TypedResults`, que implementa `IEndpointMetadataProvider`. Isso cobre **parte** dos códigos automaticamente, não todos:

| Código | Entra no documento sozinho? | Por quê |
| --- | --- | --- |
| `200` / `201` / `204` | Sim | `Ok<T>`, `Created<T>` e `NoContent` carregam o status no próprio tipo |
| `404` | Sim | `NotFound` carrega o status no próprio tipo |
| `409` | **Não** | `ProblemHttpResult` tem status dinâmico; o metadata que ele publica declara `500` |
| `400` | **Não** | nasce no filtro de validação, que não é um `TypedResults` retornado pelo handler |

*Medido neste ambiente:* sem anotação, `POST /clientes` saía no documento declarando apenas `['201']` — violando o cenário *"Códigos de resposta descritos"* da spec `documentacao-api`, que exige `201`, `400` e `409`.

Portanto `POST` e `PUT` levam anotação explícita:

```csharp
.ProducesValidationProblem()                       // 400
.ProducesProblem(StatusCodes.Status409Conflict);   // 409
```

*Alternativa considerada:* trocar `ProblemHttpResult` por `Conflict<ProblemDetails>` no union de retorno, que traria o `409` no metadata sem anotação. Rejeitada: `Conflict<T>` serializa com `Content-Type: application/json`, quebrando o requisito de `application/problem+json` (ver decisão 12). A anotação explícita atende aos dois requisitos ao mesmo tempo.

### 10. Abertura do navegador via `launchSettings.json`

`"launchBrowser": true` e `"launchUrl": "swagger"` no perfil de execução.

*Alternativa considerada:* `Process.Start` no `Program.cs`. Rejeitada: coloca comportamento de ferramenta dentro da aplicação, precisa de guarda de ambiente para não tentar abrir navegador num servidor, depende do SO e exige a porta hardcoded.

**Limitação assumida:** só atua em `dotnet run` / F5. Um `dotnet ApiClientes.dll` publicado não abre navegador — o que é o comportamento desejado.

### 11. Testes de integração sobre migrations, com o seed presente

`WebApplicationFactory` com o `DbContext` reapontado para SQLite in-memory (`DataSource=:memory:`), mantendo a `SqliteConnection` **aberta** enquanto a factory viver — ao fechar, o banco deixa de existir.

O banco de teste é criado com `Database.Migrate()`, o que exercita a migration real **e** traz os 3 clientes semeados.

**Isolamento: uma factory por teste, não por classe.** Vários cenários das specs são destrutivos e disputam o mesmo estado:

```
Req. 5   "Listagem sem nenhum cliente"        -> apaga TODOS os clientes
Req. 10  "Cliente inicial pode ser removido"  -> DELETE /clientes/2
Req. 10  "POST em base nova recebe Id 4"      -> exige as 3 linhas do seed intactas
```

Com uma factory compartilhada via `IClassFixture`, a ordem de execução do xUnit decide quem passa — e o resultado muda quando um teste novo entra na classe. Portanto:

- a factory é **instanciada e descartada dentro de cada teste** (`using var factory = new ClientesApiFactory();`), nunca injetada por `IClassFixture`;
- cada instância abre a sua própria `SqliteConnection` in-memory e roda `Database.Migrate()` — uma migration por teste, custo aceitável para uma migration e uma tabela;
- nenhum teste depende de limpeza feita por outro, e nenhum precisa de `[Collection]` para serializar execução.

*Alternativa considerada:* factory compartilhada com reset de estado entre testes (`IAsyncLifetime` truncando e re-semeando). Rejeitada: reimplementa à mão o que a migration já faz, e reintroduz a chance de o reset divergir do seed real — exatamente o bug que os testes de seed deveriam pegar.

**Linha de base que todo teste assume** — com o seed sempre presente, `GET /clientes` nunca retorna lista vazia num banco recém-criado:

- listagem parte de 3 registros;
- o cenário de "lista vazia" é exercitado apagando os clientes primeiro, não assumindo base virgem;
- `404` usa um `id` comprovadamente livre (ex.: `999`);
- `409` pode reutilizar um email do seed, que é um dado conhecido e estável.

### 12. Corpo `ProblemDetails` em todo erro, inclusive nos `404` que nascem sem corpo

A spec exige `ProblemDetails` com `Content-Type: application/problem+json` e campo `status` em **400, 404 e 409**. São três origens distintas, e apenas duas se resolvem sozinhas:

| Código | Origem | Corpo sai correto por conta própria? |
| --- | --- | --- |
| `400` | filtro de validação | Só com `AddProblemDetails()` — sem ele vinha `application/json` e **sem** campo `status` |
| `409` | `TypedResults.Problem(...)` | Sim |
| `404` | `TypedResults.NotFound()` | **Não** — a resposta sai completamente vazia |

`AddProblemDetails()` registra o `IProblemDetailsService`, mas ele não é acionado por um resultado que simplesmente não escreve corpo nenhum. `app.UseStatusCodePages()` fecha a lacuna: intercepta respostas de erro sem corpo e as preenche pelo mesmo serviço.

*Alternativa considerada:* trocar `TypedResults.NotFound()` por `TypedResults.Problem(statusCode: 404)` em cada handler. Rejeitada por dois motivos: espalha formatação de erro por três handlers, e faz o `404` desaparecer do documento OpenAPI — é justamente o tipo `NotFound` que o coloca lá (decisão 9).

**Verificado:** os `404` de `GET`, `PUT` e `DELETE` passam a trazer `status: 404` e `application/problem+json`, e o `204` do `DELETE` bem-sucedido continua sem corpo — `UseStatusCodePages` só age sobre `4xx`/`5xx`.

## Risks / Trade-offs

- **Race condition na checagem de unicidade** → Duas requisições simultâneas com o mesmo email podem ambas passar pelo `AnyAsync` antes de qualquer gravação. O índice único faz a segunda falhar com `DbUpdateException`, que sem tratamento vira `500` em vez de `409`. *Mitigação:* o handler de criação/atualização também captura `DbUpdateException` e a traduz para `409`, mantendo o contrato mesmo na corrida. A janela é estreita e não há requisito de carga concorrente neste escopo.

- **Ids do seed colidindo com dados existentes** → Se alguém inserir manualmente um cliente com `Id` 1–3 antes da migration, a migration falha. *Mitigação:* base é criada pela migration; não há cenário de banco pré-existente neste escopo.

- **Alterar o seed depois** → Mudar um valor semeado exige nova migration; mudar um `Id` semeado faz o EF **deletar** a linha antiga e inserir outra. *Mitigação:* tratar os três `Id` como imutáveis.

- **`DateTimeKind` perdido no round-trip do SQLite** → O mesmo cliente serializaria diferente logo após o `POST` (vindo da memória, `Kind=Utc`) e depois do `GET` (vindo do banco, `Kind=Unspecified`). *Mitigação:* o value converter da decisão 6 — escolha já fechada, não um leque aberto para a implementação. Coberto por um teste que cria e depois relê o mesmo cliente comparando as duas strings emitidas.

- **Interferência entre testes destrutivos** → Três cenários apagam clientes e um exige o seed intacto; compartilhando banco, a suíte passa ou falha conforme a ordem de execução. *Mitigação:* factory por teste (decisão 11). O custo é uma migration por teste; o benefício é que nenhum teste novo pode quebrar um antigo por efeito colateral.

- **`launchBrowser` inerte fora de `dotnet run`** → Trade-off aceito conscientemente (decisão 10).

- **`dotnet-ef` como pré-requisito de máquina** → Não está instalado. Sem ele, não há como gerar as migrations. *Mitigação:* é a primeira tarefa do plano de implementação.

## Migration Plan

Projeto novo, sem dados em produção e sem consumidores. A "migração" é a criação inicial:

1. `dotnet tool install --global dotnet-ef`
2. Modelo e `DbContext` com o `HasData` **já presente** antes de gerar a primeira migration — assim os 3 clientes entram como `InsertData` na migration inicial, sem precisar de uma segunda.
3. `dotnet ef migrations add InitialCreate`
4. `Database.Migrate()` no startup aplica schema + seed no primeiro run.

*Rollback:* apagar o arquivo `.db` e reexecutar. Não há estado a preservar.
