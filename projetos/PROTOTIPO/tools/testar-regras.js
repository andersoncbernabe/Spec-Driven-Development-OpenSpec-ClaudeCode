#!/usr/bin/env node
/**
 * Testes das regras de negocio do PortalCopa26.
 *
 * Executa classificacao.js e mata-mata.js fora do navegador, sobre o seed
 * real, e confere:
 *  - integridade do seed contra as fontes;
 *  - RN-01 (ordem dos criterios de desempate);
 *  - RN-02 e a regra dos terceiros colocados;
 *  - RN-03 (prorrogacao/penaltis) e o encadeamento do chaveamento.
 *
 * Uso: node tools/testar-regras.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.resolve(__dirname, '..');

/* ------------------------------------------------- Ambiente de execucao */

const janela = {};
janela.window = janela;
janela.document = {
  createElement: () => ({ classList: { add() {}, contains: () => false }, style: {}, addEventListener() {}, setAttribute() {}, appendChild() {} }),
  createTextNode: () => ({}),
  querySelector: () => null,
  querySelectorAll: () => []
};
janela.location = { pathname: '/index.html', search: '' };
janela.history = { replaceState() {} };
janela.localStorage = (() => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k)
  };
})();
janela.URLSearchParams = URLSearchParams;

const contexto = vm.createContext(janela);
['data/copa2026.js', 'assets/js/nucleo.js', 'assets/js/classificacao.js', 'assets/js/mata-mata.js']
  .forEach((arquivo) => {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, arquivo), 'utf8'), contexto, { filename: arquivo });
  });

const P = janela.Portal;
const C = janela.Classificacao;
const M = janela.MataMata;
const dados = janela.COPA2026;

/* ------------------------------------------------------------- Runner */

let passou = 0;
const falhas = [];

function teste(nome, fn) {
  try {
    fn();
    passou += 1;
    console.log(`  ok   ${nome}`);
  } catch (erro) {
    falhas.push({ nome, erro });
    console.log(`  FALHA ${nome}\n        ${erro.message}`);
  }
}

