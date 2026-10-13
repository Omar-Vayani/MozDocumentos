// Carta de renúncia ao cargo de gerente / administrador: written by the person
// resigning to the company. It supports the registration of the end of office.
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, g, isF, l, localField } from './_shared';
import { pessoaFields, quantos, comReconhecimento, semPonto, sociedadeFields, sociedadeNome, str } from './_sociedades';

const CARGOS: Record<string, [string, string]> = {
  gerente: ['gerente', 'gerente'],
  administrador: ['administrador', 'administradora'],
  administradorDelegado: ['administrador-delegado', 'administradora-delegada'],
  conselhoFiscal: ['membro do conselho fiscal', 'membro do conselho fiscal'],
  fiscalUnico: ['fiscal único', 'fiscal única'],
  secretario: ['secretário da sociedade', 'secretária da sociedade'],
};

const DESTINO: Record<string, string> = {
  assembleia: 'Ao cuidado da Mesa da Assembleia Geral',
  socios: 'Ao cuidado dos Senhores Sócios',
  gerencia: 'Ao cuidado da Gerência',
  conselho: 'Ao cuidado do Conselho de Administração',
};

const cargoDe = (v: Values) => g(v.renuncianteGenero, ...(CARGOS[v.cargo] ?? CARGOS.gerente));

