/**
 * Pagina Grupos (PRD secao 7 / RF-03).
 *
 * Cards dos 12 grupos com classificacao completa, indicadores de situacao,
 * badge de cabeca de chave, melhores terceiros e distribuicao dos potes.
 *
 * O seed nao traz resultados oficiais (nenhuma fonte os fornece), entao a
 * pagina permite ver a tabela "zerada" ou a tabela recalculada a partir de um
 * bolao salvo no simulador.
 */
(function () {
  'use strict';

  const P = window.Portal;
  const C = window.Classificacao;
  const B = window.Boloes;
  const el = P.el;

  P.iniciarLayout();

  document.querySelector('[data-descricao]').textContent =
    `Os ${P.dados.grupos.length} grupos da ${P.dados.meta.torneio}. A classificação é recalculada `
    + 'automaticamente a partir dos resultados, aplicando os critérios de desempate da FIFA.';

  /* ------------------------------------------------- Origem dos resultados */

  const avisoOrigem = document.querySelector('[data-origem]');
  const boloes = B.listar();
  const qs = P.parametros.ler();
  let origem = qs.get('origem') || (boloes.length ? boloes[0].id : 'oficial');
  if (origem !== 'oficial' && !B.obter(origem)) origem = 'oficial';

  function resultadosAtuais() {
    if (origem === 'oficial') return {};
    const b = B.obter(origem);
    return b ? b.resultados : {};
  }

  function montarOrigem() {
    P.limpar(avisoOrigem);
    const select = el('select', { id: 'origem-resultados', 'aria-label': 'Origem dos resultados' }, [
      el('option', { value: 'oficial', texto: 'Resultados oficiais (seed)' })
    ]);
    B.listar().forEach((b) => {
      select.appendChild(el('option', { value: b.id, texto: `Bolão: ${b.nome}` }));
    });
    select.value = origem;
    select.addEventListener('change', () => {
      origem = select.value;
      P.parametros.gravar({ origem: origem === 'oficial' ? '' : origem });
      renderizar();
    });

    avisoOrigem.appendChild(el('div', null, [
      el('strong', { texto: 'Origem dos resultados: ' }),
      select,
      el('p', { style: 'margin:.5rem 0 0' }, [
        origem === 'oficial'
          ? 'Os arquivos de ./fontes descrevem a tabela do torneio, mas não trazem placares. '
            + 'Com a tabela oficial vazia, todos os times aparecem zerados. '
          : 'Classificação recalculada com os palpites do bolão selecionado. ',
        el('a', { href: 'simulador.html', texto: 'Informe placares no simulador →' })
      ])
    ]));
  }

  /* ----------------------------------------------------------- Cards de grupo */

  const COLUNAS = [
    { chave: 'posicao', rotulo: '#', titulo: 'Posição' },
    { chave: 'selecao', rotulo: 'Seleção', esquerda: true },
    { chave: 'jogos', rotulo: 'P', titulo: 'Jogos disputados' },
    { chave: 'vitorias', rotulo: 'V', titulo: 'Vitórias' },
    { chave: 'empates', rotulo: 'E', titulo: 'Empates' },
    { chave: 'derrotas', rotulo: 'D', titulo: 'Derrotas' },
    { chave: 'golsPro', rotulo: 'GP', titulo: 'Gols pró' },
    { chave: 'golsContra', rotulo: 'GC', titulo: 'Gols contra' },
    { chave: 'saldo', rotulo: 'SG', titulo: 'Saldo de gols' },
    { chave: 'pontos', rotulo: 'Pts', titulo: 'Pontos' }
  ];

  const CLASSE_SITUACAO = {
    classificado: 'classificado',
    'classificado-terceiro': 'classificado',
    terceiro: 'terceiro',
    parcial: '',
    indefinido: '',
    eliminado: 'eliminado'
  };

  function cartaoGrupo(letra, classificacao, info) {
    const corpo = classificacao.map((linha) => {
      const s = P.selecao(linha.selecaoId);
      const situacao = info.situacoes[linha.selecaoId];
      const classe = CLASSE_SITUACAO[situacao] || '';

      return el(`tr${classe ? `.linha--${classe}` : ''}`, null, [
        el('td', null, [el(`span.pos${classe ? `.pos--${classe}` : ''}`, { texto: linha.posicao })]),
        el('td.esquerda', null, [
          el('div.celula-selecao', null, [
            P.bandeira(linha.selecaoId, 'p'),
            el('a', { href: `equipes.html?selecao=${linha.selecaoId}`, texto: s.nome }),
            // Badge compacto: o card do grupo é estreito e a tabela tem 10 colunas.
            s.cabecaDeChave
              ? el('span.etiqueta.etiqueta--amarela', { title: 'Cabeça de chave (Pote 1)' }, [
                el('span', { 'aria-hidden': 'true', texto: '★' }),
                el('span.visualmente-oculto', { texto: 'Cabeça de chave' })
              ])
              : null
          ])
        ]),
        el('td.num', { texto: linha.jogos }),
        el('td.num', { texto: linha.vitorias }),
        el('td.num', { texto: linha.empates }),
        el('td.num', { texto: linha.derrotas }),
        el('td.num', { texto: linha.golsPro }),
        el('td.num', { texto: linha.golsContra }),
        el('td.num', { texto: linha.saldo > 0 ? `+${linha.saldo}` : linha.saldo }),
        el('td.num.destaque', { texto: linha.pontos })
      ]);
    });

    return el('section.cartao.grupo-cartao', { 'aria-labelledby': `grupo-${letra}` }, [
      el('div.grupo-cartao__topo', null, [
        el('span.grupo-cartao__letra', { texto: letra, 'aria-hidden': 'true' }),
        el('div', null, [
          el('h3.grupo-cartao__titulo', { id: `grupo-${letra}`, texto: `Grupo ${letra}` }),
          el('span.equipe-item__meta', {
            texto: `${info.disputados} de ${info.totalJogos} jogos com placar`
          })
        ])
      ]),
      el('div.tabela-wrap', null, [
        el('table.tabela', null, [
          el('caption', { texto: `Classificação do Grupo ${letra}` }),
          el('thead', null, [el('tr', null, COLUNAS.map((c) => el(
            `th${c.esquerda ? '.esquerda' : ''}`,
            { scope: 'col', title: c.titulo || null, texto: c.rotulo }
          )))]),
          el('tbody', null, corpo)
        ])
      ]),
      el('p', { style: 'margin:.2rem 0 0' }, [
        el('a', { href: `jogos.html?fase=grupos&grupo=${letra}`, texto: `Ver os jogos do Grupo ${letra} →`, style: 'font-size:.84rem' })
      ])
    ]);
  }

  /* ------------------------------------------------------------- Terceiros */

  function tabelaTerceiros(terceiros, algumGrupoCompleto, houvePlacar) {
    document.querySelector('[data-descricao-terceiros]').textContent =
      'RN-02: além do 1º e do 2º de cada grupo (24 seleções), os 8 melhores entre os 12 terceiros '
      + 'colocados avançam, totalizando 32 times. Critérios: pontos, saldo de gols, gols marcados, '
      + 'fair play e ranking FIFA.';

    return el('table.tabela', null, [
      el('caption', {
        texto: !houvePlacar
          ? 'Sem placares informados: os 12 terceiros estão empatados em tudo e a ordem sai do ranking FIFA. '
            + 'Nada está decidido.'
          : (algumGrupoCompleto
            ? 'Ordenação dos 12 terceiros colocados. As 8 primeiras avançam.'
            : 'Prévia com os terceiros colocados de cada grupo — a ordem muda conforme os placares são informados.')
      }),
      el('thead', null, [el('tr', null, [
        el('th', { scope: 'col', texto: '#' }),
        el('th', { scope: 'col', texto: 'Grupo' }),
        el('th.esquerda', { scope: 'col', texto: 'Seleção' }),
        el('th', { scope: 'col', texto: 'Pts' }),
        el('th', { scope: 'col', texto: 'SG' }),
        el('th', { scope: 'col', texto: 'GP' }),
        el('th', { scope: 'col', texto: 'Ranking FIFA' }),
        el('th', { scope: 'col', texto: 'Situação' })
      ])]),
      el('tbody', null, terceiros.map((t) => {
        const s = P.selecao(t.selecaoId);
        // Sem nenhum placar informado nada está decidido: nada de verde/vermelho.
        const classe = !houvePlacar ? '' : (t.classificado ? 'classificado' : 'eliminado');
        return el(`tr${classe ? `.linha--${classe}` : ''}`, null, [
          el('td', null, [el(`span.pos${classe ? `.pos--${classe}` : ''}`, { texto: t.ordem })]),
          el('td', { texto: t.grupo }),
          el('td.esquerda', null, [el('div.celula-selecao', null, [
            P.bandeira(t.selecaoId, 'p'),
            el('a', { href: `equipes.html?selecao=${t.selecaoId}`, texto: s.nome })
          ])]),
          el('td.num.destaque', { texto: t.pontos }),
          el('td.num', { texto: t.saldo > 0 ? `+${t.saldo}` : t.saldo }),
          el('td.num', { texto: t.golsPro }),
          el('td.num', { texto: s.rankingPosicao ? `${s.rankingPosicao}º` : '—' }),
          el('td', null, [!houvePlacar
            ? el('span.etiqueta', { texto: 'Indefinido' })
            : el(`span.etiqueta.etiqueta--${t.classificado ? 'verde' : 'vermelha'}`, {
              texto: t.classificado ? 'Avança' : 'Fora'
            })])
        ]);
      }))
    ]);
  }

  /* ----------------------------------------------------------------- Potes */

  function montarPotes() {
    document.querySelector('[data-descricao-potes]').textContent =
      'Pote 1 são os 12 cabeças de chave (fontes/copa2026_cabecas-chave.txt). As 36 seleções restantes '
      + 'foram distribuídas nos potes 2 a 4 pela ordem do ranking FIFA — as sete seleções ausentes '
      + 'da lista de ranking ficam no fim da ordem.';

    const alvo = document.querySelector('[data-potes]');
    P.limpar(alvo);
    [1, 2, 3, 4].forEach((pote) => {
      const doPote = P.dados.selecoes
        .filter((s) => s.pote === pote)
        .sort((a, b) => (a.rankingPosicao || 999) - (b.rankingPosicao || 999));

      alvo.appendChild(el('section.cartao', { 'aria-labelledby': `pote-${pote}` }, [
        el('h3', { id: `pote-${pote}`, texto: `Pote ${pote}` }),
        el('ul.ficha__dados', null, doPote.map((s) => el('li', null, [
          el('span.celula-selecao', null, [
            P.bandeira(s.id, 'p'),
            el('a', { href: `equipes.html?selecao=${s.id}`, texto: s.nome })
          ]),
          el('span.val', { texto: `${s.grupo}` })
        ])))
      ]));
    });
  }

  /* ---------------------------------------------------------------- Regras */

  function montarRegras() {
    const alvo = document.querySelector('[data-regras]');
    P.limpar(alvo);
    alvo.appendChild(el('div.cartao', null, [
      el('h3', { texto: 'RN-01 — Desempate na fase de grupos' }),
      el('ol', { style: 'margin:.4rem 0 0;padding-left:1.2rem;color:var(--texto-2);font-size:.9rem' }, [
        el('li', { texto: 'Pontos' }),
        el('li', { texto: 'Saldo de gols' }),
        el('li', { texto: 'Gols marcados' }),
        el('li', { texto: 'Resultado do confronto direto' }),
        el('li', { texto: 'Saldo de gols nos confrontos diretos' }),
        el('li', { texto: 'Fair play (cartões) — nenhuma fonte fornece cartões, critério neutro no protótipo' }),
        el('li', { texto: 'Ranking FIFA' })
      ])
    ]));
    alvo.appendChild(el('div.cartao', null, [
      el('h3', { texto: 'RN-02 / RN-03 — Avanço e mata-mata' }),
      el('ul', { style: 'margin:.4rem 0 0;padding-left:1.2rem;color:var(--texto-2);font-size:.9rem' }, [
        el('li', { texto: '1º e 2º de cada grupo avançam automaticamente (24 seleções).' }),
        el('li', { texto: 'Os 8 melhores entre os 12 terceiros colocados completam 32 times.' }),
        el('li', { texto: 'Empate no mata-mata: prorrogação de 2 × 15 min e, persistindo, pênaltis.' }),
        el('li', { texto: 'Não há gol de ouro nem gol de prata.' })
      ])
    ]));
  }

  /* ----------------------------------------------------------- Renderizacao */

  const alvoGrupos = document.querySelector('[data-grupos]');
  const alvoTerceiros = document.querySelector('[data-terceiros]');

  function renderizar() {
    montarOrigem();

    const resultados = resultadosAtuais();
    const classificacoes = C.classificarTodos(resultados);
    const terceiros = C.melhoresTerceiros(classificacoes);

    P.limpar(alvoGrupos);
    let algumCompleto = false;
    P.dados.grupos.forEach((g) => {
      const info = C.situacoes(g.letra, classificacoes[g.letra], resultados, terceiros);
      if (info.completo) algumCompleto = true;
      alvoGrupos.appendChild(cartaoGrupo(g.letra, classificacoes[g.letra], info));
    });

    P.limpar(alvoTerceiros);
    alvoTerceiros.appendChild(tabelaTerceiros(terceiros, algumCompleto, Object.keys(resultados).length > 0));
  }

  montarPotes();
  montarRegras();
  renderizar();
}());
