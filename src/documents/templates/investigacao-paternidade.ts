import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, dateLong, isF, l, lawyerFields, localField, money } from './_shared';
import { artigos, courtFields, moneyExt, partyDesc, partyFields } from './_advocacia';
import { closing, g3, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';

const impug = (v: Values) => v.tipo === 'impugnacao';
const semEmpresa = (p: string, s: string, light = false) => partyFields(p, s, { defaultTipo: 'pessoa', light }).filter((f) => !/(Tipo|Nuel|Representante)$/.test(f.name));

export default defineTemplate({
  id: 'investigacao-paternidade',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e tipo de acção', 'Court and type of action') },
    { id: 'autor', title: l('Autor', 'Claimant'), personRole: 'cliente' },
    { id: 'reu', title: l('Réu', 'Defendant'), personRole: 'outro' },
    { id: 'filho', title: l('Filho e registo', 'Child and birth registration') },
    { id: 'factos', title: l('Factos', 'Facts') },
    { id: 'pedido', title: l('Pedidos', 'Claims') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...courtFields('tribunal'),
    {
      name: 'tipo',
      type: 'radio',
      section: 'tribunal',
      label: l('Acção', 'Action'),
      default: 'investigacao',
      options: [
        { value: 'investigacao', label: l('Investigação de paternidade (reconhecer o pai)', 'Paternity claim (establish the father)') },
        { value: 'impugnacao', label: l('Impugnação de paternidade (afastar a paternidade registada)', 'Challenge registered paternity') },
      ],
    },
    ...semEmpresa('autor', 'autor'),
    { name: 'autorMenor', type: 'toggle', section: 'autor', label: l('O autor é menor (representado)', 'The claimant is a minor (represented)'), showIf: (v) => !impug(v) },
    { name: 'representanteNome', type: 'text', section: 'autor', label: l('Representado por (mãe ou tutor)', 'Represented by (mother or guardian)'), showIf: (v) => !impug(v) && Boolean(v.autorMenor) },
    { name: 'representanteQualidade', type: 'text', section: 'autor', width: 'half', label: l('Qualidade', 'Capacity'), default: 'mãe', showIf: (v) => !impug(v) && Boolean(v.autorMenor) },
    ...semEmpresa('reu', 'reu', true),
    { name: 'filhoNome', type: 'text', section: 'filho', label: l('Nome do filho', 'Child’s name'), help: l('Na investigação, normalmente é o próprio autor.', 'In a paternity claim, usually the claimant.'), showIf: impug },
    { name: 'filhoGenero', type: 'radio', section: 'filho', width: 'half', label: l('Filho / filha', 'Son / daughter'), options: GENERO_OPTIONS, default: 'M', showIf: impug },
    { name: 'dataNascimento', type: 'date', section: 'filho', width: 'half', label: l('Data de nascimento', 'Date of birth') },
    { name: 'registo', type: 'text', section: 'filho', label: l('Registo de nascimento', 'Birth registration'), placeholder: l('Ex.: assento n.º 1234 da 1.ª Conservatória do Registo Civil de Maputo', 'E.g. entry no. 1234 of the 1st Civil Registry of Maputo') },
    { name: 'paiRegistado', type: 'text', section: 'filho', width: 'half', label: l('Pai registado (se não for o autor)', 'Registered father (if not the claimant)'), showIf: impug },
    { name: 'maeNome', type: 'text', section: 'filho', width: 'half', label: l('Nome da mãe', 'Mother’s name') },
    {
      name: 'factos',
      type: 'textarea',
      section: 'factos',
      rows: 8,
      required: true,
      label: l('Factos (um artigo por linha)', 'Facts (one article per line)'),
      help: l(
        'Investigação: relação entre a mãe e o réu no período da concepção, convivência, tratamento como filho (posse de estado), recusa de perfilhar. Impugnação: porque o registado não é o pai biológico.',
        'Paternity claim: relationship during the conception period, treatment as a child, refusal to acknowledge. Challenge: why the registered father is not the biological father.',
      ),
    },
    { name: 'exameAdn', type: 'toggle', section: 'pedido', default: true, label: l('Requerer exame de ADN', 'Request a DNA test') },
    { name: 'alimentos', type: 'money', section: 'pedido', width: 'half', label: l('Pedir também alimentos por mês (opcional)', 'Also claim maintenance per month (optional)'), showIf: (v) => !impug(v) },
    { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', label: l('Valor da causa', 'Value of the case'), help: l('Acção sobre o estado das pessoas: valor fixado na lei para estas acções. Confirme.', 'Personal status action: value set by law. Confirm.') },
    ...provaFields('prova', { docsPlaceholder: 'Certidão de nascimento\nFotografias e mensagens\nDeclaração de testemunhas' }),
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      { level: 'info', message: l(`${cite('pcFiliacao')}: confirme a legitimidade e o prazo de propositura da acção. O exame de ADN é o meio de prova decisivo; o tribunal pode ordená-lo.`, 'Confirm standing and the filing period. DNA evidence is decisive.') },
    ];
    if (impug(v)) w.push({ level: 'info', field: 'reu', message: l('Na impugnação, a acção é proposta contra as pessoas que a lei indica (em regra, a mãe, o filho e o pai registado que não seja autor). Indique o principal réu e acrescente os restantes nos factos.', 'The challenge is brought against the persons set by law (usually mother, child and registered father).') });
    return [...w, ...lawyerWarnings(v)];
  },

  personName: (v) => v.reuNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const imp = impug(v);
    const A = g3(v, 'autor');
    const R = g3(v, 'reu');
    const OAutor = `${A.O} ${A.w('Autor', 'Autora')}`;
    const oReu = `${R.o} ${R.w('Réu', 'Ré')}`;
    const mae = str(v.maeNome) ? `**${str(v.maeNome).toLocaleUpperCase('pt')}**` : 'a mãe';
    const filhoF = imp ? isF(v.filhoGenero) : A.f;
    const filho = imp ? `**${(str(v.filhoNome) || '____________').toLocaleUpperCase('pt')}**` : `${OAutor}`;
    const paiReg = str(v.paiRegistado) ? `**${str(v.paiRegistado).toLocaleUpperCase('pt')}**` : OAutor;
    const nasc = `${v.dataNascimento ? `, ${filhoF ? 'nascida' : 'nascido'} em ${dateLong(v.dataNascimento)}` : ''}${str(v.registo) ? `, ${filhoF ? 'registada' : 'registado'} sob o ${sem(v.registo).replace(/^o\s+/i, '')}` : ''}`;

    const factos = imp
      ? [`${filho}${nasc}, ${filhoF ? 'filha' : 'filho'} de ${mae}, figura no registo de nascimento como ${filhoF ? 'filha' : 'filho'} de ${paiReg}.`, ...artigos(v.factos)]
      : [`${OAutor}${nasc}, é ${A.w('filho', 'filha')} de ${mae}.`, `No registo de nascimento ${A.w('do Autor', 'da Autora')} não consta a paternidade.`, ...artigos(v.factos)];
    const direito = imp
      ? ['A paternidade estabelecida pode ser impugnada quando se demonstre que, de acordo com as circunstâncias, é manifestamente improvável que o registado seja o pai biológico, nos termos e prazos da Lei da Família.']
      : [`Os factos alegados demonstram que ${oReu} é ${R.w('o pai biológico', 'a mãe biológica')} ${A.do} ${A.w('Autor', 'Autora')}, sendo admissível o reconhecimento judicial da filiação nos termos da Lei da Família.`];
    const alim = !imp ? money(v.alimentos) : null;
    const pedidos = imp
      ? [`Ser declarado que ${paiReg} não é o pai biológico de ${filho}`, 'Ser ordenado o cancelamento da menção da paternidade no respectivo assento de nascimento', `Ser ${oReu} ${R.w('condenado', 'condenada')} nas custas, se contestar`]
      : [
          `Ser reconhecido e declarado que ${A.o} ${A.w('Autor', 'Autora')} é ${A.w('filho', 'filha')} ${R.do} ${R.w('Réu', 'Ré')}`,
          `Ser ordenado o averbamento da paternidade no assento de nascimento ${A.do} ${A.w('Autor', 'Autora')}, com as legais consequências quanto ao nome`,
          ...(alim != null ? [`Ser ${oReu} ${R.w('condenado', 'condenada')} a prestar ${A.ao} ${A.w('Autor', 'Autora')} alimentos no montante mensal de ${moneyExt(alim)}`] : []),
          `Ser ${oReu} ${R.w('condenado', 'condenada')} nas custas e procuradoria condigna`,
        ];
    const depois = [
      ...(v.exameAdn ? [{ id: 'adn', text: `Requer, desde já, a realização de exame de ADN ${imp ? `${A.ao} ${A.w('Autor', 'Autora')} e a ${filho}` : `${A.ao} ${A.w('Autor', 'Autora')} e ${R.ao} ${R.w('Réu', 'Ré')}`}, em instituição oficial a designar pelo tribunal.`, en: 'The claimant asks for a DNA test.' }] : []),
      { id: 'citacao', text: `Requer a citação ${R.do} ${R.w('Réu', 'Ré')} para, querendo, contestar no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.`, en: 'Service on the defendant.' },
    ];

    const head = petitionHead(v, {
      accao: imp ? 'a presente\n**ACÇÃO DE IMPUGNAÇÃO DE PATERNIDADE**,' : 'a presente\n**ACÇÃO DE INVESTIGAÇÃO DE PATERNIDADE**,',
      accaoEn: imp ? 'this action challenging paternity,' : 'this paternity action,',
    });
    if (!imp && v.autorMenor) {
      head[1] = {
        type: 'paragraph',
        id: 'autor',
        text: `${partyDesc(v, 'autor')}, menor, neste acto ${A.w('representado', 'representada')} por sua ${sem(v.representanteQualidade) || 'mãe'}, **${(str(v.representanteNome) || '____________').toLocaleUpperCase('pt')}**, adiante ${A.w('designado', 'designada')} por **${A.w('Autor', 'Autora')}**,`,
        en: 'Identification of the minor claimant and the representative.',
      };
    }
    const pv = prova(v);
    const blocks: Block[] = [
      ...head,
      { type: 'articulado', sections: [{ heading: 'I — Dos factos', items: factos }, { heading: 'II — Do direito', items: direito }] },
      ...closing(ctx, {
        intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência:',
        introEn: 'On these grounds, the action should be upheld and:',
        pedidos,
        depois,
        valor: money(v.valorCausa),
        docs: pv.docs,
        procuracao: pv.procuracao,
        testemunhas: pv.testemunhas,
      }),
    ];
    return blocks;
  },
});
