import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, l, lawyerFields, lineItems, localField } from './_shared';
import { courtAddressee, nomeParte, parteF } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, fechoField, lawyerWarnings, parteNome, processoFields, sem, str } from './_processo-civil';

export default defineTemplate({
  id: 'rol-de-testemunhas',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'testemunhas', title: l('Testemunhas', 'Witnesses') },
    { id: 'outras', title: l('Outras provas (opcional)', 'Other evidence (optional)') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    ...parteNome('parte', 'partes', 'Parte que apresenta (o seu cliente)', 'Party filing (your client)', 'empresa'),
    { name: 'qualidade', type: 'select', section: 'partes', width: 'half', label: l('Posição no processo', 'Role in the case'), options: QUALIDADE_PC_OPTIONS, default: 'autor' },
    ...parteNome('contraria', 'partes', 'Parte contrária (opcional)', 'Other party (optional)', 'empresa', false),
    {
      name: 'tipo',
      type: 'radio',
      section: 'testemunhas',
      label: l('Requerimento', 'Application'),
      default: 'rol',
      options: [
        { value: 'rol', label: l('Apresentação do rol e de outras provas', 'Witness list and other evidence') },
        { value: 'alteracao', label: l('Alteração ou aditamento do rol', 'Change or addition to the list') },
      ],
    },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'testemunhas',
      label: l('Testemunhas', 'Witnesses'),
      addLabel: l('Adicionar testemunha', 'Add witness'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'profissao', type: 'text', label: l('Profissão', 'Occupation') },
        { name: 'morada', type: 'text', label: l('Residência', 'Residence') },
        { name: 'artigos', type: 'text', label: l('Artigos (opcional)', 'Articles (optional)'), placeholder: l('Ex.: 3.º a 9.º', 'E.g. 3 to 9') },
      ],
      default: [],
    },
    {
      name: 'apresentacao',
      type: 'radio',
      section: 'testemunhas',
      label: l('As testemunhas', 'The witnesses'),
      default: 'apresentar',
      options: [
        { value: 'apresentar', label: l('São apresentadas pela parte', 'Will be brought by the party') },
        { value: 'notificar', label: l('Devem ser notificadas pelo tribunal', 'Must be summoned by the court') },
      ],
    },
    { name: 'substituida', type: 'text', section: 'testemunhas', label: l('Testemunha substituída (alteração)', 'Witness replaced (change)'), showIf: (v) => v.tipo === 'alteracao' },
    { name: 'depoimentoParte', type: 'text', section: 'outras', label: l('Depoimento de parte da parte contrária, aos artigos', 'Testimony of the other party, on articles'), placeholder: l('Ex.: 5.º a 12.º da contestação', 'E.g. 5 to 12 of the defence') },
    { name: 'pericia', type: 'text', section: 'outras', label: l('Prova pericial (objecto)', 'Expert evidence (subject)'), placeholder: l('Ex.: avaliação dos defeitos da cobertura do armazém', 'E.g. assessment of the roof defects') },
    { name: 'requisicao', type: 'text', section: 'outras', label: l('Requisição de documentos a terceiros', 'Documents to be requested from third parties'), placeholder: l('Ex.: extractos da conta n.º … ao Banco X, de Janeiro a Junho de 2026', 'E.g. bank statements') },
    { name: 'inspeccao', type: 'text', section: 'outras', label: l('Inspecção judicial (local)', 'Site inspection (place)') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`${cite('pcProva')}. Confirme o prazo para apresentar ou alterar o rol e o número máximo de testemunhas.`, 'Confirm the time limit and the maximum number of witnesses.') },
    ];
    if (lineItems(v.testemunhas).filter((t) => str(t.nome)).length === 0) w.push({ level: 'warning', field: 'testemunhas', message: l('Indique pelo menos uma testemunha (nome, profissão e residência).', 'List at least one witness.') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.parteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.autor;
    const f = parteF(v, 'parte');
    const papel = f ? q.f : q.m;
    const contra = str(v.contrariaNome) ? `, em que é ${parteF(v, 'contraria') ? q.cf : q.cm} ${nomeParte(v, 'contraria')}` : '';
    const tipo = str(v.tipoAccao) || '____________________';
    const alt = v.tipo === 'alteracao';
    const testemunhas = lineItems(v.testemunhas)
      .filter((t) => str(t.nome))
      .map((t) => `${str(t.nome)}${str(t.profissao) ? `, ${sem(t.profissao)}` : ''}${str(t.morada) ? `, residente em ${sem(t.morada)}` : ''}${str(t.artigos) ? ` — aos artigos ${sem(t.artigos)}` : ''}.`);

    const outras: string[] = [];
    if (str(v.depoimentoParte)) outras.push(`Depoimento de parte ${parteF(v, 'contraria') ? 'da' : 'do'} ${parteF(v, 'contraria') ? q.cf : q.cm}, à matéria dos artigos ${sem(v.depoimentoParte)}`);
    if (str(v.pericia)) outras.push(`Prova pericial, tendo por objecto ${sem(v.pericia)}, indicando-se oportunamente o perito`);
    if (str(v.requisicao)) outras.push(`Requisição de documentos: ${sem(v.requisicao)}`);
    if (str(v.inspeccao)) outras.push(`Inspecção judicial a ${sem(v.inspeccao)}`);

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${nomeParte(v, 'parte')}, ${papel} nos autos de ${tipo}${contra}, e neles melhor ${f ? 'identificada' : 'identificado'}, vem, por intermédio do seu mandatário judicial, ${alt ? `requerer a ${str(v.substituida) ? 'alteração' : 'alteração e aditamento'} do seu rol de testemunhas${str(v.substituida) ? `, substituindo a testemunha ${sem(v.substituida)}` : ''}, passando a indicar as seguintes:` : 'apresentar o seu rol de testemunhas e requerer a produção da prova seguinte:'}`,
        en: 'The party files its witness list and evidence requests.',
      },
      { type: 'paragraph', id: 'rolTitulo', align: 'center', text: '**ROL DE TESTEMUNHAS**', en: 'WITNESSES', keepWithNext: true },
      { type: 'list', style: 'numeric', items: testemunhas.length ? testemunhas : ['____________________'] },
      { type: 'paragraph', id: 'apresentacao', text: v.apresentacao === 'notificar' ? 'As testemunhas devem ser notificadas para comparecer na audiência de julgamento.' : 'As testemunhas serão apresentadas pela parte na audiência de julgamento.', en: 'How the witnesses attend.' },
    ];
    if (outras.length) {
      blocks.push(
        { type: 'paragraph', id: 'outrasTitulo', align: 'center', text: '**OUTROS MEIOS DE PROVA**', en: 'OTHER EVIDENCE', keepWithNext: true },
        { type: 'list', style: 'alpha', items: outras.map((o, i) => `${o}${i === outras.length - 1 ? '.' : ';'}`) },
      );
    }
    blocks.push(...closing(ctx, { intro: `Termos em que requer a V. Ex.ª se digne admitir ${outras.length ? 'o rol e os meios de prova indicados' : 'o presente rol'}.`, introEn: 'The party asks the court to admit the evidence.' }));
    return blocks;
  },
});
