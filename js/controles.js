// Botões de toque na tela (esquerda, direita, soco e pulo).
// Os botões preenchem cena.toque, que o game.js lê a cada quadro.

// desenha um ícone em pixels a partir de uma grade de texto ('#' = pixel aceso)
function desenharIcone(cena, grade, cx, cy, tamanho) {
  const g = cena.add.graphics().setDepth(11);
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

function criarControlesDeToque(cena) {
  cena.input.addPointer(2); // permite tocar em mais de um botão ao mesmo tempo
  cena.toque = { esquerda: false, direita: false, soco: false, pulo: false };

  const botao = (x, y, direcao) => {
    const d = direcao === 'esquerda' ? -1 : 1;

    const g = cena.add.graphics().setDepth(10);
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(x, y, 22);
    g.fillStyle(0xffffff, 0.6);
    g.fillTriangle(x - 9 * d, y - 10, x - 9 * d, y + 10, x + 9 * d, y);

    const zona = cena.add.zone(x, y, 56, 56).setInteractive().setDepth(11);
    zona.on('pointerdown', () => { cena.toque[direcao] = true; });
    zona.on('pointerup', () => { cena.toque[direcao] = false; });
    zona.on('pointerout', () => { cena.toque[direcao] = false; });
  };

  botao(36, 192, 'esquerda');
  botao(96, 192, 'direita');

  // botão de soco, no canto direito: mostra o herói com o braço esticado
  const sx = 476;
  const sy = 192;
  const g = cena.add.graphics().setDepth(10);
  g.fillStyle(0xff8a00, 0.35);
  g.fillCircle(sx, sy, 24);
  // o herói não fica no centro do quadro 3, então o ícone é deslocado para centralizar no botão
  cena.add.image(sx - 2.6, sy - 3.9, 'heroi-soco', 3).setScale(1.3).setDepth(11).setAlpha(0.95);

  const zonaSoco = cena.add.zone(sx, sy, 60, 60).setInteractive().setDepth(12);
  zonaSoco.on('pointerdown', () => { cena.toque.soco = true; });

  // botão de pulo, ao lado do soco: seta para cima
  const px = 418;
  const gp = cena.add.graphics().setDepth(10);
  gp.fillStyle(0xffffff, 0.25);
  gp.fillCircle(px, sy, 24);
  desenharIcone(cena, SETA_CIMA, px, sy, 3);

  const zonaPulo = cena.add.zone(px, sy, 60, 60).setInteractive().setDepth(12);
  zonaPulo.on('pointerdown', () => { cena.toque.pulo = true; });
}