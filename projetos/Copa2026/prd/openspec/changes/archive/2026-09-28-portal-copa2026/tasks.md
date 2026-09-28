## 1. Criar Projeto Blazor Web App

- [x] 1.1 Criar o projeto `PortalCopa26` com `dotnet new blazorweb -n PortalCopa26` e verificar que `dotnet build` conclui sem erros
- [x] 1.2 Adicionar pacotes NuGet `Microsoft.EntityFrameworkCore.Sqlite` e `Microsoft.EntityFrameworkCore.Tools` e verificar que `dotnet restore` conclui sem conflitos de versão
- [x] 1.3 Criar estrutura de pastas: `Components/Pages`, `Models`, `Services`, `Data` e verificar que as pastas existem na raiz do projeto
- [x] 1.4 Confirmar que Bootstrap 5 está referenciado no layout principal (`App.razor` ou `MainLayout.razor`) e verificar que a aplicação carrega os estilos no navegador via `dotnet run`

## 2. Definir Entidades do Domínio

- [x] 2.1 Criar entidade `Grupo` em `Models/Grupo.cs` com propriedades: `Id`, `Nome`, `Selecoes` (navegação) e verificar que compila sem erros
- [x] 2.2 Criar entidade `Selecao` em `Models/Selecao.cs` com propriedades: `Id`, `Nome`, `CodigoFifa`, `GrupoId`, `Grupo` (navegação), `Jogadores` (navegação) e verificar que compila sem erros
- [x] 2.3 Criar entidade `Jogador` em `Models/Jogador.cs` com propriedades: `Id`, `Nome`, `Posicao`, `Numero`, `SelecaoId`, `Selecao` (navegação) e verificar que compila sem erros
- [x] 2.4 Criar entidade `Jogo` em `Models/Jogo.cs` com propriedades: `Id`, `Fase`, `DataHora`, `Estadio`, `Cidade`, `SelecaoMandanteId` (nullable), `SelecaoMandante` (navegação nullable), `SelecaoVisitanteId` (nullable), `SelecaoVisitante` (navegação nullable), `RotuloMandante` (string nullable), `RotuloVisitante` (string nullable), `PlacarMandante` (nullable), `PlacarVisitante` (nullable) e verificar que compila sem erros
- [x] 2.5 Criar entidade `RankingFifa` em `Models/RankingFifa.cs` com propriedades: `Id`, `Posicao`, `NomeSelecao`, `CodigoFifa`, `Pontuacao` e verificar que compila sem erros
- [x] 2.6 Criar entidade `Simulacao` em `Models/Simulacao.cs` com propriedades: `Id`, `DataCriacao`, `Descricao` (nullable), `SimulacaoJogos` (navegação) e verificar que compila sem erros
- [x] 2.7 Criar entidade `SimulacaoJogo` em `Models/SimulacaoJogo.cs` com propriedades: `Id`, `SimulacaoId`, `Simulacao` (navegação), `JogoId`, `Jogo` (navegação), `PlacarMandante`, `PlacarVisitante` e verificar que compila sem erros

## 3. Configurar DbContext e Migration

- [x] 3.1 Criar `AppDbContext` em `Data/AppDbContext.cs` com DbSets para todas as 7 entidades e configuração de relacionamentos via Fluent API e verificar que compila sem erros
- [x] 3.2 Criar migration inicial com `dotnet ef migrations add InitialCreate` e verificar que o arquivo de migration é gerado em `Data/Migrations/`
- [x] 3.3 Verificar que `dotnet ef database update` cria o arquivo SQLite com todas as tabelas esperadas

## 4. Implementar SeedData

- [x] 4.1 Copiar os arquivos da pasta `./fontes` para dentro do projeto com configuração `<Content CopyToOutputDirectory="PreserveNewest">` no `.csproj` e verificar que os arquivos estão presentes na pasta de output após build
- [x] 4.2 Criar `DataSeeder` em `Data/DataSeeder.cs` que lê `copa2026_grupos.txt` e `copa2026_selecoes_jogadores.txt` e insere Grupos e Seleções de forma idempotente (inserir apenas se não existir) e verificar que 12 grupos e 48 seleções são criados na primeira execução
- [x] 4.3 Estender `DataSeeder` para ler `selecoes_jogadores_convocados.txt` e inserir Jogadores de forma idempotente e verificar que jogadores são criados sem duplicação em reinicializações
- [x] 4.4 Estender `DataSeeder` para ler `copa2026_jogos_primeira_fase.txt` e inserir os 72 jogos da fase de grupos com seleções, datas e estádios e verificar que 72 jogos são criados com referências corretas às seleções
- [x] 4.5 Estender `DataSeeder` para ler os arquivos de jogos das fases eliminatórias (`copa2026_Jogos_Segunda_fase.txt`, `copa2026_jogos_oitavas.txt`, `copa2026_jogos_quartas.txt`, `copa2026_jogos_semifinal.txt`, `copa2026_jogo_terceiro_lugar.txt`, `copa2026_jogo_final.txt`) inserindo jogos com rótulos de vaga em vez de seleções e verificar que os jogos são criados com `RotuloMandante` e `RotuloVisitante` preenchidos
- [x] 4.6 Estender `DataSeeder` para ler `copa2026_ranking_fifa.txt` e inserir registros de RankingFifa de forma idempotente e verificar que pelo menos 48 posições são carregadas
- [x] 4.7 Verificar idempotência: reiniciar a aplicação duas vezes e confirmar que o total de registros permanece igual entre as execuções

## 5. Registrar Serviços e Configurar DI

- [x] 5.1 Registrar `AppDbContext` em `Program.cs` com `AddDbContext<AppDbContext>` configurado para SQLite, com caminho do banco definido via `appsettings.json` e verificar que a aplicação inicia sem erros de configuração
- [x] 5.2 Criar stubs dos serviços de dados em `Services/`: `JogosService.cs`, `GruposService.cs`, `SelecaoService.cs`, `RankingService.cs` (com pelo menos um método async como `GetAllAsync()`) e verificar que compilam sem erros
- [x] 5.3 Registrar todos os serviços de dados no container de DI em `Program.cs` e verificar que nenhum componente Razor usa `@inject AppDbContext` diretamente (acesso somente via serviços)
- [x] 5.4 Invocar `DataSeeder` em `Program.cs` durante a inicialização (antes de `app.Run()`) e verificar que os dados são carregados corretamente ao executar `dotnet run`

## 6. Validação Final

- [x] 6.1 Executar `dotnet build` sem erros ou warnings relevantes
- [x] 6.2 Executar `dotnet run` e confirmar que a aplicação inicializa, aplica migration, executa seed e responde na porta padrão
- [x] 6.3 Verificar via ferramenta SQLite (ex: DB Browser) ou log de inicialização que o banco contém: 12 grupos, 48 seleções, 72 jogos de fase de grupos, jogos eliminatórios com rótulos de vaga, e registros de ranking FIFA
