// A cena de luta: herói, vilão e o loop principal.
// Constantes ficam em config.js; cores em recolor.js; barras e textos em hud.js; botões em controles.js; sons em audio.js; diálogos em dialogo.js.
// Cada fase (fases/fase1.js, fases/fase2.js) traz seus próprios textos, sons, sprites, animações, golpes, morte e golpes do herói.

// ordem das lutas no caminho: a luta 3 volta a ser com a bruxa
const FASES = [FASE1, FASE2, FASE1];

class CenaLuta extends Phaser.Scene {
  constructor() {
    super('CenaLuta');
  }

  init(data) {
    // fase = índice da luta no caminho (0 = primeira)
    this.fase = (data && data.fase) || 0;
    this.cfg = FASES[Math.min(this.fase, FASES.length - 1)];
  }

  preload() {
    // os sons são carregados na tela inicial (tela-inicial.js)

    this.load.image('cenario', this.cfg.cenario);
    this.cfg.carregar(this);

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
    this.load.spritesheet('heroi-tiro', 'assets/shot.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('heroi-agachar', 'assets/crouch.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    // o cenário fica fixo na tela; ele só rola durante a caminhada da entrada
    this.fundo = this.add.tileSprite(0, 0, 512, 224, 'cenario').setOrigin(0, 0);

    // garante o estado normal ao reiniciar a luta
    this.anims.globalTimeScale = 1;
    this.cameras.main.setZoom(1);

    // cores e animações do vilão ficam na configuração da fase
    this.cfg.preparar(this);

    // animações do herói (o herói é o mesmo em todas as fases)
    if (!this.anims.exists('heroi-andar')) {
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

      this.anims.create({
        key: 'heroi-tiro',
        frames: this.anims.generateFrameNumbers('heroi-tiro', { start: 0, end: 2 }),
        frameRate: 12,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-agachar',
        frames: this.anims.generateFrameNumbers('heroi-agachar', { start: 0, end: 5 }),
        frameRate: 14,
        repeat: 0
      });
    }

    // a entrada do herói e os diálogos acontecem na primeira vez que cada fase é jogada
    const jaVista = (this.game.fasesVistas || {})[this.fase];
    const comEntrada = !jaVista;

    this.heroi = this.add.sprite(comEntrada ? 40 : 150, CHAO_Y, 'heroi-andar').setOrigin(0.5, 1).setScale(2);
    this.heroi.setFrame(0);
    this.heroiAtacando = false;
    this.heroiMorrendo = false;
    this.heroiNoAr = false;
    this.heroiAltura = 0;
    this.velocidadeY = 0;
    this.heroiAgachado = false;

    this.vilao = this.add.sprite(360, CHAO_Y, this.cfg.texturas.parado).setOrigin(0.5, 1).setScale(this.cfg.escala);
    this.vilao.setFrame(0);
    this.vilao.setVisible(!comEntrada);
    this.vilaoAtacando = false;
    this.vilaoEsquivando = false;
    this.vilaoInvulneravel = false;
    this.vilaoProximoAtaque = 0;
    this.vilaoProximaEsquiva = 0;
    this.vilaoNoAr = false;   // true enquanto o vilão pula (pisão do ogro)
    this.vilaoAltura = 0;
    this.vilaoVelY = 0;
    this.golpeAtual = null;
    this.golpeAtualNome = null;

    this.heroiVida = VIDA_HEROI;
    this.vilaoVida = this.cfg.vida;
    this.vilaoVidaMax = this.cfg.vida;
    this.fimDeJogo = false;
    this.emVirada = false;   // modo virada: o herói está abaixo de 30% de vida
    this.piscaOn = false;    // alterna a cor da barra do herói no modo virada
    this.socoAcertou = false;
    this.emEntrada = comEntrada; // true enquanto o herói entra e os diálogos acontecem
    this.emDialogo = false;

    // tiro: munição volta ao máximo a cada tentativa, e as balas ficam nesta lista
    this.tiros = [];
    this.municao = this.cfg.tiro ? this.cfg.tiro.municao : 0;
    this.textoMunicao = this.cfg.tiro
      ? this.add.text(12, 40, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' }).setDepth(21)
      : null;
    this.atualizarMunicao();

    this.teclas = this.input.keyboard.createCursorKeys();
    this.teclaSoco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.teclaPulo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.teclaTiro = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    criarControlesDeToque(this);

    if (!comEntrada) this.comecarCombate();
  }

  // ---------- entrada e diálogos ----------

  // o herói anda pela esquerda até o meio da tela; a cidade rola junto, mais devagar
  atualizarEntrada(delta) {
    this.toque.soco = false;
    this.toque.pulo = false;
    this.toque.tiro = false;
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

    mostrarDialogo(this, 'DETECTIVE', this.cfg.dialogoHeroi, () => this.chegaVilao(), RETRATO_HEROI);
  }

  // o vilão entra pela direita e fala antes da luta
  chegaVilao() {
    this.vilao.setVisible(true);
    this.vilao.x = 500;
    this.virarVilao(true); // olha para a esquerda, para o herói
    this.vilao.play(this.cfg.anims.andar, true);

    this.tweens.add({
      targets: this.vilao,
      x: 360,
      duration: 1600,
      ease: 'Linear',
      onComplete: () => {
        this.vilaoParado();
        mostrarDialogo(this, this.cfg.nome, this.cfg.dialogoVilao, () => this.comecarCombate(), this.cfg.retrato);
      }
    });
  }

  // a luta começa: barra de vida na tela e o fundo para de rolar
  comecarCombate() {
    this.emEntrada = false;
    this.emDialogo = false;

    // marca a fase como vista, para a entrada não se repetir nas tentativas seguintes
    this.game.fasesVistas = this.game.fasesVistas || {};
    this.game.fasesVistas[this.fase] = true;

    this.vilao.setVisible(true);
    this.vilaoProximoAtaque = this.time.now + 1500; // primeiro golpe depois de 1,5 s
    this.vilaoProximaEsquiva = this.time.now + PRIMEIRA_ESQUIVA;

    criarBarrasDeVida(this);
  }

  // ---------- herói ----------

  socar() {
    if (this.heroiAtacando || this.heroiNoAr || this.heroiAgachado) return;
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

  // agachar: só no chão e sem estar atacando; enquanto agachado, o herói não anda nem pula
  agachar() {
    if (this.heroiAgachado) return;
    this.heroiAgachado = true;
    this.heroi.play('heroi-agachar');
  }

  levantar() {
    this.heroiAgachado = false;
    this.heroi.stop();
    this.heroi.setTexture('heroi-andar', 0);
  }

  // tiro: uma bala por toque, com munição limitada; a bala sai na direção em que o herói está virado
  atirar() {
    if (!this.cfg.tiro) return;
    if (this.heroiAtacando || this.heroiNoAr || this.heroiAgachado) return;
    if (this.municao <= 0) return;

    this.municao--;
    tocarSom(this, this.cfg.sons.tiro || 'tiro');
    this.atualizarMunicao();

    this.heroiAtacando = true;
    this.heroi.play('heroi-tiro');
    this.heroi.once('animationcomplete', () => {
      if (this.heroiMorrendo) return;
      this.heroiAtacando = false;
      this.heroi.setTexture('heroi-andar', 0);
    });

    const dir = this.heroi.flipX ? -1 : 1;
    this.criarBala(this.heroi.x + dir * 30, dir);
  }

  criarBala(x, dir) {
    const g = this.add.graphics().setDepth(12);
    g.fillStyle(0xffd23f, 1);
    g.fillRect(-6, -2, 12, 4);
    g.setPosition(x, CHAO_Y - this.cfg.tiro.altura);
    this.tiros.push({ g, dir, vel: this.cfg.tiro.velocidade });
  }

  // move as balas; acerta o ogro só se ele estiver no chão (o pulo faz a bala passar por baixo)
  atualizarTiros(delta) {
    const cfg = this.cfg.tiro;
    if (!cfg) return;

    const sobraram = [];
    for (const t of this.tiros) {
      if (!t.g.active) continue;
      t.g.x += t.dir * t.vel * (delta / 1000);

      const naMira = Math.abs(t.g.x - this.vilao.x) <= cfg.alcanceCorpo;
      const noChao = this.vilaoAltura < cfg.altura + 4;

      if (naMira && noChao && !this.vilaoEsquivando && !this.fimDeJogo) {
        t.g.destroy();
        this.danoNoVilao(cfg.dano, this.cfg.sons.dano);
        continue;
      }

      if (t.g.x < -20 || t.g.x > 532) {
        t.g.destroy();
        continue;
      }

      sobraram.push(t);
    }

    if (!this.fimDeJogo) this.tiros = sobraram;
  }

  limparTiros() {
    this.tiros.forEach((t) => {
      if (t.g.active) t.g.destroy();
    });
    this.tiros = [];
  }

  atualizarMunicao() {
    if (this.textoMunicao) this.textoMunicao.setText(`AMMO ${this.municao}`);
  }

  danoNoHeroi(dano = DANO_VILAO) {
    tocarSom(this, 'dano');

    this.heroiVida = Math.max(0, this.heroiVida - dano);
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
    this.heroiAgachado = false;
    this.heroi.y = CHAO_Y;
    this.heroi.clearTint();
    this.limparTiros();
    this.heroi.play('heroi-morte');

    // o som de derrota toca junto com o texto GAME OVER
    this.heroi.once('animationcomplete', () => {
      tocarSom(this, 'morte-heroi');
      mostrarFim(this, 'GAME OVER', null, '#e03030');
    });
  }

  // ---------- vilão ----------

  causarDano() {
    // no modo virada, o soco tira mais vida do vilão
    const dano = this.emVirada ? DANO_SOCO_VIRADA : DANO_SOCO;
    this.danoNoVilao(dano, this.cfg.sons.dano);
  }

  // tira vida do vilão e mostra o acerto: vale para soco e para tiro
  danoNoVilao(dano, som) {
    // cada fase define o próprio som de dano (bruxa: soco; ogro: grunhido)
    tocarSom(this, som);

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
    this.limparTiros();

    // se o vilão estava no ar (pisão), ele cai antes da animação de morte
    this.vilaoNoAr = false;
    this.vilao.y = CHAO_Y;

    // impacto: flash, tremor, câmera lenta e zoom no vilão
    const cam = this.cameras.main;
    cam.flash(300, 255, 255, 255);
    cam.shake(400, 0.012);
    this.anims.globalTimeScale = 0.5;
    cam.zoomTo(1.5, 500);
    cam.pan(Phaser.Math.Clamp(this.vilao.x, 171, 341), 148, 500);

    // mostra o K.O. e, se a fase tiver fala de derrota, o vilão fala antes
    const mostrarKO = () => {
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
    };

    const depoisDaQueda = () => {
      this.anims.globalTimeScale = 1;
      cam.zoomTo(1, 400);
      cam.pan(256, 112, 400);

      this.time.delayedCall(450, () => {
        if (this.cfg.dialogoDerrota) {
          mostrarDialogo(this, this.cfg.nome, this.cfg.dialogoDerrota, mostrarKO, this.cfg.retrato);
        } else {
          mostrarKO();
        }
      });
    };

    // se a fase tem animação de morte, ela toca; se não, o ogro tomba; senão, some com um fade
    if (this.cfg.anims.morte) {
      this.vilao.play(this.cfg.anims.morte);
      this.vilao.once('animationcomplete', depoisDaQueda);
    } else if (this.cfg.morte && this.cfg.morte.tombar) {
      this.vilao.stop();
      this.vilao.setTexture(this.cfg.texturas.parado, 0);
      this.tweens.add({
        targets: this.vilao,
        angle: 90,
        duration: this.cfg.morte.duracao,
        ease: 'Bounce.Out',
        onComplete: () => this.time.delayedCall(this.cfg.morte.pausa, depoisDaQueda)
      });
    } else {
      this.tweens.add({ targets: this.vilao, alpha: 0, duration: 600, onComplete: depoisDaQueda });
    }
  }

  // ---------- golpes do vilão ----------

  // valores de cada golpe: os da fase valem, e o que faltar vem do padrão (bruxa)
  golpe(nome) {
    const padrao = {
      clava: { dano: DANO_VILAO, alcance: ALCANCE_VILAO, desviaCom: 'pulo', aviso: 450 },
      pisao: { dano: 0, raio: 0, desviaCom: 'pulo', aviso: 500 }
    };
    const extra = (this.cfg.golpes && this.cfg.golpes[nome]) || {};
    return { ...padrao[nome], ...extra };
  }

  // sorteia entre clava e pisão, se a fase tiver pisão e a escolha for aleatória
  escolherGolpe() {
    const golpes = this.cfg.golpes;
    if (!golpes || !golpes.pisao) return 'clava';
    if (golpes.escolha === 'aleatorio') return Math.random() < 0.5 ? 'clava' : 'pisao';
    return 'clava';
  }

  intervaloEntreGolpes() {
    return (this.cfg.golpes && this.cfg.golpes.intervalo) || 1200;
  }

  // o herói desvia do golpe se estiver no meio certo: pulando ou agachado
  desviadoPor(meio) {
    if (meio === 'pulo') return this.heroiAltura >= ALTURA_ESQUIVA;
    if (meio === 'agachar') return this.heroiAgachado;
    return false;
  }

  vilaoAtacar() {
    const nome = this.escolherGolpe();
    const g = this.golpe(nome);
    this.golpeAtual = g;
    this.golpeAtualNome = nome;

    this.vilaoAtacando = true;
    this.vilao.setTint(0xffaa44); // aviso: o golpe vem aí (dá tempo de se afastar ou pular)

    // a animação de ataque (a clava do ogro, por exemplo) toca durante o aviso
    if (nome === 'clava' && this.cfg.anims.ataque) this.vilao.play(this.cfg.anims.ataque);

    // o vilão mira para o lado em que o herói estava quando o aviso começou
    const dir = this.heroi.x < this.vilao.x ? -1 : 1;

    this.time.delayedCall(g.aviso, () => {
      if (this.fimDeJogo) return;
      this.vilao.clearTint();

      if (nome === 'pisao') this.vilaoPular();
      else this.vilaoGolpeClava(g, dir);
    });
  }

  // golpe corpo a corpo: avanço rápido, arco de corte e dano se o herói estiver no alcance
  vilaoGolpeClava(g, dir) {
    this.tweens.add({ targets: this.vilao, x: this.vilao.x + dir * 24, duration: 80, yoyo: true });
    this.desenharCorte(dir);

    const heroiNaFrente = (this.heroi.x - this.vilao.x) * dir > 0;
    const alcancou = Math.abs(this.vilao.x - this.heroi.x) <= g.alcance;

    if (alcancou && heroiNaFrente) {
      if (this.desviadoPor(g.desviaCom)) this.mostrarEsquiva();
      else this.danoNoHeroi(g.dano);
    } else if (alcancou && !heroiNaFrente) {
      this.mostrarEsquiva(); // herói passou para trás dele: o golpe pegou só o ar
    }

    this.finalizarGolpe();
  }

  // pisão: o vilão salta; a queda é o que causa dano na área
  vilaoPular() {
    this.vilaoNoAr = true;
    this.vilaoAltura = 0;
    this.vilaoVelY = -this.cfg.golpes.alturaPulo;
  }

  // o vilão pousou: tremor, poeira, dano na área e um avanço em direção ao herói
  vilaoAterrissa() {
    this.vilaoNoAr = false;
    this.vilaoAltura = 0;
    this.vilaoVelY = 0;
    this.vilao.y = CHAO_Y;

    this.cameras.main.shake(150, 0.008);
    this.poeiraNoChao();

    const g = this.golpeAtual;
    if (this.golpeAtualNome === 'pisao') {
      const perto = Math.abs(this.vilao.x - this.heroi.x) <= g.raio;
      if (perto) {
        if (this.desviadoPor(g.desviaCom)) this.mostrarEsquiva();
        else this.danoNoHeroi(g.dano);
      }
    }

    const avanco = this.cfg.golpes.avancoDepoisPulo || 0;
    const dirPara = this.heroi.x < this.vilao.x ? -1 : 1;
    this.vilao.x = Phaser.Math.Clamp(this.vilao.x + dirPara * avanco, 32, 480);

    this.finalizarGolpe();
  }

  // a poeira que aparece quando o vilão bate no chão
  poeiraNoChao() {
    const p = this.add.graphics().setDepth(14);
    p.fillStyle(0x3a3a3a, 0.7);
    p.fillEllipse(this.vilao.x, CHAO_Y - 2, 70, 10);
    this.tweens.add({ targets: p, alpha: 0, duration: 400, onComplete: () => p.destroy() });
  }

  // libera o vilão para o próximo ataque, depois do intervalo da fase
  finalizarGolpe() {
    this.time.delayedCall(300, () => {
      this.vilaoAtacando = false;
      this.vilaoProximoAtaque = this.time.now + this.intervaloEntreGolpes();
    });
  }

  // vira o vilão para o lado certo; cada fase diz se o sprite nasce espelhado
  virarVilao(olhaParaEsquerda) {
    this.vilao.setFlipX(olhaParaEsquerda !== !!this.cfg.espelhado);
  }

  // vilão parado em pé: sempre o quadro 0 da textura de parado.
  // (setFrame(0) sozinho usaria a textura atual, que pode ser a de surgir do chão)
  vilaoParado() {
    this.vilao.stop();
    this.vilao.setTexture(this.cfg.texturas.parado, 0);
  }

  // o vilão tenta esquivar quando o herói soca perto dele (só nas fases que têm esquiva)
  tentarEsquivar() {
    if (!this.cfg.esquiva) return;
    const perto = Math.abs(this.vilao.x - this.heroi.x) <= ALCANCE_SOCO;
    const livre = !this.vilaoAtacando && !this.vilaoEsquivando;
    if (perto && livre && this.time.now >= this.vilaoProximaEsquiva) this.vilaoEsquivar();
  }

  vilaoEsquivar() {
    tocarSom(this, 'esquiva');

    this.vilaoEsquivando = true;
    this.vilaoInvulneravel = true; // enquanto está debaixo da terra, o soco não pega
    this.vilao.clearTint();
    this.vilao.play(this.cfg.anims.afundar);

    this.vilao.once('animationcomplete', () => {
      if (this.fimDeJogo) return;

      // some por um instante e reaparece atrás do herói
      this.time.delayedCall(250, () => {
        if (this.fimDeJogo) return;

        const lado = this.vilao.x > this.heroi.x ? -1 : 1;
        this.vilao.x = Phaser.Math.Clamp(this.heroi.x + lado * 50, 32, 480);

        // vulnerável enquanto sai do chão: é a hora de socá-lo
        this.vilaoInvulneravel = false;
        this.vilao.play(this.cfg.anims.surgir);

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

    // soco
    const pediuSoco = Phaser.Input.Keyboard.JustDown(this.teclaSoco) || this.toque.soco;
    this.toque.soco = false;
    if (pediuSoco) this.socar();

    // tiro
    const pediuTiro = Phaser.Input.Keyboard.JustDown(this.teclaTiro) || this.toque.tiro;
    this.toque.tiro = false;
    if (pediuTiro) this.atirar();

    // agachar: enquanto a seta para baixo (ou o botão azul) estiver segurada, no chão e sem atacar
    const querAgachar = this.cfg.agachar && (this.teclas.down.isDown || this.toque.agachar);
    const podeAgachar = !this.heroiNoAr && !this.heroiAtacando && !this.heroiMorrendo;
    if (querAgachar && podeAgachar) this.agachar();
    else if (this.heroiAgachado) this.levantar();

    // pulo: barra de espaço, seta para cima do teclado ou botão de cima na tela (não pula agachado)
    const pediuPulo = Phaser.Input.Keyboard.JustDown(this.teclaPulo)
      || Phaser.Input.Keyboard.JustDown(this.teclas.up)
      || this.toque.pulo;
    this.toque.pulo = false;
    if (pediuPulo && !this.heroiNoAr && !this.heroiAtacando && !this.heroiAgachado) {
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

    // andar: não anda enquanto ataca ou está agachado
    if (!this.heroiAtacando && !this.heroiAgachado) {
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
    if (this.heroiAtacando && !this.socoAcertou && this.heroi.texture.key === 'heroi-soco') {
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

    // balas em voo
    this.atualizarTiros(delta);
    if (this.fimDeJogo) return;

    // pulo do vilão (pisão do ogro): sobe, cai e chama o pouso
    if (this.vilaoNoAr) {
      this.vilaoVelY += GRAVIDADE * (delta / 1000);
      this.vilaoAltura -= this.vilaoVelY * (delta / 1000);
      if (this.vilaoAltura <= 0) this.vilaoAterrissa();
    }
    this.vilao.y = CHAO_Y - this.vilaoAltura;

    // vilão: anda sozinho em direção ao herói, para perto dele e ataca.
    // A velocidade vem da fase: a bruxa usa a padrão, o ogro anda mais devagar
    const distancia = Math.abs(this.vilao.x - this.heroi.x);
    const direcao = this.heroi.x < this.vilao.x ? -1 : 1;

    if (this.vilaoEsquivando) {
      // a animação de afundar e surgir cuida de tudo
    } else if (this.vilaoAtacando) {
      // o ataque (ou o pulo) já está em andamento: não parar o vilão aqui
    } else if (!this.heroiNoAr && distancia <= DISTANCIA_ATAQUE && this.time.now >= this.vilaoProximoAtaque) {
      this.vilaoParado();
      this.vilaoAtacar();
    } else if (distancia > DISTANCIA_LUTA) {
      this.vilao.x += direcao * passo(this.cfg.velocidade || VELOCIDADE_VILAO);
      this.vilao.play(this.cfg.anims.andar, true);
    } else {
      this.vilaoParado();
    }

    // os dois sempre de frente um para o outro
    if (!this.vilaoAtacando) this.virarVilao(this.heroi.x < this.vilao.x);
    this.heroi.setFlipX(this.vilao.x < this.heroi.x);

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