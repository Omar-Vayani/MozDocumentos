// Pedido de cópia do processo clínico: a patient (or parent, heir or attorney)
// asks the health facility for a copy of the clinical file, a report or test
// results. Written by the individual, so no letterhead.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, DOC_TIPO_OPTIONS, exmo, GENERO_OPTIONS, isF, l, localField, placeDate } from './_shared';
import { patientFields } from './_saude';
import { or, semPonto, str } from './_saude-educacao';

const QUALIDADE_OPTIONS = [
  { value: 'proprio', label: l('O próprio doente', 'The patient') },
  { value: 'pais', label: l('Pai, mãe ou tutor de doente menor', 'Parent or guardian of a minor') },
  { value: 'herdeiro', label: l('Familiar de doente falecido', 'Relative of a deceased patient') },
  { value: 'mandatario', label: l('Mandatário com procuração', 'Attorney with power of attorney') },
];

const PEDIDOS = [
  { name: 'pCopia', pt: 'cópia integral do processo clínico', en: 'full copy of the clinical file', def: true },
  { name: 'pRelatorio', pt: 'relatório médico', en: 'medical report', def: false },
  { name: 'pExames', pt: 'cópia dos resultados de análises e exames, incluindo imagens', en: 'copy of test results and images', def: true },
  { name: 'pAlta', pt: 'nota de alta e relatório operatório', en: 'discharge note and operative report', def: false },
];

