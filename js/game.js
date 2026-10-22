// A cena de luta: herói, vilão e o loop principal.
// Constantes ficam em config.js; cores em recolor.js; barras e textos em hud.js; botões em controles.js; sons em audio.js; diálogos em dialogo.js.
// Cada fase (fases/fase1.js, fases/fase2.js) traz seus próprios textos, sons, sprites, animações, golpes, vida, movimento, esquiva, morte e cenário.

// ordem das lutas no caminho: criatura, ogro, criatura, ogro
const FASES = [FASE1, FASE2, FASE1, FASE2];

// herói novo: frames de 48x48 com os pés em y=39
const HEROI_ORIGEM_Y = 39 / 48;

// combo do herói: soco, soco, chute
const DANO_CHUTE = 20;        // dano do 3º ataque seguido
const JANELA_COMBO = 900;     // ms: tempo máximo, contado do início do ataque anterior, para o próximo entrar no combo

// acertos por quadro da animação
const QUADRO_ACERTO_SOCO = 5;         // braço esticado (último quadro)
const QUADRO_ACERTO_CHUTE_INI = 3;    // perna esticada (quadros 3 e 4)
const QUADRO_ACERTO_CHUTE_FIM = 4;

// tiro: a bala sai quando o braço está levantado
const TIRO_FPS = 18;
const TIRO_QUADRO_DISPARO = 3;

