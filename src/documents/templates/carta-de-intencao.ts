// Carta de intenção: one-sided, non-binding letter stating the intention to
// buy, contract or partner, with indicative terms and conditions.

import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, formatMoney, l, localField, money, refField, splitLines } from './_shared';
import { lines, semPonto, str } from './_contratos';

const TRATAMENTO_OPTIONS = [
  { value: 'Exmo. Senhor', label: l('Exmo. Senhor', 'Exmo. Senhor (Dear Sir)') },
  { value: 'Exma. Senhora', label: l('Exma. Senhora', 'Exma. Senhora (Dear Madam)') },
  { value: 'Exmos. Senhores', label: l('Exmos. Senhores (a uma entidade)', 'Exmos. Senhores (to an organisation)') },
];

const TIPOS = [
  { value: 'adquirir', label: l('Comprar (imóvel, negócio, equipamento)', 'Buy (property, business, equipment)'), pt: 'adquirir', assunto: 'aquisição' },
  { value: 'contratar', label: l('Contratar um fornecedor ou prestador', 'Hire a supplier or provider'), pt: 'contratar', assunto: 'contratação' },
  { value: 'parceria', label: l('Celebrar uma parceria', 'Enter a partnership'), pt: 'celebrar com V. Ex.ª um acordo de parceria tendo por objecto', assunto: 'parceria' },
  { value: 'arrendar', label: l('Arrendar um imóvel', 'Rent a property'), pt: 'tomar de arrendamento', assunto: 'arrendamento' },
];

