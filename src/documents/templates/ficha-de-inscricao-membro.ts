import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { DOC_TIPO_OPTIONS, ESTADO_CIVIL_OPTIONS, GENERO_OPTIONS, formatMoney, l, lineItems, localField, money } from './_shared';
import { daEntidade, entidadeNome, naturezaField, naturezaOf, str, deNome } from './_associacoes';

// Ficha de inscrição de membro: one A4 page, printed blank (to fill by hand)
// or pre-filled. The board's decision box sits at the bottom.

const LINE = '__________________';

const CATEGORIAS: Record<string, string[]> = {
  associacao: ['Membro efectivo', 'Membro juvenil', 'Membro honorário'],
  ong: ['Membro efectivo', 'Membro colaborador'],
  clube: ['Sócio efectivo', 'Sócio atleta', 'Sócio juvenil'],
  igreja: ['Membro', 'Membro em preparação', 'Transferido de outra igreja'],
  grupo: ['Membro'],
};

const val = (v: Values, k: string, blank: boolean) => (blank ? LINE : str(v[k]) || LINE);

export default defineTemplate({
  id: 'ficha-de-inscricao-membro',
  family: 'declaracao',
  sections: [
    { id: 'modo', title: l('Modo', 'Mode') },
    { id: 'candidato', title: l('Candidato', 'Applicant'), personRole: 'outro' },
    { id: 'inscricao', title: l('Inscrição', 'Membership') },
  ],
  fields: [
    naturezaField('modo'),
    {
      name: 'emBranco',
      type: 'toggle',
      section: 'modo',
      label: l('Imprimir em branco (para preencher à mão)', 'Print blank (to fill in by hand)'),
      help: l('Desligue para preencher já os dados de uma pessoa.', 'Turn off to fill in one person’s details now.'),
      default: true,
    },
    { name: 'candidatoNome', type: 'text', section: 'candidato', label: l('Nome completo', 'Full name'), personKey: 'nome', showIf: (v) => !v.emBranco },
    { name: 'candidatoGenero', type: 'radio', section: 'candidato', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero', showIf: (v) => !v.emBranco },
    { name: 'candidatoNascimento', type: 'date', section: 'candidato', width: 'half', label: l('Data de nascimento', 'Date of birth'), showIf: (v) => !v.emBranco },
    { name: 'candidatoNaturalidade', type: 'text', section: 'candidato', width: 'half', label: l('Naturalidade', 'Place of birth'), personKey: 'naturalidade', showIf: (v) => !v.emBranco },
    { name: 'candidatoNacionalidade', type: 'text', section: 'candidato', width: 'half', label: l('Nacionalidade', 'Nationality'), default: 'moçambicana', personKey: 'nacionalidade', showIf: (v) => !v.emBranco },
    { name: 'candidatoEstadoCivil', type: 'select', section: 'candidato', width: 'half', label: l('Estado civil', 'Marital status'), options: ESTADO_CIVIL_OPTIONS, personKey: 'estadoCivil', showIf: (v) => !v.emBranco },
    { name: 'candidatoDocTipo', type: 'select', section: 'candidato', width: 'half', label: l('Documento', 'Document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo', showIf: (v) => !v.emBranco },
    { name: 'candidatoDocNumero', type: 'text', section: 'candidato', width: 'half', label: l('N.º do documento', 'Document number'), personKey: 'docNumero', showIf: (v) => !v.emBranco },
    { name: 'candidatoNuit', type: 'text', section: 'candidato', width: 'half', label: l('NUIT (opcional)', 'Tax number (optional)'), personKey: 'nuit', showIf: (v) => !v.emBranco },
    { name: 'candidatoProfissao', type: 'text', section: 'candidato', width: 'half', label: l('Profissão / ocupação', 'Occupation'), showIf: (v) => !v.emBranco },
    { name: 'candidatoMorada', type: 'text', section: 'candidato', label: l('Morada (bairro, quarteirão, casa n.º)', 'Address'), personKey: 'morada', showIf: (v) => !v.emBranco },
    { name: 'candidatoTelefone', type: 'tel', section: 'candidato', width: 'half', label: l('Telefone', 'Phone'), personKey: 'telefone', showIf: (v) => !v.emBranco },
    { name: 'candidatoEmail', type: 'email', section: 'candidato', width: 'half', label: l('Email', 'Email'), showIf: (v) => !v.emBranco },
    {
      name: 'categorias',
      type: 'lines',
      section: 'inscricao',
      label: l('Categorias de membro (caixas a assinalar)', 'Membership categories (tick boxes)'),
      help: l('Deixe vazio para usar as categorias habituais.', 'Leave empty to use the usual categories.'),
      addLabel: l('Adicionar categoria', 'Add category'),
      columns: [{ name: 'categoria', type: 'text', label: l('Categoria', 'Category') }],
      default: [],
    },
    { name: 'categoria', type: 'text', section: 'inscricao', width: 'half', label: l('Categoria pretendida', 'Category requested'), showIf: (v) => !v.emBranco },
    { name: 'proponentes', type: 'toggle', section: 'inscricao', label: l('Exige proponentes (membros que apresentam o candidato)', 'Requires proposers'), default: true },
    { name: 'joia', type: 'money', section: 'inscricao', width: 'half', label: l('Jóia (opcional)', 'Entry fee (optional)') },
    { name: 'quota', type: 'money', section: 'inscricao', width: 'half', label: l('Quota mensal (opcional)', 'Monthly dues (optional)') },
    { name: 'menor', type: 'toggle', section: 'inscricao', label: l('Incluir assinatura do encarregado (candidato menor)', 'Include guardian signature (minor)'), default: false },
    localField('inscricao'),
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const b = Boolean(v.emBranco);
    const n = naturezaOf(v);
    const nome = entidadeNome(ctx);
    const igreja = n === 'igreja';
    const cats = lineItems(v.categorias).map((r) => str(r.categoria)).filter(Boolean);
    const lista = cats.length ? cats : CATEGORIAS[n];
    const nasc = b ? LINE : str(v.candidatoNascimento) ? formatDateShort(v.candidatoNascimento) : LINE;
    const sexo = b ? '(   ) M      (   ) F' : v.candidatoGenero === 'F' ? 'Feminino' : 'Masculino';
    const doc = b ? 'BI / DIRE / Pass. n.º ____________' : str(v.candidatoDocNumero) ? `${str(v.candidatoDocTipo) || 'BI'} n.º ${str(v.candidatoDocNumero)}` : LINE;
    const joia = money(v.joia);
    const quota = money(v.quota);

    const blocks: Block[] = [
      { type: 'title', text: 'Ficha de Inscrição de Membro' },
      { type: 'box', label: 'Reservado aos serviços', text: 'Membro n.º __________\nRecebida em ___/___/______', width: 'half' },
      { type: 'box', label: 'Fotografia', lines: 3, width: 'half', align: 'right' },
      {
        type: 'keyValue',
        title: 'Dados pessoais',
        columns: 2,
        items: [
          { label: 'Nome completo', value: val(v, 'candidatoNome', b) },
          { label: 'Sexo', value: sexo },
          { label: 'Data de nascimento', value: nasc },
          { label: 'Naturalidade', value: val(v, 'candidatoNaturalidade', b) },
          { label: 'Nacionalidade', value: val(v, 'candidatoNacionalidade', b) },
          { label: 'Estado civil', value: val(v, 'candidatoEstadoCivil', b) },
          { label: 'Documento', value: doc },
          { label: 'NUIT', value: val(v, 'candidatoNuit', b) },
          { label: 'Profissão', value: val(v, 'candidatoProfissao', b) },
          { label: 'Telefone', value: val(v, 'candidatoTelefone', b) },
          { label: 'Morada', value: val(v, 'candidatoMorada', b) },
          { label: 'Email', value: val(v, 'candidatoEmail', b) },
        ],
      },
      { type: 'heading', text: 'Categoria pretendida' },
      { type: 'checklist', columns: 2, items: [...lista, 'Outra: ______________'].map((c) => ({ label: c, checked: !b && str(v.categoria).toLowerCase() === c.toLowerCase() })) },
    ];
    if (v.proponentes) {
      blocks.push(
        { type: 'heading', text: 'Proponentes' },
        {
          type: 'table',
          columns: [
            { label: 'Nome do membro proponente', width: 5 },
            { label: 'Membro n.º', width: 1.6 },
            { label: 'Assinatura', width: 3.4 },
          ],
          rows: [
            ['1.\n ', '', ''],
            ['2.\n ', '', ''],
          ],
        },
      );
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declaro que desejo ser admitido(a) como membro ${deNome(n, nome)}, que conheço e aceito os seus estatutos${igreja ? ', a sua confissão de fé' : ''} e o regulamento interno, que me comprometo a ${joia != null || quota != null || !igreja ? 'pagar a jóia e as quotas fixadas e a ' : ''}cumprir as deliberações dos seus órgãos, e que as informações acima prestadas são verdadeiras. Autorizo o tratamento dos meus dados pessoais apenas para a gestão da inscrição e para as comunicações ${daEntidade(n)}.`,
        en: 'I apply for membership, accept the statutes and rules, undertake to pay the fees, confirm the information is true and consent to the use of my data for membership only.',
      },
    );
    if (joia != null || quota != null) {
      blocks.push({
        type: 'note',
        text: [joia != null ? `Jóia: ${formatMoney(joia)}` : '', quota != null ? `Quota mensal: ${formatMoney(quota)}` : ''].filter(Boolean).join('   ·   '),
        en: 'Entry fee and monthly dues.',
      });
    }
    const last = blocks[blocks.length - 1];
    last.keepWithNext = true;
    blocks.push({
      type: 'signatures',
      placeDate: `${ctx.place}, ___ de ______________ de ______`,
      columns: [
        { role: 'O(A) Candidato(a)', name: b ? undefined : str(v.candidatoNome) || undefined },
        ...(v.menor ? [{ role: 'O(A) Encarregado(a)', name: undefined }] : []),
      ],
    });
    blocks.push({
      type: 'box',
      label: 'Decisão da Direcção',
      text: `Admitido(a) em ___/___/______    Acta n.º ______    Membro n.º ______\nJóia paga com o recibo n.º ______\n${igreja ? 'O Pastor' : 'O Presidente da Direcção'}: ______________________________`,
    });
    return blocks;
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (!v.emBranco && !str(v.candidatoNome)) w.push({ level: 'warning', field: 'candidatoNome', message: l('Indique o nome do candidato ou imprima em branco.', 'Enter the applicant’s name or print blank.') });
    return w;
  },
  personName: (v) => (v.emBranco ? undefined : str(v.candidatoNome) || undefined),
});
