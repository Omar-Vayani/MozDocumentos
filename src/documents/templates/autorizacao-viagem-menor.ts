// Autorização de viagem de menor: consent of the parent(s) or guardian for a
// child to leave (or enter) the country without one or both parents.
// Presented to the migration services at the border, so it is plain and
// leaves a box for the notarial certification of the signature(s).

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, g, isF, l, lineItems, localField, placeDate, workerFields } from './_shared';
import { ageOn, endDot, gx, lowerFirst, identificacao, notaryBox, PARENTESCO_OPTIONS, pessoaFields, qualidadeParental, RECONHECIMENTO_FIELD, str } from './_pessoal-rh';

type Modalidade = 'outroProgenitor' | 'terceiro' | 'desacompanhado';

const DOC_NOME: Record<string, string> = { BI: 'Bilhete de Identidade', DIRE: 'DIRE', Passaporte: 'Passaporte' };

type Menor = { nome: string; genero: string; nascimento: string; documento: string; nacionalidade: string };

function menores(v: Values): Menor[] {
  return lineItems(v.menores)
    .map((r) => ({
      nome: str(r.nome),
      genero: str(r.genero),
      nascimento: str(r.nascimento),
      documento: str(r.documento),
      nacionalidade: str(r.nacionalidade),
    }))
    .filter((m) => m.nome || m.documento);
}

function menorDesc(m: Menor): string {
  const f = isF(m.genero);
  return [
    `**${m.nome || BLANK}**`,
    m.nascimento ? `${f ? 'nascida' : 'nascido'} a ${dateLong(m.nascimento)}` : '',
    m.nacionalidade && m.nacionalidade.toLowerCase() !== 'moçambicana' ? `de nacionalidade ${m.nacionalidade}` : '',
    `titular do Passaporte n.º ${m.documento || BLANK}`,
  ]
    .filter(Boolean)
    .join(', ');
}

