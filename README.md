# FichaBet — cassino fictício

Jogos de cassino online com **fichas 100% fictícias**. Não há depósito, saque ou qualquer integração de pagamento. Os anúncios também são fictícios (uma tela simulada com contagem).

## Como rodar

Abra `index.html` no navegador (duplo clique). Não precisa de build nem de servidor.
Para testar no celular na mesma rede: `python -m http.server 8000` e acesse `http://<ip-do-pc>:8000`.

## Jogos

| Categoria | Jogo | Inspirado em | RTP aprox. |
|---|---|---|---|
| Slots | Tigrinho da Sorte | Fortune Tiger — 3×3, "Carta do Tigre" (respins, tela cheia x10) | ~91% |
| Slots | Touro da Sorte | Fortune Ox — rolo do meio trava um símbolo, pontas fazem respins, tela cheia x10 | ~96% |
| Slots | Coelho da Sorte | Fortune Rabbit — cenouras com prêmio (5+ pagam), 8 giros só de cenouras | ~96% |
| Slots | Ratinho Sortudo | Fortune Mouse — rolo do meio vira coringa, ganho garantido | ~95,7% |
| Slots | Dragãozinho | 3×3 com multiplicador x1/x2/x5/x10 por giro | ~96% |
| Slots | Doce Bonança | Sweet Bonanza — 6×5, scatter pays, cascata, bombas até 100x nas FS, compra de bônus | ~97% |
| Slots | Portões do Olimpo | Gates of Olympus — orbes em qualquer giro, multiplicador acumula nas FS | ~95,5% |
| Slots | Princesa Estelar | Starlight Princess — mesma matemática do Olimpo, tema de estrelas | ~95,5% |
| Slots | Pescaria Bonança | Big Bass Bonanza — 5×3, 10 linhas, pescador coleta peixes nas FS (x2/x3/x10), compra de bônus | ~94% |
| Originais | Foguetinho | Aviator / Crash | 97% |
| Originais | Double | Blaze Double | 93,3% |
| Originais | Mines | Stake Mines | 97% |
| Originais | Plinko | Stake Plinko | ~99% |
| Originais | Limbo | Stake Limbo | 99% |
| Originais | Dice | Stake Dice | 99% |
| Originais | Hi-Lo | Stake Hilo | 99% |
| Originais | Keno | Stake Keno (40 números, 10 sorteados) | ~99% |
| Originais | Torre | Tower / Dragon Tower | 97% |
| Originais | Raspadinha | raspadinha 3×3 (3 iguais ganham), raspe com dedo/mouse; 1 grátis por dia | 95% (exato) |
| Mesa & Ao vivo | Roda da Fortuna | money wheel + x2/x7 | 90–96% |
| Mesa & Ao vivo | Roleta Europeia | mesa completa, um zero | 97,3% |
| Mesa & Ao vivo | Blackjack | 6 baralhos, dobrar, dividir, BJ 3:2 | ~99,4% |
| Mesa & Ao vivo | Futebol Studio | Football Studio (Evolution) | 92–96% |

Os RTPs dos slots foram calibrados por simulação; o do Keno é exato (hipergeométrica).

### Slots de estúdio

Recriações com nomes e artes próprios dos slots mais jogados de cada estúdio, seguindo as regras públicas dos originais (grade, linhas/caminhos, recursos, rodadas grátis e prêmio máximo). Todos rodam no mesmo motor (`js/games/kit.js`) e aparecem no lobby agrupados por estúdio. O "Starlight Princess" já existia como **Princesa Estelar**.

**Estilo Pragmatic Play**

