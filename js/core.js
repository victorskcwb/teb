'use strict';

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* Sprites 3D (Microsoft Fluent Emoji, licença MIT) em assets/img */
const IMG = slug => `assets/img/${slug}.webp`;
const ico = (slug, cls = '') => `<img class="ico ${cls}" src="${IMG(slug)}" alt="" draggable="false">`;

/* Barramento de eventos simples (rodadas, nível, recompensas) */
const Bus = {
  map: {},
  /** Retorna uma função que cancela a inscrição. */
  on(ev, fn) {
    (this.map[ev] = this.map[ev] || []).push(fn);
    return () => { this.map[ev] = this.map[ev].filter(f => f !== fn); };
  },
  emit(ev, data) { (this.map[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); },
};

const round2 = n => Math.round(n * 100) / 100;
const fmt = n => (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtX = m => m.toFixed(2) + 'x';

/* RNG criptográfico (só para ficar "justo"; tudo é fictício) */
const RNG = {
  float() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 4294967296;
  },
  int(min, max) { return min + Math.floor(this.float() * (max - min + 1)); },
  pick(arr) { return arr[Math.floor(this.float() * arr.length)]; },
  weighted(items, key = 'w') {
    const total = items.reduce((s, i) => s + i[key], 0);
    let r = this.float() * total;
    for (const it of items) { r -= it[key]; if (r < 0) return it; }
    return items[items.length - 1];
  },
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.float() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
};

/* =========================================================
   Carteira (fichas fictícias, salvas no localStorage)
   ========================================================= */
const Wallet = {
  KEY: 'fichabet_wallet_v1',
  START: 1000,
  REFILL: 1000,
  REFILL_BELOW: 50,
  s: null,
  listeners: [],

  load() {
    try { this.s = JSON.parse(localStorage.getItem(this.KEY)); } catch { this.s = null; }
    if (!this.s || typeof this.s.balance !== 'number') this.reset(false);
    this.emit();
  },
  reset(emit = true) {
    this.s = { balance: this.START, wagered: 0, won: 0, rounds: 0, biggest: 0, refills: 0 };
    this.save(emit);
  },
  save(emit = true) {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.s)); } catch { /* sem storage: segue em memória */ }
    if (emit) this.emit();
  },
  emit() { this.listeners.forEach(f => f(this.s.balance)); },
  onChange(fn) { this.listeners.push(fn); },

  get balance() { return this.s.balance; },

  /** Debita uma aposta. Retorna false se não houver saldo. */
  bet(amount) {
    amount = round2(amount);
    if (!(amount > 0)) { UI.toast('Valor de aposta inválido', 'error'); return false; }
    if (amount > this.s.balance + 1e-9) { UI.toast('Saldo insuficiente', 'error'); Sfx.error(); return false; }
    this.s.balance = round2(this.s.balance - amount);
    this.s.wagered = round2(this.s.wagered + amount);
    this.s.rounds++;
    this.save();
    return true;
  },
  /** Credita um prêmio (valor total devolvido, incluindo a aposta). */
  win(amount) {
    amount = round2(amount);
    if (!(amount > 0)) return;
    this.s.balance = round2(this.s.balance + amount);
    this.s.won = round2(this.s.won + amount);
    this.s.biggest = Math.max(this.s.biggest, amount);
    this.save();
  },
  /** Devolve uma aposta não resolvida (ex.: saiu do jogo no meio da rodada). */
  refund(amount) {
    amount = round2(amount);
    if (!(amount > 0)) return;
    this.s.balance = round2(this.s.balance + amount);
    this.s.wagered = round2(Math.max(0, this.s.wagered - amount));
    this.s.rounds = Math.max(0, this.s.rounds - 1);
    this.save();
  },
  /** Crédito de bônus (check-in, missões, anúncios...). Não conta como prêmio de jogo. */
  credit(amount) {
    amount = round2(amount);
    if (!(amount > 0)) return;
    this.s.balance = round2(this.s.balance + amount);
    this.s.bonus = round2((this.s.bonus || 0) + amount);
    this.save();
  },
  canRefill() { return this.s.balance < this.REFILL_BELOW; },
  refill() {
    if (!this.canRefill()) return false;
    this.s.balance = round2(this.s.balance + this.REFILL);
    this.s.refills++;
    this.save();
    return true;
  },
};

