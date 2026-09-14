/**
 * Catalogo canonico das 48 selecoes.
 *
 * - `nome`, `grupo` e a ordem dentro do grupo vem de fontes/copa2026_grupos.txt.
 * - `aliases` reune as grafias alternativas usadas nas demais fontes
 *   (fixtures, tecnicos, ranking, elencos e convocados).
 * - `codigoFifa` e o codigo de 3 letras usado na API publica de bandeiras
 *   citada no PRD (https://api.fifa.com/api/v3/picture/flags-sq-4/{codigo}).
 * - `confederacao` alimenta o card de selecao exigido pelo RF-04.
 */
module.exports = [
  { id: 'mexico', nome: 'México', grupo: 'A', codigoFifa: 'MEX', confederacao: 'CONCACAF', aliases: [] },
  { id: 'africa-do-sul', nome: 'África do Sul', grupo: 'A', codigoFifa: 'RSA', confederacao: 'CAF', aliases: [] },
  { id: 'coreia-do-sul', nome: 'Coreia do Sul', grupo: 'A', codigoFifa: 'KOR', confederacao: 'AFC', aliases: ['República da Coreia'] },
  { id: 'tchequia', nome: 'República Tcheca', grupo: 'A', codigoFifa: 'CZE', confederacao: 'UEFA', aliases: ['Tchéquia'] },

  { id: 'canada', nome: 'Canadá', grupo: 'B', codigoFifa: 'CAN', confederacao: 'CONCACAF', aliases: [] },
  { id: 'bosnia', nome: 'Bósnia e Herzegovina', grupo: 'B', codigoFifa: 'BIH', confederacao: 'UEFA', aliases: ['Bósnia'] },
  { id: 'catar', nome: 'Catar', grupo: 'B', codigoFifa: 'QAT', confederacao: 'AFC', aliases: [] },
  { id: 'suica', nome: 'Suíça', grupo: 'B', codigoFifa: 'SUI', confederacao: 'UEFA', aliases: [] },

  { id: 'brasil', nome: 'Brasil', grupo: 'C', codigoFifa: 'BRA', confederacao: 'CONMEBOL', aliases: [] },
  { id: 'marrocos', nome: 'Marrocos', grupo: 'C', codigoFifa: 'MAR', confederacao: 'CAF', aliases: [] },
  { id: 'haiti', nome: 'Haiti', grupo: 'C', codigoFifa: 'HAI', confederacao: 'CONCACAF', aliases: [] },
  { id: 'escocia', nome: 'Escócia', grupo: 'C', codigoFifa: 'SCO', confederacao: 'UEFA', aliases: [] },

  { id: 'estados-unidos', nome: 'Estados Unidos', grupo: 'D', codigoFifa: 'USA', confederacao: 'CONCACAF', aliases: ['EUA'] },
  { id: 'paraguai', nome: 'Paraguai', grupo: 'D', codigoFifa: 'PAR', confederacao: 'CONMEBOL', aliases: [] },
  { id: 'australia', nome: 'Austrália', grupo: 'D', codigoFifa: 'AUS', confederacao: 'AFC', aliases: [] },
  { id: 'turquia', nome: 'Turquia', grupo: 'D', codigoFifa: 'TUR', confederacao: 'UEFA', aliases: [] },

  { id: 'alemanha', nome: 'Alemanha', grupo: 'E', codigoFifa: 'GER', confederacao: 'UEFA', aliases: [] },
  { id: 'curacao', nome: 'Curaçao', grupo: 'E', codigoFifa: 'CUW', confederacao: 'CONCACAF', aliases: ['Curaçau'] },
  { id: 'costa-do-marfim', nome: 'Costa do Marfim', grupo: 'E', codigoFifa: 'CIV', confederacao: 'CAF', aliases: ["Côte d'Ivoire"] },
  { id: 'equador', nome: 'Equador', grupo: 'E', codigoFifa: 'ECU', confederacao: 'CONMEBOL', aliases: [] },

  { id: 'holanda', nome: 'Holanda', grupo: 'F', codigoFifa: 'NED', confederacao: 'UEFA', aliases: ['Países Baixos'] },
  { id: 'japao', nome: 'Japão', grupo: 'F', codigoFifa: 'JPN', confederacao: 'AFC', aliases: [] },
  { id: 'suecia', nome: 'Suécia', grupo: 'F', codigoFifa: 'SWE', confederacao: 'UEFA', aliases: [] },
  { id: 'tunisia', nome: 'Tunísia', grupo: 'F', codigoFifa: 'TUN', confederacao: 'CAF', aliases: [] },

  { id: 'belgica', nome: 'Bélgica', grupo: 'G', codigoFifa: 'BEL', confederacao: 'UEFA', aliases: [] },
  { id: 'egito', nome: 'Egito', grupo: 'G', codigoFifa: 'EGY', confederacao: 'CAF', aliases: [] },
  { id: 'ira', nome: 'Irã', grupo: 'G', codigoFifa: 'IRN', confederacao: 'AFC', aliases: ['República Islâmica do Irã'] },
  { id: 'nova-zelandia', nome: 'Nova Zelândia', grupo: 'G', codigoFifa: 'NZL', confederacao: 'OFC', aliases: [] },

  { id: 'espanha', nome: 'Espanha', grupo: 'H', codigoFifa: 'ESP', confederacao: 'UEFA', aliases: [] },
  { id: 'cabo-verde', nome: 'Cabo Verde', grupo: 'H', codigoFifa: 'CPV', confederacao: 'CAF', aliases: [] },
  { id: 'arabia-saudita', nome: 'Arábia Saudita', grupo: 'H', codigoFifa: 'KSA', confederacao: 'AFC', aliases: [] },
  { id: 'uruguai', nome: 'Uruguai', grupo: 'H', codigoFifa: 'URU', confederacao: 'CONMEBOL', aliases: [] },

  { id: 'franca', nome: 'França', grupo: 'I', codigoFifa: 'FRA', confederacao: 'UEFA', aliases: [] },
  { id: 'senegal', nome: 'Senegal', grupo: 'I', codigoFifa: 'SEN', confederacao: 'CAF', aliases: [] },
  { id: 'iraque', nome: 'Iraque', grupo: 'I', codigoFifa: 'IRQ', confederacao: 'AFC', aliases: [] },
  { id: 'noruega', nome: 'Noruega', grupo: 'I', codigoFifa: 'NOR', confederacao: 'UEFA', aliases: [] },

  { id: 'argentina', nome: 'Argentina', grupo: 'J', codigoFifa: 'ARG', confederacao: 'CONMEBOL', aliases: [] },
  { id: 'argelia', nome: 'Argélia', grupo: 'J', codigoFifa: 'ALG', confederacao: 'CAF', aliases: [] },
  { id: 'austria', nome: 'Áustria', grupo: 'J', codigoFifa: 'AUT', confederacao: 'UEFA', aliases: [] },
  { id: 'jordania', nome: 'Jordânia', grupo: 'J', codigoFifa: 'JOR', confederacao: 'AFC', aliases: [] },

  { id: 'portugal', nome: 'Portugal', grupo: 'K', codigoFifa: 'POR', confederacao: 'UEFA', aliases: [] },
  { id: 'rd-congo', nome: 'RD Congo', grupo: 'K', codigoFifa: 'COD', confederacao: 'CAF', aliases: ['República Democrática do Congo', 'ReD do Congo'] },
  { id: 'uzbequistao', nome: 'Uzbequistão', grupo: 'K', codigoFifa: 'UZB', confederacao: 'AFC', aliases: [] },
  { id: 'colombia', nome: 'Colômbia', grupo: 'K', codigoFifa: 'COL', confederacao: 'CONMEBOL', aliases: [] },

  { id: 'inglaterra', nome: 'Inglaterra', grupo: 'L', codigoFifa: 'ENG', confederacao: 'UEFA', aliases: [] },
  { id: 'croacia', nome: 'Croácia', grupo: 'L', codigoFifa: 'CRO', confederacao: 'UEFA', aliases: [] },
  { id: 'gana', nome: 'Gana', grupo: 'L', codigoFifa: 'GHA', confederacao: 'CAF', aliases: [] },
  { id: 'panama', nome: 'Panamá', grupo: 'L', codigoFifa: 'PAN', confederacao: 'CONCACAF', aliases: [] }
];
