// Botões de toque no estilo teclado e Free Fire.
// Setas de movimento no canto inferior esquerdo; no canto inferior direito, cima e baixo com os ataques.
// A seta para cima (SETA_CIMA) vem do config.js.

const BOTAO = {
  // setas de movimento (lado esquerdo)
  esquerda: { x: 36, y: 190, r: 15 },
  direita: { x: 104, y: 190, r: 15 },

  // lado direito: cima e baixo maiores, tiro menor e soco o maior
  cima: { x: 425, y: 125, r: 20 },   // pulo (todas as fases)
  baixo: { x: 425, y: 180, r: 20 },  // agachar (só luta 2)
  tiro: { x: 470, y: 125, r: 17 },   // ataque especial (só luta 2)
  soco: { x: 482, y: 185, r: 24 }    // ataque padrão, o maior
};

// seta para baixo ('#' = pixel aceso)
const SETA_BAIXO = [
  "....###....",
  "....###....",
  "....###....",
  "..#######..",
  "...#####...",
  "....###....",
  ".....#....."
];

// desenha um ícone em pixels a partir de uma grade de texto ('#' = pixel aceso)
function desenharIcone(cena, grade, cx, cy, tamanho) {
  const g = cena.add.graphics().setDepth(11);
  g.fillStyle(0xffffff, 0.75);
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

// triângulo de seta para os botões de andar
function setaLateral(cena, x, y, direcao) {
  const d = direcao === 'esquerda' ? -1 : 1;
  const g = cena.add.graphics().setDepth(11);
  g.fillStyle(0xffffff, 0.7);
  g.fillTriangle(x - 5 * d, y - 7, x - 5 * d, y + 7, x + 6 * d, y);
}

// pistola em pixels, centrada em (cx, cy)
function desenharArma(cena, cx, cy) {
  const g = cena.add.graphics().setDepth(11);
  const x0 = cx - 8;
  const y0 = cy - 6;
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(x0, y0, 16, 4);       // cano
  g.fillRect(x0, y0 + 4, 9, 3);    // corpo
  g.fillRect(x0, y0 + 7, 4, 5);    // cabo
}

// desenha o fundo redondo do botão e devolve a área de toque
function desenharBotao(cena, pos, cor) {
  const g = cena.add.graphics().setDepth(10);
  g.fillStyle(cor, 0.28);
  g.fillCircle(pos.x, pos.y, pos.r);
  g.lineStyle(1, 0xffffff, 0.35);
  g.strokeCircle(pos.x, pos.y, pos.r);
  return cena.add.zone(pos.x, pos.y, pos.r * 2 + 24, pos.r * 2 + 24).setInteractive().setDepth(12);
}

// botão que só vale enquanto está pressionado (andar, agachar)
function botaoSegurar(cena, pos, cor, chave) {
  const zona = desenharBotao(cena, pos, cor);
  zona.on('pointerdown', () => { cena.toque[chave] = true; });
  zona.on('pointerup', () => { cena.toque[chave] = false; });
  zona.on('pointerout', () => { cena.toque[chave] = false; });
}

// botão de um toque (soco, pulo, tiro): cada toque vale uma ação
function botaoToque(cena, pos, cor, chave) {
  const zona = desenharBotao(cena, pos, cor);
  zona.on('pointerdown', () => { cena.toque[chave] = true; });
}

function criarControlesDeToque(cena) {
  cena.input.addPointer(2); // permite tocar em mais de um botão ao mesmo tempo
  cena.toque = { esquerda: false, direita: false, soco: false, pulo: false, agachar: false, tiro: false };

  // movimento (lado esquerdo)
  botaoSegurar(cena, BOTAO.esquerda, 0x444444, 'esquerda');
  setaLateral(cena, BOTAO.esquerda.x, BOTAO.esquerda.y, 'esquerda');

  botaoSegurar(cena, BOTAO.direita, 0x444444, 'direita');
  setaLateral(cena, BOTAO.direita.x, BOTAO.direita.y, 'direita');

  // lado direito: cima = pulo (todas as fases)
  botaoToque(cena, BOTAO.cima, 0xffffff, 'pulo');
  desenharIcone(cena, SETA_CIMA, BOTAO.cima.x, BOTAO.cima.y, 2);

  // lado direito: baixo = agachar (só luta 2)
  if (cena.cfg.agachar) {
    botaoSegurar(cena, BOTAO.baixo, 0x3a7bd5, 'agachar');
    desenharIcone(cena, SETA_BAIXO, BOTAO.baixo.x, BOTAO.baixo.y, 2);
  }

  // soco: ataque padrão, sempre o maior
  botaoToque(cena, BOTAO.soco, 0xff8a00, 'soco');
  cena.add.image(BOTAO.soco.x, BOTAO.soco.y, 'heroi-soco', 3).setScale(1.2).setDepth(11).setAlpha(0.85);

  // tiro: ataque especial, menor, só na luta 2
  if (cena.cfg.tiro) {
    botaoToque(cena, BOTAO.tiro, 0xffd23f, 'tiro');
    desenharArma(cena, BOTAO.tiro.x, BOTAO.tiro.y);
  }
}