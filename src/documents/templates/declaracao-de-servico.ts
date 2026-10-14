// Declaração de serviço / de efectividade: issued by the human resources unit
// of a public body at an official's request (bank, consulate, school, credit),
// confirming the person's link to the State, grade and, if asked, salary.

import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, l, localField, moneyText, workerFields } from './_shared';
import { daOuDo, estadoRef, estadoWarnings, numeroField, signatarioColumn, signatarioFields, str } from './_estado';

export default defineTemplate({
  id: 'declaracao-de-servico',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Tipo e data', 'Type and date') },
    { id: 'trabalhador', title: l('Funcionário', 'Official'), personRole: 'trabalhador' },
    { id: 'vinculo', title: l('Vínculo e carreira', 'Employment and career') },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
    { id: 'assinatura', title: l('Assinatura e autenticação', 'Signature and authentication') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'documento',
      label: l('O que se declara', 'What is certified'),
      options: [
        { value: 'efectividade', label: l('Efectividade de serviço (habitual para bancos)', 'Active service (usual for banks)') },
        { value: 'servico', label: l('Vínculo e funções', 'Employment and duties') },
        { value: 'vencimento', label: l('Efectividade e vencimento', 'Active service and salary') },
      ],
      default: 'efectividade',
    },
    numeroField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'docTipo', 'docNumero', 'nuit']),
    {
      name: 'vinculo',
      type: 'select',
      section: 'vinculo',
      width: 'half',
      label: l('Vínculo', 'Employment status'),
      options: [
        { value: 'funcionario', label: l('Funcionário(a) do Estado (nomeação)', 'State official (appointed)') },
        { value: 'agente', label: l('Agente do Estado (contrato)', 'State agent (contract)') },
      ],
      default: 'funcionario',
    },
    { name: 'carreira', type: 'text', section: 'vinculo', width: 'half', label: l('Carreira', 'Career'), placeholder: l('Ex.: Técnico Superior de Saúde', 'E.g. Senior Health Technician') },
    { name: 'categoria', type: 'text', section: 'vinculo', width: 'half', label: l('Categoria / classe / escalão', 'Grade / class / step'), placeholder: l('Ex.: N1, classe A, escalão 3', 'E.g. N1, class A, step 3') },
    { name: 'funcao', type: 'text', section: 'vinculo', width: 'half', label: l('Função que exerce', 'Duties'), personKey: 'cargo' },
    { name: 'sector', type: 'text', section: 'vinculo', width: 'half', label: l('Sector / unidade', 'Unit'), personKey: 'departamento' },
    { name: 'dataInicio', type: 'date', section: 'vinculo', width: 'half', label: l('Em funções desde', 'In service since'), personKey: 'dataAdmissao' },
    { name: 'vencimento', type: 'money', section: 'vinculo', width: 'half', label: l('Vencimento mensal', 'Monthly salary'), personKey: 'salarioBase', showIf: (v) => v.tipo === 'vencimento' },
    {
      name: 'vencimentoTipo',
      type: 'select',
      section: 'vinculo',
      width: 'half',
      label: l('Valor indicado', 'Amount stated'),
      options: [
        { value: 'base', label: l('Vencimento base', 'Base salary') },
        { value: 'iliquido', label: l('Vencimento ilíquido (bruto)', 'Gross salary') },
        { value: 'liquido', label: l('Vencimento líquido', 'Net salary') },
      ],
      default: 'base',
      showIf: (v) => v.tipo === 'vencimento',
    },
    { name: 'finalidade', type: 'text', section: 'finalidade', label: l('Para que serve (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: abertura de conta bancária', 'E.g. opening a bank account') },
    { name: 'destinatario', type: 'text', section: 'finalidade', label: l('A apresentar a (opcional)', 'To be presented to (optional)'), placeholder: l('Ex.: Banco Comercial e de Investimentos', 'E.g. a bank') },
    ...signatarioFields('assinatura', l('Cargo de quem declara', 'Position of the person certifying')),
    {
      name: 'autenticacao',
      type: 'radio',
      section: 'assinatura',
      label: l('Autenticação', 'Authentication'),
      options: [
        { value: 'carimbo', label: l('Carimbo a óleo', 'Ink stamp') },
        { value: 'selo', label: l('Selo branco', 'Embossed seal') },
      ],
      default: 'carimbo',
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = estadoWarnings(v, ctx);
    if (!str(v.trabalhadorNome)) w.push({ level: 'warning', field: 'trabalhadorNome', message: l('Indique o nome do funcionário.', 'Enter the official’s name.') });
    if (!str(v.carreira) && !str(v.categoria)) w.push({ level: 'info', field: 'carreira', message: l('Indique a carreira e a categoria, como constam do processo individual.', 'Enter the career and grade as in the personal file.') });
    if (v.tipo === 'vencimento') {
      w.push({ level: 'info', field: 'vencimento', message: l('O vencimento é um dado pessoal: indique-o só quando o funcionário o pede para o fim declarado.', 'Salary is personal data: state it only when the official asks for it for the stated purpose.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.trabalhadorGenero === 'F';
    const org = (ctx.profile?.firma || '').trim();
    const doc = `, ${f ? 'portadora' : 'portador'} do ${str(v.trabalhadorDocTipo) || 'BI'} n.º ${str(v.trabalhadorDocNumero) || '____________'}`;
    const nuit = str(v.trabalhadorNuit) ? `, NUIT ${str(v.trabalhadorNuit)}` : '';
    const vinc = v.vinculo === 'agente' ? 'agente do Estado' : f ? 'funcionária do Estado' : 'funcionário do Estado';
    const carreira = [str(v.carreira) ? `da carreira de ${str(v.carreira)}` : '', str(v.categoria) ? `${str(v.carreira) ? '' : 'com a '}categoria ${str(v.categoria)}` : '']
      .filter(Boolean)
      .join(', ');
    const parts = [
      `Para os devidos efeitos, declara-se que ${g(v.trabalhadorGenero, 'o Senhor', 'a Senhora')} **${(str(v.trabalhadorNome) || BLANK).toLocaleUpperCase('pt')}**${doc}${nuit}, é ${vinc}${org ? `, afect${f ? 'a' : 'o'} ${daOuDo(org).replace(/^do /, 'ao ').replace(/^da /, 'à ')}` : ''}`,
      carreira ? `, ${carreira}` : '',
      str(v.funcao) ? `, exercendo as funções de ${str(v.funcao)}` : '',
      str(v.sector) ? ` ${daOuDo(str(v.sector).replace(/^(no|na)\s+/i, '')).replace(/^d/, 'n')}` : '',
      v.dataInicio ? `, desde ${dateLong(v.dataInicio)}` : '',
    ];
    let texto = parts.join('');
    if (v.tipo !== 'servico') texto += `, encontrando-se em efectividade de serviço`;
    if (v.tipo === 'vencimento') {
      const t = v.vencimentoTipo === 'liquido' ? 'o vencimento líquido mensal' : v.vencimentoTipo === 'iliquido' ? 'o vencimento ilíquido mensal' : 'o vencimento base mensal';
      texto += `, auferindo ${t} de ${moneyText(v.vencimento) || BLANK}`;
    }
    texto += '.';

    const fim = [str(v.finalidade) ? `destinada a ${str(v.finalidade).replace(/[.;]+$/, '')}` : '', str(v.destinatario) ? `a apresentar ${/^(ao|à|a)\s/i.test(str(v.destinatario)) ? '' : 'a '}${str(v.destinatario)}` : '']
      .filter(Boolean)
      .join(', ');
    const selo = v.autenticacao === 'selo' ? 'selo branco' : 'carimbo a óleo';
    const fecho = `Por ser verdade e a pedido ${f ? 'da interessada' : 'do interessado'}, passa-se a presente declaração${fim ? `, ${fim}` : ''}, que vai por mim assinada e autenticada com o ${selo} em uso nesta instituição.`;

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração', subtitle: str(v.numero) ? estadoRef(ctx, 'Declaração').replace(/^Declaração n\.º/, 'N.º') : undefined },
      { type: 'paragraph', id: 'declaracao', text: texto, en: 'It is certified that the person named is a State employee, with the grade, duties and service details stated.' },
      { type: 'paragraph', id: 'fecho', text: fecho, keepWithNext: true, en: 'Issued at the person’s request, signed and authenticated with the institution’s stamp or seal.' },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [signatarioColumn(v)] },
    ];
    return blocks;
  },
});
