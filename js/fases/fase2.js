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
  velocidade: 30,             // pixels por segundo; mais lenta que a bruxa (50)
  distanciaLuta: 60,          // para de andar a essa distância do herói
  distanciaAtaque: 70,        // começa um golpe a essa distância (ou menos)

  // sons próprios desta fase (chaves definidas em SONS, no config.js)
  sons: {
    dano: 'ogro-dano',        // grunhido do ogro quando o herói acerta
    tiro: 'tiro'              // som do disparo do herói
  },

  // golpes do ogro
  golpes: {
    intervalo: 1600,          // um ataque a cada 1,6 segundo
    // clava: golpe alto, desviado agachando
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

  // morte sem animação: o ogro tomba para o lado e fica no chão antes da fala de derrota
  morte: {
    tombar: true,
    duracao: 500,             // tempo da queda, em ms
    pausa: 900                // tempo caído antes da fala de derrota, em ms
  },

  // golpes do herói desbloqueados nesta fase
  agachar: true,              // seta para baixo / botão azul: desvia da clava
  tiro: {
    municao: 6,               // zerado a cada tentativa (o create da cena volta a 6)
    dano: 50,
    velocidade: 300,          // pixels por segundo
    altura: 8,                // altura da bala: o pulo do ogro (20 px) passa por cima dela
    alcanceCorpo: 50          // distância do centro do ogro para a bala acertar
  },

  // o ogro não esquiva
  esquiva: false,

  // desvio de tiro: o ogro tenta pular quando uma bala aparece
  desvioTiro: {
    alturaPulo: 380,   // impulso do pulo de desvio (alto o bastante para a bala passar por baixo)
    cooldown: 1500,    // ms até o ogro poder tentar desviar de novo
    chance: 0.6        // chance de tentar desviar a cada bala que aparece (0 a 1)
  },

  // imagem que aparece na caixa de diálogo
  retrato: { chave: 'ogro-parado', frame: 0, escala: 0.4 },

  // arquivos dos sprites do ogro
  sprites: {
    andar: 'assets/ogro-andar.png',
    ataque: 'assets/ogro-ataque.png',
    parado: 'assets/ogro-parado.png',
    largura: 144,
    altura: 80
  },

  // nomes internos das texturas
  texturas: {
    andar: 'ogro-andar',
    ataque: 'ogro-ataque',
    parado: 'ogro-parado'
  },

  // nomes internos das animações. Sem morte: o ogro tomba (ver morte.tombar acima)
  anims: {
    andar: 'ogro-andar',
    ataque: 'ogro-ataque',
    parado: 'ogro-parado'
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
  }
};