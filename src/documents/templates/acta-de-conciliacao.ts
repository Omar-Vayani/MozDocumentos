// Acta de conciliação: the neighbourhood secretary or community leader records
// the agreement two parties reached in a mediation. A voluntary settlement, not
// a judgement: no fines or penalties, and never for public crimes, domestic
// violence, child custody or maintenance, or land titling.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField, money } from './_shared';
import { dataPorExtenso, hora } from './_estado';
import { MAX_EXTENSO, formatMoney, numeroPorExtenso } from '@/lib/format';
import { assinanteColumn, assinaturaFields, comunidadeWarnings, identificacao, numeroComunidadeField, numeroRef, pessoaFields, str, testemunhas, testemunhasField, unidadeField } from './_comunidade';

const CRIME = /viol[êe]ncia|agress|espanc|viola[cç][aã]o|abuso sexual|estupro|abuso de menor|homic[ií]d|mat(ou|ar)\b|assassin|rapto|tr[aá]fico|droga|arma|roubo|incêndio/i;
const FAMILIA = /guarda|pens[aã]o de alimentos|alimentos|div[óo]rcio|poder parental|regula[cç][aã]o/i;
const TERRA = /\bDUAT\b|t[ií]tulo de terra|titula[cç][aã]o/i;

export default defineTemplate({
  id: 'acta-de-conciliacao',
  family: 'acta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Sessão', 'Session') },
    { id: 'parte1', title: l('Primeira parte', 'First party'), personRole: 'outro' },
    { id: 'parte2', title: l('Segunda parte', 'Second party'), personRole: 'outro' },
    { id: 'diferendo', title: l('Diferendo e acordo', 'Dispute and agreement') },
    { id: 'assinatura', title: l('Mediador e testemunhas', 'Mediator and witnesses') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data', 'documento', l('Data da sessão', 'Date of the session')),
    { name: 'hora', type: 'text', section: 'documento', width: 'half', label: l('Hora', 'Time'), placeholder: l('Ex.: 10:00', 'E.g. 10:00') },
    { name: 'localSessao', type: 'text', section: 'documento', width: 'half', label: l('Onde', 'Where'), default: 'na sede da Secretaria' },
    ...pessoaFields(['nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero', 'quarteirao', 'casa', 'telefone'], 'parte1', 'parte1'),
    ...pessoaFields(['nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero', 'quarteirao', 'casa', 'telefone'], 'parte2', 'parte2'),
    {
      name: 'objecto',
      type: 'textarea',
      section: 'diferendo',
      required: true,
      rows: 3,
      label: l('Objecto do diferendo', 'What the dispute is about'),
      placeholder: l('Ex.: a Primeira parte reclama a devolução de 15 000 MT emprestados em Março de 2026', 'E.g. repayment of a loan'),
    },
    {
      name: 'acordo',
      type: 'lines',
      section: 'diferendo',
      required: true,
      label: l('O que as partes acordaram', 'What the parties agreed'),
      help: l('Uma obrigação por linha: quem faz o quê e até quando.', 'One obligation per line: who does what and by when.'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [{ name: 'texto', type: 'text', label: l('Ponto do acordo', 'Agreement item') }],
      default: [],
    },
    { name: 'valor', type: 'money', section: 'diferendo', width: 'half', label: l('Valor a pagar (opcional)', 'Amount to pay (optional)') },
    { name: 'devedor', type: 'radio', section: 'diferendo', width: 'half', label: l('Quem paga', 'Who pays'), options: [{ value: 'parte2', label: l('Segunda parte', 'Second party') }, { value: 'parte1', label: l('Primeira parte', 'First party') }], default: 'parte2', showIf: (v) => !!str(v.valor) },
    { name: 'pagamento', type: 'text', section: 'diferendo', label: l('Forma e prazo de pagamento', 'Payment terms'), placeholder: l('Ex.: em três prestações mensais, até ao dia 5 de cada mês', 'E.g. three monthly instalments'), showIf: (v) => !!str(v.valor) },
    { name: 'lingua', type: 'text', section: 'diferendo', width: 'half', label: l('Língua da sessão (se não for o português)', 'Language used (if not Portuguese)'), placeholder: l('Ex.: changana', 'E.g. Changana') },
    {
      name: 'naoCrime',
      type: 'toggle',
      section: 'diferendo',
      label: l('Confirmo que o assunto não é crime público nem matéria reservada ao tribunal', 'I confirm the matter is not a public crime nor reserved to the courts'),
      help: l('Violência, abuso, homicídio, roubo, guarda ou alimentos de menores, divórcio e titulação de terra não se resolvem por acordo no bairro.', 'Violence, abuse, homicide, robbery, child custody or maintenance, divorce and land titling cannot be settled in the neighbourhood.'),
      default: false,
    },
    testemunhasField('assinatura'),
    ...assinaturaFields('assinatura', { visto: false, confirmacoes: false }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    const txt = `${str(v.objecto)} ${lineItems(v.acordo).map((r) => str(r.texto)).join(' ')}`;
    if (CRIME.test(txt)) {
      w.push({ level: 'error', field: 'objecto', message: l('Este assunto parece ser um crime: deve ser comunicado à Polícia ou ao Ministério Público. A estrutura do bairro não pode conciliar crimes públicos nem violência doméstica.', 'This looks like a crime: report it to the police or prosecutor. Neighbourhood structures cannot settle public crimes or domestic violence.') });
    }
    if (FAMILIA.test(txt)) w.push({ level: 'warning', field: 'objecto', message: l('Guarda, alimentos de menores e divórcio dependem do tribunal; um acordo no bairro não produz efeitos sem homologação.', 'Custody, child maintenance and divorce depend on the court; a neighbourhood agreement has no effect without court approval.') });
    if (TERRA.test(txt)) w.push({ level: 'warning', field: 'objecto', message: l('A titulação da terra compete às entidades estatais; o acordo só vincula as partes quanto ao uso.', 'Land titling belongs to the State; the agreement binds the parties only.') });
    if (!v.naoCrime) w.push({ level: 'warning', field: 'naoCrime', message: l('Confirme que o assunto pode ser conciliado no bairro.', 'Confirm the matter can be settled in the neighbourhood.') });
    w.push({ level: 'info', message: l(`O acordo vale como transacção entre as partes que o assinam (${cite('advTransaccao')}). Se não for cumprido, a parte interessada pode recorrer ao tribunal comunitário ou ao tribunal judicial com esta acta como prova.`, 'The agreement is a settlement between the signing parties. If it is not kept, the interested party may go to court with these minutes as evidence.') });
    return w;
  },

  personName: (v) => [str(v.parte1Nome), str(v.parte2Nome)].filter(Boolean).join(' e '),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const unidade = str(v.unidade);
    const mediador = assinanteColumn(ctx);
    const ts = testemunhas(v);
    const end = (p: string) => [str(v[`${p}Quarteirao`]) ? `Quarteirão n.º ${str(v[`${p}Quarteirao`])}` : '', str(v[`${p}Casa`]) ? `Casa n.º ${str(v[`${p}Casa`])}` : ''].filter(Boolean).join(', ');
    const parte = (p: string) => `${identificacao(v, p)}${end(p) ? `, residente no ${end(p)}` : ''}${str(v[`${p}Telefone`]) ? `, contacto ${str(v[`${p}Telefone`])}` : ''}`;
    const itens = lineItems(v.acordo).map((r) => str(r.texto)).filter(Boolean);
    const val = money(v.valor) ?? 0;
    if (val > 0) {
      const quem = v.devedor === 'parte1' ? 'A Primeira parte' : 'A Segunda parte';
      const outra = v.devedor === 'parte1' ? 'à Segunda parte' : 'à Primeira parte';
      itens.unshift(`${quem} pagará ${outra} a quantia de ${formatMoney(val)}${val <= MAX_EXTENSO ? ` (${numeroPorExtenso(val)})` : ''}${str(v.pagamento) ? `, ${str(v.pagamento).replace(/[.;]+$/, '')}` : ''}.`);
    }
    itens.push('As partes comprometem-se a manter boas relações de vizinhança e a não retomar o diferendo agora resolvido.');
    const presencas = ts.length ? `, na presença de ${ts.map((t) => `**${t.nome}**${t.documento ? ` (BI n.º ${t.documento})` : ''}`).join(', ')}` : '';
    const lingua = str(v.lingua) ? ` e traduzida para ${str(v.lingua)}` : '';

    const blocks: Block[] = [
      { type: 'title', text: 'Acta de Conciliação', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${hora(v.hora, 'pelas')}, ${str(v.localSessao) || BLANK}${unidade ? ` ${/^(Povoação|Aldeia|Localidade|Comunidade)/i.test(unidade) ? 'da' : 'do'} ${unidade}` : ''}, perante **${mediador.name || BLANK}**, ${mediador.role.replace(/^(O|A) /, (m) => m.toLowerCase())}, na qualidade de mediador${/^A /.test(mediador.role) ? 'a' : ''}, compareceram:`,
        keepWithNext: true,
        en: 'Opening: date, time and place of the mediation session, the mediator and the parties present.',
      },
      { type: 'paragraph', id: 'parte1', text: `**Primeira parte:** ${parte('parte1')};`, en: 'First party.' },
      { type: 'paragraph', id: 'parte2', text: `**Segunda parte:** ${parte('parte2')}${presencas};`.replace(/;$/, '.'), en: 'Second party and witnesses present.' },
      { type: 'paragraph', id: 'objecto', text: `**Objecto do diferendo:** ${str(v.objecto).replace(/\s*\n+\s*/g, ' ').replace(/[.;]+$/, '') || BLANK}.`, en: 'What the dispute is about.' },
      {
        type: 'paragraph',
        id: 'esclarecimento',
        text: 'Ouvidas as partes, e depois de esclarecidas de que a conciliação é voluntária e de que podem recorrer ao tribunal comunitário ou aos tribunais judiciais, as partes **acordaram livremente** o seguinte:',
        keepWithNext: true,
        en: 'Having heard the parties and explained that conciliation is voluntary and that they may go to court, the parties freely agreed as follows:',
      },
      { type: 'numberedClauses', style: 'numeric', items: itens.map((t, i) => ({ id: `acordo-${i + 1}`, text: /[.;]$/.test(t) ? t : `${t}.`, en: 'Agreement item.' })) },
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `As partes declaram que o presente acordo põe termo ao diferendo e que o assinam de livre vontade, depois de lido em voz alta${lingua}. Feita em três exemplares: um para cada parte e um para o arquivo da estrutura.`,
        keepWithNext: true,
        en: 'The parties declare the agreement ends the dispute and sign it freely after it was read aloud. Three copies.',
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [
          { role: 'A Primeira parte', name: str(v.parte1Nome) || undefined },
          { role: 'A Segunda parte', name: str(v.parte2Nome) || undefined },
          { ...mediador, role: `${mediador.role} (mediador${/^A /.test(mediador.role) ? 'a' : ''})` },
        ],
      },
    ];
    if (ts.length) {
      blocks.push({ type: 'signatures', columns: ts.slice(0, 3).map((t, i) => ({ role: `${i + 1}.ª Testemunha`, name: t.nome || undefined })) });
    }
    blocks.push({ type: 'note', text: 'Quem não souber assinar apõe a impressão digital junto do seu nome. O acordo vincula apenas as partes que o assinam e não constitui decisão judicial.', en: 'Those who cannot sign use a thumbprint. The agreement binds only the signing parties and is not a court decision.' });
    return blocks;
  },
});
