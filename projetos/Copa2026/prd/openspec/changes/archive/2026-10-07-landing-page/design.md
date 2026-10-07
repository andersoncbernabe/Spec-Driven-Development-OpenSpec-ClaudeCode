## Context

A fundação está completa: `PortalCopaDbContext`, EF Core com SQLite, seed data com 48 seleções / 104 jogos / 98 posições de ranking, seis serviços registrados em DI, e o módulo Chart.js em `wwwroot/js/charts.js` (com `renderChart` / `destroyChart`). A página inicial (`/`) só exibe um placeholder de texto. Ver `proposal.md — Why` para motivação.

Constraints relevantes para esta change:
- O projeto usa `AppDbContext` (scoped, `AddDbContext`) injetado diretamente via primary constructor — padrão de todos os serviços existentes. `LandingPageService` deve seguir o mesmo padrão.
- Dados obrigatoriamente do SQLite via serviço; nenhuma query EF Core em componente Razor
- Bootstrap 5 como único framework CSS
- JSInterop apenas onde necessário (gráfico)
- Blazor Interactive Server render mode já configurado globalmente em `Routes.razor`

## Goals / Non-Goals

**Goals:**
- Cinco componentes Blazor em `Components/Pages/LandingPage/` compostos em `Index.razor`
- Expansão de `ILandingPageService` / `LandingPageService` com dois novos métodos
- DTO `ProximoJogoDto` para evitar expor entidades EF diretamente nos componentes
- Gráfico Chart.js reutilizável via JSInterop no `RankingFifaChart` — mesma API de `charts.js` já existente
- Visual fiel ao protótipo em `../prototipo/index.html`

**Non-Goals:**
- Alterar `wwwroot/js/charts.js` (já expõe a API necessária)
- Implementar lógica de simulação
- Responsividade avançada além do que o Bootstrap 5 oferece por padrão
- Criar novas migrações de banco

## Decisions

### D1 — DTO ProximoJogoDto em vez de entidade Jogo

**Decisão:** Criar `Models/Dtos/ProximoJogoDto.cs` com apenas os campos necessários para o componente: `Id`, `DataHora`, `Cidade`, `MandanteNome`, `MandanteCodigo`, `MandanteBandeiraUrl`, `RotuloMandante`, `VisitanteNome`, `VisitanteCodigo`, `VisitanteBandeiraUrl`, `RotuloVisitante`. O campo `Codigo` foi removido — a entidade `Jogo` não tem esse campo; usa-se `Id` como identificador no DTO.

**Por quê:** Expor a entidade `Jogo` com seus navigation properties exigiria Include encadeado e tornaria o componente Razor dependente do shape do EF. O DTO isola a camada de apresentação da camada de dados e facilita mudanças futuras no modelo sem quebrar os componentes.

**Alternativa descartada:** Passar `Jogo` diretamente com `Include` — acoplamento excessivo.

### D2 — RankingFifaChart como componente genérico parametrizável

**Decisão:** `RankingFifaChart.razor` receberá `[Parameter] IList<RankingItemDto> Dados` e renderizará qualquer lista de pares (rótulo, valor). O componente não chama o serviço diretamente; o componente pai (`Index.razor` ou qualquer outro) fornece os dados via parâmetro.

**Por quê:** Permite reutilização futura para outros gráficos estatísticos sem duplicar lógica de JSInterop. O controle de dados fica no componente pai, mantendo o chart puro de renderização.

**Alternativa descartada:** Injetar `IRankingService` diretamente no componente de gráfico — impede reutilização com dados de outras fontes.

### D3 — JSInterop no RankingFifaChart via `OnAfterRenderAsync`

**Decisão:** Chamar `renderChart(canvasId, config)` em `OnAfterRenderAsync(firstRender: true)` e `destroyChart(canvasId)` em `DisposeAsync()`. O `canvasId` será gerado via `Guid.NewGuid()` para suportar múltiplas instâncias na mesma página.

**Por quê:** `OnAfterRender` garante que o DOM do canvas existe antes de o JS acessá-lo — padrão obrigatório em Blazor Server. `IAsyncDisposable` evita memory leak da instância Chart.js quando o componente é removido.

### D4 — Próximos jogos: todos os jogos ordenados por DataHora, sem filtro de data

**Decisão:** `ObterProximosJogosAsync(int quantidade)` retorna os `quantidade` primeiros jogos ordenados por `DataHora` ASC, sem filtrar por data atual.

**Por quê:** A Copa 2026 termina em julho de 2026; a data atual (setembro de 2026) já está após o torneio. Filtrar por `>= DateTime.Now` retornaria lista vazia. O serviço exibe os jogos do torneio em ordem cronológica — útil para navegação mesmo pós-torneio.

**Alternativa descartada:** Filtrar por data >= hoje — a lista ficaria vazia com o banco de dados atual.

### D5 — Tema escuro do protótipo integrado via `app.css`

