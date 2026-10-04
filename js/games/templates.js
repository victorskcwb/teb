'use strict';

/* =========================================================
   Modelos de slot reaproveitáveis (sobre o SlotKit):
   - scatterPays: 6×5 "paga em qualquer lugar" com cascata e orbes
     multiplicadores (Gates of Olympus, Sweet Bonanza, Starlight...)
   - clusterSpots: grupos 7×7 com posições multiplicadoras (Sugar Rush)
   - clusterWild: grupos 7×7 com coringas multiplicadores que ficam
     ou crescem (Fruit Party 2, Wild Beach Party, Twilight Princess)
   Cada jogo passa só os símbolos, os números e os textos.
   ========================================================= */
const SlotT = (() => {
  const K = SlotKit;
  const { pool, cells, count, key, unkey, clusters, payClusters, table, pay, tumble, scatters } = K;
  const LOCK = () => ({ id: 'lock', img: 'locked', name: 'Trancado', c: 'locked', noPay: true });
  /** nas grátis os 3 símbolos mais baixos caem mais (grupos mais fáceis) */
  const conc = o => o.syms.map((s, i) => ({ ...s, fw: s.fw ?? s.w * (i >= o.syms.length - 3 ? o.fsConc || 1.8 : 1) }));
  const pct = (list, v) => Math.round((v / list.reduce((s, x) => s + x.w, 0)) * 1000) / 10;

  /* =========================================================
     1. Paga em qualquer lugar (6×5, 8+ iguais) + orbes
     o.orbs = [{ m, w }], o.orbBase / o.orbFS = chance por casa,
     o.accumulate (soma no total das grátis), o.lockTop (linha de
     cima trancada que abre com cascatas), o.levels (sobe o
     multiplicador mínimo dos orbes ao coletar nas grátis)
     ========================================================= */
  function scatterPays(o) {
    const T = n => (n >= 12 ? 2 : n >= 10 ? 1 : n >= 8 ? 0 : -1);
    const SY = o.syms;
    const SC = { id: 'sc', img: o.scImg, name: o.scName, sc: true, w: o.scW, fw: o.scFW ?? o.scW };
    const ORB = { id: 'orb', img: o.orbImg, name: o.orbName, orb: true, noPay: true, w: 0 };
    const draw = pool([...SY, SC]);
    const SCPAY = { 4: 3, 5: 5, 6: 100 };
    const ROWS = o.rows || (o.lockTop ? 6 : 5);
    const SCMIN = o.scMin || 4, RETRIG = o.retrig || { min: 3, add: 5 };
    const UNLOCK = [1, 3, 6, 9, 12, 15];
    const orbVal = st => {
      const lv = o.levels && st && st.level != null ? o.levels[st.level].min : 0;
      const list = (st && st.fs && o.orbsFS) || o.orbs;
      return RNG.weighted(list.filter(x => x.m >= lv).length ? list.filter(x => x.m >= lv) : list).m;
    };
    const cell = (c, fs, st) => (RNG.float() < (fs ? o.orbFS : o.orbBase) ? { ...ORB, m: orbVal(fs ? { ...st, fs: true } : st) } : draw(c, fs ? 'fw' : 'w'));
    const fixOrb = x => { if (x.orb) x.t = 'x' + x.m; return x; };
    const make = (fs, st) => Array.from({ length: 6 }, (_, c) => Array.from({ length: ROWS }, (_, r) => (o.lockTop && r === 0 && !(st && st.open[c]) ? LOCK() : fixOrb(cell(c, fs, st)))));
    /** trancadas ficam sempre no topo da coluna */
    const relock = (g, st) => g.forEach((col, c) => {
      if (!o.lockTop || st.open[c]) return;
      const rest = col.filter(x => x.id !== 'lock');
      while (rest.length > ROWS - 1) rest.shift();
      g[c] = [LOCK(), ...rest];
    });

    async function play(rt, g, fs, st) {
      let steps = 0;
      const r = await tumble(rt, g, {
        draw: c => fixOrb(cell(c, fs, st)),
        evaluate: gg => K.anywhere(gg, SY, T),
        onStep: async (step, gg) => {
          steps = step;
          relock(gg, st);
          if (o.lockTop) {
            const n = UNLOCK.filter(u => step >= u).length;
            for (let c = 0; c < n; c++) if (!st.open[c]) { st.open[c] = true; gg[c][0] = { ...draw(c), fresh: true }; rt.msg(`🏛️ Posição ${c + 1} do topo liberada!`); rt.fx('rise'); }
          }
        },
      });
      void steps;
      if (!fs && o.lockTop) st.open = [];
      const orbs = g.flat().filter(x => x.orb);
      const sum = orbs.reduce((s, x) => s + x.m, 0);
      if (fs && o.levels) {
        st.got += orbs.length;
        while (st.level < o.levels.length - 1 && st.got >= o.levels[st.level + 1].at) { st.level++; rt.msg(`🔨 Forja nível ${st.level + 1}: orbes de no mínimo x${o.levels[st.level].min}!`); rt.fx('rise'); rt.chip('lvl', 'FORJA', 'Nv ' + (st.level + 1)); }
      }
      if (r.total > 0 && sum > 0) {
        if (fs && o.accumulate) { st.acc += sum; rt.chip('acc', 'MULT.', 'x' + st.acc); }
        const m = fs && o.accumulate ? st.acc : sum;
        rt.mark(cells(g, x => x.orb).map(([c, rr]) => key(c, rr)), 'hl');
        rt.win(r.total * (m - 1));
        rt.msg(`${o.orbName} x${m}! ${rt.coins(r.total)} → ${rt.coins(r.total * m)}`);
        rt.fx('big');
        await rt.wait(1000);
      }
      const sc = count(g, x => x.sc);
      if (o.scPay !== false && SCPAY[Math.min(6, sc)]) rt.win(SCPAY[Math.min(6, sc)]);
      return sc;
    }

    return K.create({
      id: o.id, name: o.name, studio: o.studio, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: 6, rows: ROWS, maxWin: o.maxWin, vol: o.vol || 4, rtp: o.rtp || '~96,5%', target: o.target || 0.965,
      intro: o.intro, hello: o.hello || '8+ iguais em qualquer lugar pagam!',
      symbols: [...SY, SC, ORB, ...(o.lockTop ? [{ img: 'locked', noBlur: true }] : [])],
      tables: [table('Pagamento por quantidade', ['8–9', '10–11', '12+'], SY, 'Paga o total de cada símbolo em qualquer posição. Grupos de símbolos diferentes se somam.'),
        ...(o.scPay === false ? [] : [{ title: `${o.scName} (scatter)`, head: ['4', '5', '6+'], rows: [{ img: o.scImg, name: o.scName, badge: 'SCATTER', pays: [3, 5, 100] }] }])],
      highlights: o.highlights,
      how: `<p>Grade <b>6×${ROWS}</b> sem linhas: <b>8 ou mais</b> símbolos iguais em <b>qualquer posição</b> pagam. Os vencedores somem e novos caem (<b>cascata</b>).</p>${o.how || ''}`,
      features: `<p>${ico(o.orbImg)} <b>${o.orbName}</b> (${o.orbs[0].m}x a ${o.orbs[o.orbs.length - 1].m}x)${o.orbBase ? ' podem cair em qualquer giro' : ' só caem nas rodadas grátis'}. No fim da sequência de cascatas, se houve ganho, todos os da tela <b>se somam</b> e multiplicam o ganho.${o.orbsFS ? ` Nas rodadas grátis eles valem de <b>x${o.orbsFS[0].m} a x${o.orbsFS[o.orbsFS.length - 1].m}</b>.` : ''}${o.accumulate ? ' Nas rodadas grátis eles <b>acumulam</b> num multiplicador total que vale para todos os ganhos seguintes.' : ''}</p>
        <p>${ico(o.scImg)} <b>${SCMIN} ou mais ${o.scName.toLowerCase()}s</b> dão <b>${o.fsCount} rodadas grátis</b>${o.fsPer ? ` (+${o.fsPer} por extra)` : ''}; ${RETRIG.min}+ durante elas dão <b>+${RETRIG.add}</b>.</p>${o.features || ''}
        <table class="paytable"><tr class="si-head"><td>Multiplicador</td><td>Chance</td></tr>${o.orbs.map(x => `<tr><td><b>x${x.m}</b></td><td>${pct(o.orbs, x.w)}%</td></tr>`).join('')}</table>`,
      make: () => make(false, { open: [] }),
      async spin(rt) {
        const st = { open: [] };
        const g = make(false, st);
        await rt.drop(g);
        const sc = await play(rt, g, false, st);
        if (sc >= SCMIN) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = SCMIN } = {}) {
        const st = { acc: 0, open: [], level: 0, got: 0 };
        if (o.levels) rt.chip('lvl', 'FORJA', 'Nv 1');
        const n0 = o.fsCount + Math.max(0, sc - SCMIN) * (o.fsPer || 0);
        await rt.fsLoop(n0, async api => {
          const g = make(true, st);
          await rt.drop(g);
          const s = await play(rt, g, true, st);
          if (s >= RETRIG.min) api.add(RETRIG.add);
        }, { sub: o.fsSub || `${n0} giros` });
        rt.chip('acc', null);
        rt.chip('lvl', null);
      },
    });
  }

  /* =========================================================
     2. Grupos 7×7 com posições multiplicadoras (Sugar Rush)
     ========================================================= */
  function clusterSpots(o) {
    const N = o.n || 7;
    const T = o.tier || (n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5));
    const SY = conc(o);
    const SC = { id: 'sc', img: o.scImg, name: o.scName, sc: true, w: o.scW, fw: o.scFW ?? o.scW * 0.7 };
    const draw = pool([...SY, SC]);
    const make = wk => Array.from({ length: N }, (_, c) => Array.from({ length: N }, () => draw(c, wk)));
    const deco = (g, sp) => g.forEach((col, c) => col.forEach((x, r) => {
      const v = sp[c][r];
      if (x.sc) return;
      x.c = v === 1 ? 'mark' : v >= 2 ? 'mult' : '';
      x.t = v >= 2 ? 'x' + v : undefined;
    }));
    async function play(rt, g, fs, sp) {
      deco(g, sp);
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'),
        evaluate: gg => {
          const cl = clusters(gg, 5);
          const res = payClusters(cl, T, k => k.cells.reduce((s, kk) => { const [c, r] = unkey(kk); return s + (sp[c][r] >= 2 ? sp[c][r] : 0); }, 0) || 1);
          // marca/dobra as posições vencedoras
          res.cells.forEach(kk => { const [c, r] = unkey(kk); const v = sp[c][r]; sp[c][r] = v === 0 ? 1 : v === 1 ? 2 : Math.min(o.cap, v * 2); });
          return res;
        },
        onStep: async (s, gg) => deco(gg, sp),
      });
      deco(g, sp);
      return count(g, x => x.sc);
    }
    const fresh = () => Array.from({ length: N }, () => new Array(N).fill(0));
    return K.create({
      id: o.id, name: o.name, studio: o.studio, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: N, rows: N, maxWin: o.maxWin, vol: 4, rtp: o.rtp || '~96,5%', target: o.target || 0.965,
      intro: o.intro, hello: o.hello || 'Grupos de 5+ iguais encostados pagam!',
      symbols: [...SY, SC],
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados (horizontal/vertical), com cascata.')],
      highlights: o.highlights,
      how: `<p>Grade <b>${N}×${N}</b>: grupos de <b>5 ou mais</b> iguais encostados pagam e somem (<b>cascata</b>).</p>`,
      features: `<p>✨ <b>Posições multiplicadoras:</b> toda posição que fizer parte de um ganho fica marcada; ganhando de novo vira <b>x2</b> e dobra a cada novo ganho, até <b>x${o.cap}</b>. Multiplicadores sob o mesmo grupo <b>se somam</b>. No jogo base as marcas somem a cada giro; nas rodadas grátis <b>ficam até o fim</b>.</p>
        <table class="paytable"><tr class="si-head"><td>Scatters</td><td>Rodadas grátis</td></tr>${Object.entries(o.fsTable).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>`,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        const sc = await play(rt, g, false, fresh());
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        const sp = fresh();
        const n = k => o.fsTable[Math.min(7, Math.max(3, k))];
        await rt.fsLoop(n(sc), async api => {
          const g = make('fw');
          const s = await play(rt, g, true, sp);
          if (s >= 3) api.add(n(s));
        }, { sub: 'Os multiplicadores ficam na grade!' });
      },
    });
  }

  /* =========================================================
     3. Grupos com coringas multiplicadores
     o.leave: chance de um grupo vencedor deixar um coringa (x start)
     o.stay: chance do coringa vencedor ficar com o valor × grow
     o.native: { w, fw, mults } coringas que já caem com multiplicador
     o.stickyFS: coringas ficam durante a sequência nas grátis
     ========================================================= */
  function clusterWild(o) {
    const N = o.n || 7;
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    const SY = conc(o);
    const SC = { id: 'sc', img: o.scImg, name: o.scName, sc: true, w: o.scW, fw: o.scFW ?? o.scW * 0.7 };
    const WILD = { id: 'w', img: o.wildImg, name: 'Coringa', wild: true, w: o.native ? o.native.w : 0, fw: o.native ? o.native.fw : 0 };
    const draw = pool([...SY, SC, WILD]);
    const cellOf = (c, wk) => { const x = draw(c, wk); if (x.wild) { x.m = RNG.weighted(o.native.mults).m; x.t = 'x' + x.m; } return x; };
    const make = wk => Array.from({ length: N }, (_, c) => Array.from({ length: N }, () => cellOf(c, wk)));
    async function play(rt, g, fs) {
      const start = fs ? o.fsStart || o.start : o.start, grow = fs ? o.fsGrow || o.grow : o.grow, cap = fs ? o.fsCap || o.cap : o.cap;
      let next = new Map();
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => cellOf(c, fs ? 'fw' : 'w'),
        keep: fs && o.stickyFS ? (x => !!x.wild) : null,
        evaluate: gg => {
          next = new Map();
          const cl = clusters(gg, 5);
          return payClusters(cl, T, k => {
            const ws = k.cells.filter(kk => { const [c, r] = unkey(kk); return gg[c][r].wild; });
            const m = ws.reduce((s, kk) => { const [c, r] = unkey(kk); return s + (gg[c][r].m || 1); }, 0) || 1;
            if (o.leave) {
              ws.forEach(kk => { const [c, r] = unkey(kk); const x = gg[c][r]; if (RNG.float() < o.stay) { const v = Math.min(cap, (x.m || start) * grow); next.set(kk, { ...WILD, m: v, t: 'x' + v, fresh: true }); } });
              if (!ws.length && RNG.float() < (fs ? o.leaveFS || o.leave : o.leave)) { const kk = RNG.pick(k.cells); next.set(kk, { ...WILD, m: start, t: 'x' + start, fresh: true }); }
            }
            return m;
          });
        },
        convert: (x, c, r) => next.get(key(c, r)) || null,
      });
      return count(g, x => x.sc);
    }
    return K.create({
      id: o.id, name: o.name, studio: o.studio, art: o.art, mascot: o.mascot, tag: o.tag, colors: o.colors, bg: o.bg,
      cols: N, rows: N, maxWin: o.maxWin, vol: 4, rtp: o.rtp || '~96,5%', target: o.target || 0.965,
      intro: o.intro, hello: o.hello || 'Grupos de 5+ iguais encostados pagam!',
      symbols: [...SY, SC, WILD],
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados, com cascata. Coringas entram em qualquer grupo.')],
      highlights: o.highlights,
      how: `<p>Grade <b>${N}×${N}</b>: grupos de <b>5 ou mais</b> iguais encostados pagam e somem (<b>cascata</b>). ${ico(o.wildImg)} é coringa com multiplicador; vários no mesmo grupo <b>se somam</b>.</p>${o.how || ''}`,
      features: `${o.features}<table class="paytable"><tr class="si-head"><td>Scatters</td><td>Rodadas grátis</td></tr>${Object.entries(o.fsTable).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>`,
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        const sc = await play(rt, g, false);
        if (sc >= o.scMin) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = o.scMin } = {}) {
        const n = k => o.fsTable[Math.min(7, Math.max(o.scMin, k))];
        await rt.fsLoop(n(sc), async api => {
          const g = make('fw');
          const s = await play(rt, g, true);
          if (o.retrig ? s >= 2 : s >= o.scMin) api.add(o.retrig ? o.retrig[Math.min(5, s)] || 0 : n(s));
        }, { sub: o.fsSub || 'Coringas mais fortes!' });
      },
    });
  }

  return { scatterPays, clusterSpots, clusterWild, LOCK };
})();
