import type { LegalRefId } from '@/legal/mz-legal';
import { addDays, addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, g, l, localField, refField,
  workerFields,
} from './_shared';

const doCite = (id: LegalRefId) => {
  const c = cite(id);
  return `${/^arts\./.test(c) ? 'dos' : /^art/.test(c) ? 'do' : 'da'} ${c}`;
};

export default defineTemplate({
  id: 'nao-renovacao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador', 'Employee'), personRole: 'trabalhador' },
    { id: 'contrato', title: l('Contrato', 'Contract') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data', 'documento', l('Data da comunicação (entrega)', 'Date of the notice (delivery)')),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    {
      name: 'dataInicioContrato',
      type: 'date',
      section: 'contrato',
      width: 'half',
      required: true,
      label: l('Data de início do contrato', 'Contract start date'),
      legal: l('A antecedência do aviso depende da duração do contrato.', 'The notice period depends on the contract length.'),
    },
    {
      name: 'dataFimContrato',
      type: 'date',
      section: 'contrato',
      width: 'half',
      required: true,
      label: l('Data de termo do contrato', 'Contract end date'),
    },
    {
      name: 'devolucaoBens',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Pedir a devolução de bens da empresa', 'Ask for company property to be returned'),
    },
    {
      name: 'agradecimento',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Agradecer a colaboração', 'Thank the employee'),
    },
  ],

  computed: (v, { legal }) => {
    const a = legal.value<{ ate1Ano: number; mais1Ano: number; limiarMeses: number; minimoMeses: number }>('naoRenovacaoAviso');
    const inicio = v.dataInicioContrato || '';
    const fim = v.dataFimContrato || '';
    // The end date is the last day of the contract, so a one-year contract ends the day before the anniversary.
    const mais1Ano = Boolean(inicio && fim && diffDays(addMonths(inicio, a.limiarMeses), fim) >= 0);
    const curto = Boolean(inicio && fim && diffDays(addMonths(inicio, a.minimoMeses), fim) < -1);
    const aviso = mais1Ano ? a.mais1Ano : a.ate1Ano;
    const dado = v.data && fim ? diffDays(v.data, fim) : null;
    return {
      aviso,
      avisoDado: dado,
      limiteAviso: fim ? addDays(fim, -aviso) : null,
      avisoCumprido: dado != null && dado >= aviso,
      curto,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.avisoDado != null && c.avisoDado < 0) {
      w.push({ level: 'error', field: 'dataFimContrato', message: l('O contrato já terminou nesta data.', 'The contract has already ended on this date.') });
    } else if (c.avisoDado != null && !c.avisoCumprido) {
      w.push({
        level: 'error',
        field: 'data',
        message: l(
          `Este contrato exige um aviso de ${c.aviso} dias: a comunicação devia ser entregue até ${dateLong(c.limiteAviso)}. Com aviso mais curto, a empresa deve pagar ao trabalhador a remuneração correspondente ao período em falta.`,
          `This contract requires ${c.aviso} days’ notice: it had to be delivered by ${c.limiteAviso}. With shorter notice, the company must pay the employee for the missing period.`,
        ),
      });
    }
    if (v.dataInicioContrato && v.dataFimContrato && diffDays(v.dataInicioContrato, v.dataFimContrato) <= 0) {
      w.push({ level: 'error', field: 'dataFimContrato', message: l('O termo do contrato é anterior ao seu início.', 'The end date is before the start date.') });
    } else if (c.curto) {
      w.push({
        level: 'info',
        field: 'dataFimContrato',
        message: l('Contrato muito curto: confirme se se aplica o aviso de não renovação.', 'Very short contract: check whether the non-renewal notice applies.'),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const { values: v, computed: c } = ctx;
    const ge = v.trabalhadorGenero;
    const empresa = employerName(ctx);
    // An individual employer (personal profile) takes no article and is not "a empresa".
    const pessoa = ctx.profile?.kind === 'pessoa';
    const emp = pessoa ? 'entidade empregadora' : 'empresa';

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(' — ')],
      },
      { type: 'subject', text: 'Comunicação de não renovação do contrato de trabalho a prazo certo' },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'comunicacao',
        text: `${pessoa ? `**${empresa}**` : `A **${empresa}**`} comunica a V. Ex.ª que não pretende renovar o contrato de trabalho a prazo certo celebrado em ${dateLong(v.dataInicioContrato)}, cujo termo ocorre em **${dateLong(v.dataFimContrato)}**.${
          c.avisoCumprido ? ` A presente comunicação é feita com a antecedência prevista ${doCite('naoRenovacaoAviso')} (Lei do Trabalho).` : ''
        }`,
        en: `${empresa} informs you that it will not renew the fixed-term employment contract signed on ${v.dataInicioContrato || '___'}, which ends on ${v.dataFimContrato || '___'}.${c.avisoCumprido ? ' This notice is given with the advance notice required by the Labour Law.' : ''}`,
      },
      {
        type: 'paragraph',
        id: 'caducidade',
        text: `Em consequência, o contrato caduca no seu termo, cessando a relação de trabalho em ${dateLong(v.dataFimContrato)}, que será o último dia de trabalho de V. Ex.ª.`,
        en: `The contract therefore expires at the end of its term, and employment ends on ${v.dataFimContrato || '___'}, your last working day.`,
      },
      {
        type: 'paragraph',
        id: 'contas',
        text: `Na data da cessação, a ${emp} pagará a V. Ex.ª as importâncias que lhe sejam devidas, designadamente a remuneração até essa data e as férias vencidas e não gozadas, bem como as proporcionais ao tempo de serviço prestado, e entregar-lhe-á o certificado de trabalho, nos termos ${doCite('certificadoTrabalho')}.`,
        en: 'On the termination date the company will pay the amounts due to you, namely pay to that date and accrued and pro-rata annual leave, and will issue your certificate of employment.',
      },
    ];
    if (v.devolucaoBens) {
      blocks.push({
        type: 'paragraph',
        id: 'bens',
        text: `Até essa data, V. Ex.ª deve devolver todos os bens, equipamentos, documentos e cartões de acesso da ${emp} que se encontrem em seu poder.`,
        en: 'By that date you must return all company property, equipment, documents and access cards in your possession.',
      });
    }
    if (v.agradecimento) {
      blocks.push({
        type: 'paragraph',
        id: 'agradecimento',
        text: `${pessoa ? 'Agradeço' : 'A empresa agradece'} a colaboração prestada por V. Ex.ª durante a vigência do contrato.`,
        en: 'The company thanks you for your work during the contract.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx)] },
      {
        type: 'acknowledgement',
        text: 'Recebi o original desta comunicação em ___/___/______.',
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    return blocks;
  },
});
