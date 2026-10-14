// Política de HIV e SIDA no local de trabalho: non-discrimination, no HIV
// testing for employment (prohibited), voluntary testing only with counselling
// and consent, confidentiality, continued employment, prevention and support.
// Lei n.º 19/2014 is cited without article numbers (text not confirmed).

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { alineas, APROVACAO_SECTION, aprovacaoFields, empresa, nosTermos, policyBlocks, refCite, str, vigorClause } from './_rh-politicas';

export default defineTemplate({
  id: 'politica-hiv-sida',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'programa', title: l('Programa no local de trabalho', 'Workplace programme') },
    APROVACAO_SECTION,
  ],
  fields: [
    { name: 'pontoFocal', type: 'text', section: 'programa', width: 'half', label: l('Ponto focal (nome ou cargo)', 'Focal point (name or position)'), default: 'Técnico de Higiene e Segurança' },
    { name: 'pontoFocalContacto', type: 'text', section: 'programa', width: 'half', label: l('Contacto do ponto focal', 'Focal point contact') },
    { name: 'unidadeSanitaria', type: 'text', section: 'programa', label: l('Unidade sanitária de referência', 'Referral health facility'), placeholder: l('Ex.: Centro de Saúde do Alto-Maé', 'E.g. Alto-Maé Health Centre') },
    { name: 'preservativos', type: 'toggle', section: 'programa', default: true, label: l('Distribuição gratuita de preservativos', 'Free condom distribution') },
    { name: 'testagemVoluntaria', type: 'toggle', section: 'programa', default: true, label: l('Campanhas de aconselhamento e testagem voluntária', 'Voluntary counselling and testing campaigns') },
    { name: 'outrasDoencas', type: 'toggle', section: 'programa', default: true, label: l('Incluir tuberculose, malária e outras doenças endémicas', 'Include TB, malaria and other endemic diseases') },
    ...aprovacaoFields(),
  ],

  warnings: () => {
    const w: Warning[] = [];
    w.push({
      level: 'info',
      message: l(
        `É proibido exigir ou fazer testes de HIV a candidatos ou trabalhadores para efeitos de emprego (${cite('rhpHivTrabalho')}). A testagem só pode ser voluntária, com aconselhamento e consentimento, e o resultado é do trabalhador.`,
        'Requiring or carrying out HIV tests on applicants or employees for employment purposes is prohibited. Testing must be voluntary, with counselling and consent, and the result belongs to the employee.',
      ),
    });
    return w;
  },
  documentDate: (v) => v.dataAprovacao,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = empresa(ctx);
    const focal = str(v.pontoFocal) || BLANK;
    const contacto = str(v.pontoFocalContacto);
    const us = str(v.unidadeSanitaria);
    const outras = v.outrasDoencas !== false;
    const artigos: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto e princípios',
        text: `1. A presente política estabelece as medidas ${nome === BLANK ? 'da Empresa' : `de **${nome}**, adiante designada por Empresa,`} de prevenção do HIV e SIDA${outras ? ' e de outras doenças endémicas' : ''} no local de trabalho e de protecção dos trabalhadores que vivem com HIV, ${nosTermos('rhpHivTrabalho')} e da ${cite('rhpHivLei19_2014')}.\n2. A Empresa reconhece o HIV e SIDA como uma questão do local de trabalho, a tratar como qualquer outra doença crónica, com base nos princípios da não discriminação, da confidencialidade, do consentimento e do diálogo com os trabalhadores e os seus representantes.`,
        en: 'Purpose and principles: prevention and protection under the Labour Law and Law 19/2014; HIV treated like any other chronic illness; non-discrimination, confidentiality, consent and dialogue.',
      },
      {
        id: 'discriminacao',
        heading: 'Não discriminação',
        text: 'Nenhum candidato ou trabalhador é recusado, preterido na promoção ou na formação, transferido, sancionado ou despedido por viver ou ser suspeito de viver com HIV. É proibida a estigmatização por colegas ou chefias, que constitui infracção disciplinar.',
        en: 'No refusal, denial of promotion or training, transfer, sanction or dismissal because of (suspected) HIV status; stigma is a disciplinary offence.',
      },
      {
        id: 'testes',
        heading: 'Testes',
        text: `1. A Empresa não exige nem realiza testes de HIV a candidatos a emprego ou a trabalhadores, nem pede informação sobre o estado serológico, na admissão ou durante o contrato ${refCite('rhpHivTrabalho')}.\n2. ${v.testagemVoluntaria !== false ? 'A Empresa pode promover campanhas de aconselhamento e testagem voluntária, realizadas por profissionais de saúde, com consentimento informado de cada trabalhador; o resultado é comunicado apenas ao próprio e não é transmitido à Empresa.' : 'O trabalhador que deseje fazer o teste é encaminhado para uma unidade sanitária; o resultado é comunicado apenas ao próprio.'}\n3. Os exames médicos de aptidão para o trabalho não incluem o teste de HIV, e o médico só comunica à Empresa a aptidão ou inaptidão para o trabalho.`,
        en: 'No HIV tests or status questions at hiring or during employment; voluntary counselling and testing only with consent, results to the employee alone; fitness exams exclude HIV testing.',
      },
      {
        id: 'confidencialidade',
        heading: 'Confidencialidade',
        text: `1. O trabalhador não é obrigado a revelar o seu estado serológico. A informação que voluntariamente partilhe é estritamente confidencial e só pode ser comunicada a outras pessoas com o seu consentimento escrito ${refCite('rhpPrivacidade')}.\n2. Os documentos médicos são guardados em separado do processo individual, com acesso restrito.\n3. A violação da confidencialidade é infracção disciplinar grave.`,
        en: 'No duty to disclose; shared information is strictly confidential and passed on only with written consent; medical documents kept apart; breach is a serious offence.',
      },
      {
        id: 'emprego',
        heading: 'Continuidade do emprego e adaptação',
        text: '1. O trabalhador que vive com HIV mantém o seu posto de trabalho enquanto estiver apto para as funções.\n2. Quando a doença afecte a capacidade de trabalho, a Empresa procura, com o trabalhador, adaptações razoáveis: ajustamento do horário, das tarefas ou do posto, e facilidades para consultas e tratamento.\n3. As ausências por doença seguem o regime geral das faltas justificadas, mediante atestado médico que não precisa de indicar o diagnóstico.',
        en: 'Employees stay in their jobs while fit; reasonable adjustments to hours, tasks or post and time for treatment; sick absences follow the general rules, with certificates that need not state the diagnosis.',
      },
      {
        id: 'prevencao',
        heading: 'Prevenção e informação',
        text: 'A Empresa desenvolve, em colaboração com o órgão sindical, um programa de prevenção que inclui:',
        items: alineas([
          'sessões de informação e educação sobre a transmissão, a prevenção e o tratamento do HIV e das infecções de transmissão sexual',
          v.preservativos !== false ? 'distribuição gratuita e discreta de preservativos nos locais de trabalho' : '',
          'divulgação dos serviços de aconselhamento, testagem e tratamento antirretroviral disponíveis',
          outras ? 'prevenção da tuberculose, da malária, da cólera e de outras doenças endémicas, com referência rápida dos casos suspeitos' : '',
          'promoção de estilos de vida saudáveis e de boas práticas de nutrição',
        ].filter(Boolean)),
        en: 'Prevention programme with the union: education, free condoms, information on testing and ART, endemic diseases, healthy lifestyles.',
      },
      {
        id: 'biosseguranca',
        heading: 'Primeiros socorros e exposição acidental',
        text: `1. Nos primeiros socorros aplicam-se as precauções universais: luvas e outros equipamentos de protecção estão disponíveis nas caixas de primeiros socorros.\n2. O trabalhador que sofra exposição acidental a sangue ou fluidos corporais no trabalho é encaminhado de imediato${us ? ` para ${us}` : ' para a unidade sanitária mais próxima'}, para avaliação e profilaxia pós-exposição, sendo o caso tratado como acidente de trabalho ${refCite('rhpAcidenteTrabalho')}.`,
        en: 'Universal precautions in first aid; accidental exposure referred at once for post-exposure prophylaxis and treated as a work accident.',
      },
      {
        id: 'apoio',
        heading: 'Apoio e encaminhamento',
        text: `O ${focal}${contacto ? ` (${contacto})` : ''} é o ponto focal da presente política: presta informação, encaminha os trabalhadores${us ? ` para ${us}` : ' para as unidades sanitárias'} e recebe, com confidencialidade, as queixas de discriminação, que são tratadas nos termos do procedimento disciplinar.`,
        en: 'The focal point informs, refers employees for care and receives discrimination complaints confidentially.',
      },
    ];
    return policyBlocks(ctx, {
      titulo: 'Política de HIV e SIDA no Local de Trabalho',
      artigos,
      vigor: vigorClause(ctx, { sujeito: 'A presente política', fem: true }),
      recepcao: 'um exemplar da Política de HIV e SIDA no Local de Trabalho',
      signatario: 'A Direcção',
    });
  },
});