/* =========================================================
   Sons: efeitos reais (Kenney.nl, CC0) em assets/audio/sfx.js,
   tocados via WebAudio. Se não carregarem, cai no sintetizador.
   ========================================================= */
const Sfx = {
  ac: null,
  muted: false,
  buffers: {},
  out: null,
  init() {
    try { this.muted = localStorage.getItem('fichabet_muted') === '1'; } catch { /* ignore */ }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.out = this.ac.createGain();
      this.out.connect(this.ac.destination);
    } catch { return; }
    // navegadores só liberam áudio após um gesto do usuário
    const unlock = () => { if (this.ac.state === 'suspended') this.ac.resume(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));
    const data = window.SFX_DATA || {};
    for (const [name, list] of Object.entries(data)) {
      this.buffers[name] = [];
      list.forEach(b64 => {
        const bin = atob(b64), buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        this.ac.decodeAudioData(buf.buffer).then(d => this.buffers[name].push(d)).catch(() => { /* ignora arquivo ruim */ });
      });
    }
  },
  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem('fichabet_muted', this.muted ? '1' : '0'); } catch { /* ignore */ }
    return this.muted;
  },
  /** Toca um efeito carregado. Retorna false se não existir (para usar o sintetizador). */
  play(name, vol = 0.6, rate = 1) {
    if (this.muted) return true;
    const list = this.buffers[name];
    if (!this.ac || !list || !list.length) return false;
    try {
      if (this.ac.state === 'suspended') this.ac.resume();
      const src = this.ac.createBufferSource(), g = this.ac.createGain();
      src.buffer = list[Math.floor(Math.random() * list.length)];
      src.playbackRate.value = rate;
      g.gain.value = vol;
      src.connect(g).connect(this.out);
      src.start();
    } catch { return false; }
    return true;
  },
  tone(freq, dur = 0.08, type = 'sine', vol = 0.05, delay = 0) {
    if (this.muted || !this.ac) return;
    try {
      const c = this.ac, o = c.createOscillator(), g = c.createGain();
      const t = c.currentTime + delay;
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.out);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch { /* sem áudio */ }
  },
  click() { this.play('click', 0.45) || this.tone(660, 0.04, 'square', 0.025); },
  tick() { this.play('tick', 0.3) || this.tone(1200, 0.025, 'square', 0.015); },
  reel() { this.play('reel', 0.55, 0.9 + Math.random() * 0.2) || this.tick(); },
  chip() { this.play('chip', 0.6) || (this.tone(900, 0.05, 'triangle', 0.04), this.tone(1300, 0.04, 'triangle', 0.03, 0.03)); },
  card() { this.play('card', 0.7) || this.chip(); },
  shuffle() { this.play('shuffle', 0.6) || this.chip(); },
  dice() { this.play('dice', 0.7) || this.chip(); },
  gem() { this.play('gem', 0.5, 0.95 + Math.random() * 0.15) || this.tone(1500, 0.08, 'triangle', 0.04); },
  scratch() { this.play('scratch', 0.35, 0.9 + Math.random() * 0.25); },
  claim() { this.play('claim', 0.6) || this.coin(); },
  error() { this.play('error', 0.5) || this.lose(); },
  win() { this.play('win', 0.55) || [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.06, i * 0.08)); this.play('coin', 0.35); },
  big() {
    if (!this.play('big', 0.7)) [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.07, i * 0.09));
    if (typeof Music !== 'undefined') Music.duck(2600);
    for (let i = 0; i < 6; i++) setTimeout(() => this.play('coin', 0.3, 0.9 + i * 0.05), 250 + i * 160);
  },
  jackpot() { this.play('jackpot', 0.75) || this.big(); if (typeof Music !== 'undefined') Music.duck(2500); },
  lose() { this.play('lose', 0.25) || (this.tone(220, 0.25, 'sawtooth', 0.035), this.tone(150, 0.3, 'sawtooth', 0.035, 0.12)); },
  coin() { this.play('coin', 0.6) || [1568, 2093].forEach((f, i) => this.tone(f, 0.09, 'triangle', 0.05, i * 0.06)); },
  levelUp() { if (typeof Music !== 'undefined') Music.duck(2000); this.play('level', 0.7) || [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'square', 0.035, i * 0.07)); },
  boom() { this.play('boom', 0.6) || (this.tone(90, 0.5, 'sawtooth', 0.08), this.tone(60, 0.6, 'square', 0.05, 0.05)); },
};

