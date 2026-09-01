## Why

O projeto `ApiClientes` está vazio: não existe nenhuma aplicação, solução ou modelo de dados. É necessária uma API REST de clientes que sirva como base funcional do projeto e como exercício de desenvolvimento orientado a especificação, onde cada regra de negócio declarada aqui é verificável por um teste automatizado.

## What Changes

**API REST de clientes (Minimal APIs, .NET 10)**

- CRUD completo sobre a entidade `Cliente` (`Id`, `Nome`, `Email`, `DataCadastro`):
  - `POST /clientes` — criar
  - `GET /clientes` — listar
  - `GET /clientes/{id}` — obter por id
  - `PUT /clientes/{id}` — atualizar
  - `DELETE /clientes/{id}` — remover
- `Nome` obrigatório e `Email` em formato válido, validados de forma declarativa.
- `Email` único entre clientes: a API detecta a duplicidade e responde **409 Conflict**.
- Qualquer operação sobre um `id` inexistente responde **404 Not Found**.
- `DataCadastro` é preenchida automaticamente pelo sistema no momento da criação (UTC) e é imutável — `PUT` nunca a altera.
- Corpo de erro padronizado em `ProblemDetails` para 400, 404 e 409.

**Dados iniciais**

- O banco nasce populado com **3 clientes fixos**, versionados junto ao schema, de modo que a API é utilizável e demonstrável logo no primeiro start, sem cadastro manual.

**Experiência de desenvolvimento**

- Documentação OpenAPI navegável servida pela UI do Swagger.
- Ao iniciar a aplicação em desenvolvimento, o navegador abre automaticamente na UI do Swagger com todos os endpoints listados.

**Estrutura**

- Arquivo de solução no formato **`.slnx`** contendo o projeto da API e um projeto de testes automatizados.
- Schema de banco versionado por migrations (não criado implicitamente em runtime).

## Capabilities

### New Capabilities

- `gestao-clientes`: ciclo de vida do cliente — criação, consulta, atualização e remoção, incluindo as regras de obrigatoriedade de nome, formato e unicidade de email, geração automática da data de cadastro, os códigos de resposta de cada operação e o conjunto de clientes pré-cadastrados disponível em uma base nova.
- `documentacao-api`: descoberta e exploração dos endpoints da API — documento OpenAPI, interface interativa do Swagger e abertura automática do navegador ao iniciar a aplicação em ambiente de desenvolvimento.

### Modified Capabilities

Nenhuma. Não existem specs anteriores neste projeto.

## Impact

**Código criado** (nenhum código existente é afetado — o projeto está vazio):

- `ApiClientes.slnx` — solução no formato XML
- `src/ApiClientes/` — projeto Web (`net10.0`), endpoints, entidade, `DbContext`, DTOs, migrations, `launchSettings.json`
- `tests/ApiClientes.Tests/` — testes de integração dos cenários das specs

**Dependências novas:**

| Pacote / ferramenta | Papel |
| --- | --- |
| `Microsoft.EntityFrameworkCore.Sqlite` | Persistência |
| `Microsoft.EntityFrameworkCore.Design` | Suporte a migrations |
| `Swashbuckle.AspNetCore` | Documento OpenAPI + UI do Swagger |
| `dotnet-ef` (tool) | Geração e aplicação de migrations |
| `xunit` + `Microsoft.AspNetCore.Mvc.Testing` | Testes de integração |

**Nada de infraestrutura externa:** o banco é um arquivo SQLite local. Sem autenticação, autorização, paginação ou versionamento de API neste escopo.
