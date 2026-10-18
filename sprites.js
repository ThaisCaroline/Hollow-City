// K = preto, G = cinza (dobras da capa e faixa do chapéu), O = LED laranja
const CORES = { K: '#14141c', G: '#3a3a4a', O: '#ff8a00' };

const VILAO = [
  "......KKKKKKKK......",
  "......KKKKKKKK......",
  "......GGGGGGGG......",
  "...KKKKKKKKKKKKKK...",
  ".....KKKKKKKKKK.....",
  ".....KOKOKKOKOK.....",
  ".....KKOKKKKOKK.....",
  ".....KOKOKKOKOK.....",
  ".....KKKKKKKKKK.....",
  ".....KOOOOOOOOK.....",
  ".....KOKOKOKOKK.....",
  "......KKKKKKKK......",
  "....KKKKKKKKKKKK....",
  "...KKGKKKKKKKKGKK...",
  "..KKGKKKKKKKKKKGKK..",
  "..KKGKKKKKKKKKKGKK..",
  "..KKGKKKKKKKKKKGKK..",
  "..KKKGKKKKKKKKGKKK..",
  "..KKKGKKKKKKKKGKKK..",
  "..KKKKGKKKKKKGKKKK..",
  "..KKKKGKKKKKKGKKKK..",
  "..KKKKKGKKKKGKKKKK..",
  "..KKKKKGKKKKGKKKKK..",
  "..KKKKKKGKKGKKKKKK..",
  "...KKKKKKKKKKKKKK...",
  "....KKKKKKKKKKKK....",
  ".....KKKK..KKKK.....",
  ".....KKKK..KKKK.....",
  ".....KKKK..KKKK.....",
  ".....KKKK..KKKK.....",
  ".....KKKK..KKKK.....",
  "....KKKKK..KKKKK...."
];

function criarTextura(cena, chave, grade) {
  const tex = cena.textures.createCanvas(chave, grade[0].length, grade.length);
  const ctx = tex.getContext();
  grade.forEach((linha, y) => {
    [...linha].forEach((letra, x) => {
      if (CORES[letra]) {
        ctx.fillStyle = CORES[letra];
        ctx.fillRect(x, y, 1, 1);
      }
    });
  });
  tex.refresh();
}