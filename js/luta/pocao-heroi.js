// Luta: os itens do herói. Pegar: o item que o vilão deixa cair no K.O. (poção na luta 1, soco inglês na luta 2),
// o herói andando até ele, pegando e o jogo esperando o toque para seguir.
// Usar: a poção de cura da luta final (botão perto das munições e a tecla C).
// Os métodos são copiados para a CenaLuta no game.js, então o this é a cena.

// o que cai em cada luta (índice da luta: 0 = a primeira). Luta que não aparece aqui não deixa nada.
//   chao: imagem do item no chão | animacao: animação do herói pegando | brilho: cor do anel no chão
const ITENS_DA_LUTA = {
  0: { chao: 'icone-pocao-chao', animacao: 'heroi-pegar', brilho: 0x4cff6a },              // poção (criatura)
  1: { chao: 'icone-soco-ingles-chao', animacao: 'heroi-pegar-soco', brilho: 0xdfe6ee }    // soco inglês (ogro)
};

const POCAO_DISTANCIA_CORPO = 30;     // px: onde o item cai, contando do corpo, do lado do herói
const POCAO_ALTURA_ARCO = 70;         // px acima do chão: o ponto mais alto do arco
const POCAO_SUBIDA_MS = 350;          // ms: tempo subindo
const POCAO_DESCIDA_MS = 550;         // ms: tempo caindo (ele quica no fim)
const POCAO_DISTANCIA_PEGAR = 24;     // px: a que distância do item o herói para para pegar
const POCAO_VELOCIDADE_ANDAR = 90;    // px por segundo: o herói andando até o item
const POCAO_PAUSA_DEPOIS = 600;       // ms: do fim da animação de pegar até o K.O.
const POCAO_PAUSA_AVISO = 800;        // ms: do K.O. até aparecer o aviso para continuar
const POCAO_AVISO = 'TAP OR ENTER TO CONTINUE';
// const POCAO_PENSAMENTO = 'Hmm... this might come in handy.';   // (desligado) o pensamento do herói, no balão

// usar a poção (animação heroi-beber: 6 quadros a 8 fps = 0,75 s)
const POCAO_USO_QUADRO_CURA = 3;      // a cura sai no quadro 4 (índice 3), quando a garrafa chega à boca
const POCAO_USO_FPS = 8;
const POCAO_USO_TOTAL_MS = 750;       // duração da animação: o botão só libera depois disso
const POCAO_BOTAO = { x: 28, y: 79, r: 18 }; // botão redondo da poção, embaixo do AMMO (mesmo estilo dos botões de toque; o contador xN fica à direita dele)

class LutaPocaoHeroi {
  // carrega as imagens dos itens que ficam no chão (chamado pelo preload da cena de luta)
  carregarItensHeroi() {
    this.load.image('icone-pocao-chao', 'assets/icones/icone_pocao_chao.png');
    this.load.image('icone-soco-ingles-chao', 'assets/icones/icone_soco_ingles_chao.png');
  }

