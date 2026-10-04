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

/* Missões infinitas gerais: cada trilha tem níveis sem fim; o objetivo e a
   recompensa crescem a cada nível. Progresso que passa do objetivo sobra
   para o próximo nível. `abs` = progresso absoluto (contador total). */
const MISSION_TRACKS = [
  { id: 'spins', text: n => `Faça ${fmt0(n)} giros em slots`, base: 300, step: 180, inc: e => (e.cat === 'slots' && !e.buy ? 1 : 0), r: 5, xp: 200, art: 'slot' },
  { id: 'rounds', text: n => `Jogue ${fmt0(n)} rodadas em qualquer jogo`, base: 450, step: 270, inc: () => 1, r: 5, xp: 200, art: 'die' },
  { id: 'wins', text: n => `Vença ${fmt0(n)} rodadas`, base: 120, step: 75, inc: e => (e.payout > e.stake ? 1 : 0), r: 5, xp: 220, art: 'trophy' },
  { id: 'big', text: n => `Ganhe 10x ou mais ${n} vez${n > 1 ? 'es' : ''}`, base: 6, step: 4, inc: e => (e.mult >= 10 ? 1 : 0), r: 6, xp: 250, art: 'fire' },
  { id: 'huge', text: n => `Ganhe 100x ou mais ${n} vez${n > 1 ? 'es' : ''}`, base: 1, step: 1, inc: e => (e.mult >= 100 && !e.buy ? 1 : 0), r: 12, xp: 500, art: 'heartfire' },
  { id: 'bonus', text: n => `Ative ${n} bônus em slots girando (sem comprar)`, base: 6, step: 4, inc: e => (e.bonus ? 1 : 0), r: 8, xp: 300, art: 'gift' },
  { id: 'wager', text: n => `Aposte 🪙 ${fmt0(n)} no total`, base: 800, step: 600, units: true, inc: e => e.stake, r: 5, xp: 250, art: 'coin', money: true },
  { id: 'earn', text: n => `Receba 🪙 ${fmt0(n)} em prêmios`, base: 600, step: 480, units: true, inc: e => e.payout, r: 5, xp: 250, art: 'moneybag', money: true },
  { id: 'explore', text: n => `Jogue ${n} jogos diferentes (total)`, base: 5, step: 5, abs: s => s.played.length, r: 5, xp: 300, art: 'joker' },
  { id: 'mega', text: n => `Ganhe 50x ou mais ${n} vez${n > 1 ? 'es' : ''} em slots`, base: 1, step: 1, inc: e => (e.cat === 'slots' && e.mult >= 50 && !e.buy ? 1 : 0), r: 9, xp: 400, art: 'glowstar' },
];
/* Missões infinitas de cada slot: um ciclo de tipos que fica mais difícil a cada volta. */
const SLOT_QUESTS = [
  { k: 'spins', text: n => `Faça ${n} giros`, base: 50, step: 50, inc: e => (e.buy ? 0 : 1), art: 'slot' },
  { k: 'wins', text: n => `Vença ${n} giros`, base: 15, step: 12, inc: e => (e.payout > e.stake && !e.buy ? 1 : 0), art: 'trophy' },
  { k: 'bonus', text: n => `Ative o bônus ${n} vez${n > 1 ? 'es' : ''} girando`, base: 1, step: 1, inc: e => (e.bonus ? 1 : 0), art: 'gift', kit: true },
  { k: 'big', text: n => `Ganhe 10x ou mais ${n} vez${n > 1 ? 'es' : ''}`, base: 2, step: 1, inc: e => (e.mult >= 10 ? 1 : 0), art: 'fire' },
  { k: 'wager', text: n => `Aposte 🪙 ${fmt0(n)} neste jogo`, base: 120, step: 120, units: true, inc: e => e.stake, art: 'coin', money: true },
  { k: 'mega', text: n => `Ganhe ${n}x ou mais numa rodada`, base: 25, step: 25, inc: (e, n) => (e.mult >= n ? 1 : 0), one: true, art: 'heartfire' },
];
const fmt0 = n => Math.round(n).toLocaleString('pt-BR');
/** 0.025 → "2,5%" */
const pct = v => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
/** 1.1 → "x1,1" */
const xm = v => 'x' + v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const ALL_MISSIONS_BONUS = { fs: 5, xp: 300 };

