// Troca cores do sprite (ex.: vermelho -> preto) e recorta os quadros da animação
function recolorir(cena, origem, destino, trocas, larguraQuadro, alturaQuadro) {
  const img = cena.textures.get(origem).getSourceImage();
  const tex = cena.textures.createCanvas(destino, img.width, img.height);
  const ctx = tex.getContext();
  ctx.drawImage(img, 0, 0);

  const dados = ctx.getImageData(0, 0, img.width, img.height);
  const p = dados.data;
  for (let i = 0; i < p.length; i += 4) {
    const nova = trocas[`${p[i]},${p[i + 1]},${p[i + 2]}`];
    if (p[i + 3] > 0 && nova) {
      p[i] = nova[0];
      p[i + 1] = nova[1];
      p[i + 2] = nova[2];
    }
  }
  ctx.putImageData(dados, 0, 0);

  const quadros = img.width / larguraQuadro;
  for (let i = 0; i < quadros; i++) {
    tex.add(i, 0, i * larguraQuadro, 0, larguraQuadro, alturaQuadro);
  }
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  tex.refresh();
}

// pinta só o rosto (região da cabeça), sem mexer em mãos e pernas
// "topos" = altura do topo da cabeça em cada quadro (null = quadro sem rosto)
function pintarRosto(cena, chave, trocas, topos) {
  const tex = cena.textures.get(chave);
  const ctx = tex.getContext();

  topos.forEach((topo, quadro) => {
    if (topo === null) return;
    const x0 = quadro * 32;
    const dados = ctx.getImageData(x0, 0, 32, topo + 10);
    const p = dados.data;
    for (let i = 0; i < p.length; i += 4) {
      const nova = trocas[`${p[i]},${p[i + 1]},${p[i + 2]}`];
      if (p[i + 3] > 0 && nova) {
        p[i] = nova[0];
        p[i + 1] = nova[1];
        p[i + 2] = nova[2];
      }
    }
    ctx.putImageData(dados, x0, 0);
  });
  tex.refresh();
}

const CAPA_PRETA = {
  '109,5,29': [28, 28, 36],
  '172,10,27': [46, 46, 58],
  '214,36,17': [70, 70, 84]
};

const ROSTO_CLARO = {
  '104,96,144': [225, 215, 150],
  '168,176,224': [255, 250, 200],
  '250,253,255': [255, 255, 235]
};

// altura do topo da cabeça em cada quadro das animações do vilão
const TOPO_ANDAR = [18, 17, 16, 18, 17, 16];
const TOPO_SURGIR = [null, null, null, null, null, null, null, 36, 28, 21, 20];

const VELOCIDADE_HEROI = 90;   // pixels por segundo
const VELOCIDADE_VILAO = 40;
const DISTANCIA_LUTA = 60;     // o vilão para de andar a essa distância do herói
const DISTANCIA_ATAQUE = 70;   // o vilão começa um golpe a essa distância (ou menos)
const ALCANCE_SOCO = 75;       // distância máxima para o soco do herói acertar
const ALCANCE_VILAO = 75;      // distância máxima para o golpe do vilão acertar
const DANO_SOCO = 10;
const DANO_VILAO = 25;
const VIDA_HEROI = 100;
const VIDA_VILAO = 200;       // vida da Morte (200 = 20 socos)

const CHAO_Y = 205;            // posição dos pés dos lutadores no chão
const VELOCIDADE_PULO = 480;   // impulso inicial do pulo (pixels por segundo)
const GRAVIDADE = 1400;
const VELOCIDADE_NO_AR = 150;  // velocidade horizontal durante o pulo
const ALTURA_ESQUIVA = 20;     // acima disso, o herói está no ar e o golpe passa por baixo
const POSE_PULO = 3;           // quadro do andar usado como pose no ar

// ícone do botão de pulo: seta para cima ('#' = pixel aceso)
const SETA_CIMA = [
  ".....#.....",
  "....###....",
  "...#####...",
  "..#######..",
  ".#########.",
  "....###....",
  "....###....",
  "....###....",
  "....###...."
];

const COOLDOWN_ESQUIVA = 3000;  // tempo (ms) até a Morte poder esquivar de novo
const PRIMEIRA_ESQUIVA = 3000;  // a primeira esquiva só fica disponível depois disso

