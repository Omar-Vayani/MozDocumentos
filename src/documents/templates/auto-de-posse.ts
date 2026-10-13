// Auto de Posse (or Termo de Posse): record of the formal act in which an
// appointed official takes office, read aloud and signed by the person
// conferring office, the appointee and the official who drew it up.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, DOC_TIPO_OPTIONS, GENERO_OPTIONS, cite, dateField, dateLong, g, l, localField } from './_shared';
import { dataPorExtenso, estadoWarnings, str } from './_estado';

const PROVIMENTO: Record<string, string> = {
  categoria: 'da categoria de',
  cargo: 'do cargo de',
  funcao: 'da função de direcção e chefia de',
};

export default defineTemplate({
  id: 'auto-de-posse',
  family: 'oficio',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Acto', 'Ceremony') },
    { id: 'empossado', title: l('Quem toma posse', 'Appointee'), personRole: 'trabalhador' },
    { id: 'nomeacao', title: l('Nomeação', 'Appointment') },
    { id: 'empossante', title: l('Quem confere a posse e quem lavra o auto', 'Who confers office and who drafts the record') },
    { id: 'compromisso', title: l('Compromisso de honra', 'Solemn commitment') },
  ],
  fields: [
    {
      name: 'titulo',
      type: 'radio',
      section: 'documento',
      label: l('Título', 'Heading'),
      options: [
        { value: 'Auto de Posse', label: l('Auto de Posse', 'Auto de Posse') },
        { value: 'Termo de Posse', label: l('Termo de Posse', 'Termo de Posse') },
      ],
      default: 'Auto de Posse',
    },
    localField(),
    dateField('data', 'documento', l('Data do acto de posse', 'Date of the ceremony')),
    {
      name: 'localActo',
      type: 'text',
      section: 'documento',
      label: l('Sala ou gabinete', 'Room or office'),
      placeholder: l('Ex.: Gabinete do Director Provincial de Saúde', 'E.g. Office of the Provincial Health Director'),
    },
    { name: 'dataExtenso', type: 'toggle', section: 'documento', label: l('Data por extenso', 'Date in words'), default: true },
    { name: 'empossadoNome', type: 'text', section: 'empossado', required: true, label: l('Nome completo', 'Full name'), personKey: 'nome' },
    { name: 'empossadoGenero', type: 'radio', section: 'empossado', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'empossadoDocTipo', type: 'select', section: 'empossado', width: 'half', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', personKey: 'docTipo' },
    { name: 'empossadoDocNumero', type: 'text', section: 'empossado', width: 'half', label: l('Número do documento', 'Document number'), personKey: 'docNumero' },
    {
      name: 'tipoProvimento',
      type: 'select',
      section: 'nomeacao',
      width: 'half',
      label: l('Toma posse', 'Takes office as'),
      options: [
        { value: 'cargo', label: l('De um cargo', 'A post') },
        { value: 'categoria', label: l('De uma categoria (ingresso ou promoção)', 'A career grade (entry or promotion)') },
        { value: 'funcao', label: l('De uma função de direcção e chefia', 'A management position') },
      ],
      default: 'cargo',
    },
    {
      name: 'cargo',
      type: 'text',
      section: 'nomeacao',
      width: 'half',
      required: true,
      label: l('Cargo, categoria ou função', 'Post, grade or position'),
      placeholder: l('Ex.: Director do Hospital Distrital de Ribáuè', 'E.g. Director of Ribáuè District Hospital'),
    },
    {
      name: 'actoNomeacao',
      type: 'text',
      section: 'nomeacao',
      required: true,
      label: l('Acto de nomeação', 'Appointment act'),
      placeholder: l('Ex.: Despacho do Governador da Província de Nampula, de 2 de Outubro de 2026', 'E.g. Order of the Governor of Nampula, of 2 October 2026'),
    },
    { name: 'dataNotificacao', type: 'date', section: 'nomeacao', width: 'half', label: l('Data da notificação ao nomeado (opcional)', 'Date the appointee was notified (optional)') },
    {
      name: 'vistoTA',
      type: 'select',
      section: 'nomeacao',
      width: 'half',
      label: l('Tribunal Administrativo', 'Administrative Court'),
      options: [
        { value: '', label: l('Não indicar', 'Do not state') },
        { value: 'visado', label: l('Nomeação visada', 'Appointment cleared (visto)') },
        { value: 'anotado', label: l('Nomeação anotada', 'Appointment noted (anotação)') },
      ],
      default: '',
    },
    { name: 'vistoData', type: 'date', section: 'nomeacao', width: 'half', label: l('Data do visto ou anotação', 'Date of clearance'), showIf: (v) => Boolean(v.vistoTA) },
    { name: 'empossanteNome', type: 'text', section: 'empossante', width: 'half', required: true, label: l('Quem confere a posse', 'Who confers office'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'empossanteGenero', type: 'radio', section: 'empossante', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'empossanteCargo', type: 'text', section: 'empossante', width: 'half', required: true, label: l('Cargo de quem confere a posse', 'Position'), default: (c) => c.profile?.representanteCargo ?? '' },
    {
      name: 'empossanteExcelencia',
      type: 'toggle',
      section: 'empossante',
      width: 'half',
      label: l('Tratar por «Sua Excelência»', 'Address as “His/Her Excellency”'),
      help: l('Para Ministros, Governadores, Secretários de Estado e equiparados.', 'For Ministers, Governors, Secretaries of State and equivalent.'),
      default: false,
    },
    { name: 'lavradorNome', type: 'text', section: 'empossante', width: 'half', label: l('Quem lavra o auto', 'Who drafts the record') },
    { name: 'lavradorCargo', type: 'text', section: 'empossante', width: 'half', label: l('Cargo de quem lavra o auto', 'Drafter’s position'), placeholder: l('Ex.: Chefe da Repartição de Recursos Humanos', 'E.g. Head of HR') },
    {
      name: 'formula',
      type: 'radio',
      section: 'compromisso',
      label: l('Fórmula', 'Wording'),
      options: [
        { value: 'geral', label: l('Funcionários em geral', 'Officials in general') },
        { value: 'presidente', label: l('Nomeados pelo Presidente da República', 'Appointed by the President of the Republic') },
      ],
      default: 'geral',
    },
    {
      name: 'formulaTexto',
      type: 'textarea',
      section: 'compromisso',
      rows: 4,
      label: l('Texto do compromisso (opcional)', 'Wording of the commitment (optional)'),
      help: l(
        'Deixe vazio para usar a fórmula guardada nas definições legais. Confirme-a com o Regulamento do Estatuto Geral dos Funcionários e Agentes do Estado antes do acto.',
        'Leave empty to use the stored wording. Check it against the Regulation of the General Statute of State Officials before the ceremony.',
      ),
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    const prazo = ctx.legal.value<number>('possePrazo');
    if (v.dataNotificacao && v.data) {
      const d = diffDays(v.dataNotificacao, v.data);
      if (d < 0) {
        w.push({ level: 'error', field: 'dataNotificacao', message: l('A data da notificação é posterior à da posse.', 'The notification date is after the ceremony.') });
      } else if (d > prazo) {
        w.push({
          level: 'warning',
          field: 'data',
          message: l(
            `A posse deve ser tomada no prazo de ${prazo} dias a contar da notificação, prorrogável uma vez por igual período (${cite('possePrazo')}). Confirme que houve prorrogação.`,
            `Office must be taken within ${prazo} days of notification, extendable once for the same period. Check that an extension was granted.`,
          ),
        });
      }
    }
    if (!v.vistoTA) {
      w.push({
        level: 'info',
        field: 'vistoTA',
        message: l(
          `Se a nomeação está sujeita a visto do Tribunal Administrativo, a posse só tem lugar depois do visto (${cite('posseActo')} — confirmar).`,
          'If the appointment needs the Administrative Court’s clearance, office is only taken after it.',
        ),
      });
    }
    w.push({
      level: 'info',
      field: 'formulaTexto',
      message: l('Confirme a fórmula do compromisso de honra no Regulamento antes do acto.', 'Check the wording of the solemn commitment in the Regulation before the ceremony.'),
    });
    return w;
  },

  personName: (v) => v.empossadoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fE = v.empossadoGenero === 'F';
    const nome = str(v.empossadoNome) || BLANK;
    const quando = v.dataExtenso === false ? `No dia ${dateLong(v.data)}` : dataPorExtenso(v.data);
    const sala = str(v.localActo).replace(/[.,;]+$/, '');
    const onde = `nesta cidade de ${ctx.place}${sala ? `, ${/^(no|na)\s/i.test(sala) ? sala : `no ${sala}`}` : ''}`;
    const perante = v.empossanteExcelencia
      ? `perante Sua Excelência ${g(v.empossanteGenero, 'o Senhor', 'a Senhora')} ${str(v.empossanteNome) || BLANK}, ${str(v.empossanteCargo) || BLANK}`
      : `perante ${g(v.empossanteGenero, 'o Senhor', 'a Senhora')} ${str(v.empossanteNome) || BLANK}, ${str(v.empossanteCargo) || BLANK}`;
    const doc = str(v.empossadoDocNumero) ? `, ${fE ? 'portadora' : 'portador'} do ${str(v.empossadoDocTipo) || 'BI'} n.º ${str(v.empossadoDocNumero)}` : '';
    const visto = v.vistoTA === 'visado'
      ? `, visado pelo Tribunal Administrativo em ${dateLong(v.vistoData)}`
      : v.vistoTA === 'anotado'
        ? `, anotado pelo Tribunal Administrativo em ${dateLong(v.vistoData)}`
        : '';
    const de = PROVIMENTO[v.tipoProvimento as string] ?? PROVIMENTO.cargo;

    const formulas = ctx.legal.value<{ geral: string; presidente: string }>('posseCompromissoHonra');
    const base = str(v.formulaTexto) || (v.formula === 'presidente' ? formulas.presidente : formulas.geral);
    const formula = base.replace('{nome}', nome);
    const lavrador = str(v.lavradorNome) || BLANK;
    const lavCargo = str(v.lavradorCargo);

    const blocks: Block[] = [
      { type: 'title', text: str(v.titulo) || 'Auto de Posse' },
      {
        type: 'paragraph',
        id: 'acto',
        text: `${quando}, ${onde}, ${perante}, compareceu ${g(v.empossadoGenero, 'o Senhor', 'a Senhora')} **${nome.toLocaleUpperCase('pt')}**${doc}, a fim de tomar posse ${de} **${str(v.cargo) || BLANK}**, para ${v.tipoProvimento === 'categoria' || v.tipoProvimento === 'funcao' ? 'a' : 'o'} qual foi ${fE ? 'nomeada' : 'nomeado'} por ${str(v.actoNomeacao) || BLANK}${visto}.`,
        en: 'Date and place of the ceremony, who confers office, the appointee and the appointment act.',
      },
      {
        type: 'paragraph',
        id: 'compromisso-intro',
        text: `Lido o presente auto, ${fE ? 'a empossada' : 'o empossado'} prestou o seguinte compromisso de honra:`,
        keepWithNext: true,
        en: 'After the record was read, the appointee made the following solemn commitment:',
      },
      { type: 'paragraph', id: 'compromisso', text: `«${formula.replace(/^«|»$/g, '')}»`, indent: true, en: 'Solemn commitment to serve the State and the people of Mozambique.' },
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `Em seguida, foi-lhe conferida a posse. E, para constar, se lavrou o presente auto que, depois de lido e achado conforme, vai ser assinado ${g(v.empossanteGenero, 'pelo empossante', 'pela empossante')}, ${fE ? 'pela empossada' : 'pelo empossado'} e por mim, ${lavrador}${lavCargo ? `, ${lavCargo}` : ''}, que o lavrei.`,
        keepWithNext: true,
        en: 'Office was then conferred. This record, read and found correct, is signed by the person conferring office, the appointee and the drafter.',
      },
      {
        type: 'signatures',
        columns: [
          { role: g(v.empossanteGenero, 'O Empossante', 'A Empossante'), name: str(v.empossanteNome) || undefined, detail: str(v.empossanteCargo) || undefined, image: 'both' },
          { role: fE ? 'A Empossada' : 'O Empossado', name: str(v.empossadoNome) || undefined },
          { role: 'Lavrou o auto', name: str(v.lavradorNome) || undefined, detail: lavCargo || undefined },
        ],
      },
    ];
    return blocks;
  },
});
