// Desistência de queixa: the complainant withdraws the complaint in a case for
// an offence that depends on a complaint (semi-public) or on a private
// accusation. Filed with the Ministério Público or the judge.

import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, papel } from './_advocacia';
import { applicantDesc, applicantFields, faseValue, nosAutos, optionalLawyerFields, partySignature, penalAddressee, penalCaseFields, str, viaMandatario, keepTail } from './_processo-penal';

const MOTIVO_OPTIONS = [
  { value: 'nenhum', label: l('Não indicar motivo', 'No reason stated') },
  { value: 'ressarcido', label: l('Fui indemnizado pelos prejuízos', 'I was compensated') },
  { value: 'acordo', label: l('Chegámos a acordo', 'We reached an agreement') },
  { value: 'reconciliacao', label: l('Reconciliação (família ou vizinhos)', 'Reconciliation') },
  { value: 'outro', label: l('Outro (escrever)', 'Other (write it)') },
];

function motivoTexto(v: Values): string {
  switch (v.motivo) {
    case 'ressarcido':
      return `por ter sido ${papel(v, 'queixoso', 'integralmente ressarcido', 'integralmente ressarcida')} dos prejuízos sofridos`;
    case 'acordo':
      return `por ter chegado a acordo com ${v.arguidoGenero === 'F' ? 'a arguida' : 'o arguido'}${v.dataAcordo ? ` em ${dateLong(v.dataAcordo)}` : ''}`;
    case 'reconciliacao':
      return 'por as partes se terem reconciliado';
    case 'outro':
      return str(v.motivoLivre).replace(/[.;]$/, '');
    default:
      return '';
  }
}

