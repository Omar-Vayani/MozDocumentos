// Contrato de parceria pecuária ou de guarda de gado (pastoreio): the owner
// hands animals to a keeper either to raise them sharing the offspring and
// produce (parceria pecuária, Civil Code) or to keep them for a fee (guarda
// remunerada, a deposit). Inventory with marks, care, vaccination, proof of
// death or loss, counts, sale and return.

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, l, money } from './_shared';
import {
  assinatura, documentoFields, fecho, foroField, lines, numerar, papel, partesBlocks, partyFields, partyName, partyWarnings, semPonto, str,
  valorTexto,
} from './_contratos';
import { formaPagamentoFields, modoPagamento, prazo } from './_digital';

type Animal = { especie: string; quantidade: string; descricao: string; marca: string };
const animais = (v: Values): Animal[] =>
  lines(v.animais)
    .map((r) => ({ especie: str(r.especie), quantidade: str(r.quantidade), descricao: str(r.descricao), marca: str(r.marca) }))
    .filter((r) => r.especie);

const parceria = (v: Values) => v.modelo !== 'guarda';

export default defineTemplate({
  id: 'contrato-parceria-pecuaria',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Modelo, local e data', 'Model, place and date') },
    { id: 'proprietario', title: l('Dono dos animais', 'Owner'), personRole: 'outro' },
    { id: 'criador', title: l('Criador ou pastor', 'Keeper'), personRole: 'outro' },
    { id: 'animais', title: l('Animais', 'Animals') },
    { id: 'condicoes', title: l('Condições', 'Terms') },
    { id: 'clausulas', title: l('Testemunhas e assinaturas', 'Witnesses and signatures') },
  ],
  fields: [
    {
      name: 'modelo',
      type: 'radio',
      section: 'documento',
      label: l('Modelo', 'Model'),
      options: [
        { value: 'parceria', label: l('Parceria: o criador fica com parte das crias e dos produtos', 'Partnership: keeper shares offspring and produce') },
        { value: 'guarda', label: l('Guarda remunerada: o pastor recebe um pagamento', 'Paid keeping: herder receives a fee') },
      ],
      default: 'parceria',
    },
    ...documentoFields(),
    ...partyFields('proprietario', { fromProfile: true }),
    ...partyFields('criador'),

    {
      name: 'animais',
      type: 'lines',
      section: 'animais',
      label: l('Animais entregues', 'Animals handed over'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'especie', type: 'text', label: l('Espécie', 'Species') },
        { name: 'quantidade', type: 'text', label: l('Quantidade', 'Number') },
        { name: 'descricao', type: 'text', label: l('Sexo, idade, cor', 'Sex, age, colour') },
        { name: 'marca', type: 'text', label: l('Marca ou sinal', 'Brand or mark') },
      ],
      default: [{ especie: 'Bovinos', quantidade: '', descricao: '', marca: '' }],
    },
    { name: 'valorEstimado', type: 'money', section: 'animais', width: 'half', label: l('Valor estimado do efectivo (opcional)', 'Estimated value (optional)') },
    { name: 'localPasto', type: 'text', section: 'animais', label: l('Local de pasto e curral', 'Grazing area and kraal'), placeholder: l('Ex.: curral do criador em Chicualacuala-sede; pastagens comunitárias', 'E.g. keeper’s kraal; communal grazing') },

    { name: 'pctCrias', type: 'number', section: 'condicoes', width: 'half', min: 0, max: 100, default: 50, label: l('Parte das crias para o criador (%)', 'Keeper’s share of offspring (%)'), showIf: parceria },
    { name: 'leite', type: 'select', section: 'condicoes', width: 'half', label: l('Leite e estrume', 'Milk and manure'), options: [{ value: 'criador', label: l('Ficam para o criador', 'Go to the keeper') }, { value: 'divididos', label: l('Divididos na mesma proporção', 'Shared in the same proportion') }], default: 'criador', showIf: parceria },
    { name: 'remuneracao', type: 'money', section: 'condicoes', width: 'half', label: l('Pagamento mensal ao pastor', 'Monthly payment to herder'), showIf: (v) => !parceria(v) },
    ...formaPagamentoFields('condicoes').map((f) => ({ ...f, showIf: (v: Values) => !parceria(v) })),
    { name: 'sanidade', type: 'select', section: 'condicoes', width: 'half', label: l('Vacinas, banhos e medicamentos pagos por', 'Vaccines, dips and medicines paid by'), options: [{ value: 'proprietario', label: l('Dono', 'Owner') }, { value: 'criador', label: l('Criador', 'Keeper') }, { value: 'ambos', label: l('Ambos, em partes iguais', 'Both, equally') }], default: 'proprietario' },
    { name: 'avisoHoras', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 168, default: 24, label: l('Aviso de doença, morte ou perda (horas)', 'Notice of illness, death or loss (hours)') },
    { name: 'contagem', type: 'select', section: 'condicoes', width: 'half', label: l('Contagem conjunta', 'Joint count'), options: [{ value: 'mensal', label: l('Mensal', 'Monthly') }, { value: 'trimestral', label: l('Trimestral', 'Quarterly') }, { value: 'semestral', label: l('Semestral', 'Half-yearly') }], default: 'trimestral' },
    { name: 'duracaoAnos', type: 'number', section: 'condicoes', width: 'half', min: 1, max: 20, default: 3, label: l('Duração (anos)', 'Term (years)') },

    { name: 'testemunhas', type: 'toggle', section: 'clausulas', default: true, label: l('Assinatura de duas testemunhas', 'Two witnesses sign') },
    { name: 'visto', type: 'toggle', section: 'clausulas', default: true, label: l('Espaço para o visto do líder comunitário', 'Space for the community leader’s endorsement') },
    foroField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'proprietario', 'dono', 'owner'), ...partyWarnings(v, 'criador', 'criador', 'keeper')];
    if (!animais(v).some((a) => a.quantidade)) w.push({ level: 'error', field: 'animais', message: l('Indique os animais e o número de cada espécie, com as marcas.', 'List the animals, numbers and marks.') });
    w.push({ level: 'info', message: l(`${parceria(v) ? `Na parceria pecuária, a perda dos animais sem culpa do criador corre pelo dono (${cite('turParceriaPecuaria')}).` : `Quem guarda animais mediante pagamento responde pela sua perda por falta de cuidado (${cite('turDepositoGado')}).`} A movimentação de gado exige guia de trânsito dos serviços de veterinária (${cite('turTransitoGado')}).`, 'Loss without the keeper’s fault falls on the owner (partnership) / a paid keeper answers for loss through lack of care. Moving cattle requires a veterinary permit.') });
    return w;
  },

  personName: (v) => partyName(v, 'criador') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const par = parceria(v);
    const D = papel(v, 'proprietario', 'Proprietário', 'Proprietária');
    const C = par ? papel(v, 'criador', 'Parceiro Criador', 'Parceira Criadora') : papel(v, 'criador', 'Pastor', 'Pastora');
    const an = animais(v);
    const pct = Number(v.pctCrias);
    const temPct = Number.isFinite(pct) && v.pctCrias !== '' && v.pctCrias != null;
    const sanidade = v.sanidade === 'criador' ? `${C.pelo}` : v.sanidade === 'ambos' ? 'pelas duas partes, em partes iguais' : `${D.pelo}`;

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        par
          ? `Pelo presente contrato, ${D.o} entrega ${C.ao} os animais descritos no quadro seguinte, para que ${C.f ? 'esta' : 'este'} os crie, apascente e vigie, repartindo entre si as crias e os produtos, nos termos das cláusulas seguintes.`
          : `Pelo presente contrato, ${D.o} entrega ${C.ao} os animais descritos no quadro seguinte, para que ${C.f ? 'esta' : 'este'} os guarde e apascente, mediante pagamento, restituindo-os com as crias que nascerem.`,
        `Os animais são mantidos em ${semPonto(v.localPasto) || BLANK}${money(v.valorEstimado) != null ? ` e têm o valor estimado de ${valorTexto(money(v.valorEstimado))}` : ''}. ${D.O} continua a ser ${D.f ? "dona" : "dono"} dos animais entregues.`,
      ]),
      en: par ? 'The owner hands the listed animals to the keeper to raise, sharing offspring and produce.' : 'The owner hands the listed animals to the herder to keep for a fee, to be returned with any offspring.',
    });
    cl.push({
      id: 'cuidados',
      heading: `Obrigações ${C.de}`,
      text: `${C.O} obriga-se a:`,
      items: [
        'tratar os animais com o cuidado de um bom criador, garantindo-lhes pasto, água e abrigo;',
        'mantê-los marcados e separados dos animais de outros donos, ou facilmente identificáveis;',
        `cumprir as vacinações e os banhos carracicidas obrigatórios, cujos custos são suportados ${sanidade};`,
        `avisar ${D.o}, no prazo de ${prazo(v.avisoHoras, 'hora')}, de qualquer doença, ferimento, morte, roubo ou desaparecimento, apresentando, em caso de morte, a pele ou as orelhas com a marca, ou declaração do serviço de veterinária ou da autoridade local;`,
        `não vender, abater, emprestar ou trocar qualquer animal sem autorização escrita ${D.de}, nem o deslocar para fora da zona acordada sem a respectiva guia de trânsito.`,
      ],
      en: 'Care as a good stockman; keep animals marked and identifiable; compulsory vaccination and dipping (costs as stated); report illness, death, theft or loss within the stated hours with proof; no sale, slaughter, loan or movement without written consent and permit.',
    });
    cl.push(
      par
        ? {
            id: 'reparticao',
            heading: 'Repartição',
            text: numerar([
              `As crias nascidas durante o contrato são repartidas na proporção de ${temPct ? `${pct}%` : `${BLANK}%`} para ${C.o} e ${temPct ? `${Math.max(0, 100 - pct)}%` : `${BLANK}%`} para ${D.o}, fazendo-se a repartição após o desmame, por sorteio ou por acordo quanto à escolha dos animais.`,
              v.leite === 'divididos' ? 'O leite e o estrume são divididos na mesma proporção.' : `O leite e o estrume ficam para ${C.o}, como compensação do seu trabalho.`,
              `A perda dos animais por causa não imputável ${C.ao} corre por conta ${D.de}; se resultar de falta de cuidado ${C.de}, ${C.f ? 'esta' : 'este'} indemniza ${D.o} pelo valor dos animais perdidos.`,
            ]),
            en: `Offspring shared ${temPct ? `${pct}% keeper / ${100 - pct}% owner` : 'as stated'} after weaning; milk and manure as stated. Loss not due to the keeper falls on the owner; loss through lack of care is compensated by the keeper.`,
          }
        : {
            id: 'remuneracao',
            heading: 'Remuneração',
            text: numerar([
              `${D.O} paga ${C.ao} ${valorTexto(money(v.remuneracao))} por mês, até ao dia cinco do mês seguinte, ${modoPagamento(v, C)}.`,
              `As crias, o leite e os demais produtos pertencem ${D.ao}, salvo o leite para consumo da família ${C.de}, se ${D.o} o autorizar.`,
              `${C.O} responde pela perda ou pelo dano dos animais que resultem de falta de cuidado.`,
            ]),
            en: 'Monthly fee to the herder; offspring and produce belong to the owner; the herder answers for loss through lack of care.',
          },
    );
    cl.push({
      id: 'contagem',
      heading: 'Contagem',
      text: `As partes fazem uma contagem conjunta dos animais com periodicidade ${str(v.contagem) || 'trimestral'}, registando os nascimentos, as mortes e as faltas numa folha assinada por ambas, que faz parte deste contrato.`,
      en: 'Joint headcount at the stated interval, recording births, deaths and losses on a signed sheet.',
    });
    cl.push({
      id: 'duracao',
      heading: 'Duração e fim',
      text: numerar([
        `O contrato dura ${prazo(v.duracaoAnos, 'ano')}, podendo ser renovado por acordo. Qualquer das partes pode pôr-lhe fim antes do prazo, com aviso de três meses, ou de imediato em caso de incumprimento grave da outra.`,
        `No fim do contrato, ${C.o} restitui ${D.ao} os animais entregues e a parte das crias que lhe pertença${par ? ', fazendo-se a última repartição' : ''}, mediante contagem conjunta na presença de testemunhas.`,
      ]),
      en: 'Term as stated, renewable; early end on three months’ notice or immediately for serious breach. At the end, animals and the owner’s share of offspring are returned after a joint count before witnesses.',
    });
    cl.push({
      id: 'conflitos',
      heading: 'Resolução de conflitos',
      text: `As partes resolvem os desentendimentos por acordo, com a mediação das autoridades comunitárias se necessário, e, não sendo possível, no ${semPonto(v.foro) || 'tribunal competente'}. Na falta de cláusula própria, seguem-se os usos da terra.`,
      en: 'Disputes by agreement or community mediation, otherwise the court stated; local custom fills gaps.',
    });

    const quadro: Block = an.length
      ? {
          type: 'table',
          grid: true,
          columns: [
            { label: 'Espécie', width: 1.4 },
            { label: 'Quantidade', width: 1, align: 'right' },
            { label: 'Sexo, idade, cor', width: 2.4 },
            { label: 'Marca ou sinal', width: 1.8 },
          ],
          rows: an.map((a) => [a.especie, a.quantidade || BLANK, a.descricao || ' ', a.marca || ' ']),
        }
      : { type: 'box', label: 'Animais entregues (espécie, número, sexo, idade, marca)', lines: 5 };

    const blocks: Block[] = [
      { type: 'title', text: par ? 'Contrato de parceria pecuária' : 'Contrato de guarda de gado', subtitle: par ? 'Criação de gado com repartição das crias' : 'Pastoreio remunerado' },
      ...partesBlocks(v, [
        { p: 'proprietario', role: D, en: 'Owner' },
        { p: 'criador', role: C, en: 'Keeper' },
      ]),
      { type: 'paragraph', id: 'celebracao', text: 'É celebrado o presente contrato, que se rege pelas cláusulas seguintes e, no que nelas for omisso, pela lei e pelos usos da terra:', en: 'This contract is made on the following terms and, where silent, the law and local custom:' },
      { type: 'numberedClauses', style: 'clausula', items: cl.slice(0, 1) },
      quadro,
      { type: 'numberedClauses', style: 'clausula', items: cl.slice(1), start: 2 },
      ...fecho(ctx, [assinatura(ctx, 'proprietario', D, true), assinatura(ctx, 'criador', C)]),
    ];
    if (v.visto) blocks.push({ type: 'box', label: 'Visto da autoridade comunitária (nome, cargo, assinatura e carimbo)', lines: 2, dashed: true });
    return blocks;
  },
});
