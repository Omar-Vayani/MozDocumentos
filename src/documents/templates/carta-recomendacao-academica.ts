// Carta de recomendação académica: a teacher, supervisor, head of department
// or director recommends a student for a scholarship, master's programme,
// exchange or first job. Bilingual reading aid (often sent abroad).

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, GENERO_OPTIONS, isF, l, localField, splitLines } from './_shared';
import { semPonto, str } from './_educacao';

export default defineTemplate({
  id: 'carta-recomendacao-academica',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Carta', 'Letter') },
    { id: 'autor', title: l('Quem recomenda', 'Referee') },
    { id: 'candidato', title: l('Candidato', 'Candidate'), personRole: 'outro' },
    { id: 'conteudo', title: l('Recomendação', 'Recommendation') },
  ],
  fields: [
    localField(),
    dateField(),
    { name: 'destinatario', type: 'text', section: 'documento', label: l('Destinatário', 'Addressee'), placeholder: l('Ex.: Comissão de Selecção do Programa de Mestrado em Economia', 'E.g. Admissions Committee, MSc Economics'), help: l('Deixe em branco para "A quem possa interessar".', 'Leave blank for "To whom it may concern".') },
    { name: 'destinatarioInstituicao', type: 'text', section: 'documento', label: l('Instituição destinatária (opcional)', 'Institution (optional)') },
    { name: 'autorNome', type: 'text', section: 'autor', required: true, label: l('Nome', 'Name'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? '') },
    { name: 'autorGenero', type: 'radio', section: 'autor', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.genero ?? 'M' : 'M') },
    { name: 'autorTitulo', type: 'text', section: 'autor', width: 'half', label: l('Título académico', 'Academic title'), placeholder: l('Ex.: Prof. Doutor · Mestre · dr.', 'E.g. Prof. · Dr.'), default: (c) => c.profile?.tituloProfissional ?? '' },
    { name: 'autorCargo', type: 'text', section: 'autor', width: 'half', required: true, label: l('Cargo', 'Position'), placeholder: l('Ex.: Professor Auxiliar de Economia', 'E.g. Senior Lecturer in Economics'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.profissao ?? '' : c.profile?.representanteCargo ?? '') },
    { name: 'autorInstituicao', type: 'text', section: 'autor', width: 'half', label: l('Instituição', 'Institution'), default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma ?? '' : '') },
    { name: 'autorEmail', type: 'email', section: 'autor', width: 'half', label: l('Email', 'Email'), default: (c) => c.profile?.email ?? '' },
    { name: 'autorTelefone', type: 'tel', section: 'autor', width: 'half', label: l('Telefone', 'Phone'), default: (c) => c.profile?.telefones ?? '' },
    { name: 'candidatoNome', type: 'text', section: 'candidato', required: true, label: l('Nome do candidato', "Candidate's name"), personKey: 'nome' },
    { name: 'candidatoGenero', type: 'radio', section: 'candidato', width: 'half', label: l('Sexo', 'Sex'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'candidatoCurso', type: 'text', section: 'candidato', width: 'half', label: l('Curso', 'Degree / course'), placeholder: l('Ex.: Licenciatura em Economia', 'E.g. BA in Economics') },
    { name: 'relacao', type: 'text', section: 'conteudo', required: true, label: l('Como conhece o candidato', 'How you know the candidate'), placeholder: l('Ex.: seu docente nas disciplinas de Microeconomia e Econometria e supervisor do trabalho de fim de curso', 'E.g. his lecturer and thesis supervisor') },
    { name: 'desde', type: 'text', section: 'conteudo', width: 'half', label: l('Desde (ano)', 'Since (year)') },
    { name: 'media', type: 'text', section: 'conteudo', width: 'half', label: l('Média final (opcional)', 'Final average (optional)'), placeholder: l('Ex.: 16 valores', 'E.g. 16/20') },
    { name: 'ranking', type: 'text', section: 'conteudo', width: 'half', label: l('Posição relativa (opcional)', 'Ranking (optional)'), placeholder: l('Ex.: entre os cinco melhores estudantes do seu ano', 'E.g. among the top five students') },
    { name: 'qualidades', type: 'textarea', section: 'conteudo', rows: 6, required: true, label: l('Qualidades e exemplos concretos (um parágrafo por linha)', 'Qualities with concrete examples (one paragraph per line)') },
    { name: 'destino', type: 'text', section: 'conteudo', required: true, label: l('Para quê', 'Applying for'), placeholder: l('Ex.: ao Programa de Mestrado em Economia do Desenvolvimento', 'E.g. the MSc in Development Economics') },
    { name: 'grau', type: 'select', section: 'conteudo', width: 'half', label: l('Grau de recomendação', 'Strength'), options: [
      { value: 'sem reservas', label: l('Sem reservas', 'Without reservation') },
      { value: 'vivamente', label: l('Vivamente', 'Strongly') },
      { value: 'com confiança', label: l('Com confiança', 'With confidence') },
    ], default: 'sem reservas' },
  ],
  warnings: (v) => {
    const w: Warning[] = [];
    if (str(v.qualidades).length < 200)
      w.push({ level: 'warning', field: 'qualidades', message: l('Desenvolva as qualidades com exemplos concretos (trabalhos, resultados, atitudes). Uma carta genérica tem pouco peso.', 'Add concrete examples; a generic letter carries little weight.') });
    w.push({ level: 'info', message: l('Muitos programas pedem que a carta seja submetida pelo próprio autor no portal de candidatura; este PDF serve de cópia. Peça o consentimento do candidato antes de indicar notas.', 'Many programmes require submission through their portal; this PDF is a copy. Ask the candidate before sharing grades.') });
    return w;
  },
  personName: (v) => str(v.candidatoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.candidatoGenero);
    const fa = isF(v.autorGenero);
    const o = f ? 'a candidata' : 'o candidato';
    const O = f ? 'A candidata' : 'O candidato';
    const nome = str(v.candidatoNome) || BLANK;
    const inst = semPonto(v.autorInstituicao);
    const blocks: Block[] = [{ type: 'reference', place: ctx.place, date: v.data }];
    if (str(v.destinatario)) blocks.push({ type: 'recipient', lines: [semPonto(v.destinatario), str(v.destinatarioInstituicao)].filter(Boolean) });
    blocks.push(
      { type: 'subject', text: `Recomendação de ${nome}` },
      { type: 'salutation', text: str(v.destinatario) ? 'Exmos. Senhores,' : 'A quem possa interessar,' },
      {
        type: 'paragraph',
        id: 'relacao',
        text: `Na qualidade de ${semPonto(v.autorCargo) || BLANK}${inst ? ` da ${inst}` : ''}, conheço **${nome}**${str(v.desde) ? ` desde ${str(v.desde)}` : ''}, tendo sido ${semPonto(v.relacao) || BLANK}.`,
        en: `As ${semPonto(v.autorCargo) || 'a member of staff'}${inst ? ` at ${inst}` : ''}, I have known ${nome}${str(v.desde) ? ` since ${str(v.desde)}` : ''} as ${semPonto(v.relacao) || '…'}.`,
      },
    );
    if (str(v.media) || str(v.ranking))
      blocks.push({
        type: 'paragraph',
        id: 'desempenho',
        text: `${O}${str(v.candidatoCurso) ? ` frequentou ${/^(o|a) /i.test(str(v.candidatoCurso)) ? '' : 'a '}${semPonto(v.candidatoCurso)}` : ' concluiu os seus estudos'}${str(v.media) ? ` com a média de ${semPonto(v.media)}` : ''}${str(v.ranking) ? `, situando-se ${semPonto(v.ranking)}` : ''}.`,
        en: `The candidate${str(v.candidatoCurso) ? ` studied ${semPonto(v.candidatoCurso)}` : ''}${str(v.media) ? ` with an average of ${semPonto(v.media)}` : ''}${str(v.ranking) ? `, ranking ${semPonto(v.ranking)}` : ''}.`,
      });
    splitLines(v.qualidades).forEach((q, i) => blocks.push({ type: 'paragraph', id: `qualidade${i + 1}`, text: q, en: 'Qualities and examples.' }));
    blocks.push(
      {
        type: 'paragraph',
        id: 'conclusao',
        text: `Por estas razões, recomendo ${str(v.grau) || 'sem reservas'} a candidatura ${f ? 'da' : 'do'} ${str(v.candidatoNome) ? nome : o} ${semPonto(v.destino).match(/^(a|ao|à|aos|às|para) /i) ? semPonto(v.destino) : `a ${semPonto(v.destino) || BLANK}`}.`,
        en: `For these reasons I recommend the candidate ${str(v.grau) === 'vivamente' ? 'strongly' : 'without reservation'} for ${semPonto(v.destino) || 'the programme'}.`,
      },
      {
        type: 'paragraph',
        id: 'contacto',
        text: `Fico ao dispor para prestar qualquer informação adicional${str(v.autorEmail) ? ` através do email ${str(v.autorEmail)}` : ''}${str(v.autorTelefone) ? `${str(v.autorEmail) ? ' ou' : ' através'} do telefone ${str(v.autorTelefone)}` : ''}.`,
        en: 'I am available to provide further information by e-mail or phone.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
      {
        type: 'signatures',
        columns: [
          {
            role: semPonto(v.autorCargo) || (fa ? 'A Docente' : 'O Docente'),
            name: [str(v.autorTitulo), str(v.autorNome)].filter(Boolean).join(' ') || undefined,
            detail: inst || undefined,
            image: ctx.profile?.kind === 'empresa' ? 'both' : 'signature',
          },
        ],
      },
    );
    return blocks;
  },
});
