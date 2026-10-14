import { inteiroPorExtenso, MESES, parseISODate } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { BLANK, cite, DOC_TIPO_OPTIONS, g, GENERO_OPTIONS, l, lineItems, localField } from './_shared';
import { deNomeSimples, ext, reconhecimentoBox, semPonto, str, valorTexto } from './_associacoes';

// Acta da assembleia constituinte de uma associação: the founders decide to
// form the association, approve the statutes, elect the interim committee (or
// the first bodies) and give it a mandate to apply for recognition. Filed with
// the recognising authority with the statutes: plain layout, no letterhead.

function dataPorExtenso(iso: unknown): string {
  const d = parseISODate(typeof iso === 'string' ? iso : '');
  if (!d) return 'Aos ____ dias do mês de __________ do ano de ______';
  const dia = d.getDate();
  return `${dia === 1 ? 'Ao primeiro dia' : `Aos ${inteiroPorExtenso(dia)} dias`} do mês de ${MESES[d.getMonth()]} do ano de ${inteiroPorExtenso(d.getFullYear())}`;
}

function hora(s: unknown, prep: 'pelas' | 'às'): string {
  const t = str(s);
  if (!t) return `${prep} ____ horas`;
  const m = /^(\d{1,2})(?:\s*[:hH.]\s*(\d{2}))?/.exec(t);
  if (!m) return `${prep} ${t}`;
  const h = Number(m[1]);
  const min = m[2] && m[2] !== '00' ? Number(m[2]) : 0;
  const p = h === 1 ? (prep === 'pelas' ? 'pela' : 'à') : prep;
  return `${p} ${h} ${h === 1 ? 'hora' : 'horas'}${min ? ` e ${min} minutos` : ''}`;
}

const VOTACAO_OPTIONS = [
  { value: 'unanimidade', label: l('Por unanimidade', 'Unanimously') },
  { value: 'maioria', label: l('Por maioria', 'By majority') },
];

