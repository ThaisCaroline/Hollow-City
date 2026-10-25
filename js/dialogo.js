// Caixa de diálogo com retrato. Enquanto estiver aberta, a cena deve pausar a ação.
// retrato: { chave, frame, escala } com a imagem de quem está falando.
// Modo devagar (opcoes.devagar, ou a cena com dialogoDevagar ligado): a caixa aparece com fade e o texto entra letra por letra.
// Um toque completa a fala na hora, e o toque seguinte fecha a caixa. Fora desse modo, a caixa aparece inteira e um toque fecha.

const RETRATO_HEROI = { chave: 'heroi-andar', frame: 0, escala: 1.8 };
const RETRATO_BRUXA = { chave: 'vilao-preto', frame: 0, escala: 1.2 };

const DIALOGO_FADE = 700;          // ms: tempo da caixa aparecendo (modo devagar)
const DIALOGO_MS_POR_LETRA = 70;   // ms entre uma letra e a seguinte (modo devagar)

function mostrarDialogo(cena, nome, texto, aoFechar, retrato = RETRATO_HEROI, opcoes = {}) {
  const devagar = !!(opcoes.devagar || cena.dialogoDevagar);
  const topo = 4;
  const elementos = [];

  elementos.push(cena.add.rectangle(256, topo + 36, 480, 72, 0x000000, 0.88)
    .setStrokeStyle(2, 0xff8a00).setDepth(40));
  elementos.push(cena.add.rectangle(58, topo + 36, 64, 64, 0x222222)
    .setStrokeStyle(2, 0xff8a00).setDepth(41));
  elementos.push(cena.add.sprite(58, topo + 36, retrato.chave, retrato.frame)
    .setScale(retrato.escala).setDepth(42));
  elementos.push(cena.add.text(106, topo + 12, nome, {
    fontFamily: 'monospace',
    fontSize: '10px',
    fontStyle: 'bold',
    color: '#ff8a00'
  }).setDepth(42));

  const textoDialogo = cena.add.text(106, topo + 28, texto, {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#ffffff',
    wordWrap: { width: 370 }
  }).setDepth(42);
  elementos.push(textoDialogo);

  const dica = cena.add.text(470, topo + 62, 'TAP OR ENTER', {
    fontFamily: 'monospace',
    fontSize: '8px',
    color: '#aaaaaa'
  }).setOrigin(1, 0).setDepth(42);
  elementos.push(dica);

  let digitando = false;   // true enquanto o texto ainda está sendo escrito (modo devagar)
  let letras = null;       // o relógio que escreve uma letra de cada vez
  let completo = texto;

  // escreve a fala inteira de uma vez e mostra a dica de toque
  const terminarDigitacao = () => {
    if (!digitando) return;
    digitando = false;
    if (letras) letras.remove();
    textoDialogo.setText(completo);
    cena.tweens.add({ targets: dica, alpha: 1, duration: 400 });
  };

  if (devagar) {
    // a caixa aparece com fade (a dica espera a fala terminar)
    const caixa = elementos.filter((e) => e !== dica);
    caixa.forEach((e) => e.setAlpha(0));
    cena.tweens.add({ targets: caixa, alpha: 1, duration: DIALOGO_FADE });

    // quebra as linhas antes, para a frase não pular de linha enquanto é escrita
    completo = textoDialogo.getWrappedText(texto).join('\n');
    textoDialogo.setText('');
    dica.setAlpha(0);
    digitando = true;

    // começa a escrever quando a caixa terminou de aparecer
    let escritas = 0;
    cena.time.delayedCall(DIALOGO_FADE, () => {
      if (!digitando) return;
      letras = cena.time.addEvent({
        delay: DIALOGO_MS_POR_LETRA,
        repeat: completo.length - 1,
        callback: () => {
          escritas++;
          textoDialogo.setText(completo.slice(0, escritas));
          if (escritas >= completo.length) terminarDigitacao();
        }
      });
    });
  }

  // enquanto escreve, o toque completa a fala; depois, fecha a caixa
  const aoToque = () => {
    if (digitando) {
      terminarDigitacao();
      return;
    }
    fechar();
  };

  const fechar = () => {
    cena.input.off('pointerdown', aoToque);
    cena.input.keyboard.off('keydown-ENTER', aoToque);
    digitando = false;
    if (letras) letras.remove();
    cena.tweens.killTweensOf(elementos);
    elementos.forEach((e) => e.destroy());
    if (aoFechar) aoFechar();
  };

  // pequena espera para o toque que abriu o diálogo não fechar na hora
  cena.time.delayedCall(300, () => {
    cena.input.on('pointerdown', aoToque);
    cena.input.keyboard.on('keydown-ENTER', aoToque);
  });
}