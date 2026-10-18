// Mapa do caminho até o castelo: mostra a cidade inteira, com os pinos desenhados por código.

// posições dos pinos sobre a imagem (em pixels do mapa de 1568 x 672)
const POSICOES_MAPA = [
  { x: 250, y: 320 },   // luta 1: praça do canto esquerdo
  { x: 575, y: 330 },   // luta 2: praça da igreja
  { x: 915, y: 330 },   // luta 3: praça do centro-direito
  { x: 1420, y: 190}   // castelo: centro do castelo
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
    // a fase é o índice da próxima luta (0 = primeira)
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

    // pinos das lutas, o último é o castelo
    POSICOES_MAPA.forEach((pos, i) => {
      const eCastelo = i === POSICOES_MAPA.length - 1;
      const feito = i < this.fase;
      const atual = i === this.fase;

      // cor: cinza para as vencidas, laranja para a atual, vermelho-escuro para as próximas
      const cor = feito ? 0x666666 : atual ? 0xff8a00 : 0x5a2a2a;

      // o pino é corrigido pelo zoom, para aparecer com tamanho legível na tela
      const escala = (eCastelo ? 1.6 : 1.2) / zoom;
      const pino = desenharPino(this, pos.x, pos.y, cor, escala);

      if (atual && !eCastelo) {
        // área de toque sobre o pino, em coordenadas do mapa
        const zona = this.add.zone(pos.x, pos.y - 12 / zoom, 28 / zoom, 32 / zoom)
          .setInteractive({ useHandCursor: true });
        zona.on('pointerdown', () => this.iniciarLuta());

        // o pino sobe e desce para chamar atenção
        this.tweens.add({ targets: [pino, zona], y: '-=10', duration: 400, yoyo: true, repeat: -1 });
      }
    });

    this.input.keyboard.once('keydown-ENTER', () => this.iniciarLuta());
  }

  iniciarLuta() {
    // o castelo ainda não está pronto, então não inicia nada
    if (this.fase >= LUTAS.length) return;
    if (this.iniciando) return;
    this.iniciando = true;

    this.scene.start('CenaLuta', { fase: this.fase });
  }
}