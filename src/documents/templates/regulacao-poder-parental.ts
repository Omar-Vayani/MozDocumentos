import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, lineItems, localField, money } from './_shared';
import { artigos, courtFields, moneyExt, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

const alteracao = (v: Values) => v.tipo === 'alteracao';
const semEmpresa = (p: string, s: string, light = false) => partyFields(p, s, { defaultTipo: 'pessoa', light }).filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name));

export default defineTemplate({
  id: 'regulacao-poder-parental',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e pedido', 'Court and request') },
    { id: 'requerente', title: l('Requerente (pai ou mãe)', 'Applicant (parent)'), personRole: 'cliente' },
    { id: 'requerido', title: l('Requerido (o outro progenitor)', 'Respondent (other parent)'), personRole: 'outro' },
    { id: 'filhos', title: l('Filhos menores', 'Minor children') },
    { id: 'proposta', title: l('Regime proposto', 'Proposed arrangements') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal').map((f) => (f.name === 'tribunal' ? { ...f, default: 'Tribunal de Menores da Cidade de Maputo', help: l('Tribunal de Menores ou secção de menores do tribunal judicial da área de residência do menor.', 'The minors’ court of the child’s residence.') } : f)),
    {
      name: 'tipo',
      type: 'radio',
      section: 'tribunal',
      label: l('Pede', 'Asks for'),
      default: 'regulacao',
      options: [
        { value: 'regulacao', label: l('Regulação do exercício do poder parental', 'Parental responsibility order') },
        { value: 'alteracao', label: l('Alteração da regulação já fixada', 'Change of an existing order') },
      ],
    },
    { name: 'processoAnterior', type: 'text', section: 'tribunal', label: l('Regulação anterior', 'Earlier order'), placeholder: l('Ex.: fixada por sentença de 4 de Maio de 2022, no processo n.º 88/2022', 'E.g. set by judgment of 4 May 2022, case 88/2022'), showIf: alteracao },
    ...semEmpresa('requerente', 'requerente'),
    ...semEmpresa('requerido', 'requerido', true),
    { name: 'relacaoPais', type: 'select', section: 'filhos', label: l('Os pais', 'The parents'), default: 'separados', options: [
      { value: 'separados', label: l('Viveram em união de facto e separaram-se', 'Lived together and separated') },
      { value: 'divorciados', label: l('Estão divorciados ou separados judicialmente', 'Are divorced or separated') },
      { value: 'casados', label: l('São casados mas vivem separados', 'Are married but live apart') },
      { value: 'nunca', label: l('Nunca viveram juntos', 'Never lived together') },
    ] },
    { name: 'dataSeparacao', type: 'date', section: 'filhos', width: 'half', label: l('Separados desde (opcional)', 'Apart since (optional)') },
    {
      name: 'filhos',
      type: 'lines',
      section: 'filhos',
      required: true,
      label: l('Filhos menores', 'Minor children'),
      addLabel: l('Adicionar filho', 'Add child'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
      ],
      default: [],
    },
    { name: 'factos', type: 'textarea', section: 'filhos', rows: 5, label: l('Factos (um artigo por linha)', 'Facts (one article per line)'), help: l('Com quem vivem os menores, quem cuida deles, escola, saúde, porque o regime proposto serve o seu superior interesse; na alteração, o que mudou.', 'Who the children live with, who cares for them, why the proposal serves their best interests.') },
    { name: 'residencia', type: 'radio', section: 'proposta', label: l('Os menores residem com', 'Children live with'), default: 'requerente', options: [
      { value: 'requerente', label: l('O requerente', 'The applicant') },
      { value: 'requerido', label: l('O requerido', 'The respondent') },
      { value: 'alternada', label: l('Residência alternada', 'Alternating residence') },
    ] },
    { name: 'responsabilidades', type: 'radio', section: 'proposta', label: l('Decisões de particular importância', 'Major decisions'), default: 'ambos', options: [
      { value: 'ambos', label: l('Por ambos os pais', 'By both parents') },
      { value: 'residente', label: l('Pelo progenitor com quem residem', 'By the resident parent') },
    ] },
    { name: 'visitas', type: 'textarea', section: 'proposta', rows: 3, label: l('Regime de visitas e convívio', 'Contact arrangements'), default: 'O progenitor não residente pode estar com os menores em fins-de-semana alternados, de sexta-feira, à saída da escola, até domingo ao fim da tarde, e metade das férias escolares, a combinar com a antecedência possível.', help: l('Fins-de-semana, férias, aniversários, Natal e Ano Novo.', 'Weekends, holidays, birthdays, festivities.') },
    { name: 'alimentos', type: 'money', section: 'proposta', width: 'half', label: l('Alimentos por filho, por mês', 'Maintenance per child per month') },
    { name: 'alimentosDia', type: 'number', section: 'proposta', width: 'half', min: 1, max: 31, label: l('Pagar até ao dia', 'Pay by day'), default: 10 },
    { name: 'extraordinarias', type: 'toggle', section: 'proposta', default: true, label: l('Despesas extraordinárias de saúde e educação a meias', 'Extraordinary health and education costs shared equally') },
    ...provaFields('prova', { docsPlaceholder: 'Certidões de nascimento dos menores\nDeclaração da escola\nComprovativos de despesas' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`Processo tutelar cível: ${cite('pcPoderParental')}. Será convocada uma conferência de pais; se houver acordo, use o documento «Acordo de regulação do exercício do poder parental» e peça a homologação.`, 'A parents’ conference will be held; if you agree, use the agreement document and ask for approval.') },
    ];
    if (lineItems(v.filhos).filter((f) => str(f.nome)).length === 0) w.push({ level: 'warning', field: 'filhos', message: l('Indique os filhos menores.', 'List the minor children.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.requeridoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const Q = g3(v, 'requerente');
    const D = g3(v, 'requerido');
    const oReq = `${Q.o} Requerente`;
    const OReq = `${Q.O} Requerente`;
    const oDo = `${D.o} ${D.w('Requerido', 'Requerida')}`;
    const filhos = lineItems(v.filhos).filter((f) => str(f.nome));
    const um = filhos.length === 1;
    const Menores = um ? 'O menor' : 'Os menores';
    const alt = alteracao(v);

    const relacao: Record<string, string> = {
      separados: `${OReq} e ${oDo} viveram em união de facto, encontrando-se separados${v.dataSeparacao ? ` desde ${dateLong(v.dataSeparacao)}` : ''}.`,
      divorciados: `${OReq} e ${oDo} estão divorciados ou separados judicialmente${v.dataSeparacao ? `, vivendo separados desde ${dateLong(v.dataSeparacao)}` : ''}.`,
      casados: `${OReq} e ${oDo} são casados entre si, mas vivem separados${v.dataSeparacao ? ` desde ${dateLong(v.dataSeparacao)}` : ''}.`,
      nunca: `${OReq} e ${oDo} nunca viveram em comum.`,
    };
    const factos = [
      `${OReq} e ${oDo} são pais ${filhos.length ? (um ? 'do menor' : 'dos menores') : 'dos menores'} ${filhos.map((f) => `${f.nome}${f.nascimento ? `, com data de nascimento de ${dateLong(f.nascimento)}` : ''}`).join('; ') || '____________________'}, como consta ${um ? 'da certidão de nascimento junta' : 'das certidões de nascimento juntas'}.`,
      relacao[v.relacaoPais as string] ?? relacao.separados,
      ...(alt ? [`O exercício do poder parental foi regulado ${sem(v.processoAnterior) || '____________________'}, mas as circunstâncias alteraram-se, como se expõe.`] : ['O exercício do poder parental não se encontra regulado.']),
      ...artigos(v.factos),
    ];
    const resid: Record<string, string> = {
      requerente: `${Menores} ${um ? 'fica' : 'ficam'} a residir com ${oReq}`,
      requerido: `${Menores} ${um ? 'fica' : 'ficam'} a residir com ${oDo}`,
      alternada: `${Menores} ${um ? 'reside' : 'residem'} alternadamente com cada um dos pais, em períodos a fixar`,
    };
    const proposta = [
      `${resid[v.residencia as string] ?? resid.requerente}.`,
      v.responsabilidades === 'residente'
        ? 'As responsabilidades parentais relativas às questões de particular importância são exercidas pelo progenitor com quem os menores residem.'
        : 'As responsabilidades parentais relativas às questões de particular importância para a vida dos menores são exercidas em comum por ambos os pais.',
      `${sem(v.visitas) || '____________________'}.`,
      ...(money(v.alimentos) != null
        ? [`O progenitor não residente paga, a título de alimentos, a quantia mensal de ${moneyExt(v.alimentos)} por cada filho, até ao dia ${v.alimentosDia || '____'} de cada mês, actualizada anualmente.`]
        : []),
      ...(v.extraordinarias ? ['As despesas extraordinárias de saúde e de educação são suportadas por ambos os pais, em partes iguais, mediante apresentação dos comprovativos.'] : []),
    ];
    const pedidos = [
      `Ser designada data para a conferência de pais, ${D.w('citando-se o Requerido', 'citando-se a Requerida')} para nela comparecer`,
      `Ser ${alt ? 'alterado o regime de exercício do poder parental' : 'regulado o exercício do poder parental'} relativamente ${um ? 'ao menor' : 'aos menores'}, nos termos propostos ou nos que V. Ex.ª, no superior interesse ${um ? 'do menor' : 'dos menores'}, entender adequados`,
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      ...petitionHead(v, {
        autor: 'requerente',
        reu: 'requerido',
        autorM: 'Requerente',
        autorF: 'Requerente',
        reuM: 'Requerido',
        reuF: 'Requerida',
        verbo: 'requerer, contra',
        accao: alt ? 'a presente\n**ACÇÃO DE ALTERAÇÃO DA REGULAÇÃO DO EXERCÍCIO DO PODER PARENTAL**,' : 'a presente\n**ACÇÃO DE REGULAÇÃO DO EXERCÍCIO DO PODER PARENTAL**,',
        accaoEn: 'this application for a parental responsibility order,',
      }),
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Dos factos', items: factos },
          { heading: 'II — Do regime proposto', items: proposta },
        ],
      },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, requer:',
        introEn: 'On these grounds, the applicant requests:',
        pedidos,
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
