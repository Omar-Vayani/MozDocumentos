// Auto de recepção da obra, provisória ou definitiva. Provisional acceptance
// records the final inspection, the defects to correct and the start of the
// warranty; final acceptance closes the warranty and releases retentions.
// Accepting works without reservations waives apparent defects, so every
// visible defect must be listed.

import { addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, splitLines } from './_shared';
import { int, lines, semPonto, str, valorTexto } from './_contratos';
import { assinaturasObra, dataPorExtenso, fechoAuto, hora, obraFields, obraTexto, partesObraFields, presentesItems, signatureRows } from './_construcao';

const isDef = (v: Record<string, unknown>) => v.tipo === 'definitiva';

export default defineTemplate({
  id: 'auto-de-recepcao-obra',
  family: 'acta',
  sections: [
    { id: 'auto', title: l('Tipo, data e local', 'Type, date and place') },
    { id: 'partes', title: l('Presentes', 'Parties present') },
    { id: 'obra', title: l('Obra e contrato', 'Works and contract') },
    { id: 'vistoria', title: l('Vistoria e defeitos', 'Inspection and defects') },
    { id: 'garantia', title: l('Garantia, retenções e contas', 'Warranty, retentions and accounts') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'auto',
      required: true,
      label: l('Recepção', 'Acceptance'),
      options: [
        { value: 'provisoria', label: l('Provisória (fim da obra)', 'Provisional (completion)') },
        { value: 'definitiva', label: l('Definitiva (fim da garantia)', 'Final (end of warranty)') },
      ],
      default: 'provisoria',
    },
    { name: 'data', type: 'date', section: 'auto', width: 'half', required: true, label: l('Data da vistoria', 'Inspection date'), default: (c) => c.today },
    { name: 'horaAuto', type: 'text', section: 'auto', width: 'half', label: l('Hora', 'Time'), placeholder: l('Ex.: 10:00', 'E.g. 10:00') },
    { name: 'local', type: 'text', section: 'auto', width: 'half', label: l('Cidade (para a data)', 'City (for the date)'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },

    ...partesObraFields('partes'),
    ...obraFields('obra'),

    { name: 'dataComunicacao', type: 'date', section: 'vistoria', width: 'half', label: l('Conclusão comunicada pelo empreiteiro em', 'Completion notified on'), showIf: (v) => !isDef(v) },
    { name: 'dataConclusao', type: 'date', section: 'vistoria', width: 'half', label: l('Data de conclusão da obra', 'Completion date'), showIf: (v) => !isDef(v) },
    { name: 'dataFimContratual', type: 'date', section: 'vistoria', width: 'half', label: l('Fim do prazo contratual (opcional)', 'Contract completion date (optional)'), showIf: (v) => !isDef(v) },
    { name: 'dataRecepcaoProvisoria', type: 'date', section: 'vistoria', width: 'half', required: true, label: l('Data da recepção provisória', 'Provisional acceptance date'), showIf: isDef },
    { name: 'ensaios', type: 'textarea', section: 'vistoria', rows: 2, label: l('Ensaios e verificações feitos (opcional)', 'Tests and checks carried out (optional)'), placeholder: l('Ex.: ensaio da rede de águas sob pressão; teste do quadro eléctrico e da terra; abertura de portas e janelas', 'E.g. water pressure test; electrical board and earthing test') },
    {
      name: 'semDefeitos',
      type: 'toggle',
      section: 'vistoria',
      label: l('Não foram encontrados defeitos', 'No defects were found'),
      help: l('Se houver defeitos visíveis, desligue e enumere-os todos: a obra recebida sem reservas presume-se aceite com os defeitos aparentes.', 'If there are visible defects, switch off and list them all: works accepted without reservation are presumed accepted with apparent defects.'),
    },
    {
      name: 'defeitos',
      type: 'lines',
      section: 'vistoria',
      label: l('Defeitos e trabalhos a corrigir', 'Defects and works to correct'),
      addLabel: l('Adicionar defeito', 'Add defect'),
      showIf: (v) => !v.semDefeitos,
      columns: [
        { name: 'local', type: 'text', label: l('Local / elemento', 'Location / element') },
        { name: 'descricao', type: 'text', label: l('Defeito', 'Defect') },
        { name: 'prazo', type: 'date', label: l('Corrigir até', 'Fix by') },
      ],
    },

    { name: 'garantiaMeses', type: 'number', section: 'garantia', width: 'half', min: 1, max: 120, default: 12, label: l('Prazo de garantia (meses)', 'Warranty period (months)'), help: l('O previsto no contrato. Não afasta a responsabilidade legal pelos imóveis de longa duração.', 'As in the contract. It does not limit statutory liability for long-lasting buildings.'), showIf: (v) => !isDef(v) },
    { name: 'retencoes', type: 'textarea', section: 'garantia', rows: 2, label: l('Garantias e retenções', 'Guarantees and retentions'), placeholder: l('Ex.: mantêm-se as retenções até à recepção definitiva / é libertada metade das retenções', 'E.g. retentions are kept until final acceptance / half of the retentions is released') },
    { name: 'valorLibertar', type: 'money', section: 'garantia', width: 'half', label: l('Valor a libertar', 'Amount to release'), showIf: isDef },
    { name: 'prazoLibertacaoDias', type: 'number', section: 'garantia', width: 'half', min: 0, max: 90, label: l('Libertação no prazo de (dias)', 'Released within (days)'), showIf: isDef },
    { name: 'elementosEntregues', type: 'textarea', section: 'garantia', rows: 3, label: l('Elementos entregues pelo empreiteiro (um por linha)', 'Items handed over by the contractor (one per line)'), showIf: (v) => !isDef(v), placeholder: l('Ex.: telas finais; 3 jogos de chaves; manuais e garantias dos equipamentos', 'E.g. as-built drawings; 3 sets of keys; equipment manuals') },
    { name: 'valorFinal', type: 'money', section: 'garantia', width: 'half', label: l('Valor total dos trabalhos executados', 'Total value of works done'), showIf: (v) => !isDef(v) },
    { name: 'valorPago', type: 'money', section: 'garantia', width: 'half', label: l('Valor pago até à data', 'Amount paid to date'), showIf: (v) => !isDef(v) },
  ],

  computed: (v) => {
    const defeitos = v.semDefeitos ? [] : lines(v.defeitos).filter((d) => str(d.descricao));
    const atraso = v.dataConclusao && v.dataFimContratual ? diffDays(String(v.dataFimContratual), String(v.dataConclusao)) : 0;
    const valorFinal = money(v.valorFinal);
    const pago = money(v.valorPago);
    return { defeitos, atraso, valorFinal, pago, saldo: valorFinal != null && pago != null ? valorFinal - pago : null };
  },

  warnings: (v, { computed: c, legal }) => {
    const w: Warning[] = [];
    if (!str(v.donoNome) || !str(v.empreiteiroNome)) w.push({ level: 'error', field: 'donoNome', message: l('Indique o dono da obra e o empreiteiro.', 'Enter the owner and the contractor.') });
    w.push({
      level: 'warning',
      field: 'defeitos',
      message: l(
        `Registe no auto todos os defeitos visíveis. Se receber a obra sem reservas, presume-se que aceitou os defeitos aparentes (${cite('empreitadaAceitacao')}).`,
        'List every visible defect. Accepting the works without reservations is presumed to accept apparent defects.',
      ),
    });
    if (!v.semDefeitos && !c.defeitos.length) w.push({ level: 'warning', field: 'defeitos', message: l('Enumere os defeitos ou marque "Não foram encontrados defeitos".', 'List the defects or tick "No defects were found".') });
    const d = legal.value<{ denunciaDias: number }>('empreitadaDefeitos');
    w.push({
      level: 'info',
      message: l(
        `Os defeitos que surgirem depois devem ser denunciados por escrito ao empreiteiro até ${d.denunciaDias} dias depois de descobertos (${cite('empreitadaDefeitos')}).`,
        `Defects found later must be reported in writing within ${d.denunciaDias} days of discovery.`,
      ),
    });
    if (!isDef(v)) {
      w.push({ level: 'info', message: l(`Peça ao município a licença de utilização; o auto de recepção não a substitui (${cite('obraLicencaUtilizacao')}).`, 'Apply to the municipality for the occupancy permit; this record does not replace it.') });
    } else if (v.dataRecepcaoProvisoria && v.data && String(v.data) < String(v.dataRecepcaoProvisoria)) {
      w.push({ level: 'error', field: 'data', message: l('A recepção definitiva é posterior à provisória.', 'Final acceptance comes after provisional acceptance.') });
    }
    return w;
  },

  personName: (v) => v.obraDesignacao,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const def = isDef(v);
    const tipoTxt = def ? 'definitiva' : 'provisória';
    const garantia = int(v.garantiaMeses);
    const defeitosTable: Block | null = c.defeitos.length
      ? {
          type: 'table',
          columns: [
            { label: 'N.º', width: 0.5, align: 'center' },
            { label: 'Local / elemento', width: 2 },
            { label: 'Defeito ou trabalho em falta', width: 4.4 },
            { label: 'Corrigir até', width: 1.4, align: 'center' },
          ],
          rows: c.defeitos.map((d: Record<string, unknown>, i: number) => [String(i + 1), str(d.local), str(d.descricao), d.prazo ? dateLong(d.prazo) : '']),
        }
      : null;

    const pontos: ClauseItem[] = [];
    if (!def) {
      const atraso = c.atraso > 0 ? `, com um atraso de ${c.atraso} ${c.atraso === 1 ? 'dia' : 'dias'} em relação ao prazo contratual` : v.dataFimContratual && v.dataConclusao ? ', dentro do prazo contratual' : '';
      pontos.push({
        id: 'conclusao',
        heading: 'Conclusão da obra',
        text: `${v.dataComunicacao ? `O Empreiteiro comunicou a conclusão dos trabalhos em ${dateLong(v.dataComunicacao)}. ` : ''}A obra foi concluída em ${dateLong(v.dataConclusao)}${atraso}.`,
        en: 'Completion of the works.',
      });
    } else {
      pontos.push({
        id: 'garantiaDecorrida',
        heading: 'Prazo de garantia',
        text: `Decorrido o prazo de garantia iniciado com a recepção provisória de ${dateLong(v.dataRecepcaoProvisoria)}, procedeu-se a nova vistoria da obra.`,
        en: 'The warranty period that began at provisional acceptance has ended and the works were inspected again.',
      });
    }
    pontos.push({
      id: 'vistoria',
      heading: 'Vistoria',
      text: `Efectuada a vistoria${str(v.ensaios) ? `, incluindo ${semPonto(v.ensaios).replace(/^./, (s) => s.toLowerCase())}` : ''}, verificou-se que ${
        c.defeitos.length
          ? def
            ? 'subsistem os defeitos indicados no quadro seguinte, que o Empreiteiro se obriga a corrigir, à sua custa, nos prazos indicados:'
            : 'a obra está em condições de ser recebida, com os defeitos e trabalhos em falta indicados no quadro seguinte, que o Empreiteiro se obriga a corrigir, à sua custa, nos prazos indicados:'
          : def
            ? 'os defeitos registados na recepção provisória foram corrigidos e que a obra não apresenta defeitos imputáveis ao Empreiteiro.'
            : 'a obra está executada de acordo com o contrato, o projecto e as regras da boa construção, não tendo sido encontrados defeitos aparentes.'
      }`,
      en: c.defeitos.length ? 'Defects found are listed below and will be corrected by the Contractor.' : 'No defects were found.',
    });

    const pontos2: ClauseItem[] = [];
    if (!def) {
      pontos2.push({
        id: 'recepcao',
        heading: 'Recepção',
        text: `Nestes termos, o Dono da Obra recebe provisoriamente a obra${c.defeitos.length ? ', com as reservas constantes do quadro anterior' : ''}, que passa a estar sob a sua guarda a partir desta data.`,
        en: 'The Owner provisionally accepts the works, which are in its custody from today.',
      });
      pontos2.push({
        id: 'garantia',
        heading: 'Prazo de garantia',
        text: `Inicia-se nesta data o prazo de garantia de ${garantia ? `${garantia} ${garantia === 1 ? 'mês' : 'meses'}` : `${BLANK} meses`}${garantia && v.data ? `, que termina em ${dateLong(addMonths(String(v.data), garantia))}` : ''}, durante o qual o Empreiteiro corrige, à sua custa, os defeitos que se revelem, sem prejuízo da responsabilidade prevista na lei para os imóveis destinados a longa duração.`,
        en: 'The warranty period starts today; statutory liability for long-lasting buildings is not affected.',
      });
      if (str(v.retencoes)) pontos2.push({ id: 'retencoes', heading: 'Garantias e retenções', text: `${semPonto(v.retencoes).replace(/^./, (s) => s.toUpperCase())}.`, en: 'Guarantees and retentions.' });
      const elementos = splitLines(v.elementosEntregues);
      if (elementos.length) pontos2.push({ id: 'elementos', heading: 'Elementos entregues', text: 'O Empreiteiro entrega ao Dono da Obra:', items: elementos.map(semPonto), en: 'Items handed over by the Contractor.' });
      if (c.valorFinal != null) {
        pontos2.push({
          id: 'contas',
          heading: 'Situação de contas',
          text: `Valor total dos trabalhos executados: ${valorTexto(c.valorFinal)}${c.pago != null ? `; pago até à data: ${valorTexto(c.pago)}; saldo: ${valorTexto(c.saldo)}` : ''}.`,
          en: 'Statement of account.',
        });
      }
    } else {
      pontos2.push({
        id: 'recepcaoDef',
        heading: 'Recepção definitiva',
        text: c.defeitos.length
          ? 'A recepção definitiva fica dependente da correcção dos defeitos indicados, que será verificada em nova vistoria.'
          : 'Nestes termos, o Dono da Obra recebe definitivamente a obra.',
        en: c.defeitos.length ? 'Final acceptance depends on correcting the defects.' : 'The Owner finally accepts the works.',
      });
      const libertar = money(v.valorLibertar);
      const dias = int(v.prazoLibertacaoDias);
      if (!c.defeitos.length && (libertar != null || str(v.retencoes))) {
        pontos2.push({
          id: 'libertacao',
          heading: 'Libertação de garantias',
          text: `${libertar != null ? `São libertadas as retenções e garantias prestadas pelo Empreiteiro, no valor de ${valorTexto(libertar)}${dias != null ? `, no prazo de ${dias} ${dias === 1 ? 'dia' : 'dias'}` : ''}.` : ''}${str(v.retencoes) ? ` ${semPonto(v.retencoes).replace(/^./, (s) => s.toUpperCase())}.` : ''}`.trim(),
          en: 'Retentions and guarantees are released.',
        });
      }
      pontos2.push({
        id: 'responsabilidade',
        heading: 'Responsabilidade legal',
        text: 'A recepção definitiva não afasta a responsabilidade do Empreiteiro, prevista na lei, por defeitos ocultos e pelos imóveis destinados a longa duração.',
        en: 'Final acceptance does not exclude the Contractor’s statutory liability for hidden defects and long-lasting buildings.',
      });
    }

    const cols = assinaturasObra(v);
    const blocks: Block[] = [
      { type: 'title', text: `Auto de Recepção ${def ? 'Definitiva' : 'Provisória'} da Obra`, subtitle: str(v.obraDesignacao) || undefined },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}${str(v.horaAuto) ? `, ${hora(v.horaAuto, 'pelas')}` : ''}, no local da obra de **${obraTexto(v)}**, sito em ${semPonto(v.obraLocal) || BLANK}${str(v.contratoRef) || v.contratoData ? `, executada ao abrigo do ${semPonto(v.contratoRef).replace(/^./, (s) => s.toLowerCase()) || 'contrato de empreitada'}${v.contratoData ? ` celebrado em ${dateLong(v.contratoData)}` : ''}` : ''}, reuniram-se:`,
        en: 'On the date and at the place stated, the following met:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: presentesItems(v) },
      { type: 'paragraph', id: 'objectivo', text: `a fim de procederem à vistoria da obra para efeitos de recepção ${tipoTxt}, tendo-se verificado o seguinte:`, en: `to inspect the works for ${def ? 'final' : 'provisional'} acceptance, with the following results:` },
      { type: 'numberedClauses', style: 'numeric', items: pontos },
      ...(defeitosTable ? [defeitosTable] : []),
      { type: 'numberedClauses', style: 'numeric', items: pontos2, start: pontos.length + 1 },
      fechoAuto(cols.length),
      ...signatureRows(cols),
    ];
    return blocks;
  },
});
