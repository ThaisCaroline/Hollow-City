// A cena de luta: herói, vilão e o loop principal.
// Constantes ficam em config.js; cores em recolor.js; barras e textos em hud.js; botões em controles.js; sons em audio.js; diálogos em dialogo.js; textos e sprites da fase em fases/fase1.js.

class CenaLuta extends Phaser.Scene {
  constructor() {
    super('CenaLuta');
  }

  init(data) {
    // fase = índice da luta no caminho (0 = primeira)
    this.fase = (data && data.fase) || 0;
  }

  preload() {
    // os sons são carregados na tela inicial (tela-inicial.js)

    this.load.image('cenario', 'assets/cenario-noite.png');
    this.load.spritesheet('vilao-andar', FASE1.sprites.andar, {
      frameWidth: FASE1.sprites.largura,
      frameHeight: FASE1.sprites.altura
    });
    this.load.spritesheet('vilao-surgir', FASE1.sprites.surgir, {
      frameWidth: FASE1.sprites.largura,
      frameHeight: FASE1.sprites.altura
    });
    this.load.spritesheet('heroi-andar', 'assets/heroi-andar.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('heroi-soco', 'assets/heroi-soco.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('heroi-morte', 'assets/heroi-morte.png', {
      frameWidth: 46,
      frameHeight: 32
    });
  }

  create() {
    // o cenário fica fixo na tela; ele só rola durante a caminhada da entrada
    this.fundo = this.add.tileSprite(0, 0, 512, 224, 'cenario').setOrigin(0, 0);

    // garante o estado normal ao reiniciar a luta
    this.anims.globalTimeScale = 1;
    this.cameras.main.setZoom(1);

    // prepara as cores do vilão (só na primeira vez, não ao reiniciar a luta)
    if (!this.textures.exists('vilao-preto')) {
      recolorir(this, 'vilao-andar', 'vilao-preto', CAPA_PRETA, 32, 48);
      recolorir(this, 'vilao-surgir', 'vilao-surgir-preto', CAPA_PRETA, 32, 48);
    }

    if (!this.anims.exists('vilao-andar')) {
      this.anims.create({
        key: 'vilao-andar',
        frames: this.anims.generateFrameNumbers('vilao-preto', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });

      // quadros do "surgir do chão", sem os que mostram a mão, a lâmina e o braço esticado
      // (10 e 9 = em pé, 8 = agachada, 1 e 0 = monte de terra)
      const AFUNDAR = [10, 9, 8, 1, 0];

      // a morte do vilão é afundar no chão
      this.anims.create({
        key: 'vilao-morte',
        frames: this.anims.generateFrameNumbers('vilao-surgir-preto', { frames: AFUNDAR }),
        frameRate: 5,
        repeat: 0
      });

      // esquiva: afunda no chão (rápido) e depois sai do chão atrás do herói
      this.anims.create({
        key: 'vilao-afundar',
        frames: this.anims.generateFrameNumbers('vilao-surgir-preto', { frames: AFUNDAR }),
        frameRate: 12,
        repeat: 0
      });

      this.anims.create({
        key: 'vilao-surgir',
        frames: this.anims.generateFrameNumbers('vilao-surgir-preto', { frames: [...AFUNDAR].reverse() }),
        frameRate: 7,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-andar',
        frames: this.anims.generateFrameNumbers('heroi-andar', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: 'heroi-soco',
        frames: this.anims.generateFrameNumbers('heroi-soco', { start: 0, end: 3 }),
        frameRate: 14,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-morte',
        frames: this.anims.generateFrameNumbers('heroi-morte', { start: 0, end: 4 }),
        frameRate: 8,
        repeat: 0
      });
    }

    // a primeira luta começa com a entrada do herói, antes da bruxa e da barra de vida
    const comEntrada = this.fase === 0 && !this.game.introVista;

    this.heroi = this.add.sprite(comEntrada ? 40 : 150, CHAO_Y, 'heroi-andar').setOrigin(0.5, 1).setScale(2);
    this.heroi.setFrame(0);
    this.heroiAtacando = false;
    this.heroiMorrendo = false;
    this.heroiNoAr = false;
    this.heroiAltura = 0;
    this.velocidadeY = 0;

    this.vilao = this.add.sprite(360, CHAO_Y, 'vilao-preto').setOrigin(0.5, 1).setScale(2);
    this.vilao.setFrame(0);
    this.vilao.setVisible(!comEntrada);
    this.vilaoAtacando = false;
    this.vilaoEsquivando = false;
    this.vilaoInvulneravel = false;
    this.vilaoProximoAtaque = 0;
    this.vilaoProximaEsquiva = 0;

    this.heroiVida = VIDA_HEROI;
    this.vilaoVida = VIDA_VILAO;
    this.fimDeJogo = false;
    this.emVirada = false;   // modo virada: o herói está abaixo de 30% de vida
    this.piscaOn = false;    // alterna a cor da barra do herói no modo virada
    this.socoAcertou = false;
    this.emEntrada = comEntrada; // true enquanto o herói entra e os diálogos acontecem
    this.emDialogo = false;

    this.teclas = this.input.keyboard.createCursorKeys();
    this.teclaSoco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.teclaPulo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    criarControlesDeToque(this);

    if (!comEntrada) this.comecarCombate();
  }

  // ---------- entrada e diálogos ----------

  // o herói anda pela esquerda até o meio da tela; a cidade rola junto, mais devagar
  atualizarEntrada(delta) {
    this.toque.soco = false;
    this.toque.pulo = false;
    if (this.emDialogo) return;

    const passo = (velocidade) => (velocidade * delta) / 1000;
    const esquerda = this.teclas.left.isDown || this.toque.esquerda;
    const direita = this.teclas.right.isDown || this.toque.direita;

    const xAntes = this.heroi.x;
    if (direita) this.heroi.x += passo(VELOCIDADE_HEROI);
    else if (esquerda) this.heroi.x -= passo(VELOCIDADE_HEROI);
    this.heroi.x = Phaser.Math.Clamp(this.heroi.x, 32, 256);

    this.fundo.tilePositionX += (this.heroi.x - xAntes) * 0.5;

    if (esquerda || direita) {
      this.heroi.play('heroi-andar', true);
      this.heroi.setFlipX(esquerda && !direita);
    } else {
      this.heroi.stop();
      this.heroi.setFrame(0);
    }

    // chegou ao meio da tela: para e começa o diálogo
    if (this.heroi.x >= 256) this.iniciarDialogoHeroi();
  }

  iniciarDialogoHeroi() {
    this.emDialogo = true;
    this.heroi.stop();
    this.heroi.setFrame(0);

    mostrarDialogo(this, 'DETECTIVE', FASE1.dialogoHeroi, () => this.chegaBruxa(), RETRATO_HEROI);
  }

  // a bruxa entra pela direita e fala antes da luta
  chegaBruxa() {
    this.vilao.setVisible(true);
    this.vilao.x = 500;
    this.vilao.setFlipX(true);
    this.vilao.play('vilao-andar', true);

    this.tweens.add({
      targets: this.vilao,
      x: 360,
      duration: 1600,
      ease: 'Linear',
      onComplete: () => {
        this.vilaoParado();
        mostrarDialogo(this, FASE1.nome, FASE1.dialogoBruxa, () => this.comecarCombate(), RETRATO_BRUXA);
      }
    });
  }

  // a luta começa: barra de vida na tela e o fundo para de rolar
  comecarCombate() {
    this.emEntrada = false;
    this.emDialogo = false;
    this.game.introVista = true;

    this.vilao.setVisible(true);
    this.vilaoProximoAtaque = this.time.now + 1500; // primeiro golpe depois de 1,5 s
    this.vilaoProximaEsquiva = this.time.now + PRIMEIRA_ESQUIVA;

    criarBarrasDeVida(this);
  }

  // ---------- herói ----------

  socar() {
    if (this.heroiAtacando || this.heroiNoAr) return;
    this.heroiAtacando = true;
    this.socoAcertou = false;
    this.heroi.play('heroi-soco');
    this.heroi.once('animationcomplete', () => {
      if (this.heroiMorrendo) return;
      this.heroiAtacando = false;
      this.heroi.setFrame(0);
    });
    this.tentarEsquivar();
  }

  danoNoHeroi() {
    tocarSom(this, 'dano');

    this.heroiVida = Math.max(0, this.heroiVida - DANO_VILAO);
    desenharBarras(this);

    // herói pisca em vermelho e recua um pouco
    this.heroi.setTint(0xff6666);
    this.time.delayedCall(100, () => this.heroi.clearTint());
    this.heroi.x += this.heroi.x < this.vilao.x ? -10 : 10;

    if (this.heroiVida <= 0) {
      this.derrotaDoHeroi();
    } else if (!this.emVirada && this.heroiVida <= LIMITE_VIRADA) {
      this.ativarVirada();
    }
  }

  // entra no modo virada uma única vez: soco mais forte e barra piscando
  ativarVirada() {
    tocarSom(this, 'virada');

    this.emVirada = true;
    this.cameras.main.shake(200, 0.006);

    this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        if (this.fimDeJogo) return;
        this.piscaOn = !this.piscaOn;
        desenharBarras(this);
      }
    });

    const texto = this.add.text(this.heroi.x, this.heroi.y - 90, 'COMEBACK!', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ff8a00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(26);

    this.tweens.add({
      targets: texto,
      y: texto.y - 12,
      alpha: 0,
      delay: 900,
      duration: 600,
      onComplete: () => texto.destroy()
    });
  }

  derrotaDoHeroi() {
    this.fimDeJogo = true;
    this.heroiMorrendo = true;
    this.heroiNoAr = false;
    this.heroiAltura = 0;
    this.heroi.y = CHAO_Y;
    this.heroi.clearTint();
    this.heroi.play('heroi-morte');

    // o som de derrota toca junto com o texto GAME OVER
    this.heroi.once('animationcomplete', () => {
      tocarSom(this, 'morte-heroi');
      mostrarFim(this, 'GAME OVER', null, '#e03030');
    });
  }

  // ---------- vilão ----------

  causarDano() {
    tocarSom(this, 'soco');

    // no modo virada, o soco tira mais vida da Morte
    const dano = this.emVirada ? DANO_SOCO_VIRADA : DANO_SOCO;
    this.vilaoVida = Math.max(0, this.vilaoVida - dano);
    desenharBarras(this);

    // vilão pisca em vermelho e recua um pouco
    this.vilao.setTint(0xff6666);
    this.time.delayedCall(100, () => this.vilao.clearTint());
    this.vilao.x += this.vilao.x > this.heroi.x ? 4 : -4;

    if (this.vilaoVida <= 0) this.derrotaDoVilao();
  }

  derrotaDoVilao() {
    this.fimDeJogo = true;
    this.vilao.clearTint();

    // impacto: flash, tremor, câmera lenta e zoom no vilão
    const cam = this.cameras.main;
    cam.flash(300, 255, 255, 255);
    cam.shake(400, 0.012);
    this.anims.globalTimeScale = 0.5;
    cam.zoomTo(1.5, 500);
    cam.pan(Phaser.Math.Clamp(this.vilao.x, 171, 341), 148, 500);

    this.vilao.play('vilao-morte');
    this.vilao.once('animationcomplete', () => {
      this.anims.globalTimeScale = 1;
      cam.zoomTo(1, 400);
      cam.pan(256, 112, 400);

      // o sino de K.O. toca junto com o texto, e depois o detetive segue para a próxima luta
      this.time.delayedCall(450, () => {
        tocarSom(this, 'ko');
        this.add.text(256, 90, 'K.O.!!!!', {
          fontFamily: 'monospace',
          fontSize: '44px',
          fontStyle: 'bold',
          color: '#ff8a00',
          stroke: '#000000',
          strokeThickness: 6
        }).setOrigin(0.5).setDepth(30);

        this.time.delayedCall(2000, () => this.scene.start('Mapa', { fase: this.fase + 1 }));
      });
    });
  }

  vilaoAtacar() {
    this.vilaoAtacando = true;
    this.vilao.setTint(0xffaa44); // aviso: o golpe vem aí (dá tempo de se afastar ou pular)

    // a Morte mira para o lado em que o herói estava quando o aviso começou
    const dir = this.heroi.x < this.vilao.x ? -1 : 1;

    this.time.delayedCall(450, () => {
      if (this.fimDeJogo) return;
      this.vilao.clearTint();

      // avanço rápido e arco de corte
      this.tweens.add({ targets: this.vilao, x: this.vilao.x + dir * 24, duration: 80, yoyo: true });
      this.desenharCorte(dir);

      const heroiNaFrente = (this.heroi.x - this.vilao.x) * dir > 0;
      const alcancou = Math.abs(this.vilao.x - this.heroi.x) <= ALCANCE_VILAO;

      if (alcancou && heroiNaFrente) {
        if (this.heroiAltura >= ALTURA_ESQUIVA) {
          this.mostrarEsquiva(); // herói estava no ar: o golpe passou por baixo
        } else {
          this.danoNoHeroi();
        }
      } else if (alcancou && !heroiNaFrente) {
        this.mostrarEsquiva(); // herói passou para trás dela: o golpe pegou só o ar
      }

      this.time.delayedCall(300, () => {
        this.vilaoAtacando = false;
        this.vilaoProximoAtaque = this.time.now + 1200;
      });
    });
  }

  // Morte parada em pé: sempre o quadro 0 da textura de andar.
  // (setFrame(0) sozinho usaria a textura atual, que depois da esquiva é a de surgir do chão = monte de terra)
  vilaoParado() {
    this.vilao.stop();
    this.vilao.setTexture('vilao-preto', 0);
  }

  // a Morte tenta esquivar quando o herói soca perto dela (com tempo de recarga)
  tentarEsquivar() {
    const perto = Math.abs(this.vilao.x - this.heroi.x) <= ALCANCE_SOCO;
    const livre = !this.vilaoAtacando && !this.vilaoEsquivando;
    if (perto && livre && this.time.now >= this.vilaoProximaEsquiva) this.vilaoEsquivar();
  }

  vilaoEsquivar() {
    tocarSom(this, 'esquiva');

    this.vilaoEsquivando = true;
    this.vilaoInvulneravel = true; // enquanto está debaixo da terra, o soco não pega
    this.vilao.clearTint();
    this.vilao.play('vilao-afundar');

    this.vilao.once('animationcomplete', () => {
      if (this.fimDeJogo) return;

      // some por um instante e reaparece atrás do herói
      this.time.delayedCall(250, () => {
        if (this.fimDeJogo) return;

        const lado = this.vilao.x > this.heroi.x ? -1 : 1;
        this.vilao.x = Phaser.Math.Clamp(this.heroi.x + lado * 50, 32, 480);

        // vulnerável enquanto sai do chão: é a hora de socá-la
        this.vilaoInvulneravel = false;
        this.vilao.play('vilao-surgir');

        this.vilao.once('animationcomplete', () => {
          if (this.fimDeJogo) return;
          this.vilaoEsquivando = false;
          this.vilaoProximaEsquiva = this.time.now + COOLDOWN_ESQUIVA;
          this.vilaoProximoAtaque = this.time.now + 400; // contra-ataque rápido
        });
      });
    });
  }

  mostrarEsquiva() {
    flutuarTexto(this, this.heroi.x, this.heroi.y - 70, 'DODGE!');
  }

  desenharCorte(dir) {
    const g = this.add.graphics().setDepth(15);
    g.lineStyle(3, 0xff8a00, 1);
    g.beginPath();
    const base = dir === 1 ? 0 : Math.PI;
    g.arc(this.vilao.x, this.vilao.y - 48, 38, base - 0.9, base + 0.9, false);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  }

  // ---------- loop principal ----------

  update(tempo, delta) {
    // durante a entrada e os diálogos, a luta fica parada
    if (this.emEntrada) {
      this.atualizarEntrada(delta);
      return;
    }

    if (this.fimDeJogo) return; // luta acabou: as animações de morte cuidam do resto

    const passo = (velocidade) => (velocidade * delta) / 1000;

    // herói: controlado pelo jogador
    const pediuSoco = Phaser.Input.Keyboard.JustDown(this.teclaSoco) || this.toque.soco;
    this.toque.soco = false;
    if (pediuSoco) this.socar();

    // pulo
    const pediuPulo = Phaser.Input.Keyboard.JustDown(this.teclaPulo) || this.toque.pulo;
    this.toque.pulo = false;
    if (pediuPulo && !this.heroiNoAr && !this.heroiAtacando) {
      this.heroiNoAr = true;
      this.velocidadeY = -VELOCIDADE_PULO;
      tocarSomAleatorio(this, SONS_PULO, 1.0);
    }
    if (this.heroiNoAr) {
      this.velocidadeY += GRAVIDADE * (delta / 1000);
      this.heroiAltura -= this.velocidadeY * (delta / 1000);
      if (this.heroiAltura <= 0) {
        this.heroiAltura = 0;
        this.heroiNoAr = false;
        this.velocidadeY = 0;
      }
    }
    this.heroi.y = CHAO_Y - this.heroiAltura;

    if (!this.heroiAtacando) {
      const esquerda = this.teclas.left.isDown || this.toque.esquerda;
      const direita = this.teclas.right.isDown || this.toque.direita;

      const velocidade = this.heroiNoAr ? VELOCIDADE_NO_AR : VELOCIDADE_HEROI;
      if (esquerda) this.heroi.x -= passo(velocidade);
      else if (direita) this.heroi.x += passo(velocidade);

      if (this.heroiNoAr) {
        this.heroi.stop();
        this.heroi.setTexture('heroi-andar', POSE_PULO);
      } else if (esquerda || direita) {
        this.heroi.play('heroi-andar', true);
      } else {
        this.heroi.stop();
        this.heroi.setFrame(0);
      }
    }

    // o soco acerta no quadro em que o braço está esticado (quadros 2 e 3)
    if (this.heroiAtacando && !this.socoAcertou) {
      const quadroAtual = Number(this.heroi.frame.name);
      const perto = Math.abs(this.vilao.x - this.heroi.x) <= ALCANCE_SOCO;
      if (quadroAtual >= 2 && perto) {
        this.socoAcertou = true;
        if (this.vilaoInvulneravel) {
          tocarSom(this, 'miss');
          flutuarTexto(this, this.vilao.x, this.vilao.y - 100, 'MISS');
        } else {
          this.causarDano();
          if (this.fimDeJogo) return;
        }
      }
    }

    // vilão: anda sozinho em direção ao herói, para perto dele e ataca
    const distancia = Math.abs(this.vilao.x - this.heroi.x);
    const direcao = this.heroi.x < this.vilao.x ? -1 : 1;

    if (this.vilaoEsquivando) {
      // a animação de afundar e surgir cuida de tudo
    } else if (this.vilaoAtacando) {
      this.vilaoParado();
    } else if (!this.heroiNoAr && distancia <= DISTANCIA_ATAQUE && this.time.now >= this.vilaoProximoAtaque) {
      this.vilaoParado();
      this.vilaoAtacar();
    } else if (distancia > DISTANCIA_LUTA) {
      this.vilao.x += direcao * passo(VELOCIDADE_VILAO);
      this.vilao.play('vilao-andar', true);
    } else {
      this.vilaoParado();
    }

    // os dois sempre de frente um para o outro
    this.heroi.setFlipX(this.vilao.x < this.heroi.x);
    if (!this.vilaoAtacando) this.vilao.setFlipX(this.heroi.x < this.vilao.x);

    // não deixa sair da tela
    this.heroi.x = Phaser.Math.Clamp(this.heroi.x, 32, 480);
    this.vilao.x = Phaser.Math.Clamp(this.vilao.x, 32, 480);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 512,
  height: 224,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [TelaInicial, MapaCaminho, CenaLuta]
});