const WHEEL_PRIZES = [
  { label: '100', coins: 100, w: 26, color: '#7c3aed' },
  { label: '3 FS', fs: 3, w: 16, color: '#db2777' },
  { label: '250', coins: 250, w: 20, color: '#2563eb' },
  { label: '200 XP', xp: 200, w: 14, color: '#0891b2' },
  { label: '500', coins: 500, w: 10, color: '#16a34a' },
  { label: '5 FS', fs: 5, w: 7, color: '#ea580c' },
  { label: '600', coins: 600, w: 5, color: '#ca8a04' },
  { label: '2.000', coins: 2000, w: 2, color: '#dc2626' },
];
const WHEEL_COOLDOWN = 4 * 3600000;

/* Níveis VIP: acompanham o nível do jogador (que nunca zera). Benefícios pequenos e permanentes. */
const VIP_TIERS = [
  { name: 'Bronze I', lvl: 1, art: 'medal3', cashback: 0.01, checkin: 1, color: '#d97706', reward: null },
  { name: 'Bronze II', lvl: 5, art: 'medal3', cashback: 0.02, checkin: 1.1, color: '#b45309', reward: { coins: 300, fs: 5 } },
  { name: 'Prata I', lvl: 10, art: 'medal2', cashback: 0.025, checkin: 1.2, color: '#cbd5e1', reward: { coins: 500, fs: 8 } },
  { name: 'Prata II', lvl: 20, art: 'medal2', cashback: 0.03, checkin: 1.3, color: '#94a3b8', reward: { coins: 800, fs: 10 } },
  { name: 'Ouro I', lvl: 30, art: 'medal', cashback: 0.04, checkin: 1.4, color: '#fbbf24', reward: { coins: 1200, fs: 12 } },
  { name: 'Ouro II', lvl: 45, art: 'medal', cashback: 0.045, checkin: 1.5, color: '#f59e0b', reward: { coins: 1600, fs: 15 } },
  { name: 'Platina', lvl: 60, art: 'crown', cashback: 0.05, checkin: 1.6, color: '#67e8f9', reward: { coins: 2200, fs: 18 } },
  { name: 'Diamante', lvl: 80, art: 'gem', cashback: 0.06, checkin: 1.8, color: '#c084fc', reward: { coins: 3000, fs: 22 } },
  { name: 'Mestre', lvl: 100, art: 'trophy', cashback: 0.07, checkin: 2, color: '#f472b6', reward: { coins: 4000, fs: 26 } },
  { name: 'Lenda', lvl: 130, art: 'dragon', cashback: 0.08, checkin: 2.2, color: '#ef4444', reward: { coins: 5000, fs: 30 } },
];
const CASHBACK_CAP = 5000;

/* Marcos do nível do jogador: no começo a cada 10 níveis, depois cada vez mais espaçados.
   A recompensa cresce devagar (cada marco ≈ uma sessão de jogo, nunca um saldo que tire a graça). */
