import { defineTemplate, type Block, type ClauseItem, type FieldDef, type Values, type Warning } from '../model';
import {
  BLANK, cite, dateField, DOC_TIPO_OPTIONS, employerParty, GENERO_OPTIONS, isF, l, localField, money, placeDate, refField,
  workerFields, workerParty,
} from './_shared';
import { employerSig, enumerate, lc, moneyExt, num, qty } from './_contrato-trabalho';

const trim = (s: unknown) => String(s ?? '').trim();
const isTrab = (v: Values) => (v.tipoContraparte ?? 'trabalhador') === 'trabalhador';
const isParc = (v: Values) => v.tipoContraparte === 'parceiro';
const parcEmpresa = (v: Values) => isParc(v) && (v.parceiroNatureza ?? 'empresa') === 'empresa';
const parcPessoa = (v: Values) => isParc(v) && v.parceiroNatureza === 'pessoa';

/** "da Lei n.º 13/2023" — or "do art. …" if an article is added to the legal entry later. */
function daLeiSigilo(): string {
  const c = cite('deverSigilo');
  if (c.startsWith('arts.')) return `dos ${c}`;
  if (c.startsWith('art.')) return `do ${c}`;
  return `da ${c}`;
}

function defaultForo(city: string): string {
  const da = ['Beira', 'Matola'].includes(city) ? 'da' : 'de';
  return `Tribunal Judicial da Cidade ${da} ${city}`;
}

function parceiroParty(v: Values): string {
  const nome = `**${trim(v.parceiroNome) || BLANK}**`;
  if (parcPessoa(v)) {
    const f = isF(v.parceiroGenero);
    const parts = [
      nome,
      trim(v.parceiroNacionalidade) ? `de nacionalidade ${trim(v.parceiroNacionalidade)}` : '',
      trim(v.parceiroDocNumero) ? `${f ? 'portadora' : 'portador'} do ${v.parceiroDocTipo || 'BI'} n.º ${trim(v.parceiroDocNumero)}` : '',
      trim(v.parceiroNuit) ? `NUIT ${trim(v.parceiroNuit)}` : '',
      trim(v.parceiroMorada) ? `residente em ${trim(v.parceiroMorada)}` : '',
    ].filter(Boolean);
    return `${parts.join(', ')}, adiante ${f ? 'designada' : 'designado'} por **Parte Receptora**`;
  }
  const rep = trim(v.parceiroRepresentante);
  const parts = [
    nome,
    trim(v.parceiroMorada) ? `com sede em ${trim(v.parceiroMorada)}` : '',
    trim(v.parceiroNuit) ? `com o NUIT ${trim(v.parceiroNuit)}` : '',
    trim(v.parceiroNuel) ? `registada sob o NUEL ${trim(v.parceiroNuel)}` : '',
    rep ? `neste acto representada por ${rep}${trim(v.parceiroRepresentanteCargo) ? `, na qualidade de ${trim(v.parceiroRepresentanteCargo)}` : ''}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')}, adiante designada por **Parte Receptora**`;
}

const parc = (name: string, type: FieldDef['type'], label: [string, string], show: (v: Values) => boolean, extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  type,
  section: 'parceiro',
  width: 'half',
  label: l(label[0], label[1]),
  showIf: show,
  ...extra,
});

