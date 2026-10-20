// Cutscene antes do boss final.
// Passo 1: o herói entra andando no cenário vazio (sem monstros) e para.
// Passo 2: corta para o slide 1 (boss no trono) e o slide 2 (goblin ajoelhado + fala do boss).

const CUTSCENE_CENARIO_ESCALA = 512 / 1376;   // largura da imagem -> largura da tela
const CUTSCENE_CENARIO_Y = -42;               // sobe o fundo para a faixa de terra encostar nos pés (CHAO_Y)
const CUTSCENE_HEROI_PARA_EM = 256;           // x onde o herói para

const CUTSCENE_ANTES_DE_PARAR = 2500;         // ms: o corte para o slide 1 acontece tanto tempo antes de o herói parar
const CUTSCENE_SLIDE1_TEMPO = 2500;           // ms: quanto o boss no trono fica na tela
const CUTSCENE_FADE_ENTRE_SLIDES = 1000;      // ms: escurecer (e depois clarear) entre o slide 1 e o 2
const CUTSCENE_ESPERA_DIALOGO = 2500;         // ms: o goblin fica na tela antes da fala do boss

// retrato do boss na caixa de diálogo (imagem única, sem frames; a escala é calculada na hora da fala)
const RETRATO_BOSS = { chave: 'boss-thumb', frame: '__BASE', escala: 1 };

class CutsceneBoss extends Phaser.Scene {
  constructor() {
    super('CutsceneBoss');
  }

  preload() {
    this.load.image('cenario-boss-vazio', 'assets/cenario4a.jpg');
    this.load.image('cena1', 'assets/cena1.jpg');
    this.load.image('cena2', 'assets/cena2.jpg');
    this.load.image('boss-thumb', 'assets/tumbBoss.png');
    this.load.spritesheet('heroi-andar', 'assets/heroi-andar.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    this.slide = null;

    this.add.image(0, CUTSCENE_CENARIO_Y, 'cenario-boss-vazio')
      .setOrigin(0, 0)
      .setScale(CUTSCENE_CENARIO_ESCALA);

    if (!this.anims.exists('heroi-andar')) {
      this.anims.create({
        key: 'heroi-andar',
        frames: this.anims.generateFrameNumbers('heroi-andar', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });
    }

    this.heroi = this.add.sprite(-20, CHAO_Y, 'heroi-andar')
      .setOrigin(0.5, 1)
      .setScale(2);
    this.heroi.play('heroi-andar');

    // anda na mesma velocidade do jogo (VELOCIDADE_HEROI)
    const distancia = CUTSCENE_HEROI_PARA_EM - this.heroi.x;
    const tempoAndando = (distancia / VELOCIDADE_HEROI) * 1000;

    this.tweens.add({
      targets: this.heroi,
      x: CUTSCENE_HEROI_PARA_EM,
      duration: tempoAndando,
      ease: 'Linear',
      onComplete: () => {
        this.heroi.stop();
        this.heroi.setFrame(0);
      }
    });

    // corta para o slide 1 ainda com o herói andando
    this.time.delayedCall(Math.max(0, tempoAndando - CUTSCENE_ANTES_DE_PARAR), () => this.slide1());

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  // corte de cena com fade preto: troca o que aparece no meio do fade
  corte(aoTrocar, aoTerminar, duracao = 400) {
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

  // slide 2: o goblin ajoelhado, sem fala; depois de um tempo o boss responde
  slide2() {
    this.corte(
      () => this.mostrarSlide('cena2'),
      () => this.time.delayedCall(CUTSCENE_ESPERA_DIALOGO, () => {
        // encolhe a foto do boss para caber na moldura de 64x64, seja qual for o tamanho original
        const fotoBoss = this.textures.get('boss-thumb').getSourceImage();
        RETRATO_BOSS.escala = 60 / Math.max(fotoBoss.width, fotoBoss.height);

        mostrarDialogo(
          this,
          'SUN DEVOURER',
          'Hmm... if you want something done right, you have to do it yourself...',
          null,
          RETRATO_BOSS
        );
      }),
      CUTSCENE_FADE_ENTRE_SLIDES
    );
  }
}