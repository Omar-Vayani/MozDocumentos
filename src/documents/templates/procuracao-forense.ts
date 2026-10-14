import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, isF, l, lawyerFields, lineItems, localField, placeDate } from './_shared';
import { isEmpresa, papel, partyDesc, partyFields } from './_advocacia';

export default defineTemplate({
  id: 'procuracao-forense',
  family: 'declaracao',
  official: 'notario',
  letterhead: false,
  sections: [
    { id: 'outorgante', title: l('Cliente que dá os poderes (Outorgante)', 'Client granting the powers'), personRole: 'cliente' },
    { id: 'advogado', title: l('Advogado constituído', 'Lawyer appointed') },
    { id: 'poderes', title: l('Âmbito e poderes', 'Scope and powers') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...partyFields('outorgante', 'outorgante', { defaultTipo: 'pessoa' }),
    ...lawyerFields('advogado'),
    {
      name: 'outrosAdvogados',
      type: 'lines',
      section: 'advogado',
      label: l('Outros advogados (opcional)', 'Other lawyers (optional)'),
      addLabel: l('Adicionar advogado', 'Add lawyer'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'carteira', type: 'text', label: l('Carteira profissional n.º', 'Bar card no.') },
      ],
      default: [],
    },
    {
      name: 'ambito',
      type: 'radio',
      section: 'poderes',
      label: l('Para que processos', 'For which cases'),
      default: 'geral',
      options: [
        { value: 'geral', label: l('Quaisquer processos (procuração geral)', 'Any case (general)') },
        { value: 'processo', label: l('Um processo ou assunto concreto', 'A specific case or matter') },
      ],
    },
    { name: 'processoNumero', type: 'text', section: 'poderes', width: 'half', label: l('Processo n.º (se já existir)', 'Case no. (if any)'), showIf: (v) => v.ambito === 'processo' },
    { name: 'tribunal', type: 'text', section: 'poderes', width: 'half', label: l('Tribunal', 'Court'), placeholder: l('Ex.: Tribunal Judicial da Cidade de Maputo', 'E.g. Maputo City Court'), showIf: (v) => v.ambito === 'processo' },
    {
      name: 'assunto',
      type: 'text',
      section: 'poderes',
      label: l('Assunto (se ainda não houver processo)', 'Matter (if there is no case yet)'),
      placeholder: l('Ex.: acção de cobrança a propor contra Sol Nascente Imobiliária, Lda', 'E.g. debt claim against …'),
      showIf: (v) => v.ambito === 'processo',
    },
    {
      name: 'poderesEspeciais',
      type: 'toggle',
      section: 'poderes',
      default: true,
      label: l('Poderes especiais para confessar, desistir e transigir', 'Special powers to admit, withdraw and settle'),
      help: l('Sem estes poderes expressos, o advogado não pode fazer acordos nem desistir em seu nome.', 'Without these express powers the lawyer cannot settle or withdraw on your behalf.'),
    },
    { name: 'receberQuitacao', type: 'toggle', section: 'poderes', default: true, label: l('Receber quantias e dar quitação', 'Receive payments and give receipts') },
    { name: 'substabelecer', type: 'toggle', section: 'poderes', default: true, label: l('Pode substabelecer (passar os poderes a outro advogado)', 'May delegate to another lawyer') },
    localField('documento'),
    dateField('data', 'documento', l('Data da procuração', 'Date of the power of attorney')),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'warning',
        message: l(
          `A assinatura do outorgante deve ser reconhecida presencialmente por notário (${cite('advMandatoForense')}). Sem reconhecimento, o tribunal pode considerar o mandato irregular.`,
          'The grantor’s signature must be certified in person by a notary. Without it the court may treat the mandate as irregular.',
        ),
      },
    ];
    if (!isEmpresa(v, 'outorgante') && !v.outorganteDocNumero) {
      w.push({ level: 'warning', field: 'outorganteDocNumero', message: l('Falta o número do documento de identificação do outorgante.', 'The grantor’s ID number is missing.') });
    }
    if (isEmpresa(v, 'outorgante')) {
      w.push({
        level: 'info',
        field: 'outorganteRepresentante',
        message: l('Quem assina pela empresa deve ter poderes nos estatutos ou por deliberação; o notário pode pedir a certidão do registo comercial.', 'The signatory must have powers under the articles or a resolution; the notary may ask for the commercial registry certificate.'),
      });
    }
    if (!v.advogadoCarteira) w.push({ level: 'warning', field: 'advogadoCarteira', message: l('Indique o número da carteira profissional do advogado.', 'Enter the lawyer’s bar card number.') });
    return w;
  },

  personName: (v) => v.outorganteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.advogadoGenero);
    const outros = lineItems(v.outrosAdvogados)
      .map((r) => ({ nome: String(r.nome ?? '').trim(), carteira: String(r.carteira ?? '').trim() }))
      .filter((r) => r.nome);
    const varios = outros.length > 0;
    const principal = `**${String(v.advogadoNome ?? '').trim() || BLANK}**, titular da Carteira Profissional n.º ${String(v.advogadoCarteira ?? '').trim() || '________'}`;
    const lista = [principal, ...outros.map((o) => `**${o.nome}**, titular da Carteira Profissional n.º ${o.carteira || '________'}`)];
    const domicilio = String(v.advogadoDomicilio ?? '').trim() || BLANK;
    const advogados = varios
      ? `seus bastantes procuradores os Advogados ${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}, todos inscritos na Ordem dos Advogados de Moçambique e com escritório em ${domicilio}`
      : `${f ? 'sua bastante procuradora a Senhora Dra.' : 'seu bastante procurador o Senhor Dr.'} **${String(v.advogadoNome ?? '').trim() || BLANK}**, ${f ? 'Advogada' : 'Advogado'}, titular da Carteira Profissional n.º ${String(v.advogadoCarteira ?? '').trim() || '________'} da Ordem dos Advogados de Moçambique, com escritório em ${domicilio}`;
    const lhe = varios ? 'lhes' : 'lhe';
    const oOutorgante = papel(v, 'outorgante', 'o', 'a');

    const ambito =
      v.ambito === 'processo'
        ? [
            String(v.processoNumero ?? '').trim() ? `no processo n.º ${String(v.processoNumero).trim()}` : '',
            String(v.tribunal ?? '').trim() ? `${String(v.processoNumero ?? '').trim() ? 'que corre termos no' : 'no'} ${String(v.tribunal).trim().replace(/^(o|no)\s+/i, '')}` : '',
            String(v.assunto ?? '').trim() ? `${String(v.processoNumero ?? '').trim() || String(v.tribunal ?? '').trim() ? 'relativo ao seguinte assunto:' : 'no âmbito do seguinte assunto:'} ${String(v.assunto).trim().replace(/[.;]$/, '')}` : '',
          ]
            .filter(Boolean)
            .join(', ')
        : '';

    const especiais: string[] = [];
    if (v.poderesEspeciais) especiais.push('confessar, desistir e transigir');
    if (v.receberQuitacao) especiais.push('receber quaisquer quantias e dar quitação');
    if (v.substabelecer) especiais.push('substabelecer, com ou sem reserva, os poderes ora conferidos');

    const outorgante = isEmpresa(v, 'outorgante');
    const blocks: Block[] = [
      { type: 'title', text: 'Procuração forense' },
      {
        type: 'paragraph',
        id: 'constituicao',
        text: `${partyDesc(v, 'outorgante', { docBlank: true })}, constitui ${advogados}, a quem confere os mais amplos poderes forenses em Direito permitidos, para ${oOutorgante} representar em juízo e fora dele, em quaisquer tribunais, repartições públicas e demais autoridades${varios ? ', podendo agir em conjunto ou separadamente' : ''}${ambito ? `, designadamente ${ambito}` : ''}.`,
        en: 'The client named above appoints the lawyer(s) named above, with the broadest litigation powers allowed by law, to represent the client in and out of court, before any court, public office or authority.',
      },
    ];
    if (especiais.length) {
      blocks.push({
        type: 'paragraph',
        id: 'especiais',
        text: `Confere-${lhe} ainda os poderes especiais para ${especiais.length === 1 ? especiais[0] : `${especiais.slice(0, -1).join(', ')} e ${especiais[especiais.length - 1]}`}.`,
        en: 'The client also grants the special powers listed (admit, withdraw and settle; receive payments; delegate).',
        keepWithNext: true,
      });
    } else {
      (blocks[blocks.length - 1] as { keepWithNext?: boolean }).keepWithNext = true;
    }
    blocks.push(
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          outorgante
            ? { role: 'Pela Outorgante', name: String(v.outorganteRepresentante ?? '').trim() || undefined, detail: String(v.outorganteNome ?? '').trim() || undefined }
            : { role: papel(v, 'outorgante', 'O Outorgante', 'A Outorgante'), name: String(v.outorganteNome ?? '').trim() || undefined },
        ],
      },
      {
        type: 'box',
        label: 'Reconhecimento notarial',
        text: `Reconhecimento presencial da assinatura ${outorgante ? 'do representante da outorgante' : papel(v, 'outorgante', 'do outorgante', 'da outorgante')} (reservado ao notário).`,
        lines: 4,
        dashed: true,
      },
    );
    return blocks;
  },
});
