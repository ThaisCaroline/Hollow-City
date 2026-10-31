// Cutscene antes do boss final.
// Passo 1: o detetive entra andando no cenário vazio (sem monstros) e para.
// Passo 2: corta para o slide 1 (boss no trono) e o slide 2 (goblin ajoelhado + fala do boss).
// Passo 3: volta ao jogo com o cenário cheio; o boss chega andando e para; diálogos detetive/boss.
// Depois das falas: fade e vai para a luta (por enquanto a luta 4, do ogro).
// As falas vêm de textos.js (identificadores luta4.*).

const CUTSCENE_CENARIO_ESCALA = 512 / 1376;   // largura da imagem -> largura da tela
const CUTSCENE_CENARIO_Y = -42;               // sobe o fundo para a faixa de terra encostar nos pés (CHAO_Y)
const CUTSCENE_HEROI_PARA_EM = 256;           // x onde o herói para

const CUTSCENE_ANTES_DE_PARAR = 2500;         // ms: o corte para o slide 1 acontece tanto tempo antes de o herói parar
const CUTSCENE_SLIDE1_TEMPO = 2500;           // ms: quanto o boss no trono fica na tela
const CUTSCENE_FADE_ENTRE_SLIDES = 1000;      // ms: escurecer (e depois clarear) entre o slide 1 e o 2
const CUTSCENE_ESPERA_DIALOGO = 3500;         // ms: o goblin fica na tela antes da fala do boss

const CUTSCENE_LUTA_SEGUINTE = 3;             // índice da luta que vem depois da cutscene (3 = luta 4, o ogro)

// retrato do boss na caixa de diálogo (imagem única, sem frames; a escala é calculada na hora da fala)
const RETRATO_BOSS = { chave: 'boss-thumb', frame: '__BASE', escala: 1 };

// retrato do detetive novo (frame de 48x48, por isso a escala é menor que a do herói antigo)
const RETRATO_DETETIVE = { chave: 'detetive-idle', frame: 0, escala: 1.8 };

class CutsceneBoss extends Phaser.Scene {
  constructor() {
    super('CutsceneBoss');
  }

  preload() {
    this.load.image('cenario-boss-vazio', 'assets/cenario4a.jpg');
    this.load.image('cena1', 'assets/cena1.jpg');
    this.load.image('cena2', 'assets/cena2.jpg');
    this.load.image('boss-thumb', 'assets/tumbBoss.png');

    // detetive novo (frames 48x48, pés em y=39)
    this.load.spritesheet('detetive-walk', 'assets/heroi/heroi_walk.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('detetive-idle', 'assets/heroi/heroi_idle.png', {
      frameWidth: 48,
      frameHeight: 48
    });

