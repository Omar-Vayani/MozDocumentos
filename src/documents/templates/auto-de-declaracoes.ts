// Auto de declarações: the written record of a statement taken by the
// investigator of a disciplinary, inquiry or fact-finding procedure in a public
// body, read back to the person and signed.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, g, isF, l, localField, workerFields } from './_shared';
import { dataPorExtenso, hora, paragraphs } from './_estado';
import { entidadeProfileWarning, identificacao, semPonto, str } from './_contratacao';

const PROCESSOS = [
  { value: 'processo disciplinar', label: l('Processo disciplinar', 'Disciplinary proceedings') },
  { value: 'processo de inquérito', label: l('Processo de inquérito', 'Inquiry') },
  { value: 'processo de sindicância', label: l('Processo de sindicância', 'Investigation of a service') },
  { value: 'processo de averiguações', label: l('Processo de averiguações', 'Fact-finding') },
  { value: 'processo administrativo', label: l('Processo administrativo', 'Administrative procedure') },
];

const QUALIDADES = [
  { value: 'testemunha', label: l('Testemunha', 'Witness') },
  { value: 'declarante', label: l('Declarante', 'Declarant') },
  { value: 'participante', label: l('Participante (quem fez a participação)', 'Complainant') },
  { value: 'arguido', label: l('Arguido', 'Accused') },
];

