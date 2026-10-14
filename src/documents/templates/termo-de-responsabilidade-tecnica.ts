// Termo de responsabilidade técnica: an engineer or architect, as author of a
// project or as technical director of the works, takes responsibility before
// the municipality for the building permit. Filed with the municipality with a
// notarised signature, so it is plain (official) and not on letterhead.

import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type DefaultsContext, type Warning } from '../model';
import { BLANK, cite, dateLong, DOC_TIPO_OPTIONS, ESTADO_CIVIL_OPTIONS, estadoCivilF, GENERO_OPTIONS, isF, l } from './_shared';
import { semPonto, str } from './_contratos';
import { alvaraFrase, municipioNome, profileLicenca } from './_construcao';

const pessoa = (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile : null);

const ESPECIALIDADES = [
  { value: 'arquitectura', label: l('Arquitectura', 'Architecture'), pt: 'arquitectura' },
  { value: 'estabilidade', label: l('Estabilidade (estruturas)', 'Structures'), pt: 'estabilidade (estruturas)' },
  { value: 'electricas', label: l('Instalações eléctricas', 'Electrical installations'), pt: 'instalações eléctricas' },
  { value: 'hidraulicas', label: l('Águas e esgotos', 'Water and drainage'), pt: 'instalações hidráulicas e sanitárias (águas e esgotos)' },
  { value: 'incendios', label: l('Segurança contra incêndios', 'Fire safety'), pt: 'segurança contra incêndios' },
  { value: 'avac', label: l('AVAC / mecânicas', 'HVAC / mechanical'), pt: 'instalações mecânicas e de climatização' },
  { value: 'outra', label: l('Outra', 'Other'), pt: '' },
];

const TIPOS_OBRA = [
  { value: 'construcao', label: l('Construção', 'New construction'), pt: 'construção' },
  { value: 'ampliacao', label: l('Ampliação', 'Extension'), pt: 'ampliação' },
  { value: 'alteracao', label: l('Alteração', 'Alteration'), pt: 'alteração' },
  { value: 'reabilitacao', label: l('Reabilitação', 'Renovation'), pt: 'reabilitação' },
  { value: 'demolicao', label: l('Demolição', 'Demolition'), pt: 'demolição' },
];

