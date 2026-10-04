'use strict';

/* =========================================================
   TaDa Gaming (JILI) — lote 2 (parte 2). Usa os modelos vgame e
   classic3 do tada2.js. RTP calibrado por simulação.
   ========================================================= */
(function () {
  const K = SlotKit, T = SlotT;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const { vgame, classic3, P5, syms5, L5, fsTab } = T.tada;
  const STUDIO = 'tada';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };
  const W = (img, name, extra = {}) => ({ id: 'w', img, name, wild: true, ...extra });

  /* 21. Sacerdotisa Asteca (Aztec Priestess) — 32.400 caminhos, molduras e multiplicador nas grátis */
  App.register(T.pg({
    studio: STUDIO, id: 'sacerdotisaasteca', name: 'Sacerdotisa Asteca', art: 'womanface', mascot: 'feather', tag: '32.400 caminhos · mult. que sobe nas grátis',
    colors: ['#0d9488', '#ca8a04'], bg: 'linear-gradient(180deg,#134e4a,#115e59 50%,#422006)', maxWin: 3000, vol: 3, rtp: '~97%', target: 0.97, cols: 6, rows: 6, cellH: 1,
    intro: 'Inspirado no "Aztec Priestess" (TaDa Gaming).', hello: 'A sacerdotisa abre o templo!',
    syms: T.pgx.mk([['sacerdotisa', 'womanface', 'Sacerdotisa'], ['jaguar', 'leopard', 'Jaguar'], ['idolo', 'moai', 'Ídolo'], ['mascara', 'maskface', 'Máscara'], ['pena', 'feather', 'Pena']], T.pgx.P6),
    wildImg: 'sunface', scImg: 'temple', scName: 'Templo', scW: 0.75, scFW: 0.3, scMin: 4,
    heights: () => [5, 6, 6, 6, 6, 5], gold: [0.05, 0.09], frameReels: [1, 2, 3, 4], stack: 0.3,
    baseM: {}, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 8 + (s - 4) * 2, retrig: s => 2 + (s - 4) * 2,
    highlights: ['🌞 Rolos 5-6-6-6-6-5: <b>32.400 caminhos</b> com cascata', '🖼️ Símbolos com <b>moldura dourada</b> viram coringa quando ganham', '🛕 4+ templos = <b>8 rodadas grátis</b> (+2 por extra) com multiplicador que sobe <b>+1 a cada cascata</b> e não zera', 'Prêmio máximo: <b>3.000x</b>'],
    how: '<p>Rolos 5-6-6-6-6-5 que pagam por caminhos, com cascata.</p>',
    features: `<p>🛕 <b>4 ou mais templos</b> dão <b>8 rodadas grátis</b> (+2 por templo extra). O multiplicador global começa em x1 e sobe a cada cascata, sem zerar. ${T.pgx.goldTxt}</p>`,
  }));

  /* 22. Ás Selvagem (Wild Ace) — combo que cresce e duelo do Ás nas grátis */
  App.register(T.pg({
    studio: STUDIO, id: 'asselvagem', name: 'Ás Selvagem', art: 'heartsuit', mascot: 'jester', tag: '1.024 caminhos · Duelo do Ás',
    colors: ['#7c3aed', '#dc2626'], bg: 'linear-gradient(180deg,#312e81,#4c1d95 50%,#450a0a)', maxWin: 10000, vol: 4, rtp: '~96,5%', target: 0.965, cols: 5, rows: 4, cellH: 1.25,
    intro: 'Inspirado no "Wild Ace" (TaDa Gaming).', hello: 'O Ás selvagem domina a mesa!',
    syms: [S('rei', 'princeman', 'Rei', [0.6, 1.2, 2.5], 4), S('dama', 'princess', 'Dama', [0.5, 1, 2], 4), S('valete', 'man', 'Valete', [0.4, 0.8, 1.6], 5), S('coringa_c', 'jester', 'Bobo', [0.3, 0.6, 1.2], 5), ...['A', 'K', 'Q', 'J'].map((l, i) => K.L(l, [[0.2, 0.4, 0.8], [0.15, 0.3, 0.6], [0.1, 0.25, 0.5], [0.1, 0.2, 0.4]][i], 7 + i))],
    wildImg: 'joker', wildName: 'Ás selvagem', wildW: 0.25, scImg: 'cards', scName: 'Scatter', scW: 0.65, scFW: 0.45,
    heights: () => [4, 4, 4, 4, 4], gold: [0.04, 0.08], frameReels: [1, 2, 3], stack: 0.2,
    baseM: { ladder: [1, 2, 3, 5, 8] }, fsM: { ladder: [2, 4, 6, 10, 16] }, fsCount: () => 8, retrig: () => 4,
    onStep: async (rt, gg, fs, st, res, cell) => {
      // a cada 2 cascatas, um símbolo da tela ganha moldura dourada
      if (st.step % 2) return;
      const opts = cells(gg, x => !x.wild && !x.sc && !x.gold).filter(([c]) => c >= 1 && c <= 3);
      if (!opts.length) return;
      const [c, r] = RNG.pick(opts); gg[c][r] = { ...gg[c][r], gold: true };
    },
    highlights: ['♥️ 5×4 com <b>1.024 caminhos</b> e cascata', '🔥 Combo x1 → x2 → x3 → x5 → <b>x8</b> por cascata (nas grátis até <b>x16</b>)', '✨ A cada 2 cascatas um símbolo ganha <b>moldura dourada</b> (vira coringa ao ganhar)', '🃏 3+ scatters = <b>8 rodadas grátis</b> (+4 com 3)', 'Prêmio máximo: <b>10.000x</b>'],
    how: '<p>Grade 5×4 com 1.024 caminhos e cascata. O multiplicador do combo sobe a cada cascata do mesmo giro.</p>',
    features: `<p>🃏 <b>3 ou mais scatters</b> dão <b>8 rodadas grátis</b> com o combo dobrado (x2 a x16). ${T.pgx.goldTxt}</p>`,
  }));

  /* 23. Tigre Mestre (Master Tiger) — grátis começando em x3 com mistérios */
  App.register(vgame({
    id: 'tigremestre', name: 'Tigre Mestre', art: 'tiger', mascot: 'tiger2', tag: '243 caminhos · grátis a partir de x3',
    colors: ['#ea580c', '#1c1917'], bg: 'linear-gradient(180deg,#fed7aa,#ea580c 50%,#1c1917)', maxWin: 1500, vol: 3,
    intro: 'Inspirado no "Master Tiger" (TaDa Gaming).', hello: 'O mestre tigre treinou nas montanhas!',
    syms: syms5([['tigre', 'tiger', 'Tigre mestre'], ['leque', 'fan', 'Leque'], ['bambu', 'bamboo', 'Bambu'], ['pagode', 'castlejp', 'Pagode']]),
    wild: { img: 'martialarts', name: 'Kung fu', w: 0.45 }, sc: { img: 'yinyang', name: 'Yin-yang', w: 0.9 },
    extra: [{ id: 'mys', img: 'question', name: 'Mistério', mys: true, noPay: true, w: 0, fw: 1 }],
    fsCount: s => ({ 3: 6, 4: 10 }[s] || 15), retrig: () => 3, fsMult: 3,
    afterLand: async (rt, g, wk, st) => {
      if (!st) return;
      const ms = cells(g, x => x.mys);
      if (!ms.length) return;
      ms.forEach(([c, r]) => {
        const spin = st.api.left === 0 || RNG.float() < 0.45;
        if (spin) { st.api.add(1, true); g[c][r] = { id: 'mais', img: 'heavyplus', name: '+1 giro', noPay: true, c: 'gold' }; }
        else { st.m += 3; g[c][r] = { id: 'mx', img: 'zap', name: '+3 mult.', noPay: true, c: 'gold' }; }
      });
      rt.chip('mult', 'MULT.', 'x' + st.m); rt.msg('🐯 Mistérios: multiplicador e giros extras!'); await rt.drop(g);
    },
    highlights: ['🐯 5×3 com <b>243 caminhos</b>', '☯️ 3/4/5 yin-yang = <b>6/10/15 rodadas grátis</b> começando em <b>x3</b>', '❓ Nas grátis os <b>mistérios</b> viram <b>+3 no multiplicador</b> ou <b>+1 giro</b> (no último giro, sempre giros)', 'Prêmio máximo: <b>1.500x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. O mestre de kung fu é coringa.</p>',
    features: '<p>☯️ <b>3, 4 ou 5 yin-yang</b> dão <b>6, 10 ou 15 rodadas grátis</b> com multiplicador inicial x3, que não zera. Mistérios nelas somam +3 no multiplicador ou dão +1 giro.</p>',
  }));

  /* 24. Cidade do Pecado (Sin City) — o Chefe abre respins com modificadores */
  (() => {
    const MODS = [{ k: 'ambos', n: 'Ganhos dos dois lados', w: 25 }, { k: 'misterio', n: 'Mistério', w: 25 }, { k: 'gigante', n: 'Coringa gigante', w: 20 }, { k: 'upgrade', n: 'Upgrade', w: 20 }, { k: 'mult', n: 'Multiplicador', w: 10 }];
    const L40 = K.linesFor(4, 40);
    const SYC = syms5([['chefe', 'supervillain', 'Chefe'], ['carro', 'car', 'Carro'], ['diamante', 'gem', 'Diamante'], ['dados', 'dice2', 'Dados']]);
    App.register(vgame({
      id: 'cidadepecado', name: 'Cidade do Pecado', art: 'tophat', mascot: 'supervillain', tag: '40 linhas · 5 modificadores do Chefe',
      colors: ['#dc2626', '#0f172a'], bg: 'radial-gradient(circle at 50% 20%,#7f1d1d,#020617 70%)', maxWin: 2500, vol: 4, heights: [4, 4, 4, 4, 4],
      intro: 'Inspirado no "Sin City" (TaDa Gaming) — clima noir, sem violência.', hello: 'O Chefe está de olho...',
      syms: SYC,
      lines: L40, wild: { img: 'tophat', name: 'Coringa', w: 0.4 }, sc: { img: 'cigar', name: 'Charuto', w: 0.6 }, fsMult: 2,
      extra: [{ id: 'boss', img: 'supervillain', name: 'Chefe', boss: true, noPay: true, reels: [2], w: 0.5, fw: 0.9 }],
      fsCount: () => 8, retrig: () => 4,
      multOf: (st, g) => (g.modMult || 1) * ((st && st.m) || 1),
      afterLand: async (rt, g, wk, st, cell) => {
        if (!g.flat().some(x => x.boss) || RNG.float() > (st ? 1 : 0.5)) return;
        const m = RNG.weighted(MODS);
        rt.msg(`🎩 O Chefe ativou: ${m.n}!`); rt.fx('rise');
        g.forEach((col, c) => col.forEach((x, r) => { if (x.boss) g[c][r] = { id: 'w', img: 'tophat', name: 'Coringa', wild: true, c: 'gold' }; }));
        if (m.k === 'misterio') { const s = RNG.pick(SYC.slice(0, 4)); RNG.shuffle(cells(g, x => x.pays)).slice(0, 6).forEach(([c, r]) => { g[c][r] = { ...s, c: 'gold', fresh: true }; }); }
        if (m.k === 'gigante') { const c0 = RNG.int(1, 2); for (let c = c0; c < c0 + 2; c++) for (let r = 1; r < 3; r++) g[c][r] = { id: 'w', img: 'tophat', name: 'Coringa gigante', wild: true, c: 'giant', fresh: true }; }
        if (m.k === 'upgrade') g.forEach((col, c) => col.forEach((x, r) => { if (x.letter) g[c][r] = { ...cell(c, 'fw'), fresh: true }; }));
        if (m.k === 'mult') g.modMult = RNG.pick([2, 3, 5]);
        if (m.k === 'ambos') g.both = true;
        await rt.drop(g);
      },
      after: async (rt, g, wk, st, res) => {
        if (!g.both) return;
        // ganhos da direita para a esquerda também pagam
        const rev = g.slice().reverse(), r2 = lines(rev, L40, SYC, { mult: 'add' });
        r2.wins = r2.wins.filter(w => w.n < 5); r2.total = r2.wins.reduce((s, w) => s + w.pay, 0);
        if (r2.total) { const cs = new Set(); r2.cells.forEach(k => { const [c, r] = unkey(k); cs.add(key(4 - c, r)); }); r2.cells = cs; await pay(rt, r2, (g.modMult || 1) * ((st && st.m) || 1)); }
      },
      highlights: ['🎩 5×4 com <b>40 linhas</b>, tema noir', '🕴️ O <b>Chefe</b> (rolo 3) pode ativar um de 5 modificadores: <b>ganhos dos dois lados</b>, <b>mistério</b>, <b>coringa gigante 2×2</b>, <b>upgrade</b> das cartas ou <b>multiplicador x2–x5</b>', '🚬 3+ charutos = <b>8 rodadas grátis</b> com ganhos <b>x2</b> em que o Chefe sempre ativa um modificador (+4 com 3)', 'Prêmio máximo: <b>2.500x</b>'],
      how: '<p>Grade 5×4 com 40 linhas. Quando o Chefe cai no rolo do meio, há chance de ele ativar um modificador antes do pagamento.</p>',
      features: '<p>🚬 <b>3 ou mais charutos</b> dão <b>8 rodadas grátis</b> com ganhos dobrados; nelas o Chefe cai mais e sempre ativa um modificador.</p>',
    }));
  })();

  /* 25. Banco Dourado (Golden Bank) — coringas multiplicadores que se multiplicam */
  App.register(classic3({
    id: 'bancodourado', name: 'Banco Dourado', art: 'bank', mascot: 'goldvault', tag: '1 linha · coringas x2/x3/x5 que se multiplicam',
    colors: ['#ca8a04', '#1e293b'], bg: 'linear-gradient(180deg,#fde68a,#a16207 50%,#0f172a)', maxWin: 2000, vol: 3, buy: undefined,
    intro: 'Inspirado no "Golden Bank" (TaDa Gaming).', hello: 'O cofre do banco está aberto!',
    syms: [S('cofre', 'goldvault', 'Cofre', [50], 0.6), S('lingote', 'goldbar', 'Barra', [25], 1), S('nota', 'banknote', 'Nota', [10], 1.5), S('moeda', 'coin', 'Moeda', [5], 2)],
    wild: { img: 'bank', name: 'Coringa', w: 0.5 }, blank: 0.8,
    extra: [{ id: 'bonus', img: 'moneybag', name: 'Bônus', bon: true, noPay: true, w: 0.95 }],
    cell: x => (x.wild ? mult(x, RNG.weighted([{ m: 2, w: 55 }, { m: 3, w: 30 }, { m: 5, w: 15 }]).m) : x),
    multOf: g => (g.every(col => col[1].wild) ? 5 : 1),
    trig: g => g.every(col => col[1].bon),
    async bonus(rt, opts, H) {
      // prêmios acima de cada rolo; cada bônus que cair coleta o prêmio do rolo (3 giros que reiniciam)
      const prize = [0, 1, 2].map(() => RNG.pick([2, 3, 5, 8, 10]));
      let left = 3, tot = 0;
      rt.stat('hold');
      await rt.banner('BÔNUS DO COFRE', 'Bônus coletam o prêmio do rolo', 1300);
      rt.head(prize.map(v => v + 'x'));
      while (left > 0) {
        left--;
        const g = H.make('w').map(col => col.map(() => (RNG.float() < 0.08 ? { id: 'bonus', img: 'moneybag', name: 'Bônus', bon: true, noPay: true, c: 'gold' } : { id: 'vazio', img: null, c: 'empty', noPay: true })));
        await rt.spin(g, { tease: false });
        let got = false;
        g.forEach((col, c) => col.forEach(x => { if (x.bon) { tot += prize[c]; prize[c] += RNG.pick([1, 2, 3]); got = true; } }));
        rt.head(prize.map(v => v + 'x'));
        if (got) { left = 3; rt.fx('coin'); rt.msg(`💰 Coletado: ${rt.coins(tot)}`); }
        rt.chip('fs', 'GIROS', left);
        await rt.wait(400);
      }
      rt.chip('fs', null); rt.head(null);
      rt.win(tot); rt.msg(`🏦 Bônus do cofre: ${rt.coins(tot)}`); rt.fx('big'); await rt.wait(900);
    },
    highlights: ['🏦 Clássico de <b>3 rolos e 1 linha</b>', '💵 Coringas vêm com <b>x2, x3 ou x5</b>; vários na linha <b>se multiplicam</b>', '3 coringas na linha ganham <b>+x5</b> extra', '💰 3 bônus na linha = <b>Bônus do cofre</b>: prêmios acima de cada rolo que crescem a cada coleta', 'Prêmio máximo: <b>2.000x</b>'],
    how: '<p>Três rolos e uma linha. Três iguais pagam; o coringa substitui e multiplica.</p>',
    features: '<p>💰 <b>3 bônus na linha</b> abrem o Bônus do cofre: cada rolo tem um prêmio no topo. Os bônus que caírem coletam o prêmio do rolo (que aumenta). Três giros sem bônus encerram.</p>',
  }));

  /* 26. Terra Doce (Sweet Land) — 7×7, posições que dobram até x128 */
  App.register(T.clusterSpots({
    id: 'terradoce', name: 'Terra Doce', studio: STUDIO, art: 'lollipop', mascot: 'candy', tag: '7×7 · posições até x128',
    colors: ['#f472b6', '#a855f7'], bg: 'linear-gradient(180deg,#fbcfe8,#f0abfc 50%,#7e22ce)',
    intro: 'Inspirado no "Sweet Land" (TaDa Gaming).', maxWin: 3000, cap: 128, n: 7, rtp: '~97%', target: 0.97,
    syms: [S('pirulito', 'lollipop', 'Pirulito', [1, 2, 4, 10, 30, 150], 6), S('rosquinha', 'doughnut', 'Rosquinha', [0.8, 1.5, 3, 7, 20, 100], 7), S('cupcake', 'cupcake', 'Cupcake', [0.6, 1.2, 2.5, 5, 15, 60], 8), S('bala', 'candy', 'Bala', [0.5, 1, 2, 4, 10, 40], 9), S('chiclete', 'gumball', 'Chiclete', [0.4, 0.8, 1.5, 3, 8, 30], 10), S('jujuba', 'jelly', 'Jujuba', [0.3, 0.6, 1.2, 2.5, 6, 25], 11), S('biscoito', 'cookie', 'Biscoito', [0.25, 0.5, 1, 2, 5, 20], 12)],
    scImg: 'cottoncandy', scName: 'Algodão-doce', scW: 0.3, fsTable: { 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 },
    highlights: ['🍭 7×7 com grupos de <b>5+</b> e cascata', '✨ Posições vencedoras ficam marcadas e viram multiplicadores que dobram até <b>x128</b>', '3/4/5/6/7 algodões-doces = <b>10/12/15/20/30 rodadas grátis</b> com as posições guardadas', 'Prêmio máximo: <b>3.000x</b>'],
  }));

  /* 27. Coringa Dourado (Golden Joker) — frutas, respin de pilhas e Roda da Sorte */
  App.register(classic3({
    id: 'coringadourado', name: 'Coringa Dourado', art: 'joker', mascot: 'jester', tag: '5 linhas · respin de pilhas · roda x10',
    colors: ['#ca8a04', '#7c3aed'], bg: 'radial-gradient(circle at 50% 30%,#6d28d9,#1e1b4b 70%)', maxWin: 800, vol: 3,
    intro: 'Inspirado no "Golden Joker" (TaDa Gaming).', hello: 'O show do Coringa vai começar!',
    syms: [S('sete', 'seven', 'Sete', [25], 0.6), S('sino', 'bell', 'Sino', [12], 1), S('melancia', 'watermelon', 'Melancia', [8], 1.3), S('uva', 'grapes', 'Uva', [5], 1.6), S('limao', 'lemon', 'Limão', [3], 2), S('cereja', 'cherries', 'Cereja', [2], 2.3)],
    lines: L5, wild: { img: 'joker', name: 'Coringa dourado', w: 0.35 },
    cell: (x, c) => x,
    afterLand: async (rt, g, H) => {
      // pilhas: às vezes um rolo vem inteiro do mesmo símbolo
      g.forEach((col, c) => { if (RNG.float() < 0.12) { const s = col[1]; g[c] = col.map(() => ({ ...s })); } });
      rt.show(g);
    },
    after: async (rt, g, res, H) => {
      const full = g.map(col => col.every(x => x.id === col[0].id || x.wild) ? col.find(x => !x.wild) || col[0] : null);
      const cover = full.every(Boolean) && new Set(full.map(x => (x.wild ? 'w' : x.id))).size <= 2 && full.filter(x => !x.wild).every((x, i, a) => x.id === a[0].id);
      if (cover) {
        const m = RNG.weighted([{ m: 2, w: 40 }, { m: 3, w: 25 }, { m: 5, w: 18 }, { m: 8, w: 10 }, { m: 10, w: 7 }]).m;
        await rt.reveal('RODA DA SORTE', [2, 3, 5, 8, 10].map(v => ({ img: 'ferris', t: 'x' + v })), [2, 3, 5, 8, 10].indexOf(m));
        await pay(rt, H.evalOf(g), m - 1);
        return;
      }
      // duas pilhas sem ganho: viram coringa e o rolo restante gira de novo
      const stacked = full.map((x, c) => (x ? c : -1)).filter(c => c >= 0);
      if (!res.total && stacked.length === 2) {
        rt.msg('🃏 Respin de pilhas: as pilhas viraram coringa!');
        const free = [0, 1, 2].find(c => !stacked.includes(c));
        stacked.forEach(c => { g[c] = g[c].map(() => ({ ...H.WILD, c: 'sticky' })); });
        const ng = H.make('w'); g[free] = ng[free];
        await rt.spin(g, { tease: false });
        await pay(rt, H.evalOf(g));
      }
    },
    highlights: ['🍒 3×3 com <b>5 linhas</b> de frutas, sinos e setes', '🃏 <b>Respin de pilhas:</b> duas colunas cheias sem ganho viram coringa e a terceira gira de novo', '🎡 <b>Tela cheia</b> do mesmo símbolo = <b>Roda da Sorte</b> com multiplicador de até <b>x10</b>', 'Prêmio máximo: <b>800x</b>'],
    how: '<p>Grade 3×3 com 5 linhas. O Coringa dourado substitui qualquer símbolo. Os rolos às vezes vêm empilhados com o mesmo símbolo.</p>',
    features: '<p class="muted small">Sem rodadas grátis: os recursos acontecem no próprio giro.</p>',
  }));

  /* 28. Provação da Fênix (Trial of Phoenix) — vencedores ficam, grade cresce até 5×6 */
  (() => {
    const SY = [S('fenix', 'phoenix', 'Fênix', [1, 2.5, 6, 15], 3), S('pena', 'feather', 'Pena', [0.8, 2, 5, 12], 4), S('chama', 'fire', 'Chama', [0.6, 1.5, 4, 9], 5), S('joia', 'orangediamond', 'Joia', [0.5, 1.2, 3, 7], 5), ...K.ROYALS([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]], [7, 7, 8, 8])];
    const WILD = W('flame2', 'Coringa', { w: 0.35 });
    const SC = { id: 'sc', img: 'sunrise', name: 'Sol', sc: true, w: 0.2, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    async function play(rt, rows, wk, st) {
      // nas grátis os símbolos que subiram de nível já caem no nível novo
      const cell = c => { const x = draw(c, wk); return st && st.upg[x.id] ? { ...st.upg[x.id] } : x; };
      rt.layout(rows);
      let g = grid(Array(6).fill(rows), c => cell(c));
      await rt.spin(g, { tease: !st });
      let res = ways(g, SY), paid = 0;
      // os vencedores ficam e o resto gira de novo enquanto aparecer ganho novo
      for (let i = 0; i < 12 && res.total > paid; i++) {
        await pay(rt, { ...res, total: res.total - paid });
        paid = res.total;
        const keepN = res.cells.size + count(g, x => x.sc);
        if (keepN >= 12 && rows < 5) { rows++; rt.layout(rows); g.forEach((col, c) => col.unshift({ ...cell(c), fresh: true })); rt.msg(`🔥 A grade cresceu: ${rows} linhas`); res = { ...res, cells: new Set([...res.cells].map(k => { const [c, r] = unkey(k); return key(c, r + 1); })) }; }
        const ng = grid(Array(6).fill(rows), c => cell(c));
        res.cells.forEach(k => { const [c, r] = unkey(k); ng[c][r] = { ...g[c][r], c: 'sticky' }; });
        g.forEach((col, c) => col.forEach((x, r) => { if (x.sc) ng[c][r] = x; }));
        g = ng;
        await rt.spin(g, { tease: false });
        res = ways(g, SY);
      }
      if (st && res.wins.length) {
        const low = res.wins.map(w => w.sym).sort((a, b) => Math.max(...a.pays) - Math.max(...b.pays))[0];
        const up = SY[Math.max(0, SY.indexOf(low) - 1)];
        st.upg[low.id] = up; rt.msg(`🪶 ${low.name} subiu para ${up.name}`);
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'provacaofenix', name: 'Provação da Fênix', studio: STUDIO, art: 'phoenix', mascot: 'phoenix',
      tag: 'Vencedores ficam · até 15.625 caminhos', colors: ['#ea580c', '#7c2d12'], bg: 'linear-gradient(180deg,#fdba74,#ea580c 50%,#450a0a)',
      cols: 6, rows: 5, maxWin: 10000, vol: 4, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Trial of Phoenix" (TaDa Gaming).', hello: 'A fênix renasce das cinzas!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'De 729 (6×3) até 15.625 caminhos (6×5).')],
      highlights: ['🔥 6 rolos que começam com <b>3 linhas</b> (729 caminhos)', '📌 Os símbolos vencedores <b>ficam</b> e o resto gira de novo enquanto houver ganho novo', '⬆️ Com <b>12 ou mais</b> vencedores e sóis presos a grade ganha uma linha, até 6×5 (<b>15.625 caminhos</b>)', '☀️ 3+ sóis = <b>8 rodadas grátis</b> em grade 4×6; no fim de cada giro o símbolo vencedor mais baixo <b>sobe de nível</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>6 rolos que pagam por caminhos. Depois de um ganho, os vencedores ficam no lugar e o resto gira de novo; se aparecer ganho novo, repete.</p>',
      features: '<p>☀️ <b>3 ou mais sóis</b> dão <b>8 rodadas grátis</b> começando com 4 linhas (4.096 caminhos). No fim de cada giro o símbolo vencedor de menor valor vira o símbolo acima dele pelo resto do bônus (+4 giros com 3 sóis).</p>',
      make: () => grid(Array(6).fill(3), c => draw(c, 'w')),
      async spin(rt) { const sc = await play(rt, 3, 'w', null); rt.layout(3); if (sc >= 3) { await rt.wait(900); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { upg: {} };
        await rt.fsLoop(8, async api => { if (await play(rt, 4, 'fw', st) >= 3) api.add(4); }, { sub: 'Símbolos sobem de nível' });
        rt.layout(3);
      },
    }));
  })();

  /* 29. Jack, o Pirata (Jack the Pirate) — canhões transformam rolos em coringa */
  App.register(vgame({
    id: 'jackpirata', name: 'Jack, o Pirata', art: 'pirateflag', mascot: 'parrot', tag: '20 linhas · canhões coringa',
    colors: ['#1d4ed8', '#78350f'], bg: 'linear-gradient(180deg,#38bdf8,#1e3a8a 50%,#422006)', maxWin: 2500, vol: 4,
    intro: 'Inspirado no "Jack the Pirate" (TaDa Gaming).', hello: 'Içar velas, marujo!',
    syms: syms5([['jack', 'pirateflag', 'Jack'], ['papagaio', 'parrot', 'Papagaio'], ['navio', 'sailboat', 'Navio'], ['ancora', 'anchor', 'Âncora']]),
    lines: K.LINES_5x3.slice(0, 20), wild: { img: 'bomb', name: 'Canhão', w: 0.4, fw: 0.75 }, sc: { img: 'chest', name: 'Baú afundado', w: 0.9 },
    fsCount: () => 10, retrig: () => 5, fsMult: 2,
    afterLand: async (rt, g) => {
      // cada canhão dispara e transforma o rolo vizinho em coringa
      const hits = new Set();
      cells(g, x => x.wild && !x.c).forEach(([c]) => { const t = c < 4 ? c + 1 : c - 1; hits.add(t); });
      if (!hits.size) return;
      hits.forEach(c => { g[c] = g[c].map(x => (x.sc ? x : { id: 'w', img: 'collision', name: 'Coringa', wild: true, c: 'gold', fresh: true })); });
      rt.msg('💣 Fogo! O canhão acertou um rolo inteiro'); rt.fx('boom'); await rt.drop(g);
    },
    highlights: ['🏴‍☠️ 5×3 com <b>20 linhas</b>', '💣 Cada <b>canhão</b> é coringa e dispara no rolo vizinho, que vira <b>coringa inteiro</b>', '🧰 3+ baús afundados = <b>10 rodadas grátis</b> com ganhos <b>x2</b> (+5 com 3)', 'Prêmio máximo: <b>2.500x</b>'],
    how: '<p>Grade 5×3 com 20 linhas. O canhão é coringa e explode o rolo ao lado, transformando-o em coringa.</p>',
    features: '<p>🧰 <b>3 ou mais baús afundados</b> dão <b>10 rodadas grátis</b> com todos os ganhos dobrados e canhões mais frequentes.</p>',
  }));

  /* 30. A Guarda (The Guard) — escudos empilhados no rolo central que grudam nas grátis */
  App.register(vgame({
    id: 'aguarda', name: 'A Guarda', art: 'guard', mascot: 'guard', tag: '243 caminhos · escudos do palácio',
    colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#7f1d1d,#991b1b 50%,#422006)', maxWin: 2000, vol: 3,
    intro: 'Inspirado no "The Guard" (TaDa Gaming).', hello: 'A guarda imperial protege o palácio!',
    syms: syms5([['imperador', 'princeman', 'Imperador'], ['guarda', 'guard', 'Guarda'], ['espada', 'katana', 'Espada'], ['portao', 'torii', 'Portão']]),
    wild: { img: 'shield', name: 'Escudo', reels: [1, 2, 3], w: 0.5, fw: 0.6 }, sc: { img: 'castlejp', name: 'Palácio', w: 0.9 }, stack: 0.3, fsMult: 2,
    fsCount: () => 10, retrig: () => 5, fsState: () => ({ held: new Set() }),
    afterLand: async (rt, g, wk, st) => {
      if (g[2].some(x => x.wild)) { g[2] = g[2].map(() => ({ id: 'w', img: 'shield', name: 'Escudo', wild: true, c: 'gold' })); }
      if (st) { st.held.forEach(c => { g[c] = g[c].map(() => ({ id: 'w', img: 'shield', name: 'Escudo', wild: true, c: 'sticky' })); }); g.forEach((col, c) => { if (col.every(x => x.wild)) st.held.add(c); }); }
      await rt.drop(g);
    },
    highlights: ['🛡️ 5×3 com <b>243 caminhos</b>', 'Escudos coringa nos rolos 2 a 4; no <b>rolo do meio</b> o escudo cobre o rolo inteiro', '🏯 3+ palácios = <b>10 rodadas grátis</b> com ganhos <b>x2</b>: todo rolo coberto de escudos <b>fica preso</b> até o fim (+5 com 3)', 'Prêmio máximo: <b>2.000x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. Os escudos são coringas; no rolo 3 eles cobrem o rolo.</p>',
    features: '<p>🏯 <b>3 ou mais palácios</b> dão <b>10 rodadas grátis</b>. Todo rolo que ficar inteiro de escudos permanece preso pelo resto do bônus.</p>',
  }));

  /* 31. Gêmeos da Fortuna (Fortune Twins) — rolos gêmeos idênticos */
  App.register(vgame({
    id: 'gemeosfortuna', name: 'Gêmeos da Fortuna', art: 'dolls', mascot: 'boyface', tag: '243 caminhos · rolos gêmeos',
    colors: ['#dc2626', '#f59e0b'], bg: 'linear-gradient(180deg,#fecaca,#ef4444 50%,#7f1d1d)', maxWin: 2500, vol: 3,
    intro: 'Inspirado no "Fortune Twins" (TaDa Gaming).', hello: 'Os gêmeos da sorte estão na festa!',
    syms: syms5([['gemeos', 'dolls', 'Gêmeos'], ['envelope', 'redenvelope', 'Envelope'], ['lanterna', 'izakaya', 'Lanterna'], ['bolinho', 'dumpling', 'Bolinho']]),
    wild: { img: 'boyface', name: 'Coringa', w: 0.4 }, sc: { img: 'firecracker', name: 'Rojão', w: 0.6 },
    fsCount: () => 10, retrig: () => 5,
    afterLand: async (rt, g, wk, st) => {
      // dois (ou mais, nas grátis) rolos vizinhos ficam idênticos
      const n = st ? RNG.weighted([{ n: 2, w: 48 }, { n: 3, w: 38 }, { n: 4, w: 11 }, { n: 5, w: 3 }]).n : RNG.float() < 0.35 ? 2 : 0;
      if (!n) return;
      const c0 = RNG.int(0, 5 - n);
      for (let c = c0 + 1; c < c0 + n; c++) g[c] = g[c0].map(x => ({ ...x, c: 'gold', fresh: true }));
      rt.msg(`👯 Rolos gêmeos: ${n} rolos iguais!`); await rt.drop(g);
    },
    highlights: ['🧧 5×3 com <b>243 caminhos</b>', '👯 <b>Rolos gêmeos:</b> dois rolos vizinhos podem vir idênticos', '🧨 3+ rojões = <b>10 rodadas grátis</b> com gêmeos garantidos em todo giro, de <b>2 até 5 rolos</b> iguais', 'Prêmio máximo: <b>2.500x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. Em alguns giros dois rolos vizinhos são sincronizados e mostram os mesmos símbolos.</p>',
    features: '<p>🧨 <b>3 ou mais rojões</b> dão <b>10 rodadas grátis</b>; em todo giro de 2 a 5 rolos vizinhos ficam idênticos (+5 com 3 rojões).</p>',
  }));

  /* 32. Pérola Mágica (Magic Pearl) — pérolas multiplicadoras que se somam */
  App.register(vgame({
    id: 'perolamagica', name: 'Pérola Mágica', art: 'pearl', mascot: 'mermaid', tag: '243 caminhos · pérolas até x50',
    colors: ['#0ea5e9', '#a855f7'], bg: 'linear-gradient(180deg,#a5f3fc,#0e7490 50%,#1e1b4b)', maxWin: 5000, vol: 4,
    intro: 'Inspirado no "Magic Pearl" (TaDa Gaming).', hello: 'As ostras guardam pérolas mágicas!',
    syms: syms5([['sereia', 'mermaid', 'Sereia'], ['concha', 'shell', 'Concha'], ['cavalo', 'seenoevil', 'Cavalo-marinho'], ['peixe', 'tropicalfish', 'Peixe']].map((x, i) => (i === 2 ? ['polvo', 'octopus', 'Polvo'] : x))),
    wild: { img: 'trident', name: 'Tridente', w: 0.4 }, sc: { img: 'oyster', name: 'Ostra', w: 0.85 },
    extra: [{ id: 'perola', img: 'pearl', name: 'Pérola', pearl: true, noPay: true, w: 0.3, fw: 0.9 }],
    cell: x => (x.pearl ? mult(x, RNG.weighted([{ m: 2, w: 40 }, { m: 3, w: 25 }, { m: 5, w: 18 }, { m: 10, w: 10 }, { m: 25, w: 5 }, { m: 50, w: 2 }]).m) : x),
    fsCount: () => 10, retrig: () => 5, fsState: () => ({ acc: 0 }),
    multOf: (st, g, res) => {
      const sum = g.flat().filter(x => x.pearl).reduce((s, x) => s + x.m, 0);
      if (st) st.acc += sum;
      const m = (st ? st.acc : sum) || 1;
      return res.total ? m : 1;
    },
    highlights: ['🦪 5×3 com <b>243 caminhos</b>', '⚪ <b>Pérolas mágicas</b> de x2 a <b>x50</b>: com ganho no giro, todas da tela <b>se somam</b> e multiplicam o ganho', '3+ ostras = <b>10 rodadas grátis</b> em que as pérolas <b>acumulam</b> num multiplicador que não zera', 'Prêmio máximo: <b>5.000x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. Se houver ganho, os valores das pérolas na tela são somados e multiplicam o ganho do giro.</p>',
    features: '<p>🦪 <b>3 ou mais ostras</b> dão <b>10 rodadas grátis</b>. Cada pérola que cair soma no multiplicador total, que vale para todos os ganhos seguintes e não zera (+5 com 3 ostras).</p>',
  }));

  /* 33. Festa do Diamante (Diamond Party) — todo ganho trava e dá respin */
  (() => {
    const SY = [S('sete', 'seven', 'Sete', [3, 10, 40], 2), S('bar', 'goldingot', 'BAR', [2, 6, 20], 3), S('sino', 'bell', 'Sino', [1.2, 4, 12], 4), S('melancia', 'watermelon', 'Melancia', [0.8, 2.5, 8], 5), S('uva', 'grapes', 'Uva', [0.5, 1.5, 5], 6), S('cereja', 'cherries', 'Cereja', [0.3, 1, 3], 7)];
    const DIA = { id: 'dia', img: 'gem', name: 'Diamante', sc: true, w: 0.45 };
    const draw = pool([...SY, DIA]);
    const L3 = [[0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2]];
    const make = () => K.stack(grid([3, 3, 3, 3, 3], c => draw(c)), 0.4);
    App.register(K.create({
      id: 'festadiamante', name: 'Festa do Diamante', studio: STUDIO, art: 'gem', mascot: 'discoball',
      tag: '3 linhas · Lock Respin em todo ganho', colors: ['#a855f7', '#0ea5e9'], bg: 'radial-gradient(circle at 50% 30%,#6d28d9,#1e1b4b 70%)',
      cols: 5, rows: 3, maxWin: 1200, vol: 3, rtp: '~96,2%', target: 0.962, buy: false,
      intro: 'Inspirado no "Diamond Party" (TaDa Gaming).', hello: 'Que comece a festa dos diamantes!',
      symbols: [...SY, DIA],
      lineList: { cols: 5, rows: 3, list: L3, text: '3 linhas retas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.'), { title: 'Diamantes (em qualquer lugar)', head: ['3', '4', '5'], rows: [{ img: 'gem', name: 'Diamante', pays: [30, 100, 500].map(v => v / 10) }] }],
      highlights: ['💎 5×3 com <b>3 linhas</b> de frutas, BARs e setes', '🔒 <b>Lock Respin:</b> todo ganho trava os símbolos vencedores e gira o resto; continua enquanto o ganho crescer', '3/4/5 diamantes pagam em qualquer lugar e sempre dão Lock Respin', 'Prêmio máximo: <b>1.200x</b>'],
      how: '<p>Grade 5×3 com 3 linhas retas. Não há coringa nem rodadas grátis: a graça é o respin.</p>',
      features: '<p>🔒 Depois de qualquer ganho, os símbolos vencedores ficam travados e os outros giram de novo. Se o ganho aumentar, o respin se repete. Diamantes pagam em qualquer lugar (3, 4 ou 5) e também travam.</p>',
      make,
      async spin(rt) {
        let g = make();
        await rt.spin(g, { tease: false });
        const evalG = gg => { const r = lines(gg, L3, SY); const d = count(gg, x => x.sc); if (d >= 3) { r.total += [3, 10, 50][Math.min(2, d - 3)]; cells(gg, x => x.sc).forEach(([c, rr]) => r.cells.add(key(c, rr))); } return r; };
        let res = evalG(g), paid = 0;
        for (let i = 0; i < 10 && res.total > paid; i++) {
          await pay(rt, { ...res, total: res.total - paid });
          paid = res.total;
          const keep = new Set(res.cells);
          const ng = make();
          keep.forEach(k => { const [c, r] = unkey(k); ng[c][r] = { ...g[c][r], c: 'sticky' }; });
          rt.msg('🔒 Lock Respin!');
          g = ng;
          await rt.spin(g, { tease: false });
          res = evalG(g);
        }
      },
      async bonus() {},
    }));
  })();

  /* 34. Noite Disco (Disco Night) — globos espelhados multiplicam e grudam nas grátis */
  App.register(vgame({
    id: 'noitedisco', name: 'Noite Disco', art: 'mirrorball', mascot: 'dancer', tag: '25 linhas · globos x2–x5 colantes',
    colors: ['#db2777', '#7c3aed'], bg: 'radial-gradient(circle at 50% 20%,#a21caf,#1e1b4b 70%)', maxWin: 2500, vol: 4,
    intro: 'Inspirado no "Disco Night" (TaDa Gaming).', hello: 'Anos 70 na pista de dança!',
    syms: syms5([['dancarina', 'dancer', 'Dançarina'], ['vinil', 'cd', 'Disco de vinil'], ['patins', 'sandal', 'Plataforma'], ['microfone', 'microphone', 'Microfone']]),
    lines: K.LINES_5x3, lineMult: 'mul', wild: { img: 'mirrorball', name: 'Globo', w: 0.35, fw: 0.45 }, sc: { img: 'speaker', name: 'Caixa de som', w: 0.85 },
    cell: x => (x.wild ? mult(x, RNG.pick([1, 1, 2, 3, 5])) : x),
    fsCount: () => 8, retrig: () => 4, fsState: () => ({ sticky: new Map() }),
    afterLand: async (rt, g, wk, st) => { if (!st) return; st.sticky.forEach((x, k) => { const [c, r] = unkey(k); g[c][r] = { ...x, c: 'sticky' }; }); cells(g, x => x.wild).forEach(([c, r]) => st.sticky.set(key(c, r), g[c][r])); await rt.drop(g); },
    highlights: ['🪩 5×3 com <b>25 linhas</b>', 'Globos espelhados são coringas com <b>x2 a x5</b>; vários na linha <b>se multiplicam</b>', '🔊 3+ caixas de som = <b>8 rodadas grátis</b> com <b>globos colantes</b> (+4 com 3)', 'Prêmio máximo: <b>2.500x</b>'],
    how: '<p>Grade 5×3 com 25 linhas. O globo é coringa e pode trazer multiplicador.</p>',
    features: '<p>🔊 <b>3 ou mais caixas de som</b> dão <b>8 rodadas grátis</b>; todo globo que cair fica preso no lugar até o fim.</p>',
  }));

  /* 35. Mania de Frutas (Fruits Mania) — frutas clássicas com cascata e multiplicador */
  App.register(T.pg({
    studio: STUDIO, id: 'maniafrutas', name: 'Mania de Frutas', art: 'watermelon', mascot: 'cherries', tag: 'Cascata · multiplicador que dobra',
    colors: ['#16a34a', '#dc2626'], bg: 'linear-gradient(180deg,#bbf7d0,#4ade80 50%,#166534)', maxWin: 2500, vol: 3, rtp: '~96,5%', target: 0.965, cols: 5, rows: 5, cellH: 1,
    intro: 'Inspirado no "Fruits Mania" (TaDa Gaming).', hello: 'Frutas fresquinhas em cascata!',
    syms: [S('sete', 'seven', 'Sete', [1, 3, 8], 3), S('melancia', 'watermelon', 'Melancia', [0.8, 2, 6], 4), S('uva', 'grapes', 'Uva', [0.6, 1.5, 4], 5), S('laranja', 'tangerine', 'Laranja', [0.5, 1.2, 3], 5), S('limao', 'lemon', 'Limão', [0.4, 1, 2.5], 6), S('ameixa', 'plum', 'Ameixa', [0.3, 0.8, 2], 7), S('cereja', 'cherries', 'Cereja', [0.2, 0.6, 1.5], 8), S('morango', 'strawberry', 'Morango', [0.2, 0.5, 1.2], 8)],
    wildImg: 'star', wildName: 'Estrela', scImg: 'bell', scName: 'Sino', scW: 0.45, scFW: 0.35,
    heights: () => [5, 5, 5, 5, 5], stack: 0.25,
    baseM: { start: 1, dbl: true, cap: 8 }, fsM: { start: 2, dbl: true, cap: 64, persist: false }, fsCount: () => 10, retrig: () => 5,
    highlights: ['🍉 5×5 com <b>3.125 caminhos</b> e cascata', '✖️ Cada cascata <b>dobra</b> o multiplicador do giro (x1 → x2 → x4 → x8)', '🔔 3+ sinos = <b>10 rodadas grátis</b> começando em x2 e dobrando até <b>x64</b>', 'Prêmio máximo: <b>2.500x</b>'],
    how: '<p>Grade 5×5 que paga por caminhos, com cascata. O multiplicador dobra a cada cascata do mesmo giro.</p>',
    features: '<p>🔔 <b>3 ou mais sinos</b> dão <b>10 rodadas grátis</b>; em cada giro o multiplicador começa em x2 e dobra a cada cascata, até x64 (+5 com 3 sinos).</p>',
  }));

  /* 36. Ji Xiang Ru Yi — símbolos da prosperidade, cetro coringa e respin da nuvem */
  App.register(classic3({
    id: 'jixiangruyi', name: 'Ji Xiang Ru Yi', art: 'redenvelope', mascot: 'knot', tag: '5 linhas · cetro x2 · respin da nuvem',
    colors: ['#dc2626', '#ca8a04'], bg: 'radial-gradient(circle at 50% 30%,#b91c1c,#2a0606 70%)', maxWin: 1000, vol: 2,
    intro: 'Inspirado no "Ji Xiang Ru Yi" (TaDa Gaming).', hello: 'Que tudo seja como você deseja!',
    syms: [S('lingote', 'goldingot', 'Lingote', [30], 0.7), S('no', 'knot', 'Nó da sorte', [15], 1.1), S('jade', 'greensquare', 'Jade', [8], 1.5), S('envelope', 'redenvelope', 'Envelope', [4], 2), S('moeda', 'coin', 'Moeda', [2], 2.4)],
    lines: L5, wild: { img: 'wand', name: 'Cetro Ru Yi', w: 0.35 },
    extra: [{ id: 'nuvem', img: 'cloud', name: 'Nuvem da sorte', cloud: true, noPay: true, w: 0.3 }],
    multOf: g => (g.flat().some(x => x.wild) ? 2 : 1),
    after: async (rt, g, res, H) => {
      const cl = cells(g, x => x.cloud);
      if (cl.length < 2) return;
      // nuvens viram coringa e o resto gira de novo
      rt.msg('☁️ Nuvens da sorte: respin com coringas!');
      const ng = H.make('w');
      cl.forEach(([c, r]) => { ng[c][r] = { ...H.WILD, c: 'sticky' }; });
      await rt.spin(ng, { tease: false });
      await pay(rt, H.evalOf(ng), 2);
    },
    highlights: ['🧧 3×3 com <b>5 linhas</b> e símbolos da prosperidade', '🪄 O <b>cetro Ru Yi</b> é coringa e <b>dobra</b> os ganhos', '☁️ 2+ nuvens da sorte = <b>respin</b> com as nuvens virando coringa', 'Prêmio máximo: <b>1.000x</b>'],
    how: '<p>Grade 3×3 com 5 linhas. O cetro substitui e dobra o ganho do giro.</p>',
    features: '<p>☁️ Com <b>2 ou mais nuvens</b>, elas viram coringas travados e os outros símbolos giram mais uma vez (ganhos x2).</p>',
  }));

  /* 37. Beleza Havaiana (Hawaii Beauty) — 50 linhas, grátis x2 e bônus das flores */
  App.register(vgame({
    id: 'belezahavaiana', name: 'Beleza Havaiana', art: 'hibiscus', mascot: 'womandance', tag: '50 linhas · grátis x2 · flores',
    colors: ['#f97316', '#0891b2'], bg: 'linear-gradient(180deg,#fef3c7,#fb923c 40%,#0e7490)', maxWin: 1250, vol: 2, heights: [4, 4, 4, 4, 4],
    intro: 'Inspirado no "Hawaii Beauty" (TaDa Gaming).', hello: 'Aloha! Bem-vindo ao paraíso!',
    syms: syms5([['dancarina', 'womandance', 'Dançarina'], ['coco', 'coconut', 'Coco'], ['drink', 'tropicaldrink', 'Drink'], ['ukulele', 'guitar', 'Ukulele']]),
    lines: K.linesFor(4, 50), wild: { img: 'womandance', name: 'Dançarina coringa', w: 0.4, fw: 0.6 }, sc: { img: 'sunset', name: 'Pôr do sol', w: 0.65 },
    extra: [{ id: 'flor', img: 'hibiscus', name: 'Flor', flower: true, noPay: true, reels: [0, 2, 4], w: 0.6 }],
    fsCount: s => ({ 3: 10, 4: 12 }[s] || 15), retrig: () => 5, fsMult: 2,
    after: async (rt, g, wk, st) => {
      if (count(g, x => x.flower) < 3) return;
      const vals = Array.from({ length: 5 }, () => RNG.weighted([{ v: 3, w: 35 }, { v: 5, w: 28 }, { v: 10, w: 18 }, { v: 20, w: 10 }, { v: 50, w: 5 }, { v: 100, w: 1.5 }]).v);
      const p = await rt.choose('ESCOLHA UMA FLOR', vals.map((v, i) => ({ id: String(i), img: 'hibiscus', label: '?', desc: 'flor' })));
      const v = vals[Number(p)]; rt.win(v); rt.msg(`🌺 Flor havaiana: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(900);
    },
    highlights: ['🌺 5×4 com <b>50 linhas</b>', '🌅 3/4/5 pores do sol = <b>10/12/15 rodadas grátis</b> com ganhos <b>x2</b>', '🌸 3 flores (rolos 1, 3 e 5) = <b>bônus das flores</b>: escolha uma flor com prêmio de até <b>100x</b>', 'Prêmio máximo: <b>1.250x</b>'],
    how: '<p>Grade 5×4 com 50 linhas. A dançarina de hula é coringa.</p>',
    features: '<p>🌅 <b>3, 4 ou 5 pores do sol</b> dão <b>10, 12 ou 15 rodadas grátis</b> com todos os ganhos dobrados. 🌸 <b>3 flores</b> nos rolos 1, 3 e 5 abrem o bônus de escolha.</p>',
  }));

  /* 38. Festival da Lua (Moon Festival) — luas coringa colantes nas grátis */
  App.register(vgame({
    id: 'festivallua', name: 'Festival da Lua', art: 'mooncake', mascot: 'moonview', tag: '243 caminhos · luas colantes',
    colors: ['#ca8a04', '#1e1b4b'], bg: 'radial-gradient(circle at 50% 20%,#3730a3,#0b1026 70%)', maxWin: 2000, vol: 3,
    intro: 'Inspirado no "Moon Festival" (TaDa Gaming).', hello: 'Bolinhos da lua e lanternas!',
    syms: syms5([['coelho', 'rabbit', 'Coelho de jade'], ['bolinho', 'mooncake', 'Bolinho da lua'], ['lanterna', 'izakaya', 'Lanterna'], ['cha', 'teacup', 'Chá']]),
    wild: { img: 'fullmoon', name: 'Lua cheia', w: 0.35, fw: 0.5 }, sc: { img: 'lantern', name: 'Lanterna chinesa', w: 0.85 },
    fsCount: () => 10, retrig: () => 5, fsState: () => ({ sticky: new Set() }),
    afterLand: async (rt, g, wk, st) => { if (!st) return; st.sticky.forEach(k => { const [c, r] = unkey(k); g[c][r] = { id: 'w', img: 'fullmoon', name: 'Lua cheia', wild: true, c: 'sticky' }; }); cells(g, x => x.wild).forEach(([c, r]) => st.sticky.add(key(c, r))); await rt.drop(g); },
    highlights: ['🥮 5×3 com <b>243 caminhos</b>', '🌕 A <b>lua cheia</b> é coringa', '🏮 3+ lanternas = <b>10 rodadas grátis</b> em que <b>toda lua gruda</b> até o fim (+5 com 3)', 'Prêmio máximo: <b>2.000x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. A lua cheia substitui os símbolos.</p>',
    features: '<p>🏮 <b>3 ou mais lanternas</b> dão <b>10 rodadas grátis</b>; cada lua cheia que cair fica presa no lugar pelo resto do bônus.</p>',
  }));

  /* 39. Feng Shen — 4.096 caminhos, cascata sem gravidade e multiplicador por coringa */
  (() => {
    const SY = [S('deus', 'zeus', 'Deus da guerra', [1, 2, 5, 12], 3), S('dragao', 'dragon', 'Dragão', [0.8, 1.6, 4, 10], 4), S('tigre', 'tiger', 'Tigre', [0.6, 1.2, 3, 8], 4), S('fenix', 'phoenix', 'Fênix', [0.5, 1, 2.5, 6], 5), ...K.ROYALS([[0.15, 0.3, 0.6, 1.5], [0.15, 0.3, 0.6, 1.5], [0.1, 0.2, 0.5, 1.2], [0.1, 0.2, 0.5, 1.2]], [7, 7, 8, 8])];
    const WILD = W('cloudbolt', 'Coringa', { w: 0.35, fw: 0.5 });
    const BON = { id: 'bonus', img: 'scroll2', name: 'Bônus', sc: true, noPay: true, w: 5, fw: 0 };
    const draw = pool([...SY, WILD, BON]);
    const make = wk => K.stack(grid([4, 4, 4, 4, 4, 4], c => draw(c, wk)), 0.25);
    async function play(rt, g, wk, st) {
      await rt.spin(g, { tease: !st });
      if (st) { const w = count(g, x => x.wild); if (w) { st.m += w; rt.chip('mult', 'MULT.', 'x' + st.m); } }
      // cascata sem gravidade: os vencedores somem e novos símbolos aparecem no mesmo lugar
      await tumble(rt, g, {
        draw: c => draw(c, wk), evaluate: gg => ways(gg, SY), mult: () => (st ? st.m : 1),
        convert: (x, c) => ({ ...draw(c, wk), fresh: true }),
        onStep: async (s, gg) => { if (st && st.hi) gg.forEach((col, c) => col.forEach((x, r) => { if (x.id === st.hi && RNG.float() < 0.5) gg[c][r] = { ...WILD, c: 'gold' }; })); },
      });
      return g.every(col => col.some(x => x.sc));
    }
    App.register(K.create({
      id: 'fengshen', name: 'Feng Shen', studio: STUDIO, art: 'zeus', mascot: 'dragon',
      tag: '4.096 caminhos · coringas somam no multiplicador', colors: ['#ca8a04', '#7f1d1d'], bg: 'linear-gradient(180deg,#fde68a,#b45309 50%,#450a0a)',
      cols: 6, rows: 4, maxWin: 1000, vol: 3, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Feng Shen" (TaDa Gaming).', hello: 'Os deuses da mitologia chinesa duelam!',
      symbols: [...SY, WILD, BON],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = 4.096 caminhos.')],
      highlights: ['⚡ 6×4 com <b>4.096 caminhos</b>', '✨ <b>Cascata sem gravidade:</b> os vencedores somem e novos símbolos aparecem no mesmo lugar', '📜 Bônus em <b>todos os 6 rolos</b> = <b>10 rodadas grátis</b>: um símbolo alto pode virar coringa e <b>cada coringa soma +1</b> no multiplicador (não zera)', 'Prêmio máximo: <b>1.000x</b>'],
      how: '<p>Grade 6×4 que paga por caminhos. Depois de um ganho os símbolos vencedores são trocados no próprio lugar, sem cair, e o jogo avalia de novo.</p>',
      features: '<p>📜 Um <b>bônus em cada um dos 6 rolos</b> dá <b>10 rodadas grátis</b>. Um símbolo alto é sorteado e, a cada cascata, pode virar coringa. Cada coringa que aparecer soma +1 no multiplicador, que dura até o fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null)) { rt.mark(scatters(g)); await rt.wait(900); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { m: 1, hi: RNG.pick(SY.slice(0, 4)).id };
        await rt.fsLoop(10, async () => { await play(rt, make('fw'), 'fw', st); }, { sub: 'Coringas somam no multiplicador' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 40. Dragão da Sorte (Lucky Dragon) — grátis x3 que se renovam */
  App.register(vgame({
    id: 'dragaosorte', name: 'Dragão da Sorte', art: 'dragon', mascot: 'dragonface', tag: '243 caminhos · grátis x3 que se renovam',
    colors: ['#ca8a04', '#b91c1c'], bg: 'radial-gradient(circle at 50% 30%,#b45309,#2a0606 70%)', maxWin: 3000, vol: 4,
    intro: 'Inspirado no "Lucky Dragon" (TaDa Gaming).', hello: 'O dragão dourado traz sorte sem fim!',
    syms: syms5([['dragao', 'dragon', 'Dragão dourado'], ['perola', 'pearl', 'Pérola'], ['lingote', 'goldingot', 'Lingote'], ['carpa', 'goldfish', 'Carpa']]),
    wild: { img: 'dragonface', name: 'Dragão', reels: [1, 2, 3], w: 0.45, fw: 0.75 }, sc: { img: 'yinyang2', name: 'Moeda do dragão', w: 0.75, fw: 0.8 },
    fsCount: () => 8, retrig: () => 8, fsMult: 3,
    highlights: ['🐉 5×3 com <b>243 caminhos</b>', '🪙 3+ moedas do dragão = <b>8 rodadas grátis</b> com ganhos <b>x3</b>', '🔁 3 moedas nas grátis dão <b>+8 giros</b> — e as moedas caem mais nelas', 'Prêmio máximo: <b>3.000x</b>'],
    how: '<p>Grade 5×3 que paga por caminhos. O dragão (rolos 2 a 4) é coringa.</p>',
    features: '<p>🪙 <b>3 ou mais moedas do dragão</b> dão <b>8 rodadas grátis</b> com todos os ganhos triplicados. Nelas as moedas aparecem mais e 3 moedas dão +8 giros.</p>',
  }));
})();
