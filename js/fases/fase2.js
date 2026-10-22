// Fase 2: o ogro. Tudo que é dele fica aqui: textos, cenário, sons, sprites, animações, golpes, vida, movimento e morte.

const FASE2 = {
  nome: 'OGRE',
  rotuloVilao: 'OGRE',       // nome que aparece na barra de vida do vilão
  dialogoHeroi: "I'll clean my city of all of you!",
  dialogoVilao: 'Me smash you! Me big!',
  dialogoDerrota: 'Me die... but boss will get you!',

  cenario: 'assets/ogro-cenario-v2.png',
  cenarioChave: 'cenario-ogro',
  cenarioAjusteY: -6,        // sobe o fundo para a faixa de chão encostar nos pés dos lutadores

  // vida, tamanho e movimento do vilão
  vida: 500,
  barraLargura: 320,          // barra bem larga, para o ogro parecer um chefe
  escala: 1.5,                // ponto de partida; ajuste depois do teste
  espelhado: true,            // o sprite do ogro nasce virado para a esquerda
  velocidade: 35,             // pixels por segundo; mais lenta que a bruxa (50)
  distanciaLuta: 60,          // para de andar a essa distância do herói
  distanciaAtaque: 70,        // começa um golpe a essa distância (ou menos)
  margemCorpo: 50,            // o ogro é grande: o herói fica mais longe do centro dele
  alturaPassagem: 50,         // acima dessa altura no ar, o herói pode pular por cima do ogro

  // origem vertical (0 a 1) por textura. Os sheets novos têm frames 144x128 com os pés em y=104;
  // os antigos (144x80) não aparecem aqui e usam 1, a base do quadro
  origemY: {
    'ogro-hit': 104 / 128,
    'ogro-morte': 95 / 128,
    'ogro-pisao': 104 / 128,
    'ogro-bloqueio': 104 / 128
  },

  // animação de dano: intervalo mínimo entre duas (evita o ogro ficar travado apanhando)
  hitCooldown: 1000,          // ms

  // sons próprios desta fase (chaves definidas em SONS, no config.js)
  sons: {
    dano: 'ogro-dano',        // grunhido do ogro quando o herói acerta
    tiro: 'tiro'              // som do disparo do herói
  },

  // golpes do ogro
  golpes: {
    intervalo: 1600,          // um ataque a cada 1,6 segundo
    // clava: golpe alto, desviado agachando ou pulando durante o aviso
    clava: {
      dano: 40,
      alcance: 80,
      desviaCom: ['agachar', 'pulo'],   // a clava pode ser desviada agachando ou pulando
      aviso: 500,             // aviso laranja de 0,5 s
      avanco: { distancia: 24, duracao: 80 }  // avanço rápido do golpe
    },
    // pisão: o ogro pula e cai no chão; quem estiver no chão perto leva dano
    pisao: {
      dano: 25,
      raio: 80,               // pixels de cada lado do ogro
      aviso: 500,             // aviso laranja de 0,5 s
      desviaCom: 'pulo',
      tremor: { duracao: 150, forca: 0.008 }, // tremor quando ele pousa
      corPoeira: 0x3a3a3a     // cor da poeira do pouso
    },
    escolha: 'aleatorio',     // clava ou pisão, sorteado a cada ataque
    avancoDepoisPulo: 30,     // anda um pouco em direção ao herói depois de pousar
    alturaPulo: 240           // impulso do pulo do ogro (a bruxa e o herói usam 480)
  },

  // golpes do herói desbloqueados nesta fase
  agachar: true,              // seta para baixo / botão azul: desvia da clava
  tiro: {
    municao: 6,               // zerado a cada tentativa (o create da cena volta a 6)
    dano: 50,
    velocidade: 300,          // pixels por segundo
    altura: 8,                // altura da bala para o acerto: o pulo do ogro (20 px) passa por cima dela
    alturaDisparo: 32,        // altura visual da bala: sai na altura do braço do herói (o chão é 205)
    alcanceCorpo: 50          // distância do centro do ogro para a bala acertar
  },

  // o ogro não esquiva
  esquiva: false,

  // bloqueio: por conta própria, com o herói perto (dentro de distanciaAtaque), o ogro cruza os braços com a clava no peito.
  // Soco e chute não causam dano (aparece BLOCKED); o tiro passa e causa dano normal.
  // Logo depois do bloqueio ele faz o pisão, mais forte que o normal
  bloqueio: {
    primeiro: 4000,     // ms: o primeiro bloqueio só fica disponível depois disso, contado do começo da luta
    intervalo: 8000,    // ms entre um bloqueio e o seguinte, contados do começo do bloqueio
    duracao: 1500,      // ms de braços cruzados, antes do pisão
    pisaoDano: 40       // dano do pisão logo depois do bloqueio (o pisão normal tira 25)
  },

  // desvio de tiro: o ogro tenta pular quando uma bala aparece
  desvioTiro: {
    alturaPulo: 380,   // impulso do pulo de desvio (alto o bastante para a bala passar por baixo)
    cooldown: 1500,    // ms até o ogro poder tentar desviar de novo
    chance: 0.6        // chance de tentar desviar a cada bala que aparece (0 a 1)
  },

  // imagem que aparece na caixa de diálogo
  retrato: { chave: 'ogro-parado', frame: 0, escala: 0.4 },

  // arquivos dos sprites do ogro (pasta assets/ogro)
  sprites: {
    andar: 'assets/ogro/ogro-andar.png',
    ataque: 'assets/ogro/ogro-ataque.png',
    parado: 'assets/ogro/ogro-parado.png',
    hit: 'assets/ogro/ogro_hit.png',
    morte: 'assets/ogro/ogro_morte.png',
    pisao: 'assets/ogro/ogro_pisao.png',
    bloqueio: 'assets/ogro/ogro_bloqueio.png',
    largura: 144,
    altura: 80,               // andar, ataque e parado
    alturaNovos: 128          // hit, morte, pisão e bloqueio
  },

  // nomes internos das texturas
  texturas: {
    andar: 'ogro-andar',
    ataque: 'ogro-ataque',
    parado: 'ogro-parado',
    hit: 'ogro-hit',
    morte: 'ogro-morte',
    pisao: 'ogro-pisao',
    bloqueio: 'ogro-bloqueio'
  },

  // nomes internos das animações. O pisão tem 3 partes: agachar (aviso), ar (pulo) e pouso
  anims: {
    andar: 'ogro-andar',
    ataque: 'ogro-ataque',
    parado: 'ogro-parado',
    hit: 'ogro-hit',
    morte: 'ogro-morte',
    pisaoAgachar: 'ogro-pisao-agachar',
    pisaoAr: 'ogro-pisao-ar',
    pisaoPouso: 'ogro-pisao-pouso',
    bloqueio: 'ogro-bloqueio'
  },

  // carrega os sprites do ogro (chamado pelo preload da cena de luta)
  carregar(cena) {
    cena.load.spritesheet(this.texturas.andar, this.sprites.andar, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.altura
    });
    cena.load.spritesheet(this.texturas.ataque, this.sprites.ataque, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.altura
    });
    cena.load.spritesheet(this.texturas.parado, this.sprites.parado, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.altura
    });
    cena.load.spritesheet(this.texturas.hit, this.sprites.hit, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.alturaNovos
    });
    cena.load.spritesheet(this.texturas.morte, this.sprites.morte, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.alturaNovos
    });
    cena.load.spritesheet(this.texturas.pisao, this.sprites.pisao, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.alturaNovos
    });
    cena.load.spritesheet(this.texturas.bloqueio, this.sprites.bloqueio, {
      frameWidth: this.sprites.largura,
      frameHeight: this.sprites.alturaNovos
    });
  },

  // cria as animações do ogro (chamado pelo create da cena de luta)
  preparar(cena) {
    const T = this.texturas;
    const A = this.anims;

    if (cena.anims.exists(A.andar)) return;

    cena.anims.create({
      key: A.andar,
      frames: cena.anims.generateFrameNumbers(T.andar, { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    });

    // ataque: 7 quadros, um pouco mais rápido para o golpe caber na janela do aviso
    cena.anims.create({
      key: A.ataque,
      frames: cena.anims.generateFrameNumbers(T.ataque, { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0
    });

    cena.anims.create({
      key: A.parado,
      frames: cena.anims.generateFrameNumbers(T.parado, { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });

    // dano: 9 quadros, toca uma vez
    cena.anims.create({
      key: A.hit,
      frames: cena.anims.generateFrameNumbers(T.hit, { start: 0, end: 8 }),
      frameRate: 16,
      repeat: 0
    });

    // morte: 7 quadros, sem loop (o último fica parado no chão)
    cena.anims.create({
      key: A.morte,
      frames: cena.anims.generateFrameNumbers(T.morte, { start: 0, end: 6 }),
      frameRate: 9,
      repeat: 0
    });

    // pisão, parte 1: agachar (quadros 0 a 2) durante o aviso de 500 ms
    cena.anims.create({
      key: A.pisaoAgachar,
      frames: cena.anims.generateFrameNumbers(T.pisao, { start: 0, end: 2 }),
      frameRate: 6,
      repeat: 0
    });

    // pisão, parte 2: no ar, pernas recolhidas (quadros 3 a 5); o último quadro segura até pousar
    cena.anims.create({
      key: A.pisaoAr,
      frames: cena.anims.generateFrameNumbers(T.pisao, { start: 3, end: 5 }),
      frameRate: 9,
      repeat: 0
    });

    // pisão, parte 3: pouso e levantar (quadros 6 a 8)
    cena.anims.create({
      key: A.pisaoPouso,
      frames: cena.anims.generateFrameNumbers(T.pisao, { start: 6, end: 8 }),
      frameRate: 8,
      repeat: 0
    });

    // bloqueio: 9 quadros (subir a clava e cruzar os braços); o último fica segurado até o fim do bloqueio
    cena.anims.create({
      key: A.bloqueio,
      frames: cena.anims.generateFrameNumbers(T.bloqueio, { start: 0, end: 8 }),
      frameRate: 10,
      repeat: 0
    });
  }
};