| Jogo | Inspirado em | Destaque | RTP | Prêmio máx. |
|---|---|---|---|---|
| Casa dos Cães Megaways | The Dog House Megaways | Megaways · casinhas colantes | ~96,5% | 12.305x |
| Lobo de Ouro | Wolf Gold | Respin das luas · jackpot 1.000x | ~96% | 2.500x |
| Festa das Frutas | Fruit Party | 7×7 · multiplicadores até 256x | ~96,5% | 5.000x |
| Joias Bonança | Gems Bonanza | 8×8 · 5 modificadores · Febre do Ouro | ~96,5% | 10.000x |
| Madame Destino Megaways | Madame Destiny Megaways | Roda do destino · até x25 | ~96,5% | 5.000x |
| Cleogata | Cleocatra | Gatos coringa colantes x2/x3 | ~96,2% | 5.000x |
| Caçador João e a Rainha Escaravelho | John Hunter and the Tomb of the Scarab Queen | Coleta de escaravelhos · pote final | ~96,5% | 10.500x |
| Frutas Suculentas | Juicy Fruits | Coringa gigante que cresce | ~96,5% | 5.000x |
| Rei Búfalo Megaways | Buffalo King Megaways | Megaways · coringas x2/x3/x5 | ~96,5% | 5.000x |
| Portões do Olimpo 1000 | Gates of Olympus 1000 | Orbes até x1.000 · 15.000x | ~96,5% | 15.000x |
| Doce Rush 1000 | Sugar Rush 1000 | Posições até x1.024 · 25.000x | ~96,5% | 25.000x |
| Princesa Estelar 1000 | Starlight Princess 1000 | Corações até x1.000 · 15.000x | ~96,5% | 15.000x |
| Doce Bonança 1000 | Sweet Bonanza 1000 | Bombas até x1.000 · 25.000x | ~96,5% | 25.000x |
| 5 Leões Megaways | 5 Lions Megaways | Escolha giros ou multiplicador | ~96,5% | 5.000x |
| Poder de Thor Megaways | Power of Thor Megaways | Martelo transforma rolos | ~96,5% | 5.000x |
| Riquezas Selvagens | Wild Wild Riches | Coringa coleta os potes de ouro | ~96,8% | 4.600x |
| Casa dos Cães Multihold | The Dog House Multihold | Até 4 telas com coringas colantes | ~95,1% | 6.750x |
| Festa das Frutas 2 | Fruit Party 2 | Coringas que crescem até x729 | ~96,5% | 5.000x |
| Extra Suculento | Extra Juicy | Paga de qualquer rolo · mult. +1 por giro | ~96,5% | 60.000x |
| Extra Suculento Megaways | Extra Juicy Megaways | Megaways · diamantes x3 a x15 | ~96,4% | 10.000x |
| Liberte o Kraken 2 | Release the Kraken 2 | Respins de coringas · até x10 | ~96% | 5.000x |
| Sabedoria de Atena | Wisdom of Athena | Cascatas abrem a linha de cima | ~96,5% | 5.000x |
| Forja do Olimpo | Forge of Olympus | Multiplicadores sobem de nível | ~96,5% | 5.000x |
| Festa na Praia | Wild Beach Party | 7×7 · coringas até x729 | ~96,5% | 5.000x |
| Ovo da Galinha | Chicken Drop | Ovo gigante até 6×6 e x10 | ~96% | 5.000x |
| Festa na Fazenda | Barn Festival | Money Respin com 8 modificadores | ~96,4% | 20.000x |
| Portões de Valhalla | Gates of Valhalla | Coringa de gelo anda e cresce | ~96,5% | 10.000x |
| Carnaval Zumbi | Zombie Carnival | Ursos zumbis colantes com multiplicador | ~96,5% | 5.000x |
| Roubo dos Goblins | Goblin Heist Powernudge | Powernudge · respin dos leões | ~95,4% | 4.000x |
| Mochimon | Mochimon | Posições até x128 · 5.000x | ~96,5% | 5.000x |
| Jardim dos Coelhos | Rabbit Garden | Grupos coletam moedas vizinhas | ~96,5% | 5.000x |
| Abelhas Grudentas | Sticky Bees | Super abelhas colantes | ~96,5% | 5.000x |
| Ônibus das Celebridades Megaways | Wild Celebrity Bus Megaways | Respin de estrelas · mult. sem teto | ~96,5% | 10.000x |
| Assalto às Pepitas | Heist for the Golden Nuggets | Coringas coletores até x16 | ~96,5% | 5.000x |
| Panda Gordo | Fat Panda | Rolo modificador · coringas colantes | ~96,5% | 20.000x |
| 3 Coringas Zunindo | 3 Buzzing Wilds | 3 tipos de coringa · grátis colantes | ~96,5% | 5.000x |
| Recompensa do Céu | Sky Bounty | Molduras de coringa até 6×6 | ~96,5% | 5.000x |
| Reis do Bar | Pub Kings | Colete reis para virar coringa | ~96,5% | 5.000x |
| Trilha do Mustang | Mustang Trail | Coringas que se duplicam | ~96,5% | 5.000x |
| Bonança da Gravidade | Gravity Bonanza | Buraco negro suga e multiplica | ~96,5% | 10.000x |
| Princesa do Crepúsculo | Twilight Princess | Coringas x2 a x10 colantes · 7.500x | ~96,5% | 7.500x |
| Coringa Infectante | Infective Wild | Infecção vira coringas · 40 linhas | ~96,5% | 5.000x |
| Pilhas de Madeira | Timber Stacks | Até 100.000 caminhos | ~96,5% | 10.000x |
| Açúcar Supremo Powernudge | Sugar Supreme Powernudge | 6×6 · Powernudge · biscoitos multiplicadores | ~96,1% | 5.000x |
| Estouro de Fogo | Fire Stampede | Respin com jackpots até 4.000x | ~96,5% | 5.000x |
| O Alter Ego | The Alter Ego | Mistérios · até 100.000 caminhos | ~96,5% | 10.000x |
| Pompeia Megareels Megaways | Pompeii Megareels Megaways | Rolos que crescem até 8 · 10.000x | ~96,5% | 10.000x |
| Riquezas de Loki | Loki's Riches | Símbolo especial expande · 10.000x | ~96,5% | 10.000x |

**Estilo PG Soft**

