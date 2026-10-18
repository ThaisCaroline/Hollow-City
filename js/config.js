// Todas as constantes do jogo. Mude os valores aqui.

const VELOCIDADE_HEROI = 90;   // pixels por segundo
const VELOCIDADE_VILAO = 40;
const DISTANCIA_LUTA = 60;     // o vilão para de andar a essa distância do herói
const DISTANCIA_ATAQUE = 70;   // o vilão começa um golpe a essa distância (ou menos)
const ALCANCE_SOCO = 75;       // distância máxima para o soco do herói acertar
const ALCANCE_VILAO = 75;      // distância máxima para o golpe do vilão acertar

const DANO_SOCO = 10;
const DANO_SOCO_VIRADA = 15;   // dano do soco com o herói no modo virada
const DANO_VILAO = 25;
const VIDA_HEROI = 150;
const VIDA_VILAO = 200;        // vida da Morte (200 = 20 socos)
const LIMITE_VIRADA = VIDA_HEROI * 0.3; // abaixo disso, o herói entra no modo virada

const CHAO_Y = 205;            // posição dos pés dos lutadores no chão
const VELOCIDADE_PULO = 480;   // impulso inicial do pulo (pixels por segundo)
const GRAVIDADE = 1400;
const VELOCIDADE_NO_AR = 150;  // velocidade horizontal durante o pulo
const ALTURA_ESQUIVA = 20;     // acima disso, o herói está no ar e o golpe passa por baixo
const POSE_PULO = 3;           // quadro do andar usado como pose no ar

const COOLDOWN_ESQUIVA = 3000;  // tempo (ms) até a Morte poder esquivar de novo
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