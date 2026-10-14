// Contrato de patrocínio: a company supports an event, team, athlete or
// project with money or goods in exchange for visibility. Lists the
// counterparts, brand use, reporting, reputation clause and refund if the
// event does not take place.

import { defineTemplate, type ClauseItem, type Warning } from '../model';
import { BLANK, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clCessacao, clForcaMaior, contratoBlocks, formaPagamentoFields, linhas, modoPagamento, prazo } from './_digital';

const CONTRA: { name: string; pt: string; en: string; texto: string }[] = [
  { name: 'cLogo', pt: 'Logótipo nos materiais de divulgação', en: 'Logo on promotional materials', texto: 'inclusão do logótipo do Patrocinador nos cartazes, convites, bilhetes e demais materiais de divulgação' },
  { name: 'cLocal', pt: 'Faixas e estruturas no local', en: 'Banners on site', texto: 'colocação de faixas e estruturas do Patrocinador em lugares de destaque no local' },
  { name: 'cRedes', pt: 'Menção nas redes sociais e comunicados', en: 'Mentions on social media and press releases', texto: 'menção do Patrocinador nas redes sociais, nos comunicados de imprensa e nas entrevistas' },
  { name: 'cEquipamento', pt: 'Marca nos equipamentos ou fardamento', en: 'Brand on kit or uniforms', texto: 'aplicação da marca do Patrocinador nos equipamentos e no fardamento' },
  { name: 'cStand', pt: 'Espaço para stand ou activação', en: 'Stand or activation space', texto: 'cedência de espaço para stand, amostragem ou activação da marca' },
  { name: 'cDesignacao', pt: 'Nome do patrocinador no título (naming)', en: 'Naming rights', texto: 'associação do nome do Patrocinador à designação do evento ou da iniciativa' },
];

