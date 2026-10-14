// Consentimento para teleconsulta: the patient agrees to be seen at a distance
// (video, phone or messages) after being told the limits of a remote
// consultation, how privacy is protected, what happens in an emergency and
// how prescriptions, records and payment are handled.

import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { cite, dateField, DOC_TIPO_OPTIONS, formatMoney, g, GENERO_OPTIONS, isF, l, localField, money, placeDate } from './_shared';
import { clinicianFields, clinicianSignature, clinicianWarnings, establishmentName, patientAge, patientFields, patientIdent } from './_saude';
import { juntar, or, str } from './_saude-educacao';

const MEIOS = [
  { name: 'meioVideo', pt: 'videochamada', en: 'video call', def: true },
  { name: 'meioTelefone', pt: 'chamada telefónica', en: 'phone call', def: true },
  { name: 'meioMensagens', pt: 'mensagens escritas', en: 'written messages', def: false },
];

export default defineTemplate({
  id: 'consentimento-teleconsulta',
  family: 'declaracao',
  sections: [
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'representante', title: l('Representante legal (se for o caso)', 'Legal representative (if any)') },
    { id: 'teleconsulta', title: l('Teleconsulta', 'Teleconsultation') },
    { id: 'clinico', title: l('Médico', 'Doctor') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero', 'telefone'], 'doente'),
    { name: 'temRepresentante', type: 'toggle', section: 'representante', label: l('Assina o representante legal (menor ou incapaz)', 'The legal representative signs') },
    { name: 'repNome', type: 'text', section: 'representante', width: 'half', label: l('Nome do representante', 'Representative’s name'), showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repGenero', type: 'radio', section: 'representante', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'F', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocTipo', type: 'select', section: 'representante', width: 'half', label: l('Documento', 'ID document'), options: DOC_TIPO_OPTIONS, default: 'BI', showIf: (v) => Boolean(v.temRepresentante) },
    { name: 'repDocNumero', type: 'text', section: 'representante', width: 'half', label: l('Número do documento', 'Document number'), showIf: (v) => Boolean(v.temRepresentante) },
    ...MEIOS.map((m) => ({ name: m.name, type: 'toggle' as const, section: 'teleconsulta', label: l(m.pt.charAt(0).toUpperCase() + m.pt.slice(1), m.en), default: m.def })),
    { name: 'plataforma', type: 'text', section: 'teleconsulta', width: 'half', label: l('Plataforma', 'Platform'), placeholder: l('Ex.: WhatsApp, Zoom, Google Meet', 'E.g. WhatsApp, Zoom') },
    { name: 'preco', type: 'money', section: 'teleconsulta', width: 'half', label: l('Preço por consulta (opcional)', 'Fee per consultation (optional)') },
    { name: 'pagamento', type: 'text', section: 'teleconsulta', width: 'half', label: l('Forma de pagamento (opcional)', 'Payment method (optional)'), placeholder: l('Ex.: M-Pesa, antes da consulta', 'E.g. mobile money, before the call') },
    { name: 'gravacao', type: 'toggle', section: 'teleconsulta', label: l('O doente autoriza a gravação da consulta', 'The patient allows recording') },
    { name: 'urgencia', type: 'text', section: 'teleconsulta', label: l('Contacto de urgência a indicar', 'Emergency contact to give'), placeholder: l('Ex.: Banco de Socorros do Hospital Central, ou o 117', 'E.g. the nearest emergency service') },
    ...clinicianFields('clinico'),
    localField(),
    dateField(),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (!MEIOS.some((m) => v[m.name])) w.push({ level: 'error', field: 'meioVideo', message: l('Escolha pelo menos um meio de comunicação.', 'Choose at least one channel.') });
    const maior = ctx.legal.value<{ anos: number }>('maioridade').anos;
    const age = patientAge(v);
    if (age != null && age < maior && !v.temRepresentante) w.push({ level: 'warning', field: 'temRepresentante', message: l('Doente menor: assina o pai, a mãe ou o representante legal.', 'Minor patient: a parent or guardian signs.') });
    w.push({
      level: 'info',
      message: l(
        `Não foi encontrada regra moçambicana própria da telemedicina; aplicam-se o consentimento informado e a confidencialidade (${cite('seTeleconsulta')}). Pode guardar este consentimento assinado ou enviado por mensagem com a fotografia da página assinada.`,
        'No specific Mozambican telemedicine rule was found; informed consent and confidentiality apply.',
      ),
    });
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const rep = Boolean(v.temRepresentante);
    const fr = isF(v.repGenero);
    const pat = patientIdent(v);
    const unidade = establishmentName(ctx);
    const clin = `${str(v.clinicoTitulo) ? `${str(v.clinicoTitulo)} ` : ''}${or(v.clinicoNome)}`;
    const meios = MEIOS.filter((m) => v[m.name]).map((m) => m.pt);
    const preco = money(v.preco);
    const eu = rep
      ? `Eu, **${or(v.repNome)}**, ${fr ? 'portadora' : 'portador'} do ${str(v.repDocTipo) || 'BI'} n.º ${or(v.repDocNumero, '__________')}, na qualidade de representante legal de ${pat.pt},`
      : `Eu, ${pat.pt},`;
    const informado = rep ? (fr ? 'informada' : 'informado') : g(v.doenteGenero, 'informado', 'informada');
    const items = [
      `a teleconsulta é feita por ${juntar(meios) || '____________________'}${str(v.plataforma) ? `, através de ${str(v.plataforma)}` : ''}, e tem as limitações próprias de uma consulta sem exame físico; o médico pode, a qualquer momento, recomendar uma consulta presencial, exames ou o encaminhamento para uma unidade sanitária;`,
      'a teleconsulta não se destina a situações de urgência: em caso de agravamento ou de sinais de alarme devo procurar de imediato o serviço de urgência mais próximo' + (str(v.urgencia) ? ` (${str(v.urgencia).replace(/[.;]+$/, '')});` : ';'),
      'devo estar num local reservado durante a consulta e identificar quem me acompanha; a informação trocada é confidencial e fica registada no meu processo clínico;',
      v.gravacao ? 'autorizo a gravação da consulta, que fica guardada no processo clínico com o mesmo sigilo;' : 'a consulta não é gravada por nenhuma das partes sem o consentimento expresso da outra;',
      'as receitas, atestados e relatórios podem ser emitidos e enviados por meio electrónico ou levantados na unidade sanitária;',
      preco != null ? `o preço de cada teleconsulta é de ${formatMoney(preco)}${str(v.pagamento) ? `, pago por ${str(v.pagamento).replace(/[.;]+$/, '')}` : ''};` : str(v.pagamento) ? `o pagamento é feito por ${str(v.pagamento).replace(/[.;]+$/, '')};` : '',
      'uma falha da ligação pode obrigar a remarcar a consulta, e as comunicações por meios electrónicos têm riscos de segurança que reduzo usando um aparelho e uma ligação de confiança;',
      'posso recusar ou retirar este consentimento a qualquer momento, sem prejuízo do atendimento presencial.',
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: 'title', text: 'Consentimento para Teleconsulta' },
      {
        type: 'paragraph',
        id: 'intro',
        text: `${eu} declaro que fui ${informado} por **${clin}**${unidade ? `, da ${unidade}` : ''}, e compreendi, que:`,
        en: `I declare that ${v.clinicoNome || 'the doctor'} informed me, and I understood, that:`,
      },
      { type: 'list', style: 'alpha', items },
      {
        type: 'paragraph',
        id: 'consente',
        text: `Tive oportunidade de fazer perguntas e, de forma livre e esclarecida, **dou o meu consentimento** para ${rep ? g(v.doenteGenero, 'que o meu representado seja atendido', 'que a minha representada seja atendida') : g(v.doenteGenero, 'ser atendido', 'ser atendida')} por teleconsulta.`,
        en: 'I had the chance to ask questions and freely consent to teleconsultation.',
        keepWithNext: true,
      },
    ];
    const signer: SignatureColumn = rep
      ? { role: fr ? 'A Representante Legal' : 'O Representante Legal', name: str(v.repNome) || undefined }
      : { role: isF(v.doenteGenero) ? 'A Doente' : 'O Doente', name: str(v.doenteNome) || undefined };
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [signer, clinicianSignature(ctx)] });
    return blocks;
  },
});
