// Luta: os golpes do vilão (clava, pisão), o desvio de tiro, o bloqueio, a esquiva e o movimento.
// Os métodos são copiados para a CenaLuta no game.js, então o this é a cena.

class LutaVilaoGolpes {
  // quando uma bala aparece, o ogro tenta pular para desviar; cada tentativa inicia o cooldown
  tentarDesviarTiro() {
    const d = this.cfg.desvioTiro;
    if (!d || !this.emCombate || this.fimDeJogo || this.vilaoNoAr || this.vilaoAtacando || this.vilaoEsquivando || this.vilaoAnimando || this.vilaoBloqueando) return;
    if (this.time.now < this.vilaoProximoDesvio) return;

    this.vilaoProximoDesvio = this.time.now + d.cooldown;
    if (Math.random() >= d.chance) return;

    this.vilaoDesviando = true;
    this.vilaoNoAr = true;
    this.vilaoAltura = 0;
    this.vilaoVelY = -d.alturaPulo;

    // quadros do ar (pernas recolhidas), os mesmos do pisão; o último fica segurado até ele pousar
    if (this.cfg.anims.pisaoAr) this.vilao.play(this.cfg.anims.pisaoAr);
  }

  // os golpes vêm inteiros da fase (dano, alcance, aviso e de que forma o herói desvia)
  golpe(nome) {
    return this.cfg.golpes[nome];
  }

  // sorteia entre clava e pisão, se a fase tiver pisão e a escolha for aleatória
  escolherGolpe() {
    const golpes = this.cfg.golpes;
    if (!golpes || !golpes.pisao) return 'clava';
    if (golpes.escolha === 'aleatorio') return Math.random() < 0.5 ? 'clava' : 'pisao';
    return 'clava';
  }

  intervaloEntreGolpes() {
    return (this.cfg.golpes && this.cfg.golpes.intervalo) || 1200;
  }

  // o herói desvia do golpe se estiver em algum dos meios listados: pulando ou agachado
  desviadoPor(meios) {
    const lista = Array.isArray(meios) ? meios : [meios];
    return lista.some((meio) => {
      if (meio === 'pulo') return this.heroiAltura >= ALTURA_ESQUIVA;
      if (meio === 'agachar') return this.heroiAgachado;
      return false;
    });
  }

  // forcado (opcional): { nome, golpe } para um golpe escolhido de fora, como o pisão logo depois do bloqueio
  vilaoAtacar(forcado = null) {
    const nome = forcado ? forcado.nome : this.escolherGolpe();
    const g = forcado ? forcado.golpe : this.golpe(nome);
    this.golpeAtual = g;
    this.golpeAtualNome = nome;

    this.vilaoAtacando = true;
    this.pulouNoAviso = false;   // começa a contar os pulos deste aviso
    this.vilao.setTint(0xffaa44); // aviso: o golpe vem aí (dá tempo de se afastar ou pular)

    // a animação de ataque toca durante o aviso: o golpe corpo a corpo, ou o agachar do pisão
    if (nome === 'clava' && this.cfg.anims.ataque) this.vilao.play(this.cfg.anims.ataque);
    else if (nome === 'pisao' && this.cfg.anims.pisaoAgachar) this.vilao.play(this.cfg.anims.pisaoAgachar);

    // o vilão mira para o lado em que o herói estava quando o aviso começou
    const dir = this.heroi.x < this.vilao.x ? -1 : 1;

    this.time.delayedCall(g.aviso, () => {
      if (this.fimDeJogo) return;
      this.vilao.clearTint();

      if (nome === 'pisao') this.vilaoPular();
      else this.vilaoGolpeClava(g, dir);
    });
  }

