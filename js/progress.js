'use strict';

/* =========================================================
   Progresso do jogador: XP / passe de temporada, missões diárias,
   check-in diário, roda de prêmios, anúncios (fictícios) e
   rodadas grátis. Tudo salvo no localStorage.
   ========================================================= */

const DAY_MS = 86400000;
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Nº do dia local (para comparar "ontem", sortear missões, temporadas). */
const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY_MS);
const fmtDur = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  if (d > 0) return `${d}d ${hh}h`;
  if (hh > 0) return `${hh}h ${String(mm).padStart(2, '0')}m`;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
/** PRNG determinístico (missões do dia iguais ao recarregar a página). */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Catálogo de recompensas ---------- */
const CHECKIN = [
  { coins: 100 },
  { coins: 150 },
  { coins: 200, fs: 3 },
  { coins: 300 },
  { coins: 400, fs: 5 },
  { coins: 500 },
  { coins: 1000, fs: 10 },
];

const MISSION_POOL = [
  { id: 'play30', text: 'Jogue 30 rodadas', goal: 30, inc: e => 1, coins: 150, xp: 120, art: 'die' },
  { id: 'slots25', text: 'Faça 25 giros em slots', goal: 25, inc: e => (e.cat === 'slots' ? 1 : 0), coins: 200, xp: 150, art: 'slot' },
  { id: 'win10', text: 'Vença 10 rodadas', goal: 10, inc: e => (e.payout > e.stake ? 1 : 0), coins: 200, xp: 150, art: 'trophy' },
  { id: 'mult5', text: 'Ganhe 5x ou mais numa rodada', goal: 1, inc: e => (e.mult >= 5 ? 1 : 0), coins: 150, xp: 120, art: 'fire' },
  { id: 'mult20', text: 'Ganhe 20x ou mais numa rodada', goal: 1, inc: e => (e.mult >= 20 ? 1 : 0), coins: 400, xp: 250, art: 'heartfire' },
  { id: 'wager500', text: 'Aposte 🪙 500 no total', goal: 500, inc: e => e.stake, coins: 200, xp: 150, art: 'coin', money: true },
  { id: 'earn300', text: 'Receba 🪙 300 em prêmios', goal: 300, inc: e => e.payout, coins: 200, xp: 150, art: 'moneybag', money: true },
  { id: 'games4', text: 'Jogue 4 jogos diferentes', goal: 4, inc: null, coins: 250, xp: 200, art: 'joker' },
  { id: 'streak3', text: 'Vença 3 rodadas seguidas', goal: 3, inc: null, coins: 250, xp: 200, art: 'star' },
  { id: 'crash2', text: 'Saque acima de 2x no Foguetinho (3x)', goal: 3, inc: e => (e.game === 'crash' && e.mult >= 2 ? 1 : 0), coins: 200, xp: 150, art: 'rocket' },
  { id: 'mines10', text: 'Jogue 10 rodadas de Mines', goal: 10, inc: e => (e.game === 'mines' ? 1 : 0), coins: 150, xp: 120, art: 'bomb' },
  { id: 'plinko25', text: 'Solte 25 bolinhas no Plinko', goal: 25, inc: e => (e.game === 'plinko' ? 1 : 0), coins: 150, xp: 120, art: 'ball8' },
  { id: 'doce15', text: 'Faça 15 giros no Doce Bonança', goal: 15, inc: e => (e.game === 'doce' ? 1 : 0), coins: 200, xp: 150, art: 'lollipop' },
  { id: 'olimpo15', text: 'Faça 15 giros nos Portões do Olimpo', goal: 15, inc: e => (e.game === 'olimpo' ? 1 : 0), coins: 200, xp: 150, art: 'voltage' },
  { id: 'tigre20', text: 'Faça 20 giros no Tigrinho', goal: 20, inc: e => (e.game === 'tigrinho' ? 1 : 0), coins: 150, xp: 120, art: 'tiger' },
  { id: 'mesa10', text: 'Jogue 10 rodadas de mesa ou ao vivo', goal: 10, inc: e => (e.cat === 'mesa' ? 1 : 0), coins: 200, xp: 150, art: 'cards' },
  { id: 'bj3', text: 'Vença 3 mãos de Blackjack', goal: 3, inc: e => (e.game === 'blackjack' && e.payout > e.stake ? 1 : 0), coins: 200, xp: 150, art: 'joker' },
  { id: 'double8', text: 'Jogue 8 rodadas de Double', goal: 8, inc: e => (e.game === 'double' ? 1 : 0), coins: 150, xp: 120, art: 'redcircle' },
  { id: 'torre5', text: 'Suba 5 andares na Torre numa rodada', goal: 1, inc: e => (e.game === 'torre' && e.floors >= 5 ? 1 : 0), coins: 200, xp: 150, art: 'castle' },
  { id: 'raspa3', text: 'Raspe 3 raspadinhas', goal: 3, inc: e => (e.game === 'raspadinha' ? 1 : 0), coins: 150, xp: 120, art: 'ticket' },
  { id: 'ads2', text: 'Assista 2 anúncios', goal: 2, inc: null, coins: 100, xp: 100, art: 'tv' },
];
const MISSIONS_PER_DAY = 5;
const ALL_MISSIONS_BONUS = { fs: 5, xp: 300 };