export default defineTemplate({
  id: 'acta-constituicao-associacao',
  family: 'acta',
  official: 'registo',
  letterhead: false,
  sections: [
    { id: 'reuniao', title: l('Assembleia constituinte', 'Founding meeting') },
    { id: 'mesa', title: l('Mesa', 'Chair and secretary') },
    { id: 'deliberacoes', title: l('Deliberações', 'Resolutions') },
    { id: 'fundadores', title: l('Membros fundadores', 'Founding members') },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    { name: 'nome', type: 'text', section: 'reuniao', required: true, label: l('Nome da associação', 'Name of the association') },
    { name: 'sede', type: 'text', section: 'reuniao', required: true, label: l('Sede', 'Seat'), placeholder: l('Ex.: Rua da Mafalala, n.º 25, Cidade de Maputo', 'Full address') },
    { name: 'objectivoGeral', type: 'textarea', section: 'reuniao', rows: 2, required: true, label: l('Objectivo geral', 'General objective'), help: l('Igual ao dos estatutos.', 'Same as in the statutes.') },
    { name: 'data', type: 'date', section: 'reuniao', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
    { name: 'horaInicio', type: 'text', section: 'reuniao', width: 'half', required: true, label: l('Hora de início', 'Start time'), placeholder: l('Ex.: 09:00', 'E.g. 09:00') },
    { name: 'horaFim', type: 'text', section: 'reuniao', width: 'half', label: l('Hora de encerramento', 'Closing time'), placeholder: l('Ex.: 12:00', 'E.g. 12:00') },
    { name: 'localReuniao', type: 'text', section: 'reuniao', required: true, label: l('Local da reunião', 'Place of the meeting'), placeholder: l('Ex.: na Escola Primária da Mafalala', 'E.g. at the local primary school') },
    localField('reuniao'),
    { name: 'presidenteNome', type: 'text', section: 'mesa', width: 'half', required: true, label: l('Presidente da Mesa', 'Chair') },
    { name: 'presidenteGenero', type: 'radio', section: 'mesa', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M' },
    { name: 'secretarioNome', type: 'text', section: 'mesa', width: 'half', required: true, label: l('Secretário(a)', 'Secretary') },
    { name: 'secretarioGenero', type: 'radio', section: 'mesa', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'F' },
    { name: 'numeroArtigos', type: 'number', section: 'deliberacoes', width: 'half', label: l('Número de artigos dos estatutos', 'Number of articles in the statutes'), min: 1 },
    { name: 'votacaoEstatutos', type: 'select', section: 'deliberacoes', width: 'half', label: l('Aprovação dos estatutos', 'Approval of the statutes'), options: VOTACAO_OPTIONS, default: 'unanimidade' },
    { name: 'votosEstatutos', type: 'text', section: 'deliberacoes', label: l('Votos (se por maioria)', 'Votes (if by majority)'), placeholder: l('Ex.: com 14 votos a favor, 1 contra e 1 abstenção', 'E.g. 14 for, 1 against, 1 abstention'), showIf: (v) => v.votacaoEstatutos === 'maioria' },
    {
      name: 'orgaoEleito',
      type: 'radio',
      section: 'deliberacoes',
      label: l('Quem foi eleito', 'Who was elected'),
      options: [
        { value: 'comissao', label: l('Comissão Instaladora (até às primeiras eleições)', 'Interim committee (until the first elections)') },
        { value: 'orgaos', label: l('Os órgãos sociais do primeiro mandato', 'The first governing bodies') },
      ],
      default: 'comissao',
    },
    {
      name: 'eleitos',
      type: 'lines',
      section: 'deliberacoes',
      required: true,
      label: l('Eleitos', 'Elected'),
      addLabel: l('Adicionar', 'Add'),
      columns: [
        { name: 'orgao', type: 'text', label: l('Órgão', 'Body'), placeholder: l('Ex.: Comissão Instaladora / Direcção', 'E.g. Board') },
        { name: 'cargo', type: 'text', label: l('Cargo', 'Position') },
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
      ],
      default: [
        { orgao: 'Comissão Instaladora', cargo: 'Presidente', nome: '' },
        { orgao: 'Comissão Instaladora', cargo: 'Secretário', nome: '' },
        { orgao: 'Comissão Instaladora', cargo: 'Tesoureiro', nome: '' },
      ],
    },
    { name: 'mandatario', type: 'text', section: 'deliberacoes', label: l('Mandatário para o pedido de reconhecimento', 'Person mandated to apply for recognition'), help: l('Normalmente o Presidente da Comissão Instaladora.', 'Usually the chair of the interim committee.') },
    { name: 'joia', type: 'money', section: 'deliberacoes', width: 'half', label: l('Jóia (opcional)', 'Entry fee (optional)') },
    { name: 'quota', type: 'money', section: 'deliberacoes', width: 'half', label: l('Quota mensal (opcional)', 'Monthly dues (optional)') },
    {
      name: 'fundadores',
      type: 'lines',
      section: 'fundadores',
      required: true,
      label: l('Membros fundadores', 'Founding members'),
      help: l('Todos assinam a acta. A lei exige um número mínimo de fundadores.', 'All sign the minutes. The law sets a minimum number of founders.'),
      addLabel: l('Adicionar fundador', 'Add founder'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'docTipo', type: 'select', label: l('Documento', 'Document'), options: DOC_TIPO_OPTIONS },
        { name: 'docNumero', type: 'text', label: l('N.º do documento', 'Document number') },
        { name: 'nacionalidade', type: 'text', label: l('Nacionalidade', 'Nationality') },
        { name: 'residencia', type: 'text', label: l('Residência', 'Address') },
      ],
      default: [],
    },
    { name: 'reconhecimentoNotarial', type: 'toggle', section: 'opcoes', label: l('Espaço para reconhecimento notarial das assinaturas', 'Space for notarial recognition of signatures'), help: l('Algumas entidades pedem as assinaturas dos fundadores reconhecidas no notário.', 'Some authorities ask for the founders’ signatures to be certified by a notary.'), default: false },
  ],

  blocks: (ctx) => {
    const v = ctx.values;
    const nome = str(v.nome) || BLANK;
    const fund = lineItems(v.fundadores).filter((r) => str(r.nome));
    const eleitos = lineItems(v.eleitos).filter((r) => str(r.nome) || str(r.cargo));
    const comissao = v.orgaoEleito !== 'orgaos';
    const pres = str(v.presidenteNome) || BLANK;
    const sec = str(v.secretarioNome) || BLANK;
    const joiaQuota = str(v.joia) || str(v.quota);
    const pontos = [
      `Constituição ${deNomeSimples(nome)}`,
      'Discussão e aprovação dos estatutos',
      comissao ? 'Eleição da Comissão Instaladora' : 'Eleição dos órgãos sociais para o primeiro mandato',
      'Mandato para o pedido de reconhecimento, publicação e registo',
      ...(joiaQuota ? ['Fixação da jóia e da quota'] : []),
    ];
    const votEst = v.votacaoEstatutos === 'maioria' ? `por maioria${str(v.votosEstatutos) ? `, ${semPonto(v.votosEstatutos)}` : ''}` : 'por unanimidade';
    const nArt = Number(v.numeroArtigos) > 0 ? `, composto por ${Number(v.numeroArtigos)} (${ext(Number(v.numeroArtigos))}) artigos,` : '';
    const mand = str(v.mandatario) || str(eleitos[0]?.nome) || BLANK;

    const blocks: Block[] = [
      { type: 'title', text: 'Acta da Assembleia Constituinte', subtitle: nome },
      {
        type: 'paragraph',
        id: 'abertura',
        text: `${dataPorExtenso(v.data)}, ${hora(v.horaInicio, 'pelas')}, ${str(v.localReuniao) || BLANK}, ${str(v.local) ? `${str(v.local)}, ` : ''}reuniram-se em Assembleia Constituinte os cidadãos abaixo identificados e assinados, num total de ${fund.length ? `${fund.length} (${ext(fund.length)})` : BLANK}, com o propósito de constituir uma associação sem fins lucrativos denominada **${nome}**.`,
        en: 'On the date and at the place stated, the citizens identified below met in a founding meeting to form a non-profit association.',
      },
      {
        type: 'paragraph',
        id: 'mesa',
        text: `Para dirigir os trabalhos foi ${g(v.presidenteGenero, 'eleito', 'eleita')}, por unanimidade, Presidente da Mesa ${g(v.presidenteGenero, 'o Senhor', 'a Senhora')} **${pres}**, ${g(v.presidenteGenero, 'secretariado', 'secretariada')} por ${g(v.secretarioGenero, 'o Senhor', 'a Senhora')} **${sec}**, ${g(v.presidenteGenero, 'o qual', 'a qual')} apresentou a seguinte ordem de trabalhos:`,
        en: 'A chair and a secretary were elected and the chair presented the agenda.',
        keepWithNext: true,
      },
      { type: 'list', style: 'numeric', items: pontos.map((p) => `${p};`).map((p, i, a) => (i === a.length - 1 ? p.replace(/;$/, '.') : p)) },
      {
        type: 'paragraph',
        id: 'ponto1',
        text: `**Ponto um.** Os presentes manifestaram, por unanimidade, a vontade de constituir a **${nome}**, associação de direito privado, sem fins lucrativos, com sede em ${str(v.sede) || BLANK}, que tem por objectivo geral ${semPonto(v.objectivoGeral) || BLANK}.`,
        en: 'Item one: those present unanimously decided to form the association.',
      },
      {
        type: 'paragraph',
        id: 'ponto2',
        text: `**Ponto dois.** Foi lido e discutido o projecto de estatutos${nArt} que foi aprovado ${votEst}. Os estatutos ficam anexos à presente acta e dela fazem parte integrante.`,
        en: 'Item two: the draft statutes were read, discussed and approved; they are attached to these minutes.',
      },
      {
        type: 'paragraph',
        id: 'ponto3',
        text: `**Ponto três.** ${comissao ? 'Foi eleita, por unanimidade, a Comissão Instaladora' : 'Foram eleitos, por unanimidade, os titulares dos órgãos sociais para o primeiro mandato'}, com a seguinte composição:`,
        en: 'Item three: the interim committee (or first governing bodies) was elected as follows:',
        keepWithNext: true,
      },
      {
        type: 'table',
        columns: [
          { label: 'Órgão', width: 3 },
          { label: 'Cargo', width: 2 },
          { label: 'Nome', width: 4 },
        ],
        rows: eleitos.length ? eleitos.map((r) => [str(r.orgao), str(r.cargo), str(r.nome) || BLANK]) : [['', '', BLANK]],
      },
      {
        type: 'paragraph',
        id: 'ponto4',
        text: `**Ponto quatro.** A Assembleia conferiu ${comissao ? 'à Comissão Instaladora' : 'à Direcção'}, representada por **${mand}**, os poderes necessários para requerer o reconhecimento da Associação junto da entidade competente, promover a publicação dos estatutos no Boletim da República, o registo na Conservatória do Registo das Entidades Legais, a declaração dos beneficiários efectivos, a inscrição na Autoridade Tributária e a abertura de conta bancária em nome da Associação.`,
        en: 'Item four: the committee was mandated to apply for recognition, publication, registration, tax number and a bank account.',
      },
    ];
    if (joiaQuota) {
      blocks.push({
        type: 'paragraph',
        id: 'ponto5',
        text: `**Ponto cinco.** Foi fixada ${str(v.joia) ? `a jóia de ${valorTexto(v.joia, false)}` : ''}${str(v.joia) && str(v.quota) ? ' e ' : ''}${str(v.quota) ? `a quota mensal de ${valorTexto(v.quota, false)}` : ''}.`,
        en: 'Item five: the entry fee and monthly dues were set.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'encerramento',
        text: `Nada mais havendo a tratar, ${g(v.presidenteGenero, 'o Presidente', 'a Presidente')} da Mesa encerrou a sessão ${hora(v.horaFim, 'às')}, tendo sido lavrada a presente acta que, depois de lida e aprovada, vai ser assinada pela Mesa e por todos os membros fundadores.`,
        en: 'There being no further business, the meeting closed; these minutes were read, approved and are signed by the chair, the secretary and all founders.',
        keepWithNext: true,
      },
      {
        type: 'signatures',
        columns: [
          { role: `${g(v.presidenteGenero, 'O Presidente', 'A Presidente')} da Mesa`, name: str(v.presidenteNome) || undefined },
          { role: g(v.secretarioGenero, 'O Secretário', 'A Secretária'), name: str(v.secretarioNome) || undefined },
        ],
      },
      { type: 'heading', text: 'Membros fundadores' },
      {
        type: 'table',
        columns: [
          { label: 'N.º', width: 0.5, align: 'center' },
          { label: 'Nome completo', width: 3.6 },
          { label: 'Documento', width: 2.9 },
          { label: 'Residência', width: 2.8 },
          { label: 'Assinatura', width: 3 },
        ],
        rows: (fund.length ? fund : Array.from({ length: 10 }, () => ({}) as Record<string, any>)).map((r, i) => [
          String(i + 1),
          [str(r.nome), str(r.nacionalidade) && str(r.nacionalidade) !== 'moçambicana' ? `(${str(r.nacionalidade)})` : ''].filter(Boolean).join(' '),
          str(r.docNumero) ? `${str(r.docTipo) || 'BI'} ${str(r.docNumero)}` : '',
          str(r.residencia),
          '',
        ]),
      },
    );
    if (v.reconhecimentoNotarial) blocks.push(reconhecimentoBox());
    return blocks;
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const min = ctx.legal.value<number>('assocRequisitos');
    const fund = lineItems(v.fundadores).filter((r) => str(r.nome));
    if (fund.length < min) {
      w.push({
        level: fund.length ? 'error' : 'warning',
        field: 'fundadores',
        message: l(
          `A associação só pode ser reconhecida com pelo menos ${min} fundadores (${cite('assocRequisitos')}). Indicou ${fund.length}.`,
          `An association can only be recognised with at least ${min} founders. You listed ${fund.length}.`,
        ),
      });
    }
    if (fund.some((r) => !str(r.docNumero)))
      w.push({ level: 'warning', field: 'fundadores', message: l('Indique o documento de identificação de cada fundador.', 'Enter each founder’s ID document.') });
    if (!lineItems(v.eleitos).some((r) => str(r.nome))) w.push({ level: 'warning', field: 'eleitos', message: l('Indique os nomes dos eleitos.', 'Enter the names of those elected.') });
    w.push({
      level: 'info',
      message: l('Junte os estatutos aprovados (documento «Estatutos de associação») e entregue com o requerimento de reconhecimento.', 'Attach the approved statutes and file them with the application for recognition.'),
    });
    return w;
  },
  personName: (v) => str(v.nome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
