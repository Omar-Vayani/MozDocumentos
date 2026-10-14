// Nomeação e aceitação de representante fiscal de uma pessoa ou entidade não
// residente, para comunicar à Autoridade Tributária.

import { defineTemplate, type Block, type FieldOption, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField } from './_shared';
import { identificacao, papel, partyFields, partyName, partyWarnings } from './_contratos';
import { destinatarioFiscalFields, juntar, s, semPonto } from './_financas';

const IMPOSTOS_OPTIONS: FieldOption[] = [
  { value: 'todos', label: l('Todos os impostos', 'All taxes') },
  { value: 'IRPC', label: l('IRPC', 'Corporate income tax') },
  { value: 'IRPS', label: l('IRPS', 'Personal income tax') },
  { value: 'IVA', label: l('IVA', 'VAT') },
  { value: 'IRPC e IVA', label: l('IRPC e IVA', 'Corporate income tax and VAT') },
];

const empresa = (v: Values) => v.representadoTipo === 'empresa';

export default defineTemplate({
  id: 'nomeacao-representante-fiscal',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Destino, local e data', 'Addressee, place and date') },
    { id: 'representado', title: l('Não residente (representado)', 'Non-resident (principal)') },
    { id: 'representante', title: l('Representante fiscal (residente em Moçambique)', 'Tax representative (resident)'), personRole: 'representante' },
    { id: 'poderes', title: l('Âmbito e poderes', 'Scope and powers') },
  ],
  fields: [
    ...destinatarioFiscalFields('documento'),
    localField(),
    dateField('data'),
    { name: 'representadoTipo', type: 'radio', section: 'representado', label: l('É', 'Is'), options: [{ value: 'empresa', label: l('Empresa estrangeira', 'Foreign company') }, { value: 'pessoa', label: l('Pessoa singular', 'Individual') }], default: 'empresa' },
    { name: 'representadoNome', type: 'text', section: 'representado', required: true, label: l('Nome ou denominação', 'Name') },
    { name: 'representadoGenero', type: 'radio', section: 'representado', width: 'half', label: l('Tratamento', 'Form of address'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }], default: 'M', showIf: (v) => !empresa(v) },
    { name: 'representadoPais', type: 'text', section: 'representado', width: 'half', required: true, label: l('País de residência', 'Country of residence') },
    { name: 'representadoNif', type: 'text', section: 'representado', width: 'half', label: l('N.º fiscal no país de residência', 'Foreign tax number') },
    { name: 'representadoNuit', type: 'text', section: 'representado', width: 'half', label: l('NUIT em Moçambique (se já tiver)', 'Mozambican NUIT (if any)') },
    { name: 'representadoDoc', type: 'text', section: 'representado', width: 'half', label: l('Passaporte n.º / registo comercial n.º', 'Passport / company registration no.') },
    { name: 'representadoMorada', type: 'text', section: 'representado', label: l('Morada ou sede no estrangeiro', 'Address abroad') },
    { name: 'representadoSignatario', type: 'text', section: 'representado', width: 'half', label: l('Quem assina pelo representado', 'Signatory for the principal'), showIf: empresa },
    { name: 'representadoCargo', type: 'text', section: 'representado', width: 'half', label: l('Cargo', 'Position'), showIf: empresa },
    ...partyFields('representante', { fromProfile: true, tipoDefault: 'empresa' }),
    { name: 'impostos', type: 'select', section: 'poderes', width: 'half', label: l('Impostos abrangidos', 'Taxes covered'), options: IMPOSTOS_OPTIONS, default: 'todos' },
    { name: 'motivo', type: 'text', section: 'poderes', label: l('Rendimentos ou operações em Moçambique', 'Income or operations in Mozambique'), placeholder: l('Ex.: prestação de serviços de consultoria à Machava & Filhos, Lda; arrendamento de imóvel em Maputo', 'E.g. consulting services to …; letting a property in Maputo') },
    { name: 'inicio', type: 'date', section: 'poderes', width: 'half', label: l('Com efeitos a partir de', 'Effective from') },
    { name: 'reclamar', type: 'toggle', section: 'poderes', default: true, label: l('Pode também reclamar e recorrer de actos tributários', 'May also object to and appeal tax acts') },
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'representante', 'representante', 'representative')];
    if (!s(v.representadoNome)) w.push({ level: 'error', field: 'representadoNome', message: l('Indique o não residente representado.', 'Enter the non-resident principal.') });
    w.push({
      level: 'warning',
      message: l(
        `Os não residentes sem estabelecimento estável que obtenham rendimentos em Moçambique devem designar um representante residente e comunicá-lo à Direcção de Área Fiscal (${cite('finRepresentanteFiscal')}). Assinada no estrangeiro, a declaração do representado deve ser reconhecida e legalizada (ou apostilada) e, se não estiver em português, traduzida. Confirme se a AT exige impresso próprio.`,
        'Non-residents earning income in Mozambique must appoint a resident representative and notify the tax office. If signed abroad, the principal’s signature must be certified and legalised (or apostilled) and translated if needed. Check whether the tax office requires its own form.',
      ),
    });
    return w;
  },

  personName: (v) => s(v.representadoNome) || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const R = papel(v, 'representante', 'Representante', 'Representante', true);
    const repr = [
      `**${s(v.representadoNome) || BLANK}**`,
      empresa(v) ? `sociedade com sede em ${semPonto(v.representadoMorada) || BLANK}, ${semPonto(v.representadoPais) || BLANK}` : `residente em ${semPonto(v.representadoMorada) || BLANK}, ${semPonto(v.representadoPais) || BLANK}`,
      s(v.representadoDoc) ? `${empresa(v) ? 'registada sob o n.º' : 'titular do passaporte n.º'} ${s(v.representadoDoc)}` : '',
      s(v.representadoNif) ? `com o número fiscal ${s(v.representadoNif)} no país de residência` : '',
      s(v.representadoNuit) ? `NUIT ${s(v.representadoNuit)}` : '',
      empresa(v) && s(v.representadoSignatario) ? `representada por ${s(v.representadoSignatario)}${s(v.representadoCargo) ? `, ${s(v.representadoCargo)}` : ''}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const impostos = v.impostos === 'todos' ? 'todos os impostos' : `o ${s(v.impostos)}`.replace(/^o IRPC e IVA$/, 'o IRPC e o IVA');
    const poderes = [
      'receber as notificações e citações da Administração Tributária',
      'requerer a inscrição e as alterações no registo de contribuintes',
      'preparar, assinar e entregar as declarações fiscais',
      'pagar os impostos devidos',
      ...(v.reclamar ? ['apresentar reclamações, recursos e outros pedidos, e prestar esclarecimentos'] : []),
    ];
    const blocks: Block[] = [
      { type: 'recipient', salutation: s(v.tratamento) || 'Exmo. Senhor', lines: [s(v.entidade) || BLANK, s(v.destinatarioLocal).toUpperCase()].filter(Boolean) },
      { type: 'title', text: 'Nomeação de representante fiscal' },
      {
        type: 'paragraph',
        id: 'nomeacao',
        text: `${repr}, não residente em território moçambicano e sem estabelecimento estável no País${s(v.motivo) ? `, que aufere rendimentos ou realiza operações em Moçambique (${semPonto(v.motivo)})` : ''}, nomeia como ${R.f ? 'sua' : 'seu'} representante fiscal, nos termos ${cite('finRepresentanteFiscal').startsWith('art') ? `do ${cite('finRepresentanteFiscal')}` : `da ${cite('finRepresentanteFiscal')}`}, ${identificacao(v, 'representante')}, adiante ${R.f ? 'designada' : 'designado'} por **${R.n}**.`,
        en: 'The non-resident principal appoints the resident named as tax representative.',
      },
      {
        type: 'paragraph',
        id: 'poderes',
        text: `${R.O} representa o não residente perante a Administração Tributária quanto a ${impostos}${v.inicio ? `, com efeitos a partir de ${dateLong(v.inicio)}` : ''}, com poderes para ${juntar(poderes)}.`,
        en: 'Scope and powers of the representative.',
      },
      {
        type: 'paragraph',
        id: 'aceitacao',
        text: `${R.O}, ${partyName(v, 'representante') || BLANK}, declara aceitar a nomeação e as obrigações dela decorrentes. A nomeação vigora até ser revogada ou renunciada por escrito, com comunicação à Direcção de Área Fiscal.`,
        en: 'The representative accepts the appointment; it lasts until revoked or renounced in writing and notified.',
      },
      { type: 'paragraph', id: 'local', text: `${ctx.place}, ${dateLong(v.data)}.`, align: 'center', keepWithNext: true, en: 'Place and date.' },
    ];
    const cols: SignatureColumn[] = [
      { role: empresa(v) || v.representadoGenero === 'F' ? 'A Representada' : 'O Representado', name: empresa(v) ? s(v.representadoSignatario) || undefined : s(v.representadoNome) || undefined, detail: empresa(v) ? [s(v.representadoCargo), s(v.representadoNome)].filter(Boolean).join(', ') || undefined : undefined },
      { role: `${R.O} (aceitação)`, name: v.representanteTipo === 'empresa' ? s(v.representanteRepNome) || undefined : s(v.representanteNome) || undefined, detail: v.representanteTipo === 'empresa' ? [s(v.representanteRepCargo), s(v.representanteEmpresaNome)].filter(Boolean).join(', ') || undefined : undefined, image: ctx.profile ? 'both' : undefined },
    ];
    blocks.push({ type: 'signatures', columns: cols });
    return blocks;
  },
});
