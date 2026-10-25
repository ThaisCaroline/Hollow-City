// Abertura: 3 telas mostradas depois do nome e antes do mapa (como o detetive chegou até aqui).
// Cada tela tem uma imagem (assets/abertura/abertura-N.png), um texto (opcional) e uma duração.
// Toque ou Enter avança; depois da última tela o jogo abre o mapa.
// Os textos estão em inglês e em português; por enquanto o jogo mostra só o inglês (IDIOMA_ABERTURA).

const IDIOMA_ABERTURA = 'en';   // trocar para 'pt' quando o jogo passar a ter suporte a idiomas

const SLIDES_ABERTURA = [
  {
    imagem: 'assets/abertura/abertura-1.png',
    duracao: 4600
  },
  {
    imagem: 'assets/abertura/abertura-2.png',
    texto: {
      en: 'They took the sun, then my neighbors.\nSomeone is giving the orders.',
      pt: 'Levaram o sol, depois os meus vizinhos.\nAlguém está dando as ordens.'
    },
    duracao: 5200
  },
  {
    imagem: 'assets/abertura/abertura-3.png',
    texto: {
      en: 'Tonight, it ends.',
      pt: 'Esta noite, isso acaba.'
    },
    duracao: 4200
  }
];

class Abertura extends Phaser.Scene {
  constructor() {
    super('Abertura');
  }

  preload() {
    SLIDES_ABERTURA.forEach((slide, i) => {
      if (slide.imagem) this.load.image(`abertura-${i}`, slide.imagem);
    });
  }

  create() {
    this.slideAtual = 0;
    this.trocando = false;
    this.podePular = false;   // o toque que apertou o START não pode pular a primeira tela
    this.timer = null;
    this.imagem = null;

    this.fundo = this.add.rectangle(0, 0, 512, 224, 0x000000).setOrigin(0, 0).setDepth(0);

    // faixa escura transparente embaixo, atrás do texto (só aparece nas telas que têm texto)
    this.faixa = this.add.rectangle(0, 184, 512, 40, 0x000000, 0.65).setOrigin(0, 0).setDepth(1).setAlpha(0);

    this.textoSlide = this.add.text(256, 204, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 480 },
      lineSpacing: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(2);

    this.dica = this.add.text(504, 6, 'TAP TO SKIP', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#aaaaaa'
    }).setOrigin(1, 0).setDepth(2);

    // toque ou Enter avança para a próxima tela
    this.input.on('pointerdown', () => this.avancar());
    this.input.keyboard.on('keydown-ENTER', () => this.avancar());
    this.time.delayedCall(600, () => { this.podePular = true; });

    // remove os ouvintes quando a cena termina
    this.events.once('shutdown', () => {
      this.input.off('pointerdown');
      this.input.keyboard.off('keydown-ENTER');
      if (this.timer) this.timer.remove();
    });

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.mostrarSlide(0);
  }

  mostrarSlide(i) {
    const slide = SLIDES_ABERTURA[i];
    this.slideAtual = i;

    // a imagem anterior sai e a desta tela entra
    if (this.imagem) {
      this.imagem.destroy();
      this.imagem = null;
    }
    if (slide.imagem && this.textures.exists(`abertura-${i}`)) {
      this.imagem = this.add.image(256, 112, `abertura-${i}`)
        .setDisplaySize(512, 224)
        .setDepth(0.5);
    }

    // texto na língua escolhida; telas sem texto ficam sem faixa
    const texto = slide.texto ? slide.texto[IDIOMA_ABERTURA] : '';
    this.textoSlide.setText(texto);
    this.textoSlide.setAlpha(0);
    this.faixa.setAlpha(0);
    if (texto) {
      this.tweens.add({ targets: [this.textoSlide, this.faixa], alpha: 1, duration: 1400 });
    }

    this.timer = this.time.delayedCall(slide.duracao, () => this.proximo());
  }

  avancar() {
    if (this.trocando || !this.podePular) return;
    this.proximo();
  }

  // troca de tela com fade preto, como um corte de cena; depois da última, abre o mapa
  proximo() {
    if (this.trocando) return;
    if (this.timer) this.timer.remove();

    if (this.slideAtual >= SLIDES_ABERTURA.length - 1) {
      this.sair();
      return;
    }

    this.trocando = true;
    const cam = this.cameras.main;
    cam.fadeOut(900, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.mostrarSlide(this.slideAtual + 1);
      cam.fadeIn(900, 0, 0, 0);
      cam.once('camerafadeincomplete', () => { this.trocando = false; });
    });
  }

  sair() {
    this.trocando = true;
    const cam = this.cameras.main;
    cam.fadeOut(1300, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => this.scene.start('Mapa', { fase: 0 }));
  }
}