  // golpe corpo a corpo: avanço rápido, arco de corte (se a fase quiser) e dano se o herói estiver no alcance
  vilaoGolpeClava(g, dir) {
    if (g.avanco) this.tweens.add({ targets: this.vilao, x: this.vilao.x + dir * g.avanco.distancia, duration: g.avanco.duracao, yoyo: true });
    if (g.corte !== false) this.desenharCorte(dir);

    const heroiNaFrente = (this.heroi.x - this.vilao.x) * dir > 0;
    const alcancou = Math.abs(this.vilao.x - this.heroi.x) <= g.alcance;

    if (alcancou && heroiNaFrente) {
      if (this.desviouClava(g)) this.mostrarEsquiva();
      else this.danoNoHeroi(g.dano);
    } else if (alcancou && !heroiNaFrente) {
      this.mostrarEsquiva(); // herói passou para trás dele: o golpe pegou só o ar
    }

    this.finalizarGolpe();
  }

  // pisão: o vilão salta; a queda é o que causa dano na área
  vilaoPular() {
    this.vilaoNoAr = true;
    this.vilaoAltura = 0;
    this.vilaoVelY = -this.cfg.golpes.alturaPulo;

    // quadros do ar: o último fica segurado até ele pousar
    if (this.cfg.anims.pisaoAr) this.vilao.play(this.cfg.anims.pisaoAr);
  }

  // o vilão pousou: tremor, poeira, dano na área e um avanço em direção ao herói
  vilaoAterrissa() {
    this.vilaoNoAr = false;
    this.vilaoAltura = 0;
    this.vilaoVelY = 0;
    this.vilao.y = CHAO_Y;

    // pouso do desvio: só poeira, sem tremor, dano nem avanço
    if (this.vilaoDesviando) {
      this.vilaoDesviando = false;
      this.poeiraNoChao();
      return;
    }

    this.animarPouso();

    const tremor = this.cfg.golpes.pisao.tremor;
    this.cameras.main.shake(tremor.duracao, tremor.forca);
    this.poeiraNoChao();

    const g = this.golpeAtual;
    if (this.golpeAtualNome === 'pisao') {
      const perto = Math.abs(this.vilao.x - this.heroi.x) <= g.raio;
      if (perto) {
        if (this.desviadoPor(g.desviaCom)) this.mostrarEsquiva();
        else this.danoNoHeroi(g.dano);
      }
    }

    const avanco = this.cfg.golpes.avancoDepoisPulo || 0;
    const dirPara = this.heroi.x < this.vilao.x ? -1 : 1;
    this.vilao.x = Phaser.Math.Clamp(this.vilao.x + dirPara * avanco, 32, 480);

    this.finalizarGolpe();
  }

  // a poeira que aparece quando o vilão bate no chão
  poeiraNoChao() {
    const p = this.add.graphics().setDepth(14);
    p.fillStyle(this.cfg.golpes.pisao.corPoeira, 0.7);
    p.fillEllipse(this.vilao.x, CHAO_Y - 2, 70, 10);
    this.tweens.add({ targets: p, alpha: 0, duration: 400, onComplete: () => p.destroy() });
  }

  // libera o vilão para o próximo ataque, depois do intervalo da fase
  finalizarGolpe() {
    this.time.delayedCall(300, () => {
      this.vilaoAtacando = false;
      this.vilaoProximoAtaque = this.time.now + this.intervaloEntreGolpes();
    });
  }

  // vira o vilão para o lado certo; cada fase diz se o sprite nasce espelhado
  virarVilao(olhaParaEsquerda) {
    this.vilao.setFlipX(olhaParaEsquerda !== !!this.cfg.espelhado);
  }

  // a fase tem bloqueio, o herói está perto e no chão, e já passou o tempo desde o último bloqueio
  podeBloquear() {
    const b = this.cfg.bloqueio;
    if (!b || !this.emCombate || this.heroiNoAr) return false;
    const perto = Math.abs(this.vilao.x - this.heroi.x) <= this.cfg.distanciaAtaque;
    return perto && this.time.now >= this.vilaoProximoBloqueio;
  }

  // bloqueio: braços cruzados por um tempo (soco e chute não causam dano, o tiro passa) e, logo depois, o pisão mais forte
  vilaoBloquear() {
    const b = this.cfg.bloqueio;
    this.vilaoBloqueando = true;
    this.vilaoProximoBloqueio = this.time.now + b.intervalo;
    this.vilao.clearTint();
    this.vilao.play(this.cfg.anims.bloqueio);

    this.time.delayedCall(b.duracao, () => {
      if (this.fimDeJogo) return;
      this.vilaoBloqueando = false;
      this.vilaoAtacar({ nome: 'pisao', golpe: { ...this.cfg.golpes.pisao, dano: b.pisaoDano } });
    });
  }

