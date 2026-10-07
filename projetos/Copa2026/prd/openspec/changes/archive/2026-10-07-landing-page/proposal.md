## Why

A fundação do PortalCopa26 está concluída: banco SQLite, EF Core, entidades e seed data funcionam. O portal não exibe ainda nenhuma informação ao usuário; a página inicial mostra apenas um placeholder de texto. Esta change implementa a Landing Page completa com os dados reais do torneio, servindo como vitrine principal do portal.

## What Changes

- Implementar a página inicial (`/`) com cinco componentes Blazor reutilizáveis compostos em `Components/Pages/LandingPage/Index.razor`
- Criar `HeroSection.razor`: banner principal com países-sede (EUA, Canadá, México) e chamada para o Simulador
- Criar `EstatisticasCopa.razor`: faixa de quatro contadores (Seleções, Grupos, Jogos, Estádios) lidos do banco
- Criar `ProximosJogos.razor`: lista dos próximos N jogos da fase de grupos com bandeiras e horários
- Criar `RankingFifaChart.razor`: gráfico horizontal de barras Chart.js (TOP 10) via JSInterop, reutilizável
- Criar `SimuladorPainel.razor`: card de chamada para o Simulador com link para `/simulador`
- Expandir `ILandingPageService` / `LandingPageService` com métodos de dados para os novos componentes
- Adicionar DTO `ProximoJogoDto` para transferência dos dados de próximos jogos
- Manter o módulo JS `wwwroot/js/charts.js` já existente; apenas consumir sua API nos componentes

## Capabilities

### New Capabilities

- `landing-page`: Página inicial completa com Hero, Estatísticas, Próximos Jogos, Ranking FIFA via Chart.js e painel do Simulador

### Modified Capabilities

- `fundacao/injecao-dependencia`: `LandingPageService` recebe novos métodos — `ObterProximosJogosAsync(int quantidade)` e `ObterTopRankingAsync(int quantidade)`

## Impact

- `Services/LandingPageService.cs` — novos métodos de consulta
- `Services/ILandingPageService.cs` — interface expandida
- `Components/Pages/LandingPage/` — cinco arquivos `.razor` novos
- `Models/Dtos/ProximoJogoDto.cs` — DTO de transferência (sem impacto em migração)
- Nenhuma migração de banco necessária
- `wwwroot/js/charts.js` — sem alterações; já expõe `renderChart` / `destroyChart`
