'use strict';

/* =========================================================
   Pragmatic Play — lote 2 (parte 2): grupos, coringas especiais,
   Megaways que crescem e respins. Regras baseadas nos originais;
   RTP calibrado por simulação (tools/calibrate.js).
   ========================================================= */
(function () {
  const K = SlotKit, T = SlotT;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'pragmatic';
  const R = (pays, w) => K.ROYALS(pays, w);
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const RUSHP = [[1, 2, 4, 10, 30, 150], [0.8, 1.5, 3, 7, 20, 100], [0.6, 1.2, 2.5, 5, 15, 60], [0.5, 1, 2, 4, 10, 40], [0.4, 0.8, 1.5, 3, 8, 30], [0.3, 0.6, 1.2, 2.5, 6, 25], [0.25, 0.5, 1, 2, 5, 20]];
  const rushSyms = list => list.map(([id, img, name], i) => S(id, img, name, RUSHP[i], [6, 7, 8, 9, 10, 11, 12][i]));
  const TT = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
  const CLH = ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'];
  const fsTab = o => `<table class="paytable"><tr class="si-head"><td>Scatters</td><td>Rodadas grátis</td></tr>${Object.entries(o).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>`;
  const near = (c, r) => [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
  /** 50 linhas para grades de 6 colunas: desenhos 5×3 estendidos em cada faixa de 3 linhas. */
  const lines6 = (rows, n) => K.linesFor(rows, 200).map(L => [...L, L[4]]).slice(0, n);
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };

  /* 21. Mochimon — posições multiplicadoras até x128 */
  App.register(T.clusterSpots({
    id: 'mochimon', name: 'Mochimon', studio: STUDIO, art: 'dango', mascot: 'dango',
    tag: 'Posições até x128 · 5.000x', colors: ['#f472b6', '#a3e635'], bg: 'linear-gradient(180deg,#fce7f3,#fbcfe8 50%,#bbf7d0)',
    intro: 'Inspirado no "Mochimon" (Pragmatic Play).', maxWin: 5000, cap: 128,
    syms: rushSyms([['dango', 'dango', 'Dango'], ['mooncake', 'mooncake', 'Bolo da lua'], ['sushi', 'sushi', 'Sushi'], ['oden', 'oden', 'Oden'], ['raspadinho', 'shavedice', 'Raspadinha de gelo'], ['bolinho', 'riceball', 'Onigiri'], ['biscoito', 'ricecracker', 'Senbei']]),
    scImg: 'fireworks', scName: 'Fogos', scW: 0.37, fsTable: { 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 },
    highlights: ['🍡 7×7 com grupos e cascata', '✨ Posições vencedoras ficam marcadas e viram multiplicadores que dobram até <b>x128</b>', '3+ fogos = <b>10 a 30 rodadas grátis</b> com as posições guardadas', 'Prêmio máximo: <b>5.000x</b>'],
  }));

  /* 22. Jardim dos Coelhos (Rabbit Garden) — moedas coletadas pelos grupos */
  (() => {
    // nas grátis os símbolos baixos caem mais (grupos maiores)
    const SY = rushSyms([['cenoura', 'carrot', 'Cenoura'], ['rabanete', 'radish', 'Rabanete'], ['repolho', 'leafygreen', 'Repolho'], ['brocolis', 'broccoli', 'Brócolis'], ['ervilha', 'peapod', 'Ervilha'], ['cogumelo', 'mushroom', 'Cogumelo'], ['flor', 'tulip', 'Tulipa']]).map((x, i) => ({ ...x, fw: x.w * (i >= 4 ? 2 : 1) }));
    const SC = { id: 'sc', img: 'rabbitface', name: 'Coelho', sc: true, w: 0.38, fw: 0 };
    const COIN = { id: 'moeda', img: 'coin', name: 'Moeda', coin: true, noPay: true, w: 1, fw: 4.5 };
    const draw = pool([...SY, SC, COIN]);
    const VALS = [{ v: 0.2, w: 40 }, { v: 0.5, w: 30 }, { v: 1, w: 18 }, { v: 2, w: 8 }, { v: 5, w: 3 }, { v: 10, w: 1 }, { v: 25, w: 0.25 }];
    const cell = (c, wk) => { const x = draw(c, wk); if (x.coin) { x.v = RNG.weighted(VALS).v; x.t = K.short(x.v) + 'x'; } return x; };
    const make = wk => grid([7, 7, 7, 7, 7, 7, 7], c => cell(c, wk));
    const LV = [{ at: 0, m: 1 }, { at: 15, m: 2 }, { at: 30, m: 3 }, { at: 45, m: 5 }, { at: 70, m: 10 }];
    async function play(rt, g, st) {
      await rt.drop(g);
      // coelho do jogo base: às vezes derruba um bloco 3×3 de moedas
      if (!st && RNG.float() < 0.012) {
        const c0 = RNG.int(0, 4), r0 = RNG.int(0, 4);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const v = RNG.weighted(VALS).v; g[c0 + a][r0 + b] = { ...COIN, v, t: K.short(v) + 'x', fresh: true }; }
        rt.msg('🐇 O coelho derrubou um monte de moedas!'); rt.fx('boom'); await rt.drop(g);
      }
      const m = () => (st ? LV.filter(l => st.pts >= l.at).pop().m : 1);
      await tumble(rt, g, {
        draw: c => cell(c, st ? 'fw' : 'w'),
        evaluate: gg => {
          const res = payClusters(clusters(gg, 5), TT);
          // moedas encostadas em grupos vencedores são coletadas
          const got = new Set();
          res.cells.forEach(kk => { const [c, r] = unkey(kk); near(c, r).forEach(([a, b]) => { const y = gg[a] && gg[a][b]; if (y && y.coin) got.add(key(a, b)); }); });
          got.forEach(kk => { const [c, r] = unkey(kk); res.total += gg[c][r].v; res.cells.add(kk); });
          if (got.size) res.wins.push({ sym: { name: 'Moedas' }, n: got.size, pay: 0 });
          if (st && res.total) { st.pts += res.cells.size + got.size; rt.chip('pts', 'PONTOS', st.pts); }
          return res;
        },
        mult: () => m(),
      });
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'jardimcoelhos', name: 'Jardim dos Coelhos', studio: STUDIO, art: 'rabbitface', mascot: 'rabbit',
      tag: 'Grupos coletam moedas vizinhas', colors: ['#84cc16', '#f472b6'], bg: 'linear-gradient(180deg,#d9f99d,#86efac 60%,#15803d)',
      cols: 7, rows: 7, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Rabbit Garden" (Pragmatic Play).', hello: 'Grupos vencedores coletam as moedas encostadas!',
      symbols: [...SY, SC, COIN],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🥕 7×7 com grupos e cascata', '🪙 Moedas <b>encostadas num grupo vencedor</b> são coletadas (até 25x cada)', '🐇 O coelho pode derrubar um <b>bloco 3×3 de moedas</b>', '3+ coelhos = <b>5 rodadas grátis</b> com medidor de pontos: <b>x2, x3, x5 e x10</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam e somem (cascata). As <b>moedas</b> encostadas (horizontal/vertical) num grupo vencedor são pagas e também somem.</p>',
      features: '<p>🐇 <b>3 ou mais coelhos</b> dão <b>5 rodadas grátis</b>. Cada símbolo vencedor soma pontos no medidor; com <b>15, 30, 45 e 70</b> pontos o multiplicador vira <b>x2, x3, x5 e x10</b> e você ganha <b>+2 giros</b> em cada nível. O medidor não zera.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { pts: 0, lv: 0 };
        rt.chip('pts', 'PONTOS', 0);
        await rt.fsLoop(5, async api => {
          await play(rt, make('fw'), st);
          const lv = LV.filter(l => st.pts >= l.at).length - 1;
          if (lv > st.lv) { api.add(2 * (lv - st.lv)); st.lv = lv; rt.msg(`🥕 Medidor x${LV[lv].m}!`); rt.fx('rise'); }
        }, { sub: 'Medidor de pontos: x2 · x3 · x5 · x10' });
        rt.chip('pts', null);
      },
    }));
  })();

  /* 23. Abelhas Grudentas (Sticky Bees) — super coringas colantes */
  (() => {
    const SY = rushSyms([['mel', 'honeypot', 'Pote de mel'], ['flor', 'hibiscus', 'Hibisco'], ['girassol', 'sunflower', 'Girassol'], ['joaninha', 'ladybug', 'Joaninha'], ['folha', 'leaf', 'Folha'], ['trevo', 'shamrock', 'Trevo'], ['margarida', 'blossom', 'Flor']]);
    const SC = { id: 'sc', img: 'beehive', name: 'Colmeia', sc: true, w: 0.34, fw: 0.3 };
    const BEE = { id: 'w', img: 'bee', name: 'Abelha coringa', wild: true, w: 0.35, fw: 0 };
    const draw = pool([...SY, SC, BEE]);
    const make = wk => grid([7, 7, 7, 7, 7, 7, 7], c => { const x = draw(c, wk); if (x.wild) mult(x, RNG.pick([1, 2, 2, 3])); return x; });
    async function play(rt, g, st) {
      if (st) {
        // 1 a 3 super abelhas novas por giro; as antigas ficam
        const n = RNG.weighted([{ n: 0, w: 55 }, { n: 1, w: 35 }, { n: 2, w: 8 }, { n: 3, w: 2 }]).n;
        for (let i = 0; i < n; i++) st.bees.set(key(RNG.int(0, 6), RNG.int(0, 6)), 1);
        st.bees.forEach((m, kk) => { const [c, r] = unkey(kk); g[c][r] = mult({ ...BEE, c: 'sticky gold' }, m); });
        if (n) rt.msg(`🐝 +${n} super abelha${n > 1 ? 's' : ''} colante${n > 1 ? 's' : ''}!`);
      }
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c, st ? 'fw' : 'w'),
        evaluate: gg => payClusters(clusters(gg, 5), TT, k => {
          const ws = k.cells.filter(kk => { const [c, r] = unkey(kk); return gg[c][r].wild; });
          // super abelhas que ganham sobem +1 no multiplicador
          if (st) ws.forEach(kk => { if (st.bees.has(kk)) { const v = Math.min(5, st.bees.get(kk) + 1); st.bees.set(kk, v); const [c, r] = unkey(kk); mult(gg[c][r], v); } });
          return ws.reduce((s, kk) => { const [c, r] = unkey(kk); return s + (gg[c][r].m || 1); }, 0) || 1;
        }),
      });
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'abelhasgrudentas', name: 'Abelhas Grudentas', studio: STUDIO, art: 'bee', mascot: 'bee',
      tag: 'Super abelhas colantes', colors: ['#facc15', '#16a34a'], bg: 'linear-gradient(180deg,#fef9c3,#fde047 50%,#65a30d)',
      cols: 7, rows: 7, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Sticky Bees" (Pragmatic Play).', hello: 'Abelhas coringa entram em qualquer grupo!',
      symbols: [...SY, SC, BEE],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🐝 7×7 com grupos; abelhas são <b>coringas com multiplicador</b> que se somam', '3+ colmeias = <b>7 rodadas grátis</b> (+1 por colmeia extra)', 'Nas grátis caem <b>1 a 3 super abelhas por giro</b> que <b>grudam</b> até o fim e sobem +1 a cada ganho (até x5)', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam (cascata). 🐝 Abelhas são coringas com x1 a x3; várias no mesmo grupo <b>se somam</b>.</p>',
      features: '<p>🏠 <b>3 ou mais colmeias</b> dão <b>7 rodadas grátis</b> +1 por colmeia além de 3 (3 durante o bônus dão +3). A cada giro podem cair de 1 a 3 <b>super abelhas</b> que ficam grudadas até o fim; cada ganho com elas soma <b>+1</b> no multiplicador delas (até x5).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const st = { bees: new Map() };
        await rt.fsLoop(7 + Math.max(0, sc - 3), async api => { const s = await play(rt, make('fw'), st); if (s >= 3) api.add(3); }, { sub: 'Super abelhas colantes!' });
      },
    }));
  })();

  /* 24. Ônibus das Celebridades Megaways — respin com scatters colantes */
  (() => {
    const SY = [S('estrela', 'microphone', 'Microfone', [1, 2.5, 6, 15], 3), S('oculos', 'sunglasses', 'Óculos', [0.8, 2, 5, 12], 4), S('camera', 'camera', 'Câmera', [0.6, 1.5, 4, 9], 5), S('bolsa', 'handbag', 'Bolsa', [0.5, 1.2, 3, 7], 5), S('salto', 'highheel', 'Salto', [0.4, 1, 2.5, 5], 6), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const WILD = { id: 'w', img: 'bus', name: 'Ônibus', wild: true, reels: [1, 2, 3, 4], w: 0.55 };
    const SC = { id: 'sc', img: 'glowstar', name: 'Estrela', sc: true, w: 0.78 };
    const draw = pool([...SY, WILD, SC]);
    const heights = () => Array.from({ length: 6 }, () => RNG.int(2, 7));
    const make = (hs = heights()) => K.stack(hs.map((hh, c) => Array.from({ length: hh }, () => draw(c))), 0.3);
    async function play(rt, g, st) {
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => ways(gg, SY), mult: () => (st ? st.m : 1), onStep: async () => { if (st) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); } } });
    }
    App.register(K.create({
      id: 'onibuscelebridades', name: 'Ônibus das Celebridades Megaways', studio: STUDIO, art: 'bus', mascot: 'glowstar',
      tag: 'Respin de estrelas · mult. sem teto', colors: ['#db2777', '#fbbf24'], bg: 'linear-gradient(180deg,#831843,#be185d 50%,#1e1b4b)',
      cols: 6, rows: 7, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Wild Celebrity Bus Megaways" (Pragmatic Play).', hello: '3 estrelas dão respin!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata.')],
      highlights: ['🚌 Megaways (até 117.649 caminhos) com cascata', '⭐ 3 estrelas = <b>respin</b> com as estrelas colantes até parar de cair estrela', '4+ estrelas = <b>10 rodadas grátis</b> (+2 por estrela extra) com multiplicador <b>+1 por cascata sem zerar</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Megaways (2 a 7 símbolos por rolo) com cascata. O ônibus é coringa nos rolos 2 a 5.</p>',
      features: '<p>⭐ Com <b>3 estrelas</b>, elas grudam e os rolos giram de novo; cada estrela nova dá outro respin. Com <b>4 ou mais</b>, você ganha <b>10 rodadas grátis</b> (+2 por estrela além de 4). Nelas o multiplicador sobe <b>+1 a cada cascata</b> e nunca zera.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, null);
        let sc = count(g, x => x.sc);
        // respin com as estrelas colantes
        for (let guard = 0; sc === 3 && guard < 6; guard++) {
          rt.msg('⭐ 3 estrelas! Respin com elas grudadas'); rt.fx('rise'); await rt.wait(600);
          const keep = cells(g, x => x.sc);
          const ng = make(g.map(col => col.length));
          keep.forEach(([c, r]) => { ng[c][r] = { ...SC, c: 'sticky' }; });
          g.splice(0, 6, ...ng);
          await rt.spin(g, { tease: true });
          const nsc = count(g, x => x.sc);
          await play(rt, g, null);
          if (nsc <= sc) break;
          sc = nsc;
        }
        sc = Math.max(sc, count(g, x => x.sc));
        if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 4 } = {}) {
        const st = { m: 1 };
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(10 + 2 * Math.max(0, sc - 4), async api => { const g = make(); await rt.spin(g, { tease: false }); await play(rt, g, st); if (count(g, x => x.sc) >= 3) api.add(4); }, { sub: 'Multiplicador +1 por cascata' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 25. Assalto às Pepitas (Heist for the Golden Nuggets) */
  (() => {
    const L20 = K.LINES_5x3.slice(0, 20);
    const SY = [S('ladrao', 'detective', 'Ladrão', [5, 20, 100], 3), S('carrinho', 'minecart', 'Carrinho', [3, 10, 50], 4), S('picareta', 'pick', 'Picareta', [2, 6, 30], 4), S('lanterna', 'lantern', 'Lanterna', [1.5, 4, 20], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'moneywings', name: 'Coringa coletor', wild: true, reels: [1, 2, 3, 4], w: 0.8, fw: 1.9 };
    const GOLD = { id: 'pepita', img: 'goldnugget', name: 'Pepita', gold2: true, w: 1.6, fw: 3.2 };
    const SC = { id: 'sc', img: 'dynamite', name: 'Dinamite', sc: true, reels: [0, 2, 4], w: 2.1, fw: 0 };
    const draw = pool([...SY, WILD, GOLD, SC]);
    const VALS = [{ v: 0.5, w: 30 }, { v: 1, w: 30 }, { v: 2, w: 18 }, { v: 3, w: 10 }, { v: 5, w: 7 }, { v: 10, w: 3 }, { v: 25, w: 1.2 }, { v: 50, w: 0.4 }, { v: 250, w: 0.04 }];
    const WM = [{ m: 1, w: 60 }, { m: 2, w: 20 }, { m: 3, w: 10 }, { m: 5, w: 6 }, { m: 10, w: 3 }, { m: 16, w: 1 }];
    const cell = (c, wk) => { const x = draw(c, wk); if (x.gold2) { x.v = RNG.weighted(VALS).v; x.t = K.short(x.v) + 'x'; x.noPay = true; } if (x.wild) { const m = RNG.weighted(WM).m; if (m > 1) mult(x, m); } return x; };
    const make = wk => grid([3, 3, 3, 3, 3], c => cell(c, wk));
    async function play(rt, g, st) {
      await pay(rt, lines(g, L20, SY));
      const ws = g.flat().filter(x => x.wild), golds = g.flat().filter(x => x.gold2);
      if (!ws.length || !golds.length) return;
      const v = golds.reduce((s, x) => s + x.v, 0);
      const m = ws.reduce((s, x) => s + (x.m || 1), 0) * (st ? st.mul : 1);
      rt.mark(cells(g, x => x.wild || x.gold2).map(([c, r]) => key(c, r)));
      rt.win(v * m);
      rt.msg(`💰 Coringa coletou ${rt.coins(v)}${m > 1 ? ` × ${m}` : ''} = ${rt.coins(v * m)}`);
      rt.fx('coin');
      await rt.wait(900);
      if (st) st.got += ws.length;
    }
    const LVL = [{ at: 4, m: 2 }, { at: 8, m: 3 }, { at: 12, m: 10 }];
    App.register(K.create({
      id: 'assaltopepitas', name: 'Assalto às Pepitas', studio: STUDIO, art: 'goldnugget', mascot: 'detective',
      tag: 'Coringas coletores até x16', colors: ['#ca8a04', '#44403c'], bg: 'linear-gradient(180deg,#78350f,#44403c 60%,#1c1917)',
      cols: 5, rows: 3, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Heist for the Golden Nuggets" (Pragmatic Play).', hello: 'Coringas coletam as pepitas!',
      symbols: [...SY, WILD, GOLD, SC],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['⛏️ Pepitas valem de <b>0,5x a 250x</b>', '💸 Coringas (x1 a <b>x16</b>) coletam todas as pepitas da tela; vários coringas somam o multiplicador', '🧨 3 dinamites = <b>10 rodadas grátis</b>: a cada 4 coringas coletados, +10 giros e coleta x2, x3 e x10', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Quando há <b>coringa</b> e <b>pepitas</b> na tela, o coringa coleta o valor de todas, vezes o multiplicador dele.</p>',
      features: '<p>🧨 <b>3 dinamites</b> (rolos 1, 3 e 5) dão <b>10 rodadas grátis</b>. Cada coringa que coleta conta; com 4, 8 e 12 coringas você ganha <b>+10 giros</b> e as coletas passam a valer <b>x2, x3 e x10</b>.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await play(rt, g, null); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { mul: 1, got: 0, lv: 0 };
        await rt.fsLoop(10, async api => {
          const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, st);
          while (st.lv < LVL.length && st.got >= LVL[st.lv].at) { st.mul = LVL[st.lv].m; st.lv++; api.add(10); rt.chip('mult', 'COLETA', 'x' + st.mul); rt.msg(`💰 Nível ${st.lv}: coletas x${st.mul} e +10 giros!`); rt.fx('rise'); await rt.wait(700); }
        }, { sub: 'Coringas coletam · níveis x2/x3/x10' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 26. Panda Gordo — rolo modificador */
  (() => {
    const L20 = K.LINES_5x3.slice(0, 20);
    const SY = [S('panda', 'panda', 'Panda', [5, 25, 100], 3), S('bambu', 'bamboo', 'Bambu', [3, 10, 50], 4), S('lanterna', 'izakaya', 'Lanterna', [2, 6, 30], 4), S('bolinho', 'dumpling', 'Bolinho', [1.5, 4, 20], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'pandaface', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.9 };
    const SC = { id: 'sc', img: 'yinyang2', name: 'Bônus', sc: true, w: 1.05 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const MODS = [{ k: null, w: 70 }, { k: 'add', w: 12 }, { k: 'expand', w: 8 }, { k: 'mult', w: 8 }, { k: 'spins', w: 2 }];
    async function play(rt, g, st) {
      if (st) st.sticky.forEach(kk => { const [c, r] = unkey(kk); g[c][r] = { ...WILD, c: 'sticky' }; });
      const mod = RNG.weighted(MODS).k;
      let wm = 1;
      if (mod === 'add') { const n = RNG.int(1, 3); for (let i = 0; i < n; i++) g[RNG.int(1, 4)][RNG.int(0, 2)] = { ...WILD, fresh: true }; rt.msg(`🐼 Modificador: +${n} coringa${n > 1 ? 's' : ''}`); }
      if (mod === 'expand') { const cs = [...new Set(cells(g, x => x.wild).map(([c]) => c))]; if (cs.length) { cs.forEach(c => { g[c] = g[c].map(() => ({ ...WILD, fresh: true })); }); rt.msg('🐼 Modificador: coringas expandem!'); } }
      if (mod === 'mult') { wm = RNG.weighted([{ m: 2, w: 40 }, { m: 3, w: 25 }, { m: 5, w: 18 }, { m: 10, w: 12 }, { m: 20, w: 5 }]).m; rt.msg(`🐼 Modificador: coringas x${wm}`); }
      if (mod === 'spins' && st) { st.api.add(RNG.int(1, 3)); }
      if (wm > 1) g.forEach(col => col.forEach(x => { if (x.wild) mult(x, wm); }));
      rt.head(g.map(() => (mod ? { add: '+🐼', expand: '⇕', mult: 'x' + wm, spins: '+giros' }[mod] : '')));
      await rt.drop(g);
      await pay(rt, lines(g, L20, SY, { mult: 'add' }));
      if (st) cells(g, x => x.wild).forEach(([c, r]) => st.sticky.add(key(c, r)));
      rt.head(null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'pandagordo', name: 'Panda Gordo', studio: STUDIO, art: 'panda', mascot: 'panda',
      tag: 'Rolo modificador · coringas colantes', colors: ['#16a34a', '#111827'], bg: 'linear-gradient(180deg,#bbf7d0,#4ade80 50%,#14532d)',
      cols: 5, rows: 3, maxWin: 20000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Fat Panda" (Pragmatic Play).', hello: 'O rolo de cima traz modificadores!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🐼 Rolo modificador: <b>+coringas</b>, <b>coringas que expandem</b> ou <b>coringas x2 a x20</b>', '☯️ 3/4/5 bônus = <b>10/12/15 rodadas grátis</b> com <b>coringas colantes</b>', 'Prêmio máximo: <b>20.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. A cada giro o rolo de cima pode ativar um modificador: adicionar 1 a 3 coringas, expandir os coringas pelo rolo inteiro ou dar um multiplicador de x2 a x20 a todos os coringas.</p>',
      features: '<p>☯️ <b>3, 4 ou 5 bônus</b> dão <b>10, 12 ou 15 rodadas grátis</b>. Todo coringa que aparecer <b>gruda</b> até o fim, e o rolo modificador também pode dar giros extras.</p>',
      make,
      async spin(rt) { const g = make(); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const st = { sticky: new Set() };
        await rt.fsLoop({ 3: 10, 4: 12 }[sc] || 15, async api => { st.api = api; const g = make(); await rt.spin(g, { tease: false }); await play(rt, g, st); }, { sub: 'Coringas colantes!' });
      },
    }));
  })();

  /* 27. 3 Coringas Zunindo (3 Buzzing Wilds) */
  (() => {
    const L20 = K.linesFor(4, 20);
    const SY = [S('colmeia', 'beehive', 'Colmeia', [5, 20, 100], 3), S('mel', 'honeypot', 'Mel', [3, 10, 50], 4), S('flor', 'cherryblossom', 'Flor', [2, 6, 30], 4), S('girassol', 'sunflower', 'Girassol', [1.5, 4, 20], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'bee', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.8 };
    const SC = { id: 'sc', img: 'beekeeper', name: 'Apicultor', sc: true, reels: [0, 2, 4], w: 1.25, fw: 0.9 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => grid([4, 4, 4, 4, 4], c => draw(c));
    const TYPES = { rand: { n: 'Coringas aleatórios', d: '2 a 6 coringas por giro' }, exp: { n: 'Coringa que expande', d: 'enche o rolo inteiro' }, sur: { n: 'Coringa que cerca', d: 'vira coringa em 3×3' } };
    function apply(g, type, rt) {
      if (type === 'rand') { const n = RNG.int(2, 6); for (let i = 0; i < n; i++) g[RNG.int(1, 4)][RNG.int(0, 3)] = { ...WILD, fresh: true }; return n; }
      const c = RNG.int(1, 3), r = RNG.int(0, 3);
      if (type === 'exp') { g[c] = g[c].map(() => ({ ...WILD, fresh: true })); return 1; }
      for (let a = c - 1; a <= c + 1; a++) for (let b = r - 1; b <= r + 1; b++) if (g[a] && g[a][b]) g[a][b] = { ...WILD, fresh: true };
      return 1;
    }
    App.register(K.create({
      id: 'tresabelhas', name: '3 Coringas Zunindo', studio: STUDIO, art: 'beekeeper', mascot: 'bee',
      tag: '3 tipos de coringa · grátis colantes', colors: ['#f59e0b', '#1f2937'], bg: 'linear-gradient(180deg,#fef3c7,#f59e0b 60%,#78350f)',
      cols: 5, rows: 4, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "3 Buzzing Wilds" (Pragmatic Play).', hello: 'Três tipos de coringa voando!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 4, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🐝 Recursos aleatórios: <b>coringas aleatórios</b>, <b>coringa que expande</b> e <b>coringa que cerca (3×3)</b>', '🧑‍🌾 3 apicultores = <b>10 rodadas grátis</b>: escolha o tipo de coringa, que fica <b>colante</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×4 com 20 linhas. Em qualquer giro uma abelha pode ativar um dos três recursos de coringa.</p>',
      features: '<p>🧑‍🌾 <b>3 apicultores</b> (rolos 1, 3 e 5) dão <b>10 rodadas grátis</b>. Antes, você escolhe o tipo de coringa: ele aparece com mais frequência e todo coringa criado <b>gruda</b> até o fim.</p>',
      make,
      async spin(rt) {
        const g = make();
        if (RNG.float() < 0.07) { const t = RNG.pick(Object.keys(TYPES)); apply(g, t, rt); rt.msg(`🐝 ${TYPES[t].n}!`); }
        await rt.spin(g);
        await pay(rt, lines(g, L20, SY));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const t = await rt.choose('ESCOLHA SUA ABELHA', Object.entries(TYPES).map(([id, x]) => ({ id, img: 'bee', label: x.n, desc: x.d })));
        const sticky = new Set();
        await rt.fsLoop(10, async api => {
          const g = make();
          if (RNG.float() < 0.35) apply(g, t, rt);
          sticky.forEach(kk => { const [c, r] = unkey(kk); g[c][r] = { ...WILD, c: 'sticky' }; });
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => sticky.add(key(c, r)));
          await pay(rt, lines(g, L20, SY));
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: `${TYPES[t].n} · colantes` });
      },
    }));
  })();

  /* 28. Recompensa do Céu (Sky Bounty) — molduras de coringa */
  (() => {
    const L50 = lines6(6, 50);
    const SY = [S('capita', 'pilot', 'Capitã', [2, 5, 20, 60], 3), S('balao', 'balloon', 'Balão', [1.5, 4, 15, 40], 4), S('helice', 'helicopter', 'Hélice', [1, 3, 10, 30], 4), S('bussola', 'compass', 'Bússola', [0.8, 2, 7, 20], 5), ...R([[0.2, 0.6, 2, 5], [0.2, 0.6, 2, 5], [0.15, 0.5, 1.5, 4], [0.15, 0.5, 1.5, 4]])];
    const WILD = { id: 'w', img: 'parachute', name: 'Coringa', wild: true, w: 0.5 };
    const SC = { id: 'sc', img: 'airplane', name: 'Avião', sc: true, w: 0.55, fw: 0.45 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => grid([6, 6, 6, 6, 6, 6], c => draw(c));
    function frame(g, c0, r0, s) {
      let n = 0;
      for (let a = c0; a < c0 + s; a++) for (let b = r0; b < r0 + s; b++) if (g[a] && g[a][b]) { g[a][b] = { ...WILD, c: 'gold', fresh: true }; n++; }
      g.forEach(col => col.forEach(x => { if (x.wild && x.c === 'gold') mult(x, s); }));
      return n;
    }
    App.register(K.create({
      id: 'recompensaceu', name: 'Recompensa do Céu', studio: STUDIO, art: 'airplane', mascot: 'pilot',
      tag: 'Molduras de coringa até 6×6', colors: ['#0ea5e9', '#f97316'], bg: 'linear-gradient(180deg,#e0f2fe,#7dd3fc 50%,#0369a1)',
      cols: 6, rows: 6, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Sky Bounty" (Pragmatic Play).', hello: 'Coringas abrem molduras gigantes!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 6, rows: 6, list: L50, text: '50 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 4), SY, '50 linhas, da esquerda para a direita.')],
      highlights: ['🪂 Um coringa pode abrir uma <b>moldura de coringas de 2×2 até 6×6</b>', 'Os coringas da moldura valem <b>x2 a x6</b> (o lado dela); na linha eles se somam', '✈️ 3+ aviões = <b>6 rodadas grátis</b> com uma moldura 2×2 que <b>anda e cresce</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 6×6 com 50 linhas. Quando cai um coringa, ele pode abrir uma <b>moldura quadrada</b> de coringas (2×2 a 6×6) com multiplicador igual ao lado da moldura.</p>',
      features: '<p>✈️ <b>3 ou mais aviões</b> dão <b>6 rodadas grátis</b> (+2 por avião extra). Uma moldura 2×2 de coringas aparece e <b>muda de lugar a cada giro</b>; cada avião que cair aumenta o lado dela em 1 (até 6×6) e dá +1 giro.</p>',
      make,
      async spin(rt) {
        const g = make();
        const w = cells(g, x => x.wild);
        if (w.length && RNG.float() < 0.25) { const s = RNG.weighted([{ s: 2, w: 60 }, { s: 3, w: 28 }, { s: 4, w: 9 }, { s: 5, w: 1.2 }, { s: 6, w: 0.15 }]).s; const [c, r] = w[0]; frame(g, Math.min(c, 6 - s), Math.min(r, 6 - s), s); rt.msg(`🪂 Moldura ${s}×${s} de coringas x${s}!`); }
        await rt.spin(g);
        await pay(rt, lines(g, L50, SY, { mult: 'add' }));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let s = 2;
        await rt.fsLoop(6 + 2 * Math.max(0, sc - 3), async api => {
          const g = make();
          const n = count(g, x => x.sc);
          if (n) { s = Math.min(6, s + n); api.add(n, true); rt.msg(`✈️ Moldura cresceu para ${s}×${s}! +${n} giro${n > 1 ? 's' : ''}`); }
          frame(g, RNG.int(0, 6 - s), RNG.int(0, 6 - s), s);
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L50, SY, { mult: 'add' }));
        }, { sub: 'Moldura de coringas que anda e cresce' });
      },
    }));
  })();

  /* 29. Reis do Bar (Pub Kings) — reis coletados viram coringa */
  (() => {
    const L20 = K.linesFor(4, 20);
    const KINGS = [S('rei1', 'beardman', 'Rei barbudo', [3, 10, 50], 3), S('rei2', 'princeman', 'Rei jovem', [2.5, 8, 40], 3), S('rei3', 'oldman', 'Rei ancião', [2, 6, 30], 4), S('rei4', 'redhair', 'Rei ruivo', [1.5, 5, 25], 4)];
    const SY = [...KINGS, S('caneca', 'beers', 'Canecas', [1, 3, 10], 5), ...R([[0.4, 1.2, 4], [0.4, 1.2, 4], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'castlejp', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.8 };
    const SC = { id: 'sc', img: 'beer', name: 'Barril', sc: true, reels: [0, 2, 4], w: 1.5, fw: 0.9 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => grid([4, 4, 4, 4, 4], c => draw(c));
    App.register(K.create({
      id: 'reisbar', name: 'Reis do Bar', studio: STUDIO, art: 'beers', mascot: 'beardman',
      tag: 'Colete reis para virar coringa', colors: ['#b45309', '#1e3a8a'], bg: 'linear-gradient(180deg,#78350f,#451a03 60%,#1c1917)',
      cols: 5, rows: 4, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Pub Kings" (Pragmatic Play).', hello: '3 barris abrem a rodada da taverna!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 4, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🍺 5×4 com 20 linhas', '🛢️ 3 barris (rolos 1, 3 e 5) = <b>10 rodadas grátis</b>', 'Nas grátis cada <b>rei</b> que aparece é coletado; com 5 de um rei, <b>ele vira coringa</b> até o fim e dá +3 giros', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×4 com 20 linhas. O castelo é coringa nos rolos 2 a 5.</p>',
      features: '<p>🛢️ <b>3 barris</b> dão <b>10 rodadas grátis</b>. Cada rei que cair entra no medidor dele; ao juntar <b>5</b>, aquele rei passa a ser <b>coringa</b> pelo resto do bônus e você ganha <b>+3 giros</b>.</p>',
      make,
      async spin(rt) { const g = make(); await rt.spin(g); await pay(rt, lines(g, L20, SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const got = {}, wild = new Set();
        await rt.fsLoop(10, async api => {
          const g = make();
          await rt.spin(g, { tease: false });
          g.forEach((col, c) => col.forEach((x, r) => { if (wild.has(x.id)) g[c][r] = { ...x, wild: true, c: 'gold' }; }));
          await pay(rt, lines(g, L20, SY.filter(s => !wild.has(s.id))));
          for (const k of KINGS) {
            if (wild.has(k.id)) continue;
            got[k.id] = (got[k.id] || 0) + count(g, x => x.id === k.id);
            if (got[k.id] >= 5) { wild.add(k.id); api.add(3); rt.msg(`👑 ${k.name} virou coringa! +3 giros`); rt.fx('rise'); await rt.wait(700); }
          }
          rt.chip('reis', 'REIS', KINGS.map(k => (wild.has(k.id) ? '★' : Math.min(5, got[k.id] || 0))).join(' '));
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: '5 de um rei = rei coringa' });
        rt.chip('reis', null);
      },
    }));
  })();

  /* 30. Trilha do Mustang — coringas que se duplicam */
  (() => {
    const L10 = K.LINES_5x3.slice(0, 10);
    const SY = [S('mustang', 'horse', 'Mustang', [5, 25, 100], 3), S('cowgirl', 'cowboy', 'Vaqueira', [3, 12, 60], 4), S('sela', 'saddle', 'Sela', [2, 8, 40], 4), S('ferradura', 'horseshoe', 'Ferradura', [1.5, 5, 25], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'horseface', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.85, fw: 2.4 };
    const SC = { id: 'sc', img: 'sunset', name: 'Pôr do sol', sc: true, w: 0.95 };
    const draw = pool([...SY, WILD, SC]);
    const make = (wk = 'w') => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    const dup = (g, rt) => {
      const ws = cells(g, x => x.wild && !x.dup);
      ws.forEach(([c, r]) => { if (RNG.float() < 0.5) { const a = RNG.int(1, 4), b = RNG.int(0, 2); if (!g[a][b].sc) g[a][b] = { ...WILD, dup: true, fresh: true }; } });
      if (count(g, x => x.dup)) rt.msg('🐎 O coringa se duplicou!');
    };
    App.register(K.create({
      id: 'trilhamustang', name: 'Trilha do Mustang', studio: STUDIO, art: 'horse', mascot: 'horseface',
      tag: 'Coringas que se duplicam', colors: ['#c2410c', '#fbbf24'], bg: 'linear-gradient(180deg,#fdba74,#c2410c 60%,#431407)',
      cols: 5, rows: 3, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Mustang Trail" (Pragmatic Play).', hello: 'Cada coringa pode se duplicar!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L10, text: '10 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🐎 Todo coringa pode <b>se duplicar</b> para outra posição', '🌅 3+ pores do sol = <b>5 rodadas grátis</b>; cada 3 novos dão +5 e um <b>coringa colante</b>', 'Nas grátis os coringas também <b>grudam</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×3 com 10 linhas. Cada coringa que cai tem chance de <b>se copiar</b> para outra posição dos rolos 2 a 5.</p>',
      features: '<p>🌅 <b>3 ou mais pores do sol</b> dão <b>5 rodadas grátis</b>. Os coringas (e suas cópias) <b>grudam</b> até o fim; cada nova trinca de pores do sol dá <b>+5 giros</b> e mais um coringa colante.</p>',
      make,
      async spin(rt) { const g = make(); dup(g, rt); await rt.spin(g); await pay(rt, lines(g, L10, SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const sticky = new Set();
        await rt.fsLoop(5, async api => {
          const g = make('fw');
          dup(g, rt);
          sticky.forEach(kk => { const [c, r] = unkey(kk); g[c][r] = { ...WILD, c: 'sticky' }; });
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => sticky.add(key(c, r)));
          await pay(rt, lines(g, L10, SY));
          if (count(g, x => x.sc) >= 3) { api.add(5); sticky.add(key(RNG.int(1, 4), RNG.int(0, 2))); }
        }, { sub: 'Coringas colantes que se duplicam' });
      },
    }));
  })();

  /* 31. Bonança da Gravidade — buraco negro */
  (() => {
    const SY = rushSyms([['planeta', 'ringedplanet', 'Planeta'], ['cometa', 'comet', 'Cometa'], ['lua', 'fullmoon', 'Lua'], ['terra', 'globe', 'Terra'], ['estrela', 'star2', 'Estrela'], ['satelite', 'satellite', 'Satélite'], ['meteoro', 'rock', 'Meteoro']]);
    const SC = { id: 'sc', img: 'rocket', name: 'Foguete', sc: true, w: 0.44, fw: 0.3 };
    const HOLE = { id: 'hole', img: 'blackhole', name: 'Buraco negro', hole: true, noPay: true, w: 0.25, fw: 0.6 };
    const draw = pool([...SY, SC, HOLE]);
    const HM = [{ m: 2, w: 50 }, { m: 3, w: 28 }, { m: 5, w: 15 }, { m: 10, w: 7 }];
    const cell = (c, wk) => { const x = draw(c, wk); if (x.hole) mult(x, RNG.weighted(HM).m); return x; };
    const make = wk => grid([7, 7, 7, 7, 7, 7, 7], c => cell(c, wk));
    async function play(rt, g, st) {
      await rt.drop(g);
      await tumble(rt, g, { draw: c => cell(c, st ? 'fw' : 'w'), evaluate: gg => payClusters(clusters(gg, 5), TT) });
      const holes = cells(g, x => x.hole);
      if (holes.length) {
        // cada buraco negro suga todos os símbolos de um tipo e paga como um grupo
        let m = holes.reduce((s, [c, r]) => s + g[c][r].m, 0);
        if (st) { st.m += m; m = st.m; rt.chip('mult', 'BURACO', 'x' + m); }
        const s = RNG.pick(SY), ks = cells(g, x => x.id === s.id).map(([c, r]) => key(c, r));
        const t = TT(Math.max(5, ks.length));
        rt.mark([...ks, ...holes.map(([c, r]) => key(c, r))]);
        const v = s.pays[t] * m;
        rt.win(v);
        rt.msg(`🕳️ Buraco negro sugou ${ks.length}× ${s.name} · x${m} = ${rt.coins(v)}`);
        rt.fx('big');
        await rt.wait(1000);
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'gravidade', name: 'Bonança da Gravidade', studio: STUDIO, art: 'blackhole', mascot: 'rocket',
      tag: 'Buraco negro suga e multiplica', colors: ['#6d28d9', '#0ea5e9'], bg: 'radial-gradient(circle at 50% 30%,#4c1d95,#020617 70%)',
      cols: 7, rows: 7, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Gravity Bonanza" (Pragmatic Play).', hello: 'O buraco negro coleta um símbolo inteiro!',
      symbols: [...SY, SC, HOLE],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🪐 7×7 com grupos e cascata', '🕳️ No fim das cascatas, o <b>buraco negro</b> suga todos os símbolos de um tipo e paga como grupo × <b>x2 a x10</b>', '🚀 3/4/5/6/7 foguetes = <b>10/15/20/30/50 rodadas grátis</b> com multiplicador do buraco que <b>acumula</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam (cascata). Se houver <b>buraco negro</b> na tela no fim, ele suga todos os símbolos de um tipo aleatório e paga esse grupo (mínimo de 5) vezes o multiplicador dele.</p>',
      features: `<p>🚀 Nas rodadas grátis o multiplicador dos buracos negros <b>se soma</b> e fica até o fim.</p>${fsTab({ 3: 10, 4: 15, 5: 20, 6: 30, 7: 50 })}`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const n = k => ({ 3: 10, 4: 15, 5: 20, 6: 30 }[k] || 50);
        const st = { m: 0 };
        await rt.fsLoop(n(sc), async api => { const s = await play(rt, make('fw'), st); if (s >= 3) api.add(5); }, { sub: 'Multiplicador do buraco acumula' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 32. Princesa do Crepúsculo — coringas multiplicadores colantes */
  App.register(T.clusterWild({
    id: 'princesacrepusculo', name: 'Princesa do Crepúsculo', studio: STUDIO, art: 'vampire', mascot: 'crescentmoon',
    tag: 'Coringas x2 a x10 colantes · 7.500x', colors: ['#7c3aed', '#be123c'], bg: 'radial-gradient(circle at 50% 0%,#581c87,#0f0518 70%)',
    intro: 'Inspirado no "Twilight Princess" (Pragmatic Play).', maxWin: 7500, scMin: 3, n: 7,
    syms: rushSyms([['rosa', 'rose', 'Rosa'], ['calice', 'wine', 'Taça'], ['vela', 'candle', 'Vela'], ['anel', 'ring', 'Anel'], ['cristal', 'crystal', 'Cristal'], ['morcego', 'bat', 'Morcego'], ['lua', 'moonview', 'Lua']]),
    scImg: 'castle', scName: 'Castelo', scW: 0.42, wildImg: 'vampire', native: { w: 0.3, fw: 0.6, mults: [{ m: 2, w: 50 }, { m: 3, w: 28 }, { m: 5, w: 15 }, { m: 10, w: 7 }] }, stickyFS: true,
    fsTable: { 3: 10, 4: 10, 5: 10, 6: 10, 7: 10 }, retrig: { 2: 5, 3: 10, 4: 20, 5: 30 },
    highlights: ['🦇 7×7 com grupos e cascata', '🧛 Coringas com <b>x2, x3, x5 ou x10</b>; vários no mesmo grupo se somam', '🏰 3+ castelos = <b>10 rodadas grátis</b>: coringas <b>colantes</b> durante cada sequência de cascatas', '2/3/4/5 castelos nas grátis = <b>+5/+10/+20/+30</b>', 'Prêmio máximo: <b>7.500x</b>'],
    features: '<p>🧛 Coringas já caem com multiplicador (x2 a x10). Nas rodadas grátis eles caem mais e <b>ficam no lugar</b> durante toda a sequência de cascatas daquele giro. Castelos durante o bônus: 2 = +5, 3 = +10, 4 = +20, 5 = +30 giros.</p>',
  }));

  /* 33. Coringa Infectante (Infective Wild) */
  (() => {
    const L40 = K.linesFor(4, 40);
    const SY = [S('gato', 'blackcat', 'Gato', [5, 20, 100], 3), S('corvo', 'crow', 'Corvo', [3, 12, 60], 4), S('caldeirao', 'potion', 'Poção', [2, 6, 30], 4), S('vassoura', 'broom', 'Vassoura', [1.5, 4, 20], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'microbe', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.6 };
    const INF = { id: 'inf', img: 'biohazard', name: 'Coringa infectante', wild: true, inf: true, reels: [1, 2, 3, 4], w: 0.3, fw: 0.5 };
    const SC = { id: 'sc', img: 'crystalball', name: 'Bola de cristal', sc: true, reels: [0, 2, 4], w: 1.15, fw: 0 };
    const draw = pool([...SY, WILD, INF, SC]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const infect = (g, rt) => {
      let n = 0;
      cells(g, x => x.inf).forEach(([c, r]) => near(c, r).forEach(([a, b]) => { const y = g[a] && g[a][b]; if (y && !y.wild && !y.sc && a > 0) { g[a][b] = { ...WILD, c: 'gold', fresh: true }; n++; } }));
      if (n) rt.msg(`☣️ Infecção! +${n} coringas`);
      return n;
    };
    App.register(K.create({
      id: 'coringainfectante', name: 'Coringa Infectante', studio: STUDIO, art: 'biohazard', mascot: 'blackcat',
      tag: 'Infecção vira coringas · 40 linhas', colors: ['#65a30d', '#4c1d95'], bg: 'radial-gradient(circle at 50% 30%,#3f6212,#1a0b2e 70%)',
      cols: 5, rows: 4, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Infective Wild" (Pragmatic Play).', hello: 'O coringa infectante contamina os vizinhos!',
      symbols: [...SY, WILD, INF, SC],
      lineList: { cols: 5, rows: 4, list: L40, text: '40 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['☣️ O <b>coringa infectante</b> transforma as casas vizinhas em coringas', '🔮 3 bolas de cristal = <b>minislot</b> sorteia de <b>8 a 24 rodadas grátis</b>', 'Nas grátis todo coringa <b>gruda</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×4 com 40 linhas. Quando o <b>coringa infectante</b> cai, as casas encostadas nele (horizontal/vertical, rolos 2 a 5) também viram coringa.</p>',
      features: '<p>🔮 <b>3 bolas de cristal</b> (rolos 1, 3 e 5) giram um <b>minislot</b> que dá de <b>8 a 24 rodadas grátis</b>. Nelas os infectantes aparecem mais e todo coringa <b>fica colado</b> até o fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); infect(g, rt); await rt.spin(g); await pay(rt, lines(g, L40, SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const opts = [8, 10, 12, 16, 20, 24], idx = opts.indexOf(RNG.weighted([{ v: 8, w: 35 }, { v: 10, w: 25 }, { v: 12, w: 18 }, { v: 16, w: 12 }, { v: 20, w: 7 }, { v: 24, w: 3 }]).v);
        await rt.reveal('MINISLOT', opts.map(v => ({ img: 'crystalball', label: v + ' giros' })), idx);
        const sticky = new Set();
        await rt.fsLoop(opts[idx], async () => {
          const g = make('fw');
          infect(g, rt);
          sticky.forEach(kk => { const [c, r] = unkey(kk); g[c][r] = { ...WILD, c: 'sticky' }; });
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => sticky.add(key(c, r)));
          await pay(rt, lines(g, L40, SY));
        }, { sub: `${opts[idx]} giros · coringas colantes` });
      },
    }));
  })();

  /* 34. Pilhas de Madeira (Timber Stacks) — rolos crescem até 10 linhas */
  (() => {
    const SY = [S('lenhador', 'lumberjack', 'Lenhador', [0.5, 1.5, 5], 3), S('machado', 'axe', 'Machado', [0.4, 1.2, 4], 4), S('tronco', 'wood', 'Tronco', [0.3, 1, 3], 4), S('pinha', 'pinecone', 'Pinha', [0.25, 0.8, 2.5], 5), ...R([[0.1, 0.25, 0.8], [0.1, 0.25, 0.8], [0.08, 0.2, 0.6], [0.08, 0.2, 0.6]])];
    const WILD = { id: 'w', img: 'beaver', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.6 };
    const SC = { id: 'sc', img: 'evergreen', name: 'Pinheiro', sc: true, w: 0.05, fw: 0.04 };
    const draw = pool([...SY, WILD, SC]);
    const make = rows => K.stack(grid([rows, rows, rows, rows, rows], c => draw(c)), 0.25);
    async function play(rt, g, st) {
      let rows = g[0].length;
      await tumble(rt, g, {
        draw: c => draw(c),
        evaluate: gg => ways(gg, SY),
        onStep: async gg => {
          if (rows >= 10) return;
          rows++;
          g.forEach((col, c) => col.unshift({ ...draw(c), fresh: true }));
          rt.layout(rows);
          rt.msg(`🪵 A pilha cresceu: ${rows} linhas (${Math.pow(rows, 5).toLocaleString('pt-BR')} caminhos)`);
        },
      });
      if (st) st.rows = Math.max(st.rows, rows);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'pilhasmadeira', name: 'Pilhas de Madeira', studio: STUDIO, art: 'wood', mascot: 'lumberjack',
      tag: 'Até 100.000 caminhos', colors: ['#92400e', '#15803d'], bg: 'linear-gradient(180deg,#bbf7d0,#166534 50%,#422006)',
      cols: 5, rows: 10, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Timber Stacks" (Pragmatic Play).', hello: 'Cada cascata faz a pilha crescer!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'De 1.024 até 100.000 caminhos.')],
      highlights: ['🪵 Começa em 5×4 (1.024 caminhos) e <b>cada cascata adiciona uma linha</b> até 10 (100.000 caminhos)', '🌲 3/4/5 pinheiros = <b>8/10/12 rodadas grátis</b> em que a altura <b>não volta</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>5 rolos que começam com 4 linhas. Ganhos são pagos por caminho e os símbolos vencedores caem (cascata); <b>a cada cascata os rolos ganham uma linha</b>, até 10 linhas (100.000 caminhos). No próximo giro volta a 4.</p>',
      features: '<p>🌲 <b>3, 4 ou 5 pinheiros</b> dão <b>8, 10 ou 12 rodadas grátis</b>. Durante o bônus a altura alcançada <b>fica guardada</b> para os próximos giros (3+ pinheiros dão +4).</p>',
      make: () => make(4),
      async spin(rt) { rt.layout(4); const g = make(4); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } rt.layout(4); },
      async bonus(rt, { sc = 3 } = {}) {
        const st = { rows: 4 };
        await rt.fsLoop({ 3: 8, 4: 10 }[sc] || 12, async api => { rt.layout(st.rows); const g = make(st.rows); await rt.spin(g, { tease: false }); if (await play(rt, g, st) >= 3) api.add(4); }, { sub: 'A altura fica guardada' });
        rt.layout(4);
      },
    }));
  })();

  /* 35. Açúcar Supremo Powernudge — 6×6 em grupos com Powernudge e posições multiplicadoras */
  (() => {
    const N = 6, CAP = 100;
    const SY = rushSyms([['bala', 'candy', 'Bala'], ['pirulito', 'lollipop', 'Pirulito'], ['donut', 'doughnut', 'Rosquinha'], ['cupcake', 'cupcake', 'Cupcake'], ['chiclete', 'gumball', 'Chiclete'], ['jujuba', 'jelly', 'Jujuba'], ['biscoito', 'cookie', 'Biscoito']]).map((x, i) => (i >= 4 ? { ...x, fw: x.w * 1.35 } : x));
    const SC = { id: 'sc', img: 'birthday', name: 'Bolo', sc: true, w: 0.5, fw: 0 };
    const FS = { 3: 10, 4: 12, 5: 15, 6: 20 };
    const draw = pool([...SY, SC]);
    const make = wk => grid(Array(N).fill(N), c => draw(c, wk));
    const fresh = () => Array.from({ length: N }, () => new Array(N).fill(0));
    /** mostra os biscoitos multiplicadores (x1, x2...) nas posições marcadas */
    const deco = (g, sp) => g.forEach((col, c) => col.forEach((x, r) => {
      if (x.sc) return;
      const v = sp[c][r];
      x.c = v >= 2 ? 'mult' : v === 1 ? 'mark' : '';
      x.t = v ? 'x' + v : undefined;
    }));
    /**
     * Uma sequência: paga os grupos (cada grupo × soma dos multiplicadores sob ele), marca/soma +1
     * nas posições vencedoras e, se o Powernudge entrar, empurra para baixo cada rolo com símbolo
     * vencedor (um símbolo novo entra no topo). Repete enquanto houver ganho.
     */
    async function play(rt, g, wk, sp, always) {
      let nudging = false;
      for (let step = 0; step < 40; step++) {
        const cl = clusters(g, 5);
        const res = payClusters(cl, TT, k => k.cells.reduce((sum, kk) => { const [c, r] = unkey(kk); return sum + sp[c][r]; }, 0) || 1);
        if (!res.total) break;
        await pay(rt, res);
        res.cells.forEach(kk => { const [c, r] = unkey(kk); sp[c][r] = Math.min(CAP, sp[c][r] + 1); });
        deco(g, sp);
        if (!nudging) { if (!always && RNG.float() >= 0.4) break; nudging = true; rt.msg('🍭 Powernudge!'); rt.fx('rise'); }
        const cols = [...new Set([...res.cells].map(kk => unkey(kk)[0]))];
        cols.forEach(c => { g[c] = [{ ...draw(c, wk), fresh: true }, ...g[c].slice(0, N - 1)]; });
        deco(g, sp);
        await rt.drop(g);
      }
    }
    App.register(K.create({
      id: 'acucarsupremo', name: 'Açúcar Supremo Powernudge', studio: STUDIO, art: 'candy', mascot: 'lollipop',
      tag: '6×6 · Powernudge · biscoitos multiplicadores', colors: ['#d946ef', '#38bdf8'], bg: 'linear-gradient(180deg,#f5d0fe,#e879f9 50%,#7e22ce)',
      cols: N, rows: N, maxWin: 5000, vol: 4, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Sugar Supreme Powernudge" (Pragmatic Play).', hello: 'Grupos de 5+ doces iguais pagam!',
      symbols: [...SY, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados (na horizontal ou vertical).')],
      highlights: ['🍬 6×6 em grupos: <b>5 ou mais</b> doces iguais encostados pagam', '🍭 <b>Powernudge:</b> depois de um ganho, todo rolo com símbolo vencedor <b>desce uma casa</b> e entra um doce novo no topo, enquanto houver ganho', '🍪 Cada posição vencedora deixa um <b>biscoito multiplicador</b> que começa em x1 e ganha <b>+1</b> a cada novo ganho nela; os multiplicadores sob um grupo <b>se somam</b>', '🎂 3/4/5/6 bolos = <b>10/12/15/20 rodadas grátis</b>: Powernudge em <b>todo</b> ganho e biscoitos que <b>ficam até o fim</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade <b>6×6</b> que paga por grupos de 5 ou mais símbolos iguais encostados. Depois de um giro com ganho, o <b>Powernudge</b> pode entrar: os rolos que têm símbolo vencedor descem uma posição (um símbolo novo aparece no topo) e o jogo avalia de novo; isso se repete enquanto sair ganho.</p><p>🍪 Toda posição que participa de um ganho ganha um biscoito <b>x1</b>; cada novo ganho na mesma posição soma <b>+1</b> (até x100). Um grupo é multiplicado pela <b>soma</b> dos biscoitos sob ele. No jogo base os biscoitos somem no fim do giro.</p>',
      features: `<p>🎂 <b>3, 4, 5 ou 6 bolos</b> dão <b>10, 12, 15 ou 20 rodadas grátis</b>. Nelas o Powernudge entra em <b>todo</b> giro com ganho e os biscoitos multiplicadores <b>ficam na grade até o fim</b> do bônus.</p>${fsTab(FS)}`,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        await rt.spin(g);
        const sc = count(g, x => x.sc);
        await play(rt, g, 'w', fresh(), false);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const sp = fresh();
        await rt.fsLoop(FS[Math.min(6, Math.max(3, sc))], async () => {
          const g = make('fw');
          deco(g, sp);
          await rt.spin(g, { tease: false });
          await play(rt, g, 'fw', sp, true);
        }, { sub: 'Powernudge sempre · biscoitos ficam' });
      },
    }));
  })();

  /* 36. Estouro de Fogo (Fire Stampede) — conecte e colete */
  (() => {
    const SY = [S('bufalo', 'bison', 'Búfalo', [1, 3, 8], 3), S('aguia', 'eagle', 'Águia', [0.8, 2, 6], 4), S('lobo', 'wolf', 'Lobo', [0.6, 1.5, 5], 4), S('urso', 'bear', 'Urso', [0.5, 1.2, 4], 5), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'fire', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.6 };
    const COIN = { id: 'moeda', img: 'flamecoin', name: 'Moeda de fogo', coin: true, noPay: true, w: 3 };
    const draw = pool([...SY, WILD, COIN]);
    const VALS = [{ v: 0.5, w: 30 }, { v: 1, w: 30 }, { v: 2, w: 18 }, { v: 3, w: 10 }, { v: 5, w: 6 }, { v: 10, w: 3 }, { v: 25, w: 0.8, j: 'MINI' }, { v: 200, w: 0.08, j: 'MAJOR' }];
    const newCoin = () => { const p = RNG.weighted(VALS); return { ...COIN, v: p.v, t: p.j || K.short(p.v) + 'x', c: p.j ? 'coin-ouro' : '' }; };
    const cell = c => { const x = draw(c); return x.coin ? newCoin() : x; };
    const make = () => grid([5, 5, 5, 5, 5], c => cell(c));
    const L50 = K.linesFor(5, 50);
    App.register(K.create({
      id: 'estourofogo', name: 'Estouro de Fogo', studio: STUDIO, art: 'flamecoin', mascot: 'bison',
      tag: 'Respin com jackpots até 4.000x', colors: ['#ea580c', '#7c2d12'], bg: 'linear-gradient(180deg,#fdba74,#ea580c 50%,#431407)',
      cols: 5, rows: 5, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Fire Stampede" (Pragmatic Play).', hello: '6 moedas de fogo abrem o respin!',
      symbols: [...SY, WILD, COIN],
      lineList: { cols: 5, rows: 5, list: L50, text: '50 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, '50 linhas, da esquerda para a direita.'), { title: 'Jackpots', head: ['valor'], rows: [{ img: 'flamecoin', name: 'MINI', pays: [25] }, { img: 'flamecoin', name: 'MAJOR', pays: [200] }, { img: 'flamecoin', name: 'GRAND (tela cheia)', pays: [4000] }] }],
      highlights: ['🔥 5×5 com 50 linhas', '🪙 6+ moedas de fogo = <b>respin</b>: moedas travam e cada nova reinicia os 3 giros', 'Jackpots <b>MINI 25x</b>, <b>MAJOR 200x</b> e <b>GRAND 4.000x</b> (tela cheia)', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×5 com 50 linhas. O fogo é coringa nos rolos 2 a 5.</p>',
      features: '<p>🪙 <b>6 ou mais moedas</b> abrem o <b>respin</b>: só moedas caem, as que caírem travam e o contador volta a 3. Moedas valem de 0,5x a 10x, ou um jackpot MINI (25x) ou MAJOR (200x). Encher as 25 casas dá o <b>GRAND de 4.000x</b>.</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, lines(g, L50, SY, { mult: 'add' }));
        if (count(g, x => x.coin) >= 6) { rt.mark(cells(g, x => x.coin).map(([c, r]) => key(c, r))); await rt.wait(900); await this.bonus(rt, { g }); }
      },
      async bonus(rt, { g } = {}) {
        let gg = g;
        if (!gg) { gg = make(); RNG.shuffle(cells(gg, () => true)).slice(0, 6).forEach(([c, r]) => { gg[c][r] = newCoin(); }); }
        await K.holdSpin(rt, gg, { isCoin: x => x.coin, newCoin, pCoin: 0.055, full: { v: 4000, name: 'GRAND' }, title: 'ESTOURO DE FOGO', sub: '3 respins · cada moeda reinicia' });
      },
    }));
  })();

  /* 37. O Alter Ego — mistérios e rolos que crescem */
  (() => {
    const SY = [S('heroi', 'superhero', 'Herói', [1, 3, 10], 3), S('vilao', 'supervillain', 'Vilã', [0.8, 2.5, 8], 3), S('mascara', 'performing', 'Máscaras', [0.6, 2, 6], 4), S('raio', 'lightning', 'Raio', [0.5, 1.5, 5], 4), ...R([[0.15, 0.4, 1.5], [0.15, 0.4, 1.5], [0.1, 0.3, 1.2], [0.1, 0.3, 1.2]])];
    const MYS = { id: 'mys', img: 'question', name: 'Mistério', mystery: true, t: '?', w: 0.9 };
    const WILD = { id: 'w', img: 'mirror', name: 'Coringa', wild: true, reels: [1, 2, 3], w: 0.6 };
    const SC = { id: 'sc', img: 'cityscape', name: 'Cidade', sc: true, w: 0.8 };
    const draw = pool([...SY, MYS, WILD, SC]);
    const make = (hs = [3, 4, 4, 4, 3]) => grid(hs, c => draw(c));
    const reveal = g => { if (!g.some(col => col.some(x => x.mystery))) return false; const s = RNG.pick(SY); g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...s, c: 'gold', fresh: true }; })); return true; };
    App.register(K.create({
      id: 'alterego', name: 'O Alter Ego', studio: STUDIO, art: 'superhero', mascot: 'supervillain',
      tag: 'Mistérios · até 100.000 caminhos', colors: ['#2563eb', '#dc2626'], bg: 'linear-gradient(180deg,#1e3a8a,#312e81 50%,#7f1d1d)',
      cols: 5, rows: 10, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "The Alter Ego" (Pragmatic Play).', hello: 'Mistérios viram todos o mesmo símbolo!',
      symbols: [...SY, MYS, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 3-4-4-4-3 (576 caminhos) no jogo base.')],
      highlights: ['❓ Símbolos <b>mistério</b> se revelam todos como o mesmo símbolo', '🏙️ 3+ cidades = <b>3 giros que reiniciam</b>: cada ganho bom reinicia e faz um rolo crescer (até 10 linhas = <b>100.000 caminhos</b>)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Rolos <b>3-4-4-4-3</b> com 576 caminhos. Mistérios abrem depois que os rolos param e viram todos o mesmo símbolo.</p>',
      features: '<p>🏙️ <b>3 ou mais cidades</b> dão <b>3 rodadas grátis</b>. Cada giro com um <b>ganho bom</b> (não os mínimos) <b>volta o contador para 3</b> e <b>um dos rolos do ganho pode crescer 1 linha</b> (até 10 cada, chegando a 100.000 caminhos). O bônus acaba quando os 3 giros passam sem ganho.</p>',
      make: () => make(),
      async spin(rt) {
        rt.layout(4);
        const g = make();
        await rt.spin(g);
        if (reveal(g)) { rt.msg('❓ Mistérios revelados!'); await rt.drop(g); }
        await pay(rt, ways(g, SY));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const hs = [3, 4, 4, 4, 3];
        await rt.fsLoop(3, async api => {
          rt.layout(Math.max(...hs));
          const g = make(hs);
          await rt.spin(g, { tease: false });
          if (reveal(g)) await rt.drop(g);
          const res = ways(g, SY);
          await pay(rt, res);
          // só ganhos maiores reiniciam os giros
          if (res.total >= 1) {
            const grow = [...new Set([...res.cells].map(k => unkey(k)[0]))];
            const gc = grow.filter(c => hs[c] < 10); if (gc.length && RNG.float() < 0.5) hs[RNG.pick(gc)]++;
            api.add(3 - api.left, true);
            rt.msg(`↕️ Um rolo cresceu · ${hs.reduce((a, b) => a * b, 1).toLocaleString('pt-BR')} caminhos · giros de volta a 3`);
          }
        }, { sub: 'Ganhos bons reiniciam os 3 giros', label: 'GIROS' });
        rt.layout(4);
      },
    }));
  })();

  /* 38. Pompeia Megareels Megaways — rolos vencedores crescem */
  (() => {
    const SY = [S('gladiador', 'militaryhelmet', 'Elmo', [1, 2.5, 6, 15], 3), S('anfora', 'amphora', 'Ânfora', [0.8, 2, 5, 12], 4), S('coluna', 'classical', 'Coluna', [0.6, 1.5, 4, 9], 5), S('uva', 'grapes', 'Uva', [0.5, 1.2, 3, 7], 5), S('moeda', 'coin', 'Moeda romana', [0.4, 1, 2.5, 5], 6), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const WILD = { id: 'w', img: 'laurel', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.55 };
    const SC = { id: 'sc', img: 'volcano', name: 'Vesúvio', sc: true, w: 0.42 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => K.stack(Array.from({ length: 6 }, (_, c) => Array.from({ length: RNG.int(2, 5) }, () => draw(c))), 0.3);
    async function play(rt, g, st) {
      await tumble(rt, g, {
        draw: c => draw(c),
        evaluate: gg => ways(gg, SY),
        mult: () => (st ? st.m : 1),
        onStep: async (s, gg, res) => {
          // rolos com ganho ganham uma posição (até 8)
          const won = new Set([...res.cells].map(k => unkey(k)[0]));
          won.forEach(c => { if (gg[c].length < 8) gg[c].unshift({ ...draw(c), fresh: true }); });
          if (st) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); }
        },
      });
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'pompeia', name: 'Pompeia Megareels Megaways', studio: STUDIO, art: 'volcano', mascot: 'amphora',
      tag: 'Rolos que crescem até 8 · 10.000x', colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#7f1d1d,#451a03 60%,#1c1917)',
      cols: 6, rows: 8, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Pompeii Megareels Megaways" (Pragmatic Play).', hello: 'Rolos com ganho crescem!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata.')],
      highlights: ['🌋 Megaways com cascata: todo <b>rolo que participa de um ganho cresce</b> uma posição (até 8 = <b>262.144 caminhos</b>)', '3/4/5+ Vesúvios = <b>15/20/25 rodadas grátis</b> com multiplicador <b>+1 por cascata</b> sem zerar', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>6 rolos que começam com 2 a 5 símbolos. Depois de cada ganho os símbolos vencedores caem e <b>cada rolo que participou do ganho cresce uma linha</b>, até 8.</p>',
      features: '<p>🌋 <b>3, 4 ou 5+ Vesúvios</b> dão <b>15, 20 ou 25 rodadas grátis</b>. O multiplicador sobe <b>+1 a cada cascata</b> e não zera até o fim (3+ Vesúvios dão +5).</p>',
      make,
      async spin(rt) { const g = make(); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const st = { m: 1 };
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop({ 3: 15, 4: 20 }[sc] || 25, async api => { const g = make(); await rt.spin(g, { tease: false }); if (await play(rt, g, st) >= 3) api.add(5); }, { sub: 'Multiplicador +1 por cascata' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 39. Riquezas de Loki — símbolo especial que expande */
  (() => {
    const SY = rushSyms([['loki', 'trident', 'Cetro de Loki'], ['elmo', 'helmet', 'Elmo'], ['serpente', 'snake', 'Serpente'], ['runa', 'runestone', 'Runa'], ['esmeralda', 'greenheart', 'Esmeralda'], ['ouro', 'yellowheart', 'Ouro'], ['safira', 'blueheart', 'Safira']]);
    const SC = { id: 'sc', img: 'magicwand', name: 'Bônus', sc: true, w: 0.34, fw: 0.3 };
    const draw = pool([...SY, SC]);
    const make = () => grid([7, 7, 7, 7, 7, 7, 7], c => draw(c));
    async function play(rt, g, sp) {
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => payClusters(clusters(gg, 5), TT) });
      if (sp) {
        const cols = [...new Set(cells(g, x => x.id === sp.id).map(([c]) => c))];
        if (cols.length >= 3) {
          // o símbolo especial expande pelas colunas onde aparece e paga como grupo
          cols.forEach(c => { g[c] = g[c].map(() => ({ ...sp, c: 'gold', fresh: true })); });
          await rt.drop(g);
          const v = sp.pays[Math.min(5, cols.length - 2)] * (cols.length >= 6 ? 2 : 1);
          rt.mark(cells(g, x => x.id === sp.id).map(([c, r]) => key(c, r)));
          rt.win(v);
          rt.msg(`🐍 ${sp.name} expandiu em ${cols.length} colunas = ${rt.coins(v)}`);
          rt.fx('big');
          await rt.wait(1000);
        }
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'riquezasloki', name: 'Riquezas de Loki', studio: STUDIO, art: 'snake', mascot: 'trident',
      tag: 'Símbolo especial expande · 10.000x', colors: ['#15803d', '#ca8a04'], bg: 'radial-gradient(circle at 50% 0%,#14532d,#052e16 70%)',
      cols: 7, rows: 7, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Loki\'s Riches" (Pragmatic Play).', hello: 'Grupos de 5+ pagam!',
      symbols: [...SY, SC],
      tables: [table('Pagamento por tamanho do grupo', CLH, SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🐍 7×7 com grupos e cascata', '🪄 3+ bônus = <b>10 rodadas grátis</b> com um <b>símbolo especial</b> sorteado', 'No fim de cada giro, se o especial aparecer em 3+ colunas, ele <b>expande nelas inteiras</b> e paga como grupo (dobrado com 6+ colunas)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam e somem (cascata).</p>',
      features: '<p>🪄 <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b>. Antes começar, um <b>símbolo especial</b> é sorteado. No fim das cascatas de cada giro, se ele estiver em 3 ou mais colunas, ele <b>preenche essas colunas inteiras</b> e paga como um grupo, em dobro se forem 6 colunas ou mais. 3+ bônus nas grátis dão +10.</p>',
      make,
      async spin(rt) { const g = make(); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const sp = RNG.pick(SY);
        await rt.reveal('SÍMBOLO ESPECIAL', SY.map(s => ({ img: s.img, label: s.name })), SY.indexOf(sp));
        await rt.fsLoop(10, async api => { if (await play(rt, make(), sp) >= 3) api.add(10); }, { sub: `Especial: ${sp.name}` });
      },
    }));
  })();
})();
