## Purpose

Define como os serviços de dados e o DbContext são registrados e disponibilizados via injeção de dependência nativa do ASP.NET Core, garantindo que componentes Razor nunca acessem o DbContext diretamente.

## Requirements

### Requirement: AppDbContext registrado no container de DI
O `AppDbContext` SHALL ser registrado como serviço scoped no container de DI do ASP.NET Core, configurado para usar SQLite com o arquivo de banco de dados local.

#### Scenario: AppDbContext disponível via injeção de dependência
- **WHEN** um serviço solicita `AppDbContext` via injeção de dependência
- **THEN** uma instância scoped é fornecida corretamente configurada para SQLite

### Requirement: Serviços de dados registrados no container de DI
Os serviços de acesso a dados SHALL ser registrados no container de DI, incluindo: `JogosService`, `GruposService`, `SelecoesService`, `RankingService`, `LandingPageService` e `SimuladorService`. Nenhum componente Razor ou página deve acessar o DbContext diretamente. `LandingPageService` SHALL expor ao menos `ObterResumoAsync()`, `ObterProximosJogosAsync(int quantidade)` e `ObterTopRankingAsync(int quantidade)`.

#### Scenario: Serviço de dados injetável em componente Razor
- **WHEN** um componente Razor declara injeção de um serviço de dados via `@inject`
- **THEN** o serviço é resolvido corretamente pelo container de DI

#### Scenario: DbContext não injetado diretamente em página Razor
- **WHEN** qualquer página ou componente Razor é analisado
- **THEN** nenhuma injeção direta de `AppDbContext` é encontrada; o acesso ocorre apenas via serviços

#### Scenario: LandingPageService resolve próximos jogos
- **WHEN** `ObterProximosJogosAsync(5)` é chamado
- **THEN** retorna até 5 jogos futuros ordenados por DataHora ascendente, com Selecao e Grupo incluídos

#### Scenario: LandingPageService resolve top ranking
- **WHEN** `ObterTopRankingAsync(10)` é chamado
- **THEN** retorna as 10 primeiras posições do ranking ordenadas por Posicao ascendente

### Requirement: Arquivo de banco de dados configurável via configuração da aplicação
O caminho do arquivo SQLite SHALL ser configurável via `appsettings.json`, com valor padrão que persiste o banco na pasta da aplicação.

#### Scenario: Banco de dados criado no caminho configurado
- **WHEN** a aplicação inicializa pela primeira vez
- **THEN** o arquivo SQLite é criado no caminho definido em `appsettings.json`
