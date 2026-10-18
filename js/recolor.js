// Troca cores do sprite (ex.: vermelho -> preto) e recorta os quadros da animação
function recolorir(cena, origem, destino, trocas, larguraQuadro, alturaQuadro) {
  const img = cena.textures.get(origem).getSourceImage();
  const tex = cena.textures.createCanvas(destino, img.width, img.height);
  const ctx = tex.getContext();
  ctx.drawImage(img, 0, 0);

  const dados = ctx.getImageData(0, 0, img.width, img.height);
  const p = dados.data;
  for (let i = 0; i < p.length; i += 4) {
    const nova = trocas[`${p[i]},${p[i + 1]},${p[i + 2]}`];
    if (p[i + 3] > 0 && nova) {
      p[i] = nova[0];
      p[i + 1] = nova[1];
      p[i + 2] = nova[2];
    }
  }
  ctx.putImageData(dados, 0, 0);

  const quadros = img.width / larguraQuadro;
  for (let i = 0; i < quadros; i++) {
    tex.add(i, 0, i * larguraQuadro, 0, larguraQuadro, alturaQuadro);
  }
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  tex.refresh();
}

// cores da capa do vilão (a Morte) para deixá-la preta
const CAPA_PRETA = {
  '109,5,29': [28, 28, 36],
  '172,10,27': [46, 46, 58],
  '214,36,17': [70, 70, 84]
};