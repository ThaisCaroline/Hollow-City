// Luta: dano no vilão, animação de dano, poção de cura da criatura e derrota do vilão (K.O.).
// Os métodos são copiados para a CenaLuta no game.js, então o this é a cena.

// brilho verde da poção (só quando ela termina de beber)
const COR_BRILHO_CURA = 0x4cff6a;
const CURA_PISCA_MS = 120;            // tempo de cada piscada
const CURA_PISCADAS = 8;              // mudanças de cor no brilho (~1 s)

class LutaVilaoDano {
  causarDano() {
    // no modo virada, o soco tira mais vida do vilão; o soco inglês aumenta os dois (valores em luta/heroi.js)
    const ingles = this.temSocoIngles();
    const normal = ingles ? DANO_SOCO_INGLES : DANO_SOCO;
    const virada = ingles ? DANO_SOCO_INGLES_VIRADA : DANO_SOCO_VIRADA;
    const dano = this.emVirada ? virada : normal;
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
    if (this.vilaoAtacando || this.vilaoEsquivando || this.vilaoNoAr || this.vilaoAnimando || this.vilaoBebendo || this.vilaoBloqueando) return;
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

  derrotaDoVilao() {
    // o boss tem duas fases: quando a vida da primeira zera, ele cai, levanta e vira a segunda (fases/fase-boss.js).
    // Só a vida da segunda fase termina a luta de verdade
    if (this.cfg.transicao) {
      this.cfg.transicao(this);
      return;
    }

    this.fimDeJogo = true;
    this.vilaoBebendo = false;
    this.vilaoBloqueando = false;
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
    this.limparBolas();

    // se o vilão estava no ar (pisão), ele cai antes da animação de morte
    this.vilaoNoAr = false;
    this.vilao.y = CHAO_Y + (this.cfg.descerVilao || 0);

    // impacto: flash, tremor, câmera lenta e zoom no vilão
    const cam = this.cameras.main;
    cam.flash(300, 255, 255, 255);
    cam.shake(400, 0.012);
    this.anims.globalTimeScale = 0.5;
    cam.zoomTo(1.5, 500);
    cam.pan(Phaser.Math.Clamp(this.vilao.x, 171, 341), 148, 500);

    const mostrarKO = () => {
      tocarSom(this, 'ko');

      // sem ter levado nenhum dano na luta: o K.O. sobe um pouco e o PERFECT! aparece embaixo dele
      const perfeito = !this.heroiLevouDano;
      this.add.text(256, perfeito ? 76 : 90, 'K.O.!!!!', {
        fontFamily: 'monospace',
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ff8a00',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(30);

      if (perfeito) {
        this.add.text(256, 116, 'PERFECT!', {
          fontFamily: 'monospace',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffd23f',
          stroke: '#000000',
          strokeThickness: 5
        }).setOrigin(0.5).setDepth(30);
      }

      const irParaRanking = () => this.scene.start('RankingFase', { fase: this.fase, tempo: this.tempoLuta, perfeito: perfeito });

      // nas lutas que deixam um item (poção, soco inglês) o ranking só entra quando o jogador toca; nas outras, 2 s depois
      if (this.deveDroparItem()) this.esperarToque(irParaRanking);
      else this.time.delayedCall(2000, irParaRanking);
    };

    // antes do K.O.: algumas lutas deixam um item (poção, soco inglês) e o herói o pega (luta/pocao-heroi.js)
    const antesDoKO = () => {
      if (this.deveDroparItem()) this.cenaItem(mostrarKO);
      else mostrarKO();
    };

    // se a fase tiver fala de derrota, o vilão fala antes
    const depoisDaQueda = () => {
      this.anims.globalTimeScale = 1;
      cam.zoomTo(1, 400);
      cam.pan(256, 112, 400);

      this.time.delayedCall(450, () => {
        if (this.cfg.dialogoDerrota) {
          mostrarDialogo(this, this.cfg.nome, this.cfg.dialogoDerrota, antesDoKO, this.cfg.retrato);
        } else {
          antesDoKO();
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
}