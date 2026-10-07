## MODIFIED Requirements

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
