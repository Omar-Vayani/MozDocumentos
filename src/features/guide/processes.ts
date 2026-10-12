// Processes: ordered documents with deadlines computed from a start date.
// All durations come from src/legal/mz-legal.ts.

import type { L10n, LegalSnapshot } from '@/documents/model';
import type { LegalRefId } from '@/legal/mz-legal';
import { addDays, addWorkingDays } from '@/lib/format';

export type StepDate = { date: string; kind: 'on' | 'by' | 'from' };

export type ProcessStep = {
  id: string;
  /** Document to create for this step (absent for waiting periods). */
  templateId?: string;
  title: L10n;
  description: L10n;
  optional?: boolean;
  date?: (start: string, legal: LegalSnapshot) => StepDate | null;
  /** Values to pre-fill in this step's document, from the start date. */
  prefill?: (start: string) => Record<string, unknown>;
  legalRef?: LegalRefId;
};

export type ProcessDef = {
  id: string;
  title: L10n;
  summary: L10n;
  startLabel: L10n;
  steps: ProcessStep[];
  legalRefs: LegalRefId[];
};

const l = (pt: string, en: string): L10n => ({ pt, en });

/** Shared values that travel between documents of one case. */
export function isSharedKey(k: string): boolean {
  return (
    k.startsWith('trabalhador') ||
    ['processoNumero', 'dataNotaCulpa', 'dataAudicao', 'dataFimContrato', 'empresaNome', 'orgaoSindical'].includes(k)
  );
}

// Disciplinary timeline, counted from the delivery of the nota de culpa.
function respostaAte(start: string, legal: LegalSnapshot) {
  return addDays(start, legal.value<number>('notaCulpaPrazoResposta'));
}
function diligenciasAte(start: string, legal: LegalSnapshot) {
  return addDays(respostaAte(start, legal), legal.value<{ diligenciasDias: number }>('procedimentoDisciplinar').diligenciasDias);
}
function parecerAte(start: string, legal: LegalSnapshot) {
  return addWorkingDays(diligenciasAte(start, legal), legal.value<{ parecerSindicalDiasUteis: number }>('procedimentoDisciplinar').parecerSindicalDiasUteis);
}