export default defineTemplate({
  id: 'autorizacao-viagem-menor',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    {
      id: 'autorizante',
      title: l('Quem autoriza', 'Person giving consent'),
      description: l('O pai, a mãe ou quem exerce o poder parental. Os dados vêm do seu perfil pessoal.', 'The father, mother or guardian. Details come from your personal profile.'),
      personRole: 'outro',
    },
    { id: 'segundo', title: l('Segundo progenitor (se ambos autorizam)', 'Second parent (if both consent)'), personRole: 'outro' },
    { id: 'menores', title: l('Menor(es)', 'Child(ren)') },
    { id: 'viagem', title: l('Viagem', 'Trip') },
    { id: 'acompanhante', title: l('Acompanhante', 'Accompanying adult'), personRole: 'outro' },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da autorização', 'Date of the authorisation')),

    ...pessoaFields('autorizante', 'autorizante', { profile: true }),
    {
      name: 'autorizanteQualidade',
      type: 'select',
      section: 'autorizante',
      width: 'half',
      required: true,
      label: l('Relação com o menor', 'Relationship to the child'),
      options: PARENTESCO_OPTIONS,
      default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'mãe' : 'pai'),
    },
    ...workerFields(['telefone'], 'autorizante', 'autorizante').map((f) => ({ ...f, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.telefones || '' : '') })),

    {
      name: 'doisAutorizantes',
      type: 'toggle',
      section: 'segundo',
      default: false,
      label: l('O outro progenitor também assina esta autorização', 'The other parent also signs this authorisation'),
      help: l(
        'Ligue quando o menor viaja sozinho ou com terceiros: nesse caso são precisas as autorizações dos dois pais (salvo se só um exerce o poder parental). Quando o menor viaja com um dos pais, assina só o que fica.',
        'Turn on when the child travels alone or with a third party: both parents must consent (unless only one has parental authority). When the child travels with one parent, only the parent staying behind signs.',
      ),
    },
    ...pessoaFields('autorizante2', 'segundo').map((f) => ({ ...f, required: false, showIf: (v: Values) => Boolean(v.doisAutorizantes) })),
    {
      name: 'autorizante2Qualidade',
      type: 'select',
      section: 'segundo',
      width: 'half',
      label: l('Relação com o menor', 'Relationship to the child'),
      options: PARENTESCO_OPTIONS,
      default: 'mãe',
      showIf: (v) => Boolean(v.doisAutorizantes),
    },

    {
      name: 'menores',
      type: 'lines',
      section: 'menores',
      required: true,
      label: l('Menores que viajam', 'Children travelling'),
      addLabel: l('Adicionar menor', 'Add child'),
      help: l('Indique o número do passaporte (ou do documento de viagem) com que o menor viaja.', 'Enter the passport (or travel document) number the child travels with.'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'genero', type: 'select', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }] },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
        { name: 'documento', type: 'text', label: l('N.º do passaporte', 'Passport no.') },
        { name: 'nacionalidade', type: 'text', label: l('Nacionalidade', 'Nationality') },
      ],
      default: [{ nome: '', genero: 'M', nascimento: '', documento: '', nacionalidade: 'moçambicana' }],
    },

    {
      name: 'modalidade',
      type: 'radio',
      section: 'viagem',
      required: true,
      label: l('O menor viaja', 'The child travels'),
      default: 'outroProgenitor',
      options: [
        { value: 'outroProgenitor', label: l('Com o outro progenitor (pai ou mãe)', 'With the other parent') },
        { value: 'terceiro', label: l('Com outra pessoa (familiar, professor, amigo)', 'With another adult (relative, teacher, friend)') },
        { value: 'desacompanhado', label: l('Sozinho (desacompanhado)', 'Alone (unaccompanied)') },
      ],
    },
    {
      name: 'destino',
      type: 'text',
      section: 'viagem',
      required: true,
      label: l('Destino (país e cidade)', 'Destination (country and city)'),
      placeholder: l('Ex.: África do Sul (Joanesburgo)', 'E.g. South Africa (Johannesburg)'),
    },
    { name: 'localPartida', type: 'text', section: 'viagem', width: 'half', label: l('Saída por (opcional)', 'Departing through (optional)'), placeholder: l('Ex.: Aeroporto Internacional de Maputo; Ressano Garcia', 'E.g. Maputo International Airport; Ressano Garcia') },
    { name: 'finalidade', type: 'text', section: 'viagem', width: 'half', label: l('Motivo (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: férias escolares', 'E.g. school holidays') },
    { name: 'dataPartida', type: 'date', section: 'viagem', width: 'half', required: true, label: l('Data de partida', 'Departure date') },
    {
      name: 'dataRegresso',
      type: 'date',
      section: 'viagem',
      width: 'half',
      required: true,
      label: l('Data de regresso', 'Return date'),
      help: l('Indique datas concretas. Autorizações sem prazo são muitas vezes recusadas.', 'Give exact dates. Open-ended authorisations are often refused.'),
    },
    {
      name: 'alojamento',
      type: 'textarea',
      section: 'viagem',
      rows: 2,
      label: l('Onde fica durante a viagem (opcional)', 'Where the child will stay (optional)'),
      placeholder: l('Ex.: em casa de Maria Tembe, 12 Smith Street, Joanesburgo, telefone +27 …', 'E.g. at the home of …, address, phone'),
    },

    ...pessoaFields('acompanhante', 'acompanhante', { keys: ['nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero'] }).map((f) => ({
      ...f,
      required: false,
      showIf: (v: Values) => v.modalidade !== 'desacompanhado',
    })),
    {
      name: 'acompanhanteRelacao',
      type: 'text',
      section: 'acompanhante',
      width: 'half',
      label: l('Relação com o menor', 'Relationship to the child'),
      placeholder: l('Ex.: mãe; avó materna; tio; professor', 'E.g. mother; grandmother; uncle; teacher'),
      showIf: (v) => v.modalidade !== 'desacompanhado',
    },
    {
      name: 'responsavelChegada',
      type: 'text',
      section: 'acompanhante',
      label: l('Quem recebe o menor no destino', 'Who meets the child at the destination'),
      placeholder: l('Nome, documento e telefone', 'Name, ID and phone'),
      showIf: (v) => v.modalidade === 'desacompanhado',
    },

    {
      name: 'decisoesMedicas',
      type: 'toggle',
      section: 'opcoes',
      default: true,
      label: l('Autorizar o acompanhante a decidir em caso de urgência médica', 'Allow the accompanying adult to decide in a medical emergency'),
    },
    RECONHECIMENTO_FIELD('opcoes'),
  ],

  computed: (v) => {
    const lista = menores(v);
    const dias = v.dataPartida && v.dataRegresso ? diffDays(v.dataPartida, v.dataRegresso) : null;
    return { lista, dias: Number.isFinite(dias as number) ? dias : null };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `A assinatura de quem autoriza tem de ser reconhecida (notário, conservatória ou esquadra da PRM que preste o serviço) e deve juntar cópia do seu documento de identificação. ${cite('saidaMenores')}: confirme também as exigências da companhia aérea e do país de destino.`,
          'The signature must be certified (notary, registry or a police station offering the service), with a copy of the signer’s ID. Also check the airline’s and the destination country’s requirements.',
        ),
      },
    ];
    if (!c.lista.length) w.push({ level: 'error', field: 'menores', message: l('Indique o menor que viaja.', 'Enter the child who is travelling.') });
    const maior = ctx.legal.value<{ anos: number }>('maioridade').anos;
    for (const m of c.lista as Menor[]) {
      const idade = ageOn(m.nascimento, v.dataPartida || v.data);
      if (idade != null && idade >= maior) {
        w.push({
          level: 'warning',
          field: 'menores',
          message: l(`${m.nome || 'Um dos viajantes'} tem ${idade} anos na data da viagem: a autorização só é necessária para menores de ${maior} anos.`, `${m.nome || 'A traveller'} is ${idade} on the travel date: consent is only needed for under-${maior}s.`),
        });
      }
      if (!m.documento) w.push({ level: 'warning', field: 'menores', message: l(`Falta o número do passaporte de ${m.nome || 'um dos menores'}.`, `Passport number missing for ${m.nome || 'a child'}.`) });
      if (m.nacionalidade && m.nacionalidade.toLowerCase() !== 'moçambicana') {
        w.push({
          level: 'info',
          field: 'menores',
          message: l('Para menores estrangeiros, a autorização tem de estar em português ou acompanhada de tradução.', 'For foreign minors the authorisation must be in Portuguese or translated.'),
        });
      }
    }
    if (v.modalidade !== 'outroProgenitor' && !v.doisAutorizantes) {
      w.push({
        level: 'warning',
        field: 'doisAutorizantes',
        message: l(
          'Quando o menor viaja sozinho ou com outra pessoa, são precisas as autorizações dos dois pais. Se só um exerce o poder parental, junte a prova (sentença de regulação, certidão de óbito).',
          'When the child travels alone or with someone else, both parents must consent. If only one has parental authority, attach proof (court order, death certificate).',
        ),
      });
    }
    if (v.modalidade !== 'desacompanhado' && !str(v.acompanhanteNome)) {
      w.push({ level: 'warning', field: 'acompanhanteNome', message: l('Indique quem acompanha o menor.', 'Enter who travels with the child.') });
    }
    if (v.modalidade !== 'desacompanhado' && str(v.acompanhanteNome) && !str(v.acompanhanteDocNumero)) {
      w.push({ level: 'warning', field: 'acompanhanteDocNumero', message: l('Indique o documento do acompanhante.', 'Enter the accompanying adult’s ID number.') });
    }
    if (c.dias != null && c.dias < 0) w.push({ level: 'error', field: 'dataRegresso', message: l('A data de regresso é anterior à de partida.', 'The return date is before departure.') });
    if (c.dias != null && c.dias > 365) {
      w.push({
        level: 'warning',
        field: 'dataRegresso',
        message: l('Período muito longo: alguns postos de fronteira recusam autorizações com prazo superior a um ano.', 'Very long period: some border posts refuse authorisations longer than a year.'),
      });
    }
    if (!str(v.autorizanteDocNumero)) w.push({ level: 'warning', field: 'autorizanteDocNumero', message: l('Falta o número do documento de quem autoriza.', 'The ID number of the person consenting is missing.') });
    return w;
  },

  personName: (v) => (menores(v)[0]?.nome || v.autorizanteNome) as string | undefined,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const lista = ctx.computed.lista as Menor[];
    const dois = Boolean(v.doisAutorizantes);
    const modalidade = (v.modalidade || 'outroProgenitor') as Modalidade;
    const plural = lista.length > 1;
    const algumF = lista.length === 1 && isF(lista[0].genero);
    const oMenor = plural ? (lista.every((m) => isF(m.genero)) ? 'as menores' : 'os menores') : algumF ? 'a menor' : 'o menor';
    const doMenor = plural ? (lista.every((m) => isF(m.genero)) ? 'das menores' : 'dos menores') : algumF ? 'da menor' : 'do menor';

    const q1 = qualidadeParental(v.autorizanteQualidade, v.autorizanteGenero);
    const q2 = qualidadeParental(v.autorizante2Qualidade, v.autorizante2Genero);
    const quem = dois
      ? `${identificacao(v, 'autorizante')}, e ${identificacao(v, 'autorizante2')}, na qualidade de, respectivamente, ${q1} e ${q2} ${doMenor}${plural ? ' adiante identificados' : ''}`
      : `${identificacao(v, 'autorizante')}, na qualidade de ${q1} ${doMenor}${plural ? ' adiante identificados' : ''}`;
    const verbo = dois ? 'autorizam' : 'autoriza';

    const periodo = `no período de ${dateLong(v.dataPartida)} a ${dateLong(v.dataRegresso)}`;
    const destino = str(v.destino) || BLANK;
    const saida = str(v.localPartida) ? `, com saída por ${str(v.localPartida)}` : '';
    const motivo = str(v.finalidade) ? `, por motivo de ${str(v.finalidade).replace(/\.$/, '')}` : '';

    let acompanhamento: string;
    if (modalidade === 'desacompanhado') {
      acompanhamento = `${plural ? 'desacompanhados' : algumF ? 'desacompanhada' : 'desacompanhado'}, sob a responsabilidade da transportadora durante a viagem${str(v.responsavelChegada) ? `, sendo ${plural ? 'recebidos' : algumF ? 'recebida' : 'recebido'} no destino por ${str(v.responsavelChegada)}` : ''}`;
    } else {
      const fa = isF(v.acompanhanteGenero);
      const docA = `${fa ? 'portadora' : 'portador'} do ${DOC_NOME[str(v.acompanhanteDocTipo)] ?? 'Bilhete de Identidade'} n.º ${str(v.acompanhanteDocNumero) || BLANK}`;
      const nac = str(v.acompanhanteNacionalidade) ? `, de nacionalidade ${str(v.acompanhanteNacionalidade)}` : '';
      const rel = str(v.acompanhanteRelacao) || (modalidade === 'outroProgenitor' ? (fa ? 'mãe' : 'pai') : '');
      acompanhamento = `${plural ? 'acompanhados' : algumF ? 'acompanhada' : 'acompanhado'} de **${str(v.acompanhanteNome) || BLANK}**${nac}, ${docA}${rel ? `, na qualidade de ${rel}` : ''}`;
    }

    const blocks: Block[] = [
      { type: 'title', text: 'Autorização de Viagem de Menor' },
      {
        type: 'paragraph',
        id: 'autorizacao',
        text: `${quem}, ${verbo} ${plural ? `${oMenor} seguintes` : `${oMenor} ${lista[0] ? menorDesc(lista[0]) : `**${BLANK}**`}`}${plural ? ':' : ''}${
          plural ? '' : ` a sair do território nacional e a viajar para **${destino}**${saida}${motivo}, ${periodo}, ${acompanhamento}.`
        }`,
        en: `The person(s) identified above, as parent(s) or guardian(s), authorise the child(ren) identified here to leave the country and travel to ${v.destino || '—'} from ${v.dataPartida || '—'} to ${v.dataRegresso || '—'}, ${modalidade === 'desacompanhado' ? 'unaccompanied' : `accompanied by ${v.acompanhanteNome || '—'}`}.`,
      },
    ];
    if (plural) {
      blocks.push(
        { type: 'list', style: 'alpha', items: lista.map((m, i) => `${menorDesc(m)}${i === lista.length - 1 ? ',' : ';'}`) },
        {
          type: 'paragraph',
          id: 'viagemPlural',
          text: `a sair do território nacional e a viajar para **${destino}**${saida}${motivo}, ${periodo}, ${acompanhamento}.`,
          en: `to leave the country and travel to ${v.destino || '—'} during the stated period.`,
        },
      );
    }
    if (str(v.alojamento)) {
      blocks.push({
        type: 'paragraph',
        id: 'alojamento',
        text: `Durante a estadia, ${oMenor} ${plural ? 'ficarão alojados' : `ficará ${algumF ? 'alojada' : 'alojado'}`} ${endDot(lowerFirst(str(v.alojamento)))}`,
        en: `During the stay the child(ren) will be accommodated as stated.`,
      });
    }
    if (v.decisoesMedicas && modalidade !== 'desacompanhado') {
      blocks.push({
        type: 'paragraph',
        id: 'decisoes',
        text: `${dois ? 'Autorizam' : 'Autoriza'} ainda ${g(v.acompanhanteGenero, 'o acompanhante', 'a acompanhante')} a tomar as decisões urgentes necessárias à saúde e segurança ${doMenor} durante a viagem, incluindo assistência médica e hospitalar.`,
        en: 'The accompanying adult may also take urgent decisions needed for the child’s health and safety during the trip, including medical and hospital care.',
      });
    }
    blocks.push({
      type: 'paragraph',
      id: 'validade',
      text: 'A presente autorização é válida apenas para a viagem e o período acima indicados.',
      en: 'This authorisation is valid only for the trip and period stated above.',
    });
    blocks.push({
      type: 'paragraph',
      id: 'fecho',
      text: `Por ser verdade e para os devidos efeitos junto dos Serviços de Migração e das autoridades de fronteira, ${dois ? 'assinam a presente autorização' : `${gx(v.autorizanteGenero, 'o declarante', 'a declarante')} assina a presente autorização`}.`,
      en: 'In witness whereof, for presentation to the migration services and border authorities, this authorisation is signed.',
      keepWithNext: true,
    });

    const papel = (q: string) => (q === 'pai' ? 'O Pai' : q === 'mãe' ? 'A Mãe' : q === 'tutora' ? 'A Tutora' : 'O Tutor');
    const sig = (p: string, q: string): SignatureColumn => ({
      role: papel(q),
      name: str(v[`${p}Nome`]) || undefined,
      detail: str(v[`${p}DocNumero`]) ? `${str(v[`${p}DocTipo`]) || 'BI'} n.º ${str(v[`${p}DocNumero`])}` : undefined,
    });
    blocks.push({
      type: 'signatures',
      placeDate: placeDate(ctx, v.data),
      columns: dois ? [sig('autorizante', q1), sig('autorizante2', q2)] : [sig('autorizante', q1)],
    });
    blocks.push({
      type: 'annexList',
      title: 'Anexos:',
      items: [
        `Cópia do documento de identificação ${dois ? 'de cada um dos signatários' : g(v.autorizanteGenero, 'do signatário', 'da signatária')}`,
        `Cópia da certidão de nascimento ${doMenor}`,
      ],
    });
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
