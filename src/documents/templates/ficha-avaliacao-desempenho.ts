// Ficha de avaliação de desempenho: criteria scored on a 1–5 scale, goals,
// strengths, points to improve, training plan, the employee's comments and the
// proposal (promotion, training, end of probation). The appraisal supports
// promotions and pay decisions and goes to the personnel file.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField, refField, workerFields } from './_shared';
import { linhas, str } from './_rh-politicas';

const ESCALA = ['', 'Insuficiente', 'A melhorar', 'Bom', 'Muito bom', 'Excelente'];
const FINALIDADE: Record<string, string> = {
  anual: 'Avaliação anual',
  probatorio: 'Fim do período probatório',
  promocao: 'Preenchimento de vaga / promoção',
  rendimento: 'Averiguação de baixo rendimento',
  pedido: 'A pedido do trabalhador',
};
const PROPOSTA: Record<string, string> = {
  manter: 'Manter na função actual',
  promover: 'Propor promoção',
  progressao: 'Propor progressão salarial',
  formacao: 'Acções de formação',
  confirmar: 'Confirmar a admissão (fim do período probatório)',
  acompanhamento: 'Plano de acompanhamento e nova avaliação',
};
const nota = (x: unknown) => {
  const n = Number(x);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : null;
};
const fmt1 = (n: number) => n.toFixed(1).replace('.', ',');

