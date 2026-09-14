/**
 * Home (PRD secao 5 / RF-01):
 * hero, países-sede, contagem regressiva, números, atalhos, próximos jogos,
 * ranking FIFA e chamada para o simulador.
 */
(function () {
  'use strict';

  const P = window.Portal;
  const el = P.el;
  const meta = P.dados.meta;

  P.iniciarLayout();

  /* ------------------------------------------------------------ Hero */

  const logo = document.querySelector('[data-logo]');
  logo.src = meta.logoUrl;
  logo.addEventListener('error', function () { this.remove(); });

  document.querySelector('[data-lema]').textContent = meta.lema;
  document.querySelector('[data-subtitulo]').textContent =
    `A ${meta.torneio} acontece no Canadá, Estados Unidos e México, `
    + `com ${meta.estatisticas.selecoes} seleções, ${meta.estatisticas.jogos} jogos `
    + `e ${meta.estatisticas.cidades} cidades-sede.`;

  /** Códigos FIFA dos três países-sede, obtidos das próprias seleções. */
  const SEDES = [
    { nome: 'Canadá', selecaoId: 'canada' },
    { nome: 'Estados Unidos', selecaoId: 'estados-unidos' },
    { nome: 'México', selecaoId: 'mexico' }
  ];

  const sedes = document.querySelector('[data-sedes]');
  SEDES.forEach((s) => {
    const qtd = P.dados.cidades.filter((c) => c.pais === (s.nome === 'Estados Unidos' ? 'EUA' : s.nome)).length;
    sedes.appendChild(el('span.sede-chip', null, [
      P.bandeira(s.selecaoId),
      `${s.nome} · ${P.pluralizar(qtd, 'cidade', 'cidades')}`
    ]));
  });

  /* ------------------------------------------- Contagem regressiva (RF-01) */

  const alvoContagem = document.querySelector('[data-contagem]');
  const mensagemContagem = document.querySelector('[data-contagem-mensagem]');
  const primeiroJogo = P.dados.jogos[0];
  const ultimoJogo = P.dados.jogos[P.dados.jogos.length - 1];
  const inicio = P.comoData(meta.primeiroJogo);

  const UNIDADES = [
    { chave: 'dias', rotulo: 'Dias' },
    { chave: 'horas', rotulo: 'Horas' },
    { chave: 'minutos', rotulo: 'Minutos' },
    { chave: 'segundos', rotulo: 'Segundos' }
  ];

  const celulas = {};
  UNIDADES.forEach((u) => {
    const valor = el('span.contagem__valor', { texto: '--' });
    celulas[u.chave] = valor;
    alvoContagem.appendChild(el('div.contagem__item', null, [
      valor,
      el('span.contagem__rotulo', { texto: u.rotulo })
    ]));
  });

  function atualizarContagem() {
    const restante = inicio.getTime() - Date.now();

    if (restante <= 0) {
      alvoContagem.hidden = true;
      const fim = P.comoData(ultimoJogo.dataHora).getTime();
      // Sem o "quinta-feira," do formato extenso: aqui é um intervalo.
      const semDiaSemana = (iso) => P.dataExtensa(iso).replace(/^[^,]+,\s*/, '');
      mensagemContagem.textContent = Date.now() > fim
        ? `A ${meta.torneio} foi disputada de ${semDiaSemana(primeiroJogo.dataHora)} a `
          + `${semDiaSemana(ultimoJogo.dataHora)}. Use o simulador para refazer o torneio.`
        : `A ${meta.torneio} já começou! Acompanhe os jogos e simule os resultados.`;
      return;
    }

    const s = Math.floor(restante / 1000);
    celulas.dias.textContent = Math.floor(s / 86400);
    celulas.horas.textContent = String(Math.floor(s / 3600) % 24).padStart(2, '0');
    celulas.minutos.textContent = String(Math.floor(s / 60) % 60).padStart(2, '0');
    celulas.segundos.textContent = String(s % 60).padStart(2, '0');
    mensagemContagem.textContent =
      `Faltam para ${P.nomeSelecao(primeiroJogo.mandanteId)} × ${P.nomeSelecao(primeiroJogo.visitanteId)}, `
      + `em ${P.dataExtensa(primeiroJogo.dataHora)}, às ${P.hora(primeiroJogo.dataHora)} (${meta.fusoHorario}).`;
  }

  atualizarContagem();
  setInterval(atualizarContagem, 1000);

  /* ------------------------------------------------------------ Números */

  const estatisticas = [
    { valor: meta.estatisticas.selecoes, rotulo: 'Seleções' },
    { valor: meta.estatisticas.cidades, rotulo: 'Cidades-sede' },
    { valor: meta.estatisticas.jogos, rotulo: 'Jogos' },
    { valor: meta.estatisticas.grupos, rotulo: 'Grupos' }
  ];
  const alvoEstatisticas = document.querySelector('[data-estatisticas]');
  estatisticas.forEach((e) => {
    alvoEstatisticas.appendChild(el('div.cartao.estatistica', null, [
      el('span.estatistica__valor', { texto: e.valor }),
      el('span.estatistica__rotulo', { texto: e.rotulo })
    ]));
  });

  /* ------------------------------------------------------------ Atalhos */

  const atalhos = [
    { href: 'jogos.html', titulo: 'Tabela de jogos', texto: `Todos os ${meta.estatisticas.jogos} jogos, com filtros por fase, grupo, data, seleção e sede.` },
    { href: 'grupos.html', titulo: 'Grupos', texto: 'Classificação dos 12 grupos com os critérios de desempate da FIFA.' },
    { href: 'equipes.html?selecao=brasil', titulo: 'Brasil', texto: 'Elenco, técnico, ranking e jogos da Seleção Brasileira.' },
    { href: 'simulador.html', titulo: 'Bolão / Simulador', texto: 'Palpite os placares e monte o chaveamento até a final.' }
  ];
  const alvoAtalhos = document.querySelector('[data-atalhos]');
  atalhos.forEach((a) => {
    alvoAtalhos.appendChild(el('a.cartao.atalho', { href: a.href }, [
      el('span.atalho__titulo', { texto: a.titulo }),
      el('span.atalho__texto', { texto: a.texto })
    ]));
  });

  /* ------------------------------------------------------ Próximos jogos */

  const agora = Date.now();
  let proximos = P.dados.jogos.filter((j) => P.comoData(j.dataHora).getTime() >= agora).slice(0, 6);
  let tituloProximos = 'Próximos jogos';
  if (!proximos.length) {
    // Torneio já encerrado em relação à data atual: mostra a abertura.
    proximos = P.dados.jogos.slice(0, 6);
    tituloProximos = 'Jogos de abertura';
    document.getElementById('titulo-proximos').textContent = tituloProximos;
  }
  const alvoProximos = document.querySelector('[data-proximos-jogos]');
  proximos.forEach((j) => alvoProximos.appendChild(P.cartaoJogo(j)));

  /* --------------------------------------------------------- Países-sede */

  const alvoPaises = document.querySelector('[data-paises-sede]');
  const porPais = new Map();
  P.dados.cidades.forEach((c) => {
    if (!porPais.has(c.pais)) porPais.set(c.pais, []);
    porPais.get(c.pais).push(c);
  });
  [...porPais.entries()].forEach(([pais, lista]) => {
    alvoPaises.appendChild(el('div.cartao', null, [
      el('h3', { texto: `${pais} · ${P.pluralizar(lista.length, 'sede', 'sedes')}` }),
      el('ul.ficha__dados', null, lista
        .sort((a, b) => b.capacidade - a.capacidade)
        .map((c) => el('li', null, [
          el('span.rot', { texto: `${c.nome} — ${c.estadio}` }),
          el('span.val', { texto: `${c.capacidade.toLocaleString('pt-BR')}${c.capacidadeAproximada ? '*' : ''}` })
        ])))
    ]));
  });

  /* ---------------------------------------------------------- Ranking FIFA */

  const topo = P.dados.rankingFifa.slice(0, 10);
  const tabela = el('table.tabela', null, [
    el('caption', { texto: 'Top 10 do ranking FIFA. Seleções destacadas disputam a Copa 2026.' }),
    el('thead', null, [el('tr', null, [
      el('th', { texto: '#', scope: 'col' }),
      el('th.esquerda', { texto: 'Seleção', scope: 'col' }),
      el('th', { texto: 'Pontos', scope: 'col' })
    ])]),
    el('tbody', null, topo.map((r) => el('tr', null, [
      el('td', null, [el('span.pos', { texto: r.posicao })]),
      el('td.esquerda', null, [
        el('div.celula-selecao', null, [
          r.selecaoId ? P.bandeira(r.selecaoId, 'p') : el('span.bandeira.bandeira--p', { 'aria-hidden': 'true' }),
          r.selecaoId
            ? el('a', { href: `equipes.html?selecao=${r.selecaoId}`, texto: r.nome })
            : el('span', { texto: r.nome }),
          r.selecaoId ? el('span.etiqueta.etiqueta--verde', { texto: 'Copa 26' }) : null
        ])
      ]),
      el('td.num.destaque', { texto: r.pontos.toFixed(2) })
    ])))
  ]);
  document.querySelector('[data-ranking-topo]').appendChild(tabela);
}());
