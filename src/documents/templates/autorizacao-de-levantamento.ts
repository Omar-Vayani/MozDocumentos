import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, localField, placeDate } from './_shared';
import { autorFields, autorSignature, autorWarnings, docText, lowerFirst, opt, pessoaDesc, str } from './_cidadao';

const OBJECTOS = [
  opt('encomenda', 'Encomenda ou correspondência', 'Parcel or mail'),
  opt('documento', 'Documento emitido em meu nome', 'Document issued in my name'),
  opt('escolar', 'Certificado, diploma ou declaração escolar', 'School certificate or diploma'),
  opt('resultados', 'Resultados de exames médicos', 'Medical test results'),
  opt('bens', 'Bens ou equipamento deixados em reparação', 'Items left for repair'),
  opt('outro', 'Outro', 'Other'),
];
const ARTIGO: Record<string, string> = {
  encomenda: 'a encomenda',
  documento: 'o documento',
  escolar: 'o certificado',
  resultados: 'os resultados de exames',
  bens: 'os bens',
  outro: '',
};

const pf = (v: Values, p: string) => v[`${p}Genero`] === 'F';

export default defineTemplate({
  id: 'autorizacao-de-levantamento',
  family: 'declaracao',
  page: 'A5',
  letterhead: false,
  sections: [
    { id: 'autor', title: l('Quem autoriza', 'Who authorises'), personRole: 'outro' },
    { id: 'autorizado', title: l('Pessoa autorizada', 'Authorised person'), personRole: 'representante' },
    { id: 'levantamento', title: l('O que levantar', 'What to collect') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...autorFields(['nome', 'genero', 'estadoCivil', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'morada', 'telefone'], { required: ['nome', 'docNumero'] }),
    ...autorFields(['nome', 'genero', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'telefone'], { section: 'autorizado', prefix: 'autorizado', required: ['nome', 'docNumero'] }).map((f) => ({ ...f, default: f.name === 'autorizadoGenero' ? 'M' : f.name === 'autorizadoDocTipo' ? 'BI' : '' })),
    { name: 'relacao', type: 'text', section: 'autorizado', width: 'half', label: l('Relação (opcional)', 'Relationship (optional)'), placeholder: l('Ex.: meu irmão', 'E.g. my brother') },
    { name: 'objecto', type: 'select', section: 'levantamento', label: l('O que levantar', 'What to collect'), options: OBJECTOS, default: 'encomenda' },
    { name: 'descricao', type: 'text', section: 'levantamento', required: true, label: l('Descrição', 'Description'), placeholder: l('Ex.: com o código de rastreio RR123456789MZ, vinda de Portugal', 'E.g. tracking code RR123456789MZ') },
    { name: 'entidade', type: 'text', section: 'levantamento', required: true, label: l('Onde', 'Where'), placeholder: l('Ex.: Correios de Moçambique — Estação Central de Maputo', 'E.g. the post office') },
    { name: 'validade', type: 'radio', section: 'levantamento', label: l('Validade', 'Validity'), options: [opt('unica', 'Só para este levantamento', 'This collection only'), opt('data', 'Até uma data', 'Until a date')], default: 'unica' },
    { name: 'validadeData', type: 'date', section: 'levantamento', width: 'half', label: l('Válida até', 'Valid until'), showIf: (v) => v.validade === 'data' },
    { name: 'assinaAutorizado', type: 'toggle', section: 'levantamento', default: true, label: l('Espaço para a assinatura da pessoa autorizada', 'Space for the authorised person’s signature') },
    localField('documento'),
    dateField('data'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = autorWarnings(ctx, { doc: true });
    if (!str(v.autorizadoNome)) w.push({ level: 'warning', field: 'autorizadoNome', message: l('Indique quem fica autorizado.', 'State who is authorised.') });
    if (!str(v.autorizadoDocNumero)) w.push({ level: 'warning', field: 'autorizadoDocNumero', message: l('Indique o documento da pessoa autorizada: vai ter de o mostrar.', 'Give the authorised person’s ID: they must show it.') });
    if (v.objecto === 'documento') w.push({ level: 'warning', field: 'objecto', message: l('O Bilhete de Identidade, o passaporte e a carta de condução são, em regra, levantados pelo próprio. Confirme antes com o serviço.', 'ID cards, passports and driving licences are usually collected in person. Check with the office first.') });
    w.push({ level: 'info', field: 'entidade', message: l(`Junte cópia do seu documento de identificação. Bancos, notários e alguns serviços públicos exigem procuração com assinatura reconhecida (${cite('codigoCivilProcuracao')}); nesse caso use a «Procuração».`, 'Attach a copy of your ID. Banks, notaries and some public offices require a power of attorney with a certified signature.') });
    return w;
  },

  personName: (v) => v.autorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fa = pf(v, 'autorizado');
    const art = ARTIGO[String(v.objecto)] ?? '';
    const desc = str(v.descricao).replace(/\.$/, '');
    const objecto = art ? `${art}${desc ? ` ${/^(com|de|do|da|n\.º|referente|emitid|enviad|vind)/i.test(desc) ? desc : `(${desc})`}` : ''}` : lowerFirst(desc) || BLANK;
    const autorizado = `${fa ? 'a Senhora' : 'o Senhor'} **${str(v.autorizadoNome) || BLANK}**${str(v.relacao) ? `, ${lowerFirst(str(v.relacao))}` : ''}, ${docText(v, 'autorizado')}${str(v.autorizadoTelefone) ? `, telefone ${str(v.autorizadoTelefone)}` : ''}`;
    const validade = v.validade === 'data' ? `válida até ${dateLong(v.validadeData)}` : 'válida apenas para este levantamento';

    const blocks: Block[] = [
      { type: 'title', text: 'Autorização', subtitle: 'Para levantamento' },
      {
        type: 'paragraph',
        id: 'autorizacao',
        text: `Eu, ${pessoaDesc(v, 'autor', { contactos: true })}, autorizo ${autorizado}, a levantar em meu nome, junto de ${str(v.entidade) || BLANK}, ${objecto}, e a assinar o respectivo comprovativo de entrega.`,
        en: 'I authorise the person identified to collect the item stated on my behalf and sign the delivery receipt.',
      },
      {
        type: 'paragraph',
        id: 'validade',
        text: `A presente autorização é ${validade}. Junto cópia do meu documento de identificação.`,
        en: 'This authorisation is valid as stated. A copy of my ID is attached.',
        keepWithNext: true,
      },
    ];
    const cols = [autorSignature(ctx, 'O Autorizante', 'A Autorizante')];
    if (v.assinaAutorizado !== false) cols.push({ role: fa ? 'A Autorizada' : 'O Autorizado', name: str(v.autorizadoNome) || undefined, detail: str(v.autorizadoDocNumero) ? `${str(v.autorizadoDocTipo) || 'BI'} n.º ${str(v.autorizadoDocNumero)}` : undefined });
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: cols });
    return blocks;
  },
});
