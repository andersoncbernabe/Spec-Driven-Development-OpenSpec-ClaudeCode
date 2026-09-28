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

Os dados serão carregados através de Seed Data.

Os dados oficiais do torneio estão definidos nos arquivos da pasta:

```text
./fontes
```

Ao implementar funcionalidades relacionadas ao torneio:

- Não gerar dados fictícios
- Não inventar confrontos
- Não criar grupos não definidos
- Não arbitrar posições de ranking ausentes
- Utilizar exclusivamente os dados da pasta ./fontes

### Carga Inicial

Os dados oficiais serão carregados no banco através de Seed Data, executado na inicialização da aplicação.

A carga deve ser idempotente: reexecutar o seed não duplica registros oficiais nem sobrescreve simulações do usuário.

### Arquivos Oficiais

Dados base:

- copa2026_cidades_sede_estadios.txt
- copa2026_estadios.txt
- copa2026_cabecas-chave.txt
- copa2026_grupos.txt
- copa2026_pais_tecnicos.txt
- copa2026_ranking_fifa.txt
- copa2026_selecoes_jogadores.txt
- selecoes_jogadores_convocados.txt

Jogos por fase:

- copa2026_jogos_primeira_fase.txt
- copa2026_Jogos_Segunda_fase.txt
- copa2026_jogos_oitavas.txt
- copa2026_jogos_quartas.txt
- copa2026_jogos_semifinal.txt
- copa2026_jogo_terceiro_lugar.txt
- copa2026_jogo_final.txt

Fases e regras:

- copa2026_fases.txt
- copa2026_regras_negocio.txt
- Copa2026_Regra_Terceiros_Colocados.txt

### Volumes Oficiais

- 48 seleções
- 12 grupos (A a L), com 4 seleções cada
- 16 cidades-sede e 16 estádios
- 7 fases
- 104 jogos no total, sendo 72 na fase de grupos
- Jogadores convocados por seleção
- Ranking FIFA

### Fases do Torneio

| Fase             | Times | Jogos | Datas                          |
|------------------|-------|-------|--------------------------------|
| Fase de Grupos   | 48    | 72    | 11 jun – 2 jul                 |
| Segunda Fase     | 32    | 16    | 28 jun – 3 jul                 |
| Oitavas de Final | 16    | 8     | 4 jul – 9 jul                  |
| Quartas de Final | 8     | 4     | 11 jul – 13 jul                |
| Semifinais       | 4     | 2     | 15 jul – 16 jul                |
| 3º Lugar         | 2     | 1     | 18 jul (Miami)                 |
| Final            | 2     | 1     | 19 jul (Nova York/Nova Jersey) |

Os jogos a partir das oitavas de final não têm seleções definidas nas fontes: cada lado expõe apenas o rótulo da vaga a ser preenchida (por exemplo, `Venc. Segundafase 1`). O sistema não deve atribuir seleções a esses jogos por conta própria.

### Imagens

Bandeiras e logotipos poderão ser obtidos através das APIs públicas de imagem da FIFA.

Bandeira, pelo código FIFA da seleção:

```text
https://api.fifa.com/api/v3/picture/flags-sq-4/MEX
```

Logotipo do torneio:

```text
https://api.fifa.com/api/v3/picture/tournaments-sq-4/285023
```

São URLs de imagem estática consumidas diretamente pelo navegador. Não constituem integração com API externa de dados, que permanece fora do escopo.

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
