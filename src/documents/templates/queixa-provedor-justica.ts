// Queixa ao Provedor de Justiça: a citizen, foreigner or organisation
// complains to the Ombudsman about an act, omission or delay of a public body
// or official. Free, no lawyer needed; court decisions are excluded.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, l, localField } from './_shared';
import { artigos, documentosList, papel } from './_advocacia';
import { applicantDesc, applicantFields, str, keepTail } from './_processo-penal';

const MOTIVO_OPTIONS = [
  { value: 'acto', label: l('Uma decisão ilegal ou injusta', 'An unlawful or unfair decision') },
  { value: 'omissao', label: l('Falta de resposta ou demora excessiva', 'No answer or excessive delay') },
  { value: 'conduta', label: l('Conduta de um funcionário ou agente (abuso, mau atendimento)', 'Conduct of an official (abuse, poor service)') },
  { value: 'outro', label: l('Outra violação de direitos', 'Other violation of rights') },
];

const MOTIVO_TXT: Record<string, string> = {
  acto: 'por acto que considera ilegal e lesivo dos seus direitos',
  omissao: 'por omissão e demora injustificada na resposta a pedido apresentado',
  conduta: 'pela conduta de funcionário ou agente ao seu serviço',
  outro: 'por violação dos seus direitos e interesses legítimos',
};

export default defineTemplate({
  id: 'queixa-provedor-justica',
  family: 'carta',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'queixoso', title: l('Quem se queixa', 'Complainant'), personRole: 'cliente' },
    { id: 'entidade', title: l('Contra que entidade', 'Against which body') },
    { id: 'factos', title: l('Factos e pedido', 'Facts and request') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...applicantFields('queixoso', 'queixoso'),
    { name: 'entidade', type: 'text', section: 'entidade', required: true, label: l('Entidade ou serviço visado', 'Body or service concerned'), placeholder: l('Ex.: Direcção Provincial de Educação de Inhambane', 'E.g. Provincial Education Directorate') },
    { name: 'funcionario', type: 'text', section: 'entidade', label: l('Funcionário ou agente (opcional)', 'Official (optional)'), placeholder: l('Ex.: o chefe da secretaria, Sr. …', 'E.g. head of the registry') },
    { name: 'motivo', type: 'select', section: 'entidade', label: l('Motivo', 'Reason'), options: MOTIVO_OPTIONS, default: 'omissao' },
    { name: 'factos', type: 'textarea', section: 'factos', rows: 8, required: true, label: l('O que aconteceu (um ponto por linha)', 'What happened (one point per line)'), help: l('Datas, pedidos feitos, respostas recebidas, nomes dos serviços. Seja claro e concreto.', 'Dates, requests, answers, services. Be clear and specific.') },
    { name: 'diligencias', type: 'textarea', section: 'factos', rows: 3, label: l('O que já fez para resolver (opcional)', 'What you already did (optional)'), placeholder: l('Reclamação de 3 de Junho de 2026, sem resposta\nRecurso hierárquico de 10 de Julho de 2026, sem resposta', 'Complaint of 3 June, no answer') },
    { name: 'pedido', type: 'text', section: 'factos', label: l('O que pretende', 'What you want'), placeholder: l('Ex.: que seja decidido o meu processo de pensão de sobrevivência', 'E.g. that my pension file be decided') },
    { name: 'semTribunal', type: 'toggle', section: 'factos', default: true, label: l('Declarar que o assunto não está em tribunal', 'State the matter is not before a court') },
    { name: 'documentos', type: 'textarea', section: 'factos', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)') },
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: () => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A queixa ao Provedor de Justiça é gratuita, não precisa de advogado e pode ser entregue por carta ou pessoalmente; deve ser clara, fundamentada e identificar a entidade visada. O Provedor não aprecia decisões dos tribunais (${cite('ppProvedorJustica')}).`,
          'A complaint to the Ombudsman is free, needs no lawyer and may be sent by letter or in person; it must be clear, reasoned and name the body. Court decisions are excluded.',
        ),
      },
      { level: 'info', message: l('A queixa não suspende os prazos para reclamar, recorrer ou ir a tribunal: se tiver um prazo a correr, use também esses meios.', 'A complaint does not stop time limits for appeals or court action.') },
    ];
    return w;
  },

  personName: (v) => v.queixosoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const OQ = papel(v, 'queixoso', 'O queixoso', 'A queixosa');
    const entidade = str(v.entidade) || '____________________';
    const func = str(v.funcionario).replace(/[.;]$/, '');
    const factos = artigos(v.factos);
    const diligencias = artigos(v.diligencias);
    const docs = documentosList(v.documentos);
    const pedido = str(v.pedido).replace(/[.;]$/, '');
    const blocks: Block[] = [
      { type: 'reference', place: ctx.place, date: v.data },
      { type: 'recipient', salutation: 'A Sua Excelência', lines: ['O Provedor de Justiça', 'Maputo'] },
      { type: 'subject', text: `Queixa contra ${entidade}` },
      { type: 'salutation', text: 'Excelência,' },
      {
        type: 'paragraph',
        id: 'queixoso',
        text: `${applicantDesc(v, 'queixoso', { docBlank: true })}, vem apresentar a V. Ex.ª queixa contra **${entidade}**${func ? `, e em particular contra ${func}` : ''}, ${MOTIVO_TXT[v.motivo] ?? MOTIVO_TXT.outro}, nos termos seguintes.`,
        en: 'The complainant files a complaint against the public body for the reasons below.',
      },
      { type: 'heading', text: 'Factos' },
      { type: 'list', style: 'numeric', items: factos.length ? factos : ['____________________'] },
    ];
    if (diligencias.length) {
      blocks.push({ type: 'heading', text: 'Diligências já efectuadas' }, { type: 'list', style: 'bullet', items: diligencias });
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedido',
      text: `Nestes termos, ${OQ.toLowerCase()} solicita a V. Ex.ª que se digne apreciar a presente queixa e dirigir à entidade visada as recomendações que entenda adequadas${pedido ? `, de modo a que ${pedido}` : ' à reparação da ilegalidade ou injustiça descrita'} (${cite('ppProvedorJustica')}).`,
      en: 'The complainant asks the Ombudsman to examine the complaint and make recommendations.',
    });
    if (v.semTribunal) {
      blocks.push({ type: 'paragraph', id: 'tribunal', text: `${OQ} declara que o assunto não se encontra pendente de decisão judicial.`, en: 'The matter is not pending before a court.' });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
      { type: 'signatures', columns: [{ role: papel(v, 'queixoso', 'O Queixoso', 'A Queixosa'), name: str(v.queixosoNome) || undefined }] },
    );
    if (docs.length) blocks.push({ type: 'annexList', title: 'Anexos', items: docs });
    return keepTail(blocks, 'pedido');
  },
});