export default defineTemplate({
  id: 'auto-de-declaracoes',
  family: 'acta',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Processo, local e data', 'Procedure, place and date') },
    { id: 'instrutor', title: l('Instrutor e secretário', 'Investigator and clerk') },
    { id: 'declarante', title: l('Pessoa ouvida', 'Person heard'), personRole: 'outro' },
    { id: 'declaracoes', title: l('Declarações', 'Statements') },
  ],
  fields: [
    { name: 'processoTipo', type: 'select', section: 'documento', width: 'half', label: l('Processo', 'Procedure'), options: PROCESSOS, default: 'processo disciplinar' },
    { name: 'processoNumero', type: 'text', section: 'documento', width: 'half', label: l('Processo n.º', 'File no.') },
    localField(),
    dateField('data'),
    { name: 'horaInicio', type: 'text', section: 'documento', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 9:30', 'E.g. 9:30') },
    { name: 'horaFim', type: 'text', section: 'documento', width: 'half', label: l('Hora de encerramento', 'End time'), placeholder: l('Ex.: 10:45', 'E.g. 10:45') },
    { name: 'instalacoes', type: 'text', section: 'documento', label: l('Onde', 'Where'), placeholder: l('Ex.: no gabinete do Departamento de Recursos Humanos da Direcção Provincial de Saúde de Nampula', 'E.g. in the HR office of …') },
    { name: 'instrutorNome', type: 'text', section: 'instrutor', width: 'half', required: true, label: l('Instrutor (nome)', 'Investigator (name)') },
    { name: 'instrutorGenero', type: 'radio', section: 'instrutor', width: 'half', label: l('Género', 'Gender'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M' },
    { name: 'instrutorCargo', type: 'text', section: 'instrutor', width: 'half', label: l('Cargo / categoria do instrutor', 'Investigator’s position') },
    { name: 'nomeacao', type: 'text', section: 'instrutor', width: 'half', label: l('Nomeado por (opcional)', 'Appointed by (optional)'), placeholder: l('Ex.: Despacho do Director Provincial de 3 de Outubro de 2026', 'E.g. order of 3 October 2026') },
    { name: 'secretarioNome', type: 'text', section: 'instrutor', width: 'half', label: l('Secretário (opcional)', 'Clerk (optional)') },
    ...workerFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada'], 'declarante', 'declarante'),
    { name: 'declaranteCargo', type: 'text', section: 'declarante', width: 'half', label: l('Profissão / cargo', 'Occupation / position'), placeholder: l('Ex.: enfermeira geral, afecta ao Centro de Saúde de Namaita', 'E.g. nurse at …') },
    { name: 'qualidade', type: 'select', section: 'declarante', width: 'half', label: l('Ouvido na qualidade de', 'Heard as'), options: QUALIDADES, default: 'testemunha' },
    {
      name: 'costumes',
      type: 'text',
      section: 'declaracoes',
      label: l('Aos costumes (relação com os interessados)', 'Relationship with the parties'),
      default: 'disse nada',
      help: l('Fórmula tradicional: «disse nada» quando não é parente, amigo ou inimigo dos interessados; caso contrário, descreva a relação.', 'Traditional formula: “disse nada” when not related to the parties; otherwise describe the relationship.'),
    },
    { name: 'declaracoes', type: 'textarea', section: 'declaracoes', rows: 8, required: true, label: l('Declarações', 'Statements'), help: l('Escreva na terceira pessoa («Que no dia…»), um facto por parágrafo, com as palavras do declarante.', 'Write in the third person, one fact per paragraph, in the person’s own words.') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!paragraphs(v.declaracoes).length) w.push({ level: 'warning', field: 'declaracoes', message: l('Registe as declarações.', 'Record the statements.') });
    if (!str(v.declaranteDocNumero)) w.push({ level: 'info', field: 'declaranteDocNumero', message: l('Identifique a pessoa ouvida pelo documento de identificação.', 'Identify the person by their ID document.') });
    if (v.qualidade === 'arguido') w.push({ level: 'warning', field: 'qualidade', message: l('O arguido tem direito a conhecer a acusação, a ser assistido por advogado e a não responder. Registe no auto que foi informado desses direitos.', 'The accused has the right to know the charge, to a lawyer and to remain silent. Record that they were informed.') });
    w.push({ level: 'info', message: l(`O auto é lido ao declarante, que o pode corrigir antes de assinar; quem não souber assinar põe a impressão digital (${cite('ctTermoDeclaracoes')}).`, 'The record is read back; the person may correct it before signing; anyone unable to sign uses a fingerprint.') });
    return w;
  },

  personName: (v) => v.declaranteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fI = isF(v.instrutorGenero);
    const fD = isF(v.declaranteGenero);
    const qual = QUALIDADES.find((q) => q.value === v.qualidade)?.label.pt.toLowerCase() ?? 'testemunha';
    const qualTxt = v.qualidade === 'arguido' ? (fD ? 'arguida' : 'arguido') : qual.split(' (')[0];
    const decl = paragraphs(v.declaracoes);
    const proc = `${str(v.processoTipo) || 'processo'}${str(v.processoNumero) ? ` n.º ${semPonto(v.processoNumero)}` : ''}`;
    const ident = identificacao(v, 'declarante').replace(/, titular do NUIT _+/, '');
    const blocks: Block[] = [
      { type: 'title', text: 'Auto de declarações', subtitle: proc.charAt(0).toUpperCase() + proc.slice(1) },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${hora(v.horaInicio, 'pelas')}, ${str(v.instalacoes) ? semPonto(v.instalacoes) : 'nesta instituição'}, perante **${str(v.instrutorNome) || BLANK}**${str(v.instrutorCargo) ? `, ${semPonto(v.instrutorCargo)}` : ''}, ${fI ? 'instrutora' : 'instrutor'} do ${proc}${str(v.nomeacao) ? `, ${fI ? 'nomeada' : 'nomeado'} por ${semPonto(v.nomeacao).replace(/^(por|pelo)\s+/i, '')}` : ''}${str(v.secretarioNome) ? `, e ${str(v.secretarioNome)}, secretário` : ''}, compareceu ${ident}${str(v.declaranteCargo) ? `, ${semPonto(v.declaranteCargo)}` : ''}, ${fD ? 'ouvida' : 'ouvido'} na qualidade de ${qualTxt}.`,
        en: 'Opening: date, place, investigator and the person heard.',
      },
      {
        type: 'paragraph',
        id: 'costumes',
        text: `Aos costumes ${semPonto(v.costumes) || 'disse nada'}.`,
        en: 'Relationship with the parties.',
      },
      { type: 'paragraph', id: 'inquirido', text: `${g(v.declaranteGenero, 'Inquirido', 'Inquirida')} sobre a matéria dos autos, declarou:`, keepWithNext: true, en: 'Questioned on the matter, stated:' },
    ];
    (decl.length ? decl : [`${BLANK}${BLANK}${BLANK}`]).forEach((p, i) => blocks.push({ type: 'paragraph', id: `declaracao-${i + 1}`, text: p, en: 'Statement.' }));
    blocks.push(
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `E mais não disse. Lido o presente auto ${fD ? 'à declarante' : 'ao declarante'}, achou-o conforme, ratificou-o e vai assiná-lo com ${fI ? 'a instrutora' : 'o instrutor'}${str(v.secretarioNome) ? ' e o secretário' : ''}, ${hora(v.horaFim, 'pelas')}.`,
        keepWithNext: true,
        en: 'Nothing further. The record was read back, confirmed and signed.',
      },
      {
        type: 'signatures',
        columns: [
          { role: fD ? 'A Declarante' : 'O Declarante', name: str(v.declaranteNome) || undefined },
          { role: fI ? 'A Instrutora' : 'O Instrutor', name: str(v.instrutorNome) || undefined, detail: str(v.instrutorCargo) || undefined },
          ...(str(v.secretarioNome) ? [{ role: 'O Secretário', name: str(v.secretarioNome) }] : []),
        ],
      },
    );
    return blocks;
  },
});
