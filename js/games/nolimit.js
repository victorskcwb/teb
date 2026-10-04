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
  const SUITS = (pays, w = [8, 8, 9, 9]) => [
    S('as', 'spade', 'Espadas', pays[0], w[0]), S('copas', 'heartsuit', 'Copas', pays[1], w[1]),
    S('ouros', 'diamondsuit', 'Ouros', pays[2], w[2]), S('paus', 'clubsuit', 'Paus', pays[3], w[3]),
  ];
  const LOCK = () => ({ id: 'lock', img: 'locked', name: 'Bloqueado', c: 'locked', noPay: true });
  /** xNudge: coringa alto que empurra até cobrir o rolo; cada empurrão soma +1. */
  const nudge = (WILD, hgt, extra = 0) => { const n = RNG.int(0, hgt - 1); return { n, m: 1 + n + extra }; };
  const fillReel = (g, c, cell) => { g[c] = g[c].map(x => (x && x.id === 'lock' ? x : { ...cell, fresh: true })); };

  /* =========================================================
     1. Manicômio (Mental) — xWays, Fire Frames (xSplit)
     ========================================================= */
  (() => {
    const SY = [
      S('paciente', 'zombie', 'Paciente', [2, 6, 25], 3), S('fantasma', 'ghost', 'Fantasma', [1.5, 5, 18], 3), S('cerebro', 'brain', 'Cérebro', [1, 3, 12], 4),
      S('seringa', 'syringe', 'Seringa', [0.8, 2.5, 8], 4), S('pilula', 'pill', 'Pílula', [0.6, 2, 6], 5), ...SUITS([[0.3, 0.8, 3], [0.3, 0.8, 3], [0.2, 0.6, 2], [0.2, 0.6, 2]], [6, 6, 7, 7]),
    ];
    const WILD = { id: 'w', img: 'skull', name: 'xNudge', wild: true, reels: [1, 2, 3], w: 0.5 };
    const XW = { id: 'xw', img: 'eye', name: 'xWays', xw: true, w: 0.55, fw: 0.9 };
    const SC = { id: 'sc', img: 'spider', name: 'Escorpião', sc: true, w: 0.95, fw: 0 };
    const all = [...SY, WILD, XW, SC];
    const draw = pool(all);
    const H = [2, 3, 3, 3, 2];
    const make = (wk = 'w') => grid(H, c => draw(c, wk));
    async function play(rt, g, fs, st) {
      // xWays revela 2 a 4 cópias de um símbolo
      let rev = 0;
      g.forEach((col, c) => col.forEach((x, r) => { if (x.xw) { const s = RNG.pick(SY.slice(0, 5)), n = RNG.int(2, 4); rev += n; g[c][r] = { ...s, n, t: '×' + n, c: 'xways', fresh: true }; } }));
      // Fire Frames: posições pegam fogo e se dividem (contam em dobro)
      if (RNG.float() < (fs ? 1 : 0.12)) {
        const k = RNG.int(1, fs ? 6 : 5), pos = RNG.shuffle(cells(g, x => !x.sc && !x.wild));
        pos.slice(0, k).forEach(([c, r]) => { const x = g[c][r]; g[c][r] = { ...x, n: (x.n || 1) * 2, t: '×' + (x.n || 1) * 2, c: 'fire', fresh: true }; });
        rt.msg(`🔥 Fire Frames: ${Math.min(k, pos.length)} posições se dividiram!`);
      }
      // xNudge no rolo inteiro
      for (let c = 1; c <= 3; c++) if (g[c].some(x => x.wild)) { const nd = nudge(WILD, H[c]); fillReel(g, c, { ...WILD, m: nd.m, t: 'x' + nd.m, c: 'duel' }); }
      await rt.drop(g);
      if (st) { st.m += rev; rt.chip('mult', 'MULT.', 'x' + st.m); }
      await pay(rt, ways(g, SY), st ? st.m : 1);
    }
    App.register(K.create({
      id: 'manicomio', name: 'Manicômio', studio: STUDIO, art: 'brain', mascot: 'zombie',
      tag: 'xWays · Fire Frames · até 66.666x', colors: ['#7f1d1d', '#334155'], bg: 'linear-gradient(180deg,#1c1917,#292524 60%,#450a0a)',
      cols: 5, rows: 3, cellH: 1.2, maxWin: 66666, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Mental" (Nolimit City).', hello: 'Os símbolos se dividem...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 2-3-3-3-2 = 108 caminhos, que multiplicam com xWays e Fire Frames.')],
      highlights: ['🧠 Rolos <b>2-3-3-3-2</b> (108 caminhos) que explodem com xWays', '👁️ <b>xWays</b> revela 2 a 4 cópias de um símbolo na mesma casa', '🔥 <b>Fire Frames</b> incendeiam casas que <b>se dividem</b> (contam em dobro)', '🦂 3 escorpiões = <b>Autópsia</b>: 8 giros com fogo em todo giro e multiplicador que soma cada xWays', 'Prêmio máximo: <b>66.666x</b>'],
      how: '<p>Rolos <b>2-3-3-3-2</b> com 108 caminhos. ☠️ <b>xNudge</b> (rolos 2 a 4) cobre o rolo inteiro e cada empurrão soma +1 no multiplicador.</p><p>👁️ <b>xWays</b> vira de 2 a 4 cópias do mesmo símbolo, multiplicando os caminhos. 🔥 <b>Fire Frames</b> divide casas aleatórias em duas.</p>',
      features: '<p>🦂 <b>3 escorpiões</b> dão <b>8 giros de Autópsia</b>: Fire Frames em <b>todo</b> giro e um multiplicador global que começa em x1 e <b>soma o número de cópias</b> de cada xWays revelado, sem zerar.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false, null);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const st = { m: 1 };
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(8, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, true, st); }, { title: 'AUTÓPSIA', sub: 'Fogo em todo giro' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     2. Cela xWays (San Quentin xWays) — Razor Split e coringas que pulam
     ========================================================= */
  (() => {
    const SY = [
      S('chefe', 'police', 'Guarda', [2, 6, 25], 3), S('detento', 'ogre', 'Detento', [1.5, 5, 18], 3), S('corrente', 'chains', 'Corrente', [1, 3, 12], 4),
      S('chave', 'key', 'Chave', [0.8, 2.5, 8], 4), ...SUITS([[0.3, 0.8, 3], [0.3, 0.8, 3], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'policelight', name: 'Coringa', wild: true, reels: [1, 2, 3], w: 0.7, fw: 0.6 };
    const XW = { id: 'xw', img: 'eye', name: 'xWays', xw: true, w: 0.45 };
    const SC = { id: 'sc', img: 'locked', name: 'Lockdown', sc: true, w: 0.95, fw: 0 };
    const all = [...SY, WILD, XW, SC];
    const draw = pool(all);
    const make = (wk = 'w') => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function prep(rt, g) {
      g.forEach((col, c) => col.forEach((x, r) => { if (x.xw) { const s = RNG.pick(SY.slice(0, 4)), n = RNG.int(2, 4); g[c][r] = { ...s, n, t: '×' + n, c: 'xways', fresh: true }; } }));
      if (RNG.float() < 0.1) { const c = RNG.int(1, 3); g[c] = g[c].map(x => ({ ...x, n: (x.n || 1) * 2, t: '×' + (x.n || 1) * 2, c: 'fire', fresh: true })); rt.msg(`🔪 Razor Split no rolo ${c + 1}!`); }
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
      how: '<p>Grade <b>5×3</b> com <b>243 caminhos</b>. 🚨 é coringa (rolos 2 a 4).</p><p>👁️ <b>xWays</b> revela 2 a 4 cópias de um símbolo. 🔪 <b>Razor Split</b> corta um rolo inteiro ao meio e dobra seus símbolos.</p>',
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
      S('xerife', 'cowboy', 'Xerife', [3, 10, 40], 3), S('caixao', 'coffin', 'Caixão', [2, 6, 25], 3), S('pistola', 'pistol', 'Revólver', [1.5, 4, 15], 4),
      S('cacto', 'cactus', 'Cacto', [1, 3, 10], 4), S('whisky', 'tumbler', 'Whisky', [0.8, 2, 8], 5), ...SUITS([[0.4, 1, 4], [0.4, 1, 4], [0.3, 0.8, 3], [0.3, 0.8, 3]], [7, 7, 8, 8]),
    ];
    const WILD = { id: 'w', img: 'crossbones', name: 'xNudge', wild: true, reels: [1, 2, 3], w: 0.55, fw: 0.8 };
    const SPLIT = { id: 'split', img: 'collision', name: 'xSplit', wild: true, reels: [4], w: 0.9 };
    const SC = { id: 'sc', img: 'headstone', name: 'Lápide', sc: true, reels: [0, 1, 2, 3], w: 1.25, fw: 0 };
    const all = [...SY, WILD, SPLIT, SC];
    const draw = pool(all);
    const H = [2, 3, 3, 3, 1];
    const make = (wk = 'w') => grid(H, c => draw(c, wk));
    async function play(rt, g, sticky) {
      for (let c = 1; c <= 3; c++) {
        const has = g[c].some(x => x.id === 'w');
        if (!has && !(sticky && sticky[c])) continue;
        let m = sticky && sticky[c] ? sticky[c] : 0;
        if (has) m += nudge(WILD, 3).m;
        if (sticky) sticky[c] = m;
        fillReel(g, c, { ...WILD, m, t: 'x' + m, c: 'duel' });
      }
      if (g[4][0].id === 'split') {
        g[4][0] = { ...SPLIT, n: 2, t: 'xSplit' };
        for (let c = 1; c <= 3; c++) if (g[c][0].c === 'duel') g[c] = g[c].map(x => ({ ...x, m: x.m * 2, t: 'x' + x.m * 2 }));
        rt.msg('💥 xSplit! Os multiplicadores xNudge dobram');
      }
      if (sticky) rt.head(H.map((_, c) => (sticky[c] ? 'x' + sticky[c] : '')));
      await rt.drop(g);
      // no jogo base rolos diferentes se multiplicam; nas grátis (rolos presos) se somam
      await pay(rt, ways(g, SY, { wildMult: sticky ? 'add' : 'mul' }));
    }
    App.register(K.create({
      id: 'lapiderip', name: 'Lápide RIP', studio: STUDIO, art: 'headstone', mascot: 'cowboy',
      tag: 'Volatilidade insana · até 300.000x', colors: ['#78350f', '#1c1917'], bg: 'linear-gradient(180deg,#451a03,#292524 60%,#0c0a09)',
      cols: 5, rows: 3, cellH: 1.2, maxWin: 300000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Tombstone R.I.P." (Nolimit City).', hello: 'O faroeste mais perigoso que existe.',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 2-3-3-3-1: 54 caminhos (108 com xSplit). Multiplicadores de rolos diferentes se multiplicam.')],
      highlights: ['🪦 Rolos <b>2-3-3-3-1</b> e volatilidade insana', '☠️ <b>xNudge</b> (rolos 2 a 4): cada empurrão soma +1 no multiplicador; rolos diferentes <b>se multiplicam</b>', '💥 <b>xSplit</b> no último rolo conta em dobro e <b>dobra</b> todos os xNudge', '3 lápides = <b>10 giros</b> com rolos xNudge presos que continuam crescendo', 'Prêmio máximo: <b>300.000x</b>'],
      how: '<p>Rolos <b>2-3-3-3-1</b>. ☠️ O <b>xNudge</b> empurra até cobrir o rolo e cada empurrão soma +1. Multiplicadores em rolos diferentes <b>se multiplicam</b>.</p><p>💥 O <b>xSplit</b> só cai no último rolo: vale por dois símbolos e dobra os xNudge da tela.</p>',
      features: '<p>🪦 <b>3 lápides</b> dão <b>10 rodadas grátis</b>. Cada rolo xNudge <b>fica preso</b> com seu multiplicador e, se cair outro xNudge nele, os multiplicadores se somam. Nas rodadas grátis os multiplicadores de rolos diferentes numa mesma combinação <b>se somam</b>.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, null);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const sticky = {};
        await rt.fsLoop(10, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, sticky); }, { title: 'BOOTHILL', sub: 'xNudge presos' });
        rt.head(null);
      },
    }));
  })();

  /* =========================================================
     4. Cidade Fantasma (Deadwood) — xNudge que se somam
     ========================================================= */
  (() => {
    const SY = [
      S('xerife', 'cowboy', 'Pistoleira', [2, 6, 20], 3), S('cavalo', 'horse', 'Cavalo', [1.5, 4, 15], 3), S('distintivo', 'star', 'Distintivo', [1, 3, 10], 4),
      S('whisky', 'tumbler', 'Whisky', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'pistol', name: 'Caçador xNudge', wild: true, w: 0.45, fw: 0.7 };
    const SC = { id: 'sc', img: 'cactus', name: 'Bônus', sc: true, w: 0.85, fw: 0 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const H = [3, 4, 4, 4, 3];
    const make = (wk = 'w') => grid(H, c => draw(c, wk));
    async function play(rt, g, sticky, force) {
      if (force && !g.some(col => col.some(x => x.wild))) { const c = RNG.int(0, 4); g[c][RNG.int(0, H[c] - 1)] = { ...WILD }; }
      for (let c = 0; c < 5; c++) {
        const has = g[c].some(x => x.wild);
        if (!has && !(sticky && sticky[c])) continue;
        let m = sticky && sticky[c] ? sticky[c] : 0;
        if (has) m += nudge(WILD, H[c]).m;
        if (sticky) sticky[c] = m;
        fillReel(g, c, { ...WILD, m, t: 'x' + m, c: 'duel' });
      }
      if (sticky) rt.head(H.map((_, c) => (sticky[c] ? 'x' + sticky[c] : '')));
      await rt.drop(g);
      await pay(rt, ways(g, SY, { wildMult: 'add' }));
    }
    App.register(K.create({
      id: 'cidadefantasma', name: 'Cidade Fantasma', studio: STUDIO, art: 'pistol', mascot: 'cowboy',
      tag: 'xNudge somam · caçador ou pistoleiro', colors: ['#a16207', '#44403c'], bg: 'linear-gradient(180deg,#78350f,#57534e 60%,#1c1917)',
      cols: 5, rows: 4, maxWin: 13950, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Deadwood" (Nolimit City).', hello: 'Caçadores empurram os rolos!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 3-4-4-4-3 = 576 caminhos.')],
      highlights: ['🤠 Rolos <b>3-4-4-4-3</b> (576 caminhos)', '🔫 <b>Caçador xNudge</b>: coringa de 4 de altura que sempre empurra até aparecer inteiro; cada empurrão <b>+1</b>', 'Vários xNudge na mesma combinação <b>somam</b> os multiplicadores', '🌵 3 bônus: escolha <b>Caçador</b> (xNudge em todo giro) ou <b>Pistoleiro</b> (xNudge presos que crescem)', 'Prêmio máximo: <b>13.950x</b>'],
      how: '<p>Rolos <b>3-4-4-4-3</b> com <b>576 caminhos</b>. 🔫 O <b>Caçador xNudge</b> pode cair em qualquer rolo: ele empurra até cobrir o rolo e cada empurrão soma +1 no multiplicador. Caçadores na mesma combinação <b>somam</b>.</p>',
      features: '<p>🌵 <b>3 scatters</b> e você escolhe 8 rodadas grátis:</p><ul class="si-list"><li><b>Caçador:</b> pelo menos 1 xNudge garantido em todo giro (o multiplicador zera a cada giro).</li><li><b>Pistoleiro:</b> rolos xNudge ficam presos e cada novo empurrão no mesmo rolo <b>soma</b>.</li></ul>',
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
          { id: 'pistoleiro', img: 'cowboy', label: 'Pistoleiro', desc: 'xNudge presos que crescem' },
        ]);
        const sticky = mode === 'pistoleiro' ? {} : null;
        await rt.fsLoop(8, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, sticky, mode === 'cacador'); }, { title: mode === 'cacador' ? 'GIROS DO CAÇADOR' : 'GIROS DO PISTOLEIRO', sub: '8 giros' });
        rt.head(null);
      },
    }));
  })();

  /* =========================================================
     5. Buraco de Fogo xBomb (Fire in the Hole) — linhas que se abrem
     ========================================================= */
  (() => {
    const SY = [
      S('anao', 'pick', 'Picareta', [1, 2, 4, 8], 3), S('lanterna', 'lantern', 'Lanterna', [0.8, 1.6, 3, 6], 4), S('dinamite', 'firecracker', 'Dinamite', [0.6, 1.2, 2.5, 5], 4),
      S('ouro', 'gem', 'Pepita', [0.5, 1, 2, 4], 5), S('carvao', 'rock', 'Carvão', [0.2, 0.4, 0.8, 1.6], 8), S('martelo', 'hammer', 'Martelo', [0.2, 0.4, 0.8, 1.6], 8),
      S('pa', 'wrench', 'Ferramenta', [0.15, 0.3, 0.6, 1.2], 9),
    ];
    const BOMB = { id: 'w', img: 'bomb', name: 'xBomb', wild: true, bomb: true, w: 0.45 };
    const SC = { id: 'sc', img: 'moneybag', name: 'Vagão', sc: true, w: 0.22 };
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
        if (!res.total) break;
        await pay(rt, res, st.m);
        const rm = new Set(res.cells);
        let boom = 0;
        res.cells.forEach(k => {
          const [c, r] = K.unkey(k);
          if (!g[c][r].bomb) return;
          boom++;
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const y = g[c + a] && g[c + a][r + b]; if (y && y.id !== 'lock') rm.add(key(c + a, r + b)); }
        });
        const before = st.open;
        st.open = Math.min(R, st.open + 1 + boom);
        if (boom) { st.m += boom; rt.chip('mult', 'MULT.', 'x' + st.m); rt.msg(`💣 xBomb! Multiplicador x${st.m}`); rt.fx('boom'); }
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
      highlights: ['⛏️ Grade 6×6 que começa com <b>3 linhas abertas</b>; cada cascata com ganho <b>abre mais uma</b>', '💣 <b>xBomb</b> coringa explode os vizinhos, abre linhas e soma <b>+1 no multiplicador</b> (sem limite)', '🛒 3/4/5 vagões = <b>Lucky Wagon Spins</b> com 2, 3 ou 4 linhas de moedas', 'Prêmio máximo: <b>60.000x</b>'],
      how: '<p>Grade <b>6×6</b>: só as <b>3 linhas de baixo</b> começam abertas. Ganhos em caminhos causam colapso (cascata) e cada colapso <b>desbloqueia uma linha</b> (até 6, 46.656 caminhos).</p><p>💣 <b>xBomb</b> é coringa: ao ganhar ele explode as casas vizinhas, abre mais linhas e o multiplicador global sobe +1 até o fim do giro.</p>',
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
      S('capitao', 'militaryhelmet', 'Capitão', [2, 6, 20], 3), S('navio', 'ship', 'Navio', [1.5, 4, 15], 3), S('ancora', 'anchor', 'Âncora', [1, 3, 10], 4),
      S('bussola', 'compass', 'Bússola', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'telescope', name: 'Periscópio xNudge', wild: true, reels: [1, 2, 3], w: 0.45 };
    const TORP = { id: 'torp', img: 'rocket', name: 'Torpedo', wild: true, reels: [1, 2, 3, 4], w: 0, fw: 0.9 };
    const SC = { id: 'sc', img: 'satellite', name: 'Radar', sc: true, w: 0.65, fw: 0 };
    const all = [...SY, WILD, TORP, SC];
    const draw = pool(all);
    const make = (wk = 'w') => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    App.register(K.create({
      id: 'submarino', name: 'Das Submarino', studio: STUDIO, art: 'ship', mascot: 'militaryhelmet',
      tag: 'Torpedos sobem e multiplicam', colors: ['#1e3a8a', '#0f766e'], bg: 'linear-gradient(180deg,#0c4a6e,#083344 60%,#020617)',
      cols: 5, rows: 4, maxWin: 55200, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Das xBoot" (Nolimit City).', hello: 'O radar procura torpedos...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos.')],
      highlights: ['⚓ 5×4 com <b>1.024 caminhos</b>', '🔭 <b>Periscópio xNudge</b>: coringa de 4 de altura, +1 por empurrão', '📡 3 radares = <b>8 giros</b> com <b>torpedos</b> que nascem embaixo e <b>sobem uma linha por giro</b>, somando +1 no multiplicador', 'Prêmio máximo: <b>55.200x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>1.024 caminhos</b>. 🔭 O <b>periscópio xNudge</b> (rolos 2 a 4) empurra até cobrir o rolo e cada empurrão soma +1. Coringas na mesma combinação somam os multiplicadores.</p>',
      features: '<p>📡 <b>3 radares</b> abrem os <b>Wolf Pack Spins</b> (8 giros). 🚀 <b>Torpedos</b> coringa podem cair nos rolos 2 a 5: eles ficam na tela, <b>sobem uma linha a cada giro</b> e o multiplicador deles cresce +1 a cada subida, até saírem pelo topo.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        for (let c = 1; c <= 3; c++) if (g[c].some(x => x.wild)) { const nd = nudge(WILD, 4); fillReel(g, c, { ...WILD, m: nd.m, t: 'x' + nd.m, c: 'duel' }); }
        await rt.drop(g);
        await pay(rt, ways(g, SY, { wildMult: 'add' }));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let torps = [];
        await rt.fsLoop(8, async () => {
          const g = make('fw').map(col => col.map(x => (x.id === 'torp' || x.id === 'w' ? RNG.pick(SY) : x)));
          torps = torps.map(t => ({ c: t.c, r: t.r - 1, m: t.m + 1 })).filter(t => t.r >= 0);
          // novos torpedos nascem na linha de baixo
          for (let c = 1; c <= 4; c++) if (RNG.float() < 0.16 && !torps.some(t => t.c === c && t.r === 3)) torps.push({ c, r: 3, m: 1 });
          torps.forEach(t => { g[t.c][t.r] = { ...TORP, m: t.m, t: 'x' + t.m, c: 'sticky' }; });
          await rt.spin(g, { tease: false });
          if (torps.length) rt.msg(`🚀 ${torps.length} torpedo${torps.length > 1 ? 's' : ''} subindo!`);
          await pay(rt, ways(g, SY, { wildMult: 'add' }));
        }, { title: 'WOLF PACK SPINS', sub: 'Torpedos sobem a cada giro' });
      },
    }));
  })();

  /* =========================================================
     7. Bloco de Celas (Folsom Prison) — baratas abrem as celas
     ========================================================= */
  (() => {
    const SY = [
      S('detento', 'ogre', 'Detento', [2, 6, 20], 3), S('guarda', 'police', 'Guarda', [1.5, 4, 15], 3), S('chave', 'key', 'Chave', [1, 3, 10], 4),
      S('corrente', 'chains', 'Corrente', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const NEST = { id: 'w', img: 'cockroach', name: 'Ninho de baratas', wild: true, nest: true, w: 0.5, fw: 0.8 };
    const SC = { id: 'sc', img: 'locked', name: 'Scatter', sc: true, w: 0.95, fw: 0 };
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
    const HI = [S('vampiro', 'bat', 'Vampiro', [2, 6, 20], 3), S('bruxa', 'crystal', 'Bola de cristal', [1.5, 4, 15], 3), S('vela', 'candle', 'Vela negra', [1, 3, 10], 4), S('rosa', 'wilted', 'Rosa murcha', [0.8, 2, 8], 4)];
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
      highlights: ['🕯️ 5×4 com <b>1.024 caminhos</b> e cascata', '🕸️ 3+ scatters = <b>6 Candle Spins</b>', '🩸 Cada ganho enche a <b>Barra do Ritual</b>: a cada nível um símbolo baixo vira <b>alto amaldiçoado</b> e você ganha <b>+2 giros</b>', 'No nível 5 começam os <b>Giros Amaldiçoados</b>: grade 5×5 só com símbolos altos', 'Prêmio máximo: <b>6.666x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>1.024 caminhos</b>. Os vencedores somem e novos caem (<b>cascata</b>). 🩸 é coringa.</p>',
      features: '<p>🕸️ <b>3 ou mais scatters</b> dão <b>6 Candle Spins</b>. Cada símbolo eliminado enche a <b>Barra do Ritual</b> (20 por nível). A cada nível, o símbolo baixo mais fraco que restar é <b>trocado por um alto</b> e você ganha <b>+2 giros</b> (até o nível 4).</p><p>No <b>nível 5</b> os giros que sobram viram <b>Giros Amaldiçoados</b>: uma linha extra (5×5, 3.125 caminhos) e só símbolos altos.</p>',
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
        rt.chip('ritual', 'RITUAL', 'Nv 0');
        await rt.fsLoop(6, async api => {
          const cursed = level >= 5;
          const g = cursed ? make(mkPool(HI), 5) : make(d);
          await rt.spin(g, { tease: false });
          await tumble(rt, g, {
            draw: c => (cursed ? mkPool(HI) : d)(c),
            evaluate: gg => ways(gg, SY),
            onStep: async (s, gg, res) => {
              bar += res.cells.size;
              while (bar >= 20 && level < 5) {
                bar -= 20;
                level++;
                if (level <= 4 && lows.length) { const gone = lows.pop(); lows = lows.slice(); d = mkPool([...HI, ...lows]); rt.msg(`🩸 Ritual nível ${level}: ${gone.name} sai das fitas! +2 giros`); api.add(2, true); }
                if (level === 5) rt.msg('🩸 RITUAL COMPLETO! Giros amaldiçoados');
                rt.fx('big');
              }
              rt.chip('ritual', 'RITUAL', `Nv ${level} · ${bar}/20`);
            },
          });
        }, { title: 'CANDLE SPINS', sub: '6 giros · encha o ritual' });
        rt.chip('ritual', null);
      },
    }));
  })();

  /* =========================================================
     9. Gulag Gelado (Remember Gulag) — rolos 5 e 6 trancados
     ========================================================= */
  (() => {
    const CH = [S('general', 'militaryhelmet', 'General', [2, 5, 15, 40], 3), S('urso', 'bear', 'Urso', [1.5, 4, 10, 30], 3), S('prisioneiro', 'ogre', 'Prisioneiro', [1, 3, 8, 20], 4), S('guarda', 'police', 'Guarda', [0.8, 2, 6, 15], 4)];
    const SY = [...CH, ...SUITS([[0.2, 0.5, 1.5, 4], [0.2, 0.5, 1.5, 4], [0.15, 0.4, 1, 3], [0.15, 0.4, 1, 3]])];
    const WILD = { id: 'w', img: 'snowflake', name: 'Coringa', wild: true, reels: [1, 2, 3, 4, 5], w: 0.5 };
    const SC = { id: 'sc', img: 'ice', name: 'Scatter', sc: true, reels: [0, 1, 2, 3], w: 0.95 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const make = (open = 4) => grid([4, 4, 4, 4, 4, 4], c => (c >= open ? LOCK() : draw(c)));
    const TIERS = { 3: { s: [6, 8, 10], m: [3, 5, 8] }, 4: { s: [8, 10, 12], m: [5, 8, 12] }, 5: { s: [10, 12, 15], m: [8, 12, 20] } };
    App.register(K.create({
      id: 'gulaggelado', name: 'Gulag Gelado', studio: STUDIO, art: 'snowflake', mascot: 'bear',
      tag: 'Scatters destrancam rolos', colors: ['#0284c7', '#b91c1c'], bg: 'linear-gradient(180deg,#e0f2fe,#7dd3fc 40%,#0c4a6e)',
      cols: 6, rows: 4, maxWin: 30000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Remember Gulag" (Nolimit City).', hello: 'Rolos 5 e 6 estão trancados...',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = até 4.096 caminhos com os rolos 5 e 6 abertos.')],
      highlights: ['🧊 6 rolos, mas os <b>rolos 5 e 6 começam trancados</b>', '❄️ 1 scatter destranca o rolo 5; 2 destrancam o rolo 6', '3/4/5 scatters = <b>Gulag Spins</b>: um giro de preparação define os giros e um <b>multiplicador</b> para os 4 personagens', 'Prêmio máximo: <b>30.000x</b>'],
      how: '<p>Grade <b>6×4</b>, com os <b>rolos 5 e 6 trancados</b>. Cada scatter (só cai nos rolos 1 a 4) <b>destranca</b> um rolo: 1 scatter abre o 5º, 2 abrem o 6º. ❄️ é coringa.</p>',
      features: '<p>🧊 <b>3, 4 ou 5 scatters</b> abrem os <b>Gulag Spins</b> (normal, All Aboard e Double Vodka). Uma roda de preparação sorteia os <b>giros</b> e um <b>multiplicador</b> que vale para os 4 personagens (General, Urso, Prisioneiro e Guarda). Todos os rolos ficam abertos.</p><table class="paytable"><tr class="si-head"><td>Scatters</td><td>Giros</td><td>Multiplicador</td></tr>' + Object.entries(TIERS).map(([k, t]) => `<tr><td>${k}</td><td>${t.s.join(' / ')}</td><td>${t.m.map(m => 'x' + m).join(' / ')}</td></tr>`).join('') + '</table>',
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
      async bonus(rt, { sc = 3 } = {}) {
        const T = TIERS[Math.min(5, sc)];
        const si = RNG.int(0, 2), mi = RNG.int(0, 2);
        await rt.reveal('GULAG SPINS: GIROS', T.s.map(s => ({ img: 'ice', t: s + ' giros' })), si);
        await rt.reveal('MULTIPLICADOR DOS PERSONAGENS', T.m.map(m => ({ img: 'bear', t: 'x' + m })), mi);
        const M = T.m[mi];
        const boosted = SY.map(s => (CH.includes(s) ? { ...s, pays: s.pays.map(p => p * M) } : s));
        rt.chip('mult', 'PERSON.', 'x' + M);
        await rt.fsLoop(T.s[si], async () => {
          const g = make(6).map(col => col.map(x => (x.sc ? RNG.pick(SY) : x)));
          await rt.spin(g, { tease: false });
          await pay(rt, ways(g, boosted));
        }, { title: sc >= 5 ? 'DOUBLE VODKA' : sc === 4 ? 'ALL ABOARD' : 'GULAG SPINS', sub: `${T.s[si]} giros · personagens x${M}` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     10. Detetive Serial (Serial) — Enhancer Cells
     ========================================================= */
  (() => {
    const SY = [
      S('detetive', 'detective', 'Detetive', [2, 6, 20], 3), S('policial', 'police', 'Policial', [1.5, 4, 15], 3), S('lupa', 'magnifier', 'Lupa', [1, 3, 10], 4),
      S('camera', 'camera', 'Câmera', [0.8, 2, 6], 4), ...SUITS([[0.3, 0.8, 2.5], [0.3, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]]),
    ];
    const WILD = { id: 'w', img: 'policelight', name: 'Coringa', wild: true, w: 0.55 };
    const SC = { id: 'sc', img: 'footprints', name: 'Pegadas', sc: true, w: 0.95 };
    const all = [...SY, WILD, SC];
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
    async function play(rt, g, extra, sticky) {
      for (let c = 1; c <= 3; c++) for (let r = 0; r < extra; r++) {
        const k = key(c, r);
        if (sticky && sticky.has(k)) { g[c][r] = sticky.get(k); continue; }
        const x = openCell(g, c, r, g[c].length);
        g[c][r] = { ...x, fresh: true };
        if (sticky && x.id !== 'enh') sticky.set(k, { ...x, fresh: false });
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
      highlights: ['🔎 5×3 com <b>243 caminhos</b> e <b>Enhancer Cells</b> no topo dos rolos 2 a 4', 'Cada célula pode revelar <b>xWays</b> (2 a 4 cópias), <b>coringa</b>, <b>xNudge</b> (rolo inteiro com multiplicador) ou personagem', '👣 3/4/5 pegadas = rodadas grátis (cada pegada mostra 2 a 4 giros) com <b>mais células</b> (3-5-5-5-3) que <b>ficam abertas</b>', 'Prêmio máximo: <b>74.800x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>243 caminhos</b>. Acima dos rolos 2, 3 e 4 há uma <b>Enhancer Cell</b> que abre em todo giro e pode revelar: <b>xWays</b> (2 a 4 cópias de um símbolo), <b>coringa</b>, <b>xNudge</b> (o rolo inteiro vira coringa com multiplicador) ou um personagem.</p>',
      features: '<p>👣 <b>3, 4 ou 5 pegadas</b> abrem as rodadas grátis: cada pegada mostra de 2 a 4 giros e você ganha a soma. A grade cresce para <b>3-5-5-5-3</b> (duas Enhancer Cells por rolo do meio) e toda célula revelada <b>fica aberta</b> até o fim. Multiplicadores de coringas na mesma combinação se somam.</p>',
      make: () => grid([3, 4, 4, 4, 3], (c, r) => (c >= 1 && c <= 3 && r === 0 ? { id: 'enh', img: 'notepad', c: 'empty', noPay: true } : draw(c))),
      async spin(rt) {
        const g = grid([3, 4, 4, 4, 3], c => draw(c));
        await rt.spin(g);
        await play(rt, g, 1, null);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let n = 0;
        for (let i = 0; i < sc; i++) n += RNG.int(2, 4);
        const sticky = new Map();
        await rt.fsLoop(n, async () => {
          const g = grid([3, 5, 5, 5, 3], c => draw(c)).map(col => col.map(x => (x.sc ? RNG.pick(SY) : x)));
          await rt.spin(g, { tease: false });
          await play(rt, g, 2, sticky);
        }, { title: 'INVESTIGAÇÃO', sub: `${n} giros · células abertas ficam` });
      },
    }));
  })();
})();