export default defineTemplate({
  id: 'acordo-confidencialidade',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'contraparte', title: l('Quem assina o compromisso', 'Who signs the undertaking') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'parceiro', title: l('Parceiro', 'Partner'), personRole: 'outro' },
    { id: 'acordo', title: l('Condições do acordo', 'Terms') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data de assinatura', 'Signing date')),
    {
      name: 'tipoContraparte',
      type: 'select',
      section: 'contraparte',
      default: 'trabalhador',
      label: l('Tipo de contraparte', 'Counterparty type'),
      help: l(
        'Trabalhador da empresa, ou parceiro (empresa ou pessoa) com quem a empresa vai partilhar informação.',
        'An employee of the company, or a partner (company or individual) the company will share information with.',
      ),
      options: [
        { value: 'trabalhador', label: l('Trabalhador', 'Employee') },
        { value: 'parceiro', label: l('Parceiro, fornecedor ou consultor', 'Partner, supplier or consultant') },
      ],
    },
    ...workerFields(['nome', 'genero', 'cargo', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada']).map(
      (f) => ({ ...f, showIf: isTrab, required: f.name === 'trabalhadorNome' ? true : f.required }),
    ),
    parc('parceiroNatureza', 'radio', ['Natureza', 'Type'], isParc, {
      options: [
        { value: 'empresa', label: l('Empresa', 'Company') },
        { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
      ],
      default: 'empresa',
      width: 'full',
    }),
    parc('parceiroNome', 'text', ['Nome ou firma', 'Name or company name'], isParc, { required: true, width: 'full', personKey: 'nome' }),
    parc('parceiroGenero', 'radio', ['Tratamento', 'Form of address'], parcPessoa, { options: GENERO_OPTIONS, default: 'M', personKey: 'genero' }),
    parc('parceiroNacionalidade', 'text', ['Nacionalidade', 'Nationality'], parcPessoa, { personKey: 'nacionalidade' }),
    parc('parceiroDocTipo', 'select', ['Documento de identificação', 'ID document'], parcPessoa, { options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' }),
    parc('parceiroDocNumero', 'text', ['Número do documento', 'Document number'], parcPessoa, { personKey: 'docNumero' }),
    parc('parceiroNuit', 'text', ['NUIT', 'Tax number (NUIT)'], isParc, { personKey: 'nuit' }),
    parc('parceiroNuel', 'text', ['NUEL', 'Company registration (NUEL)'], parcEmpresa),
    parc('parceiroMorada', 'text', ['Sede ou morada', 'Registered office or address'], isParc, { width: 'full', personKey: 'morada' }),
    parc('parceiroRepresentante', 'text', ['Representante', 'Representative'], parcEmpresa),
    parc('parceiroRepresentanteCargo', 'text', ['Cargo do representante', 'Representative’s position'], parcEmpresa, {
      placeholder: l('Ex.: Administrador', 'E.g. Director'),
    }),
    {
      name: 'finalidade',
      type: 'text',
      section: 'acordo',
      label: l('Finalidade da partilha de informação', 'Purpose of sharing information'),
      help: l('Para que a informação pode ser usada. Para trabalhadores, pode ficar vazio.', 'What the information may be used for. May be left empty for employees.'),
      placeholder: l('Ex.: avaliação de uma possível parceria para a distribuição de produtos em Nampula', 'E.g. assessing a possible distribution partnership in Nampula'),
    },
    {
      name: 'anosApos',
      type: 'number',
      section: 'acordo',
      width: 'half',
      min: 1,
      max: 20,
      default: 5,
      label: l('Anos de sigilo após o fim da relação', 'Years of confidentiality after the relationship ends'),
    },
    {
      name: 'clausulaPenal',
      type: 'money',
      section: 'acordo',
      width: 'half',
      label: l('Cláusula penal por violação (opcional)', 'Penalty per breach (optional)'),
      help: l('Valor fixo a pagar por cada violação, além da indemnização pelo dano excedente.', 'Fixed amount per breach, in addition to damages for any excess loss.'),
    },
    {
      name: 'foro',
      type: 'text',
      section: 'acordo',
      label: l('Tribunal competente', 'Competent court'),
      default: (c) => defaultForo(c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo'),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (isParc(v) && !trim(v.finalidade)) {
      w.push({
        level: 'warning',
        field: 'finalidade',
        message: l('Indique a finalidade para a qual a informação é partilhada: limita o uso permitido.', 'State the purpose of sharing: it limits the permitted use.'),
      });
    }
    if (isParc(v) && !trim(v.parceiroNuit)) {
      w.push({ level: 'info', field: 'parceiroNuit', message: l('Falta o NUIT do parceiro.', 'The partner’s NUIT is missing.') });
    }
    if (isTrab(v) && !trim(v.trabalhadorDocNumero)) {
      w.push({ level: 'info', field: 'trabalhadorDocNumero', message: l('Falta o número do documento de identificação do trabalhador.', 'The employee’s ID number is missing.') });
    }
    const anos = num(v.anosApos);
    if (anos != null && anos > 10) {
      w.push({
        level: 'info',
        field: 'anosApos',
        message: l('Um prazo muito longo pode ser considerado excessivo em tribunal. Confirme se é necessário.', 'A very long period may be considered excessive by a court. Confirm it is needed.'),
      });
    }
    return w;
  },

  personName: (v) => (isParc(v) ? v.parceiroNome : v.trabalhadorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const trab = isTrab(v);
    const f = trab && isF(v.trabalhadorGenero);
    const anos = num(v.anosApos) ?? 5;
    const penal = money(v.clausulaPenal);
    const finalidade = trim(v.finalidade).replace(/\.$/, '');
    const relacao = trab ? 'a relação de trabalho' : 'as relações entre as partes no âmbito da Finalidade';

    const objectoText = trab
      ? `1. O presente acordo regula a utilização e a protecção da Informação Confidencial a que a Parte Receptora tenha acesso no âmbito da relação de trabalho com a Parte Divulgadora${
          trim(v.trabalhadorCargo) ? `, no exercício das funções de ${trim(v.trabalhadorCargo)}` : ''
        }${finalidade ? ` e, em especial, para ${lc(finalidade)}` : ''} (adiante «Finalidade»).\n2. O presente acordo complementa o dever de sigilo a que ${f ? 'a trabalhadora' : 'o trabalhador'} está ${f ? 'sujeita' : 'sujeito'} nos termos ${daLeiSigilo()} (Lei do Trabalho), não o substituindo.`
      : `O presente acordo regula a utilização e a protecção da Informação Confidencial que a Parte Divulgadora revele à Parte Receptora, ou a que esta tenha acesso, no âmbito do seguinte objectivo: **${finalidade || BLANK}** (adiante «Finalidade»).`;

    const clauses: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto',
        text: objectoText,
        en: trab
          ? 'This agreement governs the use and protection of Confidential Information the Receiving Party accesses through employment with the Disclosing Party (the “Purpose”). It supplements, and does not replace, the statutory duty of confidentiality under the Labour Law.'
          : `This agreement governs the use and protection of Confidential Information disclosed for the following purpose: ${finalidade || '—'} (the “Purpose”).`,
      },
      {
        id: 'definicao',
        heading: 'Informação Confidencial',
        text: 'Para efeitos do presente acordo, considera-se Informação Confidencial toda a informação, em qualquer suporte, escrito, oral, electrónico ou outro, relativa à Parte Divulgadora ou aos seus clientes, fornecedores e parceiros, independentemente de estar ou não identificada como confidencial, incluindo, designadamente:',
        items: enumerate([
          'Dados financeiros, contabilísticos e fiscais',
          'Planos de negócio, estratégias comerciais, propostas, preços e margens',
          'Listas de clientes e de fornecedores e as respectivas condições contratuais',
          'Conhecimentos técnicos (know-how), processos, métodos, programas informáticos e documentação técnica',
          'Dados pessoais de trabalhadores, clientes ou terceiros',
          'O conteúdo das negociações entre as partes e do presente acordo',
        ]),
        en: 'Confidential Information means all information, in any form, about the Disclosing Party or its clients, suppliers and partners, whether or not marked confidential, including financial data, business plans and prices, client and supplier lists, know-how and software, personal data, and the content of negotiations and of this agreement.',
      },
      {
        id: 'obrigacoes',
        heading: 'Obrigações da Parte Receptora',
        text: 'A Parte Receptora obriga-se a:',
        items: enumerate([
          'Utilizar a Informação Confidencial exclusivamente para a Finalidade',
          'Não divulgar a Informação Confidencial a terceiros sem autorização prévia e escrita da Parte Divulgadora',
          trab
            ? 'Não retirar das instalações ou dos sistemas da Parte Divulgadora documentos, ficheiros ou outros suportes, salvo quando necessário ao exercício das suas funções'
            : 'Limitar o acesso à Informação Confidencial aos seus trabalhadores, colaboradores e consultores que dela necessitem para a Finalidade e que estejam vinculados a obrigações de sigilo equivalentes, respondendo por qualquer violação cometida por estes',
          'Adoptar as medidas de segurança adequadas para impedir o acesso, a utilização ou a divulgação não autorizados',
          'Não copiar nem reproduzir a Informação Confidencial, salvo na medida estritamente necessária à Finalidade',
          'Comunicar de imediato à Parte Divulgadora qualquer divulgação ou acesso não autorizado de que tenha conhecimento',
        ]),
        en: 'The Receiving Party shall: use the information only for the Purpose; not disclose it without prior written consent; ' +
          (trab ? 'not remove documents or files from the premises or systems unless needed for the job; ' : 'limit access to staff and advisers who need it and are bound by equivalent confidentiality, being liable for their breaches; ') +
          'take adequate security measures; not copy it beyond what is strictly necessary; report any unauthorised disclosure immediately.',
      },
      {
        id: 'excepcoes',
        heading: 'Excepções',
        text: 'As obrigações previstas no presente acordo não se aplicam à informação que a Parte Receptora demonstre:',
        items: enumerate([
          'Ser ou tornar-se do domínio público sem violação do presente acordo',
          'Estar legitimamente na sua posse antes de lhe ter sido revelada, sem obrigação de sigilo',
          'Ter sido recebida licitamente de terceiro não sujeito a obrigação de sigilo',
          'Dever ser divulgada por imposição legal ou por ordem de autoridade judicial ou administrativa, caso em que a Parte Receptora avisa previamente a Parte Divulgadora, sempre que legalmente possível, e divulga apenas a parte estritamente exigida',
        ]),
        en: 'The obligations do not apply to information the Receiving Party shows: is or becomes public without breach; was lawfully held before disclosure without a duty of confidentiality; was lawfully received from a third party not bound by confidentiality; must be disclosed by law or by order of a court or authority (with prior notice where lawful, and only to the extent required).',
      },
      {
        id: 'duracao',
        heading: 'Vigência',
        text: [
          `1. O presente acordo entra em vigor na data da sua assinatura e mantém-se em vigor durante ${relacao}.`,
          `2. As obrigações de confidencialidade subsistem por um período de ${qty(anos, 'ano', 'anos')} após a cessação d${trab ? 'a relação de trabalho' : 'essas relações'}, qualquer que seja o motivo, mantendo-se, quanto a segredos comerciais e a dados pessoais, enquanto a informação conservar natureza confidencial.`,
        ].join('\n'),
        en: `1. This agreement takes effect on signature and lasts for the duration of ${trab ? 'the employment' : 'the parties’ dealings for the Purpose'}. 2. Confidentiality obligations continue for ${anos} year(s) after it ends for any reason, and for trade secrets and personal data for as long as the information remains confidential.`,
      },
      {
        id: 'devolucao',
        heading: 'Devolução de materiais',
        text: `Cessada ${relacao} ou a pedido da Parte Divulgadora, a Parte Receptora deve devolver ou destruir, conforme lhe for indicado, todos os documentos, ficheiros e suportes que contenham Informação Confidencial, incluindo as cópias, e confirmar por escrito o cumprimento desta obrigação.`,
        en: 'When the relationship ends, or on request, the Receiving Party must return or destroy, as instructed, all documents, files and media containing Confidential Information, including copies, and confirm this in writing.',
      },
      {
        id: 'propriedade',
        heading: 'Titularidade',
        text: 'A Informação Confidencial é e permanece propriedade da Parte Divulgadora. A sua revelação não confere à Parte Receptora qualquer direito de propriedade, licença ou outro direito sobre a mesma.',
        en: 'Confidential Information remains the property of the Disclosing Party. Disclosure grants no ownership, licence or other right.',
      },
    ];

    const incumprimento = [
      '1. A violação de qualquer das obrigações previstas no presente acordo constitui a Parte Receptora na obrigação de indemnizar a Parte Divulgadora por todos os danos causados, nos termos gerais de direito.',
    ];
    if (penal != null && penal > 0) {
      incumprimento.push(
        `${incumprimento.length + 1}. Sem prejuízo do número anterior, a Parte Receptora pagará à Parte Divulgadora, a título de cláusula penal, o montante de **${moneyExt(penal)}** por cada violação, ficando expressamente convencionado o direito a indemnização pelo dano excedente.`,
      );
    }
    if (trab) {
      incumprimento.push(
        `${incumprimento.length + 1}. A violação do presente acordo constitui ainda infracção disciplinar grave, que pode fundamentar o despedimento com justa causa, nos termos da Lei do Trabalho, sem prejuízo da responsabilidade criminal a que houver lugar.`,
      );
    }
    clauses.push(
      {
        id: 'incumprimento',
        heading: 'Incumprimento',
        text: incumprimento.join('\n'),
        en: `Any breach obliges the Receiving Party to compensate all damage caused.${penal ? ` A penalty of ${moneyExt(penal)} is due per breach, plus damages for any excess loss.` : ''}${
          trab ? ' For an employee, breach is also a serious disciplinary offence that may justify dismissal, without prejudice to criminal liability.' : ''
        }`,
      },
      {
        id: 'gerais',
        heading: 'Disposições gerais',
        text: [
          '1. Qualquer alteração ao presente acordo só é válida se constar de documento escrito assinado por ambas as partes.',
          '2. A invalidade de alguma das cláusulas não afecta a validade das restantes.',
          '3. A Parte Receptora não pode ceder a sua posição no presente acordo sem consentimento escrito da Parte Divulgadora.',
        ].join('\n'),
        en: '1. Amendments only in writing signed by both parties. 2. Invalidity of one clause does not affect the others. 3. The Receiving Party may not assign this agreement without written consent.',
      },
      {
        id: 'foro',
        heading: 'Lei aplicável e foro',
        text: [
          '1. O presente acordo rege-se pela lei moçambicana.',
          `2. Para a resolução de quaisquer litígios emergentes do presente acordo, as partes elegem o foro do ${trim(v.foro) || BLANK}, com expressa renúncia a qualquer outro${
            trab ? ', sem prejuízo das normas imperativas sobre a competência dos tribunais em matéria laboral' : ''
          }.`,
        ].join('\n'),
        en: `1. Mozambican law applies. 2. Disputes go to the ${v.foro || 'competent court'}${trab ? ', subject to mandatory rules on labour court jurisdiction' : ''}.`,
      },
    );

    const receptoraParty = trab ? workerParty(v, 'Parte Receptora') : parceiroParty(v);
    const receptoraSig = trab
      ? { role: 'A Parte Receptora', name: trim(v.trabalhadorNome) || undefined }
      : parcEmpresa(v)
        ? {
            role: 'A Parte Receptora',
            name: trim(v.parceiroRepresentante) || trim(v.parceiroNome) || undefined,
            detail: trim(v.parceiroRepresentante) ? [trim(v.parceiroRepresentanteCargo), trim(v.parceiroNome)].filter(Boolean).join(', ') : undefined,
          }
        : { role: 'A Parte Receptora', name: trim(v.parceiroNome) || undefined };

    const blocks: Block[] = [
      { type: 'title', text: 'Acordo de confidencialidade', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteDivulgadora', text: `${employerParty(ctx, 'Parte Divulgadora')};`, en: 'The company identified above (the “Disclosing Party”);' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parteReceptora', text: `${receptoraParty};`, en: 'The person or company identified above (the “Receiving Party”);' },
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'É celebrado, de boa-fé, o presente acordo de confidencialidade, que se rege pelas cláusulas seguintes:',
        en: 'This confidentiality agreement is entered into in good faith and is governed by the following clauses:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: 'O presente acordo é feito em dois exemplares de igual valor, ficando um em poder de cada uma das partes.',
        en: 'This agreement is made in two counterparts of equal value, one for each party.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [employerSig(ctx, 'A Parte Divulgadora'), receptoraSig],
      },
    ];
    return blocks;
  },
});

