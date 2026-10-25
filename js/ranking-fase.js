// Ranking da fase: aparece depois do K.O. Mostra o tempo da luta e o top 15 daquela fase, com a data de cada vitória.

// grava o tempo da luta vencida no ranking da fase, com a data da vitória e o identificador da run (chamado pelo K.O., em luta/vilao-dano.js)
function registrarTempo(cena) {
  db.collection('ranking').add({
    nome: cena.game.nomeJogador || 'ANON',
    fase: cena.fase + 1,                          // luta 1, 2, 3 ou 4
    tempo: Number(cena.tempoLuta.toFixed(2)),     // em segundos
    data: new Date(),                             // data e hora da vitória
    runId: cena.game.runId || null,               // liga este tempo à run completa
    perfect: !cena.heroiLevouDano                 // true se venceu sem levar dano (o selo PERFECT do ranking)
  }).catch((erro) => console.error('Erro ao salvar ranking:', erro));
}

class RankingFase extends Phaser.Scene {
  constructor() {
    super('RankingFase');
  }

  init(data) {
    this.fase = data.fase;     // índice da luta vencida (0 = primeira)
    this.tempo = data.tempo;   // tempo da luta em segundos
    this.perfeito = !!data.perfeito;   // venceu sem levar dano
    this.saindo = false;
    this.game.progresso = Math.max(this.game.progresso || 0, this.fase + 1);
    if (this.game.desistidas) delete this.game.desistidas[this.fase];   // venceu uma luta que tinha pulado: agora ela conta como vencida
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

    const textoTempo = this.add.text(256, 40, `YOUR TIME: ${formatarTempo(this.tempo)}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    // sem ter levado dano na luta: PERFECT! amarelo e piscando ao lado do tempo
    if (this.perfeito) {
      const perfect = this.add.text(textoTempo.x + textoTempo.width / 2 + 8, 40, 'PERFECT!', {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffd23f'
      }).setOrigin(0, 0);
      this.tweens.add({ targets: perfect, alpha: 0.25, duration: 450, yoyo: true, repeat: -1 });
    }

    this.add.text(256, 60, `TOP 15 - FIGHT ${numero}`, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#cccccc'
    }).setOrigin(0.5, 0);

    const estilo = {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
      lineSpacing: RANKING_ESPACO
    };

    // duas colunas: 1 a 8 à esquerda, 9 a 15 à direita
    this.listaEsq = this.add.text(16, 74, 'LOADING...', estilo).setOrigin(0, 0);
    this.listaDir = this.add.text(262, 74, '', estilo).setOrigin(0, 0);

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
        const todos = snap.docs
          .map((doc) => doc.data())
          .sort((a, b) => a.tempo - b.tempo);
        const melhores = todos.slice(0, 15);

        if (melhores.length === 0) {
          this.listaEsq.setText('NO RECORDS YET');
          return;
        }

        const linhas = melhores.map((r, i) => ({
          texto: `${String(i + 1).padStart(2)}. ${r.nome.slice(0, 8).padEnd(8)} ${RANKING_RESERVA}${formatarTempo(r.tempo)} ${this.formatarData(r.data)}`,
          perfect: r.perfect === true
        }));
        this.listaEsq.setText(linhas.slice(0, 8).map((l) => l.texto).join('\n'));
        this.listaDir.setText(linhas.slice(8).map((l) => l.texto).join('\n'));

        // o carimbo PERFECT, amarelo e piscando, ao lado do nome das vitórias sem dano
        selosPerfect(this, this.listaEsq, linhas.slice(0, 8), '8px', RANKING_ESPACO);
        selosPerfect(this, this.listaDir, linhas.slice(8), '8px', RANKING_ESPACO);

        // se o tempo do jogador ficou fora do top 15, a posição dele aparece no fim da lista (só nesta tela; nada é gravado)
        const meuTempo = Number(this.tempo.toFixed(2));   // o mesmo valor que foi gravado no ranking
        const posicao = todos.filter((r) => r.tempo < meuTempo).length + 1;
        if (posicao > 15) this.mostrarPosicao(posicao);
      })
      .catch(() => this.listaEsq.setText('ERROR LOADING RANKING'));
  }

  // a linha do jogador, em laranja, logo abaixo da coluna da direita: posição real, nome, tempo e a data de hoje
  mostrarPosicao(posicao) {
    const nome = (this.game.nomeJogador || 'ANON').slice(0, 8);
    const hoje = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const y = this.listaDir.y + this.listaDir.height + RANKING_ESPACO;   // a linha seguinte da coluna da direita

    const texto = `${String(posicao).padStart(2)}. ${nome.padEnd(8)} ${RANKING_RESERVA}${formatarTempo(this.tempo)} ${hoje}`;
    const linha = this.add.text(262, y, texto, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ff8a00'
    }).setOrigin(0, 0);

    // o carimbo PERFECT também aparece na linha do jogador, se ele venceu sem levar dano
    selosPerfect(this, linha, [{ texto, perfect: this.perfeito }], '8px', RANKING_ESPACO);
  }

  continuar() {
    if (this.saindo) return;
    this.saindo = true;

    const proximaLuta = this.fase + 1;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // a cutscene do boss só toca se o jogador ainda não entrou nele (ele pode ter pulado a luta 3 e vencido depois)
      if (this.fase === 2 && !(this.game.fasesVistas || {})[LUTAS.length - 1]) this.scene.start('CutsceneBoss');
      else if (proximaLuta >= LUTAS.length) this.scene.start('Final');
      else this.scene.start('Mapa', { fase: this.game.progresso });
    });
  }
}