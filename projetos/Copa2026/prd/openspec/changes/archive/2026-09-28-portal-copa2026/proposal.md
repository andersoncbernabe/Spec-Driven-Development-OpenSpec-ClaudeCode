## Why

O projeto PortalCopa26 precisa de uma fundação técnica sólida antes que qualquer funcionalidade de interface possa ser implementada. Esta change cria a estrutura base da aplicação — projeto Blazor, banco de dados, entidades e seed — que servirá de alicerce para todas as capacidades futuras do portal.

## What Changes

- Criação da solução `PortalCopa26` com projeto Blazor Web App (.NET 10)
- Configuração de EF Core com SQLite como banco de dados local
- Criação do `AppDbContext` com todas as entidades iniciais do domínio
- Criação das entidades: `Grupo`, `Selecao`, `Jogador`, `Jogo`, `RankingFifa`, `Simulacao`, `SimulacaoJogo`
- Implementação de `SeedData` idempotente para carga dos dados oficiais da Copa 2026
- Configuração de injeção de dependência (serviços de dados, DbContext)
- Estrutura de pastas base: `Pages`, `Components`, `Models`, `Services`, `Data`
- Registro das migrations iniciais do EF Core

## Capabilities

### New Capabilities

- `fundacao/projeto`: Criação e configuração do projeto Blazor Web App com .NET 10
- `fundacao/entidades`: Definição das entidades do domínio da Copa 2026 e DbContext
- `fundacao/seed-data`: Carga inicial idempotente dos dados oficiais do torneio via SeedData
- `fundacao/injecao-dependencia`: Registro dos serviços e DbContext no container de DI

### Modified Capabilities

<!-- Nenhuma capacidade existente modificada — esta é a primeira change do projeto -->

## Impact

- **Novo projeto**: `PortalCopa26/` — aplicação Blazor Web App única
- **Banco de dados**: `copa2026.db` (SQLite, gerado localmente)
- **Dependências NuGet**: `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.EntityFrameworkCore.Tools`
- **Dados de fonte**: arquivos em `./fontes` lidos pelo SeedData na inicialização
- **Nenhuma breaking change** — projeto novo, sem código existente a impactar
