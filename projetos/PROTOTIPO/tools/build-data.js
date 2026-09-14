#!/usr/bin/env node
/**
 * Gera o seed do PortalCopa26 (data/copa2026.js) a partir dos arquivos
 * de ./fontes, que sao a fonte da verdade do dominio.
 *
 * Uso: node tools/build-data.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const CATALOGO = require('./selecoes');

const RAIZ = path.resolve(__dirname, '..');
const FONTES = path.join(RAIZ, 'fontes');
const SAIDA = path.join(RAIZ, 'data', 'copa2026.js');

const avisos = [];

function ler(arquivo) {
  return fs.readFileSync(path.join(FONTES, arquivo), 'utf8').replace(/\r\n/g, '\n');
}

/** Normaliza texto para comparacao: sem acentos, minusculo, espacos colapsados. */
function chave(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // Letras que o NFD nao decompoe (turco, nordico, eslavo).
    .replace(/ı/g, 'i').replace(/ø/g, 'o').replace(/đ/g, 'd')
    .replace(/ł/g, 'l').replace(/ß/g, 'ss').replace(/æ/g, 'ae')
    .replace(/[’‘'`´]/g, "'")
    .replace(/[“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ------------------------------------------------------------------ *
 * 1. Selecoes: catalogo + cabecas de chave + tecnicos + ranking FIFA
 * ------------------------------------------------------------------ */

const selecoes = CATALOGO.map((s) => ({
  id: s.id,
  nome: s.nome,
  grupo: s.grupo,
  codigoFifa: s.codigoFifa,
  confederacao: s.confederacao,
  cabecaDeChave: false,
  pote: null,
  tecnico: null,
  rankingPosicao: null,
  rankingPontos: null
}));

const porId = new Map(selecoes.map((s) => [s.id, s]));

/** Indice nome-normalizado -> id, cobrindo nome canonico e aliases. */
const indiceNomes = new Map();
for (const s of CATALOGO) {
  indiceNomes.set(chave(s.nome), s.id);
  for (const alias of s.aliases) indiceNomes.set(chave(alias), s.id);
}

function resolverSelecao(nome, contexto) {
  const id = indiceNomes.get(chave(nome));
  if (!id) avisos.push(`Selecao nao reconhecida: "${nome}" (${contexto})`);
  return id || null;
}

// --- cabecas de chave (fontes/copa2026_cabecas-chave.txt) ---
// O arquivo lista 11 dos 12 grupos; o cabeca de chave e, por definicao do
// proprio arquivo, a selecao que abre a linha do grupo em copa2026_grupos.txt.
const cabecasDeChaveDeclaradas = new Map();
for (const linha of ler('copa2026_cabecas-chave.txt').split('\n')) {
  const campos = linha.split('\t').map((c) => c.trim()).filter(Boolean);
  if (campos.length === 3 && /^\d+$/.test(campos[0]) && /^[A-L]$/.test(campos[2])) {
    cabecasDeChaveDeclaradas.set(campos[2], campos[1]);
  }
}

/* ------------------------------------------------------------------ *
 * 2. Grupos (fontes/copa2026_grupos.txt)
 * ------------------------------------------------------------------ */

const grupos = [];
for (const linha of ler('copa2026_grupos.txt').split('\n')) {
  const m = linha.match(/^([A-L])\t(.+)$/);
  if (!m) continue;
  const letra = m[1];
  // A fonte separa as colunas por tabulacao, mas "Estados\tUnidos" quebra o
  // nome no meio: juntamos tokens vizinhos ate formarem uma selecao conhecida.
  const tokens = m[2].split(/\t+/).map((n) => n.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const ids = [];
  for (let t = 0; t < tokens.length; t += 1) {
    let nome = tokens[t];
    while (!indiceNomes.has(chave(nome)) && t + 1 < tokens.length) {
      t += 1;
      nome = `${nome} ${tokens[t]}`;
    }
    const id = resolverSelecao(nome, `grupo ${letra}`);
    if (id) ids.push(id);
  }
  if (ids.length !== 4) avisos.push(`Grupo ${letra} com ${ids.length} selecoes`);
  ids.forEach((id) => {
    porId.get(id).grupo = letra;
  });
  // Pote 1 = cabeca de chave = primeira selecao da linha do grupo.
  porId.get(ids[0]).cabecaDeChave = true;
  const declarado = cabecasDeChaveDeclaradas.get(letra);
  if (declarado && resolverSelecao(declarado, 'cabecas-chave') !== ids[0]) {
    avisos.push(`Cabeca de chave divergente no grupo ${letra}`);
  }
  grupos.push({ letra, selecoes: ids });
}

/* ------------------------------------------------------------------ *
 * 3. Tecnicos (fontes/copa2026_pais_tecnicos.txt)
 * ------------------------------------------------------------------ */

for (const linha of ler('copa2026_pais_tecnicos.txt').split('\n')) {
  if (!linha.includes('|')) continue;
  const [pais, tecnico] = linha.split('|').map((t) => t.trim());
  const id = resolverSelecao(pais, 'tecnicos');
  if (id) porId.get(id).tecnico = tecnico;
}

/* ------------------------------------------------------------------ *
 * 4. Ranking FIFA (fontes/copa2026_ranking_fifa.txt)
 * ------------------------------------------------------------------ */

const rankingFifa = [];
for (const linha of ler('copa2026_ranking_fifa.txt').split('\n')) {
  // "1\tArgentina\t1877.72" e tambem "39\tRepública Tcheca1510.15" (sem separador)
  const m = linha.match(/^(\d+)\s+(.+?)\s*(\d{3,4}\.\d{2})\s*$/);
  if (!m) continue;
  const posicao = Number(m[1]);
  const nome = m[2].replace(/\s+$/, '').trim();
  const pontos = Number(m[3]);
  const id = indiceNomes.get(chave(nome)) || null;
  rankingFifa.push({ posicao, nome, pontos, selecaoId: id });
  if (id) {
    porId.get(id).rankingPosicao = posicao;
    porId.get(id).rankingPontos = pontos;
  }
}

/* ------------------------------------------------------------------ *
 * 5. Potes (RF-03)
 * Pote 1 = os 12 cabecas de chave. Potes 2 a 4 = as 36 restantes ordenadas
 * pelo ranking FIFA (fonte: copa2026_ranking_fifa.txt), 12 por pote.
 * Selecoes ausentes do ranking vao para o fim da ordem.
 * ------------------------------------------------------------------ */

selecoes.filter((s) => s.cabecaDeChave).forEach((s) => {
  s.pote = 1;
});

const restantes = selecoes
  .filter((s) => !s.cabecaDeChave)
  .sort((a, b) => (a.rankingPosicao ?? 999) - (b.rankingPosicao ?? 999));
restantes.forEach((s, i) => {
  s.pote = 2 + Math.floor(i / 12);
});

/* ------------------------------------------------------------------ *
 * 6. Cidades-sede e estadios
 *    (copa2026_cidades_sede_estadios.txt + copa2026_estadios.txt)
 * ------------------------------------------------------------------ */

const cidades = [];
for (const linha of ler('copa2026_cidades_sede_estadios.txt').split('\n')) {
  const m = linha.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
  if (!m || m[1] === 'Cidade' || /^-+$/.test(m[1])) continue;
  cidades.push({
    id: chave(m[1]).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    nome: m[1],
    pais: m[2],
    estadio: m[3],
    capacidade: Number(m[4].replace(/[^\d]/g, '')),
    capacidadeAproximada: m[4].includes('*')
  });
}

/**
 * Apelidos de sede usados nos arquivos de jogos.
 *
 * Os 16 rotulos "Estadio de X (X)" da primeira fase mapeiam 1:1 nas 16
 * cidades-sede; "Santa Clara" e a unica sobra e casa com a unica cidade sem
 * correspondente direto (San Francisco / Levi's Stadium, na Area da Baia
 * segundo copa2026_estadios.txt). Os arquivos de mata-mata usam formas curtas
 * ("Azteca", "Nova Jersey", "Seattle Field", "Vancouver Place").
 */
const APELIDOS_SEDE = {
  'santa clara': 'san-francisco',
  'nova iorque': 'nova-york-new-jersey',
  'nova iorque/nova jersey': 'nova-york-new-jersey',
  'nova york/nova jersey': 'nova-york-new-jersey',
  'nova jersey': 'nova-york-new-jersey',
  'azteca': 'cidade-do-mexico',
  'seattle field': 'seattle',
  'vancouver place': 'vancouver',
  'filadelfia': 'filadelfia'
};

const indiceCidades = new Map(cidades.map((c) => [chave(c.nome), c.id]));

function resolverCidade(rotulo, contexto) {
  const k = chave(rotulo);
  const id = APELIDOS_SEDE[k] || (indiceCidades.has(k) ? indiceCidades.get(k) : null);
  if (!id) avisos.push(`Sede nao reconhecida: "${rotulo}" (${contexto})`);
  return id;
}

/* ------------------------------------------------------------------ *
 * 7. Fases (fontes/copa2026_fases.txt)
 * ------------------------------------------------------------------ */

const fases = [];
for (const linha of ler('copa2026_fases.txt').split('\n')) {
  const m = linha.match(/^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*$/);
  if (!m) continue;
  fases.push({ nome: m[1], times: Number(m[2]), jogos: Number(m[3]), datas: m[4] });
}

/* ------------------------------------------------------------------ *
 * 8. Jogos
 * ------------------------------------------------------------------ */

const MESES = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
};

const pad = (n) => String(n).padStart(2, '0');
const iso = (a, m, d, hh, mm) => `${a}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00`;

const jogos = [];
let seqJogo = 0;

function novoJogo(j) {
  seqJogo += 1;
  jogos.push(Object.assign({ id: `J${pad(seqJogo)}`, numero: seqJogo }, j));
}

// --- 8.1 Primeira fase (72 jogos) ---
{
  const linhas = ler('copa2026_jogos_primeira_fase.txt').split('\n');
  let dataBloco = null;

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i].trim();
    if (!linha || /^-+$/.test(linha)) continue;

    const cab = linha.match(/^\S+-feira|^s[áa]bado|^domingo/i)
      ? linha.match(/^(\S+)\s+(\d{1,2})\s+([a-zç]+)\s+(\d{4})$/i)
      : null;
    if (cab) {
      dataBloco = { dia: Number(cab[2]), mes: MESES[chave(cab[3])], ano: Number(cab[4]) };
      continue;
    }

    const partida = linha.match(/^(.+?)\s+x\s+(.+?)\s{2,}(\d{2}):(\d{2})\s*hs(?:\s*\((\d{1,2}) de ([a-zç]+)\))?$/i);
    if (!partida) continue;

    const detalhe = (linhas[i + 1] || '').trim();
    const det = detalhe.match(/^Primeira fase\s*·\s*Grupo ([A-L])\s*·\s*(.+?)\s*\((.+?)\)$/);
    if (!det) {
      avisos.push(`Detalhe de jogo ilegivel na primeira fase: "${detalhe}"`);
      continue;
    }

    // "01:00 hs (14 de junho)" => o jogo cai no dia seguinte ao bloco.
    const dia = partida[5] ? Number(partida[5]) : dataBloco.dia;
    const mes = partida[6] ? MESES[chave(partida[6])] : dataBloco.mes;

    novoJogo({
      fase: 'grupos',
      faseNome: 'Fase de Grupos',
      grupo: det[1],
      mandanteId: resolverSelecao(partida[1], 'primeira fase'),
      visitanteId: resolverSelecao(partida[2], 'primeira fase'),
      cidadeId: resolverCidade(det[3], 'primeira fase'),
      dataHora: iso(dataBloco.ano, mes, dia, Number(partida[3]), Number(partida[4])),
      // Data do bloco na fonte: o jogo da madrugada e listado no dia anterior.
      dataListagem: iso(dataBloco.ano, dataBloco.mes, dataBloco.dia, 0, 0).slice(0, 10)
    });
  }
}

// --- 8.2 Segunda fase / 32 avos (16 jogos, confrontos definidos na fonte) ---
{
  const blocos = ler('copa2026_Jogos_Segunda_fase.txt')
    .split(/\n(?=Segundafase\s+\d+)/)
    .map((b) => b.trim())
    .filter(Boolean);

  const parsed = blocos.map((bloco) => {
    const l = bloco.split('\n').map((x) => x.trim()).filter(Boolean);
    const ordem = Number(l[0].match(/Segundafase\s+(\d+)/)[1]);
    const loc = l[1].match(/^(.+?)\s{2,}(\d{2})\/(\d{2})\s+\S+\s+(\d{2}):(\d{2})$/);
    const par = l[2].split(/\s+x\s+/i).map((t) => t.trim());
    return {
      ordem,
      cidade: loc[1].trim(),
      dia: Number(loc[2]),
      mes: Number(loc[3]),
      hh: Number(loc[4]),
      mm: Number(loc[5]),
      mandante: par[0],
      visitante: par[1]
    };
  });

  // A fonte lista os confrontos fora de ordem; ordenamos por data/hora reais.
  parsed
    .slice()
    .sort((a, b) => (a.mes - b.mes) || (a.dia - b.dia) || (a.hh - b.hh) || (a.mm - b.mm))
    .forEach((p) => {
      novoJogo({
        fase: 'segunda-fase',
        faseNome: 'Segunda Fase',
        chaveId: `SF${p.ordem}`,
        ordemChave: p.ordem,
        grupo: null,
        mandanteId: resolverSelecao(p.mandante, 'segunda fase'),
        visitanteId: resolverSelecao(p.visitante, 'segunda fase'),
        cidadeId: resolverCidade(p.cidade, 'segunda fase'),
        dataHora: iso(2026, p.mes, p.dia, p.hh, p.mm),
        dataListagem: iso(2026, p.mes, p.dia, 0, 0).slice(0, 10)
      });
    });
}

// --- 8.3 Mata-mata com vagas definidas por vencedor/perdedor ---
/**
 * Le arquivos no formato:
 *   <Rotulo> <n>
 *   <Sede> <dd>/<mm> <DiaSemana> <hh>:<mm>
 *   <Vaga A> x <Vaga B>
 */
function lerMataMata(arquivo, config) {
  const blocos = ler(arquivo)
    .split(new RegExp(`\\n(?=${config.rotulo}\\s*\\d*)`))
    .map((b) => b.trim())
    .filter(Boolean);

  const parsed = blocos.map((bloco) => {
    const l = bloco.split('\n').map((x) => x.trim()).filter(Boolean);
    const ordem = Number((l[0].match(/(\d+)\s*$/) || [, '1'])[1]);
    const resto = l.slice(1).join(' ');
    const loc = resto.match(/^(.+?)\s+(\d{2})\/(\d{2})\D+?(\d{1,2}):(\d{2})/);
    const linhaPar = l[l.length - 1];
    const par = linhaPar.split(/\s+x\s+/i).map((t) => t.trim());
    return {
      ordem,
      cidade: loc[1].trim(),
      dia: Number(loc[2]),
      mes: Number(loc[3]),
      hh: Number(loc[4]),
      mm: Number(loc[5]),
      vagaA: par[0],
      vagaB: par[1]
    };
  });

  parsed
    .slice()
    .sort((a, b) => (a.mes - b.mes) || (a.dia - b.dia) || (a.hh - b.hh) || (a.mm - b.mm))
    .forEach((p) => {
      novoJogo({
        fase: config.fase,
        faseNome: config.faseNome,
        chaveId: `${config.prefixo}${p.ordem}`,
        ordemChave: p.ordem,
        grupo: null,
        mandanteId: null,
        visitanteId: null,
        vagaMandante: config.vaga(p.vagaA),
        vagaVisitante: config.vaga(p.vagaB),
        cidadeId: resolverCidade(p.cidade, config.fase),
        dataHora: iso(2026, p.mes, p.dia, p.hh, p.mm),
        dataListagem: iso(2026, p.mes, p.dia, 0, 0).slice(0, 10)
      });
    });
}

/** "Venc. Segundafase 3" -> { tipo:'vencedor', chaveId:'SF3' } */
function referenciaVaga(texto) {
  const t = chave(texto);
  const tipo = t.startsWith('perd') ? 'perdedor' : 'vencedor';
  const n = Number((t.match(/(\d+)\s*$/) || [, 0])[1]);
  let prefixo = null;
  if (t.includes('segundafase')) prefixo = 'SF';
  else if (t.includes('oitavas')) prefixo = 'OI';
  else if (t.includes('quartas')) prefixo = 'QF';
  else if (t.includes('semifinal')) prefixo = 'SE';
  if (!prefixo) {
    avisos.push(`Vaga de mata-mata nao reconhecida: "${texto}"`);
    return null;
  }
  return { tipo, chaveId: `${prefixo}${n}`, rotulo: texto };
}

lerMataMata('copa2026_jogos_oitavas.txt', {
  rotulo: 'Oitavas', prefixo: 'OI', fase: 'oitavas', faseNome: 'Oitavas de Final', vaga: referenciaVaga
});
lerMataMata('copa2026_jogos_quartas.txt', {
  rotulo: 'Quartas', prefixo: 'QF', fase: 'quartas', faseNome: 'Quartas de Final', vaga: referenciaVaga
});
lerMataMata('copa2026_jogos_semifinal.txt', {
  rotulo: 'Semifinal', prefixo: 'SE', fase: 'semifinal', faseNome: 'Semifinais', vaga: referenciaVaga
});
lerMataMata('copa2026_jogo_terceiro_lugar.txt', {
  rotulo: 'Terceiro lugar', prefixo: 'TL', fase: 'terceiro-lugar', faseNome: 'Disputa de 3º Lugar', vaga: referenciaVaga
});
lerMataMata('copa2026_jogo_final.txt', {
  rotulo: 'Final', prefixo: 'FI', fase: 'final', faseNome: 'Final', vaga: referenciaVaga
});

jogos.sort((a, b) => a.dataHora.localeCompare(b.dataHora) || a.numero - b.numero);
jogos.forEach((j, i) => {
  j.numero = i + 1;
  j.id = `J${pad(i + 1)}`;
});

/* ------------------------------------------------------------------ *
 * 9. Elencos
 *    Base: copa2026_selecoes_jogadores.txt (nome|idade|posicao|gols)
 *    Clube: selecoes_jogadores_convocados.txt (nome (clube-PAIS))
 * ------------------------------------------------------------------ */

// 9.1 clubes por selecao
const clubesPorSelecao = new Map(); // selecaoId -> Map(chaveNome -> clube)
{
  const linhas = ler('selecoes_jogadores_convocados.txt').split('\n');
  let atual = null;

  for (const bruta of linhas) {
    const linha = bruta.trim();
    if (!linha) continue;
    if (/^Grupo [A-L]$/.test(linha) || /^Confira as sele/i.test(linha)) continue;

    // Os rotulos de posicao variam entre selecoes ("Volantes",
    // "Meio-campeistas", ...); aceitamos qualquer "Rotulo: lista (clube-PAIS)".
    const posicional = linha.match(/^([A-Za-zÀ-ÿ\- ]{4,25})\s*:\s*(.+\(.+\).*)$/);
    if (posicional) {
      if (!atual) continue;
      const lista = posicional[2].replace(/[;.]\s*$/, '');
      for (const bruto of lista.split(/,\s*|\s+e\s+/)) {
        const m = bruto.trim().match(/^(.+?)\s*\(([^)]+)\)/);
        if (!m) continue;
        const clube = m[2].replace(/-[A-Z]{2,4}$/, '').trim();
        clubesPorSelecao.get(atual).set(chave(m[1]), clube);
      }
      continue;
    }

    // Cabecalho de selecao
    const id = indiceNomes.get(chave(linha));
    if (id) {
      atual = id;
      if (!clubesPorSelecao.has(id)) clubesPorSelecao.set(id, new Map());
    }
  }
}

/** Casa nomes com grafias levemente diferentes entre as duas fontes. */
function acharClube(mapa, nome) {
  if (!mapa) return null;
  const k = chave(nome);
  if (mapa.has(k)) return mapa.get(k);

  const partes = k.split(' ').filter((p) => p.length > 2);
  const primeiro = partes[0];
  const ultimo = partes[partes.length - 1];

  for (const [outro, clube] of mapa) {
    if (outro.includes(k) || k.includes(outro)) return clube;
    const op = outro.split(' ').filter((p) => p.length > 2);
    if (op.length && primeiro && ultimo &&
        op[op.length - 1] === ultimo && op[0] === primeiro) return clube;
  }

  // Fallback: sobrenome unico dentro da mesma selecao (ex.: "Sabitzer" na
  // fonte de elencos vs. "Marcel Sabitzer" na fonte de convocados).
  if (!ultimo) return null;
  const candidatos = [...mapa].filter(([outro]) => {
    const op = outro.split(' ');
    return op[op.length - 1] === ultimo || op.includes(ultimo);
  });
  return candidatos.length === 1 ? candidatos[0][1] : null;
}

const jogadores = [];
{
  const linhas = ler('copa2026_selecoes_jogadores.txt').split('\n');
  let atual = null;
  let seq = 0;

  for (const bruta of linhas) {
    const linha = bruta.trim();
    if (!linha) continue;

    if (linha.startsWith('#')) {
      atual = resolverSelecao(linha.replace(/^#\s*/, ''), 'elencos');
      continue;
    }
    const campos = linha.split('|');
    if (campos.length < 4 || !atual) continue;

    seq += 1;
    const nome = campos[0].trim();
    jogadores.push({
      id: `P${String(seq).padStart(4, '0')}`,
      selecaoId: atual,
      nome,
      idade: Number(campos[1]),
      posicao: campos[2].trim(),
      gols: Number(campos[3]),
      clube: acharClube(clubesPorSelecao.get(atual), nome)
    });
  }
}

/* ------------------------------------------------------------------ *
 * 10. Consistencia + escrita
 * ------------------------------------------------------------------ */

const semClube = jogadores.filter((j) => !j.clube).length;
const contagem = {
  selecoes: selecoes.length,
  grupos: grupos.length,
  cidades: cidades.length,
  jogadores: jogadores.length,
  jogadoresSemClube: semClube,
  jogos: jogos.length,
  jogosPorFase: jogos.reduce((acc, j) => {
    acc[j.fase] = (acc[j.fase] || 0) + 1;
    return acc;
  }, {})
};

const primeiroJogo = jogos[0];

const seed = {
  meta: {
    nome: 'PortalCopa26',
    torneio: 'Copa do Mundo FIFA 2026',
    lema: 'We Are 26',
    paisesSede: ['Canadá', 'Estados Unidos', 'México'],
    // Logo do torneio conforme exemplo do PRD (secao 11).
    logoUrl: 'https://api.fifa.com/api/v3/picture/tournaments-sq-4/285023',
    bandeiraUrlBase: 'https://api.fifa.com/api/v3/picture/flags-sq-4/',
    fusoHorario: 'Horário de Brasília',
    primeiroJogo: primeiroJogo.dataHora,
    estatisticas: {
      selecoes: selecoes.length,
      grupos: grupos.length,
      cidades: cidades.length,
      jogos: jogos.length
    },
    geradoEm: new Date().toISOString()
  },
  fases,
  cidades,
  selecoes,
  grupos,
  rankingFifa,
  jogadores,
  jogos,
  contagem
};

const cabecalho = `/**
 * PortalCopa26 - seed de dados.
 *
 * ARQUIVO GERADO. Nao edite a mao.
 * Origem: ./fontes/*.txt  |  Gerador: node tools/build-data.js
 */
`;

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(
  SAIDA,
  `${cabecalho}window.COPA2026 = ${JSON.stringify(seed, null, 2)};\n`,
  'utf8'
);

console.log('Seed gerado em data/copa2026.js');
console.log(JSON.stringify(contagem, null, 2));
if (avisos.length) {
  console.log(`\n${avisos.length} aviso(s):`);
  [...new Set(avisos)].forEach((a) => console.log(`  - ${a}`));
} else {
  console.log('\nSem avisos.');
}
