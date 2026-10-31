// Luta: o herói (soco, chute, tiro, agachar, pulo, andar, dano, virada e derrota).
// Os métodos são copiados para a CenaLuta no game.js, então o this é a cena.

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

// soco inglês: o ogro deixa cair na luta 2 e vale a partir da luta 3 (sem anotar nada, só pelo número da luta)
const SOCO_INGLES_LUTA = 2;           // índice da primeira luta com o soco inglês (2 = a luta 3)
const DANO_SOCO_INGLES = 35;          // dano do soco com o soco inglês
const DANO_SOCO_INGLES_VIRADA = 55;   // dano do soco com o soco inglês no modo virada
const DANO_CHUTE_INGLES = 50;         // dano do chute (3º golpe do combo) com o soco inglês
const DANO_CHUTE_INGLES_VIRADA = 60;  // dano do chute com o soco inglês no modo virada

// balas de prata: o lobisomem deixa cair na luta 3 e valem a partir da luta 4 (também só pelo número da luta)
const BALAS_PRATA_LUTA = 3;           // índice da primeira luta com as balas de prata (3 = a luta 4, o boss)
const DANO_TIRO_PRATA = 1.5;          // o tiro tira 50% a mais (no boss: 65 vira 98)
const COR_BALA = 0xffd23f;            // bala comum: amarela
const COR_BALA_PRATA = 0xe8eef6;      // bala de prata

// dash: avanço rápido com invencibilidade curta; desvia de qualquer golpe e atravessa o vilão
const DASH_DISTANCIA = 80;            // pixels percorridos no dash
const DASH_DURACAO = 180;             // ms do dash
const DASH_INVENCIVEL_EXTRA = 120;    // ms de invencibilidade depois que o dash termina
const DASH_COOLDOWN = 900;            // ms entre um dash e outro (contado do início)
const DASH_RASTRO_MS = 45;            // ms entre uma sombra do rastro e a seguinte
const COR_RASTRO = 0x7fd8ff;          // cor das sombras do rastro

