'use strict';

/* =========================================================
   Páginas de engajamento: Bônus (check-in, roda, anúncios),
   Missões diárias e Passe de temporada.
   Cada página recebe um GameCtx para timers que param ao sair.
   ========================================================= */
const Pages = {};
const SEASON_NAMES = ['Ano do Tigre', 'Doce Verão', 'Fúria de Zeus', 'Noite Dourada', 'Festa do Dragão', 'Rumo à Lua'];

const MISSION_GO = {
  slots25: 'tigrinho', mult5: 'doce', mult20: 'olimpo', crash2: 'crash', mines10: 'mines', plinko25: 'plinko', doce15: 'doce',
  olimpo15: 'olimpo', tigre20: 'tigrinho', mesa10: 'futebol', bj3: 'blackjack', double8: 'double', torre5: 'torre', ads2: 'bonus', raspa3: 'raspadinha',
};
const rewardText = r => [r.coins ? `🪙 ${fmt(r.coins)}` : '', r.fs ? `${r.fs} FS` : '', r.xp ? `${r.xp} XP` : ''].filter(Boolean).join(' + ');

/* ---------- Check-in ---------- */
function checkinCalendar(onClaim) {
  const el = h('<div class="checkin"></div>');
  const render = () => {
    const st = Progress.checkinStatus();
    const vm = Progress.vipTier().checkin;
    el.innerHTML = CHECKIN.map((r, i) => {
      // dias já coletados nesta semana do calendário
      const doneCount = st.claimedToday ? st.nextIdx + 1 : st.nextIdx;
      const cls = i < doneCount ? 'done' : (i === st.nextIdx && st.canClaim ? 'today' : '');
      return `<div class="ck-day ${cls} ${i === 6 ? 'big' : ''}">
        <small>Dia ${i + 1}</small>
        ${ico(i === 6 ? 'moneybag' : r.fs ? 'gift' : 'coin', 'ck-img')}
        <b>${fmt(Math.round(r.coins * vm)).replace(',00', '')}</b>
        ${r.fs ? `<em>+${r.fs} FS</em>` : '<em></em>'}
        ${i < doneCount ? '<span class="ck-check">✔</span>' : ''}
      </div>`;
    }).join('') + (vm > 1 ? `<div class="ck-vip">${ico(Progress.vipTier().art)} Bônus VIP ${Progress.vipTier().name}: x${vm}</div>` : '') + `<button class="btn btn-gold btn-big ck-claim" ${st.canClaim ? '' : 'disabled'}>${st.canClaim ? '🎁 Coletar bônus de hoje' : '✅ Volte amanhã para o próximo dia'}</button>`;
  };
  el.addEventListener('click', e => {
    if (!e.target.closest('.ck-claim')) return;
    const r = Progress.claimCheckin();
    if (!r) return;
    UI.confetti(40);
    render();
    onClaim && onClaim(r);
  });
  render();
  return el;
}

function openCheckin() {
  const st = Progress.checkinStatus();
  const body = h(`<div><p class="muted center">Entre todo dia para aumentar a sequência. Perdeu um dia? Volta para o Dia 1!</p><p class="center streak-line">🔥 Sequência atual: <b>${st.streak}</b> dia${st.streak === 1 ? '' : 's'}</p></div>`);
  let m;
  body.append(checkinCalendar(() => setTimeout(() => m.close(), 900)));
  m = UI.modal('Bônus diário', body);
}

