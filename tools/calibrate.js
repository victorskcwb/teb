#!/usr/bin/env node
/* =========================================================
   Calibração dos slots do SlotKit por simulação.
   Roda a lógica de cada jogo sem tela, mede o retorno e grava
   js/games/calib.js com: k (escala dos prêmios para o RTP alvo),
   buy (preço do bônus em x da aposta), hit (chance de ganho) e
   fs (frequência do bônus).

   Uso: node tools/calibrate.js [ids...] [--spins=400000] [--bonus=6000] [--verify]
   --verify só mede o RTP com o k já gravado (não altera calib.js).
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

const ROOT = path.join(__dirname, '..');
/** Retorno da compra de bônus (o jogo normal usa o target de cada slot). */
const BUY_RTP = 0.94;
const FILES = ['js/games/kit.js', 'js/games/templates.js', 'js/games/pragmatic.js', 'js/games/pgsoft.js', 'js/games/hacksaw.js', 'js/games/tada.js', 'js/games/nolimit.js', 'js/games/pragmatic2.js', 'js/games/pragmatic3.js', 'js/games/pgsoft2.js', 'js/games/pgsoft3.js', 'js/games/hacksaw2.js', 'js/games/hacksaw3.js', 'js/games/nolimit2.js', 'js/games/nolimit3.js', 'js/games/tada2.js', 'js/games/tada3.js'];
const OUT = path.join(ROOT, 'js/games/calib.js');

function loadGames() {
  const games = [];
  const ctx = {
    console, Math, Set, Map, Array, Object, Number, String, JSON, Promise, Symbol,
    round2: n => Math.round(n * 100) / 100,
    fmt: n => String(n),
    ico: () => '', IMG: s => s,
    RNG: {
      float: Math.random,
      int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
      pick(a) { return a[Math.floor(Math.random() * a.length)]; },
      weighted(items, key = 'w') {
        let t = 0;
        for (const i of items) t += i[key];
        let r = Math.random() * t;
        for (const i of items) { r -= i[key]; if (r < 0) return i; }
        return items[items.length - 1];
      },
      shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    },
    App: { register: g => games.push(g) },
    SlotInfo: { xs: x => x },
  };
  vm.createContext(ctx);
  for (const f of FILES) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8').replace(/^'use strict';/, '') + '\n;this.SlotKit = typeof SlotKit !== "undefined" ? SlotKit : this.SlotKit;', ctx, { filename: f });
  }
  return { games: games.filter(g => g.logic), SlotKit: ctx.SlotKit };
}

async function run(game, SlotKit, K, spins, bonusN) {
  const cfg = game.logic;
  const rt = SlotKit.simRT(cfg, K);
  // conta quantas vezes o giro normal entra no bônus
  let trig = 0, inBuy = false;
  const orig = cfg.bonus;
  cfg.bonus = function (...a) { if (!inBuy) trig++; return orig.apply(this, a); };
  let paid = 0, hits = 0, sq = 0;
  for (let i = 0; i < spins; i++) {
    rt.reset();
    await cfg.spin(rt);
    const w = Math.min(rt.total * K, cfg.maxWin);
    paid += w;
    sq += w * w;
    if (w > 0) hits++;
  }
  let bonus = 0;
  if (cfg.buy !== false && bonusN) {
    inBuy = true;
    for (let i = 0; i < bonusN; i++) {
      rt.reset();
      await cfg.bonus(rt, { buy: true });
      bonus += Math.min(rt.total * K, cfg.maxWin);
    }
    bonus /= bonusN;
  }
  cfg.bonus = orig;
  const mean = paid / spins;
  return { rtp: mean, sd: Math.sqrt(sq / spins - mean * mean), hit: hits / spins, fs: trig / spins, hold: (rt.stats.hold || 0) / spins, bonus };
}

