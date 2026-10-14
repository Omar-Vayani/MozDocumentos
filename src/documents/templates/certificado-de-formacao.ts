// Certificado de formação: certificate of participation, attendance or
// completion of a short course ("curso livre"), workshop or in-house training,
// issued by a training centre, language institute, school or company.
// A4 landscape, framed, centred. Such a certificate proves attendance only: it
// does not confer a recognised professional qualification unless the course is
// accredited (ANEP), and it never replaces the certificates of the national
// education system. One page per participant when a list is given.

import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { dateLong, GENERO_OPTIONS, l, localField, placeDate } from './_shared';
import { intervalo, licenca, num, rows, semPonto, str } from './_educacao';

const ACCAO: Record<string, { m: boolean; n: string }> = {
  curso: { m: true, n: 'curso' },
  formacao: { m: false, n: 'acção de formação' },
  seminario: { m: true, n: 'seminário' },
  workshop: { m: true, n: 'workshop' },
  palestra: { m: false, n: 'palestra' },
  linguas: { m: true, n: 'curso de língua' },
  interna: { m: false, n: 'formação interna' },
};

function periodo(a: unknown, b: unknown): string {
  const i = str(a);
  const f = str(b);
  if (i && f && i !== f) return intervalo(i, f);
  return `em ${dateLong(i || f)}`;
}

