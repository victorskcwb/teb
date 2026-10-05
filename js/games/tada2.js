'use strict';

/* =========================================================
   TaDa Gaming (JILI) — lote 2 (parte 1). Regras baseadas nos
   originais (pesquisa pública); quando não há análise pública o
   jogo segue a descrição do tema. RTP calibrado por simulação.
   ========================================================= */
(function () {
  const K = SlotKit, T = SlotT;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'tada';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const R = (pays, w) => K.ROYALS(pays, w);
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };
  const wm = list => RNG.weighted(list).m;
  /* prêmios prontos: 5 rolos (3, 4, 5 iguais) */
  const P5 = [[1, 3, 10], [0.8, 2.5, 8], [0.6, 2, 6], [0.5, 1.5, 5], [0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]];
  /** [id, img, nome] dos 4 altos → símbolos + A K Q J */
  const syms5 = (list, P = P5, w = [3, 4, 4, 5]) => [...list.map(([id, img, name], i) => S(id, img, name, P[i], w[i])), ...R(P.slice(4), [7, 7, 8, 8])];
  const L5 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
  const L8 = [...L5, [0, 1, 0], [2, 1, 2], [1, 0, 1]];
  const fsTab = o => `<table class="paytable"><tr class="si-head"><td>Scatters</td><td>Rodadas grátis</td></tr>${Object.entries(o).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>`;

  /* =========================================================
     Modelo comum: 5 rolos (linhas ou caminhos) + scatter + grátis.
     Ganchos: cell(x,c,wk) · afterLand(rt,g,wk,st,cell) · multOf(st,g,res)
     · after(rt,g,wk,st,res) · trig(g) · bonus(rt,opts,h) (bônus próprio)
     ========================================================= */
  function vgame(o) {
    const SY = o.syms;
    const WILD = o.wild ? { id: 'w', name: 'Coringa', wild: true, w: 0.5, ...o.wild } : null;
    const SC = o.sc ? { id: 'sc', sc: true, fw: 0, ...o.sc } : null;
    const all = [...SY, ...(WILD ? [WILD] : []), ...(SC ? [SC] : []), ...(o.extra || [])];
    const draw = pool(all);
    const hs = o.heights || [3, 3, 3, 3, 3];
    const cell = (c, wk) => { const x = draw(c, wk); return (o.cell && o.cell(x, c, wk)) || x; };
    const make = wk => K.stack(grid(typeof hs === 'function' ? hs(wk) : hs, c => cell(c, wk)), o.stack ?? 0.2);
    const evalOf = g => (o.lines ? lines(g, o.lines, SY, { mult: o.lineMult || 'add' }) : ways(g, SY, { wildMult: o.wildMult || 'mul' }));
    const scMin = o.scMin || 3;
    async function play(rt, g, wk, st) {
      await rt.spin(g, { tease: !st });
      if (o.afterLand) await o.afterLand(rt, g, wk, st, cell);
      const res = evalOf(g);
      const m = o.multOf ? o.multOf(st, g, res) : (st && st.m) || 1;
      await pay(rt, res, m);
      if (o.after) await o.after(rt, g, wk, st, res, cell);
      return count(g, x => x.sc);
    }
    const H = { make, cell, play, evalOf, WILD, SC, SY };
    const rows = typeof hs === 'function' ? Math.max(...hs('w')) : Math.max(...hs);
    return K.create({
      id: o.id, name: o.name, studio: STUDIO, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: (typeof hs === 'function' ? hs('w') : hs).length, rows: o.rows || rows, maxWin: o.maxWin, vol: o.vol || 3, rtp: o.rtp || '~97%', target: o.target || 0.97,
      intro: o.intro, hello: o.hello, symbols: all, extraSprites: o.sprites, buy: o.buy,
      lineList: o.lines ? { cols: 5, rows: o.rows || rows, list: o.lines, text: `${o.lines.length} linhas fixas.` } : undefined,
      tables: [table(o.lines ? 'Pagamento por linha' : 'Pagamento por caminho', heads(3, SY[0].pays.length, o.lines ? '' : ' rolos'), SY, o.tableNote || (o.lines ? 'Iguais seguidos a partir da esquerda.' : `${o.waysTxt || '243 caminhos'}: iguais em rolos seguidos a partir da esquerda.`))],
      highlights: o.highlights, how: o.how, features: o.features,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        const sc = await play(rt, g, 'w', null);
        if (o.base) await o.base(rt, g, H);
        if (o.trig ? o.trig(g) : SC && sc >= scMin) { if (SC) rt.mark(scatters(g)); await rt.wait(900); await this.bonus(rt, { sc, g }); }
      },
      async bonus(rt, opts = {}) {
        if (o.bonus) return o.bonus(rt, opts, H);
        const sc = opts.sc || scMin;
        const st = { m: o.fsMult || 1, ...(o.fsState ? o.fsState(opts) : {}) };
        await rt.fsLoop(o.fsCount ? o.fsCount(sc) : 10, async api => {
          st.api = api;
          const s = await play(rt, make('fw'), 'fw', st);
          if (o.retrig && s >= scMin) api.add(o.retrig(s));
        }, { title: o.fsTitle, sub: o.fsSub || 'Rodadas grátis' });
        rt.chip('mult', null);
      },
    });
  }

  /* =========================================================
     Modelo clássico 3×3 (1, 5 ou 8 linhas), sem grátis de scatter.
     o.syms com 1 prêmio cada (3 iguais) · o.wild · o.onWin/o.after ganchos
     ========================================================= */
  function classic3(o) {
    const SY = o.syms;
    const WILD = o.wild ? { id: 'w', name: 'Coringa', wild: true, ...o.wild } : null;
    const BL = o.blank ? { id: 'vazio', img: null, name: 'Vazio', c: 'empty', w: o.blank, noBlur: true, noPay: true } : null;
    const all = [...SY, ...(WILD ? [WILD] : []), ...(BL ? [BL] : []), ...(o.extra || [])];
    const draw = pool(all);
    const cell = (c, wk) => { const x = draw(c, wk); return (o.cell && o.cell(x, c, wk)) || x; };
    const make = wk => grid([3, 3, 3], c => cell(c, wk));
    const L = o.lines || [[1, 1, 1]];
    const evalOf = g => lines(g, L, SY, { mult: o.wildMult || 'mul' });
    const H = { make, cell, evalOf, WILD, SY, L };
    return K.create({
      id: o.id, name: o.name, studio: STUDIO, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: 3, rows: 3, maxWin: o.maxWin, vol: o.vol || 2, rtp: o.rtp || '~97%', target: o.target || 0.97, buy: 'buy' in o ? o.buy : false,
      intro: o.intro, hello: o.hello, symbols: all, extraSprites: o.sprites,
      lineList: { cols: 3, rows: 3, list: L, text: L.length === 1 ? 'Uma única linha, no meio.' : `${L.length} linhas fixas.` },
      tables: [table('Pagamento por linha', ['3 iguais'], SY, o.tableNote || 'Três iguais na linha (o coringa substitui).')],
      highlights: o.highlights, how: o.how, features: o.features,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        await rt.spin(g, { tease: false });
        if (o.afterLand) await o.afterLand(rt, g, H);
        const res = evalOf(g);
        const m = o.multOf ? o.multOf(g, res) : 1;
        await pay(rt, res, m);
        if (o.wild3 && g.every(col => col[1].wild)) { rt.mark([key(0, 1), key(1, 1), key(2, 1)]); rt.win(o.wild3); rt.msg(`3 coringas = ${rt.coins(o.wild3)}!`); rt.fx('jackpot'); await rt.wait(900); }
        if (o.after) await o.after(rt, g, res, H);
        if (o.trig && o.trig(g)) { await rt.wait(700); await this.bonus(rt, { g }); }
      },
      async bonus(rt, opts = {}) { if (o.bonus) await o.bonus(rt, opts, H); },
    });
  }
  /* =========================================================
     Modelo Rolo Extra: 3 rolos de símbolos + 4º rolo só de
     multiplicadores (x1/x2/x3/x5/x10/x15). O ganho dos rolos 1–3 é
     multiplicado pelo valor do meio do 4º rolo. Sem cascata.
     o.wild3: prêmio de 3 coringas · o.mixed: prêmio de 3 símbolos misturados
     ========================================================= */
  const XM = [{ m: 1, w: 46 }, { m: 2, w: 22 }, { m: 3, w: 14 }, { m: 5, w: 10 }, { m: 10, w: 5 }, { m: 15, w: 3 }];
  function extraReel(o) {
    const SY = o.syms;
    const WILD = o.wild ? { id: 'w', name: 'Coringa', wild: true, ...o.wild } : null;
    const BL = o.blank ? { id: 'vazio', img: null, name: 'Vazio', c: 'empty', w: o.blank, noBlur: true, noPay: true } : null;
    const all = [...SY, ...(WILD ? [WILD] : []), ...(BL ? [BL] : [])];
    const draw = pool(all);
    const MR = o.mults || XM;
    const mcell = () => { const m = RNG.weighted(MR).m; return { id: 'mx', img: null, t: 'x' + m, m, c: 'mreel' }; };
    const make = () => [...grid([3, 3, 3], c => draw(c)), [mcell(), mcell(), mcell()]];
    const L = [[1, 1, 1]];
    const tot = MR.reduce((a, b) => a + b.w, 0);
    return K.create({
      id: o.id, name: o.name, studio: STUDIO, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: 4, rows: 3, maxWin: o.maxWin, vol: o.vol || 2, rtp: o.rtp || '~97%', target: o.target || 0.97, buy: false,
      intro: o.intro, hello: o.hello, symbols: all,
      lineList: { cols: 3, rows: 3, list: L, text: 'Uma única linha, no meio dos rolos 1 a 3; o 4º rolo só define o multiplicador.' },
      tables: [table('Pagamento por linha', ['3 iguais'], SY, 'Valores antes do multiplicador do 4º rolo.')],
      highlights: o.highlights, how: o.how,
      features: `<p>🎰 <b>Rolo extra:</b> o 4º rolo só tem multiplicadores. O valor que parar no meio multiplica todo o ganho dos rolos 1 a 3 (x1 deixa o ganho como está).</p>
        <table class="paytable"><tr class="si-head"><td>Multiplicador</td><td>Chance</td></tr>${MR.map(m => `<tr><td><b>x${m.m}</b></td><td>${Math.round((m.w / tot) * 1000) / 10}%</td></tr>`).join('')}</table>${o.features || ''}`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g, { tease: false });
        const m = g[3][1].m, mid = [g[0][1], g[1][1], g[2][1]];
        const res = lines(g.slice(0, 3), L, SY);
        let v = res.total, txt = v ? K.describe(res) : '';
        if (!v && o.wild3 && mid.every(x => x.wild)) { v = o.wild3; txt = `3× ${WILD.name}`; }
        if (!v && o.mixed && mid.every(x => SY.some(s => s.id === x.id))) { v = o.mixed; txt = o.mixedName || '3 misturados'; }
        if (!v) return;
        rt.mark([key(0, 1), key(1, 1), key(2, 1), key(3, 1)]);
        rt.win(v * m);
        rt.msg(`${txt}${m > 1 ? ` · x${m}` : ''} = ${rt.coins(v * m)}`);
        rt.fx(v * m >= 50 ? 'jackpot' : m > 1 ? 'big' : 'win');
        await rt.wait(900);
      },
      async bonus() {},
    });
  }

  /** Coleta Instantânea: 5+ símbolos de dinheiro com valor impresso pagam a soma na hora. */
  async function instantCollect(rt, g, label = 'moedas') {
    const cs = cells(g, x => x.cash);
    if (cs.length < 5) return 0;
    const v = cs.reduce((t, [c, r]) => t + g[c][r].v, 0);
    rt.mark(cs.map(([c, r]) => key(c, r)));
    rt.win(v);
    rt.msg(`💰 ${cs.length} ${label}: coleta de ${rt.coins(v)}`);
    rt.fx('coin');
    await rt.wait(900);
    return v;
  }
  /** símbolo de dinheiro (coin: não empilha) com valor sorteado de vals */
  const cashSym = (img, name, w, fw) => ({ id: 'cash', img, name, cash: true, coin: true, noPay: true, w, fw: fw ?? w });
  const cashVal = vals => x => { if (x.cash) x.v = RNG.weighted(vals).v; return x; };

  // reaproveitado pelo tada3.js
  T.tada = { vgame, classic3, extraReel, instantCollect, P5, syms5, L5, L8, fsTab };

  /* 1. Super Ás (Super Ace) — cartas douradas viram curinga; combo até x5 (x10 nas grátis) */
  App.register(T.pg({
    studio: STUDIO, id: 'superas', name: 'Super Ás', art: 'spadesuit', mascot: 'joker', tag: 'Curinga Grande · combo até x10',
    colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#14532d,#166534 50%,#052e16)', maxWin: 1500, vol: 3, rtp: '~97,9%', target: 0.979, cols: 5, rows: 4, cellH: 1.25,
    intro: 'Inspirado no "Super Ace" (TaDa Gaming).', hello: 'Cartas douradas viram Curinga!',
    syms: [S('as_e', 'spadesuit', 'Ás de espadas', [0.5, 1, 2], 4), S('as_c', 'heartsuit', 'Ás de copas', [0.4, 0.8, 1.6], 4), S('as_p', 'clubsuit', 'Ás de paus', [0.3, 0.6, 1.2], 5), S('as_o', 'diamondsuit', 'Ás de ouros', [0.3, 0.6, 1.2], 5), ...['A', 'K', 'Q', 'J'].map((l, i) => K.L(l, [[0.2, 0.4, 0.8], [0.15, 0.3, 0.6], [0.1, 0.25, 0.5], [0.1, 0.2, 0.4]][i], 7 + i))],
    wildImg: 'joker', wildName: 'Curinga', wildW: 0, wildFW: 0, scImg: 'cards', scName: 'Scatter', scW: 0.6, scFW: 0.45,
    heights: () => [4, 4, 4, 4, 4], gold: [0.08, 0.16], frameReels: [1, 2, 3], stack: 0.2,
    baseM: { ladder: [1, 2, 3, 5] }, fsM: { ladder: [2, 4, 6, 10] }, fsCount: () => 10, retrig: () => 5,
    // carta dourada vencedora vira Curinga Pequeno ou (18%) Curinga Grande, que espalha 1 a 4 curingas nos rolos 2 a 5
    convert: (x, c, r, fs, st) => {
      if (x.frame !== 'gold' || RNG.float() >= 0.18) return null;
      st.bigJ = (st.bigJ || 0) + RNG.int(1, 4);
      return { id: 'w', img: 'joker', name: 'Curinga Grande', wild: true, c: 'giant', fresh: true };
    },
    onStep: async (rt, gg, fs, st) => {
      if (!st.bigJ) return;
      const opts = RNG.shuffle(cells(gg, x => !x.wild && !x.sc).filter(([c]) => c >= 1));
      opts.slice(0, st.bigJ).forEach(([c, r]) => { gg[c][r] = { id: 'w', img: 'joker', name: 'Curinga', wild: true, fresh: true }; });
      rt.msg(`🃏 Curinga Grande: +${Math.min(st.bigJ, opts.length)} curinga${st.bigJ > 1 ? 's' : ''}!`); rt.fx('rise');
      st.bigJ = 0;
    },
    highlights: ['🃏 5×4 com <b>1.024 caminhos</b> e cascata', '✨ <b>Cartas douradas</b> (rolos 2 a 4) que fazem parte de um ganho viram <b>Curinga Pequeno</b> ou <b>Curinga Grande</b>', '🤡 O <b>Curinga Grande</b> ainda transforma de 1 a 4 símbolos dos rolos 2 a 5 em curingas', '🔥 <b>Combo:</b> cada cascata sobe o multiplicador x1 → x2 → x3 → x5', '3+ scatters = <b>10 rodadas grátis</b> (+5 com 3 nelas) com combo <b>x2 → x4 → x6 → x10</b>', 'Prêmio máximo: <b>1.500x</b>'],
    how: '<p>Grade 5×4 com 1.024 caminhos e cascata. Cada cascata do mesmo giro sobe o multiplicador de combo: x1, x2, x3 e x5.</p>',
    features: `<p>🃏 Cartas com <b>moldura dourada</b> que fazem parte de um ganho não somem: viram <b>Curinga Pequeno</b> no mesmo lugar ou, às vezes, <b>Curinga Grande</b>, que também transforma de 1 a 4 símbolos aleatórios dos rolos 2 a 5 em curingas. <b>3 ou mais scatters</b> dão <b>10 rodadas grátis</b>; nelas o combo vai de x2 a x10 e 3 scatters dão +5 giros.</p>`,
  }));

  /* 2. Fortuna Neko (Neko Fortune) — mistérios viram um símbolo e depois coringa */
  (() => {
    const SY = syms5([['gato', 'catface', 'Maneki-neko'], ['koban', 'coin', 'Moeda koban'], ['daruma', 'dolls', 'Daruma'], ['lanterna', 'izakaya', 'Lanterna']], [[1, 2, 5, 12], [0.8, 1.6, 4, 10], [0.6, 1.2, 3, 8], [0.5, 1, 2.5, 6], [0.15, 0.3, 0.6, 1.5], [0.15, 0.3, 0.6, 1.5], [0.1, 0.2, 0.5, 1.2], [0.1, 0.2, 0.5, 1.2]]);
    const WILD = { id: 'w', img: 'omamori', name: 'Coringa', wild: true, w: 0.3 };
    const MYS = { id: 'mys', img: 'question', name: 'Mistério', mys: true, noPay: true, reels: [1, 2, 3, 4, 5], w: 0.35, fw: 1.6 };
    const SC = { id: 'sc', img: 'fortunecookie', name: 'Bônus', sc: true, reels: [0], w: 0.35, fw: 0 };
    const draw = pool([...SY, WILD, MYS, SC]);
    const make = wk => K.stack(grid([4, 4, 4, 4, 4, 4], c => draw(c, wk)), 0.25);
    const WM = [{ m: 1, w: 45 }, { m: 2, w: 35 }, { m: 3, w: 15 }, { m: 5, w: 5 }];
    /** fs = { lucky: Set de rolos especiais } nas grátis; null no jogo base */
    async function play(rt, g, wk, fs) {
      // rolo da sorte: nas grátis sempre cai pelo menos um mistério nele
      if (fs) fs.lucky.forEach(c => { if (!g[c].some(x => x.mys)) g[c][RNG.int(0, 3)] = { ...MYS }; });
      await rt.spin(g, { tease: !fs });
      const mysCols = new Set(cells(g, x => x.mys).map(([c]) => c));
      if (mysCols.size) {
        const s = RNG.pick(SY.slice(0, 6));
        g.forEach((col, c) => col.forEach((x, r) => { if (x.mys) g[c][r] = { ...s, c: 'gold', mysWas: true, fresh: true }; }));
        rt.msg(`🐱 Mistério: ${s.name}!`); await rt.drop(g);
        // depois o símbolo revelado vira coringa; nas grátis o coringa revelado traz x1 a x5 (multiplica os caminhos)
        g.forEach((col, c) => col.forEach((x, r) => {
          if (!x.mysWas) return;
          const w = { ...WILD, c: 'gold', fresh: true };
          g[c][r] = fs ? mult(w, wm(WM)) : w;
          if (g[c][r].m === 1) { delete g[c][r].m; delete g[c][r].t; }
        }));
        await rt.drop(g);
      }
      await pay(rt, ways(g, SY));
      return { sc: count(g, x => x.sc), mysCols };
    }
    App.register(K.create({
      id: 'fortunaneko', name: 'Fortuna Neko', studio: STUDIO, art: 'catface', mascot: 'catface',
      tag: 'Mistérios viram coringa · rolos da sorte', colors: ['#dc2626', '#fbbf24'], bg: 'linear-gradient(180deg,#fecaca,#f87171 50%,#7f1d1d)',
      cols: 6, rows: 4, maxWin: 1000, vol: 3, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Neko Fortune" (TaDa Gaming).', hello: 'O gatinho da sorte acena para você!',
      symbols: [...SY, WILD, MYS, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = 4.096 caminhos.')],
      highlights: ['🐱 6×4 com <b>4.096 caminhos</b>', '❓ <b>Mistérios</b> (rolos 2 a 6) viram o mesmo símbolo e, em seguida, <b>todos viram coringa</b>', '🥠 Bônus no rolo 1 + algum mistério na tela = <b>5 rodadas grátis</b>', '🍀 O rolo de cada mistério que ativou vira <b>rolo da sorte</b>: nas grátis ele <b>sempre traz um mistério</b>, e os coringas revelados podem multiplicar até <b>x5</b>', 'Prêmio máximo: <b>1.000x</b>'],
      how: '<p>Grade 6×4 que paga por caminhos. Os símbolos mistério revelam o mesmo símbolo e depois se transformam em coringas.</p>',
      features: '<p>🥠 Se o <b>bônus</b> cair no rolo 1 junto com pelo menos um <b>mistério</b>, começam <b>5 rodadas grátis</b>. Cada rolo que tinha um mistério na ativação vira um <b>rolo da sorte</b>: em todo giro grátis ele mostra pelo menos um mistério. Nas grátis, cada coringa revelado por um mistério traz um multiplicador de <b>x1, x2, x3 ou x5</b>, que multiplica os caminhos em que ele entra.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        const r = await play(rt, g, 'w', null);
        if (r.sc && r.mysCols.size) { rt.mark(scatters(g)); await rt.wait(900); await this.bonus(rt, { lucky: r.mysCols }); }
      },
      async bonus(rt, { lucky } = {}) {
        // compra de bônus: 1 ou 2 rolos da sorte sorteados
        const set = lucky && lucky.size ? new Set(lucky) : new Set(RNG.shuffle([1, 2, 3, 4, 5]).slice(0, RNG.int(1, 2)));
        rt.head(Array.from({ length: 6 }, (_, c) => (set.has(c) ? '🍀' : '')));
        await rt.fsLoop(5, async () => { await play(rt, make('fw'), 'fw', { lucky: set }); }, { sub: `${set.size} rolo${set.size > 1 ? 's' : ''} da sorte` });
        rt.head(null);
      },
    }));
  })();

  /* 3. FaFaFa Maluco (Crazy FaFaFa) — coringa no meio multiplica; ganho com coringa abre o Evento Especial */
  (() => {
    const wmid = g => (g[1][1].wild ? RNG.pick([2, 3, 5, 8]) : 1);
    /** Evento Especial: um respin com os rolos 1 e 3 inteiros de coringa; o rolo do meio gira de novo (sem coringa) */
    async function special(rt, H, m = 1) {
      rt.msg('🧨 Evento Especial! Rolos 1 e 3 viram coringa'); rt.fx('rise');
      await rt.wait(700);
      const g = H.make('w');
      g[1] = g[1].map(x => (x.wild ? { ...RNG.pick(H.SY) } : x));
      [0, 2].forEach(c => { g[c] = g[c].map(() => ({ ...H.WILD, c: 'sticky' })); });
      await rt.spin(g, { tease: false });
      await pay(rt, H.evalOf(g), m, ' · Evento Especial');
    }
    const usesWild = (g, res) => res.total > 0 && [0, 1, 2].some(c => g[c][1].wild);
    App.register(classic3({
      id: 'fafafamaluco', name: 'FaFaFa Maluco', art: 'redenvelope', mascot: 'redenvelope', tag: '1 linha · Evento Especial · 1.688x',
      colors: ['#dc2626', '#ca8a04'], bg: 'radial-gradient(circle at 50% 30%,#991b1b,#1c0505 70%)', maxWin: 1688, vol: 4, buy: undefined,
      intro: 'Inspirado no "Crazy FaFaFa" (TaDa Gaming).', hello: 'FA FA FA traz sorte!',
      // nas grátis os símbolos e coringas caem mais (menos casas vazias)
      syms: [S('fa', 'redenvelope', 'FA', [100], 0.5, { fw: 1 }), S('lingote', 'goldingot', 'Lingote', [40], 0.9, { fw: 1.8 }), S('moeda', 'coin', 'Moeda', [20], 1.3, { fw: 2.6 }), S('bar3', 'yellowsquare', 'BAR', [8], 2, { fw: 4 })],
      wild: { img: 'firecracker', name: 'Coringa', w: 0.45, fw: 1.5 }, blank: 1.6,
      extra: [{ id: 'sc', img: 'flamecoin', name: 'Moeda da sorte', sc: true, noPay: true, w: 0.24, fw: 0.3 }],
      multOf: g => wmid(g), wild3: 1688,
      after: async (rt, g, res, H) => {
        if (res.total && g[1][1].wild) rt.msg('🧨 Coringa no meio multiplicou o ganho!');
        if (usesWild(g, res) && !rt.capped) await special(rt, H);
      },
      trig: g => count(g, x => x.sc) >= 3,
      async bonus(rt, opts, H) {
        // multiplicador que cresce +1 a cada giro grátis com ganho (não zera)
        let m = 1;
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(10, async api => {
          const g = H.make('fw');
          await rt.spin(g, { tease: false });
          const res = H.evalOf(g);
          let won = res.total > 0;
          await pay(rt, res, m * wmid(g));
          if (g.every(col => col[1].wild)) { rt.win(1688); won = true; rt.msg(`3 coringas = ${rt.coins(1688)}!`); rt.fx('jackpot'); await rt.wait(900); }
          if (usesWild(g, res) && !rt.capped) await special(rt, H, m);
          if (count(g, x => x.sc) >= 3) api.add(5);
          if (won) { m++; rt.chip('mult', 'MULT.', 'x' + m); }
        }, { sub: 'O multiplicador sobe a cada ganho' });
        rt.chip('mult', null);
      },
      highlights: ['🧧 Clássico de <b>3 rolos e 1 linha</b>', '🧨 Coringa no <b>meio</b> multiplica o ganho por <b>x2 a x8</b>', '💥 <b>Evento Especial:</b> todo ganho com coringa dá um <b>respin</b> com os rolos 1 e 3 inteiros de coringa', '3 coringas na linha pagam <b>1.688x</b>', '🪙 3 moedas da sorte = <b>10 rodadas grátis</b> com multiplicador que sobe <b>+1 a cada giro com ganho</b> (+5 com 3 nelas)'],
      how: '<p>Três rolos e uma linha no meio. Três iguais pagam; o coringa substitui. Se o coringa estiver no rolo do meio, o ganho é multiplicado por x2, x3, x5 ou x8.</p><p>💥 <b>Evento Especial:</b> quando um ganho usa algum coringa, vem um respin com os rolos 1 e 3 cobertos de coringas; o rolo do meio gira de novo e qualquer símbolo nele forma ganho.</p>',
      features: '<p>🪙 <b>3 moedas da sorte</b> em qualquer lugar dão <b>10 rodadas grátis</b>. O multiplicador começa em x1 e sobe <b>+1 a cada giro grátis com ganho</b>, sem zerar; o Evento Especial também acontece nelas. 3 moedas nas grátis dão +5.</p>',
    }));
  })();

  /* 4. Barras de Ouro da Sorte (Lucky Goldbricks) — coringas multiplicadores e grátis com colantes */
  App.register(vgame({
    id: 'barrasouro', name: 'Barras de Ouro da Sorte', art: 'goldbar', mascot: 'goldbar', tag: '30 linhas · coringas colantes nas grátis',
    colors: ['#ca8a04', '#78350f'], bg: 'linear-gradient(180deg,#fef08a,#ca8a04 50%,#451a03)', maxWin: 1250, vol: 3,
    intro: 'Inspirado no "Lucky Goldbricks" (TaDa Gaming).', hello: 'Junte as barras de ouro!',
    syms: [S('sete_o', 'seven', 'Sete dourado', [1, 4, 15], 2), S('sete_p', 'six', 'Sete prata', [0.8, 2.5, 10], 3), S('bar3', 'goldingot', 'BAR triplo', [0.5, 1.5, 5], 4), S('bar2', 'yellowsquare', 'BAR duplo', [0.3, 1, 3], 5), S('bar1', 'orangediamond', 'BAR', [0.2, 0.6, 2], 6), S('cereja', 'cherries', 'Cereja', [0.15, 0.4, 1.2], 7)],
    lines: K.linesFor(3, 25).concat([[0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [1, 0, 1, 0, 1], [1, 2, 1, 2, 1], [0, 0, 1, 0, 0]]),
    wild: { img: 'moneybag', w: 0.45, fw: 0.7 }, sc: { img: 'goldbar', name: 'Barra de ouro', w: 2.05, fw: 1.2 }, scMin: 5,
    extra: [cashSym('coin', 'Moeda de ouro', 1.6)],
    cell: (x, c, wk) => (x.wild && RNG.float() < 0.3 ? mult(x, RNG.pick([2, 3, 5])) : cashVal([{ v: 0.5, w: 30 }, { v: 1, w: 30 }, { v: 2, w: 20 }, { v: 5, w: 12 }, { v: 10, w: 6 }, { v: 25, w: 2 }])(x)),
    after: async (rt, g) => { await instantCollect(rt, g, 'moedas de ouro'); },
    fsCount: () => 8, retrig: () => 4, fsState: () => ({ sticky: new Map() }),
    afterLand: async (rt, g, wk, st) => { if (!st) return; st.sticky.forEach((x, k) => { const [c, r] = unkey(k); g[c][r] = { ...x, c: 'sticky' }; }); cells(g, x => x.wild).forEach(([c, r]) => st.sticky.set(key(c, r), g[c][r])); await rt.drop(g); },
    highlights: ['🧱 5×3 com <b>30 linhas</b>, setes e BARs', '💰 Coringas podem vir com <b>x2, x3 ou x5</b> (somam na linha)', '🪙 <b>Coleta instantânea:</b> 5+ moedas de ouro com valor pagam a <b>soma</b> na hora', '5+ barras de ouro = <b>8 rodadas grátis</b> com <b>coringas colantes</b> (+4 com 5 nelas)', 'Prêmio máximo: <b>1.250x</b>'],
    how: '<p>Grade 5×3 com 30 linhas. O coringa substitui os símbolos e às vezes traz multiplicador.</p><p>🪙 As <b>moedas de ouro</b> mostram um valor; com <b>5 ou mais</b> na tela, a soma de todas é paga na hora (também nas grátis).</p>',
    features: '<p>🧱 <b>5 ou mais barras de ouro</b> em qualquer lugar dão <b>8 rodadas grátis</b>. Todo coringa que cair nelas fica preso até o fim. 5 barras nas grátis dão +4.</p>',
  }));

  /* 5. Ganesha Chegando (Lucky Coming) — Rolo Extra: 3 rolos + rolo de multiplicadores */
  App.register(extraReel({
    id: 'ganeshachegando', name: 'Ganesha Chegando', art: 'elephant', mascot: 'elephant', tag: 'Rolo extra até x15 · 1 linha',
    colors: ['#f59e0b', '#7c2d12'], bg: 'radial-gradient(circle at 50% 30%,#b45309,#1c0a02 70%)', maxWin: 1500, vol: 2,
    intro: 'Inspirado no "Lucky Coming" (TaDa Gaming).', hello: 'O 4º rolo multiplica o ganho!',
    syms: [S('sete', 'seven', 'Sete', [50], 0.6), S('bar3', 'goldingot', 'BAR triplo', [25], 1), S('bar2', 'yellowsquare', 'BAR duplo', [10], 1.5), S('bar1', 'orangediamond', 'BAR', [5], 2)],
    wild: { img: 'elephant', name: 'Ganesha', w: 0.5 }, blank: 1.2, wild3: 100,
    highlights: ['🐘 <b>3 rolos e 1 linha</b> no meio, com Ganesha coringa', '🎰 O <b>4º rolo</b> só tem multiplicadores: <b>x1, x2, x3, x5, x10 ou x15</b> para todo o ganho', '3 Ganeshas na linha pagam <b>100x</b> antes do multiplicador', 'Prêmio máximo: <b>1.500x</b>'],
    how: '<p>Três rolos de símbolos e uma linha no meio. Três iguais pagam; Ganesha substitui qualquer símbolo. Ao lado há um <b>4º rolo</b> só de multiplicadores: o que parar no meio multiplica o ganho.</p>',
    features: '<p class="muted small">Sem rodadas grátis nem cascata: giros rápidos, no estilo do Money Coming.</p>',
  }));

  /* 6. Guerra dos Dragões (War of Dragons) — escolha o dragão das grátis */
  (() => {
    const DR = [{ id: 'ouro', n: 'Dourado', fs: 25, a: 2, b: 5, img: 'dragon' }, { id: 'verm', n: 'Vermelho', fs: 20, a: 3, b: 8, img: 'dragonface' }, { id: 'preto', n: 'Negro', fs: 15, a: 5, b: 10, img: 'dragon-full' }, { id: 'azul', n: 'Azul', fs: 13, a: 8, b: 15, img: 'dragon' }, { id: 'jade', n: 'Celeste', fs: 10, a: 10, b: 30, img: 'dragonface' }];
    App.register(vgame({
      id: 'guerradragoes', name: 'Guerra dos Dragões', art: 'dragonface', mascot: 'dragon', tag: '243 caminhos · 5 dragões nas grátis',
      colors: ['#b91c1c', '#065f46'], bg: 'linear-gradient(180deg,#1c1917,#7f1d1d 50%,#052e16)', maxWin: 2000, vol: 4,
      intro: 'Inspirado no "War of Dragons" (TaDa Gaming).', hello: 'Os dragões elementais vão à guerra!',
      syms: syms5([['dragao', 'dragon', 'Dragão'], ['perola', 'pearl', 'Pérola'], ['espada', 'sword2', 'Espada'], ['tigela', 'urn', 'Urna']]),
      wild: { img: 'dragonface', w: 0.45 }, sc: { img: 'coin', name: 'Moeda da sorte', w: 1.05 },
      async bonus(rt, { sc = 3 } = {}, H) {
        const id = await rt.choose('ESCOLHA SEU DRAGÃO', DR.map(d => ({ id: d.id, img: d.img, label: d.n, desc: `${d.fs} giros · x${d.a}–x${d.b}` })));
        const d = DR.find(x => x.id === id);
        await rt.fsLoop(d.fs, async api => {
          const st = { m: RNG.int(d.a, d.b) };
          rt.chip('mult', 'MULT.', 'x' + st.m);
          const s = await H.play(rt, H.make('fw'), 'fw', st);
          if (s >= 3) api.add(5);
        }, { title: `DRAGÃO ${d.n.toUpperCase()}`, sub: `${d.fs} giros · x${d.a} a x${d.b}` });
        rt.chip('mult', null);
      },
      highlights: ['🐉 5×3 com <b>243 caminhos</b>', '🪙 3+ moedas = <b>escolha um dos 5 dragões</b>: 25 giros x2–x5, 20 giros x3–x8, 15 giros x5–x10, 13 giros x8–x15 ou 10 giros x10–x30', 'Cada giro grátis sorteia um multiplicador dentro da faixa do dragão', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Grade 5×3 que paga por caminhos. A cabeça de dragão é coringa.</p>',
      features: '<p>🪙 <b>3 ou mais moedas da sorte</b> abrem a escolha do dragão: mais giros com multiplicador baixo ou menos giros com multiplicador alto. 3 moedas nelas dão +5 giros.</p>',
    }));
  })();

  /* 7. Rainha Dourada (Golden Queen) — 40 linhas, coringas que expandem com multiplicador */
  App.register(vgame({
    id: 'rainhadourada', name: 'Rainha Dourada', art: 'pharaoh', mascot: 'princess', tag: '40 linhas · coringas expansivos x2–x5',
    colors: ['#ca8a04', '#1e3a8a'], bg: 'linear-gradient(180deg,#fde68a,#b45309 50%,#1e1b4b)', maxWin: 1500, vol: 4, heights: [4, 4, 4, 4, 4],
    intro: 'Inspirado no "Golden Queen" (TaDa Gaming).', hello: 'Cleópatra espera por você!',
    syms: syms5([['rainha', 'princess', 'Cleópatra'], ['anubis', 'jackal', 'Anúbis'], ['naja', 'snake', 'Naja'], ['mascara', 'pharaoh', 'Máscara']]),
    lines: K.linesFor(4, 40), wild: { img: 'ankh', w: 0.4 }, sc: { img: 'pyramid', name: 'Pirâmide', reels: [0, 2, 4], w: 1, fw: 0.7 },
    fsCount: () => 8, retrig: () => 8,
    afterLand: async (rt, g, wk, st) => {
      if (!st) return;
      let n = 0;
      g.forEach((col, c) => { if (col.some(x => x.wild)) { const m = RNG.pick([1, 2, 2, 3, 5]); g[c] = col.map(() => mult({ id: 'w', img: 'ankh', name: 'Coringa', wild: true, c: 'gold', fresh: true }, m)); n++; } });
      if (n) { rt.msg('👑 Coringas expandiram!'); await rt.drop(g); }
    },
    highlights: ['🏺 5×4 com <b>40 linhas</b>', '🔺 Pirâmides nos rolos <b>1, 3 e 5</b> = <b>8 rodadas grátis</b>', 'Nas grátis os coringas <b>expandem</b> pelo rolo com multiplicador de até <b>x5</b> (somam na linha)', 'Prêmio máximo: <b>1.500x</b>'],
    how: '<p>Grade 5×4 com 40 linhas fixas. O ankh é coringa.</p>',
    features: '<p>🔺 <b>Pirâmides nos rolos 1, 3 e 5</b> dão <b>8 rodadas grátis</b>. Nelas, cada coringa cobre o rolo inteiro e pode trazer multiplicador (x2, x3 ou x5). Pirâmides de novo dão +8.</p>',
  }));

  /* 8. Tesouro Secreto (Secret Treasure) — baús e caça ao tesouro */
  (() => {
    const CH = [{ id: 'comum', n: 'Baú comum', v: [2, 3, 5, 8], w: 70 }, { id: 'ouro', n: 'Baú dourado', v: [10, 15, 25, 40], w: 25 }, { id: 'raro', n: 'Baú lendário', v: [50, 100, 200, 500], w: 5 }];
    App.register(vgame({
      id: 'tesourosecreto', name: 'Tesouro Secreto', art: 'chest', mascot: 'compass', tag: 'Baús · caça ao tesouro · grátis',
      colors: ['#65a30d', '#78350f'], bg: 'linear-gradient(180deg,#365314,#1a2e05 60%,#422006)', maxWin: 2000, vol: 3,
      intro: 'Inspirado no "Secret Treasure" (TaDa Gaming).', hello: 'As ruínas guardam segredos...',
      syms: syms5([['exploradora', 'detective', 'Exploradora'], ['idolo', 'moai', 'Ídolo'], ['mapa', 'worldmap', 'Mapa'], ['tocha', 'torch', 'Tocha']]),
      lines: K.LINES_5x3, wild: { img: 'hammer', name: 'Martelo coringa', w: 0.45 }, sc: { img: 'compass', name: 'Bússola', w: 0.8, fw: 0.5 }, fsMult: 2,
      extra: [{ id: 'bau', img: 'chest', name: 'Baú', bau: true, noPay: true, w: 0.35, fw: 1 }],
      fsCount: () => 10, retrig: () => 5,
      after: async (rt, g, wk, st) => {
        const bs = cells(g, x => x.bau);
        if (bs.length >= 3) {
          rt.mark(bs.map(([c, r]) => key(c, r)));
          const ch = RNG.weighted(CH);
          const items = Array.from({ length: 6 }, () => RNG.pick(ch.v));
          const pick = await rt.choose(`ABRA UM ${ch.n.toUpperCase()}`, items.map((v, i) => ({ id: String(i), img: 'chest', label: '?', desc: ch.n })));
          const v = items[Number(pick)] * (st ? 2 : 1);
          rt.win(v); rt.msg(`🗝️ ${ch.n}: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(900);
        }
      },
      highlights: ['🗿 5×3 com <b>25 linhas</b>', '🧰 3+ <b>baús</b> = caça ao tesouro: escolha um baú comum, dourado ou lendário (até <b>500x</b>)', '🧭 3+ bússolas = <b>10 rodadas grátis</b> com ganhos <b>x2</b> e mais baús', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Grade 5×3 com 25 linhas. O martelo da exploradora é coringa.</p>',
      features: '<p>🧰 Com <b>3 ou mais baús</b>, você escolhe um entre seis baús do mesmo tipo (comum, dourado ou lendário). 🧭 <b>3 bússolas</b> dão <b>10 rodadas grátis</b> com todos os ganhos dobrados e mais baús (+5 com 3 bússolas).</p>',
    }));
  })();

  /* 9. Rei Artur (King Arthur) — duelos de cavaleiros: rolo coringa com multiplicador */
  (() => {
    const DM = [1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 75, 100], DW = [30, 22, 15, 10, 8, 6, 3.5, 2, 1.5, 0.6, 0.25, 0.15];
    const duelM = () => { const a = DM[RNG.weighted(DW.map((w, i) => ({ i, w }))).i], b = DM[RNG.weighted(DW.map((w, i) => ({ i, w }))).i]; return Math.max(a, b); };
    const KW = { id: 'w', img: 'shield', name: 'Cavaleiro', wild: true, c: 'duel' };
    App.register(vgame({
      id: 'reiartur', name: 'Rei Artur', art: 'sword2', mascot: 'princeman', tag: 'Duelos de cavaleiros até x100',
      colors: ['#1d4ed8', '#b91c1c'], bg: 'linear-gradient(180deg,#1e3a8a,#312e81 50%,#450a0a)', maxWin: 10000, vol: 5,
      intro: 'Inspirado no "King Arthur" (TaDa Gaming).', hello: 'Pela Távola Redonda!',
      syms: syms5([['artur', 'princeman', 'Rei Artur'], ['merlin', 'mage', 'Merlin'], ['excalibur', 'sword2', 'Excalibur'], ['castelo', 'castle', 'Castelo']]),
      lines: K.LINES_5x3.slice(0, 20), lineMult: 'add', sc: { img: 'crown', name: 'Coroa', w: 0.9 },
      extra: [{ id: 'vs', img: 'vs', name: 'VS', vs: true, noPay: true, reels: [1, 2, 3, 4], w: 0.35, fw: 1.6 }],
      fsCount: () => 10, retrig: () => 5, fsState: () => ({ acc: 0 }),
      afterLand: async (rt, g, wk, st) => {
        let n = 0;
        g.forEach((col, c) => {
          if (!col.some(x => x.vs)) return;
          let m = duelM(); if (st) { st.acc += m > 1 ? 1 : 0; m += st.acc; }
          g[c] = col.map(() => mult({ ...KW, fresh: true }, m)); n++;
        });
        if (n) { if (n >= 4) rt.msg('⚔️ Duelo em todos os rolos!'); else rt.msg(`⚔️ ${n} duelo${n > 1 ? 's' : ''} de cavaleiros!`); rt.fx('boom'); await rt.drop(g); }
      },
      highlights: ['⚔️ 5×3 com <b>20 linhas</b>', '🆚 Cada <b>VS</b> (rolos 2 a 5) abre um <b>duelo</b>: dois cavaleiros sorteiam multiplicadores (x1 a x100) e o vencedor cobre o rolo como coringa', 'Multiplicadores de coringas na mesma linha <b>se somam</b>', '👑 3+ coroas = <b>10 rodadas grátis</b>: cada duelo vencido soma +1 nos próximos', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Ao cair um VS, o rolo vira um duelo entre dois cavaleiros; o maior multiplicador vence e o rolo inteiro vira coringa com esse valor.</p>',
      features: '<p>👑 <b>3 ou mais coroas</b> dão <b>10 rodadas grátis</b>. Nelas os VS caem mais e cada duelo com multiplicador acima de x1 deixa +1 acumulado para os duelos seguintes (+5 giros com 3 coroas).</p>',
    }));
  })();

  /* 10. Super Touro (Super Niubi) — Rolo Extra: touros coloridos + rolo de multiplicadores */
  (() => {
    const B = (id, name, pay, w, c) => S(id, 'ox', name, [pay], w, { c });
    App.register(extraReel({
      id: 'supertouro', name: 'Super Touro', art: 'ox', mascot: 'ox', tag: 'Touros coloridos · rolo extra até x15',
      colors: ['#db2777', '#7c2d12'], bg: 'radial-gradient(circle at 50% 30%,#9d174d,#1c0505 70%)', maxWin: 10000, vol: 3, target: 0.965, rtp: '~96,5%',
      intro: 'Inspirado no "Super Niubi" (TaDa Gaming).', hello: 'O touro da sorte está bravo!',
      syms: [B('rosa', 'Touro rosa', 888, 0.3, 'tint-purple'), B('ouro', 'Touro dourado', 88, 1, 'tint-gold'), B('verm', 'Touro vermelho', 38, 1.5, 'tint-red'), B('verde', 'Touro verde', 18, 2.1, 'tint-green')],
      blank: 4.5, mixed: 2, mixedName: '3 touros misturados',
      highlights: ['🐂 <b>3 rolos e 1 linha</b> no meio', 'Três touros iguais pagam <b>18x, 38x, 88x</b> — o rosa paga <b>888x</b>; qualquer mistura de 3 touros paga 2x', '🎰 O <b>4º rolo</b> só tem multiplicadores: <b>x1 a x15</b> para todo o ganho', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Só a linha do meio dos três primeiros rolos paga. Três touros iguais pagam a tabela; três touros de cores diferentes pagam 2x. O <b>4º rolo</b> mostra um multiplicador no meio que vale para o ganho.</p>',
      features: '<p class="muted small">Sem coringas, cascata ou rodadas grátis: o clássico com rolo extra.</p>',
    }));
  })();

  /* 11. Caçadora de Bônus (Bonus Hunter) — molduras viram coringa e o multiplicador sobe a cada ganho */
  App.register(T.pg({
    studio: STUDIO, id: 'cacadorabonus', name: 'Caçadora de Bônus', art: 'cowboy', mascot: 'cowboy', tag: '1.024 caminhos · +1 a cada ganho',
    colors: ['#b45309', '#1c1917'], bg: 'linear-gradient(180deg,#fdba74,#b45309 50%,#292524)', maxWin: 2000, vol: 3, rtp: '~97%', target: 0.97, cols: 5, rows: 4, cellH: 1.2,
    intro: 'Inspirado no "Bonus Hunter" (TaDa Gaming).', hello: 'Procura-se: recompensa!',
    syms: T.pgx.mk([['cacadora', 'cowboy', 'Caçadora'], ['xerife', 'sheriff', 'Estrela'], ['revolver', 'goldpistol', 'Revólver'], ['bota', 'boot', 'Bota']], T.pgx.P5),
    wildImg: 'cactus', scImg: 'moneybag', scName: 'Recompensa', scW: 0.45, scFW: 0.35,
    heights: () => [4, 4, 4, 4, 4], gold: [0.06, 0.1], frameReels: [1, 2, 3], stack: 0.2,
    baseM: { start: 1, add: 1, cap: 20 }, fsM: { start: 1, add: 1, persist: true }, fsCount: s => ({ 3: 10, 4: 12 }[s] || 14), retrig: s => ({ 3: 10, 4: 12 }[s] || 14),
    // nas grátis o rolo 3 vem inteiro com moldura dourada
    cell: (x, c, fs) => { if (fs && c === 2 && !x.wild && !x.sc) { x.frame = 'gold'; x.gold = true; delete x.c; } return x; },
    highlights: ['🤠 5×4 com <b>1.024 caminhos</b> e cascata', '🖼️ Símbolos com moldura viram <b>coringa</b> quando ganham', '➕ Cada cascata soma <b>+1</b> no multiplicador do giro', '💰 3/4/5 recompensas = <b>10/12/14 rodadas grátis</b> com o <b>rolo 3 todo dourado</b> e multiplicador que <b>não zera</b>', 'Prêmio máximo: <b>2.000x</b>'],
    how: '<p>Grade 5×4 com 1.024 caminhos e cascata. O multiplicador começa em x1 e sobe +1 a cada cascata com ganho do mesmo giro.</p>',
    features: `<p>💰 <b>3, 4 ou 5 recompensas</b> dão <b>10, 12 ou 14 rodadas grátis</b> (e o mesmo de novo se caírem nelas). Nas grátis o <b>rolo 3 vem inteiro com moldura dourada</b> e o multiplicador acumula de um giro para o outro. ${T.pgx.goldTxt}</p>`,
  }));

  /* 12. Festa das Gemas (Gem Party) — grupos com grade que cresce */
  (() => {
    const GEM = [['rubi', 'redsquare', 'Rubi'], ['safira', 'bluediamond', 'Safira'], ['esmeralda', 'greensquare', 'Esmeralda'], ['topazio', 'yellowsquare', 'Topázio'], ['ametista', 'purplesquare', 'Ametista'], ['quartzo', 'pinksquare', 'Quartzo']];
    const TP = [[1, 2, 4, 10, 25, 60], [0.8, 1.5, 3, 8, 20, 50], [0.6, 1.2, 2.5, 6, 15, 40], [0.5, 1, 2, 5, 12, 30], [0.4, 0.8, 1.5, 4, 10, 25], [0.3, 0.6, 1.2, 3, 8, 20]];
    const SY = GEM.map(([id, img, name], i) => S(id, img, name, TP[i], [6, 7, 8, 9, 10, 11][i]));
    const TT = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    const BLUE = { id: 'azul', img: 'bluecircle', name: 'Bola azul', ball: 'b', noPay: true, w: 0.25 };
    const RED = { id: 'verm', img: 'redcircle', name: 'Bola vermelha', ball: 'r', noPay: true, w: 0.25 };
    const WILD = { id: 'w', img: 'gemsparkle', name: 'Coringa', wild: true, w: 0.2 };
    const SC = { id: 'sc', img: 'heart', name: 'Coração', sc: true, w: 0.22, fw: 0.2 };
    const draw = pool([...SY, BLUE, RED, WILD, SC]);
    const LOCK = { id: 'lock', img: null, name: 'Fechado', c: 'locked', noPay: true, noBlur: true };
    const make = (cols, wk) => grid(Array(7).fill(7), c => (c < cols ? draw(c, wk) : { ...LOCK }));
    async function play(rt, st, wk) {
      rt.layout(7);
      const g = make(st.cols, wk);
      await rt.spin(g, { tease: false });
      await tumble(rt, g, {
        draw: c => (c < st.cols ? draw(c, wk) : { ...LOCK }),
        evaluate: gg => payClusters(clusters(gg, 5), TT),
        mult: () => st.m,
        onStep: async () => { if (st.fs) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); } },
      });
      // bolas coletadas abrem colunas
      st.b += count(g, x => x.ball === 'b'); st.r += count(g, x => x.ball === 'r');
      if (st.cols === 5 && st.b >= 6) { st.cols = 6; st.b = 0; rt.msg('🔵 A grade cresceu para 6×7!'); }
      else if (st.cols === 6 && st.r >= 6) { st.cols = 7; st.r = 0; rt.msg('🔴 A grade cresceu para 7×7!'); }
      rt.chip('balls', 'GRADE', `${st.cols}×7 · ${st.cols === 5 ? `🔵${st.b}/6` : st.cols === 6 ? `🔴${st.r}/6` : 'MÁX'}`);
      return count(g, x => x.sc);
    }
    const base = { cols: 5, b: 0, r: 0, m: 1 };
    App.register(K.create({
      id: 'festagemas', name: 'Festa das Gemas', studio: STUDIO, art: 'gem', mascot: 'gemsparkle',
      tag: 'Grupos · grade cresce até 7×7', colors: ['#db2777', '#2563eb'], bg: 'radial-gradient(circle at 50% 30%,#312e81,#0f0a2e 70%)',
      cols: 7, rows: 7, maxWin: 1500, vol: 2, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Gem Party" (TaDa Gaming).', hello: 'Junte as bolas para crescer a grade!',
      symbols: [...SY, BLUE, RED, WILD, SC],
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['💎 Grupos de <b>5+ gemas</b> encostadas, com cascata', '🔵 Junte <b>6 bolas azuis</b> e a grade cresce de 5×7 para <b>6×7</b>; depois <b>6 vermelhas</b> abrem <b>7×7</b> (a grade fica crescida)', '❤️ 3+ corações = <b>10 rodadas grátis</b> em 7×7 com multiplicador que sobe a cada cascata', 'Prêmio máximo: <b>1.500x</b>'],
      how: '<p>Grade de 7 linhas que começa com 5 colunas. Grupos de 5 ou mais gemas iguais pagam e somem (cascata). As bolas coloridas ficam guardadas de um giro para o outro e fazem a grade crescer.</p>',
      features: '<p>❤️ <b>3 ou mais corações</b> dão <b>10 rodadas grátis</b> com a grade 7×7 inteira e um multiplicador que começa em x1 e sobe +1 a cada cascata (não zera). 3 corações nelas dão +5.</p>',
      make: () => make(5, 'w'),
      async spin(rt) {
        const st = { ...base, m: 1, fs: false };
        const sc = await play(rt, st, 'w');
        Object.assign(base, { cols: st.cols, b: st.b, r: st.r });
        if (sc >= 3) { await rt.wait(900); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const st = { cols: 7, b: 0, r: 0, m: 1, fs: true };
        await rt.fsLoop(10, async api => { if (await play(rt, st, 'fw') >= 3) api.add(5); }, { sub: 'Grade 7×7 · multiplicador cresce' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 13. Árvore da Fortuna (Fortune Tree) — moedas coringa caem da árvore + bônus de escolha */
  App.register(vgame({
    id: 'arvorefortuna', name: 'Árvore da Fortuna', art: 'cherryblossom', mascot: 'pig', tag: '30 linhas · moedas caem da árvore',
    colors: ['#db2777', '#ca8a04'], bg: 'linear-gradient(180deg,#fbcfe8,#f472b6 50%,#831843)', maxWin: 1000, vol: 2, buy: false,
    intro: 'Inspirado no "Fortune Tree" (TaDa Gaming).', hello: 'Sacuda a árvore da fortuna!',
    syms: syms5([['dragao', 'dragon', 'Dragão azul'], ['sapo', 'frog', 'Sapo da fortuna'], ['tartaruga', 'turtle', 'Tartaruga'], ['carpa', 'goldfish', 'Carpa']]),
    lines: K.LINES_5x3.concat([[0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [1, 0, 1, 0, 1], [1, 2, 1, 2, 1], [0, 0, 1, 0, 0]]), wild: { img: 'coin', name: 'Moeda coringa', w: 0.35 },
    extra: [{ id: 'porco', img: 'pig', name: 'Porco da fortuna', bonus: true, noPay: true, reels: [0, 2, 4], w: 1.4 }],
    afterLand: async (rt, g) => {
      if (RNG.float() >= 0.06) return;
      const n = RNG.int(2, 5);
      for (let i = 0; i < n; i++) { const c = RNG.int(0, 4), r = RNG.int(0, 2); if (!g[c][r].bonus) g[c][r] = { id: 'w', img: 'coin', name: 'Moeda coringa', wild: true, c: 'gold', fresh: true }; }
      rt.msg(`🌸 A árvore deixou cair ${n} moedas coringa!`); rt.fx('coin'); await rt.drop(g);
    },
    trig: g => count(g, x => x.bonus) >= 3,
    async bonus(rt) {
      rt.stat('hold');
      const V = [{ v: 1, w: 30 }, { v: 3, w: 25 }, { v: 5, w: 18 }, { v: 10, w: 12 }, { v: 20, w: 8 }, { v: 50, w: 4 }, { v: 100, w: 2 }, { v: 888, w: 0.2 }];
      let tot = 0;
      for (let i = 0; i < 3; i++) {
        const items = Array.from({ length: 6 }, () => RNG.weighted(V).v);
        const p = await rt.choose(`ESCOLHA UM ENVELOPE (${i + 1}/3)`, items.map((v, j) => ({ id: String(j), img: 'redenvelope', label: '?', desc: 'envelope' })));
        tot += items[Number(p)]; rt.msg(`🧧 Envelope: ${rt.coins(items[Number(p)])}`); await rt.wait(500);
      }
      rt.win(tot); rt.msg(`🐷 Bônus da árvore: ${rt.coins(tot)}`); rt.fx('big'); await rt.wait(900);
    },
    highlights: ['🌸 5×3 com <b>30 linhas</b>', '🪙 <b>Árvore dourada:</b> de surpresa caem de 2 a 5 <b>moedas coringa</b> na tela', '🐷 3 porcos da fortuna (rolos 1, 3 e 5) = <b>bônus de escolha</b>: abra 3 envelopes de 1x a <b>888x</b>', 'Prêmio máximo: <b>1.000x</b>'],
    how: '<p>Grade 5×3 com 30 linhas. A moeda é coringa. Depois de qualquer giro, a árvore pode soltar moedas coringa.</p>',
    features: '<p>🐷 <b>3 porcos da fortuna</b> nos rolos 1, 3 e 5 abrem o bônus de escolha: três rodadas escolhendo um envelope entre seis, com prêmios de 1x a 888x. Não há rodadas grátis.</p>',
  }));

  /* 14. Porquinho da Sorte (Fortune Pig) — porco coringa expande; porco vermelho dá respin */
  App.register(classic3({
    id: 'porquinhosorte', name: 'Porquinho da Sorte', art: 'pig', mascot: 'pigface', tag: '8 linhas · respins com porcos travados',
    colors: ['#f472b6', '#dc2626'], bg: 'radial-gradient(circle at 50% 30%,#be185d,#3f0a1f 70%)', maxWin: 1000, vol: 2,
    intro: 'Inspirado no "Fortune Pig" (TaDa Gaming).', hello: 'Oinc! Feliz Ano Novo Lunar!',
    syms: [S('lingote', 'goldingot', 'Lingote', [20], 0.9), S('envelope', 'redenvelope', 'Envelope', [10], 1.3), S('lanterna', 'izakaya', 'Lanterna', [6], 1.6), S('laranja', 'tangerine', 'Tangerina', [3], 2.2), S('moeda', 'coin', 'Moeda', [2], 2.6)],
    lines: L8, wild: { img: 'pig', name: 'Porco coringa', w: 0.4 },
    extra: [{ id: 'porcov', img: 'pigface', name: 'Porco vermelho', redpig: true, wild: true, w: 0.12 }],
    afterLand: async (rt, g) => {
      // o porco que cai no topo expande pelo rolo
      let ex = false;
      g.forEach((col, c) => { if (col[0].wild) { g[c] = col.map(() => ({ id: 'w', img: 'pig', name: 'Porco coringa', wild: true, c: 'gold', fresh: true })); ex = true; } });
      if (ex) { rt.msg('🐷 O porco expandiu pelo rolo!'); await rt.drop(g); }
    },
    after: async (rt, g, res, H) => {
      if (!g.flat().some(x => x.redpig)) return;
      // respin: os porcos ficam e o resto gira de novo (até 3 vezes enquanto aparecer porco novo)
      for (let i = 0; i < 3; i++) {
        rt.msg('🐽 Porco vermelho: respin com os porcos travados!');
        const ng = H.make('w');
        g.forEach((col, c) => col.forEach((x, r) => { if (x.wild) ng[c][r] = { ...x, c: 'sticky' }; }));
        const before = count(g, x => x.wild);
        await rt.spin(ng, { tease: false });
        await pay(rt, H.evalOf(ng));
        if (count(ng, x => x.wild) <= before) break;
        g = ng;
      }
    },
    highlights: ['🐷 3×3 com <b>8 linhas</b>', 'Porco coringa no topo do rolo <b>expande</b> pelo rolo inteiro', '🐽 <b>Porco vermelho</b> dá um <b>respin</b> com todos os porcos travados (repete enquanto chegar porco novo, até 3 vezes)', 'Prêmio máximo: <b>1.000x</b>'],
    how: '<p>Grade 3×3 com 8 linhas. Porcos são coringas.</p>',
    features: '<p>🐽 Quando o porco vermelho aparece, todos os porcos ficam presos e os outros símbolos giram de novo.</p>',
  }));

  /* 15. Deus Marcial (God of Martial) — Guan Yu, Batalha dos Penhascos Vermelhos */
  App.register(vgame({
    id: 'deusmarcial', name: 'Deus Marcial', art: 'martialarts', mascot: 'beardman', tag: '25 linhas · mult. até x20 nas grátis',
    colors: ['#dc2626', '#065f46'], bg: 'linear-gradient(180deg,#7f1d1d,#991b1b 50%,#022c22)', maxWin: 2500, vol: 4,
    intro: 'Inspirado no "God of Martial" (TaDa Gaming).', hello: 'Guan Yu lidera a batalha!',
    // nas grátis as cartas caem mais: mais giros com ganho para subir o multiplicador
    syms: syms5([['guanyu', 'beardman', 'Guan Yu'], ['liubei', 'oldman', 'Liu Bei'], ['tambor', 'drum', 'Tambor de guerra'], ['lanca', 'spear', 'Lança']]).map(x => (x.letter ? { ...x, fw: x.w * 2.2 } : x)),
    lines: K.LINES_5x3, wild: { img: 'martialarts', name: 'Mestre marcial', w: 0.45, fw: 2.2 }, sc: { img: 'ship', name: 'Navio', w: 0.9, fw: 0.5 },
    fsCount: s => ({ 3: 10, 4: 15 }[s] || 20), retrig: () => 5, fsState: () => ({ m: 1, i: 0 }),
    multOf: st => (st ? st.m : 1),
    // o multiplicador só sobe um degrau depois de um giro grátis com ganho
    after: async (rt, g, wk, st, res) => { if (st && res.total) { const LAD = [1, 2, 3, 5, 8, 10, 12, 15, 20]; st.i = Math.min(LAD.length - 1, st.i + 1); st.m = LAD[st.i]; rt.chip('mult', 'MULT.', 'x' + st.m); } },
    base: async (rt, g, H) => {
      if (RNG.float() >= 0.0006) return;
      rt.msg('🔥 Batalha dos Penhascos Vermelhos!'); rt.fx('boom');
      const s = RNG.pick(H.SY);
      const gg = H.make('w').map(col => col.map(() => ({ ...s, c: 'gold', fresh: true })));
      await rt.drop(gg); await pay(rt, H.evalOf(gg));
    },
    highlights: ['⚔️ 5×3 com <b>25 linhas</b>', '🔥 <b>Batalha dos Penhascos Vermelhos</b> de surpresa: a tela inteira vira o mesmo símbolo', '🚢 3/4/5 navios = <b>10/15/20 rodadas grátis</b> com multiplicador que sobe a cada <b>giro com ganho</b>, até <b>x20</b>', 'Prêmio máximo: <b>2.500x</b>'],
    how: '<p>Grade 5×3 com 25 linhas. O mestre marcial é coringa.</p>',
    features: '<p>🚢 <b>3, 4 ou 5 navios</b> dão <b>10, 15 ou 20 rodadas grátis</b>. O multiplicador começa em x1 e sobe um degrau depois de cada <b>giro com ganho</b> (x2, x3, x5, x8, x10, x12, x15 e x20); giros sem ganho não mexem nele. O mestre marcial (coringa) aparece bem mais nelas. 3 navios nas grátis dão +5.</p>',
  }));

  /* 16. Tigela do Tesouro (Treasure Bowl) — tigelas coringa e grátis com +1 giro */
  App.register(classic3({
    id: 'tigelatesouro', name: 'Tigela do Tesouro', art: 'urn', mascot: 'urn', tag: '3×3 · tigelas coringa · +1 giro',
    colors: ['#ca8a04', '#b91c1c'], bg: 'radial-gradient(circle at 50% 30%,#a16207,#1c0a02 70%)', maxWin: 1000, vol: 2, buy: undefined,
    intro: 'Inspirado no "Treasure Bowl" (TaDa Gaming).', hello: 'A tigela da riqueza transborda!',
    syms: [S('lingote', 'goldingot', 'Lingote', [25], 0.8), S('jade', 'greensquare', 'Jade', [12], 1.2), S('moeda', 'coin', 'Moeda', [6], 1.7), S('tangerina', 'tangerine', 'Tangerina', [3], 2.3)],
    lines: L5, wild: { img: 'urn', name: 'Tigela', w: 0.24, fw: 0.9 },
    extra: [cashSym('coin', 'Moeda de ouro', 0.8)],
    cell: cashVal([{ v: 1, w: 30 }, { v: 2, w: 28 }, { v: 3, w: 20 }, { v: 5, w: 12 }, { v: 10, w: 7 }, { v: 30, w: 3 }]),
    after: async (rt, g) => { await instantCollect(rt, g, 'moedas de ouro'); },
    trig: g => count(g, x => x.wild) >= 3,
    async bonus(rt, opts, H) {
      await rt.fsLoop(8, async api => {
        const g = H.make('fw');
        if (RNG.float() < 0.3) g[RNG.int(0, 2)][RNG.int(0, 2)] = { id: 'mais', img: 'heavyplus', name: '+1 giro', noPay: true, c: 'gold' };
        await rt.spin(g, { tease: false });
        if (g.flat().some(x => x.id === 'mais') && api.left + api.i < 30) { api.add(1); }
        await pay(rt, H.evalOf(g), 2);
        await instantCollect(rt, g, 'moedas de ouro');
      }, { sub: 'Ganhos x2 · junte +1 giro' });
    },
    highlights: ['🥣 3×3 com <b>5 linhas</b>', 'A <b>tigela</b> é coringa', '🪙 <b>Coleta instantânea:</b> 5+ moedas de ouro com valor pagam a <b>soma</b> na hora', '3 tigelas = <b>8 rodadas grátis</b> com ganhos <b>x2</b> e símbolos <b>+1 giro</b>', 'Prêmio máximo: <b>1.000x</b>'],
    how: '<p>Grade 3×3 com 5 linhas. A tigela substitui qualquer símbolo.</p><p>🪙 As <b>moedas de ouro</b> mostram um valor; com <b>5 ou mais</b> na tela, a soma de todas é paga na hora (também nas grátis).</p>',
    features: '<p>🥣 <b>3 tigelas</b> em qualquer lugar dão <b>8 rodadas grátis</b> com ganhos dobrados. O símbolo <b>+1</b> que cair nelas dá mais um giro.</p>',
  }));

  /* 17. Panda Gigante Selvagem (Wild Giant Panda) — pandas empilhados e colantes nas grátis */
  App.register(vgame({
    id: 'pandagigante', name: 'Panda Gigante Selvagem', art: 'panda', mascot: 'pandaface', tag: '243 caminhos · pandas colantes',
    colors: ['#16a34a', '#1c1917'], bg: 'linear-gradient(180deg,#bbf7d0,#22c55e 50%,#14532d)', maxWin: 2000, vol: 3,
    intro: 'Inspirado no "Wild Giant Panda" (TaDa Gaming).', hello: 'Os pandas estão no bambuzal!',
    syms: syms5([['bambu', 'bamboo', 'Bambu'], ['lotus', 'lotus', 'Lótus'], ['lanterna', 'izakaya', 'Lanterna'], ['bonsai', 'bonsai', 'Bonsai']]),
    wild: { img: 'panda', name: 'Panda', reels: [1, 2, 3, 4], w: 0.5, fw: 0.6 }, sc: { img: 'yinyang', name: 'Yin-yang', w: 0.85 }, stack: 0.35,
    fsCount: () => 10, retrig: () => 4, fsState: () => ({ sticky: new Set() }),
    afterLand: async (rt, g, wk, st) => { if (!st) return; st.sticky.forEach(k => { const [c, r] = unkey(k); g[c][r] = { id: 'w', img: 'panda', name: 'Panda', wild: true, c: 'sticky' }; }); cells(g, x => x.wild).forEach(([c, r]) => st.sticky.add(key(c, r))); await rt.drop(g); },
    highlights: ['🐼 5×3 com <b>243 caminhos</b> e pandas coringa <b>empilhados</b> (rolos 2 a 5)', '☯️ 3+ yin-yang = <b>10 rodadas grátis</b> em que <b>todo panda gruda</b> até o fim (+4 com 3)', 'Prêmio máximo: <b>2.000x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. Pandas são coringas e costumam vir empilhados.</p>',
    features: '<p>☯️ <b>3 ou mais yin-yang</b> dão <b>10 rodadas grátis</b>. Cada panda que cair nelas fica preso no lugar até o fim. 3 yin-yang de novo dão +4.</p>',
  }));

  /* 18. Wukong (Wukong) — o Rei Macaco: coringas que expandem */
  App.register(vgame({
    id: 'wukong', name: 'Wukong', art: 'monkey', mascot: 'monkey', tag: 'Bastão coringa que expande',
    colors: ['#ca8a04', '#b91c1c'], bg: 'linear-gradient(180deg,#fde68a,#d97706 50%,#7f1d1d)', maxWin: 2000, vol: 4,
    intro: 'Inspirado no "Wukong" (TaDa Gaming), da Jornada ao Oeste.', hello: 'O Rei Macaco chegou!',
    syms: syms5([['wukong', 'monkey', 'Wukong'], ['monge', 'man', 'Monge'], ['porco', 'pigface', 'Zhu Bajie'], ['nuvem', 'cloud', 'Nuvem']]),
    wild: { img: 'magicwand', name: 'Bastão', reels: [1, 2, 3], w: 0.5, fw: 0.95 }, sc: { img: 'peach', name: 'Pêssego', w: 0.85 },
    fsCount: s => ({ 3: 10, 4: 15 }[s] || 20), retrig: () => 10, fsMult: 2,
    afterLand: async (rt, g) => {
      let n = 0;
      [1, 2, 3].forEach(c => { if (g[c].some(x => x.wild)) { g[c] = g[c].map(() => ({ id: 'w', img: 'magicwand', name: 'Bastão', wild: true, c: 'gold', fresh: true })); n++; } });
      if (n) { rt.msg('🐒 O bastão cresceu pelo rolo!'); await rt.drop(g); }
    },
    highlights: ['🐒 5×3 com <b>243 caminhos</b>', '🪄 O <b>bastão</b> (rolos 2 a 4) é coringa e <b>expande</b> pelo rolo inteiro', '🍑 3/4/5 pêssegos = <b>10/15/20 rodadas grátis</b> com ganhos <b>x2</b> (+10 com 3)', 'Prêmio máximo: <b>2.000x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. Quando o bastão cai, ele cresce e cobre o rolo.</p>',
    features: '<p>🍑 <b>3, 4 ou 5 pêssegos</b> dão <b>10, 15 ou 20 rodadas grátis</b> com todos os ganhos dobrados. 3 pêssegos nelas dão +10.</p>',
  }));

  /* 19. Roma II (Roma II) — 32.400 caminhos, multiplicador sem teto nas grátis */
  const ROMA2 = T.pg({
    studio: STUDIO, id: 'roma2', name: 'Roma II', art: 'militaryhelmet', mascot: 'lion', tag: '32.400 caminhos · multiplicador sem teto',
    colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#78350f,#92400e 50%,#1c0a02)', maxWin: 3000, vol: 3, rtp: '~97%', target: 0.97, cols: 6, rows: 6, cellH: 1,
    intro: 'Inspirado no "Roma II" (TaDa Gaming), a sequência do Roma X.', hello: 'Os gladiadores voltaram à arena!',
    syms: T.pgx.mk([['gladiador', 'militaryhelmet', 'Gladiador'], ['leao', 'lion', 'Leão'], ['escudo', 'shield', 'Escudo'], ['elmo', 'helmet', 'Elmo'], ['taca', 'goblet', 'Taça']], T.pgx.P6),
    wildImg: 'laurel', scImg: 'stadium', scName: 'Coliseu', scW: 0.3, scFW: 0.15, scMin: 3,
    heights: () => [5, 6, 6, 6, 6, 5], gold: [0.05, 0.08], frameReels: [1, 2, 3, 4], stack: 0.3,
    baseM: {}, fsM: { start: 1, add: 1, persist: true }, fsCount: () => 10, retrig: () => 5,
    highlights: ['🏛️ Rolos 5-6-6-6-6-5: <b>32.400 caminhos</b> com cascata', '🖼️ Molduras douradas viram coringa', '🏟️ 3+ coliseus = <b>10 rodadas grátis</b> com multiplicador que sobe a cada cascata e não zera', 'Prêmio máximo: <b>3.000x</b>'],
    how: '<p>Rolos 5-6-6-6-6-5 que pagam por caminhos, com cascata.</p>',
    features: `<p>🏛️ <b>3 ou mais coliseus</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas). Nelas o multiplicador sobe +1 a cada cascata e fica até o fim. ${T.pgx.goldTxt}</p>`,
  });
  App.register(ROMA2);

  /* 20. Tesouros das 3 Moedas (3 Coin Treasures) — moedas da sorte abrem o Hold & Win; tigre, dragão e carpa modificam as moedas */
  (() => {
    const JP = [{ v: 10, j: 'MINI', w: 6 }, { v: 25, j: 'MINOR', w: 2 }, { v: 100, j: 'MAJOR', w: 0.4 }, { v: 1000, j: 'GRAND', w: 0.03 }];
    const VAL = [{ v: 0.5, w: 30 }, { v: 1, w: 28 }, { v: 2, w: 18 }, { v: 3, w: 10 }, { v: 5, w: 6 }];
    const BLUE = [{ v: 5, w: 35 }, { v: 8, w: 28 }, { v: 10, w: 20 }, { v: 15, w: 12 }, { v: 25, w: 5 }];
    const lbl = x => { x.t = x.j ? (x.v > x.j0 ? `${x.j} ${K.short(x.v)}x` : x.j) : K.short(x.v) + 'x'; return x; };
    const COIN = () => { const p = RNG.weighted([...VAL, ...JP]); return lbl({ id: 'moeda', img: 'flamecoin', name: 'Moeda', coin: true, v: p.v, j: p.j, j0: p.v, c: p.j ? 'coin-ouro' : '' }); };
    // moedas da sorte (modificadores): tigre vira moeda azul de valor alto, dragão dobra as outras, carpa coleta a soma das outras
    const LUCKY = [{ k: 'tigre', img: 'tiger', n: 'Tigre', w: 45 }, { k: 'dragao', img: 'dragon', n: 'Dragão', w: 30 }, { k: 'carpa', img: 'goldfish', n: 'Carpa', w: 25 }];
    const EMPTY = () => ({ id: 'vazio', img: 'sparkles', c: 'empty', noPay: true });
    async function applyLucky(rt, gg, c, r, L) {
      const others = cells(gg, (x, cc, rr) => x.coin && !(cc === c && rr === r)).map(([cc, rr]) => gg[cc][rr]);
      if (L.k === 'tigre') {
        gg[c][r] = lbl({ id: 'moeda', img: 'tiger', name: 'Moeda azul', coin: true, v: RNG.weighted(BLUE).v, c: 'gold', fresh: true });
        rt.msg(`🐯 Tigre: moeda azul de ${rt.coins(gg[c][r].v)}!`);
      } else if (L.k === 'dragao') {
        others.forEach(x => { x.v *= 2; lbl(x); });
        gg[c][r] = lbl({ id: 'moeda', img: 'dragon', name: 'Moeda do dragão', coin: true, v: RNG.weighted(VAL).v, c: 'gold', fresh: true });
        rt.msg(`🐉 Dragão: ${others.length} moeda${others.length === 1 ? '' : 's'} em dobro!`);
      } else {
        const v = others.reduce((t, x) => t + x.v, 0) || RNG.weighted(VAL).v;
        gg[c][r] = lbl({ id: 'moeda', img: 'goldfish', name: 'Moeda da carpa', coin: true, v, c: 'gold', fresh: true });
        rt.msg(`🐟 Carpa coletou ${rt.coins(v)}!`);
      }
      rt.fx('big');
      rt.show(gg);
      await rt.wait(800);
    }
    /** Hold & Win: 3 giros que reiniciam a cada moeda nova; moedas da sorte que caem agem na hora */
    async function holdWin(rt, gg) {
      rt.stat('hold');
      await rt.banner('HOLD & WIN', 'Moedas travam · 3 giros que reiniciam', 1400);
      const pend = [];
      gg.forEach((col, c) => col.forEach((x, r) => { if (x.lucky) { pend.push([c, r]); gg[c][r] = EMPTY(); } else if (!x.coin) gg[c][r] = EMPTY(); }));
      rt.show(gg);
      // as moedas da sorte que abriram o bônus revelam o animal e agem depois das moedas iniciais
      for (const [c, r] of pend) await applyLucky(rt, gg, c, r, RNG.weighted(LUCKY));
      let left = 3;
      while (left > 0 && !rt.capped) {
        rt.chip('resp', 'RESPINS', left);
        left--;
        const fresh = [];
        let got = 0;
        gg.forEach((col, c) => col.forEach((x, r) => {
          if (x.coin || RNG.float() >= 0.06) return;
          got++;
          if (RNG.float() < 0.15) { gg[c][r] = { id: 'sorte', img: 'redenvelope', name: 'Moeda da sorte', c: 'gold', fresh: true }; fresh.push([c, r]); }
          else gg[c][r] = { ...COIN(), fresh: true };
        }));
        await rt.drop(gg);
        for (const [c, r] of fresh) await applyLucky(rt, gg, c, r, RNG.weighted(LUCKY));
        if (got) { left = 3; rt.fx('coin'); rt.msg(`+${got} moeda${got > 1 ? 's' : ''}! Respins reiniciados`); }
        if (gg.every(col => col.every(x => x.coin))) break;
        await rt.wait(350);
      }
      rt.chip('resp', null);
      let win = gg.flat().filter(x => x.coin).reduce((t, x) => t + x.v, 0);
      if (gg.every(col => col.every(x => x.coin))) { win += 1000; rt.msg(`TELA CHEIA! GRAND +${rt.coins(1000)}`); rt.fx('jackpot'); await rt.wait(1200); }
      rt.win(win);
      rt.msg(`Moedas: ${rt.coins(win)}`);
      rt.fx('big');
      await rt.wait(900);
    }
    App.register(vgame({
      id: 'tres_moedas', name: 'Tesouros das 3 Moedas', art: 'flamecoin', mascot: 'goldfish', tag: '243 caminhos · Hold & Win com tigre, dragão e carpa',
      colors: ['#dc2626', '#ca8a04'], bg: 'radial-gradient(circle at 50% 30%,#991b1b,#1c0505 70%)', maxWin: 5200, vol: 2,
      intro: 'Inspirado no "3 Coin Treasures" (TaDa Gaming).', hello: 'Dragão, carpa e tigre trazem sorte!',
      syms: syms5([['dragao', 'dragon', 'Dragão'], ['carpa', 'goldfish', 'Carpa'], ['tigre', 'tiger', 'Tigre'], ['lingote', 'goldingot', 'Lingote']]),
      wild: { img: 'yinyang2', w: 0.4 },
      extra: [{ id: 'sorte', img: 'redenvelope', name: 'Moeda da sorte', lucky: true, noPay: true, w: 0.35 }, cashSym('coin', 'Moeda de ouro', 5)],
      cell: cashVal([{ v: 0.5, w: 30 }, { v: 1, w: 30 }, { v: 2, w: 20 }, { v: 3, w: 12 }, { v: 5, w: 6 }, { v: 10, w: 2 }]),
      after: async (rt, g) => { await instantCollect(rt, g, 'moedas de ouro'); },
      trig: g => g.flat().some(x => x.lucky) && RNG.float() < 0.022 * count(g, x => x.lucky),
      async bonus(rt, { g } = {}, H) {
        const gg = g ? g.map(col => col.map(x => ({ ...x }))) : H.make('w');
        if (!g) gg[RNG.int(0, 4)][RNG.int(0, 2)] = { id: 'sorte', img: 'redenvelope', name: 'Moeda da sorte', lucky: true, noPay: true };
        RNG.shuffle(cells(gg, x => !x.lucky)).slice(0, 5).forEach(([c, r]) => { gg[c][r] = COIN(); });
        await holdWin(rt, gg);
      },
      highlights: ['🧧 5×3 com <b>243 caminhos</b>', '🪙 <b>Coleta instantânea:</b> 5+ moedas de ouro com valor pagam a <b>soma</b> na hora', '🧧 Moedas da sorte podem abrir o <b>Hold & Win</b> a qualquer giro; cada moeda nova trava e reinicia os 3 giros', '🐯 <b>Tigre</b> vira moeda azul de alto valor · 🐉 <b>Dragão</b> dobra as outras moedas · 🐟 <b>Carpa</b> coleta a soma de todas', '💰 Jackpots <b>MINI, MINOR, MAJOR e GRAND</b> (tela cheia = GRAND)', 'Prêmio máximo: <b>5.200x</b>'],
      how: '<p>Grade 5×3 que paga por caminhos. 🪙 As <b>moedas de ouro</b> mostram um valor: com <b>5 ou mais</b> na tela, a soma é paga na hora. Sempre que cair uma 🧧 moeda da sorte, há chance de começar o Hold & Win.</p>',
      features: '<p>🧧 No <b>Hold & Win</b> entram 5 moedas com valores ou jackpots; o resto fica vazio e gira 3 vezes, e cada moeda nova trava e volta para 3 giros. As <b>moedas da sorte</b> (as que abriram o bônus e as que caírem nele) revelam um animal que age na hora:</p><p>🐯 <b>Tigre:</b> vira uma moeda azul de 5x a 25x.<br>🐉 <b>Dragão:</b> dobra o valor de todas as outras moedas na tela.<br>🐟 <b>Carpa:</b> soma o valor de todas as outras moedas e guarda esse total nela.</p><p>No fim, todas as moedas são pagas; tela cheia paga ainda o GRAND.</p>',
    }));
  })();
})();
