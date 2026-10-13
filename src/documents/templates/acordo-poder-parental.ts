// Acordo de regulação do exercício do poder parental e de alimentos: separated
// parents agree on the child's residence, contact and maintenance, for
// approval (homologação) by the juvenile section of the court.

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, FORMA_PAGAMENTO_OPTIONS, isF, l, lineItems, localField, money, placeDate, splitLines } from './_shared';
import { moneyExt, nExt } from './_contrato-trabalho';
import { ageOn, identificacao, notaryBox, PARENTESCO_OPTIONS, pessoaFields, qualidadeParental, RECONHECIMENTO_FIELD, str } from './_pessoal-rh';

type Filho = { nome: string; genero: string; nascimento: string; registo: string };

const VISITAS_DEFAULT = [
  'Fins-de-semana alternados, de sexta-feira às 18h00 a domingo às 18h00',
  'Metade das férias escolares, em períodos a combinar com antecedência',
  'Dias de Natal e de Ano Novo alternados entre os progenitores',
  'Dia do aniversário do progenitor não residente',
].join('\n');

function filhos(v: Values): Filho[] {
  return lineItems(v.filhos)
    .map((r) => ({ nome: str(r.nome), genero: str(r.genero), nascimento: str(r.nascimento), registo: str(r.registo) }))
    .filter((f) => f.nome);
}

/** "Pai"/"Mãe"/"Tutor(a)" capitalised designation of a parent. */
function designacao(v: Values, p: string): string {
  const q = qualidadeParental(v[`${p}Qualidade`], v[`${p}Genero`]);
  return q.charAt(0).toUpperCase() + q.slice(1);
}
const artigo = (v: Values, p: string) => (isF(v[`${p}Genero`]) ? 'a' : 'o');

