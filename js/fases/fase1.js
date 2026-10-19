// Fase 1: a bruxa. Textos, sprites, texturas e animações desta luta.
// Vida e dano da bruxa ficam em config.js (VIDA_VILAO, DANO_VILAO).

const FASE1 = {
  nome: 'WITCH',
  dialogoHeroi: 'So you are the one they sent. Who leads these monsters?',
  dialogoBruxa: 'Turn back, detective. Some questions are better left unanswered.',

  // arquivos dos sprites da bruxa
  sprites: {
    andar: 'assets/vilao-andar.png',
    surgir: 'assets/vilao-surgir.png',
    largura: 32,
    altura: 48
  },

  // nomes internos das texturas, usados pelo game.js
  texturas: {
    base: 'vilao-bruto-andar',       // sprite original, antes de recolorir
    surgirBase: 'vilao-bruto-surgir',
    parado: 'vilao-preto',           // sprite recolorido de preto, usado na luta
    surgirPreto: 'vilao-surgir-preto'
  },

  // nomes internos das animações, usados pelo game.js
  anims: {
    andar: 'vilao-andar',
    morte: 'vilao-morte',
    afundar: 'vilao-afundar',
    surgir: 'vilao-surgir'
  }
};

// carrega os sprites da bruxa. Chamada pelo preload() da cena de luta.
function carregarVilao(cena) {
  cena.load.spritesheet(FASE1.texturas.base, FASE1.sprites.andar, {
    frameWidth: FASE1.sprites.largura,
    frameHeight: FASE1.sprites.altura
  });
  cena.load.spritesheet(FASE1.texturas.surgirBase, FASE1.sprites.surgir, {
    frameWidth: FASE1.sprites.largura,
    frameHeight: FASE1.sprites.altura
  });
}

// prepara a bruxa: recolore os sprites de preto e cria as animações dela.
// Chamada pela cena de luta depois do carregamento. Só faz o trabalho uma vez.
function prepararVilao(cena) {
  const T = FASE1.texturas;
  const A = FASE1.anims;

  if (!cena.textures.exists(T.parado)) {
    recolorir(cena, T.base, T.parado, CAPA_PRETA, FASE1.sprites.largura, FASE1.sprites.altura);
    recolorir(cena, T.surgirBase, T.surgirPreto, CAPA_PRETA, FASE1.sprites.largura, FASE1.sprites.altura);
  }

  if (cena.anims.exists(A.andar)) return;

  cena.anims.create({
    key: A.andar,
    frames: cena.anims.generateFrameNumbers(T.parado, { start: 0, end: 5 }),
    frameRate: 8,
    repeat: -1
  });

  // quadros do "surgir do chão", sem os que mostram a mão, a lâmina e o braço esticado
  // (10 e 9 = em pé, 8 = agachada, 1 e 0 = monte de terra)
  const AFUNDAR = [10, 9, 8, 1, 0];

  // a morte da bruxa é afundar no chão
  cena.anims.create({
    key: A.morte,
    frames: cena.anims.generateFrameNumbers(T.surgirPreto, { frames: AFUNDAR }),
    frameRate: 5,
    repeat: 0
  });

  // esquiva: afunda no chão (rápido) e depois sai do chão atrás do herói
  cena.anims.create({
    key: A.afundar,
    frames: cena.anims.generateFrameNumbers(T.surgirPreto, { frames: AFUNDAR }),
    frameRate: 12,
    repeat: 0
  });

  cena.anims.create({
    key: A.surgir,
    frames: cena.anims.generateFrameNumbers(T.surgirPreto, { frames: [...AFUNDAR].reverse() }),
    frameRate: 7,
    repeat: 0
  });
}