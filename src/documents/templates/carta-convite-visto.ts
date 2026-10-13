// Carta-convite e termo de responsabilidade: a host in Mozambique invites a
// foreign visitor, confirms accommodation and takes responsibility for the
// stay, for a visa application at a consulate or with SENAMI.

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, lineItems, localField, placeDate, workerFields } from './_shared';
import { gx, identificacao, notaryBox, pessoaFields, RECONHECIMENTO_FIELD, str } from './_pessoal-rh';

type Convidado = { nome: string; genero: string; nacionalidade: string; passaporte: string; validade: string; nascimento: string; relacao: string };

function convidados(v: Values): Convidado[] {
  return lineItems(v.convidados)
    .map((r) => ({
      nome: str(r.nome),
      genero: str(r.genero),
      nacionalidade: str(r.nacionalidade),
      passaporte: str(r.passaporte),
      validade: str(r.validade),
      nascimento: str(r.nascimento),
      relacao: str(r.relacao),
    }))
    .filter((c) => c.nome);
}

/** "meu irmão" / "minha amiga" from the relationship typed by the user. */
function relacaoTxt(r: string): string {
  const rel = r.replace(/^(meu|minha)\s+/i, '').trim();
  if (!rel) return '';
  return `${/a$/i.test(rel.split(/\s+/)[0]) ? 'minha' : 'meu'} ${rel}`;
}

function convidadoDesc(c: Convidado): string {
  const f = isF(c.genero);
  return [
    `**${c.nome}**`,
    c.nacionalidade ? `de nacionalidade ${c.nacionalidade}` : '',
    c.nascimento ? `${f ? 'nascida' : 'nascido'} a ${dateLong(c.nascimento)}` : '',
    `titular do passaporte n.º ${c.passaporte || BLANK}${c.validade ? `, válido até ${dateLong(c.validade)}` : ''}`,
    relacaoTxt(c.relacao),
  ]
    .filter(Boolean)
    .join(', ');
}

const FINALIDADES: Record<string, string> = {
  turismo: 'turismo',
  familia: 'visita familiar',
  negocios: 'negócios',
};

