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

  // cria o campo de texto HTML por cima do jogo, na posição do retângulo da tela de nome.
  // No celular, quando o teclado abre o campo sobe para o topo da área visível, para o teclado não cobrir o que a pessoa digita
  criarCampo() {
    this.noToque = window.matchMedia('(pointer: coarse)').matches;

    const campo = document.createElement('input');
    campo.type = 'text';
    campo.maxLength = 12;
    campo.placeholder = 'YOUR NAME';
    campo.autocomplete = 'off';
    campo.enterKeyHint = 'go';   // o botão do teclado do celular vira "ir" e confirma o nome
    campo.style.cssText =
      `position: fixed;` +
      `font-family: monospace;` +
      `text-align: center;` +
      `color: #ffffff;` +
      `background: #000000;` +
      `border: 2px solid #ff8a00;` +
      `outline: none;` +
      `box-sizing: border-box;` +
      `z-index: 10;`;

    document.body.appendChild(campo);
    this.campoNome = campo;
    this.campoNoTopo = false;
    this.posicionarCampo();

    campo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.confirmar();
    });

    if (this.noToque) {
      this.aoFocar = () => { this.campoNoTopo = true; this.posicionarCampo(); };
      this.aoDesfocar = () => { this.campoNoTopo = false; this.posicionarCampo(); };
      this.aoMexerViewport = () => { if (this.campoNoTopo) this.posicionarCampo(); };
      campo.addEventListener('focus', this.aoFocar);
      campo.addEventListener('blur', this.aoDesfocar);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', this.aoMexerViewport);
        window.visualViewport.addEventListener('scroll', this.aoMexerViewport);
      }
    }

    campo.focus();
  }

  // põe o campo no lugar: no retângulo do jogo, ou (teclado aberto no celular) no topo da área visível da tela
  posicionarCampo() {
    const campo = this.campoNome;
    if (!campo) return;

    if (this.campoNoTopo) {
      const vv = window.visualViewport;
      const larguraTela = vv ? vv.width : window.innerWidth;
      const largura = Math.min(300, larguraTela - 24);
      campo.style.left = `${(vv ? vv.offsetLeft : 0) + (larguraTela - largura) / 2}px`;
      campo.style.top = `${(vv ? vv.offsetTop : 0) + 8}px`;
      campo.style.width = `${largura}px`;
      campo.style.height = '40px';
      campo.style.fontSize = '20px';
      return;
    }

    const r = this.game.canvas.getBoundingClientRect();
    const escala = r.width / 512; // quanto o jogo foi ampliado ou reduzido na tela
    campo.style.left = `${r.left + (256 - 110) * escala}px`;
    campo.style.top = `${r.top + (110 - 16) * escala}px`;
    campo.style.width = `${220 * escala}px`;
    campo.style.height = `${32 * escala}px`;
    campo.style.fontSize = `${16 * escala}px`;
  }

  removerCampo() {
    if (window.visualViewport && this.aoMexerViewport) {
      window.visualViewport.removeEventListener('resize', this.aoMexerViewport);
      window.visualViewport.removeEventListener('scroll', this.aoMexerViewport);
    }
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
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Abertura'));
  }
}