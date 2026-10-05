'use strict';

/* =========================================================
   Slots no estilo Nolimit City (SlotKit): volatilidade extrema,
   xWays, xSplit, xNudge e xBomb. Temas sombrios, sem violência gráfica.
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, cells, count, key, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'nolimit';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const SUITS = (pays, w = [8, 8, 9, 9]) => K.ROYALS(pays, w);
  const LOCK = () => ({ id: 'lock', img: 'locked', name: 'Bloqueado', c: 'locked', noPay: true });
  /** xNudge: coringa alto que empurra até cobrir o rolo; cada empurrão soma +1. */
  const nudge = (WILD, hgt, extra = 0) => { const n = RNG.int(0, hgt - 1); return { n, m: 1 + n + extra }; };
  const fillReel = (g, c, cell) => { g[c] = g[c].map(x => (x && x.id === 'lock' ? x : { ...cell, fresh: true })); };

  /* =========================================================
     1. Manicômio (Mental) — xWays, Fire Frames (xSplit)
     ========================================================= */
  (() => {
    const SY = [
      S('paciente', 'maskface', 'Paciente', [2, 6, 25], 3), S('fantasma', 'dizzy', 'Tonto', [1.5, 5, 18], 3), S('cerebro', 'brain', 'Cérebro', [1, 3, 12], 4),
      S('seringa', 'syringe', 'Seringa', [0.8, 2.5, 8], 4), S('pilula', 'pill', 'Pílula', [0.6, 2, 6], 5), ...SUITS([[0.3, 0.8, 3], [0.3, 0.8, 3], [0.2, 0.6, 2], [0.2, 0.6, 2]], [6, 6, 7, 7]),
    ];
    const WILD = { id: 'w', img: 'bandage', name: 'xNudge', wild: true, reels: [1, 2, 3], w: 0.5 };
    const XW = { id: 'xw', img: 'eyes', name: 'xWays', xw: true, w: 0.55, fw: 0.9 };
    const SC = { id: 'sc', img: 'scorpion', name: 'Escorpião', sc: true, w: 1.05, fw: 0 };
    // aranha: sozinha não faz nada; junto com 3 escorpiões sobe o nível do bônus
    const SPIDER = { id: 'aranha', img: 'spider', name: 'Aranha', spider: true, noPay: true, reels: [0, 4], w: 2.4, fw: 0 };
    const all = [...SY, WILD, XW, SC, SPIDER];
    const draw = pool(all);
    const H = [2, 3, 3, 3, 2];
    const make = (wk = 'w') => grid(H, c => draw(c, wk));
    /** Níveis do bônus: fogo mais forte e multiplicador que cresce nos de cima. */
    const TIERS = [
      { n: 8, title: 'AUTÓPSIA', sub: '8 giros · fogo em todo giro', fire: [2, 6], m0: 1, grow: true, triple: 0 },
      { n: 9, title: 'LOBOTOMIA', sub: '9 giros · fogo mais forte', fire: [3, 7], m0: 1, grow: true, triple: 0 },
      { n: 10, title: 'MENTAL', sub: '10 giros · fogo triplo e multiplicador x2', fire: [3, 8], m0: 2, grow: true, triple: 0.3 },
    ];
    async function play(rt, g, fs, st) {
      // xWays revela 2 a 4 cópias de um símbolo
      let rev = 0;
      g.forEach((col, c) => col.forEach((x, r) => { if (x.xw) { const s = RNG.pick(SY.slice(0, 5)), n = RNG.int(2, 4); rev += n; g[c][r] = { ...s, n, t: '×' + n, c: 'xways', fresh: true }; } }));
      // Fire Frames: posições pegam fogo e se dividem (contam em dobro; no Mental podem triplicar)
      const T = st && st.tier;
      if (RNG.float() < (fs ? 1 : 0.12)) {
        const k = T ? RNG.int(T.fire[0], T.fire[1]) : RNG.int(1, 5), pos = RNG.shuffle(cells(g, x => !x.sc && !x.wild && !x.spider));
        pos.slice(0, k).forEach(([c, r]) => { const x = g[c][r], f = T && RNG.float() < T.triple ? 3 : 2; g[c][r] = { ...x, n: (x.n || 1) * f, t: '×' + (x.n || 1) * f, c: 'fire', fresh: true }; });
        rt.msg(`🔥 Fire Frames: ${Math.min(k, pos.length)} posições se dividiram!`); rt.fx('zap');
      }
      // xNudge no rolo inteiro
      for (let c = 1; c <= 3; c++) if (g[c].some(x => x.wild)) { const nd = nudge(WILD, H[c]); fillReel(g, c, { ...WILD, m: nd.m, t: 'x' + nd.m, c: 'duel' }); }
      await rt.drop(g);
      if (st && T.grow && rev) { st.m += rev; rt.chip('mult', 'MULT.', 'x' + st.m); }
      await pay(rt, ways(g, SY), st ? st.m : 1);
    }
    App.register(K.create({
      id: 'manicomio', name: 'Manicômio', studio: STUDIO, art: 'brain', mascot: 'zombie',
      tag: 'xWays · Fire Frames · 3 níveis de bônus', colors: ['#7f1d1d', '#334155'], bg: 'linear-gradient(180deg,#1c1917,#292524 60%,#450a0a)',
      cols: 5, rows: 3, cellH: 1.2, maxWin: 66666, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Mental" (Nolimit City).', hello: 'Os símbolos se dividem...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 2-3-3-3-2 = 108 caminhos, que multiplicam com xWays e Fire Frames.')],
      highlights: ['🧠 Rolos <b>2-3-3-3-2</b> (108 caminhos) que explodem com xWays', '👁️ <b>xWays</b> revela 2 a 4 cópias de um símbolo na mesma casa', '🔥 <b>Fire Frames</b> incendeiam casas que <b>se dividem</b> (contam em dobro)', '🦂 3 escorpiões = <b>Autópsia</b> (8 giros); com 🕷️ 1 aranha vira <b>Lobotomia</b> (9) e com 2 aranhas, <b>Mental</b> (10)', 'Prêmio máximo: <b>66.666x</b>'],
      how: '<p>Rolos <b>2-3-3-3-2</b> com 108 caminhos. ☠️ <b>xNudge</b> (rolos 2 a 4) cobre o rolo inteiro e cada empurrão soma +1 no multiplicador.</p><p>👁️ <b>xWays</b> vira de 2 a 4 cópias do mesmo símbolo, multiplicando os caminhos. 🔥 <b>Fire Frames</b> divide casas aleatórias em duas. 🕷️ As <b>aranhas</b> (rolos 1 e 5) não pagam, mas sobem o nível do bônus.</p>',
      features: '<p>🦂 <b>3 escorpiões</b> abrem o bônus, e as 🕷️ <b>aranhas</b> que caírem junto escolhem o nível:</p><ul class="si-list"><li><b>Autópsia</b> (sem aranha): <b>8 giros</b> com Fire Frames em <b>todo</b> giro (2 a 6 casas).</li><li><b>Lobotomia</b> (1 aranha): <b>9 giros</b> com fogo mais forte (3 a 7 casas).</li><li><b>Mental</b> (2 aranhas): <b>10 giros</b> com fogo de 3 a 8 casas que pode <b>triplicar</b> o símbolo, e o multiplicador já começa em <b>x2</b>.</li></ul><p>Em todos os níveis há um multiplicador global que começa em x1 e <b>soma as cópias</b> de cada xWays revelado, sem zerar.</p><p class="muted small">A compra do bônus sorteia o nível com as mesmas chances do jogo normal.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false, null);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sp: count(g, x => x.spider) }); }
      },
      async bonus(rt, { sp = 0, buy = false } = {}) {
        if (buy) sp = RNG.weighted([{ v: 0, w: 80 }, { v: 1, w: 17 }, { v: 2, w: 3 }]).v;
        const T = TIERS[Math.min(2, sp)];
        const st = { m: T.m0, tier: T };
        if (T.grow) rt.chip('mult', 'MULT.', 'x' + st.m);
        await rt.fsLoop(T.n, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, true, st); }, { title: T.title, sub: T.sub });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     2. Cela xWays (San Quentin xWays) — Razor Split e coringas que pulam
     ========================================================= */
  (() => {
    const SY = [
      S('chefe', 'police', 'Guarda', [2, 6, 25], 3), S('detento', 'cursing', 'Detento', [1.5, 5, 18], 3), S('corrente', 'chains', 'Corrente', [1, 3, 12], 4),
      S('chave', 'key', 'Chave', [0.8, 2.5, 8], 4), ...SUITS([[0.3, 0.8, 3], [0.3, 0.8, 3], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'policelight', name: 'Coringa', wild: true, reels: [1, 2, 3], w: 0.7, fw: 0.6 };
    const XW = { id: 'xw', img: 'mirror', name: 'xWays', xw: true, w: 0.45 };
    const SC = { id: 'sc', img: 'locked', name: 'Lockdown', sc: true, w: 0.95, fw: 0 };
    const all = [...SY, WILD, XW, SC];
    const draw = pool(all);
    const make = (wk = 'w') => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function prep(rt, g) {
      g.forEach((col, c) => col.forEach((x, r) => { if (x.xw) { const s = RNG.pick(SY.slice(0, 4)), n = RNG.int(2, 4); g[c][r] = { ...s, n, t: '×' + n, c: 'xways', fresh: true }; } }));
      // Razor Split (xSplit): divide os símbolos da linha dele, que passam a contar em dobro
      if (RNG.float() < 0.1) { const r = RNG.int(0, 2); g.forEach(col => { const x = col[r]; if (!x.sc) col[r] = { ...x, n: (x.n || 1) * 2, t: '×' + (x.n || 1) * 2, c: 'fire', fresh: true }; }); rt.msg(`🔪 Razor Split na linha ${r + 1}!`); }
      await rt.drop(g);
    }
    App.register(K.create({
      id: 'celaxways', name: 'Cela xWays', studio: STUDIO, art: 'chains', mascot: 'police',
      tag: 'Coringas que pulam até x512 · 150.000x', colors: ['#475569', '#b91c1c'], bg: 'linear-gradient(180deg,#0f172a,#1e293b 60%,#334155)',
      cols: 5, rows: 3, maxWin: 150000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "San Quentin xWays" (Nolimit City).', hello: 'Segurança máxima, prêmio máximo!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '243 caminhos que crescem com xWays e Razor Split.')],
      highlights: ['⛓️ 5×3 com <b>243 caminhos</b>', '👁️ <b>xWays</b> e 🔪 <b>Razor Split</b> dividem símbolos e multiplicam os caminhos', '🔒 3 Lockdowns = <b>8 giros</b> com <b>coringas que pulam</b> e dobram o multiplicador a cada pulo (até <b>x512</b>)', 'Prêmio máximo: <b>150.000x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>243 caminhos</b>. 🚨 é coringa (rolos 2 a 4).</p><p>👁️ <b>xWays</b> revela 2 a 4 cópias de um símbolo. 🔪 <b>Razor Split</b> (xSplit) corta uma linha inteira ao meio: todos os símbolos dela contam em dobro.</p>',
      features: '<p>🔒 <b>3 Lockdowns</b> dão <b>8 Lockdown Spins</b>. Todo coringa que cair vira um <b>coringa saltador</b>: ele fica até o fim, pula para uma posição aleatória a cada giro e seu multiplicador <b>dobra</b> a cada pulo (x2, x4, x8… até x512).</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await prep(rt, g);
        await pay(rt, ways(g, SY));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let jumpers = [];
        await rt.fsLoop(8, async () => {
          const g = make('fw');
          jumpers = jumpers.map(j => ({ m: Math.min(512, j.m * 2), c: RNG.int(1, 3), r: RNG.int(0, 2) }));
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => { if (jumpers.length < 3) jumpers.push({ m: 1, c, r }); });
          jumpers.forEach(j => { const cur = g[j.c][j.r]; g[j.c][j.r] = { ...WILD, m: cur.wild ? (cur.m || 1) + j.m : j.m, t: 'x' + j.m, c: 'sticky', fresh: true }; });
          if (jumpers.length) rt.msg(`🚨 Coringas saltadores: ${jumpers.map(j => 'x' + j.m).join(' ')}`);
          await prep(rt, g);
          await pay(rt, ways(g, SY, { wildMult: 'add' }));
        }, { title: 'LOCKDOWN SPINS', sub: 'Coringas saltadores!' });
      },
    }));
  })();

  /* =========================================================
     3. Lápide RIP (Tombstone RIP) — xNudge + xSplit, até 300.000x
     ========================================================= */
  (() => {
    const SY = [
      S('xerife', 'knot', 'Forca', [3, 10, 40], 3), S('caixao', 'coffin', 'Caixão', [2, 6, 25], 3), S('pistola', 'scorpion', 'Escorpião', [1.5, 4, 15], 4),
      S('cacto', 'desert', 'Deserto', [1, 3, 10], 4), S('whisky', 'bottle', 'Garrafa', [0.8, 2, 8], 5), ...SUITS([[0.4, 1, 4], [0.4, 1, 4], [0.3, 0.8, 3], [0.3, 0.8, 3]], [7, 7, 8, 8]),
    ];
    const WILD = { id: 'w', img: 'crossbones', name: 'xNudge', wild: true, reels: [1, 2, 3], w: 0.55, fw: 0.8 };
    const RWILD = { id: 'rw', img: 'skull', name: 'Coringa', wild: true, reels: [1, 2, 3], w: 0.2, fw: 0.45 };
    const SPLIT = { id: 'split', img: 'scissors', name: 'xSplit', wild: true, reels: [4], w: 0.9 };
    const SC = { id: 'sc', img: 'headstone', name: 'Lápide', sc: true, reels: [0, 1, 2, 3], w: 1.25, fw: 0 };
    // scatter de Boothill: só no último rolo; junto com 3 lápides troca o bônus
    const BOOT = { id: 'boot', img: 'coffin', name: 'Boothill', sc: true, boot: true, reels: [4], w: 8, fw: 0 };
    const all = [...SY, WILD, RWILD, SPLIT, SC, BOOT];
    const draw = pool(all);
    const H = [2, 3, 3, 3, 1];
    const make = (wk = 'w') => grid(H, c => draw(c, wk));
    /** st: { sticky } (Boothill: rolos xNudge presos) ou { gm } (Hang 'em High: multiplicador global). */
    async function play(rt, g, st) {
      // 1º o xSplit divide a linha dele (linha do meio): símbolos contam em dobro e o xNudge dobra antes de empurrar
      const split = g[4][0].id === 'split';
      if (split) {
        g[4][0] = { ...SPLIT, n: 2, t: 'xSplit' };
        for (let c = 0; c <= 3; c++) { const r = 1, x = g[c][r]; if (x && !x.sc && x.id !== 'w') g[c][r] = { ...x, n: (x.n || 1) * 2, t: '×' + (x.n || 1) * 2, c: 'fire' }; }
        rt.msg('💥 xSplit! A linha do meio se divide e os xNudge dobram antes de empurrar');
      }
      // 2º o xNudge empurra até cobrir o rolo (+1 por empurrão)
      let nudges = 0;
      const sticky = st && st.sticky;
      for (let c = 1; c <= 3; c++) {
        const has = g[c].some(x => x.id === 'w');
        if (!has && !(sticky && sticky[c])) continue;
        let m = sticky && sticky[c] ? sticky[c] : 0;
        if (has) { nudges++; m += (split ? 2 : 1) + nudge(WILD, 3).n; }
        if (sticky) sticky[c] = m;
        fillReel(g, c, { ...WILD, m, t: 'x' + m, c: 'duel' });
      }
      if (sticky) rt.head(H.map((_, c) => (sticky[c] ? 'x' + sticky[c] : '')));
      if (st && st.gm != null) {
        const add = count(g, x => x.id === 'rw') + (split ? 2 : 0) + nudges * 3;
        if (add) { st.gm += add; rt.chip('mult', 'MULT.', 'x' + st.gm); rt.msg(`🪢 Multiplicador da forca +${add}: x${st.gm}`); }
      }
      await rt.drop(g);
      // no jogo base rolos diferentes se multiplicam; nas grátis se somam
      await pay(rt, ways(g, SY, { wildMult: st ? 'add' : 'mul' }), st && st.gm ? st.gm : 1);
    }
    App.register(K.create({
      id: 'lapiderip', name: 'Lápide RIP', studio: STUDIO, art: 'headstone', mascot: 'cowboy',
      tag: 'Volatilidade insana · 2 bônus · até 300.000x', colors: ['#78350f', '#1c1917'], bg: 'linear-gradient(180deg,#451a03,#292524 60%,#0c0a09)',
      cols: 5, rows: 3, cellH: 1.2, maxWin: 300000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Tombstone R.I.P." (Nolimit City).', hello: 'O faroeste mais perigoso que existe.',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 2-3-3-3-1: 54 caminhos (mais com xSplit). Multiplicadores de rolos diferentes se multiplicam.')],
      highlights: ['🪦 Rolos <b>2-3-3-3-1</b> e volatilidade insana', '☠️ <b>xNudge</b> (rolos 2 a 4): cada empurrão soma +1 no multiplicador; rolos diferentes <b>se multiplicam</b>', '💥 <b>xSplit</b> no último rolo divide a linha do meio (conta em dobro) e <b>dobra</b> os xNudge antes de eles empurrarem', '3 lápides = <b>Hang \'em High</b> (8 giros com multiplicador que só cresce); com o ⚰️ <b>Boothill</b> junto = <b>Boothill</b> (10 giros com rolos xNudge presos)', 'Prêmio máximo: <b>300.000x</b>'],
      how: '<p>Rolos <b>2-3-3-3-1</b>. ☠️ O <b>xNudge</b> empurra até cobrir o rolo e cada empurrão soma +1. Multiplicadores em rolos diferentes <b>se multiplicam</b>. 💀 também é coringa (sem multiplicador).</p><p>💥 O <b>xSplit</b> só cai no último rolo: vale por dois símbolos e divide a linha do meio, fazendo cada símbolo dela contar em dobro. Primeiro ele divide e <b>dobra o xNudge</b> (x2), depois o xNudge empurra (+1 por casa).</p>',
      features: '<p>🪦 <b>3 lápides</b> (rolos 1 a 4) abrem o bônus; o ⚰️ <b>Boothill</b> (só no rolo 5) escolhe qual:</p><ul class="si-list"><li><b>Hang \'em High</b> (só lápides): <b>8 rodadas grátis</b> com um multiplicador global que começa em x1, <b>nunca zera</b> e vale para todo ganho: +1 por coringa comum, +2 por xSplit e +3 por xNudge.</li><li><b>Boothill</b> (lápides + Boothill): <b>10 rodadas grátis</b> em que cada rolo xNudge <b>fica preso</b> com seu multiplicador; se cair outro xNudge nele, os multiplicadores se somam.</li></ul><p>Nas rodadas grátis os multiplicadores de rolos diferentes numa mesma combinação <b>se somam</b>.</p><p class="muted small">A compra do bônus sorteia o tipo com as mesmas chances do jogo normal.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, null);
        if (count(g, x => x.sc && !x.boot) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { boot: count(g, x => x.boot) > 0 }); }
      },
      async bonus(rt, { boot = false, buy = false } = {}) {
        if (buy) boot = RNG.float() < 0.14;
        if (boot) {
          const sticky = {};
          await rt.fsLoop(10, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, { sticky }); }, { title: 'BOOTHILL', sub: '10 giros · xNudge presos' });
          rt.head(null);
        } else {
          const st = { gm: 1 };
          rt.chip('mult', 'MULT.', 'x1');
          await rt.fsLoop(8, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, st); }, { title: 'HANG \'EM HIGH', sub: '8 giros · multiplicador que só cresce' });
          rt.chip('mult', null);
        }
      },
    }));
  })();

  /* =========================================================
     4. Cidade Fantasma (Deadwood) — xNudge que se somam
     ========================================================= */
  (() => {
    const SY = [
      S('xerife', 'boot', 'Bota', [2, 6, 20], 3), S('cavalo', 'moose', 'Alce', [1.5, 4, 15], 3), S('distintivo', 'medal', 'Medalha', [1, 3, 10], 4),
      S('whisky', 'beers', 'Cervejas', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'bullseye', name: 'Caçador xNudge', wild: true, w: 0.45, fw: 1.3 };
    const SC = { id: 'sc', img: 'railway', name: 'Ferrovia', sc: true, w: 0.85, fw: 0 };
    // distintivo do xerife: só nas rodadas grátis, cada um dá +1 giro
    const BADGE = { id: 'badge', img: 'sheriff', name: 'Distintivo', badge: true, noPay: true, w: 0, fw: 0.3 };
    const all = [...SY, WILD, SC, BADGE];
    const draw = pool(all);
    const H = [3, 4, 4, 4, 3];
    const make = (wk = 'w') => grid(H, c => draw(c, wk));
    /** st.gm: multiplicador global do Pistoleiro (soma cada empurrão, nunca zera). */
    async function play(rt, g, st, force) {
      if (force && !g.some(col => col.some(x => x.wild))) { const c = RNG.int(0, 4); g[c][RNG.int(0, H[c] - 1)] = { ...WILD }; }
      const gun = st && st.gm != null;
      let pushes = 0;
      for (let c = 0; c < 5; c++) {
        if (!g[c].some(x => x.wild)) continue;
        const nd = nudge(WILD, H[c]);
        pushes += nd.n;
        // no Pistoleiro os empurrões vão para o multiplicador global (o rolo não fica preso)
        fillReel(g, c, gun ? { ...WILD, c: 'duel' } : { ...WILD, m: nd.m, t: 'x' + nd.m, c: 'duel' });
      }
      if (gun && pushes) { st.gm += pushes; rt.chip('mult', 'MULT.', 'x' + st.gm); rt.msg(`🔫 ${pushes} empurrão${pushes > 1 ? 'ões' : ''}: multiplicador x${st.gm}`); }
      await rt.drop(g);
      await pay(rt, ways(g, SY, { wildMult: 'add' }), gun ? st.gm : 1);
    }
    App.register(K.create({
      id: 'cidadefantasma', name: 'Cidade Fantasma', studio: STUDIO, art: 'pistol', mascot: 'cowboy',
      tag: 'xNudge somam · caçador ou pistoleiro', colors: ['#a16207', '#44403c'], bg: 'linear-gradient(180deg,#78350f,#57534e 60%,#1c1917)',
      cols: 5, rows: 4, maxWin: 13950, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Deadwood" (Nolimit City).', hello: 'Caçadores empurram os rolos!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 3-4-4-4-3 = 576 caminhos.')],
      highlights: ['🤠 Rolos <b>3-4-4-4-3</b> (576 caminhos)', '🔫 <b>Caçador xNudge</b>: coringa de 4 de altura que sempre empurra até aparecer inteiro; cada empurrão <b>+1</b>', 'Vários xNudge na mesma combinação <b>somam</b> os multiplicadores', '🌵 3 bônus: escolha <b>Caçador</b> (xNudge em todo giro) ou <b>Pistoleiro</b> (um multiplicador global sem limite que nunca zera)', 'Prêmio máximo: <b>13.950x</b>'],
      how: '<p>Rolos <b>3-4-4-4-3</b> com <b>576 caminhos</b>. 🔫 O <b>Caçador xNudge</b> pode cair em qualquer rolo: ele empurra até cobrir o rolo e cada empurrão soma +1 no multiplicador. Caçadores na mesma combinação <b>somam</b>.</p>',
      features: '<p>🌵 <b>3 scatters</b> e você escolhe 8 rodadas grátis:</p><ul class="si-list"><li><b>Caçador:</b> pelo menos 1 xNudge garantido em todo giro (o multiplicador zera a cada giro).</li><li><b>Pistoleiro:</b> um <b>multiplicador global</b> começa em x1 e cada empurrão de xNudge soma +1 nele, <b>sem limite</b> e sem zerar até o fim; ele vale para todos os ganhos. Os rolos não ficam presos.</li></ul><p>⭐ Nas duas, cada <b>distintivo do xerife</b> que cair dá <b>+1 rodada grátis</b>.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, null, false);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const mode = await rt.choose('ESCOLHA O BÔNUS', [
          { id: 'cacador', img: 'pistol', label: 'Caçador', desc: 'xNudge garantido em todo giro' },
          { id: 'pistoleiro', img: 'cowboy', label: 'Pistoleiro', desc: 'Multiplicador global sem limite' },
        ]);
        const st = mode === 'pistoleiro' ? { gm: 1 } : null;
        if (st) rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(8, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          const b = count(g, x => x.badge);
          if (b) { api.add(b); rt.fx('coin'); }
          await play(rt, g, st, mode === 'cacador');
        }, { title: mode === 'cacador' ? 'GIROS DO CAÇADOR' : 'GIROS DO PISTOLEIRO', sub: '8 giros · distintivo = +1' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     5. Buraco de Fogo xBomb (Fire in the Hole) — linhas que se abrem
     ========================================================= */
  (() => {
    const SY = [
      S('anao', 'pick', 'Picareta', [1, 2, 4, 8], 3), S('lanterna', 'flashlight', 'Lanterna', [0.8, 1.6, 3, 6], 4), S('dinamite', 'firecracker', 'Dinamite', [0.6, 1.2, 2.5, 5], 4),
      S('ouro', 'mountain', 'Montanha', [0.5, 1, 2, 4], 5), K.L('A', [0.2, 0.4, 0.8, 1.6], 8), K.L('K', [0.2, 0.4, 0.8, 1.6], 8),
      K.L('Q', [0.15, 0.3, 0.6, 1.2], 9),
    ];
    const BOMB = { id: 'w', img: 'bomb', name: 'xBomb', wild: true, bomb: true, w: 0.45 };
    const SC = { id: 'sc', img: 'cart', name: 'Vagão', sc: true, w: 0.22 };
    const all = [...SY, BOMB, SC];
    const draw = pool(all);
    const R = 6;
    const make = (open = 3) => grid([R, R, R, R, R, R], (c, r) => (r < R - open ? LOCK() : draw(c)));
    const refill = (g, rm, open) => g.forEach((col, c) => {
      const region = col.slice(R - open);
      const stay = region.filter((x, i) => !rm.has(key(c, R - open + i)) && x.id !== 'lock');
      const need = open - stay.length;
      g[c] = [...Array.from({ length: R - open }, LOCK), ...Array.from({ length: need }, () => ({ ...draw(c), fresh: true })), ...stay];
    });
    async function play(rt, g, st) {
      for (let guard = 0; guard < 40 && !rt.capped; guard++) {
        const res = ways(g, SY);
        // xBomb: coringa que dispara sozinho (não precisa de ganho) depois de pagar
        const bombs = cells(g, x => x.bomb);
        if (!res.total && !bombs.length) break;
        if (res.total) await pay(rt, res, st.m);
        const rm = new Set(res.cells);
        bombs.forEach(([c, r]) => {
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const y = g[c + a] && g[c + a][r + b]; if (y && y.id !== 'lock') rm.add(key(c + a, r + b)); }
        });
        const boom = bombs.length;
        const before = st.open;
        // cada colapso com ganho abre 1 linha e cada xBomb abre mais 1
        st.open = Math.min(R, st.open + (res.total ? 1 : 0) + boom);
        if (boom) { st.m += boom; rt.chip('mult', 'MULT.', 'x' + st.m); rt.msg(`💣 xBomb! Multiplicador x${st.m}`); rt.fx('v_fire'); rt.fx('boom'); }
        if (st.open > before) rt.chip('rows', 'LINHAS', st.open);
        refill(g, rm, st.open);
        await rt.drop(g);
      }
    }
    async function wagon(rt, rows) {
      rt.stat('hold');
      await rt.banner('LUCKY WAGON SPINS', `${rows} linhas · moedas travam e reiniciam os 3 giros`, 1500);
      // valores em unidades da tabela (o k da calibração converte para x aposta)
      const COIN = () => ({ id: 'moeda', img: 'coin', v: 40 * RNG.weighted([{ v: 0.5, w: 30 }, { v: 1, w: 30 }, { v: 2, w: 20 }, { v: 5, w: 12 }, { v: 10, w: 6 }, { v: 25, w: 2 }]).v, coin: true });
      const g = grid([rows, rows, rows, rows, rows, rows], () => (RNG.float() < 0.25 ? COIN() : { id: 'vazio', img: null, c: 'empty' }));
      let left = 3, mult = 1;
      rt.show(g);
      while (left > 0) {
        rt.chip('fs', 'GIROS', left);
        left--;
        let got = 0;
        g.forEach((col, c) => col.forEach((x, r) => { if (!x.coin && RNG.float() < 0.09) { g[c][r] = { ...COIN(), fresh: true }; got++; } }));
        if (RNG.float() < 0.06) { mult += RNG.int(1, 3); rt.msg(`⛏️ O anão multiplica as moedas: x${mult}`); rt.fx('big'); }
        await rt.drop(g);
        if (got) left = 3;
        if (g.every(col => col.every(x => x.coin))) { mult *= 4; rt.msg('TELA CHEIA! x4'); break; }
        await rt.wait(350);
      }
      rt.chip('fs', null);
      const v = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0) * mult;
      rt.win(v);
      rt.msg(`🛒 Vagão da sorte: ${rt.coins(v)}`);
      rt.fx('big');
      await rt.wait(900);
    }
    App.register(K.create({
      id: 'buracofogo', name: 'Buraco de Fogo xBomb', studio: STUDIO, art: 'pick', mascot: 'bomb',
      tag: 'Mina que cresce até 46.656 caminhos', colors: ['#ea580c', '#1c1917'], bg: 'linear-gradient(180deg,#292524,#1c1917 60%,#431407)',
      cols: 6, rows: 6, maxWin: 60000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Fire in the Hole xBomb" (Nolimit City).', hello: 'Cada ganho abre mais uma linha da mina!',
      symbols: all, extraSprites: ['locked', 'coin'],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Começa com 3 linhas abertas (729 caminhos) e pode abrir até 6 (46.656).')],
      highlights: ['⛏️ Grade 6×6 que começa com <b>3 linhas abertas</b>; cada cascata com ganho <b>abre mais uma</b>', '💣 <b>xBomb</b> é coringa e <b>dispara mesmo sem ganho</b>: destrói os vizinhos, abre uma linha embaixo e soma <b>+1 no multiplicador</b> (sem limite)', '🛒 3/4/5 vagões = <b>Lucky Wagon Spins</b> com 2, 3 ou 4 linhas de moedas', 'Prêmio máximo: <b>60.000x</b>'],
      how: '<p>Grade <b>6×6</b>: só as <b>3 linhas de baixo</b> começam abertas. Ganhos em caminhos causam colapso (cascata) e cada colapso <b>desbloqueia uma linha</b> (até 6, 46.656 caminhos).</p><p>💣 <b>xBomb</b> é coringa e dispara <b>mesmo sem ganho</b>: destrói as casas vizinhas, desbloqueia mais uma linha escondida e o multiplicador global sobe +1 até o fim do giro.</p>',
      features: '<p>🛒 <b>3, 4 ou 5 vagões</b> abrem os <b>Lucky Wagon Spins</b> numa grade de 2, 3 ou 4 linhas: moedas travam e cada moeda nova <b>reinicia os 3 giros</b>. O anão pode multiplicar todas as moedas e encher a grade vale <b>x4</b>.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const st = { m: 1, open: 3 };
        rt.chip('mult', 'MULT.', 'x1');
        await play(rt, g, st);
        rt.chip('mult', null);
        rt.chip('rows', null);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        await wagon(rt, Math.min(4, sc - 1));
      },
    }));
  })();

  /* =========================================================
     6. Das Submarino (Das xBoot) — torpedos que sobem
     ========================================================= */
  (() => {
    const SY = [
      S('capitao', 'militaryhelmet', 'Capitão', [2, 6, 20], 3), S('navio', 'ship', 'Navio', [1.5, 4, 15], 3), S('ancora', 'wave', 'Onda', [1, 3, 10], 4),
      S('bussola', 'shark', 'Tubarão', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'divingmask', name: 'Periscópio xNudge', wild: true, reels: [1, 2, 3], w: 0.45, fw: 0.6 };
    const TORP = { id: 'torp', img: 'rocket', name: 'Torpedo', wild: true, reels: [1, 2, 3, 4], w: 0, fw: 0 };
    const SC = { id: 'sc', img: 'satellite', name: 'Radar', sc: true, w: 0.65, fw: 0.12 };
    const all = [...SY, WILD, TORP, SC];
    const draw = pool(all);
    const make = (wk = 'w', H = [4, 4, 4, 4, 4]) => grid(H, c => draw(c, wk));
    const periscope = g => { for (let c = 1; c <= 3; c++) if (g[c].some(x => x.id === 'w')) { const nd = nudge(WILD, g[c].length); fillReel(g, c, { ...WILD, m: nd.m, t: 'x' + nd.m, c: 'duel' }); } };
    App.register(K.create({
      id: 'submarino', name: 'Das Submarino', studio: STUDIO, art: 'ship', mascot: 'militaryhelmet',
      tag: 'Torpedos sobem · 2 bônus', colors: ['#1e3a8a', '#0f766e'], bg: 'linear-gradient(180deg,#0c4a6e,#083344 60%,#020617)',
      cols: 5, rows: 4, maxWin: 55200, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Das xBoot" (Nolimit City).', hello: 'O radar procura torpedos...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos (2.048 com o rolo 3 de 8 casas).')],
      highlights: ['⚓ 5×4 com <b>1.024 caminhos</b>', '🔭 <b>Periscópio xNudge</b>: coringa de 4 de altura, +1 por empurrão', '📡 3 radares = <b>Silent Hunter</b> (8 giros, rolo 3 com 8 casas e torpedos lançados pelo periscópio); 4+ = <b>Wolf Pack</b> com torpedos xWays de x2 a x9', 'Cada radar nas rodadas grátis dá <b>+2 giros</b>', 'Prêmio máximo: <b>55.200x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>1.024 caminhos</b>. 🔭 O <b>periscópio xNudge</b> (rolos 2 a 4) empurra até cobrir o rolo e cada empurrão soma +1. Coringas na mesma combinação somam os multiplicadores.</p>',
      features: '<p>📡 Os radares abrem 8 rodadas grátis, e cada radar que cair nelas dá <b>+2 giros</b>:</p><ul class="si-list"><li><b>3 radares — Silent Hunter:</b> o <b>rolo 3 cresce para 8 casas</b>. Todo ganho com um periscópio <b>lança um torpedo</b> 🚀 coringa no fundo de um rolo; ele fica na tela, <b>sobe uma linha a cada giro</b> e ganha +1 no multiplicador a cada subida, até sair pelo topo.</li><li><b>4+ radares — Wolf Pack:</b> torpedos aparecem sozinhos no fundo dos rolos 2 a 5 e são <b>xWays</b>: começam valendo <b>x2</b> caminhos e ganham +1 a cada subida, até <b>x9</b>.</li></ul><p class="muted small">A compra do bônus sorteia o tipo com as mesmas chances do jogo normal.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        periscope(g);
        await rt.drop(g);
        await pay(rt, ways(g, SY, { wildMult: 'add' }));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = RNG.float() < 0.1 ? 4 : 3;
        const wolf = sc >= 4;
        const H = wolf ? [4, 4, 4, 4, 4] : [4, 4, 8, 4, 4];
        let torps = [];
        await rt.fsLoop(8, async api => {
          const g = make('fw', H).map(col => col.map(x => (wolf && x.id === 'w' ? RNG.pick(SY) : x)));
          // torpedos sobem uma linha por giro e saem pelo topo
          torps = torps.map(t => ({ ...t, r: t.r - 1, m: wolf ? t.m : t.m + 1, n: wolf ? Math.min(9, t.n + 1) : 1 })).filter(t => t.r >= 0);
          if (wolf) for (let c = 1; c <= 4; c++) if (RNG.float() < 0.16 && !torps.some(t => t.c === c && t.r === H[c] - 1)) torps.push({ c, r: H[c] - 1, m: 1, n: 2 });
          torps.forEach(t => { g[t.c][t.r] = wolf ? { ...TORP, n: t.n, t: '×' + t.n, c: 'xways' } : { ...TORP, m: t.m, t: 'x' + t.m, c: 'sticky' }; });
          await rt.spin(g, { tease: false });
          if (!wolf) periscope(g);
          await rt.drop(g);
          if (torps.length) rt.msg(`🚀 ${torps.length} torpedo${torps.length > 1 ? 's' : ''} subindo!`);
          const res = ways(g, SY, { wildMult: 'add' });
          await pay(rt, res);
          // Silent Hunter: ganho com periscópio lança um torpedo no fundo de um rolo livre
          if (!wolf && res.total && [...res.cells].some(k => { const [c, r] = K.unkey(k); return g[c][r].id === 'w'; })) {
            const free = [1, 2, 3, 4].filter(c => !torps.some(t => t.c === c && t.r === H[c] - 1));
            if (free.length) { const c = RNG.pick(free); torps.push({ c, r: H[c], m: 0, n: 1 }); rt.msg(`🔭 Periscópio acertou: torpedo lançado no rolo ${c + 1}!`); rt.fx('rise'); }
          }
          const s2 = count(g, x => x.sc);
          if (s2) api.add(2 * s2);
        }, { title: wolf ? 'WOLF PACK SPINS' : 'SILENT HUNTER', sub: wolf ? 'Torpedos xWays de x2 a x9' : 'Rolo 3 com 8 casas · periscópio lança torpedos' });
      },
    }));
  })();

  /* =========================================================
     7. Bloco de Celas (Folsom Prison) — baratas abrem as celas
     ========================================================= */
  (() => {
    const SY = [
      S('detento', 'zipper', 'Detento', [2, 6, 20], 3), S('guarda', 'guard', 'Guarda', [1.5, 4, 15], 3), S('chave', 'door', 'Porta', [1, 3, 10], 4),
      S('corrente', 'spoon', 'Colher', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const NEST = { id: 'w', img: 'cockroach', name: 'Ninho de baratas', wild: true, nest: true, w: 0.5, fw: 0.8 };
    const SC = { id: 'sc', img: 'alarm', name: 'Alarme', sc: true, w: 0.95, fw: 0 };
    const all = [...SY, NEST, SC];
    const draw = pool(all);
    const H = [4, 6, 6, 6, 4];
    const lockedAt = (c, r, big) => (big ? (c === 0 || c === 4 ? false : r === 0 || r === 5) : (c === 0 || c === 4 ? r === 0 || r === 3 : r === 0 || r === 5));
    const make = (wk = 'w', big = false) => grid(H, (c, r) => (lockedAt(c, r, big) ? LOCK() : draw(c, wk)));
    function roach(g, c0, r0, fs) {
      let c = c0, r = r0;
      const steps = fs ? RNG.int(6, 12) : RNG.int(4, 8);
      for (let i = 0; i < steps; i++) {
        const opts = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([a, b]) => g[a] && g[a][b]);
        [c, r] = RNG.pick(opts);
        const x = g[c][r];
        if (x.id === 'lock') g[c][r] = { ...draw(c), fresh: true };
        const y = g[c][r];
        if (!y.sc) { y.m = Math.min(10, (y.m || 1) + 1); y.t = 'x' + y.m; y.c = (y.c ? y.c + ' ' : '') + 'roach'; }
      }
    }
    async function play(rt, g, guaranteed) {
      let nests = cells(g, x => x.nest);
      for (let i = nests.length; i < guaranteed; i++) { const open = cells(g, x => x.id !== 'lock' && !x.sc && !x.wild); const [c, r] = RNG.pick(open); g[c][r] = { ...NEST }; }
      nests = cells(g, x => x.nest);
      if (nests.length) {
        nests.forEach(([c, r]) => roach(g, c, r, guaranteed > 0));
        rt.msg(`🪳 ${nests.length} barata${nests.length > 1 ? 's' : ''} andando: celas abertas e multiplicadores!`);
        rt.fx('big');
        await rt.drop(g);
      }
      await pay(rt, ways(g, SY));
    }
    App.register(K.create({
      id: 'blococelas', name: 'Bloco de Celas', studio: STUDIO, art: 'cockroach', mascot: 'police',
      tag: 'Baratas abrem celas · até 75.000x', colors: ['#57534e', '#ca8a04'], bg: 'linear-gradient(180deg,#1c1917,#292524 60%,#0c0a09)',
      cols: 5, rows: 6, maxWin: 75000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Folsom Prison" (Nolimit City).', hello: 'As baratas sabem onde estão as chaves...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Começa em 2-4-4-4-2 (128 caminhos) e as celas abertas aumentam os caminhos (até 4-6-6-6-4).')],
      highlights: ['⛓️ Rolos <b>2-4-4-4-2</b> com celas trancadas acima e abaixo (até <b>4-6-6-6-4</b>)', '🪳 <b>Ninho de baratas</b> vira coringa e solta uma barata que anda pela grade', 'Cada casa que a barata pisa ganha <b>+1 de multiplicador</b> (até x10) e cada cela que ela encontra <b>abre</b>', '🔒 3 scatters = <b>Walk the Line</b> (1 barata garantida) · 4 = <b>The Chair</b> (grade maior e 3 baratas)', 'Prêmio máximo: <b>75.000x</b>'],
      how: '<p>Rolos <b>2-4-4-4-2</b> visíveis; as outras casas são <b>celas trancadas</b>. 🪳 O <b>ninho de baratas</b> é coringa e libera uma barata que anda de 4 a 8 casas: cada casa pisada ganha +1 de multiplicador (até x10) e cada cela encontrada <b>abre</b>.</p>',
      features: '<ul class="si-list"><li>🔒 <b>3 scatters — Walk the Line:</b> 8 giros com pelo menos <b>1 barata</b> por giro.</li><li>🔒 <b>4+ scatters — The Chair:</b> 8 giros na grade <b>4-4-4-4-4</b> com <b>3 baratas</b> garantidas.</li></ul>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, 0);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const chair = sc >= 4;
        await rt.fsLoop(8, async () => { const g = make('fw', chair); await rt.spin(g, { tease: false }); await play(rt, g, chair ? 3 : 1); }, { title: chair ? 'THE CHAIR' : 'WALK THE LINE', sub: chair ? '3 baratas por giro' : '1 barata garantida' });
      },
    }));
  })();

  /* =========================================================
     8. Sangue e Sombra (Blood & Shadow) — Barra do Ritual
     ========================================================= */
  (() => {
    const HI = [S('vampiro', 'vampire', 'Vampiro', [2, 6, 20], 3), S('bruxa', 'mage', 'Bruxa', [1.5, 4, 15], 3), S('vela', 'grimoire', 'Grimório', [1, 3, 10], 4), S('rosa', 'wilted', 'Rosa murcha', [0.8, 2, 8], 4)];
    const LO = SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]);
    const WILD = { id: 'w', img: 'blooddrop', name: 'Coringa', wild: true, w: 0.55 };
    const SC = { id: 'sc', img: 'web', name: 'Ritual', sc: true, w: 0.45, fw: 0.3 };
    const SY = [...HI, ...LO];
    const all = [...SY, WILD, SC];
    const mkPool = list => pool([...list, WILD, SC]);
    const draw = mkPool(SY);
    const make = (d = draw, rows = 4) => grid([rows, rows, rows, rows, rows], c => d(c));
    App.register(K.create({
      id: 'sanguesombra', name: 'Sangue e Sombra', studio: STUDIO, art: 'blooddrop', mascot: 'bat',
      tag: 'Barra do Ritual · giros amaldiçoados', colors: ['#7f1d1d', '#1e1b4b'], bg: 'linear-gradient(180deg,#1c0505,#2e1065 60%,#020617)',
      cols: 5, rows: 5, maxWin: 6666, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Blood & Shadow" (Nolimit City).', hello: 'O ritual transforma os baixos em altos...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos com cascata (5×5 = 3.125 nos giros amaldiçoados).')],
      highlights: ['🕯️ 5×4 com <b>1.024 caminhos</b> e cascata', '🕸️ 3+ scatters = <b>6 Candle Spins</b>', '🩸 Cada ganho enche a <b>Barra do Ritual</b>: a cada nível um símbolo baixo vira <b>alto amaldiçoado</b> e você ganha <b>+2 giros</b>', 'No nível 5: <b>+6 Giros Amaldiçoados</b> na grade 5×5 só com símbolos altos e <b>coringas presos</b>', 'Prêmio máximo: <b>6.666x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>1.024 caminhos</b>. Os vencedores somem e novos caem (<b>cascata</b>). 🩸 é coringa.</p>',
      features: '<p>🕸️ <b>3 ou mais scatters</b> dão <b>6 Candle Spins</b>. Cada símbolo eliminado enche a <b>Barra do Ritual</b> (30 por nível). A cada nível, o símbolo baixo mais fraco que restar é <b>trocado por um alto</b> e você ganha <b>+2 giros</b> (até o nível 4).</p><p>No <b>nível 5</b> o ritual se completa: você ganha <b>+6 giros</b> e todos os que sobram viram <b>Giros Amaldiçoados</b>, com uma linha extra (5×5, 3.125 caminhos), só símbolos altos e <b>coringas presos</b>: todo coringa que cair fica no lugar até o fim do bônus.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await tumble(rt, g, { draw: c => draw(c), evaluate: gg => ways(gg, SY) });
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let lows = LO.slice(), bar = 0, level = 0;
        let d = mkPool([...HI, ...lows]);
        const stuck = new Map();
        rt.chip('ritual', 'RITUAL', 'Nv 0');
        await rt.fsLoop(6, async api => {
          const cursed = level >= 5;
          const g = cursed ? make(mkPool(HI), 5) : make(d);
          // giros amaldiçoados: os coringas ficam presos até o fim
          stuck.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...x }; });
          await rt.spin(g, { tease: false });
          await tumble(rt, g, {
            draw: c => (cursed ? mkPool(HI) : d)(c),
            evaluate: gg => ways(gg, SY),
            keep: cursed ? (x => !!x.wild) : null,
            onStep: async (s, gg, res) => {
              bar += res.cells.size;
              while (bar >= 30 && level < 5) {
                bar -= 30;
                level++;
                if (level <= 4 && lows.length) { const gone = lows.pop(); lows = lows.slice(); d = mkPool([...HI, ...lows]); rt.msg(`🩸 Ritual nível ${level}: ${gone.name} sai das fitas! +2 giros`); api.add(2, true); }
                if (level === 5) { rt.msg('🩸 RITUAL COMPLETO! +6 giros amaldiçoados com coringas presos'); api.add(6, true); }
                rt.fx('big');
              }
              rt.chip('ritual', 'RITUAL', `Nv ${level} · ${bar}/30`);
            },
          });
          if (cursed) cells(g, x => x.wild).forEach(([c, r]) => stuck.set(key(c, r), { ...g[c][r], c: 'sticky', fresh: false }));
        }, { title: 'CANDLE SPINS', sub: '6 giros · encha o ritual' });
        rt.chip('ritual', null);
      },
    }));
  })();

  /* =========================================================
     9. Gulag Gelado (Remember Gulag) — rolos 5 e 6 trancados
     ========================================================= */
  (() => {
    const CH = [S('general', 'snowman', 'Boneco de neve', [2, 5, 15, 40], 3), S('urso', 'bear', 'Urso', [1.5, 4, 10, 30], 3), S('prisioneiro', 'coldface', 'Prisioneiro', [1, 3, 8, 20], 4), S('guarda', 'matryoshka', 'Matrioska', [0.8, 2, 6, 15], 4)];
    const SY = [...CH, ...SUITS([[0.2, 0.5, 1.5, 4], [0.2, 0.5, 1.5, 4], [0.15, 0.4, 1, 3], [0.15, 0.4, 1, 3]])];
    const WILD = { id: 'w', img: 'snowflake', name: 'Coringa', wild: true, reels: [1, 2, 3, 4, 5], w: 0.5 };
    const SC = { id: 'sc', img: 'ice', name: 'Scatter', sc: true, reels: [0, 1, 2, 3], w: 0.95 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    // nas rodadas grátis os personagens caem o dobro
    CH.forEach(x => { x.fw = x.w * 2; });
    const make = (open = 4, wk = 'w') => grid([4, 4, 4, 4, 4, 4], c => (c >= open ? LOCK() : draw(c, wk)));
    // Gulag: 1 personagem sorteado · All Aboard: os 4 · Double Vodka: os 4 com o multiplicador dobrado
    const TIERS = { 3: { s: [10, 12, 15], m: [5, 10, 20], all: false }, 4: { s: [10, 12, 15], m: [3, 5, 8], all: true }, 5: { s: [10, 12, 15], m: [6, 10, 16], all: true } };
    App.register(K.create({
      id: 'gulaggelado', name: 'Gulag Gelado', studio: STUDIO, art: 'snowflake', mascot: 'bear',
      tag: 'Scatters destrancam rolos', colors: ['#0284c7', '#b91c1c'], bg: 'linear-gradient(180deg,#e0f2fe,#7dd3fc 40%,#0c4a6e)',
      cols: 6, rows: 4, maxWin: 30000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Remember Gulag" (Nolimit City).', hello: 'Rolos 5 e 6 estão trancados...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = até 4.096 caminhos com os rolos 5 e 6 abertos.')],
      highlights: ['🧊 6 rolos, mas os <b>rolos 5 e 6 começam trancados</b>', '❄️ 1 scatter destranca o rolo 5; 2 destrancam o rolo 6', '3 scatters = <b>Gulag</b> (1 personagem sorteado multiplicado) · 4 = <b>All Aboard</b> (os 4) · 5 = <b>Double Vodka</b> (os 4 com multiplicador dobrado)', 'Prêmio máximo: <b>30.000x</b>'],
      how: '<p>Grade <b>6×4</b>, com os <b>rolos 5 e 6 trancados</b>. Cada scatter (só cai nos rolos 1 a 4) <b>destranca</b> um rolo: 1 scatter abre o 5º, 2 abrem o 6º. ❄️ é coringa.</p>',
      features: '<p>🧊 <b>3, 4 ou 5 scatters</b> abrem os <b>Gulag Spins</b>, com todos os rolos abertos. Os personagens caem <b>o dobro</b> e uma roda de preparação sorteia os <b>giros</b> e um <b>multiplicador</b> para os personagens (Boneco de neve, Urso, Prisioneiro e Matrioska):</p><ul class="si-list"><li><b>3 — Gulag:</b> só <b>um personagem sorteado</b> recebe o multiplicador.</li><li><b>4 — All Aboard:</b> os <b>4 personagens</b> recebem o multiplicador.</li><li><b>5 — Double Vodka:</b> os 4 personagens com o multiplicador <b>dobrado</b>.</li></ul><p class="muted small">A compra do bônus sorteia o nível com as mesmas chances do jogo normal.</p><table class="paytable"><tr class="si-head"><td>Scatters</td><td>Giros</td><td>Multiplicador</td></tr>' + Object.entries(TIERS).map(([k, t]) => `<tr><td>${k}</td><td>${t.s.join(' / ')}</td><td>${t.m.map(m => 'x' + m).join(' / ')}</td></tr>`).join('') + '</table>',
      make: () => make(),
      async spin(rt) {
        const g = make(6);
        const sc = count(g.slice(0, 4), x => x.sc);
        const open = 4 + Math.min(2, sc);
        for (let c = open; c < 6; c++) g[c] = g[c].map(LOCK);
        await rt.spin(g);
        if (sc) rt.msg(`🧊 ${sc} scatter${sc > 1 ? 's' : ''}: ${sc >= 2 ? 'rolos 5 e 6 destrancados' : 'rolo 5 destrancado'}!`);
        await pay(rt, ways(g, SY));
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = RNG.weighted([{ v: 3, w: 88 }, { v: 4, w: 10 }, { v: 5, w: 2 }]).v;
        const T = TIERS[Math.min(5, sc)];
        const si = RNG.int(0, 2), mi = RNG.int(0, 2);
        await rt.reveal('GULAG SPINS: GIROS', T.s.map(s => ({ img: 'ice', t: s + ' giros' })), si);
        await rt.reveal(T.all ? 'MULTIPLICADOR DOS PERSONAGENS' : 'MULTIPLICADOR DO PERSONAGEM', T.m.map(m => ({ img: 'bear', t: 'x' + m })), mi);
        const M = T.m[mi];
        // no Gulag só um personagem sorteado é promovido
        let up = CH;
        if (!T.all) { const ci = RNG.int(0, CH.length - 1); await rt.reveal('PERSONAGEM PROMOVIDO', CH.map(c => ({ img: c.img, t: c.name })), ci); up = [CH[ci]]; }
        const boosted = SY.map(s => (up.includes(s) ? { ...s, pays: s.pays.map(p => p * M) } : s));
        rt.chip('mult', T.all ? 'PERSON.' : up[0].name.toUpperCase(), 'x' + M);
        await rt.fsLoop(T.s[si], async () => {
          const g = make(6, 'fw').map(col => col.map(x => (x.sc ? RNG.pick(SY) : x)));
          await rt.spin(g, { tease: false });
          await pay(rt, ways(g, boosted));
        }, { title: sc >= 5 ? 'DOUBLE VODKA' : sc === 4 ? 'ALL ABOARD' : 'GULAG SPINS', sub: `${T.s[si]} giros · ${T.all ? 'personagens' : up[0].name} x${M}` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     10. Detetive Serial (Serial) — Enhancer Cells
     ========================================================= */
  (() => {
    const SY = [
      S('detetive', 'detective', 'Detetive', [2, 6, 20], 3), S('policial', 'policecar', 'Viatura', [1.5, 4, 15], 3), S('lupa', 'magnifier', 'Lupa', [1, 3, 10], 4),
      S('camera', 'videocam', 'Câmera', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'namebadge', name: 'Coringa', wild: true, w: 0.55 };
    const SC = { id: 'sc', img: 'footprints', name: 'Pegadas', sc: true, w: 0.95 };
    const SPLIT = { id: 'xs', img: 'scissors', name: 'Coringa xSplit', wild: true, w: 0 };
    const all = [...SY, WILD, SC, SPLIT];
    const draw = pool(all);
    const ENH = [{ e: 'nada', w: 62 }, { e: 'xways', w: 18 }, { e: 'wild', w: 12 }, { e: 'nudge', w: 6 }, { e: 'char', w: 2 }];
    /** Abre uma Enhancer Cell (fica no topo dos rolos 2 a 4). */
    const openCell = (g, c, r, H) => {
      const e = RNG.weighted(ENH).e;
      if (e === 'nada') return { id: 'enh', img: 'notepad', c: 'empty', noPay: true };
      if (e === 'xways') { const s = RNG.pick(SY.slice(0, 4)), n = RNG.int(2, 4); return { ...s, n, t: '×' + n, c: 'xways' }; }
      if (e === 'wild') return { ...WILD, c: 'xways' };
      if (e === 'char') return { ...RNG.pick(SY.slice(0, 2)), c: 'xways' };
      const m = 1 + RNG.int(0, H - 1);
      return { ...WILD, m, t: 'x' + m, c: 'duel', nudge: true };
    };
    async function play(rt, g, extra, sticky, kill) {
      for (let c = 1; c <= 3; c++) for (let r = 0; r < extra; r++) {
        const k = key(c, r);
        if (sticky && sticky.has(k)) { g[c][r] = sticky.get(k); continue; }
        const x = openCell(g, c, r, g[c].length);
        g[c][r] = { ...x, fresh: true };
        if (sticky && x.id !== 'enh') sticky.set(k, { ...x, fresh: false });
      }
      // The Kill: um coringa xSplit em todo giro, que divide a linha dele (tudo conta em dobro)
      if (kill) {
        const c0 = RNG.int(1, 3), r0 = RNG.int(extra, g[c0].length - 1), row = r0 - extra;
        g.forEach((col, c) => { const r = c >= 1 && c <= 3 ? row + extra : row, x = col[r]; if (x && !x.sc && x.id !== 'enh') col[r] = { ...x, n: (x.n || 1) * 2, t: '×' + (x.n || 1) * 2, c: 'fire', fresh: true }; });
        g[c0][r0] = { ...SPLIT, t: 'xSplit', c: 'fire', fresh: true };
        rt.msg('🔪 xSplit: a linha inteira se divide!');
      }
      for (let c = 1; c <= 3; c++) { const nd = g[c].find(x => x.nudge); if (nd) fillReel(g, c, { ...nd }); }
      await rt.drop(g);
      await pay(rt, ways(g, SY, { wildMult: 'add' }));
    }
    App.register(K.create({
      id: 'detetiveserial', name: 'Detetive Serial', studio: STUDIO, art: 'detective', mascot: 'detective',
      tag: 'Enhancer Cells · até 74.800x', colors: ['#1e293b', '#dc2626'], bg: 'linear-gradient(180deg,#0f172a,#1e1b4b 60%,#020617)',
      cols: 5, rows: 5, maxWin: 74800, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Serial" (Nolimit City), com tema de investigação policial.', hello: 'Cada pista abre uma Enhancer Cell...',
      symbols: all, extraSprites: ['notepad'],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×3 = 243 caminhos, mais as Enhancer Cells no topo dos rolos 2 a 4.')],
      highlights: ['🔎 5×3 com <b>243 caminhos</b> e <b>Enhancer Cells</b> no topo dos rolos 2 a 4', 'Cada célula pode revelar <b>xWays</b> (2 a 4 cópias), <b>coringa</b>, <b>xNudge</b> (rolo inteiro com multiplicador) ou personagem', '👣 3 pegadas = <b>The Search</b>: rodadas grátis com <b>mais células</b> (3-5-5-5-3) que <b>ficam abertas</b>', '🔪 4+ pegadas = <b>The Kill</b>: tudo isso e um <b>coringa xSplit</b> garantido em todo giro', 'Prêmio máximo: <b>74.800x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>243 caminhos</b>. Acima dos rolos 2, 3 e 4 há uma <b>Enhancer Cell</b> que abre em todo giro e pode revelar: <b>xWays</b> (2 a 4 cópias de um símbolo), <b>coringa</b>, <b>xNudge</b> (o rolo inteiro vira coringa com multiplicador) ou um personagem.</p>',
      features: '<p>👣 <b>3, 4 ou 5 pegadas</b> abrem as rodadas grátis: cada pegada mostra de 2 a 4 giros e você ganha a soma. A grade cresce para <b>3-5-5-5-3</b> (duas Enhancer Cells por rolo do meio) e toda célula revelada <b>fica aberta</b> até o fim. Multiplicadores de coringas na mesma combinação se somam.</p><ul class="si-list"><li><b>3 pegadas — The Search:</b> as células abertas fazem o trabalho.</li><li><b>4 ou 5 pegadas — The Kill:</b> em <b>todo giro</b> cai um <b>coringa xSplit</b> nos rolos 2 a 4, que divide a linha dele: todos os símbolos dela contam em dobro.</li></ul><p class="muted small">A compra do bônus sorteia o nível com as mesmas chances do jogo normal.</p>',
      make: () => grid([3, 4, 4, 4, 3], (c, r) => (c >= 1 && c <= 3 && r === 0 ? { id: 'enh', img: 'notepad', c: 'empty', noPay: true } : draw(c))),
      async spin(rt) {
        const g = grid([3, 4, 4, 4, 3], c => draw(c));
        await rt.spin(g);
        await play(rt, g, 1, null);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = RNG.weighted([{ v: 3, w: 91 }, { v: 4, w: 8 }, { v: 5, w: 1 }]).v;
        const kill = sc >= 4;
        let n = 0;
        for (let i = 0; i < sc; i++) n += RNG.int(2, 4);
        const sticky = new Map();
        await rt.fsLoop(n, async () => {
          const g = grid([3, 5, 5, 5, 3], c => draw(c)).map(col => col.map(x => (x.sc ? RNG.pick(SY) : x)));
          await rt.spin(g, { tease: false });
          await play(rt, g, 2, sticky, kill);
        }, { title: kill ? 'THE KILL' : 'THE SEARCH', sub: kill ? `${n} giros · xSplit em todo giro` : `${n} giros · células abertas ficam` });
      },
    }));
  })();
})();
