## Purpose

Define o comportamento da carga inicial de dados oficiais da Copa do Mundo 2026, garantindo que os dados sejam carregados de forma idempotente a partir dos arquivos da pasta `./fontes`.

## Requirements

### Requirement: SeedData executa automaticamente na inicialização
O sistema SHALL executar o processo de SeedData automaticamente durante a inicialização da aplicação, antes de aceitar requisições.

#### Scenario: Aplicação inicializa com banco vazio
- **WHEN** a aplicação é iniciada com banco de dados vazio ou recém-criado
- **THEN** todos os dados oficiais são carregados no banco antes da primeira requisição

### Requirement: SeedData é idempotente
O SeedData SHALL ser idempotente: executar múltiplas vezes não duplica registros oficiais nem sobrescreve simulações existentes do usuário.

#### Scenario: SeedData reexecutado não duplica dados
- **WHEN** a aplicação é reiniciada com dados oficiais já carregados
- **THEN** o número de registros oficiais permanece o mesmo após a reinicialização

#### Scenario: SeedData não apaga simulações do usuário
- **WHEN** a aplicação é reiniciada após o usuário ter criado simulações
- **THEN** as simulações do usuário ainda estão presentes no banco de dados

### Requirement: SeedData carrega dados dos grupos e seleções
O sistema SHALL carregar 12 grupos (A a L) e 48 seleções a partir dos arquivos `copa2026_grupos.txt` e dados relacionados.

#### Scenario: Grupos e seleções carregados corretamente
- **WHEN** o SeedData é executado
- **THEN** existem exatamente 12 grupos e 48 seleções no banco de dados

### Requirement: SeedData carrega jogos da fase de grupos
O sistema SHALL carregar 72 jogos da fase de grupos com data, horário, estádio e seleções definidas, a partir de `copa2026_jogos_primeira_fase.txt`.

#### Scenario: Jogos da fase de grupos carregados
- **WHEN** o SeedData é executado
- **THEN** existem 72 jogos da fase de grupos com seleções, datas e estádios definidos

### Requirement: SeedData carrega jogos das fases eliminatórias sem seleções fixas
O sistema SHALL carregar os jogos das fases eliminatórias (Segunda Fase, Oitavas, Quartas, Semifinal, Terceiro Lugar e Final) com rótulos de vaga no lugar de seleções, conforme definido nos arquivos de fontes.

#### Scenario: Jogos eliminatórios carregados com rótulos de vaga
- **WHEN** o SeedData é executado
- **THEN** os jogos a partir das oitavas de final possuem rótulos de vaga (ex: "Venc. Segundafase 1") em vez de seleções fixas

### Requirement: SeedData carrega o ranking FIFA
O sistema SHALL carregar os dados do ranking FIFA a partir de `copa2026_ranking_fifa.txt`, com pelo menos 48 posições correspondendo às seleções participantes.

#### Scenario: Ranking FIFA carregado
- **WHEN** o SeedData é executado
- **THEN** existem pelo menos 48 registros de ranking FIFA no banco de dados

### Requirement: SeedData não gera dados fictícios
O SeedData SHALL utilizar exclusivamente os dados presentes nos arquivos da pasta `./fontes`, sem inventar confrontos, grupos, seleções ou posições de ranking ausentes nos arquivos oficiais.

#### Scenario: Dados do seed correspondem às fontes oficiais
- **WHEN** os dados do banco são comparados com os arquivos de fontes
- **THEN** não há registros no banco que não correspondam a dados presentes nos arquivos oficiais
