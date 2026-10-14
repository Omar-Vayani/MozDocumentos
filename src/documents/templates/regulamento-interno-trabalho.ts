// Regulamento interno de trabalho (Lei do Trabalho, poder regulamentar):
// organisation and discipline of work, mandatory for medium and large
// employers. Takes effect only after the union body is consulted and is
// notified to the labour administration; it is posted at the workplace.
// Sanctions are only those of the Labour Law (no others may be created).

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, FORMA_PAGAMENTO_OPTIONS, l, placeDate } from './_shared';
import { doCite, nExt, qty } from './_contrato-trabalho';
import {
  alineas, APROVACAO_SECTION, aprovacaoFields, aprovadorSignature, capitulosBlocks, empresa, linhas, nosTermos, recepcaoBox, refCite, str, vigorClause,
  type Capitulo,
} from './_rh-politicas';

const REGISTO: Record<string, string> = {
  livro: 'livro de ponto',
  biometrico: 'relógio de ponto biométrico',
  electronico: 'sistema electrónico de registo de assiduidade',
  cartao: 'cartão de ponto',
};

const PAGAMENTO: Record<string, string> = {
  'transferência bancária': 'por transferência bancária para a conta indicada pelo trabalhador',
  numerário: 'em numerário, contra recibo',
  cheque: 'por cheque',
  'M-Pesa': 'por M-Pesa',
  'e-Mola': 'por e-Mola',
  mKesh: 'por mKesh',
};

