'use strict';

/* =========================================================
   Doce Rush — 7×7 com grupos (estilo Sugar Rush)
   - 5+ símbolos iguais encostados (horizontal/vertical) pagam
   - vencedores somem e novos caem (cascata)
   - cada posição que participa de um ganho fica marcada; se
     ganhar de novo vira x2 e dobra a cada ganho (até x128).
     O grupo paga × a soma dos multiplicadores sob ele
   - jogo base: marcas zeram a cada giro; rodadas grátis: ficam
   - 3+ foguetes = 10 a 30 rodadas grátis
   Parâmetros calibrados por simulação (~600 mil giros).
   ========================================================= */
(function () {
  const N = 7, MIN = 5, MAX_MULT = 128, MAX_WIN = 5000, BUY_X = 62;
  const K = 2.8;
  const TIERS = ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'];
  const tier = n => (n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
  const mk = (id, img, name, w, fw, pays) => ({ id, img, name, w, fw, pays: pays.map(p => round2(p * K)) });
  const SYMBOLS = [
    mk('ursinho', 'teddy', 'Ursinho', 6, 5, [1, 2, 4, 10, 30, 150]),
    mk('sorvete', 'icecream', 'Sorvete', 7, 5, [0.8, 1.5, 3, 7, 20, 100]),
    mk('chocolate', 'candybar', 'Chocolate', 8, 6, [0.6, 1.2, 2.5, 5, 15, 60]),
    mk('cupcake', 'cupcake', 'Cupcake', 9, 8, [0.5, 1, 2, 4, 10, 40]),
    mk('rosquinha', 'doughnut', 'Rosquinha', 10, 11, [0.4, 0.8, 1.5, 3, 8, 30]),
    mk('bala', 'candy', 'Bala', 11, 14, [0.3, 0.6, 1.2, 2.5, 6, 25]),
    mk('morango', 'strawberry', 'Morango', 12, 17, [0.25, 0.5, 1, 2, 5, 20]),
  ];
  const ROCKET = { id: 'sc', img: 'rocket', name: 'Foguete', w: 0.46, fw: 0.3, scatter: true };
  const FS_TABLE = { 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 };
  const BASE_POOL = [...SYMBOLS, ROCKET];
  const FS_POOL = [...SYMBOLS, ROCKET].map(s => ({ ...s, w: s.fw }));
  const draw = fs => ({ ...RNG.weighted(fs ? FS_POOL : BASE_POOL), fresh: true });
  const idx = (r, c) => r * N + c;

  /** Grupos de 5+ (índices lineares). */
  function clusters(g) {
    const seen = new Array(N * N).fill(false), out = [];
    for (let i = 0; i < N * N; i++) {
      if (seen[i] || g[i].scatter) continue;
      const id = g[i].id, stack = [i], comp = [];
      seen[i] = true;
      while (stack.length) {
        const x = stack.pop(), r = Math.floor(x / N), c = x % N;
        comp.push(x);
        for (const [rr, cc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
          if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
          const y = idx(rr, cc);
          if (!seen[y] && g[y].id === id) { seen[y] = true; stack.push(y); }
        }
      }
      if (comp.length >= MIN) out.push({ sym: g[i], cells: comp });
    }
    return out;
  }

  App.register({
    id: 'docerush', name: 'Doce Rush', art: 'teddy', category: 'slots',
    tag: 'Multiplicadores até x128 na grade', colors: ['#db2777', '#7c3aed'],
    sprites: [...SYMBOLS.map(s => s.img), ROCKET.img],
    rules: `<p>Inspirado no "Sugar Rush".</p>
      <p>Grade <b>7×7</b>: grupos de <b>5 ou mais</b> símbolos iguais encostados (na horizontal ou vertical) pagam. Os vencedores somem e novos caem no lugar (<b>cascata</b>).</p>
      <p>Cada posição que participa de um ganho fica <b>marcada</b>. Se ganhar de novo ela vira <b>x2</b> e dobra a cada novo ganho, até <b>x128</b>. Nas rodadas grátis as marcas <b>não somem</b>.</p>
      <p>${ico('rocket')} 3 a 7 foguetes dão <b>10 a 30 rodadas grátis</b>.</p>`,
    info: {
      maxWin: MAX_WIN, vol: 4, rtp: '~95%', hit: '~1 em 3 giros (32%)',
      highlights: [
        '🍬 Grupos de <b>5+ iguais encostados</b> pagam, com cascata',
        '✨ Posição que ganha duas vezes vira <b>x2, x4, x8… até x128</b>',
        `🚀 3+ foguetes (≈1 em 160 giros) = <b>10 a 30 rodadas grátis</b> com as marcas <b>guardadas</b>`,
        `Prêmio máximo: <b>${fmt(MAX_WIN).replace(',00', '')}x</b>`,
      ],
      how: `<p>Grade <b>7×7 sem linhas</b>: um grupo de <b>5 ou mais</b> símbolos iguais <b>encostados</b> (em cima, embaixo, esquerda ou direita — diagonal não vale) paga conforme o tamanho.</p>
        <p>Os símbolos do grupo somem e novos caem: um giro pode pagar várias vezes.</p>
        <p>${ico('rocket')} <b>Foguete</b> é o scatter: 3+ em qualquer lugar abrem as rodadas grátis.</p>`,
      tables: [{
        title: 'Pagamento por tamanho do grupo', note: 'Valores × o multiplicador das posições (veja Bônus). Grupos diferentes se somam.',
        head: TIERS, rows: SYMBOLS.map(s => ({ img: s.img, name: s.name, pays: s.pays })),
      }],
      features: `
        <h4>Posições multiplicadoras</h4>
        <p>Toda posição da grade que fizer parte de um ganho fica <b>marcada</b> ✨. Se ela ganhar de novo vira <b>x2</b>, depois <b>x4, x8, x16…</b> até <b>x128</b>.</p>
        <p>Quando um grupo ganha em cima de posições com multiplicador, os multiplicadores dessas posições <b>se somam</b> e multiplicam o prêmio do grupo (ex.: x2 + x8 = x10).</p>
        <p>No jogo base as marcas somem no fim de cada giro. <b>Nas rodadas grátis elas ficam até o fim</b> — é aí que os prêmios grandes acontecem.</p>
        <table class="paytable"><tr class="si-head"><td>Foguetes</td><td>Rodadas grátis</td></tr>
          ${Object.entries(FS_TABLE).map(([k, v]) => `<tr><td><b>${k}${k === '7' ? '+' : ''}</b></td><td>${v}</td></tr>`).join('')}</table>
        <p>3+ foguetes durante as rodadas grátis dão mais rodadas pela mesma tabela.</p>
        <p>💰 <b>Comprar bônus:</b> 10 rodadas grátis por <b>${BUY_X}x</b> a aposta.</p>
        <p class="muted small">Prêmio máximo: ${fmt(MAX_WIN).replace(',00', '')}x a aposta — ao atingir, a rodada termina.</p>`,
    },

    mount(root, ctx) {
      const el = h(`
        <div class="scat rush">
          <div class="scat-top">
            <img class="scat-mascot" src="${IMG('teddy')}" alt="">
            <div class="scat-msg">Grupos de 5+ iguais encostados pagam!</div>
            <div class="scat-fs hidden"><small>GRÁTIS</small><b>0</b></div>
          </div>
          <div class="scat-frame"><div class="rush-grid"></div><div class="scat-banner hidden"></div></div>
          <div class="slot-winbar">Ganho <b>0,00</b></div>
          <div class="fs-slot"></div>
          <div class="slot-controls">
            <div class="slot-bet"></div>
            <button class="spin-btn" aria-label="Girar"><span>⟳</span></button>
            <div class="slot-toggles">
              <button class="toggle" data-t="turbo">⚡ Turbo</button>
              <button class="toggle" data-t="auto">🔁 Auto</button>
            </div>
          </div>
          <button class="btn btn-buy buy">💰 Comprar bônus</button>
        </div>`);
      root.append(el);

      const gridEl = $('.rush-grid', el), msgEl = $('.scat-msg', el), winEl = $('.slot-winbar b', el);
      const fsEl = $('.scat-fs', el), banner = $('.scat-banner', el);
      const spinBtn = $('.spin-btn', el), buyBtn = $('.buy', el), mascot = $('.scat-mascot', el);
      const stepper = UI.betStepper([0.2, 0.4, 1, 2, 3, 5, 10, 20, 50, 100, 200], 3);
      $('.slot-bet', el).append(stepper.el);
      ctx.bet = () => stepper.value;
      SlotInfo.attach(el, ctx);
      const fsBar = freeSpinBar(ctx, on => { spinBtn.classList.toggle('free', on); if (on && !busy) spin(); });
      $('.fs-slot', el).append(fsBar.el);
      const renderBuy = () => { buyBtn.innerHTML = `💰 Comprar bônus <b>🪙 ${fmt(stepper.value * BUY_X)}</b>`; };
      stepper.el.addEventListener('click', renderBuy);
      renderBuy();

      let busy = false, turbo = false, auto = false;
      let grid = Array.from({ length: N * N }, () => ({ ...RNG.weighted(SYMBOLS) }));
      let spots = new Array(N * N).fill(0); // 0 = nada, 1 = marcada, 2+ = multiplicador
      const msg = t => { msgEl.textContent = t; };
      const setAuto = v => { auto = v; $('[data-t="auto"]', el).classList.toggle('on', v); };
      const wait = ms => ctx.sleep(turbo ? ms * 0.45 : ms);

      function render(win = null) {
        let html = '';
        for (let i = 0; i < N * N; i++) {
          const x = grid[i], sp = spots[i], r = Math.floor(i / N), c = i % N;
          const cls = ['rc'];
          if (sp === 1) cls.push('mark');
          if (sp >= 2) cls.push('mult', 'm' + Math.min(sp, 128));
          if (x.fresh) cls.push('drop');
          if (win && win.has(i)) cls.push('win');
          if (x.scatter) cls.push('scatter');
          const delay = x.fresh ? ` style="animation-delay:${(turbo ? 10 : 25) * c + (N - r) * 10}ms"` : '';
          html += `<div class="${cls.join(' ')}"${delay}>${sp >= 2 ? `<i>x${sp}</i>` : ''}<img src="${IMG(x.img)}" alt=""></div>`;
          x.fresh = false;
        }
        gridEl.innerHTML = html;
      }
      render();

      /** Um giro com cascatas. Retorna { win, scatters }. */
      async function playSpin(bet, fs) {
        grid = Array.from({ length: N * N }, () => draw(fs));
        render();
        Sfx.reel();
        await wait(520);
        let win = 0;
        for (;;) {
          const cl = clusters(grid);
          if (!cl.length) break;
          const cells = new Set();
          let step = 0, multUsed = 0;
          for (const k of cl) {
            const m = k.cells.reduce((s, i) => s + (spots[i] >= 2 ? spots[i] : 0), 0);
            step += k.sym.pays[tier(k.cells.length)] * (m || 1);
            multUsed = Math.max(multUsed, m);
            k.cells.forEach(i => cells.add(i));
          }
          step = round2(step * bet);
          win = round2(win + step);
          render(cells);
          winEl.textContent = fmt(win);
          msg(cl.map(k => `${k.cells.length}× ${k.sym.name}`).join(' · ') + (multUsed ? ` · x${multUsed}` : '') + ` = 🪙 ${fmt(step)}`);
          if (multUsed) Sfx.big(); else Sfx.win();
          await wait(multUsed ? 1000 : 750);
          // marca/dobra as posições e derruba os vencedores
          cells.forEach(i => { const v = spots[i]; spots[i] = v === 0 ? 1 : v === 1 ? 2 : Math.min(MAX_MULT, v * 2); });
          for (let c = 0; c < N; c++) {
            const keep = [];
            for (let r = 0; r < N; r++) if (!cells.has(idx(r, c))) keep.push(grid[idx(r, c)]);
            const col = [...Array.from({ length: N - keep.length }, () => draw(fs)), ...keep];
            for (let r = 0; r < N; r++) grid[idx(r, c)] = col[r];
          }
          render();
          Sfx.reel();
          await wait(480);
        }
        return { win, scatters: grid.filter(x => x.scatter).length };
      }

      function setBusy(b) {
        busy = b;
        spinBtn.disabled = b;
        buyBtn.disabled = b;
        stepper.setDisabled(b);
        fsBar.setDisabled(b);
        spinBtn.classList.toggle('go', b);
      }

      async function freeSpins(bet, count) {
        let left = count, total = 0;
        const cap = round2(MAX_WIN * bet);
        spots = new Array(N * N).fill(0);
        el.classList.add('in-fs');
        mascot.classList.add('roar');
        banner.innerHTML = `<b>RODADAS GRÁTIS!</b><span>${count} giros · os multiplicadores ficam na grade</span>`;
        banner.classList.remove('hidden');
        Sfx.big();
        UI.confetti(40, ['rocket', 'candy', 'star']);
        await ctx.sleep(1800);
        banner.classList.add('hidden');
        fsEl.classList.remove('hidden');
        while (left > 0) {
          left--;
          $('b', fsEl).textContent = left;
          const r = await playSpin(bet, true);
          total = round2(total + r.win);
          winEl.textContent = fmt(total);
          if (total >= cap) {
            total = cap;
            winEl.textContent = fmt(total);
            msg('PRÊMIO MÁXIMO! 🏆');
            Sfx.big();
            await wait(1200);
            break;
          }
          if (r.scatters >= 3) {
            const add = FS_TABLE[Math.min(7, r.scatters)];
            left += add;
            msg(`+${add} RODADAS GRÁTIS!`);
            Sfx.big();
            await wait(900);
          }
          await wait(r.win > 0 ? 450 : 250);
        }
        el.classList.remove('in-fs');
        mascot.classList.remove('roar');
        fsEl.classList.add('hidden');
        spots = new Array(N * N).fill(0);
        render();
        msg(`Rodadas grátis: total 🪙 ${fmt(total)}`);
        return total;
      }

      async function spin() {
        if (busy) return;
        const free = fsBar.active && Progress.s.fs > 0;
        const bet = free ? Progress.FS_BET : stepper.value;
        if (free) Progress.useFreeSpin();
        else if (!Wallet.bet(bet)) { setAuto(false); return; }
        setBusy(true);
        winEl.textContent = fmt(0);
        msg(free ? '🎁 Rodada grátis!' : 'Girando...');
        spots = new Array(N * N).fill(0);
        const r = await playSpin(bet, false);
        let pay = r.win;
        if (r.scatters >= 3) {
          $$('.scatter', gridEl).forEach(x => x.classList.add('win'));
          msg(`${r.scatters} foguetes! Rodadas grátis 🚀`);
          await wait(1200);
          pay = round2(pay + await freeSpins(bet, FS_TABLE[Math.min(7, r.scatters)]));
        } else {
          spots = new Array(N * N).fill(0);
          await wait(pay > 0 ? 300 : 0);
          render();
          if (pay === 0) msg('Não foi dessa vez...');
        }
        finish(free ? 0 : bet, Math.min(pay, round2(MAX_WIN * bet)), bet);
      }

      async function buy() {
        if (busy) return;
        const bet = stepper.value, price = round2(bet * BUY_X);
        if (!confirm(`Comprar 10 rodadas grátis por 🪙 ${fmt(price)}?`)) return;
        if (!Wallet.bet(price)) return;
        setAuto(false);
        setBusy(true);
        winEl.textContent = fmt(0);
        grid = Array.from({ length: N * N }, () => ({ ...RNG.weighted(SYMBOLS), fresh: true }));
        RNG.shuffle([...Array(N * N).keys()]).slice(0, 3).forEach(i => { grid[i] = { ...ROCKET, fresh: true }; });
        render();
        $$('.scatter', gridEl).forEach(x => x.classList.add('win'));
        await wait(1200);
        const total = await freeSpins(bet, 10);
        finish(price, total, price, { buy: true });
      }

      function finish(stake, pay, base, extra) {
        if (pay > 0) {
          Wallet.win(pay);
          winEl.textContent = fmt(pay);
          if (ctx.alive) UI.result(pay, base);
        } else if (ctx.alive) Sfx.lose();
        ctx.round(stake, pay, base, extra);
        setBusy(false);
        fsBar.render();
        if (ctx.alive && (auto || (fsBar.active && Progress.s.fs > 0))) {
          (async () => {
            await ctx.sleep(pay > 0 ? 900 : (turbo ? 200 : 450));
            while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300);
            if (ctx.alive && !busy && (auto || (fsBar.active && Progress.s.fs > 0))) spin();
          })();
        }
      }

      spinBtn.addEventListener('click', spin);
      buyBtn.addEventListener('click', buy);
      $('.slot-toggles', el).addEventListener('click', e => {
        const t = e.target.dataset.t;
        if (!t) return;
        Sfx.click();
        if (t === 'turbo') { turbo = !turbo; e.target.classList.toggle('on', turbo); }
        if (t === 'auto') { setAuto(!auto); if (auto && !busy) spin(); }
      });
      const onKey = e => {
        if (e.code === 'Space' && !e.target.closest('input,button,textarea')) { e.preventDefault(); spin(); }
      };
      document.addEventListener('keydown', onKey);
      ctx.onUnmount(() => { auto = false; fsBar.active = false; document.removeEventListener('keydown', onKey); });
    },
  });
})();
