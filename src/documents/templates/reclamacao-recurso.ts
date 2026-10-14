// Reclamação / Recurso Hierárquico / Exposição: a citizen or a company
// challenges a decision (or the silence) of a public body. The complaint goes
// to the author of the act; the hierarchical appeal to the author's superior.
// Written by the applicant, so no letterhead and never the national emblem.

import { diffDays } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, estadoCivilF, exmo, isF, l, lineItems, localField, placeDate, splitLines, workerFields } from './_shared';
import { daOuDo, endDot, str, stripNumber } from './_estado';

const isEmpresa = (v: Values) => v.requerenteTipo === 'empresa';

const TIPOS: Record<string, { acto: string; titulo: string }> = {
  reclamacao: { acto: 'apresentar **RECLAMAÇÃO**', titulo: 'Reclamação' },
  recurso: { acto: 'interpor **RECURSO HIERÁRQUICO**', titulo: 'Recurso Hierárquico' },
  exposicao: { acto: 'apresentar a seguinte **EXPOSIÇÃO**', titulo: 'Exposição' },
};

/** Personal-profile defaults for the applicant's fields. */
const FROM_PROFILE: Record<string, (p: NonNullable<DefaultsContext['profile']>) => unknown> = {
  requerenteNome: (p) => p.nome,
  requerenteGenero: (p) => p.genero,
  requerenteEstadoCivil: (p) => p.estadoCivil,
  requerenteNacionalidade: (p) => p.nacionalidade,
  requerenteDocTipo: (p) => p.docTipo,
  requerenteDocNumero: (p) => p.docNumero,
  requerenteDocEmissao: (p) => p.docEmissao,
  requerenteDocLocal: (p) => p.docLocal,
  requerenteNuit: (p) => p.nuit,
  requerenteMorada: (p) => addressLine(p),
  requerenteTelefone: (p) => p.telefones,
};
function withProfile(defs: FieldDef[]): FieldDef[] {
  return defs.map((f) => {
    const get = FROM_PROFILE[f.name];
    if (!get) return f;
    const fallback = f.default;
    return {
      ...f,
      showIf: (v: Values) => !isEmpresa(v),
      default: (c: DefaultsContext) => {
        const val = c.profile?.kind === 'pessoa' ? get(c.profile) : undefined;
        if (val) return val;
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

function requerenteTexto(v: Values, ctx: { profile: DefaultsContext['profile'] }): string {
  if (isEmpresa(v) && ctx.profile?.kind === 'empresa') {
    const p = ctx.profile;
    const parts = [
      `**${(profileDisplayName(p) || BLANK).toLocaleUpperCase('pt')}**`,
      addressLine(p) ? `com sede em ${addressLine(p)}` : '',
      p.nuit ? `NUIT ${p.nuit}` : '',
      p.nuel ? `registada sob o NUEL ${p.nuel}` : '',
      p.representanteNome ? `neste acto representada por ${p.representanteNome}${p.representanteCargo ? `, na qualidade de ${p.representanteCargo}` : ''}` : '',
    ];
    return parts.filter(Boolean).join(', ');
  }
  const get = (k: string) => str(v[`requerente${k}`]);
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const doc = get('DocNumero')
    ? `${f ? 'portadora' : 'portador'} do ${get('DocTipo') || 'BI'} n.º ${get('DocNumero')}${get('DocEmissao') ? `, emitido em ${dateLong(get('DocEmissao'))}` : ''}${get('DocLocal') ? `, em ${get('DocLocal')}` : ''}`
    : `${f ? 'portadora' : 'portador'} do BI n.º ${BLANK}`;
  const parts = [
    `**${(get('Nome') || BLANK).toLocaleUpperCase('pt')}**`,
    ec ? (f ? estadoCivilF(ec) : ec) : '',
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    get('Profissao') ? `de profissão ${get('Profissao')}` : '',
    doc,
    get('Nuit') ? `NUIT ${get('Nuit')}` : '',
    `residente em ${get('Morada') || BLANK}`,
    get('Telefone') ? `contacto ${get('Telefone')}` : '',
  ];
  return parts.filter(Boolean).join(', ');
}

export default defineTemplate({
  id: 'reclamacao-recurso',
  family: 'carta',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'tipo', title: l('O que apresenta', 'What you are filing') },
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'requerente', title: l('Quem apresenta', 'Applicant'), personRole: 'outro' },
    { id: 'acto', title: l('Decisão contestada', 'Decision challenged') },
    { id: 'fundamentos', title: l('Factos, fundamentos e pedido', 'Facts, grounds and request') },
    { id: 'documento', title: l('Documentos, local e data', 'Documents, place and date') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'tipo',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'recurso', label: l('Recurso hierárquico (ao superior de quem decidiu)', 'Hierarchical appeal (to the superior of the decision-maker)') },
        { value: 'reclamacao', label: l('Reclamação (a quem decidiu)', 'Complaint (to the decision-maker)') },
        { value: 'exposicao', label: l('Exposição (apresentar uma situação, sem prazo)', 'Representation (set out a situation, no deadline)') },
      ],
      default: 'recurso',
    },
    {
      name: 'tratamento',
      type: 'select',
      section: 'destinatario',
      width: 'half',
      label: l('Forma de tratamento', 'Form of address'),
      options: [
        { value: 'excelencia', label: l('Sua Excelência (Ministro, Governador…)', 'His/Her Excellency (Minister, Governor…)') },
        { value: 'exmo', label: l('Exmo. Senhor / Exma. Senhora', 'Dear Sir / Madam') },
      ],
      default: 'exmo',
    },
    { name: 'destinatarioGenero', type: 'radio', section: 'destinatario', width: 'half', label: l('Destinatário', 'Addressee'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M' },
    {
      name: 'destinatarioCargo',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo e instituição do destinatário', 'Addressee’s position and institution'),
      placeholder: l('Ex.: Director Provincial de Saúde de Nampula', 'E.g. Provincial Health Director of Nampula'),
      help: l(
        'Na reclamação, quem praticou o acto. No recurso hierárquico, o superior hierárquico de quem o praticou (ex.: o Ministro, se decidiu um Director Nacional).',
        'For a complaint, the author of the act. For a hierarchical appeal, the author’s superior (e.g. the Minister, if a National Director decided).',
      ),
    },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    {
      name: 'requerenteTipo',
      type: 'radio',
      section: 'requerente',
      label: l('Quem apresenta', 'Who files'),
      options: [
        { value: 'pessoa', label: l('Uma pessoa', 'An individual') },
        { value: 'empresa', label: l('A empresa do perfil', 'The profile’s company') },
      ],
      default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa'),
    },
    ...withProfile(
      workerFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada', 'telefone'], 'requerente', 'requerente'),
    ),
    { name: 'requerenteProfissao', type: 'text', section: 'requerente', width: 'half', label: l('Profissão', 'Occupation'), personKey: 'cargo', showIf: (v) => !isEmpresa(v), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.profissao ?? '' : '') },
    {
      name: 'silencio',
      type: 'toggle',
      section: 'acto',
      label: l('Contesta a falta de resposta (indeferimento tácito)', 'Challenging a lack of reply (tacit refusal)'),
      help: l('Quando fez um pedido e a Administração não decidiu no prazo legal.', 'When you made a request and the administration did not decide in time.'),
      default: false,
    },
    {
      name: 'actoDescricao',
      type: 'text',
      section: 'acto',
      required: true,
      label: l('Decisão contestada', 'Decision challenged'),
      placeholder: l('Ex.: despacho que indeferiu o pedido de licença de construção n.º 45/2026', 'E.g. the order refusing building permit application no. 45/2026'),
      showIf: (v) => !v.silencio,
    },
    { name: 'autorActo', type: 'text', section: 'acto', width: 'half', label: l('Quem decidiu', 'Who decided'), placeholder: l('Ex.: Director Municipal de Urbanização', 'E.g. Municipal Planning Director'), showIf: (v) => !v.silencio },
    { name: 'dataActo', type: 'date', section: 'acto', width: 'half', label: l('Data da decisão', 'Date of the decision'), showIf: (v) => !v.silencio },
    { name: 'dataNotificacao', type: 'date', section: 'acto', width: 'half', label: l('Data em que foi notificado', 'Date you were notified'), showIf: (v) => !v.silencio },
    { name: 'pedidoOriginal', type: 'text', section: 'acto', label: l('Pedido que ficou sem resposta', 'Request left unanswered'), placeholder: l('Ex.: requerimento de atribuição de DUAT', 'E.g. application for a land-use title'), showIf: (v) => Boolean(v.silencio) },
    { name: 'dataPedidoOriginal', type: 'date', section: 'acto', width: 'half', label: l('Data em que entregou o pedido', 'Date you filed the request'), showIf: (v) => Boolean(v.silencio) },
    {
      name: 'nulidade',
      type: 'toggle',
      section: 'acto',
      label: l('Considero o acto nulo (vício grave)', 'I consider the act null (serious defect)'),
      help: l('Ex.: decidido por quem não tinha competência alguma, ou ofende um direito fundamental. Os actos nulos podem ser impugnados a todo o tempo.', 'E.g. decided by someone with no power at all, or violating a fundamental right. Null acts may be challenged at any time.'),
      default: false,
      showIf: (v) => v.tipo === 'recurso',
    },
    {
      name: 'factos',
      type: 'textarea',
      section: 'fundamentos',
      required: true,
      rows: 8,
      label: l('Factos', 'Facts'),
      help: l('Um facto por linha, por ordem cronológica. Cada linha fica um artigo numerado (1.º, 2.º…).', 'One fact per line, in date order. Each line becomes a numbered article.'),
    },
    {
      name: 'fundamentos',
      type: 'textarea',
      section: 'fundamentos',
      rows: 5,
      label: l('Fundamentos de direito', 'Legal grounds'),
      help: l(
        'Porque a decisão está errada: viola uma lei (indique-a, se souber), não foi fundamentada, assenta num erro sobre os factos, ou é inconveniente. Um fundamento por linha.',
        'Why the decision is wrong: it breaks a law, gives no reasons, rests on a factual error, or is inappropriate. One ground per line.',
      ),
    },
    {
      name: 'pedido',
      type: 'textarea',
      section: 'fundamentos',
      required: true,
      rows: 3,
      label: l('Pedido', 'Request'),
      help: l('A continuação de «requer a V. Ex.ª se digne…». Ex.: «revogar o despacho recorrido e deferir o pedido de licença de construção».', 'Continue “requests Your Excellency to…”. E.g. “revoke the decision and grant the building permit”.'),
    },
    {
      name: 'documentos',
      type: 'lines',
      section: 'documento',
      label: l('Documentos juntos', 'Documents attached'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [],
    },
    {
      name: 'espacoDespacho',
      type: 'toggle',
      section: 'documento',
      label: l('Quadro para o despacho no topo da página', 'Box for the decision at the top of the page'),
      help: l('Espaço onde a entidade escreve a decisão (despacho), como no modelo tradicional de requerimento.', 'Space where the authority writes its decision, as on the traditional application form.'),
      default: true,
    },
    localField('documento'),
    dateField('data'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!str(v.destinatarioCargo)) w.push({ level: 'warning', field: 'destinatarioCargo', message: l('Indique a quem se dirige.', 'Enter who it is addressed to.') });
    if (!splitLines(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva os factos.', 'Describe the facts.') });
    if (!str(v.pedido)) w.push({ level: 'warning', field: 'pedido', message: l('Escreva o que pede.', 'Write what you request.') });
    if (isEmpresa(v) && ctx.profile?.kind !== 'empresa') {
      w.push({ level: 'warning', field: 'requerenteTipo', message: l('O perfil activo não é de uma empresa. Escolha «Uma pessoa».', 'The active profile is not a company. Choose “An individual”.') });
    }
    if (!isEmpresa(v) && !str(v.requerenteDocNumero)) {
      w.push({ level: 'warning', field: 'requerenteDocNumero', message: l(`Identifique-se por completo: sem identificação o pedido é rejeitado (${cite('requerimentoConteudo')}).`, 'Identify yourself fully: without identification the request is rejected.') });
    }
    if (v.tipo === 'recurso') {
      const prazo = ctx.legal.value<{ dias: number; anosTacito: number }>('recursoHierarquicoPrazo');
      w.push({
        level: 'info',
        message: l(
          `O recurso é apresentado por requerimento com todos os fundamentos, podendo juntar documentos (${cite('recursoHierarquicoForma')} — confirmar).`,
          'The appeal is a written application with all the grounds; documents may be attached.',
        ),
      });
      if (!v.silencio && !v.nulidade && v.dataNotificacao) {
        const d = diffDays(v.dataNotificacao, v.data || ctx.today);
        if (d > prazo.dias) {
          w.push({
            level: 'warning',
            field: 'dataNotificacao',
            message: l(
              `Passaram ${d} dias desde a notificação. O recurso de actos anuláveis tem o prazo de ${prazo.dias} dias (${cite('recursoHierarquicoPrazo')} — confirmar). Se o acto for nulo, pode ser impugnado a todo o tempo.`,
              `${d} days have passed since notification. The appeal against voidable acts has a ${prazo.dias}-day limit. Null acts may be challenged at any time.`,
            ),
          });
        }
      }
      if (v.silencio) {
        w.push({
          level: 'info',
          field: 'silencio',
          message: l(
            `Sem decisão no prazo legal, pode presumir o pedido indeferido (${cite('indeferimentoTacito')}). O recurso contra o indeferimento tácito tem o prazo de ${prazo.anosTacito} ${prazo.anosTacito === 1 ? 'ano' : 'anos'} (confirmar).`,
            `Without a decision in time, you may presume refusal. The appeal against a tacit refusal has a ${prazo.anosTacito}-year limit (to be confirmed).`,
          ),
        });
      }
    }
    if (v.tipo === 'reclamacao' && v.dataNotificacao) {
      const prazo = ctx.legal.value<number>('reclamacaoPrazo');
      const d = diffDays(v.dataNotificacao, v.data || ctx.today);
      if (d > prazo) {
        w.push({
          level: 'info',
          field: 'dataNotificacao',
          message: l(
            `Passaram ${d} dias desde a notificação. O prazo da reclamação indicado nos guias é de ${prazo} dias (${cite('reclamacaoPrazo')} — confirmar). Considere o recurso hierárquico.`,
            `${d} days have passed since notification. The complaint period given in guides is ${prazo} days (to be confirmed). Consider a hierarchical appeal.`,
          ),
        });
      }
    }
    return w;
  },

  personName: (v) => (isEmpresa(v) ? undefined : v.requerenteNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = TIPOS[v.tipo as string] ?? TIPOS.recurso;
    const cargo = str(v.destinatarioCargo) || BLANK;
    const local = str(v.destinatarioLocal).toLocaleUpperCase('pt');
    const recipient: Block =
      v.tratamento === 'excelencia'
        ? { type: 'recipient', salutation: 'A Sua Excelência', lines: [`${isF(v.destinatarioGenero) ? 'A' : 'O'} ${cargo.replace(/^(o|a)\s+/i, '')}`, local].filter(Boolean) }
        : { type: 'recipient', salutation: exmo(v.destinatarioGenero), lines: [cargo, local].filter(Boolean) };

    let objecto: string;
    if (v.silencio) {
      const pedido = str(v.pedidoOriginal) || BLANK;
      objecto = `do indeferimento tácito do ${pedido.replace(/^(o|do)\s+/i, '')}${v.dataPedidoOriginal ? `, apresentado em ${dateLong(v.dataPedidoOriginal)}` : ''}, sobre o qual não foi proferida decisão no prazo legal`;
    } else {
      const acto = str(v.actoDescricao).replace(/[.;,]+$/, '') || BLANK;
      objecto = /^(do|da|dos|das)\s/i.test(acto) ? acto : /^a\s/i.test(acto) ? acto.replace(/^a\s+/i, 'da ') : `do ${acto.replace(/^o\s+/i, '')}`;
      if (str(v.autorActo)) objecto += `, da autoria ${daOuDo(str(v.autorActo))}`;
      if (v.dataActo) objecto += `, de ${dateLong(v.dataActo)}`;
      if (v.dataNotificacao) objecto += `, cuja notificação foi recebida em ${dateLong(v.dataNotificacao)}`;
    }
    const lei = v.tipo === 'exposicao' ? cite('direitoPeticao') : cite('recursoHierarquicoForma');
    const abertura = v.tipo === 'exposicao'
      ? `${requerenteTexto(v, ctx)}, vem, ao abrigo do direito de petição consagrado na ${lei}, ${tipo.acto} a V. Ex.ª, a respeito ${objecto}, nos termos e com os fundamentos seguintes:`
      : `${requerenteTexto(v, ctx)}, vem, nos termos da ${lei}, ${tipo.acto} ${objecto}, nos termos e com os fundamentos seguintes:`;

    const factos = splitLines(v.factos).map((f) => endDot(stripNumber(f)));
    const fundamentos = splitLines(v.fundamentos).map((f) => endDot(stripNumber(f)));
    const sections = [{ heading: 'I — DOS FACTOS', items: factos.length ? factos : [`${BLANK}.`] }];
    if (fundamentos.length) sections.push({ heading: 'II — DO DIREITO', items: fundamentos });

    const pedido = str(v.pedido).replace(/[.;]+$/, '');
    const pedidoTxt = pedido ? pedido.charAt(0).toLowerCase() + pedido.slice(1) : BLANK;
    const docs = lineItems(v.documentos).map((d) => str(d.descricao)).filter(Boolean);
    const sujeito = isEmpresa(v) ? 'a requerente' : isF(v.requerenteGenero) ? 'a requerente' : 'o requerente';

    const blocks: Block[] = [
      v.espacoDespacho === false ? { type: 'spacer', size: 'medium' } : { type: 'box', label: 'Despacho', lines: 3, width: 'half', align: 'left' },
      recipient,
      { type: 'subject', text: tipo.titulo },
      { type: 'paragraph', id: 'abertura', text: abertura, en: 'The applicant, identified above, files this complaint or appeal against the decision stated, on the following grounds:' },
      { type: 'articulado', sections },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer ${sujeito} a V. Ex.ª se digne ${pedidoTxt}.`,
        en: 'The applicant therefore asks Your Excellency to grant the request stated.',
        keepWithNext: true,
      },
    ];
    if (docs.length) blocks.push({ type: 'annexList', title: `Junta: ${docs.length} ${docs.length === 1 ? 'documento' : 'documentos'}.`, items: docs, keepWithNext: true });
    blocks.push(
      { type: 'paragraph', id: 'deferimento', text: 'Pede deferimento.', align: 'left', keepWithNext: true, en: 'The applicant asks for the request to be granted.' },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          isEmpresa(v) && ctx.profile?.kind === 'empresa'
            ? { role: 'A Requerente', name: ctx.profile.representanteNome || undefined, detail: ctx.profile.representanteCargo || undefined, image: 'both' }
            : { role: isF(v.requerenteGenero) ? 'A Requerente' : 'O Requerente', name: str(v.requerenteNome) || undefined },
        ],
      },
    );
    return blocks;
  },
});
