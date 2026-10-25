// Tela final: slideshow com a manhã chegando depois da última luta.
// Cada slide tem uma imagem (assets/endgame/final-N.png) e um texto (identificador em textos.js).
// O último slide mostra THE END e o agradecimento com o nome do jogador.

const SLIDES_FINAL = [
  { texto: 'final.1', imagem: 'assets/endgame/final-1.png', duracao: 4500 },
  { texto: 'final.2', imagem: 'assets/endgame/final-2.png', duracao: 5000 },
  { texto: 'final.3', imagem: 'assets/endgame/final-3.png', duracao: 4500 },
  { texto: 'final.4', imagem: 'assets/endgame/final-4.png', duracao: 4500 },
  { texto: 'final.5', imagem: 'assets/endgame/final-5.png', duracao: 5500 },
  { imagem: 'assets/endgame/final-6.png', final: true }
];

class Final extends Phaser.Scene {
  constructor() {
    super('Final');
  }

  init(data) {
    // aberto pelo botão ENDING do mapa: ao terminar, volta para o mapa (e não para a tela inicial)
    this.voltarPara = (data && data.voltarPara) || null;
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
    this.musica = this.sound.add('final-music', { loop: true, volume: 0.9 });
    this.musica.play();

    // a música de fundo do jogo para (com fade) enquanto o final toca a própria; volta quando o final termina
    const fundoDoJogo = this.game.musicaFundo;
    const volumeFundo = fundoDoJogo ? fundoDoJogo.volume : 0;
    if (fundoDoJogo && fundoDoJogo.isPlaying) {
      this.tweens.add({ targets: fundoDoJogo, volume: 0, duration: 800, onComplete: () => fundoDoJogo.pause() });
    }

    // fundo preto (aparece enquanto a imagem do slide não carrega)
    this.fundo = this.add.rectangle(0, 0, 512, 224, 0x000000).setOrigin(0, 0).setDepth(0);

    // legenda embaixo: só o texto, com contorno preto, para a imagem ficar livre. Cresce para cima a partir da linha de baixo
    this.textoSlide = this.add.text(256, 218, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 460 },
      lineSpacing: 6,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5, 1).setAlpha(0).setDepth(2);

    // último slide: THE END grande no céu e o agradecimento com o nome
    const contorno = { stroke: '#101820', strokeThickness: 5 };
    this.textoFim = this.add.text(256, 40, '', {
      fontFamily: 'monospace',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
      ...contorno
    }).setOrigin(0.5).setAlpha(0).setDepth(2);

    this.textoObrigado = this.add.text(256, 74, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      ...contorno
    }).setOrigin(0.5).setAlpha(0).setDepth(2);

    // a dica (TAP TO SKIP) fica no canto de cima, à direita
    this.dica = this.add.text(504, 6, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0).setAlpha(0).setDepth(2);

    // toque ou Enter avança o slide; no último, sai para a tela inicial
    this.input.on('pointerdown', () => this.avancar());
    this.input.keyboard.on('keydown-ENTER', () => this.avancar());

    // remove os ouvintes e para a música quando a cena termina
    this.events.once('shutdown', () => {
      this.input.off('pointerdown');
      this.input.keyboard.off('keydown-ENTER');
      if (this.timer) this.timer.remove();
      if (this.musica) this.musica.stop();
      if (fundoDoJogo) {
        fundoDoJogo.setVolume(volumeFundo);
        fundoDoJogo.resume();
      }
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

    // slides comuns: legenda embaixo; último slide: THE END e o agradecimento
    this.textoSlide.setVisible(!slide.final);
    this.textoFim.setAlpha(0);
    this.textoObrigado.setAlpha(0);

    if (slide.final) {
      const nome = this.game.nomeJogador || traduzir('final.amigo');
      this.textoFim.setText(traduzir('final.fim'));
      this.textoObrigado.setText(traduzir('final.obrigado', { nome }));
      this.tweens.add({ targets: this.textoFim, alpha: 1, duration: 1200 });
      this.tweens.add({ targets: this.textoObrigado, alpha: 1, duration: 1000, delay: 1200 });

      // o último slide espera o jogador tocar, para não sair sem querer
      this.dica.setText('TAP OR ENTER TO RETURN').setColor('#ffffff').setAlpha(0);
      this.time.delayedCall(2500, () => {
        this.podeSair = true;
        this.tweens.add({ targets: this.dica, alpha: 1, duration: 600 });
      });
    } else {
      this.textoSlide
        .setText(traduzir(slide.texto))
        .setAlpha(0);
      this.tweens.add({ targets: this.textoSlide, alpha: 1, duration: 800 });

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
    cam.once('camerafadeoutcomplete', () => {
      if (this.voltarPara === 'Mapa') this.scene.start('Mapa', { fase: this.game.progresso || 0 });
      else this.scene.start('TelaInicial');
    });
  }
}