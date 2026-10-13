// Declaração de beneficiário efectivo: identifies the individuals who own or
// control a company. For banks (KYC), public tenders and registry files; the
// registry filing itself is made on the official form or online.
import { formatPercent } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, DOC_TIPO_OPTIONS, g, l, lineItems, localField } from './_shared';
import { identificacao, num, pessoaFields, quantos, comReconhecimento, semPonto, sociedadeFields, sociedadeIdent, sociedadeNome, str } from './_sociedades';

const CONTROLO: Record<string, string> = {
  directo: 'Participação directa',
  indirecto: 'Participação indirecta',
  outro: 'Controlo por outro meio',
};

type Benef = Record<string, string>;
const beneficiarios = (v: Values): Benef[] =>
  lineItems(v.beneficiarios)
    .map((r) => Object.fromEntries(Object.entries(r).map(([k, x]) => [k, str(x)])) as Benef)
    .filter((b) => b.nome);

const DOC_NOME: Record<string, string> = { BI: 'BI', DIRE: 'DIRE', Passaporte: 'Passaporte' };

export default defineTemplate({
  id: 'declaracao-beneficiario-efectivo',
  family: 'declaracao',
  official: 'registo',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'sociedade', title: l('Entidade', 'Entity') },
    { id: 'declarante', title: l('Declarante (representante legal)', 'Declarant (legal representative)'), personRole: 'representante' },
    { id: 'beneficiarios', title: l('Beneficiários efectivos', 'Beneficial owners') },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
  ],
  fields: [
    localField(),
    dateField(),
    ...sociedadeFields('sociedade'),
    { name: 'dataConstituicao', type: 'date', section: 'sociedade', width: 'half', label: l('Data de constituição', 'Date of incorporation') },
    ...pessoaFields('declarante', 'declarante').map((f) =>
      f.name === 'declaranteNome' ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'empresa' ? c.profile.representanteNome ?? '' : '') } : f,
    ),
    {
      name: 'declaranteCargo',
      type: 'text',
      section: 'declarante',
      width: 'half',
      required: true,
      label: l('Qualidade (cargo)', 'Capacity (position)'),
      placeholder: l('Ex.: Gerente', 'E.g. Manager'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
    {
      name: 'beneficiarios',
      type: 'lines',
      section: 'beneficiarios',
      required: true,
      label: l('Beneficiários efectivos (pessoas singulares)', 'Beneficial owners (individuals)'),
      help: l(
        'Cada pessoa singular que detém, directa ou indirectamente, a percentagem legal do capital ou dos votos, ou que controla a entidade por outro meio. Se o sócio for uma sociedade, indique as pessoas que estão por trás dela.',
        'Each individual holding, directly or indirectly, the legal percentage of capital or votes, or otherwise controlling the entity. If a member is a company, name the people behind it.',
      ),
      addLabel: l('Adicionar beneficiário', 'Add beneficial owner'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'dataNascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
        { name: 'nacionalidade', type: 'text', label: l('Nacionalidade', 'Nationality') },
        { name: 'docTipo', type: 'select', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS },
        { name: 'docNumero', type: 'text', label: l('N.º do documento', 'Document no.') },
        { name: 'docValidade', type: 'date', label: l('Válido até', 'Valid until') },
        { name: 'nuit', type: 'text', label: l('NUIT', 'Tax number (NUIT)') },
        { name: 'domicilio', type: 'text', label: l('Domicílio habitual', 'Home address') },
        { name: 'domicilioProfissional', type: 'text', label: l('Domicílio profissional / fiscal', 'Work / tax address') },
        { name: 'telemovel', type: 'tel', label: l('Telemóvel', 'Mobile') },
        { name: 'percentagem', type: 'number', label: l('Percentagem detida (%)', 'Percentage held (%)'), min: 0, max: 100 },
        {
          name: 'tipoControlo',
          type: 'select',
          label: l('Tipo de controlo', 'Type of control'),
          options: [
            { value: 'directo', label: l('Participação directa', 'Direct holding') },
            { value: 'indirecto', label: l('Participação indirecta', 'Indirect holding') },
            { value: 'outro', label: l('Controlo por outro meio', 'Control by other means') },
          ],
        },
        { name: 'via', type: 'text', label: l('Através de (se indirecto ou outro)', 'Through (if indirect or other)'), placeholder: l('Ex.: através da Zambeze Investimentos, SA, de que é accionista maioritário', 'E.g. through company X, of which they are the majority shareholder') },
      ],
      default: [{ nome: '', nacionalidade: 'moçambicana', docTipo: 'BI', tipoControlo: 'directo' }],
    },
    {
      name: 'semLimiar',
      type: 'toggle',
      section: 'beneficiarios',
      label: l('Ninguém atinge a percentagem legal: declarar quem dirige', 'Nobody reaches the threshold: declare the senior manager'),
      help: l('Indique a pessoa que ocupa a direcção de topo da entidade.', 'Name the person in senior management.'),
    },
    { name: 'topoNome', type: 'text', section: 'beneficiarios', width: 'half', label: l('Nome de quem dirige', 'Senior manager’s name'), showIf: (v) => Boolean(v.semLimiar) },
    { name: 'topoCargo', type: 'text', section: 'beneficiarios', width: 'half', label: l('Cargo', 'Position'), showIf: (v) => Boolean(v.semLimiar) },
    {
      name: 'finalidade',
      type: 'select',
      section: 'finalidade',
      width: 'half',
      label: l('Para entregar a', 'To be given to'),
      options: [
        { value: 'banco', label: l('Banco ou instituição financeira', 'Bank or financial institution') },
        { value: 'concurso', label: l('Entidade contratante (concurso público)', 'Contracting entity (public tender)') },
        { value: 'conservatoria', label: l('Conservatória (instrução do processo)', 'Registry (supporting document)') },
        { value: 'outro', label: l('Outra entidade', 'Other') },
      ],
      default: 'banco',
    },
    { name: 'destinatario', type: 'text', section: 'finalidade', width: 'half', label: l('Nome da entidade', 'Entity name'), placeholder: l('Ex.: Banco Comercial e de Investimentos', 'E.g. bank name') },
    { name: 'referencia', type: 'text', section: 'finalidade', label: l('Referência do concurso ou processo (opcional)', 'Tender or file reference (optional)'), showIf: (v) => v.finalidade === 'concurso' || v.finalidade === 'outro' },
    { name: 'reconhecimento', type: 'toggle', section: 'finalidade', label: l('Espaço para reconhecimento notarial', 'Space for notarial recognition') },
  ],

  personName: (v) => str(v.sociedadeFirma) || undefined,
  documentDate: (v) => v.data,

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const bs = beneficiarios(v);
    const limiar = formatPercent(ctx.legal.value<number>('beneficiarioEfectivoLimiar'));
    if (!bs.length && !v.semLimiar) {
      w.push({ level: 'error', field: 'beneficiarios', message: l('Indique pelo menos um beneficiário efectivo.', 'Name at least one beneficial owner.') });
    }
    const directo = bs.filter((b) => b.tipoControlo !== 'outro').reduce((a, b) => a + (num(b.percentagem) ?? 0), 0);
    if (directo > 100.01) {
      w.push({ level: 'warning', field: 'beneficiarios', message: l('A soma das percentagens ultrapassa a totalidade do capital. Confirme os valores.', 'Percentages add up to more than the whole capital. Check them.') });
    }
    const hoje = ctx.today;
    if (bs.some((b) => b.docValidade && b.docValidade < hoje)) {
      w.push({ level: 'warning', field: 'beneficiarios', message: l('Há documentos de identificação caducados: a lei exige documento válido.', 'Some ID documents have expired: a valid document is required.') });
    }
    w.push(
      {
        level: 'info',
        message: l(
          `Declare cada pessoa singular com pelo menos ${limiar} do capital ou dos votos, directa ou indirectamente (${cite('beneficiarioEfectivoLimiar')}), ou que controle a entidade por outro meio.`,
          `Declare every individual with at least ${limiar} of capital or votes, directly or indirectly, or otherwise in control.`,
        ),
      },
      {
        level: 'info',
        message: l(
          `Na Conservatória do Registo das Entidades Legais a declaração é registada no impresso próprio ou no portal do SRN (${cite('beneficiarioEfectivoDeclaracao')}); este documento não substitui esse registo. Actualize-a no prazo de ${quantos(ctx.legal.value<number>('beneficiarioEfectivoSociedade'), 'dia', 'dias')} após qualquer alteração.`,
          'At the registry the declaration is filed on the official form or the SRN portal; this document does not replace it. Update it within the legal period after any change.',
        ),
      },
    );
    if (v.finalidade === 'concurso') {
      w.push({
        level: 'info',
        message: l(
          `Concurso público: o concorrente vencedor entrega esta declaração, em papel e em formato digital, antes da assinatura do contrato, no prazo de ${quantos(ctx.legal.value<number>('beneficiarioEfectivoConcurso'), 'dia útil', 'dias úteis')} (${cite('beneficiarioEfectivoConcurso')}).`,
          'Public tender: the winning bidder gives this declaration, on paper and digitally, before the contract is signed, within the period stated.',
        ),
      });
    }
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const bs = beneficiarios(v);
    const limiar = formatPercent(ctx.legal.value<number>('beneficiarioEfectivoLimiar'));
    const prazo = ctx.legal.value<number>('beneficiarioEfectivoSociedade');
    const constituida = v.dataConstituicao ? `, constituída em ${dateLong(v.dataConstituicao)}` : '';

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Beneficiário Efectivo', subtitle: sociedadeNome(v) },
      {
        type: 'paragraph',
        id: 'declarante',
        text: `${identificacao(v, 'declarante')}, na qualidade de ${semPonto(v.declaranteCargo) || BLANK} da sociedade ${sociedadeIdent(v)}${constituida}, com poderes para o acto, declara, para os efeitos do ${cite('beneficiarioEfectivoSociedade')}, do ${cite('beneficiarioEfectivoDeclaracao')} e da legislação de prevenção e combate ao branqueamento de capitais e ao financiamento do terrorismo, que ${bs.length === 1 ? 'é beneficiário efectivo da referida entidade a seguinte pessoa singular' : 'são beneficiários efectivos da referida entidade as seguintes pessoas singulares'}:`,
        en: 'The legal representative named above declares that the following individuals are the beneficial owners of the company:',
      },
    ];
    (bs.length ? bs : [{} as Benef]).forEach((b, i) => {
      const doc = b.docNumero ? `${DOC_NOME[b.docTipo] ?? 'BI'} n.º ${b.docNumero}${b.docValidade ? `, válido até ${dateLong(b.docValidade)}` : ''}` : BLANK;
      const p = num(b.percentagem);
      blocks.push({
        type: 'keyValue',
        title: bs.length > 1 ? `Beneficiário efectivo n.º ${i + 1}` : 'Beneficiário efectivo',
        columns: 2,
        items: [
          { label: 'Nome completo', value: b.nome || BLANK },
          { label: 'Data de nascimento', value: b.dataNascimento ? dateLong(b.dataNascimento) : BLANK },
          { label: 'Nacionalidade', value: b.nacionalidade || BLANK },
          { label: 'Documento de identificação', value: doc },
          { label: 'NUIT', value: b.nuit || BLANK },
          { label: 'Telemóvel', value: b.telemovel || BLANK },
          { label: 'Domicílio habitual', value: semPonto(b.domicilio) || BLANK },
          { label: 'Domicílio profissional / fiscal', value: semPonto(b.domicilioProfissional) || '—' },
          { label: 'Capital / direitos de voto', value: p != null ? `${p}%` : '____%' },
          { label: 'Tipo de controlo', value: `${CONTROLO[b.tipoControlo] ?? CONTROLO.directo}${b.via ? ` — ${semPonto(b.via)}` : ''}` },
        ],
      });
    });
    if (v.semLimiar) {
      blocks.push({
        type: 'paragraph',
        id: 'semLimiar',
        text: `Não existindo pessoa singular que detenha, directa ou indirectamente, pelo menos ${limiar} do capital social ou dos direitos de voto, nem que exerça por outro meio o controlo da entidade, declara-se como beneficiário efectivo a pessoa singular que ocupa a direcção de topo: **${str(v.topoNome) || BLANK}**, ${semPonto(v.topoCargo) || BLANK}.`,
        en: 'As no individual reaches the threshold or otherwise controls the entity, the person in senior management is declared as beneficial owner.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'veracidade',
      text: `${g(v.declaranteGenero, 'O declarante', 'A declarante')} declara que as informações prestadas são verdadeiras, completas e actuais, que tem conhecimento de que a prestação de falsas declarações ${g(v.declaranteGenero, 'o', 'a')} faz incorrer em responsabilidade civil e criminal, e obriga-se a comunicar qualquer alteração no prazo de ${quantos(prazo, 'dia', 'dias')}.`,
      en: `The declarant confirms the information is true, complete and current, knows that false statements carry civil and criminal liability, and will report any change within ${prazo} days.`,
    });
    const dest = semPonto(v.destinatario);
    const ref = semPonto(v.referencia);
    const destino =
      v.finalidade === 'concurso'
        ? `A presente declaração é entregue ${dest ? `a ${dest}` : 'à entidade contratante'}${ref ? `, no âmbito do procedimento ${ref}` : ''}.`
        : v.finalidade === 'conservatoria'
          ? 'A presente declaração destina-se a instruir o processo junto da Conservatória do Registo das Entidades Legais.'
          : `A presente declaração destina-se a ser entregue ${dest ? `a ${dest}` : 'à entidade que a solicitou'}${ref ? `, referência ${ref}` : ''}.`;
    blocks.push(
      { type: 'paragraph', id: 'destino', text: destino, en: 'Purpose of this declaration.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: g(v.declaranteGenero, 'O Declarante', 'A Declarante'), name: str(v.declaranteNome) || undefined, detail: semPonto(v.declaranteCargo) || undefined, image: ctx.profile?.kind === 'empresa' ? 'both' : undefined }],
      },
    );
    if (v.reconhecimento) comReconhecimento(blocks, 'Reconhecimento notarial da assinatura');
    return blocks;
  },
});
