/**
 * Pagina Ranking (PRD secao 9): posicao, selecao e pontuacao.
 * Paginacao a cada 20 linhas (RNF-01).
 */
(function () {
  'use strict';

  const P = window.Portal;
  const el = P.el;

  P.iniciarLayout();

  const LIMITE = 20;
  const ranking = P.dados.rankingFifa;
  const naCopa = ranking.filter((r) => r.selecaoId).length;

  document.querySelector('[data-descricao]').textContent =
    `Ranking FIFA com ${ranking.length} seleções, conforme fontes/copa2026_ranking_fifa.txt. `
    + `${naCopa} delas disputam a ${P.dados.meta.torneio}.`;

  /* ------------------------------------------------------------- Resumo */

  const semRanking = P.dados.selecoes.filter((s) => !s.rankingPosicao);
  const melhor = P.dados.selecoes
    .filter((s) => s.rankingPosicao)
    .sort((a, b) => a.rankingPosicao - b.rankingPosicao)[0];

  const cards = [
    { valor: ranking.length, rotulo: 'Seleções no ranking' },
    { valor: naCopa, rotulo: 'Delas na Copa 2026' },
    { valor: semRanking.length, rotulo: 'Seleções da Copa fora da lista' },
    { valor: melhor ? melhor.nome : '—', rotulo: 'Melhor ranqueada da Copa' }
  ];
  const alvoResumo = document.querySelector('[data-resumo-ranking]');
  cards.forEach((c) => {
    alvoResumo.appendChild(el('div.cartao.estatistica', null, [
      el('span.estatistica__valor', { texto: c.valor, style: typeof c.valor === 'string' ? 'font-size:1.15rem' : null }),
      el('span.estatistica__rotulo', { texto: c.rotulo })
    ]));
  });

  /* ------------------------------------------------------------- Estado */

  const qs = P.parametros.ler();
  const estado = {
    busca: qs.get('busca') || '',
    escopo: qs.get('escopo') || 'todas',
    ordem: qs.get('ordem') || 'posicao',
    pagina: Math.max(1, Number(qs.get('pagina')) || 1)
  };

  const campoBusca = document.getElementById('f-busca');
  const selEscopo = document.getElementById('f-escopo');
  const selOrdem = document.getElementById('f-ordem');

  campoBusca.value = estado.busca;
  selEscopo.value = estado.escopo;
  selOrdem.value = estado.ordem;

  campoBusca.addEventListener('input', () => { estado.busca = campoBusca.value; estado.pagina = 1; renderizar(); });
  selEscopo.addEventListener('change', () => { estado.escopo = selEscopo.value; estado.pagina = 1; renderizar(); });
  selOrdem.addEventListener('change', () => { estado.ordem = selOrdem.value; estado.pagina = 1; renderizar(); });
  document.querySelector('[data-limpar]').addEventListener('click', (ev) => {
    ev.preventDefault();
    Object.assign(estado, { busca: '', escopo: 'todas', ordem: 'posicao', pagina: 1 });
    campoBusca.value = '';
    selEscopo.value = 'todas';
    selOrdem.value = 'posicao';
    renderizar();
  });

  /* --------------------------------------------------------- Renderizacao */

  const alvoTabela = document.querySelector('[data-tabela-ranking]');
  const resumo = document.querySelector('[data-resumo]');
  const paginacao = document.querySelector('[data-paginacao]');

  const ORDENADORES = {
    posicao: (a, b) => a.posicao - b.posicao,
    'pontos-desc': (a, b) => b.pontos - a.pontos,
    'pontos-asc': (a, b) => a.pontos - b.pontos,
    nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR')
  };

  function filtrar() {
    const termo = P.normalizar(estado.busca);
    return ranking
      .filter((r) => {
        if (estado.escopo === 'copa' && !r.selecaoId) return false;
        if (estado.escopo === 'fora' && r.selecaoId) return false;
        if (termo && !P.normalizar(r.nome).includes(termo)) return false;
        return true;
      })
      .sort(ORDENADORES[estado.ordem] || ORDENADORES.posicao);
  }

  function renderizar() {
    const lista = filtrar();
    const paginas = Math.max(1, Math.ceil(lista.length / LIMITE));
    estado.pagina = Math.min(estado.pagina, paginas);
    const visiveis = lista.slice((estado.pagina - 1) * LIMITE, estado.pagina * LIMITE);

    P.limpar(alvoTabela);
    if (!visiveis.length) {
      alvoTabela.appendChild(el('p.vazio', { texto: 'Nenhuma seleção encontrada.' }));
    } else {
      alvoTabela.appendChild(el('table.tabela', null, [
        el('caption', { texto: 'Posição, seleção e pontuação no ranking FIFA.' }),
        el('thead', null, [el('tr', null, [
          el('th', { scope: 'col', texto: 'Posição' }),
          el('th.esquerda', { scope: 'col', texto: 'Seleção' }),
          el('th', { scope: 'col', texto: 'Pontos' }),
          el('th', { scope: 'col', texto: 'Copa 2026' }),
          el('th', { scope: 'col', texto: 'Grupo' })
        ])]),
        el('tbody', null, visiveis.map((r) => {
          const s = r.selecaoId ? P.selecao(r.selecaoId) : null;
          return el(`tr${s ? '.linha--classificado' : ''}`, null, [
            el('td', null, [el(`span.pos${s ? '.pos--classificado' : ''}`, { texto: r.posicao })]),
            el('td.esquerda', null, [el('div.celula-selecao', null, [
              s ? P.bandeira(s.id, 'p') : el('span.bandeira.bandeira--p', { 'aria-hidden': 'true' }),
              s ? el('a', { href: `equipes.html?selecao=${s.id}`, texto: r.nome })
                : el('span', { texto: r.nome })
            ])]),
            el('td.num.destaque', { texto: r.pontos.toFixed(2) }),
            el('td', null, [s
              ? el('span.etiqueta.etiqueta--verde', { texto: 'Participa' })
              : el('span.etiqueta', { texto: '—' })]),
            el('td', { texto: s ? s.grupo : '—' })
          ]);
        }))
      ]));
    }

    if (semRanking.length && estado.escopo !== 'fora') {
      alvoTabela.appendChild(el('p.resumo-filtro', { style: 'margin:1rem 0 0' }, [
        `Seleções da Copa 2026 ausentes da lista de ranking: ${semRanking.map((s) => s.nome).join(', ')}.`
      ]));
    }

    resumo.textContent = `${P.pluralizar(lista.length, 'seleção listada', 'seleções listadas')}`
      + (paginas > 1 ? ` — página ${estado.pagina} de ${paginas}.` : '.');

    P.limpar(paginacao);
    if (paginas > 1) {
      const ir = (n) => { estado.pagina = n; renderizar(); document.getElementById('conteudo').scrollIntoView(); };
      paginacao.appendChild(el('button.botao.botao--pequeno', {
        type: 'button', texto: '← Anterior', disabled: estado.pagina === 1, onclick: () => ir(estado.pagina - 1)
      }));
      paginacao.appendChild(el('span.paginacao__info', { texto: `Página ${estado.pagina} de ${paginas}` }));
      paginacao.appendChild(el('button.botao.botao--pequeno', {
        type: 'button', texto: 'Próxima →', disabled: estado.pagina === paginas, onclick: () => ir(estado.pagina + 1)
      }));
    }

    P.parametros.gravar({
      busca: estado.busca,
      escopo: estado.escopo === 'todas' ? '' : estado.escopo,
      ordem: estado.ordem === 'posicao' ? '' : estado.ordem,
      pagina: estado.pagina > 1 ? estado.pagina : ''
    });
  }

  renderizar();
}());
