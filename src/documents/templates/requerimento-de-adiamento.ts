import { defineTemplate, type Block, type FieldOption, type SignatureColumn, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, lawyerSignature, localField } from './_shared';
import { artigos, courtAddressee, nomeParte, parteF } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, fechoField, lawyerWarnings, parteNome, processoFields, prova, provaFields, sem, str } from './_processo-civil';

const DILIGENCIA_OPTIONS: FieldOption[] = [
  { value: 'audiência de discussão e julgamento', label: l('Audiência de julgamento', 'Trial hearing') },
  { value: 'tentativa de conciliação', label: l('Tentativa de conciliação', 'Conciliation hearing') },
  { value: 'audiência preliminar', label: l('Audiência preliminar', 'Preliminary hearing') },
  { value: 'conferência', label: l('Conferência (inventário, menores)', 'Conference (inventory, minors)') },
  { value: 'inquirição de testemunhas', label: l('Inquirição de testemunhas', 'Witness hearing') },
];

const MOTIVO_OPTIONS: FieldOption[] = [
  { value: 'impedimento', label: l('Mandatário com outra diligência já marcada', 'Lawyer has another hearing already set') },
  { value: 'doenca', label: l('Doença do mandatário ou da parte', 'Illness of the lawyer or party') },
  { value: 'acordo', label: l('Acordo das partes', 'Agreement of the parties') },
  { value: 'outro', label: l('Outro motivo (escrever)', 'Other reason (write it)') },
];

