'use strict';

/* =========================================================
   SlotKit — motor compartilhado dos slots "de estúdio"
   (estilo Pragmatic, PG Soft, Hacksaw, TaDa e Nolimit).

   Cada jogo descreve só a matemática e os recursos:
     SlotKit.create({ id, name, ..., symbols, make(mode), spin(rt), bonus(rt, opts) })
   e o kit cuida do resto: tela, aposta, turbo/auto, compra de
   bônus, rodadas grátis do passe, prêmio máximo e painel de prêmios.

   A lógica conversa com a tela só pelo objeto `rt` (runtime).
   Os ganhos são informados em "x da aposta" sem calibração
   (rt.win(x)); o kit multiplica por k (de SLOT_CALIB, gerado por
   tools/calibrate.js) e pela aposta. Com um `rt` sem tela o mesmo
   código roda milhões de giros no Node para calibrar o RTP.

   Grade = array de colunas; cada coluna = array de células
   (de cima para baixo). Célula = cópia de um símbolo + campos:
     wild, sc (scatter), gold (moldura), m (multiplicador),
     n (cópias, xWays), v (valor em x da aposta), t (texto), c (classes),
     fresh (acabou de cair: anima a queda)
   ========================================================= */
const SlotKit = (() => {
  const key = (c, r) => c + ':' + r;
  const unkey = k => k.split(':').map(Number);
  const cp = s => ({ ...s });

  /* ---------------- grade ---------------- */
  const makeGrid = (heights, draw) => heights.map((hgt, c) => Array.from({ length: hgt }, (_, r) => draw(c, r)));
  const cells = (grid, pred) => {
    const out = [];
    grid.forEach((col, c) => col.forEach((x, r) => { if (x && pred(x, c, r)) out.push([c, r]); }));
    return out;
  };
  const count = (grid, pred) => cells(grid, pred).length;
  const clone = grid => grid.map(col => col.map(x => (x ? { ...x } : x)));

  /** Sorteio ponderado por rolo: item.reels limita os rolos; wk escolhe o peso (w, fw...). */
  function pool(list) {
    const cache = {};
    return (c, wk = 'w') => {
      const k = c + wk;
      const items = cache[k] || (cache[k] = list.filter(s => (!s.reels || s.reels.includes(c)) && (s[wk] ?? s.w) > 0).map(s => ({ s, w: s[wk] ?? s.w })));
      return cp(RNG.weighted(items).s);
    };
  }

  /** Empilha: cada célula pode repetir a de cima (como nas fitas reais), o que deixa menos símbolos diferentes por rolo. */
  function stack(grid, p) {
    grid.forEach(col => {
      for (let r = 1; r < col.length; r++) {
        const up = col[r - 1], x = col[r];
        if (!up || !x || up.sc || up.wild || up.coin || x.sc || x.wild || x.coin || RNG.float() >= p) continue;
        col[r] = { ...x, id: up.id, img: up.img, name: up.name, pays: up.pays };
      }
    });
    return grid;
  }

  /** Cascata: remove as chaves e completa cada coluna por cima com draw(c). */
  function cascade(grid, keys, draw, keep = () => false) {
    const rm = keys instanceof Set ? keys : new Set(keys);
    grid.forEach((col, c) => {
      const stay = col.filter((x, r) => !rm.has(key(c, r)) || keep(x));
      const add = Array.from({ length: col.length - stay.length }, () => ({ ...draw(c), fresh: true }));
      grid[c] = [...add, ...stay];
    });
    return grid;
  }

  /* ---------------- avaliação ---------------- */
  const weight = x => (x.n || 1) * (x.m || 1);

  /**
   * Ways da esquerda para a direita. pays[i] = prêmio com (min + i) rolos.
   * Cada rolo contribui com a soma de (cópias × multiplicador) das células
   * que batem, então coringas multiplicadores multiplicam os caminhos.
   */
  function ways(grid, syms, { min = 3, wildMult = 'mul' } = {}) {
    let total = 0;
    const wins = [], hit = new Set();
    for (const s of syms) {
      let prod = 1, n = 0, real = false;
      // modo 'add': multiplicadores de coringa no mesmo caminho se somam
      // (A = caminhos sem coringa, B = com coringa, C = soma dos multiplicadores desses)
      let A = 1, B = 0, C = 0;
      const used = [];
      for (let c = 0; c < grid.length; c++) {
        let sum = 0, nn = 0, nw = 0, M = 0;
        grid[c].forEach((x, r) => {
          if (!x) return;
          if (x.id === s.id) real = true;
          else if (!x.wild) return;
          sum += weight(x);
          if (x.wild) { nw += x.n || 1; M += (x.n || 1) * (x.m || 1); } else nn += weight(x);
          used.push(key(c, r));
        });
        if (!sum) break;
        prod *= sum;
        [A, B, C] = [A * nn, B * (nn + nw) + A * nw, C * (nn + nw) + B * M + A * M];
        n++;
      }
      if (wildMult === 'add') prod = A + C;
      const m = s.min || min;
      if (n < m || !real) continue;
      const p = s.pays[Math.min(n - m, s.pays.length - 1)] * prod;
      if (!(p > 0)) continue;
      total += p;
      wins.push({ sym: s, n, ways: prod, pay: p });
      used.forEach(k => hit.add(k));
    }
    return { total, wins, cells: hit };
  }

  /** Linhas fixas (da esquerda). lines = [[linha do rolo 0, rolo 1, ...], ...]. Multiplicadores de coringa: 'mul' ou 'add'. */
  function lines(grid, L, syms, { min = 3, mult = 'mul' } = {}) {
    const byId = {};
    syms.forEach(s => { byId[s.id] = s; });
    let total = 0;
    const wins = [], hit = new Set();
    L.forEach((line, li) => {
      const xs = line.map((r, c) => grid[c][r]);
      const base = xs.find(x => x && !x.wild) || (xs[0] && xs[0].wild ? xs[0] : null);
      if (!base) return;
      const s = byId[base.id];
      if (!s) return;
      let n = 0;
      while (n < xs.length && xs[n] && (xs[n].id === base.id || xs[n].wild)) n++;
      const m = s.min || min;
      if (n < m) return;
      const ms = xs.slice(0, n).filter(x => x.m > 1).map(x => x.m);
      const k = !ms.length ? 1 : mult === 'add' ? ms.reduce((a, b) => a + b, 0) : ms.reduce((a, b) => a * b, 1);
      const p = s.pays[Math.min(n - m, s.pays.length - 1)] * k;
      if (!(p > 0)) return;
      total += p;
      wins.push({ sym: s, n, line: li, pay: p, mult: k });
      for (let c = 0; c < n; c++) hit.add(key(c, line[c]));
    });
    return { total, wins, cells: hit };
  }

  /** Grupos de `min`+ iguais encostados (horizontal/vertical). Coringas entram em qualquer grupo. */
  function clusters(grid, min) {
    const out = [];
    const done = new Set();
    grid.forEach((col, c) => col.forEach((x, r) => {
      if (!x || x.wild || x.sc || x.noPay || done.has(key(c, r))) return;
      const id = x.id, seen = new Set([key(c, r)]), stack = [[c, r]], comp = [];
      while (stack.length) {
        const [cc, rr] = stack.pop();
        comp.push(key(cc, rr));
        for (const [a, b] of [[cc - 1, rr], [cc + 1, rr], [cc, rr - 1], [cc, rr + 1]]) {
          const y = grid[a] && grid[a][b];
          const k = key(a, b);
          if (!y || seen.has(k) || !(y.id === id || y.wild)) continue;
          seen.add(k);
          stack.push([a, b]);
        }
      }
      comp.forEach(k => { const [a, b] = unkey(k); if (grid[a][b].id === id) done.add(k); });
      if (comp.length >= min) out.push({ sym: x, cells: comp, n: comp.length });
    }));
    return out;
  }

  /** Paga em qualquer lugar: contagem por símbolo (coringas somam em todos). */
  function anywhere(grid, syms, tierOf) {
    const cnt = {}, wildN = count(grid, x => x.wild);
    grid.flat().forEach(x => { if (x && !x.wild) cnt[x.id] = (cnt[x.id] || 0) + 1; });
    let total = 0;
    const wins = [], hit = new Set();
    for (const s of syms) {
      if (!cnt[s.id]) continue;
      const n = cnt[s.id] + wildN, t = tierOf(n);
      if (t < 0) continue;
      total += s.pays[t];
      wins.push({ sym: s, n, pay: s.pays[t] });
      cells(grid, x => x.id === s.id || x.wild).forEach(([c, r]) => hit.add(key(c, r)));
    }
    return { total, wins, cells: hit };
  }

  /** Grupos de clusters → { total, wins, cells }. */
  function payClusters(cl, tierOf, multOf = () => 1) {
    let total = 0;
    const hit = new Set(), wins = [];
    for (const k of cl) {
      const t = tierOf(k.n);
      if (t < 0 || !k.sym.pays) continue;
      const m = multOf(k);
      const p = k.sym.pays[Math.min(t, k.sym.pays.length - 1)] * m;
      total += p;
      wins.push({ sym: k.sym, n: k.n, pay: p, mult: m });
      k.cells.forEach(x => hit.add(x));
    }
    return { total, wins, cells: hit };
  }

  /** Paga uma avaliação na tela: destaca, soma e escreve. Retorna o ganho (x aposta, sem k). */
  async function pay(rt, res, mult = 1, extra = '') {
    if (!res.total) return 0;
    const w = res.total * mult;
    rt.mark(res.cells);
    rt.win(w);
    rt.msg(`${describe(res)}${mult > 1 ? ` · x${short(mult)}` : ''}${extra} = ${rt.coins(w)}`);
    rt.fx(mult > 1 ? 'big' : 'win');
    await rt.wait(mult > 1 ? 950 : 750);
    return w;
  }

  /**
   * Cascata genérica: avalia, paga (× mult(passo)), troca/remover vencedores e derruba novos.
   * convert(cell) → nova célula que fica no lugar (ex.: moldura dourada vira coringa) ou null.
   */
  async function tumble(rt, grid, { evaluate, draw, mult = () => 1, convert = null, onStep = null, keep = null }) {
    let total = 0, step = 0;
    for (;;) {
      const res = evaluate(grid, step);
      if (!res.total) break;
      const m = mult(step, res, grid);
      total += await pay(rt, res, m);
      if (rt.capped) break;
      const rm = new Set();
      res.cells.forEach(k => {
        const [c, r] = unkey(k), x = grid[c][r];
        if (keep && keep(x)) return;
        const nx = convert ? convert(x, c, r) : null;
        if (nx) grid[c][r] = nx; else rm.add(k);
      });
      cascade(grid, rm, draw);
      step++;
      if (onStep) await onStep(step, grid, res);
      await rt.drop(grid);
    }
    return { total, steps: step };
  }

  /** Chaves das células de scatter. */
  const scatters = grid => cells(grid, x => x.sc).map(([c, r]) => key(c, r));

  /** Texto curto de uma avaliação: "3× Cão · 5× Bola". */
  const describe = res => res.wins.slice(0, 3).map(w => `${w.n}× ${w.sym.name}`).join(' · ') + (res.wins.length > 3 ? ' …' : '');

  /** Moeda/jackpot curto: 12,5 → "12,5"; 1000 → "1 mil". */
  const short = v => (v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString('pt-BR') + ' mil' : (Math.round(v * 100) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }));

  /* =========================================================
     Hold & Spin (moedas travam, 3 respins que reiniciam)
     ========================================================= */
  async function holdSpin(rt, grid, { isCoin, newCoin, pCoin, full, title = 'RESPINS DE MOEDAS', sub = '3 respins · cada moeda nova reinicia' }) {
    rt.stat('hold');
    await rt.banner(title, sub, 1400);
    let left = 3;
    const total = () => grid.flat().filter(isCoin).reduce((s, x) => s + (x.v || 0), 0);
    // células que não são moeda ficam vazias
    grid.forEach((col, c) => col.forEach((x, r) => { if (!isCoin(x)) grid[c][r] = { id: 'vazio', img: 'sparkles', c: 'empty', noPay: true }; }));
    rt.show(grid);
    while (left > 0) {
      rt.chip('resp', 'RESPINS', left);
      left--;
      let got = 0;
      grid.forEach((col, c) => col.forEach((x, r) => {
        if (isCoin(x) || RNG.float() >= pCoin) return;
        grid[c][r] = { ...newCoin(), fresh: true };
        got++;
      }));
      await rt.drop(grid);
      if (got) { left = 3; rt.fx('coin'); rt.msg(`+${got} moeda${got > 1 ? 's' : ''}! Respins reiniciados`); }
      if (grid.every(col => col.every(isCoin))) break;
      await rt.wait(350);
    }
    rt.chip('resp', null);
    let win = total();
    if (grid.every(col => col.every(isCoin)) && full) {
      win += full.v;
      rt.msg(`TELA CHEIA! ${full.name} +${rt.coins(full.v)}`);
      rt.fx('jackpot');
      await rt.wait(1200);
    }
    rt.win(win);
    rt.msg(`Moedas: ${rt.coins(win)}`);
    rt.fx('big');
    await rt.wait(900);
    return win;
  }

  /* =========================================================
     Runtime sem tela (simulação / calibração)
     ========================================================= */
  function simRT(cfg, K) {
    const st = { fs: 0, hold: 0 };
    const noop = () => {};
    const rt = {
      sim: true, k: K, bet: 1, total: 0, capped: false, mode: 'base', stats: st,
      reset() { this.total = 0; this.capped = false; this.mode = 'base'; },
      win(x) {
        if (this.capped || !(x > 0)) return;
        this.total += x;
        if (this.total * K >= cfg.maxWin) { this.total = cfg.maxWin / K; this.capped = true; }
      },
      coins: () => '', xs: () => '', msg: noop, show: noop, head: noop, chip: noop, fx: noop, mark: noop, clear: noop,
      wait: () => Promise.resolve(), spin: () => Promise.resolve(), drop: () => Promise.resolve(),
      banner: () => Promise.resolve(), reveal: () => Promise.resolve(),
      choose: async (title, opts) => (opts.find(o => o.sim) || RNG.pick(opts)).id,
      stat(n) { st[n] = (st[n] || 0) + 1; },
      async fsLoop(n, body) {
        st.fs++;
        this.mode = 'fs';
        let left = n;
        const api = { i: 0, add(k) { left += k; }, get left() { return left; } };
        while (left > 0 && !this.capped) { left--; await body(api); api.i++; }
        this.mode = 'base';
      },
    };
    return rt;
  }

  /* =========================================================
     Criação do jogo
     ========================================================= */
  function create(cfg) {
    const cal = (typeof SLOT_CALIB !== 'undefined' && SLOT_CALIB[cfg.id]) || {};
    const K = cal.k || 1;
    const buyX = cfg.buy === false ? 0 : cal.buy || 100;
    const rtp = cfg.rtp || '~96%';
    const hit = cal.hit ? `~1 em ${String(Math.round((1 / cal.hit) * 10) / 10).replace('.', ',')} giros (${Math.round(cal.hit * 100)}%)` : '—';
    const fsEvery = cal.fs ? Math.round(1 / cal.fs) : 0;
    const scale = rows => rows.map(r => ({ ...r, pays: r.pays.map(p => (p == null ? null : round2(p * K))) }));
    const maxTxt = fmt(cfg.maxWin).replace(',00', '');
    const L = cfg.lineList;

    return {
      id: cfg.id, name: cfg.name, art: cfg.art, category: 'slots', studio: cfg.studio, tag: cfg.tag, colors: cfg.colors,
      sprites: [...new Set([...cfg.symbols.map(s => s.img), cfg.mascot, ...(cfg.extraSprites || [])])],
      logic: cfg,
      rules: `<p>${cfg.intro}</p>${cfg.how}${cfg.features}`,
      info: {
        maxWin: cfg.maxWin, vol: cfg.vol, rtp, hit, highlights: cfg.highlights,
        how: `<p class="muted small">${cfg.intro}</p>${cfg.how}`,
        tables: (cfg.tables || []).map(t => ({ ...t, rows: t.raw ? t.rows : scale(t.rows) })),
        features: `${cfg.features}
          ${fsEvery && cfg.buy !== false ? `<p class="muted small">O bônus aparece em média 1 vez a cada ~${fsEvery} giros.</p>` : ''}
          ${buyX ? `<p>💰 <b>Comprar bônus:</b> entra direto no bônus por <b>${buyX}x</b> a aposta.</p>` : ''}
          <p class="muted small">Prêmio máximo: ${maxTxt}x a aposta — ao atingir, a rodada termina.</p>`,
        lines: L ? { cols: L.cols, rows: L.rows, list: L.list.map(line => line.map((r, c) => `${c}:${r}`)), text: L.text } : null,
      },

      mount(root, ctx) {
        const game = cfg;
        const el = h(`
          <div class="kit kit-${cfg.id}" style="--k1:${cfg.colors[0]};--k2:${cfg.colors[1]}${cfg.bg ? `;--kbg:${cfg.bg}` : ''}">
            <div class="scat-top">
              <img class="scat-mascot" src="${IMG(cfg.mascot)}" alt="">
              <div class="scat-msg"></div>
              <div class="kit-chips"></div>
            </div>
            <div class="kit-frame">
              <div class="kit-head hidden"></div>
              <div class="kit-grid"></div>
              <div class="scat-banner hidden"></div>
            </div>
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
            ${buyX ? '<button class="btn btn-buy buy"></button>' : ''}
          </div>`);
        root.append(el);

        const gridEl = $('.kit-grid', el), headEl = $('.kit-head', el), msgEl = $('.scat-msg', el), winEl = $('.slot-winbar b', el);
        const chipsEl = $('.kit-chips', el), banner = $('.scat-banner', el);
        const spinBtn = $('.spin-btn', el), buyBtn = $('.buy', el), mascot = $('.scat-mascot', el);
        const stepper = UI.betStepper([0.2, 0.4, 1, 2, 3, 5, 10, 20, 50, 100, 200], 3);
        $('.slot-bet', el).append(stepper.el);
        ctx.bet = () => stepper.value;
        SlotInfo.attach(el, ctx);
        const fsBar = freeSpinBar(ctx, on => { spinBtn.classList.toggle('free', on); if (on && !busy) spin(); });
        $('.fs-slot', el).append(fsBar.el);
        const renderBuy = () => { if (buyBtn) buyBtn.innerHTML = `💰 Comprar bônus <b>🪙 ${fmt(stepper.value * buyX)}</b>`; };
        stepper.el.addEventListener('click', renderBuy);
        renderBuy();
        el.style.setProperty('--cols', cfg.cols);
        gridEl.style.aspectRatio = `${cfg.cols} / ${cfg.rows * (cfg.cellH || 1)}`;

        let busy = false, turbo = false, auto = false, bet = stepper.value;
        const blur = cfg.symbols.filter(s => !s.noBlur).map(s => s.img);
        const wait = ms => ctx.sleep(turbo ? ms * 0.45 : ms);
        const setAuto = v => { auto = v; $('[data-t="auto"]', el).classList.toggle('on', v); };
        let fsTotal0 = 0;

        const label = x => (x.t != null ? x.t : x.v ? short(round2(x.v * K * bet)) : x.m > 1 ? 'x' + x.m : x.n > 1 ? '×' + x.n : '');
        const cellHTML = (x, delay) => {
          if (!x) return '<div class="kc empty"></div>';
          const cls = ['kc'];
          if (x.wild) cls.push('wild');
          if (x.sc) cls.push('sc');
          if (x.gold) cls.push('gold');
          if (x.c) cls.push(x.c);
          if (x.fresh && delay != null) cls.push('drop');
          const lb = label(x);
          return `<div class="${cls.join(' ')}"${x.fresh && delay != null ? ` style="animation-delay:${delay}ms"` : ''}>${x.img ? `<img src="${IMG(x.img)}" alt="" draggable="false">` : ''}${lb !== '' ? `<b>${lb}</b>` : ''}</div>`;
        };
        let cur = null;
        function render(grid, anim = false) {
          cur = grid;
          gridEl.innerHTML = grid.map((col, c) => `<div class="kcol">${col.map((x, r) => cellHTML(x, anim ? (turbo ? 12 : 28) * c + (col.length - r) * 10 : null)).join('')}</div>`).join('');
          grid.forEach(col => col.forEach(x => { if (x) x.fresh = false; }));
        }

        const rt = {
          sim: false, k: K, total: 0, capped: false, mode: 'base', stats: {},
          get bet() { return bet; },
          reset() { this.total = 0; this.capped = false; this.mode = 'base'; },
          win(x) {
            if (this.capped || !(x > 0)) return;
            this.total += x;
            if (this.total * K >= cfg.maxWin) {
              this.total = cfg.maxWin / K;
              this.capped = true;
              msgEl.textContent = 'PRÊMIO MÁXIMO! 🏆';
              Sfx.big();
            }
            winEl.textContent = fmt(round2(this.total * K * bet));
          },
          coins: x => `🪙 ${fmt(round2(x * K * bet))}`,
          xs: x => SlotInfo.xs(x * K),
          msg: t => { msgEl.textContent = t; },
          wait,
          fx: n => { if (Sfx[n]) Sfx[n](); },
          stat: () => {},
          show: grid => render(grid),
          async drop(grid) { render(grid, true); Sfx.reel(); await wait(460); },
          /** Giro com rolos: cada coluna roda e para da esquerda para a direita. */
          async spin(grid, { tease = true } = {}) {
            const rand = () => `<div class="kc"><img src="${IMG(RNG.pick(blur))}" alt=""></div>`;
            const colHTML = n => Array.from({ length: n }, rand).join('');
            gridEl.innerHTML = grid.map(col => `<div class="kcol spinning">${colHTML(col.length)}</div>`).join('');
            const cols = [...gridEl.children];
            const timers = cols.map((cEl, c) => ctx.interval(() => { cEl.innerHTML = colHTML(grid[c].length); }, 80));
            let sc = 0;
            for (let c = 0; c < grid.length; c++) {
              const teasing = tease && sc >= (cfg.teaseAt || 2);
              if (teasing) cols[c].classList.add('tease');
              await wait(c === 0 ? 380 : teasing ? 800 : 150);
              ctx.clear(timers[c]);
              cols[c].classList.remove('spinning', 'tease');
              cols[c].innerHTML = grid[c].map(x => cellHTML(x)).join('');
              cols[c].classList.add('land');
              sc += grid[c].filter(x => x && x.sc).length;
              Sfx.reel();
            }
            timers.forEach(t => ctx.clear(t));
            cur = grid;
            grid.forEach(col => col.forEach(x => { if (x) x.fresh = false; }));
          },
          /** Destaca células ('c:r'); as outras ficam apagadas. */
          mark(keys, cls = 'win') {
            const set = keys instanceof Set ? keys : new Set(keys);
            [...gridEl.children].forEach((col, c) => [...col.children].forEach((cell, r) => {
              const on = set.has(key(c, r));
              cell.classList.toggle(cls, on);
              if (cls === 'win') cell.classList.toggle('dim', !on && set.size > 0);
            }));
          },
          clear() { $$('.kc', gridEl).forEach(x => x.classList.remove('win', 'dim', 'hl')); },
          /** Faixa acima das colunas (valores por coluna) ou null. */
          head(vals) {
            headEl.classList.toggle('hidden', !vals);
            if (vals) headEl.innerHTML = vals.map(v => `<span>${v == null ? '' : v}</span>`).join('');
          },
          /** Contador no topo (GRÁTIS, MULT...). val null remove. */
          chip(id, lbl, val) {
            let c = $(`[data-chip="${id}"]`, chipsEl);
            if (val == null) { if (c) c.remove(); return; }
            if (!c) { c = h(`<div class="scat-fs" data-chip="${id}"><small></small><b></b></div>`); chipsEl.append(c); }
            $('small', c).textContent = lbl;
            const b = $('b', c);
            if (b.textContent !== String(val)) { b.textContent = val; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
          },
          async banner(title, sub = '', ms = 1600) {
            banner.innerHTML = `<b>${title}</b>${sub ? `<span>${sub}</span>` : ''}`;
            banner.classList.remove('hidden');
            Sfx.big();
            await ctx.sleep(ms);
            banner.classList.add('hidden');
          },
          /** Escolha do jogador (ex.: tipo de rodada grátis). */
          choose(title, opts) {
            return new Promise(res => {
              banner.innerHTML = `<b>${title}</b><div class="god-pick kit-pick">${opts.map(o => `
                <button class="god" data-o="${o.id}">${o.img ? ico(o.img) : ''}<strong>${o.label}</strong>${o.desc ? `<small>${o.desc}</small>` : ''}</button>`).join('')}</div>`;
              banner.classList.remove('hidden');
              let done = false;
              const pick = id => { if (done) return; done = true; banner.classList.add('hidden'); res(id); };
              banner.onclick = e => { const b = e.target.closest('[data-o]'); if (b) { Sfx.click(); pick(b.dataset.o); } };
              ctx.onUnmount(() => pick(opts[0].id));
            });
          },
          /** Roleta de itens que para no índice sorteado. items = [{ img, t }] */
          async reveal(title, items, idx) {
            banner.innerHTML = `<b>${title}</b><div class="kit-reveal"><img alt=""><strong></strong></div>`;
            banner.classList.remove('hidden');
            const img = $('.kit-reveal img', banner), txt = $('.kit-reveal strong', banner);
            const set = it => { img.src = IMG(it.img || cfg.mascot); txt.textContent = it.t || ''; };
            const steps = 14 + RNG.int(0, items.length - 1);
            for (let i = 0; i < steps; i++) { set(items[(idx + i - steps + 1 + items.length * 9) % items.length]); Sfx.tick(); await ctx.sleep(60 + i * 10); }
            set(items[idx]);
            $('.kit-reveal', banner).classList.add('pop');
            Sfx.big();
            await ctx.sleep(1100);
            banner.classList.add('hidden');
          },
          /** Laço de rodadas grátis: body(api) a cada giro; api.add(n) dá mais giros. */
          async fsLoop(n, body, { title = 'RODADAS GRÁTIS!', sub = `${n} giros`, label = 'GRÁTIS' } = {}) {
            this.mode = 'fs';
            el.classList.add('in-fs');
            mascot.classList.add('roar');
            UI.confetti(36, [cfg.art, 'coin', 'star']);
            await this.banner(title, sub, 1700);
            let left = n;
            const start = this.total;
            const api = {
              i: 0,
              get left() { return left; },
              add: (k, quiet) => { left += k; rt.chip('fs', label, left); if (!quiet) { rt.msg(`+${k} RODADAS GRÁTIS!`); Sfx.big(); } },
            };
            while (left > 0 && !this.capped && ctx.alive) {
              left--;
              this.chip('fs', label, left);
              this.clear();
              await body(api);
              api.i++;
              await wait(260);
            }
            if (!ctx.alive) { while (left > 0 && !this.capped) { left--; await body(api); api.i++; } }
            this.chip('fs', null);
            el.classList.remove('in-fs');
            mascot.classList.remove('roar');
            this.mode = 'base';
            fsTotal0 = this.total - start;
            this.msg(`Bônus: total ${this.coins(fsTotal0)}`);
            await wait(600);
          },
        };
        render(cfg.make('base', rt));
        msgEl.textContent = cfg.hello;

        function setBusy(b) {
          busy = b;
          spinBtn.disabled = b;
          if (buyBtn) buyBtn.disabled = b;
          stepper.setDisabled(b);
          fsBar.setDisabled(b);
          spinBtn.classList.toggle('go', b);
        }

        async function spin() {
          if (busy) return;
          const free = fsBar.active && Progress.s.fs > 0;
          bet = free ? Progress.FS_BET : stepper.value;
          if (free) Progress.useFreeSpin();
          else if (!Wallet.bet(bet)) { setAuto(false); return; }
          setBusy(true);
          rt.reset();
          rt.clear();
          winEl.textContent = fmt(0);
          rt.msg(free ? '🎁 Rodada grátis!' : 'Girando...');
          try { await game.spin(rt); } catch (e) { console.error(e); }
          const pay = round2(Math.min(rt.total * K, cfg.maxWin) * bet);
          if (!pay && ctx.alive) rt.msg('Não foi dessa vez...');
          finish(free ? 0 : bet, pay, bet);
        }

        async function buy() {
          if (busy || !buyX) return;
          bet = stepper.value;
          const price = round2(bet * buyX);
          if (!confirm(`Comprar o bônus por 🪙 ${fmt(price)}?`)) return;
          if (!Wallet.bet(price)) return;
          setAuto(false);
          setBusy(true);
          rt.reset();
          rt.clear();
          winEl.textContent = fmt(0);
          try { await game.bonus(rt, { buy: true }); } catch (e) { console.error(e); }
          const pay = round2(Math.min(rt.total * K, cfg.maxWin) * bet);
          finish(price, pay, price, { buy: true });
        }

        function finish(stake, pay, base, extra) {
          if (pay > 0) {
            Wallet.win(pay);
            winEl.textContent = fmt(pay);
            if (ctx.alive) UI.result(pay, base);
          } else if (ctx.alive) Sfx.lose();
          ctx.round(stake, pay, base, extra);
          setBusy(false);
          fsBar.render();
          if (ctx.alive && (auto || (fsBar.active && Progress.s.fs > 0))) {
            (async () => {
              await ctx.sleep(pay > 0 ? 900 : (turbo ? 200 : 450));
              while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300);
              if (ctx.alive && !busy && (auto || (fsBar.active && Progress.s.fs > 0))) spin();
            })();
          }
        }

        spinBtn.addEventListener('click', spin);
        if (buyBtn) buyBtn.addEventListener('click', buy);
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

  /* ---------------- utilidades de configuração ---------------- */
  /** Símbolo pagante: S('cao', 'dog', 'Cão', [3, 4, 5...], peso) */
  const S = (id, img, name, pays, w = 1, extra = {}) => ({ id, img, name, pays, w, ...extra });
  /** Tabela de pagamento para o painel a partir dos símbolos. */
  const table = (title, head, syms, note = '') => ({ title, note, head, rows: syms.map(s => ({ img: s.img, name: s.name, badge: s.badge, pays: s.pays })) });
  /** "3 rolos", "4 rolos"... */
  const heads = (from, n, suffix = '') => Array.from({ length: n }, (_, i) => `${from + i}${suffix}`);

  /** Linhas 5×3 (20) e 5×4 (25): da esquerda para a direita. */
  const LINES_5x3 = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 2, 1, 0, 1],
    [1, 0, 1, 2, 1], [0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 2, 2, 0],
    [2, 0, 0, 0, 2], [0, 2, 0, 2, 0], [2, 0, 2, 0, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1]];
  const LINES_5x5 = [[2, 2, 2, 2, 2], [1, 1, 1, 1, 1], [3, 3, 3, 3, 3], [0, 0, 0, 0, 0], [4, 4, 4, 4, 4], [0, 1, 2, 3, 4], [4, 3, 2, 1, 0], [1, 2, 3, 2, 1], [3, 2, 1, 2, 3], [0, 1, 0, 1, 0],
    [4, 3, 4, 3, 4], [2, 1, 2, 3, 2], [2, 3, 2, 1, 2], [1, 0, 1, 2, 1], [3, 4, 3, 2, 3]];

  /** Linhas para grades mais altas: repete os desenhos 5×3 em cada faixa de 3 linhas. */
  const linesFor = (rows, n) => {
    const out = [];
    for (let off = 0; off + 3 <= rows; off++) LINES_5x3.forEach(L => out.push(L.map(r => r + off)));
    const seen = new Set();
    return out.filter(L => { const k = L.join(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, n);
  };

  return {
    create, simRT, linesFor, stack, key, unkey, makeGrid, cells, count, clone, pool, cascade,
    ways, lines, clusters, anywhere, payClusters, describe, holdSpin, short, pay, tumble, scatters,
    S, table, heads, LINES_5x3, LINES_5x5,
  };
})();
