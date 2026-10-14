import { diffDays } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type FieldDef, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, l, lineItems, localField, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- local helpers

const PROFILE_GET: Record<string, (p: Profile) => unknown> = {
  Nome: (p) => p.nome,
  Genero: (p) => p.genero,
  Morada: (p) => addressLine(p),
  Telefone: (p) => p.telefones,
};

/** Defaults the candidate's fields from a personal profile. */
function fromPessoaProfile(defs: FieldDef[], prefix: string): FieldDef[] {
  return defs.map((f) => {
    const get = PROFILE_GET[f.name.slice(prefix.length)];
    if (!get) return f;
    const fallback = f.default;
    return {
      ...f,
      default: (c: DefaultsContext) => {
        if (c.profile?.kind === 'pessoa') {
          const val = get(c.profile);
          if (val) return val;
        }
        return typeof fallback === 'function' ? fallback(c) : fallback ?? '';
      },
    };
  });
}

/** Splits text into paragraphs: by blank lines if there are any, otherwise by line. */
function paragraphs(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  const t = text.replace(/\r\n/g, '\n').trim();
  if (!t) return [];
  const parts = /\n\s*\n/.test(t) ? t.split(/\n\s*\n+/) : t.split(/\n+/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim().replace(/[;:]$/, '.') : `${s.trim()}.`);
const lowerFirst = (s: string) => {
  const t = s.trim();
  return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
};
const clean = (s: unknown) => String(s ?? '').trim().replace(/[.;,]$/, '');

/** "no jornal Notícias", "na página da empresa", "no LinkedIn"; keeps "em"/"no"/"na" typed by the user. */
function emFonte(f: string): string {
  if (/^(em|no|na|nos|nas|pelo|pela|através)\b/i.test(f)) return f;
  if (/^(jornal|site|s[íi]tio|portal|an[úu]ncio|LinkedIn|Facebook|Instagram|r[áa]dio|canal|quadro)\b/i.test(f)) return `no ${f}`;
  if (/^(p[áa]gina|revista|rede|televis[ãa]o|plataforma|imprensa|edi[çc][ãa]o)\b/i.test(f)) return `na ${f}`;
  return `em ${f}`;
}

export default defineTemplate({
  id: 'carta-de-candidatura',
  letterhead: false,
  sections: [
    { id: 'candidato', title: l('Os seus dados', 'Your details'), personRole: 'outro' },
    { id: 'destinatario', title: l('Empresa', 'Company') },
    { id: 'vaga', title: l('Vaga', 'Vacancy') },
    { id: 'perfil', title: l('Apresentação e qualificações', 'Profile and qualifications') },
    { id: 'documento', title: l('Anexos, local e data', 'Enclosures, place and date') },
  ],
  fields: [
    ...fromPessoaProfile(workerFields(['nome', 'genero', 'morada', 'telefone'], 'candidato', 'candidato'), 'candidato'),
    {
      name: 'candidatoEmail',
      type: 'email',
      section: 'candidato',
      width: 'half',
      label: l('Email', 'Email'),
      personKey: 'email',
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.email ?? '' : ''),
    },
    { name: 'empresa', type: 'text', section: 'destinatario', required: true, label: l('Nome da empresa ou instituição', 'Company or institution') },
    {
      name: 'departamento',
      type: 'text',
      section: 'destinatario',
      width: 'half',
      label: l('À atenção de (opcional)', 'For the attention of (optional)'),
      default: 'Departamento de Recursos Humanos',
    },
    { name: 'empresaMorada', type: 'text', section: 'destinatario', width: 'half', label: l('Morada (opcional)', 'Address (optional)') },
    {
      name: 'espontanea',
      type: 'toggle',
      section: 'vaga',
      label: l('Candidatura espontânea (sem anúncio de vaga)', 'Unsolicited application (no advertised vacancy)'),
      default: false,
    },
    {
      name: 'vagaNome',
      type: 'text',
      section: 'vaga',
      width: 'half',
      required: true,
      label: l('Vaga', 'Vacancy'),
      placeholder: l('Ex.: Técnico de Contabilidade', 'E.g. Accounting Technician'),
      showIf: (v) => !v.espontanea,
    },
    { name: 'vagaReferencia', type: 'text', section: 'vaga', width: 'half', label: l('Referência da vaga (opcional)', 'Vacancy reference (optional)'), showIf: (v) => !v.espontanea },
    {
      name: 'anuncioFonte',
      type: 'text',
      section: 'vaga',
      width: 'half',
      label: l('Onde viu o anúncio (opcional)', 'Where it was advertised (optional)'),
      placeholder: l('Ex.: jornal Notícias; página da empresa no LinkedIn', 'E.g. Notícias newspaper; company LinkedIn page'),
      showIf: (v) => !v.espontanea,
    },
    { name: 'anuncioData', type: 'date', section: 'vaga', width: 'half', label: l('Data do anúncio (opcional)', 'Advert date (optional)'), showIf: (v) => !v.espontanea },
    {
      name: 'areaInteresse',
      type: 'text',
      section: 'vaga',
      label: l('Área ou função de interesse', 'Area or role of interest'),
      placeholder: l('Ex.: contabilidade e finanças', 'E.g. accounting and finance'),
      showIf: (v) => Boolean(v.espontanea),
    },
    {
      name: 'apresentacao',
      type: 'textarea',
      section: 'perfil',
      rows: 3,
      label: l('Apresentação breve', 'Short introduction'),
      help: l(
        'Duas ou três frases: formação, situação actual e o que o motiva. Ex.: «Sou licenciado em Contabilidade e Auditoria pela Universidade Eduardo Mondlane e trabalho actualmente como assistente de contabilidade.»',
        'Two or three sentences: education, current situation and motivation.',
      ),
    },
    {
      name: 'qualificacoes',
      type: 'textarea',
      section: 'perfil',
      required: true,
      rows: 6,
      label: l('Qualificações e experiência', 'Qualifications and experience'),
      help: l(
        'Um ponto por linha, concreto e verificável. Ex.: «Experiência na preparação de declarações fiscais (IVA e IRPC)»; «Domínio do Primavera e do Excel avançado».',
        'One point per line, specific and verifiable.',
      ),
    },
    {
      name: 'formato',
      type: 'radio',
      section: 'perfil',
      width: 'half',
      label: l('Apresentar as qualificações', 'Show qualifications as'),
      options: [
        { value: 'lista', label: l('Em lista', 'A list') },
        { value: 'texto', label: l('Em parágrafos', 'Paragraphs') },
      ],
      default: 'lista',
    },
    {
      name: 'disponibilidade',
      type: 'select',
      section: 'perfil',
      width: 'half',
      label: l('Disponibilidade para começar', 'Availability to start'),
      options: [
        { value: 'imediata', label: l('Imediata', 'Immediately') },
        { value: 'data', label: l('A partir de uma data', 'From a date') },
        { value: 'outra', label: l('Outra (escrever)', 'Other (write)') },
      ],
      default: 'imediata',
    },
    {
      name: 'disponibilidadeData',
      type: 'date',
      section: 'perfil',
      width: 'half',
      label: l('Disponível a partir de', 'Available from'),
      showIf: (v) => v.disponibilidade === 'data',
    },
    {
      name: 'disponibilidadeTexto',
      type: 'text',
      section: 'perfil',
      label: l('Disponibilidade', 'Availability'),
      placeholder: l('Ex.: após o cumprimento do aviso prévio ao actual empregador', 'E.g. after serving notice to my current employer'),
      showIf: (v) => v.disponibilidade === 'outra',
    },
    {
      name: 'entrevista',
      type: 'toggle',
      section: 'perfil',
      default: true,
      label: l('Mostrar disponibilidade para entrevista', 'Offer to attend an interview'),
    },
    {
      name: 'anexos',
      type: 'lines',
      section: 'documento',
      label: l('Documentos que junta', 'Enclosed documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [
        { descricao: 'Curriculum vitae' },
        { descricao: 'Certificado de habilitações' },
        { descricao: 'Cópia do Bilhete de Identidade' },
      ],
    },
    localField(),
    dateField('data'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!v.candidatoNome) w.push({ level: 'warning', field: 'candidatoNome', message: l('Indique o seu nome.', 'Enter your name.') });
    if (!v.empresa) w.push({ level: 'warning', field: 'empresa', message: l('Indique a empresa a que se candidata.', 'Enter the company you are applying to.') });
    if (!v.espontanea && !v.vagaNome) w.push({ level: 'warning', field: 'vagaNome', message: l('Indique a vaga a que se candidata.', 'Enter the vacancy.') });
    if (!splitLines(v.qualificacoes).length) {
      w.push({ level: 'warning', field: 'qualificacoes', message: l('Indique as suas qualificações e experiência.', 'Enter your qualifications and experience.') });
    } else if (splitLines(v.qualificacoes).length > 8 || String(v.qualificacoes).length > 1400) {
      w.push({
        level: 'info',
        field: 'qualificacoes',
        message: l('A carta deve caber numa página: destaque o essencial e deixe o resto para o CV.', 'Keep the letter to one page: highlight the key points and leave the rest to your CV.'),
      });
    }
    if (!v.candidatoTelefone && !v.candidatoEmail) {
      w.push({ level: 'warning', field: 'candidatoTelefone', message: l('Indique pelo menos um contacto.', 'Enter at least one contact.') });
    }
    if (v.disponibilidade === 'data' && v.disponibilidadeData && v.data && diffDays(v.data, v.disponibilidadeData) < 0) {
      w.push({ level: 'info', field: 'disponibilidadeData', message: l('A data de disponibilidade já passou: escolha «Imediata».', 'The availability date has passed: choose “Immediately”.') });
    }
    if (ctx.profile?.kind === 'empresa') {
      w.push({ level: 'info', message: l('Esta carta é escrita por uma pessoa. Use um perfil pessoal para preencher os seus dados.', 'This letter is written by an individual. Use a personal profile to fill in your details.') });
    }
    return w;
  },

  personName: (v) => v.candidatoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const ge = v.candidatoGenero;
    const quals = splitLines(v.qualificacoes);
    const apresentacao = paragraphs(v.apresentacao);
    const anexos = lineItems(v.anexos).map((r) => String(r.descricao ?? '').trim()).filter(Boolean);
    const tel = String(v.candidatoTelefone ?? '').trim();
    const email = String(v.candidatoEmail ?? '').trim();

    const remetente = [
      `**${v.candidatoNome || BLANK}**`,
      String(v.candidatoMorada ?? '').trim(),
      [tel ? `Tel.: ${tel}` : '', email ? `Email: ${email}` : ''].filter(Boolean).join(' · '),
    ].filter(Boolean);

    const vaga = clean(v.vagaNome);
    const ref = clean(v.vagaReferencia);
    const assunto = v.espontanea
      ? `Candidatura espontânea${clean(v.areaInteresse) ? ` — ${clean(v.areaInteresse)}` : ''}`
      : `Candidatura à vaga de ${vaga || BLANK}${ref ? ` (Ref.ª ${ref})` : ''}`;

    const blocks: Block[] = [
      { type: 'paragraph', id: 'remetente', text: remetente.join('\n'), align: 'left', editable: false, en: 'Applicant’s name and contact details.' },
      {
        type: 'recipient',
        salutation: 'Exmos. Senhores',
        lines: [v.empresa || BLANK, v.departamento ? `A/C: ${clean(v.departamento)}` : '', clean(v.empresaMorada)].filter(Boolean),
      },
      { type: 'reference', place: ctx.place, date: dateLong(v.data) },
      { type: 'subject', text: assunto },
      { type: 'salutation', text: 'Exmos. Senhores,' },
    ];

    // Opening: the vacancy, or an unsolicited application
    let abertura: string;
    let aberturaEn: string;
    if (v.espontanea) {
      const area = clean(v.areaInteresse);
      abertura = `Apresento a V. Ex.ªs a minha candidatura espontânea a ${area ? `funções na área de ${lowerFirst(area)},` : 'funções compatíveis com o meu perfil,'} para o caso de existir ou vir a existir na vossa organização uma vaga adequada ao meu perfil.`;
      aberturaEn = `I submit an unsolicited application for ${area ? `a role in ${area}` : 'a suitable role'} at ${v.empresa || 'your company'}, should a vacancy exist or arise.`;
    } else {
      const fonte = clean(v.anuncioFonte);
      const anuncio = fonte || v.anuncioData
        ? `, anunciada${fonte ? ` ${emFonte(fonte)}` : ''}${v.anuncioData ? ` ${fonte ? 'a' : 'em'} ${dateLong(v.anuncioData)}` : ''}`
        : '';
      abertura = `Apresento a V. Ex.ªs a minha candidatura à vaga de **${vaga || BLANK}**${ref ? `, com a referência ${ref}` : ''}${anuncio}.`;
      aberturaEn = `I am applying for the vacancy of ${vaga || '…'}${ref ? ` (ref. ${ref})` : ''}${fonte ? `, advertised in ${fonte}` : ''}.`;
    }
    blocks.push({ type: 'paragraph', id: 'abertura', text: abertura, en: aberturaEn });

    apresentacao.forEach((text, i) => blocks.push({ type: 'paragraph', id: `apresentacao-${i + 1}`, text: endDot(text) }));

    // Qualifications
    if (v.formato === 'texto') {
      const ps = paragraphs(v.qualificacoes);
      if (ps.length) ps.forEach((text, i) => blocks.push({ type: 'paragraph', id: `qualificacoes-${i + 1}`, text: endDot(text) }));
      else blocks.push({ type: 'paragraph', id: 'qualificacoes-1', text: BLANK });
    } else {
      blocks.push(
        {
          type: 'paragraph',
          id: 'qualificacoes',
          text: 'Da minha formação e experiência, destaco o seguinte:',
          en: 'From my education and experience, I would highlight the following:',
          keepWithNext: true,
        },
        { type: 'list', style: 'bullet', items: quals.length ? quals.map((q) => endDot(q)) : [BLANK] },
      );
    }

    // Availability and interview
    const disp =
      v.disponibilidade === 'data'
        ? `a partir de ${dateLong(v.disponibilidadeData)}`
        : v.disponibilidade === 'outra'
          ? lowerFirst(clean(v.disponibilidadeTexto) || BLANK)
          : 'de imediato';
    blocks.push({
      type: 'paragraph',
      id: 'disponibilidade',
      text: `Tenho disponibilidade para iniciar funções ${disp}${v.entrevista ? ' e para comparecer a uma entrevista na data e hora que V. Ex.ªs indicarem' : ''}.`,
      en: `I am available to start ${v.disponibilidade === 'data' ? 'from the date stated' : v.disponibilidade === 'outra' ? 'as stated' : 'immediately'}${v.entrevista ? ' and to attend an interview at a time of your choosing' : ''}.`,
    });

    // Contacts
    if (tel || email) {
      const meios = [tel ? `pelo telefone ${tel}` : '', email ? `pelo endereço electrónico ${email}` : ''].filter(Boolean).join(' ou ');
      blocks.push({
        type: 'paragraph',
        id: 'contactos',
        text: `Posso ser ${g(ge, 'contactado', 'contactada')} ${meios}.`,
        en: 'I can be reached by phone or email as stated.',
      });
    }

    if (anexos.length) {
      blocks.push({
        type: 'paragraph',
        id: 'anexos',
        text: `Junto ${anexos.length === 1 ? 'o documento indicado' : 'os documentos indicados'} abaixo, para apreciação de V. Ex.ªs.`,
        en: 'I enclose the documents listed below for your consideration.',
      });
    }

    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      { type: 'signatures', columns: [{ role: g(ge, 'O Candidato', 'A Candidata'), name: v.candidatoNome || undefined }] },
    );
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Anexos:', items: anexos });
    return blocks;
  },
});
