## 1. Tema Escuro — app.css

- [x] 1.1 Ler `../prototipo/css/site.css` e copiar para `wwwroot/app.css` as seções: tokens CSS (`:root` com `--bg`, `--surface`, `--card`, `--border`, `--blue`, `--gold`, `--green`, `--red`, `--txt`, `--txt-soft`, `--txt-muted`, `--r`, `--r-lg`), reset base (`body`, `a`, `img`, `button`), nav (`.nav`, `.nav-brand`, `.nav-links`, `.nav-badge`, `.nav-toggle`, `.nav-mobile`), hero (`.hero`, `.hero-inner`, `.hero-text`, `.hero-title`, `.hero-eyebrow`, `.hero-actions`, `.hero-logo`, `.hero-flags`, `.host-card`), layout (`.page`, `.section`, `.section-header`, `.section-title`), stat-strip (`.stat-strip`, `.stat-card`, `.stat-icon`), cards (`.card`, `.card-body`), botões (`.btn`, `.btn-gold`, `.btn-outline`, `.btn-lg`, `.btn-sm`), footer (`.footer`, `.footer-inner`, `.footer-brand`, `.footer-txt`, `.footer-links`), utilitários (`.accent`, `.accent-gold`); verificar que o fundo da página muda para `#151f2e`
- [x] 1.2 Identificar e resolver conflitos com classes Bootstrap que tenham o mesmo nome (`.btn`, `.card`): garantir que as versões do protótipo sejam aplicadas após o Bootstrap no `app.css`; verificar que botões e cards ficam com o visual escuro do protótipo

## 2. Chart.js — arquivos locais e módulo JS

- [x] 2.1 Baixar `chart.umd.min.js` (Chart.js 4.x) de jsDelivr e salvar em `wwwroot/lib/chartjs/chart.umd.min.js`; verificar que o arquivo tem mais de 100 KB (não está corrompido)
- [x] 2.2 Criar `wwwroot/js/charts.js` como módulo ES com duas funções exportadas: `renderChart(canvasId, config)` — cria instância Chart.js usando `window.Chart`, armazena em Map pelo canvasId; e `destroyChart(canvasId)` — destrói a instância se existir e remove do Map; verificar que o arquivo é válido como módulo ES
- [x] 2.3 Adicionar em `Components/App.razor`, antes de `blazor.web.js`, a tag `<script src="@Assets["lib/chartjs/chart.umd.min.js"]"></script>`; verificar que `window.Chart` está disponível no console do navegador após o carregamento

## 3. Navegação e rota raiz

- [x] 3.1 Atualizar `Components/Layout/NavMenu.razor` para os seis destinos Copa26: Início (`/`), Jogos (`/jogos`), Grupos (`/grupos`), Seleções (`/selecoes`), Ranking (`/ranking`), Simulador (`/simulador`); remover os links padrão do template (Counter, Weather); verificar visualmente que o menu aparece com o tema escuro
- [x] 3.2 Remover a diretiva `@page "/"` de `Components/Pages/Home.razor` (ou excluir o arquivo se não for mais necessário) para ceder a rota ao novo `LandingPage/Index.razor`; verificar que a compilação não reporta conflito de rota

## 4. Model ResumoTorneio

- [x] 4.1 Criar `Models/ResumoTorneio.cs` como record com quatro propriedades int: `Selecoes`, `Grupos`, `Jogos`, `Estadios`; verificar que o arquivo compila sem erros

## 5. DTOs

- [x] 5.1 Criar `Models/Dtos/ProximoJogoDto.cs` com as propriedades: `Id` (int), `DataHora` (DateTime), `Cidade` (string), `MandanteNome` (string?), `MandanteCodigo` (string?), `MandanteBandeiraUrl` (string?), `RotuloMandante` (string?), `VisitanteNome` (string?), `VisitanteCodigo` (string?), `VisitanteBandeiraUrl` (string?), `RotuloVisitante` (string?); verificar que o arquivo compila sem erros
- [x] 5.2 Criar `Models/Dtos/RankingItemDto.cs` com as propriedades: `Posicao` (int), `NomeSelecao` (string), `CodigoFifa` (string), `Pontuacao` (decimal); verificar que o arquivo compila sem erros (`Pontuacao` — campo correto na entidade `RankingFifa`)

## 6. LandingPageService

