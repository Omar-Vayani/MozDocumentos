// Termo de fiança: a guarantor undertakes to answer for a debtor's obligations
// under a lease, loan or instalment sale. The creditor signs to accept it; the
// guarantor's spouse may need to consent; signature certification is advised.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateLong, formatMoney, l, money } from './_shared';
import { conjugeColumn, consentimentoTexto, documentoFields, identificacao, isEmpresa, papel, partyName, partyWarnings, valorTexto } from './_contratos';
import { identCurta, partyFieldsWhen, semPonto, str } from './_familia';

const TIPOS: Record<string, { pt: string; credor: [string, string]; devedor: [string, string] }> = {
  arrendamento: { pt: 'contrato de arrendamento', credor: ['senhorio', 'senhoria'], devedor: ['inquilino', 'inquilina'] },
  mutuo: { pt: 'contrato de mútuo (empréstimo)', credor: ['mutuante', 'mutuante'], devedor: ['mutuário', 'mutuária'] },
  prestacoes: { pt: 'contrato de compra e venda a prestações', credor: ['vendedor', 'vendedora'], devedor: ['comprador', 'compradora'] },
  servicos: { pt: 'contrato de prestação de serviços', credor: ['prestador', 'prestadora'], devedor: ['cliente', 'cliente'] },
  outro: { pt: 'contrato', credor: ['credor', 'credora'], devedor: ['devedor', 'devedora'] },
};

