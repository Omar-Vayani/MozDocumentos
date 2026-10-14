// Carta de boas-vindas e plano de integração: what a new employee needs for the
// first day (when, where, whom to ask for, documents to bring) and the
// integration plan for the first weeks, including the internal rules to read.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, employerName, employerSignature, l, lineItems, localField, refField, workerFields } from './_shared';
import { wk } from './_contrato-trabalho';
import { cartaAoTrabalhador, str } from './_rh-politicas';

export default defineTemplate({
  id: 'carta-de-boas-vindas',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Novo trabalhador', 'New employee'), personRole: 'trabalhador' },
    { id: 'primeiroDia', title: l('Primeiro dia', 'First day') },
    { id: 'plano', title: l('Plano de integração', 'Onboarding plan') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'dataAdmissao']).map((f) => (f.name === 'trabalhadorDataAdmissao' ? { ...f, label: l('Data de início', 'Start date'), required: true } : f)),
    { name: 'hora', type: 'text', section: 'primeiroDia', width: 'half', label: l('Hora de apresentação', 'Reporting time'), default: '8h00' },
    { name: 'localApresentacao', type: 'text', section: 'primeiroDia', width: 'half', label: l('Local de apresentação', 'Where to report'), placeholder: l('Ex.: na recepção da sede', 'E.g. at head office reception'), help: l('Escreva com a preposição: "na recepção da sede", "no estaleiro da Matola".', 'Include the preposition.') },
    { name: 'contactoNome', type: 'text', section: 'primeiroDia', width: 'half', label: l('Procurar por (nome e cargo)', 'Ask for (name and position)') },
    { name: 'contactoTelefone', type: 'text', section: 'primeiroDia', width: 'half', label: l('Telefone', 'Phone') },
    { name: 'horario', type: 'text', section: 'primeiroDia', label: l('Horário de trabalho', 'Working hours'), placeholder: l('Ex.: segunda a sexta-feira, das 7h30 às 16h30', 'E.g. Monday to Friday, 7:30 to 16:30') },
    {
      name: 'documentos',
      type: 'lines',
      section: 'primeiroDia',
      label: l('Documentos a trazer', 'Documents to bring'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [
        { descricao: 'Bilhete de Identidade (original e cópia)' },
        { descricao: 'Cartão do NUIT' },
        { descricao: 'Cartão de beneficiário do INSS, se já tiver' },
        { descricao: 'Dados da conta bancária ou da carteira móvel para o pagamento do salário' },
        { descricao: 'Duas fotografias tipo passe' },
      ],
    },
    { name: 'mentor', type: 'text', section: 'plano', label: l('Acompanhante / mentor (nome e cargo)', 'Buddy / mentor (name and position)') },
    {
      name: 'plano',
      type: 'lines',
      section: 'plano',
      label: l('Plano de integração', 'Onboarding plan'),
      addLabel: l('Adicionar etapa', 'Add step'),
      columns: [
        { name: 'quando', type: 'text', label: l('Quando', 'When') },
        { name: 'actividade', type: 'text', label: l('Actividade', 'Activity') },
        { name: 'responsavel', type: 'text', label: l('Responsável', 'Who') },
      ],
      default: [
        { quando: '1.º dia', actividade: 'Acolhimento, assinatura do contrato, apresentação à equipa e visita às instalações', responsavel: 'Recursos Humanos e chefia' },
        { quando: '1.ª semana', actividade: 'Leitura do regulamento interno, do código de conduta e das regras de segurança', responsavel: 'Recursos Humanos' },
        { quando: '1.ª semana', actividade: 'Formação sobre os riscos do posto e entrega dos equipamentos de protecção', responsavel: 'Higiene e Segurança' },
        { quando: '1.º mês', actividade: 'Acompanhamento das tarefas e reunião de balanço', responsavel: 'Chefia directa' },
      ],
    },
    { name: 'periodoProbatorio', type: 'text', section: 'plano', width: 'half', label: l('Período probatório (se houver)', 'Probation (if any)'), placeholder: l('Ex.: três meses', 'E.g. three months') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!v.trabalhadorDataAdmissao) w.push({ level: 'warning', field: 'trabalhadorDataAdmissao', message: l('Indique a data de início.', 'Enter the start date.') });
    w.push({ level: 'info', message: l('Inscreva o trabalhador no INSS e no seguro de acidentes de trabalho a partir do primeiro dia.', 'Register the employee with INSS and the work-accident insurance from day one.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const W = wk(v.trabalhadorGenero);
    const docs = lineItems(v.documentos).map((r) => str(r.descricao)).filter(Boolean);
    const plano = lineItems(v.plano).filter((r) => str(r.actividade));
    const empresa = employerName(ctx);
    const blocks: Block[] = [
      ...cartaAoTrabalhador(ctx, 'Boas-vindas e integração'),
      {
        type: 'paragraph',
        id: 'boasVindas',
        text: `Damos as boas-vindas a V. Ex.ª, que passa a integrar ${empresa === BLANK ? 'a nossa equipa' : `a equipa de ${empresa}`} como **${str(v.trabalhadorCargo) || BLANK}**${str(v.trabalhadorDepartamento) ? `, no departamento de ${str(v.trabalhadorDepartamento)}` : ''}.`,
        en: `Welcome to the team as ${v.trabalhadorCargo || '—'}.`,
      },
      {
        type: 'paragraph',
        id: 'primeiroDia',
        text: `No seu primeiro dia de trabalho, **${dateLong(v.trabalhadorDataAdmissao)}**, deve apresentar-se${[str(v.hora) ? ` às ${str(v.hora)}` : '', str(v.localApresentacao) ? ` ${str(v.localApresentacao)}` : ''].join('') || ' ao serviço'}${str(v.contactoNome) ? `, procurando ${str(v.contactoNome)}` : ''}${str(v.contactoTelefone) ? ` (telefone ${str(v.contactoTelefone)})` : ''}.${str(v.horario) ? ` O seu horário de trabalho será: ${str(v.horario).replace(/\.$/, '')}.` : ''}`,
        en: 'Where and when to report on the first day, whom to ask for and the working hours.',
      },
    ];
    if (docs.length) blocks.push({ type: 'paragraph', id: 'documentos', text: `Pedimos que traga, para o seu processo individual e a inscrição no INSS: ${docs.map((d) => d.charAt(0).toLowerCase() + d.slice(1).replace(/[.;]$/, '')).join('; ')}.`, en: 'Please bring the documents listed.' });
    if (plano.length) {
      blocks.push(
        { type: 'paragraph', id: 'plano', text: `Para facilitar a sua integração, preparámos o plano seguinte${str(v.mentor) ? `; durante as primeiras semanas será ${W.a('acompanhado', 'acompanhada')} por ${str(v.mentor)}` : ''}:`, en: 'Onboarding plan:', keepWithNext: true },
        {
          type: 'table',
          columns: [
            { label: 'Quando', width: 0.16 },
            { label: 'Actividade', width: 0.6 },
            { label: 'Responsável', width: 0.24 },
          ],
          rows: plano.map((r) => [str(r.quando), str(r.actividade), str(r.responsavel)]),
        },
      );
    }
    if (str(v.periodoProbatorio)) {
      blocks.push({ type: 'paragraph', id: 'probatorio', text: `Conforme o seu contrato, os primeiros ${str(v.periodoProbatorio).replace(/\.$/, '')} correspondem ao período probatório, durante o qual a sua chefia acompanhará de perto o seu trabalho e estará disponível para esclarecer as dúvidas que surjam.`, en: 'Probation as stated in the contract, with close support from the supervisor.' });
    }
    {
      blocks.push({ type: 'paragraph', id: 'votos', text: 'Desejamos-lhe os maiores sucessos nas novas funções.', en: 'We wish you every success.', keepWithNext: true });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours sincerely,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'Os Recursos Humanos')] },
    );
    return blocks;
  },
});