export default defineTemplate({
  id: 'requerimento-de-adiamento',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'adiamento', title: l('Diligência e motivo', 'Hearing and reason') },
    { id: 'prova', title: l('Documentos', 'Documents') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    ...parteNome('parte', 'partes', 'Parte que requer (o seu cliente)', 'Party applying (your client)', 'empresa'),
    { name: 'qualidade', type: 'select', section: 'partes', width: 'half', label: l('Posição no processo', 'Role in the case'), options: QUALIDADE_PC_OPTIONS, default: 'autor' },
    ...parteNome('contraria', 'partes', 'Parte contrária (opcional)', 'Other party (optional)', 'empresa', false),
    { name: 'diligencia', type: 'select', section: 'adiamento', label: l('Diligência', 'Hearing'), options: DILIGENCIA_OPTIONS, default: 'audiência de discussão e julgamento' },
    { name: 'dataDiligencia', type: 'date', section: 'adiamento', width: 'half', required: true, label: l('Marcada para', 'Set for') },
    { name: 'horaDiligencia', type: 'text', section: 'adiamento', width: 'half', label: l('Hora (opcional)', 'Time (optional)'), placeholder: l('Ex.: 9h30', 'E.g. 9:30') },
    { name: 'motivo', type: 'select', section: 'adiamento', required: true, label: l('Motivo', 'Reason'), options: MOTIVO_OPTIONS, default: 'impedimento' },
    { name: 'outraDiligencia', type: 'text', section: 'adiamento', label: l('Outra diligência já marcada', 'Other hearing already set'), placeholder: l('Ex.: audiência de julgamento no processo n.º 77/2025, do Tribunal Judicial da Província de Gaza, marcada por despacho de 2 de Agosto de 2026', 'E.g. trial in case 77/2025'), showIf: (v) => v.motivo === 'impedimento' },
    { name: 'fundamentos', type: 'textarea', section: 'adiamento', rows: 4, label: l('Fundamentos adicionais (um artigo por linha)', 'Additional grounds (one article per line)') },
    { name: 'datasSugeridas', type: 'text', section: 'adiamento', label: l('Datas sugeridas (opcional)', 'Suggested dates (optional)'), placeholder: l('Ex.: 10, 12 ou 17 de Novembro de 2026', 'E.g. 10, 12 or 17 November 2026') },
    { name: 'outroAdvogadoNome', type: 'text', section: 'adiamento', width: 'half', label: l('Advogado da outra parte', 'Other party’s lawyer'), showIf: (v) => v.motivo === 'acordo' },
    { name: 'outroAdvogadoCarteira', type: 'text', section: 'adiamento', width: 'half', label: l('Carteira profissional n.º', 'Bar card no.'), showIf: (v) => v.motivo === 'acordo' },
    ...provaFields('prova', { procuracao: false, testemunhas: false, docsPlaceholder: 'Notificação da outra diligência\nAtestado médico' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => [
    { level: 'info', field: 'motivo', message: l(`${cite('pcAdiamento')}. Apresente o pedido logo que conheça o impedimento e junte prova; o adiamento depende de despacho e não é garantido.`, 'File as soon as you know of the impediment, with proof; adjournment depends on the judge.') },
    ...(v.motivo === 'acordo' ? [{ level: 'info' as const, field: 'outroAdvogadoNome', message: l('O adiamento por acordo das partes é, em regra, admitido uma só vez; o requerimento deve ser assinado por ambos os advogados.', 'Adjournment by agreement is usually allowed once; both lawyers sign.') }] : []),
    ...lawyerWarnings(v),
  ] satisfies Warning[],

  personName: (v) => v.parteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.autor;
    const f = parteF(v, 'parte');
    const papel = f ? q.f : q.m;
    const contra = str(v.contrariaNome) ? `, em que é ${parteF(v, 'contraria') ? q.cf : q.cm} ${nomeParte(v, 'contraria')}` : '';
    const tipo = str(v.tipoAccao) || '____________________';
    const acordo = v.motivo === 'acordo';
    const dil = str(v.diligencia) || 'audiência de discussão e julgamento';
    const quando = `${dateLong(v.dataDiligencia)}${str(v.horaDiligencia) ? `, pelas ${sem(v.horaDiligencia)}` : ''}`;
    const advF = v.advogadoGenero === 'F';

    const items = [`Por despacho proferido nos autos, foi designado o dia ${quando} para a realização da ${dil}.`];
    switch (v.motivo) {
      case 'impedimento':
        items.push(`${advF ? 'A signatária' : 'O signatário'} tem marcada, para o mesmo dia e hora, ${sem(v.outraDiligencia) || '____________________'}, cuja marcação é anterior, como se comprova pelo documento junto.`, `${advF ? 'A signatária' : 'O signatário'} está, assim, impedid${advF ? 'a' : 'o'} de comparecer, não podendo fazer-se substituir sem prejuízo para a defesa dos interesses ${f ? 'da sua constituinte' : 'do seu constituinte'}.`);
        break;
      case 'doenca':
        items.push('Por motivo de doença, devidamente comprovada pelo atestado médico junto, não é possível a comparência na data designada.');
        break;
      case 'acordo':
        items.push('As partes estão em negociações com vista à resolução do litígio por acordo e, por isso, acordam no adiamento da diligência.');
        break;
    }
    items.push(...artigos(v.fundamentos));
    const pv = prova(v);
    const cols: SignatureColumn[] = [lawyerSignature(v)];
    if (acordo) cols.push({ role: 'O Advogado da parte contrária', name: str(v.outroAdvogadoNome) || undefined, detail: `Carteira Profissional n.º ${str(v.outroAdvogadoCarteira) || '________'} — OAM` });

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${nomeParte(v, 'parte')}, ${papel} nos autos de ${tipo}${contra}, e neles melhor ${f ? 'identificada' : 'identificado'}, vem, por intermédio do seu mandatário judicial${acordo ? ', conjuntamente com a parte contrária,' : ''} expor e requerer a V. Ex.ª o seguinte:`,
        en: 'The party applies for an adjournment.',
      },
      { type: 'articulado', sections: [{ items }] },
      ...closing(ctx, {
        intro: `Termos em que ${acordo ? 'requerem' : 'requer'} a V. Ex.ª se digne dar sem efeito a data designada e adiar a ${dil}${str(v.datasSugeridas) ? `, sugerindo-se, se a agenda do tribunal o permitir, as datas de ${sem(v.datasSugeridas)}` : ', designando-se nova data'}.`,
        introEn: 'The party asks for the hearing to be adjourned and a new date set.',
        docs: pv.docs,
        cols,
      }),
    ];
    return blocks;
  },
});