| Jogo | Inspirado em | Destaque | RTP | Prêmio máx. |
|---|---|---|---|---|
| Caminhos do Mahjong | Mahjong Ways | Peças douradas · x10 nas grátis | ~96,9% | 25.000x |
| Caminhos do Mahjong 2 | Mahjong Ways 2 | 2.000 caminhos · até 100.000x | ~96,9% | 100.000x |
| Ninho do Dragão | Dragon Hatch | Grupos · 4 dragões na barra | ~96,8% | 15.000x |
| Bandido Selvagem | Wild Bandito | Multiplicador infinito +1 | ~96,7% | 25.000x |
| Tesouros Astecas | Treasures of Aztec | Até 32.400 caminhos · mult. sem limite | ~96,7% | 9.071x |
| Riquezas do Duende | Leprechaun Riches | 46.656 caminhos · mult. +1 sem fim | ~97,3% | 10.000x |
| Ouro de Ganesha | Ganesha Gold | Colete coringas · até x20 | ~96,1% | 100.000x |
| Recompensa do Capitão | Captain's Bounty | Cascata · até x15 nas grátis | ~96,2% | 30.000x |
| Ninja x Samurai | Ninja vs Samurai | Ninja multiplica · Samurai enche de coringas | ~97,4% | 2.610x |
| Vitórias de Caishen | Caishen Wins | Arrisque na roda: até 20 giros x20 | ~96,9% | 100.000x |
| Caminhos do Qilin | Ways of the Qilin | Até 46.656 caminhos · mult. sem teto | ~96,7% | 7.106x |
| Duelo Selvagem | Wild Bounty Showdown | Multiplicador dobra até x1.024 | ~96,8% | 5.000x |
| Ouro Alquímico | Alchemy Gold | Grupos · dourados viram coringa | ~96,8% | 2.661x |
| Cruzeiro Real | Cruise Royale | Coringas que viajam na diagonal | ~96,6% | 2.500x |
| Cápsula de Doces | Candy Bonanza | Grupos de 4 · mult. até x100 | ~96,7% | 50.000x |
| Destino do Sol e da Lua | Destiny of Sun & Moon | Paga dos dois lados · 20.000x | ~96,8% | 20.000x |
| Reino Jurássico | Jurassic Kingdom | Até 46.656 caminhos · molduras | ~96,7% | 6.684x |
| Farra no Supermercado | Supermarket Spree | Multiplicadores até x50 · 25.000x | ~96,7% | 25.000x |
| Noites de Coquetel | Cocktail Nights | Multiplicadores sob os rolos | ~96,8% | 5.173x |
| Prosperidade Oriental | Oriental Prosperity | Cada scatter +x2 nas grátis | ~96,8% | 3.269x |
| Carnaval das Máscaras | Mask Carnival | Mult. +1 a cada ganho | ~96,7% | 2.451x |
| Maravilhas Espirituais | Spirited Wonders | Mistérios · x15 nas grátis | ~96,7% | 50.000x |
| Búfalo Vencedor | Buffalo Win | Rolos infinitos · 25.000x | ~96,7% | 25.000x |
| Invasores da Fazenda | Farm Invaders | Cada alien vale x2 | ~96,7% | 20.000x |
| Riquezas da Sereia | Mermaid Riches | Pérola coringa que passeia | ~96,7% | 20.000x |
| Golpe de Mestre | Heist Stakes | Rolo central vira coringa | ~96,7% | 30.000x |
| Maravilhas dos Totens | Totem Wonders | Rolos laterais x5 ou coringa | ~96,7% | 2.500x |
| Delícias do Restaurante | Diner Delights | Pratos multiplicadores acumulam | ~96,8% | 2.989x |
| Bonança da Padaria | Bakery Bonanza | Mult. +2 por cascata · 12.190x | ~96,7% | 12.190x |
| Festival Songkran | Songkran Splash | Multiplicadores sobre os rolos | ~96,7% | 5.000x |
| Espíritos Místicos | Mystical Spirits | 3 medidores que se multiplicam | ~96,8% | 5.000x |
| Tiki Havaiano | Hawaiian Tiki | Coringas que crescem | ~96,8% | 1.274x |
| Glória do Gladiador | Gladiator's Glory | Coringas x1, x3 ou x5 | ~96,8% | 5.000x |
| Ascensão de Asgard | Asgardian Rising | 32.400 caminhos · mult. +1 | ~96,8% | 8.305x |
| Montanha-Russa Selvagem | Wild Coaster | Coringas com vidas · 16.465x | ~96,7% | 16.465x |
| Lenda de Perseu | Legend of Perseus | Gigantes 2×2 e 3×3 até x10 | ~96,7% | 7.524x |
| Lenda do Dragão | Dragon Legend | Par de carpas · roda do dragão | ~97,2% | 3.000x |
| Espada Salvadora de Gemas | Gem Saviour Sword | 1 linha · roda da espada | ~95,5% | 300x |
| Favor do Imperador | Emperor's Favour | Símbolos 3×3 garantidos nas grátis | ~96% | 639x |
| Tumba do Tesouro | Tomb of Treasure | Rolos expandem para 6 linhas | ~96,5% | 8.137x |
| Três Macacos | Three Monkeys | Respins com multiplicador até x5 | ~96,1% | 1.800x |
| Engrenagens do Destino | Steampunk: Wheel of Destiny | Embaralhadores dão respin e bônus | ~95,6% | 2.000x |
| Símbolos do Egito | Symbols of Egypt | Linhas de bônus até x30 | ~95,7% | 1.080x |
| Panela Quente | Hotpot | Pote de pimentas · 3 jackpots | ~95,8% | 15.000x |
| Panda Hip Hop | Hip Hop Panda | Combos em 8 direções · até x50 | ~95,8% | 572x |
| Senhor Hallow-Win | Mr. Hallow-Win | Assombração surpresa · coringas que andam | ~95,9% | 1.964x |
| Restaurante Maluco | Restaurant Craze | Pedido certo vira rolo coringa | ~97,4% | 2.000x |
| A Armadilha de Diao Chan | Honey Trap of Diao Chan | Escolha a volatilidade do bônus | ~97% | 20.230x |
| Livro dos Mistérios do Egito | Egypt's Book of Mystery | Escolha: 15 giros x1 a 5 giros x10 | ~96,8% | 100.000x |
| Sonhos de Macau | Dreams of Macau | Coringas viajantes · mult. sem zerar | ~96,7% | 6.160x |

**Estilo Hacksaw Gaming**