async function calibrate(game, SlotKit, spins, bonusN) {
  const target = game.logic.target || 0.96;
  // passo 1 (rápido) acha a escala; passo 2 (completo) refina. O RTP é proporcional a k
  // (fora o teto de prêmio máximo), então k_novo = k × alvo / rtp medido.
  let K = 1;
  const r1 = await run(game, SlotKit, K, Math.max(20000, Math.floor(spins / 5)), Math.floor(bonusN / 5));
  if (!(r1.rtp > 0)) throw new Error(`${game.id}: RTP zero`);
  K *= target / r1.rtp;
  const fin = await run(game, SlotKit, K, spins, bonusN);
  const K2 = K * (target / fin.rtp);
  const s = K2 / K;
  // a compra de bônus devolve BUY_RTP (um pouco abaixo do jogo normal, como nos cassinos)
  const buy = game.logic.buy === false ? 0 : Math.max(10, Math.round((fin.bonus * s) / BUY_RTP));
  return { id: game.id, k: +K2.toPrecision(5), buy, hit: +fin.hit.toFixed(4), fs: +fin.fs.toPrecision(3), rtp: fin.rtp, se: fin.sd / Math.sqrt(spins), bonusAvg: fin.bonus * s, hold: fin.hold };
}

if (isMainThread) {
  const args = process.argv.slice(2);
  const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? Number(a.split('=')[1]) : null; };
  const spins = opt('spins') || 400000, bonusN = opt('bonus') || 6000;
  const only = args.filter(a => !a.startsWith('--'));
  const { games } = loadGames();
  const list = games.filter(g => !only.length || only.includes(g.id)).map(g => g.id);
  let calib = {};
  try { const src = fs.readFileSync(OUT, 'utf8'); calib = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1)); } catch { /* novo */ }
  const nW = Math.min(os.cpus().length, list.length);
  const queue = [...list];
  let active = 0;
  const done = () => {
    const ids = Object.keys(calib).sort();
    const body = '{\n' + ids.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(calib[id])}`).join(',\n') + '\n}';
    fs.writeFileSync(OUT, `'use strict';\n/* Gerado por tools/calibrate.js — não editar à mão.\n   k = escala dos prêmios, buy = preço do bônus (x aposta), hit = chance de ganho, fs = frequência do bônus. */\nconst SLOT_CALIB = ${body};\n`);
  };
  const next = () => {
    if (!queue.length) { if (!active && !args.includes('--verify')) done(); return; }
    const id = queue.shift();
    active++;
    const w = new Worker(__filename, { workerData: { id, spins, bonusN, verify: args.includes('--verify') ? calib[id] : null } });
    w.on('message', r => {
      if (r.verify) { console.log(`${r.id.padEnd(16)} verificação: rtp=${(r.rtp * 100).toFixed(2)}% ±${(r.se * 100).toFixed(2)} hit=${(r.hit * 100).toFixed(1)}%`); return; }
      calib[r.id] = { k: r.k, buy: r.buy, hit: r.hit, fs: r.fs };
      console.log(`${r.id.padEnd(14)} rtp=${(r.rtp * 100).toFixed(2)}% ±${(r.se * 100).toFixed(2)} k=${r.k} buy=${r.buy} (bônus médio ${r.bonusAvg.toFixed(1)}x) hit=${(r.hit * 100).toFixed(1)}% bônus=1/${r.fs ? Math.round(1 / r.fs) : '-'}${r.hold ? ` hold=1/${Math.round(1 / r.hold)}` : ''}`);
    });
    w.on('error', e => console.error(id, e));
    w.on('exit', () => { active--; next(); });
  };
  for (let i = 0; i < nW; i++) next();
} else {
  (async () => {
    const { games, SlotKit } = loadGames();
    const g = games.find(x => x.id === workerData.id);
    if (workerData.verify) {
      const r = await run(g, SlotKit, workerData.verify.k, workerData.spins, 0);
      parentPort.postMessage({ verify: true, id: g.id, rtp: r.rtp, se: r.sd / Math.sqrt(workerData.spins), hit: r.hit });
    } else parentPort.postMessage(await calibrate(g, SlotKit, workerData.spins, workerData.bonusN));
  })();
}
