// Fase 3: o lobisomem. Tudo que é dele fica aqui: textos, cenário, sons, sprites, animações, golpes, vida e movimento.
// Sprites: "Free Werewolf Sprite Pixel Characters" (Black Werewolf), da CraftPix; licença em assets/lobisomem/LICENCA.txt.
// Anda, dá a garrada (desvia agachando), faz a investida (desvia pulando), entra na fúria com metade da vida, apanha e morre.
// Os valores de vida, dano e alcance são um chute inicial: ajuste depois do teste.

const FASE3 = {
  nome: 'WEREWOLF',
  rotuloVilao: 'WEREWOLF',   // nome que aparece na barra de vida do vilão
  dialogoHeroi: 'Another one of his beasts. This ends tonight.',
  dialogoVilao: 'I can smell your fear, detective...',
  dialogoDerrota: 'The moon... will rise... again...',

  cenario: 'assets/cenario-noite.png',
  cenarioChave: 'cenario',

  // vida, tamanho e movimento do vilão
  vida: 400,
  escala: 1.1,               // ponto de partida; ajuste depois do teste
  espelhado: false,          // o sprite do lobisomem nasce virado para a direita
  velocidade: 55,            // pixels por segundo; mais rápido que o ogro (35) e a criatura (50)
  distanciaLuta: 50,         // para de andar a essa distância do herói
  distanciaAtaque: 60,       // começa um golpe a essa distância (ou menos)
  margemCorpo: 35,           // distância mínima entre os centros do herói e do lobisomem
  alturaPassagem: 45,        // acima dessa altura no ar, o herói pode pular por cima dele
  alcanceSoco: 60,           // alcance dos golpes do herói nele

  // origem vertical (0 a 1) por textura: frames de 128x128 com os pés na base do quadro
  origemY: {
    'lobisomem-andar': 1,
    'lobisomem-garra': 1,
    'lobisomem-investida': 1,
    'lobisomem-correr': 1,
    'lobisomem-hit': 1,
    'lobisomem-morte': 1
  },

  // animação de dano: intervalo mínimo entre duas
  hitCooldown: 1000,         // ms

  // golpes do lobisomem. O corpo a corpo dele é a garrada, na altura da cabeça: o herói desvia agachando
  golpes: {
    intervalo: 1200,         // um ataque a cada 1,2 segundo
    corpo: {
      dano: 25,
      alcance: 65,
      desviaCom: 'agachar',
      aviso: 500,            // aviso laranja de 0,5 s (a animação a 6 fps chega no quadro do corte nesse tempo)
      avanco: { distancia: 20, duracao: 80 },
      corte: false           // sem arco laranja: a animação já tem o rastro da garra
    },
    // investida: depois do aviso, ele dispara correndo, atravessa o herói e para do outro lado.
    // O herói desvia pulando quando ele passa; no chão, leva o dano
    investida: {
      dano: 30,
      desviaCom: 'pulo',
      aviso: 600,            // aviso laranja de 0,6 s, agachado para arrancar
      velocidade: 320,       // pixels por segundo na corrida
      passarDoHeroi: 90,     // pixels que ele corre depois de passar pelo herói
      distanciaMin: 130,     // de longe, investe sempre que puder (a essa distância ou mais)
      chancePerto: 0.3,      // de perto, chance de investir em vez de dar a garrada
      primeira: 3000,        // ms: a primeira investida só fica disponível depois disso
      cooldown: 5000         // ms até ele poder investir de novo
    }
  },

  // fúria: com metade da vida (ou menos), ele para, a tela treme e o corpo pisca em vermelho (sem sheet de uivo, feito no código).
  // Depois fica vermelho até o fim da luta, anda e corre mais rápido, ataca com mais frequência e as animações aceleram
  furia: {
    gatilho: 0.5,            // entra na fúria com 50% da vida (ou menos), assim que estiver livre
    duracao: 1200,           // ms parado, piscando em vermelho
    piscaMs: 120,            // tempo de cada piscada
    piscadas: 9,             // mudanças de cor (ímpar, para terminar na silhueta cheia antes de voltar ao vermelho)
    cor: 0xff6b6b,           // vermelho da fúria
    texto: 'RAGE!',
    som: 'ogro-dano',        // por enquanto o grunhido do ogro; troque quando houver um uivo
    tremor: { duracao: 400, forca: 0.01 },
    velocidade: 1.4,         // andar e correr na investida: 40% mais rápido
    intervalo: 0.7,          // tempo entre golpes e entre investidas: 30% menor
    animacao: 1.3            // as animações tocam 30% mais rápido
  },

  // sons próprios desta fase (chaves definidas em SONS, no config.js)
  sons: {
    dano: 'soco',            // por enquanto o som do soco; troque quando houver um rosnado
    tiro: 'tiro'             // som do disparo do herói
  },

  // golpes do herói disponíveis nesta luta (o herói mantém o que aprendeu contra o ogro)
  agachar: true,
  tiro: {
    municao: 6,
    dano: 50,
    velocidade: 300,         // pixels por segundo
    altura: 8,
    alturaDisparo: 32,       // altura visual da bala: sai na altura do braço do herói (o chão é 205)
    alcanceCorpo: 40         // distância do centro do lobisomem para a bala acertar
  },

  // o lobisomem não esquiva
  esquiva: false,

  // imagem que aparece na caixa de diálogo
  retrato: { chave: 'lobisomem-andar', frame: 0, escala: 0.55 },

  // arquivos dos sprites do lobisomem (pasta assets/lobisomem), todos com frames de 128x128
  sprites: {
    andar: 'assets/lobisomem/lobisomem_andar.png',
    garra: 'assets/lobisomem/lobisomem_garra.png',
    investida: 'assets/lobisomem/lobisomem_investida.png',
    correr: 'assets/lobisomem/lobisomem_correr.png',
    hit: 'assets/lobisomem/lobisomem_hit.png',
    morte: 'assets/lobisomem/lobisomem_morte.png',
    largura: 128,
    altura: 128
  },

  // nomes internos das texturas. Parado usa o primeiro quadro do andar
  // (o idle do pacote é agachado e corta as pernas na borda do quadro)
  texturas: {
    parado: 'lobisomem-andar',
    andar: 'lobisomem-andar',
    ataque: 'lobisomem-garra',
    investida: 'lobisomem-investida',
    correr: 'lobisomem-correr',
    hit: 'lobisomem-hit',
    morte: 'lobisomem-morte'
  },

  // nomes internos das animações
  anims: {
    andar: 'lobisomem-andar',
    ataque: 'lobisomem-ataque',
    investidaPreparar: 'lobisomem-investida-preparar',
    correr: 'lobisomem-correr',
    hit: 'lobisomem-hit',
    morte: 'lobisomem-morte'
  },

  // carrega os sprites do lobisomem (chamado pelo preload da cena de luta)
  carregar(cena) {
    const T = this.texturas;
    const S = this.sprites;
    const tamanho = { frameWidth: S.largura, frameHeight: S.altura };

    cena.load.spritesheet(T.andar, S.andar, tamanho);
    cena.load.spritesheet(T.ataque, S.garra, tamanho);
    cena.load.spritesheet(T.investida, S.investida, tamanho);
    cena.load.spritesheet(T.correr, S.correr, tamanho);
    cena.load.spritesheet(T.hit, S.hit, tamanho);
    cena.load.spritesheet(T.morte, S.morte, tamanho);
  },

  // cria as animações do lobisomem (chamado pelo create da cena de luta)
  preparar(cena) {
    const T = this.texturas;
    const A = this.anims;

    if (cena.anims.exists(A.andar)) return;

    // andar: 11 quadros
    cena.anims.create({
      key: A.andar,
      frames: cena.anims.generateFrameNumbers(T.andar, { start: 0, end: 10 }),
      frameRate: 12,
      repeat: -1
    });

    // garrada: 4 quadros a 6 fps; o rastro da garra aparece no quadro 3 (~0,5 s, no fim do aviso)
    cena.anims.create({
      key: A.ataque,
      frames: cena.anims.generateFrameNumbers(T.ataque, { start: 0, end: 3 }),
      frameRate: 6,
      repeat: 0
    });

    // preparo da investida: os 2 primeiros quadros do Run+Attack (curvado, pronto para arrancar), durante o aviso
    cena.anims.create({
      key: A.investidaPreparar,
      frames: cena.anims.generateFrameNumbers(T.investida, { start: 0, end: 1 }),
      frameRate: 4,
      repeat: 0
    });

    // corrida da investida: 9 quadros em loop, rápido
    cena.anims.create({
      key: A.correr,
      frames: cena.anims.generateFrameNumbers(T.correr, { start: 0, end: 8 }),
      frameRate: 16,
      repeat: -1
    });

    // dano: 2 quadros
    cena.anims.create({
      key: A.hit,
      frames: cena.anims.generateFrameNumbers(T.hit, { start: 0, end: 1 }),
      frameRate: 6,
      repeat: 0
    });

    // morte: 2 quadros, sem loop (o último fica deitado no chão)
    cena.anims.create({
      key: A.morte,
      frames: cena.anims.generateFrameNumbers(T.morte, { start: 0, end: 1 }),
      frameRate: 3,
      repeat: 0
    });
  }
};
