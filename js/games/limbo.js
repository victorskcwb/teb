'use strict';

/* =========================================================
   Limbo — escolha um multiplicador alvo; se o resultado
   sorteado for maior ou igual, ganha aposta × alvo. RTP 99%.
   P(resultado ≥ x) = 0,99 / x
   ========================================================= */
(function () {
  const genResult = () => Math.max(1, Math.floor(99 / (1 - RNG.float())) / 100);

  App.register({
    id: 'limbo', name: 'Limbo', art: 'saucer', category: 'originais',
    tag: 'Escolha o alvo · até 1.000.000x', colors: ['#8b5cf6', '#1e1b4b'],
    rules: `
      <p>Defina um <b>multiplicador alvo</b> (ex.: 2.00x) e aposte. Um multiplicador é sorteado na hora:</p>
      <ul><li>Se o resultado for <b>maior ou igual</b> ao alvo, você ganha aposta × alvo.</li><li>Se for menor, perde a aposta.</li></ul>
      <p>Quanto maior o alvo, menor a chance: chance = 99% ÷ alvo.</p>
      <p class="muted small">RTP teórico: 99%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="limbo">
          <div class="history"></div>
          <div class="limbo-stage">
            <img class="limbo-ufo" src="${IMG('saucer')}" alt="">
            <div class="limbo-num">1.00x</div>
            <div class="limbo-sub muted">Escolha o alvo e aposte</div>
          </div>
          <div class="panel controls-panel">
            <div class="lb-bet"></div>
            <div class="mines-row">
              <label>Multiplicador alvo<input type="number" class="lb-target" value="2" min="1.01" step="0.01" inputmode="decimal"></label>
              <div class="mines-info"><small>Chance</small><b class="lb-chance">—</b></div>
              <div class="mines-info"><small>Prêmio</small><b class="lb-pay">—</b></div>
            </div>
            <div class="quick-targets">${[1.5, 2, 3, 5, 10, 100].map(x => `<button class="toggle" data-x="${x}">${x}x</button>`).join('')}</div>
            <div class="btn-row"><button class="btn btn-big btn-primary play">Apostar</button><button class="btn toggle auto">🔁 Auto</button></div>
          </div>
        </div>`);
      root.append(el);
      const numEl = $('.limbo-num', el), subEl = $('.limbo-sub', el), histEl = $('.history', el);
      const tIn = $('.lb-target', el), play = $('.play', el), autoBtn = $('.auto', el), ufo = $('.limbo-ufo', el);
      const betIn = UI.betInput({ value: 10 });
      $('.lb-bet', el).append(betIn.el);
      const target = () => Math.min(1000000, Math.max(1.01, round2(parseFloat(String(tIn.value).replace(',', '.')) || 2)));
      const info = () => {
        $('.lb-chance', el).textContent = (99 / target()).toFixed(2) + '%';
        $('.lb-pay', el).textContent = '🪙 ' + fmt(betIn.value * target());
      };
      tIn.addEventListener('input', info);
      tIn.addEventListener('change', () => { tIn.value = target(); info(); });
      betIn.el.addEventListener('click', info);
      betIn.el.addEventListener('change', info);
      $('.quick-targets', el).addEventListener('click', e => { if (e.target.dataset.x) { Sfx.click(); tIn.value = e.target.dataset.x; info(); } });
      info();

      let busy = false, auto = false;
      async function go() {
        if (busy) return;
        const bet = betIn.value, t = target();
        if (!Wallet.bet(bet)) { auto = false; autoBtn.classList.remove('on'); return; }
        busy = true; play.disabled = true;
        const res = genResult();
        const won = res >= t;
        numEl.className = 'limbo-num';
        ufo.classList.remove('fly'); void ufo.offsetWidth; ufo.classList.add('fly');
        const t0 = performance.now(), dur = 550;
        await new Promise(r => {
          const step = () => {
            const p = Math.min(1, (performance.now() - t0) / dur);
            numEl.textContent = fmtX(1 + (res - 1) * (1 - Math.pow(1 - p, 3)));
            if (p < 1 && ctx.alive) requestAnimationFrame(step); else r();
          };
          step();
        });
        numEl.textContent = fmtX(res);
        numEl.classList.add(won ? 'win' : 'lose');
        const pay = won ? round2(bet * t) : 0;
        if (pay) Wallet.win(pay);
        ctx.round(bet, pay);
        histEl.prepend(h(`<span class="pill ${won ? 'good' : 'low'}">${fmtX(res)}</span>`));
        while (histEl.children.length > 25) histEl.lastChild.remove();
        subEl.textContent = won ? `Ganhou 🪙 ${fmt(pay)}!` : `Precisava de ${fmtX(t)}`;
        if (won) UI.result(pay, bet); else Sfx.lose();
        busy = false; play.disabled = false;
        if (auto && ctx.alive) { await ctx.sleep(700); while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300); if (auto && ctx.alive) go(); }
      }
      play.addEventListener('click', go);
      autoBtn.addEventListener('click', () => { Sfx.click(); auto = !auto; autoBtn.classList.toggle('on', auto); if (auto && !busy) go(); });
      ctx.onUnmount(() => { auto = false; });
    },
  });
})();
