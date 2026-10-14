// Atestado veterinário / certificado de vacinação animal issued by a private
// veterinarian: the animal was examined and is clinically healthy, and/or it
// was vaccinated (rabies and others). For boarding, domestic travel, tenancy,
// insurance or sale. Official health certificates for moving or exporting
// animals are issued by the State veterinary services, and the page says so.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, GENERO_OPTIONS, isF, l, localField, placeDate } from './_shared';
import { cell, juntar, or, profDesc, profFields, profSignature, rows, semPonto, str } from './_saude-educacao';

const ORDEM_VETERINARIOS = 'Ordem dos Médicos Veterinários de Moçambique';
const VET: [string, string] = ['médico veterinário', 'médica veterinária'];

const TIPO_OPTIONS = [
  { value: 'saude', label: l('Atestado de saúde', 'Health certificate'), title: 'Atestado de Saúde Animal' },
  { value: 'vacinacao', label: l('Certificado de vacinação', 'Vaccination certificate'), title: 'Certificado de Vacinação Animal' },
  { value: 'ambos', label: l('Atestado de saúde e vacinação', 'Health and vaccination certificate'), title: 'Atestado de Saúde e Vacinação Animal' },
];

const ESPECIE_OPTIONS = [
  { value: 'canídeo (cão)', label: l('Cão', 'Dog') },
  { value: 'felídeo (gato)', label: l('Gato', 'Cat') },
  { value: 'ave', label: l('Ave', 'Bird') },
  { value: 'outra', label: l('Outra', 'Other') },
];

const FINALIDADE_OPTIONS = [
  { value: '', label: l('— não indicar —', '— do not state —') },
  { value: 'viagem dentro do País', label: l('Viagem dentro do País', 'Domestic travel') },
  { value: 'alojamento em hotel para animais', label: l('Hotel ou alojamento para animais', 'Boarding kennel') },
  { value: 'apresentação ao senhorio ou condomínio', label: l('Senhorio ou condomínio', 'Landlord or condominium') },
  { value: 'venda ou doação do animal', label: l('Venda ou doação', 'Sale or gift') },
  { value: 'instruir o pedido de certificado sanitário oficial', label: l('Pedido de certificado oficial (viagem ao estrangeiro)', 'Supporting an official export certificate') },
];

