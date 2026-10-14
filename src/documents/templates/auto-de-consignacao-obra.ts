// Auto de consignação da obra: the owner hands the site over to the
// contractor; the contract period usually runs from this date.

import { addDays } from '@/lib/format';
import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { BLANK, cite, dateLong, l, money, splitLines } from './_shared';
import { int, semPonto, str, valorTexto } from './_contratos';
import { assinaturasObra, dataPorExtenso, fechoAuto, hora, obraFields, obraTexto, partesObraFields, presentesItems, signatureRows } from './_construcao';

const DOCUMENTOS = [
  'Projecto de arquitectura e de especialidades aprovado',
  'Cópia da licença de construção',
  'Caderno de encargos',
  'Mapa de quantidades e preços',
].join('\n');

export default defineTemplate({
  id: 'auto-de-consignacao-obra',
  family: 'acta',
  sections: [
    { id: 'auto', title: l('Data e local do auto', 'Date and place') },
    { id: 'partes', title: l('Presentes', 'Parties present') },
    { id: 'obra', title: l('Obra e contrato', 'Works and contract') },
    { id: 'consignacao', title: l('Consignação', 'Handover') },
  ],
  fields: [
    { name: 'data', type: 'date', section: 'auto', width: 'half', required: true, label: l('Data da consignação', 'Handover date'), default: (c) => c.today },
    { name: 'horaAuto', type: 'text', section: 'auto', width: 'half', label: l('Hora', 'Time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    { name: 'local', type: 'text', section: 'auto', width: 'half', label: l('Cidade (para a data)', 'City (for the date)'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },

    ...partesObraFields('partes'),

    ...obraFields('obra', { licenca: true }),
    { name: 'valorContrato', type: 'money', section: 'obra', width: 'half', label: l('Valor do contrato', 'Contract value') },
    { name: 'prazoContratual', type: 'number', section: 'obra', width: 'half', required: true, min: 1, max: 2000, label: l('Prazo de execução (dias)', 'Completion time (days)') },
    {
      name: 'inicioPrazo',
      type: 'radio',
      section: 'obra',
      label: l('O prazo conta a partir de', 'The period runs from'),
      options: [
        { value: 'auto', label: l('Data deste auto', 'The date of this record') },
        { value: 'outra', label: l('Outra data', 'Another date') },
      ],
      default: 'auto',
    },
    { name: 'dataInicioPrazo', type: 'date', section: 'obra', width: 'half', label: l('Início do prazo', 'Start of the period'), showIf: (v) => v.inicioPrazo === 'outra' },

    {
      name: 'condicoesLocal',
      type: 'radio',
      section: 'consignacao',
      label: l('Estado do local', 'Condition of the site'),
      options: [
        { value: 'livre', label: l('Livre de pessoas e bens', 'Clear of people and property') },
        { value: 'condicionantes', label: l('Com condicionantes', 'With constraints') },
      ],
      default: 'livre',
    },
    { name: 'condicionantes', type: 'textarea', section: 'consignacao', rows: 2, label: l('Condicionantes do local', 'Site constraints'), showIf: (v) => v.condicoesLocal === 'condicionantes', placeholder: l('Ex.: árvore a abater pelo dono da obra; cabo eléctrico aéreo a desviar pela EDM', 'E.g. tree to be felled by the owner; overhead cable to be moved') },
    { name: 'referencias', type: 'textarea', section: 'consignacao', rows: 2, label: l('Implantação e referências verificadas (opcional)', 'Setting-out and references checked (optional)'), placeholder: l('Ex.: marcos do talhão, alinhamento da via e cota de soleira indicados na planta de implantação', 'E.g. plot beacons, road alignment and floor level on the site plan') },
    { name: 'documentosEntregues', type: 'textarea', section: 'consignacao', rows: 4, default: DOCUMENTOS, label: l('Documentos entregues ao empreiteiro (um por linha)', 'Documents handed to the contractor (one per line)') },
    {
      name: 'licencaSituacao',
      type: 'radio',
      section: 'consignacao',
      label: l('Licença de construção', 'Building permit'),
      options: [
        { value: 'emitida', label: l('Emitida', 'Issued') },
        { value: 'tramitacao', label: l('Em tramitação', 'Pending') },
        { value: 'naoAplica', label: l('Obra dispensada de licença', 'Works exempt from permit') },
      ],
      default: 'emitida',
    },
    { name: 'licencaEntidade', type: 'text', section: 'consignacao', width: 'half', label: l('Emitida por', 'Issued by'), placeholder: l('Ex.: Conselho Municipal da Matola', 'E.g. Matola Municipal Council'), showIf: (v) => v.licencaSituacao === 'emitida' },
    { name: 'licencaData', type: 'date', section: 'consignacao', width: 'half', label: l('Data da licença', 'Permit date'), showIf: (v) => v.licencaSituacao === 'emitida' },
    { name: 'estaleiro', type: 'textarea', section: 'consignacao', rows: 2, label: l('Estaleiro, água e energia (opcional)', 'Site facilities, water and power (optional)'), placeholder: l('Ex.: o dono da obra disponibiliza ponto de água; a energia é fornecida pelo gerador do empreiteiro', 'E.g. the owner provides a water point; power comes from the contractor’s generator') },
    { name: 'reservas', type: 'textarea', section: 'consignacao', rows: 2, label: l('Reservas das partes (opcional)', 'Reservations (optional)') },
  ],

  computed: (v, { today }) => {
    const inicio = v.inicioPrazo === 'outra' ? str(v.dataInicioPrazo) : str(v.data) || today;
    const prazo = int(v.prazoContratual);
    return { inicio, prazo, fim: inicio && prazo ? addDays(inicio, prazo) : '' };
  },

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.donoNome)) w.push({ level: 'error', field: 'donoNome', message: l('Indique o dono da obra.', 'Enter the owner.') });
    if (!str(v.empreiteiroNome)) w.push({ level: 'error', field: 'empreiteiroNome', message: l('Indique o empreiteiro.', 'Enter the contractor.') });
    if (!str(v.empreiteiroAlvara)) {
      w.push({ level: 'warning', field: 'empreiteiroAlvara', message: l(`O empreiteiro deve ter alvará válido da classe adequada ao valor da obra (${cite('alvaraEmpreiteiro')}).`, 'The contractor must hold a valid licence of the right class.') });
    }
    if (v.licencaSituacao === 'tramitacao') {
      w.push({
        level: 'warning',
        field: 'licencaSituacao',
        message: l(
          `As obras sujeitas a licença não podem começar sem a licença municipal. Começar sem licença pode levar a embargo, multa e demolição (${cite('obraLicencaPrevia')}).`,
          'Works that need a permit may not start without it. Starting without a permit can lead to a stop order, fines and demolition.',
        ),
      });
    }
    w.push({ level: 'info', message: l('A data deste auto é normalmente o início do prazo do contrato. Cada parte fica com um exemplar assinado.', 'The date of this record usually starts the contract period. Each party keeps a signed copy.') });
    w.push({ level: 'info', message: l(`Nas obras do Estado, use o procedimento e os modelos da entidade contratante (${cite('obrasPublicasRegime')}).`, 'For State works, use the contracting body’s procedure and forms.') });
    return w;
  },

  personName: (v) => v.obraDesignacao,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const docs = splitLines(v.documentosEntregues);
    const pontos: ClauseItem[] = [
      {
        id: 'entrega',
        heading: 'Entrega do local',
        text:
          v.condicoesLocal === 'condicionantes'
            ? `O Dono da Obra entrega ao Empreiteiro, que o recebe, o local destinado à execução da obra, com as seguintes condicionantes: ${semPonto(v.condicionantes) || BLANK}.`
            : 'O Dono da Obra entrega ao Empreiteiro, que o recebe, o local destinado à execução da obra, livre de pessoas e bens, nas condições verificadas por todos os presentes.',
        en: 'The Owner hands the site over to the Contractor, who accepts it.',
      },
    ];
    if (str(v.referencias)) {
      pontos.push({ id: 'referencias', heading: 'Implantação e referências', text: `Foram verificados e aceites os seguintes elementos de implantação: ${semPonto(v.referencias)}.`, en: 'Setting-out references were checked and accepted.' });
    }
    if (docs.length) {
      pontos.push({ id: 'documentos', heading: 'Documentos entregues', text: 'O Empreiteiro declara ter recebido os seguintes elementos:', items: docs.map((d, i) => `${semPonto(d)}${i === docs.length - 1 ? '.' : ';'}`), en: 'The Contractor acknowledges receipt of the listed documents.' });
    }
    pontos.push({
      id: 'licenca',
      heading: 'Licença de construção',
      text:
        v.licencaSituacao === 'tramitacao'
          ? 'O Dono da Obra declara que a licença de construção se encontra em tramitação, não podendo os trabalhos sujeitos a licença iniciar-se antes da sua emissão.'
          : v.licencaSituacao === 'naoAplica'
            ? 'As partes declaram que os trabalhos objecto da empreitada estão dispensados de licença municipal.'
            : `A obra dispõe da licença de construção n.º ${semPonto(v.obraLicenca) || BLANK}${str(v.licencaEntidade) ? `, emitida pelo ${semPonto(v.licencaEntidade).replace(/^(o|pelo)\s+/i, '')}` : ''}${v.licencaData ? ` em ${dateLong(v.licencaData)}` : ''}, que o Empreiteiro mantém no local da obra.`,
      en: 'Building permit status.',
    });
    pontos.push({
      id: 'prazo',
      heading: 'Prazo de execução',
      text: `O prazo de execução de ${c.prazo ? `${c.prazo} ${c.prazo === 1 ? 'dia' : 'dias'}` : `${BLANK} dias`} conta-se a partir de ${dateLong(c.inicio)}${c.fim ? `, terminando em ${dateLong(c.fim)}` : ''}, sem prejuízo das prorrogações previstas no contrato.`,
      en: 'The completion period runs from the date stated.',
    });
    if (str(v.estaleiro)) pontos.push({ id: 'estaleiro', heading: 'Estaleiro, água e energia', text: `${semPonto(v.estaleiro)}.`, en: 'Site facilities, water and power.' });
    pontos.push({
      id: 'reservas',
      heading: 'Reservas',
      text: str(v.reservas) ? `Foram formuladas as seguintes reservas: ${semPonto(v.reservas)}.` : 'Não foram formuladas reservas por nenhuma das partes.',
      en: 'Reservations by the parties.',
    });

    const valor = money(v.valorContrato);
    const contrato = str(v.contratoRef) || v.contratoData
      ? `, objecto do ${semPonto(v.contratoRef).replace(/^./, (s) => s.toLowerCase()) || 'contrato de empreitada'}${v.contratoData ? ` celebrado em ${dateLong(v.contratoData)}` : ''}${valor != null ? `, pelo valor de ${valorTexto(valor)}` : ''}`
      : '';
    const cols = assinaturasObra(v);
    const blocks: Block[] = [
      { type: 'title', text: 'Auto de Consignação da Obra', subtitle: str(v.obraDesignacao) || undefined },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}${str(v.horaAuto) ? `, ${hora(v.horaAuto, 'pelas')}` : ''}, no local da obra de **${obraTexto(v)}**, sito em ${semPonto(v.obraLocal) || BLANK}, estiveram presentes:`,
        en: 'On the date and at the place stated, the following were present:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: presentesItems(v) },
      {
        type: 'paragraph',
        id: 'objectivo',
        text: `com o objectivo de procederem à consignação da obra acima identificada${contrato}, nos termos seguintes:`,
        en: 'in order to hand over the site of the works identified above, as follows:',
      },
      { type: 'numberedClauses', style: 'numeric', items: pontos },
      fechoAuto(cols.length),
      ...signatureRows(cols),
    ];
    return blocks;
  },
});
