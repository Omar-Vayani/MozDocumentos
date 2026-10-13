import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l, lineItems, localField, dateField, money, placeDate } from './_shared';
import { entidadeParty, num, pessoaFields, pessoaIdent, quantos, semPonto, str, valorTexto } from './_associacoes';

// Acordo de voluntariado (Lei n.º 7/2011, Regime Jurídico do Voluntariado):
// free, unpaid activity; no employment relationship; documented expenses
// reimbursed. The wording avoids anything that looks like subordination.

export default defineTemplate({
  id: 'acordo-de-voluntariado',
  family: 'contrato',
  sections: [
    { id: 'voluntario', title: l('Voluntário(a)', 'Volunteer'), personRole: 'outro' },
    { id: 'programa', title: l('Programa e actividades', 'Programme and activities') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
    { id: 'documento', title: l('Data e assinaturas', 'Date and signatures') },
  ],
  fields: [
    ...pessoaFields('voluntario', 'voluntario', ['nome', 'genero', 'estadoCivil', 'nacionalidade', 'doc', 'morada', 'telefone']),
    { name: 'menor', type: 'toggle', section: 'voluntario', label: l('O voluntário é menor (assina também o encarregado)', 'The volunteer is a minor (guardian also signs)'), default: false },
    { name: 'encarregadoNome', type: 'text', section: 'voluntario', label: l('Nome do encarregado de educação', 'Guardian’s name'), showIf: (v) => Boolean(v.menor) },
    { name: 'programa', type: 'text', section: 'programa', required: true, label: l('Programa ou projecto', 'Programme or project'), placeholder: l('Ex.: Programa de alfabetização de adultos', 'E.g. Adult literacy programme') },
    { name: 'localActividade', type: 'text', section: 'programa', label: l('Local das actividades', 'Place of activities'), placeholder: l('Ex.: Bairro da Mafalala, Cidade de Maputo', 'E.g. neighbourhood, city') },
    {
      name: 'actividades',
      type: 'lines',
      section: 'programa',
      required: true,
      label: l('Actividades do voluntário', 'Volunteer activities'),
      addLabel: l('Adicionar actividade', 'Add activity'),
      columns: [{ name: 'actividade', type: 'text', label: l('Actividade', 'Activity') }],
      default: [{ actividade: 'apoio às sessões de alfabetização e explicação' }, { actividade: 'organização de actividades recreativas com crianças e jovens' }],
    },
    { name: 'responsavel', type: 'text', section: 'programa', label: l('Responsável pelo acompanhamento', 'Supervisor'), placeholder: l('Ex.: a Coordenadora do Programa', 'E.g. the programme coordinator') },
    { name: 'dataInicio', type: 'date', section: 'condicoes', width: 'half', required: true, label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'condicoes', width: 'half', label: l('Fim (vazio = sem prazo)', 'End (empty = open-ended)') },
    { name: 'disponibilidade', type: 'text', section: 'condicoes', label: l('Disponibilidade combinada', 'Agreed availability'), placeholder: l('Ex.: sábados de manhã', 'E.g. Saturday mornings') },
    { name: 'limiteDespesas', type: 'money', section: 'condicoes', width: 'half', label: l('Limite mensal de despesas reembolsáveis (opcional)', 'Monthly limit of reimbursable expenses (optional)') },
    { name: 'avisoPrevio', type: 'number', section: 'condicoes', width: 'half', label: l('Aviso prévio para terminar (dias)', 'Notice to end (days)'), default: 15, min: 0 },
    { name: 'seguro', type: 'toggle', section: 'condicoes', label: l('A entidade faz seguro de acidentes pessoais', 'The organisation insures the volunteer against accidents'), default: false },
    { name: 'codigoConduta', type: 'toggle', section: 'condicoes', label: l('Código de conduta e protecção de crianças e adultos vulneráveis', 'Code of conduct and safeguarding'), default: true },
    localField(),
    dateField(),
    { name: 'signatarioNome', type: 'text', section: 'documento', width: 'half', label: l('Assina pela entidade', 'Signs for the organisation'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'signatarioCargo', type: 'text', section: 'documento', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo ?? '' },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.voluntarioGenero === 'F';
    const oV = f ? 'a Voluntária' : 'o Voluntário';
    const OV = f ? 'A Voluntária' : 'O Voluntário';
    const acts = lineItems(v.actividades).map((r) => semPonto(r.actividade)).filter(Boolean);
    const prazo = str(v.dataFim) ? `de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}` : `a partir de ${dateLong(v.dataInicio)}, por tempo indeterminado`;
    const limite = money(v.limiteDespesas);
    const aviso = num(v.avisoPrevio);
    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: `${OV} compromete-se a colaborar, de forma livre, desinteressada e gratuita, no programa «${str(v.programa) || BLANK}», desenvolvido pela Entidade Promotora${str(v.localActividade) ? ` em ${str(v.localActividade)}` : ''}, realizando as seguintes actividades:`,
        items: (acts.length ? acts : [BLANK]).map((a, i, arr) => `${a}${i === arr.length - 1 ? '.' : ';'}`),
        en: 'The volunteer agrees to take part freely and without pay in the programme, carrying out the activities listed.',
      },
      {
        id: 'natureza',
        heading: 'Natureza',
        text: `1. O presente acordo não constitui contrato de trabalho nem de prestação de serviços e não gera vínculo laboral ou afim entre as partes.\n2. ${OV} não recebe remuneração pela actividade prestada.\n3. O presente acordo rege-se pela ${cite('assocVoluntariado')} e respectiva regulamentação.`,
        en: 'This is not an employment or service contract; the volunteer receives no pay; the volunteering law applies.',
      },
      {
        id: 'duracao',
        heading: 'Duração e disponibilidade',
        text: `1. O presente acordo vigora ${prazo}, podendo ser renovado por acordo das partes.\n2. ${str(v.disponibilidade) ? `${OV} indica a seguinte disponibilidade: ${semPonto(v.disponibilidade)}, que pode ser ajustada por acordo.` : `A disponibilidade ${f ? 'da Voluntária' : 'do Voluntário'} é combinada entre as partes, de acordo com as necessidades do programa.`}`,
        en: 'Duration and agreed availability.',
      },
      {
        id: 'entidade',
        heading: 'Compromissos da Entidade Promotora',
        text: 'A Entidade Promotora compromete-se a:',
        items: [
          `proporcionar ${f ? 'à Voluntária' : 'ao Voluntário'} a informação, a orientação e a formação necessárias às actividades;`,
          `${str(v.responsavel) ? `designar ${semPonto(v.responsavel)} como responsável pelo acompanhamento` : 'designar um responsável pelo acompanhamento'} ${f ? 'da Voluntária' : 'do Voluntário'};`,
          `assegurar condições de higiene e segurança adequadas${v.seguro ? ' e um seguro de acidentes pessoais durante as actividades' : ''};`,
          `reembolsar as despesas que ${oV} comprovadamente realize no desempenho das actividades, desde que previamente autorizadas${limite ? `, até ao limite mensal de ${valorTexto(limite, false)}` : ''};`,
          'emitir, a pedido, declaração da actividade de voluntariado realizada.',
        ],
        en: 'The organisation provides information, training, supervision, safe conditions, reimbursement of documented expenses and a certificate.',
      },
      {
        id: 'voluntario',
        heading: `Compromissos ${f ? 'da Voluntária' : 'do Voluntário'}`,
        text: `${OV} compromete-se a:`,
        items: [
          'realizar as actividades com zelo, responsabilidade e respeito pelos beneficiários;',
          `observar os princípios e as normas internas da Entidade Promotora${v.codigoConduta ? ', incluindo o código de conduta e a política de protecção de crianças e adultos vulneráveis' : ''};`,
          'guardar sigilo sobre as informações a que tenha acesso, designadamente os dados pessoais dos beneficiários;',
          'avisar com antecedência as faltas e a intenção de terminar a colaboração;',
          `não utilizar a qualidade de ${f ? 'voluntária' : 'voluntário'} para obter vantagens pessoais.`,
        ],
        en: 'The volunteer acts with care, follows the rules and code of conduct, keeps confidentiality, gives notice and seeks no personal gain.',
      },
      {
        id: 'cessacao',
        heading: 'Cessação',
        text: `Qualquer das partes pode pôr termo ao presente acordo a todo o tempo, mediante comunicação escrita com a antecedência de ${quantos(aviso, 'dia', 'dias')}, ou imediatamente em caso de violação grave dos compromissos assumidos.`,
        en: 'Either party may end the agreement with written notice, or immediately for a serious breach.',
      },
    ];
    return [
      { type: 'title', text: 'Acordo de Voluntariado' },
      {
        type: 'paragraph',
        id: 'partes',
        text: `Entre:\n${entidadeParty(ctx, 'Entidade Promotora')};\ne\n${pessoaIdent(v, 'voluntario')}${str(v.voluntarioTelefone) ? `, telefone ${str(v.voluntarioTelefone)}` : ''}, adiante ${f ? 'designada' : 'designado'} por **${f ? 'Voluntária' : 'Voluntário'}**${v.menor ? `, com o consentimento ${str(v.encarregadoNome) ? `de **${str(v.encarregadoNome)}**, seu encarregado de educação` : 'do seu encarregado de educação'}` : ''};\né celebrado o presente acordo de voluntariado, que se rege pelas cláusulas seguintes:`,
        en: 'Between the promoting organisation and the volunteer, this volunteer agreement is made on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Feito em dois exemplares de igual valor, ficando um em poder de cada parte.',
        en: 'Made in two copies of equal value, one for each party.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          { role: 'Pela Entidade Promotora', name: str(v.signatarioNome) || undefined, detail: str(v.signatarioCargo) || undefined, image: 'both' },
          { role: OV, name: str(v.voluntarioNome) || undefined },
          ...(v.menor ? [{ role: 'O(A) Encarregado(a) de Educação', name: str(v.encarregadoNome) || undefined }] : []),
        ],
      },
    ];
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!str(v.voluntarioNome)) w.push({ level: 'warning', field: 'voluntarioNome', message: l('Indique o nome do voluntário.', 'Enter the volunteer’s name.') });
    w.push({
      level: 'info',
      message: l(
        `Não pague subsídios fixos nem imponha horários e ordens como a um trabalhador: isso pode transformar o voluntariado numa relação de trabalho. Reembolse apenas despesas comprovadas (${cite('assocVoluntariado')}).`,
        'Do not pay fixed allowances or treat the volunteer like an employee: that may create an employment relationship. Reimburse only documented expenses.',
      ),
    });
    w.push({
      level: 'info',
      message: l(
        `Confirme se a entidade promotora e o voluntário têm de ser acreditados ao abrigo do novo regulamento do voluntariado (${cite('assocVoluntariadoRegulamento')}).`,
        'Check whether the organisation and volunteer must be accredited under the new volunteering regulation.',
      ),
    });
    if (v.menor && !str(v.encarregadoNome)) w.push({ level: 'warning', field: 'encarregadoNome', message: l('Um voluntário menor precisa do consentimento escrito do encarregado.', 'A minor needs written consent from a guardian.') });
    if (ctx.profile?.kind !== 'empresa') w.push({ level: 'info', message: l('Use o perfil da associação ou ONG promotora.', 'Use the promoting organisation’s profile.') });
    return w;
  },
  personName: (v) => str(v.voluntarioNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
