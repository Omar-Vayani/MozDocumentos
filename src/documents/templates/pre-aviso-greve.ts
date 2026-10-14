// Pré-aviso de greve: written notice by the union body (or the employees'
// representatives elected by the general meeting) to the employer and the
// Ministry of Labour, within office hours and with the legal minimum notice,
// with the list of demands, the sectors covered, start day and time, expected
// duration and the proposal of minimum services.

import { addWorkingDays, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField } from './_shared';
import { linhas, nosTermos, ponto, str } from './_rh-politicas';

type P = { diasUteis: number; diasEssenciais: number };

export default defineTemplate({
  id: 'pre-aviso-greve',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'emissor', title: l('Quem declara a greve', 'Who calls the strike') },
    { id: 'greve', title: l('Greve', 'Strike') },
    { id: 'reivindicacoes', title: l('Caderno reivindicativo', 'Demands') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data de entrega', 'Delivery date')),
    { name: 'emissorTipo', type: 'select', section: 'emissor', label: l('Organismo', 'Body'), default: 'comite', options: [
      { value: 'sindicato', label: l('Sindicato', 'Trade union') },
      { value: 'comite', label: l('Comité sindical da empresa', 'Company union committee') },
      { value: 'assembleia', label: l('Representantes eleitos pela assembleia de trabalhadores', 'Representatives elected by the staff meeting') },
    ] },
    { name: 'emissorNome', type: 'text', section: 'emissor', required: true, label: l('Designação', 'Name'), placeholder: l('Ex.: Comité Sindical do SINTICIM na Machava & Filhos', 'E.g. SINTICIM union committee'), default: (c) => c.profile?.firma || c.profile?.nome || '' },
    { name: 'dataDeliberacao', type: 'date', section: 'emissor', width: 'half', label: l('Data da deliberação', 'Date of the decision'), help: l('Consulta aos trabalhadores ou assembleia geral que decidiu a greve.', 'Consultation or general meeting that decided the strike.') },
    { name: 'representantes', type: 'textarea', section: 'emissor', rows: 2, label: l('Representantes (um por linha)', 'Representatives (one per line)') },
    { name: 'empresaNome', type: 'text', section: 'greve', required: true, label: l('Empregador', 'Employer') },
    { name: 'empresaMorada', type: 'text', section: 'greve', label: l('Morada do empregador', 'Employer’s address') },
    { name: 'ministerio', type: 'text', section: 'greve', label: l('Ministério do Trabalho (com conhecimento)', 'Ministry of Labour (copy)'), default: 'Direcção Provincial do Trabalho' },
    { name: 'essencial', type: 'toggle', section: 'greve', default: false, label: l('Serviço essencial (saúde, água, energia, transportes, segurança…)', 'Essential service (health, water, power, transport, security…)'), help: l('Nos serviços essenciais o pré-aviso é mais longo e os serviços mínimos são obrigatórios.', 'Essential services need longer notice and mandatory minimum services.') },
    { name: 'dataInicio', type: 'date', section: 'greve', width: 'half', required: true, label: l('Dia de início', 'Start date') },
    { name: 'horaInicio', type: 'text', section: 'greve', width: 'half', required: true, label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 7h00', 'E.g. 7:00') },
    { name: 'duracao', type: 'text', section: 'greve', required: true, label: l('Duração prevista', 'Expected duration'), placeholder: l('Ex.: três dias, até às 17h00 do dia 30 de Outubro', 'E.g. three days, until 5 p.m. on 30 October') },
    { name: 'sectores', type: 'text', section: 'greve', required: true, label: l('Sectores e locais abrangidos', 'Sectors and sites covered'), placeholder: l('Ex.: todos os estaleiros e a oficina central', 'E.g. all sites and the central workshop') },
    { name: 'servicosMinimos', type: 'textarea', section: 'greve', rows: 3, label: l('Proposta de serviços mínimos', 'Proposed minimum services'), placeholder: l('Ex.: vigilância das instalações e manutenção dos geradores', 'E.g. site security and generator maintenance') },
    { name: 'reivindicacoes', type: 'textarea', section: 'reivindicacoes', rows: 6, required: true, label: l('Reivindicações (uma por linha)', 'Demands (one per line)') },
    { name: 'tentativas', type: 'textarea', section: 'reivindicacoes', rows: 3, label: l('Tentativas de resolução (negociação, mediação)', 'Attempts to resolve (negotiation, mediation)'), legal: l('A greve só é lícita depois de tentados os meios alternativos de resolução do conflito.', 'A strike is only lawful after trying alternative dispute resolution.') },
  ],

  computed: (v, { legal }) => {
    const p = legal.value<P>('rhpGrevePreAviso');
    let ok: boolean | null = null;
    if (v.data && v.dataInicio) {
      ok = v.essencial ? diffDays(v.data, v.dataInicio) >= p.diasEssenciais : v.dataInicio >= addWorkingDays(v.data, p.diasUteis);
    }
    return { p, ok };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const { p, ok } = ctx.computed as { p: P; ok: boolean | null };
    if (ok === false) {
      w.push({ level: 'error', field: 'dataInicio', message: l(v.essencial ? `Nos serviços essenciais o pré-aviso é de ${p.diasEssenciais} dias (${cite('rhpGrevePreAviso')}).` : `O pré-aviso é de pelo menos ${p.diasUteis} dias úteis, entregue dentro das horas normais de expediente (${cite('rhpGrevePreAviso')}).`, 'The notice period is too short.') });
    }
    if (!str(v.tentativas)) w.push({ level: 'warning', field: 'tentativas', message: l(`Antes da greve devem tentar-se os meios alternativos de resolução do conflito (${cite('rhpGreveDecisao')}). Descreva-os.`, 'Describe the attempts at negotiation or mediation.') });
    if (v.essencial && !str(v.servicosMinimos)) w.push({ level: 'error', field: 'servicosMinimos', message: l(`Nos serviços essenciais os serviços mínimos são obrigatórios (${cite('rhpServicosMinimos')}).`, 'Minimum services are mandatory in essential services.') });
    w.push({ level: 'info', message: l('Entregue ao empregador e ao Ministério do Trabalho, em mão ou por meio com prova de recepção, e guarde as cópias assinadas.', 'Deliver to the employer and the Ministry with proof of receipt and keep the signed copies.') });
    return w;
  },
  personName: (v) => v.empresaNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const reiv = linhas(v.reivindicacoes);
    const tent = linhas(v.tentativas).join('; ');
    const sm = linhas(v.servicosMinimos);
    const reps = linhas(v.representantes);
    const emissor = str(v.emissorNome).replace(/^(O|A|Os|As) /, (m) => m.toLowerCase()) || BLANK;
    const blocks: Block[] = [
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: 'À', lines: [str(v.empresaNome) || BLANK, str(v.empresaMorada)].filter(Boolean) },
      { type: 'subject', text: 'Pré-aviso de greve' },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'aviso',
        text: `${nosTermos('rhpGrevePreAviso').replace(/^n/, 'N')}, ${emissor} comunica a V. Ex.as que${v.dataDeliberacao ? `, conforme deliberado em ${dateLong(v.dataDeliberacao)}${v.emissorTipo === 'assembleia' ? ' pela assembleia geral de trabalhadores' : ', após consulta aos trabalhadores'},` : ''} os trabalhadores ${str(v.empresaNome) ? `de ${str(v.empresaNome)}` : 'da empresa'} entrarão em greve a partir das **${str(v.horaInicio) || BLANK}** do dia **${dateLong(v.dataInicio)}**, com a duração prevista de ${str(v.duracao) || BLANK}.`,
        en: `Employees will strike from ${v.horaInicio || '—'} on ${v.dataInicio || '—'} for the stated duration.`,
      },
      { type: 'paragraph', id: 'sectores', text: `A greve abrange os seguintes sectores e locais de trabalho: ${ponto(str(v.sectores) || BLANK)}`, en: 'Sectors and sites covered.' },
      { type: 'paragraph', id: 'reivindicacoesIntro', text: 'A greve tem por objectivo a satisfação das reivindicações constantes do caderno reivindicativo seguinte:', en: 'The demands are:', keepWithNext: true },
      { type: 'list', style: 'numeric', items: (reiv.length ? reiv : [BLANK]).map((r) => ponto(r)) },
    ];
    if (tent) blocks.push({ type: 'paragraph', id: 'tentativas', text: `Antes de recorrer à greve, foram tentados os seguintes meios de resolução do conflito: ${ponto(tent.charAt(0).toLowerCase() + tent.slice(1))}`, en: 'Attempts to resolve the dispute.' });
    blocks.push({
      type: 'paragraph',
      id: 'servicosMinimos',
      text: sm.length
        ? `Durante a greve serão assegurados os serviços mínimos indispensáveis à segurança e manutenção dos equipamentos e instalações${v.essencial ? ' e à satisfação das necessidades essenciais' : ''}, propondo-se: ${sm.map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join('; ')}. Propomos acordar com V. Ex.as, durante o pré-aviso, os serviços mínimos e os trabalhadores encarregados de os prestar ${nosTermos('rhpServicosMinimos')}.`
        : `Durante o pré-aviso, propomos acordar com V. Ex.as os serviços mínimos indispensáveis à segurança e manutenção dos equipamentos e instalações e os trabalhadores encarregados de os prestar ${nosTermos('rhpServicosMinimos')}.`,
      en: 'Minimum services will be provided; we propose to agree them and the employees concerned during the notice period.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'dialogo',
      text: `Os trabalhadores em greve são representados ${reps.length ? `por ${reps.join(', ')}` : `por ${emissor}`}, que se ${reps.length > 1 ? 'mantêm disponíveis' : 'mantém disponível'} para o diálogo e para as acções conciliatórias que o Ministério do Trabalho entenda promover.`,
      en: 'The strikers’ representatives remain open to dialogue and conciliation.',
      keepWithNext: true,
    });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ role: v.emissorTipo === 'assembleia' ? 'Os Representantes dos Trabalhadores' : `Pel${v.emissorTipo === 'sindicato' ? 'o Sindicato' : 'o Comité Sindical'}`, name: reps[0] || undefined }] },
      { type: 'paragraph', id: 'cc', size: 'small', text: `C/c: ${str(v.ministerio) || 'Ministério que superintende a área do Trabalho'}.`, en: 'Copy to the Ministry of Labour.' },
      { type: 'acknowledgement', text: 'Recebido em ___/___/______, às ____h____', signer: 'Pelo Empregador' },
    );
    return blocks;
  },
});
