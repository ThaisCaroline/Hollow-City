// Luta: os fantasmas que ficam atrás da bruxa (as almas que ela prendeu). Só enfeite: não acertam nem são acertados.
// Cada fase liga isso com `fantasmas: { ... }` na configuração (ver fases/fase1.js) e com os sons almaInicio, almaPocao e almaMorte.
// Os métodos são copiados para a CenaLuta no game.js, então o this é a cena.

const VOLUME_ALMAS = 0.25;             // os sussurros ficam baixos, de fundo (se ainda estiver alto, baixe este número)
const PROFUNDIDADE_FANTASMAS = -5;     // sempre atrás do herói e do vilão (que ficam em 0) e na frente do cenário (que fica em -10)
const SEGUIR_PX_POR_S = 20;            // velocidade com que os fantasmas vão atrás dela (ela anda a 45 na entrada): bem devagar
const DISTANCIA_ATRAS = 60;            // o centro da órbita fica esta distância atrás dela (do lado oposto ao herói)
const PRIMEIRO_SUSSURRO_MS = 7000;     // no combate, o primeiro sussurro extra vem depois disto
const SUSSURRO_MIN_MS = 8000;          // depois, um sussurro extra a cada 8 a 12 s
const SUSSURRO_MAX_MS = 12000;

class LutaFantasmas {
  // cria os fantasmas; chamado no create, antes do herói e do vilão, para ficarem atrás dos dois
  criarFantasmas() {
    this.fantasmas = [];
    this.fantasmasApagando = false;
    this.proximoSussurro = null;      // sorteado quando o combate começa
    this.ultimoSussurro = null;       // o último som tocado, para não repetir o mesmo duas vezes seguidas
    const c = this.cfg.fantasmas;
    if (!c || !this.textures.exists(c.textura)) return;

    this.fantasmasTempo = 0;
    this.fantasmasCentroX = this.cfg.inicioVilao || 360;
    this.fantasmasJaApareceram = false;                    // true depois do primeiro quadro em que a bruxa aparece
    for (let i = 0; i < c.quantidade; i++) {
      const sprite = this.add.image(0, c.altura, c.textura).setScale(c.escala).setAlpha(c.alpha).setDepth(PROFUNDIDADE_FANTASMAS).setVisible(false);
      this.fantasmas.push({ sprite, fase: (i / c.quantidade) * Math.PI * 2 });
    }
  }

  // gira, flutua e pulsa a cada quadro (chamado pelo update, também durante a entrada e os diálogos)
  atualizarFantasmas(delta) {
    if (!this.fantasmas || !this.fantasmas.length || this.fantasmasApagando || !this.vilao) return;

    const c = this.cfg.fantasmas;
    this.fantasmasTempo += delta / 1000;
    const t = this.fantasmasTempo;

    // o lugar deles é atrás dela: do lado oposto ao herói (ela olha para o herói)
    const atras = this.heroi && this.heroi.x < this.vilao.x ? 1 : -1;
    const alvoX = this.vilao.x + atras * DISTANCIA_ATRAS;

    // quando a bruxa aparece (entrando de fora da tela), os fantasmas já nascem junto com ela, atrás dela
    if (this.vilao.visible && !this.fantasmasJaApareceram) {
      this.fantasmasJaApareceram = true;
      this.fantasmasCentroX = alvoX;
    }

    // o centro da órbita anda até o alvo em velocidade fixa e lenta: se ela teleporta para o outro lado, eles atravessam a tela devagar
    if (this.fantasmasJaApareceram) {
      const falta = alvoX - this.fantasmasCentroX;
      const passo = SEGUIR_PX_POR_S * (delta / 1000);
      this.fantasmasCentroX += Math.abs(falta) <= passo ? falta : Math.sign(falta) * passo;
    }

    this.fantasmas.forEach((f, i) => {
      const ang = f.fase + t * c.velocidade;
      f.sprite.setVisible(this.fantasmasJaApareceram);   // depois que nascem, ficam visíveis mesmo quando ela some na esquiva
      f.sprite.x = this.fantasmasCentroX + Math.cos(ang) * c.raioX;
      f.sprite.y = c.altura + Math.sin(ang) * c.raioY + Math.sin(t * 1.3 + i * 2.1) * 2.5;   // órbita achatada + flutuar
      f.sprite.setAlpha(c.alpha + 0.08 * Math.sin(t * 1.7 + i * 1.9));                         // a transparência pulsa de leve
    });

    // sussurros extras durante o combate (a luta dura uns 30 s)
    if (this.emCombate && !this.fimDeJogo) {
      if (this.proximoSussurro === null) {
        this.proximoSussurro = this.time.now + PRIMEIRO_SUSSURRO_MS;
      } else if (this.time.now >= this.proximoSussurro) {
        this.sussurrarAlmas();
        this.proximoSussurro = this.time.now + Phaser.Math.Between(SUSSURRO_MIN_MS, SUSSURRO_MAX_MS);
      }
    }
  }

  // na morte da bruxa: eles ficam translúcidos e somem no escuro, sem subir libertados
  apagarFantasmas() {
    if (!this.fantasmas || !this.fantasmas.length || this.fantasmasApagando) return;
    this.fantasmasApagando = true;
    this.tweens.add({ targets: this.fantasmas.map((f) => f.sprite), alpha: 0, duration: 2500 });
  }

  // toca 2 ou 3 sussurros em sequência, cada um sorteado entre os 3 sons da fase (sem repetir o anterior)
  sussurrarAlmas() {
    const s = this.cfg.sons;
    if (!this.fantasmas || !this.fantasmas.length || !s) return;
    const sons = [s.almaInicio, s.almaPocao, s.almaMorte].filter(Boolean);
    if (!sons.length) return;

    const vezes = Phaser.Math.Between(2, 3);
    let atraso = 0;
    for (let i = 0; i < vezes; i++) {
      this.time.delayedCall(atraso, () => {
        const opcoes = sons.filter((nome) => nome !== this.ultimoSussurro);
        const nome = Phaser.Utils.Array.GetRandom(opcoes.length ? opcoes : sons);
        this.ultimoSussurro = nome;
        tocarSom(this, nome, VOLUME_ALMAS);
      });
      atraso += Phaser.Math.Between(1000, 1600);
    }
  }
}