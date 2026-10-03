'use strict';

/* =========================================================
   Blackjack — 6 baralhos, dealer para no 17 (inclusive soft),
   blackjack paga 3:2, dobrar em 2 cartas, 1 divisão.
   ========================================================= */
(function () {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const val = r => (r === 'A' ? 11 : ['10', 'J', 'Q', 'K'].includes(r) ? 10 : Number(r));

  function score(cards) {
    let t = 0, aces = 0;
    for (const c of cards) { t += val(c.r); if (c.r === 'A') aces++; }
    while (t > 21 && aces) { t -= 10; aces--; }
    return { t, soft: aces > 0 };
  }

  App.register({
    id: 'blackjack', name: 'Blackjack', art: 'joker', category: 'mesa',
    tag: '21 contra o dealer', colors: ['#0f766e', '#134e4a'],
    rules: `
      <p>Chegue o mais perto possível de <b>21</b> sem passar. Figuras valem 10, Ás vale 1 ou 11.</p>
      <ul>
        <li><b>Pedir</b>: mais uma carta. <b>Parar</b>: encerra sua mão.</li>
        <li><b>Dobrar</b>: dobra a aposta e recebe só mais uma carta (apenas com 2 cartas).</li>
        <li><b>Dividir</b>: com duas cartas de mesmo valor, separa em duas mãos (aposta extra igual). Ases divididos recebem só uma carta cada.</li>
      </ul>
      <p>O dealer compra até ter 17 ou mais. <b>Blackjack</b> (Ás + 10 nas 2 primeiras cartas) paga <b>3:2</b>; vitória normal paga 1:1; empate devolve a aposta.</p>
      <p class="muted small">6 baralhos. RTP com estratégia básica: ~99,4%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="bj">
          <div class="bj-table">
            <div class="bj-side">
              <div class="bj-label">Dealer <span class="bj-score dealer-score"></span></div>
              <div class="bj-cards dealer-cards"></div>
            </div>
            <div class="bj-msg">Faça sua aposta</div>
            <div class="bj-hands"></div>
          </div>
          <div class="panel controls-panel">
            <div class="bj-betarea"></div>
            <div class="bj-actions">
              <button class="btn btn-ghost" data-a="hit">Pedir</button>
              <button class="btn btn-ghost" data-a="stand">Parar</button>
              <button class="btn btn-ghost" data-a="double">Dobrar</button>
              <button class="btn btn-ghost" data-a="split">Dividir</button>
            </div>
            <button class="btn btn-big btn-primary deal">Distribuir</button>
          </div>
        </div>`);
      root.append(el);

      const dealerEl = $('.dealer-cards', el), dealerScore = $('.dealer-score', el);
      const handsEl = $('.bj-hands', el), msgEl = $('.bj-msg', el);
      const dealBtn = $('.deal', el), actions = $('.bj-actions', el);
      const betIn = UI.betInput({ value: 10 });
      $('.bj-betarea', el).append(betIn.el);

      let shoe = [], phase = 'bet', hands = [], dealer = [], active = 0, holeHidden = true, lock = false;
      const gone = () => phase === 'abandoned';

      function newShoe() {
        shoe = [];
        for (let d = 0; d < 6; d++) for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s });
        RNG.shuffle(shoe);
      }
      function draw() {
        if (shoe.length < 60) { newShoe(); if (ctx.alive) UI.toast('Embaralhando o sapato...'); }
        return shoe.pop();
      }
      newShoe();

      const cardHtml = (c, hidden) => hidden
        ? '<div class="pcard back"></div>'
        : `<div class="pcard ${c.s === '♥' || c.s === '♦' ? 'red' : ''}"><span>${c.r}</span><i>${c.s}</i></div>`;

      function render() {
        dealerEl.innerHTML = dealer.map((c, i) => cardHtml(c, i === 1 && holeHidden)).join('');
        dealerScore.textContent = dealer.length ? (holeHidden ? score([dealer[0]]).t : score(dealer).t) : '';
        handsEl.innerHTML = hands.map((hd, i) => {
          const sc = score(hd.cards);
          return `<div class="bj-hand ${phase === 'player' && i === active && hands.length > 1 ? 'active' : ''} ${hd.result || ''}">
            <div class="bj-cards">${hd.cards.map(c => cardHtml(c)).join('')}</div>
            <div class="bj-label">${hd.cards.length ? `<span class="bj-score">${sc.soft && sc.t < 21 ? `${sc.t - 10}/${sc.t}` : sc.t}</span>` : ''} 🪙 ${fmt(hd.bet)}${hd.label ? ` · <b>${hd.label}</b>` : ''}</div>
          </div>`;
        }).join('');
        const hd = hands[active];
        const canAct = phase === 'player' && !lock && hd && !hd.done;
        $('[data-a="hit"]', actions).disabled = !canAct;
        $('[data-a="stand"]', actions).disabled = !canAct;
        $('[data-a="double"]', actions).disabled = !(canAct && hd.cards.length === 2 && Wallet.balance >= hd.bet);
        $('[data-a="split"]', actions).disabled = !(canAct && hands.length === 1 && hd.cards.length === 2 &&
          val(hd.cards[0].r) === val(hd.cards[1].r) && Wallet.balance >= hd.bet);
        actions.classList.toggle('hidden', phase !== 'player');
        dealBtn.classList.toggle('hidden', phase === 'player' || phase === 'dealing' || phase === 'dealer');
        dealBtn.textContent = phase === 'done' ? 'Nova mão' : 'Distribuir';
        betIn.setDisabled(phase !== 'bet' && phase !== 'done');
      }

      async function give(target) {
        target.push(draw());
        Sfx.card();
        render();
        await ctx.sleep(300);
      }

      async function deal() {
        const bet = betIn.value;
        if (!Wallet.bet(bet)) return;
        Sfx.click();
        phase = 'dealing';
        hands = [{ cards: [], bet, done: false }];
        dealer = [];
        active = 0;
        holeHidden = true;
        msgEl.textContent = '';
        render();
        await give(hands[0].cards); if (gone()) return;
        await give(dealer); if (gone()) return;
        await give(hands[0].cards); if (gone()) return;
        await give(dealer); if (gone()) return;

        const pBJ = score(hands[0].cards).t === 21, dBJ = score(dealer).t === 21;
        if (pBJ || dBJ) {
          holeHidden = false;
          return settle({ pBJ, dBJ });
        }
        phase = 'player';
        msgEl.textContent = 'Sua vez';
        render();
      }

      function next() {
        const i = hands.findIndex(x => !x.done);
        if (i === -1) return dealerPlay();
        active = i;
        render();
      }

      async function act(a) {
        const hd = hands[active];
        if (phase !== 'player' || lock || !hd || hd.done) return;
        lock = true;
        Sfx.click();
        if (a === 'hit') {
          await give(hd.cards);
          if (gone()) return;
          if (score(hd.cards).t >= 21) hd.done = true;
        } else if (a === 'stand') {
          hd.done = true;
        } else if (a === 'double') {
          if (hd.cards.length === 2 && Wallet.bet(hd.bet)) {
            hd.bet = round2(hd.bet * 2);
            await give(hd.cards);
            if (gone()) return;
            hd.done = true;
          }
        } else if (a === 'split') {
          const [c1, c2] = hd.cards;
          if (hands.length === 1 && hd.cards.length === 2 && val(c1.r) === val(c2.r) && Wallet.bet(hd.bet)) {
            hands = [{ cards: [c1], bet: hd.bet, done: false, split: true }, { cards: [c2], bet: hd.bet, done: false, split: true }];
            active = 0;
            await give(hands[0].cards); if (gone()) return;
            await give(hands[1].cards); if (gone()) return;
            if (c1.r === 'A') hands.forEach(x => { x.done = true; });
            hands.forEach(x => { if (score(x.cards).t === 21) x.done = true; });
          }
        }
        lock = false;
        if (hands.every(x => x.done) || hands[active].done) next();
        else render();
      }

      async function dealerPlay() {
        phase = 'dealer';
        holeHidden = false;
        msgEl.textContent = 'Vez do dealer';
        render();
        await ctx.sleep(500);
        const anyAlive = hands.some(x => score(x.cards).t <= 21);
        while (anyAlive && score(dealer).t < 17) await give(dealer);
        settle({});
      }

      function settle({ pBJ = false, dBJ = false }) {
        const d = score(dealer).t;
        let staked = 0, paid = 0;
        for (const hd of hands) {
          const p = score(hd.cards).t;
          let pay = 0, label, result;
          if (pBJ && dBJ) { pay = hd.bet; label = 'Empate'; result = 'push'; }
          else if (pBJ) { pay = hd.bet * 2.5; label = 'BLACKJACK!'; result = 'won'; }
          else if (dBJ) { label = 'Dealer tem Blackjack'; result = 'lost'; }
          else if (p > 21) { label = 'Estourou'; result = 'lost'; }
          else if (d > 21) { pay = hd.bet * 2; label = 'Dealer estourou — você ganhou'; result = 'won'; }
          else if (p > d) { pay = hd.bet * 2; label = 'Você ganhou'; result = 'won'; }
          else if (p === d) { pay = hd.bet; label = 'Empate'; result = 'push'; }
          else { label = 'Você perdeu'; result = 'lost'; }
          hd.label = label;
          hd.result = result;
          staked += hd.bet;
          paid += pay;
        }
        paid = round2(paid);
        if (paid > 0) Wallet.win(paid);
        ctx.round(staked, paid);
        phase = 'done';
        lock = false;
        msgEl.textContent = hands.length > 1 ? `Resultado: 🪙 ${fmt(paid)}` : hands[0].label;
        render();
        if (!ctx.alive) return;
        if (paid > staked) UI.result(paid, staked);
        else if (paid === staked) Sfx.click();
        else Sfx.lose();
      }

      dealBtn.addEventListener('click', () => { if (phase === 'bet' || phase === 'done') deal(); });
      actions.addEventListener('click', e => { const a = e.target.dataset.a; if (a) act(a); });
      render();

      ctx.onUnmount(() => {
        if (phase === 'dealing' || phase === 'player') {
          const staked = round2(hands.reduce((s, x) => s + x.bet, 0));
          phase = 'abandoned';
          Wallet.refund(staked);
        }
      });
    },
  });
})();
