'use strict';

/* =========================================================
   Painel "Prêmios" dos slots: prêmio máximo, como ganhar,
   tabela de pagamentos em fichas (para a aposta atual),
   bônus e desenho das linhas. Cada slot descreve isso em
   game.info = { maxWin, vol, rtp, how, lines, tables, features }.
   ========================================================= */
const SlotInfo = {
  VOL: { 1: 'Baixa', 2: 'Média', 3: 'Média-alta', 4: 'Alta' },

  /** Botão "Prêmios" ao lado do ganho; ctx.bet() dá a aposta atual. */
  attach(el, ctx) {
    const btn = h(`<button class="info-btn" type="button" aria-label="Prêmios e regras">${ico('trophy')}<span>Prêmios</span></button>`);
    // "Ganho" fica no centro e o botão à direita
    const bar = $('.slot-winbar', el), main = h('<span class="wb-main"></span>');
    main.append(...bar.childNodes);
    bar.append(main, btn);
    btn.addEventListener('click', () => { Sfx.click(); this.open(ctx.game, ctx.bet()); });
  },

  coins(x, bet) { return `🪙 ${fmt(x * bet)}`; },
  xs(x) { return (Math.round(x * 100) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + 'x'; },

  /** Mini-grade com as células de uma linha acesas. cells = Set de "col:row". */
  diagram(cols, rows, cells, n) {
    let html = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) html += `<i class="${cells.has(`${c}:${r}`) ? 'on' : ''}"></i>`;
    return `<div class="ln"><div class="ln-grid" style="grid-template-columns:repeat(${cols},1fr)">${html}</div><small>Linha ${n}</small></div>`;
  },

  open(game, bet = 1) {
    const info = game.info;
    if (!info) { UI.modal(`Como jogar — ${game.name}`, game.rules); return; }
    const tabs = [['resumo', 'Resumo'], ['pagamentos', 'Pagamentos'], ['bonus', 'Bônus'], info.lines ? ['linhas', 'Linhas'] : null].filter(Boolean);
    let tab = 'resumo';
    const body = h('<div class="sinfo"></div>');

    // tabelas com muitas colunas mostram só o "x da aposta" para caber no celular
    const table = t => { const compact = t.head.length > 3; return `
      <h4>${t.title}</h4>
      ${t.note ? `<p class="muted small">${t.note}</p>` : ''}
      ${compact ? `<p class="muted small">Valores em × a aposta (com 🪙 ${fmt(bet)}, 1x = 🪙 ${fmt(bet)}).</p>` : ''}
      <table class="paytable si-table ${t.head.length > 2 ? 'si-wide' : ''}">
        <tr class="si-head"><td></td>${t.head.map(c => `<td>${c}</td>`).join('')}</tr>
        ${t.rows.map(r => `<tr>
          <td class="pt-sym">${ico(r.img)}<span>${r.name}${r.badge ? ` <span class="badge">${r.badge}</span>` : ''}</span></td>
          ${r.pays.map(p => (p == null ? '<td class="muted">—</td>' : compact ? `<td><b>${this.xs(p)}</b></td>` : `<td><b>${this.coins(p, bet)}</b><small>${this.xs(p)}</small></td>`)).join('')}
        </tr>`).join('')}
      </table>`; };

    const render = () => {
      let html = `<div class="seg si-tabs">${tabs.map(([id, t]) => `<button data-tab="${id}" class="${tab === id ? 'on' : ''}">${t}</button>`).join('')}</div>`;
      if (tab === 'resumo') {
        html += `
          <div class="si-max">
            ${ico('trophy', 'si-trophy')}
            <div><small>Prêmio máximo</small><b>${this.xs(info.maxWin)} a aposta</b><span>Apostando 🪙 ${fmt(bet)}: até <b class="si-coins">${this.coins(info.maxWin, bet)}</b></span></div>
          </div>
          <div class="stats-grid si-stats">
            <div><small>Aposta atual</small><b>🪙 ${fmt(bet)}</b></div>
            <div><small>RTP (retorno teórico)</small><b>${info.rtp}</b></div>
            <div><small>Volatilidade</small><b><span class="vol vol-${info.vol}">${'●'.repeat(info.vol)}${'○'.repeat(4 - info.vol)}</span> ${this.VOL[info.vol]}</b></div>
            <div><small>Chance de ganho</small><b>${info.hit}</b></div>
          </div>
          <h4>Como ganhar</h4>${info.how}
          <h4>Destaques</h4><ul class="si-list">${info.highlights.map(x => `<li>${x}</li>`).join('')}</ul>
          <p class="muted small">RTP é a média devolvida no longo prazo: de cada 🪙 100 apostadas, volta ~${info.rtp.replace(/[~%]/g, '')} em média. Volatilidade alta = prêmios mais raros, porém maiores.</p>`;
      }
      if (tab === 'pagamentos') {
        html += `<p class="muted small">Valores para a aposta atual de <b>🪙 ${fmt(bet)}</b> (mude a aposta e abra de novo para recalcular).</p>`;
        html += info.tables.map(table).join('');
      }
      if (tab === 'bonus') html += info.features;
      if (tab === 'linhas') {
        const L = info.lines;
        html += `<p>${L.text}</p><div class="ln-wrap">${L.list.map((cells, i) => this.diagram(L.cols, L.rows, new Set(cells), i + 1)).join('')}</div>`;
      }
      body.innerHTML = html;
    };
    render();
    body.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]')?.dataset.tab;
      if (!t) return;
      Sfx.click();
      tab = t;
      render();
    });
    UI.modal(`Prêmios — ${game.name}`, body);
  },
};
