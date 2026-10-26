// Luta: a entrada do herói, os diálogos de antes da luta, a chegada do vilão e o começo do combate.
// Os métodos são copiados para a CenaLuta no game.js, então o this é a cena.

class LutaEntrada {
  // o estado da entrada e dos diálogos no começo de cada luta (chamado pelo create)
  iniciarEstadoEntrada(comEntrada) {
    this.emEntrada = comEntrada; // true enquanto o herói entra e os diálogos acontecem
    this.emDialogo = false;
    this.emCombate = false;      // só fica true quando o vilão passa a agir e a receber dano
  }

  // o herói anda pela esquerda até o meio da tela; a cidade rola junto, mais devagar
  atualizarEntrada(delta) {
    if (this.emDialogo) return;

    const passo = (velocidade) => (velocidade * delta) / 1000;
    const esquerda = this.teclas.left.isDown || this.toque.esquerda;
    const direita = this.teclas.right.isDown || this.toque.direita;

    const xAntes = this.heroi.x;
    if (!this.heroiAtacando && !this.heroiAgachado) {
      if (direita) this.heroi.x += passo(VELOCIDADE_HEROI);
      else if (esquerda) this.heroi.x -= passo(VELOCIDADE_HEROI);
      this.heroi.x = Phaser.Math.Clamp(this.heroi.x, 32, 256);

      if (!this.heroiNoAr) {
        if (esquerda || direita) {
          this.heroi.play('heroi-andar', true);
          this.heroi.setFlipX(esquerda && !direita);
        } else {
          this.heroi.stop();
          this.heroi.setFrame(0);
        }
      }
    }

    this.fundo.tilePositionX += (this.heroi.x - xAntes) * 0.5;

    // chegou ao meio da tela: para e começa o diálogo
    if (this.heroi.x >= 256) this.iniciarDialogoHeroi();
  }

  iniciarDialogoHeroi() {
    this.emDialogo = true;
    this.heroi.stop();
    this.heroi.setFrame(0);

    mostrarDialogo(this, traduzir('nome.detetive'), traduzir(`luta${this.fase + 1}.detetive`), () => this.chegaVilao(), RETRATO_HEROI);
  }

  // o vilão entra pela direita e fala antes da luta
  chegaVilao() {
    // uivo da entrada (só o lobo tem): toca quando ele começa a entrar, antes do diálogo dele.
    // O arquivo tem 7,4 s: toca só os primeiros ~3 s, com fade-out (começa em 2,2 s e dura 0,8 s)
    if (this.cfg.sons && this.cfg.sons.entrada && this.cache.audio.exists(this.cfg.sons.entrada)) {
      const uivo = this.sound.add(this.cfg.sons.entrada, { volume: 0.9 });
      uivo.play();
      this.time.delayedCall(2200, () => {
        this.tweens.add({
          targets: uivo,
          volume: 0,
          duration: 800,
          onComplete: () => uivo.destroy()
        });
      });
    }

    const origemX = this.cfg.entradaX || 500;   // de onde ele nasce (uma fase pode pedir para entrar de fora da tela)
    this.vilao.setVisible(true);
    this.vilao.x = origemX;
    this.virarVilao(true); // olha para a esquerda, para o herói
    this.vilao.play(this.cfg.anims.andar, true);

    this.tweens.add({
      targets: this.vilao,
      x: 360,
      duration: ((origemX - 360) / (this.cfg.velocidadeEntrada || 90)) * 1000,   // pixels por segundo (90, ou o que a fase pedir)
      ease: 'Linear',
      onComplete: () => {
        this.vilaoParado();
        mostrarDialogo(this, traduzir(`luta${this.fase + 1}.nome`), traduzir(`luta${this.fase + 1}.vilao`), () => this.comecarCombate(), this.cfg.retrato);
      }
    });
  }

  // a luta começa: barra de vida na tela e o fundo para de rolar
  comecarCombate() {
    this.emEntrada = false;
    this.emDialogo = false;
    this.emCombate = true;           // a partir daqui o vilão age e recebe dano

    // recomeço direto na fase 2 do boss: o cronômetro e as balas voltam como estavam no fim da fase 1; nas outras lutas, descarta o que sobrou
    const sobras = this.cfg.recomecarAqui ? this.game.bossFase1Sobras : null;
    if (!this.cfg.recomecarAqui) this.game.bossFase1Sobras = null;

    this.inicioLuta = this.time.now - (sobras ? sobras.tempo : 0); // começa o cronômetro desta tentativa (já com o tempo da fase 1, se for o caso)

    // munição cheia no começo do combate (os tiros de teste da entrada não contam); na fase 2 do boss, a que sobrou da fase 1
    this.municao = sobras ? sobras.municao : (this.cfg.tiro ? this.cfg.tiro.municao : 0);
    this.atualizarMunicao();

    // marca a fase como vista, para a entrada não se repetir nas tentativas seguintes
    this.game.fasesVistas = this.game.fasesVistas || {};
    const primeiraVez = !this.game.fasesVistas[this.fase];
    this.game.fasesVistas[this.fase] = true;

    // sussurro das almas, só na primeira vez que a luta começa na run (se o herói perder e tentar de novo, não repete)
    if (primeiraVez) this.sussurrarAlmas();

    this.vilao.setVisible(true);
    this.vilaoProximoAtaque = this.time.now + 1500; // primeiro golpe depois de 1,5 s
    this.vilaoProximaEsquiva = this.time.now + this.cfg.primeiraEsquiva;
    if (this.cfg.bloqueio) this.vilaoProximoBloqueio = this.time.now + this.cfg.bloqueio.primeiro;
    if (this.cfg.golpes && this.cfg.golpes.investida) this.vilaoProximaInvestida = this.time.now + this.cfg.golpes.investida.primeira;

    criarBarrasDeVida(this);

    // cronômetro da luta, no topo da tela
    this.textoTimer = this.add.text(256, 36, '00:00.00', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0).setDepth(21);
  }
}