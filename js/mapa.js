// Mapa do caminho até o castelo: mostra a cidade inteira, com os pinos desenhados por código.
// Lutas já vencidas podem ser repetidas, a atual pisca e as seguintes ficam bloqueadas.

// posições dos pinos sobre a imagem (em pixels do mapa de 1568 x 672)
const POSICOES_MAPA = [
  { x: 250, y: 320 },   // luta 1: praça do canto esquerdo
  { x: 575, y: 330 },   // luta 2: praça da igreja
  { x: 915, y: 330 },   // luta 3: praça do centro-direito
  { x: 1224, y: 386 }   // luta 4: praça à direita do rio
];

// desenha um pino de mapa: contorno preto, corpo colorido e furo branco no meio.
// (x, y) é a ponta do pino, que fica exatamente sobre o ponto do mapa.
function desenharPino(cena, x, y, cor, escala = 1) {
  const g = cena.add.graphics().setDepth(10);
  const r = 8 * escala;          // raio da cabeça do pino
  const cy = y - 16 * escala;    // centro da cabeça

  // contorno preto (um pouco maior que o corpo)
  g.fillStyle(0x000000, 1);
  g.fillCircle(x, cy, r + 2 * escala);
  g.fillTriangle(x - (r + 2 * escala), cy, x + (r + 2 * escala), cy, x, y + 2 * escala);

  // corpo colorido
  g.fillStyle(cor, 1);
  g.fillCircle(x, cy, r);
  g.fillTriangle(x - r, cy, x + r, cy, x, y);

  // furo branco no meio da cabeça
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x, cy, 3 * escala);

  return g;
}

class MapaCaminho extends Phaser.Scene {
  constructor() {
    super('Mapa');
  }

  init(data) {
    // a fase é o índice da próxima luta a jogar (0 = primeira)
    this.fase = (data && data.fase) || 0;
    this.iniciando = false;
  }

  preload() {
    this.load.image('mapa', 'assets/mapa.jpg');
  }

  create() {
    const larguraMapa = 1568;
    const alturaMapa = 672;

    // fundo com a cidade inteira
    this.add.image(0, 0, 'mapa').setOrigin(0, 0);

    // zoom que faz o mapa inteiro caber na tela, centralizado
    const camera = this.cameras.main;
    const zoom = Math.min(camera.width / larguraMapa, camera.height / alturaMapa);
    camera.setBounds(0, 0, larguraMapa, alturaMapa);
    camera.setZoom(zoom);
    camera.centerOn(larguraMapa / 2, alturaMapa / 2);

    // escurece levemente para os pinos ficarem legíveis
    this.add.rectangle(0, 0, larguraMapa, alturaMapa, 0x000000, 0.25)
      .setOrigin(0, 0);

    // progresso: quantas lutas já estão liberadas (a próxima a jogar é o índice "progresso")
    const progresso = Math.max(this.fase, this.game.progresso || 0);
    this.progressoAtual = progresso;

    POSICOES_MAPA.forEach((pos, i) => {
      const feito = i < progresso;                       // já vencida: pode repetir
      const atual = i === progresso && progresso < LUTAS.length; // próxima a jogar
      const bloqueado = i > progresso;                   // ainda não liberada
      const jogavel = feito || atual;

      // cor: cinza para as vencidas, laranja para a atual, escuro para as bloqueadas
      const cor = feito ? 0x666666 : atual ? 0xff8a00 : 0x333333;

      // o pino é corrigido pelo zoom, para aparecer com tamanho legível na tela
      const escala = 1.2 / zoom;
      const pino = desenharPino(this, pos.x, pos.y, cor, escala);

      // legenda em inglês, embaixo do pino
      const legenda = feito ? 'CLICK TO REPLAY' : atual ? 'CLICK TO ENTER' : 'LOCKED';
      const texto = this.add.text(pos.x, pos.y + 4 / zoom, legenda, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(9 / zoom)}px`,
        fontStyle: 'bold',
        color: bloqueado ? '#777777' : '#ffffff',
        stroke: '#000000',
        strokeThickness: Math.max(2, Math.round(2 / zoom))
      }).setOrigin(0.5, 0).setDepth(11);

      if (jogavel) {
        // área de toque sobre o pino, em coordenadas do mapa
        const zona = this.add.zone(pos.x, pos.y - 12 / zoom, 28 / zoom, 32 / zoom)
          .setInteractive({ useHandCursor: true });
        zona.on('pointerdown', () => this.iniciarLuta(i));

        // a luta atual sobe e desce para chamar atenção
        if (atual) {
          this.tweens.add({ targets: [pino, zona, texto], y: '-=10', duration: 400, yoyo: true, repeat: -1 });
        }
      }
    });

    // ENTER inicia a próxima luta liberada
    this.input.keyboard.once('keydown-ENTER', () => {
      if (progresso < LUTAS.length) this.iniciarLuta(progresso);
    });

    // botão para voltar à tela inicial; escalado pelo inverso do zoom para ficar legível
    const botaoVoltar = this.add.text(larguraMapa / 2, alturaMapa - 30, 'BACK', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setScale(1 / zoom).setDepth(30).setInteractive({ useHandCursor: true });
    botaoVoltar.on('pointerdown', () => this.voltarInicio());

    this.input.keyboard.once('keydown-ESC', () => this.voltarInicio());
  }

  iniciarLuta(fase) {
    // o castelo ainda não está pronto, então não inicia nada além das lutas do caminho
    if (fase >= LUTAS.length) return;
    if (this.iniciando) return;
    this.iniciando = true;

    this.scene.start('CenaLuta', { fase: fase });
  }

  voltarInicio() {
    if (this.iniciando) return;
    this.iniciando = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TelaInicial'));
  }
}