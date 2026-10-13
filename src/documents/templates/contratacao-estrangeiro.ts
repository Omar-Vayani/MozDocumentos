// Requerimento / comunicação de contratação de trabalhador estrangeiro: the
// employer notifies a hire within its quota, or applies for a work
// authorisation outside it, to the Ministry of Labour. The quota and the
// authorisation content come from the Labour Law; procedures from the 2024
// regulation (values marked 'confirm').

import { diffDays } from '@/lib/format';
import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, employerName, employerRep, employerSignature, l, lineItems, localField, moneyText, refField, splitLines } from './_shared';
import { addressLine } from '../layouts/address';
import { doCite, enumerate, moneyExt, num, qty } from './_contrato-trabalho';
import { str } from './_pessoal-rh';

type Classe = 'micro' | 'pequeno' | 'medio' | 'grande';
type Modalidade = 'quota' | 'autorizacao' | 'projecto' | 'especial';

const CLASSE_TXT: Record<Classe, string> = { micro: 'micro empregador', pequeno: 'pequeno empregador', medio: 'médio empregador', grande: 'grande empregador' };

function classe(total: number | null, lim: { micro: number; pequeno: number; medio: number }): Classe | null {
  if (total == null) return null;
  if (total <= lim.micro) return 'micro';
  if (total <= lim.pequeno) return 'pequeno';
  if (total <= lim.medio) return 'medio';
  return 'grande';
}

const isQuota = (v: Values) => v.modalidade === 'quota' || v.modalidade === 'projecto';

