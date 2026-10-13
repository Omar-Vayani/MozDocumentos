import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type FieldDef, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, lawyerSignature, localField, placeDate } from './_shared';
import { artigos, documentosList, juntaText, linePara, papel, partyDesc, partyFields, testemunhasList } from './_advocacia';

// ---------------------------------------------------------------- Local helpers

const DESTINO_OPTIONS = [
  { value: 'mp', label: l('Ministério Público (Procuradoria da República)', 'Public Prosecutor (Procuradoria)') },
  { value: 'prm', label: l('Polícia da República de Moçambique (esquadra)', 'Police station (PRM)') },
  { value: 'sernic', label: l('SERNIC (investigação criminal)', 'SERNIC (criminal investigation)') },
];

const deLocal = (s: string) => (/^(cidade|prov[ií]ncia|delega[cç][aã]o|\d+\.?ª)/i.test(s) ? `da ${s}` : `do ${s}`);

function destinatario(v: Values): string {
  const local = String(v.destinoLocal ?? '').trim();
  switch (v.destinoTipo) {
    case 'prm':
      return `Exmo. Senhor Comandante ${local ? deLocal(local) : 'da Esquadra da Polícia da República de Moçambique de ____________________'}`;
    case 'sernic':
      return `Exmo. Senhor Director do Serviço Nacional de Investigação Criminal${local ? ` — ${local}` : ''}`;
    default:
      return `Exmo. Senhor Magistrado do Ministério Público junto da Procuradoria da República ${local ? deLocal(local) : 'de ____________________'}`;
  }
}

const viaAdvogado = (v: Values) => Boolean(v.viaAdvogado);

