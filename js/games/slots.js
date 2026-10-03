'use strict';

/* =========================================================
   Slots 3×3 com 5 linhas (estilo "Fortune" da PG Soft)
   - Tigrinho: recurso "Carta do Tigre" (respins até ganhar, tela cheia = x10)
   - Ratinho: rolo do meio vira coringa e os outros giram até ganhar
   - Dragãozinho: multiplicador aleatório em todo giro (x1, x2, x5, x10)
   Pagamentos em "x da aposta por linha" (aposta total / 5).
   ========================================================= */
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [6, 4, 2]];

  function evaluate(grid) {
    const wins = [];
    for (const line of LINES) {
      const syms = line.map(i => grid[i]);
      const base = syms.find(s => !s.wild) || syms[0];
      if (syms.every(s => s.wild || s.id === base.id)) wins.push({ cells: line, sym: base });
    }
    return wins;
  }

  function paytable(cfg) {
    return `<table class="paytable">${cfg.symbols.map(s => `
      <tr><td class="pt-sym">${ico(s.img)}${ico(s.img)}${ico(s.img)}</td>
      <td>${s.name}${s.wild ? ' <span class="badge">CORINGA</span>' : ''}</td>
      <td><b>${s.pay / 5}x</b></td></tr>`).join('')}</table>`;
  }

  function createSlot(cfg) {
    const wild = cfg.symbols.find(s => s.wild);
    return {
      id: cfg.id, name: cfg.name, art: cfg.art, category: 'slots', tag: cfg.tag, colors: cfg.colors,
      sprites: cfg.symbols.map(s => s.img),
      rules: `
        <p>${cfg.intro}</p>
        <p>Grade 3×3 com <b>5 linhas fixas</b> (3 horizontais + 2 diagonais). Três símbolos iguais numa linha pagam o valor da tabela × aposta total. O ${ico(wild.img)} é <b>coringa</b> e substitui qualquer símbolo.</p>
        ${cfg.featureRules}
        <p>🎁 <b>Rodadas grátis</b> do bônus diário, missões e passe podem ser usadas aqui.</p>
        <h4>Tabela (por linha, × aposta total)</h4>${paytable(cfg)}
        <p class="muted small">RTP teórico aproximado: ${cfg.rtp}. Atalho: barra de espaço gira.</p>`,

      mount(root, ctx) {
        const el = h(`
          <div class="slot slot-${cfg.id}">
            <div class="slot-banner">
              <img class="slot-mascot" src="${IMG(cfg.mascot)}" alt="">
              <div class="slot-msg">Boa sorte!</div>
              ${cfg.multipliers ? '<div class="slot-mult">x1</div>' : ''}
            </div>
            <div class="slot-frame"><div class="slot-lights"></div><div class="slot-grid"></div></div>
            <div class="slot-winbar">Ganho <b>0,00</b></div>
            <div class="fs-slot"></div>
            <div class="slot-controls">
              <div class="slot-bet"></div>
              <button class="spin-btn" aria-label="Girar"><span>⟳</span></button>
              <div class="slot-toggles">
                <button class="toggle" data-t="turbo">⚡ Turbo</button>
                <button class="toggle" data-t="auto">🔁 Auto</button>
              </div>
            </div>
          </div>`);
        root.append(el);

        const gridEl = $('.slot-grid', el);
        const msgEl = $('.slot-msg', el);
        const winEl = $('.slot-winbar b', el);
        const multEl = $('.slot-mult', el);
        const spinBtn = $('.spin-btn', el);
        const mascot = $('.slot-mascot', el);
        const stepper = UI.betStepper(undefined, 3);
        $('.slot-bet', el).append(stepper.el);
        const fsBar = freeSpinBar(ctx, on => { spinBtn.classList.toggle('free', on); if (on && !busy) spin(); });
        $('.fs-slot', el).append(fsBar.el);

        const cells = [];
        for (let i = 0; i < 9; i++) {
          const c = h('<div class="cell"><img alt="" draggable="false"></div>');
          gridEl.append(c);
          cells.push(c);
        }
        const setCell = (i, sym) => {
          const img = cells[i].firstChild;
          if (img.dataset.s !== sym.img) { img.src = IMG(sym.img); img.dataset.s = sym.img; }
          cells[i].classList.toggle('is-wild', !!sym.wild);
        };
        for (let i = 0; i < 9; i++) setCell(i, RNG.weighted(cfg.symbols));

        let busy = false, turbo = false, auto = false;
        const msg = t => { msgEl.textContent = t; };
        const setAuto = v => { auto = v; $('[data-t="auto"]', el).classList.toggle('on', v); };

        async function animateTo(final, { fixed = new Set() } = {}) {
          const timers = [0, 1, 2].map(col => {
            const idx = [col, col + 3, col + 6].filter(i => !fixed.has(i));
            if (!idx.length) return null;
            idx.forEach(i => cells[i].classList.add('spinning'));
            return { idx, t: ctx.interval(() => idx.forEach(i => setCell(i, RNG.weighted(cfg.symbols))), 70) };
          });
          const first = turbo ? 180 : 520, step = turbo ? 110 : 300;
          for (let col = 0; col < 3; col++) {
            await ctx.sleep(col === 0 ? first : step);
            const tm = timers[col];
            if (!tm) continue;
            ctx.clear(tm.t);
            tm.idx.forEach(i => {
              setCell(i, final[i]);
              cells[i].classList.remove('spinning', 'land');
              void cells[i].offsetWidth;
              cells[i].classList.add('land');
            });
            Sfx.reel();
          }
          final.forEach((s, i) => setCell(i, s));
        }

        /* Recurso do Tigrinho: respins até formar linha; tela cheia paga x10 */
        async function tigerFeature() {
          const nonWild = cfg.symbols.filter(s => !s.wild);
          const target = RNG.weighted(nonWild);
          const others = nonWild.filter(s => s.id !== target.id);
          const roll = () => (RNG.float() < 0.15 ? wild : target);
          const lock = Array(9).fill(null);
          for (let i = 0; i < 9; i++) if (RNG.float() < 0.35) lock[i] = roll();
          const fill = () => lock.map(l => l || RNG.weighted(others));
          const markLocks = () => cells.forEach((c, i) => c.classList.toggle('locked', !!lock[i]));

          el.classList.add('feature');
          mascot.classList.add('roar');
          msg(`CARTA DO TIGRE! Símbolo da rodada: ${target.name}`);
          Sfx.big();
          await ctx.sleep(1100);

          let grid = fill();
          await animateTo(grid);
          markLocks();
          let guard = 0;
          while (!LINES.some(L => L.every(i => lock[i])) && guard++ < 60) {
            const fixed = new Set(lock.map((l, i) => (l ? i : -1)).filter(i => i >= 0));
            await ctx.sleep(turbo ? 150 : 350);
            for (let i = 0; i < 9; i++) if (!lock[i] && RNG.float() < 0.22) lock[i] = roll();
            grid = fill();
            await animateTo(grid, { fixed });
            markLocks();
          }
          const full = lock.every(Boolean);
          mascot.classList.remove('roar');
          el.classList.remove('feature');
          cells.forEach(c => c.classList.remove('locked'));
          if (full) msg('TELA CHEIA! Prêmio x10 🐯');
          return { grid, mult: full ? 10 : 1 };
        }

        /* Recurso do Ratinho: rolo do meio vira coringa, os outros giram até pagar */
        async function mouseFeature() {
          el.classList.add('feature');
          mascot.classList.add('roar');
          msg('RATINHO SORTUDO! Rolo do meio vira coringa!');
          Sfx.big();
          const mid = new Set([1, 4, 7]);
          mid.forEach(i => { setCell(i, wild); cells[i].classList.add('locked'); });
          await ctx.sleep(1000);
          let grid, guard = 0;
          do {
            grid = Array.from({ length: 9 }, (_, i) => (mid.has(i) ? wild : RNG.weighted(cfg.symbols)));
            await animateTo(grid, { fixed: mid });
            if (evaluate(grid).length) break;
            await ctx.sleep(turbo ? 120 : 260);
          } while (guard++ < 40);
          mascot.classList.remove('roar');
          el.classList.remove('feature');
          cells.forEach(c => c.classList.remove('locked'));
          return { grid, mult: 1 };
        }

        async function normalSpin() {
          const grid = Array.from({ length: 9 }, () => RNG.weighted(cfg.symbols));
          let mult = 1, multTimer = null;
          if (cfg.multipliers) {
            mult = RNG.weighted(cfg.multipliers).m;
            multEl.classList.remove('hot');
            multTimer = ctx.interval(() => { multEl.textContent = 'x' + RNG.pick(cfg.multipliers).m; }, 90);
          }
          await animateTo(grid);
          if (multTimer) {
            ctx.clear(multTimer);
            multEl.textContent = 'x' + mult;
            multEl.classList.toggle('hot', mult > 1);
            if (mult > 1) Sfx.chip();
          }
          return { grid, mult };
        }

        async function spin() {
          if (busy) return;
          const free = fsBar.active && Progress.s.fs > 0;
          const bet = free ? Progress.FS_BET : stepper.value;
          if (free) Progress.useFreeSpin();
          else if (!Wallet.bet(bet)) { setAuto(false); return; }
          busy = true;
          spinBtn.disabled = true;
          stepper.setDisabled(true);
          fsBar.setDisabled(true);
          spinBtn.classList.add('go');
          cells.forEach(c => c.classList.remove('win', 'dim'));
          winEl.textContent = fmt(0);
          msg(free ? '🎁 Rodada grátis!' : 'Girando...');

          const isFeature = cfg.featureChance && RNG.float() < cfg.featureChance;
          const res = isFeature ? await (cfg.feature === 'mouse' ? mouseFeature() : tigerFeature()) : await normalSpin();

          const wins = evaluate(res.grid);
          const payout = round2(wins.reduce((s, w) => s + w.sym.pay, 0) * (bet / 5) * res.mult);
          if (wins.length) {
            cells.forEach(c => c.classList.add('dim'));
            wins.forEach(w => w.cells.forEach(i => { cells[i].classList.remove('dim'); cells[i].classList.add('win'); }));
          }
          if (payout > 0) {
            Wallet.win(payout);
            winEl.textContent = fmt(payout);
            if (ctx.alive) {
              if (res.mult < 10 || !isFeature) msg(`${wins.length} linha${wins.length > 1 ? 's' : ''}${res.mult > 1 ? ` · x${res.mult}` : ''} — ganhou ${fmt(payout)}!`);
              UI.result(payout, bet);
            }
          } else if (!isFeature) {
            msg('Não foi dessa vez...');
          }
          ctx.round(free ? 0 : bet, payout, bet);

          spinBtn.classList.remove('go');
          spinBtn.disabled = false;
          stepper.setDisabled(false);
          fsBar.setDisabled(false);
          busy = false;
          fsBar.render();
          const keepFree = fsBar.active && Progress.s.fs > 0;
          if ((auto || keepFree) && ctx.alive) {
            await ctx.sleep(payout > 0 ? 1100 : (turbo ? 250 : 600));
            // espera o overlay de vitória grande (e a oferta de dobrar) sair da tela
            while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300);
            if (ctx.alive && !busy && (auto || (fsBar.active && Progress.s.fs > 0))) spin();
          }
        }

        spinBtn.addEventListener('click', spin);
        $('.slot-toggles', el).addEventListener('click', e => {
          const t = e.target.dataset.t;
          if (!t) return;
          Sfx.click();
          if (t === 'turbo') { turbo = !turbo; e.target.classList.toggle('on', turbo); }
          if (t === 'auto') { setAuto(!auto); if (auto && !busy) spin(); }
        });
        const onKey = e => {
          if (e.code === 'Space' && !e.target.closest('input,button,textarea')) { e.preventDefault(); spin(); }
        };
        document.addEventListener('keydown', onKey);
        ctx.onUnmount(() => { auto = false; fsBar.active = false; document.removeEventListener('keydown', onKey); });
      },
    };
  }

  App.register(createSlot({
    id: 'tigrinho', name: 'Tigrinho da Sorte', art: 'tiger', mascot: 'tiger-full',
    tag: 'Carta do Tigre · até 2.500x', colors: ['#f59e0b', '#b91c1c'], rtp: '~93%',
    intro: 'Inspirado no famoso "jogo do tigrinho".',
    featureRules: `<p><b>🐯 Carta do Tigre:</b> em qualquer giro o tigre pode soltar a carta. Um símbolo é sorteado e os rolos fazem <b>respins</b> travando esse símbolo (e coringas) até formar ao menos uma linha. Se a <b>tela inteira</b> for preenchida, o prêmio é multiplicado por <b>x10</b>!</p>`,
    featureChance: 1 / 45,
    symbols: [
      { id: 'tigre', img: 'tiger', name: 'Tigre', w: 3, pay: 250, wild: true },
      { id: 'ouro', img: 'moneybag', name: 'Saco de ouro', w: 3, pay: 100 },
      { id: 'env', img: 'envelope', name: 'Envelope da sorte', w: 5, pay: 25 },
      { id: 'lant', img: 'lantern', name: 'Lanterna', w: 6, pay: 10 },
      { id: 'fogos', img: 'firecracker', name: 'Bombinha', w: 7, pay: 8 },
      { id: 'laranja', img: 'tangerine', name: 'Laranja', w: 9, pay: 5 },
      { id: 'doce', img: 'candy', name: 'Doce', w: 11, pay: 3 },
    ],
  }));

  App.register(createSlot({
    id: 'ratinho', name: 'Ratinho Sortudo', art: 'mouse', mascot: 'mouse',
    tag: 'Rolo coringa · ganho garantido', colors: ['#f43f5e', '#7c2d12'], rtp: '~95,7%',
    intro: 'Inspirado no "Fortune Mouse".',
    feature: 'mouse',
    featureRules: `<p><b>🐭 Ratinho Sortudo:</b> em qualquer giro (≈ 1 a cada 18) o rolo do meio vira <b>coringa</b> inteiro e os outros rolos giram de novo até formar pelo menos uma linha — <b>vitória garantida</b>!</p>`,
    featureChance: 1 / 18,
    symbols: [
      { id: 'rato', img: 'mouse', name: 'Ratinho', w: 2, pay: 250, wild: true },
      { id: 'moeda', img: 'coin', name: 'Moeda de ouro', w: 3, pay: 125 },
      { id: 'presente', img: 'gift', name: 'Presente', w: 5, pay: 35 },
      { id: 'sino', img: 'bell', name: 'Sino', w: 6, pay: 15 },
      { id: 'queijo', img: 'cheese', name: 'Queijo', w: 8, pay: 10 },
      { id: 'bolo', img: 'mooncake', name: 'Bolo da lua', w: 10, pay: 6 },
      { id: 'biscoito', img: 'cookie', name: 'Biscoito da sorte', w: 12, pay: 4 },
    ],
  }));

  App.register(createSlot({
    id: 'dragaozinho', name: 'Dragãozinho', art: 'dragon', mascot: 'dragon-full',
    tag: 'Multiplicador até x10', colors: ['#e11d48', '#6d28d9'], rtp: '~96%',
    intro: 'Inspirado no "jogo do dragãozinho".',
    featureRules: `<p><b>🔥 Sopro do Dragão:</b> todo giro sorteia um multiplicador (x1, x2, x5 ou x10) mostrado no topo, aplicado a todos os ganhos daquele giro.</p>`,
    multipliers: [{ m: 1, w: 60 }, { m: 2, w: 25 }, { m: 5, w: 11 }, { m: 10, w: 4 }],
    symbols: [
      { id: 'dragao', img: 'dragon', name: 'Dragão', w: 2, pay: 100, wild: true },
      { id: 'diamante', img: 'gem', name: 'Diamante', w: 3, pay: 50 },
      { id: 'coroa', img: 'crown', name: 'Coroa', w: 4, pay: 25 },
      { id: 'orbe', img: 'crystal', name: 'Orbe', w: 6, pay: 12 },
      { id: 'vaso', img: 'amphora', name: 'Vaso', w: 8, pay: 8 },
      { id: 'pessego', img: 'peach', name: 'Pêssego', w: 10, pay: 5 },
      { id: 'trevo', img: 'clover', name: 'Trevo', w: 12, pay: 3 },
    ],
  }));
})();
