# PortalCopa26

## Projeto

Portal informativo da Copa do Mundo 2026 focado em consulta de jogos, grupos, seleções, ranking FIFA e simulação de resultados.

---

## Tecnologias

- .NET 10
- Blazor Web App
- EF Core
- SQLite
- Bootstrap 5
- JSInterop
- Chart.js

---

## Arquitetura

A aplicação será desenvolvida inicialmente em um único projeto Blazor Web App.

### Organização

- Pages
- Components
- Models
- Services
- Data

O código deve ser organizado de forma que permita futura migração para uma arquitetura em camadas sem grandes alterações.

---

## Escopo

### Landing Page

Página inicial contendo:

- Hero Section
- Países-sede
- Próximos jogos
- Ranking FIFA : Grafico de barras com Chart.js
- Chamada para o simulador

### Jogos

- Listagem de jogos 
- Ordenação por data
- Informações do grupo
- Informaçções do estádio

## Grupos

- Exibição dos grupos
- Classificação
- Estatísticas


## Seleções

- Informações das seleções
- Elencos
- Estatísticas dos jogadores : nome, posição, idade, gols marcados, participação em copas

### Ranking FIFA

- Exibição do ranking das seleções

### Simulasdor

- Simulação de resultados
- Atualização da classificação
- Simulação de fase de grupos
- Persistir a simulação

## Visualizações e Gráficos

A Landing Page deverá exibir um gráfico de barras com Ranking FIFA.

- Utilizar Chart.js para renderização dos gráficos
- Integrar o Chart.js através de JSInterop
- O gráfico deverá exibir sas principais seleções e sua pontuação do ranking FIFA
- O componente deve ser reutilizável para futuras visualizações estatíticas


---

## Persistência

A aplicação utilizará SQLite através do EF Core.

Além dos dados oficiais da Copa, o banco deverá armazenar:

- Simulações realizadas pelos usuários
- Resultados simulados dos jogos
- Classificações geradas a partir das simulações

As simulações devem permanecer disponíveis mesmo após o encerramento da aplicação.

---

## Fora do Escopo

Não fazem parte da primeira versão:

- Área administrativa
- Autenticação
- Autorização
- Gestão de usuários
- Integração com APIs externas
- Atualização automática dos resultados

---

## Diretrizes de Desenvolvimento

- Utilizar async/await sempre que aplicável
- Utilizar injeção de dependência nativa do ASP.NET Core
- Criar componentes Blazor reutilizáveis
- Evitar duplicação de código
- Seguir princípios SOLID quando aplicável
- Utilizar EF Core como mecanismo de persistência
- Utilizar SQLite como banco de dados local
- Utilizar JSInterop apenas quando necessário
- Priorizar legibilidade e manutenção do código

---


## Dados Iniciais

Os dados serão carregados através de Seed Data.

Dados previstos:

- Seleções
- Grupos
- Jogadores
- Jogos
- Ranking FIFA

As bandeiras das seleções poderão utilizar o padrão da API pública da FIFA.


## Estrutura Física

Todo o código-fonte d aplicação deverá ser criado dentro da pasta src/ 
localizada na raiz do workspace atual

Estrutura desejada:
src/
|__PortalCopa26
   |_____PortalCopa26.slnx
   |_____PortalCopa26/


Utilizar o formato de solução com extensão .slnx para o arquivo da solução