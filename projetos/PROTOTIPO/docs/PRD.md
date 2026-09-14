# PRD - PortalCopa26

## 1. Visão Geral

O PortalCopa26 é uma aplicação web voltada para fãs da Copa do Mundo FIFA 2026.

O objetivo é fornecer informações organizadas sobre jogos, grupos, seleções, classificação e ranking FIFA, além de permitir a simulação dos resultados da competição.

A primeira versão será implementada como um protótipo HTML/CSS/JavaScript e posteriormente evoluída para uma aplicação Blazor Web App utilizando .NET 10, EF Core e SQLite.

---

## 2. Objetivos

O sistema deve permitir que o usuário:

* Consultar os jogos da Copa do Mundo 2026
* Visualizar grupos e classificação
* Consultar informações das seleções
* Consultar os elencos das seleções
* Visualizar o ranking FIFA
* Simular resultados dos jogos
* Simular a classificação dos grupos

---

## 3. Público-Alvo

* Fãs de futebol
* Acompanhantes da Copa do Mundo
* Usuários interessados em estatísticas e simulações

---

## 4. Navegação Principal

A aplicação deverá possuir as seguintes páginas:

### Home

Landing page principal.

### Jogos

Exibe todos os jogos da Copa ordenados por data.

### Grupos

Exibe os grupos e a classificação.

### Equipes

Exibe as seleções participantes.

### Ranking

Exibe o ranking FIFA.

### Simulador

Permite simular os resultados dos jogos.

---

## 5. Página Home

A Home deverá conter:

### Hero Section

* Logo da Copa
* Nome do portal
* Países-sede

### Países-Sede

Exibir:

* Canadá
* Estados Unidos
* México

### Próximos Jogos

Exibir os próximos jogos da competição.

### Ranking FIFA

Exibir as principais seleções do ranking.

### Chamada para o Simulador

Botão para acesso ao simulador.

---

## 6. Página Jogos

Exibir:

* Data do jogo
* Hora
* Seleção mandante
* Seleção visitante
* Grupo
* Estádio

Recursos:

* Ordenação por data
* Agrupamento por dia

Link:

* Ver grupos

---

## 7. Página Grupos

Exibir os grupos da competição.

Cada grupo deverá apresentar:

* Posição
* Seleção
* Jogos
* Vitórias
* Empates
* Derrotas
* Saldo de gols
* Pontos

---

## 8. Página Equipes

Exibir todas as seleções participantes.

Ao selecionar uma equipe, exibir:

* Bandeira
* Nome
* Grupo
* Elenco

Cada jogador deverá apresentar:

* Nome
* Posição
* Idade
* Gols marcados
* Participações em Copas

---

## 9. Página Ranking

Exibir o ranking FIFA.

Informações:

* Posição
* Seleção
* Pontuação

---

## 10. Página Simulador

Permitir:

* Informar placares
* Simular resultados
* Recalcular classificação

O simulador deverá atualizar:

* Pontuação
* Saldo de gols
* Classificação do grupo

---

## 11. Fonte dos Dados

Os dados iniciais serão carregados através de Seed.

Dados previstos:

* Seleções
* Grupos
* Jogadores
* Jogos
* Ranking FIFA

As bandeiras poderão ser obtidas através da API pública da FIFA.

Exemplo:

https://api.fifa.com/api/v3/picture/flags-sq-4/MEX

O logo da Fifa poderá ser obtida da API da FIFA

Exemplo: 

https://api.fifa.com/api/v3/picture/tournaments-sq-4/285023

---

## 12. Fora do Escopo

Não fazem parte da primeira versão:

* Área administrativa
* Cadastro de usuários
* Login
* Autenticação
* Integração automática com APIs esportivas
* Atualização automática dos resultados

---

## 13. Evoluções Futuras

Possíveis melhorias:

* Área administrativa simplificada
* Atualização manual de resultados
* Integração com APIs esportivas
* Bolão
* Compartilhamento de simulações
* Estatísticas avançadas
