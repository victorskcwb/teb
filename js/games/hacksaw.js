'use strict';

/* =========================================================
   Slots no estilo Hacksaw Gaming (SlotKit).
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, cascade, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'hacksaw';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const SUITS = (pays, w = [8, 8, 9, 9]) => K.ROYALS(pays, w);
  const wmult = list => RNG.weighted(list).m;
  /** Compra de bônus: sorteia o nível com as chances naturais. list = [{ v, w }] */
  const tier = list => RNG.weighted(list).v;
  const BIG = [{ m: 2, w: 45 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 9 }, { m: 25, w: 4 }, { m: 50, w: 1.5 }, { m: 100, w: 0.5 }];

  /* =========================================================
     1. Procurado Vivo ou Selvagem (Wanted Dead or a Wild) — 5×5, 15 linhas
     ========================================================= */
  (() => {
    const L = K.LINES_5x5;
    const SY = [
      S('xerife', 'cowboy', 'Pistoleiro', [2, 5, 15], 3), S('caveira', 'ox', 'Touro', [1.5, 4, 10], 4), S('pistola', 'pistol', 'Pistola', [1, 3, 8], 4),
      S('whisky', 'tumbler', 'Whisky', [0.8, 2, 5], 5), ...SUITS([[0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]]),
    ];
    const WILD = { id: 'w', img: 'star', name: 'Estrela de xerife', wild: true, w: 0.9, tw: 1.6 };
    const VS = { id: 'vs', img: 'vs', name: 'VS', t: 'VS', reels: [1, 2, 3], w: 0.2, dw: 1.4, tw: 0.2, vs: true };
    const SCD = { id: 'scd', img: 'hourglass', name: 'Duelo', sc: true, kind: 'duel', w: 0.47, dw: 0, tw: 0 };
    const SCM = { id: 'scm', img: 'cards', name: 'Mão do Morto', sc: true, kind: 'dead', w: 0.39, dw: 0, tw: 0 };
    const SCT = { id: 'sct', img: 'locomotive', name: 'Trem', sc: true, kind: 'train', w: 0.39, dw: 0, tw: 0 };
    const all = [...SY, WILD, VS, SCD, SCM, SCT];
    const draw = pool(all);
    const make = (wk = 'w') => K.stack(grid([5, 5, 5, 5, 5], c => draw(c, wk)), 0.2);
    /** VS vira rolo inteiro de coringa com multiplicador se isso der ganho. */
    async function duels(rt, g) {
      const vs = cells(g, x => x.vs);
      for (const [c] of vs) {
        if (!g[c].some(x => x.vs)) continue;
        const m = wmult(BIG);
        const test = g.map(col => col.slice());
        test[c] = Array.from({ length: 5 }, () => ({ ...WILD, m, c: 'duel' }));
        if (lines(test, L, SY).total > lines(g, L, SY).total) {
          g[c] = Array.from({ length: 5 }, () => ({ ...WILD, m, c: 'duel', fresh: true }));
          rt.msg(`🤠 DUELO! Rolo ${c + 1} vira coringa x${m}`);
          rt.fx('boom');
          await rt.drop(g);
          await rt.wait(400);
        } else g[c] = g[c].map(x => (x.vs ? RNG.pick(SY) : x));
      }
    }
    App.register(K.create({
      id: 'procurado', name: 'Procurado Vivo ou Selvagem', studio: STUDIO, art: 'cowboy', mascot: 'cowboy',
      tag: 'DuelReels até x100 · 3 bônus', colors: ['#92400e', '#1c1917'], bg: 'linear-gradient(180deg,#78350f,#451a03 60%,#1c0a02)',
      cols: 5, rows: 5, maxWin: 12500, vol: 4, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Wanted Dead or a Wild" (Hacksaw Gaming).', hello: 'Símbolos VS viram rolos de coringa!',
      symbols: all,
      lineList: { cols: 5, rows: 5, list: L, text: '15 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda. Rolos de duelo se multiplicam entre si.')],
      highlights: ['⚔️ <b>VS</b> (rolos 2 a 4) vira rolo inteiro de coringa com <b>x2 a x100</b> — vários rolos <b>se multiplicam</b>', '🌅 3 Duelos = <b>Duelo ao Amanhecer</b>: 10 giros com muito mais VS', '🃏 3 Mãos do Morto = coleta de coringas multiplicadores que <b>ficam presos</b>', '💰 3 Trens = <b>Assalto ao Trem</b>: 10 giros com coringas colantes', 'Prêmio máximo: <b>12.500x</b>'],
      how: `<p>Grade <b>5×5</b> com <b>15 linhas</b>. ${ico('star')} é coringa.</p><p>⚔️ <b>DuelReels:</b> um símbolo VS nos rolos 2, 3 ou 4 que ajude num ganho vira um <b>rolo inteiro de coringa</b> com multiplicador de <b>x2 a x100</b>. Numa linha com dois ou mais rolos de duelo os multiplicadores <b>se multiplicam</b>.</p>`,
      features: `<ul class="si-list"><li>${ico('hourglass')} <b>3 Duelos — Duelo ao Amanhecer:</b> 10 rodadas grátis com VS muito mais frequentes.</li>
        <li>${ico('cards')} <b>3 Mãos do Morto — Mão do Morto:</b> fase de coleta com 3 respins (cada coringa novo reinicia); os coringas vêm com x2 a x100 e <b>ficam presos</b> para 3 giros finais.</li>
        <li>${ico('locomotive')} <b>3 Trens — Assalto ao Trem:</b> 10 rodadas grátis em que todo coringa que cair <b>fica preso</b> até o fim.</li></ul><p class="muted small">A compra de bônus dá o Duelo ao Amanhecer.</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await duels(rt, g);
        await pay(rt, lines(g, L, SY));
        for (const kind of ['duel', 'dead', 'train']) {
          if (count(g, x => x.kind === kind) >= 3) { rt.mark(cells(g, x => x.kind === kind).map(([c, r]) => key(c, r))); await rt.wait(1000); await this.bonus(rt, { kind }); break; }
        }
      },
      async bonus(rt, { kind = 'duel' } = {}) {
        if (kind === 'duel') {
          await rt.fsLoop(10, async () => { const g = make('dw'); await rt.spin(g, { tease: false }); await duels(rt, g); await pay(rt, lines(g, L, SY)); }, { title: 'DUELO AO AMANHECER', sub: '10 giros · mais duelos' });
        } else if (kind === 'train') {
          const sticky = new Map();
          await rt.fsLoop(10, async () => {
            const g = make('tw');
            sticky.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...x, c: 'sticky' }; });
            await rt.spin(g, { tease: false });
            await duels(rt, g);
            cells(g, x => x.wild && !x.m).forEach(([c, r]) => sticky.set(key(c, r), g[c][r]));
            await pay(rt, lines(g, L, SY));
          }, { title: 'ASSALTO AO TREM', sub: '10 giros · coringas colantes' });
        } else {
          await rt.banner('MÃO DO MORTO', 'Colete coringas multiplicadores', 1500);
          const held = new Map();
          let left = 3;
          while (left > 0) {
            left--;
            rt.chip('fs', 'RESPINS', left);
            let got = 0;
            const g = grid([5, 5, 5, 5, 5], () => ({ id: 'vazio', img: null, c: 'empty' }));
            held.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = x; });
            for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) if (!held.has(key(c, r)) && RNG.float() < 0.045) { const x = { ...WILD, m: wmult(BIG), c: 'sticky', fresh: true }; g[c][r] = x; held.set(key(c, r), x); got++; }
            await rt.drop(g);
            if (got) { left = 3; rt.msg(`🃏 +${got} coringa${got > 1 ? 's' : ''}!`); rt.fx('coin'); }
            await rt.wait(400);
          }
          rt.chip('fs', null);
          await rt.fsLoop(3, async () => {
            const g = make('tw');
            held.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...x, fresh: false }; });
            await rt.spin(g, { tease: false });
            await pay(rt, lines(g, L, SY, { mult: 'add' }));
          }, { title: 'GIROS FINAIS', sub: `${held.size} coringas presos` });
        }
      },
    }));
  })();

  /* =========================================================
     2. Cidade RIP (RIP City) — gato expande, rato multiplica
     ========================================================= */
  (() => {
    const L = K.linesFor(5, 19);
    const SY = [
      S('dinheiro', 'banknote', 'Grana', [2, 6, 20], 3), S('maleta', 'briefcase', 'Maleta', [1.5, 4, 12], 4), S('queijo', 'mousetrap', 'Ratoeira', [1, 3, 8], 4),
      S('cartola', 'sunglasses', 'Óculos', [0.8, 2, 5], 5), ...SUITS([[0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]]),
    ];
    // rw = Bônus Ro$$ (mais gatos), fw = Bônus Maxx
    const CAT = { id: 'cat', img: 'catface', name: 'Gato Ro$$', wild: true, cat: true, reels: [1, 2, 3], w: 0.32, rw: 1.5, fw: 0.8 };
    const MOUSE = { id: 'rato', img: 'mouse', name: 'Rato Maxx', wild: true, w: 0.55, rw: 1.1, fw: 1.3 };
    const SC = { id: 'sc', img: 'pizza', name: 'Pizza', sc: true, w: 0.55, rw: 0.25, fw: 0.25 };
    const all = [...SY, CAT, MOUSE, SC];
    const draw = pool(all);
    const MM = [{ m: 2, w: 50 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 10 }];
    const make = (wk = 'w') => grid([5, 5, 5, 5, 5], c => { const x = draw(c, wk); if (x.id === 'rato') x.m = wmult(MM); return x; });
    const expand = (g, c, m = 1) => { g[c] = Array.from({ length: 5 }, () => ({ ...CAT, m, c: 'duel', fresh: true })); };
    App.register(K.create({
      id: 'cidaderip', name: 'Cidade RIP', studio: STUDIO, art: 'mouse', mascot: 'catface',
      tag: 'Gato expande · rato multiplica até 200x', colors: ['#334155', '#db2777'], bg: 'linear-gradient(180deg,#0f172a,#1e293b 60%,#4a044e)',
      cols: 5, rows: 5, maxWin: 12500, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "RIP City" (Hacksaw Gaming).', hello: 'Gato e rato: a eterna briga!',
      symbols: all,
      lineList: { cols: 5, rows: 5, list: L, text: '19 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['😼 <b>Gato Ro$$</b> (rolos 2 a 4) expande e cobre o rolo inteiro de coringa', '🐭 <b>Rato Maxx</b> é coringa com <b>x2 a x10</b>', '🍕 3 scatters = <b>Bônus Ro$$</b> (muito mais gatos) · 4+ = <b>Bônus Maxx</b> (rolos de gato ativados e ratos somando no gato, até x200)', '🔁 3 scatters nas grátis = <b>+4 giros</b>', 'Prêmio máximo: <b>12.500x</b>'],
      how: `<p>Grade <b>5×5</b> com <b>19 linhas</b>.</p><p>${ico('catface')} <b>Gato:</b> coringa que <b>expande</b> e cobre o rolo inteiro. ${ico('mouse')} <b>Rato:</b> coringa com multiplicador x2 a x10; numa linha, multiplicadores se multiplicam.</p>`,
      features: `<ul class="si-list"><li>🍕 <b>3 scatters — Bônus Ro$$:</b> 10 rodadas grátis com <b>gatos bem mais frequentes</b>. Os gatos não ficam presos: cada um expande só naquele giro, e os ratos que caírem no rolo dele somam no multiplicador do gato.</li>
        <li>🍕 <b>4+ scatters — Bônus Maxx:</b> 10 rodadas grátis. O rolo onde cair um gato fica <b>ativado</b> até o fim: em todo giro ele traz um gato novo, que expande. Cada rato que cair num rolo ativado <b>soma seu multiplicador</b> nele (até x200).</li>
        <li>🔁 Nos dois bônus, <b>3 scatters</b> dão <b>+4 rodadas</b>.</li></ul><p class="muted small">A compra de bônus dá um bônus aleatório: Ro$$ (85%) ou Maxx (15%).</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        for (let c = 0; c < 5; c++) if (g[c].some(x => x.cat)) expand(g, c);
        if (cells(g, x => x.c === 'duel').length) { rt.msg('😼 O gato expandiu!'); await rt.drop(g); }
        await pay(rt, lines(g, L, SY));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = tier([{ v: 3, w: 85 }, { v: 4, w: 15 }]);
        const maxx = sc >= 4, cats = {};
        await rt.fsLoop(10, async api => {
          const g = make(maxx ? 'fw' : 'rw');
          await rt.spin(g, { tease: false });
          const s = count(g, x => x.sc);
          for (let c = 0; c < 5; c++) {
            const rats = g[c].filter(x => x.id === 'rato').reduce((t, x) => t + x.m, 0);
            if (!maxx) {
              // Ro$$: o gato expande só neste giro; ratos no rolo somam no gato
              if (g[c].some(x => x.cat)) expand(g, c, rats || 1);
              continue;
            }
            if (g[c].some(x => x.cat) && !cats[c]) cats[c] = 1;
            if (cats[c]) {
              if (rats) { cats[c] = Math.min(200, (cats[c] === 1 ? 0 : cats[c]) + rats); rt.msg(`🐭 Rato no gato: rolo ${c + 1} vale x${cats[c]}`); }
              expand(g, c, cats[c]);
            }
          }
          if (maxx) rt.head([0, 1, 2, 3, 4].map(c => (cats[c] > 1 ? 'x' + cats[c] : cats[c] ? '😼' : '')));
          if (cells(g, x => x.c === 'duel').length) await rt.drop(g);
          await pay(rt, lines(g, L, SY));
          if (s >= 3) api.add(4);
        }, { title: maxx ? 'BÔNUS MAXX' : 'BÔNUS RO$$', sub: maxx ? 'Rolos de gato ativados · ratos somam no gato!' : 'Muito mais gatos!' });
        rt.head(null);
      },
    }));
  })();

  /* =========================================================
     3. O Bandido Guaxinim (Le Bandit) — 6×5 grupos + quadrados dourados
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : 4);
    const SY = [
      S('cartola', 'cap', 'Boné', [1, 2, 5, 12, 40], 4), S('vinho', 'wine', 'Vinho', [0.8, 1.5, 4, 10, 30], 5), S('baguete', 'baguette', 'Baguete', [0.6, 1.2, 3, 7, 20], 6),
      S('queijo', 'croissant', 'Croissant', [0.5, 1, 2.5, 5, 15], 6), K.L('A', [0.25, 0.5, 1, 2.5, 6], 9), K.L('K', [0.25, 0.5, 1, 2.5, 6], 9),
      K.L('Q', [0.2, 0.4, 0.8, 2, 5], 10), K.L('J', [0.2, 0.4, 0.8, 2, 5], 10),
    ];
    const WILD = { id: 'w', img: 'framed', name: 'Cartaz de procurado', wild: true, w: 0.8 };
    const RAIN = { id: 'arco', img: 'rainbow', name: 'Arco-íris', rainbow: true, noPay: true, w: 0.18, fw: 1.5 };
    const SC = { id: 'sc', img: 'camera', name: 'Câmera', sc: true, w: 0.55, fw: 0.3 };
    const all = [...SY, WILD, RAIN, SC];
    const draw = pool(all);
    const make = (wk = 'w') => K.stack(grid([5, 5, 5, 5, 5, 5], c => draw(c, wk)), 0.25);
    const COIN = () => {
      const r = RNG.float();
      if (r < 0.01) return { t: 'ouro', v: RNG.pick([25, 50, 100, 250, 500]) };
      if (r < 0.18) return { t: 'prata', v: RNG.pick([5, 8, 10, 15, 20]) };
      return { t: 'bronze', v: RNG.pick([0.2, 0.5, 1, 2, 3, 4]) };
    };
    const paint = (g, gold) => g.forEach((col, c) => col.forEach((x, r) => { if (x && gold.has(key(c, r)) && !x.c) x.c = 'gsq'; }));
    async function activate(rt, g, gold) {
      if (!gold.size) return false;
      rt.msg('🌈 Arco-íris! Os quadrados dourados revelam moedas');
      rt.fx('big');
      await rt.wait(600);
      const coins = new Map(), clovers = [];
      gold.forEach(k => { if (RNG.float() < 0.07) clovers.push([k, RNG.pick([2, 2, 3, 4, 5, 10])]); else coins.set(k, COIN()); });
      clovers.forEach(([k, m]) => { const [c, r] = K.unkey(k); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const n = coins.get(key(c + a, r + b)); if (n) n.v *= m; } });
      gold.forEach(k => { const [c, r] = K.unkey(k); const n = coins.get(k); g[c][r] = n ? { id: 'moeda', img: 'coin', v: n.v, c: 'gsq coin-' + n.t, noPay: true } : { id: 'trevo', img: 'clover', t: 'x' + clovers.find(x => x[0] === k)[1], c: 'gsq', noPay: true }; });
      rt.show(g);
      const v = [...coins.values()].reduce((s, n) => s + n.v, 0);
      rt.win(v);
      rt.msg(`🪙 Moedas: ${rt.coins(v)}`);
      rt.fx('coin');
      await rt.wait(1200);
      return true;
    }
    async function play(rt, g, gold, wk, alwaysRainbow) {
      paint(g, gold);
      await tumble(rt, g, {
        draw: c => draw(c, wk),
        evaluate: gg => payClusters(clusters(gg, 5), T),
        onStep: async (step, gg, res) => { res.cells.forEach(k => gold.add(k)); paint(gg, gold); rt.chip('gold', 'DOURADOS', gold.size); },
      });
      const act = alwaysRainbow || g.some(col => col.some(x => x.rainbow)) ? await activate(rt, g, gold) : false;
      return { sc: count(g, x => x.sc), act };
    }
    App.register(K.create({
      id: 'banditoguaxinim', name: 'O Bandido Guaxinim', studio: STUDIO, art: 'raccoon', mascot: 'raccoon',
      tag: 'Quadrados dourados · moedas até 500x', colors: ['#ca8a04', '#2563eb'], bg: 'linear-gradient(180deg,#1e3a8a,#1e40af 60%,#172554)',
      cols: 6, rows: 5, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Le Bandit" (Hacksaw Gaming).', hello: 'Ganhos deixam quadrados dourados!',
      symbols: all, extraSprites: ['coin', 'clover'],
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13+'], SY, 'Grupos de 5+ iguais encostados, com supercascata.')],
      highlights: ['🦝 Grade 6×5 com grupos de 5+ e <b>supercascata</b>', '🟨 Cada posição vencedora vira um <b>quadrado dourado</b>', '🌈 O <b>arco-íris</b> revela moedas nos dourados: bronze (até 4x), prata (até 20x) e <b>ouro (até 500x)</b>; o <b>trevo</b> multiplica as moedas vizinhas', '📷 3/4/5 câmeras = <b>Sorte do Bandido</b>, <b>Tesouro Escondido</b> ou <b>Arco-íris Dourado</b>: os dourados ficam de um giro para o outro', 'Prêmio máximo: <b>10.000x</b>'],
      how: `<p>Grade <b>6×5</b>: grupos de <b>5+</b> iguais encostados pagam e somem (cascata). ${ico('framed')} é coringa.</p><p>Toda posição que fizer parte de um ganho vira um <b>quadrado dourado</b>. Quando um ${ico('rainbow')} <b>arco-íris</b> cai, cada dourado revela uma <b>moeda</b> que paga na hora — ou um ${ico('clover')} <b>trevo</b> que multiplica (x2 a x10) as moedas ao redor.</p>`,
      features: `<ul class="si-list"><li>📷 <b>3 câmeras — Sorte do Bandido:</b> 8 rodadas grátis com mais arco-íris. Os dourados <b>ficam de um giro para o outro</b> até um arco-íris ativá-los; depois disso eles zeram.</li><li>📷 <b>4 câmeras — Tesouro Escondido:</b> 12 rodadas grátis e os dourados <b>ficam a rodada inteira</b>, mesmo depois de ativados.</li><li>📷 <b>5 câmeras — Arco-íris Dourado:</b> 12 rodadas, dourados fixos e <b>arco-íris em todo giro</b>.</li><li>🔁 Nas grátis, <b>3 câmeras</b> dão <b>+2 rodadas</b> e <b>4 ou mais</b> dão <b>+4</b>.</li></ul><p class="muted small">A compra de bônus dá um bônus aleatório: Sorte do Bandido (85%), Tesouro Escondido (13%) ou Arco-íris Dourado (2%).</p>
        <table class="paytable"><tr class="si-head"><td>Moeda</td><td>Valores (x aposta)</td></tr><tr><td>Bronze</td><td>0,2 a 4</td></tr><tr><td>Prata</td><td>5 a 20</td></tr><tr><td>Ouro</td><td>25 a 500</td></tr></table>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.drop(g);
        await play(rt, g, new Set(), 'w', false);
        rt.chip('gold', null);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = tier([{ v: 3, w: 85 }, { v: 4, w: 13 }, { v: 5, w: 2 }]);
        const keep = sc >= 4, every = sc >= 5;
        let gold = new Set();
        await rt.fsLoop(keep ? 12 : 8, async api => {
          const g = make('fw');
          await rt.drop(g);
          const r = await play(rt, g, gold, 'fw', every);
          // Sorte do Bandido: os dourados só zeram depois que um arco-íris os ativa
          if (!keep && r.act) { gold = new Set(); rt.chip('gold', 'DOURADOS', 0); }
          if (r.sc >= 3) api.add(r.sc >= 4 ? 4 : 2);
        }, { title: every ? 'ARCO-ÍRIS DOURADO' : keep ? 'TESOURO ESCONDIDO' : 'SORTE DO BANDIDO', sub: keep ? 'Quadrados dourados não somem!' : 'Dourados ficam até o arco-íris' });
        rt.chip('gold', null);
      },
    }));
  })();

  /* =========================================================
     4. Gangue do Caos 2 (Chaos Crew 2) — multiplicadores sobre os rolos
     ========================================================= */
  (() => {
    const L = K.linesFor(5, 19);
    const SY = [
      S('caveira', 'clown', 'Palhaço', [2, 6, 20], 3), S('bomba', 'radio', 'Rádio', [1.5, 4, 12], 4), S('skate', 'skateboard', 'Skate', [1, 3, 8], 4),
      S('spray', 'palette', 'Tinta', [0.8, 2, 5], 5), ...SUITS([[0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]]),
    ];
    const WILD = { id: 'w', img: 'pouting', name: 'Gato Ranzinza', wild: true, w: 0.8 };
    const SC = { id: 'sc', img: 'collision', name: 'Bônus', sc: true, w: 0.55 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const make = () => grid([5, 5, 5, 5, 5], c => { const x = draw(c); if (x.wild) x.m = wmult([{ m: 2, w: 60 }, { m: 3, w: 25 }, { m: 5, w: 15 }]); return x; });
    const PS = 0.006, PC = 0.013, PE = 0.0005; // chance por casa: caveira, gato, gato épico
    const CATV = [{ v: 0.2, w: 30 }, { v: 0.5, w: 30 }, { v: 1, w: 20 }, { v: 2, w: 10 }, { v: 5, w: 6 }, { v: 10, w: 3 }, { v: 20, w: 1 }];
    App.register(K.create({
      id: 'gangucaos', name: 'Gangue do Caos 2', studio: STUDIO, art: 'skateboard', mascot: 'skull',
      tag: 'Bônus só de multiplicadores · até 20.000x', colors: ['#e11d48', '#facc15'], bg: 'linear-gradient(180deg,#18181b,#27272a 60%,#3f3f46)',
      cols: 5, rows: 5, maxWin: 20000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Chaos Crew 2" (Hacksaw Gaming).', hello: 'O gato ranzinza multiplica!',
      symbols: [...all, { img: 'cat' }],
      lineList: { cols: 5, rows: 5, list: L, text: '19 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['😾 Gato Ranzinza coringa com <b>x2, x3 ou x5</b>', '💥 3 scatters = bônus <b>sem símbolos pagantes</b>: 3 giros que <b>voltam a 3</b> a cada caveira ou gato · 4 = <b>Super Bônus</b> com 7 caveiras já na grade', '💀 Caveiras grudam e <b>somam</b> no multiplicador acima do rolo; 😼 gatos pagam seu valor <b>× o multiplicador do rolo</b>', 'Prêmio máximo: <b>20.000x</b>'],
      how: `<p>Grade <b>5×5</b> com <b>19 linhas</b>. ${ico('pouting')} é coringa com multiplicador; numa linha, multiplicadores se multiplicam.</p>`,
      features: `<p>💥 <b>3 scatters</b> abrem o bônus numa grade só de recursos: você tem <b>3 giros</b>, e toda caveira ou gato que cair <b>reinicia para 3</b>. Acima de cada rolo há um <b>multiplicador</b> que começa em x1:</p>
        <ul class="si-list"><li>${ico('skull')} <b>Caveira:</b> gruda e soma +1 a +3 no multiplicador do rolo <b>em todos os giros seguintes</b>.</li>
        <li>${ico('cat')} <b>Gato:</b> traz um valor (0,2x a 20x) e paga valor × multiplicador do rolo. Alguns <b>grudam</b> e pagam de novo em todo giro.</li>
        <li>${ico('catface')} <b>Gato Épico</b> (raro): multiplica seu valor pela <b>soma de todos</b> os multiplicadores.</li></ul>
        <p>💥 <b>4 scatters — Super Bônus:</b> as mesmas regras, mas o bônus já começa com <b>7 caveiras</b> presas na grade.</p><p class="muted small">A compra de bônus dá um bônus aleatório: normal (85%) ou Super Bônus (15%).</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, lines(g, L, SY));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3, buy = false } = {}) {
        if (buy) sc = tier([{ v: 3, w: 85 }, { v: 4, w: 15 }]);
        const sup = sc >= 4, mult = [1, 1, 1, 1, 1], stick = new Map();
        const skull = () => { const add = RNG.weighted([{ a: 1, w: 60 }, { a: 2, w: 28 }, { a: 3, w: 12 }]).a; return { id: 'cav', img: 'skull', skull: true, add, t: '+' + add, c: 'sticky', fresh: true }; };
        // Super Bônus: 7 caveiras já presas (somam a partir do 1º giro)
        if (sup) while (stick.size < 7) stick.set(key(RNG.int(0, 4), RNG.int(0, 4)), skull());
        rt.head(mult.map(m => 'x' + m));
        await rt.fsLoop(3, async api => {
          let got = 0;
          const g = grid([5, 5, 5, 5, 5], () => ({ id: 'vazio', img: null, c: 'empty' }));
          // caveiras presas somam de novo
          stick.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...x, fresh: false }; if (x.skull) mult[c] += x.add; });
          for (let c = 0; c < 5; c++) for (let r = 0; r < 5; r++) {
            if (stick.has(key(c, r))) continue;
            const p = RNG.float();
            if (p < PS) { const x = skull(); g[c][r] = x; stick.set(key(c, r), x); mult[c] += x.add; got++; }
            else if (p < PS + PC) { const x = { id: 'gato', img: 'cat', v: RNG.weighted(CATV).v, fresh: true }; if (RNG.float() < 0.2) { x.c = 'sticky'; stick.set(key(c, r), x); } g[c][r] = x; got++; }
            else if (p < PS + PC + PE) { const x = { id: 'epico', img: 'catface', v: RNG.weighted(CATV).v, epic: true, c: 'sticky gsq', fresh: true }; g[c][r] = x; stick.set(key(c, r), x); got++; }
          }
          // caveira ou gato novo: os giros voltam a 3
          if (got && api.left < 3) { api.add(3 - api.left, true); rt.msg('💀 Multiplicador novo! Giros de volta a 3'); }
          rt.head(mult.map(m => 'x' + m));
          await rt.drop(g);
          let w = 0;
          const sum = mult.reduce((a, b) => a + b, 0);
          g.forEach((col, c) => col.forEach(x => { if (x.v) w += x.v * (x.epic ? sum : mult[c]); }));
          if (w) { rt.mark(cells(g, x => x.v).map(([c, r]) => key(c, r))); rt.win(w); rt.msg(`😼 Gatos × multiplicadores: ${rt.coins(w)}`); rt.fx('coin'); await rt.wait(900); }
        }, { title: sup ? 'SUPER BÔNUS DO CAOS' : 'BÔNUS DO CAOS', sub: sup ? '7 caveiras já presas · 3 giros que reiniciam' : '3 giros · caveiras e gatos reiniciam', label: 'GIROS' });
        rt.head(null);
      },
    }));
  })();

  /* =========================================================
     5. Mão de Anúbis (Hand of Anubis) — orbes azuis e vermelhos
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : 4);
    const SY = [
      S('anubis', 'fox', 'Anúbis', [1, 2.5, 6, 15, 50], 4), S('olho', 'scroll', 'Papiro', [0.8, 2, 5, 12, 35], 5), S('escaravelho', 'ant', 'Formiga', [0.6, 1.5, 4, 9, 25], 6),
      S('anfora', 'hourglassflow', 'Ampulheta', [0.5, 1.2, 3, 7, 18], 6), K.L('A', [0.25, 0.6, 1.5, 3, 8], 9), K.L('K', [0.25, 0.6, 1.5, 3, 8], 9),
      K.L('Q', [0.2, 0.5, 1.2, 2.5, 6], 10),
    ];
    const BLUE = { id: 'azul', img: 'bluecircle', name: 'Orbe azul', wild: true, orb: 'blue', w: 0.3, fw: 0.4 };
    const RED = { id: 'verm', img: 'redcircle', name: 'Orbe vermelho', wild: true, orb: 'red', w: 0.14, fw: 0.2 };
    const SC = { id: 'sc', img: 'hand', name: 'Mão de Anúbis', sc: true, w: 0.42, fw: 0 };
    const all = [...SY, BLUE, RED, SC];
    const draw = pool(all);
    const cellOf = (c, wk) => { const x = draw(c, wk); if (x.orb) x.m = 1; return x; };
    const make = (wk = 'w') => grid([6, 6, 6, 6, 6], c => cellOf(c, wk));
    async function play(rt, g, wk) {
      return tumble(rt, g, {
        draw: c => cellOf(c, wk),
        evaluate: gg => {
          const cl = clusters(gg, 5);
          return payClusters(cl, T, k => {
            const orbs = k.cells.map(kk => { const [c, r] = K.unkey(kk); return gg[c][r]; }).filter(x => x.orb);
            orbs.forEach(o => { o.m = Math.min(25, o.m + (o.orb === 'blue' ? 1 : Math.floor(k.n / 2))); });
            return Math.min(100, orbs.reduce((s, o) => s * o.m, 1));
          });
        },
      });
    }
    App.register(K.create({
      id: 'maoanubis', name: 'Mão de Anúbis', studio: STUDIO, art: 'eye', mascot: 'skull',
      tag: 'Orbes absorvem e multiplicam', colors: ['#1e3a8a', '#991b1b'], bg: 'linear-gradient(180deg,#0f172a,#172554 50%,#450a0a)',
      cols: 5, rows: 6, maxWin: 10000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Hand of Anubis" (Hacksaw Gaming).', hello: 'Orbes crescem a cada vitória!',
      symbols: all,
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13+'], SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['⚫ Grade 5×6 com grupos e cascata', '🔵 <b>Orbe azul</b>: coringa que soma <b>+1</b> por grupo vencedor', '🔴 <b>Orbe vermelho</b>: coringa que soma <b>+1 por símbolo</b> do grupo', 'Os orbes ficam na grade durante as cascatas e, no mesmo grupo, <b>se multiplicam</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade <b>5×6</b>: grupos de <b>5+</b> iguais encostados pagam, com cascata.</p><p>Os <b>Orbes da Alma</b> são coringas que <b>não somem</b> nas cascatas. Cada vez que um orbe entra num grupo vencedor, o multiplicador dele cresce: o 🔵 azul soma +1 por grupo e o 🔴 vermelho soma +1 por símbolo do grupo. O grupo paga × o produto dos orbes que tocou.</p>',
      features: '<p>💀 <b>3 scatters</b> dão <b>10 rodadas grátis</b> no Submundo: orbes muito mais frequentes e eles <b>ficam presos</b> com seus multiplicadores a rodada inteira.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.drop(g);
        await play(rt, g, 'w');
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const held = new Map();
        await rt.fsLoop(10, async () => {
          const g = make('fw');
          held.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = x; });
          // os orbes que caíram ficam presos nesta posição, com o valor que acumularem
          g.forEach((col, c) => col.forEach((x, r) => { if (x.orb && !held.has(key(c, r)) && held.size < 6) { x.c = 'sticky'; held.set(key(c, r), x); } }));
          await rt.drop(g);
          await play(rt, g, 'fw');
          held.forEach(x => { x.fresh = false; });
        }, { title: 'SUBMUNDO', sub: 'Orbes ficam presos' });
      },
    }));
  })();

  /* =========================================================
     6. Lendas Gladiadoras (Gladiator Legends) — 5×4, 10 linhas, DuelReels
     ========================================================= */
  (() => {
    const L = K.linesFor(4, 10);
    const SY = [
      S('leao', 'rhino', 'Rinoceronte', [3, 8, 25], 3), S('elmo', 'trident', 'Tridente', [2, 5, 15], 4), S('escudo', 'axe', 'Machado', [1.5, 4, 10], 4),
      S('templo', 'stadium', 'Coliseu', [1, 3, 8], 5), ...SUITS([[0.4, 1, 3], [0.4, 1, 3], [0.3, 0.8, 2], [0.3, 0.8, 2]]),
    ];
    const WILD = { id: 'w', img: 'trophy', name: 'Coringa', wild: true, w: 0.8 };
    const VS = { id: 'vs', img: 'vs', name: 'VS', t: 'VS', vs: true, reels: [1, 2, 3], w: 0.4, fw: 0.9 };
    const SC = { id: 'sc', img: 'ticket', name: 'Arena', sc: true, w: 0.68, c: 'gsq' };
    const all = [...SY, WILD, VS, SC];
    const draw = pool(all);
    const make = (wk = 'w') => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const FSM = [{ m: 1, w: 35 }, { m: 2, w: 25 }, { m: 3, w: 15 }, { m: 5, w: 12 }, { m: 10, w: 8 }, { m: 25, w: 3 }, { m: 50, w: 1.2 }, { m: 100, w: 0.5 }, { m: 250, w: 0.1 }, { m: 1000, w: 0.02 }];
    App.register(K.create({
      id: 'gladiadores', name: 'Lendas Gladiadoras', studio: STUDIO, art: 'helmet', mascot: 'lion',
      tag: 'DuelReels · arena até x1.000', colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#78350f,#92400e 60%,#451a03)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Gladiator Legends" (Hacksaw Gaming).', hello: 'Dois gladiadores, um multiplicador!',
      symbols: all,
      lineList: { cols: 5, rows: 4, list: L, text: '10 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['⚔️ <b>DuelReels:</b> o VS mostra dois multiplicadores (x2 a x100); o vencedor do duelo vale para o rolo inteiro de coringa', '🏛️ 3 arenas = <b>Campeões da Arena</b>: respins que reiniciam a cada VS', 'Na arena os multiplicadores ficam <b>acima dos rolos</b> e se acumulam (até x1.000 por duelo)', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>10 linhas</b>.</p><p>⚔️ Um <b>VS</b> nos rolos 2 a 4 que ajude num ganho vira um <b>rolo inteiro de coringa</b>. Ele mostra dois gladiadores com multiplicadores diferentes; o vencedor do duelo define o multiplicador. Rolos de duelo na mesma linha se multiplicam.</p>',
      features: '<p>🏛️ <b>3 arenas</b> abrem os <b>Campeões da Arena</b>: você tem <b>3 giros</b> e cada VS que cair <b>reinicia para 3</b>. Cada VS soma seu multiplicador (x1 a x1.000) no medidor <b>acima do rolo</b>, que não zera; o rolo vira coringa com esse valor.</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        for (let c = 1; c <= 3; c++) {
          if (!g[c].some(x => x.vs)) continue;
          const a = wmult(BIG), b = wmult(BIG), m = RNG.float() < 0.5 ? a : b;
          const test = g.map(col => col.slice());
          test[c] = Array.from({ length: 4 }, () => ({ ...WILD, m }));
          if (lines(test, L, SY).total > lines(g, L, SY).total) {
            rt.msg(`⚔️ Duelo: x${a} contra x${b}... vence x${m}!`);
            rt.fx('boom');
            g[c] = Array.from({ length: 4 }, () => ({ ...WILD, m, c: 'duel', fresh: true }));
            await rt.drop(g);
            await rt.wait(500);
          }
        }
        await pay(rt, lines(g, L, SY));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const above = [0, 0, 0, 0, 0];
        rt.head(above.map(() => ''));
        await rt.fsLoop(3, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          let hit = false;
          for (let c = 1; c <= 3; c++) {
            if (!g[c].some(x => x.vs)) continue;
            hit = true;
            above[c] += wmult(FSM);
          }
          for (let c = 1; c <= 3; c++) if (above[c]) g[c] = Array.from({ length: 4 }, () => ({ ...WILD, m: above[c], c: 'duel', fresh: true }));
          rt.head(above.map(m => (m ? 'x' + m : '')));
          if (hit) { rt.msg('⚔️ Novo duelo! Giros reiniciados'); rt.fx('boom'); await rt.drop(g); api.add(3 - api.left, true); }
          await pay(rt, lines(g, L, SY, { mult: 'add' }));
        }, { title: 'CAMPEÕES DA ARENA', sub: '3 giros · cada VS reinicia', label: 'GIROS' });
        rt.head(null);
      },
    }));
  })();

  /* =========================================================
     7. Unidade Dork (Dork Unit) — presentes com multiplicador
     ========================================================= */
  (() => {
    const L = K.linesFor(4, 16);
    const SY = [
      S('robo', 'robot', 'Palhaço robô', [3, 10, 30], 3), S('alien', 'alien', 'Palhaço alien', [2, 6, 20], 3), S('ursinho', 'teddy', 'Palhaço urso', [1.5, 4, 12], 4),
      S('maca', 'greenapple', 'Maçã verde', [0.4, 1, 3], 7), S('ameixa', 'blueberries', 'Mirtilo', [0.4, 1, 3], 7), S('uva', 'avocado', 'Abacate', [0.3, 0.8, 2], 8), S('banana', 'tomato', 'Tomate', [0.3, 0.8, 2], 8),
    ];
    const GIFT = { id: 'w', img: 'gift', name: 'Presente', wild: true, w: 0.9, fw: 0.9 };
    const SC = { id: 'sc', img: 'balloon', name: 'Lenny', sc: true, w: 0.6, fw: 0 };
    const all = [...SY, GIFT, SC];
    const draw = pool(all);
    const BASEM = [{ m: 2, w: 60 }, { m: 3, w: 28 }, { m: 4, w: 12 }];
    const FSM = [{ m: 2, w: 30 }, { m: 3, w: 22 }, { m: 4, w: 16 }, { m: 5, w: 10 }, { m: 10, w: 8 }, { m: 15, w: 5 }, { m: 20, w: 4 }, { m: 25, w: 2 }, { m: 50, w: 1.5 }, { m: 75, w: 0.7 }, { m: 100, w: 0.5 }, { m: 150, w: 0.2 }, { m: 200, w: 0.1 }];
    const make = (fs = false) => grid([4, 4, 4, 4, 4], c => { const x = draw(c, fs ? 'fw' : 'w'); if (x.wild) x.m = wmult(fs ? FSM : BASEM); return x; });
    App.register(K.create({
      id: 'unidadedork', name: 'Unidade Dork', studio: STUDIO, art: 'gift', mascot: 'robot',
      tag: 'Presentes até x200 nas grátis', colors: ['#16a34a', '#db2777'], bg: 'linear-gradient(180deg,#86efac,#22c55e 50%,#166534)',
      cols: 5, rows: 4, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Dork Unit" (Hacksaw Gaming).', hello: 'Presentes são coringas multiplicadores!',
      symbols: all,
      lineList: { cols: 5, rows: 4, list: L, text: '16 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['🎁 Presentes são coringas com <b>x2, x3 ou x4</b> (na linha, se multiplicam)', '🎈 3 Lennys = <b>10 Giros Dork</b>', 'Nos Giros Dork os presentes <b>grudam</b> e podem valer <b>até x200</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: `<p>Grade <b>5×4</b> com <b>16 linhas</b>. ${ico('gift')} <b>Presentes</b> são coringas com multiplicador; numa linha, os multiplicadores se multiplicam.</p>`,
      features: '<p>🎈 <b>3 scatters (Lenny)</b> dão <b>10 Giros Dork</b>. Os presentes vêm maiores — Pequeno Timmy (x2–x4), Hector Pesado (x5–x20) e Lenny Longo (x25–x200) — e <b>ficam presos</b> até o fim.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, lines(g, L, SY));
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const held = new Map();
        await rt.fsLoop(10, async () => {
          const g = make(true);
          held.forEach((x, k) => { const [c, r] = K.unkey(k); g[c][r] = x; });
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => held.set(key(c, r), { ...g[c][r], c: 'sticky', fresh: false }));
          await pay(rt, lines(g, L, SY, { mult: 'add' }));
        }, { title: 'GIROS DORK', sub: 'Presentes colantes até x200' });
      },
    }));
  })();

  /* =========================================================
     8. Empilha Aí (Stack 'Em) — 5×6 grupos, pilhas multiplicam
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : 4);
    const SY = [
      S('lata', 'can', 'Lata', [0.8, 2, 5, 12, 40], 4), S('bateria', 'battery', 'Bateria', [0.6, 1.5, 4, 9, 30], 5), S('ima', 'magnet', 'Ímã', [0.5, 1.2, 3, 7, 20], 6),
      S('engrenagem', 'gear', 'Engrenagem', [0.4, 1, 2.5, 5, 15], 6), S('chave', 'wrench', 'Chave', [0.2, 0.5, 1.2, 3, 8], 9), S('parafuso', 'nutbolt', 'Parafuso', [0.2, 0.5, 1.2, 3, 8], 9),
      S('caixa', 'toolbox', 'Caixa', [0.15, 0.4, 1, 2.5, 6], 10),
    ];
    const SC = { id: 'sc', img: 'lightbulb', name: 'Bônus', sc: true, w: 0.42, fw: 0 };
    const XS = { id: 'x', img: 'cross', name: 'X', t: 'X', noPay: true, w: 0, fw: 0.25 };
    const QS = { id: 'q', img: 'question', name: '?', t: '?', noPay: true, w: 0, fw: 0.25 };
    const all = [...SY, SC, XS, QS];
    const draw = pool(all);
    const make = (wk = 'w') => K.stack(grid([6, 6, 6, 6, 6], c => draw(c, wk)), 0.25);
    /** Multiplicador da pilha: maior número de símbolos do grupo numa mesma coluna. */
    const stackMult = k => { const per = {}; k.cells.forEach(kk => { const c = kk.split(':')[0]; per[c] = (per[c] || 0) + 1; }); return Math.max(...Object.values(per)); };
    App.register(K.create({
      id: 'empilhaai', name: 'Empilha Aí', studio: STUDIO, art: 'can', mascot: 'can',
      tag: 'Pilhas multiplicam · 5 vidas', colors: ['#0891b2', '#f97316'], bg: 'linear-gradient(180deg,#155e75,#164e63 60%,#083344)',
      cols: 5, rows: 6, maxWin: 10000, vol: 4, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Stack \'Em" (Hacksaw Gaming).', hello: 'Empilhe iguais na mesma coluna!',
      symbols: all,
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13+'], SY, 'Grupos de 5+ iguais encostados, com cascata. O grupo ainda é multiplicado pela altura da pilha.')],
      highlights: ['🥫 Grade 5×6 com grupos e cascata', '📏 Cada grupo paga × a <b>altura da maior pilha</b> dele numa coluna (ex.: 4 iguais na mesma coluna = x4)', '💡 3 scatters = rodadas grátis com <b>5 vidas</b>: giro sem ganho tira uma vida', 'Nas grátis o multiplicador sobe a cada grupo; <b>X</b> multiplica o giro e <b>?</b> dá vidas ou multiplicador', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade <b>5×6</b>: grupos de <b>5+</b> iguais encostados pagam, com cascata.</p><p>📏 <b>Pilhas:</b> embaixo de cada coluna aparece quantos símbolos do grupo estão nela; o grupo paga × a <b>maior pilha</b>.</p>',
      features: '<p>💡 <b>3 scatters</b> abrem as rodadas grátis com <b>5 vidas</b> ❤️. Cada giro sem ganho custa uma vida; com ganho, a vida volta. Cada grupo vencedor soma <b>+1 no multiplicador global</b>, que não zera.</p><ul class="si-list"><li><b>X</b>: multiplica o ganho do giro pelo multiplicador global.</li><li><b>?</b>: dá +1 vida, +2 no multiplicador ou dobra o multiplicador.</li></ul>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.drop(g);
        await tumble(rt, g, { draw: c => draw(c), evaluate: gg => payClusters(clusters(gg, 5), T, stackMult) });
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let M = 1, spins = 0;
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(5, async api => {
          if (++spins > 60) return;
          const g = make('fw');
          await rt.drop(g);
          const t0 = rt.total;
          const r = await tumble(rt, g, {
            draw: c => draw(c, 'fw'),
            evaluate: gg => payClusters(clusters(gg, 5), T, stackMult),
            onStep: async (s, gg, res) => { M += res.wins.length; rt.chip('mult', 'MULT.', 'x' + M); },
          });
          const won = rt.total - t0;
          if (count(g, x => x.id === 'x') && won > 0 && M > 1) { rt.win(won * (M - 1)); rt.msg(`✖️ X multiplica o giro por x${M}!`); rt.fx('big'); await rt.wait(900); }
          for (let i = count(g, x => x.id === 'q'); i > 0; i--) {
            const q = RNG.weighted([{ q: 'vida', w: 40 }, { q: 'mais', w: 40 }, { q: 'dobro', w: 20 }]).q;
            if (q === 'vida') { api.add(1, true); rt.msg('❓ +1 vida!'); } else if (q === 'mais') { M += 2; rt.msg('❓ +2 no multiplicador'); } else { M *= 2; rt.msg('❓ Multiplicador dobrou!'); }
            rt.chip('mult', 'MULT.', 'x' + M);
            await rt.wait(600);
          }
          if (r.total > 0) api.add(1, true);
        }, { sub: '5 vidas ❤️', label: 'VIDAS' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     9. Fortuna dos Mortos-Vivos (Undead Fortune) — coringas que andam
     ========================================================= */
  (() => {
    const L = K.LINES_5x5;
    const SY = [
      S('fantasma', 'ghost', 'Fantasma', [2.5, 8, 25], 3), S('zumbi', 'zombie', 'Zumbi', [2, 6, 18], 3), S('caixao', 'pumpkin', 'Abóbora', [1.5, 4, 12], 4),
      S('aranha', 'spider', 'Aranha', [1, 3, 8], 5), ...SUITS([[0.3, 0.8, 2], [0.3, 0.8, 2], [0.2, 0.6, 1.5], [0.2, 0.6, 1.5]]),
    ];
    const WILD = { id: 'w', img: 'bat', name: 'Morcego', wild: true, w: 0.8 };
    const WALK = { id: 'walk', img: 'troll', name: 'Walk VS', t: 'VS', walk: true, reels: [1, 2, 3, 4], w: 0.28, fw: 0.7 };
    const SC = { id: 'sc', img: 'castle', name: 'Cripta', sc: true, reels: [0, 2, 4], w: 1.0, fw: 0 };
    const all = [...SY, WILD, WALK, SC];
    const draw = pool(all);
    const make = (wk = 'w') => grid([5, 5, 5, 5, 5], c => draw(c, wk));
    const WM = [{ m: 2, w: 40 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 10 }, { m: 25, w: 6 }, { m: 50, w: 2.5 }, { m: 100, w: 1 }, { m: 200, w: 0.4 }];
    async function walkers(rt, g, wk, grow) {
      // duelo com o monstro: vencendo, o rolo vira coringa com multiplicador e anda para a esquerda
      let walk = [];
      for (let c = 1; c < 5; c++) {
        if (!g[c].some(x => x.walk)) continue;
        if (RNG.float() < 0.65) { const m = wmult(WM); walk.push({ c, m }); rt.msg(`🪦 Monstro derrotado! Rolo ${c + 1} vira coringa x${m}`); rt.fx('boom'); }
        else { rt.msg('🧟 O monstro venceu o duelo...'); rt.fx('zombie'); }
        g[c] = g[c].map(x => (x.walk ? RNG.pick(SY) : x));
      }
      const put = gg => walk.forEach(w => { gg[w.c] = Array.from({ length: 5 }, () => ({ ...WILD, m: w.m, c: 'duel', fresh: true })); });
      put(g);
      if (walk.length) await rt.drop(g);
      await pay(rt, lines(g, L, SY));
      while (walk.length && !rt.capped) {
        walk = walk.map(w => ({ c: w.c - 1, m: w.m + (grow ? 1 : 0) })).filter(w => w.c >= 0);
        if (!walk.length) break;
        await rt.wait(500);
        const ng = make(wk).map(col => col.map(x => (x.walk || x.sc ? RNG.pick(SY) : x)));
        put(ng);
        rt.msg('🧟 Os coringas andam um rolo para a esquerda...');
        await rt.spin(ng, { tease: false });
        await pay(rt, lines(ng, L, SY));
      }
    }
    App.register(K.create({
      id: 'mortosvivos', name: 'Fortuna dos Mortos-Vivos', studio: STUDIO, art: 'zombie', mascot: 'zombie',
      tag: 'Coringas que andam até x200', colors: ['#4d7c0f', '#581c87'], bg: 'linear-gradient(180deg,#1a2e05,#14532d 50%,#2e1065)',
      cols: 5, rows: 5, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Undead Fortune" (Hacksaw Gaming).', hello: 'Derrote o monstro e o coringa anda!',
      symbols: all,
      lineList: { cols: 5, rows: 5, list: L, text: '15 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['🪦 <b>Walk VS</b> (rolos 2 a 5): derrote o monstro e o rolo vira coringa com <b>x2 a x200</b>', '🧟 O coringa <b>anda um rolo para a esquerda</b> a cada respin, pagando de novo', '💀 3 tumbas (rolos 1, 3 e 5) = <b>10 rodadas grátis</b> com mais Walk VS e multiplicador <b>+1 a cada passo</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade <b>5×5</b> com <b>15 linhas</b>. 🦇 é coringa.</p><p>🪦 <b>Walking Duels:</b> o Walk VS revela um monstro. Vencendo o duelo, o rolo inteiro vira coringa com multiplicador e, a cada respin, <b>anda um rolo para a esquerda</b> até sair da grade.</p>',
      features: '<p>💀 <b>3 tumbas</b> (rolos 1, 3 e 5) dão <b>10 rodadas grátis</b>: o Walk VS aparece bem mais e cada passo do coringa <b>soma +1</b> no multiplicador dele.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await walkers(rt, g, 'w', false);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        await rt.fsLoop(10, async () => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await walkers(rt, g, 'fw', true);
        }, { title: 'BÔNUS DA TUMBA', sub: 'Coringas crescem ao andar' });
      },
    }));
  })();

  /* =========================================================
     10. Despencou (Drop'em) — 5×6, 7.776 caminhos
     ========================================================= */
  (() => {
    const HI = [S('gema', 'ringedplanet', 'Planeta', [0.8, 2, 6, 12], 4), S('safira', 'globe', 'Terra', [0.6, 1.5, 4, 9], 5), S('topazio', 'astronaut', 'Astronauta', [0.5, 1.2, 3, 7], 5)];
    const LO = [K.L('A', [0.2, 0.5, 1.2, 3], 8), K.L('K', [0.2, 0.5, 1.2, 3], 8), K.L('Q', [0.15, 0.4, 1, 2.5], 9), K.L('J', [0.15, 0.4, 1, 2.5], 9)];
    const SY = [...HI, ...LO];
    const WILD = { id: 'w', img: 'milkyway', name: 'Via Láctea', wild: true, w: 0.3 };
    const DROP = { id: 'drop', img: 'droplet', name: 'Drop', drop: true, noPay: true, w: 0.45, fw: 2 };
    const SC = { id: 'sc', img: 'saucer', name: 'Disco voador', sc: true, w: 0.42, fw: 0 };
    const all = [...SY, WILD, DROP, SC];
    const draw = pool(all);
    const make = (wk = 'w') => K.stack(grid([6, 6, 6, 6, 6], c => draw(c, wk)), 0.4);
    async function play(rt, g, mode) {
      await pay(rt, ways(g, SY));
      let guard = 0;
      while (g.some(col => col.some(x => x.drop)) && guard++ < 6 && !rt.capped) {
        const fill = mode === 'wild' ? WILD : mode === 'high' ? RNG.pick(HI) : RNG.pick(SY);
        const holes = [];
        g.forEach((col, c) => { const r0 = col.findIndex(x => x.drop); if (r0 >= 0) for (let r = r0; r < col.length; r++) holes.push([c, r]); });
        rt.msg(`💧 Drop! Os buracos viram ${fill.name}`);
        rt.fx('boom');
        await rt.wait(500);
        holes.forEach(([c, r]) => { g[c][r] = { ...fill, fresh: true }; });
        await rt.drop(g);
        await pay(rt, ways(g, SY));
      }
    }
    App.register(K.create({
      id: 'despencou', name: 'Despencou', studio: STUDIO, art: 'droplet', mascot: 'droplet',
      tag: 'Drop preenche com um só símbolo', colors: ['#0284c7', '#7c3aed'], bg: 'linear-gradient(180deg,#0c4a6e,#1e1b4b 70%)',
      cols: 5, rows: 6, maxWin: 10000, vol: 4, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Drop \'Em" (Hacksaw Gaming).', hello: 'O Drop limpa a coluna inteira para baixo!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '7.776 caminhos (5 rolos × 6 linhas).')],
      highlights: ['💧 <b>Drop</b> desce até o fundo da coluna removendo tudo no caminho', 'Todos os buracos são preenchidos com <b>um único símbolo</b> sorteado — e a grade paga de novo', '💣 3/4/5 scatters = <b>Drop</b>, <b>High Drop</b> (só altos) ou <b>Wild Drop</b> (buracos viram coringa), 10 giros', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade <b>5×6</b> com <b>7.776 caminhos</b>.</p><p>💧 Se um <b>Drop</b> cair, ele desce até o fundo da coluna removendo os símbolos abaixo. Todos os espaços abertos são preenchidos com <b>o mesmo símbolo</b>, sorteado na hora, e os ganhos são contados de novo.</p>',
      features: '<ul class="si-list"><li>💣 <b>3 scatters — Drop Spins:</b> 10 giros com muito mais Drops.</li><li>💣 <b>4 scatters — High Drop:</b> os buracos só viram símbolos altos.</li><li>💣 <b>5 scatters — Wild Drop:</b> os buracos viram <b>coringas</b>.</li></ul>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, 'base');
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const mode = sc >= 5 ? 'wild' : sc === 4 ? 'high' : 'drop';
        await rt.fsLoop(10, async () => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, mode);
        }, { title: { wild: 'WILD DROP', high: 'HIGH DROP', drop: 'DROP SPINS' }[mode], sub: '10 giros' });
      },
    }));
  })();
})();