const MILESTONE_GAPS = [10, 10, 10, 10, 10, 15, 15, 20, 25, 25, 30, 30, 40];
function milestoneLevel(i) {
  let lv = 0;
  for (let k = 0; k <= i; k++) lv += k < MILESTONE_GAPS.length ? MILESTONE_GAPS[k] : 50 + 10 * Math.floor((k - MILESTONE_GAPS.length) / 2);
  return lv;
}
function milestoneReward(i) {
  return { coins: Math.round((400 * (1 + 0.35 * i)) / 50) * 50, fs: Math.min(30, 5 + 2 * i) };
}

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
  AD_REWARD: 100,
  ADS_PER_DAY: 10,
  PREMIUM_PRICE: 5000,
  /** Versão da economia: ao mudar, migra o estado salvo sem despejar recompensas antigas. */
  ECON: 2,
  /** Missões pagam em apostas médias do jogador: quem aposta 2 ganha pouco, quem aposta 50 ganha mais (sempre proporcional). */
  MISSION_DAILY_DIV: 30,
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
      tracks: {}, slotq: {}, played: [],
      mile: null, econ: 0, avgBet: 2,
    };
    this.s = Object.assign(d, this.s || {});
    this.migrate();
    this.checkSeason();
    this.ensureMissions();
    this.save(false);
  },
  /** Economia v2: VIP passa a seguir o nível do jogador e os marcos começam do nível atual
      (nada de presentes retroativos para quem já jogava). */
  migrate() {
    if (this.s.econ >= this.ECON) return;
    const lv = this.player.level;
    if (!this.s.mile) this.s.mile = { from: this.s.totalXp > 0 ? lv : 0, claimed: [] };
    this.s.vipSeen = this.vipIndex();
    this.s.econ = this.ECON;
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
  /** XP do nível n ao n+1: cresce sempre; depois do 30 fica cada vez mais lento. */
  playerCost(n) { return 1000 + 400 * (n - 1) + (n > 30 ? 15 * (n - 30) * (n - 30) : 0); },
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
    if (level > this.PASS_LEVELS) return track === 'free' ? { coins: 100 } : { coins: 300, fs: 3 };
    if (track === 'free') {
      if (level % 5 === 0) return { fs: 3 + level / 5 };
      return { coins: 40 + level * 5 };
    }
    if (level === this.PASS_LEVELS) return { coins: 5000, fs: 50 };
    if (level % 5 === 0) return { coins: 150 * (level / 5), fs: 10 };
    return { coins: 80 + level * 15 };
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
    if (r.xp) parts.push(`${fmt0(r.xp)} XP`);
    Sfx.claim();
    Sfx.coin();
    UI.toast(`${why ? why + ': ' : ''}+${parts.join(' + ')}`, 'win', 2800, 'grant');
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
    this.grant(this.missionReward(def), 'Missão');
    return true;
  },
  /** Aposta média recente (média móvel das ~50 últimas rodadas), entre 🪙 1 e 🪙 200. */
  betUnit() { return Math.max(1, Math.min(200, this.s.avgBet || 2)); },
  /** Arredonda prêmios: inteiro até 100, de 5 em 5 até 1.000, depois de 10 em 10. */
  nice(v) { return v < 100 ? Math.max(1, Math.round(v)) : v < 1000 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10; },
  /** Recompensa de uma missão diária: proporcional à aposta média (XP inteiro). */
  missionReward(def) { return { coins: this.nice((this.betUnit() * def.coins) / this.MISSION_DAILY_DIV), xp: def.xp }; },
  /** Quantas recompensas de missão (diárias, baú, gerais e de slots) estão prontas. */
  missionsReady() {
    return this.missions().filter(m => m.done && !m.claimed).length + (this.allMissionsClaimed() && !this.s.missions.bonus ? 1 : 0)
      + this.tracks().filter(t => t.done).length + this.slotQuestsReady().length;
  },
  /** Coleta tudo de uma vez e entrega numa só recompensa (um aviso só). */
  claimAllMissions() {
    const acc = { coins: 0, fs: 0, xp: 0 };
    let n = 0;
    const add = r => { acc.coins += r.coins || 0; acc.fs += r.fs || 0; acc.xp += r.xp || 0; n++; };
    this.ensureMissions();
    for (const m of this.s.missions.list) {
      const def = this.missionDef(m.id);
      if (!m.claimed && m.p >= def.goal) { m.claimed = true; add(this.missionReward(def)); }
    }
    if (!this.s.missions.bonus && this.allMissionsClaimed()) { this.s.missions.bonus = true; add(ALL_MISSIONS_BONUS); }
    // uma trilha pode ter vários níveis prontos (o progresso que sobra passa para o próximo)
    for (let guard = 0; guard < 500; guard++) {
      const t = this.tracks().find(x => x.done);
      if (!t) break;
      const st = this.trackState(t.id);
      if (!t.abs) st.p = round2(st.p - t.goal);
      st.lv++;
      add(t.reward);
    }
    for (let guard = 0; guard < 500; guard++) {
      const q = this.slotQuestsReady()[0];
      if (!q) break;
      this.s.slotq[q.gid] = { lv: q.lv + 1, p: 0 };
      add(q.reward);
    }
    if (n) this.grant(acc, `${n} ${n > 1 ? 'missões' : 'missão'}`);
    return { n, ...acc };
  },
  allMissionsClaimed() { return this.s.missions.list.every(m => m.claimed); },
  claimMissionsBonus() {
    if (this.s.missions.bonus || !this.allMissionsClaimed()) return false;
    this.s.missions.bonus = true;
    this.grant(ALL_MISSIONS_BONUS, 'Baú das missões');
    return true;
  },

  /* ---------- missões infinitas gerais ---------- */
  trackDef(id) { return MISSION_TRACKS.find(t => t.id === id); },
  trackState(id) { return this.s.tracks[id] || (this.s.tracks[id] = { lv: 0, p: 0 }); },
  /** Meta do nível lv; metas em fichas (apostar/receber) são contadas em apostas médias. */
  trackGoal(t, lv) { const g = t.base + t.step * lv * (1 + lv / 25); return Math.round(t.units ? g * this.betUnit() : g); },
  /** Recompensa de nível lv (0 = primeiro): cresce devagar; a cada 5 níveis vem com rodadas grátis. */
  questReward(r0, xp, lv) {
    // r0 = prêmio em apostas médias; cresce 10% por nível (antes eram 30%, o que inflava o saldo)
    const r = { coins: this.nice(this.betUnit() * r0 * (1 + 0.1 * lv)), xp: Math.round(xp * (1 + 0.2 * lv)) };
    if ((lv + 1) % 5 === 0) r.fs = 3 + Math.floor(lv / 5);
    return r;
  },
  tracks() {
    return MISSION_TRACKS.map(t => {
      const st = this.trackState(t.id), goal = this.trackGoal(t, st.lv);
      const p = t.abs ? t.abs(this.s) : st.p;
      return { ...t, lv: st.lv, p, goal, text: t.text(goal), done: p >= goal, reward: this.questReward(t.r, t.xp, st.lv) };
    });
  },
  claimTrack(id) {
    const t = this.tracks().find(x => x.id === id);
    if (!t || !t.done) return false;
    const st = this.trackState(id);
    if (!t.abs) st.p = round2(st.p - t.goal);
    st.lv++;
    this.grant(t.reward, `Missão ${t.lv + 1}`);
    return true;
  },

  /* ---------- missões infinitas de cada slot ---------- */
  slotQuestList(g) { return SLOT_QUESTS.filter(q => !q.kit || (g && g.studio)); },
  slotQuest(gid) {
    const g = App.games.find(x => x.id === gid);
    if (!g) return null;
    const st = this.s.slotq[gid] || { lv: 0, p: 0 };
    const list = this.slotQuestList(g);
    const q = list[st.lv % list.length], tier = Math.floor(st.lv / list.length);
    const goal = Math.round((q.base + q.step * tier) * (q.units ? this.betUnit() : 1));
    const n = q.one ? 1 : goal;
    return { ...q, gid, game: g, lv: st.lv, p: st.p, goal: n, text: q.text(goal), done: st.p >= n, reward: this.questReward(3, 100, st.lv), tierGoal: goal };
  },
  claimSlotQuest(gid) {
    const q = this.slotQuest(gid);
    if (!q || !q.done) return false;
    this.s.slotq[gid] = { lv: q.lv + 1, p: 0 };
    this.grant(q.reward, `Missão ${q.game.name}`);
    return true;
  },
  /** Slots com missão pronta para coletar (para a página e os pontinhos). */
  slotQuestsReady() { return Object.keys(this.s.slotq).map(id => this.slotQuest(id)).filter(q => q && q.done); },

  onRound(e) {
    this.ensureMissions();
    // missões infinitas gerais
    if (e.game && !this.s.played.includes(e.game)) this.s.played.push(e.game);
    for (const t of MISSION_TRACKS) {
      if (!t.inc) continue;
      const st = this.trackState(t.id), goal = this.trackGoal(t, st.lv), was = st.p >= goal;
      st.p = round2(st.p + t.inc(e, this.s));
      if (!was && st.p >= goal) Bus.emit('missionDone', { text: t.text(goal) });
    }
    // missão do slot
    if (e.cat === 'slots' && e.game) {
      const q = this.slotQuest(e.game);
      if (q && !q.done) {
        const st = this.s.slotq[e.game] || (this.s.slotq[e.game] = { lv: 0, p: 0 });
        st.p = round2(st.p + Number(q.inc(e, q.tierGoal) || 0));
        if (st.p >= q.goal) Bus.emit('missionDone', { text: `${q.game.name}: ${q.text}` });
      }
    }
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
    if (e.stake > 0) this.s.avgBet = round2((this.s.avgBet || 2) * 0.98 + e.stake * 0.02);
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
  vipIndex(level = this.player.level) {
    let i = 0;
    VIP_TIERS.forEach((t, j) => { if (level >= t.lvl) i = j; });
    return i;
  },
  vipTier() { return VIP_TIERS[this.vipIndex()]; },
  vipNext() { return VIP_TIERS[this.vipIndex() + 1] || null; },
  vipPct() {
    const cur = this.vipTier(), next = this.vipNext(), pl = this.player;
    if (!next) return 100;
    return Math.min(100, ((pl.level - cur.lvl + pl.pct / 100) / (next.lvl - cur.lvl)) * 100);
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
  /* ---------- marcos do nível do jogador ---------- */
  /** Lista de marcos de first até o próximo ainda não alcançado (+ alguns à frente). */
  milestones(ahead = 3) {
    const lv = this.player.level, from = this.s.mile.from, out = [];
    for (let i = 0; out.length < 400; i++) {
      const at = milestoneLevel(i);
      const st = at <= from ? 'skip' : this.s.mile.claimed.includes(i) ? 'claimed' : at <= lv ? 'ready' : 'locked';
      out.push({ i, at, st, reward: milestoneReward(i) });
      if (at > lv && out.filter(m => m.st === 'locked').length >= ahead) break;
    }
    return out;
  },
  nextMilestone() { return this.milestones(1).find(m => m.st === 'locked'); },
  milestonesReady() { return this.milestones(0).filter(m => m.st === 'ready'); },
  claimMilestone(i) {
    const m = this.milestones(0).find(x => x.i === i);
    if (!m || m.st !== 'ready') return null;
    this.s.mile.claimed.push(i);
    this.grant(m.reward, `Marco do nível ${m.at}`);
    return m;
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
    const wh = (this.wheelIn() === 0 ? 1 : 0) + (this.freeScratch() ? 1 : 0) + (this.s.vip.pending > 0 ? 1 : 0) + this.milestonesReady().length;
    const ms = this.missionsReady();
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
    { art: 'ticket', title: 'Passe Premium', sub: '+25% de XP e uma trilha extra de recompensas.', c: ['#a855f7', '#4338ca'] },
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
      let done = false, askedClose = false;
      const tick = () => {
        if (!el.isConnected) return;
        const p = Math.min(1, (performance.now() - t0) / dur);
        bar.style.width = p * 100 + '%';
        if (!askedClose) cnt.textContent = p < 1 ? `Recompensa em ${Math.ceil((dur - (performance.now() - t0)) / 1000)}s` : 'Anúncio concluído ✅';
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
        // sem confirm() do navegador: o 1º toque avisa, o 2º fecha sem recompensa
        if (askedClose) { finish(false); return; }
        askedClose = true;
        cnt.textContent = '⚠️ Toque no ✕ de novo para fechar sem a recompensa';
        setTimeout(() => { askedClose = false; }, 3000);
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
  UI.toast(`⭐ Nível ${lvl} do passe! Recompensas liberadas`, 'level', 3200, 'pass-lvl');
});
Bus.on('vipup', t => {
  Sfx.jackpot();
  UI.confetti(80, [t.art, 'coin', 'star']);
  const body = h(`<div class="center vip-up"><img src="${IMG(t.art)}" alt=""><h2>Você agora é VIP ${t.name}!</h2>
    <p>Cashback semanal de <b>${pct(t.cashback)}</b> e bônus diário <b>${xm(t.checkin)}</b>.</p>
    ${t.reward ? `<p class="muted">Presente de boas-vindas: 🪙 ${fmt(t.reward.coins)} + ${t.reward.fs} rodadas grátis</p>` : ''}
    <a class="btn btn-gold" href="#/vip">Ver benefícios</a></div>`);
  setTimeout(() => UI.modal('Novo nível VIP', body), 600);
});
Bus.on('playerup', pl => {
  const m = Progress.milestonesReady().find(x => x.at === pl.level);
  if (m) setTimeout(() => UI.toast(`🏁 Marco do nível ${m.at} alcançado! Resgate 🪙 ${fmt(m.reward.coins)} + ${m.reward.fs} rodadas no seu perfil`, 'win', 4200), 2200);
});
Bus.on('missionDone', def => { Sfx.claim(); UI.toast(`🎯 Missão concluída: ${def.text}`, 'win', 3000, 'mission-done'); });
