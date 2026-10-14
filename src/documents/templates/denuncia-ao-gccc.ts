import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, money, moneyText, placeDate, splitLines } from './_shared';
import {
  TRATAMENTO_OPTIONS,
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  cleanEntidade,
  endDot,
  lowerFirst,
  opt,
  pessoaDesc,
  reciboBlock,
  reciboField,
  str,
} from './_cidadao';

const CRIMES = [
  opt('corrupção passiva', 'Pedido ou recebimento de suborno (corrupção passiva)', 'Asking for or taking a bribe'),
  opt('corrupção activa', 'Oferta de suborno (corrupção activa)', 'Offering a bribe'),
  opt('peculato', 'Desvio de dinheiro ou bens públicos (peculato)', 'Embezzlement of public funds'),
  opt('concussão', 'Cobrança de valores indevidos (concussão)', 'Charging undue amounts (extortion)'),
  opt('abuso de cargo ou função', 'Abuso de cargo ou função', 'Abuse of office'),
  opt('participação económica em negócio', 'Favorecimento em contratos públicos (participação económica em negócio)', 'Favouritism in public contracts'),
  opt('tráfico de influências', 'Tráfico de influências', 'Influence peddling'),
  opt('enriquecimento ilícito', 'Enriquecimento ilícito', 'Illicit enrichment'),
  opt('outro', 'Outro / não sei', 'Other / not sure'),
];

const anonima = (v: Values) => v.anonima === true;

