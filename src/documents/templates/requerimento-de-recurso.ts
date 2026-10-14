import { defineTemplate, type Block, type FieldOption, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, localField } from './_shared';
import { courtAddressee, nomeParte, parteF } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, fechoField, lawyerWarnings, parteNome, processoFields, sem, str } from './_processo-civil';

const ESPECIE_OPTIONS: FieldOption[] = [
  { value: 'apelacao', label: l('Apelação (sentença final ou saneador que conheça do mérito)', 'Appeal against a final judgment') },
  { value: 'agravo', label: l('Agravo (outras decisões, despachos)', 'Appeal against other decisions') },
  { value: 'revista', label: l('Revista (acórdão do tribunal de recurso)', 'Appeal on points of law') },
];

const DECISAO_OPTIONS: FieldOption[] = [
  { value: 'sentenca', label: l('Sentença', 'Judgment') },
  { value: 'despacho', label: l('Despacho', 'Order') },
  { value: 'saneador', label: l('Despacho saneador', 'Preliminary order') },
  { value: 'acordao', label: l('Acórdão', 'Court of appeal ruling') },
];

const ESPECIE_TXT: Record<string, string> = { apelacao: 'APELAÇÃO', agravo: 'AGRAVO', revista: 'REVISTA' };
const DECISAO_TXT: Record<string, { art: string; nome: string; f: boolean }> = {
  sentenca: { art: 'a', nome: 'sentença', f: true },
  despacho: { art: 'o', nome: 'despacho', f: false },
  saneador: { art: 'o', nome: 'despacho saneador', f: false },
  acordao: { art: 'o', nome: 'acórdão', f: false },
};

const especie = (v: Values) => (String(v.especie ?? 'apelacao') in ESPECIE_TXT ? String(v.especie ?? 'apelacao') : 'apelacao');

