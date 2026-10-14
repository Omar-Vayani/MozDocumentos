// Contrato de parceria agrícola (meação): the DUAT holder and a cultivator
// farm a plot together for one or more seasons and share the harvest. Land is
// State property and the DUAT cannot be sold or leased: the holder keeps
// possession, the agreement grants no rights over the land, and perennial
// crops or permanent improvements need written consent.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import {
  assinatura, documentoFields, fecho, foroField, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings, semPonto, str,
} from './_contratos';
import { linhas } from './_digital';

export default defineTemplate({
  id: 'contrato-parceria-agricola',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'titular', title: l('Titular da terra', 'Landholder'), personRole: 'outro' },
    { id: 'parceiro', title: l('Parceiro cultivador', 'Cultivator'), personRole: 'outro' },
    { id: 'terreno', title: l('Terreno e culturas', 'Plot and crops') },
    { id: 'contribuicoes', title: l('Contribuições e repartição', 'Contributions and sharing') },
    { id: 'clausulas', title: l('Testemunhas e assinaturas', 'Witnesses and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('titular', { fromProfile: true }),
    ...partyFields('parceiro'),

    { name: 'localizacao', type: 'text', section: 'terreno', required: true, label: l('Localização do terreno (machamba)', 'Plot location'), placeholder: l('Ex.: Bairro de Mudzingadze, Posto Administrativo de Vanduzi, Distrito de Vanduzi', 'E.g. village, administrative post, district') },
    { name: 'area', type: 'text', section: 'terreno', width: 'half', label: l('Área', 'Area'), placeholder: l('Ex.: 2 hectares', 'E.g. 2 hectares') },
    { name: 'confrontacoes', type: 'text', section: 'terreno', width: 'half', label: l('Confrontações (vizinhos)', 'Boundaries'), placeholder: l('Ex.: Norte, rio Nhamucuarara; Sul, machamba de A. Mafuta', 'E.g. north: river') },
    {
      name: 'titulo',
      type: 'select',
      section: 'terreno',
      label: l('Direito do titular sobre a terra', 'Holder’s land right'),
      options: [
        { value: 'duat', label: l('DUAT titulado', 'Titled DUAT') },
        { value: 'ocupacao', label: l('Ocupação de boa-fé ou segundo normas costumeiras', 'Good-faith or customary occupation') },
      ],
      default: 'ocupacao',
    },
    { name: 'duatNumero', type: 'text', section: 'terreno', width: 'half', label: l('Título DUAT n.º', 'DUAT title no.'), showIf: (v) => v.titulo === 'duat' },
    { name: 'culturas', type: 'text', section: 'terreno', required: true, label: l('Culturas', 'Crops'), placeholder: l('Ex.: milho e feijão nhemba; hortícolas', 'E.g. maize and cowpea') },
    { name: 'campanha', type: 'text', section: 'terreno', width: 'half', label: l('Campanha agrícola', 'Season'), placeholder: l('Ex.: 2026/2027', 'E.g. 2026/2027') },
    { name: 'campanhas', type: 'number', section: 'terreno', width: 'half', min: 1, max: 10, default: 1, label: l('Número de campanhas', 'Number of seasons') },

    { name: 'contribTitular', type: 'textarea', section: 'contribuicoes', rows: 3, label: l('O titular contribui com', 'The holder provides'), default: 'a terra\nas sementes\nmetade dos fertilizantes' },
    { name: 'contribParceiro', type: 'textarea', section: 'contribuicoes', rows: 3, label: l('O parceiro contribui com', 'The cultivator provides'), default: 'o trabalho de preparação, sementeira, sacha e colheita\nmetade dos fertilizantes' },
    { name: 'pctTitular', type: 'number', section: 'contribuicoes', width: 'half', min: 0, max: 100, default: 50, label: l('Parte da colheita do titular (%)', 'Holder’s share of harvest (%)') },
    { name: 'base', type: 'select', section: 'contribuicoes', width: 'half', label: l('Repartição de', 'Share of'), options: [{ value: 'bruta', label: l('Colheita total', 'Whole harvest') }, { value: 'liquida', label: l('Colheita após descontar os insumos adiantados', 'Harvest after repaying advanced inputs') }], default: 'bruta' },
    { name: 'venda', type: 'radio', section: 'contribuicoes', label: l('Venda', 'Sale'), options: [{ value: 'separada', label: l('Cada um vende a sua parte', 'Each sells their share') }, { value: 'conjunta', label: l('Venda conjunta e divisão do dinheiro', 'Joint sale and split of proceeds') }], default: 'separada' },

    { name: 'testemunhas', type: 'toggle', section: 'clausulas', default: true, label: l('Assinatura de duas testemunhas', 'Two witnesses sign') },
    { name: 'visto', type: 'toggle', section: 'clausulas', default: true, label: l('Espaço para o visto do líder comunitário ou secretário do bairro', 'Space for the community leader’s endorsement') },
    foroField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'titular', 'titular', 'holder'), ...partyWarnings(v, 'parceiro', 'parceiro', 'cultivator')];
    w.push({ level: 'warning', message: l(`A terra é do Estado e o DUAT não pode ser vendido nem arrendado. Este acordo é uma parceria na produção: o titular mantém a terra e o parceiro não adquire direitos sobre ela (${cite('terraPropriedadeEstado')}). Prefira acordos por uma ou poucas campanhas (${cite('turParceriaAgricola')}).`, 'Land belongs to the State and a DUAT cannot be sold or leased. This is a production partnership: the holder keeps the land and the cultivator acquires no rights over it. Prefer one or few seasons.') });
    if (Number(v.campanhas) > 3) w.push({ level: 'warning', field: 'campanhas', message: l('Acordos longos aumentam o risco de disputa sobre a terra. Considere renovar a cada campanha.', 'Long agreements increase the risk of land disputes. Consider renewing each season.') });
    if (/caju|cajueiro|algod|tabaco|fruteira|banan|eucal|pinh/i.test(str(v.culturas))) w.push({ level: 'warning', field: 'culturas', message: l(`Culturas permanentes ou sob regime especial (caju, algodão, tabaco, fruteiras, árvores) exigem cuidado: árvores plantadas podem gerar direitos e algumas culturas têm regras de comercialização próprias (${cite('concessaoCulturas')}).`, 'Perennial or regulated crops need care: planted trees may create rights and some crops have special marketing rules.') });
    return w;
  },

  personName: (v) => partyName(v, 'parceiro') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const T = papel(v, 'titular', 'Titular', 'Titular');
    const P = papel(v, 'parceiro', 'Parceiro', 'Parceira');
    const pt = Number(v.pctTitular);
    const temPct = Number.isFinite(pt) && v.pctTitular !== '' && v.pctTitular != null;
    const pp = temPct ? Math.max(0, 100 - pt) : null;
    const ct = linhas(v.contribTitular).map(semPonto);
    const cp = linhas(v.contribParceiro).map(semPonto);
    const lista = (xs: string[]) => xs.map((s, i) => `${s}${i === xs.length - 1 ? '.' : ';'}`);
    const n = Number(v.campanhas);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'terreno',
      heading: 'Terreno',
      text: numerar([
        `${T.O} detém, ${v.titulo === 'duat' ? `ao abrigo do título de direito de uso e aproveitamento da terra n.º ${str(v.duatNumero) || BLANK}` : 'por ocupação de boa-fé e segundo as normas e práticas costumeiras da comunidade'}, um terreno agrícola situado em ${semPonto(v.localizacao) || BLANK}${str(v.area) ? `, com a área aproximada de ${semPonto(v.area)}` : ''}${str(v.confrontacoes) ? `, que confronta com ${semPonto(v.confrontacoes)}` : ''}.`,
        `O presente acordo não transmite ${P.ao} qualquer direito sobre a terra, que continua na posse ${T.de}; ${P.o} cultiva-a apenas por permissão ${T.de} e para os fins deste acordo.`,
      ]),
      en: 'The holder has the stated land right over the plot described. The agreement transfers no land rights; the cultivator farms only by the holder’s permission and for this purpose.',
    });
    cl.push({
      id: 'objecto',
      heading: 'Objecto e duração',
      text: `As partes acordam cultivar em conjunto o referido terreno com ${semPonto(v.culturas) || BLANK}, ${Number.isFinite(n) && n > 1 ? `durante ${n} campanhas agrícolas, a começar` : 'durante a campanha agrícola'}${str(v.campanha) ? ` de ${semPonto(v.campanha)}` : ''}, terminando o acordo com a colheita e a repartição da última campanha.`,
      en: 'The parties farm the plot together with the stated crops for the stated season(s); the agreement ends with the last harvest and sharing.',
    });
    cl.push({ id: 'contribTitular', heading: `Contribuição ${T.de}`, text: `${T.O} contribui com:`, items: ct.length ? lista(ct) : [`${BLANK}.`], en: 'Holder’s contribution as listed.' });
    cl.push({ id: 'contribParceiro', heading: `Contribuição ${P.de}`, text: `${P.O} contribui com:`, items: cp.length ? lista(cp) : [`${BLANK}.`], en: 'Cultivator’s contribution as listed.' });
    cl.push({
      id: 'reparticao',
      heading: 'Repartição da colheita',
      text: numerar([
        `${v.base === 'liquida' ? 'Depois de restituído a quem os adiantou o valor dos insumos, a colheita' : 'A colheita'} é repartida na proporção de ${temPct ? `${pt}%` : `${BLANK}%`} para ${T.o} e ${pp != null ? `${pp}%` : `${BLANK}%`} para ${P.o}.`,
        'A colheita é feita, pesada ou contada na presença das duas partes, ou de quem as represente, e a repartição é registada por escrito e assinada por ambas.',
        v.venda === 'conjunta'
          ? 'A produção é vendida em conjunto, ao melhor preço que as partes consigam, e o dinheiro é dividido na mesma proporção, depois de pagas as despesas de transporte e venda.'
          : 'Cada parte pode vender ou consumir livremente a parte que lhe couber.',
      ]),
      en: `Harvest shared ${temPct ? `${pt}/${pp}` : '—'} (holder/cultivator)${v.base === 'liquida' ? ' after repaying advanced inputs' : ''}; harvested and weighed in both parties’ presence and recorded; ${v.venda === 'conjunta' ? 'joint sale and split of proceeds' : 'each sells their share'}.`,
    });
    cl.push({
      id: 'deveres',
      heading: 'Deveres das partes',
      text: numerar([
        `${P.O} cultiva o terreno com cuidado, segundo as boas práticas agrícolas, mantém os marcos e as delimitações e não deixa o terreno ao abandono durante a campanha.`,
        `${P.O} não pode ceder a sua posição a terceiros, plantar árvores ou culturas permanentes, construir ou fazer outras benfeitorias permanentes sem autorização escrita ${T.de}.`,
        `${T.O} garante ${P.ao} o acesso ao terreno durante a campanha e não pode retirá-lo antes da colheita, salvo incumprimento grave ${P.de}.`,
      ]),
      en: 'The cultivator farms carefully, keeps boundaries and does not abandon the plot; no assignment, tree planting, buildings or permanent improvements without consent. The holder guarantees access during the season.',
    });
    cl.push({
      id: 'perdas',
      heading: 'Perdas',
      text: 'As perdas resultantes de seca, cheias, pragas, doenças ou outras causas naturais são suportadas pelas duas partes, na proporção da repartição, sem direito a indemnização de uma à outra.',
      en: 'Losses from drought, floods, pests or other natural causes are shared in the same proportion, without compensation.',
    });
    cl.push({
      id: 'conflitos',
      heading: 'Resolução de conflitos',
      text: `As partes procuram resolver qualquer desentendimento por acordo, com a mediação das autoridades comunitárias locais, se necessário. Não sendo possível, o litígio é submetido ao ${semPonto(v.foro) || 'tribunal competente'}.`,
      en: 'Disputes are settled by agreement, with community mediation if needed; otherwise by the court stated.',
    });

    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de parceria agrícola', subtitle: str(v.campanha) ? `Campanha ${str(v.campanha)}` : undefined },
      ...partesBlocks(v, [
        { p: 'titular', role: T, en: 'Landholder' },
        { p: 'parceiro', role: P, en: 'Cultivator' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de parceria agrícola, que se rege pelas cláusulas seguintes:', en: 'This farming partnership agreement is made on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: cl },
      ...fecho(ctx, [assinatura(ctx, 'titular', T, true), assinatura(ctx, 'parceiro', P)]),
    ];
    if (v.visto) blocks.push({ type: 'box', label: 'Visto da autoridade comunitária (nome, cargo, assinatura e carimbo)', lines: 2, dashed: true });
    return blocks;
  },
});
