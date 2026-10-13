import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { cite, dateLong, l, lineItems, localField } from './_shared';
import { disp, periodo, str } from './_eventos';

// Certificate of attendance for a course, workshop, seminar or conference:
// A4 landscape, double frame, centred, serif. It proves attendance only — a
// private certificate does not confer a professional qualification of the
// national system, so the wording never says "diploma" or "qualificação".
// One page per participant when a list of participants is given.

const EVENTOS: { value: string; label: [string, string] }[] = [
  { value: 'no workshop', label: ['Workshop', 'Workshop'] },
  { value: 'no seminário', label: ['Seminário', 'Seminar'] },
  { value: 'no curso', label: ['Curso de curta duração', 'Short course'] },
  { value: 'na formação', label: ['Formação', 'Training'] },
  { value: 'na conferência', label: ['Conferência', 'Conference'] },
  { value: 'na palestra', label: ['Palestra', 'Talk'] },
  { value: 'no webinar', label: ['Webinar', 'Webinar'] },
  { value: 'nas jornadas', label: ['Jornadas', 'Symposium'] },
];

const TITULOS: Record<string, [string, string]> = {
  participacao: ['Certificado', 'de Participação'],
  presenca: ['Certificado', 'de Presença'],
  frequencia: ['Certificado', 'de Frequência'],
  conclusao: ['Certificado', 'de Conclusão'],
  merito: ['Certificado', 'de Mérito'],
};

/** "MF-2026-031" + 2 → "MF-2026-033" (keeps the zero padding). */
function nextNumber(base: string, i: number): string {
  if (!base || i === 0) return base;
  const m = /(\d+)(\D*)$/.exec(base);
  if (!m) return `${base}-${i + 1}`;
  const n = String(Number(m[1]) + i).padStart(m[1].length, '0');
  return base.slice(0, m.index) + n + m[2];
}

