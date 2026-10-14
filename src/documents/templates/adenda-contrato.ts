// Adenda (aditamento) a contrato: amends one or more clauses of an existing
// contract of any kind (lease, services, loan, sale…), keeping the rest in force.

import { defineTemplate, type Block, type ClauseItem, type Values, type Warning } from '../model';
import { BLANK, cite, dateLong, isF, l, lineItems } from './_shared';
import { assinatura, documentoFields, fecho, isEmpresa, partesBlocks, partyFields, partyName, partyWarnings, testemunhasField, type Papel } from './_contratos';
import { fechoJunto, partyFieldsWhen, semPonto, str } from './_familia';

function designacao(v: Values, p: string, fallback: string): Papel {
  const n = str(v[`${p}Designacao`]) || fallback;
  const fem = !isEmpresa(v, p) && isF(v[`${p}Genero`]);
  return fem
    ? { n, f: true, o: `a ${n}`, O: `A ${n}`, de: `da ${n}`, ao: `à ${n}`, pelo: `pela ${n}` }
    : { n, f: false, o: `o ${n}`, O: `O ${n}`, de: `do ${n}`, ao: `ao ${n}`, pelo: `pelo ${n}` };
}

const designacaoField = (p: string, def: string) => ({
  name: `${p}Designacao`,
  type: 'text' as const,
  section: p,
  width: 'half' as const,
  label: l('Designação no contrato', 'Name used in the contract'),
  help: l('Como a parte é chamada no contrato original. Ex.: Senhorio, Inquilina, Prestador, Cliente.', 'How the party is called in the original contract. E.g. Landlord, Tenant, Provider, Client.'),
  default: def,
});

const terceiraOn = (f: ReturnType<typeof partyFields>[number]) => ({ ...f, showIf: (v: Values) => Boolean(v.terceira) && (f.showIf ? f.showIf(v) : true) });

