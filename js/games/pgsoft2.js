'use strict';

/* =========================================================
   PG Soft — lote 2 (parte 1). Quase todos usam cascata com
   multiplicador progressivo e "Coringas no Caminho" (molduras),
   então há um modelo comum (pg) e alguns jogos próprios.
   Regras baseadas nos originais; RTP calibrado por simulação.
   ========================================================= */
(function () {
  const K = SlotKit, T = SlotT;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'pgsoft';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const R = (pays, w) => K.ROYALS(pays, w);
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };
  const rnd = (a, b) => () => RNG.int(a, b);
  /** prêmios por caminho prontos (3..6 rolos ou 3..5 rolos) */
  const P6 = [[1, 2, 4, 8], [0.8, 1.6, 3, 6], [0.6, 1.2, 2.5, 5], [0.5, 1, 2, 4], [0.4, 0.8, 1.6, 3], [0.2, 0.4, 0.8, 1.5], [0.2, 0.4, 0.8, 1.5], [0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2]];
  const P5 = [[1.5, 3, 6], [1, 2.5, 5], [0.8, 2, 4], [0.6, 1.5, 3], [0.5, 1.2, 2.5], [0.2, 0.5, 1], [0.2, 0.5, 1], [0.15, 0.4, 0.8], [0.15, 0.4, 0.8]];
  const W9 = [3, 4, 5, 5, 6, 8, 8, 9, 9];
  /** lista [id, img, nome] → símbolos; os 4 últimos podem ser letras (A K Q J) */
  const mk = (list, P, royals = true) => {
    const hi = list.map(([id, img, name], i) => S(id, img, name, P[i], W9[i]));
    if (!royals) return hi;
    return [...hi, ...['A', 'K', 'Q', 'J'].map((l, i) => K.L(l, P[hi.length + i] || P[P.length - 1], W9[hi.length + i] || 9))];
  };

  /** Moldura prata → símbolo com moldura dourada → coringa (Coringas no Caminho). */
  const frames = (syms, wild) => x => {
    if (x.frame === 'silver') return { ...RNG.pick(syms), frame: 'gold', gold: true, fresh: true };
    if (x.frame === 'gold') return { ...wild, fresh: true };
    return null;
  };

  /* =========================================================
     Modelo comum: caminhos + cascata + multiplicador
     o.baseM / o.fsM: { ladder: [...] } | { start, add, cap } | { start, dbl, cap }
     o.fsM.persist: o multiplicador não zera entre os giros grátis
     o.silver / o.gold: [chance base, chance grátis] de moldura
     o.before / o.after / o.onWin: ganchos para recursos próprios
     ========================================================= */
  function pg(o) {
    // nas grátis os 4 símbolos mais baixos caem mais (ganhos mais frequentes)
    const SY = o.syms.map((x, i, a) => ({ ...x, fw: x.fw ?? x.w * (i >= a.length - 4 ? o.fsConc || 1.6 : 1) }));
    const WILD = { id: 'w', img: o.wildImg, name: o.wildName || 'Coringa', wild: true, reels: o.wildReels || [1, 2, 3, 4], w: o.wildW ?? 0.6, fw: o.wildFW ?? o.wildW ?? 0.6 };
    const SC = { id: 'sc', img: o.scImg, name: o.scName, sc: true, w: o.scW, fw: o.scFW ?? o.scW * 0.8 };
    const draw = pool([...SY, WILD, SC, ...(o.extra || [])]);
    const FR = o.frameReels || [1, 2, 3, 4];
    const cell = (c, fs) => {
      let x = draw(c, fs ? 'fw' : 'w');
      const plain = !x.wild && !x.sc && !x.noPay && FR.includes(c);
      if (plain && o.silver && RNG.float() < o.silver[fs ? 1 : 0]) { x.frame = 'silver'; x.c = 'fsilver'; }
      else if (plain && o.gold && RNG.float() < o.gold[fs ? 1 : 0]) { x.frame = 'gold'; x.gold = true; }
      if (o.cell) x = o.cell(x, c, fs) || x;
      return x;
    };
    const make = fs => K.stack(grid(o.heights(fs), c => cell(c, fs)), o.stack ?? 0.3);
    const conv = frames(SY, WILD);
    const mval = (M, st) => (M.ladder ? M.ladder[Math.min(st.step, M.ladder.length - 1)] : st.m);
    const step = (M, st) => { st.step++; if (M.add) st.m = Math.min(M.cap || 1e9, st.m + M.add); if (M.dbl) st.m = Math.min(M.cap || 1e9, st.m * 2); };
    const evalOf = gg => (o.evaluate ? o.evaluate(gg) : o.both ? both(gg, SY) : ways(gg, SY, { wildMult: o.wildMult || 'mul' }));
    async function play(rt, g, fs, st) {
      const M = fs ? o.fsM : o.baseM;
      if (!fs || !M.persist) { st.m = M.start ?? 1; st.step = 0; }
      if (o.before) await o.before(rt, g, fs, st);
      await rt.spin(g, { tease: !fs });
      if (o.afterLand) await o.afterLand(rt, g, fs, st);
      const show = () => { const v = o.multOf ? o.multOf(st, fs) : mval(M, st); if (v > 1 || M.ladder || M.add || M.dbl) rt.chip('mult', 'MULT.', 'x' + v); };
      show();
      await tumble(rt, g, {
        draw: c => cell(c, fs),
        evaluate: gg => { const r = evalOf(gg); if (r.total && o.onWin) o.onWin(r, gg, fs, st, rt); return r; },
        mult: () => (o.multOf ? o.multOf(st, fs) : mval(M, st)),
        convert: (x, c, r) => (o.convert && o.convert(x, c, r, fs, st)) || conv(x),
        keep: o.keep ? x => o.keep(x, fs) : null,
        onStep: async (s, gg, res) => { step(M, st); if (o.onStep) await o.onStep(rt, gg, fs, st, res, c => cell(c, fs)); show(); },
      });
      if (o.after) await o.after(rt, g, fs, st);
      if (!fs) rt.chip('mult', null);
      return count(g, x => x.sc);
    }
    const scMin = o.scMin || 3;
    return K.create({
      id: o.id, name: o.name, studio: o.studio || STUDIO, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: o.cols || 6, rows: o.rows || 6, cellH: o.cellH || 1.15, maxWin: o.maxWin, vol: o.vol || 3, rtp: o.rtp || '~96,7%', target: o.target || 0.967,
      intro: o.intro, hello: o.hello, symbols: [...SY, WILD, SC, ...(o.extra || [])], extraSprites: o.sprites,
      tables: [table(o.both ? 'Pagamento por caminho (dos dois lados)' : 'Pagamento por caminho', heads(3, SY[0].pays.length, ' rolos'), SY, o.waysNote || 'Iguais em rolos seguidos a partir da esquerda, com cascata.')],
      highlights: o.highlights, how: o.how, features: o.features,
      make: () => make(false),
      async spin(rt) {
        const st = {};
        const g = make(false);
        const sc = await play(rt, g, false, st);
        if (sc >= scMin) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = scMin } = {}) {
        const st = { m: o.fsM.start ?? 1, step: 0, ...(o.fsState ? o.fsState() : {}) };
        await rt.fsLoop(o.fsCount(sc), async api => {
          st.api = api;
          const s = await play(rt, make(true), true, st);
          if (s >= (o.retrigMin || scMin)) api.add(o.retrig ? o.retrig(s) : o.fsCount(s));
        }, { sub: o.fsSub || 'O multiplicador não zera!' });
        rt.chip('mult', null);
        if (o.fsEnd) o.fsEnd(rt);
      },
    });
  }
  /** caminhos dos dois lados (esquerda→direita + direita→esquerda; 6 rolos contam uma vez) */
  function both(g, SY) {
    const a = ways(g, SY), rev = g.slice().reverse(), b = ways(rev, SY), n = g.length;
    b.wins = b.wins.filter(w => w.n < n);
    b.total = b.wins.reduce((s, w) => s + w.pay, 0);
    const cellsB = new Set();
    if (b.total) b.cells.forEach(k => { const [c, r] = unkey(k); cellsB.add(key(n - 1 - c, r)); });
    return { total: a.total + b.total, wins: [...a.wins, ...b.wins], cells: new Set([...a.cells, ...cellsB]) };
  }
  const silverTxt = '🖼️ Símbolos com <b>moldura prata</b> que ganham viram outro símbolo com <b>moldura dourada</b>; a dourada, ao ganhar de novo, vira <b>coringa</b>.';
  const goldTxt = '🖼️ Símbolos com <b>moldura dourada</b> viram <b>coringa</b> quando fazem parte de um ganho.';
  // reaproveitado pelo pgsoft3.js
  SlotT.pg = pg;
  SlotT.pgx = { P6, P5, mk, both, silverTxt, goldTxt };

  /* 1. Caminhos do Qilin */
  App.register(pg({
    id: 'qilin', name: 'Caminhos do Qilin', art: 'qilin', mascot: 'qilin', tag: 'Até 46.656 caminhos · mult. sem teto',
    colors: ['#b91c1c', '#f59e0b'], bg: 'linear-gradient(180deg,#7f1d1d,#b91c1c 50%,#431407)', maxWin: 7106, rtp: '~96,7%',
    intro: 'Inspirado no "Ways of the Qilin" (PG Soft).', hello: 'Rolos de 2 a 6 símbolos!',
    syms: mk([['qilin', 'qilin', 'Qilin'], ['lingote', 'goldingot', 'Lingote'], ['lanterna', 'izakaya', 'Lanterna'], ['moeda', 'coin', 'Moeda'], ['nó', 'knot', 'Nó chinês']], P6),
    wildImg: 'dragonface', scImg: 'fireworks', scName: 'Fogos', scW: 1.1, scMin: 4, fsConc: 2,
    heights: () => Array.from({ length: 6 }, () => RNG.int(2, 6)), silver: [0, 0.32], frameReels: [1, 2, 3],
    baseM: {}, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 5 + (s - 4) * 2, retrig: s => 2 + (s - 4) * 2,
    highlights: ['🐉 6 rolos de 2 a 6 símbolos: até <b>46.656 caminhos</b>, com cascata', '🎆 4+ fogos = <b>5 rodadas grátis</b> (+2 por extra)', 'Nas grátis o multiplicador sobe <b>+1 a cada ganho, sem teto</b>, e símbolos dos rolos 2 a 4 com moldura prata viram coringas', 'Prêmio máximo: <b>7.106x</b>'],
    how: '<p>6 rolos com altura aleatória (2 a 6 símbolos). Iguais em rolos seguidos pagam por caminho e somem (cascata).</p>',
    features: `<p>🎆 <b>4 ou mais fogos</b> dão <b>5 rodadas grátis</b> (+2 por fogo extra). O multiplicador começa em x1, sobe <b>+1 a cada cascata com ganho</b> e não zera. ${silverTxt}</p>`,
  }));

  /* 2. Duelo Selvagem (Wild Bounty Showdown) — multiplicador dobra até x1.024 */
  App.register(pg({
    id: 'dueloselvagem', name: 'Duelo Selvagem', art: 'cowboy', mascot: 'cowboy', tag: 'Multiplicador dobra até x1.024',
    colors: ['#b45309', '#7f1d1d'], bg: 'linear-gradient(180deg,#fdba74,#b45309 50%,#451a03)', maxWin: 5000, vol: 4, rtp: '~96,8%', target: 0.968,
    intro: 'Inspirado no "Wild Bounty Showdown" (PG Soft).', hello: 'O multiplicador dobra a cada cascata!',
    syms: mk([['pistoleira', 'cowboy', 'Pistoleira'], ['revolver', 'pistol', 'Revólver'], ['cantil', 'canteen', 'Cantil'], ['saco', 'moneybag', 'Saco de ouro'], ['dinamite', 'firecracker', 'Dinamite']], P6),
    wildImg: 'sheriff', scImg: 'cactus', scName: 'Cacto', scW: 0.65, scMin: 3,
    heights: () => [3, 4, 5, 5, 4, 3], gold: [0.06, 0.12], stack: 0.35,
    baseM: { start: 1, dbl: true, cap: 1024 }, fsM: { start: 8, dbl: true, cap: 1024 }, fsCount: s => 10 + (s - 3) * 2,
    waysNote: 'Rolos 3-4-5-5-4-3 = 3.600 caminhos.',
    highlights: ['🤠 3.600 caminhos com cascata', 'O multiplicador <b>dobra a cada cascata</b>: x1, x2, x4… até <b>x1.024</b>', '🌵 3+ cactos = <b>10 rodadas grátis</b> (+2 por extra) com o multiplicador começando em <b>x8</b> a cada giro', 'Prêmio máximo: <b>5.000x</b>'],
    how: `<p>Rolos 3-4-5-5-4-3 (3.600 caminhos). Cada cascata com ganho <b>dobra</b> o multiplicador (até x1.024); ele volta a x1 no próximo giro. ${goldTxt}</p>`,
    features: '<p>🌵 <b>3 ou mais cactos</b> dão <b>10 rodadas grátis</b> (+2 por cacto extra). Em cada giro grátis o multiplicador começa em <b>x8</b> e dobra a cada cascata até x1.024.</p>',
    fsSub: 'Cada giro começa em x8!',
  }));

  /* 3. Ouro Alquímico — grupos 5×5 */
  (() => {
    const P = [[1, 2, 5, 15, 50], [0.8, 1.5, 4, 10, 30], [0.6, 1.2, 3, 8, 20], [0.5, 1, 2, 5, 15], [0.4, 0.8, 1.5, 4, 10], [0.3, 0.6, 1.2, 3, 8], [0.25, 0.5, 1, 2.5, 6]];
    const SY = [['pedra', 'gem', 'Pedra filosofal'], ['pocao', 'potion', 'Poção'], ['amuleto', 'nazar', 'Amuleto'], ['cristal', 'crystalball', 'Cristal'], ['frasco', 'alembic', 'Alambique'], ['erva', 'herb', 'Erva'], ['vela', 'candle', 'Vela']].map(([id, img, name], i) => S(id, img, name, P[i], [5, 6, 7, 8, 9, 12, 14][i], { fw: [5, 6, 7, 8, 9, 12, 14][i] * (i >= 5 ? 2 : 1) }));
    const SC = { id: 'sc', img: 'goldbook', name: 'Grimório', sc: true, w: 0.8, fw: 0.45 };
    const WILD = { id: 'w', img: 'sparkles', name: 'Coringa', wild: true, w: 0 };
    const draw = pool([...SY, SC]);
    const cell = fs => { const x = draw(0, fs ? 'fw' : 'w'); if (!x.sc && RNG.float() < (fs ? 0.08 : 0.04)) x.gold = true; return x; };
    const make = fs => grid([5, 5, 5, 5, 5], () => cell(fs));
    const TT = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : 4);
    async function play(rt, g, fs, st) {
      if (!fs) st.m = 1;
      await rt.drop(g);
      rt.chip('mult', 'MULT.', 'x' + st.m);
      await tumble(rt, g, {
        draw: () => cell(fs),
        evaluate: gg => payClusters(clusters(gg, 5), TT),
        mult: () => st.m,
        convert: x => (x.gold ? { ...WILD, fresh: true } : null),
        onStep: async () => { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); },
      });
      if (!fs) rt.chip('mult', null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'ouroalquimico', name: 'Ouro Alquímico', studio: STUDIO, art: 'alembic', mascot: 'mage',
      tag: 'Grupos · dourados viram coringa', colors: ['#a16207', '#4c1d95'], bg: 'radial-gradient(circle at 50% 30%,#4c1d95,#1c0f2e 70%)',
      cols: 5, rows: 5, maxWin: 2661, vol: 3, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Alchemy Gold" (PG Soft).', hello: 'Grupos de 5+ iguais pagam!',
      symbols: [...SY, SC, WILD],
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13+'], SY, 'Grupos de 5+ iguais encostados.')],
      highlights: ['⚗️ Grade 5×5 com grupos de 5+ e cascata', 'Multiplicador <b>+1 a cada cascata</b>', '✨ Símbolos <b>dourados</b> que ganham viram <b>coringa</b>', '📖 3+ grimórios = <b>10 rodadas grátis</b> com o multiplicador que <b>não zera</b>', 'Prêmio máximo: <b>2.661x</b>'],
      how: '<p>Grade 5×5: grupos de 5 ou mais iguais encostados pagam e somem (cascata). O multiplicador sobe +1 a cada cascata e volta a x1 no giro seguinte. Símbolos dourados que fazem parte de um ganho viram coringa.</p>',
      features: '<p>📖 <b>3 ou mais grimórios</b> dão <b>10 rodadas grátis</b> (+2 por extra; 3+ nelas dão +5). O multiplicador <b>não zera</b> entre os giros.</p>',
      make: () => make(false),
      async spin(rt) { const st = {}; const g = make(false); const sc = await play(rt, g, false, st); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const st = { m: 1 };
        await rt.fsLoop(10 + (sc - 3) * 2, async api => { if (await play(rt, make(true), true, st) >= 3) api.add(5); }, { sub: 'O multiplicador não zera!' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 4. Cruzeiro Real — coringas viajantes na diagonal */
  (() => {
    const SY = mk([['capitao', 'captain', 'Capitão'], ['champanhe', 'champagne', 'Champanhe'], ['boia', 'ringbuoy', 'Boia'], ['ancora', 'anchor', 'Âncora'], ['concha', 'shell', 'Concha']], P6);
    const WILD = { id: 'w', img: 'passengership', name: 'Coringa viajante', wild: true, w: 0 };
    const TOPW = { id: 'tw', img: 'passengership', name: 'Coringa viajante', wild: true, travel: true, w: 0.8, fw: 1.2 };
    const SC = { id: 'sc', img: 'ticket', name: 'Bilhete', sc: true, w: 1.0, fw: 0.6 };
    const draw = pool([...SY, SC]), topDraw = pool([...SY, TOPW]);
    const make = fs => grid([4, 4, 4, 4, 4, 4], c => draw(c, fs ? 'fw' : 'w'));
    /** a linha de cima (horizontal) pode trazer coringas que descem na diagonal para a esquerda */
    const top = fs => Array.from({ length: 4 }, (_, i) => topDraw(i + 1, fs ? 'fw' : 'w'));
    async function play(rt, g, fs, st) {
      if (!fs) { st.m = 1; st.trav = []; }
      const t = top(fs);
      t.forEach((x, i) => { if (x.travel) st.trav.push({ c: i + 1, r: 0 }); });
      rt.head(t.map(x => (x.travel ? '🚢' : '')).concat(['']).slice(0, 6));
      const place = gg => st.trav.forEach(w => { if (gg[w.c] && gg[w.c][w.r]) gg[w.c][w.r] = { ...WILD, c: 'sticky' }; });
      place(g);
      await rt.spin(g, { tease: !fs });
      rt.chip('mult', 'MULT.', 'x' + st.m);
      await tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'),
        evaluate: gg => ways(gg, SY),
        mult: () => st.m,
        keep: x => !!x.wild,
        onStep: async (s, gg) => {
          if (fs) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); }
          // coringas andam uma casa na diagonal (baixo-esquerda) a cada cascata
          gg.forEach((col, c) => col.forEach((x, r) => { if (x.wild) gg[c][r] = { ...draw(c), fresh: true }; }));
          st.trav = st.trav.map(w => ({ c: w.c - 1, r: w.r + 1 })).filter(w => w.c >= 0 && w.r < 4);
          place(gg);
        },
      });
      // entre giros os coringas também andam
      st.trav = st.trav.map(w => ({ c: w.c - 1, r: w.r + 1 })).filter(w => w.c >= 0 && w.r < 4);
      if (!fs) { st.trav = []; rt.chip('mult', null); }
      rt.head(null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'cruzeiroreal', name: 'Cruzeiro Real', studio: STUDIO, art: 'passengership', mascot: 'captain',
      tag: 'Coringas que viajam na diagonal', colors: ['#0369a1', '#facc15'], bg: 'linear-gradient(180deg,#bae6fd,#0ea5e9 50%,#082f49)',
      cols: 6, rows: 4, maxWin: 2500, vol: 2, rtp: '~96,6%', target: 0.966,
      intro: 'Inspirado no "Cruise Royale" (PG Soft).', hello: 'Navios coringa descem na diagonal!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 com cascata.')],
      highlights: ['🚢 6×4 com cascata; a faixa de cima traz <b>coringas viajantes</b>', 'Cada coringa <b>desce na diagonal para a esquerda</b> a cada cascata até sair da grade', '🎫 4+ bilhetes = <b>8 rodadas grátis</b>: coringas continuam viajando entre os giros e o multiplicador sobe <b>+1 por ganho</b>', 'Prêmio máximo: <b>2.500x</b>'],
      how: '<p>Grade 6×4 que paga por caminho, com cascata. A faixa acima dos rolos 2 a 5 pode mostrar um 🚢: ele entra na grade como coringa e, a cada cascata, <b>anda uma casa na diagonal para baixo e para a esquerda</b>.</p>',
      features: '<p>🎫 <b>4 ou mais bilhetes</b> dão <b>8 rodadas grátis</b> (+2 por extra). Os coringas viajantes <b>persistem entre os giros</b> e o multiplicador soma <b>+1 a cada cascata</b>, sem zerar.</p>',
      make: () => make(false),
      async spin(rt) { const st = {}; const g = make(false); const sc = await play(rt, g, false, st); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 4 } = {}) {
        const st = { m: 1, trav: [] };
        await rt.fsLoop(8 + (sc - 4) * 2, async api => { if (await play(rt, make(true), true, st) >= 4) api.add(4); }, { sub: 'Coringas viajam entre os giros' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 5. Cápsula de Doces (Candy Bonanza) — grupos 4+ e doce gigante */
  (() => {
    const P = [[0.5, 1, 2, 5, 15, 50], [0.4, 0.8, 1.5, 4, 10, 30], [0.3, 0.6, 1.2, 3, 8, 25], [0.25, 0.5, 1, 2.5, 6, 20], [0.2, 0.4, 0.8, 2, 5, 15], [0.15, 0.3, 0.6, 1.5, 4, 12]];
    const SY = [['bala', 'candy', 'Bala'], ['pirulito', 'lollipop', 'Pirulito'], ['chocolate', 'candybar', 'Chocolate'], ['bolinho', 'cupcake', 'Cupcake'], ['rosquinha', 'doughnut', 'Rosquinha'], ['biscoito', 'cookie', 'Biscoito'], ['gelatina', 'jelly', 'Gelatina'], ['marsh', 'marshmallow', 'Marshmallow']].map(([id, img, name], i) => S(id, img, name, P[Math.min(i, 5)].map(p => p * (i >= 6 ? 0.8 : 1)), [5, 6, 7, 8, 9, 10, 11, 12][i]));
    const SC = { id: 'sc', img: 'gumball', name: 'Máquina de doces', sc: true, w: 0.5, fw: 0.25 };
    const WILD = { id: 'w', img: 'rainbow', name: 'Coringa', wild: true, w: 0.15, fw: 0.3 };
    const draw = pool([...SY, SC, WILD]);
    const make = fs => grid([6, 6, 6, 6, 6, 6], c => draw(c, fs ? 'fw' : 'w'));
    const TT = n => (n < 4 ? -1 : n <= 5 ? 0 : n <= 7 ? 1 : n <= 9 ? 2 : n <= 12 ? 3 : n <= 15 ? 4 : 5);
    /** grupo com um quadrado 2×2 do mesmo doce vira "doce gigante" e paga em dobro */
    const square = (k, gg) => k.cells.some(kk => { const [c, r] = unkey(kk); const id = k.sym.id; const is = (a, b) => gg[a] && gg[a][b] && gg[a][b].id === id; return is(c + 1, r) && is(c, r + 1) && is(c + 1, r + 1) && is(c, r); });
    async function play(rt, g, fs, st) {
      if (!fs) st.m = 1;
      if (fs) st.sticky.forEach(kk => { const [c, r] = unkey(kk); g[c][r] = { ...WILD, c: 'sticky' }; });
      await rt.drop(g);
      rt.chip('mult', 'MULT.', 'x' + st.m);
      await tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'),
        evaluate: gg => payClusters(clusters(gg, 4), TT, k => (square(k, gg) ? 2 : 1)),
        mult: () => st.m,
        onStep: async () => { st.m = Math.min(fs ? 25 : 100, st.m + 1); rt.chip('mult', 'MULT.', 'x' + st.m); },
      });
      if (fs) cells(g, x => x.wild).forEach(([c, r]) => { if (st.sticky.size < 8) st.sticky.add(key(c, r)); });
      if (!fs) rt.chip('mult', null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'capsuladoces', name: 'Cápsula de Doces', studio: STUDIO, art: 'gumball', mascot: 'lollipop',
      tag: 'Grupos de 4 · mult. até x100', colors: ['#ec4899', '#8b5cf6'], bg: 'linear-gradient(180deg,#fbcfe8,#f0abfc 50%,#7c3aed)',
      cols: 6, rows: 6, maxWin: 50000, vol: 3, rtp: '~96,7%', target: 0.967,
      intro: 'Inspirado no "Candy Bonanza" (PG Soft).', hello: 'Grupos de 4+ doces pagam!',
      symbols: [...SY, SC, WILD],
      tables: [table('Pagamento por tamanho do grupo', ['4–5', '6–7', '8–9', '10–12', '13–15', '16+'], SY, 'Grupos de 4+ iguais encostados, com cascata.')],
      highlights: ['🍬 6×6 com grupos de <b>4 ou mais</b> e cascata', 'Multiplicador <b>+1 a cada cascata</b> (até x100; nas grátis até x25 sem zerar)', '🍭 Grupo com um <b>quadrado 2×2</b> vira doce gigante e paga em <b>dobro</b>', '3+ máquinas = <b>10 rodadas grátis</b> com <b>coringas colantes</b> e multiplicador que não zera', 'Prêmio máximo: <b>50.000x</b>'],
      how: '<p>Grade 6×6: grupos de 4 ou mais iguais encostados pagam, com cascata. O multiplicador sobe +1 a cada cascata (até x100) e volta a x1 no próximo giro. Grupos que contêm um quadrado 2×2 pagam em dobro.</p>',
      features: '<p>🍬 <b>3 ou mais máquinas de doces</b> dão <b>10 rodadas grátis</b> (+2 por extra). O multiplicador não zera (até x25) e os coringas que aparecem <b>voltam no mesmo lugar</b> em todos os giros seguintes (até 8).</p>',
      make: () => make(false),
      async spin(rt) { const st = {}; const g = make(false); const sc = await play(rt, g, false, st); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const st = { m: 1, sticky: new Set() };
        await rt.fsLoop(10 + (sc - 3) * 2, async api => { if (await play(rt, make(true), true, st) >= 3) api.add(5); }, { sub: 'Coringas colantes · mult. não zera' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 6. Destino do Sol e da Lua — paga dos dois lados */
  (() => {
    const SUN = { id: 'sol', img: 'sunface', name: 'Sol', noPay: true, sunmoon: true, w: 0, fw: 0.5 };
    const MOON = { id: 'lua', img: 'moonface', name: 'Lua', noPay: true, sunmoon: true, w: 0, fw: 0.5 };
    App.register(pg({
      id: 'solelua', name: 'Destino do Sol e da Lua', art: 'sunface', mascot: 'moonface', tag: 'Paga dos dois lados · 20.000x',
      colors: ['#f59e0b', '#312e81'], bg: 'linear-gradient(90deg,#f59e0b,#7c2d12 45%,#1e1b4b 55%,#312e81)', maxWin: 20000, vol: 4, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Destiny of Sun & Moon" (PG Soft).', hello: 'Ganhos valem da esquerda e da direita!',
      syms: mk([['deus', 'sunbehind', 'Deus Sol'], ['deusa', 'crescentmoon', 'Deusa Lua'], ['fenix', 'phoenix', 'Fênix'], ['jade', 'greenheart', 'Jade'], ['espelho', 'mirror', 'Espelho']], P6),
      wildImg: 'eclipse', scImg: 'milkyway', scName: 'Céu estrelado', scW: 0.85, scMin: 3, extra: [SUN, MOON], wildReels: [1, 2, 3, 4],
      heights: () => [2, 3, 4, 4, 3, 2], both: true, cellH: 1.1,
      baseM: {}, fsM: { start: 1, persist: true }, fsCount: s => 10 + (s - 3) * 2,
      afterLand: async (rt, g, fs, st) => { const n = count(g, x => x.sunmoon); if (fs && n) { st.m += 2 * n; rt.msg(`☀️🌙 +${2 * n} no multiplicador (x${st.m})`); rt.fx('rise'); } },
      multOf: (st, fs) => (fs ? st.m : 1),
      waysNote: 'Rolos 2-3-4-4-3-2 = 576 caminhos, valendo da esquerda para a direita e da direita para a esquerda.',
      highlights: ['☀️🌙 Rolos 2-3-4-4-3-2 (576 caminhos) que pagam <b>dos dois lados</b>, com cascata', '🌌 3+ céus estrelados = <b>10 rodadas grátis</b> (+2 por extra)', 'Nas grátis cada <b>Sol ou Lua</b> que cai soma <b>+2</b> no multiplicador, que não zera', 'Prêmio máximo: <b>20.000x</b>'],
      how: '<p>Rolos 2-3-4-4-3-2: combinações valem a partir do rolo da esquerda <b>e</b> do rolo da direita, com cascata.</p>',
      features: '<p>🌌 <b>3 ou mais céus estrelados</b> dão <b>10 rodadas grátis</b> (+2 por extra). Durante elas caem símbolos de ☀️ Sol e 🌙 Lua: cada um soma <b>+2</b> no multiplicador, que vale para todos os ganhos e não zera.</p>',
    }));
  })();

  /* 7. Reino Jurássico */
  App.register(pg({
    id: 'reinojurassico', name: 'Reino Jurássico', art: 'trex', mascot: 'sauropod', tag: 'Até 46.656 caminhos · molduras',
    colors: ['#15803d', '#78350f'], bg: 'linear-gradient(180deg,#bbf7d0,#166534 50%,#1c1917)', maxWin: 6684, rtp: '~96,7%',
    intro: 'Inspirado no "Jurassic Kingdom" (PG Soft).', hello: 'Molduras viram coringas!',
    syms: mk([['trex', 'trex', 'T-Rex'], ['saurop', 'sauropod', 'Saurópode'], ['ovo', 'egg', 'Ovo'], ['osso', 'bone', 'Osso'], ['pegada', 'footprints', 'Pegada']], P6),
    wildImg: 'volcano', scImg: 'dinoegg', scName: 'Ovo dourado', scW: 1.3, scMin: 4, fsConc: 2,
    heights: () => Array.from({ length: 6 }, () => RNG.int(2, 6)), silver: [0.06, 0.25],
    baseM: { start: 1, add: 1, cap: 5 }, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 8 + (s - 4) * 2,
    highlights: ['🦖 6 rolos de 2 a 6 símbolos (até 46.656 caminhos) com cascata', 'Multiplicador <b>+1 por cascata</b> até x5 no jogo base', '🖼️ Molduras prata → douradas → <b>coringa</b>', '🥚 4+ ovos = <b>8 rodadas grátis</b> (+2 por extra) com multiplicador <b>sem teto e sem zerar</b>', 'Prêmio máximo: <b>6.684x</b>'],
    how: `<p>6 rolos de altura aleatória (2 a 6), cascata e multiplicador que sobe +1 a cada cascata (até x5). ${silverTxt}</p>`,
    features: '<p>🥚 <b>4 ou mais ovos dourados</b> dão <b>8 rodadas grátis</b> (+2 por extra). O multiplicador continua subindo sem limite e não zera entre os giros.</p>',
  }));

  /* 8. Farra no Supermercado — paga em qualquer lugar 6×6 */
  App.register(T.scatterPays({
    id: 'supermercado', name: 'Farra no Supermercado', studio: STUDIO, art: 'cart', mascot: 'lobster', rows: 6,
    tag: 'Multiplicadores até x50 · 25.000x', colors: ['#16a34a', '#ef4444'], bg: 'linear-gradient(180deg,#dcfce7,#86efac 50%,#15803d)',
    intro: 'Inspirado no "Supermarket Spree" (PG Soft).', maxWin: 25000, rtp: '~96,7%', target: 0.967,
    syms: [['lagosta', 'lobster', 'Lagosta'], ['bife', 'cutofmeat', 'Bife'], ['queijo', 'cheese2', 'Queijo'], ['vinho', 'wine', 'Vinho'], ['pao', 'baguette', 'Pão'], ['leite', 'milk', 'Leite'], ['maca', 'redapple2', 'Maçã'], ['cenoura', 'carrot', 'Cenoura'], ['ovo', 'egg', 'Ovo']].map(([id, img, name], i) => S(id, img, name, [[10, 25, 50], [2.5, 10, 25], [2, 5, 15], [1.5, 2, 12], [1, 1.5, 10], [0.8, 1.2, 8], [0.5, 1, 5], [0.4, 0.9, 4], [0.25, 0.75, 2]][i].map(p => p * 0.8), [3, 4, 5, 6, 8, 9, 10, 11, 12][i])),
    scImg: 'shoppingbags', scName: 'Sacola', scW: 0.32, scMin: 3, fsCount: 10, fsPer: 2, retrig: { min: 2, add: 5 }, scPay: false,
    orbImg: 'label', orbName: 'Etiquetas', orbs: [{ m: 2, w: 50 }, { m: 3, w: 30 }, { m: 4, w: 12 }, { m: 5, w: 8 }], orbsFS: [{ m: 5, w: 40 }, { m: 8, w: 25 }, { m: 10, w: 18 }, { m: 15, w: 9 }, { m: 25, w: 5 }, { m: 50, w: 3 }], orbBase: 0.008, orbFS: 0.02, accumulate: false,
    highlights: ['🛒 6×6 que paga em qualquer lugar (8+ iguais), com cascata', '🏷️ Etiquetas de <b>x2 a x5</b> se somam e multiplicam o ganho do giro', '🛍️ 3+ sacolas = <b>10 rodadas grátis</b> (+2 por extra) com etiquetas de <b>x5 a x50</b>; 2 sacolas nelas dão +5', 'Prêmio máximo: <b>25.000x</b>'],
  }));

  /* 9. Noites de Coquetel — rolo de multiplicadores */
  App.register(pg({
    id: 'noitescoquetel', name: 'Noites de Coquetel', art: 'cocktail', mascot: 'bartender', tag: 'Multiplicadores sob os rolos',
    colors: ['#db2777', '#0891b2'], bg: 'linear-gradient(180deg,#1e1b4b,#831843 60%,#0c0a1d)', maxWin: 5173, rtp: '~96,8%', target: 0.968,
    intro: 'Inspirado no "Cocktail Nights" (PG Soft).', hello: 'Ganhos acendem os multiplicadores!',
    syms: mk([['bartender', 'bartender', 'Bartender'], ['martini', 'cocktail', 'Martíni'], ['drink', 'tropicaldrink', 'Drink tropical'], ['whisky', 'tumbler', 'Uísque'], ['limao', 'lemon', 'Limão']], P6),
    wildImg: 'discoball', scImg: 'champagne', scName: 'Champanhe', scW: 0.85, scMin: 4,
    heights: () => [5, 5, 5, 5, 5, 5], gold: [0.06, 0.12],
    baseM: {}, fsM: { persist: true }, fsCount: s => 10 + (s - 4) * 2,
    fsState: () => ({ box: [0, 2, 2, 2, 2, 0], on: [] }),
    before: async (rt, g, fs, st) => { if (!fs || !st.box) { st.box = [0, 2, 2, 2, 2, 0]; st.on = []; } rt.head(st.box.map((v, c) => (v ? (st.on.includes(c) ? `<b>x${v}</b>` : `x${v}`) : ''))); },
    onWin: (r, gg, fs, st, rt) => {
      // símbolo vencedor nos rolos 2 a 5 acende a caixa daquele rolo (nas grátis ela também cresce)
      const reels = new Set([...r.cells].map(k => unkey(k)[0]));
      reels.forEach(c => { if (!st.box[c]) return; if (!st.on.includes(c)) st.on.push(c); else if (fs) st.box[c] = Math.min(10, st.box[c] + 1); });
      rt.head(st.box.map((v, c) => (v ? (st.on.includes(c) ? `<b>x${v}</b>` : `x${v}`) : '')));
    },
    multOf: st => Math.max(1, (st.on || []).reduce((s, c) => s + st.box[c], 0)),
    after: async (rt, g, fs) => { if (!fs) rt.head(null); },
    fsEnd: rt => rt.head(null),
    waysNote: '6×5 = 15.625 caminhos.',
    highlights: ['🍸 6×5 (15.625 caminhos) com cascata; símbolos dourados viram <b>coringa</b>', 'Sob os rolos 2 a 5 há caixas <b>x2</b>: um ganho naquele rolo <b>acende</b> a caixa e o multiplicador é a soma das acesas', '🍾 4+ champanhes = <b>10 rodadas grátis</b>: as caixas ficam acesas e crescem <b>+1</b> a cada novo ganho (até x10)', 'Prêmio máximo: <b>5.173x</b>'],
    how: `<p>Grade 6×5 com cascata. Sob os rolos 2 a 5 há uma caixa x2 cada; quando um símbolo vencedor está naquele rolo, a caixa acende. O multiplicador do ganho é a <b>soma das caixas acesas</b>. ${goldTxt}</p>`,
    features: '<p>🍾 <b>4 ou mais champanhes</b> dão <b>10 rodadas grátis</b> (+2 por extra). As caixas acesas <b>não apagam</b> e cada ganho novo no rolo soma +1 nela (até x10).</p>',
  }));

  /* 10. Prosperidade Oriental */
  App.register(pg({
    id: 'prosperidade', name: 'Prosperidade Oriental', art: 'paintbrush', mascot: 'paintbrush', tag: 'Cada scatter +x2 nas grátis',
    colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#fef3c7,#fca5a5 50%,#7f1d1d)', maxWin: 3269, rtp: '~96,8%', target: 0.968,
    intro: 'Inspirado no "Oriental Prosperity" (PG Soft).', hello: 'Molduras viram coringas!',
    syms: mk([['pincel', 'paintbrush', 'Pincel'], ['leque', 'fan', 'Leque'], ['vaso', 'amphora', 'Vaso'], ['bonsai', 'bonsai', 'Bonsai'], ['tinta', 'palette', 'Tinta']], P6),
    wildImg: 'goldingot', scImg: 'scroll2', scName: 'Pergaminho', scW: 1.2, scMin: 4,
    heights: () => [RNG.int(3, 5), RNG.int(3, 6), RNG.int(3, 6), RNG.int(3, 6), RNG.int(3, 6), RNG.int(3, 5)], silver: [0.08, 0.15],
    baseM: { start: 1, add: 1 }, fsM: { start: 1, persist: true }, fsCount: s => 10 + (s - 4) * 2, retrigMin: 99,
    afterLand: async (rt, g, fs, st) => { const n = count(g, x => x.sc); if (fs && n) { st.m += 2 * n; st.api.add(n, true); rt.msg(`📜 +${n} giro${n > 1 ? 's' : ''} e +${2 * n} no multiplicador (x${st.m})`); rt.fx('rise'); } },
    multOf: (st, fs) => st.m,
    highlights: ['🖌️ 6 rolos de altura variável (até 32.400 caminhos) com cascata', 'Multiplicador <b>+1 por cascata</b> no jogo base', '🖼️ Molduras prata → douradas → <b>coringa</b>', '📜 4+ pergaminhos = <b>10 rodadas grátis</b>: cada pergaminho que cai nelas dá <b>+1 giro e +2 no multiplicador</b>', 'Prêmio máximo: <b>3.269x</b>'],
    how: `<p>6 rolos de altura variável com cascata; o multiplicador sobe +1 a cada cascata e zera no próximo giro. ${silverTxt}</p>`,
    features: '<p>📜 <b>4 ou mais pergaminhos</b> dão <b>10 rodadas grátis</b> (+2 por extra). Durante o bônus o multiplicador fica fixo e <b>cada pergaminho que cair</b> soma +2 nele e dá +1 giro.</p>',
  }));

  /* 11. Carnaval das Máscaras */
  App.register(pg({
    id: 'carnavalmascaras', name: 'Carnaval das Máscaras', art: 'performing', mascot: 'maskface', tag: 'Mult. +1 a cada ganho',
    colors: ['#7c3aed', '#f59e0b'], bg: 'linear-gradient(180deg,#312e81,#6d28d9 50%,#1e1b4b)', maxWin: 2451, cols: 5, rows: 4, rtp: '~96,7%',
    intro: 'Inspirado no "Mask Carnival" (PG Soft).', hello: 'Cada cascata sobe o multiplicador!',
    syms: mk([['mascara', 'performing', 'Máscara'], ['leque', 'fan', 'Leque'], ['gondola', 'canoe', 'Gôndola'], ['pluma', 'feather', 'Pluma'], ['confete', 'confettiball', 'Confete']], P5),
    wildImg: 'maskface', scImg: 'theater', scName: 'Teatro', scW: 0.7, fsConc: 2, scMin: 3, wildReels: [1, 2, 3, 4],
    heights: () => [4, 4, 4, 4, 4], baseM: { start: 1, add: 1 }, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 10 + (s - 3) * 2,
    waysNote: '5×4 = 1.024 caminhos.',
    highlights: ['🎭 5×4 (1.024 caminhos) com cascata', 'Multiplicador <b>+1 a cada cascata</b>', '🏛️ 3+ teatros = <b>10 rodadas grátis</b> com multiplicador que <b>não zera</b>', 'Prêmio máximo: <b>2.451x</b>'],
    how: '<p>Grade 5×4 com 1.024 caminhos e cascata. O multiplicador sobe +1 a cada cascata e zera no giro seguinte.</p>',
    features: '<p>🏛️ <b>3 ou mais teatros</b> dão <b>10 rodadas grátis</b> (+2 por extra). O multiplicador continua de onde parou a cada giro.</p>',
  }));

  /* 12. Maravilhas Espirituais — mistérios e escada de multiplicador */
  (() => {
    const MYS = { id: 'mys', img: 'ghost', name: 'Mistério', mystery: true, noPay: true, t: '?', w: 0.8 };
    const SYS = mk([['kitsune', 'fox', 'Kitsune'], ['tengu', 'goblin', 'Tengu'], ['lanterna', 'izakaya', 'Lanterna'], ['amuleto', 'omamori', 'Amuleto'], ['sino', 'windchime', 'Sino']], P6);
    App.register(pg({
      id: 'maravilhasespirituais', name: 'Maravilhas Espirituais', art: 'fox', mascot: 'ghost', tag: 'Mistérios · x15 nas grátis',
      colors: ['#7c3aed', '#dc2626'], bg: 'radial-gradient(circle at 50% 20%,#4c1d95,#0f0518 70%)', maxWin: 50000, vol: 4, rtp: '~96,7%',
      intro: 'Inspirado no "Spirited Wonders" (PG Soft).', hello: 'Sem ganho? Os mistérios ajudam!',
      syms: SYS, extra: [MYS], wildImg: 'torii2', scImg: 'torii', scName: 'Torii', scW: 0.8, scMin: 3,
      heights: () => Array.from({ length: 6 }, () => RNG.int(2, 5)),
      baseM: { ladder: [1, 2, 3, 5] }, fsM: { ladder: [3, 6, 9, 15] }, fsCount: s => 10 + (s - 3) * 2,
      after: async (rt, g, fs, st) => {
        // sem ganho no giro: mistérios viram todos o mesmo símbolo
        if (st.step || !g.some(col => col.some(x => x.mystery))) return;
        const s = RNG.pick(SYS);
        g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...s, c: 'gold', fresh: true }; }));
        rt.msg('👻 Mistérios revelados!'); await rt.drop(g);
        await pay(rt, ways(g, SYS), fs ? 3 : 1);
      },
      waysNote: '6 rolos de 2 a 5 símbolos (256 a 15.625 caminhos).',
      highlights: ['🦊 6 rolos de 2 a 5 símbolos com cascata', 'Escada de multiplicador: <b>x1, x2, x3, x5</b> (nas grátis <b>x3, x6, x9, x15</b>)', '👻 Sem ganho? Os <b>mistérios</b> viram todos o mesmo símbolo', '⛩️ 3+ torii = <b>10 rodadas grátis</b>', 'Prêmio máximo: <b>50.000x</b>'],
      how: '<p>6 rolos com 2 a 5 símbolos. Cada cascata seguida sobe o multiplicador: x1, x2, x3 e x5. Se o giro terminar sem ganho e houver 👻 mistérios, todos viram o mesmo símbolo e o ganho é pago.</p>',
      features: '<p>⛩️ <b>3 ou mais torii</b> dão <b>10 rodadas grátis</b> (+2 por extra) com a escada <b>x3, x6, x9 e x15</b>.</p>',
    }));
  })();

  /* 13. Búfalo Vencedor — rolos infinitos */
  (() => {
    const SY = [S('bufalo', 'bison', 'Búfalo', [0.5], 3), S('aguia', 'eagle', 'Águia', [0.4], 4), S('puma', 'leopard', 'Puma', [0.3], 4), S('lobo', 'wolf', 'Lobo', [0.25], 5), ...['A', 'K', 'Q', 'J'].map((l, i) => K.L(l, [[0.1], [0.1], [0.08], [0.08]][i], [8, 8, 9, 9][i]))];
    const WILD = { id: 'w', img: 'sunset', name: 'Coringa', wild: true, w: 0.6 };
    const SC = { id: 'sc', img: 'bisonskull', name: 'Crânio', sc: true, w: 0.9 };
    const draw = pool([...SY, WILD, SC]);
    const col = () => K.stack([Array.from({ length: 4 }, () => draw(1))], 0.4)[0];
    /** paga 3+ iguais do primeiro rolo em diante; cada caminho que chega ao último rolo cria um rolo novo */
    const evalInf = g => {
      const r = ways(g, SY.map(s => ({ ...s, pays: Array(20).fill(s.pays[0]).map((p, i) => p * (1 + i * 0.6)) })));
      return { r, last: r.wins.some(w => w.n === g.length) };
    };
    async function play(rt, g0, fs, st) {
      let g = g0, n = 3;
      if (!fs) st.m = 1;
      rt.layout(4);
      await rt.spin(g, { tease: false });
      for (let guard = 0; guard < 12 && !rt.capped; guard++) {
        const { r, last } = evalInf(g);
        if (r.total) await pay(rt, r, st.m);
        if (!last || n >= 12) break;
        // novo rolo + respin com multiplicador maior
        n++; st.m++;
        rt.chip('mult', 'MULT.', 'x' + st.m);
        rt.msg(`🦬 Rolo ${n} adicionado! Multiplicador x${st.m}`); rt.fx('rise');
        g = [...g.map(c2 => c2.map(x => ({ ...x }))), col()];
        await rt.wait(500);
        rt.show(g);
      }
      if (!fs) rt.chip('mult', null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'bufalovencedor', name: 'Búfalo Vencedor', studio: STUDIO, art: 'bison', mascot: 'bison',
      tag: 'Rolos infinitos · 25.000x', colors: ['#92400e', '#f59e0b'], bg: 'linear-gradient(180deg,#fdba74,#9a3412 50%,#1c1917)',
      cols: 12, rows: 4, cellH: 1, maxWin: 25000, vol: 4, rtp: '~96,7%', target: 0.967,
      intro: 'Inspirado no "Buffalo Win" (PG Soft).', hello: 'Cada ganho até o último rolo cria um rolo novo!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho (3 rolos)', ['3 rolos'], SY, 'Cada rolo a mais aumenta o prêmio em 60%.')],
      highlights: ['🦬 Começa com <b>3 rolos</b>: um ganho que chega ao último rolo <b>adiciona um rolo</b> e dá respin com <b>+1 no multiplicador</b>', 'Até 12 rolos!', '💀 3 crânios = <b>10 rodadas grátis</b> em que o multiplicador <b>não zera</b>', 'Prêmio máximo: <b>25.000x</b>'],
      how: '<p>Rolos infinitos: o jogo começa com 3 rolos de 4 símbolos e paga por caminhos da esquerda. Se um ganho alcança o <b>último rolo</b>, um rolo novo aparece à direita e os rolos giram de novo com o multiplicador +1.</p>',
      features: '<p>💀 <b>3 ou mais crânios</b> dão <b>10 rodadas grátis</b> (+2 por extra). O multiplicador conquistado com os rolos novos <b>continua</b> nos giros seguintes.</p>',
      make: () => grid([4, 4, 4], c => draw(c)),
      async spin(rt) { const st = {}; const sc = await play(rt, grid([4, 4, 4], c => draw(c)), false, st); if (sc >= 3) { await rt.wait(800); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const st = { m: 1 };
        await rt.fsLoop(10 + (sc - 3) * 2, async api => { if (await play(rt, grid([4, 4, 4], c => draw(c)), true, st) >= 3) api.add(5); }, { sub: 'O multiplicador não zera' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 14. Invasores da Fazenda — coringas multiplicam */
  (() => {
    const L25 = K.linesFor(4, 25);
    const SY = [S('vaca', 'cow', 'Vaca', [3, 10, 50], 3), S('ovelha', 'sheep', 'Ovelha', [2, 8, 40], 4), S('porco', 'pig', 'Porco', [1.5, 6, 30], 4), S('galinha', 'chicken', 'Galinha', [1, 4, 20], 5), S('feno', 'herb', 'Feno', [0.5, 2, 8], 6), ...R([[0.3, 1, 3], [0.3, 1, 3], [0.2, 0.8, 2], [0.2, 0.8, 2]])];
    const WILD = { id: 'w', img: 'alien', name: 'Alien', wild: true, reels: [1, 2, 3, 4], w: 0.55, fw: 1.1 };
    const SC = { id: 'sc', img: 'ufo', name: 'Disco voador', sc: true, w: 0.8 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, fs, st) {
      await rt.spin(g, { tease: !fs });
      if (st) { st.n += count(g, x => x.wild); if (st.n) rt.chip('mult', 'MULT.', 'x' + 2 * st.n); }
      for (let guard = 0; guard < 10 && !rt.capped; guard++) {
        const nw = st ? st.n : count(g, x => x.wild);
        const m = nw ? 2 * nw : 1;
        const res = lines(g, L25, SY);
        if (res.total) await pay(rt, res, m, nw ? ` (👽 ${nw} → x${m})` : '');
        if (!res.total && !nw) break;
        // os que NÃO ganharam explodem e caem novos (ganhadores e coringas ficam)
        const keepK = new Set([...res.cells, ...cells(g, x => x.wild).map(([c, r]) => key(c, r))]);
        const rm = new Set(); g.forEach((col, c) => col.forEach((x, r) => { if (!keepK.has(key(c, r))) rm.add(key(c, r)); }));
        const before = res.total;
        K.cascade(g, rm, c => draw(c, fs ? 'fw' : 'w'));
        await rt.drop(g);
        const next = lines(g, L25, SY);
        if (next.total <= before) break;
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'invasoresfazenda', name: 'Invasores da Fazenda', studio: STUDIO, art: 'ufo', mascot: 'alien',
      tag: 'Cada alien vale x2', colors: ['#65a30d', '#7c3aed'], bg: 'linear-gradient(180deg,#1e1b4b,#3730a3 40%,#3f6212)',
      cols: 5, rows: 4, maxWin: 20000, vol: 4, rtp: '~96,7%', target: 0.967,
      intro: 'Inspirado no "Farm Invaders" (PG Soft).', hello: 'Cada alien na tela soma x2!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 4, list: L25, text: '25 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['👽 Cada alien coringa na tela soma <b>x2</b> no multiplicador do ganho', '💥 Depois de um ganho, os símbolos que <b>não</b> ganharam explodem e novos caem para tentar melhorar', '🛸 3+ discos = <b>10 rodadas grátis</b>: os aliens <b>acumulam</b> e o x2 de cada um vale até o fim', 'Prêmio máximo: <b>20.000x</b>'],
      how: '<p>Grade 5×4 com 25 linhas. Se houver aliens (coringas) na tela, o ganho é multiplicado por <b>2 × número de aliens</b>. Após um ganho (ou com alien na tela), os símbolos que não fizeram parte dele explodem e caem novos; se o ganho melhorar, a diferença é paga e repete.</p>',
      features: '<p>🛸 <b>3 ou mais discos voadores</b> dão <b>10 rodadas grátis</b>. Cada alien que aparecer entra num contador que <b>não zera</b>: o multiplicador é 2 × aliens coletados no bônus.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, false, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { n: 0 }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), true, st) >= 3) api.add(5); }, { sub: 'Aliens acumulam x2 cada!' }); rt.chip('mult', null); },
    }));
  })();

  /* 15. Riquezas da Sereia — pérola que anda e coringas com vidas */
  (() => {
    const SYS = mk([['sereia', 'mermaid', 'Sereia'], ['tridente', 'trident', 'Tridente'], ['concha', 'shell', 'Concha'], ['peixe', 'tropicalfish', 'Peixe'], ['coral', 'coral', 'Coral']], P5);
    const PEARL = { id: 'w', img: 'pearl', name: 'Pérola', wild: true, w: 0 };
    App.register(pg({
      id: 'riquezassereia', name: 'Riquezas da Sereia', art: 'mermaid', mascot: 'mermaid', tag: 'Pérola coringa que passeia',
      colors: ['#0891b2', '#ec4899'], bg: 'linear-gradient(180deg,#a5f3fc,#0891b2 50%,#164e63)', maxWin: 20000, cols: 5, rows: 5, vol: 4, rtp: '~96,7%',
      intro: 'Inspirado no "Mermaid Riches" (PG Soft).', hello: 'A pérola coringa muda de lugar a cada giro!',
      syms: SYS, wildImg: 'oyster', wildW: 0.35, wildReels: [1, 2, 3, 4], scImg: 'mermaid', scName: 'Sereia', scW: 1.1, scMin: 3, fsConc: 2,
      heights: () => [1, 2, 3, 4, 5], stack: 0,
      cell: x => { if (x.wild) { x.lives = RNG.int(1, 3); x.t = '♥' + x.lives; } return x; },
      before: async (rt, g) => {
        // pérola dourada: coringa colante que anda para uma casa aleatória a cada giro
        const c = RNG.int(1, 4), r = RNG.int(0, g[c].length - 1);
        g[c][r] = { ...PEARL, c: 'sticky gold', pearl: true };
      },
      keep: x => !!x.pearl,
      convert: x => { if (x.wild && x.lives > 1) { const n = x.lives - 1; return { ...x, lives: n, t: '♥' + n }; } return null; },
      baseM: { ladder: [1, 2, 3, 5] }, fsM: { ladder: [2, 4, 6, 10] }, fsCount: s => 8 + (s - 3) * 2,
      waysNote: 'Rolos 1-2-3-4-5 = 120 caminhos.',
      highlights: ['🧜 Rolos 1-2-3-4-5 (120 caminhos) com cascata', '🦪 A <b>pérola dourada</b> é coringa e muda de lugar a cada giro', 'Coringas de concha têm <b>1 a 3 vidas</b> e ficam até usá-las', 'Escada <b>x1, x2, x3, x5</b>; nas grátis (3+ sereias) <b>x2, x4, x6, x10</b>', 'Prêmio máximo: <b>20.000x</b>'],
      how: '<p>Rolos em pirâmide 1-2-3-4-5 (120 caminhos) com cascata. Uma <b>pérola dourada</b> coringa aparece em uma casa aleatória a cada giro e não some na cascata. Coringas de concha mostram ♥1 a ♥3: cada ganho gasta uma vida.</p>',
      features: '<p>🧜 <b>3 ou mais sereias</b> dão <b>8 rodadas grátis</b> (+2 por extra) com a escada de multiplicador dobrada.</p>',
    }));
  })();

  /* 16. Golpe de Mestre (Heist Stakes) — rolo 3 de coringas */
  App.register(pg({
    id: 'golpemestre', name: 'Golpe de Mestre', art: 'safe', mascot: 'detective', tag: 'Rolo central vira coringa',
    colors: ['#be123c', '#111827'], bg: 'linear-gradient(180deg,#1f2937,#4c0519 60%,#0b0f19)', maxWin: 30000, cols: 5, rows: 5, vol: 4, rtp: '~96,7%',
    intro: 'Inspirado no "Heist Stakes" (PG Soft).', hello: 'Coringa no rolo 3 vira o rolo inteiro!',
    syms: mk([['cofre', 'safe', 'Cofre'], ['saco', 'moneybag', 'Saco de dinheiro'], ['bolsa', 'handbag', 'Bolsa'], ['notas', 'banknote', 'Notas'], ['carteira', 'purse', 'Carteira']], P5),
    wildImg: 'lockkey', wildReels: [2], wildW: 0.5, scImg: 'goldvault', scName: 'Cofre dourado', scW: 0.8, scMin: 3,
    heights: () => [3, 4, 5, 4, 3],
    afterLand: async (rt, g) => { if (g[2].some(x => x.wild)) { g[2] = g[2].map(() => ({ ...g[2].find(x => x.wild), c: 'gold', fresh: true })); rt.msg('🔐 Rolo 3 inteiro virou coringa!'); rt.fx('boom'); await rt.drop(g); } },
    keep: x => !!x.wild,
    baseM: {}, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 10 + (s - 3) * 2,
    waysNote: 'Rolos 3-4-5-4-3 = 720 caminhos.',
    highlights: ['💰 Rolos 3-4-5-4-3 (720 caminhos) com cascata', '🔐 Coringa no <b>rolo 3</b> transforma o rolo inteiro em coringa, que <b>fica</b> durante as cascatas', '🏦 3+ cofres dourados = <b>10 rodadas grátis</b> com multiplicador <b>+1 por ganho</b>', 'Prêmio máximo: <b>30.000x</b>'],
    how: '<p>Rolos 3-4-5-4-3 (720 caminhos) com cascata. O coringa só cai no rolo 3; quando cai, o rolo inteiro vira coringa e fica assim enquanto houver ganhos.</p>',
    features: '<p>🏦 <b>3 ou mais cofres dourados</b> dão <b>10 rodadas grátis</b> (+2 por extra). O multiplicador sobe +1 a cada cascata e não zera.</p>',
  }));

  /* 17. Maravilhas dos Totens — rolos laterais de multiplicador */
  (() => {
    const L10 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0], [0, 2, 0], [2, 0, 2], [1, 0, 1], [1, 2, 1], [1, 3, 1]].map(L => L.map((r, c) => (c === 1 ? r : Math.min(r, 2))));
    const SY = [S('aguia', 'eagle', 'Águia', [25], 3), S('lobo', 'wolf', 'Lobo branco', [15], 4), S('urso', 'bear', 'Urso', [10], 4), S('pena', 'feather', 'Pena', [5], 6), S('tambor', 'drum', 'Tambor', [3], 7), S('flecha', 'bowarrow', 'Flecha', [2], 8)];
    const WILD = { id: 'w', img: 'totem', name: 'Totem', wild: true, w: 0.7 };
    const draw = pool([...SY, WILD]);
    const make = () => grid([3, 4, 3], c => draw(c));
    const side = () => (RNG.float() < 0.12 ? { w: true } : { m: RNG.weighted([{ m: 1, w: 60 }, { m: 2, w: 22 }, { m: 3, w: 10 }, { m: 5, w: 4 }]).m });
    const pay3 = g => lines(g, L10, SY, { min: 3 });
    App.register(K.create({
      id: 'totens', name: 'Maravilhas dos Totens', studio: STUDIO, art: 'totem', mascot: 'eagle',
      tag: 'Rolos laterais x5 ou coringa', colors: ['#b45309', '#0f766e'], bg: 'linear-gradient(180deg,#fde68a,#b45309 50%,#134e4a)',
      cols: 3, rows: 4, maxWin: 2500, vol: 3, rtp: '~96,7%', target: 0.967, buy: false,
      intro: 'Inspirado no "Totem Wonders" (PG Soft).', hello: 'Dois coringas laterais dão respin!',
      symbols: [...SY, WILD],
      lineList: { cols: 3, rows: 4, list: L10, text: '10 linhas.' },
      tables: [table('Pagamento por linha', ['3'], SY, 'Rolos 3-4-3 com 10 linhas.')],
      highlights: ['🪶 Rolos 3-4-3 com 10 linhas', 'Os <b>rolos laterais</b> mostram um multiplicador de <b>x1 a x5</b> ou um <b>coringa</b>; os dois multiplicadores se multiplicam', '🔁 Coringa nos <b>dois lados</b> = <b>respin</b> com os rolos 1 e 3 inteiros de coringa (até x25 de multiplicador)', 'Prêmio máximo: <b>2.500x</b>'],
      how: '<p>Três rolos (3-4-3) com 10 linhas. À esquerda e à direita há rolos extras: cada um mostra um multiplicador (x1 a x5), e o ganho é multiplicado pelos dois. Se um lado mostrar coringa, o rolo vizinho (1 ou 3) vira coringa inteiro.</p>',
      features: '<p>🔁 Com <b>coringa nos dois lados</b>, você ganha respins: os rolos 1 e 3 ficam inteiros de coringa e os laterais voltam a girar multiplicadores; os respins continuam enquanto sair ganho.</p>',
      make,
      async spin(rt) {
        const g = make();
        const L = side(), Rr = side();
        rt.head([L.w ? '🗿' : 'x' + L.m, '', Rr.w ? '🗿' : 'x' + Rr.m]);
        if (L.w) g[0] = g[0].map(() => ({ ...WILD, fresh: true }));
        if (Rr.w) g[2] = g[2].map(() => ({ ...WILD, fresh: true }));
        await rt.spin(g);
        const m = (L.m || 1) * (Rr.m || 1);
        await pay(rt, pay3(g), m);
        if (L.w && Rr.w) {
          rt.stat('hold');
          await rt.banner('RESPIN DUPLO', 'Rolos 1 e 3 de coringa', 1300);
          for (let guard = 0; guard < 6 && !rt.capped; guard++) {
            const a = side(), b = side(), mm = (a.m || 1) * (b.m || 1);
            const g2 = make(); g2[0] = g2[0].map(() => ({ ...WILD })); g2[2] = g2[2].map(() => ({ ...WILD }));
            rt.head(['x' + (a.m || 1), '', 'x' + (b.m || 1)]);
            await rt.spin(g2, { tease: false });
            const res = pay3(g2);
            await pay(rt, res, mm);
            if (!res.total) break;
          }
        }
        rt.head(null);
      },
      async bonus() {},
    }));
  })();

  /* 18. Delícias do Restaurante (Diner Delights) — multiplicadores acumulam */
  App.register(T.scatterPays({
    id: 'deliciasrestaurante', name: 'Delícias do Restaurante', studio: STUDIO, art: 'cook', mascot: 'cook', rows: 6,
    tag: 'Pratos multiplicadores acumulam', colors: ['#dc2626', '#f59e0b'], bg: 'linear-gradient(180deg,#fef3c7,#fdba74 50%,#9a3412)',
    intro: 'Inspirado no "Diner Delights" (PG Soft).', maxWin: 2989, rtp: '~96,8%', target: 0.968,
    syms: [['lagosta', 'lobster', 'Lagosta'], ['bife', 'cutofmeat', 'Bife'], ['massa', 'spaghetti', 'Espaguete'], ['pizza', 'pizza', 'Pizza'], ['burger', 'hamburger', 'Hambúrguer'], ['sopa', 'stew', 'Sopa'], ['salada', 'salad', 'Salada'], ['batata', 'fries', 'Batata frita'], ['bolo', 'cake', 'Bolo']].map(([id, img, name], i) => S(id, img, name, [[10, 25, 50], [2.5, 10, 25], [2, 5, 15], [1.5, 2, 12], [1, 1.5, 10], [0.8, 1.2, 8], [0.5, 1, 5], [0.4, 0.9, 4], [0.25, 0.75, 2]][i].map(p => p * 0.8), [3, 4, 5, 6, 8, 9, 10, 11, 12][i])),
    scImg: 'bellhop', scName: 'Sino de serviço', scW: 0.75, scMin: 4, fsCount: 10, fsPer: 2,
    orbImg: 'plate', orbName: 'Pratos', orbs: [{ m: 2, w: 50 }, { m: 3, w: 25 }, { m: 5, w: 13 }, { m: 10, w: 7 }, { m: 25, w: 3 }, { m: 50, w: 1.5 }, { m: 100, w: 0.5 }], orbBase: 0.008, orbFS: 0.025, accumulate: true,
    highlights: ['🍽️ 6×6 que paga em qualquer lugar (8+ iguais) com cascata', '🍲 Pratos multiplicadores (x2 a x100) se somam no fim da cascata', '🛎️ 4+ sinos = <b>10 rodadas grátis</b>: os multiplicadores <b>acumulam e não zeram</b>', 'Prêmio máximo: <b>2.989x</b>'],
  }));

  /* 19. Bonança da Padaria — multiplicador +2 por cascata */
  App.register(pg({
    id: 'padaria', name: 'Bonança da Padaria', art: 'croissant', mascot: 'baker', tag: 'Mult. +2 por cascata · 12.190x',
    colors: ['#d97706', '#ec4899'], bg: 'linear-gradient(180deg,#fef3c7,#fcd34d 50%,#92400e)', maxWin: 12190, vol: 4, rtp: '~96,7%',
    intro: 'Inspirado no "Bakery Bonanza" (PG Soft).', hello: 'O multiplicador sobe de 2 em 2!',
    syms: mk([['bolo', 'birthday', 'Bolo'], ['croissant', 'croissant', 'Croissant'], ['pao', 'bread', 'Pão'], ['rosquinha', 'doughnut', 'Rosquinha'], ['pretzel', 'pretzel', 'Pretzel']], P6),
    wildImg: 'baker', scImg: 'cupcake', scName: 'Cupcake', scW: 0.75, scMin: 4,
    heights: () => [5, 6, 6, 6, 6, 5], silver: [0.06, 0.14],
    baseM: { start: 1, add: 2 }, fsM: { start: 3, add: 3, persist: true }, fsCount: s => 10 + (s - 4) * 2,
    waysNote: 'Rolos 5-6-6-6-6-5 = 32.400 caminhos.',
    highlights: ['🥐 Rolos 5-6-6-6-6-5 (32.400 caminhos) com cascata', 'O rolo de multiplicador soma <b>+2 a cada cascata</b>', '🖼️ Molduras prata → douradas → <b>coringa</b>', '🧁 4+ cupcakes = <b>10 rodadas grátis</b>: começa em <b>x3</b>, sobe <b>+3</b> e não zera', 'Prêmio máximo: <b>12.190x</b>'],
    how: `<p>Rolos 5-6-6-6-6-5 com cascata. O multiplicador começa em x1 e soma +2 a cada cascata (x1, x3, x5…), zerando no próximo giro. ${silverTxt}</p>`,
    features: '<p>🧁 <b>4 ou mais cupcakes</b> dão <b>10 rodadas grátis</b> (+2 por extra). O multiplicador começa em <b>x3</b>, soma <b>+3</b> a cada cascata e não zera.</p>',
  }));

  /* 20. Festival Songkran — multiplicadores acima dos rolos 2, 3 e 4 */
  App.register(pg({
    id: 'songkran', name: 'Festival Songkran', art: 'watergun', mascot: 'elephant', tag: 'Multiplicadores sobre os rolos',
    colors: ['#0ea5e9', '#f472b6'], bg: 'linear-gradient(180deg,#e0f2fe,#7dd3fc 50%,#0369a1)', maxWin: 5000, cols: 5, rows: 5, vol: 4, rtp: '~96,7%',
    intro: 'Inspirado no "Songkran Splash" (PG Soft).', hello: 'Ganhos ativam os multiplicadores!',
    syms: mk([['elefante', 'elephant', 'Elefante'], ['pistola', 'watergun', 'Pistola d\'água'], ['balde', 'bucket', 'Balde'], ['flor', 'hibiscus', 'Flor'], ['manga', 'mango', 'Manga']], P5),
    wildImg: 'droplet', scImg: 'wave', scName: 'Onda', scW: 0.7, fsConc: 2, scMin: 3,
    heights: () => [3, 4, 5, 4, 3],
    baseM: {}, fsM: { persist: true }, fsCount: s => 12 + (s - 3) * 2,
    fsState: () => ({ slot: [0, 0, 0, 0, 0] }),
    before: async (rt, g, fs, st) => { if (!fs || !st.slot) st.slot = [0, 0, 0, 0, 0]; rt.head(st.slot.map((v, c) => (c >= 1 && c <= 3 ? (v ? `<b>x${v}</b>` : '·') : ''))); },
    onWin: (r, gg, fs, st, rt) => {
      // vencedor no rolo 2, 3 ou 4 ativa (x2) ou aumenta (+1) o multiplicador daquele rolo
      new Set([...r.cells].map(k => unkey(k)[0])).forEach(c => { if (c >= 1 && c <= 3) st.slot[c] = st.slot[c] ? Math.min(15, st.slot[c] + 1) : 2; });
      rt.head(st.slot.map((v, c) => (c >= 1 && c <= 3 ? (v ? `<b>x${v}</b>` : '·') : '')));
    },
    multOf: st => Math.max(1, st.slot.reduce((a, b) => a + b, 0)),
    after: async (rt, g, fs) => { if (!fs) rt.head(null); },
    fsEnd: rt => rt.head(null),
    waysNote: 'Rolos 3-4-5-4-3 = 720 caminhos.',
    highlights: ['💦 Rolos 3-4-5-4-3 (720 caminhos) com cascata', 'Acima dos rolos 2, 3 e 4 há multiplicadores: um ganho naquele rolo <b>ativa (x2)</b> ou <b>aumenta (+1)</b>; eles se somam', '🌊 3+ ondas = <b>12 rodadas grátis</b> com os multiplicadores <b>guardados</b>', 'Prêmio máximo: <b>5.000x</b>'],
    how: '<p>Rolos 3-4-5-4-3 com cascata. Acima dos rolos 2, 3 e 4 há casas de multiplicador inativas; um símbolo vencedor naquele rolo ativa a casa em x2 e, a cada novo ganho, ela sobe +1 (até x15). O multiplicador do ganho é a soma das casas ativas, e elas zeram no próximo giro.</p>',
    features: '<p>🌊 <b>3 ou mais ondas</b> dão <b>12 rodadas grátis</b> (+2 por extra). As casas de multiplicador <b>não zeram</b> entre os giros.</p>',
  }));
})();
