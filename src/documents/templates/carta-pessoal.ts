import { defineTemplate, type Block, type Warning } from '../model';
import { GENERO_OPTIONS, dateField, dateLong, g, l, localField } from './_shared';
import { str } from './_eventos';

// Personal formal letter, A5: condolences, thanks, congratulations or an
// apology. Personal register: no reference number and no "Assunto" line;
// place and date at the top right, a handwritten signature at the end.

const TRATAMENTOS: Record<string, [string, string]> = {
  exmo: ['Exmo. Senhor', 'Exma. Senhora'],
  caro: ['Caro', 'Cara'],
  querido: ['Querido', 'Querida'],
};

export default defineTemplate({
  id: 'carta-pessoal',
  family: 'carta',
  page: 'A5',
  noBrand: true,
  letterhead: false,
  sections: [
    { id: 'tipo', title: l('Tipo de carta', 'Letter type') },
    { id: 'destinatario', title: l('Destinatário', 'Recipient') },
    { id: 'conteudo', title: l('Conteúdo', 'Content') },
    { id: 'documento', title: l('Assinatura, local e data', 'Signature, place and date') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'tipo',
      label: l('Tipo', 'Type'),
      options: [
        { value: 'condolencias', label: l('Condolências (pêsames)', 'Condolences') },
        { value: 'agradecimento', label: l('Agradecimento', 'Thanks') },
        { value: 'felicitacoes', label: l('Felicitações', 'Congratulations') },
        { value: 'desculpas', label: l('Pedido de desculpas', 'Apology') },
      ],
      default: 'condolencias',
    },
    {
      name: 'destinatarioTratamento',
      type: 'select',
      section: 'destinatario',
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: [
        { value: 'exmo', label: l('Exmo. Senhor / Exma. Senhora', 'Formal') },
        { value: 'caro', label: l('Caro / Cara', 'Dear') },
        { value: 'querido', label: l('Querido / Querida', 'Dearest') },
      ],
      default: 'exmo',
    },
    { name: 'destinatarioGenero', type: 'radio', section: 'destinatario', width: 'half', label: l('Género', 'Gender'), options: GENERO_OPTIONS, default: 'F' },
    { name: 'destinatarioNome', type: 'text', section: 'destinatario', required: true, label: l('Nome como o trata', 'Name as you address them'), placeholder: l('Dona Maria Sitoe / Dr. João Tembe', 'Name') },
    { name: 'falecidoNome', type: 'text', section: 'conteudo', width: 'half', label: l('Nome da pessoa falecida', 'Name of the deceased'), showIf: (v) => v.tipo === 'condolencias' },
    {
      name: 'parentesco',
      type: 'text',
      section: 'conteudo',
      width: 'half',
      label: l('Relação com o destinatário', 'Relationship to the recipient'),
      placeholder: l('seu esposo / sua mãe', 'your husband / your mother'),
      showIf: (v) => v.tipo === 'condolencias',
    },
    {
      name: 'motivo',
      type: 'text',
      section: 'conteudo',
      label: l('Motivo', 'Reason'),
      placeholder: l('a ajuda prestada durante a mudança / a nomeação para Director Provincial / o atraso na entrega', 'what you thank, congratulate or apologise for'),
      showIf: (v) => v.tipo !== 'condolencias',
    },
    {
      name: 'paragrafoPessoal',
      type: 'textarea',
      section: 'conteudo',
      rows: 4,
      label: l('Uma palavra pessoal', 'A personal paragraph'),
      help: l('Uma lembrança concreta, o efeito da ajuda, ou a medida tomada para corrigir o erro. É o que torna a carta sincera.', 'A concrete memory, the effect of the help, or what you did to fix the mistake.'),
    },
    {
      name: 'fecho',
      type: 'select',
      section: 'documento',
      width: 'half',
      label: l('Despedida', 'Closing'),
      options: [
        { value: 'Com os melhores cumprimentos,', label: l('Com os melhores cumprimentos,', 'Best regards,') },
        { value: 'Com amizade e respeito,', label: l('Com amizade e respeito,', 'With friendship and respect,') },
        { value: 'Com estima,', label: l('Com estima,', 'With esteem,') },
        { value: 'Um abraço amigo,', label: l('Um abraço amigo,', 'A warm hug,') },
      ],
      default: 'Com os melhores cumprimentos,',
    },
    { name: 'remetenteNome', type: 'text', section: 'documento', width: 'half', required: true, label: l('O seu nome', 'Your name'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? '') },
    localField('documento'),
    dateField('data', 'documento'),
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const [m, f] = TRATAMENTOS[str(v.destinatarioTratamento)] ?? TRATAMENTOS.exmo;
    const saud = `${g(v.destinatarioGenero, m, f)} ${str(v.destinatarioNome) || '____________________'},`;
    const motivo = str(v.motivo) || '____________________';
    const pessoal = str(v.paragrafoPessoal);
    const body: Block[] = [];
    switch (v.tipo) {
      case 'agradecimento':
        body.push({ type: 'paragraph', id: 'cp-abertura', text: `Escrevo para lhe agradecer ${motivo.replace(/[.]$/, '')}.`, en: 'I am writing to thank you.' });
        if (pessoal) body.push({ type: 'paragraph', id: 'cp-pessoal', text: pessoal, en: 'Personal paragraph.', editable: false });
        body.push({ type: 'paragraph', id: 'cp-remate', text: 'O seu gesto foi muito importante para mim e não será esquecido.', en: 'Your gesture meant a great deal to me and will not be forgotten.', keepWithNext: true });
        break;
      case 'felicitacoes':
        body.push({ type: 'paragraph', id: 'cp-abertura', text: `${g(v.destinatarioGenero, 'Felicito-o', 'Felicito-a')}, com muito gosto, por ${motivo.replace(/[.]$/, '')}.`, en: 'Congratulations.' });
        if (pessoal) body.push({ type: 'paragraph', id: 'cp-pessoal', text: pessoal, en: 'Personal paragraph.', editable: false });
        body.push({ type: 'paragraph', id: 'cp-remate', text: 'Desejo-lhe os maiores sucessos nesta nova etapa.', en: 'I wish you every success in this new stage.', keepWithNext: true });
        break;
      case 'desculpas':
        body.push({ type: 'paragraph', id: 'cp-abertura', text: `Apresento-lhe as minhas sinceras desculpas por ${motivo.replace(/[.]$/, '')}.`, en: 'Please accept my sincere apologies.' });
        if (pessoal) body.push({ type: 'paragraph', id: 'cp-pessoal', text: pessoal, en: 'Personal paragraph.', editable: false });
        body.push({ type: 'paragraph', id: 'cp-remate', text: 'Lamento o incómodo causado e estou disponível para o que for necessário para o corrigir.', en: 'I regret the inconvenience and am available to put it right.', keepWithNext: true });
        break;
      default: {
        const quem = str(v.falecidoNome)
          ? `${str(v.parentesco) ? `${str(v.parentesco)}, ` : ''}${str(v.falecidoNome)}`
          : str(v.parentesco) || 'seu ente querido';
        body.push({
          type: 'paragraph',
          id: 'cp-abertura',
          text: `Foi com profunda tristeza que recebi a notícia do falecimento ${/^(seu|sua|do|da)\b/.test(quem) ? 'do' : 'de'} ${quem}.`,
          en: 'I was deeply saddened to hear of the death.',
        });
        if (pessoal) body.push({ type: 'paragraph', id: 'cp-pessoal', text: pessoal, en: 'Personal paragraph.', editable: false });
        body.push({
          type: 'paragraph',
          id: 'cp-remate',
          text: 'Neste momento de dor, apresento-lhe, e a toda a família, as minhas mais sentidas condolências. Estou ao vosso dispor para o que for necessário.',
          en: 'In this time of grief I offer you and your family my deepest condolences. I am at your disposal for anything you need.',
          keepWithNext: true,
        });
      }
    }
    return [
      { type: 'reference', place: ctx.place, date: dateLong(v.data), align: 'right' },
      { type: 'salutation', text: saud },
      ...body,
      { type: 'paragraph', id: 'cp-fecho', text: str(v.fecho) || 'Com os melhores cumprimentos,', en: 'Closing.', keepWithNext: true, editable: false },
      { type: 'signatures', columns: [{ role: ' ', name: str(v.remetenteNome) || undefined }] },
    ];
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (v.tipo === 'condolencias' && !str(v.paragrafoPessoal))
      out.push({ level: 'info', field: 'paragrafoPessoal', message: l('Uma palavra pessoal sobre a pessoa falecida torna a carta mais sincera.', 'A personal word about the deceased makes the letter more sincere.') });
    if (v.tipo === 'desculpas')
      out.push({
        level: 'info',
        message: l('Um pedido de desculpas escrito pode ser usado como reconhecimento de um facto. Se houver um litígio, fale com um advogado antes de o enviar.', 'A written apology may be used as an admission. In a dispute, ask a lawyer first.'),
      });
    return out;
  },
  personName: (v) => str(v.destinatarioNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