| Jogo | Inspirado em | Destaque | RTP | Prêmio máx. |
|---|---|---|---|---|
| Procurado Vivo ou Selvagem | Wanted Dead or a Wild | DuelReels até x100 · 3 bônus | ~96,4% | 12.500x |
| Cidade RIP | RIP City | Gato expande · rato multiplica até 200x | ~96,2% | 12.500x |
| O Bandido Guaxinim | Le Bandit | Quadrados dourados · moedas até 500x | ~96,3% | 10.000x |
| Gangue do Caos 2 | Chaos Crew 2 | Bônus só de multiplicadores · até 20.000x | ~96,3% | 20.000x |
| Mão de Anúbis | Hand of Anubis | Orbes absorvem e multiplicam | ~96,2% | 10.000x |
| Lendas Gladiadoras | Gladiator Legends | DuelReels · arena até x1.000 | ~96,3% | 10.000x |
| Unidade Dork | Dork Unit | Presentes até x200 nas grátis | ~96,3% | 10.000x |
| Empilha Aí | Stack 'Em | Pilhas multiplicam · 5 vidas | ~96,2% | 10.000x |
| Fortuna dos Mortos-Vivos | Undead Fortune | Coringas que andam até x200 | ~96,3% | 10.000x |
| Despencou | Drop 'Em | Drop preenche com um só símbolo | ~96,3% | 10.000x |
| Medo do Escuro | Fear the Dark | Lua Cheia até x100 · grade que encolhe | ~96,3% | 5.000x |
| Mares Malditos | Cursed Seas | Baús amaldiçoados até x200 | ~96,2% | 12.500x |
| Templo do Tormento | Temple of Torment | Escaravelhos até x200 | ~96,2% | 10.000x |
| Segure-as! | Keep'em | Cash'em · Get'em · Keep'em | ~96,3% | 10.000x |
| Deixe Nevar | Let it Snow | Símbolo que se espalha · roda até 50 giros | ~96,4% | 7.400x |
| Bússola do Tesouro | Cash Compass | Bússola espalha símbolos · 7.400x | ~96,4% | 7.400x |
| Multiplicador Miami | Miami Multiplier | Multiplicador total até x60 | ~96,3% | 5.000x |
| Os Respinners | The Respinners | A banda dá respins | ~96,4% | 5.150x |
| Giro Asteca | Aztec Twist | Linhas completas dão respin | ~96,4% | 6.900x |
| Fortuna da Floresta | Forest Fortune | Vento clona coringas · 10.000x | ~96,3% | 10.000x |
| Arco-Íris Duplo | Double Rainbow | Rolos coloridos até x250 | ~96,4% | 5.000x |
| Colheita Selvagem | Harvest Wilds | Girassóis multiplicadores que pulam | ~96,4% | 10.000x |
| Caminho do Guerreiro | Warrior Ways | Duelos de clãs até x100 | ~96,3% | 10.000x |
| Porquinho Mágico | Magic Piggy | Cartola vira porquinhos em coringa ou notas | ~96,2% | 7.500x |
| Forjado na Tempestade | Stormforged | Coringas até x200 · dois bônus | ~96,4% | 12.500x |
| Food Truck do Fred | Fred's Food Truck | Multiplicador global até x100 | ~96,3% | 10.000x |
| 2 Selvagens 2 Morrer | 2 Wild 2 Die | Revólveres atiram coringas até x200 | ~96,3% | 15.000x |
| Benny, a Cerveja | Benny the Beer | Stackways até 100.000 caminhos | ~96,2% | 10.000x |
| Punho da Destruição | Fist of Destruction | Punhos viram rolos coringa até x200 | ~96,3% | 10.000x |
| Densho | Densho | Rolos multiplicadores até x100 | ~96,3% | 10.000x |
| Gatos Laser | Beam Boys | Lasers criam fileiras coringa | ~96,3% | 12.500x |
| Aurora dos Reis | Dawn of Kings | Livro com expansão · 10.000x | ~96,2% | 10.000x |
| Sinta a Batida | Feel the Beat | Caixas de som · X até x500 | ~96,2% | 10.000x |
| Bombas Saltitantes | Bouncy Bombs | Bombas x5–x25 que dobram | ~96,2% | 10.000x |
| Rusty e Curly | Rusty & Curly | Cartazes com corações e respins | ~96,3% | 10.000x |
| Gangue do Dinheiro | Cash Crew | Notas até 500x · coringas x25 | ~96,3% | 10.000x |
| Matadores S.A. | Slayers Inc | DuelReels até x500 · 15.000x | ~96,3% | 15.000x |
| Zé Zeus | Ze Zeus | Quadrados divinos · Mão de Zeus | ~96,3% | 10.000x |
| Cripta Amaldiçoada | Cursed Crypt | Maldição transforma rolos | ~96,2% | 10.000x |
| O Faraó Guaxinim | Le Pharaoh | Re-drops colantes · 15.000x | ~96,2% | 15.000x |
| Seis Seis Seis | SixSixSix | Rodas Malvadas até 500x | ~94,2% | 16.666x |
| Laboratório Torcido | Twisted Lab | RotoGrid gira a grade | ~96,3% | 15.000x |
| Águia Alfa | Alpha Eagle | Stack'n'Sync · dourado até x100 | ~96,3% | 10.000x |
| Livro do Tempo | Book of Time | Livro clássico · relógios até x12 | ~96,4% | 10.000x |
| Gemas do Gronk | Gronk's Gems | Gema Épica transforma tudo | ~96,2% | 7.500x |
| Garotos do Bowery | The Bowery Boys | Cofres até x100 · banco da gangue | ~96,4% | 10.000x |
| Motoqueiros S.A. | Outlaws Inc | Pumas somam, orcs multiplicam | ~96,2% | 10.000x |
| Cubos 2 | Cubes 2 | Grade cresce até 11×11 | ~96,3% | 10.500x |
| Xpander | Xpander | Saltador até 4×4 e x128 | ~96,3% | 10.000x |