// brilho verde da poção (só quando ela termina de beber)
const COR_BRILHO_CURA = 0x4cff6a;
const CURA_PISCA_MS = 120;            // tempo de cada piscada
const CURA_PISCADAS = 8;              // mudanças de cor no brilho (~1 s)

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

    // cada fase tem o próprio cenário, carregado com a chave definida na fase
    this.load.image(this.cfg.cenarioChave, this.cfg.cenario);
    this.cfg.carregar(this);

    // herói (frames 48x48)
    this.load.spritesheet('heroi-andar', 'assets/heroi/heroi_walk.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('heroi-soco', 'assets/heroi/heroi_soco.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('heroi-chute', 'assets/heroi/heroi_chute.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('heroi-morte', 'assets/heroi/heroi_morte.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('heroi-tiro', 'assets/heroi/heroi_tiro.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('heroi-agachar', 'assets/heroi/heroi_crouch.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('heroi-hit', 'assets/heroi/heroi_hit.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.image('icone-soco', 'assets/icones/icone_soco.png');
    this.load.image('icone-tiro', 'assets/icones/icone_tiro.png');
  }

  create() {
    // reinício da cena: o relógio da cena guarda o valor da última vez que rodou, então sincroniza com o tempo do jogo
    this.time.now = this.game.loop.time;

    // o cenário fica fixo na tela; ele só rola durante a caminhada da entrada
    this.fundo = this.add.tileSprite(0, 0, 512, 224, this.cfg.cenarioChave).setOrigin(0, 0);
    this.fundo.y = this.cfg.cenarioAjusteY || 0;   // ajuste de altura do cenário, aplicado em toda tentativa

    // garante o estado normal ao reiniciar a luta
    this.anims.globalTimeScale = 1;
    this.cameras.main.setZoom(1);

    // cores e animações do vilão ficam na configuração da fase
    this.cfg.preparar(this);

    // animações do herói (o herói é o mesmo em todas as fases)
    if (!this.anims.exists('heroi-andar')) {
      this.anims.create({
        key: 'heroi-andar',
        frames: this.anims.generateFrameNumbers('heroi-andar', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: 'heroi-soco',
        frames: this.anims.generateFrameNumbers('heroi-soco', { start: 0, end: 5 }),
        frameRate: 18,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-chute',
        frames: this.anims.generateFrameNumbers('heroi-chute', { start: 0, end: 6 }),
        frameRate: 16,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-morte',
        frames: this.anims.generateFrameNumbers('heroi-morte', { start: 0, end: 6 }),
        frameRate: 9,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-tiro',
        frames: this.anims.generateFrameNumbers('heroi-tiro', { start: 0, end: 8 }),
        frameRate: TIRO_FPS,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-agachar',
        frames: this.anims.generateFrameNumbers('heroi-agachar', { start: 0, end: 4 }),
        frameRate: 14,
        repeat: 0
      });

      this.anims.create({
        key: 'heroi-hit',
        frames: this.anims.generateFrameNumbers('heroi-hit', { start: 0, end: 5 }),
        frameRate: 16,
        repeat: 0
      });
    }

    // a entrada do herói e os diálogos acontecem na primeira vez que cada fase é jogada
    const jaVista = (this.game.fasesVistas || {})[this.fase];
    const comEntrada = !jaVista;

    this.heroi = this.add.sprite(comEntrada ? 40 : 150, CHAO_Y, 'heroi-andar').setOrigin(0.5, HEROI_ORIGEM_Y).setScale(2);
    this.heroi.setFrame(0);
    this.heroiAtacando = false;
    this.heroiMorrendo = false;
    this.heroiNoAr = false;
    this.heroiAltura = 0;
    this.velocidadeY = 0;
    this.heroiAgachado = false;
    this.heroiBloqueado = false; // true quando a regra de corpo impediu o herói de andar neste quadro
    this.ladoHeroi = -1;         // de que lado do vilão o herói está (-1 = à esquerda, 1 = à direita)
    this.proximoSoco = 0;        // quando o herói pode socar de novo (ms)
    this.proximoTiro = 0;        // quando o herói pode atirar de novo (ms)
    this.puloPendenteAte = 0;    // até quando um toque no pulo fica guardado (ms)
    this.pulouNoAviso = false;   // true se o herói pulou durante o aviso do golpe atual
    this.combo = 0;              // quantos ataques seguidos o herói encadeou
    this.comboAte = 0;           // até quando o próximo ataque ainda entra no combo (ms)

    this.vilao = this.add.sprite(360, CHAO_Y, this.cfg.texturas.parado).setOrigin(0.5, 1).setScale(this.cfg.escala);
    this.vilao.setFrame(0);
    this.vilao.setVisible(!comEntrada);

    // cada animação pode vir de um sheet com tamanho de quadro diferente: acerta a origem para os pés ficarem no chão
    this.vilao.on('animationstart', (anim, frame) => this.ajustarOrigemVilao(frame.textureKey));
    this.ajustarOrigemVilao(this.cfg.texturas.parado);

    this.vilaoAtacando = false;
    this.vilaoEsquivando = false;
    this.vilaoInvulneravel = false;
    this.vilaoProximoAtaque = 0;
    this.vilaoProximaEsquiva = 0;
    this.vilaoNoAr = false;        // true enquanto o vilão pula (pisão do ogro)
    this.vilaoDesviando = false;   // true enquanto o pulo é um desvio de tiro
    this.vilaoProximoDesvio = 0;   // quando o ogro pode desviar de novo (ms)
    this.vilaoAltura = 0;
    this.vilaoVelY = 0;
    this.vilaoAnimando = false;    // true enquanto toca o dano ou o pouso do pisão (nada interrompe)
    this.vilaoProximoHit = 0;      // quando o vilão pode mostrar a animação de dano de novo (ms)
    this.vilaoBebendo = false;     // true enquanto ele bebe a poção de cura
    this.vilaoPocaoUsada = false;  // a poção só é bebida uma vez por luta (mesmo se for interrompida)
    this.vilaoGolpesNaPocao = 0;   // golpes recebidos enquanto bebe
    this.curaBrilho = false;       // true durante o brilho verde da poção (usado também pela barra de vida)
    this.curaPiscaOn = false;      // alterna a cor verde durante o brilho
    this.vilaoVidaAntesCura = 0;   // vida antes da cura, para a barra mostrar o pedaço recuperado
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
    this.emCombate = false;      // só fica true quando o vilão passa a agir e a receber dano

    // tiro: munição volta ao máximo a cada tentativa, e as balas ficam nesta lista
    this.tiros = [];
    this.municao = this.cfg.tiro ? this.cfg.tiro.municao : 0;
    this.textoMunicao = this.cfg.tiro
      ? this.add.text(12, 38, '', { fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setDepth(21)
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
    this.emCombate = true;           // a partir daqui o vilão age e recebe dano
    this.inicioLuta = this.time.now; // começa o cronômetro desta tentativa

    // munição cheia no começo do combate (os tiros de teste da entrada não contam)
    this.municao = this.cfg.tiro ? this.cfg.tiro.municao : 0;
    this.atualizarMunicao();

    // marca a fase como vista, para a entrada não se repetir nas tentativas seguintes
    this.game.fasesVistas = this.game.fasesVistas || {};
    this.game.fasesVistas[this.fase] = true;

    this.vilao.setVisible(true);
    this.vilaoProximoAtaque = this.time.now + 1500; // primeiro golpe depois de 1,5 s
    this.vilaoProximaEsquiva = this.time.now + this.cfg.primeiraEsquiva;

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

  // ---------- herói ----------

  // soco; o 3º ataque seguido (dentro da janela do combo) vira chute
  socar() {
    if (this.heroiAtacando || this.heroiNoAr || this.heroiAgachado) return;
    if (this.time.now < this.proximoSoco) return;
    this.proximoSoco = this.time.now + COOLDOWN_SOCO;

    // combo: dentro da janela soma 1; fora dela recomeça. No 3º ataque sai o chute e o combo zera.
    if (this.time.now <= this.comboAte) this.combo++;
    else this.combo = 1;
    const chute = this.combo >= 3;
    if (chute) this.combo = 0;
    this.comboAte = this.time.now + JANELA_COMBO;

    this.heroiAtacando = true;
    this.socoAcertou = false;
    this.heroi.play(chute ? 'heroi-chute' : 'heroi-soco');
    this.heroi.once('animationcomplete', () => {
      if (this.heroiMorrendo) return;
      this.heroiAtacando = false;
      this.heroi.setTexture('heroi-andar', 0);
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

  // tiro: uma bala por toque, com munição limitada; a bala sai quando o braço está levantado
  atirar() {
    if (!this.cfg.tiro) return;
    if (this.heroiAtacando || this.heroiNoAr || this.heroiAgachado) return;
    if (this.municao <= 0) return;
    if (this.time.now < this.proximoTiro) return;
    this.proximoTiro = this.time.now + COOLDOWN_TIRO;

    this.municao--;
    this.atualizarMunicao();

    this.heroiAtacando = true;
    this.heroi.play('heroi-tiro');
    this.heroi.once('animationcomplete', () => {
      if (this.heroiMorrendo) return;
      this.heroiAtacando = false;
      this.heroi.setTexture('heroi-andar', 0);
    });

    // a bala e o som saem no quadro em que o braço está levantado
    this.time.delayedCall((TIRO_QUADRO_DISPARO * 1000) / TIRO_FPS, () => {
      if (this.fimDeJogo || this.heroiMorrendo) return;
      tocarSom(this, this.cfg.sons.tiro || 'tiro');
      const dir = this.heroi.flipX ? -1 : 1;
      this.criarBala(this.heroi.x + dir * 30, dir);
    });
  }

  criarBala(x, dir) {
    const g = this.add.graphics().setDepth(12);
    g.fillStyle(0xffd23f, 1);
    g.fillRect(-6, -2, 12, 4);
    g.setPosition(x, CHAO_Y - this.cfg.tiro.alturaDisparo);
    this.tiros.push({ g, dir, vel: this.cfg.tiro.velocidade });
    this.tentarDesviarTiro();
  }

  // quando uma bala aparece, o ogro tenta pular para desviar; cada tentativa inicia o cooldown
  tentarDesviarTiro() {
    const d = this.cfg.desvioTiro;
    if (!d || !this.emCombate || this.fimDeJogo || this.vilaoNoAr || this.vilaoAtacando || this.vilaoEsquivando || this.vilaoAnimando) return;
    if (this.time.now < this.vilaoProximoDesvio) return;

    this.vilaoProximoDesvio = this.time.now + d.cooldown;
    if (Math.random() >= d.chance) return;

    this.vilaoDesviando = true;
    this.vilaoNoAr = true;
    this.vilaoAltura = 0;
    this.vilaoVelY = -d.alturaPulo;
  }

  // move as balas; acerta o vilão só se ele estiver no chão (o pulo do ogro faz a bala passar por baixo)
  atualizarTiros(delta) {
    const cfg = this.cfg.tiro;
    if (!cfg) return;

    const sobraram = [];
    for (const t of this.tiros) {
      if (!t.g.active) continue;
      t.g.x += t.dir * t.vel * (delta / 1000);

      const naMira = Math.abs(t.g.x - this.vilao.x) <= cfg.alcanceCorpo;
      const noChao = !this.vilaoNoAr && this.vilaoAltura < cfg.altura + 4;

      if (naMira && noChao && this.emCombate && !this.vilaoEsquivando && !this.fimDeJogo) {
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

  danoNoHeroi(dano) {
    tocarSom(this, 'dano');

    this.heroiVida = Math.max(0, this.heroiVida - dano);
    desenharBarras(this);

    // herói pisca em vermelho e recua um pouco
    this.heroi.setTint(0xff6666);
    this.time.delayedCall(100, () => this.heroi.clearTint());
    this.heroi.x += this.heroi.x < this.vilao.x ? -10 : 10;

    if (this.heroiVida <= 0) {
      this.derrotaDoHeroi();
      return;
    }

    this.animarDanoHeroi();

    if (!this.emVirada && this.heroiVida <= LIMITE_VIRADA) {
      this.ativarVirada();
    }
  }

  // animação de dano: interrompe o ataque e segura o herói por um instante
  animarDanoHeroi() {
    this.heroiAgachado = false;   // senão o levantar() pararia a animação
    this.heroiAtacando = true;    // trava andar/agachar enquanto a animação toca
    this.heroi.play('heroi-hit');
    this.heroi.once('animationcomplete', () => {
      if (this.heroiMorrendo) return;
      this.heroiAtacando = false;
      this.heroi.setTexture('heroi-andar', 0);
    });
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

  // tira vida do vilão e mostra o acerto: vale para soco, chute e tiro
  danoNoVilao(dano, som) {
    // cada fase define o próprio som de dano
    tocarSom(this, som);

    this.vilaoVida = Math.max(0, this.vilaoVida - dano);
    desenharBarras(this);

    // flash branco ao levar dano; se o vilão estiver no aviso de um golpe, volta para o laranja
    this.vilao.setTint(0xffffff);
    this.time.delayedCall(80, () => {
      if (this.vilaoAtacando && !this.fimDeJogo) this.vilao.setTint(0xffaa44);
      else this.vilao.clearTint();
    });
    this.vilao.x += this.vilao.x > this.heroi.x ? 4 : -4;

    if (this.vilaoVida <= 0) {
      this.derrotaDoVilao();
    } else {
      this.contarGolpeNaPocao();
      this.animarDanoVilao();
    }
  }

  // acerta a origem vertical do vilão para a textura em uso (sheets novos têm os pés acima da base do quadro)
  ajustarOrigemVilao(chave) {
    const origem = (this.cfg.origemY || {})[chave];
    this.vilao.setOrigin(0.5, origem === undefined ? 1 : origem);
  }

  // animação de dano do vilão (se a fase tiver): só quando ele está livre e com intervalo entre uma e outra
  animarDanoVilao() {
    const nome = this.cfg.anims.hit;
    if (!nome) return;
    if (this.vilaoAtacando || this.vilaoEsquivando || this.vilaoNoAr || this.vilaoAnimando || this.vilaoBebendo) return;
    if (this.time.now < this.vilaoProximoHit) return;
    this.vilaoProximoHit = this.time.now + (this.cfg.hitCooldown || 1000);

    this.vilaoAnimando = true;
    this.vilao.play(nome);
    this.vilao.once('animationcomplete-' + nome, () => this.fimAnimacaoVilao());
  }

  // pouso do pisão: quadros de pousar e levantar
  animarPouso() {
    const nome = this.cfg.anims.pisaoPouso;
    if (!nome) return;

    this.vilaoAnimando = true;
    this.vilao.play(nome);
    this.vilao.once('animationcomplete-' + nome, () => this.fimAnimacaoVilao());
  }

  // terminou o dano ou o pouso: o vilão volta ao normal
  fimAnimacaoVilao() {
    this.vilaoAnimando = false;
    if (this.fimDeJogo) return;
    this.vilaoParado();
  }

  // ---------- poção de cura ----------

  // a fase tem poção, ela ainda não bebeu e a vida chegou ao gatilho
  podeBeberPocao() {
    const p = this.cfg.pocao;
    return !!p && !this.vilaoPocaoUsada && this.emCombate && this.vilaoVida <= p.gatilho * this.vilaoVidaMax;
  }

  // bebe a poção: fica parado e vulnerável durante a animação
  vilaoBeber() {
    const nome = this.cfg.anims.beber;
    this.vilaoPocaoUsada = true;
    this.vilaoBebendo = true;
    this.vilaoGolpesNaPocao = 0;
    this.vilao.clearTint();
    this.vilao.play(nome);
    flutuarTexto(this, this.vilao.x, this.vilao.y - 100, 'POTION!');
    this.vilao.once('animationcomplete-' + nome, () => this.fimPocao(false));
  }

  // cada golpe que acerta enquanto ele bebe conta para interromper a poção
  contarGolpeNaPocao() {
    if (!this.vilaoBebendo) return;
    this.vilaoGolpesNaPocao++;
    if (this.vilaoGolpesNaPocao >= this.cfg.pocao.golpesParaInterromper) this.fimPocao(true);
  }

  // terminou de beber (ou foi interrompido): se terminou, cura e brilha; se foi interrompido, não cura nada
  fimPocao(interrompida) {
    if (!this.vilaoBebendo) return;
    this.vilaoBebendo = false;
    this.vilao.off('animationcomplete-' + this.cfg.anims.beber);
    if (this.fimDeJogo) return;

    const p = this.cfg.pocao;
    this.vilaoProximoAtaque = this.time.now + p.pausaDepois;

    if (interrompida) {
      // poção derrubada: a vida não sobe e não tem brilho verde
      flutuarTexto(this, this.vilao.x, this.vilao.y - 100, 'INTERRUPTED!');
      this.vilaoParado();
      return;
    }

    const vidaAntes = this.vilaoVida;
    const cura = p.cura * this.vilaoVidaMax;
    this.vilaoVida = Math.min(this.vilaoVidaMax, this.vilaoVida + cura);

    flutuarTexto(this, this.vilao.x, this.vilao.y - 100, 'HEALED!');
    this.brilhoPocao(vidaAntes);   // também redesenha as barras

    this.vilaoParado();
  }

  // brilho verde da cura: contorno luminoso e piscada verde no sprite, anel no chão e barra de vida piscando
  brilhoPocao(vidaAntes) {
    // a barra de vida lê estes valores (hud.js)
    this.curaBrilho = true;
    this.curaPiscaOn = false;
    this.vilaoVidaAntesCura = vidaAntes;
    desenharBarras(this);

    // contorno luminoso em volta do corpo (só no WebGL; sem ele ficam só as piscadas)
    let brilho = null;
    if (this.vilao.postFX) brilho = this.vilao.postFX.addGlow(COR_BRILHO_CURA, 4, 0, false, 0.1, 10);

    // anel verde que se abre no chão e some
    const anel = this.add.graphics().setDepth(14);
    anel.lineStyle(2, COR_BRILHO_CURA, 1);
    anel.strokeEllipse(0, 0, 36, 10);
    anel.setPosition(this.vilao.x, CHAO_Y - 2);
    this.tweens.add({
      targets: anel,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 600,
      onComplete: () => anel.destroy()
    });

    // piscadas: silhueta verde e cor normal se alternam (o sprite é escuro, então o tingimento comum não apareceria)
    this.time.addEvent({
      delay: CURA_PISCA_MS,
      repeat: CURA_PISCADAS - 1,
      callback: () => {
        if (this.fimDeJogo) return;
        this.curaPiscaOn = !this.curaPiscaOn;
        if (this.curaPiscaOn) this.vilao.setTintFill(COR_BRILHO_CURA);
        else this.vilao.clearTint();
        desenharBarras(this);
      }
    });

    // fim do brilho
    this.time.delayedCall((CURA_PISCADAS + 1) * CURA_PISCA_MS, () => {
      this.curaBrilho = false;
      this.curaPiscaOn = false;
      if (this.fimDeJogo) return;
      if (brilho && this.vilao.postFX) this.vilao.postFX.remove(brilho);
      if (!this.vilaoAtacando) this.vilao.clearTint();
      desenharBarras(this);
    });
  }

  // animação de andar: a triste quando a vida está baixa (se a fase tiver)
  animacaoAndar() {
    const a = this.cfg.anims;
    const baixa = this.cfg.vidaBaixa;
    if (a.andarTriste && baixa && this.vilaoVida <= baixa * this.vilaoVidaMax) return a.andarTriste;
    return a.andar;
  }

  derrotaDoVilao() {
    this.fimDeJogo = true;
    this.vilaoBebendo = false;
    this.curaBrilho = false;
    this.curaPiscaOn = false;

    // vitória: grava o tempo desta luta no ranking
    this.tempoLuta = (this.time.now - this.inicioLuta) / 1000;
    this.registrarTempo();

    this.vilao.clearTint();
    if (this.vilao.postFX) this.vilao.postFX.clear();   // tira o contorno verde, se estiver ligado
    this.tweens.killTweensOf(this.vilao);
    this.vilao.setAlpha(1);   // se morreu no meio da esquiva, ele não pode ficar invisível
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

      this.time.delayedCall(2000, () => this.scene.start('RankingFase', { fase: this.fase, tempo: this.tempoLuta }));
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

    // se a fase tem animação de morte, ela toca; se não, o vilão tomba; senão, some com um fade
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

  // os golpes vêm inteiros da fase (dano, alcance, aviso e de que forma o herói desvia)
  golpe(nome) {
    return this.cfg.golpes[nome];
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

  // o herói desvia do golpe se estiver em algum dos meios listados: pulando ou agachado
  desviadoPor(meios) {
    const lista = Array.isArray(meios) ? meios : [meios];
    return lista.some((meio) => {
      if (meio === 'pulo') return this.heroiAltura >= ALTURA_ESQUIVA;
      if (meio === 'agachar') return this.heroiAgachado;
      return false;
    });
  }

  vilaoAtacar() {
    const nome = this.escolherGolpe();
    const g = this.golpe(nome);
    this.golpeAtual = g;
    this.golpeAtualNome = nome;

    this.vilaoAtacando = true;
    this.pulouNoAviso = false;   // começa a contar os pulos deste aviso
    this.vilao.setTint(0xffaa44); // aviso: o golpe vem aí (dá tempo de se afastar ou pular)

    // a animação de ataque toca durante o aviso: o golpe corpo a corpo, ou o agachar do pisão
    if (nome === 'clava' && this.cfg.anims.ataque) this.vilao.play(this.cfg.anims.ataque);
    else if (nome === 'pisao' && this.cfg.anims.pisaoAgachar) this.vilao.play(this.cfg.anims.pisaoAgachar);

    // o vilão mira para o lado em que o herói estava quando o aviso começou
    const dir = this.heroi.x < this.vilao.x ? -1 : 1;

    this.time.delayedCall(g.aviso, () => {
      if (this.fimDeJogo) return;
      this.vilao.clearTint();

      if (nome === 'pisao') this.vilaoPular();
      else this.vilaoGolpeClava(g, dir);
    });
  }

  // golpe corpo a corpo: avanço rápido, arco de corte (se a fase quiser) e dano se o herói estiver no alcance
  vilaoGolpeClava(g, dir) {
    if (g.avanco) this.tweens.add({ targets: this.vilao, x: this.vilao.x + dir * g.avanco.distancia, duration: g.avanco.duracao, yoyo: true });
    if (g.corte !== false) this.desenharCorte(dir);

    const heroiNaFrente = (this.heroi.x - this.vilao.x) * dir > 0;
    const alcancou = Math.abs(this.vilao.x - this.heroi.x) <= g.alcance;

    if (alcancou && heroiNaFrente) {
      if (this.desviouClava(g)) this.mostrarEsquiva();
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

    // quadros do ar: o último fica segurado até ele pousar
    if (this.cfg.anims.pisaoAr) this.vilao.play(this.cfg.anims.pisaoAr);
  }

  // o vilão pousou: tremor, poeira, dano na área e um avanço em direção ao herói
  vilaoAterrissa() {
    this.vilaoNoAr = false;
    this.vilaoAltura = 0;
    this.vilaoVelY = 0;
    this.vilao.y = CHAO_Y;

    // pouso do desvio: só poeira, sem tremor, dano nem avanço
    if (this.vilaoDesviando) {
      this.vilaoDesviando = false;
      this.poeiraNoChao();
      return;
    }

    this.animarPouso();

    const tremor = this.cfg.golpes.pisao.tremor;
    this.cameras.main.shake(tremor.duracao, tremor.forca);
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
    p.fillStyle(this.cfg.golpes.pisao.corPoeira, 0.7);
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
    this.ajustarOrigemVilao(this.cfg.texturas.parado);
  }

  // o vilão tenta esquivar quando o herói soca perto dele (só nas fases que têm esquiva)
  tentarEsquivar() {
    if (!this.cfg.esquiva) return;
    const perto = Math.abs(this.vilao.x - this.heroi.x) <= (this.cfg.alcanceSoco || ALCANCE_SOCO);
    const livre = !this.vilaoAtacando && !this.vilaoEsquivando && !this.vilaoBebendo && !this.vilaoAnimando;
    if (perto && livre && this.time.now >= this.vilaoProximaEsquiva) this.vilaoEsquivar();
  }

  vilaoEsquivar() {
    tocarSom(this, 'esquiva');

    // se a animação de dano foi cortada, limpa o estado para ela não travar
    this.vilaoAnimando = false;
    this.vilao.off('animationcomplete-' + this.cfg.anims.hit);

    this.vilaoEsquivando = true;
    this.vilaoInvulneravel = true; // enquanto está debaixo da terra, o soco não pega
    this.vilao.clearTint();
    this.vilao.play(this.cfg.anims.afundar);

    this.vilao.once('animationcomplete', () => {
      if (this.fimDeJogo) return;

      // a poça some junto com ela enquanto fica debaixo da terra
      this.tweens.add({ targets: this.vilao, alpha: 0, duration: 200 });

      // some por um instante e reaparece atrás do herói
      this.time.delayedCall(250, () => {
        if (this.fimDeJogo) return;

        const lado = this.vilao.x > this.heroi.x ? -1 : 1;
        this.vilao.x = Phaser.Math.Clamp(this.heroi.x + lado * 50, 32, 480);

        // vulnerável enquanto sai do chão: é a hora de socá-la
        this.vilaoInvulneravel = false;
        this.vilao.setAlpha(1);
        this.vilao.play(this.cfg.anims.surgir);

        this.vilao.once('animationcomplete', () => {
          if (this.fimDeJogo) return;
          this.vilaoEsquivando = false;
          this.vilaoProximaEsquiva = this.time.now + this.cfg.cooldownEsquiva;
          this.vilaoProximoAtaque = this.time.now + 400; // contra-ataque rápido
        });
      });
    });
  }

  // a clava conta como desviada se o herói estiver no ar agora ou se pulou durante o aviso
  desviouClava(g) {
    const meios = Array.isArray(g.desviaCom) ? g.desviaCom : [g.desviaCom];
    const pulou = meios.includes('pulo') && this.pulouNoAviso;
    return pulou || this.desviadoPor(g.desviaCom);
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

  // grava o tempo da luta vencida no ranking da fase, com a data da vitória e o identificador da run
  registrarTempo() {
    db.collection('ranking').add({
      nome: this.game.nomeJogador || 'ANON',
      fase: this.fase + 1,                          // luta 1, 2, 3 ou 4
      tempo: Number(this.tempoLuta.toFixed(2)),     // em segundos
      data: new Date(),                             // data e hora da vitória
      runId: this.game.runId || null                // liga este tempo à run completa
    }).catch((erro) => console.error('Erro ao salvar ranking:', erro));
  }

  // botões do herói: soco, tiro, agachar, pulo e gravidade. Funcionam na entrada e na luta.
  acoesDoHeroi(delta) {
    const passo = (velocidade) => (velocidade * delta) / 1000;

    // soco (e chute, no 3º ataque seguido)
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

    // o toque fica guardado por um curto tempo, para o pulo acontecer assim que o herói puder pular
    if (pediuPulo) this.puloPendenteAte = this.time.now + JANELA_PULO;
    if (this.time.now < this.puloPendenteAte && !this.heroiNoAr && !this.heroiAtacando && !this.heroiAgachado) {
      this.puloPendenteAte = 0;
      this.heroiNoAr = true;
      this.pulouNoAviso = true;   // conta para o desvio da clava, se o aviso estiver rolando
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

    // pose do pulo, quando o herói está no ar e não está atacando
    if (this.heroiNoAr && !this.heroiAtacando) this.heroi.setTexture('heroi-andar', POSE_PULO);

    // andar durante a luta (na entrada, quem anda é atualizarEntrada)
    if (!this.emEntrada && !this.heroiAtacando && !this.heroiAgachado) {
      const esquerda = this.teclas.left.isDown || this.toque.esquerda;
      const direita = this.teclas.right.isDown || this.toque.direita;

      const velocidade = this.heroiNoAr ? VELOCIDADE_NO_AR : VELOCIDADE_HEROI;
      const xAntes = this.heroi.x;
      if (esquerda) this.heroi.x -= passo(velocidade);
      else if (direita) this.heroi.x += passo(velocidade);

      // andou de verdade? a regra de corpo do quadro anterior pode ter travado o movimento
      const andou = Math.abs(this.heroi.x - xAntes) > 0.01 && !this.heroiBloqueado;

      if (!this.heroiNoAr) {
        if (andou) {
          this.heroi.play('heroi-andar', true);
        } else {
          this.heroi.stop();
          this.heroi.setFrame(0);
        }
      }
    }

    // acerto do ataque: soco no quadro com o braço esticado; chute nos quadros com a perna esticada.
    // Só depois que a luta começa.
    const textura = this.heroi.texture.key;
    const emSoco = textura === 'heroi-soco';
    const emChute = textura === 'heroi-chute';

    if (this.emCombate && this.heroiAtacando && !this.socoAcertou && (emSoco || emChute)) {
      const quadroAtual = Number(this.heroi.frame.name);
      const perto = Math.abs(this.vilao.x - this.heroi.x) <= (this.cfg.alcanceSoco || ALCANCE_SOCO);
      const noQuadroDeAcerto = emChute
        ? (quadroAtual >= QUADRO_ACERTO_CHUTE_INI && quadroAtual <= QUADRO_ACERTO_CHUTE_FIM)
        : quadroAtual >= QUADRO_ACERTO_SOCO;

      if (noQuadroDeAcerto && perto) {
        this.socoAcertou = true;
        if (this.vilaoInvulneravel) {
          tocarSom(this, 'miss');
          flutuarTexto(this, this.vilao.x, this.vilao.y - 100, 'MISS');
        } else if (emChute) {
          this.danoNoVilao(DANO_CHUTE, this.cfg.sons.dano);
        } else {
          this.causarDano();
        }
      }
    }
  }

  // ---------- loop principal ----------

  update(tempo, delta) {
    // entrada e diálogos: o herói anda e pode testar os botões; o vilão ainda não age
    if (this.emEntrada) {
      this.atualizarEntrada(delta);
      this.acoesDoHeroi(delta);
      this.atualizarTiros(delta);
      return;
    }

    if (this.fimDeJogo) return; // luta acabou: as animações de morte cuidam do resto

    // cronômetro da luta: para quando a luta acaba, junto com o tempo gravado no ranking
    this.textoTimer.setText(formatarCronometro(this.time.now - this.inicioLuta));

    this.acoesDoHeroi(delta);
    if (this.fimDeJogo) return;

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
    // A velocidade, as distâncias e os golpes vêm da fase de cada vilão
    const passo = (velocidade) => (velocidade * delta) / 1000;
    const distancia = Math.abs(this.vilao.x - this.heroi.x);
    const direcao = this.heroi.x < this.vilao.x ? -1 : 1;

    if (this.vilaoEsquivando) {
      // a animação de afundar e surgir cuida de tudo
    } else if (this.vilaoBebendo) {
      // bebendo a poção: parado e vulnerável até a animação acabar ou ser interrompida
    } else if (this.vilaoAtacando) {
      // o ataque (ou o pulo) já está em andamento: não parar o vilão aqui
    } else if (this.vilaoAnimando) {
      // animação de dano ou de pouso em andamento: não trocar de animação nem andar
    } else if (this.podeBeberPocao()) {
      this.vilaoBeber();
    } else if (!this.heroiNoAr && distancia <= this.cfg.distanciaAtaque && this.time.now >= this.vilaoProximoAtaque) {
      this.vilaoParado();
      this.vilaoAtacar();
    } else if (distancia > this.cfg.distanciaLuta) {
      this.vilao.x += direcao * passo(this.cfg.velocidade);
      this.vilao.play(this.animacaoAndar(), true);
    } else {
      this.vilaoParado();
    }

    // os dois sempre de frente um para o outro
    if (!this.vilaoAtacando) this.virarVilao(this.heroi.x < this.vilao.x);
    this.heroi.setFlipX(this.vilao.x < this.heroi.x);

    // corpos: no chão, o herói e o vilão não se sobrepõem nem trocam de lado.
    // No ar, acima da altura de passagem, o herói pode cruzar por cima do vilão.
    const margem = this.cfg.margemCorpo || 30;
    const passagem = this.cfg.alturaPassagem || 40;
    const xAntesRegra = this.heroi.x;

    if (this.heroiAltura < passagem) {
      const dx = this.heroi.x - this.vilao.x;
      if (Math.abs(dx) >= 1) this.ladoHeroi = Math.sign(dx);

      if (this.ladoHeroi < 0) {
        this.heroi.x = Math.min(this.heroi.x, this.vilao.x - margem);
        this.vilao.x = Math.max(this.vilao.x, this.heroi.x + margem);
      } else {
        this.heroi.x = Math.max(this.heroi.x, this.vilao.x + margem);
        this.vilao.x = Math.min(this.vilao.x, this.heroi.x - margem);
      }
    }

    // a regra de corpo travou o herói neste quadro? usado pela animação de andar no próximo quadro
    this.heroiBloqueado = Math.abs(this.heroi.x - xAntesRegra) > 0.01;

    // não deixa sair da tela
    this.heroi.x = Phaser.Math.Clamp(this.heroi.x, 32, 480);
    this.vilao.x = Phaser.Math.Clamp(this.vilao.x, 32, 480);
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 512,
  height: 224,
  pixelArt: true,
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [TelaInicial, TelaNome, MapaCaminho, CenaLuta, RankingFase, Rankings, Final, CutsceneBoss]
});