// Termo de entrega e responsabilidade: records equipment handed over (phone,
// laptop, vehicle, uniform…) and the recipient's duties of care and return.
// Optional damage clause: deductions from a worker's pay need the worker's
// written authorisation and stay within the legal limits (art. 124 of the
// Labour Law, via mz-legal) — no percentage is written into the text.

import { formatNumber, roundMoney } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, formatMoney, isF, l, lineItems, localField, money, placeDate, refField, workerFields } from './_shared';
import { doCite, lc, num } from './_contrato-trabalho';

const str = (x: unknown) => String(x ?? '').trim();
const semPonto = (x: unknown) => str(x).replace(/[.;,:]+$/, '');
const isEmpresa = (v: Values) => v.entreganteTipo === 'empresa';
const isTrabalhador = (v: Values) => v.recebedorTipo !== 'outro';

type Item = { descricao: string; serie: string; estado: string; quantidade: number; valor: number | null };

/** Gendered references to the recipient ("o Responsável" is invariable; adjectives agree). */
function rec(v: Values) {
  const f = isF(v.trabalhadorGenero);
  return {
    f,
    o: f ? 'a Responsável' : 'o Responsável',
    O: f ? 'A Responsável' : 'O Responsável',
    do: f ? 'da Responsável' : 'do Responsável',
    a: (m: string, fem: string) => (f ? fem : m),
  };
}