export const PROCESSES: ProcessDef[] = [
  {
    id: 'despedimento-justa-causa',
    title: l('Despedir com justa causa', 'Dismiss with just cause'),
    summary: l(
      'Processo disciplinar completo, da nota de culpa à decisão. Os prazos contam a partir da entrega da nota de culpa.',
      'Full disciplinary procedure, from the charge to the decision. Deadlines count from delivery of the charge.',
    ),
    startLabel: l('Data de entrega da nota de culpa', 'Date the charge is delivered'),
    legalRefs: ['procedimentoDisciplinar', 'notaCulpaPrazoEmissao', 'notaCulpaPrazoResposta', 'decisaoDisciplinarPrazo', 'prescricaoInfraccao'],
    steps: [
      {
        id: 'nota',
        templateId: 'nota-de-culpa',
        title: l('Nota de culpa', 'Written charge'),
        description: l(
          'Descreva os factos com tempo, lugar e modo. Entregue ao trabalhador e ao comité sindical, dentro do prazo contado desde que a empresa soube dos factos.',
          'Describe the facts with time, place and manner. Deliver to the employee and the union committee, within the deadline counted from when the company learned of the facts.',
        ),
        date: (s) => ({ date: s, kind: 'on' }),
        prefill: (s) => ({ data: s, dataNotaCulpa: s }),
        legalRef: 'notaCulpaPrazoEmissao',
      },
      {
        id: 'suspensao',
        templateId: 'suspensao-preventiva',
        optional: true,
        title: l('Suspensão preventiva (se necessário)', 'Preventive suspension (if needed)'),
        description: l('Com a nota de culpa, se a presença do trabalhador puder prejudicar o processo. Sem perda de remuneração.', 'With the charge, if the employee’s presence could harm the procedure. On full pay.'),
        date: (s) => ({ date: s, kind: 'on' }),
        prefill: (s) => ({ data: s, dataNotaCulpa: s }),
        legalRef: 'suspensaoPreventiva',
      },
      {
        id: 'resposta',
        title: l('Prazo de resposta do trabalhador', 'Employee’s reply period'),
        description: l('O trabalhador pode responder por escrito, juntar documentos e pedir para ser ouvido.', 'The employee may reply in writing, attach documents and ask to be heard.'),
        date: (s, legal) => ({ date: respostaAte(s, legal), kind: 'by' }),
        legalRef: 'notaCulpaPrazoResposta',
      },
      {
        id: 'audicao',
        templateId: 'convocatoria-audicao',
        title: l('Audição e diligências de prova', 'Hearing and evidence'),
        description: l('Se o trabalhador pediu, ouça-o e realize as diligências de prova requeridas.', 'If requested, hear the employee and gather the evidence asked for.'),
        date: (s, legal) => ({ date: diligenciasAte(s, legal), kind: 'by' }),
        prefill: (s) => ({ dataNotaCulpa: s }),
        legalRef: 'procedimentoDisciplinar',
      },
      {
        id: 'parecer',
        title: l('Parecer do comité sindical', 'Union committee opinion'),
        description: l(
          'O processo é enviado ao comité sindical (ou, se não existir, ao sindicato do ramo), que dá o seu parecer em dias úteis.',
          'The file is sent to the union committee (or, if none, the sector union), which gives its opinion within working days.',
        ),
        date: (s, legal) => ({ date: parecerAte(s, legal), kind: 'by' }),
        legalRef: 'procedimentoDisciplinar',
      },
      {
        id: 'decisao',
        templateId: 'decisao-disciplinar',
        title: l('Decisão disciplinar', 'Disciplinary decision'),
        description: l(
          'Decisão escrita e fundamentada, com as provas e os factos provados, comunicada ao trabalhador e ao órgão sindical. O prazo conta do fim do prazo do parecer: se não houve diligências de prova, pode terminar mais cedo.',
          'Written, reasoned decision listing the evidence and facts proven, sent to the employee and the union. The deadline runs from the end of the opinion period: without evidence-gathering it may end earlier.',
        ),
        date: (s, legal) => ({ date: addDays(parecerAte(s, legal), legal.value<{ decisaoDias: number }>('decisaoDisciplinarPrazo').decisaoDias), kind: 'by' }),
        prefill: (s) => ({ dataNotaCulpa: s }),
        legalRef: 'decisaoDisciplinarPrazo',
      },
      {
        id: 'certificado',
        templateId: 'certificado-de-trabalho',
        title: l('Certificado de trabalho', 'Certificate of employment'),
        description: l('Se houver despedimento, entregue o certificado de trabalho e acerte as contas finais.', 'If dismissed, issue the certificate and settle final pay.'),
        legalRef: 'certificadoTrabalho',
      },
    ],
  },
  {
    id: 'fim-contrato-prazo',
    title: l('Terminar um contrato a prazo', 'End a fixed-term contract'),
    summary: l('Aviso de não renovação com a antecedência legal, certificado e contas finais.', 'Non-renewal notice with the legal advance notice, certificate and final pay.'),
    startLabel: l('Data de fim do contrato', 'Contract end date'),
    legalRefs: ['naoRenovacaoAviso', 'certificadoTrabalho'],
    steps: [
      {
        id: 'aviso',
        templateId: 'nao-renovacao',
        title: l('Comunicação de não renovação', 'Non-renewal notice'),
        description: l('Entregue com a antecedência mínima — maior se o contrato durou mais de um ano.', 'Deliver with the minimum notice — longer if the contract lasted over a year.'),
        date: (s, legal) => ({ date: addDays(s, -legal.value<{ mais1Ano: number }>('naoRenovacaoAviso').mais1Ano), kind: 'by' }),
        prefill: (s) => ({ dataFimContrato: s }),
        legalRef: 'naoRenovacaoAviso',
      },
      {
        id: 'fim',
        title: l('Fim do contrato', 'Contract ends'),
        description: l('O contrato caduca nesta data.', 'The contract expires on this date.'),
        date: (s) => ({ date: s, kind: 'on' }),
      },
      {
        id: 'certificado',
        templateId: 'certificado-de-trabalho',
        title: l('Certificado de trabalho', 'Certificate of employment'),
        description: l('Obrigatório em qualquer cessação do contrato.', 'Required on any termination.'),
        date: (s) => ({ date: s, kind: 'on' }),
        legalRef: 'certificadoTrabalho',
      },
      {
        id: 'quitacao',
        templateId: 'declaracao-de-quitacao',
        optional: true,
        title: l('Declaração de quitação', 'Final settlement release'),
        description: l('O trabalhador declara ter recebido os valores finais.', 'The employee confirms receipt of final amounts.'),
        date: (s) => ({ date: s, kind: 'from' }),
      },
    ],
  },
  {
    id: 'rescisao-trabalhador',
    title: l('Sair do emprego', 'Leave my job'),
    summary: l('Carta com aviso prévio e o que pedir à empresa no fim.', 'Notice letter and what to ask the employer at the end.'),
    startLabel: l('Data da carta', 'Letter date'),
    legalRefs: ['avisoPrevioTrabalhador', 'certificadoTrabalho'],
    steps: [
      {
        id: 'carta',
        templateId: 'rescisao-pelo-trabalhador',
        title: l('Carta de rescisão com aviso prévio', 'Resignation letter with notice'),
        description: l('Entregue a carta em duplicado e peça que assinem a cópia com a data de recepção.', 'Hand in two copies and ask them to sign yours with the date received.'),
        date: (s) => ({ date: s, kind: 'on' }),
        prefill: (s) => ({ data: s }),
        legalRef: 'avisoPrevioTrabalhador',
      },
      {
        id: 'ultimo',
        title: l('Último dia de trabalho (aviso mínimo)', 'Last working day (minimum notice)'),
        description: l('Depende da antiguidade e do tipo de contrato. A data exacta é calculada na carta.', 'Depends on seniority and contract type. The exact date is computed in the letter.'),
        date: (s, legal) => ({ date: addDays(s, legal.value<{ ate3Anos: number }>('avisoPrevioTrabalhador').ate3Anos), kind: 'from' }),
      },
      {
        id: 'certificado',
        title: l('Pedir o certificado de trabalho', 'Ask for the certificate of employment'),
        description: l('A empresa é obrigada a entregá-lo.', 'The employer must issue it.'),
        legalRef: 'certificadoTrabalho',
      },
    ],
  },
  {
    id: 'contratar-trabalhador',
    title: l('Contratar um trabalhador', 'Hire an employee'),
    summary: l('Da proposta ao contrato e ao registo do trabalhador.', 'From offer to contract and employee records.'),
    startLabel: l('Data prevista de início', 'Planned start date'),
    legalRefs: ['leiTrabalho', 'periodoProbatorioIndeterminado'],
    steps: [
      {
        id: 'proposta',
        templateId: 'proposta-de-emprego',
        optional: true,
        title: l('Proposta de emprego', 'Job offer'),
        description: l('Opcional: formalize a oferta antes do contrato.', 'Optional: formalise the offer before the contract.'),
      },
      {
        id: 'contrato',
        templateId: 'contrato-indeterminado',
        title: l('Contrato de trabalho', 'Employment contract'),
        description: l('Assinado em dois exemplares antes do início.', 'Signed in two copies before the start date.'),
        date: (s) => ({ date: s, kind: 'by' }),
      },
      {
        id: 'ficha',
        templateId: 'ficha-de-admissao',
        title: l('Ficha de admissão', 'Employee record form'),
        description: l('Recolha NUIT, n.º de INSS, banco e contacto de emergência. Inscreva o trabalhador no INSS.', 'Collect NUIT, INSS number, bank and emergency contact. Register the employee with INSS.'),
        date: (s) => ({ date: s, kind: 'on' }),
      },
      {
        id: 'funcoes',
        templateId: 'descricao-de-funcoes',
        optional: true,
        title: l('Descrição de funções', 'Job description'),
        description: l('Opcional: entregue ao trabalhador com o contrato.', 'Optional: give it to the employee with the contract.'),
      },
    ],
  },
];

export const processById = (id: string) => PROCESSES.find((p) => p.id === id);