export default defineTemplate({
  id: 'renuncia-gerente',
  family: 'carta',
  official: 'registo',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'renunciante', title: l('Quem renuncia', 'Person resigning'), personRole: 'representante' },
    { id: 'sociedade', title: l('Sociedade', 'Company') },
    { id: 'renuncia', title: l('Renúncia', 'Resignation') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField(),
    ...pessoaFields('renunciante', 'renunciante', true),
    { name: 'renuncianteTelefone', type: 'tel', section: 'renunciante', width: 'half', label: l('Telefone (opcional)', 'Phone (optional)'), personKey: 'telefone', default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.telefones ?? '' : '') },
    {
      name: 'cargo',
      type: 'select',
      section: 'renunciante',
      width: 'half',
      label: l('Cargo a que renuncia', 'Office resigned'),
      options: [
        { value: 'gerente', label: l('Gerente', 'Manager') },
        { value: 'administrador', label: l('Administrador', 'Director') },
        { value: 'administradorDelegado', label: l('Administrador-delegado', 'Managing director') },
        { value: 'conselhoFiscal', label: l('Membro do conselho fiscal', 'Audit board member') },
        { value: 'fiscalUnico', label: l('Fiscal único', 'Statutory auditor') },
        { value: 'secretario', label: l('Secretário da sociedade', 'Company secretary') },
      ],
      default: 'gerente',
    },
    ...sociedadeFields('sociedade', { tipo: false, capital: false }),
    {
      name: 'destinatario',
      type: 'select',
      section: 'sociedade',
      width: 'half',
      label: l('Dirigida a', 'Addressed to'),
      options: [
        { value: 'assembleia', label: l('Mesa da Assembleia Geral', 'Chair of the general meeting') },
        { value: 'socios', label: l('Sócios', 'Members') },
        { value: 'gerencia', label: l('Gerência', 'Management') },
        { value: 'conselho', label: l('Conselho de Administração', 'Board of directors') },
      ],
      default: 'socios',
    },
    {
      name: 'nomeacao',
      type: 'radio',
      section: 'renuncia',
      label: l('Foi nomeado(a)', 'Appointed'),
      options: [
        { value: 'contrato', label: l('No contrato de sociedade', 'In the articles') },
        { value: 'deliberacao', label: l('Por deliberação dos sócios', 'By members’ resolution') },
      ],
      default: 'deliberacao',
    },
    { name: 'dataNomeacao', type: 'date', section: 'renuncia', width: 'half', label: l('Data da nomeação', 'Date of appointment') },
    {
      name: 'efeitos',
      type: 'radio',
      section: 'renuncia',
      label: l('A renúncia produz efeitos', 'Takes effect'),
      options: [
        { value: 'legais', label: l('Nos termos legais', 'As provided by law') },
        { value: 'data', label: l('A partir de uma data', 'From a date') },
      ],
      default: 'legais',
    },
    { name: 'dataEfeitos', type: 'date', section: 'renuncia', width: 'half', label: l('Data de efeitos', 'Effective date'), showIf: (v) => v.efeitos === 'data' },
    { name: 'transicao', type: 'toggle', section: 'renuncia', label: l('Disponível para assegurar a transição', 'Available for the handover') },
    { name: 'dataTransicao', type: 'date', section: 'renuncia', width: 'half', label: l('Até', 'Until'), showIf: (v) => Boolean(v.transicao) },
    {
      name: 'motivo',
      type: 'textarea',
      section: 'renuncia',
      rows: 2,
      label: l('Motivo (opcional)', 'Reason (optional)'),
      help: l('Não é obrigatório indicar o motivo.', 'Giving a reason is not required.'),
    },
    { name: 'bancos', type: 'toggle', section: 'opcoes', default: true, label: l('Pedir a retirada de assinante bancário', 'Ask to be removed as bank signatory') },
    { name: 'reconhecimento', type: 'toggle', section: 'opcoes', label: l('Espaço para reconhecimento notarial', 'Space for notarial recognition'), help: l('Útil se a carta for junta ao pedido de registo.', 'Useful if the letter is filed for registration.') },
    { name: 'recibo', type: 'toggle', section: 'opcoes', default: true, label: l('Linha de recibo da sociedade', 'Company receipt line') },
  ],

  personName: (v) => str(v.renuncianteNome) || undefined,
  documentDate: (v) => v.data,

  warnings: (v, ctx) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Entregue a carta em mão contra recibo ou por carta registada. Depois de a renúncia produzir efeitos, a sociedade requer o registo da cessação de funções com esta carta, a acta e a declaração da administração (${cite('renunciaGerente')}), no prazo de ${quantos(ctx.legal.value<number>('registoEntidadesPrazo'), 'dia', 'dias')}. Até ao registo, terceiros podem continuar a considerá-lo gerente.`,
          'Deliver by hand against receipt or by registered post. Once effective, the company registers the end of office with this letter, the minutes and a management request. Until then third parties may still treat you as manager.',
        ),
      },
      {
        level: 'info',
        field: 'efeitos',
        message: l(
          'Se o mandato tiver prazo e renunciar sem justa causa, pode ter de indemnizar a sociedade pelos prejuízos. Confirme também quando a renúncia produz efeitos no Código Comercial.',
          'Resigning a fixed-term office without cause may make you liable for damages. Check when the resignation takes effect under the Commercial Code.',
        ),
      },
    ];
    if (v.efeitos === 'data' && v.dataEfeitos && v.data && v.dataEfeitos < v.data) {
      w.push({ level: 'warning', field: 'dataEfeitos', message: l('A data de efeitos é anterior à data da carta.', 'The effective date is before the letter’s date.') });
    }
    return w;
  },

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.renuncianteGenero);
    const cargo = cargoDe(v);
    const firma = sociedadeNome(v);
    const remetente = [`**${str(v.renuncianteNome) || BLANK}**`, semPonto(v.renuncianteMorada), str(v.renuncianteTelefone) ? `Tel. ${str(v.renuncianteTelefone)}` : ''].filter(Boolean);
    const nomeado =
      v.nomeacao === 'contrato'
        ? `para o qual fui ${f ? 'nomeada' : 'nomeado'} no contrato de sociedade`
        : `para o qual fui ${f ? 'designada' : 'designado'} por deliberação dos sócios${v.dataNomeacao ? ` de ${dateLong(v.dataNomeacao)}` : ''}`;
    const efeitos = v.efeitos === 'data' ? `com efeitos a partir de ${dateLong(v.dataEfeitos)}` : 'com efeitos nos termos legais';
    const motivo = semPonto(v.motivo);
    const sede = semPonto(v.sociedadeSede) || (ctx.profile?.kind === 'empresa' ? addressLine(ctx.profile) : '');

    const pedidos = [
      'que a presente renúncia seja levada ao conhecimento dos sócios',
      'que seja promovido o registo da cessação das minhas funções na Conservatória do Registo das Entidades Legais',
      v.bancos ? 'que seja retirada a minha assinatura das contas bancárias da sociedade e comunicada a alteração às demais entidades perante as quais figuro como seu representante' : '',
    ].filter(Boolean);

    const blocks: Block[] = [
      { type: 'paragraph', id: 'remetente', text: remetente.join('\n'), align: 'left', editable: false },
      { type: 'recipient', lines: [`**${firma}**`, DESTINO[v.destinatario] ?? DESTINO.socios, sede].filter(Boolean) },
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'subject', text: `Renúncia ao cargo de ${cargo}` },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'renuncia',
        text: `Eu, **${str(v.renuncianteNome) || BLANK}**, ${cargo} da sociedade **${firma}**${str(v.sociedadeNuel) ? `, matriculada sob o NUEL ${str(v.sociedadeNuel)}` : ''}, ${nomeado}, comunico que renuncio ao referido cargo, ${efeitos}.`,
        en: `I resign as ${v.cargo || 'manager'} of the company, ${v.efeitos === 'data' ? `effective ${v.dataEfeitos || '—'}` : 'with effect as provided by law'}.`,
      },
    ];
    if (motivo) {
      blocks.push({ type: 'paragraph', id: 'motivo', text: `A presente renúncia deve-se a ${motivo.charAt(0).toLocaleLowerCase('pt')}${motivo.slice(1)}.`, en: 'Reason for the resignation.' });
    }
    blocks.push({
      type: 'paragraph',
      id: 'pedidos',
      text: `Solicito ${pedidos.length > 1 ? `${pedidos.slice(0, -1).join(', ')} e ${pedidos[pedidos.length - 1]}` : pedidos[0]}.`,
      en: 'I ask that the members be informed, the end of office be registered' + (v.bancos ? ', and my signature be removed from the company’s bank accounts.' : '.'),
    });
    if (v.transicao) {
      blocks.push({
        type: 'paragraph',
        id: 'transicao',
        text: `Coloco-me à disposição da sociedade para assegurar a transição de funções e a entrega dos documentos e bens a meu cargo até ${dateLong(v.dataTransicao)}.`,
        en: 'I am available to ensure the handover of duties, documents and assets until the date stated.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ role: f ? 'A Renunciante' : 'O Renunciante', name: str(v.renuncianteNome) || undefined }] },
    );
    if (v.reconhecimento) comReconhecimento(blocks, 'Reconhecimento notarial da assinatura');
    if (v.recibo) blocks.push({ type: 'acknowledgement', signer: 'Pela Sociedade' });
    return blocks;
  },
});