/* ---------- Roda de prêmios grátis ---------- */
function prizeWheel(ctx) {
  const n = WHEEL_PRIZES.length, seg = 360 / n;
  const grad = WHEEL_PRIZES.map((p, i) => `${p.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(',');
  const el = h(`
    <div class="pwheel-wrap">
      <div class="pwheel-stage">
        <div class="pwheel-pointer"></div>
        <div class="pwheel" style="background:conic-gradient(${grad})">
          ${WHEEL_PRIZES.map((p, i) => `<div class="pw-label" style="transform:rotate(${i * seg + seg / 2}deg)"><span>${ico(p.fs ? 'gift' : p.xp ? 'star' : 'coin')}${p.label}</span></div>`).join('')}
        </div>
        <button class="pwheel-hub">GIRAR</button>
      </div>
      <div class="pwheel-info muted"></div>
    </div>`);
  const wheel = $('.pwheel', el), hub = $('.pwheel-hub', el), info = $('.pwheel-info', el);
  let rot = 0, spinning = false;
  const render = () => {
    const left = Progress.wheelIn();
    hub.disabled = spinning || left > 0;
    hub.textContent = left > 0 ? fmtDur(left) : 'GIRAR';
    info.textContent = spinning ? 'Boa sorte!' : left > 0 ? 'Próximo giro grátis em ' + fmtDur(left) : 'Giro grátis disponível a cada 4 horas!';
  };
  hub.addEventListener('click', async () => {
    const idx = Progress.spinWheel();
    if (idx === null) return;
    spinning = true;
    Sfx.click();
    const target = 360 - (idx * seg + seg / 2) + RNG.float() * seg * 0.6 - seg * 0.3;
    rot = rot - (rot % 360) + 360 * 6 + target;
    wheel.style.transition = 'transform 4.5s cubic-bezier(.12,.8,.18,1)';
    wheel.style.transform = `rotate(${rot}deg)`;
    const tk = ctx.interval(() => Sfx.tick(), 140);
    render();
    await ctx.sleep(4600);
    ctx.clear(tk);
    spinning = false;
    const p = WHEEL_PRIZES[idx];
    Progress.grant(p, 'Roda de prêmios');
    if (ctx.alive) { UI.confetti(p.coins >= 1000 ? 70 : 35); render(); }
  });
  ctx.interval(render, 1000);
  render();
  return el;
}

/* ---------- Anúncios ---------- */
function adsPanel() {
  const el = h(`
    <div class="ads-panel">
      ${ico('tv', 'ads-img')}
      <div class="ads-text"><b>Assista e ganhe 🪙 ${fmt(Progress.AD_REWARD)}</b><small class="ads-left"></small></div>
      <button class="btn btn-ad ads-watch">▶ Assistir</button>
    </div>`);
  const btn = $('.ads-watch', el), left = $('.ads-left', el);
  const render = () => {
    const n = Progress.adsLeft();
    left.textContent = n > 0 ? `${n} de ${Progress.ADS_PER_DAY} disponíveis hoje` : 'Limite diário atingido. Volte amanhã!';
    btn.disabled = n <= 0;
  };
  btn.addEventListener('click', async () => {
    if (Progress.adsLeft() <= 0) return;
    btn.disabled = true;
    await Progress.adForCoins();
    render();
  });
  render();
  return el;
}

/* ---------- Cashback semanal ---------- */
function cashbackBox(ctx) {
  const el = h('<div class="cashback"></div>');
  const render = () => {
    const P = Progress, t = P.vipTier(), pend = P.s.vip.pending, est = P.cashbackEstimate();
    el.innerHTML = `
      <div class="cb-row"><span>Perdas líquidas desta semana</span><b>🪙 ${fmt(Math.max(0, P.s.vip.net))}</b></div>
      <div class="cb-row"><span>Cashback ${t.name} (${Math.round(t.cashback * 100)}%) previsto</span><b class="gold">🪙 ${fmt(est)}</b></div>
      <div class="cb-row muted small"><span>Liberado toda segunda-feira · faltam</span><b>${fmtDur(P.weekEndsIn())}</b></div>
      <button class="btn ${pend > 0 ? 'btn-gold' : 'btn-ghost'} btn-big cb-claim" ${pend > 0 ? '' : 'disabled'}>${pend > 0 ? `💸 Resgatar cashback 🪙 ${fmt(pend)}` : 'Nenhum cashback para resgatar agora'}</button>`;
  };
  el.addEventListener('click', e => {
    if (e.target.closest('.cb-claim') && Progress.claimCashback()) { UI.confetti(50); render(); }
  });
  ctx.interval(render, 1000);
  ctx.onUnmount(Bus.on('progress', render));
  render();
  return el;
}

Pages.vip = {
  title: 'VIP',
  render(ctx) {
    const P = Progress;
    const el = h(`
      <section class="page">
        <div class="page-hero vip-hero"></div>
        <div class="page-grid">
          <div class="panel block"><h3>${ico('moneywings')} Cashback semanal</h3><p class="muted small">Toda segunda-feira você recebe de volta uma parte do que perdeu na semana anterior. Quanto maior o nível VIP, maior a porcentagem.</p><div class="cb-slot"></div></div>
          <div class="panel block"><h3>${ico('crown')} Níveis VIP</h3><div class="vip-table"></div><p class="muted small">O XP VIP é o XP total de todas as temporadas — ele nunca zera.</p></div>
        </div>
      </section>`);
    const hero = $('.vip-hero', el);
    const render = () => {
      const t = P.vipTier(), next = P.vipNext();
      hero.style.cssText = `--c1:${t.color};--c2:#1e1b4b`;
      hero.innerHTML = `${ico(t.art, 'ph-img')}<div class="pass-head"><h1>VIP ${t.name}</h1>
        <p>Cashback de <b>${Math.round(t.cashback * 100)}%</b> · bônus diário <b>x${t.checkin}</b></p>
        <div class="pass-lvl"><div class="xpbar"><i style="width:${P.vipPct()}%"></i><span>${next ? `${fmt(P.s.totalXp).replace(',00', '')} / ${fmt(next.xp).replace(',00', '')} XP para ${next.name}` : 'Nível máximo!'}</span></div></div></div>`;
      const idx = P.vipIndex();
      $('.vip-table', el).innerHTML = VIP_TIERS.map((v, i) => `
        <div class="vip-row ${i === idx ? 'cur' : ''} ${i < idx ? 'past' : ''}" style="--vc:${v.color}">
          ${ico(v.art, 'vip-img')}
          <div class="m-body"><b>${v.name}</b><small>${fmt(v.xp).replace(',00', '')} XP${v.reward ? ` · presente: 🪙 ${fmt(v.reward.coins).replace(',00', '')} + ${v.reward.fs} FS` : ''}</small></div>
          <div class="vip-perk"><b>${Math.round(v.cashback * 100)}%</b><small>cashback</small></div>
          <div class="vip-perk"><b>x${v.checkin}</b><small>check-in</small></div>
        </div>`).join('');
    };
    $('.cb-slot', el).append(cashbackBox(ctx));
    render();
    ctx.onUnmount(Bus.on('progress', render));
    return el;
  },
};