const WHEEL_PRIZES = [
  { label: '100', coins: 100, w: 26, color: '#7c3aed' },
  { label: '3 FS', fs: 3, w: 16, color: '#db2777' },
  { label: '250', coins: 250, w: 20, color: '#2563eb' },
  { label: '200 XP', xp: 200, w: 14, color: '#0891b2' },
  { label: '500', coins: 500, w: 10, color: '#16a34a' },
  { label: '5 FS', fs: 5, w: 7, color: '#ea580c' },
  { label: '1.000', coins: 1000, w: 5, color: '#ca8a04' },
  { label: '5.000', coins: 5000, w: 2, color: '#dc2626' },
];
const WHEEL_COOLDOWN = 4 * 3600000;

/* Níveis VIP pelo XP total (não zera entre temporadas) */
const VIP_TIERS = [
  { name: 'Bronze', xp: 0, art: 'medal3', cashback: 0.05, checkin: 1, color: '#d97706', reward: null },
  { name: 'Prata', xp: 2500, art: 'medal2', cashback: 0.07, checkin: 1.25, color: '#cbd5e1', reward: { coins: 1000, fs: 5 } },
  { name: 'Ouro', xp: 10000, art: 'medal', cashback: 0.10, checkin: 1.5, color: '#fbbf24', reward: { coins: 3000, fs: 10 } },
  { name: 'Platina', xp: 30000, art: 'crown', cashback: 0.12, checkin: 2, color: '#67e8f9', reward: { coins: 8000, fs: 20 } },
  { name: 'Diamante', xp: 75000, art: 'gem', cashback: 0.15, checkin: 3, color: '#c084fc', reward: { coins: 20000, fs: 50 } },
];
const CASHBACK_CAP = 25000;

/* Patentes do nível do jogador (a cada 10 níveis). Depois do 100: Mito ★1, ★2... */
const PLAYER_RANKS = [
  { name: 'Novato', art: 'sparkles', color: '#94a3b8' },
  { name: 'Aprendiz', art: 'medal3', color: '#d97706' },
  { name: 'Apostador', art: 'medal2', color: '#cbd5e1' },
  { name: 'Veterano', art: 'medal', color: '#fbbf24' },
  { name: 'Profissional', art: 'trophy', color: '#f59e0b' },
  { name: 'Especialista', art: 'star', color: '#38bdf8' },
  { name: 'Mestre', art: 'crown', color: '#a78bfa' },
  { name: 'Grão-Mestre', art: 'gem', color: '#c084fc' },
  { name: 'Lenda', art: 'fire', color: '#f97316' },
  { name: 'Ídolo', art: 'glowstar', color: '#facc15' },
  { name: 'Mito', art: 'dragon', color: '#ef4444' },
];

/* =========================================================
   Store
   ========================================================= */
