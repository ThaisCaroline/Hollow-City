// Tela inicial: aparece antes da luta. O clique ou Enter aqui libera o áudio e inicia a trilha.

class TelaInicial extends Phaser.Scene {
  constructor() {
    super('TelaInicial');
  }

  preload() {
    // os sons são carregados aqui, porque a trilha começa nesta tela
    carregarSons(this);

    if (!this.textures.exists('cenario')) {
      this.load.image('cenario', 'assets/cenario-noite.png');
    }
  }

  create() {
    this.iniciando = false;

    this.add.image(0, 0, 'cenario').setOrigin(0, 0);

    // escurece o cenário para o texto ficar legível
    this.add.rectangle(0, 0, 512, 224, 0x000000, 0.55).setOrigin(0, 0);

    this.add.text(256, 60, 'HOLLOW CITY', {
      fontFamily: 'monospace',
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ff8a00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const aviso = this.add.text(256, 130, 'TAP TO START', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // piscando, para chamar o jogador para tocar
    this.tweens.add({ targets: aviso, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    // legenda dos comandos: no teclado, todos; no celular (sem teclado), uma dica dos botões na tela
    const ehCelular = !this.sys.game.device.os.desktop;
    const legenda = ehCelular
      ? 'USE THE ON-SCREEN BUTTONS\nLEFT: MOVE   RIGHT: JUMP AND ATTACK'
      : 'ARROWS: MOVE   UP / SPACE: JUMP   DOWN: CROUCH\nZ: PUNCH   X: SHOOT   C: POTION';
    this.add.text(256, 174, legenda, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 3
    }).setOrigin(0.5);

    // botão de rankings, na parte de baixo da tela
    const botaoRanking = this.add.text(190, 200, 'RANKINGS', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ff8a00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    botaoRanking.on('pointerdown', () => this.abrirRankings());

    // botão do bestiário, ao lado do RANKINGS
    const botaoBestiario = this.add.text(322, 200, 'BESTIARY', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ff8a00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    botaoBestiario.on('pointerdown', () => this.abrirBestiario());

    // toque na parte de cima começa a luta; a faixa de baixo é dos botões
    this.input.on('pointerdown', (ponteiro) => {
      if (ponteiro.y > 165) return;
      this.iniciarLuta();
    });
    this.input.keyboard.once('keydown-ENTER', () => this.iniciarLuta());
  }

  abrirBestiario() {
    if (this.iniciando) return;
    this.iniciando = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Bestiario', { voltarPara: 'TelaInicial' }));
  }

  abrirRankings() {
    if (this.iniciando) return;
    this.iniciando = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Rankings'));
  }

  iniciarLuta() {
    // evita iniciar duas vezes se o jogador tocar e apertar Enter juntos
    if (this.iniciando) return;
    this.iniciando = true;

    // a trilha começa aqui, no clique do jogador
    tocarMusica(this, 'musica-luta');

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TelaNome'));
  }
}