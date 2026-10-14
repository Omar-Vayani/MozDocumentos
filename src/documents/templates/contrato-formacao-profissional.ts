// Contrato de formação profissional: a training centre and a trainee (or the
// parent of a minor) agree on a course — content, hours, dates, price,
// attendance, assessment, certificate, withdrawal and refunds. It is not an
// employment contract. Accredited courses lead to national qualifications.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, DOC_TIPO_OPTIONS, GENERO_OPTIONS, l, money } from './_shared';
import {
  assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings,
  pct, quantos, semPonto, str, testemunhasField, valorTexto,
} from './_contratos';

const DESISTENCIA_OPTIONS = [
  { value: 'proporcional', label: l('Reembolso proporcional às aulas não dadas', 'Refund in proportion to classes not given') },
  { value: 'antes', label: l('Reembolso só se desistir antes do início', 'Refund only before the start') },
  { value: 'nenhum', label: l('Sem reembolso (excepto cancelamento pelo centro)', 'No refund (except cancellation by the centre)') },
];

export default defineTemplate({
  id: 'contrato-formacao-profissional',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'centro', title: l('Centro de formação', 'Training centre') },
    { id: 'formando', title: l('Formando', 'Trainee'), personRole: 'cliente' },
    { id: 'representante', title: l('Representante (formando menor)', 'Representative (minor trainee)') },
    { id: 'curso', title: l('Curso', 'Course') },
    { id: 'preco', title: l('Preço e pagamento', 'Price and payment') },
    { id: 'regras', title: l('Assiduidade, certificado e desistência', 'Attendance, certificate and withdrawal') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('centro', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('formando'),
    { name: 'menor', type: 'toggle', section: 'representante', label: l('O formando é menor (assina o encarregado)', 'The trainee is a minor (parent signs)') },
    { name: 'repNome', type: 'text', section: 'representante', width: 'half', label: l('Nome do encarregado', 'Parent’s name'), showIf: (v) => Boolean(v.menor) },
    { name: 'repGenero', type: 'radio', section: 'representante', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'F', showIf: (v) => Boolean(v.menor) },
    { name: 'repDocTipo', type: 'select', section: 'representante', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => Boolean(v.menor) },
    { name: 'repDocNumero', type: 'text', section: 'representante', width: 'half', label: l('Número', 'Number'), showIf: (v) => Boolean(v.menor) },
    { name: 'curso', type: 'text', section: 'curso', required: true, label: l('Curso', 'Course'), placeholder: l('Ex.: Electricidade de Instalações — Nível 3', 'E.g. Electrical installation — level 3') },
    { name: 'acreditado', type: 'toggle', section: 'curso', label: l('Curso acreditado pela ANEP (qualificação nacional)', 'ANEP-accredited course (national qualification)') },
    { name: 'acreditacaoRef', type: 'text', section: 'curso', width: 'half', label: l('Referência da acreditação', 'Accreditation reference'), showIf: (v) => Boolean(v.acreditado) },
    { name: 'cargaHoraria', type: 'number', section: 'curso', width: 'half', min: 1, label: l('Carga horária (horas)', 'Total hours') },
    { name: 'dataInicio', type: 'date', section: 'curso', width: 'half', label: l('Início', 'Start') },
    { name: 'dataFim', type: 'date', section: 'curso', width: 'half', label: l('Fim previsto', 'Expected end') },
    { name: 'horario', type: 'text', section: 'curso', label: l('Horário', 'Schedule'), placeholder: l('Ex.: de segunda a sexta-feira, das 17h30 às 20h30', 'E.g. weekdays 5.30–8.30 pm') },
    { name: 'localFormacao', type: 'text', section: 'curso', label: l('Local', 'Place') },
    { name: 'estagio', type: 'toggle', section: 'curso', label: l('Inclui estágio prático', 'Includes practical placement') },
    { name: 'conteudo', type: 'textarea', section: 'curso', rows: 3, label: l('Módulos (opcional)', 'Modules (optional)'), help: l('Um por linha. Em alternativa, o programa vai em anexo.', 'One per line, or attach the programme.') },
    { name: 'valorTotal', type: 'money', section: 'preco', width: 'half', required: true, label: l('Preço total do curso', 'Total course price') },
    { name: 'inscricao', type: 'money', section: 'preco', width: 'half', label: l('Taxa de inscrição (opcional)', 'Registration fee (optional)') },
    { name: 'prestacoes', type: 'number', section: 'preco', width: 'half', min: 1, max: 36, default: 1, label: l('N.º de prestações', 'Instalments') },
    { name: 'diaPagamento', type: 'number', section: 'preco', width: 'half', min: 1, max: 31, default: 5, label: l('Pagamento até ao dia', 'Paid by day'), showIf: (v) => Number(v.prestacoes) > 1 },
    { name: 'materialIncluido', type: 'toggle', section: 'preco', default: true, label: l('Material didáctico incluído', 'Course materials included') },
    { name: 'seguro', type: 'toggle', section: 'preco', label: l('Seguro de acidentes pessoais incluído', 'Personal accident insurance included') },
    { name: 'assiduidadeMin', type: 'number', section: 'regras', width: 'half', min: 1, max: 100, default: 80, label: l('Assiduidade mínima para o certificado (%)', 'Minimum attendance for the certificate (%)') },
    { name: 'desistencia', type: 'select', section: 'regras', label: l('Desistência do formando', 'Withdrawal by the trainee'), options: DESISTENCIA_OPTIONS, default: 'antes' },
    foroField('regras'),
    testemunhasField('regras'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'centro', 'centro', 'centre'), ...partyWarnings(v, 'formando', 'formando', 'trainee')];
    if (money(v.valorTotal) == null) w.push({ level: 'warning', field: 'valorTotal', message: l('Indique o preço do curso.', 'Enter the course price.') });
    w.push({
      level: 'info',
      message: l(
        `Só os cursos acreditados conferem qualificação profissional do sistema nacional (${cite('seFormacaoProfissional')}). O formando é consumidor: preço, condições e regras de desistência devem ser claros (${cite('eduConsumidorEnsino')}).`,
        'Only accredited courses give national qualifications. The trainee is a consumer: price, terms and withdrawal rules must be clear.',
      ),
    });
    if (v.menor && !str(v.repNome)) w.push({ level: 'warning', field: 'repNome', message: l('Indique o encarregado que assina pelo menor.', 'Enter the parent signing for the minor.') });
    return w;
  },

  personName: (v) => partyName(v, 'formando') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const C = { ...papel(v, 'centro', 'Centro', 'Centro'), f: false, o: 'o Centro', O: 'O Centro', de: 'do Centro', ao: 'ao Centro', pelo: 'pelo Centro' };
    const F = papel(v, 'formando', 'Formando', 'Formanda');
    const total = money(v.valorTotal);
    const insc = money(v.inscricao);
    const n = int(v.prestacoes) ?? 1;
    const horas = int(v.cargaHoraria);
    const mods = str(v.conteudo).split(/\n+/).map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim()).filter(Boolean);
    const des = str(v.desistencia) || 'antes';
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: numerar([
          `${C.O} obriga-se a ministrar ${F.ao} o curso de **${semPonto(v.curso) || '____________________'}**${horas ? `, com a carga horária de ${quantos(horas, 'hora', 'horas', true)}` : ''}${str(v.dataInicio) ? `, de ${dateLong(v.dataInicio)}${str(v.dataFim) ? ` a ${dateLong(v.dataFim)}` : ''}` : ''}${str(v.horario) ? `, ${semPonto(v.horario)}` : ''}${str(v.localFormacao) ? `, em ${semPonto(v.localFormacao)}` : ''}, em regime presencial${v.estagio ? ', incluindo um estágio prático' : ''}.`,
          mods.length ? `O curso compreende os seguintes módulos: ${mods.map((m) => m.replace(/[.;]+$/, '')).join('; ')}.` : 'O programa do curso consta do anexo ao presente contrato.',
          v.acreditado ? `O curso está acreditado${str(v.acreditacaoRef) ? ` (${semPonto(v.acreditacaoRef)})` : ''} e confere, com aproveitamento, a qualificação profissional correspondente.` : 'O curso não confere qualificação do sistema nacional de qualificações profissionais, dando direito ao certificado do Centro.',
        ]),
        en: 'Course, hours, dates, schedule, place and modules; accreditation status.',
      },
      {
        id: 'natureza',
        heading: 'Natureza do contrato',
        text: `O presente contrato é de prestação de serviços de formação e não constitui contrato de trabalho nem de aprendizagem: ${F.o} não presta trabalho subordinado ${C.ao}${v.estagio ? ' e o estágio prático tem fim exclusivamente formativo' : ''}.`,
        en: 'This is a training services contract, not an employment or apprenticeship contract.',
      },
      {
        id: 'preco',
        heading: 'Preço e pagamento',
        text: numerar([
          `O preço do curso é de ${valorTexto(total)}${v.materialIncluido ? ', incluindo o material didáctico' : ''}${v.seguro ? ' e o seguro de acidentes pessoais durante a formação' : ''}${insc != null ? `, acrescido da taxa de inscrição de ${valorTexto(insc)}` : ''}.`,
          n > 1 ? `O preço é pago em ${quantos(n, 'prestação', 'prestações', true)} mensais${total != null ? ` de ${valorTexto(Math.round((total / n) * 100) / 100)}` : ''}, até ao dia ${int(v.diaPagamento) ?? '____'} de cada mês, a primeira na data do início do curso.` : 'O preço é pago de uma só vez, até à data do início do curso.',
          `${C.O} entrega recibo de cada pagamento. A falta de pagamento de uma prestação por mais de um mês permite ${C.ao} suspender a frequência até à regularização, depois de aviso escrito.`,
        ]),
        en: 'Price, instalments, receipts; suspension after written notice if payment is over a month late.',
      },
      {
        id: 'centro',
        heading: 'Obrigações do Centro',
        text: `${C.O} obriga-se a assegurar formadores qualificados, as instalações, o equipamento e o material necessários, a informar ${F.o} sobre o regulamento, o calendário e os critérios de avaliação, e a repor as sessões que não se realizem por facto que lhe seja imputável.`,
        en: 'Qualified trainers, premises, equipment and materials; information on rules, calendar and assessment; make-up of sessions cancelled by the centre.',
      },
      {
        id: 'formando',
        heading: 'Obrigações do formando',
        text: `${F.O} obriga-se a frequentar o curso com assiduidade e pontualidade, a cumprir o regulamento ${C.de} e as regras de segurança, a tratar com cuidado o equipamento, respondendo pelos danos causados com culpa, e a pagar o preço nos prazos acordados.`,
        en: 'Attendance, punctuality, rules and safety, care of equipment, payment.',
      },
      {
        id: 'certificado',
        heading: 'Avaliação e certificado',
        text: `${F.O} que obtenha aproveitamento na avaliação e tenha uma assiduidade não inferior a ${pct(v.assiduidadeMin)} das horas do curso recebe o certificado correspondente; não reunindo essas condições, recebe, a seu pedido, declaração de frequência.`,
        en: 'Certificate on passing the assessment with the minimum attendance; otherwise an attendance statement on request.',
      },
      {
        id: 'desistencia',
        heading: 'Desistência e cancelamento',
        text: numerar([
          des === 'proporcional'
            ? `${F.O} pode desistir a todo o tempo, por escrito, sendo-lhe reembolsada a parte do preço correspondente às horas ainda não ministradas, deduzida a taxa de inscrição.`
            : des === 'antes'
              ? `${F.O} pode desistir por escrito antes do início do curso, sendo-lhe reembolsado o preço pago, deduzida a taxa de inscrição; depois do início, não há lugar a reembolso, mas cessam as prestações ainda não vencidas.`
              : `${F.O} pode desistir a todo o tempo, por escrito; os valores pagos não são reembolsados, cessando as prestações ainda não vencidas.`,
          `Se ${C.o} cancelar o curso ou não o iniciar na data prevista, reembolsa integralmente os valores pagos, incluindo a taxa de inscrição.`,
        ]),
        en: 'Withdrawal and refunds as chosen; full refund if the centre cancels or does not start the course.',
      },
      {
        id: 'imagem',
        heading: 'Dados pessoais e imagem',
        text: `${C.O} usa os dados pessoais ${F.de} apenas para a gestão da formação e não publica a sua imagem sem consentimento escrito.`,
        en: 'Personal data used only for the training; no publication of images without written consent.',
      },
      ...clausulasFinais(v),
    ];
    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Formação Profissional' },
      ...partesBlocks(v, [
        { p: 'centro', role: C, en: 'Centre' },
        { p: 'formando', role: F, en: 'Trainee' },
      ]),
    ];
    if (v.menor) {
      blocks.push({ type: 'paragraph', id: 'representante', text: `${F.O}, menor, é ${F.f ? 'representada' : 'representado'} neste acto por **${str(v.repNome) || '____________________'}**, ${v.repGenero === 'F' ? 'portadora' : 'portador'} do ${str(v.repDocTipo) || 'BI'} n.º ${str(v.repDocNumero) || '__________'}, na qualidade de ${v.repGenero === 'F' ? 'encarregada' : 'encarregado'} de educação.`, en: 'The minor trainee is represented by the parent named.' });
    }
    blocks.push(
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de formação profissional, que se rege pelas cláusulas seguintes:', en: 'This vocational training contract is made on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
    );
    const cols = [assinatura(ctx, 'centro', C, true), assinatura(ctx, 'formando', F)];
    blocks.push(...fecho(ctx, cols, { extraCols: v.menor ? [{ role: 'O(A) Encarregado(a) de Educação', name: str(v.repNome) || undefined }] : [] }));
    return blocks;
  },
});
