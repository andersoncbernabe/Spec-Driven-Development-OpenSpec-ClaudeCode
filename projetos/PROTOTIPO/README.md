# PortalCopa26 — protótipo

Protótipo HTML/CSS/JavaScript do PRD em [`docs/PRD.md`](docs/PRD.md), com os dados
extraídos integralmente dos arquivos de [`fontes/`](fontes/).

Sem build, sem framework, sem dependência de runtime: qualquer servidor estático serve.

## Como rodar

```bash
npm start                 # sobe em http://localhost:8080
# ou qualquer servidor estático apontando para esta pasta
```

Abrir `index.html` direto pelo `file://` também funciona, com a ressalva de que o
`localStorage` fica isolado por arquivo em alguns navegadores.

```bash
npm run seed              # regenera data/copa2026.js a partir de ./fontes
npm test                  # 31 testes das regras de negócio
npm run verificar         # seed + testes
```

## Estrutura

```
index.html  jogos.html  grupos.html  equipes.html  ranking.html  simulador.html
assets/css/estilos.css        folha única, mobile-first
assets/js/nucleo.js           índices sobre o seed, formatação, layout, cartão de jogo
assets/js/classificacao.js    RN-01, RN-02 e regra dos terceiros colocados
assets/js/mata-mata.js        RN-03 e resolução do chaveamento
assets/js/boloes.js           gestão e persistência dos bolões
assets/js/pagina-*.js         um módulo por página
data/copa2026.js              seed gerado (NÃO editar à mão)
tools/build-data.js           parser de ./fontes -> data/copa2026.js
tools/selecoes.js             catálogo canônico das 48 seleções
tools/testar-regras.js        testes das regras de negócio
```

## Os dados

`data/copa2026.js` é **gerado** por `tools/build-data.js` lendo `./fontes`. O gerador
falha alto: qualquer nome de seleção, sede ou vaga de mata-mata que não case com as
fontes vira aviso no console. Hoje ele roda **sem nenhum aviso**.

| Item | Quantidade | Fonte |
|---|---|---|
| Seleções | 48 | `copa2026_grupos.txt` |
| Grupos | 12 × 4 | `copa2026_grupos.txt`, `copa2026_cabecas-chave.txt` |
| Cidades-sede | 16 | `copa2026_cidades_sede_estadios.txt`, `copa2026_estadios.txt` |
| Jogos | 104 | os 7 arquivos de jogos |
| Jogadores | 1.238 | `copa2026_selecoes_jogadores.txt` + `selecoes_jogadores_convocados.txt` |
| Técnicos | 48 | `copa2026_pais_tecnicos.txt` |
| Ranking FIFA | 98 seleções | `copa2026_ranking_fifa.txt` |

Distribuição dos 104 jogos: 72 grupos · 16 segunda fase · 8 oitavas · 4 quartas ·
2 semifinais · 1 terceiro lugar · 1 final.

### Normalização de nomes

As fontes grafam a mesma seleção de formas diferentes (`Holanda`/`Países Baixos`,
`Tchéquia`/`República Tcheca`, `EUA`/`Estados Unidos`, `Irã`/`República Islâmica do Irã`,
`RD Congo`/`ReD do Congo`, `Curaçao`/`Curaçau`, `Costa do Marfim`/`Côte d'Ivoire`,
`Bósnia`/`Bósnia e Herzegovina`, `Coreia do Sul`/`República da Coreia`).
`tools/selecoes.js` mantém o nome canônico e os apelidos de cada seleção; o gerador
resolve tudo por esse índice.

O mesmo vale para as sedes: os arquivos de mata-mata usam formas curtas (`Azteca`,
`Nova Jersey`, `Seattle Field`, `Vancouver Place`), mapeadas para as 16 cidades da
tabela de cidades-sede.

### Regras implementadas

- **RN-01** — desempate na fase de grupos, na ordem exata da fonte: pontos → saldo de
  gols → gols marcados → confronto direto → saldo nos confrontos diretos → fair play →
  ranking FIFA. Os critérios 4 e 5 usam uma mini-tabela só com os jogos entre as
  seleções empatadas.
- **RN-02** — 1º e 2º de cada grupo (24) + os 8 melhores terceiros = 32 times na fase
  seguinte. Os terceiros são ordenados por pontos → saldo → gols marcados → fair play →
  ranking FIFA (`Copa2026_Regra_Terceiros_Colocados.txt`).
- **RN-03** — empate no mata-mata leva a prorrogação e, persistindo, a pênaltis. Sem
  pênaltis informados o confronto fica indefinido e não propaga vencedor. Não há gol de
  ouro nem de prata.

`npm test` cobre as três regras com 31 casos, incluindo cada critério de desempate
isoladamente e o encadeamento completo Segunda Fase → Oitavas → Quartas → Semi → Final.

## Divergências encontradas nas fontes

Nenhuma foi resolvida por suposição — a decisão de cada uma está registrada aqui.

1. **Total de jogos.** `copa2026_fases.txt` diz "total de 102 jogos", mas a própria
   tabela do arquivo soma 104 (72+16+8+4+2+1+1) e os arquivos de jogos listam 104
   partidas. O protótipo usa **104**, que é o que os dados sustentam.

2. **Datas das fases.** A tabela de `copa2026_fases.txt` diverge dos arquivos de jogos
   (ex.: oitavas "4 jul – 9 jul" na tabela, 4–7 jul nos jogos). Prevalecem os arquivos
   de jogos, que trazem data e hora de cada partida. A tabela de fases é exibida como
   está, sem correção.

