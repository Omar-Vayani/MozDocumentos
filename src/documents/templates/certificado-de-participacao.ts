import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { dateLong, g, l, localField, placeDate } from './_shared';

// Certificate of attendance for a course, workshop or event: A4 landscape,
// framed, centred. Private certificates do not replace the diplomas and
// certificates of the national education system.

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function periodo(inicio: unknown, fim: unknown): string {
  const a = str(inicio);
  const b = str(fim);
  if (a && b && a !== b) return `de ${dateLong(a)} a ${dateLong(b)}`;
  return a ? `em ${dateLong(a)}` : `em ${dateLong('')}`;
}

export default defineTemplate({
  id: 'certificado-de-participacao',
  family: 'declaracao',
  page: 'A4-paisagem',
  verticalAlign: 'center',
  frame: 'double',
  letterhead: false,
  sections: [
    { id: 'participante', title: l('Participante', 'Participant') },
    { id: 'evento', title: l('Curso ou evento', 'Course or event') },
    { id: 'assinaturas', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    { name: 'participanteNome', type: 'text', section: 'participante', label: l('Nome do participante', "Participant's name"), required: true },
    {
      name: 'participanteGenero',
      type: 'radio',
      section: 'participante',
      label: l('Tratamento', 'Form of address'),
      options: [
        { value: 'M', label: l('Masculino', 'Male') },
        { value: 'F', label: l('Feminino', 'Female') },
      ],
      default: 'M',
    },
    {
      name: 'tipo',
      type: 'select',
      section: 'evento',
      label: l('Tipo', 'Type'),
      width: 'half',
      options: [
        { value: 'participacao', label: l('Participação', 'Attendance') },
        { value: 'frequencia', label: l('Frequência (com aproveitamento)', 'Completion') },
        { value: 'merito', label: l('Mérito / reconhecimento', 'Merit / recognition') },
      ],
      default: 'participacao',
    },
    {
      name: 'modalidade',
      type: 'select',
      section: 'evento',
      label: l('Evento', 'Event'),
      width: 'half',
      options: [
        { value: 'no curso', label: l('Curso', 'Course') },
        { value: 'no workshop', label: l('Workshop', 'Workshop') },
        { value: 'no seminário', label: l('Seminário', 'Seminar') },
        { value: 'na conferência', label: l('Conferência', 'Conference') },
        { value: 'na formação', label: l('Formação', 'Training') },
      ],
      default: 'no curso',
    },
    { name: 'titulo', type: 'text', section: 'evento', label: l('Título do curso ou evento', 'Title'), required: true },
    {
      name: 'organizador',
      type: 'text',
      section: 'evento',
      label: l('Organizado por', 'Organised by'),
      default: (c) => profileDisplayName(c.profile),
    },
    { name: 'dataInicio', type: 'date', section: 'evento', label: l('Data (ou início)', 'Date (or start)'), width: 'half', default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'evento', label: l('Fim (opcional)', 'End (optional)'), width: 'half' },
    { name: 'cargaHoraria', type: 'number', section: 'evento', label: l('Carga horária (horas)', 'Duration (hours)'), width: 'half', min: 0 },
    localField('evento'),
    {
      name: 'motivo',
      type: 'textarea',
      section: 'evento',
      label: l('Motivo do reconhecimento', 'Reason for recognition'),
      rows: 2,
      showIf: (v) => v.tipo === 'merito',
    },
    { name: 'assinante1Nome', type: 'text', section: 'assinaturas', label: l('1.º signatário', 'First signatory'), width: 'half', default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'assinante1Cargo', type: 'text', section: 'assinaturas', label: l('Cargo', 'Position'), width: 'half', default: (c) => c.profile?.representanteCargo ?? '' },
    { name: 'assinante2Nome', type: 'text', section: 'assinaturas', label: l('2.º signatário (opcional)', 'Second signatory (optional)'), width: 'half' },
    { name: 'assinante2Cargo', type: 'text', section: 'assinaturas', label: l('Cargo', 'Position'), width: 'half' },
    { name: 'codigo', type: 'text', section: 'assinaturas', label: l('Número do certificado (opcional)', 'Certificate number (optional)'), width: 'half' },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.participanteGenero === 'F';
    const merito = v.tipo === 'merito';
    const titulo = merito ? 'Certificado de Mérito' : v.tipo === 'frequencia' ? 'Certificado de Frequência' : 'Certificado de Participação';
    const horas = Number(v.cargaHoraria) > 0 ? `, com a duração de ${Number(v.cargaHoraria)} ${Number(v.cargaHoraria) === 1 ? 'hora' : 'horas'}` : '';
    const org = str(v.organizador);
    const corpo = merito
      ? `em reconhecimento ${str(v.motivo) ? `de ${str(v.motivo).replace(/[.]$/, '')}` : 'do seu mérito'}${str(v.titulo) ? `, no âmbito ${str(v.modalidade).replace(/^n/, 'd')} «${str(v.titulo)}»` : ''}.`
      : `${v.tipo === 'frequencia' ? `frequentou com aproveitamento` : 'participou'} ${str(v.modalidade) || 'no curso'} «${str(v.titulo) || '____________________'}»${org ? `, organizado por ${org}` : ''}, realizado ${str(v.local) ? `em ${str(v.local)}, ` : ''}${periodo(v.dataInicio, v.dataFim)}${horas}.`;
    const cols: SignatureColumn[] = [{ role: str(v.assinante1Cargo) || ' ', name: str(v.assinante1Nome) || undefined, image: 'both' }];
    if (str(v.assinante2Nome)) cols.push({ role: str(v.assinante2Cargo) || ' ', name: str(v.assinante2Nome) });
    const blocks: Block[] = [
      { type: 'logo', size: 'md' },
      { type: 'display', text: titulo, size: 'xxl', uppercase: true, tone: 'accent', weight: 'bold', after: 4 },
      { type: 'ornament', style: 'tricolour' },
      { type: 'display', text: `Certifica-se que ${g(v.participanteGenero, 'o senhor', 'a senhora')}`, size: 'sm', italic: true, tone: 'muted', after: 6 },
      { type: 'display', text: str(v.participanteNome) || '____________________', size: 'xl', weight: 'bold', after: 8 },
      { type: 'display', text: corpo, size: 'md', after: 16 },
      { type: 'signatures', placeDate: undefined, columns: cols },
      { type: 'display', text: [placeDate(ctx, v.dataFim || v.dataInicio), str(v.codigo) ? `Certificado n.º ${str(v.codigo)}` : ''].filter(Boolean).join('   ·   '), size: 'xs', tone: 'muted', after: 0 },
    ];
    void f;
    return blocks;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (v.tipo === 'frequencia')
      out.push({
        level: 'info',
        field: 'tipo',
        message: l(
          'Um certificado privado não substitui os certificados e diplomas do sistema nacional de educação nem os da formação profissional acreditada.',
          'A private certificate does not replace national education diplomas or accredited vocational certificates.',
        ),
      });
    return out;
  },
  personName: (v) => str(v.participanteNome) || undefined,
  documentDate: (v) => str(v.dataFim) || str(v.dataInicio) || undefined,
});
