// Política de privacidade (website, aplicação ou negócio). Mozambique has no
// general data-protection law in force (a bill was before Parliament in 2026);
// the policy follows the data rules of the Electronic Transactions Law and the
// constitutional protection of privacy, and should be reviewed when the new
// law is published.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { semPonto, str } from './_contratos';
import { contactos, entidadeTexto, linhas, politicaHeader } from './_digital';

const DADOS: { name: string; pt: string; en: string; texto: string; def: boolean }[] = [
  { name: 'dIdent', pt: 'Identificação (nome, data de nascimento, documento, NUIT)', en: 'Identification', texto: 'dados de identificação, como o nome, a data de nascimento, o número do documento de identificação e o NUIT', def: true },
  { name: 'dContacto', pt: 'Contactos (telefone, e-mail, morada)', en: 'Contact details', texto: 'contactos, como o telefone, o correio electrónico e a morada', def: true },
  { name: 'dPagamento', pt: 'Pagamentos e facturação', en: 'Payments and billing', texto: 'dados de pagamento e de facturação (não guardamos os dados completos de cartões bancários)', def: true },
  { name: 'dNavegacao', pt: 'Navegação (endereço IP, dispositivo, cookies)', en: 'Browsing data', texto: 'dados de navegação, como o endereço IP, o tipo de dispositivo e de navegador e as páginas visitadas', def: true },
  { name: 'dLocalizacao', pt: 'Localização', en: 'Location', texto: 'dados de localização, quando autorizar o seu uso no dispositivo', def: false },
  { name: 'dImagem', pt: 'Imagens de videovigilância', en: 'CCTV images', texto: 'imagens captadas pelo sistema de videovigilância das nossas instalações', def: false },
  { name: 'dSaude', pt: 'Dados de saúde', en: 'Health data', texto: 'dados de saúde, apenas na medida necessária ao serviço prestado e com o seu consentimento expresso', def: false },
  { name: 'dCandidatos', pt: 'Candidaturas a emprego (CV)', en: 'Job applications', texto: 'dados constantes de candidaturas a emprego', def: false },
];

const FINS: { name: string; pt: string; en: string; texto: string; def: boolean }[] = [
  { name: 'fContrato', pt: 'Prestar o serviço ou entregar a encomenda', en: 'Provide the service or deliver the order', texto: 'prestar os serviços e entregar os produtos que nos pedir, e gerir a relação de cliente', def: true },
  { name: 'fLegal', pt: 'Cumprir obrigações legais (fiscais, contabilísticas)', en: 'Legal obligations', texto: 'cumprir obrigações legais, nomeadamente fiscais, contabilísticas e de prevenção do branqueamento de capitais', def: true },
  { name: 'fApoio', pt: 'Responder a pedidos e reclamações', en: 'Answer requests and complaints', texto: 'responder aos seus pedidos, questões e reclamações', def: true },
  { name: 'fMarketing', pt: 'Enviar novidades e promoções (com consentimento)', en: 'Marketing (with consent)', texto: 'enviar-lhe novidades e promoções, apenas se nos tiver dado o seu consentimento, que pode retirar a qualquer momento', def: true },
  { name: 'fMelhoria', pt: 'Estatísticas e melhoria do serviço', en: 'Statistics and improvement', texto: 'elaborar estatísticas e melhorar o funcionamento do site e dos serviços', def: true },
  { name: 'fSeguranca', pt: 'Segurança das pessoas e instalações', en: 'Safety and security', texto: 'garantir a segurança das pessoas, das instalações e dos sistemas', def: false },
  { name: 'fRecrutamento', pt: 'Recrutamento', en: 'Recruitment', texto: 'avaliar candidaturas a emprego', def: false },
];

