import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, splitLines } from './_shared';
import { autorFields, autorSignature, autorWarnings, endDot, envioBlock, envioField, lowerFirst, opt, optLabel, reciboBlock, reciboField, senderBlock, str } from './_cidadao';

const ASSUNTOS = [
  opt('ruido', 'Barulho (música, festas, máquinas)', 'Noise (music, parties, machines)'),
  opt('obras', 'Obras (horários, entulho, danos)', 'Building works (hours, rubble, damage)'),
  opt('infiltracao', 'Infiltrações, humidade ou escoamento de águas', 'Leaks, damp or water run-off'),
  opt('arvore', 'Árvore, ramos ou raízes', 'Tree, branches or roots'),
  opt('animais', 'Animais (cão a ladrar, solto, sujidade)', 'Animals (barking, loose, mess)'),
  opt('saneamento', 'Lixo, fossa ou esgoto', 'Rubbish, septic tank or sewage'),
  opt('acesso', 'Estacionamento ou acesso bloqueado', 'Parking or blocked access'),
  opt('fumo', 'Fumo, cheiros ou queimadas', 'Smoke, smells or burning'),
  opt('outro', 'Outro assunto', 'Other'),
];
const TEMA: Record<string, string> = {
  ruido: 'o barulho proveniente da sua residência',
  obras: 'as obras em curso na sua propriedade',
  infiltracao: 'as infiltrações e o escoamento de águas que vêm da sua propriedade',
  arvore: 'a árvore existente na sua propriedade, junto à estrema',
  animais: 'os animais que tem a seu cargo',
  saneamento: 'a deposição de lixo e o estado da fossa e do esgoto',
  acesso: 'o estacionamento que impede o acesso à minha residência',
  fumo: 'o fumo e os cheiros provenientes da sua propriedade',
  outro: 'uma situação de vizinhança',
};

const formal = (v: Values) => v.tom === 'formal';

