// A cena de luta: herói, vilão e o loop principal.
// Constantes ficam em config.js; cores em recolor.js; barras e textos em hud.js; botões em controles.js; sons em audio.js; diálogos em dialogo.js.
// O herói fica em luta/heroi.js; os itens que o herói pega e usa (poção, soco inglês) em luta/pocao-heroi.js; os golpes, a bola de fogo, o bloqueio e a esquiva do vilão em luta/vilao-golpes.js; o dano, a poção e o K.O. do vilão em luta/vilao-dano.js.
// Cada fase (fases/fase1.js, fases/fase2.js, fases/fase3.js, fases/fase-boss.js) traz seus próprios textos, sons, sprites, animações, golpes, vida, movimento, esquiva, morte e cenário.

// ordem das lutas no caminho: criatura, ogro, lobisomem, boss final
const FASES = [FASE1, FASE2, FASE3, FASE_BOSS];

// herói novo: frames de 48x48 com os pés em y=39
const HEROI_ORIGEM_Y = 39 / 48;

class CenaLuta extends Phaser.Scene {
  constructor() {
    super('CenaLuta');
  }

  init(data) {
    // fase = índice da luta no caminho (0 = primeira)
    this.fase = (data && data.fase) || 0;
    // data.cfg: recomeço direto numa fase específica (a fase 2 do boss); sem ele, vale a fase do caminho
    this.cfg = (data && data.cfg) || FASES[Math.min(this.fase, FASES.length - 1)];
  }

  preload() {
    // os sons são carregados na tela inicial (tela-inicial.js)

    // cada fase tem o próprio cenário, carregado com a chave definida na fase
    this.load.image(this.cfg.cenarioChave, this.cfg.cenario);
    this.cfg.carregar(this);

    // herói: sheets e ícones (luta/heroi.js)
    this.carregarHeroi();
    this.carregarItensHeroi();
  }