**Estilo TaDa / JILI**

| Jogo | Inspirado em | Destaque | RTP | Prêmio máx. |
|---|---|---|---|---|
| Império Dourado | Golden Empire | 32.400 caminhos · molduras douradas | ~96,8% | 2.000x |
| Joias da Fortuna | Fortune Gems | 3×3 + rolo até x15 | ~97% | 375x |
| Joias da Fortuna 2 | Fortune Gems 2 | Rolo multiplicador + Roda da Sorte | ~97% | 10.000x |
| Lâmpada Mágica | Magic Lamp | Gênios com prêmio · coringas expandem | ~96,3% | 2.000x |
| Roma X | Roma X | Duelo com o leão · cascatas dão giros | ~97% | 500x |
| Super Rico | Super Rich | Clássico de 1 linha · até 888x | ~96% | 888x |
| Fortuna dos Ossos | Bone Fortune | Respins de coringa · multiplicador sobe | ~96,2% | 2.000x |
| Ali Babá | Ali Baba | Baús multiplicadores · 32.400 caminhos | ~97% | 5.000x |
| Búfalo Furioso | Charge Buffalo | 4.096 caminhos · até 100 giros | ~97% | 4.000x |
| Rei da Selva | Jungle King | Gorila coringa · aviões multiplicam | ~97% | 2.500x |
| Noite de Festa | Party Night | Cascata até x10 · grátis em dobro | ~96,8% | 1.000x |
| Super Ás | Super Ace | Cartas douradas · combo até x10 | ~97,9% | 1.500x |
| Fortuna Neko | Neko Fortune | Mistérios que viram coringa · 4.096 caminhos | ~97% | 1.000x |
| FaFaFa Maluco | Crazy FaFaFa | 1 linha · coringa até x8 · 1.688x | ~97% | 1.688x |
| Barras de Ouro da Sorte | Lucky Goldbricks | 30 linhas · coringas colantes nas grátis | ~97% | 1.250x |
| Ganesha Chegando | Lucky Coming | 1 linha · coringa x3/x5/x9 · 1.111x | ~97% | 1.111x |
| Guerra dos Dragões | War of Dragons | 243 caminhos · 5 dragões nas grátis | ~97% | 2.000x |
| Rainha Dourada | Golden Queen | 40 linhas · coringas expansivos x2–x5 | ~97% | 1.500x |
| Tesouro Secreto | Secret Treasure | Baús · caça ao tesouro · grátis | ~97% | 2.000x |
| Rei Artur | King Arthur | Duelos de cavaleiros até x100 | ~97% | 10.000x |
| Super Touro | Super Niubi | Clássico de 1 linha · até 888x | ~96,5% | 888x |
| Caçadora de Bônus | Bonus Hunter | 1.024 caminhos · +1 a cada ganho | ~97% | 2.000x |
| Festa das Gemas | Gem Party | Grupos · grade cresce até 7×7 | ~97% | 1.500x |
| Árvore da Fortuna | Fortune Tree | 30 linhas · moedas caem da árvore | ~97% | 1.000x |
| Porquinho da Sorte | Fortune Pig | 8 linhas · respins com porcos travados | ~97% | 1.000x |
| Deus Marcial | God of Martial | 25 linhas · mult. até x20 nas grátis | ~97% | 2.500x |
| Tigela do Tesouro | Treasure Bowl | 3×3 · tigelas coringa · +1 giro | ~97% | 1.000x |
| Panda Gigante Selvagem | Wild Giant Panda | 243 caminhos · pandas colantes | ~97% | 2.000x |
| Wukong | Wukong | Bastão coringa que expande | ~97% | 2.000x |
| Roma II | Roma II | 32.400 caminhos · multiplicador sem teto | ~97% | 3.000x |
| Tesouros das 3 Moedas | 3 Coin Treasures | 243 caminhos · Hold & Win com jackpots | ~97% | 5.200x |
| Sacerdotisa Asteca | Aztec Priestess | 32.400 caminhos · mult. que sobe nas grátis | ~97% | 3.000x |
| Ás Selvagem | Wild Ace | 1.024 caminhos · Duelo do Ás | ~96,5% | 10.000x |
| Tigre Mestre | Master Tiger | 243 caminhos · grátis a partir de x3 | ~97% | 1.500x |
| Cidade do Pecado | Sin City | 40 linhas · 5 modificadores do Chefe | ~97% | 2.500x |
| Banco Dourado | Golden Bank | 1 linha · coringas x2/x3/x5 que se multiplicam | ~97% | 2.000x |
| Terra Doce | Sweet Land | 7×7 · posições até x128 | ~97% | 3.000x |
| Coringa Dourado | Golden Joker | 5 linhas · respin de pilhas · roda x10 | ~97% | 800x |
| Provação da Fênix | Trial of Phoenix | Vencedores ficam · até 15.625 caminhos | ~97% | 10.000x |
| Jack, o Pirata | Jack the Pirate | 20 linhas · canhões coringa | ~97% | 2.500x |
| A Guarda | The Guard | 243 caminhos · escudos do palácio | ~97% | 2.000x |
| Gêmeos da Fortuna | Fortune Twins | 243 caminhos · rolos gêmeos | ~97% | 2.500x |
| Pérola Mágica | Magic Pearl | 243 caminhos · pérolas até x50 | ~97% | 5.000x |
| Festa do Diamante | Diamond Party | 3 linhas · Lock Respin em todo ganho | ~96,2% | 1.200x |
| Noite Disco | Disco Night | 25 linhas · globos x2–x5 colantes | ~97% | 2.500x |
| Mania de Frutas | Fruits Mania | Cascata · multiplicador que dobra | ~96,5% | 2.500x |
| Ji Xiang Ru Yi | Ji Xiang Ru Yi | 5 linhas · cetro x2 · respin da nuvem | ~97% | 1.000x |
| Beleza Havaiana | Hawaii Beauty | 50 linhas · grátis x2 · flores | ~97% | 1.250x |
| Festival da Lua | Moon Festival | 243 caminhos · luas colantes | ~97% | 2.000x |
| Feng Shen | Feng Shen | 4.096 caminhos · coringas somam no multiplicador | ~96% | 1.000x |
| Dragão da Sorte | Lucky Dragon | 243 caminhos · grátis x3 que se renovam | ~97% | 3.000x |

