// Gera em resources/ as imagens-base do ícone (a partir de assets/tumbBoss.png, o Sun Devourer
// no trono) e da splash (a partir de assets/Capa.jpg).
// Depois: npx capacitor-assets generate --android --assetPath resources
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const raiz = path.join(__dirname, '..');
const capa = path.join(raiz, 'assets', 'Capa.jpg');
const boss = path.join(raiz, 'assets', 'tumbBoss.png');
const saida = path.join(raiz, 'resources');

// recorte quadrado do boss (tumbBoss.png tem 300x353) em volta do halo e do rosto
const BOSS_LADO = 190;
const BOSS_ESQUERDA = 55;
const BOSS_TOPO = 70;

// ícone: boss ampliado sem borrar o pixel art, mais claro, com brilho laranja atrás do halo
async function iconeDoBoss() {
  const recorte = await sharp(boss)
    .flatten({ background: '#0b1410' })
    .extract({ left: BOSS_ESQUERDA, top: BOSS_TOPO, width: BOSS_LADO, height: BOSS_LADO })
    .resize(BOSS_LADO * 6, BOSS_LADO * 6, { kernel: 'nearest' })
    .toBuffer();
  const brilho = Buffer.from(
    `<svg width="1024" height="1024"><defs><radialGradient id="g" cx="50%" cy="38%" r="55%">` +
      `<stop offset="0%" stop-color="#ff8a1f" stop-opacity="0.55"/>` +
      `<stop offset="60%" stop-color="#ff5a00" stop-opacity="0.15"/>` +
      `<stop offset="100%" stop-color="#ff5a00" stop-opacity="0"/>` +
      `</radialGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`
  );
  return sharp(recorte)
    .resize(1024, 1024, { kernel: 'lanczos3' })
    .modulate({ brightness: 1.45, saturation: 1.3 })
    .linear(1.12, -6)
    .composite([{ input: brilho, blend: 'screen' }])
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(saida, { recursive: true });
  fs.mkdirSync(path.join(saida, 'loja'), { recursive: true });

  const icone = await iconeDoBoss();

  // ícone completo (legado) e o de 512x512 da Play Store
  await sharp(icone).toFile(path.join(saida, 'icon-only.png'));
  await sharp(icone).resize(512, 512, { kernel: 'lanczos3' }).png().toFile(path.join(saida, 'loja', 'icone-512.png'));

  // ícone adaptativo: o Android corta ~1/3 das bordas, então o boss fica a 80% e o resto do
  // quadro é preenchido pelo próprio ícone desfocado (sem emenda visível)
  const fundoDesfocado = await sharp(icone).blur(40).modulate({ brightness: 0.7 }).png().toBuffer();
  const miolo = await sharp(icone).resize(820, 820, { kernel: 'lanczos3' }).png().toBuffer();
  await sharp(fundoDesfocado).png().toFile(path.join(saida, 'icon-background.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: miolo, left: 102, top: 102 }])
    .png()
    .toFile(path.join(saida, 'icon-foreground.png'));

  // splash: a capa inteira no meio de um quadrado (o app é só horizontal, o recorte central é a capa)
  const { data } = await sharp(capa).extract({ left: 688, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const fundo = { r: data[0], g: data[1], b: data[2], alpha: 1 };
  const largura = 2732;
  const altura = Math.round((largura * 768) / 1376);
  const capaGrande = await sharp(capa).resize(largura, altura).png().toBuffer();
  const splash = sharp({ create: { width: largura, height: largura, channels: 4, background: fundo } })
    .composite([{ input: capaGrande, left: 0, top: Math.round((largura - altura) / 2) }])
    .png();
  await splash.clone().toFile(path.join(saida, 'splash.png'));
  await splash.clone().toFile(path.join(saida, 'splash-dark.png'));

  console.log('resources/ gerado');
}

main();
