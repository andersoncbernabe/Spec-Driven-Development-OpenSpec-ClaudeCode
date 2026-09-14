/**
 * Pagina Equipes (PRD secao 8 / RF-04).
 *
 * Lista as 48 selecoes com busca e filtros; ao selecionar uma, exibe bandeira,
 * nome, grupo, confederacao, tecnico, ranking FIFA, jogos e elenco completo
 * agrupado por posicao.
 *
 * Campos exigidos pelo PRD sem correspondencia nas fontes ("participações em
 * Copas" e numero da camisa) sao exibidos como nao disponiveis, em vez de
 * preenchidos com dados inventados.
 */
(function () {
  'use strict';

  const P = window.Portal;
  const el = P.el;

  P.iniciarLayout();

  const ORDEM_POSICOES = ['Goleiro', 'Defensor', 'Meio-campista', 'Atacante'];
  const PLURAL_POSICOES = {
    Goleiro: 'Goleiros',
    Defensor: 'Defensores',
    'Meio-campista': 'Meio-campistas',
    Atacante: 'Atacantes'
  };

  document.querySelector('[data-descricao]').textContent =
    `As ${P.dados.selecoes.length} seleções participantes. Selecione uma equipe para ver o elenco completo.`;

  /* ------------------------------------------------------------- Estado */

  const qs = P.parametros.ler();
  const estado = {
    busca: qs.get('busca') || '',
    grupo: qs.get('grupo') || '',
    confederacao: qs.get('confederacao') || '',
    selecao: qs.get('selecao') || '',
    posicao: ''
  };

  /* ----------------------------------------------------------- Controles */

  const campoBusca = document.getElementById('f-busca');
  const selGrupo = document.getElementById('f-grupo');
  const selConf = document.getElementById('f-confederacao');
  const selRapida = document.getElementById('f-selecao-rapida');

  function preencher(select, itens, vazio) {
    P.limpar(select);
    select.appendChild(el('option', { value: '', texto: vazio }));
    itens.forEach((i) => select.appendChild(el('option', { value: i.valor, texto: i.rotulo })));
  }

  preencher(selGrupo, P.dados.grupos.map((g) => ({ valor: g.letra, rotulo: `Grupo ${g.letra}` })), 'Todos os grupos');
  preencher(selConf, [...new Set(P.dados.selecoes.map((s) => s.confederacao))]
    .sort()
    .map((c) => ({ valor: c, rotulo: c })), 'Todas as confederações');

  // Dropdown "Ir para" agrupado por grupo (RF-04).
  P.limpar(selRapida);
  selRapida.appendChild(el('option', { value: '', texto: 'Escolher seleção…' }));
  P.dados.grupos.forEach((g) => {
    const grupo = el('optgroup', { label: `Grupo ${g.letra}` });
    g.selecoes.forEach((id) => grupo.appendChild(el('option', { value: id, texto: P.nomeSelecao(id) })));
    selRapida.appendChild(grupo);
  });

  campoBusca.value = estado.busca;
  selGrupo.value = estado.grupo;
  selConf.value = estado.confederacao;
  selRapida.value = estado.selecao;

  campoBusca.addEventListener('input', () => { estado.busca = campoBusca.value; renderizarLista(); });
  selGrupo.addEventListener('change', () => { estado.grupo = selGrupo.value; renderizarLista(); });
  selConf.addEventListener('change', () => { estado.confederacao = selConf.value; renderizarLista(); });
  selRapida.addEventListener('change', () => { if (selRapida.value) selecionar(selRapida.value, true); });

  document.querySelector('[data-limpar]').addEventListener('click', (ev) => {
    ev.preventDefault();
    estado.busca = '';
    estado.grupo = '';
    estado.confederacao = '';
    campoBusca.value = '';
    selGrupo.value = '';
    selConf.value = '';
    renderizarLista();
  });

  /* --------------------------------------------------------------- Lista */

  const alvoLista = document.querySelector('[data-lista-equipes]');
  const resumo = document.querySelector('[data-resumo]');

  function filtrar() {
    const termo = P.normalizar(estado.busca);
    return P.dados.selecoes.filter((s) => {
      if (estado.grupo && s.grupo !== estado.grupo) return false;
      if (estado.confederacao && s.confederacao !== estado.confederacao) return false;
      if (termo && !P.normalizar(s.nome).includes(termo)) return false;
      return true;
    }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function renderizarLista() {
    const lista = filtrar();
    P.limpar(alvoLista);

    resumo.textContent = lista.length
      ? `${P.pluralizar(lista.length, 'seleção encontrada', 'seleções encontradas')}.`
      : 'Nenhuma seleção encontrada com os filtros atuais.';

    if (!lista.length) {
      alvoLista.appendChild(el('p.vazio', { texto: 'Tente outro nome, grupo ou confederação.' }));
    }

    lista.forEach((s) => {
      const botao = el('button.equipe-item', {
        type: 'button',
        'aria-pressed': String(estado.selecao === s.id)
      }, [
        P.bandeira(s.id, 'g'),
        el('span', null, [
          el('span.equipe-item__nome', { texto: s.nome }),
          el('br'),
          el('span.equipe-item__meta', {
            texto: `Grupo ${s.grupo} · ${s.confederacao}`
              + (s.rankingPosicao ? ` · ${s.rankingPosicao}º FIFA` : '')
          })
        ])
      ]);
      botao.addEventListener('click', () => selecionar(s.id, true));
      alvoLista.appendChild(botao);
    });

    P.parametros.gravar({
      busca: estado.busca,
      grupo: estado.grupo,
      confederacao: estado.confederacao,
      selecao: estado.selecao
    });
  }

  /* ------------------------------------------------------------- Detalhe */

  const alvoDetalhe = document.querySelector('[data-detalhe]');
  const secaoDetalhe = document.querySelector('[data-detalhe-secao]');

  function fichaSelecao(s) {
    const jogadores = P.elenco(s.id);
    const jogos = P.jogosDaSelecao(s.id);
    const idades = jogadores.map((j) => j.idade).filter((n) => !Number.isNaN(n));
    const media = idades.length ? (idades.reduce((a, b) => a + b, 0) / idades.length) : null;

    return el('div.cartao.cartao--destaque', null, [
      el('div.ficha__cabecalho', null, [
        P.bandeira(s.id, 'gg'),
        el('div', null, [
          el('h3.ficha__nome', { texto: s.nome }),
          el('div', { style: 'display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.35rem' }, [
            el('span.etiqueta.etiqueta--azul', { texto: `Grupo ${s.grupo}` }),
            el('span.etiqueta', { texto: s.confederacao }),
            el('span.etiqueta', { texto: `Pote ${s.pote}` }),
            s.cabecaDeChave ? el('span.etiqueta.etiqueta--amarela', { texto: 'Cabeça de chave' }) : null
          ])
        ])
      ]),
      el('ul.ficha__dados', null, [
        el('li', null, [el('span.rot', { texto: 'Técnico' }), el('span.val', { texto: s.tecnico || '—' })]),
        el('li', null, [
          el('span.rot', { texto: 'Ranking FIFA' }),
          el('span.val', { texto: s.rankingPosicao ? `${s.rankingPosicao}º · ${s.rankingPontos.toFixed(2)} pts` : 'Fora da lista de ranking' })
        ]),
        el('li', null, [el('span.rot', { texto: 'Código FIFA' }), el('span.val', { texto: s.codigoFifa })]),
        el('li', null, [el('span.rot', { texto: 'Jogadores no elenco' }), el('span.val', { texto: jogadores.length })]),
        el('li', null, [
          el('span.rot', { texto: 'Idade média' }),
          el('span.val', { texto: media ? `${media.toFixed(1)} anos` : '—' })
        ]),
        el('li', null, [el('span.rot', { texto: 'Jogos na tabela' }), el('span.val', { texto: jogos.length })])
      ]),
      el('p', { style: 'margin-top:.9rem;display:flex;gap:.5rem;flex-wrap:wrap' }, [
        el('a.botao.botao--pequeno', { href: `jogos.html?selecao=${s.id}`, texto: 'Ver jogos' }),
        el('a.botao.botao--pequeno', { href: `grupos.html#grupo-${s.grupo}`, texto: `Grupo ${s.grupo}` })
      ])
    ]);
  }

  function tabelaElenco(s) {
    const jogadores = P.elenco(s.id);
    const posicoes = ORDEM_POSICOES.filter((p) => jogadores.some((j) => j.posicao === p));
    const visiveis = estado.posicao ? posicoes.filter((p) => p === estado.posicao) : posicoes;

    const abas = el('div.abas', { role: 'group', 'aria-label': 'Filtrar elenco por posição' }, [
      botaoPosicao('', 'Todas', jogadores.length)
    ].concat(posicoes.map((p) => botaoPosicao(p, PLURAL_POSICOES[p], jogadores.filter((j) => j.posicao === p).length))));

    const blocos = visiveis.map((pos) => {
      const doGrupo = jogadores
        .filter((j) => j.posicao === pos)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      return el('div.elenco-grupo', null, [
        el('h4.elenco-grupo__titulo', { texto: `${PLURAL_POSICOES[pos]} (${doGrupo.length})` }),
        el('div.tabela-wrap', null, [
          el('table.tabela', null, [
            el('caption', { texto: `${PLURAL_POSICOES[pos]} convocados por ${s.nome}` }),
            el('thead', null, [el('tr', null, [
              el('th.esquerda', { scope: 'col', texto: 'Jogador' }),
              el('th', { scope: 'col', texto: 'Posição' }),
              el('th', { scope: 'col', texto: 'Idade' }),
              el('th.esquerda', { scope: 'col', texto: 'Clube' }),
              el('th', { scope: 'col', texto: 'Gols', title: 'Gols marcados pela seleção' }),
              el('th', { scope: 'col', texto: 'Copas', title: 'Participações em Copas — não informado nas fontes' })
            ])]),
            el('tbody', null, doGrupo.map((j) => el('tr', null, [
              el('td.esquerda.destaque', { texto: j.nome }),
              el('td', { texto: j.posicao }),
              el('td.num', { texto: Number.isNaN(j.idade) ? '—' : j.idade }),
              el('td.esquerda', { texto: j.clube || '—' }),
              el('td.num', { texto: Number.isNaN(j.gols) ? '—' : j.gols }),
              el('td', { texto: '—' })
            ])))
          ])
        ])
      ]);
    });

    return el('div', null, [
      el('h3', { texto: `Elenco — ${jogadores.length} jogadores` }),
      abas,
      el('p.resumo-filtro', {
        texto: 'Idade, posição e gols vêm de copa2026_selecoes_jogadores.txt; o clube vem de '
          + 'selecoes_jogadores_convocados.txt. Número da camisa, capitão e participações em Copas '
          + 'não constam em nenhuma fonte e aparecem como "—".'
      })
    ].concat(blocos));
  }

  function botaoPosicao(valor, rotulo, quantidade) {
    const b = el('button.aba', {
      type: 'button',
      texto: `${rotulo} (${quantidade})`,
      'aria-pressed': String(estado.posicao === valor)
    });
    b.addEventListener('click', () => {
      estado.posicao = valor;
      renderizarDetalhe();
    });
    return b;
  }

  function renderizarDetalhe() {
    P.limpar(alvoDetalhe);
    if (!estado.selecao) {
      alvoDetalhe.appendChild(el('p.vazio', {
        texto: 'Selecione uma equipe acima para ver bandeira, grupo, técnico, ranking e elenco.'
      }));
      return;
    }
    const s = P.selecao(estado.selecao);
    if (!s) { estado.selecao = ''; renderizarDetalhe(); return; }

    document.getElementById('titulo-detalhe').textContent = `Detalhe da seleção: ${s.nome}`;
    alvoDetalhe.appendChild(el('div.ficha', null, [fichaSelecao(s), tabelaElenco(s)]));
  }

  function selecionar(id, rolar) {
    estado.selecao = id;
    estado.posicao = '';
    selRapida.value = id;
    renderizarLista();
    renderizarDetalhe();
    if (rolar) {
      secaoDetalhe.scrollIntoView({ behavior: 'smooth', block: 'start' });
      secaoDetalhe.focus({ preventScroll: true });
    }
  }

  renderizarLista();
  renderizarDetalhe();
}());
