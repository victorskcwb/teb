'use strict';

/* =========================================================
   Slots no estilo BGaming (SlotKit). RTP calibrado por simulação.
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, count, key, clusters, payClusters, table, tumble, scatters } = K;
  const STUDIO = 'bgaming';

  /* =========================================================
     Clusters Astecas (Aztec Clusters, BGaming) — 6×8, grupos de 5+ com cascata.
     3 máscaras (altas) e 4 joias (baixas); casas multiplicadoras até x10;
     Dig-Up (Coringa, Booster, Destruidor ou Scatter) depois dos ganhos;
     3/4/5/6 pirâmides = 10/12/15/20 grátis, em que as pirâmides viram
     coringas presos ou casas x10; compra em 4 níveis (0 a 3 coringas garantidos).
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    const SY = [
      S('mroxa', 'az-mpurple', 'Máscara roxa', [2, 4, 8, 16, 40, 120], 4, { fw: 7 }), S('mverm', 'az-mred', 'Máscara vermelha', [1.5, 3, 6, 12, 28, 80], 5, { fw: 7 }),
      S('mverde', 'az-mgreen', 'Máscara verde', [1, 2, 4, 8, 18, 48], 6, { fw: 7 }),
      S('jroxa', 'az-gpurple', 'Joia roxa', [0.6, 1.2, 2.5, 5, 12, 32], 8, { low: true, fw: 7 }), S('jverm', 'az-gred', 'Joia vermelha', [0.5, 1, 2, 4, 9, 24], 9, { low: true, fw: 7 }),
      S('jverde', 'az-ggreen', 'Joia verde', [0.4, 0.8, 1.6, 3.2, 7, 20], 10, { low: true, fw: 7 }), S('jazul', 'az-gblue', 'Joia azul', [0.3, 0.6, 1.2, 2.5, 6, 16], 11, { low: true, fw: 7 }),
    ];
    const WILD = { id: 'w', img: 'az-sun', name: 'Coringa do Sol', wild: true, fixed: true, w: 0 };
    const SC = { id: 'sc', img: 'az-pyramid', name: 'Pirâmide (scatter)', sc: true, w: 0.38, fw: 0.2 };
    const BOOST = { id: 'boost', img: 'az-booster', name: 'Booster', noPay: true, fixed: true, w: 0 };
    const DESTR = { id: 'destr', img: 'az-destroyer', name: 'Destruidor', noPay: true, fixed: true, w: 0 };
    const draw = pool(SY), drawSC = pool([...SY, SC]);
    const COLS = 6, ROWS = 8, CAP = 10, WCAP = 100, MAXSTEP = 6;
    const FS_T = n => ({ 3: 10, 4: 12, 5: 15 }[n] || 20);
    const make = (wk = 'w') => Array.from({ length: COLS }, (_, c) => Array.from({ length: ROWS }, () => drawSC(c, wk)));
    const nSC = g => count(g, x => x.sc);
    const DIG = [{ v: 'w', w: 34 }, { v: 'boost', w: 26 }, { v: 'destr', w: 22 }, { v: 'sc', w: 18 }];

    /**
     * Uma sequência de cascatas. `marks`: 1 = casa ativada, ≥2 = multiplicador.
     * `big` = casas x10 vindas das pirâmides (só o Booster as aumenta, até x20). `sticky` = coringas presos do bônus.
     */
    async function play(rt, g, marks, big, sticky, fs) {
      const wk = fs ? 'fw' : 'w';
      sticky.forEach((m, k) => { const [c, r] = K.unkey(k); g[c][r] = { ...WILD, m, keep: true }; });
      const paint = gg => gg.forEach((col, c) => col.forEach((x, r) => {
        const m = marks.get(key(c, r));
        if (x.sc || x.noPay) return;
        x.c = m >= 2 ? 'az-mult' : m === 1 ? 'az-mark' : undefined;
        x.t = x.wild ? (x.m ? 'x' + x.m : undefined) : m >= 2 ? 'x' + m : undefined;
      }));
      const bump = k => {
        const m = marks.get(k) || 0;
        if (big.has(k)) return;
        else marks.set(k, m === 0 ? 1 : m === 1 ? 2 : Math.min(CAP, m + 2));
      };
      const chipTop = () => { const top = Math.max(0, ...marks.values()); if (top >= 2) rt.chip('mult', 'MAIOR', 'x' + top); };
      paint(g);
      await rt.drop(g);
      let dug = 0;
      await tumble(rt, g, {
        draw: c => draw(c, wk),
        keep: x => !!x.wild,
        evaluate: (gg, step) => (step >= MAXSTEP ? { total: 0, wins: [], cells: new Set() } : payClusters(clusters(gg, 5), T, cl => {
          // multiplicador do grupo = soma das casas multiplicadoras e dos coringas dentro dele
          let m = 0;
          cl.cells.forEach(k => { const v = marks.get(k) || 0; const [c, r] = K.unkey(k); if (gg[c][r].wild) m += gg[c][r].m || 0; else if (v >= 2) m += v; });
          return Math.max(1, m);
        })),
        onStep: async (step, gg, res) => {
          const used = new Set();
          res.cells.forEach(k => { const [c, r] = K.unkey(k); const x = gg[c][r]; bump(k); if (x.wild) used.add([x, k]); });
          // a casa do coringa também é ativada; em casa multiplicadora ele vale x10 e cada ganho seguinte soma +10 (até x100)
          used.forEach(([x, k]) => { if (x.m) { if (!x.keep) x.m = Math.min(WCAP, x.m + 10); } else if ((marks.get(k) || 0) >= 2) x.m = 10; });
          // Dig-Up: numa casa que acabou de esvaziar pode surgir um símbolo especial
          const opts = [...res.cells].filter(k => { const [c, r] = K.unkey(k); return !gg[c][r].wild && !gg[c][r].sc; });
          if (dug < 3 && opts.length && RNG.float() < (fs ? 0.22 : 0.2)) {
            dug++;
            const k = RNG.pick(opts), [c, r] = K.unkey(k), kind = RNG.weighted(DIG).v;
            if (kind === 'w') {
              gg[c][r] = { ...WILD, fresh: true, m: (marks.get(k) || 0) >= 2 ? 10 : 0 };
              rt.msg('☀️ Dig-Up: Coringa do Sol!' + ((marks.get(k) || 0) >= 2 ? ' Numa casa multiplicadora: x10' : ''));
            } else if (kind === 'sc') {
              gg[c][r] = { ...SC, fresh: true };
              rt.msg('🔺 Dig-Up: uma pirâmide!');
            } else {
              gg[c][r] = { ...(kind === 'boost' ? BOOST : DESTR), fresh: true };
              paint(gg); await rt.drop(gg); await rt.wait(450);
              if (kind === 'boost') {
                // Booster: +2 em todas as casas ativadas com multiplicador e +10 em todos os coringas
                marks.forEach((v, kk) => { if (v >= 2) marks.set(kk, Math.min(big.has(kk) ? 20 : CAP, v + 2)); });
                gg.forEach(col => col.forEach(x => { if (x.wild) x.m = Math.min(WCAP, (x.m || 0) + 10); }));
                gg[c][r] = { ...draw(c, wk), fresh: true };
                rt.msg('⚡ Booster! +2 nas casas multiplicadoras e +10 nos coringas');
              } else {
                // Destruidor: remove todas as joias (símbolos baixos) e some
                const rm = new Set([k]);
                gg.forEach((col, cc) => col.forEach((x, rr) => { if (x.low) rm.add(key(cc, rr)); }));
                K.cascade(gg, rm, cc => ({ ...draw(cc, wk) }));
                rt.msg(`💀 Destruidor! ${rm.size - 1} joias removidas`);
              }
            }
            rt.fx('big');
          }
          paint(gg);
          chipTop();
        },
      });
      // coringas desenterrados somem no fim da sequência; os presos do bônus ficam
      g.forEach((col, c) => col.forEach((x, r) => {
        if (!x.wild) return;
        if (x.keep) sticky.set(key(c, r), 0);
        else g[c][r] = { ...draw(c, wk) };
      }));
    }

    const tierDesc = n => (n ? `rodadas grátis com <b>${n} coringa${n > 1 ? 's' : ''} preso${n > 1 ? 's' : ''}</b> garantido${n > 1 ? 's' : ''}` : 'rodadas grátis');
    App.register(K.create({
      id: 'clustersastecas', name: 'Clusters Astecas', studio: STUDIO, art: 'az-pyramid', mascot: 'az-mpurple',
      tag: '6×8 · casas x10 · coringas até x100', colors: ['#15803d', '#ca8a04'], bg: 'radial-gradient(circle at 50% 20%,#166534,#052e16 60%,#1c1004)',
      cols: COLS, rows: ROWS, maxWin: 10000, vol: 4, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Aztec Clusters" (BGaming).', hello: 'Ganhos ativam as casas do templo!',
      symbols: [...SY, WILD, SC, BOOST, DESTR],
      buyTiers: [0, 1, 2, 3].map(n => ({ x: [1, 2.3, 5.5, 11][n], n, label: n ? `☀️×${n} coringa${n > 1 ? 's' : ''}` : '💰 Comprar bônus', desc: tierDesc(n) })),
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados na horizontal ou vertical, com cascata. 3 máscaras (altas) e 4 joias (baixas).')],
      highlights: ['🗿 Grade <b>6×8</b>: grupos de <b>5+</b> com <b>cascata</b>', '🟨 Ganhos <b>ativam as casas</b>; novo ganho numa casa ativada vira <b>x2</b> e sobe <b>+2</b> até <b>x10</b>', '☀️ <b>Coringa do Sol</b>: fica até o fim das cascatas; numa casa multiplicadora vale <b>x10</b> e cada ganho dá <b>+10</b> (até x100)', '⛏️ <b>Dig-Up:</b> depois dos ganhos podem surgir Coringa, <b>Booster</b> (+2 nas casas, +10 nos coringas), <b>Destruidor</b> (remove as joias) ou Pirâmide', '🔺 3/4/5/6 pirâmides = <b>10/12/15/20 grátis</b>: as pirâmides viram <b>coringas presos</b> ou <b>casas x10</b>', '💰 Compra em 4 níveis: <b>0 a 3 coringas presos</b> garantidos', 'Prêmio máximo: <b>10.000x</b>'],
      how: `<p>Grade <b>6×8</b>: grupos de <b>5 ou mais</b> símbolos iguais encostados na horizontal ou vertical pagam. Os vencedores somem e novos caem (<b>cascata</b>).</p>
        <p>${ico('az-mpurple')} 3 <b>máscaras</b> pagam mais; ${ico('az-gblue')} 4 <b>joias</b> são os símbolos baixos.</p>
        <p>🟨 <b>Casas multiplicadoras:</b> cada casa de um símbolo vencedor fica <b>ativada</b>. Um novo ganho numa casa ativada a transforma em <b>x2</b>, e cada ganho seguinte soma <b>+2</b>, até <b>x10</b>. O multiplicador de um grupo é a <b>soma</b> das casas multiplicadoras e dos coringas dentro dele. No jogo normal as casas zeram no fim do giro.</p>
        <p>${ico('az-sun')} <b>Coringa do Sol:</b> substitui todos os símbolos e fica no lugar até as cascatas acabarem. Se surgir numa casa multiplicadora, já começa com <b>x10</b>; cada ganho de que participa soma <b>+10</b>, até <b>x100</b>.</p>`,
      features: `<p>⛏️ <b>Dig-Up:</b> quando um grupo vencedor some, uma das casas vazias pode revelar:</p><ul class="si-list">
        <li>${ico('az-sun')} <b>Coringa do Sol</b>;</li>
        <li>${ico('az-booster')} <b>Booster:</b> soma <b>+2</b> em todas as casas multiplicadoras e <b>+10</b> em todos os coringas da tela, e some;</li>
        <li>${ico('az-destroyer')} <b>Destruidor:</b> remove <b>todas as joias</b> (símbolos baixos) da grade e some;</li>
        <li>${ico('az-pyramid')} <b>Pirâmide</b> (scatter).</li></ul>
        <p>${ico('az-pyramid')} <b>3, 4, 5 ou 6 pirâmides</b> dão <b>10, 12, 15 ou 20 rodadas grátis</b>. Cada pirâmide que abriu o bônus vira um <b>Coringa do Sol preso</b> (fica até o fim e vale <b>x10</b> quando a casa dele vira multiplicadora) ou uma <b>casa x10</b> (o Booster ainda soma +2, até x20). Nas grátis as casas multiplicadoras <b>não zeram</b>, e 3+ pirâmides dão mais giros pela mesma tabela.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, new Map(), new Set(), new Map(), false);
        rt.chip('mult', null);
        const n = nSC(g);
        if (n >= 3 && !rt.capped) { const sc = scatters(g); rt.mark(sc); await rt.wait(1000); await this.bonus(rt, { n, sc }); }
      },
      async bonus(rt, { n, sc, buy, tier = 0 } = {}) {
        if (!n) n = buy ? RNG.weighted([{ v: 3, w: 80 }, { v: 4, w: 16 }, { v: 5, w: 3 }, { v: 6, w: 1 }]).v : 3;
        const marks = new Map(), big = new Set(), sticky = new Map();
        const free = () => { for (;;) { const k = key(RNG.int(0, COLS - 1), RNG.int(0, ROWS - 1)); if (!sticky.has(k) && !big.has(k)) return k; } };
        const seeds = sc && sc.length ? sc : Array.from({ length: n }, () => free());
        // cada pirâmide vira coringa preso ou casa x10; a compra garante `tier` coringas presos
        let w = 0;
        seeds.forEach((k, i) => { if (i < tier || (i >= tier && RNG.float() < 0.2)) { sticky.set(k, 0); w++; } else { marks.set(k, 10); big.add(k); } });
        for (let i = w; i < tier; i++) sticky.set(free(), 0);
        rt.msg(`🔺 ${sticky.size} coringa${sticky.size === 1 ? '' : 's'} preso${sticky.size === 1 ? '' : 's'} e ${big.size} casa${big.size === 1 ? '' : 's'} x10!`);
        await rt.fsLoop(FS_T(n), async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, marks, big, sticky, true);
          const s = nSC(g);
          if (s >= 3) { rt.mark(scatters(g)); rt.msg(`🔺 +${FS_T(s)} rodadas grátis!`); api.add(FS_T(s)); await rt.wait(700); }
        }, { sub: `${FS_T(n)} giros · casas e coringas presos` });
        rt.chip('mult', null);
      },
    }));
  })();
})();
