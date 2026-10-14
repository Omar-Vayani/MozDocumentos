import { profileDisplayName } from '@/lib/storage/types';
import { defineTemplate, type Block, type SignatureColumn, type Warning } from '../model';
import { dateField, dateLong, l, localField } from './_shared';
import { disp, str } from './_eventos';

// Certificate of recognition / merit, A4 landscape, double frame. Private
// awards only: State honours (orders, medals, decorations) are conferred by
// the State under their own law, so those words and the emblem are not used.

const TIPOS: Record<string, { t1: string; t2: string; artigo: string; motivo: (anos: number) => string }> = {
  reconhecimento: {
    t1: 'Certificado',
    t2: 'de Reconhecimento',
    artigo: 'o presente Certificado de Reconhecimento',
    motivo: () => 'pela dedicação, competência e espírito de equipa demonstrados',
  },
  merito: { t1: 'Certificado', t2: 'de Mérito', artigo: 'o presente Certificado de Mérito', motivo: () => 'pelo mérito e pela excelência do seu desempenho' },
  honra: { t1: 'Diploma', t2: 'de Honra', artigo: 'o presente Diploma de Honra', motivo: () => 'pelo seu contributo exemplar' },
  louvor: { t1: 'Louvor', t2: '', artigo: 'o presente Louvor', motivo: () => 'pelo zelo, pela competência e pelo sentido de responsabilidade com que tem exercido as suas funções' },
  ano: { t1: 'Trabalhador do Ano', t2: '', artigo: 'a distinção de Trabalhador do Ano', motivo: () => 'pelo excelente desempenho, assiduidade e espírito de equipa demonstrados ao longo do ano' },
  servico: {
    t1: 'Certificado',
    t2: 'de Anos de Serviço',
    artigo: 'o presente Certificado',
    motivo: (n) => `em reconhecimento de ${n > 0 ? `${n} ${n === 1 ? 'ano' : 'anos'}` : '____ anos'} de dedicação e serviço`,
  },
};