const Progress = {
  KEY: 'fichabet_progress_v1',
  PASS_LEVELS: 50,          // níveis principais; depois deles o passe continua infinito
  PASS_EXTRA_COST: 4000,    // XP por nível além do 50

  SEASON_DAYS: 28,
  FS_BET: 2,
  AD_REWARD: 250,
  ADS_PER_DAY: 10,
  PREMIUM_PRICE: 3000,
  s: null,

  load() {
    try { this.s = JSON.parse(localStorage.getItem(this.KEY)); } catch { this.s = null; }
    const d = {
      xp: 0, season: this.seasonNum(), premium: false, claimed: { free: [], prem: [] },
      checkin: { last: null, streak: 0 },
      missions: { day: null, list: [], bonus: false, games: [], streak: 0 },
      ads: { day: null, count: 0 },
      fs: 0, wheelAt: 0, recent: [], totalXp: 0,
      vip: { week: this.weekNum(), net: 0, pending: 0 }, vipSeen: 0,
      scratch: { day: null },
    };
    this.s = Object.assign(d, this.s || {});
    this.checkSeason();
    this.ensureMissions();
    this.save(false);
  },
  save(emit = true) {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.s)); } catch { /* ignore */ }
    if (emit) Bus.emit('progress');
  },

  /* ---------- temporada / XP ---------- */
  seasonNum() { return Math.floor(dayNum() / this.SEASON_DAYS); },
  seasonEndsIn() {
    const endDay = (this.seasonNum() + 1) * this.SEASON_DAYS;
    const now = new Date();
    return (endDay - dayNum(now)) * DAY_MS - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000;
  },
  checkSeason() {
    const n = this.seasonNum();
    if (this.s.season !== n) {
      Object.assign(this.s, { season: n, xp: 0, premium: false, claimed: { free: [], prem: [] } });
    }
  },
  /** XP para ir do nível L do passe ao L+1: cresce até o 50 e depois fica fixo. */
  passCost(L) { return L < this.PASS_LEVELS ? 500 + 60 * (L - 1) : this.PASS_EXTRA_COST; },
  /** { level, into, need } a partir de um total de XP e uma função de custo. */
  levelFrom(xp, cost) {
    let level = 1, rest = xp;
    while (rest >= cost(level)) { rest -= cost(level); level++; }
    return { level, into: rest, need: cost(level) };
  },
  get passInfo() { return this.levelFrom(this.s.xp, l => this.passCost(l)); },
  get level() { return this.passInfo.level; },
  get levelPct() { const i = this.passInfo; return (i.into / i.need) * 100; },

  /* ---------- nível do jogador (infinito, nunca zera) ---------- */
  playerCost(n) { return 1000 + 400 * (n - 1); },
  get player() {
    const i = this.levelFrom(this.s.totalXp, n => this.playerCost(n));
    return { ...i, pct: (i.into / i.need) * 100, rank: this.rankOf(i.level) };
  },
  /** Patente pelo nível do jogador: troca a cada 10 níveis; depois do 100 vira Mito com estrelas. */
  rankOf(level) {
    const R = PLAYER_RANKS;
    const idx = Math.min(R.length - 1, Math.floor((level - 1) / 10));
    const r = R[idx];
    const stars = level > 100 ? Math.floor((level - 101) / 10) + 1 : 0;
    const div = level <= 100 ? ['I', 'II', 'III', 'IV', 'V'][Math.floor(((level - 1) % 10) / 2)] : '';
    return { ...r, idx, stars, label: stars ? `${r.name} ★${stars}` : `${r.name} ${div}`, nextAt: level <= 100 ? (idx + 1) * 10 + 1 : (stars) * 10 + 101 };
  },
  addXp(n) {
    this.checkSeason();
    n = Math.round(n * (this.s.premium ? 1.25 : 1));
    if (n <= 0) return;
    const before = this.level, pBefore = this.player.level;
    this.s.xp += n;
    this.s.totalXp += n;
    this.save();
    this.checkVipUp();
    const after = this.level, pAfter = this.player.level;
    if (after > before) Bus.emit('levelup', after);
    if (pAfter > pBefore) Bus.emit('playerup', this.player);
  },

  passReward(level, track) {
    // além do nível 50 a recompensa é sempre a mesma
    if (level > this.PASS_LEVELS) return track === 'free' ? { coins: 500 } : { coins: 1500, fs: 3 };
    if (track === 'free') {
      if (level % 5 === 0) return { fs: 3 + level / 5 };
      return { coins: 150 + level * 20 };
    }
    if (level === this.PASS_LEVELS) return { coins: 25000, fs: 50 };
    if (level % 5 === 0) return { coins: 600 * (level / 5), fs: 10 };
    return { coins: 300 + level * 50 };
  },
  canClaimPass(level, track) {
    if (level > this.level) return false;
    if (track === 'prem' && !this.s.premium) return false;
    return !this.s.claimed[track].includes(level);
  },
  claimPass(level, track) {
    if (!this.canClaimPass(level, track)) return null;
    this.s.claimed[track].push(level);
    const r = this.passReward(level, track);
    this.grant(r, `Passe nível ${level}`);
    return r;
  },
  claimAllPass() {
    const got = { coins: 0, fs: 0 };
    for (let l = 1; l <= this.level; l++) {
      for (const t of ['free', 'prem']) {
        if (!this.canClaimPass(l, t)) continue;
        this.s.claimed[t].push(l);
        const r = this.passReward(l, t);
        got.coins += r.coins || 0; got.fs += r.fs || 0;
      }
    }
    if (got.coins || got.fs) this.grant(got, 'Passe');
    return got;
  },
  buyPremium() {
    if (this.s.premium) return false;
    if (!Wallet.bet(this.PREMIUM_PRICE)) return false;
    // compra do passe não é aposta: desfaz as estatísticas de aposta
    Wallet.s.wagered = round2(Wallet.s.wagered - this.PREMIUM_PRICE);
    Wallet.s.rounds = Math.max(0, Wallet.s.rounds - 1);
    Wallet.save();
    this.s.premium = true;
    this.save();
    return true;
  },

  /** Entrega uma recompensa { coins, fs, xp } com feedback. */
  grant(r, why = '') {
    if (r.coins) Wallet.credit(r.coins);
    if (r.fs) this.s.fs += r.fs;
    this.save();
    if (r.xp) this.addXp(r.xp / (this.s.premium ? 1.25 : 1)); // XP de recompensa não recebe o bônus premium
    const parts = [];
    if (r.coins) parts.push(`🪙 ${fmt(r.coins)}`);
    if (r.fs) parts.push(`${r.fs} rodadas grátis`);
    if (r.xp) parts.push(`${r.xp} XP`);
    Sfx.claim();
    Sfx.coin();
    UI.toast(`${why ? why + ': ' : ''}+${parts.join(' + ')}`, 'win', 2800);
  },

  /* ---------- check-in diário ---------- */
  checkinStatus() {
    const today = dayNum(), last = this.s.checkin.last;
    const claimedToday = last === today;
    const keeps = last === today - 1 || claimedToday;
    const streak = keeps ? this.s.checkin.streak : 0;          // dias seguidos já coletados
    const nextIdx = claimedToday ? (streak - 1) % 7 : streak % 7; // dia do calendário (hoje)
    return { claimedToday, streak, nextIdx, canClaim: !claimedToday };
  },
  claimCheckin() {
    const st = this.checkinStatus();
    if (!st.canClaim) return null;
    const base = CHECKIN[st.nextIdx];
    const reward = { ...base, coins: Math.round(base.coins * this.vipTier().checkin) };
    this.s.checkin = { last: dayNum(), streak: st.streak + 1 };
    this.grant(reward, `Check-in dia ${st.nextIdx + 1}`);
    return reward;
  },

  /* ---------- missões diárias ---------- */
  ensureMissions() {
    const today = dayNum();
    const m = this.s.missions;
    if (m.day === today && m.list.length) return;
    const rnd = seeded(today * 7919);
    const pool = MISSION_POOL.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    // sempre uma missão "geral" fácil para ninguém ficar travado
    const pick = [MISSION_POOL[0], ...pool.filter(x => x.id !== 'play30').slice(0, MISSIONS_PER_DAY - 1)];
    this.s.missions = { day: today, list: pick.map(x => ({ id: x.id, p: 0, claimed: false })), bonus: false, games: [], streak: 0 };
  },
  missionDef(id) { return MISSION_POOL.find(m => m.id === id); },
  missions() {
    this.ensureMissions();
    return this.s.missions.list.map(m => ({ ...this.missionDef(m.id), ...m, done: m.p >= this.missionDef(m.id).goal }));
  },
  bumpMission(id, amount = 1, set = null) {
    const m = this.s.missions.list.find(x => x.id === id);
    if (!m || m.claimed) return;
    const def = this.missionDef(id);
    const was = m.p >= def.goal;
    m.p = set !== null ? Math.max(m.p, set) : round2(m.p + amount);
    if (!was && m.p >= def.goal) Bus.emit('missionDone', def);
  },
  claimMission(id) {
    const m = this.s.missions.list.find(x => x.id === id);
    const def = this.missionDef(id);
    if (!m || m.claimed || m.p < def.goal) return false;
    m.claimed = true;
    this.grant({ coins: def.coins, xp: def.xp }, 'Missão');
    return true;
  },
  allMissionsClaimed() { return this.s.missions.list.every(m => m.claimed); },
  claimMissionsBonus() {
    if (this.s.missions.bonus || !this.allMissionsClaimed()) return false;
    this.s.missions.bonus = true;
    this.grant(ALL_MISSIONS_BONUS, 'Baú das missões');
    return true;
  },

  onRound(e) {
    this.ensureMissions();
    this.rollWeek();
    this.s.vip.net = round2(this.s.vip.net + e.stake - e.payout);
    const ms = this.s.missions;
    for (const m of ms.list) {
      const def = this.missionDef(m.id);
      if (def.inc) this.bumpMission(m.id, def.inc(e));
    }
    if (e.game && !ms.games.includes(e.game)) ms.games.push(e.game);
    this.bumpMission('games4', 0, ms.games.length);
    ms.streak = e.payout > e.stake ? ms.streak + 1 : 0;
    this.bumpMission('streak3', 0, ms.streak);
    // jogados recentemente
    if (e.game) this.s.recent = [e.game, ...this.s.recent.filter(g => g !== e.game)].slice(0, 8);
    // XP: um pouco por rodada + raiz da aposta (não premia só apostas enormes)
    const xp = e.stake > 0 ? Math.round(2 + Math.sqrt(e.stake) * 1.5) : 2;
    this.save(false);
    this.addXp(xp);
  },

  /* ---------- VIP / cashback semanal ---------- */
  /** Semanas começam na segunda-feira (dia 0 da época foi uma quinta). */
  weekNum() { return Math.floor((dayNum() + 3) / 7); },
  weekEndsIn() {
    const now = new Date();
    const daysLeft = (this.weekNum() + 1) * 7 - 3 - dayNum(now);
    return daysLeft * DAY_MS - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000;
  },
  vipIndex(xp = this.s.totalXp) {
    let i = 0;
    VIP_TIERS.forEach((t, j) => { if (xp >= t.xp) i = j; });
    return i;
  },
  vipTier() { return VIP_TIERS[this.vipIndex()]; },
  vipNext() { return VIP_TIERS[this.vipIndex() + 1] || null; },
  vipPct() {
    const cur = this.vipTier(), next = this.vipNext();
    if (!next) return 100;
    return ((this.s.totalXp - cur.xp) / (next.xp - cur.xp)) * 100;
  },
  checkVipUp() {
    const i = this.vipIndex();
    if (i <= this.s.vipSeen) return;
    for (let j = this.s.vipSeen + 1; j <= i; j++) {
      this.s.vipSeen = j;
      const t = VIP_TIERS[j];
      if (t.reward) this.grant(t.reward, `VIP ${t.name}`);
      Bus.emit('vipup', t);
    }
    this.save();
  },
  /** Na virada da semana, as perdas líquidas viram cashback para resgatar. */
  rollWeek() {
    const w = this.weekNum(), v = this.s.vip;
    if (v.week === w) return;
    if (v.net > 0) v.pending = Math.min(CASHBACK_CAP, round2(v.pending + v.net * this.vipTier().cashback));
    v.week = w;
    v.net = 0;
    this.save(false);
  },
  cashbackEstimate() { this.rollWeek(); return Math.min(CASHBACK_CAP, round2(Math.max(0, this.s.vip.net) * this.vipTier().cashback)); },
  claimCashback() {
    this.rollWeek();
    const amt = this.s.vip.pending;
    if (!(amt > 0)) return 0;
    this.s.vip.pending = 0;
    this.grant({ coins: amt }, 'Cashback');
    return amt;
  },

  /* ---------- raspadinha grátis do dia ---------- */
  freeScratch() { return this.s.scratch.day !== dayNum(); },
  useFreeScratch() {
    if (!this.freeScratch()) return false;
    this.s.scratch.day = dayNum();
    this.save();
    return true;
  },

  /* ---------- anúncios (fictícios) ---------- */
  adsLeft() {
    if (this.s.ads.day !== dayNum()) this.s.ads = { day: dayNum(), count: 0 };
    return this.ADS_PER_DAY - this.s.ads.count;
  },
  /** Assiste um anúncio e recebe fichas (respeita o limite diário). */
  async adForCoins() {
    if (this.adsLeft() <= 0) { UI.toast('Limite de anúncios de hoje atingido. Volte amanhã!', 'error'); return false; }
    if (!(await Ads.watch(`+🪙 ${fmt(this.AD_REWARD)}`))) return false;
    this.s.ads.count++;
    this.grant({ coins: this.AD_REWARD }, 'Anúncio');
    return true;
  },
  onAd() {
    this.adsLeft();
    this.bumpMission('ads2', 1);
    this.save();
  },

  /* ---------- rodadas grátis (valem em qualquer slot) ---------- */
  useFreeSpin() {
    if (this.s.fs <= 0) return false;
    this.s.fs--;
    this.save();
    return true;
  },

  /* ---------- roda de prêmios ---------- */
  wheelIn() { return Math.max(0, this.s.wheelAt - Date.now()); },
  spinWheel() {
    if (this.wheelIn() > 0) return null;
    const idx = WHEEL_PRIZES.indexOf(RNG.weighted(WHEEL_PRIZES));
    this.s.wheelAt = Date.now() + WHEEL_COOLDOWN;
    this.save();
    return idx;
  },

  /** Contadores para os "pontinhos vermelhos" de notificação. */
  pending() {
    const ck = this.checkinStatus().canClaim ? 1 : 0;
    const wh = (this.wheelIn() === 0 ? 1 : 0) + (this.freeScratch() ? 1 : 0) + (this.s.vip.pending > 0 ? 1 : 0);
    const ms = this.missions().filter(m => m.done && !m.claimed).length + (this.allMissionsClaimed() && !this.s.missions.bonus ? 1 : 0);
    let ps = 0;
    for (let l = 1; l <= this.level; l++) ps += (this.canClaimPass(l, 'free') ? 1 : 0) + (this.canClaimPass(l, 'prem') ? 1 : 0);
    return { bonus: ck + wh, missions: ms, pass: ps };
  },
};

