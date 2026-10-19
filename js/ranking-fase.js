// Ranking da fase: aparece depois do K.O. Mostra o tempo da luta e o top 15 daquela fase, com a data de cada vitória.

class RankingFase extends Phaser.Scene {
  constructor() {
    super('RankingFase');
  }

  init(data) {
    this.fase = data.fase;     // índice da luta vencida (0 = primeira)
    this.tempo = data.tempo;   // tempo da luta em segundos
    this.saindo = false;
  }

  create() {
    const numero = this.fase + 1;

    this.add.rectangle(0, 0, 512, 224, 0x000000, 0.85).setOrigin(0, 0);

    this.add.text(256, 14, `FIGHT ${numero} CLEARED`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ff8a00',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5, 0);

    this.add.text(256, 40, `YOUR TIME: ${formatarTempo(this.tempo)}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    this.add.text(256, 60, `TOP 15 - FIGHT ${numero}`, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#cccccc'
    }).setOrigin(0.5, 0);

    const estilo = {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffffff',
      lineSpacing: 4
    };

    // duas colunas: 1 a 8 à esquerda, 9 a 15 à direita
    this.listaEsq = this.add.text(16, 80, 'LOADING...', estilo).setOrigin(0, 0);
    this.listaDir = this.add.text(262, 80, '', estilo).setOrigin(0, 0);

    this.carregarRanking(numero);

    // o aviso para continuar só aparece depois de 1 s, para não pular a tela sem querer
    this.time.delayedCall(1000, () => {
      const aviso = this.add.text(256, 205, 'TAP OR ENTER TO CONTINUE', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      this.tweens.add({ targets: aviso, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

      this.input.once('pointerdown', () => this.continuar());
      this.input.keyboard.once('keydown-ENTER', () => this.continuar());
    });
  }

  // converte a data do Firebase no formato DD/MM/AA; registros antigos (sem data) ficam com --/--/--
  formatarData(data) {
    if (!data || !data.toDate) return '--/--/--';
    return data.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  // busca os tempos da fase no Firebase e mostra os 15 melhores
  carregarRanking(numero) {
    db.collection('ranking').where('fase', '==', numero).get()
      .then((snap) => {
        const melhores = snap.docs
          .map((doc) => doc.data())
          .sort((a, b) => a.tempo - b.tempo)
          .slice(0, 15);

        if (melhores.length === 0) {
          this.listaEsq.setText('NO RECORDS YET');
          return;
        }

        const linhas = melhores.map((r, i) =>
          `${String(i + 1).padStart(2)}. ${r.nome.slice(0, 8).padEnd(8)} ${formatarTempo(r.tempo)} ${this.formatarData(r.data)}`
        );
        this.listaEsq.setText(linhas.slice(0, 8).join('\n'));
        this.listaDir.setText(linhas.slice(8).join('\n'));
      })
      .catch(() => this.listaEsq.setText('ERROR LOADING RANKING'));
  }

  continuar() {
    if (this.saindo) return;
    this.saindo = true;

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Mapa', { fase: this.fase + 1 }));
  }
}