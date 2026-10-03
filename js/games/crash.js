'use strict';

/* =========================================================
   Crash (estilo Aviator / foguetinho)
   P(chegar a x) = 0,97 / x  →  RTP 97%
   ========================================================= */
(function () {
  const WAIT_MS = 6000;
  const AFTER_MS = 3000;
  const K = 0.0001; // velocidade da curva: m(t) = e^(K·t)

  function genCrash() {
    const r = RNG.float();
    return Math.min(10000, Math.max(1, Math.floor(97 / (1 - r)) / 100));
  }
  const pillClass = m => (m >= 10 ? 'gold' : m >= 2 ? 'good' : 'low');

  App.register({
    id: 'crash', name: 'Foguetinho', art: 'rocket', sprites: ['rocket', 'fire'], category: 'originais',
    tag: 'Crash · saque antes de explodir', colors: ['#0ea5e9', '#4338ca'],
    rules: `
      <p>Faça sua aposta durante a contagem. Quando a rodada começa, o multiplicador sobe a partir de <b>1.00x</b>. Clique em <b>Sacar</b> a qualquer momento para receber aposta × multiplicador.</p>
      <p>Se o foguete <b>explodir</b> antes de você sacar, a aposta é perdida. O ponto de explosão é sorteado antes da rodada começar.</p>
      <p><b>Saque automático:</b> defina um alvo (ex.: 2.00) e o saque acontece sozinho ao atingi-lo.</p>
      <p class="muted small">RTP teórico: 97%. Cerca de 3% das rodadas explodem em 1.00x.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="crash">
          <div class="history"></div>
          <div class="crash-stage">
            <canvas></canvas>
            <div class="crash-center">
              <div class="crash-mult">1.00x</div>
              <div class="crash-sub"></div>
            </div>
            <div class="crash-bar"><i></i></div>
          </div>
          <div class="panel controls-panel">
            <div class="crash-bet"></div>
            <div class="auto-row">
              <label class="switch"><input type="checkbox" class="auto-on"><span>Saque automático em</span></label>
              <input type="number" class="auto-target" value="2" min="1.01" step="0.1" inputmode="decimal">
            </div>
            <button class="btn btn-big btn-primary action"></button>
          </div>
        </div>`);
      root.append(el);

      const canvas = $('canvas', el), c2d = canvas.getContext('2d');
      const multEl = $('.crash-mult', el), subEl = $('.crash-sub', el);
      const barEl = $('.crash-bar', el), barFill = $('.crash-bar i', el);
      const histEl = $('.history', el), action = $('.action', el);
      const autoOn = $('.auto-on', el), autoTarget = $('.auto-target', el);
      const betIn = UI.betInput({ value: 10 });
      $('.crash-bet', el).append(betIn.el);

      let state = 'waiting', phaseStart = performance.now();
      let crashAt = genCrash(), mult = 1;
      let bet = null;     // { amount, cashed, at }
      let queued = null;  // valor já debitado para a próxima rodada
      const history = [];

      /* ----- canvas ----- */
      const rocketImg = new Image(); rocketImg.src = IMG('rocket');
      const boomImg = new Image(); boomImg.src = IMG('fire');
      let W = 0, H = 0, dpr = 1;
      function resize() {
        dpr = window.devicePixelRatio || 1;
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      function draw(t) {
        c2d.clearRect(0, 0, W, H);
        // grade
        c2d.strokeStyle = 'rgba(255,255,255,0.06)';
        c2d.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
          c2d.beginPath(); c2d.moveTo(0, (H / 5) * i); c2d.lineTo(W, (H / 5) * i); c2d.stroke();
        }
        if (state === 'waiting') return;
        const maxT = Math.max(8000, t * 1.15);
        const maxM = Math.max(2, mult * 1.2);
        const pad = 16;
        const X = tt => pad + (tt / maxT) * (W - pad * 2);
        const Y = m => H - pad - ((m - 1) / (maxM - 1)) * (H - pad * 2);
        const crashed = state === 'crashed';
        c2d.beginPath();
        c2d.moveTo(X(0), Y(1));
        const steps = 60;
        for (let i = 1; i <= steps; i++) {
          const tt = (t * i) / steps;
          c2d.lineTo(X(tt), Y(Math.min(mult, Math.exp(K * tt))));
        }
        const tipX = X(t), tipY = Y(mult);
        c2d.strokeStyle = crashed ? '#ef4444' : '#38bdf8';
        c2d.lineWidth = 4;
        c2d.stroke();
        c2d.lineTo(tipX, H - pad);
        c2d.lineTo(X(0), H - pad);
        c2d.closePath();
        const g = c2d.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, crashed ? 'rgba(239,68,68,0.35)' : 'rgba(56,189,248,0.35)');
        g.addColorStop(1, 'rgba(56,189,248,0)');
        c2d.fillStyle = g;
        c2d.fill();
        const sp = crashed ? boomImg : rocketImg, sz = crashed ? 56 : 46;
        if (sp.complete && sp.naturalWidth) {
          c2d.save();
          c2d.translate(Math.min(tipX, W - 26), Math.max(tipY, 26));
          c2d.drawImage(sp, -sz / 2, -sz / 2, sz, sz);
          c2d.restore();
        }
      }

      /* ----- histórico ----- */
      function pushHistory(m) {
        history.unshift(m);
        if (history.length > 25) history.pop();
        histEl.innerHTML = history.map(x => `<span class="pill ${pillClass(x)}">${fmtX(x)}</span>`).join('');
      }
      for (let i = 0; i < 12; i++) pushHistory(genCrash());

      /* ----- ações ----- */
      function cashout(at) {
        if (!bet || bet.cashed || state !== 'flying') return;
        bet.cashed = true;
        bet.at = at;
        const pay = round2(bet.amount * at);
        Wallet.win(pay);
        ctx.round(bet.amount, pay);
        if (ctx.alive) {
          Sfx.win();
          UI.toast(`Sacou em ${fmtX(at)}: +🪙 ${fmt(pay)}`, 'win');
          if (at >= 10) UI.bigWin(pay, at);
        }
      }

      action.addEventListener('click', () => {
        Sfx.click();
        if (state === 'flying' && bet && !bet.cashed) { cashout(mult); return; }
        if (state === 'waiting') {
          if (bet) { Wallet.refund(bet.amount); bet = null; return; }
          const amt = betIn.value;
          if (Wallet.bet(amt)) bet = { amount: amt, cashed: false };
          return;
        }
        if (queued) { Wallet.refund(queued); queued = null; return; }
        const amt = betIn.value;
        if (Wallet.bet(amt)) queued = amt;
      });

      function renderAction() {
        let txt, cls;
        if (state === 'flying' && bet && !bet.cashed) {
          txt = `Sacar 🪙 ${fmt(bet.amount * mult)}`; cls = 'btn-success';
        } else if (state === 'waiting') {
          txt = bet ? 'Cancelar aposta' : 'Apostar'; cls = bet ? 'btn-danger' : 'btn-primary';
        } else {
          txt = queued ? 'Cancelar (próxima rodada)' : 'Apostar na próxima rodada'; cls = queued ? 'btn-danger' : 'btn-primary';
        }
        if (action.textContent !== txt) action.textContent = txt;
        action.className = `btn btn-big action ${cls}`;
        betIn.setDisabled(!!(bet && state === 'waiting') || !!queued);
      }

      /* ----- loop ----- */
      function frame() {
        const now = performance.now();
        const dt = now - phaseStart;
        if (state === 'waiting') {
          const left = Math.max(0, WAIT_MS - dt);
          multEl.textContent = (left / 1000).toFixed(1) + 's';
          multEl.className = 'crash-mult waiting';
          subEl.textContent = bet ? `Aposta de 🪙 ${fmt(bet.amount)} confirmada` : 'Próxima rodada em';
          barEl.style.visibility = 'visible';
          barFill.style.width = (left / WAIT_MS) * 100 + '%';
          if (left <= 0) { state = 'flying'; phaseStart = now; mult = 1; barEl.style.visibility = 'hidden'; }
          draw(0);
        } else if (state === 'flying') {
          mult = Math.exp(K * dt);
          const target = parseFloat(autoTarget.value);
          if (autoOn.checked && bet && !bet.cashed && target > 1 && Math.min(mult, crashAt) >= target) cashout(round2(target));
          if (mult >= crashAt) {
            mult = crashAt;
            state = 'crashed';
            phaseStart = now;
            pushHistory(crashAt);
            if (bet && !bet.cashed) { ctx.round(bet.amount, 0); Sfx.boom(); UI.toast(`Explodiu em ${fmtX(crashAt)}. Aposta perdida.`, 'error'); }
            else Sfx.boom();
          }
          multEl.textContent = fmtX(mult);
          multEl.className = 'crash-mult' + (state === 'crashed' ? ' crashed' : '');
          subEl.textContent = state === 'crashed' ? 'EXPLODIU!' : (bet && bet.cashed ? `Você sacou em ${fmtX(bet.at)} ✅` : '');
          draw(Math.log(mult) / K);
        } else {
          subEl.textContent = bet && bet.cashed ? `Você sacou em ${fmtX(bet.at)} ✅` : 'EXPLODIU!';
          draw(Math.log(mult) / K);
          if (dt > AFTER_MS) {
            state = 'waiting';
            phaseStart = now;
            crashAt = genCrash();
            bet = queued ? { amount: queued, cashed: false } : null;
            queued = null;
          }
        }
        renderAction();
      }
      // setInterval (e não rAF) para a rodada continuar mesmo com a aba em segundo plano
      ctx.interval(frame, 16);
      frame();

      ctx.onUnmount(() => {
        ro.disconnect();
        if (queued) Wallet.refund(queued);
        if (bet && state === 'waiting') Wallet.refund(bet.amount);
        if (bet && state === 'flying' && !bet.cashed) cashout(mult);
      });
    },
  });
})();