export default defineTemplate({
  id: 'ficha-avaliacao-desempenho',
  family: 'mapa',
  sections: [
    { id: 'documento', title: l('Avaliação', 'Appraisal') },
    { id: 'trabalhador', title: l('Trabalhador avaliado', 'Employee appraised'), personRole: 'trabalhador' },
    { id: 'criterios', title: l('Critérios', 'Criteria') },
    { id: 'objectivos', title: l('Objectivos', 'Goals') },
    { id: 'conclusoes', title: l('Conclusões', 'Conclusions') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data da avaliação', 'Appraisal date')),
    { name: 'periodoInicio', type: 'date', section: 'documento', width: 'half', label: l('Período avaliado: de', 'Period from') },
    { name: 'periodoFim', type: 'date', section: 'documento', width: 'half', label: l('até', 'to') },
    { name: 'finalidade', type: 'select', section: 'documento', width: 'half', label: l('Finalidade', 'Purpose'), default: 'anual', options: Object.entries(FINALIDADE).map(([value, pt]) => ({ value, label: l(pt, pt) })) },
    { name: 'avaliadorNome', type: 'text', section: 'documento', width: 'half', label: l('Avaliador (nome)', 'Appraiser (name)') },
    { name: 'avaliadorCargo', type: 'text', section: 'documento', width: 'half', label: l('Cargo do avaliador', 'Appraiser’s position') },
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'departamento', 'dataAdmissao']),
    {
      name: 'criterios',
      type: 'lines',
      section: 'criterios',
      label: l('Critérios (nota de 1 a 5)', 'Criteria (score 1 to 5)'),
      addLabel: l('Adicionar critério', 'Add criterion'),
      columns: [
        { name: 'criterio', type: 'text', label: l('Critério', 'Criterion') },
        { name: 'nota', type: 'number', label: l('Nota (1–5)', 'Score (1–5)'), min: 1, max: 5 },
        { name: 'observacao', type: 'text', label: l('Observação', 'Comment') },
      ],
      default: [
        { criterio: 'Qualidade do trabalho', nota: '', observacao: '' },
        { criterio: 'Produtividade e cumprimento de prazos', nota: '', observacao: '' },
        { criterio: 'Conhecimentos técnicos', nota: '', observacao: '' },
        { criterio: 'Assiduidade e pontualidade', nota: '', observacao: '' },
        { criterio: 'Responsabilidade e zelo', nota: '', observacao: '' },
        { criterio: 'Relacionamento e trabalho em equipa', nota: '', observacao: '' },
        { criterio: 'Iniciativa', nota: '', observacao: '' },
        { criterio: 'Cumprimento das normas de segurança', nota: '', observacao: '' },
      ],
    },
    {
      name: 'objectivos',
      type: 'lines',
      section: 'objectivos',
      label: l('Objectivos do período (opcional)', 'Goals for the period (optional)'),
      addLabel: l('Adicionar objectivo', 'Add goal'),
      columns: [
        { name: 'objectivo', type: 'text', label: l('Objectivo', 'Goal') },
        { name: 'resultado', type: 'text', label: l('Resultado alcançado', 'Result') },
        { name: 'nota', type: 'number', label: l('Nota (1–5)', 'Score (1–5)'), min: 1, max: 5 },
      ],
      default: [],
    },
    { name: 'pontosFortes', type: 'textarea', section: 'conclusoes', rows: 2, label: l('Pontos fortes', 'Strengths') },
    { name: 'aMelhorar', type: 'textarea', section: 'conclusoes', rows: 2, label: l('Aspectos a melhorar', 'Areas to improve') },
    { name: 'formacao', type: 'textarea', section: 'conclusoes', rows: 2, label: l('Formação recomendada', 'Recommended training') },
    { name: 'proposta', type: 'select', section: 'conclusoes', width: 'half', label: l('Proposta', 'Proposal'), default: 'manter', options: Object.entries(PROPOSTA).map(([value, pt]) => ({ value, label: l(pt, pt) })) },
    { name: 'comentarioTrabalhador', type: 'textarea', section: 'conclusoes', rows: 2, label: l('Comentário do trabalhador (opcional)', 'Employee’s comment (optional)'), help: l('Se ficar em branco, a ficha deixa linhas para o trabalhador escrever.', 'If blank, the form leaves lines for the employee to write.') },
  ],

  computed: (v) => {
    const notas = [...lineItems(v.criterios), ...lineItems(v.objectivos)].map((r) => nota(r.nota)).filter((n): n is number => n != null);
    const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    return { media };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const bad = lineItems(v.criterios).some((r) => r.nota !== '' && r.nota != null && nota(r.nota) == null);
    if (bad) w.push({ level: 'error', field: 'criterios', message: l('As notas vão de 1 a 5.', 'Scores range from 1 to 5.') });
    if (ctx.computed.media != null && ctx.computed.media < 3 && v.proposta === 'promover') w.push({ level: 'warning', field: 'proposta', message: l('Propõe promoção com média inferior a "Bom".', 'Promotion proposed with an average below "Good".') });
    w.push({ level: 'info', message: l(`A promoção tem em conta as qualificações, a atitude, a conduta disciplinar, a experiência e a antiguidade, e é registada no processo individual e aditada ao contrato (${cite('rhpAvaliacao')}).`, 'Promotion considers qualifications, attitude, discipline, experience and seniority, and is recorded in the file and added to the contract.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const crit = lineItems(v.criterios).filter((r) => str(r.criterio));
    const obj = lineItems(v.objectivos).filter((r) => str(r.objectivo));
    const media = ctx.computed.media as number | null;
    const txt = (x: unknown) => linhas(x).join('; ');
    const marca = (n: number | null, k: number) => (n === k ? 'X' : '');
    const blocks: Block[] = [
      { type: 'title', text: 'Ficha de Avaliação de Desempenho', subtitle: FINALIDADE[v.finalidade as string] ?? FINALIDADE.anual },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Trabalhador', value: str(v.trabalhadorNome) || BLANK },
          { label: 'Função', value: str(v.trabalhadorCargo) || BLANK },
          { label: 'Categoria', value: str(v.trabalhadorCategoria) || BLANK },
          { label: 'Departamento', value: str(v.trabalhadorDepartamento) || BLANK },
          { label: 'Admissão', value: dateLong(v.trabalhadorDataAdmissao) },
          { label: 'Período avaliado', value: v.periodoInicio || v.periodoFim ? `${dateLong(v.periodoInicio)} a ${dateLong(v.periodoFim)}` : BLANK },
          { label: 'Avaliador', value: [str(v.avaliadorNome), str(v.avaliadorCargo)].filter(Boolean).join(', ') || BLANK },
          { label: 'Data', value: dateLong(v.data) },
        ],
      },
      { type: 'note', text: `Escala: 1 — ${ESCALA[1]}; 2 — ${ESCALA[2]}; 3 — ${ESCALA[3]}; 4 — ${ESCALA[4]}; 5 — ${ESCALA[5]}.` },
      {
        type: 'table',
        grid: true,
        columns: [
          { label: 'Critério', width: 0.34 },
          { label: '1', width: 0.05, align: 'center' },
          { label: '2', width: 0.05, align: 'center' },
          { label: '3', width: 0.05, align: 'center' },
          { label: '4', width: 0.05, align: 'center' },
          { label: '5', width: 0.05, align: 'center' },
          { label: 'Observação', width: 0.41 },
        ],
        rows: (crit.length ? crit : [{ criterio: BLANK }]).map((r) => {
          const n = nota(r.nota);
          return [str(r.criterio), marca(n, 1), marca(n, 2), marca(n, 3), marca(n, 4), marca(n, 5), str(r.observacao)];
        }),
      },
    ];
    if (obj.length) {
      blocks.push({
        type: 'table',
        grid: true,
        columns: [
          { label: 'Objectivo', width: 0.4 },
          { label: 'Resultado alcançado', width: 0.48 },
          { label: 'Nota', width: 0.12, align: 'center' },
        ],
        rows: obj.map((r) => [str(r.objectivo), str(r.resultado) || '—', nota(r.nota) != null ? String(nota(r.nota)) : '']),
      });
    }
    blocks.push({
      type: 'keyValue',
      columns: 1,
      items: [
        { label: 'Classificação final', value: media != null ? `${fmt1(media)} — ${ESCALA[Math.min(5, Math.max(1, Math.round(media)))]}` : '________' },
        { label: 'Pontos fortes', value: txt(v.pontosFortes) || BLANK },
        { label: 'Aspectos a melhorar', value: txt(v.aMelhorar) || BLANK },
        { label: 'Formação recomendada', value: txt(v.formacao) || BLANK },
        { label: 'Proposta', value: PROPOSTA[v.proposta as string] ?? PROPOSTA.manter },
      ],
    });
    const com = txt(v.comentarioTrabalhador);
    blocks.push({ type: 'box', label: 'Comentário do trabalhador', text: com || undefined, lines: com ? 0 : 3, keepWithNext: true });
    blocks.push({
      type: 'signatures',
      columns: [
        { role: 'O Avaliador', name: str(v.avaliadorNome) || undefined, detail: str(v.avaliadorCargo) || undefined },
        { role: v.trabalhadorGenero === 'F' ? 'A Trabalhadora (tomei conhecimento)' : 'O Trabalhador (tomei conhecimento)', name: str(v.trabalhadorNome) || undefined },
        { role: 'Homologação da Direcção', detail: 'Data: ___/___/______' },
      ],
    });
    return blocks;
  },
});
