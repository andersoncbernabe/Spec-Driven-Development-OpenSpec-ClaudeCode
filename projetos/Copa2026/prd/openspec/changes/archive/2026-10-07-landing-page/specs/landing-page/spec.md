## Purpose

Define o comportamento observável da Landing Page do PortalCopa26: seções de conteúdo, dados exibidos, integração com Chart.js via JSInterop e navegação para o Simulador.

## ADDED Requirements

### Requirement: Hero Section exibe países-sede e chamada para o Simulador
A Landing Page SHALL exibir uma seção hero com o título do torneio, os três países-sede (EUA, Canadá, México) com suas bandeiras obtidas via API pública da FIFA, e ao menos um link de navegação para a página do Simulador.

#### Scenario: Bandeiras dos países-sede carregadas
- **WHEN** a Landing Page é carregada
- **THEN** as bandeiras de EUA, Canadá e México são exibidas usando a URL pública `https://api.fifa.com/api/v3/picture/flags-sq-4/{codigo}`

#### Scenario: Link para o Simulador presente no hero
- **WHEN** o usuário visualiza a Hero Section
- **THEN** existe ao menos um elemento clicável que navega para `/simulador`

### Requirement: EstatisticasCopa exibe contadores do torneio lidos do banco
A página SHALL exibir quatro contadores numéricos com os totais oficiais do torneio: número de seleções, grupos, jogos e estádios. Os valores DEVEM ser lidos do banco de dados SQLite, não hardcoded.

#### Scenario: Contadores refletem os dados oficiais do seed
- **WHEN** a Landing Page é carregada após o seed executar com sucesso
- **THEN** os contadores exibem 48 seleções, 12 grupos, 104 jogos e 16 estádios

#### Scenario: Componente não acessa DbContext diretamente
- **WHEN** EstatisticasCopa.razor é analisado
- **THEN** o acesso ao banco ocorre exclusivamente via `LandingPageService`, sem `@inject AppDbContext`

### Requirement: ProximosJogos exibe lista de jogos ordenados por data/hora com bandeiras
A página SHALL exibir os primeiros N jogos do torneio ordenados por data/hora ascendente, sem filtro de fase. Para cada jogo SHALL ser exibido: data/hora (horário de Brasília), mandante com bandeira ou rótulo, visitante com bandeira ou rótulo, cidade.

#### Scenario: Próximos jogos ordenados por data/hora
- **WHEN** a Landing Page é carregada
- **THEN** os jogos aparecem em ordem crescente de `DataHora`

#### Scenario: Bandeiras dos times exibidas
- **WHEN** um jogo com seleções definidas é exibido
- **THEN** as bandeiras de mandante e visitante são carregadas via URL pública da FIFA usando `CodigoFifa`

#### Scenario: Jogos sem seleção definida exibem rótulo
- **WHEN** um jogo de fase eliminatória sem seleção definida é incluído na lista
- **THEN** o sistema exibe o `RotuloMandante` / `RotuloVisitante` no lugar da seleção

### Requirement: RankingFifaChart exibe gráfico TOP 10 via Chart.js e JSInterop
A página SHALL exibir um gráfico de barras horizontais com as 10 primeiras posições do ranking FIFA carregadas do banco. O gráfico SHALL ser renderizado por Chart.js através de JSInterop usando o módulo `wwwroot/js/charts.js` existente. O componente SHALL destruir a instância do gráfico ao ser descartado (IAsyncDisposable).

#### Scenario: Gráfico renderizado ao carregar a página
- **WHEN** a Landing Page termina de carregar
- **THEN** o canvas com o gráfico de ranking é exibido com 10 barras, uma por seleção

#### Scenario: Gráfico destruído ao descartar o componente
- **WHEN** o componente RankingFifaChart é removido do DOM
- **THEN** `destroyChart` é chamado via JSInterop para liberar a instância Chart.js

#### Scenario: Dados do gráfico lidos do banco
- **WHEN** a Landing Page carrega o ranking
- **THEN** os dados de posição, nome da seleção e pontos vêm do banco SQLite via `ILandingPageService`

### Requirement: SimuladorPainel exibe chamada de ação para o Simulador
A página SHALL exibir um card convidando o usuário a iniciar uma simulação, com ao menos um link para `/simulador` e um para `/grupos`.

#### Scenario: Links de navegação presentes
- **WHEN** o SimuladorPainel é renderizado
- **THEN** existem links ativos para `/simulador` e `/grupos`

### Requirement: Composição via componentes — Index.razor coordena mas não acessa DbContext
`Components/Pages/LandingPage/Index.razor` SHALL ser composto pelos cinco componentes reutilizáveis. `Index.razor` PODE chamar `LandingPageService` para carregar dados e passá-los como parâmetros para componentes filhos (ex: dados do ranking para `RankingFifaChart`). O que `Index.razor` NÃO SHALL fazer é injetar ou usar `AppDbContext` diretamente.

#### Scenario: Index.razor sem acesso direto ao DbContext
- **WHEN** `Index.razor` é inspecionado
- **THEN** não há `@inject AppDbContext` em `Index.razor`; qualquer acesso a dados ocorre via `LandingPageService`

#### Scenario: Integração de JSInterop encapsulada em componente filho
- **WHEN** `Index.razor` é inspecionado
- **THEN** não há `@inject IJSRuntime` em `Index.razor`; o JSInterop está encapsulado em `RankingFifaChart`
