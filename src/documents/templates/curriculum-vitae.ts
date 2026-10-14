import { parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type FieldDef, type Warning } from '../model';
import { ESTADO_CIVIL_OPTIONS, cite, dateField, dateLong, l, lineItems, localField, splitLines } from './_shared';
import { disp, str } from './_eventos';

// Curriculum vitae, A4. Modern and sober: name, title and contacts at the top,
// then profile, experience, education, training, languages, skills and
// references, and an optional signed statement (public competitions often ask
// for a CV "datado e assinado"). Private-life data (religion, party, health,
// parents, children) is never asked for: the Labour Law forbids employers to
// require it. Traditional personal data (birth date, BI…) is opt-in.

const MESES = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];

function mes(v: unknown): string {
  const d = parseISODate(str(v));
  return d ? `${MESES[d.getMonth()]} ${d.getFullYear()}` : str(v);
}

function periodoCv(inicio: unknown, fim: unknown, actual = 'presente'): string {
  const a = mes(inicio);
  const b = str(fim) ? mes(fim) : actual;
  return a ? `${a} – ${b}` : str(fim) ? b : '';
}

const NIVEIS: { value: string; label: [string, string] }[] = [
  { value: 'Ensino Primário', label: ['Ensino Primário', 'Primary school'] },
  { value: '10.ª Classe', label: ['Ensino Secundário — 10.ª Classe', 'Secondary — Grade 10'] },
  { value: '12.ª Classe', label: ['Ensino Secundário — 12.ª Classe', 'Secondary — Grade 12'] },
  { value: 'Técnico Básico', label: ['Ensino Técnico-Profissional — Básico', 'Vocational — basic'] },
  { value: 'Técnico Médio', label: ['Ensino Técnico-Profissional — Médio', 'Vocational — intermediate'] },
  { value: 'Bacharelato', label: ['Bacharelato', "Bachelor's (3 years)"] },
  { value: 'Licenciatura', label: ['Licenciatura', "Bachelor's degree"] },
  { value: 'Pós-graduação', label: ['Pós-graduação', 'Postgraduate'] },
  { value: 'Mestrado', label: ['Mestrado', "Master's"] },
  { value: 'Doutoramento', label: ['Doutoramento', 'PhD'] },
  { value: '', label: ['Outro', 'Other'] },
];

const LINGUA_NIVEIS = ['Língua materna', 'Fluente', 'Avançado', 'Intermédio', 'Básico'];

const pessoa = (key: 'nome' | 'telefones' | 'email' | 'profissao' | 'nacionalidade' | 'naturalidade' | 'estadoCivil') => (c: { profile: any }) =>
  c.profile?.kind === 'pessoa' ? (c.profile[key] ?? '') : '';

const opt = (name: string, label: [string, string], extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  type: 'text',
  section: 'dados',
  width: 'half',
  label: l(label[0], label[1]),
  showIf: (v) => Boolean(v.mostrarDados),
  ...extra,
});

