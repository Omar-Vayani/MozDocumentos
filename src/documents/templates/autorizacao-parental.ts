// Autorização parental (genérica): the parent(s) authorise a minor child for a
// specific act — medical treatment, an identity document or passport, a sports
// or school activity, use of image, opening a bank account or a job. Travel
// abroad has its own document (autorizacao-viagem-menor).

import { defineTemplate, type Block, type DefaultsContext, type Values, type Warning } from '../model';
import { BLANK, cite, dateField, dateLong, isF, l, localField } from './_shared';
import { ageOn, identificacao, notaryBox, PARENTESCO_OPTIONS, pessoaFields, qualidadeParental, RECONHECIMENTO_FIELD } from './_pessoal-rh';
import { filhos, filhosField, filhoTexto, oMenor, semPonto, str } from './_familia';

const KEYS = ['nome', 'genero', 'nacionalidade', 'docTipo', 'docNumero', 'docEmissao', 'docLocal', 'morada', 'telefone'] as const;

const FINALIDADES: Record<string, { label: [string, string]; texto: string; en: string }> = {
  saude: { label: ['Tratamento médico, cirurgia ou exames', 'Medical treatment, surgery or tests'], texto: 'a ser submetid{o} aos actos médicos a seguir indicados, depois de devidamente esclarecido pelo médico responsável', en: 'to undergo the medical care stated' },
  documento: { label: ['Emissão de BI, passaporte ou outro documento', 'ID card, passport or other document'], texto: 'a requerer e obter o documento a seguir indicado', en: 'to apply for the document stated' },
  actividade: { label: ['Actividade desportiva, cultural, acampamento ou excursão', 'Sports, cultural activity, camp or trip'], texto: 'a participar na actividade a seguir indicada', en: 'to take part in the activity stated' },
  imagem: { label: ['Uso de imagem e voz (fotografias, vídeos, publicidade)', 'Use of image and voice'], texto: 'a participar em gravações e sessões fotográficas e autorizo o uso da sua imagem e voz, apenas para o fim a seguir indicado', en: 'to be photographed or filmed and the image used for the purpose stated' },
  trabalho: { label: ['Contrato de trabalho', 'Employment contract'], texto: 'a celebrar contrato de trabalho e a prestar a actividade a seguir indicada', en: 'to sign an employment contract for the work stated' },
  conta: { label: ['Abertura de conta bancária ou carteira móvel', 'Bank account or mobile wallet'], texto: 'a abrir e movimentar a conta a seguir indicada', en: 'to open and use the account stated' },
  outro: { label: ['Outro acto', 'Other act'], texto: 'a praticar o acto a seguir indicado', en: 'to do the act stated' },
};

