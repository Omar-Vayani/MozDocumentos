// Providência cautelar de suspensão de despedimento: the dismissed worker asks
// the labour court, before or during the action challenging the dismissal, to
// suspend it at once — within the short legal time limit counted from the end
// of the contract.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, localField, money, placeDate } from './_shared';
import { FECHO_OPTIONS, artigos, courtAddressee, courtFields, documentosList, juntaText, linePara, moneyExt, papel, partyDesc, partyFields, testemunhasList } from './_advocacia';
import { optionalLawyerFields, partySignature, str, viaMandatario, keepTail } from './_processo-penal';

const T = (v: Values, m: string, f: string) => papel(v, 'requerente', m, f);
const E = (v: Values, m: string, f: string) => papel(v, 'requerido', m, f);

const VICIOS: { name: string; label: ReturnType<typeof l>; text: (v: Values) => string }[] = [
  { name: 'vSemProcesso', label: l('Sem processo disciplinar', 'No disciplinary procedure'), text: (v) => `O despedimento foi decidido sem processo disciplinar, sem nota de culpa e sem que ${T(v, 'o requerente', 'a requerente')} fosse ${T(v, 'ouvido', 'ouvida')}.` },
  { name: 'vVerbal', label: l('Comunicado verbalmente', 'Verbal dismissal'), text: () => 'O despedimento foi comunicado verbalmente, sem decisão escrita e fundamentada.' },
  { name: 'vSemJustaCausa', label: l('Factos falsos ou sem gravidade', 'False or minor facts'), text: () => 'Os factos invocados não são verdadeiros ou não têm gravidade que justifique o despedimento.' },
];