export default defineTemplate({
  id: 'denuncia-ao-gccc',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('Para onde envia', 'Where to send it') },
    { id: 'autor', title: l('Denunciante', 'Whistleblower'), personRole: 'outro' },
    { id: 'denunciado', title: l('Quem é denunciado', 'Person reported') },
    { id: 'factos', title: l('Factos', 'Facts') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 4), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Destinatário', 'Addressee'),
      help: l(
        'Gabinete Central de Combate à Corrupção (Maputo), o Gabinete Provincial de Combate à Corrupção da sua província, ou a Procuradoria da República do distrito ou da província. Também pode denunciar pessoalmente ou pelas linhas de denúncia.',
        'The Central Office for Combating Corruption, the provincial office, or the district or provincial Public Prosecutor. You may also report in person or by hotline.',
      ),
      default: 'Director do Gabinete Central de Combate à Corrupção',
    },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade', 'City'), default: 'Maputo' },
    {
      name: 'anonima',
      type: 'toggle',
      section: 'autor',
      label: l('Denúncia anónima', 'Anonymous report'),
      help: l('A denúncia pode ser anónima, mas sem contacto os investigadores não podem pedir mais informação. Pode identificar-se e pedir reserva de identidade.', 'A report may be anonymous, but investigators cannot then ask for more. You may identify yourself and ask for confidentiality.'),
      default: false,
    },
    ...autorFields(['nome', 'genero', 'nacionalidade', 'profissao', 'docTipo', 'docNumero', 'morada', 'telefone', 'email']).map((f) => ({ ...f, showIf: (v: Values) => !anonima(v) })),
    {
      name: 'reserva',
      type: 'toggle',
      section: 'autor',
      label: l('Pedir reserva da minha identidade', 'Ask for my identity to be kept confidential'),
      help: l('Pede que o nome não seja revelado ao denunciado e medidas de protecção, se necessário.', 'Asks that your name is not revealed and for protection if needed.'),
      default: true,
      showIf: (v) => !anonima(v),
    },
    { name: 'denunciadoNome', type: 'text', section: 'denunciado', label: l('Nome (se souber)', 'Name (if known)') },
    { name: 'denunciadoCargo', type: 'text', section: 'denunciado', width: 'half', label: l('Cargo ou função', 'Position') },
    { name: 'denunciadoInstituicao', type: 'text', section: 'denunciado', width: 'half', label: l('Instituição ou serviço', 'Institution or office'), placeholder: l('Ex.: Conservatória do Registo Civil de …', 'E.g. a civil registry office') },
    { name: 'crime', type: 'select', section: 'factos', label: l('O que aconteceu, em poucas palavras', 'What happened, in short'), options: CRIMES, default: 'corrupção passiva' },
    { name: 'factos', type: 'textarea', section: 'factos', required: true, rows: 6, label: l('Factos', 'Facts'), help: l('Por ordem: quem, o quê, quando, onde, como, quanto. Um facto por linha. Não inclua opiniões nem boatos.', 'In order: who, what, when, where, how, how much. One fact per line. No opinions or rumours.') },
    { name: 'dataFactos', type: 'text', section: 'factos', width: 'half', label: l('Quando', 'When'), placeholder: l('Ex.: 12 de Setembro de 2026', 'E.g. 12 September 2026') },
    { name: 'localFactos', type: 'text', section: 'factos', width: 'half', label: l('Onde', 'Where') },
    { name: 'valor', type: 'money', section: 'factos', width: 'half', label: l('Valor envolvido (se houver)', 'Amount involved (if any)') },
    { name: 'testemunhas', type: 'textarea', section: 'factos', rows: 2, label: l('Testemunhas (opcional)', 'Witnesses (optional)'), help: l('Nome e contacto, uma por linha. Só indique quem aceite ser contactado.', 'Name and contact, one per line. Only people willing to be contacted.') },
    anexosField('factos', l('Ex.: Fotografia do recibo sem número', 'E.g. Photo of an unnumbered receipt'), l('Provas que junta', 'Evidence enclosed')),
    localField('documento'),
    dateField('data'),
    reciboField('documento', false),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!splitLines(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva os factos.', 'Describe the facts.') });
    if (!str(v.denunciadoNome) && !str(v.denunciadoCargo) && !str(v.denunciadoInstituicao)) {
      w.push({ level: 'warning', field: 'denunciadoInstituicao', message: l('Identifique pelo menos a instituição ou o cargo de quem praticou os factos.', 'Identify at least the institution or position of the person.') });
    }
    if (anonima(v)) w.push({ level: 'info', field: 'anonima', message: l('Numa denúncia anónima, descreva os factos com todo o pormenor e junte provas: os investigadores não poderão contactá-lo.', 'In an anonymous report give full detail and evidence: investigators cannot contact you.') });
    else if (!str(v.autorNome)) w.push({ level: 'warning', field: 'autorNome', message: l('Indique o seu nome ou marque «Denúncia anónima».', 'Give your name or tick “Anonymous report”.') });
    w.push({
      level: 'info',
      field: 'factos',
      message: l(
        `Denuncie só factos que considere verdadeiros: acusar alguém sabendo que é falso é crime de denúncia caluniosa (${cite('cidDenunciaCaluniosa')}). O denunciante pode pedir protecção (${cite('cidDenunciaProteccao')}).`,
        'Report only facts you believe true: knowingly false accusations are a crime. Whistleblowers may ask for protection.',
      ),
    });
    return w;
  },

  personName: (v) => (anonima(v) ? 'anonima' : v.autorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const anon = anonima(v);
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const factos = splitLines(v.factos);
    const testemunhas = splitLines(v.testemunhas);
    const f = v.autorGenero === 'F';

    const pessoa = [str(v.denunciadoNome) ? `**${str(v.denunciadoNome)}**` : '', lowerFirst(str(v.denunciadoCargo))].filter(Boolean).join(', ');
    const inst = str(v.denunciadoInstituicao);
    const contra = pessoa ? `${pessoa}${inst ? ` (${inst})` : ''}` : inst ? `quem se apurar responsável, no serviço ${inst}` : BLANK;

    const quem = anon
      ? 'Um cidadão, que por receio de represálias prefere não se identificar,'
      : `${pessoaDesc(v, 'autor', { contactos: true })},`;

    const quando = [str(v.dataFactos) ? `em ${str(v.dataFactos).replace(/^em\s+/i, '')}` : '', str(v.localFactos) ? `${/^(no|na|em)\s/i.test(str(v.localFactos)) ? '' : 'em '}${str(v.localFactos)}` : ''].filter(Boolean).join(', ');
    const valor = money(v.valor) != null ? `envolvendo o valor de **${moneyText(v.valor)}**` : '';

    const crime = v.crime === 'outro' ? '' : String(v.crime || '');

    const blocks: Block[] = [
      { type: 'tags', items: ['CONFIDENCIAL'] },
      { type: 'recipient', salutation: tratamento, lines: [entidade, str(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
      { type: 'subject', text: `Denúncia${anon ? ' anónima' : ''}${str(v.denunciadoInstituicao) ? ` — ${str(v.denunciadoInstituicao)}` : ''}` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${quem} vem apresentar a V. Ex.ª **denúncia** contra ${contra}, pelos factos seguintes, ocorridos ${quando || BLANK}${valor ? `, ${valor}` : ''}:`,
        en: 'The whistleblower reports the person identified for the following facts:',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map(endDot) : [BLANK, BLANK, BLANK] },
    ];
    if (testemunhas.length) {
      blocks.push(
        { type: 'paragraph', id: 'testemunhas', text: 'Podem confirmar os factos:', en: 'The facts can be confirmed by:', keepWithNext: true },
        { type: 'list', style: 'bullet', items: testemunhas.map((t) => t.replace(/\.$/, '')) },
      );
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `Os factos descritos são susceptíveis de constituir ${crime ? `crime de ${crime}` : 'crime contra o Estado ou de corrupção'}, sem prejuízo de outra qualificação, pelo que se requer a abertura do competente processo e a realização das diligências necessárias ao apuramento da verdade e à responsabilização dos seus autores.`,
      en: 'The facts may amount to a crime; the opening of proceedings and the necessary investigation are requested.',
    });
    blocks.push(...anexosBlock(v, 'Provas juntas:'));
    if (!anon && v.reserva !== false) {
      blocks.push({
        type: 'paragraph',
        id: 'reserva',
        text: `${f ? 'A denunciante' : 'O denunciante'} requer que a sua identidade seja mantida em reserva e que, se necessário, lhe sejam aplicadas as medidas de protecção previstas na ${cite('cidDenunciaProteccao')}.`,
        en: 'The whistleblower asks for their identity to be kept confidential and for protection measures if needed.',
      });
    }
    if (!anon) {
      blocks.push({
        type: 'paragraph',
        id: 'declaracao',
        text: `${f ? 'A denunciante' : 'O denunciante'} declara que os factos relatados são verdadeiros, tanto quanto é do seu conhecimento, e manifesta disponibilidade para prestar declarações e colaborar com a investigação.`,
        en: 'The whistleblower declares the facts true to the best of their knowledge and is available to give evidence.',
        keepWithNext: true,
      });
      blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [autorSignature(ctx, 'O Denunciante', 'A Denunciante')] });
    } else {
      blocks.push({ type: 'paragraph', id: 'localData', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'left', en: 'Place and date.' });
    }
    blocks.push(...reciboBlock(v));
    return blocks;
  },
});
