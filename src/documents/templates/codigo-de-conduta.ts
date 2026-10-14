// Código de conduta e ética: the company's values and rules of behaviour
// (conflicts of interest, gifts, corruption, confidentiality, social media,
// whistle-blowing). Codes of conduct are a source of labour law.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, formatMoney, l, money } from './_shared';
import { doCite } from './_contrato-trabalho';
import { alineas, APROVACAO_SECTION, aprovacaoFields, empresa, linhas, nosTermos, policyBlocks, refCite, str, vigorClause } from './_rh-politicas';

export default defineTemplate({
  id: 'codigo-de-conduta',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'valores', title: l('Valores', 'Values') },
    { id: 'regras', title: l('Regras', 'Rules') },
    { id: 'denuncia', title: l('Denúncias', 'Reporting') },
    APROVACAO_SECTION,
  ],
  fields: [
    {
      name: 'valores',
      type: 'textarea',
      section: 'valores',
      rows: 5,
      label: l('Valores da empresa (um por linha)', 'Company values (one per line)'),
      default: 'Integridade: agimos com honestidade e cumprimos a lei\nRespeito: tratamos todas as pessoas com dignidade\nResponsabilidade: assumimos os nossos actos e decisões\nSegurança: nenhum trabalho justifica pôr em risco a vida ou a saúde\nQualidade: cumprimos o que prometemos aos clientes',
    },
    { name: 'limiteOfertas', type: 'money', section: 'regras', width: 'half', label: l('Valor máximo de ofertas aceitáveis', 'Maximum value of acceptable gifts'), help: l('Ofertas acima deste valor são recusadas ou entregues à empresa.', 'Gifts above this value are refused or handed to the company.') },
    { name: 'portaVoz', type: 'text', section: 'regras', width: 'half', label: l('Quem fala em nome da empresa', 'Who speaks for the company'), default: 'a Direcção-Geral' },
    { name: 'modRedesSociais', type: 'toggle', section: 'regras', default: true, label: l('Regras sobre redes sociais', 'Social media rules') },
    { name: 'modEntidadesPublicas', type: 'toggle', section: 'regras', default: true, label: l('Relações com entidades públicas e concursos', 'Dealings with public bodies and tenders') },
    { name: 'canalDenuncia', type: 'text', section: 'denuncia', required: true, label: l('Canal de denúncia (email, telefone, caixa)', 'Reporting channel (email, phone, box)'), placeholder: l('Ex.: etica@empresa.co.mz ou caixa de sugestões na recepção', 'E.g. ethics@company.co.mz or the box at reception') },
    { name: 'responsavelEtica', type: 'text', section: 'denuncia', label: l('Responsável pelo código (cargo)', 'Person responsible for the code (position)'), default: 'Director de Recursos Humanos' },
    ...aprovacaoFields(),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.canalDenuncia)) w.push({ level: 'warning', field: 'canalDenuncia', message: l('Indique um canal para denúncias (email, telefone ou caixa).', 'Give a reporting channel (email, phone or box).') });
    w.push({
      level: 'info',
      message: l(
        `O código de conduta é fonte de Direito do Trabalho (${cite('rhpCodigosConduta')}). As sanções aplicáveis são só as da lei; se o código regular a disciplina do trabalho, consulte antes o órgão sindical (${cite('rhpPoderRegulamentar')}).`,
        'A code of conduct is a source of labour law. Only statutory sanctions apply; if it regulates discipline, consult the union body first.',
      ),
    });
    return w;
  },
  documentDate: (v) => v.dataAprovacao,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = empresa(ctx);
    const valores = linhas(v.valores);
    const limite = money(v.limiteOfertas);
    const porta = str(v.portaVoz) || 'a Direcção';
    const artigos: ClauseItem[] = [
      {
        id: 'objecto',
        heading: 'Objecto e âmbito',
        text: `1. O presente código define os valores e as regras de conduta ${nome === BLANK ? 'da Empresa' : `de **${nome}**`}, adiante designada por Empresa, e constitui fonte de Direito do Trabalho ${nosTermos('rhpCodigosConduta')}.\n2. Aplica-se aos membros dos órgãos sociais, aos dirigentes e a todos os trabalhadores e estagiários, e é dado a conhecer aos consultores, prestadores de serviços e fornecedores que actuem em nome da Empresa.`,
        en: 'Purpose and scope: values and rules of conduct for directors, managers, employees and interns; shared with contractors acting for the company.',
      },
      {
        id: 'valores',
        heading: 'Valores',
        text: 'A actuação de todos rege-se pelos seguintes valores:',
        items: alineas(valores.length ? valores : [BLANK]),
        en: 'The company’s values.',
      },
      {
        id: 'respeito',
        heading: 'Respeito, igualdade e não discriminação',
        text: `1. Todas as pessoas são tratadas com respeito e dignidade. É proibida qualquer discriminação em razão da cor, raça, sexo, origem étnica, lugar de nascimento, religião, posição social, opção política, deficiência ou estado de saúde, incluindo o estado serológico do HIV.\n2. São proibidos o assédio, incluindo o assédio sexual, a intimidação, a humilhação e a violência, por palavras, gestos ou actos ${refCite('rhpAssedio')}.\n3. A Empresa respeita a privacidade dos trabalhadores e a confidencialidade dos seus dados pessoais.`,
        en: 'Respect, equality and non-discrimination; no harassment or violence; privacy is respected.',
      },
      {
        id: 'conflitos',
        heading: 'Conflitos de interesse',
        text: '1. Há conflito de interesse quando um interesse pessoal, familiar ou financeiro do trabalhador possa influenciar, ou parecer influenciar, as decisões que toma ao serviço da Empresa.\n2. O trabalhador declara por escrito à sua chefia qualquer conflito de interesse, real ou aparente, e não intervém na decisão do assunto.\n3. O exercício de outra actividade profissional não pode concorrer com a Empresa nem prejudicar o cumprimento do horário e dos deveres de trabalho, devendo ser comunicado à Direcção.',
        en: 'Conflicts of interest: definition, written declaration and abstention; other jobs must not compete or interfere and are reported.',
      },
      {
        id: 'ofertas',
        heading: 'Ofertas e hospitalidade',
        text: `1. É proibido pedir ou aceitar, para si ou para terceiros, dinheiro, ofertas, favores ou vantagens de clientes, fornecedores ou outras pessoas que tenham ou procurem ter relações com a Empresa.\n2. Exceptuam-se as ofertas de cortesia e de valor simbólico${limite != null ? `, até ao valor de ${formatMoney(limite)}` : ''}, que não criem dever de retribuição e sejam registadas junto da chefia. As restantes são recusadas ou entregues à Empresa.`,
        en: 'Gifts and hospitality: no money, gifts or favours from business contacts, except token courtesy gifts within the limit, which are registered.',
      },
      {
        id: 'corrupcao',
        heading: 'Corrupção e suborno',
        text: '1. A Empresa não tolera qualquer forma de corrupção, suborno, tráfico de influências, fraude ou branqueamento de capitais.\n2. É proibido oferecer ou prometer qualquer vantagem a funcionários públicos, a clientes ou a terceiros para obter ou manter negócios, licenças ou decisões favoráveis.\n3. Os pagamentos da Empresa são feitos contra documento válido e registados com verdade na contabilidade.',
        en: 'No corruption, bribery, influence peddling, fraud or money laundering; no improper advantages; truthful accounting.',
      },
      {
        id: 'confidencialidade',
        heading: 'Confidencialidade e protecção de dados',
        text: `1. O trabalhador guarda sigilo sobre os métodos de produção, os negócios, os preços, os dados de clientes e as demais informações da Empresa ${refCite('deverSigilo')}, e mantém esse sigilo depois de cessado o contrato.\n2. Os dados pessoais de colegas, clientes e fornecedores só são usados para as finalidades do serviço e não são divulgados a terceiros sem autorização.`,
        en: 'Confidentiality of business information and personal data, also after the contract ends.',
      },
      {
        id: 'bens',
        heading: 'Bens e recursos da Empresa',
        text: 'Os bens, os fundos, os equipamentos, as viaturas e os sistemas informáticos da Empresa são usados com cuidado, apenas para o serviço e nunca para fins pessoais, político-partidários ou ilícitos, salvo autorização.',
        en: 'Company assets are used carefully and only for work.',
      },
    ];
    if (v.modRedesSociais !== false) {
      artigos.push({
        id: 'comunicacao',
        heading: 'Comunicação e redes sociais',
        text: `1. Só ${porta} fala em nome da Empresa perante a imprensa e as autoridades, ou quem para isso for autorizado.\n2. Nas redes sociais e grupos de mensagens, o trabalhador não divulga informação confidencial, imagens das instalações ou de clientes sem autorização, nem publica conteúdos ofensivos sobre colegas, clientes ou a Empresa.\n3. As opiniões pessoais são expressas a título pessoal, sem invocar a qualidade de trabalhador da Empresa.`,
        en: 'Only authorised people speak for the company; no confidential information, unauthorised images or offensive content online.',
      });
    }
    if (v.modEntidadesPublicas !== false) {
      artigos.push({
        id: 'publicas',
        heading: 'Relações com entidades públicas e concursos',
        text: '1. As relações com entidades públicas são conduzidas com transparência, por escrito sempre que possível, e por quem estiver autorizado.\n2. Nos concursos públicos e privados, a Empresa apresenta documentos verdadeiros e não combina preços nem propostas com concorrentes.',
        en: 'Transparent dealings with public bodies; truthful tender documents; no bid-rigging.',
      });
    }
    artigos.push(
      {
        id: 'seguranca',
        heading: 'Segurança, saúde e ambiente',
        text: 'Todos cumprem as regras de higiene, saúde e segurança no trabalho, usam os equipamentos de protecção fornecidos, não trabalham sob a influência de álcool ou drogas e protegem o ambiente nas actividades da Empresa.',
        en: 'Health, safety and environment rules apply to everyone.',
      },
      {
        id: 'denuncia',
        heading: 'Denúncia de irregularidades',
        text: `1. Quem tiver conhecimento de uma violação deste código ou da lei comunica-a à sua chefia, ao ${str(v.responsavelEtica) || 'responsável pelo código'} ou através de ${str(v.canalDenuncia) || BLANK}.\n2. As denúncias são tratadas com confidencialidade e analisadas com imparcialidade, ouvindo as pessoas envolvidas.\n3. Ninguém pode ser prejudicado por ter denunciado de boa-fé; a denúncia feita de má-fé é infracção disciplinar.`,
        en: 'Reporting: channels, confidentiality, impartial handling, no retaliation for good-faith reports.',
      },
      {
        id: 'violacao',
        heading: 'Violação do código',
        text: `A violação do presente código constitui infracção disciplinar, punível com as sanções previstas ${doCite('sancoesDisciplinares')}, após o procedimento disciplinar legal, sem prejuízo da responsabilidade civil e criminal.`,
        en: 'Breach is a disciplinary offence punished with statutory sanctions after due process, plus civil and criminal liability.',
      },
    );
    return policyBlocks(ctx, {
      titulo: 'Código de Conduta e Ética',
      artigos,
      vigor: vigorClause(ctx, { sujeito: 'O presente código', extra: ['O código é revisto sempre que a lei ou a actividade da Empresa o justifiquem.'] }),
      recepcao: 'um exemplar do Código de Conduta e Ética',
      signatario: 'A Direcção',
    });
  },
});
