'use strict';

/* =========================================================
   Slots de linhas 5×3 (10 linhas, da esquerda para a direita):
   - Zeus x Hades: coringas com multiplicador (somam na linha);
     nas rodadas grátis o jogador escolhe Zeus (coringas
     frequentes, x2–x5) ou Hades (coringas raros, x5–x50)
   - Livro de Anúbis: o livro é coringa e scatter; nas rodadas
     grátis um símbolo especial expande no rolo inteiro e paga
     em todas as linhas
   Parâmetros calibrados por simulação (~800 mil giros cada).
   ========================================================= */
(function () {
  const REELS = 5, ROWS = 3;
  const LINES = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 2, 1, 0, 1]];
  const xs = v => String(v).replace('.', ',') + 'x';

  function createLineSlot(cfg) {
    const K = cfg.payK / 10; // tabela base em "aposta por linha" → × aposta total
    const symbols = cfg.symbols.map(s => ({ ...s, pays: s.pays.map(p => round2(p * K)) }));
    const wild = cfg.wild, scatter = cfg.scatter;
    const book = wild === scatter;

    /** Sorteio por rolo e modo ('base', 'zeus', 'hades', 'fs'). */
    const pools = {};
    const pool = (reel, mode) => {
      const key = reel + mode;
      if (pools[key]) return pools[key];
      const m = cfg.modes[mode];
      const list = symbols.map(s => ({ s, w: s.w }));
      if (!book) {
        if (!wild.reels || wild.reels.includes(reel)) list.push({ s: wild, w: m.wildW });
        if (m.scatterW) list.push({ s: scatter, w: m.scatterW });
      } else {
        list.push({ s: wild, w: m.wildW });
      }
      return (pools[key] = list);
    };
    const draw = (reel, mode) => {
      const s = RNG.weighted(pool(reel, mode)).s;
      if (s.wild && cfg.modes[mode].mults) return { ...s, mult: RNG.weighted(cfg.modes[mode].mults).m };
      return s;
    };
    const makeGrid = mode => Array.from({ length: REELS }, (_, r) => Array.from({ length: ROWS }, () => draw(r, mode)));

    /** Linhas: { total (× aposta), cells }. Coringas multiplicadores somam. */
    function evalLines(grid) {
      let total = 0;
      const cells = new Set();
      for (const L of LINES) {
        const line = L.map((row, r) => grid[r][row]);
        const base = line.find(c => !c.wild);
        if (!base || base.scatter) continue;
        let n = 0;
        while (n < REELS && (line[n].wild || line[n].id === base.id)) n++;
        if (n < 3) continue;
        const m = line.slice(0, n).reduce((s, c) => s + (c.mult || 0), 0) || 1;
        total += base.pays[n - 3] * m;
        for (let r = 0; r < n; r++) cells.add(`${r}:${L[r]}`);
      }
      return { total: round2(total), cells };
    }
    const countScatter = grid => grid.flat().filter(c => c.scatter).length;

    const paysTable = {
      title: 'Pagamento por linha', note: 'Iguais seguidos a partir do 1º rolo. Linhas diferentes se somam.',
      head: ['3', '4', '5'],
      rows: symbols.map(s => ({ img: s.img, name: s.name, pays: s.pays })),
    };
    const scatterTable = {
      title: `${scatter.name} (scatter)`, note: `Paga em qualquer posição. 3 ou mais abrem as rodadas grátis.`,
      head: ['3', '4', '5'],
      rows: [{ img: scatter.img, name: scatter.name, badge: book ? 'CORINGA + SCATTER' : 'SCATTER', pays: [cfg.scatterPay[3], cfg.scatterPay[4], cfg.scatterPay[5]] }],
    };

    return {
      id: cfg.id, name: cfg.name, art: cfg.art, category: 'slots', tag: cfg.tag, colors: cfg.colors,
      sprites: [...symbols.map(s => s.img), wild.img, scatter.img, ...(cfg.extraSprites || [])],
      rules: `<p>${cfg.intro}</p>${cfg.how}${cfg.features}<p class="muted small">RTP teórico aproximado: ${cfg.rtp}. Atalho: barra de espaço gira.</p>`,
      info: {
        maxWin: cfg.maxWin, vol: cfg.vol, rtp: cfg.rtp, hit: cfg.hit, highlights: cfg.highlights,
        how: cfg.how, features: cfg.features + `<p>💰 <b>Comprar bônus:</b> ${cfg.fsCount} rodadas grátis por <b>${cfg.buyX}x</b> a aposta (retorno médio da compra ~94%).</p>
          <p class="muted small">Prêmio máximo: ${fmt(cfg.maxWin).replace(',00', '')}x a aposta — ao atingir, a rodada termina.</p>`,
        tables: [paysTable, scatterTable, ...(cfg.extraTables ? cfg.extraTables(symbols) : [])],
        lines: { cols: 5, rows: 3, list: LINES.map(L => L.map((row, r) => `${r}:${row}`)), text: 'As 10 linhas ficam ativas em todo giro. O ganho conta a partir do rolo da esquerda.' },
      },

      mount(root, ctx) {
        const el = h(`
          <div class="pesca lslot lslot-${cfg.id}">
            <div class="slot-banner">
              <img class="slot-mascot" src="${IMG(cfg.mascot)}" alt="">
              <div class="slot-msg">${cfg.hello}</div>
              <div class="scat-fs hidden"><small>GRÁTIS</small><b>0</b></div>
              <div class="scat-acc ls-special hidden"><small>ESPECIAL</small><img alt=""></div>
            </div>
            <div class="pesca-frame"><div class="pesca-grid"></div><div class="scat-banner hidden"></div></div>
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
            <button class="btn btn-buy buy">💰 Comprar bônus</button>
          </div>`);
        root.append(el);

        const gridEl = $('.pesca-grid', el), msgEl = $('.slot-msg', el), winEl = $('.slot-winbar b', el);
        const fsEl = $('.scat-fs', el), specEl = $('.ls-special', el), banner = $('.scat-banner', el);
        const spinBtn = $('.spin-btn', el), buyBtn = $('.buy', el), mascot = $('.slot-mascot', el);
        const stepper = UI.betStepper([0.2, 0.5, 1, 2, 3, 5, 10, 20, 50, 100, 200], 3);
        $('.slot-bet', el).append(stepper.el);
        ctx.bet = () => stepper.value;
        SlotInfo.attach(el, ctx);
        const fsBar = freeSpinBar(ctx, on => { spinBtn.classList.toggle('free', on); if (on && !busy) spin(); });
        $('.fs-slot', el).append(fsBar.el);
        const renderBuy = () => { buyBtn.innerHTML = `💰 Comprar bônus <b>🪙 ${fmt(stepper.value * cfg.buyX)}</b>`; };
        stepper.el.addEventListener('click', renderBuy);
        renderBuy();

        const cells = Array.from({ length: REELS }, () => []);
        for (let row = 0; row < ROWS; row++) {
          for (let r = 0; r < REELS; r++) {
            const c = h('<div class="pcell"><img alt="" draggable="false"><b class="val"></b></div>');
            gridEl.append(c);
            cells[r][row] = c;
          }
        }
        const allCells = () => cells.flat();
        let bet = stepper.value, busy = false, auto = false;
        const setCell = (r, row, s) => {
          const c = cells[r][row], img = c.firstChild;
          if (img.dataset.s !== s.img) { img.src = IMG(s.img); img.dataset.s = s.img; }
          c.classList.toggle('wild', !!s.wild);
          c.classList.toggle('scatter', !!s.scatter);
          c.lastChild.textContent = s.mult > 1 ? 'x' + s.mult : '';
        };
        for (let r = 0; r < REELS; r++) for (let row = 0; row < ROWS; row++) setCell(r, row, draw(r, 'base'));

        const msg = t => { msgEl.textContent = t; };
        const setAuto = v => { auto = v; $('[data-t="auto"]', el).classList.toggle('on', v); };
        const wait = ms => ctx.sleep(ms * Speed.f);
        const clearMarks = () => allCells().forEach(c => c.classList.remove('win', 'dim', 'hook', 'expand'));

        async function animate(final, mode) {
          const timers = [];
          for (let r = 0; r < REELS; r++) {
            cells[r].forEach(c => c.classList.add('spinning'));
            timers[r] = ctx.interval(() => { for (let row = 0; row < ROWS; row++) setCell(r, row, draw(r, mode)); }, 70);
          }
          let scat = 0;
          for (let r = 0; r < REELS; r++) {
            const tease = mode === 'base' && scat >= 2;
            if (tease) cells[r].forEach(c => c.classList.add('tease'));
            await wait(r === 0 ? 450 : tease ? 900 : 200);
            ctx.clear(timers[r]);
            for (let row = 0; row < ROWS; row++) {
              const c = cells[r][row];
              setCell(r, row, final[r][row]);
              c.classList.remove('spinning', 'tease', 'land');
              void c.offsetWidth;
              c.classList.add('land');
              if (final[r][row].scatter) scat++;
            }
            Sfx.reel();
          }
        }

        function showLines(res) {
          if (!res.cells.size) return;
          allCells().forEach(c => c.classList.add('dim'));
          res.cells.forEach(k => { const [r, row] = k.split(':'); cells[r][row].classList.remove('dim'); cells[r][row].classList.add('win'); });
        }

        function setBusy(b) {
          busy = b;
          spinBtn.disabled = b;
          buyBtn.disabled = b;
          stepper.setDisabled(b);
          fsBar.setDisabled(b);
          spinBtn.classList.toggle('go', b);
        }

        /** Zeus x Hades: o jogador escolhe o deus das rodadas grátis. */
        function chooseGod() {
          return new Promise(res => {
            banner.innerHTML = `<b>ESCOLHA SEU DEUS</b>
              <div class="god-pick">${cfg.gods.map(g => `
                <button class="god god-${g.id}" data-g="${g.id}">${ico(g.img)}<strong>${g.name}</strong><small>${g.desc}</small></button>`).join('')}</div>`;
            banner.classList.remove('hidden');
            let done = false;
            const pick = id => {
              if (done) return;
              done = true;
              banner.classList.add('hidden');
              res(id);
            };
            banner.addEventListener('click', e => { const g = e.target.closest('[data-g]'); if (g) { Sfx.click(); pick(g.dataset.g); } });
            ctx.onUnmount(() => pick(cfg.gods[0].id));
          });
        }

        /** Anúbis: sorteia o símbolo especial com uma roleta de símbolos. */
        async function revealSpecial() {
          const special = RNG.pick(symbols);
          banner.innerHTML = `<b>SÍMBOLO ESPECIAL</b><img class="ls-reveal" src="${IMG(symbols[0].img)}" alt="">`;
          banner.classList.remove('hidden');
          const img = $('.ls-reveal', banner);
          for (let i = 0; i < 14; i++) { img.src = IMG(symbols[i % symbols.length].img); Sfx.tick(); await ctx.sleep(70 + i * 12); }
          img.src = IMG(special.img);
          img.classList.add('pop');
          Sfx.big();
          await ctx.sleep(1100);
          banner.classList.add('hidden');
          return special;
        }

        /** Rodadas grátis. Retorna o total ganho. */
        async function freeSpins(count) {
          let left = count, total = 0, mode = 'fs', special = null;
          const cap = round2(cfg.maxWin * bet);
          el.classList.add('in-fs');
          mascot.classList.add('roar');
          banner.innerHTML = `<b>RODADAS GRÁTIS!</b><span>${count} giros</span>`;
          banner.classList.remove('hidden');
          Sfx.big();
          UI.confetti(40, [scatter.img, 'coin', 'star']);
          await ctx.sleep(1500);
          banner.classList.add('hidden');
          if (cfg.gods) {
            msg('Escolha o deus das suas rodadas grátis!');
            mode = await chooseGod();
            const g = cfg.gods.find(x => x.id === mode);
            mascot.src = IMG(g.img);
            el.dataset.god = mode;
            msg(`${g.name} está com você! ⚡`);
            await wait(700);
          }
          if (book) {
            special = await revealSpecial();
            $('img', specEl).src = IMG(special.img);
            specEl.classList.remove('hidden');
          }
          fsEl.classList.remove('hidden');
          while (left > 0) {
            left--;
            $('b', fsEl).textContent = left;
            clearMarks();
            const grid = makeGrid(mode);
            await animate(grid, mode);
            const lines = evalLines(grid);
            let w = round2(lines.total * bet);
            if (w > 0) { showLines(lines); Sfx.win(); msg(`Linhas: 🪙 ${fmt(w)}`); }
            if (special) {
              const reels = [0, 1, 2, 3, 4].filter(r => grid[r].some(c => c.id === special.id));
              if (reels.length >= 3) {
                await wait(w > 0 ? 700 : 300);
                const ex = round2(special.pays[reels.length - 3] * LINES.length * bet);
                clearMarks();
                reels.forEach(r => { for (let row = 0; row < ROWS; row++) { setCell(r, row, special); cells[r][row].classList.add('expand'); } });
                msg(`${special.name} expandiu em ${reels.length} rolos! 🪙 ${fmt(ex)}`);
                Sfx.big();
                w = round2(w + ex);
                await wait(1300);
              }
            }
            const sc = countScatter(grid);
            w = round2(w + (cfg.scatterPay[Math.min(5, sc)] || 0) * bet);
            total = round2(total + w);
            winEl.textContent = fmt(total);
            if (total >= cap) {
              total = cap;
              winEl.textContent = fmt(total);
              msg('PRÊMIO MÁXIMO! 🏆');
              Sfx.big();
              await wait(1200);
              break;
            }
            if (sc >= 3) {
              left += cfg.retrigger;
              msg(`+${cfg.retrigger} RODADAS GRÁTIS!`);
              Sfx.big();
              await wait(1000);
            }
            if (!w) msg(`Rodadas grátis: ${left} restante${left === 1 ? '' : 's'}`);
            await wait(w > 0 ? 600 : 250);
          }
          el.classList.remove('in-fs');
          mascot.classList.remove('roar');
          mascot.src = IMG(cfg.mascot);
          delete el.dataset.god;
          fsEl.classList.add('hidden');
          specEl.classList.add('hidden');
          msg(`Rodadas grátis: total 🪙 ${fmt(total)}`);
          return total;
        }

        async function spin() {
          if (busy) return;
          const free = fsBar.active && Progress.s.fs > 0;
          bet = free ? Progress.FS_BET : stepper.value;
          if (free) Progress.useFreeSpin();
          else if (!Wallet.bet(bet)) { setAuto(false); return; }
          setBusy(true);
          clearMarks();
          winEl.textContent = fmt(0);
          msg(free ? '🎁 Rodada grátis!' : 'Girando...');

          const grid = makeGrid('base');
          await animate(grid, 'base');
          const lines = evalLines(grid);
          const sc = Math.min(5, countScatter(grid));
          let pay = round2(lines.total * bet + (cfg.scatterPay[sc] || 0) * bet);
          if (lines.total > 0) {
            showLines(lines);
            const mult = grid.flat().some(c => c.mult > 1);
            msg(`Ganhou 🪙 ${fmt(lines.total * bet)} nas linhas!${mult ? ' ⚡ multiplicador!' : ''}`);
          }
          if (sc >= 3) {
            allCells().forEach(c => { if (c.classList.contains('scatter')) { c.classList.remove('dim'); c.classList.add('win'); } });
            msg(`${sc} ${scatter.name.toLowerCase()}s! 🪙 ${fmt(cfg.scatterPay[sc] * bet)} + rodadas grátis`);
            winEl.textContent = fmt(pay);
            await wait(1300);
            pay = round2(pay + await freeSpins(cfg.fsCount));
          } else if (pay === 0) {
            msg('Não foi dessa vez...');
          }
          finish(free ? 0 : bet, Math.min(pay, round2(cfg.maxWin * bet)), bet);
        }

        async function buy() {
          if (busy) return;
          bet = stepper.value;
          const price = round2(bet * cfg.buyX);
          if (!confirm(`Comprar ${cfg.fsCount} rodadas grátis por 🪙 ${fmt(price)}?`)) return;
          if (!Wallet.bet(price)) return;
          setAuto(false);
          setBusy(true);
          clearMarks();
          winEl.textContent = fmt(0);
          const grid = Array.from({ length: REELS }, (_, r) => Array.from({ length: ROWS }, () => { let s; do s = draw(r, 'base'); while (s.scatter); return s; }));
          RNG.shuffle([0, 1, 2, 3, 4]).slice(0, 3).forEach(r => { grid[r][RNG.int(0, ROWS - 1)] = scatter; });
          await animate(grid, 'base');
          allCells().forEach(c => { if (c.classList.contains('scatter')) c.classList.add('win'); });
          await wait(1100);
          const total = await freeSpins(cfg.fsCount);
          finish(price, total, price, { buy: true });
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
              await ctx.sleep(pay > 0 ? 1000 : (Speed.pick(220, 500)));
              while (ctx.alive && $('.bigwin, .ad-backdrop')) await ctx.sleep(300);
              if (ctx.alive && !busy && (auto || (fsBar.active && Progress.s.fs > 0))) spin();
            })();
          }
        }

        spinBtn.addEventListener('click', spin);
        buyBtn.addEventListener('click', buy);
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

  /* ---------------- Zeus x Hades ---------------- */
  const ZEUS = { id: 'zeus', img: 'zeus', name: 'Zeus', wild: true, reels: [1, 2, 3] };
  const TRIDENT = { id: 'tridente', img: 'trident', name: 'Tridente', scatter: true };
  // calibrado: ~96,5% com Zeus ou Hades (rodadas grátis ≈ 78x a aposta, 1 a cada ~170 giros)
  const ZH = {
    payK: 1.5, buyX: 84,
    base: { wildW: 1.2, scatterW: 1.2, mults: [{ m: 1, w: 70 }, { m: 2, w: 20 }, { m: 3, w: 7 }, { m: 5, w: 3 }] },
    zeus: { wildW: 9, scatterW: 0.9, mults: [{ m: 2, w: 50 }, { m: 3, w: 30 }, { m: 5, w: 20 }] },
    hades: { wildW: 3.5, scatterW: 0.9, mults: [{ m: 5, w: 50 }, { m: 10, w: 30 }, { m: 25, w: 15 }, { m: 50, w: 5 }] },
  };
  const multTable = list => {
    const tot = list.reduce((s, x) => s + x.w, 0);
    return list.map(x => `x${x.m} (${Math.round((x.w / tot) * 100)}%)`).join(' · ');
  };
  App.register(createLineSlot({
    id: 'zeushades', name: 'Zeus x Hades', art: 'zeus', mascot: 'zeus', extraSprites: ['skull'],
    tag: 'Escolha seu deus · coringas até x50', colors: ['#2563eb', '#b91c1c'],
    rtp: '~96,5%', vol: 4, hit: '~1 em 4 giros (26%)', maxWin: 10000,
    intro: 'Inspirado no "Zeus vs Hades".',
    hello: 'Coringas de Zeus multiplicam as linhas!',
    payK: ZH.payK, buyX: ZH.buyX, fsCount: 10, retrigger: 5,
    scatterPay: { 3: 2, 4: 10, 5: 50 },
    wild: ZEUS, scatter: TRIDENT,
    modes: { base: ZH.base, zeus: ZH.zeus, hades: ZH.hades },
    gods: [
      { id: 'zeus', img: 'zeus', name: 'Zeus', desc: 'Coringas frequentes<br>x2 a x5' },
      { id: 'hades', img: 'skull', name: 'Hades', desc: 'Coringas raros<br>x5 a x50' },
    ],
    symbols: [
      { id: 'coroa', img: 'crown', name: 'Coroa', w: 3, pays: [20, 100, 500] },
      { id: 'elmo', img: 'helmet', name: 'Elmo', w: 4, pays: [15, 60, 250] },
      { id: 'espadas', img: 'swords', name: 'Espadas', w: 5, pays: [10, 40, 150] },
      { id: 'escudo', img: 'shield', name: 'Escudo', w: 6, pays: [8, 30, 100] },
      { id: 'anfora', img: 'amphora', name: 'Ânfora', w: 8, pays: [5, 20, 75] },
      { id: 'anel', img: 'ring', name: 'Anel', w: 9, pays: [3, 10, 40] },
      { id: 'moeda', img: 'coin', name: 'Moeda', w: 10, pays: [2, 8, 30] },
    ],
    highlights: [
      '⚡ Coringas de Zeus (rolos 2 a 4) trazem <b>multiplicadores que se somam</b> na linha',
      '🔱 3+ tridentes (≈1 em 170 giros) = <b>10 rodadas grátis</b> e você <b>escolhe o deus</b>',
      '☠️ Hades: coringas raros mas com <b>x5 a x50</b>',
      'Prêmio máximo: <b>10.000x</b>',
    ],
    how: `<p>Grade <b>5×3</b> com <b>10 linhas</b>. Junte <b>3, 4 ou 5 iguais seguidos a partir do rolo da esquerda</b>.</p>
      <p>${ico('zeus')} <b>Zeus</b> é o coringa (só nos rolos 2, 3 e 4) e pode trazer um <b>multiplicador</b>. Se vários coringas com multiplicador estiverem na mesma linha, os valores <b>se somam</b> (ex.: x2 + x3 = x5).</p>
      <p>${ico('trident')} <b>Tridente</b> é o scatter: paga em qualquer lugar e 3+ abrem as rodadas grátis.</p>`,
    features: `<p>${ico('trident')} <b>Rodadas grátis:</b> 3+ tridentes dão <b>10 rodadas</b>; durante elas, 3+ tridentes dão <b>+5</b>.</p>
      <p><b>Antes de começar, você escolhe o deus:</b></p>
      <ul class="si-list">
        <li>${ico('zeus')} <b>Zeus</b> — coringas frequentes: ${multTable(ZH.zeus.mults)}</li>
        <li>${ico('skull')} <b>Hades</b> — coringas raros, porém enormes: ${multTable(ZH.hades.mults)}</li>
      </ul>
      <p class="muted small">Os dois têm o mesmo retorno médio; Hades é mais arriscado. No jogo base os coringas vêm com ${multTable(ZH.base.mults)}.</p>`,
  }));

  /* ---------------- Livro de Anúbis ---------------- */
  const BOOK = { id: 'livro', img: 'book', name: 'Livro', wild: true, scatter: true };
  // calibrado: ~96% (rodadas grátis ≈ 51x a aposta, 1 a cada ~150 giros)
  const AN = { payK: 1.84, buyX: 57, base: { wildW: 1.3 }, fs: { wildW: 1.3 } };
  App.register(createLineSlot({
    id: 'anubis', name: 'Livro de Anúbis', art: 'book', mascot: 'wolf',
    tag: 'Símbolo especial expande · até 5.000x', colors: ['#ca8a04', '#1e3a8a'],
    rtp: '~96%', vol: 4, hit: '~1 em 4,5 giros (22%)', maxWin: 5000,
    intro: 'Inspirado nos slots de "livro" do Egito, como o Book of Dead.',
    hello: '3 livros abrem as rodadas grátis!',
    payK: AN.payK, buyX: AN.buyX, fsCount: 10, retrigger: 10,
    scatterPay: { 3: 2, 4: 20, 5: 200 },
    wild: BOOK, scatter: BOOK,
    modes: { base: AN.base, fs: AN.fs },
    symbols: [
      { id: 'anubis', img: 'wolf', name: 'Anúbis', w: 2, pays: [50, 250, 1000] },
      { id: 'serpente', img: 'snake', name: 'Serpente', w: 3, pays: [30, 120, 500] },
      { id: 'escorpiao', img: 'scorpion', name: 'Escorpião', w: 4, pays: [20, 80, 300] },
      { id: 'bastet', img: 'cat', name: 'Gata Bastet', w: 4, pays: [15, 60, 200] },
      { id: 'escaravelho', img: 'beetle', name: 'Escaravelho', w: 5, pays: [10, 40, 150] },
      { id: 'espadas', img: 'spade', name: 'Espadas', w: 7, pays: [5, 20, 100] },
      { id: 'copas', img: 'heartsuit', name: 'Copas', w: 7, pays: [5, 20, 100] },
      { id: 'ouros', img: 'diamondsuit', name: 'Ouros', w: 8, pays: [4, 15, 75] },
      { id: 'paus', img: 'clubsuit', name: 'Paus', w: 8, pays: [4, 15, 75] },
    ],
    extraTables: syms => [{
      title: 'Símbolo especial expandido', note: 'Nas rodadas grátis, se o símbolo especial aparecer em 3+ rolos (em qualquer posição), ele cobre os rolos inteiros e paga em todas as 10 linhas.',
      head: ['3 rolos', '4 rolos', '5 rolos'],
      rows: syms.map(s => ({ img: s.img, name: s.name, pays: s.pays.map(p => round2(p * 10)) })),
    }],
    highlights: [
      '📕 O <b>livro é coringa e scatter</b> ao mesmo tempo',
      '3+ livros (≈1 em 150 giros) = <b>10 rodadas grátis</b> com um <b>símbolo especial</b> sorteado',
      'O especial <b>expande no rolo inteiro</b> e paga em todas as linhas, mesmo sem estar seguido',
      'Prêmio máximo: <b>5.000x</b>',
    ],
    how: `<p>Grade <b>5×3</b> com <b>10 linhas</b>. Junte <b>3, 4 ou 5 iguais seguidos a partir do rolo da esquerda</b>.</p>
      <p>${ico('book')} O <b>Livro</b> é coringa (substitui qualquer símbolo) e também scatter: paga em qualquer posição e 3+ abrem as rodadas grátis.</p>`,
    features: `<p>${ico('book')} <b>Rodadas grátis:</b> 3+ livros dão <b>10 rodadas</b>. Antes de começar, um <b>símbolo especial</b> é sorteado.</p>
      <p>Em cada giro grátis, se o especial aparecer em <b>3 ou mais rolos</b> (em qualquer posição, não precisa ser seguido), ele <b>expande</b> e cobre esses rolos inteiros, pagando em <b>todas as 10 linhas</b> — além dos ganhos normais. Veja a tabela "Símbolo especial expandido".</p>
      <p>3+ livros durante as rodadas grátis dão <b>+10 rodadas</b>.</p>`,
  }));
})();
