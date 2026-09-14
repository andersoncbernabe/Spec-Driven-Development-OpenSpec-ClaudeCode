/**
 * Pagina Jogos (PRD secao 6 / RF-02).
 *
 * Ordenacao por data, agrupamento por dia, filtros combinados (fase, grupo,
 * data, selecao, sede) e paginacao por dia quando o resultado passa de 20
 * jogos (RNF-01).
 */
(function () {
  'use strict';

  const P = window.Portal;
  const el = P.el;

  P.iniciarLayout();

  const LIMITE_PAGINA = 20;

  const FASES = [
    { chave: '', rotulo: 'Todas as fases' },
    { chave: 'grupos', rotulo: 'Fase de Grupos' },
    { chave: 'segunda-fase', rotulo: 'Segunda Fase' },
    { chave: 'oitavas', rotulo: 'Oitavas' },
    { chave: 'quartas', rotulo: 'Quartas' },
    { chave: 'semifinal', rotulo: 'Semifinais' },
    { chave: 'terceiro-lugar', rotulo: '3º Lugar' },
    { chave: 'final', rotulo: 'Final' }
  ];

  document.querySelector('[data-descricao]').textContent =
    `Os ${P.dados.meta.estatisticas.jogos} jogos da ${P.dados.meta.torneio}, ordenados por data e `
    + `agrupados por dia. Horários em ${P.dados.meta.fusoHorario}.`;

  /* ------------------------------------------------------------- Estado */

  const qs = P.parametros.ler();
  const estado = {
    fase: qs.get('fase') || '',
    grupo: qs.get('grupo') || '',
    selecao: qs.get('selecao') || '',
    cidade: qs.get('cidade') || '',
    data: qs.get('data') || '',
    pagina: Math.max(1, Number(qs.get('pagina')) || 1)
  };

  /* ------------------------------------------------------------ Controles */

  const abas = document.querySelector('[data-abas-fase]');
  const botoesFase = FASES.map((f) => {
    const b = el('button.aba', {
      type: 'button',
      texto: f.rotulo,
      'aria-pressed': String(estado.fase === f.chave)
    });
    b.addEventListener('click', () => {
      estado.fase = f.chave;
      estado.pagina = 1;
      // Grupo so faz sentido na fase de grupos.
      if (f.chave && f.chave !== 'grupos') estado.grupo = '';
      sincronizarControles();
      renderizar();
    });
    abas.appendChild(b);
    return { chave: f.chave, botao: b };
  });

  function preencher(select, itens, vazio) {
    P.limpar(select);
    select.appendChild(el('option', { value: '', texto: vazio }));
    itens.forEach((i) => select.appendChild(el('option', { value: i.valor, texto: i.rotulo })));
  }

  const selGrupo = document.getElementById('f-grupo');
  const selSelecao = document.getElementById('f-selecao');
  const selCidade = document.getElementById('f-cidade');
  const selData = document.getElementById('f-data');

  preencher(selGrupo, P.dados.grupos.map((g) => ({ valor: g.letra, rotulo: `Grupo ${g.letra}` })), 'Todos os grupos');
  preencher(selSelecao, P.dados.selecoes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((s) => ({ valor: s.id, rotulo: s.nome })), 'Todas as seleções');
  preencher(selCidade, P.dados.cidades
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((c) => ({ valor: c.id, rotulo: `${c.nome} — ${c.estadio}` })), 'Todas as sedes');
  preencher(selData, [...new Set(P.dados.jogos.map((j) => j.dataListagem))]
    .sort()
    .map((d) => ({ valor: d, rotulo: P.dataExtensa(d) })), 'Todas as datas');

  function sincronizarControles() {
    botoesFase.forEach((b) => b.botao.setAttribute('aria-pressed', String(b.chave === estado.fase)));
    selGrupo.value = estado.grupo;
    selSelecao.value = estado.selecao;
    selCidade.value = estado.cidade;
    selData.value = estado.data;
    selGrupo.disabled = !!estado.fase && estado.fase !== 'grupos';
  }

  [['grupo', selGrupo], ['selecao', selSelecao], ['cidade', selCidade], ['data', selData]]
    .forEach(([chave, campo]) => {
      campo.addEventListener('change', () => {
        estado[chave] = campo.value;
        estado.pagina = 1;
        renderizar();
      });
    });

  document.querySelector('[data-limpar]').addEventListener('click', (ev) => {
    ev.preventDefault();
    Object.assign(estado, { fase: '', grupo: '', selecao: '', cidade: '', data: '', pagina: 1 });
    sincronizarControles();
    renderizar();
  });

  /* ------------------------------------------------------------- Filtro */

  function filtrar() {
    return P.dados.jogos.filter((j) => {
      if (estado.fase && j.fase !== estado.fase) return false;
      if (estado.grupo && j.grupo !== estado.grupo) return false;
      if (estado.cidade && j.cidadeId !== estado.cidade) return false;
      if (estado.data && j.dataListagem !== estado.data) return false;
      if (estado.selecao && j.mandanteId !== estado.selecao && j.visitanteId !== estado.selecao) return false;
      return true;
    });
  }

  /* ---------------------------------------------------------- Renderizacao */

  const lista = document.querySelector('[data-lista-jogos]');
  const resumo = document.querySelector('[data-resumo]');
  const paginacao = document.querySelector('[data-paginacao]');

  function renderizar() {
    const filtrados = filtrar();

    // Paginacao respeita a fronteira dos dias para nao quebrar o agrupamento.
    const dias = [...new Set(filtrados.map((j) => j.dataListagem))].sort();
    const paginas = [];
    let atual = [];
    dias.forEach((dia) => {
      const doDia = filtrados.filter((j) => j.dataListagem === dia);
      if (atual.length && atual.length + doDia.length > LIMITE_PAGINA) {
        paginas.push(atual);
        atual = [];
      }
      atual = atual.concat(doDia);
    });
    if (atual.length) paginas.push(atual);
    if (!paginas.length) paginas.push([]);

    estado.pagina = Math.min(estado.pagina, paginas.length);
    const visiveis = paginas[estado.pagina - 1];

    P.renderizarPorDia(lista, visiveis);

    const partes = [];
    if (estado.fase) partes.push((FASES.find((f) => f.chave === estado.fase) || {}).rotulo);
    if (estado.grupo) partes.push(`Grupo ${estado.grupo}`);
    if (estado.selecao) partes.push(P.nomeSelecao(estado.selecao));
    if (estado.cidade) partes.push(P.cidade(estado.cidade).nome);
    if (estado.data) partes.push(P.dataExtensa(estado.data));

    resumo.textContent = `${P.pluralizar(filtrados.length, 'jogo encontrado', 'jogos encontrados')}`
      + (partes.length ? ` — filtros: ${partes.join(' · ')}.` : ' — sem filtros aplicados.')
      + (paginas.length > 1 ? ` Página ${estado.pagina} de ${paginas.length}.` : '');

    renderizarPaginacao(paginas.length);

    P.parametros.gravar({
      fase: estado.fase,
      grupo: estado.grupo,
      selecao: estado.selecao,
      cidade: estado.cidade,
      data: estado.data,
      pagina: estado.pagina > 1 ? estado.pagina : ''
    });
  }

  function renderizarPaginacao(total) {
    P.limpar(paginacao);
    if (total <= 1) return;

    const ir = (n) => {
      estado.pagina = n;
      renderizar();
      document.getElementById('conteudo').scrollIntoView({ block: 'start' });
    };

    paginacao.appendChild(el('button.botao.botao--pequeno', {
      type: 'button', texto: '← Anterior',
      disabled: estado.pagina === 1,
      onclick: () => ir(estado.pagina - 1)
    }));
    paginacao.appendChild(el('span.paginacao__info', { texto: `Página ${estado.pagina} de ${total}` }));
    paginacao.appendChild(el('button.botao.botao--pequeno', {
      type: 'button', texto: 'Próxima →',
      disabled: estado.pagina === total,
      onclick: () => ir(estado.pagina + 1)
    }));
  }

  sincronizarControles();
  renderizar();
}());
