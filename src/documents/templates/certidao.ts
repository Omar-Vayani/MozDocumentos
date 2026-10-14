// Certidão: a certificate issued by a public body from its own records
// (personal files, registers, minutes, case files), at a person's request —
// narrative (what the records show) or verbatim (full reproduction).

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, entityName, formatMoney, l, localField, money } from './_shared';
import { estadoRef, numeroField, paragraphs, sg, signatarioColumn, signatarioFields } from './_estado';
import { daEntidade, entidadeProfileWarning, semPonto, str } from './_contratacao';

export default defineTemplate({
  id: 'certidao',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Número, local e data', 'Number, place and date') },
    { id: 'pedido', title: l('Requerimento', 'Request') },
    { id: 'teor', title: l('O que se certifica', 'What is certified') },
    { id: 'assinatura', title: l('Assinatura e emolumentos', 'Signature and fees') },
  ],
  fields: [
    numeroField(),
    localField(),
    dateField('data'),
    { name: 'requerente', type: 'text', section: 'pedido', required: true, label: l('Requerente', 'Applicant'), placeholder: l('Ex.: Joana Alberto Muianga', 'E.g. Joana Alberto Muianga') },
    { name: 'requerimentoData', type: 'date', section: 'pedido', width: 'half', label: l('Data do requerimento', 'Date of the request') },
    { name: 'requerimentoNumero', type: 'text', section: 'pedido', width: 'half', label: l('Entrada n.º (opcional)', 'Entry no. (optional)') },
    {
      name: 'modo',
      type: 'radio',
      section: 'teor',
      label: l('Tipo de certidão', 'Type of certificate'),
      options: [
        { value: 'narrativa', label: l('Narrativa (resume o que consta)', 'Narrative (summarises the records)') },
        { value: 'teor', label: l('De teor (reproduz o documento na íntegra)', 'Verbatim (full reproduction)') },
      ],
      default: 'narrativa',
    },
    {
      name: 'fonte',
      type: 'text',
      section: 'teor',
      required: true,
      label: l('Registos consultados', 'Records consulted'),
      placeholder: l('Ex.: processo individual n.º 2318, Departamento de Recursos Humanos', 'E.g. personal file no. 2318, HR'),
      help: l('Narrativa: identifique o processo, livro ou registo. De teor: identifique o documento reproduzido, com artigo (ex.: a acta n.º 12 do Conselho Consultivo, de 3 de Março de 2026).', 'Narrative: identify the file or register. Verbatim: identify the document reproduced.'),
    },
    {
      name: 'teor',
      type: 'textarea',
      section: 'teor',
      rows: 6,
      required: true,
      label: l('Teor', 'Content'),
      help: l('Narrativa: escreva o que consta, a começar por «que». Ex.: que Joana Alberto Muianga foi nomeada Técnica de Saúde N3 por despacho de 4 de Março de 2015 e se encontra em exercício efectivo de funções. De teor: copie o documento.', 'Narrative: write what the records show, starting with “que”. Verbatim: copy the document.'),
    },
    { name: 'finalidade', type: 'text', section: 'teor', label: l('Para que fim (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: instruir processo de aposentação', 'E.g. retirement file') },
    ...signatarioFields(),
    { name: 'emolumentos', type: 'money', section: 'assinatura', width: 'half', label: l('Emolumentos cobrados (opcional)', 'Fees charged (optional)') },
    { name: 'guia', type: 'text', section: 'assinatura', width: 'half', label: l('Guia / recibo n.º (opcional)', 'Receipt no. (optional)') },
    { name: 'conferido', type: 'text', section: 'assinatura', width: 'half', label: l('Conferido por (opcional)', 'Checked by (optional)') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...entidadeProfileWarning(ctx)];
    if (!paragraphs(v.teor).length) w.push({ level: 'warning', field: 'teor', message: l('Escreva o que se certifica.', 'Write what is certified.') });
    w.push({ level: 'info', message: l(`A certidão reproduz fielmente o que consta dos arquivos; autentique-a com o selo branco ou o carimbo do serviço (${cite('ctCertidao')}). Os emolumentos, quando devidos, são os da tabela em vigor.`, 'The certificate faithfully reproduces the records; authenticate it with the seal or stamp. Fees, when due, follow the official table.') });
    return w;
  },

  personName: (v) => v.requerente,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const cargo = str(v.signatarioCargo);
    const quem = cargo ? `${sg(v, 'O', 'A')} ${cargo.replace(/^(o|a)\s+/i, '')}` : `${BLANK}`;
    const ent = entityName(ctx);
    const teor = paragraphs(v.teor);
    const req = `${str(v.requerente) || BLANK}${v.requerimentoData ? `, apresentado em ${dateLong(v.requerimentoData)}` : ''}${str(v.requerimentoNumero) ? ` e registado sob o n.º ${semPonto(v.requerimentoNumero)}` : ''}`;
    const blocks: Block[] = [
      { type: 'reference', ref: estadoRef(ctx, 'Certidão') },
      { type: 'title', text: 'Certidão' },
    ];
    if (v.modo === 'teor') {
      blocks.push({ type: 'paragraph', id: 'abertura', text: `${quem} ${daEntidade(ent)} **CERTIFICA**, a requerimento de ${req}, que a presente certidão reproduz na íntegra ${semPonto(v.fonte) || BLANK}, cujo teor é o seguinte:`, en: 'Certifies, on request, that the following reproduces the document verbatim:' });
      blocks.push({ type: 'paragraph', id: 'inicio', text: '«', align: 'left', en: 'Start of the reproduction.' });
      (teor.length ? teor : [`${BLANK}${BLANK}`]).forEach((p, i) => blocks.push({ type: 'paragraph', id: `teor-${i + 1}`, text: p, en: 'Verbatim text.' }));
      blocks.push({ type: 'paragraph', id: 'fim', text: '»\nNada mais consta do referido documento.', align: 'left', en: 'End of the reproduction.' });
    } else {
      const items = teor.map((p) => p.replace(/^que\s+/i, '').replace(/[.;]+$/, ''));
      blocks.push({
        type: 'paragraph',
        id: 'abertura',
        text: `${quem} ${daEntidade(ent)} **CERTIFICA**, a requerimento de ${req}, que, revistos os arquivos deste serviço (${semPonto(v.fonte) || BLANK}), deles consta${items.length === 1 ? ` que ${items[0]}.` : ':'}`,
        en: 'Certifies, on request, that the records show:',
      });
      if (items.length > 1) blocks.push({ type: 'list', style: 'alpha', items: items.map((t, i) => `que ${t}${i === items.length - 1 ? '.' : ';'}`) });
      if (!items.length) blocks.push({ type: 'paragraph', id: 'teor-vazio', text: `${BLANK}${BLANK}${BLANK}`, en: 'Content.' });
    }
    blocks.push({
      type: 'paragraph',
      id: 'fecho',
      text: `Por ser verdade${str(v.finalidade) ? ` e para efeitos de ${semPonto(v.finalidade).replace(/^(para|efeitos de)\s+/i, '')}` : ''}, se passa a presente certidão, que vai assinada e autenticada com o selo branco em uso neste serviço.`,
      keepWithNext: true,
      en: 'Issued as true, signed and sealed.',
    });
    blocks.push({ type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [signatarioColumn(v)] });
    const em = money(v.emolumentos);
    const rodape = [em != null ? `Emolumentos: ${formatMoney(em)}${str(v.guia) ? ` (guia n.º ${semPonto(v.guia)})` : ''}` : '', str(v.conferido) ? `Conferido por: ${str(v.conferido)}` : ''].filter(Boolean);
    if (rodape.length) blocks.push({ type: 'note', text: rodape.join(' · '), en: 'Fees and checking officer.' });
    return blocks;
  },
});