export default defineTemplate({
  id: 'termo-de-responsabilidade-tecnica',
  family: 'declaracao',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'tipo', title: l('Tipo de termo', 'Type of statement') },
    { id: 'tecnico', title: l('Técnico responsável', 'Responsible technician') },
    { id: 'obra', title: l('Obra e processo', 'Works and application') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'radio',
      section: 'tipo',
      required: true,
      label: l('O técnico assume a responsabilidade como', 'The technician is responsible as'),
      options: [
        { value: 'projecto', label: l('Autor do projecto', 'Author of the design') },
        { value: 'direccao', label: l('Director técnico da obra', 'Technical director of the works') },
      ],
      default: 'projecto',
    },
    { name: 'especialidadeProjecto', type: 'select', section: 'tipo', width: 'half', label: l('Projecto de', 'Design discipline'), options: ESPECIALIDADES.map(({ value, label }) => ({ value, label })), default: 'arquitectura', showIf: (v) => v.tipo === 'projecto' },
    { name: 'especialidadeOutra', type: 'text', section: 'tipo', width: 'half', label: l('Qual?', 'Which?'), showIf: (v) => v.tipo === 'projecto' && v.especialidadeProjecto === 'outra' },

    { name: 'tecnicoNome', type: 'text', section: 'tecnico', required: true, label: l('Nome completo', 'Full name'), default: (c) => pessoa(c)?.nome ?? '' },
    { name: 'tecnicoGenero', type: 'radio', section: 'tecnico', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: (c) => pessoa(c)?.genero ?? 'M' },
    { name: 'tecnicoEstadoCivil', type: 'select', section: 'tecnico', width: 'half', label: l('Estado civil', 'Marital status'), options: ESTADO_CIVIL_OPTIONS, default: (c) => pessoa(c)?.estadoCivil ?? '' },
    { name: 'tecnicoNacionalidade', type: 'text', section: 'tecnico', width: 'half', label: l('Nacionalidade', 'Nationality'), default: (c) => pessoa(c)?.nacionalidade || 'moçambicana' },
    { name: 'tecnicoDocTipo', type: 'select', section: 'tecnico', width: 'half', label: l('Documento de identificação', 'ID document'), options: DOC_TIPO_OPTIONS, default: (c) => pessoa(c)?.docTipo ?? 'BI' },
    { name: 'tecnicoDocNumero', type: 'text', section: 'tecnico', width: 'half', required: true, label: l('Número do documento', 'Document number'), default: (c) => pessoa(c)?.docNumero ?? '' },
    { name: 'tecnicoDocEmissao', type: 'date', section: 'tecnico', width: 'half', label: l('Data de emissão', 'Issue date'), default: (c) => pessoa(c)?.docEmissao ?? '' },
    { name: 'tecnicoNuit', type: 'text', section: 'tecnico', width: 'half', label: l('NUIT', 'Tax number (NUIT)'), default: (c) => pessoa(c)?.nuit ?? '' },
    { name: 'tecnicoMorada', type: 'text', section: 'tecnico', label: l('Residência ou domicílio profissional', 'Address'), default: (c) => (pessoa(c) ? addressLine(pessoa(c)!) : '') },
    {
      name: 'profissao',
      type: 'radio',
      section: 'tecnico',
      label: l('Profissão', 'Profession'),
      options: [
        { value: 'engenheiro', label: l('Engenheiro(a)', 'Engineer') },
        { value: 'arquitecto', label: l('Arquitecto(a)', 'Architect') },
      ],
      default: (c) => (/arquitect/i.test(`${c.profile?.ordemProfissional ?? ''} ${c.profile?.profissao ?? ''}`) ? 'arquitecto' : 'engenheiro'),
    },
    { name: 'tecnicoEspecialidade', type: 'text', section: 'tecnico', width: 'half', label: l('Especialidade', 'Specialty'), placeholder: l('Ex.: civil, electrotécnica', 'E.g. civil, electrical'), default: (c) => (c.profile?.especialidade ?? '').replace(/^engenheir[oa]\s+/i, '') },
    {
      name: 'ordemNumero',
      type: 'text',
      section: 'tecnico',
      width: 'half',
      required: true,
      label: l('N.º de inscrição na Ordem', 'Order registration no.'),
      legal: l('Só engenheiros ou arquitectos inscritos na respectiva Ordem podem assumir esta responsabilidade.', 'Only engineers or architects registered with their Order may take this responsibility.'),
      default: (c) => c.profile?.ordemNumero ?? '',
    },
    { name: 'ordemCategoria', type: 'text', section: 'tecnico', width: 'half', label: l('Categoria de membro', 'Membership category'), default: 'membro efectivo' },
    { name: 'inscricaoMunicipal', type: 'text', section: 'tecnico', width: 'half', label: l('Inscrição no município (se houver)', 'Municipal registration (if any)'), placeholder: l('Ex.: n.º 214 do Conselho Municipal de Maputo', 'E.g. no. 214, Maputo Municipal Council') },
    { name: 'empresaFirma', type: 'text', section: 'tecnico', width: 'half', label: l('Empresa onde trabalha (opcional)', 'Firm (optional)'), default: (c) => (c.profile?.kind === 'empresa' ? profileDisplayName(c.profile) : '') },
    { name: 'empresaAlvara', type: 'text', section: 'tecnico', width: 'half', label: l('Alvará da empresa (opcional)', 'Firm’s licence (optional)'), placeholder: l('Ex.: Alvará de Consultor n.º 210, 3.ª Classe', 'E.g. Consultant licence 210, class 3'), default: (c) => (c.profile?.kind === 'empresa' ? profileLicenca(c.profile) : '') },

    { name: 'requerente', type: 'text', section: 'obra', required: true, width: 'half', label: l('Requerente (dono da obra)', 'Applicant (owner)') },
    { name: 'municipio', type: 'text', section: 'obra', required: true, width: 'half', label: l('Município', 'Municipality'), placeholder: l('Ex.: Maputo, Matola, Beira', 'E.g. Maputo, Matola, Beira'), default: (c) => c.profile?.morada?.cidade ?? '' },
    { name: 'tipoObra', type: 'select', section: 'obra', width: 'half', label: l('Tipo de obra', 'Type of works'), options: TIPOS_OBRA.map(({ value, label }) => ({ value, label })), default: 'construcao' },
    { name: 'descricaoObra', type: 'text', section: 'obra', required: true, label: l('Descrição da obra', 'Description of the works'), placeholder: l('Ex.: moradia unifamiliar do tipo 3, de rés-do-chão', 'E.g. single-storey three-bedroom house') },
    { name: 'localObra', type: 'text', section: 'obra', required: true, label: l('Local (rua, talhão/parcela, bairro)', 'Site (street, plot, neighbourhood)') },
    { name: 'processoNumero', type: 'text', section: 'obra', width: 'half', label: l('Processo n.º (se já existir)', 'Application no. (if any)') },
    { name: 'licencaNumero', type: 'text', section: 'obra', width: 'half', label: l('Licença de construção n.º', 'Building permit no.'), showIf: (v) => v.tipo === 'direccao' },
    {
      name: 'executante',
      type: 'radio',
      section: 'obra',
      label: l('Execução da obra', 'Who builds'),
      options: [
        { value: 'empreiteiro', label: l('Empreiteiro', 'Contractor') },
        { value: 'administracao', label: l('Administração directa do dono da obra', 'Owner’s direct administration') },
      ],
      default: 'empreiteiro',
      showIf: (v) => v.tipo === 'direccao',
    },
    { name: 'empreiteiroNome', type: 'text', section: 'obra', width: 'half', label: l('Empreiteiro', 'Contractor'), showIf: (v) => v.tipo === 'direccao' && v.executante === 'empreiteiro' },
    { name: 'empreiteiroAlvara', type: 'text', section: 'obra', width: 'half', label: l('Alvará do empreiteiro', 'Contractor’s licence'), showIf: (v) => v.tipo === 'direccao' && v.executante === 'empreiteiro' },

    { name: 'local', type: 'text', section: 'documento', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
    { name: 'data', type: 'date', section: 'documento', width: 'half', required: true, label: l('Data', 'Date'), default: (c) => c.today },
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'warning', message: l(`A assinatura deve ser reconhecida por notário (${cite('obraTermoResponsabilidade')}). Confirme o requisito no seu município.`, 'The signature must be notarised. Check your municipality’s requirement.') },
      { level: 'info', message: l('Se o município tiver modelo próprio de termo de responsabilidade, use esse modelo.', 'If the municipality has its own form, use it.') },
    ];
    if (!str(v.ordemNumero)) {
      w.push({
        level: 'error',
        field: 'ordemNumero',
        message: l(
          `Indique o número de inscrição na Ordem: só engenheiros inscritos na Ordem dos Engenheiros (${cite('inscricaoOrdemEngenheiros')}) ou arquitectos inscritos na Ordem dos Arquitectos podem assumir esta responsabilidade.`,
          'Enter the Order registration number: only registered engineers or architects may take this responsibility.',
        ),
      });
    }
    if (/estagi/i.test(str(v.ordemCategoria))) w.push({ level: 'warning', field: 'ordemCategoria', message: l('Um membro estagiário normalmente não pode assinar termos de responsabilidade. Confirme junto da Ordem.', 'A trainee member usually cannot sign statements of responsibility. Check with the Order.') });
    if (v.tipo === 'direccao' && v.executante === 'empreiteiro' && !str(v.empreiteiroAlvara)) {
      w.push({ level: 'warning', field: 'empreiteiroAlvara', message: l('O pedido de licença deve ser acompanhado de cópia do alvará do empreiteiro.', 'The permit application must include a copy of the contractor’s licence.') });
    }
    return w;
  },

  personName: (v) => v.tecnicoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = isF(v.tecnicoGenero);
    const arq = v.profissao === 'arquitecto';
    const ec = str(v.tecnicoEstadoCivil);
    const ordem = arq ? 'Ordem dos Arquitectos de Moçambique' : 'Ordem dos Engenheiros de Moçambique';
    const titulo = arq ? (f ? 'Arquitecta' : 'Arquitecto') : `${f ? 'Engenheira' : 'Engenheiro'}${str(v.tecnicoEspecialidade) ? ` ${semPonto(v.tecnicoEspecialidade).toLowerCase()}` : ''}`;
    const ident = [
      `**${str(v.tecnicoNome) || BLANK}**`,
      ec ? (f ? estadoCivilF(ec) : ec) : '',
      str(v.tecnicoNacionalidade) ? `de nacionalidade ${v.tecnicoNacionalidade}` : '',
      `${f ? 'portadora' : 'portador'} do ${v.tecnicoDocTipo === 'Passaporte' ? 'Passaporte' : v.tecnicoDocTipo === 'DIRE' ? 'DIRE' : 'Bilhete de Identidade'} n.º ${str(v.tecnicoDocNumero) || BLANK}${v.tecnicoDocEmissao ? `, emitido em ${dateLong(v.tecnicoDocEmissao)}` : ''}`,
      str(v.tecnicoNuit) ? `titular do NUIT ${v.tecnicoNuit}` : '',
      `residente em ${semPonto(v.tecnicoMorada) || BLANK}`,
      `${titulo}, ${f ? 'inscrita' : 'inscrito'} na ${ordem} sob o n.º ${str(v.ordemNumero) || BLANK}${str(v.ordemCategoria) ? `, na categoria de ${semPonto(v.ordemCategoria)}` : ''}`,
      str(v.inscricaoMunicipal) ? `com a inscrição municipal ${semPonto(v.inscricaoMunicipal).replace(/^n\.º/i, 'n.º')}` : '',
      str(v.empresaFirma) ? `técnic${f ? 'a' : 'o'} da sociedade ${semPonto(v.empresaFirma)}${str(v.empresaAlvara) ? `, ${alvaraFrase(v.empresaAlvara)}` : ''}` : '',
    ].filter(Boolean).join(', ');

    const tipo = TIPOS_OBRA.find((t) => t.value === v.tipoObra) ?? TIPOS_OBRA[0];
    const esp = ESPECIALIDADES.find((e) => e.value === v.especialidadeProjecto);
    const espTxt = (esp?.value === 'outra' ? semPonto(v.especialidadeOutra) : esp?.pt) || BLANK;
    const obra = `**${tipo.pt}** de ${semPonto(v.descricaoObra).replace(/^./, (s) => s.toLowerCase()) || BLANK}, sita em ${semPonto(v.localObra) || BLANK}, ${municipioNome(v.municipio)}`;
    const processo = str(v.processoNumero) ? `, objecto do processo n.º ${semPonto(v.processoNumero)}` : '';

    const corpo =
      v.tipo === 'direccao'
        ? `declara que assume a **direcção técnica da execução da obra** de ${obra}${processo}${str(v.licencaNumero) ? `, titular da licença de construção n.º ${semPonto(v.licencaNumero)}` : ''}, requerida por **${str(v.requerente) || BLANK}**, a executar ${v.executante === 'administracao' ? 'por administração directa do dono da obra' : `pelo empreiteiro ${semPonto(v.empreiteiroNome) || BLANK}${str(v.empreiteiroAlvara) ? `, ${alvaraFrase(v.empreiteiroAlvara)}` : ''}`}, obrigando-se a dirigir e acompanhar a execução dos trabalhos de acordo com o projecto aprovado, as condições da licença e as normas técnicas e de segurança aplicáveis, a registar as ocorrências relevantes na caderneta da obra e a comunicar ao Município a cessação das suas funções, caso esta ocorra antes da conclusão da obra.`
        : `declara, para efeitos do pedido de licenciamento da obra de ${obra}${processo}, requerido por **${str(v.requerente) || BLANK}**, que é ${f ? 'autora' : 'autor'} do projecto de **${espTxt}** que instrui o processo, e que o mesmo foi elaborado de acordo com as normas legais e regulamentares aplicáveis, nomeadamente o regime de licenciamento de obras particulares, as normas técnicas de construção e as posturas do Município, assumindo inteira responsabilidade técnica pelo seu conteúdo.`;

    const blocks: Block[] = [
      { type: 'title', text: 'Termo de Responsabilidade', subtitle: v.tipo === 'direccao' ? 'Direcção Técnica da Obra' : `${f ? 'Autora' : 'Autor'} do Projecto` },
      { type: 'paragraph', id: 'identificacao', text: `${ident},`, en: 'Identification of the technician.' },
      { type: 'paragraph', id: 'declaracao', text: corpo, en: v.tipo === 'direccao' ? 'declares that they take on the technical direction of the works described, as per the approved design and permit.' : 'declares that they are the author of the stated design, prepared in accordance with the applicable rules, and take full technical responsibility for it.' },
      { type: 'paragraph', id: 'fecho', text: 'Por ser verdade, assina o presente termo, cuja assinatura vai ser reconhecida por notário.', en: 'In witness whereof, they sign this statement, to be notarised.', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: `${ctx.place}, ${dateLong(v.data)}`,
        columns: [{ role: f ? 'A Técnica Responsável' : 'O Técnico Responsável', name: str(v.tecnicoNome) || undefined, detail: `${titulo} — ${arq ? 'OArQ' : 'OrdEM'} n.º ${str(v.ordemNumero) || '________'}`, image: 'signature' }],
        keepWithNext: true,
      },
      { type: 'box', label: 'Reconhecimento notarial da assinatura', lines: 5, dashed: true },
    ];
    return blocks;
  },
});
