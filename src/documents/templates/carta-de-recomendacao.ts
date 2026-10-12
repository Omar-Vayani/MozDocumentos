import { diffDays } from '@/lib/format';
import { profileDisplayName, type Profile } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, g, l, localField, refField, splitLines, workerFields } from './_shared';

// ---------------------------------------------------------------- local helpers

const porEmpresa = (v: Values, p: Profile | null) => v.recomendanteTipo !== 'pessoa' && p?.kind === 'empresa';
const endDot = (s: string) => (/[.!?:;]$/.test(s.trim()) ? s.trim().replace(/[;:]$/, '.') : `${s.trim()}.`);
const lowerFirst = (s: string) => {
  const t = s.trim();
  return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
};

/** Splits text into paragraphs: by blank lines if there are any, otherwise by line. */
function paragraphs(text: unknown): string[] {
  if (typeof text !== 'string') return [];
  const t = text.replace(/\r\n/g, '\n').trim();
  if (!t) return [];
  const parts = /\n\s*\n/.test(t) ? t.split(/\n\s*\n+/) : t.split(/\n+/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** "84 123 4567 ou do endereço electrónico x@y" */
function contactos(tel: string, email: string): string {
  if (tel && email) return `do telefone ${tel} ou do endereço electrónico ${email}`;
  if (tel) return `do telefone ${tel}`;
  if (email) return `do endereço electrónico ${email}`;
  return '';
}

const TRATAMENTO_OPTIONS = [
  { value: 'Exmo. Senhor', label: l('Exmo. Senhor', 'Exmo. Senhor (Dear Sir)') },
  { value: 'Exma. Senhora', label: l('Exma. Senhora', 'Exma. Senhora (Dear Madam)') },
  { value: 'Exmos. Senhores', label: l('Exmos. Senhores (a uma entidade)', 'Exmos. Senhores (to an organisation)') },
];

export default defineTemplate({
  id: 'carta-de-recomendacao',
  sections: [
    { id: 'documento', title: l('Referência e data', 'Reference and date') },
    { id: 'recomendante', title: l('Quem recomenda', 'Recommender') },
    { id: 'trabalhador', title: l('Pessoa recomendada', 'Person recommended'), personRole: 'trabalhador' },
    { id: 'avaliacao', title: l('Qualidades e resultados', 'Qualities and achievements') },
    { id: 'destinatario', title: l('Destinatário', 'Addressee') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    {
      name: 'recomendanteTipo',
      type: 'radio',
      section: 'recomendante',
      label: l('Quem recomenda', 'Who recommends'),
      options: [
        { value: 'empresa', label: l('A empresa do perfil', 'The profile’s company') },
        { value: 'pessoa', label: l('Eu, a título pessoal', 'Me, personally') },
      ],
      default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa'),
    },
    {
      name: 'signatarioNome',
      type: 'text',
      section: 'recomendante',
      width: 'half',
      required: true,
      label: l('Nome de quem assina', 'Signatory’s name'),
      default: (c) => (c.profile?.kind === 'pessoa' ? c.profile.nome ?? '' : c.profile?.representanteNome ?? ''),
    },
    {
      name: 'signatarioGenero',
      type: 'radio',
      section: 'recomendante',
      width: 'half',
      label: l('Tratamento de quem assina', 'Signatory’s form of address'),
      options: [
        { value: 'M', label: l('Masculino', 'Male') },
        { value: 'F', label: l('Feminino', 'Female') },
      ],
      default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero ? c.profile.genero : 'M'),
    },
    {
      name: 'signatarioCargo',
      type: 'text',
      section: 'recomendante',
      width: 'half',
      label: l('Cargo de quem assina', 'Signatory’s position'),
      default: (c) => (c.profile?.kind === 'empresa' ? c.profile.representanteCargo ?? '' : ''),
    },
    {
      name: 'signatarioEntidade',
      type: 'text',
      section: 'recomendante',
      width: 'half',
      label: l('Entidade onde trabalha (opcional)', 'Organisation (optional)'),
      showIf: (v) => v.recomendanteTipo === 'pessoa',
    },
    {
      name: 'relacao',
      type: 'text',
      section: 'recomendante',
      label: l('Relação com a pessoa recomendada', 'Relationship with the person'),
      placeholder: l('Ex.: seu supervisor directo no Departamento Financeiro', 'E.g. their direct supervisor in the Finance Department'),
      help: l('Continua a frase «…, na qualidade de …».', 'Continues “…, as …”.'),
      showIf: (v) => v.recomendanteTipo === 'pessoa',
    },
    {
      name: 'contactoTelefone',
      type: 'tel',
      section: 'recomendante',
      width: 'half',
      label: l('Telefone para contacto', 'Contact phone'),
      default: (c) => c.profile?.telefones ?? '',
    },
    {
      name: 'contactoEmail',
      type: 'email',
      section: 'recomendante',
      width: 'half',
      label: l('Email para contacto', 'Contact email'),
      default: (c) => c.profile?.email ?? '',
    },
    ...workerFields(['nome', 'genero', 'cargo', 'departamento', 'dataAdmissao']),
    {
      name: 'aoServico',
      type: 'toggle',
      section: 'trabalhador',
      label: l('Ainda trabalha connosco', 'Still works with us'),
      default: false,
    },
    {
      name: 'dataSaida',
      type: 'date',
      section: 'trabalhador',
      width: 'half',
      label: l('Data de saída', 'End date'),
      showIf: (v) => !v.aoServico,
    },
    {
      name: 'qualidades',
      type: 'textarea',
      section: 'avaliacao',
      required: true,
      rows: 5,
      label: l('Qualidades profissionais', 'Professional qualities'),
      help: l(
        'Uma por linha, de forma concreta. Ex.: «rigor no controlo de stocks»; «pontualidade e assiduidade exemplares»; «capacidade de coordenar equipas de até 12 pessoas».',
        'One per line, specific. E.g. “accurate stock control”; “excellent attendance”; “led teams of up to 12 people”.',
      ),
    },
    {
      name: 'formato',
      type: 'radio',
      section: 'avaliacao',
      width: 'half',
      label: l('Apresentar as qualidades', 'Show the qualities as'),
      options: [
        { value: 'lista', label: l('Em lista', 'A list') },
        { value: 'texto', label: l('Em texto corrido', 'Running text') },
      ],
      default: 'lista',
    },
    {
      name: 'conquistas',
      type: 'textarea',
      section: 'avaliacao',
      rows: 4,
      label: l('Resultados alcançados (opcional)', 'Achievements (optional)'),
      help: l('Um por linha. Ex.: «reduziu para metade as perdas de armazém em 2025».', 'One per line. E.g. “halved warehouse losses in 2025”.'),
    },
    {
      name: 'recomendadoPara',
      type: 'text',
      section: 'avaliacao',
      label: l('Recomendado para (opcional)', 'Recommended for (optional)'),
      placeholder: l('Ex.: funções de gestão administrativa', 'E.g. administrative management roles'),
      help: l('Continua a frase «recomendamos … para …».', 'Continues “we recommend … for …”.'),
    },
    {
      name: 'destinatarioTipo',
      type: 'radio',
      section: 'destinatario',
      label: l('Dirigida a', 'Addressed to'),
      options: [
        { value: 'geral', label: l('A quem possa interessar', 'To whom it may concern') },
        { value: 'especifico', label: l('Uma entidade concreta', 'A specific organisation') },
      ],
      default: 'geral',
    },
    {
      name: 'tratamento',
      type: 'select',
      section: 'destinatario',
      width: 'half',
      label: l('Tratamento', 'Form of address'),
      options: TRATAMENTO_OPTIONS,
      default: 'Exmos. Senhores',
      showIf: (v) => v.destinatarioTipo === 'especifico',
    },
    {
      name: 'destinatarioNome',
      type: 'text',
      section: 'destinatario',
      width: 'half',
      label: l('Nome ou cargo (opcional)', 'Name or position (optional)'),
      showIf: (v) => v.destinatarioTipo === 'especifico',
    },
    {
      name: 'destinatarioEntidade',
      type: 'text',
      section: 'destinatario',
      label: l('Entidade', 'Organisation'),
      showIf: (v) => v.destinatarioTipo === 'especifico',
    },
    {
      name: 'destinatarioMorada',
      type: 'text',
      section: 'destinatario',
      label: l('Morada (opcional)', 'Address (optional)'),
      showIf: (v) => v.destinatarioTipo === 'especifico',
    },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    if (!v.trabalhadorNome) w.push({ level: 'warning', field: 'trabalhadorNome', message: l('Indique o nome da pessoa recomendada.', 'Enter the name of the person recommended.') });
    if (!splitLines(v.qualidades).length) {
      w.push({ level: 'warning', field: 'qualidades', message: l('Indique as qualidades que justificam a recomendação.', 'List the qualities that support the recommendation.') });
    }
    if (!v.trabalhadorDataAdmissao) w.push({ level: 'info', field: 'trabalhadorDataAdmissao', message: l('Indique desde quando a pessoa trabalhou convosco.', 'State since when the person worked with you.') });
    if (!v.aoServico && v.dataSaida && v.trabalhadorDataAdmissao && diffDays(v.trabalhadorDataAdmissao, v.dataSaida) < 0) {
      w.push({ level: 'error', field: 'dataSaida', message: l('A data de saída é anterior à data de admissão.', 'The end date is before the start date.') });
    }
    if (!v.contactoTelefone && !v.contactoEmail) {
      w.push({ level: 'info', field: 'contactoTelefone', message: l('Indique um contacto para quem quiser confirmar a recomendação.', 'Add a contact for anyone wishing to confirm the recommendation.') });
    }
    if (v.recomendanteTipo !== 'pessoa' && ctx.profile?.kind !== 'empresa') {
      w.push({ level: 'warning', field: 'recomendanteTipo', message: l('O perfil activo não é de uma empresa. Escolha «Eu, a título pessoal».', 'The active profile is not a company. Choose “Me, personally”.') });
    }
    if (v.destinatarioTipo === 'especifico' && !v.destinatarioEntidade && !v.destinatarioNome) {
      w.push({ level: 'warning', field: 'destinatarioEntidade', message: l('Indique a entidade destinatária.', 'Enter the addressee.') });
    }
    return w;
  },

  personName: (v) => v.trabalhadorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const p = ctx.profile;
    const empresa = porEmpresa(v, p);
    const ge = v.trabalhadorGenero;
    const oSr = g(ge, 'o Senhor', 'a Senhora');
    const nome = `**${v.trabalhadorNome || BLANK}**`;
    const firma = profileDisplayName(p) || BLANK;
    const qualidades = splitLines(v.qualidades);
    const conquistas = splitLines(v.conquistas);
    const nos = (plural: string, singular: string) => (empresa ? plural : singular);
    const blocks: Block[] = [];

    // An individual writing personally: identify the sender at the top.
    if (!empresa) {
      const lines = [
        `**${v.signatarioNome || BLANK}**`,
        [v.signatarioCargo, v.signatarioEntidade].filter(Boolean).join(', '),
        p?.kind === 'pessoa' ? addressLine(p) : '',
        [v.contactoTelefone ? `Tel.: ${v.contactoTelefone}` : '', v.contactoEmail ? `Email: ${v.contactoEmail}` : ''].filter(Boolean).join(' · '),
      ].filter(Boolean);
      blocks.push({ type: 'paragraph', id: 'remetente', text: lines.join('\n'), align: 'left', size: 'small', en: 'Sender’s name and contact details.' });
    }

    blocks.push({ type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) });
    let saudacao: string;
    if (v.destinatarioTipo === 'especifico') {
      const tratamento = v.tratamento || 'Exmos. Senhores';
      const lines = [v.destinatarioNome, v.destinatarioEntidade, v.destinatarioMorada].map((s) => String(s ?? '').trim()).filter(Boolean);
      blocks.push({ type: 'recipient', salutation: tratamento, lines: lines.length ? lines : [BLANK] });
      blocks.push({ type: 'subject', text: `Carta de recomendação — ${v.trabalhadorNome || BLANK}` });
      saudacao = `${tratamento},`;
    } else {
      blocks.push({ type: 'title', text: 'Carta de Recomendação' });
      saudacao = 'A quem possa interessar,';
    }
    blocks.push({ type: 'salutation', text: saudacao });

    // Who the person is and how long they worked
    const dept = v.trabalhadorDepartamento ? ` (${String(v.trabalhadorDepartamento).trim()})` : '';
    const funcao = v.trabalhadorCargo ? `com a função de ${String(v.trabalhadorCargo).trim()}${dept}` : '';
    const onde = empresa ? 'nesta empresa' : 'comigo';
    const periodo = v.aoServico
      ? `trabalha ${onde} desde ${dateLong(v.trabalhadorDataAdmissao)}`
      : `trabalhou ${onde} de ${dateLong(v.trabalhadorDataAdmissao)} a ${dateLong(v.dataSaida)}`;
    const abertura = empresa
      ? `A **${firma}** declara, para os devidos efeitos, que ${oSr} ${nome} ${periodo}${funcao ? `, ${funcao}` : ''}.`
      : `Eu, **${v.signatarioNome || BLANK}**${v.signatarioCargo ? `, ${v.signatarioCargo}` : ''}${v.signatarioEntidade ? ` (${String(v.signatarioEntidade).trim()})` : ''}, recomendo ${oSr} ${nome}, que conheço profissionalmente${v.relacao ? ` na qualidade de ${lowerFirst(String(v.relacao)).replace(/[.;]$/, '')}` : ''}. ${g(ge, 'O Senhor', 'A Senhora')} ${v.trabalhadorNome || BLANK} ${periodo}${funcao ? `, ${funcao}` : ''}.`;
    blocks.push({
      type: 'paragraph',
      id: 'abertura',
      text: abertura,
      en: empresa
        ? `${firma} states that ${v.trabalhadorNome || 'the person'} ${v.aoServico ? 'has worked for the company since the date stated' : 'worked for the company during the period stated'}, in the position stated.`
        : `I recommend ${v.trabalhadorNome || 'the person'}, whom I know professionally, who ${v.aoServico ? 'has held' : 'held'} the position stated during the period stated.`,
    });

    // Qualities
    if (v.formato === 'texto') {
      const prosa = paragraphs(v.qualidades);
      if (prosa.length) prosa.forEach((text, i) => blocks.push({ type: 'paragraph', id: `qualidades-${i + 1}`, text }));
      else blocks.push({ type: 'paragraph', id: 'qualidades-1', text: BLANK });
    } else {
      blocks.push(
        {
          type: 'paragraph',
          id: 'qualidades',
          text: `Durante este período, ${oSr} ${v.trabalhadorNome || BLANK} demonstrou as seguintes qualidades profissionais:`,
          en: 'During this period the person showed the following professional qualities:',
          keepWithNext: true,
        },
        { type: 'list', style: 'bullet', items: qualidades.length ? qualidades.map((q) => endDot(lowerFirst(q)).replace(/^./, (c) => c.toUpperCase())) : [BLANK] },
      );
    }

    if (conquistas.length) {
      blocks.push(
        {
          type: 'paragraph',
          id: 'conquistas',
          text: `${nos('Destacamos', 'Destaco')} ainda os seguintes resultados do seu trabalho:`,
          en: `${empresa ? 'We' : 'I'} also highlight the following results of their work:`,
          keepWithNext: true,
        },
        { type: 'list', style: 'bullet', items: conquistas.map((q) => endDot(q)) },
      );
    }

    const para = String(v.recomendadoPara ?? '').trim().replace(/[.;]$/, '');
    blocks.push({
      type: 'paragraph',
      id: 'recomendacao',
      text: `Pelo exposto, ${nos('recomendamos', 'recomendo')} ${oSr} ${v.trabalhadorNome || BLANK} sem reservas${para ? ` para ${lowerFirst(para)}` : ''}, ${empresa ? 'certos' : g(v.signatarioGenero, 'certo', 'certa')} de que será ${g(ge, 'um colaborador', 'uma colaboradora')} de valor para a entidade que ${g(ge, 'o', 'a')} venha a integrar.`,
      en: `For these reasons ${empresa ? 'we' : 'I'} recommend the person without reservation${para ? ` for ${para}` : ''}, confident they will be a valuable member of any organisation they join.`,
    });

    const contacto = contactos(String(v.contactoTelefone ?? '').trim(), String(v.contactoEmail ?? '').trim());
    if (contacto) {
      blocks.push({
        type: 'paragraph',
        id: 'contacto',
        text: `Para qualquer esclarecimento adicional, ${nos('estamos disponíveis', 'estou disponível')} através ${contacto}.`,
        en: `For any further information, ${empresa ? 'we are' : 'I am'} available by phone or email as stated.`,
      });
    }

    blocks.push(
      { type: 'paragraph', id: 'fecho', text: 'Com os melhores cumprimentos,', align: 'left', keepWithNext: true, en: 'Yours faithfully,' },
      {
        type: 'signatures',
        columns: [
          empresa
            ? { role: v.signatarioCargo || ' ', name: v.signatarioNome || undefined, image: 'both' }
            : { role: ' ', name: v.signatarioNome || undefined, detail: [v.signatarioCargo, v.signatarioEntidade].filter(Boolean).join(', ') || undefined },
        ],
      },
    );
    return blocks;
  },
});

