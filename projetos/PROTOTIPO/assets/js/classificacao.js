/**
 * PortalCopa26 - motor de classificacao.
 *
 * Implementa as regras de fontes/copa2026_regras_negocio.txt e
 * fontes/Copa2026_Regra_Terceiros_Colocados.txt.
 *
 * RN-01 (grupos), na ordem:
 *   1. Pontos
 *   2. Saldo de gols
 *   3. Gols marcados
 *   4. Resultado do confronto direto
 *   5. Saldo de gols nos confrontos diretos
 *   6. Fair Play (cartoes)
 *   7. Ranking FIFA
 *
 * RN-02: 1o e 2o de cada grupo (24) + os 8 melhores terceiros = 32 times na
 * fase seguinte (a "Segunda Fase" de 32 times prevista em copa2026_fases.txt).
 *
 * Terceiros colocados: pontos > saldo de gols > gols marcados > fair play >
 * ranking FIFA.
 *
 * Observacao sobre fair play: nenhuma fonte fornece cartoes. O criterio esta
 * implementado e le `resultado.cartoesMandante` / `cartoesVisitante` quando
 * existirem; sem esses dados ele e sempre neutro (0 x 0).
 */
(function (global) {
  'use strict';

  const P = global.Portal;
  const VITORIA = 3;
  const EMPATE = 1;

  function linhaVazia(selecaoId) {
    return {
      selecaoId,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldo: 0,
      pontos: 0,
      cartoes: 0,
      posicao: 0
    };
  }

  /** Um resultado so conta quando ambos os placares estao preenchidos. */
  function temPlacar(r) {
    return !!r
      && r.golsMandante !== null && r.golsMandante !== undefined && r.golsMandante !== ''
      && r.golsVisitante !== null && r.golsVisitante !== undefined && r.golsVisitante !== '';
  }

  function aplicar(linha, golsPro, golsContra, cartoes) {
    linha.jogos += 1;
    linha.golsPro += golsPro;
    linha.golsContra += golsContra;
    linha.saldo = linha.golsPro - linha.golsContra;
    linha.cartoes += cartoes || 0;
    if (golsPro > golsContra) { linha.vitorias += 1; linha.pontos += VITORIA; }
    else if (golsPro === golsContra) { linha.empates += 1; linha.pontos += EMPATE; }
    else { linha.derrotas += 1; }
  }

  /**
   * Criterios 4 e 5: mini-tabela apenas com os jogos entre as selecoes
   * empatadas, conforme RN-01.
   */
  function miniTabela(empatados, jogos, resultados) {
    const conjunto = new Set(empatados);
    const mapa = new Map(empatados.map((id) => [id, linhaVazia(id)]));

    jogos.forEach((j) => {
      if (!conjunto.has(j.mandanteId) || !conjunto.has(j.visitanteId)) return;
      const r = resultados[j.id];
      if (!temPlacar(r)) return;
      const gm = Number(r.golsMandante);
      const gv = Number(r.golsVisitante);
      aplicar(mapa.get(j.mandanteId), gm, gv, r.cartoesMandante);
      aplicar(mapa.get(j.visitanteId), gv, gm, r.cartoesVisitante);
    });
    return mapa;
  }

  function rankingDe(selecaoId) {
    const s = P.selecao(selecaoId);
    // Selecoes ausentes da fonte de ranking ficam atras das ranqueadas.
    return s && s.rankingPosicao ? s.rankingPosicao : 9999;
  }

  /**
   * Ordena as linhas de um grupo aplicando RN-01 integralmente.
   * `jogos` sao os jogos do grupo; `resultados` mapeia jogoId -> placar.
   */
  function ordenarGrupo(linhas, jogos, resultados) {
    // Passo 1: criterios globais 1-3.
    const parcial = linhas.slice().sort((a, b) =>
      (b.pontos - a.pontos)
      || (b.saldo - a.saldo)
      || (b.golsPro - a.golsPro)
    );

    // Passo 2: dentro de cada bloco ainda empatado em 1-3, aplica 4-7.
    const resultado = [];
    let i = 0;
    while (i < parcial.length) {
      let f = i + 1;
      while (f < parcial.length
        && parcial[f].pontos === parcial[i].pontos
        && parcial[f].saldo === parcial[i].saldo
        && parcial[f].golsPro === parcial[i].golsPro) f += 1;

      const bloco = parcial.slice(i, f);
      if (bloco.length > 1) {
        const mini = miniTabela(bloco.map((l) => l.selecaoId), jogos, resultados);
        bloco.sort((a, b) => {
          const ma = mini.get(a.selecaoId);
          const mb = mini.get(b.selecaoId);
          return (mb.pontos - ma.pontos)               // 4. confronto direto
            || (mb.saldo - ma.saldo)                   // 5. saldo nos confrontos
            || (mb.golsPro - ma.golsPro)
            || (a.cartoes - b.cartoes)                 // 6. fair play
            || (rankingDe(a.selecaoId) - rankingDe(b.selecaoId)); // 7. ranking FIFA
        });
      }
      bloco.forEach((l) => resultado.push(l));
      i = f;
    }

    resultado.forEach((l, idx) => { l.posicao = idx + 1; });
    return resultado;
  }

  /**
   * Classificacao de um grupo.
   * @param {string} letra grupo A..L
   * @param {Object} resultados mapa jogoId -> { golsMandante, golsVisitante, ... }
   */
  function classificarGrupo(letra, resultados) {
    const g = P.grupo(letra);
    if (!g) return [];
    const res = resultados || {};
    const jogos = P.jogosDoGrupo(letra);
    const linhas = g.selecoes.map(linhaVazia);
    const mapa = new Map(linhas.map((l) => [l.selecaoId, l]));

    jogos.forEach((j) => {
      const r = res[j.id];
      if (!temPlacar(r)) return;
      const gm = Number(r.golsMandante);
      const gv = Number(r.golsVisitante);
      aplicar(mapa.get(j.mandanteId), gm, gv, r.cartoesMandante);
      aplicar(mapa.get(j.visitanteId), gv, gm, r.cartoesVisitante);
    });

    return ordenarGrupo(linhas, jogos, res);
  }

  /** Classificacao de todos os grupos: { A: [...], B: [...], ... } */
  function classificarTodos(resultados) {
    const saida = {};
    P.dados.grupos.forEach((g) => { saida[g.letra] = classificarGrupo(g.letra, resultados); });
    return saida;
  }

  /**
   * Os 8 melhores terceiros colocados (RN-02 + Copa2026_Regra_Terceiros_Colocados).
   * Retorna os 12 terceiros ordenados, com `classificado` nos 8 primeiros.
   */
  function melhoresTerceiros(classificacoes) {
    const terceiros = Object.keys(classificacoes)
      .sort()
      .map((letra) => {
        const linha = classificacoes[letra][2];
        return linha ? Object.assign({ grupo: letra }, linha) : null;
      })
      .filter(Boolean);

    terceiros.sort((a, b) =>
      (b.pontos - a.pontos)
      || (b.saldo - a.saldo)
      || (b.golsPro - a.golsPro)
      || (a.cartoes - b.cartoes)
      || (rankingDe(a.selecaoId) - rankingDe(b.selecaoId))
    );

    terceiros.forEach((t, i) => {
      t.ordem = i + 1;
      t.classificado = i < 8;
    });
    return terceiros;
  }

  /**
   * Situacao de cada selecao no grupo, para o indicador visual do RF-03.
   * Enquanto o grupo nao estiver completo, tudo que nao for matematicamente
   * decidido fica "indefinido".
   */
  function situacoes(letra, classificacao, resultados, terceiros) {
    const res = resultados || {};
    const jogos = P.jogosDoGrupo(letra);
    const disputados = jogos.filter((j) => temPlacar(res[j.id])).length;
    const completo = disputados === jogos.length;

    // A vaga do 3º só se decide quando os 12 grupos terminam: até lá ele
    // apenas "disputa uma das 8 vagas".
    const todosCompletos = P.dados.grupos.every((g) =>
      P.jogosDoGrupo(g.letra).every((j) => temPlacar(res[j.id])));

    const mapa = {};
    classificacao.forEach((linha, i) => {
      if (!completo) {
        mapa[linha.selecaoId] = disputados === 0 ? 'indefinido' : 'parcial';
        return;
      }
      if (i < 2) { mapa[linha.selecaoId] = 'classificado'; return; }
      if (i === 2) {
        if (!todosCompletos) { mapa[linha.selecaoId] = 'terceiro'; return; }
        const t = (terceiros || []).find((x) => x.selecaoId === linha.selecaoId);
        mapa[linha.selecaoId] = t && t.classificado ? 'classificado-terceiro'
          : (t ? 'eliminado' : 'terceiro');
        return;
      }
      mapa[linha.selecaoId] = 'eliminado';
    });
    return { situacoes: mapa, completo, todosCompletos, disputados, totalJogos: jogos.length };
  }

  global.Classificacao = {
    classificarGrupo,
    classificarTodos,
    melhoresTerceiros,
    situacoes,
    temPlacar,
    VITORIA,
    EMPATE
  };
}(window));
