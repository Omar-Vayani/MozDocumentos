import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, isF, l, localField, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- Local helpers

const PROFILE_VALUES: Record<string, (p: Profile) => string | undefined> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  DocTipo: (p) => p.docTipo,
  DocNumero: (p) => p.docNumero,
  DocEmissao: (p) => p.docEmissao,
  DocLocal: (p) => p.docLocal,
  Nuit: (p) => p.nuit,
  EstadoCivil: (p) => p.estadoCivil,
  Nacionalidade: (p) => p.nacionalidade,
  Naturalidade: (p) => p.naturalidade,
  Morada: (p) => addressLine(p),
};

/** Defaults the author's fields from a personal profile (kind 'pessoa'). */
function fromPersonalProfile(fields: FieldDef[], prefix: string): FieldDef[] {
  return fields.map((f) => {
    const pick = PROFILE_VALUES[f.name.slice(prefix.length)];
    if (!pick) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        const fromProfile = c.profile?.kind === 'pessoa' ? pick(c.profile) : '';
        if (fromProfile) return fromProfile;
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

/** Full identification of a person, notarial style. Missing document data prints a blank line to fill in. */
function identificacao(v: Values, p: string): string {
  const get = (k: string) => String(v[`${p}${k}`] ?? '').trim();
  const f = isF(get('Genero'));
  const ec = get('EstadoCivil');
  const estado = !ec ? '' : ec === 'união de facto' ? 'em união de facto' : f ? ec.replace(/o$/, 'a') : ec;
  const emissao = [get('DocLocal') ? `em ${get('DocLocal')}` : '', get('DocEmissao') ? `a ${dateLong(get('DocEmissao'))}` : '']
    .filter(Boolean)
    .join(', ');
  const doc = `${f ? 'portadora' : 'portador'} do ${DOC_NOME[get('DocTipo')] ?? 'Bilhete de Identidade'} n.º ${get('DocNumero') || BLANK}${emissao ? `, emitido ${emissao}` : ''}`;
  return [
    `**${get('Nome') || BLANK}**`,
    estado,
    get('Nacionalidade') ? `de nacionalidade ${get('Nacionalidade')}` : '',
    get('Naturalidade') ? `natural de ${get('Naturalidade')}` : '',
    get('Profissao') ? `de profissão ${get('Profissao')}` : '',
    doc,
    get('Nuit') ? `titular do NUIT ${get('Nuit')}` : '',
    `residente em ${get('Morada') || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

const ENT_F = /^(direc[cç][aã]o|conservat[oó]ria|autoridade|embaixada|universidade|escola|reparti[cç][aã]o|c[aâ]mara|secretaria|administra[cç][aã]o|pol[ií]cia|empresa|sociedade|ag[eê]ncia|delega[cç][aã]o|procuradoria|comiss[aã]o|associa[cç][aã]o|cooperativa|funda[cç][aã]o|inspec[cç][aã]o|alf[aâ]ndega|edm|at)\b/i;
const ENT_M = /^(banco|instituto|minist[eé]rio|tribunal|conselho|servi[cç]o|munic[ií]pio|registo|gabinete|hospital|consulado|arquivo|inss|inatter|fundo|centro|departamento|governo|comando|cart[oó]rio|millennium|bci|standard|absa|moza|fnb|ecobank|nedbank|bni)\b/i;

/** "de"/"da"/"do" + entity name: "da Embaixada…", "do Banco…", "de Maria Silva". */
function deEntidade(e: string): string {
  const m = /^(a|o|as|os)\s+(.*)$/i.exec(e);
  if (m) return `d${m[1].toLowerCase()} ${m[2]}`;
  if (ENT_F.test(e)) return `da ${e}`;
  if (ENT_M.test(e)) return `do ${e}`;
  return `de ${e}`;
}

/** Normalises a statement: drops a leading "que", trailing punctuation, lower-cases the first word. */
function afirmacao(s: string): string {
  let t = s.trim().replace(/[.;,:]+$/, '').replace(/^que\s+/i, '');
  if (/^\p{Lu}\p{Ll}/u.test(t)) t = t.charAt(0).toLowerCase() + t.slice(1);
  return t;
}

const PESSOA_KEYS = [
  'nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada',
] as const;

// ---------------------------------------------------------------- Template

export default defineTemplate({
  id: 'compromisso-de-honra',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    {
      id: 'declarante',
      title: l('Declarante', 'Declarant'),
      description: l('Os dados vêm do seu perfil pessoal. Pode alterá-los.', 'Details come from your personal profile. You can change them.'),
      personRole: 'outro',
    },
    { id: 'declaracao', title: l('Declaração', 'Statement') },
  ],
  fields: [
    localField(),
    dateField(),
    ...fromPersonalProfile(workerFields([...PESSOA_KEYS], 'declarante', 'declarante'), 'declarante'),
    {
      name: 'declaranteProfissao',
      type: 'text',
      section: 'declarante',
      width: 'half',
      personKey: 'cargo',
      label: l('Profissão (opcional)', 'Occupation (optional)'),
    },
    {
      name: 'texto',
      type: 'textarea',
      section: 'declaracao',
      required: true,
      rows: 5,
      label: l('O que declara', 'What you declare'),
      placeholder: l('que resido no Bairro da Malhangalene, Cidade de Maputo, desde Janeiro de 2019', 'that I have lived in Malhangalene, Maputo City, since January 2019'),
      help: l(
        'Escreva cada facto numa linha, começando por "que". Ex.: "que resido em…"; "que não tenho antecedentes criminais"; "que sou solteiro e não vivo em união de facto"; "que não exerço actividade remunerada".',
        'One fact per line, starting with "que" (that). E.g. "que resido em…" (that I live at…); "que não tenho antecedentes criminais" (that I have no criminal record); "que sou solteiro" (that I am single).',
      ),
    },
    {
      name: 'finalidade',
      type: 'text',
      section: 'declaracao',
      label: l('Para que serve (opcional)', 'Purpose (optional)'),
      placeholder: l('Ex.: instruir o processo de candidatura a bolsa de estudo', 'E.g. support a scholarship application'),
      help: l('Complete a frase "A presente declaração destina-se a…".', 'Completes the sentence "This statement is intended to…".'),
    },
    {
      name: 'entidade',
      type: 'text',
      section: 'declaracao',
      label: l('Entidade a quem se destina (opcional)', 'Receiving institution (optional)'),
      placeholder: l('Ex.: Embaixada de Portugal em Maputo', 'E.g. Embassy of Portugal in Maputo'),
    },
  ],

  computed: (v) => ({
    afirmacoes: splitLines(v.texto).map(afirmacao).filter(Boolean),
  }),

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [];
    if (c.afirmacoes.length === 0) {
      w.push({ level: 'error', field: 'texto', message: l('Escreva o que pretende declarar.', 'Write what you want to declare.') });
    }
    if (!v.declaranteDocNumero) {
      w.push({ level: 'warning', field: 'declaranteDocNumero', message: l('Falta o número do documento de identificação.', 'The ID document number is missing.') });
    }
    if (!v.declaranteMorada) {
      w.push({ level: 'warning', field: 'declaranteMorada', message: l('Falta a morada do declarante.', 'The declarant’s address is missing.') });
    }
    if (/antecedentes|registo criminal|cadastro/i.test(String(v.texto ?? ''))) {
      w.push({
        level: 'info',
        field: 'texto',
        message: l(
          'Para provar a ausência de antecedentes criminais, muitas entidades exigem o certificado de registo criminal, e não apenas esta declaração.',
          'To prove a clean criminal record, many institutions require an official criminal record certificate, not only this statement.',
        ),
      });
    }
    w.push({
      level: 'info',
      message: l(
        'Algumas entidades exigem que a assinatura seja reconhecida por notário.',
        'Some institutions require the signature to be certified by a notary.',
      ),
    });
    return w;
  },

  personName: (v) => v.declaranteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const afirmacoes: string[] = ctx.computed.afirmacoes ?? [];
    const finalidade = String(v.finalidade ?? '').trim().replace(/[.;,:]+$/, '');
    const entidade = String(v.entidade ?? '').trim().replace(/[.;,:]+$/, '');
    const unica = afirmacoes.length <= 1;
    const primeira = afirmacoes[0] ?? '';

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração sob compromisso de honra' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: unica
          ? `Eu, ${identificacao(v, 'declarante')}, declaro, sob compromisso de honra, que${afirmacoes.length ? ` ${primeira}.` : ':'}`
          : `Eu, ${identificacao(v, 'declarante')}, declaro, sob compromisso de honra:`,
        en: unica
          ? 'I, the undersigned, identified above, declare on my honour that the statement above is true.'
          : 'I, the undersigned, identified above, declare on my honour:',
      },
    ];
    if (afirmacoes.length === 0) {
      // Nothing typed yet: leave lines to complete by hand.
      blocks.push({
        type: 'paragraph',
        id: 'linhasEmBranco',
        editable: false,
        align: 'left',
        text: Array.from({ length: 4 }, () => `${BLANK}${BLANK}${BLANK}${BLANK}`).join('\n\n'),
        en: '(Statement to be completed by hand.)',
      });
    }
    if (!unica) {
      blocks.push({
        type: 'list',
        style: 'alpha',
        items: afirmacoes.map((a, i) => `que ${a}${i === afirmacoes.length - 1 ? '.' : ';'}`),
      });
    }
    if (finalidade || entidade) {
      const fim = finalidade
        ? `A presente declaração destina-se a ${finalidade.replace(/^(a|para)\s+/i, '')}${entidade ? `, junto ${deEntidade(entidade)}` : ''}.`
        : `A presente declaração destina-se a ser apresentada junto ${deEntidade(entidade)}.`;
      blocks.push({
        type: 'paragraph',
        id: 'finalidade',
        text: fim,
        en: entidade ? `This statement is to be submitted to ${entidade}${finalidade ? ' for the purpose stated' : ''}.` : 'This statement is issued for the purpose stated.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, assino a presente declaração, ciente de que a prestação de falsas declarações me faz incorrer em responsabilidade civil e criminal, nos termos da lei.',
        en: 'In witness whereof I sign this statement, aware that making false statements gives rise to civil and criminal liability under the law.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: g(v.declaranteGenero, 'O Declarante', 'A Declarante'), name: v.declaranteNome || undefined }],
      },
    );
    return blocks;
  },
});