Pages.bonus = {
  title: 'Bônus',
  render(ctx) {
    const el = h(`
      <section class="page">
        <div class="page-hero" style="--c1:#10b981;--c2:#0e7490">${ico('gift', 'ph-img')}<div><h1>Bônus & Recompensas</h1><p>Volte todo dia, gire a roda e ganhe fichas extras.</p></div></div>
        <div class="page-grid">
          <div class="panel block"><h3>${ico('calendar')} Check-in diário</h3><p class="muted small">🔥 Sequência: <b class="streak"></b> · no 7º dia: 🪙 1.000 + 10 rodadas grátis</p><div class="ck-slot"></div></div>
          <div class="panel block"><h3>${ico('ferris')} Roda de prêmios grátis</h3><div class="wh-slot"></div></div>
          <div class="panel block"><h3>${ico('tv')} Ganhar fichas com anúncios</h3><div class="ad-slot"></div><p class="muted small">Também dá para <b>dobrar prêmios altos</b> assistindo um anúncio logo após a vitória.</p></div>
          <div class="panel block"><h3>${ico('ticket')} Raspadinha grátis</h3><div class="sc-free"></div></div>
          <div class="panel block"><h3>${ico(Progress.vipTier().art)} Cashback VIP</h3><div class="cb-slot"></div><a class="btn btn-ghost" href="#/vip">Ver níveis VIP →</a></div>
          <div class="panel block"><h3>${ico('gift')} Rodadas grátis</h3><div class="fs-info"></div></div>
        </div>
      </section>`);
    $('.cb-slot', el).append(cashbackBox(ctx));
    const scFree = $('.sc-free', el);
    const streakEl = $('.streak', el);
    const fsInfo = $('.fs-info', el);
    const upd = () => {
      streakEl.textContent = Progress.checkinStatus().streak;
      const free = Progress.freeScratch();
      scFree.innerHTML = `<div class="fs-big">${ico('ticket')}<span>${free ? 'Sua raspadinha de <b class="gold">🪙 5</b> de hoje está esperando!' : 'Você já raspou a de hoje. Volte amanhã!'}</span></div>
        <a class="btn ${free ? 'btn-gold' : 'btn-ghost'}" href="#/raspadinha">${free ? '🎟️ Raspar grátis' : 'Comprar raspadinha'}</a>`;
      const n = Progress.s.fs;
      fsInfo.innerHTML = `<div class="fs-big">${ico('gift')}<b>${n}</b><span>rodadas grátis</span></div>
        <p class="muted small">Valem em qualquer slot (aposta 🪙 ${fmt(Progress.FS_BET)} cada). Ganhe no check-in, na roda, nas missões e no passe.</p>
        ${n > 0 ? '<a class="btn btn-primary" href="#/tigrinho">Usar no Tigrinho</a>' : ''}`;
    };
    $('.ck-slot', el).append(checkinCalendar(upd));
    $('.wh-slot', el).append(prizeWheel(ctx));
    $('.ad-slot', el).append(adsPanel());
    upd();
    ctx.onUnmount(Bus.on('progress', upd));
    return el;
  },
};

