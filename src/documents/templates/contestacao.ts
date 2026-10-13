import { addDays, diffDays, formatDateLong } from '@/lib/format';
import { defineTemplate, type Block, type FieldDef, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, l, lawyerFields, lawyerSignature, localField, money, placeDate, splitLines } from './_shared';
import { PARTE_TIPO_OPTIONS, artigos, courtAddressee, courtFields, documentosList, juntaText, linePara, moneyExt, nomeParte, papel, testemunhasList } from './_advocacia';

// ---------------------------------------------------------------- Local helpers

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function nameFields(p: string, section: string, label: string, en: string): FieldDef[] {
  return [
    { name: `${p}Nome`, type: 'text', section, required: true, label: l(label, en), personKey: 'nome' },
    { name: `${p}Tipo`, type: 'radio', section, width: 'half', label: l('É', 'Is'), options: PARTE_TIPO_OPTIONS, default: 'empresa' },
    { name: `${p}Genero`, type: 'radio', section, width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', showIf: (v: Values) => v[`${p}Tipo`] !== 'empresa' },
  ];
}

const EFEITO_OPTIONS = [
  { value: 'instancia', label: l('Absolvição da instância (excepção dilatória)', 'Dismissal of the proceedings (procedural objection)') },
  { value: 'pedido', label: l('Absolvição do pedido (excepção peremptória)', 'Dismissal of the claim (substantive objection)') },
];

export default defineTemplate({
  id: 'contestacao',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'excepcao', title: l('Defesa por excepção (opcional)', 'Objections (optional)') },
    { id: 'impugnacao', title: l('Defesa por impugnação', 'Denial of the facts') },
    { id: 'reconvencao', title: l('Reconvenção (opcional)', 'Counterclaim (optional)') },
    { id: 'prova', title: l('Documentos e testemunhas', 'Documents and witnesses') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    { name: 'processoNumero', type: 'text', section: 'tribunal', width: 'half', required: true, label: l('Processo n.º', 'Case no.'), placeholder: l('Ex.: 245/2026', 'E.g. 245/2026') },
    ...courtFields('tribunal'),
    {
      name: 'tipoAccao',
      type: 'text',
      section: 'tribunal',
      label: l('Tipo de acção', 'Type of action'),
      default: 'acção declarativa de condenação',
    },
    {
      name: 'formaProcesso',
      type: 'radio',
      section: 'tribunal',
      width: 'half',
      label: l('Forma de processo', 'Form of process'),
      default: 'ordinario',
      options: [
        { value: 'ordinario', label: l('Ordinário', 'Ordinary') },
        { value: 'sumario', label: l('Sumário', 'Summary') },
      ],
    },
    { name: 'dataCitacao', type: 'date', section: 'tribunal', width: 'half', required: true, label: l('Data da citação', 'Date of service') },
    ...nameFields('reu', 'partes', 'Réu (o seu cliente)', 'Defendant (your client)'),
    ...nameFields('autor', 'partes', 'Autor (quem propôs a acção)', 'Claimant'),
    {
      name: 'excepcoes',
      type: 'textarea',
      section: 'excepcao',
      rows: 5,
      label: l('Excepções (um artigo por linha)', 'Objections (one article per line)'),
      help: l(
        'Ex.: incompetência do tribunal, ilegitimidade, caso julgado, prescrição, pagamento. Deixe vazio se não houver.',
        'E.g. lack of jurisdiction, standing, res judicata, limitation, payment. Leave empty if none.',
      ),
    },
    { name: 'excepcaoEfeito', type: 'select', section: 'excepcao', label: l('Efeito pedido', 'Effect requested'), options: EFEITO_OPTIONS, default: 'pedido' },
    {
      name: 'impugnados',
      type: 'text',
      section: 'impugnacao',
      width: 'half',
      label: l('Artigos da petição impugnados', 'Articles of the claim denied'),
      placeholder: l('Ex.: 3.º a 9.º e 12.º', 'E.g. 3 to 9 and 12'),
    },
    {
      name: 'aceites',
      type: 'text',
      section: 'impugnacao',
      width: 'half',
      label: l('Artigos aceites (opcional)', 'Articles admitted (optional)'),
      placeholder: l('Ex.: 1.º e 2.º', 'E.g. 1 and 2'),
    },
    {
      name: 'versao',
      type: 'textarea',
      section: 'impugnacao',
      rows: 8,
      required: true,
      label: l('Versão dos factos do réu (um artigo por linha)', 'Defendant’s version of the facts (one article per line)'),
      help: l('Tome posição sobre cada facto da petição: o que não for impugnado pode ser dado como admitido.', 'Take a position on every fact: what is not denied may be taken as admitted.'),
    },
    { name: 'direito', type: 'textarea', section: 'impugnacao', rows: 3, label: l('Fundamentos de direito (opcional)', 'Legal grounds (optional)') },
    { name: 'reconvencao', type: 'toggle', section: 'reconvencao', label: l('Deduzir pedido reconvencional', 'File a counterclaim'), help: l('Pedido do réu contra o autor no mesmo processo.', 'A claim by the defendant against the claimant in the same case.') },
    { name: 'reconvencaoFactos', type: 'textarea', section: 'reconvencao', rows: 4, label: l('Factos da reconvenção (um artigo por linha)', 'Counterclaim facts (one article per line)'), showIf: (v) => Boolean(v.reconvencao) },
    {
      name: 'reconvencaoPedido',
      type: 'text',
      section: 'reconvencao',
      label: l('Pedido reconvencional', 'Counterclaim'),
      placeholder: l('Ex.: a pagar à Ré a quantia de 300.000,00 MT, por defeitos da obra', 'E.g. to pay the defendant 300,000.00 MT for defects'),
      help: l('Completa «ser o Autor condenado …».', 'Completes “the claimant be ordered …”.'),
      showIf: (v) => Boolean(v.reconvencao),
    },
    { name: 'reconvencaoValor', type: 'money', section: 'reconvencao', width: 'half', label: l('Valor da reconvenção', 'Value of the counterclaim'), showIf: (v) => Boolean(v.reconvencao) },
    { name: 'documentos', type: 'textarea', section: 'prova', rows: 3, label: l('Documentos juntos (um por linha)', 'Documents attached (one per line)') },
    { name: 'juntaProcuracao', type: 'toggle', section: 'prova', default: true, label: l('Junta procuração forense', 'Power of attorney attached') },
    { name: 'testemunhas', type: 'textarea', section: 'prova', rows: 3, label: l('Rol de testemunhas (opcional)', 'Witnesses (optional)'), help: l('Uma por linha: nome, profissão e morada.', 'One per line: name, occupation and address.') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
  ],

  computed: (v, ctx) => {
    const dias = ctx.legal.value<{ ordinario: number }>('advPrazoContestacao').ordinario;
    const fim = v.dataCitacao ? addDays(v.dataCitacao, dias) : '';
    return { dias, fim };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [];
    if (v.formaProcesso !== 'sumario') {
      w.push({
        level: 'info',
        field: 'dataCitacao',
        message: l(
          `Prazo para contestar em processo ordinário: ${c.dias} dias a contar da citação (${cite('advPrazoContestacao')})${c.fim ? `; estimativa: ${formatDateLong(c.fim)}` : ''}. Acresce a dilação, se houver; confirme as regras de contagem e as férias judiciais.`,
          `Time limit in ordinary process: ${c.dias} days from service${c.fim ? `; estimate: ${c.fim}` : ''}. Add any extension; confirm the counting rules and court holidays.`,
        ),
      });
      if (c.fim && v.data && diffDays(c.fim, v.data) > 0) {
        w.push({ level: 'warning', field: 'data', message: l('A data da contestação é posterior ao fim estimado do prazo. Confirme o prazo e eventual dilação.', 'The defence date is after the estimated deadline. Check the time limit.') });
      }
    } else {
      w.push({ level: 'warning', field: 'formaProcesso', message: l('O prazo de contestação em processo sumário não está confirmado na aplicação. Verifique-o no Código de Processo Civil.', 'The defence time limit in summary process is not confirmed in the app. Check it in the Civil Procedure Code.') });
    }
    w.push({
      level: 'info',
      field: 'excepcoes',
      message: l('A incompetência relativa do tribunal tem de ser arguida dentro do prazo da contestação.', 'Relative lack of jurisdiction must be raised within the defence time limit.'),
    });
    if (!v.impugnados && splitLines(v.versao).length === 0) {
      w.push({ level: 'warning', field: 'versao', message: l('Impugne os factos da petição: o facto não impugnado pode ser dado como admitido.', 'Deny the facts of the claim: facts not denied may be taken as admitted.') });
    }
    if (v.reconvencao && money(v.reconvencaoValor) == null) {
      w.push({ level: 'warning', field: 'reconvencaoValor', message: l('Indique o valor da reconvenção.', 'State the value of the counterclaim.') });
    }
    if (!v.advogadoCarteira) w.push({ level: 'warning', field: 'advogadoCarteira', message: l('Indique o número da carteira profissional do advogado.', 'Enter the lawyer’s bar card number.') });
    return w;
  },

  personName: (v) => v.autorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const reu = papel(v, 'reu', 'Réu', 'Ré');
    const oAutor = papel(v, 'autor', 'o Autor', 'a Autora');
    const OAutor = papel(v, 'autor', 'O Autor', 'A Autora');
    const absolvido = papel(v, 'reu', 'absolvido', 'absolvida');
    const citado = papel(v, 'reu', 'citado', 'citada');
    const identificado = papel(v, 'reu', 'identificado', 'identificada');
    const reuDef = papel(v, 'reu', 'o Réu', 'a Ré');
    const forma = v.formaProcesso === 'sumario' ? 'sumário' : 'ordinário';
    const tipoAccao = String(v.tipoAccao ?? '').trim() || 'acção declarativa de condenação';

    const excepcoes = artigos(v.excepcoes);
    const nosArtigos = (a: string) => (/\s(a|e)\s|,/.test(a) ? `nos artigos ${a}` : `no artigo ${a}`);
    const impug: string[] = [];
    if (String(v.impugnados ?? '').trim()) {
      impug.push(`${reuDef.charAt(0).toUpperCase()}${reuDef.slice(1)} impugna, por não corresponderem à verdade, os factos alegados ${nosArtigos(String(v.impugnados).trim())} da petição inicial.`);
    }
    if (String(v.aceites ?? '').trim()) impug.push(`Aceita-se apenas o alegado ${nosArtigos(String(v.aceites).trim())} da petição inicial.`);
    impug.push(...artigos(v.versao));
    const direito = artigos(v.direito);
    const recon = v.reconvencao ? artigos(v.reconvencaoFactos) : [];

    const sections: { heading?: string; items: string[] }[] = [];
    const add = (t: string, items: string[]) => {
      if (!items.length) return;
      sections.push({ heading: `${ROMANOS[sections.length]} — ${t}`, items });
    };
    add('Por excepção', excepcoes);
    add('Por impugnação', impug.length ? impug : ['____________________']);
    add('Do direito', direito);
    if (v.reconvencao) add('Da reconvenção', recon.length ? recon : ['____________________']);

    const pedidos: string[] = [];
    if (excepcoes.length) {
      pedidos.push(
        `Ser julgada procedente, por provada, a matéria de excepção, ${v.excepcaoEfeito === 'instancia' ? `${absolvido} ${reuDef} da instância` : `${absolvido} ${reuDef} do pedido`};`,
        `Caso assim se não entenda, ser a acção julgada improcedente, por não provada, ${absolvido} ${reuDef} do pedido;`,
      );
    } else {
      pedidos.push(`Ser a acção julgada improcedente, por não provada, e ${reuDef} ${absolvido} do pedido;`);
    }
    if (v.reconvencao) {
      pedidos.push(
        `Ser o pedido reconvencional julgado procedente, por provado, e ${oAutor} ${papel(v, 'autor', 'condenado', 'condenada')} ${String(v.reconvencaoPedido ?? '').trim().replace(/[.;]$/, '') || '____________________'};`,
      );
    }
    pedidos.push(`Ser ${oAutor} ${papel(v, 'autor', 'condenado', 'condenada')} nas custas e procuradoria condigna.`);

    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);

    const blocks: Block[] = [
      { type: 'courtHeader', processo: String(v.processoNumero ?? '').trim() || '________/______', extra: String(v.seccao ?? '').trim() || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${nomeParte(v, 'reu')}, ${reu} nos autos de ${tipoAccao}, com processo ${forma}, que lhe move ${nomeParte(v, 'autor')}, e neles melhor ${identificado}, tendo sido ${citado}, vem, por intermédio do seu mandatário judicial, apresentar a sua`,
        en: 'The defendant in the case brought by the claimant, having been served, files its',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: `**CONTESTAÇÃO${v.reconvencao ? ' COM RECONVENÇÃO' : ''}**,`, en: v.reconvencao ? 'DEFENCE AND COUNTERCLAIM' : 'DEFENCE' },
      { type: 'paragraph', id: 'fundamentos', text: 'o que faz nos termos e com os fundamentos seguintes:', en: 'on the following terms and grounds:' },
      { type: 'articulado', sections },
      {
        type: 'paragraph',
        id: 'nestesTermos',
        text: `Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve:`,
        en: 'On these grounds, the court should:',
        keepWithNext: true,
      },
      { type: 'list', style: 'alpha', items: pedidos },
      {
        type: 'paragraph',
        id: 'seguimento',
        text: `${OAutor} deve ser ${papel(v, 'autor', 'notificado', 'notificada')} da presente contestação${v.reconvencao ? ' para, querendo, responder à reconvenção' : ''}, seguindo-se os ulteriores termos até final.`,
        en: 'The claimant should be notified of this defence, with the further steps until judgment.',
      },
    ];
    if (v.reconvencao) blocks.push(linePara('valorReconvencao', 'Valor da reconvenção', `${moneyExt(v.reconvencaoValor)}.`, 'Value of the counterclaim.'));
    blocks.push(
      linePara('junta', 'Junta', `${juntaText({ procuracao: Boolean(v.juntaProcuracao), documentos: docs.length })}.`, 'Attached: documents and copies.', testemunhas.length === 0),
    );
    if (testemunhas.length) {
      blocks.push(
        { type: 'paragraph', id: 'rol', text: '**Rol de testemunhas:**', en: 'Witnesses:', keepWithNext: true },
        { type: 'list', style: 'numeric', items: testemunhas, keepWithNext: true },
      );
    }
    blocks.push({ type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [lawyerSignature(v)] });
    if (docs.length) blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return blocks;
  },
});
