// Contrato de aprendizagem: the company trains an apprentice in a trade, with
// other institutions. Written form with the mandatory content (parties,
// content and length, hours and place, training allowance, termination
// terms). It does not make the apprentice an employee; a promise of employment
// may be added. Minors sign with their legal representative.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { ageOn, identificacao, pessoaFields } from './_pessoal-rh';
import { BLANK, cite, dateField, dateLong, employerParty, employerSignature, isF, l, localField, money, placeDate, refField } from './_shared';
import { doCite, moneyExt, qty } from './_contrato-trabalho';
import { linhas, refCite, str } from './_rh-politicas';

export default defineTemplate({
  id: 'contrato-de-aprendizagem',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'aprendiz', title: l('Aprendiz', 'Apprentice'), personRole: 'outro' },
    { id: 'representante', title: l('Representante legal (aprendiz menor)', 'Legal representative (minor)') },
    { id: 'aprendizagem', title: l('Aprendizagem', 'Apprenticeship') },
    { id: 'bolsa', title: l('Bolsa e condições', 'Allowance and terms') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    ...pessoaFields('aprendiz', 'aprendiz'),
    { name: 'aprendizNascimento', type: 'date', section: 'aprendiz', width: 'half', required: true, label: l('Data de nascimento', 'Date of birth') },
    { name: 'representanteNome', type: 'text', section: 'representante', width: 'half', label: l('Nome do representante legal', 'Legal representative’s name'), help: l('Preencha se o aprendiz for menor de idade.', 'Fill in if the apprentice is a minor.') },
    { name: 'representanteQualidade', type: 'text', section: 'representante', width: 'half', label: l('Qualidade', 'Capacity'), placeholder: l('Ex.: pai', 'E.g. father') },
    { name: 'representanteDoc', type: 'text', section: 'representante', width: 'half', label: l('BI n.º do representante', 'Representative’s ID no.') },
    { name: 'profissao', type: 'text', section: 'aprendizagem', required: true, label: l('Profissão / especialidade', 'Trade'), placeholder: l('Ex.: serralheiro mecânico', 'E.g. mechanical fitter') },
    { name: 'conteudo', type: 'textarea', section: 'aprendizagem', rows: 4, required: true, label: l('Conteúdo da aprendizagem (um módulo por linha)', 'Content (one module per line)'), legal: l('Menção obrigatória do contrato.', 'Mandatory content.') },
    { name: 'instituicao', type: 'text', section: 'aprendizagem', label: l('Instituição colaboradora (opcional)', 'Partner institution (optional)'), placeholder: l('Ex.: Instituto Industrial de Maputo', 'E.g. Maputo Industrial Institute') },
    { name: 'dataInicio', type: 'date', section: 'aprendizagem', width: 'half', required: true, label: l('Início', 'Start') },
    { name: 'dataFim', type: 'date', section: 'aprendizagem', width: 'half', required: true, label: l('Fim', 'End') },
    { name: 'horario', type: 'text', section: 'aprendizagem', required: true, label: l('Horário', 'Hours'), placeholder: l('Ex.: segunda a sexta-feira, das 8h00 às 13h00', 'E.g. Monday to Friday, 8:00 to 13:00') },
    { name: 'localAprendizagem', type: 'text', section: 'aprendizagem', required: true, label: l('Local', 'Place') },
    { name: 'orientador', type: 'text', section: 'aprendizagem', label: l('Orientador (nome e função)', 'Supervisor (name and job)') },
    { name: 'bolsa', type: 'money', section: 'bolsa', width: 'half', required: true, label: l('Bolsa de formação mensal', 'Monthly training allowance'), legal: l('Menção obrigatória do contrato.', 'Mandatory content.') },
    { name: 'subsidios', type: 'text', section: 'bolsa', width: 'half', label: l('Outros apoios (opcional)', 'Other support (optional)'), placeholder: l('Ex.: transporte e almoço', 'E.g. transport and lunch') },
    { name: 'avisoDias', type: 'number', section: 'bolsa', width: 'half', min: 0, max: 60, default: 15, label: l('Aviso prévio para rescindir (dias)', 'Notice to terminate (days)'), help: l('Condição de rescisão acordada entre as partes.', 'Termination notice agreed by the parties.') },
    { name: 'promessa', type: 'toggle', section: 'bolsa', default: false, label: l('Promessa de contrato de trabalho no fim', 'Promise of employment at the end'), help: l('A empresa promete contratar o aprendiz se concluir a aprendizagem com aproveitamento.', 'The company promises to hire the apprentice on successful completion.') },
  ],

  computed: (v) => ({ idade: ageOn(v.aprendizNascimento, v.data) }),

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const idade = ctx.computed.idade as number | null;
    const min = ctx.legal.value<{ idadeMinima: number }>('rhpAprendizagem').idadeMinima;
    const m = ctx.legal.value<{ idadeAdmissao: number; horasSemana: number; horasDia: number }>('rhpTrabalhoMenores');
    if (idade != null && idade < min) w.push({ level: 'error', field: 'aprendizNascimento', message: l(`É proibida a aprendizagem de menores de ${min} anos (${cite('rhpAprendizagem')}).`, `Apprentices must be at least ${min}.`) });
    if (idade != null && idade < m.idadeAdmissao) {
      if (!str(v.representanteNome)) w.push({ level: 'error', field: 'representanteNome', message: l('O aprendiz é menor: identifique o representante legal, que assina o contrato.', 'The apprentice is a minor: name the legal representative, who signs.') });
      w.push({ level: 'warning', field: 'horario', message: l(`Para menores, respeite os limites de ${m.horasDia} horas por dia e ${m.horasSemana} por semana e não os ocupe em tarefas perigosas ou insalubres (${cite('rhpTrabalhoMenores')}).`, `For minors: at most ${m.horasDia} h/day and ${m.horasSemana} h/week; no dangerous work.`) });
    }
    if (money(v.bolsa) == null) w.push({ level: 'warning', field: 'bolsa', message: l('Indique a bolsa de formação: é menção obrigatória.', 'Enter the training allowance: it is mandatory.') });
    w.push({ level: 'info', message: l('Inclua o aprendiz no seguro de acidentes da empresa.', 'Cover the apprentice under the company’s accident insurance.') });
    return w;
  },
  personName: (v) => v.aprendizNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.aprendizGenero);
    const A = f ? 'a Aprendiz' : 'o Aprendiz';
    const Acap = f ? 'A Aprendiz' : 'O Aprendiz';
    const idade = ctx.computed.idade as number | null;
    const menor = idade != null && idade < ctx.legal.value<{ idadeAdmissao: number }>('rhpTrabalhoMenores').idadeAdmissao;
    const mods = linhas(v.conteudo);
    const rep = str(v.representanteNome);
    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `Pelo presente contrato, a Empresa compromete-se a assegurar a formação profissional ${f ? 'da Aprendiz' : 'do Aprendiz'} na profissão de **${str(v.profissao) || BLANK}**${str(v.instituicao) ? `, em colaboração com ${str(v.instituicao)}` : ''}, obrigando-se ${A} a executar as tarefas inerentes a essa formação ${doCite('rhpAprendizagem').replace(/^d/, 'nos termos d')}.`,
        en: 'The company provides the apprentice’s vocational training in the stated trade; the apprentice performs the related tasks.',
      },
      {
        id: 'conteudo',
        heading: 'Conteúdo e duração',
        text: `A aprendizagem decorre de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)} e compreende:`,
        items: (mods.length ? mods : [BLANK]).map((m, i, a) => `${m.charAt(0).toLowerCase()}${m.slice(1)}${i === a.length - 1 ? '.' : ';'}`),
        en: 'Length and content of the apprenticeship.',
      },
      {
        id: 'horario',
        heading: 'Horário e local',
        text: `A aprendizagem é ministrada em ${str(v.localAprendizagem) || BLANK}, no seguinte horário: ${str(v.horario) || BLANK}.${str(v.orientador) ? ` ${Acap} é ${f ? 'acompanhada' : 'acompanhado'} por ${str(v.orientador)}, como orientador.` : ''}${menor ? ` Tratando-se de menor, não ${f ? 'é ocupada' : 'é ocupado'} em tarefas insalubres, perigosas ou que exijam grande esforço físico.` : ''}`,
        en: 'Place and hours; supervisor; no dangerous work for minors.',
      },
      {
        id: 'bolsa',
        heading: 'Bolsa de formação',
        text: `${Acap} recebe uma bolsa de formação mensal de **${moneyExt(v.bolsa)}**${str(v.subsidios) ? `, bem como ${str(v.subsidios).replace(/\.$/, '')}` : ''}, paga até ao último dia útil de cada mês. A Empresa inclui ${A} no seguro de acidentes e fornece-lhe os equipamentos de protecção necessários.`,
        en: 'Monthly training allowance; accident insurance and protective equipment.',
      },
      {
        id: 'deveres',
        heading: 'Deveres das partes',
        text: `1. A Empresa ensina a profissão, avalia periodicamente o progresso ${f ? 'da Aprendiz' : 'do Aprendiz'} e emite, no fim, declaração ou certificado da aprendizagem realizada.\n2. ${Acap} frequenta a aprendizagem com assiduidade, cumpre as instruções do orientador e as regras de segurança e conserva os equipamentos que lhe forem confiados.`,
        en: 'Company: teach, assess, certify. Apprentice: attend, follow instructions and safety rules, look after equipment.',
      },
      {
        id: 'natureza',
        heading: 'Natureza do contrato',
        text: `O presente contrato não confere ${f ? 'à Aprendiz' : 'ao Aprendiz'} a qualidade de trabalhador ${refCite('rhpAprendizagem')}.${v.promessa ? ` A Empresa promete celebrar com ${A} contrato de trabalho na profissão aprendida, se ${f ? 'esta' : 'este'} concluir a aprendizagem com aproveitamento.` : ''}`,
        en: 'The apprentice is not an employee; optional promise of employment on successful completion.',
      },
      {
        id: 'rescisao',
        heading: 'Rescisão',
        text: `1. Qualquer das partes pode rescindir o contrato, por escrito, com aviso prévio de ${Number(v.avisoDias) > 0 ? qty(Number(v.avisoDias), 'dia', 'dias') : `${BLANK} dias`}.\n2. A Empresa pode rescindir o contrato sem aviso prévio em caso de faltas injustificadas reiteradas, falta grave de comportamento ou falta de aproveitamento comprovada na avaliação.\n3. O contrato caduca no termo do período de aprendizagem.`,
        en: 'Termination by either party with written notice; immediately for repeated absence, serious misconduct or proven lack of progress; it ends when the period ends.',
      },
    ];
    const blocks: Block[] = [
      { type: 'title', text: 'Contrato de Aprendizagem', subtitle: str(v.ref) ? `N.º ${str(v.ref)}` : undefined },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteEmpresa', text: `${employerParty(ctx, 'Empresa')};`, en: 'The company;' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      {
        type: 'paragraph',
        id: 'parteAprendiz',
        text: `${identificacao(v, 'aprendiz')}, nascid${f ? 'a' : 'o'} em ${dateLong(v.aprendizNascimento)}${menor && rep ? `, neste acto representad${f ? 'a' : 'o'} por ${rep}${str(v.representanteQualidade) ? `, na qualidade de ${str(v.representanteQualidade)}` : ''}${str(v.representanteDoc) ? `, com o BI n.º ${str(v.representanteDoc)}` : ''}` : ''}, adiante ${f ? 'designada' : 'designado'} por **Aprendiz**;`,
        en: 'The apprentice (and legal representative if a minor);',
      },
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato de aprendizagem, que se rege pelas cláusulas seguintes:', en: 'The following apprenticeship contract is made:' },
      { type: 'numberedClauses', style: 'clausula', items },
      { type: 'paragraph', id: 'exemplares', text: 'Feito em dois exemplares de igual valor, ficando um em poder de cada uma das partes.', en: 'Made in two counterparts.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          employerSignature(ctx, 'Pela Empresa'),
          { role: f ? 'A Aprendiz' : 'O Aprendiz', name: str(v.aprendizNome) || undefined },
          ...(menor ? [{ role: 'O Representante Legal', name: rep || undefined }] : []),
        ],
      },
    ];
    return blocks;
  },
});