- [x] 6.1 Criar `Services/LandingPageService.cs` com primary constructor `(AppDbContext db)` e três métodos async: `ObterResumoAsync()` → `ResumoTorneio` (conta Selecoes, Grupos, Jogos no banco e retorna Estadios = 16 fixo), `ObterProximosJogosAsync(int quantidade)` → `List<ProximoJogoDto>` (inclui SelecaoMandante e SelecaoVisitante, ordena por DataHora ASC, mapeia para DTO construindo BandeiraUrl como `$"https://api.fifa.com/api/v3/picture/flags-sq-4/{selecao.CodigoFifa}"`), `ObterTopRankingAsync(int quantidade)` → `List<RankingItemDto>` (ordena por Posicao ASC, Take(quantidade)); verificar que o arquivo compila
- [x] 6.2 Registrar em `Program.cs` com `builder.Services.AddScoped<LandingPageService>()`; verificar que a aplicação inicia sem exceção de DI

## 7. Componente HeroSection

- [x] 7.1 Criar `Components/Pages/LandingPage/HeroSection.razor`: seção `.hero` com `.hero-inner`, título "Copa do Mundo FIFA 2026", três `.host-card` (EUA/USA, Canadá/CAN, México/MEX) com `<img>` usando URL pública da FIFA, e link `.btn.btn-gold` para `/simulador`; verificar que renderiza com tema escuro e três bandeiras são exibidas

## 8. Componente EstatisticasCopa

- [x] 8.1 Criar `Components/Pages/LandingPage/EstatisticasCopa.razor` com `@inject LandingPageService LandingPageService`: chama `ObterResumoAsync()` em `OnInitializedAsync`, exibe `.stat-strip` com quatro `.stat-card` (Seleções/48, Grupos/12, Jogos/104, Estádios/16); verificar que os quatro valores aparecem com o visual do tema

## 9. Componente ProximosJogos

- [x] 9.1 Criar `Components/Pages/LandingPage/ProximosJogos.razor` com `[Parameter] int Quantidade = 6` e `@inject LandingPageService LandingPageService`: chama `ObterProximosJogosAsync(Quantidade)` em `OnInitializedAsync`, renderiza um `.card` por jogo exibindo DataHora, bandeira ou rótulo do mandante, bandeira ou rótulo do visitante, e cidade; verificar que seis jogos aparecem com fundo escuro e bandeiras visíveis

## 10. Componente RankingFifaChart

- [x] 10.1 Criar `Components/Pages/LandingPage/RankingFifaChart.razor` como componente genérico com `[Parameter] public IList<RankingItemDto> Dados { get; set; } = new List<RankingItemDto>()`; implementar `IAsyncDisposable`; gerar `_canvasId = "chart-" + Guid.NewGuid().ToString("N")` em `OnInitialized`; em `OnAfterRenderAsync(firstRender: true)` importar `charts.js` via `IJSRuntime.InvokeAsync<IJSObjectReference>("import", "./js/charts.js")` e chamar `renderChart(_canvasId, config)` com configuração de barras horizontais usando cores `#f5a623` (ouro) para barras e `#f0f6ff` para labels; em `DisposeAsync()` chamar `destroyChart(_canvasId)` e descartar a referência JS; verificar que o canvas aparece com 10 barras horizontais sobre fundo escuro

## 11. Componente SimuladorPainel

- [x] 11.1 Criar `Components/Pages/LandingPage/SimuladorPainel.razor`: `.card` com `style="background:linear-gradient(135deg,#0d1f3c,#0a1628)"`, ícone 🎮, texto de convite, `.btn.btn-gold` para `/simulador` e `.btn.btn-outline` para `/grupos`; verificar que ambos os links são renderizados com o visual escuro

## 12. Composição em Index.razor

- [x] 12.1 Criar `Components/Pages/LandingPage/Index.razor` com `@page "/"` e `@inject LandingPageService LandingPageService`; em `OnInitializedAsync` chamar `ObterTopRankingAsync(10)` para preencher `_rankingDados`; compor os cinco componentes: `<HeroSection/>`, `<EstatisticasCopa/>`, `<ProximosJogos Quantidade="6"/>`, `<RankingFifaChart Dados="_rankingDados"/>`, `<SimuladorPainel/>`; verificar que a página renderiza todos os componentes sem erros no navegador
- [x] 12.2 Confirmar que `Index.razor` não contém `@inject AppDbContext` nem acesso direto a `db.*`

## 13. Validação Final

- [x] 13.1 Executar `dotnet build` e confirmar zero erros de compilação
- [x] 13.2 Iniciar com `dotnet run` e navegar para `/`; confirmar que Hero Section (com bandeiras EUA/CAN/MEX), EstatisticasCopa (48/12/104/16), ProximosJogos (6 jogos), gráfico Chart.js (10 barras), SimuladorPainel (links `/simulador` e `/grupos`) estão visíveis com fundo `#151f2e`
- [x] 13.3 Verificar no console do navegador que não há erros de JSInterop; navegar para outra página e voltar — confirmar que o gráfico é re-renderizado corretamente sem erro de "Canvas is already in use"