/* =========================================================
   Anúncios fictícios: hoje é só uma tela simulada com contagem.
   Ads.watch() resolve true se o "anúncio" foi assistido até o fim.
   ========================================================= */
const Ads = {
  DURATION: 5,
  SPOTS: [
    { art: 'lollipop', title: 'Doce Bonança', sub: 'Multiplicadores de até 100x caindo do céu!', c: ['#ec4899', '#f97316'] },
    { art: 'voltage', title: 'Portões do Olimpo', sub: 'Zeus está distribuindo raios de multiplicador!', c: ['#6366f1', '#0ea5e9'] },
    { art: 'tiger', title: 'Tigrinho da Sorte', sub: 'A Carta do Tigre pode encher a tela!', c: ['#f59e0b', '#b91c1c'] },
    { art: 'ticket', title: 'Passe Premium', sub: '+25% de XP e recompensas em dobro.', c: ['#a855f7', '#4338ca'] },
    { art: 'gift', title: 'Bônus diário', sub: 'Volte todo dia: no 7º dia são 🪙 1.000 + 10 rodadas!', c: ['#10b981', '#0e7490'] },
  ],
  watch(reason = 'Recompensa') {
    return new Promise(resolve => {
      const spot = RNG.pick(this.SPOTS);
      const el = h(`
        <div class="ad-backdrop">
          <div class="ad-box" style="--c1:${spot.c[0]};--c2:${spot.c[1]}">
            <div class="ad-top"><span class="ad-tag">ANÚNCIO FICTÍCIO</span><span class="ad-reason"></span><button class="ad-close" aria-label="Fechar">✕</button></div>
            <div class="ad-stage">
              <img class="ad-art" src="${IMG(spot.art)}" alt="">
              <div class="ad-title">${spot.title}</div>
              <div class="ad-sub">${spot.sub}</div>
            </div>
            <div class="ad-bar"><i></i></div>
            <div class="ad-foot"><span class="ad-count"></span><button class="btn btn-success ad-claim" disabled>Receber recompensa</button></div>
          </div>
        </div>`);
      $('.ad-reason', el).textContent = reason;
      document.body.append(el);
      const bar = $('.ad-bar i', el), cnt = $('.ad-count', el), claim = $('.ad-claim', el);
      const t0 = performance.now(), dur = this.DURATION * 1000;
      let done = false;
      const tick = () => {
        if (!el.isConnected) return;
        const p = Math.min(1, (performance.now() - t0) / dur);
        bar.style.width = p * 100 + '%';
        cnt.textContent = p < 1 ? `Recompensa em ${Math.ceil((dur - (performance.now() - t0)) / 1000)}s` : 'Anúncio concluído ✅';
        if (p >= 1 && !done) { done = true; claim.disabled = false; Sfx.chip(); }
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const finish = ok => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 250);
        if (ok) Progress.onAd();
        resolve(ok);
      };
      claim.addEventListener('click', () => finish(true));
      $('.ad-close', el).addEventListener('click', () => {
        if (done) { finish(true); return; }
        if (confirm('Se fechar agora, você perde a recompensa. Fechar mesmo assim?')) finish(false);
      });
    });
  },
};

