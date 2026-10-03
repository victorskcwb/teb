'use strict';

/* =========================================================
   Torre — suba andares escolhendo uma casa segura por andar.
   Multiplicador no andar k = 0,97 / p^k. Saque a qualquer momento.
   ========================================================= */
(function () {
  const FLOORS = 8, EDGE = 0.97;
  const LEVELS = {
    facil: { name: 'Fácil', tiles: 4, bombs: 1 },
    medio: { name: 'Médio', tiles: 3, bombs: 1 },
    dificil: { name: 'Difícil', tiles: 2, bombs: 1 },
    expert: { name: 'Expert', tiles: 3, bombs: 2 },
  };
  const pSafe = L => (L.tiles - L.bombs) / L.tiles;
  const multAt = (L, k) => (k === 0 ? 1 : EDGE / Math.pow(pSafe(L), k));

  App.register({
    id: 'torre', name: 'Torre', art: 'castle', sprites: ['gem', 'skull'], category: 'originais',
    tag: 'Suba andares · até 6.000x', colors: ['#f59e0b', '#422006'],
    rules: `
      <p>Aposte e escolha uma casa em cada andar, de baixo para cima. ${ico('gem')} = seguro, sobe de andar e o multiplicador cresce. ${ico('skull')} = perdeu.</p>
      <p>Saque quando quiser. Dificuldades: Fácil (1 caveira em 4), Médio (1 em 3), Difícil (1 em 2), Expert (2 em 3).</p>
      <p class="muted small">RTP teórico: 97%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="torre">
          <div class="tower"></div>
          <div class="panel controls-panel">
            <div class="tr-bet"></div>
            <div class="mines-row">
              <label>Dificuldade<select class="tr-level">${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}" ${k === 'medio' ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>
              <div class="mines-info"><small>Próximo</small><b class="next">—</b></div>
            </div>
            <button class="btn btn-big btn-primary action">Começar</button>
          </div>
        </div>`);
      root.append(el);
      const tower = $('.tower', el), sel = $('.tr-level', el), action = $('.action', el), nextEl = $('.next', el);
      const betIn = UI.betInput({ value: 10 });
      $('.tr-bet', el).append(betIn.el);
      let game = null; // { bet, L, floor, bombs: [Set], over }

      function build() {
        const L = LEVELS[sel.value];
        tower.innerHTML = '';
        for (let f = FLOORS - 1; f >= 0; f--) {
          const row = h(`<div class="tw-row" data-f="${f}"><span class="tw-mult">${fmtX(multAt(L, f + 1))}</span><div class="tw-tiles"></div></div>`);
          for (let t = 0; t < L.tiles; t++) $('.tw-tiles', row).append(h(`<button class="tw-tile" data-t="${t}" disabled></button>`));
          tower.append(row);
        }
      }
      const rowEl = f => $(`.tw-row[data-f="${f}"]`, tower);

      function render() {
        const L = game ? game.L : LEVELS[sel.value];
        const live = game && !game.over;
        $$('.tw-row', tower).forEach(r => {
          const f = Number(r.dataset.f);
          r.classList.toggle('active', !!live && f === game.floor);
          r.classList.toggle('passed', !!game && f < game.floor);
          $$('.tw-tile', r).forEach(t => { t.disabled = !(live && f === game.floor); });
        });
        nextEl.textContent = live && game.floor < FLOORS ? fmtX(multAt(L, game.floor + 1)) : fmtX(multAt(L, 1));
        sel.disabled = !!live;
        betIn.setDisabled(!!live);
        if (live && game.floor > 0) { action.textContent = `Sacar 🪙 ${fmt(game.bet * multAt(L, game.floor))}`; action.className = 'btn btn-big btn-success action'; action.disabled = false; }
        else if (live) { action.textContent = 'Escolha uma casa no 1º andar'; action.className = 'btn btn-big btn-ghost action'; action.disabled = true; }
        else { action.textContent = 'Começar'; action.className = 'btn btn-big btn-primary action'; action.disabled = false; }
      }

      function revealAll() {
        game.bombs.forEach((set, f) => {
          $$('.tw-tile', rowEl(f)).forEach((t, i) => {
            if (t.innerHTML) return;
            t.innerHTML = ico(set.has(i) ? 'skull' : 'gem');
            t.classList.add('ghost');
          });
        });
      }

      function start() {
        const bet = betIn.value;
        if (!Wallet.bet(bet)) return;
        Sfx.chip();
        const L = LEVELS[sel.value];
        build();
        game = {
          bet, L, floor: 0, over: false,
          bombs: Array.from({ length: FLOORS }, () => new Set(RNG.shuffle([...Array(L.tiles).keys()]).slice(0, L.bombs))),
        };
        render();
      }
      function end(pay) {
        game.over = true;
        if (pay > 0) Wallet.win(pay);
        ctx.round(game.bet, pay, game.bet, { floors: game.floor });
        if (!ctx.alive) return;
        revealAll();
        if (pay > 0) UI.result(pay, game.bet);
        render();
      }

      tower.addEventListener('click', e => {
        const t = e.target.closest('.tw-tile');
        if (!t || !game || game.over) return;
        const f = Number(t.closest('.tw-row').dataset.f);
        if (f !== game.floor) return;
        const i = Number(t.dataset.t);
        if (game.bombs[f].has(i)) {
          t.innerHTML = ico('skull');
          t.classList.add('boom');
          tower.classList.remove('lost'); void tower.offsetWidth; tower.classList.add('lost');
          Sfx.boom();
          end(0);
          return;
        }
        t.innerHTML = ico('gem');
        t.classList.add('safe');
        game.floor++;
        Sfx.gem();
        Sfx.tone(600 + game.floor * 80, 0.1, 'triangle', 0.035);
        if (game.floor === FLOORS) end(round2(game.bet * multAt(game.L, FLOORS)));
        else render();
      });
      action.addEventListener('click', () => {
        if (game && !game.over) { if (game.floor) end(round2(game.bet * multAt(game.L, game.floor))); }
        else start();
      });
      sel.addEventListener('change', () => { if (!game || game.over) { game = null; build(); render(); } });
      build();
      render();
      ctx.onUnmount(() => {
        if (!game || game.over) return;
        if (game.floor) end(round2(game.bet * multAt(game.L, game.floor)));
        else { Wallet.refund(game.bet); game.over = true; }
      });
    },
  });
})();
