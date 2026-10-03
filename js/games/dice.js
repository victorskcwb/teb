'use strict';

/* =========================================================
   Dice — sorteio de 0,00 a 100,00. Escolha "acima de" ou
   "abaixo de" um alvo. Multiplicador = 99 / chance. RTP 99%.
   ========================================================= */
(function () {
  App.register({
    id: 'dice', name: 'Dice', art: 'die', category: 'originais',
    tag: 'Acima ou abaixo · você define a chance', colors: ['#22c55e', '#0f172a'],
    rules: `
      <p>Arraste o controle para escolher o alvo e o modo (<b>acima</b> ou <b>abaixo</b>). Um número de <b>0,00 a 100,00</b> é sorteado.</p>
      <p>Chance menor = prêmio maior. Multiplicador = 99 ÷ chance (ex.: 49,5% de chance paga 2x).</p>
      <p class="muted small">RTP teórico: 99%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="dice">
          <div class="history"></div>
          <div class="dice-stage">
            <div class="dice-result"><img src="${IMG('die')}" alt=""><b>50.00</b></div>
            <div class="dice-track">
              <div class="dice-fill"></div>
              <input type="range" class="dice-range" min="2" max="98" step="1" value="50">
              <div class="dice-marker hidden"><span></span></div>
            </div>
            <div class="dice-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          </div>
          <div class="panel controls-panel">
            <div class="dc-bet"></div>
            <div class="mines-row">
              <div class="mines-info"><small>Multiplicador</small><b class="dc-mult">—</b></div>
              <div class="mines-info"><small>Chance</small><b class="dc-chance">—</b></div>
              <button class="btn btn-ghost dc-mode">Rolar acima ▲</button>
            </div>
            <div class="btn-row"><button class="btn btn-big btn-primary play">Rolar</button><button class="btn toggle auto">🔁 Auto</button></div>
          </div>
        </div>`);
      root.append(el);
      const range = $('.dice-range', el), fill = $('.dice-fill', el), marker = $('.dice-marker', el);
      const resEl = $('.dice-result b', el), dieImg = $('.dice-result img', el), histEl = $('.history', el);
      const modeBtn = $('.dc-mode', el), play = $('.play', el), autoBtn = $('.auto', el);
      const betIn = UI.betInput({ value: 10 });
      $('.dc-bet', el).append(betIn.el);
      let over = true;
      const chance = () => (over ? 100 - Number(range.value) : Number(range.value));
      const render = () => {
        const v = Number(range.value);
        fill.style.background = over
          ? `linear-gradient(90deg, #ef4444 ${v}%, #22c55e ${v}%)`
          : `linear-gradient(90deg, #22c55e ${v}%, #ef4444 ${v}%)`;
        $('.dc-mult', el).textContent = fmtX(99 / chance());
        $('.dc-chance', el).textContent = chance().toFixed(0) + '%';
        modeBtn.textContent = over ? `Acima de ${v} ▲` : `Abaixo de ${v} ▼`;
      };
      range.addEventListener('input', () => { Sfx.tick(); render(); });
      modeBtn.addEventListener('click', () => { Sfx.click(); over = !over; range.value = 100 - Number(range.value); render(); });
      render();

      let busy = false, auto = false;
      async function go() {
        if (busy) return;
        const bet = betIn.value;
        if (!Wallet.bet(bet)) { auto = false; autoBtn.classList.remove('on'); return; }
        busy = true; play.disabled = true; range.disabled = true; modeBtn.disabled = true;
        const roll = Math.floor(RNG.float() * 10001) / 100;
        const t = Number(range.value);
        const won = over ? roll > t : roll < t;
        dieImg.classList.remove('roll'); void dieImg.offsetWidth; dieImg.classList.add('roll');
        marker.classList.remove('hidden', 'win', 'lose');
        marker.style.left = roll + '%';
        $('span', marker).textContent = roll.toFixed(2);
        Sfx.dice();
        await ctx.sleep(450);
        resEl.textContent = roll.toFixed(2);
        resEl.className = won ? 'win' : 'lose';
        marker.classList.add(won ? 'win' : 'lose');
        const pay = won ? round2(bet * 99 / chance()) : 0;
        if (pay) Wallet.win(pay);
        ctx.round(bet, pay);
        histEl.prepend(h(`<span class="pill ${won ? 'good' : 'low'}">${roll.toFixed(2)}</span>`));
        while (histEl.children.length > 25) histEl.lastChild.remove();
        if (won) UI.result(pay, bet); else Sfx.lose();
        busy = false; play.disabled = false; range.disabled = false; modeBtn.disabled = false;
        if (auto && ctx.alive) { await ctx.sleep(600); while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300); if (auto && ctx.alive) go(); }
      }
      play.addEventListener('click', go);
      autoBtn.addEventListener('click', () => { Sfx.click(); auto = !auto; autoBtn.classList.toggle('on', auto); if (auto && !busy) go(); });
      ctx.onUnmount(() => { auto = false; });
    },
  });
})();
