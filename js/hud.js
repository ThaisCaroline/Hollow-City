// Barras de vida, textos flutuantes e tela de fim de jogo.
// Todas as funções recebem a cena (cena) como primeiro parâmetro.

function criarBarrasDeVida(cena) {
  cena.barras = cena.add.graphics().setDepth(20);

  const estilo = { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' };
  cena.add.text(12, 22, 'HERO', estilo).setDepth(21);
  cena.add.text(500, 22, 'VILLAIN', estilo).setOrigin(1, 0).setDepth(21);

  desenharBarras(cena);
}

function desenharBarras(cena) {
  const largura = 180;
  const altura = 10;
  const y = 8;
  const xHeroi = 12;
  const xVilao = 512 - 12 - largura;

  const g = cena.barras;
  g.clear();

  // fundo e borda
  g.fillStyle(0x000000, 0.7);
  g.fillRect(xHeroi - 2, y - 2, largura + 4, altura + 4);
  g.fillRect(xVilao - 2, y - 2, largura + 4, altura + 4);
  g.fillStyle(0x4a1010, 1);
  g.fillRect(xHeroi, y, largura, altura);
  g.fillRect(xVilao, y, largura, altura);

  // vida atual: a do herói esvazia da direita para a esquerda, a do vilão ao contrário
  const larguraHeroi = largura * (cena.heroiVida / VIDA_HEROI);
  const larguraVilao = largura * (cena.vilaoVida / VIDA_VILAO);

  // no modo virada, a barra do herói pisca em vermelho
  const corHeroi = cena.emVirada && cena.piscaOn ? 0xff3030 : 0xffd23f;
  g.fillStyle(corHeroi, 1);
  g.fillRect(xHeroi, y, larguraHeroi, altura);

  g.fillStyle(0xffd23f, 1);
  g.fillRect(xVilao + (largura - larguraVilao), y, larguraVilao, altura);
}

// texto que sobe e some (DODGE!, MISS...)
function flutuarTexto(cena, x, y, conteudo) {
  const texto = cena.add.text(x, y, conteudo, {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5).setDepth(25);

  cena.tweens.add({
    targets: texto,
    y: texto.y - 16,
    alpha: 0,
    duration: 600,
    onComplete: () => texto.destroy()
  });
}

// tela de fim: título, subtítulo e botão de jogar de novo
function mostrarFim(cena, titulo, subtitulo, cor) {
  // o título "cai" na tela, grande, e treme a câmera ao bater
  const texto = cena.add.text(256, 80, titulo, {
    fontFamily: 'monospace',
    fontSize: '44px',
    fontStyle: 'bold',
    color: cor,
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(30).setScale(5).setAlpha(0);

  cena.tweens.add({
    targets: texto,
    scale: 1,
    alpha: 1,
    duration: 350,
    ease: 'Cubic.In',
    onComplete: () => cena.cameras.main.shake(200, 0.01)
  });

  if (subtitulo) {
    const sub = cena.add.text(256, 112, subtitulo, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    cena.tweens.add({ targets: sub, alpha: 1, delay: 500, duration: 400 });
  }

  // botão de jogar de novo aparece depois, piscando
  cena.time.delayedCall(900, () => {
    const botao = cena.add.text(256, 145, 'PLAY AGAIN', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(30).setInteractive();

    cena.tweens.add({ targets: botao, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

    // reinicia na mesma luta, e não volta sempre para a primeira
    botao.on('pointerdown', () => cena.scene.restart({ fase: cena.fase }));
    cena.input.keyboard.once('keydown-ENTER', () => cena.scene.restart({ fase: cena.fase }));
  });
}