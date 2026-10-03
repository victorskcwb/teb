'use strict';

/* =========================================================
   Double (vermelho / preto / branco) — estilo Blaze
   15 casas: 0 = branco (14x), 1–7 vermelho (2x), 8–14 preto (2x)
   ========================================================= */
(function () {
  const PATTERN = [0, 11, 5, 10, 6, 9, 7, 8, 1, 14, 2, 13, 3, 12, 4];
  const REPEAT = 10;
  const LAND_REP = 7;
  const BET_MS = 10000, SPIN_MS = 5000, SHOW_MS = 3000;
  const colorOf = n => (n === 0 ? 'white' : n <= 7 ? 'red' : 'black');
  const PAYS = { red: 2, black: 2, white: 14 };
  const LABEL = { red: 'Vermelho', black: 'Preto', white: 'Branco' };

  App.register({
    id: 'double', name: 'Double', art: 'redcircle', category: 'originais',
    tag: 'Vermelho, preto ou branco', colors: ['#dc2626', '#111827'],
    rules: `
      <p>A cada rodada há <b>10 segundos</b> para apostar. Depois a roleta gira e para em uma das 15 casas:</p>
      <ul>
        <li>🔴 <b>Vermelho</b> (1 a 7) — paga <b>2x</b></li>
        <li>⚫ <b>Preto</b> (8 a 14) — paga <b>2x</b></li>
        <li>⚪ <b>Branco</b> (0) — paga <b>14x</b></li>
      </ul>
      <p>Você pode apostar em mais de uma cor na mesma rodada. Cada clique adiciona o valor da aposta.</p>
      <p class="muted small">RTP teórico: 93,3% em qualquer cor.</p>`,

    mount(root, ctx) {
      const tile = n => `<div class="dtile ${colorOf(n)}">${n === 0 ? '✦' : n}</div>`;
      const strip = Array.from({ length: REPEAT }, () => PATTERN.map(tile).join('')).join('');
      const el = h(`
        <div class="double">
          <div class="history squares"></div>
          <div class="double-stage">
            <div class="double-window"><div class="double-strip">${strip}</div><div class="double-pointer"></div></div>
            <div class="double-status"><span class="ds-text">Apostas abertas</span><div class="crash-bar"><i></i></div></div>
          </div>
          <div class="panel controls-panel">
            <div class="double-bet"></div>
            <div class="double-choices">
              <button class="dchoice red" data-c="red"><span>Vermelho</span><b>2x</b><em>🪙 0,00</em></button>
              <button class="dchoice white" data-c="white"><span>Branco</span><b>14x</b><em>🪙 0,00</em></button>
              <button class="dchoice black" data-c="black"><span>Preto</span><b>2x</b><em>🪙 0,00</em></button>
            </div>
          </div>
        </div>`);
      root.append(el);

      const stripEl = $('.double-strip', el), win = $('.double-window', el);
      const statusText = $('.ds-text', el), barFill = $('.crash-bar i', el);
      const histEl = $('.history', el);
      const betIn = UI.betInput({ value: 5 });
      $('.double-bet', el).append(betIn.el);

      let phase = 'betting';
      let bets = { red: 0, black: 0, white: 0 };
      let pos = RNG.int(0, 14);
      const history = [];

      const tileW = () => $('.dtile', stripEl).getBoundingClientRect().width + 6; // + gap
      function place(rep, idx, offset, animate) {
        const tw = tileW();
        const x = (rep * PATTERN.length + idx) * tw + (tw - 6) / 2 + offset - win.clientWidth / 2;
        stripEl.style.transition = animate ? `transform ${SPIN_MS}ms cubic-bezier(.12,.8,.18,1)` : 'none';
        stripEl.style.transform = `translateX(${-x}px)`;
      }
      requestAnimationFrame(() => place(1, PATTERN.indexOf(pos), 0, false));
      const ro = new ResizeObserver(() => { if (phase !== 'spinning') place(1, PATTERN.indexOf(pos), 0, false); });
      ro.observe(win);

      function pushHistory(n) {
        history.unshift(n);
        if (history.length > 20) history.pop();
        histEl.innerHTML = history.map(x => `<span class="sq ${colorOf(x)}">${x === 0 ? '✦' : x}</span>`).join('');
      }
      for (let i = 0; i < 12; i++) pushHistory(RNG.int(0, 14));

      function renderBets() {
        $$('.dchoice', el).forEach(b => {
          const c = b.dataset.c;
          $('em', b).textContent = '🪙 ' + fmt(bets[c]);
          b.classList.toggle('has', bets[c] > 0);
          b.disabled = phase !== 'betting';
        });
      }

      $('.double-choices', el).addEventListener('click', e => {
        const b = e.target.closest('.dchoice');
        if (!b || phase !== 'betting') return;
        const amt = betIn.value;
        if (!Wallet.bet(amt)) return;
        Sfx.chip();
        bets[b.dataset.c] = round2(bets[b.dataset.c] + amt);
        renderBets();
      });

      async function loop() {
        while (ctx.alive) {
          phase = 'betting';
          bets = { red: 0, black: 0, white: 0 };
          $$('.dtile.hit', stripEl).forEach(t => t.classList.remove('hit'));
          renderBets();
          const end = Date.now() + BET_MS;
          while (ctx.alive && Date.now() < end) {
            const left = end - Date.now();
            statusText.textContent = `Apostas abertas · girando em ${(left / 1000).toFixed(1)}s`;
            barFill.style.width = (left / BET_MS) * 100 + '%';
            await ctx.sleep(100);
          }
          if (!ctx.alive) break;

          phase = 'spinning';
          renderBets();
          statusText.textContent = 'Girando...';
          barFill.style.width = '0%';
          const result = RNG.int(0, 14);
          const idx = PATTERN.indexOf(result);
          const offset = (RNG.float() - 0.5) * (tileW() - 16);
          place(LAND_REP, idx, offset, true);
          // "tique" enquanto desacelera
          let ticks = 0;
          const tk = ctx.interval(() => { if (ticks++ < 30) Sfx.tick(); }, 140);
          await ctx.sleep(SPIN_MS + 100);
          ctx.clear(tk);
          pos = result;

          const color = colorOf(result);
          const payout = round2(bets[color] * PAYS[color]);
          const staked = bets.red + bets.black + bets.white;
          if (payout > 0) Wallet.win(payout);
          if (staked > 0) ctx.round(staked, payout);
          if (!ctx.alive) break;

          phase = 'result';
          pushHistory(result);
          const hitTile = stripEl.children[LAND_REP * PATTERN.length + idx];
          hitTile.classList.add('hit');
          statusText.textContent = `Deu ${LABEL[color]} ${result === 0 ? '✦' : result}!`;
          if (staked > 0) UI.result(payout, staked);
          await ctx.sleep(SHOW_MS);
          if (!ctx.alive) break;
          hitTile.classList.remove('hit');
          place(1, idx, offset, false);
        }
      }
      loop();

      ctx.onUnmount(() => {
        ro.disconnect();
        if (phase === 'betting') {
          const staked = round2(bets.red + bets.black + bets.white);
          if (staked > 0) Wallet.refund(staked);
          bets = { red: 0, black: 0, white: 0 };
        }
      });
    },
  });
})();
