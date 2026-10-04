'use strict';

/* =========================================================
   Nolimit City — lote 2 (parte 2): sequências e as mecânicas
   x (xNudge, xWays, xSplit, Enhancer Cells). Temas pesados foram
   suavizados: sem violência gráfica. RTP calibrado por simulação.
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
  const LOCK = (img = 'locked') => ({ id: 'lock', img, name: 'Bloqueado', c: 'locked', noPay: true });
  const L20 = K.LINES_5x3.slice(0, 20);
  const WP = [[1, 3, 10], [0.8, 2.5, 8], [0.6, 2, 6], [0.5, 1.5, 5], [0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]];
  const wsyms = list => [...list.map(([id, img, name], i) => S(id, img, name, WP[i], [3, 4, 4, 5][i])), ...R(WP.slice(4)).map(x => ({ ...x, fw: x.w * 1.5 }))];
  const MP = [[1, 2.5, 6, 15], [0.8, 2, 5, 12], [0.6, 1.5, 4, 9], [0.5, 1.2, 3, 7], [0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]];
  const msyms = list => [...list.map(([id, img, name], i) => S(id, img, name, MP[i], [3, 4, 5, 5][i])), ...R(MP.slice(4)).map(x => ({ ...x, fw: x.w * 1.5 }))];
  const nudgeReel = (g, c, WILD, extra = 0) => { const n = RNG.int(0, g[c].length - 1), m = 1 + n + extra; g[c] = g[c].map(x => (x.sc || x.id === 'lock' ? x : mult({ ...WILD, c: 'duel', fresh: true }, m))); return m; };
  /** xWays: todos os mistérios viram o mesmo símbolo com 2 a 4 cópias cada */
  const xways = (g, SY, rt) => { if (!g.flat().some(x => x.xw)) return; const s = RNG.pick(SY); g.forEach((col, c) => col.forEach((x, r) => { if (x.xw) { const n = RNG.int(2, 4); g[c][r] = { ...s, n, t: '×' + n, c: 'gold', fresh: true }; } })); if (rt) rt.msg(`❓ xWays: ${s.name}!`); };
  /** xSplit: o símbolo dividido conta em dobro */
  const xsplit = (g, c, r) => { const x = g[c][r]; g[c][r] = { ...x, n: (x.n || 1) * 2, t: '×' + (x.n || 1) * 2, c: 'gold' }; };
  const ENH = [{ e: null, w: 55 }, { e: 'wild', w: 18 }, { e: 'xways', w: 12 }, { e: 'split', w: 10 }, { e: 'high', w: 5 }];

  /* 21. Gênio Dourado e os Coringas Andantes */
  (() => {
    const SY = wsyms([['jasmine', 'princess', 'Princesa'], ['aladim', 'prince', 'Aladim'], ['lampada', 'oillamp', 'Lâmpada'], ['tigre', 'tiger2', 'Tigre']]);
    const GENIE = { id: 'w', img: 'genie', name: 'Gênio', wild: true, sc: true, w: 0.9, fw: 0.6 };
    const draw = pool([...SY, GENIE]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    const both = g => { const a = lines(g, L20, SY), b = lines(g.slice().reverse(), L20, SY); return { total: a.total + b.wins.filter(w => w.n < 5).reduce((s, w) => s + w.pay, 0), wins: a.wins, cells: a.cells }; };
    async function play(rt, g) {
      await rt.spin(g, { tease: false });
      let lamps = false;
      if (RNG.float() < 0.035) { [1, 3].forEach(c => { g[c] = g[c].map(() => ({ ...GENIE, sc: false, c: 'gold', fresh: true })); }); lamps = true; rt.msg('🪔 Lâmpadas do Gênio: rolos 2 e 4 coringa, paga dos dois lados!'); await rt.drop(g); }
      // desejo: Aladim logo à esquerda da lâmpada
      for (let c = 0; c < 4 && !lamps; c++) for (let r = 0; r < 3; r++) if (g[c][r].id === 'aladim' && g[c + 1][r].id === 'lampada') { const s = RNG.pick(SY.slice(0, 4)); g.forEach((col, cc) => col.forEach((x, rr) => { if (x.letter) g[cc][rr] = { ...s, c: 'gold', fresh: true }; })); rt.msg(`🧞 Desejo do Gênio: cartas viram ${s.name}!`); await rt.drop(g); c = 9; break; }
      await pay(rt, lamps ? both(g) : lines(g, L20, SY));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'geniodourado', name: 'Gênio Dourado', studio: STUDIO, art: 'genie', mascot: 'oillamp',
      tag: 'Desfile do Gênio · coringas andantes', colors: ['#ca8a04', '#7c3aed'], bg: 'linear-gradient(180deg,#4c1d95,#6d28d9 50%,#78350f)',
      cols: 5, rows: 3, maxWin: 9583, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Golden Genie and the Walking Wilds" (Nolimit City).', hello: 'Seus desejos são ordens!',
      symbols: [...SY, GENIE],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🧞 O <b>Gênio</b> é coringa e scatter', '✨ <b>Desejo:</b> Aladim logo à esquerda da lâmpada transforma as cartas num símbolo alto', '🪔 <b>Lâmpadas:</b> rolos 2 e 4 viram coringa e o giro paga <b>dos dois lados</b>', '3+ Gênios = <b>Desfile do Gênio</b>: os gênios <b>andam</b> um rolo para a esquerda a cada giro, ganham <b>+1 de multiplicador</b> a cada passo (até x10), novos gênios entram pelo rolo 5 e o bônus dura enquanto houver gênio (mínimo 8 giros)', 'Prêmio máximo: <b>9.583x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. Dois recursos podem aparecer no jogo base: o Desejo e as Lâmpadas do Gênio.</p>',
      features: '<p>🧞 <b>3 ou mais Gênios</b> começam o <b>Desfile</b>: não há número fixo de giros; os gênios ficam e andam uma casa para a esquerda a cada giro, com multiplicador que cresce a cada passo (até x10), e novos gênios entram no desfile pelo último rolo. O bônus dura pelo menos 8 giros e acaba quando não sobrar nenhum.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { g }); } },
      async bonus(rt, { g } = {}) {
        let walk = g ? cells(g, x => x.wild).map(([c, r]) => [c, r]) : [[4, 0], [4, 1], [4, 2]];
        await rt.fsLoop(1, async api => {
          walk = walk.map(([c, r]) => [c - 1, r]).filter(([c]) => c >= 0);
          const gg = make('fw');
          if (RNG.float() < 0.2) walk.push([4, RNG.int(0, 2)]);
          walk.forEach(([c, r]) => { gg[c][r] = mult({ ...GENIE, sc: false, c: 'sticky' }, Math.min(10, api.i + 1)); });
          await rt.spin(gg, { tease: false });
          cells(gg, x => x.wild && x.sc).forEach(([c, r]) => walk.push([c, r]));
          await pay(rt, lines(gg, L20, SY, { mult: 'add' }));
          if ((walk.length || api.i < 7) && api.left === 0 && api.i < 40) api.add(1, true);
        }, { title: 'DESFILE DO GÊNIO', sub: 'Dura enquanto houver gênio', label: 'DESFILE' });
      },
    }));
  })();

  /* 22. Vias Lácteas — coringas solares e giros de fusão */
  (() => {
    const SY = msyms([['astronauta', 'astronaut', 'Astronauta'], ['foguete', 'rocket', 'Foguete'], ['planeta', 'ringedplanet', 'Planeta'], ['cometa', 'comet', 'Cometa']]);
    const WILD = { id: 'w', img: 'sunface', name: 'Coringa solar', wild: true, w: 0.55, fw: 0.22 };
    const SC = { id: 'sc', img: 'milkyway', name: 'Galáxia', sc: true, w: 1.05, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const cell = (c, wk) => { const x = draw(c, wk); if (x.wild) mult(x, RNG.int(1, wk === 'fw' ? 2 : 3)); if (x.m === 1) { delete x.m; delete x.t; } return x; };
    const make = (rows, wk) => grid([rows, rows, rows, rows, rows], c => cell(c, wk));
    App.register(K.create({
      id: 'viaslacteas', name: 'Vias Lácteas', studio: STUDIO, art: 'milkyway', mascot: 'astronaut',
      tag: 'Coringas solares · fusão', colors: ['#7c3aed', '#0ea5e9'], bg: 'radial-gradient(circle at 50% 40%,#312e81,#020617 70%)',
      cols: 5, rows: 5, maxWin: 5664, vol: 4, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Milky Ways" (Nolimit City).', hello: 'Coringas solares se multiplicam!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'De 243 (5×3) até 3.125 (5×5) caminhos.')],
      highlights: ['🌌 5×3 com 243 caminhos', '☀️ <b>Coringas solares</b> com x1 a x3 que <b>se multiplicam</b>', '3 galáxias = <b>3 giros</b> numa grade <b>5×5</b> (3.125 caminhos) com <b>1 coringa garantido</b>', '🔗 <b>Giros de Fusão:</b> cada ganho nas grátis prende os vencedores e gira o resto mais uma vez', 'Prêmio máximo: <b>5.664x</b>'],
      how: '<p>Grade 5×3 que paga por caminhos. Coringas solares podem vir com multiplicador, e os multiplicadores de coringas no mesmo caminho se multiplicam.</p>',
      features: '<p>🌌 <b>3 galáxias</b> dão <b>3 rodadas grátis</b> numa grade 5×5 com um coringa garantido. Sempre que houver ganho, começa a <b>Fusão</b>: os símbolos vencedores ficam presos e o resto gira mais uma vez. 3 galáxias nas grátis dão +3.</p>',
      make: () => make(3, 'w'),
      async spin(rt) { rt.layout(3); const g = make(3, 'w'); await rt.spin(g); await pay(rt, ways(g, SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        rt.layout(5);
        await rt.fsLoop(3, async api => {
          let g = make(5, 'fw');
          g[RNG.int(0, 4)][RNG.int(0, 4)] = { ...WILD };
          await rt.spin(g, { tease: false });
          let res = ways(g, SY); await pay(rt, res);
          for (let guard = 0; guard < 1 && res.total && !rt.capped; guard++) {
            const ng = make(5, 'fw'); res.cells.forEach(k => { const [c, r] = unkey(k); ng[c][r] = { ...g[c][r], c: 'sticky' }; });
            g = ng; rt.msg('🔗 Fusão: vencedores presos!'); await rt.spin(g, { tease: false });
            const nr = ways(g, SY);
            if (nr.total <= res.total) break;
            await pay(rt, { ...nr, total: nr.total - res.total }); res = nr;
          }
          if (count(g, x => x.sc) >= 3) api.add(3);
        }, { title: 'GIROS DA VIA LÁCTEA', sub: 'Grade 5×5 com fusão' });
        rt.layout(3);
      },
    }));
  })();

  /* 23. Livro das Sombras — livro com linhas sombrias */
  (() => {
    const SY = [S('bruxa', 'mage', 'Bruxa', [0.5, 5, 50, 250], 2, { min: 2 }), S('corvo', 'crow', 'Corvo', [0.4, 4, 40, 200], 3, { min: 2 }), S('caveira', 'skull', 'Caveira', [3, 30, 150], 4), S('vela', 'candle', 'Vela', [2, 20, 100], 4), ...R([[0.5, 2.5, 10], [0.5, 2.5, 10], [0.5, 2, 8], [0.5, 2, 8]])];
    const BOOK = { id: 'w', img: 'grimoire', name: 'Livro', wild: true, sc: true, w: 0.85, fw: 0.55 };
    const draw = pool([...SY, BOOK]);
    const make = rows => grid(Array(5).fill(rows), c => draw(c));
    const Lr = rows => K.linesFor(rows, rows === 3 ? 10 : 20);
    App.register(K.create({
      id: 'livrosombras', name: 'Livro das Sombras', studio: STUDIO, art: 'grimoire', mascot: 'mage',
      tag: 'Livro com linhas sombrias · 30.338x', colors: ['#7f1d1d', '#111827'], bg: 'radial-gradient(circle at 50% 30%,#450a0a,#020617 70%)',
      cols: 5, rows: 5, maxWin: 30338, vol: 5, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Book of Shadows" (Nolimit City).', hello: 'O livro é coringa e scatter!',
      symbols: [...SY, BOOK],
      tables: [table('Pagamento por linha', heads(2, 4), SY, 'Bruxa e Corvo pagam a partir de 2.')],
      highlights: ['📕 5×3 com 10 linhas; o livro é coringa e scatter', '3+ livros = <b>10 rodadas grátis</b> com <b>símbolo especial que expande</b>', '🌑 Nas grátis as <b>linhas sombrias</b> se abrem: a grade passa a <b>5×5 com 20 linhas</b>', 'Prêmio máximo: <b>30.338x</b>'],
      how: '<p>Grade 5×3 com 10 linhas, no estilo livro. As duas linhas sombrias (acima e abaixo) ficam fechadas no jogo base.</p>',
      features: '<p>📕 <b>3 ou mais livros</b> dão <b>10 rodadas grátis</b>. Um símbolo especial é sorteado e, sempre que aparece em rolos suficientes para pagar, expande e paga em todas as linhas. Durante o bônus as <b>linhas sombrias</b> estão abertas: 5 linhas e 20 linhas de pagamento.</p>',
      make: () => make(3),
      async spin(rt) { rt.layout(3); const g = make(3); await rt.spin(g); await pay(rt, lines(g, Lr(3), SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const sp = RNG.pick(SY);
        await rt.reveal('SÍMBOLO ESPECIAL', SY.map(s => ({ img: s.img, letter: s.letter, label: s.name })), SY.indexOf(sp));
        rt.layout(5);
        await rt.fsLoop(10, async api => {
          const g = make(5); await rt.spin(g, { tease: false }); await pay(rt, lines(g, Lr(5), SY));
          const cols = [...new Set(cells(g, x => x.id === sp.id).map(([c]) => c))];
          if (cols.length >= (sp.min || 3)) { cols.forEach(c => { g[c] = g[c].map(() => ({ ...sp, c: 'gold', fresh: true })); }); await rt.drop(g); const v = 8 * sp.pays[Math.min(cols.length - (sp.min || 3), sp.pays.length - 1)] / 2; rt.win(v); rt.msg(`📕 ${sp.name} expandiu: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(800); }
          if (count(g, x => x.sc) >= 3) api.add(10);
        }, { title: 'RODADAS SOMBRIAS', sub: `Especial: ${sp.name} · 5×5` });
        rt.layout(3);
      },
    }));
  })();

  /* 24. Caçador de Búfalos — Manada e Multiplicadores da Pradaria */
  (() => {
    const L40 = K.linesFor(4, 40);
    const ANIMALS = ['bufalo', 'urso', 'lobo', 'aguia'];
    const SY = wsyms([['bufalo', 'bison', 'Búfalo'], ['urso', 'bear', 'Urso'], ['lobo', 'wolf', 'Lobo'], ['aguia', 'eagle', 'Águia']]);
    const WILD = { id: 'w', img: 'feather', name: 'Coringa', wild: true, w: 0.5 };
    const MYS = { id: 'mys', img: 'question', name: 'Mistério', mys: true, noPay: true, w: 0.8 };
    const SC = { id: 'sc', img: 'sunset', name: 'Bônus', sc: true, w: 0.8, fw: 0 };
    const draw = pool([...SY, WILD, MYS, SC]);
    const make = wk => K.stack(grid([4, 4, 4, 4, 4], c => draw(c, wk)), 0.35);
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      if (g.flat().some(x => x.mys)) { const s = RNG.pick(SY); g.forEach((col, c) => col.forEach((x, r) => { if (x.mys) g[c][r] = { ...s, c: 'gold', fresh: true }; })); rt.msg(`❓ Mistério: ${s.name}!`); await rt.drop(g); }
      const nat = count(g, x => x.id === 'bufalo' && !x.c);
      if (st) g.forEach((col, c) => col.forEach((x, r) => { if (st.horde.includes(x.id)) g[c][r] = { ...SY[0], c: 'gold' }; if (st.mult && ANIMALS.includes(x.id) && st.m > 1) mult(g[c][r], st.m); }));
      await pay(rt, lines(g, L40, SY, { mult: 'add' }));
      if (st) {
        st.got += nat;
        while (st.got >= 4) { st.got -= 4; if (st.extra < 10) { st.extra += 2; st.api.add(2, true); } if (st.hordeOn && st.horde.length < 3) { st.horde.push(ANIMALS[3 - st.horde.length]); rt.msg('🦬 A manada cresceu: mais um animal vira búfalo! +2 giros'); } if (st.mult && st.m < 5) { st.m++; rt.msg(`🌾 Multiplicador da pradaria x${st.m}! +2 giros`); } }
        rt.chip('buf', 'BÚFALOS', `${st.got}/4`);
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'cacabufalos', name: 'Caçador de Búfalos', studio: STUDIO, art: 'bison', mascot: 'eagle',
      tag: 'Manada e multiplicadores da pradaria', colors: ['#b45309', '#1c1917'], bg: 'linear-gradient(180deg,#fdba74,#92400e 50%,#292524)',
      cols: 5, rows: 4, maxWin: 12647, vol: 5, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Buffalo Hunter" (Nolimit City).', hello: 'A manada está chegando!',
      symbols: [...SY, WILD, MYS, SC],
      lineList: { cols: 5, rows: 4, list: L40, text: '40 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🦬 5×4 com 40 linhas e <b>pilhas mistério</b>', '3/4 bônus: escolha <b>Manada</b> (cada 4 búfalos transforma outro animal em búfalo) ou <b>Multiplicadores da Pradaria</b> (cada 4 búfalos dá +1 nos animais, até x5); cada 4 búfalos também dá +2 giros (até +10)', '5 bônus = <b>Estouro</b>: os dois ao mesmo tempo', 'Prêmio máximo: <b>12.647x</b>'],
      how: '<p>Grade 5×4 com 40 linhas. As pilhas mistério se revelam todas como o mesmo símbolo.</p>',
      features: '<p>🌅 Com <b>3 ou 4 bônus</b> você escolhe entre <b>Manada</b> e <b>Multiplicadores da Pradaria</b> (10 rodadas grátis). Com <b>5 bônus</b>, o <b>Estouro</b> combina os dois recursos.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const pick = sc >= 5 ? 'both' : await rt.choose('ESCOLHA SUA CAÇADA', [{ id: 'horde', img: 'bison', label: 'Manada', desc: 'animais viram búfalos' }, { id: 'mult', img: 'eagle', label: 'Pradaria', desc: 'multiplicadores até x5' }]);
        const st = { got: 0, extra: 0, horde: [], hordeOn: pick !== 'mult', mult: pick !== 'horde', m: 1 };
        await rt.fsLoop(10, async api => { st.api = api; await play(rt, make('fw'), st); }, { title: pick === 'both' ? 'ESTOURO' : pick === 'horde' ? 'MANADA' : 'MULTIPLICADORES DA PRADARIA', sub: 'Junte búfalos' });
        rt.chip('buf', null);
      },
    }));
  })();

  /* 25. Ouro do Macaco (xPays) — símbolos colossais */
  (() => {
    const SY = [S('macaco', 'monkey', 'Macaco', [1, 2, 5, 12], 3), S('idolo', 'moai', 'Ídolo', [0.8, 1.6, 4, 10], 4), S('banana', 'banana', 'Banana', [0.6, 1.2, 3, 8], 5), S('coco', 'coconut', 'Coco', [0.5, 1, 2.5, 6], 5), ...R([[0.15, 0.3, 0.6, 1.5], [0.15, 0.3, 0.6, 1.5], [0.12, 0.25, 0.5, 1.2], [0.12, 0.25, 0.5, 1.2]]), K.L('10', [0.1, 0.2, 0.4, 1], 9), K.L('9', [0.1, 0.2, 0.4, 1], 9)];
    const WILD = { id: 'w', img: 'see', name: 'Coringa', wild: true, w: 0.4 };
    const SC = { id: 'sc', img: 'temple', name: 'Templo', sc: true, w: 0.72, fw: 0.3 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid(Array(6).fill(4), c => draw(c, wk));
    const COL = [{ m: 4, w: 40 }, { m: 5, w: 25 }, { m: 10, w: 18 }, { m: 25, w: 10 }, { m: 50, w: 5 }, { m: 250, w: 0.4 }];
    async function play(rt, g, wk, st) {
      let col = 1;
      if (RNG.float() < (st ? 0.3 : 0.08)) {
        const size = RNG.float() < 0.3 ? 3 : 2, s = RNG.pick(SY.slice(0, 4)), c0 = RNG.int(0, 6 - size), r0 = RNG.int(0, 4 - size);
        col = wm(COL);
        for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) g[c0 + a][r0 + b] = { ...s, c: 'giant', t: a === 0 && b === 0 ? 'x' + col : undefined };
        rt.msg(`🐒 Símbolo colossal ${size}×${size} com x${col}!`);
      }
      await rt.drop(g);
      let m = st ? st.m : 1;
      await tumble(rt, g, {
        draw: c => draw(c, wk), evaluate: gg => ways(gg, SY), mult: (s) => (s === 0 ? col : 1) * m,
        onStep: async () => { if (st) { st.m += st.step; m = st.m; rt.chip('mult', 'CIPÓ', 'x' + m); } },
      });
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'ouromacaco', name: 'Ouro do Macaco', studio: STUDIO, art: 'monkey', mascot: 'banana',
      tag: 'Colossais até x250 · cipó multiplicador', colors: ['#16a34a', '#ca8a04'], bg: 'linear-gradient(180deg,#14532d,#3f6212 50%,#713f12)',
      cols: 6, rows: 4, maxWin: 12683, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Monkey\'s Gold xPays" (Nolimit City).', hello: 'Símbolos colossais na selva!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = 4.096 caminhos, a partir de 3 rolos, com cascata.')],
      highlights: ['🐒 6×4 com 4.096 caminhos e cascata, pagando a partir de 3 rolos', '🗿 <b>Símbolos colossais</b> 2×2 ou 3×3 com multiplicador de <b>x4 a x250</b> no primeiro ganho', '🛕 3+ templos = <b>10 rodadas grátis</b> com o <b>cipó multiplicador</b>: ele sobe de 1 a 3 a cada cascata e não zera', 'Prêmio máximo: <b>12.683x</b>'],
      how: '<p>Grade 6×4 que paga por caminhos (3 ou mais rolos seguidos), com cascata. Um símbolo colossal multiplica o primeiro ganho do giro pelo seu valor.</p>',
      features: '<p>🛕 <b>3 ou mais templos</b> dão <b>10 rodadas grátis</b>. Antes de começar, o passo do cipó é sorteado (+1, +2 ou +3): a cada cascata o multiplicador sobe esse passo e nunca volta.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { m: 1, step: RNG.weighted([{ m: 1, w: 70 }, { m: 2, w: 22 }, { m: 3, w: 8 }]).m }; rt.msg(`🌿 Passo do cipó: +${st.step}`); await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', st) >= 3) api.add(5); }, { sub: `Cipó +${st.step} por cascata` }); rt.chip('mult', null); },
    }));
  })();

  /* 26. Cemitério dos Guerreiros — lápides xNudge */
  (() => {
    const L25 = K.LINES_5x3.slice(0, 25).map(L => [...L, L[4]]);
    const SY = [S('viking', 'beardman', 'Guerreiro viking', [1, 3, 10, 30], 3), S('cavaleiro', 'militaryhelmet', 'Cavaleiro', [0.8, 2.5, 8, 25], 3), S('samurai', 'ninja', 'Samurai', [0.6, 2, 6, 20], 4), S('espada', 'sword2', 'Espada', [0.5, 1.5, 5, 15], 5), ...R([[0.15, 0.4, 1.2, 4], [0.15, 0.4, 1.2, 4], [0.1, 0.3, 1, 3], [0.1, 0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'headstone', name: 'Lápide coringa', wild: true, reels: [1, 2, 3, 4], w: 0.4, fw: 0.6 };
    const SC = { id: 'sc', img: 'skull', name: 'Bônus', sc: true, w: 0.75, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid(Array(6).fill(3), c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      if (st && st.sticky) st.sticky.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      let nudges = 0;
      for (let c = 1; c <= 4; c++) if (g[c].some(x => x.wild && !x.m)) { const m = nudgeReel(g, c, WILD); nudges += m - 1; if (st && st.sticky) st.sticky.set(c, m); }
      // ataque dos guerreiros: 3 premium iguais empurrados para dentro
      const prem = SY.slice(0, 3).find(s => count(g, x => x.id === s.id) >= 3);
      if (prem && RNG.float() < 0.3) { const cols = [...new Set(cells(g, x => x.id === prem.id).map(([c]) => c))].slice(0, 3); cols.forEach(c => { g[c] = g[c].map(() => ({ ...prem, c: 'gold', fresh: true })); }); nudges += 1; rt.msg(`⚔️ Ataque dos guerreiros: ${prem.name}!`); }
      if (st) { st.m += nudges; rt.chip('mult', 'MULT.', 'x' + st.m); }
      await rt.drop(g);
      await pay(rt, lines(g, L25, SY), st ? st.m : 1);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'cemiterioguerreiros', name: 'Cemitério dos Guerreiros', studio: STUDIO, art: 'headstone', mascot: 'beardman',
      tag: 'Lápides xNudge · mult. sem teto', colors: ['#dc2626', '#1c1917'], bg: 'linear-gradient(180deg,#450a0a,#1c1917 60%,#0c0a09)',
      cols: 6, rows: 3, maxWin: 9797, vol: 5, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Warrior Graveyard" (Nolimit City).', hello: 'As lápides empurram e multiplicam!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 6, rows: 3, list: L25, text: '25 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 4), SY, 'Multiplicadores de coringa na mesma linha se multiplicam.')],
      highlights: ['🪦 6×3 com 25 linhas', '⬇️ <b>Lápides xNudge</b> (rolos 2 a 5) empurram até cobrir o rolo com <b>+1 por empurrão</b>', '⚔️ <b>Ataque dos Guerreiros:</b> 3 premium iguais são empurrados para encher os rolos', '💀 3/4/5 bônus = <b>8/10/12 Giros do Cemitério</b>: cada empurrão soma no multiplicador global, <b>sem teto</b>; com 5 bônus, as lápides grudam (<b>Giros da Morte</b>)', 'Prêmio máximo: <b>9.797x</b>'],
      how: '<p>Grade 6×3 com 25 linhas. As lápides são coringas altos que se empurram para dentro do rolo, ganhando +1 por casa.</p>',
      features: '<p>💀 Nas rodadas grátis, cada empurrão de lápide ou ataque dos guerreiros soma +1 num multiplicador global que vale para todos os ganhos e não zera. Com <b>5 bônus</b>, além disso, os rolos de lápide ficam presos.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const st = { m: 1, sticky: sc >= 5 ? new Map() : null }; await rt.fsLoop({ 3: 8, 4: 10 }[sc] || 12, async () => { await play(rt, make('fw'), st); }, { title: st.sticky ? 'GIROS DA MORTE' : 'GIROS DO CEMITÉRIO', sub: 'Multiplicador global sem teto' }); rt.chip('mult', null); },
    }));
  })();

  /* 27. Buraco de Fogo 2 — a mina desaba e abre linhas */
  (() => {
    const SY = msyms([['anao', 'man', 'Mineiro'], ['picareta', 'pick', 'Picareta'], ['lanterna', 'lantern', 'Lanterna'], ['carrinho', 'minecart', 'Carrinho']]);
    const BOMB = { id: 'w', img: 'firecracker', name: 'Coringa xBomb', wild: true, bomb: true, w: 0.3, fw: 0.5 };
    const SC = { id: 'sc', img: 'chest', name: 'Baú', sc: true, w: 0.55, fw: 0.3 };
    const draw = pool([...SY, BOMB, SC]);
    const cell = (c, wk) => { const x = draw(c, wk); if (x.bomb) mult(x, wm([{ m: 1, w: 40 }, { m: 2, w: 30 }, { m: 3, w: 15 }, { m: 5, w: 10 }, { m: 10, w: 4 }, { m: 25, w: 1 }])); if (x.m === 1) { delete x.m; delete x.t; } return x; };
    const make = (rows, wk) => grid(Array(6).fill(6), (c, r) => (r < 6 - rows ? LOCK('rock') : cell(c, wk)));
    async function play(rt, g, wk, open) {
      let rows = open;
      await rt.spin(g, { tease: false });
      await tumble(rt, g, {
        draw: c => cell(c, wk),
        evaluate: gg => ways(gg, SY, { wildMult: 'add' }),
        keep: x => x.id === 'lock',
        onStep: async (s, gg) => {
          // cada desabamento abre mais uma linha da mina (até 6)
          if (rows < 6) { rows++; const r = 6 - rows; gg.forEach((col, c) => { if (col[r].id === 'lock') col[r] = { ...cell(c, wk), fresh: true }; }); rt.msg(`⛏️ A mina desabou: ${rows} linhas`); }
        },
      });
      return { sc: count(g, x => x.sc), rows };
    }
    App.register(K.create({
      id: 'buracofogo2', name: 'Buraco de Fogo 2', studio: STUDIO, art: 'firecracker', mascot: 'pick',
      tag: 'Mina desaba · até 46.656 caminhos', colors: ['#ea580c', '#44403c'], bg: 'linear-gradient(180deg,#292524,#57534e 50%,#7c2d12)',
      cols: 6, rows: 6, maxWin: 65000, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Fire in the Hole 2" (Nolimit City).', hello: 'Cada desabamento abre a mina!',
      symbols: [...SY, BOMB, SC], extraSprites: ['rock'],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'De 729 (3 linhas) até 46.656 caminhos (6 linhas).')],
      highlights: ['⛏️ 6 rolos que começam com <b>3 linhas abertas</b>; cada cascata <b>desaba a mina</b> e abre mais uma, até 6 (46.656 caminhos)', '🧨 <b>Coringas xBomb</b> com multiplicador de até x25', '📦 3+ baús = <b>Vagão da Sorte</b>: 8 giros em que as linhas que desabam, <b>não fecham</b> mais', 'Prêmio máximo: <b>65.000x</b>'],
      how: '<p>6 rolos com 6 linhas, das quais só as 3 de baixo começam abertas. Ganhos pagam por caminho e somem (cascata); a cada cascata uma nova linha de pedra é aberta.</p>',
      features: '<p>📦 <b>3 ou mais baús</b> dão <b>8 rodadas grátis</b> no Vagão da Sorte: toda linha que desabar fica aberta até o fim e os coringas xBomb caem mais. 3 baús nelas dão +4.</p>',
      make: () => make(3, 'w'),
      async spin(rt) { const g = make(3, 'w'); const r = await play(rt, g, 'w', 3); if (r.sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { let open = 3; await rt.fsLoop(8, async api => { const r = await play(rt, make(open, 'fw'), 'fw', open); open = r.rows; if (r.sc >= 3) api.add(4); }, { title: 'VAGÃO DA SORTE', sub: 'As linhas abertas ficam abertas' }); },
    }));
  })();

  /* 28. Sangue e Sombra 2 — barra do ritual */
  (() => {
    const SY = msyms([['lobo', 'wolf', 'Lobo'], ['serpente', 'snake', 'Serpente'], ['corvo', 'crow', 'Corvo'], ['vela', 'candle', 'Vela']]);
    const WILD = { id: 'w', img: 'eye', name: 'Coringa', wild: true, w: 0.4 };
    const SC = { id: 'sc', img: 'church', name: 'Igreja', sc: true, w: 0.36, fw: 0.3 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([5, 5, 5, 5, 5], c => draw(c, wk));
    const LV = [0, 20, 50, 100];
    async function play(rt, g, wk, st) {
      const S2 = st || { pts: 0, sticky: new Set() };
      const lvl = () => LV.filter(v => S2.pts >= v).length - 1;
      S2.sticky.forEach(k => { const [c, r] = unkey(k); g[c][r] = { ...WILD, c: 'sticky' }; });
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c, wk), keep: x => x.wild && x.c === 'sticky',
        evaluate: gg => { const res = ways(gg, SY); res.wins.forEach(w => { if (SY.indexOf(w.sym) < 4) S2.pts += w.n; }); return res; },
        mult: () => [1, 1, 1.5, 2][lvl()],
        onStep: async () => { const L = lvl(); if (L >= 1 && S2.sticky.size < L) { const k = key(RNG.int(0, 4), RNG.int(0, 4)); S2.sticky.add(k); } rt.chip('rit', 'RITUAL', `Nv ${L} · ${S2.pts}`); },
      });
      if (!st) rt.chip('rit', null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'sanguesombra2', name: 'Sangue e Sombra 2', studio: STUDIO, art: 'church', mascot: 'wolf',
      tag: 'Barra do ritual · coringas colantes', colors: ['#7f1d1d', '#111827'], bg: 'radial-gradient(circle at 50% 20%,#450a0a,#020617 70%)',
      cols: 5, rows: 5, maxWin: 16161, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Blood & Shadow 2" (Nolimit City).', hello: 'Complete o ritual...',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×5 = 3.125 caminhos, com cascata.')],
      highlights: ['🕯️ 5×5 com 3.125 caminhos e cascata', '🩸 <b>Barra do Ritual:</b> ganhos com os símbolos altos somam pontos; nos níveis 1, 2 e 3 aparecem <b>coringas colantes</b> e o multiplicador vai a <b>x1,5</b> e <b>x2</b>', '⛪ 3+ igrejas = <b>10 Giros da Vela</b> em que a barra do ritual <b>não zera</b>', 'Prêmio máximo: <b>16.161x</b>'],
      how: '<p>Grade 5×5 que paga por caminhos, com cascata. Cada símbolo alto vencedor soma pontos na barra do ritual durante o giro: nível 1 (20 pontos) cria coringas colantes; nível 2 (50) multiplica os ganhos por 1,5; nível 3 (100) dobra.</p>',
      features: '<p>⛪ <b>3 ou mais igrejas</b> dão <b>10 rodadas grátis</b> em que os pontos do ritual e os coringas colantes ficam de um giro para o outro. 3 igrejas nelas dão +5.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { pts: 0, sticky: new Set() }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 'fw', st) >= 3) api.add(5); }, { title: 'GIROS DA VELA', sub: 'O ritual não zera' }); rt.chip('rit', null); },
    }));
  })();

  /* 29. Lápide: Sem Piedade — quatro modos de rodadas grátis */
  (() => {
    const SY = [S('pistoleiro', 'cowboy', 'Pistoleiro', [1, 3, 10], 3), S('xerife', 'police', 'Xerife', [0.8, 2.5, 8], 4), S('revolver', 'pistol', 'Revólver', [0.6, 2, 6], 4), S('ferradura', 'horseshoe', 'Ferradura', [0.5, 1.5, 5], 5), ...R([[0.15, 0.4, 1.2], [0.15, 0.4, 1.2], [0.1, 0.3, 1], [0.1, 0.3, 1]])];
    const WILD = { id: 'w', img: 'cowboy', name: 'Fora da lei', wild: true, reels: [1, 2, 3], w: 0.45, fw: 0.6 };
    const SC = { id: 'sc', img: 'moneybag', name: '$', sc: true, reels: [1, 2, 3], w: 1.8, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([2, 3, 3, 3, 2], c => draw(c, wk));
    const MODES = { g: { n: 'Pistoleiro', d: '10 giros · coringas +1' }, j: { n: 'Justiça', d: '8 giros · coringas colantes' }, b: { n: 'Recompensa', d: '8 giros · multiplicador cresce' }, a: { n: 'Ação', d: '6 giros · tudo junto' } };
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      if (st && st.sticky) st.sticky.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      for (let c = 1; c <= 3; c++) if (g[c].some(x => x.wild && !x.m)) { const m = nudgeReel(g, c, WILD, st ? st.add : 0); if (st && st.sticky) st.sticky.set(c, m); }
      await rt.drop(g);
      await pay(rt, ways(g, SY), st && st.grow ? st.m : 1);
      if (st && st.grow) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'lapidesempiedade', name: 'Lápide: Sem Piedade', studio: STUDIO, art: 'pistol', mascot: 'cowboy',
      tag: 'xNudge · 4 modos de bônus · 16.480x', colors: ['#b45309', '#0c0a09'], bg: 'linear-gradient(180deg,#9a3412,#292524 60%,#0c0a09)',
      cols: 5, rows: 3, maxWin: 16480, vol: 5, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Tombstone: No Mercy" (Nolimit City).', hello: 'Sem piedade no faroeste!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 2-3-3-3-2 = 108 caminhos. Multiplicadores no caminho se multiplicam.')],
      highlights: ['🤠 2-3-3-3-2 com 108 caminhos', '⬇️ <b>Foras da lei xNudge</b> (rolos 2 a 4): +1 por empurrão; vários se multiplicam', '💰 3 $ = escolha entre <b>Pistoleiro</b>, <b>Justiça</b>, <b>Recompensa</b> ou <b>Ação</b>', 'Prêmio máximo: <b>16.480x</b>'],
      how: '<p>Rolos 2-3-3-3-2 com 108 caminhos. O fora da lei empurra até cobrir o rolo e soma +1 por empurrão.</p>',
      features: `<p>💰 <b>3 símbolos $</b> abrem a escolha:</p><table class="paytable"><tr class="si-head"><td>Bônus</td><td>Detalhe</td></tr>${Object.values(MODES).map(m => `<tr><td>${m.n}</td><td>${m.d}</td></tr>`).join('')}</table>`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const mode = await rt.choose('ESCOLHA O DUELO', Object.entries(MODES).map(([id, m]) => ({ id, img: 'cowboy', label: m.n, desc: m.d })));
        const st = { add: mode === 'g' || mode === 'a' ? 1 : 0, sticky: mode === 'j' || mode === 'a' ? new Map() : null, grow: mode === 'b' || mode === 'a', m: 1 };
        await rt.fsLoop({ g: 10, j: 8, b: 8, a: 6 }[mode], async () => { await play(rt, make('fw'), st); }, { title: MODES[mode].n.toUpperCase(), sub: MODES[mode].d });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 30. Cela xWays 2 — células reforçadas e divisões */
  (() => {
    const SY = msyms([['prisioneiro', 'man', 'Prisioneiro'], ['guarda', 'police', 'Guarda'], ['cao', 'guidedog', 'Cão de guarda'], ['algema', 'link', 'Algemas']]);
    const WILD = { id: 'w', img: 'oldkey', name: 'Coringa', wild: true, w: 0.45 };
    const SC = { id: 'sc', img: 'policelight', name: 'Alarme', sc: true, w: 0.7, fw: 0.4 };
    const draw = pool([...SY, WILD, SC]);
    /** 5 rolos de 6: a casa de cima e a de baixo são células reforçadas (trancadas) */
    const make = wk => grid(Array(5).fill(6), (c, r) => (r === 0 || r === 5 ? LOCK() : draw(c, wk)));
    async function play(rt, g, lit) {
      await rt.spin(g, { tease: !lit });
      // um scatter (ou o bônus) abre células reforçadas
      const open = count(g, x => x.sc) + (lit || 0);
      for (let i = 0; i < open; i++) {
        const c = RNG.int(0, 4), r = RNG.pick([0, 5]);
        if (g[c][r].id !== 'lock') continue;
        const e = RNG.weighted(ENH).e || 'high';
        if (e === 'wild') g[c] = g[c].map(x => (x.id === 'lock' || x.sc ? x : { ...WILD, c: 'gold', fresh: true }));
        if (e === 'xways') { g[c][r] = { id: 'xw', xw: true, noPay: true, img: 'question' }; xways(g, SY, rt); }
        if (e === 'split') { for (let rr = 1; rr <= 4; rr++) if (!g[c][rr].sc) xsplit(g, c, rr); rt.msg('🔪 Divisão: o rolo conta em dobro!'); }
        if (e === 'high') g[c][r] = { ...RNG.pick(SY.slice(0, 4)), fresh: true };
      }
      await rt.drop(g);
      await pay(rt, ways(g, SY));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'celaxways2', name: 'Cela xWays 2', studio: STUDIO, art: 'oldkey', mascot: 'police',
      tag: 'Células reforçadas · 200.000x', colors: ['#475569', '#f97316'], bg: 'linear-gradient(180deg,#334155,#1e293b 60%,#0f172a)',
      cols: 5, rows: 6, maxWin: 200000, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "San Quentin 2: Death Row" (Nolimit City) — sem cenas violentas.', hello: 'Abra as células reforçadas!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 (1.024 caminhos), crescendo com células abertas, xWays e divisões.')],
      highlights: ['🔒 5×4 com 1.024 caminhos e <b>células reforçadas</b> acima e abaixo de cada rolo', '🚨 Cada alarme abre uma célula, que revela <b>rolo coringa</b>, <b>xWays</b>, <b>divisão do rolo</b> (conta em dobro) ou um símbolo alto', '3+ alarmes = <b>10 giros</b> com 2 células abertas garantidas em cada giro', 'Prêmio máximo: <b>200.000x</b>'],
      how: '<p>Grade 5×4 que paga por caminhos, com uma célula trancada acima e outra abaixo de cada rolo. Alarmes abrem células aleatórias; o que sai delas pode transformar o rolo inteiro em coringa, revelar xWays ou dividir o rolo (cada símbolo conta duas vezes).</p>',
      features: '<p>🚨 <b>3 ou mais alarmes</b> dão <b>10 rodadas grátis</b> com duas células reforçadas abertas garantidas por giro (3 alarmes nelas dão +5).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 0) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), 2) >= 3) api.add(5); }, { title: 'GIROS DA ALA MÁXIMA', sub: '2 células abertas por giro' }); },
    }));
  })();

  /* 31. Cobrinha 2000 — a cobra coringa anda pela tela */
  (() => {
    const SY = msyms([['celular', 'mobile', 'Celular tijolão'], ['disquete', 'floppydisk', 'Disquete'], ['fita', 'videocassette', 'Fita VHS'], ['pager', 'pager', 'Pager']]);
    const SNAKE = { id: 'w', img: 'snake', name: 'Cobrinha coringa', wild: true, snake: true, w: 0.25, fw: 0.7 };
    const XW = { id: 'xw', img: 'floppydisk', name: 'xWays', xw: true, noPay: true, w: 0.35 };
    const SC = { id: 'sc', img: 'joystick', name: 'Bônus', sc: true, w: 0.6, fw: 0.3 };
    const draw = pool([...SY, SNAKE, XW, SC]);
    const make = wk => grid([5, 5, 5, 5, 5], c => draw(c, wk));
    const slither = (g, c, r, steps) => { const path = [[c, r]]; let dir = RNG.pick([[1, 0], [0, 1], [0, -1], [-1, 0]]); for (let i = 0; i < steps; i++) { if (RNG.float() < 0.4) dir = RNG.pick([[1, 0], [0, 1], [0, -1], [-1, 0]].filter(d => d[0] !== -dir[0] || d[1] !== -dir[1])); const [a, b] = [path[path.length - 1][0] + dir[0], path[path.length - 1][1] + dir[1]]; if (!g[a] || !g[a][b]) break; path.push([a, b]); } path.forEach(([a, b]) => { if (!g[a][b].sc) g[a][b] = { ...SNAKE, c: 'gold', fresh: true }; }); return path.length; };
    async function play(rt, g, fs) {
      await rt.spin(g, { tease: !fs });
      xways(g, SY, rt);
      cells(g, x => x.snake && !x.c).forEach(([c, r]) => { const n = slither(g, c, r, RNG.int(fs ? 3 : 1, fs ? 9 : 5)); rt.msg(`🐍 A cobrinha andou ${n} casas!`); });
      await rt.drop(g);
      await pay(rt, ways(g, SY));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'cobrinha2000', name: 'Cobrinha 2000', studio: STUDIO, art: 'mobile', mascot: 'snake',
      tag: 'Cobra coringa que anda · xWays', colors: ['#84cc16', '#1f2937'], bg: 'linear-gradient(180deg,#a3e635,#4d7c0f 50%,#1a2e05)',
      cols: 5, rows: 5, maxWin: 8110, vol: 5, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Brick Snake 2000" (Nolimit City) — sem cenas violentas.', hello: 'Lembra do jogo da cobrinha?',
      symbols: [...SY, SNAKE, XW, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×5 = 3.125 caminhos (mais com xWays).')],
      highlights: ['📱 5×5 com 3.125 caminhos, tema retrô dos anos 2000', '🐍 A <b>cobrinha coringa</b> anda de 1 a 5 casas, deixando um rastro de coringas', '💾 <b>xWays</b> no disquete: símbolos com 2 a 4 cópias', '🕹️ 3+ bônus = <b>10 giros</b> com a cobrinha mais frequente e andando de 3 a 9 casas', 'Prêmio máximo: <b>8.110x</b>'],
      how: '<p>Grade 5×5 que paga por caminhos. Quando a cobrinha aparece, ela anda em qualquer direção (menos para trás) e todas as casas por onde passa viram coringa.</p>',
      features: '<p>🕹️ <b>3 ou mais bônus</b> dão <b>10 rodadas grátis</b> em que a cobrinha aparece mais e anda de 3 a 9 casas (3 bônus dão +5).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, false) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), true) >= 3) api.add(5); }, { title: 'FASE BÔNUS', sub: 'Cobrinha turbinada' }); },
    }));
  })();

  /* 32. Das Nove às Cinco — a sátira do escritório */
  (() => {
    const SY = msyms([['chefe', 'manoffice', 'Chefe'], ['estagiario', 'man', 'Estagiário'], ['cafe', 'teacup', 'Café'], ['grampeador', 'paperclip', 'Grampeador']]);
    const WILD = { id: 'w', img: 'briefcase', name: 'Coringa xNudge', wild: true, reels: [1, 2, 3], w: 0.35, fw: 0.5 };
    const XW = { id: 'xw', img: 'question', name: 'xWays', xw: true, noPay: true, w: 0.3 };
    const SC = { id: 'sc', img: 'alarm', name: 'Relógio de ponto', sc: true, w: 0.65, fw: 0 };
    const UP = { id: 'demissao', img: 'outbox', name: 'Demissão (+1)', up: 1, noPay: true, w: 0, fw: 0.9 };
    const DN = { id: 'processo', img: 'scales', name: 'Processo (−1)', up: -1, noPay: true, w: 0, fw: 0.15 };
    const OT = { id: 'horaextra', img: 'hourglassflow', name: 'Hora extra (+1 giro)', ot: true, noPay: true, w: 0, fw: 0.2 };
    const draw = pool([...SY, WILD, XW, SC, UP, DN, OT]);
    const make = wk => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      xways(g, SY, rt);
      for (let c = 1; c <= 3; c++) if (g[c].some(x => x.wild && !x.m)) nudgeReel(g, c, WILD);
      if (st) { cells(g, x => x.up || x.ot).forEach(([c, r]) => { const x = g[c][r]; if (x.up) st.m = Math.max(1, st.m + x.up); if (x.ot) st.api.add(1); g[c][r] = { ...RNG.pick(SY.slice(4)) }; }); rt.chip('mult', 'MULT.', 'x' + st.m); }
      await rt.drop(g);
      await pay(rt, ways(g, SY), st ? st.m : 1);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'novecinco', name: 'Das Nove às Cinco', studio: STUDIO, art: 'briefcase', mascot: 'manoffice',
      tag: 'Escritório dos anos 90 · xNudge', colors: ['#64748b', '#f59e0b'], bg: 'linear-gradient(180deg,#e2e8f0,#94a3b8 50%,#334155)',
      cols: 5, rows: 4, maxWin: 9217, vol: 5, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Nine to Five" (Nolimit City).', hello: 'Mais um dia no escritório...',
      symbols: [...SY, WILD, XW, SC, UP, DN, OT],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×4 = 1.024 caminhos.')],
      highlights: ['💼 5×4 com 1.024 caminhos', '⬇️ <b>Coringa xNudge</b> (rolos 2 a 4): +1 por empurrão; ❓ <b>xWays</b> com 2 a 4 cópias', '⏰ 3 relógios de ponto = <b>Gerência Média</b>: 10 giros em que <b>demissões</b> sobem o multiplicador, <b>processos</b> baixam e <b>horas extras</b> dão giros', 'Prêmio máximo: <b>9.217x</b>'],
      how: '<p>Grade 5×4 que paga por caminhos, com xNudge e xWays.</p>',
      features: '<p>⏰ <b>3 relógios de ponto</b> dão <b>10 rodadas grátis</b>. Caem símbolos especiais: demissão (+1 no multiplicador), processo (−1, mínimo x1) e hora extra (+1 giro). O multiplicador vale para todos os ganhos e não zera.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { m: 1 }; await rt.fsLoop(10, async api => { st.api = api; await play(rt, make('fw'), st); }, { title: 'GERÊNCIA MÉDIA', sub: 'Demissões sobem o multiplicador' }); rt.chip('mult', null); },
    }));
  })();

  /* 33. Bolas de Natal — Giros do Espírito */
  (() => {
    const SY = msyms([['papainoel', 'santa', 'Papai Noel'], ['rena', 'deer', 'Rena'], ['boneco', 'snowman', 'Boneco de neve'], ['presente', 'gift', 'Presente']]);
    const WILD = { id: 'w', img: 'christmastree', name: 'Coringa', wild: true, w: 0.4 };
    const SPLIT = { id: 'xs', img: 'scissors', name: 'Coringa xSplit', wild: true, split: true, w: 0.12, fw: 0.2 };
    const XW = { id: 'xw', img: 'question', name: 'xWays', xw: true, noPay: true, w: 0.3 };
    const SC = { id: 'sc', img: 'bell2', name: 'Sino', sc: true, w: 0.62, fw: 0.3 };
    const draw = pool([...SY, WILD, SPLIT, XW, SC]);
    const make = wk => grid([3, 3, 4, 4, 5, 5], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      xways(g, SY, rt);
      cells(g, x => x.split).forEach(([c, r]) => { g.forEach((col, a) => { if (a !== c && col[r] && !col[r].wild && !col[r].sc) xsplit(g, a, r); }); rt.msg('✂️ xSplit: a linha conta em dobro!'); });
      if (st) g.forEach(col => col.forEach(x => { const m = st.m[x.id]; if (m > 1) mult(x, m); }));
      await rt.drop(g);
      await pay(rt, ways(g, SY));
      if (st) { (st.mode === 1 ? [st.prem] : SY.slice(0, 4).map(s => s.id)).forEach(id => { if (g.flat().some(x => x.id === id)) st.m[id] = Math.min(st.mode === 3 ? 50 : 25, (st.m[id] || 1) + (st.mode === 3 ? 2 : 1)); }); }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'bolasnatal', name: 'Bolas de Natal', studio: STUDIO, art: 'christmastree', mascot: 'santa',
      tag: 'Natal noir · Giros do Espírito', colors: ['#dc2626', '#111827'], bg: 'linear-gradient(180deg,#111827,#374151 50%,#7f1d1d)',
      cols: 6, rows: 5, maxWin: 12250, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Jingle Balls" (Nolimit City) — em versão natalina leve.', hello: 'Um Natal em preto e branco...',
      symbols: [...SY, WILD, SPLIT, XW, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Rolos 3-3-4-4-5-5 (2.880 caminhos), mais com xWays e xSplit.')],
      highlights: ['🎄 Rolos 3-3-4-4-5-5 com <b>xWays</b> e <b>coringa xSplit</b> (divide a linha dele)', '🔔 3 sinos = <b>Giros do Espírito</b>: um símbolo alto ganha +1 no multiplicador sempre que aparece', '4 sinos = <b>Todos a Bordo</b>: todos os altos crescem; 5 = <b>Alegria em Dobro</b>: crescem de 2 em 2', 'Prêmio máximo: <b>12.250x</b>'],
      how: '<p>Rolos 3-3-4-4-5-5 que pagam por caminhos. O coringa xSplit divide todos os símbolos da linha dele, que passam a contar em dobro.</p>',
      features: '<p>🔔 <b>3, 4 ou 5 sinos</b> dão 10 rodadas grátis: <b>Giros do Espírito</b> (um símbolo alto sorteado sobe +1 a cada aparição), <b>Todos a Bordo</b> (os quatro altos sobem) ou <b>Alegria em Dobro</b> (sobem +2, até x50).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, null); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const mode = Math.min(3, sc - 2), st = { mode, m: {}, prem: RNG.pick(SY.slice(0, 4)).id }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), st) >= 3) api.add(3); }, { title: ['GIROS DO ESPÍRITO', 'TODOS A BORDO', 'ALEGRIA EM DOBRO'][mode - 1], sub: 'Multiplicadores natalinos' }); },
    }));
  })();

  /* 34. Terra da Liberdade — esteira de modificadores e a enchente */
  (() => {
    const SY = msyms([['trailer', 'camping', 'Trailer'], ['caminhonete', 'pickuptruck', 'Caminhonete'], ['churrasqueira', 'cutofmeat', 'Churrasco'], ['bone', 'cap', 'Boné']]);
    const WILD = { id: 'w', img: 'eagle', name: 'Coringa', wild: true, w: 0.45 };
    const SC = { id: 'sc', img: 'wave', name: 'Onda', sc: true, w: 0.9, fw: 0.3 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([4, 4, 4, 4], c => draw(c, wk));
    const MODS = [{ k: 'keg', w: 30 }, { k: 'bottle', w: 30 }, { k: 'split', w: 25 }, { k: 'bear', w: 15 }];
    async function play(rt, g, water) {
      await rt.spin(g, { tease: !water });
      let m = 1;
      if (RNG.float() < (water ? 0.4 : 0.12)) {
        const k = RNG.weighted(MODS).k;
        if (k === 'keg') { for (let i = 0; i < RNG.int(2, 4); i++) g[RNG.int(0, 3)][RNG.int(0, 3)] = { ...WILD, c: 'gold', fresh: true }; rt.msg('🛢️ Barril de energia: coringas!'); }
        if (k === 'bottle') { m = RNG.pick([2, 3, 5]); rt.msg(`🍾 Garrafas: x${m}!`); }
        if (k === 'split') { const c = RNG.int(0, 3); g[c].forEach((x, r) => { if (!x.wild && !x.sc) xsplit(g, c, r); }); rt.msg('✂️ Sr. Divisão partiu um rolo!'); }
        if (k === 'bear') { const s = RNG.pick(SY.slice(0, 4)); RNG.shuffle([0, 1, 2, 3]).slice(0, 2).forEach(c => { g[c] = g[c].map(() => ({ ...s, c: 'gold', fresh: true })); }); rt.msg(`🐻 O urso empilhou ${s.name}!`); }
      }
      // na enchente, metade de baixo da grade fica embaixo d'água e conta em dobro
      if (water) g.forEach((col, c) => col.forEach((x, r) => { if (r >= 2 && !x.wild && !x.sc) xsplit(g, c, r); }));
      await rt.drop(g);
      await pay(rt, ways(g, SY), m);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'terraliberdade', name: 'Terra da Liberdade', studio: STUDIO, art: 'pickuptruck', mascot: 'eagle',
      tag: 'Esteira de modificadores · enchente', colors: ['#1d4ed8', '#dc2626'], bg: 'linear-gradient(180deg,#bfdbfe,#60a5fa 40%,#1e3a8a)',
      cols: 4, rows: 4, maxWin: 57000, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Land of the Free" (Nolimit City) — numa versão bem-humorada de acampamento.', hello: 'Bem-vindo ao acampamento!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 2, ' rolos'), SY, '4×4 = 256 caminhos (mais com divisões).')],
      highlights: ['🚚 4×4 com 256 caminhos', '🎰 <b>Esteira de modificadores:</b> barril (coringas), garrafas (x2 a x5), Sr. Divisão (rolo conta em dobro) e urso (pilhas)', '🌊 3/4/5 ondas = <b>12/15/20 Giros da Enchente</b>: a metade de baixo fica embaixo d\'água e <b>todo símbolo nela conta em dobro</b>', 'Prêmio máximo: <b>57.000x</b>'],
      how: '<p>Grade 4×4 que paga por caminhos. De vez em quando a esteira entrega um modificador antes do pagamento.</p>',
      features: '<p>🌊 <b>3, 4 ou 5 ondas</b> dão <b>12, 15 ou 20 rodadas grátis</b>. Metade da grade fica alagada: os símbolos das duas linhas de baixo são divididos (contam duas vezes) e os modificadores aparecem bem mais.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, false); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { await rt.fsLoop({ 3: 12, 4: 15 }[sc] || 20, async api => { if (await play(rt, make('fw'), true) >= 3) api.add(4); }, { title: 'GIROS DA ENCHENTE', sub: 'Metade de baixo conta em dobro' }); },
    }));
  })();

  /* 35. Dia D — modificadores de batalha e o coringa supremo */
  (() => {
    const SY = msyms([['soldado', 'militaryhelmet', 'Capacete'], ['aviao', 'airplane', 'Avião'], ['navio', 'ship', 'Navio'], ['medalha', 'militarymedal', 'Medalha']]);
    const WILD = { id: 'w', img: 'star', name: 'Coringa', wild: true, w: 0.45 };
    const SUP = { id: 'sup', img: 'glowstar', name: 'Coringa supremo', wild: true, w: 0.03, fw: 0.08 };
    const SC = { id: 'sc', img: 'worldmap', name: 'Mapa', sc: true, w: 0.7, fw: 0 };
    const draw = pool([...SY, WILD, SUP, SC]);
    const cell = (c, wk) => { const x = draw(c, wk); if (x.id === 'sup') mult(x, wm(BIG) * 2); return x; };
    const make = wk => grid([3, 4, 5, 4, 3], c => cell(c, wk));
    const MODS = ['avião', 'caça', 'tanque', 'artilharia'];
    async function mod(rt, g, k) {
      if (k === 'avião') { for (let i = 0; i < RNG.int(3, 6); i++) { const c = RNG.int(0, 4); g[c][RNG.int(0, g[c].length - 1)] = { ...WILD, c: 'gold', fresh: true }; } }
      if (k === 'caça') { const c = RNG.int(1, 3); g[c].forEach((x, r) => { if (!x.wild && !x.sc) xsplit(g, c, r); }); }
      if (k === 'tanque') { const c = RNG.int(1, 3); g[c] = g[c].map(() => ({ ...WILD, c: 'gold', fresh: true })); }
      rt.msg(`🎖️ Modificador: ${k}!`);
      return k === 'artilharia' ? RNG.pick([2, 3, 5]) : 1;
    }
    async function play(rt, g, n) {
      await rt.spin(g, { tease: !n });
      let m = 1;
      const k = n || (RNG.float() < 0.1 ? 1 : 0);
      for (const mm of RNG.shuffle(MODS.slice()).slice(0, k)) m *= await mod(rt, g, mm);
      await rt.drop(g);
      await pay(rt, ways(g, SY, { wildMult: 'add' }), m);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'diad', name: 'Dia D', studio: STUDIO, art: 'airplane', mascot: 'militaryhelmet',
      tag: 'Modificadores · coringa supremo', colors: ['#4d7c0f', '#78716c'], bg: 'linear-gradient(180deg,#a8a29e,#57534e 50%,#365314)',
      cols: 5, rows: 5, maxWin: 55555, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "D-Day" (Nolimit City) — tema histórico sem cenas de violência.', hello: 'Rumo à praia!',
      symbols: [...SY, WILD, SUP, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 3-4-5-4-3 = 720 caminhos.')],
      highlights: ['🎖️ Rolos 3-4-5-4-3 com 720 caminhos', '✈️ Quatro <b>modificadores</b> surpresa: avião (coringas), caça (divide um rolo), tanque (rolo coringa) e artilharia (x2 a x5)', '⭐ <b>Coringa supremo</b> com multiplicador de até x200', '🗺️ 3/4/5 mapas = <b>Netuno / Invasão / Overlord</b>: 10 giros com 1, 2 ou 3 modificadores garantidos por giro', 'Prêmio máximo: <b>55.555x</b>'],
      how: '<p>Rolos 3-4-5-4-3 que pagam por caminhos. Em qualquer giro um modificador pode entrar em ação.</p>',
      features: '<p>🗺️ <b>3, 4 ou 5 mapas</b> dão <b>10 rodadas grátis</b> com <b>1, 2 ou 3 modificadores garantidos</b> em todo giro, e o coringa supremo aparece mais.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, 0); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { const n = Math.min(3, sc - 2); await rt.fsLoop(10, async () => { await play(rt, make('fw'), n); }, { title: ['OPERAÇÃO NETUNO', 'INVASÃO', 'OVERLORD'][n - 1], sub: `${n} modificador${n > 1 ? 'es' : ''} por giro` }); },
    }));
  })();

  /* 36. Cidade Fantasma R.I.P. — rolo final x2 e xRIP */
  (() => {
    const SY = msyms([['pistoleiro', 'cowboy', 'Pistoleiro'], ['cavalo', 'horse', 'Cavalo'], ['garrafa', 'bottle', 'Garrafa'], ['bota', 'boot', 'Bota']]);
    const WILD = { id: 'w', img: 'skull', name: 'Coringa xNudge', wild: true, reels: [1, 2, 3], w: 0.22, fw: 1.3 };
    const SC = { id: 'sc', img: 'snake', name: 'Cascavel', sc: true, w: 0.8, fw: 0 };
    const SC2 = { id: 'sc2', img: 'motorcycle', name: 'Moto', sc2: true, noPay: true, w: 0.35, fw: 0 };
    const draw = pool([...SY, WILD, SC, SC2]);
    const make = wk => grid([3, 4, 4, 4, 3], c => draw(c, wk));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      if (st && st.sticky) st.sticky.forEach((m, c) => { g[c] = g[c].map(() => mult({ ...WILD, c: 'sticky' }, m)); });
      for (let c = 1; c <= 3; c++) if (g[c].some(x => x.wild && !x.m)) { const m = nudgeReel(g, c, WILD, st ? st.add : 0); if (st && st.sticky) st.sticky.set(c, m); }
      // símbolos no último rolo valem x2
      g[4].forEach(x => { if (x.pays || x.wild) { x.n = 2; x.t = x.t || '×2'; } });
      await rt.drop(g);
      const res = ways(g, SY, { wildMult: 'add' });
      // xRIP: no jogo base, ganhos menores que 1x a aposta não são pagos
      if (!st && res.total * 1 < 0.6) { if (res.total) rt.msg('💀 xRIP: ganho pequeno demais, não pago'); }
      else await pay(rt, res);
      return { sc: count(g, x => x.sc), sc2: count(g, x => x.sc2) };
    }
    App.register(K.create({
      id: 'cidadefantasmarip', name: 'Cidade Fantasma R.I.P.', studio: STUDIO, art: 'skull', mascot: 'cowboy',
      tag: 'xNudge · rolo final x2 · 100.000x', colors: ['#78350f', '#020617'], bg: 'linear-gradient(180deg,#451a03,#1c1917 60%,#020617)',
      cols: 5, rows: 4, maxWin: 100000, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Deadwood R.I.P" (Nolimit City).', hello: 'Ganhos pequenos? Aqui não...',
      symbols: [...SY, WILD, SC, SC2],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 3-4-4-4-3 = 384 caminhos.')],
      highlights: ['🤠 Rolos 3-4-4-4-3 com 384 caminhos', '✖️ Todo símbolo no <b>último rolo vale x2</b>', '⬇️ <b>Coringas xNudge</b> nos rolos do meio: +1 por empurrão; vários no mesmo caminho se somam', '💀 <b>xRIP:</b> no jogo base, ganhos pequenos (abaixo de ~1x) não são pagos', '🐍 3 cascavéis = <b>8 Giros da Redenção</b>; com a moto junto = <b>10 Giros da Salvação</b> com coringas colantes', 'Prêmio máximo: <b>100.000x</b>'],
      how: '<p>Rolos 3-4-4-4-3 que pagam por caminhos. Os coringas xNudge cobrem o rolo e somam +1 por empurrão. Os símbolos do último rolo contam em dobro. Em troca, os ganhos pequenos do jogo base não são pagos (xRIP).</p>',
      features: '<p>🐍 <b>3 cascavéis</b> dão <b>8 Giros da Redenção</b> (mais coringas, e cada um começa com +1). Se cair também a 🏍️ moto, vira <b>10 Giros da Salvação</b>, em que os rolos de coringa ficam presos até o fim.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const r = await play(rt, g, null); if (r.sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sal: r.sc2 > 0 }); } },
      async bonus(rt, { sal = false } = {}) { const st = { add: 1, sticky: sal ? new Map() : null }; await rt.fsLoop(sal ? 10 : 8, async () => { await play(rt, make('fw'), st); }, { title: sal ? 'GIROS DA SALVAÇÃO' : 'GIROS DA REDENÇÃO', sub: sal ? 'Coringas colantes' : 'Coringas com +1' }); },
    }));
  })();

  /* 37. Solitário (Loner) — monitores e minijogos dos anos 80 */
  (() => {
    const SY = msyms([['nerd', 'nerd', 'Nerd'], ['fliperama', 'joystick', 'Fliperama'], ['pizza', 'pizza', 'Pizza'], ['refri', 'cupstraw', 'Refri']]);
    const WILD = { id: 'w', img: 'tv', name: 'Coringa âmbar', wild: true, w: 0.45 };
    const MON = { id: 'mon', img: 'desktop', name: 'Monitor', mon: true, noPay: true, reels: [0, 2, 4], w: 1.7 };
    const draw = pool([...SY, WILD, MON]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    App.register(K.create({
      id: 'solitario', name: 'Solitário', studio: STUDIO, art: 'joystick', mascot: 'nerd',
      tag: 'Monitores · 3 minijogos retrô', colors: ['#f59e0b', '#1e1b4b'], bg: 'linear-gradient(180deg,#1e1b4b,#312e81 50%,#451a03)',
      cols: 5, rows: 3, maxWin: 14999, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Loner" (Nolimit City).', hello: 'Sozinho no porão com o videogame...',
      symbols: [...SY, WILD, MON],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×3 = 243 caminhos.')],
      highlights: ['🕹️ 5×3 com 243 caminhos', '🟧 <b>Coringas âmbar gigantes</b> de até 3×3', '🖥️ <b>Monitores</b> nos rolos 1, 3 e 5 revelam coringas ou divisões; os 3 juntos abrem um <b>minijogo</b>', '🎯 Minijogos: <b>Acerte o Canto</b> (o logo quica somando multiplicador), <b>Tique-Taque-Bum</b> (detone o alvo) e <b>Caça aos Patos</b> (5 tiros em patos de pelúcia)', 'Prêmio máximo: <b>14.999x</b>'],
      how: '<p>Grade 5×3 com 243 caminhos. Coringas âmbar podem cair em blocos de 2×2 ou 3×3. Cada monitor revela um coringa ou divide o rolo (conta em dobro).</p>',
      features: '<p>🖥️ <b>3 monitores</b> abrem um minijogo sorteado: <b>Acerte o Canto</b> (o logo quica pela tela; cada batida soma multiplicador até acertar o canto), <b>Tique-Taque-Bum</b> (um alvo com multiplicador instantâneo) ou <b>Caça aos Patos</b> (5 tiros; patos dão multiplicadores e munição extra).</p>',
      make,
      async spin(rt) {
        const g = make();
        if (RNG.float() < 0.05) { const size = RNG.pick([2, 2, 3]), c0 = RNG.int(0, 5 - size), r0 = RNG.int(0, 3 - size); for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) g[c0 + a][r0 + b] = { ...WILD, c: 'gold' }; }
        await rt.spin(g);
        const mons = cells(g, x => x.mon);
        mons.forEach(([c, r]) => { if (RNG.float() < 0.5) g[c][r] = { ...WILD, c: 'gold', fresh: true }; else { g[c][r] = { ...RNG.pick(SY) }; g[c].forEach((x, rr) => { if (x.pays) xsplit(g, c, rr); }); } });
        await rt.drop(g);
        await pay(rt, ways(g, SY));
        if (mons.length >= 3) { await rt.wait(700); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        rt.stat('hold');
        const game = RNG.pick(['pin', 'boom', 'duck']);
        let v = 0;
        if (game === 'pin') { await rt.banner('ACERTE O CANTO', 'O logo quica somando multiplicador', 1300); let m = 0; for (let i = 0; i < 30; i++) { m += RNG.pick([1, 1, 2, 3]); rt.chip('fs', 'BATIDAS', m + 'x'); await rt.wait(120); if (RNG.float() < 0.12) break; } v = m * 3; }
        if (game === 'boom') { await rt.banner('TIQUE-TAQUE-BUM', 'Detone o alvo', 1300); v = RNG.weighted([{ v: 10, w: 40 }, { v: 25, w: 25 }, { v: 50, w: 15 }, { v: 100, w: 10 }, { v: 250, w: 6 }, { v: 1000, w: 1 }]).v; }
        if (game === 'duck') { await rt.banner('CAÇA AOS PATOS', '5 tiros nos patos de pelúcia', 1300); let shots = 5; while (shots-- > 0) { const r = RNG.float(); if (r < 0.12) shots++; else if (r < 0.7) v += RNG.pick([3, 5, 10, 15, 30]); rt.chip('fs', 'TIROS', shots); await rt.wait(200); } }
        rt.chip('fs', null);
        v *= 2;
        rt.win(v); rt.msg(`🕹️ Minijogo: ${rt.coins(v)}`); rt.fx('big'); await rt.wait(900);
      },
    }));
  })();

  /* 38. Pescaria Bizarra — células reforçadas e troféus */
  (() => {
    const SY = msyms([['peixe3olhos', 'fish', 'Peixe esquisito'], ['bagre', 'shark', 'Bagre gigante'], ['bota', 'boot', 'Bota velha'], ['lata', 'can', 'Lata']]);
    const FISHER = { id: 'w', img: 'fishingpole', name: 'Pescador coringa', wild: true, fisher: true, w: 0.3, fw: 0.55 };
    const TROPHY = { id: 'trofeu', img: 'tropicalfish', name: 'Troféu', trophy: true, noPay: true, w: 0.5, fw: 0.9 };
    const SC = { id: 'sc', img: 'tackle', name: 'Isca', sc: true, w: 0.85, fw: 0.35 };
    const draw = pool([...SY, FISHER, TROPHY, SC]);
    const TV = [{ v: 2, w: 50 }, { v: 5, w: 28 }, { v: 25, w: 14 }, { v: 250, w: 1.2 }, { v: 1000, w: 0.15 }];
    const cell = (c, wk) => { const x = draw(c, wk); if (x.trophy) { x.v = RNG.weighted(TV).v; x.t = x.v + 'x'; } return x; };
    const make = wk => grid(Array(5).fill(5), (c, r) => (r === 0 || r === 4 ? LOCK() : cell(c, wk)));
    async function play(rt, g, wk, lit, st) {
      await rt.spin(g, { tease: !st });
      const open = count(g, x => x.sc) + (lit || 0);
      for (let i = 0; i < open; i++) { const c = RNG.int(0, 4), r = RNG.pick([0, 4]); if (g[c][r].id === 'lock') g[c][r] = RNG.float() < 0.4 ? { ...FISHER, c: 'gold', fresh: true } : cell(c, wk); }
      xways(g, SY, rt);
      await rt.drop(g);
      await pay(rt, ways(g, SY));
      const f = count(g, x => x.fisher), tv = g.flat().filter(x => x.trophy).reduce((s, x) => s + x.v, 0);
      if (f && tv) { const v = tv * f * (st ? st.m : 1) / 4; rt.win(v); rt.msg(`🎣 Pescaria: troféus de ${rt.coins(tv / 4)}${f > 1 ? ` × ${f}` : ''}`); rt.fx('coin'); await rt.wait(800); if (st) { st.got += f; if (st.got >= 4) { st.got -= 4; st.m = Math.min(10, st.m * 2); st.api.add(5); rt.msg(`🎣 Nível do pescador: x${st.m} e +5 giros`); } } }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'pescariabizarra', name: 'Pescaria Bizarra', studio: STUDIO, art: 'fishingpole', mascot: 'fish',
      tag: 'Células reforçadas · troféus até 1.000x', colors: ['#65a30d', '#0f766e'], bg: 'linear-gradient(180deg,#365314,#1a2e05 50%,#134e4a)',
      cols: 5, rows: 5, maxWin: 50000, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Ugliest Catch" (Nolimit City).', hello: 'O lago é estranho, mas os prêmios são reais!',
      symbols: [...SY, FISHER, TROPHY, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×3 (243 caminhos) que cresce até 5×5 com as células abertas.')],
      highlights: ['🎣 5×3 com 243 caminhos e <b>células reforçadas</b> em cima e embaixo', '🪱 Iscas abrem células que podem trazer <b>pescadores coringa</b>, troféus ou xWays', '🐠 <b>Troféus</b> de 2x a 1.000x: um pescador coringa na tela recolhe todos', '3+ iscas = <b>10 giros</b> com 2 células abertas garantidas; a cada 4 pescadores o prêmio dobra (até x10) e +5 giros', 'Prêmio máximo: <b>50.000x</b>'],
      how: '<p>Grade 5×3 com células trancadas acima e abaixo (até 5×5). Cada isca abre uma célula. Com pescador coringa e troféus na tela, os valores são recolhidos.</p>',
      features: '<p>🪱 <b>3 ou mais iscas</b> dão <b>10 rodadas grátis</b> com duas células abertas por giro. Cada 4 pescadores coletados dobram o valor das pescarias (até x10) e dão +5 giros.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, 'w', 0, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { got: 0, m: 1 }; await rt.fsLoop(10, async api => { st.api = api; await play(rt, make('fw'), 'fw', 2, st); }, { title: 'GIROS DO PESQUEIRO', sub: '2 células abertas por giro' }); },
    }));
  })();

  /* 39. Encruzilhada — crosslink em volta do coringa central */
  (() => {
    const SY = msyms([['violao', 'guitar', 'Violão'], ['chapeu', 'tophat', 'Chapéu'], ['gaita', 'saxophone', 'Gaita'], ['dado', 'dice2', 'Dados']]);
    const WILD = { id: 'w', img: 'imp', name: 'Coringa da encruzilhada', wild: true, w: 0.3 };
    const SC = { id: 'sc', img: 'crossmark', name: 'Encruzilhada', sc: true, w: 0.5, fw: 0.35 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([5, 5, 5, 5, 5], (c, r) => (c === 2 && r === 2 && (wk === 'fw' || RNG.float() < 0.3) ? { ...WILD, c: 'gold', center: true } : draw(c, wk)));
    async function play(rt, g, st) {
      await rt.spin(g, { tease: !st });
      // símbolos vizinhos do centro ativam o multiplicador cruzado
      let m = 1 + (st ? st.m : 0);
      if (RNG.float() < 0.25) { const k = RNG.int(1, 3); m += k; rt.msg(`😈 Multiplicador cruzado +${k}`); }
      if (RNG.float() < (st ? 0.2 : 0.08)) { [[1, 2], [3, 2], [2, 1], [2, 3]].forEach(([c, r]) => { g[c][r] = { ...WILD, c: 'gold', fresh: true }; }); rt.msg('✝️ Coringas em cruz!'); }
      await rt.drop(g);
      await pay(rt, ways(g, SY), m);
      if (st) { st.m += count(g, x => x.sc); rt.chip('mult', 'MULT.', 'x' + (1 + st.m)); }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'encruzilhada', name: 'Encruzilhada', studio: STUDIO, art: 'imp', mascot: 'guitar',
      tag: 'Crosslink · Giros da Redenção', colors: ['#dc2626', '#1c1917'], bg: 'radial-gradient(circle at 50% 50%,#7f1d1d,#0c0a09 70%)',
      cols: 5, rows: 5, maxWin: 13180, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Devil\'s Crossroad" (Nolimit City) — a lenda do blues na encruzilhada.', hello: 'Um pacto na encruzilhada...',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '5×5; o centro pode virar coringa.')],
      highlights: ['🎸 5×5 em que o <b>centro da encruzilhada</b> acende como coringa', '😈 <b>Multiplicador cruzado</b> de surpresa (+1 a +3) e <b>coringas em cruz</b> em volta do centro', '✝️ 3+ encruzilhadas = <b>10 Giros da Redenção</b>: cada encruzilhada soma +1 num multiplicador que não zera', 'Prêmio máximo: <b>13.180x</b>'],
      how: '<p>Grade 5×5 que paga por caminhos. A casa central acende como coringa em cerca de 30% dos giros (sempre, nas grátis). Em alguns giros as quatro casas em cruz em volta dela também viram coringa, ou um multiplicador extra é aplicado.</p>',
      features: '<p>✝️ <b>3 ou mais encruzilhadas</b> dão <b>10 Giros da Redenção</b>. Cada encruzilhada que cair durante eles aumenta em +1 o multiplicador, que vale para todos os ganhos seguintes.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); if (await play(rt, g, null) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { m: 0 }; await rt.fsLoop(10, async () => { await play(rt, make('fw'), st); }, { title: 'GIROS DA REDENÇÃO', sub: 'Encruzilhadas sobem o multiplicador' }); rt.chip('mult', null); },
    }));
  })();

  /* 40. Perturbado — a clínica abandonada */
  (() => {
    const SY = msyms([['medico', 'healthworker', 'Médico'], ['enfermeira', 'nurse', 'Enfermeira'], ['prancheta', 'clipboard', 'Prancheta'], ['pilula', 'pill', 'Pílula']]);
    const WILD = { id: 'w', img: 'hospital', name: 'Coringa', wild: true, w: 0.4 };
    const SC = { id: 'sc', img: 'ambulance', name: 'Ambulância', sc: true, w: 0.9, fw: 0.3 };
    const draw = pool([...SY, WILD, SC]);
    /** 4-2-4-2-4: os rolos 2 e 4 têm células reforçadas em cima e embaixo */
    const make = wk => grid([4, 4, 4, 4, 4], (c, r) => ((c === 1 || c === 3) && (r === 0 || r === 3) ? LOCK() : draw(c, wk)));
    async function play(rt, g, wk, lit) {
      await rt.spin(g, { tease: !lit });
      const open = count(g, x => x.sc) + (lit || 0);
      for (let i = 0; i < open; i++) {
        const c = RNG.pick([1, 3]), r = RNG.pick([0, 3]);
        if (g[c][r].id !== 'lock') continue;
        const e = RNG.weighted(ENH).e || 'high';
        if (e === 'wild') { g[c] = g[c].map(x => (x.sc ? x : mult({ ...WILD, c: 'duel', fresh: true }, RNG.int(1, 3)))); rt.msg('🩺 Sra. Empurrão: rolo coringa!'); }
        if (e === 'xways') { g[c][r] = { id: 'xw', xw: true, noPay: true }; xways(g, SY, rt); }
        if (e === 'split') { g[c].forEach((x, rr) => { if (x.pays) xsplit(g, c, rr); }); rt.msg('✂️ Divisão: o rolo conta em dobro'); }
        if (e === 'high') g[c][r] = { ...RNG.pick(SY.slice(0, 4)), fresh: true };
      }
      await rt.drop(g);
      await pay(rt, ways(g, SY));
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'perturbado', name: 'Perturbado', studio: STUDIO, art: 'hospital', mascot: 'healthworker',
      tag: 'Células reforçadas · 54.391x', colors: ['#0f766e', '#1e293b'], bg: 'linear-gradient(180deg,#134e4a,#1e293b 60%,#020617)',
      cols: 5, rows: 4, maxWin: 54391, vol: 5, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Disturbed" (Nolimit City) — clima de suspense, sem cenas fortes.', hello: 'Algo estranho acontece nessa clínica...',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 4-2-4-2-4 = 256 caminhos (mais com as células abertas).')],
      highlights: ['🏥 Rolos 4-2-4-2-4 com 256 caminhos', '🔒 Os rolos 2 e 4 têm <b>células reforçadas</b>; cada ambulância abre uma: <b>rolo coringa</b> com multiplicador, <b>xWays</b>, <b>divisão</b> ou símbolo alto', '🚑 3/4/5 ambulâncias = <b>12/15/20 giros pré-operatórios</b> com uma célula sempre aberta', 'Prêmio máximo: <b>54.391x</b>'],
      how: '<p>Rolos 4-2-4-2-4: os rolos 2 e 4 têm duas casas trancadas cada (em cima e embaixo). Cada ambulância abre uma delas, revelando um recurso.</p>',
      features: '<p>🚑 <b>3, 4 ou 5 ambulâncias</b> dão <b>12, 15 ou 20 rodadas grátis</b>, com uma célula reforçada aberta garantida por giro (3 ambulâncias nelas dão +4).</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); const sc = await play(rt, g, 'w', 0); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) { await rt.fsLoop({ 3: 12, 4: 15 }[sc] || 20, async api => { if (await play(rt, make('fw'), 'fw', 1) >= 3) api.add(4); }, { title: 'GIROS PRÉ-OPERATÓRIOS', sub: '1 célula aberta por giro' }); },
    }));
  })();
})();
