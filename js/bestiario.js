// Bestiário: um boss por página (imagem à esquerda, lenda e dicas à direita), com as setas ◀ ▶ para trocar de página.
// Abre pela tela inicial e pelo mapa e volta para a tela de onde veio. Os textos ficam em inglês, como o resto do jogo.
// As imagens (150x200) ficam em assets/bestiario/; se alguma faltar, aparece uma caixa com "?" no lugar.
// Nas dicas, {JUMP}, {DUCK}, {PUNCH}, {SHOOT} e {POTION} viram o desenho do botão do jogo seguido da palavra.

const ICONE_BESTIARIO = 15;   // diâmetro (em pixels) do botão desenhado dentro das dicas

// os botões de toque do jogo, em miniatura: cor do fundo e o desenho (grade em pixels ou imagem)
const BOTOES_BESTIARIO = {
  JUMP: { cor: 0xffffff, grade: SETA_CIMA },
  DUCK: { cor: 0x3a7bd5, grade: SETA_BAIXO },
  PUNCH: { cor: 0xff8a00, imagem: 'bestiario-icone-soco' },
  SHOOT: { cor: 0xffd23f, imagem: 'bestiario-icone-tiro' },
  POTION: { cor: 0x4cff6a, imagem: 'bestiario-icone-pocao' }
};

const ESTILO_CORPO = { fontFamily: 'monospace', fontSize: '9px', color: '#ffffff' };

const BESTIARIO = [
  {
    nome: 'WITCH',
    imagem: 'witch',
    lenda: 'No one has seen her face, only the cold orange glow of the mask. She drifts through the ruins of Hollow City at night, whispering names from the empty windows. Whoever follows the whisper is never seen again: their ghosts circle her flame, and the mask burns brighter for each one.',
    dicas: [
      '{JUMP} over her fireball strike.',
      'When she sinks into the puddle, turn around: she rises behind you.',
      '{PUNCH} her as she appears, and hit her twice while she drinks to spoil the potion.'
    ]
  },
  {
    nome: 'OGRE',
    imagem: 'ogre',
    lenda: 'Once a quiet brute of the slaughterhouse district, now he stalks the dead streets with a club that never dries. Bones rattle on his belt for every door he has broken. He roars the townsfolk out of hiding, and the abandoned church is where he drags them. Wherever he stomps, the cobblestones crack and the dogs fall silent.',
    dicas: [
      '{DUCK} or {JUMP} the club.',
      '{JUMP} the stomp.',
      'When he crosses his arms, stop punching: {SHOOT} him instead, and brace for a harder stomp.',
      'He may leap over your bullets.'
    ]
  },
  {
    nome: 'WEREWOLF',
    imagem: 'werewolf',
    lenda: "By day, a thin and silent neighbor behind a boarded window. When the full moon rises, he crawls into the empty streets of the abandoned town, hunting anyone who dares to walk home alone. The claw marks on the doors of Hollow City are his signature, and only his master's whistle can call him back.",
    dicas: [
      '{DUCK} his claw swipe.',
      '{JUMP} over his charge as he runs through you.',
      'When he curls up, {SHOOT} him: punches fail.',
      'Past half health he enters a RAGE, so stay sharp.'
    ]
  },
  {
    nome: 'SUN DEVOURER',
    imagem: 'sun-devourer',
    lenda: 'Long ago the sun went dark over Hollow City, and a black eclipse took its place on a throne of thorns. He feeds on light, warmth and hope. Every window that goes dark was a meal. He sends his beasts to empty the streets, then calls the survivors to his hall, one by one.',
    dicas: [
      '{DUCK} his punch.',
      '{DUCK} or {JUMP} his fireballs.',
      '{SHOOT} him from afar: you have 10 silver bullets.',
      'He blinks in flames when you punch up close: strike as he reappears.',
      'Drink your {POTION} when you need it.'
    ]
  },
  {
    nome: 'SUN DEVOURER: SECOND FORM',
    imagem: 'sun-devourer-2',
    lenda: 'When the eclipse breaks, the darkness does not die: it hardens. He rises in armor of black glass, veined with molten red, a crown of fire burning between his horns. The cracks in the street glow where he walks, and whatever still stands begins to burn.',
    dicas: [
      '{DUCK} his punch.',
      '{JUMP} his sweep kick.',
      'After the kick, he backs off to throw a fireball: {DUCK} or {JUMP}.',
      'Corner him and he blinks in flames behind you.',
      'Save a {POTION}, and {SHOOT} him while he backs off.'
    ]
  }
];

class Bestiario extends Phaser.Scene {
  constructor() {
    super('Bestiario');
  }

