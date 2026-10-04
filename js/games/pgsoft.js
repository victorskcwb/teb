'use strict';

/* =========================================================
   Slots no estilo PG Soft (SlotKit) — sem a linha "Fortune".
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, cascade, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'pgsoft';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));

  /** Moldura prata → símbolo com moldura dourada → coringa (Wilds-on-the-Way). */
  const frames = (syms, wild) => x => {
    if (x.frame === 'silver') return { ...RNG.pick(syms), frame: 'gold', gold: true, fresh: true };
    if (x.frame === 'gold') return { ...wild, fresh: true };
    return null;
  };
  const silver = (x, c, p, reels = [1, 2, 3, 4]) => {
    if (!x.wild && !x.sc && reels.includes(c) && RNG.float() < p) { x.frame = 'silver'; x.c = 'fsilver'; }
    return x;
  };

  /* =========================================================
     1 e 2. Caminhos do Mahjong (Mahjong Ways 1 e 2)
     ========================================================= */
  function mahjong(cfg) {
    const SY = cfg.syms;
    const WILD = { id: 'w', img: cfg.wildImg, name: 'Lingote', wild: true, c: 'tile', w: 0 };
    const SC = { id: 'sc', img: cfg.scImg, name: 'Hu', sc: true, c: 'tile', w: cfg.scW, fw: cfg.scW * 0.8 };
    const all = [...SY, SC];
    const draw = pool(all);
    const BASE = [1, 2, 3, 5], FS = [2, 4, 6, 10];
    const cell = (c, wk, fs) => {
      const x = draw(c, wk);
      if (!x.sc && c >= 1 && c <= cfg.cols - 2 && RNG.float() < (fs ? cfg.goldFS : cfg.gold)) { x.gold = true; x.frame = 'gold'; }
      return x;
    };
    const make = (wk = 'w', fs = false) => K.stack(grid(cfg.heights, c => cell(c, wk, fs)), 0.3);
    const ladder = (L, i) => L.map((m, j) => (j === Math.min(i, 3) ? `<b>x${m}</b>` : `x${m}`)).join(' · ');

    async function play(rt, g, fs) {
      const L = fs ? FS : BASE;
      rt.chip('mult', 'MULT.', 'x' + L[0]);
      const r = await tumble(rt, g, {
        draw: c => ({ ...cell(c, fs ? 'fw' : 'w', fs) }),
        evaluate: gg => ways(gg, SY),
        mult: step => L[Math.min(step, 3)],
        convert: x => (x.gold ? { ...WILD, fresh: true } : null),
        onStep: async step => { rt.chip('mult', 'MULT.', 'x' + L[Math.min(step, 3)]); },
      });
      rt.chip('mult', null);
      return r;
    }

    return K.create({
      id: cfg.id, name: cfg.name, studio: STUDIO, art: cfg.art, mascot: cfg.mascot,
      tag: cfg.tag, colors: cfg.colors, bg: cfg.bg,
      cols: cfg.cols, rows: 5, cellH: 1.25, maxWin: cfg.maxWin, vol: 3, rtp: cfg.rtp, target: cfg.target,
      intro: cfg.intro, hello: 'Peças douradas viram coringa!',
      symbols: [...all, WILD],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, `${cfg.waysTxt} caminhos fixos. Iguais em rolos seguidos a partir da esquerda.`)],
      highlights: [`🀄 ${cfg.layout} com <b>${cfg.waysTxt} caminhos</b> e <b>cascata</b>`, '🪙 Peças com <b>moldura dourada</b> (rolos do meio) viram <b>coringa</b> quando ganham', `Multiplicador sobe a cada cascata: <b>x1 → x2 → x3 → x5</b> (nas rodadas grátis <b>x2 → x4 → x6 → x10</b>)`, `🀄 3 Hu = <b>${cfg.fs} rodadas grátis</b> (+2 por Hu extra)`, `Prêmio máximo: <b>${fmt(cfg.maxWin).replace(',00', '')}x</b>`],
      how: `<p>${cfg.layout}: <b>${cfg.waysTxt} caminhos</b>. Peças iguais em rolos seguidos a partir da esquerda pagam; as vencedoras somem e novas caem (<b>cascata</b>).</p>
        <p>Peças com <b>moldura dourada</b> nos rolos do meio, quando fazem parte de um ganho, <b>viram o coringa ${ico(cfg.wildImg)}</b> em vez de sumir.</p>
        <p>A barra de multiplicador sobe a cada cascata seguida: ${ladder(BASE, 9)}.</p>`,
      features: `<p>${ico(cfg.scImg)} <b>3 Hu (scatter)</b> em qualquer lugar dão <b>${cfg.fs} rodadas grátis</b>; cada Hu extra dá +2. 3+ Hu durante elas dão mais giros.</p>
        <p>Nas rodadas grátis os multiplicadores dobram: ${ladder(FS, 9)} e aparecem mais peças douradas.</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        await rt.fsLoop(cfg.fs + (sc - 3) * 2, async api => {
          const g = make('fw', true);
          await rt.spin(g, { tease: false });
          await play(rt, g, true);
          const s = count(g, x => x.sc);
          if (s >= 3) api.add(cfg.fs + (s - 3) * 2);
        }, { sub: 'Multiplicadores dobrados!' });
      },
    });
  }
  const tile = (id, img, name, pays, w) => S(id, img, name, pays, w, { c: 'tile' });
  App.register(mahjong({
    id: 'mahjong1', name: 'Caminhos do Mahjong', art: 'mahjong', mascot: 'mahjong', wildImg: 'coin', scImg: 'mahjong', heights: [4, 4, 4, 4, 4], cols: 5, layout: 'Grade 5×4', waysTxt: '1.024',
    tag: 'Peças douradas · x10 nas grátis', colors: ['#15803d', '#b91c1c'], bg: 'linear-gradient(180deg,#14532d,#166534 60%,#052e16)',
    intro: 'Inspirado no "Mahjong Ways" (PG Soft).', fs: 12, maxWin: 25000, rtp: '~96,9%', target: 0.969, scW: 0.62, gold: 0.1, goldFS: 0.3,
    syms: [tile('fa', 'redenvelope', 'Fa verde', [1.5, 3, 5], 3), tile('zhong', 'lantern', 'Zhong', [1, 2.5, 4], 4), tile('bai', 'panda', 'Panda', [0.8, 2, 3], 5),
      tile('8w', 'bamboo', 'Bambu', [0.6, 1.5, 2.5], 6), tile('5t', 'turtle', 'Tartaruga', [0.3, 0.8, 1.5], 8), tile('5s', 'mooncake', '5 Bambu', [0.3, 0.8, 1.5], 8),
      tile('2t', 'tangerine', 'Tangerina', [0.15, 0.4, 0.8], 10), tile('2s', 'moonview', 'Lua cheia', [0.15, 0.4, 0.8], 10)],
  }));
  App.register(mahjong({
    id: 'mahjong2', name: 'Caminhos do Mahjong 2', art: 'fortunecookie', mascot: 'dumpling', wildImg: 'yen', scImg: 'fireworks', heights: [4, 5, 5, 5, 4], cols: 5, layout: 'Rolos 4-5-5-5-4', waysTxt: '2.000',
    tag: '2.000 caminhos · até 100.000x', colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#7f1d1d,#991b1b 60%,#450a0a)',
    intro: 'Inspirado no "Mahjong Ways 2" (PG Soft).', fs: 10, maxWin: 100000, rtp: '~96,9%', target: 0.969, scW: 0.55, gold: 0.1, goldFS: 0.3,
    syms: [tile('fa', 'dumpling', 'Dumpling', [1.5, 3, 5], 3), tile('zhong', 'fortunecookie', 'Biscoito da sorte', [1, 2.5, 4], 4), tile('bai', 'chopsticks', 'Hashi', [0.8, 2, 3], 5),
      tile('8w', 'bento', 'Bentô', [0.6, 1.5, 2.5], 6), tile('5t', 'teacup', 'Chá', [0.3, 0.8, 1.5], 8), tile('5s', 'fishcake', 'Narutomaki', [0.3, 0.8, 1.5], 8),
      tile('2t', 'riceball', 'Onigiri', [0.15, 0.4, 0.8], 10), tile('2s', 'ricecracker', 'Biscoito de arroz', [0.15, 0.4, 0.8], 10)],
  }));

  /* =========================================================
     3. Ninho do Dragão (Dragon Hatch) — 5×5 grupos de 4+
     ========================================================= */
  (() => {
    const T = n => (n < 4 ? -1 : n === 4 ? 0 : n === 5 ? 1 : n === 6 ? 2 : n === 7 ? 3 : n === 8 ? 4 : n <= 10 ? 5 : 6);
    const HI = [S('rubi', 'dragon', 'Dragão', [1, 2, 3, 5, 8, 15, 40], 5), S('safira', 'sauropod', 'Dinossauro', [0.8, 1.5, 2.5, 4, 6, 12, 30], 6), S('topazio', 'crocodile', 'Crocodilo', [0.6, 1.2, 2, 3, 5, 10, 25], 6)];
    const LO = [S('ovo', 'egg', 'Ovo', [0.3, 0.5, 0.8, 1.2, 2, 4, 10], 9), S('chama', 'fire', 'Chama', [0.25, 0.4, 0.7, 1, 1.6, 3, 8], 10), S('cristal', 'wood', 'Lenha', [0.2, 0.35, 0.6, 0.9, 1.4, 2.5, 6], 10), S('pena', 'leaf', 'Folha', [0.2, 0.3, 0.5, 0.8, 1.2, 2, 5], 11)];
    const SY = [...HI, ...LO];
    const WILD = { id: 'w', img: 'dragonface', name: 'Coringa', wild: true, w: 0.6 };
    const all = [...SY, WILD];
    const draw = pool(all);
    const make = () => grid([5, 5, 5, 5, 5], c => draw(c));
    const DRAGONS = [
      { at: 30, id: 'terra', name: 'Dragão da Terra', desc: 'remove os símbolos baixos' },
      { at: 50, id: 'agua', name: 'Dragão da Água', desc: '4 coringas na grade' },
      { at: 70, id: 'fogo', name: 'Dragão do Fogo', desc: 'um símbolo em xadrez' },
      { at: 100, id: 'rainha', name: 'Rainha dos Dragões', desc: 'baixos viram altos ou coringas' },
    ];
    const isLow = x => LO.some(s => s.id === x.id);

    App.register(K.create({
      id: 'ninhodragao', name: 'Ninho do Dragão', studio: STUDIO, art: 'egg', mascot: 'dragon',
      tag: 'Grupos · 4 dragões na barra', colors: ['#16a34a', '#7c3aed'], bg: 'radial-gradient(circle at 50% 100%,#7c2d12,#1e1b4b 70%)',
      cols: 5, rows: 5, maxWin: 15000, vol: 3, rtp: '~96,8%', target: 0.968, buy: false,
      intro: 'Inspirado no "Dragon Hatch" (PG Soft).',
      hello: 'Encha a barra para chamar os dragões!',
      symbols: all,
      tables: [table('Pagamento por tamanho do grupo', ['4', '5', '6', '7', '8', '9–10', '11+'], SY, 'Grupos de 4+ iguais encostados (horizontal/vertical) pagam, com cascata.')],
      highlights: ['🥚 Grade <b>5×5</b>: grupos de <b>4+</b> iguais encostados, com cascata', '🐉 Cada símbolo eliminado enche a barra; em <b>30, 50, 70 e 100</b> um dragão ajuda', '👑 A Rainha dos Dragões transforma os baixos em altos ou coringas', 'Prêmio máximo: <b>15.000x</b>'],
      how: `<p>Grade <b>5×5</b>: grupos de <b>4 ou mais</b> iguais encostados pagam. Os vencedores somem e novos caem (<b>cascata</b>). ${ico('dragonface')} é coringa.</p>`,
      features: `<p>Cada símbolo eliminado numa sequência de cascatas soma 1 na <b>barra dos dragões</b> (zera a cada giro):</p>
        <ul class="si-list">${DRAGONS.map(d => `<li><b>${d.at}</b> — ${d.name}: ${d.desc}.</li>`).join('')}</ul>
        <p class="muted small">Este jogo não tem rodadas grátis nem compra de bônus.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.drop(g);
        let n = 0;
        const done = new Set();
        rt.chip('bar', 'BARRA', 0);
        await tumble(rt, g, {
          draw: c => draw(c),
          evaluate: gg => payClusters(clusters(gg, 4), T),
          onStep: async (step, gg, res) => {
            n += res.cells.size;
            rt.chip('bar', 'BARRA', n);
            for (const d of DRAGONS) {
              if (n < d.at || done.has(d.id)) continue;
              done.add(d.id);
              rt.msg(`🐉 ${d.name}: ${d.desc}!`);
              rt.fx('big');
              await rt.wait(700);
              if (d.id === 'terra') cascade(gg, cells(gg, isLow).map(([c, r]) => key(c, r)), c => RNG.pick(HI));
              if (d.id === 'agua') for (let i = 0; i < 4; i++) { const c = RNG.int(0, 4); gg[c][RNG.int(0, 4)] = { ...WILD, fresh: true }; }
              if (d.id === 'fogo') { const s = RNG.pick(SY); gg.forEach((col, c) => col.forEach((_, r) => { if ((c + r) % 2 === 0) gg[c][r] = { ...s, fresh: true }; })); }
              if (d.id === 'rainha') gg.forEach((col, c) => col.forEach((x, r) => { if (isLow(x)) gg[c][r] = { ...(RNG.float() < 0.25 ? WILD : RNG.pick(HI)), fresh: true }; }));
            }
          },
        });
        rt.chip('bar', null);
      },
      async bonus() {},
    }));
  })();

  /* =========================================================
     4. Bandido Selvagem (Wild Bandito) — 5×4, multiplicador +1
     ========================================================= */
  (() => {
    const SY = [
      S('caveira', 'skull', 'Caveira', [1.2, 2.5, 5], 3), S('violao', 'guitar', 'Violão', [1, 2, 4], 4), S('pimenta', 'pepper', 'Pimenta', [0.8, 1.6, 3], 5),
      S('maracas', 'maracas', 'Maracas', [0.6, 1.2, 2.5], 5), S('rosa', 'rose', 'Rosa', [0.3, 0.6, 1.2], 8), S('cacto', 'cactus', 'Cacto', [0.25, 0.5, 1], 8),
      S('flor', 'hibiscus', 'Hibisco', [0.2, 0.4, 0.8], 9), S('vela', 'taco', 'Taco', [0.15, 0.3, 0.6], 10),
    ];
    const WILD = { id: 'w', img: 'disguised', name: 'Bandido', wild: true, w: 0 };
    const SC = { id: 'sc', img: 'bell', name: 'Sino', sc: true, w: 0.55, fw: 0.5 };
    const all = [...SY, SC];
    const draw = pool(all);
    const cell = (c, fs) => { const x = draw(c, fs ? 'fw' : 'w'); if (!x.sc && c >= 1 && c <= 3 && RNG.float() < (fs ? 0.3 : 0.12)) x.gold = true; return x; };
    const make = (fs = false) => K.stack(grid([4, 4, 4, 4, 4], c => cell(c, fs)), 0.25);
    async function play(rt, g, fs, m0) {
      let m = m0;
      rt.chip('mult', 'MULT.', 'x' + m);
      const r = await tumble(rt, g, {
        draw: c => cell(c, fs),
        evaluate: gg => ways(gg, SY),
        mult: () => m,
        convert: x => (x.gold ? { ...WILD, fresh: true } : null),
        onStep: async () => { m++; rt.chip('mult', 'MULT.', 'x' + m); },
      });
      return { ...r, m };
    }
    App.register(K.create({
      id: 'bandidoselvagem', name: 'Bandido Selvagem', studio: STUDIO, art: 'skull', mascot: 'skull',
      tag: 'Multiplicador infinito +1', colors: ['#c2410c', '#0f766e'], bg: 'linear-gradient(180deg,#9a3412,#7c2d12 60%,#431407)',
      cols: 5, rows: 4, maxWin: 25000, vol: 3, rtp: '~96,7%', target: 0.967,
      intro: 'Inspirado no "Wild Bandito" (PG Soft).',
      hello: 'Cada cascata soma +1 no multiplicador!',
      symbols: [...all, WILD],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '1.024 caminhos. Iguais em rolos seguidos a partir da esquerda.')],
      highlights: ['💀 Grade 5×4 com <b>1.024 caminhos</b> e <b>cascata</b>', '♾️ Cada cascata com ganho soma <b>+1 no multiplicador</b>, sem limite', '🥇 Símbolos dourados (rolos 2 a 4) viram <b>coringa</b> ao ganhar', '☠️ 3 scatters = <b>12 rodadas grátis</b> (+2 por extra) com o multiplicador <b>que não zera</b> e todos os rolos do meio dourados', 'Prêmio máximo: <b>25.000x</b>'],
      how: `<p>Grade <b>5×4</b> com <b>1.024 caminhos</b>. Iguais em rolos seguidos pagam e as cascatas continuam até não haver mais ganho.</p>
        <p>O multiplicador começa em <b>x1</b> e soma <b>+1</b> a cada cascata com ganho. No jogo base ele volta a x1 no giro seguinte.</p>
        <p>Símbolos com <b>moldura dourada</b> nos rolos 2, 3 e 4 viram ${ico('disguised')} coringa quando fazem parte de um ganho.</p>`,
      features: `<p>${ico('bell')} <b>3 scatters</b> dão <b>12 rodadas grátis</b> (+2 para cada scatter extra; 3+ nelas dão mais giros).</p><p>Nas rodadas grátis <b>todos</b> os símbolos dos rolos 2 a 4 vêm dourados e o multiplicador <b>não zera</b> entre os giros.</p>`,
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false, 1);
        rt.chip('mult', null);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let m = 1;
        await rt.fsLoop(12 + (sc - 3) * 2, async api => {
          const g = make(true);
          await rt.spin(g, { tease: false });
          m = (await play(rt, g, true, m)).m;
          const s = count(g, x => x.sc);
          if (s >= 3) api.add(12 + (s - 3) * 2);
        }, { sub: 'O multiplicador não zera!' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     5 e 9. Tesouros Astecas / Riquezas do Duende — molduras
     ========================================================= */
  function framed(cfg) {
    const SY = cfg.syms;
    const WILD = { id: 'w', img: cfg.wildImg, name: 'Coringa', wild: true, reels: cfg.wildReels || [], w: cfg.wildW || 0 };
    const SC = { id: 'sc', img: cfg.scImg, name: cfg.scName, sc: true, w: cfg.scW, fw: cfg.scW * 0.8 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const cell = (c, wk = 'w') => silver(draw(c, wk), c, wk === 'fw' ? cfg.silver * 2.5 : cfg.silver);
    const make = (wk = 'w') => K.stack(grid(cfg.heights(), c => cell(c, wk)), cfg.stack);
    const conv = frames(SY, WILD);
    async function play(rt, g, fs, st) {
      if (st.m != null) rt.chip('mult', 'MULT.', 'x' + st.m);
      return tumble(rt, g, {
        draw: c => cell(c, fs ? 'fw' : 'w'),
        evaluate: gg => ways(gg, SY),
        mult: () => st.m || 1,
        convert: conv,
        onStep: async () => { if (st.m != null) { st.m += fs ? cfg.fsStep : cfg.baseStep; rt.chip('mult', 'MULT.', 'x' + st.m); } },
      });
    }
    return K.create({
      ...cfg.meta, studio: STUDIO, symbols: all, cellH: 1.2,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, cfg.waysNote)],
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false, { m: cfg.baseStep ? 1 : null });
        rt.chip('mult', null);
        const sc = count(g, x => x.sc);
        if (sc >= cfg.scMin) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = cfg.scMin } = {}) {
        const st = { m: cfg.fsStart };
        await rt.fsLoop(cfg.fsCount(sc), async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, true, st);
          const s = count(g, x => x.sc);
          if (s >= cfg.scMin) api.add(cfg.fsCount(s));
        }, { sub: 'O multiplicador não zera!' });
        rt.chip('mult', null);
      },
    });
  }
  App.register(framed({
    meta: {
      id: 'tesourosastecas', name: 'Tesouros Astecas', art: 'moai', mascot: 'sun',
      tag: 'Até 32.400 caminhos · mult. sem limite', colors: ['#15803d', '#b45309'], bg: 'linear-gradient(180deg,#365314,#3f6212 60%,#1a2e05)',
      cols: 6, rows: 6, maxWin: 9071, vol: 3, rtp: '~96,7%', target: 0.967,
      intro: 'Inspirado no "Treasures of Aztec" (PG Soft).', hello: 'Molduras viram coringas!',
      highlights: ['🗿 6 rolos de altura variável: até <b>32.400 caminhos</b>, com cascata', '🖼️ Moldura <b>prata</b> que ganha vira <b>dourada</b>; dourada que ganha vira <b>coringa</b>', '☀️ 4+ sóis = <b>10 rodadas grátis</b> (+2 por extra): multiplicador começa em <b>x2</b>, sobe <b>+2</b> por cascata e <b>nunca zera</b>', 'Prêmio máximo: <b>9.071x</b>'],
      how: `<p><b>6 rolos</b> de altura variável (até 5-6-6-6-6-5 = 32.400 caminhos). Iguais em rolos seguidos pagam e há <b>cascata</b>. No jogo base o multiplicador sobe <b>+1</b> por cascata (x1, x2, x3…).</p>
        <p>Símbolos dos rolos 2 a 5 podem vir com <b>moldura prata</b>: ao ganhar viram outro símbolo com <b>moldura dourada</b>; a dourada, ao ganhar de novo, vira <b>coringa</b>.</p>`,
      features: '<p>☀️ <b>4 ou mais sóis</b> dão <b>10 rodadas grátis</b> (+2 por sol extra; 4+ nelas dão mais giros). O multiplicador começa em <b>x2</b>, soma <b>+2</b> a cada cascata com ganho e <b>não zera</b> até o fim do bônus.</p>',
    },
    syms: [S('mascara', 'moai', 'Máscara', [1, 2, 4, 8], 3), S('aguia', 'peacock', 'Pavão', [0.8, 1.6, 3, 6], 4), S('serpente', 'snake', 'Serpente', [0.6, 1.2, 2.5, 5], 5),
      S('milho', 'corn', 'Milho', [0.5, 1, 2, 4], 5), K.L('A', [0.2, 0.4, 0.8, 1.5], 8), K.L('K', [0.2, 0.4, 0.8, 1.5], 8),
      K.L('Q', [0.15, 0.3, 0.6, 1.2], 9), K.L('J', [0.15, 0.3, 0.6, 1.2], 9)],
    wildImg: 'sun', scImg: 'snowcap', scName: 'Sol', scW: 1.0, scMin: 4, silver: 0.1, stack: 0.35,
    heights: () => [RNG.int(3, 5), RNG.int(3, 6), RNG.int(3, 6), RNG.int(3, 6), RNG.int(3, 6), RNG.int(3, 5)],
    baseStep: 1, fsStart: 2, fsStep: 2, fsCount: s => 10 + (s - 4) * 2,
    waysNote: 'Rolos de altura variável (até 32.400 caminhos). Iguais em rolos seguidos a partir da esquerda.',
  }));
  App.register(framed({
    meta: {
      id: 'riquezasduende', name: 'Riquezas do Duende', art: 'shamrock', mascot: 'tophat',
      tag: '46.656 caminhos · mult. +1 sem fim', colors: ['#15803d', '#ca8a04'], bg: 'linear-gradient(180deg,#14532d,#15803d 60%,#052e16)',
      cols: 6, rows: 6, maxWin: 10000, vol: 3, rtp: '~97,3%', target: 0.973,
      intro: 'Inspirado no "Leprechaun Riches" (PG Soft).', hello: 'Molduras viram duendes coringa!',
      highlights: ['☘️ Grade 6×6 com <b>46.656 caminhos</b> e cascata', '🎩 Duende coringa nos rolos 2 a 5', '🖼️ Moldura prata → dourada → <b>coringa</b> (Coringas no Caminho)', '🌈 3/4/5 arco-íris = <b>10/15/20 rodadas grátis</b> com multiplicador <b>+1 por ganho</b> que nunca zera', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade <b>6×6</b>: <b>46.656 caminhos</b>. Iguais em rolos seguidos pagam, com <b>cascata</b>. O 🎩 duende é coringa (rolos 2 a 5).</p><p>Símbolos com <b>moldura prata</b> que ganham ficam com <b>moldura dourada</b>; ganhando de novo viram <b>coringa</b>.</p>',
      features: '<p>🌈 <b>3, 4 ou 5 arco-íris</b> dão <b>10, 15 ou 20 rodadas grátis</b>. O multiplicador começa em <b>x1</b> e soma <b>+1 a cada ganho</b>, sem zerar até o fim.</p>',
    },
    syms: [S('pote', 'honeypot', 'Pote de mel', [1, 2, 4, 8], 3), S('cerveja', 'beer', 'Caneca', [0.8, 1.5, 3, 6], 4), S('cartola', 'tophat', 'Cartola', [0.6, 1.2, 2.5, 5], 5),
      S('moeda', 'pound', 'Libra', [0.5, 1, 2, 4], 5), K.L('A', [0.2, 0.4, 0.8, 1.5], 8), K.L('K', [0.2, 0.4, 0.8, 1.5], 8),
      K.L('Q', [0.15, 0.3, 0.6, 1.2], 9), K.L('J', [0.15, 0.3, 0.6, 1.2], 9)],
    wildImg: 'shamrock', wildReels: [1, 2, 3, 4], wildW: 0.8, scImg: 'clover', scName: 'Arco-íris', scW: 0.22, scMin: 3, silver: 0.08, stack: 0.4,
    heights: () => [6, 6, 6, 6, 6, 6],
    baseStep: 0, fsStart: 1, fsStep: 1, fsCount: s => ({ 3: 10, 4: 15 }[s] || 20),
    waysNote: 'Grade 6×6 = 46.656 caminhos. Iguais em rolos seguidos a partir da esquerda.',
  }));

  /* =========================================================
     6. Ouro de Ganesha (Ganesha Gold) — 5×3, 243 caminhos
     ========================================================= */
  (() => {
    const SY = [
      S('ganesha', 'elephant', 'Ganesha', [2, 6, 15], 3), S('lotus', 'lotus', 'Lótus', [1.5, 4, 10], 4), S('lampada', 'diya', 'Diya', [1, 2.5, 6], 5),
      S('coco', 'coconut', 'Coco', [0.8, 2, 5], 5), K.L('A', [0.3, 0.8, 2], 8), K.L('K', [0.3, 0.8, 2], 8), K.L('Q', [0.2, 0.5, 1.5], 9),
    ];
    const WILD = { id: 'w', img: 'om', name: 'Om', wild: true, reels: [1, 2, 3], w: 1.2, fw: 1.6 };
    const SC = { id: 'sc', img: 'hindutemple', name: 'Templo', sc: true, w: 0.95 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const make = (wk = 'w') => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    App.register(K.create({
      id: 'ouroganesha', name: 'Ouro de Ganesha', studio: STUDIO, art: 'elephant', mascot: 'elephant',
      tag: 'Colete coringas · até x20', colors: ['#ca8a04', '#be185d'], bg: 'linear-gradient(180deg,#7c2d12,#9a3412 60%,#431407)',
      cols: 5, rows: 3, maxWin: 100000, vol: 2, rtp: '~96,1%', target: 0.961,
      intro: 'Inspirado no "Ganesha Gold" (PG Soft).', hello: 'Mais da metade dos giros paga algo!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '243 caminhos. Iguais em rolos seguidos a partir da esquerda.')],
      highlights: ['🐘 Grade 5×3 com <b>243 caminhos</b>', '✨ 3/4/5 scatters = <b>12/15/20 rodadas grátis</b> começando em <b>x2</b>', '🕉️ A cada <b>3 coringas coletados</b> o multiplicador sobe <b>+2</b>, até <b>x20</b>', 'Prêmio máximo: <b>100.000x</b>'],
      how: `<p>Grade <b>5×3</b> com <b>243 caminhos</b>. ${ico('om')} Om é coringa (rolos 2 a 4).</p>`,
      features: '<p>✨ <b>3, 4 ou 5 scatters</b> dão <b>12, 15 ou 20 rodadas grátis</b>. Os ganhos começam multiplicados por <b>x2</b>. Cada coringa que cair é <b>coletado</b>: a cada 3 coletados o multiplicador sobe <b>+2</b> (x4, x6… até <b>x20</b>).</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, ways(g, SY));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let m = 2, got = 0;
        rt.chip('mult', 'MULT.', 'x2');
        await rt.fsLoop({ 3: 12, 4: 15 }[sc] || 20, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await pay(rt, ways(g, SY), m);
          got += count(g, x => x.wild);
          while (got >= 3 && m < 20) { got -= 3; m += 2; rt.chip('mult', 'MULT.', 'x' + m); rt.msg(`🕉️ 3 coringas coletados! Multiplicador x${m}`); rt.fx('big'); await rt.wait(700); }
          rt.chip('col', 'COLETA', `${m < 20 ? got : 3}/3`);
          const s = count(g, x => x.sc);
          if (s >= 3) api.add({ 3: 12, 4: 15 }[s] || 20);
        }, { sub: 'Ganhos começam em x2' });
        rt.chip('mult', null);
        rt.chip('col', null);
      },
    }));
  })();

  /* =========================================================
     7. Recompensa do Capitão (Captain's Bounty) — 5×3, 20 linhas, cascata
     ========================================================= */
  (() => {
    const L20 = K.LINES_5x3.slice(0, 20);
    const SY = [
      S('capitao', 'pirateflag', 'Capitão', [3, 10, 40], 3), S('papagaio', 'parrot', 'Papagaio', [2, 6, 25], 4), S('luneta', 'telescope', 'Luneta', [1.5, 4, 15], 5),
      S('bussola', 'oyster', 'Ostra', [1, 3, 10], 5), S('ancora', 'anchor', 'Âncora', [0.5, 1.5, 5], 8), S('espadas', 'octopus', 'Kraken', [0.4, 1.2, 4], 8), S('moeda', 'crab', 'Caranguejo', [0.3, 1, 3], 9),
    ];
    const WILD = { id: 'w', img: 'sailboat', name: 'Navio', wild: true, reels: [1, 2, 3], w: 1.1 };
    const SC = { id: 'sc', img: 'island', name: 'Ilha do tesouro', sc: true, w: 0.85 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const BASE = [1, 2, 3, 5], FS = [3, 6, 9, 15];
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    async function play(rt, g, L) {
      rt.chip('mult', 'MULT.', 'x' + L[0]);
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => lines(gg, L20, SY), mult: s => L[Math.min(3, s)], onStep: async s => rt.chip('mult', 'MULT.', 'x' + L[Math.min(3, s)]) });
      rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'recompensacapitao', name: 'Recompensa do Capitão', studio: STUDIO, art: 'pirateflag', mascot: 'parrot',
      tag: 'Cascata · até x15 nas grátis', colors: ['#1d4ed8', '#b45309'], bg: 'linear-gradient(180deg,#0c4a6e,#075985 60%,#082f49)',
      cols: 5, rows: 3, maxWin: 30000, vol: 3, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Captain\'s Bounty" (PG Soft).', hello: 'Cada cascata sobe o multiplicador!',
      symbols: all,
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda. O navio é coringa (rolos 2 a 4).')],
      highlights: ['🏴‍☠️ 5×3 com 20 linhas e <b>cascata</b>', 'Multiplicador acima dos rolos: <b>x1 → x2 → x3 → x5</b> a cada cascata', '🗺️ 3 mapas = <b>10 rodadas grátis</b> (+5 por mapa extra) com <b>x3 → x6 → x9 → x15</b>', 'Prêmio máximo: <b>30.000x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>20 linhas</b>. Os símbolos vencedores explodem e novos caem (<b>cascata</b>). A cada cascata seguida o multiplicador sobe: x1, x2, x3 e x5.</p>',
      features: '<p>🗺️ <b>3 mapas do tesouro</b> dão <b>10 rodadas grátis</b>, +5 para cada mapa extra (também durante o bônus). Os multiplicadores sobem para <b>x3, x6, x9 e x15</b>.</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, BASE);
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        await rt.fsLoop(10 + (sc - 3) * 5, async api => {
          const g = make();
          await rt.spin(g, { tease: false });
          await play(rt, g, FS);
          const s = count(g, x => x.sc);
          if (s >= 3) api.add(10 + (s - 3) * 5);
        }, { sub: 'Multiplicadores x3 a x15' });
      },
    }));
  })();

  /* =========================================================
     8. Ninja x Samurai (Ninja vs Samurai) — 5×3, 20 linhas
     ========================================================= */
  (() => {
    const L20 = K.LINES_5x3.slice(0, 20);
    const SY = [
      S('castelo', 'castlejp', 'Castelo', [2.5, 10, 50], 3), S('mascara', 'ogre', 'Máscara', [2, 8, 30], 4), S('espadas', 'dolls', 'Bonecas', [1.5, 5, 20], 4),
      S('sakura', 'blossom', 'Sakura', [1, 3, 12], 5), S('lanterna', 'windchime', 'Sino de vento', [0.5, 1.5, 6], 8), S('leque', 'tanabata', 'Tanabata', [0.4, 1.2, 5], 8), S('moeda', 'sake', 'Saquê', [0.3, 1, 4], 9),
    ];
    const WILD = { id: 'w', img: 'goblin', name: 'Tengu', wild: true, w: 0.9 };
    const SCN = { id: 'scn', img: 'ninja', name: 'Ninja', sc: true, kind: 'ninja', reels: [1, 2, 3], w: 0.9 };
    const SCS = { id: 'scs', img: 'swords', name: 'Samurai', sc: true, kind: 'samurai', reels: [1, 2, 3], w: 0.9 };
    const all = [...SY, WILD, SCN, SCS];
    const draw = pool(all);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const NM = [{ m: 2, w: 55 }, { m: 3, w: 30 }, { m: 5, w: 15 }];
    async function samurai(rt, g, n) {
      const reels = RNG.shuffle([0, 1, 2, 3, 4]).slice(0, n);
      reels.forEach(c => { for (let r = 0; r < 3; r++) g[c][r] = { ...WILD, fresh: true }; });
      rt.msg(`⚔️ Ataque do Samurai! ${n} rolo${n > 1 ? 's' : ''} de coringas`);
      rt.fx('boom');
      await rt.drop(g);
    }
    async function one(rt, fsMode) {
      const g = make();
      const ninjaHit = fsMode === 'ninja' ? RNG.float() < 0.45 : !fsMode && RNG.float() < 0.04;
      const samHit = fsMode === 'samurai' ? RNG.float() < 0.4 : !fsMode && RNG.float() < 0.025;
      await rt.spin(g, { tease: !fsMode });
      if (samHit) await samurai(rt, g, RNG.weighted([{ n: 1, w: 60 }, { n: 2, w: 28 }, { n: 3, w: 9 }, { n: 4, w: 2.5 }, { n: 5, w: 0.5 }]).n);
      const res = lines(g, L20, SY);
      let m = 1;
      if (ninjaHit && res.total) { m = fsMode ? RNG.weighted([...NM, { m: 10, w: 8 }]).m : RNG.weighted(NM).m; rt.msg(`🥷 Golpe do Ninja: x${m}!`); rt.fx('big'); await rt.wait(700); }
      await pay(rt, res, m);
      return g;
    }
    App.register(K.create({
      id: 'ninjasamurai', name: 'Ninja x Samurai', studio: STUDIO, art: 'ninja', mascot: 'ninja',
      tag: 'Ninja multiplica · Samurai enche de coringas', colors: ['#1f2937', '#b91c1c'], bg: 'linear-gradient(180deg,#1e293b,#334155 60%,#7f1d1d)',
      cols: 5, rows: 3, maxWin: 2610, vol: 2, rtp: '~97,4%', target: 0.974,
      intro: 'Inspirado no "Ninja vs Samurai" (PG Soft).', hello: 'Ninja ou Samurai podem atacar a qualquer giro!',
      symbols: all,
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['🥷 <b>Ninja</b> aparece ao acaso e multiplica o ganho por <b>x2, x3 ou x5</b>', '⚔️ <b>Samurai</b> ataca e enche de <b>1 a 5 rolos</b> de coringas', '3 scatters (rolos 2 a 4) = <b>9 rodadas grátis</b> do Ninja ou do Samurai', 'Prêmio máximo: <b>2.610x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>20 linhas</b>.</p><p>🥷 <b>Recurso Ninja:</b> em qualquer giro o ninja pode atacar e multiplicar o ganho por x2, x3 ou x5.</p><p>⚔️ <b>Recurso Samurai:</b> em qualquer giro o samurai pode transformar de 1 a 5 rolos inteiros em coringas.</p>',
      features: `<p>${ico('ninja')} / ${ico('swords')} <b>3 scatters</b> de Ninja e/ou Samurai nos rolos 2, 3 e 4 dão <b>9 rodadas grátis</b> do lado que tiver mais scatters:</p>
        <ul class="si-list"><li><b>Ninja:</b> em quase metade dos giros o ninja multiplica o ganho (x2 a x10).</li><li><b>Samurai:</b> em 40% dos giros a espada do samurai transforma rolos inteiros em coringas.</li></ul>`,
      make,
      async spin(rt) {
        const g = await one(rt, null);
        const n = count(g, x => x.kind === 'ninja'), s = count(g, x => x.kind === 'samurai');
        if (n + s >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { mode: n >= s ? 'ninja' : 'samurai' }); }
      },
      async bonus(rt, { mode } = {}) {
        mode = mode || RNG.pick(['ninja', 'samurai']);
        await rt.fsLoop(9, async () => { await one(rt, mode); }, { title: mode === 'ninja' ? 'GIROS DO NINJA' : 'GIROS DO SAMURAI', sub: '9 rodadas grátis' });
      },
    }));
  })();

  /* =========================================================
     10. Vitórias de Caishen (Caishen Wins) — 32.400 caminhos + aposta na roda
     ========================================================= */
  (() => {
    const SY = [
      S('caishen', 'moneymouth', 'Caishen', [1, 2, 4, 8], 3), S('envelope', 'abacus', 'Ábaco', [0.8, 1.5, 3, 6], 4), S('jade', 'plant', 'Bonsai', [0.6, 1.2, 2.5, 5], 5),
      S('moeda', 'sparkler', 'Estrelinha', [0.5, 1, 2, 4], 5), K.L('A', [0.2, 0.4, 0.8, 1.5], 8), K.L('K', [0.2, 0.4, 0.8, 1.5], 8),
      K.L('Q', [0.15, 0.3, 0.6, 1.2], 9), K.L('J', [0.15, 0.3, 0.6, 1.2], 9),
    ];
    const WILD = { id: 'w', img: 'drum', name: 'Coringa', wild: true, w: 0 };
    const SC = { id: 'sc', img: 'eight', name: 'Sorte 8', sc: true, w: 0.62 };
    const all = [...SY, SC];
    const draw = pool(all);
    const cell = (c, fs) => silver(draw(c), c, fs ? 0.25 : 0.08);
    const make = fs => K.stack(grid([5, 6, 6, 6, 6, 5], c => cell(c, fs)), 0.4);
    const conv = frames(SY, WILD);
    const TIERS = [{ s: 8, m: 8 }, { s: 12, m: 12 }, { s: 16, m: 16 }, { s: 20, m: 20 }];
    const P_UP = [64 / 144, 144 / 256, 256 / 400]; // aposta justa: o valor esperado não muda
    async function play(rt, g, fixed) {
      let m = 1;
      // Caishen da Sorte: bloco de 4 coringas no topo
      if (RNG.float() < (fixed ? 0.04 : 0.025)) { for (let c = 1; c <= 4; c++) g[c][0] = { ...WILD, fresh: true }; rt.msg('🧧 Caishen da Sorte! 4 coringas'); rt.fx('big'); await rt.drop(g); }
      if (!fixed) rt.chip('mult', 'MULT.', 'x1');
      await tumble(rt, g, {
        draw: c => cell(c, !!fixed), evaluate: gg => ways(gg, SY), convert: conv,
        mult: () => (fixed || m),
        onStep: async () => { if (!fixed) { m++; rt.chip('mult', 'MULT.', 'x' + m); } },
      });
      if (!fixed) rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'caishen', name: 'Vitórias de Caishen', studio: STUDIO, art: 'moneybag', mascot: 'redenvelope',
      tag: 'Arrisque na roda: até 20 giros x20', colors: ['#b91c1c', '#ca8a04'], bg: 'linear-gradient(180deg,#7f1d1d,#b91c1c 55%,#450a0a)',
      cols: 6, rows: 6, cellH: 1.1, maxWin: 100000, vol: 3, rtp: '~96,9%', target: 0.969,
      intro: 'Inspirado no "Caishen Wins" (PG Soft).', hello: 'Molduras viram coringas no caminho!',
      symbols: [...all, WILD],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Rolos 5-6-6-6-6-5 = 32.400 caminhos, com cascata.')],
      highlights: ['🧧 <b>32.400 caminhos</b> com cascata; multiplicador +1 por cascata no jogo base', '🖼️ Moldura prata → dourada → <b>coringa</b>', '8️⃣ 4+ scatters = <b>8 rodadas grátis com x8 fixo</b>', '🎡 Antes do bônus você pode <b>arriscar na roda</b>: até <b>20 giros com x20</b>', 'Prêmio máximo: <b>100.000x</b>'],
      how: '<p>Rolos <b>5-6-6-6-6-5</b> (32.400 caminhos) com <b>cascata</b>. No jogo base o multiplicador começa em x1 e sobe +1 por cascata.</p><p>Símbolos dos rolos 2 a 5 com <b>moldura prata</b> viram dourados ao ganhar; dourados viram <b>coringa</b>. O <b>Caishen da Sorte</b> pode cobrir o topo com 4 coringas.</p>',
      features: `<p>8️⃣ <b>4 ou mais scatters</b> dão <b>8 rodadas grátis com multiplicador fixo x8</b> em todos os ganhos.</p>
        <p>🎡 <b>Aposta na roda:</b> antes de começar você pode aceitar ou arriscar. Acertando, sobe para 12 giros x12, depois 16 x16 e 20 x20. Errando, o bônus acaba. As chances são justas: em média o valor do bônus é o mesmo.</p>
        <table class="paytable"><tr class="si-head"><td>De</td><td>Para</td><td>Chance</td></tr>${P_UP.map((p, i) => `<tr><td>${TIERS[i].s} giros x${TIERS[i].m}</td><td>${TIERS[i + 1].s} giros x${TIERS[i + 1].m}</td><td>${Math.round(p * 100)}%</td></tr>`).join('')}</table>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, 0);
        if (count(g, x => x.sc) >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let t = 0;
        while (t < 3) {
          const nx = TIERS[t + 1];
          const pick = await rt.choose(`${TIERS[t].s} GIROS · x${TIERS[t].m}`, [
            { id: 'ok', img: 'check', label: 'Aceitar', desc: `${TIERS[t].s} giros com x${TIERS[t].m}`, sim: true },
            { id: 'gamble', img: 'ferris', label: 'Arriscar', desc: `${Math.round(P_UP[t] * 100)}% → ${nx.s} giros x${nx.m}` },
          ]);
          if (pick === 'ok') break;
          const win = RNG.float() < P_UP[t];
          await rt.reveal('RODA DA SORTE', [{ img: 'check', t: 'SUBIU!' }, { img: 'skull', t: 'PERDEU' }], win ? 0 : 1);
          if (!win) { rt.msg('A roda não ajudou... bônus perdido.'); await rt.wait(900); return; }
          t++;
        }
        const T = TIERS[t];
        rt.chip('mult', 'MULT.', 'x' + T.m);
        await rt.fsLoop(T.s, async () => {
          const g = make(true);
          await rt.spin(g, { tease: false });
          await play(rt, g, T.m);
        }, { sub: `${T.s} giros · tudo x${T.m}` });
        rt.chip('mult', null);
      },
    }));
  })();
})();
