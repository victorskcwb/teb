'use strict';

/* =========================================================
   Mines — campo 5×5, escolha quantas minas; cada diamante
   aumenta o multiplicador. Saque quando quiser. RTP 97%.
   ========================================================= */
(function () {
  const N = 25, EDGE = 0.97;

  function multFor(mines, revealed) {
    let m = EDGE;
    for (let i = 0; i < revealed; i++) m *= (N - i) / (N - mines - i);
    return revealed === 0 ? 1 : m;
  }

  App.register({
    id: 'mines', name: 'Mines', art: 'bomb', sprites: ['gem', 'bomb'], category: 'originais',
    tag: 'Ache diamantes, fuja das bombas', colors: ['#10b981', '#065f46'],
    rules: `
      <p>Escolha o valor e o número de <b>minas</b> (1 a 24) e comece. Clique nas casas para revelar:</p>
      <ul><li>💎 <b>Diamante</b>: o multiplicador sobe.</li><li>💣 <b>Mina</b>: você perde a aposta.</li></ul>
      <p>Clique em <b>Sacar</b> a qualquer momento para garantir aposta × multiplicador atual. Mais minas = multiplicadores maiores e mais risco.</p>
      <p class="muted small">RTP teórico: 97%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="mines">
          <div class="mines-board"></div>
          <div class="panel controls-panel">
            <div class="mines-bet"></div>
            <div class="mines-row">
              <label>Minas
                <select class="mines-count">${Array.from({ length: 24 }, (_, i) => `<option ${i + 1 === 3 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select>
              </label>
              <div class="mines-info"><small>Próximo</small><b class="next">—</b></div>
              <div class="mines-info"><small>Atual</small><b class="cur">—</b></div>
            </div>
            <button class="btn btn-big btn-primary action">Começar</button>
          </div>
        </div>`);
      root.append(el);

      const board = $('.mines-board', el), action = $('.action', el);
      const sel = $('.mines-count', el), nextEl = $('.next', el), curEl = $('.cur', el);
      const betIn = UI.betInput({ value: 10 });
      $('.mines-bet', el).append(betIn.el);

      const tiles = [];
      for (let i = 0; i < N; i++) {
        const t = h(`<button class="mtile" disabled></button>`);
        t.dataset.i = i;
        board.append(t);
        tiles.push(t);
      }

      let game = null; // { bet, mines:Set, revealed, minesCount, over }

      function renderInfo() {
        const mc = Number(sel.value);
        const rev = game ? game.revealed : 0;
        nextEl.textContent = rev < N - mc ? fmtX(multFor(mc, rev + 1)) : '—';
        if (game && !game.over) {
          const m = multFor(mc, rev);
          curEl.textContent = rev ? fmtX(m) : '—';
          action.textContent = rev ? `Sacar 🪙 ${fmt(game.bet * m)}` : 'Escolha uma casa...';
          action.disabled = rev === 0;
          action.className = 'btn btn-big action ' + (rev ? 'btn-success' : 'btn-ghost');
        } else {
          curEl.textContent = '—';
          action.textContent = 'Começar';
          action.disabled = false;
          action.className = 'btn btn-big btn-primary action';
        }
        sel.disabled = !!(game && !game.over);
        betIn.setDisabled(!!(game && !game.over));
      }
      sel.addEventListener('change', renderInfo);

      function revealAll() {
        tiles.forEach((t, i) => {
          if (t.classList.contains('open')) return;
          t.classList.add('open', 'ghost');
          t.innerHTML = ico(game.mines.has(i) ? 'bomb' : 'gem');
        });
      }

      function start() {
        const bet = betIn.value;
        if (!Wallet.bet(bet)) return;
        Sfx.click();
        const mc = Number(sel.value);
        const idx = RNG.shuffle([...Array(N).keys()]);
        game = { bet, minesCount: mc, mines: new Set(idx.slice(0, mc)), revealed: 0, over: false };
        tiles.forEach(t => { t.className = 'mtile'; t.innerHTML = ''; t.disabled = false; });
        board.classList.remove('lost', 'won');
        renderInfo();
      }

      function cashout(silent) {
        if (!game || game.over || !game.revealed) return;
        const m = multFor(game.minesCount, game.revealed);
        const pay = round2(game.bet * m);
        game.over = true;
        Wallet.win(pay);
        ctx.round(game.bet, pay);
        if (!silent) {
          board.classList.add('won');
          revealAll();
          tiles.forEach(t => { t.disabled = true; });
          UI.result(pay, game.bet);
          renderInfo();
        }
      }

      board.addEventListener('click', e => {
        const t = e.target.closest('.mtile');
        if (!t || !game || game.over || t.classList.contains('open')) return;
        const i = Number(t.dataset.i);
        t.classList.add('open');
        if (game.mines.has(i)) {
          t.innerHTML = ico('bomb');
          t.classList.add('boom');
          game.over = true;
          ctx.round(game.bet, 0);
          board.classList.add('lost');
          Sfx.boom();
          revealAll();
          tiles.forEach(x => { x.disabled = true; });
          renderInfo();
          return;
        }
        t.innerHTML = ico('gem');
        game.revealed++;
        Sfx.gem();
        Sfx.tone(700 + game.revealed * 60, 0.09, 'triangle', 0.035);
        if (game.revealed === N - game.minesCount) cashout(false);
        else renderInfo();
      });

      action.addEventListener('click', () => {
        if (game && !game.over) cashout(false);
        else start();
      });

      renderInfo();
      ctx.onUnmount(() => {
        if (!game || game.over) return;
        if (game.revealed) cashout(true);
        else { Wallet.refund(game.bet); game.over = true; }
      });
    },
  });
})();