**Estilo Nolimit City**

| Jogo | Inspirado em | Destaque | RTP | Prêmio máx. |
|---|---|---|---|---|
| Manicômio | Mental | xWays · Fire Frames · até 66.666x | ~96% | 66.666x |
| Cela xWays | San Quentin xWays | Coringas que pulam até x512 · 150.000x | ~96% | 150.000x |
| Lápide RIP | Tombstone R.I.P. | Volatilidade insana · até 300.000x | ~96% | 300.000x |
| Cidade Fantasma | Deadwood | xNudge somam · caçador ou pistoleiro | ~96% | 13.950x |
| Buraco de Fogo xBomb | Fire in the Hole xBomb | Mina que cresce até 46.656 caminhos | ~96% | 60.000x |
| Das Submarino | Das xBoot | Torpedos sobem e multiplicam | ~96% | 55.200x |
| Bloco de Celas | Folsom Prison | Baratas abrem celas · até 75.000x | ~96% | 75.000x |
| Sangue e Sombra | Blood & Shadow | Barra do Ritual · giros amaldiçoados | ~96% | 6.666x |
| Gulag Gelado | Remember Gulag | Scatters destrancam rolos | ~96% | 30.000x |
| Detetive Serial | Serial | Enhancer Cells · até 74.800x | ~96% | 74.800x |
| Lápide | Tombstone | xNudge · 3 rodadas grátis | ~96,2% | 11.456x |
| Manhattan Fica Selvagem | Manhattan Goes Wild | Anos 20 · coringas dourados | ~96,2% | 2.025x |
| Acampamento do Trator | Tractor Beam | Clones e abduções na fazenda | ~96% | 5.000x |
| Cristais | WiXX | Respins de reforço até x5 | ~96,6% | 2.796x |
| Jukebox da Sorte | Casino Win Spin | Gire até ganhar | ~96,7% | 2.000x |
| Drama na Cozinha: Sushi Mania | Kitchen Drama: Sushi Mania | Clones coringa · ingredientes | ~96,7% | 697x |
| Drama na Cozinha: Churrasco | Kitchen Drama: BBQ Frenzy | Carnes coringa · Espírito da Pimenta | ~96,7% | 1.050x |
| Oktoberfest | Oktoberfest | Festas surpresa · canecas x5 | ~96,7% | 500x |
| Parque Arrepiante | The Creepy Carnival | Respins de vitória · até 70 giros | ~96,1% | 1.595x |
| Moedas da Fortuna | Coins of Fortune | Empurrão do Dragão · moedas x10 | ~96,5% | 6.015x |
| Missão na Masmorra | Dungeon Quest | Paga dos dois lados · alquimia | ~96,3% | 450x |
| Yeti do Gelo | Ice Ice Yeti | Gelo quebra · até 16.807 caminhos | ~96,2% | 8.920x |
| Corujas | Owls | Saque da Lua · 3 sonhos | ~96,2% | 1.500x |
| Estrelato | Starstruck | Coringas x2/x3/x5 · prêmio 1.000x | ~96,2% | 1.635x |
| Magia Maia | Mayan Magic Wildfire | Coringas colantes · paga dos dois lados | ~96% | 1.264x |
| Thor: Hora do Martelo | Thor: Hammer Time | Relâmpago · runas · martelos | ~96% | 2.328x |
| Tribo do Dragão | Dragon Tribe | xWays + xNudge · 27.000x | ~96,1% | 27.000x |
| Eva Venenosa | Poison Eve | Magia líquida · portais coringa | ~96,1% | 2.000x |
| Carnaval do Arlequim | Harlequin Carnival | xNudge que anda · 5.861x | ~96,1% | 5.861x |
| Coelhos Bônus | Bonus Bunnies | Explosões · Carrot Link | ~96,1% | 6.950x |
| Gênio Dourado | Golden Genie and the Walking Wilds | Desfile do Gênio · coringas andantes | ~96% | 9.583x |
| Vias Lácteas | Milky Ways | Coringas solares · fusão | ~96,1% | 5.664x |
| Livro das Sombras | Book of Shadows | Livro com linhas sombrias · 30.338x | ~96% | 30.338x |
| Caçador de Búfalos | Buffalo Hunter | Manada e multiplicadores da pradaria | ~96% | 12.647x |
| Ouro do Macaco | Monkey's Gold xPays | Colossais até x250 · cipó multiplicador | ~96% | 12.683x |
| Cemitério dos Guerreiros | Warrior Graveyard | Lápides xNudge · mult. sem teto | ~96,2% | 9.797x |
| Buraco de Fogo 2 | Fire in the Hole 2 | Mina desaba · até 46.656 caminhos | ~96,1% | 65.000x |
| Sangue e Sombra 2 | Blood & Shadow 2 | Barra do ritual · coringas colantes | ~96,1% | 16.161x |
| Lápide: Sem Piedade | Tombstone: No Mercy | xNudge · 4 modos de bônus · 16.480x | ~96% | 16.480x |
| Cela xWays 2 | San Quentin 2: Death Row | Células reforçadas · 200.000x | ~96,1% | 200.000x |
| Cobrinha 2000 | Brick Snake 2000 | Cobra coringa que anda · xWays | ~96% | 8.110x |
| Das Nove às Cinco | Nine to Five | Escritório dos anos 90 · xNudge | ~96% | 9.217x |
| Bolas de Natal | Jingle Balls | Natal noir · Giros do Espírito | ~96,1% | 12.250x |
| Terra da Liberdade | Land of the Free | Esteira de modificadores · enchente | ~96,1% | 57.000x |
| Dia D | D-Day | Modificadores · coringa supremo | ~96,1% | 55.555x |
| Cidade Fantasma R.I.P. | Deadwood R.I.P | xNudge · rolo final x2 · 100.000x | ~96,1% | 100.000x |
| Solitário | Loner | Monitores · 3 minijogos retrô | ~96,1% | 14.999x |
| Pescaria Bizarra | Ugliest Catch | Células reforçadas · troféus até 1.000x | ~96,1% | 50.000x |
| Encruzilhada | Devil's Crossroad | Crosslink · Giros da Redenção | ~96,1% | 13.180x |
| Perturbado | Disturbed | Células reforçadas · 54.391x | ~96,1% | 54.391x |

