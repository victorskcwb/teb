'use strict';

/* =========================================================
   Raspadinha — 3×3; três símbolos iguais ganham o prêmio do símbolo.
   O resultado é sorteado numa tabela fixa (RTP exato de 95%)
   e só então a cartela é montada. Uma raspadinha grátis por dia.
   ========================================================= */
(function () {
  const PRICES = [1, 2, 5, 10, 20, 50];
  const FREE_PRICE = 5;
  // p = chance da cartela premiar esse símbolo · EV = Σ p·m = 0,95
  const SYMS = [
    { id: 'cereja', img: 'plum', name: 'Cereja', m: 1, p: 0.18 },
    { id: 'trevo', img: 'clover', name: 'Trevo', m: 2, p: 0.11 },
    { id: 'sino', img: 'bell', name: 'Sino', m: 5, p: 0.04 },
    { id: 'saco', img: 'moneybag', name: 'Saco de ouro', m: 10, p: 0.015 },
    { id: 'gema', img: 'gem', name: 'Diamante', m: 50, p: 0.002 },
    { id: 'coroa', img: 'crown', name: 'Coroa', m: 500, p: 0.0002 },
  ];

  function drawOutcome() {
    let r = RNG.float();
    for (const s of SYMS) { if ((r -= s.p) < 0) return s; }
    return null;
  }
  /** Monta a cartela: 3 do símbolo premiado; os outros no máximo 2 vezes cada. */
  function makeCard(win) {
    const cells = win ? [win, win, win] : [];
    const count = {};
    const pool = SYMS.filter(s => s !== win);
    while (cells.length < 9) {
      const s = RNG.pick(pool);
      if ((count[s.id] || 0) >= 2) continue;
      count[s.id] = (count[s.id] || 0) + 1;
      cells.push(s);
    }
    return RNG.shuffle(cells);
  }

  App.register({
    id: 'raspadinha', name: 'Raspadinha', art: 'ticket', sprites: SYMS.map(s => s.img), category: 'originais',
    tag: 'Raspe e ache 3 iguais · até 500x', colors: ['#facc15', '#be123c'],
    rules: `
      <p>Compre uma cartela e <b>raspe</b> com o dedo ou o mouse. Achou <b>3 símbolos iguais</b>? Ganha o prêmio do símbolo × o preço da cartela.</p>
      <table class="paytable">${SYMS.map(s => `<tr><td class="pt-sym">${ico(s.img)}${ico(s.img)}${ico(s.img)}</td><td>${s.name}</td><td><b>${s.m}x</b></td></tr>`).join('')}</table>
      <p>🎁 Toda dia você ganha <b>1 raspadinha grátis</b> de 🪙 ${FREE_PRICE}.</p>
      <p class="muted small">Cerca de 1 em cada 3 cartelas é premiada. RTP teórico: 95%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="raspa">
          <div class="rs-card">
            <div class="rs-head"><img src="${IMG('ticket')}" alt=""><b>RASPADINHA DA SORTE</b><span class="rs-price"></span></div>
            <div class="rs-area">
              <div class="rs-grid"></div>
              <canvas class="rs-foil"></canvas>
              <div class="rs-result hidden"></div>
            </div>
            <div class="rs-legend">${SYMS.map(s => `<span>${ico(s.img)}${s.m}x</span>`).join('')}</div>
          </div>
          <div class="panel controls-panel">
            <div class="rs-free hidden"><button class="btn btn-gold btn-big free">🎁 Raspadinha grátis do dia (🪙 ${FREE_PRICE})</button></div>
            <div class="rs-prices">${PRICES.map(p => `<button class="toggle" data-p="${p}">🪙 ${p}</button>`).join('')}</div>
            <div class="btn-row"><button class="btn btn-ghost reveal" disabled>⚡ Revelar tudo</button><button class="btn btn-big btn-primary buy">Comprar</button></div>
          </div>
        </div>`);
      root.append(el);
      const gridEl = $('.rs-grid', el), area = $('.rs-area', el), canvas = $('.rs-foil', el), c2d = canvas.getContext('2d');
      const resultEl = $('.rs-result', el), buyBtn = $('.buy', el), revealBtn = $('.reveal', el);
      const freeBox = $('.rs-free', el), priceEl = $('.rs-price', el);
      let price = 5, card = null; // { cells, win, price, stake, done }

      /* ----- camada prateada ----- */
      let W = 0, H = 0, dpr = 1;
      function paintFoil() {
        dpr = window.devicePixelRatio || 1;
        W = area.clientWidth; H = area.clientHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        c2d.globalCompositeOperation = 'source-over';
        const g = c2d.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#9ca3af'); g.addColorStop(0.3, '#f3f4f6'); g.addColorStop(0.5, '#a1a1aa');
        g.addColorStop(0.7, '#e5e7eb'); g.addColorStop(1, '#71717a');
        c2d.fillStyle = g;
        c2d.fillRect(0, 0, W, H);
        c2d.strokeStyle = 'rgba(255,255,255,.25)';
        c2d.lineWidth = 2;
        for (let x = -H; x < W; x += 14) { c2d.beginPath(); c2d.moveTo(x, H); c2d.lineTo(x + H, 0); c2d.stroke(); }
        c2d.fillStyle = 'rgba(63,63,70,.55)';
        const label = card ? 'RASPE AQUI' : 'COMPRE PARA RASPAR';
        let fs = Math.round(W / 9);
        c2d.font = `900 ${fs}px Nunito, sans-serif`;
        const tw = c2d.measureText(label).width;
        if (tw > W * 0.86) { fs = Math.floor(fs * W * 0.86 / tw); c2d.font = `900 ${fs}px Nunito, sans-serif`; }
        c2d.textAlign = 'center';
        c2d.textBaseline = 'middle';
        c2d.fillText(label, W / 2, H / 2);
        c2d.font = `${Math.round(W / 8)}px serif`;
        c2d.fillText('🪙', W * 0.18, H * 0.2); c2d.fillText('🍀', W * 0.82, H * 0.8); c2d.fillText('💎', W * 0.82, H * 0.2); c2d.fillText('🔔', W * 0.18, H * 0.8);
        canvas.classList.remove('gone');
      }

      let drawing = false, last = null, moves = 0, lastSnd = 0;
      const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      function scratchTo(p) {
        c2d.globalCompositeOperation = 'destination-out';
        c2d.lineWidth = Math.max(26, W / 9);
        c2d.lineCap = c2d.lineJoin = 'round';
        c2d.beginPath();
        c2d.moveTo(last ? last.x : p.x, last ? last.y : p.y);
        c2d.lineTo(p.x, p.y);
        c2d.stroke();
        last = p;
        const now = performance.now();
        if (now - lastSnd > 90) { Sfx.scratch(); lastSnd = now; }
        if (++moves % 8 === 0 && clearedRatio() > 0.45) reveal();
      }
      function clearedRatio() {
        const d = c2d.getImageData(0, 0, canvas.width, canvas.height).data;
        let clear = 0, n = 0;
        for (let i = 3; i < d.length; i += 64) { n++; if (d[i] < 40) clear++; }
        return clear / n;
      }
      canvas.addEventListener('pointerdown', e => {
        if (!card || card.done) return;
        drawing = true; last = null;
        canvas.setPointerCapture(e.pointerId);
        scratchTo(pos(e));
      });
      canvas.addEventListener('pointermove', e => { if (drawing && card && !card.done) scratchTo(pos(e)); });
      const stop = () => { drawing = false; last = null; };
      canvas.addEventListener('pointerup', stop);
      canvas.addEventListener('pointercancel', stop);

      /* ----- fluxo ----- */
      function renderGrid() {
        gridEl.innerHTML = card
          ? card.cells.map(s => `<div class="rs-cell ${card.done && card.win && s === card.win ? 'win' : ''}"><img src="${IMG(s.img)}" alt=""><small>${s.m}x</small></div>`).join('')
          : Array.from({ length: 9 }, () => '<div class="rs-cell"></div>').join('');
      }
      function renderControls() {
        const live = card && !card.done;
        $$('.rs-prices .toggle', el).forEach(b => { b.classList.toggle('on', Number(b.dataset.p) === price); b.disabled = live; });
        freeBox.classList.toggle('hidden', !Progress.freeScratch() || live);
        buyBtn.disabled = live;
        buyBtn.textContent = card && card.done ? `Comprar outra (🪙 ${fmt(price)})` : `Comprar (🪙 ${fmt(price)})`;
        revealBtn.disabled = !live;
        priceEl.textContent = '🪙 ' + fmt(card ? card.price : price);
      }

      function start(free) {
        if (card && !card.done) return;
        const p = free ? FREE_PRICE : price;
        if (free) { if (!Progress.useFreeScratch()) return; } else if (!Wallet.bet(p)) return;
        const win = drawOutcome();
        card = { cells: makeCard(win), win, price: p, stake: free ? 0 : p, done: false };
        Sfx.card();
        resultEl.classList.add('hidden');
        renderGrid();
        paintFoil();
        renderControls();
      }

      function settle() {
        card.done = true;
        const pay = card.win ? round2(card.price * card.win.m) : 0;
        if (pay > 0) Wallet.win(pay);
        ctx.round(card.stake, pay, card.price);
        return pay;
      }

      function reveal() {
        if (!card || card.done) return;
        const pay = settle();
        drawing = false;
        canvas.classList.add('gone');
        renderGrid();
        renderControls();
        resultEl.classList.remove('hidden');
        resultEl.className = 'rs-result ' + (pay > 0 ? 'won' : 'lost');
        resultEl.innerHTML = pay > 0 ? `<b>3× ${card.win.name}!</b><span>🪙 ${fmt(pay)}</span>` : '<b>Não foi dessa vez</b><span>Tente outra!</span>';
        if (pay > 0) UI.result(pay, card.price); else Sfx.lose();
      }

      $('.rs-prices', el).addEventListener('click', e => {
        const p = e.target.closest('[data-p]');
        if (!p || (card && !card.done)) return;
        Sfx.click();
        price = Number(p.dataset.p);
        renderControls();
      });
      buyBtn.addEventListener('click', () => start(false));
      $('.free', el).addEventListener('click', () => start(true));
      revealBtn.addEventListener('click', reveal);
      const ro = new ResizeObserver(() => { if (!card || !card.done) paintFoil(); });
      ro.observe(area);

      renderGrid();
      renderControls();
      paintFoil();
      ctx.onUnmount(() => {
        ro.disconnect();
        if (card && !card.done) settle(); // cartela paga: o prêmio é creditado mesmo saindo
      });
    },
  });
})();