export default defineTemplate({
  id: 'suspensao-despedimento',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal', 'Court') },
    { id: 'requerente', title: l('Trabalhador (requerente)', 'Worker (applicant)'), personRole: 'trabalhador' },
    { id: 'requerido', title: l('Empregador (requerido)', 'Employer (respondent)'), personRole: 'outro' },
    { id: 'factos', title: l('Contrato e despedimento', 'Contract and dismissal') },
    { id: 'prova', title: l('Prova e valor', 'Evidence and value') },
    { id: 'advogado', title: l('Advogado (opcional)', 'Lawyer (optional)') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal').map((f) => (f.name === 'tribunal' ? { ...f, default: 'Tribunal do Trabalho da Cidade de Maputo', help: l('Onde não houver Tribunal do Trabalho instalado, use a secção laboral do tribunal judicial.', 'Where there is no labour court, use the labour section of the ordinary court.') } : f)),
    {
      name: 'momento',
      type: 'radio',
      section: 'tribunal',
      label: l('Quando', 'When'),
      default: 'preliminar',
      options: [
        { value: 'preliminar', label: l('Antes da acção de impugnação', 'Before the main action') },
        { value: 'apenso', label: l('Com a acção já proposta', 'With the main action pending') },
      ],
    },
    { name: 'processoNumero', type: 'text', section: 'tribunal', width: 'half', label: l('Processo principal n.º', 'Main case no.'), showIf: (v) => v.momento === 'apenso' },
    ...partyFields('requerente', 'requerente').filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name)),
    ...partyFields('requerido', 'requerido', { light: true, defaultTipo: 'empresa' }),
    { name: 'dataAdmissao', type: 'date', section: 'factos', width: 'half', label: l('Data de admissão', 'Start date') },
    { name: 'categoria', type: 'text', section: 'factos', width: 'half', label: l('Categoria / função', 'Job title') },
    { name: 'salario', type: 'money', section: 'factos', width: 'half', required: true, label: l('Salário mensal', 'Monthly salary') },
    { name: 'dataDespedimento', type: 'date', section: 'factos', width: 'half', required: true, label: l('Data em que o contrato cessou', 'Date the contract ended') },
    { name: 'motivoInvocado', type: 'text', section: 'factos', label: l('Motivo invocado', 'Reason given'), placeholder: l('Ex.: alegado desvio de combustível', 'E.g. alleged fuel theft') },
    ...VICIOS.map((x) => ({ name: x.name, type: 'toggle' as const, section: 'factos', label: x.label, default: x.name === 'vSemJustaCausa' })),
    { name: 'factos', type: 'textarea', section: 'factos', rows: 5, label: l('Outros factos (um artigo por linha)', 'Other facts (one article per line)') },
    { name: 'prejuizo', type: 'textarea', section: 'factos', rows: 3, label: l('Prejuízo sofrido com o despedimento (um artigo por linha)', 'Harm suffered (one article per line)'), default: 'O salário era a única fonte de rendimento do requerente e do seu agregado familiar.\nSem ele, o requerente não consegue pagar a renda da casa, a alimentação e a escola dos filhos.' },
    { name: 'testemunhas', type: 'textarea', section: 'prova', rows: 3, label: l('Testemunhas (opcional)', 'Witnesses (optional)') },
    { name: 'documentos', type: 'textarea', section: 'prova', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), placeholder: l('Contrato de trabalho\nCarta de despedimento\nÚltimo recibo de salário', 'Contract\nDismissal letter\nLast payslip') },
    { name: 'valorCausa', type: 'money', section: 'prova', width: 'half', label: l('Valor (opcional)', 'Value (optional)'), help: l('Valor atribuído ao pedido; se tiver dúvidas, confirme na secretaria do tribunal.', 'Value given to the application; check with the court office if unsure.') },
    ...optionalLawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  computed: (v) => ({ valor: money(v.valorCausa) }),

  warnings: (v, ctx) => {
    const p = ctx.legal.value<{ dias: number }>('ppSuspensaoDespedimento');
    const w: Warning[] = [
      {
        level: 'warning',
        field: 'dataDespedimento',
        message: l(
          `A suspensão de despedimento tem de ser requerida em ${p.dias} dias a contar da cessação do contrato (${cite('ppSuspensaoDespedimento')}). A acção de impugnação deve ser proposta depois, dentro do prazo próprio.`,
          `The suspension must be requested within ${p.dias} days of the end of the contract. The main action must follow within its own time limit.`,
        ),
      },
    ];
    if (v.dataDespedimento && v.data && diffDays(v.dataDespedimento, v.data) > p.dias) {
      w.push({ level: 'error', field: 'dataDespedimento', message: l('O prazo para pedir a suspensão já passou. Pode ainda propor a acção de impugnação de despedimento.', 'The time limit has passed. You can still bring the main action.') });
    }
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const OR = T(v, 'O requerente', 'A requerente');
    const factos = [
      `${OR} foi ${T(v, 'admitido', 'admitida')} ao serviço ${E(v, 'do requerido', 'da requerida')}${v.dataAdmissao ? ` em ${dateLong(v.dataAdmissao)}` : ''}${str(v.categoria) ? `, com a categoria de ${str(v.categoria).replace(/[.;]$/, '')}` : ''}, auferindo o salário mensal de ${moneyExt(v.salario)}.`,
      `Em ${dateLong(v.dataDespedimento)}, ${E(v, 'o requerido', 'a requerida')} fez cessar o contrato de trabalho${str(v.motivoInvocado) ? `, invocando ${str(v.motivoInvocado).replace(/[.;]$/, '')}` : ''}.`,
      ...VICIOS.filter((x) => v[x.name]).map((x) => x.text(v)),
      ...artigos(v.factos),
    ];
    const prejuizo = artigos(v.prejuizo).map((s) => (v.requerenteGenero === 'F' ? s.replace(/\bdo requerente\b/g, 'da requerente').replace(/\bo requerente\b/g, 'a requerente') : s));
    const direito = [
      'Há, assim, probabilidade séria de o despedimento vir a ser declarado ilícito na acção de impugnação.',
      `Na pendência ou como acto preliminar da acção de impugnação de despedimento, pode ser requerida a suspensão do despedimento, no prazo legal, contado da cessação do contrato (${cite('ppSuspensaoDespedimento')}), prazo que se mostra cumprido.`,
    ];
    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);
    const apenso = v.momento === 'apenso';
    const blocks: Block[] = [
      { type: 'courtHeader', processo: apenso ? str(v.processoNumero) || '________/______' : undefined, extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'requerente',
        text: `${partyDesc(v, 'requerente', { docBlank: true })}, vem${viaMandatario(v)}, ${apenso ? 'por apenso à acção de impugnação de despedimento à margem identificada' : 'como acto preliminar da acção de impugnação de despedimento'}, requerer contra ${partyDesc(v, 'requerido')} a presente`,
        en: 'The worker files against the employer this',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**PROVIDÊNCIA CAUTELAR DE SUSPENSÃO DE DESPEDIMENTO**,', en: 'APPLICATION FOR INTERIM SUSPENSION OF DISMISSAL,' },
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos e com os fundamentos seguintes:', en: 'on the following grounds:' },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Dos factos', items: factos },
          ...(prejuizo.length ? [{ heading: 'II — Do prejuízo', items: prejuizo }] : []),
          { heading: `${prejuizo.length ? 'III' : 'II'} — Do direito`, items: direito },
        ],
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª se digne, ${E(v, 'ouvido o requerido', 'ouvida a requerida')} e produzida a prova oferecida, decretar a suspensão do despedimento ${T(v, 'do requerente', 'da requerente')}, ${E(v, 'condenando-se o requerido', 'condenando-se a requerida')} a ${T(v, 'reintegrá-lo', 'reintegrá-la')} provisoriamente e a pagar-lhe as remunerações que se forem vencendo até decisão final da acção principal.`,
        en: 'The worker asks the court to suspend the dismissal, with provisional reinstatement and payment of wages.',
      },
      linePara('valor', 'Valor', `${moneyExt(ctx.computed.valor)}.`, 'Value.'),
      linePara('junta', 'Junta', `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length })}.`, 'Attached documents.', !testemunhas.length),
    ];
    if (testemunhas.length) {
      blocks.push(
        { type: 'paragraph', id: 'rol', text: '**Testemunhas:**', en: 'Witnesses:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: testemunhas, keepWithNext: true },
      );
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [partySignature(v, 'requerente', T(v, 'O Requerente', 'A Requerente'))] },
    );
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return keepTail(blocks, 'pedido');
  },
});
