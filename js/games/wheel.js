'use strict';

/* =========================================================
   Roda da Fortuna (money wheel estilo Tada / Dream Catcher)
   54 casas: 1(23) 2(15) 5(7) 10(4) 20(2) 40(1) + x2 e x7
   Aposta no número: paga N:1. Casas x2/x7 giram de novo e
   multiplicam o próximo prêmio.
   ========================================================= */
(function () {
  const OTHERS = [2, 5, 2, 10, 2, 5, 2, 20, 2, 'x2', 5, 2, 10, 2, 40, 2, 5, 2, 10, 2, 20, 5, 2, 'x7', 2, 5, 2, 10, 2, 5, 2];
  const SEGMENTS = (() => {
    const out = [];
    let ones = 23;
    OTHERS.forEach((v, i) => {
      out.push(v);
      if (ones > 0 && i % 4 !== 3) { out.push(1); ones--; }
    });
    return out;
  })();
  const SEG = 360 / SEGMENTS.length;
  const NUMBERS = [1, 2, 5, 10, 20, 40];
  const COLORS = { 1: '#facc15', 2: '#3b82f6', 5: '#a855f7', 10: '#22c55e', 20: '#f97316', 40: '#ef4444', x2: '#e5e7eb', x7: '#fbbf24' };
  const SPIN_MS = 5200;

  function drawWheel(canvas) {
    const S = 640, c = canvas.getContext('2d');
    canvas.width = S; canvas.height = S;
    const cx = S / 2, R = S / 2 - 6;
    c.translate(cx, cx);
    SEGMENTS.forEach((v, i) => {
      const a0 = (-90 + i * SEG) * Math.PI / 180, a1 = a0 + SEG * Math.PI / 180;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, R, a0, a1);
      c.closePath();
      c.fillStyle = COLORS[v];
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.35)';
      c.lineWidth = 2;
      c.stroke();
      c.save();
      c.rotate((a0 + a1) / 2);
      c.fillStyle = typeof v === 'string' ? '#111' : (v === 1 ? '#111' : '#fff');
      c.font = `bold ${typeof v === 'string' ? 22 : 26}px system-ui, sans-serif`;
      c.textAlign = 'right';
      c.textBaseline = 'middle';
      c.fillText(String(v), R - 14, 0);
      c.restore();
    });
    c.beginPath();
    c.arc(0, 0, R * 0.32, 0, Math.PI * 2);
    c.fillStyle = '#1b1538';
    c.fill();
    c.lineWidth = 8;
    c.strokeStyle = '#fbbf24';
    c.stroke();
  }

  App.register({
    id: 'roda', name: 'Roda da Fortuna', art: 'ferris', category: 'mesa',
    tag: 'Money wheel com multiplicadores', colors: ['#facc15', '#c2410c'],
    rules: `
      <p>Coloque fichas nos números <b>1, 2, 5, 10, 20 ou 40</b> e gire. Se a roda parar no seu número, ele paga <b>N para 1</b> (ex.: 10 paga 10:1 — você recebe a ficha + 10×).</p>
      <p>Quanto maior o número, menos casas ele tem na roda: 1 (23 casas), 2 (15), 5 (7), 10 (4), 20 (2), 40 (1).</p>
      <p><b>Casas x2 e x7:</b> a roda gira de novo e o próximo prêmio é multiplicado. Os multiplicadores acumulam!</p>
      <p class="muted small">RTP teórico entre ~90% e ~96% dependendo do número.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="wheelgame">
          <div class="wheel-stage">
            <div class="wheel-pointer"></div>
            <canvas class="wheel-canvas"></canvas>
            <div class="wheel-hub"><b class="hub-text">GIRE!</b></div>
          </div>
          <div class="history wheel-history"></div>
          <div class="panel controls-panel">
            <div class="wheel-chips"></div>
            <div class="wheel-bets">${NUMBERS.map(n => `
              <button class="wbet" data-n="${n}" style="--seg:${COLORS[n]}">
                <b>${n}</b><span>${n}:1</span><em></em>
              </button>`).join('')}
            </div>
            <div class="btn-row">
              <button class="btn btn-ghost clear">Limpar</button>
              <button class="btn btn-ghost repeat">Repetir</button>
              <button class="btn btn-primary spin">Girar · 🪙 <span class="total">0,00</span></button>
            </div>
          </div>
        </div>`);
      root.append(el);

      const canvas = $('.wheel-canvas', el), hub = $('.hub-text', el), histEl = $('.wheel-history', el);
      drawWheel(canvas);
      const chips = UI.chipSelector([1, 5, 10, 25, 100, 500], 5);
      $('.wheel-chips', el).append(chips.el);

      let bets = {}, last = null, rot = 0, busy = false;
      const total = () => round2(Object.values(bets).reduce((s, v) => s + v, 0));

      function render() {
        $$('.wbet', el).forEach(b => {
          const v = bets[b.dataset.n] || 0;
          $('em', b).textContent = v ? fmt(v) : '';
          b.classList.toggle('has', v > 0);
          b.disabled = busy;
        });
        $('.total', el).textContent = fmt(total());
        $$('.btn-row .btn', el).forEach(b => { b.disabled = busy; });
        chips.setDisabled(busy);
      }

      $('.wheel-bets', el).addEventListener('click', e => {
        const b = e.target.closest('.wbet');
        if (!b || busy) return;
        Sfx.chip();
        bets[b.dataset.n] = round2((bets[b.dataset.n] || 0) + chips.value);
        render();
      });
      $('.clear', el).addEventListener('click', () => { bets = {}; Sfx.click(); render(); });
      $('.repeat', el).addEventListener('click', () => { if (last) { bets = { ...last }; Sfx.chip(); render(); } });

      async function spinTo(index) {
        const target = ((-(index + 0.5) * SEG + (RNG.float() - 0.5) * SEG * 0.7) % 360 + 360) % 360;
        const current = ((rot % 360) + 360) % 360;
        rot += 360 * 5 + ((target - current + 360) % 360);
        canvas.style.transition = `transform ${SPIN_MS}ms cubic-bezier(.15,.75,.15,1)`;
        canvas.style.transform = `rotate(${rot}deg)`;
        let n = 0;
        const tk = ctx.interval(() => { if (n++ < 28) Sfx.tick(); }, 150);
        await ctx.sleep(SPIN_MS + 150);
        ctx.clear(tk);
      }

      function pushHistory(v) {
        histEl.prepend(h(`<span class="pill" style="background:${COLORS[v]};color:${v === 1 || typeof v === 'string' ? '#111' : '#fff'}">${v}</span>`));
        while (histEl.children.length > 14) histEl.lastChild.remove();
      }

      $('.spin', el).addEventListener('click', async () => {
        if (busy) return;
        const stake = total();
        if (!stake) { UI.toast('Coloque fichas em algum número'); return; }
        if (!Wallet.bet(stake)) return;
        busy = true;
        last = { ...bets };
        render();
        let mult = 1;
        let result;
        for (;;) {
          hub.textContent = mult > 1 ? `x${mult}` : '...';
          const idx = RNG.int(0, SEGMENTS.length - 1);
          await spinTo(idx);
          result = SEGMENTS[idx];
          pushHistory(result);
          if (typeof result === 'string') {
            mult *= Number(result.slice(1));
            hub.textContent = `x${mult}!`;
            Sfx.chip();
            if (ctx.alive) UI.toast(`Multiplicador ${result}! Girando de novo (total x${mult})`, 'win');
            await ctx.sleep(1000);
            continue;
          }
          break;
        }
        const b = bets[result] || 0;
        const payout = round2(b + b * result * mult);
        hub.textContent = result;
        if (payout > 0) Wallet.win(payout);
        ctx.round(stake, payout);
        if (ctx.alive) UI.result(payout, stake);
        busy = false;
        render();
      });

      render();
    },
  });
})();
