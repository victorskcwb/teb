'use strict';

/* =========================================================
   Hacksaw Gaming — lote 2 (parte 2). Regras baseadas nos
   originais; RTP calibrado por simulação (tools/calibrate.js).
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'hacksaw';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const R = (pays, w) => K.ROYALS(pays, w);
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };
  const BIG = [{ m: 2, w: 45 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 9 }, { m: 25, w: 4 }, { m: 50, w: 1.5 }, { m: 100, w: 0.5 }];
  const HUGE = [...BIG, { m: 200, w: 0.15 }, { m: 500, w: 0.04 }];
  const wm = list => RNG.weighted(list).m;
  const near = (c, r) => [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
  const TT = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
  const CLH = ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'];
  const CP = [[1, 2, 4, 10, 30, 150], [0.8, 1.5, 3, 7, 20, 100], [0.6, 1.2, 2.5, 5, 15, 60], [0.5, 1, 2, 4, 10, 40], [0.4, 0.8, 1.5, 3, 8, 30], [0.3, 0.6, 1.2, 2.5, 6, 25], [0.25, 0.5, 1, 2, 5, 20]];
  // nas grátis os símbolos mais baixos caem mais (ganhos mais frequentes)
  const csyms = list => list.map(([id, img, name], i) => S(id, img, name, CP[i], [6, 7, 8, 9, 10, 11, 12][i], { fw: [6, 7, 8, 9, 10, 11, 12][i] * (i >= 4 ? 1.6 : 1) }));
  const LP = [[2, 5, 15], [1.5, 4, 10], [1, 3, 8], [0.8, 2, 5], [0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]];
  const fsR = r => r.map(x => ({ ...x, fw: x.w * 1.8 }));
  const lsyms = list => [...list.map(([id, img, name], i) => S(id, img, name, LP[i], [3, 4, 4, 5][i])), ...fsR(R(LP.slice(4)))];
  const WP = [[1, 3, 10], [0.8, 2.5, 8], [0.6, 2, 6], [0.5, 1.5, 5], [0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]];
  const wsyms = list => [...list.map(([id, img, name], i) => S(id, img, name, WP[i], [3, 4, 4, 5][i])), ...fsR(R(WP.slice(4)))];
  const L14 = K.linesFor(4, 14), L19 = K.linesFor(5, 19), L20 = K.linesFor(4, 20), L26 = K.linesFor(4, 26), L27 = K.linesFor(5, 27);
  const T9 = n => (n >= 12 ? 2 : n >= 10 ? 1 : n >= 8 ? 0 : -1);
  const AP = [[10, 25, 50], [2.5, 10, 25], [2, 5, 15], [1.5, 2, 12], [1, 1.5, 10], [0.8, 1.2, 8], [0.5, 1, 5], [0.4, 0.9, 4], [0.25, 0.75, 2]];
  const asyms = list => list.map(([id, img, name], i) => S(id, img, name, AP[i], [3, 4, 5, 6, 8, 9, 10, 11, 12][i], { fw: [3, 4, 5, 6, 8, 9, 10, 11, 12][i] * (i >= 6 ? 1.6 : 1) }));

  /* 21. Gatos Laser (Beam Boys) — lasers viram fileiras de coringa */
  (() => {
    const SY = wsyms([['gato', 'catface', 'Gato biônico'], ['robo', 'robot', 'Robô'], ['bateria', 'battery', 'Bateria'], ['chip', 'floppydisk', 'Chip']]);
    const WILD = { id: 'w', img: 'zap', name: 'Coringa', wild: true, w: 0.5 };
    const CAT = { id: 'laser', img: 'grincat', name: 'Gato laser', laser: true, noPay: true, reels: [2, 3, 4, 5], w: 0.12, fw: 0.4 };
    const SC = { id: 'sc', img: 'satellite', name: 'Bônus', sc: true, w: 0.55, fw: 0 };
    const draw = pool([...SY, WILD, CAT, SC]);
    const make = wk => grid([4, 4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, mode, sticky) {
      if (sticky) sticky.forEach((m, r) => { for (let c = 0; c < 6; c++) if (!g[c][r].sc) g[c][r] = m > 1 ? mult({ ...WILD, c: 'sticky' }, m) : { ...WILD, c: 'sticky' }; });
      for (const [c, r] of cells(g, x => x.laser)) {
        // o laser atira para a esquerda: a fileira até o gato vira coringa
        const m = mode === 'x' ? wm(BIG) : 1;
        for (let a = 0; a <= c; a++) if (!g[a][r].sc) g[a][r] = m > 1 ? mult({ ...WILD, c: 'gold', fresh: true }, m) : { ...WILD, c: 'gold', fresh: true };
        if (sticky) sticky.set(r, Math.max(m, sticky.get(r) || 1));
        rt.msg(`😼 Laser na fileira ${r + 1}${m > 1 ? ` · x${m}` : ''}!`); rt.fx('zap');
      }
      await rt.drop(g);
      await pay(rt, ways(g, SY, { wildMult: 'add' }));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'gatoslaser', name: 'Gatos Laser', studio: STUDIO, art: 'grincat', mascot: 'robot',
      tag: 'Lasers criam fileiras coringa', colors: ['#06b6d4', '#a21caf'], bg: 'linear-gradient(180deg,#0f172a,#312e81 50%,#701a75)',
      cols: 6, rows: 4, maxWin: 12500, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Beam Boys" (Hacksaw Gaming).', hello: 'Os gatos disparam lasers para a esquerda!',
      symbols: [...SY, WILD, CAT, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '6×4 = 4.096 caminhos. Multiplicadores no mesmo caminho se somam.')],
      highlights: ['😼 O <b>gato laser</b> (rolos 3 a 6) dispara para a esquerda e transforma a fileira inteira até ele em <b>coringas</b>', '🛰️ 3+ bônus: escolha <b>Volatilidade Baixa</b> (12 giros, fileiras coringa colantes) ou <b>Extrema</b> (8 giros, fileiras colantes com multiplicador x2 a x100)', 'Prêmio máximo: <b>12.500x</b>'],
      how: '<p>Grade 6×4 que paga por caminhos. Quando um gato laser aparece nos rolos 3 a 6, ele dispara para a esquerda e tudo na fileira dele, até o rolo 1, vira coringa.</p>',
      features: '<p>🛰️ <b>3 ou mais bônus</b> abrem a escolha: <b>Baixa</b> = 12 rodadas grátis com as fileiras de laser presas; <b>Extrema</b> = 8 rodadas grátis em que as fileiras presas também têm multiplicador (x2 a x100).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); if (await play(rt, g, null, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const v = await rt.choose('ESCOLHA A VOLATILIDADE', [{ id: 'l', img: 'catface', label: 'Baixa', desc: '12 giros · fileiras colantes', sim: true }, { id: 'x', img: 'grincat', label: 'Extrema', desc: '8 giros · fileiras com multiplicador' }]);
        const sticky = new Map();
        await rt.fsLoop(v === 'x' ? 8 : 12, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, v, sticky); }, { sub: v === 'x' ? 'Volatilidade extrema' : 'Volatilidade baixa' });
      },
    }));
  })();

  /* 22. Aurora dos Reis (Dawn of Kings) — livro com símbolos que expandem */
  (() => {
    const L13 = K.LINES_5x3.slice(0, 13);
    const SY = [S('farao', 'pharaoh', 'Faraó', [1, 10, 100, 500], 2, { min: 2 }), S('rainha', 'princess', 'Rainha', [0.5, 4, 40, 200], 3, { min: 2 }), S('anubis', 'jackal', 'Anúbis', [3, 30, 150], 4), S('olho', 'eye', 'Olho', [2, 20, 100], 4), ...R([[0.5, 2.5, 10], [0.5, 2.5, 10], [0.5, 2, 8], [0.5, 2, 8]])];
    const BOOK = { id: 'w', img: 'goldbook', name: 'Livro', wild: true, sc: true, w: 0.75, fw: 0.7 };
    const draw = pool([...SY, BOOK]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    const evalL = g => lines(g, L13, SY);
    async function expand(rt, g, sp) {
      const cols = [...new Set(cells(g, x => x.id === sp.id).map(([c]) => c))];
      const minN = sp.min || 3;
      if (cols.length < minN) return;
      const t = g.map((col, c) => (cols.includes(c) ? col.map(() => ({ ...sp, c: 'gold' })) : col.map(() => ({ id: 'vazio', img: null, c: 'empty', noPay: true }))));
      const v = L13.length * sp.pays[Math.min(cols.length - minN, sp.pays.length - 1)] / 2;
      g.forEach((col, c) => { if (cols.includes(c)) g[c] = t[c].map(x => ({ ...x, fresh: true })); });
      await rt.drop(g);
      rt.mark(cells(g, x => x.id === sp.id).map(([c, r]) => key(c, r))); rt.win(v); rt.msg(`📜 ${sp.name} expandiu em ${cols.length} rolos: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(900);
    }
    App.register(K.create({
      id: 'aurorareis', name: 'Aurora dos Reis', studio: STUDIO, art: 'goldbook', mascot: 'pharaoh',
      tag: 'Livro com expansão · 10.000x', colors: ['#ca8a04', '#7c2d12'], bg: 'linear-gradient(180deg,#fde68a,#b45309 50%,#451a03)',
      cols: 5, rows: 3, maxWin: 10000, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Dawn of Kings" (Hacksaw Gaming).', hello: 'O livro é coringa e scatter!',
      symbols: [...SY, BOOK],
      lineList: { cols: 5, rows: 3, list: L13, text: '13 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(2, 4), SY, 'Faraó e Rainha pagam a partir de 2.')],
      highlights: ['📖 5×3 com 13 linhas; o livro é coringa e scatter', '✨ <b>Livro surpresa</b> no jogo base: um símbolo cai de 3 a 5 vezes e <b>expande</b> pelos rolos', '3 livros = <b>10 rodadas grátis</b> com um símbolo especial que expande; 4+ livros = <b>Bônus Triplo</b> com 3 símbolos especiais', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×3 com 13 linhas, no estilo "livro". De vez em quando o recurso do livro escolhe um símbolo, faz ele cair de 3 a 5 vezes e depois o expande pelos rolos onde caiu, pagando em todas as linhas.</p>',
      features: '<p>📖 <b>3 livros</b> dão <b>10 rodadas grátis</b> com um símbolo especial sorteado que expande pelos rolos quando aparece em rolos suficientes para pagar. <b>4 ou mais livros</b> dão o <b>Bônus Triplo</b>: três símbolos especiais ao mesmo tempo.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        let sp = null;
        if (RNG.float() < 0.01) { sp = RNG.pick(SY.slice(2)); const n = RNG.weighted([{ n: 3, w: 70 }, { n: 4, w: 25 }, { n: 5, w: 5 }]).n; RNG.shuffle([0, 1, 2, 3, 4]).slice(0, n).forEach(c => { g[c][RNG.int(0, 2)] = { ...sp }; }); rt.msg(`📖 Livro surpresa: ${sp.name}!`); }
        await rt.spin(g);
        await pay(rt, evalL(g));
        if (sp) await expand(rt, g, sp);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const sps = RNG.shuffle(SY.slice()).slice(0, sc >= 4 ? 3 : 1);
        await rt.reveal('SÍMBOLO ESPECIAL', SY.map(s => ({ img: s.img, letter: s.letter, label: s.name })), SY.indexOf(sps[0]));
        await rt.fsLoop(10, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); await pay(rt, evalL(g)); for (const sp of sps) await expand(rt, g, sp); if (count(g, x => x.sc) >= 3) api.add(10); }, { title: sc >= 4 ? 'BÔNUS TRIPLO' : 'RODADAS GRÁTIS!', sub: `Especial: ${sps.map(s => s.name).join(', ')}` });
      },
    }));
  })();

  /* 23. Sinta a Batida (Feel the Beat) — caixas de som que se espalham */
  (() => {
    const SY = lsyms([['dj', 'headphone', 'DJ rato'], ['disco', 'cd', 'Disco'], ['microfone', 'microphone', 'Microfone'], ['fone', 'radio', 'Rádio']]);
    const WILD = { id: 'w', img: 'discoball', name: 'Coringa', wild: true, w: 0.6 };
    const SPK = { id: 'spk', img: 'speaker', name: 'Caixa de som', spk: true, noPay: true, w: 0.4, fw: 1.0 };
    const X = { id: 'x', img: 'sparkles', name: 'Multiplicador X', xm: true, noPay: true, w: 0, fw: 0.35 };
    const SC = { id: 'sc', img: 'notes', name: 'Bônus', sc: true, w: 0.6, fw: 0 };
    const draw = pool([...SY, WILD, SPK, X, SC]);
    const make = (wk, super_) => grid([5, 5, 5, 5, 5], c => { let x = draw(c, wk); if (x.xm) mult(x, super_ ? wm(HUGE) : wm(BIG)); return x; });
    async function play(rt, g, st) {
      // caixa de som: vira um símbolo e espalha para as casas vizinhas
      const spk = cells(g, x => x.spk);
      if (spk.length) {
        const s = RNG.pick(SY.slice(0, 6));
        spk.forEach(([c, r]) => { g[c][r] = { ...s, c: 'gold', fresh: true }; near(c, r).forEach(([a, b]) => { if (g[a] && g[a][b] && !g[a][b].sc && !g[a][b].xm && RNG.float() < (st !== null ? 0.9 : 0.6)) g[a][b] = { ...s, c: 'gold', fresh: true }; }); });
        rt.msg(`🔊 A batida espalhou ${s.name}!`); await rt.drop(g);
      }
      let m = 1;
      if (st) { const xs = g.flat().filter(x => x.xm); if (xs.length) { st.m += xs.reduce((a, x) => a + x.m, 0); rt.chip('mult', 'GLOBAL', 'x' + st.m); } m = Math.max(1, st.m); g.forEach((col, c) => col.forEach((x, r) => { if (x.xm) g[c][r] = { ...RNG.pick(SY) }; })); }
      await pay(rt, lines(g, L27, SY), m);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'sintabatida', name: 'Sinta a Batida', studio: STUDIO, art: 'speaker', mascot: 'headphone',
      tag: 'Caixas de som · X até x500', colors: ['#d946ef', '#22d3ee'], bg: 'linear-gradient(180deg,#0f0a1f,#581c87 50%,#0e7490)',
      cols: 5, rows: 5, maxWin: 10000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Feel the Beat" (Hacksaw Gaming).', hello: 'Sinta a batida!',
      symbols: [...SY, WILD, SPK, X, SC],
      lineList: { cols: 5, rows: 5, list: L27, text: '27 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🎧 5×5 com 27 linhas', '🔊 <b>Caixas de som mistério</b> viram um símbolo e o espalham para as casas vizinhas', '🎶 3 bônus = <b>Aumenta o Som!</b> (10 giros com mais caixas e símbolos X de x2 a x100); 4 bônus = <b>Todo Mundo na Pista!</b> (símbolos X de x2 a x500). Os X somam um <b>multiplicador global</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×5 com 27 linhas. As caixas de som se revelam todas como o mesmo símbolo e podem contaminar as casas encostadas.</p>',
      features: '<p>🎶 <b>3 bônus</b>: 10 rodadas grátis com mais caixas de som e símbolos X (x2 a x100). <b>4 bônus</b>: igual, mas os X chegam a x500. O valor dos X soma num <b>multiplicador global</b> que não zera.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const sup = sc >= 4, st = { m: 0 }; await rt.fsLoop(10, async () => { const g = make('fw', sup); await rt.spin(g, { tease: false }); await play(rt, g, st); }, { title: sup ? 'TODO MUNDO NA PISTA!' : 'AUMENTA O SOM!', sub: sup ? 'Multiplicador global' : 'Mais caixas de som' }); rt.chip('mult', null); },
    }));
  })();

  /* 24. Bombas Saltitantes — bombas que dobram a cada cascata */
  (() => {
    const SY = asyms([['dinamite', 'firecracker', 'Dinamite'], ['granada', 'bomb', 'Bomba'], ['estrela', 'star2', 'Estrela'], ['coracao', 'heartfire', 'Coração'], ['gelatina', 'jelly', 'Gelatina'], ['bala', 'candy', 'Bala'], ['uva', 'grapes', 'Uva'], ['cereja', 'cherries', 'Cereja'], ['limao', 'lemon', 'Limão']]);
    const BOMB = { id: 'bomba', img: 'collision', name: 'Bomba multiplicadora', bomb: true, noPay: true, w: 0, fw: 0 };
    const SC = { id: 'sc', img: 'balloon', name: 'Bônus', sc: true, w: 0.6, fw: 0.35 };
    const draw = pool([...SY, SC]);
    const make = (wk, pb, force) => { const g = grid([5, 5, 5, 5, 5, 5], c => draw(c, wk)); g.forEach((col, c) => col.forEach((x, r) => { if (!x.sc && RNG.float() < pb) g[c][r] = mult({ ...BOMB }, RNG.pick([5, 10, 15, 20, 25])); })); if (force && !g.flat().some(x => x.bomb)) g[RNG.int(0, 5)][RNG.int(0, 4)] = mult({ ...BOMB }, RNG.pick([5, 10, 15, 20, 25])); return g; };
    async function play(rt, g, wk, pb) {
      await rt.drop(g);
      const r = await tumble(rt, g, {
        draw: c => (RNG.float() < pb / 2 ? mult({ ...BOMB }, RNG.pick([5, 10, 15])) : draw(c, wk)),
        evaluate: gg => K.anywhere(gg, SY, T9),
        keep: x => x.bomb,
        onStep: async (s, gg) => { gg.forEach(col => col.forEach(x => { if (x.bomb) mult(x, Math.min(1000, x.m * 2)); })); },
      });
      const bombs = g.flat().filter(x => x.bomb);
      if (r.total && bombs.length) {
        const m = bombs.reduce((s, x) => s + x.m, 0);
        rt.mark(cells(g, x => x.bomb).map(([c, rr]) => key(c, rr))); rt.win(r.total * (m - 1)); rt.msg(`💣 Bombas x${m}! ${rt.coins(r.total)} → ${rt.coins(r.total * m)}`); rt.fx('boom'); await rt.wait(900);
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'bombasaltitantes', name: 'Bombas Saltitantes', studio: STUDIO, art: 'collision', mascot: 'firecracker',
      tag: 'Bombas x5–x25 que dobram', colors: ['#f97316', '#16a34a'], bg: 'linear-gradient(180deg,#bbf7d0,#86efac 40%,#166534)',
      cols: 6, rows: 5, maxWin: 10000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Bouncy Bombs" (Hacksaw Gaming).', hello: 'As bombas dobram a cada cascata!',
      symbols: [...SY, BOMB, SC],
      tables: [table('Pagamento por quantidade', ['8–9', '10–11', '12+'], SY, 'Paga em qualquer lugar (8+ iguais), com cascata.')],
      highlights: ['💥 6×5 que paga em qualquer lugar, com cascata', '💣 <b>Bombas</b> caem com <b>x5 a x25</b>, ficam durante a cascata e <b>dobram</b> a cada nova cascata; no fim se somam e multiplicam o ganho', '🎈 3 bônus = <b>10 giros</b> com mais bombas; 4 = <b>10 giros com bomba garantida</b> em todo giro', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 6×5: 8 ou mais símbolos iguais em qualquer posição pagam e somem (cascata). As bombas não somem: a cada cascata seu multiplicador dobra. No fim da sequência, se houve ganho, as bombas se somam e multiplicam o total.</p>',
      features: '<p>🎈 <b>3 bônus</b>: Bônus Bombástico, 10 rodadas grátis com mais bombas. <b>4 bônus</b>: Bombástico Fantástico, 10 rodadas grátis com pelo menos uma bomba em todo giro. 3+ bônus nelas dão +5.</p>',
      make: () => make('w', 0.006),
      async spin(rt) { const g = make('w', 0.006); const sc = await play(rt, g, 'w', 0.006); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { await rt.fsLoop(10, async api => { if (await play(rt, make('fw', 0.03, sc >= 4), 'fw', 0.03) >= 3) api.add(5); }, { sub: sc >= 4 ? 'Bomba garantida!' : 'Mais bombas' }); },
    }));
  })();

  /* 25. Rusty e Curly — cartazes coringa com vidas */
  (() => {
    const SY = lsyms([['rusty', 'cowboy', 'Rusty'], ['curly', 'pig', 'Curly'], ['mapa', 'worldmap', 'Mapa'], ['bota', 'boot', 'Bota']]);
    const POST = { id: 'w', img: 'scroll2', name: 'Cartaz coringa', wild: true, poster: true, w: 0.6, fw: 2.0 };
    const SC = { id: 'sc', img: 'sheriff', name: 'Bônus', sc: true, w: 0.75, fw: 0 };
    const draw = pool([...SY, POST, SC]);
    const label = x => { x.t = `${'♥'.repeat(x.hp || 0)}${x.m > 1 ? ' x' + x.m : ''}`; return x; };
    const cell = (c, wk) => { const x = draw(c, wk); if (x.poster) { if (RNG.float() < 0.6) x.hp = RNG.int(1, 3); if (RNG.float() < 0.4) x.m = wm(BIG); label(x); } return x; };
    const make = wk => grid([4, 4, 4, 4, 4], c => cell(c, wk));
    async function play(rt, g, wk, keepHp) {
      await rt.spin(g, { tease: false });
      await pay(rt, lines(g, L14, SY, { mult: 'add' }));
      // cartazes com corações ficam e dão respin (cada respin gasta 1 coração)
      for (let guard = 0; guard < 10 && !rt.capped; guard++) {
        const held = cells(g, x => x.poster && x.hp > 0);
        if (!held.length) break;
        const ng = make(wk);
        held.forEach(([c, r]) => { const x = { ...g[c][r], c: 'sticky' }; if (!keepHp) x.hp--; ng[c][r] = label(x); });
        g.splice(0, 5, ...ng);
        rt.msg('🤠 Cartaz com coração: respin!');
        await rt.spin(g, { tease: false });
        await pay(rt, lines(g, L14, SY, { mult: 'add' }));
        if (keepHp && guard >= 3) break;
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'rustycurly', name: 'Rusty e Curly', studio: STUDIO, art: 'scroll2', mascot: 'cowboy',
      tag: 'Cartazes com corações e respins', colors: ['#b45309', '#16a34a'], bg: 'linear-gradient(180deg,#fef3c7,#fcd34d 40%,#92400e)',
      cols: 5, rows: 4, maxWin: 10000, vol: 3, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Rusty & Curly" (Hacksaw Gaming).', hello: 'Cartazes de procurado com corações!',
      symbols: [...SY, POST, SC],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['🤠 5×4 com 14 linhas', '📜 <b>Cartazes coringa</b> podem vir com <b>até 3 corações</b> e/ou multiplicador (x2 a x100): eles ficam e dão <b>respins</b> enquanto tiverem coração', '⭐ 3 bônus = <b>Siga o Plano!</b> (6 giros, cartazes não perdem corações); 4 = <b>Quem Atirou no Xerife?</b> (coleta de multiplicadores e 3 giros finais)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. Cartazes de procurado são coringas; os que têm corações ficam presos e os outros rolos giram de novo, gastando um coração por respin.</p>',
      features: '<p>⭐ <b>3 bônus</b>: <b>Siga o Plano!</b>, 6 rodadas grátis em que os cartazes ficam presos sem gastar corações (até 4 respins por giro). <b>4 bônus</b>: <b>Quem Atirou no Xerife?</b> — Rusty e Curly atiram multiplicadores na grade por 5 giros de coleta e depois há 3 giros finais com todos eles presos.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, 'w', false); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        if (sc < 4) { await rt.fsLoop(6, async () => { await play(rt, make('fw'), 'fw', true); }, { title: 'SIGA O PLANO!', sub: 'Cartazes não perdem corações' }); return; }
        const held = new Map();
        await rt.banner('QUEM ATIROU NO XERIFE?', 'Fase de coleta', 1400);
        for (let i = 0; i < 5; i++) { const n = RNG.int(0, 2); for (let j = 0; j < n; j++) { const k = key(RNG.int(0, 4), RNG.int(0, 3)); held.set(k, (held.get(k) || 0) + wm(BIG)); } rt.chip('fs', 'COLETA', `${i + 1}/5 · ${held.size}`); await rt.wait(300); }
        rt.chip('fs', null);
        await rt.fsLoop(3, async () => { const g = make('fw'); held.forEach((m, k) => { const [c, r] = unkey(k); g[c][r] = mult({ ...POST, c: 'sticky' }, m); }); await rt.spin(g, { tease: false }); await pay(rt, lines(g, L14, SY, { mult: 'add' })); }, { title: 'HORA DO PAGAMENTO', sub: `${held.size} multiplicadores presos` });
      },
    }));
  })();

  /* 26. Gangue do Dinheiro (Cash Crew) — notas, coletor e coringas multiplicadores */
  (() => {
    const SY = lsyms([['ladrao', 'disguised', 'Ladrão'], ['cofre', 'safe', 'Cofre'], ['bomba', 'bomb', 'Bomba'], ['pe-de-cabra', 'wrench', 'Pé de cabra']]);
    const CASH = { id: 'cash', img: 'banknote', name: 'Nota', cash: true, noPay: true, w: 1.4, fw: 3 };
    const GRAB = { id: 'grab', img: 'moneywings', name: "Grab'em", grab: true, noPay: true, w: 0.35, fw: 0.9 };
    const MW = { id: 'w', img: 'dynamite', name: 'Coringa multiplicador', wild: true, mw: true, w: 0.3, fw: 0.9 };
    const SC = { id: 'sc', img: 'police', name: 'Bônus', sc: true, w: 0.55, fw: 0 };
    const draw = pool([...SY, CASH, GRAB, MW, SC]);
    const VALS = [{ v: 1, w: 30 }, { v: 2, w: 22 }, { v: 3, w: 14 }, { v: 5, w: 12 }, { v: 10, w: 8 }, { v: 15, w: 4 }, { v: 25, w: 3 }, { v: 50, w: 1.2 }, { v: 100, w: 0.4 }, { v: 250, w: 0.1 }, { v: 500, w: 0.03 }];
    const cell = (c, wk) => { const x = draw(c, wk); if (x.cash) { x.v = RNG.weighted(VALS).v; x.t = x.v + 'x'; } if (x.mw) mult(x, wm([{ m: 2, w: 45 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 10 }, { m: 25, w: 5 }])); return x; };
    const make = wk => grid([5, 5, 5, 5, 5], c => cell(c, wk));
    async function play(rt, g) {
      await rt.spin(g, { tease: false });
      // coringas multiplicadores multiplicam as notas no quadrado 3×3 em volta
      cells(g, x => x.mw).forEach(([c, r]) => { for (let a = c - 1; a <= c + 1; a++) for (let b = r - 1; b <= r + 1; b++) { const y = g[a] && g[a][b]; if (y && y.cash) { y.v *= g[c][r].m; y.t = y.v + 'x'; } } });
      await pay(rt, lines(g, L19, SY));
      const grabs = count(g, x => x.grab);
      if (grabs) { const v = g.flat().filter(x => x.cash).reduce((s, x) => s + x.v, 0) * grabs; if (v) { rt.mark(cells(g, x => x.cash || x.grab).map(([c, r]) => key(c, r))); rt.win(v); rt.msg(`💸 Grab'em pegou ${rt.coins(v)}`); rt.fx('coin'); await rt.wait(800); } }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'gangdinheiro', name: 'Gangue do Dinheiro', studio: STUDIO, art: 'moneywings', mascot: 'disguised',
      tag: 'Notas até 500x · coringas x25', colors: ['#16a34a', '#111827'], bg: 'linear-gradient(180deg,#14532d,#0f172a 60%,#020617)',
      cols: 5, rows: 5, maxWin: 10000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Cash Crew" (Hacksaw Gaming).', hello: "Grab'em pega todas as notas!",
      symbols: [...SY, CASH, GRAB, MW, SC],
      lineList: { cols: 5, rows: 5, list: L19, text: '19 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['💵 Notas de <b>1x a 500x</b> pagas pelo coletor <b>Grab\'em</b>', '🧨 <b>Coringas multiplicadores</b> (x2 a x25) multiplicam todas as notas no quadrado 3×3 em volta', '🚓 3+ bônus = <b>10 rodadas grátis</b> com mais notas, coletores e multiplicadores', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×5 com 19 linhas. Quando um Grab\'em aparece junto com notas, ele coleta o valor de todas (dois coletores pegam em dobro). Antes disso, cada coringa multiplicador multiplica as notas encostadas nele (inclusive na diagonal).</p>',
      features: '<p>🚓 <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas) com muito mais notas, coletores e coringas multiplicadores.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { await rt.fsLoop(10, async api => { if (await play(rt, make('fw')) >= 3) api.add(5); }, { sub: 'Mais notas e coletores' }); },
    }));
  })();

  /* 27. Matadores S.A. (Slayers Inc) — DuelReels até x500 */
  (() => {
    const SY = lsyms([['matadora', 'ninja', 'Matadora'], ['ciborgue', 'robot', 'Ciborgue'], ['katana', 'katana', 'Katana'], ['mascara', 'maskface', 'Máscara']]);
    const WILD = { id: 'w', img: 'star', name: 'Coringa', wild: true, w: 0.7 };
    const VS = { id: 'vs', img: 'vs', name: 'VS', vs: true, noPay: true, reels: [1, 2, 3], w: 0.25, fw: 1.0 };
    const SC = { id: 'sc', img: 'cityscape', name: 'Bônus', sc: true, w: 0.7, fw: 0 };
    const draw = pool([...SY, WILD, VS, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function duels(rt, g, sticky) {
      if (sticky) sticky.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      for (const [c] of cells(g, x => x.vs)) {
        if (!g[c].some(x => x.vs)) continue;
        const m = wm(HUGE), test = g.map(col => col.slice());
        test[c] = g[c].map(() => mult({ ...WILD, c: 'duel' }, m));
        if (lines(test, L14, SY).total > lines(g, L14, SY).total) { g[c] = test[c].map(x => ({ ...x, fresh: true })); if (sticky) sticky.set(c, m); rt.msg(`⚔️ Duelo no rolo ${c + 1}: x${m}`); rt.fx('boom'); }
        else g[c] = g[c].map(x => (x.vs ? { ...RNG.pick(SY) } : x));
      }
      await rt.drop(g);
    }
    App.register(K.create({
      id: 'matadoressa', name: 'Matadores S.A.', studio: STUDIO, art: 'katana', mascot: 'ninja',
      tag: 'DuelReels até x500 · 15.000x', colors: ['#64748b', '#dc2626'], bg: 'linear-gradient(180deg,#0f172a,#1e293b 60%,#450a0a)',
      cols: 5, rows: 4, maxWin: 15000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Slayers Inc" (Hacksaw Gaming).', hello: 'Duelos de espadas na cidade!',
      symbols: [...SY, WILD, VS, SC],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Rolos de duelo na mesma linha se multiplicam.')],
      highlights: ['🗡️ <b>DuelReels:</b> VS (rolos 2 a 4) vira rolo coringa com <b>x2 a x500</b> quando forma ganho; vários se multiplicam', '🏙️ 3 bônus = <b>Ascensão do Sindicato</b> (10 giros com muito mais VS); 4 = <b>Matadores Selvagens</b> (rolos de duelo <b>colantes</b>)', 'Prêmio máximo: <b>15.000x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. Um VS que ajude num ganho vira um rolo inteiro de coringa com multiplicador; dois ou mais rolos de duelo na mesma linha se multiplicam.</p>',
      features: '<p>🏙️ <b>3 bônus</b>: Ascensão do Sindicato, 10 rodadas grátis com VS muito mais frequentes. <b>4 bônus</b>: Matadores Selvagens, 10 rodadas grátis em que todo rolo de duelo fica preso até o fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await duels(rt, g, null); await pay(rt, lines(g, L14, SY)); const sc = count(g, x => x.sc); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const st = sc >= 4 ? new Map() : null; await rt.fsLoop(10, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await duels(rt, g, st); await pay(rt, lines(g, L14, SY)); }, { title: st ? 'MATADORES SELVAGENS' : 'ASCENSÃO DO SINDICATO', sub: st ? 'Rolos de duelo colantes' : 'Muito mais duelos' }); },
    }));
  })();

  /* 28. Zé Zeus — quadrados divinos e a Mão de Zeus */
  (() => {
    const SY = csyms([['zeus', 'cloudbolt', 'Zé Zeus'], ['harpa', 'harp', 'Harpa'], ['vaso', 'amphora', 'Vaso'], ['uva', 'grapes', 'Uva'], ['louro', 'laurel', 'Louro'], ['coluna', 'classical', 'Coluna'], ['moeda', 'coin', 'Moeda']]);
    const HAND = { id: 'mao', img: 'raisedhand', name: 'Mão de Zeus', hand: true, noPay: true, w: 0.2, fw: 0.45 };
    const SC = { id: 'sc', img: 'lightning', name: 'Bônus', sc: true, w: 0.6, fw: 0.3 };
    const draw = pool([...SY, HAND, SC]);
    const make = wk => grid([5, 5, 5, 5, 5, 5], c => draw(c, wk));
    async function play(rt, g, wk, sq) {
      const div = sq || new Set();
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c, wk), evaluate: gg => { const r = payClusters(clusters(gg, 5), TT); r.cells.forEach(k => div.add(k)); return r; } });
      rt.mark([...div], 'hl');
      if (g.flat().some(x => x.hand) && div.size) {
        // a Mão de Zeus ativa os quadrados divinos: moedas e raios multiplicadores
        let coins = 0, m = 0;
        div.forEach(() => { if (RNG.float() < 0.12) m += RNG.pick([2, 2, 3, 5, 10]); else if (RNG.float() < 0.35) coins += RNG.weighted([{ v: 0.2, w: 40 }, { v: 0.5, w: 30 }, { v: 1, w: 18 }, { v: 2, w: 8 }, { v: 5, w: 3 }, { v: 25, w: 0.6 }, { v: 50, w: 0.15 }]).v; });
        const v = coins * Math.max(1, m);
        if (v) { rt.win(v); rt.msg(`✋ Mão de Zeus: ${div.size} quadrados divinos · ${rt.coins(coins)}${m > 1 ? ` × ${m}` : ''}`); rt.fx('big'); await rt.wait(900); }
        if (!sq) div.clear();
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'zezeus', name: 'Zé Zeus', studio: STUDIO, art: 'raisedhand', mascot: 'cloudbolt',
      tag: 'Quadrados divinos · Mão de Zeus', colors: ['#64748b', '#facc15'], bg: 'linear-gradient(180deg,#475569,#1e293b 60%,#0f172a)',
      cols: 6, rows: 5, maxWin: 10000, vol: 3, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Ze Zeus" (Hacksaw Gaming).', hello: 'Cada ganho deixa um quadrado divino!',
      symbols: [...SY, HAND, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['⚡ 6×5 com grupos e cascata', '🟨 Toda casa de um grupo vencedor vira um <b>Quadrado Divino</b>', '✋ Com a <b>Mão de Zeus</b> na tela no fim das cascatas, os quadrados revelam <b>moedas</b> e <b>raios multiplicadores</b>', '🌩️ 3+ bônus = <b>10 rodadas grátis</b> em que os quadrados divinos <b>ficam</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 6×5: grupos de 5+ iguais encostados pagam e somem (cascata). As casas por onde passaram ganhos ficam marcadas como quadrados divinos. Se no fim houver uma Mão de Zeus na tela, cada quadrado pode revelar uma moeda (0,2x a 50x) ou um raio multiplicador; os raios multiplicam a soma das moedas.</p>',
      features: '<p>🌩️ <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas). Os quadrados divinos ficam marcados de um giro para o outro.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const sq = new Set(); await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', sq) >= 3) api.add(5); }, { sub: 'Quadrados divinos ficam' }); },
    }));
  })();

  /* 29. Cripta Amaldiçoada — maldição se espalha para cima */
  (() => {
    const HIGH = [S('tut', 'pharaoh', 'Tutancâmon', [1, 3, 10], 3), S('sobek', 'crocodile', 'Sobek', [0.8, 2.5, 8], 4), S('ankh', 'ankh', 'Ankh', [0.6, 2, 6], 4), S('escaravelho', 'scarab', 'Escaravelho', [0.5, 1.5, 5], 5)];
    const SY = [...HIGH, ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'pyramid', name: 'Coringa', wild: true, w: 0.55 };
    const CURSE = { id: 'curse', img: 'nazar', name: 'Maldição', curse: true, noPay: true, w: 0.35, fw: 0.6 };
    const SC = { id: 'sc', img: 'urn', name: 'Bônus', sc: true, w: 0.75, fw: 0 };
    const draw = pool([...SY, WILD, CURSE, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, mode, cursed) {
      const pos = cursed || new Set();
      cells(g, x => x.curse).forEach(([c, r]) => { for (let rr = 0; rr <= r; rr++) pos.add(key(c, rr)); });
      if (pos.size) {
        // todas as casas amaldiçoadas viram o mesmo símbolo
        const pickFrom = mode === 't' ? [...HIGH, WILD] : [...SY, WILD];
        const s = RNG.pick(pickFrom);
        pos.forEach(k => { const [c, r] = unkey(k); if (!g[c][r].sc) g[c][r] = { ...s, c: 'gold', fresh: true }; });
        rt.msg(`🧿 Maldição: ${pos.size} casas viraram ${s.name}`); await rt.drop(g);
      }
      await pay(rt, ways(g, SY));
      if (!cursed) pos.clear();
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'criptamaldita', name: 'Cripta Amaldiçoada', studio: STUDIO, art: 'urn', mascot: 'pharaoh',
      tag: 'Maldição transforma rolos', colors: ['#16a34a', '#1c1917'], bg: 'radial-gradient(circle at 50% 20%,#14532d,#0c0a09 70%)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Cursed Crypt" (Hacksaw Gaming).', hello: 'A maldição sobe pelos rolos!',
      symbols: [...SY, WILD, CURSE, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos.')],
      highlights: ['⚱️ 5×4 com 1.024 caminhos', '🧿 A <b>maldição</b> se espalha <b>para cima</b> no rolo; todas as casas amaldiçoadas viram o <b>mesmo símbolo</b>', '3 bônus = <b>Ira de Sobek</b>: 10 giros com casas amaldiçoadas que <b>ficam</b>; 4 = <b>Tumba de Tutancâmon</b>: elas só viram símbolos altos ou coringa', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 1.024 caminhos. Cada símbolo de maldição amaldiçoa a casa dele e todas acima no mesmo rolo; depois todas as casas amaldiçoadas viram um mesmo símbolo sorteado.</p>',
      features: '<p>⚱️ <b>3 bônus</b>: <b>Ira de Sobek</b>, 10 rodadas grátis em que as casas amaldiçoadas continuam amaldiçoadas até o fim. <b>4 bônus</b>: <b>Tumba de Tutancâmon</b>, igual, mas as casas amaldiçoadas só viram símbolos altos ou coringas.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); const sc = await play(rt, g, null, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const mode = sc >= 4 ? 't' : 's', cur = new Set(); await rt.fsLoop(10, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, mode, cur); }, { title: mode === 't' ? 'TUMBA DE TUTANCÂMON' : 'IRA DE SOBEK', sub: 'Casas amaldiçoadas ficam' }); },
    }));
  })();

  /* 30. O Faraó Guaxinim (Le Pharaoh) — re-drops colantes e quadrados dourados */
  (() => {
    const L19x6 = L19.map(L => [...L, L[4]]);
    const SY = [S('guaxinim', 'raccoon', 'Guaxinim', [1, 2.5, 8, 25], 3), S('farao', 'pharaoh', 'Máscara de faraó', [0.8, 2, 6, 20], 4), S('ankh', 'ankh', 'Ankh', [0.6, 1.5, 5, 15], 4), S('olho', 'eye', 'Olho', [0.5, 1.2, 4, 12], 5), ...R([[0.15, 0.4, 1.2, 4], [0.15, 0.4, 1.2, 4], [0.1, 0.3, 1, 3], [0.1, 0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'goldbar', name: 'Coringa', wild: true, w: 0.5 };
    const RAIN = { id: 'arco', img: 'rainbow', name: 'Arco-íris', rainbow: true, noPay: true, w: 0.15, fw: 0.8 };
    const SC = { id: 'sc', img: 'pyramid', name: 'Bônus', sc: true, w: 0.55, fw: 0 };
    const draw = pool([...SY, WILD, RAIN, SC]);
    const make = wk => grid([5, 5, 5, 5, 5, 5], c => draw(c, wk));
    const COINS = [{ v: 0.2, w: 40 }, { v: 0.5, w: 30 }, { v: 1, w: 18 }, { v: 2, w: 8 }, { v: 5, w: 3 }, { v: 25, w: 0.5 }, { v: 100, w: 0.05 }];
    // nas grátis as moedas valem mais
    const COINS_FS = [{ v: 2, w: 40 }, { v: 4, w: 30 }, { v: 6, w: 15 }, { v: 10, w: 9 }, { v: 20, w: 4 }, { v: 50, w: 1.5 }, { v: 200, w: 0.2 }];
    /** gold: quadrados que ficam (grátis) ou null; tier 3 = zeram depois do arco-íris, 4 = ficam, 5 = arco-íris em todo giro */
    async function play(rt, g, wk, gold, tier = 0) {
      const sq = gold || new Set();
      await rt.spin(g, { tease: false });
      for (let guard = 0; guard < 6 && !rt.capped; guard++) {
        const res = lines(g, L19x6, SY);
        if (!res.total) break;
        await pay(rt, res);
        res.cells.forEach(k => sq.add(k));
        // re-drop: vencedores ficam, o resto cai de novo
        const ng = make(wk);
        res.cells.forEach(k => { const [c, r] = unkey(k); ng[c][r] = { ...g[c][r], c: 'sticky' }; });
        g.splice(0, 6, ...ng);
        rt.mark([...sq], 'hl');
        await rt.drop(g);
      }
      if (gold && sq.size && !g.flat().some(x => x.rainbow) && (tier >= 5 || (tier === 4 && RNG.float() < 0.4))) { g[RNG.int(0, 5)][RNG.int(0, 4)] = { ...RAIN, fresh: true }; await rt.drop(g); }
      let act = false;
      if (g.flat().some(x => x.rainbow) && sq.size) {
        let coins = 0, m = 1;
        sq.forEach(() => { const r = RNG.float(); if (r < 0.08) m += RNG.pick([1, 2, 4]); else if (r < (gold ? 0.8 : 0.45)) coins += RNG.weighted(gold ? COINS_FS : COINS).v; });
        if (coins) { rt.win(coins * m); rt.msg(`🌈 Arco-íris! Os dourados pagam ${rt.coins(coins)}${m > 1 ? ` × ${m} (trevos)` : ''}`); rt.fx('big'); await rt.wait(900); }
        act = true;
      }
      // Sorte do Faraó: os dourados só zeram depois de ativados por um arco-íris
      if (!gold || (tier === 3 && act)) sq.clear();
      if (gold) rt.chip('gold', 'DOURADOS', sq.size);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'faraoguaxinim', name: 'O Faraó Guaxinim', studio: STUDIO, art: 'raccoon', mascot: 'pharaoh',
      tag: 'Re-drops colantes · 15.000x', colors: ['#ca8a04', '#0e7490'], bg: 'linear-gradient(180deg,#fde68a,#ca8a04 50%,#164e63)',
      cols: 6, rows: 5, maxWin: 15000, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Le Pharaoh" (Hacksaw Gaming).', hello: 'Ganhos ficam e o resto cai de novo!',
      symbols: [...SY, WILD, RAIN, SC],
      lineList: { cols: 6, rows: 5, list: L19x6, text: '19 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 4), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🦝 6×5 com 19 linhas', '🔁 <b>Re-drops colantes:</b> os símbolos vencedores ficam e os outros caem de novo enquanto houver ganho', '🟨 Casas vencedoras viram <b>quadrados dourados</b>; com um 🌈 na tela, eles revelam moedas e trevos multiplicadores', '🔺 3/4/5 bônus = <b>Sorte do Faraó</b>, <b>Tesouros Perdidos</b> ou <b>Arco-íris sobre as pirâmides</b>: os quadrados dourados ficam de um giro para o outro', 'Prêmio máximo: <b>15.000x</b>'],
      how: '<p>Grade 6×5 com 19 linhas. Depois de um ganho, os símbolos vencedores ficam presos e todo o resto cai de novo; repete enquanto houver ganho. Cada casa que fez parte de um ganho vira um quadrado dourado; se cair um arco-íris, os quadrados revelam moedas (até 100x) e trevos que multiplicam as moedas.</p>',
      features: '<ul class="si-list"><li>🔺 <b>3 bônus — Sorte do Faraó:</b> 10 rodadas grátis com mais arco-íris. Os quadrados dourados <b>ficam de um giro para o outro</b> até um arco-íris ativá-los; depois disso eles zeram.</li><li>🔺 <b>4 bônus — Tesouros Perdidos:</b> 12 rodadas grátis e os dourados <b>ficam a rodada inteira</b>, mesmo depois de ativados; o arco-íris aparece com mais frequência.</li><li>🔺 <b>5 bônus — Arco-íris sobre as pirâmides:</b> 12 rodadas, dourados fixos e <b>arco-íris em todo giro</b>.</li></ul><p class="muted small">A compra de bônus dá um bônus aleatório: Sorte do Faraó (85%), Tesouros Perdidos (13%) ou Arco-íris sobre as pirâmides (2%).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, 'w', null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = RNG.weighted([{ v: 3, w: 85 }, { v: 4, w: 13 }, { v: 5, w: 2 }]).v;
        const tier = Math.min(5, sc), sq = new Set();
        const n = { 3: 10, 4: 12, 5: 12 }[tier];
        await rt.fsLoop(n, async () => { await play(rt, make('fw'), 'fw', sq, tier); }, {
          title: { 3: 'SORTE DO FARAÓ', 4: 'TESOUROS PERDIDOS', 5: 'ARCO-ÍRIS SOBRE AS PIRÂMIDES' }[tier],
          sub: tier === 3 ? 'Dourados ficam até o arco-íris' : tier === 4 ? 'Quadrados dourados não somem' : 'Arco-íris em todo giro',
        });
        rt.chip('gold', null);
      },
    }));
  })();

  /* 31. Seis Seis Seis — Rodas Malvadas */
  (() => {
    const SY = lsyms([['diabo', 'imp', 'Diabinho'], ['tridente', 'trident', 'Tridente'], ['fogo', 'fire', 'Fogo'], ['caveira', 'skull', 'Caveira']]);
    const SIX = { id: 'seis', img: 'six', name: '6', six: true, noPay: true, reels: [0, 2, 4], w: 1.8, fw: 1.8, t: '6' };
    const draw = pool([...SY, SIX]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const BLUE = [{ m: 5, w: 50 }, { m: 10, w: 25 }, { m: 20, w: 13 }, { m: 50, w: 8 }, { m: 100, w: 4 }];
    const RED = [{ m: 10, w: 50 }, { m: 25, w: 25 }, { m: 50, w: 13 }, { m: 100, w: 8 }, { m: 250, w: 3 }, { m: 500, w: 1 }];
    async function wheel(rt, list, title) { const idx = list.indexOf(RNG.weighted(list)); await rt.reveal(title, list.map(x => ({ img: 'six', label: x.m + 'x' })), idx); return list[idx].m; }
    App.register(K.create({
      id: 'seisseisseis', name: 'Seis Seis Seis', studio: STUDIO, art: 'imp', mascot: 'trident',
      tag: 'Rodas Malvadas até 500x', colors: ['#dc2626', '#111827'], bg: 'radial-gradient(circle at 50% 80%,#991b1b,#0b0303 70%)',
      cols: 5, rows: 4, maxWin: 16666, vol: 5, rtp: '~94,2%', target: 0.942,
      intro: 'Inspirado no "SixSixSix" (Hacksaw Gaming).', hello: 'Três 6 giram as Rodas Malvadas!',
      symbols: [...SY, SIX],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Não há coringas neste jogo.')],
      highlights: ['😈 5×4 com 14 linhas e <b>sem coringas</b>', '6️⃣ Símbolos <b>6</b> caem nos rolos 1, 3 e 5: dois deles giram a <b>roda azul</b> (5x a 100x); três giram a <b>roda vermelha</b> (10x a 500x) ou abrem um bônus', '🔥 Bônus: <b>Falando no Diabo</b>, <b>Que o Inferno se Solte</b> e <b>Que Diabos</b> (10 giros com 1, 2 ou 3 rodas por 6)', 'Prêmio máximo: <b>16.666x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. Os 6 só caem nos rolos 1, 3 e 5: com dois deles a roda azul paga um prêmio (5x a 100x); com os três, a roda vermelha paga 10x a 500x ou leva a uma das rodadas grátis.</p>',
      features: '<p>🔥 Nas rodadas grátis (10 giros) cada 6 que cair gira rodas azuis: <b>uma</b> em Falando no Diabo, <b>duas</b> em Que o Inferno se Solte e <b>três</b> em Que Diabos.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); await rt.spin(g); await pay(rt, lines(g, L14, SY));
        const six = [0, 2, 4].filter(c => g[c].some(x => x.six)).length;
        if (six === 2) { const m = await wheel(rt, BLUE, 'RODA AZUL'); rt.win(m); rt.msg(`😈 Roda azul: ${rt.coins(m)}`); rt.fx('big'); await rt.wait(700); }
        if (six === 3) { if (RNG.float() < 0.45) await this.bonus(rt, { lvl: RNG.weighted([{ m: 1, w: 70 }, { m: 2, w: 25 }, { m: 3, w: 5 }]).m }); else { const m = await wheel(rt, RED, 'RODA VERMELHA'); rt.win(m); rt.msg(`🔥 Roda vermelha: ${rt.coins(m)}`); rt.fx('jackpot'); await rt.wait(900); } }
      },
      async bonus(rt, { lvl = 1 } = {}) {
        const names = ['FALANDO NO DIABO', 'QUE O INFERNO SE SOLTE', 'QUE DIABOS'];
        await rt.fsLoop(10, async () => {
          const g = make('fw'); await rt.spin(g, { tease: false }); await pay(rt, lines(g, L14, SY));
          const n = count(g, x => x.six);
          for (let i = 0; i < n * lvl && !rt.capped; i++) { const m = wm(BLUE) / 2; rt.win(m); rt.msg(`😈 Roda: ${rt.coins(m)}`); }
          if (n) { rt.fx('coin'); await rt.wait(500); }
        }, { title: names[lvl - 1], sub: `${lvl} roda${lvl > 1 ? 's' : ''} por 6` });
      },
    }));
  })();

  /* 32. Laboratório Torcido — a grade gira (RotoGrid) */
  (() => {
    const SY = lsyms([['cientista', 'scientist', 'Cientista'], ['rato', 'mouse', 'Rato mutante'], ['cerebro', 'brain', 'Cérebro'], ['dna', 'dna', 'DNA']]);
    const WILD = { id: 'w', img: 'testtube', name: 'Coringa', wild: true, w: 0.5 };
    const ROTO = { id: 'roto', img: 'counterclockwise', name: 'RotoGrid', roto: true, noPay: true, w: 0.25, fw: 0.9 };
    const BEAK = { id: 'bequer', img: 'potion', name: 'Béquer', beaker: true, noPay: true, w: 0.25, fw: 0.9 };
    const SC = { id: 'sc', img: 'microscope', name: 'Bônus', sc: true, w: 0.55, fw: 0 };
    const draw = pool([...SY, WILD, ROTO, BEAK, SC]);
    const make = wk => grid([5, 5, 5, 5, 5], c => draw(c, wk));
    /** gira a grade 90° no sentido horário */
    const rotate = g => g.map((col, c) => col.map((x, r) => g[r][4 - c]));
    async function play(rt, g0) {
      let g = g0;
      await rt.spin(g, { tease: false });
      let charges = g.flat().filter(x => x.roto).length ? RNG.int(1, 4) : 0;
      g.forEach((col, c) => col.forEach((x, r) => { if (x.roto) g[c][r] = { ...WILD, fresh: true }; }));
      await pay(rt, lines(g, L19, SY));
      while (charges-- > 0 && !rt.capped) {
        g = rotate(g);
        // béqueres derramam e viram coringa tudo abaixo deles
        g.forEach((col, c) => col.forEach((x, r) => { if (x.beaker) { for (let rr = r; rr < 5; rr++) if (!col[rr].sc) col[rr] = { ...WILD, c: 'gold', fresh: true }; } }));
        g0.splice(0, 5, ...g);
        rt.msg('🔄 RotoGrid: a grade girou!'); rt.fx('rise');
        await rt.drop(g0);
        await pay(rt, lines(g0, L19, SY));
        g = g0;
      }
      return count(g0, x => x.sc);
    }
    App.register(K.create({
      id: 'labtorcido', name: 'Laboratório Torcido', studio: STUDIO, art: 'scientist', mascot: 'mouse',
      tag: 'RotoGrid gira a grade', colors: ['#84cc16', '#7c3aed'], bg: 'linear-gradient(180deg,#1a2e05,#365314 50%,#2e1065)',
      cols: 5, rows: 5, maxWin: 15000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Twisted Lab" (Hacksaw Gaming).', hello: 'A grade inteira pode girar!',
      symbols: [...SY, WILD, ROTO, BEAK, SC],
      lineList: { cols: 5, rows: 5, list: L19, text: '19 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda; cada rotação paga de novo.')],
      highlights: ['🧪 5×5 com 19 linhas', '🔄 O símbolo <b>RotoGrid</b> vem com 1 a 4 cargas: cada uma <b>gira a grade 90°</b> e as linhas pagam de novo', '⚗️ <b>Béqueres</b> derramam ao girar e transformam em coringa tudo abaixo deles', '🔬 3+ bônus = <b>Solte a Gosma!</b>: 10 giros com mais RotoGrids e béqueres', 'Prêmio máximo: <b>15.000x</b>'],
      how: '<p>Grade 5×5 com 19 linhas. Quando um RotoGrid aparece (ele vira coringa), a grade gira no sentido horário de 1 a 4 vezes; depois de cada giro as linhas são pagas de novo. Béqueres na grade derramam após cada rotação, deixando coringas abaixo deles.</p>',
      features: '<p>🔬 <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas) com RotoGrids e béqueres bem mais frequentes.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { await rt.fsLoop(10, async api => { if (await play(rt, make('fw')) >= 3) api.add(5); }, { title: 'SOLTE A GOSMA!', sub: 'Mais rotações e béqueres' }); },
    }));
  })();

  /* 33. Águia Alfa — Stack'n'Sync */
  (() => {
    const SY = lsyms([['aguia', 'eagle', 'Águia'], ['lobo', 'wolf', 'Lobo'], ['urso', 'bear', 'Urso'], ['alce', 'moose', 'Alce']]);
    const WILD = { id: 'w', img: 'feather', name: 'Coringa', wild: true, w: 0.6 };
    const SNS = { id: 'sns', img: 'link', name: "Stack'n'Sync", sns: true, noPay: true, w: 0.3, fw: 1.0 };
    const GOLD = { id: 'gsns', img: 'goldbar', name: "Stack'n'Sync dourado", gsns: true, noPay: true, w: 0.02, fw: 0.1 };
    const SC = { id: 'sc', img: 'mountain', name: 'Bônus', sc: true, w: 0.7, fw: 0 };
    const draw = pool([...SY, WILD, SNS, GOLD, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g) {
      await rt.spin(g, { tease: false });
      if (g.flat().some(x => x.gsns)) {
        // dourado: todos os rolos com pilhas de altos/coringas e multiplicador
        const m = wm(BIG), s = RNG.pick([...SY.slice(0, 4), WILD]);
        g.forEach((col, c) => { const h = RNG.int(2, 4), r0 = RNG.int(0, 4 - h); for (let r = r0; r < r0 + h; r++) col[r] = { ...s, c: 'gold', fresh: true }; });
        rt.msg(`🦅 Stack'n'Sync DOURADO: x${m}`); rt.fx('jackpot'); await rt.drop(g);
        await pay(rt, lines(g, L20, SY), m);
        return count(g, x => x.sc);
      }
      for (const [c, r] of cells(g, x => x.sns)) {
        // copia a pilha sincronizada para 1 a 3 outros rolos
        const s = RNG.pick(SY), h = RNG.int(2, 4), r0 = Math.min(r, 4 - h);
        const reels = [c, ...RNG.shuffle([0, 1, 2, 3, 4].filter(x => x !== c)).slice(0, RNG.int(1, 3))];
        reels.forEach(cc => { for (let rr = r0; rr < r0 + h; rr++) if (!g[cc][rr].sc) g[cc][rr] = { ...s, c: 'gold', fresh: true }; });
        rt.msg(`🔗 Stack'n'Sync: pilhas de ${s.name} em ${reels.length} rolos`);
      }
      await rt.drop(g);
      await pay(rt, lines(g, L20, SY));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'aguiaalfa', name: 'Águia Alfa', studio: STUDIO, art: 'eagle', mascot: 'mountain',
      tag: "Stack'n'Sync · dourado até x100", colors: ['#78716c', '#ca8a04'], bg: 'linear-gradient(180deg,#e7e5e4,#a8a29e 40%,#44403c)',
      cols: 5, rows: 4, maxWin: 10000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Alpha Eagle" (Hacksaw Gaming).', hello: 'Pilhas sincronizadas nos rolos!',
      symbols: [...SY, WILD, SNS, GOLD, SC],
      lineList: { cols: 5, rows: 4, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ["🔗 <b>Stack'n'Sync:</b> o símbolo copia uma <b>pilha sincronizada</b> (2 a 4 de altura) para 1 a 3 outros rolos", "🦅 O <b>Stack'n'Sync dourado</b> empilha todos os rolos com símbolos altos ou coringas e um multiplicador de <b>x2 a x100</b>", '🏔️ 3/4/5 bônus = <b>7/10/15 rodadas grátis</b> com muito mais pilhas', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 20 linhas. O símbolo Stack\'n\'Sync cria uma pilha de um mesmo símbolo no rolo dele e copia a mesma pilha, na mesma altura, para 1 a 3 outros rolos.</p>',
      features: '<p>🏔️ <b>3, 4 ou 5 bônus</b> dão <b>7, 10 ou 15 rodadas grátis</b>, com Stack\'n\'Sync (normal e dourado) bem mais frequentes.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { await rt.fsLoop({ 3: 7, 4: 10 }[sc] || 15, async () => { await play(rt, make('fw')); }, { sub: 'Mais pilhas sincronizadas' }); },
    }));
  })();

  /* 34. Livro do Tempo — livro clássico e relógios multiplicadores */
  (() => {
    const L20x3 = K.LINES_5x3.slice(0, 20);
    const SY = [S('canny', 'can', 'Canny', [1, 10, 100, 500], 2, { min: 2 }), S('relogio', 'alarm', 'Relógio', [0.5, 4, 40, 200], 3, { min: 2 }), S('cartola', 'tophat', 'Cartola', [3, 30, 150], 4), S('varinha', 'magicwand', 'Varinha', [2, 20, 100], 4), ...R([[0.5, 2.5, 10], [0.5, 2.5, 10], [0.5, 2, 8], [0.5, 2, 8]])];
    const BOOK = { id: 'w', img: 'goldbook', name: 'Livro', wild: true, sc: true, w: 0.9, fw: 0.45 };
    const CLOCK = { id: 'clk', img: 'watch', name: 'Homem-Relógio', clockman: true, noPay: true, w: 0.35 };
    const ACT = { id: 'act', img: 'hourglassflow', name: 'Ativador', act: true, noPay: true, reels: [1, 2, 3], w: 0, fw: 0.6 };
    const draw = pool([...SY, BOOK, CLOCK, ACT]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    App.register(K.create({
      id: 'livrotempo', name: 'Livro do Tempo', studio: STUDIO, art: 'alarm', mascot: 'can',
      tag: 'Livro clássico · relógios até x12', colors: ['#7c3aed', '#ca8a04'], bg: 'linear-gradient(180deg,#312e81,#4c1d95 50%,#1e1b4b)',
      cols: 5, rows: 3, maxWin: 10000, vol: 4, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Book of Time" (Hacksaw Gaming).', hello: 'Que horas são?',
      symbols: [...SY, BOOK, CLOCK, ACT],
      lineList: { cols: 5, rows: 3, list: L20x3, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(2, 4), SY, 'Canny e Relógio pagam a partir de 2.')],
      highlights: ['📖 5×3 com 20 linhas; o livro é coringa e scatter', '3 livros = <b>"É um Clássico!"</b>: 10 giros com um <b>símbolo especial que expande</b>', '⌚ 3 Homens-Relógio = <b>"Que Horas São?"</b>: 10 giros com 3 relógios sobre os rolos do meio; o ativador cria <b>coringas relógio x2 a x12</b> que ficam', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas no estilo livro.</p>',
      features: '<p>📖 <b>É um Clássico!</b> (3 livros): 10 rodadas grátis com um símbolo especial que expande pelos rolos quando aparece o suficiente para pagar. ⌚ <b>Que Horas São?</b> (3 Homens-Relógio): 10 rodadas grátis com três relógios acima dos rolos 2 a 4; quando o ativador cai num desses rolos, aquele relógio avança (até x12) e deixa um coringa multiplicador preso no lugar.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); await rt.spin(g); await pay(rt, lines(g, L20x3, SY));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { kind: 'book' }); }
        else if (count(g, x => x.clockman) >= 3) { await rt.wait(800); await this.bonus(rt, { kind: 'clock' }); }
      },
      async bonus(rt, { kind = RNG.float() < 0.5 ? 'book' : 'clock' } = {}) {
        if (kind === 'book') {
          const sp = RNG.pick(SY);
          await rt.reveal('SÍMBOLO ESPECIAL', SY.map(s => ({ img: s.img, letter: s.letter, label: s.name })), SY.indexOf(sp));
          await rt.fsLoop(10, async () => {
            const g = make('fw'); await rt.spin(g, { tease: false }); await pay(rt, lines(g, L20x3, SY));
            const cols = [...new Set(cells(g, x => x.id === sp.id).map(([c]) => c))];
            if (cols.length >= (sp.min || 3)) { cols.forEach(c => { g[c] = g[c].map(() => ({ ...sp, c: 'gold', fresh: true })); }); await rt.drop(g); const v = 20 * sp.pays[Math.min(cols.length - (sp.min || 3), sp.pays.length - 1)] / 4; rt.win(v); rt.msg(`📖 ${sp.name} expandiu: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(800); }
          }, { title: 'É UM CLÁSSICO!', sub: `Especial: ${sp.name}` });
          return;
        }
        const clk = [0, 2, 2, 2, 0], sticky = new Map();
        await rt.fsLoop(10, async () => {
          const g = make('fw');
          sticky.forEach((m, k) => { const [c, r] = unkey(k); g[c][r] = mult({ ...BOOK, sc: false, c: 'sticky' }, m); });
          rt.head(clk.map((m, c) => (c >= 1 && c <= 3 ? `⌚x${m}` : '')));
          await rt.spin(g, { tease: false });
          cells(g, x => x.act).forEach(([c, r]) => { clk[c] = Math.min(12, clk[c] + 1); sticky.set(key(c, r), clk[c]); g[c][r] = mult({ ...BOOK, sc: false, c: 'gold', fresh: true }, clk[c]); rt.msg(`⌚ Relógio do rolo ${c + 1}: x${clk[c]}`); });
          await rt.drop(g);
          await pay(rt, lines(g, L20x3, SY, { mult: 'add' }));
        }, { title: 'QUE HORAS SÃO?', sub: 'Coringas relógio x2 a x12' });
        rt.head(null);
      },
    }));
  })();

  /* 35. Gemas do Gronk — símbolos carregados e a Gema Épica */
  (() => {
    const SY = csyms([['rubi', 'gem', 'Rubi'], ['safira', 'bluediamond', 'Safira'], ['esmeralda', 'greenheart', 'Esmeralda'], ['topazio', 'orangediamond', 'Topázio'], ['ametista', 'purpleheart', 'Ametista'], ['quartzo', 'whiteheart', 'Quartzo'], ['pedra', 'rock', 'Pedra']]);
    const EPIC = { id: 'epica', img: 'crystal', name: 'Gema Épica', epic: true, noPay: true, w: 0.15, fw: 0.3 };
    const SC = { id: 'sc', img: 'troll', name: 'Bônus', sc: true, w: 0.42, fw: 0.3 };
    const draw = pool([...SY, EPIC, SC]);
    const make = wk => grid([6, 6, 6, 6, 6, 6], c => draw(c, wk));
    async function play(rt, g, wk, charged, m = 1) {
      const ch = charged || new Set();
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c, wk), evaluate: gg => { const r = payClusters(clusters(gg, 5), TT); r.cells.forEach(k => ch.add(k)); return r; }, mult: () => m });
      rt.mark([...ch], 'hl');
      if (g.flat().some(x => x.epic) && ch.size >= 5) {
        // a Gema Épica transforma todas as casas carregadas no maior símbolo
        const best = SY[0 + Math.min(...[...ch].map(k => { const [c, r] = unkey(k); const i = SY.findIndex(s => s.id === g[c][r].id); return i < 0 ? 6 : i; }))] || SY[6];
        ch.forEach(k => { const [c, r] = unkey(k); g[c][r] = { ...best, c: 'gold', fresh: true }; });
        g.forEach((col, c) => col.forEach((x, r) => { if (x.epic) g[c][r] = { ...best, c: 'gold', fresh: true }; }));
        rt.msg(`💎 Gema Épica: ${ch.size} casas viraram ${best.name}!`); rt.fx('boom');
        await rt.drop(g);
        await tumble(rt, g, { draw: c => draw(c, wk), evaluate: gg => payClusters(clusters(gg, 5), TT), mult: () => m });
        if (!charged) ch.clear();
      }
      if (!charged) ch.clear();
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'gemasgronk', name: 'Gemas do Gronk', studio: STUDIO, art: 'troll', mascot: 'crystal',
      tag: 'Gema Épica transforma tudo', colors: ['#7c3aed', '#16a34a'], bg: 'radial-gradient(circle at 50% 30%,#3b0764,#0f0518 70%)',
      cols: 6, rows: 6, maxWin: 7500, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Gronk\'s Gems" (Hacksaw Gaming).', hello: 'Grupos deixam as casas carregadas!',
      symbols: [...SY, EPIC, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['💎 6×6 com grupos e cascata', '⚡ Casas de grupos vencedores ficam <b>carregadas</b>', '🔮 A <b>Gema Épica</b> transforma todas as casas carregadas no <b>símbolo mais valioso</b> entre elas', '🧌 3+ bônus = <b>10 rodadas grátis</b> com casas carregadas que <b>ficam</b> de um giro para o outro', 'Prêmio máximo: <b>7.500x</b>'],
      how: '<p>Grade 6×6: grupos de 5+ iguais encostados pagam e somem (cascata). As casas por onde passaram ganhos ficam carregadas. Se uma Gema Épica estiver na tela no fim, todas as casas carregadas viram o símbolo mais valioso que havia nelas, e a cascata continua.</p>',
      features: '<p>🧌 <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas). As casas carregadas ficam de um giro para o outro.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const ch = new Set(); await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', ch, 1) >= 3) api.add(5); }, { sub: 'Casas carregadas ficam' }); },
    }));
  })();

  /* 36. Garotos do Bowery — cofres, chaves e o banco */
  (() => {
    const SY = asyms([['chefe', 'detective', 'Chefe da gangue'], ['pistola', 'pistol', 'Pistola'], ['cartola', 'tophat', 'Cartola'], ['relogio', 'watch', 'Relógio'], ['dado', 'dice2', 'Dado'], ['carta', 'cards', 'Cartas'], ['charuto', 'cigar', 'Charuto'], ['moeda', 'coin', 'Moeda'], ['garrafa', 'bottle', 'Garrafa']]);
    const BOX = { id: 'cofre', img: 'safe', name: 'Cofre', box: true, noPay: true, w: 0.25, fw: 0.45 };
    const KEY = { id: 'chave', img: 'oldkey', name: 'Chave', key: true, noPay: true, w: 0.25, fw: 0.45 };
    const SC = { id: 'sc', img: 'bank', name: 'Bônus', sc: true, w: 0.6, fw: 0.3 };
    const draw = pool([...SY, BOX, KEY, SC]);
    const make = wk => grid([5, 5, 5, 5, 5, 5], c => draw(c, wk));
    async function play(rt, g, wk, bank) {
      await rt.drop(g);
      const r = await tumble(rt, g, { draw: c => draw(c, wk), evaluate: gg => K.anywhere(gg, SY, T9), keep: x => x.box || x.key });
      let m = 0;
      if (count(g, x => x.key)) m = cells(g, x => x.box).reduce((s) => s + wm(BIG), 0);
      let win = r.total * (m > 1 ? m - 1 : 0);
      if (m > 1 && r.total) { rt.win(win); rt.msg(`🔑 Chave abriu ${count(g, x => x.box)} cofre(s): x${m}`); rt.fx('big'); await rt.wait(800); }
      if (bank) {
        // Banco do Bowery: o ganho do giro vai para o cofre; dados multiplicam e o $ libera
        bank.v += r.total * Math.max(1, m);
        if (RNG.float() < 0.12) { const d = RNG.int(2, 5); bank.v *= d; rt.msg(`🎲 Dado: cofre x${d}`); }
        rt.chip('bank', 'COFRE', K.short(bank.v) + 'x');
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'garotosbowery', name: 'Garotos do Bowery', studio: STUDIO, art: 'safe', mascot: 'detective',
      tag: 'Cofres até x100 · banco da gangue', colors: ['#78350f', '#1c1917'], bg: 'linear-gradient(180deg,#44403c,#292524 60%,#0c0a09)',
      cols: 6, rows: 5, maxWin: 10000, vol: 5, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "The Bowery Boys" (Hacksaw Gaming).', hello: 'Ache a chave para os cofres!',
      symbols: [...SY, BOX, KEY, SC],
      tables: [table('Pagamento por quantidade', ['8–9', '10–11', '12+'], SY, 'Paga em qualquer lugar (8+ iguais), com cascata.')],
      highlights: ['🎩 6×5 que paga em qualquer lugar, com cascata', '🔐 <b>Cofres</b> guardam multiplicadores (x2 a x100) e só abrem se cair uma <b>chave</b> no mesmo giro; vários cofres se somam', '🏦 3+ bônus = <b>Banco do Bowery</b>: 10 giros em que os ganhos vão para o cofre da gangue; <b>dados</b> multiplicam o cofre e ele é pago no fim', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 6×5: 8 ou mais iguais em qualquer posição pagam e somem (cascata). Cofres e chaves ficam na grade durante as cascatas; se houver chave, todos os cofres abrem e os multiplicadores deles se somam e multiplicam o ganho.</p>',
      features: '<p>🏦 <b>3 ou mais bônus</b> abrem o <b>Banco do Bowery</b> (10 rodadas grátis, +5 com 3 nelas): os ganhos ficam guardados no cofre da gangue, os dados podem multiplicar tudo o que está guardado (x2 a x5) e o valor é pago no fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, 'w', null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const bank = { v: 0 };
        // os ganhos dos giros grátis são guardados (rt.win é desviado para o cofre)
        const win0 = rt.win.bind(rt);
        rt.win = x => { bank.v += x > 0 ? x : 0; };
        try { await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', bank) >= 3) api.add(5); }, { title: 'BANCO DO BOWERY', sub: 'Ganhos guardados no cofre' }); } finally { rt.win = win0; }
        rt.chip('bank', null);
        if (bank.v) { rt.win(bank.v); rt.msg(`🏦 O cofre pagou ${rt.coins(bank.v)}`); rt.fx('jackpot'); await rt.wait(1000); }
      },
    }));
  })();

  /* 37. Motoqueiros S.A. (Outlaws Inc) — multiplicador global */
  (() => {
    const SY = lsyms([['gorila', 'gorilla', 'Gorila'], ['pato', 'duck', 'Pato'], ['moto', 'motorcycle', 'Moto'], ['capacete', 'helmet', 'Capacete']]);
    const WILD = { id: 'w', img: 'flame2', name: 'Coringa', wild: true, w: 0.6 };
    const COU = { id: 'puma', img: 'leopard', name: 'Puma (+)', cou: true, noPay: true, w: 0.3, fw: 0.5 };
    const ORC = { id: 'orc', img: 'ogre', name: 'Orc (×)', orc: true, noPay: true, w: 0.08, fw: 0.15 };
    const STAR = { id: 'estrela', img: 'glowstar', name: 'Estrela', star: true, noPay: true, w: 0.15, fw: 0.2 };
    const SC = { id: 'sc', img: 'skull', name: 'Bônus', sc: true, w: 0.85, fw: 0 };
    const draw = pool([...SY, WILD, COU, ORC, STAR, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, st, api) {
      await rt.spin(g, { tease: false });
      let m = st ? st.m : 1;
      cells(g, x => x.cou).forEach(() => { m += RNG.int(1, 5); });
      cells(g, x => x.orc).forEach(() => { m *= RNG.pick([2, 2, 3]); });
      m = Math.min(st ? 500 : 50, m);
      if (st) st.m = m;
      if (m > 1) rt.chip('mult', 'GLOBAL', 'x' + m);
      const stars = count(g, x => x.star);
      await pay(rt, lines(g, L26, SY), m);
      if (stars) { const n = stars * (st ? 1 : 1); if (api) api.add(n); else st && 0; rt.msg(`⭐ +${n} giro${n > 1 ? 's' : ''} extra${n > 1 ? 's' : ''}`); }
      if (!st) rt.chip('mult', null);
      return { sc: count(g, x => x.sc), stars };
    }
    App.register(K.create({
      id: 'motoqueiros', name: 'Motoqueiros S.A.', studio: STUDIO, art: 'motorcycle', mascot: 'gorilla',
      tag: 'Pumas somam, orcs multiplicam', colors: ['#7c3aed', '#16a34a'], bg: 'linear-gradient(180deg,#1f2937,#4c1d95 50%,#14532d)',
      cols: 5, rows: 4, maxWin: 10000, vol: 5, rtp: '~96,2%', target: 0.963,
      intro: 'Inspirado no "Outlaws Inc" (Hacksaw Gaming).', hello: 'O multiplicador global está de olho!',
      symbols: [...SY, WILD, COU, ORC, STAR, SC],
      lineList: { cols: 5, rows: 4, list: L26, text: '26 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🏍️ 5×4 com 26 linhas', '🐆 <b>Pumas</b> somam +1 a +5 no <b>multiplicador global</b>; 👹 <b>orcs</b> multiplicam ele por x2 ou x3', '⭐ Estrelas dão <b>giros extras</b>', '💀 3+ bônus = <b>10 rodadas grátis</b> com o multiplicador global que <b>não zera</b> (até x500)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 26 linhas. O multiplicador global começa em x1 a cada giro: cada puma soma +1 a +5 e cada orc multiplica por 2 ou 3, e o resultado vale para os ganhos daquele giro. Estrelas no jogo base dão um giro extra grátis.</p>',
      features: '<p>💀 <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b>. O multiplicador global continua de um giro para o outro (até x500) e cada estrela dá +1 giro.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); const r = await play(rt, g, null, null);
        if (r.sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
        else if (r.stars) { for (let i = 0; i < Math.min(3, r.stars); i++) { const g2 = make('w'); await play(rt, g2, null, null); } }
      },
      async bonus(rt) { const st = { m: 1 }; await rt.fsLoop(10, async api => { await play(rt, make('fw'), st, api); }, { sub: 'Multiplicador global não zera' }); rt.chip('mult', null); },
    }));
  })();

  /* 38. Cubos 2 — a grade cresce até 11×11 */
  (() => {
    const COLORS = [['amarelo', 'yellowsquare', 'Amarelo'], ['azul', 'bluesquare', 'Azul'], ['vermelho', 'redsquare', 'Vermelho'], ['verde', 'greensquare', 'Verde'], ['rosa', 'pinksquare', 'Rosa'], ['roxo', 'purplesquare', 'Roxo']];
    const CUBE = [0.15, 0.3, 0.6, 1, 2, 5];
    const SY = COLORS.map(([id, img, name]) => S(id, img, name, CUBE, 1));
    const draw = pool(SY);
    const LOCK = () => ({ id: 'lock', img: null, c: 'locked', noPay: true });
    const TC = n => (n < 5 ? -1 : n <= 7 ? 0 : n <= 10 ? 1 : n <= 15 ? 2 : n <= 25 ? 3 : n <= 45 ? 4 : 5);
    const make = (size = 5) => grid(Array(11).fill(11), (c, r) => { const off = (11 - size) / 2; return c < off || r < off || c >= 11 - off || r >= 11 - off ? LOCK() : draw(c); });
    async function play(rt, g, st) {
      let size = st ? st.size : 5;
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c),
        evaluate: gg => {
          const res = payClusters(clusters(gg, 5), TC, k => (k.n >= 70 ? 10 : 1));
          if (st && res.total) { const col = res.wins.find(w => w.sym.id === st.color); if (col) { st.got += col.n; rt.chip('cor', 'COR', st.got); } }
          return res;
        },
        keep: x => x.id === 'lock',
        onStep: async (s, gg) => {
          // cada ganho abre um anel: a grade cresce 1 casa em cada direção
          if (size < 11) {
            size += 2; const off = (11 - size) / 2;
            gg.forEach((col, c) => col.forEach((x, r) => { if (x.id === 'lock' && c >= off && r >= off && c < 11 - off && r < 11 - off) gg[c][r] = { ...draw(c), fresh: true }; }));
            rt.msg(`🧊 A grade cresceu para ${size}×${size}`);
          }
        },
      });
      if (st) { st.size = size; while (st.got >= st.next) { const v = st.prize; rt.win(v); rt.msg(`💰 ${st.next} cubos da cor escolhida: +${rt.coins(v)}`); st.next += 10; st.prize *= 2; } }
    }
    App.register(K.create({
      id: 'cubos2', name: 'Cubos 2', studio: STUDIO, art: 'bluesquare', mascot: 'redsquare',
      tag: 'Grade cresce até 11×11', colors: ['#3b82f6', '#ec4899'], bg: 'linear-gradient(135deg,#1e1b4b,#312e81 40%,#831843)',
      cols: 11, rows: 11, maxWin: 10500, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Cubes 2" (Hacksaw Gaming).', hello: 'Cada ganho aumenta a grade!',
      symbols: SY,
      tables: [table('Pagamento por tamanho do grupo', ['5–7', '8–10', '11–15', '16–25', '26–45', '46+'], SY, 'Todas as cores pagam igual. Grupos de 70+ valem x10.')],
      highlights: ['🧊 Sem símbolos: só <b>cubos de 6 cores</b> que pagam igual, em grupos de 5+', '📈 Começa em <b>5×5</b> e <b>cresce uma casa em cada direção</b> a cada ganho, até <b>11×11</b>', '💥 Grupo de <b>70+ cubos</b> = <b>x10</b>', '🎨 Bônus: escolha uma cor; a grade não encolhe e juntar cubos dessa cor paga prêmios extras', 'Prêmio máximo: <b>10.500x</b>'],
      how: '<p>A grade começa 5×5. Grupos de 5 ou mais cubos da mesma cor pagam e somem (cascata); a cada cascata a grade ganha um anel novo de cubos, até 11×11. No próximo giro ela volta a 5×5.</p>',
      features: '<p>🎨 <b>Rodadas grátis</b> (sem scatter): o bônus pode aparecer <b>de surpresa</b> no fim de qualquer giro (em média 1 vez a cada ~400 giros) ou pela compra. Escolha uma cor; durante 10 giros a grade <b>não volta</b> a 5×5 e, a cada 10 cubos da sua cor em ganhos, você recebe um prêmio em dinheiro que dobra a cada vez.</p>',
      make: () => make(5),
      async spin(rt) { const g = make(5); await play(rt, g, null); if (RNG.float() < 0.0025) { await rt.wait(600); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const color = await rt.choose('ESCOLHA SUA COR', SY.map(s => ({ id: s.id, img: s.img, label: s.name })));
        const st = { size: 5, color, got: 0, next: 10, prize: 0.5 };
        await rt.fsLoop(10, async () => { await play(rt, make(st.size), st); }, { sub: 'A grade não encolhe' });
        rt.chip('cor', null);
      },
    }));
  })();

  /* 39. Xpander — o Saltador multiplicador */
  (() => {
    const SY = csyms([['sete', 'seven', 'Sete'], ['sino', 'bell2', 'Sino'], ['melancia', 'watermelon', 'Melancia'], ['uva', 'grapes', 'Uva'], ['limao', 'lemon', 'Limão'], ['cereja', 'cherries', 'Cereja'], ['laranja', 'tangerine', 'Laranja']]);
    const DBL = { id: 'dbl', img: 'heavyplus', name: 'Dobrar', dbl: true, noPay: true, w: 0.25, fw: 0.4 };
    const GROW = { id: 'grow', img: 'up', name: 'Crescer', grow: true, noPay: true, w: 0.2, fw: 0.35 };
    const SC = { id: 'sc', img: 'rocket', name: 'Bônus', sc: true, w: 0.36, fw: 0.25 };
    const draw = pool([...SY, DBL, GROW, SC]);
    const make = wk => grid([7, 7, 7, 7, 7, 7, 7], c => draw(c, wk));
    async function play(rt, g, wk, hop) {
      const H = hop || { size: 1, m: 1 };
      H.c = RNG.int(0, 7 - H.size); H.r = RNG.int(0, 7 - H.size);
      const inside = (c, r) => c >= H.c && c < H.c + H.size && r >= H.r && r < H.r + H.size;
      const deco = gg => gg.forEach((col, c) => col.forEach((x, r) => { if (inside(c, r)) { x.c = 'mult'; x.t = r === H.r && c === H.c ? 'x' + H.m : x.t; } }));
      const powerups = gg => { cells(gg, x => x.dbl || x.grow).forEach(([c, r]) => { const x = gg[c][r]; if (x.dbl) H.m = Math.min(128, H.m * 2); else H.size = Math.min(4, H.size + 1); gg[c][r] = { ...draw(c, wk), fresh: true }; }); H.c = Math.min(H.c, 7 - H.size); H.r = Math.min(H.r, 7 - H.size); rt.chip('hop', 'SALTADOR', `${H.size}×${H.size} x${H.m}`); };
      powerups(g); deco(g);
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c, wk),
        evaluate: gg => payClusters(clusters(gg, 5), TT, k => (k.cells.some(kk => { const [c, r] = unkey(kk); return inside(c, r); }) ? H.m : 1)),
        onStep: async (s, gg) => { powerups(gg); deco(gg); },
      });
      if (!hop) rt.chip('hop', null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'xpander', name: 'Xpander', studio: STUDIO, art: 'up', mascot: 'seven',
      tag: 'Saltador até 4×4 e x128', colors: ['#a21caf', '#06b6d4'], bg: 'linear-gradient(180deg,#0f0a1f,#4c1d95 50%,#155e75)',
      cols: 7, rows: 7, maxWin: 10000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Xpander" (Hacksaw Gaming).', hello: 'Grupos que tocam o Saltador são multiplicados!',
      symbols: [...SY, DBL, GROW, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🍒 7×7 com grupos e cascata', '🟪 O <b>Saltador</b> é uma área multiplicadora: grupos que encostam nele são multiplicados', '➕ <b>Dobrar</b> dobra o multiplicador (até <b>x128</b>); ⬆️ <b>Crescer</b> aumenta o Saltador de 1×1 até <b>4×4</b>', '🚀 3+ bônus = <b>10 rodadas grátis</b> em que o Saltador <b>não zera</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam e somem (cascata). O Saltador aparece num lugar aleatório a cada giro; grupos que têm pelo menos uma casa dentro dele recebem o multiplicador. Símbolos de dobrar e crescer melhoram o Saltador durante o giro.</p>',
      features: '<p>🚀 <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas). O tamanho e o multiplicador do Saltador ficam guardados de um giro para o outro.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const hop = { size: 1, m: 1 }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', hop) >= 3) api.add(5); }, { sub: 'O Saltador não zera' }); rt.chip('hop', null); },
    }));
  })();
})();