export default defineTemplate({
  id: 'contratacao-estrangeiro',
  official: 'estado',
  sections: [
    { id: 'documento', title: l('Documento', 'Document') },
    { id: 'modalidade', title: l('Tipo de pedido', 'Type of request') },
    { id: 'empresa', title: l('Empresa', 'Company') },
    { id: 'estrangeiro', title: l('Trabalhador estrangeiro', 'Foreign employee') },
    { id: 'contrato', title: l('Contrato', 'Contract') },
  ],
  fields: [
    refField(),
    localField(),
    dateField('data'),
    {
      name: 'modalidade',
      type: 'radio',
      section: 'modalidade',
      label: l('Pedido', 'Request'),
      default: 'quota',
      options: [
        { value: 'quota', label: l('Comunicação dentro da quota', 'Notice within the quota') },
        { value: 'autorizacao', label: l('Autorização (fora da quota)', 'Authorisation (outside the quota)') },
        { value: 'projecto', label: l('Projecto de investimento aprovado pelo Governo', 'Government-approved investment project') },
        { value: 'especial', label: l('Sector especial (ONG, docência, medicina, aviação, assistência técnica)', 'Special sector (NGO, teaching, medicine, aviation, technical assistance)') },
      ],
    },
    {
      name: 'destinatario',
      type: 'text',
      section: 'modalidade',
      label: l('Destinatário', 'Addressee'),
      default: 'Ministro do Trabalho, Género e Acção Social',
      help: l('O Ministro que superintende a área do Trabalho, ou a Direcção Provincial com competência delegada. Confirme a designação actual.', 'The Minister responsible for Labour, or the provincial office with delegated powers. Check the current name.'),
    },
    { name: 'projectoReferencia', type: 'text', section: 'modalidade', label: l('Projecto aprovado (referência)', 'Approved project (reference)'), showIf: (v) => v.modalidade === 'projecto' },
    { name: 'ramoActividade', type: 'text', section: 'empresa', required: true, label: l('Ramo de actividade', 'Business sector'), placeholder: l('Ex.: construção civil e obras públicas', 'E.g. construction') },
    { name: 'totalTrabalhadores', type: 'number', section: 'empresa', width: 'half', min: 1, required: true, label: l('Total de trabalhadores', 'Total employees') },
    { name: 'estrangeirosActuais', type: 'number', section: 'empresa', width: 'half', min: 0, default: 0, label: l('Estrangeiros já ao serviço', 'Foreigners already employed') },
    { name: 'estrangeiroNome', type: 'text', section: 'estrangeiro', required: true, label: l('Nome completo', 'Full name') },
    { name: 'estrangeiroGenero', type: 'radio', section: 'estrangeiro', label: l('Tratamento', 'Form of address'), default: 'M', options: [{ value: 'M', label: l('Masculino', 'Male') }, { value: 'F', label: l('Feminino', 'Female') }] },
    { name: 'estrangeiroNacionalidade', type: 'text', section: 'estrangeiro', width: 'half', required: true, label: l('Nacionalidade', 'Nationality') },
    { name: 'estrangeiroPassaporte', type: 'text', section: 'estrangeiro', width: 'half', required: true, label: l('Passaporte n.º', 'Passport no.') },
    { name: 'estrangeiroValidade', type: 'date', section: 'estrangeiro', width: 'half', label: l('Válido até', 'Valid until') },
    { name: 'estrangeiroEntrada', type: 'date', section: 'estrangeiro', width: 'half', label: l('Data de entrada no país', 'Date of entry into the country') },
    { name: 'estrangeiroVisto', type: 'text', section: 'estrangeiro', width: 'half', label: l('Tipo de visto / DIRE', 'Visa type / DIRE'), placeholder: l('Ex.: visto de trabalho', 'E.g. work visa') },
    { name: 'habilitacoes', type: 'text', section: 'estrangeiro', required: true, label: l('Habilitações e qualificação profissional', 'Qualifications'), placeholder: l('Ex.: Licenciatura em Engenharia Civil; dez anos de experiência em pontes', 'E.g. Civil Engineering degree; ten years’ experience') },
    { name: 'funcao', type: 'text', section: 'contrato', required: true, label: l('Função', 'Position'), placeholder: l('Ex.: Engenheiro de estruturas', 'E.g. Structural engineer') },
    { name: 'tarefas', type: 'textarea', section: 'contrato', rows: 3, label: l('Tarefas a executar', 'Duties'), help: l('Uma por linha.', 'One per line.') },
    { name: 'remuneracao', type: 'money', section: 'contrato', width: 'half', required: true, label: l('Remuneração mensal', 'Monthly pay') },
    { name: 'duracaoMeses', type: 'number', section: 'contrato', width: 'half', min: 1, required: true, label: l('Duração do contrato (meses)', 'Contract length (months)') },
    { name: 'inicio', type: 'date', section: 'contrato', width: 'half', label: l('Início previsto', 'Expected start') },
    { name: 'localTrabalho', type: 'text', section: 'contrato', width: 'half', label: l('Local de trabalho', 'Workplace') },
    {
      name: 'anexos',
      type: 'lines',
      section: 'contrato',
      label: l('Documentos que junta', 'Enclosed documents'),
      addLabel: l('Adicionar documento', 'Add document'),
      columns: [{ name: 'descricao', type: 'text', label: l('Documento', 'Document') }],
      default: [
        { descricao: 'Contrato de trabalho assinado, em três vias' },
        { descricao: 'Cópia do passaporte do trabalhador' },
        { descricao: 'Certificado de habilitações e comprovativos de experiência profissional' },
        { descricao: 'Certidão de quitação do INSS e da Autoridade Tributária' },
      ],
    },
  ],

  computed: (v, ctx) => {
    const lim = ctx.legal.value<{ micro: number; pequeno: number; medio: number }>('classesEmpregador');
    const quotas = ctx.legal.value<Record<Classe, number>>('trabalhadorEstrangeiro');
    const total = num(v.totalTrabalhadores);
    const cl = classe(total, lim);
    const pct = cl ? quotas[cl] : null;
    const quota = total != null && pct != null ? Math.floor((total * pct) / 100) : null;
    const disponivel = quota != null ? quota - (num(v.estrangeirosActuais) ?? 0) : null;
    const prazo = ctx.legal.value<{ comunicacaoDias: number }>('contratacaoEstrangeirosRegulamento').comunicacaoDias;
    return { classe: cl, pct, quota, disponivel, prazo };
  },

  warnings: (v, ctx) => {
    const c = ctx.computed;
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `Só pode contratar um estrangeiro se não houver nacionais com as qualificações exigidas ou se forem insuficientes; o contrato é escrito (${cite('trabalhadorEstrangeiro')}). O Ministério pode exigir o seu próprio formulário ou a submissão electrónica: use este documento como requerimento ou carta de capa (${cite('contratacaoEstrangeirosRegulamento')}).`,
          'A foreigner may only be hired when no qualified nationals are available; the contract must be written. The Ministry may require its own form or online filing: use this as the request or cover letter.',
        ),
      },
    ];
    if (v.modalidade === 'quota' && c.disponivel != null && c.disponivel < 1) {
      w.push({
        level: 'error',
        field: 'modalidade',
        message: l(
          `Quota esgotada: como ${CLASSE_TXT[c.classe as Classe]}, a quota é de ${c.pct} por cento (${c.quota} ${c.quota === 1 ? 'trabalhador' : 'trabalhadores'}). Peça autorização fora da quota.`,
          `Quota used up (${c.pct}% = ${c.quota}). Apply for an authorisation outside the quota.`,
        ),
      });
    }
    if (isQuota(v) && v.estrangeiroEntrada) {
      const dias = diffDays(v.estrangeiroEntrada, v.data || ctx.today);
      if (Number.isFinite(dias) && dias > c.prazo) {
        w.push({ level: 'warning', field: 'estrangeiroEntrada', message: l(`A comunicação deve ser feita no prazo de ${c.prazo} dias a contar da entrada do trabalhador no país (confirme).`, `The notice is due within ${c.prazo} days of the worker’s entry (confirm).`) });
      }
    }
    if (/turis|visit|neg[oó]cio/i.test(String(v.estrangeiroVisto ?? ''))) {
      w.push({ level: 'error', field: 'estrangeiroVisto', message: l('Não pode ser contratado o estrangeiro que entrou no país para fins diferentes do trabalho (por exemplo, com visto de turismo).', 'A foreigner who entered for purposes other than work (e.g. a tourist visa) may not be hired.') });
    }
    if (v.estrangeiroValidade && v.inicio && num(v.duracaoMeses)) {
      if (diffDays(v.inicio, v.estrangeiroValidade) < Number(v.duracaoMeses) * 30) {
        w.push({ level: 'info', field: 'estrangeiroValidade', message: l('O passaporte caduca antes do fim do contrato.', 'The passport expires before the contract ends.') });
      }
    }
    return w;
  },

  personName: (v) => v.estrangeiroNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = ctx.computed;
    const m = (v.modalidade || 'quota') as Modalidade;
    const f = v.estrangeiroGenero === 'F';
    const empresa = employerName(ctx);
    const sede = ctx.profile ? addressLine(ctx.profile) : '';
    const rep = employerRep(ctx);
    const tarefas = splitLines(v.tarefas);
    const meses = num(v.duracaoMeses);
    const anexos = lineItems(v.anexos).map((r) => str(r.descricao)).filter(Boolean);
    const quem = [
      `**${empresa}**`,
      sede ? `com sede em ${sede}` : '',
      ctx.profile?.nuit ? `NUIT ${ctx.profile.nuit}` : '',
      `com a actividade de ${str(v.ramoActividade) || BLANK}`,
      c.classe ? `classificada como ${CLASSE_TXT[c.classe as Classe]}, com ${qty(num(v.totalTrabalhadores) ?? 0, 'trabalhador', 'trabalhadores')} ao seu serviço` : '',
      rep.nome ? `neste acto representada por ${rep.nome}${rep.cargo ? `, ${rep.cargo}` : ''}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const pedidos: Record<Modalidade, { text: string; en: string }> = {
      quota: {
        text: `vem, nos termos ${doCite('trabalhadorEstrangeiro')}, **comunicar** a V. Ex.ª a contratação, ao abrigo do regime de quotas, ${f ? 'da cidadã estrangeira' : 'do cidadão estrangeiro'} abaixo identificad${f ? 'a' : 'o'}, dispondo a empresa de quota disponível.`,
        en: 'The company notifies the hiring of the foreign national named below under the quota system, having quota available.',
      },
      projecto: {
        text: `vem, nos termos ${doCite('trabalhadorEstrangeiro')}, **comunicar** a V. Ex.ª a contratação ${f ? 'da cidadã estrangeira' : 'do cidadão estrangeiro'} abaixo identificad${f ? 'a' : 'o'}, no âmbito do projecto de investimento aprovado pelo Governo${str(v.projectoReferencia) ? ` (${str(v.projectoReferencia)})` : ''}, que prevê a contratação de trabalhadores estrangeiros.`,
        en: 'The company notifies the hiring of the foreign national under a Government-approved investment project.',
      },
      autorizacao: {
        text: `vem, nos termos ${doCite('trabalhadorEstrangeiro')}, **requerer** a V. Ex.ª autorização para contratar ${f ? 'a cidadã estrangeira' : 'o cidadão estrangeiro'} abaixo identificad${f ? 'a' : 'o'}.`,
        en: 'The company applies for authorisation to hire the foreign national named below.',
      },
      especial: {
        text: `vem, nos termos ${doCite('trabalhadorEstrangeiro')}, **requerer** a V. Ex.ª autorização, por despacho, para contratar ${f ? 'a cidadã estrangeira' : 'o cidadão estrangeiro'} abaixo identificad${f ? 'a' : 'o'}, em área de assistência técnica especializada.`,
        en: 'The company applies for a Ministerial order authorising the hire in a specialised field.',
      },
    };

    const blocks: Block[] = [
      { type: 'reference', ref: v.ref || undefined, place: ctx.place, date: dateLong(v.data) },
      { type: 'recipient', salutation: /^Ministr[oa]\b/i.test(str(v.destinatario)) ? 'Sua Excelência o' : 'Exmo. Senhor', lines: [str(v.destinatario) || BLANK, 'MAPUTO'] },
      { type: 'subject', text: m === 'quota' || m === 'projecto' ? 'Comunicação de contratação de trabalhador estrangeiro' : 'Pedido de autorização de trabalho para cidadão estrangeiro' },
      { type: 'paragraph', id: 'pedido', text: `${quem}, ${pedidos[m].text}`, en: pedidos[m].en },
      {
        type: 'keyValue',
        columns: 2,
        items: [
          { label: 'Nome', value: str(v.estrangeiroNome) || BLANK },
          { label: 'Nacionalidade', value: str(v.estrangeiroNacionalidade) || BLANK },
          { label: 'Passaporte n.º', value: `${str(v.estrangeiroPassaporte) || BLANK}${v.estrangeiroValidade ? `, válido até ${dateLong(v.estrangeiroValidade)}` : ''}` },
          { label: 'Entrada no país', value: v.estrangeiroEntrada ? dateLong(v.estrangeiroEntrada) : '—' },
          { label: 'Qualificação', value: str(v.habilitacoes) || BLANK },
          { label: 'Função', value: str(v.funcao) || BLANK },
          { label: 'Remuneração mensal', value: moneyText(v.remuneracao) },
          { label: 'Duração do contrato', value: meses ? qty(meses, 'mês', 'meses') : BLANK },
          { label: 'Local de trabalho', value: str(v.localTrabalho) || '—' },
          { label: 'Início previsto', value: v.inicio ? dateLong(v.inicio) : '—' },
        ],
      },
    ];
    if (tarefas.length) {
      blocks.push({ type: 'paragraph', id: 'tarefas', text: `${f ? 'A trabalhadora' : 'O trabalhador'} executará as seguintes tarefas:`, en: 'Duties:' }, { type: 'list', style: 'alpha', items: enumerate(tarefas) });
    }
    blocks.push(
      {
        type: 'paragraph',
        id: 'remuneracaoExtenso',
        text: `A remuneração mensal acordada é de ${moneyExt(v.remuneracao)}, sendo o contrato de trabalho celebrado por escrito.`,
        en: 'The agreed monthly pay is stated; the employment contract is in writing.',
      },
      {
        type: 'paragraph',
        id: 'justificacao',
        text: `A empresa declara que não dispõe de trabalhadores nacionais com as qualificações exigidas para esta função, ou que o seu número é insuficiente, e compromete-se a promover a formação e a integração de trabalhadores moçambicanos nos postos de maior complexidade técnica.`,
        en: 'The company declares that no qualified nationals are available (or not enough), and undertakes to train and integrate Mozambican staff in technical posts.',
      },
    );
    if (m === 'quota' && c.quota != null) {
      blocks.push({
        type: 'paragraph',
        id: 'quota',
        text: `Com a presente contratação, a empresa passa a ter ${qty((num(v.estrangeirosActuais) ?? 0) + 1, 'trabalhador estrangeiro', 'trabalhadores estrangeiros')} ao seu serviço, dentro da quota de ${c.pct} por cento aplicável.`,
        en: 'With this hire the company remains within its applicable quota.',
      });
    }
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: m === 'quota' || m === 'projecto' ? 'Com os melhores cumprimentos,' : 'Pede deferimento.', en: m === 'quota' || m === 'projecto' ? 'Yours faithfully,' : 'Requests approval.', keepWithNext: true },
      { type: 'signatures', columns: [employerSignature(ctx, 'A Entidade Empregadora')] },
    );
    if (anexos.length) blocks.push({ type: 'annexList', title: 'Anexos:', items: anexos });
    return blocks;
  },
});
