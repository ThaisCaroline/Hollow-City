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

    // no modo virada, a barra do herói pisca em vermelho; durante o brilho da poção do herói, pisca em verde
  let corHeroi = cena.emVirada && cena.piscaOn ? 0xff3030 : 0xffd23f;
  if (cena.curaHeroiBrilho && cena.curaHeroiPiscaOn) corHeroi = COR_CURA;
  g.fillStyle(corHeroi, 1);
  g.fillRect(xHeroi, y, vidaHeroi, altura);

  if (cena.curaHeroiBrilho) {
    // o pedaço recuperado (a ponta direita da barra) fica em verde claro, com a borda verde acesa
    const antes = larguraHeroi * (Math.min(cena.heroiVidaAntesCura, cena.heroiVida) / VIDA_HEROI);
    const curado = vidaHeroi - antes;
    if (curado > 0) {
      g.fillStyle(COR_CURA_CLARA, 1);
      g.fillRect(xHeroi + antes, y, curado, altura);
    }
    g.lineStyle(1, COR_CURA, 1);
    g.strokeRect(xHeroi - 1, y - 1, larguraHeroi + 2, altura + 2);
  }

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

// tela de fim: título, subtítulo e botões. PLAY AGAIN maior, no centro; embaixo, BACK TO MAP e TOO HARD? bem separados,
// dentro da zona livre da tela (os botões de toque ficam nos cantos, então nada de botão colado neles)
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

  // botão de texto com área de toque maior que o desenho (margem invisível de "folga" em volta), para o dedo errar menos
  const criarBotao = (x, y, rotulo, tamanho, padding, folga) => {
    const botao = cena.add.text(x, y, rotulo, {
      fontFamily: 'monospace',
      fontSize: tamanho,
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: padding
    }).setOrigin(0.5).setDepth(30);
    botao.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-folga, -folga, botao.width + folga * 2, botao.height + folga * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });
    return botao;
  };

  // botões aparecem depois: PLAY AGAIN em cima, os outros dois embaixo
  cena.time.delayedCall(900, () => {
    const botaoJogar = criarBotao(256, 128, 'PLAY AGAIN', '18px', { x: 14, y: 8 }, 10);
    const botaoMapa = criarBotao(185, 182, 'BACK TO MAP', '12px', { x: 8, y: 7 }, 8);
    const botaoDesistir = criarBotao(327, 182, 'TOO HARD?', '12px', { x: 8, y: 7 }, 8);

    cena.tweens.add({ targets: botaoJogar, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

    let saindo = false;   // evita dois toques seguidos dispararem duas saídas

    // jogar de novo: reinicia na mesma luta; se o herói morreu numa fase que pede para recomeçar nela mesma (a fase 2 do boss), volta nela
    const jogarDeNovo = () => {
      if (saindo) return;
      saindo = true;
      cena.scene.restart({ fase: cena.fase, cfg: cena.cfg.recomecarAqui ? cena.cfg : null });
    };
    botaoJogar.on('pointerdown', jogarDeNovo);
    cena.input.keyboard.once('keydown-ENTER', jogarDeNovo);

    // voltar ao mapa: a luta atual continua como próxima no caminho
    const voltarMapa = () => {
      if (saindo) return;
      saindo = true;
      cena.scene.start('Mapa', { fase: cena.fase });
    };
    botaoMapa.on('pointerdown', voltarMapa);
    cena.input.keyboard.once('keydown-ESC', voltarMapa);

    // TOO HARD?: desiste desta luta e segue para a próxima no mapa. A luta fica como CLICK TO ENTER (ainda por vencer)
    // e a run sai do FULL RUN (runId zerado; os tempos seguintes continuam entrando no ranking de cada luta).
    // Em luta já vencida (replay) ou já pulada, só volta ao mapa, igual ao BACK TO MAP
    const desistir = () => {
      if (saindo) return;
      saindo = true;

      const jogo = cena.game;
      if (cena.fase >= (jogo.progresso || 0)) {
        jogo.desistidas = jogo.desistidas || {};
        jogo.desistidas[cena.fase] = true;
        jogo.progresso = cena.fase + 1;
        jogo.runId = null;
      }
      cena.scene.start('Mapa', { fase: jogo.progresso || 0 });
    };
    botaoDesistir.on('pointerdown', desistir);
  });
}

// cronômetro da luta no formato 00:00.00 (minutos, segundos e centésimos)
function formatarCronometro(ms) {
  const total = ms / 1000;
  const min = Math.floor(total / 60);
  const seg = (total - min * 60).toFixed(2).padStart(5, '0');
  return `${String(min).padStart(2, '0')}:${seg}`;
}

// as listas do ranking: espaço entre as linhas e a reserva (6 espaços) que cada linha deixa entre o nome e o tempo para o carimbo PERFECT
const RANKING_ESPACO = 6;
const RANKING_RESERVA = ' '.repeat(7);

// carimbo PERFECT: a palavra amarela, dentro de uma borda, inclinada e piscando, ao lado do nome de cada linha marcada de uma lista
// (cada linha do Text é uma posição do ranking; o nome ocupa os caracteres 4 a 11 e o carimbo fica na reserva logo depois, nos caracteres 12 a 18).

// carimbo PERFECT: a palavra amarela, dentro de uma borda, inclinada e piscando, no meio do espaço entre o fim do nome e o começo do tempo
// (cada linha do Text é uma posição do ranking; o nome começa no caractere 4 e o tempo, depois da reserva, no caractere 20).
// linhas: [{ texto, perfect }], na mesma ordem das linhas do Text; fontSize e lineSpacing: os mesmos da lista, para medir a largura e a altura da linha.
// Devolve os carimbos criados, para quem chamou poder apagá-los quando a lista mudar
function selosPerfect(cena, texto, linhas, fontSize, lineSpacing) {
  const selos = [];
  if (!linhas.some((l) => l.perfect)) return selos;

  // mede com textos de verdade (a fonte é monospace); medir várias letras de uma vez evita o erro de arredondamento de medir uma só
  const medir = (conteudo) => {
    const t = cena.add.text(0, 0, conteudo, { fontFamily: 'monospace', fontSize, lineSpacing });
    const medidas = { largura: t.width, altura: t.height };
    t.destroy();
    return medidas;
  };
  const alturaLinha = medir('M').altura;
  const passo = medir('M\nM').altura - alturaLinha;
  const colunas = 13 + RANKING_RESERVA.length;                    // "01. " + nome (8) + espaço + reserva: aqui começa o tempo
  const larguraChar = medir('M'.repeat(colunas)).largura / colunas;
  const inicioDoTempo = colunas * larguraChar;

  linhas.forEach((linha, i) => {
    if (!linha.perfect) return;

    // o nome de verdade, sem os espaços do fim: o carimbo fica no meio entre o fim dele e o começo do tempo
    const nome = linha.texto.slice(4, 12).trimEnd();
    const fimDoNome = (4 + nome.length) * larguraChar;
    const vao = inicioDoTempo - fimDoNome;

    const carimbo = cena.add.container(texto.x + (fimDoNome + inicioDoTempo) / 2, texto.y + i * passo + alturaLinha / 2).setAngle(-8).setDepth(5);

    const palavra = cena.add.text(0, 0, 'PERFECT', {
      fontFamily: 'monospace',
      fontSize: '6px',
      fontStyle: 'bold',
      color: '#ffd23f',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    const borda = cena.add.graphics();
    borda.lineStyle(1, 0xffd23f, 1);
    borda.strokeRect(-palavra.width / 2 - 2, -palavra.height / 2 - 1, palavra.width + 4, palavra.height + 2);

    carimbo.add([borda, palavra]);

    // se o carimbo for maior que o espaço, encolhe para caber sem encostar no nome nem no tempo
    const larguraCarimbo = palavra.width + 4;
    if (larguraCarimbo > vao - 3) carimbo.setScale((vao - 3) / larguraCarimbo);

    cena.tweens.add({ targets: carimbo, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
    selos.push(carimbo);
  });

  return selos;
}