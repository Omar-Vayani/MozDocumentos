// Shared building blocks for the "familia" documents: lease letters and records
// (senhorio / inquilino), family agreements and everyday private contracts.
// Party identification, closing clauses and signatures come from _contratos.ts.

import type { Block, DefaultsContext, FieldDef, SignatureColumn, TemplateContext, Values } from '../model';
import { BLANK, dateLong, isF, l, lineItems } from './_shared';
import { isEmpresa, papel, partyFields, partyName, semPonto, str, type Papel } from './_contratos';

export { str, semPonto };

// ---------------------------------------------------------------- Parties

/**
 * Party fields that take their defaults from the issuing profile only when the
 * profile is of the given kind ('pessoa' or 'empresa'); otherwise they start empty.
 * Lets a letter default the sender from the profile without also filling the recipient.
 */
export function partyFieldsWhen(p: string, kinds: ('pessoa' | 'empresa')[], opts: { conjuge?: boolean } = {}): FieldDef[] {
  const withProfile = partyFields(p, { fromProfile: true, conjuge: opts.conjuge });
  const plain = partyFields(p, { conjuge: opts.conjuge });
  return withProfile.map((f, i) => {
    const base = plain[i];
    return {
      ...f,
      default: (c: DefaultsContext) => {
        const use = c.profile && (kinds as string[]).includes(c.profile.kind) ? f.default : base.default;
        return typeof use === 'function' ? use(c) : use ?? '';
      },
    };
  });
}

/** Senhorio / Inquilino with articles and gender agreement. */
export function papeisArrendamento(v: Values): { S: Papel; I: Papel } {
  return { S: papel(v, 'senhorio', 'Senhorio', 'Senhoria'), I: papel(v, 'inquilino', 'Inquilino', 'Inquilina') };
}

/** Address of a party (individual's residence or company's seat). */
export function moradaParte(v: Values, p: string): string {
  return isEmpresa(v, p) ? semPonto(v[`${p}EmpresaSede`]) : semPonto(v[`${p}Morada`]);
}

/** "Exmo. Senhor" / "Exma. Senhora" / "Exmos. Senhores" for a party. */
export function saudacaoParte(v: Values, p: string): string {
  if (isEmpresa(v, p)) return 'Exmos. Senhores';
  return isF(v[`${p}Genero`]) ? 'Exma. Senhora' : 'Exmo. Senhor';
}

/** Recipient block lines for a party. */
export function destinatarioLinhas(v: Values, p: string): string[] {
  if (isEmpresa(v, p)) {
    return [str(v[`${p}EmpresaNome`]) || BLANK, str(v[`${p}RepNome`]) ? `A/C: ${str(v[`${p}RepNome`])}` : '', moradaParte(v, p)].filter(Boolean);
  }
  return [str(v[`${p}Nome`]) || BLANK, moradaParte(v, p)].filter(Boolean);
}

/**
 * Sender block for a letter written by an individual (or a company without
 * letterhead). Returns nothing when the company profile prints its letterhead.
 */
export function remetenteBlock(ctx: TemplateContext, p: string, telefone?: unknown): Block[] {
  const v = ctx.values;
  if (isEmpresa(v, p) && ctx.profile?.kind === 'empresa') return [];
  const linhas = [`**${partyName(v, p) || BLANK}**`, moradaParte(v, p), str(telefone) ? `Tel.: ${str(telefone)}` : ''].filter(Boolean);
  return [{ type: 'paragraph', id: 'remetente', text: linhas.join('\n'), align: 'left', size: 'small', editable: false }];
}

/** Short identification of a party who does not sign: name, ID or NUIT, address. */
export function identCurta(v: Values, p: string): string {
  if (isEmpresa(v, p)) {
    const nuit = str(v[`${p}EmpresaNuit`]);
    return [`**${str(v[`${p}EmpresaNome`]) || BLANK}**`, nuit ? `NUIT ${nuit}` : '', moradaParte(v, p) ? `com sede em ${moradaParte(v, p)}` : ''].filter(Boolean).join(', ');
  }
  const f = isF(v[`${p}Genero`]);
  const doc = str(v[`${p}DocNumero`]);
  const tipo = str(v[`${p}DocTipo`]);
  const docNome = tipo === 'Passaporte' ? 'Passaporte' : tipo === 'DIRE' ? 'DIRE' : 'Bilhete de Identidade';
  return [`**${str(v[`${p}Nome`]) || BLANK}**`, `${f ? 'portadora' : 'portador'} do ${docNome} n.º ${doc || BLANK}`, moradaParte(v, p) ? `residente em ${moradaParte(v, p)}` : ''].filter(Boolean).join(', ');
}

