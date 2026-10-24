// Tela de nome: aparece depois da tela inicial e antes do mapa. O nome vale para toda a run.

class TelaNome extends Phaser.Scene {
  constructor() {
    super('TelaNome');
  }

  create() {
    this.confirmado = false;
    this.saindo = false;

    this.add.image(0, 0, 'cenario').setOrigin(0, 0);
    this.add.rectangle(0, 0, 512, 224, 0x000000, 0.6).setOrigin(0, 0);

    this.add.text(256, 50, 'WHO IS PLAYING?', {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ff8a00',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.aviso = this.add.text(256, 145, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ff6666'
    }).setOrigin(0.5);

    const botao = this.add.text(256, 180, 'START', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    botao.on('pointerdown', () => this.confirmar());

    const voltar = this.add.text(256, 206, 'BACK', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerdown', () => this.voltar());

    // o campo HTML é removido sempre que a cena termina, por qualquer caminho
    this.events.once('shutdown', () => this.removerCampo());

    this.criarCampo();
  }

  // cria o campo de texto HTML por cima do jogo, na posição do retângulo da tela de nome
  criarCampo() {
    const r = this.game.canvas.getBoundingClientRect();
    const escala = r.width / 512; // quanto o jogo foi ampliado ou reduzido na tela

    const campo = document.createElement('input');
    campo.type = 'text';
    campo.maxLength = 12;
    campo.placeholder = 'YOUR NAME';
    campo.autocomplete = 'off';
    campo.style.cssText =
      `position: fixed;` +
      `left: ${r.left + (256 - 110) * escala}px;` +
      `top: ${r.top + (110 - 16) * escala}px;` +
      `width: ${220 * escala}px;` +
      `height: ${32 * escala}px;` +
      `font-family: monospace;` +
      `font-size: ${16 * escala}px;` +
      `text-align: center;` +
      `color: #ffffff;` +
      `background: #000000;` +
      `border: 2px solid #ff8a00;` +
      `outline: none;` +
      `box-sizing: border-box;` +
      `z-index: 10;`;

    document.body.appendChild(campo);
    this.campoNome = campo;

    campo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.confirmar();
    });
    campo.focus();
  }

  removerCampo() {
    if (this.campoNome && this.campoNome.parentNode) this.campoNome.remove();
    this.campoNome = null;
  }

  voltar() {
    if (this.confirmado || this.saindo) return;
    this.saindo = true;

    this.removerCampo();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TelaInicial'));
  }

  confirmar() {
    if (this.confirmado || this.saindo) return;

    const nome = this.campoNome ? this.campoNome.value.trim() : '';
    if (!nome) {
      this.aviso.setText('ENTER A NAME');
      return;
    }

    this.confirmado = true;
    this.game.nomeJogador = nome.slice(0, 12); // fica guardado enquanto a página estiver aberta
    this.game.runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); // identifica esta run

    // nova run: começa do zero, sem as lutas já liberadas da run anterior
    this.game.progresso = 0;
    this.game.fasesVistas = {};
    this.game.desistidas = {};   // lutas puladas com o TOO HARD? (recomeça vazio a cada run)

    this.removerCampo();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Mapa', { fase: 0 }));
  }
}