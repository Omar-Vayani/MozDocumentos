import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { BLANK, dateField, dateLong, employerRep, g, l, localField, placeDate, refField, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- local helpers

const lowerFirst = (s: string) => {
  const t = s.trim();
  return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
};
const noDot = (s: string) => s.trim().replace(/[.;]$/, '');

/** "junto da Autoridade Tributária", "junto do INSS" — contracts a leading article, else names the entity. */
function juntoDe(entidade: string): string {
  const e = entidade.trim();
  const m = /^(a|o|as|os)\s+(.+)$/i.exec(e);
  if (m) {
    const art = m[1].toLowerCase();
    return `junto ${({ a: 'da', o: 'do', as: 'das', os: 'dos' } as Record<string, string>)[art]} **${m[2]}**`;
  }
  return `junto da entidade **${e || BLANK}**`;
}

function issuerText(p: Profile | null): { pt: string; en: string; fem: boolean } {
  if (!p) return { pt: `A **${BLANK}**`, en: 'The company', fem: true };
  if (p.kind === 'pessoa') {
    const parts = [
      `Eu, **${p.nome || BLANK}**`,
      p.docNumero ? `titular do ${p.docTipo ?? 'BI'} n.º ${p.docNumero}` : '',
      p.nuit ? `NUIT ${p.nuit}` : '',
      addressLine(p) ? `residente em ${addressLine(p)}` : '',
    ].filter(Boolean);
    return { pt: parts.join(', '), en: p.nome || 'The undersigned', fem: false };
  }
  const parts = [
    `A **${profileDisplayName(p) || BLANK}**`,
    addressLine(p) ? `com sede em ${addressLine(p)}` : '',
    p.nuit ? `com o NUIT ${p.nuit}` : '',
    p.representanteNome ? `neste acto representada por ${p.representanteNome}${p.representanteCargo ? `, ${p.representanteCargo}` : ''}` : '',
  ].filter(Boolean);
  return { pt: parts.join(', '), en: profileDisplayName(p) || 'The company', fem: true };
}

export default defineTemplate({
  id: 'credencial',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'credenciado', title: l('Pessoa credenciada', 'Authorised person'), personRole: 'trabalhador' },
    { id: 'credencial', title: l('Entidade e finalidade', 'Entity and purpose') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    ...workerFields(['nome', 'genero', 'cargo', 'docTipo', 'docNumero', 'docEmissao', 'docLocal'], 'credenciado', 'credenciado'),
    {
      name: 'entidade',
      type: 'text',
      section: 'credencial',
      required: true,
      label: l('Entidade junto da qual vai actuar', 'Entity where the person will act'),
      placeholder: l('Ex.: a Autoridade Tributária de Moçambique — Direcção da Área Fiscal do 1.º Bairro', 'E.g. the Tax Authority — local tax office'),
      help: l(
        'Escreva com o artigo para o texto ficar correcto: «a Autoridade Tributária…», «o Instituto Nacional de Segurança Social», «o Banco Comercial e de Investimentos, S.A.».',
        'Start with the Portuguese article (a / o) so the sentence reads correctly.',
      ),
    },
    {
      name: 'finalidade',
      type: 'textarea',
      section: 'credencial',
      required: true,
      rows: 4,
      label: l('Para quê', 'Purpose'),
      help: l(
        'Continua a frase «…credencia … para…». Ex.: «proceder ao levantamento de documentos», «submeter processos e assinar o respectivo expediente», «tratar de assuntos relacionados com a declaração periódica do IVA». Um acto por linha.',
        'Continues “…authorises … to…”. E.g. “collect documents”, “submit applications”. One act per line.',
      ),
    },
    {
      name: 'validade',
      type: 'date',
      section: 'credencial',
      width: 'half',
      label: l('Válida até (opcional)', 'Valid until (optional)'),
      help: l('Sem data, a credencial vale para o fim indicado.', 'Without a date it is valid for the stated purpose.'),
    },
    {
      name: 'assinaturaCredenciado',
      type: 'toggle',
      section: 'credencial',
      default: true,
      label: l('Incluir a assinatura da pessoa credenciada', 'Include the authorised person’s signature'),
      help: l('Permite à entidade comparar a assinatura com a do documento de identificação.', 'Lets the entity compare the signature with the ID document.'),
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!v.credenciadoDocNumero) {
      w.push({ level: 'warning', field: 'credenciadoDocNumero', message: l('Falta o número do documento de identificação: a entidade vai pedi-lo.', 'The ID number is missing: the entity will ask for it.') });
    }
    if (!v.entidade) w.push({ level: 'warning', field: 'entidade', message: l('Indique a entidade.', 'State the entity.') });
    if (!splitLines(v.finalidade).length) w.push({ level: 'warning', field: 'finalidade', message: l('Indique para que serve a credencial.', 'State what the authorisation is for.') });
    if (v.validade && v.data && v.validade < v.data) {
      w.push({ level: 'error', field: 'validade', message: l('A data de validade é anterior à data do documento.', 'The expiry date is before the document date.') });
    }
    if (ctx.profile?.kind === 'empresa' && !ctx.profile.representanteNome) {
      w.push({ level: 'info', message: l('Indique no perfil quem assina pela empresa.', 'Set who signs for the company in the profile.') });
    }
    if (ctx.profile?.kind !== 'empresa') {
      w.push({ level: 'info', message: l('A credencial é normalmente emitida por uma empresa ou instituição. Para uma pessoa, use uma procuração.', 'Credentials are usually issued by a company. For an individual, use a power of attorney.') });
    }
    return w;
  },

  personName: (v) => v.credenciadoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.credenciadoGenero;
    const issuer = issuerText(ctx.profile);
    const empresa = ctx.profile?.kind === 'empresa';
    const fins = splitLines(v.finalidade).map(noDot);
    const tratamento = g(ge, 'o Senhor', 'a Senhora');
    const doc = v.credenciadoDocNumero
      ? `${g(ge, 'portador', 'portadora')} do ${v.credenciadoDocTipo || 'BI'} n.º ${v.credenciadoDocNumero}${v.credenciadoDocEmissao ? `, emitido em ${dateLong(v.credenciadoDocEmissao)}` : ''}${v.credenciadoDocLocal ? `, em ${v.credenciadoDocLocal}` : ''}`
      : `${g(ge, 'portador', 'portadora')} do BI n.º ${BLANK}`;
    const cargo = v.credenciadoCargo ? `, ${v.credenciadoCargo}${empresa ? ' desta empresa' : ''}` : '';
    const representar = empresa ? 'em seu nome e representação' : 'em meu nome e representação';
    const verbo = empresa ? 'credencia' : 'credencio';

    const intro = `${issuer.pt}, ${verbo} ${tratamento} **${v.credenciadoNome || BLANK}**${cargo}, ${doc}, para, ${representar}, ${juntoDe(String(v.entidade || ''))}`;
    const en = `${issuer.en} authorises ${g(ge, 'Mr', 'Ms')} ${v.credenciadoNome || '…'}${v.credenciadoCargo ? `, ${v.credenciadoCargo}` : ''}, holder of ID no. ${v.credenciadoDocNumero || '…'}, to act on ${empresa ? 'its' : 'my'} behalf before ${v.entidade || 'the entity named'}`;

    const blocks: Block[] = [{ type: 'title', text: 'Credencial' }];
    if (fins.length > 1) {
      blocks.push(
        { type: 'paragraph', id: 'credencia', text: `${intro}, praticar os seguintes actos:`, en: `${en}, to do the following:` },
        { type: 'list', style: 'alpha', items: fins.map((f, i) => `${lowerFirst(f)}${i === fins.length - 1 ? '.' : ';'}`) },
      );
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'credencia',
        text: `${intro}, ${fins.length ? lowerFirst(fins[0]) : BLANK}.`,
        en: `${en}, for the stated purpose.`,
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'validade',
      text: v.validade
        ? `A presente credencial é válida até ${dateLong(v.validade)}.`
        : 'A presente credencial é válida apenas para o fim nela indicado.',
      en: v.validade ? `This authorisation is valid until ${v.validade}.` : 'This authorisation is valid only for the stated purpose.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'colaboracao',
      text: `Solicita-se às entidades a quem esta credencial for apresentada que prestem ${g(ge, 'ao credenciado', 'à credenciada')} a colaboração necessária.`,
      en: 'The authorities to whom this authorisation is presented are asked to give the bearer the necessary assistance.',
    });

    const rep = employerRep(ctx);
    const issuerSig: SignatureColumn = empresa
      ? { role: rep.cargo || 'Pela empresa', name: rep.nome || undefined, image: 'both' }
      : { role: g(ctx.profile?.genero, 'O Emitente', 'A Emitente'), name: ctx.profile?.nome || undefined, image: 'both' };
    const columns: SignatureColumn[] = [issuerSig];
    if (v.assinaturaCredenciado) {
      columns.push({ role: g(ge, 'O Credenciado', 'A Credenciada'), name: v.credenciadoNome || undefined });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: empresa
          ? 'Por ser verdade, passa-se a presente credencial, que vai assinada e autenticada com o carimbo em uso nesta empresa.'
          : 'Por ser verdade, passo a presente credencial, que vai por mim assinada.',
        en: empresa
          ? 'In witness whereof, this authorisation is issued, signed and stamped with the company seal.'
          : 'In witness whereof, I issue and sign this authorisation.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns },
    );
    return blocks;
  },
});
