import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, splitLines } from './_shared';
import {
  anexosBlock,
  anexosField,
  autorFields,
  autorSignature,
  autorWarnings,
  daysBetween,
  endDot,
  envioBlock,
  envioField,
  eu,
  isEmpresa,
  lowerFirst,
  opt,
  optLabel,
  reciboBlock,
  reciboField,
  senderBlock,
  str,
} from './_cidadao';

const SERVICOS = [
  opt('internet', 'Internet ou telefone', 'Internet or phone'),
  opt('televisao', 'Televisão por subscrição', 'Pay TV'),
  opt('ginasio', 'Ginásio ou clube', 'Gym or club'),
  opt('seguro', 'Seguro', 'Insurance'),
  opt('escola', 'Escola, colégio, creche ou explicações', 'School, nursery or tutoring'),
  opt('seguranca', 'Segurança privada ou alarme', 'Private security or alarm'),
  opt('assinatura', 'Assinatura (jornal, aplicação, software)', 'Subscription (newspaper, app, software)'),
  opt('outro', 'Outro serviço', 'Other service'),
];
const NOME: Record<string, string> = {
  internet: 'prestação de serviços de internet/telefone',
  televisao: 'televisão por subscrição',
  ginasio: 'utilização do ginásio/clube',
  seguro: 'seguro',
  escola: 'prestação de serviços educativos',
  seguranca: 'prestação de serviços de segurança',
  assinatura: 'assinatura',
  outro: 'prestação de serviços',
};
const FUNDAMENTOS = [
  opt('denuncia', 'Quero terminar (com o aviso prévio do contrato)', 'I want to end it (with the contract notice)'),
  opt('naoRenovacao', 'Não quero renovar no fim do prazo', 'I do not want to renew at the end of the term'),
  opt('incumprimento', 'A empresa não cumpre o contrato', 'The company is in breach'),
];

const servico = (v: Values) => (v.servico === 'outro' ? lowerFirst(str(v.servicoOutro)) || NOME.outro : NOME[String(v.servico)] ?? NOME.outro);

