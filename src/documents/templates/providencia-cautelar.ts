import { defineTemplate, type Block, type DocumentTemplate, type FieldOption, type Values, type Warning } from '../model';
import { cite, dateField, dateLong, formatMoney, l, lawyerFields, localField, money, splitLines } from './_shared';
import { artigos, courtFields, moneyExt, partyFields } from './_advocacia';
import { closing, g3, minuscula, lawyerWarnings, petitionHead, prova, provaFields, sem, str } from './_processo-civil';
import type { LegalRefId } from '@/legal/mz-legal';

export type Tipo = 'comum' | 'arresto' | 'obra' | 'posse' | 'arrolamento' | 'alimentos' | 'deliberacoes';

const TIPOS: Record<Tipo, { label: string; en: string; titulo: string; ref: LegalRefId; s1: string; s2: string; s3?: string }> = {
  comum: { label: 'Não especificada (procedimento comum)', en: 'Unspecified (general)', titulo: 'PROVIDÊNCIA CAUTELAR NÃO ESPECIFICADA', ref: 'pcProvidencias', s1: 'Do direito ameaçado', s2: 'Do fundado receio de lesão grave e dificilmente reparável', s3: 'Da providência adequada' },
  arresto: { label: 'Arresto', en: 'Pre-judgment attachment', titulo: 'PROVIDÊNCIA CAUTELAR DE ARRESTO', ref: 'pcArresto', s1: 'Do crédito', s2: 'Do justo receio de perda da garantia patrimonial', s3: 'Dos bens a arrestar' },
  obra: { label: 'Embargo de obra nova', en: 'Injunction against new works', titulo: 'EMBARGO DE OBRA NOVA', ref: 'pcEmbargoObraNova', s1: 'Do direito do Requerente', s2: 'Da obra nova e do prejuízo' },
  posse: { label: 'Restituição provisória de posse', en: 'Provisional restoration of possession', titulo: 'RESTITUIÇÃO PROVISÓRIA DE POSSE', ref: 'pcRestituicaoPosse', s1: 'Da posse', s2: 'Do esbulho violento' },
  arrolamento: { label: 'Arrolamento', en: 'Inventory seizure', titulo: 'PROVIDÊNCIA CAUTELAR DE ARROLAMENTO', ref: 'pcArrolamento', s1: 'Do direito aos bens', s2: 'Do justo receio de extravio, ocultação ou dissipação', s3: 'Dos bens a arrolar' },
  alimentos: { label: 'Alimentos provisórios', en: 'Interim maintenance', titulo: 'ALIMENTOS PROVISÓRIOS', ref: 'pcAlimentosProvisorios', s1: 'Do direito a alimentos', s2: 'Das necessidades do Requerente e das possibilidades do Requerido' },
  deliberacoes: { label: 'Suspensão de deliberações sociais', en: 'Suspension of company resolutions', titulo: 'SUSPENSÃO DE DELIBERAÇÕES SOCIAIS', ref: 'pcSuspensaoDeliberacoes', s1: 'Da qualidade de sócio e da deliberação', s2: 'Da invalidade da deliberação e do dano apreciável' },
};

const TIPO_OPTIONS: FieldOption[] = (Object.keys(TIPOS) as Tipo[]).map((k) => ({ value: k, label: l(TIPOS[k].label, TIPOS[k].en) }));
const tipoOf = (v: Values): Tipo => ((v.tipo as Tipo) in TIPOS ? (v.tipo as Tipo) : 'comum');
const is = (...t: Tipo[]) => (v: Values) => t.includes(tipoOf(v));
/** Measures ordered without hearing the respondent by law. */
const semAudienciaLegal = (t: Tipo) => t === 'arresto' || t === 'posse';