/* =========================================================
   Barra de rodadas grátis para os slots.
   fsBar.active → giro atual é grátis (aposta fixa FS_BET).
   ========================================================= */
function freeSpinBar(ctx, onToggle = () => {}) {
  const el = h(`<div class="fs-bar hidden">${ico('gift')}<div class="fs-text"></div><button class="btn btn-gold fs-use"></button></div>`);
  const text = $('.fs-text', el), btn = $('.fs-use', el);
  const api = {
    el,
    active: false,
    render() {
      const n = Progress.s.fs;
      if (n <= 0) api.active = false;
      el.classList.toggle('hidden', n <= 0);
      el.classList.toggle('on', api.active);
      text.innerHTML = api.active
        ? `<b>${n}</b> rodada${n > 1 ? 's' : ''} grátis restante${n > 1 ? 's' : ''} · aposta 🪙 ${fmt(Progress.FS_BET)}`
        : `Você tem <b>${n}</b> rodada${n > 1 ? 's' : ''} grátis!`;
      btn.textContent = api.active ? 'Pausar' : 'Usar agora';
    },
    setDisabled(d) { btn.disabled = d; },
  };
  btn.addEventListener('click', () => { Sfx.click(); api.active = !api.active; api.render(); onToggle(api.active); });
  ctx.onUnmount(Bus.on('progress', () => api.render()));
  api.render();
  return api;
}

