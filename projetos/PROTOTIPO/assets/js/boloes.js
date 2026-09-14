/**
 * PortalCopa26 - gestao de boloes (RF-06).
 *
 * Cada bolao guarda o conjunto de placares palpitados. No protótipo a
 * persistencia e o localStorage do navegador; na evolucao para Blazor o mesmo
 * contrato passa a ser atendido pelo SQLite (RNF-03).
 */
(function (global) {
  'use strict';

  const P = global.Portal;
  const CHAVE_LISTA = 'portalcopa26.boloes';
  const CHAVE_ATIVO = 'portalcopa26.bolaoAtivo';

  function agora() { return new Date().toISOString(); }

  function novoId() {
    return `b${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  }

  function listar() {
    const lista = P.armazenamento.ler(CHAVE_LISTA, []);
    return Array.isArray(lista) ? lista : [];
  }

  function salvarLista(lista) {
    return P.armazenamento.gravar(CHAVE_LISTA, lista);
  }

  function obter(id) {
    return listar().find((b) => b.id === id) || null;
  }

  function criar(nome) {
    const lista = listar();
    const bolao = {
      id: novoId(),
      nome: (nome || '').trim() || `Bolão ${lista.length + 1}`,
      criadoEm: agora(),
      atualizadoEm: agora(),
      resultados: {}
    };
    lista.push(bolao);
    salvarLista(lista);
    definirAtivo(bolao.id);
    return bolao;
  }

  function atualizar(id, mudancas) {
    const lista = listar();
    const i = lista.findIndex((b) => b.id === id);
    if (i < 0) return null;
    lista[i] = Object.assign({}, lista[i], mudancas, { atualizadoEm: agora() });
    salvarLista(lista);
    return lista[i];
  }

  function renomear(id, nome) {
    const limpo = (nome || '').trim();
    return limpo ? atualizar(id, { nome: limpo }) : obter(id);
  }

  function duplicar(id, nome) {
    const origem = obter(id);
    if (!origem) return null;
    const copia = criar(nome || `${origem.nome} (cópia)`);
    return atualizar(copia.id, { resultados: JSON.parse(JSON.stringify(origem.resultados)) });
  }

  function remover(id) {
    const lista = listar().filter((b) => b.id !== id);
    salvarLista(lista);
    if (idAtivo() === id) {
      if (lista.length) definirAtivo(lista[0].id);
      else P.armazenamento.remover(CHAVE_ATIVO);
    }
    return lista;
  }

  function limparResultados(id) {
    return atualizar(id, { resultados: {} });
  }

  /** Grava (ou apaga, quando `placar` e null) o resultado de um jogo. */
  function definirResultado(id, jogoId, placar) {
    const bolao = obter(id);
    if (!bolao) return null;
    const resultados = Object.assign({}, bolao.resultados);
    if (placar === null) delete resultados[jogoId];
    else resultados[jogoId] = placar;
    return atualizar(id, { resultados });
  }

  function idAtivo() {
    return P.armazenamento.ler(CHAVE_ATIVO, null);
  }

  function definirAtivo(id) {
    P.armazenamento.gravar(CHAVE_ATIVO, id);
    return id;
  }

  /** Retorna o bolao ativo, criando o primeiro quando ainda nao existe nenhum. */
  function ativo(criarSeVazio) {
    const lista = listar();
    if (!lista.length) return criarSeVazio ? criar('Meu bolão') : null;
    const atual = obter(idAtivo());
    if (atual) return atual;
    definirAtivo(lista[0].id);
    return lista[0];
  }

  /** Estatisticas de preenchimento, usadas nos cards de comparacao (RF-06). */
  function resumo(bolao) {
    const total = P.dados.jogos.length;
    const grupos = P.dados.jogos.filter((j) => j.fase === 'grupos');
    const ids = Object.keys(bolao.resultados || {});
    const preenchidosGrupos = grupos.filter((j) => bolao.resultados[j.id]).length;
    return {
      preenchidos: ids.length,
      total,
      percentual: total ? Math.round((ids.length / total) * 100) : 0,
      gruposPreenchidos: preenchidosGrupos,
      gruposTotal: grupos.length,
      gruposCompleto: preenchidosGrupos === grupos.length
    };
  }

  /**
   * Percentual de acertos contra um conjunto de resultados de referencia
   * (RF-06). Enquanto o seed nao tiver resultados oficiais, `referencia` vem
   * vazia e a comparacao e feita entre dois boloes.
   */
  function comparar(bolao, referencia) {
    const ref = referencia || {};
    const chaves = Object.keys(ref);
    let placarExato = 0;
    let vencedor = 0;

    chaves.forEach((jogoId) => {
      const a = bolao.resultados[jogoId];
      const b = ref[jogoId];
      if (!a || !b) return;
      if (Number(a.golsMandante) === Number(b.golsMandante)
        && Number(a.golsVisitante) === Number(b.golsVisitante)) placarExato += 1;
      const sinal = (r) => Math.sign(Number(r.golsMandante) - Number(r.golsVisitante));
      if (sinal(a) === sinal(b)) vencedor += 1;
    });

    return {
      comparados: chaves.length,
      placarExato,
      vencedor,
      percentualPlacar: chaves.length ? Math.round((placarExato / chaves.length) * 100) : 0,
      percentualVencedor: chaves.length ? Math.round((vencedor / chaves.length) * 100) : 0
    };
  }

  global.Boloes = {
    listar, obter, criar, atualizar, renomear, duplicar, remover,
    limparResultados, definirResultado,
    ativo, idAtivo, definirAtivo,
    resumo, comparar
  };
}(window));
