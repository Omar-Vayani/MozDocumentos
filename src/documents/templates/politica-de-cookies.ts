// Política de cookies: what cookies a website uses, by category, with an
// optional table, and how users accept or refuse them. Mozambique has no
// cookie-specific rule; identifying cookies follow the general data rules.

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { lines, semPonto, str } from './_contratos';
import { contactos, politicaHeader } from './_digital';

type Linha = { nome: string; fornecedor: string; finalidade: string; duracao: string };
const tabela = (v: Values): Linha[] =>
  lines(v.lista)
    .map((r) => ({ nome: str(r.nome), fornecedor: str(r.fornecedor), finalidade: str(r.finalidade), duracao: str(r.duracao) }))
    .filter((r) => r.nome || r.finalidade);

export default defineTemplate({
  id: 'politica-de-cookies',
  family: 'mapa',
  sections: [
    { id: 'site', title: l('Website', 'Website') },
    { id: 'categorias', title: l('Cookies utilizados', 'Cookies used') },
  ],
  fields: [
    { name: 'nomeSite', type: 'text', section: 'site', width: 'half', required: true, label: l('Nome do website', 'Website name'), default: (c) => c.profile?.nomeComercial || c.profile?.firma || c.profile?.nome || '' },
    { name: 'endereco', type: 'text', section: 'site', width: 'half', label: l('Endereço (URL)', 'Address (URL)'), default: (c) => c.profile?.website || '' },
    { name: 'versaoData', type: 'date', section: 'site', width: 'half', label: l('Data desta versão', 'Version date'), default: (c) => c.today },
    { name: 'banner', type: 'toggle', section: 'site', default: true, label: l('O site tem um aviso (banner) para aceitar ou recusar cookies', 'The site has a consent banner') },

    { name: 'cPreferencias', type: 'toggle', section: 'categorias', default: true, label: l('Cookies de preferências (língua, região)', 'Preference cookies') },
    { name: 'cAnaliticos', type: 'toggle', section: 'categorias', default: true, label: l('Cookies analíticos (estatísticas de visitas)', 'Analytics cookies') },
    { name: 'ferramentasAnalise', type: 'text', section: 'categorias', label: l('Ferramentas de análise', 'Analytics tools'), default: 'Google Analytics', showIf: (v) => Boolean(v.cAnaliticos) },
    { name: 'cPublicidade', type: 'toggle', section: 'categorias', default: false, label: l('Cookies de publicidade e redes sociais', 'Advertising and social media cookies') },
    { name: 'ferramentasPublicidade', type: 'text', section: 'categorias', label: l('Ferramentas de publicidade', 'Advertising tools'), placeholder: l('Ex.: Meta Pixel, Google Ads', 'E.g. Meta Pixel, Google Ads'), showIf: (v) => Boolean(v.cPublicidade) },
    {
      name: 'lista',
      type: 'lines',
      section: 'categorias',
      label: l('Lista de cookies (opcional)', 'Cookie list (optional)'),
      addLabel: l('Adicionar cookie', 'Add cookie'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'fornecedor', type: 'text', label: l('Fornecedor', 'Provider') },
        { name: 'finalidade', type: 'text', label: l('Finalidade', 'Purpose') },
        { name: 'duracao', type: 'text', label: l('Duração', 'Duration') },
      ],
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    w.push({ level: 'info', message: l(`Não há regras próprias sobre cookies em Moçambique; os cookies que identificam o utilizador seguem as regras gerais de dados pessoais. Boa prática: pedir consentimento antes de activar cookies analíticos e de publicidade (${cite('digCookiesConsentimento')}).`, 'Mozambique has no cookie-specific rules; identifying cookies follow general data rules. Good practice: ask consent before analytics and advertising cookies.') });
    if ((v.cAnaliticos || v.cPublicidade) && !v.banner) w.push({ level: 'warning', field: 'banner', message: l('Com cookies analíticos ou de publicidade, mostre um aviso que permita aceitar ou recusar.', 'With analytics or advertising cookies, show a banner to accept or refuse.') });
    return w;
  },

  personName: () => 'politica-de-cookies',
  documentDate: (v) => v.versaoData,

  blocks: (ctx) => {
    const v = ctx.values;
    const site = str(v.nomeSite) || BLANK;
    const linhas = tabela(v);
    const items: ClauseItem[] = [];
    items.push({
      id: 'ck-oque',
      heading: 'O que são cookies',
      text: `Cookies são pequenos ficheiros de texto que o site ${site}${str(v.endereco) ? ` (${str(v.endereco)})` : ''} guarda no seu dispositivo quando o visita. Servem para o site funcionar, para recordar as suas preferências e, se o autorizar, para medir visitas e mostrar publicidade relevante.`,
      en: 'Cookies are small text files the site stores on your device to work, remember preferences and, with consent, measure visits and show relevant ads.',
    });
    const cats: string[] = ['**Essenciais** — necessários para o site funcionar (sessão, segurança, carrinho de compras e registo das suas escolhas sobre cookies). Não podem ser desactivados.'];
    if (v.cPreferencias) cats.push('**Preferências** — recordam escolhas como a língua ou a região.');
    if (v.cAnaliticos) cats.push(`**Analíticos** — permitem contar as visitas e perceber como o site é usado${str(v.ferramentasAnalise) ? ` (${semPonto(v.ferramentasAnalise)})` : ''}. Só são activados com o seu consentimento.`);
    if (v.cPublicidade) cats.push(`**Publicidade e redes sociais** — permitem mostrar anúncios de acordo com os seus interesses e medir campanhas${str(v.ferramentasPublicidade) ? ` (${semPonto(v.ferramentasPublicidade)})` : ''}. Só são activados com o seu consentimento.`);
    items.push({ id: 'ck-tipos', heading: 'Que cookies usamos', text: 'Utilizamos as seguintes categorias de cookies:', items: cats, en: 'Categories used: essential, and others as listed (non-essential only with consent).' });
    items.push({
      id: 'ck-terceiros',
      heading: 'Cookies de terceiros',
      text: 'Alguns cookies são colocados por fornecedores externos, que tratam os dados de acordo com as suas próprias políticas de privacidade. Não controlamos esses cookies, mas só os activamos depois de os aceitar.',
      en: 'Some cookies are set by third parties under their own privacy policies; we enable them only after you accept.',
    });
    items.push({
      id: 'ck-gerir',
      heading: 'Como aceitar ou recusar',
      text: `${v.banner ? 'Na primeira visita, mostramos um aviso onde pode aceitar todos os cookies, recusar os não essenciais ou escolher por categoria. Pode mudar a sua escolha a qualquer momento através da ligação "Definições de cookies" no rodapé do site. ' : ''}Pode também bloquear ou apagar cookies nas definições do seu navegador; se bloquear os cookies essenciais, algumas partes do site podem deixar de funcionar.`,
      en: `${v.banner ? 'A banner lets you accept, refuse non-essential cookies or choose by category, and you can change your choice via the footer link. ' : ''}You can also block or delete cookies in your browser; blocking essential cookies may break the site.`,
    });
    items.push({
      id: 'ck-mais',
      heading: 'Mais informação',
      text: `Para saber como tratamos os seus dados pessoais, consulte a nossa Política de Privacidade.${contactos(ctx.profile) ? ` Contactos: ${contactos(ctx.profile)}.` : ''}`,
      en: 'See our Privacy Policy for more on personal data.',
    });
    const blocks: Block[] = [...politicaHeader(ctx, 'Política de cookies', v.versaoData, site !== BLANK ? site : undefined), { type: 'paragraph', id: 'intro', text: `Esta política explica como o site ${site} utiliza cookies e tecnologias semelhantes, e como pode escolher quais aceita.`, en: 'This policy explains how the site uses cookies and how you can choose which to accept.' }, { type: 'numberedClauses', style: 'numeric', items }];
    if (linhas.length) {
      blocks.push({
        type: 'table',
        caption: 'Lista de cookies',
        columns: [
          { label: 'Cookie', width: 1.4 },
          { label: 'Fornecedor', width: 1.3 },
          { label: 'Finalidade', width: 2.8 },
          { label: 'Duração', width: 1.1 },
        ],
        rows: linhas.map((r) => [r.nome || BLANK, r.fornecedor || 'Próprio', r.finalidade || BLANK, r.duracao || BLANK]),
      });
    }
    return blocks;
  },
});
