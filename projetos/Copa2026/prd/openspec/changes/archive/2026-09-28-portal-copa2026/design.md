## Context

Ver proposal.md — Why para a motivação desta change.

O projeto começa do zero: nenhum código de aplicação existe ainda. Os dados oficiais da Copa residem em arquivos `.txt` na pasta `./fontes` e serão lidos pelo processo de SeedData. O protótipo HTML em `../PROTOTIPO` serve como referência visual e funcional, mas não será migrado diretamente — a aplicação é construída em Blazor a partir do zero.

## Goals / Non-Goals

**Goals:**
- Criar projeto Blazor Web App (.NET 10) com estrutura de pastas que suporte futura migração para camadas
- Definir todas as entidades do domínio e o `AppDbContext` com SQLite
- Implementar SeedData idempotente que lê os arquivos de `./fontes`
- Registrar serviços e DbContext no container de DI nativo do ASP.NET Core

**Non-Goals:**
- Implementar qualquer página ou funcionalidade de UI (LandingPage, Jogos, Grupos etc.)
- Integrações com APIs externas
- Autenticação, autorização ou área administrativa
- Configuração de Chart.js/JSInterop (será feita na change da Landing Page)

## Decisions

### Decisão 1: Projeto único (não solução multi-projeto)
**Escolha:** Um único projeto Blazor Web App sem múltiplos projetos na solução.
**Razão:** O CLAUDE.md exige arquitetura simplificada em projeto único para a primeira versão. A organização por pastas (`Models/`, `Services/`, `Data/`) permite futura extração para projetos separados sem refatorações drásticas.
**Alternativa considerada:** Solução com projetos separados (Core, Infrastructure, Web) — rejeitada por aumentar a complexidade sem benefício imediato.

### Decisão 2: SeedData via serviço na inicialização (não via EF Core Data Seeding)
**Escolha:** Implementar um `DataSeeder` como serviço invocado em `Program.cs` durante a inicialização, que lê os arquivos `.txt` de `./fontes` e persiste via `AppDbContext`.
**Razão:** O EF Core Data Seeding (via `modelBuilder.HasData`) exige dados compilados em tempo de build, o que impossibilita leitura de arquivos externos. Um serviço de seed permite lógica de idempotência customizada (verificar existência antes de inserir) e separação clara entre dados oficiais e simulações do usuário.
**Alternativa considerada:** Migrations com seed embutido — rejeitada por não suportar leitura de arquivos externos nem idempotência baseada em estado do banco.

### Decisão 3: Jogos eliminatórios com rótulos de vaga como strings
**Escolha:** Os campos `SelecaoMandante` e `SelecaoVisitante` no modelo `Jogo` serão nullable (referência à entidade `Selecao`), com campos adicionais `RotuloMandante` e `RotuloVisitante` (string) para representar vagas como "Venc. Segundafase 1".
**Razão:** As fontes oficiais não definem seleções para jogos a partir das oitavas. O sistema não deve atribuir seleções a esses jogos por conta própria (CLAUDE.md). Campos separados evitam ambiguidade entre "seleção não definida" e "jogo sem seleção por design".
**Alternativa considerada:** Usar apenas strings para ambos os lados e resolver a referência posteriormente — rejeitada por perder a integridade referencial nos jogos da fase de grupos.

### Decisão 4: Renderização Blazor com modo interativo Server
**Escolha:** Configurar o projeto com renderização interativa no modo Server (`InteractiveServer`) como padrão para componentes que precisam de interatividade.
**Razão:** Suporte adequado para JSInterop (necessário para Chart.js na Landing Page futura), persistência de estado entre interações do simulador, e simplicidade de deploy sem necessidade de WebAssembly.
**Alternativa considerada:** WebAssembly ou Auto — rejeitados por maior complexidade e ausência de casos de uso que justifiquem o trade-off.

## Risks / Trade-offs

- **[Risco] Leitura dos arquivos `.txt` em produção**: O SeedData depende de arquivos na pasta `./fontes` disponíveis em runtime. → Mitigação: documentar que a pasta deve estar presente; em deploy, incluir os arquivos como conteúdo do projeto (`<Content CopyToOutputDirectory="PreserveNewest">`).

- **[Trade-off] Projeto único**: Facilita o início, mas pode gerar acoplamento se a equipe não respeitar a separação por pastas. → Mitigação: a diretriz do CLAUDE.md é explícita sobre não acessar DbContext diretamente em páginas; serviços são a única interface de acesso.

- **[Risco] Idempotência do seed com arquivos alterados**: Se os arquivos de fontes forem modificados (ex: correção de dado), registros existentes no banco não serão atualizados automaticamente. → Mitigação: a carga é baseada em "inserir se não existir"; uma estratégia de atualização por chave natural pode ser adicionada futuramente se necessário, mas está fora do escopo desta change.

## Migration Plan

1. Criar projeto Blazor Web App com `dotnet new blazorweb`
2. Adicionar pacotes NuGet: EF Core SQLite e Tools
3. Criar entidades em `Models/`
4. Criar `AppDbContext` em `Data/`
5. Criar migration inicial: `dotnet ef migrations add InitialCreate`
6. Criar serviços stub em `Services/` (implementações mínimas)
7. Registrar DbContext e serviços em `Program.cs`
8. Implementar `DataSeeder` e invocar em `Program.cs`
9. Copiar arquivos de `./fontes` para dentro do projeto com `CopyToOutputDirectory`
10. Executar `dotnet run` e verificar banco populado

**Rollback:** Como é um projeto novo, não há estado anterior a restaurar. Em caso de problema, basta recriar o projeto.
