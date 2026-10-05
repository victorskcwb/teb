'use strict';

/* =========================================================
   Jogos refeitos no SlotKit para seguir as regras dos originais
   (antes rodavam nos motores antigos de scatter/linhas).
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, lines, count, key, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
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
})();
