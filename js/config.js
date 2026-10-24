// Todas as constantes do jogo. Mude os valores aqui.
// As constantes do vilão (vida, dano, velocidade, distâncias, esquiva) ficam em cada fase (fases/fase1.js, fases/fase2.js).

const VELOCIDADE_HEROI = 60;   // pixels por segundo
const ALCANCE_SOCO = 75;       // distância máxima para o soco do herói acertar

const DANO_SOCO = 10;
const DANO_SOCO_VIRADA = 15;   // dano do soco com o herói no modo virada
const VIDA_HEROI = 150;
const COOLDOWN_SOCO = 400;     // ms entre um soco e outro do herói
const COOLDOWN_TIRO = 600;     // ms entre um tiro e outro do herói
const JANELA_PULO = 350;       // ms em que um toque no pulo fica guardado, esperando o herói poder pular
const LIMITE_VIRADA = VIDA_HEROI * 0.3; // abaixo disso, o herói entra no modo virada

const CHAO_Y = 205;            // posição dos pés dos lutadores no chão
const VELOCIDADE_PULO = 480;   // impulso inicial do pulo (pixels por segundo)
const GRAVIDADE = 1400;
const VELOCIDADE_NO_AR = 150;  // velocidade horizontal durante o pulo
const ALTURA_ESQUIVA = 20;     // acima disso, o herói está no ar e o golpe passa por baixo
const POSE_PULO = 2;           // quadro do andar usado como pose no ar

// ícone do botão de pulo: seta para cima ('#' = pixel aceso)
const SETA_CIMA = [
  ".....#.....",
  "....###....",
  "...#####...",
  "..#######..",
  ".#########.",
  "....###....",
  "....###....",
  "....###....",
  "....###...."
];

// sons do jogo: nome usado no código -> arquivo em assets/
const SONS = {
  'soco': 'assets/audio/soco1.wav',
  'esquiva': 'assets/audio/esquiva.wav',
  'dano': 'assets/audio/dano.wav',
  'virada': 'assets/audio/virada.wav',
  'morte-heroi': 'assets/audio/morte-heroi.wav',
  'ko': 'assets/audio/ko.wav',
  'miss': 'assets/audio/miss.wav',
  'pulo1': 'assets/audio/jump1.wav',
  'pulo2': 'assets/audio/pulo2.wav',
  'pulo3': 'assets/audio/pulo3.wav',
  'musica-luta': 'assets/audio/musica-luta.mp3',
  'ogro-dano': 'assets/audio/orc-grunt.wav',
  'tiro': 'assets/audio/tiro.wav',

  // lobo
  'lobo-garrada': 'assets/audio/whoosh slash.WAV',
  'lobo-investida': 'assets/audio/werewolf growl.WAV',
  'lobo-entrada': 'assets/audio/uivolobo1.WAV',
  'lobo-furia': 'assets/audio/furiaLobo.WAV',
  'lobo-morte': 'assets/audio/werewolf death.wav',

  // arma sem munição
  'sem-municao': 'assets/audio/empty gun click.flac',

  // boss
  'boss-bola': 'assets/audio/fireball.wav',
  'boss-dano': 'assets/audio/hurtboss.WAV',
  'boss-morte': 'assets/audio/monster death deep.wav',
  'boss-powerup': 'assets/audio/power-upboss.WAV',

  // PERFECT (todas as lutas)
  'perfect': 'assets/audio/perfect.ogg',
};

// sons de pulo, sorteados a cada pulo
const SONS_PULO = ['pulo1', 'pulo2', 'pulo3'];

// lutas do caminho até o castelo, em ordem
const LUTAS = [
  { nome: 'WITCH' },
  { nome: 'OGRE' },
  { nome: 'WEREWOLF' },
  { nome: 'OGRE' }
];

// transforma segundos no texto que aparece na tela: "12.28 seconds" ou "1 minute 05.40 seconds"
function formatarTempo(segundos) {
  if (segundos < 60) return `${segundos.toFixed(2)} seconds`;
  const min = Math.floor(segundos / 60);
  const resto = (segundos - min * 60).toFixed(2).padStart(5, '0');
  return `${min} ${min === 1 ? 'minute' : 'minutes'} ${resto} seconds`;
}