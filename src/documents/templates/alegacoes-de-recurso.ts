import { addDays, formatDateLong } from '@/lib/format';
import { defineTemplate, type Block, type DocumentTemplate, type FieldOption, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, l, lawyerFields, localField, splitLines } from './_shared';
import { artigos, courtAddressee, nomeParte, parteF } from './_advocacia';
import { closing, lawyerWarnings, parteNome, processoFields, sem, str } from './_processo-civil';

const ESPECIE_OPTIONS: FieldOption[] = [
  { value: 'apelacao', label: l('Apelação', 'Appeal') },
  { value: 'agravo', label: l('Agravo', 'Interlocutory appeal') },
  { value: 'revista', label: l('Revista', 'Appeal on points of law') },
];
const ESPECIE_TXT: Record<string, string> = { apelacao: 'apelação', agravo: 'agravo', revista: 'revista' };

const JUIZES_OPTIONS: FieldOption[] = [
  { value: 'tsr', label: l('Tribunal Superior de Recurso (Juízes Desembargadores)', 'Court of Appeal') },
  { value: 'ts', label: l('Tribunal Supremo (Juízes Conselheiros)', 'Supreme Court') },
];

const contra = (v: Values) => v.posicao === 'recorrido';

/** "da sentença de …" / "do despacho de …" / "de …" */
function daDecisao(x: unknown): string {
  const t = sem(x);
  if (!t) return 'de ____________________';
  if (/^a\s/i.test(t)) return `da ${t.slice(2)}`;
  if (/^o\s/i.test(t)) return `do ${t.slice(2)}`;
  return `de ${t}`;
}

