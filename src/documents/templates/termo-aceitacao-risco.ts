// Termo de responsabilidade e aceitação de riscos para actividades turísticas
// e de aventura (mergulho, passeios de barco, safaris a pé, quad, surf,
// equitação…). Informs the participant of the inherent risks and records the
// health declaration and the commitment to follow instructions. It cannot
// exclude the organiser's liability for its own fault (Civil Code).

import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, l, placeDate } from './_shared';
import { semPonto, str } from './_contratos';
import { issuer, linhas } from './_digital';

const ACTIVIDADES: Record<string, { nome: string; riscos: string[] }> = {
  mergulho: {
    nome: 'mergulho com garrafa',
    riscos: ['barotrauma e doença descompressiva', 'correntes, ondulação e visibilidade reduzida', 'contacto com fauna marinha', 'falha de equipamento'],
  },
  snorkel: {
    nome: 'snorkeling e natação com fauna marinha',
    riscos: ['correntes e ondulação', 'cansaço e afogamento', 'exposição solar e queimaduras', 'contacto com fauna marinha, corais e ouriços'],
  },
  barco: {
    nome: 'passeio de barco',
    riscos: ['enjoo, quedas a bordo e ao embarcar', 'mudanças súbitas do estado do mar', 'exposição solar'],
  },
  safari: {
    nome: 'safari ou caminhada em área de fauna bravia',
    riscos: ['encontros com animais selvagens', 'terreno irregular, quedas e torções', 'calor, desidratação e picadas de insectos'],
  },
  quad: {
    nome: 'condução de moto-quatro (quad) ou motociclo',
    riscos: ['capotamento e quedas', 'colisão com obstáculos, pessoas ou animais', 'ferimentos por excesso de velocidade'],
  },
  surf: {
    nome: 'surf, kitesurf, canoagem ou stand-up paddle',
    riscos: ['correntes e ondulação', 'quedas e choques com a prancha ou o fundo', 'afastamento da costa'],
  },
  equitacao: {
    nome: 'passeio a cavalo',
    riscos: ['quedas', 'reacções imprevisíveis do animal', 'coices e mordeduras'],
  },
  outra: { nome: '', riscos: [] },
};

const menor = (v: Values) => Boolean(v.menor);

