import type { LegalRefId } from '@/legal/mz-legal';
import { addDays, addMonths, diffDays } from '@/lib/format';
import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type FieldDef, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, splitLines, workerFields, workerSignature } from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

const fromPessoa = (f: FieldDef, get: (p: Profile) => unknown): FieldDef => ({
  ...f,
  default: (c) => (c.profile?.kind === 'pessoa' ? get(c.profile) ?? '' : f.default ?? ''),
});

const [fNome, fGenero, fCargo, fDepartamento, fDataAdmissao, fMorada, fTelefone] = workerFields([
  'nome', 'genero', 'cargo', 'departamento', 'dataAdmissao', 'morada', 'telefone',
]);

export default defineTemplate({
  id: 'rescisao-pelo-trabalhador',
  letterhead: false,
  sections: [
    { id: 'trabalhador', title: l('Os seus dados', 'Your details'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Empresa', 'Employer') },
    { id: 'documento', title: l('Contrato e aviso prévio', 'Contract and notice') },
    { id: 'pedidos', title: l('Pedidos', 'Requests') },
  ],
  fields: [
    fromPessoa(fNome, (p) => p.nome),
    fGenero,
    fCargo,
    fDepartamento,
    fromPessoa(fMorada, (p) => addressLine(p)),
    fTelefone,
    {
      name: 'empresaNome',
      type: 'text',
      section: 'empresa',
      required: true,
      label: l('Nome da empresa (entidade empregadora)', 'Employer name'),
      default: (c) => (c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : ''),
    },
    {
      name: 'destinatarioAtencao',
      type: 'text',
      section: 'empresa',
      label: l('Ao cuidado de (opcional)', 'For the attention of (optional)'),
      placeholder: l('Ex.: Director de Recursos Humanos', 'E.g. Human Resources Director'),
    },
    {
      name: 'tipoContrato',
      type: 'radio',
      section: 'documento',
      label: l('Tipo de contrato', 'Contract type'),
      default: 'indeterminado',
      options: [
        { value: 'indeterminado', label: l('Sem data de fim (por tempo indeterminado)', 'Permanent') },
        { value: 'prazo', label: l('Com data de fim (a prazo certo)', 'Fixed term') },
        { value: 'incerto', label: l('Até terminar uma obra, projecto ou substituição (a prazo incerto)', 'Until a project or replacement ends (open-ended term)') },
      ],
    },
    { ...fDataAdmissao, section: 'documento', required: true, legal: l('O aviso prévio depende da antiguidade.', 'The notice period depends on length of service.') },
    localField(),
    dateField('data', 'documento', l('Data da carta (entrega)', 'Date of the letter (delivery)')),
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'documento',
      width: 'half',
      required: true,
      label: l('Último dia de trabalho', 'Last working day'),
      legal: l('Deve respeitar o aviso prévio mínimo, contado a partir da entrega da carta.', 'Must respect the minimum notice, counted from delivery of the letter.'),
    },
    {
      name: 'motivo',
      type: 'textarea',
      section: 'documento',
      rows: 2,
      label: l('Motivo (opcional)', 'Reason (optional)'),
      help: l('A lei não exige que indique o motivo.', 'The law does not require a reason.'),
    },
    {
      name: 'pedirDispensa',
      type: 'toggle',
      section: 'pedidos',
      label: l('Pedir dispensa do aviso prévio em falta', 'Ask to waive the missing notice'),
      help: l('Use se quiser sair antes do fim do aviso prévio legal.', 'Use if you want to leave before the legal notice ends.'),
    },
    {
      name: 'pedirContas',
      type: 'toggle',
      section: 'pedidos',
      default: true,
      label: l('Pedir o pagamento dos valores finais', 'Request final settlement'),
    },
    {
      name: 'pedirCertificado',
      type: 'toggle',
      section: 'pedidos',
      default: true,
      label: l('Pedir o certificado de trabalho', 'Request the certificate of employment'),
    },
    {
      name: 'passagem',
      type: 'toggle',
      section: 'pedidos',
      default: true,
      label: l('Oferecer a passagem de tarefas e devolução de bens', 'Offer handover and return of property'),
    },
    {
      name: 'agradecimento',
      type: 'toggle',
      section: 'pedidos',
      default: true,
      label: l('Agradecer a oportunidade', 'Thank the employer'),
    },
  ],

  computed: (v, { legal }) => {
    const a = legal.value<{ ate3Anos: number; mais3Anos: number; prazo: number; limiarMeses: number; minimoMeses: number }>('avisoPrevioTrabalhador');
    const ref = v.data || '';
    const admissao = v.trabalhadorDataAdmissao || '';
    const mais3 = Boolean(admissao && ref && diffDays(addMonths(admissao, a.limiarMeses), ref) > 0);
    const menos6Meses = Boolean(admissao && ref && diffDays(addMonths(admissao, a.minimoMeses), ref) <= 0);
    // Open-ended fixed term: the employee gives the notice of art. 46.º, n.º 3 (n.º 6).
    const inc = legal.value<{ ate3Anos: number; mais3Anos: number }>('caducidadePrazoIncertoAviso');
    const aviso =
      v.tipoContrato === 'prazo' ? a.prazo
      : v.tipoContrato === 'incerto' ? (mais3 ? inc.mais3Anos : inc.ate3Anos)
      : mais3 ? a.mais3Anos : a.ate3Anos;
    const dado = v.data && v.dataFimContrato ? diffDays(v.data, v.dataFimContrato) : null;
    return {
      aviso,
      avisoDado: dado,
      fimMinimo: v.data ? addDays(v.data, aviso) : null,
      avisoCumprido: dado != null && dado >= aviso,
      menos6Meses,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.avisoDado != null && c.avisoDado < 0) {
      w.push({ level: 'error', field: 'dataFimContrato', message: l('O último dia de trabalho é anterior à data da carta.', 'The last working day is before the letter date.') });
    } else if (c.avisoDado != null && !c.avisoCumprido) {
      w.push({
        level: 'warning',
        field: 'dataFimContrato',
        message: l(
          `O aviso prévio dado é de ${c.avisoDado} dias, mas a lei exige ${c.aviso} dias (último dia não antes de ${dateLong(c.fimMinimo)}). Sem acordo da empresa, poderá ter de pagar o valor da remuneração correspondente aos dias em falta.`,
          `You are giving ${c.avisoDado} days’ notice but the law requires ${c.aviso} days (last day no earlier than ${c.fimMinimo}). Without the employer’s agreement you may owe pay for the missing days.`,
        ),
      });
    }
    if (c.menos6Meses && v.tipoContrato !== 'prazo') {
      w.push({
        level: 'info',
        field: 'trabalhadorDataAdmissao',
        message: l(
          'Tem menos de seis meses de serviço. Se ainda estiver no período probatório, aplica-se o aviso mais curto desse período.',
          'You have less than six months of service. If you are still on probation, the shorter probation notice applies.',
        ),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const empresa = v.empresaNome || BLANK;
    const funcao = [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(', ');
    const contrato = v.tipoContrato === 'prazo' ? 'a prazo certo' : v.tipoContrato === 'incerto' ? 'a prazo incerto' : 'por tempo indeterminado';
    const avisoRef: LegalRefId = v.tipoContrato === 'incerto' ? 'caducidadePrazoIncertoAviso' : 'avisoPrevioTrabalhador';

    const remetente = [
      `**${v.trabalhadorNome || BLANK}**`,
      funcao,
      v.trabalhadorMorada,
      v.trabalhadorTelefone ? `Tel. ${v.trabalhadorTelefone}` : '',
    ].filter(Boolean);

    const blocks: Block[] = [
      { type: 'paragraph', id: 'remetente', text: remetente.join('\n'), align: 'left', editable: false },
      {
        type: 'recipient',
        salutation: 'Exmos. Senhores',
        lines: [empresa, v.destinatarioAtencao ? `A/C: ${v.destinatarioAtencao}` : ''],
      },
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'subject', text: 'Rescisão do contrato de trabalho com aviso prévio' },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'comunicacao',
        text: `Comunico a V. Ex.ªs a minha decisão de pôr termo, por denúncia com aviso prévio, ao contrato de trabalho ${contrato} que mantenho com a **${empresa}**, ao serviço da qual me encontro desde ${dateLong(v.trabalhadorDataAdmissao)}${v.trabalhadorCargo ? `, com a função de ${v.trabalhadorCargo}` : ''}.`,
        en: `I hereby give notice of my decision to terminate my ${v.tipoContrato === 'indeterminado' || !v.tipoContrato ? 'permanent' : 'fixed-term'} employment contract with ${empresa}, where I have worked since ${v.trabalhadorDataAdmissao || '___'}.`,
      },
      {
        type: 'paragraph',
        id: 'aviso',
        text: c.avisoCumprido
          ? `Em cumprimento do aviso prévio de ${c.aviso} dias, nos termos ${doCite(avisoRef)} (Lei do Trabalho), o meu último dia de trabalho será **${dateLong(v.dataFimContrato)}**.`
          : `O meu último dia de trabalho será **${dateLong(v.dataFimContrato)}**.`,
        en: c.avisoCumprido
          ? `In compliance with the ${c.aviso}-day notice period required by the Labour Law, my last working day will be ${v.dataFimContrato}.`
          : `My last working day will be ${v.dataFimContrato || '___'}.`,
      },
    ];
    if (v.pedirDispensa) {
      blocks.push({
        type: 'paragraph',
        id: 'dispensa',
        text: 'Solicito que, por acordo, me seja dispensado o cumprimento do período de aviso prévio que exceda esta data.',
        en: 'I ask that, by agreement, I be released from any part of the notice period beyond this date.',
      });
    }
    const motivos = splitLines(v.motivo);
    if (motivos.length === 1) {
      blocks.push({
        type: 'paragraph',
        id: 'motivo',
        text: `Esta decisão deve-se ao seguinte: ${motivos[0].replace(/\.$/, '')}.`,
        en: `The reason for this decision is: ${motivos[0]}`,
      });
    } else if (motivos.length > 1) {
      blocks.push(
        { type: 'paragraph', id: 'motivo', text: 'Esta decisão deve-se aos seguintes motivos:', en: 'The reasons for this decision are:' },
        { type: 'list', style: 'bullet', items: motivos },
      );
    }
    if (v.passagem) {
      blocks.push({
        type: 'paragraph',
        id: 'passagem',
        text: 'Até essa data, assegurarei a passagem das tarefas a meu cargo e a devolução dos bens da empresa que se encontram em meu poder.',
        en: 'Until then, I will hand over my duties and return the company property in my possession.',
      });
    }
    if (v.pedirContas || v.pedirCertificado) {
      const partes = [
        v.pedirContas
          ? 'o pagamento, na data da cessação, das importâncias a que tenho direito, designadamente a remuneração até ao último dia de trabalho e as férias vencidas e proporcionais'
          : '',
        v.pedirCertificado ? `a entrega do certificado de trabalho, nos termos ${doCite('certificadoTrabalho')}` : '',
      ].filter(Boolean);
      blocks.push({
        type: 'paragraph',
        id: 'pedidos',
        text: `Solicito ${partes.join(', bem como ')}.`,
        en: `I request ${[v.pedirContas ? 'payment on the termination date of the amounts due to me, namely pay up to my last day and accrued and pro-rata leave' : '', v.pedirCertificado ? 'my certificate of employment' : ''].filter(Boolean).join(', and ')}.`,
      });
    }
    if (v.agradecimento) {
      blocks.push({
        type: 'paragraph',
        id: 'agradecimento',
        text: 'Agradeço a oportunidade e a colaboração recebidas durante o tempo em que trabalhei nessa empresa.',
        en: 'Thank you for the opportunity and support during my time with the company.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      {
        type: 'signatures',
        columns: [
          {
            ...workerSignature(v),
            image: ctx.profile?.kind === 'pessoa' && ctx.profile.nome && ctx.profile.nome === v.trabalhadorNome ? 'signature' : undefined,
          },
        ],
      },
      {
        type: 'acknowledgement',
        text: `Recebido por ${empresa} em ___/___/______.`,
        signer: 'Assinatura e carimbo',
      },
    );
    return blocks;
  },
});