/* ---------- Missões ---------- */
Pages.missoes = {
  title: 'Missões',
  render(ctx) {
    const el = h(`
      <section class="page">
        <div class="page-hero" style="--c1:#f97316;--c2:#be123c">${ico('bullseye', 'ph-img')}<div><h1>Missões diárias</h1><p>Novas missões todo dia. Complete todas para abrir o baú!</p><span class="ph-timer"></span></div></div>
        <div class="missions"></div>
        <div class="panel chest-panel"></div>
      </section>`);
    const list = $('.missions', el), chest = $('.chest-panel', el), timer = $('.ph-timer', el);
    const render = () => {
      const ms = Progress.missions();
      list.innerHTML = ms.map(m => {
        const pct = Math.min(100, (m.p / m.goal) * 100);
        const prog = m.money ? `${fmt(Math.min(m.p, m.goal))} / ${fmt(m.goal)}` : `${Math.min(m.p, m.goal)} / ${m.goal}`;
        return `<div class="mission ${m.claimed ? 'claimed' : m.done ? 'done' : ''}">
          ${ico(m.art, 'm-img')}
          <div class="m-body"><b>${m.text}</b>
            <div class="xpbar"><i style="width:${pct}%"></i><span>${prog}</span></div>
            <small>Recompensa: 🪙 ${fmt(m.coins)} + ${m.xp} XP</small></div>
          ${m.claimed ? '<button class="btn btn-ghost" disabled>✔</button>'
            : m.done ? `<button class="btn btn-gold" data-id="${m.id}">Coletar</button>`
              : `<a class="btn btn-primary" href="#/${MISSION_GO[m.id] || ''}">Jogar</a>`}
        </div>`;
      }).join('');
      const done = ms.filter(m => m.claimed).length;
      const all = Progress.allMissionsClaimed(), got = Progress.s.missions.bonus;
      chest.innerHTML = `${ico('gift', 'chest-img ' + (all && !got ? 'shake' : ''))}
        <div class="m-body"><b>Baú das missões</b><div class="xpbar"><i style="width:${(done / ms.length) * 100}%"></i><span>${done} / ${ms.length}</span></div>
        <small>${ALL_MISSIONS_BONUS.fs} rodadas grátis + ${ALL_MISSIONS_BONUS.xp} XP</small></div>
        <button class="btn ${all && !got ? 'btn-gold' : 'btn-ghost'} chest-claim" ${all && !got ? '' : 'disabled'}>${got ? '✔' : 'Abrir'}</button>`;
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-id]');
      if (b && Progress.claimMission(b.dataset.id)) { UI.confetti(25); render(); }
      if (e.target.closest('.chest-claim') && Progress.claimMissionsBonus()) { UI.confetti(60, ['gift', 'coin', 'star']); render(); }
    });
    const tick = () => {
      const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer.textContent = '⏰ Novas missões em ' + fmtDur(mid - now);
    };
    ctx.interval(tick, 1000);
    tick();
    render();
    ctx.onUnmount(Bus.on('progress', render));
    return el;
  },
};

