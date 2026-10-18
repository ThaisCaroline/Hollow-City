// Carregamento e reprodução de sons. Os sons são definidos em SONS (config.js).

function carregarSons(cena) {
  for (const [nome, arquivo] of Object.entries(SONS)) {
    cena.load.audio(nome, arquivo);
  }
}

// efeito curto: toca uma vez a cada chamada
function tocarSom(cena, nome, volume = 0.9) {
  // se o arquivo não foi carregado, o jogo segue sem som em vez de travar
  if (cena.cache.audio.exists(nome)) {
    cena.sound.play(nome, { volume });
  }
}

// sorteia um som da lista, sem repetir o último tocado
function tocarSomAleatorio(cena, nomes, volume = 0.9) {
  if (nomes.length === 0) return;
  let escolhido;
  do {
    escolhido = Phaser.Utils.Array.GetRandom(nomes);
  } while (nomes.length > 1 && escolhido === cena.ultimoSomAleatorio);
  cena.ultimoSomAleatorio = escolhido;
  tocarSom(cena, escolhido, volume);
}

// música de fundo: em loop, começa no primeiro toque, clique ou tecla na página
function tocarMusica(cena, nome, volume = 0.12) {
  if (!cena.cache.audio.exists(nome)) return;
  if (!cena.musica) cena.musica = cena.sound.add(nome, { loop: true, volume });

  const eventos = ['keydown', 'pointerdown', 'touchstart'];

  const iniciar = () => {
    // remove os ouvintes para a música não tentar iniciar várias vezes
    eventos.forEach((e) => window.removeEventListener(e, iniciar));

    // o navegador pode deixar o contexto de áudio suspenso até o primeiro gesto
    const ctx = cena.sound.context;
    if (ctx && ctx.state === 'suspended') ctx.resume();

    if (!cena.musica.isPlaying) cena.musica.play();
  };

  eventos.forEach((e) => window.addEventListener(e, iniciar));
}