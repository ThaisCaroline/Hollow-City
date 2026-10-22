// Barras de vida, textos flutuantes e tela de fim de jogo.
// Todas as funções recebem a cena (cena) como primeiro parâmetro.

// cores do brilho de cura (poção)
const COR_CURA = 0x4cff6a;         // verde da poção
const COR_CURA_CLARA = 0xb6ffc4;   // verde claro, para o pedaço de vida recuperado

function criarBarrasDeVida(cena) {
  cena.barras = cena.add.graphics().setDepth(20);

  const estilo = { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' };
  const larguraVilao = cena.cfg.barraLargura || 180;
  cena.add.text(12, 22, 'HERO', estilo).setDepth(21);
  cena.add.text(512 - 12 - larguraVilao, 22, cena.cfg.rotuloVilao, estilo).setDepth(21);

  desenharBarras(cena);
}

function desenharBarras(cena) {
  const altura = 10;
  const y = 8;
  const larguraHeroi = 120;
  const larguraVilao = cena.cfg.barraLargura || 180;
  const xHeroi = 12;
  const xVilao = 512 - 12 - larguraVilao;

  const g = cena.barras;
  g.clear();

  // fundo e borda
  g.fillStyle(0x000000, 0.7);
  g.fillRect(xHeroi - 2, y - 2, larguraHeroi + 4, altura + 4);
  g.fillRect(xVilao - 2, y - 2, larguraVilao + 4, altura + 4);
  g.fillStyle(0x4a1010, 1);
  g.fillRect(xHeroi, y, larguraHeroi, altura);
  g.fillRect(xVilao, y, larguraVilao, altura);

  // vida atual de cada lado
  const vidaHeroi = larguraHeroi * (cena.heroiVida / VIDA_HEROI);
  const vidaVilao = larguraVilao * (cena.vilaoVida / cena.vilaoVidaMax);

  // no modo virada, a barra do herói pisca em vermelho
  const corHeroi = cena.emVirada && cena.piscaOn ? 0xff3030 : 0xffd23f;
  g.fillStyle(corHeroi, 1);
  g.fillRect(xHeroi, y, vidaHeroi, altura);

  // barra do vilão; durante o brilho da poção ela pisca em verde
  const curando = !!cena.curaBrilho;
  const corVilao = curando && cena.curaPiscaOn ? COR_CURA : 0xffd23f;
  g.fillStyle(corVilao, 1);
  g.fillRect(xVilao + (larguraVilao - vidaVilao), y, vidaVilao, altura);

  if (curando) {
    // o pedaço recuperado (a ponta esquerda da barra) fica em verde claro
    const antes = larguraVilao * (Math.min(cena.vilaoVidaAntesCura, cena.vilaoVida) / cena.vilaoVidaMax);
    const curado = vidaVilao - antes;
    if (curado > 0) {
      g.fillStyle(COR_CURA_CLARA, 1);
      g.fillRect(xVilao + (larguraVilao - vidaVilao), y, curado, altura);
    }

    // borda verde acesa
    g.lineStyle(1, COR_CURA, 1);
    g.strokeRect(xVilao - 1, y - 1, larguraVilao + 2, altura + 2);
  }
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

// tela de fim: título, subtítulo e botões para jogar de novo ou voltar ao mapa
function mostrarFim(cena, titulo, subtitulo, cor) {
  // o título "cai" na tela, grande, e treme a câmera ao bater
  const texto = cena.add.text(256, 70, titulo, {
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
    const sub = cena.add.text(256, 102, subtitulo, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    cena.tweens.add({ targets: sub, alpha: 1, delay: 500, duration: 400 });
  }

  // botões aparecem depois, um abaixo do outro
  cena.time.delayedCall(900, () => {
    const botaoJogar = cena.add.text(256, 135, 'PLAY AGAIN', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });

    const botaoMapa = cena.add.text(256, 165, 'BACK TO MAP', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });

    cena.tweens.add({ targets: botaoJogar, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

    // jogar de novo: reinicia na mesma luta
    const jogarDeNovo = () => cena.scene.restart({ fase: cena.fase });
    botaoJogar.on('pointerdown', jogarDeNovo);
    cena.input.keyboard.once('keydown-ENTER', jogarDeNovo);

    // voltar ao mapa: a luta atual continua como próxima no caminho
    const voltarMapa = () => cena.scene.start('Mapa', { fase: cena.fase });
    botaoMapa.on('pointerdown', voltarMapa);
    cena.input.keyboard.once('keydown-ESC', voltarMapa);
  });
}

// cronômetro da luta no formato 00:00.00 (minutos, segundos e centésimos)
function formatarCronometro(ms) {
  const total = ms / 1000;
  const min = Math.floor(total / 60);
  const seg = (total - min * 60).toFixed(2).padStart(5, '0');
  return `${String(min).padStart(2, '0')}:${seg}`;
}