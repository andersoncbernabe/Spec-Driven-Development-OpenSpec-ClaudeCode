/**
 * PortalCopa26 - resolucao do chaveamento (RN-03 / RF-06).
 *
 * A Segunda Fase ja vem com os confrontos definidos em
 * fontes/copa2026_Jogos_Segunda_fase.txt. Das oitavas em diante cada vaga e
 * uma referencia ("Venc. Segundafase 3", "Perd. Semifinal 1"), resolvida
 * recursivamente a partir dos placares informados.
 *
 * RN-03: empate no tempo normal leva a prorrogacao e, persistindo, a
 * penaltis. O placar informado representa o resultado apos a prorrogacao;
 * quando ele termina empatado, os penaltis definem quem avanca.
 */
(function (global) {
  'use strict';

  const P = global.Portal;

  const FASES_MATA_MATA = ['segunda-fase', 'oitavas', 'quartas', 'semifinal', 'terceiro-lugar', 'final'];

  function temPlacar(r) {
    return !!r
      && r.golsMandante !== null && r.golsMandante !== undefined && r.golsMandante !== ''
      && r.golsVisitante !== null && r.golsVisitante !== undefined && r.golsVisitante !== '';
  }

  function temPenaltis(r) {
    return !!r
      && r.penaltisMandante !== null && r.penaltisMandante !== undefined && r.penaltisMandante !== ''
      && r.penaltisVisitante !== null && r.penaltisVisitante !== undefined && r.penaltisVisitante !== ''
      && Number(r.penaltisMandante) !== Number(r.penaltisVisitante);
  }

  /** Um jogo eliminatorio empatado sem penaltis validos fica indefinido. */
  function precisaPenaltis(jogo, resultado) {
    return jogo.fase !== 'grupos'
      && temPlacar(resultado)
      && Number(resultado.golsMandante) === Number(resultado.golsVisitante);
  }

  /**
   * Resolve todo o mata-mata.
   * @param {Object} resultados mapa jogoId -> placar
   * @returns {Map<string, Object>} chaveId -> {
   *   jogo, mandanteId, visitanteId, resultado, vencedorId, perdedorId,
   *   pendentePenaltis, decidido
   * }
   */
  function resolver(resultados) {
    const res = resultados || {};
    const mapa = new Map();
    const emCurso = new Set();

    function resolverChave(chaveId) {
      if (mapa.has(chaveId)) return mapa.get(chaveId);
      if (emCurso.has(chaveId)) return null; // protecao contra ciclo na fonte
      emCurso.add(chaveId);

      const jogo = P.jogoPorChave.get(chaveId);
      if (!jogo) { emCurso.delete(chaveId); return null; }

      const mandanteId = jogo.mandanteId || vagaPara(jogo.vagaMandante);
      const visitanteId = jogo.visitanteId || vagaPara(jogo.vagaVisitante);
      const resultado = res[jogo.id] || null;

      let vencedorId = null;
      let perdedorId = null;
      let pendentePenaltis = false;

      if (mandanteId && visitanteId && temPlacar(resultado)) {
        const gm = Number(resultado.golsMandante);
        const gv = Number(resultado.golsVisitante);
        if (gm > gv) { vencedorId = mandanteId; perdedorId = visitanteId; }
        else if (gv > gm) { vencedorId = visitanteId; perdedorId = mandanteId; }
        else if (temPenaltis(resultado)) {
          const pm = Number(resultado.penaltisMandante);
          const pv = Number(resultado.penaltisVisitante);
          vencedorId = pm > pv ? mandanteId : visitanteId;
          perdedorId = pm > pv ? visitanteId : mandanteId;
        } else {
          pendentePenaltis = true;
        }
      }

      const item = {
        chaveId,
        jogo,
        mandanteId,
        visitanteId,
        resultado,
        vencedorId,
        perdedorId,
        pendentePenaltis,
        decidido: !!vencedorId
      };
      mapa.set(chaveId, item);
      emCurso.delete(chaveId);
      return item;
    }

    function vagaPara(vaga) {
      if (!vaga) return null;
      const origem = resolverChave(vaga.chaveId);
      if (!origem) return null;
      return vaga.tipo === 'perdedor' ? origem.perdedorId : origem.vencedorId;
    }

    P.dados.jogos
      .filter((j) => j.chaveId)
      .forEach((j) => resolverChave(j.chaveId));

    return mapa;
  }

  /** Jogos de uma fase do mata-mata, em ordem cronologica. */
  function jogosDaFase(fase) {
    return P.dados.jogos.filter((j) => j.fase === fase);
  }

  /** Campeao e vice, quando a final estiver decidida. */
  function podio(chaves) {
    const final = chaves.get('FI1');
    const terceiro = chaves.get('TL1');
    return {
      campeaoId: final ? final.vencedorId : null,
      viceId: final ? final.perdedorId : null,
      terceiroId: terceiro ? terceiro.vencedorId : null,
      quartoId: terceiro ? terceiro.perdedorId : null
    };
  }

  /** Caminho de uma selecao pelo mata-mata (RF-06: "caminho até a final"). */
  function caminho(chaves, selecaoId) {
    const passos = [];
    FASES_MATA_MATA.forEach((fase) => {
      jogosDaFase(fase).forEach((j) => {
        const c = chaves.get(j.chaveId);
        if (!c) return;
        if (c.mandanteId === selecaoId || c.visitanteId === selecaoId) passos.push(c);
      });
    });
    return passos;
  }

  global.MataMata = {
    FASES_MATA_MATA,
    resolver,
    jogosDaFase,
    podio,
    caminho,
    temPlacar,
    temPenaltis,
    precisaPenaltis
  };
}(window));
