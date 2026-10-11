'use strict';

/* =========================================================
   Slots no estilo BGaming (SlotKit). RTP calibrado por simulação.
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, count, key, clusters, payClusters, table, tumble, scatters } = K;
  const STUDIO = 'bgaming';

  /* =========================================================
     Clusters Astecas (Aztec Clusters) — 6×8, grupos de 5+,
     casas marcadas que viram multiplicador (x2 → x10),
     Dig-Up com Booster e Coringa, grátis com multiplicadores fixos
     ========================================================= */
  (() => {
    const T = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    const SY = [
      S('idolo', 'moai', 'Ídolo de pedra', [1, 2, 4, 10, 25, 100], 4), S('onca', 'leopard', 'Onça', [0.8, 1.5, 3, 7, 20, 75], 5),
      S('aguia', 'eagle', 'Águia', [0.5, 1, 2, 4, 10, 40], 7), S('serpente', 'snake', 'Serpente', [0.4, 0.8, 1.5, 3, 8, 30], 8),
      S('pena', 'feather', 'Pena', [0.3, 0.6, 1.2, 2.5, 6, 25], 9), S('milho', 'corn', 'Milho', [0.25, 0.5, 1, 2, 5, 20], 10),
      S('jade', 'greenheart', 'Jade', [0.2, 0.4, 0.8, 1.6, 4, 15], 11),
    ];
    const WILD = { id: 'w', img: 'sun', name: 'Coringa do Sol', wild: true, sticky: true, w: 0 };
    const SC = { id: 'sc', img: 'hindutemple', name: 'Pirâmide', sc: true, w: 0.33, fw: 0.22 };
    const draw = pool(SY), drawSC = pool([...SY, SC]);
    const COLS = 6, ROWS = 8, CAP = 10, BIGCAP = 100;
    const FS_T = n => ({ 3: 10, 4: 12, 5: 15 }[n] || 20);
    const make = (wk = 'w') => Array.from({ length: COLS }, (_, c) => Array.from({ length: ROWS }, () => drawSC(c, wk)));
    const nSC = g => count(g, x => x.sc);

    /**
     * Uma sequência de cascatas. `marks` é o mapa das casas: 1 = marcada, ≥2 = multiplicador.
     * Casas "big" (vindas das pirâmides nas grátis) começam em x10 e sobem +10 até x100.
     */
    async function play(rt, g, marks, big, fs) {
      const paint = gg => gg.forEach((col, c) => col.forEach((x, r) => {
        const k = key(c, r), m = marks.get(k);
        if (x.sc) return;
        x.c = m >= 2 ? 'az-mult' : m === 1 ? 'az-mark' : undefined;
        x.t = m >= 2 ? 'x' + m : x.wild && x.m ? 'x' + x.m : undefined;
      }));
      const bump = k => {
        const m = marks.get(k) || 0;
        if (big.has(k)) marks.set(k, Math.min(BIGCAP, m + 10));
        else marks.set(k, m === 0 ? 1 : m === 1 ? 2 : Math.min(CAP, m + 2));
      };
      paint(g);
      await rt.drop(g);
      let dug = 0;
      await tumble(rt, g, {
        draw: c => draw(c),
        keep: x => !!x.wild,
        evaluate: gg => payClusters(clusters(gg, 5), T, cl => {
          // multiplicador do grupo = soma dos multiplicadores das casas dele (e dos coringas)
          let m = 0;
          cl.cells.forEach(k => { const v = marks.get(k) || 0; if (v >= 2) m += v; const [c, r] = K.unkey(k); if (gg[c][r].wild && gg[c][r].m) m += gg[c][r].m; });
          return Math.max(1, m);
        }),
        onStep: async (step, gg, res) => {
          res.cells.forEach(k => { const [c, r] = K.unkey(k); if (!gg[c][r].wild) bump(k); });
          // Dig-Up: numa casa que acabou de esvaziar pode surgir um Booster ou um Coringa
          if (dug < 3 && RNG.float() < (fs ? 0.3 : 0.18)) {
            dug++;
            const opts = [...res.cells].filter(k => { const [c, r] = K.unkey(k); return !gg[c][r].wild && !gg[c][r].sc; });
            if (opts.length) {
              const k = RNG.pick(opts), [c, r] = K.unkey(k);
              if (RNG.float() < 0.45) {
                // Booster: +2 em todas as casas com multiplicador e +10 nos coringas da tela
                let n = 0;
                marks.forEach((v, kk) => { if (v >= 2) { marks.set(kk, big.has(kk) ? Math.min(BIGCAP, v + 2) : Math.min(CAP, v + 2)); n++; } });
                gg.forEach(col => col.forEach(x => { if (x.wild) { x.m = (x.m || 0) + 10; n++; } }));
                rt.msg(n ? `⚡ Booster! +2 nas casas com multiplicador${gg.some(col => col.some(x => x.wild)) ? ' e +10 nos coringas' : ''}` : '⚡ Booster!');
                rt.fx('big');
              } else {
                // Coringa do Sol fica até o fim das cascatas; numa casa com multiplicador ganha x10
                gg[c][r] = { ...WILD, fresh: true, m: (marks.get(k) || 0) >= 2 ? 10 : 0 };
                rt.msg('☀️ Coringa do Sol desenterrado!');
                rt.fx('big');
              }
            }
          }
          paint(gg);
          const top = Math.max(0, ...marks.values());
          if (top >= 2) rt.chip('mult', 'MAIOR', 'x' + top);
        },
      });
      // os coringas somem quando a sequência acaba
      g.forEach((col, c) => col.forEach((x, r) => { if (x.wild) g[c][r] = { ...draw(c) }; }));
    }

    App.register(K.create({
      id: 'clustersastecas', name: 'Clusters Astecas', studio: STUDIO, art: 'hindutemple', mascot: 'moai',
      tag: '6×8 · casas multiplicadoras x2 a x100', colors: ['#15803d', '#ca8a04'], bg: 'radial-gradient(circle at 50% 20%,#166534,#052e16 60%,#1c1004)',
      cols: COLS, rows: ROWS, maxWin: 10000, vol: 4, rtp: '~97%', target: 0.965,
      intro: 'Inspirado no "Aztec Clusters" (BGaming).', hello: 'Ganhos marcam as casas do templo!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados na horizontal ou vertical, com cascata.')],
      highlights: ['🗿 Grade <b>6×8</b> com grupos de <b>5+</b> e <b>cascata</b>', '🟨 Cada ganho <b>marca</b> as casas; um novo ganho numa casa marcada vira <b>x2</b>, que sobe <b>+2</b> a cada ganho até <b>x10</b>, e os multiplicadores do grupo se <b>somam</b>', '⚡ <b>Dig-Up:</b> nas casas que esvaziam podem surgir o <b>Booster</b> (+2 em todas as casas com multiplicador e +10 nos coringas) e o <b>Coringa do Sol</b>', '🔺 3/4/5/6 pirâmides = <b>10/12/15/20 rodadas grátis</b>: as pirâmides viram casas <b>x10</b> (até x100) e os multiplicadores <b>não zeram</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: `<p>Grade <b>6×8</b>: grupos de <b>5 ou mais</b> símbolos iguais encostados pagam. Os vencedores somem e novos caem (<b>cascata</b>).</p>
        <p>🟨 <b>Casas multiplicadoras:</b> a casa de cada símbolo vencedor fica <b>marcada</b>. Se outro ganho acontecer numa casa marcada, ela vira <b>x2</b>, e a cada novo ganho ali sobe <b>+2</b>, até <b>x10</b>. O multiplicador de um grupo é a <b>soma</b> dos multiplicadores das casas que ele cobre. No jogo normal as marcas somem quando o giro termina.</p>
        <p>⚡ <b>Dig-Up:</b> depois de um ganho, numa das casas que esvaziaram pode surgir:</p><ul class="si-list">
        <li><b>Booster:</b> soma <b>+2</b> em todas as casas com multiplicador e <b>+10</b> em todos os coringas da tela.</li>
        <li>${ico('sun')} <b>Coringa do Sol:</b> substitui qualquer símbolo e fica no lugar até as cascatas acabarem. Se surgir numa casa com multiplicador, ganha <b>x10</b>.</li></ul>`,
      features: `<p>${ico('hindutemple')} <b>3, 4, 5 ou 6 pirâmides</b> dão <b>10, 12, 15 ou 20 rodadas grátis</b>. As casas onde as pirâmides caíram viram multiplicadores <b>x10</b>, que sobem <b>+10</b> a cada ganho (até <b>x100</b>).</p>
        <p>Nas grátis as marcas e os multiplicadores <b>não zeram</b> entre os giros: valem até o fim do bônus. 3+ pirâmides nas grátis dão mais giros pela mesma tabela.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const marks = new Map();
        await play(rt, g, marks, new Set(), false);
        rt.chip('mult', null);
        const n = nSC(g);
        if (n >= 3 && !rt.capped) { const sc = scatters(g); rt.mark(sc); await rt.wait(1000); await this.bonus(rt, { n, sc }); }
      },
      async bonus(rt, { n, sc, buy } = {}) {
        if (!n) n = buy ? RNG.weighted([{ v: 3, w: 80 }, { v: 4, w: 16 }, { v: 5, w: 3 }, { v: 6, w: 1 }]).v : 3;
        // as pirâmides que abriram o bônus viram casas x10 (na compra, casas sorteadas)
        const marks = new Map(), big = new Set();
        const seeds = sc && sc.length ? sc : Array.from({ length: n }, () => key(RNG.int(0, COLS - 1), RNG.int(0, ROWS - 1)));
        seeds.forEach(k => { marks.set(k, 10); big.add(k); });
        await rt.fsLoop(FS_T(n), async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, marks, big, true);
          const s = nSC(g);
          if (s >= 3) { rt.mark(scatters(g)); rt.msg(`🔺 +${FS_T(s)} rodadas grátis!`); api.add(FS_T(s)); await rt.wait(700); }
        }, { sub: `${FS_T(n)} giros · multiplicadores não zeram` });
        rt.chip('mult', null);
      },
    }));
  })();
})();
