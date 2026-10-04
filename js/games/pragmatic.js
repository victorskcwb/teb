'use strict';

/* =========================================================
   Slots no estilo Pragmatic Play (SlotKit).
   Recursos baseados nas regras públicas de cada jogo original;
   RTP calibrado por simulação (tools/calibrate.js).
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, cascade, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'pragmatic';
  const SUITS = (pays, w = [9, 9, 10, 10]) => K.ROYALS(pays, w);
  const randHeights = (n, min, max) => Array.from({ length: n }, () => RNG.int(min, max));

  /* =========================================================
     1. Casa dos Cães Megaways (The Dog House Megaways)
     ========================================================= */
  (() => {
    const SY = [
      S('rott', 'dog', 'Rottweiler', [0.5, 1, 2.5, 5], 4), S('poodle', 'poodle', 'Poodle', [0.4, 0.8, 2, 4], 5),
      S('osso', 'bone', 'Osso', [0.3, 0.6, 1.5, 3], 6), S('bola', 'tennis', 'Bolinha', [0.25, 0.5, 1, 2], 7),
      ...SUITS([[0.1, 0.2, 0.4, 0.8], [0.1, 0.2, 0.4, 0.8], [0.05, 0.1, 0.25, 0.5], [0.05, 0.1, 0.25, 0.5]]),
    ];
    const WILD = { id: 'w', img: 'house', name: 'Casinha', wild: true, reels: [1, 2, 3, 4], w: 1.6, fw: 1.6, rw: 0 };
    const SC = { id: 'sc', img: 'paw', name: 'Pegada', sc: true, reels: [0, 1, 2, 3, 4, 5], w: 0.72, fw: 0, rw: 0 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const WM = [{ m: 1, w: 50 }, { m: 2, w: 35 }, { m: 3, w: 15 }];
    const fill = (x) => { if (x.wild) x.m = RNG.weighted(WM).m; return x; };
    const STICKY_FS = { 3: 7, 4: 12, 5: 15, 6: 20 }, RAIN_FS = { 3: 15, 4: 18, 5: 25, 6: 30 };
    const grid = (wk, hs = randHeights(6, 2, 7)) => K.stack(hs.map((hh, c) => Array.from({ length: hh }, () => fill(draw(c, wk)))), 0.3);

    App.register(K.create({
      id: 'casacaes', name: 'Casa dos Cães Megaways', studio: STUDIO, art: 'house', mascot: 'dog',
      tag: 'Megaways · casinhas colantes', colors: ['#f59e0b', '#16a34a'], bg: 'linear-gradient(180deg,#bae6fd,#86efac 70%,#4ade80)',
      cols: 6, rows: 7, maxWin: 12305, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "The Dog House Megaways" (Pragmatic Play).',
      hello: 'Até 117.649 formas de ganhar!',
      symbols: all, lineList: null,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Cada rolo mostra de 2 a 7 símbolos. Iguais em rolos seguidos a partir da esquerda pagam por caminho (todas as combinações).'),
        { title: 'Pegada (scatter)', head: ['3', '4', '5', '6'], rows: [{ img: 'paw', name: 'Pegada', badge: 'SCATTER', pays: [null, null, null, null] }], raw: true, note: 'Não paga sozinha: 3+ abrem as rodadas grátis.' }],
      highlights: ['🏠 Casinhas são coringas (rolos 2 a 5) com <b>x1, x2 ou x3</b> — vários na mesma combinação <b>se somam</b>', '🐾 3+ pegadas: você escolhe <b>Coringas Colantes</b> ou <b>Chuva de Coringas</b>', 'Megaways: cada rolo com 2 a 7 símbolos, até <b>117.649</b> caminhos', 'Prêmio máximo: <b>12.305x</b>'],
      how: `<p><b>6 rolos Megaways</b>: cada rolo mostra de 2 a 7 símbolos por giro. Iguais em rolos seguidos a partir da esquerda pagam por <b>caminho</b>.</p>
        <p>${ico('house')} <b>Casinha</b> é o coringa (rolos 2 a 5) e traz multiplicador x1, x2 ou x3. Se várias casinhas estão na mesma combinação, os multiplicadores <b>se somam</b>.</p>`,
      features: `<p>${ico('paw')} <b>3, 4, 5 ou 6 pegadas</b> abrem as rodadas grátis. Você escolhe o modo:</p>
        <ul class="si-list"><li><b>Coringas Colantes:</b> 7 / 12 / 15 / 20 giros. Toda casinha que cair <b>fica presa</b> até o fim, com seu multiplicador.</li>
        <li><b>Chuva de Coringas:</b> 15 / 18 / 25 / 30 giros. Em cada giro chovem de <b>1 a 6 casinhas</b> em posições aleatórias.</li></ul>`,
      make: wk => grid(wk === 'base' ? 'w' : wk),
      async spin(rt) {
        const g = this.make('base');
        await rt.spin(g);
        await pay(rt, ways(g, SY, { wildMult: 'add' }));
        const sc = count(g, x => x.sc);
        if (sc >= 3) {
          rt.mark(scatters(g));
          rt.msg(`${sc} pegadas! Rodadas grátis 🐾`);
          await rt.wait(1100);
          await this.bonus(rt, { sc: Math.min(6, sc) });
        }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const mode = await rt.choose('ESCOLHA AS RODADAS', [
          { id: 'sticky', img: 'house', label: 'Coringas Colantes', desc: `${STICKY_FS[sc]} giros · casinhas ficam presas` },
          { id: 'rain', img: 'cyclone', label: 'Chuva de Coringas', desc: `${RAIN_FS[sc]} giros · 1 a 6 casinhas por giro` },
        ]);
        const sticky = new Map();
        await rt.fsLoop(mode === 'sticky' ? STICKY_FS[sc] : RAIN_FS[sc], async () => {
          const hs = randHeights(6, 2, 7);
          sticky.forEach((_, k) => { const [c, r] = K.unkey(k); hs[c] = Math.max(hs[c], r + 1); });
          const g = grid(mode === 'sticky' ? 'fw' : 'rw', hs);
          if (mode === 'sticky') {
            sticky.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...x, c: 'sticky' }; });
          } else {
            const n = RNG.int(1, 6);
            for (let i = 0; i < n; i++) { const c = RNG.int(1, 4); g[c][RNG.int(0, g[c].length - 1)] = fill({ ...WILD, c: 'sticky' }); }
          }
          await rt.spin(g, { tease: false });
          if (mode === 'sticky') cells(g, x => x.wild).forEach(([c, r]) => { if (!sticky.has(key(c, r))) sticky.set(key(c, r), g[c][r]); });
          await pay(rt, ways(g, SY, { wildMult: 'add' }));
        }, { sub: mode === 'sticky' ? 'Casinhas colantes!' : 'Chuva de casinhas!' });
      },
    }));
  })();

  /* =========================================================
     2. Lobo de Ouro (Wolf Gold) — 5×3, 25 linhas
     ========================================================= */
  (() => {
    const L25 = K.LINES_5x3.slice(0, 25);
    const SY = [
      S('bisao', 'ram', 'Carneiro', [5, 10, 25], 3), S('cavalo', 'horse', 'Cavalo', [2, 5, 15], 4), S('aguia', 'dove', 'Pomba', [1.5, 4, 10], 4),
      S('puma', 'leopard', 'Puma', [1, 3, 8], 5),
      ...SUITS([[0.5, 1.5, 4], [0.5, 1.5, 4], [0.25, 1, 2.5], [0.25, 1, 2.5]], [8, 8, 9, 9]),
    ];
    const WILD = { id: 'w', img: 'wolf', name: 'Lobo', wild: true, reels: [1, 2, 3], w: 2.6 };
    const SC = { id: 'sc', img: 'sunrise', name: 'Cânion', sc: true, reels: [0, 2, 4], w: 1.6 };
    const MOON = { id: 'lua', img: 'moon', name: 'Lua', coin: true, w: 7 };
    const VALS = [{ v: 1, w: 30 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 4, w: 10 }, { v: 5, w: 8 }, { v: 8, w: 5 }, { v: 10, w: 4 }, { v: 15, w: 3 }];
    const JP = [{ t: 'MINI', v: 30, w: 1.2 }, { t: 'MAJOR', v: 100, w: 0.25 }];
    const all = [...SY, WILD, SC, MOON];
    const draw = pool(all);
    const moon = () => {
      if (RNG.float() < 0.04) { const j = RNG.weighted(JP); return { ...MOON, v: j.v, t: j.t, c: 'jp' }; }
      return { ...MOON, v: RNG.weighted(VALS).v };
    };
    const fillCell = x => (x.coin ? moon() : x);
    const make = () => Array.from({ length: 5 }, (_, c) => Array.from({ length: 3 }, () => fillCell(draw(c))));

    App.register(K.create({
      id: 'lobodeouro', name: 'Lobo de Ouro', studio: STUDIO, art: 'wolf', mascot: 'wolf',
      tag: 'Respin das luas · jackpot 1.000x', colors: ['#c2410c', '#1e3a8a'], bg: 'linear-gradient(180deg,#1e1b4b,#7c2d12 70%,#c2410c)',
      cols: 5, rows: 3, maxWin: 2500, vol: 3, rtp: '~96%',
      intro: 'Inspirado no "Wolf Gold" (Pragmatic Play).',
      hello: '6 luas ativam o respin de dinheiro!',
      symbols: all,
      lineList: { cols: 5, rows: 3, list: L25, text: '25 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda. O lobo substitui todos (rolos 2 a 4).'),
        { title: 'Jackpots das luas', head: ['prêmio'], rows: [{ img: 'moon', name: 'MINI', pays: [30] }, { img: 'moon', name: 'MAJOR', pays: [100] }, { img: 'moon', name: 'MEGA (tela cheia)', pays: [1000] }] }],
      highlights: ['🌕 6+ luas = <b>Respin de Dinheiro</b>: as luas travam e você tem 3 respins (cada lua nova reinicia)', 'Encha as 15 posições: <b>MEGA jackpot 1.000x</b>', '🏜️ 3 cânions (rolos 1, 3 e 5) = <b>5 rodadas grátis</b> com <b>símbolos gigantes 3×3</b> nos rolos do meio', 'Prêmio máximo: <b>2.500x</b>'],
      how: `<p>Grade <b>5×3</b> com <b>25 linhas</b>. 3 a 5 iguais seguidos a partir da esquerda pagam.</p>
        <p>${ico('wolf')} <b>Lobo</b> é o coringa (rolos 2, 3 e 4).</p><p>${ico('moon')} <b>Luas</b> trazem valores em fichas ou os jackpots MINI (30x) e MAJOR (100x).</p>`,
      features: `<p>${ico('moon')} <b>Respin de Dinheiro:</b> 6 ou mais luas travam na tela e as outras posições giram 3 vezes. Cada lua nova trava e <b>reinicia os 3 respins</b>. No fim você ganha a soma de todas as luas; com as 15 posições cheias, ganha também o <b>MEGA de 1.000x</b>.</p>
        <p>${ico('sunrise')} <b>Rodadas grátis:</b> 3 cânions (só aparecem nos rolos 1, 3 e 5) dão <b>5 giros</b> em que os rolos 2, 3 e 4 mostram um <b>símbolo gigante 3×3</b>. 3 cânions durante elas dão +5 giros.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, lines(g, L25, SY));
        const moons = count(g, x => x.coin), sc = count(g, x => x.sc);
        if (moons >= 6) {
          rt.mark(cells(g, x => x.coin).map(([c, r]) => key(c, r)));
          rt.msg(`${moons} luas! Respin de dinheiro 🌕`);
          await rt.wait(1000);
          await K.holdSpin(rt, g, { isCoin: x => x.coin, newCoin: moon, pCoin: 0.075, full: { name: 'MEGA', v: 1000 }, title: 'RESPIN DE DINHEIRO' });
        }
        if (sc >= 3) {
          rt.mark(scatters(g));
          await rt.wait(900);
          await this.bonus(rt, {});
        }
      },
      async bonus(rt) {
        await rt.fsLoop(5, async api => {
          const g = Array.from({ length: 5 }, (_, c) => Array.from({ length: 3 }, () => draw(c)).map(x => (x.coin ? RNG.pick(SY) : x)));
          const giant = RNG.weighted([...SY.map(s => ({ s, w: s.w })), { s: WILD, w: 3 }]).s;
          for (let c = 1; c <= 3; c++) for (let r = 0; r < 3; r++) g[c][r] = { ...giant, c: 'giant' };
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L25, SY), 1, ` · gigante ${giant.name}`);
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: '5 giros com símbolos gigantes' });
      },
    }));
  })();

  /* =========================================================
     3. Festa das Frutas (Fruit Party) — 7×7 grupos
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    const SY = [
      S('morango', 'strawberry', 'Morango', [1, 2, 4, 10, 30, 100], 5), S('maca', 'apple', 'Maçã', [0.8, 1.5, 3, 7, 20, 80], 6),
      S('ameixa', 'plum', 'Ameixa', [0.6, 1.2, 2.5, 5, 15, 60], 7), S('laranja', 'peach', 'Pêssego', [0.5, 1, 2, 4, 10, 40], 8),
      S('limao', 'lemon', 'Limão', [0.4, 0.8, 1.5, 3, 8, 30], 9), S('uva', 'grapes', 'Uva', [0.3, 0.6, 1.2, 2.5, 6, 25], 10),
      S('banana', 'banana', 'Banana', [0.25, 0.5, 1, 2, 5, 20], 11),
    ];
    const SC = { id: 'sc', img: 'party', name: 'Festa', sc: true, w: 0.33, fw: 0.3 };
    const all = [...SY, SC];
    const draw = pool(all);
    const FS_T = { 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 };
    const make = (wk = 'w') => Array.from({ length: 7 }, (_, c) => Array.from({ length: 7 }, () => draw(c, wk)));

    async function play(rt, g, fs) {
      const P = fs ? 0.3 : 0.012;
      return tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'),
        evaluate: gg => {
          const cl = clusters(gg, 5);
          return payClusters(cl, T, k => {
            let m = 1;
            k.cells.forEach(kk => { if (m < 256 && RNG.float() < P) { m *= 2; const [c, r] = K.unkey(kk); gg[c][r].m = Math.min(256, (gg[c][r].m || 1) * 2); } });
            return m;
          });
        },
      });
    }

    App.register(K.create({
      id: 'festafrutas', name: 'Festa das Frutas', studio: STUDIO, art: 'strawberry', mascot: 'party',
      tag: '7×7 · multiplicadores até 256x', colors: ['#db2777', '#f59e0b'], bg: 'linear-gradient(180deg,#fde68a,#f9a8d4 60%,#c084fc)',
      cols: 7, rows: 7, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Fruit Party" (Pragmatic Play).',
      hello: 'Grupos de 5+ frutas encostadas pagam!',
      symbols: all,
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados (horizontal/vertical). Grupos diferentes se somam.')],
      highlights: ['🍓 Grade <b>7×7</b> com grupos de 5+ e <b>cascata</b>', '✨ Multiplicador aleatório: frutas vencedoras viram <b>x2</b> e os x2 do mesmo grupo <b>se multiplicam</b> — até <b>256x</b>', '🎉 3+ scatters = <b>10 a 30 rodadas grátis</b> com multiplicadores muito mais frequentes', 'Prêmio máximo: <b>5.000x</b>'],
      how: `<p>Grade <b>7×7</b>: grupos de <b>5 ou mais</b> frutas iguais encostadas pagam. Os vencedores somem e novas frutas caem (<b>cascata</b>).</p>`,
      features: `<p>✨ <b>Multiplicador aleatório:</b> cada fruta de um grupo vencedor pode ganhar um <b>x2</b>. Se o grupo tiver vários x2, eles se multiplicam (x4, x8… até <b>x256</b>). No jogo base é raro; nas rodadas grátis é ~10 vezes mais comum.</p>
        <table class="paytable"><tr class="si-head"><td>Scatters</td><td>Rodadas grátis</td></tr>${Object.entries(FS_T).map(([k, v]) => `<tr><td><b>${k}${k === '7' ? '+' : ''}</b></td><td>${v}</td></tr>`).join('')}</table>
        <p>3+ scatters durante as rodadas grátis dão mais giros pela mesma tabela.</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.drop(g);
        await play(rt, g, false);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        await rt.fsLoop(FS_T[Math.min(7, sc)], async api => {
          const g = make('fw');
          await rt.drop(g);
          await play(rt, g, true);
          const s = count(g, x => x.sc);
          if (s >= 3) api.add(FS_T[Math.min(7, s)]);
        }, { sub: 'Multiplicadores turbinados!' });
      },
    }));
  })();

  /* =========================================================
     4. Joias Bonança (Gems Bonanza) — 8×8 com marcadores
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    const SY = [
      S('coroa', 'crown', 'Coroa', [1, 2, 4, 10, 25, 100], 4), S('anel', 'ring', 'Anel', [0.8, 1.5, 3, 7, 20, 75], 5),
      S('rubi', 'gem', 'Rubi', [0.5, 1, 2, 4, 10, 40], 7), S('safira', 'bluediamond', 'Safira', [0.4, 0.8, 1.5, 3, 8, 30], 8),
      S('topazio', 'orangediamond', 'Topázio', [0.3, 0.6, 1.2, 2.5, 6, 25], 9), S('ametista', 'purpleheart', 'Ametista', [0.25, 0.5, 1, 2, 5, 20], 10),
      S('esmeralda', 'greenheart', 'Esmeralda', [0.2, 0.4, 0.8, 1.6, 4, 15], 11),
    ];
    const WILD = { id: 'w', img: 'sparkles', name: 'Coringa', wild: true, w: 0 };
    const SC = { id: 'sc', img: 'gemsparkle', name: 'Bônus', sc: true, w: 0.25, fw: 0.18 };
    const all = [...SY, WILD, SC];
    const draw = pool(SY), drawSC = pool([...SY, SC]);
    const MODS = [
      { id: 'nuclear', c: 'mk-blue', name: 'Nuclear', w: 3 }, { id: 'wildgem', c: 'mk-pink', name: 'Joia Coringa', w: 2 },
      { id: 'squares', c: 'mk-brown', name: 'Quadrados', w: 3 }, { id: 'colossal', c: 'mk-red', name: 'Colossal', w: 2 },
      { id: 'lucky', c: 'mk-green', name: 'Coringas da Sorte', w: 2 },
    ];
    const FEVER = [[114, 2], [116, 4], [120, 6], [125, 8], [132, 10]];
    const FS_T = n => (n >= 5 ? 20 : n === 4 ? 15 : 12);
    const make = (wk = 'w') => Array.from({ length: 8 }, (_, c) => Array.from({ length: 8 }, () => drawSC(c, wk)));
    const nSC = g => count(g, x => x.sc);

    // um giro completo (cascatas + modificadores). st guarda a contagem da Febre do Ouro:
    // no giro normal zera a cada giro; nas rodadas grátis acumula durante todo o bônus.
    async function play(rt, g, st) {
      const P = st.markP;
      const markOne = x => { if (!x.sc && !x.mk && RNG.float() < P) { const m = RNG.weighted(MODS); x.mk = m.id; x.c = m.c; } return x; };
      g.forEach(col => col.forEach(markOne));
      await rt.drop(g);
      const queued = new Set();
      const drawM = c => markOne(draw(c));
      const show = () => { if (st.fever > 1) rt.chip('fever', 'FEBRE', 'x' + st.fever); rt.chip('cnt', 'SÍMBOLOS', st.n); };
      show();
      for (let round = 0; round < 12 && !rt.capped; round++) {
        await tumble(rt, g, {
          draw: drawM,
          mult: () => st.fever,
          evaluate: gg => {
            const res = payClusters(clusters(gg, 5), T);
            res.cells.forEach(k => { const [c, r] = K.unkey(k); if (gg[c][r].mk) queued.add(gg[c][r].mk); });
            return res;
          },
          onStep: async (step, gg, res) => {
            st.n += res.cells.size;
            const lv = FEVER.filter(([t]) => st.n >= t).pop();
            if (lv && lv[1] > st.fever) { st.fever = lv[1]; show(); rt.msg(`🔥 FEBRE DO OURO x${st.fever}! (${st.n} símbolos)`); rt.fx('big'); await rt.wait(800); }
            else show();
          },
        });
        if (!queued.size) break;
        const order = MODS.map(m => m.id).filter(id => queued.has(id));
        queued.clear();
        for (const id of order) {
          const m = MODS.find(x => x.id === id);
          rt.msg(`🎨 ${m.name}!`);
          rt.fx('big');
          const put = (c, r, x) => { if (!g[c][r].sc) g[c][r] = x; };
          if (id === 'nuclear') { g.forEach((col, c) => col.forEach((_, r) => put(c, r, { ...draw(c), fresh: true }))); }
          if (id === 'wildgem') { const s = RNG.pick(g.flat().filter(x => !x.wild && !x.sc)); g.forEach((col, c) => col.forEach((x, r) => { if (x.id === s.id) g[c][r] = { ...WILD, fresh: true }; })); }
          if (id === 'squares') { const s = RNG.pick(SY); for (let i = RNG.int(2, 4); i > 0; i--) { const c0 = RNG.int(0, 6), r0 = RNG.int(0, 6); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) put(c0 + a, r0 + b, { ...s, fresh: true }); } }
          if (id === 'colossal') { const s = RNG.pick(SY), z = RNG.weighted([{ z: 3, w: 6 }, { z: 4, w: 3 }, { z: 5, w: 1 }]).z; const c0 = RNG.int(0, 8 - z), r0 = RNG.int(0, 8 - z); for (let a = 0; a < z; a++) for (let b = 0; b < z; b++) put(c0 + a, r0 + b, { ...s, fresh: true }); }
          if (id === 'lucky') { for (let i = RNG.int(5, 15); i > 0; i--) put(RNG.int(0, 7), RNG.int(0, 7), { ...WILD, fresh: true }); }
          await rt.drop(g);
          await rt.wait(500);
        }
      }
    }

    App.register(K.create({
      id: 'joiasbonanca', name: 'Joias Bonança', studio: STUDIO, art: 'ring', mascot: 'crown',
      tag: '8×8 · modificadores · Febre do Ouro · grátis', colors: ['#7c3aed', '#059669'], bg: 'linear-gradient(180deg,#78350f,#451a03 60%,#1c0a02)',
      cols: 8, rows: 8, maxWin: 10000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Gems Bonanza" (Pragmatic Play).',
      hello: 'Ganhe em cima das marcas coloridas!',
      symbols: all,
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados. Grupos diferentes se somam.')],
      highlights: ['💎 Grade <b>8×8</b> com grupos de 5+ e cascata', '🎨 Ganhe em cima de uma <b>marca colorida</b> para ativar um dos 5 modificadores', '🔥 <b>Febre do Ouro:</b> 114+ símbolos vencedores numa sequência liberam multiplicador de <b>x2 até x10</b>', '🎁 3+ joias bônus: <b>12 a 20 rodadas grátis</b> com a Febre do Ouro acumulando o bônus inteiro', 'Prêmio máximo: <b>10.000x</b>'],
      how: `<p>Grade <b>8×8</b>: grupos de <b>5 ou mais</b> joias iguais encostadas pagam, com <b>cascata</b>.</p>
        <p>Algumas casas aparecem com uma <b>marca colorida</b> atrás da joia. Se um ganho acontece em cima dela, o modificador da cor é guardado e roda quando as cascatas param.</p>`,
      features: `<h4>Modificadores (rodam nesta ordem)</h4><ul class="si-list">
        <li><b class="mkt mk-blue">Nuclear (azul)</b>: troca a grade inteira por novas joias.</li>
        <li><b class="mkt mk-pink">Joia Coringa (rosa)</b>: um tipo de joia da tela vira coringa em todas as posições.</li>
        <li><b class="mkt mk-brown">Quadrados (marrom)</b>: blocos 2×2 de uma mesma joia aparecem na grade.</li>
        <li><b class="mkt mk-red">Colossal (vermelho)</b>: um bloco gigante 3×3, 4×4 ou 5×5 de uma joia.</li>
        <li><b class="mkt mk-green">Coringas da Sorte (verde)</b>: de 5 a 15 coringas caem em posições aleatórias.</li></ul>
        <h4>Febre do Ouro</h4><p>Conte os símbolos vencedores de uma mesma sequência de cascatas: ao passar de <b>114</b> o resto dos ganhos dessa sequência vale <b>x2</b>; com 116 vale x4, 120 x6, 125 x8 e <b>132 x10</b>.</p>
        <h4>Rodadas grátis</h4><p>${ico('gemsparkle')} <b>3, 4 ou 5+ joias bônus</b> na tela dão <b>12, 15 ou 20 rodadas grátis</b>. Nelas as marcas coloridas aparecem com mais frequência e a contagem da <b>Febre do Ouro não zera</b> entre os giros: ela acumula durante todo o bônus. 3+ joias bônus nas grátis dão <b>+5 giros</b>.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await play(rt, g, { n: 0, fever: 1, markP: 0.022 });
        rt.chip('fever', null);
        rt.chip('cnt', null);
        const n = nSC(g);
        if (n >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { n }); }
      },
      async bonus(rt, { n = 3 } = {}) {
        const st = { n: 0, fever: 1, markP: 0.07 };
        await rt.fsLoop(FS_T(n), async api => {
          const g = make('fw');
          await play(rt, g, st);
          if (nSC(g) >= 3) { rt.mark(scatters(g)); rt.msg('🎁 +5 rodadas grátis!'); api.add(5); await rt.wait(700); }
        }, { sub: `${FS_T(n)} giros · Febre do Ouro acumula` });
        rt.chip('fever', null);
        rt.chip('cnt', null);
      },
    }));
  })();

  /* =========================================================
     5. Madame Destino Megaways (Madame Destiny Megaways)
     ========================================================= */
  (() => {
    const SY = [
      S('bola', 'crystal', 'Bola de cristal', [1, 2, 5, 10], 4), S('gato', 'blackcat', 'Gato preto', [0.8, 1.5, 4, 8], 5),
      S('coruja', 'owl', 'Coruja', [0.6, 1.2, 3, 6], 5), S('vela', 'candle', 'Vela', [0.5, 1, 2.5, 5], 6), S('olho', 'nazar', 'Olho grego', [0.4, 0.8, 2, 4], 6),
      ...SUITS([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.4, 0.8], [0.1, 0.2, 0.4, 0.8]]),
    ];
    const WILD = { id: 'w', img: 'eye', name: 'Madame', wild: true, m: 2, reels: [1, 2, 3, 4], w: 1.1, fw: 1.8 };
    const SC = { id: 'sc', img: 'dizzystar', name: 'Destino', sc: true, w: 0.68, fw: 0.5 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const SPINS = [{ v: 8, w: 20 }, { v: 10, w: 26 }, { v: 12, w: 24 }, { v: 15, w: 18 }, { v: 20, w: 12 }];
    const MULTS = [{ v: 1, w: 30 }, { v: 2, w: 30 }, { v: 3, w: 22 }, { v: 4, w: 12 }, { v: 5, w: 6 }];
    const make = (wk = 'w') => K.stack(randHeights(6, 2, 7).map((hh, c) => Array.from({ length: hh }, () => draw(c, wk))), 0.3);

    App.register(K.create({
      id: 'madamedestino', name: 'Madame Destino Megaways', studio: STUDIO, art: 'crystal', mascot: 'crystal',
      tag: 'Roda do destino · multiplicador crescente', colors: ['#7e22ce', '#0f766e'], bg: 'radial-gradient(circle at 50% 0%,#6d28d9,#1e1b4b 70%)',
      cols: 6, rows: 7, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Madame Destiny Megaways" (Pragmatic Play).',
      hello: 'A Madame dobra cada ganho que toca!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways: até 200.704 caminhos. A Madame (coringa x2) dobra o caminho em que entra; várias se somam.')],
      highlights: ['🔮 Megaways com até <b>200.704</b> caminhos', '👁️ Coringa da Madame (rolos 2 a 5) vale <b>x2</b>', '✨ 3+ scatters giram a <b>Roda do Destino</b>: define as rodadas grátis e o multiplicador inicial (x1 a x5)', '📈 Nas grátis o multiplicador <b>sobe +1 a cada combinação vencedora</b> e nunca volta', 'Prêmio máximo: <b>5.000x</b>'],
      how: `<p><b>6 rolos Megaways</b> (2 a 7 símbolos cada). Iguais em rolos seguidos a partir da esquerda pagam por caminho.</p><p>${ico('eye')} <b>Madame</b> é o coringa (rolos 2 a 5) e multiplica por <b>x2</b> as combinações em que entra.</p>`,
      features: `<p>${ico('dizzystar')} <b>3 ou mais scatters</b> giram a <b>Roda do Destino</b> duas vezes: a primeira define as rodadas grátis (8 a 20) e a segunda o <b>multiplicador inicial</b> (x1 a x5).</p>
        <p>📈 Cada giro grátis com ganho paga com o multiplicador atual e depois ele <b>sobe +1 para cada combinação vencedora</b> do giro. O multiplicador nunca volta durante o bônus.</p>
        <p>3+ scatters durante as rodadas giram a roda de giros de novo (giros extras, sem limite).</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, ways(g, SY, { wildMult: 'add' }));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const si = SPINS.indexOf(RNG.weighted(SPINS)), mi = MULTS.indexOf(RNG.weighted(MULTS));
        await rt.reveal('RODA DO DESTINO: GIROS', SPINS.map(s => ({ img: 'crystal', t: `${s.v} giros` })), si);
        await rt.reveal('RODA DO DESTINO: MULTIPLICADOR', MULTS.map(s => ({ img: 'sparkles', t: `x${s.v}` })), mi);
        let M = MULTS[mi].v;
        rt.chip('mult', 'MULT.', 'x' + M);
        await rt.fsLoop(SPINS[si].v, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          const res = ways(g, SY, { wildMult: 'add' });
          await pay(rt, res, M);
          // cada combinação vencedora (símbolo pago) faz o multiplicador subir +1
          if (res.total && !rt.capped) { M += res.wins.length; rt.chip('mult', 'MULT.', 'x' + M); rt.msg(`📈 +${res.wins.length} · multiplicador agora x${M}!`); await rt.wait(450); }
          if (count(g, x => x.sc) >= 3) { const r = RNG.weighted(SPINS); await rt.reveal('MAIS GIROS!', SPINS.map(s => ({ img: 'crystal', t: `+${s.v}` })), SPINS.indexOf(r)); api.add(r.v); }
        }, { sub: `${SPINS[si].v} giros · começa em x${M} e sobe a cada ganho` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     6. Cleogata (Cleocatra) — 5×4, 40 linhas, coringas colantes
     ========================================================= */
  (() => {
    const L40 = K.linesFor(4, 40);
    const SY = [
      S('bastet', 'heartcat', 'Gata apaixonada', [2, 5, 15], 3), S('preto', 'wrycat', 'Gato esperto', [1.5, 4, 10], 3),
      S('anfora', 'yarn', 'Novelo', [1, 2.5, 6], 5), S('escaravelho', 'milk', 'Leite', [0.8, 2, 5], 5), S('olho', 'ribbon', 'Laço', [0.6, 1.5, 4], 6),
      ...SUITS([[0.2, 0.6, 1.5], [0.2, 0.6, 1.5], [0.15, 0.5, 1.2], [0.15, 0.5, 1.2]], [8, 8, 9, 9]),
    ];
    const WILD = { id: 'w', img: 'grincat', name: 'Cleogata', wild: true, reels: [1, 2, 3, 4], w: 1.3, fw: 2.2 };
    const SC = { id: 'sc', img: 'fish', name: 'Peixe', sc: true, w: 0.95, fw: 0.9 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const fill = x => { if (x.wild) x.m = RNG.weighted([{ m: 2, w: 65 }, { m: 3, w: 35 }]).m; return x; };
    const FS_T = { 3: 8, 4: 12, 5: 16 };
    // pilhas: os gatos tendem a cair empilhados
    const make = (wk = 'w') => Array.from({ length: 5 }, (_, c) => {
      if (RNG.float() < 0.06) { const s = RNG.pick(SY.slice(0, 2)); return Array.from({ length: 4 }, () => ({ ...s })); }
      return Array.from({ length: 4 }, () => fill(draw(c, wk)));
    });

    App.register(K.create({
      id: 'cleogata', name: 'Cleogata', studio: STUDIO, art: 'catface', mascot: 'cat',
      tag: 'Gatos coringa colantes x2/x3', colors: ['#ca8a04', '#0e7490'], bg: 'linear-gradient(180deg,#0c4a6e,#164e63 50%,#78350f)',
      cols: 5, rows: 4, maxWin: 5000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Cleocatra" (Pragmatic Play).',
      hello: 'Pilha de gatos no rolo 1 = respin garantido!',
      symbols: all,
      lineList: { cols: 5, rows: 4, list: L40, text: '40 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.'),
        { title: 'Pata (scatter)', head: ['3', '4', '5'], rows: [{ img: 'paw', name: 'Pata', badge: 'SCATTER', pays: [5, 5, 5] }], note: 'Paga 5x a aposta e abre 8, 12 ou 16 rodadas grátis.' }],
      highlights: ['😺 Cleogata é coringa (rolos 2 a 5) com <b>x2 ou x3</b> — vários na linha <b>se somam</b>', '🐾 3/4/5 patas = 5x + <b>8/12/16 rodadas grátis</b> com coringas <b>colantes</b>', '🐈 Pilha cheia de gatos no rolo 1 = <b>respin até ganhar</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: `<p>Grade <b>5×4</b> com <b>40 linhas</b>.</p><p>${ico('grincat')} <b>Cleogata</b> é o coringa (rolos 2 a 5) e traz <b>x2 ou x3</b>; numa linha com vários, os multiplicadores se somam.</p>
        <p><b>Respin:</b> se uma pilha cheia de gatos (Bastet ou gato preto) cair no rolo 1, ela e os gatos iguais travam e o resto gira de novo <b>até sair um ganho</b>.</p>`,
      features: `<p>${ico('fish')} <b>3, 4 ou 5 patas</b> pagam 5x a aposta e dão <b>8, 12 ou 16 rodadas grátis</b>. Nelas todo coringa que cair <b>fica preso até o fim</b> com seu multiplicador. Pilha cheia de gatos no rolo 1 dá <b>+2 giros</b>.</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        let res = lines(g, L40, SY, { mult: 'add' });
        const s0 = g[0][0];
        if (!res.total && SY.slice(0, 2).some(s => s.id === s0.id) && g[0].every(x => x.id === s0.id)) {
          rt.msg('🐈 Pilha de gatos! Respin até ganhar');
          rt.fx('big');
          for (let i = 0; i < 30 && !res.total; i++) {
            await rt.wait(400);
            for (let c = 1; c < 5; c++) for (let r = 0; r < 4; r++) if (g[c][r].id !== s0.id) g[c][r] = { ...fill(draw(c)), fresh: true };
            await rt.drop(g);
            res = lines(g, L40, SY, { mult: 'add' });
            if (i === 29 && !res.total) { for (let r = 0; r < 4; r++) g[1][r] = { ...s0 }; for (let r = 0; r < 4; r++) g[2][r] = { ...s0 }; res = lines(g, L40, SY, { mult: 'add' }); }
          }
        }
        await pay(rt, res);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.win(5); rt.mark(scatters(g)); rt.msg(`${sc} patas! +${rt.coins(5)}`); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const sticky = new Map();
        await rt.fsLoop(FS_T[Math.min(5, sc)], async api => {
          const g = make('fw');
          sticky.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...x, c: 'sticky' }; });
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => sticky.set(key(c, r), g[c][r]));
          await pay(rt, lines(g, L40, SY, { mult: 'add' }));
          if (g[0].every(x => x.id === g[0][0].id && SY.slice(0, 2).some(s => s.id === x.id))) api.add(2);
          const s = count(g, x => x.sc);
          if (s >= 3) { rt.win(5); api.add(FS_T[Math.min(5, s)]); }
        }, { sub: 'Coringas colantes!' });
      },
    }));
  })();

  /* =========================================================
     7. Caçador João e a Rainha Escaravelho (John Hunter Scarab Queen)
     ========================================================= */
  (() => {
    const L25 = K.LINES_5x3.slice(0, 25);
    const SY = [
      S('joao', 'backpack', 'Mochila do João', [5, 15, 50], 3), S('gata', 'lizard', 'Lagarto', [2.5, 8, 25], 4),
      S('anfora', 'urn', 'Urna', [1.5, 4, 12], 5), S('mapa', 'worldmap', 'Mapa', [1, 3, 8], 6),
      ...SUITS([[0.4, 1, 3], [0.4, 1, 3], [0.25, 0.6, 2], [0.25, 0.6, 2]], [8, 8, 9, 9]),
    ];
    const WILD = { id: 'w', img: 'ladybug', name: 'Rainha', wild: true, w: 1.3 };
    const SC = { id: 'sc', img: 'camping', name: 'Acampamento', sc: true, reels: [1, 2, 3], w: 1.7 };
    const MONEY = { id: 'm', img: 'beetle', name: 'Escaravelho', coin: true, reels: [0, 1, 2, 3], w: 2.6, fw: 9 };
    const COLLECT = { id: 'col', img: 'compass', name: 'Coletar', reels: [4], w: 1.8 };
    const VALS = [{ v: 0.5, w: 30 }, { v: 1, w: 30 }, { v: 2, w: 18 }, { v: 3, w: 10 }, { v: 5, w: 7 }, { v: 10, w: 3 }, { v: 25, w: 1.5 }, { v: 50, w: 0.5 }];
    const all = [...SY, WILD, SC, MONEY, COLLECT];
    const draw = pool(all);
    const fill = x => (x.coin ? { ...x, v: RNG.weighted(VALS).v } : x);
    const make = (wk = 'w') => Array.from({ length: 5 }, (_, c) => Array.from({ length: 3 }, () => fill(draw(c, wk))));
    const money = g => g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);

    App.register(K.create({
      id: 'cacadorjoao', name: 'Caçador João e a Rainha Escaravelho', studio: STUDIO, art: 'beetle', mascot: 'cowboy',
      tag: 'Coleta de escaravelhos · pote final', colors: ['#b45309', '#065f46'], bg: 'linear-gradient(180deg,#451a03,#78350f 60%,#a16207)',
      cols: 5, rows: 3, maxWin: 10500, vol: 3, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "John Hunter and the Tomb of the Scarab Queen" (Pragmatic Play).',
      hello: 'A bússola no rolo 5 coleta os escaravelhos!',
      symbols: all,
      lineList: { cols: 5, rows: 3, list: L25, text: '25 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda. A Rainha é coringa.'),
        { title: 'Escaravelhos (valores)', head: ['valor'], rows: VALS.map(v => ({ img: 'beetle', name: 'Escaravelho', pays: [v.v] })) }],
      highlights: ['🪲 Escaravelhos com valor nos rolos 1 a 4; a <b>bússola</b> no rolo 5 <b>coleta tudo</b>', '🏛️ 3 pirâmides (rolos 2 a 4) = 1x + <b>8 rodadas grátis</b>', 'Nas rodadas grátis os valores vão para um <b>pote</b>; no fim, um <b>giro final</b> com escaravelho gigante decide se você leva o pote', 'Prêmio máximo: <b>10.500x</b>'],
      how: `<p>Grade <b>5×3</b> com <b>25 linhas</b>. ${ico('ladybug')} A <b>Rainha</b> é coringa.</p><p>${ico('beetle')} <b>Escaravelhos</b> mostram valores em fichas (rolos 1 a 4). Se a ${ico('compass')} <b>bússola</b> cair no rolo 5, ela <b>coleta</b> a soma de todos os escaravelhos da tela.</p>`,
      features: `<p>${ico('camping')} <b>3 pirâmides</b> (só nos rolos 2, 3 e 4) pagam 1x e dão <b>8 rodadas grátis</b> (3 pirâmides nelas = +8, sem limite).</p>
        <p>Durante as rodadas, cada escaravelho que aparece soma seu valor no <b>pote</b>. Ao final, um <b>escaravelho gigante</b> ocupa os rolos 1 a 4 e o rolo 5 gira até 3 vezes: se cair a bússola, <b>você leva o pote inteiro</b>.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, lines(g, L25, SY));
        if (g[4].some(x => x.id === 'col') && money(g) > 0) {
          const v = money(g);
          rt.mark(cells(g, x => x.coin || x.id === 'col').map(([c, r]) => key(c, r)));
          rt.win(v);
          rt.msg(`🧭 Coletou os escaravelhos: ${rt.coins(v)}`);
          rt.fx('coin');
          await rt.wait(1000);
        }
        if (count(g, x => x.sc) >= 3) { rt.win(1); rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let pot = 0;
        await rt.fsLoop(8, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L25, SY));
          const v = money(g);
          if (v) { pot += v; rt.chip('pot', 'POTE', K.short(Math.round(pot * rt.k * rt.bet * 100) / 100)); rt.msg(`🪲 +${rt.coins(v)} no pote`); await rt.wait(500); }
          if (count(g, x => x.sc) >= 3) { rt.win(1); api.add(8); }
        }, { sub: 'Escaravelhos enchem o pote' });
        if (pot > 0) {
          rt.msg(`Giro final! Pote de ${rt.coins(pot)}`);
          let got = false;
          for (let i = 0; i < 3 && !got; i++) {
            const g = make();
            for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) g[c][r] = { ...MONEY, c: 'giant', t: i === 0 && c === 1 && r === 1 ? 'POTE' : '' };
            for (let r = 0; r < 3; r++) g[4][r] = RNG.float() < 0.3 ? { ...COLLECT } : { ...RNG.pick(SY) };
            await rt.spin(g, { tease: false });
            got = g[4].some(x => x.id === 'col');
          }
          if (got) { rt.win(pot); rt.msg(`🧭 POTE COLETADO! ${rt.coins(pot)}`); rt.fx('jackpot'); await rt.wait(1300); } else { rt.msg('A bússola não veio... o pote ficou na tumba.'); await rt.wait(1000); }
          rt.chip('pot', null);
        }
      },
    }));
  })();

  /* =========================================================
     8. Frutas Suculentas (Juicy Fruits) — 5×5, 50 linhas
     ========================================================= */
  (() => {
    const L50 = K.linesFor(5, 50);
    const SY = [
      S('melancia', 'watermelon', 'Melancia', [1, 3, 10], 4), S('abacaxi', 'pineapple', 'Abacaxi', [0.8, 2, 6], 5), S('uva', 'kiwi', 'Kiwi', [0.6, 1.5, 4], 6),
      S('ameixa', 'pear', 'Pera', [0.4, 1, 3], 7), S('laranja', 'mango', 'Manga', [0.3, 0.8, 2], 8), S('limao', 'melon', 'Melão', [0.2, 0.5, 1.5], 9),
      S('cereja', 'cherries', 'Cereja', [0.1, 0.4, 1], 10),
    ];
    const WILD = { id: 'w', img: 'tropicaldrink', name: 'Coquetel', wild: true, w: 0.5, fw: 0 };
    const SC = { id: 'sc', img: 'diamonddot', name: 'Diamante', sc: true, w: 0.58, fw: 1.3 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const make = (wk = 'w') => Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, () => draw(c, wk)));

    App.register(K.create({
      id: 'frutassuculentas', name: 'Frutas Suculentas', studio: STUDIO, art: 'watermelon', mascot: 'pineapple',
      tag: 'Coringa gigante que cresce', colors: ['#16a34a', '#db2777'], bg: 'linear-gradient(180deg,#fef9c3,#bbf7d0 60%,#5eead4)',
      cols: 5, rows: 5, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Juicy Fruits" (Pragmatic Play).',
      hello: '3 diamantes ativam o coringa gigante!',
      symbols: all,
      lineList: { cols: 5, rows: 5, list: L50, text: '50 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['🍉 Grade <b>5×5</b> com <b>50 linhas</b>', '💎 3+ diamantes = <b>6 rodadas grátis</b> com <b>coroa coringa gigante</b> que anda pela grade', 'A cada 3 diamantes coletados a coroa <b>cresce</b> (1×1 → 2×2 → 3×3 → 4×4 → 5×5) e você ganha giros extras', 'Prêmio máximo: <b>5.000x</b>'],
      how: `<p>Grade <b>5×5</b> com <b>50 linhas</b>. ${ico('tropicaldrink')} A coroa é coringa.</p>`,
      features: `<p>${ico('diamonddot')} <b>3 ou mais diamantes</b> dão <b>6 rodadas grátis</b>. Nelas a ${ico('tropicaldrink')} <b>coroa gigante</b> aparece em um lugar aleatório a cada giro, começando com 1×1.</p>
        <p>Cada diamante que cair vai para o medidor: a cada <b>3 diamantes</b> a coroa sobe de tamanho (até 5×5) e você ganha de <b>1 a 3 giros extras</b> (até 4 melhorias).</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, lines(g, L50, SY));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let size = 1, dia = 0, ups = 0;
        await rt.fsLoop(6, async api => {
          const g = make('fw');
          const c0 = RNG.int(0, 5 - size), r0 = RNG.int(0, 5 - size);
          for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) g[c0 + a][r0 + b] = { ...WILD, c: 'giant' };
          rt.chip('size', 'COROA', `${size}×${size}`);
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L50, SY));
          dia += count(g, x => x.sc);
          rt.chip('dia', 'DIAMANTES', `${dia % 3}/3`);
          while (dia >= 3 && ups < 4) {
            dia -= 3;
            ups++;
            size++;
            const extra = RNG.int(1, 3);
            rt.msg(`💎 Coroa cresceu para ${size}×${size}! +${extra} giros`);
            api.add(extra);
            await rt.wait(900);
          }
        }, { sub: '6 giros · coroa coringa gigante' });
        rt.chip('size', null);
        rt.chip('dia', null);
      },
    }));
  })();

  /* =========================================================
     9. Rei Búfalo Megaways (Buffalo King Megaways)
     ========================================================= */
  (() => {
    const SY = [
      S('bufalo', 'bison', 'Búfalo', [1, 2.5, 6, 15], 4), S('aguia', 'eagle', 'Águia', [0.6, 1.2, 3, 8], 5), S('lobo', 'beaver', 'Castor', [0.5, 1, 2.5, 6], 5),
      S('puma', 'skunk', 'Gambá', [0.4, 0.8, 2, 5], 6), S('cervo', 'deer', 'Cervo', [0.3, 0.6, 1.5, 4], 6),
      ...SUITS([[0.1, 0.2, 0.5, 1.2], [0.1, 0.2, 0.5, 1.2], [0.08, 0.15, 0.4, 1], [0.08, 0.15, 0.4, 1]]),
    ];
    const WILD = { id: 'w', img: 'sunset', name: 'Pôr do sol', wild: true, reels: [1, 2, 3, 4], w: 0.9, fw: 2 };
    const SC = { id: 'sc', img: 'coin', name: 'Moeda de ouro', sc: true, w: 1.0 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const FS_T = n => 12 + (Math.min(9, n) - 4) * 2;
    const make = (wk = 'w') => K.stack([RNG.int(2, 7), RNG.int(2, 8), RNG.int(2, 8), RNG.int(2, 8), RNG.int(2, 8), RNG.int(2, 7)].map((hh, c) => Array.from({ length: hh }, () => draw(c, wk))), 0.3);
    const WM = [{ m: 2, w: 55 }, { m: 3, w: 30 }, { m: 5, w: 15 }];

    async function play(rt, g, fs) {
      let acc = 0;
      if (fs) g.forEach(col => col.forEach(x => { if (x.wild) x.m = RNG.weighted(WM).m; }));
      const r = await tumble(rt, g, {
        draw: c => { const x = draw(c, fs ? 'fw' : 'w'); if (fs && x.wild) x.m = RNG.weighted(WM).m; return x; },
        evaluate: gg => {
          const res = ways(gg, SY);
          if (fs) res.cells.forEach(k => { const [c, rr] = K.unkey(k); const x = gg[c][rr]; if (x.wild && x.m && !x.used) { acc += x.m; x.used = true; rt.chip('mult', 'MULT.', 'x' + acc); } });
          // os multiplicadores só valem no fim da sequência: pagamos sem eles aqui
          if (fs) res.total = ways(gg.map(col => col.map(x => (x.wild ? { ...x, m: 1 } : x))), SY).total;
          return res;
        },
      });
      if (fs && acc > 1 && r.total > 0) {
        rt.win(r.total * (acc - 1));
        rt.msg(`🌅 Multiplicadores somados x${acc}! ${rt.coins(r.total)} → ${rt.coins(r.total * acc)}`);
        rt.fx('big');
        await rt.wait(1100);
      }
      rt.chip('mult', null);
    }

    App.register(K.create({
      id: 'reibufalo', name: 'Rei Búfalo Megaways', studio: STUDIO, art: 'bison', mascot: 'bison',
      tag: 'Megaways · coringas x2/x3/x5', colors: ['#b45309', '#7f1d1d'], bg: 'linear-gradient(180deg,#fdba74,#c2410c 50%,#7c2d12)',
      cols: 6, rows: 8, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Buffalo King Megaways" (Pragmatic Play).',
      hello: 'Até 200.704 caminhos e cascata!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata: vencedores somem e novos símbolos caem.')],
      highlights: ['🦬 Megaways com até <b>200.704</b> caminhos e <b>cascata</b>', '🪙 4+ moedas = <b>12 a 22 rodadas grátis</b> (+5 a cada 4 moedas)', '🌅 Nas rodadas grátis cada coringa traz <b>x2, x3 ou x5</b>; os multiplicadores da sequência <b>se somam</b> e valem no fim', 'Prêmio máximo: <b>5.000x</b>'],
      how: `<p><b>6 rolos Megaways</b> (rolos 1 e 6 com 2 a 7 símbolos, rolos 2 a 5 com 2 a 8). Iguais em rolos seguidos pagam por caminho e as <b>cascatas</b> continuam até não haver mais ganho.</p><p>${ico('sunset')} Coringa nos rolos 2 a 5.</p>`,
      features: `<p>${ico('coin')} <b>4 a 9 moedas</b> dão <b>12, 14, 16, 18, 20 ou 22 rodadas grátis</b>. Nelas, 4+ moedas dão +5 giros (sem limite).</p>
        <p>Durante as rodadas cada coringa vem com <b>x2, x3 ou x5</b>. Os multiplicadores dos coringas que participam de ganhos numa sequência de cascatas <b>se somam</b> e multiplicam o ganho total da sequência quando ela termina.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false);
        const sc = count(g, x => x.sc);
        if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 4 } = {}) {
        await rt.fsLoop(FS_T(sc), async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, true);
          if (count(g, x => x.sc) >= 4) api.add(5);
        }, { sub: 'Coringas com multiplicador!' });
      },
    }));
  })();
})();