class LutaHeroi {
  // o estado do herói no começo de cada luta (chamado pelo create)
  iniciarEstadoHeroi() {
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
    this.heroiVida = VIDA_HEROI;
    // PERFECT: vira true assim que o herói leva qualquer dano; já começa true se a luta recomeça direto na fase 2 do boss (a luta inteira não foi jogada)
    this.heroiLevouDano = !!this.cfg.recomecarAqui;
    this.emVirada = false;   // modo virada: o herói está abaixo de 30% de vida
    this.piscaOn = false;    // alterna a cor da barra do herói no modo virada
    this.socoAcertou = false;
    this.heroiDash = false;      // true durante o dash
    this.dashDir = 1;            // direção do dash (-1 = esquerda, 1 = direita)
    this.dashAte = 0;            // quando o dash atual termina (ms)
    this.proximoDash = 0;        // quando o herói pode dar outro dash (ms)
    this.invencivelAte = 0;      // até quando os golpes do vilão não pegam (ms)
    this.proximoRastro = 0;      // quando sai a próxima sombra do rastro (ms)

    // tiro: munição volta ao máximo a cada tentativa, e as balas ficam nesta lista
    this.tiros = [];
    this.viradaEvento = null;    // o piscar da barra no modo virada (a poção desliga)
    this.municao = this.cfg.tiro ? this.cfg.tiro.municao : 0;
    this.textoMunicao = this.cfg.tiro
      ? this.add.text(12, 38, '', { fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setDepth(21)
      : null;
    this.atualizarMunicao();
  }

  // o herói já está com o soco inglês nesta luta?
  temSocoIngles() {
    return this.fase >= SOCO_INGLES_LUTA;
  }

  // o herói já está com as balas de prata nesta luta?
  temBalasPrata() {
    return this.fase >= BALAS_PRATA_LUTA;
  }

  // dano do chute: sem o soco inglês é sempre 20; com ele, 30 (35 no modo virada)
  danoDoChute() {
    if (!this.temSocoIngles()) return DANO_CHUTE;
    return this.emVirada ? DANO_CHUTE_INGLES_VIRADA : DANO_CHUTE_INGLES;
  }

  // carrega os sheets (frames 48x48) e os ícones do herói; chamado pelo preload da cena de luta
  carregarHeroi() {
    const tamanho = { frameWidth: 48, frameHeight: 48 };

    this.load.spritesheet('heroi-andar', 'assets/heroi/heroi_walk.png', tamanho);
    this.load.spritesheet('heroi-soco', 'assets/heroi/heroi_soco.png', tamanho);
    this.load.spritesheet('heroi-chute', 'assets/heroi/heroi_chute.png', tamanho);
    this.load.spritesheet('heroi-morte', 'assets/heroi/heroi_morte.png', tamanho);
    this.load.spritesheet('heroi-tiro', 'assets/heroi/heroi_tiro.png', tamanho);
    this.load.spritesheet('heroi-agachar', 'assets/heroi/heroi_crouch.png', tamanho);
    this.load.spritesheet('heroi-hit', 'assets/heroi/heroi_hit.png', tamanho);
    this.load.spritesheet('heroi-pegar', 'assets/heroi/heroi_pegar_pocao.png', tamanho);
    this.load.spritesheet('heroi-pegar-soco', 'assets/heroi/heroi_pegar_soco_ingles.png', tamanho);
    this.load.spritesheet('heroi-beber', 'assets/heroi/heroi_beber_pocao.png', tamanho);
    this.load.image('icone-soco', 'assets/icones/icone_soco.png');
    this.load.image('icone-tiro', 'assets/icones/icone_tiro.png');
    this.load.image('icone-tiro-prata', 'assets/icones/icone_tiro_prata.png');
    this.load.image('icone-soco-ingles', 'assets/icones/icone_soco_ingles.png');
  }

  // cria as animações do herói (o herói é o mesmo em todas as fases); chamado pelo create da cena de luta
  criarAnimacoesHeroi() {
    if (this.anims.exists('heroi-andar')) return;

    const criar = (chave, fim, fps, repeticoes) => this.anims.create({
      key: chave,
      frames: this.anims.generateFrameNumbers(chave, { start: 0, end: fim }),
      frameRate: fps,
      repeat: repeticoes
    });

    criar('heroi-andar', 7, 8, -1);
    criar('heroi-soco', 5, 18, 0);
    criar('heroi-chute', 6, 16, 0);
    criar('heroi-morte', 6, 9, 0);
    criar('heroi-tiro', 8, TIRO_FPS, 0);
    criar('heroi-agachar', 4, 14, 0);
    criar('heroi-hit', 5, 16, 0);
    criar('heroi-pegar', 8, 9, 0);        // pegar a poção: 9 quadros a 9 fps = 1 s
    criar('heroi-pegar-soco', 8, 9, 0);   // pegar o soco inglês: igual
    criar('heroi-beber', 5, 8, 0);        // beber a poção: 6 quadros a 8 fps = 0,75 s
  }

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

  // dash: só no chão, fora de um golpe; vai para o lado da seta segurada ou, sem seta, para onde o herói olha (o vilão)
  iniciarDash() {
    if (this.heroiDash || this.heroiAtacando || this.heroiNoAr || this.heroiAgachado || this.heroiMorrendo || this.emDialogo) return;
    if (this.time.now < this.proximoDash) return;

    const esquerda = this.teclas.left.isDown || this.toque.esquerda;
    const direita = this.teclas.right.isDown || this.toque.direita;
    if (direita && !esquerda) this.dashDir = 1;
    else if (esquerda && !direita) this.dashDir = -1;
    else this.dashDir = this.heroi.flipX ? -1 : 1;

    this.heroiDash = true;
    this.heroiAtacando = true;   // trava andar, soco, tiro, pulo e poção durante o dash
    this.dashAte = this.time.now + DASH_DURACAO;
    this.invencivelAte = this.dashAte + DASH_INVENCIVEL_EXTRA;
    this.proximoDash = this.time.now + DASH_COOLDOWN;
    this.proximoRastro = 0;

    this.heroi.stop();
    this.heroi.setTexture('heroi-andar', POSE_PULO);
    this.heroi.setFlipX(this.dashDir < 0);
    tocarSom(this, 'esquiva');
  }

  // o dash, quadro a quadro: anda rápido e deixa sombras para trás
  atualizarDash(delta) {
    if (!this.heroiDash) return;

    this.heroi.x += this.dashDir * (DASH_DISTANCIA / DASH_DURACAO) * delta;
    // na entrada, o herói não passa do meio da tela (lá começa o diálogo)
    if (this.emEntrada) this.heroi.x = Phaser.Math.Clamp(this.heroi.x, 32, 256);

    if (this.time.now >= this.proximoRastro) {
      this.proximoRastro = this.time.now + DASH_RASTRO_MS;
      this.criarRastro();
    }

    if (this.time.now >= this.dashAte) this.terminarDash();
  }

  terminarDash() {
    this.heroiDash = false;
    this.heroiAtacando = false;
    this.heroi.setTexture('heroi-andar', 0);
  }

  // uma sombra azulada do herói que some logo
  criarRastro() {
    const sombra = this.add.sprite(this.heroi.x, this.heroi.y, 'heroi-andar', POSE_PULO)
      .setOrigin(0.5, HEROI_ORIGEM_Y)
      .setScale(2)
      .setFlipX(this.heroi.flipX)
      .setTint(COR_RASTRO)
      .setAlpha(0.55)
      .setDepth(this.heroi.depth - 1);
    this.tweens.add({ targets: sombra, alpha: 0, duration: 220, onComplete: () => sombra.destroy() });
  }

  // os golpes do vilão não pegam durante o dash (e um pouco depois)
  heroiInvencivel() {
    return this.time.now < this.invencivelAte;
  }

  // tiro: uma bala por toque, com munição limitada; a bala sai quando o braço está levantado
  atirar() {
    if (!this.cfg.tiro) return;
    if (this.heroiAtacando || this.heroiNoAr || this.heroiAgachado) return;
    if (this.time.now < this.proximoTiro) return;
    this.proximoTiro = this.time.now + COOLDOWN_TIRO;

    // sem munição: faz a animação do tiro, mas só toca o click da arma vazia (sem bala e sem gastar munição)
    const semMunicao = this.municao <= 0;
    if (!semMunicao) {
      this.municao--;
      this.atualizarMunicao();
    }

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
      if (semMunicao) {
        tocarSom(this, 'sem-municao');
        return;
      }
      tocarSom(this, this.cfg.sons.tiro || 'tiro');
      const dir = this.heroi.flipX ? -1 : 1;
      this.criarBala(this.heroi.x + dir * 30, dir);
    });
  }





