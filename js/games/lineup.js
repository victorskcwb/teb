'use strict';

/* =========================================================
   Seleção de slots por estúdio que aparecem no lobby.
   Ficam os mais conhecidos e os de mecânica mais elaborada;
   os outros continuam no código (é só incluir o id aqui para voltar).
   ========================================================= */
const SLOT_LINEUP = {
  pragmatic: ['olimpo1000', 'doce1000', 'princesa1000', 'docerush1000', 'casacaes', 'casacaesmulti', 'lobodeouro', 'festafrutas', 'festafrutas2',
    'joiasbonanca', 'madamedestino', 'reibufalo', 'cincoleoes', 'poderthor', 'extrasuculentomw', 'kraken2', 'sabedoriaatena', 'princesacrepusculo',
    'acucarsupremo', 'pompeia', 'gravidade', 'portais', 'zeushades', 'muertos', 'merlin'],
  pgsoft: ['mahjong1', 'mahjong2', 'ninhodragao', 'bandidoselvagem', 'tesourosastecas', 'riquezasduende', 'ouroganesha', 'recompensacapitao', 'caishen',
    'qilin', 'dueloselvagem', 'capsuladoces', 'riquezassereia', 'songkran', 'asgard', 'sonhosmacau', 'livromisterio', 'gloriagladiador', 'bufalovencedor',
    'carnavalmascaras', 'maravilhasespirituais', 'prosperidade', 'diaochan', 'montanharussa', 'ninjasamurai'],
  hacksaw: ['procurado', 'cidaderip', 'banditoguaxinim', 'faraoguaxinim', 'gangucaos', 'maoanubis', 'gladiadores', 'unidadedork', 'empilhaai', 'mortosvivos',
    'despencou', 'maresmalditos', 'templotormento', 'segureas', 'caminhoguerreiro', 'doisselvagens', 'zezeus', 'cubos2', 'xpander', 'gemasgronk',
    'densho', 'porquinhomagico', 'miamimult', 'forjadotempestade', 'bennycerveja'],
  nolimit: ['manicomio', 'celaxways', 'celaxways2', 'lapide', 'lapiderip', 'lapidesempiedade', 'cidadefantasma', 'cidadefantasmarip', 'buracofogo', 'buracofogo2',
    'submarino', 'blococelas', 'sanguesombra', 'sanguesombra2', 'gulaggelado', 'detetiveserial', 'evavenenosa', 'tribodragao', 'cobrinha2000', 'perturbado',
    'diad', 'terraliberdade', 'encruzilhada', 'pescariabizarra', 'novecinco'],
  tada: ['superas', 'megaas', 'asselvagem', 'joiasfortuna', 'joiasfortuna2', 'imperiodourado', 'dinheirochegando', 'superrico', 'fortunaossos', 'alibaba',
    'bufalofurioso', 'reiselva', 'romax', 'cidadepecado', 'rainhadourada', 'tigremestre', 'bancodourado', 'coringadourado', 'provacaofenix',
    'sacerdotisaasteca', 'tres_moedas', 'reiartur', 'guerradragoes', 'wukong', 'lampadamagica'],
};