/* ---------- Passe de temporada ---------- */
Pages.passe = {
  title: 'Passe',
  render(ctx) {
    const P = Progress;
    const el = h(`
      <section class="page">
        <div class="page-hero pass-hero" style="--c1:#7c3aed;--c2:#db2777">${ico('ticket', 'ph-img')}
          <div class="pass-head"><h1>Temporada: ${SEASON_NAMES[P.s.season % SEASON_NAMES.length]}</h1>
            <p>Ganhe XP jogando e completando missões. 50 níveis de prêmios crescentes e, depois, níveis infinitos.</p>
            <div class="pass-lvl"><span class="lvl-badge big"></span><div class="xpbar"><i></i><span></span></div></div>
            <span class="ph-timer"></span>
          </div>
        </div>
        <div class="pass-actions">
          <div class="panel prem-box"></div>
          <button class="btn btn-gold claim-all">Coletar tudo</button>
        </div>
        <div class="pass-track-wrap"><div class="pass-track"></div></div>
      </section>`);
    let premTotal = 0;
    for (let l = 1; l <= P.PASS_LEVELS; l++) premTotal += P.passReward(l, 'prem').coins || 0;
    const track = $('.pass-track', el), prem = $('.prem-box', el), timer = $('.ph-timer', el);
    const cell = (l, t) => {
      const r = P.passReward(l, t);
      const claimed = P.s.claimed[t].includes(l);
      const can = P.canClaimPass(l, t);
      const locked = l > P.level || (t === 'prem' && !P.s.premium);
      return `<button class="pr ${t} ${claimed ? 'claimed' : can ? 'can' : ''} ${locked ? 'locked' : ''} ${r.fs && r.coins ? 'epic' : ''}" data-l="${l}" data-t="${t}" ${can ? '' : 'disabled'}>
        ${ico(r.fs && r.coins ? 'moneybag' : r.fs ? 'gift' : 'coin', 'pr-img')}
        <span>${r.coins ? fmt(r.coins).replace(',00', '') : ''}${r.coins && r.fs ? '<br>' : ''}${r.fs ? `+${r.fs} FS` : ''}</span>
        ${claimed ? '<i class="pr-ok">✔</i>' : locked ? `<i class="pr-lock">${ico('locked')}</i>` : ''}
      </button>`;
    };
    const render = () => {
      $('.lvl-badge', el).textContent = 'Nv ' + P.level;
      $('.pass-lvl .xpbar i', el).style.width = P.levelPct + '%';
      const pi = P.passInfo;
      $('.pass-lvl .xpbar span', el).textContent = `${fmt(pi.into).replace(',00', '')} / ${fmt(pi.need).replace(',00', '')} XP`;
      let html = '<div class="pt-col pt-labels"><div class="pt-lv">Nível</div><div class="pt-name">Grátis</div><div class="pt-name prem">Premium 👑</div></div>';
      // níveis 1–50 e, depois deles, os níveis infinitos perto do atual
      const extraFrom = Math.max(P.PASS_LEVELS + 1, P.level - 15), extraTo = Math.max(P.PASS_LEVELS + 3, P.level + 3);
      const levels = [...Array.from({ length: P.PASS_LEVELS }, (_, i) => i + 1), ...Array.from({ length: extraTo - extraFrom + 1 }, (_, i) => extraFrom + i)];
      levels.forEach(l => {
        if (l === P.PASS_LEVELS + 1 || (l === extraFrom && l > P.PASS_LEVELS)) html += `<div class="pt-col pt-inf"><div class="pt-lv">∞</div><div class="pt-inf-txt">Depois do ${P.PASS_LEVELS}: um nível a cada ${fmt(P.PASS_EXTRA_COST).replace(',00', '')} XP, sempre com o mesmo prêmio</div></div>`;
        html += `<div class="pt-col ${l === P.level ? 'cur' : ''} ${l <= P.level ? 'reached' : ''}"><div class="pt-lv">${l}</div>${cell(l, 'free')}${cell(l, 'prem')}</div>`;
      });
      track.innerHTML = html;
      prem.innerHTML = P.s.premium
        ? `${ico('crown')}<div><b>Passe Premium ativo</b><small>+25% de XP e trilha premium liberada</small></div>`
        : `${ico('crown')}<div><b>Passe Premium</b><small>Trilha premium (🪙 ${fmt(premTotal)} + rodadas grátis) e +25% de XP</small></div><button class="btn btn-gold buy-prem">🪙 ${fmt(P.PREMIUM_PRICE)}</button>`;
      const pend = P.pending().pass;
      const ca = $('.claim-all', el);
      ca.disabled = !pend;
      ca.textContent = pend ? `Coletar tudo (${pend})` : 'Nada para coletar';
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('.pr');
      if (b && P.claimPass(Number(b.dataset.l), b.dataset.t)) { UI.confetti(25); render(); }
      if (e.target.closest('.claim-all')) { const g = P.claimAllPass(); if (g.coins || g.fs) UI.confetti(60); render(); }
      if (e.target.closest('.buy-prem')) {
        if (confirm(`Ativar o Passe Premium por 🪙 ${fmt(P.PREMIUM_PRICE)} fichas fictícias?`) && P.buyPremium()) {
          Sfx.big(); UI.confetti(70, ['crown', 'coin', 'star']); UI.toast('👑 Passe Premium ativado!', 'win'); render();
        }
      }
    });
    const tick = () => { timer.textContent = '⏰ Temporada termina em ' + fmtDur(P.seasonEndsIn()); };
    ctx.interval(tick, 1000);
    tick();
    render();
    ctx.onUnmount(Bus.on('progress', render));
    // rola até o nível atual
    requestAnimationFrame(() => {
      const cur = $('.pt-col.cur', track);
      if (cur) track.parentElement.scrollLeft = cur.offsetLeft - 120;
    });
    return el;
  },
};
