// Caixa de diálogo com retrato. Enquanto estiver aberta, a cena deve pausar a ação.
// retrato: { chave, frame, escala } com a imagem de quem está falando.

const RETRATO_HEROI = { chave: 'heroi-andar', frame: 0, escala: 1.8 };
const RETRATO_BRUXA = { chave: 'vilao-preto', frame: 0, escala: 1.2 };

function mostrarDialogo(cena, nome, texto, aoFechar, retrato = RETRATO_HEROI) {
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
  elementos.push(cena.add.text(106, topo + 28, texto, {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#ffffff',
    wordWrap: { width: 370 }
  }).setDepth(42));
  elementos.push(cena.add.text(470, topo + 62, 'TAP OR ENTER', {
    fontFamily: 'monospace',
    fontSize: '8px',
    color: '#aaaaaa'
  }).setOrigin(1, 0).setDepth(42));

  const fechar = () => {
    cena.input.off('pointerdown', fechar);
    cena.input.keyboard.off('keydown-ENTER', fechar);
    elementos.forEach((e) => e.destroy());
    if (aoFechar) aoFechar();
  };

  // pequena espera para o toque que abriu o diálogo não fechar na hora
  cena.time.delayedCall(300, () => {
    cena.input.on('pointerdown', fechar);
    cena.input.keyboard.on('keydown-ENTER', fechar);
  });
}