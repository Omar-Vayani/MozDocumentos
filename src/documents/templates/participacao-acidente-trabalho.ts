// Participação de acidente de trabalho: (a) the employer's internal record of
// the accident (report, first aid, witnesses, causes and corrective measures,
// to be signed by the safety committee) or (b) the covering letter that
// reports the claim to the work-accident insurer. Insurers use their own claim
// forms; this letter accompanies them.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerSignature, formatMoney, l, money, lineItems, localField, refField, workerFields } from './_shared';
import { deOrgao, linhas, nosTermos, str } from './_rh-politicas';

const CIRC: Record<string, string> = {
  local: 'no local e durante o tempo de trabalho',
  trajecto: 'no trajecto de ida ou regresso do trabalho',
  servico: 'em serviço fora do local de trabalho, por ordem do empregador',
  actividade: 'em actividade organizada pelo empregador',
};
const fmt = (iso: unknown) => (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : '');

export default defineTemplate({
  id: 'participacao-acidente-trabalho',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'trabalhador', title: l('Sinistrado', 'Injured employee'), personRole: 'trabalhador' },
    { id: 'acidente', title: l('Acidente', 'Accident') },
    { id: 'assistencia', title: l('Lesões e assistência', 'Injuries and care') },
    { id: 'analise', title: l('Causas e medidas', 'Causes and measures') },
    { id: 'seguradora', title: l('Seguradora', 'Insurer') },
  ],
  fields: [
    { name: 'destino', type: 'radio', section: 'documento', label: l('Documento', 'Document'), default: 'interno', options: [
      { value: 'interno', label: l('Registo interno do acidente', 'Internal accident record') },
      { value: 'seguradora', label: l('Participação à seguradora', 'Claim notice to the insurer') },
    ] },
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'categoria', 'departamento', 'dataAdmissao', 'salario', 'docNumero', 'inss', 'telefone']),
    { name: 'dataAcidente', type: 'date', section: 'acidente', width: 'half', required: true, label: l('Data do acidente', 'Accident date') },
    { name: 'horaAcidente', type: 'text', section: 'acidente', width: 'half', label: l('Hora', 'Time'), placeholder: l('Ex.: 10h40', 'E.g. 10:40') },
    { name: 'localAcidente', type: 'text', section: 'acidente', required: true, label: l('Local', 'Place'), placeholder: l('Ex.: Estaleiro da Matola, bloco B, 2.º piso', 'E.g. Matola site, block B, 2nd floor') },
    { name: 'circunstancia', type: 'select', section: 'acidente', label: l('Circunstância', 'Circumstance'), default: 'local', options: [
      { value: 'local', label: l('No local e tempo de trabalho', 'At work') },
      { value: 'trajecto', label: l('No trajecto casa–trabalho', 'Commuting') },
      { value: 'servico', label: l('Em serviço externo', 'On an external assignment') },
      { value: 'actividade', label: l('Em actividade organizada pela empresa', 'At a company-organised activity') },
    ] },
    { name: 'tarefa', type: 'text', section: 'acidente', label: l('Tarefa que executava', 'Task being performed') },
    { name: 'descricao', type: 'textarea', section: 'acidente', rows: 4, required: true, label: l('Como aconteceu', 'How it happened') },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'acidente',
      label: l('Testemunhas', 'Witnesses'),
      addLabel: l('Adicionar testemunha', 'Add witness'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'contacto', type: 'text', label: l('Função / contacto', 'Job / contact') },
      ],
      default: [],
    },
    { name: 'lesoes', type: 'textarea', section: 'assistencia', rows: 2, required: true, label: l('Lesões (natureza e parte do corpo)', 'Injuries (type and body part)'), placeholder: l('Ex.: fractura do antebraço esquerdo e escoriações na face', 'E.g. broken left forearm and facial grazes') },
    { name: 'primeirosSocorros', type: 'text', section: 'assistencia', label: l('Primeiros socorros prestados por', 'First aid given by') },
    { name: 'unidadeSanitaria', type: 'text', section: 'assistencia', width: 'half', label: l('Unidade sanitária', 'Health facility') },
    { name: 'transporte', type: 'text', section: 'assistencia', width: 'half', label: l('Transporte', 'Transport'), placeholder: l('Ex.: viatura da empresa', 'E.g. company vehicle') },
    { name: 'situacao', type: 'select', section: 'assistencia', width: 'half', label: l('Situação actual', 'Current status'), default: 'baixa', options: [
      { value: 'baixa', label: l('Incapacidade temporária (baixa)', 'Temporary incapacity (sick leave)') },
      { value: 'retomou', label: l('Retomou o trabalho', 'Back at work') },
      { value: 'internado', label: l('Internado', 'In hospital') },
      { value: 'obito', label: l('Óbito', 'Death') },
    ] },
    { name: 'diasBaixa', type: 'number', section: 'assistencia', width: 'half', min: 0, label: l('Dias de baixa previstos', 'Expected days off'), showIf: (v) => v.situacao === 'baixa' || v.situacao === 'internado' },
    { name: 'causas', type: 'textarea', section: 'analise', rows: 3, label: l('Causas apuradas', 'Causes found'), showIf: (v) => v.destino !== 'seguradora' },
    { name: 'medidas', type: 'textarea', section: 'analise', rows: 3, label: l('Medidas correctivas', 'Corrective measures'), showIf: (v) => v.destino !== 'seguradora' },
    { name: 'epiUsado', type: 'select', section: 'analise', width: 'half', label: l('Usava o EPI exigido?', 'Was required PPE worn?'), default: 'sim', options: [
      { value: 'sim', label: l('Sim', 'Yes') },
      { value: 'nao', label: l('Não', 'No') },
      { value: 'naoAplicavel', label: l('Não aplicável', 'Not applicable') },
    ] },
    { name: 'seguradoraNome', type: 'text', section: 'seguradora', width: 'half', label: l('Seguradora', 'Insurer') },
    { name: 'apolice', type: 'text', section: 'seguradora', width: 'half', label: l('Apólice n.º', 'Policy no.') },
    { name: 'seguradoraMorada', type: 'text', section: 'seguradora', label: l('Morada da seguradora', 'Insurer’s address'), showIf: (v) => v.destino === 'seguradora' },
    {
      name: 'anexos',
      type: 'lines',
      section: 'seguradora',
      label: l('Documentos anexos', 'Attachments'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [],
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.seguradoraNome)) w.push({ level: v.destino === 'seguradora' ? 'error' : 'info', field: 'seguradoraNome', message: l(`O seguro colectivo de acidentes de trabalho é obrigatório (${cite('rhpSeguroAcidentes')}). Indique a seguradora e a apólice.`, 'Work accident insurance is mandatory. Enter the insurer and policy.') });
    if (v.destino === 'seguradora') w.push({ level: 'warning', message: l(`Participe o sinistro no prazo fixado na apólice e no impresso da seguradora; esta carta acompanha esse impresso (${cite('rhpSeguradoraParticipacao')}).`, 'Report within the policy period and on the insurer’s form; this letter goes with it.') });
    else w.push({ level: 'info', message: l(`Depois do inquérito, informe a administração do trabalho sobre a natureza, as causas e as consequências do acidente (${cite('rhpAcidenteParticipacao')}). Use "Comunicação ao Ministério do Trabalho".`, 'After the inquiry, inform the labour administration of the nature, causes and consequences.') });
    if (v.situacao === 'obito') w.push({ level: 'warning', field: 'situacao', message: l('Em caso de morte, o empregador suporta o funeral e há lugar a pensão de sobrevivência; contacte de imediato a seguradora e a Inspecção do Trabalho.', 'In case of death the employer pays the funeral and a survivor’s pension is due; contact the insurer and the Inspectorate at once.') });
    return w;
  },
  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const seg = v.destino === 'seguradora';
    const tests = lineItems(v.testemunhas).filter((r) => str(r.nome));
    const anexos = lineItems(v.anexos).map((r) => str(r.descricao)).filter(Boolean);
    const txt = (x: unknown) => linhas(x).join('; ');
    const SIT: Record<string, string> = {
      baixa: `Incapacidade temporária${v.diasBaixa ? `, com ${v.diasBaixa} dias de baixa previstos` : ''}`,
      retomou: 'Retomou o trabalho',
      internado: `Internado${v.diasBaixa ? `, com ${v.diasBaixa} dias de baixa previstos` : ''}`,
      obito: 'Óbito',
    };
    const sinistrado = [
      { label: 'Nome', value: str(v.trabalhadorNome) || BLANK },
      { label: 'BI n.º', value: str(v.trabalhadorDocNumero) || BLANK },
      { label: 'Função / categoria', value: [str(v.trabalhadorCargo), str(v.trabalhadorCategoria)].filter(Boolean).join(' / ') || BLANK },
      { label: 'Departamento', value: str(v.trabalhadorDepartamento) || BLANK },
      { label: 'Admissão', value: dateLong(v.trabalhadorDataAdmissao) },
      { label: 'Beneficiário INSS n.º', value: str(v.trabalhadorInss) || BLANK },
      { label: 'Salário base', value: v.trabalhadorSalario ? formatMoney(money(v.trabalhadorSalario)) : BLANK },
      { label: 'Telefone', value: str(v.trabalhadorTelefone) || BLANK },
    ];
    const acidente = [
      { label: 'Data e hora', value: `${fmt(v.dataAcidente) || '___/___/______'}${str(v.horaAcidente) ? `, ${str(v.horaAcidente)}` : ''}` },
      { label: 'Local', value: str(v.localAcidente) || BLANK },
      { label: 'Circunstância', value: CIRC[v.circunstancia as string] ?? CIRC.local },
      { label: 'Tarefa', value: str(v.tarefa) || BLANK },
      { label: 'Como aconteceu', value: txt(v.descricao) || BLANK },
      { label: 'Testemunhas', value: tests.length ? tests.map((t) => `${str(t.nome)}${str(t.contacto) ? ` (${str(t.contacto)})` : ''}`).join('; ') : '—' },
    ];
    const assist = [
      { label: 'Lesões', value: txt(v.lesoes) || BLANK },
      { label: 'Primeiros socorros', value: str(v.primeirosSocorros) || BLANK },
      { label: 'Unidade sanitária', value: str(v.unidadeSanitaria) || BLANK },
      { label: 'Transporte', value: str(v.transporte) || BLANK },
      { label: 'Situação', value: SIT[v.situacao as string] ?? SIT.baixa },
      { label: 'EPI exigido em uso', value: v.epiUsado === 'nao' ? 'Não' : v.epiUsado === 'naoAplicavel' ? 'Não aplicável' : 'Sim' },
    ];

    if (seg) {
      const blocks: Block[] = [
        { type: 'reference', ref: str(v.ref) || undefined, place: ctx.place, date: dateLong(v.data) },
        { type: 'recipient', salutation: 'Exmos. Senhores', lines: [str(v.seguradoraNome) || BLANK, 'Departamento de Sinistros', str(v.seguradoraMorada)].filter(Boolean) },
        { type: 'subject', text: `Participação de acidente de trabalho${str(v.apolice) ? ` — Apólice n.º ${str(v.apolice)}` : ''}` },
        { type: 'salutation', text: 'Exmos. Senhores,' },
        {
          type: 'paragraph',
          id: 'participacao',
          text: `Ao abrigo da apólice de seguro de acidentes de trabalho${str(v.apolice) ? ` n.º ${str(v.apolice)}` : ''}, celebrada ${nosTermos('rhpSeguroAcidentes')}, participamos a V. Ex.as o acidente de trabalho sofrido pel${v.trabalhadorGenero === 'F' ? 'a nossa trabalhadora' : 'o nosso trabalhador'} **${str(v.trabalhadorNome) || BLANK}**, em ${dateLong(v.dataAcidente)}, ${CIRC[v.circunstancia as string] ?? CIRC.local}, nos termos seguintes:`,
          en: 'Under the work-accident policy we report the accident suffered by our employee, as follows.',
          keepWithNext: true,
        },
        { type: 'keyValue', title: 'Sinistrado', columns: 2, items: sinistrado },
        { type: 'keyValue', title: 'Acidente', columns: 1, items: acidente },
        { type: 'keyValue', title: 'Lesões e assistência', columns: 1, items: assist },
        {
          type: 'paragraph',
          id: 'pedido',
          text: 'Solicitamos que V. Ex.as assumam a assistência médica e medicamentosa do sinistrado e as indemnizações a que houver lugar, e nos indiquem os documentos e os exames adicionais necessários à regularização do sinistro. Juntamos o impresso de participação dessa seguradora devidamente preenchido.',
          en: 'Please take over medical care and any compensation due and tell us what else you need; your claim form is enclosed.',
          keepWithNext: !anexos.length,
        },
      ];
      if (anexos.length) blocks.push({ type: 'annexList', items: anexos, keepWithNext: true });
      blocks.push(
        { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
        { type: 'signatures', columns: [employerSignature(ctx, 'A Entidade Empregadora')] },
      );
      return blocks;
    }

    const blocks: Block[] = [
      { type: 'title', text: 'Participação e Registo de Acidente de Trabalho', subtitle: str(v.ref) ? `N.º ${str(v.ref)}` : undefined },
      { type: 'keyValue', title: 'Sinistrado', columns: 2, items: sinistrado },
      { type: 'keyValue', title: 'Acidente', columns: 1, items: acidente },
      { type: 'keyValue', title: 'Lesões e assistência', columns: 1, items: assist },
      {
        type: 'keyValue',
        title: 'Inquérito',
        columns: 1,
        items: [
          { label: 'Causas apuradas', value: txt(v.causas) || BLANK },
          { label: 'Medidas correctivas', value: txt(v.medidas) || BLANK },
          { label: 'Seguradora / apólice', value: [str(v.seguradoraNome), str(v.apolice) ? `apólice n.º ${str(v.apolice)}` : ''].filter(Boolean).join(', ') || BLANK },
        ],
      },
      {
        type: 'note',
        text: `Registo feito ${nosTermos('rhpAcidenteParticipacao')}. Concluído o inquérito, a informação sobre a natureza, as causas e as consequências do acidente é remetida ${deOrgao('administração do trabalho')}, e o sinistro é participado à seguradora.`,
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [
          { role: 'O Participante / Chefia directa', detail: 'Nome: ____________________' },
          { role: 'Pela Comissão de Segurança', detail: 'Nome: ____________________' },
          { ...employerSignature(ctx, 'A Direcção'), image: undefined },
        ],
      },
    ];
    return blocks;
  },
});