export default defineTemplate({
  id: 'contrato-de-patrocinio',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'patrocinador', title: l('Patrocinador', 'Sponsor'), personRole: 'outro' },
    { id: 'patrocinado', title: l('Patrocinado', 'Sponsored party'), personRole: 'outro' },
    { id: 'objecto', title: l('O que é patrocinado', 'What is sponsored') },
    { id: 'contrapartidas', title: l('Apoio e contrapartidas', 'Support and counterparts') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('patrocinador', { tipoDefault: 'empresa' }),
    ...partyFields('patrocinado', { fromProfile: true, tipoDefault: 'empresa', osfl: true }),

    {
      name: 'tipo',
      type: 'select',
      section: 'objecto',
      width: 'half',
      label: l('Tipo', 'Kind'),
      options: [
        { value: 'evento', label: l('Evento', 'Event') },
        { value: 'equipa', label: l('Clube ou equipa desportiva', 'Club or team') },
        { value: 'atleta', label: l('Atleta ou artista', 'Athlete or artist') },
        { value: 'projecto', label: l('Projecto social, cultural ou educativo', 'Social, cultural or educational project') },
      ],
      default: 'evento',
    },
    { name: 'designacao', type: 'text', section: 'objecto', width: 'half', required: true, label: l('Designação', 'Name'), placeholder: l('Ex.: Maratona da Cidade de Maputo 2027', 'E.g. Maputo City Marathon 2027') },
    { name: 'descricao', type: 'textarea', section: 'objecto', rows: 3, label: l('Descrição (local, datas, público)', 'Description (venue, dates, audience)') },
    { name: 'dataInicio', type: 'date', section: 'objecto', width: 'half', label: l('Início do patrocínio', 'Sponsorship start') },
    { name: 'dataFim', type: 'date', section: 'objecto', width: 'half', label: l('Fim do patrocínio', 'Sponsorship end') },

    { name: 'valor', type: 'money', section: 'contrapartidas', width: 'half', label: l('Apoio em dinheiro', 'Cash support') },
    { name: 'prestacoes', type: 'textarea', section: 'contrapartidas', rows: 2, label: l('Calendário de pagamento (opcional)', 'Payment schedule (optional)'), placeholder: l('Ex.: metade na assinatura e o restante duas semanas antes do evento', 'E.g. half on signing, the rest two weeks before') },
    { name: 'especie', type: 'textarea', section: 'contrapartidas', rows: 2, label: l('Apoio em bens ou serviços (opcional)', 'In-kind support (optional)'), placeholder: l('Ex.: 2 000 garrafas de água; transporte da equipa', 'E.g. bottled water; team transport') },
    { name: 'valorEspecie', type: 'money', section: 'contrapartidas', width: 'half', label: l('Valor estimado do apoio em espécie', 'Estimated in-kind value') },
    ...formaPagamentoFields('contrapartidas'),
    { name: 'categoria', type: 'radio', section: 'contrapartidas', label: l('Categoria', 'Tier'), options: [{ value: 'principal', label: l('Patrocinador principal', 'Main sponsor') }, { value: 'oficial', label: l('Patrocinador oficial', 'Official sponsor') }, { value: 'apoio', label: l('Apoio', 'Supporter') }], default: 'oficial' },
    ...CONTRA.map((c, i) => ({ name: c.name, type: 'toggle' as const, section: 'contrapartidas', default: i < 3, label: l(c.pt, c.en) })),
    { name: 'convites', type: 'number', section: 'contrapartidas', width: 'half', min: 0, max: 1000, default: 10, label: l('Convites ou bilhetes para o patrocinador', 'Tickets for the sponsor') },
    { name: 'outrasContra', type: 'textarea', section: 'contrapartidas', rows: 2, label: l('Outras contrapartidas (opcional)', 'Other counterparts (optional)') },
    { name: 'exclusividade', type: 'toggle', section: 'contrapartidas', default: true, label: l('Exclusividade no sector do patrocinador', 'Exclusivity in the sponsor’s sector') },
    { name: 'sector', type: 'text', section: 'contrapartidas', label: l('Sector protegido', 'Protected sector'), placeholder: l('Ex.: telecomunicações; bebidas não alcoólicas', 'E.g. telecoms; soft drinks'), showIf: (v) => Boolean(v.exclusividade) },

    { name: 'relatorioDias', type: 'number', section: 'clausulas', width: 'half', min: 1, max: 90, default: 30, label: l('Relatório final até (dias após o fim)', 'Final report within (days after end)') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'patrocinador', 'patrocinador', 'sponsor'), ...partyWarnings(v, 'patrocinado', 'patrocinado', 'sponsored party')];
    if (money(v.valor) == null && !str(v.especie)) w.push({ level: 'error', field: 'valor', message: l('Indique o apoio em dinheiro ou em espécie.', 'Enter the cash or in-kind support.') });
    w.push({ level: 'info', message: l('O patrocinado emite recibo ou factura pelo apoio recebido. O tratamento fiscal do patrocínio (custo dedutível, IVA sobre as contrapartidas, mecenato) deve ser confirmado com o contabilista.', 'The sponsored party issues a receipt or invoice. The tax treatment (deductibility, VAT on counterparts, patronage) should be checked with an accountant.') });
    if (v.tipo === 'atleta') w.push({ level: 'info', message: l('Se o atleta for menor, o contrato é assinado também por quem exerce o poder parental.', 'If the athlete is a minor, the parent or guardian also signs.') });
    return w;
  },

  personName: (v) => partyName(v, 'patrocinado') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const S = papel(v, 'patrocinador', 'Patrocinador', 'Patrocinadora');
    const D = papel(v, 'patrocinado', 'Patrocinado', 'Patrocinada');
    const nome = semPonto(v.designacao) || BLANK;
    const valor = money(v.valor);
    const contra = CONTRA.filter((c) => v[c.name]).map((c) => c.texto.replace('do Patrocinador', S.de));
    if (Number(v.convites) > 0) contra.push(`entrega de ${Number(v.convites)} convites ou bilhetes ${S.ao}`);
    contra.push(...linhas(v.outrasContra).map(semPonto));
    const cat = v.categoria === 'principal' ? 'patrocinador principal' : v.categoria === 'apoio' ? 'entidade de apoio' : 'patrocinador oficial';
    const ofTipo = v.tipo === 'equipa' ? 'da equipa' : v.tipo === 'atleta' ? `da actividade ${D.de}` : v.tipo === 'projecto' ? 'do projecto' : 'do evento';

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        `Pelo presente contrato, ${S.o} patrocina ${v.tipo === 'atleta' ? `a actividade ${D.de}` : `${v.tipo === 'equipa' ? 'a equipa' : v.tipo === 'projecto' ? 'o projecto' : 'o evento'} **${nome}**`}${str(v.descricao) ? ` (${semPonto(v.descricao)})` : ''}, na qualidade de ${cat}, durante o período de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}.`,
        `Em contrapartida, ${D.o} proporciona ${S.ao} a visibilidade e os benefícios indicados na cláusula terceira.`,
      ]),
      en: `The sponsor supports ${v.designacao || '—'} as ${v.categoria} sponsor for the period stated, in exchange for the counterparts in clause three.`,
    });
    const especie = linhas(v.especie).map(semPonto);
    cl.push({
      id: 'apoio',
      heading: 'Apoio',
      text: numerar([
        valor != null ? `${S.O} entrega ${D.ao} a quantia de ${valorTexto(valor)}, ${linhas(v.prestacoes).length ? `nos seguintes termos: ${linhas(v.prestacoes).map(semPonto).join('; ')}` : 'na data da assinatura do contrato'}, ${modoPagamento(v, D)}.` : '',
        especie.length ? `${S.O} fornece ainda, em espécie: ${especie.join('; ')}${money(v.valorEspecie) != null ? `, com o valor estimado de ${valorTexto(money(v.valorEspecie))}` : ''}.` : '',
        `${D.O} emite o recibo ou a factura correspondente a cada entrega e aplica o apoio exclusivamente na realização ${ofTipo}.`,
      ]),
      en: `Support: ${valor != null ? formatMoney(valor) : 'no cash'}${especie.length ? ' plus in-kind goods or services' : ''}; receipts issued and support used only for the sponsored activity.`,
    });
    cl.push({
      id: 'contrapartidas',
      heading: 'Contrapartidas',
      text: `${D.O} obriga-se a assegurar ${S.ao} as seguintes contrapartidas:`,
      items: contra.length ? contra.map((s, i) => `${s}${i === contra.length - 1 ? '.' : ';'}`) : [`${BLANK}.`],
      en: 'Counterparts as listed.',
    });
    cl.push({
      id: 'marcas',
      heading: 'Uso das marcas',
      text: numerar([
        `Cada parte autoriza a outra a utilizar a sua denominação e o seu logótipo apenas para os fins do presente contrato e durante a sua vigência, de acordo com as normas gráficas fornecidas.`,
        `Os materiais com a marca ${S.de} são submetidos à sua aprovação antes de produzidos; a falta de resposta no prazo de cinco dias úteis vale como aprovação.`,
        `${S.O} pode divulgar o patrocínio na sua comunicação institucional e publicitária, incluindo imagens ${ofTipo}, respeitando os direitos de imagem dos participantes.`,
      ]),
      en: 'Each party may use the other’s name and logo only for this contract and during its term; materials with the sponsor’s brand are approved in advance; the sponsor may publicise the sponsorship.',
    });
    if (v.exclusividade) {
      cl.push({
        id: 'exclusividade',
        heading: 'Exclusividade',
        text: `Durante a vigência do contrato, ${D.o} não aceita patrocínios de concorrentes ${S.de}${str(v.sector) ? ` no sector de ${semPonto(v.sector)}` : ' no mesmo sector de actividade'}, nem lhes dá visibilidade.`,
        en: 'No competing sponsors in the sponsor’s sector during the term.',
      });
    }
    cl.push({
      id: 'relatorio',
      heading: 'Relatório e prestação de contas',
      text: `No prazo de ${prazo(v.relatorioDias)} após o fim do patrocínio, ${D.o} entrega ${S.ao} um relatório com a descrição das actividades realizadas, as fotografias e os comprovativos das contrapartidas e, quando disponíveis, os números de público e de audiência.`,
      en: 'A final report with photos, proof of counterparts and audience figures within the stated days.',
    });
    cl.push({
      id: 'reputacao',
      heading: 'Reputação',
      text: `Qualquer das partes pode resolver o contrato se a outra, os seus dirigentes ou ${v.tipo === 'atleta' ? D.o : 'os seus representantes'} praticarem actos ilícitos ou condutas públicas graves que prejudiquem seriamente a sua imagem, sem direito a indemnização para a parte que lhes deu causa.`,
      en: 'Either party may terminate if the other commits unlawful acts or serious public misconduct damaging its image.',
    });
    cl.push({
      id: 'naoRealizacao',
      heading: 'Não realização ou incumprimento',
      text: numerar([
        `Se ${v.tipo === 'atleta' || v.tipo === 'equipa' ? 'a actividade patrocinada' : 'o evento'} não se realizar, ${D.o} restitui ${S.ao} o apoio recebido, deduzido das despesas já feitas e comprovadas e do valor das contrapartidas já prestadas.`,
        `Se alguma contrapartida não for prestada, ${S.o} pode exigir uma contrapartida equivalente acordada entre as partes ou a redução proporcional do apoio.`,
      ]),
      en: 'If the activity does not take place, the support is refunded less proven expenses and counterparts already delivered. Missing counterparts are replaced or the support reduced proportionally.',
    });
    cl.push(clCessacao({ curaDias: 10 }));
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: 'Contrato de patrocínio',
      subtitle: nome !== BLANK ? nome : undefined,
      parties: [
        { p: 'patrocinador', role: S, en: 'Sponsor' },
        { p: 'patrocinado', role: D, en: 'Sponsored party' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'patrocinador', S), assinatura(ctx, 'patrocinado', D, true)],
    });
  },
});