Os RTPs e preços de compra de bônus são calibrados por simulação: `node tools/calibrate.js` roda a lógica de cada jogo sem tela (milhões de giros, em paralelo) e grava `js/games/calib.js`. Para recalibrar só alguns: `node tools/calibrate.js mahjong1 procurado --spins=2000000`.

## Engajamento

- **Bônus diário (check-in):** calendário de 7 dias com sequência; perdeu um dia, volta ao Dia 1. Abre sozinho na primeira visita do dia.
- **Roda de prêmios grátis:** a cada 4 horas (fichas até 🪙 2.000, XP ou rodadas grátis).
- **Missões diárias:** 5 por dia (sorteadas pela data), com fichas + XP (as fichas das missões são proporcionais à **aposta média** do jogador — média móvel das últimas ~50 rodadas, `Progress.betUnit()` — e o XP é fixo); completar todas abre um baú com rodadas grátis.
- **Missões gerais ∞:** 10 trilhas sem fim (giros, vitórias, ganhos de 10x/50x/100x, bônus ativados, total apostado/recebido, jogos diferentes). Ao coletar, o próximo nível aparece na hora com objetivo maior. O prêmio é de 5 a 12 apostas médias e cresce 10% por nível; a cada 5 níveis vêm rodadas grátis. As metas de apostar/receber também são contadas em apostas médias. Calibrado para as missões devolverem ~1,5x a vantagem da casa (cerca de 5–6% do apostado), com ~1 a 2 missões a cada 100 giros.
- **Missões de cada slot ∞:** todo slot tem a sua sequência infinita (giros, vitórias, bônus, ganho de 10x, valor apostado, ganho de Nx), que fica mais difícil a cada volta. O botão 🎯 no topo do slot mostra a missão dele; a página Missões tem as abas Diárias / Gerais / Slots.
- **Passe da temporada:** 50 níveis com custo crescente (500 XP no nível 2 até ~3.400 XP no 50; ~95 mil XP no total) e, depois, **níveis infinitos** de 4.000 XP com recompensa fixa (grátis 🪙 100; premium 🪙 300 + 3 giros). Trilha grátis: `40 + 5·nível` fichas e giros grátis a cada 5 níveis (~7 mil fichas na temporada). Premium (🪙 5.000, +25% de XP): `80 + 15·nível`, a cada 5 níveis `150·(nível/5)` + 10 giros e 🪙 5.000 + 50 giros no 50 (~30 mil fichas). Temporadas de 28 dias.
- **Nível do jogador:** infinito e nunca zera (cada nível custa `1000 + 400·(n−1)` XP, mais `15·(n−30)²` depois do 30). Patente a cada 10 níveis — Novato, Aprendiz, Apostador, Veterano, Profissional, Especialista, Mestre, Grão-Mestre, Lenda, Ídolo — e Mito ★N depois do 100. Cada patente tem 5 divisões (uma a cada 2 níveis). Aparece no topo (anel com medalha) e abre o perfil; a página **Nível** (`#/nivel`) mostra as medalhas e os marcos.
- **Marcos de nível:** recompensas no nível 10, 20, 30, 40, 50, 65, 80, 100, 125, 150, 180, 210, 250 e depois cada vez mais espaçados (+50, +50, +60, +60…). Valem `400·(1 + 0,35·i)` fichas + `5 + 2·i` giros (até 30) — cada um ≈ uma sessão de jogo. São resgatados no perfil ou na página Nível; quem já jogava antes começa a contar do nível atual.
- **XP:** cada rodada dá `2 + 1,5·√aposta` XP (não premia só apostas enormes).
- **Velocidade dos slots:** Normal, Rápido e Turbo (salvo no navegador).
- **Som dos slots de estúdio:** trilha temática gerada por jogo (WebAudio) e efeitos CC0 do Kenney/OpenGameArt em `assets/audio/slotsfx.js`.
- **VIP + cashback semanal:** 10 degraus que acompanham o nível do jogador — Bronze I (1), Bronze II (5), Prata I (10), Prata II (20), Ouro I (30), Ouro II (45), Platina (60), Diamante (80), Mestre (100) e Lenda (130). Cada um dá cashback de 1–8% das perdas líquidas da semana (teto 🪙 5.000, liberado na segunda-feira), multiplica o bônus diário (x1 a x2,2) e dá um presente ao subir (🪙 300 + 5 giros até 🪙 5.000 + 30 giros).
- **Raspadinha grátis do dia:** uma cartela de 🪙 5 por dia.
- **Rodadas grátis:** valem em qualquer slot (aposta fixa 🪙 2,00).
- **Anúncios fictícios:** +🪙 100 por anúncio (10 por dia); prêmios altos (≥10x, ou ≥🪙 300 com ≥3x) oferecem **dobrar o prêmio** assistindo um anúncio. Para plugar uma rede de anúncios de verdade, troque só `Ads.watch()` em `js/progress.js`.
- **Retenção:** carrossel de promoções, "Mais jogados", "Continue jogando", selos HOT/NOVO, pontinhos de notificação na navegação, celebração de nível, oferta de anúncio/recarga quando as fichas acabam.
- **Histórico de giros (slots):** botão 📜 no topo de todo slot mostra o resultado da sessão e abre os últimos 100 giros com vitórias/perdas, filtros, resumo (apostado, recebido, resultado, maior prêmio) e gráfico dos últimos giros. Qualquer slot novo entra sozinho (vem do `ctx.round`).
- **Painel de prêmios (slots):** botão 🏆 "Prêmios" ao lado do ganho (e o "?") abre abas Resumo (prêmio máximo, RTP, volatilidade, chance de ganho), Pagamentos (em fichas para a aposta atual), Bônus e Linhas (desenho de cada linha). Cada slot descreve isso em `info` (ver `js/slotinfo.js`).
- **Jogo responsável:** lembrete de pausa a cada 1h de sessão.
- **Modo leve (celular):** em telas de toque o site liga `html.lite`, que troca os efeitos que mais aquecem o aparelho (desfoque animado no giro, fundo desfocado das barras, brilho pulsando nas rodadas grátis, animações decorativas sem fim) por versões leves, carrega os símbolos de cada jogo só quando ele é aberto e agenda a trilha sonora com menos interrupções. No PC fica tudo igual. Para testar: `?lite=1` força, `?lite=0` desliga e `?lite=auto` volta ao automático.

