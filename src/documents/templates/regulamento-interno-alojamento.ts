// Regulamento interno (regras da casa) de um hotel, lodge ou casa de
// hóspedes: posted in the rooms and at reception. Hours, visitors, quiet
// hours, safety, pool and beach, prohibitions, damage and emergencies. It may
// not override consumer rights. Bilingual output (PT/EN) helps foreign guests.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { semPonto, str } from './_contratos';
import { linhas, politicaHeader } from './_digital';

export default defineTemplate({
  id: 'regulamento-interno-alojamento',
  family: 'mapa',
  sections: [
    { id: 'estabelecimento', title: l('Estabelecimento', 'Establishment') },
    { id: 'horarios', title: l('Horários', 'Hours') },
    { id: 'regras', title: l('Regras', 'Rules') },
    { id: 'emergencia', title: l('Emergência', 'Emergency') },
  ],
  fields: [
    { name: 'nome', type: 'text', section: 'estabelecimento', width: 'half', required: true, label: l('Nome do estabelecimento', 'Establishment name'), default: (c) => c.profile?.nomeComercial || c.profile?.firma || '' },
    { name: 'versaoData', type: 'date', section: 'estabelecimento', width: 'half', label: l('Data', 'Date'), default: (c) => c.today },

    { name: 'hRecepcao', type: 'text', section: 'horarios', width: 'half', label: l('Recepção', 'Reception'), default: 'aberta permanentemente' },
    { name: 'hPequenoAlmoco', type: 'text', section: 'horarios', width: 'half', label: l('Pequeno-almoço', 'Breakfast'), default: 'das 6h30 às 10h00' },
    { name: 'hRestaurante', type: 'text', section: 'horarios', width: 'half', label: l('Restaurante e bar', 'Restaurant and bar'), default: 'das 12h00 às 22h30' },
    { name: 'hPiscina', type: 'text', section: 'horarios', width: 'half', label: l('Piscina (opcional)', 'Pool (optional)'), default: 'das 7h00 às 19h00' },
    { name: 'hSilencio', type: 'text', section: 'horarios', width: 'half', label: l('Silêncio a partir das', 'Quiet hours from'), default: '22h00 até às 7h00' },
    { name: 'hCheckout', type: 'text', section: 'horarios', width: 'half', label: l('Check-out até', 'Check-out by'), default: '10h00' },

    { name: 'visitas', type: 'select', section: 'regras', width: 'half', label: l('Visitas', 'Visitors'), options: [{ value: 'registadas', label: l('Permitidas, registadas na recepção', 'Allowed, registered at reception') }, { value: 'comuns', label: l('Só nas áreas comuns', 'Common areas only') }, { value: 'nao', label: l('Não permitidas', 'Not allowed') }], default: 'comuns' },
    { name: 'visitasAte', type: 'text', section: 'regras', width: 'half', label: l('Visitas até às', 'Visitors until'), default: '21h00', showIf: (v) => v.visitas !== 'nao' },
    { name: 'piscina', type: 'toggle', section: 'regras', default: true, label: l('Tem piscina', 'Has a pool') },
    { name: 'nadadorSalvador', type: 'toggle', section: 'regras', default: false, label: l('Há nadador-salvador na piscina', 'Lifeguard at the pool'), showIf: (v) => Boolean(v.piscina) },
    { name: 'praia', type: 'toggle', section: 'regras', default: true, label: l('Junto à praia, rio ou lago', 'By the beach, river or lake') },
    { name: 'fumar', type: 'toggle', section: 'regras', default: false, label: l('Permite fumar nos quartos', 'Smoking in rooms allowed') },
    { name: 'animais', type: 'toggle', section: 'regras', default: false, label: l('Aceita animais', 'Pets allowed') },
    { name: 'cozinhar', type: 'toggle', section: 'regras', default: false, label: l('Permite cozinhar nos quartos', 'Cooking in rooms allowed') },
    { name: 'outrasRegras', type: 'textarea', section: 'regras', rows: 3, label: l('Outras regras (opcional)', 'Other rules (optional)'), placeholder: l('Ex.: as viaturas circulam a velocidade reduzida no recinto\nNão alimente os macacos', 'E.g. drive slowly on the premises\nDo not feed the monkeys') },

    { name: 'emergenciaInterna', type: 'text', section: 'emergencia', label: l('Contacto interno de emergência', 'Internal emergency contact'), placeholder: l('Ex.: marque 9 no telefone do quarto ou +258 84 000 0000', 'E.g. dial 9 or +258 84 000 0000') },
    { name: 'emergenciaExterna', type: 'text', section: 'emergencia', label: l('Polícia, bombeiros, hospital mais próximo', 'Police, fire, nearest hospital'), placeholder: l('Ex.: Hospital Provincial de Inhambane, +258 293 20 000', 'E.g. nearest hospital and phone') },
    { name: 'pontoEncontro', type: 'text', section: 'emergencia', label: l('Ponto de encontro em caso de evacuação', 'Assembly point'), placeholder: l('Ex.: parque de estacionamento principal', 'E.g. main car park') },
  ],

  warnings: () => {
    const w: Warning[] = [];
    w.push({ level: 'info', message: l(`Afixe o regulamento na recepção e nos quartos, em português e inglês se receber estrangeiros (active a saída bilingue). As regras não podem afastar os direitos dos consumidores (${cite('turRegulamentoInterno')}).`, 'Post the rules at reception and in rooms, in Portuguese and English if you host foreigners (enable bilingual output). Rules cannot override consumer rights.') });
    return w;
  },

  personName: () => 'regulamento-interno',
  documentDate: (v) => v.versaoData,

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = str(v.nome) || BLANK;
    const items: ClauseItem[] = [];
    const h = (x: unknown) => semPonto(x) || BLANK;

    items.push({
      id: 'ri-horarios',
      heading: 'Horários',
      text: 'Os serviços funcionam nos seguintes horários:',
      items: [
        `recepção: ${h(v.hRecepcao)};`,
        `pequeno-almoço: ${h(v.hPequenoAlmoco)};`,
        `restaurante e bar: ${h(v.hRestaurante)};`,
        ...(v.piscina && str(v.hPiscina) ? [`piscina: ${h(v.hPiscina)};`] : []),
        `check-out: até às ${h(v.hCheckout)}.`,
      ],
      en: 'Service hours as listed.',
    });
    items.push({
      id: 'ri-registo',
      heading: 'Registo e chaves',
      text: 'Todos os hóspedes são registados na recepção com documento de identificação. As chaves ou cartões são pessoais; em caso de perda, avise de imediato a recepção. Ao sair, feche portas e janelas.',
      en: 'All guests register at reception with ID. Keys or cards are personal; report loss at once. Close doors and windows when leaving.',
    });
    items.push({
      id: 'ri-silencio',
      heading: 'Sossego',
      text: `Respeite o descanso dos outros hóspedes. Entre as ${h(v.hSilencio)}, mantenha silêncio nos quartos e nas áreas comuns. Não é permitida música alta nem festas nos quartos.`,
      en: 'Respect other guests. Quiet hours as stated; no loud music or parties in rooms.',
    });
    items.push({
      id: 'ri-visitas',
      heading: 'Visitas',
      text:
        v.visitas === 'nao'
          ? 'Por razões de segurança, não são permitidas visitas no recinto, salvo autorização da recepção.'
          : v.visitas === 'registadas'
            ? `As visitas são registadas na recepção, com documento de identificação, e devem sair até às ${h(v.visitasAte)}. O hóspede responde pelos actos dos seus visitantes.`
            : `As visitas são recebidas apenas nas áreas comuns, até às ${h(v.visitasAte)}, e não podem entrar nos quartos. O hóspede responde pelos actos dos seus visitantes.`,
      en: v.visitas === 'nao' ? 'No visitors without reception’s permission.' : 'Visitors as stated, until the stated time; guests answer for their visitors.',
    });
    items.push({
      id: 'ri-seguranca',
      heading: 'Segurança e objectos de valor',
      text: 'Guarde o dinheiro, os documentos e os objectos de valor no cofre. O estabelecimento não responde por valores deixados nos quartos ou nas viaturas, salvo culpa do seu pessoal. Não deixe aparelhos eléctricos ligados quando sair do quarto.',
      en: 'Keep money, documents and valuables in the safe; no liability for valuables left in rooms or cars unless staff are at fault. Switch off appliances when leaving.',
    });
    if (v.piscina) {
      items.push({
        id: 'ri-piscina',
        heading: 'Piscina',
        text: `${v.nadadorSalvador ? 'A piscina tem vigilância durante o horário de funcionamento.' : '**A piscina não tem nadador-salvador: a utilização é da responsabilidade de cada hóspede.**'} As crianças só a utilizam acompanhadas por um adulto responsável. Tome duche antes de entrar; não são permitidos copos de vidro nem mergulhos na zona pouco funda.`,
        en: `${v.nadadorSalvador ? 'The pool is supervised during opening hours.' : 'No lifeguard: swim at your own risk.'} Children only with an adult. Shower first; no glass, no diving in the shallow end.`,
      });
    }
    if (v.praia) {
      items.push({
        id: 'ri-praia',
        heading: 'Praia e água',
        text: 'Informe-se na recepção sobre as marés, as correntes e as zonas seguras para nadar. Não nade sozinho, à noite ou depois de consumir bebidas alcoólicas. Respeite a fauna e a flora e não retire conchas, corais ou animais.',
        en: 'Ask reception about tides, currents and safe areas. Do not swim alone, at night or after drinking. Respect wildlife; do not take shells, corals or animals.',
      });
    }
    const proibido = [
      v.fumar ? '' : 'fumar nos quartos e nos espaços interiores',
      'ter armas de qualquer tipo, estupefacientes ou substâncias perigosas',
      v.cozinhar ? '' : 'cozinhar ou usar fogareiros nos quartos',
      v.animais ? '' : 'trazer animais, salvo cães de assistência',
      'retirar dos quartos toalhas, roupa de cama ou outros objectos do estabelecimento',
      'alojar no quarto pessoas não registadas',
    ].filter(Boolean);
    items.push({
      id: 'ri-proibicoes',
      heading: 'Não é permitido',
      text: 'No estabelecimento, não é permitido:',
      items: proibido.map((s, i) => `${s}${i === proibido.length - 1 ? '.' : ';'}`),
      en: 'Not allowed: as listed.',
    });
    const outras = linhas(v.outrasRegras);
    if (outras.length) {
      items.push({ id: 'ri-outras', heading: 'Outras regras', text: outras.map(semPonto).join('. ') + '.', en: 'Other rules as listed.' });
    }
    items.push({
      id: 'ri-ambiente',
      heading: 'Ambiente',
      text: 'Ajude-nos a poupar água e energia: desligue as luzes e o ar condicionado ao sair e indique se pretende reutilizar as toalhas. Deite o lixo nos recipientes próprios.',
      en: 'Help save water and energy: switch off lights and air conditioning when leaving and reuse towels if you wish. Use the bins.',
    });
    items.push({
      id: 'ri-danos',
      heading: 'Danos',
      text: 'Os danos causados pelos hóspedes ou pelos seus visitantes nas instalações e no equipamento, para além do desgaste normal, são cobrados pelo custo da reparação ou da substituição.',
      en: 'Damage beyond normal wear caused by guests or their visitors is charged at repair or replacement cost.',
    });
    items.push({
      id: 'ri-incumprimento',
      heading: 'Incumprimento',
      text: 'O estabelecimento pode recusar a continuação da estadia ao hóspede que, depois de avisado, perturbe gravemente os outros hóspedes, ponha em risco a segurança ou danifique as instalações, sem prejuízo do pagamento das noites utilizadas e dos danos causados.',
      en: 'A guest who, after warning, seriously disturbs others, endangers safety or damages property may be asked to leave, paying the nights used and the damage.',
    });
    items.push({
      id: 'ri-reclamacoes',
      heading: 'Sugestões e reclamações',
      text: 'As sugestões e as reclamações podem ser apresentadas na recepção. O livro de reclamações está à disposição dos hóspedes.',
      en: 'Suggestions and complaints at reception; the complaints book is available.',
    });

    const emerg = [
      str(v.emergenciaInterna) ? `**Emergência no estabelecimento:** ${semPonto(v.emergenciaInterna)}` : '',
      str(v.emergenciaExterna) ? `**Contactos externos:** ${semPonto(v.emergenciaExterna)}` : '',
      str(v.pontoEncontro) ? `**Ponto de encontro em caso de evacuação:** ${semPonto(v.pontoEncontro)}` : '',
    ].filter(Boolean);

    const blocks: Block[] = [
      ...politicaHeader(ctx, 'Regulamento interno', v.versaoData, nome !== BLANK ? nome : undefined),
      { type: 'paragraph', id: 'intro', text: `Bem-vindo ao ${nome}. Para que todos tenham uma estadia agradável e segura, pedimos que respeite as seguintes regras.`, en: `Welcome to ${nome}. For a pleasant and safe stay for everyone, please follow these rules.` },
      { type: 'numberedClauses', style: 'numeric', items },
    ];
    if (emerg.length) blocks.push({ type: 'box', label: 'Em caso de emergência', text: emerg.join('\n') });
    blocks.push({ type: 'paragraph', id: 'gerencia', text: 'A Direcção', align: 'right', en: 'The Management' });
    return blocks;
  },
});