/* =========================================================
   Música ambiente: "Bossa Shop Theme" (springyspringo, CC0)
   ========================================================= */
const Music = {
  KEY: 'fichabet_music',
  VOL: 0.22,
  on: true,
  el: null,
  init() {
    try { this.on = localStorage.getItem(this.KEY) !== '0'; } catch { /* ignore */ }
    this.el = new Audio('assets/audio/bossa.mp3');
    this.el.loop = true;
    this.el.preload = 'auto';
    this.el.volume = this.VOL;
    // autoplay só depois de um gesto do usuário
    const start = () => {
      if (this.on) this.play();
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
    };
    document.addEventListener('pointerdown', start);
    document.addEventListener('keydown', start);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.el.pause(); if (this.override) this.override.stop(); } else if (this.on) this.play();
    });
  },
  /** Trilha que substitui a bossa (ex.: tema do slot aberto). */
  override: null,
  play() {
    if (this.override) { this.el.pause(); this.override.start(); return; }
    const p = this.el.play(); if (p) p.catch(() => { /* bloqueado até o próximo gesto */ });
  },
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem(this.KEY, this.on ? '1' : '0'); } catch { /* ignore */ }
    if (this.on) this.play(); else { this.el.pause(); if (this.override) this.override.stop(); }
    return this.on;
  },
  /** Abaixa a música por um tempo (vitórias, nível). */
  duck(ms = 2000) {
    if (!this.el) return;
    this.el.volume = this.VOL * 0.3;
    clearTimeout(this._duck);
    this._duck = setTimeout(() => { this.el.volume = this.VOL; }, ms);
  },
};

/* =========================================================
   Componentes de UI
   ========================================================= */
