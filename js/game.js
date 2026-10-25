// A cena de luta: herói, vilão e o loop principal.
// Constantes ficam em config.js; cores em recolor.js; barras e textos em hud.js; botões em controles.js; sons em audio.js; diálogos em dialogo.js.
// O herói fica em luta/heroi.js; os itens que o herói pega e usa (poção, soco inglês) em luta/pocao-heroi.js; a entrada, os diálogos e o começo do combate em luta/entrada.js; os golpes, a bola de fogo, o bloqueio e a esquiva do vilão em luta/vilao-golpes.js; o dano, a poção e o K.O. do vilão em luta/vilao-dano.js.
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
    
    // o cenário fica atrás de tudo; os fantasmas ficam entre o cenário e os lutadores (ver luta/fantasmas.js)
    this.fundo.setDepth(-10);

    // garante o estado normal ao reiniciar a luta
    this.anims.globalTimeScale = 1;
    this.cameras.main.setZoom(1);

    // música de fundo: a fase pode pedir outra velocidade (a fase 2 do boss); ao sair da luta, volta ao normal
    mudarVelocidadeMusica(this, this.cfg.musicaVelocidade || 1);
    this.events.once('shutdown', () => mudarVelocidadeMusica(this, 1));

    // cores e animações do vilão ficam na configuração da fase
    this.cfg.preparar(this);

    // animações do herói (luta/heroi.js)
    this.criarAnimacoesHeroi();

    // fantasmas da fase (a bruxa): criados antes do herói e do vilão, para ficarem atrás dos dois
    this.criarFantasmas();

    // a entrada do herói e os diálogos acontecem na primeira vez que cada fase é jogada
    const jaVista = (this.game.fasesVistas || {})[this.fase];
    const comEntrada = !jaVista && !this.cfg.semEntrada;

    this.heroi = this.add.sprite(comEntrada ? 40 : (this.cfg.inicioHeroi || 150), CHAO_Y, 'heroi-andar').setOrigin(0.5, HEROI_ORIGEM_Y).setScale(2);
    this.heroi.setFrame(0);
    this.iniciarEstadoHeroi();   // flags, vida, munição e tiros do herói (luta/heroi.js)

    this.vilao = this.add.sprite(this.cfg.inicioVilao || 360, CHAO_Y + (this.cfg.descerVilao || 0), this.cfg.texturas.parado).setOrigin(0.5, 1).setScale(this.cfg.escala);
    this.vilao.setFrame(0);
    this.vilao.setVisible(!comEntrada);

    // cada animação pode vir de um sheet com tamanho de quadro diferente: acerta a origem para os pés ficarem no chão
    this.vilao.on('animationstart', (anim, frame) => this.ajustarOrigemVilao(frame.textureKey));
    this.ajustarOrigemVilao(this.cfg.texturas.parado);

    this.iniciarEstadoVilao();    // golpes e movimento do vilão (luta/vilao-golpes.js)
    this.iniciarEstadoDano();     // vida, fúria e poção do vilão (luta/vilao-dano.js)
    this.iniciarEstadoEntrada(comEntrada);   // entrada e diálogos (luta/entrada.js)
    this.fimDeJogo = false;

    this.teclas = this.input.keyboard.createCursorKeys();
    this.teclaSoco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.teclaPulo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.teclaTiro = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.teclaPocao = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    criarControlesDeToque(this);
    this.criarBotaoPocao();   // o ícone da poção perto das munições (só nas lutas que dão a poção ao herói)

    if (!comEntrada) this.comecarCombate();
  }

  // ---------- loop principal ----------

  update(tempo, delta) {
    this.atualizarFantasmas(delta);   // giram e flutuam também durante a entrada e os diálogos

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

    // vilão: pulo, investida, decisão e movimento (luta/vilao-golpes.js)
    if (!this.atualizarVilao(delta)) return;

    // herói de frente para o vilão, regra de corpo e limites da tela (luta/heroi.js)
    this.ajustarCorpos();
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

misturarNaCena(LutaHeroi, LutaPocaoHeroi, LutaVilaoGolpes, LutaVilaoDano, LutaFantasmas, LutaEntrada);

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
  scene: [TelaInicial, TelaNome, MapaCaminho, CenaLuta, RankingFase, Rankings, Final, CutsceneBoss, Bestiario, Abertura]
});