/* Liga as rodadas ao progresso e celebra subidas de nível */
Bus.on('round', e => Progress.onRound(e));
Bus.on('levelup', lvl => {
  Sfx.levelUp();
  UI.confetti(35, ['star', 'sparkles', 'coin']);
  UI.toast(`⭐ Nível ${lvl} do passe! Recompensas liberadas`, 'level', 3200);
});
Bus.on('vipup', t => {
  Sfx.jackpot();
  UI.confetti(80, [t.art, 'coin', 'star']);
  const body = h(`<div class="center vip-up"><img src="${IMG(t.art)}" alt=""><h2>Você agora é VIP ${t.name}!</h2>
    <p>Cashback semanal de <b>${Math.round(t.cashback * 100)}%</b> e bônus diário <b>x${t.checkin}</b>.</p>
    ${t.reward ? `<p class="muted">Presente de boas-vindas: 🪙 ${fmt(t.reward.coins)} + ${t.reward.fs} rodadas grátis</p>` : ''}
    <a class="btn btn-gold" href="#/vip">Ver benefícios</a></div>`);
  setTimeout(() => UI.modal('Novo nível VIP', body), 600);
});
Bus.on('missionDone', def => { Sfx.claim(); UI.toast(`🎯 Missão concluída: ${def.text}`, 'win', 3000); });
