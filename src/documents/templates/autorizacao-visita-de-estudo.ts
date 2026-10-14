// Autorização para visita de estudo: the school informs parents about an
// outing (destination, dates, transport, teachers in charge, cost) and the
// parent signs and returns the tear-off authorisation, including consent for
// urgent medical care. Trips abroad also need the minor's travel authorisation
// with a certified signature.

import { diffDays, formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, formatMoney, l, localField, money } from './_shared';
import { rows, semPonto, str } from './_educacao';

export default defineTemplate({
  id: 'autorizacao-visita-de-estudo',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'visita', title: l('Visita de estudo', 'School trip') },
    { id: 'responsaveis', title: l('Professores responsáveis', 'Teachers in charge') },
    { id: 'autorizacao', title: l('Talão de autorização', 'Consent slip') },
  ],
  fields: [
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Referência (opcional)', 'Reference (optional)') },
    localField(),
    dateField(),
    { name: 'turmas', type: 'text', section: 'documento', width: 'half', label: l('Classes / turmas', 'Grades / classes'), placeholder: l('Ex.: 7.ª classe, turmas A e B', 'E.g. Grade 7, A and B') },
    {
      name: 'tipoActividade',
      type: 'select',
      section: 'visita',
      width: 'half',
      label: l('Actividade', 'Activity'),
      options: [
        { value: 'visita de estudo', label: l('Visita de estudo', 'Study visit') },
        { value: 'excursão', label: l('Excursão', 'Excursion') },
        { value: 'actividade desportiva', label: l('Actividade / torneio desportivo', 'Sports activity') },
        { value: 'acampamento', label: l('Acampamento', 'Camp') },
        { value: 'actividade cultural', label: l('Actividade cultural', 'Cultural activity') },
      ],
      default: 'visita de estudo',
    },
    { name: 'destino', type: 'text', section: 'visita', required: true, label: l('Destino', 'Destination'), placeholder: l('Ex.: Museu de História Natural, Maputo', 'E.g. Natural History Museum, Maputo') },
    { name: 'objectivo', type: 'text', section: 'visita', label: l('Objectivo pedagógico', 'Learning objective'), placeholder: l('Ex.: observar as espécies estudadas em Biologia', 'E.g. see the species studied in Biology') },
    { name: 'dataVisita', type: 'date', section: 'visita', width: 'half', required: true, label: l('Data', 'Date') },
    { name: 'dataRegresso', type: 'date', section: 'visita', width: 'half', label: l('Data de regresso (se pernoitar)', 'Return date (overnight trips)') },
    { name: 'horaPartida', type: 'text', section: 'visita', width: 'half', label: l('Hora de partida', 'Departure time'), placeholder: l('Ex.: 7h30', 'E.g. 7:30') },
    { name: 'localPartida', type: 'text', section: 'visita', width: 'half', label: l('Local de partida', 'Departure point'), default: 'portão principal da Escola' },
    { name: 'horaRegresso', type: 'text', section: 'visita', width: 'half', label: l('Regresso previsto', 'Expected return'), placeholder: l('Ex.: 13h00, na Escola', 'E.g. 13:00 at school') },
    { name: 'transporte', type: 'text', section: 'visita', width: 'half', label: l('Transporte', 'Transport'), placeholder: l('Ex.: autocarro contratado pela Escola', 'E.g. bus hired by the school') },
    { name: 'custo', type: 'money', section: 'visita', width: 'half', label: l('Custo por aluno (opcional)', 'Cost per pupil (optional)') },
    { name: 'custoInclui', type: 'text', section: 'visita', width: 'half', label: l('O custo inclui', 'Cost includes'), placeholder: l('Ex.: transporte, entrada e lanche', 'E.g. transport, ticket and snack'), showIf: (v) => money(v.custo) != null },
    { name: 'levar', type: 'text', section: 'visita', label: l('O aluno deve levar', 'Pupils should bring'), default: 'uniforme escolar, chapéu, água e lanche' },
    { name: 'seguro', type: 'toggle', section: 'visita', label: l('Os alunos estão cobertos por seguro', 'Pupils are insured') },
    { name: 'alojamento', type: 'text', section: 'visita', label: l('Alojamento (se pernoitar)', 'Lodging (overnight)'), showIf: (v) => Boolean(v.dataRegresso) },
    {
      name: 'responsaveis',
      type: 'lines',
      section: 'responsaveis',
      label: l('Professores e adultos responsáveis', 'Teachers and adults in charge'),
      addLabel: l('Adicionar responsável', 'Add person'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'telefone', type: 'tel', label: l('Telefone', 'Phone') },
      ],
      default: [],
    },
    { name: 'dataDevolucao', type: 'date', section: 'autorizacao', width: 'half', required: true, label: l('Devolver a autorização até', 'Return the consent by') },
    { name: 'entregarA', type: 'text', section: 'autorizacao', width: 'half', label: l('Entregar a', 'Hand to'), default: 'Director de Turma' },
    { name: 'alunoNome', type: 'text', section: 'autorizacao', width: 'half', label: l('Nome do aluno (opcional)', "Pupil's name (optional)"), help: l('Deixe em branco para imprimir o mesmo talão para toda a turma.', 'Leave blank to print one slip for the whole class.') },
    { name: 'encarregadoNome', type: 'text', section: 'autorizacao', width: 'half', label: l('Nome do encarregado (opcional)', "Parent's name (optional)") },
    { name: 'assinante', type: 'text', section: 'documento', width: 'half', label: l('Assina', 'Signed by'), default: 'A Direcção Pedagógica' },
  ],
  warnings: (v) => {
    const w: Warning[] = [];
    if (v.dataDevolucao && v.dataVisita && diffDays(v.dataDevolucao, v.dataVisita) < 1)
      w.push({ level: 'error', field: 'dataDevolucao', message: l('A autorização deve ser devolvida antes da data da visita.', 'Consent must be returned before the trip.') });
    if (v.dataRegresso || v.tipoActividade === 'acampamento' || /praia|piscina|rio|lago|barco|mar\b/i.test(str(v.destino)))
      w.push({ level: 'warning', message: l('Actividade com pernoita ou junto à água: confirme o seguro, o número suficiente de adultos responsáveis (de ambos os sexos, se houver pernoita) e as condições de segurança.', 'Overnight or water activity: check insurance, enough adults in charge and safety.') });
    if (!rows(v.responsaveis).some((r) => str(r.nome))) w.push({ level: 'warning', field: 'responsaveis', message: l('Indique os professores responsáveis e os seus contactos.', 'List the teachers in charge and their phones.') });
    if (/[aá]frica do sul|essuat|swazi|malawi|zimb|tanz|zâmbia|zambia|portugal|estrangeiro/i.test(str(v.destino)))
      w.push({ level: 'warning', field: 'destino', message: l('Viagem ao estrangeiro: cada menor precisa também da autorização de viagem dos pais com assinatura reconhecida.', 'Trip abroad: each minor also needs a parental travel authorisation with certified signature.') });
    if (!v.seguro) w.push({ level: 'info', field: 'seguro', message: l('Considere um seguro de acidentes pessoais para os alunos durante a actividade.', 'Consider personal-accident insurance for the activity.') });
    return w;
  },
  personName: (v) => str(v.alunoNome) || semPonto(v.destino) || undefined,
  documentDate: (v) => str(v.dataVisita) || undefined,
  blocks: (ctx) => {
    const v = ctx.values;
    const destino = aDestino(semPonto(v.destino));
    const act = str(v.tipoActividade) || 'visita de estudo';
    const masc = act === 'acampamento';
    const resp = rows(v.responsaveis).filter((r) => str(r.nome));
    const quando = v.dataRegresso && v.dataRegresso !== v.dataVisita ? `de ${dateLong(v.dataVisita)} a ${dateLong(v.dataRegresso)}` : dateLong(v.dataVisita);
    const items = [
      { label: 'Destino', value: semPonto(v.destino) || BLANK },
      { label: 'Data', value: quando },
      { label: 'Partida', value: [str(v.horaPartida), semPonto(v.localPartida)].filter(Boolean).join(', ') || BLANK },
      { label: 'Regresso previsto', value: semPonto(v.horaRegresso) || BLANK },
      ...(str(v.transporte) ? [{ label: 'Transporte', value: semPonto(v.transporte) }] : []),
      ...(str(v.alojamento) ? [{ label: 'Alojamento', value: semPonto(v.alojamento) }] : []),
      ...(money(v.custo) != null ? [{ label: 'Custo por aluno', value: `${formatMoney(money(v.custo))}${str(v.custoInclui) ? ` (inclui ${semPonto(v.custoInclui)})` : ''}` }] : []),
      ...(str(v.levar) ? [{ label: 'Levar', value: semPonto(v.levar) }] : []),
      { label: 'Seguro', value: v.seguro ? 'Sim' : 'Não' },
      ...(resp.length ? [{ label: 'Responsáveis', value: resp.map((r) => `${str(r.nome)}${str(r.telefone) ? ` (${str(r.telefone)})` : ''}`).join('; ') }] : []),
    ];
    const blocks: Block[] = [
      { type: 'title', text: act.charAt(0).toUpperCase() + act.slice(1), subtitle: [str(v.turmas), str(v.numero) ? `Ref.ª ${str(v.numero)}` : ''].filter(Boolean).join(' · ') || undefined },
      { type: 'salutation', text: 'Prezados Pais e Encarregados de Educação,' },
      {
        type: 'paragraph',
        id: 'informacao',
        text: `Informamos que a Escola organiza ${masc ? 'um' : 'uma'} ${act} ${destino || `a ${BLANK}`}${str(v.objectivo) ? `, com o objectivo de ${semPonto(v.objectivo).replace(/^(de|para) /i, '')}` : ''}, nas condições seguintes:`,
        en: 'The school is organising the trip described below.',
        keepWithNext: true,
      },
      { type: 'keyValue', columns: 1, items },
      {
        type: 'paragraph',
        id: 'participacao',
        text: `A participação depende de autorização escrita do Encarregado de Educação, a entregar ${/^(Directora|Professora|Coordenadora|Secretaria)\b/.test(semPonto(v.entregarA)) ? 'à' : 'ao'} ${semPonto(v.entregarA) || 'Director de Turma'} até ${v.dataDevolucao ? dateLong(v.dataDevolucao) : BLANK}. Os alunos que não participem têm actividades lectivas na Escola. Se o custo for um obstáculo, o Encarregado pode contactar a Direcção.`,
        en: 'Participation requires written consent by the stated date. Pupils who do not go have classes at school. Parents for whom the cost is a problem may contact the school.',
      },
      {
        type: 'paragraph',
        id: 'assinatura',
        text: `${ctx.place}, ${dateLong(v.data)}.   ${str(v.assinante) || 'A Direcção Pedagógica'}${ctx.profile?.representanteNome ? `, **${ctx.profile.representanteNome}**` : ''}`,
        en: 'Place, date and the school management.',
        align: 'right',
        editable: false,
      },
      {
        type: 'box',
        cut: true,
        label: `Autorização do Encarregado de Educação — devolver até ${v.dataDevolucao ? formatDateShort(v.dataDevolucao) : '___/___/______'}`,
        text: `Eu, ${str(v.encarregadoNome) || '________________________________'}, Encarregado(a) de Educação do(a) aluno(a) ${str(v.alunoNome) || '________________________________'}, da _____ classe, turma ____,   ☐ AUTORIZO    ☐ NÃO AUTORIZO   o meu educando a participar ${masc ? 'no' : 'na'} ${act} ${destino || 'a ________________'}, ${v.dataRegresso ? `de ${formatDateShort(v.dataVisita)} a ${formatDateShort(v.dataRegresso)}` : `no dia ${formatDateShort(v.dataVisita)}`}, nas condições descritas, e autorizo os professores responsáveis a tomar as medidas urgentes necessárias em caso de acidente ou doença, incluindo o transporte a uma unidade sanitária, sendo eu informado(a) de imediato.\nSaúde (alergias, medicação): ______________________   Contacto de emergência: ______________\nAssinatura: ______________________________     Data: ___/___/______`,
      },
    ];
    return blocks;
  },
});

/** "ao Museu…", "à Ilha de Moçambique", "a Inhambane": the preposition for a destination. */
function aDestino(d: string): string {
  if (!d) return '';
  if (/^(ao|à|a|aos|às)\s/i.test(d)) return d;
  if (/^(museu|parque|jardim|centro|instituto|porto|aeroporto|mercado|monte|forte|bairro|distrito|complexo|planetário|zoológico|campo|teatro|palácio|estádio|hospital|banco|conselho|ministério)\b/i.test(d)) return `ao ${d}`;
  if (/^(fortaleza|praia|ilha|reserva|cidade|fábrica|escola|baía|catedral|casa|vila|barragem|biblioteca|universidade|assembleia|feira|serra|estação|quinta|machamba|empresa|central)\b/i.test(d)) return `à ${d}`;
  return `a ${d}`;
}
