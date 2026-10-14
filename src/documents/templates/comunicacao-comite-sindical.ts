// Comunicação da composição do comité sindical (or union delegate): the union
// tells the employer who the elected members are, within the legal period
// after the election. Members are protected against transfer and prejudice.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, l, lineItems, localField } from './_shared';
import { nosTermos, refCite, str } from './_rh-politicas';

export default defineTemplate({
  id: 'comunicacao-comite-sindical',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'sindicato', title: l('Sindicato', 'Union') },
    { id: 'comite', title: l('Comité eleito', 'Elected committee') },
  ],
  fields: [
    localField(),
    dateField('data'),
    { name: 'sindicatoNome', type: 'text', section: 'sindicato', required: true, label: l('Sindicato', 'Union'), default: (c) => c.profile?.firma || '', placeholder: l('Ex.: Sindicato Nacional dos Trabalhadores da Indústria de Construção Civil (SINTICIM)', 'E.g. national construction workers’ union') },
    { name: 'empresaNome', type: 'text', section: 'sindicato', required: true, label: l('Empresa', 'Company') },
    { name: 'tipoOrgao', type: 'radio', section: 'comite', label: l('Órgão', 'Body'), default: 'comite', options: [
      { value: 'comite', label: l('Comité sindical', 'Union committee') },
      { value: 'delegado', label: l('Delegado sindical', 'Union delegate') },
    ] },
    { name: 'dataEleicao', type: 'date', section: 'comite', width: 'half', required: true, label: l('Data da eleição', 'Election date') },
    { name: 'mandato', type: 'text', section: 'comite', width: 'half', label: l('Mandato', 'Term'), placeholder: l('Ex.: 2026–2029', 'E.g. 2026–2029') },
    {
      name: 'membros',
      type: 'lines',
      section: 'comite',
      label: l('Membros eleitos', 'Elected members'),
      addLabel: l('Adicionar membro', 'Add member'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'cargo', type: 'text', label: l('Cargo no comité', 'Role'), placeholder: l('Ex.: Secretário', 'E.g. Secretary') },
        { name: 'funcao', type: 'text', label: l('Função na empresa', 'Job in the company') },
      ],
      default: [],
    },
    { name: 'signatario', type: 'text', section: 'sindicato', width: 'half', label: l('Quem assina pelo sindicato', 'Signed for the union by') },
    { name: 'signatarioCargo', type: 'text', section: 'sindicato', width: 'half', label: l('Cargo', 'Position'), placeholder: l('Ex.: Secretário-Geral', 'E.g. General Secretary') },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const prazo = ctx.legal.value<{ comunicacaoDias: number }>('rhpEstruturasSindicais').comunicacaoDias;
    if (v.dataEleicao && v.data && diffDays(v.dataEleicao, v.data) > prazo) {
      w.push({ level: 'warning', field: 'data', message: l(`O sindicato comunica a identificação dos membros no prazo máximo de ${prazo} dias após a constituição (${cite('rhpEstruturasSindicais')}).`, `The union must notify the members within ${prazo} days of the election.`) });
    }
    return w;
  },
  personName: (v) => v.empresaNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const membros = lineItems(v.membros).filter((r) => str(r.nome));
    const delegado = v.tipoOrgao === 'delegado';
    const blocks: Block[] = [
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: 'À', lines: ['Direcção', str(v.empresaNome) || BLANK] },
      { type: 'subject', text: delegado ? 'Comunicação do delegado sindical eleito' : 'Comunicação da composição do comité sindical' },
      { type: 'salutation', text: 'Exmos. Senhores,' },
      {
        type: 'paragraph',
        id: 'comunicacao',
        text: `${nosTermos('rhpEstruturasSindicais').replace(/^n/, 'N')}, ${str(v.sindicatoNome).replace(/^(O|A) /, (m) => m.toLowerCase()) || BLANK} comunica a V. Ex.as que, em reunião dos trabalhadores seus membros realizada em ${dateLong(v.dataEleicao)}, ${delegado ? 'foi eleito o delegado sindical' : 'foi eleito o comité sindical'} ${str(v.empresaNome) ? `de ${str(v.empresaNome)}` : 'dessa empresa'}${str(v.mandato) ? `, para o mandato ${str(v.mandato)}` : ''}, ${delegado ? 'que é o seguinte' : 'com a seguinte composição'}:`,
        en: 'The union notifies the elected union committee (or delegate) and its members.',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'Nome', width: 0.42 },
          { label: 'Cargo', width: 0.24 },
          { label: 'Função na empresa', width: 0.34 },
        ],
        rows: (membros.length ? membros : [{ nome: BLANK }]).map((r) => [str(r.nome), str(r.cargo) || '—', str(r.funcao) || '—']),
      },
      {
        type: 'paragraph',
        id: 'protecao',
        text: `A partir desta data, ${delegado ? 'o delegado sindical representa' : 'o comité sindical representa'} o sindicato e os trabalhadores junto da Empresa, devendo ser consultado nos casos previstos na lei. Recordamos que os seus membros não podem ser transferidos sem consulta prévia ao sindicato nem prejudicados pelo exercício das funções sindicais ${refCite('rhpProtecaoSindical')}.`,
        en: 'The committee represents the union and employees; its members are protected against transfer and prejudice.',
        keepWithNext: true,
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', align: 'left', keepWithNext: true },
      { type: 'signatures', columns: [{ role: 'Pelo Sindicato', name: str(v.signatario) || undefined, detail: str(v.signatarioCargo) || undefined, image: 'both' }] },
      { type: 'acknowledgement', text: 'Recebido em ___/___/______', signer: 'Pela Empresa' },
    ];
    return blocks;
  },
});
