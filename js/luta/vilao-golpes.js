// Luta: os golpes do vilão (corpo a corpo, pisão, bola de fogo, investida), o desvio de tiro, o bloqueio, a esquiva e o movimento.
// Os métodos são copiados para a CenaLuta no game.js, então o this é a cena.

const COR_CHAMA = 0xff9a2e;   // laranja da silhueta do piscar em chamas

class LutaVilaoGolpes {
  // quando uma bala aparece, o vilão tenta pular para desviar (só nas fases com desvioTiro, como a do ogro); cada tentativa inicia o cooldown
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

  // sorteia entre o corpo a corpo e o pisão, se a fase tiver pisão e a escolha for aleatória;
  // a fase que tem ciclo (a segunda do boss) segue a ordem fixa dele, sem sorteio
  escolherGolpe() {
    const golpes = this.cfg.golpes;
    if (golpes && golpes.ciclo) {
      const nome = golpes.ciclo[this.cicloIdx % golpes.ciclo.length];
      this.cicloIdx = (this.cicloIdx + 1) % golpes.ciclo.length;
      return nome;
    }
    if (golpes && golpes.chute && Math.random() < golpes.chanceChute) return 'chute';
    // de perto, a fase com investida (o lobisomem) às vezes dispara correndo em vez de dar a garrada
    if (golpes && golpes.investida && this.time.now >= this.vilaoProximaInvestida && Math.random() < golpes.investida.chancePerto) return 'investida';
    if (!golpes || !golpes.pisao) return 'corpo';
    if (golpes.escolha === 'aleatorio') return Math.random() < 0.5 ? 'corpo' : 'pisao';
    return 'corpo';
  }

  intervaloEntreGolpes() {
    return ((this.cfg.golpes && this.cfg.golpes.intervalo) || 1200) * this.multFuria('intervalo');
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

    // o recuo do ciclo não é um golpe: ele só começa a andar para trás (a bola vem quando o recuo termina)
    if (nome === 'recuo') {
      this.vilaoIniciarRecuo();
      return;
    }

    const g = forcado ? forcado.golpe : this.golpe(nome);
    this.golpeAtual = g;
    this.golpeAtualNome = nome;

    this.vilaoAtacando = true;
    this.pulouNoAviso = false;   // começa a contar os pulos deste aviso
    this.vilao.setTint(0xffaa44); // aviso: o golpe vem aí (dá tempo de se afastar ou pular)

    // a animação de ataque toca durante o aviso: o corpo a corpo, o chute, o agachar do pisão, a bola de fogo ou o preparo da investida
    if (nome === 'corpo' && this.cfg.anims.ataque) this.vilao.play(this.cfg.anims.ataque);
    else if (nome === 'chute' && this.cfg.anims.chute) this.vilao.play(this.cfg.anims.chute);
    else if (nome === 'pisao' && this.cfg.anims.pisaoAgachar) this.vilao.play(this.cfg.anims.pisaoAgachar);
    else if (nome === 'bola' && this.cfg.anims.bola) this.vilao.play(this.cfg.anims.bola);
    else if (nome === 'investida' && this.cfg.anims.investidaPreparar) this.vilao.play(this.cfg.anims.investidaPreparar);

    // o vilão mira para o lado em que o herói estava quando o aviso começou
    const dir = this.heroi.x < this.vilao.x ? -1 : 1;

    this.time.delayedCall(g.aviso, () => {
      if (this.fimDeJogo) return;
      this.vilao.clearTint();

      // o chute usa a mesma conta do corpo a corpo (alcance, lado e desvio), só com os valores dele
      if (nome === 'pisao') this.vilaoPular();
      else if (nome === 'bola') this.vilaoDisparaBola(g, dir);
      else if (nome === 'investida') this.vilaoInvestir(g);
      else this.vilaoGolpeCorpo(g, dir);
    });
  }

