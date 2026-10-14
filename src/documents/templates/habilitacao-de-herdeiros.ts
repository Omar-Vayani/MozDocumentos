import { defineTemplate, type Block, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, isF, l, lawyerFields, lineItems, localField } from './_shared';
import { artigos, courtAddressee } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, lawyerWarnings, parteNome, processoFields, prova, provaFields, sem, str } from './_processo-civil';

export default defineTemplate({
  id: 'habilitacao-de-herdeiros',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'requerente', title: l('Quem requer', 'Applicant') },
    { id: 'falecido', title: l('Parte falecida', 'Deceased party') },
    { id: 'herdeiros', title: l('Sucessores a habilitar', 'Successors') },
    { id: 'prova', title: l('Documentos', 'Documents') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    {
      name: 'quemRequer',
      type: 'radio',
      section: 'requerente',
      label: l('Requer a habilitação', 'Who applies'),
      default: 'sucessores',
      options: [
        { value: 'sucessores', label: l('Os próprios sucessores', 'The successors themselves') },
        { value: 'parte', label: l('A parte contrária (sobreviva)', 'The surviving party') },
      ],
    },
    ...parteNome('requerente', 'requerente', 'Parte sobreviva (o seu cliente)', 'Surviving party (your client)', 'empresa').map((f) => ({ ...f, required: false, showIf: (v: Record<string, unknown>) => v.quemRequer === 'parte' && (f.name !== 'requerenteGenero' || v.requerenteTipo !== 'empresa') })),
    { name: 'qualidade', type: 'select', section: 'requerente', width: 'half', label: l('Posição da parte sobreviva', 'Role of the surviving party'), options: QUALIDADE_PC_OPTIONS, default: 'autor', showIf: (v) => v.quemRequer === 'parte' },
    { name: 'falecidoNome', type: 'text', section: 'falecido', required: true, label: l('Nome da parte falecida', 'Name of the deceased party') },
    { name: 'falecidoGenero', type: 'radio', section: 'falecido', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'falecidoQualidade', type: 'select', section: 'falecido', width: 'half', label: l('Era no processo', 'Was in the case'), options: QUALIDADE_PC_OPTIONS, default: 'reu' },
    { name: 'dataObito', type: 'date', section: 'falecido', width: 'half', required: true, label: l('Data do óbito', 'Date of death') },
    { name: 'localObito', type: 'text', section: 'falecido', width: 'half', label: l('Local do óbito', 'Place of death') },
    {
      name: 'herdeiros',
      type: 'lines',
      section: 'herdeiros',
      required: true,
      label: l('Sucessores', 'Successors'),
      addLabel: l('Adicionar sucessor', 'Add successor'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'qualidade', type: 'text', label: l('Qualidade', 'Capacity'), placeholder: l('Ex.: cônjuge; filho', 'E.g. spouse; son') },
        { name: 'morada', type: 'text', label: l('Residência', 'Residence') },
      ],
      default: [],
    },
    { name: 'factos', type: 'textarea', section: 'herdeiros', rows: 3, label: l('Factos adicionais (opcional)', 'Additional facts (optional)'), help: l('Ex.: escritura de habilitação notarial, testamento, inexistência de outros herdeiros.', 'E.g. notarial deed of heirship, will, no other heirs.') },
    ...provaFields('prova', { testemunhas: false, docsPlaceholder: 'Certidão de óbito\nEscritura de habilitação de herdeiros\nCertidões de nascimento ou casamento' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`Comprovado o falecimento, a instância suspende-se até à habilitação dos sucessores (${cite('pcHabilitacao')}). Junte a certidão de óbito e os documentos que provam a qualidade de herdeiro (por exemplo, escritura de habilitação notarial).`, 'Once the death is proved, the case is suspended until the successors are admitted. Attach the death certificate and proof of heirship.') },
    ];
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.falecidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fF = isF(v.falecidoGenero);
    const fq = QUALIDADE_PC[v.falecidoQualidade as string] ?? QUALIDADE_PC.reu;
    const falecidoPapel = fF ? fq.f : fq.m;
    const falecido = `**${(str(v.falecidoNome) || '____________').toLocaleUpperCase('pt')}**`;
    const herdeiros = lineItems(v.herdeiros).filter((h) => str(h.nome));
    const lista = herdeiros.map((h) => `**${str(h.nome).toLocaleUpperCase('pt')}**${str(h.qualidade) ? `, ${sem(h.qualidade)}` : ''}${str(h.morada) ? `, residente em ${sem(h.morada)}` : ''}`);
    const tipo = str(v.tipoAccao) || '____________________';
    const porSucessores = v.quemRequer !== 'parte';
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.autor;
    const reqF = v.requerenteTipo === 'empresa' || isF(v.requerenteGenero);

    const intro = porSucessores
      ? `${lista.join('; ') || '____________________'}, ${herdeiros.length > 1 ? 'sucessores' : 'sucessor'} de ${falecido}, ${falecidoPapel} nos autos de ${tipo} à margem referenciados, ${herdeiros.length > 1 ? 'vêm' : 'vem'}, por intermédio do seu mandatário judicial, deduzir o presente`
      : `**${(str(v.requerenteNome) || '____________').toLocaleUpperCase('pt')}**, ${reqF ? q.f : q.m} nos autos de ${tipo} à margem referenciados, e neles melhor ${reqF ? 'identificada' : 'identificado'}, vem, por intermédio do seu mandatário judicial, deduzir o presente`;

    const items = [
      `${fF ? 'A' : 'O'} ${falecidoPapel} ${falecido} faleceu em ${dateLong(v.dataObito)}${str(v.localObito) ? `, em ${sem(v.localObito)}` : ''}, como consta da certidão de óbito junta.`,
      herdeiros.length
        ? `${herdeiros.length > 1 ? 'Sucederam-lhe' : 'Sucedeu-lhe'}, como ${herdeiros.length > 1 ? 'seus únicos herdeiros' : 'seu único herdeiro'}, ${herdeiros.map((h) => `${h.nome}${str(h.qualidade) ? ` (${sem(h.qualidade)})` : ''}`).join(', ')}, como resulta dos documentos juntos.`
        : 'Sucederam-lhe os herdeiros adiante identificados.',
      ...artigos(v.factos),
      `Importa, assim, habilitar ${herdeiros.length > 1 ? 'os referidos sucessores' : 'o referido sucessor'} para, em substituição ${fF ? 'da falecida' : 'do falecido'}, com ${herdeiros.length > 1 ? 'eles' : 'ele'} prosseguirem os termos da causa.`,
    ];
    const pedidos = [
      `${porSucessores ? 'Serem' : 'Serem citados os sucessores e a parte contrária para, querendo, contestar, e, a final, serem'} julgados habilitados, como sucessores de ${falecido}, ${herdeiros.map((h) => str(h.nome)).join(', ') || '____________________'}, para com ${herdeiros.length > 1 ? 'eles' : 'ele'} prosseguir a causa`,
      ...(porSucessores ? ['Ser notificada a parte contrária para, querendo, contestar o presente incidente'] : []),
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      { type: 'paragraph', id: 'identificacao', text: intro, en: 'The successors (or the surviving party) file this' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**INCIDENTE DE HABILITAÇÃO DE HERDEIROS**,', en: 'APPLICATION TO SUBSTITUTE THE HEIRS' },
      { type: 'paragraph', id: 'fundamentos', text: `o que ${porSucessores && herdeiros.length > 1 ? 'fazem' : 'faz'} nos termos e com os fundamentos seguintes:`, en: 'on the following terms and grounds:' },
      { type: 'articulado', sections: [{ items }] },
      ...closing(ctx, {
        intro: `Nestes termos, ${porSucessores && herdeiros.length > 1 ? 'requerem' : 'requer'} a V. Ex.ª:`,
        introEn: 'The applicant requests:',
        pedidos,
        docs: pv.docs,
        procuracao: pv.procuracao,
      }),
    ];
    return blocks;
  },
});