export default defineTemplate({
  id: 'desistencia-de-queixa',
  family: 'peca',
  official: (v) => (v.fase === 'mp' ? 'estado' : 'tribunal'),
  letterhead: false,
  sections: [
    { id: 'processo', title: l('Processo', 'Case') },
    { id: 'queixoso', title: l('Queixoso (quem desiste)', 'Complainant'), personRole: 'cliente' },
    { id: 'desistencia', title: l('A desistência', 'The withdrawal') },
    { id: 'advogado', title: l('Advogado (opcional)', 'Lawyer (optional)') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...penalCaseFields('processo', { processoRequired: false }),
    ...applicantFields('queixoso', 'queixoso'),
    { name: 'arguidoNome', type: 'text', section: 'desistencia', width: 'half', required: true, label: l('Contra quem era a queixa', 'Against whom'), personKey: 'nome' },
    { name: 'arguidoGenero', type: 'radio', section: 'desistencia', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'dataQueixa', type: 'date', section: 'desistencia', width: 'half', label: l('Data da queixa (opcional)', 'Date of the complaint (optional)') },
    { name: 'crimeNome', type: 'text', section: 'desistencia', width: 'half', label: l('Crime (opcional)', 'Offence (optional)'), placeholder: l('Ex.: ofensas corporais simples; injúria', 'E.g. simple assault; insult') },
    { name: 'motivo', type: 'select', section: 'desistencia', label: l('Motivo', 'Reason'), options: MOTIVO_OPTIONS, default: 'nenhum' },
    { name: 'dataAcordo', type: 'date', section: 'desistencia', width: 'half', label: l('Data do acordo (opcional)', 'Date of the agreement (optional)'), showIf: (v) => v.motivo === 'acordo' },
    { name: 'motivoLivre', type: 'text', section: 'desistencia', label: l('Motivo', 'Reason'), showIf: (v) => v.motivo === 'outro' },
    { name: 'desistePedidoCivil', type: 'toggle', section: 'desistencia', label: l('Desistir também do pedido de indemnização civil', 'Also withdraw the civil damages claim'), help: l('Só se já tiver apresentado pedido de indemnização e não quiser continuar a pedi-la.', 'Only if you filed a damages claim and no longer want it.') },
    ...optionalLawyerFields('advogado', l('O advogado precisa de procuração com poderes especiais para desistir.', 'The lawyer needs special powers to withdraw.')),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'warning',
        message: l(
          `Só se pode desistir nos crimes que dependem de queixa ou de acusação particular, até à sentença em primeira instância e se o arguido não se opuser. Depois de desistir, não pode voltar a apresentar queixa pelos mesmos factos. Nos crimes públicos o processo continua (${cite('ppDesistenciaQueixa')}; confirme).`,
          'Withdrawal is only possible for offences that depend on a complaint or private accusation, before the first-instance judgment and if the accused does not object. You cannot complain again for the same facts. Public crimes continue.',
        ),
      },
      {
        level: 'info',
        message: l(
          'Leve o documento pessoalmente com o seu documento de identificação, ou reconheça a assinatura no notário: a autoridade tem de confirmar que a desistência é sua e livre.',
          'Hand it in personally with your ID, or have the signature certified: the authority must confirm the withdrawal is yours and voluntary.',
        ),
      },
    ];
    if (v.viaAdvogado) w.push({ level: 'info', field: 'viaAdvogado', message: l('O advogado só pode desistir com poderes especiais na procuração.', 'The lawyer can only withdraw with special powers.') });
    return w;
  },

  personName: (v) => v.queixosoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v);
    const OQ = papel(v, 'queixoso', 'O queixoso', 'A queixosa');
    const arguidoF = v.arguidoGenero === 'F';
    const arguido = `**${(str(v.arguidoNome) || '____________________').toLocaleUpperCase('pt')}**`;
    const crime = str(v.crimeNome);
    const motivo = motivoTexto(v);
    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: fase !== 'mp' ? str(v.seccao) || undefined : undefined, addressee: penalAddressee(v, fase) },
      {
        type: 'paragraph',
        id: 'queixoso',
        text: `${applicantDesc(v, 'queixoso', { docBlank: true })}, ${papel(v, 'queixoso', 'queixoso', 'queixosa')} ${nosAutos(v)}, em que é ${arguidoF ? 'arguida' : 'arguido'} ${arguido}, vem${viaMandatario(v, true)} declarar que`,
        en: 'The complainant states that he or she',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: '**DESISTE DA QUEIXA**', en: 'WITHDRAWS THE COMPLAINT' },
      {
        type: 'paragraph',
        id: 'objecto',
        text: `apresentada${v.dataQueixa ? ` em ${dateLong(v.dataQueixa)}` : ''} contra ${arguidoF ? 'a referida arguida' : 'o referido arguido'}${crime ? `, pelos factos susceptíveis de integrar o crime de ${crime}` : ''}${motivo ? `, ${motivo}` : ''}.`,
        en: 'filed against the accused, for the reason stated.',
      },
      {
        type: 'paragraph',
        id: 'livre',
        text: `${OQ} declara que a presente desistência é livre e esclarecida e que não foi ${papel(v, 'queixoso', 'coagido', 'coagida')} a apresentá-la.`,
        en: 'The complainant declares that the withdrawal is free and informed.',
      },
    ];
    if (v.desistePedidoCivil) {
      blocks.push({
        type: 'paragraph',
        id: 'civil',
        text: `${OQ} desiste igualmente do pedido de indemnização civil deduzido nos autos.`,
        en: 'The complainant also withdraws the civil damages claim.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, requer a V. Ex.ª se digne ${fase === 'mp' ? 'aceitar a presente desistência e determinar o arquivamento dos autos' : `homologar a presente desistência, ${arguidoF ? 'ouvida a arguida' : 'ouvido o arguido'}, e declarar extinto o procedimento criminal`}.`,
        en: 'The complainant asks that the withdrawal be accepted and the proceedings closed.',
      },
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [partySignature(v, 'queixoso', papel(v, 'queixoso', 'O Queixoso', 'A Queixosa'))] },
    );
    return keepTail(blocks, 'pedido');
  },
});