export default defineTemplate({
  id: 'certificado-de-reconhecimento',
  family: 'declaracao',
  page: 'A4-paisagem',
  verticalAlign: 'center',
  frame: 'double',
  noBrand: true,
  letterhead: false,
  style: { font: 'classico' },
  sections: [
    { id: 'distincao', title: l('Distinção', 'Award') },
    { id: 'homenageado', title: l('Homenageado', 'Recipient') },
    { id: 'assinaturas', title: l('Local, data e assinaturas', 'Place, date and signatures') },
  ],
  fields: [
    {
      name: 'tipo',
      type: 'select',
      section: 'distincao',
      label: l('Distinção', 'Award'),
      options: [
        { value: 'reconhecimento', label: l('Certificado de Reconhecimento', 'Certificate of Recognition') },
        { value: 'merito', label: l('Certificado de Mérito', 'Certificate of Merit') },
        { value: 'honra', label: l('Diploma de Honra', 'Honour Diploma') },
        { value: 'louvor', label: l('Louvor', 'Commendation') },
        { value: 'ano', label: l('Trabalhador do Ano', 'Employee of the Year') },
        { value: 'servico', label: l('Anos de serviço', 'Years of service') },
      ],
      default: 'reconhecimento',
    },
    { name: 'anoReferencia', type: 'text', section: 'distincao', width: 'half', label: l('Ano', 'Year'), placeholder: l('2026', '2026'), showIf: (v) => v.tipo === 'ano' },
    { name: 'anos', type: 'number', section: 'distincao', width: 'half', min: 1, max: 60, label: l('Anos de serviço', 'Years of service'), showIf: (v) => v.tipo === 'servico' },
    { name: 'entidade', type: 'text', section: 'distincao', label: l('Entidade que atribui', 'Awarded by'), default: (c) => profileDisplayName(c.profile) },
    { name: 'homenageadoNome', type: 'text', section: 'homenageado', required: true, label: l('Nome', 'Name') },
    { name: 'homenageadoCargo', type: 'text', section: 'homenageado', label: l('Cargo ou função (opcional)', 'Position (optional)') },
    {
      name: 'motivo',
      type: 'textarea',
      section: 'homenageado',
      rows: 2,
      label: l('Motivo', 'Reason'),
      help: l('Vazio: usa um texto adequado à distinção. Ex.: "pelo excelente desempenho no exercício de 2026".', 'Empty: uses a text suited to the award.'),
    },
    localField('assinaturas'),
    dateField('data', 'assinaturas'),
    { name: 'assinante1Nome', type: 'text', section: 'assinaturas', width: 'half', label: l('1.º signatário', 'First signatory'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'assinante1Cargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo ?? '' },
    { name: 'assinante2Nome', type: 'text', section: 'assinaturas', width: 'half', label: l('2.º signatário (opcional)', 'Second signatory (optional)') },
    { name: 'assinante2Cargo', type: 'text', section: 'assinaturas', width: 'half', label: l('Cargo', 'Position') },
    { name: 'numero', type: 'text', section: 'assinaturas', width: 'half', label: l('Número (opcional)', 'Number (optional)') },
    { name: 'tricolour', type: 'toggle', section: 'assinaturas', width: 'half', label: l('Detalhe nas cores nacionais', 'National colours detail'), default: false },
  ],
  blocks: (ctx) => {
    const v = ctx.values;
    const t = TIPOS[str(v.tipo)] ?? TIPOS.reconhecimento;
    const entidade = str(v.entidade) || '____________________';
    const nome = str(v.homenageadoNome) || '____________________';
    const motivo = (str(v.motivo) || t.motivo(Math.round(Number(v.anos) || 0))).replace(/[.]$/, '');
    const t1 = v.tipo === 'ano' && str(v.anoReferencia) ? `${t.t1} ${str(v.anoReferencia)}` : t.t1;
    const cols: SignatureColumn[] = [{ role: str(v.assinante1Cargo) || ' ', name: str(v.assinante1Nome) || undefined, image: 'both' }];
    if (str(v.assinante2Nome)) cols.push({ role: str(v.assinante2Cargo) || ' ', name: str(v.assinante2Nome) });
    const blocks: Block[] = [{ type: 'logo', size: 'md' }];
    if (t.t2) blocks.push(disp(`${t1} de`, 'md', { uppercase: true, tone: 'muted', after: 0 }), disp(t.t2.replace(/^de /, ''), 'xxl', { uppercase: true, tone: 'accent', fit: true, after: 2 }));
    else blocks.push(disp(t1, 'xxl', { uppercase: true, tone: 'accent', fit: true, after: 2 }));
    blocks.push(
      { type: 'ornament', style: v.tricolour ? 'tricolour' : 'double' },
      disp(`${entidade} confere a`, 'sm', { italic: true, tone: 'muted', fit: true, after: 4 }),
      disp(nome, 'xxl', { italic: true, fit: true, after: str(v.homenageadoCargo) ? 1 : 2 }),
    );
    if (str(v.homenageadoCargo)) blocks.push(disp(str(v.homenageadoCargo), 'sm', { tone: 'muted', after: 2 }));
    blocks.push(
      { type: 'ornament', style: 'rule', width: 'medium' },
      disp(`${t.artigo}, ${motivo}.`, 'md', { italic: true, after: 12 }),
      disp(`${ctx.place}, ${dateLong(v.data)}`, 'sm', { tone: 'muted', after: 6 }),
      { type: 'signatures', columns: cols },
    );
    if (str(v.numero)) blocks.push(disp(`N.º ${str(v.numero)}`, 'xs', { tone: 'muted', after: 0 }));
    return blocks;
  },
  warnings: (v) => {
    const out: Warning[] = [];
    if (v.tipo === 'servico' && !(Number(v.anos) > 0)) out.push({ level: 'warning', field: 'anos', message: l('Indique os anos de serviço.', 'Give the years of service.') });
    out.push({
      level: 'info',
      message: l(
        'Distinção privada: não use as palavras "Ordem", "Medalha" ou "Condecoração", reservadas às distinções do Estado. Para registar um louvor no processo individual, entregue uma cópia aos Recursos Humanos.',
        'Private award: do not use "Order", "Medal" or "Decoration", reserved for State honours. File a copy with HR to record a commendation.',
      ),
    });
    return out;
  },
  personName: (v) => str(v.homenageadoNome) || undefined,
  documentDate: (v) => str(v.data) || undefined,
});