**Decisão:** Copiar as variáveis CSS e os estilos base de `../prototipo/css/site.css` para `wwwroot/app.css` (já referenciado em `App.razor`). Manter Bootstrap 5 para layout (grid, cards, badges) e sobrescrever as variáveis de cor do Bootstrap com as custom properties do protótipo (`--bg`, `--surface`, `--card`, `--border`, `--blue`, `--gold`, `--txt`, etc.). Os componentes Blazor usarão as classes do protótipo (`.hero`, `.stat-strip`, `.stat-card`, `.section`, `.card`, etc.) além das classes Bootstrap onde aplicável.

**Por quê:** O usuário explicitamente pediu o tema escuro do protótipo. A abordagem de CSS custom properties é compatível com Bootstrap — as propriedades do protótipo não conflitam com o namespace de variáveis do Bootstrap 5 (`--bs-*`). Adicionar ao `app.css` existente é o caminho mínimo sem criar dependências extras.

**Alternativa descartada:** Bootstrap padrão (fundo claro) — descartado por solicitação do usuário.

### D6 — LandingPageService: concreto sem interface

**Decisão:** Criar `LandingPageService` como classe concreta registrada com `AddScoped<LandingPageService>()`, sem interface `ILandingPageService`. Componentes Razor injetam `LandingPageService` diretamente.

**Por quê:** Os quatro serviços existentes (`JogosService`, `GruposService`, `SelecaoService`, `RankingService`) seguem o mesmo padrão — classes concretas sem interface. Introduzir interface apenas para `LandingPageService` criaria inconsistência arquitetural. Migrar todos para interfaces é uma change separada.

**Alternativa descartada:** Interface `ILandingPageService` — introduziria o único par interface/implementação no projeto, causando inconsistência. Os artefatos spec que mencionavam `ILandingPageService` foram ajustados para `LandingPageService`.

### D7 — Index.razor carrega dados do ranking e repassa ao RankingFifaChart

**Decisão:** `Index.razor` injeta `LandingPageService`, chama `ObterTopRankingAsync(10)` em `OnInitializedAsync` e passa o resultado como parâmetro `[Parameter] Dados` ao componente `RankingFifaChart`. Os demais componentes (`EstatisticasCopa`, `ProximosJogos`) injetam o serviço por conta própria.

**Por quê:** `RankingFifaChart` é um componente genérico de renderização (ver D2) — ele não sabe de onde vêm os dados. Alguém precisa chamar o serviço e passar os dados. `Index.razor` é o orquestrador natural para esse fluxo. Isso não viola o princípio de "sem DbContext em componentes" — apenas `LandingPageService` é injetado.

### D8 — Estrutura de arquivos

```
PortalCopa26/
├── Models/
│   ├── ResumoTorneio.cs           ← novo record
│   └── Dtos/
│       ├── ProximoJogoDto.cs      ← novo
│       └── RankingItemDto.cs      ← novo
├── Services/
│   └── LandingPageService.cs      ← novo (sem interface, padrão do projeto)
├── wwwroot/
│   ├── app.css                    ← adicionar tema escuro do protótipo
│   ├── js/
│   │   └── charts.js              ← novo (renderChart / destroyChart)
│   └── lib/
│       └── chartjs/
│           └── chart.umd.min.js   ← novo (Chart.js 4.x, local)
└── Components/
    ├── App.razor                  ← adicionar <script> para chart.umd.min.js
    ├── Layout/
    │   └── NavMenu.razor          ← atualizar para navegação Copa26
    └── Pages/
        ├── Home.razor             ← remover @page "/" para ceder rota ao LandingPage
        └── LandingPage/
            ├── Index.razor        ← nova página @page "/"
            ├── HeroSection.razor
            ├── EstatisticasCopa.razor
            ├── ProximosJogos.razor
            ├── RankingFifaChart.razor
            └── SimuladorPainel.razor
```

## Risks / Trade-offs

- **[Risco] Falha silenciosa do Chart.js no Blazor Server**: Se o JS não carregar antes do `OnAfterRenderAsync`, o canvas existe mas `window.Chart` não. Mitigação: `chart.umd.min.js` já está carregado via `App.razor` antes de `blazor.web.js`.
- **[Trade-off] CSS do protótipo + Bootstrap**: Algumas classes do protótipo (`.btn`, `.card`) conflitam com nomes Bootstrap. Mitigação: prefixar as classes do protótipo que conflitam ou sobrescrever apenas as custom properties — não remover as classes Bootstrap já usadas.
- **[Risco] `RankingFifaChart` com `firstRender` e Streaming Rendering**: Se o componente for pré-renderizado no servidor, o JSInterop falhará na fase de pré-render. Mitigação: `[Parameter] public RenderMode RenderModeOverride` não é necessário — o projeto já usa `InteractiveServer` globalmente via `AddInteractiveServerRenderMode()`.
