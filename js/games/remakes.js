'use strict';

/* =========================================================
   Jogos refeitos no SlotKit para seguir as regras dos originais
   (antes rodavam nos motores antigos de scatter/linhas).
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, count, key, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'pragmatic';

  /* =========================================================
     Portais de Fogo (Fire Portals) — 7×7, grupos de 5+,
     cada ganho cria um coringa-portal que sobe +1 a cada ganho
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    const SY = [
      S('dragao', 'dragon', 'Dragão', [1, 2, 4, 10, 25, 100], 4), S('coracao', 'heartfire', 'Coração em chamas', [0.8, 1.5, 3, 7, 20, 75], 5),
      S('cometa', 'comet', 'Cometa', [0.5, 1, 2, 4, 10, 40], 7), S('varinha', 'wand', 'Varinha', [0.4, 0.8, 1.5, 3, 8, 30], 8),
      S('rubi', 'gem', 'Rubi', [0.3, 0.6, 1.2, 2.5, 6, 25], 9), S('topazio', 'orangediamond', 'Topázio', [0.25, 0.5, 1, 2, 5, 20], 10),
      S('safira', 'bluediamond', 'Safira', [0.2, 0.4, 0.8, 1.6, 4, 15], 11),
      S('chama', 'fire', 'Chama', [0.15, 0.3, 0.6, 1.2, 3, 12], 12), S('bola', 'crystal', 'Bola de cristal', [0.15, 0.3, 0.6, 1.2, 3, 12], 12),
    ];
    const WILD = { id: 'w', img: 'cyclone', name: 'Portal de fogo', wild: true, fixed: true, w: 0, tagTxt: 'PORTAL' };
    const SC = { id: 'sc', img: 'volcano', name: 'Vulcão', sc: true, w: 0.42, fw: 0.3 };
    const all = [...SY, WILD, SC];
    const draw = pool(SY), drawSC = pool([...SY, SC]);
    const FS_T = n => ({ 3: 10, 4: 12, 5: 14, 6: 16 }[n] || 18);
    const CAP = { base: 5, fs: 6 }; // limite de cada portal
    const MAXSTEP = 12, MAXW = { base: 3, fs: 3 };
    const make = (wk = 'w') => Array.from({ length: 7 }, (_, c) => Array.from({ length: 7 }, () => drawSC(c, wk)));
    const nSC = g => count(g, x => x.sc);

    /**
     * Um giro: cascata em que cada passo vencedor cria um portal (x1) numa casa vencedora
     * e todo portal que participou de um ganho sobe +1. O multiplicador de um grupo é o
     * produto dos portais dentro dele. `keepW` (rodadas grátis) guarda os portais entre os giros.
     */
    async function play(rt, g, keepW) {
      if (keepW) keepW.forEach((w, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...WILD, m: w.m }; });
      await rt.drop(g);
      let used = [], hit = [], steps = 0;
      const cap = keepW ? CAP.fs : CAP.base, maxw = keepW ? MAXW.fs : MAXW.base;
      await tumble(rt, g, {
        draw: c => draw(c),
        keep: x => x.wild,
        evaluate: gg => {
          used = []; hit = [];
          if (steps++ >= MAXSTEP) return { total: 0, wins: [], cells: new Set() };
          const res = payClusters(clusters(gg, 5), T, k => {
            let m = 0;
            k.cells.forEach(kk => { const [c, r] = K.unkey(kk); const x = gg[c][r]; if (x.wild) { m = Math.max(m, x.m || 1); used.push(x); } });
            return Math.max(1, m);
          });
          res.cells.forEach(kk => { const [c, r] = K.unkey(kk); if (!gg[c][r].wild) hit.push(kk); });
          return res;
        },
        onStep: async (step, gg) => {
          new Set(used).forEach(x => { x.m = Math.min(cap, (x.m || 1) + 1); });
          const free = hit.filter(kk => { const [c, r] = K.unkey(kk); return !gg[c][r].wild && !gg[c][r].sc; });
          if (free.length && count(gg, x => x.wild) < maxw) { const [c, r] = K.unkey(RNG.pick(free)); gg[c][r] = { ...WILD, m: 1, fresh: true }; }
        },
      });
      if (keepW) g.forEach((col, c) => col.forEach((x, r) => { if (x.wild) keepW.set(key(c, r), { m: x.m || 1 }); }));
    }

    App.register(K.create({
      id: 'portais', name: 'Portais de Fogo', studio: STUDIO, art: 'cyclone', mascot: 'fire',
      tag: '7×7 · portais coringa que crescem', colors: ['#ea580c', '#7e22ce'], bg: 'radial-gradient(circle at 50% 10%,#9a3412,#3b0764 65%,#1e0533)',
      cols: 7, rows: 7, maxWin: 5000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Fire Portals" (Pragmatic Play).',
      hello: 'Cada ganho abre um portal de fogo!',
      symbols: all,
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados (na horizontal ou vertical). Grupos diferentes se somam.')],
      highlights: ['🔥 Grade <b>7×7</b> com grupos de 5+ e cascata', '🌀 Cada ganho cria um <b>Portal de fogo</b> (coringa x1) que <b>sobe +1</b> sempre que participa de um ganho', '🔝 Grupo com vários portais usa o <b>maior multiplicador</b>', '🌋 3 a 7 vulcões = <b>10 a 18 rodadas grátis</b> com os portais <b>presos até o fim</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: `<p>Grade <b>7×7</b>: grupos de <b>5 ou mais</b> símbolos iguais encostados pagam. Os vencedores somem e novos símbolos caem (<b>cascata</b>).</p>
        <p>${ico('cyclone')} <b>Portal de fogo:</b> a cada ganho, um portal (coringa) aparece numa das casas vencedoras com <b>x1</b>. Ele fica parado na casa e, sempre que faz parte de um ganho, o multiplicador dele <b>sobe +1</b> (até x${CAP.base} no jogo normal e x${CAP.fs} nas grátis). Se um grupo tem vários portais, vale o <b>maior</b> multiplicador entre eles.</p>
        <p>Cabem até <b>${MAXW.base} portais</b> na grade no jogo normal e <b>${MAXW.fs}</b> nas grátis. No jogo normal eles somem no fim do giro (no máximo 12 cascatas por giro).</p>`,
      features: `<p>${ico('volcano')} <b>3, 4, 5, 6 ou 7 vulcões</b> dão <b>10, 12, 14, 16 ou 18 rodadas grátis</b>. Nelas os portais <b>ficam presos até o fim</b> do bônus, com o multiplicador que já tinham. 3+ vulcões nas grátis dão mais giros pela mesma tabela.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, null);
        const n = nSC(g);
        if (n >= 3 && !rt.capped) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { n }); }
      },
      async bonus(rt, { n, buy } = {}) {
        if (!n) n = buy ? RNG.weighted([{ v: 3, w: 80 }, { v: 4, w: 16 }, { v: 5, w: 4 }]).v : 3;
        const keepW = new Map();
        await rt.fsLoop(FS_T(n), async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, keepW);
          rt.chip('mult', 'PORTAIS', keepW.size);
          const s = nSC(g);
          if (s >= 3) { rt.mark(scatters(g)); api.add(FS_T(s)); await rt.wait(700); }
        }, { sub: `${FS_T(n)} giros · portais presos` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     Zeus x Hades (Zeus vs Hades – Gods of War) — 5×3, 15 linhas,
     coringas que expandem o rolo; nas grátis eles ficam presos
     ========================================================= */
  (() => {
    const L = K.LINES_5x3.slice(0, 15);
    const SY = [
      S('coroa', 'crown', 'Coroa', [1, 5, 25], 3), S('elmo', 'helmet', 'Elmo', [0.75, 3, 12.5], 4),
      S('espadas', 'swords', 'Espadas', [0.5, 2, 7.5], 5), S('escudo', 'shield', 'Escudo', [0.4, 1.5, 5], 6),
      S('anfora', 'amphora', 'Ânfora', [0.25, 1, 3.75], 8), S('anel', 'ring', 'Anel', [0.15, 0.5, 2], 9),
      S('moeda', 'coin', 'Moeda', [0.1, 0.4, 1.5], 10),
    ];
    const WILD = { id: 'w', img: 'zeus', name: 'Zeus', wild: true, reels: [1, 2, 3], w: 0.9 };
    const SC = { id: 'sc', img: 'trident', name: 'Tridente', sc: true, reels: [0, 2, 4], w: 1.6 };
    const all = [...SY, WILD, SC];
    const MODES = {
      base: { wildW: 0.9, mults: [{ m: 1, w: 70 }, { m: 2, w: 20 }, { m: 3, w: 7 }, { m: 5, w: 3 }] },
      zeus: { wildW: 1.3, mults: [{ m: 2, w: 50 }, { m: 3, w: 30 }, { m: 5, w: 20 }] },
      hades: { wildW: 0.55, mults: [{ m: 5, w: 50 }, { m: 10, w: 30 }, { m: 25, w: 15 }, { m: 50, w: 5 }] },
    };
    const pools = {};
    const drawOf = mode => pools[mode] || (pools[mode] = pool([...SY, { ...WILD, w: MODES[mode].wildW }, { ...SC, w: mode === 'base' ? SC.w : 0 }]));
    const multTable = list => { const tot = list.reduce((s, x) => s + x.w, 0); return list.map(x => `x${x.m} (${Math.round((x.w / tot) * 100)}%)`).join(' · '); };
    // coringa que cai expande o rolo inteiro, com um único multiplicador
    const make = (mode, sticky) => {
      const draw = drawOf(mode);
      const g = Array.from({ length: 5 }, (_, c) => Array.from({ length: 3 }, () => draw(c)));
      g.forEach((col, c) => {
        if (sticky && sticky.has(c)) { g[c] = col.map(() => ({ ...WILD, m: sticky.get(c), hold: true })); return; }
        if (col.some(x => x.wild)) {
          const m = RNG.weighted(MODES[mode].mults).m;
          g[c] = col.map(() => ({ ...WILD, m, fresh: true }));
          if (sticky) sticky.set(c, m);
        }
      });
      return g;
    };
    const ev = g => lines(g, L, SY, { mult: 'add' });

    App.register(K.create({
      id: 'zeushades', name: 'Zeus x Hades', studio: STUDIO, art: 'zeus', mascot: 'zeus',
      tag: 'Coringas expansivos · escolha seu deus', colors: ['#2563eb', '#b91c1c'], bg: 'linear-gradient(180deg,#1e3a8a,#312e81 50%,#7f1d1d)',
      cols: 5, rows: 3, maxWin: 15000, vol: 5, rtp: '~96,5%', target: 0.965, lineList: { cols: 5, rows: 3, list: L, text: '15 linhas fixas, da esquerda para a direita.' },
      intro: 'Inspirado no "Zeus vs Hades – Gods of War" (Pragmatic Play).',
      hello: 'Coringas de Zeus tomam o rolo inteiro!',
      symbols: [...all, { id: 'hades', img: 'skull', name: 'Hades', noPay: true, w: 0 }],
      tables: [table('Pagamento por linha', heads(3, 3, ''), SY, '15 linhas, iguais seguidos a partir do 1º rolo.')],
      highlights: ['⚡ Coringa de Zeus (rolos 2 a 4) <b>expande o rolo inteiro</b> com multiplicador; vários na mesma linha <b>se somam</b>', '🔱 3 tridentes (rolos 1, 3 e 5) = <b>10 rodadas grátis</b>: você escolhe <b>Zeus ou Hades</b>', '📌 Nas grátis os rolos de coringa <b>ficam presos até o fim</b>', 'Prêmio máximo: <b>15.000x</b>'],
      how: `<p>Grade <b>5×3</b> com <b>15 linhas</b>. Junte 3, 4 ou 5 iguais seguidos a partir do rolo da esquerda.</p>
        <p>${ico('zeus')} <b>Zeus</b> é o coringa (rolos 2, 3 e 4). Quando cai, ele <b>expande e cobre o rolo inteiro</b> com um multiplicador. Se vários rolos de coringa estão na mesma linha, os multiplicadores <b>se somam</b> (x2 + x3 = x5).</p>
        <p>${ico('trident')} <b>Tridente</b> (só nos rolos 1, 3 e 5): 3 tridentes abrem as rodadas grátis.</p>`,
      features: `<p>${ico('trident')} <b>Rodadas grátis:</b> 3 tridentes dão <b>10 rodadas</b> (não há reativação). Antes de começar, você escolhe o deus:</p>
        <ul class="si-list"><li>${ico('zeus')} <b>Zeus</b> — coringas frequentes: ${multTable(MODES.zeus.mults)}</li>
        <li>${ico('skull')} <b>Hades</b> — coringas raros e enormes: ${multTable(MODES.hades.mults)}</li></ul>
        <p>📌 Nas grátis, todo rolo que vira coringa <b>fica preso até o fim</b> com o mesmo multiplicador.</p>
        <p class="muted small">No jogo base os coringas vêm com ${multTable(MODES.base.mults)}.</p>`,
      make: () => make('base'),
      async spin(rt) {
        const g = make('base');
        await rt.spin(g);
        await pay(rt, ev(g));
        if (count(g, x => x.sc) >= 3 && !rt.capped) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const god = await rt.choose('ESCOLHA SEU DEUS', [
          { id: 'zeus', img: 'zeus', label: 'Zeus', desc: 'Coringas frequentes<br>x2 a x5' },
          { id: 'hades', img: 'skull', label: 'Hades', desc: 'Coringas raros<br>x5 a x50' },
        ]);
        const sticky = new Map();
        await rt.fsLoop(10, async () => {
          const g = make(god, sticky);
          await rt.spin(g, { tease: false });
          await pay(rt, ev(g));
          rt.chip('mult', 'PRESOS', sticky.size);
        }, { sub: `10 giros com ${god === 'zeus' ? 'Zeus' : 'Hades'} · coringas presos` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     Base comum: Megaways com trilho no topo dos rolos 2 a 5
     (6 rolos de 2 a 7 + 1 casa por rolo no topo; cascata em que
     os rolos caem de cima e o trilho desliza da direita p/ esquerda)
     ========================================================= */
  const TRK = [1, 2, 3, 4];
  function megaTrack(drawReel, drawTop) {
    const make = (wk = 'w') => {
      const g = K.stack(Array.from({ length: 6 }, (_, c) => Array.from({ length: RNG.int(2, 7) }, () => drawReel(c, wk))), 0.3);
      TRK.forEach(c => g[c].unshift({ ...drawTop(c, wk), c: 'trk' }));
      return g;
    };
    // remove as casas `rm`; devolve as casas novas do trilho (para efeitos de quem "chega" lá)
    const fall = (g, rm, wk) => {
      g.forEach((col, c) => {
        const r0 = TRK.includes(c) ? 1 : 0;
        const body = col.slice(r0).filter((x, i) => !rm.has(key(c, i + r0)));
        const add = Array.from({ length: col.length - r0 - body.length }, () => ({ ...drawReel(c, wk), fresh: true }));
        g[c] = [...col.slice(0, r0), ...add, ...body];
      });
      const keep = TRK.map(c => g[c][0]).filter((x, i) => !rm.has(key(TRK[i], 0)));
      const fresh = [];
      while (keep.length < TRK.length) { const x = { ...drawTop(TRK[keep.length], wk), c: 'trk', fresh: true }; fresh.push(x); keep.push(x); }
      TRK.forEach((c, i) => { g[c][0] = keep[i]; });
      return fresh;
    };
    return { make, fall };
  }
  /** Roleta de aposta antes das grátis: arrisca os giros por um nível maior (pode perder o bônus). */
  async function gambleWheel(rt, n, LAD) {
    for (;;) {
      const i = LAD.indexOf(n);
      if (i < 0 || i >= LAD.length - 1 || rt.capped) return n;
      const nx = LAD[i + 1], p = n / nx; // aposta justa: o valor esperado não muda
      const ch = await rt.choose(`🎡 ${n} RODADAS GRÁTIS`, [
        { id: 'ok', img: 'sparkles', label: `Jogar ${n}`, desc: 'Começar agora', sim: true },
        { id: 'gamble', img: 'dizzystar', label: `Arriscar por ${nx}`, desc: `${Math.round(p * 100)}% de chance` },
      ]);
      if (ch !== 'gamble') return n;
      const win = RNG.float() < p;
      await rt.reveal('ROLETA DA SORTE', [{ img: 'dizzystar', t: `${nx} giros` }, { img: 'skull', t: 'Perdeu' }], win ? 0 : 1);
      if (!win) { rt.msg('💀 A roleta levou o bônus...'); rt.fx('lose'); await rt.wait(900); return 0; }
      n = nx;
      rt.msg(`🎡 Agora são ${n} rodadas grátis!`); rt.fx('big'); await rt.wait(600);
    }
  }

  /* =========================================================
     Muertos Multiplicador Megaways (Muertos Multiplier Megaways)
     Pimentas (coringa x2/x3) só no trilho multiplicam o multiplicador
     global; cada cascata soma +1; nas grátis ele não zera
     ========================================================= */
  (() => {
    const SY = [
      S('mariachi', 'guitar', 'Violão', [1, 2, 5, 12], 4), S('maracas', 'maracas', 'Maracas', [0.8, 1.6, 4, 10], 4),
      S('mascara', 'performing', 'Máscaras', [0.6, 1.2, 3, 8], 5), S('cacto', 'cactus', 'Cacto', [0.5, 1, 2.5, 6], 5),
      ...['A', 'K', 'Q', 'J', '10'].map((l, i) => K.L(l, [[0.2, 0.4, 1, 2.5], [0.2, 0.4, 1, 2.5], [0.15, 0.3, 0.8, 2], [0.15, 0.3, 0.8, 2], [0.1, 0.25, 0.6, 1.5]][i], 7 + i)),
    ];
    const WILD = { id: 'w', img: 'hotpepper', name: 'Pimenta', wild: true, tagTxt: 'WILD' };
    const SC = { id: 'sc', img: 'skull', name: 'Caveira', sc: true, w: 0.48, fw: 0.3 };
    const all = [...SY, WILD, SC];
    const dReel = pool([...SY, SC]), dTopP = pool(SY);
    const drawTop = (c, wk) => (RNG.float() < (wk === 'fw' ? 0.11 : 0.07) ? { ...WILD, m: RNG.weighted([{ m: 2, w: 65 }, { m: 3, w: 35 }]).m } : dTopP(c));
    const { make, fall } = megaTrack(dReel, drawTop);
    const CAP = 1000;
    const ev = g => ways(g, SY, { wildMult: 'once', onceM: 1 });
    const FS_N = [{ v: 8, w: 30 }, { v: 10, w: 40 }, { v: 12, w: 30 }];
    const LAD = [8, 10, 12, 15, 20, 25, 30];
    async function hitWilds(rt, st, xs) {
      for (const x of xs) {
        if (!x.wild) continue;
        st.m = Math.min(CAP, st.m * x.m);
        rt.chip('mult', 'MULT.', 'x' + st.m);
        rt.msg(`🌶️ Pimenta x${x.m}! Multiplicador agora x${st.m}`); rt.fx('big');
        await rt.wait(600);
      }
    }
    async function play(rt, g, st, wk) {
      await hitWilds(rt, st, TRK.map(c => g[c][0]));
      for (let step = 0; step < 30 && !rt.capped; step++) {
        const res = ev(g);
        if (!res.total) break;
        await pay(rt, res, st.m);
        if (rt.capped) break;
        rt.mark(res.cells, 'burst');
        await rt.wait(200);
        const fresh = fall(g, res.cells, wk);
        st.m = Math.min(CAP, st.m + 1);
        rt.chip('mult', 'MULT.', 'x' + st.m);
        await rt.drop(g);
        await hitWilds(rt, st, fresh);
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'muertos', name: 'Muertos Multiplicador Megaways', studio: STUDIO, art: 'skull', mascot: 'hotpepper',
      tag: 'Megaways · pimentas multiplicam o multiplicador', colors: ['#db2777', '#f59e0b'], bg: 'linear-gradient(180deg,#4a044e,#831843 55%,#431407)',
      cols: 6, rows: 8, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Muertos Multiplier Megaways" (Pragmatic Play).', hello: 'As pimentas esquentam o multiplicador!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways: 6 rolos de 2 a 7 símbolos mais a linha do topo nos rolos 2 a 5. Iguais em rolos seguidos a partir da esquerda pagam por caminho.')],
      highlights: ['💀 Megaways com <b>linha no topo</b> dos rolos 2 a 5 e <b>cascata</b>', '🌶️ <b>Pimenta</b> (coringa) só cai na linha do topo com <b>x2 ou x3</b>: ela <b>multiplica</b> o multiplicador global (x2 com pimenta x3 = <b>x6</b>)', '➕ Cada cascata soma <b>+1</b> no multiplicador global', '💀 3+ caveiras = <b>8 a 12 rodadas grátis</b>, com <b>roleta</b> para arriscar mais giros', '🔥 Nas grátis o multiplicador <b>não zera</b> até o fim', 'Prêmio máximo: <b>10.000x</b>'],
      how: `<p><b>6 rolos</b> com 2 a 7 símbolos e uma <b>linha horizontal no topo</b> dos rolos 2 a 5. Iguais em rolos seguidos a partir da esquerda pagam por caminho.</p>
        <p><b>Cascata:</b> os vencedores somem; nos rolos os símbolos caem de cima e na linha do topo eles deslizam da direita para a esquerda.</p>
        <p>${ico('hotpepper')} <b>Pimenta</b> é o coringa e só aparece na linha do topo, com <b>x2 ou x3</b>. Toda vez que uma pimenta chega à tela, ela <b>multiplica o multiplicador global</b> da rodada pelo valor dela (ex.: global x2 e pimenta x3 → <b>x6</b>). Cada cascata soma <b>+1</b> ao global. Todos os ganhos pagam × o multiplicador global.</p>`,
      features: `<p>${ico('skull')} <b>3 ou mais caveiras</b> dão <b>8, 10 ou 12 rodadas grátis</b>. Antes de começar você pode girar a <b>roleta</b>: arrisca os giros por um nível maior (até 30) — se perder, o bônus acaba. A chance é justa: o valor médio não muda.</p>
        <p>🔥 Nas rodadas grátis o multiplicador global <b>não zera</b> entre os giros: as pimentas e as cascatas continuam aumentando até o fim do bônus (até x${CAP}). As pimentas aparecem mais. 3+ caveiras dão <b>+5 giros</b>.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const st = { m: 1 };
        rt.chip('mult', 'MULT.', 'x1');
        const sc = await play(rt, g, st, 'w');
        rt.chip('mult', null);
        if (sc >= 3 && !rt.capped) { rt.mark(scatters(g)); await rt.wait(900); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let n = RNG.weighted(FS_N).v;
        n = await gambleWheel(rt, n, LAD);
        if (!n) return;
        const st = { m: 1 };
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(n, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          const sc = await play(rt, g, st, 'fw');
          if (sc >= 3) { rt.mark(scatters(g)); rt.msg('💀 +5 rodadas grátis!'); api.add(5); await rt.wait(700); }
        }, { sub: `${n} giros · multiplicador não zera` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     Poder de Merlin Megaways (Power of Merlin Megaways)
     O Raio no trilho transforma um símbolo em coringa nos rolos 2–5;
     nas grátis o multiplicador sobe +1 por cascata e não zera
     ========================================================= */
  (() => {
    const SY = [
      S('merlin', 'mage', 'Merlin', [1, 2, 5, 12], 4), S('coruja', 'owl', 'Coruja', [0.8, 1.6, 4, 10], 4),
      S('pocao', 'potion', 'Poção', [0.6, 1.2, 3, 8], 5), S('bola', 'crystalball', 'Bola de cristal', [0.5, 1, 2.5, 6], 5),
      ...['A', 'K', 'Q', 'J', '10'].map((l, i) => K.L(l, [[0.2, 0.4, 1, 2.5], [0.2, 0.4, 1, 2.5], [0.15, 0.3, 0.8, 2], [0.15, 0.3, 0.8, 2], [0.1, 0.25, 0.6, 1.5]][i], 7 + i)),
    ];
    const WILD = { id: 'w', img: 'magicwand', name: 'Coringa', wild: true };
    const BOLT = { id: 'raio', img: 'lightning', name: 'Raio', noPay: true, bolt: true, tagTxt: 'RAIO' };
    const SC = { id: 'sc', img: 'goldbook', name: 'Livro de feitiços', sc: true, w: 0.5, fw: 0.36 };
    const all = [...SY, WILD, BOLT, SC];
    const dReel = pool([...SY, SC]), dTopP = pool(SY);
    const drawTop = (c, wk) => (RNG.float() < (wk === 'fw' ? 0.09 : 0.06) ? { ...BOLT } : dTopP(c));
    const { make, fall } = megaTrack(dReel, drawTop);
    const ev = g => ways(g, SY);
    const FS_N = [{ v: 10, w: 40 }, { v: 12, w: 35 }, { v: 15, w: 25 }];
    const LAD = [10, 12, 15, 20, 25, 30];
    const boltPos = g => TRK.filter(c => g[c][0].bolt);
    // cada Raio que chega (ou muda de lugar) escolhe um símbolo pagante da tela e o transforma em coringa nos rolos 2 a 5
    async function strike(rt, g, times) {
      for (let i = 0; i < times; i++) {
        const opts = [...new Set(g.slice(1, 5).flatMap(col => col.filter(x => x.pays && !x.wild && !x.sc && x.c !== 'trk').map(x => x.id)))];
        if (!opts.length) return;
        const id = RNG.pick(opts), sym = SY.find(s => s.id === id);
        let n = 0;
        for (let c = 1; c <= 4; c++) g[c].forEach((x, r) => { if (x.id === id && x.c !== 'trk') { g[c][r] = { ...WILD, fresh: true }; n++; } });
        rt.msg(`⚡ Raio de Merlin: ${sym.name} vira coringa nos rolos 2 a 5 (${n})!`); rt.fx('big');
        await rt.drop(g);
        await rt.wait(500);
      }
    }
    async function play(rt, g, st, wk) {
      await strike(rt, g, boltPos(g).length);
      for (let step = 0; step < 30 && !rt.capped; step++) {
        const res = ev(g);
        if (!res.total) break;
        await pay(rt, res, st ? st.m : 1);
        if (rt.capped) break;
        rt.mark(res.cells, 'burst');
        await rt.wait(200);
        const before = boltPos(g).join();
        const fresh = fall(g, res.cells, wk);
        if (st) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); }
        await rt.drop(g);
        // raio novo, ou raio que deslizou para outra casa, dispara de novo
        const moved = boltPos(g).join() !== before ? boltPos(g).length - fresh.filter(x => x.bolt).length : 0;
        await strike(rt, g, fresh.filter(x => x.bolt).length + Math.max(0, moved));
      }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'merlin', name: 'Poder de Merlin Megaways', studio: STUDIO, art: 'mage', mascot: 'mage',
      tag: 'Megaways · Raio transforma em coringa', colors: ['#4338ca', '#0891b2'], bg: 'radial-gradient(circle at 50% 0%,#3730a3,#0c0a3e 70%)',
      cols: 6, rows: 8, maxWin: 10000, vol: 5, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Power of Merlin Megaways" (Pragmatic Play).', hello: 'O Raio de Merlin transforma símbolos em coringas!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways: 6 rolos de 2 a 7 símbolos mais a linha do topo nos rolos 2 a 5. Iguais em rolos seguidos a partir da esquerda pagam por caminho.')],
      highlights: ['🔮 Megaways com <b>linha no topo</b> dos rolos 2 a 5 e <b>cascata</b>', '⚡ <b>Raio</b> (só na linha do topo): escolhe um símbolo da tela e transforma <b>todos</b> eles em <b>coringa</b> nos rolos 2 a 5', '🔁 Se o Raio muda de lugar numa cascata, ele <b>dispara de novo</b>', '📖 4+ livros = <b>10 a 15 rodadas grátis</b>, com <b>roleta</b> para arriscar mais giros', '✨ Nas grátis cada cascata soma <b>+1</b> no multiplicador, que <b>não zera</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: `<p><b>6 rolos</b> com 2 a 7 símbolos e uma <b>linha horizontal no topo</b> dos rolos 2 a 5. Iguais em rolos seguidos a partir da esquerda pagam por caminho, com <b>cascata</b> (o topo desliza da direita para a esquerda).</p>
        <p>${ico('lightning')} <b>Raio:</b> aparece só na linha do topo. Quando chega, escolhe um símbolo pagante da tela e transforma <b>todas</b> as cópias dele nos rolos 2, 3, 4 e 5 em ${ico('magicwand')} <b>coringa</b>. Se o Raio for empurrado para outra casa durante uma cascata, o efeito <b>dispara de novo</b>.</p>`,
      features: `<p>${ico('goldbook')} <b>4 ou mais livros de feitiços</b> dão <b>10, 12 ou 15 rodadas grátis</b>. Antes de começar você pode girar a <b>roleta</b> para arriscar os giros por um nível maior (até 30) — se perder, o bônus acaba. A chance é justa.</p>
        <p>✨ Nas grátis o multiplicador começa em <b>x1</b> e sobe <b>+1 a cada cascata</b>, sem zerar até o fim do bônus. Os Raios aparecem mais. 3+ livros dão <b>+5 giros</b>.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const sc = await play(rt, g, null, 'w');
        if (sc >= 4 && !rt.capped) { rt.mark(scatters(g)); await rt.wait(900); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let n = RNG.weighted(FS_N).v;
        n = await gambleWheel(rt, n, LAD);
        if (!n) return;
        const st = { m: 1 };
        rt.chip('mult', 'MULT.', 'x1');
        await rt.fsLoop(n, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          const sc = await play(rt, g, st, 'fw');
          if (sc >= 3) { rt.mark(scatters(g)); rt.msg('📖 +5 rodadas grátis!'); api.add(5); await rt.wait(700); }
        }, { sub: `${n} giros · multiplicador +1 por cascata` });
        rt.chip('mult', null);
      },
    }));
  })();
})();
