'use strict';

/* =========================================================
   Pragmatic Play — lote 2 (parte 1): linhas "1000", Megaways,
   grupos e respins. Regras baseadas nos originais; RTP calibrado
   por simulação (tools/calibrate.js).
   ========================================================= */
(function () {
  const K = SlotKit, T = SlotT;
  const { S, pool, ways, lines, cells, count, key, unkey, clusters, payClusters, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'pragmatic';
  const R = (pays, w) => K.ROYALS(pays, w);
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const mega = (min = 2, max = 7) => Array.from({ length: 6 }, () => RNG.int(min, max));
  const ORB1000 = [{ m: 2, w: 300 }, { m: 3, w: 220 }, { m: 4, w: 150 }, { m: 5, w: 120 }, { m: 6, w: 80 }, { m: 8, w: 60 }, { m: 10, w: 50 }, { m: 15, w: 30 }, { m: 20, w: 20 }, { m: 25, w: 14 }, { m: 50, w: 6 }, { m: 100, w: 2.5 }, { m: 250, w: 0.8 }, { m: 500, w: 0.3 }, { m: 1000, w: 0.1 }];
  const AP = [[10, 25, 50], [2.5, 10, 25], [2, 5, 15], [1.5, 2, 12], [1, 1.5, 10], [0.8, 1.2, 8], [0.5, 1, 5], [0.4, 0.9, 4], [0.25, 0.75, 2]];
  const AW = [3, 4, 5, 6, 8, 9, 10, 11, 12];
  const anySyms = list => list.map(([id, img, name], i) => S(id, img, name, AP[i], AW[i]));

  /* 1. Portões do Olimpo 1000 */
  App.register(T.scatterPays({
    id: 'olimpo1000', name: 'Portões do Olimpo 1000', studio: STUDIO, art: 'cloudbolt', mascot: 'cloudbolt',
    tag: 'Orbes até x1.000 · 15.000x', colors: ['#4338ca', '#f59e0b'], bg: 'radial-gradient(circle at 50% 0%,#4338ca,#1e1b4b 70%)',
    intro: 'Inspirado no "Gates of Olympus 1000" (Pragmatic Play).', maxWin: 15000,
    syms: anySyms([['coroa', 'laurel', 'Louros'], ['ampulheta', 'harp', 'Lira'], ['anel', 'scroll2', 'Pergaminho'], ['calice', 'goblet', 'Cálice'], ['rubi', 'heartfire', 'Rubi'], ['safira', 'bluediamond', 'Safira'], ['topazio', 'orangediamond', 'Topázio'], ['ametista', 'purpleheart', 'Ametista'], ['esmeralda', 'greenheart', 'Esmeralda']]),
    scImg: 'cloudbolt', scName: 'Raio', scW: 1.25, orbImg: 'crystal', orbName: 'Orbes', orbs: ORB1000, orbBase: 0.005, orbFS: 0.03, accumulate: true, fsCount: 15,
    highlights: ['⚡ Orbes de <b>x2 até x1.000</b> em qualquer giro', 'Nas rodadas grátis os orbes <b>acumulam</b> num multiplicador total', '4+ raios = <b>15 rodadas grátis</b>', 'Prêmio máximo: <b>15.000x</b>'],
  }));

  /* 2. Doce Rush 1000 */
  const RUSHP = [[1, 2, 4, 10, 30, 150], [0.8, 1.5, 3, 7, 20, 100], [0.6, 1.2, 2.5, 5, 15, 60], [0.5, 1, 2, 4, 10, 40], [0.4, 0.8, 1.5, 3, 8, 30], [0.3, 0.6, 1.2, 2.5, 6, 25], [0.25, 0.5, 1, 2, 5, 20]];
  const rushSyms = list => list.map(([id, img, name], i) => S(id, img, name, RUSHP[i], [6, 7, 8, 9, 10, 11, 12][i]));
  App.register(T.clusterSpots({
    id: 'docerush1000', name: 'Doce Rush 1000', studio: STUDIO, art: 'gumball', mascot: 'gumball',
    tag: 'Posições até x1.024 · 25.000x', colors: ['#ec4899', '#22d3ee'], bg: 'linear-gradient(180deg,#fdf2f8,#fbcfe8 60%,#a5f3fc)',
    intro: 'Inspirado no "Sugar Rush 1000" (Pragmatic Play).', maxWin: 25000, cap: 1024,
    syms: rushSyms([['gelatina', 'jelly', 'Gelatina'], ['pirulito2', 'candycane', 'Bengala'], ['marshmallow', 'marshmallow', 'Marshmallow'], ['bolo', 'cake', 'Bolo'], ['torta', 'pie', 'Torta'], ['biscoito', 'cookie', 'Biscoito'], ['pudim', 'custard', 'Pudim']]),
    scImg: 'gumball', scName: 'Máquina de chiclete', scW: 0.46, fsTable: { 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 },
    highlights: ['🍬 Grade 7×7 com grupos e cascata', '✨ Posições multiplicadoras dobram até <b>x1.024</b>', '3+ scatters = <b>10 a 30 rodadas grátis</b> com as posições <b>guardadas</b>', 'Prêmio máximo: <b>25.000x</b>'],
  }));

  /* 3. Princesa Estelar 1000 */
  App.register(T.scatterPays({
    id: 'princesa1000', name: 'Princesa Estelar 1000', studio: STUDIO, art: 'fairy', mascot: 'fairy',
    tag: 'Corações até x1.000 · 15.000x', colors: ['#db2777', '#6d28d9'], bg: 'radial-gradient(circle at 50% 0%,#be185d,#2e1065 65%)',
    intro: 'Inspirado no "Starlight Princess 1000" (Pragmatic Play).', maxWin: 15000,
    syms: anySyms([['tiara', 'tiara', 'Tiara'], ['cetro', 'wand', 'Cetro'], ['lua', 'crescentmoon', 'Lua'], ['espelho', 'mirror', 'Espelho'], ['rosa', 'heartsparkle', 'Coração brilhante'], ['azul', 'blueheart', 'Coração azul'], ['roxo', 'purpleheart', 'Coração roxo'], ['verde', 'greenheart', 'Coração verde'], ['amarelo', 'yellowheart', 'Coração dourado']]),
    scImg: 'shootingstar', scName: 'Estrela cadente', scW: 1.25, orbImg: 'heartgrow', orbName: 'Corações', orbs: ORB1000, orbBase: 0.005, orbFS: 0.03, accumulate: true, fsCount: 15,
    highlights: ['💖 Corações multiplicadores de <b>x2 até x1.000</b>', 'Nas rodadas grátis eles <b>acumulam</b>', '4+ estrelas = <b>15 rodadas grátis</b>', 'Prêmio máximo: <b>15.000x</b>'],
  }));

  /* 4. Doce Bonança 1000 */
  App.register(T.scatterPays({
    id: 'doce1000', name: 'Doce Bonança 1000', studio: STUDIO, art: 'bombcandy', mascot: 'icecream',
    tag: 'Bombas até x1.000 · 25.000x', colors: ['#f472b6', '#f97316'], bg: 'linear-gradient(180deg,#7dd3fc,#c4b5fd 60%,#f9a8d4)',
    intro: 'Inspirado no "Sweet Bonanza 1000" (Pragmatic Play).', maxWin: 25000,
    syms: anySyms([['coracao', 'candyheart', 'Bala de coração'], ['sorvete', 'icecream', 'Sorvete'], ['donut', 'doughnut', 'Rosquinha'], ['chocolate', 'candybar', 'Chocolate'], ['maca', 'redapple2', 'Maçã do amor'], ['cereja', 'cherries', 'Cereja'], ['melancia', 'watermelon', 'Melancia'], ['uva', 'grapes', 'Uva'], ['banana', 'banana', 'Banana']]).map(s => ({ ...s, pays: s.pays.map(p => p * 2.2) })),
    scImg: 'lollipop', scName: 'Pirulito', scW: 1.25, orbImg: 'bombcandy', orbName: 'Bombas', orbs: ORB1000, orbBase: 0, orbFS: 0.05, accumulate: false, fsCount: 10,
    highlights: ['🍭 Paga em qualquer lugar com cascata', '💣 Nas rodadas grátis caem <b>bombas de x2 até x1.000</b> que se somam', '4+ pirulitos = <b>10 rodadas grátis</b>', 'Prêmio máximo: <b>25.000x</b>'],
  }));

  /* 5. 5 Leões Megaways */
  (() => {
    const SY = [S('leao', 'lion', 'Leão dourado', [1, 2.5, 6, 15], 3), S('dragao', 'dragon', 'Dragão', [0.8, 2, 5, 12], 4), S('tartaruga', 'turtle', 'Tartaruga', [0.6, 1.5, 4, 9], 5), S('fenix', 'peacock', 'Fênix', [0.5, 1.2, 3, 7], 5), S('lingote', 'moneybag', 'Lingote', [0.4, 1, 2.5, 5], 6), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const WILD = { id: 'w', img: 'lionface', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.7, fw: 1.1 };
    const SC = { id: 'sc', img: 'yinyang', name: 'Yin-Yang', sc: true, w: 0.55, fw: 0.4 };
    const draw = pool([...SY, WILD, SC]);
    const make = (wk = 'w') => K.stack(mega().map((hh, c) => Array.from({ length: hh }, () => draw(c, wk))), 0.3);
    const OPTS = [{ s: 25, m: [2, 3, 5] }, { s: 20, m: [3, 5, 8] }, { s: 15, m: [5, 8, 10] }, { s: 13, m: [8, 10, 15] }, { s: 10, m: [10, 15, 20] }, { s: 6, m: [15, 20, 30, 40] }];
    async function play(rt, g, mults, fs) {
      return tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'),
        evaluate: gg => {
          const res = ways(gg, SY);
          const nw = [...res.cells].filter(k => { const [c, r] = unkey(k); return gg[c][r].wild; }).length;
          // nas grátis os multiplicadores de vários coringas se multiplicam
          if (nw) { const m = fs ? Math.min(100, Array.from({ length: nw }, () => RNG.pick(mults)).reduce((a, b) => a * b, 1)) : RNG.pick(mults); res.total *= m; rt.msg(`🦁 Coringa x${m}!`); }
          return res;
        },
      });
    }
    App.register(K.create({
      id: 'cincoleoes', name: '5 Leões Megaways', studio: STUDIO, art: 'lionface', mascot: 'lion',
      tag: 'Escolha giros ou multiplicador', colors: ['#dc2626', '#ca8a04'], bg: 'linear-gradient(180deg,#7f1d1d,#991b1b 60%,#450a0a)',
      cols: 6, rows: 7, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "5 Lions Megaways" (Pragmatic Play).', hello: 'Até 117.649 caminhos!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata.')],
      highlights: ['🦁 Megaways com cascata', 'Coringa em ganho aplica um multiplicador aleatório (base: x2 a x10); nas grátis os multiplicadores de vários coringas <b>se multiplicam</b>', '☯️ 3+ Yin-Yang: escolha entre <b>muitos giros</b> ou <b>multiplicadores enormes</b> (até x40)', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>6 rolos Megaways (2 a 7 símbolos) com cascata. O coringa (rolos 2 a 5) que entra num ganho aplica um multiplicador aleatório.</p>',
      features: `<p>☯️ <b>3 ou mais Yin-Yang</b> e você escolhe as rodadas grátis:</p><table class="paytable"><tr class="si-head"><td>Giros</td><td>Multiplicadores do coringa</td></tr>${OPTS.map(x => `<tr><td>${x.s}</td><td>${x.m.map(m => 'x' + m).join(', ')}</td></tr>`).join('')}<tr><td>?</td><td>Mistério: giros e multiplicadores sorteados</td></tr></table>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, [2, 3, 5, 8, 10]);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const id = await rt.choose('ESCOLHA SEU LEÃO', [...OPTS.map((x, i) => ({ id: String(i), img: 'lionface', label: `${x.s} giros`, desc: x.m.map(m => 'x' + m).join(' · ') })), { id: 'm', img: 'yinyang', label: 'Mistério', desc: 'sorteado' }]);
        const opt = id === 'm' ? { s: RNG.int(6, 25), m: RNG.pick(OPTS).m } : OPTS[Number(id)];
        await rt.fsLoop(opt.s, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, opt.m, true);
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: `${opt.s} giros · coringas ${opt.m.map(m => 'x' + m).join('/')}` });
      },
    }));
  })();

  /* 6. Poder de Thor Megaways */
  (() => {
    const SY = [S('thor', 'hammer', 'Martelo', [1, 2.5, 6, 15], 3), S('elmo', 'militaryhelmet', 'Elmo', [0.8, 2, 5, 12], 4), S('chifre', 'drinkhorn', 'Chifre', [0.6, 1.5, 4, 9], 5), S('runa', 'runestone', 'Runa', [0.5, 1.2, 3, 7], 5), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const WILD = { id: 'w', img: 'lightning', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.5 };
    const HAMMER = { id: 'mj', img: 'hammer', name: 'Mjölnir', hammer: true, noPay: true, reels: [1, 2, 3, 4], w: 0.12, fw: 0.5, c: 'gsq' };
    const SC = { id: 'sc', img: 'cloudbolt', name: 'THOR', sc: true, w: 0.9, fw: 0.5 };
    const draw = pool([...SY, WILD, HAMMER, SC]);
    const make = wk => K.stack(mega().map((hh, c) => Array.from({ length: hh }, () => draw(c, wk))), 0.3);
    const BASE = [1, 2, 3, 5, 8];
    async function play(rt, g, fs, st) {
      // martelo: o rolo inteiro abaixo vira coringa
      const hammer = async gg => { for (let c = 0; c < 6; c++) if (gg[c].some(x => x.hammer)) { gg[c] = gg[c].map(() => ({ ...WILD, fresh: true })); rt.msg('🔨 O martelo de Thor transformou o rolo em coringas!'); rt.fx('boom'); } };
      await hammer(g);
      await rt.drop(g);
      let m = fs ? st.m : 1;
      rt.chip('mult', 'MULT.', 'x' + (fs ? m : BASE[0]));
      await tumble(rt, g, {
        draw: c => draw(c, fs ? 'fw' : 'w'),
        evaluate: gg => ways(gg, SY),
        mult: s => (fs ? m : BASE[Math.min(4, s)]),
        onStep: async (s, gg) => { if (fs) { m++; st.m = m; } rt.chip('mult', 'MULT.', 'x' + (fs ? m : BASE[Math.min(4, s)])); await hammer(gg); },
      });
      if (!fs) rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'poderthor', name: 'Poder de Thor Megaways', studio: STUDIO, art: 'hammer', mascot: 'cloudbolt',
      tag: 'Martelo transforma rolos', colors: ['#1d4ed8', '#64748b'], bg: 'linear-gradient(180deg,#1e3a8a,#334155 60%,#0f172a)',
      cols: 6, rows: 7, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Power of Thor Megaways" (Pragmatic Play).', hello: 'O martelo transforma rolos em coringa!',
      symbols: [...SY, WILD, HAMMER, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata.')],
      highlights: ['🔨 O <b>martelo de Thor</b> transforma o rolo inteiro em coringas', 'Multiplicador de cascata: <b>x1, x2, x3, x5, x8</b>', '⚡ 4+ THOR = rodadas grátis com multiplicador <b>+1 por cascata, sem limite</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Megaways (2 a 7 símbolos por rolo) com cascata. No jogo base cada cascata seguida sobe o multiplicador: x1, x2, x3, x5 e x8.</p><p>🔨 Quando o <b>martelo</b> cai (rolos 2 a 5), todos os símbolos daquele rolo viram <b>coringa</b>.</p>',
      features: '<p>⚡ <b>4 ou mais scatters</b> dão <b>10 rodadas grátis</b> (+5 a cada 3 scatters). O multiplicador começa em x1 e soma <b>+1 a cada cascata</b>, sem teto e sem zerar até o fim do bônus.</p>',
      make: () => make('w'),
      async spin(rt) {
        const g = make('w');
        await rt.spin(g);
        await play(rt, g, false);
        if (count(g, x => x.sc) >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const st = { m: 1 };
        await rt.fsLoop(10, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, true, st); if (count(g, x => x.sc) >= 3) api.add(5); }, { sub: 'Multiplicador sem teto!' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 7. Riquezas Selvagens (Wild Wild Riches) */
  (() => {
    const SY = [S('duende', 'shamrock', 'Trevo', [1.5, 5, 15], 3), S('cachimbo', 'pipe', 'Cachimbo', [1, 3, 10], 4), S('chapeu', 'tophat', 'Cartola', [0.8, 2.5, 8], 5), S('ferradura', 'horseshoe', 'Ferradura', [0.6, 2, 6], 5), ...R([[0.25, 0.8, 2.5], [0.25, 0.8, 2.5], [0.2, 0.6, 2], [0.2, 0.6, 2]])];
    const WILD = { id: 'w', img: 'rainbow', name: 'Coringa', wild: true, reels: [0, 1], w: 1.4, fw: 1.8 };
    const POT = { id: 'pote', img: 'honeypot', name: 'Pote de ouro', coin: true, noPay: true, reels: [2, 3, 4], w: 2.2, fw: 3.6 };
    const MULT = { id: 'mx', img: 'clover', name: 'Multiplicador', reels: [2, 3, 4], noPay: true, w: 0.35, fw: 0.7 };
    const BON = { id: 'bon', img: 'beer', name: 'Bônus', reels: [2], noPay: true, w: 0.3 };
    const draw = pool([...SY, WILD, POT, MULT, BON]);
    const VALS = [{ v: 1, w: 40 }, { v: 2, w: 25 }, { v: 3, w: 12 }, { v: 5, w: 10 }, { v: 10, w: 7 }, { v: 15, w: 4 }, { v: 25, w: 2 }];
    const cell = (c, wk) => { const x = draw(c, wk); if (x.coin) x.v = RNG.weighted(VALS).v; if (x.id === 'mx') { x.m = RNG.pick([2, 3, 5]); x.t = 'x' + x.m; } return x; };
    const make = wk => grid([3, 3, 4, 4, 4], c => cell(c, wk));
    async function play(rt, g, st) {
      await pay(rt, ways(g, SY));
      const hasW = g[0].some(x => x.wild) || g[1].some(x => x.wild);
      const v = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);
      // nas grátis os trevos multiplicadores somam num multiplicador que fica até o fim
      if (st) { const add = g.flat().filter(x => x.id === 'mx').reduce((s, x) => s + x.m, 0); if (add) { st.m += add; rt.chip('mult', 'MULT.', 'x' + st.m); } }
      if (hasW && v) {
        const m = st ? st.m : g.flat().filter(x => x.id === 'mx').reduce((s, x) => s * x.m, 1);
        rt.mark(cells(g, x => x.coin || x.wild || x.id === 'mx').map(([c, r]) => key(c, r)));
        rt.win(v * m);
        rt.msg(`🍀 Potes coletados: ${rt.coins(v)}${m > 1 ? ` × ${m}` : ''} = ${rt.coins(v * m)}`);
        rt.fx('coin');
        await rt.wait(1000);
      }
      return hasW && g[2].some(x => x.id === 'bon');
    }
    App.register(K.create({
      id: 'riquezasselvagens', name: 'Riquezas Selvagens', studio: STUDIO, art: 'horseshoe', mascot: 'shamrock',
      tag: 'Coringa coleta os potes de ouro', colors: ['#16a34a', '#eab308'], bg: 'linear-gradient(180deg,#86efac,#16a34a 60%,#14532d)',
      cols: 5, rows: 4, maxWin: 4600, vol: 4, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Wild Wild Riches" (Pragmatic Play).', hello: 'Coringa + potes = coleta!',
      symbols: [...SY, WILD, POT, MULT, BON],
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, 'Rolos 3-3-4-4-4 (576 caminhos).'), { title: 'Potes de ouro', head: ['valor'], rows: VALS.map(v => ({ img: 'honeypot', name: 'Pote', pays: [v.v] })) }],
      highlights: ['🌈 Coringas só nos rolos 1 e 2; 🍯 potes de ouro (1x a 25x) nos rolos 3 a 5', 'Com coringa na tela, <b>todos os potes são coletados</b>; 🍀 multiplicadores x2/x3/x5 multiplicam a coleta', '🍺 Coringa + bônus no rolo 3 = <b>10 rodadas grátis</b> com coleta ativa', 'Prêmio máximo: <b>4.600x</b>'],
      how: '<p>Rolos <b>3-3-4-4-4</b> com 576 caminhos. Coringas aparecem só nos rolos 1 e 2; potes de ouro e multiplicadores nos rolos 3 a 5.</p><p>Se houver <b>coringa</b> e <b>potes</b> na tela, os potes são somados e multiplicados pelos trevos multiplicadores.</p>',
      features: '<p>🍺 <b>Coringa (rolos 1/2) + bônus no rolo 3</b> dão <b>10 rodadas grátis</b>; a coleta continua ativa, os 🍀 multiplicadores <b>se acumulam</b> até o fim e cada nova combinação coringa + bônus dá +10.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); if (await play(rt, g)) { await rt.wait(800); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { m: 1 };
        await rt.fsLoop(10, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); if (await play(rt, g, st)) api.add(10); }, { sub: '10 giros · multiplicador acumula' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 8. Casa dos Cães Multihold — até 4 telas */
  (() => {
    const L = K.LINES_5x3.slice(0, 20);
    const SY = [S('rott', 'guidedog', 'Cão-guia', [3, 10, 50], 3), S('pug', 'servicedog', 'Pug', [2, 6, 30], 3), S('dachs', 'dogface2', 'Dachshund', [1.5, 4, 20], 4), S('coleira', 'collar', 'Coleira', [1, 3, 10], 5), S('osso', 'bone', 'Osso', [0.8, 2, 7], 6), ...R([[0.3, 1, 3], [0.3, 1, 3], [0.2, 0.8, 2], [0.2, 0.8, 2]])];
    const WILD = { id: 'w', img: 'doghouse2', name: 'Casinha', wild: true, reels: [1, 2, 3], w: 1.2, fw: 2.4 };
    const SC = { id: 'sc', img: 'paw', name: 'Pegada', sc: true, reels: [0, 2, 4], w: 2.2 };
    const draw = pool([...SY, WILD, SC]);
    const fill = x => { if (x.wild) { x.m = RNG.pick([2, 3]); x.t = 'x' + x.m; } return x; };
    const make = (n = 1, wk = 'w') => Array.from({ length: 5 }, (_, c) => Array.from({ length: 3 * n }, (_, r) => ({ ...fill(draw(c, wk)), c: r % 3 === 0 && r ? 'bandtop' : '' })));
    const band = (g, b) => g.map(col => col.slice(b * 3, b * 3 + 3));
    App.register(K.create({
      id: 'casacaesmulti', name: 'Casa dos Cães Multihold', studio: STUDIO, art: 'doghouse2', mascot: 'servicedog',
      tag: 'Até 4 telas com coringas colantes', colors: ['#f59e0b', '#0ea5e9'], bg: 'linear-gradient(180deg,#bae6fd,#86efac 70%,#4ade80)',
      cols: 5, rows: 3, maxWin: 6750, vol: 4, rtp: '~95,1%', target: 0.951,
      intro: 'Inspirado no "The Dog House Multihold" (Pragmatic Play).', hello: 'Desbloqueie até 4 telas no bônus!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L, text: '20 linhas por tela.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Coringas x2/x3 nos rolos 2 a 4; multiplicadores na linha se multiplicam.')],
      highlights: ['🏠 Casinhas coringa x2 ou x3', '🐾 3 pegadas = 2x + <b>7 rodadas grátis</b> numa tela', 'Cada 3 pegadas no bônus <b>abre uma nova tela</b> (até 4) e dá até +3 giros', 'Coringas <b>colantes</b> em cada tela', 'Prêmio máximo: <b>6.750x</b>'],
      how: '<p>Grade 5×3 com 20 linhas. A casinha é coringa (rolos 2 a 4) com x2 ou x3.</p>',
      features: '<p>🐾 <b>3 pegadas</b> (rolos 1, 3 e 5) pagam 2x e dão <b>7 rodadas grátis</b> numa tela. Durante o bônus, cada nova trinca de pegadas <b>desbloqueia mais uma tela</b> (até 4 jogando ao mesmo tempo) e dá de 1 a 3 giros extras. Todo coringa que cair <b>gruda</b> na sua tela até o fim.</p>',
      make: () => make(1),
      async spin(rt) {
        const g = make(1);
        await rt.spin(g);
        await pay(rt, lines(g, L, SY));
        if (count(g, x => x.sc) >= 3) { rt.win(2); rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let n = 1;
        const sticky = new Map();
        await rt.fsLoop(7, async api => {
          rt.layout(3 * n);
          const g = make(n, 'fw');
          sticky.forEach((x, k) => { const [c, r] = unkey(k); if (r < 3 * n) g[c][r] = { ...x, c: (r % 3 === 0 && r ? 'bandtop ' : '') + 'sticky' }; });
          await rt.spin(g, { tease: false });
          cells(g, x => x.wild).forEach(([c, r]) => { if (!sticky.has(key(c, r))) sticky.set(key(c, r), { ...g[c][r] }); });
          let tot = 0;
          for (let b = 0; b < n; b++) { const res = lines(band(g, b), L, SY); tot += res.total; }
          if (tot) { rt.win(tot); rt.msg(`${n} tela${n > 1 ? 's' : ''}: ${rt.coins(tot)}`); rt.fx('win'); await rt.wait(700); }
          if (count(g, x => x.sc) >= 3 && n < 4) { n++; const e = RNG.int(1, 3); api.add(e, true); rt.msg(`🐾 Nova tela desbloqueada! (${n} telas) +${e} giros`); rt.fx('big'); await rt.wait(900); }
        }, { sub: '7 giros · coringas colantes' });
        rt.layout(3);
      },
    }));
  })();

  /* 9. Festa das Frutas 2 */
  App.register(T.clusterWild({
    id: 'festafrutas2', name: 'Festa das Frutas 2', studio: STUDIO, art: 'pineapple', mascot: 'partyface',
    tag: 'Coringas que crescem até x729', colors: ['#f59e0b', '#db2777'], bg: 'linear-gradient(180deg,#fef08a,#fda4af 60%,#c084fc)',
    intro: 'Inspirado no "Fruit Party 2" (Pragmatic Play).', maxWin: 5000, scMin: 3,
    syms: rushSyms([['abacaxi', 'pineapple', 'Abacaxi'], ['coco', 'coconut', 'Coco'], ['manga', 'mango', 'Manga'], ['kiwi', 'kiwi', 'Kiwi'], ['pera', 'pear', 'Pera'], ['melao', 'melon', 'Melão'], ['limao', 'lemon', 'Limão']]),
    scImg: 'goldfruit', scName: 'Fruta dourada', scW: 0.42, fsConc: 2.4, wildImg: 'partyface', start: 2, grow: 2, cap: 256, fsStart: 3, fsGrow: 3, fsCap: 729, leave: 0.18, leaveFS: 0.3, stay: 0.5,
    fsTable: { 3: 10, 4: 12, 5: 15, 6: 20, 7: 25 },
    highlights: ['🍍 7×7 com grupos e cascata', '🥳 Grupos vencedores podem deixar um <b>coringa x2</b>; se ele ganhar de novo pode ficar e <b>dobrar</b> (até x256)', 'Nas rodadas grátis os coringas começam em <b>x3 e triplicam</b> (até x729)', 'Prêmio máximo: <b>5.000x</b>'],
    features: '<p>🥳 <b>Coringa multiplicador aleatório:</b> quando um grupo vence e some, ele pode deixar um coringa x2 no lugar. Se esse coringa entrar num novo ganho, pode ficar e dobrar (x4, x8… até x256). Nas rodadas grátis começa em x3 e triplica (x9, x27… até x729), e aparece mais.</p>',
  }));

  /* 10. Extra Suculento (Extra Juicy) — paga a partir de qualquer rolo */
  (() => {
    const L = K.LINES_5x3.slice(0, 10);
    const SY = [S('melancia', 'watermelon', 'Melancia', [5, 25, 100], 3), S('ameixa', 'plum', 'Ameixa', [3, 15, 60], 4), S('uva', 'grapes', 'Uva', [2, 8, 40], 4), S('laranja', 'tangerine', 'Laranja', [1, 4, 20], 6), S('limao', 'lemon', 'Limão', [0.8, 3, 15], 6), S('cereja', 'cherries', 'Cereja', [0.5, 2, 10], 7)];
    const SC = { id: 'sc', img: 'gem', name: 'Diamante', sc: true, reels: [0, 2, 4], w: 1.05 };
    const draw = pool([...SY, SC]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    /** paga 3+ iguais seguidos começando em qualquer rolo da linha */
    function anyLines(g) {
      let total = 0;
      const hit = new Set(), wins = [];
      L.forEach(line => {
        const xs = line.map((r, c) => g[c][r]);
        let best = null;
        for (let a = 0; a < 3; a++) {
          if (xs[a].sc) continue;
          let n = 1;
          while (a + n < 5 && xs[a + n].id === xs[a].id) n++;
          if (n >= 3 && (!best || n > best.n || (n === best.n && xs[a].pays[n - 3] > best.s.pays[best.n - 3]))) best = { a, n, s: xs[a] };
        }
        if (!best) return;
        const p = best.s.pays[best.n - 3];
        total += p;
        wins.push({ sym: best.s, n: best.n, pay: p });
        for (let c = best.a; c < best.a + best.n; c++) hit.add(key(c, line[c]));
      });
      return { total, wins, cells: hit };
    }
    App.register(K.create({
      id: 'extrasuculento', name: 'Extra Suculento', studio: STUDIO, art: 'cherries', mascot: 'watermelon',
      tag: 'Paga de qualquer rolo · mult. +1 por giro', colors: ['#dc2626', '#16a34a'], bg: 'radial-gradient(circle at 50% 30%,#7f1d1d,#1c0505 70%)',
      cols: 5, rows: 3, maxWin: 60000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Extra Juicy" (Pragmatic Play).', hello: 'Combinações valem de qualquer rolo!',
      symbols: [...SY, SC],
      lineList: { cols: 5, rows: 3, list: L, text: '10 linhas; a combinação pode começar em qualquer rolo.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, '3+ iguais seguidos, começando em qualquer rolo da linha.')],
      highlights: ['🍉 10 linhas que pagam <b>a partir de qualquer rolo</b>', '💎 3 diamantes (rolos 1, 3 e 5) = <b>12 rodadas grátis</b>', 'O multiplicador sobe <b>+1 a cada giro grátis</b> (até 60 giros)', 'Prêmio máximo: <b>60.000x</b>'],
      how: '<p>Grade 5×3 com 10 linhas. Três ou mais frutas iguais <b>seguidas</b> numa linha pagam, começando em <b>qualquer rolo</b> (não precisa ser o primeiro).</p>',
      features: '<p>💎 <b>3 diamantes</b> nos rolos 1, 3 e 5 dão <b>12 rodadas grátis</b>. O multiplicador começa em x1 e sobe <b>+1 depois de cada giro</b>. 3 diamantes durante o bônus dão +12 (até 60 no total).</p>',
      make,
      async spin(rt) { const g = make(); await rt.spin(g); await pay(rt, anyLines(g)); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        let m = 1, tot = 12;
        await rt.fsLoop(12, async api => {
          rt.chip('mult', 'MULT.', 'x' + m);
          const g = make();
          await rt.spin(g, { tease: false });
          await pay(rt, anyLines(g), m);
          if (count(g, x => x.sc) >= 3 && tot < 60) { tot += 12; api.add(12); }
          m++;
        }, { sub: 'Multiplicador +1 a cada giro' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 11. Extra Suculento Megaways */
  (() => {
    const SY = [S('melancia', 'watermelon', 'Melancia', [1, 2.5, 6, 15], 3), S('ameixa', 'plum', 'Ameixa', [0.8, 2, 5, 12], 4), S('uva', 'grapes', 'Uva', [0.6, 1.5, 4, 9], 5), S('laranja', 'tangerine', 'Laranja', [0.5, 1.2, 3, 7], 5), S('limao', 'lemon', 'Limão', [0.3, 0.8, 2, 4], 7), S('cereja', 'cherries', 'Cereja', [0.2, 0.6, 1.5, 3], 8)].map(s => ({ ...s, id: s.id + 'm' }));
    const WILD = { id: 'w', img: 'sparkles', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.6 };
    const SC = { id: 'sc', img: 'gemsparkle', name: 'Diamante', sc: true, w: 0.36, fw: 0.45 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => K.stack(mega().map((hh, c) => Array.from({ length: hh }, () => draw(c, wk))), 0.3);
    async function play(rt, g, fs) {
      if (fs) g.forEach(col => col.forEach(x => { if (x.sc) { x.m = RNG.int(3, 15); x.t = 'x' + x.m; } }));
      const r = await tumble(rt, g, { draw: c => { const x = draw(c, fs ? 'fw' : 'w'); if (fs && x.sc) { x.m = RNG.int(3, 15); x.t = 'x' + x.m; } return x; }, evaluate: gg => ways(gg, SY) });
      const m = fs ? g.flat().filter(x => x.sc && x.m).reduce((s, x) => s + x.m, 0) : 0;
      if (r.total > 0 && m > 1) { rt.win(r.total * (m - 1)); rt.msg(`💎 Diamantes x${m}!`); rt.fx('big'); await rt.wait(900); }
      return count(g, x => x.sc);
    }
    App.register(K.create({
      id: 'extrasuculentomw', name: 'Extra Suculento Megaways', studio: STUDIO, art: 'gemsparkle', mascot: 'plum',
      tag: 'Megaways · diamantes x3 a x15', colors: ['#7c3aed', '#16a34a'], bg: 'radial-gradient(circle at 50% 30%,#4c1d95,#120630 70%)',
      cols: 6, rows: 7, maxWin: 10000, vol: 4, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Extra Juicy Megaways" (Pragmatic Play).', hello: 'Até 117.649 caminhos!',
      symbols: [...SY, WILD, SC],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Megaways com cascata.')],
      highlights: ['🍇 Megaways com cascata', '💎 4/5/6 diamantes = <b>12/16/20 rodadas grátis</b> (+4 por extra)', 'Nas grátis os diamantes viram <b>multiplicadores x3 a x15</b> que se somam e ficam até o fim da cascata', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Megaways (2 a 7 símbolos por rolo) com cascata.</p>',
      features: '<p>💎 <b>4, 5 ou 6 diamantes</b> dão <b>12, 16 ou 20 rodadas grátis</b> (+4 por diamante extra). Durante o bônus cada diamante cai com um multiplicador de <b>x3 a x15</b>; os da tela se somam e multiplicam o ganho da sequência.</p>',
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); const sc = await play(rt, g, false); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 4 } = {}) {
        await rt.fsLoop(12 + (Math.min(6, sc) - 4) * 4 + Math.max(0, sc - 6) * 4, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); const s = await play(rt, g, true); if (s >= 3) api.add(4); }, { sub: 'Diamantes multiplicadores' });
      },
    }));
  })();

  /* 12. Liberte o Kraken 2 */
  (() => {
    const L20 = K.LINES_5x3.slice(0, 20);
    const SY = [S('kraken', 'octopus', 'Kraken', [5, 20, 100], 3), S('navio', 'ship', 'Navio', [3, 10, 50], 4), S('bau', 'chest', 'Baú', [2, 6, 30], 4), S('ancora', 'anchor', 'Âncora', [1.5, 4, 20], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'squid', name: 'Coringa', wild: true, w: 1.1, fw: 3.2 };
    const SC = { id: 'sc', img: 'trident', name: 'Bônus', sc: true, w: 0.85, fw: 0 };
    const draw = pool([...SY, WILD, SC]);
    const make = wk => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function play(rt, g, mult, wk) {
      await pay(rt, lines(g, L20, SY), mult);
      // Respin de coringas: 4+ coringas ficam (mudando de lugar) enquanto caírem novos
      let n = count(g, x => x.wild), guard = 0;
      while (n >= 4 && guard++ < 8 && !rt.capped) {
        rt.msg(`🦑 ${n} coringas! Respin com coringas que mudam de lugar`);
        rt.fx('big');
        await rt.wait(600);
        const ng = make(wk).map(col => col.map(x => (x.wild || x.sc ? RNG.pick(SY) : x)));
        const pos = RNG.shuffle(cells(ng, () => true)).slice(0, n);
        pos.forEach(([c, r]) => { ng[c][r] = { ...WILD, c: 'sticky' }; });
        let extra = 0;
        ng.forEach((col, c) => col.forEach((x, r) => { if (!x.wild && RNG.float() < 0.04) { ng[c][r] = { ...WILD }; extra++; } }));
        g.splice(0, 5, ...ng);
        await rt.spin(g, { tease: false });
        await pay(rt, lines(g, L20, SY), mult);
        if (!extra) break;
        n += extra;
      }
    }
    const FS = { 3: { s: 10, m: 2 }, 4: { s: 20, m: 6 }, 5: { s: 20, m: 10 } };
    App.register(K.create({
      id: 'kraken2', name: 'Liberte o Kraken 2', studio: STUDIO, art: 'squid', mascot: 'octopus',
      tag: 'Respins de coringas · até x10', colors: ['#0e7490', '#1e3a8a'], bg: 'linear-gradient(180deg,#0c4a6e,#083344 60%,#020617)',
      cols: 5, rows: 3, maxWin: 5000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Release the Kraken 2" (Pragmatic Play).', hello: '4 coringas soltam o Kraken!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['🦑 <b>4+ coringas</b> = respin: eles ficam (mudando de lugar) enquanto caírem novos', '🔱 3/4/5 bônus = <b>10 giros x2</b> · <b>20 giros x6</b> · <b>20 giros x10</b>', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 5×3 com 20 linhas.</p><p>🦑 <b>Respin de coringas:</b> com 4 ou mais coringas na tela, eles continuam no próximo giro em posições aleatórias. Cada coringa novo dá outro respin.</p>',
      features: `<table class="paytable"><tr class="si-head"><td>Bônus</td><td>Giros</td><td>Multiplicador</td></tr>${Object.entries(FS).map(([k, v]) => `<tr><td>${k}</td><td>${v.s}</td><td>x${v.m}</td></tr>`).join('')}</table>`,
      make: () => make('w'),
      async spin(rt) { const g = make('w'); await rt.spin(g); await play(rt, g, 1, 'w'); const sc = count(g, x => x.sc); if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 3 } = {}) {
        const f = FS[Math.min(5, sc)];
        rt.chip('mult', 'MULT.', 'x' + f.m);
        await rt.fsLoop(f.s, async () => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, f.m, 'fw'); }, { sub: `${f.s} giros · tudo x${f.m}` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 13. Sabedoria de Atena — cascatas abrem a linha de cima */
  App.register(T.scatterPays({
    id: 'sabedoriaatena', name: 'Sabedoria de Atena', studio: STUDIO, art: 'owl2', mascot: 'owl2',
    tag: 'Cascatas abrem a linha de cima', colors: ['#0f766e', '#ca8a04'], bg: 'radial-gradient(circle at 50% 0%,#115e59,#042f2e 70%)',
    intro: 'Inspirado no "Wisdom of Athena" (Pragmatic Play).', maxWin: 5000, lockTop: true,
    syms: anySyms([['coruja', 'owl2', 'Coruja'], ['escudo', 'shield', 'Escudo'], ['oliveira', 'olive', 'Oliveira'], ['lanca', 'spear', 'Lança'], ['rubi', 'gem', 'Rubi'], ['safira', 'bluediamond', 'Safira'], ['topazio', 'orangediamond', 'Topázio'], ['ametista', 'purpleheart', 'Ametista'], ['esmeralda', 'greenheart', 'Esmeralda']]),
    scImg: 'temple', scName: 'Partenon', scW: 1.15, orbImg: 'crystal', orbName: 'Orbes', orbs: ORB1000.filter(x => x.m <= 500), orbBase: 0.005, orbFS: 0.03, accumulate: true, fsCount: 10,
    how: '<p>A <b>linha de cima começa trancada</b>: depois de 1, 3, 6, 9, 12 e 15 cascatas, uma posição dela é liberada (da esquerda para a direita).</p>',
    features: '<p>Nas rodadas grátis as posições liberadas <b>não trancam de novo</b>.</p>',
    highlights: ['🦉 6×6 com a <b>linha de cima trancada</b>: cascatas liberam as posições', 'Orbes até <b>x500</b> em qualquer giro', '4+ Partenons = <b>10 rodadas grátis</b> com multiplicador que acumula e posições que ficam abertas', 'Prêmio máximo: <b>5.000x</b>'],
  }));

  /* 14. Forja do Olimpo — orbes melhoram de nível */
  App.register(T.scatterPays({
    id: 'forjaolimpo', name: 'Forja do Olimpo', studio: STUDIO, art: 'anvil', mascot: 'anvil',
    tag: 'Multiplicadores sobem de nível', colors: ['#ea580c', '#57534e'], bg: 'radial-gradient(circle at 50% 100%,#c2410c,#1c1917 70%)',
    intro: 'Inspirado no "Forge of Olympus" (Pragmatic Play).', maxWin: 5000,
    syms: anySyms([['bigorna', 'anvil', 'Bigorna'], ['tenaz', 'tongs', 'Tenaz'], ['elmo', 'helmet', 'Elmo'], ['espada', 'sword2', 'Espada'], ['fogo', 'fire', 'Fogo'], ['carvao', 'rock', 'Carvão'], ['ferro', 'nutbolt', 'Ferro'], ['corrente', 'chains', 'Corrente'], ['moeda', 'coin', 'Moeda']]),
    scImg: 'volcano', scName: 'Vulcão', scW: 1.15, orbImg: 'hammer', orbName: 'Martelos', orbs: [{ m: 2, w: 300 }, { m: 3, w: 200 }, { m: 5, w: 150 }, { m: 8, w: 90 }, { m: 10, w: 70 }, { m: 15, w: 40 }, { m: 20, w: 25 }, { m: 25, w: 15 }, { m: 50, w: 6 }, { m: 100, w: 2 }],
    orbBase: 0.005, orbFS: 0.032, accumulate: false, fsCount: 10, levels: [{ at: 0, min: 2 }, { at: 6, min: 8 }, { at: 11, min: 15 }, { at: 15, min: 50 }],
    features: '<p>🔨 <b>Forja:</b> nas rodadas grátis cada martelo multiplicador é coletado. Com 6 coletados os martelos passam a valer no mínimo <b>x8</b>; com 11, <b>x15</b>; com 15, <b>x50</b> (até x100).</p>',
    highlights: ['🔨 Martelos multiplicadores (x2 a x100) se somam no fim da cascata', 'Nas grátis a forja <b>sobe de nível</b>: mínimo x8, x15 e depois x50', '4+ vulcões = <b>10 rodadas grátis</b>', 'Prêmio máximo: <b>5.000x</b>'],
  }));

  /* 15. Festa na Praia (Wild Beach Party) */
  App.register(T.clusterWild({
    id: 'festapraia', name: 'Festa na Praia', studio: STUDIO, art: 'beachumbrella', mascot: 'surfer',
    tag: '7×7 · coringas até x729', colors: ['#0ea5e9', '#f97316'], bg: 'linear-gradient(180deg,#bae6fd,#7dd3fc 50%,#fde68a)',
    intro: 'Inspirado no "Wild Beach Party" (Pragmatic Play).', maxWin: 5000, scMin: 3,
    syms: rushSyms([['coco2', 'coconut', 'Coco'], ['drink', 'tropicaldrink', 'Drink'], ['oculos', 'sunglasses', 'Óculos'], ['concha', 'shell', 'Concha'], ['estrela', 'starfish', 'Estrela-do-mar'], ['bola', 'beachball', 'Bola de praia'], ['chinelo', 'flipflop', 'Chinelo']]),
    scImg: 'beachumbrella', scName: 'Guarda-sol', scW: 0.42, fsConc: 2.4, wildImg: 'surfer', start: 2, grow: 2, cap: 128, fsStart: 3, fsGrow: 3, fsCap: 729, leave: 0.16, leaveFS: 0.28, stay: 0.5,
    fsTable: { 3: 10, 4: 12, 5: 15, 6: 20, 7: 25 },
    highlights: ['🏖️ 7×7 com grupos e cascata', '🏄 Coringas deixados pelos grupos <b>dobram</b> até x128', 'Nas grátis começam em <b>x3 e triplicam</b> até x729', 'Prêmio máximo: <b>5.000x</b>'],
    features: '<p>🏄 Grupos vencedores podem deixar um <b>coringa x2</b>; se ele vencer de novo pode ficar e dobrar até x128. Nas rodadas grátis começa em x3 e triplica até x729.</p>',
  }));

  /* 16. Ovo da Galinha (Chicken Drop) — ovo gigante */
  (() => {
    const SY = rushSyms([['galinha', 'chicken', 'Galinha'], ['pintinho', 'chick', 'Pintinho'], ['milho', 'corn', 'Milho'], ['cenoura', 'carrot', 'Cenoura'], ['tomate', 'tomato', 'Tomate'], ['abobora', 'pumpkin', 'Abóbora'], ['feno', 'herb', 'Feno']]);
    const SC = { id: 'sc', img: 'barn', name: 'Celeiro', sc: true, w: 0.72, fw: 0.3 };
    const CAN = { id: 'regador', img: 'wateringcan', name: 'Regador', noPay: true, up: 'size', w: 0.35 };
    const CLOVER = { id: 'trevo', img: 'clover', name: 'Trevo', noPay: true, up: 'mult', w: 0.3 };
    const draw = pool([...SY, SC, CAN, CLOVER]);
    const N = 7;
    const make = () => Array.from({ length: N }, (_, c) => Array.from({ length: N }, () => draw(c)));
    const TT = n => (n < 5 ? -1 : n <= 6 ? 0 : n <= 8 ? 1 : n <= 10 ? 2 : n <= 12 ? 3 : n <= 14 ? 4 : 5);
    async function play(rt, g, egg) {
      await rt.drop(g);
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => payClusters(clusters(gg, 5), TT) });
      const ups = g.flat().filter(x => x.up);
      if (!ups.length) return;
      ups.forEach(u => { if (u.up === 'size') egg.size = Math.min(6, egg.size + 1); else egg.mult = Math.min(10, egg.mult + 1); });
      rt.chip('ovo', 'OVO', `${egg.size}×${egg.size} x${egg.mult}`);
      rt.msg(`🥚 O ovo gigante ${egg.size}×${egg.size} (x${egg.mult}) cai na grade!`);
      rt.fx('boom');
      await rt.wait(600);
      const s = RNG.pick(SY), c0 = RNG.int(0, N - egg.size), r0 = RNG.int(0, N - egg.size);
      for (let a = 0; a < egg.size; a++) for (let b = 0; b < egg.size; b++) g[c0 + a][r0 + b] = { ...s, c: 'giant', fresh: true };
      g.forEach((col, c) => col.forEach((x, r) => { if (x.up) g[c][r] = { ...draw(c), fresh: true }; }));
      await rt.drop(g);
      await tumble(rt, g, { draw: c => { let x; do x = draw(c); while (x.up); return x; }, evaluate: gg => payClusters(clusters(gg, 5), TT), mult: () => egg.mult });
    }
    App.register(K.create({
      id: 'ovogalinha', name: 'Ovo da Galinha', studio: STUDIO, art: 'egg', mascot: 'chicken',
      tag: 'Ovo gigante até 6×6 e x10', colors: ['#f59e0b', '#65a30d'], bg: 'linear-gradient(180deg,#fef3c7,#bbf7d0 60%,#86efac)',
      cols: 7, rows: 7, maxWin: 5000, vol: 4, rtp: '~96%', target: 0.96,
      intro: 'Inspirado no "Chicken Drop" (Pragmatic Play).', hello: 'Regadores e trevos chocam o ovo gigante!',
      symbols: [...SY, SC, CAN, CLOVER],
      tables: [table('Pagamento por tamanho do grupo', ['5–6', '7–8', '9–10', '11–12', '13–14', '15+'], SY, 'Grupos de 5+ iguais encostados, com cascata.')],
      highlights: ['🐔 7×7 com grupos e cascata', '🚿 Regador aumenta o <b>ovo gigante</b> (até 6×6); 🍀 trevo aumenta o multiplicador dele (até x10)', 'O ovo cai como um bloco de um símbolo só e os ganhos com ele são multiplicados', '4/5/6 celeiros = <b>10/15/20 rodadas grátis</b> com as melhorias guardadas', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 7×7: grupos de 5+ iguais encostados pagam, com cascata.</p><p>🚿 Cada <b>regador</b> aumenta o tamanho do <b>ovo gigante</b> (2×2 até 6×6) e cada 🍀 <b>trevo</b> aumenta o multiplicador (x2 até x10). Quando algum deles cai, depois das cascatas o ovo despenca na grade virando um bloco gigante de um símbolo, e as cascatas seguintes valem com o multiplicador do ovo.</p>',
      features: '<p>🏚️ <b>4, 5 ou 6 celeiros</b> dão <b>10, 15 ou 20 rodadas grátis</b>. O tamanho e o multiplicador do ovo <b>não zeram</b> durante o bônus.</p>',
      make,
      async spin(rt) { const g = make(); await play(rt, g, { size: 2, mult: 2 }); rt.chip('ovo', null); const sc = count(g, x => x.sc); if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); } },
      async bonus(rt, { sc = 4 } = {}) {
        const egg = { size: 2, mult: 2 };
        await rt.fsLoop({ 4: 10, 5: 15 }[sc] || 20, async api => { const g = make(); await play(rt, g, egg); if (count(g, x => x.sc) >= 4) api.add(10); }, { sub: 'O ovo cresce e não zera' });
        rt.chip('ovo', null);
      },
    }));
  })();

  /* 17. Festa na Fazenda (Barn Festival) — Money Respin com modificadores */
  (() => {
    const SY = anySyms([['vaca', 'cow', 'Vaca'], ['porco', 'pig', 'Porco'], ['ovelha', 'sheep', 'Ovelha'], ['galo', 'rooster', 'Galo'], ['maca', 'redapple2', 'Maçã'], ['pera', 'pear', 'Pera'], ['ameixa', 'plum', 'Ameixa'], ['uva', 'grapes', 'Uva'], ['limao', 'lemon', 'Limão']]).map(s => ({ ...s, pays: s.pays.map(p => p * 1.4) }));
    const POT = { id: 'pote', img: 'moneybag', name: 'Saco de moedas', pot: true, noPay: true, w: 1.45 };
    const draw = pool([...SY, POT]);
    const make = () => Array.from({ length: 6 }, (_, c) => Array.from({ length: 5 }, () => draw(c)));
    const VALS = [{ v: 1, w: 30 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 5, w: 12 }, { v: 10, w: 8 }, { v: 25, w: 4 }, { v: 50, w: 1.5 }, { v: 100, w: 0.5 }];
    const T9 = n => (n >= 12 ? 2 : n >= 10 ? 1 : n >= 8 ? 0 : -1);
    const SPECIAL = [{ k: 'money', w: 75 }, { k: 'add', w: 7 }, { k: 'mult', w: 4 }, { k: 'collect', w: 5 }, { k: 'unlock', w: 4 }, { k: 'padd', w: 1.2 }, { k: 'pmult', w: 0.25 }, { k: 'pcollect', w: 0.5 }];
    const IMGS = { money: 'coin', add: 'plus', mult: 'clover', collect: 'tractor', unlock: 'key', padd: 'plus', pmult: 'clover', pcollect: 'tractor' };
    async function moneyRespin(rt, nPots) {
      rt.stat('hold');
      await rt.banner('MONEY RESPIN', 'Moedas travam · cada símbolo novo reinicia os 3 giros', 1500);
      rt.layout(4);
      let cols = 4, left = 3, paid = 0;
      const W = 6;
      const g = Array.from({ length: W }, (_, c) => Array.from({ length: 4 }, () => ({ id: 'vazio', img: null, c: c === 0 || c === 5 ? 'locked' : 'empty', locked: c === 0 || c === 5 })));
      const empty = () => cells(g, x => x.id === 'vazio' && !x.locked);
      const coin = () => ({ id: 'moeda', img: 'coin', v: RNG.weighted(VALS).v, money: true });
      RNG.shuffle(empty()).slice(0, nPots).forEach(([c, r]) => { g[c][r] = { ...coin(), fresh: true }; });
      rt.show(g);
      const moneyCells = () => g.flat().filter(x => x.money);
      while (left > 0 && empty().length && !rt.capped) {
        rt.chip('fs', 'GIROS', left);
        left--;
        let got = 0;
        for (const [c, r] of empty()) {
          if (RNG.float() >= 0.08) continue;
          const k = RNG.weighted(SPECIAL).k;
          got++;
          if (k === 'money') g[c][r] = { ...coin(), fresh: true };
          else g[c][r] = { id: k, img: IMGS[k], t: { add: '+', mult: 'x', collect: '$', unlock: '🔓', padd: '+∞', pmult: 'x∞', pcollect: '$∞' }[k], special: k, fresh: true };
        }
        await rt.drop(g);
        // aplica os especiais que caíram
        for (const x of g.flat().filter(y => y.special && !y.done)) {
          x.done = true;
          const ms = moneyCells();
          if (x.special === 'add' || x.special === 'padd') { const a = RNG.weighted(VALS).v; ms.forEach(m => { m.v += a; }); rt.msg(`➕ +${rt.coins(a)} em todas as moedas`); }
          if (x.special === 'mult' || x.special === 'pmult') { const mm = x.special === 'pmult' ? 2 : RNG.int(2, 3); ms.forEach(m => { m.v *= mm; }); rt.msg(`🍀 Moedas x${mm}`); }
          if (x.special === 'collect' || x.special === 'pcollect') { const v = ms.reduce((s, m) => s + m.v, 0); paid += v; rt.win(v); rt.msg(`🚜 Coletou ${rt.coins(v)}`); rt.fx('coin'); }
          if (x.special === 'unlock' && cols < 6) { const c = cols === 4 ? 5 : 0; g[c].forEach(y => { y.locked = false; y.c = 'empty'; }); cols++; rt.msg('🔓 Mais uma coluna liberada!'); }
          if (x.special.startsWith('p')) x.done = false; // persistentes agem a cada giro
          rt.show(g);
          await rt.wait(450);
        }
        if (got) left = 3;
      }
      rt.chip('fs', null);
      const v = moneyCells().reduce((s, m) => s + m.v, 0);
      rt.win(v);
      rt.msg(`💰 Money Respin: ${rt.coins(v + paid)}`);
      rt.fx('big');
      await rt.wait(900);
      rt.layout(5);
    }
    App.register(K.create({
      id: 'festafazenda', name: 'Festa na Fazenda', studio: STUDIO, art: 'tractor', mascot: 'cow',
      tag: 'Money Respin com 8 modificadores', colors: ['#65a30d', '#b45309'], bg: 'linear-gradient(180deg,#bef264,#65a30d 60%,#365314)',
      cols: 6, rows: 5, maxWin: 20000, vol: 4, rtp: '~96,4%', target: 0.964,
      intro: 'Inspirado no "Barn Festival" (Pragmatic Play).', hello: '4 sacos de moedas abrem o Money Respin!',
      symbols: [...SY, POT], extraSprites: ['coin', 'plus', 'clover', 'tractor', 'key'],
      tables: [table('Pagamento por quantidade', ['8–9', '10–11', '12+'], SY, 'Paga em qualquer lugar.')],
      highlights: ['🐄 6×5 que paga em qualquer lugar', '💰 4+ sacos = <b>Money Respin</b>: moedas travam e cada símbolo novo reinicia os 3 giros', 'Modificadores: somar, multiplicar, coletar, abrir colunas e versões <b>persistentes</b>', 'Prêmio máximo: <b>20.000x</b>'],
      how: '<p>Grade 6×5 que paga em qualquer lugar (8+ iguais).</p>',
      features: '<p>💰 <b>4 ou mais sacos</b> abrem o <b>Money Respin</b> numa grade 4×4 (que pode abrir para 6×4). Os sacos viram moedas travadas e você tem 3 giros; cada símbolo novo reinicia o contador. Podem cair: moedas, ➕ somar valor, 🍀 multiplicar (x2 a x3), 🚜 coletar tudo, 🔑 abrir coluna, e as versões <b>persistentes</b> que agem em todo giro.</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.drop(g);
        await pay(rt, K.anywhere(g, SY, T9));
        const p = count(g, x => x.pot);
        if (p >= 4) { rt.mark(cells(g, x => x.pot).map(([c, r]) => key(c, r))); await rt.wait(900); await this.bonus(rt, { p }); }
      },
      async bonus(rt, { p = 4 } = {}) { await moneyRespin(rt, Math.min(p, 8)); },
    }));
  })();

  /* 18. Portões de Valhalla — coringa de gelo que anda */
  (() => {
    const L10 = K.linesFor(5, 10);
    const SY = [S('valquiria', 'shield', 'Escudo', [3, 10, 50], 3), S('machado', 'axe', 'Machado', [2, 6, 30], 4), S('chifre', 'drinkhorn', 'Chifre', [1.5, 4, 20], 4), S('runa', 'runestone', 'Runa', [1, 3, 10], 5), ...R([[0.4, 1.2, 4], [0.4, 1.2, 4], [0.3, 0.8, 3], [0.3, 0.8, 3]])];
    const WILD = { id: 'w', img: 'ice', name: 'Coringa de gelo', wild: true, w: 0.7, fw: 1.3 };
    const SC = { id: 'sc', img: 'snowcap', name: 'Valhalla', sc: true, w: 0.62 };
    const draw = pool([...SY, WILD, SC]);
    const make = (wk = 'w') => grid([5, 5, 5, 5, 5], c => { const x = draw(c, wk); if (x.wild) { x.m = 1; } return x; });
    async function play(rt, g, st) {
      let gm = st ? st.m : 1;
      if (st) rt.chip('mult', 'MULT.', 'x' + gm);
      for (let guard = 0; guard < 30 && !rt.capped; guard++) {
        const res = lines(g, L10, SY, { mult: 'add' });
        if (!res.total) break;
        await pay(rt, res, gm);
        // vencedores somem; coringas ficam e andam para uma casa vizinha com +1 (até x5)
        const rm = new Set();
        const moving = [];
        res.cells.forEach(k => { const [c, r] = unkey(k); const x = g[c][r]; if (x.wild) { if ((x.m || 1) >= 5) rm.add(k); else moving.push({ c, r, m: (x.m || 1) + 1 }); } rm.add(k); });
        K.cascade(g, rm, c => draw(c));
        moving.forEach(w => { const opts = [[w.c + 1, w.r], [w.c - 1, w.r], [w.c, w.r + 1], [w.c, w.r - 1]].filter(([a, b]) => g[a] && g[a][b]); const [a, b] = RNG.pick(opts); g[a][b] = { ...WILD, m: w.m, t: 'x' + w.m, c: 'sticky' }; });
        if (st) { gm++; st.m = gm; rt.chip('mult', 'MULT.', 'x' + gm); }
        await rt.drop(g);
      }
    }
    App.register(K.create({
      id: 'portaisvalhalla', name: 'Portões de Valhalla', studio: STUDIO, art: 'ice', mascot: 'snowcap',
      tag: 'Coringa de gelo anda e cresce', colors: ['#38bdf8', '#334155'], bg: 'linear-gradient(180deg,#e0f2fe,#38bdf8 40%,#0c4a6e)',
      cols: 5, rows: 5, maxWin: 10000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Gates of Valhalla" (Pragmatic Play).', hello: 'O coringa de gelo não derrete!',
      symbols: [...SY, WILD, SC],
      lineList: { cols: 5, rows: 5, list: L10, text: '10 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Cascata depois de cada ganho.')],
      highlights: ['🧊 Coringas de gelo <b>não somem</b> na cascata: andam para uma casa vizinha e ganham <b>+1</b> (até x5)', '🏔️ 3+ scatters = <b>rodadas grátis</b> com multiplicador global <b>+1 por cascata, sem zerar</b>', 'Prêmio máximo: <b>10.000x</b>'],
      how: '<p>Grade 5×5 com 10 linhas e cascata. O coringa de gelo que participa de um ganho não some: ele <b>se move para uma casa vizinha</b> e seu multiplicador sobe +1 (até x5). Em x5, depois do ganho ele derrete.</p>',
      features: '<p>🏔️ <b>3 ou mais scatters</b> dão <b>10 rodadas grátis</b> (3+ nelas dão +5, sem limite). Um multiplicador global começa em x1 e soma <b>+1 a cada cascata</b>, sem zerar até o fim.</p>',
      make,
      async spin(rt) { const g = make(); await rt.spin(g); await play(rt, g, null); if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); } },
      async bonus(rt) {
        const st = { m: 1 };
        await rt.fsLoop(10, async api => { const g = make('fw'); await rt.spin(g, { tease: false }); await play(rt, g, st); if (count(g, x => x.sc) >= 3) api.add(5); }, { sub: 'Multiplicador global sem zerar' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* 19. Carnaval Zumbi — ursos coringa colantes */
  (() => {
    const SY = [S('palhaco', 'clown', 'Palhaço', [1, 2, 4, 8], 3), S('roda', 'ferris', 'Roda-gigante', [0.8, 1.6, 3, 6], 4), S('pipoca', 'popcorn', 'Pipoca', [0.6, 1.2, 2.5, 5], 5), S('algodao', 'cottoncandy', 'Algodão-doce', [0.5, 1, 2, 4], 5), ...R([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]])];
    const GIFT = { id: 'presente', img: 'gift', name: 'Presente', mystery: true, t: '?', w: 0.7 };
    const BRAIN = { id: 'sc', img: 'brain', name: 'Cérebro', sc: true, w: 0.24, fw: 0.4 };
    const BEAR = { id: 'w', img: 'teddy', name: 'Urso zumbi', wild: true, w: 0 };
    const draw = pool([...SY, GIFT, BRAIN]);
    const make = () => K.stack(grid([4, 4, 4, 4, 4, 4], c => draw(c)), 0.3);
    const reveal = g => { if (!g.some(col => col.some(x => x.mystery))) return null; const s = RNG.pick(SY); g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...s, fresh: true }; })); return s; };
    App.register(K.create({
      id: 'carnavalzumbi', name: 'Carnaval Zumbi', studio: STUDIO, art: 'cottoncandy', mascot: 'teddy',
      tag: 'Ursos zumbis colantes com multiplicador', colors: ['#7c3aed', '#16a34a'], bg: 'linear-gradient(180deg,#2e1065,#4c1d95 60%,#14532d)',
      cols: 6, rows: 4, maxWin: 5000, vol: 4, rtp: '~96,5%', target: 0.965,
      intro: 'Inspirado no "Zombie Carnival" (Pragmatic Play).', hello: '2 cérebros chamam os ursos zumbis!',
      symbols: [...SY, GIFT, BRAIN, BEAR],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = 4.096 caminhos.')],
      highlights: ['🎁 Presentes viram todos o mesmo símbolo', '🧠 2+ cérebros = <b>6 rodadas grátis</b>: ursos comem os cérebros e viram <b>coringas colantes</b>', 'Cada cérebro novo atrai o urso mais próximo: <b>+1 no multiplicador dele</b> e +1 giro', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Grade 6×4 com 4.096 caminhos. 🎁 Os presentes abrem e viram o mesmo símbolo sorteado.</p>',
      features: '<p>🧠 <b>2 ou mais cérebros</b> dão <b>6 rodadas grátis</b>. Os ursos comem os cérebros e ficam no lugar como <b>coringas colantes</b>. Quando outro cérebro cai, o urso mais próximo vai até ele, ganha <b>+1 no multiplicador</b> e você ganha +1 giro. Ursos na mesma combinação somam os multiplicadores.</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        if (reveal(g)) { rt.msg('🎁 Presentes abertos!'); await rt.drop(g); }
        await pay(rt, ways(g, SY));
        const b = cells(g, x => x.sc);
        if (b.length >= 2) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { pos: b }); }
      },
      async bonus(rt, { pos } = {}) {
        let bears = (pos || [[RNG.int(0, 5), RNG.int(0, 3)], [RNG.int(0, 5), RNG.int(0, 3)]]).map(([c, r]) => ({ c, r, m: 1 }));
        await rt.fsLoop(6, async api => {
          const g = make();
          await rt.spin(g, { tease: false });
          // cérebros novos puxam o urso mais próximo
          cells(g, x => x.sc).forEach(([c, r]) => {
            const b = bears.reduce((best, x) => (Math.abs(x.c - c) + Math.abs(x.r - r) < Math.abs(best.c - c) + Math.abs(best.r - r) ? x : best), bears[0]);
            b.c = c; b.r = r; b.m++;
            api.add(1, true);
            rt.msg(`🧸 Urso foi comer o cérebro: x${b.m} e +1 giro`);
          });
          bears.forEach(b => { g[b.c][b.r] = { ...BEAR, m: b.m, t: 'x' + b.m, c: 'sticky' }; });
          if (reveal(g)) rt.msg('🎁 Presentes abertos!');
          await rt.drop(g);
          await pay(rt, ways(g, SY, { wildMult: 'add' }));
        }, { sub: 'Ursos colantes!' });
      },
    }));
  })();

  /* 20. Roubo dos Goblins (Goblin Heist Powernudge) */
  (() => {
    const L10 = K.LINES_5x3.slice(0, 10);
    const SY = [S('goblin', 'goblin', 'Goblin', [5, 20, 80], 3), S('cofre', 'lockkey', 'Cofre', [3, 10, 40], 4), S('saco', 'moneybag', 'Saco', [2, 6, 25], 4), S('pocao', 'potion', 'Poção', [1.5, 4, 15], 5), ...R([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]])];
    const WILD = { id: 'w', img: 'dragonface', name: 'Coringa', wild: true, w: 0.9 };
    const LION = { id: 'leao', img: 'lionface', name: 'Leão dourado', coin: true, noPay: true, w: 6.5 };
    const draw = pool([...SY, WILD, LION]);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const LV = () => { const r = RNG.float(); if (r < 0.8) return { v: RNG.weighted([{ v: 1, w: 35 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 5, w: 12 }, { v: 10, w: 8 }, { v: 25, w: 3.5 }, { v: 50, w: 1.5 }]).v }; if (r < 0.95) return { reel: RNG.int(1, 2) }; return { glob: 1 }; };
    async function powernudge(rt, g) {
      for (let guard = 0; guard < 12 && !rt.capped; guard++) {
        const res = lines(g, L10, SY);
        if (!res.total) break;
        await pay(rt, res);
        // rolos com vencedores descem uma casa; os outros giram de novo
        const winReels = new Set([...res.cells].map(k => unkey(k)[0]));
        for (let c = 0; c < 5; c++) g[c] = winReels.has(c) ? [{ ...draw(c), fresh: true }, g[c][0], g[c][1]] : g[c].map(() => ({ ...draw(c), fresh: true }));
        rt.msg('⬇️ Powernudge! Rolos vencedores descem');
        await rt.drop(g);
      }
    }
    App.register(K.create({
      id: 'goblinheist', name: 'Roubo dos Goblins', studio: STUDIO, art: 'goblin', mascot: 'goblin',
      tag: 'Powernudge · respin dos leões', colors: ['#15803d', '#a16207'], bg: 'linear-gradient(180deg,#14532d,#1a2e05 60%,#0c0a09)',
      cols: 5, rows: 3, maxWin: 4000, vol: 3, rtp: '~95,4%', target: 0.954,
      intro: 'Inspirado no "Goblin Heist Powernudge" (Pragmatic Play).', hello: 'Rolos vencedores descem e dão respin!',
      symbols: [...SY, WILD, LION],
      lineList: { cols: 5, rows: 3, list: L10, text: '10 linhas fixas.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir da esquerda.')],
      highlights: ['⬇️ <b>Powernudge:</b> rolos com símbolos vencedores descem uma casa e os outros giram de novo, enquanto houver ganho', '🦁 6+ leões dourados = <b>Money Respin</b> com valores (até 50x) e multiplicadores de rolo ou globais', 'Prêmio máximo: <b>4.000x</b>'],
      how: '<p>Grade 5×3 com 10 linhas. <b>Powernudge:</b> depois de um ganho, todo rolo que tinha símbolo vencedor desce uma posição e os demais giram de novo; repete enquanto sair ganho.</p>',
      features: '<p>🦁 <b>6 ou mais leões</b> abrem o <b>Money Respin</b> (3 respins, cada leão novo reinicia). Cada leão revela um valor (1x a 50x), um <b>multiplicador do rolo</b> (+1 a +3) ou um <b>multiplicador global</b> (+1 a +3), aplicados no fim.</p>',
      make,
      async spin(rt) { const g = make(); await rt.spin(g); await powernudge(rt, g); if (count(g, x => x.coin) >= 6) { await rt.wait(700); await this.bonus(rt, { g }); } },
      async bonus(rt, { g } = {}) {
        rt.stat('hold');
        await rt.banner('MONEY RESPIN', 'Leões travam · 3 respins', 1400);
        const gg = g || grid([3, 3, 3, 3, 3], (c, r) => (r === 1 && c < 5 || (c === 0 && r === 0) ? { ...LION } : { id: 'vazio', img: null, c: 'empty' }));
        const lionOf = () => ({ ...LION, ...LV() });
        gg.forEach((col, c) => col.forEach((x, r) => { gg[c][r] = x.coin ? { ...x, ...LV() } : { id: 'vazio', img: null, c: 'empty' }; }));
        const label = x => { x.t = x.v ? '' : x.reel ? `+${x.reel} rolo` : `+${x.glob} tudo`; return x; };
        gg.flat().forEach(x => { if (x.coin) label(x); });
        let left = 3;
        rt.show(gg);
        while (left > 0) {
          rt.chip('fs', 'RESPINS', left); left--;
          let got = 0;
          gg.forEach((col, c) => col.forEach((x, r) => { if (!x.coin && RNG.float() < 0.08) { gg[c][r] = label({ ...lionOf(), fresh: true }); got++; } }));
          await rt.drop(gg);
          if (got) left = 3;
          if (gg.every(col => col.every(x => x.coin))) break;
        }
        rt.chip('fs', null);
        let total = 0;
        const glob = 1 + gg.flat().reduce((s, x) => s + (x.glob || 0), 0);
        gg.forEach(col => { const rm = 1 + col.reduce((s, x) => s + (x.reel || 0), 0); total += col.reduce((s, x) => s + (x.v || 0), 0) * rm; });
        total *= glob;
        rt.win(total);
        rt.msg(`🦁 Respin dos leões: ${rt.coins(total)}${glob > 1 ? ` (x${glob} global)` : ''}`);
        rt.fx('big');
        await rt.wait(1000);
      },
    }));
  })();
})();