export default defineTemplate({
  id: 'atestado-veterinario',
  family: 'declaracao',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'animal', title: l('Animal', 'Animal') },
    { id: 'dono', title: l('Dono', 'Owner'), personRole: 'cliente' },
    { id: 'exame', title: l('Exame e vacinas', 'Examination and vaccines') },
    { id: 'veterinario', title: l('Médico veterinário', 'Veterinarian') },
  ],
  fields: [
    { name: 'tipo', type: 'select', section: 'documento', width: 'half', label: l('Tipo', 'Kind'), options: TIPO_OPTIONS.map(({ value, label }) => ({ value, label })), default: 'ambos' },
    { name: 'finalidade', type: 'select', section: 'documento', width: 'half', label: l('Finalidade', 'Purpose'), options: FINALIDADE_OPTIONS, default: '' },
    localField(),
    dateField(),
    { name: 'animalNome', type: 'text', section: 'animal', width: 'half', required: true, label: l('Nome do animal', 'Animal’s name') },
    { name: 'especie', type: 'select', section: 'animal', width: 'half', label: l('Espécie', 'Species'), options: ESPECIE_OPTIONS, default: 'canídeo (cão)' },
    { name: 'especieOutra', type: 'text', section: 'animal', width: 'half', label: l('Qual espécie?', 'Which species?'), showIf: (v) => v.especie === 'outra' },
    { name: 'raca', type: 'text', section: 'animal', width: 'half', label: l('Raça', 'Breed'), placeholder: l('Ex.: Rafeiro, Pastor Alemão', 'E.g. mixed breed') },
    { name: 'animalSexo', type: 'radio', section: 'animal', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Macho', 'Male') }, { value: 'F', label: l('Fêmea', 'Female') }], default: 'M' },
    { name: 'animalNascimento', type: 'date', section: 'animal', width: 'half', label: l('Data de nascimento (aprox.)', 'Date of birth (approx.)') },
    { name: 'pelagem', type: 'text', section: 'animal', width: 'half', label: l('Pelagem / cor', 'Coat / colour') },
    { name: 'peso', type: 'text', section: 'animal', width: 'half', label: l('Peso (kg)', 'Weight (kg)') },
    { name: 'microchip', type: 'text', section: 'animal', width: 'half', label: l('Microchip / identificação (opcional)', 'Microchip / ID (optional)') },
    { name: 'donoNome', type: 'text', section: 'dono', required: true, label: l('Nome do dono', 'Owner’s name'), personKey: 'nome' },
    { name: 'donoGenero', type: 'radio', section: 'dono', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    { name: 'donoDoc', type: 'text', section: 'dono', width: 'half', label: l('BI / passaporte n.º', 'ID / passport no.'), personKey: 'docNumero' },
    { name: 'donoTelefone', type: 'tel', section: 'dono', width: 'half', label: l('Telefone', 'Phone'), personKey: 'telefone' },
    { name: 'donoMorada', type: 'text', section: 'dono', label: l('Morada', 'Address'), personKey: 'morada' },
    { name: 'dataExame', type: 'date', section: 'exame', width: 'half', label: l('Data do exame clínico', 'Examination date'), default: (c) => c.today, showIf: (v) => v.tipo !== 'vacinacao' },
    { name: 'semParasitas', type: 'toggle', section: 'exame', default: true, label: l('Sem parasitas externos visíveis', 'No visible external parasites'), showIf: (v) => v.tipo !== 'vacinacao' },
    { name: 'desparasitacao', type: 'date', section: 'exame', width: 'half', label: l('Última desparasitação (opcional)', 'Last deworming (optional)') },
    { name: 'observacoes', type: 'text', section: 'exame', label: l('Observações (opcional)', 'Remarks (optional)') },
    {
      name: 'vacinas',
      type: 'lines',
      section: 'exame',
      label: l('Vacinas', 'Vaccines'),
      addLabel: l('Adicionar vacina', 'Add vaccine'),
      columns: [
        { name: 'vacina', type: 'text', label: l('Vacina', 'Vaccine') },
        { name: 'lote', type: 'text', label: l('Fabricante e lote', 'Maker and batch') },
        { name: 'data', type: 'date', label: l('Data', 'Date') },
        { name: 'validade', type: 'date', label: l('Válida até', 'Valid until') },
      ],
      default: [],
    },
    ...profFields('veterinario', { profissao: 'Médico Veterinário', profissaoF: 'Médica Veterinária', ordem: ORDEM_VETERINARIOS }),
  ],

  warnings: (v) => {
    const w: Warning[] = [];
    if (!str(v.profNome)) w.push({ level: 'error', field: 'profNome', message: l('Indique o médico veterinário que assina.', 'Enter the veterinarian who signs.') });
    if (v.tipo !== 'saude' && !rows(v.vacinas).some((r) => str(r.vacina))) w.push({ level: 'warning', field: 'vacinas', message: l('Registe as vacinas aplicadas, com o lote e a validade.', 'Record the vaccines given, with batch and expiry.') });
    w.push({
      level: 'info',
      message: l(
        `Para levar o animal para fora do País, ou transportá-lo entre províncias quando exigido, é preciso o certificado sanitário dos Serviços de Veterinária (${cite('seSanidadeAnimal')}). Este atestado instrui o pedido mas não o substitui.`,
        'Taking the animal abroad needs the official veterinary health certificate; this certificate supports but does not replace it.',
      ),
    });
    return w;
  },

  personName: (v) => v.animalNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPO_OPTIONS.find((x) => x.value === v.tipo) ?? TIPO_OPTIONS[2];
    const fa = v.animalSexo === 'F';
    const especie = v.especie === 'outra' ? str(v.especieOutra) || 'outra espécie' : str(v.especie) || 'canídeo (cão)';
    const fdono = isF(v.donoGenero);
    const ident = [
      { label: 'Nome do animal', value: or(v.animalNome) },
      { label: 'Espécie / raça', value: [especie, str(v.raca)].filter(Boolean).join(' — ') },
      { label: 'Sexo', value: fa ? 'Fêmea' : 'Macho' },
      { label: 'Nascimento (aprox.)', value: str(v.animalNascimento) ? formatDateShort(v.animalNascimento) : '______' },
      { label: 'Pelagem / cor', value: str(v.pelagem) || '______' },
      { label: 'Peso', value: str(v.peso) ? `${str(v.peso).replace(/\s*kg$/i, '')} kg` : '______' },
    ];
    if (str(v.microchip)) ident.push({ label: 'Microchip / identificação', value: str(v.microchip) });
    const dono = [
      `**${or(v.donoNome)}**`,
      str(v.donoDoc) ? `${fdono ? 'portadora' : 'portador'} do documento n.º ${str(v.donoDoc)}` : '',
      str(v.donoMorada) ? `residente em ${semPonto(v.donoMorada)}` : '',
      str(v.donoTelefone) ? `telefone ${str(v.donoTelefone)}` : '',
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: 'title', text: t.title },
      { type: 'keyValue', title: 'Identificação do animal', items: ident, columns: 2 },
      { type: 'paragraph', id: 'dono', text: `Dono: ${dono.join(', ')}.`, en: `Owner: ${v.donoNome || '___'}.` },
    ];
    const vac = rows(v.vacinas).filter((r) => str(r.vacina));
    if (v.tipo !== 'vacinacao') {
      const extras = [v.semParasitas ? 'sem parasitas externos visíveis' : '', str(v.desparasitacao) ? `desparasitado em ${dateLong(v.desparasitacao)}` : ''].filter(Boolean);
      blocks.push({
        type: 'paragraph',
        id: 'atesta',
        text: `${profDesc(v, VET)}, atesta que examinou clinicamente o animal acima identificado no dia ${dateLong(v.dataExame)} e que o mesmo se apresenta **clinicamente saudável, sem sinais de doença infecto-contagiosa**${extras.length ? `, ${juntar(extras)}` : ''}${vac.length ? `, estando vacinado conforme o quadro seguinte` : ''}.`,
        en: `The veterinarian certifies that the animal was examined on ${v.dataExame || '___'} and is clinically healthy, with no signs of infectious disease.`,
      });
    } else {
      blocks.push({
        type: 'paragraph',
        id: 'certifica',
        text: `${profDesc(v, VET)}, certifica que o animal acima identificado foi vacinado conforme o quadro seguinte${str(v.desparasitacao) ? `, tendo sido desparasitado em ${dateLong(v.desparasitacao)}` : ''}.`,
        en: 'The veterinarian certifies that the animal was vaccinated as shown below.',
      });
    }
    if (vac.length || v.tipo !== 'saude') {
      blocks.push({
        type: 'table',
        grid: true,
        columns: [{ label: 'Vacina', width: 30 }, { label: 'Fabricante e lote', width: 30 }, { label: 'Data', width: 20, align: 'center' }, { label: 'Válida até', width: 20, align: 'center' }],
        rows: vac.length
          ? vac.map((r) => [str(r.vacina), cell(r.lote), str(r.data) ? formatDateShort(r.data) : ' ', str(r.validade) ? formatDateShort(r.validade) : ' '])
          : [[' ', ' ', ' ', ' '], [' ', ' ', ' ', ' ']],
      });
    }
    if (str(v.observacoes)) blocks.push({ type: 'paragraph', id: 'observacoes', text: `Observações: ${semPonto(v.observacoes)}.`, en: `Remarks: ${v.observacoes}.` });
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: `${str(v.finalidade) ? `O presente documento destina-se a ${str(v.finalidade)}. ` : ''}Por ser verdade, passa o presente documento, que assina e autentica com o carimbo em uso.`,
        en: 'Issued, signed and stamped by the veterinarian.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [profSignature(ctx, 'O Médico Veterinário', 'A Médica Veterinária')] },
      { type: 'note', text: 'Atestado de médico veterinário privado. Não substitui o certificado sanitário oficial exigido para o trânsito, a importação ou a exportação de animais.', en: 'Private veterinary certificate; not the official health certificate for moving, importing or exporting animals.' },
    );
    return blocks;
  },
});