export default defineTemplate({
  id: 'pedido-copia-processo-clinico',
  family: 'carta',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('Unidade sanitária', 'Health facility') },
    { id: 'requerente', title: l('Quem pede', 'Requester'), personRole: 'outro' },
    { id: 'doente', title: l('Doente (se não for o requerente)', 'Patient (if not the requester)') },
    { id: 'pedido', title: l('O que pede', 'Request') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'destCargo', type: 'text', section: 'destinatario', width: 'half', label: l('Cargo do destinatário', 'Addressee’s position'), default: 'Director Clínico' },
    { name: 'destGenero', type: 'radio', section: 'destinatario', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'unidade', type: 'text', section: 'destinatario', required: true, label: l('Unidade sanitária', 'Health facility'), placeholder: l('Ex.: Hospital Privado de Maputo', 'E.g. the hospital’s name') },
    { name: 'unidadeMorada', type: 'text', section: 'destinatario', label: l('Endereço (opcional)', 'Address (optional)') },
    ...patientFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone'], 'requerente', 'req').map((f) =>
      f.name === 'reqNome' ? { ...f, default: (c: { profile: any }) => (c.profile?.kind === 'pessoa' ? c.profile.nome : '') } : f,
    ),
    { name: 'reqEmail', type: 'email', section: 'requerente', width: 'half', label: l('Email (opcional)', 'Email (optional)') },
    { name: 'qualidade', type: 'select', section: 'requerente', label: l('Pede na qualidade de', 'Requesting as'), options: QUALIDADE_OPTIONS, default: 'proprio' },
    { name: 'doenteNome', type: 'text', section: 'doente', label: l('Nome do doente', 'Patient’s name'), showIf: (v) => v.qualidade !== 'proprio' },
    { name: 'doenteGenero', type: 'radio', section: 'doente', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.qualidade !== 'proprio' },
    { name: 'parentesco', type: 'text', section: 'doente', width: 'half', label: l('Parentesco', 'Relationship'), placeholder: l('Ex.: filho, cônjuge', 'E.g. son, spouse'), showIf: (v) => v.qualidade === 'pais' || v.qualidade === 'herdeiro' },
    { name: 'doenteDocTipo', type: 'select', section: 'doente', width: 'half', label: l('Documento do doente', 'Patient’s ID'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => v.qualidade !== 'proprio' },
    { name: 'doenteDocNumero', type: 'text', section: 'doente', width: 'half', label: l('Número', 'Number'), showIf: (v) => v.qualidade !== 'proprio' },
    { name: 'dataObito', type: 'date', section: 'doente', width: 'half', label: l('Data do óbito', 'Date of death'), showIf: (v) => v.qualidade === 'herdeiro' },
    { name: 'processo', type: 'text', section: 'pedido', width: 'half', label: l('N.º de processo clínico (se souber)', 'Clinical file number (if known)') },
    { name: 'periodo', type: 'text', section: 'pedido', width: 'half', label: l('Período dos cuidados', 'Period of care'), placeholder: l('Ex.: internamento de Março de 2026', 'E.g. admission in March 2026') },
    ...PEDIDOS.map((p) => ({ name: p.name, type: 'toggle' as const, section: 'pedido', label: l(p.pt.charAt(0).toUpperCase() + p.pt.slice(1), p.en), default: p.def })),
    { name: 'finalidade', type: 'text', section: 'pedido', label: l('Finalidade (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: continuar o tratamento no estrangeiro', 'E.g. continuing treatment abroad') },
    {
      name: 'entrega',
      type: 'radio',
      section: 'pedido',
      label: l('Entrega', 'Delivery'),
      options: [
        { value: 'mao', label: l('Levantamento em mão', 'Collect in person') },
        { value: 'email', label: l('Por email', 'By email') },
      ],
      default: 'mao',
    },
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!PEDIDOS.some((p) => v[p.name])) w.push({ level: 'error', field: 'pCopia', message: l('Escolha o que pede.', 'Choose what you are asking for.') });
    if (v.qualidade === 'mandatario') w.push({ level: 'info', message: l('Junte a procuração com poderes para pedir informação clínica.', 'Attach the power of attorney.') });
    if (v.qualidade === 'herdeiro') w.push({ level: 'info', message: l('Junte a certidão de óbito e um documento que prove o parentesco.', 'Attach the death certificate and proof of relationship.') });
    w.push({ level: 'info', message: l(`O doente tem direito a aceder à informação do seu processo (${cite('seAcessoProcessoClinico')}). A unidade pode cobrar o custo das cópias.`, 'Patients may access their clinical file; the facility may charge for copies.') });
    return w;
  },

  personName: (v) => v.reqNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.reqGenero);
    const q = str(v.qualidade) || 'proprio';
    const fd = isF(v.doenteGenero);
    const doc = str(v.reqDocNumero) ? `, ${f ? 'portadora' : 'portador'} do ${str(v.reqDocTipo) || 'BI'} n.º ${str(v.reqDocNumero)}` : '';
    const mor = str(v.reqMorada) ? `, residente em ${semPonto(v.reqMorada)}` : '';
    const contacto = [str(v.reqTelefone) ? `telefone ${str(v.reqTelefone)}` : '', str(v.reqEmail)].filter(Boolean).join(', ');
    const doenteDoc = str(v.doenteDocNumero) ? `, ${fd ? 'portadora' : 'portador'} do ${str(v.doenteDocTipo) || 'BI'} n.º ${str(v.doenteDocNumero)}` : '';
    const qual =
      q === 'pais'
        ? `, na qualidade de ${str(v.parentesco) || 'representante legal'} ${fd ? 'da menor' : 'do menor'} **${or(v.doenteNome)}**${doenteDoc}`
        : q === 'herdeiro'
          ? `, na qualidade de ${str(v.parentesco) || 'familiar'} ${fd ? 'da falecida' : 'do falecido'} **${or(v.doenteNome)}**${doenteDoc}${str(v.dataObito) ? `, falecid${fd ? 'a' : 'o'} em ${dateLong(v.dataObito)}` : ''}`
          : q === 'mandatario'
            ? `, na qualidade de mandatári${f ? 'a' : 'o'} de **${or(v.doenteNome)}**${doenteDoc}, conforme procuração junta`
            : '';
    const pedidos = PEDIDOS.filter((p) => v[p.name]).map((p) => p.pt);
    const proc = [str(v.processo) ? `processo clínico n.º ${str(v.processo)}` : '', str(v.periodo) ? `relativos a ${semPonto(v.periodo)}` : ''].filter(Boolean).join(', ');
    const sujeito = q === 'proprio' ? 'que me diz respeito' : q === 'pais' ? `${fd ? 'da minha educanda' : 'do meu educando'}` : `${fd ? 'da doente' : 'do doente'}`;
    const annex = ['Cópia do documento de identificação do requerente'];
    if (q === 'pais') annex.push('Cópia da cédula, assento ou certidão de nascimento do menor');
    if (q === 'herdeiro') annex.push('Certidão de óbito', 'Documento comprovativo do parentesco');
    if (q === 'mandatario') annex.push('Procuração');
    const blocks: Block[] = [
      { type: 'recipient', salutation: undefined, lines: [`${exmo(v.destGenero)} ${str(v.destCargo) || 'Director Clínico'}`, or(v.unidade), ...(str(v.unidadeMorada) ? [str(v.unidadeMorada)] : [])] },
      { type: 'subject', text: 'Pedido de cópia do processo clínico' },
      { type: 'salutation', text: `${exmo(v.destGenero)},` },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `Eu, **${or(v.reqNome)}**${doc}${mor}${qual}, venho requerer a V. Ex.ª que me seja facultada a informação clínica ${sujeito}${proc ? ` (${proc})` : ''}, designadamente:`,
        en: `${v.reqNome || '___'} asks for the clinical information listed below.`,
      },
      { type: 'list', style: 'alpha', items: pedidos.length ? pedidos.map((p, i) => `${p}${i === pedidos.length - 1 ? '.' : ';'}`) : ['____________________'] },
    ];
    if (str(v.finalidade)) {
      blocks.push({ type: 'paragraph', id: 'finalidade', text: `A informação destina-se a ${semPonto(v.finalidade).replace(/^(a|para)\s+/i, '')}.`, en: `Purpose: ${v.finalidade}.` });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'entrega',
        text:
          v.entrega === 'email'
            ? `Solicito que a informação me seja enviada para o endereço electrónico ${or(v.reqEmail)}, ficando disponível para a levantar pessoalmente se não for possível o envio.${contacto ? ` Contacto: ${contacto}.` : ''}`
            : `Proponho-me levantar pessoalmente os documentos, mediante apresentação do documento de identificação, e pagar o custo das cópias, se houver.${contacto ? ` Contacto: ${contacto}.` : ''}`,
        en: v.entrega === 'email' ? 'Please send it by email.' : 'I will collect it in person and pay the copying cost, if any.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [{ role: f ? 'A Requerente' : 'O Requerente', name: str(v.reqNome) || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined }] },
      { type: 'annexList', items: annex },
    );
    return blocks;
  },
});
