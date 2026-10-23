// Luta 4: o boss final (SUN DEVOURER). Tudo que é dele fica aqui: textos, cenário, sons, sprites, animações, golpes, vida e movimento.
// Fase 1 da luta: ele anda até o herói e dá um soco de perto; de longe, joga uma bola de fogo; e pisca em chamas para esquivar.
// Quando a vida da fase 1 zera, ele cai, levanta e faz o power-up (função transicao, mais abaixo) e a luta continua com o FASE_BOSS_2:
// boneco novo, vida própria e o chute (rasteira). A rajada de fireball vem depois.
// Os valores de vida, dano e alcance são um chute inicial: ajuste depois do teste.

const FASE_BOSS = {
  nome: 'SUN DEVOURER',
  rotuloVilao: 'SUN DEVOURER',   // nome que aparece na barra de vida do vilão
  // as falas só aparecem se a luta for aberta direto pelo console; no jogo elas já aconteceram na cutscene
  dialogoHeroi: 'I came to send you back to hell.',
  dialogoVilao: 'Do your best, little human...',

  // cenário: o recorte de 512x224 do cenário da cutscene
  cenario: 'assets/cenario-boss-512.png',
  cenarioChave: 'cenario-boss-luta',

  // a luta começa direto: as falas do boss já aconteceram na cutscene
  semEntrada: true,

  // posições do começo da luta: as mesmas do fim da cutscene (o herói em 256, o boss em 400)
  inicioHeroi: 256,
  inicioVilao: 400,

  // vida, tamanho e movimento do vilão
  vida: 1200,                 // fase 1 (a fase 2 tem a vida dela no FASE_BOSS_2)
  barraLargura: 320,          // barra bem larga, de chefe
  escala: 2.6,                // a mesma da cutscene
  espelhado: true,            // o sprite do boss nasce virado para a esquerda
  velocidade: 40,             // pixels por segundo
  distanciaLuta: 95,          // para de andar a essa distância do herói
  distanciaAtaque: 110,       // começa o soco a essa distância (ou menos)
  alcanceSoco: 105,           // alcance dos golpes do herói nele (a margem do corpo é 75, então o padrão do config.js não alcançaria)
  margemCorpo: 75,            // o boss é enorme: o herói fica longe do centro dele
  alturaPassagem: 999,        // o herói não consegue pular por cima do boss
  idleAnimado: true,          // parado, ele fica respirando (idle animado) em vez de congelar no quadro 0

  // origem vertical (0 a 1) por textura: frames 128x128 com os pés em y=107
  // (na morte o corpo deitado fica uns pixels mais baixo; se o corpo afundar no chão, diminua o valor)
  origemY: {
    'boss-idle': 107 / 128,
    'boss-walk': 107 / 128,
    'boss-ataque': 107 / 128,
    'boss-bola': 107 / 128,
    'boss-hit': 107 / 128,
    'boss-morte': 108 / 128,
    'boss-levantar': 108 / 128,   // deitado: o corpo fica uns pixels mais baixo, como na morte
    'boss-powerup': 107 / 128
  },

  // animação de dano: intervalo mínimo entre duas
  hitCooldown: 1000,          // ms

  // sons próprios desta fase (chaves definidas em SONS, no config.js)
  sons: {
    dano: 'soco',             // por enquanto o som do soco; troque quando houver um som do boss
    tiro: 'tiro'              // som do disparo do herói
  },

  // golpes do boss. O corpo a corpo dele é o soco
  golpes: {
    intervalo: 1800,          // um ataque a cada 1,8 segundo
    corpo: {
      dano: 30,
      alcance: 110,
      desviaCom: ['agachar', 'pulo'],   // desviado agachando ou pulando
      aviso: 700,             // aviso laranja de 0,7 s (a animação a 10 fps chega no soco esticado nesse tempo)     avanco: { distancia: 30, duracao: 100 },  // avanço rápido do golpe
      corte: false            // sem arco laranja: o boss já tem a animação do soco
    },
    // bola de fogo: de longe (o herói pelo menos a distanciaMin), no lugar do soco.
    // Sai da mão no quadro 5 da animação, voa para o lado do herói e desce até a altura do peito dele
    bola: {
      dano: 30,
      aviso: 400,             // a animação a 10 fps chega no arremesso (quadro 5) nesse tempo
      distanciaMin: 170,      // só atira com o herói pelo menos tão longe
      velocidade: 220,        // pixels por segundo
      saidaX: 117,            // pixels à frente do centro do boss, onde fica a mão no arremesso
      alturaInicial: 60,      // altura da bola saindo da mão
      alturaFinal: 36,        // altura do peito do herói
      descida: 140,           // pixels de voo até chegar na altura final
      raio: 18,               // distância horizontal do herói para a bola acertar
      desviaCom: ['pulo', 'agachar']   // desviada pulando ou agachando
    }
  },

  // golpes do herói disponíveis nesta luta (o herói mantém o que aprendeu contra o ogro)
  agachar: true,              // seta para baixo / botão azul
  tiro: {
    municao: 12,
    dano: 65,
    velocidade: 300,          // pixels por segundo
    altura: 8,
    alturaDisparo: 32,        // altura visual da bala: sai na altura do braço do herói (o chão é 205)
    alcanceCorpo: 80          // distância do centro do boss para a bala acertar (ele é largo)
  },

  // esquiva: o piscar em chamas (feito no código, sem arte). Quando o herói soca perto, o corpo vira uma silhueta
  // laranja que esmaece em brasas e reaparece atrás do herói; enquanto some, o soco cai no vazio (MISS) e o tiro passa
  esquiva: true,
  esquivaChamas: true,
  primeiraEsquiva: 5000,      // ms: a primeira esquiva só fica disponível depois disso
  cooldownEsquiva: 6000,      // ms até ele poder esquivar de novo

  // o herói tem uma poção de cura nesta luta (botão perto das munições e a tecla C)
  pocaoHeroi: true,
  pocoes: 3,                  // quantas poções o herói tem nesta luta

  // imagem que aparece na caixa de diálogo (a foto única da cutscene; sem frames)
  retrato: { chave: 'boss-thumb', frame: '__BASE', escala: 0.17 },

  // arquivos dos sprites do boss (pasta assets/BossFase1), todos com frames de 128x128
  sprites: {
    idle: 'assets/BossFase1/boss_idle.png',
    andar: 'assets/BossFase1/boss_walk.png',
    ataque: 'assets/BossFase1/boss_ataque_basico.png',
    bola: 'assets/BossFase1/boss_ataque_fireball.png',
    hit: 'assets/BossFase1/boss_hit.png',
    morte: 'assets/BossFase1/boss_death.png',
    levantar: 'assets/BossFase1/boss_levantar.png',   // levantando depois da queda (5 quadros)
    powerup: 'assets/BossFase1/boss_powerup.png',     // o power-up (9 quadros)
    retrato: 'assets/tumbBoss.png',
    largura: 128,
    altura: 128
  },

  // nomes internos das texturas (idle e andar são os mesmos da cutscene, que já os carrega)
  texturas: {
    parado: 'boss-idle',
    andar: 'boss-walk',
    ataque: 'boss-ataque',
    bola: 'boss-bola',
    hit: 'boss-hit',
    morte: 'boss-morte',
    levantar: 'boss-levantar',
    powerup: 'boss-powerup'
  },

  // nomes internos das animações
  anims: {
    parado: 'boss-idle',
    andar: 'boss-walk',
    ataque: 'boss-ataque',
    bola: 'boss-bola',
    hit: 'boss-hit',
    morte: 'boss-morte',
    levantar: 'boss-levantar',
    powerup: 'boss-powerup'
  },

  // a transição entre as fases: cai (animação de morte), fica caído, levanta, faz o power-up e a barra enche de novo.
  // Os tempos são em ms; o herói fica parado e o cronômetro da luta pausa durante a cena toda
  transicaoTempos: {
    pausaCaido: 2900,          // fica caído antes de levantar
    levantarFps: 6,           // 5 quadros: ~0,8 s
    pausaAntesPowerup: 300,   // de pé, antes do power-up começar
    powerupFps: 8,            // 9 quadros: ~1,1 s
    quadroClarao: 7,          // quadro do power-up (0 a 8) em que o clarão estoura
    tremorForca: 0.006,       // força do tremor da tela durante o power-up
    pausaDepois: 500,         // parado de pé, em chamas, antes da barra encher
    enchimentoBarra: 3000     // quanto a barra da fase 2 demora para encher
  },

  // a próxima fase do boss: FASE_BOSS_2 (definida logo abaixo, depois deste objeto)
  proximaFase: null,

  // carrega os sprites do boss (chamado pelo preload da cena de luta); o que a cutscene já carregou é pulado.
  // Carrega também os sheets da transição e os da fase 2, para não haver espera no meio da luta
  carregar(cena) {
    const T = this.texturas;
    const S = this.sprites;
    const tamanho = { frameWidth: S.largura, frameHeight: S.altura };

    cena.load.spritesheet(T.parado, S.idle, tamanho);
    cena.load.spritesheet(T.andar, S.andar, tamanho);
    cena.load.spritesheet(T.ataque, S.ataque, tamanho);
    cena.load.spritesheet(T.bola, S.bola, tamanho);
    cena.load.spritesheet(T.hit, S.hit, tamanho);
    cena.load.spritesheet(T.morte, S.morte, tamanho);
    cena.load.spritesheet(T.levantar, S.levantar, tamanho);
    cena.load.spritesheet(T.powerup, S.powerup, tamanho);
    cena.load.image('boss-thumb', S.retrato);

    // fase 2: o boneco novo
    const P = this.proximaFase;
    if (P) {
      const t2 = { frameWidth: P.sprites.largura, frameHeight: P.sprites.altura };
      cena.load.spritesheet(P.texturas.parado, P.sprites.idle, t2);
      cena.load.spritesheet(P.texturas.andar, P.sprites.andar, t2);
      cena.load.spritesheet(P.texturas.ataque, P.sprites.ataque, t2);
      cena.load.spritesheet(P.texturas.bola, P.sprites.bola, t2);
      cena.load.spritesheet(P.texturas.chute, P.sprites.chute, t2);
      cena.load.spritesheet(P.texturas.hit, P.sprites.hit, t2);
      cena.load.spritesheet(P.texturas.morte, P.sprites.morte, t2);
    }
  },

  // cria as animações do boss (chamado pelo create da cena de luta).
  // A cutscene já cria boss-idle e boss-walk, então cada animação só é criada se ainda não existir
  preparar(cena) {
    const T = this.texturas;
    const A = this.anims;
    const X = this.transicaoTempos;
    const criar = (config) => {
      if (!cena.anims.exists(config.key)) cena.anims.create(config);
    };

    criarAnimacoesDoBoss(cena, T, A);

    // levantando depois da queda: 5 quadros, toca uma vez (o último fica parado)
    criar({
      key: A.levantar,
      frames: cena.anims.generateFrameNumbers(T.levantar, { start: 0, end: 4 }),
      frameRate: X.levantarFps,
      repeat: 0
    });

    // power-up: 9 quadros, toca uma vez (o último fica parado)
    criar({
      key: A.powerup,
      frames: cena.anims.generateFrameNumbers(T.powerup, { start: 0, end: 8 }),
      frameRate: X.powerupFps,
      repeat: 0
    });

    // fase 2: as animações do boneco novo
    if (this.proximaFase) criarAnimacoesDoBoss(cena, this.proximaFase.texturas, this.proximaFase.anims);
  },

  // a vida da fase 1 zerou (chamada pelo derrotaDoVilao, em luta/vilao-dano.js): cai, levanta, faz o power-up e vira a fase 2.
  // A cena fica com fimDeJogo ligado durante tudo isso: os golpes e as pausas que já estavam agendados são ignorados
  // e o update fica parado. Só no fim a luta volta.
  transicao(cena) {
    const A = this.anims;
    const X = this.transicaoTempos;
    const P = this.proximaFase;
    const cam = cena.cameras.main;

    cena.fimDeJogo = true;
    const pausaDesde = cena.time.now;   // o cronômetro da luta pausa daqui

    // limpa o que o boss estava fazendo (golpe, esquiva, pulo, bloqueio, poção) e o que estava voando
    cena.vilaoAtacando = false;
    cena.vilaoEsquivando = false;
    cena.vilaoInvulneravel = false;
    cena.vilaoBloqueando = false;
    cena.vilaoBebendo = false;
    cena.vilaoNoAr = false;
    cena.vilaoDesviando = false;
    cena.vilaoAnimando = false;
    cena.vilaoAltura = 0;
    cena.vilaoVelY = 0;
    cena.curaBrilho = false;
    cena.curaPiscaOn = false;
    cena.tweens.killTweensOf(cena.vilao);
    cena.vilao.clearTint();
    if (cena.vilao.postFX) cena.vilao.postFX.clear();
    cena.vilao.setAlpha(1);
    cena.vilao.y = CHAO_Y;
    cena.limparTiros();
    cena.limparBolas();

    // herói: pousa, levanta (se estava agachado) e fica parado, virado para o boss
    cena.heroiNoAr = false;
    cena.heroiAltura = 0;
    cena.velocidadeY = 0;
    cena.puloPendenteAte = 0;
    cena.heroi.y = CHAO_Y;
    cena.heroi.clearTint();
    if (cena.heroiAgachado) cena.levantar();
    if (!cena.heroiAtacando) {
      cena.heroi.stop();
      cena.heroi.setTexture('heroi-andar', 0);
    }
    cena.heroi.setFlipX(cena.vilao.x < cena.heroi.x);

    // o boss olha para o herói
    cena.virarVilao(cena.heroi.x < cena.vilao.x);

    // 1) a queda: a mesma animação de morte, com clarão, tremor e câmera lenta
    cam.flash(300, 255, 255, 255);
    cam.shake(400, 0.012);
    cena.anims.globalTimeScale = 0.5;
    cena.vilao.play(A.morte);
    cena.vilao.once('animationcomplete-' + A.morte, () => {
      cena.anims.globalTimeScale = 1;
      cena.time.delayedCall(X.pausaCaido, levantar);
    });

    // 2) levanta
    const levantar = () => {
      cena.vilao.play(A.levantar);
      cena.vilao.once('animationcomplete-' + A.levantar, () => {
        cena.time.delayedCall(X.pausaAntesPowerup, powerup);
      });
    };

    // 3) power-up: tremor na tela, brasas subindo e um clarão no quadro mais forte
    const powerup = () => {
      cena.vilao.play(A.powerup);

      const duracao = (9 * 1000) / X.powerupFps;
      cam.shake(duracao + 300, X.tremorForca);

      cena.time.addEvent({
        delay: 180,
        repeat: Math.floor(duracao / 180),
        callback: () => cena.brasas(cena.vilao.x, CHAO_Y - 60)
      });

      cena.time.delayedCall((X.quadroClarao * 1000) / X.powerupFps, () => cam.flash(350, 255, 220, 140));

      cena.vilao.once('animationcomplete-' + A.powerup, () => {
        cena.time.delayedCall(X.pausaDepois, comecarFase2);
      });
    };

    // 4) vira a fase 2: o boneco novo, a barra enche de novo e a luta volta
    const comecarFase2 = () => {
      cena.cfg = P;               // daqui para a frente, o boss é o da fase 2 (texturas, golpes, vida)
      cena.vilaoVidaMax = P.vida;
      cena.vilaoVida = 0;
      cena.vilaoParado();         // idle do boneco novo
      desenharBarras(cena);

      const barra = { v: 0 };
      cena.tweens.add({
        targets: barra,
        v: P.vida,
        duration: X.enchimentoBarra,
        ease: 'Linear',
        onUpdate: () => {
          cena.vilaoVida = barra.v;
          desenharBarras(cena);
        },
        onComplete: () => {
          cena.vilaoVida = P.vida;
          desenharBarras(cena);

          // a luta volta: o tempo da cena não conta no cronômetro
          cena.inicioLuta += cena.time.now - pausaDesde;
          cena.vilaoProximoAtaque = cena.time.now + 1500;
          cena.vilaoProximaEsquiva = cena.time.now + P.primeiraEsquiva;
          cena.vilaoProximoHit = 0;
          cena.socoAcertou = false;
          cena.fimDeJogo = false;
        }
      });
    };
  }
};