export default defineTemplate({
  id: 'termo-aceitacao-risco',
  family: 'declaracao',
  sections: [
    { id: 'actividade', title: l('Actividade', 'Activity') },
    { id: 'participante', title: l('Participante (opcional)', 'Participant (optional)'), description: l('Deixe em branco para imprimir termos para preencher à mão.', 'Leave blank to print forms to fill in by hand.') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    { name: 'actividade', type: 'select', section: 'actividade', width: 'half', label: l('Actividade', 'Activity'), options: [{ value: 'mergulho', label: l('Mergulho', 'Scuba diving') }, { value: 'snorkel', label: l('Snorkeling / nadar com fauna', 'Snorkelling') }, { value: 'barco', label: l('Passeio de barco', 'Boat trip') }, { value: 'safari', label: l('Safari ou caminhada', 'Safari or bush walk') }, { value: 'quad', label: l('Moto-quatro (quad)', 'Quad biking') }, { value: 'surf', label: l('Surf, kite, canoagem', 'Surf, kite, canoeing') }, { value: 'equitacao', label: l('Passeio a cavalo', 'Horse riding') }, { value: 'outra', label: l('Outra', 'Other') }], default: 'snorkel' },
    { name: 'actividadeNome', type: 'text', section: 'actividade', width: 'half', label: l('Descrição da actividade', 'Activity description'), placeholder: l('Ex.: snorkeling com tubarões-baleia, em Tofo', 'E.g. whale shark snorkelling in Tofo') },
    { name: 'riscosExtra', type: 'textarea', section: 'actividade', rows: 3, label: l('Outros riscos a indicar (opcional)', 'Other risks (optional)') },
    { name: 'regras', type: 'textarea', section: 'actividade', rows: 3, label: l('Regras de segurança principais', 'Main safety rules'), default: 'usar sempre o colete ou o equipamento de segurança fornecido\nseguir as instruções do guia ou instrutor e não se afastar do grupo\nnão tocar nem perseguir os animais' },
    { name: 'dataActividade', type: 'date', section: 'actividade', width: 'half', label: l('Data', 'Date') },

    { name: 'participanteNome', type: 'text', section: 'participante', label: l('Nome', 'Name') },
    { name: 'participanteDoc', type: 'text', section: 'participante', width: 'half', label: l('Documento n.º', 'ID no.') },
    { name: 'participanteContacto', type: 'text', section: 'participante', width: 'half', label: l('Contacto de emergência', 'Emergency contact') },
    { name: 'menor', type: 'toggle', section: 'participante', default: false, label: l('O participante é menor (assina o pai, a mãe ou o tutor)', 'Participant is a minor (parent or guardian signs)') },
    { name: 'representanteNome', type: 'text', section: 'participante', label: l('Nome do representante legal', 'Legal guardian’s name'), showIf: menor },

    { name: 'imagem', type: 'toggle', section: 'opcoes', default: true, label: l('Incluir autorização de fotografias para divulgação', 'Include photo consent') },
    { name: 'local', type: 'text', section: 'opcoes', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
  ],

  warnings: () => {
    const w: Warning[] = [];
    w.push({ level: 'warning', message: l(`Este termo informa dos riscos, mas não isenta o organizador da responsabilidade por falta de segurança, equipamento defeituoso ou culpa dos seus guias (${cite('turRenunciaResponsabilidade')}). Mantenha seguro, equipamento verificado e guias qualificados.`, 'This form informs of risks but does not exempt the organiser from liability for unsafe conditions, faulty equipment or staff fault. Keep insurance, checked equipment and qualified guides.') });
    return w;
  },

  personName: (v) => str(v.participanteNome) || undefined,
  documentDate: (v) => v.dataActividade,

  blocks: (ctx) => {
    const v = ctx.values;
    const act = ACTIVIDADES[str(v.actividade)] ?? ACTIVIDADES.outra;
    const nomeAct = semPonto(v.actividadeNome) || act.nome || BLANK;
    const riscos = [...act.riscos, ...linhas(v.riscosExtra).map(semPonto)];
    const regras = linhas(v.regras).map(semPonto);
    const org = issuer(ctx);
    const m = menor(v);
    const quem = m
      ? `Eu, ${str(v.representanteNome) || BLANK}, na qualidade de representante legal do menor ${str(v.participanteNome) || BLANK}${str(v.participanteDoc) ? ` (documento n.º ${str(v.participanteDoc)})` : ''},`
      : `Eu, ${str(v.participanteNome) || BLANK}${str(v.participanteDoc) ? `, portador(a) do documento n.º ${str(v.participanteDoc)}` : ', portador(a) do documento n.º ____________'},`;

    const blocks: Block[] = [
      { type: 'title', text: 'Termo de responsabilidade e aceitação de riscos', subtitle: [nomeAct, v.dataActividade ? dateLong(v.dataActividade) : ''].filter(Boolean).join(' · ') },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${quem} declaro que pretendo participar${m ? ' com o menor' : ''} na actividade de **${nomeAct}** organizada por **${org}**, e que fui informado(a) de que a actividade envolve riscos próprios, designadamente:`,
        en: 'I wish to take part in the activity organised by the operator and have been informed it involves inherent risks, including:',
        keepWithNext: true,
      },
      { type: 'list', style: 'bullet', items: riscos.length ? riscos.map((r) => r + ';').map((r, i, a) => (i === a.length - 1 ? r.replace(/;$/, '.') : r)) : [BLANK] },
      {
        type: 'paragraph',
        id: 'saude',
        text: `Declaro que ${m ? 'o menor está' : 'estou'} em condições de saúde adequadas à actividade e que informei o organizador de qualquer doença, gravidez, alergia, medicação ou limitação física relevante. ${m ? 'O menor sabe' : 'Sei'} nadar, quando a actividade se realize na água.`,
        en: 'I declare fitness for the activity and have disclosed any relevant illness, pregnancy, allergy, medication or physical limitation; the participant can swim for water activities.',
      },
      { type: 'paragraph', id: 'regrasIntro', text: 'Comprometo-me a cumprir as regras de segurança e as instruções do guia ou do instrutor, nomeadamente:', en: 'I will follow the safety rules and the guide’s instructions, namely:', keepWithNext: true },
      { type: 'list', style: 'bullet', items: regras.length ? regras.map((r, i) => `${r}${i === regras.length - 1 ? '.' : ';'}`) : [BLANK] },
      {
        type: 'paragraph',
        id: 'responsabilidade',
        text: 'Aceito os riscos próprios da actividade e assumo a responsabilidade pelos danos que resultem do incumprimento das regras e das instruções. Esta declaração não exclui a responsabilidade do organizador pelos danos causados por sua culpa, pela falta de condições de segurança ou pelo mau estado do equipamento.',
        en: 'I accept the inherent risks and am responsible for harm caused by breaking the rules. This does not exclude the organiser’s liability for its own fault, unsafe conditions or faulty equipment.',
      },
      {
        type: 'paragraph',
        id: 'emergencia',
        text: `Autorizo o organizador a prestar${m ? ' ao menor' : '-me'} os primeiros socorros e a providenciar a assistência médica urgente que for necessária, avisando o contacto de emergência${str(v.participanteContacto) ? ` (${str(v.participanteContacto)})` : ': ____________________'}.`,
        en: 'I authorise first aid and urgent medical assistance and notification of the emergency contact.',
      },
    ];
    if (v.imagem) {
      blocks.push({ type: 'checklist', items: [{ label: 'Autorizo a utilização de fotografias e vídeos da actividade em que eu (ou o menor) apareça, para divulgação do organizador.', checked: false }] });
    }
    const col: SignatureColumn = { role: m ? 'O Representante Legal' : 'O Participante', name: (m ? str(v.representanteNome) : str(v.participanteNome)) || undefined };
    blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], keepWithNext: true } as Block;
    blocks.push({ type: 'signatures', placeDate: v.dataActividade ? placeDate(ctx, v.dataActividade) : `${ctx.place}, ___ de ______________ de ______`, columns: [col, { role: 'Pelo Organizador', name: ctx.profile?.representanteNome || undefined, image: 'signature' }] });
    return blocks;
  },
});
