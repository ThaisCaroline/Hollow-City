// Copia para www/ (pasta que o Capacitor empacota no app) só os arquivos do jogo
// que estão versionados no git. Assim áudios e imagens soltos, ainda não commitados,
// não inflam o APK.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'www');
const itens = ['index.html', 'sprites.js', 'js', 'assets'];

const arquivos = execFileSync('git', ['ls-files', '-z', '--', ...itens], { cwd: raiz, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((arquivo) => fs.existsSync(path.join(raiz, arquivo)));

fs.rmSync(destino, { recursive: true, force: true });
for (const arquivo of arquivos) {
  const saida = path.join(destino, arquivo);
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.copyFileSync(path.join(raiz, arquivo), saida);
}
console.log(`www/ atualizado: ${arquivos.length} arquivos`);