// cria as animações de um boneco do boss (o da fase 1 ou o da fase 2); só cria o que ainda não existe.
// A chave chute só existe no boneco da fase 2
function criarAnimacoesDoBoss(cena, T, A) {
  const criar = (config) => {
    if (!cena.anims.exists(config.key)) cena.anims.create(config);
  };

  criar({
    key: A.parado,
    frames: cena.anims.generateFrameNumbers(T.parado, { start: 0, end: 3 }),
    frameRate: 5,
    repeat: -1
  });

  criar({
    key: A.andar,
    frames: cena.anims.generateFrameNumbers(T.andar, { start: 0, end: 7 }),
    frameRate: 8,
    repeat: -1
  });

  // soco: 6 quadros a 10 fps; o soco esticado (último quadro) chega em 0,5 s, a hora do dano
  criar({
    key: A.ataque,
    frames: cena.anims.generateFrameNumbers(T.ataque, { start: 0, end: 5 }),
    frameRate: 10,
    repeat: 0
  });

  // bola de fogo: 6 quadros a 10 fps; a bola sai da mão no quadro 5 (0,4 s)
  criar({
    key: A.bola,
    frames: cena.anims.generateFrameNumbers(T.bola, { start: 0, end: 5 }),
    frameRate: 10,
    repeat: 0
  });

  // chute (rasteira): 6 quadros a 10 fps; a perna esticada (último quadro) chega em 0,5 s, a hora do dano
  if (A.chute) {
    criar({
      key: A.chute,
      frames: cena.anims.generateFrameNumbers(T.chute, { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
  }

  // dano: 6 quadros, toca uma vez
  criar({
    key: A.hit,
    frames: cena.anims.generateFrameNumbers(T.hit, { start: 0, end: 5 }),
    frameRate: 14,
    repeat: 0
  });

  // morte: 7 quadros, sem loop (o último fica parado no chão)
  criar({
    key: A.morte,
    frames: cena.anims.generateFrameNumbers(T.morte, { start: 0, end: 6 }),
    frameRate: 8,
    repeat: 0
  });
}

// Fase 2 do boss: tudo que não aparece aqui é igual ao FASE_BOSS (o ...FASE_BOSS copia o resto).
// O boneco é o novo (pasta assets/BossFase2, frames de 128x128 com os pés em y=107) e o boss ganha o chute.
// Vida, velocidade, dano e alcance são um chute inicial: ajuste depois do teste.
const FASE_BOSS_2 = {
  ...FASE_BOSS,
  transicao: null,            // a fase 2 não tem transição: quando a vida zera, a luta termina de verdade (K.O. e ranking)
  proximaFase: null,
  recomecarAqui: true,        // se o herói morrer na fase 2, o PLAY AGAIN volta direto nela (sem a fase 1 e sem a transição)

  // carrega os sheets do boneco novo (usado quando a luta recomeça direto na fase 2; no caminho normal o FASE_BOSS já carregou tudo)
  carregar(cena) {
    const T = this.texturas;
    const S = this.sprites;
    const tamanho = { frameWidth: S.largura, frameHeight: S.altura };

    cena.load.spritesheet(T.parado, S.idle, tamanho);
    cena.load.spritesheet(T.andar, S.andar, tamanho);
    cena.load.spritesheet(T.ataque, S.ataque, tamanho);
    cena.load.spritesheet(T.bola, S.bola, tamanho);
    cena.load.spritesheet(T.chute, S.chute, tamanho);
    cena.load.spritesheet(T.hit, S.hit, tamanho);
    cena.load.spritesheet(T.morte, S.morte, tamanho);
    cena.load.image('boss-thumb', S.retrato);
  },

  // cria as animações do boneco novo
  preparar(cena) {
    criarAnimacoesDoBoss(cena, this.texturas, this.anims);
  },

  vida: 1500,
  velocidade: 50,             // um pouco mais rápido que na fase 1

  origemY: {
    'boss2-idle': 107 / 128,
    'boss2-walk': 107 / 128,
    'boss2-ataque': 107 / 128,
    'boss2-bola': 107 / 128,
    'boss2-chute': 107 / 128,
    'boss2-hit': 107 / 128,
    'boss2-morte': 107 / 128
  },

  golpes: {
    intervalo: 1500,          // um ataque a cada 1,5 segundo
    chanceChute: 0.4,         // chance de o golpe corpo a corpo ser o chute em vez do soco
    corpo: {
      dano: 35,
      alcance: 110,
      desviaCom: ['agachar', 'pulo'],
      aviso: 700,
      corte: false
    },
    // chute (rasteira): o herói só desvia pulando (agachar não adianta)
    chute: {
      dano: 35,
      alcance: 125,
      desviaCom: ['pulo'],
      aviso: 500,             // a animação a 10 fps chega na perna esticada nesse tempo
      corte: false
    },
    bola: {
      dano: 35,
      aviso: 400,
      distanciaMin: 170,
      velocidade: 240,
      saidaX: 117,
      alturaInicial: 60,
      alturaFinal: 36,
      descida: 140,
      raio: 18,
      desviaCom: ['pulo', 'agachar']
    }
  },

  // arquivos dos sprites do boneco novo (pasta assets/BossFase2)
  sprites: {
    idle: 'assets/BossFase2/boss2_idle.png',
    andar: 'assets/BossFase2/boss2_walk.png',
    ataque: 'assets/BossFase2/boss2_ataque_basico.png',
    bola: 'assets/BossFase2/boss2_ataque_fireball.png',
    chute: 'assets/BossFase2/boss2_chute.png',
    hit: 'assets/BossFase2/boss2_hit.png',
    morte: 'assets/BossFase2/boss2_death.png',
    retrato: 'assets/tumbBoss.png',
    largura: 128,
    altura: 128
  },

  texturas: {
    parado: 'boss2-idle',
    andar: 'boss2-walk',
    ataque: 'boss2-ataque',
    bola: 'boss2-bola',
    chute: 'boss2-chute',
    hit: 'boss2-hit',
    morte: 'boss2-morte'
  },

  anims: {
    parado: 'boss2-idle',
    andar: 'boss2-walk',
    ataque: 'boss2-ataque',
    bola: 'boss2-bola',
    chute: 'boss2-chute',
    hit: 'boss2-hit',
    morte: 'boss2-morte'
  }
};

// liga a fase 1 à fase 2 (o carregar e o preparar do FASE_BOSS usam isto)
FASE_BOSS.proximaFase = FASE_BOSS_2;