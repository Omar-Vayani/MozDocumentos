import { addDays, addMonths, diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import {
  BLANK, cite, dateField, dateLong, employerName, employerSignature, exmo, g, l, localField, refField,
  splitLines, workerFields,
} from './_shared';
import { listaTexto, nExt, recusaBox } from './_contrato-trabalho';

export default defineTemplate({
  id: 'nota-de-culpa',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador acusado', 'Employee charged'), personRole: 'trabalhador' },
    { id: 'factos', title: l('Factos', 'Facts') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    refField(),
    {
      name: 'processoNumero',
      type: 'text',
      section: 'documento',
      width: 'half',
      label: l('N.º do processo disciplinar', 'Disciplinary case number'),
      default: (c) => `PD/${c.today.slice(0, 4)}/001`,
    },
    localField(),
    dateField('data', 'documento', l('Data da nota de culpa', 'Date of the charge')),
    ...workerFields(['nome', 'genero', 'cargo', 'departamento']),
    {
      name: 'dataConhecimento',
      type: 'date',
      section: 'factos',
      width: 'half',
      required: true,
      label: l('Data em que a empresa soube dos factos', 'Date the company learned of the facts'),
      legal: l(
        'A nota de culpa deve ser enviada dentro do prazo legal contado a partir desta data (se o trabalhador estiver de licença de maternidade, paternidade, férias ou doença, o prazo só conta depois do regresso).',
        'The charge must be sent within the legal deadline counted from this date (if the employee is on maternity, paternity, annual or sick leave, it only runs after their return).',
      ),
    },
    {
      name: 'dataInfraccao',
      type: 'date',
      section: 'factos',
      width: 'half',
      required: true,
      label: l('Data dos factos', 'Date of the facts'),
      legal: l('A infracção prescreve se o processo não começar a tempo.', 'The offence lapses if the procedure does not start in time.'),
    },
    {
      name: 'localFactos',
      type: 'text',
      section: 'factos',
      label: l('Local dos factos', 'Where it happened'),
      placeholder: l('Ex.: Armazém da Matola', 'E.g. Matola warehouse'),
    },
    {
      name: 'factos',
      type: 'textarea',
      section: 'factos',
      required: true,
      rows: 7,
      label: l('Descrição dos factos', 'Description of the facts'),
      legal: l('A lei exige uma descrição detalhada dos factos, com o tempo, o lugar e o modo como ocorreram.', 'The law requires a detailed description of the facts, with time, place and manner.'),
      help: l('Escreva um facto por linha. Seja concreto: o que aconteceu, quando, onde e como.', 'One fact per line. Be specific: what happened, when, where and how.'),
    },
    {
      name: 'deveres',
      type: 'textarea',
      section: 'factos',
      rows: 3,
      label: l('Deveres violados (opcional)', 'Duties breached (optional)'),
      placeholder: l('Ex.: dever de assiduidade e pontualidade; dever de obediência', 'E.g. duty of attendance; duty of obedience'),
    },
    {
      name: 'intencaoDespedimento',
      type: 'toggle',
      section: 'opcoes',
      label: l('A empresa pretende aplicar o despedimento', 'The company intends to dismiss'),
      help: l('Inclui a comunicação da intenção de despedimento com justa causa.', 'States the intention to dismiss with just cause.'),
    },
    {
      name: 'suspensao',
      type: 'toggle',
      section: 'opcoes',
      label: l('Suspender preventivamente o trabalhador', 'Preventively suspend the employee'),
      help: l('Sem perda de remuneração, se a presença do trabalhador puder prejudicar o processo.', 'Without loss of pay, if the employee’s presence could harm the procedure.'),
    },
    {
      name: 'orgaoSindical',
      type: 'text',
      section: 'opcoes',
      label: l('Comité sindical (cópia)', 'Union committee (copy)'),
      legal: l(
        'A nota de culpa é remetida ao trabalhador e ao comité sindical da empresa ou, se não existir, ao sindicato do ramo.',
        'The charge goes to the employee and to the company union committee or, if there is none, to the sector union.',
      ),
      default: 'Comité Sindical',
    },
    {
      name: 'testemunhas',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Incluir espaço para testemunhas (se recusar receber)', 'Include witness lines (if receipt is refused)'),
      help: l(
        'Se o trabalhador recusar receber, a recusa é confirmada na própria nota de culpa por dois trabalhadores, de preferência um deles membro do órgão sindical.',
        'If the employee refuses to receive it, two co-workers (preferably one union member) confirm the refusal on the charge itself.',
      ),
    },
  ],

  computed: (v, { legal }) => {
    const resposta = legal.value<number>('notaCulpaPrazoResposta');
    const emissao = legal.value<number>('notaCulpaPrazoEmissao');
    const prescricao = legal.value<{ meses: number }>('prescricaoInfraccao').meses;
    return {
      prazoResposta: resposta,
      limiteEmissao: v.dataConhecimento ? addDays(v.dataConhecimento, emissao) : null,
      limitePrescricao: v.dataInfraccao ? addMonths(v.dataInfraccao, prescricao) : null,
      prazoEmissao: emissao,
    };
  },

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.limiteEmissao && v.data && diffDays(c.limiteEmissao, v.data) > 0) {
      w.push({
        level: 'error',
        field: 'data',
        message: l(
          `A nota de culpa deve ser enviada até ${dateLong(c.limiteEmissao)} (${c.prazoEmissao} dias após a empresa ter conhecimento). O processo pode ser inválido.`,
          `The charge had to be sent by ${c.limiteEmissao} (${c.prazoEmissao} days after the company learned of the facts). The procedure may be invalid.`,
        ),
      });
    }
    if (c.limitePrescricao && v.data && diffDays(c.limitePrescricao, v.data) > 0) {
      w.push({
        level: 'error',
        field: 'dataInfraccao',
        message: l(
          `A infracção pode ter prescrito em ${dateLong(c.limitePrescricao)}.`,
          `The offence may have lapsed on ${c.limitePrescricao}.`,
        ),
      });
    }
    if (splitLines(v.factos).length > 0 && String(v.factos).length < 80) {
      w.push({
        level: 'warning',
        field: 'factos',
        message: l('A descrição dos factos parece curta. Indique quando, onde e como aconteceu.', 'The description looks short. State when, where and how it happened.'),
      });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.trabalhadorGenero;
    const empresa = employerName(ctx);
    const factos = splitLines(v.factos);
    const acusado = g(ge, 'acusado', 'acusada');
    const pessoa = ctx.profile?.kind === 'pessoa';
    const emp = pessoa ? 'da entidade empregadora' : 'da empresa';

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      {
        type: 'recipient',
        salutation: exmo(ge),
        lines: [v.trabalhadorNome || BLANK, [v.trabalhadorCargo, v.trabalhadorDepartamento].filter(Boolean).join(' — ')],
      },
      { type: 'subject', text: `Nota de culpa — Processo disciplinar n.º ${v.processoNumero || BLANK}` },
      { type: 'salutation', text: `${exmo(ge)},` },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `Nos termos do ${cite('notaCulpaPrazoEmissao')} (Lei do Trabalho), ${pessoa ? '' : 'a '}**${empresa}** comunica a V. Ex.ª que lhe foi instaurado o processo disciplinar acima referido e que é ${acusado} dos factos seguintes:`,
        en: `Under the Labour Law, ${empresa} informs you that the above disciplinary case has been opened against you and that you are charged with the following facts:`,
      },
      {
        type: 'list',
        style: 'numeric',
        items: factos.length ? factos : [BLANK],
      },
    ];
    if (v.dataInfraccao || v.localFactos) {
      blocks.push({
        type: 'paragraph',
        id: 'tempoLugar',
        text: `Os factos ocorreram ${v.dataInfraccao ? `em ${dateLong(v.dataInfraccao)}` : ''}${v.localFactos ? `${v.dataInfraccao ? ', ' : ''}no seguinte local: ${String(v.localFactos).trim().replace(/\.$/, '')}` : ''}.`,
        en: `The facts occurred ${v.dataInfraccao ? `on ${v.dataInfraccao}` : ''}${v.localFactos ? ` at ${v.localFactos}` : ''}.`,
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'deveres',
      text: v.deveres
        ? `Tais factos, a provarem-se, constituem infracção disciplinar por violação dos seguintes deveres: ${listaTexto(v.deveres)}.`
        : `Tais factos, a provarem-se, constituem infracção disciplinar por violação dos deveres ${g(ge, 'do trabalhador', 'da trabalhadora')} previstos na Lei do Trabalho${pessoa ? '' : ' e no regulamento interno da empresa'}.`,
      en: 'If proven, these facts constitute a disciplinary offence for breach of the employee’s duties.',
    });
    if (v.intencaoDespedimento) {
      blocks.push({
        type: 'paragraph',
        id: 'intencao',
        text: `Pela gravidade dos factos descritos e das suas consequências, que tornam imediata e praticamente impossível a subsistência da relação de trabalho, comunica-se a intenção ${emp} de aplicar a sanção de **despedimento**.`,
        en: 'Given the seriousness of the facts, which make continuing the employment relationship impossible, the company states its intention to apply dismissal with just cause.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'defesa',
      text: `V. Ex.ª dispõe do prazo de **${nExt(ctx.computed.prazoResposta)} dias** de calendário, a contar da data de recepção desta nota de culpa, para responder por escrito, juntar documentos, indicar testemunhas, requerer as diligências de prova que entender e pedir para ser ${g(ge, 'ouvido', 'ouvida')} em audição. O processo pode ser consultado nas instalações ${emp}, em horário normal de expediente. A falta de resposta no prazo indicado não impede o prosseguimento do processo.`,
      en: `You have ${ctx.computed.prazoResposta} calendar days from receipt of this charge to reply in writing, attach documents, name witnesses, request evidence and ask to be heard. The case file may be consulted at the employer’s premises during office hours. Failure to reply in time does not stop the procedure.`,
    });
    if (v.suspensao) {
      blocks.push({
        type: 'paragraph',
        id: 'suspensao',
        text: `Mais se comunica que, nos termos do ${cite('suspensaoPreventiva')}, V. Ex.ª fica ${g(ge, 'suspenso', 'suspensa')} preventivamente a partir da recepção desta nota de culpa, **sem perda de remuneração**, até à decisão final do processo.`,
        en: 'You are also preventively suspended from receipt of this charge, without loss of pay, until the final decision.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'copia', text: `Cópia: ${v.orgaoSindical || 'Comité Sindical'}.`, size: 'small', align: 'left' },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx)] },
      {
        type: 'acknowledgement',
        text: 'Recebi o original desta nota de culpa em ___/___/______, às ____:____ horas.',
        signer: g(ge, 'O Trabalhador', 'A Trabalhadora'),
      },
    );
    if (v.testemunhas) blocks.push(recusaBox(`Em caso de recusa: ${g(ge, 'o trabalhador', 'a trabalhadora')} recusou receber a presente nota de culpa em ___/___/______, às ____:____ horas, o que os trabalhadores abaixo assinados confirmam, nos termos do ${cite('notaCulpaPrazoEmissao')}.`, 'Testemunha (órgão sindical)'));
    return blocks;
  },
});