3. **Horário do primeiro jogo.** O bloco de requisitos dentro de `copa2026_grupos.txt`
   fala em countdown para "11 de junho de 2026, 17h"; o arquivo de jogos marca
   **16:00** para México × África do Sul. O countdown aponta para o primeiro jogo da
   tabela (16:00).

4. **Santa Clara × San Francisco.** Os jogos citam "Estádio de Santa Clara"; a tabela de
   cidades-sede cita "San Francisco / Levi's Stadium". As outras 15 sedes casam
   diretamente, e `copa2026_estadios.txt` situa o Levi's Stadium em "San Francisco (Área
   da Baía)" — a associação sai por eliminação, não por suposição.

5. **Cabeça de chave do Grupo L.** `copa2026_cabecas-chave.txt` lista 11 grupos (A–K).
   O cabeça de chave é, pela estrutura de `copa2026_grupos.txt`, a primeira seleção da
   linha do grupo — o que dá **Inglaterra** no Grupo L e confirma os outros 11.

6. **Potes 2 a 4.** Só o Pote 1 é dedutível (os 12 cabeças de chave). As 36 seleções
   restantes foram distribuídas pela ordem do ranking FIFA, 12 por pote. Está dito na
   própria página de grupos.

7. **Ranking FIFA incompleto.** A lista tem 98 seleções e não inclui 7 participantes
   (Bósnia e Herzegovina, Curaçao, Nova Zelândia, Cabo Verde, Arábia Saudita,
   Uzbequistão e Gana). Elas aparecem como "fora da lista de ranking" e, no critério 7
   de desempate, ficam atrás das ranqueadas.

8. **`ddd_ajustes_refinamentos1.txt`.** É de outro domínio (um sistema de vendas em DDD,
   com `Pedido`, `CancelarPedido`, ACL de clientes). Não tem relação com a Copa e não
   entrou no protótipo.

## Campos do PRD sem fonte

Exibidos como `—`, nunca inventados:

- **Participações em Copas** (PRD §8) — nenhuma fonte traz o dado.
- **Número da camisa** e **capitão** (RF-04) — idem.
- **Cartões / fair play** — o critério 6 do RN-01 está implementado e lê
  `cartoesMandante`/`cartoesVisitante` quando existirem; sem dados, é sempre neutro.
- **Resultados oficiais** — nenhuma fonte traz placares. Por isso a página de Grupos
  mostra a tabela zerada por padrão e permite trocar a origem para um bolão do
  simulador; e o "percentual de acertos" do RF-06 compara dois bolões, bastando trocar a
  referência quando os resultados reais existirem.

O campo de 4 valores de `copa2026_selecoes_jogadores.txt` (`nome|idade|posição|N`) é
tratado como **gols marcados**, que é o único dos campos do PRD que ele pode ser. A
fonte é inconsistente nesse número para parte dos jogadores (há goleiros com valores
altos); o protótipo reproduz o dado como está, sem corrigir.

## Cobertura do PRD

| Requisito | Onde |
|---|---|
| PRD §5 Home: hero, países-sede, próximos jogos, ranking, CTA simulador | `index.html` |
| RF-01 countdown, stats, acesso rápido | `index.html` |
| PRD §6 / RF-02 Jogos: data, hora, mandante, visitante, grupo, estádio, ordenação, agrupamento por dia, filtros combinados, status, paginação | `jogos.html` |
| PRD §7 / RF-03 Grupos: posição, seleção, P/V/E/D/GP/GC/SG/Pts, indicadores, badge cabeça de chave, bandeiras, potes | `grupos.html` |
| PRD §8 / RF-04 Equipes: bandeira, nome, grupo, elenco, busca, dropdown por grupo, filtro por posição, confederação, técnico, ranking | `equipes.html` |
| PRD §9 Ranking: posição, seleção, pontuação | `ranking.html` |
| PRD §10 / RF-06 Simulador: placares, recálculo, chaveamento, prorrogação/pênaltis, gestão e comparação de bolões, caminho até a final | `simulador.html` |
| RN-01 / RN-02 / RN-03 | `assets/js/classificacao.js`, `assets/js/mata-mata.js` |
| PRD §11 Seed, bandeiras e logo pela API da FIFA | `data/copa2026.js`, `assets/js/nucleo.js` |

**RNF atendidos:** mobile-first com breakpoints 320/768/1024/1440; paginação acima de 20
itens; contraste AA, `alt` em todas as bandeiras, navegação por teclado, skip-link,
`aria-live` nos resumos e respeito a `prefers-reduced-motion`; PT-BR em toda a
interface. O recálculo completo do torneio (104 jogos) leva ~12 ms, contra os 500 ms
exigidos pelo RF-06.

**Fora do escopo, conforme PRD §12:** área administrativa, cadastro, login,
autenticação, integração automática com APIs esportivas e atualização automática de
resultados.

## Sobre a persistência

O PRD prevê SQLite (`copa2026.db`) para a versão Blazor/.NET 10 + EF Core. Nesta
primeira versão — que o PRD define como protótipo HTML/CSS/JavaScript — os bolões ficam
no `localStorage`, com o mesmo formato de dados (`{ id, nome, criadoEm, atualizadoEm,
resultados: { jogoId: { golsMandante, golsVisitante, penaltisMandante,
penaltisVisitante } } }`), para que a migração seja uma troca de repositório.