  // vilão parado em pé: sempre o quadro 0 da textura de parado.
  // (setFrame(0) sozinho usaria a textura atual, que pode ser a de surgir do chão)
  vilaoParado() {
    this.vilao.stop();
    this.vilao.setTexture(this.cfg.texturas.parado, 0);
    this.ajustarOrigemVilao(this.cfg.texturas.parado);
  }

  // o vilão tenta esquivar quando o herói soca perto dele (só nas fases que têm esquiva)
  tentarEsquivar() {
    if (!this.cfg.esquiva) return;
    const perto = Math.abs(this.vilao.x - this.heroi.x) <= (this.cfg.alcanceSoco || ALCANCE_SOCO);
    const livre = !this.vilaoAtacando && !this.vilaoEsquivando && !this.vilaoBebendo && !this.vilaoAnimando;
    if (perto && livre && this.time.now >= this.vilaoProximaEsquiva) this.vilaoEsquivar();
  }

  vilaoEsquivar() {
    tocarSom(this, 'esquiva');

    // se a animação de dano foi cortada, limpa o estado para ela não travar
    this.vilaoAnimando = false;
    this.vilao.off('animationcomplete-' + this.cfg.anims.hit);

    this.vilaoEsquivando = true;
    this.vilaoInvulneravel = true; // enquanto está debaixo da terra, o soco não pega
    this.vilao.clearTint();
    this.vilao.play(this.cfg.anims.afundar);

    this.vilao.once('animationcomplete', () => {
      if (this.fimDeJogo) return;

      // a poça some junto com ela enquanto fica debaixo da terra
      this.tweens.add({ targets: this.vilao, alpha: 0, duration: 200 });

      // some por um instante e reaparece atrás do herói
      this.time.delayedCall(250, () => {
        if (this.fimDeJogo) return;

        const lado = this.vilao.x > this.heroi.x ? -1 : 1;
        this.vilao.x = Phaser.Math.Clamp(this.heroi.x + lado * 50, 32, 480);

        // vulnerável enquanto sai do chão: é a hora de socá-la
        this.vilaoInvulneravel = false;
        this.vilao.setAlpha(1);
        this.vilao.play(this.cfg.anims.surgir);

        this.vilao.once('animationcomplete', () => {
          if (this.fimDeJogo) return;
          this.vilaoEsquivando = false;
          this.vilaoProximaEsquiva = this.time.now + this.cfg.cooldownEsquiva;
          this.vilaoProximoAtaque = this.time.now + 400; // contra-ataque rápido
        });
      });
    });
  }

  // a clava conta como desviada se o herói estiver no ar agora ou se pulou durante o aviso
  desviouClava(g) {
    const meios = Array.isArray(g.desviaCom) ? g.desviaCom : [g.desviaCom];
    const pulou = meios.includes('pulo') && this.pulouNoAviso;
    return pulou || this.desviadoPor(g.desviaCom);
  }

  mostrarEsquiva() {
    flutuarTexto(this, this.heroi.x, this.heroi.y - 70, 'DODGE!');
  }

  desenharCorte(dir) {
    const g = this.add.graphics().setDepth(15);
    g.lineStyle(3, 0xff8a00, 1);
    g.beginPath();
    const base = dir === 1 ? 0 : Math.PI;
    g.arc(this.vilao.x, this.vilao.y - 48, 38, base - 0.9, base + 0.9, false);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  }

  // animação de andar: a triste quando a vida está baixa (se a fase tiver)
  animacaoAndar() {
    const a = this.cfg.anims;
    const baixa = this.cfg.vidaBaixa;
    if (a.andarTriste && baixa && this.vilaoVida <= baixa * this.vilaoVidaMax) return a.andarTriste;
    return a.andar;
  }
}