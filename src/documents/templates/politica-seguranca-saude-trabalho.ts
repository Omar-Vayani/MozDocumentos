// Política de higiene, saúde e segurança no trabalho: employer and employee
// duties, protective equipment, training, the safety committee (mandatory in
// high-risk activities), first aid, accidents and insurance.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { alineas, APROVACAO_SECTION, aprovacaoFields, empresa, linhas, nosTermos, policyBlocks, refCite, str, vigorClause } from './_rh-politicas';

export default defineTemplate({
  id: 'politica-seguranca-saude-trabalho',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'actividade', title: l('Actividade e riscos', 'Activity and risks') },
    { id: 'organizacao', title: l('Organização', 'Organisation') },
    APROVACAO_SECTION,
  ],
  fields: [
    {
      name: 'riscoExcepcional',
      type: 'toggle',
      section: 'actividade',
      default: false,
      label: l('Actividade de risco excepcional', 'High-risk activity'),
      help: l('Construção civil, indústria extractiva, metalurgia, escavações, petróleo e gás, explosivos, electricidade, produtos tóxicos, pedreiras. A comissão de segurança é obrigatória.', 'Construction, mining, metalworking, excavation, oil and gas, explosives, electricity, toxic products, quarries. A safety committee is mandatory.'),
    },
    {
      name: 'riscos',
      type: 'textarea',
      section: 'actividade',
      rows: 4,
      label: l('Principais riscos (um por linha)', 'Main risks (one per line)'),
      placeholder: l('Ex.: Quedas em altura\nMovimentação manual de cargas\nRuído e poeiras', 'E.g. Falls from height\nManual handling\nNoise and dust'),
    },
    {
      name: 'epis',
      type: 'textarea',
      section: 'actividade',
      rows: 3,
      label: l('Equipamentos de protecção obrigatórios (um por linha)', 'Mandatory protective equipment (one per line)'),
      default: 'Capacete de protecção\nBotas de segurança\nColete reflector\nLuvas adequadas à tarefa',
    },
    { name: 'responsavelHst', type: 'text', section: 'organizacao', width: 'half', label: l('Responsável pela segurança (cargo)', 'Safety officer (position)'), default: 'Técnico de Higiene e Segurança no Trabalho' },
    { name: 'comissao', type: 'toggle', section: 'organizacao', default: true, label: l('Existe comissão de segurança no trabalho', 'There is a safety committee') },
    { name: 'primeirosSocorros', type: 'text', section: 'organizacao', label: l('Serviço de primeiros socorros', 'First-aid service'), placeholder: l('Ex.: posto de primeiros socorros na sede e caixa em cada estaleiro', 'E.g. first-aid post at head office and kits on each site') },
    { name: 'seguradora', type: 'text', section: 'organizacao', width: 'half', label: l('Seguradora (acidentes de trabalho)', 'Insurer (work accidents)') },
    { name: 'apolice', type: 'text', section: 'organizacao', width: 'half', label: l('Apólice n.º', 'Policy no.') },
    ...aprovacaoFields(),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (v.riscoExcepcional && !v.comissao) {
      w.push({ level: 'error', field: 'comissao', message: l(`Nas actividades de risco excepcional a comissão de segurança no trabalho é obrigatória (${cite('rhpHigieneSeguranca')}).`, 'A safety committee is mandatory in high-risk activities.') });
    }
    if (!str(v.seguradora)) w.push({ level: 'warning', field: 'seguradora', message: l(`O seguro colectivo de acidentes de trabalho é obrigatório (${cite('rhpSeguroAcidentes')}). Indique a seguradora.`, 'Work accident insurance is mandatory. Enter the insurer.') });
    return w;
  },
  documentDate: (v) => v.dataAprovacao,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = empresa(ctx);
    const riscos = linhas(v.riscos);
    const epis = linhas(v.epis);
    const resp = str(v.responsavelHst) || 'responsável pela segurança';
    const seguro = str(v.seguradora);
    const artigos: ClauseItem[] = [
      {
        id: 'compromisso',
        heading: 'Objecto e compromisso',
        text: `${nome === BLANK ? 'A Empresa' : `**${nome}**, adiante designada por Empresa,`} compromete-se a garantir a todos os trabalhadores condições de higiene, saúde e segurança, a prevenir os acidentes de trabalho e as doenças profissionais e a melhorar continuamente as condições de trabalho, ${nosTermos('rhpHigieneSeguranca')}. Nenhum prazo, custo ou ordem justifica pôr em risco a vida ou a saúde de alguém.`,
        en: 'Commitment to safe and healthy conditions, prevention of accidents and occupational diseases and continuous improvement; nothing justifies risking life or health.',
      },
      {
        id: 'empresa',
        heading: 'Responsabilidades da Empresa',
        text: 'A Empresa, em especial:',
        items: alineas([
          'identifica e avalia os riscos de cada posto de trabalho e adopta as medidas de prevenção adequadas',
          'informa cada trabalhador dos riscos do seu posto e dá-lhe formação sobre as regras de segurança antes de iniciar funções e sempre que mudem os métodos ou equipamentos',
          'fornece gratuitamente os equipamentos de protecção individual e as roupas de trabalho necessários e substitui-os quando danificados',
          'mantém em bom estado as instalações, máquinas, ferramentas, acessos e saídas de emergência',
          'investiga as causas dos acidentes e incidentes e corrige as falhas encontradas',
          `mantém o seguro colectivo de acidentes de trabalho e doenças profissionais ${refCite('rhpSeguroAcidentes')}`,
        ]),
        en: 'Company duties: risk assessment, information and training, free protective equipment, safe premises and machines, accident investigation, accident insurance.',
      },
      {
        id: 'trabalhadores',
        heading: 'Deveres dos trabalhadores',
        text: 'Cada trabalhador:',
        items: alineas([
          'vela pela sua segurança e saúde e pelas das pessoas que possam ser afectadas pelos seus actos ou omissões',
          'cumpre as regras, sinais e instruções de segurança e usa correctamente os equipamentos de protecção',
          'não opera máquinas nem equipamentos para os quais não tenha formação e autorização',
          'comunica de imediato à chefia qualquer avaria, situação de perigo, acidente ou incidente',
          'não se apresenta ao trabalho sob a influência de álcool ou de estupefacientes',
          'colabora com a comissão de segurança e participa nas acções de formação e nos simulacros',
        ]),
        en: 'Employee duties: care for own and others’ safety, follow rules and use protective equipment, operate only authorised machines, report hazards and accidents, no alcohol or drugs, take part in training and drills.',
      },
      {
        id: 'perigo',
        heading: 'Perigo grave e iminente',
        text: 'Perante uma situação de perigo grave e iminente para a vida ou a saúde, o trabalhador interrompe a tarefa, afasta-se do local em segurança e avisa de imediato a chefia, sem que daí lhe resulte qualquer prejuízo. O trabalho só é retomado depois de eliminado o perigo.',
        en: 'In serious and imminent danger the employee stops, withdraws safely and alerts the supervisor, without prejudice; work resumes only once the danger is removed.',
      },
    ];
    if (riscos.length || epis.length) {
      const partes: string[] = [];
      if (riscos.length) partes.push(`Os principais riscos identificados na actividade da Empresa são: ${riscos.map((r) => r.charAt(0).toLowerCase() + r.slice(1)).join('; ')}.`);
      if (epis.length) partes.push(`Nos locais e tarefas indicados pela Empresa é obrigatório o uso de: ${epis.map((r) => r.charAt(0).toLowerCase() + r.slice(1)).join('; ')}.`);
      partes.push('A entrega dos equipamentos de protecção é registada em ficha assinada pelo trabalhador. É proibido trabalhar sem o equipamento exigido para a tarefa.');
      artigos.push({
        id: 'riscos',
        heading: 'Riscos e equipamentos de protecção',
        text: partes.map((t, i) => `${i + 1}. ${t}`).join('\n'),
        en: 'Main risks and mandatory protective equipment; handover recorded; no work without the required equipment.',
      });
    }
    artigos.push({
      id: 'organizacao',
      heading: 'Organização da segurança',
      text: [
        `1. O ${resp} coordena a aplicação da presente política, faz inspecções regulares aos locais de trabalho e propõe as medidas de prevenção.`,
        v.comissao !== false
          ? `2. A comissão de segurança no trabalho, com representantes dos trabalhadores e da Empresa, vigia o cumprimento das normas de higiene e segurança, investiga as causas dos acidentes e organiza os métodos de prevenção${v.riscoExcepcional ? ', sendo obrigatória dada a natureza de risco excepcional da actividade' : ''} ${refCite('rhpHigieneSeguranca')}.`
          : '2. Os trabalhadores são consultados sobre as medidas de segurança através do órgão sindical.',
      ].join('\n'),
      en: 'The safety officer coordinates and inspects; the safety committee monitors, investigates and organises prevention.',
    });
    artigos.push(
      {
        id: 'socorros',
        heading: 'Primeiros socorros e emergência',
        text: `1. ${str(v.primeirosSocorros) ? `A Empresa mantém ${str(v.primeirosSocorros).replace(/\.$/, '')}.` : 'A Empresa mantém caixas de primeiros socorros em todos os locais de trabalho e trabalhadores com formação para os prestar.'}\n2. Em caso de acidente, a Empresa presta os primeiros socorros e assegura o transporte do sinistrado para uma unidade sanitária ${refCite('rhpAcidenteParticipacao')}.\n3. Os planos de evacuação e os contactos de emergência estão afixados e são testados em simulacros.`,
        en: 'First aid available; first aid and transport to a health facility after an accident; posted evacuation plans and drills.',
      },
      {
        id: 'acidentes',
        heading: 'Acidentes e incidentes',
        text: `1. Todo o acidente de trabalho, doença profissional ou incidente é participado de imediato à chefia pelo trabalhador ou por quem o presencie, e registado.\n2. A Empresa investiga as causas, com a comissão de segurança, participa o sinistro à seguradora${seguro ? ` (${seguro}${str(v.apolice) ? `, apólice n.º ${str(v.apolice)}` : ''})` : ''} e informa o órgão competente da administração do trabalho sobre a natureza, as causas e as consequências do acidente ${refCite('rhpAcidenteParticipacao')}.`,
        en: 'Accidents, occupational diseases and near misses reported at once and recorded; investigation, claim to the insurer and report to the labour administration.',
      },
      {
        id: 'saude',
        heading: 'Vigilância da saúde',
        text: `Os trabalhadores fazem os exames médicos de admissão e periódicos adequados aos riscos do posto ${refCite('saudeNoTrabalho')}. O médico comunica à Empresa apenas a aptidão ou inaptidão para o trabalho. Em caso algum é exigido teste de HIV ${refCite('rhpHivTrabalho')}.`,
        en: 'Pre-employment and periodic medical exams; only fitness is reported; never HIV tests.',
      },
      {
        id: 'infraccoes',
        heading: 'Incumprimento',
        text: `A violação culposa das regras de higiene e segurança constitui infracção disciplinar, graduada em função do risco criado ${refCite('rhpHigieneSeguranca')}.`,
        en: 'Culpable breach of safety rules is a disciplinary offence graded by the risk created.',
      },
    );
    return policyBlocks(ctx, {
      titulo: 'Política de Higiene, Saúde e Segurança no Trabalho',
      artigos,
      vigor: vigorClause(ctx, { sujeito: 'A presente política', fem: true, extra: ['A política é revista anualmente e sempre que ocorra um acidente grave ou mudem os métodos de trabalho.'] }),
      recepcao: 'um exemplar da Política de Higiene, Saúde e Segurança no Trabalho',
      signatario: 'A Direcção',
    });
  },
});