  // o ícone da poção perto das munições, com o contador xN; tocar nele usa a poção (a tecla C também)
  criarBotaoPocao() {
    this.pocoes = this.cfg.pocaoHeroi ? (this.cfg.pocoes || 1) : 0;   // poções por tentativa (voltam se o herói perder e tentar de novo)
    this.heroiBebendo = false;
    this.curaHeroiBrilho = false;     // true durante o brilho verde da poção (a barra de vida lê isto)
    this.curaHeroiPiscaOn = false;
    this.heroiVidaAntesCura = 0;
    this.iconePocao = null;
    this.textoPocao = null;
    if (!this.cfg.pocaoHeroi) return;

    // botão redondo no mesmo estilo dos botões de toque (soco, tiro): fundo verde translúcido, contorno fino e o ícone por cima
    botaoToque(this, POCAO_BOTAO, 0x4cff6a, 'pocao');
    this.iconePocao = this.add.image(POCAO_BOTAO.x, POCAO_BOTAO.y, 'icone-pocao-chao').setDepth(11);
    this.textoPocao = this.add.text(POCAO_BOTAO.x + POCAO_BOTAO.r + 6, POCAO_BOTAO.y - 8, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(21);

    this.atualizarPocoes();
  }

  // mostra xN ao lado do ícone; sem poção, os dois ficam apagados
  atualizarPocoes() {
    if (!this.textoPocao) return;
    this.textoPocao.setText('x' + this.pocoes);
    const gasta = this.pocoes <= 0;
    this.iconePocao.setAlpha(gasta ? 0.3 : 0.9);   // 0.9 como os outros ícones dos botões
    this.textoPocao.setAlpha(gasta ? 0.4 : 1);
  }

  // usa a poção: o herói fica parado e vulnerável bebendo e a cura sai no meio da animação
  usarPocaoHeroi() {
    if (!this.cfg.pocaoHeroi || this.pocoes <= 0) return;
    if (!this.emCombate || this.fimDeJogo || this.heroiMorrendo || this.heroiBebendo) return;
    if (this.heroiNoAr || this.heroiAtacando) return;
    if (this.heroiVida >= VIDA_HEROI) return;   // vida cheia: não gasta a poção

    this.pocoes--;
    this.atualizarPocoes();
    this.heroiBebendo = true;
    this.heroiAtacando = true;     // trava andar, soco e pulo enquanto bebe
    this.heroiAgachado = false;
    this.heroi.play('heroi-beber');
    this.heroi.once('animationcomplete-heroi-beber', () => {
      if (this.heroiMorrendo) return;
      this.heroiAtacando = false;
      this.heroi.setTexture('heroi-andar', 0);
    });

    // a cura sai no meio da animação, mesmo que ele leve um golpe antes
    this.time.delayedCall((POCAO_USO_QUADRO_CURA * 1000) / POCAO_USO_FPS, () => this.curarHeroi());
    // o botão libera depois da animação (se um golpe cortar a animação, a trava solta do mesmo jeito)
    this.time.delayedCall(POCAO_USO_TOTAL_MS, () => { this.heroiBebendo = false; });
  }

  // restaura 100% da vida, sai do modo virada e faz o brilho verde
  curarHeroi() {
    if (this.fimDeJogo || this.heroiMorrendo) return;

    const antes = this.heroiVida;
    this.heroiVida = VIDA_HEROI;
    this.encerrarVirada();
    flutuarTexto(this, this.heroi.x, this.heroi.y - 70, 'HEALED!');
    this.brilhoCuraHeroi(antes);
  }

  // brilho verde da cura do herói: contorno luminoso e piscada verde no sprite, anel no chão e barra de vida piscando
  brilhoCuraHeroi(vidaAntes) {
    // a barra de vida lê estes valores (hud.js)
    this.curaHeroiBrilho = true;
    this.curaHeroiPiscaOn = false;
    this.heroiVidaAntesCura = vidaAntes;
    desenharBarras(this);

    // contorno luminoso em volta do corpo (só no WebGL; sem ele ficam só as piscadas)
    let brilho = null;
    if (this.heroi.postFX) brilho = this.heroi.postFX.addGlow(COR_BRILHO_CURA, 4, 0, false, 0.1, 10);

    // anel verde que se abre no chão e some
    const anel = this.add.graphics().setDepth(14);
    anel.lineStyle(2, COR_BRILHO_CURA, 1);
    anel.strokeEllipse(0, 0, 36, 10);
    anel.setPosition(this.heroi.x, CHAO_Y - 2);
    this.tweens.add({
      targets: anel,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 600,
      onComplete: () => anel.destroy()
    });

    // piscadas: silhueta verde e cor normal se alternam
    this.time.addEvent({
      delay: CURA_PISCA_MS,
      repeat: CURA_PISCADAS - 1,
      callback: () => {
        if (this.fimDeJogo) return;
        this.curaHeroiPiscaOn = !this.curaHeroiPiscaOn;
        if (this.curaHeroiPiscaOn) this.heroi.setTintFill(COR_BRILHO_CURA);
        else this.heroi.clearTint();
        desenharBarras(this);
      }
    });

    // fim do brilho
    this.time.delayedCall((CURA_PISCADAS + 1) * CURA_PISCA_MS, () => {
      this.curaHeroiBrilho = false;
      this.curaHeroiPiscaOn = false;
      if (this.fimDeJogo) return;
      if (brilho && this.heroi.postFX) this.heroi.postFX.remove(brilho);
      this.heroi.clearTint();
      desenharBarras(this);
    });
  }

  // esta luta deixa um item?
  deveDroparItem() {
    return !!ITENS_DA_LUTA[this.fase];
  }

  // depois que o vilão cai: o item cai do corpo, o herói anda até ele, pega e chama aoTerminar (o K.O.)
  cenaItem(aoTerminar) {
    const item = ITENS_DA_LUTA[this.fase];

    // o herói pode estar no meio de um golpe, de um pulo ou de uma animação de dano quando o vilão morre
    this.heroi.removeAllListeners('animationcomplete');   // esses avisos antigos mexeriam na animação de pegar
    this.heroi.stop();
    this.heroi.clearTint();
    this.heroi.setTexture('heroi-andar', 0);
    this.heroiAtacando = false;
    this.heroiNoAr = false;
    this.heroiAltura = 0;
    this.velocidadeY = 0;
    this.heroiAgachado = false;
    this.heroi.y = CHAO_Y;

    // o item sai do corpo e cai do lado do herói, em arco
    const lado = this.heroi.x < this.vilao.x ? -1 : 1;
    const alvoX = Phaser.Math.Clamp(this.vilao.x + lado * POCAO_DISTANCIA_CORPO, 40, 472);
    const objeto = this.add.image(this.vilao.x, CHAO_Y - 45, item.chao).setOrigin(0.5, 1).setDepth(13);

    this.tweens.add({ targets: objeto, x: alvoX, duration: POCAO_SUBIDA_MS + POCAO_DESCIDA_MS, ease: 'Linear' });
    this.tweens.add({
      targets: objeto,
      y: CHAO_Y - POCAO_ALTURA_ARCO,
      duration: POCAO_SUBIDA_MS,
      ease: 'Sine.Out',
      onComplete: () => {
        this.tweens.add({
          targets: objeto,
          y: CHAO_Y - 2,
          duration: POCAO_DESCIDA_MS,
          ease: 'Bounce.Out',
          onComplete: () => this.heroiAndaAteItem(objeto, item, aoTerminar)
        });
      }
    });
  }

  // o item já está no chão: anel brilhando e o herói andando até ele
  heroiAndaAteItem(objeto, item, aoTerminar) {
    const anel = this.add.graphics().setDepth(12);
    anel.lineStyle(2, item.brilho, 1);
    anel.strokeEllipse(0, 0, 26, 8);
    anel.setPosition(objeto.x, CHAO_Y - 1);
    this.tweens.add({ targets: anel, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });

    // o herói para um pouco antes do item, do lado de onde está vindo
    const dir = objeto.x >= this.heroi.x ? 1 : -1;
    const paradaX = objeto.x - dir * POCAO_DISTANCIA_PEGAR;
    const caminho = paradaX - this.heroi.x;
    const chegou = () => this.heroiPegaItem(objeto, anel, item, aoTerminar);

    if (Math.abs(caminho) < 2) {
      chegou();
      return;
    }

    this.heroi.setFlipX(caminho < 0);
    this.heroi.play('heroi-andar', true);
    this.tweens.add({
      targets: this.heroi,
      x: paradaX,
      duration: (Math.abs(caminho) / POCAO_VELOCIDADE_ANDAR) * 1000,
      ease: 'Linear',
      onComplete: chegou
    });
  }

  // o herói chegou: vira para o item e toca a animação de pegar (o item do chão some nesse momento)
  heroiPegaItem(objeto, anel, item, aoTerminar) {
    this.heroi.stop();
    this.heroi.setFlipX(objeto.x < this.heroi.x);

    this.time.delayedCall(150, () => {
      this.heroi.play(item.animacao);

      this.tweens.killTweensOf(anel);
      objeto.destroy();
      anel.destroy();

      // a animação termina com ele de pé, com o item na mão; pouco depois entra o K.O.
      this.heroi.once('animationcomplete-' + item.animacao, () => {
        // (desligado) com o pensamento: o balão aparece, o jogo espera o toque e só então vem o K.O.
        // const balao = this.mostrarPensamento();
        // this.esperarToque(aoTerminar, balao);
        this.time.delayedCall(POCAO_PAUSA_DEPOIS, aoTerminar);
      });
    });
  }

  // (DESLIGADO) balão de pensamento em cima da cabeça do herói (as bolinhas ligam o balão à cabeça).
  // Para ligar de novo: apague o /* e o */ e use as 2 linhas comentadas em heroiPegaItem.
  /*
  mostrarPensamento() {
    const texto = this.add.text(0, 0, POCAO_PENSAMENTO, {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'italic',
      color: '#222222'
    }).setOrigin(0.5);

    const largura = texto.width + 16;
    const altura = texto.height + 12;
    const x = Phaser.Math.Clamp(this.heroi.x, largura / 2 + 8, 512 - largura / 2 - 8);
    const desvio = this.heroi.x - x;   // se o balão foi empurrado para dentro da tela, as bolinhas continuam na cabeça

    const balao = this.add.graphics();
    balao.fillStyle(0xffffff, 1);
    balao.lineStyle(2, 0x000000, 1);
    balao.fillRoundedRect(-largura / 2, -altura, largura, altura, 6);
    balao.strokeRoundedRect(-largura / 2, -altura, largura, altura, 6);
    [[4, 8, 5], [1, 17, 4], [-1, 25, 3]].forEach(([dx, dy, raio]) => {
      balao.fillCircle(desvio + dx, dy, raio);
      balao.strokeCircle(desvio + dx, dy, raio);
    });

    texto.setPosition(0, -altura / 2);
    const conjunto = this.add.container(x, this.heroi.y - 82, [balao, texto]).setDepth(31).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: conjunto, scale: 1, alpha: 1, duration: 250, ease: 'Back.Out' });
    return conjunto;
  }
  */

  // aviso para continuar: aparece um instante depois e o toque (ou Enter) chama aoTerminar.
  // O toque só vale depois de um instante, para um toque solto não pular a cena.
  // balao (opcional): se vier, sai de cena junto com o aviso.
  esperarToque(aoTerminar, balao = null) {
    this.time.delayedCall(POCAO_PAUSA_AVISO, () => {
      const aviso = this.add.text(256, 130, POCAO_AVISO, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(31);
      this.tweens.add({ targets: aviso, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

      let seguiu = false;
      const continuar = () => {
        if (seguiu) return;
        seguiu = true;
        this.input.off('pointerdown', continuar);
        this.input.keyboard.off('keydown-ENTER', continuar);

        this.tweens.killTweensOf(aviso);
        aviso.destroy();
        if (balao) balao.destroy();
        aoTerminar();
      };

      this.time.delayedCall(300, () => {
        this.input.on('pointerdown', continuar);
        this.input.keyboard.on('keydown-ENTER', continuar);
      });
    });
  }
}