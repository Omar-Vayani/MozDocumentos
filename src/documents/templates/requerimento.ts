import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerRep, g, isF, l, lineItems, localField, placeDate, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- local helpers

const PROFILE_GET: Record<string, (p: Profile) => unknown> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  Naturalidade: (p) => p.naturalidade,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  DocEmissao: (p) => p.docEmissao,
  DocLocal: (p) => p.docLocal,
  Nuit: (p) => p.nuit,
  Morada: (p) => addressLine(p),
  Telefone: (p) => p.telefones,
  Email: (p) => p.email,
};
function fromPessoaProfile(defs: FieldDef[], prefix: string): FieldDef[] {
  return defs.map((f) => {
    const get = PROFILE_GET[f.name.slice(prefix.length)];
    if (!get) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        if (c.profile?.kind === 'pessoa') {
          const val = get(c.profile);
          if (val) return val;
        }
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

const isEmpresa = (v: Values) => v.requerenteTipo === 'empresa';

const TRATAMENTO_OPTIONS = [
  { value: 'Exmo. Senhor', label: l('Exmo. Senhor', 'Exmo. Senhor (Dear Sir)') },
  { value: 'Exma. Senhora', label: l('Exma. Senhora', 'Exma. Senhora (Dear Madam)') },
  { value: 'Excelentíssimo Senhor', label: l('Excelentíssimo Senhor (mais solene)', 'Excelentíssimo Senhor (more formal)') },
  { value: 'Excelentíssima Senhora', label: l('Excelentíssima Senhora (mais solene)', 'Excelentíssima Senhora (more formal)') },
  { value: 'Sua Excelência o Senhor', label: l('Sua Excelência o Senhor (Ministro, Governador…)', 'His Excellency (Minister, Governor…)') },
  { value: 'Sua Excelência a Senhora', label: l('Sua Excelência a Senhora (Ministra, Governadora…)', 'Her Excellency (Minister, Governor…)') },
];

/** Removes a leading "Senhor"/"Senhora" already given by the form of address. */
function cleanEntidade(entidade: string, tratamento: string): string {
  const e = entidade.trim();
  if (/Senhora?$/.test(tratamento)) return e.replace(/^(Exm[oa]\.?\s+)?Senhora?\s+/i, '');
  return e;
}

/** First letter lower-case unless it looks like a proper noun or acronym. */
function lowerFirst(s: string): string {
  const t = s.trim();
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t)) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
}
const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** Identification of an individual applicant, in the classic requerimento style. */
function requerenteDesc(v: Values): string {
  const get = (k: string) => (v[`requerente${k}`] as string | undefined)?.toString().trim() || '';
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const doc = get('DocNumero')
    ? `${f ? 'portadora' : 'portador'} do ${get('DocTipo') || 'BI'} n.º ${get('DocNumero')}${get('DocEmissao') ? `, emitido em ${dateLong(get('DocEmissao'))}` : ''}${get('DocLocal') ? `, em ${get('DocLocal')}` : ''}`
    : `${f ? 'portadora' : 'portador'} do BI n.º ${BLANK}`;
  const parts = [
    `**${(get('Nome') || BLANK).toUpperCase()}**`,
    ec ? (f ? ec.replace(/o$/, 'a') : ec) : '',
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    get('Naturalidade') ? `natural de ${get('Naturalidade')}` : '',
    get('Profissao') ? `de profissão ${get('Profissao')}` : '',
    doc,
    get('Nuit') ? `com o NUIT ${get('Nuit')}` : '',
    `residente em ${get('Morada') || BLANK}`,
    get('Telefone') || get('Email') ? `contacto: ${[get('Telefone'), get('Email')].filter(Boolean).join(' / ')}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

function empresaDesc(profile: Profile | null, v: Values): string {
  const p = profile;
  const nome = (p?.kind === 'empresa' ? profileDisplayName(p) : '') || BLANK;
  const morada = p ? addressLine(p) : '';
  const rep = p?.kind === 'empresa' ? { nome: p.representanteNome || '', cargo: p.representanteCargo || '' } : { nome: '', cargo: '' };
  const parts = [
    `**${nome.toUpperCase()}**`,
    morada ? `com sede em ${morada}` : '',
    p?.nuit ? `com o NUIT ${p.nuit}` : '',
    p?.nuel ? `registada sob o NUEL ${p.nuel}` : '',
    rep.nome ? `neste acto representada por ${rep.nome}${rep.cargo ? `, na qualidade de ${rep.cargo}` : ''}` : '',
    v.requerenteTelefone || v.requerenteEmail ? `contacto: ${[v.requerenteTelefone, v.requerenteEmail].filter(Boolean).join(' / ')}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

export default defineTemplate({
  id: 'requerimento',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'requerente', title: l('Requerente', 'Applicant'), personRole: 'outro' },
    { id: 'pedido', title: l('Pedido', 'Request') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    {
      name: 'tratamento',
      type: 'select',
      section: 'destinatario',
      width: 'half',
      label: l('Forma de tratamento', 'Form of address'),
      options: TRATAMENTO_OPTIONS,
      default: 'Exmo. Senhor',
    },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo e instituição do destinatário', 'Addressee’s position and institution'),
      placeholder: l('Ex.: Presidente do Conselho Municipal da Cidade de Maputo', 'E.g. Presidente do Conselho Municipal da Cidade de Maputo'),
      help: l(
        'Indique o cargo de quem decide, não o nome da pessoa. Exemplos: «Presidente do Conselho Municipal da Cidade de Maputo», «Director Provincial de Educação de Sofala», «Director da Escola Secundária Josina Machel», «Director-Geral do Instituto Nacional de Segurança Social».',
        'State the position of the decision-maker, not the person’s name. E.g. the Mayor of Maputo, the Provincial Director of Education, a school director.',
      ),
    },
    {
      name: 'destinatarioLocal',
      type: 'text',
      section: 'destinatario',
      width: 'half',
      label: l('Cidade do destinatário', 'Addressee’s city'),
      default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo',
    },
    {
      name: 'requerenteTipo',
      type: 'radio',
      section: 'requerente',
      label: l('Quem requer', 'Who is applying'),
      options: [
        { value: 'empresa', label: l('A empresa do perfil', 'The profile’s company') },
        { value: 'pessoa', label: l('Uma pessoa', 'An individual') },
      ],
      default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa'),
    },
    ...fromPessoaProfile(
      workerFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'], 'requerente', 'requerente'),
      'requerente',
    ).map((f) => ({ ...f, showIf: (v: Values) => !isEmpresa(v) })),
    {
      name: 'requerenteProfissao',
      type: 'text',
      section: 'requerente',
      width: 'half',
      label: l('Profissão (opcional)', 'Occupation (optional)'),
      personKey: 'cargo',
      showIf: (v) => !isEmpresa(v),
    },
    ...workerFields(['telefone'], 'requerente', 'requerente').map((f) => ({ ...f, default: (c: DefaultsContext) => c.profile?.telefones || '' })),
    {
      name: 'requerenteEmail',
      type: 'email',
      section: 'requerente',
      width: 'half',
      label: l('Email (opcional)', 'Email (optional)'),
      personKey: 'email',
      default: (c) => c.profile?.email || '',
    },
    {
      name: 'assunto',
      type: 'text',
      section: 'pedido',
      label: l('Assunto (opcional)', 'Subject (optional)'),
      placeholder: l('Ex.: Pedido de licença de construção', 'E.g. Building permit application'),
    },
    {
      name: 'pedido',
      type: 'textarea',
      section: 'pedido',
      required: true,
      rows: 4,
      label: l('O que pede', 'What you are requesting'),
      help: l(
        'Escreva a continuação de «vem, mui respeitosamente, requerer a V. Ex.ª…». Ex.: «se digne autorizar a emissão de uma certidão de quitação» ou «a concessão de licença de construção para o talhão n.º …». Para vários pedidos, escreva um por linha.',
        'Write what follows “respectfully requests Your Excellency…”. E.g. “to authorise the issue of a clearance certificate”. For several requests, one per line.',
      ),
    },
    {
      name: 'fundamentacao',
      type: 'textarea',
      section: 'pedido',
      rows: 4,
      label: l('Fundamentação (opcional)', 'Grounds (optional)'),
      help: l('Os motivos do pedido, um por linha. Seja concreto: factos, datas, números de processo.', 'Reasons for the request, one per line. Be specific: facts, dates, case numbers.'),
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'pedido',
      label: l('Documentos que junta', 'Enclosed documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document'), placeholder: l('Ex.: Cópia do Bilhete de Identidade', 'E.g. Copy of ID card') }],
      default: [],
    },
    {
      name: 'deferimento',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Fecho', 'Closing'),
      options: [
        { value: 'Pede deferimento.', label: l('Pede deferimento.', 'Requests approval.') },
        { value: 'Espera deferimento.', label: l('Espera deferimento.', 'Awaits approval.') },
      ],
      default: 'Pede deferimento.',
    },
    localField('documento'),
    dateField('data'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!v.entidade) w.push({ level: 'warning', field: 'entidade', message: l('Indique a quem se dirige o requerimento.', 'State who the request is addressed to.') });
    if (!splitLines(v.pedido).length) w.push({ level: 'warning', field: 'pedido', message: l('Escreva o pedido.', 'Write the request.') });
    if (/^\s*(venho|vem|requer|solicito)/i.test(String(v.pedido ?? ''))) {
      w.push({
        level: 'info',
        field: 'pedido',
        message: l(
          'O texto já começa por «vem, mui respeitosamente, requerer a V. Ex.ª». Escreva apenas o que pede.',
          'The text already starts with “respectfully requests Your Excellency”. Write only what you ask for.',
        ),
      });
    }
    if (isEmpresa(v)) {
      if (ctx.profile?.kind !== 'empresa') {
        w.push({ level: 'warning', field: 'requerenteTipo', message: l('O perfil activo não é de uma empresa. Escolha «Uma pessoa».', 'The active profile is not a company. Choose “An individual”.') });
      } else if (!ctx.profile.representanteNome) {
        w.push({ level: 'info', message: l('Indique o representante da empresa no perfil.', 'Set the company representative in the profile.') });
      }
    } else {
      if (!v.requerenteDocNumero) w.push({ level: 'warning', field: 'requerenteDocNumero', message: l('Falta o número do documento de identificação.', 'The ID number is missing.') });
      if (!v.requerenteMorada) w.push({ level: 'warning', field: 'requerenteMorada', message: l('Falta a morada do requerente.', 'The applicant’s address is missing.') });
      if (!v.requerenteEstadoCivil || !v.requerenteProfissao) {
        w.push({
          level: 'info',
          field: v.requerenteEstadoCivil ? 'requerenteProfissao' : 'requerenteEstadoCivil',
          message: l(
            `A lei pede que o requerente se identifique pelo nome, estado civil, profissão e residência (${cite('requerimentoConteudo')}).`,
            'The law asks the applicant to give name, marital status, occupation and residence.',
          ),
        });
      }
    }
    if (!splitLines(v.fundamentacao).length) {
      w.push({
        level: 'info',
        field: 'fundamentacao',
        message: l(
          'O requerimento deve expor os factos em que se baseia o pedido. Indique os motivos.',
          'The application should set out the facts on which the request is based. State your reasons.',
        ),
      });
    }
    return w;
  },

  personName: (v) => (isEmpresa(v) ? undefined : v.requerenteNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresa(v) && ctx.profile?.kind === 'empresa';
    const tratamento = v.tratamento || 'Exmo. Senhor';
    const entidade = cleanEntidade(String(v.entidade || ''), tratamento) || BLANK;
    const pedidos = splitLines(v.pedido);
    const fundamentos = splitLines(v.fundamentacao);
    const anexos = lineItems(v.anexos).map((r) => String(r.descricao ?? '').trim()).filter(Boolean);

    const quem = empresa ? empresaDesc(ctx.profile, v) : requerenteDesc(v);
    const abertura =
      pedidos.length > 1
        ? `${quem}, vem, mui respeitosamente, requerer a V. Ex.ª o seguinte:`
        : `${quem}, vem, mui respeitosamente, requerer a V. Ex.ª ${pedidos.length ? endDot(lowerFirst(pedidos[0])) : `${BLANK}.`}`;

    const blocks: Block[] = [
      // Space at the top for the decision (despacho), as on the traditional form.
      { type: 'spacer', size: 'large' },
      {
        type: 'recipient',
        salutation: tratamento,
        lines: [entidade, v.destinatarioLocal ? String(v.destinatarioLocal).toUpperCase() : ''].filter(Boolean),
      },
    ];
    if (v.assunto) blocks.push({ type: 'subject', text: String(v.assunto) });
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: abertura,
      en: `The applicant, identified above, respectfully requests Your Excellency ${pedidos.length > 1 ? 'the following:' : 'what is stated above.'}`,
    });
    if (pedidos.length > 1) blocks.push({ type: 'list', style: 'alpha', items: pedidos.map(endDot) });
    if (fundamentos.length === 1) {
      blocks.push({
        type: 'paragraph',
        id: 'fundamentacao',
        text: `O pedido fundamenta-se no seguinte: ${endDot(lowerFirst(fundamentos[0]))}`,
        en: 'The request is based on the grounds stated.',
      });
    } else if (fundamentos.length > 1) {
      blocks.push(
        { type: 'paragraph', id: 'fundamentacao', text: 'O pedido fundamenta-se no seguinte:', en: 'The request is based on the following:' },
        { type: 'list', style: 'numeric', items: fundamentos.map(endDot) },
      );
    }
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Junta:', items: anexos });

    const signer = empresa
      ? { role: 'A Requerente', name: employerRep(ctx).nome || undefined, detail: employerRep(ctx).cargo || undefined, image: 'both' as const }
      : { role: g(v.requerenteGenero, 'O Requerente', 'A Requerente'), name: v.requerenteNome || undefined };
    blocks.push(
      {
        type: 'paragraph',
        id: 'deferimento',
        text: v.deferimento === 'Espera deferimento.' ? 'Espera deferimento.' : 'Pede deferimento.',
        en: v.deferimento === 'Espera deferimento.' ? 'Awaits approval.' : 'Requests approval.',
        align: 'center',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signer] },
    );
    return blocks;
  },
});