/** Alegações (by the appellant) and contra-alegações (by the respondent) share one template. */
export function alegacoes(id: string, posicao: 'recorrente' | 'recorrido'): DocumentTemplate {
  return defineTemplate({
    id,
    family: 'peca',
    official: 'tribunal',
    letterhead: false,
    sections: [
      { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
      { id: 'partes', title: l('Partes', 'Parties') },
      { id: 'recurso', title: l('Recurso', 'Appeal') },
      { id: 'alegacoes', title: l('Alegações', 'Submissions') },
      { id: 'conclusoes', title: l('Conclusões', 'Conclusions') },
      { id: 'advogado', title: l('Advogado', 'Lawyer') },
      { id: 'documento', title: l('Local e data', 'Place and date') },
    ],
    fields: [
      ...processoFields('tribunal'),
      {
        name: 'posicao',
        type: 'radio',
        section: 'partes',
        label: l('Apresenta', 'Filing'),
        default: posicao,
        options: [
          { value: 'recorrente', label: l('Alegações (sou o recorrente)', 'Submissions (appellant)') },
          { value: 'recorrido', label: l('Contra-alegações (sou o recorrido)', 'Reply submissions (respondent)') },
        ],
      },
      ...parteNome('cliente', 'partes', 'O seu cliente', 'Your client', 'empresa'),
      ...parteNome('outra', 'partes', 'Parte contrária', 'Other party', 'empresa', false),
      { name: 'especie', type: 'select', section: 'recurso', width: 'half', label: l('Espécie de recurso', 'Type of appeal'), options: ESPECIE_OPTIONS, default: 'apelacao' },
      { name: 'dataNotificacao', type: 'date', section: 'recurso', width: 'half', label: l('Notificado para alegar em', 'Notified to file on'), help: l('Data da notificação do despacho que admitiu o recurso (ou das alegações do recorrente).', 'Date of notice of the order admitting the appeal (or of the appellant’s submissions).') },
      { name: 'juizes', type: 'radio', section: 'recurso', label: l('Tribunal que julga o recurso', 'Court hearing the appeal'), options: JUIZES_OPTIONS, default: 'tsr' },
      { name: 'decisaoRecorrida', type: 'text', section: 'recurso', required: true, label: l('Decisão recorrida', 'Decision appealed'), placeholder: l('Ex.: a sentença de 30 de Setembro de 2026, que julgou a acção procedente', 'E.g. the judgment of 30 September 2026'), help: l('Completa «Vem o presente recurso interposto de …».', 'Completes “This appeal is brought against …”.') },
      {
        name: 'alegacoesTexto',
        type: 'textarea',
        section: 'alegacoes',
        rows: 10,
        required: true,
        label: l('Alegações (um parágrafo numerado por linha)', 'Submissions (one numbered paragraph per line)'),
        help: l('Exponha os erros de facto e de direito da decisão (ou, nas contra-alegações, porque está certa). Se impugnar a matéria de facto, indique os pontos concretos e as provas.', 'Set out the errors of fact and law (or why the decision is right).'),
      },
      {
        name: 'conclusoesTexto',
        type: 'textarea',
        section: 'conclusoes',
        rows: 6,
        required: true,
        label: l('Conclusões (uma por linha)', 'Conclusions (one per line)'),
        help: l('Síntese dos fundamentos. O tribunal de recurso só conhece das questões incluídas nas conclusões.', 'Summary of the grounds. The appeal court only decides the issues in the conclusions.'),
      },
      { name: 'normasVioladas', type: 'text', section: 'conclusoes', label: l('Normas violadas (opcional)', 'Provisions breached (optional)'), placeholder: l('Ex.: os artigos 798.º e 805.º do Código Civil', 'E.g. the Civil Code provisions'), showIf: (v) => !contra(v) },
      {
        name: 'pedidoRecurso',
        type: 'text',
        section: 'conclusoes',
        label: l('O que pede ao tribunal de recurso', 'What you ask the appeal court'),
        placeholder: l('Ex.: revogar a sentença e absolver a Ré do pedido', 'E.g. reverse the judgment and dismiss the claim'),
        help: l('Completa «… deve ser dado provimento ao recurso e, em consequência, …». Nas contra-alegações pode deixar vazio.', 'Completes “… the appeal should be allowed and …”.'),
      },
      { name: 'documentos', type: 'textarea', section: 'conclusoes', rows: 2, label: l('Documentos juntos (opcional)', 'Documents attached (optional)'), help: l('Só nos casos em que a lei admite a junção com as alegações.', 'Only where the law allows filing documents with the submissions.') },
      ...lawyerFields('advogado'),
      localField('documento'),
      dateField('data', 'documento'),
    ],

    computed: (_v, ctx) => ({ dias: ctx.legal.value<{ dias: number }>('pcAlegacoes').dias }),

    warnings: (v, ctx) => {
      const dias = ctx.computed.dias as number;
      const fim = v.dataNotificacao ? addDays(v.dataNotificacao as string, dias) : '';
      const w: Warning[] = [
        {
          level: 'info',
          field: 'dataNotificacao',
          message: l(
            `Na apelação, as alegações são apresentadas em ${dias} dias a contar da notificação do despacho que admitiu o recurso, e o recorrido responde em prazo igual (${cite('pcAlegacoes')}; valor a confirmar)${fim ? `; estimativa: ${formatDateLong(fim)}` : ''}. Confirme o prazo do agravo e da revista. Sem alegações, o recurso fica deserto.`,
            `In an apelação, submissions are due ${dias} days from notice of the order admitting the appeal (to be confirmed). Without submissions the appeal lapses.`,
          ),
        },
      ];
      if (splitLines(v.conclusoesTexto).length === 0) w.push({ level: 'error', field: 'conclusoesTexto', message: l('As alegações têm de terminar com conclusões.', 'Submissions must end with conclusions.') });
      return [...w, ...lawyerWarnings(v)];
    },

    personName: (v) => v.clienteNome,
    documentDate: (v) => v.data,

    blocks: (ctx) => {
      const v = ctx.values;
      const c = contra(v);
      const f = parteF(v, 'cliente');
      const papel = c ? (f ? 'Recorrida' : 'Recorrido') : 'Recorrente';
      const outraPapel = c ? 'Recorrente' : parteF(v, 'outra') ? 'Recorrida' : 'Recorrido';
      const ident = f ? 'identificada' : 'identificado';
      const notificado = f ? 'notificada' : 'notificado';
      const tipo = str(v.tipoAccao) || '____________________';
      const esp = ESPECIE_TXT[v.especie as string] ?? 'apelação';
      const outra = str(v.outraNome) ? `, em que é ${outraPapel} ${nomeParte(v, 'outra')}` : '';
      const ts = v.juizes === 'ts';
      const vocativo = ts ? 'VENERANDOS JUÍZES CONSELHEIROS' : 'VENERANDOS JUÍZES DESEMBARGADORES';
      const tituloPeca = c ? 'CONTRA-ALEGAÇÕES' : 'ALEGAÇÕES';

      const docs = splitLines(v.documentos);
      const conclusoes = splitLines(v.conclusoesTexto).map((s, i, a) => `${s.replace(/[.;]+$/, '')}${i === a.length - 1 ? '.' : ';'}`);
      const normas = !c && str(v.normasVioladas) ? `A decisão recorrida violou ${sem(v.normasVioladas)}.` : '';
      const pedidoFinal = c
        ? `Nestes termos e nos melhores de Direito que Vossas Excelências doutamente suprirão, deve ser negado provimento ao recurso, mantendo-se a decisão recorrida nos seus precisos termos, com custas pel${parteF(v, 'outra') ? 'a' : 'o'} Recorrente.`
        : `Nestes termos e nos melhores de Direito que Vossas Excelências doutamente suprirão, deve ser dado provimento ao presente recurso e, em consequência, ${sem(v.pedidoRecurso) || 'revogada a decisão recorrida, substituindo-se por outra que julgue nos termos expostos'}, com as legais consequências.`;

      const blocks: Block[] = [
        { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
        {
          type: 'paragraph',
          id: 'identificacao',
          text: `${nomeParte(v, 'cliente')}, ${papel} no recurso de ${esp} interposto nos autos de ${tipo}${outra}, e neles melhor ${ident}, tendo sido ${notificado}${v.dataNotificacao ? ` em ${dateLong(v.dataNotificacao)}` : ''} para o efeito, vem, por intermédio do seu mandatário judicial, apresentar as suas`,
          en: 'The party, notified for the purpose, files its',
        },
        { type: 'paragraph', id: 'titulo', align: 'center', text: `**${tituloPeca}**,`, en: c ? 'REPLY SUBMISSIONS' : 'APPEAL SUBMISSIONS' },
        { type: 'paragraph', id: 'termos', text: 'o que faz nos termos seguintes:', en: 'as follows:' },
        { type: 'paragraph', id: 'vocativo', align: 'center', text: `**${vocativo}${ts ? ' DO TRIBUNAL SUPREMO' : ' DO TRIBUNAL SUPERIOR DE RECURSO'}**`, en: 'To the judges of the appeal court' },
        {
          type: 'articulado',
          sections: [
            { heading: 'I — Do objecto do recurso', items: [`Vem o presente recurso interposto ${daDecisao(v.decisaoRecorrida)}.`] },
            { heading: c ? 'II — Da improcedência do recurso' : 'II — Dos fundamentos do recurso', items: artigos(v.alegacoesTexto).length ? artigos(v.alegacoesTexto) : ['____________________'] },
          ],
        },
        { type: 'paragraph', id: 'conclusoesTitulo', align: 'center', text: '**III — CONCLUSÕES**', en: 'III — Conclusions', keepWithNext: true },
        { type: 'list', style: 'alpha', items: conclusoes.length ? conclusoes : ['____________________'] },
      ];
      if (normas) blocks.push({ type: 'paragraph', id: 'normas', text: normas, en: 'Provisions breached by the decision.' });
      blocks.push(
        { type: 'paragraph', id: 'pedidoFinal', text: pedidoFinal, en: c ? 'The appeal should be dismissed and the decision upheld.' : 'The appeal should be allowed and the decision reversed.' },
        ...closing(ctx, {
          fecho: 'Assim se fará a costumada JUSTIÇA!',
          docs,
          duplicados: true,
          outrosJunta: [],
        }),
      );
      return blocks;
    },
  });
}

export default alegacoes('alegacoes-de-recurso', 'recorrente');
