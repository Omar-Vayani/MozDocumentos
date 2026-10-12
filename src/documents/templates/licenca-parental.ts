import type { LegalRefId } from '@/legal/mz-legal';
import { addDays, addWorkingDays, diffDays, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import {
  blank, cite, dateField, dateLong, exmo, g, GENERO_OPTIONS, l, lineItems, localField, workerFields, workerSignature,
} from './_shared';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateEn = (iso: unknown) => {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  return d ? `${d.getDate()} ${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}` : '____________';
};
const empresaDefault = (c: DefaultsContext) => (c.profile?.kind === 'empresa' ? c.profile.firma || c.profile.nomeComercial || '' : '');
/** "Nos termos do art. X…" / "dos arts. …" / "da Lei …" */
const nosTermos = (id: LegalRefId) => {
  const c = cite(id);
  return `Nos termos ${c.startsWith('arts.') ? 'dos' : c.startsWith('art.') ? 'do' : 'da'} ${c}`;
};

type Maternidade = { dias: number; antesParto: number };
type Paternidade = { dias: number; morteMae: number };

const isMat = (v: Values) => v.tipo !== 'paternidade';

export default defineTemplate({
  id: 'licenca-parental',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador (quem comunica)', 'Employee'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Destinatário', 'Addressee') },
    { id: 'licenca', title: l('Licença', 'Leave') },
  ],
  fields: [
    localField(),
    dateField(),
    {
      name: 'tipo',
      type: 'select',
      section: 'licenca',
      required: true,
      label: l('Tipo de licença', 'Type of leave'),
      options: [
        { value: 'maternidade', label: l('Licença de maternidade', 'Maternity leave') },
        { value: 'paternidade', label: l('Licença de paternidade', 'Paternity leave') },
      ],
      default: 'maternidade',
    },
    ...workerFields(['nome', 'cargo', 'departamento']).map((f) =>
      f.name === 'trabalhadorNome' ? { ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.nome || '' : '') } : f,
    ),
    { name: 'empresaNome', type: 'text', section: 'empresa', required: true, label: l('Empresa (entidade empregadora)', 'Employer'), default: empresaDefault },
    {
      name: 'destinatarioCargo',
      type: 'text',
      section: 'empresa',
      width: 'half',
      label: l('Cargo do destinatário', "Addressee's position"),
      default: 'Director de Recursos Humanos',
    },
    {
      name: 'destinatarioGenero',
      type: 'radio',
      section: 'empresa',
      width: 'half',
      label: l('Tratamento do destinatário', 'Addressee form of address'),
      options: GENERO_OPTIONS,
      default: 'M',
    },
    {
      name: 'dataParto',
      type: 'date',
      section: 'licenca',
      width: 'half',
      required: true,
      label: l('Data do parto (prevista ou efectiva)', 'Birth date (expected or actual)'),
    },
    {
      name: 'partoOcorrido',
      type: 'toggle',
      section: 'licenca',
      label: l('O nascimento já ocorreu', 'The child has been born'),
    },
    {
      name: 'bebeGenero',
      type: 'radio',
      section: 'licenca',
      width: 'half',
      label: l('Recém-nascido', 'Newborn'),
      options: [
        { value: 'M', label: l('Filho', 'Son') },
        { value: 'F', label: l('Filha', 'Daughter') },
      ],
      default: 'M',
      showIf: (v) => Boolean(v.partoOcorrido),
    },
    {
      name: 'situacaoMae',
      type: 'select',
      section: 'licenca',
      label: l('Situação da mãe', "Mother's situation"),
      help: l('Em caso de morte ou incapacidade da mãe, a licença de paternidade é mais longa.', 'If the mother dies or is incapacitated, paternity leave is longer.'),
      options: [
        { value: 'normal', label: l('Normal', 'Normal') },
        { value: 'morte', label: l('Morte da mãe', 'Death of the mother') },
        { value: 'incapacidade', label: l('Incapacidade da mãe', 'Incapacity of the mother') },
      ],
      default: 'normal',
      showIf: (v) => v.tipo === 'paternidade',
    },
    {
      name: 'dataInicio',
      type: 'date',
      section: 'licenca',
      width: 'half',
      label: l('Início da licença (opcional)', 'Leave start (optional)'),
      help: l(
        'Por defeito: maternidade, na data do parto; paternidade, no dia seguinte ao nascimento. A licença de maternidade pode começar antes do parto, dentro do limite legal.',
        'Default: maternity, on the birth date; paternity, the day after the birth. Maternity leave may start before the birth, within the legal limit.',
      ),
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'licenca',
      label: l('Documentos anexos', 'Attached documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [
        {
          name: 'descricao',
          type: 'text',
          label: l('Documento', 'Document'),
          placeholder: l('Ex.: Atestado médico com a data prevista do parto', 'E.g. Medical certificate with the expected birth date'),
        },
      ],
      default: [],
    },
  ],

  computed: (v, { legal }) => {
    const m = legal.value<Maternidade>('licencaMaternidade');
    const p = legal.value<Paternidade>('licencaPaternidade');
    const mat = isMat(v);
    const alargada = !mat && (v.situacaoMae === 'morte' || v.situacaoMae === 'incapacidade');
    const dias = mat ? m.dias : alargada ? p.morteMae : p.dias;
    const parto: string = v.dataParto || '';
    const inicioCalc = parto ? (mat ? parto : addDays(parto, 1)) : '';
    const inicio: string = v.dataInicio || inicioCalc;
    const fim = inicio ? addDays(inicio, dias - 1) : '';
    return {
      mat,
      alargada,
      dias,
      antesParto: m.antesParto,
      inicio,
      fim,
      regresso: fim ? addWorkingDays(fim, 1) : '',
      maisCedo: parto ? (mat ? addDays(parto, -m.antesParto) : addDays(parto, 1)) : '',
      anexos: lineItems(v.anexos).map((r) => String(r.descricao ?? '').trim()).filter(Boolean),
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (!v.dataParto) {
      w.push({ level: 'warning', field: 'dataParto', message: l('Indique a data do parto (prevista ou efectiva).', 'Enter the birth date (expected or actual).') });
    }
    if (c.maisCedo && c.inicio && diffDays(c.maisCedo, c.inicio) < 0) {
      w.push({
        level: 'warning',
        field: 'dataInicio',
        message: c.mat
          ? l(
              `A licença de maternidade só pode começar até ${c.antesParto} dias antes da data prevista do parto (${cite('licencaMaternidade')}).`,
              `Maternity leave may start at most ${c.antesParto} days before the expected birth date.`,
            )
          : l(
              `A licença de paternidade conta-se a partir do dia seguinte ao nascimento (${cite('licencaPaternidade')}).`,
              'Paternity leave runs from the day after the birth.',
            ),
      });
    }
    if (!c.mat && c.maisCedo && c.inicio && diffDays(c.maisCedo, c.inicio) > 0) {
      w.push({
        level: 'info',
        field: 'dataInicio',
        message: l(
          `A lei prevê que a licença de paternidade comece no dia seguinte ao nascimento (${cite('licencaPaternidade')}).`,
          'The law provides that paternity leave starts the day after the birth.',
        ),
      });
    }
    if (c.anexos.length === 0) {
      w.push({
        level: c.alargada ? 'warning' : 'info',
        field: 'anexos',
        message: c.mat
          ? l('Junte o atestado médico com a data prevista do parto ou o registo de nascimento.', 'Attach the medical certificate with the expected birth date or the birth registration.')
          : c.alargada
            ? l('Junte o comprovativo da morte ou incapacidade da mãe e o registo de nascimento.', "Attach proof of the mother's death or incapacity and the birth registration.")
            : l('Junte o registo de nascimento (cédula pessoal ou certidão) quando o tiver.', 'Attach the birth registration once available.'),
      });
    }
    if (!v.empresaNome) {
      w.push({ level: 'warning', field: 'empresaNome', message: l('Indique o nome da empresa.', 'Enter the employer name.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const mat: boolean = c.mat;
    const dg = v.destinatarioGenero;
    const anexos: string[] = c.anexos;
    const ocorrido = Boolean(v.partoOcorrido);
    const filho = v.bebeGenero === 'F' ? { pt: 'da minha filha', en: 'my daughter' } : { pt: 'do meu filho', en: 'my son' };
    const funcao = v.trabalhadorCargo
      ? `, com a função de ${v.trabalhadorCargo}${v.trabalhadorDepartamento ? ` (${v.trabalhadorDepartamento})` : ''}`
      : '';
    const eu = `Eu, **${blank(v.trabalhadorNome)}**, ${mat ? 'trabalhadora' : 'trabalhador'} desta empresa${funcao}`;
    const tipoPt = mat ? 'maternidade' : 'paternidade';
    const tipoEn = mat ? 'maternity' : 'paternity';
    const previsto = !mat && !ocorrido;

    const blocks: Block[] = [
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(dg),
        lines: [v.destinatarioCargo || g(dg, 'Director de Recursos Humanos', 'Directora de Recursos Humanos'), v.empresaNome || ''],
      },
      { type: 'subject', text: `Comunicação de licença de ${tipoPt}` },
      { type: 'salutation', text: `${exmo(dg)},` },
      {
        type: 'paragraph',
        id: 'parto',
        text: ocorrido
          ? `${eu}, comunico a V. Ex.ª o nascimento ${filho.pt}, ocorrido em **${dateLong(v.dataParto)}**.`
          : mat
            ? `${eu}, comunico a V. Ex.ª que a data prevista do meu parto é **${dateLong(v.dataParto)}**.`
            : `${eu}, comunico a V. Ex.ª que a data prevista do nascimento é **${dateLong(v.dataParto)}**.`,
        en: ocorrido
          ? `I, ${blank(v.trabalhadorNome)}, an employee of this company, inform you of the birth of ${filho.en} on ${dateEn(v.dataParto)}.`
          : `I, ${blank(v.trabalhadorNome)}, an employee of this company, inform you that the expected birth date is ${dateEn(v.dataParto)}.`,
      },
    ];
    if (c.alargada) {
      blocks.push({
        type: 'paragraph',
        id: 'mae',
        text: `Em virtude ${v.situacaoMae === 'morte' ? 'da morte' : 'da incapacidade'} da mãe da criança, a licença de paternidade tem a duração alargada prevista na lei.`,
        en: `Because of the ${v.situacaoMae === 'morte' ? 'death' : 'incapacity'} of the child's mother, paternity leave has the extended duration provided by law.`,
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'licenca',
      text: `${nosTermos(mat ? 'licencaMaternidade' : 'licencaPaternidade')}, irei gozar a licença de ${tipoPt} de **${c.dias} dias**${mat ? ' consecutivos' : ''}, com início${previsto ? ' previsto' : ''} em **${dateLong(c.inicio)}** e termo em **${dateLong(c.fim)}**, devendo retomar o serviço no dia **${dateLong(c.regresso)}**.`,
      en: `Under the Labour Law I will take ${tipoEn} leave of ${c.dias} days${mat ? ' in a row' : ''}, from ${dateEn(c.inicio)} to ${dateEn(c.fim)}, returning to work on ${dateEn(c.regresso)}.`,
    });
    if (previsto) {
      blocks.push({
        type: 'paragraph',
        id: 'confirmacao',
        text: 'As datas indicadas serão confirmadas após o nascimento, com a apresentação do respectivo comprovativo.',
        en: 'These dates will be confirmed after the birth, with the corresponding proof.',
      });
    }
    if (anexos.length) blocks.push({ type: 'annexList', items: anexos });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      {
        type: 'signatures',
        columns: [{ ...workerSignature(v, mat ? 'A Trabalhadora' : 'O Trabalhador'), detail: v.trabalhadorCargo || undefined }],
      },
      { type: 'acknowledgement', text: 'Recebido em ___/___/______.', signer: 'Pela entidade empregadora' },
    );
    return blocks;
  },
});
