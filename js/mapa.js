// Mapa do caminho até o castelo: mostra a cidade inteira, com os pinos desenhados por código.
// Lutas já vencidas podem ser repetidas, a atual pisca e as seguintes ficam bloqueadas.
// Uma luta pulada com o TOO HARD? continua como CLICK TO ENTER (pisca) e a seguinte já fica liberada.
// Cada pino tem a legenda STAGE 1 a 4, e o botão ENDING mostra o final a qualquer momento.

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

    const pendentes = [];   // lutas ainda por vencer e já liberadas: a próxima a jogar e as puladas com o TOO HARD?

    POSICOES_MAPA.forEach((pos, i) => {
      const pulada = i < progresso && !!(this.game.desistidas || {})[i];   // liberada, mas nunca vencida
      const feito = i < progresso && !pulada;            // já vencida: pode repetir
      const atual = (i === progresso && progresso < LUTAS.length) || pulada; // ainda por vencer: próxima a jogar ou pulada
      const bloqueado = i > progresso;                   // ainda não liberada
      const jogavel = feito || atual;
      if (atual) pendentes.push(i);

      // cor: cinza para as vencidas, laranja para a atual, escuro para as bloqueadas
      const cor = feito ? 0x666666 : atual ? 0xff8a00 : 0x333333;

      // o pino é corrigido pelo zoom, para aparecer com tamanho legível na tela
      const escala = 1.2 / zoom;
      const pino = desenharPino(this, pos.x, pos.y, cor, escala);

      // número da luta, em inglês, em cima do pino
      const etiqueta = this.add.text(pos.x, pos.y - 28 * escala, `STAGE ${i + 1}`, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(9 / zoom)}px`,
        fontStyle: 'bold',
        color: bloqueado ? '#777777' : '#ffffff',
        stroke: '#000000',
        strokeThickness: Math.max(2, Math.round(2 / zoom))
      }).setOrigin(0.5, 1).setDepth(11);

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
          this.tweens.add({ targets: [pino, zona, texto, etiqueta], y: '-=10', duration: 400, yoyo: true, repeat: -1 });
        }
      }
    });

    // ENTER inicia a luta mais adiante que ainda está por vencer (a próxima a jogar)
    this.input.keyboard.once('keydown-ENTER', () => {
      if (pendentes.length) this.iniciarLuta(pendentes[pendentes.length - 1]);
    });

    // botão para voltar à tela inicial; escalado pelo inverso do zoom para ficar legível
    const botaoVoltar = this.add.text(larguraMapa / 2 - 80 / zoom, alturaMapa - 30, 'BACK', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setScale(1 / zoom).setDepth(30).setInteractive({ useHandCursor: true });
    botaoVoltar.on('pointerdown', () => this.voltarInicio());

    // botão ENDING: mostra o final (a cena de quando se vence o último boss); ao terminar, volta para este mapa
    const botaoFinal = this.add.text(larguraMapa / 2 - 12 / zoom, alturaMapa - 30, 'ENDING', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffd23f',
      backgroundColor: '#000000',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setScale(1 / zoom).setDepth(30).setInteractive({ useHandCursor: true });
    botaoFinal.on('pointerdown', () => this.abrirFinal());

    // botão BESTIARY: abre o bestiário (os bosses, com a lenda e as dicas); ao sair, volta para este mapa
    const botaoBestiario = this.add.text(larguraMapa / 2 + 68 / zoom, alturaMapa - 30, 'BESTIARY', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ff8a00',
      backgroundColor: '#000000',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setScale(1 / zoom).setDepth(30).setInteractive({ useHandCursor: true });
    botaoBestiario.on('pointerdown', () => this.abrirBestiario());

    this.input.keyboard.once('keydown-ESC', () => this.voltarInicio());
  }

  iniciarLuta(fase) {
    // o castelo ainda não está pronto, então não inicia nada além das lutas do caminho
    if (fase >= LUTAS.length) return;
    if (this.iniciando) return;
    this.iniciando = true;

    // o boss: na primeira vez que o jogador entra nele (por exemplo, depois de pular a luta 3), toca a cutscene antes da luta
    if (fase === LUTAS.length - 1 && !(this.game.fasesVistas || {})[fase]) {
      this.scene.start('CutsceneBoss');
      return;
    }

    this.scene.start('CenaLuta', { fase: fase });
  }

  abrirBestiario() {
    if (this.iniciando) return;
    this.iniciando = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Bestiario', { voltarPara: 'Mapa' }));
  }

  abrirFinal() {
    if (this.iniciando) return;
    this.iniciando = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Final', { voltarPara: 'Mapa' }));
  }

  voltarInicio() {
    if (this.iniciando) return;
    this.iniciando = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TelaInicial'));
  }
}