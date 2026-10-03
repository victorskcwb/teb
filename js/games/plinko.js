'use strict';

/* =========================================================
   Plinko — a bolinha cai pelos pinos e para num multiplicador.
   Tabelas de multiplicadores com RTP ~99%.
   ========================================================= */
(function () {
  const TABLES = {
    8: {
      low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
      medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    },
    12: {
      low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
      medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
      high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    },
    16: {
      low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
      medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
      high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
    },
  };
  const bucketClass = m => (m >= 10 ? 'b-hot' : m >= 2 ? 'b-warm' : m >= 1 ? 'b-mid' : 'b-cold');

  App.register({
    id: 'plinko', name: 'Plinko', art: 'ball8', category: 'originais',
    tag: 'Bolinha nos pinos · até 1.000x', colors: ['#ec4899', '#7c3aed'],
    rules: `
      <p>Escolha o valor, o número de <b>linhas</b> (8, 12 ou 16) e o <b>risco</b>. Cada bolinha custa uma aposta e, ao cair, ganha aposta × multiplicador da casa onde parar.</p>
      <p>As casas das pontas pagam muito mas são raras; as do meio são comuns e pagam pouco. Pode soltar várias bolinhas ao mesmo tempo.</p>
      <p class="muted small">RTP teórico: ~99%.</p>`,

    mount(root, ctx) {
      const el = h(`
        <div class="plinko">
          <div class="plinko-wrap">
            <div class="plinko-board"></div>
            <div class="plinko-last"></div>
          </div>
          <div class="panel controls-panel">
            <div class="plinko-bet"></div>
            <div class="mines-row">
              <label>Linhas <select class="rows"><option>8</option><option selected>12</option><option>16</option></select></label>
              <label>Risco <select class="risk"><option value="low">Baixo</option><option value="medium" selected>Médio</option><option value="high">Alto</option></select></label>
            </div>
            <button class="btn btn-big btn-primary drop">Soltar bolinha</button>
          </div>
        </div>`);
      root.append(el);

      const board = $('.plinko-board', el), lastEl = $('.plinko-last', el);
      const rowsSel = $('.rows', el), riskSel = $('.risk', el);
      const betIn = UI.betInput({ value: 1 });
      $('.plinko-bet', el).append(betIn.el);

      let rows = 12, risk = 'medium', inFlight = 0, buckets = [];

      function build() {
        rows = Number(rowsSel.value);
        risk = riskSel.value;
        board.innerHTML = '';
        const dx = 100 / (rows + 2), dy = 100 / (rows + 2);
        for (let r = 0; r < rows; r++) {
          for (let j = 0; j < r + 3; j++) {
            const p = h('<i class="peg"></i>');
            p.style.left = 50 + (j - (r + 2) / 2) * dx + '%';
            p.style.top = (r + 1) * dy + '%';
            board.append(p);
          }
        }
        buckets = TABLES[rows][risk].map((m, k) => {
          const b = h(`<div class="bucket ${bucketClass(m)}">${m}x</div>`);
          b.style.left = 50 + (k - rows / 2) * dx + '%';
          b.style.top = (rows + 1) * dy + '%';
          b.style.width = dx * 0.92 + '%';
          board.append(b);
          return b;
        });
        board.style.setProperty('--rows', rows);
      }
      build();
      const onCfg = () => { if (inFlight) { UI.toast('Espere as bolinhas caírem'); rowsSel.value = rows; riskSel.value = risk; return; } build(); };
      rowsSel.addEventListener('change', onCfg);
      riskSel.addEventListener('change', onCfg);

      async function drop() {
        const bet = betIn.value;
        if (!Wallet.bet(bet)) return;
        Sfx.click();
        inFlight++;
        const R = rows, table = TABLES[R][risk], bks = buckets;
        const dx = 100 / (R + 2), dy = 100 / (R + 2);
        const ball = h('<i class="ball"></i>');
        ball.style.left = '50%';
        ball.style.top = '0%';
        board.append(ball);
        const step = R >= 16 ? 85 : R >= 12 ? 100 : 130;
        let rights = 0;
        await ctx.sleep(30);
        for (let r = 0; r < R; r++) {
          ball.style.transition = `left ${step}ms linear, top ${step}ms cubic-bezier(.5,0,1,1)`;
          ball.style.left = 50 + (rights - r / 2) * dx + '%';
          ball.style.top = (r + 1) * dy - dy * 0.35 + '%';
          await ctx.sleep(step);
          if (RNG.float() < 0.5) rights++;
        }
        ball.style.left = 50 + (rights - R / 2) * dx + '%';
        ball.style.top = (R + 1) * dy + '%';
        await ctx.sleep(step);
        ball.remove();
        inFlight--;

        const m = table[rights];
        const pay = round2(bet * m);
        if (pay > 0) Wallet.win(pay);
        ctx.round(bet, pay);
        if (!ctx.alive) return;
        const b = bks[rights];
        b.classList.remove('hit');
        void b.offsetWidth;
        b.classList.add('hit');
        const tag = h(`<span class="pill ${bucketClass(m)}">${m}x</span>`);
        lastEl.prepend(tag);
        while (lastEl.children.length > 8) lastEl.lastChild.remove();
        if (m >= 10) UI.bigWin(pay, m);
        else Sfx.tone(m >= 1 ? 880 : 330, 0.08, 'triangle', 0.05);
      }

      $('.drop', el).addEventListener('click', drop);
    },
  });
})();