export default defineTemplate({
  id: 'acordo-poder-parental',
  family: 'contrato',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'progenitor1', title: l('Primeiro progenitor', 'First parent'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'progenitor2', title: l('Segundo progenitor', 'Second parent'), personRole: 'outro' },
    { id: 'filhos', title: l('Filhos', 'Children') },
    { id: 'residencia', title: l('Residência e decisões', 'Residence and decisions') },
    { id: 'visitas', title: l('Convívio e visitas', 'Contact and visits') },
    { id: 'alimentos', title: l('Pensão de alimentos', 'Child maintenance') },
    { id: 'tribunal', title: l('Tribunal e opções', 'Court and options') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data do acordo', 'Date of the agreement')),
    ...pessoaFields('progenitor1', 'progenitor1', { profile: true }),
    {
      name: 'progenitor1Qualidade',
      type: 'select',
      section: 'progenitor1',
      width: 'half',
      label: l('É', 'Is the'),
      options: PARENTESCO_OPTIONS,
      default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'mãe' : 'pai'),
    },
    ...pessoaFields('progenitor2', 'progenitor2'),
    {
      name: 'progenitor2Qualidade',
      type: 'select',
      section: 'progenitor2',
      width: 'half',
      label: l('É', 'Is the'),
      options: PARENTESCO_OPTIONS,
      default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'pai' : 'mãe'),
    },
    {
      name: 'situacao',
      type: 'select',
      section: 'filhos',
      required: true,
      label: l('Situação dos pais', 'Parents’ situation'),
      default: 'separacao',
      options: [
        { value: 'divorcio', label: l('Divórcio (ou divórcio em curso)', 'Divorce (or divorce in progress)') },
        { value: 'separacao', label: l('Casados, separados de facto', 'Married, living apart') },
        { value: 'uniao', label: l('Viviam em união de facto, já não vivem juntos', 'Were in a de facto union, now apart') },
        { value: 'nunca', label: l('Nunca viveram juntos', 'Never lived together') },
      ],
    },
    {
      name: 'filhos',
      type: 'lines',
      section: 'filhos',
      required: true,
      label: l('Filhos menores', 'Minor children'),
      addLabel: l('Adicionar filho', 'Add child'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'genero', type: 'select', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }] },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
        { name: 'registo', type: 'text', label: l('Assento de nascimento (n.º e conservatória)', 'Birth registration (no. and registry)') },
      ],
      default: [{ nome: '', genero: 'M', nascimento: '', registo: '' }],
    },
    {
      name: 'residenteCom',
      type: 'radio',
      section: 'residencia',
      required: true,
      label: l('Os filhos vivem com', 'The children live with'),
      default: 'progenitor1',
      options: [
        { value: 'progenitor1', label: l('O primeiro progenitor', 'The first parent') },
        { value: 'progenitor2', label: l('O segundo progenitor', 'The second parent') },
      ],
    },
    {
      name: 'decisoesConjuntas',
      type: 'toggle',
      section: 'residencia',
      default: true,
      label: l('As decisões importantes são tomadas pelos dois', 'Major decisions are taken by both parents'),
      help: l('Escola, saúde, religião e viagens ao estrangeiro. Os actos do dia-a-dia cabem a quem tem o menor consigo.', 'School, health, religion and travel abroad. Day-to-day matters fall to the parent the child lives with.'),
    },
    {
      name: 'visitas',
      type: 'textarea',
      section: 'visitas',
      rows: 5,
      label: l('Regime de visitas', 'Contact arrangements'),
      help: l('Um ponto por linha.', 'One item per line.'),
      default: VISITAS_DEFAULT,
    },
    {
      name: 'alimentosValor',
      type: 'money',
      section: 'alimentos',
      width: 'half',
      required: true,
      label: l('Pensão mensal (total, para todos os filhos)', 'Monthly maintenance (total, all children)'),
    },
    { name: 'alimentosDia', type: 'number', section: 'alimentos', width: 'half', min: 1, max: 31, default: 5, label: l('Pagar até ao dia', 'Pay by day of month') },
    { name: 'alimentosForma', type: 'select', section: 'alimentos', width: 'half', label: l('Forma de pagamento', 'Payment method'), options: FORMA_PAGAMENTO_OPTIONS, default: 'transferência bancária' },
    { name: 'alimentosConta', type: 'text', section: 'alimentos', width: 'half', label: l('Conta / número para pagamento', 'Account / number for payment'), placeholder: l('Ex.: NIB 0001 0000 …; M-Pesa 84 …', 'E.g. bank account; mobile wallet') },
    {
      name: 'despesasReparticao',
      type: 'select',
      section: 'alimentos',
      width: 'half',
      label: l('Despesas extraordinárias (escola, saúde)', 'Extra expenses (school, health)'),
      default: 'iguais',
      options: [
        { value: 'iguais', label: l('Em partes iguais', 'Split equally') },
        { value: 'proporcao', label: l('Noutra proporção', 'Other split') },
        { value: 'devedor', label: l('Pagas por quem paga a pensão', 'Paid by the paying parent') },
      ],
    },
    {
      name: 'despesasPercentagem',
      type: 'number',
      section: 'alimentos',
      width: 'half',
      min: 0,
      max: 100,
      default: 60,
      label: l('Parte de quem paga a pensão (%)', 'Paying parent’s share (%)'),
      showIf: (v) => v.despesasReparticao === 'proporcao',
    },
    {
      name: 'actualizacao',
      type: 'toggle',
      section: 'alimentos',
      default: true,
      label: l('Actualizar a pensão todos os anos', 'Update the amount every year'),
    },
    {
      name: 'actualizacaoTexto',
      type: 'text',
      section: 'alimentos',
      label: l('Regra de actualização', 'Update rule'),
      default: 'em Janeiro de cada ano, na mesma proporção do aumento do salário mínimo nacional',
      showIf: (v) => Boolean(v.actualizacao),
    },
    {
      name: 'tribunal',
      type: 'text',
      section: 'tribunal',
      label: l('Tribunal', 'Court'),
      default: 'Tribunal Judicial da Cidade de Maputo — Secção de Menores',
      help: l('O tribunal da residência do menor (secção de menores, onde exista).', 'The court where the child lives (juvenile section, where there is one).'),
    },
    RECONHECIMENTO_FIELD('tribunal'),
  ],

  computed: (v) => {
    const residente = v.residenteCom === 'progenitor2' ? 'progenitor2' : 'progenitor1';
    const devedor = residente === 'progenitor1' ? 'progenitor2' : 'progenitor1';
    return { lista: filhos(v), residente, devedor, visitas: splitLines(v.visitas) };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const maior = ctx.legal.value<{ anos: number }>('maioridade').anos;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Este acordo só produz efeitos depois de homologado pelo tribunal, que ouve o Ministério Público (${cite('regulacaoPoderParental')}). Entregue-o com as certidões de nascimento dos filhos. O tribunal pode recusá-lo se não proteger o interesse do menor.`,
          'This agreement only takes effect once approved by the court, after hearing the Public Prosecutor. File it with the children’s birth certificates. The court may refuse it if it does not protect the child’s interests.',
        ),
      },
      {
        level: 'info',
        message: l('Pode pedir aconselhamento jurídico gratuito ao IPAJ antes de assinar.', 'Free legal advice is available from IPAJ before signing.'),
      },
    ];
    if (!c.lista.length) w.push({ level: 'error', field: 'filhos', message: l('Indique os filhos abrangidos.', 'Enter the children covered.') });
    for (const f of c.lista as Filho[]) {
      const idade = ageOn(f.nascimento, v.data);
      if (idade != null && idade >= maior) {
        w.push({ level: 'warning', field: 'filhos', message: l(`${f.nome} já é maior: o poder parental cessa na maioridade.`, `${f.nome} is already an adult: parental authority ends at majority.`) });
      }
    }
    const valor = money(v.alimentosValor);
    if (valor == null || valor <= 0) {
      w.push({ level: 'warning', field: 'alimentosValor', message: l('Indique o valor da pensão de alimentos. Sem ele, o tribunal não homologa o acordo.', 'Enter the maintenance amount. Without it the court will not approve the agreement.') });
    }
    for (const p of ['progenitor1', 'progenitor2']) {
      if (!str(v[`${p}DocNumero`])) w.push({ level: 'warning', field: `${p}DocNumero`, message: l('Falta o número do documento de identificação de um dos progenitores.', 'One parent’s ID number is missing.') });
    }
    return w;
  },

  personName: (v) => filhos(v)[0]?.nome || v.progenitor1Nome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const lista = c.lista as Filho[];
    const plural = lista.length > 1;
    const todosF = lista.length > 0 && lista.every((f) => isF(f.genero));
    const oMenor = plural ? (todosF ? 'as menores' : 'os menores') : todosF ? 'a menor' : 'o menor';
    const OMenor = oMenor.charAt(0).toUpperCase() + oMenor.slice(1);
    const doMenor = `d${oMenor}`;
    const dRes = designacao(v, c.residente);
    const dDev = designacao(v, c.devedor);
    const aRes = artigo(v, c.residente);
    const aDev = artigo(v, c.devedor);
    const AoRes = `${aRes === 'a' ? 'à' : 'ao'} ${dRes}`;

    const situacao: Record<string, string> = {
      divorcio: 'se encontram divorciados ou em processo de divórcio',
      separacao: 'são casados entre si e se encontram separados de facto',
      uniao: 'viveram em união de facto, que cessou',
      nunca: 'não vivem nem viveram em comum',
    };
    const filhoItem = (f: Filho, i: number) =>
      `**${f.nome}**, ${isF(f.genero) ? 'nascida' : 'nascido'} a ${dateLong(f.nascimento)}${f.registo ? `, ${isF(f.genero) ? 'registada' : 'registado'} sob o assento n.º ${f.registo}` : ''}${i === lista.length - 1 ? '' : ';'}`;

    const dia = Number(v.alimentosDia) || 5;
    const forma = String(v.alimentosForma || 'transferência bancária');
    const formaTxt =
      forma === 'numerário'
        ? 'em numerário, contra recibo'
        : forma === 'cheque'
          ? 'por cheque'
          : `por ${forma}${str(v.alimentosConta) ? ` para ${/^(M-Pesa|e-Mola|mKesh)$/.test(forma) ? 'o número' : 'a conta'} ${str(v.alimentosConta)}` : ''}`;
    const pct = Math.max(0, Math.min(100, Number(v.despesasPercentagem) || 0));
    const despesas =
      v.despesasReparticao === 'devedor'
        ? `são suportadas integralmente ${pelo(v, c.devedor)} ${dDev}`
        : v.despesasReparticao === 'proporcao'
          ? `são suportadas na proporção de ${nExt(pct)} por cento ${pelo(v, c.devedor)} ${dDev} e de ${nExt(100 - pct)} por cento ${pelo(v, c.residente)} ${dRes}`
          : 'são suportadas em partes iguais pelos dois progenitores';

    const clauses: ClauseItem[] = [
      {
        id: 'residencia',
        heading: 'Residência',
        text: `${OMenor} ${plural ? 'ficam a residir' : 'fica a residir'} com ${aRes} ${dRes}, a quem cabem a guarda e os cuidados do dia-a-dia.`,
        en: `The child(ren) will live with the ${dRes === 'Mãe' ? 'mother' : dRes === 'Pai' ? 'father' : 'guardian'}, who has day-to-day care.`,
      },
      {
        id: 'poderParental',
        heading: 'Exercício do poder parental',
        text: v.decisoesConjuntas
          ? `1. As decisões de particular importância para a vida ${doMenor}, nomeadamente as relativas à escola, à saúde, à religião e às viagens para o estrangeiro, são tomadas por ambos os progenitores.\n2. Os actos da vida corrente cabem ${AoRes}, que informa ${aDev} ${dDev} sobre a saúde, a educação e o bem-estar ${doMenor}.`
          : `O poder parental é exercido ${pelo(v, c.residente)} ${dRes}, que informa regularmente ${aDev} ${dDev} sobre a saúde, a educação e o bem-estar ${doMenor}.`,
        en: v.decisoesConjuntas
          ? '1. Major decisions (school, health, religion, travel abroad) are taken by both parents. 2. Day-to-day matters fall to the resident parent, who keeps the other parent informed.'
          : 'Parental authority is exercised by the resident parent, who keeps the other parent informed.',
      },
      {
        id: 'visitas',
        heading: 'Convívio',
        text: `${aDev === 'a' ? 'A' : 'O'} ${dDev} pode estar com ${oMenor} sempre que o deseje, sem prejuízo das actividades escolares e do descanso ${doMenor}, combinando previamente com ${aRes} ${dRes}, e, no mínimo, nos seguintes períodos:`,
        items: (c.visitas.length ? c.visitas : [BLANK]).map((s: string, i: number, a: string[]) => `${s.replace(/[.;]$/, '')}${i === a.length - 1 ? '.' : ';'}`),
        en: 'The non-resident parent may see the child(ren) whenever they wish, by prior arrangement and respecting school and rest, and at least during the periods listed.',
      },
      {
        id: 'alimentos',
        heading: 'Alimentos',
        text: `1. ${aDev === 'a' ? 'A' : 'O'} ${dDev} contribui para o sustento ${doMenor}, a título de alimentos, com a quantia mensal de **${moneyExt(v.alimentosValor)}**, a entregar ${AoRes} até ao dia ${nExt(dia)} de cada mês, ${formaTxt}.\n2. A primeira prestação vence-se no mês seguinte ao da homologação do presente acordo, salvo se os progenitores acordarem em antecipar o seu pagamento.`,
        en: `1. The non-resident parent pays ${v.alimentosValor || '—'} MT a month in maintenance to the resident parent by day ${dia} of each month. 2. The first payment is due in the month after court approval, unless the parents agree to start earlier.`,
      },
      {
        id: 'despesas',
        heading: 'Despesas extraordinárias',
        text: `As despesas de saúde não cobertas por seguro ou pelo Serviço Nacional de Saúde, as propinas, o material e o uniforme escolar ${despesas}, mediante apresentação do respectivo comprovativo.`,
        en: 'Uncovered health costs, school fees, materials and uniforms are shared as stated, on presentation of receipts.',
      },
    ];
    if (v.actualizacao) {
      clauses.push({
        id: 'actualizacao',
        heading: 'Actualização',
        text: `A pensão de alimentos é actualizada ${str(v.actualizacaoTexto).replace(/\.$/, '') || BLANK}.`,
        en: `The maintenance amount is updated ${v.actualizacaoTexto || 'every year'}.`,
      });
    }
    clauses.push(
      {
        id: 'viagens',
        heading: 'Viagens',
        text: `As viagens ${doMenor} para fora do país dependem de autorização escrita de ambos os progenitores, que nenhum deles recusará sem motivo justificado.`,
        en: 'Travel abroad requires both parents’ written consent, which neither will refuse without good reason.',
      },
      {
        id: 'alteracao',
        heading: 'Alteração',
        text: 'Qualquer dos progenitores pode requerer ao tribunal a alteração do presente acordo quando circunstâncias supervenientes o justifiquem, designadamente a alteração dos rendimentos ou das necessidades.',
        en: 'Either parent may ask the court to change this agreement if circumstances change, in particular income or needs.',
      },
      {
        id: 'homologacao',
        heading: 'Homologação',
        text: `Os progenitores requerem a homologação do presente acordo ${str(v.tribunal) ? `pelo ${str(v.tribunal).replace(/^(o|O)\s/, '')}` : 'pelo tribunal competente'}, nos termos da ${cite('regulacaoPoderParental')}, ouvido o Ministério Público.`,
        en: 'The parents ask the court to approve this agreement, after hearing the Public Prosecutor.',
      },
    );

    const blocks: Block[] = [
      { type: 'title', text: 'Acordo de Regulação do Exercício do Poder Parental e de Alimentos' },
      { type: 'paragraph', id: 'entre', text: '**Entre:**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parte1', text: `${identificacao(v, 'progenitor1')}, adiante ${isF(v.progenitor1Genero) ? 'designada' : 'designado'} por **${designacao(v, 'progenitor1')}**;`, en: 'The first parent, identified above;' },
      { type: 'paragraph', id: 'e', text: '**e**', align: 'left', editable: false },
      { type: 'paragraph', id: 'parte2', text: `${identificacao(v, 'progenitor2')}, adiante ${isF(v.progenitor2Genero) ? 'designada' : 'designado'} por **${designacao(v, 'progenitor2')}**;`, en: 'The second parent, identified above;' },
      {
        type: 'paragraph',
        id: 'considerando',
        text: `Considerando que os outorgantes são progenitores ${plural ? `d${oMenor} seguintes` : doMenor}${plural ? ':' : ` ${lista[0] ? filhoItem(lista[0], 0) : `**${BLANK}**`}, e que ${situacao[v.situacao] ?? situacao.separacao}, é celebrado o presente acordo, que se rege pelas cláusulas seguintes:`}`,
        en: 'Whereas the parties are the parents of the child(ren) named and live apart, they enter into this agreement on the following terms:',
      },
    ];
    if (plural) {
      blocks.push(
        { type: 'list', style: 'alpha', items: lista.map(filhoItem) },
        {
          type: 'paragraph',
          id: 'considerandoPlural',
          text: `e que ${situacao[v.situacao] ?? situacao.separacao}, é celebrado o presente acordo, que se rege pelas cláusulas seguintes:`,
          en: 'and live apart, they enter into this agreement on the following terms:',
        },
      );
    }
    blocks.push(
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: 'Feito em três exemplares de igual valor, um para cada progenitor e outro para instruir o pedido de homologação.',
        en: 'Made in three counterparts of equal value: one for each parent and one for the court application.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: ['progenitor1', 'progenitor2'].map((p) => ({
          role: `${artigo(v, p) === 'a' ? 'A' : 'O'} ${designacao(v, p)}`,
          name: str(v[`${p}Nome`]) || undefined,
          detail: str(v[`${p}DocNumero`]) ? `${str(v[`${p}DocTipo`]) || 'BI'} n.º ${str(v[`${p}DocNumero`])}` : undefined,
        })),
      },
    );
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});

function pelo(v: Values, p: string): string {
  return isF(v[`${p}Genero`]) ? 'pela' : 'pelo';
}