  create() {
    // reinício da cena: o relógio da cena guarda o valor da última vez que rodou, então sincroniza com o tempo do jogo
    this.time.now = this.game.loop.time;

    // fases com cenário grande (o boss): mostra a imagem reduzida e subida, igual à cutscene
    if (this.cfg.cenarioEscala) {
      this.fundo = this.add.image(0, this.cfg.cenarioY || 0, this.cfg.cenarioChave).setOrigin(0, 0).setScale(this.cfg.cenarioEscala);
    } else {
      this.fundo = this.add.tileSprite(0, 0, 512, 224, this.cfg.cenarioChave).setOrigin(0, 0);
      this.fundo.y = this.cfg.cenarioAjusteY || 0;   // ajuste de altura do cenário, aplicado em toda tentativa
    }
    
    // garante o estado normal ao reiniciar a luta
    this.anims.globalTimeScale = 1;
    this.cameras.main.setZoom(1);

    // cores e animações do vilão ficam na configuração da fase
    this.cfg.preparar(this);

    // animações do herói (luta/heroi.js)
    this.criarAnimacoesHeroi();

    // a entrada do herói e os diálogos acontecem na primeira vez que cada fase é jogada
    const jaVista = (this.game.fasesVistas || {})[this.fase];
    const comEntrada = !jaVista && !this.cfg.semEntrada;

    this.heroi = this.add.sprite(comEntrada ? 40 : (this.cfg.inicioHeroi || 150), CHAO_Y, 'heroi-andar').setOrigin(0.5, HEROI_ORIGEM_Y).setScale(2);
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

    this.vilao = this.add.sprite(this.cfg.inicioVilao || 360, CHAO_Y + (this.cfg.descerVilao || 0), this.cfg.texturas.parado).setOrigin(0.5, 1).setScale(this.cfg.escala);
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
    this.vilaoBloqueando = false;  // true enquanto o ogro está de braços cruzados (soco e chute não causam dano)
    this.vilaoProximoBloqueio = 0; // quando o ogro pode bloquear de novo (ms)
    this.vilaoNoAr = false;        // true enquanto o vilão pula (pisão do ogro)
    this.vilaoDesviando = false;   // true enquanto o pulo é um desvio de tiro
    this.vilaoProximoDesvio = 0;   // quando o ogro pode desviar de novo (ms)
    this.vilaoInvestindo = false;  // true enquanto o lobisomem corre na investida (atravessa o herói)
    this.vilaoProximaInvestida = 0; // quando o lobisomem pode investir de novo (ms)
    this.cicloIdx = 0;             // posição no ciclo de golpes da fase (o boss da fase 2)
    this.vilaoRecuando = false;    // true enquanto o boss anda para trás para ganhar distância e lançar a bola (fase 2)
    this.vilaoEmFuria = false;     // true depois que o lobisomem entra na fúria (vermelho, mais rápido)
    this.furiaTransicao = false;   // true enquanto ele uiva e pisca em vermelho, parado
    this.vilaoFlashAte = 0;        // até quando dura o flash de dano (a cor da fúria espera ele acabar)
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
    // PERFECT: vira true assim que o herói leva qualquer dano; já começa true se a luta recomeça direto na fase 2 do boss (a luta inteira não foi jogada)
    this.heroiLevouDano = !!this.cfg.recomecarAqui;
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
    this.bolas = [];             // bolas de fogo do boss em voo
    this.viradaEvento = null;    // o piscar da barra no modo virada (a poção desliga)
    this.municao = this.cfg.tiro ? this.cfg.tiro.municao : 0;
    this.textoMunicao = this.cfg.tiro
      ? this.add.text(12, 38, '', { fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setDepth(21)
      : null;
    this.atualizarMunicao();

    this.teclas = this.input.keyboard.createCursorKeys();
    this.teclaSoco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.teclaPulo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.teclaTiro = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.teclaPocao = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    criarControlesDeToque(this);
    this.criarBotaoPocao();   // o ícone da poção perto das munições (só nas lutas que dão a poção ao herói)

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

  // grava o tempo da luta vencida no ranking da fase, com a data da vitória e o identificador da run
  registrarTempo() {
    db.collection('ranking').add({
      nome: this.game.nomeJogador || 'ANON',
      fase: this.fase + 1,                          // luta 1, 2, 3 ou 4
      tempo: Number(this.tempoLuta.toFixed(2)),     // em segundos
      data: new Date(),                             // data e hora da vitória
      runId: this.game.runId || null,               // liga este tempo à run completa
      perfect: !this.heroiLevouDano                 // true se venceu sem levar dano (o selo PERFECT do ranking)
    }).catch((erro) => console.error('Erro ao salvar ranking:', erro));
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

    // bolas de fogo do boss em voo
    this.atualizarBolas(delta);
    if (this.fimDeJogo) return;

    // pulo do vilão (pisão do ogro): sobe, cai e chama o pouso
    if (this.vilaoNoAr) {
      this.vilaoVelY += GRAVIDADE * (delta / 1000);
      this.vilaoAltura -= this.vilaoVelY * (delta / 1000);
      if (this.vilaoAltura <= 0) this.vilaoAterrissa();
    }
    this.vilao.y = CHAO_Y + (this.cfg.descerVilao || 0) - this.vilaoAltura;

    // investida do lobisomem: corre até passar do herói
    if (this.vilaoInvestindo) this.atualizarInvestida(delta);
    if (this.fimDeJogo) return;

    // vilão: anda sozinho em direção ao herói, para perto dele e ataca.
    // A velocidade, as distâncias e os golpes vêm da fase de cada vilão
    const passo = (velocidade) => (velocidade * delta) / 1000;
    const distancia = Math.abs(this.vilao.x - this.heroi.x);
    const direcao = this.heroi.x < this.vilao.x ? -1 : 1;

    if (this.vilaoEsquivando) {
      // a animação de afundar e surgir cuida de tudo
    } else if (this.vilaoBebendo) {
      // bebendo a poção: parado e vulnerável até a animação acabar ou ser interrompida
    } else if (this.vilaoBloqueando) {
      // de braços cruzados: parado até o fim do bloqueio; o pisão vem logo depois
    } else if (this.vilaoAtacando) {
      // o ataque (ou o pulo) já está em andamento: não parar o vilão aqui
    } else if (this.vilaoAnimando) {
      // animação de dano ou de pouso em andamento: não trocar de animação nem andar
    } else if (this.vilaoDesviando) {
      // pulando para desviar de tiro: a animação do pulo cuida de tudo até ele pousar
    } else if (this.vilaoRecuando) {
      // boss da fase 2 recuando: anda para trás até poder lançar a bola (ou ficar encurralado na borda)
      this.atualizarRecuo(delta);
    } else if (this.podeEntrarEmFuria()) {
      this.entrarEmFuria();
    } else if (this.podeBeberPocao()) {
      this.vilaoBeber();
    } else if (this.podeBloquear()) {
      this.vilaoParado();
      this.vilaoBloquear();
    } else if (!this.heroiNoAr && distancia <= this.cfg.distanciaAtaque && this.time.now >= this.vilaoProximoAtaque) {
      this.vilaoParado();
      this.vilaoAtacar();
    } else if (this.podeAtirarBola()) {
      this.vilaoParado();
      this.vilaoAtacar({ nome: 'bola', golpe: this.cfg.golpes.bola });
    } else if (this.podeInvestir()) {
      this.vilaoParado();
      this.vilaoAtacar({ nome: 'investida', golpe: this.cfg.golpes.investida });
    } else if (distancia > this.cfg.distanciaLuta) {
      this.vilao.x += direcao * passo(this.cfg.velocidade * this.multFuria('velocidade'));
      this.vilao.play(this.animacaoAndar(), true);
    } else {
      this.vilaoParado();
    }

    // fúria do lobisomem: o corpo continua vermelho depois dos avisos e dos flashes de dano
    this.manterCorFuria();

    // os dois sempre de frente um para o outro
    if (!this.vilaoAtacando) this.virarVilao(this.heroi.x < this.vilao.x);
    this.heroi.setFlipX(this.vilao.x < this.heroi.x);

    // corpos: no chão, o herói e o vilão não se sobrepõem nem trocam de lado.
    // No ar, acima da altura de passagem, o herói pode cruzar por cima do vilão.
    // Na investida, o lobisomem atravessa o herói: a regra fica desligada até ele parar.
    const margem = this.cfg.margemCorpo || 30;
    const passagem = this.cfg.alturaPassagem || 40;
    const xAntesRegra = this.heroi.x;

    if (this.heroiAltura < passagem && !this.vilaoInvestindo) {
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

// copia os métodos dos arquivos de luta/ para a cena (cada arquivo é uma classe só para agrupar os métodos)
function misturarNaCena(...origens) {
  for (const origem of origens) {
    for (const nome of Object.getOwnPropertyNames(origem.prototype)) {
      if (nome !== 'constructor') CenaLuta.prototype[nome] = origem.prototype[nome];
    }
  }
}

misturarNaCena(LutaHeroi, LutaPocaoHeroi, LutaVilaoGolpes, LutaVilaoDano);

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
  scene: [TelaInicial, TelaNome, MapaCaminho, CenaLuta, RankingFase, Rankings, Final, CutsceneBoss, Bestiario]
});