export default defineTemplate({
  id: 'carta-de-intencao',
  family: 'carta',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
    { id: 'intencao', title: l('Intenção e termos', 'Intent and terms') },
    { id: 'assinatura', title: l('Validade e assinatura', 'Validity and signature') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    { name: 'tratamento', type: 'select', section: 'destinatario', width: 'half', label: l('Tratamento', 'Form of address'), options: TRATAMENTO_OPTIONS, default: 'Exmo. Senhor' },
    { name: 'destinatarioNome', type: 'text', section: 'destinatario', width: 'half', label: l('Nome', 'Name') },
    { name: 'destinatarioCargo', type: 'text', section: 'destinatario', width: 'half', label: l('Cargo (opcional)', 'Position (optional)') },
    { name: 'destinatarioEntidade', type: 'text', section: 'destinatario', width: 'half', label: l('Entidade (opcional)', 'Organisation (optional)') },
    { name: 'destinatarioMorada', type: 'text', section: 'destinatario', label: l('Morada', 'Address') },

    { name: 'tipo', type: 'select', section: 'intencao', label: l('Pretende', 'You intend to'), options: TIPOS.map(({ value, label }) => ({ value, label })), default: 'adquirir' },
    {
      name: 'objecto',
      type: 'text',
      section: 'intencao',
      required: true,
      label: l('Objecto', 'Subject matter'),
      placeholder: l('Ex.: o imóvel sito na Rua das Acácias, n.º 45, Bairro do Triunfo, Maputo', 'E.g. the property at 45 Rua das Acácias, Maputo'),
    },
    {
      name: 'termos',
      type: 'lines',
      section: 'intencao',
      label: l('Termos indicativos', 'Indicative terms'),
      addLabel: l('Adicionar termo', 'Add term'),
      columns: [
        { name: 'termo', type: 'text', label: l('Termo', 'Term') },
        { name: 'valor', type: 'text', label: l('Proposta', 'Proposal') },
      ],
      default: [
        { termo: 'Preço indicativo', valor: '' },
        { termo: 'Forma de pagamento', valor: '' },
        { termo: 'Prazo para o contrato definitivo', valor: '' },
      ],
    },
    { name: 'precoIndicativo', type: 'money', section: 'intencao', width: 'half', label: l('Valor indicativo (opcional, por extenso no texto)', 'Indicative value (optional)') },
    {
      name: 'condicoes',
      type: 'textarea',
      section: 'intencao',
      rows: 3,
      label: l('Condições (uma por linha)', 'Conditions (one per line)'),
      placeholder: l('Ex.: análise satisfatória dos documentos do imóvel\naprovação do crédito bancário', 'E.g. satisfactory review of the documents\nbank loan approval'),
    },
    { name: 'validade', type: 'date', section: 'assinatura', width: 'half', label: l('Intenção válida até', 'Valid until') },
    { name: 'confidencialidade', type: 'toggle', section: 'assinatura', default: true, label: l('Pedir confidencialidade', 'Ask for confidentiality') },
    { name: 'campoAceitacao', type: 'toggle', section: 'assinatura', label: l('Incluir espaço para o destinatário assinar «tomei conhecimento»', 'Add a space for the addressee to acknowledge') },
    {
      name: 'signatarioNome',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Quem assina', 'Signatory'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? ''),
    },
    {
      name: 'signatarioCargo',
      type: 'text',
      section: 'assinatura',
      width: 'half',
      label: l('Cargo de quem assina', 'Signatory’s position'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.destinatarioNome) && !str(v.destinatarioEntidade)) w.push({ level: 'warning', field: 'destinatarioNome', message: l('Indique o destinatário.', 'Enter the addressee.') });
    if (!str(v.objecto)) w.push({ level: 'error', field: 'objecto', message: l('Indique o objecto da intenção.', 'Enter the subject matter.') });
    w.push({
      level: 'info',
      message: l(
        `A carta de intenção não obriga a contratar, mas as negociações devem decorrer de boa-fé (${cite('negociacoesBoaFe')}). Para fixar um negócio com sinal, use um contrato-promessa.`,
        'A letter of intent does not oblige either side to contract, but negotiations must be in good faith. To lock in a deal with a deposit, use a promissory contract.',
      ),
    });
    return w;
  },

  personName: (v) => v.destinatarioEntidade || v.destinatarioNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const tratamento = v.tratamento || 'Exmo. Senhor';
    const tipo = TIPOS.find((t) => t.value === v.tipo) ?? TIPOS[0];
    const empresa = p?.kind === 'empresa';
    const quem = empresa ? `A ${profileDisplayName(p) || BLANK}` : `Eu, ${p?.nome || str(v.signatarioNome) || BLANK},`;
    const termos = lines(v.termos).filter((r) => str(r.termo) && str(r.valor));
    const condicoes = splitLines(v.condicoes);
    const preco = money(v.precoIndicativo);
    const blocks: Block[] = [];

    if (p?.kind === 'pessoa') {
      const linhas = [`**${p.nome || BLANK}**`, addressLine(p), [p.telefones ? `Tel.: ${p.telefones}` : '', p.email ? `Email: ${p.email}` : ''].filter(Boolean).join(' · ')].filter(Boolean);
      blocks.push({ type: 'paragraph', id: 'remetente', text: linhas.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' });
    }
    const dest = [v.destinatarioNome, v.destinatarioCargo, v.destinatarioEntidade, v.destinatarioMorada].map(str).filter(Boolean);
    blocks.push(
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: tratamento, lines: dest.length ? dest : [BLANK] },
      { type: 'subject', text: `Carta de intenção — ${tipo.assunto}` },
      { type: 'salutation', text: `${tratamento},` },
      {
        type: 'paragraph',
        id: 'intencao',
        text: `${quem} ${empresa ? 'manifesta' : 'manifesto'}, pela presente, a ${empresa ? 'sua' : 'minha'} intenção de ${tipo.pt} ${semPonto(v.objecto) || BLANK}${preco != null ? `, pelo valor indicativo de ${formatMoney(preco)}` : ''}${termos.length ? ', nos termos e condições indicativos seguintes:' : '.'}`,
        en: `${empresa ? 'We' : 'I'} hereby state our intention to ${tipo.value === 'adquirir' ? 'acquire' : tipo.value === 'contratar' ? 'hire' : tipo.value === 'arrendar' ? 'rent' : 'partner on'} ${v.objecto || '—'}${termos.length ? ', on the indicative terms below' : ''}.`,
      },
    );
    if (termos.length) {
      blocks.push({ type: 'keyValue', items: termos.map((t) => ({ label: str(t.termo), value: str(t.valor) })), columns: 1 });
    }
    if (condicoes.length) {
      blocks.push(
        { type: 'paragraph', id: 'condicoes', text: 'A presente intenção está sujeita às seguintes condições:', en: 'This intention is subject to the following conditions:', keepWithNext: true },
        { type: 'list', style: 'alpha', items: [...condicoes.map((c) => `${semPonto(c)};`), 'celebração, por escrito, do contrato definitivo.'] },
      );
    }
    blocks.push({
      type: 'paragraph',
      id: 'naoVinculativa',
      text: `A presente carta não constitui proposta contratual nem cria, para qualquer das partes, a obrigação de contratar${v.confidencialidade ? ', com excepção do dever de manter confidencial o seu conteúdo, que se solicita a V. Ex.ª' : ''}.${v.validade ? ` Esta intenção é válida até ${dateLong(v.validade)}, aguardando a resposta de V. Ex.ª até essa data.` : ''}`,
      en: `This letter is not a binding offer and creates no obligation to contract${v.confidencialidade ? ', except confidentiality of its content' : ''}.${v.validade ? ` Valid until ${v.validade}.` : ''}`,
    });
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      {
        type: 'signatures',
        columns: [{ role: str(v.signatarioCargo) || (empresa ? profileDisplayName(p) || ' ' : ' '), name: str(v.signatarioNome) || undefined, image: 'both' }],
      },
    );
    if (v.campoAceitacao) {
      blocks.push({ type: 'acknowledgement', text: 'Tomei conhecimento em ___/___/______', signer: str(v.destinatarioNome) || 'O destinatário' });
    }
    return blocks;
  },
});
