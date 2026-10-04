'use strict';

/* =========================================================
   PG Soft — lote 2 (parte 2). Usa o modelo pg do pgsoft2.js
   (caminhos + cascata + multiplicador) e jogos próprios para
   os clássicos de linhas e mecânicas diferentes.
   ========================================================= */
(function () {
  const K = SlotKit, T = SlotT;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const { P6, P5, mk, silverTxt } = T.pgx;
  const pg = T.pg;
  const STUDIO = 'pgsoft';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const R = (pays, w) => K.ROYALS(pays, w);
  const mult = (x, m) => { x.m = m; x.t = 'x' + m; return x; };
  const L3 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0], [0, 1, 0], [2, 1, 2], [1, 0, 1], [1, 2, 1]];
  const L30 = K.linesFor(4, 30);

  /* 21. Espíritos Místicos — três medidores que se multiplicam */
  (() => {
    const COL = ['fogo', 'agua', 'folha'];
    const syms = mk([['fenix', 'phoenix', 'Fênix (fogo)'], ['dragao', 'dragon', 'Dragão (água)'], ['cervo', 'deer', 'Cervo (folha)'], ['chama', 'fire', 'Chama'], ['gota', 'droplet', 'Gota']], P6, false)
      .concat([S('folha', 'leaf', 'Folha', P6[5], 8), S('brasa', 'flame2', 'Brasa', P6[6], 8), S('onda', 'wave', 'Onda', P6[7], 9), S('broto', 'seedling', 'Broto', P6[8], 9)]);
    const colorOf = { fenix: 0, chama: 0, brasa: 0, dragao: 1, gota: 1, onda: 1, cervo: 2, folha: 2, broto: 2 };
    const show = (rt, st) => rt.head(['', `🔥x${st.meter[0]}`, '', `💧x${st.meter[1]}`, '', `🍃x${st.meter[2]}`]);
    App.register(pg({
      id: 'espiritosmisticos', name: 'Espíritos Místicos', art: 'phoenix', mascot: 'deer', tag: '3 medidores que se multiplicam',
      colors: ['#dc2626', '#16a34a'], bg: 'linear-gradient(90deg,#7f1d1d,#1e3a8a 50%,#14532d)', maxWin: 5000, vol: 4, rows: 5, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Mystical Spirits" (PG Soft).', hello: 'Fogo × Água × Folha!',
      syms, wildImg: 'yinyang', scImg: 'crystalball', scName: 'Orbe', scW: 1.0, scMin: 4,
      heights: () => [5, 5, 5, 5, 5, 5],
      baseM: {}, fsM: {}, fsCount: s => 12 + (s - 4) * 2,
      before: async (rt, g, fs, st) => { st.meter = fs ? [2, 2, 2] : [1, 1, 1]; st.cnt = [0, 0, 0]; show(rt, st); },
      onWin: (r, gg, fs, st, rt) => {
        // cada 5 símbolos vencedores de uma cor somam +1 no medidor dela; coringas contam nos três
        r.cells.forEach(kk => { const [c, rr] = unkey(kk); const x = gg[c][rr]; if (x.wild) [0, 1, 2].forEach(i => st.cnt[i]++); else if (colorOf[x.id] != null) st.cnt[colorOf[x.id]]++; });
        [0, 1, 2].forEach(i => { while (st.cnt[i] >= 5) { st.cnt[i] -= 5; st.meter[i]++; } });
        show(rt, st);
      },
      multOf: st => st.meter[0] * st.meter[1] * st.meter[2],
      after: async rt => rt.head(null),
      waysNote: '6×5 = 15.625 caminhos.',
      highlights: ['🔥💧🍃 6×5 (15.625 caminhos) com cascata', 'Três medidores (fogo, água e folha): cada <b>5 símbolos vencedores</b> de uma cor somam <b>+1</b> no medidor dela; coringas contam nos três', 'O ganho é multiplicado pelos <b>três medidores multiplicados entre si</b>', '🔮 4+ orbes = <b>12 rodadas grátis</b> (+2 por extra) com medidores começando em <b>x2</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: `<p>Grade 6×5 com cascata. Os símbolos pertencem a uma de três cores (${COL.join(', ')}). Cada 5 símbolos de uma cor que fazem parte de ganhos sobem o medidor dela em +1. O multiplicador é <b>fogo × água × folha</b>. Os medidores voltam a x1 a cada giro.</p>`,
      features: '<p>🔮 <b>4 ou mais orbes</b> dão <b>12 rodadas grátis</b> (+2 por extra). Em cada giro os três medidores começam em <b>x2</b> (x8 no total).</p>',
    }));
  })();

  /* 22. Tiki Havaiano — coringas que crescem nos rolos 3 e 4 */
  App.register(pg({
    id: 'tikihavaiano', name: 'Tiki Havaiano', art: 'moai', mascot: 'hibiscus', tag: 'Coringas que crescem',
    colors: ['#f97316', '#0d9488'], bg: 'linear-gradient(180deg,#fef08a,#fb923c 40%,#0f766e)', maxWin: 1274, vol: 2, rtp: '~96,8%', target: 0.968,
    intro: 'Inspirado no "Hawaiian Tiki" (PG Soft).', hello: 'Coringas nos rolos 3 e 4 crescem!',
    syms: mk([['tiki', 'moai', 'Tiki'], ['abacaxi', 'pineapple', 'Abacaxi'], ['flor', 'hibiscus', 'Hibisco'], ['coco', 'coconut', 'Coco'], ['ukulele', 'guitar', 'Ukulele']], P6),
    wildImg: 'tikitorch', wildReels: [2, 3], wildW: 0.8, wildFW: 1.4, scImg: 'island', scName: 'Ilha', scW: 0.6, scMin: 3,
    heights: () => [3, 4, 5, 5, 4, 3],
    convert: (x, c) => (x.wild && (c === 2 || c === 3) ? { ...x, c: 'sticky' } : null),
    onStep: async (rt, gg) => {
      // coringa vencedor dos rolos 3/4 fica e ganha mais um coringa embaixo (ou em cima)
      [2, 3].forEach(c => {
        const ws = gg[c].map((x, r) => (x.wild ? r : -1)).filter(r => r >= 0);
        if (!ws.length) return;
        const below = Math.max(...ws) + 1, above = Math.min(...ws) - 1;
        const r = below < gg[c].length ? below : above;
        if (r >= 0 && !gg[c][r].wild) gg[c][r] = { ...gg[c][ws[0]], c: 'sticky', fresh: true };
      });
    },
    baseM: {}, fsM: {}, fsCount: s => Math.min(18, 12 + (s - 3) * 2), retrigMin: 2, retrig: () => 4,
    waysNote: 'Rolos 3-4-5-5-4-3 = 3.600 caminhos.',
    highlights: ['🌺 Rolos 3-4-5-5-4-3 (3.600 caminhos) com cascata', '🔥 Coringa dos rolos 3 e 4 que ganha <b>fica</b> e <b>cresce</b>: ganha mais um coringa embaixo (ou em cima)', '🏝️ 3+ ilhas = <b>12 rodadas grátis</b> (+2 por extra, até 18); 2 ilhas nelas dão <b>+4</b>', 'Prêmio máximo: <b>1.274x</b>'],
    how: '<p>Rolos 3-4-5-5-4-3 com cascata. O coringa só cai nos rolos 3 e 4; quando participa de um ganho ele não some e adiciona mais um coringa logo abaixo dele (ou acima, se já estiver no fundo).</p>',
    features: '<p>🏝️ <b>3 ou mais ilhas</b> dão <b>12 rodadas grátis</b> (+2 por extra, até 18). Durante o bônus, 2 ilhas dão <b>+4 giros</b>.</p>',
  }));

  /* 23. Glória do Gladiador — coringas viram multiplicadores */
  App.register(pg({
    id: 'gloriagladiador', name: 'Glória do Gladiador', art: 'shield', mascot: 'militaryhelmet', tag: 'Coringas x1, x3 ou x5',
    colors: ['#b91c1c', '#ca8a04'], bg: 'radial-gradient(circle at 50% 30%,#92400e,#1c0a05 70%)', maxWin: 5000, cols: 5, rows: 5, vol: 3, rtp: '~96,8%', target: 0.968,
    intro: 'Inspirado no "Gladiator\'s Glory" (PG Soft).', hello: 'Coringas que ganham viram multiplicadores!',
    syms: mk([['gladiador', 'militaryhelmet', 'Gladiador'], ['escudo', 'shield', 'Escudo'], ['espada', 'sword2', 'Espada'], ['lanca', 'spear', 'Lança'], ['sandalia', 'sandal', 'Sandália']], P5),
    wildImg: 'laurel', wildFW: 1.3, scImg: 'lionface', scName: 'Moeda do leão', scW: 0.75, scMin: 3,
    heights: () => [3, 4, 5, 4, 3],
    wildMult: 'add',
    convert: x => (x.wild && !x.m ? mult({ ...x, c: 'gold', fresh: true }, RNG.weighted([{ m: 1, w: 50 }, { m: 3, w: 35 }, { m: 5, w: 15 }]).m) : null),
    baseM: {}, fsM: {}, fsCount: s => 10 + (s - 3) * 2, retrigMin: 1, retrig: s => 2 * s,
    waysNote: 'Rolos 3-4-5-4-3 = 720 caminhos.',
    highlights: ['⚔️ Rolos 3-4-5-4-3 (720 caminhos) com cascata', '🌿 Coringa que ganha <b>não some</b>: vira um coringa <b>x1, x3 ou x5</b> para a próxima cascata', '🦁 3+ moedas do leão = <b>10 rodadas grátis</b>; cada moeda que cai nelas dá <b>+2 giros</b>', 'Prêmio máximo: <b>5.000x</b>'],
    how: '<p>Rolos 3-4-5-4-3 com cascata. Quando um coringa participa de um ganho, ele fica no lugar como coringa multiplicador (x1, x3 ou x5). Multiplicadores no mesmo caminho se somam.</p>',
    features: '<p>🦁 <b>3 ou mais moedas do leão</b> dão <b>10 rodadas grátis</b> (+2 por extra) e cada moeda que aparecer durante o bônus dá <b>+2 giros</b>.</p>',
  }));

  /* 24. Ascensão de Asgard */
  App.register(pg({
    id: 'asgard', name: 'Ascensão de Asgard', art: 'axe', mascot: 'shield', tag: '32.400 caminhos · mult. +1',
    colors: ['#1d4ed8', '#ca8a04'], bg: 'linear-gradient(180deg,#1e3a8a,#0f172a 60%,#422006)', maxWin: 8305, vol: 4, rtp: '~96,8%', target: 0.968,
    intro: 'Inspirado no "Asgardian Rising" (PG Soft).', hello: 'O rolo de multiplicador sobe a cada cascata!',
    syms: mk([['odin', 'oldman', 'Odin'], ['machado', 'axe', 'Machado'], ['chifre', 'drinkhorn', 'Chifre'], ['runa', 'runestone', 'Runa'], ['corvo', 'crow', 'Corvo']], P6),
    wildImg: 'lightning', scImg: 'cloudbolt', scName: 'Bifrost', scW: 0.75, scMin: 4,
    heights: () => [5, 6, 6, 6, 6, 5], silver: [0.06, 0.14],
    baseM: { start: 1, add: 1 }, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 12 + (s - 4) * 2,
    waysNote: 'Rolos 5-6-6-6-6-5 = 32.400 caminhos.',
    highlights: ['🪓 Rolos 5-6-6-6-6-5 (32.400 caminhos) com cascata', 'Rolo de multiplicador: <b>+1 a cada cascata</b>', '🖼️ Molduras prata → douradas → <b>coringa</b>', '⚡ 4+ Bifrost = <b>12 rodadas grátis</b> com multiplicador que <b>não zera</b>', 'Prêmio máximo: <b>8.305x</b>'],
    how: `<p>Rolos 5-6-6-6-6-5 com cascata; o multiplicador sobe +1 a cada cascata e zera no próximo giro. ${silverTxt}</p>`,
    features: '<p>⚡ <b>4 ou mais Bifrost</b> dão <b>12 rodadas grátis</b> (+2 por extra) e o multiplicador não zera entre os giros.</p>',
  }));

  /* 25. Montanha-Russa Selvagem — coringas com vidas em cima e embaixo */
  (() => {
    const W = { id: 'w', img: 'rollercoaster', name: 'Coringa', wild: true, w: 0 };
    const lifeW = (n = RNG.int(1, 3)) => ({ ...W, lives: n, t: '♥' + n, c: 'sticky' });
    App.register(pg({
      id: 'montanharussa', name: 'Montanha-Russa Selvagem', art: 'rollercoaster', mascot: 'ferris', tag: 'Coringas com vidas · 16.465x',
      colors: ['#e11d48', '#2563eb'], bg: 'linear-gradient(180deg,#fde68a,#fb7185 40%,#1e3a8a)', maxWin: 16465, vol: 5, rtp: '~96,7%',
      intro: 'Inspirado no "Wild Coaster" (PG Soft).', hello: 'Coringas em cima e embaixo!',
      syms: mk([['carrinho', 'rollercoaster', 'Carrinho'], ['roda', 'ferris', 'Roda-gigante'], ['algodao', 'cottoncandy', 'Algodão-doce'], ['pipoca', 'popcorn', 'Pipoca'], ['balao', 'balloon', 'Balão']], P6),
      wildImg: 'rollercoaster', wildW: 0, scImg: 'ticket', scName: 'Ingresso', scW: 0.7, scMin: 4,
      heights: () => [4, 6, 6, 6, 6, 4],
      before: async (rt, g, fs) => {
        // faixas de cima e de baixo (rolos 2 a 5) trazem coringas com 1 a 3 vidas
        for (let c = 1; c <= 4; c++) {
          const t = RNG.float() < (fs ? 0.12 : 0.07), b = RNG.float() < (fs ? 0.12 : 0.07);
          if (t) g[c][0] = lifeW();
          if (b) g[c][5] = lifeW();
          if (t && b) { g[c] = g[c].map(() => lifeW(1)); rt.msg('🎢 Coringas em cima e embaixo: o rolo inteiro vira coringa!'); }
        }
      },
      convert: x => { if (x.wild && x.lives > 1) { const n = x.lives - 1; return { ...x, lives: n, t: '♥' + n }; } return null; },
      baseM: { start: 1, add: 1 }, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 10 + (s - 4) * 2,
      waysNote: 'Rolos 4-6-6-6-6-4 = 20.736 caminhos (as pontas dos rolos 2 a 5 são as faixas extras).',
      highlights: ['🎢 Até 20.736 caminhos com cascata e multiplicador <b>+1 por cascata</b>', 'As faixas de cima e de baixo trazem <b>coringas com 1 a 3 vidas</b>', 'Coringa em cima <b>e</b> embaixo da mesma coluna = <b>coluna inteira de coringa</b>', '🎟️ 4+ ingressos = <b>10 rodadas grátis</b> com multiplicador sem teto e sem zerar', 'Prêmio máximo: <b>16.465x</b>'],
      how: '<p>Rolos 4-6-6-6-6-4: a primeira e a última casa dos rolos 2 a 5 são as faixas extras, onde caem coringas com ♥1 a ♥3 vidas (cada ganho gasta uma). Com coringa nas duas pontas da mesma coluna, ela vira toda coringa. O multiplicador sobe +1 a cada cascata.</p>',
      features: '<p>🎟️ <b>4 ou mais ingressos</b> dão <b>10 rodadas grátis</b> (+2 por extra). Coringas aparecem mais e o multiplicador não zera.</p>',
    }));
  })();

  /* 26. Lenda de Perseu — símbolos gigantes com multiplicador */
  (() => {
    const syms = mk([['perseu', 'superhero', 'Perseu'], ['pegaso', 'unicorn', 'Pégaso'], ['medusa', 'snake', 'Medusa'], ['elmo', 'helmet', 'Elmo'], ['escudo', 'shield', 'Escudo']], P6);
    App.register(pg({
      id: 'perseu', name: 'Lenda de Perseu', art: 'unicorn', mascot: 'superhero', tag: 'Gigantes 2×2 e 3×3 até x10',
      colors: ['#0369a1', '#ca8a04'], bg: 'linear-gradient(180deg,#bae6fd,#0369a1 50%,#082f49)', maxWin: 7524, rows: 5, vol: 3, rtp: '~96,7%',
      intro: 'Inspirado no "Legend of Perseus" (PG Soft).', hello: 'Símbolos gigantes trazem multiplicador!',
      syms, wildImg: 'trident', wildReels: [1, 2, 3, 4, 5], scImg: 'kraken', scName: 'Kraken', scW: 1.0, scMin: 4,
      heights: () => [5, 5, 5, 5, 5, 5],
      before: async (rt, g, fs, st) => {
        if (!fs) st.acc = 1;
        if (RNG.float() < (fs ? 0.5 : 0.12)) {
          const big = RNG.float() < 0.3 ? 3 : 2, m = big === 3 ? RNG.int(5, 10) : RNG.int(3, 5), s = RNG.pick(syms.slice(0, 5));
          const c0 = RNG.int(0, 6 - big), r0 = RNG.int(0, 5 - big);
          for (let a = 0; a < big; a++) for (let b = 0; b < big; b++) g[c0 + a][r0 + b] = { ...s, c: 'giant', giant: m, t: a === 0 && b === 0 ? 'x' + m : undefined };
        }
      },
      onWin: (r, gg, fs, st, rt) => {
        // gigante vencedor soma o multiplicador dele no acumulado
        const gs = [...r.cells].map(k => { const [c, rr] = unkey(k); return gg[c][rr]; }).filter(x => x.giant);
        if (gs.length) { st.acc += gs[0].giant; rt.msg(`🗿 Gigante x${gs[0].giant}: multiplicador acumulado x${st.acc}`); }
      },
      multOf: st => st.acc || 1,
      baseM: {}, fsM: { persist: true }, fsState: () => ({ acc: 1 }), fsCount: s => 10 + (s - 4) * 2,
      waysNote: '6×5 = 15.625 caminhos.',
      highlights: ['🏛️ 6×5 (15.625 caminhos) com cascata', 'Símbolos <b>gigantes 2×2 (x3 a x5)</b> e <b>3×3 (x5 a x10)</b>: ao ganhar, o multiplicador deles <b>acumula</b> nas cascatas seguintes', '🐙 4+ Krakens = <b>10 rodadas grátis</b> (+2 por extra) com o acumulado que <b>nunca zera</b>', 'Prêmio máximo: <b>7.524x</b>'],
      how: '<p>Grade 6×5 com cascata. Podem cair símbolos gigantes (2×2 ou 3×3) com multiplicador; quando um deles participa de um ganho, o valor dele é somado a um multiplicador acumulado que vale para os ganhos seguintes daquele giro.</p>',
      features: '<p>🐙 <b>4 ou mais Krakens</b> dão <b>10 rodadas grátis</b> (+2 por extra). Gigantes aparecem mais e o multiplicador acumulado <b>não zera</b>.</p>',
    }));
  })();

  /* 27. Lenda do Dragão — par de carpas e roda de bônus */
  (() => {
    const L9 = K.LINES_5x3.slice(0, 9);
    const SY = [S('moeda', 'coin', 'Moeda de ouro', [5, 20, 100], 3), S('lotus', 'lotus', 'Lótus', [3, 10, 50], 4), S('perola', 'pearl', 'Pérola', [2, 6, 30], 5), ...R([[0.5, 2, 6], [0.5, 2, 6], [0.4, 1.5, 5], [0.4, 1.5, 5]])];
    const WILD = { id: 'w', img: 'dragonface', name: 'Dragão', wild: true, w: 1.1 };
    const KG = { id: 'kg', img: 'goldfish', name: 'Carpa dourada', koi: 'g', noPay: true, w: 0.42 };
    const KS = { id: 'ks', img: 'silverfish', name: 'Carpa prateada', koi: 's', noPay: true, w: 0.42 };
    const BON = { id: 'bon', img: 'waterfall', name: 'Bônus', reels: [1, 2, 3], noPay: true, w: 0.6 };
    const draw = pool([...SY, WILD, KG, KS, BON]);
    const make = () => K.stack(grid([3, 3, 3, 3, 3], c => draw(c)), 0.35);
    const koiPair = g => { for (let c = 0; c < 4; c++) { const a = g[c].some(x => x.koi === 'g') && g[c + 1].some(x => x.koi === 's'); const b = g[c].some(x => x.koi === 's') && g[c + 1].some(x => x.koi === 'g'); if (a || b) return true; } return false; };
    const WHEEL = [{ v: 2, w: 30 }, { v: 3, w: 25 }, { v: 5, w: 18 }, { v: 8, w: 12 }, { v: 10, w: 8 }, { v: 20, w: 5 }, { v: 50, w: 1.8 }, { v: 100, w: 0.2 }];
    App.register(K.create({
      id: 'lendadragao', name: 'Lenda do Dragão', studio: STUDIO, art: 'dragonface', mascot: 'goldfish',
      tag: 'Par de carpas · roda do dragão', colors: ['#b91c1c', '#0891b2'], bg: 'linear-gradient(180deg,#0e7490,#164e63 50%,#7f1d1d)',
      cols: 5, rows: 3, maxWin: 3000, vol: 2, rtp: '~97,2%', target: 0.972,
      intro: 'Inspirado no "Dragon Legend" (PG Soft).', hello: 'Carpa dourada + prateada lado a lado!',
      symbols: [...SY, WILD, KG, KS, BON],
      lineList: { cols: 5, rows: 3, list: L9, text: '9 linhas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda; o dragão é coringa empilhado.')],
      highlights: ['🐉 5×3 com 9 linhas; o dragão coringa vem <b>empilhado</b>', '🐟 Carpa dourada e prateada em rolos vizinhos = <b>2 giros grátis x2</b>', '🌊 3 bônus (rolos 2, 3 e 4) = <b>roda do dragão</b>: 5 giros de prêmios em dinheiro (até 100x); par de carpas dá +2 giros', 'Prêmio máximo: <b>3.000x</b>'],
      how: '<p>Grade 5×3 com 9 linhas. O dragão é coringa e costuma vir empilhado.</p>',
      features: '<p>🐟 <b>Par de carpas</b> (dourada e prateada em rolos vizinhos) dá <b>2 giros grátis com ganhos x2</b> (outro par durante eles dá +2). 🌊 <b>3 símbolos de bônus</b> nos rolos 2, 3 e 4 abrem a <b>roda do dragão</b>: 5 giros que pagam de 2x a 100x cada.</p>',
      make,
      async spin(rt) {
        const g = make(); await rt.spin(g); await pay(rt, lines(g, L9, SY));
        if (count(g, x => x.id === 'bon') >= 3) { await rt.wait(700); await this.bonus(rt, { wheel: true }); }
        else if (koiPair(g)) { await rt.wait(600); await this.bonus(rt, {}); }
      },
      async bonus(rt, { wheel = RNG.float() < 0.3 } = {}) {
        if (wheel) {
          let n = 5, tot = 0;
          rt.stat('hold');
          await rt.banner('RODA DO DRAGÃO', '5 giros de prêmio', 1300);
          for (let i = 0; i < n && !rt.capped; i++) {
            const idx = WHEEL.indexOf(RNG.weighted(WHEEL));
            await rt.reveal(`GIRO ${i + 1}/${n}`, WHEEL.map(x => ({ img: 'coin', label: x.v + 'x' })), idx);
            tot += WHEEL[idx].v; rt.win(WHEEL[idx].v);
            if (RNG.float() < 0.12) { n += 2; rt.msg('🐟 Par de carpas: +2 giros na roda!'); }
          }
          rt.msg(`🐉 Roda do dragão: ${rt.coins(tot)}`); rt.fx('big'); await rt.wait(900);
          return;
        }
        await rt.fsLoop(2, async api => { const g = make(); await rt.spin(g, { tease: false }); await pay(rt, lines(g, L9, SY), 2); if (koiPair(g)) api.add(2); }, { sub: '2 giros · ganhos x2' });
      },
    }));
  })();

  /* 28. Espada Salvadora de Gemas — uma linha, gato e roda */
  (() => {
    const SY = [S('gema', 'gem', 'Gema', [10, 40, 150], 2), S('coroa', 'crown', 'Coroa', [5, 20, 80], 2.5), S('escudo', 'shield', 'Escudo', [3, 10, 40], 3), S('pocao', 'potion', 'Poção', [2, 6, 25], 3.5), S('moeda', 'coin', 'Moeda', [1, 3, 10], 4)];
    const CAT = { id: 'gato', img: 'catface', name: 'Gato', reels: [1, 2, 3], noPay: true, w: 0.9 };
    const SWORD = { id: 'espada', img: 'sword2', name: 'Espada', reels: [1, 2, 3], noPay: true, w: 1.6 };
    const WILD = { id: 'w', img: 'fairy', name: 'Coringa', wild: true, w: 1.4 };
    const draw = pool([...SY, CAT, SWORD, WILD]);
    const make = () => grid([1, 1, 1, 1, 1], c => draw(c));
    const L1 = [[0, 0, 0, 0, 0]];
    const WHEEL = [{ k: 'x', v: 2, w: 30 }, { k: 'x', v: 3, w: 22 }, { k: 'x', v: 5, w: 14 }, { k: 'x', v: 10, w: 7 }, { k: 'x', v: 25, w: 2 }, { k: 'r', v: 3, w: 15 }, { k: 'r', v: 5, w: 8 }, { k: 'x', v: 50, w: 0.6 }];
    App.register(K.create({
      id: 'espadagemas', name: 'Espada Salvadora de Gemas', studio: STUDIO, art: 'sword2', mascot: 'catface',
      tag: '1 linha · roda da espada', colors: ['#7c3aed', '#06b6d4'], bg: 'linear-gradient(180deg,#312e81,#4c1d95 50%,#0e7490)',
      cols: 5, rows: 1, cellH: 1.4, maxWin: 300, vol: 2, rtp: '~95,5%', target: 0.955, buy: false,
      intro: 'Inspirado no "Gem Saviour Sword" (PG Soft).', hello: 'Uma linha só, cheia de recursos!',
      symbols: [...SY, CAT, SWORD, WILD],
      tables: [table('Pagamento na linha', heads(3, 3), SY, '5 rolos de 1 símbolo; iguais seguidos a partir da esquerda.')],
      highlights: ['🗡️ 5 rolos com <b>uma única linha</b>', '🐱 Gato nos rolos 2 a 4 = <b>respin</b> (os outros rolos giram de novo)', '⚔️ 3 espadas nos rolos 2, 3 e 4 = <b>roda giratória</b>: multiplicador de x2 a x50 ou 3/5 respins', 'Prêmio máximo: <b>300x</b>'],
      how: '<p>5 rolos de 1 símbolo e 1 linha: 3, 4 ou 5 iguais seguidos a partir da esquerda pagam. A fada é coringa.</p>',
      features: '<p>🐱 O <b>gato</b> nos rolos do meio fica parado e os outros rolos giram de novo (respin). ⚔️ <b>3 espadas</b> nos rolos 2, 3 e 4 giram a roda da espada: ela multiplica o próximo resultado (x2 a x50) ou dá 3 ou 5 respins.</p>',
      make,
      async spin(rt) {
        let g = make(); await rt.spin(g);
        let res = lines(g, L1, SY), m = 1;
        if (count(g, x => x.id === 'espada') >= 3) {
          const idx = WHEEL.indexOf(RNG.weighted(WHEEL));
          await rt.reveal('RODA DA ESPADA', WHEEL.map(x => ({ img: 'sword2', label: x.k === 'x' ? 'x' + x.v : x.v + ' respins' })), idx);
          const w = WHEEL[idx];
          if (w.k === 'x') { m = w.v; g = make(); g[1] = [{ ...WILD }]; g[2] = [{ ...WILD }]; g[3] = [{ ...WILD }]; await rt.spin(g, { tease: false }); res = lines(g, L1, SY); }
          else { for (let i = 0; i < w.v; i++) { const g2 = make(); await rt.spin(g2, { tease: false }); await pay(rt, lines(g2, L1, SY)); } }
        }
        await pay(rt, res, m);
        // respin do gato
        for (let guard = 0; guard < 3 && g.slice(1, 4).some(col => col[0].id === 'gato'); guard++) {
          rt.msg('🐱 O gato pediu respin!');
          g = g.map((col, c) => (col[0].id === 'gato' ? [{ ...WILD, c: 'sticky' }] : [draw(c)]));
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L1, SY));
        }
      },
      async bonus() {},
    }));
  })();

  /* 29. Favor do Imperador — símbolos 2×2 e 3×3 garantidos */
  (() => {
    const L30x3 = K.LINES_5x3.slice(0, 25).concat([[0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [1, 0, 0, 1, 2], [1, 2, 2, 1, 0], [0, 0, 1, 1, 2]]);
    const SY = [S('consorte1', 'princess', 'Consorte de vermelho', [3, 10, 50], 3), S('consorte2', 'geisha', 'Consorte de azul', [2.5, 8, 40], 3), S('consorte3', 'womandance', 'Consorte de verde', [2, 6, 30], 4), S('leque', 'fan', 'Leque', [1, 3, 12], 5), S('jade', 'greenheart', 'Jade', [0.8, 2.5, 10], 5), ...R([[0.3, 1, 4], [0.3, 1, 4], [0.2, 0.8, 3], [0.2, 0.8, 3]])];
    const WILD = { id: 'w', img: 'prince', name: 'Imperador', wild: true, pays: [5, 25, 100], w: 0.7 };
    const SC = { id: 'sc', img: 'lantern', name: 'Lanterna', sc: true, w: 0.95 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const block = (g, size) => { const s = RNG.pick(SY); const c0 = size === 3 ? RNG.int(1, 2) : RNG.int(0, 5 - size), r0 = RNG.int(0, 3 - size); for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) g[c0 + a][r0 + b] = { ...s, c: 'giant' }; };
    App.register(K.create({
      id: 'favorimperador', name: 'Favor do Imperador', studio: STUDIO, art: 'prince', mascot: 'princess',
      tag: 'Símbolos 3×3 garantidos nas grátis', colors: ['#be123c', '#ca8a04'], bg: 'linear-gradient(180deg,#fecdd3,#be123c 50%,#4c0519)',
      cols: 5, rows: 3, maxWin: 639, vol: 2, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Emperor\'s Favour" (PG Soft).', hello: 'Símbolos gigantes 2×2!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L30x3, text: '30 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), [...SY, WILD], 'Iguais seguidos a partir da esquerda.')],
      highlights: ['👑 5×3 com 30 linhas e símbolos <b>gigantes 2×2</b>', '🏮 3/4/5 lanternas = <b>10/15/20 rodadas grátis</b> com um <b>símbolo 3×3 garantido</b> em todo giro', 'Prêmio máximo: <b>639x</b>'],
      how: '<p>Grade 5×3 com 30 linhas. Em qualquer giro pode cair um símbolo gigante 2×2. O Imperador é coringa e o símbolo que mais paga.</p>',
      features: '<p>🏮 <b>3, 4 ou 5 lanternas</b> dão <b>10, 15 ou 20 rodadas grátis</b>. Em cada giro aparece um <b>símbolo gigante 3×3</b> garantido.</p>',
      make,
      async spin(rt) { const g = make(); if (RNG.float() < 0.2) block(g, 2); await rt.spin(g); await pay(rt, lines(g, L30x3, [...SY, WILD])); const sc = count(g, x => x.sc); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        await rt.fsLoop({ 3: 10, 4: 15 }[sc] || 20, async api => { const g = make(); block(g, 3); await rt.spin(g, { tease: false }); await pay(rt, lines(g, L30x3, [...SY, WILD])); if (count(g, x => x.sc) >= 3) api.add(10); }, { sub: 'Símbolo 3×3 garantido!' });
      },
    }));
  })();

  /* 30. Tumba do Tesouro — rolos que expandem para 6 linhas */
  (() => {
    const SY = [S('aventureiro', 'detective', 'Aventureiro', [2, 6, 25], 3), S('idolo', 'moai', 'Ídolo', [1.5, 5, 20], 4), S('mapa', 'worldmap', 'Mapa', [1, 4, 15], 4), S('chicote', 'whip', 'Chicote', [0.8, 3, 10], 5), ...R([[0.3, 0.8, 3], [0.3, 0.8, 3], [0.2, 0.6, 2], [0.2, 0.6, 2]])];
    const WILD = { id: 'w', img: 'torch', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.7 };
    const POW = { id: 'pow', img: 'scarab', name: 'Poder', reels: [2], noPay: true, w: 0.1 };
    const draw = pool([...SY, WILD, POW]);
    const make = (rows = 3, noPow = false) => grid([rows, rows, rows, rows, rows], c => { let x; do x = draw(c); while (noPow && x.id === 'pow'); return x; });
    App.register(K.create({
      id: 'tumbatesouro', name: 'Tumba do Tesouro', studio: STUDIO, art: 'scarab', mascot: 'detective',
      tag: 'Rolos expandem para 6 linhas', colors: ['#a16207', '#1c1917'], bg: 'linear-gradient(180deg,#78350f,#292524 60%,#0c0a09)',
      cols: 5, rows: 6, maxWin: 8137, vol: 3, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Tomb of Treasure" (PG Soft).', hello: 'O escaravelho no rolo 3 abre a tumba!',
      symbols: [...SY, WILD, POW],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '243 caminhos (até 7.776 nos respins).')],
      highlights: ['🏺 5×3 com 243 caminhos', '🪲 Escaravelho no <b>rolo 3</b> = os rolos <b>expandem para 6 linhas</b> (7.776 caminhos) com <b>3 respins</b> e multiplicador <b>x2, x3 e x5</b>', 'Prêmio máximo: <b>8.137x</b>'],
      how: '<p>Grade 5×3 que paga por caminho (243). A tocha é coringa nos rolos 2 a 5.</p>',
      features: '<p>🪲 Quando o <b>escaravelho do poder</b> aparece no rolo 3, a tumba se abre: a grade cresce para <b>5×6</b> (7.776 caminhos) e você ganha <b>3 respins</b> com os ganhos multiplicados por <b>x2</b>, <b>x3</b> e <b>x5</b>.</p>',
      make: () => make(3),
      async spin(rt) { rt.layout(3); const g = make(3); await rt.spin(g); await pay(rt, ways(g, SY)); if (g[2].some(x => x.id === 'pow')) { await rt.wait(700); await this.bonus(rt, {}); } },
      async bonus(rt) {
        rt.layout(6);
        await rt.fsLoop(3, async api => { const g = make(6, true); await rt.spin(g, { tease: false }); await pay(rt, ways(g, SY), [2, 3, 5][Math.min(2, api.i)]); }, { title: 'TUMBA ABERTA!', sub: '3 respins em 5×6 · x2 / x3 / x5', label: 'RESPINS' });
        rt.layout(3);
      },
    }));
  })();

  /* 31. Três Macacos — coringas empilhados e respins x5 */
  (() => {
    const SY = [S('sushi', 'sushi', 'Sushi', [20], 3), S('saque', 'sake', 'Saquê', [12], 4), S('leque', 'fan', 'Leque', [8], 5), S('lanterna', 'izakaya', 'Lanterna', [5], 6), S('sakura', 'cherryblossom', 'Sakura', [3], 7), S('moeda', 'coin', 'Moeda', [2], 8)];
    const MONKEYS = ['seenoevil', 'hearnoevil', 'speaknoevil'];
    const WILD = { id: 'w', img: 'seenoevil', name: 'Macaco', wild: true, w: 0.8 };
    const draw = pool([...SY, WILD]);
    const make = () => grid([3, 3, 3], c => { const x = draw(c); if (x.wild) x.img = MONKEYS[c]; return x; });
    App.register(K.create({
      id: 'tresmacacos', name: 'Três Macacos', studio: STUDIO, art: 'seenoevil', mascot: 'speaknoevil',
      tag: 'Respins com multiplicador até x5', colors: ['#f472b6', '#0d9488'], bg: 'linear-gradient(180deg,#fce7f3,#99f6e4 60%,#0f766e)',
      cols: 3, rows: 3, maxWin: 1800, vol: 3, rtp: '~96,1%', target: 0.961, buy: false,
      intro: 'Inspirado no "Three Monkeys" (PG Soft).', hello: 'Não vejo, não ouço, não falo!',
      symbols: [...SY, WILD], extraSprites: MONKEYS,
      lineList: { cols: 3, rows: 3, list: L3, text: '9 linhas.' },
      tables: [table('Pagamento por linha', ['3'], SY, '3 iguais numa linha.')],
      highlights: ['🙈🙉🙊 3×3 com 9 linhas', 'Cada macaco que cai <b>enche o rolo de coringas</b> e dá um <b>respin</b> com ele parado', 'O multiplicador sobe a cada respin: <b>x2, x3, x4 e x5</b>', 'Prêmio máximo: <b>1.800x</b>'],
      how: '<p>Grade 3×3 com 9 linhas. Os três macacos (um por rolo) são coringas.</p>',
      features: '<p>🐒 Quando um macaco cai, o rolo dele vira uma pilha de coringas e os outros rolos giram de novo. Cada novo macaco dá outro respin e o multiplicador sobe: x2, x3, x4, até <b>x5</b>.</p>',
      make,
      async spin(rt) {
        let g = make(); await rt.spin(g);
        let m = 1;
        await pay(rt, lines(g, L3, SY));
        let locked = new Set();
        for (let guard = 0; guard < 3; guard++) {
          const nw = [0, 1, 2].filter(c => !locked.has(c) && g[c].some(x => x.wild));
          if (!nw.length) break;
          nw.forEach(c => locked.add(c));
          m = Math.min(5, m + 1);
          rt.msg(`🐒 Pilha de macacos! Respin x${m}`); rt.fx('rise');
          g = g.map((col, c) => (locked.has(c) ? col.map(() => ({ ...WILD, img: MONKEYS[c], c: 'sticky' })) : col.map(() => { const x = draw(c); if (x.wild) x.img = MONKEYS[c]; return x; })));
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L3, SY), m);
        }
      },
      async bonus() {},
    }));
  })();

  /* 32. Engrenagens do Destino (Steampunk: Wheel of Destiny) */
  (() => {
    const P = [[2, 4, 8, 20], [1.5, 3, 6, 15], [1, 2, 4, 10], [0.8, 1.5, 3, 8], [0.6, 1.2, 2.5, 6], [0.4, 0.8, 1.5, 4]];
    const SY = [['relogio', 'watch', 'Relógio'], ['engrenagem', 'gear', 'Engrenagem'], ['chave', 'oldkey', 'Chave'], ['bussola', 'compass', 'Bússola'], ['lampada', 'lightbulb', 'Lâmpada'], ['parafuso', 'nutbolt', 'Parafuso']].map(([id, img, name], i) => S(id, img, name, P[i], [4, 5, 6, 7, 8, 9][i]));
    const SHUF = [{ id: 'planeta', img: 'ringedplanet' }, { id: 'sol', img: 'sun' }, { id: 'lua', img: 'crescentmoon' }, { id: 'estrela', img: 'star2' }, { id: 'cometa', img: 'comet' }, { id: 'terra', img: 'globe' }, { id: 'galaxia', img: 'milkyway' }, { id: 'satelite', img: 'satellite' }, { id: 'foguete', img: 'rocket' }, { id: 'disco', img: 'ufo' }];
    const draw = pool(SY);
    const make = () => grid([4, 4, 4, 4], c => draw(c));
    const TT = n => (n < 4 ? -1 : n <= 5 ? 0 : n <= 7 ? 1 : n <= 10 ? 2 : 3);
    const spinShuf = () => [RNG.pick(SHUF), RNG.pick(SHUF)];
    const PTR = [SHUF[0], SHUF[2]];
    async function play(rt, g, m) {
      await rt.spin(g);
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => payClusters(clusters(gg, 4), TT), mult: () => m });
    }
    App.register(K.create({
      id: 'engrenagens', name: 'Engrenagens do Destino', studio: STUDIO, art: 'gear', mascot: 'watch',
      tag: 'Embaralhadores dão respin e bônus', colors: ['#b45309', '#334155'], bg: 'radial-gradient(circle at 50% 40%,#78350f,#1c1917 70%)',
      cols: 4, rows: 4, maxWin: 2000, vol: 3, rtp: '~95,6%', target: 0.956,
      intro: 'Inspirado no "Steampunk: Wheel of Destiny" (PG Soft).', hello: 'Combine os embaralhadores!',
      symbols: SY, extraSprites: SHUF.map(x => x.img),
      tables: [table('Pagamento por grupo', ['4–5', '6–7', '8–10', '11+'], SY, '4+ iguais encostados, com cascata.')],
      highlights: ['⚙️ Grade 4×4: grupos de <b>4+ iguais encostados</b> pagam, com cascata', '🪐 Dois <b>embaralhadores</b> sorteiam um de 10 astros: um acerto com o ponteiro dá <b>respin</b>', 'Os dois acertando = <b>Roda do Destino</b>: 8 giros com multiplicador que sobe a cada acerto', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Grade 4×4 com grupos de 4 ou mais iguais encostados e cascata. Acima, dois embaralhadores apontam para 🪐 e 🌙: se um deles mostrar o símbolo do seu ponteiro, você ganha um respin.</p>',
      features: '<p>🌀 Se os <b>dois embaralhadores</b> acertarem, abre a <b>Roda do Destino</b>: 8 giros em que cada acerto de embaralhador soma <b>+2 no multiplicador</b> (que não zera).</p>',
      make,
      async spin(rt) {
        for (let guard = 0; guard < 4; guard++) {
          const sh = spinShuf(), hit = sh.map((x, i) => x.id === PTR[i].id);
          rt.head([`${hit[0] ? '✅' : ''}${sh[0].id}`, '', '', `${hit[1] ? '✅' : ''}${sh[1].id}`]);
          await play(rt, make(), 1);
          if (hit[0] && hit[1]) { await rt.wait(700); rt.head(null); await this.bonus(rt, {}); return; }
          if (!hit[0] && !hit[1]) break;
          rt.msg('⚙️ Um embaralhador acertou: respin!'); rt.fx('rise');
        }
        rt.head(null);
      },
      async bonus(rt) {
        let m = 1;
        await rt.fsLoop(8, async () => {
          const sh = spinShuf(); const n = sh.filter((x, i) => x.id === PTR[i].id).length;
          if (n) { m += 2 * n; rt.chip('mult', 'MULT.', 'x' + m); }
          await play(rt, make(), m);
        }, { title: 'RODA DO DESTINO', sub: '8 giros · acertos sobem o multiplicador' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 33. Símbolos do Egito — linhas de bônus com multiplicador */
  (() => {
    const SY = [S('farao', 'pharaoh', 'Faraó', [25], 3), S('ankh', 'ankh', 'Ankh', [12], 4), S('escaravelho', 'scarab', 'Escaravelho', [8], 5), S('olho', 'eye', 'Olho', [5], 6), S('lotus', 'lotus', 'Lótus', [3], 7), S('papiro', 'scroll2', 'Papiro', [2], 8)];
    const WILD = { id: 'w', img: 'pyramid', name: 'Coringa', wild: true, reels: [1], w: 1.5 };
    const MYS = { id: 'mys', img: 'question', name: 'Mistério', mystery: true, noPay: true, w: 1.8 };
    const draw = pool([...SY, WILD, MYS]);
    const make = () => grid([3, 3, 3], c => draw(c));
    const BL = [[0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
    const MULTS = [{ m: 2, w: 50 }, { m: 3, w: 25 }, { m: 5, w: 15 }, { m: 10, w: 8 }, { m: 30, w: 2 }];
    App.register(K.create({
      id: 'simbolosegito', name: 'Símbolos do Egito', studio: STUDIO, art: 'ankh', mascot: 'pharaoh',
      tag: 'Linhas de bônus até x30', colors: ['#ca8a04', '#1e3a8a'], bg: 'linear-gradient(180deg,#fde68a,#ca8a04 50%,#1e3a8a)',
      cols: 3, rows: 3, maxWin: 1080, vol: 3, rtp: '~95,7%', target: 0.957, buy: false,
      intro: 'Inspirado no "Symbols of Egypt" (PG Soft).', hello: 'Complete uma linha de mistérios!',
      symbols: [...SY, WILD, MYS],
      lineList: { cols: 3, rows: 3, list: L3, text: '9 linhas.' },
      tables: [table('Pagamento por linha', ['3'], SY, '3 iguais numa linha. A pirâmide é coringa e só cai no rolo 2.')],
      highlights: ['🔺 3×3 com 9 linhas; coringa só no rolo 2', '❓ 4 <b>linhas de bônus</b> (cima, baixo e diagonais): completar uma delas com <b>mistérios</b> revela um multiplicador <b>x2, x3, x5, x10 ou x30</b>', 'Prêmio máximo: <b>1.080x</b>'],
      how: '<p>Grade 3×3 com 9 linhas. Os ❓ mistérios não pagam sozinhos.</p>',
      features: '<p>❓ Se uma das 4 linhas de bônus (linha de cima, de baixo ou uma diagonal) ficar toda de mistérios, eles revelam um multiplicador (x2 a x30) e um símbolo: a linha paga o símbolo × multiplicador, e os demais ganhos do giro também são multiplicados.</p>',
      make,
      async spin(rt) {
        const g = make(); await rt.spin(g);
        const full = BL.filter(L => L.every((r, c) => g[c][r].mystery));
        let m = 1;
        if (full.length) {
          m = RNG.weighted(MULTS).m * full.length;
          const s = RNG.pick(SY);
          g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...s, c: 'gold', fresh: true }; }));
          rt.msg(`❓ Linha de bônus! ${s.name} com x${m}`); rt.fx('boom'); await rt.drop(g);
        } else g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...RNG.pick(SY), fresh: true }; }));
        await pay(rt, lines(g, L3, SY), m);
      },
      async bonus() {},
    }));
  })();

  /* 34. Panela Quente (Hotpot) — grupos 3×3 e pote de pimentas */
  (() => {
    const SY = [S('camarao', 'shrimp', 'Camarão', [3, 6, 12, 30], 3), S('carne', 'cutofmeat', 'Carne', [2, 4, 8, 20], 4), S('tofu', 'oden', 'Tofu', [1.5, 3, 6, 15], 5), S('cogumelo', 'mushroom', 'Cogumelo', [1, 2, 4, 10], 6), S('bok', 'leafygreen', 'Verdura', [0.6, 1.2, 2.5, 6], 7)];
    const CHILI = { id: 'pimenta', img: 'pepper', name: 'Pimenta', noPay: true, chili: true, w: 1.2 };
    const draw = pool([...SY, CHILI]);
    const make = () => grid([3, 3, 3], c => draw(c));
    const TT = n => (n < 3 ? -1 : n === 3 ? 0 : n <= 5 ? 1 : n <= 7 ? 2 : 3);
    const JP = [{ n: 'MINI', v: 15, w: 85 }, { n: 'MAJOR', v: 100, w: 13.5 }, { n: 'GRAND', v: 1000, w: 1.5 }];
    let pot = 0;
    const GOAL = 30;
    App.register(K.create({
      id: 'panelaquente', name: 'Panela Quente', studio: STUDIO, art: 'pepper', mascot: 'stew',
      tag: 'Pote de pimentas · 3 jackpots', colors: ['#dc2626', '#f97316'], bg: 'linear-gradient(180deg,#fecaca,#ef4444 50%,#7f1d1d)',
      cols: 3, rows: 3, maxWin: 15000, vol: 3, rtp: '~95,8%', target: 0.958, buy: false,
      intro: 'Inspirado no "Hotpot" (PG Soft).', hello: 'Junte pimentas no pote!',
      symbols: [...SY, CHILI],
      tables: [table('Pagamento por grupo', ['3', '4–5', '6–7', '8+'], SY, 'Grupos de 3+ ingredientes iguais encostados, com cascata.'), { title: 'Jackpots do pote', head: ['valor'], rows: JP.map(j => ({ img: 'pepper', name: j.n, pays: [j.v] })) }],
      highlights: ['🍲 Panela 3×3: grupos de <b>3+ ingredientes</b> iguais encostados pagam, com cascata', '🌶️ Cada pimenta vai para o <b>pote</b>; com ' + GOAL + ' pimentas sai um <b>jackpot</b>: MINI 15x, MAJOR 100x ou GRAND 1.000x', 'Prêmio máximo: <b>15.000x</b>'],
      how: '<p>Grade 3×3 em forma de panela: grupos de 3 ou mais ingredientes iguais encostados pagam e somem (cascata).</p>',
      features: `<p>🌶️ Toda pimenta que aparece é guardada no pote acima da panela. Ao juntar <b>${GOAL}</b>, o pote ferve e paga um jackpot (MINI, MAJOR ou GRAND) e recomeça. O pote fica salvo enquanto você joga.</p>`,
      make,
      async spin(rt) {
        const g = make(); await rt.spin(g);
        await tumble(rt, g, { draw: c => draw(c), evaluate: gg => payClusters(clusters(gg, 3), TT) });
        pot += count(g, x => x.chili);
        if (pot >= GOAL) {
          pot -= GOAL;
          const j = RNG.weighted(JP);
          rt.stat('hold');
          await rt.banner(`JACKPOT ${j.n}!`, 'O pote de pimentas ferveu', 1400);
          rt.win(j.v); rt.msg(`🌶️ Jackpot ${j.n}: ${rt.coins(j.v)}`); rt.fx('jackpot'); await rt.wait(900);
        }
        rt.chip('pot', 'POTE', `${pot}/${GOAL}`);
      },
      async bonus() {},
    }));
  })();

  /* 35. Panda Hip Hop — combos em qualquer direção */
  (() => {
    const SY = [S('sete', 'seven', 'Sete', [5, 15, 40], 3), S('sino', 'bell2', 'Sino', [3, 8, 25], 4), S('macarrao', 'ramen', 'Lámen', [2, 5, 15], 5), S('melancia', 'watermelon', 'Melancia', [1.5, 4, 10], 5), S('cereja', 'cherries', 'Cereja', [1, 3, 8], 6), ...R([[0.4, 1, 3], [0.4, 1, 3], [0.3, 0.8, 2.5], [0.3, 0.8, 2.5]])];
    const WILD = { id: 'w', img: 'pandaface', name: 'Coringa', wild: true, w: 0.6 };
    const BOMB = { id: 'bomba', img: 'bomb', name: 'Bomba', bomb: true, noPay: true, w: 0.25, fw: 0.4 };
    const SC = { id: 'sc', img: 'headphone', name: 'Fone', sc: true, w: 1.5, fw: 0.8 };
    const draw = pool([...SY, WILD, BOMB, SC]);
    const make = wk => grid([3, 3, 3], c => draw(c, wk));
    /** combos de 3+ iguais ligados na horizontal, vertical ou diagonal */
    function chains(g) {
      let total = 0; const hit = new Set(), wins = [];
      for (const s of SY) {
        const seen = new Set();
        g.forEach((col, c) => col.forEach((x, r) => {
          if (x.id !== s.id || seen.has(key(c, r))) return;
          const comp = [], st = [[c, r]]; seen.add(key(c, r));
          while (st.length) { const [a, b] = st.pop(); comp.push(key(a, b)); for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const y = g[a + da] && g[a + da][b + db]; const k = key(a + da, b + db); if (y && !seen.has(k) && (y.id === s.id || y.wild)) { seen.add(k); st.push([a + da, b + db]); } } }
          if (comp.length >= 3) { const p = s.pays[Math.min(comp.length - 3, 2)]; total += p; wins.push({ sym: s, n: comp.length, pay: p }); comp.forEach(k => hit.add(k)); }
        }));
      }
      return { total, wins, cells: hit };
    }
    const REEL = [1, 2, 3, 5, 10];
    async function play(rt, g, fs, st) {
      if (!fs) st.i = 0;
      rt.head(REEL.slice(0, 3).map((m, j) => (j === Math.min(2, st.i % 3) ? `<b>x${fs ? Math.min(50, (st.base || 1) * m) : m}</b>` : '')));
      await rt.spin(g, { tease: !fs });
      // bomba explode a linha e a coluna dela
      cells(g, x => x.bomb).forEach(([c, r]) => { g.forEach((col, a) => { if (col[r] && !col[r].sc) col[r] = { ...draw(a), fresh: true }; }); g[c] = g[c].map((x, b) => (x.sc ? x : { ...draw(c), fresh: true })); rt.msg('💣 Bomba! Linha e coluna explodiram'); });
      await rt.drop(g);
      await tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'), evaluate: chains,
        mult: () => (fs ? Math.min(50, st.base * REEL[Math.min(st.i, 4)]) : REEL[Math.min(st.i, 4)]),
        onStep: async () => { st.i++; rt.chip('mult', 'MULT.', 'x' + (fs ? Math.min(50, st.base * REEL[Math.min(st.i, 4)]) : REEL[Math.min(st.i, 4)])); },
      });
      if (fs) { st.base = Math.min(10, st.base + (st.i ? 1 : 0)); st.i = 0; }
      rt.head(null);
      if (!fs) rt.chip('mult', null);
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'pandahiphop', name: 'Panda Hip Hop', studio: STUDIO, art: 'pandaface', mascot: 'headphone',
      tag: 'Combos em 8 direções · até x50', colors: ['#a21caf', '#22d3ee'], bg: 'linear-gradient(180deg,#0f172a,#701a75 60%,#0e7490)',
      cols: 3, rows: 3, maxWin: 572, vol: 3, rtp: '~95,8%', target: 0.958,
      intro: 'Inspirado no "Hip Hop Panda" (PG Soft).', hello: 'Combos valem até na diagonal!',
      symbols: [...SY, WILD, BOMB, SC],
      tables: [table('Pagamento por combo', ['3', '4', '5+'], SY, '3+ iguais ligados na horizontal, vertical ou diagonal.')],
      highlights: ['🐼 3×3 com <b>combos em corrente</b>: 3+ iguais ligados em qualquer direção (até diagonal), com cascata', 'Rolo de multiplicador no topo: <b>x1, x2, x3, x5, x10</b> conforme as cascatas', '💣 Bombas explodem a linha e a coluna', '🎧 3 fones = <b>10 rodadas grátis</b> com o multiplicador subindo até <b>x50</b>', 'Prêmio máximo: <b>572x</b>'],
      how: '<p>Grade 3×3: iguais ligados (encostados em qualquer uma das 8 direções) formam combos de 3 ou mais, que pagam e somem. Cada cascata avança o rolo de multiplicador: x1, x2, x3, x5 e x10.</p>',
      features: '<p>🎧 <b>3 fones</b> dão <b>10 rodadas grátis</b>. O rolo de multiplicador é multiplicado por um valor base que sobe +1 a cada giro com cascata (máximo x50).</p>',
      make: () => make('w'),
      async spin(rt) { const st = {}; const g = make('w'); if (await play(rt, g, false, st) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) { const st = { base: 1, i: 0 }; await rt.fsLoop(10, async api => { if (await play(rt, make('fw'), true, st) >= 3) api.add(5); }, { sub: 'Multiplicador sobe até x50' }); rt.chip('mult', null); },
    }));
  })();

  /* 36. Senhor Hallow-Win — assombração surpresa e coringas que andam */
  (() => {
    const SY = [S('vampiro', 'vampire', 'Vampiro', [3, 10, 50], 3), S('bruxa', 'mage', 'Bruxa', [2.5, 8, 40], 3), S('fantasma', 'ghost', 'Fantasma', [2, 6, 30], 4), S('caveira', 'skull', 'Caveira', [1.5, 5, 20], 4), S('vela', 'candle', 'Vela', [1, 3, 10], 5), ...R([[0.3, 1, 3], [0.3, 1, 3], [0.2, 0.8, 2], [0.2, 0.8, 2]])];
    const WILD = { id: 'w', img: 'pumpkin', name: 'Abóbora', wild: true, reels: [1, 2, 3, 4], w: 0.7, fw: 1.3 };
    const SC = { id: 'sc', img: 'house', name: 'Casa assombrada', sc: true, w: 0.7 };
    const draw = pool([...SY, WILD, SC]);
    const make = () => grid([4, 4, 4, 4, 4], c => draw(c));
    App.register(K.create({
      id: 'senhorhallow', name: 'Senhor Hallow-Win', studio: STUDIO, art: 'pumpkin', mascot: 'ghost',
      tag: 'Assombração surpresa · coringas que andam', colors: ['#f97316', '#4c1d95'], bg: 'linear-gradient(180deg,#1e1b4b,#4c1d95 50%,#7c2d12)',
      cols: 5, rows: 4, maxWin: 1964, vol: 3, rtp: '~95,9%', target: 0.959,
      intro: 'Inspirado no "Mr. Hallow-Win" (PG Soft).', hello: 'Cuidado com a assombração surpresa!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 4, list: L30, text: '30 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🎃 5×4 com 30 linhas', '👻 <b>Mini Assombração</b>: de surpresa, abóboras invadem a tela e garantem um ganho', '🏚️ 3+ casas = <b>10 rodadas grátis</b>: toda abóbora <b>gruda</b> e <b>anda uma casa para a esquerda</b> a cada giro', 'Prêmio máximo: <b>1.964x</b>'],
      how: '<p>Grade 5×4 com 30 linhas. A abóbora é coringa nos rolos 2 a 5.</p><p>👻 Em qualquer giro sem ganho, a <b>Mini Assombração</b> pode aparecer e espalhar abóboras até sair um ganho.</p>',
      features: '<p>🏚️ <b>3 ou mais casas assombradas</b> dão <b>10 rodadas grátis</b>. As abóboras ficam na tela e, a cada giro, andam uma casa para a esquerda até sair da grade.</p>',
      make,
      async spin(rt) {
        const g = make(); await rt.spin(g);
        let res = lines(g, L30, SY);
        if (!res.total && RNG.float() < 0.04) {
          rt.msg('👻 Mini Assombração!'); rt.fx('boom');
          for (let guard = 0; guard < 8 && !res.total; guard++) { g[RNG.int(1, 4)][RNG.int(0, 3)] = { ...WILD, fresh: true }; res = lines(g, L30, SY); }
          await rt.drop(g);
        }
        await pay(rt, res);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let walk = [];
        await rt.fsLoop(10, async api => {
          const g = grid([4, 4, 4, 4, 4], c => draw(c, 'fw'));
          walk = walk.map(([c, r]) => [c - 1, r]).filter(([c]) => c >= 0);
          walk.forEach(([c, r]) => { g[c][r] = { ...WILD, c: 'sticky' }; });
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => { if (!walk.some(([a, b]) => a === c && b === r)) walk.push([c, r]); });
          await pay(rt, lines(g, L30, SY));
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: 'Abóboras colantes que andam' });
      },
    }));
  })();

  /* 37. Restaurante Maluco — clientes transformam rolos em coringa */
  (() => {
    const DISH = [S('sushi', 'sushi', 'Sushi', [3, 10, 40], 4), S('burger', 'hamburger', 'Hambúrguer', [2.5, 8, 30], 4), S('pizza', 'pizza', 'Pizza', [2, 6, 25], 5), S('massa', 'spaghetti', 'Espaguete', [1.5, 5, 20], 5), S('bolo', 'cake', 'Bolo', [1, 4, 15], 6)];
    const SY = [...DISH, ...R([[0.3, 1, 3], [0.3, 1, 3], [0.2, 0.8, 2.5], [0.2, 0.8, 2.5]])];
    const WILD = { id: 'w', img: 'cook', name: 'Chef', wild: true, w: 0.5 };
    const draw = pool([...SY, WILD]);
    const make = () => grid([4, 4, 4, 4, 4], c => draw(c));
    const FACES = ['manface', 'womanface', 'oldman', 'girlface', 'boyface'];
    App.register(K.create({
      id: 'restaurantemaluco', name: 'Restaurante Maluco', studio: STUDIO, art: 'cook', mascot: 'hamburger',
      tag: 'Pedido certo vira rolo coringa', colors: ['#ef4444', '#facc15'], bg: 'linear-gradient(180deg,#fef9c3,#fca5a5 50%,#991b1b)',
      cols: 5, rows: 4, maxWin: 2000, vol: 2, rtp: '~97,4%', target: 0.974, buy: false,
      intro: 'Inspirado no "Restaurant Craze" (PG Soft).', hello: 'Sirva o prato que o cliente pediu!',
      symbols: [...SY, WILD], extraSprites: FACES,
      lineList: { cols: 5, rows: 4, list: L30, text: '30 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🍔 5×4 com 30 linhas', '🧑‍🍳 Cinco clientes acima dos rolos fazem <b>pedidos</b>: se o prato pedido cair no rolo daquele cliente, o <b>rolo inteiro vira coringa</b>', 'De 1 a 5 rolos coringa num giro!', 'RTP alto: <b>~97,4%</b>'],
      how: '<p>Grade 5×4 com 30 linhas. A cada giro alguns dos cinco clientes fazem um pedido (aparece acima do rolo). Se o prato pedido cair no rolo dele, o rolo todo vira coringa (Chef).</p>',
      features: '<p>Não há rodadas grátis: toda a graça está nos pedidos, que podem transformar de 1 a 5 rolos em coringa no mesmo giro.</p>',
      make,
      async spin(rt) {
        const g = make();
        const ord = [0, 1, 2, 3, 4].map(() => (RNG.float() < 0.35 ? RNG.pick(DISH) : null));
        rt.head(ord.map(d => (d ? `${d.name}?` : '')));
        await rt.spin(g);
        let n = 0;
        ord.forEach((d, c) => { if (d && g[c].some(x => x.id === d.id)) { g[c] = g[c].map(() => ({ ...WILD, c: 'gold', fresh: true })); n++; } });
        if (n) { rt.msg(`🧑‍🍳 ${n} pedido${n > 1 ? 's' : ''} servido${n > 1 ? 's' : ''}: rolo${n > 1 ? 's' : ''} coringa!`); rt.fx('rise'); await rt.drop(g); }
        await pay(rt, lines(g, L30, SY));
        rt.head(null);
      },
      async bonus() {},
    }));
  })();

  /* 38. A Armadilha de Diao Chan — escolha o bônus */
  (() => {
    const L30x3 = K.LINES_5x3.slice(0, 25).concat([[0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [1, 0, 0, 1, 2], [1, 2, 2, 1, 0], [0, 0, 1, 1, 2]]);
    const SY = [S('lubu', 'militaryhelmet', 'Lü Bu', [3, 12, 60], 3), S('dongzhuo', 'oldman', 'Dong Zhuo', [2.5, 10, 50], 3), S('alabarda', 'spear', 'Alabarda', [2, 6, 30], 4), S('leque', 'fan', 'Leque', [1.5, 5, 20], 4), S('lanterna', 'izakaya', 'Lanterna', [1, 3, 12], 5), ...R([[0.3, 1, 4], [0.3, 1, 4], [0.2, 0.8, 3], [0.2, 0.8, 3]])];
    const WILD = { id: 'w', img: 'geisha', name: 'Diao Chan', wild: true, w: 0.75 };
    const SC = { id: 'sc', img: 'moonview', name: 'Lua', sc: true, w: 1.0 };
    const draw = pool([...SY, WILD, SC]);
    const make = (extra = 0) => grid([3, 3, 3, 3, 3], c => { const x = draw(c); return extra && c >= 1 && c <= 3 && RNG.float() < extra ? { ...WILD } : x; });
    const OPTS = { lubu: { n: 'Fúria de Lü Bu', s: 8, d: '8 giros · coringas expandem nos rolos 2-4', vol: 'alta' }, dong: { n: 'Banquete de Dong Zhuo', s: 12, d: '12 giros · tudo x2', vol: 'média' }, diao: { n: 'Dança de Diao Chan', s: 15, d: '15 giros · coringas extras', vol: 'baixa' } };
    App.register(K.create({
      id: 'diaochan', name: 'A Armadilha de Diao Chan', studio: STUDIO, art: 'geisha', mascot: 'fan',
      tag: 'Escolha a volatilidade do bônus', colors: ['#be185d', '#7c2d12'], bg: 'linear-gradient(180deg,#fbcfe8,#be185d 50%,#4c0519)',
      cols: 5, rows: 3, maxWin: 20230, vol: 4, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Honey Trap of Diao Chan" (PG Soft).', hello: 'Diao Chan é o coringa!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L30x3, text: '30 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['🏮 5×3 com 30 linhas; Diao Chan é o coringa', '🌕 3+ luas = escolha seu bônus: <b>Lü Bu</b> (8 giros, coringas expandem), <b>Dong Zhuo</b> (12 giros x2) ou <b>Diao Chan</b> (15 giros com coringas extras)', 'Prêmio máximo: <b>20.230x</b>'],
      how: '<p>Grade 5×3 com 30 linhas.</p>',
      features: `<p>🌕 <b>3 ou mais luas</b> dão a escolha entre três rodadas grátis:</p><table class="paytable"><tr class="si-head"><td>Bônus</td><td>Giros</td><td>Recurso</td><td>Volatilidade</td></tr>${Object.values(OPTS).map(o => `<tr><td>${o.n}</td><td>${o.s}</td><td>${o.d.split('· ')[1]}</td><td>${o.vol}</td></tr>`).join('')}</table>`,
      make: () => make(),
      async spin(rt) { const g = make(); await rt.spin(g); await pay(rt, lines(g, L30x3, SY)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const id = await rt.choose('ESCOLHA SEU DESTINO', Object.entries(OPTS).map(([k, o]) => ({ id: k, img: k === 'lubu' ? 'militaryhelmet' : k === 'dong' ? 'oldman' : 'geisha', label: o.n, desc: o.d })));
        const o = OPTS[id];
        await rt.fsLoop(o.s, async api => {
          const g = make(id === 'diao' ? 0.12 : 0);
          if (id === 'lubu') [1, 2, 3].forEach(c => { if (g[c].some(x => x.wild)) g[c] = g[c].map(() => ({ ...WILD, c: 'gold' })); });
          await rt.spin(g, { tease: false });
          await pay(rt, lines(g, L30x3, SY), id === 'dong' ? 2 : 1);
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: o.d });
      },
    }));
  })();

  /* 39. Livro dos Mistérios do Egito — escolha giros ou multiplicador */
  (() => {
    let pick = 1;
    const G = pg({
      id: 'livromisterio', name: 'Livro dos Mistérios do Egito', art: 'goldbook', mascot: 'pharaoh', tag: 'Escolha: 15 giros x1 a 5 giros x10',
      colors: ['#ca8a04', '#0f172a'], bg: 'linear-gradient(180deg,#fef3c7,#a16207 50%,#1c1917)', maxWin: 100000, vol: 5, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Egypt\'s Book of Mystery" (PG Soft).', hello: 'Molduras viram coringas!',
      syms: mk([['farao', 'pharaoh', 'Faraó'], ['anubis', 'jackal', 'Anúbis'], ['ankh', 'ankh', 'Ankh'], ['escaravelho', 'scarab', 'Escaravelho'], ['olho', 'eye', 'Olho']], P6),
      wildImg: 'pyramid', scImg: 'goldbook', scName: 'Livro', scW: 0.35, scMin: 3,
      heights: () => [5, 6, 6, 6, 6, 5], silver: [0.06, 0.14],
      baseM: { start: 1, add: 1 }, fsM: { start: 1, add: 1 },
      before: async (rt, g, fs, st) => { if (fs) { st.m = pick; } },
      fsCount: () => ({ 1: 15, 5: 10, 10: 5 }[pick] || 15), retrigMin: 99,
      waysNote: 'Rolos 5-6-6-6-6-5 = 32.400 caminhos.',
      highlights: ['📖 Rolos 5-6-6-6-6-5 (32.400 caminhos) com cascata e multiplicador <b>+1 por cascata</b>', '🖼️ Molduras prata → douradas → <b>coringa</b>', '3+ livros: escolha <b>15 giros x1</b>, <b>10 giros x5</b>, <b>5 giros x10</b> ou mistério; o multiplicador do giro começa no valor escolhido e sobe +1 por cascata', 'Prêmio máximo: <b>100.000x</b>'],
      how: `<p>Rolos 5-6-6-6-6-5 com cascata; o multiplicador sobe +1 a cada cascata e zera no próximo giro. ${silverTxt}</p>`,
      features: '<p>📖 <b>3 ou mais livros</b> abrem a escolha: 15 giros começando em x1, 10 giros começando em x5, 5 giros começando em x10, ou uma escolha mistério. Em cada giro grátis o multiplicador começa no valor escolhido e sobe +1 por cascata.</p>',
    });
    // a escolha acontece antes das rodadas grátis
    const cfg = G.logic, orig = cfg.bonus;
    cfg.bonus = async function (rt, opts) {
      const id = await rt.choose('ESCOLHA O PODER DO LIVRO', [{ id: '1', img: 'goldbook', label: '15 giros', desc: 'começa em x1' }, { id: '5', img: 'goldbook', label: '10 giros', desc: 'começa em x5' }, { id: '10', img: 'goldbook', label: '5 giros', desc: 'começa em x10' }, { id: 'm', img: 'question', label: 'Mistério', desc: 'sorteado' }]);
      pick = id === 'm' ? RNG.pick([1, 5, 10]) : Number(id);
      return orig.call(this, rt, opts);
    };
    App.register(G);
  })();

  /* 40. Sonhos de Macau — coringas colantes que viajam */
  App.register(pg({
    id: 'sonhosmacau', name: 'Sonhos de Macau', art: 'slot', mascot: 'moneybag', tag: 'Coringas viajantes · mult. sem zerar',
    colors: ['#ca8a04', '#be123c'], bg: 'linear-gradient(180deg,#450a0a,#7f1d1d 50%,#0c0a09)', maxWin: 6160, vol: 3, rtp: '~96,7%',
    intro: 'Inspirado no "Dreams of Macau" (PG Soft).', hello: 'Coringas descem na diagonal!',
    syms: mk([['cassino', 'slot', 'Caça-níquel'], ['dados', 'dice2', 'Dados'], ['fichas', 'coin', 'Fichas'], ['champanhe', 'champagne', 'Champanhe'], ['diamante', 'gem', 'Diamante']], P6),
    wildImg: 'moneybag', wildW: 0.45, scImg: 'cityscape', scName: 'Macau', scW: 1.2, scMin: 4,
    heights: () => Array.from({ length: 6 }, () => RNG.int(2, 6)),
    convert: x => (x.wild ? { ...x, c: 'sticky' } : null),
    onStep: async (rt, gg, fs, st, res, cellOf) => {
      // coringas vencedores andam uma casa na diagonal (baixo-esquerda)
      const ws = cells(gg, x => x.wild);
      ws.forEach(([c, r]) => { let x; do x = cellOf(c); while (x.wild || x.sc); gg[c][r] = { ...x, fresh: true }; });
      ws.forEach(([c, r]) => { const a = c - 1, b = r + 1; if (gg[a] && gg[a][b]) gg[a][b] = { id: 'w', img: 'moneybag', name: 'Coringa', wild: true, c: 'sticky', fresh: true }; });
    },
    baseM: {}, fsM: { start: 1, add: 1, persist: true }, fsCount: s => 15 + (s - 4) * 2,
    highlights: ['🎰 6 rolos de 2 a 6 símbolos com cascata', '💰 Coringas que ganham <b>ficam</b> e <b>viajam na diagonal</b> (para baixo e à esquerda) a cada cascata', '🌃 4+ Macaus = <b>15 rodadas grátis</b> (+2 por extra) com multiplicador <b>+1 por ganho</b> que não zera', 'Prêmio máximo: <b>6.160x</b>'],
    how: '<p>6 rolos de altura variável com cascata. Quando um coringa participa de um ganho, ele não some: na cascata seguinte ele anda uma casa na diagonal para baixo e para a esquerda, até sair da grade.</p>',
    features: '<p>🌃 <b>4 ou mais Macaus</b> dão <b>15 rodadas grátis</b> (+2 por extra). O multiplicador soma +1 a cada cascata e não zera entre os giros.</p>',
  }));
})();
