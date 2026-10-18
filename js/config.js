// Todas as constantes do jogo. Mude os valores aqui.

const VELOCIDADE_HEROI = 45;   // pixels por segundo
const VELOCIDADE_VILAO = 50;
const DISTANCIA_LUTA = 60;     // o vilão para de andar a essa distância do herói
const DISTANCIA_ATAQUE = 70;   // o vilão começa um golpe a essa distância (ou menos)
const ALCANCE_SOCO = 75;       // distância máxima para o soco do herói acertar
const ALCANCE_VILAO = 75;      // distância máxima para o golpe do vilão acertar

const DANO_SOCO = 10;
const DANO_SOCO_VIRADA = 15;   // dano do soco com o herói no modo virada
const DANO_VILAO = 25;
const VIDA_HEROI = 140;
const VIDA_VILAO = 250;        // vida da Morte (200 = 20 socos)
const LIMITE_VIRADA = VIDA_HEROI * 0.3; // abaixo disso, o herói entra no modo virada

const CHAO_Y = 205;            // posição dos pés dos lutadores no chão
const VELOCIDADE_PULO = 480;   // impulso inicial do pulo (pixels por segundo)
const GRAVIDADE = 1400;
const VELOCIDADE_NO_AR = 150;  // velocidade horizontal durante o pulo
const ALTURA_ESQUIVA = 20;     // acima disso, o herói está no ar e o golpe passa por baixo
const POSE_PULO = 3;           // quadro do andar usado como pose no ar

const COOLDOWN_ESQUIVA = 2000;  // tempo (ms) até a Morte poder esquivar de novo
const PRIMEIRA_ESQUIVA = 3000;  // a primeira esquiva só fica disponível depois disso

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
  'musica-luta': 'assets/audio/musica-luta.mp3'
};

// sons de pulo, sorteados a cada pulo
const SONS_PULO = ['pulo1', 'pulo2', 'pulo3'];

// lutas do caminho até o castelo, em ordem (todas iguais por enquanto)
const LUTAS = [
  { nome: 'WITCH' },
  { nome: 'WITCH' },
  { nome: 'WITCH' }
];