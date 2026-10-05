'use strict';

/* =========================================================
   Slots no estilo TaDa / JILI (SlotKit) — só slots.
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, cascade, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'tada';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const SUITS = (pays, w = [8, 8, 9, 9]) => K.ROYALS(pays, w);
  const L5 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
  /** escada de cascata da Transformação Dourada (x1 → x5) */
  const LAD5 = [1, 2, 3, 4, 5];
  /** Coringa Grande: na próxima cascata ele se copia em 2 ou 3 casas vizinhas (sem scatter/coringa). */
  const spreadBig = (g, mk) => {
    let n = 0;
    g.forEach((col, c) => col.forEach((x, r) => {
      if (!x || !x.big) return;
      x.big = false;
      const nb = [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]].filter(([a, b]) => g[a] && g[a][b] && !g[a][b].sc && !g[a][b].wild);
      RNG.shuffle(nb).slice(0, RNG.int(2, 3)).forEach(([a, b]) => { g[a][b] = mk(); n++; });
    }));
    return n;
  };

  /* =========================================================
     1. Império Dourado (Golden Empire) — 32.400 caminhos
     ========================================================= */
  (() => {
    const SY = [
      S('rei', 'sunface', 'Rei Sol', [1, 2, 4, 8], 3), S('mascara', 'llama', 'Lhama', [0.8, 1.6, 3, 6], 4), S('idolo', 'feather', 'Pena', [0.6, 1.2, 2.5, 5], 5),
      S('vaso', 'volcano', 'Vulcão', [0.5, 1, 2, 4], 5), ...SUITS([[0.2, 0.4, 0.8, 1.5], [0.2, 0.4, 0.8, 1.5], [0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2]]),
    ];
    const WILD = { id: 'w', img: 'militarymedal', name: 'Coringa', wild: true, w: 0 };
    const SC = { id: 'sc', img: 'hut', name: 'Cabana', sc: true, w: 0.7, fw: 0.5 };
    const all = [...SY, SC];
    // nas grátis as cartas caem mais (cascatas mais longas)
    SY.forEach(x => { if (x.letter) x.fw = x.w * 2.2; });
    const draw = pool(all);
    const cell = (c, fs) => { const x = draw(c, fs ? 'fw' : 'w'); if (!x.sc && c >= 1 && c <= 4 && RNG.float() < (fs ? 0.26 : 0.05)) x.gold = true; return x; };
    const make = fs => K.stack(grid([5, 6, 6, 6, 6, 5], c => cell(c, fs)), 0.45);
    // moldura dourada que ganha não explode: vira coringa pequeno ou (20%) coringa grande
    const SMALL = () => ({ ...WILD, fresh: true });
    const BIG = () => ({ ...WILD, name: 'Coringa grande', big: true, c: 'giant', fresh: true });
    async function play(rt, g, fs, st) {
      const mv = step => (fs ? st.m : LAD5[Math.min(step, 4)]);
      rt.chip('mult', 'MULT.', 'x' + mv(0));
      await tumble(rt, g, {
        draw: c => cell(c, fs), evaluate: gg => ways(gg, SY),
        mult: step => mv(step),
        convert: x => (x.gold ? (RNG.float() < (fs ? 0.3 : 0.2) ? BIG() : SMALL()) : null),
        onStep: async (s, gg) => {
          if (spreadBig(gg, SMALL)) rt.msg('🃏 O coringa grande se copiou nas casas vizinhas!');
          if (fs) st.m++;
          rt.chip('mult', 'MULT.', 'x' + mv(s));
        },
      });
      if (!fs) rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'imperiodourado', name: 'Império Dourado', studio: STUDIO, art: 'crown', mascot: 'sun',
      tag: '32.400 caminhos · cascata x1 a x5', colors: ['#ca8a04', '#065f46'], bg: 'linear-gradient(180deg,#14532d,#365314 60%,#1a2e05)',
      cols: 6, rows: 6, cellH: 1.1, maxWin: 2000, vol: 3, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Golden Empire" (TaDa Gaming).', hello: 'Molduras douradas viram coringas!',
      symbols: [...all, WILD],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Rolos 5-6-6-6-6-5 = 32.400 caminhos, com cascata.')],
      highlights: ['👑 Rolos <b>5-6-6-6-6-5</b>: até <b>32.400 caminhos</b>, com cascata', '🔥 Cada cascata sobe o multiplicador: <b>x1 → x2 → x3 → x4 → x5</b>', '🥇 Molduras douradas (rolos 2 a 5) que ganham <b>não explodem</b>: viram <b>coringa pequeno</b> ou <b>coringa grande</b>, que se copia em 2 ou 3 casas vizinhas', '🛖 4+ cabanas = <b>8 rodadas grátis</b> (+2 por extra) com multiplicador <b>+1 por cascata que nunca zera</b>', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Rolos <b>5-6-6-6-6-5</b> (32.400 caminhos) com <b>cascata</b>. No jogo base o multiplicador sobe a cada cascata do mesmo giro: x1, x2, x3, x4 e x5.</p><p>Símbolos com <b>moldura dourada</b> nos rolos 2 a 5 que fazem parte de um ganho não somem: viram <b>coringa</b> no mesmo lugar para a próxima cascata. Às vezes vira o <b>coringa grande</b>, que se copia em 2 ou 3 casas vizinhas.</p>',
      features: '<p>🛖 <b>4 ou mais cabanas</b> dão <b>8 rodadas grátis</b> (+2 por cabana extra; 4+ nelas dão mais giros). Nelas o multiplicador começa em <b>x1</b> e sobe <b>+1 a cada cascata</b>, sem teto e sem zerar até o fim do bônus.</p>',
      make: () => make(false),
      async spin(rt) {
        const g = make(false);
        await rt.spin(g);
        await play(rt, g, false);
        const sc = count(g, x => x.sc);
        if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 4 } = {}) {
        const st = { m: 1 };
        await rt.fsLoop(8 + (sc - 4) * 2, async api => {
          const g = make(true);
          await rt.spin(g, { tease: false });
          await play(rt, g, true, st);
          const s = count(g, x => x.sc);
          if (s >= 4) api.add(8 + (s - 4) * 2);
        }, { sub: 'Multiplicador sem limite!' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     2 e 3. Joias da Fortuna 1 e 2 (Fortune Gems) — 3×3 + rolo multiplicador
     ========================================================= */
  function gems(cfg) {
    const G = cfg.gems || ['sparklingheart', 'heartribbon', 'blueheart'];
    const SY = [
      S('vermelha', G[0], 'Joia vermelha', [10], 3), S('verde', G[1], 'Joia rosa', [7.5], 4), S('azul', G[2], 'Joia azul', [5], 5),
      K.L('A', [2.5], 7), K.L('K', [2], 8), K.L('Q', [1.5], 9), K.L('J', [1], 10),
    ];
    const WILD = { id: 'w', img: cfg.wild || 'joker', name: 'Coringa', wild: true, w: 1.6 };
    const all = [...SY, WILD];
    const draw = pool(all);
    const REEL = cfg.mults;
    const mcell = () => { const m = RNG.weighted(REEL); return m.wheel ? { id: 'roda', img: 'ferris', t: 'RODA', c: 'mreel', wheel: true } : { id: 'mx', img: null, t: 'x' + m.m, m: m.m, c: 'mreel' }; };
    const make = () => [...grid([3, 3, 3], c => draw(c)), [mcell(), mcell(), mcell()]];
    const tbl = SY.map(s => ({ ...s, pays: [s.pays[0] / 5] }));
    return K.create({
      id: cfg.id, name: cfg.name, studio: STUDIO, art: cfg.mascot, mascot: cfg.mascot,
      tag: cfg.tag, colors: cfg.colors, bg: cfg.bg, cols: 4, rows: 3, maxWin: cfg.maxWin, vol: 2, rtp: '~97%', target: 0.97, buy: false,
      intro: cfg.intro, hello: 'O 4º rolo multiplica o ganho!',
      symbols: [...all, { img: 'ferris', noBlur: false }],
      lineList: { cols: 3, rows: 3, list: L5, text: '5 linhas fixas na grade 3×3; o 4º rolo só define o multiplicador (posição do meio).' },
      tables: [table('Pagamento por linha', ['3 iguais'], tbl, 'Valores por linha (× aposta total) antes do multiplicador do 4º rolo.')],
      highlights: ['💎 Grade <b>3×3</b> com <b>5 linhas</b>', `🎰 O <b>4º rolo</b> sorteia um multiplicador (${REEL.filter(m => !m.wheel).map(m => 'x' + m.m).join(', ')}) que vale para todo o ganho`, ...(cfg.wheel ? ['🎡 Se a <b>RODA</b> parar no meio do 4º rolo: um giro na Roda da Sorte com prêmio de <b>até 1.000x</b>'] : []), `Prêmio máximo: <b>${fmt(cfg.maxWin).replace(',00', '')}x</b>`],
      how: '<p>Grade <b>3×3</b> com <b>5 linhas</b>: três iguais numa linha pagam. 👑 é coringa.</p><p>Ao lado há um <b>4º rolo especial</b> só de multiplicadores: o valor que parar na <b>posição do meio</b> multiplica todo o ganho do giro.</p>',
      features: `<table class="paytable"><tr class="si-head"><td>Multiplicador</td><td>Chance</td></tr>${REEL.map(m => `<tr><td><b>${m.wheel ? 'RODA' : 'x' + m.m}</b></td><td>${Math.round((m.w / REEL.reduce((a, b) => a + b.w, 0)) * 1000) / 10}%</td></tr>`).join('')}</table>
        ${cfg.wheel ? `<p>🎡 <b>Roda da Sorte:</b> prêmio instantâneo de ${cfg.wheel.map(w => w.v + 'x').join(', ')}.</p>` : ''}<p class="muted small">Sem rodadas grátis nem compra de bônus: giros rápidos.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g, { tease: false });
        const mid = g[3][1];
        const res = lines(g.slice(0, 3), L5, SY.map(s => ({ ...s, pays: [s.pays[0] / 5] })));
        if (mid.wheel) {
          rt.mark([key(3, 1)]);
          const i = cfg.wheel.indexOf(RNG.weighted(cfg.wheel));
          await rt.reveal('RODA DA SORTE', cfg.wheel.map(w => ({ img: 'ferris', t: w.v + 'x' })), i);
          rt.win(cfg.wheel[i].v);
          rt.msg(`🎡 Roda da Sorte: ${rt.coins(cfg.wheel[i].v)}!`);
          rt.fx('big');
          await rt.wait(900);
          await pay(rt, res);
        } else if (res.total) {
          res.cells.add(key(3, 1));
          await pay(rt, res, mid.m);
        }
      },
      async bonus() {},
    });
  }
  App.register(gems({
    id: 'joiasfortuna', name: 'Joias da Fortuna', mascot: 'gem', maxWin: 375, tag: '3×3 + rolo até x15', colors: ['#b91c1c', '#7c3aed'], bg: 'radial-gradient(circle at 50% 30%,#7c2d12,#1c0a02 70%)',
    intro: 'Inspirado no "Fortune Gems" (TaDa Gaming).',
    mults: [{ m: 1, w: 45 }, { m: 2, w: 22 }, { m: 3, w: 14 }, { m: 5, w: 10 }, { m: 10, w: 6 }, { m: 15, w: 3 }],
  }));
  App.register(gems({
    id: 'joiasfortuna2', name: 'Joias da Fortuna 2', mascot: 'whiteheart', gems: ['orangeheart', 'pinkheart', 'whiteheart'], wild: 'starstruck', maxWin: 10000, tag: 'Rolo multiplicador + Roda da Sorte', colors: ['#2563eb', '#ca8a04'], bg: 'radial-gradient(circle at 50% 30%,#1e3a8a,#0b1026 70%)',
    intro: 'Inspirado no "Fortune Gems 2" (TaDa Gaming).',
    mults: [{ m: 1, w: 40 }, { m: 2, w: 22 }, { m: 3, w: 14 }, { m: 5, w: 10 }, { m: 10, w: 6 }, { m: 15, w: 3 }, { wheel: true, w: 1.6 }],
    wheel: [{ v: 5, w: 30 }, { v: 10, w: 25 }, { v: 20, w: 18 }, { v: 50, w: 12 }, { v: 100, w: 8 }, { v: 200, w: 4 }, { v: 500, w: 2 }, { v: 1000, w: 1 }],
  }));

  /* =========================================================
     4. Lâmpada Mágica (Magic Lamp) — 6×5, 15.625 caminhos
     ========================================================= */
  (() => {
    const SY = [
      S('princesa', 'monkey', 'Macaquinho', [0.8, 1.5, 3, 6], 3), S('camelo', 'camel', 'Camelo', [0.6, 1.2, 2.5, 5], 4), S('adaga', 'dagger', 'Adaga', [0.5, 1, 2, 4], 5),
      S('chave', 'palm', 'Palmeira', [0.4, 0.8, 1.6, 3], 5), ...SUITS([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]]),
    ];
    const WILD = { id: 'w', img: 'teapot', name: 'Lâmpada', wild: true, reels: [1, 2, 3, 4, 5], w: 0.7, fw: 1.2 };
    // os gênios só aparecem nas rodadas grátis (a coleta só existe nelas)
    const GENIE = { id: 'genio', img: 'genie', name: 'Gênio', coin: true, noPay: true, w: 0, fw: 3.5 };
    const SC = { id: 'sc', img: 'crescentmoon', name: 'Lua', sc: true, w: 0.55, fw: 0.3 };
    const all = [...SY, WILD, GENIE, SC];
    const draw = pool(all);
    const VALS = [{ v: 2, w: 35 }, { v: 3, w: 25 }, { v: 5, w: 15 }, { v: 10, w: 12 }, { v: 20, w: 7 }, { v: 50, w: 4 }, { v: 100, w: 2 }];
    const make = (wk = 'w') => K.stack(grid([5, 5, 5, 5, 5, 5], c => { const x = draw(c, wk); if (x.coin) x.v = RNG.weighted(VALS).v; return x; }), 0.35);
    async function play(rt, g, fs) {
      // coringa que cai pode expandir no rolo inteiro
      for (let c = 1; c < 6; c++) if (g[c].some(x => x.wild) && RNG.float() < (fs ? 0.5 : 0.25)) { g[c] = g[c].map(x => (x.coin ? x : { ...WILD, fresh: true })); rt.msg('🪔 Aladim expandiu!'); await rt.drop(g); }
      await pay(rt, ways(g, SY));
      if (!fs) return;
      const w = count(g, x => x.wild && x.id === 'w'), v = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);
      if (w && v) {
        rt.mark(cells(g, x => x.coin || x.wild).map(([c, r]) => key(c, r)));
        rt.win(v);
        rt.msg(`🧞 Aladim coletou os gênios: ${rt.coins(v)}`);
        rt.fx('coin');
        await rt.wait(900);
      }
    }
    App.register(K.create({
      id: 'lampadamagica', name: 'Lâmpada Mágica', studio: STUDIO, art: 'genie', mascot: 'genie',
      tag: 'Até 50 giros · Aladim coleta os gênios', colors: ['#7c3aed', '#ca8a04'], bg: 'linear-gradient(180deg,#312e81,#4c1d95 60%,#1e1b4b)',
      cols: 6, rows: 5, maxWin: 2000, vol: 2, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Magic Lamp" (TaDa Gaming).', hello: 'Aladim coleta os prêmios dos gênios!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6 rolos × 5 linhas = 15.625 caminhos.'), { title: 'Gênios (valores)', head: ['valor'], rows: VALS.map(v => ({ img: 'genie', name: 'Gênio', pays: [v.v] })) }],
      highlights: ['🪔 <b>Aladim</b> é coringa e pode <b>expandir</b> no rolo inteiro', '🌙 3/4/5/6 luas = <b>10/15/25/50 rodadas grátis</b>', '🧞 Nas grátis caem <b>gênios</b> com prêmios de 2x a 100x; com o Aladim na tela, ele <b>coleta</b> todos', 'Prêmio máximo: <b>2.000x</b>'],
      how: `<p><b>6×5</b> com <b>15.625 caminhos</b>. ${ico('teapot')} Aladim é coringa (rolos 2 a 6) e pode expandir no rolo inteiro.</p>`,
      features: '<p>🌙 <b>3, 4, 5 ou 6 luas</b> dão <b>10, 15, 25 ou 50 rodadas grátis</b>. Nelas caem 🧞 <b>gênios</b> com prêmios de 2x a 100x: sempre que o Aladim (coringa) estiver na tela, ele <b>coleta</b> e paga todos os gênios. Os coringas aparecem mais e expandem com o dobro de frequência. 3+ luas nas grátis dão +5 giros.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const n = { 3: 10, 4: 15, 5: 25 }[sc] || 50;
        await rt.fsLoop(n, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, true);
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: `${n} giros · Aladim coleta os gênios` });
      },
    }));
  })();

  /* =========================================================
     5. Roma X — 5×3, 15 linhas, cascata e Duelo com o Leão
     ========================================================= */
  (() => {
    const L15 = K.LINES_5x3.slice(0, 15);
    const SY = [
      S('gladiador', 'helmet', 'Gladiador', [5, 15, 50], 3), S('escudo', 'bowarrow', 'Arco', [3, 10, 30], 4), S('espadas', 'shield', 'Escudo', [2, 6, 20], 4),
      S('anfora', 'amphora', 'Ânfora', [1, 3, 10], 5), ...SUITS([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]]),
    ];
    const WILD = { id: 'w', img: 'temple', name: 'Coliseu', wild: true, reels: [1, 2, 3], w: 1 };
    const BON = { id: 'bon', img: 'lion', name: 'Leão', bonus: true, w: 0.9 };
    const all = [...SY, WILD, BON];
    const draw = pool(all);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const FS_BY = { 4: 3, 5: 5, 6: 10, 7: 20 };
    async function cascades(rt, g) {
      return tumble(rt, g, { draw: c => draw(c), evaluate: gg => lines(gg, L15, SY) });
    }
    async function lionDuel(rt) {
      rt.stat('duel');
      let prize = 3;
      rt.chip('duelo', 'DUELO', prize + 'x');
      for (let round = 1; round <= 3; round++) {
        await rt.choose(`DUELO COM O LEÃO · ROUND ${round}`, [
          { id: 'a', img: 'swords', label: 'Atacar', desc: 'Golpe duplo' }, { id: 'd', img: 'shield', label: 'Defender', desc: 'Escudo' }, { id: 'e', img: 'helmet', label: 'Esquivar', desc: 'Contra-ataque' },
        ]);
        const r = RNG.weighted([{ o: 'duas', w: 25 }, { o: 'uma', w: 45 }, { o: 'leao', w: 30 }]).o;
        if (r === 'leao') { rt.msg('🦁 O leão revidou! Fim do duelo'); rt.fx('lose'); await rt.wait(900); break; }
        prize += r === 'duas' ? 6 : 3;
        rt.chip('duelo', 'DUELO', prize + 'x');
        rt.msg(r === 'duas' ? '⚔️⚔️ Golpe duplo! +6x' : '⚔️ Acertou! +3x');
        rt.fx('coin');
        await rt.wait(800);
      }
      rt.win(prize);
      rt.msg(`🦁 Duelo: ${rt.coins(prize)}`);
      rt.fx('big');
      await rt.wait(900);
      rt.chip('duelo', null);
    }
    App.register(K.create({
      id: 'romax', name: 'Roma X', studio: STUDIO, art: 'lion', mascot: 'helmet',
      tag: 'Duelo com o leão · cascatas dão giros', colors: ['#991b1b', '#ca8a04'], bg: 'linear-gradient(180deg,#78350f,#7f1d1d 60%,#450a0a)',
      cols: 5, rows: 3, maxWin: 500, vol: 2, rtp: '~97%', target: 0.97, buy: false,
      intro: 'Inspirado no "Roma X" (TaDa Gaming).', hello: 'Cascatas seguidas dão rodadas grátis!',
      symbols: all,
      lineList: { cols: 5, rows: 3, list: L15, text: '15 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda, com cascata.')],
      highlights: ['🏛️ 5×3 com 15 linhas e <b>cascata</b>', '🔁 <b>4, 5, 6 ou 7 cascatas seguidas</b> no mesmo giro dão <b>3, 5, 10 ou 20 rodadas grátis</b>', '🦁 3 leões = <b>Duelo com o Leão</b>: 3 rounds de ataque e defesa por <b>3x a 21x</b>', 'Prêmio máximo: <b>500x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>15 linhas</b>. Os símbolos vencedores somem e novos caem (<b>cascata</b>). 🏛️ é coringa (rolos 2 a 4).</p>',
      features: `<table class="paytable"><tr class="si-head"><td>Cascatas seguidas</td><td>Rodadas grátis</td></tr>${Object.entries(FS_BY).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>
        <p>🦁 <b>3 leões</b> abrem o <b>Duelo com o Leão</b>: em cada um dos 3 rounds você escolhe atacar, defender ou esquivar. Golpe duplo vale +6x, golpe simples +3x e, se o leão revidar, o duelo acaba. O prêmio começa em 3x (máximo 21x).</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const r = await cascades(rt, g);
        if (count(g, x => x.bonus) >= 3) { rt.mark(cells(g, x => x.bonus).map(([c, rr]) => key(c, rr))); await rt.wait(900); await lionDuel(rt); }
        if (r.steps >= 4) await this.bonus(rt, { n: FS_BY[Math.min(7, r.steps)] });
      },
      async bonus(rt, { n = 5 } = {}) {
        await rt.fsLoop(n, async api => {
          const g = make();
          await rt.spin(g, { tease: false });
          const r = await cascades(rt, g);
          if (count(g, x => x.bonus) >= 3) await lionDuel(rt);
          if (r.steps >= 4) api.add(FS_BY[Math.min(7, r.steps)]);
        }, { sub: `${n} giros` });
      },
    }));
  })();

  /* =========================================================
     6. Super Rico (Super Rich) — Montagem de Números: 3 rolos de
     números + roda da sorte; o prêmio é o número montado na linha
     ========================================================= */
  (() => {
    const N = (n, w) => ({ id: 'n' + n, letter: n, name: n, num: n, noPay: true, w });
    const BLANK = { id: 'vazio', img: null, name: 'Vazio', c: 'empty', noPay: true, noBlur: true };
    // rolo 1 não tem zeros; rolos 2 e 3 têm 0, 1, 5 e 00 (raro)
    const R1 = [N('1', 1.6), N('5', 1), N('10', 0.45), { ...BLANK, w: 2 }];
    const R23 = [N('0', 2), N('1', 1), N('5', 0.8), N('00', 0.12), { ...BLANK, w: 2 }];
    const WH = [{ k: 'x2', m: 2, w: 10 }, { k: 'x3', m: 3, w: 5 }, { k: 'x5', m: 5, w: 2.5 }, { k: 'x10', m: 10, w: 0.8 }, { k: 'respin', w: 6 }, { k: 'nada', w: 75 }];
    const d1 = pool(R1), d23 = pool(R23);
    const wcell = () => { const o = RNG.weighted(WH); return o.k === 'nada' ? { id: 'rv', img: null, c: 'mreel empty', t: '', wh: o } : { id: 'rv', img: o.m ? null : 'counterclockwise', c: 'mreel', t: o.m ? o.k : 'RESPIN', wh: o }; };
    const make = () => [...grid([3, 3, 3], c => (c === 0 ? d1(c) : d23(c))), [wcell(), wcell(), wcell()]];
    /** número da linha do meio: dígitos lidos da esquerda para a direita, como texto (ex.: 10|0|5 = 1005) */
    const number = g => { const xs = [g[0][1], g[1][1], g[2][1]]; if (xs.some(x => !x.num)) return 0; return Number(xs.map(x => x.num).join('')); };
    const DIV = 100; // 100 no visor = 1x a aposta
    App.register(K.create({
      id: 'superrico', name: 'Super Rico', studio: STUDIO, art: 'seven', mascot: 'elephant',
      tag: 'Monte o número · roda até x10', colors: ['#ca8a04', '#dc2626'], bg: 'radial-gradient(circle at 50% 30%,#7f1d1d,#1c0505 70%)',
      cols: 4, rows: 3, maxWin: 10000, vol: 3, rtp: '~96%', target: 0.96, buy: false,
      intro: 'Inspirado no "Super Rich" (TaDa Gaming), da família do Money Coming.', hello: 'Monte o maior número na linha do meio!',
      symbols: [...R1, ...R23.filter(x => x.id === 'n00' || x.id === 'n0'), { img: 'counterclockwise', noBlur: true }],
      lineList: { cols: 3, rows: 3, list: [[1, 1, 1]], text: 'Uma única linha, no meio; o 4º rolo é a roda da sorte.' },
      tables: [{ title: 'Exemplos de números montados', raw: true, head: ['prêmio'], rows: [['1', '0', '0', 1], ['5', '1', '0', 5.1], ['10', '0', '5', 10.05], ['1', '00', '5', 10.05], ['5', '00', '00', 500], ['10', '00', '00', 1000]].map(([a, b2, c, v]) => ({ name: `${a} | ${b2} | ${c}`, pays: [v + 'x'] })) }],
      highlights: ['🔢 <b>Montagem de números:</b> 3 rolos com <b>0, 1, 5, 10 e 00</b> (ou vazio) e uma linha no meio', 'O prêmio é o <b>número formado</b> lendo da esquerda para a direita: <b>10 | 0 | 5 = 1005</b>', '🎡 O 4º rolo é a <b>roda da sorte</b>: multiplica por <b>x2 a x10</b>, dá um <b>respin grátis</b> ou não faz nada', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Três rolos de números e uma linha no meio. Se os três mostrarem números (nenhum vazio), os dígitos são <b>juntados como texto</b>, da esquerda para a direita, e esse é o prêmio em moedas: 100 no visor valem 1x a aposta (ex.: 5 | 1 | 0 = 510 = 5,1x).</p><p>O primeiro rolo só tem 1, 5 e 10; os outros dois têm 0, 1, 5 e o raro <b>00</b>, que acrescenta dois zeros.</p>',
      features: '<p>🎡 <b>Roda da sorte (4º rolo):</b> o que parar no meio vale para o giro: <b>x2, x3, x5 ou x10</b> multiplicam o número montado; <b>RESPIN</b> dá um giro extra grátis (pode repetir); vazio não faz nada.</p><p class="muted small">Sem coringas e sem rodadas grátis: é o clássico de 1 linha, direto ao ponto.</p>',
      make,
      async spin(rt) {
        for (let i = 0; i < 5 && !rt.capped; i++) {
          const g = make();
          await rt.spin(g, { tease: false });
          const v = number(g), wh = g[3][1].wh;
          if (v) {
            const m = wh.m || 1, x = (v / DIV) * m;
            rt.mark([key(0, 1), key(1, 1), key(2, 1), ...(m > 1 ? [key(3, 1)] : [])]);
            rt.win(x);
            rt.msg(`🔢 ${v}${m > 1 ? ` · x${m}` : ''} = ${rt.coins(x)}`);
            rt.fx(x >= 50 ? 'jackpot' : m > 1 ? 'big' : 'win');
            await rt.wait(900);
          }
          if (wh.k !== 'respin') break;
          rt.mark([key(3, 1)], 'hl');
          rt.msg('🎡 Roda da sorte: RESPIN grátis!'); rt.fx('rise');
          await rt.wait(700);
        }
      },
      async bonus() {},
    }));
  })();

  /* =========================================================
     7. Fortuna dos Ossos (Bone Fortune) — Transformação Dourada:
     5×4, 1.024 caminhos, cascata x1 a x5; nas grátis o coringa
     dourado trava a coluna inteira
     ========================================================= */
  (() => {
    const SY = [
      S('catrina', 'performing', 'Máscaras', [0.6, 1.2, 2.5], 4), S('violao', 'trumpet', 'Trompete', [0.5, 1, 2], 4), S('maracas', 'accordion', 'Acordeão', [0.4, 0.8, 1.6], 5),
      S('rosa', 'sunflower', 'Girassol', [0.3, 0.6, 1.2], 5), ...['A', 'K', 'Q', 'J'].map((l, i) => K.L(l, [[0.2, 0.4, 0.8], [0.15, 0.3, 0.6], [0.1, 0.25, 0.5], [0.1, 0.2, 0.4]][i], 7 + i)),
    ];
    const WILD = { id: 'w', img: 'rosette', name: 'Coringa', wild: true, w: 0 };
    const SC = { id: 'sc', img: 'bouquet', name: 'Buquê', sc: true, w: 0.55, fw: 0.4 };
    const all = [...SY, SC];
    const draw = pool(all);
    const FSN = { 3: 5, 4: 8, 5: 12 };
    const LADFS = [2, 4, 6, 8, 10];
    const cell = (c, fs) => { const x = draw(c, fs ? 'fw' : 'w'); if (!x.sc && c >= 1 && c <= 3 && RNG.float() < (fs ? 0.12 : 0.09)) x.gold = true; return x; };
    const make = fs => K.stack(grid([4, 4, 4, 4, 4], c => cell(c, fs)), 0.2);
    const SMALL = () => ({ ...WILD, fresh: true });
    const BIG = () => ({ ...WILD, name: 'Coringa grande', big: true, c: 'giant', fresh: true });
    const LOCKW = () => ({ ...WILD, name: 'Coringa travado', fixed: true, c: 'sticky', fresh: true });
    async function play(rt, g, fs) {
      const lad = fs ? LADFS : LAD5;
      const lockCols = new Set();
      rt.chip('mult', 'MULT.', 'x' + lad[0]);
      await tumble(rt, g, {
        draw: c => cell(c, fs),
        // trava de segurança: colunas travadas podem emendar ganhos sem fim
        evaluate: (gg, step) => (step >= 20 ? { total: 0, wins: [], cells: new Set() } : ways(gg, SY)),
        mult: step => lad[Math.min(step, 4)],
        convert: (x, c) => {
          if (!x.gold) return null;
          if (fs) lockCols.add(c);
          return RNG.float() < 0.2 ? BIG() : SMALL();
        },
        onStep: async (st, gg) => {
          if (spreadBig(gg, SMALL)) rt.msg('🃏 O coringa grande se copiou nas casas vizinhas!');
          if (lockCols.size) {
            lockCols.forEach(c => { gg[c] = gg[c].map(x => (x.sc || x.fixed ? x : LOCKW())); });
            rt.msg(`💀 Coringa dourado: coluna${lockCols.size > 1 ? 's' : ''} travada${lockCols.size > 1 ? 's' : ''}!`); rt.fx('rise');
            lockCols.clear();
          }
          rt.chip('mult', 'MULT.', 'x' + lad[Math.min(st, 4)]);
        },
      });
      rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'fortunaossos', name: 'Fortuna dos Ossos', studio: STUDIO, art: 'crossbones', mascot: 'crossbones',
      tag: 'Cartas douradas · cascata x1 a x5', colors: ['#db2777', '#f59e0b'], bg: 'linear-gradient(180deg,#4a044e,#701a75 60%,#3b0764)',
      cols: 5, rows: 4, cellH: 1.2, maxWin: 2000, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Bone Fortune" (TaDa Gaming).', hello: 'Molduras douradas viram coringa!',
      symbols: [...all, WILD],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos, com cascata.')],
      highlights: ['💀 5×4 com <b>1.024 caminhos</b> e cascata', '🔥 Cada cascata sobe o multiplicador: <b>x1 → x2 → x3 → x4 → x5</b>', '🥇 Símbolos com <b>moldura dourada</b> (rolos 2 a 4) que ganham não explodem: viram <b>coringa pequeno</b> ou <b>coringa grande</b>, que se copia em 2 ou 3 casas vizinhas', '💐 3/4/5 buquês = <b>5/8/12 rodadas grátis</b> com escada <b>x2 a x10</b>: o coringa dourado <b>trava a coluna inteira</b>', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>1.024 caminhos</b>. Os vencedores somem e novos caem (<b>cascata</b>); o multiplicador sobe a cada cascata do mesmo giro: x1, x2, x3, x4 e x5.</p><p>Símbolos com <b>moldura dourada</b> nos rolos 2 a 4 que fazem parte de um ganho ficam no lugar e viram <b>coringa</b> para a próxima cascata. Às vezes vira o <b>coringa grande</b>, que se copia em 2 ou 3 casas vizinhas.</p>',
      features: '<p>💐 <b>3, 4 ou 5 buquês</b> dão <b>5, 8 ou 12 rodadas grátis</b> (e os mesmos valores de novo se caírem nelas). A escada vira <b>x2, x4, x6, x8 e x10</b> e, quando uma moldura dourada vira coringa, <b>a coluna inteira trava como coringa</b> até o fim daquele giro.</p>',
      make: () => make(false),
      async spin(rt) {
        const g = make(false);
        await rt.spin(g);
        await play(rt, g, false);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        await rt.fsLoop(FSN[Math.min(5, sc)], async api => {
          const g = make(true);
          await rt.spin(g, { tease: false });
          await play(rt, g, true);
          const s = count(g, x => x.sc);
          if (s >= 3) api.add(FSN[Math.min(5, s)]);
        }, { sub: 'O coringa dourado trava a coluna!' });
      },
    }));
  })();

  /* =========================================================
     8. Ali Babá — 32.400 caminhos, baús multiplicadores
     ========================================================= */
  (() => {
    const SY = [
      S('alibaba', 'prince', 'Ali Babá', [1, 2, 4, 8], 3), S('camelo', 'bactrian', 'Camelo', [0.8, 1.6, 3, 6], 4), S('adaga', 'knife', 'Faca', [0.6, 1.2, 2.5, 5], 5),
      S('lampada', 'oldkey', 'Chave antiga', [0.5, 1, 2, 4], 5), ...SUITS([[0.2, 0.4, 0.8, 1.5], [0.2, 0.4, 0.8, 1.5], [0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2]]),
    ];
    const WILD = { id: 'w', img: 'lockkey', name: 'Cadeado', wild: true, reels: [1, 2, 3, 4], w: 0.6 };
    const CHEST = { id: 'bau', img: 'chest', name: 'Baú', chest: true, noPay: true, w: 0.15, fw: 0.3 };
    const SC = { id: 'sc', img: 'moneybag', name: 'Tesouro', sc: true, w: 0.62, fw: 0.4 };
    // moedas de ouro com valor impresso: 5+ na tela pagam a soma na hora (Coleta Instantânea)
    const CASH = { id: 'ouro', img: 'coin', name: 'Moeda de ouro', coin: true, noPay: true, w: 1.6, fw: 1.6 };
    const CV = [{ v: 10, w: 30 }, { v: 20, w: 30 }, { v: 40, w: 20 }, { v: 100, w: 12 }, { v: 200, w: 6 }, { v: 500, w: 2 }];
    const all = [...SY, WILD, CHEST, CASH, SC];
    const draw = pool(all);
    const cell = (c, wk, up) => { const x = draw(c, wk); if (x.chest) { x.m = RNG.int(up ? 2 : 1, 4); x.t = 'x' + x.m; } if (x.coin) x.v = RNG.weighted(CV).v; return x; };
    const make = (wk = 'w', up = false) => K.stack(grid([5, 6, 6, 6, 6, 5], c => cell(c, wk, up)), 0.4);
    const START = [{ v: 1, w: 40 }, { v: 2, w: 30 }, { v: 3, w: 18 }, { v: 5, w: 12 }];
    async function play(rt, g, wk, up, st) {
      const r = await tumble(rt, g, { draw: c => cell(c, wk, up), evaluate: gg => ways(gg, SY) });
      const cash = cells(g, x => x.coin);
      if (cash.length >= 5) {
        const v = cash.reduce((t, [c, rr]) => t + g[c][rr].v, 0);
        rt.mark(cash.map(([c, rr]) => key(c, rr)));
        rt.win(v); rt.msg(`🪙 ${cash.length} moedas de ouro: ${rt.coins(v)}`); rt.fx('coin');
        await rt.wait(900);
      }
      const chests = g.flat().filter(x => x.chest).reduce((s, x) => s + x.m, 0);
      if (st) st.m += chests;
      const m = st ? st.m : chests;
      if (st) rt.chip('mult', 'MULT.', 'x' + st.m);
      if (r.total > 0 && m > 1) {
        rt.mark(cells(g, x => x.chest).map(([c, rr]) => key(c, rr)), 'hl');
        rt.win(r.total * (m - 1));
        rt.msg(`🧰 Baús multiplicam x${m}! ${rt.coins(r.total)} → ${rt.coins(r.total * m)}`);
        rt.fx('big');
        await rt.wait(1000);
      }
    }
    App.register(K.create({
      id: 'alibaba', name: 'Ali Babá', studio: STUDIO, art: 'chest', mascot: 'genie',
      tag: 'Baús multiplicadores · 32.400 caminhos', colors: ['#b45309', '#7c3aed'], bg: 'linear-gradient(180deg,#78350f,#451a03 60%,#1c0a02)',
      cols: 6, rows: 6, cellH: 1.1, maxWin: 5000, vol: 2, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Ali Baba" (TaDa Gaming).', hello: 'Abre-te Sésamo! Baús multiplicam',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Rolos 5-6-6-6-6-5 = 32.400 caminhos, com cascata.')],
      highlights: ['🧰 <b>Baús</b> trazem multiplicadores de <b>x1 a x4</b> que se somam e valem no fim das cascatas', '🪙 <b>Coleta instantânea:</b> 5+ moedas de ouro na tela pagam a <b>soma dos valores</b> na hora', '🔐 Cadeado é coringa (rolos 2 a 5)', '💰 4+ tesouros = <b>10 rodadas grátis</b> (+2 por extra): uma roda define o multiplicador inicial e os baús <b>se acumulam</b> nele', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Rolos <b>5-6-6-6-6-5</b> (32.400 caminhos) com <b>cascata</b>.</p><p>🧰 Os <b>baús</b> não pagam sozinhos: no fim da sequência de cascatas, se houve ganho, os valores dos baús na tela se somam e multiplicam o ganho.</p><p>🪙 As <b>moedas de ouro</b> trazem um valor impresso: com <b>5 ou mais</b> na tela, a soma de todas é paga na hora.</p>',
      features: '<p>💰 <b>4 ou mais tesouros</b> dão <b>10 rodadas grátis</b> (+2 por tesouro extra). Antes de começar, uma <b>roda</b> sorteia o multiplicador inicial (x1, x2, x3 ou x5) e os baús ficam melhores (x2 a x4). Cada baú que cair <b>soma no multiplicador global</b>, que não zera.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, 'w', false, null);
        const sc = count(g, x => x.sc);
        if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 4 } = {}) {
        const i = START.indexOf(RNG.weighted(START));
        await rt.reveal('MULTIPLICADOR INICIAL', START.map(s => ({ img: 'chest', t: 'x' + s.v })), i);
        const st = { m: START[i].v };
        rt.chip('mult', 'MULT.', 'x' + st.m);
        await rt.fsLoop(10 + (sc - 4) * 2, async api => {
          const g = make('fw', true);
          await rt.spin(g, { tease: false });
          await play(rt, g, 'fw', true, st);
          if (count(g, x => x.sc) >= 4) api.add(5);
        }, { sub: 'Baús acumulam!' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     9. Búfalo Furioso (Charge Buffalo) — 6×4, 4.096 caminhos
     ========================================================= */
  (() => {
    const SY = [
      S('bufalo', 'waterbuffalo', 'Búfalo', [1, 2, 4, 8], 3), S('aguia', 'bird', 'Pássaro', [0.8, 1.5, 3, 6], 4), S('lobo', 'turkey', 'Peru', [0.6, 1.2, 2.5, 5], 4),
      S('cervo', 'goat', 'Bode', [0.5, 1, 2, 4], 5), S('puma', 'badger', 'Texugo', [0.4, 0.8, 1.6, 3], 5), ...SUITS([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]]),
    ];
    const WILD = { id: 'w', img: 'tornado', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.9, fw: 2.8 };
    const SC = { id: 'sc', img: 'moneywings', name: 'Moeda', sc: true, w: 0.65, fw: 0.45 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const WM = [{ m: 2, w: 55 }, { m: 3, w: 30 }, { m: 5, w: 15 }];
    // os multiplicadores x2/x3/x5 dos coringas só existem nas rodadas grátis; no jogo base o coringa é simples
    const make = (wk = 'w') => K.stack(grid([4, 4, 4, 4, 4, 4], c => { const x = draw(c, wk); if (x.wild && wk === 'fw') { x.m = RNG.weighted(WM).m; x.t = 'x' + x.m; } return x; }), 0.3);
    const FS0 = { 3: 8, 4: 15, 5: 25, 6: 100 }, FSR = { 2: 5, 3: 8, 4: 15, 5: 25, 6: 100 };
    App.register(K.create({
      id: 'bufalofurioso', name: 'Búfalo Furioso', studio: STUDIO, art: 'sunrise', mascot: 'bison',
      tag: '4.096 caminhos · até 100 giros', colors: ['#c2410c', '#1e3a8a'], bg: 'linear-gradient(180deg,#fdba74,#ea580c 50%,#7c2d12)',
      cols: 6, rows: 4, maxWin: 4000, vol: 3, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Charge Buffalo" (TaDa Gaming).', hello: 'Nas grátis os coringas multiplicam!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = 4.096 caminhos.')],
      highlights: ['🦬 Grade 6×4 com <b>4.096 caminhos</b>', '🌪️ Coringas nos rolos 2 a 5', '🪙 3/4/5/6 moedas = <b>8, 15, 25 ou 100 rodadas grátis</b>; 2+ moedas nelas dão mais giros', 'Nas grátis cada coringa traz <b>x2, x3 ou x5</b> e os multiplicadores <b>se somam</b>', 'Prêmio máximo: <b>4.000x</b>'],
      how: '<p>Grade <b>6×4</b> com <b>4.096 caminhos</b>. 🌪️ O coringa aparece nos rolos 2 a 5 e substitui todos os símbolos, menos a moeda.</p>',
      features: '<p>🪙 <b>3, 4, 5 ou 6 moedas</b> dão <b>8, 15, 25 ou 100 rodadas grátis</b>. Durante elas, <b>2, 3, 4, 5 ou 6 moedas</b> dão <b>+5, +8, +15, +25 ou +100</b> giros. Os coringas aparecem mais e cada um traz <b>x2, x3 ou x5</b>; vários na mesma combinação <b>se somam</b> (dois x3 = x6).</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, ways(g, SY, { wildMult: 'add' }));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let total = 0;
        await rt.fsLoop(FS0[Math.min(6, sc)], async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await pay(rt, ways(g, SY, { wildMult: 'add' }));
          const s = count(g, x => x.sc);
          if (s >= 2 && total < 200) { const a = FSR[Math.min(6, s)]; total += a; api.add(a); }
        }, { sub: 'Estouro da manada!' });
      },
    }));
  })();

  /* =========================================================
     10. Rei da Selva (Jungle King) — 5×4, 50 linhas
     ========================================================= */
  (() => {
    const L50 = K.linesFor(4, 50);
    const SY = [
      S('tigre', 'hippo', 'Hipopótamo', [2, 8, 25], 3), S('leopardo', 'zebra', 'Zebra', [1.5, 5, 15], 4), S('papagaio', 'flamingo', 'Flamingo', [1, 3, 10], 4),
      S('macaco', 'orangutan', 'Orangotango', [0.8, 2, 6], 5), S('banana', 'herb', 'Folhagem', [0.3, 1, 3], 7), ...SUITS([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]]),
    ];
    const WILD = { id: 'w', img: 'gorilla', name: 'Gorila', wild: true, w: 0.9 };
    const COIN = { id: 'moeda', img: 'greyq', name: 'Mistério', mystery: true, t: '?', w: 0.8 };
    const SC = { id: 'sc', img: 'cityscape', name: 'Arranha-céu', sc: true, w: 0.85 };
    const PLANE = { id: 'aviao', img: 'airplane', name: 'Avião', plane: true, noPay: true, w: 0, fw: 1.0 };
    const all = [...SY, WILD, COIN, SC, PLANE];
    const draw = pool(all);
    const make = (wk = 'w') => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const reveal = g => { if (!g.some(col => col.some(x => x.mystery))) return null; const s = RNG.pick([...SY, WILD]); g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...s, fresh: true }; })); return s; };
    App.register(K.create({
      id: 'reiselva', name: 'Rei da Selva', studio: STUDIO, art: 'gorilla', mascot: 'gorilla',
      tag: 'Gorila coringa · aviões multiplicam', colors: ['#15803d', '#a16207'], bg: 'linear-gradient(180deg,#14532d,#166534 60%,#052e16)',
      cols: 5, rows: 4, maxWin: 2500, vol: 2, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Jungle King" (TaDa Gaming).', hello: 'O Gorila substitui tudo!',
      symbols: all,
      lineList: { cols: 5, rows: 4, list: L50, text: '50 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['🦍 <b>Gorila</b> coringa substitui todos os símbolos', '🪙 <b>Moedas do gorila</b> viram todas o mesmo símbolo sorteado', '🏦 3/4/5 arranha-céus = <b>8 rodadas grátis</b> com multiplicador <b>x1, x2 ou x3</b>', '✈️ Nas grátis o gorila derruba <b>aviões</b> e cada um soma <b>+1</b> no multiplicador', 'Prêmio máximo: <b>2.500x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>50 linhas</b>. 🦍 Gorila é coringa.</p><p>🪙 As <b>moedas de prata</b> são símbolos misteriosos: todas viram o mesmo símbolo sorteado (pode ser o gorila).</p>',
      features: '<p>🏦 <b>3, 4 ou 5 arranha-céus</b> dão <b>8 rodadas grátis</b> com multiplicador inicial <b>x1, x2 ou x3</b>. Durante elas aparecem ✈️ <b>aviões</b>: o King Kong derruba cada um e soma <b>+1 no multiplicador</b>, que vale para todo o resto do bônus.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const s = reveal(g);
        if (s) { rt.msg(`🪙 Moedas viraram ${s.name}!`); await rt.drop(g); }
        await pay(rt, lines(g, L50, SY));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let m = Math.min(3, sc - 2);
        rt.chip('mult', 'MULT.', 'x' + m);
        await rt.fsLoop(8, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          const pl = count(g, x => x.plane);
          if (pl) { m += pl; rt.chip('mult', 'MULT.', 'x' + m); rt.msg(`✈️ King Kong derrubou ${pl} avião${pl > 1 ? 'ões' : ''}! x${m}`); rt.fx('boom'); await rt.wait(700); g.forEach((col, c) => col.forEach((x, r) => { if (x.plane) g[c][r] = { ...RNG.pick(SY), fresh: true }; })); }
          const s = reveal(g);
          if (pl || s) await rt.drop(g);
          await pay(rt, lines(g, L50, SY), m);
          if (count(g, x => x.sc) >= 3) api.add(8);
        }, { sub: `8 giros · começa em x${m}` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     11. Noite de Festa (Party Night) — 5×3, 243 caminhos, cascata até x10
     ========================================================= */
  (() => {
    const SY = [
      S('micro', 'microphone', 'Microfone', [2, 5, 15], 3), S('sax', 'saxophone', 'Saxofone', [1.5, 4, 10], 4), S('drink', 'cocktail', 'Drink', [1, 3, 8], 4),
      S('fone', 'headphone', 'Fone', [0.8, 2, 5], 5), S('notas', 'notes', 'Notas', [0.4, 1, 2.5], 7), S('balao', 'confettiball', 'Confete', [0.3, 0.8, 2], 8), S('estrela', 'violin', 'Violino', [0.25, 0.6, 1.5], 9),
    ];
    const WILD = { id: 'w', img: 'dancer', name: 'DJ', wild: true, reels: [1, 2, 3], w: 0.8 };
    const SC = { id: 'sc', img: 'mirrorball', name: 'Globo', sc: true, w: 0.7 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const COCK = [{ m: 2, w: 30 }, { m: 3, w: 30 }, { m: 4, w: 20 }, { m: 5, w: 12 }, { m: 6, w: 8 }];
    // a cascata sempre começa em x1; nas grátis o valor do coquetel multiplica por cima
    async function play(rt, g, cm = 1) {
      let m = 1;
      rt.chip('mult', 'MULT.', 'x' + m * cm);
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => ways(gg, SY), mult: () => m * cm, onStep: async () => { m = Math.min(10, m + 1); rt.chip('mult', 'MULT.', 'x' + m * cm); } });
      rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'noitefesta', name: 'Noite de Festa', studio: STUDIO, art: 'mirrorball', mascot: 'party',
      tag: 'Cascata até x10 · coquetel até x6', colors: ['#c026d3', '#0891b2'], bg: 'linear-gradient(180deg,#1e1b4b,#4a044e 60%,#0f172a)',
      cols: 5, rows: 3, maxWin: 1000, vol: 2, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Party Night" (TaDa Gaming).', hello: 'Cada cascata aumenta a festa!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '243 caminhos com cascata.')],
      highlights: ['🪩 5×3 com <b>243 caminhos</b> e cascata', 'Multiplicador sobe a cada cascata: <b>x1, x2, x3… até x10</b>', '🍹 3+ globos = <b>12 rodadas grátis</b>: escolha <b>1 de 3 coquetéis</b>, que revela um multiplicador de <b>x2 a x6</b> para todos os ganhos', 'Prêmio máximo: <b>1.000x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>243 caminhos</b>. Os vencedores somem e novos caem; cada cascata seguida sobe o multiplicador (até <b>x10</b>). 🎉 DJ é coringa.</p>',
      features: '<p>🪩 <b>3 ou mais globos</b> dão <b>12 rodadas grátis</b>. Antes de começar você escolhe <b>1 de 3 coquetéis</b>: ele revela um multiplicador de <b>x2 a x6</b> que vale para todos os ganhos do bônus. A escada da cascata continua começando em x1 e os dois se multiplicam (coquetel x4 com cascata x3 = x12). 3+ globos nelas dão +12 giros (até 250 no total).</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        // os 3 coquetéis escondem valores sorteados; o escolhido vale para o bônus todo
        const vals = [0, 1, 2].map(() => RNG.weighted(COCK).m);
        const imgs = ['cocktail', 'tropicaldrink', 'tumbler'];
        const pick = await rt.choose('ESCOLHA UM COQUETEL', vals.map((v, i) => ({ id: String(i), img: imgs[i], label: '?', desc: 'x2 a x6' })));
        const cm = vals[Number(pick)];
        rt.msg(`🍹 Coquetel x${cm}! Os outros eram ${vals.filter((v, i) => i !== Number(pick)).map(v => 'x' + v).join(' e ')}`);
        rt.fx('big');
        await rt.wait(1000);
        let total = 12;
        await rt.fsLoop(12, async api => {
          const g = make();
          await rt.spin(g, { tease: false });
          await play(rt, g, cm);
          if (count(g, x => x.sc) >= 3 && total < 250) { total += 12; api.add(12); }
        }, { sub: `Coquetel x${cm} em todos os ganhos` });
      },
    }));
  })();
})();
