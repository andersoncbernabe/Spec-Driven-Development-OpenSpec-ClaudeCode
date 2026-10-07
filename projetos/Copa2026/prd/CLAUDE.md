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

### Capacidades Principais

- Landing Page
- Jogos
- Grupos
- Seleções
- Ranking FIFA
- Simulador

---

## Organização Funcional

Cada capacidade deverá possuir:

- Componentes próprios
- Serviços próprios
- Especificações OpenSpec próprias

Estrutura base:

```text
Components/Pages/LandingPage
Components/Pages/Jogos
Components/Pages/Grupos
Components/Pages/Selecoes
Components/Pages/Ranking
Components/Pages/Simulador
```

---

## Serviços

Não acessar DbContext diretamente em páginas ou componentes Razor.

Todo acesso aos dados deve ocorrer através de serviços específicos.

Exemplos:

- LandingPageService
- JogosService
- GruposService
- RankingService
- SimuladorService

---

## Interface

Utilizar Bootstrap 5 como base visual.

Priorizar reutilização dos componentes Bootstrap antes da criação de componentes customizados.

Evitar frameworks CSS adicionais sem necessidade.

---

## Visualizações e Gráficos

A Landing Page deverá exibir gráficos utilizando:

- Chart.js
- JSInterop

Os componentes de gráficos devem ser reutilizáveis para futuras visualizações estatísticas.

---

## Persistência

A aplicação utilizará SQLite através do EF Core.

Além dos dados oficiais da Copa, o banco deverá armazenar:

- Simulações realizadas pelos usuários
- Resultados simulados dos jogos
- Classificações geradas a partir das simulações

As simulações devem permanecer disponíveis mesmo após o encerramento da aplicação.

---

## Referências

Utilizar sempre caminhos relativos.

Exemplos:

```text
./fontes
../prototipo
```

Evitar caminhos absolutos.

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

## Dados Oficiais

Os dados oficiais do torneio estão definidos nos arquivos da pasta:

```text
./fontes
```

Arquivos oficiais:

- copa2026_cidades_sede_estadios.txt
- copa2026_cabecas_chave.txt
- copa2026_grupos.txt
- copa2026_jogos_primeira_fase.txt
- copa2026_regras_negocio.txt
- copa2026_fases.txt

Ao implementar funcionalidades relacionadas ao torneio:

- Não gerar dados fictícios
- Não inventar confrontos
- Não criar grupos não definidos
- Utilizar exclusivamente os dados da pasta ./fontes

Dados oficiais previstos:

- 48 seleções
- 12 grupos
- 16 estádios
- 6 fases
- 72 jogos na fase de grupos
- 102 jogos no total do torneio
- Ranking FIFA

Bandeiras e logotipos poderão ser obtidos através das APIs públicas da FIFA.

---

## OpenSpec

As mudanças devem:

- Manter escopo reduzido por change
- Cada change deve possuir um objetivo funcional claro
- Permitir múltiplas tarefas dentro da mesma change
- Evitar agrupar capacidades não relacionadas em uma única change
- Priorizar componentes reutilizáveis
- Evitar alterações não relacionadas ao objetivo da change
- Seguir as diretrizes definidas neste documento
- Utilizar as informações da pasta ./fontes como fonte oficial dos dados do torneio

## Documentação Complementar

Antes de implementar funcionalidades relacionadas ao domínio da Copa, consultar:

- ./docs/RegrasCopa2026.md
- ./docs/EstruturaDados.md

Antes de utilizar dados do torneio, consultar os arquivos da pasta:

- ./fontes

Os arquivos da pasta fontes são a fonte oficial dos dados da Copa do Mundo 2026.