class CenaLuta extends Phaser.Scene {
  preload() {
    this.load.image('cenario', 'assets/cenario-noite.png');
    this.load.spritesheet('vilao-andar', 'assets/vilao-andar.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('vilao-surgir', 'assets/vilao-surgir.png', {
      frameWidth: 32,
      frameHeight: 48
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
    this.add.image(0, 0, 'cenario').setOrigin(0, 0);

    // garante o estado normal ao reiniciar a luta
    this.anims.globalTimeScale = 1;
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(256, 112);

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

    this.heroi = this.add.sprite(150, CHAO_Y, 'heroi-andar').setOrigin(0.5, 1).setScale(2);
    this.heroi.setFrame(0);
    this.heroiAtacando = false;
    this.heroiMorrendo = false;
    this.heroiNoAr = false;
    this.heroiAltura = 0;
    this.velocidadeY = 0;

    this.vilao = this.add.sprite(360, CHAO_Y, 'vilao-preto').setOrigin(0.5, 1).setScale(2);
    this.vilao.setFrame(0);
    this.vilaoAtacando = false;
    // o relógio do Phaser é o tempo total do jogo, então os prazos contam a partir do início desta luta
    const inicio = this.time.now;
    this.vilaoProximoAtaque = inicio + 1500; // primeiro golpe depois de 1,5 s
    this.vilaoEsquivando = false;
    this.vilaoInvulneravel = false;
    this.vilaoProximaEsquiva = inicio + PRIMEIRA_ESQUIVA;

    this.heroiVida = VIDA_HEROI;
    this.vilaoVida = VIDA_VILAO;
    this.fimDeJogo = false;
    this.criarBarrasDeVida();

    this.teclas = this.input.keyboard.createCursorKeys();
    this.teclaSoco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.teclaPulo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.criarControlesDeToque();
  }

  criarBarrasDeVida() {
    this.barras = this.add.graphics().setDepth(20);

    const estilo = { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' };
    this.add.text(12, 22, 'HERO', estilo).setDepth(21);
    this.add.text(500, 22, 'VILLAIN', estilo).setOrigin(1, 0).setDepth(21);

    this.desenharBarras();
  }

  desenharBarras() {
    const largura = 180;
    const altura = 10;
    const y = 8;
    const xHeroi = 12;
    const xVilao = 512 - 12 - largura;

    const g = this.barras;
    g.clear();

    // fundo e borda
    g.fillStyle(0x000000, 0.7);
    g.fillRect(xHeroi - 2, y - 2, largura + 4, altura + 4);
    g.fillRect(xVilao - 2, y - 2, largura + 4, altura + 4);
    g.fillStyle(0x4a1010, 1);
    g.fillRect(xHeroi, y, largura, altura);
    g.fillRect(xVilao, y, largura, altura);

    // vida atual: a do herói esvazia da direita para a esquerda, a do vilão ao contrário
    const larguraHeroi = largura * (this.heroiVida / VIDA_HEROI);
    const larguraVilao = largura * (this.vilaoVida / VIDA_VILAO);
    g.fillStyle(0xffd23f, 1);
    g.fillRect(xHeroi, y, larguraHeroi, altura);
    g.fillRect(xVilao + (largura - larguraVilao), y, larguraVilao, altura);
  }

  criarControlesDeToque() {
    this.input.addPointer(2); // permite tocar em mais de um botão ao mesmo tempo
    this.toque = { esquerda: false, direita: false, soco: false, pulo: false };

    const botao = (x, y, direcao) => {
      const d = direcao === 'esquerda' ? -1 : 1;

      const g = this.add.graphics().setDepth(10);
      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(x, y, 22);
      g.fillStyle(0xffffff, 0.6);
      g.fillTriangle(x - 9 * d, y - 10, x - 9 * d, y + 10, x + 9 * d, y);

      const zona = this.add.zone(x, y, 56, 56).setInteractive().setDepth(11);
      zona.on('pointerdown', () => { this.toque[direcao] = true; });
      zona.on('pointerup', () => { this.toque[direcao] = false; });
      zona.on('pointerout', () => { this.toque[direcao] = false; });
    };

    botao(36, 192, 'esquerda');
    botao(96, 192, 'direita');

    // botão de soco, no canto direito: mostra o herói com o braço esticado
    const sx = 476;
    const sy = 192;
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0xff8a00, 0.35);
    g.fillCircle(sx, sy, 24);
    // o herói não fica no centro do quadro 3, então o ícone é deslocado para centralizar no botão
    this.add.image(sx - 2.6, sy - 3.9, 'heroi-soco', 3).setScale(1.3).setDepth(11).setAlpha(0.95);

    const zonaSoco = this.add.zone(sx, sy, 60, 60).setInteractive().setDepth(12);
    zonaSoco.on('pointerdown', () => { this.toque.soco = true; });

    // botão de pulo, ao lado do soco: seta para cima
    const px = 418;
    const gp = this.add.graphics().setDepth(10);
    gp.fillStyle(0xffffff, 0.25);
    gp.fillCircle(px, sy, 24);
    this.desenharIcone(SETA_CIMA, px, sy, 3);

    const zonaPulo = this.add.zone(px, sy, 60, 60).setInteractive().setDepth(12);
    zonaPulo.on('pointerdown', () => { this.toque.pulo = true; });
  }

  // desenha um ícone em pixels a partir de uma grade de texto ('#' = pixel aceso)
  desenharIcone(grade, cx, cy, tamanho) {
    const g = this.add.graphics().setDepth(11);
    g.fillStyle(0xffffff, 0.9);
    const largura = grade[0].length * tamanho;
    const altura = grade.length * tamanho;
    grade.forEach((linha, j) => {
      [...linha].forEach((letra, i) => {
        if (letra === '#') {
          g.fillRect(cx - largura / 2 + i * tamanho, cy - altura / 2 + j * tamanho, tamanho, tamanho);
        }
      });
    });
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
    this.heroiVida = Math.max(0, this.heroiVida - DANO_VILAO);
    this.desenharBarras();

    // herói pisca em vermelho e recua um pouco
    this.heroi.setTint(0xff6666);
    this.time.delayedCall(100, () => this.heroi.clearTint());
    this.heroi.x += this.heroi.x < this.vilao.x ? -10 : 10;

    if (this.heroiVida <= 0) this.derrotaDoHeroi();
  }

  derrotaDoHeroi() {
    this.fimDeJogo = true;
    this.heroiMorrendo = true;
    this.heroiNoAr = false;
    this.heroiAltura = 0;
    this.heroi.y = CHAO_Y;
    this.heroi.clearTint();
    this.heroi.play('heroi-morte');
    this.heroi.once('animationcomplete', () => this.mostrarFim('GAME OVER', null, '#e03030'));
  }

  // ---------- vilão ----------

  causarDano() {
    this.vilaoVida = Math.max(0, this.vilaoVida - DANO_SOCO);
    this.desenharBarras();

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
      this.time.delayedCall(450, () => this.mostrarFim('K.O.!!!!', 'YOU WIN', '#ff8a00'));
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

  flutuarTexto(x, y, conteudo) {
    const texto = this.add.text(x, y, conteudo, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: texto,
      y: texto.y - 16,
      alpha: 0,
      duration: 600,
      onComplete: () => texto.destroy()
    });
  }

  mostrarEsquiva() {
    this.flutuarTexto(this.heroi.x, this.heroi.y - 70, 'DODGE!');
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

  // ---------- fim de jogo ----------

  mostrarFim(titulo, subtitulo, cor) {
    // o título "cai" na tela, grande, e treme a câmera ao bater
    const texto = this.add.text(256, 80, titulo, {
      fontFamily: 'monospace',
      fontSize: '44px',
      fontStyle: 'bold',
      color: cor,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(30).setScale(5).setAlpha(0);

    this.tweens.add({
      targets: texto,
      scale: 1,
      alpha: 1,
      duration: 350,
      ease: 'Cubic.In',
      onComplete: () => this.cameras.main.shake(200, 0.01)
    });

    if (subtitulo) {
      const sub = this.add.text(256, 112, subtitulo, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(30).setAlpha(0);
      this.tweens.add({ targets: sub, alpha: 1, delay: 500, duration: 400 });
    }

    // botão de jogar de novo aparece depois, piscando
    this.time.delayedCall(900, () => {
      const botao = this.add.text(256, 145, 'PLAY AGAIN', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(30).setInteractive();

      this.tweens.add({ targets: botao, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

      botao.on('pointerdown', () => this.scene.restart());
      this.input.keyboard.once('keydown-ENTER', () => this.scene.restart());
    });
  }

  // ---------- loop principal ----------

  update(tempo, delta) {
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
          this.flutuarTexto(this.vilao.x, this.vilao.y - 100, 'MISS');
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
  scene: CenaLuta
});