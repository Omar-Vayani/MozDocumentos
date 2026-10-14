// Política de prevenção e combate ao assédio no local de trabalho: the
// statutory definitions, examples, the complaint and investigation procedure,
// protection against retaliation and the consequences (disciplinary offence;
// compensation of a multiple of the sector minimum wage when the harasser is
// the employer, a superior or an agent).

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { doCite, qty } from './_contrato-trabalho';
import { alineas, APROVACAO_SECTION, aprovacaoFields, empresa, nosTermos, policyBlocks, refCite, str, vigorClause } from './_rh-politicas';

export default defineTemplate({
  id: 'politica-assedio',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'queixas', title: l('Queixas', 'Complaints') },
    APROVACAO_SECTION,
  ],
  fields: [
    { name: 'responsavelQueixas', type: 'text', section: 'queixas', width: 'half', required: true, label: l('Quem recebe as queixas (cargo)', 'Who receives complaints (position)'), default: 'Director de Recursos Humanos' },
    { name: 'responsavelAlternativo', type: 'text', section: 'queixas', width: 'half', label: l('Alternativa (se a queixa for contra essa pessoa)', 'Alternative (if the complaint concerns that person)'), default: 'Director-Geral' },
    { name: 'contactoQueixas', type: 'text', section: 'queixas', label: l('Contacto confidencial (email ou telefone)', 'Confidential contact (email or phone)'), placeholder: l('Ex.: confidencial@empresa.co.mz', 'E.g. confidential@company.co.mz') },
    { name: 'prazoAnalise', type: 'number', section: 'queixas', width: 'half', min: 1, max: 90, default: 15, label: l('Prazo interno para concluir a análise (dias)', 'Internal deadline to finish the inquiry (days)'), help: l('Prazo fixado pela empresa. Se houver processo disciplinar, aplicam-se os prazos legais desse processo.', 'Set by the company. If there is a disciplinary process, its legal deadlines apply.') },
    ...aprovacaoFields(),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.contactoQueixas)) w.push({ level: 'info', field: 'contactoQueixas', message: l('Indique um contacto confidencial: facilita a apresentação de queixas.', 'Give a confidential contact: it makes complaints easier.') });
    w.push({
      level: 'info',
      message: l(
        `Lembre-se: a infracção disciplinar prescreve e a nota de culpa tem prazo legal (${cite('prescricaoInfraccao')}; ${cite('notaCulpaPrazoEmissao')}). Abra o processo disciplinar sem demora quando a queixa tiver fundamento.`,
        'Remember the limitation periods for disciplinary action: start the process promptly when a complaint is founded.',
      ),
    });
    return w;
  },
  documentDate: (v) => v.dataAprovacao,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = empresa(ctx);
    const indemn = ctx.legal.value<{ indemnizacaoSalariosMinimos: number }>('rhpAssedio').indemnizacaoSalariosMinimos;
    const prazo = Number(v.prazoAnalise);
    const resp = str(v.responsavelQueixas) || 'Director de Recursos Humanos';
    const alt = str(v.responsavelAlternativo);
    const contacto = str(v.contactoQueixas);
    const artigos: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto e compromisso',
        text: `${nome === BLANK ? 'A Empresa' : `**${nome}**, adiante designada por Empresa,`} não tolera qualquer forma de assédio, discriminação ou violência no trabalho. A presente política define as condutas proibidas, a forma de apresentar queixa e o modo como a Empresa a trata, ${nosTermos('rhpAssedio')}.`,
        en: 'Zero tolerance of harassment, discrimination and violence; this policy defines prohibited conduct, how to complain and how complaints are handled.',
      },
      {
        id: 'ambito',
        heading: 'Âmbito',
        text: 'A política aplica-se a todos os trabalhadores, dirigentes, estagiários e candidatos a emprego, nas instalações da Empresa, em deslocações e eventos de serviço, nas comunicações por telefone, mensagens ou redes sociais e fora do local de trabalho sempre que a conduta interfira na estabilidade no emprego ou na progressão profissional da pessoa visada. Aplica-se também à conduta de clientes, fornecedores e visitantes para com os trabalhadores.',
        en: 'Covers employees, managers, interns and applicants, at work, on business trips and events, in calls, messages and social media, and outside work when it affects the job; also conduct by clients, suppliers and visitors.',
      },
      {
        id: 'definicoes',
        heading: 'Definições',
        text: '1. **Assédio** é o conjunto de comportamentos e práticas inaceitáveis, ou a ameaça desses comportamentos e práticas, pontuais ou recorrentes, que tenham por objecto, causem ou sejam susceptíveis de causar um dano físico, psicológico, sexual ou económico, incluindo a violência e o assédio com base no género.\n2. Constitui também discriminação e assédio todo o acto praticado no acesso ao emprego, no emprego ou na formação profissional com o objectivo ou o efeito de perturbar ou constranger a pessoa, afectar a sua dignidade ou criar-lhe um ambiente intimidativo, hostil, degradante, humilhante ou desestabilizador.\n3. **Assédio sexual** é o comportamento indesejado de carácter sexual, sob forma verbal, não verbal ou física, com o objectivo ou o efeito referido nos números anteriores.',
        en: 'Definitions of harassment, discriminatory harassment and sexual harassment, as in the Labour Law.',
      },
      {
        id: 'exemplos',
        heading: 'Condutas proibidas',
        text: 'Constituem, nomeadamente, condutas proibidas:',
        items: alineas([
          'comentários, piadas, gestos ou mensagens de conteúdo sexual, ou a exibição de imagens desse conteúdo',
          'contacto físico não desejado, insistência em encontros ou convites recusados',
          'pedidos de favores sexuais, em especial em troca de emprego, promoção, salário ou outro benefício',
          'insultos, gritos, humilhações, ameaças e ridicularização em público ou em privado',
          'isolamento deliberado, retirada injustificada de funções ou atribuição de tarefas humilhantes ou impossíveis',
          'difusão de boatos ou de informação sobre a vida privada ou o estado de saúde de alguém',
          'tratamento desigual em razão do sexo, da origem, da religião, da deficiência, do estado serológico ou de outro factor de discriminação',
        ]),
        en: 'Examples: sexual comments or images, unwanted contact, sexual favours for benefits, insults and threats, isolation and humiliating tasks, gossip about private life or health, unequal treatment.',
      },
      {
        id: 'chefias',
        heading: 'Deveres das chefias',
        text: 'As chefias dão o exemplo, intervêm logo que tenham conhecimento de uma conduta proibida, encaminham as queixas recebidas e nunca desencorajam a sua apresentação.',
        en: 'Managers lead by example, act at once, forward complaints and never discourage them.',
      },
      {
        id: 'queixa',
        heading: 'Apresentação da queixa',
        text: `1. Quem se considere vítima, ou tenha presenciado uma conduta proibida, pode apresentar queixa, verbalmente ou por escrito, ao ${resp}${alt ? ` ou, se a queixa for contra este, ao ${alt}` : ''}${contacto ? `, ou através de ${contacto}` : ''}.\n2. A queixa indica, se possível, os factos, as datas, os locais, as pessoas envolvidas e as testemunhas. A queixa verbal é reduzida a escrito e assinada por quem a apresenta.\n3. A apresentação de queixa interna não impede o recurso à Inspecção-Geral do Trabalho, aos tribunais ou à polícia.`,
        en: 'How to complain: verbally or in writing to the named person (or the alternative), stating facts, dates and witnesses; external remedies remain available.',
      },
      {
        id: 'tratamento',
        heading: 'Tratamento da queixa',
        text: `1. A queixa é analisada com confidencialidade e imparcialidade: são ouvidos quem a apresentou, a pessoa visada e as testemunhas, e reunidos os documentos e mensagens relevantes.\n2. A análise é concluída ${Number.isFinite(prazo) && prazo > 0 ? `no prazo de ${qty(prazo, 'dia', 'dias')}` : 'com a maior brevidade'}, sendo os interessados informados do seu resultado.\n3. Durante a análise, a Empresa pode tomar medidas de protecção, como a alteração temporária de turnos ou de chefia, sem prejuízo para quem apresentou a queixa.\n4. Havendo indícios de infracção, é instaurado procedimento disciplinar ${nosTermos('procedimentoDisciplinar')}, no qual a pessoa visada exerce o seu direito de defesa.`,
        en: 'Handling: confidential, impartial hearing of both sides and witnesses; deadline; protective measures without prejudice to the complainant; disciplinary process when founded.',
      },
      {
        id: 'retaliacao',
        heading: 'Protecção contra represálias',
        text: 'É proibido prejudicar, por qualquer forma, quem apresente queixa ou preste depoimento de boa-fé. A represália é infracção disciplinar grave. A queixa sabidamente falsa é igualmente infracção disciplinar.',
        en: 'No retaliation against good-faith complainants or witnesses; knowingly false complaints are also offences.',
      },
      {
        id: 'consequencias',
        heading: 'Consequências',
        text: `1. O assédio, praticado no local de trabalho ou fora dele, constitui infracção disciplinar, punível com as sanções previstas ${doCite('sancoesDisciplinares')}, incluindo o despedimento.\n2. Quando praticado pelo empregador, por superior hierárquico ou por mandatário, constitui contra-ordenação muito grave e confere ao trabalhador ofendido o direito a uma indemnização de ${indemn} vezes o salário mínimo do sector de actividade, sem prejuízo da indemnização por danos patrimoniais e não patrimoniais e de procedimento judicial ${refCite('rhpAssedio')}.`,
        en: 'Harassment is a disciplinary offence; by the employer, a superior or an agent it is a very serious offence giving the victim statutory compensation plus damages.',
      },
      {
        id: 'apoio',
        heading: 'Apoio, formação e divulgação',
        text: 'A Empresa orienta a vítima para apoio médico, psicológico ou jurídico quando necessário, dá formação periódica às chefias e aos trabalhadores e afixa a presente política nos locais de trabalho.',
        en: 'Support for victims, regular training and posting of the policy.',
      },
    ];
    return policyBlocks(ctx, {
      titulo: 'Política de Prevenção e Combate ao Assédio no Local de Trabalho',
      artigos,
      vigor: vigorClause(ctx, { sujeito: 'A presente política', fem: true }),
      recepcao: 'um exemplar da Política de Prevenção e Combate ao Assédio no Local de Trabalho',
      signatario: 'A Direcção',
    });
  },
});
