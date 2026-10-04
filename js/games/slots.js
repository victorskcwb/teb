'use strict';

/* =========================================================
   Slots 3×3 com 5 linhas (estilo "Fortune" da PG Soft)
   - Tigrinho: recurso "Carta do Tigre" (respins até ganhar, tela cheia = x10)
   - Ratinho: rolo do meio vira coringa e os outros giram até ganhar
   - Dragãozinho: multiplicador aleatório em todo giro (x1, x2, x5, x10)
   - Touro: rolo do meio trava um símbolo e as pontas fazem respins
   - Coelho: cenouras com prêmio (5+ pagam) e rodadas só de cenouras
   Pagamentos em "x da aposta por linha" (aposta total / 5).
   ========================================================= */
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [6, 4, 2]];

  function evaluate(grid) {
    const wins = [];
    for (const line of LINES) {
      const syms = line.map(i => grid[i]);
      const base = syms.find(s => !s.wild) || syms[0];
      if (base.prize || base.blank) continue;
      if (syms.every(s => s.wild || s.id === base.id)) wins.push({ cells: line, sym: base });
    }
    return wins;
  }

  function paytable(cfg) {
    return `<table class="paytable">${cfg.symbols.filter(s => !s.prize).map(s => `
      <tr><td class="pt-sym">${ico(s.img)}${ico(s.img)}${ico(s.img)}</td>
      <td>${s.name}${s.wild ? ' <span class="badge">CORINGA</span>' : ''}</td>
      <td><b>${fmtV(round2(s.pay / 5))}</b></td></tr>`).join('')}</table>`;
  }

  const fmtV = v => String(v).replace('.', ',') + 'x';
  const BLANK = { id: 'blank', img: 'sparkles', blank: true };

  function createSlot(cfg) {
    const wild = cfg.symbols.find(s => s.wild);
    const prize = cfg.symbols.find(s => s.prize);
    const prizeSym = () => ({ ...prize, val: RNG.weighted(cfg.prizeValues).v });
    const draw = () => { const s = RNG.weighted(cfg.symbols); return s.prize ? prizeSym() : s; };
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
      info: {
        maxWin: cfg.maxWin, vol: cfg.vol, rtp: cfg.rtp, hit: cfg.hit, highlights: cfg.highlights,
        how: `<p>Grade <b>3×3</b> com <b>5 linhas fixas</b> (veja a aba Linhas). Três símbolos iguais numa linha pagam; ganhos em linhas diferentes <b>se somam</b>.</p>
          <p>${ico(wild.img)} <b>${wild.name}</b> é o coringa: substitui qualquer símbolo${prize ? ` (menos a ${prize.name.toLowerCase()})` : ''} e 3 dele pagam o maior valor da tabela.</p>
          ${prize ? `<p>${ico(prize.img)} <b>${cfg.prizeMin} ou mais ${prize.plural}</b> em qualquer lugar pagam a soma dos valores escritos nelas.</p>` : ''}`,
        tables: [
          {
            title: 'Pagamento por linha', note: 'Valor de cada linha com 3 iguais. O coringa completa qualquer linha.',
            head: ['3 na linha'],
            rows: cfg.symbols.filter(s => !s.prize).map(s => ({ img: s.img, name: s.name, badge: s.wild ? 'CORINGA' : '', pays: [s.pay / 5] })),
          },
          ...(prize ? [{
            title: `Valores da ${prize.name.toLowerCase()}`, note: `Cada ${prize.name.toLowerCase()} mostra um destes valores. Com ${cfg.prizeMin}+ na tela (ou nas Rodadas do Coelho) você ganha a soma.`,
            head: ['cada uma'],
            rows: cfg.prizeValues.map(p => ({ img: prize.img, name: fmtV(p.v), pays: [p.v] })),
          }] : []),
        ],
        features: `${cfg.featureRules}
          ${cfg.multipliers ? `<table class="paytable"><tr class="si-head"><td>Multiplicador</td><td>Chance por giro</td></tr>${cfg.multipliers.map(m => `<tr><td><b>x${m.m}</b></td><td>${Math.round((m.w / cfg.multipliers.reduce((s, x) => s + x.w, 0)) * 100)}%</td></tr>`).join('')}</table>` : ''}
          <p>🎁 <b>Rodadas grátis</b> do bônus diário, missões e passe valem aqui (aposta fixa de 🪙 ${fmt(Progress.FS_BET)}).</p>
          <p class="muted small">Prêmio máximo por giro: ${fmtV(cfg.maxWin)} a aposta.</p>`,
        lines: {
          cols: 3, rows: 3, list: LINES.map(L => L.map(i => `${i % 3}:${Math.floor(i / 3)}`)),
          text: 'As 5 linhas ficam ativas em todo giro: 3 horizontais e 2 diagonais. A aposta total é dividida entre elas.',
        },
      },

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
                <button class="toggle speed" data-t="speed"></button>
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
        ctx.bet = () => stepper.value;
        SlotInfo.attach(el, ctx);
        const fsBar = freeSpinBar(ctx, on => { spinBtn.classList.toggle('free', on); if (on && !busy) spin(); });
        $('.fs-slot', el).append(fsBar.el);

        const cells = [];
        for (let i = 0; i < 9; i++) {
          const c = h('<div class="cell"><img alt="" draggable="false"><b class="val"></b></div>');
          gridEl.append(c);
          cells.push(c);
        }
        const setCell = (i, sym) => {
          const img = cells[i].firstChild;
          if (img.dataset.s !== sym.img) { img.src = IMG(sym.img); img.dataset.s = sym.img; }
          cells[i].classList.toggle('is-wild', !!sym.wild);
          cells[i].classList.toggle('prize', !!sym.prize);
          cells[i].classList.toggle('blank', !!sym.blank);
          cells[i].lastChild.textContent = sym.prize ? fmtV(sym.val) : '';
        };
        for (let i = 0; i < 9; i++) setCell(i, draw());

        let busy = false, auto = false;
        const msg = t => { msgEl.textContent = t; };
        const setAuto = v => { auto = v; $('[data-t="auto"]', el).classList.toggle('on', v); };

        async function animateTo(final, { fixed = new Set(), gen = draw } = {}) {
          const timers = [0, 1, 2].map(col => {
            const idx = [col, col + 3, col + 6].filter(i => !fixed.has(i));
            if (!idx.length) return null;
            idx.forEach(i => cells[i].classList.add('spinning'));
            return { idx, t: ctx.interval(() => idx.forEach(i => setCell(i, gen())), 70) };
          });
          const first = Speed.pick(180, 520), step = Speed.pick(110, 300);
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

        /* Respins travando um símbolo (e coringas) até formar linha; tela cheia paga x10.
           Tigrinho: começa livre. Touro: o rolo do meio já começa travado. */
        async function lockFeature() {
          const [p0, step, wildP] = cfg.lock;
          const pre = cfg.feature === 'ox' ? [1, 4, 7] : [];
          const nonWild = cfg.symbols.filter(s => !s.wild);
          const target = RNG.weighted(nonWild);
          const others = nonWild.filter(s => s.id !== target.id);
          const roll = () => (RNG.float() < wildP ? wild : target);
          const lock = Array(9).fill(null);
          pre.forEach(i => { lock[i] = target; });
          for (let i = 0; i < 9; i++) if (!lock[i] && RNG.float() < p0) lock[i] = roll();
          const fill = () => lock.map(l => l || RNG.weighted(others));
          const markLocks = () => cells.forEach((c, i) => c.classList.toggle('locked', !!lock[i]));

          el.classList.add('feature');
          mascot.classList.add('roar');
          msg(cfg.featureMsg(target));
          Sfx.big();
          pre.forEach(i => setCell(i, target));
          markLocks();
          await ctx.sleep(1100);

          let grid = fill();
          await animateTo(grid, { fixed: new Set(pre) });
          markLocks();
          let guard = 0;
          while (!LINES.some(L => L.every(i => lock[i])) && guard++ < 60) {
            const fixed = new Set(lock.map((l, i) => (l ? i : -1)).filter(i => i >= 0));
            await ctx.sleep(Speed.pick(150, 350));
            for (let i = 0; i < 9; i++) if (!lock[i] && RNG.float() < step) lock[i] = roll();
            grid = fill();
            await animateTo(grid, { fixed });
            markLocks();
          }
          const full = lock.every(Boolean);
          mascot.classList.remove('roar');
          el.classList.remove('feature');
          cells.forEach(c => c.classList.remove('locked'));
          if (full) msg(`TELA CHEIA! Prêmio x10 ${cfg.emoji}`);
          return { grid, mult: full ? 10 : 1 };
        }

        /* Recurso do Coelho: giros só com cenouras e espaços vazios; toda cenoura paga */
        async function rabbitFeature(bet) {
          el.classList.add('feature');
          mascot.classList.add('roar');
          msg(`RODADAS DO COELHO! ${cfg.rabbitSpins} giros só de cenouras 🥕`);
          Sfx.big();
          UI.confetti(30, [prize.img, 'coin', 'star']);
          await ctx.sleep(1300);
          const gen = () => (RNG.float() < 0.5 ? prizeSym() : BLANK);
          let grid = [], total = 0;
          for (let k = cfg.rabbitSpins; k > 0; k--) {
            msg(`Rodadas do Coelho: ${k} restante${k > 1 ? 's' : ''} · 🪙 ${fmt(total)}`);
            cells.forEach(c => c.classList.remove('win'));
            grid = Array.from({ length: 9 }, () => (RNG.float() < cfg.rabbitP ? prizeSym() : BLANK));
            await animateTo(grid, { gen });
            const sum = grid.reduce((s, x) => s + (x.val || 0), 0);
            if (sum > 0) {
              total = round2(Math.min(cfg.maxWin * bet, total + sum * bet));
              cells.forEach((c, i) => { if (grid[i].prize) c.classList.add('win'); });
              winEl.textContent = fmt(total);
              Sfx.coin();
              await ctx.sleep(Speed.pick(350, 750));
              if (total >= cfg.maxWin * bet) { msg('PRÊMIO MÁXIMO! 🏆'); break; }
            } else {
              await ctx.sleep(Speed.pick(150, 350));
            }
          }
          mascot.classList.remove('roar');
          el.classList.remove('feature');
          cells.forEach(c => c.classList.remove('win'));
          return { grid, mult: 1, bonus: total };
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
            grid = Array.from({ length: 9 }, (_, i) => (mid.has(i) ? wild : draw()));
            await animateTo(grid, { fixed: mid });
            if (evaluate(grid).length) break;
            await ctx.sleep(Speed.pick(120, 260));
          } while (guard++ < 40);
          mascot.classList.remove('roar');
          el.classList.remove('feature');
          cells.forEach(c => c.classList.remove('locked'));
          return { grid, mult: 1 };
        }

        async function normalSpin() {
          const grid = Array.from({ length: 9 }, draw);
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
          const features = { mouse: mouseFeature, rabbit: rabbitFeature, ox: lockFeature, tiger: lockFeature };
          const res = isFeature ? await features[cfg.feature || 'tiger'](bet) : await normalSpin();

          const wins = evaluate(res.grid);
          const prizes = prize && !res.bonus ? res.grid.map((x, i) => (x.prize ? i : -1)).filter(i => i >= 0) : [];
          const prizeWin = prizes.length >= cfg.prizeMin ? round2(prizes.reduce((s, i) => s + res.grid[i].val, 0) * bet) : 0;
          const payout = round2(Math.min(cfg.maxWin * bet, wins.reduce((s, w) => s + w.sym.pay, 0) * (bet / 5) * res.mult + prizeWin + (res.bonus || 0)));
          if (wins.length || prizeWin) {
            cells.forEach(c => c.classList.add('dim'));
            wins.forEach(w => w.cells.forEach(i => { cells[i].classList.remove('dim'); cells[i].classList.add('win'); }));
            if (prizeWin) prizes.forEach(i => { cells[i].classList.remove('dim'); cells[i].classList.add('win'); });
          }
          if (payout > 0) {
            Wallet.win(payout);
            winEl.textContent = fmt(payout);
            if (ctx.alive) {
              const parts = [];
              if (wins.length) parts.push(`${wins.length} linha${wins.length > 1 ? 's' : ''}${res.mult > 1 ? ` · x${res.mult}` : ''}`);
              if (prizeWin) parts.push(`${prizes.length} ${prize.plural}`);
              if (res.bonus) parts.push(cfg.featureName);
              if (res.mult < 10 || !isFeature) msg(`${parts.join(' + ')} — ganhou ${fmt(payout)}!`);
              UI.result(payout, bet);
            }
          } else {
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
            await ctx.sleep(payout > 0 ? 1100 : (Speed.pick(250, 600)));
            // espera o overlay de vitória grande (e a oferta de dobrar) sair da tela
            while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300);
            if (ctx.alive && !busy && (auto || (fsBar.active && Progress.s.fs > 0))) spin();
          }
        }

        spinBtn.addEventListener('click', spin);
        Speed.bind($('[data-t="speed"]', el), ctx);
        $('.slot-toggles', el).addEventListener('click', e => {
          const t = e.target.dataset.t;
          if (!t) return;
          Sfx.click();
          if (t === 'speed') Speed.next();
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
    tag: 'Carta do Tigre · até 2.500x', colors: ['#f59e0b', '#b91c1c'], rtp: '~91%',
    intro: 'Inspirado no famoso "jogo do tigrinho".',
    featureRules: `<p><b>🐯 Carta do Tigre:</b> em qualquer giro o tigre pode soltar a carta. Um símbolo é sorteado e os rolos fazem <b>respins</b> travando esse símbolo (e coringas) até formar ao menos uma linha. Se a <b>tela inteira</b> for preenchida, o prêmio é multiplicado por <b>x10</b>!</p>`,
    featureChance: 1 / 45, lock: [0.35, 0.22, 0.15], emoji: '🐯',
    maxWin: 2500, vol: 3, hit: '~1 em 3 giros (33%)',
    highlights: ['🐯 <b>Carta do Tigre</b> (≈1 em 45 giros): respins até sair pelo menos 1 linha — ganho garantido', 'Encheu a tela com um símbolo? Prêmio <b>x10</b>', 'Tela cheia de Tigres = <b>2.500x</b>, o prêmio máximo'],
    featureMsg: t => `CARTA DO TIGRE! Símbolo da rodada: ${t.name}`,
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
    maxWin: 250, vol: 1, hit: '~1 em 3 giros (32%)',
    highlights: ['🐭 <b>Ratinho Sortudo</b> (≈1 em 18 giros): rolo do meio vira coringa e o ganho é garantido', 'Muitos ganhos pequenos: bom para saldo baixo', 'Tela cheia de Ratinhos = <b>250x</b>'],
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
    id: 'touro', name: 'Touro da Sorte', art: 'ox', mascot: 'ox',
    tag: 'Touro Furioso · tela cheia x10', colors: ['#dc2626', '#a16207'], rtp: '~96%',
    intro: 'Inspirado no "Fortune Ox".',
    feature: 'ox', featureChance: 1 / 40, lock: [0.3, 0.25, 0.12], emoji: '🐂',
    maxWin: 2350, vol: 3, hit: '~1 em 3 giros (30%)',
    highlights: ['🐂 <b>Touro Furioso</b> (≈1 em 40 giros): ganho garantido', 'Encheu a tela? Prêmio <b>x10</b>', 'Tela cheia de Touros = <b>2.350x</b>, o prêmio máximo'],
    featureMsg: t => `TOURO FURIOSO! Rolo do meio travado em ${t.name}`,
    featureRules: `<p><b>🐂 Touro Furioso:</b> em qualquer giro (≈ 1 a cada 40) o rolo do meio trava inteiro com um símbolo sorteado e os rolos das pontas fazem <b>respins</b>, travando esse símbolo (e coringas), até formar pelo menos uma linha. Encheu a <b>tela inteira</b>? Prêmio <b>x10</b>!</p>`,
    symbols: [
      { id: 'touro', img: 'ox', name: 'Touro', w: 2, pay: 235, wild: true },
      { id: 'joia', img: 'gem', name: 'Joia', w: 3, pay: 117.5 },
      { id: 'nota', img: 'banknote', name: 'Maço de notas', w: 4, pay: 47 },
      { id: 'env', img: 'envelope', name: 'Envelope da sorte', w: 6, pay: 17.5 },
      { id: 'perg', img: 'scroll', name: 'Pergaminho', w: 7, pay: 11.75 },
      { id: 'moeda', img: 'coin', name: 'Moeda', w: 9, pay: 6 },
      { id: 'laranja', img: 'tangerine', name: 'Laranja', w: 11, pay: 3.5 },
    ],
  }));

  App.register(createSlot({
    id: 'coelho', name: 'Coelho da Sorte', art: 'rabbit', mascot: 'rabbit-full',
    tag: 'Cenouras de prêmio · até 200x', colors: ['#f97316', '#be185d'], rtp: '~96%',
    intro: 'Inspirado no "Fortune Rabbit".',
    feature: 'rabbit', featureChance: 1 / 70, featureName: 'Rodadas do Coelho',
    rabbitSpins: 8, rabbitP: 0.1, prizeMin: 5,
    maxWin: 5000, vol: 3, hit: '~1 em 4 giros (24%)',
    highlights: ['🥕 Cenouras valem de <b>0,5x a 200x</b> a aposta', '<b>5+ cenouras</b> na tela pagam a soma de todas', '🐰 <b>Rodadas do Coelho</b> (≈1 em 70 giros): 8 giros em que toda cenoura paga', 'Prêmio máximo: <b>5.000x</b> por giro'],
    prizeValues: [{ v: 0.5, w: 35 }, { v: 1, w: 25 }, { v: 2, w: 18 }, { v: 5, w: 10 }, { v: 10, w: 6 }, { v: 25, w: 2.5 }, { v: 50, w: 1 }, { v: 200, w: 0.15 }],
    featureRules: `<p><b>🥕 Cenouras de prêmio:</b> cada cenoura mostra um valor (0,5x a 200x a aposta). Com <b>5 ou mais</b> cenouras na tela, você ganha a soma de todas — além das linhas.</p>
      <p><b>🐰 Rodadas do Coelho:</b> em qualquer giro (≈ 1 a cada 70) começam <b>8 giros grátis</b> em que só caem cenouras e espaços vazios — e <b>toda cenoura paga</b>, sem mínimo.</p>`,
    symbols: [
      { id: 'coelho', img: 'rabbit', name: 'Coelho', w: 2, pay: 270, wild: true },
      { id: 'cenoura', img: 'carrot', name: 'Cenoura', plural: 'cenouras', w: 3.2, prize: true },
      { id: 'moeda', img: 'coin', name: 'Moeda de ouro', w: 3, pay: 135 },
      { id: 'presente', img: 'gift', name: 'Presente', w: 5, pay: 40 },
      { id: 'env', img: 'envelope', name: 'Envelope', w: 6, pay: 16.25 },
      { id: 'lant', img: 'lantern', name: 'Lanterna', w: 8, pay: 10.75 },
      { id: 'laranja', img: 'tangerine', name: 'Laranja', w: 10, pay: 6.75 },
      { id: 'doce', img: 'candy', name: 'Doce', w: 12, pay: 4 },
    ],
  }));

  App.register(createSlot({
    id: 'dragaozinho', name: 'Dragãozinho', art: 'dragon', mascot: 'dragon-full',
    tag: 'Multiplicador até x10', colors: ['#e11d48', '#6d28d9'], rtp: '~96%',
    intro: 'Inspirado no "jogo do dragãozinho".',
    featureRules: `<p><b>🔥 Sopro do Dragão:</b> todo giro sorteia um multiplicador (x1, x2, x5 ou x10) mostrado no topo, aplicado a todos os ganhos daquele giro.</p>`,
    maxWin: 1000, vol: 2, hit: '~1 em 3,5 giros (29%)',
    highlights: ['🔥 Todo giro sorteia um multiplicador: <b>x1, x2, x5 ou x10</b>', 'O multiplicador vale para todas as linhas do giro', 'Tela cheia de Dragões com x10 = <b>1.000x</b>'],
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
