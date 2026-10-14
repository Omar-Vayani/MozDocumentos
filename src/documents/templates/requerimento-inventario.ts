import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, isF, l, lawyerFields, lineItems, localField, money } from './_shared';
import { courtAddressee, courtFields, partyDesc, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, prova, provaFields, sem, str } from './_processo-civil';

const divorcio = (v: Values) => v.finalidade === 'divorcio';

export default defineTemplate({
  id: 'requerimento-inventario',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e finalidade', 'Court and purpose') },
    { id: 'requerente', title: l('Requerente', 'Applicant'), personRole: 'cliente' },
    { id: 'inventariado', title: l('Falecido (ou casal)', 'Deceased (or couple)') },
    { id: 'interessados', title: l('Herdeiros e interessados', 'Heirs and interested parties') },
    { id: 'cabeca', title: l('Cabeça-de-casal', 'Estate administrator') },
    { id: 'prova', title: l('Documentos', 'Documents') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal'),
    {
      name: 'finalidade',
      type: 'radio',
      section: 'tribunal',
      label: l('Inventário', 'Inventory'),
      default: 'obito',
      options: [
        { value: 'obito', label: l('Por óbito (partilha da herança)', 'On death (estate division)') },
        { value: 'divorcio', label: l('Partilha dos bens do casal após divórcio ou separação', 'Division of common property after divorce') },
      ],
    },
    { name: 'processoDivorcio', type: 'text', section: 'tribunal', width: 'half', label: l('Processo de divórcio n.º', 'Divorce case no.'), showIf: divorcio },
    ...partyFields('requerente', 'requerente', { defaultTipo: 'pessoa' }).filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name)),
    { name: 'qualidadeRequerente', type: 'text', section: 'requerente', width: 'half', label: l('Qualidade do requerente', 'Applicant’s capacity'), default: 'filho do inventariado', placeholder: l('Ex.: cônjuge sobrevivo; filha do inventariado', 'E.g. surviving spouse; daughter') },
    { name: 'falecidoNome', type: 'text', section: 'inventariado', required: true, label: l('Nome do falecido (ou do ex-cônjuge)', 'Name of the deceased (or former spouse)') },
    { name: 'falecidoGenero', type: 'radio', section: 'inventariado', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'falecidoEstadoCivil', type: 'text', section: 'inventariado', width: 'half', label: l('Estado civil e regime de bens', 'Marital status and property regime'), placeholder: l('Ex.: casado com Teresa Lurdes Cossa, no regime de comunhão de adquiridos', 'E.g. married under community of acquired property'), showIf: (v) => !divorcio(v) },
    { name: 'dataObito', type: 'date', section: 'inventariado', width: 'half', label: l('Data do óbito', 'Date of death'), showIf: (v) => !divorcio(v) },
    { name: 'localObito', type: 'text', section: 'inventariado', width: 'half', label: l('Local do óbito', 'Place of death'), showIf: (v) => !divorcio(v) },
    { name: 'ultimoDomicilio', type: 'text', section: 'inventariado', label: l('Último domicílio', 'Last domicile'), showIf: (v) => !divorcio(v) },
    { name: 'testamento', type: 'radio', section: 'inventariado', width: 'half', label: l('Deixou testamento?', 'Left a will?'), default: 'nao', options: [{ value: 'nao', label: l('Não', 'No') }, { value: 'sim', label: l('Sim', 'Yes') }], showIf: (v) => !divorcio(v) },
    { name: 'dataDivorcio', type: 'date', section: 'inventariado', width: 'half', label: l('Divórcio decretado em', 'Divorce granted on'), showIf: divorcio },
    {
      name: 'interessados',
      type: 'lines',
      section: 'interessados',
      label: l('Herdeiros e interessados', 'Heirs and interested parties'),
      addLabel: l('Adicionar interessado', 'Add party'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'qualidade', type: 'text', label: l('Qualidade', 'Capacity'), placeholder: l('Ex.: cônjuge; filho; filha menor', 'E.g. spouse; son') },
        { name: 'morada', type: 'text', label: l('Residência', 'Residence') },
      ],
      default: [],
    },
    { name: 'menores', type: 'toggle', section: 'interessados', label: l('Há herdeiros menores ou incapazes', 'There are minor or incapable heirs') },
    { name: 'cabecaNome', type: 'text', section: 'cabeca', label: l('Cabeça-de-casal proposto', 'Proposed estate administrator') },
    { name: 'cabecaGenero', type: 'radio', section: 'cabeca', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'F' },
    { name: 'cabecaQualidade', type: 'text', section: 'cabeca', width: 'half', label: l('Qualidade', 'Capacity'), placeholder: l('Ex.: cônjuge sobrevivo', 'E.g. surviving spouse') },
    { name: 'valorEstimado', type: 'money', section: 'cabeca', width: 'half', label: l('Valor provisório dos bens (opcional)', 'Provisional value of the assets (optional)') },
    ...provaFields('prova', { testemunhas: false, docsPlaceholder: 'Certidão de óbito\nCertidão de casamento do inventariado\nCertidões de nascimento dos herdeiros\nEscritura de habilitação de herdeiros' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`${cite('pcInventario')}. Depois da nomeação, o cabeça-de-casal presta compromisso e declarações e apresenta a relação de bens (documento «Relação de bens»).`, 'After appointment, the administrator takes the oath, makes a statement and files the list of assets.') },
      { level: 'info', field: 'cabecaNome', message: l(`Ordem legal para o cargo de cabeça-de-casal: ${cite('pcCabecaCasal')}.`, 'Legal order for the estate administrator.') },
    ];
    if (v.menores) w.push({ level: 'info', field: 'menores', message: l('Havendo herdeiros menores ou incapazes, o inventário é em regra obrigatório e intervém o Ministério Público.', 'With minor or incapable heirs, the inventory is usually mandatory and the Public Prosecutor takes part.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.falecidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const div = divorcio(v);
    const Q = g3(v, 'requerente');
    const fF = isF(v.falecidoGenero);
    const falecido = `**${(str(v.falecidoNome) || '____________').toLocaleUpperCase('pt')}**`;
    const interessados = lineItems(v.interessados).filter((i) => str(i.nome));
    const cabF = isF(v.cabecaGenero);
    const cabeca = str(v.cabecaNome) ? `**${str(v.cabecaNome).toLocaleUpperCase('pt')}**${str(v.cabecaQualidade) ? `, ${sem(v.cabecaQualidade)}` : ''}` : '';

    const items: string[] = div
      ? [
          `${Q.O} Requerente e ${falecido} foram casados entre si, tendo o casamento sido dissolvido por divórcio${v.dataDivorcio ? ` decretado em ${dateLong(v.dataDivorcio)}` : ''}${str(v.processoDivorcio) ? `, no processo n.º ${sem(v.processoDivorcio)}` : ''}.`,
          'Existem bens comuns do casal a partilhar, não tendo os ex-cônjuges chegado a acordo quanto à partilha.',
        ]
      : [
          `Em ${dateLong(v.dataObito)}${str(v.localObito) ? `, em ${sem(v.localObito)}` : ''}, faleceu ${falecido}${str(v.falecidoEstadoCivil) ? `, ${sem(v.falecidoEstadoCivil)}` : ''}${str(v.ultimoDomicilio) ? `, com último domicílio em ${sem(v.ultimoDomicilio)}` : ''}, como consta da certidão de óbito junta.`,
          v.testamento === 'sim' ? `${fF ? 'A inventariada' : 'O inventariado'} deixou testamento, cuja cópia se junta.` : `${fF ? 'A inventariada' : 'O inventariado'} não deixou testamento nem qualquer outra disposição de última vontade.`,
          `${Q.O} Requerente é ${sem(v.qualidadeRequerente) || 'herdeiro'}, tendo legitimidade para requerer o inventário.`,
          `${fF ? 'A inventariada' : 'O inventariado'} deixou bens que importa relacionar e partilhar entre os herdeiros.`,
        ];
    if (interessados.length) {
      items.push(`São interessados na partilha: ${interessados.map((i) => `${i.nome}${str(i.qualidade) ? `, ${sem(i.qualidade)}` : ''}${str(i.morada) ? `, residente em ${sem(i.morada)}` : ''}`).join('; ')}.`);
    }
    if (v.menores) items.push('Há interessados menores ou incapazes, pelo que deve intervir o Ministério Público.');
    if (cabeca) items.push(`O cargo de cabeça-de-casal compete, nos termos legais, a ${cabeca}.`);

    const pedidos = [
      div ? 'Ser instaurado o presente inventário para partilha dos bens comuns do casal, por apenso ao processo de divórcio' : `Ser instaurado o presente inventário para partilha dos bens deixados por ${falecido}`,
      cabeca ? `Ser ${cabF ? 'nomeada' : 'nomeado'} cabeça-de-casal ${cabeca}, ${cabF ? 'notificando-a' : 'notificando-o'} para prestar compromisso de honra e declarações e apresentar a relação de bens` : 'Ser nomeado cabeça-de-casal quem a lei designar, para prestar compromisso de honra e declarações e apresentar a relação de bens',
      'Serem citados os interessados e o Ministério Público, quando deva intervir, seguindo-se os ulteriores termos até à partilha',
    ];
    const pv = prova(v);
    const blocks: Block[] = [
      { type: 'courtHeader', addressee: courtAddressee(v), processo: div && str(v.processoDivorcio) ? `${sem(v.processoDivorcio)} (por apenso)` : undefined },
      { type: 'paragraph', id: 'requerente', text: `${partyDesc(v, 'requerente')},`, en: 'Identification of the applicant.' },
      { type: 'paragraph', id: 'vem', text: 'vem, por intermédio do seu mandatário judicial, requerer', en: 'through its lawyer, applies for' },
      { type: 'paragraph', id: 'titulo', align: 'center', text: div ? '**INVENTÁRIO PARA PARTILHA DOS BENS COMUNS DO CASAL**,' : `**INVENTÁRIO**\npor óbito de ${falecido},`, en: 'INVENTORY PROCEEDINGS' },
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      { type: 'articulado', sections: [{ items }] },
      ...closing(ctx, {
        intro: 'Nestes termos, requer a V. Ex.ª:',
        introEn: 'The applicant requests:',
        pedidos,
        valor: money(v.valorEstimado) ?? undefined,
        valorLabel: 'Valor provisório',
        docs: pv.docs,
        procuracao: pv.procuracao,
      }),
    ];
    return blocks;
  },
});
