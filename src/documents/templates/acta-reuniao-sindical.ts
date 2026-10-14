// Acta de reunião laboral: (a) a meeting between management and the union
// committee (consultation, negotiation of a company agreement, complaints) or
// (b) a general meeting of employees convened where there is no union body —
// to elect a workers' committee or decide on a strike (quorum and majority
// rules of the Labour Law).

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, l, lineItems, localField } from './_shared';
import { nosTermos, str } from './_rh-politicas';

type Tipo = 'empresa' | 'assembleia';

export default defineTemplate({
  id: 'acta-reuniao-sindical',
  family: 'acta',
  sections: [
    { id: 'reuniao', title: l('Reunião', 'Meeting') },
    { id: 'presencas', title: l('Presenças', 'Attendance') },
    { id: 'ordem', title: l('Ordem de trabalhos e deliberações', 'Agenda and resolutions') },
  ],
  fields: [
    { name: 'tipo', type: 'select', section: 'reuniao', required: true, label: l('Tipo de reunião', 'Type of meeting'), default: 'empresa', options: [
      { value: 'empresa', label: l('Direcção da empresa e comité sindical', 'Management and union committee') },
      { value: 'assembleia', label: l('Assembleia geral de trabalhadores', 'General meeting of employees') },
    ] },
    { name: 'numero', type: 'text', section: 'reuniao', width: 'half', label: l('Acta n.º', 'Minutes no.') },
    localField('reuniao'),
    dateField('data', 'reuniao', l('Data da reunião', 'Meeting date')),
    { name: 'horaInicio', type: 'text', section: 'reuniao', width: 'half', label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 14h00', 'E.g. 14:00') },
    { name: 'horaFim', type: 'text', section: 'reuniao', width: 'half', label: l('Hora de encerramento', 'Closing time') },
    { name: 'localReuniao', type: 'text', section: 'reuniao', label: l('Local da reunião', 'Venue'), placeholder: l('Ex.: sala de reuniões da sede', 'E.g. head office meeting room') },
    { name: 'orgaoNome', type: 'text', section: 'reuniao', label: l('Órgão sindical', 'Union body'), placeholder: l('Ex.: Comité Sindical do SINTICIM', 'E.g. SINTICIM union committee'), showIf: (v) => v.tipo !== 'assembleia' },
    { name: 'convocadaPor', type: 'text', section: 'reuniao', label: l('Convocada por', 'Called by'), placeholder: l('Ex.: 46 trabalhadores, mais de um quinto do total', 'E.g. 46 employees, over a fifth of the total'), showIf: (v) => v.tipo === 'assembleia' },
    { name: 'totalTrabalhadores', type: 'number', section: 'presencas', width: 'half', min: 0, label: l('Total de trabalhadores da empresa', 'Total employees'), showIf: (v) => v.tipo === 'assembleia' },
    { name: 'numeroPresentes', type: 'number', section: 'presencas', width: 'half', min: 0, label: l('Trabalhadores presentes', 'Employees present'), showIf: (v) => v.tipo === 'assembleia' },
    { name: 'presidente', type: 'text', section: 'presencas', width: 'half', label: l('Presidiu (nome)', 'Chair (name)') },
    { name: 'secretario', type: 'text', section: 'presencas', width: 'half', label: l('Secretariou (nome)', 'Secretary (name)') },
    {
      name: 'empresaPresentes',
      type: 'lines',
      section: 'presencas',
      label: l('Pela empresa', 'For the company'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
      ],
      default: [],
      showIf: (v) => v.tipo !== 'assembleia',
    },
    {
      name: 'sindicatoPresentes',
      type: 'lines',
      section: 'presencas',
      label: l('Pelo órgão sindical / trabalhadores', 'For the union / employees'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Qualidade', 'Capacity') },
      ],
      default: [],
    },
    {
      name: 'ordem',
      type: 'lines',
      section: 'ordem',
      label: l('Ordem de trabalhos', 'Agenda'),
      addLabel: l('Adicionar ponto', 'Add item'),
      columns: [{ name: 'ponto', type: 'text', label: l('Ponto', 'Item') }],
      default: [],
    },
    {
      name: 'deliberacoes',
      type: 'lines',
      section: 'ordem',
      label: l('Discussão e deliberações (pela ordem dos pontos)', 'Discussion and resolutions (by item)'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'discussao', type: 'text', label: l('Resumo da discussão', 'Summary of discussion') },
        { name: 'deliberacao', type: 'text', label: l('Deliberação / acordo', 'Resolution / agreement') },
        { name: 'votos', type: 'text', label: l('Votação (opcional)', 'Vote (optional)'), placeholder: l('Ex.: 40 votos a favor, 3 contra', 'E.g. 40 for, 3 against') },
      ],
      default: [],
    },
  ],

  computed: (v) => {
    const total = Number(v.totalTrabalhadores);
    const pres = Number(v.numeroPresentes);
    const ok = Number.isFinite(total) && total > 0 && Number.isFinite(pres);
    return { quorumGreve: ok ? pres * 3 >= total * 2 : null };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (v.tipo === 'assembleia') {
      if (ctx.computed.quorumGreve === false) w.push({ level: 'warning', field: 'numeroPresentes', message: l(`Para decidir uma greve, a assembleia só delibera com pelo menos dois terços dos trabalhadores presentes, por maioria absoluta dos presentes (${cite('rhpGreveDecisao')}).`, 'To decide a strike, two thirds of employees must be present; decisions by absolute majority of those present.') });
      const pct = ctx.legal.value<{ comissaoPercent: number }>('rhpEstruturasSindicais').comissaoPercent;
      w.push({ level: 'info', message: l(`A assembleia é convocada pelo sindicato, por um terço dos trabalhadores (${cite('rhpReunioesSindicais')}) ou, para eleger comissão de trabalhadores ou decidir greve onde não há órgão sindical, por pelo menos ${pct} por cento dos trabalhadores (${cite('rhpEstruturasSindicais')}). Comunique a reunião ao empregador com a antecedência legal.`, `The meeting is called by the union, one third of employees or, where there is no union body, at least ${pct}% of employees; notify the employer in advance.`) });
    }
    return w;
  },
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const tipo = (v.tipo as Tipo) === 'assembleia' ? 'assembleia' : 'empresa';
    const empresa = employerName(ctx);
    const emp = lineItems(v.empresaPresentes).filter((r) => str(r.nome));
    const sind = lineItems(v.sindicatoPresentes).filter((r) => str(r.nome));
    const ordem = lineItems(v.ordem).map((r) => str(r.ponto)).filter(Boolean);
    const delib = lineItems(v.deliberacoes).filter((r) => str(r.deliberacao) || str(r.discussao));
    const pessoas = (xs: Record<string, any>[]) => xs.map((r) => `${str(r.nome)}${str(r.cargo) ? ` (${str(r.cargo)})` : ''}`).join('; ');
    const hora = str(v.horaInicio) ? `, pelas ${str(v.horaInicio)}` : '';
    const local = str(v.localReuniao) ? `, em ${str(v.localReuniao)}` : '';
    const blocks: Block[] = [
      { type: 'title', text: `Acta${str(v.numero) ? ` n.º ${str(v.numero)}` : ''}`, subtitle: tipo === 'assembleia' ? 'Assembleia geral de trabalhadores' : 'Reunião entre a Direcção e o órgão sindical' },
    ];
    if (tipo === 'empresa') {
      blocks.push({
        type: 'paragraph',
        id: 'abertura',
        text: `Aos ${dateLong(v.data)}${hora}${local}, reuniram-se os representantes ${empresa === BLANK ? 'da Empresa' : `de ${empresa}`}${emp.length ? `, ${pessoas(emp)}` : ''}, e os representantes ${str(v.orgaoNome) ? `do ${str(v.orgaoNome).replace(/^(o|do)\s+/i, '')}` : 'do órgão sindical'}${sind.length ? `, ${pessoas(sind)}` : ''}${str(v.presidente) ? `, sob a presidência de ${str(v.presidente)}` : ''}, com a seguinte ordem de trabalhos:`,
        en: 'Company and union representatives met on the stated date with the following agenda:',
        keepWithNext: true,
      });
    } else {
      const total = Number(v.totalTrabalhadores);
      const pres = Number(v.numeroPresentes);
      blocks.push({
        type: 'paragraph',
        id: 'abertura',
        text: `Aos ${dateLong(v.data)}${hora}${local}, reuniu-se a assembleia geral dos trabalhadores ${empresa === BLANK ? 'da Empresa' : `de ${empresa}`}${str(v.convocadaPor) ? `, convocada por ${str(v.convocadaPor)}` : ''}, ${nosTermos('rhpReunioesSindicais')}. ${Number.isFinite(pres) && pres > 0 ? `Estiveram presentes ${pres}${Number.isFinite(total) && total > 0 ? ` dos ${total}` : ''} trabalhadores, conforme a lista de presenças anexa` : 'Os presentes constam da lista de presenças anexa'}${str(v.presidente) ? `, tendo presidido ${str(v.presidente)}` : ''}${str(v.secretario) ? ` e secretariado ${str(v.secretario)}` : ''}. A ordem de trabalhos foi a seguinte:`,
        en: 'The general meeting of employees met with the attendance stated and the following agenda:',
        keepWithNext: true,
      });
    }
    blocks.push({ type: 'list', style: 'numeric', items: ordem.length ? ordem.map((p) => `${p.replace(/[.;]$/, '')}.`) : [BLANK] });
    blocks.push({ type: 'paragraph', id: 'deliberacoesIntro', text: tipo === 'empresa' ? 'Discutidos os pontos da ordem de trabalhos, ficou registado o seguinte:' : 'Discutidos os pontos da ordem de trabalhos, a assembleia deliberou o seguinte:', en: 'After discussion, the following was recorded:', keepWithNext: true });
    const items: ClauseItem[] = (delib.length ? delib : [{}]).map((r, i) => {
      const disc = str(r.discussao).replace(/\.$/, '');
      const dl = str(r.deliberacao).replace(/\.$/, '');
      const vt = str(r.votos).replace(/\.$/, '');
      return {
        id: `ponto-${i + 1}`,
        heading: ordem[i] || `Ponto ${i + 1}`,
        text: [disc ? `${disc}.` : '', dl ? `${tipo === 'empresa' ? 'Ficou acordado' : 'Deliberação'}: ${dl}.` : BLANK, vt ? `Votação: ${vt}.` : ''].filter(Boolean).join(' '),
        en: `Item ${i + 1}: discussion and outcome.`,
      };
    });
    blocks.push({ type: 'numberedClauses', style: 'numeric', items });
    blocks.push({
      type: 'paragraph',
      id: 'encerramento',
      text: `Nada mais havendo a tratar, a reunião foi encerrada${str(v.horaFim) ? ` pelas ${str(v.horaFim)}` : ''}, tendo-se lavrado a presente acta que, depois de lida e aprovada, vai ser assinada ${tipo === 'empresa' ? 'pelos representantes das partes' : 'por quem presidiu e por quem secretariou'}.`,
      en: 'The meeting closed; these minutes, read and approved, are signed as stated.',
      keepWithNext: true,
    });
    if (tipo === 'empresa') {
      blocks.push({
        type: 'signatures',
        columns: [
          { role: 'Pela Empresa', name: str(emp[0]?.nome) || undefined, detail: str(emp[0]?.cargo) || undefined },
          { role: 'Pelo Órgão Sindical', name: str(sind[0]?.nome) || undefined, detail: str(sind[0]?.cargo) || undefined },
        ],
      });
    } else {
      blocks.push({ type: 'signatures', columns: [{ role: 'Presidiu', name: str(v.presidente) || undefined }, { role: 'Secretariou', name: str(v.secretario) || undefined }] });
    }
    return blocks;
  },
});
