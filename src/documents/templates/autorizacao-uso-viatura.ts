// Declaração de autorização de uso de viatura: the owner (a person or a
// company) allows someone else to drive the vehicle, to be shown at police
// checks or at the border.

import { diffDays } from '@/lib/format';
import { profileDisplayName } from '@/lib/storage/types';
import { addressLine } from '../layouts/address';
import { defineTemplate, type Block, type SignatureColumn, type Values, type Warning } from '../model';
import { BLANK, dateField, dateLong, employerRep, l, localField, placeDate } from './_shared';
import { gx, identificacao, notaryBox, pessoaFields, RECONHECIMENTO_FIELD, str } from './_pessoal-rh';

const isEmpresa = (v: Values) => v.proprietarioTipo === 'empresa';

export default defineTemplate({
  id: 'autorizacao-uso-viatura',
  family: 'declaracao',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'proprietario', title: l('Proprietário', 'Owner'), personRole: 'outro' },
    { id: 'viatura', title: l('Viatura', 'Vehicle') },
    { id: 'condutor', title: l('Condutor autorizado', 'Authorised driver'), personRole: 'outro' },
    { id: 'ambito', title: l('Período e âmbito', 'Period and scope') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data da autorização', 'Date of the authorisation')),
    {
      name: 'proprietarioTipo',
      type: 'radio',
      section: 'proprietario',
      label: l('A viatura pertence a', 'The vehicle belongs to'),
      default: (c) => (c.profile?.kind === 'empresa' ? 'empresa' : 'pessoa'),
      options: [
        { value: 'pessoa', label: l('Uma pessoa (eu)', 'A person (me)') },
        { value: 'empresa', label: l('A empresa do perfil', 'The profile’s company') },
      ],
    },
    ...pessoaFields('proprietario', 'proprietario', { profile: true }).map((f) => ({ ...f, showIf: (v: Values) => !isEmpresa(v) })),
    { name: 'marca', type: 'text', section: 'viatura', width: 'half', required: true, label: l('Marca e modelo', 'Make and model'), placeholder: l('Ex.: Toyota Hilux', 'E.g. Toyota Hilux') },
    { name: 'matricula', type: 'text', section: 'viatura', width: 'half', required: true, label: l('Matrícula', 'Registration plate'), placeholder: l('Ex.: AAA 123 MC', 'E.g. AAA 123 MC') },
    { name: 'cor', type: 'text', section: 'viatura', width: 'half', label: l('Cor', 'Colour') },
    { name: 'quadro', type: 'text', section: 'viatura', width: 'half', label: l('N.º do quadro (chassis)', 'Chassis number') },
    { name: 'livrete', type: 'text', section: 'viatura', width: 'half', label: l('Livrete / título de propriedade n.º', 'Registration book / title no.') },
    ...pessoaFields('condutor', 'condutor', { keys: ['nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero', 'morada'] }),
    { name: 'condutorCarta', type: 'text', section: 'condutor', width: 'half', required: true, label: l('Carta de condução n.º', 'Driving licence no.') },
    { name: 'condutorCargo', type: 'text', section: 'condutor', width: 'half', label: l('Cargo na empresa (opcional)', 'Position in the company (optional)'), showIf: (v) => isEmpresa(v) },
    { name: 'dataInicio', type: 'date', section: 'ambito', width: 'half', required: true, label: l('De', 'From'), default: (c) => c.today },
    { name: 'dataFim', type: 'date', section: 'ambito', width: 'half', required: true, label: l('Até', 'Until') },
    {
      name: 'ambito',
      type: 'radio',
      section: 'ambito',
      label: l('Onde pode circular', 'Where it may be driven'),
      default: 'nacional',
      options: [
        { value: 'nacional', label: l('Só em território nacional', 'Within Mozambique only') },
        { value: 'estrangeiro', label: l('Também pode sair do país', 'May also leave the country') },
      ],
    },
    { name: 'destino', type: 'text', section: 'ambito', label: l('País de destino', 'Destination country'), placeholder: l('Ex.: Reino de Eswatini', 'E.g. Eswatini'), showIf: (v) => v.ambito === 'estrangeiro' },
    { name: 'finalidade', type: 'text', section: 'ambito', label: l('Finalidade (opcional)', 'Purpose (optional)'), placeholder: l('Ex.: deslocações em serviço da empresa', 'E.g. company business travel') },
    RECONHECIMENTO_FIELD('ambito'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          'Esta declaração segue a prática corrente; não foi confirmada uma norma que a exija. Leve também o livrete ou título de propriedade, o seguro obrigatório e a inspecção válidos.',
          'This declaration follows common practice; no rule requiring it was confirmed. Also carry the registration document, compulsory insurance and valid inspection.',
        ),
      },
    ];
    if (v.ambito === 'estrangeiro') {
      w.push({
        level: 'warning',
        field: 'ambito',
        message: l(
          'Para sair do país com viatura de terceiro, reconheça a assinatura e confirme na fronteira e nas Alfândegas os documentos exigidos (por exemplo, a declaração de saída temporária da viatura).',
          'To take someone else’s vehicle abroad, certify the signature and check with the border and Customs which documents are required.',
        ),
      });
    }
    if (v.dataInicio && v.dataFim && diffDays(v.dataInicio, v.dataFim) < 0) {
      w.push({ level: 'error', field: 'dataFim', message: l('A data final é anterior à inicial.', 'The end date is before the start date.') });
    }
    if (isEmpresa(v) && ctx.profile?.kind !== 'empresa') {
      w.push({ level: 'warning', field: 'proprietarioTipo', message: l('O perfil activo não é de uma empresa.', 'The active profile is not a company.') });
    }
    if (!str(v.condutorCarta)) w.push({ level: 'warning', field: 'condutorCarta', message: l('Indique a carta de condução do condutor.', 'Enter the driver’s licence number.') });
    return w;
  },

  personName: (v) => v.condutorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const empresa = isEmpresa(v) && ctx.profile?.kind === 'empresa';
    const p = ctx.profile;
    const quem = empresa
      ? [
          `**${profileDisplayName(p) || BLANK}**`,
          p && addressLine(p) ? `com sede em ${addressLine(p)}` : '',
          p?.nuit ? `NUIT ${p.nuit}` : '',
          employerRep(ctx).nome ? `neste acto representada por ${employerRep(ctx).nome}${employerRep(ctx).cargo ? `, na qualidade de ${employerRep(ctx).cargo}` : ''}` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : identificacao(v, 'proprietario');
    const fProp = !empresa && v.proprietarioGenero === 'F';
    const viatura = [
      `de marca e modelo ${str(v.marca) || BLANK}`,
      `com a matrícula **${str(v.matricula) || BLANK}**`,
      str(v.cor) ? `de cor ${str(v.cor)}` : '',
      str(v.quadro) ? `com o quadro n.º ${str(v.quadro)}` : '',
      str(v.livrete) ? `conforme livrete/título de propriedade n.º ${str(v.livrete)}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const condutor = `${identificacao(v, 'condutor', { nuit: false })}${str(v.condutorCargo) && empresa ? `, ${str(v.condutorCargo)} da empresa` : ''}, titular da carta de condução n.º ${str(v.condutorCarta) || BLANK}`;
    const ambito = v.ambito === 'estrangeiro' ? `em território nacional e ${str(v.destino) ? `em ${str(v.destino)}` : 'no estrangeiro'}, podendo sair e reentrar no país pelos postos fronteiriços competentes` : 'em todo o território nacional';

    const assinatura: SignatureColumn = empresa
      ? { role: 'A Proprietária', name: employerRep(ctx).nome || undefined, detail: employerRep(ctx).cargo || undefined, image: 'both' }
      : { role: fProp ? 'A Proprietária' : 'O Proprietário', name: str(v.proprietarioNome) || undefined };

    const blocks: Block[] = [
      { type: 'title', text: 'Declaração de Autorização de Uso de Viatura' },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: `${quem}, na qualidade de ${empresa ? 'proprietária' : fProp ? 'proprietária' : 'proprietário'} da viatura ${viatura}, **autoriza** ${condutor}, a conduzir a referida viatura ${ambito}, no período de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}${str(v.finalidade) ? `, para ${str(v.finalidade).replace(/^para\s/i, '').replace(/\.$/, '')}` : ''}.`,
        en: `The owner identified above authorises the driver named to drive vehicle ${v.matricula || '—'} ${v.ambito === 'estrangeiro' ? 'in Mozambique and abroad' : 'within Mozambique'} from ${v.dataInicio || '—'} to ${v.dataFim || '—'}.`,
      },
      {
        type: 'paragraph',
        id: 'responsabilidade',
        text: `${gx(v.condutorGenero, 'O condutor', 'A condutora')} obriga-se a cumprir as regras de trânsito e a apresentar a presente declaração, juntamente com os documentos da viatura, sempre que lhe seja solicitado pelas autoridades.`,
        en: 'The driver must obey traffic rules and show this declaration with the vehicle documents whenever the authorities ask.',
      },
      {
        type: 'paragraph',
        id: 'fecho',
        text: 'Por ser verdade, passa-se a presente declaração, que vai assinada.',
        en: 'In witness whereof, this declaration is issued and signed.',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [assinatura] },
    ];
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