const UI = {
  /**
   * Aviso rápido. key: substitui o aviso anterior com a mesma chave (ex.: nível do passe).
   * No máximo TOAST_MAX na tela: os mais antigos saem quando chegam novos.
   */
  TOAST_MAX: 3,
  toast(msg, type = 'info', ms = 2200, key = '') {
    const box = $('#toasts');
    if (key) $$('.toast', box).forEach(t => { if (t.dataset.key === key) t.remove(); });
    const el = h(`<div class="toast ${type}"></div>`);
    el.textContent = msg;
    if (key) el.dataset.key = key;
    box.append(el);
    const live = $$('.toast:not(.out)', box);
    live.slice(0, Math.max(0, live.length - this.TOAST_MAX)).forEach(t => { t.classList.add('out'); setTimeout(() => t.remove(), 300); });
    setTimeout(() => el.classList.add('out'), ms);
    setTimeout(() => el.remove(), ms + 400);
  },

  modal(title, body) {
    const el = h(`
      <div class="modal-backdrop">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head"><h3></h3><button class="icon-btn close" aria-label="Fechar">✕</button></div>
          <div class="modal-body"></div>
        </div>
      </div>`);
    $('h3', el).textContent = title;
    const bodyEl = $('.modal-body', el);
    if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.append(body);
    const close = () => el.remove();
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('.close')) close(); });
    $('#modal-root').append(el);
    return { el, close };
  },

  /**
   * Confirmação dentro do jogo (substitui o confirm() do navegador, que o Safari pode
   * bloquear depois de várias janelas e só volta ao recarregar a página).
   * Resolve true no botão de confirmar; false ao cancelar/fechar.
   */
  ask(title, html, okLabel = 'Confirmar', okClass = 'btn-gold') {
    if ($('.modal-backdrop.ask')) return Promise.resolve(false);
    return new Promise(res => {
      const m = this.modal(title, `<div class="ask-body">${html}</div><div class="ask-btns"><button class="btn btn-ghost ask-no">Cancelar</button><button class="btn ${okClass} ask-yes">${okLabel}</button></div>`);
      m.el.classList.add('ask');
      let done = false;
      const end = v => { if (done) return; done = true; m.close(); res(v); };
      m.el.addEventListener('click', e => {
        if (e.target.closest('.ask-yes')) { Sfx.click(); end(true); }
        else if (e.target.closest('.ask-no') || e.target === m.el || e.target.closest('.close')) end(false);
      });
      setTimeout(() => { const b = $('.ask-yes', m.el); if (b) b.focus(); }, 30);
    });
  },

  /** Chuva de moedas/estrelas por cima da tela. */
  confetti(n = 40, sprites = ['coin', 'coin', 'star', 'gem']) {
    // no máximo 2 chuvas ao mesmo tempo (coletar várias coisas seguidas não enche a tela)
    const old = $$('.confetti');
    old.slice(0, Math.max(0, old.length - 1)).forEach(l => l.remove());
    const layer = h('<div class="confetti"></div>');
    for (let i = 0; i < n; i++) {
      const img = h(`<img src="${IMG(RNG.pick(sprites))}" alt="">`);
      const size = 18 + RNG.float() * 26;
      img.style.cssText = `left:${RNG.float() * 100}%;width:${size}px;animation-duration:${1.6 + RNG.float() * 1.6}s;animation-delay:${RNG.float() * 0.6}s;--rot:${RNG.int(-540, 540)}deg;--dx:${RNG.int(-80, 80)}px`;
      layer.append(img);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 4000);
  },

  /** Overlay de vitória grande. Com prêmio alto oferece "dobrar assistindo anúncio". */
  bigWin(amount, mult, { canDouble = true } = {}) {
    const label = mult >= 50 ? 'MEGA VITÓRIA' : mult >= 20 ? 'SUPER VITÓRIA' : 'GRANDE VITÓRIA';
    const el = h(`
      <div class="bigwin">
        <div class="bigwin-rays"></div>
        <div class="bigwin-coins">${Array.from({ length: window.LITE ? 10 : 28 }, () => `<img src="${IMG('coin')}" alt="" style="left:${Math.random() * 100}%;--d:${1.6 + Math.random() * 1.6}s;--dl:${Math.random() * 1.8}s;--s:${0.6 + Math.random() * 0.7}">`).join('')}</div>
        <div class="bigwin-inner">
          <img class="bigwin-img" src="${IMG(mult >= 50 ? 'trophy' : mult >= 20 ? 'moneybag' : 'coin')}" alt="">
          <div class="bigwin-title">${label}</div>
          <div class="bigwin-amount">🪙 0,00</div>
          <div class="bigwin-mult">${fmtX(mult)}</div>
          ${canDouble && typeof Ads !== 'undefined' ? `<button class="btn btn-ad bigwin-double">${ico('tv')} Dobrar prêmio <b>+🪙 ${fmt(amount)}</b><small>assistindo um anúncio</small></button>` : ''}
          <div class="bigwin-hint">toque para continuar</div>
        </div>
      </div>`);
    document.body.append(el);
    Sfx.big();
    UI.confetti(mult >= 20 ? 30 : 18);
    const amtEl = $('.bigwin-amount', el);
    const start = performance.now(), dur = 1400;
    const step = now => {
      const p = Math.min(1, (now - start) / dur);
      amtEl.textContent = '🪙 ' + fmt(amount * (1 - Math.pow(1 - p, 3)));
      if (p < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 300); };
    const dbl = $('.bigwin-double', el);
    el.addEventListener('click', async e => {
      if (!e.target.closest('.bigwin-double')) { close(); return; }
      dbl.disabled = true;
      close();
      if (await Ads.watch('Dobrar prêmio')) {
        Wallet.credit(amount);
        Sfx.big();
        UI.confetti(50);
        UI.toast(`Prêmio dobrado! +🪙 ${fmt(amount)}`, 'win', 3000);
      }
    });
    // com a oferta de dobrar, espera mais antes de fechar sozinho
    setTimeout(() => { if (el.isConnected && !el.classList.contains('out')) close(); }, dbl ? 9000 : 3500);
  },

  /** Campo de aposta livre: ½ · valor · 2× · Máx */
  betInput({ value = 10, min = 0.1, label = 'Aposta' } = {}) {
    const el = h(`
      <div class="bet-input">
        <label>${label}</label>
        <div class="bet-row">
          <button type="button" data-a="half">½</button>
          <input type="number" inputmode="decimal" min="${min}" step="0.1">
          <button type="button" data-a="double">2×</button>
          <button type="button" data-a="max">Máx</button>
        </div>
      </div>`);
    const input = $('input', el);
    const api = {
      el,
      get value() {
        const v = parseFloat(String(input.value).replace(',', '.'));
        return isFinite(v) && v >= min ? round2(v) : min;
      },
      set value(v) { input.value = String(round2(Math.max(min, Number(v) || min))); },
      setDisabled(d) { $$('button,input', el).forEach(b => { b.disabled = d; }); },
    };
    api.value = value;
    el.addEventListener('click', e => {
      const a = e.target.dataset.a;
      if (!a) return;
      Sfx.click();
      let v = api.value;
      if (a === 'half') v /= 2;
      if (a === 'double') v *= 2;
      if (a === 'max') v = Wallet.balance;
      api.value = Math.floor(v * 100) / 100;
    });
    input.addEventListener('change', () => { api.value = api.value; });
    return api;
  },

  /** Seletor de aposta em níveis (estilo slot): − valor + */
  betStepper(levels = [0.5, 1, 2, 3, 5, 10, 20, 50, 100, 200, 500], idx = 4) {
    const el = h(`
      <div class="bet-stepper">
        <button type="button" data-a="-" aria-label="Diminuir aposta">−</button>
        <div class="bet-val"><small>Aposta</small><b></b></div>
        <button type="button" data-a="+" aria-label="Aumentar aposta">+</button>
      </div>`);
    const b = $('b', el);
    const render = () => { b.textContent = fmt(levels[idx]); };
    el.addEventListener('click', e => {
      const a = e.target.dataset.a;
      if (!a) return;
      Sfx.click();
      idx = Math.max(0, Math.min(levels.length - 1, idx + (a === '+' ? 1 : -1)));
      render();
    });
    render();
    return {
      el,
      get value() { return levels[idx]; },
      setDisabled(d) { $$('button', el).forEach(x => { x.disabled = d; }); },
    };
  },

  /** Seletor de fichas para jogos de mesa. */
  chipSelector(values = [1, 5, 10, 25, 100, 500], selected = 10) {
    const el = h(`<div class="chips"></div>`);
    values.forEach(v => {
      const c = h(`<button type="button" class="chip chip-${v}" data-v="${v}">${v >= 1000 ? v / 1000 + 'k' : v}</button>`);
      if (v === selected) c.classList.add('sel');
      el.append(c);
    });
    el.addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      Sfx.chip();
      $$('.chip', el).forEach(x => x.classList.remove('sel'));
      c.classList.add('sel');
      selected = Number(c.dataset.v);
    });
    return {
      el,
      get value() { return selected; },
      setDisabled(d) { $$('button', el).forEach(x => { x.disabled = d; }); },
    };
  },

  /** Mostra resultado de vitória padrão (toast + som + overlay se for grande). */
  result(payout, stake) {
    if (payout > 0) {
      const mult = stake > 0 ? payout / stake : 0;
      if (mult >= 10 || (payout >= 300 && mult >= 3)) UI.bigWin(payout, mult);
      else {
        Sfx.win();
        // ganhos menores que a aposta só tocam o som (o valor já aparece na barra de ganho)
        if (mult >= 1) UI.toast(`Você ganhou 🪙 ${fmt(payout)}`, 'win', undefined, 'win');
      }
    } else {
      Sfx.lose();
    }
  },
};

