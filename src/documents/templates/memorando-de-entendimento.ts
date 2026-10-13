// Memorando de entendimento (MoU): framework for cooperation between
// organisations or the main terms of a future deal. States clearly which
// articles bind the parties.

import { defineTemplate, type Block, type ClauseItem, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, l, splitLines } from './_shared';
import { assinatura, foroField, identificacao, int, juntar, partyFields, partyName, partyWarnings, quantos, semPonto, str, type Papel } from './_contratos';

const ORD = ['Primeira', 'Segunda', 'Terceira'];
const parteRole = (i: number): Papel => {
  const n = `${ORD[i]} Parte`;
  return { n, f: true, o: `a ${n}`, O: `A ${n}`, de: `da ${n}`, ao: `à ${n}`, pelo: `pela ${n}` };
};
const terceira = (f: FieldDef): FieldDef => ({ ...f, showIf: (v: Values) => Boolean(v.terceiraParte) && (f.showIf ? f.showIf(v) : true) });

export default defineTemplate({
  id: 'memorando-de-entendimento',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'parte1', title: l('Primeira parte', 'First party'), personRole: 'outro' },
    { id: 'parte2', title: l('Segunda parte', 'Second party'), personRole: 'outro' },
    { id: 'parte3', title: l('Terceira parte (opcional)', 'Third party (optional)'), personRole: 'outro' },
    { id: 'conteudo', title: l('Objecto e cooperação', 'Purpose and cooperation') },
    { id: 'natureza', title: l('Natureza, vigência e assinaturas', 'Nature, term and signatures') },
  ],
  fields: [
    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local de assinatura', 'Place of signing'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data de assinatura', 'Signing date'), default: (c) => c.today },
    ...partyFields('parte1', { fromProfile: true, tipoDefault: 'empresa' }),
    { name: 'parte1Sigla', type: 'text', section: 'parte1', width: 'half', label: l('Nome abreviado (opcional)', 'Short name (optional)'), placeholder: l('Ex.: ABC', 'E.g. ABC') },
    ...partyFields('parte2', { tipoDefault: 'empresa' }),
    { name: 'parte2Sigla', type: 'text', section: 'parte2', width: 'half', label: l('Nome abreviado (opcional)', 'Short name (optional)') },
    { name: 'terceiraParte', type: 'toggle', section: 'parte3', label: l('Há uma terceira parte', 'There is a third party') },
    ...partyFields('parte3', { tipoDefault: 'empresa' }).map(terceira),
    terceira({ name: 'parte3Sigla', type: 'text', section: 'parte3', width: 'half', label: l('Nome abreviado (opcional)', 'Short name (optional)') }),

    {
      name: 'considerandos',
      type: 'textarea',
      section: 'conteudo',
      rows: 4,
      label: l('Considerandos (contexto, um por linha)', 'Background (one per line)'),
      placeholder: l('Ex.: A Primeira Parte desenvolve programas de formação profissional na Província de Sofala', 'E.g. The First Party runs vocational training in Sofala'),
    },
    { name: 'objecto', type: 'textarea', section: 'conteudo', required: true, rows: 2, label: l('Objecto do memorando', 'Purpose'), placeholder: l('Ex.: estabelecer o quadro de cooperação na formação de jovens em energias renováveis', 'E.g. set a framework for cooperation on youth training in renewable energy') },
    { name: 'areas', type: 'textarea', section: 'conteudo', rows: 4, label: l('Áreas de cooperação (uma por linha)', 'Areas of cooperation (one per line)') },
    { name: 'responsabilidades1', type: 'textarea', section: 'conteudo', rows: 3, label: l('Compromissos da Primeira Parte (um por linha)', 'First Party commitments (one per line)') },
    { name: 'responsabilidades2', type: 'textarea', section: 'conteudo', rows: 3, label: l('Compromissos da Segunda Parte (um por linha)', 'Second Party commitments (one per line)') },
    { name: 'responsabilidades3', type: 'textarea', section: 'conteudo', rows: 3, label: l('Compromissos da Terceira Parte (um por linha)', 'Third Party commitments (one per line)'), showIf: (v) => Boolean(v.terceiraParte) },
    { name: 'pontosFocais', type: 'textarea', section: 'conteudo', rows: 2, label: l('Pontos focais (nome, cargo e contacto, um por linha)', 'Focal points (name, role, contact; one per line)') },

    {
      name: 'vinculativo',
      type: 'toggle',
      section: 'natureza',
      label: l('O memorando é juridicamente vinculativo', 'The MoU is legally binding'),
      help: l('Em regra, um memorando é uma declaração de intenções: só as cláusulas de confidencialidade, vigência e litígios obrigam. Active se quiser que todo o memorando obrigue as partes.', 'Usually an MoU is a statement of intent: only confidentiality, term and disputes clauses bind. Turn on to make the whole MoU binding.'),
    },
    { name: 'exclusividadeNegocial', type: 'toggle', section: 'natureza', label: l('Exclusividade nas negociações até uma data', 'Exclusive negotiations until a date') },
    { name: 'exclusividadeAte', type: 'date', section: 'natureza', width: 'half', label: l('Exclusividade até', 'Exclusive until'), showIf: (v) => Boolean(v.exclusividadeNegocial) },
    { name: 'logotipos', type: 'toggle', section: 'natureza', default: true, label: l('Uso de nomes e logotipos só com autorização', 'Names and logos only with consent') },
    { name: 'duracaoAnos', type: 'number', section: 'natureza', width: 'half', min: 1, max: 10, default: 2, label: l('Vigência (anos)', 'Term (years)') },
    { name: 'renovacao', type: 'toggle', section: 'natureza', default: true, label: l('Renovação automática por iguais períodos', 'Automatic renewal') },
    { name: 'avisoDenunciaDias', type: 'number', section: 'natureza', width: 'half', min: 1, max: 365, default: 60, label: l('Aviso para terminar (dias)', 'Notice to terminate (days)') },
    { name: 'versaoIngles', type: 'toggle', section: 'natureza', label: l('Também assinado em versão inglesa', 'Also signed in English') },
    foroField('natureza'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'parte1', 'primeira parte', 'first party'), ...partyWarnings(v, 'parte2', 'segunda parte', 'second party')];
    if (v.terceiraParte) w.push(...partyWarnings(v, 'parte3', 'terceira parte', 'third party'));
    if (!str(v.objecto)) w.push({ level: 'error', field: 'objecto', message: l('Indique o objecto do memorando.', 'Enter the purpose.') });
    w.push({
      level: 'info',
      field: 'vinculativo',
      message: l(
        `Diga claramente se o memorando obriga as partes. Mesmo não vinculativo, romper negociações de má-fé pode gerar o dever de indemnizar (${cite('negociacoesBoaFe')}).`,
        'State clearly whether the MoU binds. Even if not binding, breaking off talks in bad faith may create liability.',
      ),
    });
    if (v.vinculativo && !str(v.responsabilidades1) && !str(v.responsabilidades2)) {
      w.push({ level: 'warning', field: 'responsabilidades1', message: l('Um memorando vinculativo deve indicar os compromissos de cada parte.', 'A binding MoU should list each party’s commitments.') });
    }
    return w;
  },

  personName: (v) => partyName(v, 'parte2') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ps = ['parte1', 'parte2', ...(v.terceiraParte ? ['parte3'] : [])];
    const roles = ps.map((_, i) => parteRole(i));
    const aviso = int(v.avisoDenunciaDias);
    const anos = int(v.duracaoAnos);

    const partyParas: Block[] = ps.map((p, i) => {
      const sigla = semPonto(v[`${p}Sigla`]);
      return {
        type: 'paragraph' as const,
        id: `parte_${p}`,
        text: `${i === 0 ? 'Entre:\n' : i === ps.length - 1 ? 'e\n' : ''}${identificacao(v, p)}, adiante designada por **${roles[i].n}**${sigla ? ` ou «${sigla}»` : ''}${i === ps.length - 1 ? ',' : ';'}`,
        en: `${i === 0 ? 'Between' : 'and'} the ${['First', 'Second', 'Third'][i]} Party, identified above;`,
      };
    });
    const considerandos = splitLines(v.considerandos);

    const naoVinc = !v.vinculativo;
    const items: ClauseItem[] = [];
    items.push({
      id: 'objecto',
      heading: 'Objecto',
      text: `O presente Memorando tem por objecto ${semPonto(v.objecto).replace(/^(o|a)\s+/i, '') || BLANK}.`,
      en: `Purpose: ${v.objecto || '—'}.`,
    });
    const areas = splitLines(v.areas);
    if (areas.length) {
      items.push({
        id: 'areas',
        heading: 'Áreas de cooperação',
        text: 'A cooperação entre as Partes desenvolve-se, designadamente, nas seguintes áreas:',
        items: areas.map((a, i) => `${semPonto(a)}${i === areas.length - 1 ? '.' : ';'}`),
        en: 'Cooperation covers, in particular, the areas listed.',
      });
    }
    ps.forEach((_p, i) => {
      const r = splitLines(v[`responsabilidades${i + 1}`]);
      if (!r.length) return;
      items.push({
        id: `responsabilidades${i + 1}`,
        heading: `Compromissos ${roles[i].de}`,
        text: `${roles[i].O} ${naoVinc ? 'propõe-se' : 'obriga-se'} a:`,
        items: r.map((x, j) => `${semPonto(x).replace(/^./, (s) => s.toLowerCase())}${j === r.length - 1 ? '.' : ';'}`),
        en: `Commitments of the ${['First', 'Second', 'Third'][i]} Party.`,
      });
    });
    const focais = splitLines(v.pontosFocais);
    items.push({
      id: 'coordenacao',
      heading: 'Coordenação',
      text: focais.length
        ? `Para a execução do presente Memorando, as Partes designam os seguintes pontos focais: ${focais.map(semPonto).join('; ')}. A substituição de um ponto focal é comunicada por escrito.`
        : 'Cada Parte designa, por escrito, um ponto focal responsável pela coordenação das actividades previstas no presente Memorando.',
      en: 'Each party names a focal point to coordinate the activities.',
    });
    items.push({
      id: 'custos',
      heading: 'Custos',
      text: 'Cada Parte suporta os custos das suas próprias actividades, salvo acordo escrito específico em contrário.',
      en: 'Each party bears its own costs unless agreed otherwise in writing.',
    });
    if (v.exclusividadeNegocial) {
      items.push({
        id: 'exclusividade',
        heading: 'Exclusividade',
        text: `Até ${dateLong(v.exclusividadeAte)}, nenhuma das Partes negoceia com terceiros acordos com o mesmo objecto do presente Memorando.`,
        en: `Until ${v.exclusividadeAte || '—'}, neither party negotiates the same subject with others.`,
      });
    }
    if (v.logotipos) {
      items.push({
        id: 'logotipos',
        heading: 'Uso de nomes e logotipos',
        text: 'Nenhuma das Partes utiliza o nome, o logotipo ou outros sinais distintivos da outra sem a sua autorização prévia e escrita.',
        en: 'Neither party uses the other’s name or logo without prior written consent.',
      });
    }
    items.push({
      id: 'confidencialidade',
      heading: 'Confidencialidade',
      text: 'As Partes mantêm confidenciais as informações não públicas trocadas no âmbito do presente Memorando, durante a sua vigência e após a sua cessação, salvo autorização escrita da Parte que as forneceu ou obrigação legal.',
      en: 'Non-public information exchanged is confidential during and after the MoU.',
    });
    const vincIds = ['Confidencialidade', 'Vigência e cessação', 'Resolução de diferendos', ...(v.exclusividadeNegocial ? ['Exclusividade'] : []), ...(v.logotipos ? ['Uso de nomes e logotipos'] : [])];
    items.push({
      id: 'natureza',
      heading: 'Natureza do Memorando',
      text: naoVinc
        ? `O presente Memorando constitui uma declaração de intenções e não cria obrigações juridicamente vinculativas entre as Partes, com excepção do disposto nos artigos sobre ${juntar(vincIds.map((s) => s.toLowerCase()))}. A execução das actividades aqui previstas é objecto de contratos ou acordos específicos, celebrados por escrito.`
        : 'O presente Memorando cria obrigações juridicamente vinculativas para as Partes, que se comprometem a cumpri-lo de boa-fé. As actividades concretas podem ser detalhadas em acordos específicos, celebrados por escrito.',
      en: naoVinc ? 'This MoU is a statement of intent and is not legally binding, except the confidentiality, term and dispute provisions (and exclusivity/logo clauses if any).' : 'This MoU is legally binding.',
    });
    items.push({
      id: 'vigencia',
      heading: 'Vigência e cessação',
      text: [
        `O presente Memorando entra em vigor na data da sua assinatura e vigora pelo período de ${quantos(anos, 'ano', 'anos')}${v.renovacao ? ', renovando-se automaticamente por iguais períodos' : ''}.`,
        'O Memorando pode ser revisto a todo o tempo, por acordo escrito das Partes.',
        `Qualquer das Partes pode denunciar o Memorando mediante comunicação escrita às demais, com a antecedência mínima de ${quantos(aviso, 'dia', 'dias')}, sem prejuízo da conclusão das actividades em curso.`,
      ]
        .map((t, i) => `${i + 1}. ${t}`)
        .join('\n'),
      en: `In force on signature for ${anos ?? '—'} years${v.renovacao ? ', renewing automatically' : ''}; may be amended in writing; terminable on ${aviso ?? '—'} days’ notice.`,
    });
    items.push({
      id: 'diferendos',
      heading: 'Resolução de diferendos',
      text: `O presente Memorando rege-se pela lei moçambicana. Os diferendos são resolvidos por negociação directa entre as Partes e, na sua falta, pelo ${semPonto(v.foro) || 'tribunal judicial competente'}.`,
      en: 'Mozambican law applies; disputes are settled by negotiation or, failing that, by the competent court.',
    });

    const feito = `Feito em ${ctx.place}, aos ${dateLong(v.data)}, em ${ps.length === 3 ? 'três' : 'dois'} exemplares originais em língua portuguesa${v.versaoIngles ? ` e ${ps.length === 3 ? 'três' : 'dois'} em língua inglesa, fazendo todos igualmente fé; em caso de divergência, prevalece a versão portuguesa` : ', fazendo todos igualmente fé'}.`;

    const sig = (p: string, i: number) => ({ ...assinatura(ctx, p, parteRole(i), i === 0), role: `Pela ${roles[i].n}` });
    const cols = ps.map(sig);
    const blocks: Block[] = [
      { type: 'title', text: 'Memorando de entendimento' },
      ...partyParas,
    ];
    if (considerandos.length) {
      blocks.push(
        { type: 'paragraph', id: 'considerando', text: 'Considerando que:', en: 'Whereas:', keepWithNext: true },
        { type: 'list', style: 'alpha', items: considerandos.map((c) => `${semPonto(c)};`) },
      );
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'celebracao',
        text: 'As Partes acordam celebrar o presente Memorando de Entendimento, que se rege pelos artigos seguintes:',
        en: 'The parties agree this Memorandum of Understanding on the following terms:',
      },
      { type: 'numberedClauses', style: 'artigo', items },
      { type: 'paragraph', id: 'feito', text: feito, en: 'Signed in original copies of equal validity.', keepWithNext: true },
      { type: 'signatures', columns: cols.slice(0, 2), keepWithNext: cols.length > 2 },
    );
    if (cols.length > 2) blocks.push({ type: 'signatures', columns: cols.slice(2) });
    return blocks;
  },
});