export default defineTemplate({
  id: 'requerimento-de-recurso',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'recurso', title: l('Decisão e recurso', 'Decision and appeal') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    ...parteNome('recorrente', 'partes', 'Recorrente (o seu cliente)', 'Appellant (your client)', 'empresa'),
    { name: 'qualidade', type: 'select', section: 'partes', width: 'half', label: l('Posição no processo', 'Role in the case'), options: QUALIDADE_PC_OPTIONS, default: 'reu' },
    ...parteNome('recorrido', 'partes', 'Parte contrária (recorrido)', 'Other party (respondent)', 'empresa', false),
    { name: 'decisao', type: 'select', section: 'recurso', width: 'half', label: l('Decisão recorrida', 'Decision appealed'), options: DECISAO_OPTIONS, default: 'sentenca' },
    { name: 'dataDecisao', type: 'date', section: 'recurso', width: 'half', label: l('Data da decisão', 'Date of the decision') },
    { name: 'dataNotificacao', type: 'date', section: 'recurso', width: 'half', required: true, label: l('Notificada em', 'Notified on') },
    { name: 'decisaoResumo', type: 'text', section: 'recurso', label: l('O que decidiu (opcional)', 'What it decided (optional)'), placeholder: l('Ex.: julgou a acção procedente e condenou a Ré no pagamento de 1.278.750,00 MT', 'E.g. upheld the claim'), help: l('Completa «… que …».', 'Completes “… which …”.') },
    { name: 'especie', type: 'select', section: 'recurso', required: true, label: l('Espécie de recurso', 'Type of appeal'), options: ESPECIE_OPTIONS, default: 'apelacao' },
    {
      name: 'tribunalRecurso',
      type: 'text',
      section: 'recurso',
      label: l('Tribunal de recurso', 'Appeal court'),
      default: 'Tribunal Superior de Recurso de Maputo',
      help: l('Tribunal Superior de Recurso da respectiva área, ou Tribunal Supremo, conforme a decisão e a lei de organização judiciária.', 'Court of appeal of the area, or the Supreme Court.'),
    },
    {
      name: 'efeito',
      type: 'radio',
      section: 'recurso',
      width: 'half',
      label: l('Efeito pedido', 'Effect requested'),
      default: 'suspensivo',
      options: [
        { value: 'suspensivo', label: l('Suspensivo', 'Suspensive') },
        { value: 'devolutivo', label: l('Meramente devolutivo', 'Non-suspensive') },
        { value: 'lei', label: l('O que a lei fixar', 'As set by law') },
      ],
    },
    {
      name: 'subida',
      type: 'radio',
      section: 'recurso',
      width: 'half',
      label: l('Subida', 'Mode'),
      default: 'proprios',
      options: [
        { value: 'proprios', label: l('Imediata, nos próprios autos', 'Immediate, in the case file') },
        { value: 'separado', label: l('Imediata, em separado', 'Immediate, separate') },
        { value: 'diferida', label: l('Diferida', 'Deferred') },
        { value: 'lei', label: l('A que a lei fixar', 'As set by law') },
      ],
    },
    { name: 'caucao', type: 'text', section: 'recurso', label: l('Caução oferecida para o efeito suspensivo (opcional)', 'Security offered (optional)'), placeholder: l('Ex.: garantia bancária no valor da condenação', 'E.g. bank guarantee'), showIf: (v) => v.efeito === 'suspensivo' },
    { name: 'alegaJa', type: 'toggle', section: 'recurso', label: l('Juntar já as alegações', 'File the submissions now'), help: l('Se preferir, junte as alegações com este requerimento (documento «Alegações de recurso»).', 'You may file the submissions with this application.') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        field: 'dataNotificacao',
        message: l(
          `O recurso é interposto no prazo legal a contar da notificação da decisão${v.dataNotificacao ? ` (${dateLong(v.dataNotificacao)})` : ''}, por requerimento dirigido ao tribunal que a proferiu (${cite('pcRecursos')}). Confirme o prazo, a espécie, o efeito e o regime de subida.`,
          'The appeal is filed within the legal period from notice of the decision, by application to the court that gave it. Confirm the period, type, effect and mode.',
        ),
      },
      { level: 'info', field: 'especie', message: l('O recurso só é admissível nas causas de valor superior à alçada do tribunal recorrido, salvo os casos em que a lei o admite sempre. Pague a taxa de justiça devida.', 'The appeal requires a case value above the lower court’s limit, save exceptions. Pay the court fee.') },
    ];
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.recorrenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.reu;
    const f = parteF(v, 'recorrente');
    const papel = f ? q.f : q.m;
    const contraPapel = parteF(v, 'recorrido') ? q.cf : q.cm;
    const ident = f ? 'identificada' : 'identificado';
    const tipo = str(v.tipoAccao) || '____________________';
    const contra = str(v.recorridoNome) ? `, em que é ${contraPapel} ${nomeParte(v, 'recorrido')}` : '';
    const d = DECISAO_TXT[v.decisao as string] ?? DECISAO_TXT.sentenca;
    const esp = especie(v);
    const proferida = d.f ? 'proferida' : 'proferido';
    const notificada = d.f ? 'notificada' : 'notificado';
    const conformado = f ? 'conformada' : 'conformado';
    const tribunalRec = sem(v.tribunalRecurso) || '____________________';

    const intro = `${nomeParte(v, 'recorrente')}, ${papel} nos autos de ${tipo}${contra}, e neles melhor ${ident}, não se ${conformado} com ${d.art} ${d.nome} ${proferida}${v.dataDecisao ? ` em ${dateLong(v.dataDecisao)}` : ''}${str(v.decisaoResumo) ? `, que ${sem(v.decisaoResumo)}` : ''}, ${notificada} em ${dateLong(v.dataNotificacao)}, vem, por intermédio do seu mandatário judicial, ${d.f ? 'dela' : 'dele'} interpor recurso para o ${tribunalRec.replace(/^o\s+/i, '')}, o qual é de`;

    const efeito = v.efeito === 'devolutivo' ? 'efeito meramente devolutivo' : v.efeito === 'lei' ? 'o efeito que a lei lhe atribui' : 'efeito suspensivo';
    const subidaMap: Record<string, string> = { proprios: 'subida imediata, nos próprios autos', separado: 'subida imediata, em separado', diferida: 'subida diferida', lei: 'o regime de subida fixado na lei' };
    const subida = subidaMap[v.subida as string] ?? subidaMap.proprios;
    const items = [
      `${d.art === 'a' ? 'A' : 'O'} ${d.nome} ${d.f ? 'recorrida' : 'recorrido'} é desfavorável ${f ? 'à' : 'ao'} ${papel}, que tem legitimidade e está em tempo para recorrer.`,
      'O recurso é admissível, atento o valor da causa e o da sucumbência.',
      ...(v.efeito === 'suspensivo' && str(v.caucao) ? [`Para obter o efeito suspensivo, ${f ? 'a' : 'o'} Recorrente oferece caução, por ${sem(v.caucao)}.`] : []),
    ];

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      { type: 'paragraph', id: 'identificacao', text: intro, en: 'The party, disagreeing with the decision, files an appeal to the appeal court, which is an' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: `**${ESPECIE_TXT[esp]}**,`, en: esp === 'apelacao' ? 'APPEAL' : esp === 'agravo' ? 'INTERLOCUTORY APPEAL' : 'APPEAL ON POINTS OF LAW' },
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos seguintes:', en: 'on the following terms:' },
      { type: 'articulado', sections: [{ items }] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Termos em que requer a V. Ex.ª se digne admitir o presente recurso, como de ${ESPECIE_TXT[esp].toLocaleLowerCase('pt')}, com ${subida} e ${efeito}, ${v.alegaJa ? 'juntando-se desde já as respectivas alegações' : 'ordenando-se a notificação para alegar no prazo legal'}, seguindo-se os ulteriores termos.`,
        en: 'The party asks the court to admit the appeal with the stated mode and effect.',
      },
      ...closing(ctx, { outrosJunta: v.alegaJa ? ['alegações de recurso'] : [], duplicados: Boolean(v.alegaJa), docs: [] }),
    ];
    return blocks;
  },
});
