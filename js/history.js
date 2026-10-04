'use strict';

/* =========================================================
   Histórico de giros dos slots: últimas rodadas de cada jogo
   (vitórias e perdas), salvo no localStorage. Alimentado pelo
   evento 'round' — qualquer slot novo já entra sozinho.
   ========================================================= */
const History = {
  KEY: 'fichabet_history_v1',
  MAX: 100,
  s: {},
  since: Date.now(),

  load() {
    try { this.s = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { this.s = {}; }
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.s)); } catch { /* ignore */ }
  },
  add(e) {
    if (e.cat !== 'slots' || !e.game) return;
    const list = this.s[e.game] || (this.s[e.game] = []);
    list.unshift({ t: Date.now(), bet: e.base, stake: e.stake, pay: e.payout, free: e.stake === 0, buy: !!e.buy });
    if (list.length > this.MAX) list.length = this.MAX;
    this.save();
    Bus.emit('history', e.game);
  },
  list(game) { return this.s[game] || []; },
  clear(game) { delete this.s[game]; this.save(); Bus.emit('history', game); },

  /** Resumo de uma lista de rodadas. */
  stats(list) {
    const st = { n: list.length, wins: 0, staked: 0, paid: 0, best: 0 };
    list.forEach(r => {
      if (r.pay > 0) st.wins++;
      st.staked += r.stake;
      st.paid += r.pay;
      st.best = Math.max(st.best, r.pay);
    });
    st.net = round2(st.paid - st.staked);
    return st;
  },

  /** Modal com resumo, faixa dos últimos giros e lista filtrável. */
  open(game) {
    let filter = 'all', scope = 'all';
    const body = h('<div class="hist"></div>');
    const render = () => {
      const all = this.list(game.id);
      const scoped = scope === 'session' ? all.filter(r => r.t >= this.since) : all;
      const st = this.stats(scoped);
      const shown = scoped.filter(r => filter === 'all' || (filter === 'win' ? r.pay > 0 : r.pay === 0));
      const strip = scoped.slice(0, 40).reverse();
      const top = Math.max(1, ...strip.map(r => r.pay / (r.bet || 1)));
      body.innerHTML = `
        <div class="hist-tabs seg">
          <button data-scope="all" class="${scope === 'all' ? 'on' : ''}">Últimos ${this.MAX}</button>
          <button data-scope="session" class="${scope === 'session' ? 'on' : ''}">Esta sessão</button>
        </div>
        <div class="stats-grid hist-stats">
          <div><small>Giros</small><b>${st.n}</b></div>
          <div><small>Vitórias</small><b>${st.wins} <span class="muted small">(${st.n ? Math.round((st.wins / st.n) * 100) : 0}%)</span></b></div>
          <div><small>Apostado</small><b>${fmt(st.staked)}</b></div>
          <div><small>Recebido</small><b>${fmt(st.paid)}</b></div>
          <div><small>Resultado</small><b class="${st.net >= 0 ? 'pos' : 'neg'}">${st.net >= 0 ? '+' : ''}${fmt(st.net)}</b></div>
          <div><small>Maior prêmio</small><b>${fmt(st.best)}</b></div>
        </div>
        ${strip.length ? `<div class="hist-strip" title="Últimos giros (mais recente à direita)">${strip.map(r => {
          const m = r.pay / (r.bet || 1);
          const hgt = r.pay > 0 ? 25 + 75 * Math.log1p(m) / Math.log1p(top) : 14;
          return `<i class="${r.pay > 0 ? (r.pay >= r.stake ? 'w' : 'p') : 'l'}" style="height:${hgt.toFixed(0)}%"></i>`;
        }).join('')}</div>` : ''}
        <div class="hist-tabs seg">
          <button data-f="all" class="${filter === 'all' ? 'on' : ''}">Todos</button>
          <button data-f="win" class="${filter === 'win' ? 'on' : ''}">✅ Vitórias</button>
          <button data-f="loss" class="${filter === 'loss' ? 'on' : ''}">❌ Perdas</button>
        </div>
        <div class="hist-list">
          ${shown.length ? shown.map(r => {
            const net = round2(r.pay - r.stake);
            const time = new Date(r.t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const tag = r.buy ? '<span class="badge">COMPRA</span>' : r.free ? '<span class="badge fs">GRÁTIS</span>' : '';
            return `<div class="hist-row ${r.pay > 0 ? 'win' : 'loss'}">
              <span class="hr-time">${time}</span>
              <span class="hr-bet">🪙 ${fmt(r.buy ? r.stake : r.bet)} ${tag}</span>
              <span class="hr-res">${r.pay > 0 ? `${fmtX(r.pay / (r.bet || 1))}<b>+${fmt(r.pay)}</b>` : '<b>—</b>'}</span>
              <span class="hr-net ${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${fmt(net)}</span>
            </div>`;
          }).join('') : `<p class="muted center">${all.length ? 'Nenhum giro neste filtro.' : 'Nenhum giro ainda. Boa sorte! 🍀'}</p>`}
        </div>
        ${all.length ? '<button class="btn btn-ghost hist-clear">🗑️ Limpar histórico</button>' : ''}
        <p class="muted small">Resultado = recebido − apostado. Rodadas grátis não custam fichas.</p>`;
    };
    render();
    body.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.f) filter = b.dataset.f;
      if (b.dataset.scope) scope = b.dataset.scope;
      if (b.classList.contains('hist-clear')) {
        UI.ask('Apagar histórico', 'Apagar o histórico deste jogo?', 'Apagar', 'btn-danger').then(ok => { if (ok) { this.clear(game.id); render(); } });
        return;
      }
      Sfx.click();
      render();
    });
    UI.modal(`Histórico — ${game.name}`, body);
    // atualiza ao vivo (ex.: giro automático rodando por trás)
    const off = Bus.on('history', id => {
      if (!body.isConnected) { off(); return; }
      if (id === game.id) render();
    });
  },
};

History.load();
Bus.on('round', e => History.add(e));