/* =========================================================
   Contexto de jogo: timers e "sleeps" cancelados ao sair da tela.
   Ao sair, sleeps pendentes resolvem na hora para a rodada
   terminar e pagar o que deve, sem animação.
   ========================================================= */
class GameCtx {
  constructor(game) {
    this.game = game;
    this.alive = true;
    this._intervals = new Set();
    this._sleeps = new Set();
    this._cleanups = [];
  }
  sleep(ms) {
    if (!this.alive) return Promise.resolve();
    return new Promise(res => {
      const entry = { res };
      entry.t = setTimeout(() => { this._sleeps.delete(entry); res(); }, ms);
      this._sleeps.add(entry);
    });
  }
  interval(fn, ms) {
    if (!this.alive) return null;
    const t = setInterval(fn, ms);
    this._intervals.add(t);
    return t;
  }
  clear(t) { clearInterval(t); this._intervals.delete(t); }
  onUnmount(fn) { this._cleanups.push(fn); }
  /** Informa uma rodada resolvida (missões, XP, passe). base = aposta de referência p/ multiplicador. */
  round(stake, payout, base = stake, extra = {}) {
    const g = this.game || {};
    Bus.emit('round', { game: g.id, cat: g.category, studio: g.studio, stake: round2(stake), payout: round2(payout), base: round2(base), mult: base > 0 ? payout / base : 0, ...extra });
  }
  destroy() {
    this.alive = false;
    this._intervals.forEach(clearInterval);
    this._intervals.clear();
    this._cleanups.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    for (const s of this._sleeps) { clearTimeout(s.t); s.res(); }
    this._sleeps.clear();
  }
}

