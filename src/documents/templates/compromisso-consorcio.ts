// Declaração de compromisso de constituição de consórcio: companies bidding
// together undertake to form a consortium if awarded, name the leader, share
// the work and accept joint and several liability. The consortium contract
// itself is `contrato-de-consorcio`.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems } from './_shared';
import { daEntidade, procedimentoCompleto, procedimentoFields, procedimentoNome, semPonto, str } from './_contratacao';

type Membro = { nome: string; nuit: string; sede: string; rep: string; cargo: string; quota: string; parte: string };

function membros(v: Record<string, unknown>): Membro[] {
  return lineItems(v.membros)
    .map((r) => ({ nome: str(r.nome), nuit: str(r.nuit), sede: str(r.sede), rep: str(r.rep), cargo: str(r.cargo), quota: str(r.quota), parte: str(r.parte) }))
    .filter((m) => m.nome || m.rep);
}

export default defineTemplate({
  id: 'compromisso-consorcio',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'procedimento', title: l('Concurso', 'Tender') },
    { id: 'membros', title: l('Empresas do consórcio', 'Consortium members') },
    { id: 'consorcio', title: l('Consórcio', 'Consortium') },
  ],
  fields: [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'entidadeNome', type: 'text', section: 'procedimento', required: true, label: l('Entidade contratante', 'Contracting body') },
    ...procedimentoFields(),
    {
      name: 'membros',
      type: 'lines',
      section: 'membros',
      label: l('Membros (o primeiro é o líder)', 'Members (the first is the leader)'),
      addLabel: l('Adicionar empresa', 'Add company'),
      columns: [
        { name: 'nome', type: 'text', label: l('Denominação', 'Company name') },
        { name: 'nuit', type: 'text', label: l('NUIT', 'NUIT') },
        { name: 'sede', type: 'text', label: l('Sede', 'Registered office') },
        { name: 'rep', type: 'text', label: l('Representante', 'Representative') },
        { name: 'cargo', type: 'text', label: l('Qualidade do representante', 'Capacity') },
        { name: 'quota', type: 'number', label: l('Participação (%)', 'Share (%)') },
        { name: 'parte', type: 'text', label: l('Parte dos trabalhos a cargo', 'Share of the work') },
      ],
      default: (c) => [
        {
          nome: c.profile?.kind === 'empresa' ? c.profile.firma ?? '' : '',
          nuit: c.profile?.nuit ?? '',
          sede: [c.profile?.morada?.rua, c.profile?.morada?.numero, c.profile?.morada?.cidade].filter(Boolean).join(', '),
          rep: c.profile?.representanteNome ?? '',
          cargo: c.profile?.representanteCargo ?? '',
          quota: '',
          parte: '',
        },
        { nome: '', nuit: '', sede: '', rep: '', cargo: '', quota: '', parte: '' },
      ],
    },
    { name: 'nomeConsorcio', type: 'text', section: 'consorcio', width: 'half', label: l('Denominação do consórcio (opcional)', 'Consortium name (optional)'), placeholder: l('Ex.: Consórcio Machava–Sitoe', 'E.g. Machava–Sitoe Consortium') },
    {
      name: 'tipo',
      type: 'radio',
      section: 'consorcio',
      width: 'half',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'externo', label: l('Externo', 'External') },
        { value: 'interno', label: l('Interno', 'Internal') },
      ],
      default: 'externo',
      help: l('No consórcio externo, os membros actuam perante a entidade contratante em nome do consórcio — é o caso normal nos concursos.', 'In an external consortium, members act towards the contracting body in the consortium’s name — the usual case in tenders.'),
    },
  ],

  warnings: (v) => {
    const ms = membros(v);
    const w: Warning[] = [];
    if (ms.length < 2) w.push({ level: 'error', field: 'membros', message: l('Indique pelo menos duas empresas.', 'Enter at least two companies.') });
    const soma = ms.reduce((s, m) => s + (Number(m.quota) || 0), 0);
    if (ms.some((m) => m.quota) && Math.abs(soma - 100) > 0.01) w.push({ level: 'warning', field: 'membros', message: l(`As participações somam ${soma}%; devem somar cem por cento.`, `Shares add up to ${soma}%; they must add up to one hundred per cent.`) });
    if (ms.some((m) => !m.rep)) w.push({ level: 'warning', field: 'membros', message: l('Indique quem assina por cada empresa.', 'Enter who signs for each company.') });
    w.push({
      level: 'info',
      message: l(
        `Se o consórcio for adjudicatário, celebrem o contrato de consórcio, com as assinaturas reconhecidas, antes da assinatura do contrato público (${cite('ctConsorcio')}). Cada membro entrega os seus próprios documentos de qualificação.`,
        'If the consortium wins, sign the consortium contract, with certified signatures, before signing the public contract. Each member provides its own qualification documents.',
      ),
    });
    return w;
  },

  personName: (v) => v.nomeConsorcio || v.entidadeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ms = membros(v);
    const list = ms.length ? ms : [{ nome: '', nuit: '', sede: '', rep: '', cargo: '', quota: '', parte: '' }, { nome: '', nuit: '', sede: '', rep: '', cargo: '', quota: '', parte: '' }];
    const ident = list.map(
      (m) => `**${m.nome || BLANK}**, com sede em ${semPonto(m.sede) || BLANK}, NUIT ${m.nuit || BLANK}, representada por ${m.rep || BLANK}${m.cargo ? `, na qualidade de ${m.cargo}` : ''};`,
    );
    const nome = semPonto(v.nomeConsorcio);
    const lider = list[0]?.nome || BLANK;
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de compromisso de constituição de consórcio', subtitle: procedimentoNome(v) },
      { type: 'paragraph', id: 'abertura', text: 'As sociedades abaixo identificadas:', en: 'The companies identified below:' },
      { type: 'list', style: 'numeric', items: ident },
      {
        type: 'paragraph',
        id: 'compromisso',
        text: `declaram, para os efeitos do ${procedimentoCompleto(v)}, lançado ${daEntidade(str(v.entidadeNome))}, que apresentam proposta conjunta e que, em caso de adjudicação, se comprometem a constituir-se em consórcio ${v.tipo === 'interno' ? 'interno' : 'externo'}${nome ? `, denominado **${nome}**,` : ''} antes da assinatura do contrato, nos termos seguintes:`,
        en: 'declare that they bid jointly and, if awarded, undertake to form a consortium before signing the contract, on the following terms:',
      },
      {
        type: 'list',
        style: 'alpha',
        items: [
          `a ${lider} é o membro líder do consórcio, com poderes para representar todos os membros perante a entidade contratante, assinar a proposta e os documentos do procedimento e receber as notificações e os pagamentos;`,
          'os membros respondem solidariamente perante a entidade contratante pela manutenção da proposta e pelo cumprimento integral do contrato;',
          'a participação e a parte dos trabalhos de cada membro são as indicadas no quadro seguinte, não podendo ser alteradas sem autorização da entidade contratante;',
          'nenhum dos membros apresenta, isoladamente ou integrado noutro agrupamento, outra proposta no mesmo procedimento;',
          'o consórcio mantém-se até ao cumprimento integral das obrigações contratuais, incluindo as de garantia.',
        ],
      },
      {
        type: 'table',
        columns: [
          { label: 'Membro', width: 2.6 },
          { label: 'Participação', width: 1, align: 'right' },
          { label: 'Parte dos trabalhos', width: 3 },
        ],
        rows: list.map((m, i) => [`${m.nome || BLANK}${i === 0 ? ' (líder)' : ''}`, m.quota ? `${m.quota.replace('.', ',')}%` : '', m.parte]),
      },
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'left', keepWithNext: true, en: 'Place and date.' },
    ];
    const cols: SignatureColumn[] = list.map((m, i) => ({ role: i === 0 ? 'Pelo membro líder' : 'Pelo membro', name: m.rep || undefined, detail: [m.cargo, m.nome].filter(Boolean).join(', ') || undefined, image: i === 0 && ctx.profile?.kind === 'empresa' ? 'both' : undefined }));
    for (let i = 0; i < cols.length; i += 2) blocks.push({ type: 'signatures', columns: cols.slice(i, i + 2), keepWithNext: i + 2 < cols.length });
    return blocks;
  },
});
