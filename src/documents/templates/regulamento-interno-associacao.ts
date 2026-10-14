import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import { entidadeNome, num, quantos, str } from './_associacoes';

// Regulamento interno de uma associação: detailed rules under the statutes,
// approved by the general meeting. Modules are switched on and off.

export default defineTemplate({
  id: 'regulamento-interno-associacao',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'geral', title: l('Geral', 'General') },
    { id: 'quotas', title: l('Jóia e quotas', 'Fees and dues') },
    { id: 'modulos', title: l('Capítulos a incluir', 'Chapters to include') },
    { id: 'aprovacao', title: l('Aprovação', 'Approval') },
  ],
  fields: [
    { name: 'nome', type: 'text', section: 'geral', label: l('Nome da associação', 'Name of the association'), default: (c) => c.profile?.firma ?? '' },
    { name: 'joia', type: 'money', section: 'quotas', width: 'half', label: l('Jóia', 'Entry fee') },
    { name: 'quota', type: 'money', section: 'quotas', width: 'half', label: l('Quota mensal', 'Monthly dues') },
    { name: 'diaQuota', type: 'number', section: 'quotas', width: 'half', label: l('Pagar a quota até ao dia', 'Pay dues by day'), default: 10, min: 1, max: 31 },
    { name: 'prazoDefesa', type: 'number', section: 'modulos', width: 'half', label: l('Prazo para o membro se defender (dias)', 'Days for a member to reply'), default: 10, min: 1 },
    { name: 'limiteCaixa', type: 'money', section: 'modulos', width: 'half', label: l('Limite de dinheiro em caixa', 'Petty cash limit') },
    { name: 'modEleicoes', type: 'toggle', section: 'modulos', label: l('Processo eleitoral', 'Elections'), default: true },
    { name: 'modFinancas', type: 'toggle', section: 'modulos', label: l('Gestão financeira', 'Financial management'), default: true },
    { name: 'modConduta', type: 'toggle', section: 'modulos', label: l('Conduta e conflitos de interesse', 'Conduct and conflicts of interest'), default: true },
    { name: 'modComunicacoes', type: 'toggle', section: 'modulos', label: l('Comunicações (email, WhatsApp)', 'Communications (email, WhatsApp)'), default: true },
    { name: 'modDados', type: 'toggle', section: 'modulos', label: l('Dados pessoais dos membros', 'Members’ personal data'), default: true },
    { name: 'dataAprovacao', type: 'date', section: 'aprovacao', width: 'half', label: l('Aprovado em Assembleia Geral de', 'Approved at the general meeting of') },
    { name: 'presidenteMesa', type: 'text', section: 'aprovacao', width: 'half', label: l('Presidente da Mesa da Assembleia Geral', 'Chair of the general meeting') },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = str(v.nome) || entidadeNome(ctx);
    const prazoConv = ctx.legal.value<number>('convocatoriaAssociacao');
    const joia = money(v.joia);
    const quota = money(v.quota);
    const caixa = money(v.limiteCaixa);
    const items: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `O presente regulamento desenvolve os estatutos da ${nome} e estabelece as regras de admissão de membros, quotas, disciplina, eleições e funcionamento interno. Em caso de dúvida, prevalecem os estatutos e a lei.`,
        en: 'Purpose: these rules develop the statutes; the statutes and the law prevail.',
      },
      {
        id: 'admissao',
        heading: 'Admissão de membros',
        text: '1. O pedido de admissão é feito em ficha de inscrição própria, acompanhada de cópia do documento de identificação e de uma fotografia.\n2. A Direcção decide na reunião seguinte à recepção do pedido e comunica a decisão por escrito ao candidato.\n3. O membro admitido recebe um número de membro e o cartão de membro.',
        en: 'Admission: application form with ID copy and photo; the board decides at its next meeting; member number and card.',
      },
      {
        id: 'quotas',
        heading: 'Jóia e quotas',
        text: `1. A jóia é de ${joia != null ? formatMoney(joia) : `${BLANK} MT`} e a quota mensal de ${quota != null ? formatMoney(quota) : `${BLANK} MT`}, valores fixados pela Assembleia Geral.\n2. A quota é paga até ao dia ${num(v.diaQuota) ?? BLANK} de cada mês, em numerário contra recibo, por transferência bancária ou por carteira móvel para a conta da Associação.\n3. Todo o pagamento dá lugar a recibo numerado, assinado pelo Tesoureiro.`,
        en: 'Entry fee and monthly dues; payment deadline and methods; numbered receipts.',
      },
      {
        id: 'disciplina',
        heading: 'Procedimento disciplinar',
        text: `1. A Direcção comunica por escrito ao membro os factos de que é acusado e concede-lhe ${quantos(num(v.prazoDefesa), 'dia', 'dias')} para responder.\n2. Recebida a resposta ou terminado o prazo, a Direcção decide e comunica a decisão por escrito, com os seus fundamentos.\n3. Das decisões da Direcção cabe recurso para a Assembleia Geral, a interpor por escrito junto do Presidente da Mesa.`,
        en: 'Disciplinary procedure: written charge, time to reply, reasoned decision, appeal to the general meeting.',
      },
    ];
    if (v.modEleicoes !== false)
      items.push({
        id: 'eleicoes',
        heading: 'Processo eleitoral',
        text: `1. As eleições são convocadas pelo Presidente da Mesa da Assembleia Geral, com a antecedência mínima de ${quantos(prazoConv, 'dia', 'dias')}, por aviso a cada membro.\n2. As candidaturas são apresentadas por listas completas para cada órgão, subscritas pelos candidatos, até à data fixada na convocatória.\n3. A votação é secreta. Votam os membros com as quotas regularizadas até ao mês anterior à eleição.\n4. É eleita a lista mais votada. Os eleitos tomam posse perante o Presidente da Mesa, no próprio acto ou nos dias seguintes.`,
        en: 'Elections: called by the chair with legal notice; full lists; secret ballot; members with dues paid vote; the list with most votes wins.',
      });
    if (v.modFinancas !== false)
      items.push({
        id: 'financas',
        heading: 'Gestão financeira',
        text: `1. Os fundos da Associação são depositados em conta bancária em nome da Associação, movimentada nos termos da forma de obrigar prevista nos estatutos.\n2. ${caixa != null ? `O dinheiro em caixa não pode exceder ${formatMoney(caixa)}; o excedente é depositado no banco.` : 'O dinheiro em caixa é mantido no mínimo indispensável e o excedente é depositado no banco.'}\n3. Toda a despesa é suportada por factura ou recibo e autorizada pelo Presidente ou pelo Tesoureiro.\n4. O Tesoureiro apresenta à Direcção, todos os meses, o mapa de receitas e despesas e o saldo de caixa e bancos.`,
        en: 'Finances: bank account in the association’s name; petty cash limit; supporting documents; monthly statement.',
      });
    if (v.modConduta !== false)
      items.push({
        id: 'conduta',
        heading: 'Conduta e conflitos de interesse',
        text: '1. Os membros e os titulares dos órgãos actuam com honestidade, respeito e lealdade para com a Associação.\n2. O titular de um órgão que tenha interesse pessoal num assunto declara-o e não participa na respectiva deliberação.\n3. É proibido usar os bens, o nome ou os fundos da Associação em benefício pessoal ou para fins político-partidários.',
        en: 'Conduct: honesty; declare conflicts and abstain; no personal or party-political use of assets.',
      });
    if (v.modComunicacoes !== false)
      items.push({
        id: 'comunicacoes',
        heading: 'Comunicações',
        text: '1. Sem prejuízo das formalidades exigidas pela lei e pelos estatutos para a convocatória da Assembleia Geral, a Associação pode comunicar com os membros por correio electrónico, SMS ou grupos de mensagens.\n2. Cada membro mantém actualizados os seus contactos junto do Secretário-Geral.',
        en: 'Communications: email, SMS or messaging groups as a complement to the legal notice; members keep contacts up to date.',
      });
    if (v.modDados !== false)
      items.push({
        id: 'dados',
        heading: 'Dados pessoais',
        text: 'Os dados pessoais dos membros são usados apenas para a gestão da Associação, guardados em local seguro e não são cedidos a terceiros sem consentimento do membro, salvo obrigação legal.',
        en: 'Members’ personal data are used only to run the association, kept safe and not shared without consent unless the law requires.',
      });
    items.push({
      id: 'vigor',
      heading: 'Entrada em vigor',
      text: `O presente regulamento entra em vigor na data da sua aprovação pela Assembleia Geral${str(v.dataAprovacao) ? `, em ${dateLong(v.dataAprovacao)}` : ''}.`,
      en: 'Entry into force on approval by the general meeting.',
    });
    const blocks: Block[] = [
      { type: 'title', text: 'Regulamento Interno', subtitle: nome },
      { type: 'numberedClauses', style: 'artigo', items },
      { type: 'paragraph', id: 'aprovado', text: `Aprovado pela Assembleia Geral em ${dateLong(v.dataAprovacao)}.`, en: 'Approved by the general meeting.', keepWithNext: true },
      { type: 'signatures', columns: [{ role: 'O(A) Presidente da Mesa da Assembleia Geral', name: str(v.presidenteMesa) || undefined }] },
    ];
    return blocks;
  },

  warnings: () => {
    const w: Warning[] = [];
    w.push({
      level: 'info',
      message: l(
        `O regulamento interno não pode contrariar os estatutos nem a lei: a convocatória da assembleia geral continua a ser feita por aviso postal com a antecedência legal (${cite('convocatoriaAssociacao')}).`,
        'Internal rules cannot contradict the statutes or the law: the general meeting is still called by postal notice with the legal period.',
      ),
    });
    return w;
  },
  documentDate: (v) => str(v.dataAprovacao) || undefined,
});
