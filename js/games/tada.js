'use strict';

/* =========================================================
   Slots no estilo TaDa / JILI (SlotKit) — só slots.
   ========================================================= */
(function () {
  const K = SlotKit;
  const { S, pool, ways, lines, cells, count, key, cascade, table, heads, pay, tumble, scatters } = K;
  const STUDIO = 'tada';
  const grid = (hs, f) => hs.map((hh, c) => Array.from({ length: hh }, (_, r) => f(c, r)));
  const SUITS = (pays, w = [8, 8, 9, 9]) => [
    S('as', 'spade', 'Espadas', pays[0], w[0]), S('copas', 'heartsuit', 'Copas', pays[1], w[1]),
    S('ouros', 'diamondsuit', 'Ouros', pays[2], w[2]), S('paus', 'clubsuit', 'Paus', pays[3], w[3]),
  ];
  const L5 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];

  /* =========================================================
     1. Império Dourado (Golden Empire) — 32.400 caminhos
     ========================================================= */
  (() => {
    const SY = [
      S('rei', 'crown', 'Rei', [1, 2, 4, 8], 3), S('mascara', 'moai', 'Máscara', [0.8, 1.6, 3, 6], 4), S('idolo', 'sun', 'Ídolo', [0.6, 1.2, 2.5, 5], 5),
      S('vaso', 'amphora', 'Vaso', [0.5, 1, 2, 4], 5), ...SUITS([[0.2, 0.4, 0.8, 1.5], [0.2, 0.4, 0.8, 1.5], [0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2]]),
    ];
    const WILD = { id: 'w', img: 'coin', name: 'Coringa', wild: true, w: 0 };
    const SC = { id: 'sc', img: 'temple', name: 'Templo', sc: true, w: 0.45 };
    const all = [...SY, SC];
    const draw = pool(all);
    const cell = (c, fs) => { const x = draw(c); if (!x.sc && c >= 1 && c <= 4 && RNG.float() < (fs ? 0.1 : 0.07)) x.gold = true; return x; };
    const make = fs => K.stack(grid([5, 6, 6, 6, 6, 5], c => cell(c, fs)), 0.45);
    async function play(rt, g, fs, st) {
      if (fs) rt.chip('mult', 'MULT.', 'x' + st.m);
      await tumble(rt, g, {
        draw: c => cell(c, fs), evaluate: gg => ways(gg, SY),
        mult: () => (fs ? st.m : 1),
        // moldura dourada vira coringa que aguenta 2 ganhos
        convert: x => (x.gold ? { ...WILD, life: 2, t: '2', fresh: true } : x.wild && x.life > 1 ? { ...x, life: x.life - 1, t: String(x.life - 1) } : null),
        onStep: async () => { if (fs) { st.m++; rt.chip('mult', 'MULT.', 'x' + st.m); } },
      });
    }
    App.register(K.create({
      id: 'imperiodourado', name: 'Império Dourado', studio: STUDIO, art: 'crown', mascot: 'sun',
      tag: '32.400 caminhos · molduras douradas', colors: ['#ca8a04', '#065f46'], bg: 'linear-gradient(180deg,#14532d,#365314 60%,#1a2e05)',
      cols: 6, rows: 6, cellH: 1.1, maxWin: 2000, vol: 3, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Golden Empire" (TaDa Gaming).', hello: 'Molduras douradas viram coringas!',
      symbols: [...all, WILD],
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Rolos 5-6-6-6-6-5 = 32.400 caminhos, com cascata.')],
      highlights: ['👑 Rolos <b>5-6-6-6-6-5</b>: até <b>32.400 caminhos</b>, com cascata', '🥇 Molduras douradas (rolos 2 a 5) viram <b>coringa</b> que aguenta <b>2 ganhos</b>', '🏛️ 4+ templos = <b>8 rodadas grátis</b> (+2 por extra) com multiplicador <b>+1 por cascata que nunca zera</b>', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Rolos <b>5-6-6-6-6-5</b> (32.400 caminhos) com <b>cascata</b>.</p><p>Símbolos com <b>moldura dourada</b> nos rolos 2 a 5, ao ganhar, viram <b>coringa</b> com um contador: ele fica na grade por mais 2 ganhos.</p>',
      features: '<p>🏛️ <b>4 ou mais templos</b> dão <b>8 rodadas grátis</b> (+2 por templo extra; 4+ nelas dão mais giros). O multiplicador começa em <b>x1</b> e sobe <b>+1 a cada cascata</b>, sem zerar até o fim do bônus.</p>',
      make: () => make(false),
      async spin(rt) {
        const g = make(false);
        await rt.spin(g);
        await play(rt, g, false);
        const sc = count(g, x => x.sc);
        if (sc >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 4 } = {}) {
        const st = { m: 1 };
        await rt.fsLoop(8 + (sc - 4) * 2, async api => {
          const g = make(true);
          await rt.spin(g, { tease: false });
          await play(rt, g, true, st);
          const s = count(g, x => x.sc);
          if (s >= 4) api.add(8 + (s - 4) * 2);
        }, { sub: 'Multiplicador sem limite!' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     2 e 3. Joias da Fortuna 1 e 2 (Fortune Gems) — 3×3 + rolo multiplicador
     ========================================================= */
  function gems(cfg) {
    const SY = [
      S('vermelha', 'gem', 'Joia vermelha', [10], 3), S('verde', 'greenheart', 'Joia verde', [7.5], 4), S('azul', 'bluediamond', 'Joia azul', [5], 5),
      S('A', 'spade', 'A', [2.5], 7), S('K', 'heartsuit', 'K', [2], 8), S('Q', 'diamondsuit', 'Q', [1.5], 9), S('J', 'clubsuit', 'J', [1], 10),
    ];
    const WILD = { id: 'w', img: 'crown', name: 'Coringa', wild: true, w: 1.6 };
    const all = [...SY, WILD];
    const draw = pool(all);
    const REEL = cfg.mults;
    const mcell = () => { const m = RNG.weighted(REEL); return m.wheel ? { id: 'roda', img: 'ferris', t: 'RODA', c: 'mreel', wheel: true } : { id: 'mx', img: null, t: 'x' + m.m, m: m.m, c: 'mreel' }; };
    const make = () => [...grid([3, 3, 3], c => draw(c)), [mcell(), mcell(), mcell()]];
    const tbl = SY.map(s => ({ ...s, pays: [s.pays[0] / 5] }));
    return K.create({
      id: cfg.id, name: cfg.name, studio: STUDIO, art: cfg.mascot, mascot: cfg.mascot,
      tag: cfg.tag, colors: cfg.colors, bg: cfg.bg, cols: 4, rows: 3, maxWin: cfg.maxWin, vol: 2, rtp: '~97%', target: 0.97, buy: false,
      intro: cfg.intro, hello: 'O 4º rolo multiplica o ganho!',
      symbols: [...all, { img: 'ferris', noBlur: false }],
      lineList: { cols: 3, rows: 3, list: L5, text: '5 linhas fixas na grade 3×3; o 4º rolo só define o multiplicador (posição do meio).' },
      tables: [table('Pagamento por linha', ['3 iguais'], tbl, 'Valores por linha (× aposta total) antes do multiplicador do 4º rolo.')],
      highlights: ['💎 Grade <b>3×3</b> com <b>5 linhas</b>', `🎰 O <b>4º rolo</b> sorteia um multiplicador (${REEL.filter(m => !m.wheel).map(m => 'x' + m.m).join(', ')}) que vale para todo o ganho`, ...(cfg.wheel ? ['🎡 Se a <b>RODA</b> parar no meio do 4º rolo: um giro na Roda da Sorte com prêmio de <b>até 1.000x</b>'] : []), `Prêmio máximo: <b>${fmt(cfg.maxWin).replace(',00', '')}x</b>`],
      how: '<p>Grade <b>3×3</b> com <b>5 linhas</b>: três iguais numa linha pagam. 👑 é coringa.</p><p>Ao lado há um <b>4º rolo especial</b> só de multiplicadores: o valor que parar na <b>posição do meio</b> multiplica todo o ganho do giro.</p>',
      features: `<table class="paytable"><tr class="si-head"><td>Multiplicador</td><td>Chance</td></tr>${REEL.map(m => `<tr><td><b>${m.wheel ? 'RODA' : 'x' + m.m}</b></td><td>${Math.round((m.w / REEL.reduce((a, b) => a + b.w, 0)) * 1000) / 10}%</td></tr>`).join('')}</table>
        ${cfg.wheel ? `<p>🎡 <b>Roda da Sorte:</b> prêmio instantâneo de ${cfg.wheel.map(w => w.v + 'x').join(', ')}.</p>` : ''}<p class="muted small">Sem rodadas grátis nem compra de bônus: giros rápidos.</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g, { tease: false });
        const mid = g[3][1];
        const res = lines(g.slice(0, 3), L5, SY.map(s => ({ ...s, pays: [s.pays[0] / 5] })));
        if (mid.wheel) {
          rt.mark([key(3, 1)]);
          const i = cfg.wheel.indexOf(RNG.weighted(cfg.wheel));
          await rt.reveal('RODA DA SORTE', cfg.wheel.map(w => ({ img: 'ferris', t: w.v + 'x' })), i);
          rt.win(cfg.wheel[i].v);
          rt.msg(`🎡 Roda da Sorte: ${rt.coins(cfg.wheel[i].v)}!`);
          rt.fx('big');
          await rt.wait(900);
          await pay(rt, res);
        } else if (res.total) {
          res.cells.add(key(3, 1));
          await pay(rt, res, mid.m);
        }
      },
      async bonus() {},
    });
  }
  App.register(gems({
    id: 'joiasfortuna', name: 'Joias da Fortuna', mascot: 'gem', maxWin: 375, tag: '3×3 + rolo até x15', colors: ['#b91c1c', '#7c3aed'], bg: 'radial-gradient(circle at 50% 30%,#7c2d12,#1c0a02 70%)',
    intro: 'Inspirado no "Fortune Gems" (TaDa Gaming).',
    mults: [{ m: 1, w: 45 }, { m: 2, w: 22 }, { m: 3, w: 14 }, { m: 5, w: 10 }, { m: 10, w: 6 }, { m: 15, w: 3 }],
  }));
  App.register(gems({
    id: 'joiasfortuna2', name: 'Joias da Fortuna 2', mascot: 'bluediamond', maxWin: 10000, tag: 'Rolo multiplicador + Roda da Sorte', colors: ['#2563eb', '#ca8a04'], bg: 'radial-gradient(circle at 50% 30%,#1e3a8a,#0b1026 70%)',
    intro: 'Inspirado no "Fortune Gems 2" (TaDa Gaming).',
    mults: [{ m: 1, w: 40 }, { m: 2, w: 22 }, { m: 3, w: 14 }, { m: 5, w: 10 }, { m: 10, w: 6 }, { m: 15, w: 3 }, { wheel: true, w: 1.6 }],
    wheel: [{ v: 5, w: 30 }, { v: 10, w: 25 }, { v: 20, w: 18 }, { v: 50, w: 12 }, { v: 100, w: 8 }, { v: 200, w: 4 }, { v: 500, w: 2 }, { v: 1000, w: 1 }],
  }));

  /* =========================================================
     4. Lâmpada Mágica (Magic Lamp) — 6×5, 15.625 caminhos
     ========================================================= */
  (() => {
    const SY = [
      S('princesa', 'princess', 'Princesa', [0.8, 1.5, 3, 6], 3), S('camelo', 'camel', 'Camelo', [0.6, 1.2, 2.5, 5], 4), S('adaga', 'dagger', 'Adaga', [0.5, 1, 2, 4], 5),
      S('chave', 'key', 'Chave', [0.4, 0.8, 1.6, 3], 5), ...SUITS([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]]),
    ];
    const WILD = { id: 'w', img: 'diya', name: 'Aladim', wild: true, reels: [1, 2, 3, 4, 5], w: 0.7, fw: 1.2 };
    const GENIE = { id: 'genio', img: 'genie', name: 'Gênio', coin: true, noPay: true, w: 0.9, fw: 2.5 };
    const SC = { id: 'sc', img: 'ring', name: 'Anel', sc: true, w: 0.55, fw: 0.3 };
    const all = [...SY, WILD, GENIE, SC];
    const draw = pool(all);
    const VALS = [{ v: 1, w: 35 }, { v: 2, w: 25 }, { v: 3, w: 15 }, { v: 5, w: 12 }, { v: 10, w: 7 }, { v: 20, w: 4 }, { v: 50, w: 2 }];
    const make = (wk = 'w') => K.stack(grid([5, 5, 5, 5, 5, 5], c => { const x = draw(c, wk); if (x.coin) x.v = RNG.weighted(VALS).v; return x; }), 0.35);
    async function play(rt, g, fs) {
      // coringa que cai pode expandir no rolo inteiro
      for (let c = 1; c < 6; c++) if (g[c].some(x => x.wild) && RNG.float() < (fs ? 0.5 : 0.25)) { g[c] = g[c].map(x => (x.coin ? x : { ...WILD, fresh: true })); rt.msg('🪔 Aladim expandiu!'); await rt.drop(g); }
      await pay(rt, ways(g, SY));
      const w = count(g, x => x.wild && x.id === 'w'), v = g.flat().filter(x => x.coin).reduce((s, x) => s + x.v, 0);
      if (w && v) {
        rt.mark(cells(g, x => x.coin || x.wild).map(([c, r]) => key(c, r)));
        rt.win(v);
        rt.msg(`🧞 Aladim coletou os gênios: ${rt.coins(v)}`);
        rt.fx('coin');
        await rt.wait(900);
      }
    }
    App.register(K.create({
      id: 'lampadamagica', name: 'Lâmpada Mágica', studio: STUDIO, art: 'genie', mascot: 'genie',
      tag: 'Gênios com prêmio · coringas expandem', colors: ['#7c3aed', '#ca8a04'], bg: 'linear-gradient(180deg,#312e81,#4c1d95 60%,#1e1b4b)',
      cols: 6, rows: 5, maxWin: 2000, vol: 2, rtp: '~96,3%', target: 0.963,
      intro: 'Inspirado no "Magic Lamp" (TaDa Gaming).', hello: 'Aladim coleta os prêmios dos gênios!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6 rolos × 5 linhas = 15.625 caminhos.'), { title: 'Gênios (valores)', head: ['valor'], rows: VALS.map(v => ({ img: 'genie', name: 'Gênio', pays: [v.v] })) }],
      highlights: ['🧞 <b>Gênios</b> trazem prêmios de 1x a 50x', '🪔 Se o <b>Aladim (coringa)</b> estiver na tela, ele <b>coleta</b> todos os gênios', 'Coringas podem <b>expandir</b> no rolo inteiro', '💍 3+ anéis = <b>8 rodadas grátis</b> com mais gênios e expansões', 'Prêmio máximo: <b>2.000x</b>'],
      how: `<p><b>6×5</b> com <b>15.625 caminhos</b>. ${ico('diya')} Aladim é coringa (rolos 2 a 6) e pode expandir no rolo inteiro.</p><p>${ico('genie')} <b>Gênios</b> mostram prêmios; com o Aladim na tela, ele soma e paga todos.</p>`,
      features: '<p>💍 <b>3 ou mais anéis</b> dão <b>8 rodadas grátis</b>: gênios e coringas aparecem mais e as expansões são o dobro de frequentes. 3+ anéis nelas dão +5 giros.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        await rt.fsLoop(8, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await play(rt, g, true);
          if (count(g, x => x.sc) >= 3) api.add(5);
        }, { sub: 'Desejos realizados!' });
      },
    }));
  })();

  /* =========================================================
     5. Roma X — 5×3, 15 linhas, cascata e Duelo com o Leão
     ========================================================= */
  (() => {
    const L15 = K.LINES_5x3.slice(0, 15);
    const SY = [
      S('gladiador', 'helmet', 'Gladiador', [5, 15, 50], 3), S('escudo', 'shield', 'Escudo', [3, 10, 30], 4), S('espadas', 'swords', 'Espadas', [2, 6, 20], 4),
      S('anfora', 'amphora', 'Ânfora', [1, 3, 10], 5), ...SUITS([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]]),
    ];
    const WILD = { id: 'w', img: 'temple', name: 'Coliseu', wild: true, reels: [1, 2, 3], w: 1 };
    const BON = { id: 'bon', img: 'lion', name: 'Leão', bonus: true, w: 0.9 };
    const all = [...SY, WILD, BON];
    const draw = pool(all);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    const FS_BY = { 4: 3, 5: 5, 6: 10, 7: 20 };
    async function cascades(rt, g) {
      return tumble(rt, g, { draw: c => draw(c), evaluate: gg => lines(gg, L15, SY) });
    }
    async function lionDuel(rt) {
      rt.stat('duel');
      let prize = 3;
      rt.chip('duelo', 'DUELO', prize + 'x');
      for (let round = 1; round <= 3; round++) {
        await rt.choose(`DUELO COM O LEÃO · ROUND ${round}`, [
          { id: 'a', img: 'swords', label: 'Atacar', desc: 'Golpe duplo' }, { id: 'd', img: 'shield', label: 'Defender', desc: 'Escudo' }, { id: 'e', img: 'helmet', label: 'Esquivar', desc: 'Contra-ataque' },
        ]);
        const r = RNG.weighted([{ o: 'duas', w: 25 }, { o: 'uma', w: 45 }, { o: 'leao', w: 30 }]).o;
        if (r === 'leao') { rt.msg('🦁 O leão revidou! Fim do duelo'); rt.fx('lose'); await rt.wait(900); break; }
        prize += r === 'duas' ? 6 : 3;
        rt.chip('duelo', 'DUELO', prize + 'x');
        rt.msg(r === 'duas' ? '⚔️⚔️ Golpe duplo! +6x' : '⚔️ Acertou! +3x');
        rt.fx('coin');
        await rt.wait(800);
      }
      rt.win(prize);
      rt.msg(`🦁 Duelo: ${rt.coins(prize)}`);
      rt.fx('big');
      await rt.wait(900);
      rt.chip('duelo', null);
    }
    App.register(K.create({
      id: 'romax', name: 'Roma X', studio: STUDIO, art: 'lion', mascot: 'helmet',
      tag: 'Duelo com o leão · cascatas dão giros', colors: ['#991b1b', '#ca8a04'], bg: 'linear-gradient(180deg,#78350f,#7f1d1d 60%,#450a0a)',
      cols: 5, rows: 3, maxWin: 500, vol: 2, rtp: '~97%', target: 0.97, buy: false,
      intro: 'Inspirado no "Roma X" (TaDa Gaming).', hello: 'Cascatas seguidas dão rodadas grátis!',
      symbols: all,
      lineList: { cols: 5, rows: 3, list: L15, text: '15 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda, com cascata.')],
      highlights: ['🏛️ 5×3 com 15 linhas e <b>cascata</b>', '🔁 <b>4, 5, 6 ou 7 cascatas seguidas</b> no mesmo giro dão <b>3, 5, 10 ou 20 rodadas grátis</b>', '🦁 3 leões = <b>Duelo com o Leão</b>: 3 rounds de ataque e defesa por <b>3x a 21x</b>', 'Prêmio máximo: <b>500x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>15 linhas</b>. Os símbolos vencedores somem e novos caem (<b>cascata</b>). 🏛️ é coringa (rolos 2 a 4).</p>',
      features: `<table class="paytable"><tr class="si-head"><td>Cascatas seguidas</td><td>Rodadas grátis</td></tr>${Object.entries(FS_BY).map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`).join('')}</table>
        <p>🦁 <b>3 leões</b> abrem o <b>Duelo com o Leão</b>: em cada um dos 3 rounds você escolhe atacar, defender ou esquivar. Golpe duplo vale +6x, golpe simples +3x e, se o leão revidar, o duelo acaba. O prêmio começa em 3x (máximo 21x).</p>`,
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const r = await cascades(rt, g);
        if (count(g, x => x.bonus) >= 3) { rt.mark(cells(g, x => x.bonus).map(([c, rr]) => key(c, rr))); await rt.wait(900); await lionDuel(rt); }
        if (r.steps >= 4) await this.bonus(rt, { n: FS_BY[Math.min(7, r.steps)] });
      },
      async bonus(rt, { n = 5 } = {}) {
        await rt.fsLoop(n, async api => {
          const g = make();
          await rt.spin(g, { tease: false });
          const r = await cascades(rt, g);
          if (count(g, x => x.bonus) >= 3) await lionDuel(rt);
          if (r.steps >= 4) api.add(FS_BY[Math.min(7, r.steps)]);
        }, { sub: `${n} giros` });
      },
    }));
  })();

  /* =========================================================
     6. Super Rico (Super Rich) — 3×3, 1 linha
     ========================================================= */
  (() => {
    const E = (id, name, pay, w, c) => S(id, 'elephant', name, [pay], w, { c });
    const SY = [E('ouro', 'Ganesha dourado', 888, 0.35, 'tint-gold'), E('roxo', 'Ganesha roxo', 88, 1.1, 'tint-purple'), E('vermelho', 'Ganesha vermelho', 58, 1.6, 'tint-red'), E('verde', 'Ganesha verde', 28, 2.2, 'tint-green')];
    const BLANK = { id: 'vazio', img: null, name: 'Vazio', c: 'empty', w: 4.8, noBlur: true };
    const all = [...SY, BLANK];
    const draw = pool(all);
    const make = () => grid([3, 3, 3], c => draw(c));
    App.register(K.create({
      id: 'superrico', name: 'Super Rico', studio: STUDIO, art: 'seven', mascot: 'elephant',
      tag: 'Clássico de 1 linha · até 888x', colors: ['#ca8a04', '#dc2626'], bg: 'radial-gradient(circle at 50% 30%,#7f1d1d,#1c0505 70%)',
      cols: 3, rows: 3, maxWin: 888, vol: 2, rtp: '~96%', target: 0.96, buy: false,
      intro: 'Inspirado no "Super Rich" (TaDa Gaming).', hello: 'Três Ganeshas na linha do meio!',
      symbols: all,
      lineList: { cols: 3, rows: 3, list: [[1, 1, 1]], text: 'Uma única linha, no meio.' },
      tables: [table('Pagamento (linha do meio)', ['3 iguais'], SY), { title: 'Ganeshas misturados', head: ['3 quaisquer'], rows: [{ img: 'elephant', name: '3 Ganeshas de cores diferentes', pays: [2.5] }] }],
      highlights: ['🐘 Clássico <b>3×3</b> com <b>uma linha</b> no meio', 'Três Ganeshas iguais pagam <b>28x, 58x, 88x</b> — o dourado paga <b>888x</b>', 'Qualquer mistura de 3 Ganeshas paga 2,5x', 'Sem recursos: giro rápido de cassino físico'],
      how: '<p>Grade <b>3×3</b>, mas só a <b>linha do meio</b> paga. Três Ganeshas iguais pagam o valor da tabela; três de cores diferentes pagam 2,5x.</p>',
      features: '<p class="muted small">Super Rico não tem coringas, rodadas grátis nem bônus: é o caça-níquel clássico, direto ao ponto.</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g, { tease: false });
        const mid = [g[0][1], g[1][1], g[2][1]];
        if (mid.some(x => x.id === 'vazio')) return;
        const same = mid.every(x => x.id === mid[0].id);
        const v = same ? mid[0].pays[0] : 2.5;
        rt.mark([key(0, 1), key(1, 1), key(2, 1)]);
        rt.win(v);
        rt.msg(same ? `3× ${mid[0].name} = ${rt.coins(v)}` : `3 Ganeshas = ${rt.coins(v)}`);
        rt.fx(v >= 58 ? 'jackpot' : 'win');
        await rt.wait(900);
      },
      async bonus() {},
    }));
  })();

  /* =========================================================
     7. Fortuna dos Ossos (Bone Fortune) — coringa que desce com respins
     ========================================================= */
  (() => {
    const L20 = K.LINES_5x3.slice(0, 20);
    const SY = [
      S('catrina', 'skull', 'Catrina', [5, 15, 50], 3), S('violao', 'guitar', 'Violão', [3, 10, 30], 4), S('maracas', 'maracas', 'Maracas', [2, 6, 20], 4),
      S('rosa', 'rose', 'Rosa', [1, 3, 10], 5), ...SUITS([[0.5, 1.5, 5], [0.5, 1.5, 5], [0.3, 1, 3], [0.3, 1, 3]]),
    ];
    const WILD = { id: 'w', img: 'crossbones', name: 'Coringa', wild: true, w: 0.55, fw: 0.9 };
    const SC = { id: 'sc', img: 'candle', name: 'Vela', sc: true, w: 0.95, fw: 0.6 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const make = (wk = 'w') => grid([3, 3, 3, 3, 3], c => draw(c, wk));
    async function play(rt, g, fs, wk) {
      await pay(rt, lines(g, L20, SY));
      let m = 1, guard = 0;
      // Respin de coringa: os coringas descem uma casa a cada respin até sair da tela
      while (g.some(col => col.some(x => x.wild)) && guard++ < 12 && !rt.capped) {
        const ws = cells(g, x => x.wild).map(([c, r]) => [c, r + 1]).filter(([, r]) => r < 3);
        if (!ws.length) break;
        if (fs) { m++; rt.chip('mult', 'MULT.', 'x' + m); }
        await rt.wait(450);
        const ng = make(wk).map(col => col.map(x => (x.wild || x.sc ? RNG.pick(SY) : x)));
        ws.forEach(([c, r]) => { ng[c][r] = { ...WILD, c: 'sticky' }; });
        // novos coringas também podem cair
        ng.forEach((col, c) => col.forEach((x, r) => { if (!x.wild && RNG.float() < 0.02) ng[c][r] = { ...WILD }; }));
        g.splice(0, 5, ...ng);
        rt.msg('💀 Respin! O coringa desce uma casa');
        await rt.spin(g, { tease: false });
        await pay(rt, lines(g, L20, SY), m);
      }
      rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'fortunaossos', name: 'Fortuna dos Ossos', studio: STUDIO, art: 'crossbones', mascot: 'crossbones',
      tag: 'Respins de coringa · multiplicador sobe', colors: ['#db2777', '#f59e0b'], bg: 'linear-gradient(180deg,#4a044e,#701a75 60%,#3b0764)',
      cols: 5, rows: 3, maxWin: 2000, vol: 2, rtp: '~96,2%', target: 0.962,
      intro: 'Inspirado no "Bone Fortune" (TaDa Gaming).', hello: 'Coringa na tela = respin!',
      symbols: all,
      lineList: { cols: 5, rows: 3, list: L20, text: '20 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['☠️ <b>Respin de coringa:</b> cada coringa na tela dá um respin e <b>desce uma casa</b> até sair', '🕯️ 3+ velas = <b>10 rodadas grátis</b>', 'Nas grátis cada respin soma <b>+1 no multiplicador</b> (x2, x3, x4…)', 'Prêmio máximo: <b>2.000x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>20 linhas</b>. ☠️ é coringa.</p><p>Quando um coringa aparece você ganha um <b>respin</b>: ele <b>desce uma posição</b> e o resto gira de novo. Os respins continuam enquanto houver coringa na tela.</p>',
      features: '<p>🕯️ <b>3 ou mais velas</b> dão <b>10 rodadas grátis</b> (3+ nelas dão +5). Nas rodadas grátis, cada respin de coringa soma <b>+1 no multiplicador</b> daquela sequência.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const sc = count(g, x => x.sc);
        await play(rt, g, false, 'w');
        if (sc >= 3) { await rt.wait(600); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        await rt.fsLoop(10, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          const sc = count(g, x => x.sc);
          await play(rt, g, true, 'fw');
          if (sc >= 3) api.add(5);
        }, { sub: 'Respins multiplicam!' });
      },
    }));
  })();

  /* =========================================================
     8. Ali Babá — 32.400 caminhos, baús multiplicadores
     ========================================================= */
  (() => {
    const SY = [
      S('alibaba', 'genie', 'Ali Babá', [1, 2, 4, 8], 3), S('camelo', 'camel', 'Camelo', [0.8, 1.6, 3, 6], 4), S('adaga', 'dagger', 'Adaga', [0.6, 1.2, 2.5, 5], 5),
      S('lampada', 'diya', 'Lâmpada', [0.5, 1, 2, 4], 5), ...SUITS([[0.2, 0.4, 0.8, 1.5], [0.2, 0.4, 0.8, 1.5], [0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2]]),
    ];
    const WILD = { id: 'w', img: 'key', name: 'Chave', wild: true, reels: [1, 2, 3, 4], w: 0.6 };
    const CHEST = { id: 'bau', img: 'chest', name: 'Baú', chest: true, noPay: true, w: 0.15, fw: 0.3 };
    const SC = { id: 'sc', img: 'moneybag', name: 'Tesouro', sc: true, w: 0.62, fw: 0.4 };
    const all = [...SY, WILD, CHEST, SC];
    const draw = pool(all);
    const cell = (c, wk, up) => { const x = draw(c, wk); if (x.chest) { x.m = RNG.int(up ? 2 : 1, 4); x.t = 'x' + x.m; } return x; };
    const make = (wk = 'w', up = false) => K.stack(grid([5, 6, 6, 6, 6, 5], c => cell(c, wk, up)), 0.4);
    const START = [{ v: 1, w: 40 }, { v: 2, w: 30 }, { v: 3, w: 18 }, { v: 5, w: 12 }];
    async function play(rt, g, wk, up, st) {
      const r = await tumble(rt, g, { draw: c => cell(c, wk, up), evaluate: gg => ways(gg, SY) });
      const chests = g.flat().filter(x => x.chest).reduce((s, x) => s + x.m, 0);
      if (st) st.m += chests;
      const m = st ? st.m : chests;
      if (st) rt.chip('mult', 'MULT.', 'x' + st.m);
      if (r.total > 0 && m > 1) {
        rt.mark(cells(g, x => x.chest).map(([c, rr]) => key(c, rr)), 'hl');
        rt.win(r.total * (m - 1));
        rt.msg(`🧰 Baús multiplicam x${m}! ${rt.coins(r.total)} → ${rt.coins(r.total * m)}`);
        rt.fx('big');
        await rt.wait(1000);
      }
    }
    App.register(K.create({
      id: 'alibaba', name: 'Ali Babá', studio: STUDIO, art: 'chest', mascot: 'genie',
      tag: 'Baús multiplicadores · 32.400 caminhos', colors: ['#b45309', '#7c3aed'], bg: 'linear-gradient(180deg,#78350f,#451a03 60%,#1c0a02)',
      cols: 6, rows: 6, cellH: 1.1, maxWin: 5000, vol: 2, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Ali Baba" (TaDa Gaming).', hello: 'Abre-te Sésamo! Baús multiplicam',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, 'Rolos 5-6-6-6-6-5 = 32.400 caminhos, com cascata.')],
      highlights: ['🧰 <b>Baús</b> trazem multiplicadores de <b>x1 a x4</b> que se somam e valem no fim das cascatas', '🔑 Chave é coringa (rolos 2 a 5)', '💰 4+ tesouros = <b>10 rodadas grátis</b>: uma roda define o multiplicador inicial e os baús <b>se acumulam</b> nele', 'Prêmio máximo: <b>5.000x</b>'],
      how: '<p>Rolos <b>5-6-6-6-6-5</b> (32.400 caminhos) com <b>cascata</b>.</p><p>🧰 Os <b>baús</b> não pagam sozinhos: no fim da sequência de cascatas, se houve ganho, os valores dos baús na tela se somam e multiplicam o ganho.</p>',
      features: '<p>💰 <b>4 ou mais tesouros</b> dão <b>10 rodadas grátis</b>. Antes de começar, uma <b>roda</b> sorteia o multiplicador inicial (x1, x2, x3 ou x5) e os baús ficam melhores (x2 a x4). Cada baú que cair <b>soma no multiplicador global</b>, que não zera.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, 'w', false, null);
        if (count(g, x => x.sc) >= 4) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        const i = START.indexOf(RNG.weighted(START));
        await rt.reveal('MULTIPLICADOR INICIAL', START.map(s => ({ img: 'chest', t: 'x' + s.v })), i);
        const st = { m: START[i].v };
        rt.chip('mult', 'MULT.', 'x' + st.m);
        await rt.fsLoop(10, async api => {
          const g = make('fw', true);
          await rt.spin(g, { tease: false });
          await play(rt, g, 'fw', true, st);
          if (count(g, x => x.sc) >= 4) api.add(5);
        }, { sub: 'Baús acumulam!' });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     9. Búfalo Furioso (Charge Buffalo) — 6×4, 4.096 caminhos
     ========================================================= */
  (() => {
    const SY = [
      S('bufalo', 'bison', 'Búfalo', [1, 2, 4, 8], 3), S('aguia', 'eagle', 'Águia', [0.8, 1.5, 3, 6], 4), S('lobo', 'wolf', 'Lobo', [0.6, 1.2, 2.5, 5], 4),
      S('cervo', 'deer', 'Cervo', [0.5, 1, 2, 4], 5), S('puma', 'leopard', 'Puma', [0.4, 0.8, 1.6, 3], 5), ...SUITS([[0.15, 0.3, 0.6, 1.2], [0.15, 0.3, 0.6, 1.2], [0.1, 0.2, 0.5, 1], [0.1, 0.2, 0.5, 1]]),
    ];
    const WILD = { id: 'w', img: 'sunrise', name: 'Coringa', wild: true, reels: [1, 2, 3, 4], w: 0.9, fw: 2.2 };
    const SC = { id: 'sc', img: 'coin', name: 'Moeda', sc: true, w: 0.65, fw: 0.45 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const WM = [{ m: 2, w: 55 }, { m: 3, w: 30 }, { m: 5, w: 15 }];
    const make = (wk = 'w') => K.stack(grid([4, 4, 4, 4, 4, 4], c => { const x = draw(c, wk); if (x.wild) x.m = RNG.weighted(WM).m; return x; }), 0.3);
    const FS0 = { 3: 8, 4: 15, 5: 25, 6: 100 }, FSR = { 2: 5, 3: 8, 4: 15, 5: 25, 6: 100 };
    App.register(K.create({
      id: 'bufalofurioso', name: 'Búfalo Furioso', studio: STUDIO, art: 'sunrise', mascot: 'bison',
      tag: '4.096 caminhos · até 100 giros', colors: ['#c2410c', '#1e3a8a'], bg: 'linear-gradient(180deg,#fdba74,#ea580c 50%,#7c2d12)',
      cols: 6, rows: 4, maxWin: 4000, vol: 3, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Charge Buffalo" (TaDa Gaming).', hello: 'Coringas multiplicam e se somam!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 4, ' rolos'), SY, '6×4 = 4.096 caminhos.')],
      highlights: ['🦬 Grade 6×4 com <b>4.096 caminhos</b>', '🌄 Coringas (rolos 2 a 5) com <b>x2, x3 ou x5</b> que <b>se somam</b>', '🪙 3/4/5/6 moedas = <b>8, 15, 25 ou 100 rodadas grátis</b>; 2+ moedas nelas dão mais giros', 'Prêmio máximo: <b>4.000x</b>'],
      how: '<p>Grade <b>6×4</b> com <b>4.096 caminhos</b>. 🌄 Coringas nos rolos 2 a 5 trazem <b>x2, x3 ou x5</b>; vários na mesma combinação <b>se somam</b> (dois x3 = x6).</p>',
      features: '<p>🪙 <b>3, 4, 5 ou 6 moedas</b> dão <b>8, 15, 25 ou 100 rodadas grátis</b>. Durante elas, <b>2, 3, 4, 5 ou 6 moedas</b> dão <b>+5, +8, +15, +25 ou +100</b> giros. Os coringas aparecem mais.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await pay(rt, ways(g, SY, { wildMult: 'add' }));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let total = 0;
        await rt.fsLoop(FS0[Math.min(6, sc)], async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          await pay(rt, ways(g, SY, { wildMult: 'add' }));
          const s = count(g, x => x.sc);
          if (s >= 2 && total < 200) { const a = FSR[Math.min(6, s)]; total += a; api.add(a); }
        }, { sub: 'Estouro da manada!' });
      },
    }));
  })();

  /* =========================================================
     10. Rei da Selva (Jungle King) — 5×4, 50 linhas
     ========================================================= */
  (() => {
    const L50 = K.linesFor(4, 50);
    const SY = [
      S('tigre', 'tiger', 'Tigre', [2, 8, 25], 3), S('leopardo', 'leopard', 'Leopardo', [1.5, 5, 15], 4), S('papagaio', 'parrot', 'Papagaio', [1, 3, 10], 4),
      S('macaco', 'monkey', 'Macaco', [0.8, 2, 6], 5), S('banana', 'banana', 'Banana', [0.3, 1, 3], 7), ...SUITS([[0.2, 0.6, 2], [0.2, 0.6, 2], [0.15, 0.5, 1.5], [0.15, 0.5, 1.5]]),
    ];
    const WILD = { id: 'w', img: 'gorilla', name: 'Gorila', wild: true, w: 0.9 };
    const COIN = { id: 'moeda', img: 'coin', name: 'Moeda do gorila', mystery: true, t: '?', w: 0.8 };
    const SC = { id: 'sc', img: 'bank', name: 'Arranha-céu', sc: true, w: 0.85 };
    const PLANE = { id: 'aviao', img: 'rocket', name: 'Avião', plane: true, noPay: true, w: 0, fw: 1.0 };
    const all = [...SY, WILD, COIN, SC, PLANE];
    const draw = pool(all);
    const make = (wk = 'w') => grid([4, 4, 4, 4, 4], c => draw(c, wk));
    const reveal = g => { if (!g.some(col => col.some(x => x.mystery))) return null; const s = RNG.pick([...SY, WILD]); g.forEach((col, c) => col.forEach((x, r) => { if (x.mystery) g[c][r] = { ...s, fresh: true }; })); return s; };
    App.register(K.create({
      id: 'reiselva', name: 'Rei da Selva', studio: STUDIO, art: 'gorilla', mascot: 'gorilla',
      tag: 'Gorila coringa · aviões multiplicam', colors: ['#15803d', '#a16207'], bg: 'linear-gradient(180deg,#14532d,#166534 60%,#052e16)',
      cols: 5, rows: 4, maxWin: 2500, vol: 2, rtp: '~97%', target: 0.97,
      intro: 'Inspirado no "Jungle King" (TaDa Gaming).', hello: 'O Gorila substitui tudo!',
      symbols: all,
      lineList: { cols: 5, rows: 4, list: L50, text: '50 linhas fixas, da esquerda para a direita.' },
      tables: [table('Pagamento por linha', heads(3, 3), SY, 'Iguais seguidos a partir do rolo da esquerda.')],
      highlights: ['🦍 <b>Gorila</b> coringa substitui todos os símbolos', '🪙 <b>Moedas do gorila</b> viram todas o mesmo símbolo sorteado', '🏦 3/4/5 arranha-céus = <b>8 rodadas grátis</b> com multiplicador <b>x1, x2 ou x3</b>', '✈️ Nas grátis o gorila derruba <b>aviões</b> e cada um soma <b>+1</b> no multiplicador', 'Prêmio máximo: <b>2.500x</b>'],
      how: '<p>Grade <b>5×4</b> com <b>50 linhas</b>. 🦍 Gorila é coringa.</p><p>🪙 As <b>moedas de prata</b> são símbolos misteriosos: todas viram o mesmo símbolo sorteado (pode ser o gorila).</p>',
      features: '<p>🏦 <b>3, 4 ou 5 arranha-céus</b> dão <b>8 rodadas grátis</b> com multiplicador inicial <b>x1, x2 ou x3</b>. Durante elas aparecem ✈️ <b>aviões</b>: o King Kong derruba cada um e soma <b>+1 no multiplicador</b>, que vale para todo o resto do bônus.</p>',
      make: () => make(),
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        const s = reveal(g);
        if (s) { rt.msg(`🪙 Moedas viraram ${s.name}!`); await rt.drop(g); }
        await pay(rt, lines(g, L50, SY));
        const sc = count(g, x => x.sc);
        if (sc >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, { sc }); }
      },
      async bonus(rt, { sc = 3 } = {}) {
        let m = Math.min(3, sc - 2);
        rt.chip('mult', 'MULT.', 'x' + m);
        await rt.fsLoop(8, async api => {
          const g = make('fw');
          await rt.spin(g, { tease: false });
          const pl = count(g, x => x.plane);
          if (pl) { m += pl; rt.chip('mult', 'MULT.', 'x' + m); rt.msg(`✈️ King Kong derrubou ${pl} avião${pl > 1 ? 'ões' : ''}! x${m}`); rt.fx('boom'); await rt.wait(700); g.forEach((col, c) => col.forEach((x, r) => { if (x.plane) g[c][r] = { ...RNG.pick(SY), fresh: true }; })); }
          const s = reveal(g);
          if (pl || s) await rt.drop(g);
          await pay(rt, lines(g, L50, SY), m);
          if (count(g, x => x.sc) >= 3) api.add(8);
        }, { sub: `8 giros · começa em x${m}` });
        rt.chip('mult', null);
      },
    }));
  })();

  /* =========================================================
     11. Noite de Festa (Party Night) — 5×3, 243 caminhos, cascata até x10
     ========================================================= */
  (() => {
    const SY = [
      S('micro', 'microphone', 'Microfone', [2, 5, 15], 3), S('sax', 'saxophone', 'Saxofone', [1.5, 4, 10], 4), S('drink', 'cocktail', 'Drink', [1, 3, 8], 4),
      S('fone', 'headphone', 'Fone', [0.8, 2, 5], 5), S('notas', 'notes', 'Notas', [0.4, 1, 2.5], 7), S('balao', 'balloon', 'Balão', [0.3, 0.8, 2], 8), S('estrela', 'star', 'Estrela', [0.25, 0.6, 1.5], 9),
    ];
    const WILD = { id: 'w', img: 'party', name: 'DJ', wild: true, reels: [1, 2, 3], w: 0.8 };
    const SC = { id: 'sc', img: 'mirrorball', name: 'Globo', sc: true, w: 0.7 };
    const all = [...SY, WILD, SC];
    const draw = pool(all);
    const make = () => grid([3, 3, 3, 3, 3], c => draw(c));
    async function play(rt, g, fs) {
      let m = fs ? 2 : 1;
      rt.chip('mult', 'MULT.', 'x' + m);
      await tumble(rt, g, { draw: c => draw(c), evaluate: gg => ways(gg, SY), mult: () => m * (fs ? 2 : 1), onStep: async () => { m = Math.min(10, m + 1); rt.chip('mult', 'MULT.', 'x' + m); } });
      rt.chip('mult', null);
    }
    App.register(K.create({
      id: 'noitefesta', name: 'Noite de Festa', studio: STUDIO, art: 'mirrorball', mascot: 'party',
      tag: 'Cascata até x10 · grátis em dobro', colors: ['#c026d3', '#0891b2'], bg: 'linear-gradient(180deg,#1e1b4b,#4a044e 60%,#0f172a)',
      cols: 5, rows: 3, maxWin: 1000, vol: 2, rtp: '~96,8%', target: 0.968,
      intro: 'Inspirado no "Party Night" (TaDa Gaming).', hello: 'Cada cascata aumenta a festa!',
      symbols: all,
      tables: [table('Pagamento por caminho', heads(3, 3, ' rolos'), SY, '243 caminhos com cascata.')],
      highlights: ['🪩 5×3 com <b>243 caminhos</b> e cascata', 'Multiplicador sobe a cada cascata: <b>x1, x2, x3… até x10</b>', '🪩 3+ globos = <b>12 rodadas grátis</b> com ganhos <b>em dobro</b> e cascata começando em x2', 'Prêmio máximo: <b>1.000x</b>'],
      how: '<p>Grade <b>5×3</b> com <b>243 caminhos</b>. Os vencedores somem e novos caem; cada cascata seguida sobe o multiplicador (até <b>x10</b>). 🎉 DJ é coringa.</p>',
      features: '<p>🪩 <b>3 ou mais globos</b> dão <b>12 rodadas grátis</b>: todos os ganhos <b>dobram</b> e o multiplicador da cascata começa em <b>x2</b>. 3+ globos nelas dão +12 giros (até 250 no total).</p>',
      make,
      async spin(rt) {
        const g = make();
        await rt.spin(g);
        await play(rt, g, false);
        if (count(g, x => x.sc) >= 3) { rt.mark(scatters(g)); await rt.wait(1000); await this.bonus(rt, {}); }
      },
      async bonus(rt) {
        let total = 12;
        await rt.fsLoop(12, async api => {
          const g = make();
          await rt.spin(g, { tease: false });
          await play(rt, g, true);
          if (count(g, x => x.sc) >= 3 && total < 250) { total += 12; api.add(12); }
        }, { sub: 'Ganhos em dobro!' });
      },
    }));
  })();
})();
