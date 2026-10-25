// Textos do jogo, no estilo do strings.xml do Android: cada texto tem um identificador e uma versão por idioma.
// Uso: traduzir('luta1.detetive'). Se faltar a tradução, cai no inglês; se o identificador não existir, aparece o próprio identificador.
// Variáveis: traduzir('final.obrigado', { nome: 'Ana' }) troca {nome} dentro do texto.
// Por enquanto o jogo fica sempre em inglês (idiomaAtual). Depois da feira, é aqui que entra a detecção do idioma do aparelho.
//
// Identificadores das lutas: luta1 a luta4 (a ordem do mapa), com .nome, .detetive, .vilao e, se a fase tiver, .derrota.

let idiomaAtual = 'en';   // 'en' ou 'pt'

const TEXTOS = {
  // quem fala na caixa de diálogo
  'nome.detetive': { en: 'DETECTIVE', pt: 'DETETIVE' },

  // abertura (depois do nome, antes do mapa)
  'abertura.2': {
    en: 'They took the sun, then my neighbors.\nSomeone is giving the orders.',
    pt: 'Levaram o sol, depois os meus vizinhos.\nAlguém está dando as ordens.'
  },
  'abertura.3': {
    en: 'Tonight, it ends.',
    pt: 'Esta noite, isso acaba.'
  },

  // luta 1: a bruxa
  'luta1.nome': { en: 'WITCH', pt: 'BRUXA' },
  'luta1.detetive': {
    en: 'I know those faces in your flame. Those were my neighbors. Who gives you orders?',
    pt: 'Conheço esses rostos na sua chama. Eram os meus vizinhos. Quem dá as ordens a você?'
  },
  'luta1.vilao': {
    en: 'I have whispered your name for weeks, detective. Some questions are better left unanswered.',
    pt: 'Faz semanas que sussurro o seu nome, detetive. Algumas perguntas é melhor deixar sem resposta.'
  },

  'luta1.derrota': {
    en: 'Do not look for them, detective... there is no one left to find...',
    pt: 'Não procure por eles, detetive... não sobrou ninguém para encontrar...'
  },

  // luta 2: o ogro
  'luta2.nome': { en: 'OGRE', pt: 'OGRO' },
  'luta2.detetive': {
    en: "You dragged them to that church. I'll clean this city of every one of you!",
    pt: 'Você os arrastou para aquela igreja. Vou limpar esta cidade de todos vocês!'
  },
  'luta2.vilao': {
    en: 'Master said no one leaves. You small. You break easy.',
    pt: 'O mestre disse que ninguém sai. Você é pequeno. Você quebra fácil.'
  },
  'luta2.derrota': {
    en: 'Me fall... but master will find you...',
    pt: 'Eu caio... mas o mestre vai achar você...'
  },

  // luta 3: o lobisomem
  'luta3.nome': { en: 'WEREWOLF', pt: 'LOBISOMEM' },
  'luta3.detetive': {
    en: 'Another one of his beasts. I watched you slip out of that boarded house on Pine Street. You were my neighbor.',
    pt: 'Mais uma das feras dele. Vi você saindo daquela casa com tábuas na Rua dos Pinheiros. Era meu vizinho.'
  },
  'luta3.vilao': {
    en: 'I can smell your fear, detective... I do not remember my own name.',
    pt: 'Sinto o cheiro do seu medo, detetive... Não lembro mais o meu próprio nome.'
  },
  'luta3.derrota': {
    en: 'The moon... will rise... again...',
    pt: 'A lua... vai nascer... de novo...'
  },

 // luta 4: o Sun Devourer (as falas da cutscene antes da luta e a fala de derrota)
  'luta4.derrota': {
    en: 'Kill me, and the sun rises... on a city of graves...',
    pt: 'Me mate, e o sol nasce... sobre uma cidade de túmulos...'
  },
  'luta4.nome': { en: 'SUN DEVOURER', pt: 'DEVORADOR DE SOL' },
  'luta4.goblin': {
    en: 'Hmm... if you want something done right, you have to do it yourself...',
    pt: 'Hmm... se você quer algo bem feito, tem que fazer você mesmo...'
  },
  'luta4.detetive': {
    en: 'You took the sun, and my neighbors. Tonight, it ends.',
    pt: 'Você levou o sol e os meus vizinhos. Esta noite, isso acaba.'
  },
  'luta4.vilao': {
    en: 'Do your best, little human... Every light that faced me went out.',
    pt: 'Faça o seu melhor, pequeno humano... Toda luz que me enfrentou se apagou.'
  }
};

// devolve o texto no idioma atual (ou em inglês, se faltar a tradução)
function traduzir(id, variaveis = {}) {
  const entrada = TEXTOS[id];
  if (!entrada) return id;
  const texto = entrada[idiomaAtual] || entrada.en;
  return texto.replace(/\{(\w+)\}/g, (marca, chave) => (chave in variaveis ? variaveis[chave] : marca));
}

// true se o identificador tem texto cadastrado (as fases sem fala de derrota, por exemplo, não têm)
function existeTexto(id) {
  return id in TEXTOS;
}