  // golpe corpo a corpo: avanço rápido, arco de corte (se a fase quiser) e dano se o herói estiver no alcance
  vilaoGolpeCorpo(g, dir) {
    // som do golpe, se a fase tiver (o lobo: a garrada; o boss fica sem som, quem toca é o dano do herói)
    if (this.cfg.sons && this.cfg.sons.garrada) tocarSom(this, this.cfg.sons.garrada);

    if (g.avanco) this.tweens.add({ targets: this.vilao, x: this.vilao.x + dir * g.avanco.distancia, duration: g.avanco.duracao, yoyo: true });
    if (g.corte !== false) this.desenharCorte(dir);

    const heroiNaFrente = (this.heroi.x - this.vilao.x) * dir > 0;
    const alcancou = Math.abs(this.vilao.x - this.heroi.x) <= g.alcance;

    if (alcancou && heroiNaFrente) {
      if (this.desviouCorpo(g)) this.mostrarEsquiva();
      else this.danoNoHeroi(g.dano);
    } else if (alcancou && !heroiNaFrente) {
      this.mostrarEsquiva(); // herói passou para trás dele: o golpe pegou só o ar
    }

    this.finalizarGolpe();
  }

  // a fase tem bola de fogo, o herói está longe o bastante e já passou o tempo do último ataque
  podeAtirarBola() {
    const b = this.cfg.golpes && this.cfg.golpes.bola;
    if (!b || !this.emCombate) return false;
    const longe = Math.abs(this.vilao.x - this.heroi.x) >= b.distanciaMin;
    return longe && this.time.now >= this.vilaoProximoAtaque;
  }

  // a bola de fogo sai da mão do vilão (no quadro do arremesso) e voa para o lado do herói
  vilaoDisparaBola(g, dir) {
    // som da bola de fogo saindo da mão, se a fase tiver (o boss)
    if (this.cfg.sons && this.cfg.sons.bola && this.cache.audio.exists(this.cfg.sons.bola)) {
      // o arquivo tem 6,1 s: toca só os primeiros ~1,5 s, com fade-out (começa em 1,1 s e dura 0,4 s)
      const somBola = this.sound.add(this.cfg.sons.bola, { volume: 0.9 });
      somBola.play();
      this.time.delayedCall(1100, () => {
        this.tweens.add({
          targets: somBola,
          volume: 0,
          duration: 400,
          onComplete: () => somBola.destroy()
        });
      });
    }

    const tam = g.tamanho || 1;   // multiplicador do tamanho da bola (1 = o tamanho antigo)
    const bola = this.add.graphics().setDepth(16);
    bola.fillStyle(0xff8a00, 1);
    bola.fillCircle(0, 0, 8 * tam);
    bola.fillStyle(0xffe08a, 1);
    bola.fillCircle(0, 0, 4 * tam);

    const x = this.vilao.x + dir * g.saidaX;
    bola.setPosition(x, CHAO_Y - g.alturaInicial);
    this.tweens.add({ targets: bola, scale: 1.25, duration: 120, yoyo: true, repeat: -1 });   // a chama pulsa

    this.bolas.push({ g: bola, dir, partiu: x, dado: g, passou: false });
    this.finalizarGolpe();
  }

  // move as bolas de fogo: elas descem da mão até a altura do peito do herói e acertam se ele não desviar
  atualizarBolas(delta) {
    if (!this.bolas.length) return;

    const sobraram = [];
    for (const b of this.bolas) {
      if (!b.g.active) continue;
      const g = b.dado;
      b.g.x += b.dir * g.velocidade * (delta / 1000);

      const progresso = Math.min(1, Math.abs(b.g.x - b.partiu) / g.descida);
      b.g.y = CHAO_Y - (g.alturaInicial + (g.alturaFinal - g.alturaInicial) * progresso);

      // chegou no herói: acerta, ou passa por cima / por baixo se ele estiver pulando ou agachado
      if (!b.passou && Math.abs(b.g.x - this.heroi.x) <= g.raio) {
        if (this.desviadoPor(g.desviaCom)) {
          b.passou = true;
          this.mostrarEsquiva();
        } else {
          this.destruirBola(b);
          this.danoNoHeroi(g.dano);
          continue;
        }
      }

      if (b.g.x < -20 || b.g.x > 532) {
        this.destruirBola(b);
        continue;
      }

      sobraram.push(b);
    }

    if (!this.fimDeJogo) this.bolas = sobraram;
  }

  destruirBola(b) {
    this.tweens.killTweensOf(b.g);
    if (b.g.active) b.g.destroy();
  }

