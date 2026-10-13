// Pedido de declaração de residência: the resident asks the neighbourhood
// structure (Secretário do Bairro, Chefe do Quarteirão…) to issue the
// declaração/atestado de residência, which only that authority can sign.

import { formatMonthYear } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, l, lineItems, localField, placeDate, workerFields } from './_shared';
import { endDot, gx, identificacao, lowerFirst, pessoaFields, str } from './_pessoal-rh';

const DESTINATARIOS: Record<string, string> = {
  secretario: 'Secretário do Bairro',
  quarteirao: 'Chefe do Quarteirão',
  localidade: 'Chefe da Localidade',
};

function destinatario(v: Values): string {
  if (v.destinatario === 'outro') return str(v.destinatarioOutro) || BLANK;
  const cargo = DESTINATARIOS[v.destinatario] ?? DESTINATARIOS.secretario;
  if (v.destinatario === 'quarteirao') return `${cargo} n.º ${str(v.quarteirao) || BLANK} do Bairro ${str(v.bairro) || BLANK}`;
  if (v.destinatario === 'localidade') return `${cargo} de ${str(v.bairro) || BLANK}`;
  return `${cargo} ${str(v.bairro) ? `de ${str(v.bairro)}` : BLANK}`;
}

export default defineTemplate({
  id: 'pedido-declaracao-residencia',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'requerente', title: l('Requerente', 'Applicant'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'residencia', title: l('Residência', 'Residence') },
    { id: 'pedido', title: l('Pedido', 'Request') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    {
      name: 'destinatario',
      type: 'select',
      section: 'destinatario',
      label: l('Destinatário', 'Addressee'),
      default: 'secretario',
      options: [
        { value: 'secretario', label: l('Secretário do Bairro', 'Neighbourhood secretary') },
        { value: 'quarteirao', label: l('Chefe do Quarteirão', 'Block chief') },
        { value: 'localidade', label: l('Chefe da Localidade', 'Locality chief') },
        { value: 'outro', label: l('Outro', 'Other') },
      ],
      help: l('Na cidade, em regra o Secretário do Bairro. Confirme no local quem emite a declaração.', 'In towns, usually the neighbourhood secretary. Check locally who issues it.'),
    },
    { name: 'destinatarioOutro', type: 'text', section: 'destinatario', label: l('Cargo e entidade', 'Position and body'), showIf: (v) => v.destinatario === 'outro', placeholder: l('Ex.: Chefe do Posto Administrativo de Infulene', 'E.g. head of the administrative post') },
    ...pessoaFields('requerente', 'requerente', { profile: true, keys: ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal'] }),
    { name: 'requerenteProfissao', type: 'text', section: 'requerente', width: 'half', label: l('Profissão', 'Occupation'), personKey: 'cargo', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.profissao || '' : '') },
    ...workerFields(['telefone'], 'requerente', 'requerente').map((f) => ({ ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.telefones || '' : '') })),
    { name: 'bairro', type: 'text', section: 'residencia', width: 'half', required: true, label: l('Bairro', 'Neighbourhood'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.morada?.bairro || '' : '') },
    { name: 'quarteirao', type: 'text', section: 'residencia', width: 'half', label: l('Quarteirão n.º', 'Block no.') },
    { name: 'rua', type: 'text', section: 'residencia', width: 'half', label: l('Rua / Avenida', 'Street'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.morada?.rua || '' : '') },
    { name: 'casaNumero', type: 'text', section: 'residencia', width: 'half', label: l('Casa n.º', 'House no.'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.morada?.numero || '' : '') },
    { name: 'cidade', type: 'text', section: 'residencia', width: 'half', label: l('Cidade / Distrito', 'City / District'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.morada?.cidade || '' : 'Maputo') },
    { name: 'desde', type: 'month', section: 'residencia', width: 'half', label: l('Reside no bairro desde', 'Living here since') },
    {
      name: 'agregado',
      type: 'lines',
      section: 'residencia',
      label: l('Agregado familiar (opcional)', 'Household (optional)'),
      addLabel: l('Adicionar pessoa', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'parentesco', type: 'text', label: l('Parentesco', 'Relationship') },
      ],
      default: [],
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'pedido',
      required: true,
      label: l('Para que serve a declaração', 'What the certificate is for'),
      placeholder: l('Ex.: abertura de conta bancária; matrícula escolar; emissão do Bilhete de Identidade', 'E.g. opening a bank account; school enrolment; ID card'),
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'pedido',
      label: l('Documentos que junta', 'Enclosed documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [{ descricao: 'Cópia do Bilhete de Identidade' }],
    },
    localField('documento'),
    dateField('data'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A declaração é emitida e assinada pela estrutura do bairro, em impresso próprio e com carimbo; este documento é o pedido. O formato e a taxa variam por bairro e município (${cite('declaracaoResidencia')}).`,
          'The certificate is issued and signed by the neighbourhood structure on its own form with a stamp; this document is the request. Format and fee vary locally.',
        ),
      },
    ];
    if (!str(v.bairro)) w.push({ level: 'warning', field: 'bairro', message: l('Indique o bairro.', 'Enter the neighbourhood.') });
    if (!str(v.requerenteDocNumero)) w.push({ level: 'warning', field: 'requerenteDocNumero', message: l('Falta o número do documento de identificação.', 'The ID number is missing.') });
    if (/eleitor|recenseamento/i.test(String(v.finalidade ?? ''))) {
      w.push({
        level: 'info',
        field: 'finalidade',
        message: l('O atestado de residência não consta da lista de documentos exigidos para o recenseamento eleitoral.', 'Proof of residence is not on the list of documents required for voter registration.'),
      });
    }
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const morada = [
      str(v.rua),
      str(v.casaNumero) ? `casa n.º ${str(v.casaNumero)}` : '',
      str(v.quarteirao) ? `Quarteirão n.º ${str(v.quarteirao)}` : '',
      `Bairro ${str(v.bairro) || BLANK}`,
      str(v.cidade),
    ]
      .filter(Boolean)
      .join(', ');
    const desde = v.desde ? `, onde reside desde ${formatMonthYear(`${v.desde}-01`)}` : '';
    const prof = str(v.requerenteProfissao) ? `, de profissão ${lowerFirst(str(v.requerenteProfissao))}` : '';
    const tel = str(v.requerenteTelefone) ? `, contacto ${str(v.requerenteTelefone)}` : '';
    const agregado = lineItems(v.agregado).filter((r) => str(r.nome));
    const anexos = lineItems(v.anexos).map((r) => str(r.descricao)).filter(Boolean);
    const blocks: Block[] = [
      { type: 'spacer', size: 'large' },
      { type: 'recipient', salutation: 'Exmo. Senhor', lines: [destinatario(v), str(v.cidade).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: 'Pedido de declaração de residência' },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${identificacao(v, 'requerente', { morada: false, nuit: false })}${prof}, residente em ${morada}${desde}${tel}, vem, mui respeitosamente, requerer a V. Ex.ª se digne emitir declaração de residência, que se destina a ${endDot(lowerFirst(str(v.finalidade) || BLANK))}`,
        en: `The applicant, identified above and living at the stated address, respectfully asks for a proof-of-residence certificate, to be used for: ${v.finalidade || '—'}.`,
      },
    ];
    if (agregado.length) {
      blocks.push(
        { type: 'paragraph', id: 'agregado', text: `O agregado familiar ${gx(v.requerenteGenero, 'do requerente', 'da requerente')} é composto por:`, en: 'The household consists of:' },
        { type: 'list', style: 'bullet', items: agregado.map((r) => `${str(r.nome)}${str(r.parentesco) ? ` (${str(r.parentesco)})` : ''}`) },
      );
    }
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Junta:', items: anexos });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', en: 'Requests approval.', align: 'center', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [{ role: gx(v.requerenteGenero, 'O Requerente', 'A Requerente'), name: str(v.requerenteNome) || undefined }],
      },
    );
    return blocks;
  },
});
