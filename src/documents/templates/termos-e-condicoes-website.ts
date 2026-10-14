// Termos e condições de utilização de um website, aplicação ou loja online.
// The seller identifies itself, states how contracts are made online, prices,
// delivery, the consumer's right of withdrawal and the warranty, user
// accounts and content, and the applicable law (Lei das Transacções
// Electrónicas; Lei de Defesa do Consumidor).

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { arbitragemField, foroField, semPonto, str } from './_contratos';
import { contactos, entidadeTexto, politicaHeader, prazo } from './_digital';

const loja = (v: Values) => v.tipo === 'loja';
const contas = (v: Values) => v.tipo !== 'informativo';

export default defineTemplate({
  id: 'termos-e-condicoes-website',
  family: 'mapa',
  sections: [
    { id: 'site', title: l('Website ou aplicação', 'Website or app') },
    { id: 'vendas', title: l('Vendas online', 'Online sales') },
    { id: 'utilizadores', title: l('Contas e conteúdos dos utilizadores', 'Accounts and user content') },
    { id: 'outras', title: l('Outras cláusulas', 'Other terms') },
  ],
  fields: [
    { name: 'nomeSite', type: 'text', section: 'site', width: 'half', required: true, label: l('Nome do website ou aplicação', 'Website or app name'), default: (c) => c.profile?.nomeComercial || c.profile?.firma || c.profile?.nome || '' },
    { name: 'endereco', type: 'text', section: 'site', width: 'half', label: l('Endereço (URL)', 'Address (URL)'), default: (c) => c.profile?.website || '' },
    {
      name: 'tipo',
      type: 'radio',
      section: 'site',
      label: l('Tipo', 'Kind'),
      options: [
        { value: 'informativo', label: l('Website informativo (sem vendas nem contas)', 'Informational website') },
        { value: 'loja', label: l('Loja online (vende produtos ou serviços)', 'Online shop') },
        { value: 'plataforma', label: l('Aplicação ou plataforma com contas de utilizador', 'App or platform with user accounts') },
      ],
      default: 'loja',
    },
    { name: 'versaoData', type: 'date', section: 'site', width: 'half', label: l('Data desta versão', 'Version date'), default: (c) => c.today },
    { name: 'contacto', type: 'text', section: 'site', width: 'half', label: l('Contacto para clientes', 'Customer contact'), default: (c) => [c.profile?.email, c.profile?.telefones].filter(Boolean).join(' · ') },

    { name: 'pagamentos', type: 'text', section: 'vendas', label: l('Meios de pagamento', 'Payment methods'), default: 'M-Pesa, e-Mola, cartão bancário e transferência bancária', showIf: loja },
    { name: 'zonasEntrega', type: 'text', section: 'vendas', label: l('Zonas de entrega', 'Delivery areas'), default: 'Cidades de Maputo e Matola', showIf: loja },
    { name: 'prazoEntrega', type: 'number', section: 'vendas', width: 'half', min: 0, max: 90, default: 3, label: l('Prazo de entrega (dias úteis)', 'Delivery time (working days)'), showIf: loja },
    { name: 'custoEntrega', type: 'text', section: 'vendas', width: 'half', label: l('Custo de entrega', 'Delivery cost'), placeholder: l('Ex.: indicado no carrinho antes do pagamento', 'E.g. shown in the cart before payment'), showIf: loja },
    { name: 'levantamento', type: 'toggle', section: 'vendas', default: true, label: l('Permite levantar na loja', 'Store pickup available'), showIf: loja },
    { name: 'garantiaMeses', type: 'number', section: 'vendas', width: 'half', min: 0, max: 120, default: 12, label: l('Garantia dos bens (meses)', 'Warranty (months)'), showIf: loja },
    { name: 'excluidosDevolucao', type: 'text', section: 'vendas', label: l('Produtos sem devolução (opcional)', 'Non-returnable products (optional)'), placeholder: l('Ex.: produtos de higiene abertos, alimentos perecíveis, artigos personalizados', 'E.g. opened hygiene products, perishables, personalised items'), showIf: loja },

    { name: 'idadeMinima', type: 'toggle', section: 'utilizadores', default: true, label: l('Só maiores de idade podem criar conta ou comprar', 'Only adults may register or buy'), showIf: contas },
    { name: 'conteudosUtilizador', type: 'toggle', section: 'utilizadores', default: false, label: l('Os utilizadores podem publicar conteúdos (comentários, fotos, anúncios)', 'Users may post content'), showIf: contas },

    { name: 'politicaPrivacidade', type: 'toggle', section: 'outras', default: true, label: l('Remeter para a política de privacidade', 'Refer to the privacy policy') },
    foroField('outras'),
    arbitragemField('outras'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!ctx.profile?.nuit) w.push({ level: 'warning', message: l('O perfil não tem NUIT: quem vende online deve identificar-se com a firma, a sede, o NUIT e os contactos.', 'The profile has no NUIT: online sellers must state name, seat, NUIT and contacts.') });
    w.push({ level: 'info', message: l(`Publique estes termos num local visível do site, com a data da versão, e peça ao cliente que os aceite antes de concluir a encomenda (${cite('digComercioElectronico')}).`, 'Publish these terms prominently with the version date and have customers accept them before ordering.') });
    if (loja(v)) {
      const min = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
      if (Number(v.garantiaMeses) < min) w.push({ level: 'error', field: 'garantiaMeses', message: l(`A garantia mínima dos bens duradouros vendidos a consumidores é de ${min} meses.`, `The minimum consumer warranty for durable goods is ${min} months.`) });
    }
    return w;
  },

  personName: () => 'termos-e-condicoes',
  documentDate: (v) => v.versaoData,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const site = str(v.nomeSite) || BLANK;
    const url = str(v.endereco);
    const retract = ctx.legal.value<{ diasUteis: number }>('consumidorRetractacao');
    const maior = ctx.legal.value<{ anos: number }>('maioridade').anos;
    const minGar = ctx.legal.value<{ movelMeses: number }>('consumidorGarantia').movelMeses;
    const gar = Math.max(Number(v.garantiaMeses) || 0, minGar);
    const contacto = str(v.contacto) || contactos(p) || BLANK;

    const items: ClauseItem[] = [];
    items.push({
      id: 'tc-identificacao',
      heading: 'Quem somos',
      text: `O ${loja(v) ? 'website e a loja online' : v.tipo === 'plataforma' ? 'serviço' : 'website'} **${site}**${url ? ` (${url})` : ''} é explorado por ${entidadeTexto(p)} (adiante "nós"). Pode contactar-nos através de ${contacto}.`,
      en: `${v.nomeSite || '—'} is operated by the business identified, reachable at the contacts given.`,
    });
    items.push({
      id: 'tc-aceitacao',
      heading: 'Aceitação',
      text: `Ao utilizar ${site}${loja(v) ? ' ou ao fazer uma encomenda' : ''}, aceita estes termos e condições. Se não concordar, não utilize o serviço. Podemos alterar estes termos; a versão aplicável é a que estiver publicada no momento da utilização${loja(v) ? ' ou da encomenda' : ''}.`,
      en: 'Using the site (or ordering) means accepting these terms. We may change them; the version published at the time applies.',
    });
    if (contas(v)) {
      items.push({
        id: 'tc-contas',
        heading: 'Conta de utilizador',
        text: `${v.idadeMinima ? `Para criar uma conta${loja(v) ? ' ou comprar' : ''}, deve ter pelo menos ${maior} anos. ` : ''}Os dados que indicar devem ser verdadeiros e actualizados. É responsável pela confidencialidade da sua palavra-passe e por toda a actividade na sua conta; avise-nos de imediato se suspeitar de uso indevido. Podemos suspender ou encerrar contas usadas em violação destes termos ou da lei.`,
        en: `${v.idadeMinima ? `Accounts${loja(v) ? ' and purchases' : ''} require age ${maior}+. ` : ''}Data must be true; keep your password safe; tell us of misuse; accounts breaching the terms may be suspended or closed.`,
      });
    }
    if (loja(v)) {
      items.push({
        id: 'tc-encomendas',
        heading: 'Encomendas',
        text: `Os produtos e os preços são apresentados no site com as suas características essenciais. A encomenda faz-se seleccionando os produtos, confirmando o resumo (produtos, quantidades, preço total, custo e prazo de entrega) e aceitando estes termos. Enviamos uma confirmação por e-mail ou mensagem; o contrato considera-se celebrado com essa confirmação. Se um produto não estiver disponível, informamo-lo e devolvemos o valor pago.`,
        en: 'Products and prices are shown with key features. You order by choosing items, checking the summary and accepting these terms; we confirm by e-mail or message, which concludes the contract. Unavailable items are refunded.',
      });
      items.push({
        id: 'tc-precos',
        heading: 'Preços e pagamento',
        text: `Os preços são indicados em meticais e incluem o IVA à taxa legal em vigor, salvo indicação em contrário. Aceitamos ${semPonto(v.pagamentos) || BLANK}. A factura é emitida nos termos da lei fiscal e enviada com a encomenda ou por via electrónica.`,
        en: `Prices in meticais including VAT unless stated. Payment by ${v.pagamentos || '—'}. Invoices issued under tax law.`,
      });
      items.push({
        id: 'tc-entrega',
        heading: 'Entrega',
        text: `Entregamos em ${semPonto(v.zonasEntrega) || BLANK}, no prazo de ${prazo(v.prazoEntrega, 'dia útil')} após a confirmação do pagamento, salvo indicação diferente no produto.${str(v.custoEntrega) ? ` Custo de entrega: ${semPonto(v.custoEntrega)}.` : ''}${v.levantamento ? ' Pode também levantar a encomenda na nossa loja, mediante apresentação do número da encomenda.' : ''} Verifique a encomenda no acto da entrega e registe na guia qualquer dano visível.`,
        en: `Delivery to ${v.zonasEntrega || '—'} within the stated working days after payment${v.levantamento ? '; store pickup available' : ''}. Check the parcel on delivery and note visible damage.`,
      });
      const excl = semPonto(v.excluidosDevolucao);
      items.push({
        id: 'tc-desistencia',
        heading: 'Direito de desistência',
        text: `Sendo consumidor, pode desistir da compra no prazo de ${retract.diasUteis} dias úteis a contar da recepção do produto, sem indicar o motivo e sem pagar indemnização, comunicando-nos por escrito através dos contactos acima. O produto deve ser devolvido em bom estado, e reembolsamos de imediato as quantias pagas, pelo mesmo meio de pagamento.${excl ? ` Por razões de higiene, segurança ou natureza do produto, não aceitamos a devolução de: ${excl}, salvo defeito.` : ''}`,
        en: `Consumers may withdraw within ${retract.diasUteis} working days of receipt, without reason or penalty; return the product in good condition and we refund at once.${excl ? ' Some products cannot be returned unless defective.' : ''}`,
      });
      items.push({
        id: 'tc-garantia',
        heading: 'Garantia e defeitos',
        text: `Os bens duradouros têm garantia de bom funcionamento de ${gar} meses a contar da entrega. Em caso de defeito, pode pedir a reparação ou a substituição, a redução do preço ou a resolução do contrato, nos termos da lei de defesa do consumidor. A garantia não cobre danos causados por mau uso ou acidente.`,
        en: `Durable goods carry a ${gar}-month warranty; for defects you may ask for repair, replacement, price reduction or termination under consumer law. Misuse and accidents are excluded.`,
      });
    }
    items.push({
      id: 'tc-uso',
      heading: 'Utilização aceitável',
      text: 'Não pode utilizar o serviço para fins ilícitos, para tentar aceder sem autorização a sistemas ou dados, para enviar programas maliciosos ou publicidade não solicitada, nem para copiar ou extrair conteúdos de forma automatizada.',
      en: 'No unlawful use, unauthorised access, malware, spam or automated scraping.',
    });
    if (contas(v) && v.conteudosUtilizador) {
      items.push({
        id: 'tc-conteudos',
        heading: 'Conteúdos publicados pelos utilizadores',
        text: 'É responsável pelos conteúdos que publicar e garante que tem os direitos sobre eles e que não ofendem a lei nem direitos de terceiros. Concede-nos uma licença gratuita e não exclusiva para os mostrar no serviço enquanto os mantiver publicados. Podemos retirar conteúdos ilícitos ou contrários a estes termos, nomeadamente após denúncia fundamentada, que pode enviar para os contactos acima.',
        en: 'You are responsible for what you post and warrant your rights; you grant us a free, non-exclusive licence to display it while published. We may remove unlawful content, including after a reasoned report.',
      });
    }
    items.push({
      id: 'tc-propriedade',
      heading: 'Propriedade intelectual',
      text: `Os textos, as imagens, os logótipos, o desenho e o software de ${site} pertencem-nos ou aos nossos licenciadores e estão protegidos pela legislação sobre direitos de autor e propriedade industrial. Não podem ser copiados ou utilizados sem a nossa autorização escrita, salvo para uso pessoal e não comercial.`,
      en: 'Texts, images, logos, design and software belong to us or our licensors and may not be copied without written permission, except for personal non-commercial use.',
    });
    items.push({
      id: 'tc-responsabilidade',
      heading: 'Responsabilidade',
      text: 'Procuramos manter o serviço disponível e as informações correctas, mas podem ocorrer interrupções e erros, que corrigimos logo que deles tenhamos conhecimento. Não respondemos por conteúdos de sítios de terceiros para os quais existam ligações. Nada nestes termos limita os direitos que a lei confere aos consumidores.',
      en: 'We aim for availability and accuracy but outages and errors may occur and are corrected when known. We are not responsible for third-party linked sites. Nothing limits consumers’ statutory rights.',
    });
    if (v.politicaPrivacidade) {
      items.push({
        id: 'tc-privacidade',
        heading: 'Dados pessoais',
        text: 'Tratamos os seus dados pessoais de acordo com a nossa Política de Privacidade, publicada no site, que explica que dados recolhemos, para que fins e quais são os seus direitos.',
        en: 'We process your personal data under our Privacy Policy.',
      });
    }
    items.push({
      id: 'tc-reclamacoes',
      heading: 'Reclamações',
      text: `Pode apresentar reclamações através dos contactos acima${loja(v) ? '; temos também livro de reclamações à disposição dos clientes' : ''}. Respondemos no mais curto prazo possível.`,
      en: 'Complaints may be sent to the contacts above; a complaints book is available.',
    });
    const foro = semPonto(v.foro) || 'tribunal judicial competente';
    items.push({
      id: 'tc-lei',
      heading: 'Lei aplicável e litígios',
      text: `Estes termos regem-se pela lei moçambicana, designadamente pela Lei das Transacções Electrónicas e pela Lei de Defesa do Consumidor. Os litígios que não sejam resolvidos por acordo são decididos ${v.arbitragem ? 'por arbitragem, nos termos da legislação moçambicana sobre arbitragem, conciliação e mediação, com sede em Maputo' : `pelo ${foro}`}, sem prejuízo das regras de competência aplicáveis aos consumidores.`,
      en: 'Mozambican law applies (Electronic Transactions Law; Consumer Protection Law). Disputes go to the court or arbitration stated, without prejudice to consumer jurisdiction rules.',
    });

    const blocks: Block[] = [...politicaHeader(ctx, `Termos e condições de utilização${loja(v) ? ' e de venda' : ''}`, v.versaoData, site), { type: 'paragraph', id: 'intro', text: `Leia com atenção estes termos antes de utilizar ${site}${loja(v) ? ' ou de fazer uma encomenda' : ''}. Se tiver dúvidas, contacte-nos antes de prosseguir.`, en: 'Please read these terms before using the site or ordering.' }, { type: 'numberedClauses', style: 'numeric', items }];
    return blocks;
  },
});
