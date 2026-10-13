import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { GENERO_OPTIONS, dateField, dateLong, g, l } from './_shared';
import { FRASE_LUTO_OPTIONS, disp, emLocal, plural, str, TRATAMENTO_FALECIDO_OPTIONS } from './_eventos';

// Condolence notice from an organisation ("Nota de Pesar"), A5, black and grey:
// the organisation announces the death of an employee, member or a relative
// of one, and offers condolences to the bereaved family.

const PARENTESCO: Record<string, [string, string]> = {
  pai: ['pai', 'pai'],
  mae: ['mãe', 'mãe'],
  conjuge: ['esposo', 'esposa'],
  filho: ['filho', 'filha'],
  irmao: ['irmão', 'irmã'],
  avo: ['avô', 'avó'],
};

export default defineTemplate({
  id: 'nota-de-pesar',
  family: 'declaracao',
  page: 'A5',
  frame: 'simple',
  verticalAlign: 'center',
  noBrand: true,
  letterhead: false,
  style: { mono: true, font: 'classico' },
  sections: [
    { id: 'entidade', title: l('Entidade', 'Organisation') },
    { id: 'falecido', title: l('A pessoa falecida', 'The deceased') },
    { id: 'texto', title: l('Texto', 'Text') },
  ],
  fields: [
    {
      name: 'quemComunica',
      type: 'text',
      section: 'entidade',
      required: true,
      label: l('Quem comunica', 'From'),
      default: (c) => (c.profile?.kind === 'empresa' ? `O Conselho de Administração, a Direcção e os Trabalhadores da ${profileDisplayName(c.profile)}` : ''),
    },
    { name: 'mostrarLogo', type: 'toggle', section: 'entidade', width: 'half', label: l('Mostrar o logótipo', 'Show the logo'), default: true },
    { name: 'assinatura', type: 'text', section: 'entidade', width: 'half', label: l('Assinatura', 'Signed'), default: 'A Administração' },
    {
      name: 'relacao',
      type: 'radio',
      section: 'falecido',
      label: l('A pessoa falecida é', 'The deceased is'),
      options: [
        { value: 'colaborador', label: l('Colaborador(a) ou membro', 'Employee or member') },
        { value: 'familiar', label: l('Familiar de um colaborador', "An employee's relative") },
      ],
      default: 'colaborador',
    },
    { name: 'falecidoTratamento', type: 'select', section: 'falecido', width: 'third', label: l('Título', 'Title'), options: TRATAMENTO_FALECIDO_OPTIONS, default: '' },
    { name: 'falecidoNome', type: 'text', section: 'falecido', required: true, label: l('Nome', 'Name') },
    { name: 'falecidoGenero', type: 'radio', section: 'falecido', width: 'half', label: l('Género', 'Gender'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'falecidoCargo', type: 'text', section: 'falecido', width: 'half', label: l('Cargo ou função', 'Position'), showIf: (v) => v.relacao !== 'familiar' },
    { name: 'anosServico', type: 'number', section: 'falecido', width: 'half', min: 0, max: 60, label: l('Anos de serviço (opcional)', 'Years of service (optional)'), showIf: (v) => v.relacao !== 'familiar' },
    {
      name: 'parentesco',
      type: 'select',
      section: 'falecido',
      width: 'half',
      label: l('Parentesco', 'Relationship'),
      options: [
        { value: 'pai', label: l('Pai / mãe', 'Father / mother') },
        { value: 'conjuge', label: l('Cônjuge', 'Spouse') },
        { value: 'filho', label: l('Filho(a)', 'Child') },
        { value: 'irmao', label: l('Irmão / irmã', 'Sibling') },
        { value: 'avo', label: l('Avô / avó', 'Grandparent') },
      ],
      default: 'pai',
      showIf: (v) => v.relacao === 'familiar',
    },
    { name: 'colaboradorNome', type: 'text', section: 'falecido', width: 'half', label: l('Nome do colaborador', "Employee's name"), showIf: (v) => v.relacao === 'familiar' },
    { name: 'colaboradorGenero', type: 'radio', section: 'falecido', width: 'half', label: l('Género do colaborador', "Employee's gender"), options: GENERO_OPTIONS, default: 'M', showIf: (v) => v.relacao === 'familiar' },
    { name: 'colaboradorCargo', type: 'text', section: 'falecido', width: 'half', label: l('Cargo do colaborador', "Employee's position"), showIf: (v) => v.relacao === 'familiar' },
    { name: 'dataFalecimento', type: 'date', section: 'falecido', width: 'half', required: true, label: l('Data do falecimento', 'Date of death') },
    { name: 'localFalecimento', type: 'text', section: 'falecido', width: 'half', label: l('Local', 'Place') },
    { name: 'funeral', type: 'textarea', section: 'texto', rows: 2, label: l('Informação do funeral (opcional)', 'Funeral details (optional)'), placeholder: l('O funeral realiza-se no sábado, 17 de Outubro, às 10h00, no Cemitério de Lhanguene.', 'Funeral details') },
    dateField('data', 'texto'),
    { name: 'fraseFinal', type: 'select', section: 'texto', width: 'half', label: l('Fórmula final', 'Closing'), options: FRASE_LUTO_OPTIONS, default: 'Paz à sua alma.' },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const quem = str(v.quemComunica) || 'A Direcção';
    const pl = plural(quem);
    const nome = [str(v.falecidoTratamento), str(v.falecidoNome) || '____________________'].filter(Boolean).join(' ');
    const quando = `ocorrido no dia ${dateLong(v.dataFalecimento)}${emLocal(v.localFalecimento)}`;
    let corpo: string;
    if (v.relacao === 'familiar') {
      const p = PARENTESCO[str(v.parentesco)] ?? PARENTESCO.pai;
      const rel = v.parentesco === 'pai' ? g(v.falecidoGenero, 'pai', 'mãe') : g(v.falecidoGenero, p[0], p[1]);
      const colega = `${g(v.colaboradorGenero, 'do nosso colega', 'da nossa colega')} ${str(v.colaboradorNome) || '____________________'}${str(v.colaboradorCargo) ? `, ${str(v.colaboradorCargo)}` : ''}`;
      corpo = `${quem} ${pl ? 'comunicam' : 'comunica'}, com profunda consternação, o falecimento de **${nome}**, ${rel} ${colega}, ${quando}.`;
    } else {
      const cargo = str(v.falecidoCargo) ? `, ${str(v.falecidoCargo)}` : '';
      corpo = `${quem} ${pl ? 'comunicam' : 'comunica'}, com profunda consternação, o falecimento ${g(v.falecidoGenero, 'do seu colaborador', 'da sua colaboradora')} **${nome}**${cargo}, ${quando}.`;
    }
    const out: Block[] = [];
    if (v.mostrarLogo !== false) out.push({ type: 'logo', size: 'sm' });
    out.push(disp('Nota de Pesar', 'md', { uppercase: true, after: 6 }));
    out.push(disp(str(v.falecidoNome) ? nome : '____________________', 'lg', { weight: 'bold', fit: true, after: 2 }));
    out.push({ type: 'ornament', style: 'rule' });
    out.push({ type: 'paragraph', id: 'np-corpo', text: corpo, en: 'The organisation announces with deep sorrow the death of the person named.', align: 'center' });
    if (v.relacao !== 'familiar' && Number(v.anosServico) > 0) {
      const n = Math.round(Number(v.anosServico));
      out.push({
        type: 'paragraph',
        id: 'np-servico',
        text: `${g(v.falecidoGenero, 'O malogrado', 'A malograda')} serviu a instituição durante ${n} ${n === 1 ? 'ano' : 'anos'}, com dedicação e profissionalismo, e deixa a todos uma memória de exemplo.`,
        en: 'The deceased served the organisation with dedication.',
        align: 'center',
      });
    }
    out.push({
      type: 'paragraph',
      id: 'np-condolencias',
      text: `Neste momento de dor, ${pl ? 'endereçam' : 'endereça'} à família enlutada as mais sentidas condolências.`,
      en: 'In this time of grief, we extend our deepest condolences to the bereaved family.',
      align: 'center',
    });
    if (str(v.funeral)) out.push({ type: 'paragraph', id: 'np-funeral', text: str(v.funeral), en: 'Funeral details.', align: 'center', size: 'small', editable: false });
    if (str(v.fraseFinal)) out.push(disp(str(v.fraseFinal), 'sm', { italic: true, after: 6 }));
    out.push(disp([str(v.assinatura), dateLong(v.data || ctx.today)].filter(Boolean).join(' · '), 'xs', { tone: 'muted', after: 0 }));
    return out;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (v.relacao === 'familiar' && !str(v.colaboradorNome))
      out.push({ level: 'error', field: 'colaboradorNome', message: l('Indique o nome do colaborador.', "Give the employee's name.") });
    if (!str(v.quemComunica)) out.push({ level: 'warning', field: 'quemComunica', message: l('Indique quem comunica.', 'Say who is announcing.') });
    return out;
  },
  personName: (v) => str(v.falecidoNome) || undefined,
  documentDate: (v) => str(v.dataFalecimento) || undefined,
});
