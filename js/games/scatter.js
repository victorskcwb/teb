'use strict';

/* =========================================================
   Slots "scatter pays" 6×5 com cascata (estilo Sweet Bonanza /
   Gates of Olympus / Starlight Princess / Fire Portals):
   - 8+ símbolos iguais em QUALQUER lugar pagam
   - símbolos vencedores somem e novos caem (cascata)
   - 4+ scatters = 10 rodadas grátis (3+ durante elas = +5)
   - orbes de multiplicador somam e multiplicam o ganho da sequência
   - portais (Portais de Fogo) transformam casas num mesmo símbolo;
     nas rodadas grátis cada portal soma +1 ao multiplicador de fogo
   Parâmetros calibrados por simulação (1,6M giros).
   ========================================================= */
(function () {
  const COLS = 6, ROWS = 5;
  const tier = c => (c >= 12 ? 2 : c >= 10 ? 1 : c >= 8 ? 0 : -1);
  const SCATTER_PAY = { 4: 3, 5: 5, 6: 100 };

  function createScatterSlot(cfg) {
    const all = [...cfg.symbols, cfg.scatter];
    return {
      id: cfg.id, name: cfg.name, art: cfg.art, category: 'slots', tag: cfg.tag, colors: cfg.colors,
      sprites: [...all.map(s => s.img), cfg.orbImg, cfg.portal?.img].filter(Boolean),
      rules: `
        <p>${cfg.intro}</p>
        <p>Grade <b>6×5</b> sem linhas: <b>8 ou mais</b> símbolos iguais em qualquer posição pagam. Os símbolos vencedores explodem e novos caem no lugar (<b>cascata</b>), podendo gerar novos ganhos na mesma rodada.</p>
        <p>${ico(cfg.scatter.img)} <b>Scatter:</b> 4, 5 ou 6 pagam 3x, 5x ou 100x a aposta e dão <b>${cfg.fsCount} rodadas grátis</b>. Durante as rodadas grátis, 3+ scatters dão <b>+5 rodadas</b>.</p>
        ${cfg.orbRules}
        <p>💰 <b>Comprar bônus:</b> entra direto nas rodadas grátis por ${cfg.buyX}x a aposta (retorno médio da compra ~94%).</p>
        <h4>Tabela (× aposta total)</h4>
        <table class="paytable"><tr><td></td><td>8–9</td><td>10–11</td><td>12+</td></tr>
        ${cfg.symbols.map(s => `<tr><td class="pt-sym">${ico(s.img)} ${s.name}</td>${s.pays.map(p => `<td><b>${fmt(p)}x</b></td>`).join('')}</tr>`).join('')}</table>
        <p class="muted small">RTP teórico aproximado: ${cfg.rtp}. Atalho: barra de espaço gira.</p>`,
      info: {
        maxWin: cfg.maxWin, vol: cfg.vol, rtp: cfg.rtp, hit: cfg.hit, highlights: cfg.highlights,
        how: `<p>Grade <b>6×5 sem linhas</b>: junte <b>8 ou mais</b> símbolos iguais em <b>qualquer posição</b>. Quanto mais iguais, mais paga.</p>
          <p>Os símbolos vencedores explodem e novos caem no lugar (<b>cascata</b>) — um único giro pode pagar várias vezes.</p>
          <p>${ico(cfg.scatter.img)} <b>${cfg.scatter.name}</b> é o scatter: 4+ abrem as rodadas grátis.</p>`,
        tables: [
          {
            title: 'Pagamento por quantidade', note: 'Paga o maior grupo de cada símbolo. Grupos de símbolos diferentes se somam.',
            head: ['8–9', '10–11', '12+'],
            rows: cfg.symbols.map(s => ({ img: s.img, name: s.name, pays: s.pays })),
          },
          {
            title: `${cfg.scatter.name} (scatter)`, note: `Além do prêmio, 4+ dão ${cfg.fsCount} rodadas grátis.`,
            head: ['4', '5', '6+'],
            rows: [{ img: cfg.scatter.img, name: cfg.scatter.name, badge: 'SCATTER', pays: [SCATTER_PAY[4], SCATTER_PAY[5], SCATTER_PAY[6]] }],
          },
        ],
        features: `
          <p>${ico(cfg.scatter.img)} <b>Rodadas grátis:</b> 4 ou mais ${cfg.scatter.name.toLowerCase()}s dão <b>${cfg.fsCount} rodadas grátis</b> com a mesma aposta. Durante elas, 3+ dão <b>+5 rodadas</b>.</p>
          ${cfg.orbRules}
          ${cfg.orbs ? `<table class="paytable"><tr class="si-head"><td>Multiplicador</td><td>Chance (entre os multiplicadores)</td></tr>${cfg.orbs.map(o => `<tr><td><b>x${o.m}</b></td><td>${Math.round((o.w / cfg.orbs.reduce((s, x) => s + x.w, 0)) * 100)}%</td></tr>`).join('')}</table>` : ''}
          <p>💰 <b>Comprar bônus:</b> entra direto nas rodadas grátis por <b>${cfg.buyX}x</b> a aposta (retorno médio da compra ~94%).</p>
          <p class="muted small">As rodadas grátis aparecem em média 1 a cada ~${cfg.fsEvery} giros. Prêmio máximo: ${fmt(cfg.maxWin).replace(',00', '')}x a aposta — ao atingir, a rodada termina.</p>`,
      },

      mount(root, ctx) {
        const el = h(`
          <div class="scat scat-${cfg.id}">
            <div class="scat-top">
              <img class="scat-mascot" src="${IMG(cfg.mascot)}" alt="">
              <div class="scat-msg">8+ iguais em qualquer lugar pagam!</div>
              <div class="scat-fs hidden"><small>GRÁTIS</small><b>0</b></div>
              <div class="scat-acc hidden"><small>MULT.</small><b>x0</b></div>
            </div>
            <div class="scat-frame"><div class="scat-grid"></div><div class="scat-banner hidden"></div></div>
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

        const gridEl = $('.scat-grid', el), msgEl = $('.scat-msg', el), winEl = $('.slot-winbar b', el);
        const fsEl = $('.scat-fs', el), accEl = $('.scat-acc', el), banner = $('.scat-banner', el);
        const spinBtn = $('.spin-btn', el), buyBtn = $('.buy', el), mascot = $('.scat-mascot', el);
        const stepper = UI.betStepper([0.2, 0.4, 1, 2, 3, 5, 10, 20, 50, 100, 200], 3);
        $('.slot-bet', el).append(stepper.el);
        ctx.bet = () => stepper.value;
        SlotInfo.attach(el, ctx);
        const fsBar = freeSpinBar(ctx, on => { if (on && !busy) spin(); });
        $('.fs-slot', el).append(fsBar.el);
        const renderBuy = () => { buyBtn.innerHTML = `💰 Comprar bônus <b>🪙 ${fmt(stepper.value * cfg.buyX)}</b>`; };
        stepper.el.addEventListener('click', renderBuy);
        renderBuy();

        let busy = false, auto = false;
        const msg = t => { msgEl.textContent = t; };
        const setAuto = v => { auto = v; $('[data-t="auto"]', el).classList.toggle('on', v); };
        const wait = ms => ctx.sleep(ms * Speed.f);

        const newCell = fs => {
          const p = fs ? cfg.orbFS : cfg.orbBase;
          if (p && RNG.float() < p) return { orb: RNG.weighted(cfg.orbs).m, fresh: true };
          if (cfg.portal && RNG.float() < (fs ? cfg.portal.pFS : cfg.portal.pBase)) return { portal: true, fresh: true };
          return { ...RNG.weighted(all), fresh: true };
        };
        let grid = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => ({ ...RNG.weighted(cfg.symbols) })));

        function render(winIds = null) {
          let html = '';
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              const x = grid[c][r];
              const cls = ['sc-cell'];
              if (x.fresh) cls.push('drop');
              if (winIds && winIds.has(x.id)) cls.push('win');
              if (x.id === 'sc') cls.push('scatter');
              if (x.conv) cls.push('conv');
              const delay = x.fresh ? `style="animation-delay:${(Speed.pick(15, 35)) * c + (ROWS - r) * 12}ms"` : '';
              html += x.orb
                ? `<div class="${cls.join(' ')} orb" ${delay}><img src="${IMG(cfg.orbImg)}" alt=""><b>x${x.orb}</b></div>`
                : x.portal
                  ? `<div class="${cls.join(' ')} portal" ${delay}><img src="${IMG(cfg.portal.img)}" alt=""></div>`
                  : `<div class="${cls.join(' ')}" ${delay}><img src="${IMG(x.img)}" alt=""></div>`;
              x.fresh = false;
              x.conv = false;
            }
          }
          gridEl.innerHTML = html;
        }
        render();

        /** Abre os portais da tela: cada um vira um símbolo e transforma outras casas nele. */
        async function openPortals() {
          let n = 0;
          for (let c = 0; c < COLS; c++) {
            for (let r = 0; r < ROWS; r++) {
              if (!grid[c][r].portal) continue;
              n++;
              const s = RNG.pick(cfg.symbols);
              const cand = [];
              for (let cc = 0; cc < COLS; cc++) for (let rr = 0; rr < ROWS; rr++) {
                const x = grid[cc][rr];
                if (x.id && x.id !== 'sc' && !(cc === c && rr === r)) cand.push([cc, rr]);
              }
              const k = RNG.int(cfg.portal.min, cfg.portal.max);
              RNG.shuffle(cand).slice(0, k).forEach(([cc, rr]) => { grid[cc][rr] = { ...s, conv: true }; });
              grid[c][r] = { ...s, conv: true };
              msg(`🌀 Portal! ${Math.min(k, cand.length) + 1} casas viraram ${s.name}`);
            }
          }
          if (n) {
            $$('.portal', gridEl).forEach(x => x.classList.add('open'));
            Sfx.big();
            await wait(650);
            render();
            await wait(700);
          }
          return n;
        }

        /** Um giro completo com cascatas. Retorna { win, scatters, orbSum, portals }. */
        async function playSpin(bet, fs) {
          grid = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => newCell(fs)));
          render();
          Sfx.reel();
          await wait(520);
          let win = 0, portals = 0;
          for (;;) {
            if (cfg.portal) portals += await openPortals();
            const cnt = {};
            grid.flat().forEach(x => { if (x.id && x.id !== 'sc') cnt[x.id] = (cnt[x.id] || 0) + 1; });
            const wins = cfg.symbols.filter(s => cnt[s.id] >= 8);
            if (!wins.length) break;
            const ids = new Set(wins.map(s => s.id));
            const step = round2(wins.reduce((s, w) => s + w.pays[tier(cnt[w.id])], 0) * bet);
            win = round2(win + step);
            render(ids);
            winEl.textContent = fmt(win);
            msg(wins.map(w => `${cnt[w.id]}× ${w.name}`).join(' · ') + ` = 🪙 ${fmt(step)}`);
            Sfx.win();
            await wait(850);
            for (let c = 0; c < COLS; c++) {
              const keep = grid[c].filter(x => !ids.has(x.id));
              grid[c] = [...Array.from({ length: ROWS - keep.length }, () => newCell(fs)), ...keep];
            }
            render();
            Sfx.reel();
            await wait(520);
          }
          const flat = grid.flat();
          const orbSum = flat.reduce((s, x) => s + (x.orb || 0), 0);
          const scatters = flat.filter(x => x.id === 'sc').length;
          return { win, scatters, orbSum, portals };
        }

        function setBusy(b) {
          busy = b;
          spinBtn.disabled = b;
          buyBtn.disabled = b;
          stepper.setDisabled(b);
          fsBar.setDisabled(b);
          spinBtn.classList.toggle('go', b);
        }

        async function applyOrbs(win, orbSum, accum) {
          if (!(win > 0 && orbSum > 0)) return win;
          $$('.orb', gridEl).forEach(o => o.classList.add('fire'));
          const m = accum || orbSum;
          msg(`Multiplicador x${m}! 🪙 ${fmt(win)} → 🪙 ${fmt(win * m)}`);
          Sfx.big();
          await wait(1100);
          return round2(win * m);
        }

        /** Rodadas grátis internas do jogo. Retorna o total ganho. */
        async function freeSpins(bet) {
          let left = cfg.fsCount, total = 0, accum = 0, fire = 1;
          el.classList.add('in-fs');
          mascot.classList.add('roar');
          banner.innerHTML = `<b>RODADAS GRÁTIS!</b><span>${cfg.fsCount} giros${cfg.accumulate ? ' · multiplicadores acumulam' : ''}${cfg.portal ? ' · cada portal soma +1 no multiplicador' : ''}</span>`;
          banner.classList.remove('hidden');
          Sfx.big();
          UI.confetti(40, [cfg.scatter.img, 'star', 'coin']);
          await ctx.sleep(1800);
          banner.classList.add('hidden');
          fsEl.classList.remove('hidden');
          if (cfg.accumulate || cfg.portal) accEl.classList.remove('hidden');
          if (cfg.portal) $('small', accEl).textContent = 'FOGO';
          while (left > 0) {
            left--;
            $('b', fsEl).textContent = left;
            $('b', accEl).textContent = 'x' + (cfg.portal ? fire : accum);
            const r = await playSpin(bet, true);
            let w = r.win;
            if (cfg.portal) {
              fire += r.portals;
              $('b', accEl).textContent = 'x' + fire;
              if (w > 0 && fire > 1) {
                msg(`Multiplicador de fogo x${fire}! 🪙 ${fmt(w)} → 🪙 ${fmt(w * fire)}`);
                Sfx.big();
                await wait(1000);
              }
              w = round2(w * fire);
            } else if (cfg.accumulate) {
              if (w > 0 && r.orbSum > 0) { accum += r.orbSum; $('b', accEl).textContent = 'x' + accum; }
              w = await applyOrbs(w, r.orbSum, accum);
            } else {
              w = await applyOrbs(w, r.orbSum);
            }
            w = round2(w + (SCATTER_PAY[Math.min(6, r.scatters)] || 0) * bet);
            total = round2(total + w);
            winEl.textContent = fmt(total);
            if (total >= cfg.maxWin * bet) {
              total = round2(cfg.maxWin * bet);
              winEl.textContent = fmt(total);
              msg('PRÊMIO MÁXIMO! 🏆');
              Sfx.big();
              await wait(1200);
              break;
            }
            if (r.scatters >= 3) {
              left += 5;
              msg('+5 RODADAS GRÁTIS!');
              Sfx.big();
              await wait(900);
            }
            await wait(w > 0 ? 500 : 250);
          }
          el.classList.remove('in-fs');
          mascot.classList.remove('roar');
          fsEl.classList.add('hidden');
          accEl.classList.add('hidden');
          $('small', accEl).textContent = 'MULT.';
          msg(`Rodadas grátis: total 🪙 ${fmt(total)}`);
          return total;
        }

        async function spin() {
          if (busy) return;
          const free = fsBar.active && Progress.s.fs > 0;
          const bet = free ? Progress.FS_BET : stepper.value;
          if (free) Progress.useFreeSpin();
          else if (!Wallet.bet(bet)) { setAuto(false); return; }
          setBusy(true);
          winEl.textContent = fmt(0);
          msg(free ? '🎁 Rodada grátis!' : 'Girando...');

          const r = await playSpin(bet, false);
          let pay = await applyOrbs(r.win, r.orbSum);
          const scPay = (SCATTER_PAY[Math.min(6, r.scatters)] || 0) * bet;
          pay = round2(pay + scPay);
          if (r.scatters >= 4) {
            $$('.scatter', gridEl).forEach(x => x.classList.add('win'));
            msg(`${r.scatters} scatters! 🪙 ${fmt(scPay)} + rodadas grátis`);
            await wait(1200);
            pay = round2(pay + await freeSpins(bet));
          } else if (pay === 0) {
            msg('Não foi dessa vez...');
          }
          finish(free ? 0 : bet, Math.min(pay, round2(cfg.maxWin * bet)), bet);
        }

        async function buy() {
          if (busy) return;
          const bet = stepper.value, price = round2(bet * cfg.buyX);
          // confirmação dentro do jogo; o giro automático para antes de perguntar
          setAuto(false);
          if (!(await UI.ask('Comprar bônus', `Comprar as rodadas grátis por 🪙 ${fmt(price)}?`, '💰 Comprar')) || busy) return;
          if (!Wallet.bet(price)) return;
          setAuto(false);
          setBusy(true);
          winEl.textContent = fmt(0);
          // força 4 scatters na tela de entrada
          grid = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => ({ ...RNG.weighted(cfg.symbols), fresh: true })));
          RNG.shuffle([...Array(COLS * ROWS).keys()]).slice(0, 4).forEach(i => { grid[i % COLS][Math.floor(i / COLS)] = { ...cfg.scatter, fresh: true }; });
          render();
          $$('.scatter', gridEl).forEach(x => x.classList.add('win'));
          await wait(1200);
          const total = await freeSpins(bet);
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
              await ctx.sleep(pay > 0 ? 900 : (Speed.pick(200, 450)));
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

  const scale = (rows, k) => rows.map(r => ({ ...r, pays: r.pays.map(p => round2(p * k)) }));
  const BASE = [
    [10, 25, 50], [2.5, 10, 25], [2, 5, 15], [1.5, 2, 12], [1, 1.5, 10], [0.8, 1.2, 8], [0.5, 1, 5], [0.4, 0.9, 4], [0.25, 0.75, 2],
  ];
  const W = [3, 4, 5, 6, 8, 9, 10, 11, 12];
  const ORBS = [{ m: 2, w: 20 }, { m: 3, w: 15 }, { m: 5, w: 12 }, { m: 10, w: 8 }, { m: 25, w: 4 }, { m: 50, w: 2 }, { m: 100, w: 1 }];
  const mk = list => list.map(([id, img, name], i) => ({ id, img, name, w: W[i], pays: BASE[i] }));

  App.register(createScatterSlot({
    id: 'doce', name: 'Doce Bonança', art: 'lollipop', mascot: 'candy',
    tag: 'Cascata · bombas até 100x', colors: ['#ec4899', '#f97316'], rtp: '~97%',
    intro: 'Inspirado no "Sweet Bonanza": doces e frutas caindo em cascata.',
    orbRules: `<p>🌈 <b>Bombas de multiplicador</b> (2x a 100x) só aparecem nas rodadas grátis. Se a sequência de cascatas tiver ganho, todas as bombas na tela <b>se somam</b> e multiplicam o prêmio.</p>`,
    symbols: scale(mk([
      ['heart', 'heart', 'Coração'], ['cupcake', 'cupcake', 'Cupcake'], ['donut', 'doughnut', 'Rosquinha'], ['candy', 'candy', 'Bala'],
      ['apple', 'apple', 'Maçã'], ['cherry', 'plum', 'Cereja'], ['melon', 'watermelon', 'Melancia'], ['grape', 'grapes', 'Uva'], ['banana', 'banana', 'Banana'],
    ]), 2.3),
    scatter: { id: 'sc', img: 'lollipop', name: 'Pirulito', w: 1.25 },
    orbImg: 'rainbow', orbs: ORBS, orbBase: 0, orbFS: 0.048,
    fsCount: 10, buyX: 93, accumulate: false,
    maxWin: 21100, vol: 3, hit: '~1 em 3 giros (33%)', fsEvery: 300,
    highlights: ['🍭 4+ pirulitos = <b>10 rodadas grátis</b>', '🌈 Nas rodadas grátis caem <b>bombas de 2x a 100x</b> que se somam', 'Cascatas: um giro pode pagar várias vezes', 'Prêmio máximo: <b>21.100x</b>'],
  }));

  App.register(createScatterSlot({
    id: 'olimpo', name: 'Portões do Olimpo', art: 'voltage', mascot: 'lightning',
    tag: 'Raios multiplicadores acumulam', colors: ['#4f46e5', '#0ea5e9'], rtp: '~95,5%',
    intro: 'Inspirado no "Gates of Olympus": Zeus solta orbes multiplicadores a qualquer momento.',
    orbRules: `<p>🔮 <b>Orbes de multiplicador</b> (2x a 100x) podem cair em <b>qualquer giro</b>. Se houver ganho, os orbes se somam e multiplicam o prêmio. Nas rodadas grátis os orbes <b>acumulam</b> num multiplicador total que vale para todos os ganhos seguintes!</p>`,
    symbols: scale(mk([
      ['crown', 'crown', 'Coroa'], ['hourglass', 'hourglass', 'Ampulheta'], ['ring', 'ring', 'Anel'], ['trophy', 'trophy', 'Cálice'],
      ['gem', 'gem', 'Rubi'], ['bluegem', 'bluediamond', 'Safira'], ['orangegem', 'orangediamond', 'Topázio'], ['purple', 'purpleheart', 'Ametista'], ['green', 'greenheart', 'Esmeralda'],
    ]), 1.05),
    scatter: { id: 'sc', img: 'voltage', name: 'Raio de Zeus', w: 1.25 },
    orbImg: 'crystal', orbs: ORBS, orbBase: 0.0048, orbFS: 0.03,
    fsCount: 10, buyX: 60, accumulate: true,
    maxWin: 5000, vol: 4, hit: '~1 em 3 giros (32%)', fsEvery: 295,
    highlights: ['⚡ Orbes de <b>2x a 100x</b> podem cair em qualquer giro', 'Nas rodadas grátis os orbes <b>acumulam</b> e valem para todos os ganhos seguintes', '4+ raios = <b>10 rodadas grátis</b>', 'Prêmio máximo: <b>5.000x</b>'],
  }));

  App.register(createScatterSlot({
    id: 'princesa', name: 'Princesa Estelar', art: 'princess', mascot: 'princess',
    tag: 'Estrelas multiplicadoras acumulam', colors: ['#c026d3', '#4338ca'], rtp: '~95,5%',
    intro: 'Inspirado no "Starlight Princess": a princesa lança estrelas multiplicadoras a qualquer momento.',
    orbRules: `<p>🌟 <b>Estrelas multiplicadoras</b> (2x a 100x) podem cair em <b>qualquer giro</b>. Se houver ganho, as estrelas se somam e multiplicam o prêmio. Nas rodadas grátis elas <b>acumulam</b> num multiplicador total que vale para todos os ganhos seguintes!</p>`,
    symbols: scale(mk([
      ['crown', 'crown', 'Coroa'], ['ring', 'ring', 'Anel'], ['moon', 'moon', 'Lua'], ['crystal', 'crystal', 'Bola de cristal'],
      ['heart', 'heart', 'Coração'], ['blue', 'blueheart', 'Coração azul'], ['purple', 'purpleheart', 'Coração roxo'], ['green', 'greenheart', 'Coração verde'], ['yellow', 'yellowheart', 'Coração dourado'],
    ]), 1.05),
    scatter: { id: 'sc', img: 'shootingstar', name: 'Estrela cadente', w: 1.25 },
    orbImg: 'glowstar', orbs: ORBS, orbBase: 0.0048, orbFS: 0.03,
    fsCount: 10, buyX: 65, accumulate: true,
    maxWin: 5000, vol: 4, hit: '~1 em 3 giros (32%)', fsEvery: 295,
    highlights: ['🌟 Estrelas de <b>2x a 100x</b> podem cair em qualquer giro', 'Nas rodadas grátis as estrelas <b>acumulam</b> e valem para todos os ganhos seguintes', '4+ estrelas cadentes = <b>10 rodadas grátis</b>', 'Prêmio máximo: <b>5.000x</b>'],
  }));

  App.register(createScatterSlot({
    id: 'portais', name: 'Portais de Fogo', art: 'cyclone', mascot: 'fire',
    tag: 'Portais transformam a grade', colors: ['#ea580c', '#7e22ce'], rtp: '~95%',
    intro: 'Inspirado no "Fire Portals": portais de fogo transformam casas da grade num mesmo símbolo.',
    orbRules: `<p>🌀 <b>Portais:</b> podem cair em qualquer giro (e nas cascatas). Cada portal vira um símbolo sorteado e transforma de <b>2 a 5 outras casas</b> nesse mesmo símbolo — ótimo para completar 8+.</p>
      <p>🔥 <b>Multiplicador de fogo:</b> nas rodadas grátis os portais são mais frequentes e <b>cada portal soma +1</b> num multiplicador que começa em x1 e vale para todos os ganhos seguintes, até o fim.</p>`,
    symbols: scale(mk([
      ['dragao', 'dragon', 'Dragão'], ['coracao', 'heartfire', 'Coração em chamas'], ['cometa', 'comet', 'Cometa'], ['varinha', 'wand', 'Varinha'],
      ['bola', 'crystal', 'Bola de cristal'], ['rubi', 'gem', 'Rubi'], ['topazio', 'orangediamond', 'Topázio'], ['safira', 'bluediamond', 'Safira'], ['chama', 'fire', 'Chama'],
    ]), 1.5),
    scatter: { id: 'sc', img: 'volcano', name: 'Vulcão', w: 1.25 },
    portal: { img: 'cyclone', pBase: 0.004, pFS: 0.0205, min: 2, max: 5 },
    orbBase: 0, orbFS: 0,
    fsCount: 10, buyX: 107, accumulate: false,
    maxWin: 5000, vol: 4, hit: '~1 em 3 giros (35%)', fsEvery: 285,
    highlights: ['🌀 Portais transformam de <b>2 a 5 casas</b> num mesmo símbolo', '🔥 Nas rodadas grátis cada portal soma <b>+1 no multiplicador</b>, que nunca zera', '🌋 4+ vulcões (≈1 em 285 giros) = <b>10 rodadas grátis</b>', 'Prêmio máximo: <b>5.000x</b>'],
  }));
})();
