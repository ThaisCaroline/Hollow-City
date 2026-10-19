// Fase 1: a bruxa. Textos, sprites e animações desta luta.
// Vida e dano da bruxa ficam em config.js (VIDA_VILAO, DANO_VILAO).

const FASE1 = {
  nome: 'WITCH',
  dialogoHeroi: 'So you are the one they sent. Who leads these monsters?',
  dialogoBruxa: 'Turn back, detective. Some questions are better left unanswered.',

  sprites: {
    andar: 'assets/vilao-andar.png',
    surgir: 'assets/vilao-surgir.png',
    largura: 32,
    altura: 48
  }
};

// prepara a bruxa: recolore os sprites de preto e cria as animações dela.
// Chamada pela cena de luta antes de criar o vilão. Só faz o trabalho uma vez.
function prepararVilao(cena) {
  if (!cena.textures.exists('vilao-preto')) {
    recolorir(cena, 'vilao-andar', 'vilao-preto', CAPA_PRETA, FASE1.sprites.largura, FASE1.sprites.altura);
    recolorir(cena, 'vilao-surgir', 'vilao-surgir-preto', CAPA_PRETA, FASE1.sprites.largura, FASE1.sprites.altura);
  }

  if (cena.anims.exists('vilao-andar')) return;

  cena.anims.create({
    key: 'vilao-andar',
    frames: cena.anims.generateFrameNumbers('vilao-preto', { start: 0, end: 5 }),
    frameRate: 8,
    repeat: -1
  });

  // quadros do "surgir do chão", sem os que mostram a mão, a lâmina e o braço esticado
  // (10 e 9 = em pé, 8 = agachada, 1 e 0 = monte de terra)
  const AFUNDAR = [10, 9, 8, 1, 0];

  // a morte da bruxa é afundar no chão
  cena.anims.create({
    key: 'vilao-morte',
    frames: cena.anims.generateFrameNumbers('vilao-surgir-preto', { frames: AFUNDAR }),
    frameRate: 5,
    repeat: 0
  });

  // esquiva: afunda no chão (rápido) e depois sai do chão atrás do herói
  cena.anims.create({
    key: 'vilao-afundar',
    frames: cena.anims.generateFrameNumbers('vilao-surgir-preto', { frames: AFUNDAR }),
    frameRate: 12,
    repeat: 0
  });

  cena.anims.create({
    key: 'vilao-surgir',
    frames: cena.anims.generateFrameNumbers('vilao-surgir-preto', { frames: [...AFUNDAR].reverse() }),
    frameRate: 7,
    repeat: 0
  });
}