export default defineTemplate({
  id: 'adenda-contrato',
  family: 'contrato',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'parteA', title: l('Primeira parte', 'First party'), personRole: 'outro' },
    { id: 'parteB', title: l('Segunda parte', 'Second party'), personRole: 'outro' },
    { id: 'parteC', title: l('Terceira parte (opcional)', 'Third party (optional)'), personRole: 'outro' },
    { id: 'contrato', title: l('Contrato alterado', 'Contract amended') },
    { id: 'alteracoes', title: l('Alterações', 'Amendments') },
  ],
  fields: [
    ...documentoFields(),
    { name: 'numero', type: 'text', section: 'documento', width: 'half', label: l('Número da adenda', 'Amendment number'), default: '1' },
    ...partyFieldsWhen('parteA', ['pessoa', 'empresa']),
    designacaoField('parteA', 'Primeiro Outorgante'),
    ...partyFieldsWhen('parteB', []),
    designacaoField('parteB', 'Segundo Outorgante'),
    { name: 'terceira', type: 'toggle', section: 'parteC', label: l('Há uma terceira parte (ex.: fiador)', 'There is a third party (e.g. guarantor)') },
    ...partyFields('parteC').map(terceiraOn),
    { ...designacaoField('parteC', 'Fiador'), showIf: (v: Values) => Boolean(v.terceira) },
    {
      name: 'contratoTitulo',
      type: 'text',
      section: 'contrato',
      required: true,
      label: l('Contrato', 'Contract'),
      placeholder: l('Ex.: contrato de arrendamento para habitação', 'E.g. residential lease'),
      default: 'contrato de arrendamento',
    },
    { name: 'contratoData', type: 'date', section: 'contrato', width: 'half', required: true, label: l('Data do contrato', 'Date of the contract') },
    { name: 'contratoRef', type: 'text', section: 'contrato', width: 'half', label: l('Referência (opcional)', 'Reference (optional)') },
    { name: 'contratoObjecto', type: 'text', section: 'contrato', label: l('Objecto (opcional)', 'Subject (optional)'), placeholder: l('Ex.: imóvel sito na Rua da Resistência, n.º 512, Maputo', 'E.g. property at …') },
    {
      name: 'motivo',
      type: 'textarea',
      section: 'alteracoes',
      rows: 2,
      label: l('Porquê (considerando, opcional)', 'Why (recital, optional)'),
      placeholder: l('Ex.: as partes acordaram prorrogar o prazo e actualizar a renda.', 'E.g. the parties agreed to extend the term and update the rent.'),
    },
    {
      name: 'alteracoes',
      type: 'lines',
      section: 'alteracoes',
      required: true,
      label: l('Cláusulas alteradas', 'Clauses amended'),
      addLabel: l('Adicionar alteração', 'Add amendment'),
      help: l('Escreva a nova redacção completa da cláusula. Para acrescentar uma cláusula nova, escolha «Aditar».', 'Write the full new wording. To add a new clause, choose “Add”.'),
      columns: [
        {
          name: 'accao',
          type: 'select',
          label: l('Acção', 'Action'),
          options: [
            { value: 'alterar', label: l('Alterar', 'Amend') },
            { value: 'aditar', label: l('Aditar (nova)', 'Add (new)') },
            { value: 'revogar', label: l('Revogar (eliminar)', 'Revoke (delete)') },
          ],
        },
        { name: 'clausula', type: 'text', label: l('Cláusula', 'Clause'), placeholder: l('Ex.: Cláusula Terceira (Prazo)', 'E.g. Clause 3 (Term)') },
        { name: 'texto', type: 'textarea', label: l('Nova redacção', 'New wording') },
      ],
      default: [{ accao: 'alterar', clausula: '', texto: '' }],
    },
    { name: 'efeitos', type: 'date', section: 'alteracoes', width: 'half', label: l('Produz efeitos a partir de', 'Effective from'), help: l('Vazio = data da assinatura.', 'Empty = signing date.') },
    { name: 'formaEspecial', type: 'toggle', section: 'alteracoes', label: l('O contrato original teve assinaturas reconhecidas no notário', 'The original contract had notarised signatures'), help: l('A adenda deve ter a mesma forma: acrescenta o espaço para o reconhecimento.', 'The amendment needs the same form: adds space for certification.') },
    testemunhasField('alteracoes'),
  ],

  warnings: (v) => {
    const w: Warning[] = [...partyWarnings(v, 'parteA', 'primeira parte', 'first party'), ...partyWarnings(v, 'parteB', 'segunda parte', 'second party')];
    if (!lineItems(v.alteracoes).some((r) => str(r.clausula) || str(r.texto))) w.push({ level: 'error', field: 'alteracoes', message: l('Indique as cláusulas alteradas.', 'Enter the clauses amended.') });
    w.push({ level: 'info', message: l(`A adenda deve ter a mesma forma do contrato original e ser assinada por todas as partes (${cite('famAlteracaoContrato')}). Se o contrato tinha fiador, ele também deve assinar para a fiança abranger as alterações.`, 'The amendment must have the same form as the original and be signed by all parties. If there was a guarantor, they should sign too.') });
    return w;
  },

  personName: (v) => partyName(v, 'parteB') || undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const A = designacao(v, 'parteA', 'Primeiro Outorgante');
    const B = designacao(v, 'parteB', 'Segundo Outorgante');
    const C = designacao(v, 'parteC', 'Fiador');
    const alt = lineItems(v.alteracoes).filter((r) => str(r.clausula) || str(r.texto));
    const contrato = `${semPonto(v.contratoTitulo) || 'contrato'}${str(v.contratoRef) ? ` (ref. ${str(v.contratoRef)})` : ''} celebrado em ${dateLong(v.contratoData)}${str(v.contratoObjecto) ? `, relativo a ${semPonto(v.contratoObjecto).replace(/^(o|a)\s+/i, '')}` : ''}`;
    const numero = str(v.numero);

    const clauses: ClauseItem[] = (alt.length ? alt : [{ accao: 'alterar', clausula: '', texto: '' }]).map((r, i) => {
      const cl = semPonto(r.clausula) || BLANK;
      const texto = str(r.texto);
      if (r.accao === 'revogar') {
        return { id: `alt${i}`, heading: 'Revogação', text: `É revogada a ${cl} do contrato.`, en: `Clause ${cl} is revoked.` };
      }
      if (r.accao === 'aditar') {
        return { id: `alt${i}`, heading: 'Aditamento', text: `É aditada ao contrato a ${cl}, com a seguinte redacção:\n«${texto || BLANK}»`, en: `A new clause ${cl} is added with the wording shown.` };
      }
      return { id: `alt${i}`, heading: 'Alteração', text: `A ${cl} do contrato passa a ter a seguinte redacção:\n«${texto || BLANK}»`, en: `Clause ${cl} is replaced by the wording shown.` };
    });
    clauses.push(
      {
        id: 'efeitos',
        heading: 'Produção de efeitos',
        text: `A presente adenda produz efeitos a partir de ${str(v.efeitos) ? dateLong(v.efeitos) : 'a data da sua assinatura'} e faz parte integrante do contrato.`,
        en: `This amendment takes effect from ${v.efeitos || 'signing'} and forms part of the contract.`,
      },
      {
        id: 'manutencao',
        heading: 'Disposições mantidas',
        text: 'Mantêm-se em vigor, em tudo o que não for contrariado pela presente adenda, todas as demais cláusulas do contrato, que as partes ratificam.',
        en: 'All other clauses of the contract remain in force and are confirmed.',
      },
    );

    const parties = [
      { p: 'parteA', role: A, en: 'First party' },
      { p: 'parteB', role: B, en: 'Second party' },
      ...(v.terceira ? [{ p: 'parteC', role: C, en: 'Third party' }] : []),
    ];
    const cols = [assinatura(ctx, 'parteA', A, true), assinatura(ctx, 'parteB', B)];
    if (v.terceira) cols.push(assinatura(ctx, 'parteC', C));

    const blocks: Block[] = [
      { type: 'title', text: `Adenda${numero ? ` n.º ${numero}` : ''} ao ${semPonto(v.contratoTitulo) || 'contrato'}`, subtitle: `celebrado em ${dateLong(v.contratoData)}` },
      ...partesBlocks(v, parties),
      {
        type: 'paragraph',
        id: 'considerando',
        text: `Considerando que as partes celebraram entre si o ${contrato}${str(v.motivo) ? `, e que ${semPonto(v.motivo).charAt(0).toLowerCase()}${semPonto(v.motivo).slice(1)}` : ''}, acordam na presente adenda, que se rege pelas cláusulas seguintes:`,
        en: 'Whereas the parties signed the contract identified, they agree this amendment on the following terms:',
      },
      { type: 'numberedClauses', style: 'clausula', items: clauses },
      ...fechoJunto(fecho(ctx, cols, { notario: v.formaEspecial ? 'Reconhecimento presencial das assinaturas, com a mesma forma do contrato original.' : undefined })),
    ];
    return blocks;
  },
});
