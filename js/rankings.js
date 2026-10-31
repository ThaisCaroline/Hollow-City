// Tela de rankings: aba GERAL (run completa, soma dos 4 tempos) e abas FASE 1 a 4.

function dataCurta(ts) {
  if (!ts || !ts.toDate) return '--/--/--';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

class Rankings extends Phaser.Scene {
  constructor() {
    super('Rankings');
  }

  init() {
    this.abas = ['FULL RUN', 'FIGHT 1', 'FIGHT 2', 'FIGHT 3', 'FIGHT 4'];
    this.abaAtual = 0;
    this.dados = null;
  }

  create() {
    this.add.rectangle(0, 0, 512, 224, 0x000000, 0.9).setOrigin(0, 0);

    this.add.text(256, 8, 'RANKINGS', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ff8a00',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5, 0);

    // abas no topo: GERAL e as 4 fases
    this.botoesAbas = this.abas.map((nome, i) => {
      const aba = this.add.text(52 + i * 102, 40, nome, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#222222',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      aba.on('pointerdown', () => this.trocarAba(i));
      return aba;
    });

    const estilo = { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', lineSpacing: RANKING_ESPACO };
    this.lista1 = this.add.text(16, 66, '', estilo).setOrigin(0, 0);
    this.lista2 = this.add.text(262, 66, '', estilo).setOrigin(0, 0);

    const voltar = this.add.text(256, 204, 'BACK', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerdown', () => this.voltar());

    this.carregarDados();
  }

  // busca todos os registros uma vez; trocar de aba não refaz a consulta
  carregarDados() {
    this.lista1.setText('LOADING...');
    this.lista2.setText('');

    db.collection('ranking').get()
      .then((snap) => {
        this.dados = snap.docs.map((doc) => doc.data());
        this.mostrarAba();
      })
      .catch(() => {
        this.lista1.setText('ERROR LOADING RANKING');
        this.lista2.setText('');
      });
  }

  trocarAba(i) {
    this.abaAtual = i;
    this.mostrarAba();
  }

  mostrarAba() {
    if (!this.dados) return;

    this.botoesAbas.forEach((aba, j) => {
      const ativa = j === this.abaAtual;
      aba.setBackgroundColor(ativa ? '#ff8a00' : '#222222');
      aba.setColor(ativa ? '#000000' : '#ffffff');
    });

    const linhas = this.abaAtual === 0 ? this.linhasGeral() : this.linhasFase(this.abaAtual);

    // apaga os PERFECT da aba anterior
    (this.selos || []).forEach((s) => { this.tweens.killTweensOf(s); s.destroy(); });
    this.selos = [];

    if (linhas.length === 0) {
      this.lista1.setText('NO RECORDS YET');
      this.lista2.setText('');
      return;
    }

    this.lista1.setText(linhas.slice(0, 8).map((l) => l.texto).join('\n'));
    this.lista2.setText(linhas.slice(8, 15).map((l) => l.texto).join('\n'));

    // o carimbo PERFECT, amarelo e piscando, ao lado do nome das linhas sem dano (na aba FULL RUN, só as runs com as 4 lutas sem dano)
    this.selos = [
      ...selosPerfect(this, this.lista1, linhas.slice(0, 8), '8px', RANKING_ESPACO),
      ...selosPerfect(this, this.lista2, linhas.slice(8, 15), '8px', RANKING_ESPACO)
    ];
  }

  // top 15 de uma fase, pelo menor tempo
  linhasFase(fase) {
    return this.dados
      .filter((r) => r.fase === fase)
      .sort((a, b) => a.tempo - b.tempo)
      .slice(0, 15)
      .map((r, i) => ({
        texto: `${String(i + 1).padStart(2)}. ${r.nome.slice(0, 8).padEnd(8)} ${RANKING_RESERVA}${formatarTempo(r.tempo)} ${dataCurta(r.data)}`,
        perfect: r.perfect === true
      }));
  }

  // top 15 de runs completas: soma do melhor tempo de cada uma das 4 fases
  linhasGeral() {
    const runs = {};

    this.dados.forEach((r) => {
      if (!r.runId || !r.fase) return; // registros antigos, sem runId, não entram no geral

      const run = runs[r.runId] || (runs[r.runId] = { nome: r.nome, data: r.data, tempos: {}, perfeitos: {} });
      if (run.tempos[r.fase] === undefined || r.tempo < run.tempos[r.fase]) {
        run.tempos[r.fase] = r.tempo;
        run.perfeitos[r.fase] = r.perfect === true;   // a luta que vale para o geral foi sem dano?
      }
      if (r.data && r.data.toMillis && (!run.data || run.data.toMillis() < r.data.toMillis())) run.data = r.data;
    });

    const completas = Object.values(runs).filter((run) => [1, 2, 3, 4].every((f) => run.tempos[f] !== undefined));
    completas.forEach((run) => {
      run.total = [1, 2, 3, 4].reduce((soma, f) => soma + run.tempos[f], 0);
    });
    completas.sort((a, b) => a.total - b.total);

    return completas
      .slice(0, 15)
      .map((run, i) => ({
        texto: `${String(i + 1).padStart(2)}. ${run.nome.slice(0, 8).padEnd(8)} ${RANKING_RESERVA}${formatarCronometro(run.total * 1000)} ${dataCurta(run.data)}`,
        perfect: [1, 2, 3, 4].every((f) => run.perfeitos[f])   // as 4 lutas da run foram sem dano
      }));
  }

  voltar() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TelaInicial'));
  }
}