// Convocatória da assembleia de condóminos: notice of the ordinary (accounts
// and budget) or extraordinary owners' meeting, with agenda, second call and
// a proxy slip. Sent by registered letter with the legal notice period.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateLong, exmo, GENERO_OPTIONS, l, refField, splitLines } from './_shared';
import { semPonto, str } from './_contratos';
import { administradorColumn, condominioFields, edificio, hora } from './_construcao';

const ORDEM_ORDINARIA = [
  'Apreciação e votação das contas do exercício anterior',
  'Apreciação e votação do orçamento para o ano em curso e fixação das quotas',
  'Fixação da contribuição para o fundo comum de reserva',
  'Eleição do administrador e da comissão de moradores',
  'Outros assuntos de interesse do condomínio (apenas informativos)',
].join('\n');

export default defineTemplate({
  id: 'convocatoria-assembleia-condominos',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Convocatória', 'Notice') },
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
  ],
  fields: [
    refField(),
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data de envio', 'Date sent'), default: (c) => c.today },
    ...condominioFields('documento'),
    {
      name: 'convocante',
      type: 'radio',
      section: 'documento',
      label: l('Quem convoca', 'Called by'),
      options: [
        { value: 'administrador', label: l('O administrador', 'The administrator') },
        { value: 'condominos', label: l('Condóminos (pedido de reunião extraordinária)', 'Owners (request for an extraordinary meeting)') },
      ],
      default: 'administrador',
    },
    { name: 'convocantesNomes', type: 'text', section: 'documento', label: l('Condóminos que convocam e fracções', 'Owners calling and their units'), showIf: (v) => v.convocante === 'condominos' },

    { name: 'circular', type: 'toggle', section: 'destinatario', default: true, label: l('Para todos os condóminos (aviso geral)', 'To all owners (general notice)') },
    { name: 'destinatarioNome', type: 'text', section: 'destinatario', width: 'half', label: l('Condómino', 'Owner'), showIf: (v) => !v.circular },
    { name: 'destinatarioGenero', type: 'radio', section: 'destinatario', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => !v.circular },
    { name: 'destinatarioFraccao', type: 'text', section: 'destinatario', width: 'half', label: l('Fracção', 'Unit'), showIf: (v) => !v.circular },
    {
      name: 'envio',
      type: 'radio',
      section: 'destinatario',
      label: l('Meio de envio', 'Sent by'),
      options: [
        { value: 'registada', label: l('Carta registada', 'Registered letter') },
        { value: 'mao', label: l('Entrega em mão contra assinatura', 'By hand against signature') },
        { value: 'email', label: l('Email (com acordo escrito dos condóminos)', 'Email (with owners’ written agreement)') },
      ],
      default: 'registada',
    },

    {
      name: 'tipo',
      type: 'radio',
      section: 'reuniao',
      required: true,
      label: l('Assembleia', 'Meeting'),
      options: [
        { value: 'ordinaria', label: l('Ordinária (contas e orçamento)', 'Ordinary (accounts and budget)') },
        { value: 'extraordinaria', label: l('Extraordinária', 'Extraordinary') },
      ],
      default: 'ordinaria',
    },
    { name: 'dataAssembleia', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data da assembleia', 'Meeting date') },
    { name: 'horaAssembleia', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora', 'Time'), placeholder: l('Ex.: 18:00', 'E.g. 18:00') },
    { name: 'localAssembleia', type: 'text', section: 'reuniao', required: true, label: l('Local da reunião', 'Meeting place'), default: 'na sala de condomínio do edifício' },
    { name: 'ordemTrabalhos', type: 'textarea', section: 'reuniao', required: true, rows: 5, default: ORDEM_ORDINARIA, label: l('Ordem de trabalhos (um ponto por linha)', 'Agenda (one item per line)') },
    { name: 'segundaConvocatoria', type: 'toggle', section: 'reuniao', default: true, label: l('Indicar segunda convocatória', 'State a second call') },
    { name: 'data2', type: 'date', section: 'reuniao', width: 'half', label: l('Data da 2.ª convocatória', 'Second call date'), showIf: (v) => Boolean(v.segundaConvocatoria) },
    { name: 'hora2', type: 'text', section: 'reuniao', width: 'half', label: l('Hora da 2.ª convocatória', 'Second call time'), showIf: (v) => Boolean(v.segundaConvocatoria) },
    { name: 'documentos', type: 'text', section: 'reuniao', label: l('Documentos para consulta', 'Documents available'), default: 'estão disponíveis para consulta junto do administrador' },
    { name: 'procuracao', type: 'toggle', section: 'reuniao', default: true, label: l('Incluir minuta de procuração (destacável)', 'Include a proxy slip (tear-off)') },
  ],

  warnings: (v, { legal }) => {
    const w: Warning[] = [];
    const ant = legal.value<{ antecedenciaDias: number }>('condominioConvocatoria').antecedenciaDias;
    if (v.data && v.dataAssembleia) {
      const d = diffDays(String(v.data), String(v.dataAssembleia));
      if (Number.isFinite(d) && d < ant) {
        w.push({ level: 'error', field: 'dataAssembleia', message: l(`A convocatória deve ser enviada com ${ant} dias de antecedência (${cite('condominioConvocatoria')}). Faltam ${d} dias.`, `The notice must be sent ${ant} days before the meeting. There are ${d} days left.`) });
      }
    }
    if (v.envio !== 'registada') {
      w.push({ level: 'warning', field: 'envio', message: l('A lei prevê o envio por carta registada. Outro meio só é seguro se todos os condóminos o tiverem aceitado por escrito; guarde prova da recepção.', 'The law requires a registered letter. Any other way is safe only if all owners agreed in writing; keep proof of receipt.') });
    }
    if (v.tipo === 'ordinaria' && v.dataAssembleia && !/-01-(0\d|1[0-5])$/.test(String(v.dataAssembleia))) {
      w.push({ level: 'info', field: 'dataAssembleia', message: l(`O Código Civil prevê a assembleia ordinária na primeira quinzena de Janeiro (${cite('condominioAssembleia')}); siga a data do seu regulamento, se for outra.`, 'The Civil Code places the ordinary meeting in the first half of January; follow your rules if they set another date.') });
    }
    if (v.convocante === 'condominos') {
      const p = legal.value<{ extraordinariaCapital: number }>('condominioAssembleia').extraordinariaCapital;
      w.push({ level: 'info', message: l(`Os condóminos só podem convocar se representarem pelo menos ${Math.round(p * 100)}% do capital (permilagem).`, `Owners may call a meeting only if they hold at least ${Math.round(p * 100)}% of the shares.`) });
    }
    return w;
  },

  personName: (v) => (v.circular ? v.edificioNome : v.destinatarioNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ed = edificio(v);
    const pontos = splitLines(v.ordemTrabalhos);
    const tipo = v.tipo === 'extraordinaria' ? 'Extraordinária' : 'Ordinária';
    const convoca = v.convocante === 'condominos' ? `Os condóminos ${semPonto(v.convocantesNomes) || BLANK}, nos termos da lei, convocam` : 'Nos termos do Código Civil e do Regulamento do Regime Jurídico do Condomínio, convoco';
    const blocks: Block[] = [
      { type: 'reference', ref: v.ref, place: ctx.place, date: dateLong(v.data) },
      v.circular
        ? { type: 'recipient', lines: [`Aos Senhores Condóminos do ${ed}`, semPonto(v.edificioMorada)].filter(Boolean) }
        : { type: 'recipient', salutation: exmo(v.destinatarioGenero), lines: [str(v.destinatarioNome) || BLANK, `Condómino da fracção ${str(v.destinatarioFraccao) || BLANK} do ${ed}`] },
      { type: 'subject', text: `Convocatória — Assembleia ${tipo} de Condóminos` },
      { type: 'salutation', text: v.circular ? 'Exmos. Senhores Condóminos,' : `${exmo(v.destinatarioGenero)},` },
      {
        type: 'paragraph',
        id: 'convocatoria',
        text: `${convoca} os Senhores Condóminos do ${ed}, sito em ${semPonto(v.edificioMorada) || BLANK}, para a **Assembleia ${tipo} de Condóminos**, a realizar no dia **${dateLong(v.dataAssembleia)}**, ${hora(v.horaAssembleia, 'pelas')}, ${semPonto(v.localAssembleia) || BLANK}, com a seguinte ordem de trabalhos:`,
        en: 'Notice of the owners’ meeting on the date, time and place stated, with the following agenda:',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: pontos.length ? pontos.map((p, i) => `${semPonto(p)}${i === pontos.length - 1 ? '.' : ';'}`) : [BLANK] },
    ];
    if (v.segundaConvocatoria) {
      blocks.push({
        type: 'paragraph',
        id: 'segunda',
        text: `Se à hora marcada não estiverem presentes ou representados condóminos que representem a maioria do valor do prédio, a assembleia reúne em segunda convocatória ${v.data2 ? `no dia ${dateLong(v.data2)}` : 'uma semana depois'}, ${str(v.hora2) ? hora(v.hora2, 'pelas') : 'à mesma hora'}, no mesmo local, deliberando então nos termos legais.`,
        en: 'If there is no quorum, a second meeting is held as stated and decides as provided by law.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'representacao', text: `Os condóminos podem fazer-se representar por procuração ou carta dirigida ao administrador. Os documentos relativos aos pontos da ordem de trabalhos ${semPonto(v.documentos) || 'estão disponíveis junto do administrador'}.`, en: 'Owners may be represented by proxy; documents are available.' },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Kind regards,', keepWithNext: true },
      { type: 'signatures', columns: [v.convocante === 'condominos' ? { role: 'Os Condóminos', name: str(v.convocantesNomes) || undefined } : administradorColumn(v, 'O Administrador')] },
    );
    if (!v.circular && v.envio === 'mao') blocks.push({ type: 'acknowledgement', text: 'Recebi em ___/___/______', signer: 'O(A) Condómino(a)' });
    if (v.procuracao) {
      blocks.push({
        type: 'box',
        cut: true,
        label: 'Procuração',
        text: `Eu, ____________________________________, condómino da fracção ______ do ${ed}, constituo meu representante ____________________________________, a quem confiro poderes para me representar e votar na Assembleia ${tipo} de Condóminos de ${dateLong(v.dataAssembleia)}, ou em segunda convocatória.\n\nData: ___/___/______          Assinatura: ______________________________`,
      });
    }
    return blocks;
  },
});