export default defineTemplate({
  id: 'carta-convite-visto',
  official: 'estado',
  letterhead: false,
  sections: [
    { id: 'destinatario', title: l('A quem se dirige', 'Addressee') },
    { id: 'anfitriao', title: l('Anfitrião (quem convida)', 'Host (person inviting)'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'convidados', title: l('Convidado(s)', 'Guest(s)') },
    { id: 'estadia', title: l('Estadia', 'Stay') },
    { id: 'documento', title: l('Local, data e opções', 'Place, date and options') },
  ],
  fields: [
    {
      name: 'destinatario',
      type: 'select',
      section: 'destinatario',
      label: l('Destinatário', 'Addressee'),
      default: 'consulado',
      options: [
        { value: 'consulado', label: l('Embaixada ou consulado de Moçambique', 'Mozambican embassy or consulate') },
        { value: 'senami', label: l('Director-Geral do SENAMI', 'Director-General of SENAMI') },
      ],
      help: l('Para o visto pedido no estrangeiro, o consulado. Para o visto de negócios ou electrónico, o SENAMI.', 'For a visa requested abroad, the consulate. For business or e-visas, SENAMI.'),
    },
    { name: 'consuladoLocal', type: 'text', section: 'destinatario', label: l('Embaixada / consulado em', 'Embassy / consulate in'), placeholder: l('Ex.: Lisboa', 'E.g. Lisbon'), showIf: (v) => v.destinatario !== 'senami' },
    ...pessoaFields('anfitriao', 'anfitriao', { profile: true }),
    ...workerFields(['telefone'], 'anfitriao', 'anfitriao').map((f) => ({ ...f, required: true, default: (c: DefaultsContext) => (c.profile?.kind === 'pessoa' ? c.profile.telefones || '' : '') })),
    { name: 'anfitriaoEmail', type: 'email', section: 'anfitriao', width: 'half', label: l('Email (opcional)', 'Email (optional)'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.email || '' : '') },
    { name: 'anfitriaoProfissao', type: 'text', section: 'anfitriao', width: 'half', label: l('Profissão (opcional)', 'Occupation (optional)'), default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.profissao || '' : '') },
    {
      name: 'convidados',
      type: 'lines',
      section: 'convidados',
      required: true,
      label: l('Convidados', 'Guests'),
      addLabel: l('Adicionar convidado', 'Add guest'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome completo', 'Full name') },
        { name: 'genero', type: 'select', label: l('Sexo', 'Sex'), options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }] },
        { name: 'nacionalidade', type: 'text', label: l('Nacionalidade', 'Nationality') },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
        { name: 'passaporte', type: 'text', label: l('Passaporte n.º', 'Passport no.') },
        { name: 'validade', type: 'date', label: l('Válido até', 'Valid until') },
        { name: 'relacao', type: 'text', label: l('Relação (ex.: irmão, amiga)', 'Relationship (e.g. brother, friend)') },
      ],
      default: [{ nome: '', genero: 'M', nacionalidade: '', nascimento: '', passaporte: '', validade: '', relacao: '' }],
    },
    {
      name: 'finalidade',
      type: 'select',
      section: 'estadia',
      width: 'half',
      label: l('Motivo da visita', 'Purpose of visit'),
      default: 'familia',
      options: [
        { value: 'familia', label: l('Visita familiar', 'Family visit') },
        { value: 'turismo', label: l('Turismo', 'Tourism') },
        { value: 'negocios', label: l('Negócios', 'Business') },
        { value: 'outro', label: l('Outro', 'Other') },
      ],
    },
    { name: 'finalidadeOutro', type: 'text', section: 'estadia', width: 'half', label: l('Qual', 'Which'), showIf: (v) => v.finalidade === 'outro' },
    { name: 'dataEntrada', type: 'date', section: 'estadia', width: 'half', required: true, label: l('Chegada', 'Arrival') },
    { name: 'dataSaida', type: 'date', section: 'estadia', width: 'half', required: true, label: l('Partida', 'Departure') },
    {
      name: 'moradaAlojamento',
      type: 'text',
      section: 'estadia',
      label: l('Morada onde fica alojado', 'Address where the guest will stay'),
      help: l('Por defeito, a morada do anfitrião.', 'Defaults to the host’s address.'),
    },
    { name: 'alimentacao', type: 'toggle', section: 'estadia', default: true, label: l('Assumo alimentação e assistência', 'I cover meals and assistance') },
    { name: 'regresso', type: 'toggle', section: 'estadia', default: true, label: l('Responsabilizo-me pelo regresso dentro do prazo', 'I take responsibility for the guest leaving on time') },
    localField('documento'),
    dateField('data', 'documento'),
    RECONHECIMENTO_FIELD('documento'),
  ],

  computed: (v) => ({ lista: convidados(v) }),

  warnings: (v, ctx) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Os consulados exigem, em regra, a assinatura do anfitrião reconhecida, cópia do seu BI ou DIRE e comprovativo de morada (${cite('vistoCartaConvite')}). Esta carta não serve para visto de trabalho.`,
          'Consulates usually require the host’s certified signature, a copy of the host’s ID or DIRE and proof of address. This letter is not for a work visa.',
        ),
      },
    ];
    const lista = ctx.computed.lista as Convidado[];
    if (!lista.length) w.push({ level: 'error', field: 'convidados', message: l('Indique quem convida.', 'Enter who you are inviting.') });
    for (const c of lista) {
      if (!c.passaporte) w.push({ level: 'warning', field: 'convidados', message: l(`Falta o passaporte de ${c.nome}.`, `Passport missing for ${c.nome}.`) });
      if (c.validade && v.dataSaida && diffDays(v.dataSaida, c.validade) < 183) {
        w.push({
          level: 'warning',
          field: 'convidados',
          message: l(`O passaporte de ${c.nome} deve, em regra, ser válido por mais seis meses depois da partida. Confirme com o consulado.`, `${c.nome}’s passport should usually be valid for six months after departure. Check with the consulate.`),
        });
      }
    }
    if (v.dataEntrada && v.dataSaida && diffDays(v.dataEntrada, v.dataSaida) < 0) {
      w.push({ level: 'error', field: 'dataSaida', message: l('A data de partida é anterior à de chegada.', 'Departure is before arrival.') });
    }
    if (!str(v.anfitriaoDocNumero)) w.push({ level: 'warning', field: 'anfitriaoDocNumero', message: l('Falta o número do seu documento de identificação.', 'Your ID number is missing.') });
    return w;
  },

  personName: (v) => convidados(v)[0]?.nome || v.anfitriaoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const lista = ctx.computed.lista as Convidado[];
    const plural = lista.length > 1;
    const fConv = !plural && lista[0] ? isF(lista[0].genero) : false;
    const o = plural ? 'os convidados' : fConv ? 'a convidada' : 'o convidado';
    const finalidade = v.finalidade === 'outro' ? str(v.finalidadeOutro) || BLANK : FINALIDADES[v.finalidade] ?? 'visita familiar';
    const morada = str(v.moradaAlojamento) || str(v.anfitriaoMorada) || BLANK;
    const senami = v.destinatario === 'senami';
    const recipient: Block = senami
      ? { type: 'recipient', salutation: 'Exmo. Senhor', lines: ['Director-Geral do Serviço Nacional de Migração', 'MAPUTO'] }
      : { type: 'recipient', salutation: 'Exmo. Senhor', lines: ['Cônsul da República de Moçambique', str(v.consuladoLocal) ? str(v.consuladoLocal).toUpperCase() : BLANK] };
    const contacto = [str(v.anfitriaoTelefone), str(v.anfitriaoEmail)].filter(Boolean).join(' / ');
    const prof = str(v.anfitriaoProfissao) ? `, de profissão ${str(v.anfitriaoProfissao)}` : '';

    const blocks: Block[] = [
      recipient,
      { type: 'subject', text: 'Carta-convite e termo de responsabilidade' },
      { type: 'salutation', text: 'Exmo. Senhor,' },
      {
        type: 'paragraph',
        id: 'convite',
        text: `Eu, ${identificacao(v, 'anfitriao')}${prof}${contacto ? `, contacto ${contacto}` : ''}, venho **convidar** ${plural ? `${o} abaixo identificados` : `${o} ${lista[0] ? convidadoDesc(lista[0]) : `**${BLANK}**`}`} a visitar a República de Moçambique, no período de ${dateLong(v.dataEntrada)} a ${dateLong(v.dataSaida)}, para fins de ${finalidade}${plural ? ':' : '.'}`,
        en: `The host identified above invites the guest(s) named to visit Mozambique from ${v.dataEntrada || '—'} to ${v.dataSaida || '—'} for ${finalidade}.`,
      },
    ];
    if (plural) blocks.push({ type: 'list', style: 'alpha', items: lista.map((c, i) => `${convidadoDesc(c)}${i === lista.length - 1 ? '.' : ';'}`) });
    blocks.push({
      type: 'paragraph',
      id: 'alojamento',
      text: `Durante a estadia, ${o} ${plural ? 'ficarão alojados' : `ficará ${fConv ? 'alojada' : 'alojado'}`} na minha residência, sita em ${morada}${v.alimentacao ? ', responsabilizando-me pelo seu alojamento, alimentação e assistência' : ', responsabilizando-me pelo seu alojamento'}.`,
      en: 'During the stay the guest(s) will live at my home at the stated address, and I take responsibility for their accommodation' + (v.alimentacao ? ', meals and assistance.' : '.'),
    });
    if (v.regresso) {
      blocks.push({
        type: 'paragraph',
        id: 'termo',
        text: `Mais declaro que me **responsabilizo** pela saída ${plural ? 'dos convidados' : fConv ? 'da convidada' : 'do convidado'} do território nacional dentro do prazo autorizado e comprometo-me a informar as autoridades competentes caso tal não aconteça.`,
        en: 'I also take responsibility for the guest(s) leaving the country within the authorised period and will inform the authorities if they do not.',
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Nestes termos, solicito a V. Ex.ª a concessão do visto ${plural ? 'aos convidados' : fConv ? 'à convidada' : 'ao convidado'}, para o que junto os documentos abaixo indicados.`,
        en: 'I therefore ask Your Excellency to grant the visa, and enclose the documents listed.',
      },
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', en: 'Yours faithfully,', keepWithNext: true },
      {
        type: 'signatures',
        placeDate: placeDate(ctx, v.data),
        columns: [
          {
            role: gx(v.anfitriaoGenero, 'O Anfitrião', 'A Anfitriã'),
            name: str(v.anfitriaoNome) || undefined,
            detail: str(v.anfitriaoDocNumero) ? `${str(v.anfitriaoDocTipo) || 'BI'} n.º ${str(v.anfitriaoDocNumero)}` : undefined,
          },
        ],
      },
      {
        type: 'note',
        text: `**Anexos:** cópia do ${str(v.anfitriaoDocTipo) === 'DIRE' ? 'DIRE' : str(v.anfitriaoDocTipo) === 'Passaporte' ? 'passaporte' : 'Bilhete de Identidade'} ${gx(v.anfitriaoGenero, 'do anfitrião', 'da anfitriã')}; comprovativo de morada; cópia do passaporte ${plural ? 'de cada convidado' : fConv ? 'da convidada' : 'do convidado'}.`,
        en: 'Attachments: copy of the host’s ID; proof of address; copy of the guest’s passport.',
      },
    );
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