## Estrutura

```
index.html
css/style.css
assets/img/*.webp   sprites 3D (Microsoft Fluent Emoji, licença MIT)
assets/audio/sfx.js efeitos sonoros (Kenney, CC0) em base64 — tocam via WebAudio até abrindo o arquivo direto
assets/audio/bossa.mp3  música ambiente em loop
js/core.js          utilidades, RNG, carteira, sons, UI (bigWin, confete), Bus de eventos, GameCtx
js/progress.js      XP/passe, missões, check-in, roda, anúncios fictícios, rodadas grátis
js/history.js       histórico de giros dos slots (localStorage) e o modal de histórico
js/games/kit.js     SlotKit: motor dos slots de estúdio (tela, giro, cascata, ways/linhas/grupos, hold & spin, rodadas grátis)
js/games/calib.js   calibração gerada (escala de prêmios, preço do bônus, chance de ganho, frequência do bônus)
js/games/pragmatic*.js, pgsoft*.js, hacksaw*.js, tada*.js, nolimit*.js   os 248 slots de estúdio
js/games/templates.js  modelos reaproveitados (paga em qualquer lugar, grupos, PG Soft)
tools/calibrate.js  simulador que calibra o RTP dos slots de estúdio
js/slotinfo.js      painel "Prêmios" dos slots (prêmio máximo, tabela, bônus, linhas)
js/pages.js         páginas Bônus, Missões, Passe, VIP e Nível (medalhas e marcos)
js/main.js          roteador por hash (#/id), lobby, carteira, navegação
js/games/*.js       um arquivo por jogo, cada um chama App.register({ id, name, art, ..., mount(root, ctx) })
```

Para adicionar um slot de estúdio: use `SlotKit.create({ ..., make(mode), spin(rt), bonus(rt, opts) })` num dos arquivos de estúdio (a lógica só fala com a tela pelo `rt`: `rt.spin(grade)`, `rt.win(x)`, `rt.fsLoop(n, corpo)`…) e rode `node tools/calibrate.js <id>`.
Para adicionar um jogo: crie `js/games/novo.js` com `App.register({...})` (com `art` = nome de um sprite em `assets/img`) e inclua o `<script>` no `index.html`.
Ao publicar uma versão nova, troque o `?v=...` dos `<script>`/`<link>` no `index.html` (ex.: `sed -i 's/?v=[0-9]*/?v=NOVO/g' index.html`), senão o navegador do celular pode misturar arquivos antigos do cache com os novos.
Use `ctx.sleep()` / `ctx.interval()` nas animações: ao sair da tela, a rodada termina na hora e paga o que deve.
Chame `ctx.round(aposta, pagamento)` quando a rodada terminar — é isso que alimenta missões, XP e "jogados recentemente".

## Créditos

- Sprites: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT).
- Efeitos sonoros: [Kenney](https://kenney.nl) — Casino Audio, Interface Sounds, Digital Audio, Impact Sounds, Music Jingles (CC0).
- Música: "Bossa Shop Theme" de [springyspringo](https://opengameart.org/content/bossa-shop-theme-in-low-fi-and-hd) (CC0 / CC-BY 3.0).
- Fontes: Lilita One e Nunito (Google Fonts, OFL).
"# teb" 