export default defineTemplate({
  id: 'carta-ao-vizinho',
  sections: [
    { id: 'autor', title: l('Quem escreve', 'Who is writing'), personRole: 'outro' },
    { id: 'vizinho', title: l('Vizinho', 'Neighbour') },
    { id: 'assunto', title: l('Assunto', 'Subject') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'morada', 'telefone', 'email'], { required: ['nome'] }),
    { name: 'vizinhoNome', type: 'text', section: 'vizinho', label: l('Nome do vizinho (se souber)', 'Neighbour’s name (if known)') },
    { name: 'vizinhoGenero', type: 'radio', section: 'vizinho', width: 'half', label: l('Tratamento', 'Form of address'), options: [opt('M', 'Senhor', 'Mr'), opt('F', 'Senhora', 'Ms')], default: 'M' },
    { name: 'vizinhoMorada', type: 'text', section: 'vizinho', label: l('Morada do vizinho', 'Neighbour’s address'), placeholder: l('Ex.: Rua da Resistência, n.º 514 (casa ao lado)', 'E.g. the house next door') },
    { name: 'assunto', type: 'select', section: 'assunto', label: l('Assunto', 'Subject'), options: ASSUNTOS, default: 'ruido' },
    { name: 'assuntoOutro', type: 'text', section: 'assunto', label: l('Qual', 'Which'), showIf: (v) => v.assunto === 'outro' },
    {
      name: 'tom',
      type: 'radio',
      section: 'assunto',
      label: l('Tom da carta', 'Tone'),
      options: [opt('amigavel', 'Cordial (primeiro contacto)', 'Friendly (first contact)'), opt('formal', 'Formal (já falámos e nada mudou)', 'Formal (we spoke and nothing changed)')],
      default: 'amigavel',
    },
    { name: 'factos', type: 'textarea', section: 'assunto', required: true, rows: 5, label: l('O que se passa', 'What is happening'), help: l('Concreto e sem insultos: datas, horas, danos. Um facto por linha.', 'Specific and polite: dates, times, damage. One per line.') },
    { name: 'pedido', type: 'textarea', section: 'assunto', required: true, rows: 3, label: l('O que pede ao vizinho', 'What you ask the neighbour'), help: l('Ex.: «baixar o volume da música depois das 22h00», «reparar a canalização que verte para o meu quintal». Um por linha.', 'E.g. turn the music down after 10 p.m. One per line.') },
    { name: 'prazo', type: 'number', section: 'assunto', width: 'half', min: 1, max: 90, label: l('Prazo (dias)', 'Deadline (days)'), showIf: formal, default: 15 },
    { name: 'copia', type: 'text', section: 'assunto', label: l('Com cópia para (opcional)', 'Copy to (optional)'), placeholder: l('Ex.: Secretário do Bairro; Administração do Condomínio', 'E.g. the neighbourhood secretary; the building manager'), showIf: formal },
    localField('documento'),
    dateField('data'),
    envioField('documento'),
    reciboField('documento', false),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx);
    if (!splitLines(v.factos).length) w.push({ level: 'warning', field: 'factos', message: l('Descreva a situação.', 'Describe the situation.') });
    if (!splitLines(v.pedido).length) w.push({ level: 'warning', field: 'pedido', message: l('Diga o que pede ao vizinho.', 'Say what you ask for.') });
    w.push({
      level: 'info',
      field: 'tom',
      message: l(
        `O proprietário pode opor-se a ruídos, fumos, cheiros e factos semelhantes que prejudiquem substancialmente o uso do seu imóvel (${cite('cidVizinhanca')}). Se a carta não resolver, procure a mediação do bairro ou do condomínio («Acta de conciliação»), o município ou o tribunal comunitário; ruído nocturno pode ser comunicado à polícia.`,
        'An owner may object to substantial noise, smoke or smells from a neighbour. If this fails, try neighbourhood mediation, the municipality or the community court.',
      ),
    });
    return w;
  },

  personName: (v) => v.vizinhoNome || 'vizinho',
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.vizinhoGenero === 'F';
    const factos = splitLines(v.factos);
    const pedidos = splitLines(v.pedido);
    const tema = v.assunto === 'outro' ? lowerFirst(str(v.assuntoOutro)) || TEMA.outro : TEMA[String(v.assunto)] ?? TEMA.outro;
    const prazo = Number(v.prazo) > 0 ? Math.round(Number(v.prazo)) : 15;
    const nome = str(v.vizinhoNome);
    const saud = formal(v) ? (f ? 'Exma. Senhora,' : 'Exmo. Senhor,') : nome ? `${f ? 'Cara' : 'Caro'} ${nome.split(/\s+/)[0]},` : `${f ? 'Cara vizinha' : 'Caro vizinho'},`;

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', salutation: formal(v) ? (f ? 'Exma. Senhora' : 'Exmo. Senhor') : undefined, lines: [nome || (f ? 'A vizinha' : 'O vizinho'), str(v.vizinhoMorada)].filter(Boolean) },
      { type: 'subject', text: `${formal(v) ? 'Interpelação' : 'Pedido de vizinho'} — ${v.assunto === 'outro' ? str(v.assuntoOutro) || 'questão de vizinhança' : (optLabel(ASSUNTOS, v.assunto) || 'questão de vizinhança').replace(/\s*\(.*\)$/, '')}` },
      { type: 'salutation', text: saud },
      {
        type: 'paragraph',
        id: 'abertura',
        text: formal(v)
          ? `Como ${v.autorGenero === 'F' ? 'vizinha' : 'vizinho'} de V. Ex.ª, residente em ${str(v.autorMorada) || BLANK}, dirijo-me por escrito sobre ${tema}, depois de ter tentado resolver a questão em conversa, sem resultado.`
          : `Escrevo-lhe, como ${v.autorGenero === 'F' ? 'vizinha' : 'vizinho'}, sobre ${tema}, na expectativa de que possamos resolver a questão de forma amigável.`,
        en: formal(v) ? 'As your neighbour, I write about the matter stated, having tried to solve it by talking, without result.' : 'I write as your neighbour about the matter stated, hoping we can solve it amicably.',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: factos.length ? factos.map(endDot) : [BLANK, BLANK] },
      {
        type: 'paragraph',
        id: 'pedido',
        text: formal(v)
          ? `Estes factos prejudicam seriamente o uso da minha residência e o descanso da minha família. Assim, solicito a V. Ex.ª que, no prazo de ${prazo} ${prazo === 1 ? 'dia' : 'dias'} a contar da recepção desta carta, ${pedidos.length === 1 ? endDot(lowerFirst(pedidos[0])) : 'adopte as seguintes medidas:'}`
          : `Por isso, peço-lhe${pedidos.length === 1 ? ` que ${endDot(lowerFirst(pedidos[0]))}` : ':'}`,
        en: formal(v) ? `I ask you to take the measures stated within ${prazo} day(s).` : 'I therefore ask you to do the following.',
        keepWithNext: pedidos.length !== 1,
      },
    ];
    if (pedidos.length !== 1) blocks.push({ type: 'list', style: 'alpha', items: pedidos.length ? pedidos.map((p) => endDot(p.charAt(0).toUpperCase() + p.slice(1))) : [BLANK] });
    blocks.push({
      type: 'paragraph',
      id: 'consequencia',
      text: formal(v)
        ? 'Não sendo a situação resolvida nesse prazo, recorrerei às estruturas do bairro, às autoridades municipais e aos meios judiciais ao meu dispor, incluindo para a reparação dos danos sofridos.'
        : `${v.autorGenero === 'F' ? 'Estou certa' : 'Estou certo'} de que compreenderá. Se preferir, podemos conversar pessoalmente${str(v.autorTelefone) ? `; o meu contacto é ${str(v.autorTelefone)}` : ''}.`,
      en: formal(v) ? 'If not solved within that period, I will turn to the neighbourhood structures, the municipality and the courts.' : 'I am sure you will understand; we can also talk in person.',
    });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: formal(v) ? 'Com os melhores cumprimentos,' : 'Com os meus cumprimentos,', align: 'left', keepWithNext: true, en: 'Kind regards,' },
      { type: 'signatures', columns: [{ ...autorSignature(ctx, 'O Vizinho', 'A Vizinha'), detail: undefined }] },
    );
    if (formal(v) && str(v.copia)) blocks.push({ type: 'paragraph', id: 'copia', text: `C/c: ${str(v.copia)}`, size: 'small', align: 'left', en: 'Copy to the persons stated.' });
    blocks.push(...reciboBlock(v));
    return blocks;
  },
});
