# FichaBet — cassino fictício

Jogos de cassino online com **fichas 100% fictícias**. Não há depósito, saque ou qualquer integração de pagamento. Os anúncios também são fictícios (uma tela simulada com contagem).

## Como rodar

Abra `index.html` no navegador (duplo clique). Não precisa de build nem de servidor.
Para testar no celular na mesma rede: `python -m http.server 8000` e acesse `http://<ip-do-pc>:8000`.

## Jogos

| Categoria | Jogo | Inspirado em | RTP aprox. |
|---|---|---|---|
| Slots | Tigrinho da Sorte | Fortune Tiger — 3×3, "Carta do Tigre" (respins, tela cheia x10) | ~93% |
| Slots | Ratinho Sortudo | Fortune Mouse — rolo do meio vira coringa, ganho garantido | ~95,7% |
| Slots | Dragãozinho | 3×3 com multiplicador x1/x2/x5/x10 por giro | ~96% |
| Slots | Doce Bonança | Sweet Bonanza — 6×5, scatter pays, cascata, bombas até 100x nas FS, compra de bônus | ~97% |
| Slots | Portões do Olimpo | Gates of Olympus — orbes em qualquer giro, multiplicador acumula nas FS | ~95,5% |
| Originais | Foguetinho | Aviator / Crash | 97% |
| Originais | Double | Blaze Double | 93,3% |
| Originais | Mines | Stake Mines | 97% |
| Originais | Plinko | Stake Plinko | ~99% |
| Originais | Limbo | Stake Limbo | 99% |
| Originais | Dice | Stake Dice | 99% |
| Originais | Hi-Lo | Stake Hilo | 99% |
| Originais | Keno | Stake Keno (40 números, 10 sorteados) | ~99% |
| Originais | Torre | Tower / Dragon Tower | 97% |
| Mesa & Ao vivo | Roda da Fortuna | money wheel + x2/x7 | 90–96% |
| Mesa & Ao vivo | Roleta Europeia | mesa completa, um zero | 97,3% |
| Mesa & Ao vivo | Blackjack | 6 baralhos, dobrar, dividir, BJ 3:2 | ~99,4% |
| Mesa & Ao vivo | Futebol Studio | Football Studio (Evolution) | 92–96% |

Os RTPs de Ratinho, Doce Bonança e Portões do Olimpo foram calibrados por simulação; o do Keno é exato (hipergeométrica).

## Engajamento

- **Bônus diário (check-in):** calendário de 7 dias com sequência; perdeu um dia, volta ao Dia 1. Abre sozinho na primeira visita do dia.
- **Roda de prêmios grátis:** a cada 4 horas (fichas, XP ou rodadas grátis).
- **Missões diárias:** 5 por dia (sorteadas pela data), com fichas + XP; completar todas abre um baú com rodadas grátis.
- **Passe da temporada:** 30 níveis (300 XP cada), temporadas de 28 dias. Trilha grátis + trilha Premium (ativada com fichas, dá +25% de XP).
- **XP:** cada rodada dá `4 + 3·√aposta` XP (não premia só apostas enormes).
- **Rodadas grátis:** valem em qualquer slot (aposta fixa 🪙 2,00).
- **Anúncios fictícios:** +🪙 250 por anúncio (10 por dia); prêmios altos (≥10x, ou ≥🪙 300 com ≥3x) oferecem **dobrar o prêmio** assistindo um anúncio. Para plugar uma rede de anúncios de verdade, troque só `Ads.watch()` em `js/progress.js`.
- **Retenção:** carrossel de promoções, "Mais jogados", "Continue jogando", selos HOT/NOVO, pontinhos de notificação na navegação, celebração de nível, oferta de anúncio/recarga quando as fichas acabam.
- **Jogo responsável:** lembrete de pausa a cada 1h de sessão.

## Estrutura

```
index.html
css/style.css
assets/img/*.webp   sprites 3D (Microsoft Fluent Emoji, licença MIT)
js/core.js          utilidades, RNG, carteira, sons, UI (bigWin, confete), Bus de eventos, GameCtx
js/progress.js      XP/passe, missões, check-in, roda, anúncios fictícios, rodadas grátis
js/pages.js         páginas Bônus, Missões e Passe
js/main.js          roteador por hash (#/id), lobby, carteira, navegação
js/games/*.js       um arquivo por jogo, cada um chama App.register({ id, name, art, ..., mount(root, ctx) })
```

Para adicionar um jogo: crie `js/games/novo.js` com `App.register({...})` (com `art` = nome de um sprite em `assets/img`) e inclua o `<script>` no `index.html`.
Use `ctx.sleep()` / `ctx.interval()` nas animações: ao sair da tela, a rodada termina na hora e paga o que deve.
Chame `ctx.round(aposta, pagamento)` quando a rodada terminar — é isso que alimenta missões, XP e "jogados recentemente".

## Créditos

Sprites: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT). Fontes: Lilita One e Nunito (Google Fonts, OFL).
"# teb" 