function igual(recebido, esperado, contexto) {
  const a = JSON.stringify(recebido);
  const b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${contexto || 'valor'}: esperado ${b}, recebido ${a}`);
}

function verdade(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

function grupo(nome, fn) {
  console.log(`\n${nome}`);
  fn();
}

/** Placar simples para os testes. */
const p = (gm, gv, extra) => Object.assign({ golsMandante: gm, golsVisitante: gv }, extra || {});

/* --------------------------------------------------- Integridade do seed */

grupo('Seed x fontes', () => {
  teste('48 seleções, 12 grupos de 4', () => {
    igual(dados.selecoes.length, 48, 'total de seleções');
    igual(dados.grupos.length, 12, 'total de grupos');
    dados.grupos.forEach((g) => igual(g.selecoes.length, 4, `grupo ${g.letra}`));
    const todas = dados.grupos.flatMap((g) => g.selecoes);
    igual(new Set(todas).size, 48, 'seleções distintas nos grupos');
  });

  teste('104 jogos distribuídos pelas 7 fases', () => {
    igual(dados.jogos.length, 104, 'total de jogos');
    const porFase = {};
    dados.jogos.forEach((j) => { porFase[j.fase] = (porFase[j.fase] || 0) + 1; });
    igual(porFase, {
      grupos: 72, 'segunda-fase': 16, oitavas: 8, quartas: 4,
      semifinal: 2, 'terceiro-lugar': 1, final: 1
    }, 'jogos por fase');
  });

  teste('cada grupo tem 6 jogos e todo par se enfrenta uma vez', () => {
    dados.grupos.forEach((g) => {
      const jogos = P.jogosDoGrupo(g.letra);
      igual(jogos.length, 6, `jogos do grupo ${g.letra}`);
      const pares = jogos.map((j) => [j.mandanteId, j.visitanteId].sort().join('|'));
      igual(new Set(pares).size, 6, `confrontos distintos no grupo ${g.letra}`);
      jogos.forEach((j) => {
        verdade(g.selecoes.includes(j.mandanteId) && g.selecoes.includes(j.visitanteId),
          `jogo ${j.id} fora do grupo ${g.letra}`);
      });
    });
  });

  teste('jogos ordenados por data e numerados em sequência', () => {
    for (let i = 1; i < dados.jogos.length; i += 1) {
      verdade(dados.jogos[i - 1].dataHora <= dados.jogos[i].dataHora,
        `jogo ${dados.jogos[i].id} fora de ordem cronológica`);
      igual(dados.jogos[i].numero, i + 1, 'numeração');
    }
    igual(dados.jogos[0].dataHora, '2026-06-11T16:00:00', 'primeiro jogo');
    igual(dados.jogos[103].dataHora, '2026-07-19T16:00:00', 'final');
  });

  teste('primeiro jogo e final conferem com as fontes', () => {
    const abertura = dados.jogos[0];
    igual(P.nomeSelecao(abertura.mandanteId), 'México', 'mandante da abertura');
    igual(P.nomeSelecao(abertura.visitanteId), 'África do Sul', 'visitante da abertura');
    igual(P.cidade(abertura.cidadeId).estadio, 'Estádio Azteca', 'estádio da abertura');
    const final = dados.jogos[103];
    igual(final.fase, 'final', 'fase do último jogo');
    igual(P.cidade(final.cidadeId).estadio, 'MetLife Stadium', 'estádio da final');
    igual(P.cidade(dados.jogos.find((j) => j.fase === 'terceiro-lugar').cidadeId).nome, 'Miami', 'sede do 3º lugar');
  });

  teste('todo jogo tem sede válida e todo jogo de grupo tem os dois times', () => {
    dados.jogos.forEach((j) => {
      verdade(!!P.cidade(j.cidadeId), `jogo ${j.id} sem cidade`);
      if (j.fase === 'grupos' || j.fase === 'segunda-fase') {
        verdade(!!P.selecao(j.mandanteId) && !!P.selecao(j.visitanteId), `jogo ${j.id} sem seleções`);
      } else {
        verdade(!!j.vagaMandante && !!j.vagaVisitante, `jogo ${j.id} sem vagas definidas`);
      }
    });
  });

  teste('16 cidades-sede nos três países', () => {
    igual(dados.cidades.length, 16, 'cidades');
    const porPais = {};
    dados.cidades.forEach((c) => { porPais[c.pais] = (porPais[c.pais] || 0) + 1; });
    igual(porPais, { México: 3, EUA: 11, Canadá: 2 }, 'sedes por país');
  });

  teste('todas as 48 seleções têm técnico, elenco e pote', () => {
    dados.selecoes.forEach((s) => {
      verdade(!!s.tecnico, `${s.nome} sem técnico`);
      verdade(P.elenco(s.id).length >= 22, `${s.nome} com elenco incompleto`);
      verdade(s.pote >= 1 && s.pote <= 4, `${s.nome} sem pote`);
      verdade(/^[A-Z]{3}$/.test(s.codigoFifa), `${s.nome} sem código FIFA`);
    });
    igual(dados.jogadores.length, 1238, 'total de jogadores');
    [1, 2, 3, 4].forEach((pote) => {
      igual(dados.selecoes.filter((s) => s.pote === pote).length, 12, `seleções no pote ${pote}`);
    });
  });

  teste('12 cabeças de chave, um por grupo', () => {
    const cabecas = dados.selecoes.filter((s) => s.cabecaDeChave);
    igual(cabecas.length, 12, 'cabeças de chave');
    igual(cabecas.map((s) => s.grupo).sort().join(''), 'ABCDEFGHIJKL', 'um por grupo');
    igual(cabecas.find((s) => s.grupo === 'C').nome, 'Brasil', 'cabeça de chave do grupo C');
    igual(cabecas.find((s) => s.grupo === 'L').nome, 'Inglaterra', 'cabeça de chave do grupo L');
  });
});

/* ---------------------------------------------------------------- RN-01 */

grupo('RN-01 — critérios de desempate na fase de grupos', () => {
  const A = P.grupo('A').selecoes;               // mexico, africa-do-sul, coreia-do-sul, tchequia
  const jogosA = P.jogosDoGrupo('A');
  const entre = (x, y) => jogosA.find((j) =>
    (j.mandanteId === x && j.visitanteId === y) || (j.mandanteId === y && j.visitanteId === x));

  /** Placar orientado: `casa` marca `golsCasa`, independentemente do mando. */
  function placarOrientado(x, y, golsX, golsY) {
    const j = entre(x, y);
    return j.mandanteId === x ? [j.id, p(golsX, golsY)] : [j.id, p(golsY, golsX)];
  }

  teste('grupo sem jogos fica zerado e ordenado pelo ranking FIFA', () => {
    // Empate absoluto: os critérios 1-6 são neutros e sobra o critério 7.
    const t = C.classificarGrupo('A', {});
    t.forEach((l) => igual([l.jogos, l.pontos, l.saldo], [0, 0, 0], `linha de ${l.selecaoId}`));
    igual(t.map((l) => l.selecaoId), ['mexico', 'coreia-do-sul', 'tchequia', 'africa-do-sul'],
      'ordem pelo ranking FIFA (15º, 25º, 39º, 74º)');
  });

  teste('pontos: 3 por vitória, 1 por empate', () => {
    const res = Object.fromEntries([
      placarOrientado(A[0], A[1], 2, 0),   // mexico vence
      placarOrientado(A[2], A[3], 1, 1)    // empate
    ]);
    const t = C.classificarGrupo('A', res);
    const linha = (id) => t.find((l) => l.selecaoId === id);
    igual(linha(A[0]).pontos, 3, 'vencedor');
    igual(linha(A[1]).pontos, 0, 'perdedor');
    igual(linha(A[2]).pontos, 1, 'empate 1');
    igual(linha(A[3]).pontos, 1, 'empate 2');
    igual(linha(A[0]).saldo, 2, 'saldo do vencedor');
    igual(t[0].selecaoId, A[0], 'líder');
  });

  teste('critério 2: saldo de gols desempata pontos iguais', () => {
    const res = Object.fromEntries([
      placarOrientado(A[0], A[1], 1, 0),   // A0 +1
      placarOrientado(A[2], A[3], 5, 0)    // A2 +5
    ]);
    const t = C.classificarGrupo('A', res);
    igual([t[0].selecaoId, t[1].selecaoId], [A[2], A[0]], 'maior saldo primeiro');
  });

  teste('critério 3: gols marcados desempata saldo igual', () => {
    const res = Object.fromEntries([
      placarOrientado(A[0], A[1], 1, 0),   // A0: +1, 1 gol
      placarOrientado(A[2], A[3], 3, 2)    // A2: +1, 3 gols
    ]);
    const t = C.classificarGrupo('A', res);
    igual([t[0].selecaoId, t[1].selecaoId], [A[2], A[0]], 'mais gols marcados primeiro');
  });

  teste('critério 4: confronto direto desempata pontos, saldo e gols iguais', () => {
    // A0 e A1 terminam com 4 pts, saldo 0 e 2 gols marcados cada;
    // só o confronto direto (vitória de A1) os separa.
    const res = Object.fromEntries([
      placarOrientado(A[0], A[1], 0, 1),   // A1 vence o confronto direto
      placarOrientado(A[0], A[2], 2, 1),   // A0 vence
      placarOrientado(A[0], A[3], 0, 0),   // A0 empata
      placarOrientado(A[1], A[2], 0, 1),   // A1 perde
      placarOrientado(A[1], A[3], 1, 1),   // A1 empata
      placarOrientado(A[2], A[3], 2, 2)
    ]);
    const t = C.classificarGrupo('A', res);
    const l0 = t.find((l) => l.selecaoId === A[0]);
    const l1 = t.find((l) => l.selecaoId === A[1]);
    igual([l0.pontos, l0.saldo, l0.golsPro], [4, 0, 2], 'agregado de A0');
    igual([l1.pontos, l1.saldo, l1.golsPro], [4, 0, 2], 'agregado de A1');
    verdade(l1.posicao < l0.posicao, 'quem venceu o confronto direto deve ficar à frente');
  });

  teste('critério 7: ranking FIFA decide o empate total', () => {
    // Sem nenhum jogo entre eles e com todas as estatísticas iguais.
    const res = Object.fromEntries([
      placarOrientado(A[0], A[1], 1, 1),
      placarOrientado(A[2], A[3], 1, 1)
    ]);
    const t = C.classificarGrupo('A', res);
    const ranking = (id) => P.selecao(id).rankingPosicao || 9999;
    for (let i = 1; i < t.length; i += 1) {
      verdade(ranking(t[i - 1].selecaoId) <= ranking(t[i].selecaoId),
        'empate total deve seguir a ordem do ranking FIFA');
    }
    igual(t[0].selecaoId, 'mexico', 'México (15º) à frente de Coreia (25º)');
  });

  teste('critério 6: fair play precede o ranking FIFA', () => {
    const res = Object.fromEntries([
      placarOrientado(A[0], A[1], 1, 1),
      placarOrientado(A[2], A[3], 1, 1)
    ]);
    // México (melhor ranking) recebe mais cartões que a Coreia do Sul.
    const jm = entre(A[0], A[1]);
    res[jm.id] = Object.assign({}, res[jm.id], {
      [jm.mandanteId === A[0] ? 'cartoesMandante' : 'cartoesVisitante']: 5
    });
    const t = C.classificarGrupo('A', res);
    verdade(t.findIndex((l) => l.selecaoId === A[2]) < t.findIndex((l) => l.selecaoId === A[0]),
      'menos cartões deve passar à frente mesmo com ranking pior');
  });

  teste('classificação completa de um grupo produz 4 posições distintas', () => {
    const res = Object.fromEntries([
      placarOrientado(A[0], A[1], 3, 0),
      placarOrientado(A[2], A[3], 1, 0),
      placarOrientado(A[0], A[2], 2, 1),
      placarOrientado(A[1], A[3], 0, 2),
      placarOrientado(A[0], A[3], 1, 0),
      placarOrientado(A[1], A[2], 1, 2)
    ]);
    const t = C.classificarGrupo('A', res);
    igual(t.map((l) => l.posicao), [1, 2, 3, 4], 'posições');
    igual(t.map((l) => l.jogos), [3, 3, 3, 3], 'jogos por seleção');
    igual(t[0].selecaoId, A[0], 'líder com 9 pontos');
    igual(t[0].pontos, 9, 'pontos do líder');
    const info = C.situacoes('A', t, res, C.melhoresTerceiros({ A: t }));
    igual(info.completo, true, 'grupo completo');
    igual(info.todosCompletos, false, 'os outros 11 grupos seguem em aberto');
    igual(info.situacoes[t[0].selecaoId], 'classificado', 'líder classificado');
    igual(info.situacoes[t[3].selecaoId], 'eliminado', 'lanterna eliminado');
    igual(info.situacoes[t[2].selecaoId], 'terceiro',
      '3º fica indefinido enquanto os demais grupos não terminarem');
  });

  teste('vaga do 3º só se decide com os 12 grupos encerrados', () => {
    const res = {};
    dados.jogos.filter((j) => j.fase === 'grupos').forEach((j, i) => { res[j.id] = p(i % 4, (i + 2) % 3); });
    const classificacoes = C.classificarTodos(res);
    const terceiros = C.melhoresTerceiros(classificacoes);

    const estados = P.dados.grupos.map((g) => {
      const info = C.situacoes(g.letra, classificacoes[g.letra], res, terceiros);
      igual(info.todosCompletos, true, `grupo ${g.letra}: todos completos`);
      return info.situacoes[classificacoes[g.letra][2].selecaoId];
    });
    igual(estados.filter((e) => e === 'classificado-terceiro').length, 8, 'terceiros que avançam');
    igual(estados.filter((e) => e === 'eliminado').length, 4, 'terceiros eliminados');
  });
});

/* --------------------------------------------------- RN-02 e terceiros */

grupo('RN-02 — avanço da fase de grupos', () => {
  /** Preenche os 72 jogos com um placar deterministico. */
  function torneioCompleto(gerador) {
    const res = {};
    dados.jogos.filter((j) => j.fase === 'grupos').forEach((j, i) => { res[j.id] = gerador(j, i); });
    return res;
  }

  teste('exatamente 8 dos 12 terceiros avançam', () => {
    const res = torneioCompleto((j, i) => p((i * 7) % 4, (i * 3) % 3));
    const classificacoes = C.classificarTodos(res);
    const terceiros = C.melhoresTerceiros(classificacoes);
    igual(terceiros.length, 12, 'terceiros colocados');
    igual(terceiros.filter((t) => t.classificado).length, 8, 'terceiros que avançam');
    igual(terceiros.map((t) => t.ordem), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'ordem');
  });

  teste('24 primeiros/segundos + 8 terceiros = 32 classificados', () => {
    const res = torneioCompleto((j, i) => p((i * 5) % 5, (i * 2) % 4));
    const classificacoes = C.classificarTodos(res);
    const terceiros = C.melhoresTerceiros(classificacoes);
    const avancam = new Set();
    Object.keys(classificacoes).forEach((letra) => {
      avancam.add(classificacoes[letra][0].selecaoId);
      avancam.add(classificacoes[letra][1].selecaoId);
    });
    terceiros.filter((t) => t.classificado).forEach((t) => avancam.add(t.selecaoId));
    igual(avancam.size, 32, 'total de classificados');
  });

  teste('terceiros ordenados por pontos, saldo e gols marcados', () => {
    const res = torneioCompleto((j, i) => p(i % 4, (i + 1) % 3));
    const terceiros = C.melhoresTerceiros(C.classificarTodos(res));
    for (let i = 1; i < terceiros.length; i += 1) {
      const a = terceiros[i - 1];
      const b = terceiros[i];
      const ordenado = a.pontos > b.pontos
        || (a.pontos === b.pontos && a.saldo > b.saldo)
        || (a.pontos === b.pontos && a.saldo === b.saldo && a.golsPro >= b.golsPro);
      verdade(ordenado, `terceiros fora de ordem entre ${a.selecaoId} e ${b.selecaoId}`);
    }
  });

  teste('um terceiro colocado de cada grupo, sempre na 3ª posição', () => {
    const res = torneioCompleto((j, i) => p(i % 3, i % 2));
    const classificacoes = C.classificarTodos(res);
    const terceiros = C.melhoresTerceiros(classificacoes);
    igual(terceiros.map((t) => t.grupo).sort().join(''), 'ABCDEFGHIJKL', 'um por grupo');
    terceiros.forEach((t) => igual(t.posicao, 3, `posição do terceiro do grupo ${t.grupo}`));
  });
});

/* ---------------------------------------------------------------- RN-03 */

grupo('RN-03 e chaveamento', () => {
  const idPorChave = (chave) => P.jogoPorChave.get(chave).id;

  teste('vencedor no tempo normal avança sem pênaltis', () => {
    const res = { [idPorChave('SF1')]: p(2, 1) };
    const chaves = M.resolver(res);
    const sf1 = chaves.get('SF1');
    igual(P.nomeSelecao(sf1.vencedorId), 'Alemanha', 'vencedor de SF1');
    igual(P.nomeSelecao(sf1.perdedorId), 'Paraguai', 'perdedor de SF1');
    igual(sf1.pendentePenaltis, false, 'não deve pedir pênaltis');
  });

  teste('empate sem pênaltis deixa o confronto indefinido', () => {
    const chaves = M.resolver({ [idPorChave('SF1')]: p(1, 1) });
    const sf1 = chaves.get('SF1');
    igual(sf1.vencedorId, null, 'sem vencedor');
    igual(sf1.pendentePenaltis, true, 'aguardando pênaltis');
    igual(chaves.get('OI1').mandanteId, null, 'oitavas ainda sem time');
  });

  teste('pênaltis definem quem avança (RN-03)', () => {
    const chaves = M.resolver({
      [idPorChave('SF1')]: p(1, 1, { penaltisMandante: 3, penaltisVisitante: 4 })
    });
    const sf1 = chaves.get('SF1');
    igual(P.nomeSelecao(sf1.vencedorId), 'Paraguai', 'vencedor nos pênaltis');
    igual(sf1.pendentePenaltis, false, 'decidido');
    igual(chaves.get('OI1').mandanteId, sf1.vencedorId, 'vencedor propagado para as oitavas');
  });

  teste('empate nos pênaltis não decide nada', () => {
    const chaves = M.resolver({
      [idPorChave('SF1')]: p(0, 0, { penaltisMandante: 3, penaltisVisitante: 3 })
    });
    igual(chaves.get('SF1').vencedorId, null, 'sem vencedor');
    igual(chaves.get('SF1').pendentePenaltis, true, 'segue pendente');
  });

  teste('vencedores encadeiam Segunda Fase → Oitavas → Quartas → Semi → Final', () => {
    // O mandante vence todos os 40 jogos do mata-mata.
    const res = {};
    dados.jogos.filter((j) => j.chaveId).forEach((j) => { res[j.id] = p(1, 0); });
    const chaves = M.resolver(res);

    igual(P.nomeSelecao(chaves.get('OI1').mandanteId), P.nomeSelecao(chaves.get('SF1').vencedorId), 'OI1 mandante');
    igual(P.nomeSelecao(chaves.get('OI1').visitanteId), P.nomeSelecao(chaves.get('SF2').vencedorId), 'OI1 visitante');
    igual(chaves.get('QF1').mandanteId, chaves.get('OI1').vencedorId, 'QF1 mandante');
    igual(chaves.get('SE1').mandanteId, chaves.get('QF1').vencedorId, 'SE1 mandante');
    igual(chaves.get('FI1').mandanteId, chaves.get('SE1').vencedorId, 'final mandante');

    const podio = M.podio(chaves);
    // SE1 vem de SF1 (Alemanha) e SE2 vem de SF9 (Brasil).
    igual(P.nomeSelecao(podio.campeaoId), 'Alemanha', 'campeão com mandante sempre vencendo');
    igual(P.nomeSelecao(podio.viceId), 'Brasil', 'vice');
    igual(P.nomeSelecao(podio.terceiroId), P.nomeSelecao(chaves.get('SE1').perdedorId), '3º lugar');
  });

  teste('disputa de 3º lugar usa os perdedores das semifinais', () => {
    const res = {};
    dados.jogos.filter((j) => j.chaveId).forEach((j) => { res[j.id] = p(1, 0); });
    const chaves = M.resolver(res);
    const tl = chaves.get('TL1');
    igual(tl.mandanteId, chaves.get('SE1').perdedorId, 'mandante do 3º lugar');
    igual(tl.visitanteId, chaves.get('SE2').perdedorId, 'visitante do 3º lugar');
  });

  teste('todas as 32 seleções da Segunda Fase estão definidas na fonte', () => {
    const chaves = M.resolver({});
    const times = [];
    for (let i = 1; i <= 16; i += 1) {
      const c = chaves.get(`SF${i}`);
      verdade(!!c, `SF${i} ausente`);
      verdade(!!c.mandanteId && !!c.visitanteId, `SF${i} sem times`);
      times.push(c.mandanteId, c.visitanteId);
    }
    igual(times.length, 32, 'times na Segunda Fase');
    igual(new Set(times).size, 32, 'sem repetição');
  });

  teste('caminho até a final tem 5 confrontos para o campeão', () => {
    const res = {};
    dados.jogos.filter((j) => j.chaveId).forEach((j) => { res[j.id] = p(1, 0); });
    const chaves = M.resolver(res);
    const podio = M.podio(chaves);
    const caminho = M.caminho(chaves, podio.campeaoId);
    igual(caminho.length, 5, 'Segunda Fase, oitavas, quartas, semi e final');
    igual(caminho.map((c) => c.jogo.fase),
      ['segunda-fase', 'oitavas', 'quartas', 'semifinal', 'final'], 'sequência de fases');
    caminho.forEach((c) => igual(c.vencedorId, podio.campeaoId, 'campeão venceu todos'));
  });

  teste('placar parcial não decide o confronto', () => {
    const chaves = M.resolver({ [idPorChave('SF1')]: { golsMandante: 2 } });
    igual(chaves.get('SF1').vencedorId, null, 'placar incompleto não conta');
  });
});

/* ----------------------------------------------------------- Conclusao */

console.log(`\n${passou} teste(s) ok, ${falhas.length} falha(s).`);
process.exit(falhas.length ? 1 : 0);
