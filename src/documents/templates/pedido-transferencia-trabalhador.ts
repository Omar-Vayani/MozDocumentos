// Pedido de transferência apresentado pelo trabalhador (another workplace,
// branch or department). A transfer at the employee's request is made by
// agreement; it is recorded in writing.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, workerSignature } from './_shared';
import { autorFields, cartaDoTrabalhador, despachoBlocks, destinatarioFields, euTrabalhador, linhas, ponto, str } from './_rh-politicas';

const MOTIVOS: Record<string, string> = {
  familia: 'por motivos familiares',
  saude: 'por motivos de saúde',
  estudos: 'para prosseguir os meus estudos',
  conjuge: 'para me juntar ao meu agregado familiar, uma vez que o meu cônjuge foi colocado nessa localidade',
  carreira: 'para desenvolver a minha carreira profissional',
  outro: 'pelos motivos que passo a expor',
};

export default defineTemplate({
  id: 'pedido-transferencia-trabalhador',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Trabalhador (quem pede)', 'Employee'), personRole: 'trabalhador' },
    { id: 'empresa', title: l('Destinatário', 'Addressee') },
    { id: 'transferencia', title: l('Transferência', 'Transfer') },
  ],
  fields: [
    localField(),
    dateField(),
    ...autorFields(['nome', 'genero', 'cargo', 'departamento', 'dataAdmissao']),
    ...destinatarioFields(),
    { name: 'localActual', type: 'text', section: 'transferencia', width: 'half', required: true, label: l('Local de trabalho actual', 'Current workplace'), placeholder: l('Ex.: Delegação de Nampula', 'E.g. Nampula branch') },
    { name: 'localPretendido', type: 'text', section: 'transferencia', width: 'half', required: true, label: l('Local pretendido', 'Requested workplace'), placeholder: l('Ex.: Sede, em Maputo', 'E.g. Head office, Maputo') },
    { name: 'motivo', type: 'select', section: 'transferencia', label: l('Motivo', 'Reason'), default: 'familia', options: [
      { value: 'familia', label: l('Motivos familiares', 'Family reasons') },
      { value: 'conjuge', label: l('Juntar-me ao cônjuge / agregado', 'Join spouse / household') },
      { value: 'saude', label: l('Saúde', 'Health') },
      { value: 'estudos', label: l('Estudos', 'Studies') },
      { value: 'carreira', label: l('Desenvolvimento profissional', 'Career development') },
      { value: 'outro', label: l('Outro', 'Other') },
    ] },
    { name: 'explicacao', type: 'textarea', section: 'transferencia', rows: 3, label: l('Explicação (opcional)', 'Explanation (optional)') },
    { name: 'dataPretendida', type: 'date', section: 'transferencia', width: 'half', label: l('A partir de', 'From') },
    { name: 'mesmasFuncoes', type: 'toggle', section: 'transferencia', default: true, label: l('Nas mesmas funções e categoria', 'Same duties and grade') },
    { name: 'despesas', type: 'toggle', section: 'transferencia', default: false, label: l('Assumo as despesas da mudança', 'I will bear the moving costs'), help: l('Quando a transferência é imposta pelo empregador, ele paga as despesas. Num pedido do trabalhador, isso é acordado.', 'When the employer imposes a transfer it pays the costs; on the employee’s request this is agreed.') },
  ],

  warnings: () => {
    const w: Warning[] = [];
    w.push({ level: 'info', message: l(`Uma transferência a pedido do trabalhador depende de acordo. Se a empresa aceitar, peça a confirmação por escrito com a data, o local e as condições (${cite('rhpTransferencia')}).`, 'A transfer at your request needs the employer’s agreement; get written confirmation of date, place and terms.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const exp = linhas(v.explicacao).join(' ');
    const desde = v.trabalhadorDataAdmissao ? `, ao serviço da empresa desde ${dateLong(v.trabalhadorDataAdmissao)}` : '';
    const blocks: Block[] = [
      ...cartaDoTrabalhador(ctx, 'Pedido de transferência'),
      {
        type: 'paragraph',
        id: 'pedido',
        text: `${euTrabalhador(v)}${desde}, actualmente colocad${v.trabalhadorGenero === 'F' ? 'a' : 'o'} em ${str(v.localActual) || BLANK}, venho requerer a V. Ex.ª a minha transferência para ${str(v.localPretendido) || BLANK}${v.dataPretendida ? `, a partir de ${dateLong(v.dataPretendida)}` : ''}${v.mesmasFuncoes !== false ? ', mantendo as mesmas funções e categoria' : ''}.`,
        en: `I request a transfer from ${v.localActual || '—'} to ${v.localPretendido || '—'}.`,
      },
      {
        type: 'paragraph',
        id: 'motivo',
        text: `Faço este pedido ${MOTIVOS[v.motivo as string] ?? MOTIVOS.outro}${exp ? `: ${ponto(exp.charAt(0).toLowerCase() + exp.slice(1))}` : '.'}`,
        en: 'Reason for the request.',
      },
    ];
    if (v.despesas) blocks.push({ type: 'paragraph', id: 'despesas', text: 'Tratando-se de um pedido da minha iniciativa, assumo as despesas da mudança de residência.', en: 'As this is my own request, I will bear the moving costs.' });
    blocks.push(
      { type: 'paragraph', id: 'disponibilidade', text: 'Comprometo-me a assegurar a passagem de serviço ao meu substituto e fico disponível para uma reunião, se V. Ex.ª o entender.', en: 'I will hand over my work and am available to meet.', keepWithNext: true },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ ...workerSignature(v), detail: str(v.trabalhadorCargo) || undefined }] },
      ...despachoBlocks(['Deferido, com efeitos a partir de ____/____/______', 'Em análise — aguarda vaga', 'Indeferido']),
    );
    return blocks;
  },
});
