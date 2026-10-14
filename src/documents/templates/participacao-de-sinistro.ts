// Participação de sinistro à seguradora: automóvel, incêndio, roubo ou outro
// ramo, com circunstâncias, danos, terceiros, testemunhas e pedido de peritagem.

import { defineTemplate, type Block, type FieldOption, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField, money, moneyText } from './_shared';
import {
  anexosField, anexosList, assinaturaCliente, clienteF, clienteFields, clienteWarnings, contrair, endDot, entidadeFields, entidadeRecipient, eu, fechoCarta, linhas, nomeCliente, reciboField, remetenteBlock,
  s, semPonto, sujeito,
} from './_financas';

const RAMO_OPTIONS: FieldOption[] = [
  { value: 'automovel', label: l('Automóvel', 'Motor') },
  { value: 'incendio', label: l('Incêndio / multirriscos (casa, loja, armazém)', 'Fire / property') },
  { value: 'roubo', label: l('Roubo ou furto', 'Theft') },
  { value: 'mercadorias', label: l('Mercadorias transportadas', 'Goods in transit') },
  { value: 'acidentes', label: l('Acidentes pessoais', 'Personal accident') },
  { value: 'rc', label: l('Responsabilidade civil', 'Third-party liability') },
  { value: 'outro', label: l('Outro', 'Other') },
];

const RAMO_TEXTO: Record<string, string> = {
  automovel: 'automóvel',
  incendio: 'incêndio e multirriscos',
  roubo: 'roubo',
  mercadorias: 'mercadorias transportadas',
  acidentes: 'acidentes pessoais',
  rc: 'responsabilidade civil',
};

const auto = (v: Record<string, any>) => v.ramo === 'automovel';

