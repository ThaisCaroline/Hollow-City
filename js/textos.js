// Textos do jogo, no estilo do strings.xml do Android: cada texto tem um identificador e uma versão por idioma.
// Uso: traduzir('luta1.detetive'). Se faltar a tradução, cai no inglês; se o identificador não existir, aparece o próprio identificador.
// Variáveis: traduzir('final.obrigado', { nome: 'Ana' }) troca {nome} dentro do texto.
// Listas (as dicas do bestiário): traduzirLista('bestiario.bruxa.dicas') devolve um array de textos.
// Idioma: se o jogador já escolheu na tela inicial, vale a escolha (guardada no aparelho); senão vale o idioma do aparelho
// (qualquer português, como pt-BR, abre em português; o resto abre em inglês). Troca por definirIdioma('pt').
//
// Identificadores das lutas: luta1 a luta4 (a ordem do mapa), com .nome, .detetive, .vilao e, se a fase tiver, .derrota.

const IDIOMAS = ['en', 'pt'];
const CHAVE_IDIOMA = 'hollowcity.idioma';

// idioma salvo pelo jogador; se não houver (ou o aparelho não deixar ler), o idioma do aparelho
function detectarIdioma() {
  try {
    const salvo = window.localStorage.getItem(CHAVE_IDIOMA);
    if (IDIOMAS.includes(salvo)) return salvo;
  } catch (erro) { /* sem acesso ao armazenamento: segue para o idioma do aparelho */ }

  const lingua = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  return String(lingua).toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

let idiomaAtual = detectarIdioma();   // 'en' ou 'pt'

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

  // itens: o pensamento do detetive ao pegar o que o vilão deixou cair (poção, soco inglês, balas de prata)
  'item.pocao': { en: 'This might come in handy.', pt: 'Isso pode ser útil.' },
  'item.soco': { en: 'He broke doors with these.', pt: 'Ele quebrava portas com isto.' },
  'item.balas': { en: 'Silver... He knew what he was becoming.', pt: 'Prata... Ele sabia no que estava se tornando.' },

  // mapa: o nome do lugar de cada luta
  'mapa.lugar1': { en: 'WHISPER ALLEY', pt: 'BECO DOS SUSSURROS' },
  'mapa.lugar2': { en: 'OLD CHURCH', pt: 'IGREJA VELHA' },
  'mapa.lugar3': { en: 'PINE STREET', pt: 'RUA DOS PINHEIROS' },
  'mapa.lugar4': { en: "DEVOURER'S CASTLE", pt: 'CASTELO DO DEVORADOR' },

  // final: os slides com a manhã chegando; o último mostra THE END e o agradecimento com o nome do jogador
  'final.1': { en: 'The eclipse cracks...', pt: 'O eclipse racha...' },
  'final.2': {
    en: 'The creatures that watched turn from the light, and are gone.',
    pt: 'As criaturas que assistiam viram as costas para a luz e somem.'
  },
  'final.3': {
    en: 'Some of these doors will never open again.',
    pt: 'Algumas dessas portas nunca mais vão se abrir.'
  },
  'final.4': { en: 'The sun is back...', pt: 'O sol voltou...' },
  'final.5': {
    en: 'The survivors find their courage... and step outside, after so long...',
    pt: 'Os sobreviventes tomam coragem... e saem de casa, depois de tanto tempo...'
  },
  'final.fim': { en: 'THE END', pt: 'FIM' },
  'final.obrigado': { en: 'Thanks for playing, {nome}!', pt: 'Obrigado por jogar, {nome}!' },
  'final.amigo': { en: 'friend', pt: 'jogador' },
  'final.desenvolvido': { en: 'DEVELOPED BY', pt: 'DESENVOLVIDO POR' },

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
  },

  // tela inicial
  'inicio.tocar': { en: 'TAP TO START', pt: 'TOQUE PARA COMEÇAR' },
  'inicio.legenda_celular': {
    en: 'USE THE ON-SCREEN BUTTONS\nLEFT: MOVE   RIGHT: JUMP, DASH AND ATTACK',
    pt: 'USE OS BOTÕES NA TELA\nESQUERDA: ANDAR   DIREITA: PULAR, DASH E ATACAR'
  },
  'inicio.legenda_teclado': {
    en: 'ARROWS: MOVE   UP / SPACE: JUMP   DOWN: CROUCH   SHIFT: DASH\nZ: PUNCH   X: SHOOT   C: POTION',
    pt: 'SETAS: ANDAR   CIMA / ESPAÇO: PULAR   BAIXO: AGACHAR   SHIFT: DASH\nZ: SOCO   X: TIRO   C: POÇÃO'
  },
  'inicio.rankings': { en: 'RANKINGS', pt: 'RANKINGS' },
  'inicio.bestiario': { en: 'BESTIARY', pt: 'BESTIÁRIO' },
  'aviso.girar': { en: 'ROTATE YOUR DEVICE', pt: 'GIRE O APARELHO' },

  // botões e avisos que se repetem
  'ui.voltar': { en: 'BACK', pt: 'VOLTAR' },
  'ui.tocar_pular': { en: 'TAP TO SKIP', pt: 'TOQUE PARA PULAR' },
  'ui.pular_tudo': { en: 'SKIP ALL >>', pt: 'PULAR TUDO >>' },
  'ui.tocar_enter': { en: 'TAP OR ENTER', pt: 'TOQUE OU ENTER' },
  'ui.tocar_voltar': { en: 'TAP OR ENTER TO RETURN', pt: 'TOQUE OU ENTER PARA VOLTAR' },
  'ui.tocar_continuar_enter': { en: 'TAP OR ENTER TO CONTINUE', pt: 'TOQUE OU ENTER PARA CONTINUAR' },
  'ui.tocar_continuar': { en: 'TAP TO CONTINUE', pt: 'TOQUE PARA CONTINUAR' },
  'ui.carregando': { en: 'LOADING...', pt: 'CARREGANDO...' },
  'ui.ranking_offline': { en: 'RANKING OFFLINE', pt: 'RANKING OFFLINE' },
  'ui.sem_registros': { en: 'NO RECORDS YET', pt: 'AINDA SEM REGISTROS' },

  // tela do nome
  'nome.quem_joga': { en: 'WHO IS PLAYING?', pt: 'QUEM VAI JOGAR?' },
  'nome.comecar': { en: 'START', pt: 'COMEÇAR' },
  'nome.campo': { en: 'YOUR NAME', pt: 'SEU NOME' },
  'nome.digite': { en: 'ENTER A NAME', pt: 'DIGITE UM NOME' },

  // mapa
  'mapa.fase': { en: 'STAGE {n}', pt: 'FASE {n}' },
  'mapa.repetir': { en: 'CLICK TO REPLAY', pt: 'CLIQUE PARA REPETIR' },
  'mapa.entrar': { en: 'CLICK TO ENTER', pt: 'CLIQUE PARA ENTRAR' },
  'mapa.trancado': { en: 'LOCKED', pt: 'TRANCADO' },
  'mapa.final': { en: 'ENDING', pt: 'FINAL' },

  // ranking da fase e tela de rankings
  'ranking.concluida': { en: 'FIGHT {n} CLEARED', pt: 'LUTA {n} CONCLUÍDA' },
  'ranking.seu_tempo': { en: 'YOUR TIME: {tempo}', pt: 'SEU TEMPO: {tempo}' },
  'ranking.top': { en: 'TOP 15 - FIGHT {n}', pt: 'TOP 15 - LUTA {n}' },
  'ranking.titulo': { en: 'RANKINGS', pt: 'RANKINGS' },
  'ranking.aba_geral': { en: 'FULL RUN', pt: 'JOGO TODO' },
  'ranking.aba_luta': { en: 'FIGHT {n}', pt: 'LUTA {n}' },

  // tempo (o ponto decimal vira vírgula em português, dentro de formatarTempo)
  'tempo.segundos': { en: 'seconds', pt: 'segundos' },
  'tempo.minuto': { en: 'minute', pt: 'minuto' },
  'tempo.minutos': { en: 'minutes', pt: 'minutos' },

  // luta: barras, avisos que sobem da cabeça dos personagens e dicas
  'luta.heroi': { en: 'HERO', pt: 'HERÓI' },
  'luta.mova_direita': { en: 'MOVE RIGHT  >>>', pt: 'ANDE PARA A DIREITA  >>>' },
  'luta.municao': { en: 'AMMO {n}', pt: 'BALAS {n}' },
  'luta.virada': { en: 'COMEBACK!', pt: 'VIRADA!' },
  'luta.errou': { en: 'MISS', pt: 'ERROU' },
  'luta.bloqueado': { en: 'BLOCKED', pt: 'BLOQUEADO' },
  'luta.curado': { en: 'HEALED!', pt: 'CURADO!' },
  'luta.pocao': { en: 'POTION!', pt: 'POÇÃO!' },
  'luta.interrompido': { en: 'INTERRUPTED!', pt: 'INTERROMPIDO!' },
  'luta.esquiva': { en: 'DODGE!', pt: 'ESQUIVOU!' },
  'luta.furia': { en: 'RAGE!', pt: 'FÚRIA!' },
  'luta.nocaute': { en: 'K.O.!!!!', pt: 'K.O.!!!!' },
  'luta.perfeito_ponto': { en: 'PERFECT!', pt: 'PERFEITO!' },
  'luta.perfeito': { en: 'PERFECT', pt: 'PERFEITO' },

  // fim de jogo (derrota)
  'derrota.titulo': { en: 'GAME OVER', pt: 'FIM DE JOGO' },
  'derrota.jogar': { en: 'PLAY AGAIN', pt: 'JOGAR DE NOVO' },
  'derrota.mapa': { en: 'BACK TO MAP', pt: 'VOLTAR AO MAPA' },
  'derrota.dificil': { en: 'TOO HARD?', pt: 'MUITO DIFÍCIL?' },

  // seletor de idioma (cada um escrito no próprio idioma)
  'idioma.en': { en: 'EN', pt: 'EN' },
  'idioma.pt': { en: 'PT', pt: 'PT' },

  // palavras que aparecem ao lado do botão desenhado nas dicas do bestiário ({JUMP}, {DUCK}, {PUNCH}, {SHOOT}, {POTION})
  'botao.JUMP': { en: 'JUMP', pt: 'PULE' },
  'botao.DUCK': { en: 'DUCK', pt: 'ABAIXE' },
  'botao.PUNCH': { en: 'PUNCH', pt: 'SOQUE' },
  'botao.SHOOT': { en: 'SHOOT', pt: 'ATIRE' },
  'botao.POTION': { en: 'POTION', pt: 'POÇÃO' },

  // bestiário: nome, lenda e dicas de cada boss
  'bestiario.bruxa.nome': { en: 'WITCH', pt: 'BRUXA' },
  'bestiario.bruxa.lenda': {
    en: 'No one has seen her face, only the cold orange glow of the mask. She drifts through the ruins of Hollow City at night, whispering names from the empty windows. Whoever follows the whisper is never seen again: their ghosts circle her flame, and the mask burns brighter for each one.',
    pt: 'Ninguém viu o rosto dela, só o brilho laranja e frio da máscara. Ela flutua à noite pelas ruínas de Hollow City, sussurrando nomes das janelas vazias. Quem segue o sussurro nunca mais é visto: os fantasmas deles giram em volta da sua chama, e a máscara queima mais forte a cada um.'
  },
  'bestiario.bruxa.dicas': {
    en: [
      '{JUMP} over her fireball strike.',
      'When she sinks into the puddle, turn around: she rises behind you.',
      '{PUNCH} her as she appears, and hit her twice while she drinks to spoil the potion.'
    ],
    pt: [
      '{JUMP} sobre o golpe de bola de fogo dela.',
      'Quando ela afundar na poça, vire-se: ela surge atrás de você.',
      '{PUNCH} nela quando ela aparecer, e acerte-a duas vezes enquanto ela bebe, para estragar a poção.'
    ]
  },
  'bestiario.ogro.nome': { en: 'OGRE', pt: 'OGRO' },
  'bestiario.ogro.lenda': {
    en: 'Once a quiet brute of the slaughterhouse district, now he stalks the dead streets with a club that never dries. Bones rattle on his belt for every door he has broken. He roars the townsfolk out of hiding, and the abandoned church is where he drags them. Wherever he stomps, the cobblestones crack and the dogs fall silent.',
    pt: 'Antes um bruto calado do distrito do matadouro, agora ele percorre as ruas mortas com uma clava que nunca seca. Ossos chacoalham no cinto dele, um para cada porta que arrombou. Ele ruge e tira os moradores do esconderijo, e a igreja abandonada é para onde ele os arrasta. Onde ele pisa, as pedras racham e os cães se calam.'
  },
  'bestiario.ogro.dicas': {
    en: [
      '{DUCK} or {JUMP} the club.',
      '{JUMP} the stomp.',
      'When he crosses his arms, stop punching: {SHOOT} him instead, and brace for a harder stomp.',
      'He may leap over your bullets.'
    ],
    pt: [
      '{DUCK} ou {JUMP} da clava.',
      '{JUMP} do pisão.',
      'Quando ele cruzar os braços, pare de socar: {SHOOT} nele, e prepare-se para um pisão mais forte.',
      'Ele pode saltar sobre as suas balas.'
    ]
  },
  'bestiario.lobisomem.nome': { en: 'WEREWOLF', pt: 'LOBISOMEM' },
  'bestiario.lobisomem.lenda': {
    en: "By day, a thin and silent neighbor behind a boarded window. When the full moon rises, he crawls into the empty streets of the abandoned town, hunting anyone who dares to walk home alone. The claw marks on the doors of Hollow City are his signature, and only his master's whistle can call him back.",
    pt: 'De dia, um vizinho magro e calado atrás de uma janela vedada com tábuas. Quando a lua cheia nasce, ele rasteja pelas ruas vazias da cidade abandonada, caçando quem se atreve a voltar sozinho para casa. As marcas de garras nas portas de Hollow City são a assinatura dele, e só o assobio do mestre pode chamá-lo de volta.'
  },
  'bestiario.lobisomem.dicas': {
    en: [
      '{DUCK} his claw swipe.',
      '{JUMP} over his charge as he runs through you.',
      'When he curls up, {SHOOT} him: punches fail.',
      'Past half health he enters a RAGE, so stay sharp.'
    ],
    pt: [
      '{DUCK} do golpe de garra dele.',
      '{JUMP} sobre a investida dele quando ele passar correndo por você.',
      'Quando ele se encolher, {SHOOT} nele: os socos falham.',
      'Com menos da metade da vida ele entra em FÚRIA, então fique atento.'
    ]
  },
  'bestiario.devorador.nome': { en: 'SUN DEVOURER', pt: 'DEVORADOR DE SOL' },
  'bestiario.devorador.lenda': {
    en: 'Long ago the sun went dark over Hollow City, and a black eclipse took its place on a throne of thorns. He feeds on light, warmth and hope. Every window that goes dark was a meal. He sends his beasts to empty the streets, then calls the survivors to his hall, one by one.',
    pt: 'Há muito tempo o sol se apagou sobre Hollow City, e um eclipse negro tomou o lugar dele num trono de espinhos. Ele se alimenta de luz, calor e esperança. Cada janela que se apaga foi uma refeição. Ele manda as suas feras esvaziarem as ruas e depois chama os sobreviventes ao seu salão, um por um.'
  },
  'bestiario.devorador.dicas': {
    en: [
      '{DUCK} his punch.',
      '{DUCK} or {JUMP} his fireballs.',
      '{SHOOT} him from afar: you have 10 silver bullets.',
      'He blinks in flames when you punch up close: strike as he reappears.',
      'Drink your {POTION} when you need it.'
    ],
    pt: [
      '{DUCK} do soco dele.',
      '{DUCK} ou {JUMP} das bolas de fogo dele.',
      '{SHOOT} nele de longe: você tem 10 balas de prata.',
      'Ele some em chamas quando você soca de perto: ataque quando ele reaparecer.',
      'Beba a sua {POTION} quando precisar.'
    ]
  },
  'bestiario.devorador2.nome': { en: 'SUN DEVOURER: SECOND FORM', pt: 'DEVORADOR DE SOL: 2ª FORMA' },
  'bestiario.devorador2.lenda': {
    en: 'When his shell breaks, the darkness does not die: it hardens. He rises in armor of black glass, veined with molten red, a crown of fire burning between his horns. The cracks in the street glow where he walks, and whatever still stands begins to burn.',
    pt: 'Quando a casca dele quebra, a escuridão não morre: ela endurece. Ele se ergue numa armadura de vidro negro, cortada por veios de vermelho derretido, uma coroa de fogo queimando entre os chifres. As rachaduras na rua brilham por onde ele anda, e tudo o que ainda está de pé começa a queimar.'
  },
  'bestiario.devorador2.dicas': {
    en: [
      '{DUCK} his punch.',
      '{JUMP} his sweep kick.',
      'After the kick, he backs off to throw a fireball: {DUCK} or {JUMP}.',
      'Corner him and he blinks in flames behind you.',
      'Save a {POTION}, and {SHOOT} him while he backs off.'
    ],
    pt: [
      '{DUCK} do soco dele.',
      '{JUMP} da rasteira dele.',
      'Depois da rasteira, ele recua para lançar uma bola de fogo: {DUCK} ou {JUMP}.',
      'Encurrale-o e ele some em chamas atrás de você.',
      'Guarde uma {POTION} e {SHOOT} nele enquanto ele recua.'
    ]
  }
};