export default defineTemplate({
  id: 'politica-de-privacidade',
  family: 'mapa',
  sections: [
    { id: 'responsavel', title: l('Responsável pelos dados', 'Data controller') },
    { id: 'dados', title: l('Dados recolhidos e finalidades', 'Data collected and purposes') },
    { id: 'partilha', title: l('Partilha, conservação e segurança', 'Sharing, retention and security') },
  ],
  fields: [
    { name: 'nomeServico', type: 'text', section: 'responsavel', width: 'half', label: l('Nome do site, app ou negócio', 'Site, app or business name'), default: (c) => c.profile?.nomeComercial || c.profile?.firma || c.profile?.nome || '' },
    { name: 'endereco', type: 'text', section: 'responsavel', width: 'half', label: l('Endereço do site (opcional)', 'Website address (optional)'), default: (c) => c.profile?.website || '' },
    { name: 'versaoData', type: 'date', section: 'responsavel', width: 'half', label: l('Data desta versão', 'Version date'), default: (c) => c.today },
    { name: 'encarregado', type: 'text', section: 'responsavel', width: 'half', label: l('Responsável pela protecção de dados', 'Data protection officer'), help: l('Pessoa designada para cumprir as regras de protecção de dados e responder aos pedidos dos titulares.', 'Person appointed to ensure data-protection compliance and answer requests.') },
    { name: 'emailPrivacidade', type: 'email', section: 'responsavel', width: 'half', label: l('E-mail para pedidos sobre dados', 'E-mail for data requests'), default: (c) => c.profile?.email || '' },
    { name: 'respostaDias', type: 'number', section: 'responsavel', width: 'half', min: 1, max: 60, default: 30, label: l('Prazo de resposta aos pedidos (dias)', 'Response time to requests (days)') },

    ...DADOS.map((d) => ({ name: d.name, type: 'toggle' as const, section: 'dados', default: d.def, label: l(d.pt, d.en) })),
    ...FINS.map((d) => ({ name: d.name, type: 'toggle' as const, section: 'dados', default: d.def, label: l(d.pt, d.en) })),
    { name: 'menores', type: 'toggle', section: 'dados', default: false, label: l('O serviço destina-se também a menores', 'The service is also for minors') },

    { name: 'destinatarios', type: 'textarea', section: 'partilha', rows: 3, label: l('Com quem partilha os dados', 'Who data are shared with'), default: 'prestadores de serviços de pagamento (bancos e carteiras móveis)\nempresas de entregas e transporte\nprestadores de alojamento informático e de envio de mensagens\nautoridades públicas, quando a lei o exija' },
    { name: 'transferencia', type: 'toggle', section: 'partilha', default: true, label: l('Os dados são guardados ou tratados fora de Moçambique', 'Data are stored or processed outside Mozambique') },
    { name: 'paises', type: 'text', section: 'partilha', label: l('Onde', 'Where'), placeholder: l('Ex.: África do Sul e União Europeia (serviços de nuvem)', 'E.g. South Africa and EU (cloud services)'), showIf: (v) => Boolean(v.transferencia) },
    { name: 'conservacao', type: 'textarea', section: 'partilha', rows: 3, label: l('Por quanto tempo guarda os dados', 'Retention'), default: 'dados de clientes: durante a relação comercial e, depois, pelo prazo exigido pela lei fiscal e comercial\ndados para marketing: até retirar o consentimento\nimagens de videovigilância: pelo prazo estritamente necessário, sendo depois apagadas\ncandidaturas não seleccionadas: até um ano' },
    { name: 'cookies', type: 'toggle', section: 'partilha', default: true, label: l('O site usa cookies (remeter para a política de cookies)', 'The site uses cookies (refer to cookie policy)') },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    w.push({ level: 'info', message: l(`Moçambique ainda não tem uma lei geral de protecção de dados em vigor; esta política segue as regras da Lei das Transacções Electrónicas e a protecção constitucional da vida privada (${cite('digDadosPessoaisOnline')}). Reveja-a quando a nova lei for publicada.`, 'Mozambique has no general data-protection law in force yet; this policy follows the Electronic Transactions Law and the constitutional right to privacy. Review it when the new law is published.') });
    if (!str(v.encarregado)) w.push({ level: 'warning', field: 'encarregado', message: l('Designe um responsável pelo cumprimento das regras de protecção de dados.', 'Appoint a person responsible for data-protection compliance.') });
    if (v.dSaude) w.push({ level: 'warning', field: 'dSaude', message: l('Dados de saúde são sensíveis: peça consentimento expresso e escrito e limite o acesso aos profissionais obrigados a sigilo.', 'Health data are sensitive: get express written consent and restrict access to professionals bound by secrecy.') });
    return w;
  },

  personName: () => 'politica-de-privacidade',
  documentDate: (v) => v.versaoData,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const nome = str(v.nomeServico) || BLANK;
    const email = str(v.emailPrivacidade) || BLANK;
    const dados = DADOS.filter((d) => v[d.name]).map((d) => d.texto);
    const fins = FINS.filter((d) => v[d.name]).map((d) => d.texto);
    const dest = linhas(v.destinatarios).map(semPonto);
    const cons = linhas(v.conservacao).map(semPonto);
    const lista = (xs: string[]) => xs.map((s, i) => `${s}${i === xs.length - 1 ? '.' : ';'}`);
    const resp = Number(v.respostaDias);

    const items: ClauseItem[] = [];
    items.push({
      id: 'pp-responsavel',
      heading: 'Quem é responsável pelos seus dados',
      text: `O responsável pelo tratamento dos dados pessoais recolhidos através de ${nome}${str(v.endereco) ? ` (${str(v.endereco)})` : ''} é ${entidadeTexto(p)}. ${str(v.encarregado) ? `A pessoa responsável pela protecção de dados é ${str(v.encarregado)}, que pode contactar` : 'Pode contactar-nos'} através de ${email}${contactos(p) ? ` ou ${contactos(p)}` : ''}.`,
      en: 'The data controller and data-protection contact are identified.',
    });
    items.push({
      id: 'pp-dados',
      heading: 'Que dados recolhemos',
      text: 'Recolhemos os dados que nos fornece directamente e os que resultam da utilização dos nossos serviços, designadamente:',
      items: dados.length ? lista(dados) : [`${BLANK}.`],
      en: 'Data we collect: as listed.',
    });
    items.push({
      id: 'pp-fins',
      heading: 'Para que usamos os dados',
      text: 'Tratamos os seus dados apenas para fins determinados e legítimos, nomeadamente para:',
      items: fins.length ? lista(fins) : [`${BLANK}.`],
      en: 'Purposes: as listed.',
    });
    items.push({
      id: 'pp-fundamento',
      heading: 'Com que fundamento',
      text: 'Tratamos os dados porque são necessários para celebrar e executar o contrato consigo, para cumprir obrigações legais, para proteger os nossos interesses legítimos (como a segurança e a prevenção de fraudes) ou porque nos deu o seu consentimento, que pode retirar a qualquer momento, sem efeito sobre o tratamento já realizado.',
      en: 'Grounds: contract, legal obligation, legitimate interests or consent (which can be withdrawn).',
    });
    items.push({
      id: 'pp-partilha',
      heading: 'Com quem partilhamos',
      text: 'Não vendemos os seus dados. Só os partilhamos, na medida do necessário, com:',
      items: dest.length ? lista(dest) : [`${BLANK}.`],
      en: 'We do not sell data; we share them only as needed with the recipients listed, who are bound to confidentiality.',
    });
    if (v.transferencia) {
      items.push({
        id: 'pp-transferencia',
        heading: 'Dados fora de Moçambique',
        text: `Alguns dos nossos fornecedores guardam ou tratam dados fora de Moçambique${str(v.paises) ? `, designadamente em ${semPonto(v.paises)}` : ''}. Nesses casos, escolhemos fornecedores que garantem um nível de protecção adequado e que se obrigam contratualmente a respeitar esta política.`,
        en: 'Some providers store or process data abroad; we choose providers with adequate protection, bound by contract.',
      });
    }
    items.push({
      id: 'pp-conservacao',
      heading: 'Por quanto tempo guardamos',
      text: 'Guardamos os dados apenas durante o tempo necessário para os fins indicados, designadamente:',
      items: cons.length ? lista(cons) : [`${BLANK}.`],
      en: 'Retention periods as listed.',
    });
    items.push({
      id: 'pp-seguranca',
      heading: 'Segurança',
      text: 'Adoptamos medidas técnicas e organizativas adequadas para proteger os dados contra acesso, alteração, perda ou divulgação não autorizados, como o controlo de acessos, a cifragem das comunicações e cópias de segurança. Só os trabalhadores e prestadores que precisem dos dados lhes têm acesso, e estão obrigados a sigilo. Se ocorrer um incidente que ponha em risco os seus dados, informamo-lo.',
      en: 'Appropriate security measures; need-to-know access under confidentiality; incidents are notified.',
    });
    items.push({
      id: 'pp-direitos',
      heading: 'Os seus direitos',
      text: `Pode, a qualquer momento, pedir acesso aos seus dados, a sua rectificação ou actualização, a sua eliminação quando já não forem necessários, opor-se ao seu uso para marketing e retirar o consentimento dado. Envie o pedido para ${email}; respondemos no prazo de ${Number.isFinite(resp) && resp > 0 ? `${resp} dias` : 'um prazo razoável'}. Se não ficar satisfeito, pode recorrer às autoridades competentes e aos tribunais.`,
      en: 'You may request access, correction or deletion, object to marketing and withdraw consent; we reply within the stated days; you may complain to the authorities and courts.',
    });
    if (v.menores) {
      items.push({
        id: 'pp-menores',
        heading: 'Menores',
        text: 'Os dados de menores são tratados com o consentimento de quem exerce o poder parental, e apenas na medida necessária ao serviço. Não usamos dados de menores para marketing.',
        en: 'Minors’ data are processed with parental consent and never for marketing.',
      });
    } else {
      items.push({
        id: 'pp-menores',
        heading: 'Menores',
        text: 'Os nossos serviços não se destinam a menores. Se tomarmos conhecimento de que recolhemos dados de um menor sem o consentimento de quem exerce o poder parental, apagamo-los.',
        en: 'Our services are not for minors; such data collected without parental consent are deleted.',
      });
    }
    if (v.cookies) {
      items.push({
        id: 'pp-cookies',
        heading: 'Cookies',
        text: 'O nosso site utiliza cookies e tecnologias semelhantes. Saiba mais, e escolha quais aceita, na nossa Política de Cookies.',
        en: 'We use cookies; see our Cookie Policy.',
      });
    }
    items.push({
      id: 'pp-alteracoes',
      heading: 'Alterações',
      text: 'Podemos actualizar esta política, designadamente para a adaptar a nova legislação. A versão em vigor é a publicada, com a data indicada no topo; as alterações relevantes são comunicadas aos clientes.',
      en: 'We may update this policy, e.g. for new legislation; the published, dated version applies and material changes are notified.',
    });

    return [...politicaHeader(ctx, 'Política de privacidade', v.versaoData, nome !== BLANK ? nome : undefined), { type: 'paragraph', id: 'intro', text: `Respeitamos a sua privacidade. Esta política explica, de forma simples, como ${nome !== BLANK ? nome : 'o nosso serviço'} recolhe, utiliza e protege os seus dados pessoais e quais são os seus direitos.`, en: 'We respect your privacy. This policy explains how we collect, use and protect personal data and your rights.' }, { type: 'numberedClauses', style: 'numeric', items }];
  },
});