export default defineTemplate({
  id: 'autorizacao-parental',
  family: 'declaracao',
  official: (v) => (v.finalidade === 'documento' ? 'estado' : undefined),
  letterhead: false,
  sections: [
    { id: 'documento', title: l('Local e data', 'Place and date') },
    { id: 'progenitor1', title: l('Pai, mãe ou tutor', 'Parent or guardian'), description: l('Os dados vêm do seu perfil pessoal.', 'Details come from your personal profile.'), personRole: 'outro' },
    { id: 'progenitor2', title: l('Segundo progenitor (se também assina)', 'Second parent (if signing)'), personRole: 'outro' },
    { id: 'menores', title: l('Menor(es)', 'Child(ren)') },
    { id: 'autorizacao', title: l('O que se autoriza', 'What is authorised') },
  ],
  fields: [
    localField(),
    dateField('data', 'documento', l('Data', 'Date')),
    ...pessoaFields('progenitor1', 'progenitor1', { profile: true, keys: KEYS }),
    { name: 'progenitor1Qualidade', type: 'select', section: 'progenitor1', width: 'half', label: l('É', 'Is the'), options: PARENTESCO_OPTIONS, default: (c) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'mãe' : 'pai') },
    { name: 'doisProgenitores', type: 'toggle', section: 'progenitor2', label: l('O outro progenitor também assina', 'The other parent also signs') },
    ...pessoaFields('progenitor2', 'progenitor2', { keys: KEYS }).map((f) => ({
      ...f,
      required: false,
      default: f.name === 'progenitor2Genero' ? (c: DefaultsContext) => (c.profile?.kind === 'pessoa' && c.profile.genero === 'F' ? 'M' : 'F') : f.default,
      showIf: (v: Values) => Boolean(v.doisProgenitores),
    })),
    { name: 'progenitor2Qualidade', type: 'select', section: 'progenitor2', width: 'half', label: l('É', 'Is the'), options: PARENTESCO_OPTIONS, default: 'mãe', showIf: (v) => Boolean(v.doisProgenitores) },
    filhosField('menores', 'menores', l('Menor(es)', 'Child(ren)')),
    {
      name: 'finalidade',
      type: 'select',
      section: 'autorizacao',
      required: true,
      label: l('Autorizo o menor a', 'I authorise the child to'),
      options: Object.entries(FINALIDADES).map(([value, f]) => ({ value, label: l(f.label[0], f.label[1]) })),
      default: 'actividade',
    },
    {
      name: 'descricao',
      type: 'textarea',
      section: 'autorizacao',
      rows: 3,
      required: true,
      label: l('Descrição', 'Description'),
      placeholder: l('Ex.: acampamento de escuteiros na Namaacha, com transporte em autocarro da organização', 'E.g. scout camp in Namaacha, with transport by the organisers'),
    },
    { name: 'entidade', type: 'text', section: 'autorizacao', label: l('Entidade ou responsável', 'Organisation or person in charge'), placeholder: l('Ex.: Associação de Escuteiros de Moçambique — Agrupamento 12', 'E.g. organiser') },
    { name: 'dataInicio', type: 'date', section: 'autorizacao', width: 'half', label: l('Data (ou início)', 'Date (or start)') },
    { name: 'dataFim', type: 'date', section: 'autorizacao', width: 'half', label: l('Até (opcional)', 'Until (optional)') },
    { name: 'contactoEmergencia', type: 'tel', section: 'autorizacao', width: 'half', label: l('Contacto de emergência', 'Emergency contact'), default: (c) => c.profile?.telefones || '' },
    { name: 'observacoes', type: 'text', section: 'autorizacao', label: l('Observações (alergias, medicação, condições)', 'Notes (allergies, medication, conditions)') },
    RECONHECIMENTO_FIELD('autorizacao'),
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const lista = filhos(v.menores);
    if (!lista.length) w.push({ level: 'error', field: 'menores', message: l('Indique o menor.', 'Enter the child.') });
    if (!str(v.descricao)) w.push({ level: 'warning', field: 'descricao', message: l('Descreva o que autoriza.', 'Describe what you authorise.') });
    const maior = ctx.legal.value<{ anos: number }>('maioridade').anos;
    for (const f of lista) {
      const idade = ageOn(f.nascimento, v.data);
      if (idade != null && idade >= maior) w.push({ level: 'warning', field: 'menores', message: l(`${f.nome} já é maior e não precisa de autorização.`, `${f.nome} is already an adult.`) });
    }
    if (v.finalidade === 'trabalho') w.push({ level: 'warning', field: 'finalidade', message: l(`O trabalho de menores tem idade mínima e limites de horário e de actividades (${cite('famTrabalhoMenores')}). Confirme com a Inspecção-Geral do Trabalho.`, 'Child work has a minimum age and limits on hours and tasks. Check with the Labour Inspectorate.') });
    if (v.finalidade === 'documento') w.push({ level: 'info', field: 'finalidade', message: l('Para passaporte ou BI de menor, os serviços costumam exigir a presença de um dos pais e, por vezes, a autorização do outro com assinatura reconhecida.', 'For a child’s passport or ID, offices usually require one parent present and sometimes the other parent’s certified consent.') });
    if (v.finalidade === 'saude') w.push({ level: 'info', field: 'finalidade', message: l('A unidade sanitária terá também o seu próprio termo de consentimento informado, que deve ser assinado depois de esclarecido pelo médico.', 'The clinic will also have its own informed consent form to sign after the doctor explains.') });
    if (!v.doisProgenitores) w.push({ level: 'info', field: 'doisProgenitores', message: l('Para actos importantes (saúde grave, documentos, trabalho), é preferível que assinem os dois pais.', 'For important acts, both parents should preferably sign.') });
    return w;
  },

  personName: (v) => filhos(v.menores)[0]?.nome || v.progenitor1Nome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const lista = filhos(v.menores);
    const m = oMenor(lista);
    const dois = Boolean(v.doisProgenitores);
    const q = (p: string) => qualidadeParental(v[`${p}Qualidade`], v[`${p}Genero`]);
    const fin = FINALIDADES[v.finalidade] ?? FINALIDADES.outro;
    const fem = lista.length > 0 && lista.every((f) => isF(f.genero));
    const sufixo = m.plural ? (fem ? 'as' : 'os') : fem ? 'a' : 'o';
    const texto = fin.texto.replace('{o}', sufixo);
    const quem = dois
      ? `${identificacao(v, 'progenitor1', { estadoCivil: false })}, e ${identificacao(v, 'progenitor2', { estadoCivil: false })}, na qualidade de ${q('progenitor1')} e ${q('progenitor2')}`
      : `${identificacao(v, 'progenitor1', { estadoCivil: false })}, na qualidade de ${q('progenitor1')}`;
    const periodo = str(v.dataInicio) ? (str(v.dataFim) ? `, de ${dateLong(v.dataInicio)} a ${dateLong(v.dataFim)}` : `, em ${dateLong(v.dataInicio)}`) : '';

    const blocks: Block[] = [
      { type: 'title', text: 'Autorização parental' },
      {
        type: 'paragraph',
        id: 'autorizacao',
        text: `${quem} ${m.de} ${lista.length ? lista.map((f) => filhoTexto(f)).join('; ') : `**${BLANK}**`}, ${dois ? 'autorizam' : 'autoriza'} ${m.o} ${texto}:`,
        en: `The parent(s) authorise the child(ren) ${fin.en}:`,
      },
      { type: 'paragraph', id: 'descricao', text: `**${semPonto(v.descricao) || BLANK}**${str(v.entidade) ? `, sob a responsabilidade de ${semPonto(v.entidade)}` : ''}${periodo}.`, en: 'Description, organiser and dates as stated.' },
    ];
    if (str(v.observacoes)) blocks.push({ type: 'paragraph', id: 'observacoes', text: `Observações: ${semPonto(v.observacoes)}.`, en: 'Notes as stated.' });
    blocks.push({
      type: 'paragraph',
      id: 'contacto',
      text: `${dois ? 'Os declarantes ficam' : `${isF(v.progenitor1Genero) ? 'A declarante fica' : 'O declarante fica'}`} contactáve${dois ? 'is' : 'l'} pelo telefone ${str(v.contactoEmergencia) || str(v.progenitor1Telefone) || BLANK} para qualquer situação relativa ${m.ao}, e a presente autorização pode ser revogada a todo o tempo.`,
      en: 'The parent(s) can be reached at the number given; this authorisation may be revoked at any time.',
      keepWithNext: true,
    });
    blocks.push({
      type: 'signatures',
      placeDate: `${ctx.place}, ${dateLong(v.data)}`,
      columns: [
        { role: `${isF(v.progenitor1Genero) ? 'A' : 'O'} ${q('progenitor1').replace(/^./, (x) => x.toUpperCase())}`, name: str(v.progenitor1Nome) || undefined, image: ctx.profile?.kind === 'pessoa' ? 'signature' : undefined },
        ...(dois ? [{ role: `${isF(v.progenitor2Genero) ? 'A' : 'O'} ${q('progenitor2').replace(/^./, (x) => x.toUpperCase())}`, name: str(v.progenitor2Nome) || undefined }] : []),
      ],
      keepWithNext: Boolean(v.espacoReconhecimento),
    });
    if (v.espacoReconhecimento) blocks.push(notaryBox());
    return blocks;
  },
});