  init(data) {
    // de onde o jogador veio: 'Mapa' ou 'TelaInicial' (o BACK volta para lá)
    this.voltarPara = (data && data.voltarPara) || 'TelaInicial';
    this.pagina = 0;
    this.saindo = false;
    this.itensPagina = [];   // tudo que pertence à página atual (para apagar ao trocar)
  }

  preload() {
    // se um arquivo não existir, o jogo segue e a página mostra a caixa com "?"
    for (const p of BESTIARIO) {
      this.load.image(`bestiario-${p.imagem}`, `assets/bestiario/${p.imagem}.png`);
    }

    // ícones dos botões, com chaves próprias (a luta carrega os mesmos arquivos com outras chaves)
    this.load.image('bestiario-icone-soco', 'assets/icones/icone_soco.png');
    this.load.image('bestiario-icone-tiro', 'assets/icones/icone_tiro.png');
    this.load.image('bestiario-icone-pocao', 'assets/icones/icone_pocao_chao.png');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.add.rectangle(0, 0, 512, 224, 0x000000, 1).setOrigin(0, 0);

    // os ícones ficam pequenos: filtro suave (0 = LINEAR) para a redução não "comer" pixels
    const suave = (Phaser.Textures.FilterMode && Phaser.Textures.FilterMode.LINEAR) || 0;
    ['bestiario-icone-soco', 'bestiario-icone-tiro', 'bestiario-icone-pocao'].forEach((chave) => {
      if (this.textures.exists(chave)) this.textures.get(chave).setFilter(suave);
    });

    // medidas do texto das dicas: a fonte é monospace, então toda letra tem a mesma largura
    const medida = this.add.text(0, 0, 'MMMMMMMMMM', ESTILO_CORPO);
    this.larguraLetra = medida.width / 10;
    this.alturaTexto = medida.height;
    medida.destroy();

    // moldura da imagem
    const moldura = this.add.graphics();
    moldura.lineStyle(1, 0x7a3a00, 1);
    moldura.strokeRect(11.5, 11.5, 151, 201);

    // setas, contador de páginas e BACK, na linha do título
    this.criarSeta(378, 16, -1);
    this.criarSeta(438, 16, 1);
    this.textoPagina = this.add.text(408, 16, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const voltar = this.add.text(478, 16, 'BACK', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#222222',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerdown', () => this.voltar());

    this.input.keyboard.on('keydown-LEFT', () => this.mudarPagina(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.mudarPagina(1));
    this.input.keyboard.once('keydown-ESC', () => this.voltar());

    this.mostrarPagina();
  }

  // seta desenhada por código (dir = -1 aponta para a esquerda, 1 para a direita), com uma área de toque maior que o desenho
  criarSeta(x, y, dir) {
    const seta = this.add.graphics();
    seta.fillStyle(0xff8a00, 1);
    seta.fillTriangle(x + dir * 6, y, x - dir * 6, y - 8, x - dir * 6, y + 8);

    this.add.rectangle(x, y, 32, 26, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.mudarPagina(dir));
  }

  // passa para a página seguinte (dir = 1) ou anterior (dir = -1); depois da última volta para a primeira
  mudarPagina(dir) {
    if (this.saindo) return;
    this.pagina = (this.pagina + dir + BESTIARIO.length) % BESTIARIO.length;
    this.mostrarPagina();
  }

  // desenha a página atual: imagem à esquerda; nome, lenda e a lista de dicas à direita
  mostrarPagina() {
    this.itensPagina.forEach((item) => item.destroy());
    this.itensPagina = [];

    const p = BESTIARIO[this.pagina];
    const chave = `bestiario-${p.imagem}`;
    const guardar = (item) => {
      this.itensPagina.push(item);
      return item;
    };

    // imagem (ou uma caixa com "?" se o arquivo ainda não existir)
    if (this.textures.exists(chave)) {
      guardar(this.add.image(12, 12, chave).setOrigin(0, 0));
    } else {
      guardar(this.add.rectangle(12, 12, 150, 200, 0x111111).setOrigin(0, 0));
      guardar(this.add.text(87, 112, '?', {
        fontFamily: 'monospace',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#444444'
      }).setOrigin(0.5));
    }

    // nome do boss
    guardar(this.add.text(176, 9, p.nome, {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ff8a00',
      stroke: '#000000',
      strokeThickness: 3
    }));

    // primeiro parágrafo: a lenda do boss
    const lenda = guardar(this.add.text(176, 30, p.lenda, {
      ...ESTILO_CORPO,
      color: '#dddddd',
      wordWrap: { width: 324 },
      lineSpacing: 2
    }));
    let y = lenda.y + lenda.height + 10;

    // segundo bloco: como combater, em lista (cada dica com o seu marcador)
    for (const dica of p.dicas) {
      y += this.escreverDica(176, y, dica, 324, guardar) + 3;
    }

    this.textoPagina.setText(`${this.pagina + 1}/${BESTIARIO.length}`);
  }

  // escreve uma dica com o marcador "-" e os botões do jogo desenhados no lugar das ações ({JUMP}, {DUCK}, {PUNCH}, {SHOOT}, {POTION}).
  // O texto começa 10 pixels à direita de x, e a quebra de linha é feita à mão, porque o desenho fica no meio da frase.
  // Devolve a altura usada
  escreverDica(x, y, dica, larguraTotal, guardar) {
    const cw = this.larguraLetra;
    const D = ICONE_BESTIARIO;
    const largura = larguraTotal - 10;
    const xTexto = x + 10;

    // 1) distribui as palavras em linhas
    const linhas = [[]];
    let usado = 0;
    for (const palavra of dica.split(' ')) {
      const m = palavra.match(/^\{(\w+)\}(.*)$/);
      const item = m
        ? { icone: m[1], texto: m[1] + m[2], largura: D + 3 + (m[1].length + m[2].length) * cw }
        : { texto: palavra, largura: palavra.length * cw };

      if (usado > 0 && usado + cw + item.largura > largura) {
        linhas.push([]);
        usado = 0;
      }
      item.x = usado > 0 ? usado + cw : 0;
      usado = item.x + item.largura;
      linhas[linhas.length - 1].push(item);
    }

    // 2) desenha linha por linha: linhas com botão são um pouco mais altas
    const alturaLinha = this.alturaTexto + 2;
    let topo = y;
    linhas.forEach((linha, numero) => {
      const passo = linha.some((item) => item.icone) ? Math.max(alturaLinha, D + 1) : alturaLinha;
      const yTexto = topo + (passo - this.alturaTexto) / 2;

      // o marcador fica só na primeira linha da dica
      if (numero === 0) guardar(this.add.text(x, yTexto, '-', { ...ESTILO_CORPO, fontStyle: 'bold', color: '#ff8a00' }));

      let corrida = null;   // palavras seguidas sem botão no meio viram um texto só
      const fecharCorrida = () => {
        if (corrida) guardar(this.add.text(xTexto + corrida.x, yTexto, corrida.texto, ESTILO_CORPO));
        corrida = null;
      };

      for (const item of linha) {
        if (item.icone) {
          fecharCorrida();
          this.desenharBotao(item.icone, xTexto + item.x + D / 2, topo + passo / 2, guardar);
          guardar(this.add.text(xTexto + item.x + D + 3, yTexto, item.texto, { ...ESTILO_CORPO, fontStyle: 'bold' }));
        } else if (corrida) {
          corrida.texto += ' ' + item.texto;
        } else {
          corrida = { x: item.x, texto: item.texto };
        }
      }
      fecharCorrida();
      topo += passo;
    });
    return topo - y;
  }

  // o botão de toque do jogo em miniatura: fundo redondo colorido e o desenho por cima
  desenharBotao(nome, cx, cy, guardar) {
    const botao = BOTOES_BESTIARIO[nome];
    if (!botao) return;

    const g = guardar(this.add.graphics());
    g.fillStyle(botao.cor, 0.35);
    g.fillCircle(cx, cy, ICONE_BESTIARIO / 2);
    g.lineStyle(1, 0xffffff, 0.45);
    g.strokeCircle(cx, cy, ICONE_BESTIARIO / 2);

    if (botao.grade) {
      // seta em pixels (as mesmas grades dos botões de toque)
      g.fillStyle(0xffffff, 0.85);
      const larg = botao.grade[0].length;
      const alt = botao.grade.length;
      botao.grade.forEach((linha, j) => {
        [...linha].forEach((letra, i) => {
          if (letra === '#') g.fillRect(Math.round(cx - larg / 2 + i), Math.round(cy - alt / 2 + j), 1, 1);
        });
      });
    } else if (this.textures.exists(botao.imagem)) {
      const imagem = guardar(this.add.image(cx, cy, botao.imagem));
      imagem.setScale((ICONE_BESTIARIO - 3) / Math.max(imagem.width, imagem.height));
    }
  }

  voltar() {
    if (this.saindo) return;
    this.saindo = true;

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.voltarPara === 'Mapa') this.scene.start('Mapa', { fase: this.game.progresso || 0 });
      else this.scene.start('TelaInicial');
    });
  }
}