// Copia só o que o jogo precisa para www/ (pasta que o Capacitor empacota no app).
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'www');
const itens = ['index.html', 'sprites.js', 'js', 'assets'];

fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);
for (const item of itens) {
  fs.cpSync(path.join(raiz, item), path.join(destino, item), { recursive: true });
}
console.log('www/ atualizado:', itens.join(', '));
