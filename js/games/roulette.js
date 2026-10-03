'use strict';

/* =========================================================
   Roleta Europeia (um zero) — RTP 97,3%
   ========================================================= */
(function () {
  const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const SEG = 360 / 37;
  const SPIN_MS = 5500;
  const colorOf = n => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

  /** Retorno total (aposta incluída) por ficha, para a aposta `key` se sair `r`. */
  function payMult(key, r) {
    if (key[0] === 'n') return Number(key.slice(1)) === r ? 36 : 0;
    if (r === 0) return 0;
    switch (key) {
      case 'col1': case 'col2': case 'col3': return (r - 1) % 3 === Number(key[3]) - 1 ? 3 : 0;
      case 'doz1': case 'doz2': case 'doz3': { const k = Number(key[3]); return r > (k - 1) * 12 && r <= k * 12 ? 3 : 0; }
      case 'red': return REDS.has(r) ? 2 : 0;
      case 'black': return !REDS.has(r) ? 2 : 0;
      case 'even': return r % 2 === 0 ? 2 : 0;
      case 'odd': return r % 2 === 1 ? 2 : 0;
      case 'low': return r <= 18 ? 2 : 0;
      case 'high': return r >= 19 ? 2 : 0;
    }
    return 0;
  }

  function drawWheel(canvas) {
    const S = 640, c = canvas.getContext('2d');
    canvas.width = S; canvas.height = S;
    const R = S / 2 - 4;
    c.translate(S / 2, S / 2);
    c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fillStyle = '#5b3a1e'; c.fill();
    WHEEL.forEach((n, i) => {
      const a0 = (-90 + i * SEG) * Math.PI / 180, a1 = a0 + SEG * Math.PI / 180;
      c.beginPath();
      c.arc(0, 0, R - 14, a0, a1);
      c.arc(0, 0, R * 0.62, a1, a0, true);
      c.closePath();
      c.fillStyle = n === 0 ? '#16a34a' : REDS.has(n) ? '#dc2626' : '#111827';
      c.fill();
      c.strokeStyle = '#d4af37';
      c.lineWidth = 1.5;
      c.stroke();
      c.save();
      c.rotate((a0 + a1) / 2);
      c.translate(R - 40, 0);
      c.rotate(Math.PI / 2);
      c.fillStyle = '#fff';
      c.font = 'bold 22px system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(String(n), 0, 0);
      c.restore();
    });
    const g = c.createRadialGradient(0, 0, 10, 0, 0, R * 0.62);
    g.addColorStop(0, '#d4af37'); g.addColorStop(0.25, '#7a4f24'); g.addColorStop(1, '#3d2611');
    c.beginPath(); c.arc(0, 0, R * 0.62, 0, Math.PI * 2); c.fillStyle = g; c.fill();
  }

  App.register({
    id: 'roleta', name: 'Roleta Europeia', art: 'bullseye', category: 'mesa',
    tag: 'Clássica com um zero', colors: ['#16a34a', '#14532d'],
    rules: `
      <p>Escolha uma ficha e clique na mesa para apostar. Depois clique em <b>Girar</b>.</p>
      <ul>
        <li><b>Número</b> (pleno): 35:1</li>
        <li><b>Coluna (2:1)</b> e <b>Dúzia</b>: 2:1</li>
        <li><b>Vermelho/Preto, Par/Ímpar, 1–18/19–36</b>: 1:1</li>
      </ul>
      <p>Se sair o <b>0</b>, só apostas no próprio 0 ganham.</p>
      <p class="muted small">RTP teórico: 97,3%.</p>`,

    mount(root, ctx) {
      let grid = '';
      for (let row = 0; row < 12; row++) {
        for (let col = 1; col <= 3; col++) {
          const n = row * 3 + col;
          grid += `<button class="rcell ${colorOf(n)}" data-k="n${n}">${n}</button>`;
        }
      }
      const el = h(`
        <div class="roulette">
          <div class="roulette-left">
            <div class="rwheel-stage">
              <canvas class="rwheel"></canvas>
              <div class="rball-orbit"><i class="rball"></i></div>
              <div class="rwheel-result">—</div>
            </div>
            <div class="history roulette-history"></div>
          </div>
          <div class="roulette-right">
            <div class="rtable">
              <button class="rcell green zero" data-k="n0">0</button>
              <div class="rgrid">${grid}</div>
              <div class="rrow3">
                <button class="rcell out" data-k="col1">2:1</button>
                <button class="rcell out" data-k="col2">2:1</button>
                <button class="rcell out" data-k="col3">2:1</button>
              </div>
              <div class="rrow3">
                <button class="rcell out" data-k="doz1">1–12</button>
                <button class="rcell out" data-k="doz2">13–24</button>
                <button class="rcell out" data-k="doz3">25–36</button>
              </div>
              <div class="rrow6">
                <button class="rcell out" data-k="low">1–18</button>
                <button class="rcell out" data-k="even">Par</button>
                <button class="rcell red" data-k="red">◆</button>
                <button class="rcell black" data-k="black">◆</button>
                <button class="rcell out" data-k="odd">Ímpar</button>
                <button class="rcell out" data-k="high">19–36</button>
              </div>
            </div>
            <div class="panel controls-panel">
              <div class="r-chips"></div>
              <div class="btn-row">
                <button class="btn btn-ghost undo">Desfazer</button>
                <button class="btn btn-ghost clear">Limpar</button>
                <button class="btn btn-ghost repeat">Repetir</button>
              </div>
              <button class="btn btn-big btn-primary spin">Girar · 🪙 <span class="total">0,00</span></button>
            </div>
          </div>
        </div>`);
      root.append(el);

      const canvas = $('.rwheel', el), orbit = $('.rball-orbit', el), resultEl = $('.rwheel-result', el);
      const histEl = $('.roulette-history', el);
      drawWheel(canvas);
      const chips = UI.chipSelector([1, 5, 10, 25, 100, 500], 5);
      $('.r-chips', el).append(chips.el);

      let bets = {}, stack = [], last = null, busy = false, rot = 0, ballRot = 0;
      const total = () => round2(Object.values(bets).reduce((s, v) => s + v, 0));

      function render() {
        $$('.rcell', el).forEach(c => {
          const v = bets[c.dataset.k];
          let chip = $('.rchip', c);
          if (v) {
            if (!chip) { chip = h('<span class="rchip"></span>'); c.append(chip); }
            chip.textContent = v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v);
          } else if (chip) chip.remove();
          c.disabled = busy;
        });
        $('.total', el).textContent = fmt(total());
        $$('.btn', el).forEach(b => { b.disabled = busy; });
        chips.setDisabled(busy);
      }

      $('.rtable', el).addEventListener('click', e => {
        const c = e.target.closest('.rcell');
        if (!c || busy) return;
        const k = c.dataset.k;
        bets[k] = round2((bets[k] || 0) + chips.value);
        stack.push([k, chips.value]);
        Sfx.chip();
        render();
      });
      $('.undo', el).addEventListener('click', () => {
        const u = stack.pop();
        if (!u) return;
        bets[u[0]] = round2(bets[u[0]] - u[1]);
        if (bets[u[0]] <= 0) delete bets[u[0]];
        Sfx.click();
        render();
      });
      $('.clear', el).addEventListener('click', () => { bets = {}; stack = []; Sfx.click(); render(); });
      $('.repeat', el).addEventListener('click', () => {
        if (!last) return;
        bets = { ...last };
        stack = Object.entries(bets);
        Sfx.chip();
        render();
      });

      function pushHistory(n) {
        histEl.prepend(h(`<span class="pill r-${colorOf(n)}">${n}</span>`));
        while (histEl.children.length > 16) histEl.lastChild.remove();
      }
      for (let i = 0; i < 10; i++) pushHistory(RNG.int(0, 36));

      $('.spin', el).addEventListener('click', async () => {
        if (busy) return;
        const stake = total();
        if (!stake) { UI.toast('Coloque fichas na mesa'); return; }
        if (!Wallet.bet(stake)) return;
        busy = true;
        last = { ...bets };
        $$('.rcell.hit', el).forEach(c => c.classList.remove('hit'));
        render();
        resultEl.textContent = '...';
        resultEl.className = 'rwheel-result';

        const r = RNG.int(0, 36);
        const idx = WHEEL.indexOf(r);
        const target = ((-(idx + 0.5) * SEG) % 360 + 360) % 360;
        const cur = ((rot % 360) + 360) % 360;
        rot += 360 * 4 + ((target - cur + 360) % 360);
        ballRot -= 360 * 6 + (((ballRot % 360) + 360) % 360);
        canvas.style.transition = `transform ${SPIN_MS}ms cubic-bezier(.2,.7,.2,1)`;
        canvas.style.transform = `rotate(${rot}deg)`;
        orbit.style.transition = `transform ${SPIN_MS}ms cubic-bezier(.25,.8,.3,1)`;
        orbit.style.transform = `rotate(${ballRot}deg)`;
        orbit.classList.add('rolling');
        await ctx.sleep(SPIN_MS * 0.75);
        orbit.classList.remove('rolling');
        await ctx.sleep(SPIN_MS * 0.25 + 150);

        let payout = 0;
        for (const [k, v] of Object.entries(bets)) payout += v * payMult(k, r);
        payout = round2(payout);
        if (payout > 0) Wallet.win(payout);
        ctx.round(stake, payout);
        if (!ctx.alive) return;

        resultEl.textContent = r;
        resultEl.className = `rwheel-result show r-${colorOf(r)}`;
        pushHistory(r);
        const cell = $(`.rcell[data-k="n${r}"]`, el);
        if (cell) cell.classList.add('hit');
        UI.result(payout, stake);
        bets = {};
        stack = [];
        busy = false;
        render();
      });

      render();
    },
  });
})();
