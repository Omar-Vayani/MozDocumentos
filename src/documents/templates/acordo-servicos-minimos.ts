// Acordo sobre serviços mínimos durante a greve: agreed during the strike
// notice by the union body and the employer — which services are kept, the
// employees who provide them (never union leaders) and their pay.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerParty, employerSignature, l, lineItems, localField, placeDate } from './_shared';
import { doCite } from './_contrato-trabalho';
import { str } from './_rh-politicas';

export default defineTemplate({
  id: 'acordo-servicos-minimos',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'partes', title: l('Órgão sindical', 'Union body') },
    { id: 'greve', title: l('Greve', 'Strike') },
    { id: 'servicos', title: l('Serviços e trabalhadores', 'Services and employees') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data do acordo', 'Date of agreement')),
    { name: 'orgaoNome', type: 'text', section: 'partes', required: true, label: l('Órgão sindical', 'Union body'), placeholder: l('Ex.: Comité Sindical do SINTICIM', 'E.g. SINTICIM union committee') },
    { name: 'orgaoRepresentante', type: 'text', section: 'partes', width: 'half', label: l('Representado por', 'Represented by') },
    { name: 'orgaoRepresentanteCargo', type: 'text', section: 'partes', width: 'half', label: l('Na qualidade de', 'As') },
    { name: 'dataPreAviso', type: 'date', section: 'greve', width: 'half', label: l('Data do pré-aviso', 'Date of the strike notice') },
    { name: 'dataInicio', type: 'date', section: 'greve', width: 'half', required: true, label: l('Início da greve', 'Strike starts') },
    { name: 'duracao', type: 'text', section: 'greve', label: l('Duração prevista', 'Expected duration') },
    { name: 'essencial', type: 'toggle', section: 'greve', default: false, label: l('Serviço essencial', 'Essential service') },
    {
      name: 'servicos',
      type: 'lines',
      section: 'servicos',
      label: l('Serviços mínimos', 'Minimum services'),
      addLabel: l('Adicionar serviço', 'Add service'),
      columns: [
        { name: 'servico', type: 'text', label: l('Serviço', 'Service'), placeholder: l('Ex.: vigilância das instalações', 'E.g. site security') },
        { name: 'turno', type: 'text', label: l('Local / turno', 'Place / shift') },
        { name: 'numero', type: 'number', label: l('N.º de trabalhadores', 'No. of employees') },
      ],
      default: [],
    },
    {
      name: 'designados',
      type: 'lines',
      section: 'servicos',
      label: l('Trabalhadores designados', 'Employees designated'),
      addLabel: l('Adicionar trabalhador', 'Add employee'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'funcao', type: 'text', label: l('Função', 'Job') },
        { name: 'servico', type: 'text', label: l('Serviço / turno', 'Service / shift') },
      ],
      default: [],
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!lineItems(v.servicos).some((r) => str(r.servico))) w.push({ level: 'warning', field: 'servicos', message: l('Indique os serviços mínimos.', 'List the minimum services.') });
    w.push({ level: 'info', message: l(`Os dirigentes sindicais não podem ser indicados para os serviços mínimos. Sem acordo, decidem os órgãos de mediação e arbitragem${v.essencial ? '; nos serviços essenciais, sem instrumento colectivo, fixam-nos os órgãos do Ministério do Trabalho e do sector' : ''} (${cite('rhpServicosMinimos')}).`, 'Union leaders may not be designated. Without agreement, mediation bodies decide.') });
    return w;
  },
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const servicos = lineItems(v.servicos).filter((r) => str(r.servico));
    const desig = lineItems(v.designados).filter((r) => str(r.nome));
    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `O presente acordo fixa os serviços mínimos a assegurar durante a greve ${v.dataPreAviso ? `objecto do pré-aviso de ${dateLong(v.dataPreAviso)}, ` : ''}com início em ${dateLong(v.dataInicio)}${str(v.duracao) ? ` e duração prevista de ${str(v.duracao)}` : ''}, e indica os trabalhadores encarregados de os prestar, ${doCite('rhpServicosMinimos').replace(/^d/, 'nos termos d')}.`,
        en: 'This agreement sets the minimum services during the strike and the employees who will provide them.',
      },
      {
        id: 'servicos',
        heading: 'Serviços mínimos',
        text: `Durante a greve são assegurados os serviços mínimos indispensáveis à segurança e manutenção dos equipamentos e instalações${v.essencial ? ' e à satisfação das necessidades essenciais da sociedade' : ''}, a saber:`,
        items: servicos.length ? servicos.map((r, i) => `${str(r.servico)}${str(r.turno) ? ` (${str(r.turno)})` : ''}${r.numero ? `, com ${r.numero} ${Number(r.numero) === 1 ? 'trabalhador' : 'trabalhadores'}` : ''}${i === servicos.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
        en: 'Minimum services to be kept.',
      },
      {
        id: 'trabalhadores',
        heading: 'Trabalhadores designados',
        text: `1. Os serviços mínimos são prestados pelos trabalhadores ${desig.length ? 'constantes da lista seguinte' : 'que as partes indicarem por escrito'}, que não são dirigentes sindicais:\n${desig.length ? desig.map((r) => `— ${str(r.nome)}${str(r.funcao) ? `, ${str(r.funcao)}` : ''}${str(r.servico) ? ` (${str(r.servico)})` : ''};`).join('\n').replace(/;$/, '.') : '— ____________________.'}\n2. A substituição de um trabalhador designado, por impedimento, é feita por acordo entre as partes.`,
        en: 'Employees designated (not union leaders); replacements by agreement.',
      },
      {
        id: 'regime',
        heading: 'Regime',
        text: `1. Os trabalhadores que prestam serviços mínimos mantêm o direito à remuneração, não se verificando quanto a eles os efeitos suspensivos da greve ${doCite('rhpGreveEfeitos').replace(/^d/, 'nos termos d')}.\n2. A Entidade Empregadora não substitui os trabalhadores em greve por pessoas que, à data do pré-aviso, não trabalhavam na empresa.\n3. As partes actuam segundo os princípios da boa-fé e da proporcionalidade e mantêm-se disponíveis para o diálogo durante a greve.`,
        en: 'Designated employees keep their pay; no replacement of strikers by outsiders; good faith and proportionality.',
      },
    ];
    return [
      { type: 'title', text: 'Acordo sobre Serviços Mínimos' },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteEmpregador', text: `${employerParty(ctx, 'Entidade Empregadora')};`, en: 'The employer;' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      {
        type: 'paragraph',
        id: 'parteSindical',
        text: `**${str(v.orgaoNome) || BLANK}**${str(v.orgaoRepresentante) ? `, neste acto representado por ${str(v.orgaoRepresentante)}${str(v.orgaoRepresentanteCargo) ? `, na qualidade de ${str(v.orgaoRepresentanteCargo)}` : ''}` : ''}, adiante designado por **Órgão Sindical**;`,
        en: 'The union body;',
      },
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente acordo, que se rege pelas cláusulas seguintes:', en: 'The following agreement is made:' },
      { type: 'numberedClauses', style: 'clausula', items },
      { type: 'paragraph', id: 'exemplares', text: 'Feito em três exemplares de igual valor, um para cada parte e outro para o Ministério que superintende a área do Trabalho.', en: 'Made in three counterparts: one for each party and one for the Ministry of Labour.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [employerSignature(ctx, 'Pela Entidade Empregadora'), { role: 'Pelo Órgão Sindical', name: str(v.orgaoRepresentante) || undefined, detail: str(v.orgaoRepresentanteCargo) || undefined }],
      },
    ];
  },
});
