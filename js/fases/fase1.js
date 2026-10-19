// Fase 1: a bruxa. Tudo que é dela fica aqui: textos, cenário, sons, sprites, animações e golpes.
// Vida e dano ficam em config.js (VIDA_VILAO, DANO_VILAO).

const FASE1 = {
  nome: 'WITCH',
  dialogoHeroi: 'So you are the one they sent. Who leads these monsters?',
  dialogoVilao: 'Turn back, detective. Some questions are better left unanswered.',

  cenario: 'assets/cenario-noite.png',

  // vida e tamanho do vilão
  vida: VIDA_VILAO,
  escala: 2,
  espelhado: false,          // o sprite da bruxa nasce virado para a direita

  // sons próprios desta fase (chaves definidas em SONS, no config.js)
  sons: {
    dano: 'soco'             // o som do soco do herói também é o de dano da bruxa
  },

  // a bruxa esquiva afundando no chão
  esquiva: true,

  // imagem que aparece na caixa de diálogo
  retrato: { chave: 'vilao-preto', frame: 0, escala: 1.2 },

  // arquivos dos sprites da bruxa
  sprites: {
    andar: 'assets/vilao-andar.png',
    surgir: 'assets/vilao-surgir.png',
    largura: 32,
    altura: 48
  },

  // nomes internos das texturas
  texturas: {
    base: 'vilao-bruto-andar',       // sprite original, antes de recolorir
    surgirBase: 'vilao-bruto-surgir',
    parado: 'vilao-preto',           // sprite recolorido de preto, usado na luta
    surgirPreto: 'vilao-surgir-preto'
  },

  // nomes internos das animações
  anims: {
    andar: 'vilao-andar',
    morte: 'vilao-morte',
    afundar: 'vilao-afundar',
    surgir: 'vilao-surgir'
  },

  // carrega os sprites da bruxa (chamado pelo preload da cena de luta)
  carregar(cena) {
    cena.load.spritesheet(this.texturas.base, this.sprites.andar, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.altura
    });
    cena.load.spritesheet(this.texturas.surgirBase, this.sprites.surgir, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.altura
    });
  },

  // recolore a bruxa e cria as animações dela (chamado pelo create da cena de luta)
  preparar(cena) {
    const T = this.texturas;
    const A = this.anims;

    if (!cena.textures.exists(T.parado)) {
      recolorir(cena, T.base, T.parado, CAPA_PRETA, this.sprites.largura, this.sprites.altura);
      recolorir(cena, T.surgirBase, T.surgirPreto, CAPA_PRETA, this.sprites.largura, this.sprites.altura);
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
};