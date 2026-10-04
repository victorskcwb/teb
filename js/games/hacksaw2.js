'use strict';

/* =========================================================
   Hacksaw Gaming — lote 2 (parte 1). Regras baseadas nos
   originais (grades de grupos, linhas fixas, multiplicadores
   enormes e bônus escalonados); RTP calibrado por simulação.
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'hacksaw';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const R = (pays, w) => K.ROYALS(pays, w);
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };
  const BIG = [{ m: 2, w: 45 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 9 }, { m: 25, w: 4 }, { m: 50, w: 1.5 }, { m: 100, w: 0.5 }];
  const HUGE = [...BIG, { m: 200, w: 0.15 }];
  const wm = list => RNG.weighted(list).m;
  const near = (c, r) => [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
  const TT = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
  const CLH = ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'];
  const CP = [[1, 2, 4, 10, 30, 150], [0.8, 1.5, 3, 7, 20, 100], [0.6, 1.2, 2.5, 5, 15, 60], [0.5, 1, 2, 4, 10, 40], [0.4, 0.8, 1.5, 3, 8, 30], [0.3, 0.6, 1.2, 2.5, 6, 25], [0.25, 0.5, 1, 2, 5, 20]];
  const csyms = list => list.map(([id, img, name], i) => S(id, img, name, CP[i], [6, 7, 8, 9, 10, 11, 12][i]));
  const LP = [[2, 5, 15], [1.5, 4, 10], [1, 3, 8], [0.8, 2, 5], [0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]];
  const lsyms = list => [...list.map(([id, img, name], i) => S(id, img, name, LP[i], [3, 4, 4, 5][i])), ...R(LP.slice(4))];
  const fsTab = o => `<table class="paytable"><tr class="si-head"><td>Scatters</td><td>Rodadas grátis</td></tr>${Object.entries(o).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>`;
  const L14 = K.linesFor(4, 14), L19 = K.linesFor(5, 19), L26 = K.linesFor(4, 26);

  /* 1. Medo do Escuro — Lua Cheia e Giros da Escuridão */
  (() => {
    const SY = csyms([['lobisomem', 'wolf', 'Lobisomem'], ['fantasma', 'ghost', 'Fantasma'], ['morcego', 'bat', 'Morcego'], ['abobora', 'pumpkin', 'Abóbora'], ['osso', 'bone', 'Osso'], ['aranha', 'spider', 'Aranha'], ['vela', 'candle', 'Vela']]);
    const MOON = { id: 'lua', img: 'fullmoonface', name: 'Homem-Lua', moon: true, noPay: true, w: 0.25, fw: 0.35 };
    const SC = { id: 'sc', img: 'lantern', name: 'Vela FS', sc: true, w: 0.55, fw: 0.3 };
    const draw = pool([...SY, MOON, SC]);
    const LOCKED = () => ({ id: 'lock', img: null, c: 'locked', noPay: true });
    const make = (wk, size = 6) => grid([6, 6, 6, 6, 6, 6], (c, r) => { const off = (6 - size) / 2; return c < off || r < off || c >= 6 - off || r >= 6 - off ? LOCKED() : draw(c, wk); });
    async function play(rt, g, wk, size = 6) {
      // Lua Cheia: símbolos altos ganham multiplicador
      if (g.flat().some(x => x.moon)) {
        g.forEach(col => col.forEach(x => { if (x.pays && SY.indexOf(SY.find(s => s.id === x.id)) < 3 && RNG.float() < 0.6) mult(x, wm(BIG)); }));
        rt.msg('🌕 Lua Cheia! Símbolos altos com multiplicador'); rt.fx('rise');
      }
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c, wk),
        evaluate: gg => payClusters(clusters(gg, 5), TT, k => k.cells.reduce((s, kk) => { const [c, r] = unkey(kk); return s + (gg[c][r].m || 0); }, 0) || 1),
        keep: x => x.id === 'lock',
      });
      return { sc: count(g, x => x.sc), moon: count(g, x => x.moon) };
    }
    App.register(K.create({
      id: 'medoescuro', name: 'Medo do Escuro', studio: STUDIO, art: 'fullmoonface', mascot: 'ghost',
      tag: 'Lua Cheia até x100 · grade que encolhe', colors: ['#4c1d95', '#a3e635'], bg: 'radial-gradient(circle at 50% 10%,#4c1d95,#0b0518 70%)',
      cols: 6, rows: 6, maxWin: 5000, vol: 3, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Fear the Dark" (Hacksaw Gaming).', hello: 'Cuidado com a Lua Cheia!',
      symbols: [...SY, MOON, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['👻 6×6 com grupos e cascata', '🌕 O <b>Homem-Lua</b> dá multiplicadores de <b>x2 a x100</b> aos símbolos altos; num grupo eles se somam', '🕯️ 3/4 velas = <b>10/15 rodadas grátis</b> (+4 por vela nelas)', 'Depois, os <b>Giros da Escuridão</b>: a grade encolhe para 4×4 e 2×2; Lua ou vela a reabrem e dão +2 giros', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 6×6: grupos de 5+ iguais encostados pagam e somem (cascata). Quando o 🌕 Homem-Lua aparece, os três símbolos mais altos da tela podem receber multiplicadores (x2 a x100), que se somam no grupo.</p>',
      features: '<p>🕯️ <b>3 ou 4 velas</b> dão <b>10 ou 15 rodadas grátis</b>; cada vela durante elas dá +4. Quando os giros acabam começam os <b>Giros da Escuridão</b>: a área de jogo encolhe para 4×4 e depois 2×2. Se cair uma Lua ou uma vela, a grade volta a 6×6 e você ganha +2 giros.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const r = await play(rt, g, 'w'); if (r.sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc: r.sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        let size = 6;
        await rt.fsLoop(sc >= 4 ? 15 : 10, async api => {
          if (api.left === 0 && size > 2) { size -= 2; api.add(1, true); rt.msg(`🌑 Escuridão: a grade encolheu para ${size}×${size}`); }
          const g = make('fw', size);
          const r = await play(rt, g, 'fw', size);
          if (r.sc && size === 6) api.add(4 * r.sc);
          if ((r.sc || r.moon) && size < 6) { size = 6; api.add(2); rt.msg('🕯️ A luz voltou: grade 6×6 e +2 giros!'); }
        }, { sub: 'Depois vêm os Giros da Escuridão' });
      },
    }));
  })();

  /* 2. Mares Malditos — baús amaldiçoados com multiplicador de rolo */
  (() => {
    const SY = lsyms([['capitao', 'skull', 'Capitão caveira'], ['papagaio', 'parrot', 'Papagaio'], ['sabre', 'dagger', 'Sabre'], ['bussola', 'compass', 'Bússola']]);
    const WILD = { id: 'w', img: 'pirateflag', name: 'Coringa', wild: true, w: 0.8 };
    const CHEST = { id: 'bau', img: 'chest', name: 'Baú amaldiçoado', wild: true, chest: true, w: 0.35, fw: 0.35 };
    const SC = { id: 'sc', img: 'lantern', name: 'Lanterna', sc: true, w: 0.95 };
    const draw = pool([...SY, WILD, CHEST, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, st) {
      // baú: tudo do baú para cima no rolo vira área amaldiçoada (coringa) com multiplicador x2 a x200
      const chests = cells(g, x => x.chest);
      for (const [c, r] of chests) {
        const m = st && st.reel[c] ? st.reel[c] : wm(st ? BIG : HUGE);
        for (let rr = 0; rr <= r; rr++) g[c][rr] = mult({ ...WILD, c: 'gold', fresh: true }, m);
        if (st) st.reel[c] = m;
        rt.msg(`🏴‍☠️ Baú amaldiçoado: rolo ${c + 1} x${m}`); rt.fx('boom');
      }
      if (st) st.reel.forEach((m, c) => { if (m && !chests.some(([cc]) => cc === c)) g[c] = g[c].map(x => (x.sc ? x : mult({ ...WILD, c: 'sticky' }, m))); });
      if (chests.length || st) await rt.drop(g);
      await pay(rt, lines(g, L26, SY, { mult: 'add' }));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'maresmalditos', name: 'Mares Malditos', studio: STUDIO, art: 'chest', mascot: 'skull',
      tag: 'Baús amaldiçoados até x200', colors: ['#0f766e', '#1e293b'], bg: 'linear-gradient(180deg,#134e4a,#0f172a 60%,#020617)',
      cols: 5, rows: 4, maxWin: 12500, vol: 5, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Cursed Seas" (Hacksaw Gaming).', hello: 'Abra os baús amaldiçoados!',
      symbols: [...SY, WILD, CHEST, SC],
      lineList: { cols: 5, rows: 4, list: L26, text: '26 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['🏴‍☠️ 5×4 com 26 linhas', '📦 O <b>baú amaldiçoado</b> amaldiçoa o rolo dele para cima: tudo vira coringa com <b>x2 a x200</b>', '🏮 3 lanternas = <b>10 rodadas grátis</b>: rolos amaldiçoados <b>ficam</b> coringa até o fim', 'Prêmio máximo: <b>12.500x</b>'],
      how: '<p>Grade 5×4 com 26 linhas. Quando um baú cai, ele e todas as casas acima dele no rolo viram coringas com o mesmo multiplicador (x2 a x200). Multiplicadores na mesma linha se somam.</p>',
      features: '<p>🏮 <b>3 lanternas</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas). Todo rolo amaldiçoado <b>continua coringa</b> com o multiplicador até o fim do bônus.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { reel: [0, 0, 0, 0, 0] }; await rt.fsLoop(10, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); if (await play(rt, g, st) >= 3) api.add(5); }, { sub: 'Rolos amaldiçoados ficam!' }); },
    }));
  })();

  /* 3. Templo do Tormento — escaravelhos dourados que expandem */
  (() => {
    const SY = lsyms([['anubis', 'jackal', 'Anúbis'], ['ra', 'sunbehind', 'Rá'], ['ankh', 'ankh', 'Ankh'], ['olho', 'eye', 'Olho']]);
    const WILD = { id: 'w', img: 'pyramid', name: 'Coringa', wild: true, w: 0.9, fw: 1.1 };
    const SCAR = { id: 'esc', img: 'scarab', name: 'Escaravelho dourado', wild: true, scarab: true, reels: [1, 2, 3], w: 0.22, fw: 0.45 };
    const SC = { id: 'sc', img: 'jackal', name: 'Anúbis bônus', sc: true, w: 0.85, fw: 0 };
    const draw = pool([...SY, WILD, SCAR, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, sticky) {
      if (sticky) sticky.forEach(kk => { const [c, r] = unkey(kk); if (!g[c][r].scarab) g[c][r] = { ...WILD, c: 'sticky' }; });
      for (const [c] of cells(g, x => x.scarab)) {
        if (!g[c].some(x => x.scarab)) continue;
        // expande no rolo; cada coringa atravessado soma x2 a x200
        const m = g[c].filter(x => x.wild && !x.scarab).reduce((s) => s + wm(HUGE), 0);
        const test = g.map(col => col.slice());
        test[c] = g[c].map(() => (m ? mult({ ...SCAR }, m) : { ...SCAR }));
        if (lines(test, L14, SY, { mult: 'add' }).total > lines(g, L14, SY, { mult: 'add' }).total) {
          g[c] = test[c].map(x => ({ ...x, c: 'gold', fresh: true }));
          rt.msg(`🪲 Escaravelho expandiu no rolo ${c + 1}${m ? ` · x${m}` : ''}`); rt.fx('boom');
        }
      }
      await rt.drop(g);
      await pay(rt, lines(g, L14, SY, { mult: 'add' }));
      if (sticky) cells(g, x => x.wild && !x.scarab).forEach(([c, r]) => sticky.add(key(c, r)));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'templotormento', name: 'Templo do Tormento', studio: STUDIO, art: 'scarab', mascot: 'jackal',
      tag: 'Escaravelhos até x200', colors: ['#ca8a04', '#7f1d1d'], bg: 'linear-gradient(180deg,#451a03,#1c1917 60%,#0c0a09)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Temple of Torment" (Hacksaw Gaming).', hello: 'Escaravelhos expandem pelos rolos!',
      symbols: [...SY, WILD, SCAR, SC],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['🪲 <b>Escaravelho dourado</b> (rolos 2 a 4) expande pelo rolo quando forma ganho', 'Cada coringa que ele atravessa soma <b>x2 a x200</b>', '🐺 3/4/5 Anúbis = <b>10/12/14 rodadas grátis</b> com coringas <b>colantes</b> e mais escaravelhos', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. O escaravelho dourado é coringa; se expandir pelo rolo ajudar num ganho, ele expande. Cada coringa comum que estava no caminho vira um multiplicador (x2 a x200) somado no rolo.</p>',
      features: `<p>🐺 Nas rodadas grátis todos os coringas comuns <b>grudam</b> e os escaravelhos aparecem mais.</p>${fsTab({ 3: 10, 4: 12, 5: 14 })}`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const st = new Set(); await rt.fsLoop({ 3: 10, 4: 12 }[sc] || 14, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, st); }, { sub: 'Coringas colantes' }); },
    }));
  })();

  /* 4. Segure-as! (Keep'em) — coletores e rolos que ficam */
  (() => {
    const SY = [S('canny', 'can', 'Lata Canny', [1, 2.5, 6, 15], 3), S('passaro', 'bird', 'Pássaro Bob', [0.8, 2, 5, 12], 4), S('cogumelo', 'mushroom', 'Cogumelo', [0.6, 1.5, 4, 9], 5), S('bolota', 'chestnut', 'Bolota', [0.5, 1.2, 3, 7], 5), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const COIN = { id: 'moeda', img: 'coin', name: "Cash'em", coin: true, noPay: true, w: 1.3, fw: 2.4 };
    const GET = { id: 'get', img: 'magnet', name: "Get'em", get: true, noPay: true, reels: [0, 5], w: 0.5, fw: 1.3 };
    const SC = { id: 'sc', img: 'fourleaf', name: 'Bônus', sc: true, w: 0.55 };
    const draw = pool([...SY, COIN, GET, SC]);
    const VALS = [{ v: 0.2, w: 40 }, { v: 0.5, w: 30 }, { v: 1, w: 15 }, { v: 2, w: 8 }, { v: 5, w: 4 }, { v: 10, w: 2 }, { v: 25, w: 0.6 }, { v: 100, w: 0.1 }];
    const cell = (c, wk) => { const x = draw(c, wk); if (x.coin) { x.v = RNG.weighted(VALS).v; x.t = K.short(x.v) + 'x'; } return x; };
    const make = wk => grid([5, 5, 5, 5, 5, 5], c => cell(c, wk));
    async function play(rt, g, st) {
      if (st) st.keep.forEach(c => { g[c] = g[c].map(x => (x.get ? x : { ...GET, c: 'sticky' })); });
      await rt.spin(g, { tease: !st });
      await pay(rt, ways(g, SY));
      const gets = count(g, x => x.get), v = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);
      if (gets && v) { rt.mark(cells(g, x => x.coin || x.get).map(([c, r]) => key(c, r))); rt.win(v * gets); rt.msg(`🧲 Get'em coletou ${rt.coins(v)}${gets > 1 ? ` × ${gets}` : ''}`); rt.fx('coin'); await rt.wait(800); }
      // nas grátis o rolo com Get'em vira um rolo Keep'em colante
      if (st) cells(g, x => x.get).forEach(([c]) => { if (!st.keep.includes(c) && st.keep.length < 2) { st.keep.push(c); rt.msg(`📌 Keep'em! Rolo ${c + 1} fica coletando`); } });
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'segureas', name: "Segure-as!", studio: STUDIO, art: 'can', mascot: 'bird',
      tag: "Cash'em · Get'em · Keep'em", colors: ['#16a34a', '#f59e0b'], bg: 'linear-gradient(180deg,#bbf7d0,#4ade80 50%,#14532d)',
      cols: 6, rows: 5, maxWin: 10000, vol: 3, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Keep\'em" (Hacksaw Gaming).', hello: "Get'em coleta as moedas!",
      symbols: [...SY, COIN, GET, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×5 = 15.625 caminhos.')],
      highlights: ['🥫 6×5 com 15.625 caminhos', "🪙 Moedas <b>Cash'em</b> (0,2x a 100x) e coletores <b>Get'em</b> nos rolos 1 e 6", "🍀 3 bônus = <b>10 rodadas grátis</b>: um rolo com Get'em vira <b>Keep'em</b> e fica coletando todo giro (até 2)", 'Prêmio máximo: <b>10.000x</b>'],
      how: "<p>Grade 6×5 que paga por caminhos. Quando um <b>Get'em</b> (rolos 1 e 6) aparece junto com moedas, ele coleta o valor de todas; dois Get'em coletam em dobro.</p>",
      features: "<p>🍀 <b>3 bônus</b> dão <b>10 rodadas grátis</b>. O primeiro e o segundo rolo onde cair um Get'em viram rolos <b>Keep'em</b>: ficam cheios de coletores até o fim.</p>",
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { keep: [] }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), st) >= 3) api.add(5); }, { sub: "Rolos Keep'em coletam todo giro" }); },
    }));
  })();

  /* 5 e 6. Bússola (Cash Compass / Let it Snow) — símbolo que se espalha e roda de bônus */
  function compass(o) {
    const SY = csyms(o.syms);
    const COMP = { id: 'comp', img: o.compImg, name: o.compName, comp: true, noPay: true, w: 0.45, fw: 0.8 };
    const SC = { id: 'sc', img: o.scImg, name: o.scName, sc: true, w: 0.42, fw: 0.3 };
    const draw = pool([...SY, COMP, SC]);
    const make = wk => grid([6, 6, 6, 6, 6, 6], c => draw(c, wk));
    const WHEEL = [{ k: 's', v: 3, w: 25 }, { k: 's', v: 5, w: 18 }, { k: 's', v: 10, w: 6 }, { k: 'x', v: 2, w: 14 }, { k: 'c', v: 10, w: 10 }, { k: 'c', v: 25, w: 5 }, { k: 'c', v: 250, w: 0.4 }, { k: 'end', v: 0, w: 22 }];
    async function play(rt, g, wk, m = 1) {
      // bússola: espalha um símbolo pela linha ou coluna na direção sorteada
      for (const [c, r] of cells(g, x => x.comp)) {
        const s = RNG.pick(SY), d = RNG.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        g[c][r] = { ...s, c: 'gold', fresh: true };
        for (let a = c + d[0], b = r + d[1]; g[a] && g[a][b]; a += d[0], b += d[1]) if (!g[a][b].sc) g[a][b] = { ...s, c: 'gold', fresh: true };
        rt.msg(`${o.emoji} ${o.compName} espalhou ${s.name}!`);
      }
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c, wk), evaluate: gg => payClusters(clusters(gg, 5), TT), mult: () => m });
      return count(g, x => x.sc);
    }
    return K.create({
      id: o.id, name: o.name, studio: STUDIO, art: o.compImg, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: 6, rows: 6, maxWin: 7400, vol: 4, rtp: '~96,4%', target: 0.964,
      intro: o.intro, hello: `${o.compName} espalha símbolos!`,
      symbols: [...SY, COMP, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: [`${o.emoji} 6×6 com grupos e cascata`, `🧭 ${o.compName} <b>espalha um símbolo</b> por toda a linha ou coluna em uma direção`, `${o.scEmoji} 3 ${o.scName.toLowerCase()}s = <b>roda de bônus</b>: giros grátis (até 50), multiplicador x2 e prêmios em dinheiro até 250x, até cair a caveira`, 'Prêmio máximo: <b>7.400x</b>'],
      how: `<p>Grade 6×6: grupos de 5+ iguais encostados pagam e somem (cascata). Quando cai ${o.compName.toLowerCase()}, ela vira um símbolo sorteado e espalha esse símbolo em linha reta (para cima, baixo, esquerda ou direita) até a borda.</p>`,
      features: `<p>${o.scEmoji} <b>3 ${o.scName.toLowerCase()}s</b> giram a <b>roda de bônus</b> várias vezes até cair a 💀 caveira: cada parada soma giros grátis (+3, +5 ou +10, até 50), dobra o multiplicador das rodadas grátis ou paga em dinheiro (10x, 25x ou 250x). Depois os giros acumulados são jogados.</p>`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w') >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        let spins = 0, m = 1;
        for (let guard = 0; guard < 20; guard++) {
          const idx = WHEEL.indexOf(RNG.weighted(WHEEL));
          await rt.reveal('RODA DE BÔNUS', WHEEL.map(x => ({ img: x.k === 'end' ? 'skull' : x.k === 'c' ? 'coin' : o.scImg, label: x.k === 's' ? `+${x.v} giros` : x.k === 'x' ? 'mult. x2' : x.k === 'c' ? x.v + 'x' : 'FIM' })), idx);
          const w = WHEEL[idx];
          if (w.k === 'end') { if (spins || guard) break; else continue; }
          if (w.k === 's') spins = Math.min(50, spins + w.v);
          if (w.k === 'x') m = Math.min(16, m * 2);
          if (w.k === 'c') { rt.win(w.v); rt.fx('coin'); }
        }
        if (!spins) spins = 3;
        rt.chip('mult', 'MULT.', 'x' + m);
        await rt.fsLoop(spins, async () => { await play(rt, make('fw'), 'fw', m); }, { sub: `${spins} giros · x${m}` });
        rt.chip('mult', null);
      },
    });
  }
  App.register(compass({
    id: 'deixenevar', name: 'Deixe Nevar', mascot: 'snowman', compImg: 'snowflake', compName: 'Floco espalhador', emoji: '❄️', scImg: 'gift', scName: 'Presente', scEmoji: '🎁',
    tag: 'Símbolo que se espalha · roda até 50 giros', colors: ['#38bdf8', '#dc2626'], bg: 'linear-gradient(180deg,#e0f2fe,#bae6fd 50%,#1e3a8a)',
    intro: 'Inspirado no "Let it Snow" (Hacksaw Gaming).',
    syms: [['papainoel', 'santa', 'Papai Noel'], ['rena', 'deer', 'Rena'], ['boneco', 'snowman', 'Boneco de neve'], ['arvore', 'christmastree', 'Árvore'], ['meia', 'sock', 'Meia'], ['bengala', 'candycane', 'Bengala'], ['sino', 'bell2', 'Sino']],
  }));
  App.register(compass({
    id: 'bussolatesouro', name: 'Bússola do Tesouro', mascot: 'island', compImg: 'compass', compName: 'Bússola', emoji: '🧭', scImg: 'worldmap', scName: 'Mapa', scEmoji: '🗺️',
    tag: 'Bússola espalha símbolos · 7.400x', colors: ['#0891b2', '#ca8a04'], bg: 'linear-gradient(180deg,#a5f3fc,#fde68a 60%,#ca8a04)',
    intro: 'Inspirado no "Cash Compass" (Hacksaw Gaming).',
    syms: [['bau', 'chest', 'Baú'], ['caveira', 'skull', 'Caveira'], ['luneta', 'telescope', 'Luneta'], ['ancora', 'anchor', 'Âncora'], ['concha', 'shell', 'Concha'], ['coco', 'coconut', 'Coco'], ['estrela', 'starfish', 'Estrela-do-mar']],
  }));

  /* 7. Multiplicador Miami */
  (() => {
    const SY = [S('pordosol', 'sunset', 'Pôr do sol', [1, 3, 10], 3), S('drink', 'cocktail', 'Drink', [0.8, 2.5, 8], 4), S('golfinho', 'dolphin', 'Golfinho', [0.6, 2, 6], 4), S('palmeira', 'palm', 'Palmeira', [0.5, 1.5, 5], 5), S('sorvete', 'icecream', 'Sorvete', [0.3, 1, 3], 6), S('melancia', 'watermelon', 'Melancia', [0.25, 0.8, 2.5], 7), S('cereja', 'cherries', 'Cereja', [0.2, 0.6, 2], 8)];
    const WILD = { id: 'w', img: 'flamingo', name: 'Coringa', wild: true, w: 0.7 };
    const MX = { id: 'mx', img: 'sparkles', name: 'Multiplicador', mx: true, noPay: true, t: '+1', w: 0.6, fw: 2 };
    const SC = { id: 'sc', img: 'sunglasses', name: 'Óculos', sc: true, w: 0.7 };
    const draw = pool([...SY, WILD, MX, SC]);
    const make = wk => grid([4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      const n = count(g, x => x.mx);
      let m = 1 + n;
      if (st) { st.m = Math.min(60, st.m + n); m = st.m; rt.chip('mult', 'MULT.', 'x' + m); }
      await pay(rt, ways(g, SY, { min: 3 }), m);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'miamimult', name: 'Multiplicador Miami', studio: STUDIO, art: 'flamingo', mascot: 'sunglasses',
      tag: 'Multiplicador total até x60', colors: ['#ec4899', '#06b6d4'], bg: 'linear-gradient(180deg,#f0abfc,#ec4899 40%,#0e7490)',
      cols: 4, rows: 4, maxWin: 5000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Miami Multiplier" (Hacksaw Gaming).', hello: 'Cada ✨ soma +1 no multiplicador!',
      symbols: [...SY, WILD, MX, SC],
      tables: [table('Pagamento por caminho', heads(3, 2, ' rolos'), SY, '4×4 = 256 caminhos.')],
      highlights: ['🌴 4×4 com 256 caminhos', '✨ Cada símbolo de multiplicador soma <b>+1</b> no multiplicador do giro', '🕶️ 3/4 óculos = <b>8/15 rodadas grátis</b> com multiplicador total que <b>não zera</b> (até x60)', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 4×4 com 256 caminhos (3 ou 4 rolos seguidos). Cada ✨ na tela soma +1 ao multiplicador daquele giro.</p>',
      features: '<p>🕶️ <b>3 ou 4 óculos</b> dão <b>8 ou 15 rodadas grátis</b>. O multiplicador total começa em x1 e cada ✨ soma +1 de forma permanente, até <b>x60</b>.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const st = { m: 1 }; await rt.fsLoop(sc >= 4 ? 15 : 8, async api => { if (await play(rt, make('fw'), st) >= 3) api.add(5); }, { sub: 'Multiplicador total até x60' }); rt.chip('mult', null); },
    }));
  })();

  /* 8. Os Respinners — banda que dá respins */
  (() => {
    const BAND = [S('vocal', 'microphone', 'Vocalista', [1, 3, 10], 3), S('guitarra', 'guitar', 'Guitarrista', [0.8, 2.5, 8], 4), S('baixo', 'violin', 'Baixista', [0.6, 2, 6], 4), S('bateria', 'drum', 'Baterista', [0.5, 1.5, 5], 5)];
    const SY = [...BAND, ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'guitar2', name: 'Coringa', wild: true, w: 0.6 };
    const SC = { id: 'sc', img: 'ticket', name: 'Ingresso', sc: true, w: 0.85 };
    const draw = pool([...SY, WILD, SC]);
    const make = (wk = 'w', fs = false) => grid([4, 4, 4, 4, 4], c => { const x = draw(c, wk); if (fs && BAND.some(b => b.id === x.id) && RNG.float() < 0.5) mult(x, RNG.pick([2, 2, 3, 5])); return x; });
    async function play(rt, g, fs) {
      if (!fs && RNG.float() < 0.025) { const n = RNG.int(3, 12); for (let i = 0; i < n; i++) g[RNG.int(1, 4)][RNG.int(0, 3)] = { ...WILD, fresh: true }; rt.msg(`🤘 A plateia enlouqueceu: +${n} coringas!`); }
      await rt.spin(g, { tease: !fs });
      let res = ways(g, SY);
      await pay(rt, res);
      // respin: integrantes da banda que ganharam ficam presos
      const held = new Set();
      for (let guard = 0; guard < 6 && !rt.capped; guard++) {
        const newB = res.wins.filter(w => BAND.includes(w.sym) && !held.has(w.sym.id)).map(w => w.sym.id);
        if (!newB.length) break;
        newB.forEach(id => held.add(id));
        rt.msg(`🎸 Respin! ${[...held].length} integrante${held.size > 1 ? 's' : ''} no palco`); rt.fx('rise');
        const ng = make(fs ? 'fw' : 'w', fs);
        g.forEach((col, c) => col.forEach((x, r) => { if (held.has(x.id)) ng[c][r] = { ...x, c: 'sticky' }; }));
        g.splice(0, 5, ...ng);
        await rt.spin(g, { tease: false });
        res = ways(g, SY);
        await pay(rt, res);
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'respinners', name: 'Os Respinners', studio: STUDIO, art: 'guitar', mascot: 'microphone',
      tag: 'A banda dá respins', colors: ['#dc2626', '#111827'], bg: 'linear-gradient(180deg,#111827,#7f1d1d 60%,#0b0f19)',
      cols: 5, rows: 4, maxWin: 5150, vol: 3, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "The Respinners" (Hacksaw Gaming).', hello: 'Ganhe com a banda e ganhe respin!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos.')],
      highlights: ['🎤 5×4 com 1.024 caminhos', '🎸 Ganho com um <b>integrante da banda</b> = <b>respin</b> com os símbolos dele presos; outro integrante novo = outro respin', '🤘 <b>A Plateia Enlouquece:</b> até 12 coringas aleatórios', '🎫 3 ingressos = <b>12 rodadas grátis</b> com integrantes multiplicadores', 'Prêmio máximo: <b>5.150x</b>'],
      how: '<p>Grade 5×4 com 1.024 caminhos. Quando um dos quatro integrantes da banda forma ganho, os símbolos dele ficam presos e os outros giram de novo; cada novo integrante vencedor dá mais um respin.</p>',
      features: '<p>🎫 <b>3 ingressos</b> dão <b>12 rodadas grátis</b>. Os integrantes da banda podem vir com multiplicadores x2, x3 ou x5 (multiplicam os caminhos).</p>',
      make: () => make(),
      async spin(rt) { const g = make(); if (await play(rt, g, false) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { await rt.fsLoop(12, async api => { if (await play(rt, make('fw', true), true) >= 3) api.add(4); }, { sub: 'Integrantes multiplicadores' }); },
    }));
  })();

  /* 9. Giro Asteca — linhas completas ficam e multiplicam */
  (() => {
    const SY = csyms([['mascara', 'moai', 'Máscara'], ['jaguar', 'leopard', 'Jaguar'], ['serpente', 'snake', 'Serpente'], ['cacau', 'chestnut', 'Cacau'], ['jade', 'greenheart', 'Jade'], ['pena', 'feather', 'Pena'], ['milho', 'corn', 'Milho']]).map((x, i) => ({ ...x, fw: x.w * (i >= 4 ? 2 : 1) }));
    const SC = { id: 'sc', img: 'sun', name: 'Sol', sc: true, w: 0.55, fw: 0.3 };
    const WILD = { id: 'w', img: 'eagle', name: 'Coringa', wild: true, w: 0.35 };
    const draw = pool([...SY, SC, WILD]);
    const make = wk => grid([8, 8, 8, 8, 8], c => draw(c, wk));
    const fullRows = g => { const out = []; for (let r = 0; r < 8; r++) { const base = g.map(col => col[r]).find(x => !x.wild); if (base && !base.sc && g.every(col => col[r].id === base.id || col[r].wild)) out.push(r); } return out; };
    async function play(rt, g, wk, st) {
      await rt.spin(g, { tease: !st });
      const held = new Map();
      for (let guard = 0; guard < 6 && !rt.capped; guard++) {
        const rows = fullRows(g).filter(r => !held.has(r));
        if (!rows.length) break;
        rows.forEach(r => held.set(r, RNG.int(2, 5)));
        if (st) { st.mask += rows.length; rt.chip('mask', 'MÁSCARA', `${Math.min(8, st.mask)}/8`); }
        rt.msg(`🌀 Linha completa! Respin com ${held.size} linha${held.size > 1 ? 's' : ''} presa${held.size > 1 ? 's' : ''}`); rt.fx('rise');
        const ng = make(wk);
        held.forEach((m, r) => g.forEach((col, c) => { ng[c][r] = { ...col[r], c: 'sticky' }; }));
        g.splice(0, 5, ...ng);
        await rt.spin(g, { tease: false });
      }
      const mr = [...held.values()].reduce((a, b) => a + b, 0) || 1;
      const gm = st ? (st.mask >= 8 ? 10 : 1 + st.mask) : 1;
      await pay(rt, payClusters(clusters(g, 5), TT), mr * gm, held.size ? ` (linhas x${mr})` : '');
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'giroasteca', name: 'Giro Asteca', studio: STUDIO, art: 'moai', mascot: 'eagle',
      tag: 'Linhas completas dão respin', colors: ['#16a34a', '#ca8a04'], bg: 'linear-gradient(180deg,#14532d,#365314 60%,#1a2e05)',
      cols: 5, rows: 8, cellH: 0.8, maxWin: 6900, vol: 3, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Aztec Twist" (Hacksaw Gaming).', hello: 'Complete uma linha inteira!',
      symbols: [...SY, SC, WILD],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados.')],
      highlights: ['🗿 5 colunas × 8 linhas com grupos de 5+', '🌀 Uma <b>linha inteira</b> do mesmo símbolo fica presa, ganha multiplicador <b>x2 a x5</b> e dá <b>respin</b>', '☀️ 3 sóis = <b>8 rodadas grátis</b>: cada linha completa acende uma parte da <b>Máscara Dourada</b> e soma +1 no multiplicador; com as 8, tudo vale <b>x10</b>', 'Prêmio máximo: <b>6.900x</b>'],
      how: '<p>Grade 5×8 com grupos de 5 ou mais iguais encostados. Se uma linha horizontal inteira for do mesmo símbolo, ela fica presa com um multiplicador (x2 a x5) e o resto gira de novo; novas linhas completas repetem. No fim, os multiplicadores das linhas se somam e valem para o ganho.</p>',
      features: '<p>☀️ <b>3 sóis</b> dão <b>8 rodadas grátis</b>. Cada linha completa acende uma das 8 partes da <b>Máscara Dourada</b> e soma +1 num multiplicador que não zera; com a máscara completa, os ganhos passam a valer <b>x10</b>.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { mask: 0 }; rt.chip('mask', 'MÁSCARA', '0/8'); await rt.fsLoop(8, async api => { if (await play(rt, make('fw'), 'fw', st) >= 3) api.add(4); }, { sub: 'Monte a Máscara Dourada' }); rt.chip('mask', null); },
    }));
  })();

  /* 10. Fortuna da Floresta — vento clona coringas */
  (() => {
    const SY = csyms([['coruja', 'owl', 'Coruja'], ['raposa', 'fox', 'Raposa'], ['ourico', 'hedgehog', 'Ouriço'], ['cogumelo', 'mushroom', 'Cogumelo'], ['joaninha', 'ladybug', 'Joaninha'], ['folha', 'leaf', 'Folha'], ['bolota', 'chestnut', 'Bolota']]);
    const WILD = { id: 'w', img: 'tornado', name: 'Coringa do vento', wild: true, w: 0.22 };
    const SC = { id: 'sc', img: 'butterfly', name: 'Borboleta', sc: true, w: 0.8, fw: 0 };
    const SPEC = { id: 'esp', img: 'flower2', name: 'Flor multiplicadora', spec: true, noPay: true, w: 0, fw: 0.9 };
    const draw = pool([...SY, WILD, SC, SPEC]);
    const make = wk => grid([5, 5, 5, 5, 5], c => { const x = draw(c, wk); if (x.spec) mult(x, wm(BIG)); return x; });
    async function play(rt, g, wk, st) {
      const ws = cells(g, x => x.wild);
      if (ws.length) {
        const d = RNG.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        ws.forEach(([c, r]) => { for (let i = 1; i <= ws.length; i++) { const a = c + d[0] * i, b = r + d[1] * i; if (g[a] && g[a][b] && !g[a][b].sc) g[a][b] = { ...WILD, fresh: true }; } });
        rt.msg(`🌬️ Vento! ${ws.length} coringa${ws.length > 1 ? 's' : ''} clonado${ws.length > 1 ? 's' : ''} ${ws.length}x`); rt.fx('rise');
      }
      await rt.drop(g);
      const res = payClusters(clusters(g, 5), TT);
      let m = 1;
      if (st) { const sp = g.flat().filter(x => x.spec); if (sp.length) { st.m += sp.reduce((s, x) => s + x.m, 0); st.hit = true; rt.chip('mult', 'MULT.', 'x' + st.m); } m = st.m; }
      await pay(rt, res, m);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'fortunafloresta', name: 'Fortuna da Floresta', studio: STUDIO, art: 'butterfly', mascot: 'owl',
      tag: 'Vento clona coringas · 10.000x', colors: ['#15803d', '#f59e0b'], bg: 'linear-gradient(180deg,#d9f99d,#4d7c0f 60%,#1a2e05)',
      cols: 5, rows: 5, maxWin: 10000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Forest Fortune" (Hacksaw Gaming).', hello: 'O vento espalha os coringas!',
      symbols: [...SY, WILD, SC, SPEC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados.')],
      highlights: ['🌲 5×5 com grupos de 5+', '🌬️ <b>Vento:</b> os coringas são soprados numa direção e cada um é <b>clonado tantas vezes quantos coringas houver</b>', '🦋 3 borboletas = <b>3 giros grátis que reiniciam</b> sempre que cai uma flor multiplicadora (x2 a x100), cujo valor <b>soma</b> no multiplicador', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×5 com grupos de 5 ou mais iguais encostados. Quando cai coringa, o vento sopra numa direção aleatória e cada coringa deixa um rastro de cópias do tamanho do número total de coringas.</p>',
      features: '<p>🦋 <b>3 borboletas</b> dão <b>3 rodadas grátis</b>. Flores multiplicadoras (x2 a x100) podem cair: o valor delas soma num multiplicador que não zera, e cada vez que uma cair os giros voltam para 3.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { m: 1 };
        await rt.fsLoop(3, async api => { st.hit = false; const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, 'fw', st); if (st.hit) api.add(3 - api.left, true); }, { sub: 'Flores reiniciam os 3 giros', label: 'GIROS' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 11. Arco-Íris Duplo — nuvens acendem rolos multiplicadores */
  (() => {
    const SY = csyms([['unicornio', 'unicorn', 'Unicórnio'], ['pote', 'honeypot', 'Pote de ouro'], ['trevo', 'shamrock', 'Trevo'], ['ferradura', 'horseshoe', 'Ferradura'], ['moeda', 'coin', 'Moeda'], ['estrela', 'star2', 'Estrela'], ['gota', 'droplet', 'Gota']]);
    const CLOUD = { id: 'nuvem', img: 'cloud', name: 'Nuvem', cloud: true, noPay: true, w: 0.09, fw: 0.6 };
    const WILD = { id: 'w', img: 'rainbow', name: 'Coringa', wild: true, w: 0.25 };
    const draw = pool([...SY, CLOUD, WILD]);
    const make = wk => grid([6, 6, 6, 6, 6, 6, 6], c => draw(c, wk));
    const COLORS = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬜'];
    // cores coletadas ficam guardadas entre os giros até completar o arco-íris
    const got = Array(7).fill(false);
    const show = (rt, lit) => rt.head(lit.map((m, c) => (m ? `${COLORS[c]}x${m}` : got[c] ? COLORS[c] : '·')));
    async function play(rt, g, wk, lit) {
      await rt.drop(g);
      const light = gg => cells(gg, x => x.cloud).forEach(([c, r]) => { got[c] = true; if (!lit[c]) lit[c] = wm([{ m: 2, w: 40 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 10 }, { m: 25, w: 6 }, { m: 50, w: 3 }, { m: 250, w: 0.4 }]); gg[c][r] = { ...draw(c, wk), fresh: true }; while (gg[c][r].cloud) gg[c][r] = { ...draw(c, wk), fresh: true }; });
      light(g); show(rt, lit);
      await tumble(rt, g, {
        draw: c => draw(c, wk),
        evaluate: gg => payClusters(clusters(gg, 5), TT, k => { const cs = new Set(k.cells.map(kk => unkey(kk)[0])); return [...cs].reduce((s, c) => s + (lit[c] || 0), 0) || 1; }),
        onStep: async (s, gg) => { light(gg); show(rt, lit); },
      });
      if (got.every(Boolean)) { got.fill(false); return true; }
      return false;
    }
    App.register(K.create({
      id: 'arcoirisduplo', name: 'Arco-Íris Duplo', studio: STUDIO, art: 'rainbow', mascot: 'unicorn',
      tag: 'Rolos coloridos até x250', colors: ['#ec4899', '#38bdf8'], bg: 'linear-gradient(180deg,#fbcfe8,#c4b5fd 40%,#7dd3fc)',
      cols: 7, rows: 6, maxWin: 5000, vol: 3, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Double Rainbow" (Hacksaw Gaming).', hello: 'Nuvens acendem os rolos!',
      symbols: [...SY, CLOUD, WILD],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🌈 7×6 com grupos e cascata', '☁️ Cada <b>nuvem</b> acende o rolo dela com uma cor e um multiplicador de <b>x2 a x250</b>; grupos somam os multiplicadores dos rolos que tocam', 'As cores ficam guardadas entre os giros: juntando as <b>7 cores</b>, começam os <b>Respins do Arco-Íris</b> com tudo aceso e multiplicadores <b>x10</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 7×6: grupos de 5+ iguais encostados pagam e somem (cascata). Uma nuvem acende o rolo onde caiu com um multiplicador; ele vale para os grupos que passam por aquele rolo até o fim do giro.</p>',
      features: '<p>🌈 Cada rolo aceso guarda a sua cor (indicada acima da grade) de um giro para o outro. Juntando as <b>7 cores</b>, começam os <b>Respins do Arco-Íris</b>: 5 respins com todos os rolos acesos e os multiplicadores multiplicados por <b>10</b>. A compra de bônus leva direto aos respins (começando com 3 rolos acesos).</p>',
      make: () => make('w'),
      async spin(rt) { const lit = Array(7).fill(0); const full = await play(rt, make('w'), 'w', lit); if (full) { await rt.wait(900); await this.bonus(rt, { lit: lit.map(m => m || RNG.pick([2, 3, 5])) }); } },
      async bonus(rt, { lit } = {}) {
        let L = lit ? lit.map(m => m * 10) : Array(7).fill(0).map((_, c) => (c < 3 ? 10 * RNG.pick([2, 3, 5]) : 0));
        await rt.fsLoop(5, async () => { const l2 = L.slice(); await play(rt, make('fw'), 'fw', l2); L = l2.map((m, c) => m || 0); }, { title: 'RESPINS DO ARCO-ÍRIS', sub: '5 respins · multiplicadores x10', label: 'RESPINS' });
        rt.head(null);
      },
    }));
  })();

  /* 12. Colheita Selvagem — girassóis multiplicadores que pulam */
  (() => {
    const SY = csyms([['milho', 'corn', 'Milho'], ['abobora', 'pumpkin', 'Abóbora'], ['tomate', 'tomato', 'Tomate'], ['cenoura', 'carrot', 'Cenoura'], ['berinjela', 'eggplant', 'Berinjela'], ['batata', 'potato', 'Batata'], ['ervilha', 'peapod', 'Ervilha']]);
    const SUN = { id: 'w', img: 'sunflower', name: 'Girassol', wild: true, w: 0 };
    const SEED = { id: 'seed', img: 'seedling', name: 'Semente', seed: true, noPay: true, w: 0.3, fw: 0.45 };
    const FERT = { id: 'adubo', img: 'bucket', name: 'Adubo', fert: true, noPay: true, w: 0.15, fw: 0.25 };
    const EPIC = { id: 'epico', img: 'potion', name: 'Adubo épico', epic: true, noPay: true, w: 0.04, fw: 0.08 };
    const DROP = { id: 'gota', img: 'droplet', name: 'Gota', drop: true, noPay: true, w: 0.2 };
    const SC = { id: 'sc', img: 'tractor', name: 'Trator', sc: true, w: 0.36, fw: 0.25 };
    const draw = pool([...SY, SEED, FERT, EPIC, DROP, SC]);
    const make = wk => grid([7, 7, 7, 7, 7, 7, 7], c => draw(c, wk));
    async function play(rt, g, wk, st) {
      const flowers = st ? st.flowers : new Map();
      let drops = 0;
      const apply = gg => {
        cells(gg, x => x.seed).forEach(([c, r]) => { if (flowers.size < 4) flowers.set(key(c, r), 2); gg[c][r] = { ...draw(c, wk), fresh: true }; });
        cells(gg, x => x.fert || x.epic).forEach(([c, r]) => { const x = gg[c][r]; if (x.epic) flowers.forEach((m, k) => flowers.set(k, m + 1)); else if (flowers.size) { const k = RNG.pick([...flowers.keys()]); flowers.set(k, flowers.get(k) + 1); } gg[c][r] = { ...draw(c, wk), fresh: true }; });
        cells(gg, x => x.drop).forEach(([c, r]) => { drops = Math.min(5, drops + 1); gg[c][r] = { ...draw(c, wk), fresh: true }; });
        flowers.forEach((m, k) => { const [c, r] = unkey(k); gg[c][r] = mult({ ...SUN, c: 'sticky' }, m); });
      };
      for (let round = 0; round < 6; round++) {
        apply(g);
        await rt.drop(g);
        await tumble(rt, g, {
          draw: c => draw(c, wk),
          evaluate: gg => payClusters(clusters(gg, 5), TT, k => k.cells.reduce((s, kk) => { const [c, r] = unkey(kk); return s + (gg[c][r].m || 0); }, 0) || 1),
          keep: x => x.wild,
          onStep: async (s, gg) => {
            // girassóis pulam para outra casa e crescem +1
            const nf = new Map();
            flowers.forEach((m, k) => { let kk; do kk = key(RNG.int(0, 6), RNG.int(0, 6)); while (nf.has(kk)); nf.set(kk, Math.min(st ? 25 : 10, m + 1)); const [c, r] = unkey(k); gg[c][r] = { ...draw(c, wk), fresh: true }; });
            flowers.clear(); nf.forEach((m, k) => flowers.set(k, m));
            apply(gg);
          },
        });
        if (!drops || rt.capped) break;
        drops--;
        rt.msg(`💧 Gota de água: respin! (${drops} restantes)`);
        const ng = make(wk); g.splice(0, 7, ...ng);
      }
      if (!st) flowers.clear();
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'colheitaselvagem', name: 'Colheita Selvagem', studio: STUDIO, art: 'sunflower', mascot: 'corn',
      tag: 'Girassóis multiplicadores que pulam', colors: ['#facc15', '#15803d'], bg: 'linear-gradient(180deg,#fef9c3,#bef264 50%,#3f6212)',
      cols: 7, rows: 7, maxWin: 10000, vol: 4, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Harvest Wilds" (Hacksaw Gaming).', hello: 'Plante sementes e colha girassóis!',
      symbols: [...SY, SUN, SEED, FERT, EPIC, DROP, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🌻 7×7 com grupos e cascata', '🌱 Sementes viram <b>girassóis coringa x2</b> que <b>pulam</b> para outra casa e sobem <b>+1</b> a cada cascata (até 4 ao mesmo tempo)', '🪣 Adubo dá +1 num girassol; o épico dá +1 em todos', '💧 Gotas (até 5) dão <b>respins</b> no fim das cascatas', '🚜 3+ tratores = <b>10 rodadas grátis</b> com os girassóis guardados', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam (cascata). Girassóis são coringas com multiplicador; vários no mesmo grupo se somam. A cada cascata eles pulam para uma casa nova e crescem +1.</p>',
      features: '<p>🚜 <b>3 ou mais tratores</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas). Os girassóis ficam de um giro para o outro durante todo o bônus.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { flowers: new Map() }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', st) >= 3) api.add(5); }, { sub: 'Os girassóis ficam!' }); },
    }));
  })();

  /* 13. Caminho do Guerreiro — duelos de clãs */
  (() => {
    const CLANS = [S('vermelho', 'ninja', 'Clã Vermelho', [2, 5, 15], 3), S('azul', 'robot', 'Clã Azul', [1.5, 4, 12], 3), S('verde', 'ogre', 'Clã Verde', [1.2, 3, 10], 4), S('amarelo', 'goblin', 'Clã Amarelo', [1, 2.5, 8], 4)];
    const SY = [...CLANS, ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'katana', name: 'Coringa', wild: true, w: 0.6 };
    const VS = { id: 'vs', img: 'vs', name: 'VS', vs: true, noPay: true, reels: [1, 2, 3], w: 0.3, fw: 0.6 };
    const SC = { id: 'sc', img: 'cityscape', name: 'Cidade', sc: true, w: 0.8 };
    const all = [...SY, WILD, VS, SC];
    const make = (wk, out = new Set()) => { const d = pool(all.filter(s => !out.has(s.id))); return grid([4, 4, 4, 4, 4], c => d(c, wk)); };
    async function duel(rt, g) {
      for (const [c] of cells(g, x => x.vs)) {
        // duelo: o clã vencedor vira coringa multiplicador no rolo do VS
        const a = RNG.pick(CLANS), m = wm(BIG);
        g[c] = g[c].map(() => mult({ ...WILD, c: 'duel', fresh: true }, m));
        rt.msg(`⚔️ Duelo! ${a.name} venceu: rolo ${c + 1} coringa x${m}`); rt.fx('boom');
      }
      await rt.drop(g);
    }
    App.register(K.create({
      id: 'caminhoguerreiro', name: 'Caminho do Guerreiro', studio: STUDIO, art: 'ninja', mascot: 'katana',
      tag: 'Duelos de clãs até x100', colors: ['#dc2626', '#2563eb'], bg: 'linear-gradient(180deg,#0f172a,#312e81 50%,#7f1d1d)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Warrior Ways" (Hacksaw Gaming).', hello: 'Quatro clãs disputam a cidade!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos.')],
      highlights: ['🥷 5×4 com 1.024 caminhos e 4 clãs', '⚔️ <b>VS</b> nos rolos 2 a 4 abre um <b>duelo</b>: o rolo vira coringa com <b>x2 a x100</b>; vários no mesmo caminho se somam', '🏙️ 3+ cidades = <b>Conquista</b>: 10 rodadas grátis em que, a cada giro, <b>um clã é eliminado</b> (até sobrar um)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 1.024 caminhos. O símbolo VS nos rolos 2, 3 e 4 dispara um duelo: o rolo inteiro vira coringa com um multiplicador; com dois ou mais rolos de duelo no mesmo caminho eles se somam.</p>',
      features: '<p>🏙️ <b>3 ou mais cidades</b> dão <b>10 rodadas grátis</b> de <b>Conquista</b>: depois de cada um dos três primeiros giros um clã perde e seus símbolos somem dos rolos, deixando a grade cada vez mais concentrada.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await duel(rt, g); await pay(rt, ways(g, SY, { wildMult: 'add' })); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const out = new Set();
        await rt.fsLoop(10, async () => {
          const g = make('fw', out);
          await rt.spin(g, { tease: false }); await duel(rt, g); await pay(rt, ways(g, SY, { wildMult: 'add' }));
          if (out.size < 3) { const loser = RNG.pick(CLANS.filter(cl => !out.has(cl.id))); out.add(loser.id); rt.msg(`🏳️ ${loser.name} foi eliminado!`); }
        }, { title: 'CONQUISTA!', sub: 'Um clã sai a cada giro' });
      },
    }));
  })();

  /* 14. Porquinho Mágico — cartola transforma porquinhos */
  (() => {
    const SY = lsyms([['coelho', 'rabbitface', 'Coelho'], ['varinha', 'magicwand', 'Varinha'], ['cartas', 'cards', 'Cartas'], ['pomba', 'dove', 'Pomba']]);
    const PIG = { id: 'pig', img: 'pigface', name: 'Porquinho', pig: true, noPay: true, w: 1.6, fw: 3.2 };
    const HAT = { id: 'hat', img: 'tophat', name: 'Cartola mágica', hat: true, noPay: true, w: 0.3, fw: 0.8 };
    const WILD = { id: 'w', img: 'pigface', name: 'Porco coringa', wild: true, w: 0.4 };
    const SC = { id: 'sc', img: 'magicball', name: 'Bônus', sc: true, w: 0.5, fw: 0 };
    const draw = pool([...SY, PIG, HAT, WILD, SC]);
    const make = wk => grid([5, 5, 5, 5, 5], c => draw(c, wk));
    const BILL = [{ v: 1, w: 40 }, { v: 2, w: 25 }, { v: 5, w: 15 }, { v: 10, w: 9 }, { v: 25, w: 5 }, { v: 50, w: 3 }, { v: 100, w: 1.5 }, { v: 1000, w: 0.05 }];
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      const hats = count(g, x => x.hat);
      let cash = 0;
      if (hats) {
        // cartola: ela e todos os porquinhos viram coringas ou maços de notas (no Epig, os dois)
        const both = st && st.epig, asWild = both || RNG.float() < 0.5;
        g.forEach((col, c) => col.forEach((x, r) => {
          if (!x.pig && !x.hat) return;
          if (asWild) g[c][r] = { ...WILD, c: 'gold', fresh: true };
          if (!asWild || both) { const v = RNG.weighted(BILL).v; cash += v; if (!asWild) g[c][r] = { id: 'nota', img: 'banknote', name: 'Notas', noPay: true, t: v + 'x', fresh: true }; }
        }));
        rt.msg(`🎩 Abracadabra! ${asWild ? 'Porquinhos coringa' : ''}${both ? ' + ' : ''}${!asWild || both ? `notas ${rt.coins(cash)}` : ''}`); rt.fx('boom');
        await rt.drop(g);
        if (st) { st.meter += hats; if (st.meter >= 3) { st.meter -= 3; st.api.add(2); if (!st.epig) { st.epig = true; rt.msg('🐷 EPIG! Porquinhos viram coringa E notas'); } } rt.chip('pig', 'CARTOLAS', `${st.meter}/3${st.epig ? ' EPIG' : ''}`); }
      } else g.forEach((col, c) => col.forEach((x, r) => { if (x.pig) g[c][r] = { ...RNG.pick(SY) }; }));
      await pay(rt, lines(g, L19, SY));
      if (cash) { rt.win(cash); rt.fx('coin'); await rt.wait(600); }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'porquinhomagico', name: 'Porquinho Mágico', studio: STUDIO, art: 'pigface', mascot: 'tophat',
      tag: 'Cartola vira porquinhos em coringa ou notas', colors: ['#ec4899', '#7c3aed'], bg: 'linear-gradient(180deg,#fbcfe8,#c084fc 50%,#4c1d95)',
      cols: 5, rows: 5, maxWin: 7500, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Magic Piggy" (Hacksaw Gaming).', hello: 'A cartola faz mágica com os porquinhos!',
      symbols: [...SY, PIG, HAT, WILD, SC],
      lineList: { cols: 5, rows: 5, list: L19, text: '19 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🎩 5×5 com 19 linhas', '🐷 A <b>cartola mágica</b> transforma ela mesma e todos os porquinhos em <b>coringas</b> ou em <b>maços de notas</b> (1x a 1.000x)', '🔮 3 bônus = <b>10 rodadas grátis</b>: a cada 3 cartolas, +2 giros; na fase <b>Epig</b> os porquinhos viram coringa <b>e</b> nota', 'Prêmio máximo: <b>7.500x</b>'],
      how: '<p>Grade 5×5 com 19 linhas. Porquinhos só servem para a mágica: sem cartola eles viram símbolos comuns. Com cartola, todos viram coringas ou maços de notas que pagam o valor na hora.</p>',
      features: '<p>🔮 <b>3 bônus</b> dão <b>10 rodadas grátis</b>. Um medidor junta as cartolas: a cada 3, você ganha <b>+2 giros</b> e o bônus sobe para <b>Epig</b>, onde a mágica faz os dois efeitos ao mesmo tempo.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { meter: 0, epig: false }; await rt.fsLoop(10, async api => { st.api = api; await play(rt, make('fw'), st); }, { sub: 'Junte cartolas para o Epig' }); rt.chip('pig', null); },
    }));
  })();

  /* 15. Forjado na Tempestade — dois bônus nórdicos */
  (() => {
    const SY = lsyms([['viking', 'beardman', 'Viking'], ['surtur', 'fire', 'Surtur'], ['machado', 'axe', 'Machado'], ['escudo', 'shield', 'Escudo']]);
    const WILD = { id: 'w', img: 'lightning', name: 'Coringa que expande', wild: true, expand: true, w: 0.55, fw: 0.8 };
    const CHEST = { id: 'bau', img: 'chest', name: 'Baú', chest: true, noPay: true, w: 0.25 };
    const SCV = { id: 'scv', img: 'militaryhelmet', name: 'Viking bônus', sc: true, kind: 'v', w: 0.6, fw: 0 };
    const SCS = { id: 'scs', img: 'volcano', name: 'Surtur bônus', sc: true, kind: 's', w: 0.45, fw: 0 };
    const draw = pool([...SY, WILD, CHEST, SCV, SCS]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, mode, sticky) {
      if (sticky) sticky.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      // coringa que expande no rolo com multiplicador
      for (const [c] of cells(g, x => x.expand && !x.m)) { if (g[c].every(x => x.wild && x.m)) continue; const m = wm(HUGE); g[c] = g[c].map(() => mult({ ...WILD, c: 'gold', fresh: true }, m)); if (sticky && mode === 'v') sticky.set(c, m); }
      // mão de Surtur: queima um rolo aleatório em coringa
      if (mode === 's' && RNG.float() < 0.35) { const c = RNG.int(1, 4), m = wm(BIG); g[c] = g[c].map(() => mult({ ...WILD, c: 'gold', fresh: true }, m)); rt.msg(`🔥 Mão de Surtur queimou o rolo ${c + 1}: x${m}`); }
      await rt.drop(g);
      await pay(rt, lines(g, L14, SY, { mult: 'add' }));
      const ch = count(g, x => x.chest);
      if (ch) { const v = Array.from({ length: ch }, () => RNG.pick([1, 2, 5, 10, 20, 50])).reduce((a, b) => a + b, 0); rt.win(v); rt.msg(`📦 Baú do tesouro: ${rt.coins(v)}`); rt.fx('coin'); await rt.wait(600); }
      return g;
    }
    App.register(K.create({
      id: 'forjadotempestade', name: 'Forjado na Tempestade', studio: STUDIO, art: 'lightning', mascot: 'beardman',
      tag: 'Coringas até x200 · dois bônus', colors: ['#1d4ed8', '#ea580c'], bg: 'linear-gradient(180deg,#1e3a8a,#0f172a 50%,#7c2d12)',
      cols: 5, rows: 4, maxWin: 12500, vol: 5, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Stormforged" (Hacksaw Gaming).', hello: 'Portais de Muspelheim abertos!',
      symbols: [...SY, WILD, CHEST, SCV, SCS],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['⚡ Coringas que <b>expandem pelo rolo</b> com <b>x2 a x200</b>', '📦 Baús pagam prêmios na hora', '⛑️ 3+ vikings = <b>Guerreiros da Tempestade</b>: 10/12/14 giros com rolos coringa <b>colantes</b>', '🌋 3+ Surtur = <b>Vingança de Surtur</b>: 10/12/14 giros em que a <b>mão de fogo</b> queima rolos em coringa', 'Prêmio máximo: <b>12.500x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. O coringa de raio expande pelo rolo inteiro com um multiplicador (x2 a x200); na mesma linha os multiplicadores se somam. Baús pagam de 1x a 50x.</p>',
      features: '<p>⛑️ <b>3, 4 ou 5 vikings</b>: <b>Guerreiros da Tempestade</b> com 10, 12 ou 14 giros, e todo rolo de coringa fica preso até o fim. 🌋 <b>3, 4 ou 5 Surtur</b>: <b>Vingança de Surtur</b> com 10, 12 ou 14 giros, em que a mão de Surtur pode queimar um rolo inteiro em coringa a cada giro.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); await rt.spin(g); await play(rt, g, null, null);
        for (const kind of ['s', 'v']) { const n = count(g, x => x.kind === kind); if (n >= 3) { rt.mark(cells(g, x => x.kind === kind).map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind, n }); break; } }
      },
      async bonus(rt, { kind = RNG.pick(['s', 'v']), n = 3 } = {}) {
        const sticky = kind === 'v' ? new Map() : null;
        await rt.fsLoop({ 3: 10, 4: 12 }[n] || 14, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, kind, sticky); }, { title: kind === 'v' ? 'GUERREIROS DA TEMPESTADE' : 'VINGANÇA DE SURTUR', sub: kind === 'v' ? 'Rolos coringa colantes' : 'A mão de fogo queima rolos' });
      },
    }));
  })();

  /* 16. Food Truck do Fred — pimentas verdes revelam multiplicador global */
  (() => {
    const SY = lsyms([['fred', 'cook', 'Fred'], ['burger', 'hamburger', 'Hambúrguer'], ['hotdog', 'hotdog', 'Cachorro-quente'], ['pizza', 'pizza', 'Pizza']]);
    const WILD = { id: 'w', img: 'truck', name: 'Coringa', wild: true, w: 0.7 };
    const CHILI = { id: 'pimenta', img: 'greenchili', name: 'Pimenta verde', wild: true, chili: true, w: 0.25, fw: 0.8 };
    const SC = { id: 'sc', img: 'fries', name: 'Batata FS', sc: true, w: 0.5, fw: 0 };
    const draw = pool([...SY, WILD, CHILI, SC]);
    const make = wk => grid([5, 5, 5, 5, 5], c => draw(c, wk));
    const GM = [{ m: 1, w: 30 }, { m: 2, w: 30 }, { m: 3, w: 15 }, { m: 5, w: 12 }, { m: 10, w: 8 }, { m: 25, w: 3 }, { m: 50, w: 1.2 }, { m: 100, w: 0.4 }];
    async function play(rt, g, wk, st) {
      await rt.spin(g, { tease: !st });
      let m = st ? st.m : 0;
      const r = await tumble(rt, g, {
        draw: c => draw(c, wk),
        evaluate: gg => {
          const res = lines(gg, L19.slice(0, 15), SY);
          // pimenta verde num giro vencedor revela um multiplicador global
          if (res.total) cells(gg, x => x.chili && !x.done).forEach(([c, r2]) => { const v = wm(GM); gg[c][r2].done = true; gg[c][r2].t = 'x' + v; m += v; rt.msg(`🌶️ Pimenta: +x${v} no multiplicador global (x${m})`); rt.chip('mult', 'GLOBAL', 'x' + m); });
          return res;
        },
        mult: () => Math.max(1, m),
      });
      void r;
      if (st) st.m = m; else rt.chip('mult', null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'foodtruckfred', name: 'Food Truck do Fred', studio: STUDIO, art: 'hamburger', mascot: 'cook',
      tag: 'Multiplicador global até x100', colors: ['#16a34a', '#f59e0b'], bg: 'linear-gradient(180deg,#fef3c7,#fde047 40%,#15803d)',
      cols: 5, rows: 5, maxWin: 10000, vol: 3, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Fred\'s Food Truck" (Hacksaw Gaming).', hello: 'Pimentas verdes apimentam o multiplicador!',
      symbols: [...SY, WILD, CHILI, SC],
      lineList: { cols: 5, rows: 5, list: L19.slice(0, 15), text: '15 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda, com cascata.')],
      highlights: ['🍔 5×5 com 15 linhas e cascata', '🌶️ <b>Pimentas verdes</b> (coringas) num giro vencedor revelam <b>x1 a x100</b> somados no <b>multiplicador global</b>', '🍟 3/4 batatas = <b>10/15 rodadas grátis</b> com o multiplicador global que <b>não zera</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×5 com 15 linhas e cascata. As pimentas verdes são coringas; se fizerem parte de um giro com ganho, revelam um valor que é somado ao multiplicador global, aplicado a todos os ganhos do giro.</p>',
      features: '<p>🍟 <b>3 ou 4 batatas</b> dão <b>10 ou 15 rodadas grátis</b>, e o multiplicador global acumula entre os giros.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, 'w', null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const st = { m: 0 }; await rt.fsLoop(sc >= 4 ? 15 : 10, async () => { await play(rt, make('fw'), 'fw', st); }, { sub: 'Multiplicador global acumula' }); rt.chip('mult', null); },
    }));
  })();

  /* 17. 2 Selvagens 2 Morrer — revólveres atiram coringas */
  (() => {
    const SY = [S('pistoleira', 'cowboy', 'Pistoleira', [1, 3, 10], 3), S('xerife', 'police', 'Xerife', [0.8, 2.5, 8], 4), S('cavalo', 'horse', 'Cavalo', [0.6, 2, 6], 4), S('cacto', 'cactus', 'Cacto', [0.5, 1.5, 5], 5), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'star', name: 'Coringa', wild: true, w: 0.5 };
    const SILVER = { id: 'rp', img: 'pistol', name: 'Revólver de prata', gun: 's', noPay: true, w: 0.3, fw: 0.5 };
    const GOLD = { id: 'ro', img: 'goldpistol', name: 'Revólver de ouro', gun: 'g', noPay: true, w: 0.04, fw: 0.15 };
    const SC = { id: 'sc', img: 'skull', name: 'Bônus', sc: true, w: 0.8, fw: 0 };
    const draw = pool([...SY, WILD, SILVER, GOLD, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function shoot(rt, g, sticky) {
      if (sticky) sticky.forEach((m, kk) => { const [c, r] = unkey(kk); g[c][r] = m > 1 ? mult({ ...WILD, c: 'sticky' }, m) : { ...WILD, c: 'sticky' }; });
      for (const [c, r] of cells(g, x => x.gun)) {
        const gold = g[c][r].gun === 'g', n = RNG.int(1, gold ? 4 : 3);
        g[c][r] = { ...WILD, fresh: true };
        for (let i = 0; i < n; i++) { const a = RNG.int(0, 4), b = RNG.int(0, 3); if (g[a][b].sc) continue; g[a][b] = gold ? mult({ ...WILD, c: 'gold', fresh: true }, wm(HUGE)) : { ...WILD, fresh: true }; if (sticky) sticky.set(key(a, b), g[a][b].m || 1); }
        rt.msg(`🔫 ${gold ? 'Revólver de ouro' : 'Revólver de prata'}: ${n} tiro${n > 1 ? 's' : ''}!`); rt.fx('boom');
      }
      await rt.drop(g);
    }
    App.register(K.create({
      id: 'doisselvagens', name: '2 Selvagens 2 Morrer', studio: STUDIO, art: 'pistol', mascot: 'cowboy',
      tag: 'Revólveres atiram coringas até x200', colors: ['#b45309', '#111827'], bg: 'linear-gradient(180deg,#fdba74,#9a3412 50%,#1c1917)',
      cols: 5, rows: 4, maxWin: 15000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "2 Wild 2 Die" (Hacksaw Gaming).', hello: 'Os revólveres atiram coringas!',
      symbols: [...SY, WILD, SILVER, GOLD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos. Multiplicadores no mesmo caminho se somam.')],
      highlights: ['🔫 Revólver de <b>prata</b> atira 1 a 3 coringas; o de <b>ouro</b> atira 1 a 4 <b>coringas multiplicadores</b> (x2 a x200)', '💀 3 bônus = <b>Mais Procurados</b>: 10 giros com coringas atirados <b>colantes</b>; 4 bônus = <b>Atirando Coringas</b> (revólveres em todo giro)', 'Prêmio máximo: <b>15.000x</b>'],
      how: '<p>Grade 5×4 com 1.024 caminhos. Quando um revólver cai, ele vira coringa e atira balas em casas aleatórias, que viram coringas (prata) ou coringas multiplicadores (ouro). Multiplicadores no mesmo caminho se somam.</p>',
      features: '<p>💀 <b>3 bônus</b>: <b>Mais Procurados</b>, 10 rodadas grátis em que os coringas atirados ficam presos. <b>4 bônus</b>: <b>Atirando Coringas</b>, 10 rodadas grátis com pelo menos um revólver em todo giro e coringas presos.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await shoot(rt, g, null); await pay(rt, ways(g, SY, { wildMult: 'add' })); const sc = count(g, x => x.sc); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const sticky = new Map();
        await rt.fsLoop(10, async () => {
          const g = make('fw');
          if (sc >= 4 && !cells(g, x => x.gun).length) g[RNG.int(0, 4)][RNG.int(0, 3)] = { ...(RNG.float() < 0.3 ? GOLD : SILVER) };
          await rt.spin(g, { tease: false }); await shoot(rt, g, sticky); await pay(rt, ways(g, SY, { wildMult: 'add' }));
        }, { title: sc >= 4 ? 'ATIRANDO CORINGAS' : 'MAIS PROCURADOS', sub: 'Coringas atirados ficam presos' });
      },
    }));
  })();

  /* 18. Benny, a Cerveja — pilhas mistério (Stackways) */
  (() => {
    const SY = [S('benny', 'beer', 'Benny', [1, 3, 10], 3), S('pretzel', 'pretzel', 'Pretzel', [0.8, 2.5, 8], 4), S('salsicha', 'hotdog', 'Salsicha', [0.6, 2, 6], 4), S('acordeao', 'accordion', 'Acordeão', [0.5, 1.5, 5], 5), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'beers', name: 'Coringa', wild: true, w: 0.55 };
    const MYS = { id: 'mys', img: 'question', name: 'Pilha mistério', mys: true, noPay: true, w: 0.7, fw: 1.6 };
    const SC = { id: 'sc', img: 'goldbook', name: 'Livro', sc: true, w: 0.85, fw: 0 };
    const draw = pool([...SY, WILD, MYS, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, sp) {
      await rt.spin(g, { tease: !sp });
      if (g.flat().some(x => x.mys)) {
        // todas as pilhas mistério viram o mesmo símbolo, cada uma com 2 a 10 cópias
        const s = RNG.pick(SY);
        g.forEach((col, c) => col.forEach((x, r) => { if (x.mys) { const n = RNG.weighted([{ n: 2, w: 40 }, { n: 3, w: 25 }, { n: 4, w: 15 }, { n: 5, w: 10 }, { n: 7, w: 6 }, { n: 10, w: 4 }]).n; g[c][r] = { ...s, n, t: '×' + n, c: 'gold', fresh: true }; } }));
        rt.msg(`📚 Stackways! Pilhas de ${s.name}`); await rt.drop(g);
      }
      await pay(rt, ways(g, SY));
      if (sp) {
        const cols = [...new Set(cells(g, x => x.id === sp.id).map(([c]) => c))];
        if (cols.length >= 3) {
          const t = g.map((col, c) => (cols.includes(c) ? col.map(() => ({ ...sp, c: 'gold' })) : col.map(() => ({ id: 'vazio', img: null, c: 'empty', noPay: true }))));
          cols.forEach(c => { g[c] = t[c].map(x => ({ ...x, fresh: true })); });
          await rt.drop(g);
          const v = sp.pays[Math.min(2, cols.length - 3)] * Math.pow(4, cols.length) / 16;
          rt.mark(cells(g, x => x.id === sp.id).map(([c, r]) => key(c, r))); rt.win(v); rt.msg(`📖 ${sp.name} expandiu em ${cols.length} rolos: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(900);
        }
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'bennycerveja', name: 'Benny, a Cerveja', studio: STUDIO, art: 'beer', mascot: 'pretzel',
      tag: 'Stackways até 100.000 caminhos', colors: ['#ca8a04', '#15803d'], bg: 'linear-gradient(180deg,#fef3c7,#fcd34d 50%,#14532d)',
      cols: 5, rows: 4, maxWin: 10000, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Benny the Beer" (Hacksaw Gaming).', hello: 'Pilhas mistério multiplicam os caminhos!',
      symbols: [...SY, WILD, MYS, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Cada símbolo empilhado conta como várias cópias (Stackways).')],
      highlights: ['🍺 5×4 com 1.024 caminhos que crescem até <b>100.000</b>', '📚 <b>Stackways:</b> pilhas mistério viram o mesmo símbolo com <b>2 a 10 cópias</b> cada', '📖 3 livros = <b>Livro dos Stackways</b>: 10 rodadas grátis com um <b>símbolo especial que expande</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 que paga por caminhos. Cada pilha mistério vira o mesmo símbolo sorteado e conta como 2 a 10 cópias dele, multiplicando os caminhos.</p>',
      features: '<p>📖 <b>3 livros</b> dão <b>10 rodadas grátis</b> com um símbolo especial sorteado: se ele aparecer em 3 ou mais rolos, expande e paga em todos eles.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const sp = RNG.pick(SY.slice(0, 6));
        await rt.reveal('SÍMBOLO ESPECIAL', SY.slice(0, 6).map(s => ({ img: s.img, letter: s.letter, label: s.name })), SY.indexOf(sp));
        await rt.fsLoop(10, async () => { await play(rt, make('fw'), sp); }, { title: 'LIVRO DOS STACKWAYS', sub: `Especial: ${sp.name}` });
      },
    }));
  })();

  /* 19. Punho da Destruição — punhos viram rolos coringa */
  (() => {
    const RED = [S('lutador1', 'boxing', 'Lutador vermelho', [2, 5, 15], 3), S('lutadora1', 'womanfight', 'Lutadora vermelha', [1.5, 4, 12], 4)];
    const BLUE = [S('lutador2', 'martialarts', 'Lutador azul', [2, 5, 15], 3), S('lutadora2', 'ninja', 'Lutadora azul', [1.5, 4, 12], 4)];
    RED.forEach(s => { s.team = 'r'; }); BLUE.forEach(s => { s.team = 'b'; });
    const SY = [...RED, ...BLUE, ...R([[0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]])];
    const WILD = { id: 'w', img: 'star', name: 'Coringa', wild: true, w: 0.6 };
    const FR = { id: 'pr', img: 'boxingglove', name: 'Punho vermelho', fist: 'r', noPay: true, reels: [1, 2, 3], w: 0.3, fw: 0.5 };
    const FB = { id: 'pb', img: 'oncomingfist', name: 'Punho azul', fist: 'b', noPay: true, reels: [1, 2, 3], w: 0.3, fw: 0.5 };
    const SC = { id: 'sc', img: 'trophy', name: 'Troféu', sc: true, w: 0.75, fw: 0 };
    const draw = pool([...SY, WILD, FR, FB, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function fists(rt, g, sticky) {
      if (sticky) sticky.forEach((m, c) => { g[c] = g[c].map(() => (m > 1 ? mult({ ...WILD, c: 'sticky' }, m) : { ...WILD, c: 'sticky' })); });
      for (const [c, r] of cells(g, x => x.fist)) {
        const team = g[c][r].fist;
        // o punho sobe pelo rolo: coringas e lutadores do time rival viram multiplicador
        let m = 0;
        for (let rr = 0; rr <= r; rr++) { const x = g[c][rr]; if (x.wild || (x.team && x.team !== team)) m += wm(HUGE); }
        const test = g.map(col => col.slice());
        for (let rr = 0; rr <= r; rr++) test[c][rr] = m ? mult({ ...WILD, c: 'duel' }, m) : { ...WILD, c: 'duel' };
        if (lines(test, L14, SY, { mult: 'add' }).total > lines(g, L14, SY, { mult: 'add' }).total) { g[c] = test[c].map(x => ({ ...x, fresh: true })); if (sticky) sticky.set(c, m || 1); rt.msg(`👊 Punho ${team === 'r' ? 'vermelho' : 'azul'} no rolo ${c + 1}${m ? ` · x${m}` : ''}!`); rt.fx('boom'); }
        else g[c][r] = { ...RNG.pick(SY) };
      }
      await rt.drop(g);
    }
    App.register(K.create({
      id: 'punhodestruicao', name: 'Punho da Destruição', studio: STUDIO, art: 'oncomingfist', mascot: 'boxing',
      tag: 'Punhos viram rolos coringa até x200', colors: ['#dc2626', '#2563eb'], bg: 'linear-gradient(90deg,#7f1d1d,#111827 50%,#1e3a8a)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Fist of Destruction" (Hacksaw Gaming).', hello: 'Vermelho contra azul!',
      symbols: [...SY, WILD, FR, FB, SC],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['👊 Punhos (rolos 2 a 4) sobem pelo rolo e viram <b>coringas</b> se isso der ganho', 'Cada <b>coringa</b> ou <b>lutador do time rival</b> atingido soma <b>x2 a x200</b>', '🏆 3+ troféus = <b>Desafio</b>: 10 rodadas grátis com rolos de punho <b>colantes</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. Os punhos vermelho e azul só funcionam se ajudarem num ganho: sobem do lugar onde caíram até o topo do rolo, transformando tudo em coringa. Coringas e lutadores do time adversário no caminho viram multiplicadores (x2 a x200), que se somam.</p>',
      features: '<p>🏆 <b>3 ou mais troféus</b> dão <b>10 rodadas grátis</b> em que os rolos de punho ficam presos com seus multiplicadores até o fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await fists(rt, g, null); await pay(rt, lines(g, L14, SY, { mult: 'add' })); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = new Map(); await rt.fsLoop(10, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await fists(rt, g, st); await pay(rt, lines(g, L14, SY, { mult: 'add' })); }, { title: 'DESAFIO!', sub: 'Rolos de punho colantes' }); },
    }));
  })();

  /* 20. Densho — pássaros que viram rolos multiplicadores */
  (() => {
    const L10 = K.linesFor(4, 10);
    const SY = lsyms([['samurai', 'ninja', 'Samurai'], ['gueixa', 'geisha', 'Gueixa'], ['coruja', 'owl2', 'Coruja'], ['ponte', 'bridge', 'Ponte']]);
    const WILD = { id: 'w', img: 'cherryblossom', name: 'Coringa', wild: true, w: 0.6 };
    const D = [{ id: 'd1', img: 'bird', name: 'Densho azul', dens: [2, 10], w: 0.3, fw: 0.8 }, { id: 'd2', img: 'crane', name: 'Densho verde', dens: [5, 50], w: 0.1, fw: 0.3 }, { id: 'd3', img: 'phoenix', name: 'Densho vermelho', dens: [10, 100], w: 0.03, fw: 0.07 }].map(x => ({ ...x, noPay: true, reels: [1, 2, 3] }));
    const SC = { id: 'sc', img: 'torii', name: 'Torii', sc: true, w: 0.8, fw: 0 };
    const draw = pool([...SY, WILD, ...D, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, sticky) {
      if (sticky) sticky.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      for (const [c, r] of cells(g, x => x.dens)) {
        if (!g[c][r].dens) continue;
        const [a, b] = g[c][r].dens, m = RNG.int(a, b);
        const test = g.map(col => col.slice()); test[c] = g[c].map(() => mult({ ...WILD }, m));
        if (lines(test, L10, SY, { mult: 'add' }).total > lines(g, L10, SY, { mult: 'add' }).total) { g[c] = test[c].map(x => ({ ...x, c: 'gold', fresh: true })); if (sticky) sticky.set(c, m); rt.msg(`🕊️ Densho: rolo ${c + 1} coringa x${m}`); rt.fx('boom'); }
        else g[c][r] = { ...RNG.pick(SY) };
      }
      await rt.drop(g);
      await pay(rt, lines(g, L10, SY, { mult: 'add' }));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'densho', name: 'Densho', studio: STUDIO, art: 'crane', mascot: 'geisha',
      tag: 'Rolos multiplicadores até x100', colors: ['#be123c', '#7c3aed'], bg: 'linear-gradient(180deg,#fce7f3,#c4b5fd 50%,#4c1d95)',
      cols: 5, rows: 4, maxWin: 10000, vol: 3, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Densho" (Hacksaw Gaming).', hello: 'Pássaros Densho viram rolos coringa!',
      symbols: [...SY, WILD, ...D, SC],
      lineList: { cols: 5, rows: 4, list: L10, text: '10 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['🌸 5×4 com 10 linhas e paisagens em aquarela', '🕊️ Três pássaros <b>Densho</b> expandem em <b>rolos coringa</b> com <b>x2–x10</b>, <b>x5–x50</b> ou <b>x10–x100</b> quando dão ganho', '⛩️ 3 torii = <b>10 rodadas grátis</b>; 4 = <b>Super</b>, com rolos Densho <b>colantes</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 10 linhas. Um pássaro Densho nos rolos 2 a 4 que ajude num ganho cobre o rolo inteiro como coringa multiplicador.</p>',
      features: '<p>⛩️ <b>3 torii</b> dão <b>10 rodadas grátis</b> com mais pássaros. <b>4 torii</b> dão as <b>Super Rodadas Grátis</b>: os rolos Densho ficam presos até o fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const st = sc >= 4 ? new Map() : null; await rt.fsLoop(10, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, st); }, { title: st ? 'SUPER RODADAS GRÁTIS' : 'RODADAS GRÁTIS!', sub: st ? 'Rolos Densho colantes' : 'Mais pássaros Densho' }); },
    }));
  })();
})();
