import type { LegalRefId } from '@/legal/mz-legal';
import { diffDays, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, g, isF, l, lineItems, localField, refField,
  placeDate, workerFields,
} from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

/** Long date, or the typed text when it is not an ISO date. */
const dataOuTexto = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return '';
  return parseISODate(s) ? dateLong(s) : s;
};

export default defineTemplate({
  id: 'certificado-de-trabalho',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'servico', title: l('Tempo de serviço e cargos', 'Service and positions') },
    { id: 'outras', title: l('Outras informações', 'Other information') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'docTipo', 'docNumero']),
    {
      ...workerFields(['dataAdmissao'])[0],
      required: true,
      label: l('Data de admissão', 'Start date'),
      legal: l('O certificado indica o tempo de serviço.', 'The certificate states the length of service.'),
    },
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'servico',
      width: 'half',
      required: true,
      label: l('Data de cessação do contrato', 'End date'),
    },
    {
      name: 'nivelQualificacao',
      type: 'text',
      section: 'trabalhador',
      required: true,
      label: l('Nível de capacidade profissional adquirido', 'Professional level reached'),
      legal: l('A lei exige a indicação do nível de capacidade profissional adquirido.', 'The law requires the professional level reached.'),
      help: l('Normalmente a categoria profissional ou o nível de qualificação no fim do contrato.', 'Usually the job grade or qualification level at the end of the contract.'),
      placeholder: l('Ex.: Técnico médio de contabilidade, nível 3', 'E.g. Mid-level accounting technician, level 3'),
      personKey: 'categoria',
    },
    {
      name: 'cargos',
      type: 'lines',
      section: 'servico',
      label: l('Cargos exercidos', 'Positions held'),
      legal: l('A lei exige a indicação dos cargos exercidos.', 'The law requires the positions held.'),
      addLabel: l('Adicionar cargo', 'Add position'),
      columns: [
        { name: 'cargo', type: 'text', label: l('Cargo / função', 'Position') },
        { name: 'de', type: 'date', label: l('De', 'From') },
        { name: 'ate', type: 'date', label: l('Até', 'To') },
      ],
      default: [],
    },
    {
      name: 'pedidoEscrito',
      type: 'toggle',
      section: 'outras',
      label: l('O trabalhador pediu por escrito outras informações', 'The employee asked in writing for other information'),
      help: l(
        'Sem pedido escrito do trabalhador, o certificado só pode conter o tempo de serviço, o nível de qualificação e os cargos (nada sobre motivo de saída ou avaliação).',
        'Without the employee’s written request, the certificate may only state service, qualification level and positions (nothing about the reason for leaving or performance).',
      ),
    },
    {
      name: 'outrasInformacoes',
      type: 'textarea',
      section: 'outras',
      rows: 4,
      label: l('Informações pedidas pelo trabalhador', 'Information requested by the employee'),
      placeholder: l(
        'Ex.: Cessou funções por iniciativa própria. Demonstrou assiduidade e sentido de responsabilidade.',
        'E.g. Left of their own accord. Showed good attendance and responsibility.',
      ),
      showIf: (v) => Boolean(v.pedidoEscrito),
    },
  ],

  warnings: (v, { legal }) => {
    const w: Warning[] = [];
    if (v.trabalhadorDataAdmissao && v.dataFimContrato && diffDays(v.trabalhadorDataAdmissao, v.dataFimContrato) < 0) {
      w.push({ level: 'error', field: 'dataFimContrato', message: l('A data de cessação é anterior à admissão.', 'The end date is before the start date.') });
    }
    if (!String(v.nivelQualificacao ?? '').trim()) {
      w.push({ level: 'warning', field: 'nivelQualificacao', message: l('Indique o nível de capacidade profissional adquirido: a lei exige-o.', 'State the professional level reached: the law requires it.') });
    }
    if (!lineItems(v.cargos).some((r) => String(r.cargo ?? '').trim())) {
      w.push({ level: 'warning', field: 'cargos', message: l('Indique pelo menos um cargo exercido.', 'Add at least one position held.') });
    }
    const dias = legal.value<{ contestacaoDias: number }>('certificadoTrabalho').contestacaoDias;
    w.push({
      level: 'info',
      message: l(
        `O trabalhador pode contestar o conteúdo do certificado no prazo de ${dias} dias.`,
        `The employee may contest the content of the certificate within ${dias} days.`,
      ),
    });
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const f = isF(ge);
    const empresa = employerName(ctx);
    const isCompany = ctx.profile?.kind === 'empresa';
    const cargos = lineItems(v.cargos).filter((r) => String(r.cargo ?? '').trim());
    const outras = v.pedidoEscrito ? String(v.outrasInformacoes ?? '').trim() : '';
    const doc = v.trabalhadorDocNumero ? `, ${f ? 'portadora' : 'portador'} do ${v.trabalhadorDocTipo || 'BI'} n.º ${v.trabalhadorDocNumero}` : '';

    const blocks: Block[] = [
      { type: 'title', text: 'Certificado de trabalho' },
      ...(v.ref ? [{ type: 'reference', ref: v.ref } as Block] : []),
      {
        type: 'paragraph',
        id: 'certifica',
        text: `Certifica-se, para os devidos efeitos, que **${v.trabalhadorNome || BLANK}**${doc ? `${doc},` : ''} esteve ao serviço ${isCompany ? 'da' : 'de'} **${empresa}** no período de ${dateLong(v.trabalhadorDataAdmissao)} a ${dateLong(v.dataFimContrato)}, tendo adquirido o nível de capacidade profissional correspondente a **${v.nivelQualificacao || BLANK}**.`,
        en: `This is to certify that ${v.trabalhadorNome || '___'} worked for ${empresa} from ${v.trabalhadorDataAdmissao || '___'} to ${v.dataFimContrato || '___'}, reaching the professional level of ${v.nivelQualificacao || '___'}.`,
      },
      {
        type: 'paragraph',
        id: 'cargos',
        text: `Durante esse período, ${g(ge, 'o trabalhador', 'a trabalhadora')} desempenhou ${cargos.length === 1 ? 'o seguinte cargo' : 'os seguintes cargos'}:`,
        en: 'During that period the employee held the following position(s):',
      },
      {
        type: 'table',
        columns: [
          { label: 'Cargo / função', width: 3 },
          { label: 'De', width: 1.6 },
          { label: 'Até', width: 1.6 },
        ],
        rows: cargos.length
          ? cargos.map((r) => [String(r.cargo).trim(), dataOuTexto(r.de), dataOuTexto(r.ate)])
          : [[BLANK, '___/___/______', '___/___/______']],
      },
    ];
    if (outras) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'outrasIntro',
          text: `A pedido escrito ${g(ge, 'do trabalhador', 'da trabalhadora')}, certifica-se ainda o seguinte:`,
          en: 'At the employee’s written request, the following is also certified:',
        },
        { type: 'paragraph', id: 'outras', text: outras, en: 'Further information requested by the employee, as written above.' },
      );
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'baseLegal',
        text: `O presente certificado é emitido nos termos ${doCite('certificadoTrabalho')} (Lei do Trabalho).`,
        en: 'This certificate is issued under the Labour Law.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade, passa-se o presente certificado, que vai assinado${isCompany ? ' e autenticado com o carimbo em uso' : ''}.`,
        en: `In witness whereof, this certificate is issued and signed${isCompany ? ' and stamped' : ''}.`,
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [employerSignature(ctx)] },
    );
    return blocks;
  },
});
