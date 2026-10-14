import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, GENERO_OPTIONS, cite, dateField, isF, l, lawyerFields, lawyerSignature, localField, placeDate } from './_shared';

export default defineTemplate({
  id: 'substabelecimento',
  family: 'declaracao',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'advogado', title: l('Advogado que substabelece', 'Lawyer delegating') },
    { id: 'substabelecido', title: l('Advogado que recebe os poderes', 'Lawyer receiving the powers') },
    { id: 'mandato', title: l('Mandato e poderes', 'Mandate and powers') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...lawyerFields('advogado'),
    { name: 'substNome', type: 'text', section: 'substabelecido', width: 'half', required: true, label: l('Nome', 'Name') },
    { name: 'substGenero', type: 'radio', section: 'substabelecido', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'substCarteira', type: 'text', section: 'substabelecido', width: 'half', required: true, label: l('Carteira profissional (OAM) n.º', 'Bar card no. (OAM)') },
    { name: 'substDomicilio', type: 'text', section: 'substabelecido', width: 'half', label: l('Domicílio profissional (opcional)', 'Office address (optional)') },
    {
      name: 'reserva',
      type: 'radio',
      section: 'mandato',
      label: l('Tipo de substabelecimento', 'Type of delegation'),
      default: 'com',
      options: [
        { value: 'com', label: l('Com reserva (continuo também mandatário)', 'With reservation (I remain counsel too)') },
        { value: 'sem', label: l('Sem reserva (deixo de ser mandatário)', 'Without reservation (I step down)') },
      ],
    },
    { name: 'constituinte', type: 'text', section: 'mandato', required: true, label: l('Cliente (constituinte)', 'Client'), help: l('Quem passou a procuração original.', 'Who signed the original power of attorney.') },
    { name: 'processoNumero', type: 'text', section: 'mandato', width: 'half', label: l('Processo n.º (opcional)', 'Case no. (optional)') },
    { name: 'tribunal', type: 'text', section: 'mandato', width: 'half', label: l('Tribunal (opcional)', 'Court (optional)'), placeholder: l('Ex.: 2.ª Secção Cível do Tribunal Judicial da Cidade de Maputo', 'E.g. Maputo City Court') },
    {
      name: 'poderes',
      type: 'select',
      section: 'mandato',
      label: l('Poderes substabelecidos', 'Powers delegated'),
      default: 'todos',
      options: [
        { value: 'todos', label: l('Todos os poderes recebidos', 'All powers received') },
        { value: 'gerais', label: l('Só os poderes forenses gerais', 'General litigation powers only') },
        { value: 'acto', label: l('Só para um acto', 'For one act only') },
      ],
    },
    { name: 'acto', type: 'text', section: 'mandato', label: l('Acto', 'Act'), placeholder: l('Ex.: assistir à audiência de julgamento de 20 de Outubro de 2026', 'E.g. attend the hearing on 20 October 2026'), showIf: (v) => v.poderes === 'acto' },
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Só pode substabelecer se a procuração o permitir (${cite('advSubstabelecimento')}). Junte o substabelecimento ao processo por requerimento.`,
          'You may only delegate if the power of attorney allows it. File it in the case with an application.',
        ),
      },
    ];
    if (v.reserva === 'sem') {
      w.push({ level: 'info', field: 'reserva', message: l('Sem reserva, deixa de representar o cliente neste mandato. Informe o cliente.', 'Without reservation you no longer represent the client. Inform the client.') });
    }
    return w;
  },

  personName: (v) => v.constituinte,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.advogadoGenero);
    const fs = isF(v.substGenero);
    const processo = [
      String(v.processoNumero ?? '').trim() ? `no âmbito do processo n.º ${String(v.processoNumero).trim()}` : '',
      String(v.tribunal ?? '').trim() ? `que corre termos ${/^\d|^sec/i.test(String(v.tribunal).trim()) ? 'na' : 'no'} ${String(v.tribunal).trim()}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const poderes =
      v.poderes === 'gerais'
        ? 'os poderes forenses gerais'
        : v.poderes === 'acto'
          ? `os poderes necessários para ${String(v.acto ?? '').trim().replace(/[.;]$/, '') || BLANK}`
          : 'todos os poderes';
    const blocks: Block[] = [
      { type: 'title', text: 'Substabelecimento' },
      {
        type: 'paragraph',
        id: 'texto',
        text: `**${String(v.advogadoNome ?? '').trim() || BLANK}**, ${f ? 'Advogada' : 'Advogado'}, titular da Carteira Profissional n.º ${String(v.advogadoCarteira ?? '').trim() || '________'} da Ordem dos Advogados de Moçambique, com escritório em ${String(v.advogadoDomicilio ?? '').trim() || BLANK}, substabelece, **${v.reserva === 'sem' ? 'sem reserva' : 'com reserva'}**, ${fs ? 'na Senhora Dra.' : 'no Senhor Dr.'} **${String(v.substNome ?? '').trim() || BLANK}**, ${fs ? 'Advogada' : 'Advogado'}, titular da Carteira Profissional n.º ${String(v.substCarteira ?? '').trim() || '________'} da mesma Ordem${String(v.substDomicilio ?? '').trim() ? `, com escritório em ${String(v.substDomicilio).trim()}` : ''}, ${poderes} que lhe foram conferidos por **${String(v.constituinte ?? '').trim() || BLANK}**${processo ? `, ${processo}` : ''}.`,
        en: 'The lawyer named above delegates to the colleague named above, with or without reservation, the powers received from the client.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] },
    ];
    return blocks;
  },
});
