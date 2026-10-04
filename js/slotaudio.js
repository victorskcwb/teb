'use strict';

/* =========================================================
   Áudio dos slots de estúdio
   - Trilha temática gerada na hora (WebAudio): cada tema tem
     escala, andamento, timbre e percussão próprios (pentatônica
     chinesa, frígia egípcia, blues de faroeste, drone sombrio...).
     Ao entrar num slot ela substitui a bossa do lobby.
   - Efeitos por evento (giro, parada do rolo, scatter, cascata,
     multiplicador, bônus, vitória) com sons CC0 do Kenney/OpenGameArt
     (assets/audio/slotsfx.js) escolhidos pelo tema.
   ========================================================= */
const SlotAudio = (() => {
  // escalas em semitons a partir da tônica
  const SC = {
    pentaMaj: [0, 2, 4, 7, 9], pentaMin: [0, 3, 5, 7, 10], major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10],
    harmMin: [0, 2, 3, 5, 7, 8, 11], phrygDom: [0, 1, 4, 5, 7, 8, 10], blues: [0, 3, 5, 6, 7, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
    inSen: [0, 1, 5, 7, 10], raga: [0, 1, 4, 5, 7, 8, 11], lydian: [0, 2, 4, 6, 7, 9, 11], locrian: [0, 1, 3, 5, 6, 8, 10],
  };
  /* tema: escala, tônica (Hz), bpm, timbre do solo, baixo, percussão, densidade do solo, jingle */
  const T = {
    china: { sc: 'pentaMaj', root: 294, bpm: 92, lead: 'pluck', bass: 'soft', perc: 'wood', dens: 0.55, jingle: 'j_pizzi' },
    japan: { sc: 'inSen', root: 277, bpm: 78, lead: 'koto', bass: 'none', perc: 'taiko', dens: 0.4, jingle: 'j_pizzi' },
    egypt: { sc: 'phrygDom', root: 220, bpm: 98, lead: 'reed', bass: 'drone', perc: 'darbuka', dens: 0.55, jingle: 'j_pizzi' },
    arabia: { sc: 'phrygDom', root: 247, bpm: 112, lead: 'reed', bass: 'drone', perc: 'darbuka', dens: 0.6, jingle: 'j_pizzi' },
    india: { sc: 'raga', root: 262, bpm: 90, lead: 'sitar', bass: 'drone', perc: 'tabla', dens: 0.5, jingle: 'j_pizzi' },
    western: { sc: 'blues', root: 196, bpm: 96, lead: 'twang', bass: 'walk', perc: 'shuffle', dens: 0.5, jingle: 'j_pizzi' },
    latin: { sc: 'major', root: 262, bpm: 122, lead: 'brass', bass: 'oom', perc: 'maracas', dens: 0.6, jingle: 'j_steel' },
    tropical: { sc: 'pentaMaj', root: 349, bpm: 110, lead: 'steel', bass: 'oom', perc: 'shaker', dens: 0.65, jingle: 'j_steel' },
    candy: { sc: 'major', root: 392, bpm: 120, lead: 'bell', bass: 'oom', perc: 'pop', dens: 0.6, jingle: 'j_steel' },
    party: { sc: 'minor', root: 220, bpm: 124, lead: 'saw', bass: 'pump', perc: 'club', dens: 0.7, jingle: 'j_sax' },
    jungle: { sc: 'pentaMin', root: 233, bpm: 104, lead: 'marimba', bass: 'soft', perc: 'tribal', dens: 0.6, jingle: 'j_steel' },
    irish: { sc: 'major', root: 294, bpm: 126, lead: 'fiddle', bass: 'oom', perc: 'bodhran', dens: 0.75, jingle: 'j_sax' },
    mystic: { sc: 'harmMin', root: 233, bpm: 74, lead: 'bell', bass: 'pad', perc: 'none', dens: 0.4, jingle: 'j_pizzi' },
    epic: { sc: 'minor', root: 196, bpm: 108, lead: 'brass', bass: 'pump', perc: 'taiko', dens: 0.45, jingle: 'j_hit' },
    pirate: { sc: 'dorian', root: 220, bpm: 112, lead: 'accordion', bass: 'oom', perc: 'bodhran', dens: 0.6, jingle: 'j_pizzi' },
    dark: { sc: 'minor', root: 110, bpm: 70, lead: 'bell', bass: 'pad', perc: 'heart', dens: 0.25, jingle: 'j_hit' },
    horror: { sc: 'locrian', root: 117, bpm: 62, lead: 'bell', bass: 'pad', perc: 'heart', dens: 0.22, jingle: 'j_hit' },
    noir: { sc: 'dorian', root: 147, bpm: 72, lead: 'reed', bass: 'walk', perc: 'brush', dens: 0.35, jingle: 'j_sax' },
    ocean: { sc: 'minor', root: 131, bpm: 68, lead: 'sonar', bass: 'pad', perc: 'heart', dens: 0.2, jingle: 'j_hit' },
    space: { sc: 'lydian', root: 262, bpm: 84, lead: 'glass', bass: 'pad', perc: 'none', dens: 0.45, jingle: 'j_nes' },
    snow: { sc: 'minor', root: 330, bpm: 76, lead: 'musicbox', bass: 'pad', perc: 'none', dens: 0.45, jingle: 'j_nes' },
    classic: { sc: 'major', root: 330, bpm: 116, lead: 'bell', bass: 'oom', perc: 'pop', dens: 0.55, jingle: 'j_nes' },
    gems: { sc: 'lydian', root: 392, bpm: 104, lead: 'glass', bass: 'soft', perc: 'shaker', dens: 0.6, jingle: 'j_nes' },
    cartoon: { sc: 'major', root: 349, bpm: 132, lead: 'xylo', bass: 'oom', perc: 'pop', dens: 0.65, jingle: 'j_sax' },
    prairie: { sc: 'pentaMaj', root: 196, bpm: 100, lead: 'twang', bass: 'walk', perc: 'shuffle', dens: 0.5, jingle: 'j_pizzi' },
    mine: { sc: 'blues', root: 175, bpm: 104, lead: 'twang', bass: 'oom', perc: 'anvil', dens: 0.45, jingle: 'j_hit' },
  };
  const GAME = {
    casacaes: 'cartoon', lobodeouro: 'prairie', festafrutas: 'tropical', joiasbonanca: 'gems', madamedestino: 'mystic', cleogata: 'egypt', cacadorjoao: 'egypt', frutassuculentas: 'tropical', reibufalo: 'prairie',
    mahjong1: 'china', mahjong2: 'china', ninhodragao: 'china', bandidoselvagem: 'latin', tesourosastecas: 'jungle', riquezasduende: 'irish', ouroganesha: 'india', recompensacapitao: 'pirate', ninjasamurai: 'japan', caishen: 'china',
    procurado: 'western', cidaderip: 'noir', banditoguaxinim: 'cartoon', gangucaos: 'party', maoanubis: 'egypt', gladiadores: 'epic', unidadedork: 'cartoon', empilhaai: 'cartoon', mortosvivos: 'horror', despencou: 'space',
    imperiodourado: 'jungle', joiasfortuna: 'classic', joiasfortuna2: 'gems', lampadamagica: 'arabia', romax: 'epic', superrico: 'classic', fortunaossos: 'latin', alibaba: 'arabia', bufalofurioso: 'prairie', reiselva: 'jungle', noitefesta: 'party',
    olimpo1000: 'epic', docerush1000: 'candy', princesa1000: 'mystic', doce1000: 'candy', cincoleoes: 'china', poderthor: 'epic', riquezasselvagens: 'irish', casacaesmulti: 'cartoon', festafrutas2: 'tropical', extrasuculento: 'classic',
    extrasuculentomw: 'gems', kraken2: 'ocean', sabedoriaatena: 'epic', forjaolimpo: 'mine', festapraia: 'tropical', ovogalinha: 'cartoon', festafazenda: 'prairie', portaisvalhalla: 'snow', carnavalzumbi: 'horror', goblinheist: 'irish',
    mochimon: 'japan', jardimcoelhos: 'cartoon', abelhasgrudentas: 'cartoon', onibuscelebridades: 'party', assaltopepitas: 'mine', pandagordo: 'china', tresabelhas: 'prairie', recompensaceu: 'space', reisbar: 'irish', trilhamustang: 'western',
    gravidade: 'space', princesacrepusculo: 'dark', coringainfectante: 'horror', pilhasmadeira: 'prairie', acucarsupremo: 'candy', estourofogo: 'western', alterego: 'epic', pompeia: 'epic', riquezasloki: 'epic',
    qilin: 'china', dueloselvagem: 'western', ouroalquimico: 'mystic', cruzeiroreal: 'tropical', capsuladoces: 'candy', solelua: 'mystic', reinojurassico: 'jungle', supermercado: 'cartoon', noitescoquetel: 'party', prosperidade: 'china',
    carnavalmascaras: 'latin', maravilhasespirituais: 'japan', bufalovencedor: 'prairie', invasoresfazenda: 'space', riquezassereia: 'ocean', golpemestre: 'noir', totens: 'prairie', deliciasrestaurante: 'cartoon', padaria: 'candy', songkran: 'tropical',
    espiritosmisticos: 'mystic', tikihavaiano: 'tropical', gloriagladiador: 'epic', asgard: 'epic', montanharussa: 'party', perseu: 'epic', lendadragao: 'china', espadagemas: 'classic', favorimperador: 'china', tumbatesouro: 'egypt',
    tresmacacos: 'japan', engrenagens: 'mine', simbolosegito: 'egypt', panelaquente: 'china', pandahiphop: 'party', senhorhallow: 'horror', restaurantemaluco: 'cartoon', diaochan: 'china', livromisterio: 'egypt', sonhosmacau: 'classic',
    medoescuro: 'horror', maresmalditos: 'pirate', templotormento: 'egypt', segureas: 'cartoon', deixenevar: 'snow', bussolatesouro: 'pirate', miamimult: 'party', respinners: 'party', giroasteca: 'jungle', fortunafloresta: 'jungle',
    arcoirisduplo: 'irish', colheitaselvagem: 'prairie', caminhoguerreiro: 'japan', porquinhomagico: 'cartoon', forjadotempestade: 'epic', foodtruckfred: 'cartoon', doisselvagens: 'western', bennycerveja: 'irish', punhodestruicao: 'epic', densho: 'japan',
    gatoslaser: 'space', aurorareis: 'egypt', sintabatida: 'party', bombasaltitantes: 'cartoon', rustycurly: 'western', gangdinheiro: 'noir', matadoressa: 'dark', zezeus: 'epic', criptamaldita: 'dark', faraoguaxinim: 'egypt',
    seisseisseis: 'horror', labtorcido: 'dark', aguiaalfa: 'snow', livrotempo: 'mystic', gemasgronk: 'gems', garotosbowery: 'noir', motoqueiros: 'party', cubos2: 'gems', xpander: 'space',
    lapide: 'western', manhattan: 'noir', acampamentotrator: 'space', cristais: 'gems', jukeboxsorte: 'party', sushimania: 'japan', churrascofrenesi: 'western', oktoberfest: 'party', parquearrepiante: 'horror', moedasfortuna: 'china',
    missaomasmorra: 'dark', yetigelo: 'snow', corujas: 'mystic', estrelato: 'party', magiamaia: 'jungle', thormartelo: 'epic', tribodragao: 'epic', evavenenosa: 'dark', arlequim: 'mystic', coelhosbonus: 'cartoon',
    geniodourado: 'arabia', viaslacteas: 'space', livrosombras: 'dark', cacabufalos: 'prairie', ouromacaco: 'jungle', cemiterioguerreiros: 'dark', buracofogo2: 'mine', sanguesombra2: 'horror', lapidesempiedade: 'western', celaxways2: 'noir',
    cobrinha2000: 'classic', novecinco: 'noir', bolasnatal: 'snow', terraliberdade: 'prairie', diad: 'epic', cidadefantasmarip: 'western', solitario: 'classic', pescariabizarra: 'ocean', encruzilhada: 'western', perturbado: 'horror',
    manicomio: 'horror', celaxways: 'dark', lapiderip: 'western', cidadefantasma: 'western', buracofogo: 'mine', submarino: 'ocean', blococelas: 'dark', sanguesombra: 'horror', gulaggelado: 'snow', detetiveserial: 'noir',
  };

  // dest: saída temporária (efeitos como a vinheta de ganho vão para o canal de efeitos, não o da música)
  let dest = null;
  let theme = null, tm = null, out = null, timer = null, step = 0, nextT = 0, hype = 1, chord = 0, lastNote = 0, playing = false;
  const ac = () => Sfx.ac;
  const hz = (semi, oct = 0) => theme.root * Math.pow(2, semi / 12 + oct);
  const deg = (i, oct = 0) => { const s = SC[tm.sc]; const n = s.length; const o = Math.floor(i / n); return hz(s[((i % n) + n) % n], oct + o); };

  /* ---------- instrumentos ---------- */
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function osc(type, f, t, dur, vol, { a = 0.005, detune = 0, vib = 0, cut = 0, bend = 0 } = {}) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f * (bend ? 0.94 : 1), t);
    if (bend) o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    o.detune.value = detune;
    let node = o;
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    if (cut) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; node.connect(fl); node = fl; }
    node.connect(g).connect(dest || out);
    env(g, t, a, vol, dur);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, hp = 6000, bp = 0) {
    const c = ac(), len = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b;
    f.type = bp ? 'bandpass' : 'highpass';
    f.frequency.value = bp || hp;
    s.connect(f).connect(g).connect(dest || out);
    env(g, t, 0.002, vol, dur);
    s.start(t);
  }
  function kick(t, vol = 0.5, f0 = 120) {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    o.connect(g).connect(dest || out);
    env(g, t, 0.002, vol, 0.25);
    o.start(t);
    o.stop(t + 0.3);
  }
  const LEAD = {
    pluck: (f, t, d) => { osc('triangle', f, t, d * 1.6, 0.16, { vib: 0.004 }); osc('sine', f * 2, t, d * 0.6, 0.05); },
    koto: (f, t, d) => { osc('triangle', f, t, d * 2.2, 0.17, { bend: 1 }); osc('sine', f * 3, t, 0.15, 0.04); },
    reed: (f, t, d) => osc('sawtooth', f, t, d * 1.1, 0.07, { a: 0.03, vib: 0.008, cut: 1800 }),
    sitar: (f, t, d) => { osc('sawtooth', f, t, d * 1.8, 0.07, { bend: 1, cut: 2600 }); osc('sine', f * 2.01, t, d, 0.04); },
    twang: (f, t, d) => osc('square', f, t, d * 0.9, 0.06, { bend: 1, cut: 2200 }),
    brass: (f, t, d) => { osc('sawtooth', f, t, d * 0.9, 0.08, { a: 0.02, cut: 1600 }); osc('sawtooth', f * 1.005, t, d * 0.9, 0.05, { a: 0.02, cut: 1400 }); },
    steel: (f, t, d) => { osc('sine', f, t, d * 1.3, 0.16); osc('sine', f * 2.76, t, 0.2, 0.06); },
    bell: (f, t, d) => { osc('sine', f * 2, t, d * 2.4, 0.11); osc('sine', f * 5.4, t, 0.35, 0.03); },
    saw: (f, t, d) => osc('sawtooth', f, t, d * 0.7, 0.06, { cut: 3000 }),
    marimba: (f, t, d) => { osc('sine', f, t, 0.35, 0.2); osc('sine', f * 4, t, 0.06, 0.05); },
    fiddle: (f, t, d) => osc('sawtooth', f * 2, t, d * 0.95, 0.06, { a: 0.02, vib: 0.006, cut: 3200 }),
    accordion: (f, t, d) => { osc('square', f, t, d, 0.04, { a: 0.02, cut: 2000 }); osc('square', f * 1.004, t, d, 0.04, { a: 0.02, cut: 2000 }); },
    sonar: (f, t, d) => osc('sine', f * 2, t, 1.4, 0.12, { a: 0.01 }),
    glass: (f, t, d) => { osc('sine', f * 2, t, d * 2, 0.09); osc('triangle', f * 3, t, d, 0.03); },
    musicbox: (f, t, d) => { osc('sine', f * 2, t, 0.9, 0.12); osc('sine', f * 6, t, 0.12, 0.03); },
    xylo: (f, t, d) => { osc('triangle', f * 2, t, 0.25, 0.16); osc('sine', f * 8, t, 0.04, 0.04); },
  };
  const BASS = {
    none: () => {},
    soft: (f, t, d, s) => { if (s % 8 === 0) osc('sine', f / 2, t, d * 3, 0.16); },
    drone: (f, t, d, s) => { if (s % 16 === 0) { osc('sawtooth', theme.root / 2, t, d * 16, 0.035, { a: 0.4, cut: 500 }); osc('sine', theme.root / 4, t, d * 16, 0.08, { a: 0.4 }); } },
    pad: (f, t, d, s) => { if (s % 16 === 0) { osc('triangle', f / 2, t, d * 16, 0.06, { a: 0.8 }); osc('sine', f * 0.75, t, d * 16, 0.04, { a: 1 }); } },
    walk: (f, t, d, s) => { if (s % 4 === 0) osc('triangle', deg(chord + [0, 2, 4, 5][(s / 4) % 4], -2), t, d * 3.5, 0.17); },
    oom: (f, t, d, s) => { if (s % 4 === 0) osc('triangle', s % 8 === 0 ? f / 2 : f * 0.75 / 2, t, d * 2, 0.17); },
    pump: (f, t, d, s) => { if (s % 2 === 1) osc('sawtooth', f / 2, t, d * 0.9, 0.05, { cut: 700 }); },
  };
  const PERC = {
    none: () => {},
    wood: (t, s) => { if (s % 4 === 0) osc('sine', 1800, t, 0.05, 0.08); if (s % 16 === 14) osc('sine', 1300, t, 0.05, 0.06); if (s % 32 === 0) osc('sine', 90, t, 2.5, 0.05, { a: 0.02 }); },
    taiko: (t, s) => { if (s % 8 === 0) kick(t, 0.4, 90); if (s % 16 === 12) kick(t, 0.25, 110); },
    darbuka: (t, s) => { const p = [1, 0, 0, 2, 0, 0, 2, 0, 1, 0, 2, 0, 2, 0, 0, 0][s % 16]; if (p === 1) kick(t, 0.3, 140); if (p === 2) noise(t, 0.05, 0.05, 0, 900); },
    tabla: (t, s) => { if ([0, 3, 6, 10, 12].includes(s % 16)) osc('sine', s % 16 === 0 ? 110 : 330, t, 0.15, 0.1, { bend: 1 }); },
    shuffle: (t, s) => { if (s % 4 === 0) kick(t, 0.25); if (s % 4 === 3 || s % 4 === 0) noise(t, 0.03, 0.03); },
    maracas: (t, s) => { if (s % 2 === 0) noise(t, 0.04, 0.035, 5000); if (s % 8 === 0) kick(t, 0.25); },
    shaker: (t, s) => { noise(t, 0.03, s % 2 ? 0.015 : 0.03, 7000); if (s % 8 === 0) kick(t, 0.22); },
    pop: (t, s) => { if (s % 4 === 0) kick(t, 0.3); if (s % 8 === 4) noise(t, 0.08, 0.05, 1500); if (s % 2 === 1) noise(t, 0.02, 0.015); },
    club: (t, s) => { if (s % 4 === 0) kick(t, 0.45); if (s % 8 === 4) noise(t, 0.12, 0.07, 1200); if (s % 4 === 2) noise(t, 0.03, 0.04, 8000); },
    tribal: (t, s) => { if ([0, 6, 10].includes(s % 16)) kick(t, 0.3, 100); if (s % 4 === 2) osc('sine', 600, t, 0.06, 0.06); },
    bodhran: (t, s) => { if (s % 6 === 0) kick(t, 0.25, 100); if (s % 6 === 3) noise(t, 0.04, 0.03, 0, 600); },
    heart: (t, s) => { if (s % 16 === 0 || s % 16 === 3) kick(t, 0.22, 70); },
    brush: (t, s) => { if (s % 2 === 0) noise(t, 0.08, 0.012, 4000); if (s % 8 === 0) kick(t, 0.12, 80); },
    anvil: (t, s) => { if (s % 8 === 0) kick(t, 0.25); if (s % 16 === 6) osc('square', 1400, t, 0.08, 0.03); },
  };

  /* ---------- sequenciador ---------- */
  const PROG = [0, 3, 4, 0, 5, 3, 4, 4];
  function tick() {
    const c = ac();
    if (!c || !playing) return;
    const spb = 60 / (tm.bpm * hype) / 4; // semicolcheia
    while (nextT < c.currentTime + (window.LITE ? 0.4 : 0.25)) {
      const t = nextT, s = step;
      if (s % 16 === 0) chord = PROG[(s / 16) % PROG.length];
      const f = deg(chord);
      BASS[tm.bass](f, t, spb, s);
      PERC[tm.perc](t, s);
      // solo: passeio aleatório na escala, mais denso no bônus
      if (s % 2 === 0 && Math.random() < tm.dens * (hype > 1 ? 1.25 : 1)) {
        lastNote = Math.max(-2, Math.min(9, lastNote + RNG.pick([-2, -1, -1, 1, 1, 2, 0, 3])));
        if (Math.random() < 0.15) lastNote = chord;
        LEAD[tm.lead](deg(lastNote), t, spb * 2);
      }
      nextT += spb;
      step++;
    }
  }
  function start() {
    const c = ac();
    if (!c || !theme || playing) return;
    if (c.state === 'suspended') c.resume();
    if (!out) { out = c.createGain(); out.connect(c.destination); }
    out.gain.cancelScheduledValues(c.currentTime);
    out.gain.setValueAtTime(0.0001, c.currentTime);
    out.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.8);
    playing = true;
    nextT = c.currentTime + 0.1;
    // no celular o sequenciador acorda menos vezes (agenda mais à frente, mesmo som)
    timer = setInterval(tick, window.LITE ? 150 : 60);
  }
  function stop() {
    playing = false;
    clearInterval(timer);
    if (out && ac()) { const c = ac(); out.gain.cancelScheduledValues(c.currentTime); out.gain.setTargetAtTime(0.0001, c.currentTime, 0.15); }
  }
  const musicOn = () => typeof Music === 'undefined' || Music.on;

  /* ---------- efeitos ---------- */
  const play = (n, v = 0.6, r = 1) => Sfx.play(n, v, r);
  let scatN = 0;
  const api = {
    get theme() { return theme; },
    /** Entra num slot: troca a bossa pela trilha do tema. */
    enter(gameId) {
      const key = GAME[gameId] || 'classic';
      theme = { ...T[key], key };
      tm = theme;
      step = 0; hype = 1; lastNote = 0;
      if (typeof Music !== 'undefined') Music.override = api;
      if (musicOn()) { if (typeof Music !== 'undefined' && Music.el) Music.el.pause(); start(); }
    },
    leave() {
      stop();
      theme = null;
      if (typeof Music !== 'undefined') { Music.override = null; if (Music.on) Music.play(); }
    },
    start, stop,
    /** Música mais intensa no bônus. */
    hype(on) { hype = on ? 1.15 : 1; },
    spin() { scatN = 0; play('reel', 0.35, 0.8); },
    stopReel(c, sc) {
      if (sc) { scatN += sc; play('bong', 0.55, 0.9 + scatN * 0.12); } else play('reel', 0.45, 0.9 + c * 0.04);
    },
    drop() { play(theme && theme.key === 'space' ? 'laser' : 'wood', 0.25, 1.2 + Math.random() * 0.2); },
    win(big) {
      if (!theme) return Sfx.win();
      // a vinheta toca no canal de efeitos: funciona com a música desligada e respeita o mudo
      if (!Sfx.muted && ac() && Sfx.out && LEAD[tm.lead]) {
        const s = SC[tm.sc];
        dest = Sfx.out;
        try { [0, 2, 4, big ? 7 : 5].forEach((d, i) => LEAD[tm.lead](hz(s[d % s.length], d >= s.length ? 1 : 0), ac().currentTime + i * 0.09, 0.18)); } finally { dest = null; }
      }
      play('coin', 0.35);
    },
    mult() { play('rise', 0.45); },
    bonus() { play(theme ? theme.jingle : 'j_nes', 0.7); },
    bigWin(x) { setTimeout(() => play(x >= 50 ? 'v_congrats' : 'v_win', 0.8), 700); },
    finalSpin() { play('v_final', 0.7); },
    /** Efeito nomeado do jogo (boom, zombie, v_fire...). */
    fx(n) {
      if (n === 'boom') return play(theme && ['epic', 'western'].includes(theme.key) ? 'impact' : 'explode', 0.55) || Sfx.boom();
      return play(n, 0.65);
    },
  };
  // o som nunca pode interromper uma rodada: qualquer erro de áudio é engolido aqui
  Object.keys(api).forEach(k => {
    const d = Object.getOwnPropertyDescriptor(api, k);
    if (typeof d.value !== 'function') return;
    const fn = d.value;
    api[k] = function (...a) { try { return fn.apply(this, a); } catch (e) { console.warn('SlotAudio.' + k, e); return undefined; } };
  });
  return api;
})();