/** "a, b ou c" */
const ouList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ou ${xs[xs.length - 1]}`);

export default defineTemplate({
  id: 'termo-de-entrega',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'entrega', title: l('Quem entrega', 'Handed over by') },
    { id: 'recebe', title: l('Quem recebe', 'Received by'), personRole: 'trabalhador' },
    { id: 'bens', title: l('Bens entregues', 'Items handed over') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data da entrega', 'Handover date')),
    {
      name: 'entreganteTipo',
      type: 'radio',
      section: 'entrega',
      label: l('Quem entrega', 'Who hands over'),
      options: [
        { value: 'empresa', label: l('Empresa ou organização', 'Company or organisation') },
        { value: 'pessoa', label: l('Pessoa singular', 'Individual') },
      ],
      default: (c) => (c.profile?.kind === 'pessoa' ? 'pessoa' : 'empresa'),
    },
    {
      name: 'entreganteNome',
      type: 'text',
      section: 'entrega',
      required: true,
      label: l('Nome ou denominação', 'Name'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome : c.profile?.firma || c.profile?.nomeComercial) || '',
    },
    {
      name: 'entreganteGenero',
      type: 'radio',
      section: 'entrega',
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: [
        { value: 'M', label: l('Masculino', 'Male') },
        { value: 'F', label: l('Feminino', 'Female') },
      ],
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.genero || 'M' : 'M'),
      showIf: (v) => !isEmpresa(v),
    },
    {
      name: 'entreganteDoc',
      type: 'text',
      section: 'entrega',
      width: 'half',
      label: l('N.º do BI ou NUIT', 'ID or tax number'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.docNumero || c.profile.nuit || '' : c.profile?.nuit || ''),
    },
    {
      name: 'entreganteRepNome',
      type: 'text',
      section: 'entrega',
      width: 'half',
      label: l('Quem entrega em nome da empresa', 'Person handing over for the company'),
      default: (c) => c.profile?.representanteNome || '',
      showIf: isEmpresa,
    },
    {
      name: 'entreganteRepCargo',
      type: 'text',
      section: 'entrega',
      width: 'half',
      label: l('Cargo', 'Position'),
      default: (c) => c.profile?.representanteCargo || '',
      showIf: isEmpresa,
    },
    {
      name: 'recebedorTipo',
      type: 'radio',
      section: 'recebe',
      label: l('Quem recebe', 'Who receives'),
      options: [
        { value: 'trabalhador', label: l('Trabalhador', 'Employee') },
        { value: 'outro', label: l('Outra pessoa', 'Another person') },
      ],
      default: 'trabalhador',
    },
    ...workerFields(['nome', 'genero', 'docTipo', 'docNumero'], 'recebe'),
    ...workerFields(['cargo', 'departamento'], 'recebe').map((f) => ({ ...f, showIf: isTrabalhador })),
    {
      name: 'itens',
      type: 'lines',
      section: 'bens',
      required: true,
      label: l('Bens', 'Items'),
      addLabel: l('Adicionar bem', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description'), placeholder: l('Ex.: Computador portátil HP ProBook 450', 'E.g. HP ProBook 450 laptop') },
        { name: 'serie', type: 'text', label: l('N.º de série / matrícula', 'Serial / plate no.') },
        { name: 'estado', type: 'text', label: l('Estado', 'Condition'), placeholder: l('Ex.: Novo, Bom, Usado', 'E.g. New, Good, Used') },
        { name: 'quantidade', type: 'number', min: 1, label: l('Quantidade', 'Quantity') },
        { name: 'valor', type: 'money', label: l('Valor (opcional)', 'Value (optional)') },
      ],
      default: [],
    },
    {
      name: 'acessorios',
      type: 'text',
      section: 'bens',
      label: l('Acessórios e documentos entregues (opcional)', 'Accessories and documents (optional)'),
      placeholder: l('Ex.: carregador, capa, livrete e chave suplente', 'E.g. charger, case, logbook and spare key'),
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'condicoes',
      required: true,
      label: l('Finalidade', 'Purpose'),
      placeholder: l('Ex.: exercício das funções de Técnico Comercial', 'E.g. performing the duties of Sales Officer'),
      help: l('Completa a frase "Os bens destinam-se exclusivamente à seguinte finalidade: …"', 'Completes the sentence "The items are to be used only for: …"'),
      default: '',
    },
    {
      name: 'dataDevolucao',
      type: 'date',
      section: 'condicoes',
      width: 'half',
      label: l('Devolução prevista (opcional)', 'Expected return date (optional)'),
      help: l('Deixe vazio se os bens ficam até serem pedidos ou até ao fim do contrato.', 'Leave empty if the items are kept until requested or until the contract ends.'),
    },
    {
      name: 'usoPessoal',
      type: 'toggle',
      section: 'condicoes',
      default: false,
      label: l('Permitir uso pessoal razoável', 'Allow reasonable personal use'),
      help: l('Por exemplo, levar o telemóvel ou o computador para casa e usá-lo fora do horário.', 'For example, taking the phone or laptop home and using it after hours.'),
    },
    {
      name: 'descontoDanos',
      type: 'toggle',
      section: 'condicoes',
      default: false,
      label: l('Autorizar desconto no salário em caso de dano por culpa', 'Authorise pay deduction for damage caused by fault'),
      help: l(
        'Só para trabalhadores. A lei só permite descontos autorizados por escrito e dentro de limites; o valor é apurado e comunicado antes de qualquer desconto.',
        'Employees only. The law only allows deductions authorised in writing and within limits; the amount is assessed and notified before any deduction.',
      ),
      legal: l('Os descontos na remuneração exigem autorização escrita do trabalhador e têm um limite mensal.', 'Pay deductions require the employee’s written authorisation and have a monthly cap.'),
      showIf: isTrabalhador,
    },
    {
      name: 'seccaoDevolucao',
      type: 'toggle',
      section: 'condicoes',
      default: true,
      label: l('Incluir secção para registar a devolução', 'Include a section to record the return'),
    },
  ],

  computed: (v) => {
    const itens: Item[] = lineItems(v.itens)
      .filter((r) => str(r.descricao) || str(r.serie))
      .map((r) => ({
        descricao: str(r.descricao),
        serie: str(r.serie),
        estado: str(r.estado),
        quantidade: Math.max(1, Math.floor(num(r.quantidade) ?? 1)),
        valor: money(r.valor),
      }));
    const comValor = itens.some((i) => i.valor != null);
    return {
      itens,
      comValor,
      valorTotal: roundMoney(itens.reduce((t, i) => t + (i.valor ?? 0), 0)),
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!c.itens.length) w.push({ level: 'warning', field: 'itens', message: l('Indique pelo menos um bem entregue.', 'List at least one item.') });
    if ((c.itens as Item[]).some((i) => !i.serie)) {
      w.push({
        level: 'info',
        field: 'itens',
        message: l(
          'Indique o número de série ou a matrícula sempre que exista: identifica o bem sem margem para dúvidas.',
          'Give the serial or plate number whenever there is one: it identifies the item beyond doubt.',
        ),
      });
    }
    if (!str(v.trabalhadorNome)) w.push({ level: 'warning', field: 'trabalhadorNome', message: l('Indique quem recebe os bens.', 'Enter who receives the items.') });
    if (!str(v.trabalhadorDocNumero)) {
      w.push({ level: 'info', field: 'trabalhadorDocNumero', message: l('Falta o documento de identificação de quem recebe.', 'The recipient’s ID number is missing.') });
    }
    if (v.descontoDanos && isTrabalhador(v) && !c.comValor) {
      w.push({
        level: 'info',
        field: 'itens',
        message: l('Indique o valor dos bens para servir de referência em caso de perda ou dano.', 'Enter the items’ value as a reference in case of loss or damage.'),
      });
    }
    if (!str(v.finalidade)) w.push({ level: 'warning', field: 'finalidade', message: l('Indique a finalidade da entrega.', 'Enter the purpose of the handover.') });
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const r = rec(v);
    const trab = isTrabalhador(v);
    const itens = c.itens as Item[];
    const empresa = isEmpresa(v);
    const entF = !empresa && isF(v.entreganteGenero);

    // Parties
    const entregante = empresa
      ? [
          `**${str(v.entreganteNome) || BLANK}**`,
          str(v.entreganteDoc) ? `titular do NUIT ${str(v.entreganteDoc)}` : '',
          str(v.entreganteRepNome) ? `neste acto representada por ${str(v.entreganteRepNome)}${str(v.entreganteRepCargo) ? `, ${str(v.entreganteRepCargo)}` : ''}` : '',
        ]
          .filter(Boolean)
          .join(', ') + ', adiante designada por **Entregante**'
      : [`**${str(v.entreganteNome) || BLANK}**`, str(v.entreganteDoc) ? `${entF ? 'portadora' : 'portador'} do documento n.º ${str(v.entreganteDoc)}` : '']
          .filter(Boolean)
          .join(', ') + `, adiante ${entF ? 'designada' : 'designado'} por **Entregante**`;
    const doc = str(v.trabalhadorDocNumero)
      ? `${r.a('portador', 'portadora')} do ${str(v.trabalhadorDocTipo) || 'BI'} n.º ${str(v.trabalhadorDocNumero)}`
      : `${r.a('portador', 'portadora')} do documento de identificação n.º ${BLANK}`;
    const funcao = trab && str(v.trabalhadorCargo) ? `, ${lc(semPonto(v.trabalhadorCargo))}${str(v.trabalhadorDepartamento) ? ` (${semPonto(v.trabalhadorDepartamento)})` : ''}` : '';
    const recebedor = `**${str(v.trabalhadorNome) || BLANK}**, ${doc}${funcao}, adiante ${r.a('designado', 'designada')} por **Responsável**`;

    // Items table
    const columns = [
      { label: 'N.º', width: 0.45, align: 'center' as const },
      { label: 'Descrição', width: 2.8 },
      { label: 'N.º de série / matrícula', width: 1.9 },
      { label: 'Estado', width: 1.1 },
      { label: 'Qtd.', width: 0.6, align: 'center' as const },
      ...(c.comValor ? [{ label: 'Valor (MT)', width: 1.35, align: 'right' as const }] : []),
    ];
    const rows = itens.map((i, n) => [
      String(n + 1),
      i.descricao || BLANK,
      i.serie || '—',
      i.estado || '—',
      formatNumber(i.quantidade),
      ...(c.comValor ? [i.valor != null ? formatMoney(i.valor, false) : '—'] : []),
    ]);
    const blankRows = Array.from({ length: 3 }, () => ['', BLANK, '', '', '', ...(c.comValor ? [''] : [])]);

    const clauses: ClauseItem[] = [
      {
        id: 'utilizacao',
        heading: 'Utilização',
        text: `Os bens destinam-se exclusivamente à seguinte finalidade: ${lc(semPonto(v.finalidade)) || BLANK}${
          v.usoPessoal ? ', sendo permitido o seu uso pessoal em termos razoáveis' : ''
        }. ${r.O} obriga-se a não os ceder, emprestar ou alienar a terceiros, nem a alterar as suas características, sem autorização escrita do Entregante.`,
        en: `The items are to be used only for: ${v.finalidade || '—'}${v.usoPessoal ? ', with reasonable personal use allowed' : ''}. The holder may not lend, transfer or modify them without the owner’s written consent.`,
      },
      {
        id: 'conservacao',
        heading: 'Guarda e conservação',
        text: `${r.O} obriga-se a guardar e conservar os bens com a diligência de um bom pai de família, a utilizá-los de acordo com as respectivas instruções e a não os deixar sem vigilância em locais que facilitem o seu furto ou dano. O desgaste resultante da utilização normal não é da sua responsabilidade.`,
        en: 'The holder shall keep the items with the care of a diligent owner, use them according to the instructions and not leave them unattended where they may be stolen or damaged. Normal wear and tear is not the holder’s responsibility.',
      },
      {
        id: 'ocorrencias',
        heading: 'Perda, furto ou dano',
        text: `Em caso de perda, furto, roubo ou dano, ${r.o} comunica imediatamente o facto ao Entregante, por escrito, com a descrição das circunstâncias. Em caso de furto ou roubo, apresenta também participação à autoridade policial e entrega cópia ao Entregante.`,
        en: 'In case of loss, theft, robbery or damage, the holder notifies the owner immediately in writing, describing the circumstances. For theft or robbery, the holder reports it to the police and gives the owner a copy.',
      },
      {
        id: 'devolucao',
        heading: 'Devolução',
        text: `${r.O} devolve os bens, com os respectivos acessórios, no estado em que os recebeu, salvo o desgaste resultante da utilização normal, ${ouList(
          [
            v.dataDevolucao ? `até ${dateLong(v.dataDevolucao)}` : '',
            'sempre que o Entregante o solicite',
            trab ? 'na data da cessação do contrato de trabalho, qualquer que seja o motivo' : '',
          ].filter(Boolean),
        )}.`,
        en: `The holder returns the items and accessories in the condition received, save normal wear: ${[
          v.dataDevolucao ? `by ${v.dataDevolucao}` : '',
          'whenever the owner asks',
          trab ? 'on termination of employment, for whatever reason' : '',
        ]
          .filter(Boolean)
          .join('; ')}.`,
      },
    ];

    if (trab && v.descontoDanos) {
      clauses.push({
        id: 'responsabilidade',
        heading: 'Responsabilidade por danos',
        text: [
          `1. Se a perda ou o dano resultar de dolo ou negligência ${r.do}, ${r.a('este fica obrigado', 'esta fica obrigada')} a suportar o custo da reparação ou, não sendo possível, o valor do bem à data do facto, depois de apurada a responsabilidade e de lhe ser dada oportunidade de se pronunciar.`,
          `2. Para esse efeito, ${r.o} autoriza que o montante apurado e comunicado por escrito seja descontado na sua remuneração, nos termos e dentro dos limites ${doCite('descontosRemuneracao')}, em uma ou mais prestações mensais, podendo o remanescente ser pago por outro meio acordado.`,
        ].join('\n'),
        en: '1. If loss or damage results from the holder’s intent or negligence, the holder bears the repair cost or, if repair is impossible, the item’s value at the time, after liability is established and the holder has been heard. 2. The holder authorises the amount, once assessed and notified in writing, to be deducted from pay as provided and within the limits set by law, in one or more monthly instalments; any balance may be paid by other agreed means.',
      });
    } else {
      clauses.push({
        id: 'responsabilidade',
        heading: 'Responsabilidade por danos',
        text: `${r.O} responde pela perda ou pelo dano dos bens que resultem de dolo ou negligência sua, nos termos gerais de direito.`,
        en: 'The holder is liable for loss of or damage to the items caused by the holder’s intent or negligence, under the general law.',
      });
    }

    const entreganteSig: SignatureColumn = empresa
      ? { role: 'Entregou', name: str(v.entreganteRepNome) || undefined, detail: str(v.entreganteRepCargo) || str(v.entreganteNome) || undefined, image: 'both' }
      : { role: 'Entregou', name: str(v.entreganteNome) || undefined, image: 'signature' };
    const responsavelSig: SignatureColumn = {
      role: r.a('Recebi, o Responsável', 'Recebi, a Responsável'),
      name: str(v.trabalhadorNome) || undefined,
    };

    const blocks: Block[] = [
      { type: 'title', text: 'Termo de entrega e responsabilidade', subtitle: v.ref ? `N.º ${v.ref}` : undefined },
      {
        type: 'paragraph',
        id: 'partes',
        text: `Pelo presente termo, ${entregante}, entrega a ${recebedor}, os bens a seguir identificados, que ${r.a('este', 'esta')} declara receber em bom estado de conservação e funcionamento, salvo o que se indica na coluna «Estado»:`,
        en: 'By this document, the owner identified above hands over to the holder identified above, who confirms receiving them in good condition and working order (save as stated in the “Condition” column), the following items:',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns,
        rows: rows.length ? rows : blankRows,
        totals: c.comValor ? [['', 'Valor total', '', '', '', formatMoney(c.valorTotal, false)]] : undefined,
      },
    ];
    if (str(v.acessorios)) {
      blocks.push({
        type: 'paragraph',
        id: 'acessorios',
        text: `Acessórios e documentos entregues: ${semPonto(v.acessorios)}.`,
        en: `Accessories and documents handed over: ${v.acessorios}.`,
      });
    }
    blocks.push(
      { type: 'numberedClauses', style: 'numeric', items: clauses },
      {
        type: 'paragraph',
        id: 'exemplares',
        text: 'O presente termo é feito em dois exemplares, ficando um em poder de cada uma das partes.',
        en: 'This document is made in two counterparts, one for each party.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [entreganteSig, responsavelSig] },
    );

    if (v.seccaoDevolucao) {
      blocks.push(
        { type: 'heading', text: 'Devolução' },
        {
          type: 'paragraph',
          id: 'devolucaoRegisto',
          text: 'Data da devolução: ___/___/______\nEstado dos bens devolvidos: ________________________________________________\nObservações: _________________________________________________________',
          en: 'Return date, condition of the items returned and remarks (to be filled in on return).',
          align: 'left',
          keepWithNext: true,
        },
        {
          type: 'signatures',
          columns: [
            { role: 'Recebeu (pelo Entregante)' },
            { role: r.a('Devolveu, o Responsável', 'Devolveu, a Responsável'), name: str(v.trabalhadorNome) || undefined },
          ],
        },
      );
    }
    return blocks;
  },
});
