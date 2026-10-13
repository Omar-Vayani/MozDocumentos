// Atestado de residência: an official act of a State or municipal organ (Chefe
// do Posto Administrativo, Chefe da Localidade, municipal administration),
// issued on the basis of the neighbourhood declaration and two witnesses.
// Community structures issue the "Declaração de Residência" instead.

import { isCommunityAuthority, isPublicBody } from '@/lib/storage/types';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, l, localField, moneyText, officialRef } from './_shared';
import { numeroField, signatarioColumn, signatarioFields } from './_estado';
import { enderecoBairro, finalidadeField, finalidadeFrase, identificacao, pessoaFields, str, testemunhas, testemunhasField } from './_comunidade';

const mesAno = (ym: unknown) => {
  const s = str(ym);
  return /^\d{4}-\d{2}$/.test(s) ? dateLong(`${s}-01`).replace(/^\d+\.?º? de /, '') : '';
};

export default defineTemplate({
  id: 'atestado-de-residencia',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Atestado', 'Certificate') },
    { id: 'cidadao', title: l('Requerente', 'Applicant'), personRole: 'outro' },
    { id: 'residencia', title: l('Residência', 'Residence') },
    { id: 'prova', title: l('Base do atestado', 'Supporting evidence') },
    { id: 'finalidade', title: l('Finalidade e emolumentos', 'Purpose and fees') },
    { id: 'assinatura', title: l('Assinatura', 'Signature') },
  ],
  fields: [
    numeroField('documento', l('Número do atestado', 'Certificate number')),
    localField(),
    dateField('data'),
    {
      name: 'circunscricao',
      type: 'text',
      section: 'documento',
      label: l('Circunscrição', 'Area of jurisdiction'),
      placeholder: l('Ex.: Posto Administrativo Municipal de KaMpfumo', 'E.g. Municipal Administrative Post of KaMpfumo'),
      help: l('Área de competência do órgão que atesta.', 'Area of competence of the certifying body.'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.firma ?? '' : ''),
    },
    ...pessoaFields(['nome', 'genero', 'pai', 'mae', 'nascimento', 'naturalidade', 'nacionalidade', 'estadoCivil', 'docTipo', 'docNumero', 'docEmissao', 'docLocal']),
    { name: 'bairro', type: 'text', section: 'residencia', required: true, label: l('Bairro', 'Neighbourhood'), placeholder: l('Ex.: Bairro da Malhangalene «A»', 'E.g. Bairro da Malhangalene') },
    ...pessoaFields(['quarteirao', 'casa', 'rua'], 'cidadao', 'residencia'),
    { name: 'desde', type: 'month', section: 'residencia', width: 'half', required: true, label: l('Reside desde', 'Living there since') },
    { name: 'declaracaoBairroNumero', type: 'text', section: 'prova', width: 'half', required: true, label: l('Declaração do bairro n.º', 'Neighbourhood declaration no.') },
    { name: 'declaracaoBairroData', type: 'date', section: 'prova', width: 'half', label: l('Data da declaração do bairro', 'Date of the declaration') },
    testemunhasField('prova'),
    finalidadeField(),
    { name: 'emolumentos', type: 'money', section: 'finalidade', width: 'half', label: l('Emolumentos pagos (opcional)', 'Fees paid (optional)'), help: l('Só se houver taxa fixada por diploma ou postura.', 'Only if a fee is set by law or by-law.') },
    { name: 'guiaNumero', type: 'text', section: 'finalidade', width: 'half', label: l('Guia / recibo n.º', 'Receipt no.'), showIf: (v) => !!str(v.emolumentos) },
    ...signatarioFields('assinatura', l('Cargo de quem atesta', 'Position of the certifying official')),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!isPublicBody(ctx.profile) || isCommunityAuthority(ctx.profile)) {
      w.push({
        level: 'warning',
        message: l(
          'O atestado é um acto de um órgão do Estado ou do Município (Posto Administrativo, Localidade, administração municipal). Use o perfil dessa entidade pública. A estrutura do bairro passa a «Declaração de Residência».',
          'The certificate is an act of a State or municipal body. Use that public body’s profile. Neighbourhood structures issue the “Declaração de Residência”.',
        ),
      });
    }
    const min = ctx.legal.value<{ meses: number; testemunhas: number }>('residenciaTempoMinimo');
    if (testemunhas(v).length < min.testemunhas) {
      w.push({ level: 'warning', field: 'testemunhas', message: l(`É prática exigir ${min.testemunhas} testemunhas que conheçam o requerente; indique-as.`, `It is usual to require ${min.testemunhas} witnesses who know the applicant.`) });
    }
    if (!str(v.declaracaoBairroNumero)) w.push({ level: 'warning', field: 'declaracaoBairroNumero', message: l('Indique a declaração do bairro em que o atestado se baseia.', 'Enter the neighbourhood declaration this certificate relies on.') });
    if (!str(v.cidadaoDocNumero)) w.push({ level: 'warning', field: 'cidadaoDocNumero', message: l('Indique o documento de identificação do requerente.', 'Enter the applicant’s ID document.') });
    w.push({ level: 'info', message: l('Os requisitos (testemunhas, comprovativo do Imposto Pessoal Autárquico, taxa) variam por município e distrito.', 'Requirements (witnesses, municipal tax receipt, fee) vary by municipality and district.') });
    return w;
  },

  personName: (v) => v.cidadaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const gen = v.cidadaoGenero;
    const end = [enderecoBairro(v), str(v.bairro)].filter(Boolean).join(', ');
    const circ = str(v.circunscricao);
    const ts = testemunhas(v);
    const tsTxt = (ts.length ? ts : [{ nome: '', documento: '' }, { nome: '', documento: '' }])
      .map((t) => `**${t.nome || BLANK}**${t.documento ? `, portador(a) do BI n.º ${t.documento}` : ''}`)
      .join(' e ');
    const decl = `declaração da estrutura do bairro n.º ${str(v.declaracaoBairroNumero) || BLANK}${v.declaracaoBairroData ? `, de ${dateLong(v.declaracaoBairroData)}` : ''}`;

    const blocks: Block[] = [
      { type: 'title', text: 'Atestado de Residência', subtitle: str(v.numero) ? officialRef(ctx, 'Atestado', v.numero).replace(/^Atestado n\.º/, 'N.º') : undefined },
      {
        type: 'paragraph',
        id: 'atestado',
        text: `Atesta-se, ${finalidadeFrase(v)}, que ${identificacao(v)}, reside em ${end || BLANK}${circ ? `, na área ${/^(Posto|Distrito|Bairro|Município|Conselho)/i.test(circ) ? 'do' : 'da'} ${circ}` : ''}, desde ${mesAno(v.desde) || BLANK}.`,
        en: 'It is certified that the applicant lives at the address stated, within this area, since the date given.',
      },
      {
        type: 'paragraph',
        id: 'base',
        text: `O presente atestado é passado com base na ${decl} e nas declarações das testemunhas ${tsTxt}, que afirmaram conhecer ${g(gen, 'o requerente', 'a requerente')} e a sua residência.`,
        en: 'Issued on the basis of the neighbourhood declaration and the statements of the witnesses named.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, passa-se o presente atestado, que vai assinado e autenticado com o carimbo a óleo em uso neste serviço.',
        keepWithNext: true,
        en: 'Signed and authenticated with the office stamp.',
      },
      { type: 'signatures', placeDate: `${ctx.place}, ${dateLong(v.data)}`, columns: [signatarioColumn(v)] },
    ];
    if (str(v.emolumentos)) {
      blocks.push({ type: 'note', text: `Emolumentos: ${moneyText(v.emolumentos)}${str(v.guiaNumero) ? ` (guia n.º ${str(v.guiaNumero)})` : ''}.`, en: 'Fees paid.' });
    }
    return blocks;
  },
});
