'use strict';

/* =========================================================
   Pescaria Bonança — 5×3, 10 linhas (estilo Big Bass Bonanza)
   - 3+ iguais da esquerda para a direita numa linha pagam
   - 3/4/5 boias = 10/15/20 rodadas grátis
   - nas rodadas grátis o Pescador (coringa) fisga o valor de
     todos os peixes da tela; a cada 4 pescadores: +10 giros e
     multiplicador x2 → x3 → x10
   Parâmetros calibrados por simulação (~2M giros).
   ========================================================= */
(function () {
  const REELS = 5, ROWS = 3;
  const LINES = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 2, 1, 0, 1]];
  const PAY_K = 0.054; // tabela base × 5,4 ÷ 10 linhas → "x aposta total"
  const mk = (id, img, name, w, fw, pays, extra = {}) => ({ id, img, name, w, fw, pays: pays.map(p => round2(p * PAY_K)), ...extra });
  const SYMBOLS = [
    mk('polvo', 'octopus', 'Polvo', 3, 3, [10, 50, 200]),
    mk('carang', 'crab', 'Caranguejo', 4, 4, [5, 20, 100]),
    mk('baiacu', 'blowfish', 'Baiacu', 5, 5, [4, 15, 75]),
    mk('tropical', 'tropicalfish', 'Peixe tropical', 6, 6, [3, 10, 50]),
    mk('peixe', 'fish', 'Peixe de prêmio', 6, 5, [2, 8, 40], { fish: true }),
    mk('concha', 'shell', 'Concha', 9, 9, [1, 4, 20]),
    mk('ancora', 'anchor', 'Âncora', 10, 10, [1, 3, 15]),
    { id: 'boia', img: 'buoy', name: 'Boia', w: 1.13, fw: 0, scatter: true },
    { id: 'pescador', img: 'fishingpole', name: 'Pescador', w: 0, fw: 0.7, wild: true },
  ];
  const BASE_POOL = SYMBOLS.filter(s => s.w > 0);
  const FS_POOL = SYMBOLS.filter(s => s.fw > 0).map(s => ({ ...s, w: s.fw }));
  const FISH = [{ v: 2, w: 45 }, { v: 5, w: 30 }, { v: 10, w: 13 }, { v: 15, w: 6 }, { v: 20, w: 3 }, { v: 25, w: 1.5 }, { v: 50, w: 1 }, { v: 250, w: 0.15 }, { v: 1000, w: 0.01 }];
  const SCAT_FS = { 3: 10, 4: 15, 5: 20 };
  const SCAT_PAY = { 3: 2, 4: 20, 5: 200 };
  const STEPS = [{ at: 4, m: 2 }, { at: 8, m: 3 }, { at: 12, m: 10 }];
  const BUY_X = 77;
  const sym = id => SYMBOLS.find(s => s.id === id);

  const draw = fs => {
    const s = RNG.weighted(fs ? FS_POOL : BASE_POOL);
    return s.fish ? { ...s, val: RNG.weighted(FISH).v } : s;
  };

  /** Ganho de linhas (× aposta total) e células vencedoras. grid[reel][row] */
  function evalLines(grid) {
    let total = 0;
    const cells = new Set();
    for (const L of LINES) {
      const line = L.map((row, r) => grid[r][row]);
      const base = line.find(c => !c.wild);
      if (!base || base.scatter) continue;
      let n = 0;
      while (n < REELS && (line[n].wild || line[n].id === base.id)) n++;
      if (n < 3) continue;
      total += base.pays[n - 3];
      for (let r = 0; r < n; r++) cells.add(`${r}:${L[r]}`);
    }
    return { total: round2(total), cells };
  }

  const short = n => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + 'k' : Number.isInteger(n) ? String(n) : fmt(n));

  App.register({
    id: 'pescaria', name: 'Pescaria Bonança', art: 'fish', category: 'slots',
    tag: 'Pescador fisga até 1.000x', colors: ['#0284c7', '#0f766e'],
    sprites: SYMBOLS.map(s => s.img),
    rules: `
      <p>Inspirado no "Big Bass Bonanza".</p>
      <p>Grade <b>5×3</b> com <b>10 linhas</b>: 3, 4 ou 5 símbolos iguais seguidos a partir do rolo da esquerda pagam.</p>
      <p>${ico('buoy')} <b>Boia (scatter):</b> 3, 4 ou 5 em qualquer lugar pagam 2x, 20x ou 200x a aposta e dão <b>10, 15 ou 20 rodadas grátis</b>.</p>
      <p>${ico('fish')} <b>Peixes de prêmio</b> mostram um valor em fichas (2x a 1.000x a aposta).</p>
      <p>${ico('fishingpole')} <b>Pescador:</b> só aparece nas rodadas grátis. É coringa e <b>fisga o valor de todos os peixes</b> da tela. A cada <b>4 pescadores</b> coletados: <b>+10 rodadas</b> e o multiplicador da coleta sobe para <b>x2, x3 e x10</b>.</p>
      <p>💰 <b>Comprar bônus:</b> 10 rodadas grátis por ${BUY_X}x a aposta.</p>
      <h4>Tabela (× aposta total)</h4>
      <table class="paytable"><tr><td></td><td>3</td><td>4</td><td>5</td></tr>
      ${SYMBOLS.filter(s => s.pays).map(s => `<tr><td class="pt-sym">${ico(s.img)} ${s.name}</td>${s.pays.map(p => `<td><b>${fmt(p)}x</b></td>`).join('')}</tr>`).join('')}</table>
      <p class="muted small">RTP teórico aproximado: ~94% (compra de bônus ~95%). Atalho: barra de espaço gira.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="pesca">
          <div class="slot-banner">
            <img class="slot-mascot" src="${IMG('fishingpole')}" alt="">
            <div class="slot-msg">3 boias abrem a pescaria!</div>
            <div class="scat-fs hidden"><small>GRÁTIS</small><b>0</b></div>
            <div class="scat-acc pesca-col hidden"><small>PESCADOR</small><b>0/4</b></div>
          </div>
          <div class="pesca-frame"><div class="pesca-grid"></div><div class="scat-banner hidden"></div></div>
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

      const gridEl = $('.pesca-grid', el), msgEl = $('.slot-msg', el), winEl = $('.slot-winbar b', el);
      const fsEl = $('.scat-fs', el), colEl = $('.pesca-col', el), banner = $('.scat-banner', el);
      const spinBtn = $('.spin-btn', el), buyBtn = $('.buy', el), mascot = $('.slot-mascot', el);
      const stepper = UI.betStepper([0.2, 0.5, 1, 2, 3, 5, 10, 20, 50, 100, 200], 3);
      $('.slot-bet', el).append(stepper.el);
      const fsBar = freeSpinBar(ctx, on => { spinBtn.classList.toggle('free', on); if (on && !busy) spin(); });
      $('.fs-slot', el).append(fsBar.el);
      const renderBuy = () => { buyBtn.innerHTML = `💰 Comprar bônus <b>🪙 ${fmt(stepper.value * BUY_X)}</b>`; };
      stepper.el.addEventListener('click', renderBuy);
      renderBuy();

      // cells[reel][row]; no DOM a grade é montada linha a linha
      const cells = Array.from({ length: REELS }, () => []);
      for (let row = 0; row < ROWS; row++) {
        for (let r = 0; r < REELS; r++) {
          const c = h('<div class="pcell"><img alt="" draggable="false"><b class="val"></b></div>');
          gridEl.append(c);
          cells[r][row] = c;
        }
      }
      let bet = stepper.value, busy = false, turbo = false, auto = false;
      const setCell = (r, row, s) => {
        const c = cells[r][row], img = c.firstChild;
        if (img.dataset.s !== s.img) { img.src = IMG(s.img); img.dataset.s = s.img; }
        c.classList.toggle('fish', !!s.fish);
        c.classList.toggle('wild', !!s.wild);
        c.classList.toggle('scatter', !!s.scatter);
        c.lastChild.textContent = s.fish ? short(round2(s.val * bet)) : '';
      };
      const allCells = () => cells.flat();
      for (let r = 0; r < REELS; r++) for (let row = 0; row < ROWS; row++) setCell(r, row, draw(false));

      const msg = t => { msgEl.textContent = t; };
      const setAuto = v => { auto = v; $('[data-t="auto"]', el).classList.toggle('on', v); };
      const wait = ms => ctx.sleep(turbo ? ms * 0.45 : ms);

      async function animate(final, fs) {
        const timers = [];
        for (let r = 0; r < REELS; r++) {
          cells[r].forEach(c => c.classList.add('spinning'));
          timers[r] = ctx.interval(() => { for (let row = 0; row < ROWS; row++) setCell(r, row, draw(fs)); }, 70);
        }
        let scat = 0;
        for (let r = 0; r < REELS; r++) {
          // suspense: com 2 boias na tela, os rolos seguintes giram mais devagar
          const tease = !fs && scat >= 2;
          if (tease) cells[r].forEach(c => c.classList.add('tease'));
          await wait(r === 0 ? 450 : tease ? 900 : 200);
          ctx.clear(timers[r]);
          for (let row = 0; row < ROWS; row++) {
            const c = cells[r][row];
            setCell(r, row, final[r][row]);
            c.classList.remove('spinning', 'tease', 'land');
            void c.offsetWidth;
            c.classList.add('land');
            if (final[r][row].scatter) scat++;
          }
          Sfx.reel();
        }
      }

      const clearMarks = () => allCells().forEach(c => c.classList.remove('win', 'dim', 'hook'));
      function showLines(res) {
        if (!res.cells.size) return;
        allCells().forEach(c => c.classList.add('dim'));
        res.cells.forEach(k => { const [r, row] = k.split(':'); cells[r][row].classList.remove('dim'); cells[r][row].classList.add('win'); });
      }

      function setBusy(b) {
        busy = b;
        spinBtn.disabled = b;
        buyBtn.disabled = b;
        stepper.setDisabled(b);
        fsBar.setDisabled(b);
        spinBtn.classList.toggle('go', b);
      }

      /** Rodadas grátis da pescaria. Retorna o total ganho. */
      async function freeSpins(count) {
        let left = count, total = 0, collected = 0, mult = 1;
        const hud = () => {
          $('b', fsEl).textContent = left;
          const next = STEPS.find(s => s.at > collected);
          $('b', colEl).textContent = next ? `${collected}/${next.at}` : collected;
          $('small', colEl).textContent = `PESCADOR · x${mult}`;
        };
        el.classList.add('in-fs');
        mascot.classList.add('roar');
        banner.innerHTML = `<b>PESCARIA!</b><span>${count} rodadas grátis · o pescador fisga os peixes</span>`;
        banner.classList.remove('hidden');
        Sfx.big();
        UI.confetti(40, ['fish', 'tropicalfish', 'coin']);
        await ctx.sleep(1800);
        banner.classList.add('hidden');
        fsEl.classList.remove('hidden');
        colEl.classList.remove('hidden');
        while (left > 0) {
          left--;
          hud();
          clearMarks();
          const grid = Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => draw(true)));
          await animate(grid, true);
          const lines = evalLines(grid);
          let w = round2(lines.total * bet);
          if (w > 0) { showLines(lines); Sfx.win(); }
          const flat = grid.flat();
          const wilds = flat.filter(c => c.wild).length;
          const fishSum = flat.reduce((s, c) => s + (c.fish ? c.val : 0), 0);
          if (wilds && fishSum) {
            const got = round2(fishSum * bet * wilds * mult);
            w = round2(w + got);
            allCells().forEach(c => { if (c.classList.contains('fish') || c.classList.contains('wild')) c.classList.add('hook'); });
            msg(`🎣 ${wilds > 1 ? `${wilds} pescadores fisgaram` : 'Pescador fisgou'} 🪙 ${fmt(fishSum * bet)}${wilds > 1 ? ` ×${wilds}` : ''}${mult > 1 ? ` · x${mult}` : ''} = 🪙 ${fmt(got)}`);
            Sfx.coin();
            for (let i = 0; i < Math.min(6, flat.filter(c => c.fish).length); i++) setTimeout(() => Sfx.coin(), 120 * i);
            await wait(1100);
          } else if (wilds) {
            msg('O pescador não achou peixe dessa vez...');
          } else {
            msg(`Rodadas grátis: ${left} restante${left === 1 ? '' : 's'}`);
          }
          total = round2(total + w);
          winEl.textContent = fmt(total);
          const before = collected;
          collected += wilds;
          for (const st of STEPS) {
            if (before < st.at && collected >= st.at) {
              left += 10;
              mult = st.m;
              hud();
              msg(`+10 RODADAS GRÁTIS! Coleta agora vale x${mult} 🎣`);
              Sfx.big();
              await wait(1300);
            }
          }
          hud();
          await wait(w > 0 ? 500 : 250);
        }
        el.classList.remove('in-fs');
        mascot.classList.remove('roar');
        fsEl.classList.add('hidden');
        colEl.classList.add('hidden');
        msg(`Pescaria encerrada: total 🪙 ${fmt(total)}`);
        return total;
      }

      async function spin() {
        if (busy) return;
        const free = fsBar.active && Progress.s.fs > 0;
        bet = free ? Progress.FS_BET : stepper.value;
        if (free) Progress.useFreeSpin();
        else if (!Wallet.bet(bet)) { setAuto(false); return; }
        setBusy(true);
        clearMarks();
        winEl.textContent = fmt(0);
        msg(free ? '🎁 Rodada grátis!' : 'Girando...');

        const grid = Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => draw(false)));
        await animate(grid, false);
        const lines = evalLines(grid);
        const sc = Math.min(5, grid.flat().filter(c => c.scatter).length);
        let pay = round2(lines.total * bet + (SCAT_PAY[sc] || 0) * bet);
        if (lines.total > 0) { showLines(lines); msg(`Ganhou 🪙 ${fmt(lines.total * bet)} nas linhas!`); }
        if (sc >= 3) {
          allCells().forEach(c => { if (c.classList.contains('scatter')) { c.classList.remove('dim'); c.classList.add('win'); } });
          msg(`${sc} boias! 🪙 ${fmt(SCAT_PAY[sc] * bet)} + ${SCAT_FS[sc]} rodadas grátis`);
          winEl.textContent = fmt(pay);
          await wait(1300);
          pay = round2(pay + await freeSpins(SCAT_FS[sc]));
        } else if (pay === 0) {
          msg('Não foi dessa vez...');
        }
        finish(free ? 0 : bet, pay, bet);
      }

      async function buy() {
        if (busy) return;
        bet = stepper.value;
        const price = round2(bet * BUY_X);
        if (!confirm(`Comprar 10 rodadas grátis por 🪙 ${fmt(price)}?`)) return;
        if (!Wallet.bet(price)) return;
        setAuto(false);
        setBusy(true);
        clearMarks();
        winEl.textContent = fmt(0);
        // tela de entrada com 3 boias em rolos diferentes
        const grid = Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => { let s; do s = draw(false); while (s.scatter); return s; }));
        RNG.shuffle([0, 1, 2, 3, 4]).slice(0, 3).forEach(r => { grid[r][RNG.int(0, ROWS - 1)] = sym('boia'); });
        await animate(grid, false);
        allCells().forEach(c => { if (c.classList.contains('scatter')) c.classList.add('win'); });
        await wait(1100);
        const total = await freeSpins(10);
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
            await ctx.sleep(pay > 0 ? 1000 : (turbo ? 220 : 500));
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
