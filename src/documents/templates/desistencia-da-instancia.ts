import { defineTemplate, type Block, type FieldOption, type SignatureColumn, type Values, type Warning } from '../model';
import { cite, dateField, l, lawyerFields, lawyerSignature, localField } from './_shared';
import { artigos, courtAddressee, nomeParte, parteF } from './_advocacia';
import { QUALIDADE_PC, QUALIDADE_PC_OPTIONS, closing, fechoField, lawyerWarnings, parteNome, processoFields, str } from './_processo-civil';

const TIPO_OPTIONS: FieldOption[] = [
  { value: 'instancia', label: l('Desistência da instância (pode voltar a propor a acção)', 'Withdraw the proceedings (may sue again)') },
  { value: 'pedido', label: l('Desistência do pedido (extingue o direito)', 'Withdraw the claim (right extinguished)') },
  { value: 'confissao', label: l('Confissão do pedido (pelo réu)', 'Admission of the claim (by the defendant)') },
];

const tipoOf = (v: Values) => (['instancia', 'pedido', 'confissao'].includes(v.tipo as string) ? (v.tipo as string) : 'instancia');

export default defineTemplate({
  id: 'desistencia-da-instancia',
  family: 'peca',
  official: 'tribunal',
  letterhead: false,
  sections: [
    { id: 'tribunal', title: l('Tribunal e processo', 'Court and case') },
    { id: 'partes', title: l('Partes', 'Parties') },
    { id: 'acto', title: l('Desistência ou confissão', 'Withdrawal or admission') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...processoFields('tribunal'),
    ...parteNome('parte', 'partes', 'Parte (o seu cliente)', 'Party (your client)', 'empresa'),
    { name: 'qualidade', type: 'select', section: 'partes', width: 'half', label: l('Posição no processo', 'Role in the case'), options: QUALIDADE_PC_OPTIONS, default: 'autor' },
    ...parteNome('contraria', 'partes', 'Parte contrária', 'Other party', 'empresa', false),
    { name: 'tipo', type: 'select', section: 'acto', required: true, label: l('Acto', 'Act'), options: TIPO_OPTIONS, default: 'instancia' },
    { name: 'motivo', type: 'textarea', section: 'acto', rows: 3, label: l('Motivo (opcional, um artigo por linha)', 'Reason (optional, one article per line)'), placeholder: l('Ex.: A Ré pagou integralmente a quantia peticionada em 3 de Outubro de 2026.', 'E.g. the defendant paid in full') },
    { name: 'aceitacao', type: 'toggle', section: 'acto', label: l('Com aceitação da parte contrária (assina o seu advogado)', 'With the other party’s acceptance (its lawyer signs)'), showIf: (v) => tipoOf(v) === 'instancia', help: l('Depois da contestação, a desistência da instância depende da aceitação do réu.', 'After the defence, withdrawal of the proceedings needs the defendant’s consent.') },
    { name: 'outroAdvogadoNome', type: 'text', section: 'acto', width: 'half', label: l('Advogado da parte contrária', 'Other party’s lawyer'), showIf: (v) => tipoOf(v) === 'instancia' && Boolean(v.aceitacao) },
    { name: 'outroAdvogadoCarteira', type: 'text', section: 'acto', width: 'half', label: l('Carteira profissional n.º', 'Bar card no.'), showIf: (v) => tipoOf(v) === 'instancia' && Boolean(v.aceitacao) },
    {
      name: 'custas',
      type: 'select',
      section: 'acto',
      width: 'half',
      label: l('Custas', 'Costs'),
      default: 'lei',
      options: [
        { value: 'lei', label: l('Nos termos legais', 'As the law provides') },
        { value: 'requerente', label: l('A cargo de quem desiste ou confessa', 'Paid by the withdrawing party') },
        { value: 'contraria', label: l('A cargo da parte contrária (acordado)', 'Paid by the other party (agreed)') },
        { value: 'iguais', label: l('Em partes iguais (acordado)', 'Shared equally (agreed)') },
      ],
    },
    { name: 'assinaParte', type: 'toggle', section: 'acto', default: true, label: l('Assinado também pela própria parte', 'Also signed by the party') },
    ...lawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    fechoField('documento'),
  ],

  warnings: (v) => [
    { level: 'warning', field: 'tipo', message: l(`${cite('pcDesistencia')}. O advogado só pode desistir ou confessar com poderes especiais na procuração (${cite('advPoderesEspeciais')}); por segurança, a parte assina também.`, 'The lawyer needs special powers to withdraw or admit; the party should sign too.') },
    ...(tipoOf(v) === 'pedido' ? [{ level: 'warning' as const, field: 'tipo', message: l('A desistência do pedido extingue o direito: não poderá voltar a pedir o mesmo em tribunal.', 'Withdrawing the claim extinguishes the right.') }] : []),
    ...lawyerWarnings(v),
  ] satisfies Warning[],

  personName: (v) => v.parteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const t = tipoOf(v);
    const q = QUALIDADE_PC[v.qualidade as string] ?? QUALIDADE_PC.autor;
    const f = parteF(v, 'parte');
    const papel = f ? q.f : q.m;
    const contraF = parteF(v, 'contraria');
    const contraPapel = contraF ? q.cf : q.cm;
    const contra = str(v.contrariaNome) ? `, em que é ${contraPapel} ${nomeParte(v, 'contraria')}` : '';
    const tipo = str(v.tipoAccao) || '____________________';
    const conj = t === 'instancia' && Boolean(v.aceitacao);
    const titulo: Record<string, string> = { instancia: 'DESISTE DA INSTÂNCIA', pedido: 'DESISTE DO PEDIDO', confissao: 'CONFESSA O PEDIDO' };
    const custasTxt: Record<string, string> = {
      lei: 'com custas nos termos legais',
      requerente: `com custas a cargo ${f ? 'da' : 'do'} ${papel}`,
      contraria: `com custas a cargo ${contraF ? 'da' : 'do'} ${contraPapel}, conforme acordado`,
      iguais: 'com custas em partes iguais, conforme acordado',
    };
    const efeito: Record<string, string> = {
      instancia: 'julgando extinta a instância',
      pedido: `julgando extinto o direito que ${f ? 'a' : 'o'} ${papel} pretendia fazer valer e ${contraF ? 'absolvida a' : 'absolvido o'} ${contraPapel} do pedido`,
      confissao: `${f ? 'condenando-se a' : 'condenando-se o'} ${papel} nos precisos termos do pedido`,
    };
    const motivo = artigos(v.motivo);
    const cols: SignatureColumn[] = [lawyerSignature(v)];
    if (v.assinaParte) cols.unshift({ role: f ? `A ${papel}` : `O ${papel}`, name: str(v.parteNome) || undefined });
    if (conj) cols.push({ role: `O Advogado ${contraF ? 'da' : 'do'} ${contraPapel}`, name: str(v.outroAdvogadoNome) || undefined, detail: `Carteira Profissional n.º ${str(v.outroAdvogadoCarteira) || '________'} — OAM` });

    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: str(v.seccao) || undefined, addressee: courtAddressee(v) },
      {
        type: 'paragraph',
        id: 'identificacao',
        text: `${nomeParte(v, 'parte')}, ${papel} nos autos de ${tipo}${contra}, e neles melhor ${f ? 'identificada' : 'identificado'}, vem, por intermédio do seu mandatário judicial, com poderes especiais para o acto, declarar que`,
        en: 'The party, through its lawyer with special powers, declares that it',
      },
      { type: 'paragraph', id: 'titulo', align: 'center', text: `**${titulo[t]}**${t === 'confissao' ? ' formulado nos autos' : ''}${conj ? `, com a aceitação ${contraF ? 'da' : 'do'} ${contraPapel}, que também subscreve` : ''}.`, en: t === 'confissao' ? 'ADMITS THE CLAIM' : 'WITHDRAWS' },
    ];
    if (motivo.length) blocks.push({ type: 'articulado', sections: [{ items: motivo }] });
    blocks.push(
      ...closing(ctx, {
        intro: `Termos em que ${conj ? 'requerem' : 'requer'} a V. Ex.ª se digne homologar ${t === 'confissao' ? 'a presente confissão' : 'a presente desistência'} por sentença, ${efeito[t]}, ${custasTxt[v.custas as string] ?? custasTxt.lei}.`,
        introEn: 'The party asks the court to approve the act by judgment.',
        cols,
      }),
    );
    return blocks;
  },
});