export default defineTemplate({
  id: 'queixa-crime',
  family: 'peca',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destino', title: l('A quem se apresenta', 'Where it is filed') },
    { id: 'queixoso', title: l('Queixoso (vítima)', 'Complainant (victim)'), personRole: 'cliente' },
    { id: 'denunciado', title: l('Contra quem', 'Against whom'), personRole: 'outro' },
    { id: 'factos', title: l('Factos', 'Facts') },
    { id: 'pedido', title: l('Pedido e prova', 'Request and evidence') },
    { id: 'advogado', title: l('Advogado (opcional)', 'Lawyer (optional)') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'destinoTipo', type: 'select', section: 'destino', required: true, label: l('Entidade', 'Authority'), options: DESTINO_OPTIONS, default: 'mp' },
    {
      name: 'destinoLocal',
      type: 'text',
      section: 'destino',
      label: l('Qual (local)', 'Which one (place)'),
      default: 'Cidade de Maputo',
      placeholder: l('Ex.: Cidade de Maputo; Província de Sofala; Distrito de Boane; 1.ª Esquadra da PRM da Matola', 'E.g. Maputo City; Sofala Province; 1st PRM station, Matola'),
    },
    ...partyFields('queixoso', 'queixoso', { defaultTipo: 'pessoa' }),
    { name: 'queixosoContacto', type: 'tel', section: 'queixoso', width: 'half', label: l('Telefone para contacto', 'Contact phone'), personKey: 'telefone' },
    {
      name: 'denunciadoConhecido',
      type: 'radio',
      section: 'denunciado',
      label: l('Sabe quem praticou os factos?', 'Do you know who did it?'),
      default: 'sim',
      options: [
        { value: 'sim', label: l('Sim', 'Yes') },
        { value: 'nao', label: l('Não (autores desconhecidos)', 'No (unknown persons)') },
      ],
    },
    ...partyFields('denunciado', 'denunciado', { light: true }).map((f): FieldDef => ({ ...f, required: false, showIf: (v: Values) => v.denunciadoConhecido !== 'nao' && (f.showIf ? f.showIf(v) : true) })),
    { name: 'dataFactos', type: 'date', section: 'factos', width: 'half', required: true, label: l('Data dos factos', 'Date of the events') },
    { name: 'horaFactos', type: 'text', section: 'factos', width: 'half', label: l('Hora aproximada (opcional)', 'Approximate time (optional)'), placeholder: l('Ex.: 21h30', 'E.g. 21:30') },
    { name: 'localFactos', type: 'text', section: 'factos', label: l('Local dos factos', 'Place of the events'), placeholder: l('Ex.: Avenida Eduardo Mondlane, junto ao mercado do Museu, Maputo', 'E.g. street and city') },
    {
      name: 'factos',
      type: 'textarea',
      section: 'factos',
      rows: 8,
      required: true,
      label: l('O que aconteceu (um artigo por linha)', 'What happened (one article per line)'),
      help: l('Descreva por ordem: o que aconteceu, quem fez o quê, como e com que consequências. Só factos que conhece.', 'Describe in order what happened, who did what, how and with what consequences. Only facts you know.'),
    },
    { name: 'danos', type: 'textarea', section: 'factos', rows: 3, label: l('Danos e prejuízos (opcional)', 'Damage and losses (optional)'), help: l('Um por linha, com valores se os conhecer.', 'One per line, with amounts if known.') },
    { name: 'crimeNome', type: 'text', section: 'factos', width: 'half', label: l('Crime (opcional)', 'Offence (optional)'), placeholder: l('Ex.: burla; ofensas corporais; furto', 'E.g. fraud; assault; theft') },
    { name: 'crimeArtigo', type: 'text', section: 'factos', width: 'half', label: l('Artigo do Código Penal (opcional)', 'Penal Code article (optional)'), help: l('Escreva como deve aparecer, ex.: «artigo … do Código Penal».', 'Write it as it should appear.') },
    { name: 'assistente', type: 'toggle', section: 'pedido', default: true, label: l('Declarar que pretende constituir-se assistente', 'State the intention to join as assistant prosecutor') },
    { name: 'indemnizacao', type: 'toggle', section: 'pedido', default: true, label: l('Declarar que pretende pedir indemnização civil', 'State the intention to claim damages') },
    { name: 'testemunhas', type: 'textarea', section: 'pedido', rows: 3, label: l('Testemunhas (opcional)', 'Witnesses (optional)'), help: l('Uma por linha: nome, contacto e morada.', 'One per line: name, contact and address.') },
    { name: 'documentos', type: 'textarea', section: 'pedido', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)'), placeholder: l('Relatório médico do Hospital Central de Maputo\nFotografias do local', 'Medical report\nPhotos') },
    {
      name: 'viaAdvogado',
      type: 'toggle',
      section: 'advogado',
      label: l('Apresentada por advogado', 'Filed by a lawyer'),
      default: (c) => Boolean(c.profile?.oamCarteira),
      help: l('O advogado precisa de procuração com poderes especiais para apresentar a queixa.', 'The lawyer needs a power of attorney with special powers.'),
    },
    ...lawyerFields('advogado').map((f): FieldDef => ({ ...f, showIf: viaAdvogado })),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const c = ctx.legal.value<{ penaGrave: number; restantes: number }>('advQueixaCaducidade');
    w.push({
      level: 'info',
      field: 'dataFactos',
      message: l(
        `Nos crimes que dependem de queixa, o direito de queixa extingue-se em ${c.penaGrave} anos (crimes punidos com pena de prisão superior a ${c.penaGrave} anos) ou em ${c.restantes} ano(s) nos restantes casos (${cite('advQueixaCaducidade')}; confirme). Apresente a queixa o mais cedo possível.`,
        `For offences requiring a complaint, the right lapses after ${c.penaGrave} years (offences punishable by more than ${c.penaGrave} years) or ${c.restantes} year(s) otherwise. File as early as possible.`,
      ),
    });
    if (v.dataFactos && v.data && diffDays(v.dataFactos, v.data) > c.restantes * 365) {
      w.push({ level: 'warning', field: 'dataFactos', message: l('Os factos ocorreram há mais de um ano. Confirme se o direito de queixa ainda não se extinguiu.', 'The events happened over a year ago. Check that the right to complain has not lapsed.') });
    }
    w.push({
      level: 'info',
      message: l(
        'Entregue o original e peça o carimbo de entrada numa cópia. Imputar factos falsos a alguém é crime: descreva apenas o que sabe.',
        'Hand in the original and get a receipt stamp on a copy. Falsely accusing someone is an offence: describe only what you know.',
      ),
    });
    if (v.viaAdvogado) {
      w.push({ level: 'info', message: l(`A queixa apresentada por advogado exige procuração com poderes especiais (${cite('advQueixa')}).`, 'A complaint filed by a lawyer requires a power of attorney with special powers.') });
    }
    return w;
  },

  personName: (v) => v.queixosoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const conhecido = v.denunciadoConhecido !== 'nao';
    const oQueixoso = papel(v, 'queixoso', 'O Queixoso', 'A Queixosa');
    const contacto = String(v.queixosoContacto ?? '').trim();
    const quando = [
      v.dataFactos ? `no dia ${dateLong(v.dataFactos)}` : '',
      String(v.horaFactos ?? '').trim() ? `cerca das ${String(v.horaFactos).trim()}` : '',
      String(v.localFactos ?? '').trim() ? `em ${String(v.localFactos).trim().replace(/[.;]$/, '')}` : '',
    ].filter(Boolean);
    const factos = [...(quando.length ? [`Os factos que a seguir se descrevem ocorreram ${quando.join(', ')}.`] : []), ...artigos(v.factos)];
    const danos = artigos(v.danos);
    const crime = String(v.crimeNome ?? '').trim();
    const artigo = String(v.crimeArtigo ?? '').trim();
    const direito = crime
      ? `Os factos descritos são susceptíveis de integrar a prática do crime de ${crime}${artigo ? `, previsto e punido pelo ${artigo.replace(/^(o|pelo)\s+/i, '')}` : ''}, sem prejuízo de outra qualificação que o Ministério Público venha a dar-lhes.`
      : 'Os factos descritos são susceptíveis de integrar a prática de crime, cuja qualificação jurídica caberá ao Ministério Público.';
    const declaracoes: string[] = [];
    if (v.assistente) declaracoes.push('constituir-se assistente');
    if (v.indemnizacao) declaracoes.push('deduzir pedido de indemnização civil pelos danos sofridos');
    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);

    const blocks: Block[] = [
      { type: 'courtHeader', addressee: destinatario(v).toLocaleUpperCase('pt') },
      {
        type: 'paragraph',
        id: 'queixoso',
        text: `${partyDesc(v, 'queixoso')}${contacto ? `, contacto telefónico ${contacto}` : ''}, vem${v.viaAdvogado ? ', por intermédio do seu mandatário, com poderes especiais para o acto,' : ''} apresentar`,
        en: 'The complainant identified above files a',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**QUEIXA-CRIME**', en: 'CRIMINAL COMPLAINT' },
      {
        type: 'paragraph',
        id: 'contra',
        text: conhecido ? `contra ${partyDesc(v, 'denunciado')}, pelos factos e fundamentos seguintes:` : 'contra desconhecidos, pelos factos e fundamentos seguintes:',
        en: 'against the person named (or unknown persons), on the following facts and grounds:',
      },
      {
        type: 'articulado',
        sections: [
          { heading: 'I — Dos factos', items: factos.length ? factos : ['____________________'] },
          ...(danos.length ? [{ heading: 'II — Dos danos', items: danos }] : []),
          { heading: `${danos.length ? 'III' : 'II'} — Do direito`, items: [direito] },
        ],
      },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª se digne mandar instaurar o competente procedimento criminal contra ${conhecido ? papel(v, 'denunciado', 'o denunciado', 'a denunciada') : 'os autores dos factos'}, ordenando as diligências de investigação necessárias ao apuramento da verdade${testemunhas.length ? ', designadamente a inquirição das testemunhas abaixo indicadas' : ''}${docs.length ? `${testemunhas.length ? ' e' : ', designadamente'} o exame dos documentos juntos` : ''}.`,
        en: 'The complainant asks the authority to open criminal proceedings and carry out the investigation needed.',
        keepWithNext: !declaracoes.length && !testemunhas.length && !docs.length,
      },
    ];
    if (declaracoes.length) {
      blocks.push({
        type: 'paragraph',
        id: 'declaracoes',
        text: `${oQueixoso} declara, desde já, que pretende ${declaracoes.join(' e ')}, nos termos legais.`,
        en: 'The complainant states the intention to join as assistant prosecutor and/or claim damages.',
        keepWithNext: !testemunhas.length && !docs.length,
      });
    }
    if (testemunhas.length) {
      blocks.push(
        { type: 'paragraph', id: 'rol', text: '**Testemunhas:**', en: 'Witnesses:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: testemunhas, keepWithNext: !docs.length },
      );
    }
    if (docs.length) blocks.push(linePara('junta', 'Junta', `${juntaText({ documentos: docs.length, duplicados: false })}.`, 'Attached documents.', true));
    blocks.push({
      type: 'signatures',
      placeDate: placeDate(ctx, v.data),
      columns: [v.viaAdvogado ? lawyerSignature(v) : { role: oQueixoso, name: String(v.queixosoNome ?? '').trim() || undefined }],
    });
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return blocks;
  },
});
