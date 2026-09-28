## Purpose

Define as entidades do domínio da Copa do Mundo 2026 e o DbContext que as gerencia, estabelecendo o modelo de dados que suporta todas as funcionalidades do portal.

## Requirements

### Requirement: Entidade Grupo representa um grupo da fase de grupos
A entidade `Grupo` SHALL ter: identificador, nome (ex: "Grupo A"), e coleção de seleções associadas. O torneio possui 12 grupos (A a L).

#### Scenario: Grupo possui seleções associadas
- **WHEN** um Grupo é carregado do banco de dados com suas relações
- **THEN** a coleção de Seleções do grupo está disponível e populada

### Requirement: Entidade Selecao representa uma seleção participante
A entidade `Selecao` SHALL ter: identificador, nome, código FIFA (3 letras), grupo associado, e coleção de jogadores. O torneio possui 48 seleções.

#### Scenario: Selecao possui código FIFA válido
- **WHEN** uma Selecao é consultada
- **THEN** o código FIFA é uma string de 3 letras maiúsculas não nula

#### Scenario: Selecao pertence a um grupo
- **WHEN** uma Selecao é carregada com seu grupo
- **THEN** a referência ao Grupo não é nula

### Requirement: Entidade Jogador representa um jogador convocado
A entidade `Jogador` SHALL ter: identificador, nome, posição, número da camisa, e referência à Selecao. Cada seleção possui lista de jogadores convocados.

#### Scenario: Jogador pertence a uma seleção
- **WHEN** um Jogador é carregado com sua seleção
- **THEN** a referência à Selecao não é nula

### Requirement: Entidade Jogo representa uma partida do torneio
A entidade `Jogo` SHALL ter: identificador, fase, data/hora, estádio, cidade, selecao mandante (ou rótulo da vaga), selecao visitante (ou rótulo da vaga), placar mandante, placar visitante. Jogos a partir das oitavas de final podem ter apenas rótulos de vaga, sem seleções definidas.

#### Scenario: Jogo da fase de grupos tem seleções definidas
- **WHEN** um Jogo da fase de grupos é consultado
- **THEN** as referências a seleção mandante e visitante não são nulas

#### Scenario: Jogo de fase eliminatória pode ter apenas rótulo de vaga
- **WHEN** um Jogo das oitavas de final em diante é consultado
- **THEN** o campo de rótulo de vaga (mandante/visitante) pode estar preenchido no lugar da seleção

### Requirement: Entidade RankingFifa representa a posição de uma seleção no ranking
A entidade `RankingFifa` SHALL ter: identificador, posição, nome da seleção, código FIFA, pontuação. A fonte oficial possui 98 posições.

#### Scenario: RankingFifa contém pelo menos as seleções participantes
- **WHEN** o ranking FIFA é consultado
- **THEN** pelo menos 48 registros estão disponíveis correspondendo às seleções do torneio

### Requirement: Entidade Simulacao representa uma simulação de resultados criada por usuário
A entidade `Simulacao` SHALL ter: identificador, data de criação, nome ou descrição opcional, e coleção de SimulacaoJogo.

#### Scenario: Simulacao persiste após encerramento da aplicação
- **WHEN** a aplicação é reiniciada após uma simulação ter sido salva
- **THEN** a simulação ainda está disponível no banco de dados

### Requirement: Entidade SimulacaoJogo representa o resultado simulado de um jogo
A entidade `SimulacaoJogo` SHALL ter: identificador, referência à Simulacao, referência ao Jogo, placar simulado mandante e visitante.

#### Scenario: SimulacaoJogo associado a uma Simulacao e um Jogo
- **WHEN** um SimulacaoJogo é carregado
- **THEN** as referências à Simulacao e ao Jogo não são nulas

### Requirement: AppDbContext gerencia todas as entidades
O `AppDbContext` SHALL expor DbSets para todas as entidades: Grupo, Selecao, Jogador, Jogo, RankingFifa, Simulacao, SimulacaoJogo.

#### Scenario: AppDbContext aplica migrations na inicialização
- **WHEN** a aplicação inicializa
- **THEN** o banco de dados SQLite é criado/atualizado automaticamente com o schema mais recente
