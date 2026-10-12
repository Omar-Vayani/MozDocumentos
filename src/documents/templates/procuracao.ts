import { diffDays } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, g, isF, l, localField, splitLines, workerFields } from './_shared';

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
    doc,
    get('Nuit') ? `titular do NUIT ${get('Nuit')}` : '',
    `residente em ${get('Morada') || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

const PESSOA_KEYS = [
  'nome', 'genero', 'estadoCivil', 'nacionalidade', 'naturalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'nuit', 'morada',
] as const;

const trimEnd = (s: string) => s.trim().replace(/[.;,:]+$/, '');

const ENT_F = /^(direc[cç][aã]o|conservat[oó]ria|autoridade|embaixada|universidade|escola|reparti[cç][aã]o|c[aâ]mara|secretaria|administra[cç][aã]o|pol[ií]cia|empresa|sociedade|ag[eê]ncia|delega[cç][aã]o|procuradoria|comiss[aã]o|associa[cç][aã]o|cooperativa|funda[cç][aã]o|inspec[cç][aã]o|alf[aâ]ndega|edm|at)\b/i;
const ENT_M = /^(banco|instituto|minist[eé]rio|tribunal|conselho|servi[cç]o|munic[ií]pio|registo|gabinete|hospital|consulado|arquivo|inss|inatter|fundo|centro|departamento|governo|comando|cart[oó]rio|millennium|bci|standard|absa|moza|fnb|ecobank|nedbank|bni)\b/i;

/** "de"/"da"/"do" + entity name: "da Direcção Nacional…", "do Banco…", "de Maria Silva". */
function deEntidade(e: string): string {
  const m = /^(a|o|as|os)\s+(.*)$/i.exec(e);
  if (m) return `d${m[1].toLowerCase()} ${m[2]}`;
  if (ENT_F.test(e)) return `da ${e}`;
  if (ENT_M.test(e)) return `do ${e}`;
  return `de ${e}`;
}

// ---------------------------------------------------------------- Template

export default defineTemplate({
  id: 'procuracao',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    {
      id: 'outorgante',
      title: l('Quem dá os poderes (Outorgante)', 'Person granting the powers (Grantor)'),
      description: l('Normalmente, é o próprio utilizador. Os dados vêm do seu perfil pessoal.', 'Usually yourself. Details come from your personal profile.'),
      personRole: 'outro',
    },
    {
      id: 'procurador',
      title: l('Quem recebe os poderes (Procurador)', 'Person receiving the powers (Attorney)'),
      personRole: 'representante',
    },
    { id: 'poderes', title: l('Poderes', 'Powers') },
    { id: 'opcoes', title: l('Validade e opções', 'Validity and options') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da procuração', 'Date of the power of attorney')),
    ...fromPersonalProfile(workerFields([...PESSOA_KEYS], 'outorgante', 'outorgante'), 'outorgante'),
    ...workerFields([...PESSOA_KEYS], 'procurador', 'procurador'),
    {
      name: 'finalidade',
      type: 'select',
      section: 'poderes',
      required: true,
      label: l('Para que é a procuração', 'What the power of attorney is for'),
      default: 'instituicao',
      options: [
        { value: 'instituicao', label: l('Tratar de assuntos junto de uma instituição', 'Handle matters with an institution') },
        { value: 'documentos', label: l('Requerer e levantar documentos', 'Apply for and collect documents') },
        { value: 'banco', label: l('Movimentar conta bancária', 'Operate a bank account') },
        { value: 'compraVenda', label: l('Representar numa compra e venda', 'Represent in a purchase or sale') },
        { value: 'viatura', label: l('Vender uma viatura', 'Sell a vehicle') },
        { value: 'especificos', label: l('Apenas os poderes específicos que vou indicar', 'Only the specific powers I list') },
        { value: 'geral', label: l('Procuração geral (administração de bens)', 'General power of attorney (managing assets)') },
      ],
      help: l(
        'Escolha o fim principal. Pode acrescentar outros poderes no campo seguinte.',
        'Choose the main purpose. You can add further powers in the next field.',
      ),
    },
    {
      name: 'entidade',
      type: 'text',
      section: 'poderes',
      label: l('Entidade (opcional)', 'Institution (optional)'),
      placeholder: l('Ex.: Direcção Nacional de Identificação Civil; Banco Comercial e de Investimentos', 'E.g. National Civil Identification Directorate; a bank'),
      help: l('Onde o procurador vai actuar. Deixe vazio para qualquer entidade.', 'Where the attorney will act. Leave empty for any institution.'),
      showIf: (v) => v.finalidade !== 'geral',
    },
    {
      name: 'contaBancaria',
      type: 'text',
      section: 'poderes',
      width: 'half',
      label: l('Número da conta bancária', 'Bank account number'),
      showIf: (v) => v.finalidade === 'banco',
    },
    {
      name: 'compraVendaPosicao',
      type: 'radio',
      section: 'poderes',
      width: 'half',
      label: l('O outorgante vai', 'The grantor is'),
      default: 'vender',
      options: [
        { value: 'vender', label: l('Vender', 'Selling') },
        { value: 'comprar', label: l('Comprar', 'Buying') },
      ],
      showIf: (v) => v.finalidade === 'compraVenda',
    },
    {
      name: 'compraVendaBem',
      type: 'textarea',
      section: 'poderes',
      rows: 2,
      label: l('Bem a comprar ou vender', 'Item to be bought or sold'),
      placeholder: l(
        'Ex.: imóvel sito no Bairro da Liberdade, Matola, descrito na Conservatória do Registo Predial da Matola sob o n.º …',
        'E.g. property in Bairro da Liberdade, Matola, registered at the Land Registry under no. …',
      ),
      showIf: (v) => v.finalidade === 'compraVenda',
    },
    { name: 'viaturaMarca', type: 'text', section: 'poderes', width: 'half', label: l('Marca e modelo', 'Make and model'), placeholder: l('Ex.: Toyota Hilux', 'E.g. Toyota Hilux'), showIf: (v) => v.finalidade === 'viatura' },
    { name: 'viaturaMatricula', type: 'text', section: 'poderes', width: 'half', label: l('Matrícula', 'Registration plate'), placeholder: l('Ex.: AAA 123 MC', 'E.g. AAA 123 MC'), showIf: (v) => v.finalidade === 'viatura' },
    { name: 'viaturaQuadro', type: 'text', section: 'poderes', width: 'half', label: l('N.º do quadro (chassis) — opcional', 'Chassis number — optional'), showIf: (v) => v.finalidade === 'viatura' },
    {
      name: 'poderesEspecificos',
      type: 'textarea',
      section: 'poderes',
      rows: 4,
      label: l('Poderes específicos', 'Specific powers'),
      help: l(
        'Um poder por linha, começando pelo verbo. Ex.: "requerer a segunda via do Bilhete de Identidade"; "assinar o contrato de fornecimento de energia".',
        'One power per line, starting with the verb. E.g. "apply for a replacement ID card"; "sign the electricity supply contract".',
      ),
    },
    {
      name: 'validade',
      type: 'date',
      section: 'opcoes',
      width: 'half',
      label: l('Válida até (opcional)', 'Valid until (optional)'),
      help: l('Sem data, a procuração vale até ser revogada.', 'Without a date, it stays valid until revoked.'),
    },
    {
      name: 'substabelecer',
      type: 'toggle',
      section: 'opcoes',
      label: l('O procurador pode passar os poderes a outra pessoa (substabelecer)', 'The attorney may delegate the powers to someone else'),
      help: l('Se desligado, o documento diz expressamente que não pode.', 'If off, the document states that delegation is not allowed.'),
    },
    {
      name: 'espacoReconhecimento',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Deixar espaço para o reconhecimento notarial da assinatura', 'Leave space for the notary to certify the signature'),
    },
  ],

  computed: (v) => ({
    // Lower-case the first letter ("Requerer…" → "requerer…") unless it starts an acronym.
    especificos: splitLines(v.poderesEspecificos)
      .map(trimEnd)
      .filter(Boolean)
      .map((s) => (/^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)),
  }),

  warnings: (v, { computed: c }) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          'Muitas entidades (bancos, conservatórias, notários, serviços públicos) só aceitam a procuração com a assinatura reconhecida por notário. No reconhecimento, o notário cobra os emolumentos e o imposto do selo devidos. Confirme antes de a entregar.',
          'Many institutions (banks, registries, public services) only accept a power of attorney with the signature certified by a notary. Check before submitting it.',
        ),
      },
    ];
    for (const [p, nome] of [['outorgante', 'outorgante'], ['procurador', 'procurador']] as const) {
      if (!v[`${p}DocNumero`]) {
        w.push({
          level: 'warning',
          field: `${p}DocNumero`,
          message: l(`Falta o número do documento de identificação do ${nome}.`, `The ${p === 'outorgante' ? 'grantor' : 'attorney'}’s ID number is missing.`),
        });
      }
      if (!v[`${p}Morada`]) {
        w.push({
          level: 'warning',
          field: `${p}Morada`,
          message: l(`Falta a morada do ${nome}.`, `The ${p === 'outorgante' ? 'grantor' : 'attorney'}’s address is missing.`),
        });
      }
    }
    if (!v.outorganteNuit) {
      w.push({ level: 'info', field: 'outorganteNuit', message: l('Falta o NUIT do outorgante. Algumas entidades exigem-no.', 'The grantor’s NUIT is missing. Some institutions require it.') });
    }
    if (v.outorganteNome && v.procuradorNome && String(v.outorganteNome).trim().toLowerCase() === String(v.procuradorNome).trim().toLowerCase()) {
      w.push({ level: 'error', field: 'procuradorNome', message: l('O outorgante e o procurador não podem ser a mesma pessoa.', 'The grantor and the attorney cannot be the same person.') });
    }
    if (v.finalidade === 'banco') {
      w.push({
        level: 'warning',
        field: 'finalidade',
        message: l(
          'Os bancos exigem normalmente o seu próprio formulário de procuração ou de autorização, assinado na agência. Confirme com o banco antes de usar este documento.',
          'Banks usually require their own power of attorney or authorisation form, signed at the branch. Check with the bank before using this document.',
        ),
      });
    }
    if (v.finalidade === 'geral') {
      w.push({
        level: 'info',
        field: 'finalidade',
        message: l(
          'Uma procuração geral abrange, em regra, apenas actos de administração. Para vender, comprar ou onerar bens, indique esses poderes de forma específica.',
          'A general power of attorney normally covers only acts of administration. To sell, buy or mortgage assets, list those powers specifically.',
        ),
      });
    }
    if (v.finalidade === 'especificos' && c.especificos.length === 0) {
      w.push({ level: 'error', field: 'poderesEspecificos', message: l('Indique os poderes que confere ao procurador.', 'List the powers you are giving the attorney.') });
    }
    if (v.finalidade === 'compraVenda') {
      w.push({
        level: 'warning',
        field: 'finalidade',
        message: l(
          `Para comprar ou vender um imóvel, a procuração tem de ter a forma exigida para a escritura: lavrada no notário, autenticada ou com reconhecimento presencial da assinatura (${cite('procuracaoForma')}).`,
          'To buy or sell real estate, the power of attorney must have the form required for the deed: drawn up, authenticated or with the signature certified in person by a notary.',
        ),
      });
    }
    if (v.finalidade === 'viatura') {
      w.push({
        level: 'info',
        field: 'finalidade',
        message: l(
          'Para o registo da venda, a Conservatória do Registo Automóvel pode exigir o reconhecimento presencial da assinatura do outorgante.',
          'For the sale to be registered, the Motor Vehicle Registry may require the grantor’s signature to be certified in person.',
        ),
      });
    }
    if (v.finalidade === 'viatura' && !v.viaturaMatricula) {
      w.push({ level: 'warning', field: 'viaturaMatricula', message: l('Indique a matrícula da viatura.', 'Enter the vehicle registration plate.') });
    }
    if (v.validade && v.data && diffDays(v.data, v.validade) < 0) {
      w.push({ level: 'error', field: 'validade', message: l('A data de validade é anterior à data da procuração.', 'The expiry date is before the date of the power of attorney.') });
    }
    return w;
  },

  personName: (v) => v.outorganteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fP = isF(v.procuradorGenero);
    const oOut = g(v.outorganteGenero, 'o Outorgante', 'a Outorgante');
    const doOut = g(v.outorganteGenero, 'do Outorgante', 'da Outorgante');
    const peloOut = g(v.outorganteGenero, 'pelo Outorgante', 'pela Outorgante');
    const oProc = fP ? 'a Procuradora' : 'o Procurador';
    const entidade = String(v.entidade ?? '').trim();
    const junto = entidade ? `junto ${deEntidade(entidade)}` : 'junto de quaisquer serviços públicos, entidades privadas ou instituições';

    // Main powers, as sub-items of the grant.
    const poderes: string[] = [];
    switch (v.finalidade) {
      case 'instituicao':
        poderes.push(
          `tratar de todos os assuntos do interesse ${doOut} ${junto}, podendo requerer, apresentar e levantar documentos, prestar declarações, pagar taxas e emolumentos, assinar requerimentos e termos e praticar tudo o mais que se mostre necessário a esse fim`,
        );
        break;
      case 'documentos':
        poderes.push(
          `requerer, levantar e receber, ${junto}, quaisquer documentos emitidos em nome ${doOut}, pagar as respectivas taxas e emolumentos e assinar os competentes recibos e termos de entrega`,
        );
        break;
      case 'banco':
        poderes.push(
          `movimentar a conta bancária${v.contaBancaria ? ` n.º ${String(v.contaBancaria).trim()}` : ''} de que ${oOut} é titular${entidade ? ` junto ${/^banco\b/i.test(entidade) || /^(o|a)\s/i.test(entidade) ? deEntidade(entidade) : `do banco ${entidade}`}` : ''}, podendo efectuar depósitos, levantamentos e transferências, requisitar extractos e cadernetas de cheques, e assinar todos os documentos que para o efeito lhe forem exigidos`,
        );
        break;
      case 'compraVenda': {
        const bem = trimEnd(String(v.compraVendaBem ?? '')) || BLANK;
        const vender = v.compraVendaPosicao !== 'comprar';
        poderes.push(
          `${vender ? 'vender' : 'comprar'}, pelo preço e nas condições que tiver por convenientes, o seguinte bem: ${bem}`,
          `negociar e assinar o contrato-promessa e o contrato definitivo de compra e venda, ${vender ? 'receber o preço e dar quitação' : 'pagar o preço e receber a respectiva quitação'}`,
          `requerer quaisquer registos, certidões e documentos e praticar todos os actos necessários junto de conservatórias, cartórios notariais, serviços de finanças${entidade ? `, ${entidade}` : ''} e demais entidades competentes`,
        );
        break;
      }
      case 'viatura': {
        const ident = [
          v.viaturaMarca ? `de marca e modelo ${String(v.viaturaMarca).trim()}` : '',
          `com a matrícula ${String(v.viaturaMatricula ?? '').trim() || BLANK}`,
          v.viaturaQuadro ? `e o quadro n.º ${String(v.viaturaQuadro).trim()}` : '',
        ]
          .filter(Boolean)
          .join(', ');
        poderes.push(
          `vender, a quem e pelo preço que tiver por conveniente, a viatura ${ident}, propriedade ${doOut}`,
          'assinar a declaração de venda e o requerimento de registo de propriedade a favor do comprador, receber o preço e dar quitação',
          `entregar a viatura e os respectivos documentos e praticar todos os actos necessários junto da Conservatória do Registo Automóvel${entidade ? `, ${entidade}` : ''} e demais entidades competentes`,
        );
        break;
      }
      case 'geral':
        poderes.push(
          `gerir e administrar todos os bens ${doOut}, receber rendimentos e créditos e dar quitação, pagar dívidas, impostos e encargos, e representar ${oOut} perante quaisquer serviços públicos, instituições e entidades privadas, requerendo e assinando o que for necessário`,
        );
        break;
      default:
        break;
    }
    poderes.push(...ctx.computed.especificos);
    const lista = poderes.length ? poderes : [BLANK];
    const items = lista.map((p, i) => `${p}${i === lista.length - 1 ? '.' : ';'}`);
    const unico = items.length === 1;

    const blocks: Block[] = [
      { type: 'title', text: 'Procuração' },
      {
        type: 'paragraph',
        id: 'constituicao',
        text: `${identificacao(v, 'outorgante')}, pelo presente instrumento, e nos termos do ${cite('codigoCivilProcuracao')}, constitui ${fP ? 'sua bastante procuradora' : 'seu bastante procurador'} ${identificacao(v, 'procurador')}, a quem confere os poderes necessários para, em seu nome e representação, ${unico ? items[0] : 'praticar os actos seguintes:'}`,
        en: `By this instrument, the grantor named above appoints the person named above as their attorney, with the powers needed to act in the grantor’s name and on the grantor’s behalf${unico ? ' as set out above.' : ' to do the following:'}`,
      },
      ...(unico ? [] : [{ type: 'list', style: 'alpha', items } as Block]),
      {
        type: 'paragraph',
        id: 'actosNecessarios',
        text: `Para o efeito, ${oProc} pode assinar e apresentar todos os requerimentos, declarações e documentos e praticar todos os actos que se mostrem necessários ao bom e integral cumprimento do presente mandato.`,
        en: 'To this end, the attorney may sign and submit all applications, statements and documents and carry out any act needed to fully perform this mandate.',
      },
      v.substabelecer
        ? {
            type: 'paragraph',
            id: 'substabelecimento',
            text: `${oProc.charAt(0).toUpperCase()}${oProc.slice(1)} pode substabelecer, no todo ou em parte, com ou sem reserva, os poderes ora conferidos.`,
            en: 'The attorney may delegate these powers, in whole or in part, with or without reservation.',
          }
        : {
            type: 'paragraph',
            id: 'substabelecimento',
            text: `Os poderes ora conferidos são pessoais e não podem ser substabelecidos.`,
            en: 'The powers granted are personal and may not be delegated.',
          },
      {
        type: 'paragraph',
        id: 'validade',
        text: v.validade
          ? `A presente procuração é válida até ${dateLong(v.validade)}, caducando nessa data, salvo revogação anterior.`
          : `A presente procuração mantém-se válida até ser revogada ${peloOut}.`,
        en: v.validade ? `This power of attorney is valid until ${v.validade}, unless revoked earlier.` : 'This power of attorney remains valid until revoked by the grantor.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: `Por ser verdade e para produzir os devidos efeitos, vai a presente procuração ser assinada ${peloOut}.`,
        en: 'In witness whereof, this power of attorney is signed by the grantor.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: g(v.outorganteGenero, 'O Outorgante', 'A Outorgante'), name: v.outorganteNome || undefined }],
      },
    ];

    if (v.espacoReconhecimento) {
      blocks.push(
        {
          type: 'note',
          text: '**Reconhecimento notarial da assinatura** (quando exigido pela entidade destinatária):',
          en: 'Notarial certification of the signature (where required by the receiving institution):',
          keepWithNext: true,
        },
        { type: 'spacer', size: 'large' },
        { type: 'spacer', size: 'large' },
      );
    } else {
      blocks.push({
        type: 'note',
        text: `Algumas entidades exigem que a assinatura ${doOut} seja reconhecida por notário.`,
        en: 'Some institutions require the grantor’s signature to be certified by a notary.',
      });
    }
    return blocks;
  },
});
