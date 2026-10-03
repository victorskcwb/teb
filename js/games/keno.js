'use strict';

/* =========================================================
   Keno — 40 números, escolha de 1 a 10. São sorteados 10.
   Tabela calculada pela distribuição hipergeométrica: RTP ~99%.
   ========================================================= */
(function () {
  const N = 40, DRAW = 10, MAXPICK = 10;
  const PAY = {
    1: [0.7, 1.85],
    2: [0, 1.9, 4.5],
    3: [0, 1, 3.1, 10.4],
    4: [0, 0.8, 1.8, 5, 22.5],
    5: [0, 0.25, 1.4, 4.1, 16.5, 36],
    6: [0, 0, 1, 3.68, 7, 16.5, 40],
    7: [0, 0, 0.47, 3, 4.5, 14, 31, 60],
    8: [0, 0, 0, 2.2, 4, 13, 22, 55, 70],
    9: [0, 0, 0, 1.55, 3, 8, 15, 44, 60, 85],
    10: [0, 0, 0, 1.4, 2.25, 4.5, 8, 17, 50, 80, 100],
  };

  App.register({
    id: 'keno', name: 'Keno', art: 'bubbles', category: 'originais',
    tag: 'Escolha até 10 números · até 100x', colors: ['#06b6d4', '#312e81'],
    rules: `
      <p>Escolha de <b>1 a 10 números</b> entre 1 e 40 e aposte. São sorteados <b>10 números</b>. Quanto mais acertos, maior o prêmio — veja a tabela abaixo do tabuleiro, que muda conforme a quantidade escolhida.</p>
      <p class="muted small">RTP teórico: ~99% para qualquer quantidade de números.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="keno">
          <div class="keno-board"></div>
          <div class="keno-pay"></div>
          <div class="panel controls-panel">
            <div class="kn-bet"></div>
            <div class="btn-row"><button class="btn btn-ghost rand">🎲 Aleatório</button><button class="btn btn-ghost clear">Limpar</button></div>
            <div class="btn-row"><button class="btn btn-big btn-primary play">Jogar</button><button class="btn toggle auto">🔁 Auto</button></div>
          </div>
        </div>`);
      root.append(el);
      const board = $('.keno-board', el), payEl = $('.keno-pay', el), play = $('.play', el), autoBtn = $('.auto', el);
      const betIn = UI.betInput({ value: 5 });
      $('.kn-bet', el).append(betIn.el);
      const cells = [];
      for (let i = 1; i <= N; i++) { const b = h(`<button class="kn">${i}</button>`); b.dataset.n = i; board.append(b); cells.push(b); }
      const picks = new Set();
      let busy = false, auto = false, hits = -1;

      const renderPay = () => {
        const t = PAY[picks.size];
        payEl.innerHTML = t
          ? t.map((m, i) => `<div class="kp ${i === hits ? 'hit' : ''} ${m === 0 ? 'zero' : ''}"><b>${m}x</b><small>${i} ✓</small></div>`).join('')
          : '<p class="muted center small">Escolha de 1 a 10 números</p>';
      };
      const renderBoard = () => cells.forEach((c, i) => c.classList.toggle('pick', picks.has(i + 1)));
      board.addEventListener('click', e => {
        const c = e.target.closest('.kn');
        if (!c || busy) return;
        const n = Number(c.dataset.n);
        if (picks.has(n)) picks.delete(n);
        else if (picks.size < MAXPICK) picks.add(n);
        else { UI.toast('Máximo de 10 números'); return; }
        Sfx.click();
        cells.forEach(x => x.classList.remove('hit', 'miss', 'drawn'));
        hits = -1;
        renderBoard(); renderPay();
      });
      $('.rand', el).addEventListener('click', () => {
        if (busy) return;
        Sfx.chip();
        const k = picks.size || 10;
        picks.clear();
        RNG.shuffle([...Array(N).keys()]).slice(0, k).forEach(i => picks.add(i + 1));
        cells.forEach(x => x.classList.remove('hit', 'miss', 'drawn'));
        hits = -1;
        renderBoard(); renderPay();
      });
      $('.clear', el).addEventListener('click', () => {
        if (busy) return;
        picks.clear(); hits = -1;
        cells.forEach(x => x.classList.remove('hit', 'miss', 'drawn'));
        renderBoard(); renderPay();
      });

      async function go() {
        if (busy) return;
        if (!picks.size) { UI.toast('Escolha pelo menos 1 número'); auto = false; autoBtn.classList.remove('on'); return; }
        const bet = betIn.value;
        if (!Wallet.bet(bet)) { auto = false; autoBtn.classList.remove('on'); return; }
        busy = true; play.disabled = true; betIn.setDisabled(true);
        cells.forEach(x => x.classList.remove('hit', 'miss', 'drawn'));
        hits = 0;
        renderPay();
        const drawn = RNG.shuffle([...Array(N).keys()].map(i => i + 1)).slice(0, DRAW);
        for (const n of drawn) {
          await ctx.sleep(110);
          const c = cells[n - 1];
          if (picks.has(n)) { c.classList.add('hit'); hits++; Sfx.gem(); Sfx.tone(700 + hits * 90, 0.1, 'triangle', 0.035); }
          else { c.classList.add('drawn'); Sfx.tick(); }
          renderPay();
        }
        const m = PAY[picks.size][hits];
        const pay = round2(bet * m);
        if (pay > 0) Wallet.win(pay);
        ctx.round(bet, pay);
        if (ctx.alive) { if (pay > 0) UI.result(pay, bet); else Sfx.lose(); }
        busy = false; play.disabled = false; betIn.setDisabled(false);
        if (auto && ctx.alive) { await ctx.sleep(900); while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300); if (auto && ctx.alive) go(); }
      }
      play.addEventListener('click', go);
      autoBtn.addEventListener('click', () => { Sfx.click(); auto = !auto; autoBtn.classList.toggle('on', auto); if (auto && !busy) go(); });
      ctx.onUnmount(() => { auto = false; });
      renderPay();
    },
  });
})();
