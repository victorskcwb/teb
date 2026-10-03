'use strict';

/* =========================================================
   Hi-Lo — adivinhe se a próxima carta é maior ou menor.
   Cada acerto multiplica o prêmio por 0,99 / probabilidade.
   Baralho infinito (A = 1 ... K = 13). RTP 99%.
   ========================================================= */
(function () {
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUITS = [['♠', 0], ['♥', 1], ['♦', 1], ['♣', 0]];
  const draw = () => { const s = RNG.pick(SUITS); return { r: RNG.int(1, 13), s: s[0], red: s[1] }; };

  /** Opções de palpite para a carta atual. */
  function options(r) {
    const hi = r === 1 ? { label: 'Maior', p: 12 / 13, ok: n => n > r }
      : r === 13 ? { label: 'Igual', p: 1 / 13, ok: n => n === r }
        : { label: 'Maior ou igual', p: (14 - r) / 13, ok: n => n >= r };
    const lo = r === 13 ? { label: 'Menor', p: 12 / 13, ok: n => n < r }
      : r === 1 ? { label: 'Igual', p: 1 / 13, ok: n => n === r }
        : { label: 'Menor ou igual', p: r / 13, ok: n => n <= r };
    return { hi, lo };
  }
  const cardHtml = (c, cls = '') => `<div class="pcard hl-card ${c.red ? 'red' : ''} ${cls}"><span>${RANKS[c.r - 1]}</span><i>${c.s}</i></div>`;

  App.register({
    id: 'hilo', name: 'Hi-Lo', art: 'cards', category: 'originais',
    tag: 'Maior ou menor · saque quando quiser', colors: ['#0ea5e9', '#7c2d12'],
    rules: `
      <p>Aposte e uma carta é virada. Adivinhe se a próxima será <b>maior</b> ou <b>menor</b> (empates contam a seu favor em "ou igual").</p>
      <p>Cada acerto multiplica o prêmio — palpites mais difíceis multiplicam mais. Errou, perdeu. Use <b>Sacar</b> para garantir o prêmio ou <b>Pular</b> para trocar a carta sem risco.</p>
      <p class="muted small">A = 1 (menor), K = 13 (maior). RTP teórico: 99%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="hilo">
          <div class="hl-table">
            <div class="hl-trail"></div>
            <div class="hl-main"><div class="hl-cur"></div></div>
            <div class="hl-mult"><small>Multiplicador</small><b>1.00x</b></div>
          </div>
          <div class="panel controls-panel">
            <div class="hl-bet"></div>
            <div class="hl-guess">
              <button class="btn hl-btn hi" data-g="hi"></button>
              <button class="btn hl-btn lo" data-g="lo"></button>
            </div>
            <div class="btn-row"><button class="btn btn-ghost skip">⏭ Pular carta</button><button class="btn btn-big btn-primary action">Apostar</button></div>
          </div>
        </div>`);
      root.append(el);
      const curEl = $('.hl-cur', el), trail = $('.hl-trail', el), multEl = $('.hl-mult b', el);
      const action = $('.action', el), skip = $('.skip', el), hiBtn = $('.hi', el), loBtn = $('.lo', el);
      const betIn = UI.betInput({ value: 10 });
      $('.hl-bet', el).append(betIn.el);

      let card = draw(), game = null; // { bet, mult, steps }
      const showCard = (c, flip = true) => { curEl.innerHTML = cardHtml(c, flip ? 'flip' : ''); };
      showCard(card, false);

      function render() {
        const o = options(card.r);
        const live = game && !game.over;
        hiBtn.innerHTML = `▲ ${o.hi.label}<small>${(o.hi.p * 100).toFixed(1)}% · ${fmtX(0.99 / o.hi.p)}</small>`;
        loBtn.innerHTML = `▼ ${o.lo.label}<small>${(o.lo.p * 100).toFixed(1)}% · ${fmtX(0.99 / o.lo.p)}</small>`;
        hiBtn.disabled = loBtn.disabled = !live;
        skip.disabled = !live;
        betIn.setDisabled(!!live);
        multEl.textContent = fmtX(game ? game.mult : 1);
        if (live && game.steps > 0) { action.textContent = `Sacar 🪙 ${fmt(game.bet * game.mult)}`; action.className = 'btn btn-big btn-success action'; action.disabled = false; }
        else if (live) { action.textContent = 'Faça um palpite...'; action.className = 'btn btn-big btn-ghost action'; action.disabled = true; }
        else { action.textContent = 'Apostar'; action.className = 'btn btn-big btn-primary action'; action.disabled = false; }
      }

      function start() {
        const bet = betIn.value;
        if (!Wallet.bet(bet)) return;
        Sfx.chip();
        game = { bet, mult: 1, steps: 0, over: false };
        trail.innerHTML = '';
        card = draw();
        showCard(card);
        render();
      }
      function end(pay) {
        game.over = true;
        if (pay > 0) Wallet.win(pay);
        ctx.round(game.bet, pay);
        if (ctx.alive) { if (pay > 0) UI.result(pay, game.bet); render(); }
      }
      function guess(g) {
        if (!game || game.over) return;
        const opt = options(card.r)[g];
        const next = draw();
        trail.append(h(cardHtml(card, 'mini')));
        while (trail.children.length > 10) trail.firstChild.remove();
        card = next;
        showCard(card);
        if (opt.ok(next.r)) {
          game.mult = Math.round(game.mult * 0.99 / opt.p * 10000) / 10000;
          game.steps++;
          Sfx.card();
          Sfx.tone(600 + game.steps * 70, 0.1, 'triangle', 0.04);
          render();
        } else {
          curEl.firstChild.classList.add('bad');
          Sfx.lose();
          end(0);
        }
      }

      hiBtn.addEventListener('click', () => guess('hi'));
      loBtn.addEventListener('click', () => guess('lo'));
      skip.addEventListener('click', () => {
        if (!game || game.over) return;
        Sfx.click();
        trail.append(h(cardHtml(card, 'mini skipped')));
        card = draw();
        showCard(card);
        render();
      });
      action.addEventListener('click', () => {
        if (game && !game.over) { if (game.steps) end(round2(game.bet * game.mult)); }
        else start();
      });
      render();
      ctx.onUnmount(() => {
        if (!game || game.over) return;
        if (game.steps) end(round2(game.bet * game.mult));
        else { Wallet.refund(game.bet); game.over = true; }
      });
    },
  });
})();
