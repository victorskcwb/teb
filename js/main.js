'use strict';

(function () {
  const CATEGORIES = [
    { id: 'slots', title: 'Slots', art: 'slot', desc: 'Caça-níqueis com recursos especiais' },
    { id: 'originais', title: 'Originais', art: 'rocket', desc: 'Crash, Mines, Plinko, Dice e mais' },
    { id: 'mesa', title: 'Mesa & Ao vivo', art: 'cards', desc: 'Roleta, Blackjack, Futebol Studio' },
  ];
  // slots "de estúdio" (SlotKit) agrupados no lobby
  const STUDIOS = [
    { id: 'pragmatic', title: 'Estilo Pragmatic Play', short: 'Pragmatic', art: 'house', desc: 'Megaways, grupos e respins de moedas' },
    { id: 'pgsoft', title: 'Estilo PG Soft', short: 'PG Soft', art: 'mahjong', desc: 'Mahjong, molduras douradas e multiplicadores' },
    { id: 'hacksaw', title: 'Estilo Hacksaw', short: 'Hacksaw', art: 'cowboy', desc: 'DuelReels, coringas que andam e bônus malucos' },
    { id: 'tada', title: 'Estilo TaDa / JILI', short: 'TaDa', art: 'gem', desc: 'Joias, clássicos asiáticos e cascatas' },
    { id: 'nolimit', title: 'Estilo Nolimit City', short: 'Nolimit', art: 'headstone', desc: 'xWays, xNudge, xBomb — volatilidade extrema' },
  ];
  // ranking aproximado dos jogos mais jogados em cassinos online no Brasil
  const POPULAR = ['tigrinho', 'mahjong1', 'touro', 'docerush', 'procurado', 'joiasfortuna', 'raspadinha', 'crash', 'doce', 'zeushades', 'coelho', 'mines', 'olimpo', 'anubis', 'pescaria', 'portais', 'ratinho', 'princesa', 'double', 'futebol', 'roleta', 'plinko', 'dragaozinho', 'blackjack'];
  const BADGE = {
    tigrinho: 'hot', crash: 'hot', mines: 'hot', touro: 'new', coelho: 'new', pescaria: 'new', princesa: 'new', docerush: 'new', portais: 'new', zeushades: 'new', anubis: 'new', doce: 'top', olimpo: 'top', ratinho: 'new',
    futebol: 'new', raspadinha: 'new', limbo: 'new', dice: 'new', hilo: 'new', keno: 'new', torre: 'new', double: 'top',
    mahjong1: 'hot', procurado: 'hot', casacaes: 'top', joiasfortuna: 'hot', lobodeouro: 'top', mahjong2: 'top', banditoguaxinim: 'hot', bandidoselvagem: 'top',
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
    const pl = Progress.player;
    $('.lvl-num', lvlChip).textContent = pl.level;
    $('.lvl-ring', lvlChip).style.setProperty('--p', pl.pct);
    $('.lvl-ring', lvlChip).style.setProperty('--rc', pl.rank.color);
    $('.lvl-medal', lvlChip).src = IMG(pl.rank.art);
    lvlChip.title = `Nível ${pl.level} · ${pl.rank.label}`;
    const pend = Progress.pending();
    const setDot = (sel, n) => { const d = $(sel); if (d) { d.textContent = n > 9 ? '9+' : n; d.classList.toggle('hidden', !n); } };
    setDot('[data-dot="bonus"]', pend.bonus);
    setDot('[data-dot="missoes"]', pend.missions);
    setDot('[data-dot="passe"]', pend.pass);
  }
  Bus.on('progress', renderProgressUI);
  /** Perfil: nível do jogador (infinito), patente e progresso do passe. */
  function openProfile() {
    const pl = Progress.player, pi = Progress.passInfo;
    const ranks = PLAYER_RANKS.map((r, i) => `<div class="rk ${i === pl.rank.idx ? 'cur' : i < pl.rank.idx ? 'done' : ''}" style="--rc:${r.color}">${ico(r.art)}<small>${r.name}</small><b>${i < 10 ? `Nv ${i * 10 + 1}` : 'Nv 101+'}</b></div>`).join('');
    const body = h(`
      <div class="profile">
        <div class="pf-head" style="--rc:${pl.rank.color}">
          <div class="pf-medal">${ico(pl.rank.art)}<span>${pl.level}</span></div>
          <div><small>Nível do jogador</small><b>${pl.rank.label}</b><span>Nível ${pl.level}</span></div>
        </div>
        <div class="xpbar"><i style="width:${pl.pct}%"></i><span>${fmt(pl.into).replace(',00', '')} / ${fmt(pl.need).replace(',00', '')} XP para o nível ${pl.level + 1}</span></div>
        <p class="muted small">O nível do jogador é infinito e nunca zera: cada nível pede mais XP que o anterior (depois do 30, bem mais). A patente muda a cada 10 níveis e o VIP sobe junto. Os marcos dão fichas e rodadas grátis.</p>
        <h4>Próximo marco</h4><div class="missions pf-miles"></div>
        <h4>Patentes</h4><div class="ranks">${ranks}</div>
        <a class="btn btn-ghost" href="#/nivel">Ver medalhas e todos os marcos →</a>
        <div class="pf-pass">${ico('ticket')}<div><small>Passe da temporada</small><b>Nível ${pi.level}</b><div class="xpbar"><i style="width:${(pi.into / pi.need) * 100}%"></i><span>${fmt(pi.into).replace(',00', '')} / ${fmt(pi.need).replace(',00', '')} XP</span></div></div><a class="btn btn-gold" href="#/passe">Ver passe</a></div>
        <div class="stats-grid"><div><small>XP total</small><b>${fmt(Progress.s.totalXp).replace(',00', '')}</b></div><div><small>VIP</small><b>${Progress.vipTier().name}</b></div></div>
      </div>`);
    const miles = $('.pf-miles', body);
    const renderMiles = () => { const ready = Progress.milestonesReady(), next = Progress.nextMilestone(); miles.innerHTML = [...ready, ...(next ? [next] : [])].map(mileRow).join(''); };
    renderMiles();
    const m = UI.modal('Perfil', body);
    body.addEventListener('click', e => {
      if (e.target.closest('a')) m.close();
      const b = e.target.closest('.mile-claim');
      if (b && Progress.claimMilestone(Number(b.dataset.i))) { UI.confetti(60, ['gift', 'coin', 'star']); renderMiles(); }
    });
  }
  lvlChip.addEventListener('click', () => { Sfx.click(); openProfile(); });
  Bus.on('playerup', pl => {
    setTimeout(() => {
      Sfx.levelUp();
      UI.confetti(40, [pl.rank.art, 'star', 'coin']);
      UI.toast(`🏅 Você subiu para o nível ${pl.level} do jogador! ${pl.level % 10 === 1 ? `Nova patente: ${pl.rank.label}` : ''}`, 'level', 3600);
    }, 900);
  });

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
      if (a === 'reset') UI.ask('Zerar progresso', 'Zerar saldo e estatísticas?', 'Zerar', 'btn-danger').then(ok => { if (ok) { Wallet.reset(); UI.toast('Progresso zerado'); m.close(); } });
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
    slides.push({ art: 'mahjong', c: ['#15803d', '#b91c1c'], t: 'NOVOS: 50 slots de estúdio', s: 'Mahjong, Megaways, DuelReels, xWays e muito mais — no estilo Pragmatic, PG, Hacksaw, TaDa e Nolimit.', cta: 'Ver todos', go: 'studios' });
    slides.push({ art: 'teddy', c: ['#db2777', '#7c3aed'], t: 'NOVO: Doce Rush', s: 'Multiplicadores de até x128 que ficam na grade nas rodadas grátis.', cta: 'Jogar', go: '#/docerush' });
    slides.push({ art: 'zeus', c: ['#2563eb', '#b91c1c'], t: 'NOVO: Zeus x Hades', s: 'Escolha seu deus nas rodadas grátis: coringas de até x50.', cta: 'Jogar', go: '#/zeushades' });
    slides.push({ art: 'fish', c: ['#0284c7', '#0f766e'], t: 'Pescaria Bonança', s: 'O pescador fisga peixes de até 1.000x nas rodadas grátis.', cta: 'Jogar', go: '#/pescaria' });
    slides.push({ art: 'ox', c: ['#dc2626', '#a16207'], t: 'NOVOS: Touro e Coelho da Sorte', s: 'Touro Furioso com tela cheia x10 e cenouras de prêmio de até 200x.', cta: 'Jogar', go: '#/touro' });
    slides.push({ art: 'ticket', c: ['#7c3aed', '#db2777'], t: `Passe da Temporada · Nível ${Progress.level}`, s: `Termina em ${fmtDur(Progress.seasonEndsIn())}. Jogue, ganhe XP e libere prêmios!`, cta: 'Ver passe', go: '#/passe' });
    slides.push({ art: 'princess', c: ['#c026d3', '#4338ca'], t: 'NOVO: Princesa Estelar', s: 'Estrelas multiplicadoras que se acumulam nas rodadas grátis.', cta: 'Jogar', go: '#/princesa' });
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
        <div class="studio-chips hidden"></div>
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
      if (go === 'checkin') openCheckin();
      else if (go === 'studios') { filter = 'slots'; try { sessionStorage.setItem('fichabet_filter', filter); } catch { /* ignore */ } renderAll(); $('.filters', el).scrollIntoView({ behavior: 'smooth' }); }
      else location.hash = go;
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
        <a class="qk ${Progress.s.vip.pending > 0 ? 'ready' : ''}" href="#/vip">${ico(Progress.vipTier().art)}<span><b>VIP ${Progress.vipTier().name}</b><small>${Progress.s.vip.pending > 0 ? `Cashback 🪙 ${fmt(Progress.s.vip.pending)}!` : `Cashback ${pct(Progress.vipTier().cashback)}`}</small></span></a>`;
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
    const filters = $('.filters', el), studioEl = $('.studio-chips', el), all = $('.all-games', el);
    let filter = 'all';
    try { filter = sessionStorage.getItem('fichabet_filter') || 'all'; } catch { /* ignore */ }
    const section = (art, title, desc, games) => h(`<div class="cat"><div class="cat-head"><h2>${ico(art)} ${title}</h2><span>${desc}</span></div><div class="cards">${games.map(g => card(g)).join('')}</div></div>`);
    function renderAll() {
      const studio = filter.startsWith('studio:') ? filter.slice(7) : null;
      const cat = studio ? 'slots' : filter;
      filters.innerHTML = [{ id: 'all', title: 'Todos', art: 'star' }, ...CATEGORIES].map(c =>
        `<button class="fchip ${cat === c.id ? 'on' : ''}" data-f="${c.id}">${ico(c.art)}${c.title}</button>`).join('');
      studioEl.classList.toggle('hidden', cat !== 'slots');
      studioEl.innerHTML = cat !== 'slots' ? '' : [{ id: 'slots', short: 'Todos os slots', art: 'slot' }, ...STUDIOS.map(s => ({ ...s, id: 'studio:' + s.id }))].map(s =>
        `<button class="fchip ${filter === s.id ? 'on' : ''}" data-f="${s.id}">${ico(s.art)}${s.short}</button>`).join('');
      all.innerHTML = '';
      CATEGORIES.filter(c => cat === 'all' || cat === c.id).forEach(c => {
        const games = App.games.filter(g => g.category === c.id);
        if (!games.length) return;
        if (c.id !== 'slots') { all.append(section(c.art, c.title, c.desc, games)); return; }
        const classic = games.filter(g => !g.studio);
        if (!studio && classic.length) all.append(section(c.art, 'Slots FichaBet', c.desc, classic));
        STUDIOS.filter(s => !studio || s.id === studio).forEach(s => {
          const list = games.filter(g => g.studio === s.id);
          if (list.length) all.append(section(s.art, s.title, s.desc, list));
        });
      });
    }
    const onFilter = e => {
      const f = e.target.closest('[data-f]')?.dataset.f;
      if (!f) return;
      Sfx.click();
      filter = f;
      try { sessionStorage.setItem('fichabet_filter', f); } catch { /* ignore */ }
      renderAll();
    };
    filters.addEventListener('click', onFilter);
    studioEl.addEventListener('click', onFilter);
    renderAll();
    return el;
  }

  /* ---------- Página de jogo ---------- */
  function renderGame(g) {
    const el = h(`
      <section class="game-page" style="--c1:${g.colors[0]};--c2:${g.colors[1]}">
        <div class="game-head">
          <a href="#/" class="back">←<span> Lobby</span></a>
          <h2><img src="${IMG(g.art)}" alt=""><span>${g.name}</span></h2>
          <button class="icon-btn help" aria-label="Como jogar">?</button>
        </div>
        <div class="game-body"></div>
      </section>`);
    $('.help', el).addEventListener('click', () => {
      if (g.info) SlotInfo.open(g, ctx && ctx.bet ? ctx.bet() : 1);
      else UI.modal(`Como jogar — ${g.name}`, g.rules);
    });
    return el;
  }

  /** Botão de histórico (slots): mostra o resultado da sessão e abre a lista de giros. */
  function historyButton(el, g, gctx) {
    const btn = h(`<button class="icon-btn hist-btn" aria-label="Histórico de giros" title="Histórico de giros">${ico('scroll')}<span class="hist-net hidden"></span></button>`);
    $('.help', el).before(btn);
    const net = $('.hist-net', btn);
    const render = () => {
      const st = History.stats(History.list(g.id).filter(r => r.t >= History.since));
      net.classList.toggle('hidden', !st.n);
      net.classList.toggle('neg', st.net < 0);
      net.textContent = (st.net >= 0 ? '+' : '') + fmt(st.net);
    };
    btn.addEventListener('click', () => { Sfx.click(); History.open(g); });
    gctx.onUnmount(Bus.on('history', id => { if (id === g.id) render(); }));
    render();
  }

  /** Botão 🎯 (slots): missão infinita do jogo, com pontinho quando dá para coletar. */
  function questButton(el, g, gctx) {
    const btn = h(`<button class="icon-btn quest-btn" aria-label="Missões do jogo" title="Missões do jogo">${ico('bullseye')}<i class="q-ring"></i><i class="tdot hidden"></i></button>`);
    $('.help', el).before(btn);
    const render = () => {
      const q = Progress.slotQuest(g.id);
      if (!q) return;
      $('.tdot', btn).classList.toggle('hidden', !q.done);
      btn.style.setProperty('--qp', Math.min(100, (q.p / q.goal) * 100) + '%');
    };
    btn.addEventListener('click', () => { Sfx.click(); slotQuestModal(g.id); });
    gctx.onUnmount(Bus.on('progress', render));
    render();
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
      if (window.LITE) (game.sprites || []).forEach(s => { const i = new Image(); i.src = IMG(s); });
      const el = renderGame(game);
      app.append(el);
      ctx = new GameCtx(game);
      document.title = `${game.name} — FichaBet`;
      setNav('');
      if (game.category === 'slots') { historyButton(el, game, ctx); questButton(el, game, ctx); }
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
    // no celular (modo leve) só as capas: os símbolos de cada jogo carregam quando ele é aberto
    App.games.forEach(g => { slugs.add(g.art); if (!window.LITE) (g.sprites || []).forEach(s => slugs.add(s)); });
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
