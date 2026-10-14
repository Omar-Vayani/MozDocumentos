// Contrato de publicidade com influenciador digital: deliverables per
// platform, prior approval, labelling as advertising, usage rights for the
// brand, exclusivity and a conduct clause.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, lines, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clAutonomia, clCessacao, clConfidencialidade, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo } from './_digital';

type Ent = { plataforma: string; formato: string; quantidade: string; data: string };
const entregaveis = (v: Values): Ent[] =>
  lines(v.entregaveis)
    .map((r) => ({ plataforma: str(r.plataforma), formato: str(r.formato), quantidade: str(r.quantidade), data: str(r.data) }))
    .filter((r) => r.plataforma || r.formato);

export default defineTemplate({
  id: 'contrato-influenciador',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'marca', title: l('Marca (anunciante ou agência)', 'Brand (advertiser or agency)'), personRole: 'outro' },
    { id: 'influenciador', title: l('Influenciador', 'Influencer'), personRole: 'outro' },
    { id: 'campanha', title: l('Campanha e conteúdos', 'Campaign and content') },
    { id: 'preco', title: l('Remuneração e direitos', 'Fee and rights') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('marca', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('influenciador'),
    { name: 'perfis', type: 'text', section: 'influenciador', label: l('Perfis nas redes sociais', 'Social media handles'), placeholder: l('Ex.: @nome no Instagram e no TikTok', 'E.g. @name on Instagram and TikTok') },

    { name: 'campanha', type: 'text', section: 'campanha', required: true, label: l('Campanha / produto', 'Campaign / product'), placeholder: l('Ex.: lançamento do novo pacote de dados', 'E.g. launch of the new data bundle') },
    { name: 'dataInicio', type: 'date', section: 'campanha', width: 'half', label: l('Início da campanha', 'Campaign start') },
    { name: 'dataFim', type: 'date', section: 'campanha', width: 'half', label: l('Fim da campanha', 'Campaign end') },
    {
      name: 'entregaveis',
      type: 'lines',
      section: 'campanha',
      label: l('Conteúdos a publicar', 'Content to publish'),
      addLabel: l('Adicionar conteúdo', 'Add content'),
      columns: [
        { name: 'plataforma', type: 'text', label: l('Plataforma', 'Platform') },
        { name: 'formato', type: 'text', label: l('Formato', 'Format') },
        { name: 'quantidade', type: 'text', label: l('Quantidade', 'Quantity') },
        { name: 'data', type: 'date', label: l('Data limite', 'Due date') },
      ],
      default: [
        { plataforma: 'Instagram', formato: 'Reel', quantidade: '2', data: '' },
        { plataforma: 'Instagram', formato: 'Stories (sequência de 3)', quantidade: '4', data: '' },
        { plataforma: 'TikTok', formato: 'Vídeo', quantidade: '2', data: '' },
      ],
    },
    { name: 'mensagens', type: 'textarea', section: 'campanha', rows: 3, label: l('Mensagens-chave e orientações (opcional)', 'Key messages and guidelines (optional)') },
    { name: 'aprovacaoDias', type: 'number', section: 'campanha', width: 'half', min: 1, max: 10, default: 2, label: l('Prazo da marca para aprovar (dias úteis)', 'Brand approval time (working days)') },
    { name: 'manterDias', type: 'number', section: 'campanha', width: 'half', min: 0, max: 365, default: 90, label: l('Manter as publicações online (dias)', 'Keep posts online (days)') },

    { name: 'cache', type: 'money', section: 'preco', width: 'half', required: true, label: l('Cachê (valor total)', 'Fee (total)') },
    ivaField('preco'),
    { name: 'adiantamentoPct', type: 'number', section: 'preco', width: 'half', min: 0, max: 100, default: 50, label: l('Pago na assinatura (%)', 'Paid on signing (%)') },
    ...formaPagamentoFields('preco'),
    { name: 'produtos', type: 'text', section: 'preco', label: l('Produtos ou serviços oferecidos (opcional)', 'Products or services given (optional)') },
    { name: 'usoMarcaMeses', type: 'number', section: 'preco', width: 'half', min: 0, max: 60, default: 6, label: l('A marca pode usar os conteúdos durante (meses)', 'Brand may use the content for (months)') },
    { name: 'usoAnuncios', type: 'toggle', section: 'preco', default: true, label: l('Inclui uso em anúncios pagos da marca', 'Includes use in the brand’s paid ads') },
    { name: 'exclusividade', type: 'toggle', section: 'preco', default: true, label: l('Exclusividade: não promover concorrentes', 'Exclusivity: no competitors') },
    { name: 'exclusividadeDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 365, default: 30, label: l('Exclusividade após a campanha (dias)', 'Exclusivity after the campaign (days)'), showIf: (v) => Boolean(v.exclusividade) },
    { name: 'concorrentes', type: 'text', section: 'preco', label: l('Sector ou marcas concorrentes', 'Competing sector or brands'), showIf: (v) => Boolean(v.exclusividade) },

    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'marca', 'marca', 'brand'), ...partyWarnings(v, 'influenciador', 'influenciador', 'influencer')];
    if (money(v.cache) == null) w.push({ level: 'error', field: 'cache', message: l('Indique o cachê.', 'Enter the fee.') });
    if (!entregaveis(v).length) w.push({ level: 'warning', field: 'entregaveis', message: l('Indique os conteúdos a publicar.', 'List the content to publish.') });
    w.push({ level: 'info', message: l(`Cada publicação deve ser identificada como publicidade, por exemplo com "#publicidade" ou a etiqueta de parceria paga da plataforma (${cite('digPublicidadeIdentificavel')}). O influenciador passa recibo ou factura; a marca pode ter de reter IRPS — confirme com o contabilista.`, 'Each post must be labelled as advertising. The influencer issues a receipt or invoice; the brand may need to withhold income tax — check with your accountant.') });
    return w;
  },

  personName: (v) => partyName(v, 'influenciador') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const M = papel(v, 'marca', 'Anunciante', 'Anunciante', true);
    const I = papel(v, 'influenciador', 'Influenciador', 'Influenciadora');
    const ents = entregaveis(v);
    const cache = money(v.cache);
    const pct = Number(v.adiantamentoPct);
    const ad = cache != null && Number.isFinite(pct) && pct > 0 && pct < 100 ? Math.round(cache * pct) / 100 : null;

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${I.o}${str(v.perfis) ? `, titular dos perfis ${semPonto(v.perfis)},` : ''} obriga-se a criar e publicar nas suas redes sociais os conteúdos indicados no Anexo I, no âmbito da campanha "${semPonto(v.campanha) || BLANK}" ${M.de}, que decorre de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}.`,
        linhasMsg(v.mensagens) ? `Os conteúdos transmitem as seguintes mensagens e orientações: ${linhasMsg(v.mensagens)}.` : '',
        `${I.O} mantém o seu estilo próprio e não é obrigado a afirmar opiniões que não tenha; não faz afirmações falsas ou enganosas sobre o produto.`,
      ]),
      en: 'The influencer creates and publishes the content listed, for the campaign and period stated, in their own style, without false or misleading claims.',
    });
    cl.push({
      id: 'aprovacao',
      heading: 'Aprovação e publicação',
      text: numerar([
        `Cada conteúdo é enviado ${M.ao} antes da publicação, que o aprova ou pede alterações fundamentadas no prazo de ${prazo(v.aprovacaoDias, 'dia útil')}; sem resposta, considera-se aprovado.`,
        `Todas as publicações são identificadas de forma clara como publicidade, com a menção "#publicidade" ou a etiqueta de parceria paga da plataforma, e identificam a marca.`,
        `As publicações mantêm-se visíveis nos perfis ${I.de} durante, pelo menos, ${prazo(v.manterDias)} após a publicação.`,
        `${I.O} envia ${M.ao}, no fim da campanha, as capturas de ecrã das estatísticas de cada publicação (alcance, visualizações e interacções).`,
      ]),
      en: 'Content is approved before posting (silence = approval). Every post is clearly labelled as advertising and tags the brand, stays online for the stated days, and statistics are sent at the end.',
    });
    cl.push({
      id: 'preco',
      heading: 'Remuneração',
      text: numerar([
        `Como contrapartida, ${M.o} paga ${I.ao} o valor total de ${valorTexto(cache)}${ivaTexto(v.iva)}${ad != null ? `, sendo ${valorTexto(ad)} pago na assinatura do contrato e o restante após a publicação de todos os conteúdos` : ', após a publicação de todos os conteúdos'}, ${modoPagamento(v, I)}, contra recibo ou factura.`,
        str(v.produtos) ? `${M.O} oferece ainda ${I.ao}: ${semPonto(v.produtos)}.` : '',
        'O cachê inclui a criação, a produção e a publicação dos conteúdos e os direitos de utilização previstos na cláusula seguinte.',
      ]),
      en: `Total fee ${cache != null ? formatMoney(cache) : '—'}${ad != null ? ', part on signing and the rest after all posts' : ', after all posts'}, against a receipt or invoice.`,
    });
    const mm = Number(v.usoMarcaMeses);
    cl.push({
      id: 'direitos',
      heading: 'Direitos de utilização e imagem',
      text: numerar([
        `${I.O} autoriza ${M.o} a partilhar os conteúdos nas redes e no sítio na Internet ${M.de}${v.usoAnuncios ? ' e a utilizá-los em anúncios pagos' : ''}, com a identificação ${I.de}, durante ${Number.isFinite(mm) && mm > 0 ? prazo(mm, 'mês') : 'o período da campanha'}.`,
        `Esta autorização abrange a imagem, o nome e a voz ${I.de} constantes dos conteúdos, apenas para os fins e pelo período indicados. Qualquer outra utilização depende de novo acordo escrito e remunerado.`,
        `${I.O} garante que tem os direitos sobre as músicas, as imagens e as pessoas que surgem nos conteúdos, ou que obteve as autorizações necessárias.`,
      ]),
      en: 'The brand may reuse the content on its channels (and in paid ads if stated), crediting the influencer, for the stated period. This covers image, name and voice only for that use; anything else needs a new paid agreement. The influencer warrants rights in music and third parties shown.',
    });
    if (v.exclusividade) {
      cl.push({
        id: 'exclusividade',
        heading: 'Exclusividade',
        text: `Durante a campanha e nos ${prazo(v.exclusividadeDias)} seguintes, ${I.o} não promove produtos ou serviços concorrentes${str(v.concorrentes) ? `, entendendo-se como tal ${semPonto(v.concorrentes)}` : ''}.`,
        en: 'No promotion of competitors during the campaign and for the stated days after.',
      });
    }
    cl.push({
      id: 'conduta',
      heading: 'Conduta e reputação',
      text: numerar([
        `${I.O} compromete-se a não publicar, durante a campanha, conteúdos que ofendam a lei, os bons costumes ou terceiros, ou que possam prejudicar a imagem ${M.de}.`,
        `Se ${I.o} se envolver em facto público grave que prejudique a reputação da campanha, ${M.o} pode resolver o contrato e pedir a retirada dos conteúdos, pagando apenas os conteúdos já publicados.`,
      ]),
      en: 'The influencer avoids unlawful or offensive content during the campaign; in case of a serious public scandal the brand may terminate, paying only for content already published.',
    });
    cl.push(clConfidencialidade(M, I));
    cl.push(clAutonomia(I));
    cl.push(clCessacao({ curaDias: 5 }));
    cl.push(clForcaMaior());

    const quadro: Block[] = ents.length
      ? [
          {
            type: 'table',
            columns: [
              { label: 'Plataforma', width: 1.4 },
              { label: 'Formato', width: 2.4 },
              { label: 'Quantidade', width: 1, align: 'right' },
              { label: 'Data limite', width: 1.2 },
            ],
            rows: ents.map((e) => [e.plataforma || BLANK, e.formato || BLANK, e.quantidade || BLANK, e.data ? formatDateShort(e.data) : 'Durante a campanha']),
          },
        ]
      : [{ type: 'box', label: 'Plataforma, formato, quantidade e data', lines: 4 }];

    return contratoBlocks(ctx, {
      title: 'Contrato de publicidade com influenciador digital',
      subtitle: str(v.campanha) || undefined,
      parties: [
        { p: 'marca', role: M, en: 'Advertiser' },
        { p: 'influenciador', role: I, en: 'Influencer' },
      ],
      annex: [{ type: 'spacer', size: 'medium' }, { type: 'heading', text: 'Anexo I — Conteúdos a publicar', align: 'center' }, ...quadro],
      clauses: cl,
      signatures: [assinatura(ctx, 'marca', M, true), assinatura(ctx, 'influenciador', I)],
    });
  },
});

function linhasMsg(x: unknown): string {
  return String(x ?? '')
    .split(/\n+/)
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim().replace(/[.;]+$/, ''))
    .map((s) => s.charAt(0).toLowerCase() + s.slice(1))
    .filter(Boolean)
    .join('; ');
}