    // passo 3
    this.load.image('cenario-boss-cheio', 'assets/cenario4b.jpg');
    this.load.spritesheet('boss-idle', 'assets/BossFase1/boss_idle.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('boss-walk', 'assets/BossFase1/boss_walk.png', {
      frameWidth: 128,
      frameHeight: 128
    });
  }

  create() {
    this.slide = null;
    this.saindo = false;

    this.add.image(0, CUTSCENE_CENARIO_Y, 'cenario-boss-vazio')
      .setOrigin(0, 0)
      .setScale(CUTSCENE_CENARIO_ESCALA);

    if (!this.anims.exists('detetive-walk')) {
      this.anims.create({
        key: 'detetive-walk',
        frames: this.anims.generateFrameNumbers('detetive-walk', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!this.anims.exists('detetive-idle')) {
      this.anims.create({
        key: 'detetive-idle',
        frames: this.anims.generateFrameNumbers('detetive-idle', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
    }

    if (!this.anims.exists('boss-idle')) {
      this.anims.create({
        key: 'boss-idle',
        frames: this.anims.generateFrameNumbers('boss-idle', { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
    }

    if (!this.anims.exists('boss-walk')) {
      this.anims.create({
        key: 'boss-walk',
        frames: this.anims.generateFrameNumbers('boss-walk', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });
    }

    // origem nos pés: frame 48x48 com os pés em y=39
    this.heroi = this.add.sprite(-20, CHAO_Y, 'detetive-walk')
      .setOrigin(0.5, 39 / 48)
      .setScale(2);
    this.heroi.play('detetive-walk');

    // anda na mesma velocidade do jogo (VELOCIDADE_HEROI)
    const distancia = CUTSCENE_HEROI_PARA_EM - this.heroi.x;
    const tempoAndando = (distancia / VELOCIDADE_HEROI) * 1000;

    this.tweens.add({
      targets: this.heroi,
      x: CUTSCENE_HEROI_PARA_EM,
      duration: tempoAndando,
      ease: 'Linear',
      onComplete: () => {
        this.heroi.play('detetive-idle');
      }
    });

    // corta para o slide 1 ainda com o herói andando
    this.time.delayedCall(Math.max(0, tempoAndando - CUTSCENE_ANTES_DE_PARAR), () => this.slide1());

    this.cameras.main.fadeIn(1200, 0, 0, 0);

    // as falas desta cena entram devagar: caixa com fade e texto letra por letra (ver dialogo.js)
    this.dialogoDevagar = true;
  }

  // corte de cena com fade preto: troca o que aparece no meio do fade
  corte(aoTrocar, aoTerminar, duracao = 900) {
    const cam = this.cameras.main;
    cam.fadeOut(duracao, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      aoTrocar();
      cam.fadeIn(duracao, 0, 0, 0);
      cam.once('camerafadeincomplete', () => {
        if (aoTerminar) aoTerminar();
      });
    });
  }

  // mostra a imagem cobrindo a tela inteira, sem distorcer (abaixo das caixas de diálogo)
  mostrarSlide(chave) {
    if (this.slide) this.slide.destroy();
    this.slide = this.add.image(256, 112, chave).setDepth(30);
    const escala = Math.max(512 / this.slide.width, 224 / this.slide.height);
    this.slide.setScale(escala);
  }

  // slide 1: o boss no trono, sem fala
  slide1() {
    this.corte(
      () => this.mostrarSlide('cena1'),
      () => this.time.delayedCall(CUTSCENE_SLIDE1_TEMPO, () => this.slide2())
    );
  }

  // slide 2: o goblin ajoelhado, sem fala; depois de um tempo o boss responde.
  // Quando a fala termina, corta para o passo 3 sozinho.
  slide2() {
    this.corte(
      () => this.mostrarSlide('cena2'),
      () => this.time.delayedCall(CUTSCENE_ESPERA_DIALOGO, () => {
        // encolhe a foto do boss para caber na moldura de 64x64, seja qual for o tamanho original
        const fotoBoss = this.textures.get('boss-thumb').getSourceImage();
        RETRATO_BOSS.escala = 60 / Math.max(fotoBoss.width, fotoBoss.height);

        mostrarDialogo(
          this,
          traduzir('luta4.nome'),
          traduzir('luta4.goblin'),
          () => this.corte(() => this.passo3()),
          RETRATO_BOSS
        );
      }),
      CUTSCENE_FADE_ENTRE_SLIDES
    );
  }

  // passo 3: volta ao jogo com o cenário cheio; o boss chega andando e para
  passo3() {
    if (this.slide) this.slide.destroy();

    this.add.image(0, CUTSCENE_CENARIO_Y, 'cenario-boss-cheio')
      .setOrigin(0, 0)
      .setScale(CUTSCENE_CENARIO_ESCALA)
      .setDepth(1);

    // herói à frente do cenário cheio
    this.heroi.setDepth(2);

    // boss entra pela direita, fora da tela
    this.boss = this.add.sprite(640, CHAO_Y, 'boss-walk')
      .setOrigin(0.5, 107 / 128)
      .setScale(2.6)
      .setDepth(2);
    this.boss.play('boss-walk');

    this.tweens.add({
      targets: this.boss,
      x: 400,
      duration: 3000,
      ease: 'Linear',
      onComplete: () => {
        this.boss.play('boss-idle');
        this.dialogos();
      }
    });
  }

  // diálogo final: detetive fala, depois o boss responde; no fim vai para a luta
  dialogos() {
    // garante a escala do retrato do boss (caso o passo 3 seja chamado direto pelo console)
    const fotoBoss = this.textures.get('boss-thumb').getSourceImage();
    RETRATO_BOSS.escala = 60 / Math.max(fotoBoss.width, fotoBoss.height);

    mostrarDialogo(this, traduzir('nome.detetive'), traduzir('luta4.detetive'), () => {
      mostrarDialogo(
        this,
        traduzir('luta4.nome'),
        traduzir('luta4.vilao'),
        () => this.irParaLuta(),
        RETRATO_BOSS
      );
    }, RETRATO_DETETIVE);
  }

  // fade para preto e começa a luta seguinte
  irParaLuta() {
    if (this.saindo) return;
    this.saindo = true;

    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CenaLuta', { fase: CUTSCENE_LUTA_SEGUINTE });
    });
  }
}