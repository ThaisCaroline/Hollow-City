// Tela final: slideshow com a manhã chegando depois da última luta.
// Cada slide tem uma imagem (assets/final-slideN.jpg), texto, cor de fundo e duração.
// O último slide é o agradecimento, com o nome do jogador.

const SLIDES_FINAL = [
  {
    texto: 'The town of Hollow City has not seen the sun in years.',
    cor: 0x000000,
    duracao: 4000,
    imagem: 'assets/final-slide1.jpg'
  },
  {
    texto: 'The monsters are gone.',
    cor: 0x0a1414,
    duracao: 3000,
    imagem: 'assets/final-slide2.jpg'
  },
  {
    texto: 'Behind closed doors, people wait.\nNo one knows if it is safe to come out.',
    cor: 0x142a2a,
    duracao: 4500,
    imagem: 'assets/final-slide3.jpg'
  },
  {
    texto: 'One by one, the doors open.',
    cor: 0x1e3a3a,
    duracao: 3500,
    imagem: 'assets/final-slide4.jpg'
  },
  {
    texto: 'They step into the street, still afraid,\nlooking up at the sky.',
    cor: 0x2a2a30,
    duracao: 4000,
    imagem: 'assets/final-slide5.jpg'
  },
  {
    texto: 'Dawn breaks over the mountains.',
    cor: 0x6a3a2a,
    duracao: 4000,
    imagem: 'assets/final-slide6.jpg'
  },
  {
    texto: 'THE END',
    cor: 0x000000,
    corTexto: '#ffffff',
    imagem: 'assets/final-slide7.jpg',
    final: true
  }
];

class Final extends Phaser.Scene {
  constructor() {
    super('Final');
  }

  preload() {
    // carrega as imagens dos slides que têm uma
    SLIDES_FINAL.forEach((slide, i) => {
      if (slide.imagem) this.load.image(`final-${i}`, slide.imagem);
    });

    // música da cena final
    this.load.audio('final-music', 'assets/audio/final.mp3');
  }

  create() {
    this.slideAtual = 0;
    this.trocando = false;
    this.podeSair = false;
    this.timer = null;
    this.imagem = null;

    // música da cena final, em loop
    this.musica = this.sound.add('final-music', { loop: true, volume: 0.6 });
    this.musica.play();

    // fundo de cor (aparece quando o slide não tem imagem)
    this.fundo = this.add.rectangle(0, 0, 512, 224, 0x000000).setOrigin(0, 0).setDepth(0);

    // faixa escura atrás do texto, para ele ficar legível sobre as imagens
    this.faixa = this.add.rectangle(0, 8, 512, 56, 0x000000, 0.6).setOrigin(0, 0).setDepth(1);

    this.textoSlide = this.add.text(256, 36, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 440 },
      lineSpacing: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(2);

    this.dica = this.add.text(256, 206, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setAlpha(0).setDepth(2);

    // toque ou Enter avança o slide; no último, sai para a tela inicial
    this.input.on('pointerdown', () => this.avancar());
    this.input.keyboard.on('keydown-ENTER', () => this.avancar());

    // remove os ouvintes e para a música quando a cena termina
    this.events.once('shutdown', () => {
      this.input.off('pointerdown');
      this.input.keyboard.off('keydown-ENTER');
      if (this.timer) this.timer.remove();
      if (this.musica) this.musica.stop();
    });

    this.mostrarSlide(0);
  }

  mostrarSlide(i) {
    const slide = SLIDES_FINAL[i];
    this.slideAtual = i;

    // troca a imagem: a anterior sai e a deste slide entra, se houver
    if (this.imagem) {
      this.imagem.destroy();
      this.imagem = null;
    }
    if (slide.imagem && this.textures.exists(`final-${i}`)) {
      this.imagem = this.add.image(256, 112, `final-${i}`)
        .setDisplaySize(512, 224)
        .setDepth(0.5);
    }

    this.fundo.setFillStyle(slide.cor);

    let texto = slide.texto;
    if (slide.final) {
      const nome = this.game.nomeJogador || 'friend';
      texto = `${slide.texto}\n\nThanks for playing, ${nome}!`;
    }

    this.textoSlide
      .setText(texto)
      .setColor(slide.corTexto || '#ffffff')
      .setAlpha(0);
    this.tweens.add({ targets: this.textoSlide, alpha: 1, duration: 800 });

    if (slide.final) {
      // o último slide espera o jogador tocar, para não sair sem querer
      this.dica.setText('TAP OR ENTER TO RETURN').setColor('#ffffff').setAlpha(0);
      this.time.delayedCall(1500, () => {
        this.podeSair = true;
        this.tweens.add({ targets: this.dica, alpha: 1, duration: 600 });
      });
    } else {
      this.dica.setText('TAP TO SKIP').setColor('#aaaaaa').setAlpha(1);
      this.timer = this.time.delayedCall(slide.duracao, () => this.proximo());
    }
  }

  avancar() {
    if (this.trocando) return;

    if (SLIDES_FINAL[this.slideAtual].final) {
      if (this.podeSair) this.sair();
      return;
    }
    this.proximo();
  }

  // troca de slide com fade preto, como um corte de cena
  proximo() {
    if (this.trocando) return;
    this.trocando = true;
    if (this.timer) this.timer.remove();

    const cam = this.cameras.main;
    cam.fadeOut(400, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.mostrarSlide(this.slideAtual + 1);
      cam.fadeIn(400, 0, 0, 0);
      cam.once('camerafadeincomplete', () => { this.trocando = false; });
    });
  }

  sair() {
    this.trocando = true;
    const cam = this.cameras.main;
    cam.fadeOut(600, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => this.scene.start('TelaInicial'));
  }
}