// Contrato de licença de software: a licence to install a program (perpetual
// or for a term) or a subscription to software used online (SaaS). The
// licensor keeps the copyright; the client receives a limited right of use.

import { defineTemplate, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, formatMoney, l, money } from './_shared';
import {
  arbitragemField, assinatura, documentoFields, foroField, numerar, papel, partyFields, partyName, partyWarnings, semPonto, str,
  testemunhasField, valorTexto,
} from './_contratos';
import { clCessacao, clConfidencialidade, clDadosPessoais, clForcaMaior, contratoBlocks, formaPagamentoFields, ivaField, ivaTexto, modoPagamento, prazo } from './_digital';

const isSaas = (v: Values) => v.modelo !== 'instalacao';

const PERIODO: Record<string, string> = { mensal: 'por mês', trimestral: 'por trimestre', anual: 'por ano', unico: 'em pagamento único' };

export default defineTemplate({
  id: 'contrato-licenca-software',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'licenciante', title: l('Licenciante (titular do software)', 'Licensor'), personRole: 'outro' },
    { id: 'cliente', title: l('Cliente (licenciado)', 'Licensee'), personRole: 'cliente' },
    { id: 'software', title: l('Software e licença', 'Software and licence') },
    { id: 'preco', title: l('Preço e duração', 'Price and term') },
    { id: 'clausulas', title: l('Outras cláusulas e assinaturas', 'Other terms and signatures') },
  ],
  fields: [
    ...documentoFields(),
    ...partyFields('licenciante', { fromProfile: true, tipoDefault: 'empresa' }),
    ...partyFields('cliente', { tipoDefault: 'empresa' }),

    {
      name: 'modelo',
      type: 'radio',
      section: 'software',
      label: l('Modelo', 'Model'),
      options: [
        { value: 'saas', label: l('Subscrição de software online (SaaS / na nuvem)', 'Online software subscription (SaaS)') },
        { value: 'instalacao', label: l('Licença para instalar nos equipamentos do cliente', 'Licence to install on the client’s equipment') },
      ],
      default: 'saas',
    },
    { name: 'softwareNome', type: 'text', section: 'software', required: true, width: 'half', label: l('Nome do software', 'Software name') },
    { name: 'versao', type: 'text', section: 'software', width: 'half', label: l('Versão ou plano (opcional)', 'Version or plan (optional)') },
    { name: 'descricao', type: 'textarea', section: 'software', rows: 3, label: l('Descrição e módulos', 'Description and modules'), placeholder: l('Ex.: gestão de stocks, facturação e relatórios, para uso na sede e em duas lojas', 'E.g. stock, invoicing and reports for head office and two shops') },
    { name: 'utilizadores', type: 'number', section: 'software', width: 'half', min: 1, max: 100000, label: l('Número de utilizadores ou postos', 'Number of users or seats') },
    { name: 'exclusiva', type: 'toggle', section: 'software', default: false, label: l('Licença exclusiva', 'Exclusive licence') },
    { name: 'disponibilidade', type: 'number', section: 'software', width: 'half', min: 0, max: 100, default: 99, label: l('Disponibilidade garantida do serviço (%)', 'Guaranteed availability (%)'), showIf: isSaas },
    { name: 'localDados', type: 'text', section: 'software', label: l('Onde ficam alojados os dados (opcional)', 'Where data are hosted (optional)'), placeholder: l('Ex.: servidores em Moçambique; serviço de nuvem na África do Sul', 'E.g. servers in Mozambique; cloud in South Africa'), showIf: isSaas },
    { name: 'suporte', type: 'toggle', section: 'software', default: true, label: l('Inclui suporte e actualizações', 'Includes support and updates') },
    { name: 'suporteTexto', type: 'text', section: 'software', label: l('Suporte incluído', 'Support included'), default: 'por e-mail e telefone, nos dias úteis, das 8h00 às 17h00', showIf: (v) => Boolean(v.suporte) },

    { name: 'preco', type: 'money', section: 'preco', width: 'half', required: true, label: l('Preço', 'Price') },
    {
      name: 'periodicidade',
      type: 'select',
      section: 'preco',
      width: 'half',
      label: l('Periodicidade', 'Billing period'),
      options: [
        { value: 'mensal', label: l('Mensal', 'Monthly') },
        { value: 'trimestral', label: l('Trimestral', 'Quarterly') },
        { value: 'anual', label: l('Anual', 'Yearly') },
        { value: 'unico', label: l('Pagamento único', 'One-off') },
      ],
      default: 'mensal',
    },
    ivaField('preco'),
    ...formaPagamentoFields('preco'),
    { name: 'pagamentoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 90, default: 15, label: l('Prazo de pagamento da factura (dias)', 'Invoice due in (days)') },
    { name: 'dataInicio', type: 'date', section: 'preco', width: 'half', label: l('Início da licença', 'Licence start'), default: (c) => c.today },
    {
      name: 'duracao',
      type: 'radio',
      section: 'preco',
      label: l('Duração', 'Term'),
      options: [
        { value: 'prazo', label: l('Prazo com renovação automática', 'Term with automatic renewal') },
        { value: 'perpetua', label: l('Perpétua (só licença instalada)', 'Perpetual (installed licence only)') },
      ],
      default: 'prazo',
    },
    { name: 'duracaoMeses', type: 'number', section: 'preco', width: 'half', min: 1, max: 120, default: 12, label: l('Prazo inicial (meses)', 'Initial term (months)'), showIf: (v) => v.duracao !== 'perpetua' },
    { name: 'avisoDias', type: 'number', section: 'preco', width: 'half', min: 0, max: 180, default: 30, label: l('Aviso para não renovar (dias)', 'Notice not to renew (days)'), showIf: (v) => v.duracao !== 'perpetua' },

    { name: 'dadosPessoais', type: 'toggle', section: 'clausulas', default: true, label: l('O software trata dados pessoais do cliente', 'The software processes the client’s personal data') },
    { name: 'limiteResponsabilidade', type: 'toggle', section: 'clausulas', default: true, label: l('Limitar a responsabilidade ao valor pago em doze meses', 'Cap liability at twelve months’ fees') },
    foroField('clausulas'),
    arbitragemField('clausulas'),
    testemunhasField('clausulas'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'licenciante', 'licenciante', 'licensor'), ...partyWarnings(v, 'cliente', 'cliente', 'licensee')];
    if (money(v.preco) == null) w.push({ level: 'error', field: 'preco', message: l('Indique o preço.', 'Enter the price.') });
    if (isSaas(v) && v.duracao === 'perpetua') w.push({ level: 'warning', field: 'duracao', message: l('Uma subscrição online não deve ser perpétua: escolha um prazo com renovação.', 'An online subscription should not be perpetual: choose a renewable term.') });
    w.push({ level: 'info', message: l(`A licença deve ser escrita e indicar os modos de utilização, o tempo, o lugar e o preço (${cite('digDireitosAutorTransmissao')}).`, 'A licence must be in writing and state the forms of use, time, place and price.') });
    return w;
  },

  personName: (v) => partyName(v, 'cliente') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const L = papel(v, 'licenciante', 'Licenciante', 'Licenciante', true);
    const C = papel(v, 'cliente', 'Cliente', 'Cliente');
    const saas = isSaas(v);
    const perpetua = !saas && v.duracao === 'perpetua';
    const nome = `"${str(v.softwareNome) || BLANK}"${str(v.versao) ? `, ${str(v.versao)}` : ''}`;
    const users = Number(v.utilizadores);
    const disp = Number(v.disponibilidade);

    const cl: ClauseItem[] = [];
    cl.push({
      id: 'objecto',
      heading: 'Objecto',
      text: numerar([
        saas
          ? `Pelo presente contrato, ${L.o} concede ${C.ao} o direito de aceder e utilizar, através da Internet, o software ${nome}${str(v.descricao) ? ` (${semPonto(v.descricao)})` : ''}, alojado e mantido ${L.pelo}, nos termos das cláusulas seguintes.`
          : `Pelo presente contrato, ${L.o} concede ${C.ao} uma licença de utilização do software ${nome}${str(v.descricao) ? ` (${semPonto(v.descricao)})` : ''}, para instalação nos equipamentos ${C.de}, nos termos das cláusulas seguintes.`,
        `A licença é ${v.exclusiva ? 'exclusiva' : 'não exclusiva'}, intransmissível e ${Number.isFinite(users) && users > 0 ? `limitada a ${users} ${users === 1 ? 'utilizador ou posto' : 'utilizadores ou postos'}` : 'limitada ao número de utilizadores contratado'}, para uso interno na actividade ${C.de}.`,
      ]),
      en: saas ? 'The licensor grants online access to and use of the software it hosts.' : 'The licensor grants a licence to install and use the software on the client’s equipment.',
    });
    cl.push({
      id: 'direitos',
      heading: 'Direitos de autor',
      text: numerar([
        `O software, incluindo o código, a documentação, as marcas e as actualizações, é propriedade ${L.de}, que mantém todos os direitos de autor e de propriedade industrial. O contrato não transmite ${C.ao} quaisquer direitos além dos expressamente concedidos.`,
        `${C.O} não pode copiar o software, salvo para cópia de segurança, nem descompilá-lo, modificá-lo, sublicenciá-lo, alugá-lo, cedê-lo ou disponibilizá-lo a terceiros, nem contornar as medidas técnicas de protecção.`,
      ]),
      en: 'The software and all rights in it remain the licensor’s. No copying (except a backup), reverse engineering, modification, sublicensing, rental or making available to others.',
    });
    if (saas) {
      cl.push({
        id: 'servico',
        heading: 'Disponibilidade e dados',
        text: numerar([
          Number.isFinite(disp) && disp > 0
            ? `${L.O} garante a disponibilidade do serviço em, pelo menos, ${String(disp).replace('.', ',')}% do tempo de cada mês, excluindo as manutenções programadas comunicadas com antecedência e as falhas de comunicações ou de energia alheias ao seu controlo.`
            : `${L.O} procura manter o serviço disponível de forma contínua, salvo manutenções programadas comunicadas com antecedência.`,
          `Os dados introduzidos ${C.pelo} pertencem-lhe. ${L.O} faz cópias de segurança diárias e, no fim do contrato, disponibiliza os dados ${C.ao} num formato de uso corrente durante trinta dias, após o que os apaga.`,
          str(v.localDados) ? `Os dados ficam alojados em: ${semPonto(v.localDados)}.` : '',
        ]),
        en: 'Availability as stated, excluding planned maintenance and external outages. The client owns its data; daily backups; data returned in a common format for thirty days at the end, then deleted.',
      });
    }
    if (v.suporte) {
      cl.push({
        id: 'suporte',
        heading: 'Suporte e actualizações',
        text: `O preço inclui as actualizações e as novas versões que ${L.o} disponibilizar aos seus clientes e o suporte ${semPonto(v.suporteTexto) || BLANK}.`,
        en: 'The price includes updates, new versions and the support stated.',
      });
    }
    const per = str(v.periodicidade) || 'mensal';
    cl.push({
      id: 'preco',
      heading: 'Preço e pagamento',
      text: numerar([
        `${C.O} paga ${L.ao} ${valorTexto(money(v.preco))} ${PERIODO[per]}${ivaTexto(v.iva)}${per === 'unico' ? '' : ', pago antecipadamente no início de cada período'}.`,
        `As facturas são pagas no prazo de ${prazo(v.pagamentoDias)} a contar da sua emissão, ${modoPagamento(v, L)}.`,
        per === 'unico' ? '' : `${L.O} pode actualizar o preço na renovação, avisando ${C.o} por escrito com a antecedência mínima de ${prazo(v.avisoDias || 30)}.`,
        `Em caso de atraso superior a ${prazo(v.pagamentoDias || 15)}, após aviso escrito, ${L.o} pode suspender o acesso até ao pagamento, sem perda dos dados ${C.de}.`,
      ]),
      en: `Price ${money(v.preco) != null ? formatMoney(money(v.preco)) : '—'} ${per}; invoices due as stated; price review on renewal with notice; access may be suspended for late payment, without loss of data.`,
    });
    cl.push({
      id: 'duracao',
      heading: 'Duração',
      text: perpetua
        ? `A licença é concedida por tempo indeterminado a partir de ${dateLong(v.dataInicio)}, mantendo-se enquanto ${C.o} cumprir as condições do contrato. O suporte e as actualizações, quando não incluídos no preço, podem ser contratados à parte.`
        : `O contrato produz efeitos a partir de ${dateLong(v.dataInicio)}, pelo prazo de ${prazo(v.duracaoMeses, 'mês')}, renovando-se automaticamente por períodos iguais se nenhuma das partes o denunciar por escrito com a antecedência mínima de ${prazo(v.avisoDias)} em relação ao termo.`,
      en: perpetua ? 'Perpetual licence from the start date while the client complies.' : 'Initial term as stated, renewing automatically unless notice is given.',
    });
    cl.push({
      id: 'garantia',
      heading: 'Garantia',
      text: `${L.O} garante que tem os direitos necessários para conceder a licença e que o software funciona substancialmente de acordo com a documentação. Se um terceiro reclamar direitos sobre o software, ${L.o} assume a defesa ${C.de} e suporta os custos, desde que seja avisado de imediato.`,
      en: 'The licensor warrants it may grant the licence and that the software works substantially as documented, and defends the client against third-party claims if told promptly.',
    });
    cl.push(clConfidencialidade(L, C));
    if (v.dadosPessoais) cl.push(clDadosPessoais(C, L));
    if (v.limiteResponsabilidade) {
      cl.push({
        id: 'responsabilidade',
        heading: 'Limitação de responsabilidade',
        text: `Salvo dolo ou culpa grave, a responsabilidade ${L.de} não excede o valor pago ${C.pelo} nos doze meses anteriores ao facto, e não abrange lucros cessantes nem danos indirectos.`,
        en: 'Except for wilful misconduct or gross negligence, liability is capped at fees paid in the previous twelve months, excluding lost profits and indirect loss.',
      });
    }
    cl.push(clCessacao({ curaDias: 15, extra: [`Cessando o contrato, ${C.o} deixa de utilizar o software${saas ? '' : ' e desinstala-o de todos os equipamentos'}.`] }));
    cl.push(clForcaMaior());

    return contratoBlocks(ctx, {
      title: saas ? 'Contrato de subscrição de software' : 'Contrato de licença de software',
      subtitle: str(v.softwareNome) || undefined,
      parties: [
        { p: 'licenciante', role: L, en: 'Licensor' },
        { p: 'cliente', role: C, en: 'Licensee' },
      ],
      clauses: cl,
      signatures: [assinatura(ctx, 'licenciante', L, true), assinatura(ctx, 'cliente', C)],
    });
  },
});