export default defineTemplate({
  id: 'termo-de-fianca',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'fiador', title: l('Fiador (quem garante)', 'Guarantor'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'devedor', title: l('Devedor (quem é garantido)', 'Debtor (person guaranteed)'), personRole: 'cliente' },
    { id: 'credor', title: l('Credor (a quem se garante)', 'Creditor'), personRole: 'outro' },
    { id: 'obrigacao', title: l('Contrato garantido', 'Contract guaranteed') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFieldsWhen('fiador', ['pessoa'], { conjuge: true }),
    ...partyFieldsWhen('devedor', []),
    ...partyFieldsWhen('credor', ['empresa']),
    {
      name: 'tipo',
      type: 'select',
      section: 'obrigacao',
      required: true,
      label: l('Tipo de contrato', 'Kind of contract'),
      options: [
        { value: 'arrendamento', label: l('Arrendamento (renda)', 'Lease (rent)') },
        { value: 'mutuo', label: l('Empréstimo de dinheiro (mútuo)', 'Money loan') },
        { value: 'prestacoes', label: l('Compra a prestações', 'Instalment purchase') },
        { value: 'servicos', label: l('Prestação de serviços', 'Services') },
        { value: 'outro', label: l('Outro', 'Other') },
      ],
      default: 'arrendamento',
    },
    { name: 'contratoData', type: 'date', section: 'obrigacao', width: 'half', label: l('Data do contrato', 'Date of the contract') },
    { name: 'contratoObjecto', type: 'text', section: 'obrigacao', label: l('Objecto do contrato', 'Subject of the contract'), placeholder: l('Ex.: arrendamento da flat 8 do prédio n.º 2210 da Av. Vladimir Lenine, Maputo, com a renda mensal de 28.000,00 MT', 'E.g. lease of flat 8 at …, monthly rent 28,000 MT') },
    { name: 'limite', type: 'money', section: 'obrigacao', width: 'half', label: l('Valor máximo garantido (opcional)', 'Maximum amount guaranteed (optional)'), help: l('Deixe vazio para garantir todas as obrigações do contrato.', 'Leave empty to guarantee all obligations.') },
    {
      name: 'duracao',
      type: 'radio',
      section: 'obrigacao',
      label: l('A fiança dura', 'The guarantee lasts'),
      options: [
        { value: 'contrato', label: l('Enquanto durar o contrato e as renovações', 'For the contract and its renewals') },
        { value: 'semRenovacoes', label: l('Só o prazo inicial do contrato', 'Only the initial term') },
        { value: 'data', label: l('Até uma data', 'Until a date') },
      ],
      default: 'contrato',
    },
    { name: 'duracaoData', type: 'date', section: 'obrigacao', width: 'half', label: l('Até', 'Until'), showIf: (v) => v.duracao === 'data' },
    {
      name: 'principalPagador',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Principal pagador (renuncia ao benefício da excussão)', 'Principal payer (waives prior enforcement)'),
      help: l('O credor pode cobrar logo ao fiador, sem ter de tentar primeiro cobrar ao devedor. É o habitual nos arrendamentos e empréstimos.', 'The creditor may claim from the guarantor directly, without first pursuing the debtor. Usual in leases and loans.'),
    },
    { name: 'reconhecimento', type: 'toggle', section: 'opcoes', default: true, label: l('Espaço para reconhecimento notarial da assinatura', 'Space for notarial certification of the signature') },
  ],

  warnings: (v) => {
    const w: Warning[] = [
      ...partyWarnings(v, 'fiador', 'fiador', 'guarantor', { conjuge: true }),
      ...partyWarnings(v, 'devedor', 'devedor', 'debtor'),
      ...partyWarnings(v, 'credor', 'credor', 'creditor'),
    ];
    w.push({
      level: 'info',
      message: l(
        `A fiança deve ser declarada expressamente e com a forma exigida para o contrato garantido (${cite('famFianca')}). Se o contrato principal tiver assinaturas reconhecidas no notário (como o mútuo), reconheça também a assinatura do fiador.`,
        'The guarantee must be express and in the form required for the main contract. If the main contract needed notarised signatures (e.g. a loan), have the guarantor’s signature notarised too.',
      ),
    });
    return w;
  },

  personName: (v) => partyName(v, 'fiador') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPOS[v.tipo] ?? TIPOS.outro;
    const F = papel(v, 'fiador', 'Fiador', 'Fiadora');
    const C = papel(v, 'credor', t.credor[0].charAt(0).toUpperCase() + t.credor[0].slice(1), t.credor[1].charAt(0).toUpperCase() + t.credor[1].slice(1));
    const D = papel(v, 'devedor', t.devedor[0], t.devedor[1]);
    const limite = money(v.limite);
    const objecto = semPonto(v.contratoObjecto);
    const contrato = `${t.pt}${str(v.contratoData) ? ` celebrado em ${dateLong(v.contratoData)}` : ''}${objecto ? `, relativo a ${objecto.replace(/^(o|a)\s+/i, '')}` : ''}`;
    const duracao =
      v.duracao === 'data'
        ? `até ${dateLong(v.duracaoData)}`
        : v.duracao === 'semRenovacoes'
          ? 'durante o prazo inicial do contrato, não abrangendo as suas renovações'
          : 'durante toda a vigência do contrato, incluindo as suas renovações, e até ao integral cumprimento das obrigações dele emergentes';
    const fiador = F.f ? 'fiadora' : 'fiador';
    const pagador = F.f ? 'principal pagadora' : 'principal pagador';

    const blocks: Block[] = [
      { type: 'title', text: 'Termo de fiança' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${identificacao(v, 'fiador')}, declara que se constitui ${fiador}${v.principalPagador ? ` e ${pagador}` : ''} de ${identCurta(v, 'devedor')}, na qualidade de ${D.n}, por todas as obrigações por ${D.f || isEmpresa(v, 'devedor') ? 'esta' : 'este'} assumidas perante ${identificacao(v, 'credor')}, na qualidade de ${C.n.toLowerCase()}, no âmbito do ${contrato}.`,
        en: 'The guarantor named above declares that they guarantee all obligations of the debtor towards the creditor under the contract described.',
      },
      {
        type: 'paragraph',
        id: 'ambito',
        text: `A fiança abrange ${v.tipo === 'arrendamento' ? 'as rendas, os encargos, as indemnizações por danos no imóvel e as demais quantias devidas' : 'o capital, os juros, as indemnizações e as demais quantias devidas'}${limite != null ? `, até ao montante máximo de ${valorTexto(limite)}` : ''}, e vigora ${duracao}.`,
        en: `The guarantee covers ${v.tipo === 'arrendamento' ? 'rent, charges, damage and other sums due' : 'capital, interest, damages and other sums due'}${limite != null ? `, up to ${formatMoney(limite)}` : ''}.`,
      },
    ];
    if (v.principalPagador) {
      blocks.push({
        type: 'paragraph',
        id: 'excussao',
        text: `${F.O} renuncia ao benefício da excussão prévia, podendo ${C.o} exigir-lhe directamente o cumprimento, sem necessidade de executar primeiro os bens ${D.de}.`,
        en: 'The guarantor waives the benefit of prior enforcement: the creditor may claim directly without first pursuing the debtor’s assets.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'conhecimento',
      text: `${F.O} declara conhecer o contrato garantido, de que recebeu cópia, e que presta a presente fiança de livre vontade.`,
      en: 'The guarantor declares they know the contract, have a copy, and give this guarantee freely.',
      keepWithNext: true,
    });

    blocks.push({
      type: 'signatures',
      keepWithNext: true,
      placeDate: `${ctx.place}, ${dateLong(v.data)}`,
      columns: [{ role: F.O, name: partyName(v, 'fiador') || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined }],
    });
    const conj = conjugeColumn(v, 'fiador');
    if (conj) {
      blocks.push({ type: 'paragraph', id: 'consentimento', text: consentimentoTexto(v, 'fiador', F) ?? '', en: 'The guarantor’s spouse consents.', keepWithNext: true }, { type: 'signatures', columns: [conj], keepWithNext: true });
    }
    blocks.push(
      { type: 'paragraph', id: 'aceitacao', text: `${C.O} aceita a presente fiança.`, en: 'The creditor accepts this guarantee.', keepWithNext: true },
      {
        type: 'signatures',
        columns: [
          isEmpresa(v, 'credor')
            ? { role: C.O, name: str(v.credorRepNome) || undefined, detail: [str(v.credorRepCargo), str(v.credorEmpresaNome)].filter(Boolean).join(', ') || undefined, image: ctx.profile?.kind === 'empresa' ? 'both' : undefined }
            : { role: C.O, name: partyName(v, 'credor') || undefined },
        ],
      },
    );
    if (v.reconhecimento) {
      blocks.push({ type: 'box', label: 'Reconhecimento notarial da assinatura', text: `Reconhecimento presencial da assinatura ${F.de}${conj ? ' e do cônjuge' : ''}.`, lines: 3, dashed: true });
    }
    return blocks;
  },
});
