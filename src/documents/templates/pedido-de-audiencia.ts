import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, splitLines } from './_shared';
import {
  TRATAMENTO_OPTIONS,
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  autorWarnings,
  cleanEntidade,
  endDot,
  envioBlock,
  envioField,
  eu,
  isEmpresa,
  lowerFirst,
  reciboBlock,
  reciboField,
  saudacao,
  senderBlock,
  str,
} from './_cidadao';

export default defineTemplate({
  id: 'pedido-de-audiencia',
  official: 'estado',
  sections: [
    { id: 'destinatario', title: l('A quem pede a audiência', 'Who you ask to meet') },
    { id: 'autor', title: l('Quem pede', 'Who is asking'), personRole: 'outro' },
    { id: 'assunto', title: l('Assunto', 'Subject') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Forma de tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS.slice(0, 6), default: 'Exmo. Senhor' },
    {
      name: 'entidade',
      type: 'text',
      section: 'destinatario',
      required: true,
      label: l('Cargo e instituição', 'Position and institution'),
      placeholder: l('Ex.: Administrador do Distrito de Marracuene', 'E.g. District Administrator of Marracuene'),
      help: l('Ex.: «Administrador do Distrito de Boane», «Chefe do Posto Administrativo de Machava», «Presidente do Conselho Municipal da Cidade da Beira», «Director Provincial de Saúde de Nampula», «Ministro da Educação e Cultura».', 'E.g. District Administrator, Head of Administrative Post, Mayor, Provincial Director, Minister.'),
    },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Endereço (opcional)', 'Address (optional)') },
    { name: 'destinatarioLocal', type: 'text', section: 'destinatario', width: 'half', label: l('Cidade ou vila', 'City or town'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    {
      name: 'qualidade',
      type: 'text',
      section: 'autor',
      label: l('Na qualidade de (opcional)', 'In the capacity of (optional)'),
      placeholder: l('Ex.: Presidente da Associação de Moradores do Bairro Ferroviário', 'E.g. Chair of the residents’ association'),
      showIf: (v) => v.autorTipo !== 'empresa',
    },
    {
      name: 'assunto',
      type: 'text',
      section: 'assunto',
      required: true,
      label: l('Assunto a tratar', 'Matter to discuss'),
      placeholder: l('Ex.: a falta de abastecimento de água no Bairro de Khongolote', 'E.g. lack of water supply in the neighbourhood'),
      help: l('Continua a frase «…a fim de expor pessoalmente…». Seja breve e concreto.', 'Continues “…to explain in person…”. Be brief and specific.'),
    },
    {
      name: 'exposicao',
      type: 'textarea',
      section: 'assunto',
      rows: 4,
      label: l('Antecedentes (opcional)', 'Background (optional)'),
      help: l('O essencial que o dirigente deve saber antes da audiência: factos, datas, pedidos já feitos e números de processo. Um ponto por linha.', 'What the official should know beforehand: facts, dates, earlier requests. One point per line.'),
    },
    { name: 'acompanhantes', type: 'text', section: 'assunto', label: l('Quem o acompanha (opcional)', 'Who will come with you (optional)'), placeholder: l('Ex.: dois membros da direcção da associação', 'E.g. two board members') },
    { name: 'disponibilidade', type: 'text', section: 'assunto', label: l('Disponibilidade (opcional)', 'Availability (optional)'), placeholder: l('Ex.: qualquer dia útil da semana de 26 de Outubro, de manhã', 'E.g. any weekday morning in the week of 26 October') },
    anexosField('assunto', l('Ex.: Cópia do requerimento de 3 de Agosto de 2026', 'E.g. Copy of an earlier request')),
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    if (!str(v.entidade)) w.push({ level: 'warning', field: 'entidade', message: l('Indique o cargo de quem pretende ver.', 'State the position of the official.') });
    if (!str(v.assunto)) w.push({ level: 'warning', field: 'assunto', message: l('Indique o assunto da audiência.', 'State the subject of the meeting.') });
    w.push({ level: 'info', field: 'disponibilidade', message: l(`Os dirigentes reservam períodos para atendimento do público (${cite('cidAudiencia')}). Entregue o pedido no secretariado e anote o número de entrada.`, 'Officials set aside time to receive the public. Deliver the request to the office and note the entry number.') });
    return w;
  },

  personName: (v) => (v.autorTipo === 'empresa' ? undefined : v.autorNome),
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresa(ctx);
    const tratamento = str(v.tratamento) || 'Exmo. Senhor';
    const entidade = cleanEntidade(str(v.entidade), tratamento) || BLANK;
    const exposicao = splitLines(v.exposicao);
    const assunto = str(v.assunto) ? lowerFirst(str(v.assunto).replace(/\.$/, '')) : BLANK;
    const tel = str(v.autorTelefone);
    const email = str(v.autorEmail);

    const quem = empresa
      ? `A **${profileDisplayName(ctx.profile) || BLANK}**${ctx.profile?.representanteNome ? `, representada por ${ctx.profile.representanteNome}${ctx.profile.representanteCargo ? `, ${ctx.profile.representanteCargo}` : ''},` : ''} solicita a V. Ex.ª se digne conceder-lhe uma audiência`
      : `${str(v.autorNome) ? `Eu, **${str(v.autorNome)}**, ` : ''}${str(v.qualidade) ? `na qualidade de ${lowerFirst(str(v.qualidade))}, ` : ''}solicito a V. Ex.ª se digne conceder-me uma audiência`;

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      {
        type: 'recipient',
        salutation: tratamento,
        lines: [entidade, str(v.destinatarioMorada), str(v.destinatarioLocal).toUpperCase()].filter(Boolean),
      },
      { type: 'subject', text: 'Pedido de audiência' },
      { type: 'salutation', text: saudacao(tratamento, entidade) },
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${quem}, a fim de expor pessoalmente ${assunto}.`,
        en: 'I respectfully ask Your Excellency for an audience to explain the matter in person.',
      },
    ];
    if (exposicao.length === 1) {
      blocks.push({ type: 'paragraph', id: 'exposicao', text: endDot(exposicao[0]), en: 'Background of the matter.' });
    } else if (exposicao.length > 1) {
      blocks.push(
        { type: 'paragraph', id: 'exposicao', text: `Para melhor enquadramento, ${eu(ctx, 'informo', 'informamos')} o seguinte:`, en: 'For context:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: exposicao.map(endDot) },
      );
    }
    if (str(v.acompanhantes)) {
      blocks.push({
        type: 'paragraph',
        id: 'acompanhantes',
        text: empresa
          ? `A delegação incluirá ${lowerFirst(str(v.acompanhantes).replace(/\.$/, ''))}.`
          : `Far-me-ei acompanhar de ${lowerFirst(str(v.acompanhantes).replace(/\.$/, ''))}.`,
        en: 'I will be accompanied by the persons stated.',
      });
    }
    const contactos = [tel ? `pelo telefone ${tel}` : '', email ? `pelo email ${email}` : ''].filter(Boolean).join(' ou ');
    blocks.push({
      type: 'paragraph',
      id: 'marcacao',
      text: `${eu(ctx, 'Fico', 'Ficamos')} ao dispor de V. Ex.ª para a data e hora que entender${str(v.disponibilidade) ? `, com preferência por ${lowerFirst(str(v.disponibilidade).replace(/\.$/, ''))}` : ''}.${contactos ? ` Para a marcação, o secretariado pode contactar-${eu(ctx, 'me', 'nos')} ${contactos}.` : ''}`,
      en: 'I am available on the date and time you choose; contact details for scheduling are given.',
    });
    blocks.push(...anexosBlock(v));
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Requerente', 'A Requerente')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