export default defineTemplate({
  id: 'curriculum-vitae',
  family: 'declaracao',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'contactos', title: l('Nome e contactos', 'Name and contacts') },
    { id: 'dados', title: l('Dados pessoais (opcional)', 'Personal data (optional)') },
    { id: 'perfil', title: l('Perfil profissional', 'Professional profile') },
    { id: 'experiencia', title: l('Experiência profissional', 'Work experience') },
    { id: 'formacao', title: l('Formação', 'Education and training') },
    { id: 'competencias', title: l('Línguas e competências', 'Languages and skills') },
    { id: 'referencias', title: l('Referências', 'References') },
    { id: 'documento', title: l('Declaração, local e data', 'Statement, place and date') },
  ],
  fields: [
    { name: 'nome', type: 'text', section: 'contactos', required: true, label: l('Nome completo', 'Full name'), default: pessoa('nome') },
    { name: 'tituloProfissional', type: 'text', section: 'contactos', label: l('Título profissional', 'Professional title'), placeholder: l('Técnica de Contabilidade', 'Accounting Technician'), default: pessoa('profissao') },
    { name: 'cidade', type: 'text', section: 'contactos', width: 'third', required: true, label: l('Cidade', 'City'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.morada?.cidade ?? '' : '') },
    { name: 'telefone', type: 'tel', section: 'contactos', width: 'third', required: true, label: l('Telefone', 'Phone'), default: pessoa('telefones') },
    { name: 'email', type: 'email', section: 'contactos', width: 'third', required: true, label: l('Email', 'Email'), default: pessoa('email') },
    { name: 'linkedin', type: 'text', section: 'contactos', label: l('LinkedIn ou portefólio (opcional)', 'LinkedIn or portfolio (optional)') },
    {
      name: 'mostrarDados',
      type: 'toggle',
      section: 'dados',
      label: l('Incluir dados pessoais', 'Include personal data'),
      help: l(
        'Não são necessários num CV moderno. Inclua-os só se o anúncio os pedir. Nunca indique religião, partido, saúde, filiação ou filhos.',
        'Not needed in a modern CV. Include only if the advert asks. Never state religion, party, health, parents or children.',
      ),
      default: false,
    },
    opt('dataNascimento', ['Data de nascimento', 'Date of birth'], { type: 'date' }),
    opt('nacionalidade', ['Nacionalidade', 'Nationality'], { default: pessoa('nacionalidade') }),
    opt('naturalidade', ['Naturalidade', 'Place of birth'], { default: pessoa('naturalidade') }),
    opt('estadoCivil', ['Estado civil', 'Marital status'], { type: 'select', options: [{ value: '', label: l('Não indicar', 'Do not state') }, ...ESTADO_CIVIL_OPTIONS], default: '' }),
    opt('biNumero', ['BI n.º (não recomendado)', 'ID no. (not recommended)']),
    {
      name: 'perfil',
      type: 'textarea',
      section: 'perfil',
      rows: 4,
      label: l('Resumo (3 a 5 linhas)', 'Summary (3–5 lines)'),
      placeholder: l(
        'Técnica de contabilidade com cinco anos de experiência em PME, domínio do Primavera e do Excel, e forte rigor no cumprimento dos prazos fiscais.',
        'Who you are, your experience and what you bring.',
      ),
    },
    {
      name: 'experiencia',
      type: 'lines',
      section: 'experiencia',
      label: l('Empregos e estágios (o mais recente primeiro)', 'Jobs and internships (most recent first)'),
      addLabel: l('Adicionar experiência', 'Add experience'),
      columns: [
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
        { name: 'entidade', type: 'text', label: l('Entidade', 'Employer') },
        { name: 'local', type: 'text', label: l('Local', 'Place'), width: 'third' },
        { name: 'inicio', type: 'month', label: l('Início', 'From'), width: 'third' },
        { name: 'fim', type: 'month', label: l('Fim (vazio = actual)', 'To (empty = current)'), width: 'third' },
        { name: 'descricao', type: 'textarea', label: l('Funções e resultados (uma por linha)', 'Duties and results (one per line)') },
      ],
      default: [],
    },
    {
      name: 'formacao',
      type: 'lines',
      section: 'formacao',
      label: l('Formação académica', 'Education'),
      addLabel: l('Adicionar formação', 'Add education'),
      columns: [
        { name: 'nivel', type: 'select', label: l('Nível', 'Level'), options: NIVEIS.map((n) => ({ value: n.value, label: l(n.label[0], n.label[1]) })) },
        { name: 'curso', type: 'text', label: l('Curso', 'Course') },
        { name: 'instituicao', type: 'text', label: l('Instituição', 'Institution') },
        { name: 'local', type: 'text', label: l('Local', 'Place'), width: 'third' },
        { name: 'inicio', type: 'month', label: l('Início', 'From'), width: 'third' },
        { name: 'fim', type: 'month', label: l('Conclusão (vazio = a frequentar)', 'End (empty = ongoing)'), width: 'third' },
      ],
      default: [],
    },
    {
      name: 'formacaoComplementar',
      type: 'lines',
      section: 'formacao',
      label: l('Cursos, workshops e certificações', 'Courses and certifications'),
      addLabel: l('Adicionar curso', 'Add course'),
      columns: [
        { name: 'ano', type: 'text', label: l('Ano', 'Year'), width: 'third' },
        { name: 'curso', type: 'text', label: l('Curso', 'Course') },
        { name: 'entidade', type: 'text', label: l('Entidade', 'Provider') },
        { name: 'horas', type: 'number', label: l('Horas', 'Hours'), width: 'third' },
      ],
      default: [],
    },
    {
      name: 'linguas',
      type: 'lines',
      section: 'competencias',
      label: l('Línguas', 'Languages'),
      help: l('Inclua as línguas nacionais que fala (Changana, Emakhuwa, Sena, Ndau…): são uma mais-valia.', 'Include the national languages you speak: they are an asset.'),
      addLabel: l('Adicionar língua', 'Add language'),
      columns: [
        { name: 'lingua', type: 'text', label: l('Língua', 'Language') },
        { name: 'nivel', type: 'select', label: l('Nível', 'Level'), options: LINGUA_NIVEIS.map((n) => ({ value: n, label: l(n, n) })) },
      ],
      default: [{ lingua: 'Português', nivel: 'Fluente' }],
    },
    { name: 'competencias', type: 'textarea', section: 'competencias', rows: 3, label: l('Competências (uma por linha)', 'Skills (one per line)'), placeholder: l('Microsoft Excel (avançado)\nPrimavera ERP\nGestão de stocks', 'One per line') },
    { name: 'cartaConducao', type: 'text', section: 'competencias', width: 'half', label: l('Carta de condução (opcional)', "Driving licence (optional)"), placeholder: l('Ligeiros (B)', 'Light vehicles (B)') },
    { name: 'outras', type: 'textarea', section: 'competencias', rows: 2, label: l('Outras informações (opcional)', 'Other information (optional)'), placeholder: l('Voluntariado, associações profissionais, publicações', 'Volunteering, memberships') },
    {
      name: 'referenciasModo',
      type: 'radio',
      section: 'referencias',
      label: l('Referências', 'References'),
      options: [
        { value: 'pedido', label: l('Disponíveis mediante pedido', 'Available on request') },
        { value: 'listar', label: l('Indicar no CV', 'List them') },
        { value: 'nao', label: l('Não mencionar', 'Do not mention') },
      ],
      default: 'pedido',
    },
    {
      name: 'referencias',
      type: 'lines',
      section: 'referencias',
      label: l('Pessoas de referência', 'Referees'),
      addLabel: l('Adicionar referência', 'Add referee'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo e entidade', 'Position and organisation') },
        { name: 'telefone', type: 'tel', label: l('Telefone', 'Phone'), width: 'third' },
      ],
      default: [],
      showIf: (v) => v.referenciasModo === 'listar',
    },
    {
      name: 'declaracao',
      type: 'toggle',
      section: 'documento',
      label: l('Declaração de veracidade, datada e assinada', 'Signed statement of truthfulness'),
      help: l('Muitos concursos pedem o CV "datado e assinado".', 'Many competitions ask for a dated and signed CV.'),
      default: true,
    },
    localField('documento'),
    dateField('data', 'documento'),
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const out: Block[] = [];
    // Header
    out.push(disp(str(v.nome) || 'Nome Completo', 'xl', { align: 'left', weight: 'bold', fit: true, after: 1 }));
    if (str(v.tituloProfissional)) out.push(disp(str(v.tituloProfissional), 'md', { align: 'left', tone: 'accent', after: 3 }));
    const contactos = [str(v.cidade), str(v.telefone), str(v.email), str(v.linkedin)].filter(Boolean).join('   ·   ');
    if (contactos) out.push(disp(contactos, 'xs', { align: 'left', tone: 'muted', fit: true, after: 0 }));
    out.push({ type: 'ornament', style: 'rule', width: 'full' });

    if (v.mostrarDados) {
      const items = [
        str(v.dataNascimento) && { label: 'Data de nascimento', value: dateLong(v.dataNascimento) },
        str(v.nacionalidade) && { label: 'Nacionalidade', value: str(v.nacionalidade) },
        str(v.naturalidade) && { label: 'Naturalidade', value: str(v.naturalidade) },
        str(v.estadoCivil) && { label: 'Estado civil', value: str(v.estadoCivil) },
        str(v.biNumero) && { label: 'BI n.º', value: str(v.biNumero) },
      ].filter(Boolean) as { label: string; value: string }[];
      if (items.length) out.push({ type: 'keyValue', items, columns: 2 });
    }

    const head = (t: string) => out.push({ type: 'heading', text: t.toLocaleUpperCase('pt') });

    if (str(v.perfil)) {
      head('Perfil profissional');
      out.push({ type: 'paragraph', id: 'cv-perfil', text: str(v.perfil), en: 'Professional profile.', align: 'left', editable: false });
    }

    const exp = lineItems(v.experiencia).filter((r) => str(r.cargo) || str(r.entidade));
    if (exp.length) {
      head('Experiência profissional');
      exp.forEach((r, i) => {
        const sub = [[str(r.entidade), str(r.local)].filter(Boolean).join(', '), periodoCv(r.inicio, r.fim)].filter(Boolean).join('   ·   ');
        out.push({ type: 'paragraph', id: `cv-exp-${i}`, text: `**${str(r.cargo) || '—'}**${sub ? `\n${sub}` : ''}`, en: 'Work experience entry.', align: 'left', editable: false });
        const bullets = splitLines(r.descricao);
        if (bullets.length) out.push({ type: 'list', items: bullets });
      });
    }

    const form = lineItems(v.formacao).filter((r) => str(r.curso) || str(r.instituicao) || str(r.nivel));
    if (form.length) {
      head('Formação académica');
      form.forEach((r, i) => {
        const titulo = [str(r.nivel), str(r.curso)].filter(Boolean).join(str(r.nivel) && str(r.curso) ? (/Classe$/.test(str(r.nivel)) ? ' — ' : ' em ') : '');
        const sub = [[str(r.instituicao), str(r.local)].filter(Boolean).join(', '), periodoCv(r.inicio, r.fim, 'a frequentar')].filter(Boolean).join('   ·   ');
        out.push({ type: 'paragraph', id: `cv-form-${i}`, text: `**${titulo || '—'}**${sub ? `\n${sub}` : ''}`, en: 'Education entry.', align: 'left', editable: false });
      });
    }

    const comp = lineItems(v.formacaoComplementar).filter((r) => str(r.curso));
    if (comp.length) {
      head('Formação complementar');
      out.push({
        type: 'list',
        items: comp.map((r) => {
          const h = Number(r.horas);
          return [str(r.ano), `**${str(r.curso)}**`, str(r.entidade), h > 0 ? `${h} ${h === 1 ? 'hora' : 'horas'}` : ''].filter(Boolean).join(' · ');
        }),
      });
    }

    const ling = lineItems(v.linguas).filter((r) => str(r.lingua));
    const skills = splitLines(v.competencias);
    if (ling.length || skills.length || str(v.cartaConducao)) {
      head('Línguas e competências');
      if (ling.length)
        out.push({
          type: 'paragraph',
          id: 'cv-linguas',
          text: `**Línguas:** ${ling.map((r) => `${str(r.lingua)}${str(r.nivel) ? ` (${str(r.nivel).toLowerCase()})` : ''}`).join(' · ')}`,
          en: 'Languages.',
          align: 'left',
          editable: false,
        });
      if (skills.length)
        out.push({ type: 'paragraph', id: 'cv-competencias', text: `**Competências:** ${skills.map((x) => x.replace(/[.;]$/, '')).join(' · ')}`, en: 'Skills.', align: 'left', editable: false });
      if (str(v.cartaConducao)) out.push({ type: 'paragraph', id: 'cv-carta', text: `**Carta de condução:** ${str(v.cartaConducao)}`, en: 'Driving licence.', align: 'left', editable: false });
    }

    if (str(v.outras)) {
      head('Outras informações');
      out.push({ type: 'list', items: splitLines(v.outras) });
    }

    if (v.referenciasModo !== 'nao') {
      const refs = lineItems(v.referencias).filter((r) => str(r.nome));
      if (v.referenciasModo === 'listar' && refs.length) {
        head('Referências');
        out.push({ type: 'list', items: refs.map((r) => [`**${str(r.nome)}**`, str(r.cargo), str(r.telefone)].filter(Boolean).join(' · ')) });
      } else out.push({ type: 'paragraph', id: 'cv-ref', text: '**Referências:** disponíveis mediante pedido.', en: 'References available on request.', align: 'left' });
    }

    if (v.declaracao !== false) {
      out.push({ type: 'spacer', size: 'small' });
      out.push({
        type: 'paragraph',
        id: 'cv-declaracao',
        text: 'Declaro, sob compromisso de honra, que as informações constantes do presente curriculum vitae são verdadeiras.',
        en: 'I declare on my honour that the information in this CV is true.',
        align: 'left',
        size: 'small',
        keepWithNext: true,
      });
      // A light signature (a line to sign by hand) keeps a one-page CV on one page.
      out.push({
        type: 'paragraph',
        id: 'cv-assinatura',
        text: `${ctx.place}, ${dateLong(v.data)}\n\n\n______________________________\n${str(v.nome) || ' '}`,
        en: 'Place, date and signature.',
        align: 'left',
        size: 'small',
        editable: false,
      });
    }
    return out;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    out.push({
      level: 'info',
      message: l(
        `O CV não deve indicar religião, filiação partidária, estado de saúde ou de HIV, filiação nem filhos: o empregador não pode exigir esses dados (${cite('cvPrivacidadeCandidato')}).`,
        'A CV should not state religion, party, health or HIV status, parents or children: employers may not require them.',
      ),
    });
    if (v.mostrarDados && str(v.biNumero))
      out.push({ level: 'warning', field: 'biNumero', message: l('Evite publicar o número do BI no CV: facilita a usurpação de identidade. Entregue cópia do BI só quando lhe for pedida.', 'Avoid putting your ID number on a CV: it helps identity theft.') });
    if (v.mostrarDados && (str(v.estadoCivil) || str(v.dataNascimento)))
      out.push({ level: 'info', field: 'estadoCivil', message: l('Estado civil e data de nascimento não são necessários. Inclua-os apenas se o anúncio os pedir.', 'Marital status and birth date are not needed unless the advert asks.') });
    if (v.referenciasModo === 'listar' && lineItems(v.referencias).some((r) => str(r.telefone)))
      out.push({ level: 'info', field: 'referencias', message: l('Peça autorização às pessoas indicadas antes de divulgar o contacto delas.', 'Ask your referees before sharing their contacts.') });
    const entries = lineItems(v.experiencia).length + lineItems(v.formacao).length + lineItems(v.formacaoComplementar).length;
    const bullets = lineItems(v.experiencia).reduce((n, r) => n + splitLines(r.descricao).length, 0);
    if (entries * 2 + bullets > 46)
      out.push({ level: 'warning', field: 'experiencia', message: l('Um CV eficaz tem 1 a 2 páginas. Resuma as experiências mais antigas.', 'An effective CV is 1–2 pages. Shorten older roles.') });
    if (!lineItems(v.experiencia).length && !lineItems(v.formacao).length)
      out.push({ level: 'warning', field: 'experiencia', message: l('Acrescente a experiência ou a formação.', 'Add experience or education.') });
    if (v.declaracao !== false)
      out.push({
        level: 'info',
        field: 'declaracao',
        message: l(
          `Informações falsas podem levar à anulação do contrato de trabalho (${cite('contratoTrabalhoInvalidadePrazo')}) e, se houver documentos falsificados, a responsabilidade criminal.`,
          'False information may lead to the contract being annulled and, with forged documents, to criminal liability.',
        ),
      });
    return out;
  },
  personName: (v) => str(v.nome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
