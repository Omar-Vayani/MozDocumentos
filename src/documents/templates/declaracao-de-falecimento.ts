// Declaração de falecimento: the neighbourhood structure states that a resident
// died (at home or outside a health unit), as reported by a relative and
// confirmed by the community. Supporting evidence for the death registration at
// the civil registry, the funeral and allowances; never a death certificate.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, l, localField } from './_shared';
import { hora } from './_estado';
import {
  PARENTESCO_OPTIONS,
  assinaturaBlocks,
  assinaturaFields,
  avisoTaxa,
  comunidadeWarnings,
  enderecoBairro,
  finalidadeFrase,
  identificacao,
  neste,
  notaBlocks,
  numeroComunidadeField,
  numeroRef,
  pessoaFields,
  str,
  testemunhas,
  testemunhasField,
  unidadeField,
} from './_comunidade';

/** The relative and the witnesses sign on the same rows (three per row). */
function outrasAssinaturas(v: Record<string, any>): Block[] {
  const ts = testemunhas(v);
  const lista = ts.length ? ts : [{ nome: '', documento: '', morada: '' }, { nome: '', documento: '', morada: '' }];
  const cols: SignatureColumn[] = [
    { role: g(v.declaranteGenero, 'O Declarante', 'A Declarante'), name: str(v.declaranteNome) || undefined, detail: str(v.declaranteParentesco) || undefined },
    ...lista.map((t, i) => ({ role: `${i + 1}.ª Testemunha`, name: t.nome || undefined, detail: t.documento ? `BI n.º ${t.documento}` : undefined })),
  ];
  const out: Block[] = [];
  for (let i = 0; i < cols.length; i += 3) out.push({ type: 'signatures', columns: cols.slice(i, i + 3) });
  return out;
}