/** Signature column for a letter's sender. */
export function assinaturaCarta(ctx: TemplateContext, p: string, role: Papel): SignatureColumn {
  const v = ctx.values;
  if (isEmpresa(v, p)) {
    return {
      role: role.O,
      name: str(v[`${p}RepNome`]) || undefined,
      detail: [str(v[`${p}RepCargo`]), str(v[`${p}EmpresaNome`])].filter(Boolean).join(', ') || undefined,
      image: ctx.profile?.kind === 'empresa' ? 'both' : undefined,
    };
  }
  return { role: role.O, name: str(v[`${p}Nome`]) || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined };
}

// ---------------------------------------------------------------- Lease identification

/** Property and lease contract fields shared by the lease letters and records. */
export function arrendamentoFields(section: string, opts: { renda?: boolean; contrato?: boolean } = {}): FieldDef[] {
  const fields: FieldDef[] = [
    {
      name: 'imovelMorada',
      type: 'text',
      section,
      required: true,
      label: l('Morada do imóvel arrendado', 'Address of the leased property'),
      placeholder: l('Ex.: Rua da Resistência, n.º 512, flat 3, Bairro da Malhangalene, Maputo', 'E.g. street, number, flat, neighbourhood, city'),
    },
  ];
  if (opts.contrato !== false) {
    fields.push({
      name: 'contratoData',
      type: 'date',
      section,
      width: 'half',
      label: l('Data do contrato de arrendamento', 'Date of the lease'),
      help: l('A data em que o contrato foi assinado. Deixe em branco se não houver contrato escrito.', 'The date the lease was signed. Leave blank if there is no written lease.'),
    });
  }
  if (opts.renda) {
    fields.push({ name: 'rendaMensal', type: 'money', section, width: 'half', label: l('Renda mensal actual', 'Current monthly rent') });
  }
  return fields;
}

/** "o contrato de arrendamento celebrado em …, relativo ao imóvel sito em …" */
export function contratoTexto(v: Values, artigo: 'o' | 'do' | 'ao' = 'o'): string {
  const art = { o: 'o', do: 'do', ao: 'ao' }[artigo];
  const data = str(v.contratoData) ? ` celebrado em ${dateLong(v.contratoData)}` : '';
  return `${art} contrato de arrendamento${data}, relativo ao imóvel sito em ${semPonto(v.imovelMorada) || BLANK}`;
}

// ---------------------------------------------------------------- Children

export type Filho = { nome: string; genero: string; nascimento: string; documento: string };

export function filhosField(name: string, section: string, label = l('Filhos menores', 'Minor children')): FieldDef {
  return {
    name,
    type: 'lines',
    section,
    label,
    addLabel: l('Adicionar filho', 'Add child'),
    columns: [
      { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
      { name: 'genero', type: 'select', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }] },
      { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
      { name: 'documento', type: 'text', label: l('BI ou assento de nascimento n.º', 'ID or birth registration no.') },
    ],
    default: [{ nome: '', genero: 'M', nascimento: '', documento: '' }],
  };
}

export function filhos(v: unknown): Filho[] {
  return lineItems(v)
    .map((r) => ({ nome: str(r.nome), genero: str(r.genero), nascimento: str(r.nascimento), documento: str(r.documento) }))
    .filter((f) => f.nome);
}

/** "**Ana**, nascida a 3 de Maio de 2015, titular do BI n.º …" */
export function filhoTexto(f: Filho, docLabel = 'documento de identificação n.º'): string {
  const fem = isF(f.genero);
  return [`**${f.nome}**`, f.nascimento ? `${fem ? 'nascida' : 'nascido'} a ${dateLong(f.nascimento)}` : '', f.documento ? `${docLabel} ${f.documento}` : ''].filter(Boolean).join(', ');
}

/** "o menor" / "a menor" / "os menores" / "as menores". */
export function oMenor(lista: { genero: string }[]): { o: string; O: string; de: string; ao: string; plural: boolean } {
  const plural = lista.length > 1;
  const fem = lista.length > 0 && lista.every((f) => isF(f.genero));
  const o = plural ? (fem ? 'as menores' : 'os menores') : fem ? 'a menor' : 'o menor';
  const ao = o.startsWith('a') ? `à${o.slice(1)}` : `a${o}`;
  return { o, O: o.charAt(0).toUpperCase() + o.slice(1), de: `d${o}`, ao, plural };
}

// ---------------------------------------------------------------- Misc

/**
 * Keeps the closing blocks of a contract (the "Feito em…" paragraph, every row
 * of signatures, the spouse's consent and the notary box) together, so that no
 * signature row is left alone on the last page.
 */
export function fechoJunto(blocks: Block[]): Block[] {
  return blocks.map((b, i) => (i < blocks.length - 1 ? { ...b, keepWithNext: true } : b));
}

/** Ends the sentence with a full stop. */
export const ponto = (s: string) => (/[.!?:]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** Bullet list items from lines, each ending with ";" and the last with ".". */
export function itensLista(xs: string[]): string[] {
  return xs.map((s, i) => `${semPonto(s)}${i === xs.length - 1 ? '.' : ';'}`);
}
