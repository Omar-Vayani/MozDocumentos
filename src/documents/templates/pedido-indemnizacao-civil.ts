// Pedido de indemnização civil em processo penal (enxerto cível): the injured
// party claims damages inside the criminal case, against the accused and, where
// relevant, a party with civil liability only (employer, vehicle owner,
// insurer). Articulado with a summary table of the damages.

import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { cite, dateField, formatMoney, l, lineItems, localField, money, placeDate } from './_shared';
import { FECHO_OPTIONS, artigos, documentosList, juntaText, linePara, moneyExt, papel, partyDesc, partyFields, testemunhasList } from './_advocacia';
import { faseValue, nosAutos, optionalLawyerFields, partySignature, penalAddressee, penalCaseFields, str, viaMandatario, keepTail } from './_processo-penal';

type Dano = { descricao?: string; tipo?: string; valor?: string };

function danos(v: Values): { descricao: string; tipo: string; valor: number | null }[] {
  return (lineItems(v.danos) as Dano[])
    .map((d) => ({ descricao: str(d.descricao), tipo: d.tipo === 'nao_patrimonial' ? 'nao_patrimonial' : 'patrimonial', valor: money(d.valor) }))
    .filter((d) => d.descricao || d.valor != null);
}

export default defineTemplate({
  id: 'pedido-indemnizacao-civil',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'processo', title: l('Processo', 'Case') },
    { id: 'demandante', title: l('Lesado (quem pede)', 'Injured party (claimant)'), personRole: 'cliente' },
    { id: 'demandado', title: l('Arguido (demandado)', 'Accused (defendant)'), personRole: 'outro' },
    { id: 'civil', title: l('Responsável civil (opcional)', 'Party with civil liability (optional)') },
    { id: 'factos', title: l('Factos e danos', 'Facts and damage') },
    { id: 'prova', title: l('Prova', 'Evidence') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...penalCaseFields('processo', { fases: ['julgamento', 'instrucao', 'mp'] }),
    ...partyFields('demandante', 'demandante'),
    {
      name: 'demandanteQualidade',
      type: 'radio',
      section: 'demandante',
      label: l('Posição no processo', 'Role in the case'),
      default: 'assistente',
      options: [
        { value: 'assistente', label: l('Assistente', 'Assistant prosecutor') },
        { value: 'lesado', label: l('Lesado (não é assistente)', 'Injured party (not an assistant)') },
      ],
      help: l('O lesado pode pedir a indemnização mesmo sem se ter constituído assistente.', 'The injured party may claim even without joining as assistant.'),
    },
    ...partyFields('demandado', 'demandado', { light: true }),
    { name: 'civilTem', type: 'toggle', section: 'civil', label: l('Pedir também contra um responsável meramente civil', 'Also claim against a party with civil liability only'), help: l('Ex.: o empregador do arguido, o dono do veículo ou a seguradora.', 'E.g. the employer, the vehicle owner or the insurer.') },
    ...partyFields('civil', 'civil', { light: true, defaultTipo: 'empresa' }).map((f) => ({ ...f, required: false, showIf: (v: Values) => Boolean(v.civilTem) && (f.showIf ? f.showIf(v) : true) })),
    { name: 'civilFundamento', type: 'text', section: 'civil', label: l('Porque responde', 'Why it is liable'), placeholder: l('Ex.: é a proprietária do veículo conduzido pelo arguido, por conta e no interesse da qual este actuava', 'E.g. owner of the vehicle driven by the accused on its behalf'), showIf: (v) => Boolean(v.civilTem) },
    { name: 'remeteAcusacao', type: 'toggle', section: 'factos', default: true, label: l('Dar por reproduzidos os factos da acusação', 'Adopt the facts of the accusation') },
    { name: 'crimeNome', type: 'text', section: 'factos', width: 'half', label: l('Crime (opcional)', 'Offence (optional)'), placeholder: l('Ex.: ofensas corporais; furto', 'E.g. assault; theft') },
    { name: 'factos', type: 'textarea', section: 'factos', rows: 6, label: l('Factos próprios do pedido (um artigo por linha)', 'Facts of the claim (one article per line)'), help: l('Os factos que mostram os danos: ferimentos, tratamentos, dias sem trabalhar, bens perdidos, sofrimento.', 'Facts showing the damage: injuries, treatment, days off work, lost property, suffering.') },
    {
      name: 'danos',
      type: 'lines',
      section: 'factos',
      label: l('Danos e valores', 'Damage and amounts'),
      addLabel: l('Acrescentar dano', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        {
          name: 'tipo',
          type: 'select',
          label: l('Tipo', 'Type'),
          default: 'patrimonial',
          options: [
            { value: 'patrimonial', label: l('Patrimonial', 'Financial') },
            { value: 'nao_patrimonial', label: l('Não patrimonial (dor, sofrimento)', 'Non-financial (pain, suffering)') },
          ],
        },
        { name: 'valor', type: 'money', label: l('Valor', 'Amount') },
      ],
      default: [{ descricao: '', tipo: 'patrimonial', valor: '' }],
    },
    { name: 'juros', type: 'toggle', section: 'factos', default: true, label: l('Pedir juros de mora desde a notificação', 'Claim default interest from notification') },
    { name: 'testemunhas', type: 'textarea', section: 'prova', rows: 3, label: l('Rol de testemunhas (opcional)', 'Witnesses (optional)'), help: l('Uma por linha: nome, profissão e morada.', 'One per line.') },
    { name: 'documentos', type: 'textarea', section: 'prova', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), placeholder: l('Relatório médico\nFacturas da clínica', 'Medical report\nClinic invoices') },
    ...optionalLawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  computed: (v) => {
    const d = danos(v);
    const total = d.reduce((s, x) => s + (x.valor ?? 0), 0);
    return { total: d.some((x) => x.valor != null) ? total : null };
  },

  warnings: (v, ctx) => {
    const a = ctx.legal.value<{ mesesSemAcusacao: number }>('ppIndemnizacaoCivil');
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `O pedido de indemnização fundado num crime é deduzido no próprio processo penal (princípio de adesão — ${cite('ppIndemnizacaoCivil')}). Só pode ir para uma acção cível separada nos casos da lei, por exemplo se não houver acusação em ${a.mesesSemAcusacao} meses. Confirme o prazo para deduzir o pedido, que corre a partir da notificação da acusação.`,
          `A damages claim based on a crime is made in the criminal case. It can go to a separate civil action only in the cases the law allows (e.g. no accusation within ${a.mesesSemAcusacao} months). Check the time limit, which runs from notification of the accusation.`,
        ),
      },
    ];
    if (ctx.computed.total == null) w.push({ level: 'warning', field: 'danos', message: l('Indique os danos e os valores pedidos.', 'Enter the damage items and amounts.') });
    if (!v.viaAdvogado) w.push({ level: 'info', field: 'viaAdvogado', message: l('Confirme se o valor do pedido exige patrocínio por advogado.', 'Check whether the amount claimed requires a lawyer.') });
    return w;
  },

  personName: (v) => v.demandanteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v, ['julgamento', 'instrucao', 'mp']);
    const d = danos(v);
    const total = ctx.computed.total as number | null;
    const dem = (m: string, f: string) => papel(v, 'demandante', m, f);
    const ddo = (m: string, f: string) => papel(v, 'demandado', m, f);
    const civil = Boolean(v.civilTem) && Boolean(str(v.civilNome));
    const qualidade = v.demandanteQualidade === 'lesado' ? dem('lesado', 'lesada') : 'assistente';
    const crime = str(v.crimeNome);
    const factos = [
      ...(v.remeteAcusacao ? [`Dá-se aqui por integralmente reproduzida a matéria de facto constante da acusação deduzida nos autos${crime ? ` pela prática de crime de ${crime}` : ''}, para todos os efeitos legais.`] : []),
      ...artigos(v.factos),
    ];
    const danoItens = d.map((x) => `A título de ${x.tipo === 'nao_patrimonial' ? 'danos não patrimoniais' : 'danos patrimoniais'}, ${x.descricao ? x.descricao.replace(/[.;]$/, '') : '____________________'}${x.valor != null ? `, no valor de ${formatMoney(x.valor)}` : ''}.`);
    const direito = [
      `${ddo('O demandado', 'A demandada')}, ao praticar os factos descritos, violou ilícita e culposamente direitos ${dem('do demandante', 'da demandante')}, ficando ${ddo('obrigado', 'obrigada')} a indemnizá-${dem('lo', 'la')} pelos danos causados (${cite('ppResponsabilidadeCivil')}).`,
      ...(d.some((x) => x.tipo === 'nao_patrimonial') ? ['Os danos não patrimoniais sofridos, pela sua gravidade, merecem a tutela do direito, devendo a indemnização ser fixada equitativamente.'] : []),
      ...(civil ? [`**${str(v.civilNome).toLocaleUpperCase('pt')}** responde civilmente pelos mesmos danos, porquanto ${str(v.civilFundamento).replace(/[.;]$/, '') || '____________________'}.`] : []),
      `O pedido é deduzido no presente processo penal, nos termos do ${cite('ppIndemnizacaoCivil')}.`,
    ];
    const condenados = civil ? `${ddo('o demandado', 'a demandada')} e ${papel(v, 'civil', 'o demandado civil', 'a demandada civil')}, solidariamente,` : ddo('o demandado', 'a demandada');
    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: fase !== 'mp' ? str(v.seccao) || undefined : undefined, addressee: penalAddressee(v, fase) },
      {
        type: 'paragraph',
        id: 'demandante',
        text: `${partyDesc(v, 'demandante')}, ${qualidade} ${nosAutos(v)}, vem${viaMandatario(v)} deduzir contra ${partyDesc(v, 'demandado')}, ${ddo('arguido', 'arguida')} nos mesmos autos${civil ? `, e contra ${partyDesc(v, 'civil')}, ${papel(v, 'civil', 'civilmente responsável', 'civilmente responsável')}` : ''},`,
        en: 'The injured party brings against the accused (and any party with civil liability) a',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**PEDIDO DE INDEMNIZAÇÃO CIVIL**,', en: 'CIVIL DAMAGES CLAIM,' },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following grounds:' },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Dos factos', items: factos.length ? factos : ['____________________'] },
          { heading: 'II — Dos danos', items: danoItens.length ? danoItens : ['____________________'] },
          { heading: 'III — Do direito', items: direito },
        ],
      },
    ];
    if (d.length) {
      blocks.push({
        type: 'table',
        caption: 'Resumo dos danos',
        columns: [
          { label: 'Dano', width: 55 },
          { label: 'Tipo', width: 20 },
          { label: 'Valor', width: 25, align: 'right' },
        ],
        rows: d.map((x) => [x.descricao || '—', x.tipo === 'nao_patrimonial' ? 'Não patrimonial' : 'Patrimonial', formatMoney(x.valor)]),
        totals: [['Total', '', formatMoney(total)]],
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve o presente pedido ser julgado procedente, por provado, e, em consequência, ser${civil ? 'em' : ''} ${condenados} ${civil ? 'condenados' : ddo('condenado', 'condenada')} a pagar ${dem('ao demandante', 'à demandante')} a quantia de ${moneyExt(total)}${v.juros ? ', acrescida de juros de mora, à taxa legal, desde a data da notificação do presente pedido até efectivo e integral pagamento' : ''}, bem como as custas.`,
        en: 'The claimant asks that the defendant(s) be ordered to pay the total amount, with default interest and costs.',
      },
      linePara('valor', 'Valor', `${moneyExt(total)}.`, 'Value of the claim.'),
      linePara('junta', 'Junta', `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length })}.`, 'Attached documents.', !testemunhas.length),
    );
    if (testemunhas.length) {
      blocks.push(
        { type: 'paragraph', id: 'rol', text: '**Rol de testemunhas:**', en: 'Witnesses:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: testemunhas, keepWithNext: true },
      );
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [partySignature(v, 'demandante', dem('O Demandante', 'A Demandante'))] },
    );
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return keepTail(blocks, 'pedido');
  },
});