export default defineTemplate({
  id: 'cancelamento-de-contrato',
  sections: [
    { id: 'autor', title: l('Cliente', 'Customer'), personRole: 'outro' },
    { id: 'destinatario', title: l('Empresa', 'Company') },
    { id: 'contrato', title: l('Contrato', 'Contract') },
    { id: 'fim', title: l('Fim do contrato', 'Ending the contract') },
    { id: 'documento', title: l('Local, data e entrega', 'Place, date and delivery') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'morada', 'telefone', 'email'], { empresa: true, required: ['nome'] }),
    { name: 'empresa', type: 'text', section: 'destinatario', required: true, label: l('Empresa', 'Company'), placeholder: l('Ex.: TV Cabo Moçambique, S.A.', 'E.g. the provider') },
    { name: 'empresaAc', type: 'text', section: 'destinatario', label: l('À atenção de (opcional)', 'Attention of (optional)') },
    { name: 'empresaMorada', type: 'text', section: 'destinatario', label: l('Endereço ou email', 'Address or email') },
    { name: 'servico', type: 'select', section: 'contrato', width: 'half', label: l('Serviço', 'Service'), options: SERVICOS, default: 'internet' },
    { name: 'servicoOutro', type: 'text', section: 'contrato', label: l('Que serviço', 'Which service'), showIf: (v) => v.servico === 'outro' },
    { name: 'numeroContrato', type: 'text', section: 'contrato', width: 'half', label: l('Contrato / cliente / apólice n.º', 'Contract / customer / policy no.') },
    { name: 'dataContrato', type: 'date', section: 'contrato', width: 'half', label: l('Data do contrato', 'Contract date') },
    { name: 'beneficiario', type: 'text', section: 'contrato', label: l('Aluno ou beneficiário (opcional)', 'Pupil or beneficiary (optional)'), showIf: (v) => v.servico === 'escola' || v.servico === 'ginasio' || v.servico === 'seguro' },
    { name: 'fundamento', type: 'select', section: 'fim', label: l('Porque termina', 'Why it ends'), options: FUNDAMENTOS, default: 'denuncia' },
    { name: 'avisoPrevio', type: 'number', section: 'fim', width: 'half', min: 0, max: 180, label: l('Aviso prévio do contrato (dias)', 'Contract notice (days)'), help: l('O que o contrato prevê. Vazio se o contrato nada disser.', 'As in the contract. Empty if it says nothing.'), showIf: (v) => v.fundamento === 'denuncia' },
    { name: 'dataEfeito', type: 'date', section: 'fim', width: 'half', label: l('Data em que termina', 'End date'), help: l('Último dia de serviço e de facturação.', 'Last day of service and billing.') },
    { name: 'incumprimento', type: 'textarea', section: 'fim', rows: 4, label: l('Em que a empresa falhou', 'How the company is in breach'), help: l('Um facto por linha, com datas e reclamações já feitas.', 'One fact per line, with dates and earlier complaints.'), showIf: (v) => v.fundamento === 'incumprimento' },
    { name: 'equipamento', type: 'text', section: 'fim', label: l('Equipamento a devolver (opcional)', 'Equipment to return (optional)'), placeholder: l('Ex.: router n.º de série HG8245H-0921 e descodificador', 'E.g. router and decoder') },
    { name: 'debitos', type: 'toggle', section: 'fim', default: true, label: l('Cancelar débitos automáticos e ordens de pagamento', 'Cancel direct debits and standing orders') },
    { name: 'devolucao', type: 'toggle', section: 'fim', default: false, label: l('Pedir devolução de caução ou valores pagos adiantados', 'Ask for the deposit or advance payments back') },
    anexosField('fim', l('Ex.: Cópia do contrato', 'E.g. Copy of the contract')),
    localField('documento'),
    dateField('data'),
    envioField('documento', 'registada'),
    reciboField('documento'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { contacto: true });
    if (!str(v.empresa)) w.push({ level: 'warning', field: 'empresa', message: l('Indique a empresa.', 'State the company.') });
    if (!str(v.numeroContrato)) w.push({ level: 'info', field: 'numeroContrato', message: l('Indique o número de contrato ou de cliente.', 'Give the contract or customer number.') });
    const aviso = Number(v.avisoPrevio) > 0 ? Number(v.avisoPrevio) : 0;
    const d = daysBetween(v.data, v.dataEfeito);
    if (v.fundamento === 'denuncia' && aviso && d != null && d < aviso) {
      w.push({ level: 'warning', field: 'dataEfeito', message: l(`A data de fim fica a ${d} dias desta carta, menos do que o aviso prévio do contrato (${aviso} dias). A empresa pode cobrar o período em falta.`, `The end date is only ${d} days away, less than the ${aviso}-day notice.`) });
    }
    if (v.fundamento === 'incumprimento' && !splitLines(v.incumprimento).length) w.push({ level: 'warning', field: 'incumprimento', message: l('Descreva o incumprimento da empresa.', 'Describe the breach.') });
    w.push({ level: 'info', field: 'fundamento', message: l(`Cláusulas que impeçam o consumidor de terminar o contrato ou imponham penalizações desproporcionadas não valem (${cite('cidClausulasAbusivas')}). Se houver período de fidelização, leia o contrato: pode ser devida uma compensação proporcional.`, 'Terms preventing the consumer from ending the contract or imposing disproportionate penalties are invalid. Check any lock-in period.') });
    if (v.servico === 'escola') w.push({ level: 'info', field: 'servico', message: l('Peça também a declaração de transferência ou de frequência do aluno, se precisar dela para outra escola.', 'Also ask for the transfer certificate if needed.') });
    return w;
  },

  personName: (v) => v.empresa,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresa(ctx);
    const falhas = splitLines(v.incumprimento);
    const fim = v.dataEfeito ? dateLong(v.dataEfeito) : '';
    const contrato = `contrato de ${servico(v)}${str(v.numeroContrato) ? ` n.º ${str(v.numeroContrato)}` : ''}${v.dataContrato ? `, celebrado em ${dateLong(v.dataContrato)}` : ''}${str(v.beneficiario) ? `, relativo a ${str(v.beneficiario)}` : ''}`;
    const quem = empresa ? `a **${profileDisplayName(ctx.profile)}** comunica` : 'comunico';

    let abertura: string;
    let en: string;
    if (v.fundamento === 'naoRenovacao') {
      abertura = `Pela presente, ${quem} a V. Ex.as que ${empresa ? 'não pretende' : 'não pretendo'} renovar o ${contrato}, que cessará assim no termo do prazo em curso${fim ? `, em ${fim}` : ''}.`;
      en = 'I hereby give notice that I do not wish to renew the contract, which will end at the end of the current term.';
    } else if (v.fundamento === 'incumprimento') {
      abertura = `Pela presente, ${quem} a V. Ex.as a resolução do ${contrato}, com efeitos ${fim ? `a partir de ${fim}` : 'imediatos'}, por incumprimento de V. Ex.as, pelos factos seguintes:`;
      en = 'I hereby terminate the contract for your breach, on the following grounds:';
    } else {
      const aviso = Number(v.avisoPrevio) > 0 ? Math.round(Number(v.avisoPrevio)) : 0;
      abertura = `Pela presente, ${quem} a V. Ex.as a denúncia do ${contrato}, ${aviso ? `com o aviso prévio de ${aviso} dias previsto no contrato` : 'com aviso prévio razoável'}, pelo que o contrato cessa${fim ? ` em ${fim}` : ' no fim do período de aviso'}.`;
      en = 'I hereby give notice ending the contract with the agreed notice.';
    }

    const pedidos = [
      'que o serviço deixe de ser prestado e facturado a partir da data de cessação',
      'a emissão da factura final e de declaração de que nada mais é devido',
      v.debitos !== false ? 'o cancelamento de todos os débitos automáticos e ordens de pagamento associados ao contrato a partir dessa data' : '',
      str(v.equipamento) ? `a indicação do local e da data para a devolução do equipamento (${lowerFirst(str(v.equipamento).replace(/\.$/, ''))}), contra recibo` : '',
      v.devolucao ? 'a devolução da caução e de quaisquer valores pagos antecipadamente por períodos posteriores à cessação' : '',
      'a confirmação escrita da cessação do contrato',
    ].filter(Boolean);

    const blocks: Block[] = [
      ...senderBlock(ctx),
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      ...envioBlock(v),
      { type: 'recipient', lines: [str(v.empresa) || BLANK, str(v.empresaAc) ? `A/C: ${str(v.empresaAc)}` : '', str(v.empresaMorada)].filter(Boolean) },
      { type: 'subject', text: `${v.fundamento === 'naoRenovacao' ? 'Não renovação' : v.fundamento === 'incumprimento' ? 'Resolução' : 'Cancelamento'} do contrato${str(v.numeroContrato) ? ` n.º ${str(v.numeroContrato)}` : ''} — ${optLabel(SERVICOS, v.servico) || 'serviços'}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      { type: 'paragraph', id: 'abertura', text: abertura, en, keepWithNext: v.fundamento === 'incumprimento' },
    ];
    if (v.fundamento === 'incumprimento') blocks.push({ type: 'list', style: 'numeric', items: falhas.length ? falhas.map(endDot) : [BLANK, BLANK] });
    blocks.push(
      { type: 'paragraph', id: 'pedidos', text: `Em consequência, ${eu(ctx, 'solicito', 'solicitamos')}:`, en: 'Consequently, I request:', keepWithNext: true },
      { type: 'list', style: 'alpha', items: pedidos.map((p) => endDot(p.charAt(0).toUpperCase() + p.slice(1))) },
      {
        type: 'paragraph',
        id: 'cobrancas',
        text: `Qualquer cobrança posterior à data de cessação será considerada indevida. ${eu(ctx, 'Fico', 'Ficamos')} a aguardar a confirmação${str(v.autorEmail) ? ` para o email ${str(v.autorEmail)}` : ''}.`,
        en: 'Any charge after the end date will be treated as undue. I await confirmation.',
      },
      ...anexosBlock(v),
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [autorSignature(ctx, 'O Cliente', 'A Cliente')] },
      ...reciboBlock(v),
    );
    return blocks;
  },
});
