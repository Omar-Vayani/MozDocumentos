// Ficha de registo de hóspede (check-in): the guest registration card kept by
// the establishment. Labels in Portuguese and English for foreign guests. The
// report of foreign guests to the migration service follows its own official
// form; this card is the establishment's own record.

import { formatDateShort } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, l } from './_shared';
import { semPonto, str } from './_contratos';
import { issuer } from './_digital';

const b = (x: unknown) => str(x) || BLANK;
const d = (x: unknown) => (str(x) ? formatDateShort(String(x)) : '___/___/______');

export default defineTemplate({
  id: 'ficha-registo-hospede',
  family: 'mapa',
  sections: [
    { id: 'estadia', title: l('Estadia (opcional)', 'Stay (optional)'), description: l('Deixe em branco para imprimir fichas para preencher à mão.', 'Leave blank to print cards to fill in by hand.') },
    { id: 'hospede', title: l('Hóspede (opcional)', 'Guest (optional)'), personRole: 'cliente' },
    { id: 'opcoes', title: l('Opções', 'Options') },
  ],
  fields: [
    { name: 'quarto', type: 'text', section: 'estadia', width: 'half', label: l('Quarto n.º', 'Room no.') },
    { name: 'reserva', type: 'text', section: 'estadia', width: 'half', label: l('Reserva n.º', 'Booking no.') },
    { name: 'checkin', type: 'date', section: 'estadia', width: 'half', label: l('Entrada', 'Arrival') },
    { name: 'checkout', type: 'date', section: 'estadia', width: 'half', label: l('Saída prevista', 'Departure') },

    { name: 'apelido', type: 'text', section: 'hospede', width: 'half', label: l('Apelido', 'Surname') },
    { name: 'nomes', type: 'text', section: 'hospede', width: 'half', label: l('Nome(s)', 'First name(s)') },
    { name: 'nacionalidade', type: 'text', section: 'hospede', width: 'half', label: l('Nacionalidade', 'Nationality') },
    { name: 'nascimento', type: 'date', section: 'hospede', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    { name: 'docTipo', type: 'text', section: 'hospede', width: 'half', label: l('Documento (BI, passaporte, DIRE)', 'Document') },
    { name: 'docNumero', type: 'text', section: 'hospede', width: 'half', label: l('Número', 'Number') },
    { name: 'morada', type: 'text', section: 'hospede', label: l('Morada habitual', 'Home address') },
    { name: 'telefone', type: 'text', section: 'hospede', width: 'half', label: l('Telefone', 'Phone') },
    { name: 'email', type: 'text', section: 'hospede', width: 'half', label: l('E-mail', 'E-mail') },

    { name: 'acompanhantesLinhas', type: 'number', section: 'opcoes', width: 'half', min: 0, max: 8, default: 3, label: l('Linhas para acompanhantes', 'Lines for companions') },
    { name: 'viatura', type: 'toggle', section: 'opcoes', default: true, label: l('Pedir a matrícula da viatura', 'Ask for the car plate') },
    { name: 'marketing', type: 'toggle', section: 'opcoes', default: true, label: l('Pedir consentimento para novidades e promoções', 'Ask consent for news and offers') },
  ],

  warnings: (_v: Values) => {
    const w: Warning[] = [];
    w.push({ level: 'info', message: l(`Os hóspedes estrangeiros são comunicados aos serviços de migração no modelo oficial e no prazo legal (${cite('turRegistoHospedes')}). Guarde as fichas em local seguro: contêm dados pessoais.`, 'Foreign guests must be reported to migration on the official form within the legal period. Keep the cards secure: they contain personal data.') });
    return w;
  },

  personName: (v) => [str(v.nomes), str(v.apelido)].filter(Boolean).join(' ') || undefined,
  documentDate: (v) => v.checkin,

  blocks: (ctx) => {
    const v = ctx.values;
    const n = Math.max(0, Math.min(8, Number(v.acompanhantesLinhas) || 0));
    const blocks: Block[] = [
      { type: 'title', text: 'Ficha de registo de hóspede', subtitle: `Guest registration card · ${issuer(ctx)}` },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Quarto / Room', value: b(v.quarto) },
          { label: 'Reserva / Booking', value: b(v.reserva) },
          { label: 'Entrada / Arrival', value: d(v.checkin) },
          { label: 'Saída / Departure', value: d(v.checkout) },
        ],
      },
      {
        type: 'keyValue',
        title: 'Hóspede / Guest',
        columns: 2,
        items: [
          { label: 'Apelido / Surname', value: b(v.apelido) },
          { label: 'Nome(s) / First names', value: b(v.nomes) },
          { label: 'Nacionalidade / Nationality', value: b(v.nacionalidade) },
          { label: 'Data de nascimento / Date of birth', value: d(v.nascimento) },
          { label: 'Documento / ID type', value: b(v.docTipo) },
          { label: 'N.º / Number', value: b(v.docNumero) },
          { label: 'Telefone / Phone', value: b(v.telefone) },
          { label: 'E-mail', value: b(v.email) },
          { label: 'Morada / Home address', value: b(semPonto(v.morada)) },
          ...(v.viatura ? [{ label: 'Matrícula / Car plate', value: BLANK }] : []),
        ],
      },
    ];
    if (n > 0) {
      blocks.push({
        type: 'table',
        caption: 'Acompanhantes / Companions',
        grid: true,
        columns: [
          { label: 'Nome / Name', width: 3 },
          { label: 'Nacionalidade / Nationality', width: 1.6 },
          { label: 'Documento n.º / ID no.', width: 1.6 },
          { label: 'Nascimento / Birth', width: 1.2 },
        ],
        rows: Array.from({ length: n }, () => [' ', ' ', ' ', ' ']),
      });
    }
    blocks.push(
      {
        type: 'checklist',
        columns: 2,
        items: [
          { label: 'Numerário / Cash', checked: false },
          { label: 'Cartão / Card', checked: false },
          { label: 'M-Pesa / e-Mola', checked: false },
          { label: 'Transferência / Bank transfer', checked: false },
          { label: 'Empresa ou agência / Company or agency', checked: false },
          ...(v.marketing ? [{ label: 'Aceito receber novidades e promoções / I agree to receive news and offers', checked: false }] : []),
        ],
      },
      {
        type: 'paragraph',
        id: 'declaracao',
        text: 'Declaro que os dados acima são verdadeiros e que tomei conhecimento do regulamento interno e das condições de alojamento, incluindo as horas de saída e as regras sobre objectos de valor. Os meus dados são usados para o registo da estadia e para as comunicações exigidas por lei.',
        en: 'I declare the above is true and that I have read the house rules and the accommodation terms, including check-out time and the rules on valuables. My data are used to register the stay and for legally required reports.',
        size: 'small',
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: `${ctx.place}, ___/___/______`, columns: [{ role: 'O Hóspede / Guest' }] },
      { type: 'box', label: 'Reservado à recepção / Office use', text: 'Documento verificado por: ____________________   Boletim de estrangeiro n.º: __________   Depósito/caução: __________', lines: 1 },
    );
    return blocks;
  },
});
