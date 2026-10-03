'use strict';

(function () {
  const CATEGORIES = [
    { id: 'slots', title: 'Slots', art: 'slot', desc: 'Caça-níqueis com recursos especiais' },
    { id: 'originais', title: 'Originais', art: 'rocket', desc: 'Crash, Mines, Plinko, Dice e mais' },
    { id: 'mesa', title: 'Mesa & Ao vivo', art: 'cards', desc: 'Roleta, Blackjack, Futebol Studio' },
  ];
  // ranking aproximado dos jogos mais jogados em cassinos online no Brasil
  const POPULAR = ['tigrinho', 'raspadinha', 'crash', 'doce', 'mines', 'olimpo', 'ratinho', 'double', 'futebol', 'roleta', 'plinko', 'dragaozinho', 'blackjack'];
  const BADGE = {
    tigrinho: 'hot', crash: 'hot', mines: 'hot', doce: 'new', olimpo: 'new', ratinho: 'new',
    futebol: 'new', raspadinha: 'new', limbo: 'new', dice: 'new', hilo: 'new', keno: 'new', torre: 'new', double: 'top',
  };
  const BADGE_TXT = { hot: '🔥 HOT', new: 'NOVO', top: 'TOP' };

  const app = $('#app');
  let ctx = null;
  const gameById = id => App.games.find(g => g.id === id);

  /* ---------- Saldo no topo ---------- */
  const balEl = $('#balance-value');
  let shown = null;
  Wallet.onChange(bal => {
    const first = shown === null, up = bal > shown;
    const from = shown;
    shown = bal;
    if (first) { balEl.textContent = fmt(bal); return; }
    // contagem animada do saldo
    const t0 = performance.now(), dur = Math.min(700, 200 + Math.abs(bal - from) / 4);
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      if (shown !== bal) return;
      balEl.textContent = fmt(from + (bal - from) * p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    const box = $('#balance');
    box.classList.remove('up', 'down');
    void box.offsetWidth;
    box.classList.add(up ? 'up' : 'down');
  });

  /* ---------- Nível no topo + badges ---------- */
  const lvlChip = $('#lvl-chip');
  function renderProgressUI() {
    $('.lvl-num', lvlChip).textContent = Progress.level;
    $('.lvl-ring', lvlChip).style.setProperty('--p', Progress.levelPct);
    const pend = Progress.pending();
    const setDot = (sel, n) => { const d = $(sel); if (d) { d.textContent = n > 9 ? '9+' : n; d.classList.toggle('hidden', !n); } };
    setDot('[data-dot="bonus"]', pend.bonus);
    setDot('[data-dot="missoes"]', pend.missions);
    setDot('[data-dot="passe"]', pend.pass);
  }
  Bus.on('progress', renderProgressUI);
  lvlChip.addEventListener('click', () => { location.hash = '#/passe'; });

  /* ---------- Som ---------- */
  Sfx.init();
  const soundBtn = $('#btn-sound');
  const renderSound = () => { soundBtn.textContent = Sfx.muted ? '🔇' : '🔊'; };
  soundBtn.addEventListener('click', () => { Sfx.toggle(); renderSound(); Sfx.click(); });
  renderSound();
  Music.init();
  const musicBtn = $('#btn-music');
  const renderMusic = () => { musicBtn.classList.toggle('off', !Music.on); musicBtn.title = Music.on ? 'Desligar música' : 'Ligar música'; };
  musicBtn.addEventListener('click', () => { Music.toggle(); renderMusic(); Sfx.click(); });
  renderMusic();

  /* ---------- Carteira / estatísticas ---------- */
  function openWallet() {
    const s = Wallet.s;
    const net = round2(s.won - s.wagered);
    const ret = s.wagered > 0 ? (s.won / s.wagered) * 100 : 0;
    const body = h(`
      <div class="wallet">
        <div class="wallet-bal">${ico('coin', 'wb-img')}<small>Saldo fictício</small><b>🪙 ${fmt(s.balance)}</b>
          <a class="vip-chip" href="#/vip" style="--vc:${Progress.vipTier().color}">${ico(Progress.vipTier().art)} VIP ${Progress.vipTier().name}</a></div>
        <div class="stats-grid">
          <div><small>Total apostado</small><b>${fmt(s.wagered)}</b></div>
          <div><small>Total recebido</small><b>${fmt(s.won)}</b></div>
          <div><small>Resultado nos jogos</small><b class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${fmt(net)}</b></div>
          <div><small>Retorno</small><b>${ret.toFixed(1)}%</b></div>
          <div><small>Rodadas</small><b>${s.rounds}</b></div>
          <div><small>Maior prêmio</small><b>${fmt(s.biggest)}</b></div>
          <div><small>Bônus recebidos</small><b>${fmt(s.bonus || 0)}</b></div>
          <div><small>XP total</small><b>${Progress.s.totalXp}</b></div>
        </div>
        <p class="muted small">Todo jogo de cassino tem vantagem da casa: no longo prazo o "Retorno" tende a ficar abaixo de 100%. Aqui é só fichas de mentira — aproveite para ver isso na prática.</p>
        <div class="wallet-actions">
          <button class="btn btn-ad" data-a="ad">${ico('tv')} Assistir anúncio: +🪙 ${fmt(Progress.AD_REWARD)}</button>
          <button class="btn btn-primary" data-a="refill">🎁 Recarregar +${fmt(Wallet.REFILL)}</button>
          <button class="btn btn-ghost" data-a="reset">♻️ Zerar tudo</button>
        </div>
      </div>`);
    const refillBtn = $('[data-a="refill"]', body);
    if (!Wallet.canRefill()) {
      refillBtn.disabled = true;
      refillBtn.textContent = `🎁 Recarga grátis abaixo de ${fmt(Wallet.REFILL_BELOW)}`;
    }
    const adBtn = $('[data-a="ad"]', body);
    if (Progress.adsLeft() <= 0) { adBtn.disabled = true; adBtn.textContent = '📺 Limite de anúncios de hoje atingido'; }
    const m = UI.modal('Carteira', body);
    body.addEventListener('click', async e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'refill' && Wallet.refill()) { Sfx.win(); UI.toast('Fichas recarregadas! 🎁', 'win'); m.close(); }
      if (a === 'reset' && confirm('Zerar saldo e estatísticas?')) { Wallet.reset(); UI.toast('Progresso zerado'); m.close(); }
      if (a === 'ad') {
        m.close();
        Progress.adForCoins();
      }
    });
  }
  $('#balance').addEventListener('click', openWallet);
  App.openWallet = openWallet;

  // Fichas acabaram: oferece anúncio / recarga
  let brokeShown = false;
  Wallet.onChange(bal => {
    if (bal >= 0.5) { brokeShown = false; return; }
    if (brokeShown) return;
    brokeShown = true;
    setTimeout(() => {
      if (Wallet.balance >= 0.5 || $('.modal-backdrop')) return;
      const body = h(`<div class="center"><img class="broke-img" src="${IMG('moneywings')}" alt=""><p>Suas fichas acabaram! Escolha uma opção para continuar jogando:</p>
        <div class="wallet-actions"><button class="btn btn-ad" data-a="ad">${ico('tv')} Assistir anúncio: +🪙 ${fmt(Progress.AD_REWARD)}</button>
        <button class="btn btn-primary" data-a="refill">🎁 Recarga grátis +${fmt(Wallet.REFILL)}</button></div></div>`);
      const m = UI.modal('Sem fichas', body);
      body.addEventListener('click', async e => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'refill' && Wallet.refill()) { Sfx.win(); UI.toast('Fichas recarregadas! 🎁', 'win'); m.close(); }
        if (a === 'ad') {
          m.close();
          Progress.adForCoins();
        }
      });
    }, 1400);
  });

  /* ---------- Lobby ---------- */
  function card(g, big = false) {
    const b = BADGE[g.id];
    return `
      <a class="card ${big ? 'card-big' : ''}" href="#/${g.id}" style="--c1:${g.colors[0]};--c2:${g.colors[1]}">
        <span class="card-glow"></span>
        <img class="card-art" src="${IMG(g.art)}" alt="" loading="lazy" draggable="false">
        ${b ? `<span class="card-badge b-${b}">${BADGE_TXT[b]}</span>` : ''}
        <span class="card-info"><span class="card-name">${g.name}</span><span class="card-tag">${g.tag}</span></span>
        <span class="card-play">▶</span>
      </a>`;
  }

  function promoSlides() {
    const ck = Progress.checkinStatus();
    const slides = [];
    if (ck.canClaim) slides.push({ art: 'gift', c: ['#10b981', '#0e7490'], t: `Bônus diário: Dia ${ck.nextIdx + 1}`, s: `Colete ${rewardText(CHECKIN[ck.nextIdx])} agora!`, cta: 'Coletar', go: 'checkin' });
    slides.push({ art: 'lollipop', c: ['#ec4899', '#f97316'], t: 'NOVO: Doce Bonança', s: 'Cascatas de doces e bombas de até 100x nas rodadas grátis.', cta: 'Jogar', go: '#/doce' });
    slides.push({ art: 'ticket', c: ['#7c3aed', '#db2777'], t: `Passe da Temporada · Nível ${Progress.level}`, s: `Termina em ${fmtDur(Progress.seasonEndsIn())}. Jogue, ganhe XP e libere prêmios!`, cta: 'Ver passe', go: '#/passe' });
    slides.push({ art: 'voltage', c: ['#4f46e5', '#0ea5e9'], t: 'NOVO: Portões do Olimpo', s: 'Multiplicadores de raio que se acumulam nas rodadas grátis.', cta: 'Jogar', go: '#/olimpo' });
    slides.push({ art: 'tv', c: ['#0891b2', '#1e3a8a'], t: 'Ganhe fichas grátis', s: `Assista anúncios e receba 🪙 ${fmt(Progress.AD_REWARD)} cada.`, cta: 'Ganhar', go: '#/bonus' });
    return slides;
  }

  function renderLobby(pctx) {
    const el = h(`
      <section class="lobby">
        <div class="promo">
          <div class="promo-track"></div>
          <div class="promo-dots"></div>
        </div>
        <div class="quick"></div>
        <div class="lobby-recent"></div>
        <div class="cat">
          <div class="cat-head"><h2>${ico('fire')} Mais jogados</h2><span>Os favoritos dos cassinos online</span></div>
          <div class="row-scroll popular"></div>
        </div>
        <div class="filters"></div>
        <div class="all-games"></div>
      </section>`);

    /* carrossel */
    const slides = promoSlides();
    const trackEl = $('.promo-track', el), dotsEl = $('.promo-dots', el);
    trackEl.innerHTML = slides.map(s => `
      <div class="slide" style="--c1:${s.c[0]};--c2:${s.c[1]}">
        <div class="slide-text"><h2>${s.t}</h2><p>${s.s}</p><button class="btn btn-gold" data-go="${s.go}">${s.cta} →</button></div>
        <img class="slide-art" src="${IMG(s.art)}" alt="">
      </div>`).join('');
    dotsEl.innerHTML = slides.map((_, i) => `<button data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('');
    let cur = 0;
    const show = i => {
      cur = (i + slides.length) % slides.length;
      trackEl.style.transform = `translateX(${-cur * 100}%)`;
      $$('button', dotsEl).forEach((d, j) => d.classList.toggle('on', j === cur));
    };
    show(0);
    let auto = pctx.interval(() => show(cur + 1), 5000);
    dotsEl.addEventListener('click', e => { if (e.target.dataset.i) { pctx.clear(auto); show(Number(e.target.dataset.i)); auto = pctx.interval(() => show(cur + 1), 6000); } });
    // arrastar no celular
    let sx = null;
    trackEl.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    trackEl.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      sx = null;
    });
    trackEl.addEventListener('click', e => {
      const go = e.target.closest('[data-go]')?.dataset.go;
      if (!go) return;
      if (go === 'checkin') openCheckin(); else location.hash = go;
    });

    /* atalhos de recompensas */
    const quick = $('.quick', el);
    const renderQuick = () => {
      const ck = Progress.checkinStatus();
      const wh = Progress.wheelIn();
      const ms = Progress.missions();
      const done = ms.filter(m => m.done).length;
      quick.innerHTML = `
        <a class="qk ${ck.canClaim ? 'ready' : ''}" data-q="checkin">${ico('calendar')}<span><b>Bônus diário</b><small>${ck.canClaim ? 'Disponível!' : `🔥 ${ck.streak} dia${ck.streak === 1 ? '' : 's'} seguidos`}</small></span></a>
        <a class="qk ${wh === 0 ? 'ready' : ''}" href="#/bonus">${ico('ferris')}<span><b>Roda grátis</b><small>${wh === 0 ? 'Gire agora!' : fmtDur(wh)}</small></span></a>
        <a class="qk ${ms.some(m => m.done && !m.claimed) ? 'ready' : ''}" href="#/missoes">${ico('bullseye')}<span><b>Missões</b><small>${done}/${ms.length} completas</small></span></a>
        <a class="qk" href="#/bonus">${ico('tv')}<span><b>Fichas grátis</b><small>${Progress.adsLeft()} anúncios hoje</small></span></a>
        <a class="qk ${Progress.freeScratch() ? 'ready' : ''}" href="#/raspadinha">${ico('ticket')}<span><b>Raspadinha</b><small>${Progress.freeScratch() ? '1 grátis hoje!' : 'Tente a sorte'}</small></span></a>
        <a class="qk ${Progress.s.vip.pending > 0 ? 'ready' : ''}" href="#/vip">${ico(Progress.vipTier().art)}<span><b>VIP ${Progress.vipTier().name}</b><small>${Progress.s.vip.pending > 0 ? `Cashback 🪙 ${fmt(Progress.s.vip.pending)}!` : `Cashback ${Math.round(Progress.vipTier().cashback * 100)}%`}</small></span></a>`;
    };
    quick.addEventListener('click', e => { if (e.target.closest('[data-q="checkin"]')) { e.preventDefault(); openCheckin(); } });
    renderQuick();
    pctx.interval(renderQuick, 1000);
    pctx.onUnmount(Bus.on('progress', renderQuick));

    /* jogados recentemente */
    const recent = Progress.s.recent.map(gameById).filter(Boolean).slice(0, 6);
    if (recent.length) {
      $('.lobby-recent', el).append(h(`<div class="cat"><div class="cat-head"><h2>${ico('stopwatch')} Continue jogando</h2></div><div class="row-scroll">${recent.map(g => card(g)).join('')}</div></div>`));
    }

    /* mais jogados */
    $('.popular', el).innerHTML = POPULAR.map(gameById).filter(Boolean).map(g => card(g, true)).join('');

    /* todos os jogos com filtro por categoria */
    const filters = $('.filters', el), all = $('.all-games', el);
    let filter = 'all';
    try { filter = sessionStorage.getItem('fichabet_filter') || 'all'; } catch { /* ignore */ }
    const renderAll = () => {
      filters.innerHTML = [{ id: 'all', title: 'Todos', art: 'star' }, ...CATEGORIES].map(c =>
        `<button class="fchip ${filter === c.id ? 'on' : ''}" data-f="${c.id}">${ico(c.art)}${c.title}</button>`).join('');
      all.innerHTML = '';
      CATEGORIES.filter(c => filter === 'all' || filter === c.id).forEach(cat => {
        const games = App.games.filter(g => g.category === cat.id);
        if (!games.length) return;
        all.append(h(`<div class="cat"><div class="cat-head"><h2>${ico(cat.art)} ${cat.title}</h2><span>${cat.desc}</span></div><div class="cards">${games.map(g => card(g)).join('')}</div></div>`));
      });
    };
    filters.addEventListener('click', e => {
      const f = e.target.closest('[data-f]')?.dataset.f;
      if (!f) return;
      Sfx.click();
      filter = f;
      try { sessionStorage.setItem('fichabet_filter', f); } catch { /* ignore */ }
      renderAll();
    });
    renderAll();
    return el;
  }

  /* ---------- Página de jogo ---------- */
  function renderGame(g) {
    const el = h(`
      <section class="game-page" style="--c1:${g.colors[0]};--c2:${g.colors[1]}">
        <div class="game-head">
          <a href="#/" class="back">←<span> Lobby</span></a>
          <h2><img src="${IMG(g.art)}" alt="">${g.name}</h2>
          <button class="icon-btn help" aria-label="Como jogar">?</button>
        </div>
        <div class="game-body"></div>
      </section>`);
    $('.help', el).addEventListener('click', () => UI.modal(`Como jogar — ${g.name}`, g.rules));
    return el;
  }

  /* ---------- Roteador por hash ---------- */
  function setNav(id) {
    $$('.bottom-nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === id));
  }
  function route() {
    if (ctx) { ctx.destroy(); ctx = null; }
    $$('.modal-backdrop').forEach(m => m.remove());
    app.innerHTML = '';
    const id = location.hash.replace(/^#\/?/, '');
    window.scrollTo(0, 0);
    const game = gameById(id);
    const page = Pages[id];
    document.body.classList.toggle('in-game', !!game);
    if (game) {
      const el = renderGame(game);
      app.append(el);
      ctx = new GameCtx(game);
      document.title = `${game.name} — FichaBet`;
      setNav('');
      game.mount($('.game-body', el), ctx);
      return;
    }
    ctx = new GameCtx(null);
    if (page) {
      app.append(page.render(ctx));
      document.title = `${page.title} — FichaBet`;
      setNav(id);
      return;
    }
    app.append(renderLobby(ctx));
    document.title = 'FichaBet — Cassino Fictício';
    setNav('lobby');
  }

  $('.bottom-nav').addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && a.dataset.nav === 'carteira') { e.preventDefault(); openWallet(); }
  });

  /* ---------- Lembrete de pausa (jogo responsável) ---------- */
  const sessionStart = Date.now();
  let reminded = 0;
  setInterval(() => {
    const hrs = Math.floor((Date.now() - sessionStart) / 3600000);
    if (hrs > reminded) {
      reminded = hrs;
      UI.toast(`⏰ Você está jogando há ${hrs}h. Que tal uma pausa? 🙂`, 'info', 6000);
    }
  }, 60000);

  // pré-carrega sprites dos jogos (giros sem "piscar")
  window.addEventListener('load', () => {
    const slugs = new Set();
    App.games.forEach(g => { slugs.add(g.art); (g.sprites || []).forEach(s => slugs.add(s)); });
    slugs.forEach(s => { const i = new Image(); i.src = IMG(s); });
  });

  window.addEventListener('hashchange', route);
  Wallet.load();
  Progress.load();
  route();
  renderProgressUI();

  // bônus diário abre sozinho na primeira visita do dia
  if (Progress.checkinStatus().canClaim) setTimeout(() => { if (!$('.modal-backdrop')) openCheckin(); }, 700);
})();