/** Builds the template; the variants (arresto, embargo de obra nova…) only change the id and the default type. */
export function providencia(id: string, defaultTipo: Tipo): DocumentTemplate {
  return defineTemplate({
    id,
    family: 'peca',
    official: 'tribunal',
    letterhead: false,
    sections: [
      { id: 'tribunal', title: l('Tribunal e tipo de providência', 'Court and type of measure') },
      { id: 'requerente', title: l('Requerente', 'Applicant'), personRole: 'cliente' },
      { id: 'requerido', title: l('Requerido', 'Respondent'), personRole: 'outro' },
      { id: 'factos', title: l('Factos', 'Facts') },
      { id: 'pedido', title: l('Providência pedida e valor', 'Measure requested and value') },
      { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
      { id: 'advogado', title: l('Advogado', 'Lawyer') },
      { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
    ],
    fields: [
      ...courtFields('tribunal'),
      { name: 'tipo', type: 'select', section: 'tribunal', required: true, label: l('Providência', 'Measure'), options: TIPO_OPTIONS, default: defaultTipo },
      {
        name: 'dependencia',
        type: 'radio',
        section: 'tribunal',
        label: l('A acção principal', 'The main action'),
        default: 'propor',
        options: [
          { value: 'propor', label: l('Vai ser proposta (providência preliminar)', 'Will be filed (preliminary measure)') },
          { value: 'pendente', label: l('Já está pendente (por apenso)', 'Is pending (joined)') },
        ],
      },
      { name: 'accaoPrincipal', type: 'text', section: 'tribunal', label: l('Acção principal', 'Main action'), placeholder: l('Ex.: acção declarativa de condenação para pagamento do preço', 'E.g. action for payment of the price'), help: l('Completa «… como preliminar da …» ou «… dependente da …».', 'Completes “as a preliminary to …”.') },
      { name: 'processoNumero', type: 'text', section: 'tribunal', width: 'half', label: l('Processo n.º', 'Case no.'), showIf: (v) => v.dependencia === 'pendente' },
      ...partyFields('requerente', 'requerente', { defaultTipo: 'pessoa' }),
      ...partyFields('requerido', 'requerido', { defaultTipo: 'pessoa', light: true }),
      {
        name: 'factosDireito',
        type: 'textarea',
        section: 'factos',
        rows: 6,
        required: true,
        label: l('Factos que provam o direito (um artigo por linha)', 'Facts proving the right (one article per line)'),
        help: l(
          'Arresto: origem e montante do crédito. Obra nova: propriedade ou posse do prédio. Posse: actos de posse (desde quando, como). Arrolamento: direito aos bens (ex.: bens comuns do casal). Alimentos: parentesco ou casamento. Deliberações: qualidade de sócio e a deliberação.',
          'Facts proving the right, according to the measure.',
        ),
      },
      {
        name: 'factosPerigo',
        type: 'textarea',
        section: 'factos',
        rows: 6,
        required: true,
        label: l('Factos do perigo ou da ofensa (um artigo por linha)', 'Facts of the danger or harm (one article per line)'),
        help: l(
          'Comum: porque a demora causa lesão grave e dificilmente reparável. Arresto: porque teme perder a garantia (venda de bens, fuga, dívidas). Obra: a obra e o prejuízo. Posse: como foi esbulhado e a violência usada. Alimentos: necessidades e meios de cada um. Deliberações: invalidade e dano.',
          'Facts of the danger or harm, according to the measure.',
        ),
      },
      { name: 'obraLocal', type: 'text', section: 'factos', label: l('Obra (descrição e local)', 'Works (description and place)'), placeholder: l('Ex.: muro de vedação em alvenaria, no limite norte do talhão n.º 25, Bairro Triunfo', 'E.g. a boundary wall'), showIf: is('obra') },
      { name: 'dataConhecimento', type: 'date', section: 'factos', width: 'half', label: l('Teve conhecimento em', 'Learned of it on'), showIf: is('obra', 'posse', 'deliberacoes') },
      { name: 'embargoExtrajudicial', type: 'toggle', section: 'factos', width: 'half', label: l('Já fez o embargo extrajudicial (ratificação)', 'Already made an out-of-court embargo (ratification)'), showIf: is('obra') },
      { name: 'dataEmbargoExtra', type: 'date', section: 'factos', width: 'half', label: l('Data do embargo extrajudicial', 'Date of the out-of-court embargo'), showIf: (v) => tipoOf(v) === 'obra' && Boolean(v.embargoExtrajudicial) },
      { name: 'coisaPosse', type: 'text', section: 'factos', label: l('Coisa esbulhada', 'Property taken'), placeholder: l('Ex.: a machamba de 2 hectares sita em Marracuene, Bairro Agostinho Neto', 'E.g. the farm plot'), showIf: is('posse') },
      { name: 'sociedade', type: 'text', section: 'factos', label: l('Sociedade e deliberação', 'Company and resolution'), placeholder: l('Ex.: deliberação da assembleia geral da sociedade X, Lda, de 2 de Outubro de 2026, que aprovou o aumento de capital', 'E.g. resolution of the general meeting'), showIf: is('deliberacoes') },
      { name: 'bens', type: 'textarea', section: 'pedido', rows: 4, label: l('Bens (um por linha)', 'Assets (one per line)'), placeholder: l('Saldo da conta n.º … do Banco …\nViatura matrícula …\nImóvel descrito na Conservatória sob o n.º …', 'Bank balance\nVehicle\nProperty'), showIf: is('arresto', 'arrolamento') },
      { name: 'montanteCredito', type: 'money', section: 'pedido', width: 'half', label: l('Montante do crédito', 'Amount of the debt'), showIf: is('arresto') },
      { name: 'depositario', type: 'text', section: 'pedido', width: 'half', label: l('Fiel depositário proposto (opcional)', 'Proposed custodian (optional)'), showIf: is('arresto', 'arrolamento') },
      { name: 'alimentosMensal', type: 'money', section: 'pedido', width: 'half', label: l('Alimentos provisórios por mês', 'Interim maintenance per month'), showIf: is('alimentos') },
      { name: 'alimentosDia', type: 'number', section: 'pedido', width: 'half', min: 1, max: 31, label: l('Pagar até ao dia', 'Pay by day'), default: 10, showIf: is('alimentos') },
      {
        name: 'providenciaPedida',
        type: 'textarea',
        section: 'pedido',
        rows: 2,
        label: l('Providência concreta que pede', 'Specific measure requested'),
        placeholder: l('Ex.: a intimação da Requerida para se abster de vender ou onerar as fracções do Edifício X até decisão da acção principal', 'E.g. order the respondent not to sell the units'),
        showIf: is('comum'),
      },
      { name: 'dispensaAudiencia', type: 'toggle', section: 'pedido', label: l('Pedir que seja decretada sem ouvir o requerido', 'Ask for the measure without hearing the respondent'), help: l('Só quando a audiência põe em risco o fim ou a eficácia da providência. O arresto e a restituição de posse são sempre sem audiência.', 'Only when hearing the respondent would defeat the measure.'), showIf: (v) => !semAudienciaLegal(tipoOf(v)) },
      { name: 'valorCausa', type: 'money', section: 'pedido', width: 'half', label: l('Valor da causa', 'Value of the case'), legal: l('O requerimento declara o valor da causa.', 'The application states the value.') },
      ...provaFields('prova'),
      ...lawyerFields('advogado'),
      localField('documento'),
      dateField('data', 'documento'),
    ],

    warnings: (v) => {
      const t = tipoOf(v);
      const w: Warning[] = [
        {
          level: 'info',
          field: 'tipo',
          message: l(`${TIPOS[t].label}: ${cite(TIPOS[t].ref)}. Basta a prova sumária dos factos; ofereça já os documentos e as testemunhas.`, 'Summary proof is enough; offer documents and witnesses now.'),
        },
      ];
      if (v.dependencia !== 'pendente') {
        w.push({ level: 'warning', field: 'dependencia', message: l(`A providência caduca se a acção principal não for proposta no prazo legal a contar da notificação da decisão que a decrete (${cite('pcProvidencias')}). Confirme o prazo.`, 'The measure lapses if the main action is not filed within the legal period. Confirm it.') });
      }
      if (t === 'comum') w.push({ level: 'info', field: 'tipo', message: l('A providência não especificada só cabe quando nenhuma das providências especificadas (arresto, embargo, restituição de posse…) se adequa ao caso.', 'The general measure applies only when no specific measure fits.') });
      if (t === 'obra') w.push({ level: 'warning', field: 'dataConhecimento', message: l('O embargo de obra nova tem de ser requerido no prazo legal a contar do conhecimento da obra; o embargo extrajudicial tem de ser ratificado judicialmente em prazo curto. Confirme os prazos.', 'The injunction must be sought within the legal period from learning of the works; an out-of-court embargo must be ratified quickly.') });
      if (money(v.valorCausa) == null) w.push({ level: 'warning', field: 'valorCausa', message: l('Indique o valor da causa.', 'Enter the value of the case.') });
      return [...w, ...lawyerWarnings(v)];
    },

    personName: (v) => v.requeridoNome,
    documentDate: (v) => v.data,

    blocks: (ctx) => {
      const v = ctx.values;
      const t = tipoOf(v);
      const T = TIPOS[t];
      const R = g3(v, 'requerente');
      const D = g3(v, 'requerido');
      const oReq = `${D.o} ${D.w('Requerido', 'Requerida')}`;
      const doReq = `${D.do} ${D.w('Requerido', 'Requerida')}`;
      const aoRequerente = `${R.ao} Requerente`;
      const bens = splitLines(v.bens).map((s) => minuscula(s.replace(/[.;]+$/, '')));
      const pendente = v.dependencia === 'pendente';
      const accaoP = sem(v.accaoPrincipal) || 'acção principal';
      const dep = pendente ? `dependente da ${accaoP}${str(v.processoNumero) ? `, processo n.º ${sem(v.processoNumero)}` : ''},` : `como preliminar da ${accaoP} que vai propor contra ${oReq},`;

      const s1 = artigos(v.factosDireito);
      const s2 = artigos(v.factosPerigo);
      let s3: string[] = [];
      if (t === 'comum') s3 = [`A providência requerida é adequada a assegurar a efectividade do direito ameaçado, e o prejuízo que dela resulta para ${oReq} não excede consideravelmente o dano que com ela se pretende evitar.`];
      if (t === 'arresto' || t === 'arrolamento') s3 = bens.length ? [`${D.w('O Requerido', 'A Requerida')} é titular ou detém os seguintes bens: ${bens.join('; ')}.`] : ['____________________'];
      if (t === 'obra') {
        s2.unshift(`${D.w('O Requerido', 'A Requerida')} iniciou ${str(v.obraLocal) ? `a seguinte obra: ${sem(v.obraLocal)}` : 'uma obra nova'}, que ofende o direito ${R.do} Requerente e lhe causa prejuízo.`);
        if (v.dataConhecimento) s2.push(`${R.O} Requerente teve conhecimento da obra em ${dateLong(v.dataConhecimento)}.`);
        if (v.embargoExtrajudicial) s2.push(`Em ${dateLong(v.dataEmbargoExtra)}, ${R.o} Requerente embargou extrajudicialmente a obra, notificando verbalmente o dono da obra, ou o encarregado, perante duas testemunhas, para a não continuar.`);
      }
      if (t === 'posse') {
        if (str(v.coisaPosse)) s1.unshift(`${R.O} Requerente é ${R.w('possuidor', 'possuidora')} de ${sem(v.coisaPosse)}.`);
        if (v.dataConhecimento) s2.push(`O esbulho ocorreu em ${dateLong(v.dataConhecimento)}.`);
      }
      if (t === 'deliberacoes' && str(v.sociedade)) s1.push(`Está em causa a ${sem(v.sociedade).replace(/^a\s+/i, '')}.`);
      if (t === 'deliberacoes' && v.dataConhecimento) s1.push(`${R.O} Requerente teve conhecimento da deliberação em ${dateLong(v.dataConhecimento)}.`);

      const sections = [
        { heading: `I — ${T.s1}`, items: s1.length ? s1 : ['____________________'] },
        { heading: `II — ${T.s2.replace('Requerido', D.w('Requerido', 'Requerida'))}`, items: s2.length ? s2 : ['____________________'] },
      ];
      if (T.s3 && s3.length) sections.push({ heading: `III — ${T.s3}`, items: s3 });

      const semAud = semAudienciaLegal(t) || Boolean(v.dispensaAudiencia);
      const audiencia = semAud ? `, sem audiência prévia ${doReq},` : '';
      const pedidos: string[] = [];
      switch (t) {
        case 'comum':
          pedidos.push(`Ser decretada${audiencia} a seguinte providência: ${sem(v.providenciaPedida) || '____________________'}`);
          break;
        case 'arresto':
          pedidos.push(`Ser decretado${audiencia} o arresto dos bens acima identificados, até ao montante de ${formatMoney(money(v.montanteCredito))}, suficiente para garantia do crédito ${R.do} Requerente${str(v.depositario) ? `, nomeando-se fiel depositário ${sem(v.depositario)}` : ''}`);
          break;
        case 'obra':
          pedidos.push(
            v.embargoExtrajudicial
              ? `Ser ratificado judicialmente o embargo extrajudicial da obra, efectuado em ${dateLong(v.dataEmbargoExtra)}`
              : `Ser decretado${audiencia} o embargo da obra acima identificada, ordenando-se a sua imediata suspensão`,
            `Ser ${oReq} ${D.w('notificado', 'notificada')} para não continuar a obra, sob a cominação legal`,
          );
          break;
        case 'posse':
          pedidos.push(`Ser ordenada, sem audiência ${D.w('do esbulhador', 'da esbulhadora')}, a restituição provisória ${aoRequerente} da posse ${str(v.coisaPosse) ? `de ${sem(v.coisaPosse)}` : 'da coisa esbulhada'}`);
          break;
        case 'arrolamento':
          pedidos.push(`Ser decretado${audiencia} o arrolamento dos bens acima identificados, com a sua descrição, avaliação e depósito${str(v.depositario) ? `, nomeando-se depositário ${sem(v.depositario)}` : ''}`);
          break;
        case 'alimentos':
          pedidos.push(`Ser ${oReq} ${D.w('condenado', 'condenada')} a pagar ${aoRequerente}, a título de alimentos provisórios, a quantia mensal de ${moneyExt(v.alimentosMensal)}, até ao dia ${v.alimentosDia || '____'} de cada mês, até ao pagamento da primeira prestação definitiva`);
          break;
        case 'deliberacoes':
          pedidos.push(`Ser suspensa${audiencia} a execução da deliberação acima identificada`);
          break;
      }
      if (!semAudienciaLegal(t)) pedidos.push(semAud ? `Após a execução da providência, ser ${oReq} ${D.w('notificado', 'notificada')} da decisão, nos termos legais` : `Ser ${oReq} ${D.w('citado', 'citada')} para, querendo, deduzir oposição`);
      else pedidos.push(`Após a execução da providência, ser ${oReq} ${D.w('notificado', 'notificada')} da decisão, nos termos legais`);

      const pv = prova(v);
      const blocks: Block[] = [
        ...petitionHead(v, {
          autor: 'requerente',
          reu: 'requerido',
          autorM: 'Requerente',
          autorF: 'Requerente',
          reuM: 'Requerido',
          reuF: 'Requerida',
          verbo: 'requerer contra',
          accao: `a presente\n**${T.titulo}**,\n${dep}`,
          accaoEn: `this application for ${T.en.toLowerCase()},`,
          processo: pendente && str(v.processoNumero) ? `${sem(v.processoNumero)} (por apenso)` : undefined,
        }),
        { type: 'articulado', sections },
        ...closing(ctx, {
          intro: 'Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, requer:',
          introEn: 'On these grounds, the applicant requests:',
          pedidos,
          valor: money(v.valorCausa),
          docs: pv.docs,
          procuracao: pv.procuracao,
          testemunhas: pv.testemunhas,
        }),
      ];
      return blocks;
    },
  });
}

export default providencia('providencia-cautelar', 'comum');
