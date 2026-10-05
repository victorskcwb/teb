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
  const EMPTY = () => ({ id: 'vazio', img: 'sparkles', c: 'empty', noPay: true });
  /** Compra de bônus: sorteia o nível pelas chances naturais. list = [[nível, peso], ...] */
  const pickTier = list => RNG.weighted(list.map(([v, w]) => ({ v, w }))).v;
  /** Retrigger por quantidade de scatters: tab = { 2: 2, 3: 4, ... } (acima do maior usa o maior). */
  const retrig = (tab, n) => { const ks = Object.keys(tab).map(Number).sort((a, b) => a - b); return n < ks[0] ? 0 : tab[Math.min(n, ks[ks.length - 1])]; };
  /**
   * Segure e ganhe genérico: 3 giros que voltam a 3 sempre que algo novo cai.
   * held(x) diz se a casa já está presa; spawn(c, r, g) devolve a célula nova ou null;
   * onLand(novas, g) roda depois de cada queda com novidade.
   */
  async function hold(rt, g, { held, spawn, onLand, title, sub }) {
    rt.stat('hold');
    await rt.banner(title, sub, 1400);
    rt.show(g);
    let left = 3;
    for (let guard = 0; left > 0 && guard < 300 && !rt.capped; guard++) {
      rt.chip('resp', 'GIROS', left);
      left--;
      const got = [];
      g.forEach((col, c) => col.forEach((x, r) => {
        if (held(x)) return;
        const y = spawn(c, r, g);
        if (y) { g[c][r] = { ...y, fresh: true }; got.push([c, r]); }
      }));
      await rt.drop(g);
      if (got.length) { left = 3; if (onLand) await onLand(got, g); }
      if (g.every(col => col.every(held))) break;
      await rt.wait(300);
    }
    rt.chip('resp', null);
  }

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

  /* 2. Mares Malditos — baús amaldiçoados com multiplicador de rolo + segure e ganhe */
  (() => {
    const SY = lsyms([['capitao', 'skull', 'Capitão caveira'], ['papagaio', 'parrot', 'Papagaio'], ['sabre', 'dagger', 'Sabre'], ['bussola', 'compass', 'Bússola']]);
    const WILD = { id: 'w', img: 'pirateflag', name: 'Coringa', wild: true, w: 0.8 };
    const CHEST = { id: 'bau', img: 'chest', name: 'Baú amaldiçoado', wild: true, chest: true, w: 0.35, fw: 0.35 };
    const SC = { id: 'sc', img: 'lantern', name: 'Lanterna', sc: true, w: 0.95, fw: 0.4 };
    const SKULL = { id: 'cav', img: 'skull', name: 'Caveira', coin: true, noPay: true, c: 'cash' };
    const KRAKEN = { id: 'kraken', img: 'kraken', name: 'Kraken', coin: true, kraken: true, noPay: true, c: 'coin-ouro' };
    const SV = [{ v: 1, w: 40 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 5, w: 10 }, { v: 10, w: 6 }, { v: 25, w: 3 }, { v: 50, w: 1 }, { v: 250, w: 0.1 }];
    const VF = 4;
    const skull = () => { const v = RNG.weighted(SV).v * VF; return { ...SKULL, v }; };
    const draw = pool([...SY, WILD, CHEST, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const RETRIG = { 2: 2, 3: 4, 4: 6 };
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
    /** Dead Men Tell No Tales: caveiras com prêmio ficam presas; o Kraken soma todas as caveiras da tela. */
    async function deadMen(rt, sc) {
      const g = grid([4, 4, 4, 4, 4], () => EMPTY());
      for (let i = 0; i < sc; i++) { let c, r; do { c = RNG.int(0, 4); r = RNG.int(0, 3); } while (g[c][r].coin); g[c][r] = skull(); }
      await hold(rt, g, {
        title: 'MORTOS NÃO CONTAM HISTÓRIAS', sub: '3 giros · cada caveira nova reinicia',
        held: x => !!x.coin,
        spawn: () => (RNG.float() < 0.065 ? (RNG.float() < 0.08 ? { ...KRAKEN, v: 0 } : skull()) : null),
        onLand: async (got, gg) => {
          for (const [c, r] of got) {
            if (!gg[c][r].kraken) continue;
            const v = gg.flat().filter(x => x.coin && !x.kraken).reduce((s, x) => s + x.v, 0);
            gg[c][r] = { ...gg[c][r], v, fresh: true };
            rt.msg(`🐙 O Kraken juntou ${rt.coins(v)}!`); rt.fx('big');
            await rt.drop(gg);
          }
        },
      });
      const win = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);
      rt.mark(cells(g, x => x.coin).map(([c, r]) => key(c, r)));
      rt.win(win); rt.msg(`💀 Tesouro amaldiçoado: ${rt.coins(win)}`); rt.fx('big');
      await rt.wait(900);
    }
    App.register(K.create({
      id: 'maresmalditos', name: 'Mares Malditos', studio: STUDIO, art: 'chest', mascot: 'skull',
      tag: 'Baús até x200 · caveiras e Kraken', colors: ['#0f766e', '#1e293b'], bg: 'linear-gradient(180deg,#134e4a,#0f172a 60%,#020617)',
      cols: 5, rows: 4, maxWin: 12500, vol: 5, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Cursed Seas" (Hacksaw Gaming).', hello: 'Abra os baús amaldiçoados!',
      symbols: [...SY, WILD, CHEST, SC, SKULL, KRAKEN],
      lineList: { cols: 5, rows: 4, list: L26, text: '26 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['🏴‍☠️ 5×4 com 26 linhas', '📦 O <b>baú amaldiçoado</b> amaldiçoa o rolo dele para cima: tudo vira coringa com <b>x2 a x200</b>', '🏮 3 lanternas = <b>10 rodadas grátis</b>: rolos amaldiçoados <b>ficam</b> coringa até o fim (+2/+4/+6 giros com 2/3/4 lanternas)', '💀 4+ lanternas = <b>Mortos Não Contam Histórias</b>: caveiras com prêmio e o <b>Kraken</b>, com 3 giros que reiniciam', 'Prêmio máximo: <b>12.500x</b>'],
      how: '<p>Grade 5×4 com 26 linhas. Quando um baú cai, ele e todas as casas acima dele no rolo viram coringas com o mesmo multiplicador (x2 a x200). Multiplicadores na mesma linha se somam.</p>',
      features: '<p>🏮 <b>3 lanternas</b> dão <b>10 rodadas grátis</b>. Todo rolo amaldiçoado <b>continua coringa</b> com o multiplicador até o fim do bônus. Durante elas, 2, 3 ou 4 lanternas dão <b>+2, +4 ou +6 giros</b>.</p><p>💀 <b>4 ou mais lanternas</b> abrem o <b>Mortos Não Contam Histórias</b>: a grade esvazia e as lanternas viram caveiras com prêmio em dinheiro. Você tem <b>3 giros</b>, e cada caveira nova que cai fica presa e devolve os giros para 3. O 🐙 <b>Kraken</b> junta o valor de todas as caveiras da tela. No fim, tudo é somado.</p><p class="muted small">Na compra, o bônus é sorteado: na maioria das vezes as rodadas grátis, às vezes o Mortos Não Contam Histórias.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = pickTier([[3, 85], [4, 15]]);
        if (sc >= 4) return deadMen(rt, sc);
        const st = { reel: [0, 0, 0, 0, 0] };
        await rt.fsLoop(10, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); const s = await play(rt, g, st); const add = retrig(RETRIG, s); if (add) api.add(add); }, { sub: 'Rolos amaldiçoados ficam!' });
      },
    }));
  })();

  /* 3. Templo do Tormento — escaravelhos dourados que expandem e dois bônus (Anúbis e Rá) */
  (() => {
    const SY = lsyms([['bastet', 'cat', 'Bastet'], ['horus', 'eagle', 'Hórus'], ['ankh', 'ankh', 'Ankh'], ['olho', 'eye', 'Olho']]);
    // 'fa' = Angústia de Anúbis (mais coringas e escaravelhos); 'fw' = Reino de Rá (coringas colantes)
    const WILD = { id: 'w', img: 'pyramid', name: 'Coringa', wild: true, w: 0.9, fw: 1.8, fa: 4.5 };
    const SCAR = { id: 'esc', img: 'scarab', name: 'Escaravelho dourado', wild: true, scarab: true, reels: [1, 2, 3], w: 0.22, fw: 0.45, fa: 1.8 };
    const SCA = { id: 'sca', img: 'jackal', name: 'Anúbis bônus', sc: true, kind: 'a', w: 0.65, fw: 0, fa: 0.3 };
    const SCR = { id: 'scr', img: 'sunbehind', name: 'Rá bônus', sc: true, kind: 'r', w: 0.65, fw: 0.3, fa: 0 };
    const draw = pool([...SY, WILD, SCAR, SCA, SCR]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const FS = { 3: 10, 4: 12, 5: 14 }, RETRIG = { 2: 2, 3: 4 };
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
      return { a: count(g, x => x.kind === 'a'), r: count(g, x => x.kind === 'r') };
    }
    App.register(K.create({
      id: 'templotormento', name: 'Templo do Tormento', studio: STUDIO, art: 'scarab', mascot: 'jackal',
      tag: 'Escaravelhos até x200 · bônus de Anúbis e de Rá', colors: ['#ca8a04', '#7f1d1d'], bg: 'linear-gradient(180deg,#451a03,#1c1917 60%,#0c0a09)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Temple of Torment" (Hacksaw Gaming).', hello: 'Escaravelhos expandem pelos rolos!',
      symbols: [...SY, WILD, SCAR, SCA, SCR],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['🪲 <b>Escaravelho dourado</b> (rolos 2 a 4) expande pelo rolo quando forma ganho', 'Cada coringa que ele atravessa soma <b>x2 a x200</b>', '🐺 3/4/5 Anúbis = <b>Angústia de Anúbis</b>: 10/12/14 rodadas grátis com <b>mais coringas e escaravelhos</b>', '☀️ 3/4/5 Rá = <b>Reino de Rá</b>: 10/12/14 rodadas grátis com coringas <b>colantes</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. O escaravelho dourado é coringa; se expandir pelo rolo ajudar num ganho, ele expande. Cada coringa comum que estava no caminho vira um multiplicador (x2 a x200) somado no rolo.</p>',
      features: `<p>🐺 <b>3, 4 ou 5 Anúbis</b> dão a <b>Angústia de Anúbis</b>: rodadas grátis com muito mais coringas e escaravelhos caindo (nada gruda).</p><p>☀️ <b>3, 4 ou 5 Rá</b> dão o <b>Reino de Rá</b>: rodadas grátis em que todo coringa comum que cai <b>gruda</b> até o fim.</p><p>Nos dois bônus, <b>2 ou 3</b> símbolos do mesmo deus dão <b>+2 ou +4 giros</b>. Na compra, o deus e o número de giros são sorteados.</p>${fsTab(FS)}`,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); await rt.spin(g); const s = await play(rt, g, null);
        const kind = s.a >= 3 && (s.a > s.r || (s.a === s.r && RNG.float() < 0.5)) ? 'a' : s.r >= 3 ? 'r' : null;
        if (kind) { rt.mark(cells(g, x => x.kind === kind).map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind, sc: s[kind] }); }
      },
      async bonus(rt, { kind = 'a', sc = 3, buy = false } = {}) {
        if (buy) { kind = RNG.pick(['a', 'r']); sc = pickTier([[3, 85], [4, 12], [5, 3]]); }
        const st = kind === 'r' ? new Set() : null, wk = kind === 'r' ? 'fw' : 'fa';
        await rt.fsLoop(FS[Math.min(5, sc)], async api => {
          const g = make(wk); await rt.spin(g, { tease: false });
          const s = await play(rt, g, st);
          const add = retrig(RETRIG, s[kind]); if (add) api.add(add);
        }, kind === 'r' ? { title: 'REINO DE RÁ', sub: 'Coringas colantes' } : { title: 'ANGÚSTIA DE ANÚBIS', sub: 'Mais coringas e escaravelhos' });
      },
    }));
  })();

  /* 4. Segure-as! (Keep'em) — Cash'em, Get'em e Drop & Fill */
  (() => {
    const SY = [S('canny', 'can', 'Lata Canny', [1, 2.5, 6, 15], 3), S('passaro', 'bird', 'Pássaro Bob', [0.8, 2, 5, 12], 4), S('cogumelo', 'mushroom', 'Cogumelo', [0.6, 1.5, 4, 9], 5), S('bolota', 'chestnut', 'Bolota', [0.5, 1.2, 3, 7], 5), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    SY.forEach(s => { s.pays = s.pays.map(p => p * 0.4); });
    // 'fw' = Keep 'Em Comin' (mais Get'em e Cash'em); 'fk' = Keep Your Friends Close (o dinheiro fica)
    const COIN = { id: 'moeda', img: 'coin', name: "Cash'em", coin: true, noPay: true, w: 1.3, fw: 4, fk: 3.5 };
    const GET = { id: 'get', img: 'magnet', name: "Get'em", get: true, noPay: true, reels: [0, 5], w: 0.5, fw: 2.5, fk: 0.5 };
    const SC = { id: 'sc', img: 'fourleaf', name: 'Bônus', sc: true, w: 0.55, fw: 0.45, fk: 0.45 };
    const DROP = { id: 'dropfill', img: 'down', name: 'Drop & Fill', noPay: true, c: 'tint-green' };
    const draw = pool([...SY, COIN, GET, SC]);
    const VALS = [{ v: 0.2, w: 40 }, { v: 0.5, w: 30 }, { v: 1, w: 15 }, { v: 2, w: 8 }, { v: 5, w: 4 }, { v: 10, w: 2 }, { v: 25, w: 0.6 }, { v: 100, w: 0.1 }];
    const VM = { w: 1, fw: 8, fk: 16 };
    const cell = (c, wk) => { const x = draw(c, wk); if (x.coin) { x.v = RNG.weighted(VALS).v * VM[wk]; x.t = K.short(x.v) + 'x'; } return x; };
    const make = wk => grid([5, 5, 5, 5, 5, 5], c => cell(c, wk));
    const P_DROP = { w: 0.035, fw: 0.05, fk: 0.05 };
    /** Drop & Fill: tudo abaixo do modificador no rolo some e as casas vazias se enchem com um único símbolo pagante sorteado. */
    async function dropFill(rt, g, wk) {
      const hits = [];
      for (let c = 0; c < 6; c++) if (RNG.float() < P_DROP[wk]) hits.push(c);
      if (!hits.length) return;
      for (const c of hits) {
        const r = RNG.int(0, 2), s = RNG.pick(SY);
        g[c][r] = { ...DROP };
        for (let rr = r + 1; rr < 5; rr++) g[c][rr] = { ...s, fresh: true };
        rt.msg(`⬇️ Drop & Fill no rolo ${c + 1}: ${s.name}!`); rt.fx('rise');
      }
      await rt.drop(g);
    }
    async function play(rt, g, wk, st) {
      await rt.spin(g, { tease: wk === 'w' });
      await dropFill(rt, g, wk);
      // Keep Your Friends Close: o dinheiro que já caiu volta para o mesmo lugar
      if (st && st.keep) {
        st.keep.forEach((x, kk) => { const [c, r] = unkey(kk); if (!g[c][r].coin && !g[c][r].get && !g[c][r].sc) g[c][r] = { ...x, c: 'sticky' }; });
        if (st.keep.size) await rt.drop(g);
      }
      await pay(rt, ways(g, SY));
      const gets = count(g, x => x.get), v = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);
      if (gets && v) {
        rt.mark(cells(g, x => x.coin || x.get).map(([c, r]) => key(c, r))); rt.win(v * gets);
        rt.msg(`🧲 Get'em coletou ${rt.coins(v)}${gets > 1 ? ` × ${gets}` : ''}`); rt.fx('coin'); await rt.wait(800);
        if (st && st.keep) st.keep.clear();
      } else if (st && st.keep) cells(g, x => x.coin).forEach(([c, r]) => st.keep.set(key(c, r), { ...g[c][r] }));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'segureas', name: "Segure-as!", studio: STUDIO, art: 'can', mascot: 'bird',
      tag: "Cash'em · Get'em · Drop & Fill", colors: ['#16a34a', '#f59e0b'], bg: 'linear-gradient(180deg,#bbf7d0,#4ade80 50%,#14532d)',
      cols: 6, rows: 5, maxWin: 10000, vol: 3, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Keep\'em" (Hacksaw Gaming).', hello: "Get'em coleta as moedas!",
      symbols: [...SY, COIN, GET, SC, DROP],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×5 = 15.625 caminhos.')],
      highlights: ['🥫 6×5 com 15.625 caminhos', "🪙 Moedas <b>Cash'em</b> (0,2x a 100x) e coletores <b>Get'em</b> nos rolos 1 e 6", '⬇️ <b>Drop & Fill:</b> apaga tudo abaixo dele no rolo e enche as casas vazias com <b>um mesmo símbolo</b>', "🍀 3 bônus = <b>Keep 'Em Comin'</b>: 10 rodadas grátis com mais Get'em e Cash'em", "🍀 4+ bônus = <b>Keep Your Friends Close</b>: o dinheiro <b>fica na tela</b> até um Get'em coletar", 'Prêmio máximo: <b>10.000x</b>'],
      how: "<p>Grade 6×5 que paga por caminhos. Quando um <b>Get'em</b> (rolos 1 e 6) aparece junto com moedas, ele coleta o valor de todas; dois Get'em coletam em dobro.</p><p>⬇️ Quando cai o modificador <b>Drop & Fill</b>, todos os símbolos abaixo dele naquele rolo são apagados e um símbolo pagante sorteado enche <b>todas</b> as casas vazias.</p>",
      features: "<p>🍀 <b>3 bônus</b> dão <b>Keep 'Em Comin'</b>: 10 rodadas grátis com muito mais Get'em e Cash'em caindo.</p><p>🍀 <b>4 ou mais bônus</b> dão <b>Keep Your Friends Close</b>: 10 rodadas grátis em que toda moeda Cash'em <b>fica no lugar</b> de um giro para o outro, acumulando, até um Get'em coletar tudo.</p><p>Nos dois, 3 bônus dão <b>+5 giros</b>. Na compra, o bônus é sorteado (Keep Your Friends Close é o mais raro).</p>",
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, 'w', null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = pickTier([[3, 85], [4, 15]]);
        const close = sc >= 4, st = { keep: close ? new Map() : null }, wk = close ? 'fk' : 'fw';
        await rt.fsLoop(10, async api => { if (await play(rt, make(wk), wk, st) >= 3) api.add(5); }, close ? { title: 'KEEP YOUR FRIENDS CLOSE', sub: "O dinheiro fica até um Get'em coletar" } : { title: "KEEP 'EM COMIN'", sub: "Mais Get'em e Cash'em" });
      },
    }));
  })();

  /* 5 e 6. Bússola (Cash Compass / Let it Snow) — símbolo que se espalha, rodadas grátis e roda de dinheiro */
  function compass(o) {
    const SY = csyms(o.syms);
    const COMP = { id: 'comp', img: o.compImg, name: o.compName, comp: true, noPay: true, w: 0.45, fw: 2.6 };
    const SC = { id: 'sc', img: o.scImg, name: o.scName, sc: true, kind: 'fs', w: 0.42, fw: 0 };
    const SCW = { id: 'scw', img: o.whImg, name: o.whName, sc: true, kind: 'wh', w: 0.3, fw: 0 };
    const draw = pool([...SY, COMP, SC, SCW]);
    const make = wk => grid([6, 6, 6, 6, 6, 6], c => draw(c, wk));
    // roda de bônus: dinheiro (x nível), sobe de nível ou caveira (fim)
    const LV = [1, 10, 100, 250];
    const WHEEL = [{ k: 'c', v: 0.2, w: 30 }, { k: 'c', v: 0.5, w: 22 }, { k: 'c', v: 1, w: 14 }, { k: 'c', v: 2, w: 10 }, { k: 'c', v: 3, w: 5 }, { k: 'c', v: 5, w: 1.5 }, { k: 'up', w: 3 }, { k: 'end', w: 12 }];
    async function play(rt, g, wk) {
      // bússola: espalha um símbolo pela linha ou coluna na direção sorteada
      for (const [c, r] of cells(g, x => x.comp)) {
        const s = RNG.pick(SY), d = RNG.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        g[c][r] = { ...s, c: 'gold', fresh: true };
        for (let a = c + d[0], b = r + d[1]; g[a] && g[a][b]; a += d[0], b += d[1]) if (!g[a][b].sc) g[a][b] = { ...s, c: 'gold', fresh: true };
        rt.msg(`${o.emoji} ${o.compName} espalhou ${s.name}!`);
      }
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c, wk), evaluate: gg => payClusters(clusters(gg, 5), TT) });
      return { fs: count(g, x => x.kind === 'fs'), wh: count(g, x => x.kind === 'wh') };
    }
    async function wheel(rt) {
      rt.stat('hold');
      await rt.banner('RODA DE BÔNUS', 'Gira até cair a caveira · até 50 giros', 1500);
      let lv = 0, win = 0;
      rt.chip('lv', 'NÍVEL', '1x');
      for (let i = 0; i < 50 && !rt.capped; i++) {
        rt.chip('wh', 'GIRO', `${i + 1}/50`);
        const w = RNG.weighted(WHEEL);
        if (w.k === 'end') { rt.msg('💀 Caveira! Fim da roda'); rt.fx('boom'); await rt.wait(700); break; }
        if (w.k === 'up') {
          if (lv < LV.length - 1) { lv++; rt.chip('lv', 'NÍVEL', LV[lv] + 'x'); rt.msg(`⬆️ Nível da roda: os prêmios agora valem ${LV[lv]}x!`); rt.fx('rise'); }
          else rt.msg('⬆️ Nível máximo!');
        } else {
          const v = w.v * LV[lv];
          win += v; rt.win(v); rt.msg(`💰 ${K.short(w.v)} × ${LV[lv]} = ${rt.coins(v)}`); rt.fx('coin');
        }
        await rt.wait(450);
      }
      rt.chip('lv', null); rt.chip('wh', null);
      rt.msg(`Roda de bônus: ${rt.coins(win)}`);
      await rt.wait(700);
    }
    return K.create({
      id: o.id, name: o.name, studio: STUDIO, art: o.compImg, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: 6, rows: 6, maxWin: 7400, vol: 4, rtp: '~96,4%', target: 0.964,
      intro: o.intro, hello: `${o.compName} espalha símbolos!`,
      symbols: [...SY, COMP, SC, SCW],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: [`${o.emoji} 6×6 com grupos e cascata`, `🧭 ${o.compName} <b>espalha um símbolo</b> por toda a linha ou coluna em uma direção`, `${o.scEmoji} 3+ ${o.scName.toLowerCase()}s = <b>10 rodadas grátis</b> com muito mais ${o.compName.toLowerCase()}`, `${o.whEmoji} 3+ ${o.whPl} = <b>roda de bônus</b> em dinheiro: até 50 giros até cair a caveira, com prêmios que sobem de nível <b>1x → 10x → 100x → 250x</b>`, 'Prêmio máximo: <b>7.400x</b>'],
      how: `<p>Grade 6×6: grupos de 5+ iguais encostados pagam e somem (cascata). Quando cai ${o.compName.toLowerCase()}, ela vira um símbolo sorteado e espalha esse símbolo em linha reta (para cima, baixo, esquerda ou direita) até a borda.</p>`,
      features: `<p>${o.scEmoji} <b>3 ou mais ${o.scName.toLowerCase()}s</b> dão <b>10 rodadas grátis</b> em que ${o.compName.toLowerCase()} cai muito mais vezes.</p><p>${o.whEmoji} <b>3 ou mais ${o.whPl}</b> giram a <b>roda de bônus</b>: cada giro paga um prêmio em dinheiro, sobe o nível da roda ou para na 💀 caveira, que encerra o bônus (no máximo 50 giros). Os níveis multiplicam todos os prêmios seguintes: <b>1x, 10x, 100x e 250x</b>.</p><p class="muted small">Na compra, o bônus é sorteado entre as rodadas grátis e a roda.</p>`,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); const s = await play(rt, g, 'w');
        if (s.fs >= 3) { rt.mark(cells(g, x => x.kind === 'fs').map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind: 'fs' }); }
        if (s.wh >= 3 && !rt.capped) { rt.mark(cells(g, x => x.kind === 'wh').map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind: 'wh' }); }
      },
      async bonus(rt, { kind = 'fs', buy = false } = {}) {
        if (buy) kind = pickTier([['fs', 60], ['wh', 40]]);
        if (kind === 'wh') return wheel(rt);
        await rt.fsLoop(10, async () => { await play(rt, make('fw'), 'fw'); }, { sub: `Mais ${o.compName.toLowerCase()}` });
      },
    });
  }
  App.register(compass({
    id: 'deixenevar', name: 'Deixe Nevar', mascot: 'snowman', compImg: 'snowflake', compName: 'Floco espalhador', emoji: '❄️', scImg: 'gift', scName: 'Presente', scEmoji: '🎁', whImg: 'star', whName: 'Estrela', whPl: 'estrelas', whEmoji: '⭐',
    tag: 'Símbolo que se espalha · roda até 250x', colors: ['#38bdf8', '#dc2626'], bg: 'linear-gradient(180deg,#e0f2fe,#bae6fd 50%,#1e3a8a)',
    intro: 'Inspirado no "Let it Snow" (Hacksaw Gaming).',
    syms: [['papainoel', 'santa', 'Papai Noel'], ['rena', 'deer', 'Rena'], ['boneco', 'snowman', 'Boneco de neve'], ['arvore', 'christmastree', 'Árvore'], ['meia', 'sock', 'Meia'], ['bengala', 'candycane', 'Bengala'], ['sino', 'bell2', 'Sino']],
  }));
  App.register(compass({
    id: 'bussolatesouro', name: 'Bússola do Tesouro', mascot: 'island', compImg: 'compass', compName: 'Bússola', emoji: '🧭', scImg: 'worldmap', scName: 'Mapa', scEmoji: '🗺️', whImg: 'moneybag', whName: 'Saco de dinheiro', whPl: 'sacos de dinheiro', whEmoji: '💰',
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

  /* 8. Os Respinners — banda que dá respins; a banda inteira no palco abre as rodadas grátis */
  (() => {
    const BAND = [S('vocal', 'microphone', 'Vocalista', [1, 3, 10], 5), S('guitarra', 'guitar', 'Guitarrista', [0.8, 2.5, 8], 5), S('baixo', 'violin', 'Baixista', [0.6, 2, 6], 5), S('bateria', 'drum', 'Baterista', [0.5, 1.5, 5], 5)];
    const PF = 0.022;
    BAND.forEach(s => { s.pays = s.pays.map(p => p * PF); });
    const EMO = { vocal: '🎤', guitarra: '🎸', baixo: '🎻', bateria: '🥁' };
    const SY = [...BAND, ...K.ROYALS([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]], [4, 4, 4, 4]).map(s => ({ ...s, pays: s.pays.map(p => p * PF) }))];
    const WILD = { id: 'w', img: 'guitar2', name: 'Coringa', wild: true, w: 1.2 };
    const draw = pool([...SY, WILD]);
    const make = (wk = 'w') => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const showMult = (rt, st) => rt.chip('band', 'BANDA', BAND.map(b => `${EMO[b.id]}x${st.m[b.id]}`).join(' '));
    /** Paga um giro; nas grátis os multiplicadores dos integrantes que ganharam se somam e cada um cresce +4. */
    async function payBand(rt, res, st) {
      if (!st || !res.total) return pay(rt, res);
      const ids = [...new Set(res.wins.filter(w => BAND.includes(w.sym)).map(w => w.sym.id))];
      const m = ids.reduce((s, id) => s + st.m[id], 0) || 1;
      await pay(rt, res, m);
      if (ids.length) { ids.forEach(id => { st.m[id] += 4; }); showMult(rt, st); }
    }
    /** Giro com a corrente de respins; devolve quantos integrantes subiram ao palco. */
    async function play(rt, g, st) {
      if (!st && RNG.float() < 0.025) { const n = RNG.int(3, 12); for (let i = 0; i < n; i++) g[RNG.int(1, 4)][RNG.int(0, 3)] = { ...WILD, fresh: true }; rt.msg(`🤘 A plateia enlouqueceu: +${n} coringas!`); }
      await rt.spin(g, { tease: false });
      let res = ways(g, SY);
      await payBand(rt, res, st);
      // respin: integrantes da banda que ganharam ficam presos
      const held = new Set();
      for (let guard = 0; guard < 6 && !rt.capped; guard++) {
        const newB = res.wins.filter(w => BAND.includes(w.sym) && !held.has(w.sym.id)).map(w => w.sym.id);
        if (!newB.length) break;
        newB.forEach(id => held.add(id));
        rt.chip('stage', 'PALCO', `${held.size}/4`);
        rt.msg(`🎸 Respin! ${held.size} integrante${held.size > 1 ? 's' : ''} no palco`); rt.fx('rise');
        const ng = make(st ? 'fw' : 'w');
        g.forEach((col, c) => col.forEach((x, r) => { if (held.has(x.id)) ng[c][r] = { ...x, c: 'sticky' }; }));
        g.splice(0, 5, ...ng);
        await rt.spin(g, { tease: false });
        res = ways(g, SY);
        await payBand(rt, res, st);
      }
      rt.chip('stage', null);
      return held.size;
    }
    App.register(K.create({
      id: 'respinners', name: 'Os Respinners', studio: STUDIO, art: 'guitar', mascot: 'microphone',
      tag: 'A banda dá respins · multiplicadores que crescem', colors: ['#dc2626', '#111827'], bg: 'linear-gradient(180deg,#111827,#7f1d1d 60%,#0b0f19)',
      cols: 5, rows: 4, maxWin: 5150, vol: 3, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "The Respinners" (Hacksaw Gaming).', hello: 'Ganhe com a banda e ganhe respin!',
      symbols: [...SY, WILD],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos.')],
      highlights: ['🎤 5×4 com 1.024 caminhos', '🎸 Ganho com um <b>integrante da banda</b> = <b>respin</b> com os símbolos dele presos; outro integrante novo = outro respin', '🤘 <b>A Plateia Enlouquece:</b> até 12 coringas aleatórios', '🎶 Os <b>4 integrantes</b> no palco na mesma sequência de respins = <b>12 rodadas grátis</b>', 'Nas grátis cada integrante tem um multiplicador que <b>cresce +4</b> a cada ganho dele', 'Prêmio máximo: <b>5.150x</b>'],
      how: '<p>Grade 5×4 com 1.024 caminhos. Quando um dos quatro integrantes da banda forma ganho, os símbolos dele ficam presos e os outros giram de novo; cada novo integrante vencedor dá mais um respin.</p>',
      features: '<p>🎶 Não há scatter: se os <b>quatro integrantes</b> (vocal, guitarra, baixo e bateria) subirem ao palco na mesma sequência de respins, começam as <b>12 rodadas grátis</b>.</p><p>Nelas, cada integrante tem o seu multiplicador, que começa em <b>x1</b>. Num ganho, os multiplicadores dos integrantes que ganharam <b>se somam</b> e valem para o ganho todo; depois, cada um deles <b>cresce +4</b> e fica assim até o fim do bônus.</p>',
      make: () => make(),
      async spin(rt) { const g = make(); if (await play(rt, g, null) >= 4) { rt.msg('🎶 A banda completa subiu ao palco!'); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { m: { vocal: 1, guitarra: 1, baixo: 1, bateria: 1 } };
        showMult(rt, st);
        await rt.fsLoop(12, async () => { await play(rt, make('fw'), st); }, { title: 'A BANDA COMPLETA!', sub: 'Multiplicadores da banda crescem +4' });
        rt.chip('band', null);
      },
    }));
  })();

  /* 9. Giro Asteca — linhas completas ficam e multiplicam; máscaras douradas trancam linhas */
  (() => {
    const PF = 4.5;
    const SY = csyms([['piramide', 'pyramid', 'Pirâmide'], ['jaguar', 'leopard', 'Jaguar'], ['serpente', 'snake', 'Serpente'], ['cacau', 'chestnut', 'Cacau'], ['jade', 'greenheart', 'Jade'], ['pena', 'feather', 'Pena'], ['milho', 'corn', 'Milho']]).map((x, i) => ({ ...x, pays: x.pays.map(p => p * PF), fw: x.w * (i >= 4 ? 2 : 1) }));
    const SC = { id: 'sc', img: 'sun', name: 'Sol', sc: true, w: 0.55, fw: 0.3 };
    const WILD = { id: 'w', img: 'eagle', name: 'Coringa', wild: true, w: 0.35 };
    const MASK = { id: 'mask', img: 'moai', name: 'Máscara dourada', mask: true, noPay: true, c: 'gold', w: 0, fw: 0.35 };
    const LOCKC = () => ({ id: 'lock', img: 'locked', name: 'Linha trancada', c: 'locked', noPay: true });
    const CYL = [10, 20, 30, 50, 100, 200, 500];
    const draw = pool([...SY, SC, WILD, MASK]);
    const make = (wk, locked = new Set()) => grid([8, 8, 8, 8, 8], (c, r) => (locked.has(r) ? LOCKC() : draw(c, wk)));
    const fullRows = g => { const out = []; for (let r = 0; r < 8; r++) { const base = g.map(col => col[r]).find(x => !x.wild); if (base && !base.sc && !base.noPay && g.every(col => col[r].id === base.id || col[r].wild)) out.push(r); } return out; };
    async function play(rt, g, wk, st) {
      const locked = st ? st.locked : new Set();
      await rt.spin(g, { tease: !st });
      const held = new Map();
      for (let guard = 0; guard < 6 && !rt.capped; guard++) {
        const rows = fullRows(g).filter(r => !held.has(r));
        if (!rows.length) break;
        rows.forEach(r => held.set(r, RNG.int(2, 5)));
        rt.msg(`🌀 Linha completa! Respin com ${held.size} linha${held.size > 1 ? 's' : ''} presa${held.size > 1 ? 's' : ''}`); rt.fx('rise');
        const ng = make(wk, locked);
        held.forEach((m, r) => g.forEach((col, c) => { ng[c][r] = { ...col[r], c: 'sticky' }; }));
        g.splice(0, 5, ...ng);
        await rt.spin(g, { tease: false });
      }
      const mr = [...held.values()].reduce((a, b) => a + b, 0) || 1;
      await pay(rt, payClusters(clusters(g, 5), TT), mr, held.size ? ` (linhas x${mr})` : '');
      // máscara dourada: tranca a linha inteira, dispara o cilindro de prêmio e dá +2 giros
      if (st) {
        const rows = [...new Set(cells(g, x => x.mask).map(([, r]) => r))];
        for (const r of rows) {
          if (rt.capped) break;
          const v = CYL[Math.min(st.n, CYL.length - 1)];
          st.n++;
          if (locked.size < 7) { locked.add(r); g.forEach(col => { col[r] = { ...LOCKC(), fresh: true }; }); }
          rt.show(g); rt.win(v); st.api.add(2, true);
          rt.chip('cyl', 'CILINDRO', CYL[Math.min(st.n, CYL.length - 1)] + 'x');
          rt.msg(`🗿 Máscara dourada! Linha trancada · cilindro ${rt.coins(v)} · +2 giros`); rt.fx('big');
          await rt.wait(900);
        }
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'giroasteca', name: 'Giro Asteca', studio: STUDIO, art: 'moai', mascot: 'eagle',
      tag: 'Linhas completas dão respin · cilindros até 500x', colors: ['#16a34a', '#ca8a04'], bg: 'linear-gradient(180deg,#14532d,#365314 60%,#1a2e05)',
      cols: 5, rows: 8, cellH: 0.8, maxWin: 6900, vol: 3, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Aztec Twist" (Hacksaw Gaming).', hello: 'Complete uma linha inteira!',
      symbols: [...SY, SC, WILD, MASK],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados.')],
      highlights: ['🗿 5 colunas × 8 linhas com grupos de 5+', '🌀 Uma <b>linha inteira</b> do mesmo símbolo fica presa, ganha multiplicador <b>x2 a x5</b> e dá <b>respin</b>', '☀️ 3 sóis = <b>8 rodadas grátis</b> com <b>máscaras douradas</b>: cada uma tranca a linha dela, dispara um <b>cilindro de prêmio</b> (10x → 20x → … → 500x) e dá <b>+2 giros</b>', 'Prêmio máximo: <b>6.900x</b>'],
      how: '<p>Grade 5×8 com grupos de 5 ou mais iguais encostados. Se uma linha horizontal inteira for do mesmo símbolo, ela fica presa com um multiplicador (x2 a x5) e o resto gira de novo; novas linhas completas repetem. No fim, os multiplicadores das linhas se somam e valem para o ganho.</p>',
      features: `<p>☀️ <b>3 sóis</b> dão <b>8 rodadas grátis</b> (+4 com 3 sóis nelas). Nelas caem as 🗿 <b>máscaras douradas</b>: cada máscara <b>tranca a linha inteira</b> onde caiu até o fim do bônus, dispara um <b>cilindro de prêmio</b> e dá <b>+2 giros</b>. Os cilindros sobem a cada máscara: <b>${CYL.join('x → ')}x</b>.</p>`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { locked: new Set(), n: 0 };
        rt.chip('cyl', 'CILINDRO', CYL[0] + 'x');
        await rt.fsLoop(8, async api => { st.api = api; if (await play(rt, make('fw', st.locked), 'fw', st) >= 3) api.add(4); }, { sub: 'Máscaras douradas trancam linhas' });
        rt.chip('cyl', null);
      },
    }));
  })();

  /* 10. Fortuna da Floresta — vento clona coringas; borboletas enchem o pote e o tornado coleta */
  (() => {
    const PF = 6;
    const SY = csyms([['coruja', 'owl', 'Coruja'], ['raposa', 'fox', 'Raposa'], ['ourico', 'hedgehog', 'Ouriço'], ['cogumelo', 'mushroom', 'Cogumelo'], ['joaninha', 'ladybug', 'Joaninha'], ['folha', 'leaf', 'Folha'], ['bolota', 'chestnut', 'Bolota']]).map(x => ({ ...x, pays: x.pays.map(p => p * PF) }));
    const WILD = { id: 'w', img: 'tornado', name: 'Coringa do vento', wild: true, w: 0.22 };
    const SC = { id: 'sc', img: 'flower2', name: 'Flor bônus', sc: true, w: 0.8, fw: 0 };
    const BLUE = { id: 'azul', img: 'butterfly', name: 'Borboleta azul', bf: 'b', noPay: true, c: 'mk-blue', w: 0, fw: 0.55 };
    const GREEN = { id: 'verde', img: 'butterfly', name: 'Borboleta verde', bf: 'g', noPay: true, c: 'mk-green', w: 0, fw: 0.15 };
    const TORN = { id: 'coleta', img: 'cyclone', name: 'Tornado coletor', bf: 't', noPay: true, c: 'gold', w: 0, fw: 0.3 };
    const BV = [{ v: 2, w: 40 }, { v: 4, w: 25 }, { v: 6, w: 15 }, { v: 10, w: 10 }, { v: 20, w: 6 }, { v: 50, w: 3 }, { v: 200, w: 0.5 }];
    const GM = [{ m: 2, w: 70 }, { m: 3, w: 22 }, { m: 5, w: 8 }];
    const draw = pool([...SY, WILD, SC, BLUE, GREEN, TORN]);
    const make = wk => grid([5, 5, 5, 5, 5], c => {
      const x = draw(c, wk);
      if (x.bf === 'b') { x.v = RNG.weighted(BV).v; x.t = '+' + K.short(x.v); }
      if (x.bf === 'g') mult(x, wm(GM));
      return x;
    });
    async function play(rt, g, wk, st) {
      const ws = cells(g, x => x.wild);
      if (ws.length) {
        const d = RNG.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        ws.forEach(([c, r]) => { for (let i = 1; i <= ws.length; i++) { const a = c + d[0] * i, b = r + d[1] * i; if (g[a] && g[a][b] && !g[a][b].sc && !g[a][b].bf) g[a][b] = { ...WILD, fresh: true }; } });
        rt.msg(`🌬️ Vento! ${ws.length} coringa${ws.length > 1 ? 's' : ''} clonado${ws.length > 1 ? 's' : ''} ${ws.length}x`); rt.fx('rise');
      }
      await rt.drop(g);
      const res = payClusters(clusters(g, 5), TT);
      await pay(rt, res);
      if (st) {
        // azuis somam valor no pote, verdes multiplicam o pote e o tornado coleta (o pote continua)
        const bl = g.flat().filter(x => x.bf === 'b'), gr = g.flat().filter(x => x.bf === 'g'), tn = count(g, x => x.bf === 't');
        if (bl.length) { st.pot += bl.reduce((s, x) => s + x.v, 0); rt.msg(`🦋 Borboletas azuis: pote ${rt.coins(st.pot)}`); }
        if (gr.length && st.pot) { gr.forEach(x => { st.pot *= x.m; }); rt.msg(`🦋 Borboleta verde: pote x${gr.reduce((s, x) => s * x.m, 1)} = ${rt.coins(st.pot)}`); rt.fx('rise'); }
        rt.chip('pot', 'POTE', rt.xs(st.pot) || K.short(st.pot));
        if (tn && st.pot) {
          rt.mark(cells(g, x => x.bf).map(([c, r]) => key(c, r)));
          for (let i = 0; i < tn; i++) rt.win(st.pot);
          rt.msg(`🌪️ Tornado coletou ${rt.coins(st.pot)}${tn > 1 ? ` × ${tn}` : ''}!`); rt.fx('big'); await rt.wait(900);
        }
        st.reset = res.total > 0 || bl.length + gr.length + tn > 0;
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'fortunafloresta', name: 'Fortuna da Floresta', studio: STUDIO, art: 'butterfly', mascot: 'owl',
      tag: 'Vento clona coringas · 10.000x', colors: ['#15803d', '#f59e0b'], bg: 'linear-gradient(180deg,#d9f99d,#4d7c0f 60%,#1a2e05)',
      cols: 5, rows: 5, maxWin: 10000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Forest Fortune" (Hacksaw Gaming).', hello: 'O vento espalha os coringas!',
      symbols: [...SY, WILD, SC, BLUE, GREEN, TORN],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados.')],
      highlights: ['🌲 5×5 com grupos de 5+', '🌬️ <b>Vento:</b> os coringas são soprados numa direção e cada um é <b>clonado tantas vezes quantos coringas houver</b>', '🌸 3 flores bônus = <b>3 giros grátis</b> que voltam para 3 a cada <b>giro com ganho</b> (ou borboleta/tornado)', '🦋 Borboletas <b>azuis</b> somam valor no pote, as <b>verdes</b> multiplicam o pote e o 🌀 <b>tornado</b> coleta', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×5 com grupos de 5 ou mais iguais encostados. Quando cai coringa, o vento sopra numa direção aleatória e cada coringa deixa um rastro de cópias do tamanho do número total de coringas.</p>',
      features: '<p>🌸 <b>3 flores bônus</b> dão <b>3 rodadas grátis</b>. Todo giro com ganho (ou em que caia uma borboleta ou um tornado) faz o contador <b>voltar para 3</b>.</p><p>🦋 As <b>borboletas azuis</b> trazem valores que se somam num pote; as <b>borboletas verdes</b> multiplicam o pote (x2 a x5). Quando cai o 🌀 <b>tornado</b>, ele coleta o valor do pote, que continua cheio para as próximas coletas.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { pot: 0, reset: false };
        rt.chip('pot', 'POTE', '0');
        let n = 0;
        await rt.fsLoop(3, async api => {
          n++;
          const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, 'fw', st);
          if (st.reset && n < 80 && api.left < 3) api.add(3 - api.left, true);
        }, { sub: 'Giros com ganho voltam para 3', label: 'GIROS' });
        rt.chip('pot', null);
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
      const flowers = st ? st.flowers : new Map(), CAP = st ? 15 : 8;
      let drops = 0;
      const apply = gg => {
        cells(gg, x => x.seed).forEach(([c, r]) => { if (flowers.size < 3) flowers.set(key(c, r), 2); gg[c][r] = { ...draw(c, wk), fresh: true }; });
        cells(gg, x => x.fert || x.epic).forEach(([c, r]) => { const x = gg[c][r]; if (x.epic) flowers.forEach((m, k) => flowers.set(k, Math.min(CAP, m + 1))); else if (flowers.size) { const k = RNG.pick([...flowers.keys()]); flowers.set(k, Math.min(CAP, flowers.get(k) + 1)); } gg[c][r] = { ...draw(c, wk), fresh: true }; });
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
          onStep: async (s, gg, res) => {
            // girassóis pulam para outra casa; só os que fizeram parte do ganho crescem +1
            const nf = new Map(), won = res && res.cells ? res.cells : new Set();
            flowers.forEach((m, k) => { let kk; do kk = key(RNG.int(0, 6), RNG.int(0, 6)); while (nf.has(kk)); nf.set(kk, Math.min(CAP, m + (won.has(k) ? 1 : 0))); });
            // a cascata pode ter derrubado os girassóis: tira todos da grade antes de recolocar nas casas novas
            gg.forEach((col, c) => col.forEach((x, r) => { if (x.wild) gg[c][r] = { ...draw(c, wk), fresh: true }; }));
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
      highlights: ['🌻 7×7 com grupos e cascata', '🌱 Sementes viram <b>girassóis coringa x2</b> que <b>pulam</b> para outra casa a cada cascata e sobem <b>+1</b> quando fazem parte de um ganho (até 3 ao mesmo tempo)', '🪣 Adubo dá +1 num girassol; o épico dá +1 em todos', '💧 Gotas (até 5) dão <b>respins</b> no fim das cascatas', '🚜 3+ tratores = <b>10 rodadas grátis</b> com os girassóis guardados', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam (cascata). Girassóis são coringas com multiplicador; vários no mesmo grupo se somam. A cada cascata eles pulam para uma casa nova; os que participaram do ganho crescem +1 (até x8 no jogo base e x15 nas rodadas grátis).</p>',
      features: '<p>🚜 <b>3 ou mais tratores</b> dão <b>10 rodadas grátis</b> (+5 com 3 nelas). Os girassóis ficam de um giro para o outro durante todo o bônus.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { flowers: new Map() }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', st) >= 3) api.add(5); }, { sub: 'Os girassóis ficam!' }); },
    }));
  })();

  /* 13. Caminho do Guerreiro — duelos de clãs (VS), Conquista e Confronto */
  (() => {
    const PF = 0.16;
    const CLANS = [S('vermelho', 'ninja', 'Clã Vermelho', [2, 5, 15], 3), S('azul', 'robot', 'Clã Azul', [1.5, 4, 12], 3), S('verde', 'ogre', 'Clã Verde', [1.2, 3, 10], 4), S('amarelo', 'goblin', 'Clã Amarelo', [1, 2.5, 8], 4)];
    const SY = [...CLANS, ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    SY.forEach(s => { s.pays = s.pays.map(p => p * PF); });
    const WILD = { id: 'w', img: 'katana', name: 'Coringa', wild: true, w: 0.6 };
    const VS = { id: 'vs', img: 'vs', name: 'VS', vs: true, noPay: true, reels: [1, 2, 3], w: 0.3, fw: 1.2 };
    const SC = { id: 'sc', img: 'cityscape', name: 'Cidade', sc: true, kind: 'c', w: 0.8, fw: 0 };
    const SC2 = { id: 'sc2', img: 'swords', name: 'Confronto', sc: true, kind: 'x', w: 0.22, fw: 0 };
    const DM = [{ m: 1, w: 30 }, { m: 2, w: 30 }, { m: 3, w: 15 }, { m: 5, w: 12 }, { m: 10, w: 8 }, { m: 25, w: 4 }, { m: 50, w: 1 }];
    const CV = [{ v: 1, w: 40 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 5, w: 10 }, { v: 10, w: 6 }, { v: 25, w: 3 }, { v: 100, w: 0.4 }];
    const all = [...SY, WILD, VS, SC, SC2];
    const make = (wk, out = new Set()) => { const d = pool(all.filter(s => !out.has(s.id))); return grid([4, 4, 4, 4, 4], c => d(c, wk)); };
    /** Duelo: o VS cobre o rolo, dois clãs com multiplicadores sorteados lutam; o vencedor ocupa o rolo e os símbolos do perdedor na tela inteira viram o vencedor. */
    async function duel(rt, g, out) {
      out = out || new Set();
      const vs = new Map();
      for (const c of [...new Set(cells(g, x => x.vs).map(([c]) => c))]) {
        const alive = CLANS.filter(cl => !out.has(cl.id));
        const a = RNG.pick(alive), b = alive.length > 1 ? RNG.pick(alive.filter(x => x !== a)) : a;
        const ma = wm(DM), mb = wm(DM), win = ma > mb || (ma === mb && RNG.float() < 0.5) ? a : b, lose = win === a ? b : a, m = win === a ? ma : mb;
        g[c] = g[c].map(() => ({ ...win, c: 'duel', t: 'x' + m, fresh: true }));
        if (lose !== win) g.forEach((col, cc) => col.forEach((x, r) => { if (x.id === lose.id) g[cc][r] = { ...win, c: 'gold', fresh: true }; }));
        vs.set(c, { id: win.id, m });
        rt.msg(`⚔️ ${a.name} x${ma} contra ${b.name} x${mb}: ${win.name} vence${lose !== win ? ` e toma os símbolos do ${lose.name}` : ''}!`); rt.fx('boom');
      }
      if (vs.size) await rt.drop(g);
      return vs;
    }
    /** Caminhos; ganhos do clã vencedor que passam por rolos de duelo somam os multiplicadores desses rolos. */
    function evalVS(g, vs) {
      const res = ways(g, SY);
      if (!vs.size) return res;
      let total = 0;
      res.wins.forEach(w => { const m = [...vs].filter(([c, d]) => d.id === w.sym.id && c < w.n).reduce((s, [, d]) => s + d.m, 0) || 1; w.pay *= m; w.mult = m; total += w.pay; });
      return { ...res, total };
    }
    async function play(rt, g, out) {
      await rt.spin(g, { tease: !out });
      const vs = await duel(rt, g, out);
      const res = evalVS(g, vs);
      await pay(rt, res);
      return { win: res.total, c: count(g, x => x.kind === 'c'), x: count(g, x => x.kind === 'x') };
    }
    /** Confronto: moedas dos clãs ficam presas; um VS faz dois clãs brigarem: as moedas do perdedor passam para o vencedor e todas as do vencedor dobram. */
    async function clash(rt, sc) {
      const coin = cl => ({ id: 'cm', img: cl.img, name: 'Moeda ' + cl.name, coin: true, clan: cl.id, noPay: true, c: 'cash', v: RNG.weighted(CV).v });
      const lbl = x => { x.t = x.vsx ? 'VS' : K.short(x.v); return x; };
      const g = grid([4, 4, 4, 4, 4], () => EMPTY());
      for (let i = 0; i < sc; i++) { let c, r; do { c = RNG.int(0, 4); r = RNG.int(0, 3); } while (g[c][r].coin); g[c][r] = lbl(coin(RNG.pick(CLANS))); }
      await hold(rt, g, {
        title: 'CONFRONTO!', sub: '3 giros · moedas novas reiniciam',
        held: x => !!x.coin,
        spawn: () => (RNG.float() < 0.07 ? (RNG.float() < 0.1 ? { ...VS, coin: true, vsx: true, v: 0, t: 'VS' } : lbl(coin(RNG.pick(CLANS)))) : null),
        onLand: async (got, gg) => {
          for (const [c, r] of got) {
            if (!gg[c][r].vsx) continue;
            const present = [...new Set(gg.flat().filter(x => x.clan).map(x => x.clan))];
            const ids = present.length >= 2 ? present : CLANS.map(x => x.id);
            const a = RNG.pick(ids), b = RNG.pick(ids.filter(x => x !== a));
            const win = RNG.float() < 0.5 ? a : b, lose = win === a ? b : a, W = CLANS.find(x => x.id === win);
            gg.forEach(col => col.forEach((x, rr, arr) => { if (x.clan === lose || x.clan === win) arr[rr] = lbl({ ...x, clan: win, img: W.img, v: x.v * 2, fresh: true }); }));
            rt.msg(`⚔️ Confronto! ${W.name} vence e dobra as moedas`); rt.fx('big');
            await rt.drop(gg);
          }
        },
      });
      const win = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);
      rt.mark(cells(g, x => x.coin).map(([c, r]) => key(c, r)));
      rt.win(win); rt.msg(`⚔️ Confronto: ${rt.coins(win)}`); rt.fx('big');
      await rt.wait(900);
    }
    App.register(K.create({
      id: 'caminhoguerreiro', name: 'Caminho do Guerreiro', studio: STUDIO, art: 'ninja', mascot: 'katana',
      tag: 'Duelos de clãs · Conquista e Confronto', colors: ['#dc2626', '#2563eb'], bg: 'linear-gradient(180deg,#0f172a,#312e81 50%,#7f1d1d)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Warrior Ways" (Hacksaw Gaming).', hello: 'Quatro clãs disputam a cidade!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos.')],
      highlights: ['🥷 5×4 com 1.024 caminhos e 4 clãs', '⚔️ <b>VS</b> nos rolos 2 a 4 cobre o rolo e abre um <b>duelo</b> entre dois clãs com multiplicadores (x1 a x50): o vencedor ocupa o rolo e <b>toma os símbolos do perdedor</b> na tela toda', 'Vários rolos de duelo no mesmo caminho <b>somam</b> os multiplicadores', '🏙️ 3+ cidades = <b>Conquista</b>: 10 rodadas grátis; a cada <b>2 giros sem ganho</b> um clã é eliminado e você ganha <b>+1 giro</b>', '🗡️ 3+ espadas = <b>Confronto</b>: moedas dos clãs com 3 giros que reiniciam', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 1.024 caminhos. O símbolo VS nos rolos 2, 3 e 4 cobre o rolo inteiro e dois clãs se enfrentam, cada um com um multiplicador sorteado; quem tiver o maior vence. O rolo vira símbolos do clã vencedor com o multiplicador dele, e todos os símbolos do clã perdedor na tela viram do vencedor. Ganhos do vencedor que passam por vários rolos de duelo somam os multiplicadores.</p>',
      features: '<p>🏙️ <b>3 ou mais cidades</b> dão <b>10 rodadas grátis</b> de <b>Conquista</b>: a cada <b>2 giros sem ganho</b>, um clã é eliminado (seus símbolos somem dos rolos) e você ganha <b>+1 giro</b>, até sobrar um só clã.</p><p>🗡️ <b>3 ou mais espadas</b> abrem o <b>Confronto</b>: a grade esvazia e moedas dos clãs com prêmio em dinheiro caem e ficam presas; cada moeda nova devolve os giros para <b>3</b>. Quando cai um VS, dois clãs brigam: o vencedor fica com as moedas do perdedor e <b>todas as moedas dele dobram</b>.</p><p class="muted small">Na compra, o bônus é sorteado: na maioria das vezes a Conquista, às vezes o Confronto.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); const s = await play(rt, g, null);
        if (s.c >= 3) { rt.mark(cells(g, x => x.kind === 'c').map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind: 'c' }); }
        if (s.x >= 3 && !rt.capped) { rt.mark(cells(g, x => x.kind === 'x').map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind: 'x', sc: s.x }); }
      },
      async bonus(rt, { kind = 'c', sc = 3, buy = false } = {}) {
        if (buy) kind = pickTier([['c', 85], ['x', 15]]);
        if (kind === 'x') return clash(rt, sc);
        const out = new Set();
        let losses = 0;
        rt.chip('clans', 'CLÃS', 4);
        await rt.fsLoop(10, async api => {
          const s = await play(rt, make('fw', out), out);
          if (s.win > 0 || out.size >= 3) return;
          if (++losses < 2) return;
          losses = 0;
          const loser = RNG.pick(CLANS.filter(cl => !out.has(cl.id)));
          out.add(loser.id); api.add(1, true);
          rt.chip('clans', 'CLÃS', 4 - out.size);
          rt.msg(`🏳️ ${loser.name} foi eliminado! +1 giro`); rt.fx('rise');
          await rt.wait(600);
        }, { title: 'CONQUISTA!', sub: '2 giros sem ganho eliminam um clã' });
        rt.chip('clans', null);
      },
    }));
  })();

  /* 14. Porquinho Mágico — cartola transforma porquinhos; estrelas enchem o medidor de mágica */
  (() => {
    const SY = lsyms([['coelho', 'rabbitface', 'Coelho'], ['varinha', 'magicwand', 'Varinha'], ['cartas', 'cards', 'Cartas'], ['pomba', 'dove', 'Pomba']]);
    const PIG = { id: 'pig', img: 'pigface', name: 'Porquinho', pig: true, noPay: true, w: 1.6, fw: 2.8 };
    const HAT = { id: 'hat', img: 'tophat', name: 'Cartola mágica', hat: true, noPay: true, w: 0.3, fw: 0.7 };
    const WILD = { id: 'w', img: 'pigface', name: 'Porco coringa', wild: true, w: 0.4 };
    const STAR = { id: 'estrela', img: 'star', name: 'Estrela', star: 1, noPay: true, w: 0, fw: 1 };
    const SSTAR = { id: 'superestrela', img: 'glowstar', name: 'Super estrela', star: 3, noPay: true, w: 0, fw: 0.3 };
    const SC = { id: 'sc', img: 'magicball', name: 'Bônus', sc: true, w: 0.7, fw: 0 };
    const draw = pool([...SY, PIG, HAT, WILD, STAR, SSTAR, SC]);
    const make = wk => grid([5, 5, 5, 5, 5], c => draw(c, wk));
    const BILL = [{ v: 1, w: 40 }, { v: 2, w: 25 }, { v: 5, w: 15 }, { v: 10, w: 9 }, { v: 25, w: 5 }, { v: 50, w: 3 }, { v: 100, w: 1.5 }, { v: 1000, w: 0.05 }];
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      // estrelas enchem o medidor (super estrela = +3) e viram símbolos comuns
      if (st) {
        const pts = g.flat().reduce((s, x) => s + (x.star || 0), 0);
        if (pts) {
          st.meter += pts;
          g.forEach((col, c) => col.forEach((x, r) => { if (x.star) g[c][r] = { ...RNG.pick(SY), fresh: true }; }));
          rt.chip('pig', 'MÁGICA', st.meter); rt.msg(`⭐ +${pts} no medidor de mágica (${st.meter})`); rt.fx('rise');
          await rt.drop(g);
        }
      }
      const hats = count(g, x => x.hat);
      let cash = 0;
      if (hats) {
        // cartola: ela e todos os porquinhos viram coringas ou maços de notas
        const asWild = RNG.float() < 0.5;
        g.forEach((col, c) => col.forEach((x, r) => {
          if (!x.pig && !x.hat) return;
          if (asWild) g[c][r] = { ...WILD, c: 'gold', fresh: true };
          else { const v = RNG.weighted(BILL).v; cash += v; g[c][r] = { id: 'nota', img: 'banknote', name: 'Notas', noPay: true, t: v + 'x', fresh: true }; }
        }));
        rt.msg(`🎩 Abracadabra! ${asWild ? 'Porquinhos coringa' : `Notas ${rt.coins(cash)}`}`); rt.fx('boom');
        // nas grátis cada cartola transforma tantos porquinhos mágicos (coringa + nota) quantos pontos houver no medidor
        if (st && st.meter) {
          const n = Math.min(20, st.meter * hats), spots = cells(g, x => !x.wild && !x.sc && x.id !== 'nota');
          for (let i = 0; i < n && spots.length; i++) {
            const [c, r] = spots.splice(RNG.int(0, spots.length - 1), 1)[0], v = RNG.weighted(BILL).v;
            cash += v; g[c][r] = { ...WILD, img: 'pig', name: 'Porquinho mágico', c: 'tint-purple', t: v + 'x', fresh: true };
          }
          rt.msg(`🐷 ${n} porquinho${n > 1 ? 's' : ''} mágico${n > 1 ? 's' : ''}: coringa + notas!`);
          if (!st.epig) { st.meter = 0; rt.chip('pig', 'MÁGICA', 0); }
        }
        await rt.drop(g);
      } else g.forEach((col, c) => col.forEach((x, r) => { if (x.pig) g[c][r] = { ...RNG.pick(SY) }; }));
      await pay(rt, lines(g, L19, SY));
      if (cash) { rt.win(cash); rt.msg(`💵 Notas: ${rt.coins(cash)}`); rt.fx('coin'); await rt.wait(600); }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'porquinhomagico', name: 'Porquinho Mágico', studio: STUDIO, art: 'pigface', mascot: 'tophat',
      tag: 'Cartola vira porquinhos em coringa ou notas', colors: ['#ec4899', '#7c3aed'], bg: 'linear-gradient(180deg,#fbcfe8,#c084fc 50%,#4c1d95)',
      cols: 5, rows: 5, maxWin: 7500, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Magic Piggy" (Hacksaw Gaming).', hello: 'A cartola faz mágica com os porquinhos!',
      symbols: [...SY, PIG, HAT, WILD, STAR, SSTAR, SC],
      lineList: { cols: 5, rows: 5, list: L19, text: '19 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🎩 5×5 com 19 linhas', '🐷 A <b>cartola mágica</b> transforma ela mesma e todos os porquinhos em <b>coringas</b> ou em <b>maços de notas</b> (1x a 1.000x)', '⭐ Nas grátis, <b>estrelas</b> (+1) e <b>super estrelas</b> (+3) enchem o medidor; cada cartola cria tantos <b>porquinhos mágicos</b> (coringa <b>e</b> nota) quantos pontos houver', '🔮 3 bônus = <b>Bônus do Porquinho</b> (o medidor zera a cada cartola); 4+ = <b>Epig</b> (os pontos ficam)', 'Prêmio máximo: <b>7.500x</b>'],
      how: '<p>Grade 5×5 com 19 linhas. Porquinhos só servem para a mágica: sem cartola eles viram símbolos comuns. Com cartola, todos viram coringas ou maços de notas que pagam o valor na hora.</p>',
      features: '<p>🔮 <b>3 bônus</b> dão o <b>Bônus do Porquinho</b>: 10 rodadas grátis em que ⭐ estrelas (+1 ponto) e 🌟 super estrelas (+3 pontos) enchem o medidor de mágica. Cada cartola que cai, além da mágica normal, transforma tantos símbolos em <b>porquinhos mágicos</b> quantos pontos houver no medidor: eles são coringas e ainda pagam um maço de notas. Depois da cartola, o medidor <b>volta a zero</b>.</p><p>🐷 <b>4 ou mais bônus</b> dão o <b>Epig</b>: igual, mas os pontos <b>nunca zeram</b> e cada cartola fica mais forte que a anterior.</p><p class="muted small">Na compra, o bônus é sorteado (o Epig é o mais raro).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = pickTier([[3, 85], [4, 15]]);
        const st = { meter: 0, epig: sc >= 4 };
        rt.chip('pig', 'MÁGICA', 0);
        await rt.fsLoop(10, async () => { await play(rt, make('fw'), st); }, st.epig ? { title: 'EPIG!', sub: 'Os pontos de mágica não zeram' } : { title: 'BÔNUS DO PORQUINHO', sub: 'Estrelas enchem o medidor de mágica' });
        rt.chip('pig', null);
      },
    }));
  })();

  /* 15. Forjado na Tempestade — dois bônus nórdicos */
  (() => {
    const SY = lsyms([['viking', 'beardman', 'Viking'], ['surtur', 'fire', 'Surtur'], ['machado', 'axe', 'Machado'], ['escudo', 'shield', 'Escudo']]);
    // pesos das grátis: 'fv' = Guerreiros da Tempestade, 'fs' = Vingança de Surtur
    const WILD = { id: 'w', img: 'lightning', name: 'Coringa que expande', wild: true, expand: true, w: 0.55, fv: 0.8, fs: 0.8 };
    const CHEST = { id: 'bau', img: 'chest', name: 'Baú', chest: true, noPay: true, w: 0.25 };
    const SCV = { id: 'scv', img: 'militaryhelmet', name: 'Viking bônus', sc: true, kind: 'v', w: 0.6, fv: 0.3, fs: 0 };
    const SCS = { id: 'scs', img: 'volcano', name: 'Surtur bônus', sc: true, kind: 's', w: 0.45, fv: 0, fs: 0.3 };
    const draw = pool([...SY, WILD, CHEST, SCV, SCS]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const FS = { 3: 10, 4: 12, 5: 14 }, RETRIG = { 2: 2, 3: 4, 4: 6, 5: 8 };
    async function play(rt, g, mode, st) {
      // Guerreiros: rolos de coringa ficam presos com o multiplicador
      if (mode === 'v') st.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      // Surtur: o primeiro coringa de cada rolo fica preso no lugar e volta a expandir todo giro
      if (mode === 's') {
        st.forEach((r, c) => { g[c][r] = { ...WILD, c: 'sticky' }; });
        cells(g, x => x.wild && !x.m).forEach(([c, r]) => { if (!st.has(c)) { st.set(c, r); rt.msg(`🌋 Coringa do rolo ${c + 1} preso até o fim!`); } });
      }
      // coringa que expande no rolo com multiplicador
      for (const [c] of cells(g, x => x.expand && !x.m)) {
        if (g[c].every(x => x.wild && x.m)) continue;
        const m = wm(mode === 's' ? BIG : HUGE);
        g[c] = g[c].map(() => mult({ ...WILD, c: mode === 's' && st.has(c) ? 'sticky' : 'gold', fresh: true }, m));
        if (mode === 'v') st.set(c, m);
      }
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
      highlights: ['⚡ Coringas que <b>expandem pelo rolo</b> com <b>x2 a x200</b>', '📦 Baús pagam prêmios na hora', '⛑️ 3+ vikings = <b>Guerreiros da Tempestade</b>: 10/12/14 giros com rolos coringa <b>colantes</b>', '🌋 3+ Surtur = <b>Vingança de Surtur</b>: 10/12/14 giros em que o <b>primeiro coringa de cada rolo fica preso</b> até o fim', 'Retrigger: 2/3/4/5 scatters do bônus = <b>+2/+4/+6/+8 giros</b>', 'Prêmio máximo: <b>12.500x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. O coringa de raio expande pelo rolo inteiro com um multiplicador (x2 a x200); na mesma linha os multiplicadores se somam. Baús pagam de 1x a 50x.</p>',
      features: `<p>⛑️ <b>3, 4 ou 5 vikings</b>: <b>Guerreiros da Tempestade</b> com 10, 12 ou 14 giros, e todo rolo de coringa fica preso até o fim.</p><p>🌋 <b>3, 4 ou 5 Surtur</b>: <b>Vingança de Surtur</b> com 10, 12 ou 14 giros. O <b>primeiro coringa</b> que cair em cada rolo fica <b>preso no lugar</b> pelo resto do bônus e volta a expandir em todo giro com um multiplicador novo.</p><p>Nos dois, <b>2, 3, 4 ou 5</b> scatters do mesmo bônus dão <b>+2, +4, +6 ou +8 giros</b>. Na compra, o bônus e o número de giros são sorteados.</p>${fsTab(FS)}`,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); await rt.spin(g); await play(rt, g, null, null);
        for (const kind of ['s', 'v']) { const n = count(g, x => x.kind === kind); if (n >= 3) { rt.mark(cells(g, x => x.kind === kind).map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind, n }); break; } }
      },
      async bonus(rt, { kind = 'v', n = 3, buy = false } = {}) {
        if (buy) { kind = RNG.pick(['s', 'v']); n = pickTier([[3, 85], [4, 12], [5, 3]]); }
        const st = new Map(), wk = kind === 'v' ? 'fv' : 'fs';
        await rt.fsLoop(FS[Math.min(5, n)], async api => {
          const g = make(wk); await rt.spin(g, { tease: false }); await play(rt, g, kind, st);
          const add = retrig(RETRIG, count(g, x => x.kind === kind)); if (add) api.add(add);
        }, { title: kind === 'v' ? 'GUERREIROS DA TEMPESTADE' : 'VINGANÇA DE SURTUR', sub: kind === 'v' ? 'Rolos coringa colantes' : 'O primeiro coringa de cada rolo fica preso' });
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

  /* 17. 2 Selvagens 2 Morrer — revólveres atiram coringas; Mais Procurados e Atirando Coringas */
  (() => {
    const PF = 0.065;
    const SY = [S('pistoleira', 'cowboy', 'Pistoleira', [1, 3, 10], 3), S('xerife', 'police', 'Xerife', [0.8, 2.5, 8], 4), S('cavalo', 'horse', 'Cavalo', [0.6, 2, 6], 4), S('cacto', 'cactus', 'Cacto', [0.5, 1.5, 5], 5), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])].map(s => ({ ...s, pays: s.pays.map(p => p * PF) }));
    const WILD = { id: 'w', img: 'star', name: 'Coringa', wild: true, w: 0.5 };
    const SILVER = { id: 'rp', img: 'pistol', name: 'Revólver de prata', gun: 's', noPay: true, w: 0.3, fw: 0.5 };
    const GOLD = { id: 'ro', img: 'goldpistol', name: 'Revólver de ouro', gun: 'g', noPay: true, w: 0.04, fw: 0.15 };
    const SC = { id: 'sc', img: 'skull', name: 'Bônus', sc: true, w: 0.8, fw: 0 };
    const RELOAD = { id: 'recarga', img: 'hourglass', name: 'Recarga', reload: true, noPay: true, c: 'tint-gold' };
    const draw = pool([...SY, WILD, SILVER, GOLD, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    // cartazes de procurado: cada bala soma (+2 a +500) ou multiplica (x2 a x20)
    const ADD = [{ v: 2, w: 40 }, { v: 3, w: 25 }, { v: 5, w: 15 }, { v: 10, w: 10 }, { v: 20, w: 6 }, { v: 50, w: 3 }, { v: 100, w: 0.8 }, { v: 500, w: 0.08 }];
    const MUL = [{ m: 2, w: 60 }, { m: 3, w: 20 }, { m: 5, w: 12 }, { m: 10, w: 6 }, { m: 20, w: 2 }];
    const P_MUL = 0.12;
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
    /** Mais Procurados: grade vazia e 6 cartazes; revólveres atiram 1 a 6 balas nos cartazes, recargas dão +1 bala aos próximos. */
    async function mostWanted(rt) {
      const posters = Array.from({ length: 6 }, () => RNG.pick([1, 2, 3, 5]));
      let bonusBullets = 0;
      // a faixa tem 5 colunas: os 6 cartazes ficam em 2 fileiras de 3 (colunas 1, 3 e 5)
      const showP = () => { const t = posters.map((v, i) => `🎯${i + 1} ${rt.xs(v) || K.short(v)}`); rt.head([t[0], '', t[1], '', t[2], t[3], '', t[4], '', t[5]]); };
      const g = grid([4, 4, 4, 4, 4], () => EMPTY());
      showP();
      await hold(rt, g, {
        title: 'MAIS PROCURADOS', sub: '3 giros · revólver ou recarga reinicia',
        held: x => x.id !== 'vazio',
        spawn: () => { const p = RNG.float(); return p < 0.022 ? { ...(RNG.float() < 0.2 ? GOLD : SILVER) } : p < 0.029 ? { ...RELOAD } : null; },
        onLand: async (got, gg) => {
          for (const [c, r] of got) {
            const x = gg[c][r];
            if (x.reload) { bonusBullets++; rt.msg(`⏳ Recarga! Os próximos revólveres atiram +${bonusBullets}`); rt.fx('rise'); continue; }
            const n = Math.min(6, RNG.int(1, x.gun === 'g' ? 6 : 3) + bonusBullets);
            gg[c][r] = { ...x, t: n + '🔫' };
            for (let i = 0; i < n; i++) {
              const p = RNG.int(0, 5);
              if (RNG.float() < P_MUL) { const m = wm(MUL); posters[p] *= m; rt.msg(`💥 Cartaz ${p + 1}: x${m}!`); }
              else { const v = RNG.weighted(ADD).v; posters[p] += v; rt.msg(`💥 Cartaz ${p + 1}: +${rt.xs(v) || v}`); }
              showP(); rt.fx('boom'); await rt.wait(250);
            }
          }
        },
      });
      const win = posters.reduce((a, b) => a + b, 0);
      rt.win(win); rt.msg(`🤠 Recompensas: ${rt.coins(win)}`); rt.fx('big');
      await rt.wait(1200);
      rt.head(null);
    }
    App.register(K.create({
      id: 'doisselvagens', name: '2 Selvagens 2 Morrer', studio: STUDIO, art: 'pistol', mascot: 'cowboy',
      tag: 'Revólveres atiram coringas · cartazes de procurado', colors: ['#b45309', '#111827'], bg: 'linear-gradient(180deg,#fdba74,#9a3412 50%,#1c1917)',
      cols: 5, rows: 4, maxWin: 15000, vol: 5, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "2 Wild 2 Die" (Hacksaw Gaming).', hello: 'Os revólveres atiram coringas!',
      symbols: [...SY, WILD, SILVER, GOLD, SC, RELOAD],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos. Multiplicadores no mesmo caminho se somam.')],
      highlights: ['🔫 Revólver de <b>prata</b> atira 1 a 3 coringas; o de <b>ouro</b> atira 1 a 4 <b>coringas multiplicadores</b> (x2 a x200)', '💀 3 bônus = <b>Mais Procurados</b>: 6 cartazes de recompensa e 3 giros que reiniciam; cada bala soma <b>+2 a +500</b> ou multiplica <b>x2 a x20</b> um cartaz', '💀 4 bônus = <b>Atirando Coringas</b>: 10 rodadas grátis com coringas atirados <b>colantes</b>', 'Prêmio máximo: <b>15.000x</b>'],
      how: '<p>Grade 5×4 com 1.024 caminhos. Quando um revólver cai, ele vira coringa e atira balas em casas aleatórias, que viram coringas (prata) ou coringas multiplicadores (ouro). Multiplicadores no mesmo caminho se somam.</p>',
      features: '<p>💀 <b>3 bônus</b>: <b>Mais Procurados</b>. A grade esvazia e aparecem <b>6 cartazes de procurado</b> com uma recompensa inicial. Você tem <b>3 giros</b>: cada revólver ou ⏳ recarga que cai fica na grade e devolve os giros para 3. Revólveres atiram de <b>1 a 6 balas</b> nos cartazes, e cada bala <b>soma +2 a +500</b> ou <b>multiplica x2 a x20</b> o cartaz atingido; a recarga dá +1 bala a todos os revólveres seguintes. No fim, os cartazes são somados.</p><p>💀 <b>4 bônus</b>: <b>Atirando Coringas</b>, 10 rodadas grátis em que todos os coringas atirados ficam presos até o fim.</p><p class="muted small">Na compra, o bônus é sorteado: na maioria das vezes o Mais Procurados, às vezes o Atirando Coringas.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await shoot(rt, g, null); await pay(rt, ways(g, SY, { wildMult: 'add' })); const sc = count(g, x => x.sc); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = pickTier([[3, 85], [4, 15]]);
        if (sc < 4) return mostWanted(rt);
        const sticky = new Map();
        await rt.fsLoop(10, async () => {
          const g = make('fw');
          await rt.spin(g, { tease: false }); await shoot(rt, g, sticky); await pay(rt, ways(g, SY, { wildMult: 'add' }));
        }, { title: 'ATIRANDO CORINGAS', sub: 'Coringas atirados ficam presos' });
      },
    }));
  })();

  /* 18. Benny, a Cerveja — pilhas mistério (Stackways) e o Livro dos Stackways */
  (() => {
    const SY = [S('benny', 'beer', 'Benny', [1, 3, 10], 3), S('pretzel', 'pretzel', 'Pretzel', [0.8, 2.5, 8], 4), S('salsicha', 'hotdog', 'Salsicha', [0.6, 2, 6], 4), S('acordeao', 'accordion', 'Acordeão', [0.5, 1.5, 5], 5), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'beers', name: 'Coringa', wild: true, w: 0.55 };
    const MYS = { id: 'mys', img: 'question', name: 'Pilha mistério', mys: true, noPay: true, w: 0.7, fw: 1.6 };
    const SC = { id: 'sc', img: 'goldbook', name: 'Livro', sc: true, w: 0.85, fw: 0.3 };
    const draw = pool([...SY, WILD, MYS, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const STK = [{ n: 2, w: 40 }, { n: 3, w: 25 }, { n: 4, w: 15 }, { n: 5, w: 10 }, { n: 7, w: 6 }, { n: 10, w: 4 }];
    const EXF = 0.25, RETRIG = { 2: 2, 3: 4 };
    async function play(rt, g, sps) {
      await rt.spin(g, { tease: !sps });
      if (g.flat().some(x => x.mys)) {
        // todas as pilhas mistério viram o mesmo símbolo, cada uma com 2 a 10 cópias
        const s = RNG.pick(SY);
        g.forEach((col, c) => col.forEach((x, r) => { if (x.mys) { const n = RNG.weighted(STK).n; g[c][r] = { ...s, n, t: '×' + n, c: 'gold', fresh: true }; } }));
        rt.msg(`📚 Stackways! Pilhas de ${s.name}`); await rt.drop(g);
      }
      const sc = count(g, x => x.sc);
      await pay(rt, ways(g, SY));
      // símbolos especiais: em 3+ rolos, expandem como uma pilha de 2 a 10 em cada rolo e pagam em qualquer posição
      for (const sp of sps || []) {
        if (rt.capped) break;
        const cols = [...new Set(cells(g, x => x.id === sp.id).map(([c]) => c))];
        if (cols.length < 3) continue;
        const ns = cols.map(() => RNG.weighted(STK).n);
        const show = g.map(col => col.slice());
        cols.forEach((c, i) => { show[c] = show[c].map((x, r) => ({ ...sp, c: 'gold', t: r === 0 ? '×' + ns[i] : undefined, fresh: true })); });
        await rt.drop(show);
        const v = sp.pays[Math.min(2, cols.length - 3)] * ns.reduce((a, b) => a * b, 1) * EXF;
        rt.mark(cols.flatMap(c => [0, 1, 2, 3].map(r => key(c, r)))); rt.win(v);
        rt.msg(`📖 ${sp.name} expandiu em ${cols.length} rolos (${ns.join('×')}): ${rt.coins(v)}`); rt.fx('big'); await rt.wait(900);
      }
      return sc;
    }
    App.register(K.create({
      id: 'bennycerveja', name: 'Benny, a Cerveja', studio: STUDIO, art: 'beer', mascot: 'pretzel',
      tag: 'Stackways até 100.000 caminhos', colors: ['#ca8a04', '#15803d'], bg: 'linear-gradient(180deg,#fef3c7,#fcd34d 50%,#14532d)',
      cols: 5, rows: 4, maxWin: 10000, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Benny the Beer" (Hacksaw Gaming).', hello: 'Pilhas mistério multiplicam os caminhos!',
      symbols: [...SY, WILD, MYS, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Cada símbolo empilhado conta como várias cópias (Stackways).')],
      highlights: ['🍺 5×4 com 1.024 caminhos que crescem até <b>100.000</b>', '📚 <b>Stackways:</b> pilhas mistério viram o mesmo símbolo com <b>2 a 10 cópias</b> cada', '📖 3 livros = <b>Livro dos Stackways</b>: 10 rodadas grátis com <b>2 símbolos especiais</b> que expandem em pilhas de 2 a 10', '📕 4+ livros = <b>Super Livro</b>, com <b>4 símbolos especiais</b>', '2/3 livros nas grátis = <b>+2/+4 giros</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 que paga por caminhos. Cada pilha mistério vira o mesmo símbolo sorteado e conta como 2 a 10 cópias dele, multiplicando os caminhos.</p>',
      features: '<p>📖 <b>3 livros</b> dão o <b>Livro dos Stackways</b>: 10 rodadas grátis com <b>2 símbolos especiais</b> sorteados. Se um especial aparecer em <b>3 ou mais rolos</b> (em qualquer posição), ele cobre esses rolos como uma pilha de <b>2 a 10</b> cópias e paga como caminhos.</p><p>📕 <b>4 ou mais livros</b> dão o <b>Super Livro</b>, igual, mas com <b>4 símbolos especiais</b>.</p><p>Nas rodadas grátis, <b>2 ou 3 livros</b> dão <b>+2 ou +4 giros</b>. Na compra, o bônus é sorteado (o Super Livro é o mais raro).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = pickTier([[3, 85], [4, 15]]);
        const nSp = sc >= 4 ? 4 : 2, pool8 = SY.slice(), sps = [];
        for (let i = 0; i < nSp; i++) sps.push(pool8.splice(RNG.int(0, pool8.length - 1), 1)[0]);
        for (const sp of sps) await rt.reveal('SÍMBOLO ESPECIAL', SY.map(s => ({ img: s.img || 'beer', t: s.name })), SY.indexOf(sp));
        await rt.fsLoop(10, async api => { const s = await play(rt, make('fw'), sps); const add = retrig(RETRIG, s); if (add) api.add(add); }, { title: nSp > 2 ? 'SUPER LIVRO DOS STACKWAYS' : 'LIVRO DOS STACKWAYS', sub: `Especiais: ${sps.map(s => s.name).join(', ')}` });
      },
    }));
  })();

  /* 19. Punho da Destruição — punhos sobem pelo rolo; Níveis de Vitória no Desafio */
  (() => {
    const RED = [S('lutador1', 'boxing', 'Lutador vermelho', [2, 5, 15], 3), S('lutadora1', 'womanfight', 'Lutadora vermelha', [1.5, 4, 12], 4)];
    const BLUE = [S('lutador2', 'martialarts', 'Lutador azul', [2, 5, 15], 3), S('lutadora2', 'ninja', 'Lutadora azul', [1.5, 4, 12], 4)];
    RED.forEach(s => { s.team = 'r'; }); BLUE.forEach(s => { s.team = 'b'; });
    const SY = [...RED, ...BLUE, ...R([[0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]])];
    const WILD = { id: 'w', img: 'star', name: 'Coringa', wild: true, w: 0.6 };
    const FR = { id: 'pr', img: 'boxingglove', name: 'Punho vermelho', fist: 'r', noPay: true, reels: [1, 2, 3], w: 0.3, fw: 1.4 };
    const FB = { id: 'pb', img: 'oncomingfist', name: 'Punho azul', fist: 'b', noPay: true, reels: [1, 2, 3], w: 0.3, fw: 1.4 };
    const SC = { id: 'sc', img: 'trophy', name: 'Troféu', sc: true, w: 0.75, fw: 0 };
    const draw = pool([...SY, WILD, FR, FB, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    // multiplicadores por golpe nas grátis (no jogo base, x2 a x200)
    const FMF = [{ m: 1, w: 50 }, { m: 2, w: 30 }, { m: 3, w: 12 }, { m: 5, w: 6 }, { m: 10, w: 2 }];
    // Níveis de Vitória do Desafio: vitórias (socos) necessárias e punhos garantidos por giro
    const VL = [{ at: 0, n: 0, t: '—' }, { at: 3, n: 3, t: '3+' }, { at: 8, n: 4, t: '4+' }, { at: 15, n: 5, t: '5+' }];
    async function fists(rt, g, st) {
      // garantia do nível de vitória: completa os punhos que faltam nos rolos 2 a 4
      if (st && VL[st.lv].n) {
        for (let k = count(g, x => x.fist), guard = 0; k < VL[st.lv].n && guard < 60; guard++) {
          const c = RNG.int(1, 3), r = RNG.int(0, 3);
          if (g[c][r].fist || g[c][r].sc) continue;
          g[c][r] = { ...(RNG.float() < 0.5 ? FR : FB), fresh: true }; k++;
        }
      }
      for (const [c, r] of cells(g, x => x.fist)) {
        const team = g[c][r].fist;
        if (!team) continue;
        // o punho sobe pelo rolo: coringas e lutadores do time rival atingidos viram multiplicador
        let m = 0;
        for (let rr = 0; rr <= r; rr++) { const x = g[c][rr]; if (x.wild || (x.team && x.team !== team)) m += wm(st ? FMF : HUGE); }
        const test = g.map(col => col.slice());
        for (let rr = 0; rr <= r; rr++) test[c][rr] = m ? mult({ ...WILD, c: 'duel' }, m) : { ...WILD, c: 'duel' };
        if (lines(test, L14, SY, { mult: 'add' }).total > lines(g, L14, SY, { mult: 'add' }).total) {
          g[c] = test[c].map((x, rr) => (rr <= r ? { ...x, fresh: true } : x));
          if (st) st.pts++;
          rt.msg(`👊 Punho ${team === 'r' ? 'vermelho' : 'azul'} no rolo ${c + 1}${m ? ` · x${m}` : ''}!`); rt.fx('boom');
        } else g[c][r] = { ...RNG.pick(SY) };
      }
      if (st) {
        while (st.lv < VL.length - 1 && st.pts >= VL[st.lv + 1].at) { st.lv++; rt.msg(`🏆 Nível de Vitória ${VL[st.lv].t}: ${VL[st.lv].n} punhos garantidos por giro!`); rt.fx('rise'); }
        rt.chip('vl', 'VITÓRIA', `${VL[st.lv].t} · ${st.pts}`);
      }
      await rt.drop(g);
    }
    App.register(K.create({
      id: 'punhodestruicao', name: 'Punho da Destruição', studio: STUDIO, art: 'oncomingfist', mascot: 'boxing',
      tag: 'Punhos viram coringas até x200 · Níveis de Vitória', colors: ['#dc2626', '#2563eb'], bg: 'linear-gradient(90deg,#7f1d1d,#111827 50%,#1e3a8a)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Fist of Destruction" (Hacksaw Gaming).', hello: 'Vermelho contra azul!',
      symbols: [...SY, WILD, FR, FB, SC],
      lineList: { cols: 5, rows: 4, list: L14, text: '14 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['👊 Punhos (rolos 2 a 4) sobem pelo rolo e viram <b>coringas</b> se isso der ganho', 'Cada <b>coringa</b> ou <b>lutador do time rival</b> atingido soma <b>x2 a x200</b>', '🏆 3 troféus = <b>Desafio</b>: 10 rodadas grátis em que cada soco conta uma vitória e sobe os <b>Níveis de Vitória</b> (3+, 4+ e 5+ punhos garantidos por giro)', '🏆 4 troféus = <b>Desafio Supremo</b>, que já começa no nível <b>4+</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 14 linhas. Os punhos vermelho e azul só funcionam se ajudarem num ganho: sobem do lugar onde caíram até o topo do rolo, transformando tudo em coringa. Coringas e lutadores do time adversário no caminho viram multiplicadores (x2 a x200), que se somam.</p>',
      features: `<p>🏆 <b>3 troféus</b> dão o <b>Desafio</b>: 10 rodadas grátis em que cada soco que vira coringa conta <b>1 vitória</b> para os times. Com ${VL[1].at}, ${VL[2].at} e ${VL[3].at} vitórias você sobe para os <b>Níveis de Vitória 3+, 4+ e 5+</b>, que garantem pelo menos esse número de punhos em <b>todo giro</b> até o fim. Nas grátis cada golpe vale de x1 a x10.</p><p>🏆 <b>4 troféus</b> dão o <b>Desafio Supremo</b>, que já começa no nível <b>4+</b>.</p><p class="muted small">Na compra, o bônus é sorteado (o Desafio Supremo é o mais raro).</p>`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await fists(rt, g, null); await pay(rt, lines(g, L14, SY, { mult: 'add' })); const sc = count(g, x => x.sc); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = pickTier([[3, 85], [4, 15]]);
        const st = sc >= 4 ? { lv: 2, pts: VL[2].at } : { lv: 0, pts: 0 };
        rt.chip('vl', 'VITÓRIA', `${VL[st.lv].t} · ${st.pts}`);
        await rt.fsLoop(10, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await fists(rt, g, st); await pay(rt, lines(g, L14, SY, { mult: 'add' })); }, sc >= 4 ? { title: 'DESAFIO SUPREMO!', sub: 'Começa no Nível de Vitória 4+' } : { title: 'DESAFIO!', sub: 'Socos sobem os Níveis de Vitória' });
        rt.chip('vl', null);
      },
    }));
  })();

  /* 20. Densho — pássaros que viram rolos multiplicadores; medidores por rolo nas grátis */
  (() => {
    const L10 = K.linesFor(4, 10);
    const SY = lsyms([['samurai', 'ninja', 'Samurai'], ['gueixa', 'geisha', 'Gueixa'], ['coruja', 'owl2', 'Coruja'], ['ponte', 'bridge', 'Ponte']]);
    const WILD = { id: 'w', img: 'cherryblossom', name: 'Coringa', wild: true, w: 0.6 };
    const D = [{ id: 'd1', img: 'bird', name: 'Densho azul', dens: [2, 10], tier: 0, w: 0.3, fw: 1.4 }, { id: 'd2', img: 'crane', name: 'Densho verde', dens: [5, 50], tier: 1, w: 0.1, fw: 0.5 }, { id: 'd3', img: 'phoenix', name: 'Densho vermelho', dens: [10, 100], tier: 2, w: 0.03, fw: 0.12 }].map(x => ({ ...x, noPay: true, reels: [1, 2, 3] }));
    const SC = { id: 'sc', img: 'torii', name: 'Torii', sc: true, w: 0.9, fw: 0.3 };
    const draw = pool([...SY, WILD, ...D, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const RETRIG = { 2: 2, 3: 4 };
    // medidor de cada rolo nas grátis: nível 1 = todos; 2 = sem o azul; 3 = só o vermelho
    const showMeters = (rt, st) => rt.head(st.lv.map((lv, c) => (c < 1 || c > 3 ? '' : `${'●'.repeat(st.dots[c])}${'○'.repeat(3 - st.dots[c])} N${lv}`)));
    async function play(rt, g, st) {
      if (st) {
        // níveis do rolo removem os Densho mais fracos (viram o próximo nível)
        g.forEach((col, c) => col.forEach((x, r) => { if (x.dens && x.tier < st.lv[c] - 1) g[c][r] = { ...D[st.lv[c] - 1] }; }));
      }
      const landed = cells(g, x => x.dens).map(([c]) => c);
      for (const [c, r] of cells(g, x => x.dens)) {
        if (!g[c][r].dens) continue;
        const [a, b] = g[c][r].dens, m = RNG.int(a, b);
        const test = g.map(col => col.slice()); test[c] = g[c].map(() => mult({ ...WILD }, m));
        if (lines(test, L10, SY, { mult: 'add' }).total > lines(g, L10, SY, { mult: 'add' }).total) { g[c] = test[c].map(x => ({ ...x, c: 'gold', fresh: true })); rt.msg(`🕊️ Densho: rolo ${c + 1} coringa x${m}`); rt.fx('boom'); }
        else g[c][r] = { ...RNG.pick(SY) };
      }
      await rt.drop(g);
      await pay(rt, lines(g, L10, SY, { mult: 'add' }));
      if (st) {
        landed.forEach(c => {
          if (st.lv[c] >= 3) return;
          if (++st.dots[c] >= 3) { st.dots[c] = 0; st.lv[c]++; rt.msg(`⛩️ Rolo ${c + 1} subiu para o nível ${st.lv[c]}!`); rt.fx('rise'); }
        });
        showMeters(rt, st);
      }
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
      highlights: ['🌸 5×4 com 10 linhas e paisagens em aquarela', '🕊️ Três pássaros <b>Densho</b> expandem em <b>rolos coringa</b> com <b>x2–x10</b>, <b>x5–x50</b> ou <b>x10–x100</b> quando dão ganho', '⛩️ 3 torii = <b>10 rodadas grátis</b>: cada rolo tem um <b>medidor de 3 pontos</b>; cada nível tira os Densho mais fracos daquele rolo', '⛩️ 4+ torii = <b>Super</b>, com todos os rolos já no <b>nível 2</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×4 com 10 linhas. Um pássaro Densho nos rolos 2 a 4 que ajude num ganho cobre o rolo inteiro como coringa multiplicador.</p>',
      features: '<p>⛩️ <b>3 torii</b> dão <b>10 rodadas grátis</b>. Cada rolo com Densho tem um medidor de <b>3 pontos</b> (acima da grade): todo Densho que cai no rolo acende um ponto, e com os 3 o rolo sobe de nível. No <b>nível 2</b> o Densho azul deixa de existir naquele rolo (vira verde) e no <b>nível 3</b> só cai o vermelho.</p><p>⛩️ <b>4 ou mais torii</b> dão as <b>Super Rodadas Grátis</b>, com todos os rolos começando no <b>nível 2</b>.</p><p>Nas rodadas grátis, <b>2 ou 3 torii</b> dão <b>+2 ou +4 giros</b>. Na compra, o bônus é sorteado (o Super é o mais raro).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = pickTier([[3, 85], [4, 15]]);
        const sup = sc >= 4, st = { lv: Array(5).fill(sup ? 2 : 1), dots: Array(5).fill(0) };
        showMeters(rt, st);
        await rt.fsLoop(10, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); const s = await play(rt, g, st); const add = retrig(RETRIG, s); if (add) api.add(add); }, { title: sup ? 'SUPER RODADAS GRÁTIS' : 'RODADAS GRÁTIS!', sub: sup ? 'Todos os rolos no nível 2' : 'Medidores de Densho por rolo' });
        rt.head(null);
      },
    }));
  })();
})();