/* =========================================================
   Velocidade dos slots: Normal (mais lenta), Rápido e Turbo.
   Speed.f multiplica as esperas das animações; fica salvo.
   ========================================================= */
const Speed = {
  KEY: 'fichabet_speed',
  MODES: [
    { id: 'normal', label: '▶ Normal', f: 1.4 },
    { id: 'rapido', label: '⏩ Rápido', f: 1 },
    { id: 'turbo', label: '⚡ Turbo', f: 0.45 },
  ],
  i: 0,
  load() {
    let id = null;
    try { id = localStorage.getItem(this.KEY); } catch { /* ignore */ }
    this.i = Math.max(0, this.MODES.findIndex(m => m.id === id));
  },
  get mode() { return this.MODES[this.i]; },
  get f() { return this.mode.f; },
  get turbo() { return this.mode.id === 'turbo'; },
  /** Valor para o turbo ou o normal (o normal é esticado no modo mais lento). */
  pick(turboVal, normalVal) { return this.turbo ? turboVal : normalVal * this.f; },
  next() {
    this.i = (this.i + 1) % this.MODES.length;
    // dentro do bônus a troca vale só até ele acabar (não mexe na velocidade do jogo normal)
    if (!this.depth) { try { localStorage.setItem(this.KEY, this.mode.id); } catch { /* ignore */ } }
    Bus.emit('speed', this.mode);
  },
  /**
   * Roda um bônus (rodadas grátis, compra, recurso) sempre na velocidade Normal.
   * A velocidade do jogo normal fica guardada à parte e volta quando o bônus termina.
   */
  depth: 0,
  async bonus(fn) {
    if (this.depth++ === 0) {
      this.saved = this.i;
      if (this.i !== 0) { this.i = 0; Bus.emit('speed', this.mode); }
    }
    try { return await fn(); } finally {
      if (--this.depth === 0 && this.i !== this.saved) { this.i = this.saved; Bus.emit('speed', this.mode); }
    }
  },
  /** Liga um botão .toggle: mostra o modo atual e troca ao clicar. */
  bind(btn, ctx) {
    const paint = () => { btn.textContent = this.mode.label; btn.classList.toggle('on', this.mode.id !== 'normal'); btn.title = 'Velocidade do giro'; };
    paint();
    if (ctx) ctx.onUnmount(Bus.on('speed', paint));
    return paint;
  },
};
Speed.load();

/* =========================================================
   Registro de jogos
   ========================================================= */
const App = {
  games: [],
  register(game) {
    // slots de estúdio fora da seleção (js/games/lineup.js) não entram no lobby
    const L = typeof SLOT_LINEUP !== 'undefined' && game.studio && SLOT_LINEUP[game.studio];
    if (L && !L.includes(game.id)) return;
    this.games.push(game);
  },
};
