// Botões de toque no estilo teclado e Free Fire.
// Cruz de movimento no canto inferior esquerdo (cima = pulo, baixo = agachar), ações no canto inferior direito.
// A seta para cima (SETA_CIMA) vem do config.js.

// posições (em pixels da tela de 512 x 224)
const BOTAO = {
  // cruz de movimento, igual às setas do teclado
  cima: { x: 70, y: 152, r: 15 },      // pulo
  esquerda: { x: 36, y: 190, r: 15 },
  baixo: { x: 70, y: 190, r: 15 },     // agachar (só na luta 2)
  direita: { x: 104, y: 190, r: 15 },

  // ações
  principal: { x: 474, y: 188, r: 22 }, // tiro na luta 2, soco na luta 1
  soco: { x: 424, y: 198, r: 15 }       // soco secundário, só na luta 2
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

// desenha o fundo do botão. Se não estiver ativo, fica apagado e sem toque.
function desenharBotao(cena, pos, cor, ativo = true) {
  const g = cena.add.graphics().setDepth(10);
  g.fillStyle(cor, ativo ? 0.28 : 0.1);
  g.fillCircle(pos.x, pos.y, pos.r);
  g.lineStyle(1, 0xffffff, ativo ? 0.35 : 0.12);
  g.strokeCircle(pos.x, pos.y, pos.r);
  if (!ativo) return null;
  return cena.add.zone(pos.x, pos.y, pos.r * 2 + 8, pos.r * 2 + 8).setInteractive().setDepth(12);
}

// botão que só vale enquanto está pressionado (andar, agachar)
function botaoSegurar(cena, pos, cor, chave, ativo = true) {
  const zona = desenharBotao(cena, pos, cor, ativo);
  if (!zona) return;
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

  // cruz de movimento
  botaoSegurar(cena, BOTAO.esquerda, 0x444444, 'esquerda');
  setaLateral(cena, BOTAO.esquerda.x, BOTAO.esquerda.y, 'esquerda');

  botaoSegurar(cena, BOTAO.direita, 0x444444, 'direita');
  setaLateral(cena, BOTAO.direita.x, BOTAO.direita.y, 'direita');

  // cima = pulo
  botaoToque(cena, BOTAO.cima, 0xffffff, 'pulo');
  desenharIcone(cena, SETA_CIMA, BOTAO.cima.x, BOTAO.cima.y, 2);

  // baixo = agachar. Na luta 1 ele aparece apagado, porque ainda não existe esse golpe
  botaoSegurar(cena, BOTAO.baixo, 0x3a7bd5, 'agachar', !!cena.cfg.agachar);
  desenharIcone(cena, SETA_BAIXO, BOTAO.baixo.x, BOTAO.baixo.y, 2);

  // ações
  if (cena.cfg.tiro) {
    // luta 2: tiro é o principal (com desenho de arma) e o soco fica ao lado
    botaoToque(cena, BOTAO.principal, 0xffd23f, 'tiro');
    desenharArma(cena, BOTAO.principal.x, BOTAO.principal.y);

    botaoToque(cena, BOTAO.soco, 0xff8a00, 'soco');
    cena.add.image(BOTAO.soco.x, BOTAO.soco.y, 'heroi-soco', 3).setScale(0.9).setDepth(11).setAlpha(0.85);
  } else {
    // luta 1: o principal é o soco
    botaoToque(cena, BOTAO.principal, 0xff8a00, 'soco');
    cena.add.image(BOTAO.principal.x, BOTAO.principal.y, 'heroi-soco', 3).setScale(1.2).setDepth(11).setAlpha(0.85);
  }
}