export default defineTemplate({
  id: 'participacao-de-sinistro',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'cliente', title: l('Tomador do seguro / segurado', 'Policyholder / insured'), personRole: 'outro' },
    { id: 'seguradora', title: l('Seguradora e apólice', 'Insurer and policy') },
    { id: 'sinistro', title: l('Sinistro', 'Incident') },
    { id: 'viatura', title: l('Viaturas e condutores (automóvel)', 'Vehicles and drivers (motor)') },
    { id: 'outros', title: l('Testemunhas, autoridades e anexos', 'Witnesses, authorities and enclosures') },
  ],
  fields: [
    { name: 'ref', type: 'text', section: 'documento', width: 'half', label: l('Referência (opcional)', 'Reference (optional)'), default: (c) => (c.profile?.kind === 'empresa' ? c.nextRef : '') },
    localField(),
    dateField('data'),
    ...clienteFields('cliente', 'cliente'),
    ...entidadeFields('seguradora', 'seguradora', 'seguradora'),
    { name: 'apolice', type: 'text', section: 'seguradora', width: 'half', required: true, label: l('Apólice n.º', 'Policy no.') },
    { name: 'ramo', type: 'select', section: 'seguradora', width: 'half', label: l('Ramo do seguro', 'Type of insurance'), options: RAMO_OPTIONS, default: 'automovel' },
    { name: 'dataSinistro', type: 'date', section: 'sinistro', width: 'half', required: true, label: l('Data do sinistro', 'Date of the incident') },
    { name: 'horaSinistro', type: 'text', section: 'sinistro', width: 'half', label: l('Hora (aprox.)', 'Time (approx.)'), placeholder: l('Ex.: 18h30', 'E.g. 18:30') },
    { name: 'localSinistro', type: 'text', section: 'sinistro', required: true, label: l('Local', 'Place'), placeholder: l('Ex.: o cruzamento da Av. Eduardo Mondlane com a Av. Karl Marx, Maputo', 'E.g. the junction of …'), help: l('Comece com o artigo («o cruzamento…», «a loja…») ou com o nome da rua.', 'Start with the article or the street name.') },
    {
      name: 'descricao',
      type: 'textarea',
      section: 'sinistro',
      required: true,
      rows: 5,
      label: l('Como aconteceu (um facto por linha)', 'How it happened (one fact per line)'),
      help: l('Descreva com objectividade, por ordem, sem assumir culpas: direcção de marcha, sinalização, o que viu.', 'Describe objectively, in order, without admitting fault.'),
    },
    { name: 'danos', type: 'textarea', section: 'sinistro', rows: 3, label: l('Danos e prejuízos (um por linha)', 'Damage and losses (one per line)') },
    { name: 'valorEstimado', type: 'money', section: 'sinistro', width: 'half', label: l('Valor estimado dos prejuízos', 'Estimated loss') },
    { name: 'feridos', type: 'toggle', section: 'sinistro', label: l('Houve feridos', 'There were injuries') },
    { name: 'feridosDescricao', type: 'text', section: 'sinistro', label: l('Feridos (quem e onde foram assistidos)', 'Injured (who and where treated)'), showIf: (v) => Boolean(v.feridos) },
    { name: 'viaturaMatricula', type: 'text', section: 'viatura', width: 'half', label: l('Matrícula da viatura segura', 'Insured vehicle plate'), showIf: auto },
    { name: 'viaturaMarca', type: 'text', section: 'viatura', width: 'half', label: l('Marca e modelo', 'Make and model'), showIf: auto },
    { name: 'condutorNome', type: 'text', section: 'viatura', width: 'half', label: l('Condutor', 'Driver'), showIf: auto },
    { name: 'condutorCarta', type: 'text', section: 'viatura', width: 'half', label: l('Carta de condução n.º', 'Driving licence no.'), showIf: auto },
    { name: 'terceiroNome', type: 'text', section: 'viatura', width: 'half', label: l('Terceiro: condutor / proprietário', 'Third party: driver / owner'), showIf: auto },
    { name: 'terceiroMatricula', type: 'text', section: 'viatura', width: 'half', label: l('Matrícula do terceiro', 'Third-party plate'), showIf: auto },
    { name: 'terceiroSeguradora', type: 'text', section: 'viatura', width: 'half', label: l('Seguradora do terceiro', 'Third party’s insurer'), showIf: auto },
    { name: 'terceiroApolice', type: 'text', section: 'viatura', width: 'half', label: l('Apólice do terceiro', 'Third party’s policy'), showIf: auto },
    { name: 'viaturaLocal', type: 'text', section: 'viatura', label: l('Onde está a viatura para peritagem', 'Where the vehicle can be inspected'), placeholder: l('Ex.: Oficina Auto Sommerschield, Rua da Frente de Libertação, Maputo', 'E.g. the garage'), showIf: auto },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'outros',
      label: l('Testemunhas', 'Witnesses'),
      addLabel: l('Adicionar testemunha', 'Add witness'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'contacto', type: 'text', label: l('Telefone / morada', 'Phone / address') },
      ],
      default: [],
    },
    { name: 'autoridade', type: 'text', section: 'outros', label: l('Autoridade que tomou conta (opcional)', 'Authority involved (optional)'), placeholder: l('Ex.: PRM — Polícia de Trânsito, auto n.º 1123/2026; Serviço Nacional de Salvação Pública', 'E.g. traffic police, report no. …') },
    { name: 'pedePeritagem', type: 'toggle', section: 'outros', default: true, label: l('Pedir peritagem e indemnização', 'Ask for inspection and compensation') },
    anexosField('outros', l('Ex.: Fotografias dos danos; cópia do livrete e da carta de condução', 'E.g. Photos; vehicle registration and licence')),
    reciboField('outros'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clienteWarnings(v, 'cliente')];
    if (!s(v.apolice)) w.push({ level: 'warning', field: 'apolice', message: l('Indique o número da apólice.', 'Enter the policy number.') });
    if (!linhas(v.descricao).length) w.push({ level: 'warning', field: 'descricao', message: l('Descreva como aconteceu.', 'Describe what happened.') });
    w.push({
      level: 'warning',
      message: l(
        `Participe o sinistro o mais cedo possível, dentro do prazo fixado nas condições da apólice, e tome as medidas ao seu alcance para limitar os danos; não repare nem abandone os bens antes da peritagem sem acordo da seguradora (${cite('finSinistro')}).`,
        'Report the loss as soon as possible, within the period in the policy, and limit the damage; do not repair or discard items before inspection without the insurer’s consent.',
      ),
    });
    if (v.ramo === 'roubo' && !s(v.autoridade)) w.push({ level: 'info', field: 'autoridade', message: l('Em caso de roubo, a seguradora exige a participação à polícia: indique o número do auto.', 'For theft, the insurer requires a police report.') });
    return w;
  },

  personName: (v) => nomeCliente(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const P = 'cliente';
    const desc = linhas(v.descricao);
    const danos = linhas(v.danos);
    const test = lineItems(v.testemunhas).filter((r) => s(r.nome));
    const blocks: Block[] = [
      ...remetenteBlock(ctx, P),
      { type: 'reference', ref: s(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
      entidadeRecipient(v, 'seguradora'),
      { type: 'subject', text: `Participação de sinistro — ${RAMO_TEXTO[v.ramo] ?? 'seguro'} — apólice n.º ${s(v.apolice) || BLANK}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'participacao',
        text: `${sujeito(v, P)}, ${clienteF(v, P) ? 'tomadora' : 'tomador'} do seguro titulado pela apólice n.º ${s(v.apolice) || BLANK}, ${eu(v, P, 'participo', 'participa')} o sinistro ocorrido em ${dateLong(v.dataSinistro)}${s(v.horaSinistro) ? `, cerca das ${semPonto(v.horaSinistro)}` : ''}, ${contrair('em', semPonto(v.localSinistro) || BLANK)}, nos termos seguintes:`,
        en: 'The policyholder reports the incident below.',
        keepWithNext: true,
      },
    ];
    if (auto(v) && (s(v.viaturaMatricula) || s(v.condutorNome) || s(v.terceiroNome) || s(v.terceiroMatricula))) {
      blocks.push({
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Viatura segura', value: [s(v.viaturaMatricula), s(v.viaturaMarca)].filter(Boolean).join(' — ') || BLANK },
          { label: 'Condutor', value: [s(v.condutorNome), s(v.condutorCarta) ? `carta n.º ${s(v.condutorCarta)}` : ''].filter(Boolean).join(', ') || BLANK },
          { label: 'Terceiro', value: [s(v.terceiroNome), s(v.terceiroMatricula)].filter(Boolean).join(' — ') || '—' },
          { label: 'Seguradora do terceiro', value: [s(v.terceiroSeguradora), s(v.terceiroApolice) ? `apólice ${s(v.terceiroApolice)}` : ''].filter(Boolean).join(', ') || '—' },
        ],
      });
    }
    blocks.push(
      { type: 'heading', text: 'Circunstâncias' },
      { type: 'list', style: 'numeric', items: desc.length ? desc.map(endDot) : [BLANK] },
    );
    if (danos.length || money(v.valorEstimado) != null) {
      blocks.push({ type: 'heading', text: 'Danos' });
      if (danos.length) blocks.push({ type: 'list', style: 'bullet', items: danos.map(endDot) });
      if (money(v.valorEstimado) != null) blocks.push({ type: 'paragraph', id: 'valor', text: `Valor estimado dos prejuízos: **${moneyText(v.valorEstimado)}**, sujeito a apuramento na peritagem.`, en: 'Estimated loss, subject to assessment.' });
    }
    const outros: string[] = [];
    if (v.feridos) outros.push(`Houve feridos: ${semPonto(v.feridosDescricao) || BLANK}.`);
    if (s(v.autoridade)) outros.push(`Tomou conta da ocorrência: ${semPonto(v.autoridade)}.`);
    if (test.length) outros.push(`Testemunhas: ${test.map((r) => `${s(r.nome)}${s(r.contacto) ? ` (${s(r.contacto)})` : ''}`).join('; ')}.`);
    if (outros.length) blocks.push({ type: 'paragraph', id: 'outros', text: outros.join(' '), en: 'Injuries, authorities and witnesses.' });
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `${v.pedePeritagem ? `${eu(v, P, 'Solicito', 'Solicita')} a realização da peritagem${auto(v) && s(v.viaturaLocal) ? ` à viatura, que se encontra em ${semPonto(v.viaturaLocal)},` : ''} e a regularização do sinistro, com o pagamento da indemnização devida nos termos da apólice. ` : ''}${eu(v, P, 'Declaro', 'Declara')} que as informações prestadas são verdadeiras e ${eu(v, P, 'fico', 'fica')} ao dispor para prestar esclarecimentos através do telefone ${s(v.clienteTelefone) || BLANK}.`,
      en: 'Request for inspection and settlement; the information is true; contact details.',
    });
    blocks.push(...fechoCarta([assinaturaCliente(ctx, P, { m: 'O Tomador do Seguro', f: 'A Tomadora do Seguro', empresa: s(v.clienteEmpresaNome) || 'A Tomadora do Seguro' })], { anexos: anexosList(v), recibo: Boolean(v.recibo) }));
    return blocks;
  },
});
