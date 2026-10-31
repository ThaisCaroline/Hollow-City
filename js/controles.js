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
  soco: { x: 482, y: 185, r: 24 },   // ataque padrão, o maior
  dash: { x: 366, y: 190, r: 14 }    // dash (todas as fases), à esquerda do agachar
};

// dash: duas setas para a frente ('#' = pixel aceso)
const SETA_DASH = [
  "#...#....",
  ".#...#...",
  "..#...#..",
  "...#...#.",
  "..#...#..",
  ".#...#...",
  "#...#...."
];

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
  cena.toque = { esquerda: false, direita: false, soco: false, pulo: false, agachar: false, tiro: false, dash: false };

  // no computador joga-se pelo teclado: os botões de toque nem aparecem (o mesmo critério da legenda da tela inicial)
  if (cena.sys.game.device.os.desktop) return;

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

  // dash (todas as fases)
  botaoToque(cena, BOTAO.dash, 0x2ec4d6, 'dash');
  desenharIcone(cena, SETA_DASH, BOTAO.dash.x, BOTAO.dash.y, 2);

  // soco: ataque padrão, sempre o maior; com o soco inglês (luta 3 em diante) o ícone vira a mão com o soco inglês
  botaoToque(cena, BOTAO.soco, 0xff8a00, 'soco');
  const iconeSoco = cena.temSocoIngles && cena.temSocoIngles() ? 'icone-soco-ingles' : 'icone-soco';
  cena.add.image(BOTAO.soco.x, BOTAO.soco.y, iconeSoco).setDepth(11).setAlpha(0.9);
  // tiro: ataque especial, menor, da luta 2 em diante; com as balas de prata (luta 4) o ícone vira a arma prateada
  if (cena.cfg.tiro) {
    botaoToque(cena, BOTAO.tiro, 0xffd23f, 'tiro');
    const iconeTiro = cena.temBalasPrata && cena.temBalasPrata() ? 'icone-tiro-prata' : 'icone-tiro';
    cena.add.image(BOTAO.tiro.x, BOTAO.tiro.y, iconeTiro).setDepth(11).setAlpha(0.9);
  }
}