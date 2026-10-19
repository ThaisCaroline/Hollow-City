// Fase 1: a bruxa. Textos, nome e sprites desta luta.
// Vida e dano da bruxa ficam em config.js (VIDA_VILAO, DANO_VILAO).

const FASE1 = {
  nome: 'WITCH',
  dialogoHeroi: 'So you are the one they sent. Who leads these monsters?',
  dialogoBruxa: 'Turn back, detective. Some questions are better left unanswered.',

  // sprites da bruxa (ainda não são usados pelo game.js, só ficam guardados aqui)
  sprites: {
    andar: 'assets/vilao-andar.png',
    surgir: 'assets/vilao-surgir.png',
    largura: 32,
    altura: 48
  }
};