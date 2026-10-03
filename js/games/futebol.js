'use strict';

/* =========================================================
   Futebol Studio (estilo "Football Studio" ao vivo)
   Uma carta para a Casa e uma para o Visitante; a maior vence.
   Casa / Visitante pagam 2x; Empate paga 12x (11:1).
   No empate, apostas em Casa/Visitante devolvem metade.
   RTP: Casa/Visitante ~96,2% · Empate ~92,3%
   ========================================================= */
(function () {
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUITS = [['♠', 0], ['♥', 1], ['♦', 1], ['♣', 0]];
  const draw = () => { const s = RNG.pick(SUITS); return { r: RNG.int(1, 13), s: s[0], red: s[1] }; };
  const AREAS = [
    { id: 'casa', name: 'Casa', pay: 2, art: 'soccer' },
    { id: 'empate', name: 'Empate', pay: 12, art: 'goal' },
    { id: 'fora', name: 'Visitante', pay: 2, art: 'soccer' },
  ];

  App.register({
    id: 'futebol', name: 'Futebol Studio', art: 'soccer', sprites: ['goal'], category: 'mesa',
    tag: 'Casa, empate ou visitante', colors: ['#16a34a', '#1e3a8a'],
    rules: `
      <p>Uma carta é virada para a <b>Casa</b> e outra para o <b>Visitante</b>. Vence a carta mais alta (A é a menor, K a maior; naipe não importa).</p>
      <ul><li><b>Casa</b> ou <b>Visitante</b>: paga <b>2x</b>.</li><li><b>Empate</b>: paga <b>12x</b> (11 para 1).</li></ul>
      <p>Se der empate, apostas em Casa ou Visitante devolvem <b>metade</b>.</p>
      <p class="muted small">RTP teórico: Casa/Visitante ~96,2%, Empate ~92,3%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="futebol">
          <div class="history squares fb-hist"></div>
          <div class="fb-field">
            <div class="fb-side casa"><h3>CASA</h3><div class="fb-card"></div></div>
            <div class="fb-vs"><img src="${IMG('soccer')}" alt=""><b class="fb-msg">Faça sua aposta</b></div>
            <div class="fb-side fora"><h3>VISITANTE</h3><div class="fb-card"></div></div>
          </div>
          <div class="fb-areas">${AREAS.map(a => `<button class="fb-area ${a.id}" data-a="${a.id}"><b>${a.name}</b><em>${a.pay}x</em><span class="fb-amt"></span></button>`).join('')}</div>
          <div class="panel controls-panel">
            <div class="fb-chips"></div>
            <div class="btn-row"><button class="btn btn-ghost undo">↶ Limpar</button><button class="btn btn-ghost again">↻ Repetir</button></div>
            <button class="btn btn-big btn-primary deal">⚽ Virar cartas</button>
          </div>
        </div>`);
      root.append(el);
      const chips = UI.chipSelector([1, 5, 10, 25, 100, 500], 10);
      $('.fb-chips', el).append(chips.el);
      const msgEl = $('.fb-msg', el), hist = $('.fb-hist', el), deal = $('.deal', el);
      const cardEl = side => $(`.fb-side.${side} .fb-card`, el);
      let bets = {}, last = null, busy = false;
      const total = () => Object.values(bets).reduce((s, v) => s + v, 0);
      const back = '<div class="pcard back"></div>';
      cardEl('casa').innerHTML = back;
      cardEl('fora').innerHTML = back;

      const render = () => {
        AREAS.forEach(a => {
          const b = $(`.fb-area.${a.id}`, el);
          b.classList.toggle('has', !!bets[a.id]);
          $('.fb-amt', b).textContent = bets[a.id] ? '🪙 ' + fmt(bets[a.id]) : '';
          b.disabled = busy;
        });
        deal.disabled = busy;
        deal.textContent = total() ? `⚽ Virar cartas (🪙 ${fmt(total())})` : '⚽ Virar cartas';
      };
      $('.fb-areas', el).addEventListener('click', e => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (!a || busy) return;
        Sfx.chip();
        bets[a] = round2((bets[a] || 0) + chips.value);
        render();
      });
      $('.undo', el).addEventListener('click', () => { if (!busy) { bets = {}; render(); } });
      $('.again', el).addEventListener('click', () => { if (!busy && last) { bets = { ...last }; Sfx.chip(); render(); } });

      deal.addEventListener('click', async () => {
        if (busy) return;
        const stake = round2(total());
        if (!stake) { UI.toast('Aposte em Casa, Empate ou Visitante'); return; }
        if (!Wallet.bet(stake)) return;
        busy = true; last = { ...bets }; render();
        $$('.fb-side', el).forEach(s => s.classList.remove('won'));
        cardEl('casa').innerHTML = back; cardEl('fora').innerHTML = back;
        msgEl.textContent = '...';
        const c1 = draw(), c2 = draw();
        const show = (side, c) => { cardEl(side).innerHTML = `<div class="pcard flip ${c.red ? 'red' : ''}"><span>${RANKS[c.r - 1]}</span><i>${c.s}</i></div>`; Sfx.card(); };
        await ctx.sleep(500); show('casa', c1);
        await ctx.sleep(700); show('fora', c2);
        await ctx.sleep(400);
        const res = c1.r > c2.r ? 'casa' : c2.r > c1.r ? 'fora' : 'empate';
        let pay = 0;
        if (res === 'empate') pay = (bets.empate || 0) * 12 + ((bets.casa || 0) + (bets.fora || 0)) / 2;
        else pay = (bets[res] || 0) * 2;
        pay = round2(pay);
        if (pay > 0) Wallet.win(pay);
        ctx.round(stake, pay);
        bets = {};
        busy = false;
        if (!ctx.alive) return;
        msgEl.textContent = res === 'empate' ? 'EMPATE!' : res === 'casa' ? 'CASA VENCE!' : 'VISITANTE VENCE!';
        if (res !== 'empate') $(`.fb-side.${res}`, el).classList.add('won');
        hist.prepend(h(`<div class="sq fb-${res}">${res === 'casa' ? 'C' : res === 'fora' ? 'V' : 'E'}</div>`));
        while (hist.children.length > 30) hist.lastChild.remove();
        if (pay > stake) UI.result(pay, stake); else if (pay > 0) Sfx.click(); else Sfx.lose();
        render();
      });

      for (let i = 0; i < 14; i++) {
        const a = RNG.int(1, 13), b = RNG.int(1, 13);
        const r = a > b ? 'casa' : b > a ? 'fora' : 'empate';
        hist.append(h(`<div class="sq fb-${r}">${r === 'casa' ? 'C' : r === 'fora' ? 'V' : 'E'}</div>`));
      }
      render();
      ctx.onUnmount(() => { /* apostas só são debitadas ao virar; nada a devolver */ });
    },
  });
})();