// troca o idioma, guarda a escolha no aparelho e atualiza os textos da página HTML
function definirIdioma(codigo) {
  if (!IDIOMAS.includes(codigo)) return;
  idiomaAtual = codigo;
  try { window.localStorage.setItem(CHAVE_IDIOMA, codigo); } catch (erro) { /* sem armazenamento: vale só nesta sessão */ }
  aplicarIdiomaNoHtml();
}

// os textos que ficam no index.html (fora do jogo): o aviso de girar o aparelho e o idioma da página
function aplicarIdiomaNoHtml() {
  document.documentElement.lang = idiomaAtual === 'pt' ? 'pt-BR' : 'en';
  const aviso = document.getElementById('aviso-girar');
  if (aviso) aviso.textContent = traduzir('aviso.girar');
}

// devolve o texto no idioma atual (ou em inglês, se faltar a tradução)
function traduzir(id, variaveis = {}) {
  const entrada = TEXTOS[id];
  if (!entrada) return id;
  const texto = entrada[idiomaAtual] || entrada.en;
  return texto.replace(/\{(\w+)\}/g, (marca, chave) => (chave in variaveis ? variaveis[chave] : marca));
}

// devolve uma lista de textos no idioma atual (as dicas do bestiário); sem a tradução, usa o inglês
function traduzirLista(id) {
  const entrada = TEXTOS[id];
  if (!entrada) return [];
  return entrada[idiomaAtual] || entrada.en;
}

// true se o identificador tem texto cadastrado (as fases sem fala de derrota, por exemplo, não têm)
function existeTexto(id) {
  return id in TEXTOS;
}

aplicarIdiomaNoHtml();