export default defineTemplate({
  id: 'declaracao-de-falecimento',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Declaração', 'Declaration') },
    { id: 'falecido', title: l('Pessoa falecida', 'Deceased') },
    { id: 'obito', title: l('Falecimento', 'Death') },
    { id: 'declarante', title: l('Familiar que informa', 'Relative reporting'), personRole: 'outro' },
    { id: 'finalidade', title: l('Finalidade', 'Purpose') },
    { id: 'assinatura', title: l('Assinaturas', 'Signatures') },
  ],
  fields: [
    numeroComunidadeField(),
    unidadeField(),
    localField(),
    dateField('data'),
    ...pessoaFields(['nome', 'genero', 'pai', 'mae', 'nascimento', 'idade', 'naturalidade', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'quarteirao', 'casa'], 'falecido', 'falecido', { nomeLabel: ['Nome completo da pessoa falecida', 'Full name of the deceased'] }),
    { name: 'dataObito', type: 'date', section: 'obito', width: 'half', required: true, label: l('Data do falecimento', 'Date of death') },
    { name: 'horaObito', type: 'text', section: 'obito', width: 'half', label: l('Hora (aproximada)', 'Time (approximate)'), placeholder: l('Ex.: 14:30', 'E.g. 14:30') },
    {
      name: 'localObito',
      type: 'text',
      section: 'obito',
      required: true,
      label: l('Local do falecimento', 'Place of death'),
      default: 'na sua residência',
      placeholder: l('Ex.: na sua residência', 'E.g. at home'),
    },
    {
      name: 'causa',
      type: 'radio',
      section: 'obito',
      label: l('Causa', 'Cause'),
      options: [
        { value: '', label: l('Não indicar (desconhecida desta estrutura)', 'Do not state (unknown to the structure)') },
        { value: 'familia', label: l('Indicar o que a família informa', 'State what the family reports') },
      ],
      default: '',
    },
    { name: 'causaFamilia', type: 'text', section: 'obito', label: l('O que a família informa', 'What the family reports'), placeholder: l('Ex.: doença prolongada', 'E.g. long illness'), showIf: (v) => v.causa === 'familia' },
    { name: 'conjuge', type: 'text', section: 'obito', label: l('Cônjuge ou companheiro(a) sobrevivo (opcional)', 'Surviving spouse or partner (optional)') },
    { name: 'filhos', type: 'number', section: 'obito', width: 'half', min: 0, label: l('Número de filhos (opcional)', 'Number of children (optional)') },
    ...pessoaFields(['nome', 'genero', 'docTipo', 'docNumero'], 'declarante', 'declarante', { nomeLabel: ['Nome do familiar', 'Relative’s name'] }),
    { name: 'declaranteParentesco', type: 'select', section: 'declarante', width: 'half', label: l('Parentesco com a pessoa falecida', 'Relationship'), options: PARENTESCO_OPTIONS.filter((o) => o.value !== 'chefe do agregado') },
    {
      name: 'finalidade',
      type: 'text',
      section: 'finalidade',
      required: true,
      label: l('Para que serve', 'Purpose'),
      default: 'registo do óbito na Conservatória do Registo Civil',
    },
    testemunhasField('assinatura'),
    ...assinaturaFields('assinatura', { visto: true, confirmacoes: true }),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = comunidadeWarnings(v, ctx);
    w.push({
      level: 'warning',
      message: l(
        'Morte violenta, acidente ou circunstâncias suspeitas: comunique à Polícia (PRM) e ao Ministério Público e não passe esta declaração.',
        'Violent, accidental or suspicious death: report it to the police and the Public Prosecutor and do not issue this declaration.',
      ),
    });
    w.push({ level: 'info', message: l('O óbito deve ser declarado na Conservatória do Registo Civil dentro do prazo legal. O INSS, os bancos e a herança exigem a certidão de óbito.', 'The death must be declared at the civil registry within the legal deadline. Social security, banks and inheritance require the death certificate.') });
    if (testemunhas(v).length < 2) w.push({ level: 'info', field: 'testemunhas', message: l('Junte duas testemunhas que presenciaram ou confirmam o falecimento.', 'Add two witnesses who saw or can confirm the death.') });
    w.push(avisoTaxa);
    return w;
  },

  personName: (v) => v.falecidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fg = v.falecidoGenero;
    const end = enderecoBairro(v, 'falecido');
    const horaTxt = str(v.horaObito) ? `, ${hora(v.horaObito, 'pelas').replace(/^pelas/, 'cerca das').replace(/^pela /, 'cerca da ')}` : '';
    const declarante = `**${str(v.declaranteNome) || BLANK}**${str(v.declaranteParentesco) ? `, ${str(v.declaranteParentesco)} ${g(fg, 'do falecido', 'da falecida')}` : ''}${str(v.declaranteDocNumero) ? `, ${v.declaranteGenero === 'F' ? 'portadora' : 'portador'} do ${str(v.declaranteDocTipo) || 'BI'} n.º ${str(v.declaranteDocNumero)}` : ''}`;
    const familia: string[] = [];
    if (str(v.conjuge)) familia.push(`${g(fg, 'deixa viúva ou companheira', 'deixa viúvo ou companheiro')} ${str(v.conjuge)}`);
    const filhos = Number(v.filhos);
    if (Number.isFinite(filhos) && filhos > 0) familia.push(`deixa ${filhos} ${filhos === 1 ? 'filho' : 'filhos'}`);
    const causa = v.causa === 'familia' && str(v.causaFamilia)
      ? `Segundo os familiares, o falecimento deveu-se a ${str(v.causaFamilia).replace(/[.;]+$/, '')}; esta estrutura não tem competência para atestar a causa da morte.`
      : 'A causa da morte não é do conhecimento desta estrutura.';

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Falecimento', subtitle: str(v.numero) ? numeroRef(ctx) : undefined },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `Declara-se, ${finalidadeFrase(v)}, que ${identificacao(v, 'falecido')}, residente que foi ${neste(str(v.unidade))}${end ? `, ${end}` : ''}, **faleceu no dia ${dateLong(v.dataObito)}**${horaTxt}, ${str(v.localObito) || BLANK}, conforme informação prestada por ${declarante}, e confirmada por esta estrutura.`,
        en: 'It is declared that the resident named died on the date and at the place stated, as reported by the relative and confirmed by the community structure.',
      },
    ];
    if (familia.length) blocks.push({ type: 'paragraph', id: 'familia', text: `${g(fg, 'O falecido', 'A falecida')} ${familia.join(' e ')}.`, en: 'Surviving family.' });
    blocks.push(
      { type: 'paragraph', id: 'causa', text: causa, en: 'The cause of death is not certified by the community structure.' },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, passa-se a presente declaração, que vai assinada e autenticada com o carimbo em uso.',
        keepWithNext: true,
        en: 'Signed and stamped.',
      },
      ...assinaturaBlocks(ctx),
      ...outrasAssinaturas(v),
      ...notaBlocks('M', 'Não substitui o certificado médico de óbito nem o assento de óbito.', 'pela família'),
    );
    return blocks;
  },
});