  limparBolas() {
    this.bolas.forEach((b) => this.destruirBola(b));
    this.bolas = [];
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

  // recuo do boss (fase 2): depois da rasteira ele anda para trás até ficar longe o bastante para a bola de fogo.
  // O recuo termina sempre numa bola, que não conta como passo do ciclo
  vilaoIniciarRecuo() {
    this.vilaoRecuando = true;
    this.vilao.clearTint();
  }

  // o recuo, quadro a quadro (chamado pelo update): longe o bastante, lança a bola; sem espaço atrás, pisca em chamas e lança a bola de lá
  atualizarRecuo(delta) {
    const r = this.cfg.golpes.recuo;
    const bola = this.cfg.golpes.bola;
    const alvo = bola.distanciaMin + r.folga;
    const distancia = Math.abs(this.vilao.x - this.heroi.x);

    if (distancia >= alvo) {
      this.vilaoRecuando = false;
      this.vilaoParado();
      this.vilaoAtacar({ nome: 'bola', golpe: bola });
      return;
    }

    const dir = this.vilao.x > this.heroi.x ? 1 : -1;   // para longe do herói
    const proximo = this.vilao.x + dir * ((r.velocidade * delta) / 1000);
    const encurralado = dir > 0 ? proximo >= 480 - r.margemBorda : proximo <= 32 + r.margemBorda;

    if (encurralado) {
      // sem espaço para recuar: o piscar em chamas (sem esperar o cooldown) o leva para trás do herói, e de lá ele lança a bola
      this.vilaoRecuando = false;
      this.vilaoParado();
      this.vilaoEsquivar({ distancia: r.distanciaEsquiva, depois: () => this.vilaoAtacar({ nome: 'bola', golpe: bola }) });
      return;
    }

    this.vilao.x = proximo;
    this.vilao.play(this.animacaoAndar(), true);
  }

  // a fase tem investida, o herói está longe e já passou o tempo da última investida e do último ataque
  podeInvestir() {
    const g = this.cfg.golpes && this.cfg.golpes.investida;
    if (!g || !this.emCombate) return false;
    const longe = Math.abs(this.vilao.x - this.heroi.x) >= g.distanciaMin;
    return longe && this.time.now >= this.vilaoProximaInvestida && this.time.now >= this.vilaoProximoAtaque;
  }

  // investida: depois do aviso, o vilão dispara correndo na direção do herói, passa por ele e só para do outro lado.
  // Quem estiver pulando quando ele passa desvia; quem estiver no chão leva o dano
  vilaoInvestir(g) {
    // rosnado no começo da corrida, se a fase tiver (o lobo)
    if (this.cfg.sons && this.cfg.sons.investida) tocarSom(this, this.cfg.sons.investida);

    const dir = this.heroi.x < this.vilao.x ? -1 : 1;   // mira onde o herói está agora, no fim do aviso
    this.vilaoInvestindo = true;
    this.investidaDir = dir;
    this.investidaLado = dir;          // de que lado do vilão o herói estava quando a corrida começou
    this.investidaPassou = false;      // o dano (ou o DODGE) só conta uma vez por investida
    this.investidaAlvo = Phaser.Math.Clamp(this.heroi.x + dir * g.passarDoHeroi, 32, 480);
    this.virarVilao(dir < 0);
    this.vilao.play(this.cfg.anims.correr);
  }

  // a corrida da investida, quadro a quadro (chamado pelo update)
  atualizarInvestida(delta) {
    const g = this.cfg.golpes.investida;
    const dir = this.investidaDir;
    this.vilao.x += dir * g.velocidade * this.multFuria('velocidade') * (delta / 1000);

    // passou pelo herói: pulando alto o bastante, desviou; no chão, leva o dano
    if (!this.investidaPassou && Math.sign(this.heroi.x - this.vilao.x) !== this.investidaLado) {
      this.investidaPassou = true;
      if (this.desviadoPor(g.desviaCom)) this.mostrarEsquiva();
      else this.danoNoHeroi(g.dano);
    }

    const chegou = (this.vilao.x - this.investidaAlvo) * dir >= 0;
    if (chegou || this.vilao.x <= 32 || this.vilao.x >= 480) this.fimInvestida();
  }

  fimInvestida() {
    this.vilaoInvestindo = false;
    this.vilao.x = Phaser.Math.Clamp(this.vilao.x, 32, 480);
    this.vilaoParado();
    this.vilaoProximaInvestida = this.time.now + this.cfg.golpes.investida.cooldown * this.multFuria('intervalo');
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

  // bloqueio: braços cruzados por um tempo (soco e chute não causam dano, o tiro passa) e, logo depois, o contra-golpe mais forte
  // (o pisão no ogro; a fase escolhe outro golpe com bloqueio.contra, como a garrada do lobisomem)
  vilaoBloquear() {
    const b = this.cfg.bloqueio;
    const contra = b.contra || 'pisao';
    this.vilaoBloqueando = true;
    this.vilaoProximoBloqueio = this.time.now + b.intervalo * this.multFuria('intervalo');
    this.vilao.clearTint();
    this.vilao.play(this.cfg.anims.bloqueio);
    if (b.textura) this.ajustarOrigemVilao(b.textura);

    this.time.delayedCall(b.duracao, () => {
      if (this.fimDeJogo) return;
      this.vilaoBloqueando = false;
      this.vilaoAtacar({ nome: contra, golpe: { ...this.cfg.golpes[contra], dano: b.contraDano || b.pisaoDano } });
    });
  }

  // vilão parado em pé: sempre o quadro 0 da textura de parado.
  // (setFrame(0) sozinho usaria a textura atual, que pode ser a de surgir do chão)
  vilaoParado() {
    // fase com idle animado (o boss): fica respirando; o play só (re)começa se o idle ainda não estiver tocando
    if (this.cfg.idleAnimado) {
      this.vilao.play(this.cfg.anims.parado, true);
      this.ajustarOrigemVilao(this.cfg.texturas.parado);
      return;
    }

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

  // opcoes (só no piscar em chamas): { distancia, depois }, para reaparecer mais longe do herói e fazer algo ao voltar
  vilaoEsquivar(opcoes = {}) {
    tocarSom(this, 'esquiva');

    // se a animação de dano foi cortada, limpa o estado para ela não travar
    this.vilaoAnimando = false;
    this.vilao.off('animationcomplete-' + this.cfg.anims.hit);

    // fase com piscar em chamas (o boss): esquiva feita no código, sem sheet de afundar e surgir
    if (this.cfg.esquivaChamas) {
      this.vilaoEsquivarChamas(opcoes);
      return;
    }

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

  // piscar em chamas: o corpo vira uma silhueta laranja que esmaece em brasas e reaparece atrás do herói
  vilaoEsquivarChamas(opcoes = {}) {
    this.vilaoEsquivando = true;
    this.vilaoInvulneravel = true;   // enquanto some, o soco cai no vazio (MISS) e o tiro passa
    this.vilao.setTintFill(COR_CHAMA);
    this.brasas(this.vilao.x, CHAO_Y - 60);
    this.tweens.add({ targets: this.vilao, alpha: 0, duration: 300 });

    // some por um instante e reaparece do outro lado do herói
    this.time.delayedCall(550, () => {
      if (this.fimDeJogo) return;

      const lado = this.vilao.x > this.heroi.x ? -1 : 1;
      this.vilao.x = Phaser.Math.Clamp(this.heroi.x + lado * (opcoes.distancia || 110), 32, 480);
      this.brasas(this.vilao.x, CHAO_Y - 60);

      // volta com um clarão e fica vulnerável: é a hora de bater
      this.vilaoInvulneravel = false;
      this.tweens.add({ targets: this.vilao, alpha: 1, duration: 200 });

      this.time.delayedCall(250, () => {
        if (this.fimDeJogo) return;
        this.vilao.clearTint();
        this.vilaoEsquivando = false;
        this.vilaoProximaEsquiva = this.time.now + this.cfg.cooldownEsquiva;
        this.vilaoProximoAtaque = this.time.now + 400;   // contra-ataque rápido
        if (opcoes.depois) opcoes.depois();
      });
    });
  }

  // faíscas que sobem e somem
  brasas(x, y) {
    for (let i = 0; i < 12; i++) {
      const b = this.add.rectangle(
        x + Phaser.Math.Between(-35, 35),
        y + Phaser.Math.Between(-30, 40),
        3, 3,
        i % 3 === 0 ? 0xffe08a : 0xff8a00
      ).setDepth(16);
      this.tweens.add({
        targets: b,
        y: b.y - Phaser.Math.Between(20, 55),
        alpha: 0,
        duration: Phaser.Math.Between(350, 650),
        onComplete: () => b.destroy()
      });
    }
  }

  // o golpe corpo a corpo conta como desviado se o herói estiver no ar agora ou se pulou durante o aviso
  desviouCorpo(g) {
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