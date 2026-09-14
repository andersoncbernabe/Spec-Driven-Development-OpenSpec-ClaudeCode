/**
 * PortalCopa26 - nucleo compartilhado.
 *
 * Indices sobre o seed (data/copa2026.js), helpers de formatacao, montagem de
 * cabecalho/rodape e componentes reutilizados pelas paginas.
 */
(function (global) {
  'use strict';

  const dados = global.COPA2026;
  if (!dados) throw new Error('Seed nao carregado: inclua data/copa2026.js antes de nucleo.js');

  /* ------------------------------------------------------------- Indices */

  const selecaoPorId = new Map(dados.selecoes.map((s) => [s.id, s]));
  const cidadePorId = new Map(dados.cidades.map((c) => [c.id, c]));
  const jogoPorId = new Map(dados.jogos.map((j) => [j.id, j]));
  const jogoPorChave = new Map(dados.jogos.filter((j) => j.chaveId).map((j) => [j.chaveId, j]));
  const grupoPorLetra = new Map(dados.grupos.map((g) => [g.letra, g]));

  const jogadoresPorSelecao = new Map();
  dados.jogadores.forEach((j) => {
    if (!jogadoresPorSelecao.has(j.selecaoId)) jogadoresPorSelecao.set(j.selecaoId, []);
    jogadoresPorSelecao.get(j.selecaoId).push(j);
  });

  const selecao = (id) => selecaoPorId.get(id) || null;
  const cidade = (id) => cidadePorId.get(id) || null;
  const jogo = (id) => jogoPorId.get(id) || null;
  const grupo = (letra) => grupoPorLetra.get(letra) || null;
  const elenco = (selecaoId) => jogadoresPorSelecao.get(selecaoId) || [];
  const nomeSelecao = (id) => (selecao(id) ? selecao(id).nome : '');

  /** Jogos da fase de grupos de um grupo, em ordem cronologica. */
  function jogosDoGrupo(letra) {
    return dados.jogos.filter((j) => j.fase === 'grupos' && j.grupo === letra);
  }

  /** Jogos (qualquer fase) em que a selecao participa como time definido. */
  function jogosDaSelecao(id) {
    return dados.jogos.filter((j) => j.mandanteId === id || j.visitanteId === id);
  }

  /* --------------------------------------------------------- Formatacao */

  const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  /** Interpreta "2026-06-11T16:00:00" como horario local, sem deslocar fuso. */
  function comoData(iso) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (!m) return new Date(NaN);
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  }

  const dois = (n) => String(n).padStart(2, '0');

  function dataExtensa(iso) {
    const d = comoData(iso);
    return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  }
  function dataCurta(iso) {
    const d = comoData(iso);
    return `${dois(d.getDate())} ${MESES_CURTO[d.getMonth()]}`;
  }
  function hora(iso) {
    const d = comoData(iso);
    return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
  }
  function pluralizar(n, singular, plural) {
    return `${n} ${n === 1 ? singular : plural}`;
  }

  /* -------------------------------------------------------------- Midia */

  /** Bandeira via API publica da FIFA (PRD secao 11). */
  function bandeiraUrl(codigoFifa) {
    return dados.meta.bandeiraUrlBase + codigoFifa;
  }

  /**
   * <img> de bandeira com alt obrigatorio (RNF-05) e fallback silencioso
   * caso a API da FIFA esteja indisponivel.
   */
  function bandeira(selecaoId, tamanho) {
    const s = selecao(selecaoId);
    const img = document.createElement('img');
    img.className = 'bandeira' + (tamanho ? ` bandeira--${tamanho}` : '');
    img.loading = 'lazy';
    img.decoding = 'async';
    if (s) {
      img.src = bandeiraUrl(s.codigoFifa);
      img.alt = `Bandeira: ${s.nome}`;
    } else {
      img.alt = '';
      img.setAttribute('role', 'presentation');
    }
    img.addEventListener('error', function () {
      this.style.visibility = 'hidden';
    });
    return img;
  }

  /* ---------------------------------------------------------------- DOM */

  /**
   * Cria elementos: el('div.classe', { attrs }, [filhos | string]).
   */
  function el(seletor, atributos, filhos) {
    const [tag, ...classes] = String(seletor).split('.');
    const node = document.createElement(tag || 'div');
    if (classes.length) node.className = classes.join(' ');

    if (atributos) {
      Object.keys(atributos).forEach((chave) => {
        const valor = atributos[chave];
        if (valor === null || valor === undefined || valor === false) return;
        if (chave === 'texto') node.textContent = valor;
        else if (chave === 'html') node.innerHTML = valor;
        else if (chave === 'dataset') Object.assign(node.dataset, valor);
        else if (chave.startsWith('on') && typeof valor === 'function') {
          node.addEventListener(chave.slice(2).toLowerCase(), valor);
        } else node.setAttribute(chave, valor === true ? '' : valor);
      });
    }

    const lista = Array.isArray(filhos) ? filhos : (filhos === undefined ? [] : [filhos]);
    lista.forEach((f) => {
      if (f === null || f === undefined || f === false) return;
      node.appendChild(typeof f === 'string' || typeof f === 'number'
        ? document.createTextNode(String(f))
        : f);
    });
    return node;
  }

  const limpar = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  /* ------------------------------------------------------ Cabecalho/nav */

  const PAGINAS = [
    { href: 'index.html', rotulo: 'Home' },
    { href: 'jogos.html', rotulo: 'Jogos' },
    { href: 'grupos.html', rotulo: 'Grupos' },
    { href: 'equipes.html', rotulo: 'Equipes' },
    { href: 'ranking.html', rotulo: 'Ranking' },
    { href: 'simulador.html', rotulo: 'Simulador' }
  ];

  function paginaAtual() {
    const arquivo = (global.location.pathname.split('/').pop() || 'index.html');
    return arquivo === '' ? 'index.html' : arquivo;
  }

  function montarCabecalho() {
    const alvo = document.querySelector('[data-cabecalho]');
    if (!alvo) return;
    const atual = paginaAtual();

    const nav = el('nav.navegacao', { id: 'navegacao-principal', 'aria-label': 'Navegação principal' }, [
      el('ul', null, PAGINAS.map((p) => el('li', null, [
        el('a', {
          href: p.href,
          texto: p.rotulo,
          'aria-current': p.href === atual ? 'page' : null
        })
      ])))
    ]);

    const alternar = el('button.menu-alternar', {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'navegacao-principal',
      'aria-label': 'Abrir menu de navegação',
      texto: '☰'
    });
    alternar.addEventListener('click', () => {
      const aberto = nav.classList.toggle('aberta');
      alternar.setAttribute('aria-expanded', String(aberto));
      alternar.setAttribute('aria-label', aberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    });

    alvo.appendChild(el('header.cabecalho', null, [
      el('div.container.cabecalho__interno', null, [
        el('a.marca', { href: 'index.html', 'aria-label': 'PortalCopa26 - página inicial' }, [
          el('img.marca__logo', {
            src: dados.meta.logoUrl,
            alt: 'Logo da Copa do Mundo FIFA 2026',
            onerror: function () { this.remove(); }
          }),
          el('span', null, ['Portal', el('span.marca__26', { texto: 'Copa26' })])
        ]),
        alternar,
        nav
      ])
    ]));
  }

  function montarRodape() {
    const alvo = document.querySelector('[data-rodape]');
    if (!alvo) return;
    const e = dados.meta.estatisticas;
    alvo.appendChild(el('footer.rodape', null, [
      el('div.container.rodape__interno', null, [
        el('div', null, [
          el('p', null, [el('strong', { texto: 'PortalCopa26' }), ' — protótipo HTML/CSS/JavaScript do PRD.']),
          el('p', { texto: `${e.selecoes} seleções · ${e.grupos} grupos · ${e.cidades} cidades-sede · ${e.jogos} jogos.` }),
          el('p', { texto: 'Dados carregados por seed a partir dos arquivos de ./fontes. Bandeiras e logo: API pública da FIFA.' })
        ]),
        el('div', null, [
          el('p', { texto: `Horários em ${dados.meta.fusoHorario}.` }),
          el('p', { texto: 'Sem área administrativa, cadastro ou login (fora do escopo da 1ª versão).' })
        ])
      ])
    ]));
  }

  /* ------------------------------------------------- Cartao de jogo (RF-02) */

  /**
   * Status do jogo. Como o seed nao traz resultados oficiais, um jogo so e
   * "Encerrado" quando ha placar informado (real ou simulado).
   */
  function statusJogo(j, resultado, agora) {
    if (resultado && resultado.golsMandante !== null && resultado.golsMandante !== undefined) {
      return { chave: 'encerrado', rotulo: 'Encerrado', classe: 'etiqueta--verde' };
    }
    const inicio = comoData(j.dataHora).getTime();
    const fim = inicio + 2 * 60 * 60 * 1000;
    const t = (agora || new Date()).getTime();
    if (t >= inicio && t <= fim) {
      return { chave: 'em-andamento', rotulo: 'Em andamento', classe: 'etiqueta--amarela' };
    }
    return { chave: 'agendado', rotulo: 'Agendado', classe: 'etiqueta--azul' };
  }

  function ladoJogo(selecaoId, rotuloVaga, posicao, marca) {
    const s = selecao(selecaoId);
    const conteudo = s
      ? [bandeira(selecaoId), el('span.jogo__nome', { texto: s.nome })]
      : [el('span.bandeira', { 'aria-hidden': 'true' }), el('span.jogo__vaga', { texto: rotuloVaga || 'A definir' })];
    const classes = ['jogo__lado', `jogo__lado--${posicao}`];
    if (marca) classes.push(`jogo__lado--${marca}`);
    return el(classes.join('.'), null, conteudo);
  }

  /**
   * Cartao de jogo. `opcoes.resultado` = { golsMandante, golsVisitante,
   * penaltisMandante, penaltisVisitante }.
   */
  function cartaoJogo(j, opcoes) {
    const o = opcoes || {};
    const r = o.resultado || null;
    const c = cidade(j.cidadeId);
    const st = statusJogo(j, r, o.agora);

    const mandanteId = o.mandanteId !== undefined ? o.mandanteId : j.mandanteId;
    const visitanteId = o.visitanteId !== undefined ? o.visitanteId : j.visitanteId;

    let marcaM = null;
    let marcaV = null;
    let placar = el('span.jogo__placar.jogo__placar--vazio', { texto: `${hora(j.dataHora)}` });

    if (r && r.golsMandante !== null && r.golsMandante !== undefined) {
      const gm = r.golsMandante;
      const gv = r.golsVisitante;
      let texto = `${gm} × ${gv}`;
      let vencedor = gm > gv ? 'm' : (gv > gm ? 'v' : null);
      if (!vencedor && r.penaltisMandante !== null && r.penaltisMandante !== undefined) {
        texto += ` (${r.penaltisMandante}×${r.penaltisVisitante} pên.)`;
        vencedor = r.penaltisMandante > r.penaltisVisitante ? 'm' : 'v';
      }
      placar = el('span.jogo__placar', { texto });
      if (vencedor === 'm') { marcaM = 'vencedor'; marcaV = 'perdedor'; }
      if (vencedor === 'v') { marcaV = 'vencedor'; marcaM = 'perdedor'; }
    }

    const meta = [
      el('span.etiqueta', { texto: j.faseNome }),
      j.grupo ? el('span.etiqueta.etiqueta--azul', { texto: `Grupo ${j.grupo}` }) : null,
      el('span', { texto: `Jogo ${j.numero}` }),
      el('span', { class: `etiqueta ${st.classe}`, texto: st.rotulo })
    ];

    return el(`article.jogo.jogo--${j.fase}`, { 'data-jogo': j.id }, [
      el('div.jogo__meta', null, meta),
      el('div.jogo__confronto', null, [
        ladoJogo(mandanteId, j.vagaMandante && j.vagaMandante.rotulo, 'mandante', marcaM),
        o.placarCustomizado || placar,
        ladoJogo(visitanteId, j.vagaVisitante && j.vagaVisitante.rotulo, 'visitante', marcaV)
      ]),
      o.extra || null,
      el('div.jogo__rodape', null, [
        el('span', { texto: `📅 ${dataCurta(j.dataHora)} · ${hora(j.dataHora)}` }),
        c ? el('span', { texto: `🏟️ ${c.estadio}` }) : null,
        c ? el('span', { texto: `📍 ${c.nome}, ${c.pais}` }) : null
      ])
    ]);
  }

  /** Agrupa jogos pela data de listagem da fonte e renderiza blocos por dia. */
  function renderizarPorDia(container, listaJogos, opcoesPorJogo) {
    limpar(container);
    if (!listaJogos.length) {
      container.appendChild(el('p.vazio', { texto: 'Nenhum jogo encontrado para os filtros selecionados.' }));
      return;
    }
    const porDia = new Map();
    listaJogos.forEach((j) => {
      const dia = j.dataListagem;
      if (!porDia.has(dia)) porDia.set(dia, []);
      porDia.get(dia).push(j);
    });

    [...porDia.keys()].sort().forEach((dia) => {
      const doDia = porDia.get(dia).sort((a, b) => a.dataHora.localeCompare(b.dataHora));
      container.appendChild(el('section.dia-bloco', null, [
        el('h3.dia-bloco__titulo', null, [
          dataExtensa(dia),
          el('span.dia-bloco__contador', { texto: pluralizar(doDia.length, 'jogo', 'jogos') })
        ]),
        el('div.grade', null, doDia.map((j) => cartaoJogo(j, opcoesPorJogo ? opcoesPorJogo(j) : null)))
      ]));
    });
  }

  /* ----------------------------------------------------------- Utilidades */

  /** Normaliza texto para busca (sem acentos, minusculo). */
  function normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  /** Le/grava parametros na querystring, preservando o estado dos filtros. */
  const parametros = {
    ler() { return new URLSearchParams(global.location.search); },
    gravar(mapa) {
      const p = new URLSearchParams();
      Object.keys(mapa).forEach((k) => {
        if (mapa[k]) p.set(k, mapa[k]);
      });
      const qs = p.toString();
      global.history.replaceState(null, '', qs ? `?${qs}` : global.location.pathname);
    }
  };

  /** Persistencia local do prototipo (o PRD prevê SQLite na fase Blazor). */
  const armazenamento = {
    ler(chave, padrao) {
      try {
        const bruto = global.localStorage.getItem(chave);
        return bruto ? JSON.parse(bruto) : padrao;
      } catch (e) { return padrao; }
    },
    gravar(chave, valor) {
      try {
        global.localStorage.setItem(chave, JSON.stringify(valor));
        return true;
      } catch (e) { return false; }
    },
    remover(chave) {
      try { global.localStorage.removeItem(chave); } catch (e) { /* ignora */ }
    }
  };

  function iniciarLayout() {
    montarCabecalho();
    montarRodape();
  }

  global.Portal = {
    dados,
    selecao, cidade, jogo, grupo, elenco, nomeSelecao,
    jogoPorChave, jogosDoGrupo, jogosDaSelecao,
    comoData, dataExtensa, dataCurta, hora, pluralizar, normalizar,
    bandeira, bandeiraUrl,
    el, limpar,
    cartaoJogo, renderizarPorDia, statusJogo,
    parametros, armazenamento,
    iniciarLayout
  };
}(window));
