/**
 * Pagina Simulador / Bolao (PRD secao 10 / RF-06).
 *
 * Etapas:
 *  1. Fase de grupos - placares dos 72 jogos, classificacao recalculada (RN-01)
 *     e selecao dos 8 melhores terceiros (RN-02).
 *  2. Mata-mata      - placares por fase, com prorrogacao/penaltis (RN-03).
 *  3. Chaveamento    - visao da Segunda Fase ate a final, com avanco automatico.
 *  4. Comparacao     - multiplos boloes lado a lado.
 *
 * Regra de recalculo: cada digito alterado grava o placar no bolao ativo e
 * atualiza apenas as areas afetadas, mantendo a resposta bem abaixo dos 500ms
 * exigidos pelo RF-06.
 */
(function () {
  'use strict';

  const P = window.Portal;
  const C = window.Classificacao;
  const M = window.MataMata;
  const B = window.Boloes;
  const el = P.el;

  P.iniciarLayout();

  const ETAPAS = [
    { chave: 'grupos', rotulo: '1. Fase de grupos' },
    { chave: 'mata-mata', rotulo: '2. Mata-mata' },
    { chave: 'chaveamento', rotulo: '3. Chaveamento' },
    { chave: 'comparacao', rotulo: '4. Comparar bolões' }
  ];

  const FASES_MATA = [
    { chave: 'segunda-fase', rotulo: 'Segunda Fase' },
    { chave: 'oitavas', rotulo: 'Oitavas' },
    { chave: 'quartas', rotulo: 'Quartas' },
    { chave: 'semifinal', rotulo: 'Semifinais' },
    { chave: 'terceiro-lugar', rotulo: '3º Lugar' },
    { chave: 'final', rotulo: 'Final' }
  ];

  const qs = P.parametros.ler();
  const estado = {
    etapa: ETAPAS.some((e) => e.chave === qs.get('etapa')) ? qs.get('etapa') : 'grupos',
    grupo: qs.get('grupo') || 'A',
    faseMata: qs.get('faseMata') || 'segunda-fase',
    exibicao: '',
    caminho: '',
    referencia: ''
  };

  let bolao = B.ativo(true);

  /* ------------------------------------------------------- Persistencia */

  const alvoPersistencia = document.querySelector('[data-persistencia]');
  const temArmazenamento = P.armazenamento.gravar('portalcopa26.teste', 1);
  P.armazenamento.remover('portalcopa26.teste');
  alvoPersistencia.textContent = temArmazenamento
    ? 'Os bolões ficam salvos neste navegador (localStorage). Na evolução para Blazor a mesma '
      + 'estrutura passa a ser persistida no SQLite (copa2026.db).'
    : 'Atenção: o armazenamento local do navegador está indisponível — os palpites valem apenas '
      + 'enquanto esta página estiver aberta.';

  /* ---------------------------------------------------------- Utilidades */

  function resultados() { return bolao.resultados || {}; }

  function gravarResultado(jogoId, placar) {
    bolao = B.definirResultado(bolao.id, jogoId, placar) || bolao;
  }

  function lerNumero(input) {
    const bruto = input.value.trim();
    if (bruto === '') return null;
    const n = Math.max(0, Math.min(99, Math.floor(Number(bruto))));
    return Number.isNaN(n) ? null : n;
  }

  function entradaPlacar(rotulo, valor, aoMudar, marcador) {
    const input = el('input.placar-entrada', {
      type: 'number',
      min: '0',
      max: '99',
      step: '1',
      inputmode: 'numeric',
      'aria-label': rotulo,
      dataset: marcador || {},
      value: valor === null || valor === undefined ? '' : valor
    });
    if (input.value !== '') input.classList.add('placar-entrada--preenchido');
    input.addEventListener('input', () => {
      input.classList.toggle('placar-entrada--preenchido', input.value.trim() !== '');
      aoMudar(lerNumero(input));
    });
    return input;
  }

  /**
   * Redesenhos disparados por digitacao destroem o input focado. Guardamos o
   * marcador (jogo + campo) antes e devolvemos o foco depois.
   */
  function preservandoFoco(redesenhar) {
    const ativo = document.activeElement;
    const marca = ativo && ativo.classList && ativo.classList.contains('placar-entrada')
      ? { jogo: ativo.dataset.jogo, campo: ativo.dataset.campo, fim: ativo.value.length }
      : null;

    redesenhar();

    if (!marca || !marca.jogo) return;
    const novo = document.querySelector(
      `.placar-entrada[data-jogo="${marca.jogo}"][data-campo="${marca.campo}"]`
    );
    if (!novo) return;
    novo.focus({ preventScroll: true });
    try { novo.setSelectionRange(marca.fim, marca.fim); } catch (e) { /* number input */ }
  }

  /* ------------------------------------------------- Gestao de boloes */

  const selBolao = document.getElementById('f-bolao');
  const campoNome = document.getElementById('f-nome-bolao');
  const statusBolao = document.querySelector('[data-status-bolao]');

  function montarSeletorBoloes() {
    P.limpar(selBolao);
    B.listar().forEach((b) => selBolao.appendChild(el('option', { value: b.id, texto: b.nome })));
    selBolao.value = bolao.id;
    campoNome.value = bolao.nome;

    const r = B.resumo(bolao);
    statusBolao.textContent = `“${bolao.nome}” — ${r.preenchidos} de ${r.total} jogos com placar `
      + `(${r.percentual}%). Fase de grupos: ${r.gruposPreenchidos}/${r.gruposTotal}`
      + `${r.gruposCompleto ? ' — completa.' : '.'}`;
  }

  selBolao.addEventListener('change', () => {
    bolao = B.obter(selBolao.value) || bolao;
    B.definirAtivo(bolao.id);
    renderizarTudo();
  });

  const ACOES = {
    renomear() {
      bolao = B.renomear(bolao.id, campoNome.value) || bolao;
      renderizarTudo();
    },
    novo() {
      bolao = B.criar(`Bolão ${B.listar().length + 1}`);
      renderizarTudo();
    },
    duplicar() {
      bolao = B.duplicar(bolao.id) || bolao;
      renderizarTudo();
    },
    limpar() {
      if (!window.confirm(`Apagar todos os placares de “${bolao.nome}”?`)) return;
      bolao = B.limparResultados(bolao.id) || bolao;
      renderizarTudo();
    },
    excluir() {
      if (!window.confirm(`Excluir o bolão “${bolao.nome}”?`)) return;
      B.remover(bolao.id);
      bolao = B.ativo(true);
      renderizarTudo();
    },
    sortear() {
      // Preenche apenas os jogos ainda sem placar, para explorar o chaveamento.
      const novos = Object.assign({}, resultados());
      P.dados.jogos.forEach((j) => {
        if (novos[j.id]) return;
        const gm = Math.floor(Math.random() * 4);
        const gv = Math.floor(Math.random() * 4);
        const placar = { golsMandante: gm, golsVisitante: gv };
        if (j.fase !== 'grupos' && gm === gv) {
          const pm = 3 + Math.floor(Math.random() * 3);
          let pv = 3 + Math.floor(Math.random() * 3);
          if (pv === pm) pv = pm === 5 ? 4 : pm + 1;
          placar.penaltisMandante = pm;
          placar.penaltisVisitante = pv;
        }
        novos[j.id] = placar;
      });
      bolao = B.atualizar(bolao.id, { resultados: novos }) || bolao;
      renderizarTudo();
    }
  };

  document.querySelectorAll('[data-acao]').forEach((botao) => {
    botao.addEventListener('click', () => ACOES[botao.dataset.acao]());
  });

  /* ---------------------------------------------------------- Etapas */

  const abasEtapa = document.querySelector('[data-abas-etapa]');
  const secoes = {};
  ETAPAS.forEach((e) => { secoes[e.chave] = document.querySelector(`[data-etapa="${e.chave}"]`); });

  const botoesEtapa = ETAPAS.map((e) => {
    const b = el('button.aba', { type: 'button', texto: e.rotulo, 'aria-pressed': String(estado.etapa === e.chave) });
    b.addEventListener('click', () => {
      estado.etapa = e.chave;
      aplicarEtapa();
      renderizarTudo();
    });
    abasEtapa.appendChild(b);
    return { chave: e.chave, botao: b };
  });

  function aplicarEtapa() {
    botoesEtapa.forEach((b) => b.botao.setAttribute('aria-pressed', String(b.chave === estado.etapa)));
    ETAPAS.forEach((e) => { secoes[e.chave].hidden = e.chave !== estado.etapa; });
  }

  /* ------------------------------------------------- Etapa: fase de grupos */

  const selGrupoSim = document.getElementById('f-grupo-sim');
  const selPendentes = document.getElementById('f-pendentes');
  const alvoJogosGrupos = document.querySelector('[data-jogos-grupos]');
  const alvoTabelasGrupos = document.querySelector('[data-tabelas-grupos]');
  const alvoTerceirosSim = document.querySelector('[data-terceiros-sim]');

  P.limpar(selGrupoSim);
  selGrupoSim.appendChild(el('option', { value: '', texto: 'Todos os grupos' }));
  P.dados.grupos.forEach((g) => selGrupoSim.appendChild(el('option', { value: g.letra, texto: `Grupo ${g.letra}` })));
  selGrupoSim.value = estado.grupo;
  selPendentes.value = estado.exibicao;

  selGrupoSim.addEventListener('change', () => { estado.grupo = selGrupoSim.value; renderizarGrupos(); });
  selPendentes.addEventListener('change', () => { estado.exibicao = selPendentes.value; renderizarGrupos(); });

  function placarEditavel(jogo, aoAtualizar) {
    const r = resultados()[jogo.id] || {};
    const caixa = el('div.placar-caixa');

    const atualizar = (campo) => (valor) => {
      const atual = Object.assign({}, resultados()[jogo.id]);
      atual[campo] = valor;
      const vazio = (atual.golsMandante === null || atual.golsMandante === undefined)
        && (atual.golsVisitante === null || atual.golsVisitante === undefined);
      gravarResultado(jogo.id, vazio ? null : atual);
      aoAtualizar();
    };

    caixa.appendChild(entradaPlacar(
      `Gols de ${P.nomeSelecao(jogo.mandanteId) || 'mandante'} — jogo ${jogo.numero}`,
      r.golsMandante, atualizar('golsMandante'),
      { jogo: jogo.id, campo: 'golsMandante' }
    ));
    caixa.appendChild(el('span', { texto: '×' }));
    caixa.appendChild(entradaPlacar(
      `Gols de ${P.nomeSelecao(jogo.visitanteId) || 'visitante'} — jogo ${jogo.numero}`,
      r.golsVisitante, atualizar('golsVisitante'),
      { jogo: jogo.id, campo: 'golsVisitante' }
    ));
    return caixa;
  }

  function renderizarGrupos() {
    const res = resultados();
    const letras = estado.grupo ? [estado.grupo] : P.dados.grupos.map((g) => g.letra);

    // --- jogos ---
    let jogos = P.dados.jogos.filter((j) => j.fase === 'grupos' && letras.includes(j.grupo));
    if (estado.exibicao === 'pendentes') jogos = jogos.filter((j) => !C.temPlacar(res[j.id]));
    if (estado.exibicao === 'preenchidos') jogos = jogos.filter((j) => C.temPlacar(res[j.id]));

    P.limpar(alvoJogosGrupos);
    if (!jogos.length) {
      alvoJogosGrupos.appendChild(el('p.vazio', { texto: 'Nenhum jogo para os filtros selecionados.' }));
    } else {
      const porDia = new Map();
      jogos.forEach((j) => {
        if (!porDia.has(j.dataListagem)) porDia.set(j.dataListagem, []);
        porDia.get(j.dataListagem).push(j);
      });
      [...porDia.keys()].sort().forEach((dia) => {
        alvoJogosGrupos.appendChild(el('section.dia-bloco', null, [
          el('h4.dia-bloco__titulo', { texto: P.dataExtensa(dia) }),
          el('div.grade', null, porDia.get(dia).map((j) => P.cartaoJogo(j, {
            resultado: res[j.id],
            placarCustomizado: placarEditavel(j, atualizarGrupos)
          })))
        ]));
      });
    }

    atualizarGrupos();
    P.parametros.gravar({ etapa: estado.etapa, grupo: estado.grupo, faseMata: estado.faseMata });
  }

  /** Recalcula somente tabelas e terceiros (chamado a cada digitacao). */
  function atualizarGrupos() {
    const res = resultados();
    const letras = estado.grupo ? [estado.grupo] : P.dados.grupos.map((g) => g.letra);
    const classificacoes = C.classificarTodos(res);
    const terceiros = C.melhoresTerceiros(classificacoes);

    P.limpar(alvoTabelasGrupos);
    letras.forEach((letra) => {
      const info = C.situacoes(letra, classificacoes[letra], res, terceiros);
      alvoTabelasGrupos.appendChild(tabelaGrupoCompacta(letra, classificacoes[letra], info));
    });

    P.limpar(alvoTerceirosSim);
    alvoTerceirosSim.appendChild(tabelaTerceiros(terceiros));

    montarSeletorBoloes();
  }

  function tabelaGrupoCompacta(letra, classificacao, info) {
    const CLASSE = {
      classificado: 'classificado',
      'classificado-terceiro': 'classificado',
      terceiro: 'terceiro',
      eliminado: 'eliminado'
    };
    return el('section.cartao.grupo-cartao', { style: 'margin-bottom:1rem' }, [
      el('div.grupo-cartao__topo', null, [
        el('span.grupo-cartao__letra', { texto: letra, 'aria-hidden': 'true' }),
        el('div', null, [
          el('h4.grupo-cartao__titulo', { texto: `Grupo ${letra}` }),
          el('span.equipe-item__meta', { texto: `${info.disputados}/${info.totalJogos} jogos com placar` })
        ])
      ]),
      el('div.tabela-wrap', null, [
        el('table.tabela', null, [
          el('caption', { texto: `Classificação simulada do Grupo ${letra}` }),
          el('thead', null, [el('tr', null, [
            el('th', { scope: 'col', texto: '#' }),
            el('th.esquerda', { scope: 'col', texto: 'Seleção' }),
            el('th', { scope: 'col', texto: 'P', title: 'Jogos' }),
            el('th', { scope: 'col', texto: 'V' }),
            el('th', { scope: 'col', texto: 'E' }),
            el('th', { scope: 'col', texto: 'D' }),
            el('th', { scope: 'col', texto: 'GP' }),
            el('th', { scope: 'col', texto: 'GC' }),
            el('th', { scope: 'col', texto: 'SG' }),
            el('th', { scope: 'col', texto: 'Pts' })
          ])]),
          el('tbody', null, classificacao.map((linha) => {
            const classe = CLASSE[info.situacoes[linha.selecaoId]] || '';
            return el(`tr${classe ? `.linha--${classe}` : ''}`, null, [
              el('td', null, [el(`span.pos${classe ? `.pos--${classe}` : ''}`, { texto: linha.posicao })]),
              el('td.esquerda', null, [el('div.celula-selecao', null, [
                P.bandeira(linha.selecaoId, 'p'),
                el('span', { texto: P.nomeSelecao(linha.selecaoId) })
              ])]),
              el('td.num', { texto: linha.jogos }),
              el('td.num', { texto: linha.vitorias }),
              el('td.num', { texto: linha.empates }),
              el('td.num', { texto: linha.derrotas }),
              el('td.num', { texto: linha.golsPro }),
              el('td.num', { texto: linha.golsContra }),
              el('td.num', { texto: linha.saldo > 0 ? `+${linha.saldo}` : linha.saldo }),
              el('td.num.destaque', { texto: linha.pontos })
            ]);
          }))
        ])
      ])
    ]);
  }

  function tabelaTerceiros(terceiros) {
    return el('table.tabela', null, [
      el('caption', { texto: 'Ordenação dos 12 terceiros colocados — as 8 primeiras avançam.' }),
      el('thead', null, [el('tr', null, [
        el('th', { scope: 'col', texto: '#' }),
        el('th', { scope: 'col', texto: 'Grupo' }),
        el('th.esquerda', { scope: 'col', texto: 'Seleção' }),
        el('th', { scope: 'col', texto: 'Pts' }),
        el('th', { scope: 'col', texto: 'SG' }),
        el('th', { scope: 'col', texto: 'GP' }),
        el('th', { scope: 'col', texto: 'Situação' })
      ])]),
      el('tbody', null, terceiros.map((t) => el(`tr.linha--${t.classificado ? 'classificado' : 'eliminado'}`, null, [
        el('td', null, [el(`span.pos.pos--${t.classificado ? 'classificado' : 'eliminado'}`, { texto: t.ordem })]),
        el('td', { texto: t.grupo }),
        el('td.esquerda', null, [el('div.celula-selecao', null, [
          P.bandeira(t.selecaoId, 'p'),
          el('span', { texto: P.nomeSelecao(t.selecaoId) })
        ])]),
        el('td.num.destaque', { texto: t.pontos }),
        el('td.num', { texto: t.saldo > 0 ? `+${t.saldo}` : t.saldo }),
        el('td.num', { texto: t.golsPro }),
        el('td', null, [el(`span.etiqueta.etiqueta--${t.classificado ? 'verde' : 'vermelha'}`, {
          texto: t.classificado ? 'Avança' : 'Fora'
        })])
      ])))
    ]);
  }

  /* ------------------------------------------------- Etapa: mata-mata */

  const abasFaseMata = document.querySelector('[data-abas-fase-mata]');
  const alvoJogosMata = document.querySelector('[data-jogos-mata]');
  const avisoMata = document.querySelector('[data-aviso-mata]');

  const botoesFaseMata = FASES_MATA.map((f) => {
    const b = el('button.aba', { type: 'button', texto: f.rotulo, 'aria-pressed': String(estado.faseMata === f.chave) });
    b.addEventListener('click', () => {
      estado.faseMata = f.chave;
      renderizarMataMata();
    });
    abasFaseMata.appendChild(b);
    return { chave: f.chave, botao: b };
  });

  P.limpar(avisoMata);
  avisoMata.appendChild(el('div', null, [
    el('strong', { texto: 'Como o chaveamento é montado: ' }),
    'os 16 confrontos da Segunda Fase já vêm definidos em copa2026_Jogos_Segunda_fase.txt. '
    + 'Das oitavas em diante cada vaga é "Venc. Segundafase N", "Venc. Oitavas N" e assim por diante, '
    + 'preenchida automaticamente conforme você informa os placares. '
    + 'RN-03: empate no tempo normal leva à prorrogação (2 × 15 min) e, persistindo, aos pênaltis — '
    + 'informe o placar dos pênaltis para definir quem avança.'
  ]));

  function renderizarMataMata() {
    botoesFaseMata.forEach((b) => b.botao.setAttribute('aria-pressed', String(b.chave === estado.faseMata)));

    const chaves = M.resolver(resultados());
    const jogos = M.jogosDaFase(estado.faseMata);

    P.limpar(alvoJogosMata);
    alvoJogosMata.appendChild(el('div.grade.grade--2', null, jogos.map((j) => {
      const c = chaves.get(j.chaveId);
      return P.cartaoJogo(j, {
        resultado: resultados()[j.id],
        mandanteId: c ? c.mandanteId : null,
        visitanteId: c ? c.visitanteId : null,
        placarCustomizado: placarEditavel(j, () => {
          preservandoFoco(renderizarMataMata);
          montarSeletorBoloes();
        }),
        extra: extraMataMata(j, c)
      });
    })));

    P.parametros.gravar({ etapa: estado.etapa, grupo: estado.grupo, faseMata: estado.faseMata });
  }

  /** Linha de penaltis, exibida quando o placar do mata-mata esta empatado. */
  function extraMataMata(jogo, chave) {
    const r = resultados()[jogo.id] || {};
    if (!M.precisaPenaltis(jogo, r)) {
      if (!chave || !chave.mandanteId || !chave.visitanteId) {
        return el('p.penaltis', { texto: 'Aguardando a definição dos classificados da fase anterior.' });
      }
      return null;
    }

    const atualizar = (campo) => (valor) => {
      const atual = Object.assign({}, resultados()[jogo.id]);
      atual[campo] = valor;
      gravarResultado(jogo.id, atual);
      preservandoFoco(renderizarMataMata);
      montarSeletorBoloes();
    };

    const definido = M.temPenaltis(r);
    return el('div.penaltis', null, [
      el('span', { texto: 'Prorrogação sem vencedor → pênaltis:' }),
      entradaPlacar(`Pênaltis de ${P.nomeSelecao(chave && chave.mandanteId) || 'mandante'}`,
        r.penaltisMandante, atualizar('penaltisMandante'),
        { jogo: jogo.id, campo: 'penaltisMandante' }),
      el('span', { texto: '×' }),
      entradaPlacar(`Pênaltis de ${P.nomeSelecao(chave && chave.visitanteId) || 'visitante'}`,
        r.penaltisVisitante, atualizar('penaltisVisitante'),
        { jogo: jogo.id, campo: 'penaltisVisitante' }),
      definido
        ? el('span.etiqueta.etiqueta--verde', { texto: `Avança: ${P.nomeSelecao(chave.vencedorId)}` })
        : el('span.penaltis__aviso', { texto: 'Informe placares diferentes nos pênaltis.' })
    ]);
  }

  /* ------------------------------------------------ Etapa: chaveamento */

  const alvoChave = document.querySelector('[data-chaveamento]');
  const alvoPodio = document.querySelector('[data-podio]');
  const alvoCaminho = document.querySelector('[data-caminho]');
  const selCaminho = document.getElementById('f-caminho');

  P.limpar(selCaminho);
  selCaminho.appendChild(el('option', { value: '', texto: 'Escolher seleção…' }));
  P.dados.selecoes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .forEach((s) => selCaminho.appendChild(el('option', { value: s.id, texto: s.nome })));
  selCaminho.addEventListener('change', () => {
    estado.caminho = selCaminho.value;
    renderizarCaminho(M.resolver(resultados()));
  });

  function chaveJogoCartao(chave) {
    const j = chave.jogo;
    const r = chave.resultado || {};
    const linha = (selecaoId, rotuloVaga, gols, penaltis) => {
      const vencedor = chave.vencedorId && chave.vencedorId === selecaoId;
      return el(`div.chave-jogo__lado${vencedor ? '.chave-jogo__lado--vencedor' : ''}`, null, [
        selecaoId ? P.bandeira(selecaoId, 'p') : el('span.bandeira.bandeira--p', { 'aria-hidden': 'true' }),
        el('span', { texto: selecaoId ? P.nomeSelecao(selecaoId) : (rotuloVaga || 'A definir') }),
        el('span.chave-jogo__gols', {
          texto: gols === null || gols === undefined ? '–'
            : `${gols}${penaltis !== null && penaltis !== undefined ? ` (${penaltis})` : ''}`
        })
      ]);
    };
    const mostrarPenaltis = M.temPenaltis(r);
    return el('article.chave-jogo', null, [
      el('div.chave-jogo__meta', { texto: `${j.faseNome} · ${P.dataCurta(j.dataHora)}` }),
      linha(chave.mandanteId, j.vagaMandante && j.vagaMandante.rotulo, r.golsMandante,
        mostrarPenaltis ? r.penaltisMandante : null),
      linha(chave.visitanteId, j.vagaVisitante && j.vagaVisitante.rotulo, r.golsVisitante,
        mostrarPenaltis ? r.penaltisVisitante : null),
      chave.pendentePenaltis
        ? el('div.penaltis__aviso', { style: 'font-size:.7rem;text-align:center', texto: 'Empate — faltam os pênaltis' })
        : null
    ]);
  }

  function renderizarChaveamento() {
    const chaves = M.resolver(resultados());

    P.limpar(alvoChave);
    FASES_MATA.filter((f) => f.chave !== 'terceiro-lugar').forEach((f) => {
      alvoChave.appendChild(el('div.chave__coluna', null, [
        el('h4.chave__titulo', { texto: f.rotulo })
      ].concat(M.jogosDaFase(f.chave)
        .map((j) => chaves.get(j.chaveId))
        .filter(Boolean)
        .map(chaveJogoCartao))));
    });

    const terceiroLugar = M.jogosDaFase('terceiro-lugar')
      .map((j) => chaves.get(j.chaveId))
      .filter(Boolean);
    if (terceiroLugar.length) {
      alvoChave.appendChild(el('div.chave__coluna.chave__coluna--rodape', null, [
        el('h4.chave__titulo', { texto: '3º Lugar' })
      ].concat(terceiroLugar.map(chaveJogoCartao))));
    }

    const p = M.podio(chaves);
    P.limpar(alvoPodio);
    if (p.campeaoId) {
      alvoPodio.appendChild(el('div.campeao', null, [
        el('div.campeao__rotulo', { texto: 'Campeão simulado' }),
        el('div', { style: 'display:flex;justify-content:center;align-items:center;gap:.7rem;margin-top:.5rem' }, [
          P.bandeira(p.campeaoId, 'g'),
          el('span.campeao__nome', { texto: P.nomeSelecao(p.campeaoId) })
        ]),
        el('p', { style: 'margin:.6rem 0 0;color:var(--texto-2);font-size:.88rem' }, [
          `Vice: ${P.nomeSelecao(p.viceId) || '—'}`
          + (p.terceiroId ? ` · 3º: ${P.nomeSelecao(p.terceiroId)}` : '')
          + (p.quartoId ? ` · 4º: ${P.nomeSelecao(p.quartoId)}` : '')
        ])
      ]));
    } else {
      alvoPodio.appendChild(el('p.aviso', {
        texto: 'Informe os placares do mata-mata para conhecer o campeão. Use “Sortear placares” '
          + 'para preencher os jogos pendentes de uma vez.'
      }));
    }

    renderizarCaminho(chaves);
  }

  function renderizarCaminho(chaves) {
    P.limpar(alvoCaminho);
    selCaminho.value = estado.caminho;
    if (!estado.caminho) {
      alvoCaminho.appendChild(el('p.vazio', { texto: 'Escolha uma seleção para ver o caminho dela no mata-mata.' }));
      return;
    }
    const passos = M.caminho(chaves, estado.caminho);
    if (!passos.length) {
      alvoCaminho.appendChild(el('p.vazio', {
        texto: `${P.nomeSelecao(estado.caminho)} ainda não aparece no chaveamento com os placares informados.`
      }));
      return;
    }
    alvoCaminho.appendChild(el('div.grade.grade--3', null, passos.map((c) => {
      const adversarioId = c.mandanteId === estado.caminho ? c.visitanteId : c.mandanteId;
      const avancou = c.vencedorId === estado.caminho;
      return el('div.cartao', null, [
        el('div.jogo__meta', null, [
          el('span.etiqueta', { texto: c.jogo.faseNome }),
          c.decidido
            ? el(`span.etiqueta.etiqueta--${avancou ? 'verde' : 'vermelha'}`, { texto: avancou ? 'Avançou' : 'Eliminada' })
            : el('span.etiqueta.etiqueta--amarela', { texto: 'Pendente' })
        ]),
        el('div', { style: 'display:flex;align-items:center;gap:.5rem;margin-top:.5rem' }, [
          adversarioId ? P.bandeira(adversarioId, 'p') : null,
          el('strong', { texto: `vs ${P.nomeSelecao(adversarioId) || 'a definir'}` })
        ]),
        el('p', { style: 'margin:.4rem 0 0;color:var(--texto-3);font-size:.82rem' }, [
          `${P.dataCurta(c.jogo.dataHora)} · ${P.hora(c.jogo.dataHora)} · ${(P.cidade(c.jogo.cidadeId) || {}).nome || ''}`
        ])
      ]);
    })));
  }

  /* ------------------------------------------------ Etapa: comparacao */

  const alvoCartoesBoloes = document.querySelector('[data-cartoes-boloes]');
  const alvoTabelaComparacao = document.querySelector('[data-tabela-comparacao]');
  const selReferencia = document.getElementById('f-referencia');

  selReferencia.addEventListener('change', () => {
    estado.referencia = selReferencia.value;
    renderizarComparacao();
  });

  function renderizarComparacao() {
    const lista = B.listar();

    document.querySelector('[data-descricao-comparacao]').textContent =
      'O seed não traz resultados oficiais — nenhuma fonte fornece placares. Por isso o percentual '
      + 'de acertos é calculado contra outro bolão escolhido como referência; quando os resultados '
      + 'reais existirem, basta trocar a referência por eles.';

    P.limpar(selReferencia);
    selReferencia.appendChild(el('option', { value: '', texto: 'Nenhuma referência' }));
    lista.filter((b) => b.id !== bolao.id).forEach((b) => {
      selReferencia.appendChild(el('option', { value: b.id, texto: b.nome }));
    });
    selReferencia.value = estado.referencia;

    P.limpar(alvoCartoesBoloes);
    lista.forEach((b) => {
      const r = B.resumo(b);
      const chaves = M.resolver(b.resultados);
      const p = M.podio(chaves);
      alvoCartoesBoloes.appendChild(el(`div.cartao${b.id === bolao.id ? '.cartao--destaque' : ''}`, null, [
        el('h3', null, [b.nome, b.id === bolao.id ? el('span.etiqueta.etiqueta--verde', { texto: 'Ativo', style: 'margin-left:.4rem' }) : null]),
        el('ul.ficha__dados', null, [
          el('li', null, [el('span.rot', { texto: 'Jogos com placar' }), el('span.val', { texto: `${r.preenchidos}/${r.total} (${r.percentual}%)` })]),
          el('li', null, [el('span.rot', { texto: 'Fase de grupos' }), el('span.val', { texto: `${r.gruposPreenchidos}/${r.gruposTotal}` })]),
          el('li', null, [el('span.rot', { texto: 'Campeão' }), el('span.val', { texto: P.nomeSelecao(p.campeaoId) || '—' })]),
          el('li', null, [el('span.rot', { texto: 'Vice' }), el('span.val', { texto: P.nomeSelecao(p.viceId) || '—' })])
        ]),
        b.id === bolao.id ? null : el('button.botao.botao--pequeno', {
          type: 'button',
          texto: 'Tornar ativo',
          style: 'margin-top:.6rem',
          onclick: () => {
            bolao = B.obter(b.id) || bolao;
            B.definirAtivo(bolao.id);
            renderizarTudo();
          }
        })
      ]));
    });

    P.limpar(alvoTabelaComparacao);
    const referencia = estado.referencia ? B.obter(estado.referencia) : null;
    if (!referencia) {
      alvoTabelaComparacao.appendChild(el('p.vazio', {
        texto: 'Escolha um bolão de referência para comparar os palpites jogo a jogo.'
      }));
      return;
    }

    const c = B.comparar(bolao, referencia.resultados);
    const divergentes = P.dados.jogos.filter((j) => {
      const a = bolao.resultados[j.id];
      const b = referencia.resultados[j.id];
      return a && b && (Number(a.golsMandante) !== Number(b.golsMandante)
        || Number(a.golsVisitante) !== Number(b.golsVisitante));
    });

    alvoTabelaComparacao.appendChild(el('div', null, [
      el('p.resumo-filtro', {
        texto: `${c.comparados} jogos comparados · placar exato: ${c.placarExato} (${c.percentualPlacar}%) · `
          + `mesmo vencedor: ${c.vencedor} (${c.percentualVencedor}%) · divergências: ${divergentes.length}.`
      }),
      el('table.tabela', null, [
        el('caption', { texto: `Jogos em que “${bolao.nome}” e “${referencia.nome}” divergem.` }),
        el('thead', null, [el('tr', null, [
          el('th', { scope: 'col', texto: 'Jogo' }),
          el('th.esquerda', { scope: 'col', texto: 'Confronto' }),
          el('th', { scope: 'col', texto: bolao.nome }),
          el('th', { scope: 'col', texto: referencia.nome })
        ])]),
        el('tbody', null, divergentes.slice(0, 50).map((j) => {
          const a = bolao.resultados[j.id];
          const b = referencia.resultados[j.id];
          return el('tr', null, [
            el('td', { texto: j.numero }),
            el('td.esquerda', {
              texto: j.mandanteId
                ? `${P.nomeSelecao(j.mandanteId)} × ${P.nomeSelecao(j.visitanteId)}`
                : `${j.faseNome} ${j.chaveId || ''}`
            }),
            el('td.num.destaque', { texto: `${a.golsMandante} × ${a.golsVisitante}` }),
            el('td.num', { texto: `${b.golsMandante} × ${b.golsVisitante}` })
          ]);
        }))
      ]),
      divergentes.length > 50
        ? el('p.resumo-filtro', { texto: `Exibindo as 50 primeiras de ${divergentes.length} divergências.` })
        : null
    ]));
  }

  /* ----------------------------------------------------------- Bootstrap */

  function renderizarTudo() {
    montarSeletorBoloes();
    if (estado.etapa === 'grupos') renderizarGrupos();
    if (estado.etapa === 'mata-mata') renderizarMataMata();
    if (estado.etapa === 'chaveamento') renderizarChaveamento();
    if (estado.etapa === 'comparacao') renderizarComparacao();
    P.parametros.gravar({ etapa: estado.etapa, grupo: estado.grupo, faseMata: estado.faseMata });
  }

  aplicarEtapa();
  renderizarTudo();
}());
