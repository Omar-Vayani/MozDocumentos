// Declaração de consentimento do cônjuge: one spouse gives the express,
// act-specific consent the Family Law requires for the other to sell, mortgage
// or lease long-term real estate or a business. Presented to a notary, registry
// or bank, so it leaves a box for the notarial certification.

import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, localField, money, placeDate } from './_shared';
import { moneyExt, nExt } from './_contrato-trabalho';
import { identificacao, lowerFirst, notaryBox, pessoaFields, RECONHECIMENTO_FIELD, str } from './_pessoal-rh';

const REGIMES: Record<string, string> = {
  adquiridos: 'comunhão de bens adquiridos',
  geral: 'comunhão geral de bens',
  separacao: 'separação de bens',
};

function actoTexto(v: Values, arrAnos: number): string {
  switch (v.acto) {
    case 'hipoteca':
      return `hipoteque ou, por qualquer outra forma, onere`;
    case 'arrendamento':
      return `dê de arrendamento, por prazo superior a ${nExt(arrAnos)} anos,`;
    case 'doacao':
      return 'doe';
    case 'outro':
      return lowerFirst(str(v.actoOutro)) || BLANK;
    default:
      return 'venda';
  }
}

export default defineTemplate({
  id: 'consentimento-conjuge',
  family: 'declaracao',
  official: 'notario',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'conjuge', title: l('Cônjuge que dá o consentimento', 'Spouse giving consent'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'outro', title: l('Cônjuge que pratica o acto', 'Spouse carrying out the act'), personRole: 'outro' },
    { id: 'casamento', title: l('Casamento', 'Marriage') },
    { id: 'acto', title: l('Acto e bem', 'Act and asset') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da declaração', 'Date of the declaration')),
    ...pessoaFields('conjuge', 'conjuge', { profile: true }),
    ...pessoaFields('outro', 'outro', { keys: ['nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal'] }).map((f) =>
      f.name === 'outroGenero' ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'M' : 'F') } : f,
    ),
    {
      name: 'regimeBens',
      type: 'select',
      section: 'casamento',
      width: 'half',
      required: true,
      label: l('Regime de bens', 'Property regime'),
      default: 'adquiridos',
      options: [
        { value: 'adquiridos', label: l('Comunhão de adquiridos', 'Community of acquired property') },
        { value: 'geral', label: l('Comunhão geral', 'Full community of property') },
        { value: 'separacao', label: l('Separação de bens', 'Separate property') },
      ],
      help: l('Consta da certidão de casamento.', 'Shown on the marriage certificate.'),
    },
    { name: 'casamentoData', type: 'date', section: 'casamento', width: 'half', label: l('Data do casamento (opcional)', 'Marriage date (optional)') },
    { name: 'casamentoConservatoria', type: 'text', section: 'casamento', width: 'half', label: l('Conservatória (opcional)', 'Registry (optional)'), placeholder: l('Ex.: 1.ª Conservatória do Registo Civil de Maputo', 'E.g. civil registry') },
    { name: 'casamentoAssento', type: 'text', section: 'casamento', width: 'half', label: l('Assento n.º (opcional)', 'Entry no. (optional)') },
    {
      name: 'acto',
      type: 'select',
      section: 'acto',
      required: true,
      label: l('Acto que autoriza', 'Act being authorised'),
      default: 'venda',
      options: [
        { value: 'venda', label: l('Venda', 'Sale') },
        { value: 'hipoteca', label: l('Hipoteca ou outra garantia (crédito)', 'Mortgage or other security (loan)') },
        { value: 'arrendamento', label: l('Arrendamento de longa duração', 'Long-term lease') },
        { value: 'doacao', label: l('Doação', 'Gift') },
        { value: 'outro', label: l('Outro', 'Other') },
      ],
    },
    { name: 'actoOutro', type: 'text', section: 'acto', label: l('Descreva o acto', 'Describe the act'), showIf: (v) => v.acto === 'outro', placeholder: l('Ex.: trespasse o estabelecimento comercial', 'E.g. transfer the business') },
    {
      name: 'bem',
      type: 'textarea',
      section: 'acto',
      rows: 3,
      required: true,
      label: l('Bem', 'Asset'),
      placeholder: l(
        'Ex.: prédio urbano sito no Bairro da Liberdade, Matola, descrito na Conservatória do Registo Predial da Matola sob o n.º 12345, com o DUAT n.º …',
        'E.g. urban property at …, registered at the Land Registry under no. …',
      ),
      help: l('Identifique o bem com a morada e o número de registo ou de DUAT. O consentimento vale só para este bem.', 'Identify the asset with address and registration or land-use title number. Consent covers only this asset.'),
    },
    { name: 'contraparte', type: 'text', section: 'acto', width: 'half', label: l('A favor de (opcional)', 'In favour of (optional)'), placeholder: l('Ex.: Banco Comercial e de Investimentos, S.A.', 'E.g. buyer or bank') },
    { name: 'valor', type: 'money', section: 'acto', width: 'half', label: l('Preço ou montante (opcional)', 'Price or amount (optional)') },
    { name: 'finalidade', type: 'text', section: 'acto', label: l('Entidade a quem se destina (opcional)', 'Receiving body (optional)'), placeholder: l('Ex.: Cartório Notarial de Maputo', 'E.g. notary office') },
    RECONHECIMENTO_FIELD('opcoes'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `O consentimento tem de ser expresso e específico para cada acto (${cite('consentimentoConjuge')}). Notários e bancos exigem, em regra, a assinatura reconhecida presencialmente. Confirme se o notário aceita este documento ou se exige a presença do cônjuge na escritura.`,
          'Consent must be express and specific to each act. Notaries and banks usually require the signature certified in person. Check whether the notary accepts this document or needs the spouse at the deed.',
        ),
      },
    ];
    if (v.regimeBens === 'separacao') {
      w.push({
        level: 'info',
        field: 'regimeBens',
        message: l('No regime de separação de bens a lei não exige este consentimento, mas a entidade pode pedi-lo.', 'Under separate property the law does not require this consent, but the institution may ask for it.'),
      });
    }
    if (!str(v.bem)) w.push({ level: 'error', field: 'bem', message: l('Identifique o bem. Um consentimento genérico não é válido.', 'Identify the asset. Blanket consent is not valid.') });
    if (!str(v.conjugeDocNumero)) w.push({ level: 'warning', field: 'conjugeDocNumero', message: l('Falta o número do documento de identificação.', 'The ID number is missing.') });
    if (!str(v.outroNome)) w.push({ level: 'warning', field: 'outroNome', message: l('Indique o outro cônjuge.', 'Enter the other spouse.') });
    return w;
  },

  personName: (v) => v.conjugeNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const arr = ctx.legal.value<{ arrendamentoAnos: number }>('consentimentoConjuge').arrendamentoAnos;
    const fC = isF(v.conjugeGenero);
    const casamento = [
      v.casamentoData ? `celebrado em ${dateLong(v.casamentoData)}` : '',
      str(v.casamentoConservatoria) ? `registado na ${str(v.casamentoConservatoria).replace(/^(a|na)\s/i, '')}` : '',
      str(v.casamentoAssento) ? `sob o assento n.º ${str(v.casamentoAssento)}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const regime = REGIMES[v.regimeBens] ?? REGIMES.adquiridos;
    const contraparte = str(v.contraparte);
    const valor = money(v.valor);
    const extra =
      v.acto === 'hipoteca'
        ? `${contraparte ? `, a favor de ${contraparte}` : ''}${valor != null ? `, para garantia de um montante até ${moneyExt(v.valor)}` : ''}`
        : `${contraparte ? `, a favor de ${contraparte}` : ''}${valor != null ? `, ${v.acto === 'arrendamento' ? 'pela renda' : 'pelo preço'} de ${moneyExt(v.valor)}` : ''}`;

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Consentimento do Cônjuge' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${identificacao(v, 'conjuge', { estadoCivil: false })}, ${fC ? 'casada' : 'casado'} com ${identificacao(v, 'outro', { morada: false, estadoCivil: false })}, no regime de ${regime}${casamento ? `, por casamento ${casamento}` : ''}, **declara que dá o seu expresso consentimento** a que o seu cônjuge ${actoTexto(v, arr)} o seguinte bem: ${str(v.bem).replace(/[.;,\s]+$/, '') || BLANK}${extra}.`,
        en: `The spouse identified above, married to the person named, gives express consent for the other spouse to ${v.acto === 'hipoteca' ? 'mortgage' : v.acto === 'arrendamento' ? 'lease long-term' : v.acto === 'doacao' ? 'give away' : 'sell'} the asset described.`,
      },
      {
        type: 'paragraph',
        id: 'especial',
        text: `O presente consentimento é dado nos termos da ${cite('consentimentoConjuge')}, apenas para o acto e o bem acima identificados, e não vale para quaisquer outros.`,
        en: 'This consent is given under the Family Law, only for the act and asset identified, and for no other.',
      },
      {
        type: 'paragraph',
        id: 'poderes',
        text: `${fC ? 'A declarante' : 'O declarante'} autoriza ainda o seu cônjuge a assinar, sem necessidade de nova intervenção sua, todos os documentos necessários à realização do referido acto${str(v.finalidade) ? `, designadamente perante ${str(v.finalidade)}` : ''}.`,
        en: 'The declarant also authorises the other spouse to sign all documents needed to complete that act.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade, ${fC ? 'a declarante' : 'o declarante'} assina a presente declaração.`,
        en: 'In witness whereof, the declarant signs this declaration.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          {
            role: fC ? 'A Declarante' : 'O Declarante',
            name: str(v.conjugeNome) || undefined,
            detail: str(v.conjugeDocNumero) ? `${str(v.conjugeDocTipo) || 'BI'} n.º ${str(v.conjugeDocNumero)}` : undefined,
          },
        ],
      },
    ];
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