export default defineTemplate({
  id: 'certificado-de-formacao',
  family: 'declaracao',
  page: 'A4-paisagem',
  verticalAlign: 'center',
  frame: 'double',
  letterhead: false,
  repeat: (v: Values) => {
    const list = rows(v.participantes).filter((p) => str(p.nome));
    if (!list.length) return undefined;
    const base = num(v.numeroInicial);
    return list.map((p, i) => ({
      participanteNome: str(p.nome),
      participanteGenero: str(p.genero) || 'M',
      participanteDocNumero: str(p.documento),
      classificacao: str(p.classificacao) || v.classificacao,
      numero: base != null ? String(base + i).padStart(String(v.numeroInicial).trim().length, '0') : v.numero,
    }));
  },
  sections: [
    { id: 'participante', title: l('Participante', 'Participant'), personRole: 'outro' },
    { id: 'curso', title: l('Curso ou acção de formação', 'Course or training') },
    { id: 'conteudo', title: l('Conteúdo programático (verso, opcional)', 'Course contents (back page, optional)') },
    { id: 'assinaturas', title: l('Assinaturas e registo', 'Signatures and register') },
  ],
  fields: [
    { name: 'participanteNome', type: 'text', section: 'participante', label: l('Nome do participante', "Participant's name"), required: true, personKey: 'nome' },
    { name: 'participanteGenero', type: 'radio', section: 'participante', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero', width: 'half' },
    { name: 'participanteDocNumero', type: 'text', section: 'participante', width: 'half', label: l('N.º do BI / documento (opcional)', 'ID number (optional)'), personKey: 'docNumero' },
    {
      name: 'participantes',
      type: 'lines',
      section: 'participante',
      label: l('Vários participantes (um certificado por pessoa)', 'Several participants (one certificate each)'),
      help: l('Se preencher esta lista, é gerada uma página por participante e os campos acima são ignorados.', 'If you fill this list, one page per participant is produced.'),
      addLabel: l('Adicionar participante', 'Add participant'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'genero', type: 'select', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS },
        { name: 'documento', type: 'text', label: l('N.º do BI (opcional)', 'ID no. (optional)') },
        { name: 'classificacao', type: 'text', label: l('Classificação (opcional)', 'Grade (optional)') },
      ],
      default: [],
    },
    {
      name: 'designacaoDoc',
      type: 'radio',
      section: 'curso',
      label: l('Designação do documento', 'Document name'),
      options: [
        { value: 'Certificado', label: l('Certificado', 'Certificate') },
        { value: 'Diploma', label: l('Diploma (curso livre)', 'Diploma (short course)') },
      ],
      default: 'Certificado',
    },
    {
      name: 'modalidade',
      type: 'select',
      section: 'curso',
      width: 'half',
      label: l('O que certifica', 'What it certifies'),
      options: [
        { value: 'participacao', label: l('Participação', 'Participation') },
        { value: 'frequencia', label: l('Frequência com assiduidade', 'Attendance') },
        { value: 'conclusao', label: l('Conclusão com aproveitamento', 'Completion with pass') },
        { value: 'merito', label: l('Mérito (melhor aluno, quadro de honra)', 'Merit (top student)') },
      ],
      default: 'conclusao',
    },
    {
      name: 'tipoAccao',
      type: 'select',
      section: 'curso',
      width: 'half',
      label: l('Tipo de acção', 'Type'),
      options: [
        { value: 'curso', label: l('Curso', 'Course') },
        { value: 'formacao', label: l('Acção de formação', 'Training') },
        { value: 'seminario', label: l('Seminário', 'Seminar') },
        { value: 'workshop', label: l('Workshop', 'Workshop') },
        { value: 'palestra', label: l('Palestra', 'Talk') },
        { value: 'linguas', label: l('Curso de língua', 'Language course') },
        { value: 'interna', label: l('Formação interna (empresa)', 'In-house training') },
      ],
      default: 'curso',
    },
    { name: 'tituloCurso', type: 'text', section: 'curso', required: true, label: l('Título do curso', 'Course title'), placeholder: l('Ex.: Contabilidade Básica e Gestão de Pequenos Negócios', 'E.g. Basic Accounting') },
    { name: 'dataInicio', type: 'date', section: 'curso', width: 'half', required: true, label: l('Início', 'Start'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'curso', width: 'half', label: l('Fim', 'End') },
    { name: 'cargaHoraria', type: 'number', section: 'curso', width: 'half', min: 0, label: l('Carga horária (horas)', 'Total hours') },
    localField('curso'),
    {
      name: 'regime',
      type: 'select',
      section: 'curso',
      width: 'half',
      label: l('Regime', 'Mode'),
      options: [
        { value: 'presencial', label: l('Presencial', 'In person') },
        { value: 'semi-presencial', label: l('Semi-presencial', 'Blended') },
        { value: 'online', label: l('À distância (online)', 'Online') },
      ],
      default: 'presencial',
    },
    { name: 'classificacao', type: 'text', section: 'curso', width: 'half', label: l('Classificação final (opcional)', 'Final grade (optional)'), placeholder: l('Ex.: 16 valores · Muito Bom', 'E.g. 16 / 20 · Very good'), showIf: (v) => v.modalidade === 'conclusao' || v.modalidade === 'merito' },
    { name: 'motivoMerito', type: 'text', section: 'curso', label: l('Motivo do mérito', 'Reason for merit'), placeholder: l('Ex.: melhor aproveitamento da turma', 'E.g. best results in the class'), showIf: (v) => v.modalidade === 'merito' },
    { name: 'parceiro', type: 'text', section: 'curso', label: l('Em parceria com (opcional)', 'In partnership with (optional)') },
    {
      name: 'acreditado',
      type: 'toggle',
      section: 'curso',
      label: l('Curso acreditado pela ANEP', 'Course accredited by ANEP'),
      help: l('Só marque se o curso estiver registado e acreditado no sistema de educação profissional.', 'Only if the course is registered and accredited in the vocational system.'),
    },
    { name: 'acreditacaoNumero', type: 'text', section: 'curso', width: 'half', label: l('N.º de acreditação / registo', 'Accreditation number'), showIf: (v) => Boolean(v.acreditado) },
    { name: 'verso', type: 'toggle', section: 'conteudo', label: l('Imprimir o conteúdo programático no verso', 'Print the contents on the back') },
    {
      name: 'modulos',
      type: 'lines',
      section: 'conteudo',
      label: l('Módulos', 'Modules'),
      addLabel: l('Adicionar módulo', 'Add module'),
      columns: [
        { name: 'modulo', type: 'text', label: l('Módulo', 'Module') },
        { name: 'horas', type: 'number', label: l('Horas', 'Hours'), min: 0 },
      ],
      default: [],
      showIf: (v) => Boolean(v.verso),
    },
    { name: 'assinante1Nome', type: 'text', section: 'assinaturas', width: 'half', label: l('1.º signatário', 'First signatory'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'assinante1Cargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo || 'Director' },
    { name: 'assinante2Nome', type: 'text', section: 'assinaturas', width: 'half', label: l('2.º signatário (formador, opcional)', 'Second signatory (trainer, optional)') },
    { name: 'assinante2Cargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo', 'Position'), default: 'Formador' },
    { name: 'numero', type: 'text', section: 'assinaturas', width: 'half', label: l('Certificado n.º', 'Certificate no.'), default: (c) => c.nextRef },
    { name: 'numeroInicial', type: 'text', section: 'assinaturas', width: 'half', label: l('N.º inicial (lista de participantes)', 'First number (participant list)'), help: l('Com uma lista, cada certificado recebe o número seguinte (ex.: 0101, 0102…).', 'With a list, each certificate gets the next number.') },
    { name: 'verificacao', type: 'text', section: 'assinaturas', label: l('Contacto para verificação (opcional)', 'Verification contact (optional)'), default: (c) => c.profile?.email ?? '' },
  ],
  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (v.modalidade === 'conclusao' && !str(v.classificacao) && !rows(v.participantes).some((p) => str(p.classificacao)))
      w.push({ level: 'info', field: 'classificacao', message: l('Indique a classificação final, ou escolha "frequência" se não houve avaliação.', 'Enter the final grade, or choose attendance if there was no assessment.') });
    if (!v.acreditado)
      w.push({
        level: 'warning',
        message: l(
          'Este certificado prova a frequência de um curso livre. Não confere qualificação profissional reconhecida (as habilitações profissionais são fixadas pelo órgão competente), salvo curso acreditado pela ANEP. Não escreva "nível", "qualificação profissional" ou "equivalente a".',
          'This certificate proves attendance of a non-accredited course. It does not confer a recognised professional qualification unless the course is ANEP-accredited.',
        ),
      });
    if (v.acreditado && !str(v.acreditacaoNumero)) w.push({ level: 'warning', field: 'acreditacaoNumero', message: l('Indique o número de acreditação.', 'Enter the accreditation number.') });
    if (v.regime === 'online' && ctx.profile?.kind === 'empresa' && v.tipoAccao !== 'interna')
      w.push({
        level: 'warning',
        field: 'regime',
        message: l(
          'O novo regime do ensino privado (2026) proíbe o ensino à distância por instituições privadas abrangidas. Confirme se o seu curso está abrangido antes de o anunciar como online.',
          'The 2026 private-education rules prohibit distance teaching by covered private institutions. Check whether your course is covered.',
        ),
      });
    if (v.dataInicio && v.dataFim && str(v.dataFim) < str(v.dataInicio)) w.push({ level: 'error', field: 'dataFim', message: l('A data de fim é anterior à de início.', 'End date is before start date.') });
    w.push({ level: 'info', message: l('Guarde um registo dos certificados emitidos (número, nome, data) para os poder confirmar quando pedidos.', 'Keep a register of the certificates issued so they can be verified.') });
    return w;
  },
  personName: (v) => str(v.participanteNome) || str(rows(v.participantes)[0]?.nome) || undefined,
  documentDate: (v) => str(v.dataFim) || str(v.dataInicio) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.participanteGenero === 'F';
    const a = ACCAO[str(v.tipoAccao)] ?? ACCAO.curso;
    const art = a.m ? 'o' : 'a';
    const realizado = a.m ? 'realizado' : 'realizada';
    const mod = str(v.modalidade) || 'conclusao';
    const doc = str(v.designacaoDoc) || 'Certificado';
    const sub = { participacao: 'de Participação', frequencia: 'de Frequência', conclusao: 'de Conclusão', merito: 'de Mérito' }[mod] ?? '';
    const org = profileDisplayName(ctx.profile);
    const horas = num(v.cargaHoraria);
    const lugar = str(v.local);
    const titulo = `«${str(v.tituloCurso) || '____________________'}»`;
    const accao = `${art} ${a.n} ${titulo}`;
    const regime = v.regime === 'online' ? 'na modalidade à distância' : v.regime === 'semi-presencial' ? 'em regime semi-presencial' : lugar ? `em ${lugar}` : '';
    const detalhes = [`${realizado} ${[regime, periodo(v.dataInicio, v.dataFim)].filter(Boolean).join(', ')}`, horas ? `com a carga horária de ${horas} horas` : ''].filter(Boolean).join(', ');
    const cls = str(v.classificacao);
    const motivo = semPonto(v.motivoMerito);
    const corpo =
      mod === 'merito'
        ? `o presente ${doc.toLowerCase()} de mérito, em reconhecimento do seu mérito${motivo ? ` (${motivo})` : ''} n${art} ${a.n} ${titulo}, ${detalhes}${cls ? `, com a classificação final de ${cls}` : ''}.`
        : mod === 'participacao'
          ? `participou n${art} ${a.n} ${titulo}, ${detalhes}.`
          : mod === 'frequencia'
            ? `frequentou com assiduidade ${accao}, ${detalhes}.`
            : `concluiu com aproveitamento ${accao}, ${detalhes}${cls ? `, tendo obtido a classificação final de ${cls}` : ''}.`;
    const docNum = str(v.participanteDocNumero);
    const quem = `${f ? 'portadora' : 'portador'} do BI n.º ${docNum}, `;
    const cols: SignatureColumn[] = [{ role: str(v.assinante1Cargo) || 'O Director', name: str(v.assinante1Nome) || undefined, image: 'both' }];
    if (str(v.assinante2Nome)) cols.push({ role: str(v.assinante2Cargo) || 'O Formador', name: str(v.assinante2Nome) });
    const rodape = [
      placeDate(ctx, v.dataFim || v.dataInicio),
      str(v.numero) ? `${doc} n.º ${str(v.numero)}` : '',
      v.acreditado && str(v.acreditacaoNumero) ? `Curso acreditado pela ANEP — registo n.º ${str(v.acreditacaoNumero)}` : '',
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: 'logo', size: 'md' },
      { type: 'display', text: [org, str(v.parceiro) ? `em parceria com ${str(v.parceiro)}` : ''].filter(Boolean).join('\n') || ' ', size: 'xs', uppercase: true, tone: 'muted', after: 6 },
      { type: 'display', text: doc, size: 'xxl', uppercase: true, tone: 'accent', weight: 'bold', after: 0 },
      { type: 'display', text: sub, size: 'md', uppercase: true, tone: 'text', after: 4 },
      { type: 'ornament', style: 'tricolour', width: 'short' },
      { type: 'display', text: mod === 'merito' ? 'Confere-se a' : 'Certifica-se que', size: 'sm', italic: true, tone: 'muted', after: 4 },
      { type: 'display', text: str(v.participanteNome) || '____________________', size: 'xl', weight: 'bold', italic: true, fit: true, after: 6 },
      { type: 'display', text: `${docNum ? quem : ''}${corpo}`, size: 'sm', after: 14 },
      { type: 'signatures', columns: cols },
      { type: 'display', text: rodape.join('   ·   '), size: 'xs', tone: 'muted', after: 0 },
    ];
    if (str(v.verificacao) || licenca(ctx)) {
      blocks.push({ type: 'display', text: [licenca(ctx), str(v.verificacao) ? `Verificação: ${str(v.verificacao)}` : ''].filter(Boolean).join('   ·   '), size: 'xs', tone: 'muted', after: 0 });
    }
    const modulos = rows(v.modulos).filter((m) => str(m.modulo));
    if (v.verso && modulos.length) {
      const total = modulos.reduce((s, m) => s + (num(m.horas) ?? 0), 0);
      blocks.push(
        { type: 'pageBreakHint' },
        { type: 'display', text: 'Conteúdo programático', size: 'lg', weight: 'bold', tone: 'accent', after: 2 },
        { type: 'display', text: str(v.tituloCurso), size: 'sm', italic: true, tone: 'muted', after: 10 },
        {
          type: 'table',
          columns: [{ label: 'Módulo', width: 80 }, { label: 'Horas', width: 20, align: 'center' }],
          rows: modulos.map((m) => [str(m.modulo), num(m.horas) != null ? String(num(m.horas)) : '']),
          totals: total > 0 ? [['Total', String(total)]] : undefined,
        },
      );
    }
    return blocks;
  },
});