export default defineTemplate({
  id: 'regulamento-interno-trabalho',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'geral', title: l('Empresa e âmbito', 'Company and scope') },
    { id: 'tempo', title: l('Tempo de trabalho', 'Working time') },
    { id: 'remuneracao', title: l('Remuneração', 'Pay') },
    { id: 'capitulos', title: l('Capítulos opcionais', 'Optional chapters') },
    APROVACAO_SECTION,
  ],
  fields: [
    {
      name: 'estabelecimentos',
      type: 'text',
      section: 'geral',
      label: l('Estabelecimentos abrangidos', 'Workplaces covered'),
      placeholder: l('Ex.: sede em Maputo e estaleiros de obra', 'E.g. head office in Maputo and building sites'),
      help: l('Se ficar em branco: todos os estabelecimentos e locais de trabalho da empresa.', 'If blank: all the company’s workplaces.'),
    },
    {
      name: 'horario',
      type: 'textarea',
      section: 'tempo',
      rows: 3,
      required: true,
      label: l('Horário de trabalho (um por linha)', 'Working hours (one per line)'),
      default: 'Serviços administrativos: segunda a sexta-feira, das 7h30 às 16h30, com intervalo de descanso das 12h00 às 13h00\nPessoal de operações: conforme o mapa de horário de trabalho afixado',
      help: l('Deve coincidir com o mapa de horário de trabalho visado pela Inspecção do Trabalho.', 'Must match the schedule stamped by the Labour Inspectorate.'),
    },
    { name: 'registoPonto', type: 'select', section: 'tempo', width: 'half', label: l('Registo de assiduidade', 'Attendance record'), default: 'biometrico', options: [
      { value: 'livro', label: l('Livro de ponto', 'Attendance book') },
      { value: 'biometrico', label: l('Relógio biométrico', 'Biometric clock') },
      { value: 'electronico', label: l('Sistema electrónico', 'Electronic system') },
      { value: 'cartao', label: l('Cartão de ponto', 'Time card') },
    ] },
    { name: 'toleranciaMinutos', type: 'number', section: 'tempo', width: 'half', min: 0, max: 30, label: l('Tolerância de atraso (minutos)', 'Lateness tolerance (minutes)'), help: l('Opcional. Atrasos dentro da tolerância não são descontados, desde que não sejam habituais.', 'Optional. Lateness within the tolerance is not deducted unless habitual.') },
    { name: 'mesPlanoFerias', type: 'text', section: 'tempo', width: 'half', label: l('Plano de férias afixado até', 'Leave plan posted by'), default: '31 de Março' },
    { name: 'pagamentoData', type: 'text', section: 'remuneracao', width: 'half', label: l('Data de pagamento', 'Pay date'), default: 'até ao último dia útil de cada mês' },
    { name: 'pagamentoForma', type: 'select', section: 'remuneracao', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'modTI', type: 'toggle', section: 'capitulos', default: true, label: l('Uso de equipamentos, viaturas e meios informáticos', 'Use of equipment, vehicles and IT') },
    { name: 'modAlcool', type: 'toggle', section: 'capitulos', default: false, label: l('Controlo de álcool e drogas', 'Alcohol and drug control'), help: l('Testes de alcoolemia não invasivos em funções de risco, com testemunha. Nunca testes de HIV.', 'Non-invasive alcohol tests in risk roles, with a witness. Never HIV tests.') },
    { name: 'modApoioSocial', type: 'toggle', section: 'capitulos', default: false, label: l('Regalias e apoio social', 'Benefits and welfare') },
    {
      name: 'apoioSocial',
      type: 'textarea',
      section: 'capitulos',
      rows: 3,
      label: l('Regalias (uma por linha)', 'Benefits (one per line)'),
      placeholder: l('Ex.: Subsídio de funeral por morte de familiar directo\nTransporte do pessoal de turno nocturno', 'E.g. Funeral allowance\nTransport for night shift'),
      showIf: (v) => Boolean(v.modApoioSocial),
    },
    ...aprovacaoFields({ consulta: true, comunicacao: true }),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    w.push({
      level: 'info',
      message: l(
        `Antes de entrar em vigor, peça parecer ao comité sindical (ou ao órgão sindical competente) e comunique o regulamento à administração do trabalho (${cite('rhpPoderRegulamentar')}). Use os documentos "Pedido de parecer ao órgão sindical" e "Comunicação ao Ministério do Trabalho".`,
        'Before it takes effect, ask the union committee for its opinion and notify the labour administration. Use the documents "Request for the union’s opinion" and "Notice to the Ministry of Labour".',
      ),
    });
    if (!v.dataConsulta) w.push({ level: 'warning', field: 'dataConsulta', message: l('Indique a data em que pediu parecer ao órgão sindical: sem consulta o regulamento não pode entrar em vigor.', 'Enter the date the union was consulted: without it the regulations cannot take effect.') });
    if (!v.dataComunicacao) w.push({ level: 'info', field: 'dataComunicacao', message: l('Indique a data em que o regulamento foi comunicado à administração do trabalho.', 'Enter the date the regulations were notified to the labour administration.') });
    w.push({
      level: 'info',
      message: l(
        `Os trabalhadores já admitidos podem opor-se por escrito às novas condições no prazo legal (${cite('regulamentoInterno')}). Guarde as declarações de recepção assinadas.`,
        'Existing employees may object in writing within the legal period. Keep the signed acknowledgement slips.',
      ),
    });
    if (v.modAlcool) w.push({ level: 'info', field: 'modAlcool', message: l(`Os testes de HIV são proibidos (${cite('rhpHivTrabalho')}). Os testes de álcool e drogas só servem para apurar a aptidão para o trabalho.`, 'HIV tests are prohibited. Alcohol and drug tests only assess fitness for work.') });
    return w;
  },
  documentDate: (v) => v.dataAprovacao,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = empresa(ctx);
    const sancoes = ctx.legal.value<{ suspensaoMaxDias: number; suspensaoMaxAno: number; multaMaxDias: number; despromocaoMaxAnos: number }>('sancoesDisciplinares');
    const extra = ctx.legal.value<{ trimestre: number; semana: number; ano: number }>('rhpTrabalhoExtraordinario');
    const oposicao = ctx.legal.value<{ oposicaoDias: number }>('regulamentoInterno').oposicaoDias;
    const avisoFalta = ctx.legal.value<{ antecedenciaDias: number }>('faltasComunicacao').antecedenciaDias;
    const tol = Number(v.toleranciaMinutos);
    const horarios = linhas(v.horario);
    const apoio = linhas(v.apoioSocial);
    const estab = str(v.estabelecimentos);

    const caps: Capitulo[] = [];
    caps.push({
      titulo: 'Disposições gerais',
      artigos: [
        {
          id: 'objecto',
          heading: 'Objecto e âmbito',
          text: `1. O presente regulamento estabelece as normas de organização e disciplina do trabalho ${nome === BLANK ? 'da Empresa' : `de **${nome}**`}, adiante designada por Empresa, ${nosTermos('rhpPoderRegulamentar')}.\n2. Aplica-se a todos os trabalhadores da Empresa, qualquer que seja a modalidade do seu contrato, ${estab ? `que prestem serviço em ${estab.replace(/\.$/, '')}` : 'em todos os seus estabelecimentos e locais de trabalho'}, e, com as necessárias adaptações, aos estagiários.`,
          en: 'Purpose and scope: rules on the organisation and discipline of work, applying to all employees and, as adapted, to interns.',
        },
        {
          id: 'fontes',
          heading: 'Prevalência da lei',
          text: `1. Em tudo o que não estiver previsto no presente regulamento aplicam-se a Lei do Trabalho, os instrumentos de regulamentação colectiva aplicáveis e os contratos individuais de trabalho.\n2. Nenhuma disposição deste regulamento prevalece sobre norma legal imperativa nem sobre condição mais favorável ao trabalhador prevista no seu contrato.`,
          en: 'The Labour Law, collective agreements and individual contracts apply to anything not covered; nothing here overrides mandatory law or more favourable contract terms.',
        },
      ],
    });
    caps.push({
      titulo: 'Admissão',
      artigos: [
        {
          id: 'admissao',
          heading: 'Admissão',
          text: '1. A admissão de trabalhadores é decidida pela Direcção, de acordo com as necessidades da Empresa e o perfil do posto de trabalho, sem discriminação em razão da cor, raça, sexo, origem étnica, lugar de nascimento, religião, posição social, opção política ou estado de saúde, incluindo o estado serológico.\n2. No acto de admissão o trabalhador entrega cópia do documento de identificação, do NUIT, do cartão de beneficiário do INSS (ou os dados para a sua inscrição), dos certificados de habilitações e, quando exigido, do atestado de aptidão física.\n3. O contrato de trabalho é celebrado por escrito e dele é entregue um exemplar ao trabalhador.',
          en: 'Hiring by management without discrimination (including HIV status); documents to submit; written contract with a copy for the employee.',
        },
        {
          id: 'probatorio',
          heading: 'Período probatório',
          text: `O período probatório, quando acordado por escrito, tem a duração fixada no contrato, dentro dos limites legais ${refCite('periodoProbatorioIndeterminado')}. Durante esse período, o trabalhador é acompanhado pela chefia directa, que lhe dá a conhecer as funções, os riscos do posto e as normas internas.`,
          en: 'Probation, when agreed in writing, lasts as stated in the contract within the legal limits; the supervisor accompanies the new employee.',
        },
        {
          id: 'processo',
          heading: 'Processo individual',
          text: '1. A Empresa organiza um processo individual de cada trabalhador, com o contrato, as alterações de categoria e remuneração, as férias, as faltas, as acções de formação, as avaliações e as sanções disciplinares.\n2. Os dados pessoais são tratados com confidencialidade e não são fornecidos a terceiros sem o consentimento expresso do trabalhador, salvo obrigação legal.\n3. O trabalhador pode consultar o seu processo e deve comunicar, por escrito, qualquer alteração de morada, estado civil, agregado familiar ou contactos.',
          en: 'Personnel file: contents, confidentiality of personal data, employee access and duty to report changes.',
        },
      ],
    });
    caps.push({
      titulo: 'Direitos e deveres',
      artigos: [
        {
          id: 'deveresTrabalhador',
          heading: 'Deveres do trabalhador',
          text: `Além dos deveres previstos ${doCite('rhpDeveresTrabalhador')}, o trabalhador deve, em especial:`,
          items: alineas([
            'comparecer ao serviço com pontualidade e assiduidade e registar as entradas e saídas',
            'prestar o trabalho com zelo e diligência e cumprir as ordens e instruções legítimas das chefias',
            'tratar com respeito e correcção os colegas, as chefias, os clientes e o público',
            'usar o uniforme e o cartão de identificação, quando fornecidos',
            'guardar sigilo sobre os métodos de produção, os negócios e os dados de clientes da Empresa',
            'utilizar correctamente e conservar os bens e equipamentos que lhe forem confiados',
            'cumprir as normas de higiene e segurança no trabalho e usar os equipamentos de protecção individual',
            'comunicar à chefia qualquer acto lesivo da Empresa, da segurança de pessoas e bens ou do ambiente de trabalho',
          ]),
          en: 'Employee duties: those in the Labour Law plus punctuality and clocking, diligence, respect, uniform and ID card, confidentiality, care of equipment, health and safety, reporting harmful acts.',
        },
        {
          id: 'deveresEmpresa',
          heading: 'Deveres da Empresa',
          text: `A Empresa cumpre os deveres previstos ${doCite('rhpDeveresEmpregador')}, nomeadamente:`,
          items: alineas([
            'pagar pontualmente a remuneração e entregar o respectivo recibo',
            'inscrever os trabalhadores no INSS e entregar as contribuições devidas',
            'garantir boas condições de higiene, saúde e segurança e manter o seguro de acidentes de trabalho',
            'atribuir e manter a categoria profissional correspondente às funções exercidas',
            'proporcionar formação profissional adequada',
            'tratar os trabalhadores com correcção e respeitar a sua dignidade e privacidade',
            'permitir o exercício da actividade sindical',
          ]),
          en: 'Company duties: timely pay with payslip, INSS registration, health and safety and accident insurance, correct job grade, training, respect, union activity.',
        },
      ],
    });
    const tempo: ClauseItem[] = [
      {
        id: 'horario',
        heading: 'Horário de trabalho',
        text: `1. O horário de trabalho é o constante do mapa de horário de trabalho afixado em cada local de trabalho, visado pelo órgão competente da administração do trabalho, sendo actualmente o seguinte:\n${horarios.length ? horarios.map((h) => `— ${h};`).join('\n').replace(/;$/, '.') : `— ${BLANK}.`}\n2. A alteração do horário é precedida de consulta ao órgão sindical e comunicada aos trabalhadores e à administração do trabalho ${nosTermos('horarioComunicacao')}.\n3. Os trabalhadores isentos de horário são identificados por escrito.`,
        en: 'Working hours as in the posted, stamped schedule; changes after union consultation and notice; exempt staff identified in writing.',
      },
      {
        id: 'assiduidade',
        heading: 'Pontualidade e registo de assiduidade',
        text: `1. As entradas e saídas são registadas pelo próprio trabalhador no ${REGISTO[v.registoPonto as string] ?? REGISTO.livro}. É proibido registar a entrada ou a saída de outro trabalhador.\n2. ${Number.isFinite(tol) && tol > 0 ? `Os atrasos até ${nExt(tol)} minutos não são descontados, desde que não sejam habituais; os restantes são somados e descontados na remuneração.` : 'Os atrasos e saídas antecipadas não autorizados são somados e descontados na remuneração.'}\n3. A ausência do posto de trabalho durante o período de trabalho carece de autorização da chefia.`,
        en: 'Employees clock in and out themselves; clocking for others is forbidden; lateness rules; leaving the post needs permission.',
      },
      {
        id: 'extraordinario',
        heading: 'Trabalho extraordinário e excepcional',
        text: `1. O trabalho extraordinário só é prestado mediante ordem escrita da chefia, para fazer face a acréscimos de trabalho ou por motivos ponderosos, até ${qty(extra.semana, 'hora', 'horas', true)} por semana, ${qty(extra.trimestre, 'hora', 'horas', true)} por trimestre e ${qty(extra.ano, 'hora', 'horas', true)} por ano ${refCite('rhpTrabalhoExtraordinario')}.\n2. O trabalho extraordinário e o trabalho em dia de descanso ou feriado são registados antes do início e após o termo, com indicação do fundamento, e visados pelo trabalhador.\n3. A remuneração e o descanso compensatório são os previstos na lei ${refCite('rhpRemuneracaoExtra')}.`,
        en: 'Overtime only on written order, within the weekly, quarterly and yearly limits; registered and countersigned; paid and compensated as the law provides.',
      },
      {
        id: 'ferias',
        heading: 'Férias',
        text: `1. O plano de férias é elaborado pela Empresa, em coordenação com o órgão sindical, e afixado até ${str(v.mesPlanoFerias) || BLANK} de cada ano ${refCite('feriasGozo')}.\n2. Os pedidos de férias são apresentados por escrito à chefia, com a antecedência necessária à organização do serviço.\n3. As férias são gozadas seguidas; só por acordo podem ser fraccionadas, nos termos da lei.`,
        en: 'Leave plan drawn up with the union and posted by the date set; requests in writing; leave taken in one block unless agreed.',
      },
      {
        id: 'faltas',
        heading: 'Faltas',
        text: `1. As faltas previsíveis são comunicadas à chefia com a antecedência mínima de ${qty(avisoFalta, 'dia', 'dias')}; as imprevisíveis, logo que possível, pelo próprio ou por interposta pessoa.\n2. A justificação é apresentada por escrito, com os documentos comprovativos, no regresso ao serviço.\n3. São justificadas as faltas previstas ${doCite('faltasJustificadas')}; as restantes são injustificadas e descontadas na remuneração, sem prejuízo de procedimento disciplinar.`,
        en: 'Foreseeable absences notified in advance; written justification with proof; justified absences are those in the Labour Law.',
      },
    ];
    caps.push({ titulo: 'Tempo de trabalho', artigos: tempo });
    caps.push({
      titulo: 'Remuneração',
      artigos: [
        {
          id: 'remuneracao',
          heading: 'Pagamento da remuneração',
          text: `1. A remuneração é paga ${str(v.pagamentoData) || BLANK}, ${PAGAMENTO[v.pagamentoForma as string] ?? PAGAMENTO['transferência bancária']}.\n2. Com cada pagamento é entregue ao trabalhador o recibo com a discriminação da remuneração, dos subsídios e dos descontos.\n3. Só são feitos os descontos previstos na lei ou autorizados por escrito pelo trabalhador, dentro dos limites ${doCite('descontosRemuneracao')}.`,
          en: 'Pay date and method; payslip with each payment; only lawful or authorised deductions within the legal limits.',
        },
      ],
    });
    const seg: ClauseItem[] = [
      {
        id: 'seguranca',
        heading: 'Higiene, saúde e segurança',
        text: `1. A Empresa informa cada trabalhador dos riscos do seu posto, dá formação sobre as regras de segurança e fornece gratuitamente os equipamentos de protecção individual adequados ${refCite('rhpHigieneSeguranca')}.\n2. O uso dos equipamentos de protecção é obrigatório nos locais e tarefas indicados pela Empresa; a violação culposa das regras de segurança é infracção disciplinar.\n3. Os acidentes e incidentes são comunicados de imediato à chefia, que organiza os primeiros socorros e o registo da ocorrência.`,
        en: 'Risk information, safety training and free protective equipment; mandatory use; accidents reported at once.',
      },
    ];
    if (v.modAlcool) {
      seg.push({
        id: 'alcool',
        heading: 'Álcool e substâncias psicotrópicas',
        text: '1. É proibido apresentar-se ao serviço ou trabalhar sob a influência de álcool ou de estupefacientes, bem como consumi-los ou tê-los em posse no local de trabalho.\n2. Nas funções de condução, operação de máquinas e outras de risco, a Empresa pode realizar testes de alcoolemia por meios não invasivos, com respeito pela dignidade do trabalhador e na presença de uma testemunha à sua escolha.\n3. O resultado é comunicado apenas ao trabalhador e a quem decide sobre a sua aptidão para o serviço. Em caso algum são realizados testes para apurar o estado serológico do HIV.',
        en: 'No alcohol or drugs at work; non-invasive alcohol tests in risk roles with a witness; confidential results; never HIV tests.',
      });
    }
    caps.push({ titulo: 'Segurança e saúde no trabalho', artigos: seg });
    if (v.modTI !== false) {
      caps.push({
        titulo: 'Utilização de bens e meios da Empresa',
        artigos: [
          {
            id: 'bens',
            heading: 'Equipamentos e viaturas',
            text: '1. Os equipamentos, ferramentas, viaturas e instalações da Empresa destinam-se exclusivamente ao serviço; o seu uso para fins pessoais carece de autorização.\n2. A entrega de equipamentos é registada em termo de entrega assinado pelo trabalhador, que os devolve em bom estado, salvo o desgaste normal.\n3. As viaturas são conduzidas apenas por trabalhadores autorizados e habilitados, com registo de utilização.',
            en: 'Company equipment and vehicles only for work; handover recorded; authorised drivers only.',
          },
          {
            id: 'ti',
            heading: 'Meios informáticos e comunicações',
            text: `1. O correio electrónico, o acesso à internet e os sistemas informáticos da Empresa são de uso profissional; é permitido o uso pessoal moderado que não prejudique o serviço nem a segurança dos sistemas ${refCite('rhpCorrespondencia')}.\n2. É proibido instalar programas não autorizados, divulgar palavras-passe ou copiar dados da Empresa para fins alheios ao serviço.\n3. A correspondência pessoal do trabalhador é inviolável. Os meios de vigilância à distância só são usados para a protecção e segurança de pessoas e bens, sendo os trabalhadores informados por escrito da sua existência e finalidade.`,
            en: 'IT for work with moderate personal use; no unauthorised software or data copying; personal correspondence is private; CCTV only for safety, with written notice.',
          },
        ],
      });
    }
    caps.push({
      titulo: 'Dignidade no trabalho',
      artigos: [
        {
          id: 'assedio',
          heading: 'Não discriminação e assédio',
          text: `1. São proibidos a discriminação e o assédio, incluindo o assédio sexual e com base no género, no local de trabalho ou fora dele ${refCite('rhpAssedio')}.\n2. Qualquer trabalhador pode apresentar queixa, verbalmente ou por escrito, à sua chefia, aos Recursos Humanos ou à Direcção; a queixa é tratada com confidencialidade e quem a apresenta de boa-fé não pode ser prejudicado.\n3. A prática de assédio é infracção disciplinar grave.`,
          en: 'Discrimination and harassment, including sexual and gender-based, are prohibited; confidential complaints without retaliation; harassment is a serious disciplinary offence.',
        },
      ],
    });
    caps.push({
      titulo: 'Disciplina',
      artigos: [
        {
          id: 'infraccoes',
          heading: 'Infracções disciplinares',
          text: 'Constitui infracção disciplinar o comportamento culposo do trabalhador que viole os seus deveres, nomeadamente o incumprimento do horário, as faltas injustificadas, a desobediência a ordens legítimas, a falta de respeito, a quebra de sigilo, o uso indevido de bens da Empresa, a embriaguez ou o consumo de estupefacientes no trabalho, o furto, a fraude, o assédio e a violação das regras de segurança.',
          en: 'Disciplinary offences: culpable breach of duties, such as lateness, unjustified absence, disobedience, disrespect, breach of confidentiality, misuse of assets, intoxication, theft, fraud, harassment and safety breaches.',
        },
        {
          id: 'sancoes',
          heading: 'Sanções disciplinares',
          text: `1. Às infracções aplicam-se exclusivamente as sanções previstas ${doCite('sancoesDisciplinares')}:`,
          items: alineas([
            'admoestação verbal',
            'repreensão registada',
            `suspensão do trabalho com perda de remuneração, até ${qty(sancoes.suspensaoMaxDias, 'dia', 'dias')} por infracção e ${qty(sancoes.suspensaoMaxAno, 'dia', 'dias')} por ano civil`,
            `multa até ${qty(sancoes.multaMaxDias, 'dia', 'dias')} de salário`,
            `despromoção para a categoria imediatamente inferior, por período não superior a ${qty(sancoes.despromocaoMaxAnos, 'ano', 'anos')}`,
            'despedimento',
          ]),
          en: 'Only the statutory sanctions apply: verbal warning, recorded reprimand, unpaid suspension, fine, demotion, dismissal.',
        },
        {
          id: 'procedimento',
          heading: 'Procedimento disciplinar',
          text: `1. Com excepção da admoestação verbal e da repreensão registada, nenhuma sanção é aplicada sem processo disciplinar, com nota de culpa escrita, resposta do trabalhador e parecer do órgão sindical, ${nosTermos('procedimentoDisciplinar')}.\n2. Nenhuma sanção é aplicada sem audição prévia do trabalhador; a sanção é proporcional à gravidade da infracção e à culpa.\n3. O trabalhador pode reclamar da decisão junto de quem a tomou ou recorrer para o superior hierárquico, sem prejuízo dos meios judiciais e extrajudiciais.`,
          en: 'Except warnings, sanctions require a disciplinary process with written charge, reply and union opinion; prior hearing; proportionality; internal complaint or appeal.',
        },
      ],
    });
    if (v.modApoioSocial && apoio.length) {
      caps.push({
        titulo: 'Regalias e apoio social',
        artigos: [
          {
            id: 'apoio',
            heading: 'Regalias sociais',
            text: 'A Empresa concede aos seus trabalhadores as seguintes regalias, nos termos e condições que fixar por ordem de serviço:',
            items: alineas(apoio.map((a) => a.charAt(0).toLowerCase() + a.slice(1))),
            en: 'Benefits granted by the company on the terms it sets.',
          },
        ],
      });
    }
    caps.push({
      titulo: 'Disposições finais',
      artigos: [
        {
          id: 'adesao',
          heading: 'Adesão e oposição',
          text: `1. Presume-se que adere ao presente regulamento o trabalhador cujo contrato escrito refira a sua existência.\n2. As novas condições de trabalho valem como proposta de adesão para os trabalhadores admitidos antes da publicação; o trabalhador pode opor-se por escrito no prazo de ${qty(oposicao, 'dia', 'dias')} a contar da publicação ${refCite('regulamentoInterno')}.`,
          en: 'Adhesion is presumed when the contract mentions the regulations; existing staff may object in writing within the legal period.',
        },
        {
          id: 'omissoes',
          heading: 'Dúvidas e omissões',
          text: 'As dúvidas de interpretação e os casos omissos são resolvidos pela Direcção, ouvido o órgão sindical, de acordo com a lei.',
          en: 'Doubts and gaps are resolved by management after hearing the union, according to the law.',
        },
        vigorClause(ctx, { sujeito: 'O presente regulamento', consulta: true, comunicacao: true }),
      ],
    });

    return [
      { type: 'title', text: 'Regulamento Interno de Trabalho', subtitle: nome !== BLANK ? nome : undefined },
      ...capitulosBlocks(caps),
      { type: 'signatures', placeDate: placeDate(ctx, v.dataAprovacao), columns: [aprovadorSignature(ctx, 'A Direcção')] },
      ...(v.declaracaoRecepcao !== false ? [recepcaoBox('um exemplar do Regulamento Interno de Trabalho')] : []),
    ];
  },
});