/** Short verification code from the certificate data (not a security feature). */
function codigoVerificacao(...parts: string[]): string {
  let h = 2166136261;
  for (const ch of parts.join('|')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const a = h.toString(36).toUpperCase().padStart(7, '0').slice(-8);
  return `${a.slice(0, 4)}-${a.slice(4).padEnd(4, 'X')}`;
}

function participantes(v: Values): { nome: string; classificacao: string }[] {
  return lineItems(v.participantes)
    .map((p) => ({ nome: str(p.nome), classificacao: str(p.classificacao) }))
    .filter((p) => p.nome);
}

export default defineTemplate({
  id: 'certificado-de-participacao',
  family: 'declaracao',
  page: 'A4-paisagem',
  verticalAlign: 'center',
  frame: 'double',
  noBrand: true,
  letterhead: false,
  style: { font: 'classico' },
  repeat: (v) => {
    const ps = participantes(v);
    if (ps.length < 2) return undefined;
    return ps.map((p, i) => ({ participanteNome: p.nome, classificacao: p.classificacao || v.classificacao, codigo: nextNumber(str(v.codigo), i) }));
  },
  sections: [
    { id: 'participante', title: l('Participantes', 'Participants') },
    { id: 'evento', title: l('Curso ou evento', 'Course or event') },
    { id: 'assinaturas', title: l('Assinaturas e número', 'Signatures and number') },
  ],
  fields: [
    {
      name: 'participanteNome',
      type: 'text',
      section: 'participante',
      label: l('Nome do participante', "Participant's name"),
      help: l('Para vários participantes, use a lista abaixo: sai um certificado por pessoa.', 'For several people use the list below: one certificate per person.'),
    },
    {
      name: 'participantes',
      type: 'lines',
      section: 'participante',
      label: l('Lista de participantes (um certificado cada)', 'Participants (one certificate each)'),
      addLabel: l('Adicionar participante', 'Add participant'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'classificacao', type: 'text', label: l('Classificação (opcional)', 'Grade (optional)'), width: 'third' },
      ],
      default: [],
    },
    {
      name: 'tipo',
      type: 'select',
      section: 'evento',
      label: l('Certificado de', 'Certificate of'),
      width: 'half',
      options: [
        { value: 'participacao', label: l('Participação', 'Attendance') },
        { value: 'presenca', label: l('Presença', 'Presence') },
        { value: 'frequencia', label: l('Frequência', 'Course attendance') },
        { value: 'conclusao', label: l('Conclusão (com avaliação)', 'Completion (assessed)') },
        { value: 'merito', label: l('Mérito (use de preferência o certificado de reconhecimento)', 'Merit (prefer the recognition certificate)') },
      ],
      default: 'participacao',
    },
    {
      name: 'modalidade',
      type: 'select',
      section: 'evento',
      label: l('Evento', 'Event'),
      width: 'half',
      options: EVENTOS.map((e) => ({ value: e.value, label: l(e.label[0], e.label[1]) })),
      default: 'no workshop',
    },
    { name: 'titulo', type: 'text', section: 'evento', label: l('Tema ou título', 'Title or theme'), required: true },
    { name: 'organizador', type: 'text', section: 'evento', width: 'half', label: l('Organizado por', 'Organised by'), default: (c) => profileDisplayName(c.profile) },
    { name: 'parceiro', type: 'text', section: 'evento', width: 'half', label: l('Em parceria com (opcional)', 'In partnership with (optional)') },
    {
      name: 'formato',
      type: 'select',
      section: 'evento',
      width: 'half',
      label: l('Formato', 'Format'),
      options: [
        { value: 'presencial', label: l('Presencial', 'In person') },
        { value: 'online', label: l('Online', 'Online') },
        { value: 'hibrido', label: l('Híbrido', 'Hybrid') },
      ],
      default: 'presencial',
    },
    localField('evento'),
    { name: 'dataInicio', type: 'date', section: 'evento', label: l('Data (ou início)', 'Date (or start)'), width: 'half', default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'evento', label: l('Fim (opcional)', 'End (optional)'), width: 'half' },
    { name: 'cargaHoraria', type: 'number', section: 'evento', label: l('Carga horária (horas)', 'Duration (hours)'), width: 'half', min: 0 },
    {
      name: 'classificacao',
      type: 'text',
      section: 'evento',
      width: 'half',
      label: l('Aproveitamento (opcional)', 'Result (optional)'),
      placeholder: l('Muito Bom / 16 valores', 'Very good'),
      showIf: (v) => v.tipo === 'conclusao' || v.tipo === 'frequencia',
    },
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
    { name: 'assinante2Cargo', type: 'text', section: 'assinaturas', label: l('Cargo', 'Position'), width: 'half', default: 'O Formador' },
    {
      name: 'codigo',
      type: 'text',
      section: 'assinaturas',
      label: l('Número do certificado', 'Certificate number'),
      width: 'half',
      help: l('Com uma lista, o número aumenta para cada participante. Guarde o registo dos certificados emitidos.', 'With a list the number increases per participant. Keep a register.'),
      default: (c) => c.nextRef,
    },
    { name: 'mostrarLicenca', type: 'toggle', section: 'assinaturas', width: 'half', label: l('Imprimir a licença do perfil', 'Print the profile licence'), default: false },
    { name: 'tricolour', type: 'toggle', section: 'assinaturas', width: 'half', label: l('Detalhe nas cores nacionais', 'National colours detail'), default: false },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = TITULOS[str(v.tipo)] ? str(v.tipo) : 'participacao';
    const merito = tipo === 'merito';
    const [t1, t2] = TITULOS[tipo];
    const nome = str(v.participanteNome) || participantes(v)[0]?.nome || '____________________';
    const h = Number(v.cargaHoraria);
    const horas = h > 0 ? `, com a duração de ${h} ${h === 1 ? 'hora' : 'horas'}` : '';
    const org = [str(v.organizador) && `organizado por ${str(v.organizador)}`, str(v.parceiro) && `em parceria com ${str(v.parceiro)}`].filter(Boolean).join(' ');
    const onde = v.formato === 'online' ? 'em formato online' : str(v.local) ? `em ${str(v.local)}${v.formato === 'hibrido' ? ' e em formato online' : ''}` : '';
    const verbo = tipo === 'frequencia' ? 'frequentou' : tipo === 'conclusao' ? 'concluiu com aproveitamento' : tipo === 'presenca' ? 'esteve presente' : 'participou';
    const evento = tipo === 'conclusao' ? str(v.modalidade).replace(/^n(o|a|os|as) /, '$1 ') : str(v.modalidade) || 'no workshop';
    const corpo = merito
      ? `em reconhecimento ${str(v.motivo) ? `de ${str(v.motivo).replace(/[.]$/, '')}` : 'do seu mérito'}${str(v.titulo) ? `, no âmbito ${str(v.modalidade).replace(/^n/, 'd')} «${str(v.titulo)}»` : ''}.`
      : `${verbo} ${evento} «${str(v.titulo) || '____________________'}»${org ? `, ${org}` : ''}, realizado ${[onde, periodo(v.dataInicio, v.dataFim)].filter(Boolean).join(', ')}${horas}.`;
    const cls = str(v.classificacao);
    const cols: SignatureColumn[] = [{ role: str(v.assinante1Cargo) || ' ', name: str(v.assinante1Nome) || undefined, image: 'both' }];
    if (str(v.assinante2Nome)) cols.push({ role: str(v.assinante2Cargo) || ' ', name: str(v.assinante2Nome) });
    const codigo = str(v.codigo);
    const rodape = [
      codigo ? `Certificado n.º ${codigo}` : '',
      codigo ? `Código de verificação ${codigoVerificacao(codigo, nome, str(v.dataInicio))}` : '',
      v.mostrarLicenca && ctx.profile?.licenca ? ctx.profile.licenca : '',
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: 'logo', size: 'md' },
      disp(t1, 'xxl', { uppercase: true, tone: 'accent', after: 0 }),
      disp(t2, 'md', { uppercase: true, tone: 'muted', after: 2 }),
      { type: 'ornament', style: v.tricolour ? 'tricolour' : 'double' },
      disp(merito ? 'É atribuído a' : 'Certifica-se que', 'sm', { italic: true, tone: 'muted', after: 4 }),
      disp(nome, 'xl', { italic: true, fit: true, after: 2 }),
      { type: 'ornament', style: 'rule', width: 'medium' },
      disp(corpo, 'md', { after: cls && !merito ? 2 : 12 }),
    ];
    if (cls && !merito) blocks.push(disp(`Classificação: ${cls}`, 'sm', { weight: 'bold', after: 12 }));
    blocks.push(disp(`${ctx.place}, ${dateLong(str(v.dataFim) || str(v.dataInicio) || ctx.today)}`, 'sm', { tone: 'muted', after: 6 }));
    blocks.push({ type: 'signatures', columns: cols });
    if (rodape.length) blocks.push(disp(rodape.join('   ·   '), 'xs', { tone: 'muted', after: 0 }));
    return blocks;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (!str(v.participanteNome) && !participantes(v).length)
      out.push({ level: 'warning', field: 'participanteNome', message: l('Indique o nome do participante ou preencha a lista.', 'Give the participant name or fill the list.') });
    if (v.tipo === 'conclusao' && !str(v.classificacao))
      out.push({
        level: 'warning',
        field: 'tipo',
        message: l('Um certificado de conclusão pressupõe avaliação. Sem avaliação, use "Participação".', 'A completion certificate implies an assessment; otherwise use "Attendance".'),
      });
    if (!(Number(v.cargaHoraria) > 0) && v.tipo !== 'merito')
      out.push({ level: 'info', field: 'cargaHoraria', message: l('Indicar a carga horária torna o certificado mais útil para o currículo.', 'Stating the hours makes the certificate more useful on a CV.') });
    if (v.mostrarLicenca && !v.codigo)
      out.push({ level: 'info', field: 'codigo', message: l('Numere os certificados e guarde o registo.', 'Number the certificates and keep a register.') });
    out.push({
      level: 'info',
      message: l(
        `Este certificado comprova a participação; não confere qualificação profissional nem substitui os certificados do sistema nacional de educação (${cite('eduHabilitacoesProfissionais')}).`,
        'This certificate proves attendance; it does not confer a professional qualification.',
      ),
    });
    return out;
  },
  personName: (v) => str(v.participanteNome) || participantes(v)[0]?.nome || undefined,
  documentDate: (v) => str(v.dataFim) || str(v.dataInicio) || undefined,
});
