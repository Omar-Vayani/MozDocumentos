// Contrato de explicações: a tutor or tutoring centre gives private lessons to
// a pupil, contracted by the parent: subjects, schedule, place, price,
// cancellations, child-protection rules and termination.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, GENERO_OPTIONS, l, money } from './_shared';
import {
  assinatura, clausulasFinais, documentoFields, fecho, foroField, int, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings,
  quantos, semPonto, str, valorTexto,
} from './_contratos';

const LOCAL_OPTIONS = [
  { value: 'residencia', label: l('Na residência do aluno', 'At the pupil’s home') },
  { value: 'centro', label: l('No centro ou na casa do explicador', 'At the tutor’s centre or home') },
  { value: 'outro', label: l('Outro local', 'Other place') },
];

export default defineTemplate({
  id: 'contrato-de-explicacoes',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'explicador', title: l('Explicador ou centro', 'Tutor or centre') },
    { id: 'encarregado', title: l('Encarregado de educação', 'Parent or guardian'), personRole: 'cliente' },
    { id: 'aluno', title: l('Aluno', 'Pupil') },
    { id: 'explicacoes', title: l('Explicações', 'Lessons') },
    { id: 'preco', title: l('Preço e condições', 'Price and terms') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('explicador', { fromProfile: true }),
    ...partyFields('encarregado'),
    { name: 'alunoNome', type: 'text', section: 'aluno', required: true, label: l('Nome do aluno', 'Pupil’s name') },
    { name: 'alunoGenero', type: 'radio', section: 'aluno', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'alunoClasse', type: 'text', section: 'aluno', width: 'half', label: l('Classe', 'Grade'), placeholder: l('Ex.: 10.ª classe', 'E.g. 10th grade') },
    { name: 'alunoEscola', type: 'text', section: 'aluno', width: 'half', label: l('Escola que frequenta (opcional)', 'School attended (optional)') },
    { name: 'disciplinas', type: 'text', section: 'explicacoes', required: true, label: l('Disciplinas', 'Subjects'), placeholder: l('Ex.: Matemática e Física', 'E.g. Maths and Physics') },
    { name: 'objectivo', type: 'text', section: 'explicacoes', label: l('Objectivo (opcional)', 'Goal (optional)'), placeholder: l('Ex.: preparação para os exames da 10.ª classe', 'E.g. exam preparation') },
    { name: 'sessoesSemana', type: 'number', section: 'explicacoes', width: 'half', min: 1, max: 14, default: 2, label: l('Sessões por semana', 'Sessions per week') },
    { name: 'duracaoSessao', type: 'text', section: 'explicacoes', width: 'half', label: l('Duração de cada sessão', 'Session length'), default: 'uma hora e meia' },
    { name: 'horario', type: 'text', section: 'explicacoes', label: l('Dias e horas', 'Days and times'), placeholder: l('Ex.: terças e quintas-feiras, das 15h00 às 16h30', 'E.g. Tue and Thu, 3–4.30 pm') },
    { name: 'localTipo', type: 'select', section: 'explicacoes', width: 'half', label: l('Local', 'Place'), options: LOCAL_OPTIONS, default: 'residencia' },
    { name: 'localTexto', type: 'text', section: 'explicacoes', width: 'half', label: l('Endereço', 'Address') },
    { name: 'dataInicio', type: 'date', section: 'explicacoes', width: 'half', label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'explicacoes', width: 'half', label: l('Fim (opcional)', 'End (optional)') },
    {
      name: 'precoModo',
      type: 'radio',
      section: 'preco',
      label: l('Preço', 'Price'),
      options: [
        { value: 'mes', label: l('Valor mensal', 'Monthly') },
        { value: 'sessao', label: l('Por sessão', 'Per session') },
      ],
      default: 'mes',
    },
    { name: 'preco', type: 'money', section: 'preco', width: 'half', required: true, label: l('Valor', 'Amount') },
    { name: 'diaPagamento', type: 'number', section: 'preco', width: 'half', min: 1, max: 31, default: 5, label: l('Pagamento até ao dia', 'Paid by day') },
    { name: 'avisoFaltaHoras', type: 'number', section: 'preco', width: 'half', min: 1, max: 72, default: 24, label: l('Aviso para desmarcar (horas)', 'Notice to cancel (hours)') },
    { name: 'relatorio', type: 'toggle', section: 'preco', default: true, label: l('Informação mensal ao encarregado sobre o progresso', 'Monthly progress update') },
    { name: 'adultoPresente', type: 'toggle', section: 'preco', default: true, label: l('Na residência, as sessões decorrem com um adulto da família em casa', 'At home, an adult of the family is present') },
    { name: 'avisoDenuncia', type: 'number', section: 'preco', width: 'half', min: 1, max: 90, default: 15, label: l('Aviso para terminar (dias)', 'Notice to end (days)') },
    foroField('preco'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'explicador', 'explicador', 'tutor'), ...partyWarnings(v, 'encarregado', 'encarregado', 'parent')];
    if (money(v.preco) == null) w.push({ level: 'warning', field: 'preco', message: l('Indique o preço.', 'Enter the price.') });
    w.push({
      level: 'info',
      message: l(
        `Um centro de explicações que funcione como estabelecimento de ensino privado precisa de licença (${cite('eduEnsinoPrivadoLicenca')}). O explicador que trabalha por conta própria deve ter NUIT e declarar os rendimentos.`,
        'A tutoring centre operating as a private school needs a licence. Self-employed tutors need a tax number and must declare income.',
      ),
    });
    return w;
  },

  personName: (v) => str(v.alunoNome) || partyName(v, 'encarregado') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const X = papel(v, 'explicador', 'Explicador', 'Explicadora');
    const E = papel(v, 'encarregado', 'Encarregado de Educação', 'Encarregada de Educação');
    const fa = v.alunoGenero === 'F';
    const aluno = `${fa ? 'à sua educanda' : 'ao seu educando'} **${str(v.alunoNome) || '____________________'}**${str(v.alunoClasse) ? `, ${fa ? 'aluna' : 'aluno'} da ${str(v.alunoClasse)}` : ''}${str(v.alunoEscola) ? ` (${str(v.alunoEscola)})` : ''}`;
    const local =
      v.localTipo === 'residencia'
        ? `na residência ${fa ? 'da aluna' : 'do aluno'}${str(v.localTexto) ? `, em ${semPonto(v.localTexto)}` : ''}`
        : v.localTipo === 'centro'
          ? `nas instalações ${X.de}${str(v.localTexto) ? `, em ${semPonto(v.localTexto)}` : ''}`
          : `em ${semPonto(v.localTexto) || '____________________'}`;
    const preco = money(v.preco);
    const ses = int(v.sessoesSemana);
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${X.O} obriga-se a dar explicações de **${semPonto(v.disciplinas) || '____________________'}** ${aluno}${str(v.objectivo) ? `, tendo em vista ${semPonto(v.objectivo)}` : ''}, e ${E.o} obriga-se a pagar o preço acordado.`,
        en: 'The tutor will give private lessons in the subjects stated; the parent will pay the agreed price.',
      },
      {
        id: 'sessoes',
        heading: 'Sessões, horário e local',
        text: numerar([
          `As explicações decorrem em ${quantos(ses, 'sessão', 'sessões', true)} por semana, de ${semPonto(v.duracaoSessao) || '____'} cada${str(v.horario) ? `, ${semPonto(v.horario)}` : ''}, ${local}.`,
          `O contrato produz efeitos a partir de ${dateLong(v.dataInicio)}${str(v.dataFim) ? ` e termina em ${dateLong(v.dataFim)}` : ''}.`,
          'As alterações pontuais de horário são combinadas entre as partes com a antecedência possível.',
        ]),
        en: 'Number, length, times and place of the sessions; start and end.',
      },
      {
        id: 'preco',
        heading: 'Preço e pagamento',
        text: numerar([
          v.precoModo === 'sessao'
            ? `O preço é de ${valorTexto(preco)} por sessão, pago mensalmente, até ao dia ${int(v.diaPagamento) ?? '____'} do mês seguinte, pelas sessões efectivamente dadas.`
            : `O preço mensal é de ${valorTexto(preco)}, pago até ao dia ${int(v.diaPagamento) ?? '____'} de cada mês.`,
          `${X.O} entrega recibo de cada pagamento.`,
        ]),
        en: 'Price per month or per session, payment date, receipt for each payment.',
      },
      {
        id: 'faltas',
        heading: 'Faltas e desmarcações',
        text: numerar([
          `A sessão desmarcada pelo encarregado ou pelo aluno com menos de ${quantos(int(v.avisoFaltaHoras), 'hora', 'horas', true)} de antecedência considera-se dada${v.precoModo === 'sessao' ? ' e é paga' : ''}, salvo doença ou motivo de força maior.`,
          `A sessão que ${X.o} não possa dar é reposta em data a combinar${v.precoModo === 'sessao' ? '' : ' ou descontada no mês seguinte'}.`,
        ]),
        en: 'Late cancellations count as given (except illness or force majeure); sessions missed by the tutor are made up or deducted.',
      },
      {
        id: 'deveres',
        heading: 'Deveres das partes',
        text: numerar([
          `${X.O} prepara as sessões de acordo com o programa da classe${v.relatorio ? `, informa mensalmente ${E.o} sobre o progresso ${fa ? 'da aluna' : 'do aluno'}` : ''} e não garante resultados, que dependem também do empenho ${fa ? 'da aluna' : 'do aluno'}.`,
          `${E.O} assegura a presença pontual ${fa ? 'da aluna' : 'do aluno'} e o material necessário${v.localTipo === 'residencia' ? ', bem como um local adequado ao estudo' : ''}.`,
        ]),
        en: 'The tutor prepares lessons and reports progress without guaranteeing results; the parent ensures attendance and materials.',
      },
      {
        id: 'protecao',
        heading: 'Protecção do aluno',
        text: numerar([
          `${X.O} trata ${fa ? 'a aluna' : 'o aluno'} com respeito, abstendo-se de qualquer castigo físico, humilhação ou comportamento impróprio, e não partilha fotografias ou dados ${fa ? 'da aluna' : 'do aluno'} sem autorização ${E.de}.`,
          v.localTipo === 'residencia' && v.adultoPresente ? 'As sessões na residência decorrem com a presença em casa de um adulto da família.' : '',
        ]),
        en: 'Respectful treatment, no physical punishment or improper behaviour, no sharing of the pupil’s photos or data; an adult present at home.',
      },
      {
        id: 'cessacao',
        heading: 'Duração e cessação',
        text: `Qualquer das partes pode pôr termo ao contrato por escrito, incluindo mensagem, com a antecedência de ${quantos(int(v.avisoDenuncia), 'dia', 'dias')}, sendo devido apenas o preço das sessões já dadas.`,
        en: 'Either party may end the contract in writing (a message is enough) with the notice stated; only sessions given are paid.',
      },
      ...clausulasFinais(v).filter((c) => c.id !== 'alteracoes'),
    ];
    return [
      { type: 'title', text: 'Contrato de Explicações' },
      ...partesBlocks(v, [
        { p: 'explicador', role: X, en: 'Tutor' },
        { p: 'encarregado', role: E, en: 'Parent' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de prestação de serviços de explicações, que se rege pelas cláusulas seguintes:', en: 'This private tutoring contract is made on the following terms:' },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fecho(ctx, [assinatura(ctx, 'explicador', X, true), assinatura(ctx, 'encarregado', E)]),
    ] as Block[];
  },
});
