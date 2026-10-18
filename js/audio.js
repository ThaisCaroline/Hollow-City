// Carregamento e reprodução de sons. Os sons são definidos em SONS (config.js).

function carregarSons(cena) {
  for (const [nome, arquivo] of Object.entries(SONS)) {
    cena.load.audio(nome, arquivo);
  }
}

// efeito curto: toca uma vez a cada chamada
function tocarSom(cena, nome, volume = 0.6) {
  // se o arquivo não foi carregado, o jogo segue sem som em vez de travar
  if (cena.cache.audio.exists(nome)) {
    cena.sound.play(nome, { volume });
  }
}

// sorteia um som da lista, sem repetir o último tocado
function tocarSomAleatorio(cena, nomes, volume = 0.6) {
  if (nomes.length === 0) return;
  let escolhido;
  do {
    escolhido = Phaser.Utils.Array.GetRandom(nomes);
  } while (nomes.length > 1 && escolhido === cena.ultimoSomAleatorio);
  cena.ultimoSomAleatorio = escolhido;
  tocarSom(cena, escolhido, volume);
}

// música de fundo: em loop, e não duplica ao reiniciar a luta
function tocarMusica(cena, nome, volume = 0.3) {
  if (!cena.cache.audio.exists(nome)) return;
  if (!cena.musica) cena.musica = cena.sound.add(nome, { loop: true, volume });
  if (!cena.musica.isPlaying) cena.musica.play();
}