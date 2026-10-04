'use strict';

/* =========================================================
   Nolimit City — lote 2 (parte 1): xNudge, xWays, respins e os
   clássicos mais leves do estúdio. Temas sombrios sem violência
   gráfica. RTP calibrado por simulação (tools/calibrate.js).
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'nolimit';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const R = (pays, w) => K.ROYALS(pays, w);
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };
  const BIG = [{ m: 2, w: 45 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 9 }, { m: 25, w: 4 }, { m: 50, w: 1.5 }, { m: 100, w: 0.5 }];
  const wm = list => RNG.weighted(list).m;
  const near = (c, r) => [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
  const LOCK = () => ({ id: 'lock', img: 'ice', name: 'Gelo', c: 'locked', noPay: true });
  const L20 = K.LINES_5x3.slice(0, 20), L15 = K.LINES_5x3.slice(0, 15);
  const LP = [[2, 6, 20], [1.5, 5, 15], [1.2, 4, 12], [1, 3, 10], [0.4, 1, 3], [0.4, 1, 3], [0.3, 0.8, 2.5], [0.3, 0.8, 2.5]];
  const lsyms = list => [...list.map(([id, img, name], i) => S(id, img, name, LP[i], [3, 4, 4, 5][i])), ...R(LP.slice(4))];
  const WP = [[1, 3, 10], [0.8, 2.5, 8], [0.6, 2, 6], [0.5, 1.5, 5], [0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]];
  const wsyms = list => [...list.map(([id, img, name], i) => S(id, img, name, WP[i], [3, 4, 4, 5][i])), ...R(WP.slice(4))];
  /** xNudge: coringa alto que empurra até cobrir o rolo; cada empurrão soma +1 no multiplicador. */
  const nudgeReel = (g, c, WILD, extra = 0) => { const n = RNG.int(0, g[c].length - 1), m = 1 + n + extra; g[c] = g[c].map(x => (x.sc ? x : mult({ ...WILD, c: 'duel', fresh: true }, m))); return m; };
  /** ambos os lados: esquerda→direita + direita→esquerda (5 rolos contam uma vez) */
  const bothLines = (g, L, SY, o) => { const a = lines(g, L, SY, o), rev = g.slice().reverse(), b = lines(rev, L, SY, o); const n = g.length; b.wins = b.wins.filter(w => w.n < n); b.total = b.wins.reduce((s, w) => s + w.pay, 0); const cs = new Set(a.cells); if (b.total) b.cells.forEach(k => { const [c, r] = unkey(k); cs.add(key(n - 1 - c, r)); }); return { total: a.total + b.total, wins: [...a.wins, ...b.wins], cells: cs }; };
  const bothWays = (g, SY, o) => { const a = ways(g, SY, o), rev = g.slice().reverse(), b = ways(rev, SY, o); const n = g.length; b.wins = b.wins.filter(w => w.n < n); b.total = b.wins.reduce((s, w) => s + w.pay, 0); const cs = new Set(a.cells); if (b.total) b.cells.forEach(k => { const [c, r] = unkey(k); cs.add(key(n - 1 - c, r)); }); return { total: a.total + b.total, wins: [...a.wins, ...b.wins], cells: cs }; };

  /* 1. Lápide (Tombstone) — coringas foras da lei com xNudge */
  (() => {
    const SY = wsyms([['pistoleiro', 'cowboy', 'Pistoleiro'], ['caveira', 'skull', 'Caveira de boi'], ['revolver', 'pistol', 'Revólver'], ['whisky', 'tumbler', 'Uísque']]);
    const WILD = { id: 'w', img: 'cowboy', name: 'Fora da lei', wild: true, reels: [1, 2, 3], w: 0.45, fw: 1.4 };
    const SC = { id: 'sc', img: 'moneybag', name: '$', sc: true, reels: [1, 2, 3], w: 1.6, fw: 0 };
    const SHERIFF = { id: 'xer', img: 'police', name: 'Distintivo do xerife', badge: 's', noPay: true, reels: [0], w: 0.4 };
    const MARSHAL = { id: 'mar', img: 'militarymedal', name: 'Distintivo do marechal', badge: 'm', noPay: true, reels: [4], w: 0.4 };
    const draw = pool([...SY, WILD, SC, SHERIFF, MARSHAL]);
    const make = wk => grid([2, 3, 3, 3, 2], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      if (st && st.sticky) st.sticky.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      for (let c = 1; c <= 3; c++) if (g[c].some(x => x.wild && !x.m)) { const m = nudgeReel(g, c, WILD, st && st.add ? st.add : 0); if (st && st.sticky) st.sticky.set(c, m); rt.msg(`🤠 xNudge no rolo ${c + 1}: x${m}`); }
      await rt.drop(g);
      await pay(rt, ways(g, SY));
      return { sc: count(g, x => x.sc), sh: count(g, x => x.badge === 's'), ma: count(g, x => x.badge === 'm') };
    }
    App.register(K.create({
      id: 'lapide', name: 'Lápide', studio: STUDIO, art: 'cowboy', mascot: 'skull',
      tag: 'xNudge · 3 rodadas grátis', colors: ['#92400e', '#111827'], bg: 'linear-gradient(180deg,#78350f,#1c1917 60%,#0c0a09)',
      cols: 5, rows: 3, maxWin: 11456, vol: 5, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Tombstone" (Nolimit City).', hello: 'Os foras da lei empurram e multiplicam!',
      symbols: [...SY, WILD, SC, SHERIFF, MARSHAL],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 2-3-3-3-2 = 108 caminhos. Multiplicadores no caminho se multiplicam.')],
      highlights: ['🤠 Rolos 2-3-3-3-2 (108 caminhos)', '⬇️ <b>xNudge:</b> o coringa fora da lei (rolos 2 a 4) empurra até cobrir o rolo e ganha <b>+1 por empurrão</b>', '💰 3 $ = <b>Pistoleiro</b> (8 giros); com distintivo do xerife = <b>Justiça</b> (coringas colantes); com o do marechal = <b>Recompensa</b> (+1 extra em todo empurrão)', 'Prêmio máximo: <b>11.456x</b>'],
      how: '<p>Rolos 2-3-3-3-2 com 108 caminhos. O coringa fora da lei é alto como o rolo; quando aparece só em parte, ele é empurrado até cobrir o rolo todo, somando +1 no multiplicador a cada casa. Vários rolos de coringa no mesmo caminho se multiplicam.</p>',
      features: '<p>💰 <b>3 símbolos $</b> (rolos 2 a 4) dão 8 rodadas grátis. O tipo depende dos distintivos que caírem junto: nenhum = <b>Pistoleiro</b> (mais coringas); xerife (rolo 1) = <b>Justiça</b> (rolos de coringa colantes); marechal (rolo 5) = <b>Recompensa</b> (todo coringa já começa com +2).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const r = await play(rt, g, null); if (r.sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { mode: r.sh ? 'j' : r.ma ? 'b' : 'g' }); } },
      async bonus(rt, { mode = 'g' } = {}) {
        const st = { sticky: mode === 'j' ? new Map() : null, add: mode === 'b' ? 2 : 0 };
        const names = { g: 'PISTOLEIRO', j: 'JUSTIÇA', b: 'RECOMPENSA' };
        await rt.fsLoop(8, async () => { await play(rt, make('fw'), st); }, { title: names[mode], sub: { g: 'Mais foras da lei', j: 'Coringas colantes', b: 'Coringas +2' }[mode] });
      },
    }));
  })();

  /* 2. Manhattan Fica Selvagem — Bugsy e Betty douradas */
  (() => {
    const SY = [S('bugsy', 'man', 'Bugsy', [1, 3, 10], 3), S('betty', 'woman', 'Betty', [1, 3, 10], 3), S('champanhe', 'champagne', 'Champanhe', [0.6, 2, 6], 4), S('carro', 'car', 'Carro antigo', [0.5, 1.5, 5], 4), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'goldbar', name: 'Coringa dourado', wild: true, w: 0.4 };
    const SC = { id: 'sc', img: 'cityscape', name: 'Manhattan', sc: true, w: 1.0, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => K.stack(grid([3, 3, 3, 3, 3], c => draw(c, wk)), 0.45);
    const HIGH = ['bugsy', 'betty'];
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      if (st) st.wild.forEach(id => g.forEach((col, c) => col.forEach((x, r) => { if (x.id === id) g[c][r] = { ...WILD, c: 'gold' }; })));
      if (RNG.float() < 0.07) { const id = RNG.pick(HIGH); g.forEach((col, c) => col.forEach((x, r) => { if (x.id === id) g[c][r] = { ...WILD, c: 'gold', fresh: true }; })); rt.msg(`✨ ${id === 'bugsy' ? 'Bugsy' : 'Betty'} ficou dourado(a): coringa!`); await rt.drop(g); }
      let res = ways(g, SY);
      await pay(rt, res);
      // Bugsy e Betty empilhados por inteiro: Respin da Festa
      const full = id => g.some(col => col.every(x => x.id === id));
      if (full('bugsy') && full('betty')) {
        g.forEach((col, c) => { if (col.every(x => HIGH.includes(x.id))) g[c] = col.map(() => ({ ...WILD, c: 'sticky' })); });
        rt.msg('🎉 Respin da Festa Selvagem!'); rt.fx('boom');
        const ng = make('w'); g.forEach((col, c) => { if (col.every(x => x.wild)) ng[c] = col; });
        g.splice(0, 5, ...ng); await rt.spin(g, { tease: false }); await pay(rt, ways(g, SY));
      }
      if (st) { st.got += g.flat().filter(x => HIGH.includes(x.id)).length; while (st.got >= 10 && st.wild.length < 2) { st.got -= 10; const id = HIGH.find(h => !st.wild.includes(h)); st.wild.push(id); st.api.add(2); rt.msg(`🗽 Medidor cheio: ${id} vira coringa e +2 giros`); } rt.chip('man', 'MEDIDOR', `${st.got}/10`); }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'manhattan', name: 'Manhattan Fica Selvagem', studio: STUDIO, art: 'cityscape', mascot: 'woman',
      tag: 'Anos 20 · coringas dourados', colors: ['#ca8a04', '#111827'], bg: 'linear-gradient(180deg,#1c1917,#44403c 50%,#ca8a04)',
      cols: 5, rows: 3, maxWin: 2025, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Manhattan Goes Wild" (Nolimit City).', hello: 'Bugsy e Betty viram coringas dourados!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×3 = 243 caminhos.')],
      highlights: ['🎩 5×3 com 243 caminhos e muitos símbolos empilhados', '✨ Bugsy ou Betty podem virar <b>coringas dourados</b> de surpresa', '🎉 Os dois empilhados por inteiro = <b>Respin da Festa</b> com as pilhas viradas coringa', '🗽 3 Manhattans = <b>10 rodadas grátis</b>: junte 10 Bugsy/Betty para torná-los coringas e ganhar +2 giros', 'Prêmio máximo: <b>2.025x</b>'],
      how: '<p>Grade 5×3 com 243 caminhos. A qualquer giro, Bugsy ou Betty podem ficar dourados e virar coringas. Se os dois aparecerem empilhados cobrindo rolos inteiros, as pilhas viram coringa e há um respin.</p>',
      features: '<p>🗽 <b>3 Manhattans</b> dão <b>10 rodadas grátis</b>. Cada Bugsy ou Betty que aparece enche o medidor; a cada 10, um deles passa a ser coringa até o fim e você ganha +2 giros.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { got: 0, wild: [] }; await rt.fsLoop(10, async api => { st.api = api; await play(rt, make('fw'), st); }, { sub: 'Encha o medidor de Manhattan' }); rt.chip('man', null); },
    }));
  })();

  /* 3. Acampamento do Trator — clones e abdução */
  (() => {
    const SY = lsyms([['vaca', 'cow', 'Vaca'], ['porco', 'pig', 'Porco'], ['ovelha', 'sheep', 'Ovelha'], ['galinha', 'chicken', 'Galinha']]);
    const WILD = { id: 'w', img: 'tractor', name: 'Coringa', wild: true, w: 0.5 };
    const SC = { id: 'sc', img: 'ufo', name: 'Disco voador', sc: true, w: 0.9, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function play(rt, g, sticky) {
      await rt.spin(g, { tease: !sticky });
      if (sticky) sticky.forEach(k => { const [c, r] = unkey(k); g[c][r] = { ...WILD, c: 'sticky' }; });
      const r0 = RNG.float();
      if (!sticky && r0 < 0.04) { const a = RNG.pick(SY.slice(0, 4)); RNG.shuffle([0, 1, 2, 3, 4]).slice(0, RNG.int(2, 4)).forEach(c => { g[c] = g[c].map(() => ({ ...a, c: 'gold', fresh: true })); }); rt.msg(`🐄 Ataque dos clones: ${a.name} empilhado!`); await rt.drop(g); }
      else if (!sticky && r0 < 0.07) { g.forEach((col, c) => col.forEach((x, r) => { if (x.letter) g[c][r] = { ...RNG.pick(SY.slice(0, 4)), fresh: true }; })); rt.msg('🛸 Raio trator: as cartas foram levadas!'); await rt.drop(g); }
      const res = lines(g, L20, SY);
      await pay(rt, res);
      // nas grátis os vencedores são abduzidos e viram coringas colantes
      if (sticky && res.total) res.cells.forEach(k => sticky.add(k));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'acampamentotrator', name: 'Acampamento do Trator', studio: STUDIO, art: 'tractor', mascot: 'cow',
      tag: 'Clones e abduções na fazenda', colors: ['#65a30d', '#7c3aed'], bg: 'linear-gradient(180deg,#312e81,#4c1d95 40%,#3f6212)',
      cols: 5, rows: 3, maxWin: 5000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Tractor Beam" (Nolimit City) — o "Tractor Camp" da lista não foi encontrado e usamos a fazenda dos alienígenas como referência.', hello: 'Os alienígenas chegaram na fazenda!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🚜 5×3 com 20 linhas', '🐄 <b>Ataque dos Clones:</b> um animal aparece empilhado em até 4 rolos', '🛸 <b>Raio Trator:</b> todas as cartas são levadas e viram animais', '3/4/5 discos = <b>7/9/12 rodadas grátis</b>: todo símbolo vencedor é abduzido e vira <b>coringa colante</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Dois recursos surpresa podem aparecer no jogo base: os clones (um animal empilhado em vários rolos) e o raio trator (remove as cartas).</p>',
      features: '<p>🛸 <b>3, 4 ou 5 discos voadores</b> dão <b>7, 9 ou 12 rodadas grátis</b>. Nelas, todo símbolo que fizer parte de um ganho é abduzido e deixa um coringa colante no lugar até o fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const st = new Set(); await rt.fsLoop({ 3: 7, 4: 9 }[sc] || 12, async () => { await play(rt, make('fw'), st); }, { title: 'GIROS DA ABDUÇÃO', sub: 'Vencedores viram coringas colantes' }); },
    }));
  })();

  /* 4. Cristais (WiXX) — respins de reforço */
  (() => {
    const SY = [S('rubi', 'gem', 'Rubi', [1, 3, 8], 3), S('topazio', 'orangediamond', 'Topázio', [1, 3, 8], 3), S('safira', 'bluediamond', 'Safira', [1, 3, 8], 3), S('ametista', 'purpleheart', 'Ametista', [0.4, 1.2, 3], 5), S('esmeralda', 'greenheart', 'Esmeralda', [0.4, 1.2, 3], 5), S('quartzo', 'whiteheart', 'Quartzo', [0.3, 1, 2.5], 6)];
    const WILD = { id: 'w', img: 'crystal', name: 'Coringa', wild: true, w: 0.5 };
    const draw = pool([...SY, WILD]);
    const make = () => grid([3, 3, 3, 3], c => draw(c));
    async function play(rt, g, all) {
      await rt.spin(g, { tease: false });
      let res = ways(g, SY), m = 1, guard = 0;
      await pay(rt, res);
      // ganhos com rubi, topázio ou safira disparam respins com reforço
      while (guard++ < 8 && !rt.capped) {
        const boost = all ? ['rubi', 'topazio', 'safira'] : res.wins.map(w => w.sym.id).filter(id => ['rubi', 'topazio', 'safira'].includes(id));
        if (!boost.length) break;
        const ng = make();
        if (boost.includes('rubi')) { for (let i = 0; i < RNG.int(2, 4); i++) ng[RNG.int(0, 3)][RNG.int(0, 2)] = { ...WILD, c: 'gold' }; }
        if (boost.includes('safira')) { const s = RNG.pick(SY); RNG.shuffle([0, 1, 2, 3]).slice(0, 2).forEach(c => { ng[c] = ng[c].map(() => ({ ...s, c: 'gold' })); }); }
        if (boost.includes('topazio')) m = Math.min(5, m + 1);
        g.splice(0, 4, ...ng);
        rt.msg(`💎 Respin de reforço: ${boost.join(' + ')}${m > 1 ? ` · x${m}` : ''}`); rt.fx('rise');
        await rt.spin(g, { tease: false });
        res = ways(g, SY);
        await pay(rt, res, m);
        if (all && guard >= 3) break;
      }
    }
    App.register(K.create({
      id: 'cristais', name: 'Cristais', studio: STUDIO, art: 'crystal', mascot: 'gem',
      tag: 'Respins de reforço até x5', colors: ['#dc2626', '#2563eb'], bg: 'radial-gradient(circle at 50% 40%,#1e1b4b,#020617 70%)',
      cols: 4, rows: 3, maxWin: 2796, vol: 5, rtp: '~96,6%', target: 0.966,
      intro: 'Inspirado no "WiXX" (Nolimit City).', hello: 'Rubi, topázio e safira dão reforços!',
      symbols: [...SY, WILD],
      tables: [table('Pagamento por caminho', heads(3, 2, ' rolos'), SY, '4×3 = 81 caminhos.')],
      highlights: ['💎 4×3 com 81 caminhos e <b>sem rodadas grátis</b>', 'Ganho com <b>rubi</b> = respin com coringas extras; <b>safira</b> = respin com pilhas; <b>topázio</b> = respin com multiplicador (até x5)', 'Os reforços se encadeiam enquanto sair ganho com os cristais', 'Prêmio máximo: <b>2.796x</b>'],
      how: '<p>Grade 4×3 com 81 caminhos. Toda vez que um ganho inclui rubi, topázio ou safira, há um respin com o reforço daquele cristal; o multiplicador do topázio vai somando até x5.</p>',
      features: '<p>A compra de bônus dá o <b>Super Reforço</b>: 3 respins com os três reforços ao mesmo tempo.</p>',
      make,
      async spin(rt) { await play(rt, make(), false); },
      async bonus(rt) { rt.stat('hold'); await rt.banner('SUPER REFORÇO', 'Os três cristais ao mesmo tempo', 1300); await play(rt, make(), true); },
    }));
  })();

  /* 5. Jukebox da Sorte (Casino Win Spin) — zonas quentes */
  (() => {
    const SY = [S('sete', 'seven', 'Sete', [3, 10, 40], 3), S('sino', 'bell2', 'Sino', [2, 6, 25], 4), S('bar', 'barchart', 'Bar', [1.5, 4, 15], 4), S('cereja', 'cherries', 'Cereja', [1, 3, 10], 5), S('limao', 'lemon', 'Limão', [0.5, 1.5, 5], 6), S('ameixa', 'plum', 'Ameixa', [0.5, 1.5, 5], 6)];
    const WILD = { id: 'w', img: 'jukebox', name: 'Coringa', wild: true, w: 0.6 };
    const draw = pool([...SY, WILD]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    App.register(K.create({
      id: 'jukeboxsorte', name: 'Jukebox da Sorte', studio: STUDIO, art: 'jukebox', mascot: 'seven',
      tag: 'Gire até ganhar', colors: ['#db2777', '#0ea5e9'], bg: 'linear-gradient(180deg,#1e1b4b,#831843 50%,#0c4a6e)',
      cols: 5, rows: 3, maxWin: 2000, vol: 4, rtp: '~96,7%', target: 0.967, buy: false,
      intro: 'Inspirado no "Casino Win Spin" (Nolimit City).', hello: 'Combine as zonas quentes!',
      symbols: [...SY, WILD],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🎶 5×3 com 20 linhas e <b>zonas quentes</b> no meio dos rolos 2 e 4', '🔥 Coringa numa zona quente = o rolo inteiro vira coringa', '🎯 Dois símbolos iguais nas zonas quentes = esse símbolo vira coringa e começa o <b>Gire Até Ganhar</b>: respins até sair ganho, com multiplicador subindo a cada tentativa', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. As casas do meio dos rolos 2 e 4 são zonas quentes.</p>',
      features: '<p>🔥 Um <b>coringa</b> numa zona quente expande pelo rolo todo. 🎯 Se as duas zonas quentes mostrarem o <b>mesmo símbolo</b>, ele vira coringa em toda a tela e começa o <b>Gire Até Ganhar</b>: os rolos giram de novo até sair um ganho, e cada respin sem ganho soma +1 no multiplicador.</p>',
      make,
      async spin(rt) {
        let g = make(); await rt.spin(g);
        [1, 3].forEach(c => { if (g[c][1].wild) g[c] = g[c].map(() => ({ ...WILD, c: 'gold', fresh: true })); });
        const a = g[1][1], b = g[3][1];
        if (!a.wild && a.id === b.id) {
          const sym = a.id;
          rt.stat('hold'); rt.msg(`🎯 Zonas quentes iguais: ${a.name} vira coringa! Gire até ganhar`); rt.fx('rise');
          let m = 1;
          for (let guard = 0; guard < 12; guard++) {
            g.forEach((col, c) => col.forEach((x, r) => { if (x.id === sym) g[c][r] = { ...WILD, c: 'gold' }; }));
            const res = lines(g, L20, SY);
            if (res.total) { await pay(rt, res, m); break; }
            m++; g = make(); await rt.spin(g, { tease: false });
          }
          return;
        }
        await rt.drop(g);
        await pay(rt, lines(g, L20, SY));
      },
      async bonus() {},
    }));
  })();

  /* 6 e 7. Drama na Cozinha (Sushi Mania / BBQ Frenzy) — cascata e ingredientes */
  function kitchen(o) {
    const SY = o.syms;
    const WILD = { id: 'w', img: o.wildImg, name: 'Coringa', wild: true, w: 0.45 };
    const draw = pool([...SY, WILD]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const ING = o.ing;
    // com o.meter os ingredientes ganhos ficam guardados entre os giros
    const kept = new Set();
    async function play(rt, g, fs) {
      const conv = gg => { if (fs) gg.forEach((col, c) => col.forEach((x, r) => { if (ING.includes(x.id) && RNG.float() < (o.conv || 0.35)) gg[c][r] = fs === 'mult' ? mult({ ...WILD, c: 'gold' }, RNG.int(2, 3)) : { ...WILD, c: 'gold' }; })); };
      // coringa clone: transforma de 1 a 3 vizinhos em coringa
      const clone = gg => cells(gg, x => x.wild && !x.cl).forEach(([c, r]) => { gg[c][r].cl = true; RNG.shuffle(near(c, r)).slice(0, RNG.int(o.cloneMin, o.cloneMax)).forEach(([a, b]) => { if (gg[a] && gg[a][b] && !gg[a][b].wild) gg[a][b] = { ...WILD, cl: true, fresh: true }; }); });
      conv(g); clone(g);
      await rt.drop(g);
      const won = new Set();
      const r = await tumble(rt, g, {
        draw: c => draw(c),
        evaluate: gg => { const res = lines(gg, L20, SY, { mult: 'add' }); res.wins.forEach(w => { if (ING.includes(w.sym.id)) won.add(w.sym.id); }); return res; },
        onStep: async (s, gg) => { conv(gg); clone(gg); },
      });
      if (!fs && o.chain && r.steps >= 3) {
        const s = RNG.pick(SY);
        g.forEach((col, c) => col.forEach((x, rr) => { if (x.id === s.id) g[c][rr] = { ...WILD, c: 'gold', fresh: true }; }));
        rt.msg(`🌶️ ${o.chain}: ${s.name} vira coringa!`); rt.fx('rise'); await rt.drop(g);
        await pay(rt, lines(g, L20, SY));
      }
      if (o.meter && !fs) { won.forEach(id => kept.add(id)); rt.chip('ing', 'INGREDIENTES', `${kept.size}/3`); if (kept.size >= 3) { kept.clear(); return true; } return false; }
      return won.size >= 3;
    }
    return K.create({
      id: o.id, name: o.name, studio: STUDIO, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: 5, rows: 3, maxWin: o.maxWin, vol: 3, rtp: '~96,7%', target: 0.967,
      intro: o.intro, hello: o.hello,
      symbols: [...SY, WILD],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda, com cascata.')],
      highlights: o.highlights, how: o.how, features: o.features,
      make,
      async spin(rt) { if (await play(rt, make(), null)) { await rt.wait(800); await this.bonus(rt, {}); } },
      async bonus(rt) { await rt.fsLoop(o.fsN, async () => { await play(rt, make(), o.fsMode); }, { title: o.fsTitle, sub: o.fsSub }); },
    });
  }
  App.register(kitchen({
    id: 'sushimania', name: 'Drama na Cozinha: Sushi Mania', art: 'sushi', mascot: 'ninja', wildImg: 'ninja', cloneMin: 1, cloneMax: 3, fsN: 10, fsMode: 'wild', conv: 0.18, fsTitle: 'SUSHI SELVAGEM', fsSub: 'Ingredientes viram coringa',
    tag: 'Clones coringa · ingredientes', colors: ['#dc2626', '#111827'], bg: 'linear-gradient(180deg,#fef2f2,#fecaca 40%,#7f1d1d)', maxWin: 697,
    intro: 'Inspirado no "Kitchen Drama: Sushi Mania" (Nolimit City).', hello: 'Os ninjas se clonam!',
    syms: [S('salmao', 'sushi', 'Salmão', [1.5, 5, 20], 9.5), S('atum', 'fishcake', 'Atum', [1.5, 5, 20], 9.5), S('camarao', 'shrimp', 'Camarão', [1.5, 5, 20], 9.5), S('wasabi', 'leafygreen', 'Wasabi', [0.8, 2.5, 10], 5), S('hashi', 'chopsticks', 'Hashi', [0.6, 2, 8], 6), ...R([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]])], ing: ['salmao', 'atum', 'camarao'],
    highlights: ['🍣 5×3 com 20 linhas e cascata', '🥷 <b>Coringas Bunshin</b> se clonam em 1 a 3 casas vizinhas', '🐟 Ganhe com os <b>3 ingredientes</b> (salmão, atum e camarão) no mesmo giro = <b>10 rodadas grátis</b> em que eles podem virar coringas', 'Prêmio máximo: <b>697x</b>'],
    how: '<p>Grade 5×3 com 20 linhas e cascata. Cada coringa ninja que cai transforma de 1 a 3 casas vizinhas em coringas.</p>',
    features: '<p>🐟 Se no mesmo giro (somando as cascatas) houver ganhos com <b>salmão, atum e camarão</b>, você ganha <b>10 rodadas grátis</b> em que esses três ingredientes podem virar coringas.</p>',
  }));
  App.register(kitchen({
    id: 'churrascofrenesi', name: 'Drama na Cozinha: Churrasco', art: 'cutofmeat', mascot: 'cowboy', wildImg: 'hotpepper', cloneMin: 0, cloneMax: 1, fsN: 5, meter: true, fsMode: 'mult', fsTitle: 'CHURRASCO SELVAGEM', fsSub: 'Carnes viram coringas x2 ou x3', chain: 'Espírito da Pimenta',
    tag: 'Carnes coringa · Espírito da Pimenta', colors: ['#ea580c', '#7c2d12'], bg: 'linear-gradient(180deg,#fdba74,#c2410c 50%,#431407)', maxWin: 1050,
    intro: 'Inspirado no "Kitchen Drama: BBQ Frenzy" (Nolimit City).', hello: 'Acenda a churrasqueira!',
    syms: [S('costela', 'meatonbone', 'Costela', [1.5, 5, 20], 3), S('salsicha', 'hotdog', 'Salsicha', [1.5, 5, 20], 3), S('bife', 'cutofmeat', 'Bife', [1.5, 5, 20], 2), S('milho', 'corn', 'Milho', [0.8, 2.5, 10], 5), S('molho', 'bottle', 'Molho', [0.6, 2, 8], 6), ...R([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]])], ing: ['costela', 'salsicha', 'bife'],
    highlights: ['🍖 5×3 com 20 linhas e cascata', '🌶️ <b>Espírito da Pimenta:</b> 3 cascatas seguidas transformam um símbolo em coringa', '🥩 Ganhe com as <b>3 carnes</b> (elas ficam guardadas entre os giros) = <b>5 rodadas grátis</b> com as carnes virando <b>coringas x2 ou x3</b>', 'Prêmio máximo: <b>1.050x</b>'],
    how: '<p>Grade 5×3 com 20 linhas e cascata. Se a cascata durar 3 ganhos seguidos, o Espírito da Pimenta transforma todas as cópias de um símbolo em coringas.</p>',
    features: '<p>🥩 Cada carne que fizer parte de um ganho é guardada no medidor (não precisa ser no mesmo giro). Com <b>costela, salsicha e bife</b> guardadas, você ganha <b>5 rodadas grátis</b> em que as carnes podem virar coringas com multiplicador x2 ou x3 (somados na linha).</p>',
  }));

  /* 8. Oktoberfest — festas surpresa e canecas multiplicadoras */
  (() => {
    const SY = lsyms([['hansel', 'man', 'Hansel'], ['gretchen', 'woman', 'Gretchen'], ['pretzel', 'pretzel', 'Pretzel'], ['salsicha', 'hotdog', 'Salsicha']]);
    const WILD = { id: 'w', img: 'accordion', name: 'Coringa', wild: true, w: 0.55 };
    const BEER = { id: 'sc', img: 'beers', name: 'Caneca', sc: true, w: 0.9, fw: 0.9 };
    const draw = pool([...SY, WILD, BEER]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      const r0 = RNG.float();
      if (r0 < 0.03) { g.forEach((col, c) => col.forEach((x, r) => { if (x.letter) g[c][r] = { ...WILD, c: 'gold', fresh: true }; })); rt.msg('🥨 Festa do Pretzel: cartas viram coringa!'); rt.fx('boom'); await rt.drop(g); }
      else if (r0 < 0.06) { RNG.shuffle([1, 2, 3]).slice(0, RNG.int(1, 2)).forEach(c => { g[c] = g[c].map(() => ({ ...WILD, c: 'gold', fresh: true })); }); rt.msg('🎉 Giro da Festa: pilhas de coringas!'); await rt.drop(g); }
      let m = 1;
      if (st) { const n = count(g, x => x.sc); if (n) { st.m = Math.min(5, st.m + n * 0.5); if (n >= 3) st.api.add(Math.min(12 - st.extra, 4)), st.extra += 4; } m = Math.floor(st.m); rt.chip('mult', 'CANECAS', 'x' + m); }
      await pay(rt, lines(g, L20, SY), m);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'oktoberfest', name: 'Oktoberfest', studio: STUDIO, art: 'beers', mascot: 'pretzel',
      tag: 'Festas surpresa · canecas x5', colors: ['#2563eb', '#ca8a04'], bg: 'linear-gradient(180deg,#bfdbfe,#3b82f6 40%,#78350f)',
      cols: 5, rows: 3, maxWin: 500, vol: 3, rtp: '~96,7%', target: 0.967,
      intro: 'Inspirado no "Oktoberfest" (Nolimit City).', hello: 'Prost!',
      symbols: [...SY, WILD, BEER],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🍺 5×3 com 20 linhas', '🥨 <b>Festa do Pretzel</b>: todas as cartas viram coringa; 🎉 <b>Giro da Festa</b>: rolos inteiros de coringa', '3 canecas = <b>10 rodadas grátis</b>: cada caneca sobe o multiplicador (até x5) e 3 delas dão giros extras (até +12)', 'Prêmio máximo: <b>500x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Dois recursos surpresa animam a festa no jogo base.</p>',
      features: '<p>🍺 <b>3 canecas</b> dão <b>10 rodadas grátis</b>. Cada caneca que aparecer soma +0,5 no multiplicador (que vai até x5); 3 canecas no mesmo giro dão +4 giros, até +12.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { m: 1, extra: 0 }; await rt.fsLoop(10, async api => { st.api = api; await play(rt, make('fw'), st); }, { title: 'GIROS DA CERVEJA', sub: 'Canecas multiplicam' }); rt.chip('mult', null); },
    }));
  })();

  /* 9. Parque Arrepiante (Creepy Carnival) — respins de vitória e estrela */
  (() => {
    const SY = lsyms([['palhaco', 'clown', 'Palhaço'], ['magico', 'mage', 'Mágico'], ['roda', 'ferris', 'Roda-gigante'], ['balao', 'balloon', 'Balão']]);
    const WILD = { id: 'w', img: 'performing', name: 'Coringa', wild: true, w: 0.55 };
    const SC = { id: 'sc', img: 'ticket', name: 'Ingresso', sc: true, w: 0.75, fw: 0.5 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      const base = st ? st.m : 1;
      let res = lines(g, L20, SY), m = base;
      await pay(rt, res, m);
      // respins de vitória: vencedores e coringas ficam, bônus de multiplicador a cada respin
      for (let guard = 0; guard < 5 && res.total && !rt.capped; guard++) {
        const keep = new Set([...res.cells, ...cells(g, x => x.wild).map(([c, r]) => key(c, r))]);
        const ng = make(st ? 'fw' : 'w'); keep.forEach(k => { const [c, r] = unkey(k); ng[c][r] = { ...g[c][r], c: 'sticky' }; });
        g.splice(0, 5, ...ng); m++;
        rt.msg(`🎪 Respin da vitória: x${m}`);
        await rt.spin(g, { tease: false });
        const nr = lines(g, L20, SY);
        if (nr.total <= res.total) break;
        await pay(rt, { ...nr, total: nr.total - res.total }, m);
        res = nr;
      }
      // medidor da estrela
      if (!st) { star += g.flat().filter(x => SY.slice(0, 4).includes(SY.find(s => s.id === x.id))).length; if (star >= 25) { star = 0; rt.msg('⭐ Medidor cheio: Giro Estrela com coringas!'); const sg = make('w'); for (let i = 0; i < 4; i++) sg[RNG.int(1, 3)][RNG.int(0, 2)] = { ...WILD }; g.splice(0, 5, ...sg); await rt.spin(g, { tease: false }); await pay(rt, lines(g, L20, SY), 2); } rt.chip('star', 'ESTRELA', `${star}/25`); }
      return count(g, x => x.sc);
    }
    let star = 0;
    App.register(K.create({
      id: 'parquearrepiante', name: 'Parque Arrepiante', studio: STUDIO, art: 'clown', mascot: 'ferris',
      tag: 'Respins de vitória · até 70 giros', colors: ['#7c3aed', '#dc2626'], bg: 'linear-gradient(180deg,#1e1b4b,#4c1d95 50%,#7f1d1d)',
      cols: 5, rows: 3, maxWin: 1595, vol: 3, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "The Creepy Carnival" (Nolimit City).', hello: 'Bem-vindo ao parque...',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🎪 5×3 com 20 linhas', '🔁 <b>Respins da vitória:</b> vencedores e coringas ficam e os outros giram, com o multiplicador subindo a cada respin', '⭐ Símbolos altos enchem o <b>medidor da estrela</b>: cheio = Giro Estrela com coringas e x2', '🎫 3+ ingressos = <b>10 rodadas grátis</b> com multiplicador x3 que sobe a cada nova trinca (até x5 e 70 giros)', 'Prêmio máximo: <b>1.595x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Depois de um ganho, os símbolos vencedores e os coringas ficam presos e o resto gira de novo; se o ganho melhorar, a diferença é paga com o multiplicador do respin (x2, x3…).</p>',
      features: '<p>🎫 <b>3 ou mais ingressos</b> dão <b>10 rodadas grátis</b> com multiplicador x3. Cada nova trinca de ingressos dá +10 giros e +1 no multiplicador (até x5 e 70 giros).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { m: 3, tot: 10 }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), st) >= 3 && st.tot < 70) { st.tot += 10; st.m = Math.min(5, st.m + 1); api.add(10); } rt.chip('mult', 'MULT.', 'x' + st.m); }, { sub: 'Multiplicador x3' }); rt.chip('mult', null); },
    }));
  })();

  /* 10. Moedas da Fortuna — dragão que empurra e moedas da sorte */
  (() => {
    const SY = lsyms([['dragao', 'dragon', 'Dragão'], ['lanterna', 'izakaya', 'Lanterna'], ['leque', 'fan', 'Leque'], ['jade', 'greenheart', 'Jade']]);
    const DRAGON = { id: 'dg', img: 'dragonface', name: 'Dragão coringa', wild: true, w: 0.7 };
    const COIN = { id: 'sc', img: 'coin', name: 'Moeda da sorte', sc: true, w: 0.9, fw: 1.1 };
    const draw = pool([...SY, DRAGON, COIN]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    async function play(rt, g) {
      await rt.spin(g, { tease: true });
      await pay(rt, lines(g, L20, SY));
      // 3 dragões num rolo: coringa expandido que continua dando respins enquanto cair dragão
      let held = [0, 1, 2, 3, 4].filter(c => g[c].every(x => x.wild));
      for (let guard = 0; guard < 6 && held.length && !rt.capped; guard++) {
        const ng = make(); held.forEach(c => { ng[c] = g[c].map(x => ({ ...x, c: 'sticky' })); });
        g.splice(0, 5, ...ng);
        rt.msg('🐉 Empurrão do Dragão: respin!'); rt.fx('rise');
        await rt.spin(g, { tease: false });
        await pay(rt, lines(g, L20, SY));
        const more = [0, 1, 2, 3, 4].filter(c => !held.includes(c) && g[c].some(x => x.wild));
        more.forEach(c => { g[c] = g[c].map(() => ({ ...DRAGON, c: 'gold' })); });
        if (!more.length) break;
        held = [...held, ...more];
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'moedasfortuna', name: 'Moedas da Fortuna', studio: STUDIO, art: 'coin', mascot: 'dragonface',
      tag: 'Empurrão do Dragão · moedas x10', colors: ['#dc2626', '#facc15'], bg: 'linear-gradient(180deg,#0f172a,#7f1d1d 60%,#450a0a)',
      cols: 5, rows: 3, maxWin: 6015, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Coins of Fortune" (Nolimit City).', hello: 'O dragão traz a sorte!',
      symbols: [...SY, DRAGON, COIN],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🐉 5×3 com 20 linhas', '🔥 <b>Empurrão do Dragão:</b> rolo cheio de dragões fica preso e dá respins; novos dragões juntam mais rolos', '🪙 3+ moedas = <b>Respins da Sorte</b>: as moedas são coletadas e a cada 3 o multiplicador sobe (até x10)', 'Prêmio máximo: <b>6.015x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Quando um rolo fica todo de dragões, ele vira um coringa preso e os outros rolos giram de novo; cada dragão novo transforma o rolo dele e dá mais um respin.</p>',
      features: '<p>🪙 <b>3 ou mais moedas</b> abrem os <b>Respins da Sorte</b>: 3 respins que reiniciam a cada moeda nova. Cada moeda vale de 1x a 10x e, a cada 3 moedas coletadas, o multiplicador final sobe +1 (até x10).</p>',
      make,
      async spin(rt) { const g = make(); if (await play(rt, g) >= 3) { await rt.wait(800); await this.bonus(rt, { n: count(g, x => x.sc) }); } },
      async bonus(rt, { n = 3 } = {}) {
        rt.stat('hold');
        await rt.banner('RESPINS DA SORTE', 'Colete moedas · a cada 3, +1 no multiplicador', 1300);
        let got = n, left = 3, v = 0;
        for (let i = 0; i < n; i++) v += RNG.pick([1, 1, 2, 2, 3, 5, 10]);
        while (left > 0 && !rt.capped) {
          left--; rt.chip('fs', 'RESPINS', left);
          const g = make(); await rt.spin(g, { tease: false });
          const c = count(g, x => x.sc);
          if (c) { got += c; left = 3; for (let i = 0; i < c; i++) v += RNG.pick([1, 1, 2, 2, 3, 5, 10]); rt.msg(`🪙 +${c} moeda${c > 1 ? 's' : ''} (${got})`); rt.fx('coin'); }
          rt.chip('mult', 'MULT.', 'x' + Math.min(10, 1 + Math.floor(got / 3)));
        }
        rt.chip('fs', null); rt.chip('mult', null);
        const m = Math.min(10, 1 + Math.floor(got / 3));
        rt.win(v * m); rt.msg(`🪙 ${got} moedas: ${rt.coins(v)} × ${m} = ${rt.coins(v * m)}`); rt.fx('big'); await rt.wait(900);
      },
    }));
  })();

  /* 11. Missão na Masmorra — paga dos dois lados, pedra do poder e alquimia */
  (() => {
    const L29 = K.linesFor(4, 29);
    const ORES = ['rubi', 'safira', 'esmeralda', 'ouro'];
    const SY = [S('rubi', 'gem', 'Rubi', [1, 3, 10], 4), S('safira', 'bluediamond', 'Safira', [1, 3, 10], 4), S('esmeralda', 'greenheart', 'Esmeralda', [1, 3, 10], 4), S('ouro', 'yellowheart', 'Ouro', [1, 3, 10], 4), ...R([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]])];
    const WILD = { id: 'w', img: 'mage', name: 'Coringa', wild: true, w: 0.45 };
    const SC = { id: 'sc', img: 'alembic', name: 'Alquimia', sc: true, w: 0.7, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => grid([4, 4, 4, 4, 4], c => draw(c));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      if (st) { st.sticky.forEach(k => { const [c, r] = unkey(k); g[c][r] = { ...WILD, c: 'sticky' }; }); cells(g, x => x.id === st.ore).forEach(([c, r]) => { st.sticky.add(key(c, r)); g[c][r] = { ...WILD, c: 'gold' }; }); }
      if (!st && RNG.float() < 0.05) { const c = RNG.int(0, 3), r = RNG.int(0, 2); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) g[c + a][r + b] = { ...WILD, c: 'gold', fresh: true }; rt.msg('🔮 Pedra do Poder: área 2×2 de coringas!'); await rt.drop(g); }
      await pay(rt, bothLines(g, L29, SY));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'missaomasmorra', name: 'Missão na Masmorra', studio: STUDIO, art: 'alembic', mascot: 'mage',
      tag: 'Paga dos dois lados · alquimia', colors: ['#7c3aed', '#ca8a04'], bg: 'linear-gradient(180deg,#1c1917,#44403c 50%,#4c1d95)',
      cols: 5, rows: 4, maxWin: 450, vol: 2, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Dungeon Quest" (Nolimit City).', hello: 'Os heróis guardam a montanha!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 4, list: L29, text: '29 linhas que pagam dos dois lados.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Paga da esquerda para a direita e da direita para a esquerda.')],
      highlights: ['⛏️ 5×4 com 29 linhas que pagam <b>dos dois lados</b>', '🔮 <b>Pedra do Poder:</b> uma área 2×2 vira coringa de surpresa', '⚗️ 3+ alquimias = <b>8 Giros da Alquimia</b>: a cada giro um minério diferente vira <b>coringa colante</b>', 'Prêmio máximo: <b>450x</b>'],
      how: '<p>Grade 5×4 com 29 linhas; os ganhos valem a partir da esquerda e da direita. A Pedra do Poder pode criar um bloco 2×2 de coringas a qualquer momento.</p>',
      features: '<p>⚗️ <b>3 ou mais alquimias</b> dão <b>8 rodadas grátis</b>. A cada giro um dos quatro minérios é escolhido: todas as cópias dele viram coringas que ficam presos até o fim.</p>',
      make,
      async spin(rt) { const g = make(); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { sticky: new Set(), ore: null }; await rt.fsLoop(8, async api => { st.ore = ORES[api.i % 4]; rt.chip('ore', 'MINÉRIO', SY.find(s => s.id === st.ore).name); await play(rt, make(), st); }, { title: 'GIROS DA ALQUIMIA', sub: 'Minérios viram coringas colantes' }); rt.chip('ore', null); },
    }));
  })();

  /* 12. Yeti do Gelo — o gelo quebra e a grade cresce */
  (() => {
    const SY = [S('yeti', 'snowman', 'Yeti', [0.5, 1.5, 5], 3), S('pinguim', 'penguin', 'Pinguim', [0.4, 1.2, 4], 4), S('urso', 'polarbear', 'Urso polar', [0.3, 1, 3], 4), S('peixe', 'fish', 'Peixe', [0.25, 0.8, 2.5], 5), ...R([[0.1, 0.25, 0.8], [0.1, 0.25, 0.8], [0.08, 0.2, 0.6], [0.08, 0.2, 0.6]])];
    const WILD = { id: 'w', img: 'snowcap', name: 'Yeti coringa', wild: true, yeti: true, w: 0.5 };
    const draw = pool([...SY, WILD]);
    /** 5 rolos de 7: as 2 casas de cima e as 2 de baixo começam congeladas */
    const make = open => grid([7, 7, 7, 7, 7], (c, r) => (open.has(key(c, r)) || (r >= 2 && r <= 4) ? draw(c) : LOCK()));
    const iced = (g) => cells(g, x => x.id === 'lock').map(([c, r]) => key(c, r));
    async function play(rt, open, fs) {
      let g = make(open);
      if (fs) { g[1][3] = { ...WILD }; g[3][3] = { ...WILD }; }
      await rt.spin(g, { tease: false });
      if (!fs && RNG.float() < 0.05) { RNG.shuffle(iced(g)).slice(0, RNG.int(2, 10)).forEach(k => { open.add(k); const [c, r] = unkey(k); g[c][r] = { ...draw(c), fresh: true }; }); rt.msg('🦶 O Yeti sacudiu a tela: gelo quebrado!'); rt.fx('boom'); await rt.drop(g); }
      const sticky = new Map();
      for (let guard = 0; guard < 12 && !rt.capped; guard++) {
        // yeti coringa quebra 2 a 3 gelos, gruda e dá respin
        const ys = cells(g, x => x.yeti && !sticky.has(key(...[x]))).filter(([c, r]) => !sticky.has(key(c, r)));
        ys.forEach(([c, r]) => { sticky.set(key(c, r), true); RNG.shuffle(iced(g)).slice(0, RNG.int(2, 3)).forEach(k => { open.add(k); }); });
        const res = ways(g, SY);
        await pay(rt, res);
        if (!ys.length && !(guard > 0 && res.total)) break;
        if (ys.length) rt.msg(`❄️ Yeti quebrou o gelo: ${open.size} casas extras abertas`);
        const ng = make(open); sticky.forEach((v, k) => { const [c, r] = unkey(k); ng[c][r] = { ...WILD, c: 'sticky' }; });
        g = ng; await rt.spin(g, { tease: false });
      }
      return g;
    }
    App.register(K.create({
      id: 'yetigelo', name: 'Yeti do Gelo', studio: STUDIO, art: 'snowcap', mascot: 'snowman',
      tag: 'Gelo quebra · até 16.807 caminhos', colors: ['#38bdf8', '#e0f2fe'], bg: 'linear-gradient(180deg,#e0f2fe,#7dd3fc 50%,#0c4a6e)',
      cols: 5, rows: 7, cellH: 0.75, maxWin: 8920, vol: 5, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Ice Ice Yeti" (Nolimit City).', hello: 'Quebre o gelo!',
      symbols: [...SY, WILD], extraSprites: ['ice'],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'De 243 até 16.807 caminhos conforme o gelo quebra.')],
      highlights: ['🧊 5 rolos de 3 casas abertas; acima e abaixo há <b>blocos de gelo</b> (até 7 por rolo = <b>16.807 caminhos</b>)', '🦶 <b>Sacudida do Yeti:</b> quebra de 2 a 10 blocos de surpresa', '❄️ O <b>Yeti coringa</b> quebra 2 a 3 blocos, gruda e dá <b>respin</b>; ganhos nos respins dão mais respins', 'Prêmio máximo: <b>8.920x</b>'],
      how: '<p>5 rolos com 3 casas abertas e 4 congeladas (2 em cima, 2 embaixo). Casas que descongelam ficam abertas durante a sequência de respins, aumentando os caminhos.</p>',
      features: '<p>❄️ Não há rodadas grátis: os <b>Respins de Gelo</b> fazem esse papel. A compra de bônus começa os respins com dois Yetis e várias casas abertas.</p>',
      make: () => make(new Set()),
      async spin(rt) { await play(rt, new Set(), false); },
      async bonus(rt) { rt.stat('hold'); await rt.banner('RESPINS DE GELO', 'Começando com o gelo rachado', 1300); const open = new Set(); for (let i = 0; i < 6; i++) open.add(key(RNG.int(0, 4), RNG.pick([0, 1, 5, 6]))); await play(rt, open, true); },
    }));
  })();

  /* 13. Corujas — pilha de scatter e Giros do Sonho */
  (() => {
    const SY = [S('coruja', 'owl2', 'Coruja guerreira', [2, 6, 20], 3), S('chama', 'fire', 'Chama', [1, 3, 10], 4, { dream: 'ember' }), S('esmeralda', 'greenheart', 'Esmeralda', [0.8, 2.5, 8], 4, { dream: 'emerald' }), S('gelo', 'snowflake', 'Gelo', [0.6, 2, 6], 5, { dream: 'frozen' }), ...R([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]])];
    const WILD = { id: 'w', img: 'owl', name: 'Coringa', wild: true, w: 0.5, fw: 0.8 };
    const SC = { id: 'sc', img: 'moonview', name: 'Lua', sc: true, w: 0.9, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => K.stack(grid([3, 3, 3, 3, 3], c => draw(c, wk)), 0.4);
    App.register(K.create({
      id: 'corujas', name: 'Corujas', studio: STUDIO, art: 'owl2', mascot: 'owl',
      tag: 'Saque da Lua · 3 sonhos', colors: ['#0f766e', '#7c3aed'], bg: 'radial-gradient(circle at 50% 20%,#134e4a,#0f0a1f 70%)',
      cols: 5, rows: 3, maxWin: 1500, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Owls" (Nolimit City).', hello: 'As corujas guerreiras observam...',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L15, text: '15 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🦉 5×3 com 15 linhas e símbolos empilhados', '🌕 Lua empilhada cobrindo o rolo 3 = <b>Saque da Lua</b> (paga mais com coringas na tela)', '3+ luas = <b>Giros do Sonho</b>: escolha <b>Brasa</b> (chamas viram coringa), <b>Esmeralda</b> (esmeraldas viram corujas) ou <b>Gelo</b> (gelos viram o símbolo mais comum)', 'Prêmio máximo: <b>1.500x</b>'],
      how: '<p>Grade 5×3 com 15 linhas. Se o rolo 3 ficar coberto de luas, elas pagam um prêmio que cresce com o número de coringas na tela.</p>',
      features: '<p>🌙 <b>3 ou mais luas</b> abrem a escolha do sonho, com <b>5 rodadas grátis</b> e coringas empilhados: Brasa transforma as chamas em coringas; Esmeralda transforma as esmeraldas em corujas; Gelo transforma os gelos no símbolo mais comum da tela.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w'); await rt.spin(g); await pay(rt, lines(g, L15, SY));
        if (g[2].every(x => x.sc)) { const v = 3 + 3 * count(g, x => x.wild); rt.win(v); rt.msg(`🌕 Saque da Lua: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(700); }
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const d = await rt.choose('ESCOLHA O SONHO', [{ id: 'ember', img: 'fire', label: 'Brasa', desc: 'chamas viram coringa' }, { id: 'emerald', img: 'greenheart', label: 'Esmeralda', desc: 'esmeraldas viram corujas' }, { id: 'frozen', img: 'snowflake', label: 'Gelo', desc: 'gelos viram o mais comum' }]);
        await rt.fsLoop(5, async api => {
          const g = make('fw'); await rt.spin(g, { tease: false });
          const freq = {}; g.flat().forEach(x => { if (x.pays) freq[x.id] = (freq[x.id] || 0) + 1; });
          const common = SY.find(s => s.id === Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]) || SY[4];
          g.forEach((col, c) => col.forEach((x, r) => { if (x.dream === d) g[c][r] = d === 'ember' ? { ...WILD, c: 'gold' } : d === 'emerald' ? { ...SY[0], c: 'gold' } : { ...common, c: 'gold' }; }));
          await rt.drop(g); await pay(rt, lines(g, L15, SY));
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { title: 'GIROS DO SONHO', sub: { ember: 'Sonho de Brasa', emerald: 'Sonho de Esmeralda', frozen: 'Sonho de Gelo' }[d] });
      },
    }));
  })();

  /* 14. Estrelato (Starstruck) — 3×3 com coringas multiplicadores */
  (() => {
    const L5 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
    const SY = [S('diamante', 'gem', 'Diamante', [50], 2), S('melancia', 'watermelon', 'Melancia', [25], 3), S('bar3', 'barchart', 'Bar triplo', [15], 4), S('bar2', 'chartup', 'Bar duplo', [10], 5), S('bar1', 'chartdown', 'Bar', [5], 6), S('copas', 'heartsuit', 'Copas', [2], 7), S('paus', 'clubsuit', 'Paus', [2], 7), S('espadas', 'spadesuit', 'Espadas', [2], 7)];
    const WILD = { id: 'w', img: 'glowstar', name: 'Coringa', wild: true, w: 1.1 };
    const STAR = { id: 'star', img: 'shootingstar', name: 'Estrela bônus', star: true, noPay: true, reels: [1], w: 0.22 };
    const draw = pool([...SY, WILD, STAR]);
    const make = () => grid([3, 3, 3], c => { const x = draw(c); if (x.wild && RNG.float() < 0.5) mult(x, RNG.pick([2, 2, 3, 5])); return x; });
    const PICKS = [{ v: 5, w: 40 }, { v: 10, w: 25 }, { v: 25, w: 15 }, { v: 50, w: 10 }, { v: 100, w: 6 }, { v: 250, w: 3 }, { v: 1000, w: 1 }];
    App.register(K.create({
      id: 'estrelato', name: 'Estrelato', studio: STUDIO, art: 'glowstar', mascot: 'gem',
      tag: 'Coringas x2/x3/x5 · prêmio 1.000x', colors: ['#ec4899', '#22d3ee'], bg: 'linear-gradient(180deg,#0f172a,#701a75 50%,#0e7490)',
      cols: 3, rows: 3, maxWin: 1635, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Starstruck" (Nolimit City).', hello: 'Clássico de 3 rolos em neon!',
      symbols: [...SY, WILD, STAR],
      lineList: { cols: 3, rows: 3, list: L5, text: '5 linhas.' },
      tables: [table('Pagamento por linha', ['3'], SY, '3 iguais numa linha.')],
      highlights: ['🌟 3×3 com 5 linhas, estilo caça-níquel clássico em neon', '✨ Coringas com <b>x2, x3 ou x5</b> que <b>se multiplicam</b> entre si', '💫 Estrela bônus no meio do rolo 2 = <b>jogo de escolha</b> com prêmios de 5x a 1.000x', 'Prêmio máximo: <b>1.635x</b>'],
      how: '<p>Grade 3×3 com 5 linhas. Os coringas podem vir com multiplicador; numa linha com dois ou três coringas os multiplicadores se multiplicam.</p>',
      features: '<p>💫 Se a <b>estrela bônus</b> parar no centro do rolo 2, você escolhe uma de 9 estrelas e ganha o prêmio dela (5x a 1.000x).</p>',
      make,
      async spin(rt) { const g = make(); await rt.spin(g); await pay(rt, lines(g, L5, SY)); if (g[1][1].star) { await rt.wait(600); await this.bonus(rt, {}); } },
      async bonus(rt) {
        rt.stat('hold');
        const prizes = Array.from({ length: 9 }, () => RNG.weighted(PICKS).v);
        const id = await rt.choose('ESCOLHA UMA ESTRELA', prizes.map((v, i) => ({ id: String(i), img: 'shootingstar', label: '★', desc: '?' })));
        const v = prizes[Number(id)];
        rt.win(v); rt.msg(`💫 A estrela valia ${rt.coins(v)}!`); rt.fx('jackpot'); await rt.wait(900);
      },
    }));
  })();

  /* 15. Magia Maia — coringas que grudam e sincronia */
  (() => {
    const SY = [S('totem', 'moai', 'Totem', [2, 6, 20], 3), S('jaguar', 'leopard', 'Jaguar', [1.5, 4, 15], 4), S('arara', 'parrot', 'Arara', [1, 3, 10], 4), S('cacau', 'chestnut', 'Cacau', [0.8, 2, 6], 5), ...R([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]])];
    const WILD = { id: 'w', img: 'fire', name: 'Coringa', wild: true, reels: [1, 2, 3], w: 0.6 };
    const draw = pool([...SY, WILD]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    async function play(rt, start) {
      let g = make();
      if (start) start.forEach(k => { const [c, r] = unkey(k); g[c][r] = { ...WILD, c: 'sticky' }; });
      await rt.spin(g, { tease: false });
      if (!start && RNG.float() < 0.04) { const s = RNG.pick(SY); [1, 2, 3].forEach(c => { g[c] = g[c].map(() => ({ ...s, c: 'gold', fresh: true })); }); rt.msg('🌀 Sincronia Misteriosa nos rolos do meio!'); await rt.drop(g); }
      await pay(rt, bothWays(g, SY));
      // coringas nos rolos do meio grudam (o centro do rolo 3 também) e dão respin
      const sticky = new Set(start || []);
      for (let guard = 0; guard < 10 && !rt.capped; guard++) {
        const nw = cells(g, x => x.wild).map(([c, r]) => key(c, r)).filter(k => !sticky.has(k));
        if (!nw.length) break;
        nw.forEach(k => sticky.add(k)); sticky.add(key(2, 1));
        rt.msg(`🔥 Coringas maias grudaram: respin! (${sticky.size})`); rt.fx('rise');
        g = make(); sticky.forEach(k => { const [c, r] = unkey(k); g[c][r] = { ...WILD, c: 'sticky' }; });
        await rt.spin(g, { tease: false });
        await pay(rt, bothWays(g, SY));
      }
    }
    App.register(K.create({
      id: 'magiamaia', name: 'Magia Maia', studio: STUDIO, art: 'moai', mascot: 'parrot',
      tag: 'Coringas colantes · paga dos dois lados', colors: ['#16a34a', '#ea580c'], bg: 'linear-gradient(180deg,#14532d,#3f6212 50%,#7c2d12)',
      cols: 5, rows: 3, maxWin: 1264, vol: 3, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Mayan Magic Wildfire" (Nolimit City).', hello: 'Ganhos valem dos dois lados!',
      symbols: [...SY, WILD],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '243 caminhos, da esquerda e da direita.')],
      highlights: ['🗿 5×3 com 243 caminhos que pagam <b>dos dois lados</b> e <b>sem rodadas grátis</b>', '🔥 <b>Coringas Maias:</b> coringa nos rolos do meio <b>gruda</b>, prende o centro do rolo 3 e dá respin; cada coringa novo dá outro', '🌀 <b>Sincronia Misteriosa:</b> os 3 rolos do meio viram o mesmo símbolo', 'Prêmio máximo: <b>1.264x</b>'],
      how: '<p>Grade 5×3 com 243 caminhos, valendo a partir dos dois lados. Os coringas só caem nos rolos 2 a 4.</p>',
      features: '<p>🔥 Quando cai um coringa, ele fica preso, o centro do rolo 3 também vira coringa preso e os rolos giram de novo; cada coringa novo estende os respins. A compra de bônus começa os respins com cinco coringas presos em cruz.</p>',
      make,
      async spin(rt) { await play(rt, null); },
      async bonus(rt) { rt.stat('hold'); await play(rt, new Set([key(1, 1), key(2, 1), key(3, 1), key(2, 0), key(2, 2)])); },
    }));
  })();

  /* 16. Thor: Hora do Martelo — bônus do relâmpago e Giros de Asgard */
  (() => {
    const SY = lsyms([['martelo', 'hammer', 'Martelo'], ['thor', 'beardman', 'Thor'], ['elmo', 'militaryhelmet', 'Elmo'], ['chifre', 'drinkhorn', 'Chifre']]);
    const RUNE = { id: 'runa', img: 'runestone', name: 'Runa', rune: true, noPay: true, w: 1.2 };
    const WILD = { id: 'w', img: 'lightning', name: 'Coringa', wild: true, w: 0.5 };
    const BOLT = { id: 'raio', img: 'cloudbolt', name: 'Bônus do relâmpago', bolt: true, noPay: true, reels: [4], w: 0.3, fw: 0 };
    const SC = { id: 'sc', img: 'shield', name: 'Escudo', sc: true, w: 0.95, fw: 0 };
    const draw = pool([...SY, RUNE, WILD, BOLT, SC]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function lightning(rt, g) {
      const k = RNG.weighted([{ k: 'm', w: 40 }, { k: 'w', w: 40 }, { k: 'r', w: 20 }]).k;
      if (k === 'm') { const m = RNG.int(2, 4); rt.msg(`⚡ Relâmpago: x${m}!`); return m; }
      if (k === 'w') { const n = RNG.int(3, 7); for (let i = 0; i < n; i++) g[RNG.int(0, 3)][RNG.int(0, 2)] = { ...WILD, c: 'gold', fresh: true }; rt.msg(`⚡ Relâmpago: ${n} coringas!`); }
      else { RNG.shuffle([1, 2, 3]).slice(0, RNG.int(1, 2)).forEach(c => { g[c] = g[c].map(() => ({ ...WILD, c: 'gold', fresh: true })); }); rt.msg('⚡ Relâmpago: rolos de coringa!'); }
      rt.fx('zap'); await rt.drop(g); return 1;
    }
    async function play(rt, g, fs) {
      await rt.spin(g, { tease: !fs });
      let m = 1;
      if (g.flat().some(x => x.bolt) || fs) m = await lightning(rt, g);
      const r0 = RNG.float();
      if (r0 < 0.05) { const s = RNG.pick(SY); g.forEach((col, c) => col.forEach((x, r) => { if (x.rune) g[c][r] = { ...s, c: 'gold', fresh: true }; })); rt.msg(`🪨 Runas viraram ${s.name}!`); await rt.drop(g); }
      else if (r0 < 0.07) { g.forEach((col, c) => col.forEach((x, r) => { if (SY.slice(1, 4).includes(SY.find(s => s.id === x.id))) g[c][r] = { ...SY[0], c: 'gold', fresh: true }; })); rt.msg('🔨 Hora do Martelo: altos viram martelos!'); await rt.drop(g); }
      g.forEach((col, c) => col.forEach((x, r) => { if (x.rune || x.bolt) g[c][r] = { ...RNG.pick(SY.slice(4)) }; }));
      await pay(rt, lines(g, L20, SY), m);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'thormartelo', name: 'Thor: Hora do Martelo', studio: STUDIO, art: 'hammer', mascot: 'beardman',
      tag: 'Relâmpago · runas · martelos', colors: ['#2563eb', '#94a3b8'], bg: 'linear-gradient(180deg,#1e3a8a,#334155 60%,#0f172a)',
      cols: 5, rows: 3, maxWin: 2328, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Thor: Hammer Time" (Nolimit City).', hello: 'O relâmpago de Thor no rolo 5!',
      symbols: [...SY, RUNE, WILD, BOLT, SC],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['⚡ <b>Bônus do relâmpago</b> no rolo 5: multiplicador até <b>x4</b>, <b>3 a 7 coringas</b> ou <b>1 a 2 rolos de coringa</b>', '🪨 <b>Runas Arrasadoras:</b> todas as runas viram o mesmo símbolo; 🔨 <b>Hora do Martelo:</b> os altos viram martelos', '🛡️ 3 escudos = <b>8 Giros de Asgard</b> com o bônus do relâmpago em todo giro', 'Prêmio máximo: <b>2.328x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. As runas não pagam, mas podem virar todas o mesmo símbolo de surpresa. A Hora do Martelo transforma os outros altos no martelo, o que mais paga.</p>',
      features: '<p>🛡️ <b>3 escudos</b> dão <b>8 Giros de Asgard</b>: o bônus do relâmpago acontece em todo giro (3+ escudos nelas dão +4).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, false) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { await rt.fsLoop(8, async api => { if (await play(rt, make('fw'), true) >= 3) api.add(4); }, { title: 'GIROS DE ASGARD', sub: 'Relâmpago em todo giro' }); },
    }));
  })();

  /* 17. Tribo do Dragão — xWays e xNudge com cascata */
  (() => {
    const SY = [S('cacadora', 'woman', 'Caçadora', [1, 2.5, 6, 15], 3), S('dragao', 'dragon', 'Dragão', [0.8, 2, 5, 12], 4), S('ovo', 'egg', 'Ovo de dragão', [0.6, 1.5, 4, 9], 5), S('lanca', 'spear', 'Lança', [0.5, 1.2, 3, 7], 5), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const WILD = { id: 'w', img: 'volcano', name: 'Coringa xNudge', wild: true, reels: [1, 2, 3, 4], w: 0.25, fw: 0.4 };
    const XW = { id: 'xw', img: 'question', name: 'xWays', xw: true, noPay: true, w: 0.4, fw: 0.6 };
    const SC = { id: 'sc', img: 'dragonface', name: 'Bônus', sc: true, w: 0.55, fw: 0.35 };
    const draw = pool([...SY, WILD, XW, SC]);
    const make = wk => grid([4, 4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, wk, extreme) {
      await rt.spin(g, { tease: false });
      // xWays: todos viram o mesmo símbolo com 2 a 4 cópias cada
      if (g.flat().some(x => x.xw)) { const s = RNG.pick(SY); g.forEach((col, c) => col.forEach((x, r) => { if (x.xw) { const n = RNG.int(2, 4); g[c][r] = { ...s, n, t: '×' + n, c: 'gold', fresh: true }; } })); rt.msg(`❓ xWays: ${s.name}!`); }
      for (let c = 1; c <= 4; c++) if (g[c].some(x => x.wild && !x.m)) nudgeReel(g, c, WILD, extreme ? 1 : 0);
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c, wk), evaluate: gg => ways(gg, SY) });
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'tribodragao', name: 'Tribo do Dragão', studio: STUDIO, art: 'dragon', mascot: 'woman',
      tag: 'xWays + xNudge · 27.000x', colors: ['#ea580c', '#1c1917'], bg: 'linear-gradient(180deg,#7c2d12,#292524 60%,#0c0a09)',
      cols: 6, rows: 4, maxWin: 27000, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Dragon Tribe" (Nolimit City).', hello: 'A caçadora persegue os dragões!',
      symbols: [...SY, WILD, XW, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 (4.096 caminhos) que crescem com xWays até 20.736.')],
      highlights: ['🐉 6×4 com cascata', '❓ <b>xWays:</b> os mistérios viram o mesmo símbolo com <b>2 a 4 cópias</b> cada (até 20.736 caminhos)', '⬇️ <b>xNudge:</b> coringas empurram até cobrir o rolo, +1 por empurrão; vários se multiplicam', '3+ bônus: <b>Giros do Dragão</b> normais (10 giros) ou <b>Extremos</b> (8 giros com coringas +1)', 'Prêmio máximo: <b>27.000x</b>'],
      how: '<p>Grade 6×4 que paga por caminhos, com cascata. Os símbolos xWays se revelam todos como o mesmo símbolo, cada um contando como 2 a 4 cópias. O coringa xNudge empurra até cobrir o rolo, somando +1 por casa.</p>',
      features: '<p>🐲 <b>3 ou mais bônus</b> dão a escolha: <b>Normal</b> com 10 rodadas grátis, ou <b>Extremo</b> com 8 rodadas grátis em que todo coringa xNudge começa com +1 e xWays caem mais.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', false) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const v = await rt.choose('GIROS DO DRAGÃO', [{ id: 'n', img: 'dragon', label: 'Normal', desc: '10 giros', sim: true }, { id: 'x', img: 'volcano', label: 'Extremo', desc: '8 giros · coringas +1' }]); await rt.fsLoop(v === 'x' ? 8 : 10, async api => { if (await play(rt, make('fw'), 'fw', v === 'x') >= 3) api.add(3); }, { title: v === 'x' ? 'GIROS EXTREMOS' : 'GIROS DO DRAGÃO', sub: v === 'x' ? 'Coringas +1' : 'xWays e xNudge' }); },
    }));
  })();

  /* 18. Eva Venenosa — magia líquida e portais */
  (() => {
    const SY = [S('eva', 'fairy', 'Eva', [2, 6, 20], 3, { stack: true }), S('pocaoverde', 'potion', 'Poção verde', [1, 3, 10], 4, { potion: true }), S('pocaoroxa', 'testtube', 'Poção roxa', [1, 3, 10], 4, { potion: true }), S('flor', 'hibiscus', 'Flor', [0.8, 2.5, 8], 5), ...R([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]])];
    const WILD = { id: 'w', img: 'mushroom', name: 'Coringa que expande', wild: true, reels: [1, 2, 3], w: 0.45 };
    const BON = { id: 'bon', img: 'tulip', name: 'Flor do portal', bon: true, noPay: true, reels: [4], w: 0.12 };
    const draw = pool([...SY, WILD, BON]);
    const make = () => K.stack(grid([3, 3, 3, 3, 3], c => draw(c)), 0.35);
    async function play(rt, g, portals) {
      await rt.spin(g, { tease: false });
      if (portals) portals.forEach((n, c) => { if (n > 0) g[c] = g[c].map(() => ({ ...WILD, c: 'gold' })); });
      [1, 2, 3].forEach(c => { if (g[c].some(x => x.wild)) g[c] = g[c].map(() => ({ ...WILD, c: 'gold' })); });
      if (g.some(col => col.every(x => x.id === 'eva'))) { g.forEach((col, c) => col.forEach((x, r) => { if (x.potion) g[c][r] = { ...SY[0], c: 'gold', fresh: true }; })); rt.msg('🧪 Magia Líquida: poções viram Eva!'); rt.fx('rise'); }
      await rt.drop(g);
      await pay(rt, lines(g, L20, SY));
      return count(g, x => x.bon);
    }
    App.register(K.create({
      id: 'evavenenosa', name: 'Eva Venenosa', studio: STUDIO, art: 'fairy', mascot: 'potion',
      tag: 'Magia líquida · portais coringa', colors: ['#16a34a', '#a21caf'], bg: 'radial-gradient(circle at 50% 30%,#14532d,#2e1065 70%)',
      cols: 5, rows: 3, maxWin: 2000, vol: 4, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Poison Eve" (Nolimit City).', hello: 'A fada venenosa e suas poções...',
      symbols: [...SY, WILD, BON],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🧚 5×3 com 20 linhas e símbolos empilhados', '🍄 Coringas nos rolos do meio <b>expandem</b> pelo rolo inteiro', '🧪 <b>Magia Líquida:</b> um rolo coberto por Eva transforma todas as poções em Eva', '🌷 Flores na zona quente (rolo 5) abrem <b>portais</b>: rolos de coringa por 3 a 12 giros grátis', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Coringas (rolos 2 a 4) sempre expandem. Se Eva cobrir um rolo inteiro, todas as poções da tela viram Eva.</p>',
      features: '<p>🌷 <b>Poder das Flores:</b> cada flor que cai na zona quente do rolo 5 cria um <b>portal</b> no rolo livre mais próximo à esquerda; o portal transforma o rolo em coringa por 3 a 12 giros grátis. O bônus dura enquanto houver portal aberto.</p>',
      make,
      async spin(rt) { const g = make(); const b = await play(rt, g, null); if (b) { await rt.wait(800); await this.bonus(rt, { b }); } },
      async bonus(rt, { b = 1 } = {}) {
        const portals = [0, 0, 0, 0, 0];
        const open = n => { for (let i = 0; i < n; i++) { const c = [3, 2, 1, 0].find(cc => portals[cc] <= 0); if (c == null) break; portals[c] = RNG.int(3, 12); } };
        open(b);
        await rt.fsLoop(Math.max(...portals), async api => {
          const g = make();
          rt.head(portals.map(n => (n > 0 ? `🌀${n}` : '')));
          const nb = await play(rt, g, portals);
          portals.forEach((n, c) => { if (n > 0) portals[c]--; });
          if (nb) open(nb);
          const need = Math.max(...portals);
          if (need > api.left) api.add(need - api.left, true);
        }, { title: 'PODER DAS FLORES', sub: 'Portais viram rolos coringa' });
        rt.head(null);
      },
    }));
  })();

  /* 19. Carnaval do Arlequim — coringa xNudge que anda */
  (() => {
    const SY = lsyms([['mascara', 'performing', 'Máscara'], ['leque', 'fan', 'Leque'], ['gondola', 'canoe', 'Gôndola'], ['pluma', 'feather', 'Pluma']]);
    const HARL = { id: 'w', img: 'jester', name: 'Arlequim', wild: true, reels: [1, 2, 3, 4], w: 0.32, fw: 0.45 };
    const SC = { id: 'sc', img: 'confettiball', name: 'Bônus', sc: true, w: 1.2, fw: 0 };
    const draw = pool([...SY, HARL, SC]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      // o arlequim empurra para cobrir o rolo e depois anda para a esquerda a cada respin
      let walkers = [];
      for (let c = 1; c <= 4; c++) if (g[c].some(x => x.wild)) { const m = nudgeReel(g, c, HARL, st ? st.m : 0); walkers.push({ c, m }); if (st) st.m++; }
      await rt.drop(g);
      await pay(rt, lines(g, L20, SY, { mult: 'add' }));
      for (let guard = 0; guard < 6 && walkers.length && !rt.capped; guard++) {
        walkers = walkers.map(w => ({ c: w.c - 1, m: w.m + 1 })).filter(w => w.c >= 0);
        if (!walkers.length) break;
        const ng = make(st ? 'fw' : 'w'); walkers.forEach(w => { ng[w.c] = ng[w.c].map(() => mult({ ...HARL, c: 'duel' }, w.m)); });
        g.splice(0, 5, ...ng);
        rt.msg(`🃏 O Arlequim deu um passo: x${walkers.map(w => w.m).join(' / x')}`);
        await rt.spin(g, { tease: false });
        await pay(rt, lines(g, L20, SY, { mult: 'add' }));
        if (st) { st.m++; rt.chip('mult', 'MULT.', '+' + st.m); }
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'arlequim', name: 'Carnaval do Arlequim', studio: STUDIO, art: 'jester', mascot: 'performing',
      tag: 'xNudge que anda · 5.861x', colors: ['#be123c', '#ca8a04'], bg: 'linear-gradient(180deg,#4c0519,#881337 50%,#1c1917)',
      cols: 5, rows: 3, maxWin: 5861, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Harlequin Carnival" (Nolimit City).', hello: 'O Arlequim dança pelos rolos!',
      symbols: [...SY, HARL, SC],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Multiplicadores na mesma linha se somam.')],
      highlights: ['🃏 O <b>Arlequim</b> cai empilhado, faz <b>xNudge</b> até cobrir o rolo (+1 por empurrão)', 'Depois ele <b>anda para a esquerda</b>, dando <b>respin</b> a cada passo e ganhando <b>+1</b>', '🎊 3+ bônus = <b>8 rodadas grátis</b> com multiplicador base que sobe a cada passo e empurrão', 'Prêmio máximo: <b>5.861x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. O Arlequim é um coringa alto (rolos 2 a 5) que se empurra até ficar inteiro e depois caminha um rolo para a esquerda por respin, até sair da grade.</p>',
      features: '<p>🎊 <b>3 ou mais bônus</b> dão <b>8 rodadas grátis</b>. Cada passo do Arlequim soma +1 num multiplicador base que fica guardado e é somado a todo Arlequim novo.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { m: 2 }; await rt.fsLoop(8, async api => { if (await play(rt, make('fw'), st) >= 3) api.add(4); }, { sub: 'Multiplicador base cresce' }); rt.chip('mult', null); },
    }));
  })();

  /* 20. Coelhos Bônus — explosões de coringa e cenouras */
  (() => {
    const SY = [S('coelho', 'rabbitface', 'Coelho', [0.6, 2, 8], 3), S('fazendeiro', 'farmer', 'Fazendeiro', [0.5, 1.5, 6], 4), S('rabanete', 'radish', 'Rabanete', [0.4, 1.2, 4], 4), S('alface', 'leafygreen', 'Alface', [0.3, 1, 3], 5), ...R([[0.1, 0.3, 1], [0.1, 0.3, 1], [0.08, 0.25, 0.8], [0.08, 0.25, 0.8]])];
    const WILD = { id: 'w', img: 'bomb', name: 'Coringa explosivo', wild: true, w: 0.55 };
    const BON = { id: 'bon', img: 'carrot', name: 'Cenoura bônus', bon: true, noPay: true, w: 5.5 };
    const draw = pool([...SY, WILD, BON]);
    const make = () => grid([4, 4, 4, 4], c => draw(c));
    const CARROT = () => { const v = RNG.weighted([{ v: 1, w: 40 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 5, w: 10 }, { v: 10, w: 6 }, { v: 25, w: 3 }, { v: 100, w: 0.5 }]).v; return { id: 'cenoura', img: 'carrot', name: 'Cenoura', coin: true, v, t: v + 'x' }; };
    App.register(K.create({
      id: 'coelhosbonus', name: 'Coelhos Bônus', studio: STUDIO, art: 'carrot', mascot: 'rabbitface',
      tag: 'Explosões · Carrot Link', colors: ['#ea580c', '#16a34a'], bg: 'linear-gradient(180deg,#d9f99d,#84cc16 50%,#3f6212)',
      cols: 4, rows: 4, maxWin: 6950, vol: 4, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Bonus Bunnies" (Nolimit City).', hello: 'Coelhos explosivos e cenouras de ouro!',
      symbols: [...SY, WILD, BON],
      tables: [table('Pagamento por caminho', heads(3, 2, ' rolos'), SY, '4×4 = 256 caminhos.')],
      highlights: ['🥕 4×4 com 256 caminhos', '💣 Coringa + cenoura juntos: o coringa <b>explode na vertical</b> (coluna inteira); duas cenouras: <b>explode na horizontal</b> também', '6+ cenouras = <b>Carrot Link</b>: respins de cenouras com valores; encher tudo abre o <b>baú (x3 a x5)</b>', 'Prêmio máximo: <b>6.950x</b>'],
      how: '<p>Grade 4×4 com 256 caminhos. Se um coringa cair junto com uma cenoura bônus, ele se espalha pela coluna toda; com duas cenouras, também pela linha.</p>',
      features: '<p>🥕 <b>6 ou mais cenouras</b> abrem o <b>Carrot Link</b>: as cenouras viram valores (1x a 100x), travam e você tem 3 respins que reiniciam a cada cenoura nova. Encher as 16 casas abre o baú do tesouro, que multiplica tudo por x3 a x5.</p>',
      make,
      async spin(rt) {
        const g = make(); await rt.spin(g);
        const nb = count(g, x => x.bon);
        if (nb && g.flat().some(x => x.wild)) {
          cells(g, x => x.wild).forEach(([c, r]) => { g[c] = g[c].map(y => (y.bon ? y : { ...WILD, c: 'gold', fresh: true })); if (nb >= 2) g.forEach(col => { if (!col[r].bon) col[r] = { ...WILD, c: 'gold', fresh: true }; }); });
          rt.msg('💥 Explosão de coringas!'); rt.fx('boom'); await rt.drop(g);
        }
        await pay(rt, ways(g, SY));
        if (nb >= 6) { await rt.wait(800); await this.bonus(rt, { g }); }
      },
      async bonus(rt, { g } = {}) {
        let gg = g;
        if (!gg) { gg = make(); RNG.shuffle(cells(gg, () => true)).slice(0, 6).forEach(([c, r]) => { gg[c][r] = { ...BON }; }); }
        gg.forEach((col, c) => col.forEach((x, r) => { gg[c][r] = x.bon ? CARROT() : x; }));
        const won = await K.holdSpin(rt, gg, { isCoin: x => x.coin, newCoin: CARROT, pCoin: 0.1, title: 'CARROT LINK', sub: '3 respins · cada cenoura reinicia' });
        if (gg.every(col => col.every(x => x.coin))) { const m = RNG.int(3, 5); rt.win(won * (m - 1)); rt.msg(`🗝️ Baú do tesouro: tudo x${m}!`); rt.fx('jackpot'); await rt.wait(900); }
      },
    }));
  })();
})();
