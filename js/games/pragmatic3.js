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
  /** compra de bônus: sorteia uma quantidade natural de scatters (mín. 80%, +1 17%, +2 3%) */
  const natSc = min => min + RNG.weighted([{ n: 0, w: 80 }, { n: 1, w: 17 }, { n: 2, w: 3 }]).n;

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
    const SC = { id: 'sc', img: 'rabbitface', name: 'Coelho', sc: true, w: 0.8, fw: 0 };
    const COIN = { id: 'moeda', img: 'coin', name: 'Moeda', coin: true, noPay: true, w: 1, fw: 0.6 };
    const draw = pool([...SY, SC, COIN]);
    const VALS = [{ v: 0.2, w: 40 }, { v: 0.5, w: 30 }, { v: 1, w: 18 }, { v: 2, w: 8 }, { v: 5, w: 3 }, { v: 10, w: 1 }, { v: 25, w: 0.25 }];
    const coin = () => { const v = RNG.weighted(VALS).v; return { ...COIN, v, t: K.short(v) + 'x', fresh: true }; };
    const cell = (c, wk) => { const x = draw(c, wk); if (x.coin) { x.v = RNG.weighted(VALS).v; x.t = K.short(x.v) + 'x'; } return x; };
    const make = wk => grid([7, 7, 7, 7, 7, 7, 7], c => cell(c, wk));
    // medidor de pontos: cada nível dá +5 giros e o multiplicador
    const LV = [{ at: 0, m: 1 }, { at: 30, m: 2 }, { at: 45, m: 3 }, { at: 60, m: 5 }, { at: 90, m: 10 }];
    // padrão de moedas garantido em cada giro grátis (cresce a cada giro)
    const PATTERN = [4, 6, 8, 10, 12];
    async function play(rt, g, st) {
      if (st) {
        const n = PATTERN[Math.min(PATTERN.length - 1, st.spin)];
        RNG.shuffle(cells(g, x => !x.coin)).slice(0, n).forEach(([c, r]) => { g[c][r] = coin(); });
      }
      await rt.drop(g);
      if (st) { rt.msg(`🪙 Padrão de ${PATTERN[Math.min(PATTERN.length - 1, st.spin)]} moedas!`); await rt.wait(400); }
      // coelho do jogo base: às vezes derruba um bloco 3×3 de moedas
      if (!st && RNG.float() < 0.012) {
        const c0 = RNG.int(0, 4), r0 = RNG.int(0, 4);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) g[c0 + a][r0 + b] = coin();
        rt.msg('🐇 O coelho derrubou um monte de moedas!'); rt.fx('boom'); await rt.drop(g);
      }
      const m = () => (st ? LV.filter(l => st.pts >= l.at).pop().m : 1);
      await tumble(rt, g, {
        draw: c => cell(c, st ? 'fw' : 'w'),
        evaluate: gg => {
          const res = payClusters(clusters(gg, 5), TT);
          const syms = res.cells.size;
          // moedas encostadas em grupos vencedores são coletadas
          const got = new Set();
          res.cells.forEach(kk => { const [c, r] = unkey(kk); near(c, r).forEach(([a, b]) => { const y = gg[a] && gg[a][b]; if (y && y.coin) got.add(key(a, b)); }); });
          got.forEach(kk => { const [c, r] = unkey(kk); res.total += gg[c][r].v; res.cells.add(kk); });
          if (got.size) res.wins.push({ sym: { name: 'Moedas' }, n: got.size, pay: 0 });
          // 1 ponto por símbolo vencedor e 3 por moeda coletada
          if (st && res.total) { st.pts += syms + 3 * got.size; rt.chip('pts', 'PONTOS', st.pts); }
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
      highlights: ['🥕 7×7 com grupos e cascata', '🪙 Moedas <b>encostadas num grupo vencedor</b> são coletadas (até 25x cada)', '🐇 O coelho pode derrubar um <b>bloco 3×3 de moedas</b>', '4+ coelhos = <b>5 rodadas grátis</b> com moedas garantidas e medidor de pontos: <b>x2, x3, x5 e x10</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam e somem (cascata). As <b>moedas</b> encostadas (horizontal/vertical) num grupo vencedor são pagas e também somem.</p>',
      features: '<p>🐇 <b>4 ou mais coelhos</b> dão <b>5 rodadas grátis</b>. Todo giro grátis traz um <b>padrão garantido de moedas</b> que cresce: 4, 6, 8, 10 e depois 12 moedas por giro.</p><p>🥕 <b>Medidor de pontos:</b> cada símbolo vencedor vale <b>1 ponto</b> e cada moeda coletada vale <b>3</b>. Com <b>30, 45, 60 e 90</b> pontos o multiplicador vira <b>x2, x3, x5 e x10</b> e cada nível dá <b>+5 giros</b>. O medidor não zera.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { pts: 0, lv: 0, spin: 0 };
        rt.chip('pts', 'PONTOS', 0);
        await rt.fsLoop(5, async api => {
          st.spin = api.i;
          await play(rt, make('fw'), st);
          const lv = LV.filter(l => st.pts >= l.at).length - 1;
          if (lv > st.lv) { api.add(5 * (lv - st.lv)); st.lv = lv; rt.msg(`🥕 Medidor x${LV[lv].m}! +5 giros`); rt.fx('rise'); }
        }, { sub: 'Moedas garantidas · medidor x2 · x3 · x5 · x10' });
        rt.chip('pts', null);
      },
    }));
  })();

  /* 23. Abelhas Grudentas (Sticky Bees) — super coringas colantes */
  (() => {
    const SY = rushSyms([['mel', 'honeypot', 'Pote de mel'], ['flor', 'hibiscus', 'Hibisco'], ['girassol', 'sunflower', 'Girassol'], ['joaninha', 'ladybug', 'Joaninha'], ['folha', 'leaf', 'Folha'], ['trevo', 'shamrock', 'Trevo'], ['margarida', 'blossom', 'Flor']]);
    const SC = { id: 'sc', img: 'beehive', name: 'Colmeia', sc: true, w: 0.75, fw: 0.3 };
    const BEE = { id: 'w', img: 'bee', name: 'Abelha coringa', wild: true, w: 0.35, fw: 0 };
    const draw = pool([...SY, SC, BEE]);
    const make = wk => grid([7, 7, 7, 7, 7, 7, 7], c => { const x = draw(c, wk); if (x.wild) mult(x, RNG.pick([1, 2, 2, 3])); return x; });
    async function play(rt, g, st) {
      if (st) {
        // 1 a 3 super abelhas novas por giro; as antigas ficam
        const n = RNG.weighted([{ n: 0, w: 55 }, { n: 1, w: 35 }, { n: 2, w: 8 }, { n: 3, w: 2 }]).n;
        for (let i = 0; i < n; i++) { const kk = key(RNG.int(0, 6), RNG.int(0, 6)); if (!st.bees.has(kk)) st.bees.set(kk, RNG.pick([1, 2, 2, 3])); }
        st.bees.forEach((m, kk) => { const [c, r] = unkey(kk); g[c][r] = mult({ ...BEE, c: 'sticky gold' }, m); });
        if (n) rt.msg(`🐝 +${n} super abelha${n > 1 ? 's' : ''} colante${n > 1 ? 's' : ''}!`);
      }
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c, st ? 'fw' : 'w'),
        evaluate: gg => payClusters(clusters(gg, 5), TT, k => {
          const ws = k.cells.filter(kk => { const [c, r] = unkey(kk); return gg[c][r].wild; });
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
      highlights: ['🐝 7×7 com grupos; abelhas são <b>coringas com multiplicador</b> que se somam', '4+ colmeias = <b>7 rodadas grátis</b> (+1 por colmeia extra)', 'Nas grátis caem até <b>3 super abelhas por giro</b> (x1 a x3) que <b>grudam</b> até o fim', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam (cascata). 🐝 Abelhas são coringas com x1 a x3; várias no mesmo grupo <b>se somam</b>.</p>',
      features: '<p>🏠 <b>4 ou mais colmeias</b> dão <b>7 rodadas grátis</b> +1 por colmeia além de 4 (3 durante o bônus dão +3). A cada giro podem cair até 3 <b>super abelhas</b> coringa (x1 a x3) que ficam <b>grudadas no lugar até o fim</b> do bônus.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? natSc(4) : opts.sc || 4;
        const st = { bees: new Map() };
        await rt.fsLoop(7 + Math.max(0, sc - 4), async api => { const s = await play(rt, make('fw'), st); if (s >= 3) api.add(3); }, { sub: 'Super abelhas colantes!' });
      },
    }));
  })();

  /* 24. Ônibus das Celebridades Megaways — respin com scatters colantes */
  (() => {
    const SY = [S('estrela', 'microphone', 'Microfone', [1, 2.5, 6, 15], 3), S('oculos', 'sunglasses', 'Óculos', [0.8, 2, 5, 12], 4), S('camera', 'camera', 'Câmera', [0.6, 1.5, 4, 9], 5), S('bolsa', 'handbag', 'Bolsa', [0.5, 1.2, 3, 7], 5), S('salto', 'highheel', 'Salto', [0.4, 1, 2.5, 5], 6), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const WILD = { id: 'w', img: 'bus', name: 'Ônibus', wild: true, reels: [1, 2, 3, 4], w: 0.55 };
    const SC = { id: 'sc', img: 'glowstar', name: 'Estrela', sc: true, w: 0.88 };
    const draw = pool([...SY, WILD, SC]);
    const heights = () => Array.from({ length: 6 }, () => RNG.int(2, 7));
    const make = (hs = heights()) => K.stack(hs.map((hh, c) => Array.from({ length: hh }, () => draw(c))), 0.3);
    async function play(rt, g, st) {
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => ways(gg, SY), mult: () => (st ? st.m : 1), onStep: async () => { if (st && st.m < 50) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); } } });
    }
    App.register(K.create({
      id: 'onibuscelebridades', name: 'Ônibus das Celebridades Megaways', studio: STUDIO, art: 'bus', mascot: 'glowstar',
      tag: 'Respin de estrelas · mult. até x50', colors: ['#db2777', '#fbbf24'], bg: 'linear-gradient(180deg,#831843,#be185d 50%,#1e1b4b)',
      cols: 6, rows: 7, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Wild Celebrity Bus Megaways" (Pragmatic Play).', hello: '3 estrelas dão respin!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata.')],
      highlights: ['🚌 Megaways (até 117.649 caminhos) com cascata', '⭐ 3 estrelas = <b>respin</b> com as estrelas colantes até parar de cair estrela', '4/5/6 estrelas = <b>8/10/12 rodadas grátis</b> com multiplicador <b>+1 por cascata sem zerar</b> (até x50)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Megaways (2 a 7 símbolos por rolo) com cascata. O ônibus é coringa nos rolos 2 a 5.</p>',
      features: '<p>⭐ Com <b>3 estrelas</b>, elas grudam e os rolos giram de novo; cada estrela nova dá outro respin. Com <b>4, 5 ou 6 estrelas</b>, você ganha <b>8, 10 ou 12 rodadas grátis</b>. Nelas o multiplicador sobe <b>+1 a cada cascata</b> e nunca zera, até <b>x50</b>. 3 estrelas durante o bônus dão <b>+5 giros</b>.</p>',
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
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? natSc(4) : opts.sc || 4;
        const st = { m: 1 };
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop({ 4: 8, 5: 10 }[sc] || 12, async api => { const g = make(); await rt.spin(g, { tease: false }); await play(rt, g, st); if (count(g, x => x.sc) >= 3) api.add(5); }, { sub: 'Multiplicador +1 por cascata (até x50)' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 25. Assalto às Pepitas (Heist for the Golden Nuggets) — medidor de pepitas e símbolo do dinheiro */
  (() => {
    const L20 = K.LINES_5x3.slice(0, 20);
    const SY = [S('ladrao', 'detective', 'Ladrão', [5, 20, 100], 3), S('carrinho', 'minecart', 'Carrinho', [3, 10, 50], 4), S('picareta', 'pick', 'Picareta', [2, 6, 30], 4), S('lanterna', 'lantern', 'Lanterna', [1.5, 4, 20], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const CHARS = SY.slice(0, 4);
    // coringas nos rolos 2 a 4 com x2 ou x3; na mesma linha os multiplicadores se somam
    const WILD = { id: 'w', img: 'moneywings', name: 'Coringa', wild: true, reels: [1, 2, 3], w: 0.9, fw: 0.45 };
    // pepitas (rolos 1, 3 e 5) funcionam como scatter e trazem valor
    const NUG = { id: 'sc', img: 'goldnugget', name: 'Pepita', sc: true, reels: [0, 2, 4], w: 1.85, fw: 1.6 };
    const draw = pool([...SY, WILD, NUG]);
    const VALS = [{ v: 1, w: 40 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 5, w: 10 }, { v: 10, w: 6 }, { v: 25, w: 3 }, { v: 50, w: 0.8 }, { v: 100, w: 0.2 }];
    const cell = (c, wk) => {
      const x = draw(c, wk);
      if (x.sc) { x.v = RNG.weighted(VALS).v; x.t = K.short(x.v) + 'x'; }
      if (x.wild) mult(x, RNG.pick([2, 3]));
      return x;
    };
    const make = wk => grid([3, 3, 3, 3, 3], c => cell(c, wk));
    const nugs = g => g.flat().filter(x => x.sc);
    App.register(K.create({
      id: 'assaltopepitas', name: 'Assalto às Pepitas', studio: STUDIO, art: 'goldnugget', mascot: 'detective',
      tag: 'Medidor de pepitas · símbolo do dinheiro', colors: ['#ca8a04', '#44403c'], bg: 'linear-gradient(180deg,#78350f,#44403c 60%,#1c1917)',
      cols: 5, rows: 3, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Heist for the Golden Nuggets" (Pragmatic Play).', hello: '3 pepitas abrem o assalto!',
      symbols: [...SY, WILD, NUG], extraSprites: ['pistol'],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['💸 Coringas nos rolos 2 a 4 com <b>x2 ou x3</b>; dois na mesma linha <b>somam</b> os multiplicadores', '⛏️ 3 pepitas (rolos 1, 3 e 5) = <b>5 rodadas grátis</b>; os valores delas (1x a 100x) enchem o <b>medidor de pepitas</b>', '🔫 O revólver escolhe um personagem que vira o <b>símbolo do dinheiro</b>: cada vez que cai paga o medidor', 'Nas grátis os coringas <b>grudam</b> e 3 pepitas dão <b>+5 giros</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. A carteira voadora é coringa nos rolos 2 a 4 e vem com <b>x2 ou x3</b>; se houver dois coringas na mesma linha, os multiplicadores <b>se somam</b>.</p><p>⛏️ As <b>pepitas</b> só caem nos rolos 1, 3 e 5 e cada uma traz um valor.</p>',
      features: '<p>⛏️ <b>3 pepitas</b> dão <b>5 rodadas grátis</b>. Os valores delas vão para o <b>medidor de pepitas</b>. Antes de começar, o <b>revólver</b> sorteia um dos personagens (Ladrão, Carrinho, Picareta ou Lanterna): nas grátis ele vira o <b>símbolo do dinheiro</b> e, além de pagar normalmente nas linhas, <b>cada um que cair paga o valor do medidor</b>.</p><p>Toda pepita que cair nas grátis <b>soma o valor dela ao medidor</b>; 3 pepitas no mesmo giro dão <b>+5 giros</b>. Todo coringa que cair nas grátis <b>gruda</b> no lugar até o fim.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        await rt.spin(g);
        await pay(rt, lines(g, L20, SY, { mult: 'add' }));
        const ns = nugs(g);
        if (ns.length >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { meter: ns.reduce((s, x) => s + x.v, 0) }); }
      },
      async bonus(rt, opts = {}) {
        // na compra o medidor começa com 3 pepitas sorteadas
        let meter = opts.meter || [0, 1, 2].reduce(s => s + RNG.weighted(VALS).v, 0);
        const idx = RNG.int(0, CHARS.length - 1), money = CHARS[idx];
        await rt.reveal('O REVÓLVER ESCOLHE', CHARS.map(s => ({ img: s.img, t: s.name })), idx);
        rt.chip('meter', 'MEDIDOR', K.short(meter) + 'x');
        const sticky = new Map();
        await rt.fsLoop(5, async api => {
          const g = make('fw');
          sticky.forEach((m, kk) => { const [c, r] = unkey(kk); g[c][r] = mult({ ...WILD, c: 'sticky' }, m); });
          g.forEach(col => col.forEach(x => { if (x.id === money.id) { x.c = 'gold'; x.t = '$'; } }));
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => { if (!sticky.has(key(c, r))) sticky.set(key(c, r), g[c][r].m); });
          // pepitas novas enchem o medidor antes do pagamento
          const ns = nugs(g);
          if (ns.length) { meter += ns.reduce((s, x) => s + x.v, 0); rt.chip('meter', 'MEDIDOR', K.short(meter) + 'x'); rt.mark(scatters(g), 'hl'); rt.msg(`⛏️ Medidor de pepitas: ${rt.coins(meter)}`); rt.fx('coin'); await rt.wait(600); }
          await pay(rt, lines(g, L20, SY, { mult: 'add' }));
          const ms = cells(g, x => x.id === money.id);
          if (ms.length && !rt.capped) {
            const v = ms.length * meter;
            rt.mark(ms.map(([c, r]) => key(c, r)));
            rt.win(v);
            rt.msg(`💰 ${ms.length}× ${money.name} do dinheiro × ${rt.coins(meter)} = ${rt.coins(v)}`);
            rt.fx('big');
            await rt.wait(900);
          }
          if (ns.length >= 3) api.add(5);
        }, { sub: `${money.name} paga o medidor · coringas colantes` });
        rt.chip('meter', null);
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
    const TYPES = { rand: { n: 'Coringas aleatórios', d: '10 giros · 2 a 6 coringas', s: 10 }, exp: { n: 'Coringa que expande', d: '8 giros · enche o rolo inteiro', s: 8 }, sur: { n: 'Coringa que cerca', d: '6 giros · vira coringa em 3×3', s: 6 } };
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
      highlights: ['🐝 Recursos aleatórios: <b>coringas aleatórios</b>, <b>coringa que expande</b> e <b>coringa que cerca (3×3)</b>', '🧑‍🌾 3 apicultores = rodadas grátis: escolha <b>10 giros</b> com coringas aleatórios, <b>8</b> com coringa que expande ou <b>6</b> com coringa que cerca; todo coringa fica <b>colante</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×4 com 20 linhas. Em qualquer giro uma abelha pode ativar um dos três recursos de coringa.</p>',
      features: '<p>🧑‍🌾 <b>3 apicultores</b> (rolos 1, 3 e 5) abrem as rodadas grátis. Antes, você escolhe o tipo de coringa: <b>coringas aleatórios com 10 giros</b>, <b>coringa que expande com 8 giros</b> ou <b>coringa que cerca com 6 giros</b>. O escolhido aparece com mais frequência e todo coringa criado <b>gruda</b> até o fim. 3 apicultores durante o bônus dão +5 giros.</p>',
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
        await rt.fsLoop(TYPES[t].s, async api => {
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
    const WILD = { id: 'w', img: 'parachute', name: 'Coringa', wild: true, w: 0.5, fw: 5 };
    const SC = { id: 'sc', img: 'airplane', name: 'Avião', sc: true, w: 0.42, fw: 1.2 };
    const draw = pool([...SY, WILD, SC]);
    const make = (wk = 'w') => grid([6, 6, 6, 6, 6, 6], c => draw(c, wk));
    const SIZES = [{ s: 2, w: 40 }, { s: 3, w: 32 }, { s: 4, w: 18 }, { s: 5, w: 8 }, { s: 6, w: 2 }];
    /**
     * Moldura s×s em (c0, r0): só se cair coringa dentro dela, ela expande e vira toda coringa,
     * com multiplicador = quantos coringas havia dentro. Devolve as chaves e o multiplicador (ou null).
     */
    function frame(g, c0, r0, s) {
      const ks = [];
      for (let a = c0; a < c0 + s; a++) for (let b = r0; b < r0 + s; b++) ks.push([a, b]);
      const n = ks.filter(([a, b]) => g[a][b].wild).length;
      if (!n) { ks.forEach(([a, b]) => { g[a][b] = { ...g[a][b], c: 'mark' }; }); return null; }
      ks.forEach(([a, b]) => { g[a][b] = mult({ ...WILD, c: 'gold', fresh: true }, n); });
      return { keys: new Set(ks.map(([a, b]) => key(a, b))), m: n };
    }
    /** Linhas que passam pela moldura expandida são multiplicadas pelo multiplicador dela (uma vez por linha). */
    function evalLines(g, fr) {
      const plain = g.map(col => col.map(x => (x.wild ? { ...x, m: 1 } : x)));
      const res = lines(plain, L50, SY);
      if (!fr) return res;
      let total = 0;
      res.wins.forEach(w => {
        const line = L50[w.line];
        const inside = line.slice(0, w.n).some((r, c) => fr.keys.has(key(c, r)));
        if (inside) { w.pay *= fr.m; w.mult = fr.m; }
        total += w.pay;
      });
      res.total = total;
      return res;
    }
    App.register(K.create({
      id: 'recompensaceu', name: 'Recompensa do Céu', studio: STUDIO, art: 'airplane', mascot: 'pilot',
      tag: 'Molduras de coringa até 6×6', colors: ['#0ea5e9', '#f97316'], bg: 'linear-gradient(180deg,#e0f2fe,#7dd3fc 50%,#0369a1)',
      cols: 6, rows: 6, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Sky Bounty" (Pragmatic Play).', hello: 'Coringas dentro da moldura enchem ela inteira!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 6, rows: 6, list: L50, text: '50 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 4), SY, '50 linhas, da esquerda para a direita.')],
      highlights: ['🖼️ Uma <b>moldura</b> de 2×2 até 6×6 pode aparecer em qualquer giro', '🪂 Se cair coringa <b>dentro dela</b>, a moldura inteira vira coringa com multiplicador igual ao <b>número de coringas que havia dentro</b>', '✈️ 3+ aviões = <b>6 rodadas grátis</b> com uma moldura 2×2 que <b>muda de lugar</b> a cada giro; cada 3 aviões coletados aumentam a moldura e dão <b>+2 giros</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 6×6 com 50 linhas. Às vezes uma <b>moldura quadrada</b> (2×2 a 6×6) aparece num lugar aleatório. Ela só se ativa se cair pelo menos um <b>coringa dentro dela</b>: aí todas as casas da moldura viram coringa e as linhas que passam por ela são multiplicadas pelo <b>número de coringas que havia dentro</b>.</p>',
      features: '<p>✈️ <b>3 ou mais aviões</b> dão <b>6 rodadas grátis</b> (+2 por avião extra). Uma moldura começa em <b>2×2</b> e <b>muda de lugar a cada giro</b>, com a mesma regra: coringa dentro faz ela encher de coringas. Os aviões são coletados num medidor e <b>a cada 3</b> a moldura cresce um tamanho (até 6×6) e você ganha <b>+2 giros</b>.</p>',
      make,
      async spin(rt) {
        const g = make();
        let fr = null;
        if (RNG.float() < 0.4) {
          const s = RNG.weighted(SIZES).s, c0 = RNG.int(0, 6 - s), r0 = RNG.int(0, 6 - s);
          fr = frame(g, c0, r0, s);
          if (fr) rt.msg(`🪂 Coringa na moldura ${s}×${s}: tudo coringa x${fr.m}!`);
        }
        await rt.spin(g);
        await pay(rt, evalLines(g, fr));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? natSc(3) : opts.sc || 3;
        let s = 2, got = 0;
        rt.chip('frame', 'MOLDURA', '2×2');
        await rt.fsLoop(6 + 2 * Math.max(0, sc - 3), async api => {
          const g = make('fw');
          const fr = frame(g, RNG.int(0, 6 - s), RNG.int(0, 6 - s), s);
          await rt.spin(g, { tease: false });
          if (fr) rt.msg(`🪂 Moldura ${s}×${s} cheia de coringas x${fr.m}!`);
          await pay(rt, evalLines(g, fr));
          const n = count(g, x => x.sc);
          if (n) {
            const before = Math.floor(got / 3);
            got += n;
            const ups = Math.floor(got / 3) - before;
            rt.chip('frame', 'MOLDURA', `${s}×${s} · ✈️${got % 3}/3`);
            if (ups) { s = Math.min(6, s + ups); api.add(2 * ups, true); rt.chip('frame', 'MOLDURA', `${s}×${s} · ✈️${got % 3}/3`); rt.msg(`✈️ Moldura cresceu para ${s}×${s}! +${2 * ups} giros`); rt.fx('rise'); await rt.wait(700); }
          }
        }, { sub: 'Moldura que anda · 3 aviões = maior e +2 giros' });
        rt.chip('frame', null);
      },
    }));
  })();

  /* 29. Reis do Bar (Pub Kings) — medidor de cada rei e canecas por rolo */
  (() => {
    const L20 = K.linesFor(4, 20);
    const KINGS = [S('rei1', 'beardman', 'Rei barbudo', [3, 10, 50], 3), S('rei2', 'princeman', 'Rei jovem', [2.5, 8, 40], 3), S('rei3', 'oldman', 'Rei ancião', [2, 6, 30], 4), S('rei4', 'redhair', 'Rei ruivo', [1.5, 5, 25], 4)];
    const PINT = S('caneca', 'beers', 'Canecas', [1, 3, 10], 5);
    const SY = [...KINGS, PINT, ...R([[0.4, 1.2, 4], [0.4, 1.2, 4], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'castlejp', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.8 };
    const SC = { id: 'sc', img: 'beer', name: 'Barril', sc: true, reels: [0, 2, 4], w: 1.3, fw: 0.4 };
    const draw = pool([...SY, WILD, SC]);
    const PV = [{ v: 0.1, w: 40 }, { v: 0.2, w: 30 }, { v: 0.5, w: 18 }, { v: 1, w: 8 }, { v: 2, w: 3 }, { v: 5, w: 1 }];
    const make = fs => grid([4, 4, 4, 4, 4], c => { const x = draw(c); if (fs && x.id === PINT.id) { x.v = RNG.weighted(PV).v; x.t = K.short(x.v) + 'x'; } return x; });
    // escada de prêmios de cada rei: 6 reis abrem o nível 1 e cada 3 a mais sobem um degrau
    const LADDER = [{ p: 1 }, { s: 2 }, { p: 2 }, { p: 4 }, { s: 1 }, { p: 8 }, { p: 12 }];
    const KF = [1.6, 1.3, 1, 0.8];
    const lvOf = n => (n < 6 ? 0 : Math.min(LADDER.length, 1 + Math.floor((n - 6) / 3)));
    const ladderTxt = LADDER.map((x, i) => `<tr><td>${6 + 3 * i}</td><td>${x.p ? `prêmio ${x.p}x × rei` : `+${x.s} giros`}</td></tr>`).join('');
    App.register(K.create({
      id: 'reisbar', name: 'Reis do Bar', studio: STUDIO, art: 'beers', mascot: 'beardman',
      tag: 'Medidor de cada rei · canecas por rolo', colors: ['#b45309', '#1e3a8a'], bg: 'linear-gradient(180deg,#78350f,#451a03 60%,#1c1917)',
      cols: 5, rows: 4, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Pub Kings" (Pragmatic Play).', hello: '3 barris abrem a rodada da taverna!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 4, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🍺 5×4 com 20 linhas', '🛢️ 3 barris (rolos 1, 3 e 5) = <b>10 rodadas grátis</b>', '👑 Cada rei viking tem o <b>seu medidor</b>: 6 reis abrem o nível 1 e cada 3 a mais sobem na <b>escada de prêmios e giros</b>', '🍻 As canecas enchem o <b>medidor do rolo</b>; no fim, o rolo mais cheio paga', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×4 com 20 linhas. O castelo é coringa nos rolos 2 a 5.</p>',
      features: `<p>🛢️ <b>3 barris</b> dão <b>10 rodadas grátis</b> (3 barris nelas dão +5). Cada <b>rei</b> que cair entra no medidor dele. Com <b>6</b> ele abre o nível 1 e a cada <b>3 a mais</b> sobe um degrau; cada degrau dá um prêmio (maior para os reis mais valiosos: ×1,6, ×1,3, ×1 e ×0,8) ou giros extras.</p><table class="paytable"><tr class="si-head"><td>Reis</td><td>Recompensa</td></tr>${ladderTxt}</table><p>🍻 Nas grátis cada <b>caneca</b> traz um valor (0,1x a 5x) que vai para o <b>medidor do rolo</b> dela. No fim do bônus, o rolo com o medidor mais alto paga o valor dele.</p>`,
      make: () => make(false),
      async spin(rt) { const g = make(false); await rt.spin(g); await pay(rt, lines(g, L20, SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const got = KINGS.map(() => 0), pints = [0, 0, 0, 0, 0];
        const showPints = () => rt.head(pints.map(v => '🍻 ' + K.short(v)));
        showPints();
        await rt.fsLoop(10, async api => {
          const g = make(true);
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L20, SY));
          g.forEach((col, c) => col.forEach(x => { if (x.id === PINT.id) pints[c] += x.v; }));
          showPints();
          for (let i = 0; i < KINGS.length; i++) {
            const k = KINGS[i], before = lvOf(got[i]);
            got[i] += count(g, x => x.id === k.id);
            for (let lv = before + 1; lv <= lvOf(got[i]); lv++) {
              const step = LADDER[lv - 1];
              if (step.p) { const v = step.p * KF[i]; rt.win(v); rt.msg(`👑 ${k.name} nível ${lv}: ${rt.coins(v)}`); rt.fx('big'); }
              else { api.add(step.s, true); rt.msg(`👑 ${k.name} nível ${lv}: +${step.s} giros`); rt.fx('rise'); }
              await rt.wait(700);
            }
          }
          rt.chip('reis', 'REIS', got.join(' '));
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: 'Medidores dos reis e das canecas' });
        rt.chip('reis', null);
        const top = Math.max(...pints);
        if (top > 0 && !rt.capped) { rt.win(top); rt.msg(`🍻 Rolo ${pints.indexOf(top) + 1} com mais canecas paga ${rt.coins(top)}`); rt.fx('big'); await rt.wait(1000); }
        rt.head(null);
      },
    }));
  })();

  /* 30. Trilha do Mustang — coringas que se duplicam */
  (() => {
    const L10 = K.LINES_5x3.slice(0, 10);
    const SY = [S('mustang', 'horse', 'Mustang', [5, 25, 100], 3), S('cowgirl', 'cowboy', 'Vaqueira', [3, 12, 60], 4), S('sela', 'saddle', 'Sela', [2, 8, 40], 4), S('ferradura', 'horseshoe', 'Ferradura', [1.5, 5, 25], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'horseface', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.85, fw: 1.6 };
    const SC = { id: 'sc', img: 'sunset', name: 'Pôr do sol', sc: true, w: 0.95, fw: 1.1 };
    const draw = pool([...SY, WILD, SC]);
    const make = (wk = 'w') => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    const dup = (g, rt) => {
      const ws = cells(g, x => x.wild && !x.dup);
      ws.forEach(() => { if (RNG.float() < 0.5) { const a = RNG.int(1, 4), b = RNG.int(0, 2); if (!g[a][b].sc && !g[a][b].fixed) g[a][b] = { ...WILD, dup: true, fresh: true }; } });
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
      highlights: ['🐎 Todo coringa pode <b>se duplicar</b> para outra posição', '🌅 3+ pores do sol = <b>8 rodadas grátis</b>', 'Nas grátis os pores do sol enchem um medidor: <b>a cada 3</b>, +5 giros e um <b>coringa fixo</b> até o fim', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×3 com 10 linhas. Cada coringa que cai tem chance de <b>se copiar</b> para outra posição dos rolos 2 a 5.</p>',
      features: '<p>🌅 <b>3 ou mais pores do sol</b> dão <b>8 rodadas grátis</b>. Cada pôr do sol que cair nelas vai para o medidor; <b>a cada 3 coletados</b> você ganha <b>+5 giros</b> e um <b>coringa fixo</b> num lugar aleatório dos rolos 2 a 5, que fica até o fim. Os outros coringas (e suas cópias) valem só no giro em que caem.</p>',
      make,
      async spin(rt) { const g = make(); dup(g, rt); await rt.spin(g); await pay(rt, lines(g, L10, SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const fixed = new Set();
        let got = 0;
        rt.chip('sol', 'PÔR DO SOL', '0/3');
        await rt.fsLoop(8, async api => {
          const g = make('fw');
          fixed.forEach(kk => { const [c, r] = unkey(kk); g[c][r] = { ...WILD, c: 'sticky', fixed: true }; });
          dup(g, rt);
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L10, SY));
          const n = count(g, x => x.sc);
          if (n) {
            const ups = Math.floor((got + n) / 3) - Math.floor(got / 3);
            got += n;
            for (let i = 0; i < ups; i++) {
              api.add(5);
              const free = [];
              for (let c = 1; c <= 4; c++) for (let r = 0; r < 3; r++) if (!fixed.has(key(c, r))) free.push(key(c, r));
              if (free.length) fixed.add(RNG.pick(free));
              rt.msg('🌅 3 pores do sol: +5 giros e um coringa fixo!'); rt.fx('rise'); await rt.wait(700);
            }
            rt.chip('sol', 'PÔR DO SOL', `${got % 3}/3`);
          }
        }, { sub: 'A cada 3 pores do sol: +5 giros e coringa fixo' });
        rt.chip('sol', null);
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
      features: `<p>🚀 Nas rodadas grátis o multiplicador dos buracos negros <b>se soma</b> e fica até o fim. Foguetes durante o bônus dão mais giros pela mesma tabela.</p>${fsTab({ 3: 10, 4: 15, 5: 20, 6: 30, 7: 50 })}`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? natSc(3) : opts.sc || 3;
        const n = k => ({ 3: 10, 4: 15, 5: 20, 6: 30 }[k] || 50);
        const st = { m: 0 };
        await rt.fsLoop(n(sc), async api => { const s = await play(rt, make('fw'), st); if (s >= 3) api.add(n(s)); }, { sub: 'Multiplicador do buraco acumula' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 32. Princesa do Crepúsculo — coringas multiplicadores colantes */
  (() => {
    const MULTS = [{ m: 2, w: 50 }, { m: 3, w: 28 }, { m: 5, w: 15 }, { m: 10, w: 7 }];
    const RETRIG = { 2: 5, 3: 10, 4: 20, 5: 30 };
    const game = T.clusterWild({
      id: 'princesacrepusculo', name: 'Princesa do Crepúsculo', studio: STUDIO, art: 'vampire', mascot: 'crescentmoon',
      tag: 'Coringas x2 a x10 colantes · 7.500x', colors: ['#7c3aed', '#be123c'], bg: 'radial-gradient(circle at 50% 0%,#581c87,#0f0518 70%)',
      intro: 'Inspirado no "Twilight Princess" (Pragmatic Play).', maxWin: 7500, scMin: 3, n: 7,
      syms: rushSyms([['rosa', 'rose', 'Rosa'], ['calice', 'wine', 'Taça'], ['vela', 'candle', 'Vela'], ['anel', 'ring', 'Anel'], ['cristal', 'crystal', 'Cristal'], ['morcego', 'bat', 'Morcego'], ['lua', 'moonview', 'Lua']]),
      scImg: 'castle', scName: 'Castelo', scW: 0.34, wildImg: 'vampire', native: { w: 0.3, fw: 0.6, mults: MULTS },
      fsTable: { 3: 10, 4: 10, 5: 10, 6: 10, 7: 10 }, retrig: RETRIG,
      highlights: ['🦇 7×7 com grupos e cascata', '🧛 Coringas com <b>x2, x3, x5 ou x10</b>; vários no mesmo grupo se somam', '🏰 3+ castelos = <b>10 rodadas grátis</b>: todo coringa fica <b>colado no lugar até o fim do bônus</b>', 'Nas grátis os multiplicadores dos coringas <b>acumulam</b> num multiplicador global que vale para o giro inteiro', '2/3/4/5 castelos nas grátis = <b>+5/+10/+20/+30</b>', 'Prêmio máximo: <b>7.500x</b>'],
      features: '<p>🧛 Coringas já caem com multiplicador (x2 a x10). No jogo base, os coringas de um grupo vencedor somam os multiplicadores e multiplicam aquele grupo.</p><p>🏰 Nas rodadas grátis todo coringa que cair <b>gruda no lugar até o fim do bônus</b> (não cai na cascata). Num giro com ganho, os multiplicadores dos coringas novos se somam ao <b>multiplicador global</b>, que vale para o ganho total do giro e não zera até o fim. Castelos durante o bônus: 2 = +5, 3 = +10, 4 = +20, 5 = +30 giros.</p>',
    });
    // rodadas grátis locais: coringas colantes durante todo o bônus e multiplicador global que acumula
    const L = game.logic;
    const SY = L.symbols.filter(x => !x.sc && !x.wild), SC = L.symbols.find(x => x.sc), WILD = L.symbols.find(x => x.wild);
    const draw = pool([...SY, SC, { ...WILD, fw: 0.2 }]);
    const cellFS = c => { const x = draw(c, 'fw'); if (x.wild) { mult(x, RNG.weighted(MULTS).m); x.fixed = true; x.c = 'sticky'; } return x; };
    L.bonus = async function (rt) {
      const sticky = new Map();
      let glob = 0, pend = 0;
      rt.chip('mult', 'GLOBAL', '—');
      await rt.fsLoop(10, async api => {
        const g = Array.from({ length: 7 }, (_, c) => Array.from({ length: 7 }, () => cellFS(c)));
        // coringas novos da grade inicial contam como "deste giro"
        g.forEach((col, c) => col.forEach((x, r) => { if (x.wild) pend += x.m; }));
        sticky.forEach((m, kk) => { const [c, r] = unkey(kk); g[c][r] = mult({ ...WILD, fixed: true, c: 'sticky' }, m); });
        await rt.drop(g);
        const res = await tumble(rt, g, {
          draw: c => { const x = cellFS(c); if (x.wild) pend += x.m; return x; },
          evaluate: gg => payClusters(clusters(gg, 5), TT),
          keep: x => !!x.wild,
        });
        g.forEach((col, c) => col.forEach((x, r) => { if (x.wild) sticky.set(key(c, r), x.m); }));
        if (res.total > 0 && pend + glob > 0 && !rt.capped) {
          const m = pend + glob;
          glob = m; pend = 0;
          rt.mark(cells(g, x => x.wild).map(([c, r]) => key(c, r)), 'hl');
          rt.win(res.total * (m - 1));
          rt.chip('mult', 'GLOBAL', 'x' + glob);
          rt.msg(`🧛 Coringas x${m}! ${rt.coins(res.total)} → ${rt.coins(res.total * m)}`);
          rt.fx('big');
          await rt.wait(1000);
        }
        const s = count(g, x => x.sc);
        if (s >= 2 && RETRIG[Math.min(5, s)]) api.add(RETRIG[Math.min(5, s)]);
      }, { sub: 'Coringas colantes · multiplicador global' });
      rt.chip('mult', null);
    };
    App.register(game);
  })();

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
    const SC = { id: 'sc', img: 'evergreen', name: 'Pinheiro', sc: true, w: 0.14, fw: 0.04 };
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
      highlights: ['🪵 Começa em 5×4 (1.024 caminhos) e <b>cada cascata adiciona uma linha</b> até 10 (100.000 caminhos)', '🌲 4/5 pinheiros = <b>8/10 rodadas grátis</b> em que a altura <b>não volta</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>5 rolos que começam com 4 linhas. Ganhos são pagos por caminho e os símbolos vencedores caem (cascata); <b>a cada cascata os rolos ganham uma linha</b>, até 10 linhas (100.000 caminhos). No próximo giro volta a 4.</p>',
      features: '<p>🌲 <b>4 ou 5 pinheiros</b> dão <b>8 ou 10 rodadas grátis</b>. Durante o bônus a altura alcançada <b>fica guardada</b> para os próximos giros (3+ pinheiros dão +4).</p>',
      make: () => make(4),
      async spin(rt) { rt.layout(4); const g = make(4); await rt.spin(g); const sc = await play(rt, g, null); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } rt.layout(4); },
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? (RNG.float() < 0.85 ? 4 : 5) : opts.sc || 4;
        const st = { rows: 4 };
        await rt.fsLoop(sc >= 5 ? 10 : 8, async api => { rt.layout(st.rows); const g = make(st.rows); await rt.spin(g, { tease: false }); if (await play(rt, g, st) >= 3) api.add(4); }, { sub: 'A altura fica guardada' });
        rt.layout(4);
      },
    }));
  })();

  /* 35. Açúcar Supremo Powernudge — 6×6 em grupos com Powernudge e posições multiplicadoras */
  (() => {
    const N = 6, CAP = 100;
    const SY = rushSyms([['bala', 'candy', 'Bala'], ['pirulito', 'lollipop', 'Pirulito'], ['donut', 'doughnut', 'Rosquinha'], ['cupcake', 'cupcake', 'Cupcake'], ['chiclete', 'gumball', 'Chiclete'], ['jujuba', 'jelly', 'Jujuba'], ['biscoito', 'cookie', 'Biscoito']]).map((x, i) => (i >= 4 ? { ...x, fw: x.w * 1.35 } : x));
    const SC = { id: 'sc', img: 'birthday', name: 'Bolo', sc: true, w: 0.5, fw: 0.3 };
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
      highlights: ['🍬 6×6 em grupos: <b>5 ou mais</b> doces iguais encostados pagam', '🍭 <b>Powernudge:</b> depois de um ganho, todo rolo com símbolo vencedor <b>desce uma casa</b> e entra um doce novo no topo, enquanto houver ganho', '🍪 Cada posição vencedora deixa um <b>biscoito multiplicador</b> que começa em x1 e ganha <b>+1</b> a cada novo ganho nela; os multiplicadores sob um grupo <b>se somam</b>', '🎂 3/4/5/6 bolos = <b>10/12/15/20 rodadas grátis</b>: Powernudge em <b>todo</b> ganho e biscoitos que <b>ficam até o fim</b>; 3+ bolos nelas = <b>+10</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade <b>6×6</b> que paga por grupos de 5 ou mais símbolos iguais encostados. Depois de um giro com ganho, o <b>Powernudge</b> pode entrar: os rolos que têm símbolo vencedor descem uma posição (um símbolo novo aparece no topo) e o jogo avalia de novo; isso se repete enquanto sair ganho.</p><p>🍪 Toda posição que participa de um ganho ganha um biscoito <b>x1</b>; cada novo ganho na mesma posição soma <b>+1</b> (até x100). Um grupo é multiplicado pela <b>soma</b> dos biscoitos sob ele. No jogo base os biscoitos somem no fim do giro.</p>',
      features: `<p>🎂 <b>3, 4, 5 ou 6 bolos</b> dão <b>10, 12, 15 ou 20 rodadas grátis</b>. Nelas o Powernudge entra em <b>todo</b> giro com ganho e os biscoitos multiplicadores <b>ficam na grade até o fim</b> do bônus. 3 ou mais bolos durante o bônus dão <b>+10 giros</b>.</p>${fsTab(FS)}`,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        await rt.spin(g);
        const sc = count(g, x => x.sc);
        await play(rt, g, 'w', fresh(), false);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? natSc(3) : opts.sc || 3;
        const sp = fresh();
        await rt.fsLoop(FS[Math.min(6, Math.max(3, sc))], async api => {
          const g = make('fw');
          deco(g, sp);
          await rt.spin(g, { tease: false });
          const n = count(g, x => x.sc);
          await play(rt, g, 'fw', sp, true);
          if (n >= 3) api.add(10);
        }, { sub: 'Powernudge sempre · biscoitos ficam' });
      },
    }));
  })();

  /* 36. Estouro de Fogo (Fire Stampede) — conecte e colete */
  (() => {
    const SY = [S('bufalo', 'bison', 'Búfalo', [1, 3, 8], 3), S('aguia', 'eagle', 'Águia', [0.8, 2, 6], 4), S('lobo', 'wolf', 'Lobo', [0.6, 1.5, 5], 4), S('urso', 'bear', 'Urso', [0.5, 1.2, 4], 5), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'fire', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.6 };
    const COIN = { id: 'moeda', img: 'flamecoin', name: 'Moeda de fogo', coin: true, noPay: true, w: 3, fw: 14 };
    const SC = { id: 'sc', img: 'bisonskull', name: 'Crânio', sc: true, w: 0.72, fw: 0 };
    const draw = pool([...SY, WILD, COIN, SC]);
    const VALS = [{ v: 0.5, w: 30 }, { v: 1, w: 30 }, { v: 2, w: 18 }, { v: 3, w: 10 }, { v: 5, w: 6 }, { v: 10, w: 3 }, { v: 25, w: 0.8, j: 'MINI' }, { v: 200, w: 0.08, j: 'MAJOR' }];
    // prêmio do fim da trilha (à direita do rolo 5)
    const PRIZE = [{ v: 5, w: 40 }, { v: 10, w: 30 }, { v: 20, w: 18 }, { v: 50, w: 9 }, { v: 100, w: 2.5 }, { v: 250, w: 0.5 }];
    const newCoin = () => { const p = RNG.weighted(VALS); return { ...COIN, v: p.v, t: p.j || K.short(p.v) + 'x', c: p.j ? 'coin-ouro' : '' }; };
    const cell = (c, wk) => { const x = draw(c, wk); return x.coin ? newCoin() : x; };
    const make = (wk = 'w') => grid([5, 5, 5, 5, 5], c => cell(c, wk));
    const L50 = K.linesFor(5, 50);
    /** Conecte e colete: moedas em rolos seguidos a partir do 1º; 3+ rolos pagam as moedas e, chegando ao 5º, o prêmio do fim. */
    async function connect(rt, g, prize) {
      let n = 0;
      while (n < 5 && g[n].some(x => x.coin)) n++;
      if (n < 3) return;
      const ks = [];
      for (let c = 0; c < n; c++) g[c].forEach((x, r) => { if (x.coin) ks.push([c, r]); });
      let v = ks.reduce((sum, [c, r]) => sum + g[c][r].v, 0);
      if (n === 5) v += prize;
      rt.mark(ks.map(([c, r]) => key(c, r)));
      rt.win(v);
      rt.msg(n === 5 ? `🔥 Trilha completa! Moedas + prêmio ${rt.coins(prize)} = ${rt.coins(v)}` : `🔥 Moedas conectadas em ${n} rolos = ${rt.coins(v)}`);
      rt.fx(n === 5 ? 'big' : 'coin');
      await rt.wait(900);
    }
    const head = prize => ['', '', '', '', '🏆 ' + K.short(prize) + 'x'];
    async function holdAndSpin(rt, g) {
      await K.holdSpin(rt, g, { isCoin: x => x.coin, newCoin, pCoin: 0.055, full: { v: 4000, name: 'GRAND' }, title: 'ESTOURO DE FOGO', sub: '3 respins · cada moeda reinicia' });
    }
    const FS = { 3: 7, 4: 10, 5: 15 };
    App.register(K.create({
      id: 'estourofogo', name: 'Estouro de Fogo', studio: STUDIO, art: 'flamecoin', mascot: 'bison',
      tag: 'Conecte e colete · grátis e respin', colors: ['#ea580c', '#7c2d12'], bg: 'linear-gradient(180deg,#fdba74,#ea580c 50%,#431407)',
      cols: 5, rows: 5, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Fire Stampede" (Pragmatic Play).', hello: 'Conecte moedas de fogo da esquerda até o prêmio!',
      symbols: [...SY, WILD, COIN, SC],
      lineList: { cols: 5, rows: 5, list: L50, text: '50 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, '50 linhas, da esquerda para a direita.'), { title: 'Jackpots', head: ['valor'], rows: [{ img: 'flamecoin', name: 'MINI', pays: [25] }, { img: 'flamecoin', name: 'MAJOR', pays: [200] }, { img: 'flamecoin', name: 'GRAND (tela cheia)', pays: [4000] }] }],
      highlights: ['🔥 5×5 com 50 linhas', '🪙 <b>Conecte e colete:</b> moedas em rolos seguidos a partir do 1º pagam; chegando ao rolo 5 levam também o <b>prêmio do fim da trilha</b>', '🦬 3/4/5 crânios = <b>7/10/15 rodadas grátis</b> com muito mais moedas', '6+ moedas = <b>respin</b> com jackpots <b>MINI 25x</b>, <b>MAJOR 200x</b> e <b>GRAND 4.000x</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×5 com 50 linhas. O fogo é coringa nos rolos 2 a 5.</p><p>🪙 <b>Conecte e colete:</b> se houver moeda de fogo em <b>3 ou mais rolos seguidos</b> a partir do rolo 1, as moedas desses rolos são pagas. Se a corrente chegar ao <b>rolo 5</b>, ela também leva o <b>prêmio do fim da trilha</b>, mostrado acima do último rolo (5x a 250x).</p>',
      features: `<p>🦬 <b>3, 4 ou 5 crânios</b> dão <b>7, 10 ou 15 rodadas grátis</b>. Nelas as moedas caem muito mais e o conecte e colete fica bem mais fácil.</p>${fsTab(FS)}<p>🪙 <b>6 ou mais moedas</b> no jogo base abrem o <b>respin</b>: só moedas caem, as que caírem travam e o contador volta a 3. Moedas valem de 0,5x a 10x, ou um jackpot MINI (25x) ou MAJOR (200x). Encher as 25 casas dá o <b>GRAND de 4.000x</b>.</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        const prize = RNG.weighted(PRIZE).v;
        rt.head(head(prize));
        await rt.spin(g);
        await pay(rt, lines(g, L50, SY, { mult: 'add' }));
        await connect(rt, g, prize);
        rt.head(null);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); return; }
        if (count(g, x => x.coin) >= 6) { rt.mark(cells(g, x => x.coin).map(([c, r]) => key(c, r))); await rt.wait(900); await holdAndSpin(rt, g); }
      },
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? natSc(3) : opts.sc || 3;
        await rt.fsLoop(FS[Math.min(5, sc)], async () => {
          const g = make('fw');
          const prize = RNG.weighted(PRIZE).v;
          rt.head(head(prize));
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L50, SY, { mult: 'add' }));
          await connect(rt, g, prize);
        }, { sub: 'Mais moedas para conectar' });
        rt.head(null);
      },
    }));
  })();

  /* 37. O Alter Ego — mistérios e rolos que crescem */
  (() => {
    const SY = [S('heroi', 'superhero', 'Herói', [1, 3, 10], 3), S('vilao', 'supervillain', 'Vilã', [0.8, 2.5, 8], 3), S('mascara', 'performing', 'Máscaras', [0.6, 2, 6], 4), S('raio', 'lightning', 'Raio', [0.5, 1.5, 5], 4), ...R([[0.15, 0.4, 1.5], [0.15, 0.4, 1.5], [0.1, 0.3, 1.2], [0.1, 0.3, 1.2]])];
    const MYS = { id: 'mys', img: 'question', name: 'Mistério', mystery: true, t: '?', w: 0.9 };
    const WILD = { id: 'w', img: 'mirror', name: 'Coringa', wild: true, reels: [1, 2, 3], w: 0.6 };
    const SC = { id: 'sc', img: 'cityscape', name: 'Cidade', sc: true, w: 0.75, fw: 0 };
    // scatter vermelho: só nas grátis; faz crescer o rolo onde cai
    const RED = { id: 'red', img: 'redcircle', name: 'Scatter vermelho', red: true, noPay: true, w: 0, fw: 0.1 };
    const draw = pool([...SY, MYS, WILD, SC, RED]);
    const make = (hs = [3, 4, 4, 4, 3], wk = 'w') => grid(hs, c => draw(c, wk));
    const reveal = g => { if (!g.some(col => col.some(x => x.mystery))) return false; const s = RNG.pick(SY); g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...s, c: 'gold', fresh: true }; })); return true; };
    App.register(K.create({
      id: 'alterego', name: 'O Alter Ego', studio: STUDIO, art: 'superhero', mascot: 'supervillain',
      tag: 'Mistérios · até 100.000 caminhos', colors: ['#2563eb', '#dc2626'], bg: 'linear-gradient(180deg,#1e3a8a,#312e81 50%,#7f1d1d)',
      cols: 5, rows: 10, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "The Alter Ego" (Pragmatic Play).', hello: 'Mistérios viram todos o mesmo símbolo!',
      symbols: [...SY, MYS, WILD, SC, RED],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 3-4-4-4-3 (576 caminhos) no jogo base.')],
      highlights: ['❓ Símbolos <b>mistério</b> se revelam todos como o mesmo símbolo', '🏙️ 3+ cidades = <b>3 giros que reiniciam</b> a cada ganho', '🔴 Cada <b>scatter vermelho</b> faz o rolo dele crescer (até 10 linhas = <b>100.000 caminhos</b>)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Rolos <b>3-4-4-4-3</b> com 576 caminhos. Mistérios abrem depois que os rolos param e viram todos o mesmo símbolo.</p>',
      features: '<p>🏙️ <b>3 ou mais cidades</b> dão <b>3 rodadas grátis</b>. <b>Qualquer ganho</b> volta o contador para 3. Nas grátis aparecem <b>scatters vermelhos</b>: cada um faz o <b>rolo onde caiu crescer 1 linha</b> (até 10 cada, chegando a 100.000 caminhos), e os rolos não diminuem até o fim. O bônus acaba quando os 3 giros passam sem ganho.</p>',
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
          const g = make(hs, 'fw');
          await rt.spin(g, { tease: false });
          if (reveal(g)) await rt.drop(g);
          const res = ways(g, SY);
          await pay(rt, res);
          // scatters vermelhos fazem o rolo deles crescer (valendo a partir do próximo giro)
          const reds = cells(g, x => x.red).map(([c]) => c);
          let grew = 0;
          reds.forEach(c => { if (hs[c] < 10) { hs[c]++; grew++; } });
          if (grew) { rt.mark(cells(g, x => x.red).map(([c, r]) => key(c, r)), 'hl'); rt.msg(`🔴 Rolo cresceu · ${hs.reduce((a, b) => a * b, 1).toLocaleString('pt-BR')} caminhos`); rt.fx('rise'); await rt.wait(500); }
          // qualquer ganho reinicia os giros
          if (res.total > 0) { api.add(3 - api.left, true); rt.msg('🏙️ Ganhou: giros de volta a 3'); }
        }, { sub: 'Qualquer ganho reinicia os 3 giros', label: 'GIROS' });
        rt.layout(4);
      },
    }));
  })();

  /* 38. Pompeia Megareels Megaways — rolos vencedores crescem */
  (() => {
    const SY = [S('gladiador', 'militaryhelmet', 'Elmo', [1, 2.5, 6, 15], 3), S('anfora', 'amphora', 'Ânfora', [0.8, 2, 5, 12], 4), S('coluna', 'classical', 'Coluna', [0.6, 1.5, 4, 9], 5), S('uva', 'grapes', 'Uva', [0.5, 1.2, 3, 7], 5), S('moeda', 'coin', 'Moeda romana', [0.4, 1, 2.5, 5], 6), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const WILD = { id: 'w', img: 'laurel', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.55 };
    const SC = { id: 'sc', img: 'volcano', name: 'Vesúvio', sc: true, w: 0.8, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = (wk = 'w') => K.stack(Array.from({ length: 6 }, (_, c) => Array.from({ length: RNG.int(2, 5) }, () => draw(c, wk))), 0.3);
    async function play(rt, g, fs) {
      await tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'),
        evaluate: gg => ways(gg, SY),
        // nas grátis cada cascata vale x (quantidade de símbolos vencedores removidos nela)
        mult: (s, res) => {
          if (!fs) return 1;
          const m = Math.max(1, res.cells.size);
          rt.chip('mult', 'MULT.', 'x' + m);
          return m;
        },
        onStep: async (s, gg, res) => {
          // rolos com ganho ganham uma posição (até 8)
          const won = new Set([...res.cells].map(k => unkey(k)[0]));
          won.forEach(c => { if (gg[c].length < 8) gg[c].unshift({ ...draw(c, fs ? 'fw' : 'w'), fresh: true }); });
        },
      });
      if (fs) rt.chip('mult', 'MULT.', 'x1');
      return count(g, x => x.sc);
    }
    const FS = { 4: 15, 5: 20, 6: 25 };
    App.register(K.create({
      id: 'pompeia', name: 'Pompeia Megareels Megaways', studio: STUDIO, art: 'volcano', mascot: 'amphora',
      tag: 'Rolos que crescem até 8 · 10.000x', colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#7f1d1d,#451a03 60%,#1c1917)',
      cols: 6, rows: 8, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Pompeii Megareels Megaways" (Pragmatic Play).', hello: 'Rolos com ganho crescem!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata.')],
      highlights: ['🌋 Megaways com cascata: todo <b>rolo que participa de um ganho cresce</b> uma posição (até 8 = <b>262.144 caminhos</b>)', '4/5/6 Vesúvios = <b>15/20/25 rodadas grátis</b>', 'Nas grátis cada cascata é multiplicada pelo <b>número de símbolos vencedores removidos</b> nela', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>6 rolos que começam com 2 a 5 símbolos. Depois de cada ganho os símbolos vencedores caem e <b>cada rolo que participou do ganho cresce uma linha</b>, até 8.</p>',
      features: `<p>🌋 <b>4, 5 ou 6 Vesúvios</b> dão <b>15, 20 ou 25 rodadas grátis</b>. Nelas, o ganho de cada cascata é multiplicado pela <b>quantidade de símbolos vencedores removidos</b> naquela cascata (ex.: 9 símbolos vencedores = x9). O multiplicador vale só para a cascata dele e zera a cada giro. Não há giros extras.</p>${fsTab(FS)}`,
      make: () => make(),
      async spin(rt) { const g = make(); await rt.spin(g); const sc = await play(rt, g, false); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, opts = {}) {
        const sc = opts.buy ? natSc(4) : opts.sc || 4;
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(FS[Math.min(6, sc)], async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, true); }, { sub: 'Cascata × símbolos removidos' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 39. Riquezas de Loki — símbolo especial que expande */
  (() => {
    const SY = rushSyms([['loki', 'trident', 'Cetro de Loki'], ['elmo', 'helmet', 'Elmo'], ['serpente', 'snake', 'Serpente'], ['runa', 'runestone', 'Runa'], ['esmeralda', 'greenheart', 'Esmeralda'], ['ouro', 'yellowheart', 'Ouro'], ['safira', 'blueheart', 'Safira']]);
    const SC = { id: 'sc', img: 'magicwand', name: 'Bônus', sc: true, w: 0.7, fw: 0.3 };
    const draw = pool([...SY, SC]);
    const make = (wk = 'w') => grid([7, 7, 7, 7, 7, 7, 7], c => draw(c, wk));
    async function play(rt, g, sp) {
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c, sp ? 'fw' : 'w'), evaluate: gg => payClusters(clusters(gg, 5), TT) });
      if (sp) {
        const cols = [...new Set(cells(g, x => x.id === sp.id).map(([c]) => c))];
        if (cols.length >= 3) {
          // o símbolo especial expande pelas colunas onde aparece e paga como grupo
          cols.forEach(c => { g[c] = g[c].map(() => ({ ...sp, c: 'gold', fresh: true })); });
          await rt.drop(g);
          const v = sp.pays[Math.min(5, cols.length - 3)] * (cols.length >= 6 ? 2 : 1);
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
      highlights: ['🐍 7×7 com grupos e cascata', '🪄 4+ bônus = <b>10 rodadas grátis</b> com um <b>símbolo especial</b> sorteado', 'No fim de cada giro, se o especial aparecer em 3+ colunas, ele <b>expande nelas inteiras</b> e paga como grupo (dobrado com 6+ colunas)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam e somem (cascata).</p>',
      features: '<p>🪄 <b>4 ou mais bônus</b> dão <b>10 rodadas grátis</b>. Antes de começar, um <b>símbolo especial</b> é sorteado. No fim das cascatas de cada giro, se ele estiver em 3 ou mais colunas, ele <b>preenche essas colunas inteiras</b> e paga como um grupo, em dobro se forem 6 colunas ou mais. 4+ bônus nas grátis dão +10.</p>',
      make,
      async spin(rt) { const g = make(); const sc = await play(rt, g, null); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const sp = RNG.pick(SY);
        await rt.reveal('SÍMBOLO ESPECIAL', SY.map(s => ({ img: s.img, label: s.name })), SY.indexOf(sp));
        await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), sp) >= 4) api.add(10); }, { sub: `Especial: ${sp.name}` });
      },
    }));
  })();
})();
