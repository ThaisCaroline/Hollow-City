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

// música de fundo: guardada no jogo inteiro, em loop, e não reinicia ao trocar de cena
function tocarMusica(cena, nome, volume = 0.12) {
  const jogo = cena.game;
  if (!jogo.cache.audio.exists(nome)) return;
  if (!jogo.musicaFundo) jogo.musicaFundo = jogo.sound.add(nome, { loop: true, volume });

  const tocar = () => {
    if (!jogo.musicaFundo.isPlaying) jogo.musicaFundo.play();
  };

  // se o navegador ainda bloqueia o áudio, espera a liberação
  if (jogo.sound.locked) {
    jogo.sound.once(Phaser.Sound.Events.UNLOCKED, tocar);
  } else {
    tocar();
  }
}