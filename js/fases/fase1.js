// Fase 1: a criatura mascarada (no lugar da bruxa). Tudo que é dela fica aqui: textos, cenário, sons, sprites, animações, golpes, poção, vida e movimento.

const FASE1 = {
  nome: 'MASKED ONE',        // nome provisório que aparece nas falas; troque quando decidir o nome dela
  rotuloVilao: 'VILLAIN',    // nome que aparece na barra de vida do vilão
  dialogoHeroi: 'So you are the one they sent. Who leads these monsters?',
  dialogoVilao: 'Turn back, detective. Some questions are better left unanswered.',

  cenario: 'assets/cenario-noite.png',
  cenarioChave: 'cenario',

  // vida, tamanho e movimento do vilão
  vida: 300,
  escala: 1.5,               // ponto de partida; ajuste depois do teste
  espelhado: true,           // o sprite da criatura nasce virado para a esquerda
  velocidade: 50,            // pixels por segundo
  distanciaLuta: 45,         // para de andar a essa distância do herói (ela precisa colar nele)
  distanciaAtaque: 55,       // começa um golpe a essa distância (ou menos)
  margemCorpo: 35,           // distância mínima entre os centros do herói e da criatura
  alturaPassagem: 40,        // acima dessa altura no ar, o herói pode pular por cima dela
  alcanceSoco: 55,           // alcance dos golpes do herói nela (o padrão do config.js é largo demais para o corpo estreito dela)

  // origem vertical (0 a 1) de cada textura: frames de 80x80 com os pés em y=65
  origemY: {
    'criatura-idle': 65 / 80,
    'criatura-andar': 65 / 80,
    'criatura-fireball': 65 / 80,
    'criatura-beber': 65 / 80,
    'criatura-hit': 65 / 80,
    'criatura-morte': 65 / 80,
    'criatura-afundar': 65 / 80
  },

  // animação de dano: intervalo mínimo entre duas
  hitCooldown: 1000,         // ms

  // golpes da criatura. O golpe se chama "clava" por causa do código da cena, mas aqui é a bola de fogo
  // enfiada de perto no herói: avança, e o dano cai quando a chama aparece (quadro 5 da animação)
  golpes: {
    intervalo: 1000,         // um ataque a cada 1 segundo
    clava: {
      dano: 23,
      alcance: 55,
      desviaCom: 'pulo',
      aviso: 500,            // aviso laranja de 0,5 s (a animação a 8 fps chega no quadro 5 nesse tempo)
      avanco: { distancia: 30, duracao: 80 },  // avanço rápido, "enfiando" o golpe
      corte: false           // sem arco laranja: a criatura já tem a animação do golpe
    }
  },

  // poção de cura: ela bebe uma vez por luta, parada e vulnerável.
  // Se o herói acertar golpes demais enquanto ela bebe, a poção é interrompida: ela não cura nada e não bebe de novo.
  pocao: {
    gatilho: 0.3,            // bebe quando a vida chega a 30% (ou menos), assim que estiver livre
    cura: 0.2,               // cura completa: +20% da vida máxima (30% vira 50%)
    golpesParaInterromper: 2,
    pausaDepois: 1500        // ms sem atacar depois de beber (ou de ser interrompida)
  },

  // sons próprios desta fase (chaves definidas em SONS, no config.js)
  sons: {
    dano: 'soco'             // o som do soco do herói também é o de dano da criatura
  },

  // esquiva: ela afunda numa poça escura e reaparece atrás do herói
  esquiva: true,
  cooldownEsquiva: 2000,     // tempo (ms) até ela poder esquivar de novo
  primeiraEsquiva: 3000,     // a primeira esquiva só fica disponível depois disso

  // imagem que aparece na caixa de diálogo
  retrato: { chave: 'criatura-idle', frame: 0, escala: 1.1 },

  // arquivos dos sprites da criatura (pasta assets/bruxa), todos com frames de 80x80
  sprites: {
    idle: 'assets/bruxa/criatura_idle.png',
    andar: 'assets/bruxa/criatura_andar.png',
    fireball: 'assets/bruxa/criatura_fireball.png',
    beber: 'assets/bruxa/criatura_beber.png',
    hit: 'assets/bruxa/criatura_hit.png',
    morte: 'assets/bruxa/criatura_morte.png',
    afundar: 'assets/bruxa/criatura_afundar.png',
    largura: 80,
    altura: 80
  },

  // nomes internos das texturas
  texturas: {
    parado: 'criatura-idle',
    andar: 'criatura-andar',
    ataque: 'criatura-fireball',
    beber: 'criatura-beber',
    hit: 'criatura-hit',
    morte: 'criatura-morte',
    afundar: 'criatura-afundar'
  },

  // nomes internos das animações (o surgir é o afundar tocado ao contrário)
  anims: {
    andar: 'criatura-andar',
    ataque: 'criatura-ataque',
    beber: 'criatura-beber',
    hit: 'criatura-hit',
    morte: 'criatura-morte',
    afundar: 'criatura-afundar',
    surgir: 'criatura-surgir'
  },

  // carrega os sprites da criatura (chamado pelo preload da cena de luta)
  carregar(cena) {
    const T = this.texturas;
    const S = this.sprites;
    const tamanho = { frameWidth: S.largura, frameHeight: S.altura };

    cena.load.spritesheet(T.parado, S.idle, tamanho);
    cena.load.spritesheet(T.andar, S.andar, tamanho);
    cena.load.spritesheet(T.ataque, S.fireball, tamanho);
    cena.load.spritesheet(T.beber, S.beber, tamanho);
    cena.load.spritesheet(T.hit, S.hit, tamanho);
    cena.load.spritesheet(T.morte, S.morte, tamanho);
    cena.load.spritesheet(T.afundar, S.afundar, tamanho);
  },

  // cria as animações da criatura (chamado pelo create da cena de luta)
  preparar(cena) {
    const T = this.texturas;
    const A = this.anims;

    if (cena.anims.exists(A.andar)) return;

    cena.anims.create({
      key: A.andar,
      frames: cena.anims.generateFrameNumbers(T.andar, { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    // beber: 6 quadros a 2.5 fps = 2,4 s vulnerável
    cena.anims.create({
      key: A.beber,
      frames: cena.anims.generateFrameNumbers(T.beber, { start: 0, end: 5 }),
      frameRate: 2.5,
      repeat: 0
    });

    // beber: 6 quadros a 4 fps = 1,5 s vulnerável
    cena.anims.create({
      key: A.beber,
      frames: cena.anims.generateFrameNumbers(T.beber, { start: 0, end: 5 }),
      frameRate: 4,
      repeat: 0
    });

    cena.anims.create({
      key: A.hit,
      frames: cena.anims.generateFrameNumbers(T.hit, { start: 0, end: 5 }),
      frameRate: 14,
      repeat: 0
    });

    // morte: 7 quadros, sem loop (o último fica parado no chão)
    cena.anims.create({
      key: A.morte,
      frames: cena.anims.generateFrameNumbers(T.morte, { start: 0, end: 6 }),
      frameRate: 8,
      repeat: 0
    });

    // esquiva: afunda na poça e depois sai dela atrás do herói
    cena.anims.create({
      key: A.afundar,
      frames: cena.anims.generateFrameNumbers(T.afundar, { start: 0, end: 8 }),
      frameRate: 14,
      repeat: 0
    });

    cena.anims.create({
      key: A.surgir,
      frames: cena.anims.generateFrameNumbers(T.afundar, { frames: [8, 7, 6, 5, 4, 3, 2, 1, 0] }),
      frameRate: 9,
      repeat: 0
    });
  }
};