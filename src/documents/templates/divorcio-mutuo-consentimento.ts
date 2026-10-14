import { defineTemplate, type Block, type FieldOption, type SignatureColumn, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, formatMoney, isF, l, lawyerFields, lawyerSignature, lineItems, localField, money, placeDate } from './_shared';
import { courtAddressee, courtFields, moneyExt, partyDesc, partyFields } from './_advocacia';
import { fechoField, g3, sem, str } from './_processo-civil';

const REGIME_OPTIONS: FieldOption[] = [
  { value: 'comunhão de adquiridos', label: l('Comunhão de adquiridos', 'Community of acquired property') },
  { value: 'comunhão geral de bens', label: l('Comunhão geral', 'Full community') },
  { value: 'separação de bens', label: l('Separação de bens', 'Separation of property') },
];

const conservatoria = (v: Values) => v.destino !== 'tribunal';
const isSep = (v: Values) => v.modalidade === 'separacao';
const conjFields = (p: string, section: string) => partyFields(p, section, { defaultTipo: 'pessoa' }).filter((f) => !/(Tipo|Nuel|Representante|EstadoCivil)$/.test(f.name));

export default defineTemplate({
  id: 'divorcio-mutuo-consentimento',
  family: 'peca',
  official: (v) => (conservatoria(v) ? 'registo' : 'tribunal'),
  letterhead: false,
  sections: [
    { id: 'destino', title: l('Onde se apresenta', 'Where it is filed') },
    { id: 'conjuge1', title: l('Primeiro cônjuge', 'First spouse'), personRole: 'cliente' },
    { id: 'conjuge2', title: l('Segundo cônjuge', 'Second spouse'), personRole: 'outro' },
    { id: 'casamento', title: l('Casamento e filhos', 'Marriage and children') },
    { id: 'acordos', title: l('Acordos', 'Agreements') },
    { id: 'bens', title: l('Relação de bens comuns', 'List of common property') },
    { id: 'advogado', title: l('Advogado (opcional)', 'Lawyer (optional)') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    {
      name: 'destino',
      type: 'radio',
      section: 'destino',
      label: l('Apresentar', 'File with'),
      default: 'conservatoria',
      options: [
        { value: 'conservatoria', label: l('Na Conservatória do Registo Civil', 'The Civil Registry') },
        { value: 'tribunal', label: l('No tribunal', 'The court') },
      ],
      help: l('A Lei da Família atribui o divórcio não litigioso à Conservatória; confirme a entidade competente no seu caso.', 'The Family Law sends non-contested divorce to the Civil Registry; confirm the competent body.'),
    },
    { name: 'conservatoriaNome', type: 'text', section: 'destino', label: l('Conservatória', 'Registry'), default: '1.ª Conservatória do Registo Civil de Maputo', showIf: conservatoria },
    { name: 'conservadorGenero', type: 'radio', section: 'destino', width: 'half', label: l('Conservador(a)', 'Registrar'), options: GENERO_OPTIONS, default: 'M', showIf: conservatoria },
    ...courtFields('destino').map((f) => ({ ...f, showIf: (v: Values) => !conservatoria(v) })),
    {
      name: 'modalidade',
      type: 'radio',
      section: 'destino',
      label: l('Pedem', 'They ask for'),
      default: 'divorcio',
      options: [
        { value: 'divorcio', label: l('Divórcio por mútuo consentimento', 'Divorce by consent') },
        { value: 'separacao', label: l('Separação de pessoas e bens por mútuo consentimento', 'Separation by consent') },
      ],
    },
    ...conjFields('conjuge1', 'conjuge1'),
    ...conjFields('conjuge2', 'conjuge2'),
    { name: 'dataCasamento', type: 'date', section: 'casamento', width: 'half', required: true, label: l('Data do casamento', 'Date of marriage') },
    { name: 'localCasamento', type: 'text', section: 'casamento', width: 'half', label: l('Conservatória ou local', 'Registry or place') },
    { name: 'assento', type: 'text', section: 'casamento', width: 'half', label: l('Assento n.º (opcional)', 'Registration no. (optional)') },
    { name: 'regime', type: 'select', section: 'casamento', width: 'half', label: l('Regime de bens', 'Property regime'), options: REGIME_OPTIONS, default: 'comunhão de adquiridos' },
    {
      name: 'filhos',
      type: 'lines',
      section: 'casamento',
      label: l('Filhos menores', 'Minor children'),
      addLabel: l('Adicionar filho', 'Add child'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'nascimento', type: 'date', label: l('Data de nascimento', 'Date of birth') },
      ],
      default: [],
    },
    { name: 'residenciaFilhos', type: 'text', section: 'acordos', label: l('Os filhos ficam a residir com', 'Children will live with'), placeholder: l('Ex.: a mãe, Teresa Lurdes Cossa', 'E.g. the mother'), showIf: (v) => lineItems(v.filhos).length > 0, help: l('Junte o acordo completo (documento «Acordo de regulação do exercício do poder parental»).', 'Attach the full agreement (parental responsibility agreement document).') },
    { name: 'alimentosFilhos', type: 'money', section: 'acordos', width: 'half', label: l('Alimentos aos filhos por mês', 'Child maintenance per month'), showIf: (v) => lineItems(v.filhos).length > 0 },
    {
      name: 'alimentosConjuges',
      type: 'radio',
      section: 'acordos',
      label: l('Alimentos entre os cônjuges', 'Maintenance between spouses'),
      default: 'dispensa',
      options: [
        { value: 'dispensa', label: l('Ambos prescindem', 'Both waive it') },
        { value: 'fixa', label: l('Um paga ao outro', 'One pays the other') },
      ],
    },
    { name: 'alimentosConjugeValor', type: 'money', section: 'acordos', width: 'half', label: l('Valor mensal', 'Monthly amount'), showIf: (v) => v.alimentosConjuges === 'fixa' },
    { name: 'alimentosConjugeQuem', type: 'radio', section: 'acordos', width: 'half', label: l('Paga', 'Payer'), options: [{ value: 'conjuge1', label: l('Primeiro cônjuge', 'First spouse') }, { value: 'conjuge2', label: l('Segundo cônjuge', 'Second spouse') }], default: 'conjuge1', showIf: (v) => v.alimentosConjuges === 'fixa' },
    { name: 'casaMorada', type: 'text', section: 'acordos', label: l('Destino da casa de morada de família', 'Family home'), placeholder: l('Ex.: fica atribuída à requerente, até à partilha', 'E.g. goes to the wife until the division'), help: l('Completa «A casa de morada de família …».', 'Completes “The family home …”.') },
    {
      name: 'bensComuns',
      type: 'lines',
      section: 'bens',
      label: l('Bens comuns', 'Common property'),
      addLabel: l('Adicionar bem', 'Add item'),
      columns: [
        { name: 'descricao', type: 'text', label: l('Descrição', 'Description') },
        { name: 'valor', type: 'money', label: l('Valor', 'Value') },
      ],
      default: [],
      help: l('Deixe vazio se não houver bens comuns (por exemplo, no regime de separação).', 'Leave empty if there is no common property.'),
    },
    { name: 'temAdvogado', type: 'toggle', section: 'advogado', label: l('Os requerentes têm advogado', 'The applicants have a lawyer') },
    ...lawyerFields('advogado').map((f) => ({ ...f, showIf: (v: Values) => Boolean(v.temAdvogado) })),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', field: 'destino', message: l(`${cite('pcDivorcioNaoLitigioso')}: confirme o tempo mínimo de casamento e a entidade competente. Junte certidão de casamento, certidões de nascimento dos filhos, o acordo sobre os filhos e a relação de bens.`, 'Confirm the minimum length of marriage and the competent body; attach certificates, the children agreement and the list of property.') },
    ];
    if (lineItems(v.filhos).length > 0 && !str(v.residenciaFilhos)) w.push({ level: 'warning', field: 'residenciaFilhos', message: l('Com filhos menores, o pedido tem de ser acompanhado do acordo sobre o exercício do poder parental e os alimentos.', 'With minor children, the agreement on parental responsibility and maintenance is required.') });
    return w;
  },

  personName: (v) => v.conjuge1Nome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const sep = isSep(v);
    const c1 = g3(v, 'conjuge1');
    const c2 = g3(v, 'conjuge2');
    const filhos = lineItems(v.filhos).filter((f) => str(f.nome));
    const bens = lineItems(v.bensComuns).filter((b) => str(b.descricao));
    const nome = (p: string) => `**${(str(v[`${p}Nome`]) || '____________').toLocaleUpperCase('pt')}**`;

    const addressee = conservatoria(v)
      ? `${isF(v.conservadorGenero) ? 'Exma. Senhora Conservadora' : 'Exmo. Senhor Conservador'} da ${sem(v.conservatoriaNome).replace(/^(a|da)\s+/i, '') || 'Conservatória do Registo Civil de ____________'}`.toLocaleUpperCase('pt')
      : courtAddressee(v);

    const items = [
      `Os requerentes contraíram casamento entre si em ${dateLong(v.dataCasamento)}${str(v.localCasamento) ? `, na ${sem(v.localCasamento).replace(/^(n?a)\s+/i, '')}` : ''}${str(v.assento) ? `, conforme assento n.º ${sem(v.assento)}` : ''}, sob o regime de ${str(v.regime) || 'comunhão de adquiridos'}, como consta da certidão junta.`,
      filhos.length
        ? `Do casamento ${filhos.length === 1 ? 'nasceu um filho, ainda menor' : 'nasceram os seguintes filhos, ainda menores'}: ${filhos.map((f) => `${f.nome}${f.nascimento ? `, com data de nascimento de ${dateLong(f.nascimento)}` : ''}`).join('; ')}.`
        : 'Do casamento não existem filhos menores.',
      `Os requerentes acordaram livremente ${sep ? 'na separação de pessoas e bens' : 'em divorciar-se'}, não pretendendo revelar a causa.`,
    ];
    if (filhos.length) {
      items.push(
        `Quanto ${filhos.length === 1 ? 'ao filho menor' : 'aos filhos menores'}, os requerentes acordaram na regulação do exercício do poder parental nos termos do acordo junto, ficando ${filhos.length === 1 ? 'o menor' : 'os menores'} a residir com ${sem(v.residenciaFilhos) || '____________________'}${money(v.alimentosFilhos) != null ? `, e sendo fixados alimentos no montante mensal de ${moneyExt(v.alimentosFilhos)}` : ''}.`,
      );
    }
    if (v.alimentosConjuges === 'fixa') {
      const quem = v.alimentosConjugeQuem === 'conjuge2' ? 'conjuge2' : 'conjuge1';
      const outro = quem === 'conjuge1' ? 'conjuge2' : 'conjuge1';
      items.push(`${nome(quem)} pagará a ${nome(outro)}, a título de alimentos, a quantia mensal de ${moneyExt(v.alimentosConjugeValor)}.`);
    } else {
      items.push('Os requerentes prescindem reciprocamente de alimentos, por deles não carecerem.');
    }
    items.push(`A casa de morada de família ${sem(v.casaMorada) || '____________________'}.`);
    items.push(bens.length ? 'Os bens comuns do casal constam da relação que segue, sendo a partilha feita nos termos legais.' : 'Não existem bens comuns a partilhar.');

    const total = bens.reduce((s, b) => s + (money(b.valor) ?? 0), 0);
    const cols: SignatureColumn[] = [
      { role: c1.w('O Requerente', 'A Requerente'), name: str(v.conjuge1Nome) || undefined },
      { role: c2.w('O Requerente', 'A Requerente'), name: str(v.conjuge2Nome) || undefined },
    ];
    const blocks: Block[] = [
      { type: 'courtHeader', addressee },
      { type: 'paragraph', id: 'conjuge1', text: `${partyDesc(v, 'conjuge1')},`, en: 'First spouse.' },
      { type: 'paragraph', id: 'e', text: 'e', en: 'and' },
      { type: 'paragraph', id: 'conjuge2', text: `${partyDesc(v, 'conjuge2')},`, en: 'Second spouse.' },
      {
        type: 'paragraph',
        id: 'vem',
        text: `casados entre si, vêm${v.temAdvogado ? ', por intermédio do seu mandatário judicial,' : ''} requerer a V. Ex.ª o seu`,
        en: 'married to each other, apply for their',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: sep ? '**SEPARAÇÃO DE PESSOAS E BENS POR MÚTUO CONSENTIMENTO**,' : '**DIVÓRCIO POR MÚTUO CONSENTIMENTO**,', en: sep ? 'SEPARATION BY CONSENT' : 'DIVORCE BY CONSENT' },
      { type: 'paragraph', id: 'fundamentos', text: 'nos termos e com os fundamentos seguintes:', en: 'on the following terms:' },
      { type: 'articulado', sections: [{ items }] },
    ];
    if (bens.length) {
      blocks.push({
        type: 'table',
        caption: 'Relação dos bens comuns',
        columns: [
          { label: 'Verba', width: 12, align: 'center' },
          { label: 'Descrição', width: 63 },
          { label: 'Valor', width: 25, align: 'right' },
        ],
        rows: bens.map((b, i) => [`${i + 1}.ª`, String(b.descricao), formatMoney(money(b.valor))]),
        totals: [['', 'Total', formatMoney(total)]],
      });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'pedido',
        text: `Termos em que requerem a V. Ex.ª se digne designar data para a conferência dos cônjuges e, a final, ${sep ? 'decretar a separação de pessoas e bens' : 'decretar o divórcio'}, homologando os acordos apresentados.`,
        en: 'They ask for a date for the spouses’ meeting and, finally, for the divorce or separation and approval of the agreements.',
      },
      { type: 'paragraph', id: 'junta', text: `**Junta:** certidão de casamento${filhos.length ? ', certidões de nascimento dos filhos, acordo de regulação do exercício do poder parental' : ''}${v.temAdvogado ? ', procuração forense' : ''} e duplicados legais.`, en: 'Attached documents.', keepWithNext: true },
      { type: 'paragraph', id: 'fecho', align: 'center', text: `**${str(v.fecho) === 'Pede deferimento.' ? 'Pedem deferimento.' : str(v.fecho) || 'Pedem deferimento.'}**`, en: 'They request approval.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: v.temAdvogado ? [...cols, lawyerSignature(v)] : cols },
    );
    return blocks;
  },
});