  criarBala(x, dir) {
    const g = this.add.graphics().setDepth(12);
    g.fillStyle(this.temBalasPrata() ? COR_BALA_PRATA : COR_BALA, 1);
    g.fillRect(-6, -2, 12, 4);
    g.setPosition(x, CHAO_Y - this.cfg.tiro.alturaDisparo);
    this.tiros.push({ g, dir, vel: this.cfg.tiro.velocidade });
    this.tentarDesviarTiro();
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
        const dano = this.temBalasPrata() ? Math.round(cfg.dano * DANO_TIRO_PRATA) : cfg.dano;
        this.danoNoVilao(dano, this.cfg.sons.dano);
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
    this.heroiLevouDano = true;   // tira o PERFECT desta luta (luta/vilao-dano.js)

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

    this.viradaEvento = this.time.addEvent({
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

  // a poção deixou o herói forte de novo: sai do modo virada (e pode entrar de novo se a vida cair)
  encerrarVirada() {
    this.emVirada = false;
    this.piscaOn = false;
    if (this.viradaEvento) {
      this.viradaEvento.remove();
      this.viradaEvento = null;
    }
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
    this.limparBolas();
    this.heroi.play('heroi-morte');

    // o som de derrota toca junto com o texto GAME OVER
    this.heroi.once('animationcomplete', () => {
      tocarSom(this, 'morte-heroi');
      mostrarFim(this, 'GAME OVER', null, '#e03030');
    });
  }

  // os dois se olham, não se atravessam no chão e não saem da tela (chamado pelo update, depois do vilão)
  ajustarCorpos() {
    // no dash, o herói olha para onde está indo; fora dele, olha para o vilão
    this.heroi.setFlipX(this.heroiDash ? this.dashDir < 0 : this.vilao.x < this.heroi.x);

    // corpos: no chão, o herói e o vilão não se sobrepõem nem trocam de lado.
    // No ar, acima da altura de passagem, o herói pode cruzar por cima do vilão.
    // Na investida do lobisomem e no dash do herói, um atravessa o outro: a regra fica desligada até o movimento acabar.
    const margem = this.cfg.margemCorpo || 30;
    const passagem = this.cfg.alturaPassagem || 40;
    const xAntesRegra = this.heroi.x;

    if (this.heroiAltura < passagem && !this.vilaoInvestindo && !this.heroiDash) {
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

  // botões do herói: soco, tiro, agachar, pulo e gravidade. Funcionam na entrada e na luta.
  acoesDoHeroi(delta) {
    const passo = (velocidade) => (velocidade * delta) / 1000;

    // poção de cura (só nas lutas que dão uma ao herói): a tecla C ou o botão na tela
    if (this.cfg.pocaoHeroi) {
      const pediuPocao = Phaser.Input.Keyboard.JustDown(this.teclaPocao) || this.toque.pocao;
      this.toque.pocao = false;
      if (pediuPocao) this.usarPocaoHeroi();
    }

    // dash: Shift ou o botão azul na tela
    const pediuDash = Phaser.Input.Keyboard.JustDown(this.teclaDash) || this.toque.dash;
    this.toque.dash = false;
    if (pediuDash) this.iniciarDash();
    this.atualizarDash(delta);

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
        } else if (this.vilaoBloqueando) {
          // o ogro está de braços cruzados: soco e chute não causam dano
          tocarSom(this, 'miss');
          flutuarTexto(this, this.vilao.x, this.vilao.y - 100, 'BLOCKED');
        } else if (emChute) {
          this.danoNoVilao(this.danoDoChute(), this.cfg.sons.dano);
        } else {
          this.causarDano();
        }
      }
    }
  }
}