// Gera em resources/ as imagens-base do ícone e da splash a partir de assets/Capa.jpg.
// Depois: npx capacitor-assets generate --android
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const raiz = path.join(__dirname, '..');
const capa = path.join(raiz, 'assets', 'Capa.jpg');
const saida = path.join(raiz, 'resources');

// recorte quadrado em volta do eclipse (a capa tem 1376x768)
const LADO = 768;
const ESQUERDA = 330;

async function main() {
  fs.mkdirSync(saida, { recursive: true });

  // cor do céu no topo da capa, para estender o fundo sem emenda
  const { data } = await sharp(capa).extract({ left: 688, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const fundo = { r: data[0], g: data[1], b: data[2], alpha: 1 };

  const recorte = sharp(capa).extract({ left: ESQUERDA, top: 0, width: LADO, height: LADO });

  // ícone completo (legado)
  await recorte.clone().resize(1024, 1024).png().toFile(path.join(saida, 'icon-only.png'));

  // ícone adaptativo: o Android corta ~1/3 das bordas, então o eclipse fica menor e centralizado
  const miolo = await recorte.clone().resize(760, 760).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: fundo } })
    .composite([{ input: miolo, left: 132, top: 132 }])
    .png()
    .toFile(path.join(saida, 'icon-foreground.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: fundo } })
    .png()
    .toFile(path.join(saida, 'icon-background.png'));

  // splash: a capa inteira no meio de um quadrado (o app é só horizontal, o recorte central é a capa)
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
