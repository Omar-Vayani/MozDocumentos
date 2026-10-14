// Requerimento de prova em processo penal: rol de testemunhas, junção de
// documentos, pedido de diligências ou de perícia, filed by the accused, the
// assistant prosecutor or the injured party in a pending criminal case.

import { defineTemplate, type Block, type Values, type Warning } from '../model';
import { GENERO_OPTIONS, cite, dateField, l, lawyerSignature, lineItems, localField, placeDate } from './_shared';
import { FECHO_OPTIONS, artigos, documentosList, juntaText, linePara } from './_advocacia';
import { faseValue, nosAutos, optionalLawyerFields, penalAddressee, penalCaseFields, str, viaMandatario, keepTail } from './_processo-penal';

const TIPO_OPTIONS = [
  { value: 'rol', label: l('Rol de testemunhas', 'List of witnesses') },
  { value: 'aditamento', label: l('Aditar ou alterar o rol de testemunhas', 'Add to or change the witness list') },
  { value: 'juncao', label: l('Junção de documentos', 'File documents') },
  { value: 'diligencias', label: l('Diligências de prova ou perícia', 'Investigative steps or expert examination') },
];

const QUALIDADE: Record<string, [string, string]> = {
  arguido: ['arguido', 'arguida'],
  assistente: ['assistente', 'assistente'],
  ofendido: ['ofendido', 'ofendida'],
  demandante: ['demandante civil', 'demandante civil'],
};

const TITULO: Record<string, string> = {
  rol: 'ROL DE TESTEMUNHAS',
  aditamento: 'ADITAMENTO AO ROL DE TESTEMUNHAS',
  juncao: 'JUNÇÃO DE DOCUMENTOS',
  diligencias: 'REQUERIMENTO DE DILIGÊNCIAS DE PROVA',
};

type Testemunha = { nome?: string; profissao?: string; morada?: string; contacto?: string; factos?: string };

function testemunhas(v: Values): string[] {
  return (lineItems(v.testemunhas) as Testemunha[])
    .filter((t) => str(t.nome))
    .map((t) => [`**${str(t.nome)}**`, str(t.profissao), str(t.morada) ? `residente em ${str(t.morada)}` : '', str(t.contacto) ? `contacto ${str(t.contacto)}` : '', str(t.factos) ? `a depor sobre ${str(t.factos).replace(/[.;]$/, '')}` : ''].filter(Boolean).join(', '));
}

export default defineTemplate({
  id: 'requerimento-prova-penal',
  family: 'peca',
  official: (v) => (v.fase === 'mp' ? 'estado' : 'tribunal'),
  letterhead: false,
  sections: [
    { id: 'processo', title: l('Processo', 'Case') },
    { id: 'parte', title: l('Quem requer', 'Applicant'), personRole: 'cliente' },
    { id: 'prova', title: l('Prova', 'Evidence') },
    { id: 'advogado', title: l('Advogado', 'Lawyer') },
    { id: 'documento', title: l('Local, data e fecho', 'Place, date and closing') },
  ],
  fields: [
    ...penalCaseFields('processo', { defaultFase: 'julgamento' }),
    { name: 'parteNome', type: 'text', section: 'parte', required: true, label: l('Nome', 'Name'), personKey: 'nome' },
    { name: 'parteGenero', type: 'radio', section: 'parte', width: 'half', label: l('Tratamento', 'Form of address'), options: GENERO_OPTIONS, default: 'M', personKey: 'genero' },
    {
      name: 'qualidade',
      type: 'select',
      section: 'parte',
      width: 'half',
      label: l('Posição no processo', 'Role in the case'),
      default: 'arguido',
      options: [
        { value: 'arguido', label: l('Arguido', 'Accused') },
        { value: 'assistente', label: l('Assistente', 'Assistant prosecutor') },
        { value: 'ofendido', label: l('Ofendido', 'Victim') },
        { value: 'demandante', label: l('Demandante civil', 'Civil claimant') },
      ],
    },
    { name: 'tipo', type: 'select', section: 'prova', required: true, label: l('O que apresenta', 'What is filed'), options: TIPO_OPTIONS, default: 'rol' },
    {
      name: 'testemunhas',
      type: 'lines',
      section: 'prova',
      label: l('Testemunhas', 'Witnesses'),
      addLabel: l('Acrescentar testemunha', 'Add witness'),
      columns: [
        { name: 'nome', type: 'text', label: l('Nome', 'Name') },
        { name: 'profissao', type: 'text', label: l('Profissão', 'Occupation') },
        { name: 'morada', type: 'text', label: l('Morada', 'Address') },
        { name: 'contacto', type: 'text', label: l('Contacto', 'Contact') },
        { name: 'factos', type: 'text', label: l('Depõe sobre (opcional)', 'Testifies on (optional)') },
      ],
      default: [{ nome: '', profissao: '', morada: '', contacto: '', factos: '' }],
      showIf: (v) => v.tipo === 'rol' || v.tipo === 'aditamento',
    },
    { name: 'substituida', type: 'text', section: 'prova', label: l('Testemunha que é substituída (opcional)', 'Witness replaced (optional)'), showIf: (v) => v.tipo === 'aditamento' },
    { name: 'motivoAditamento', type: 'text', section: 'prova', label: l('Motivo', 'Reason'), placeholder: l('Ex.: a testemunha arrolada faleceu; só agora se teve conhecimento desta testemunha', 'E.g. the witness died; this witness only recently became known'), showIf: (v) => v.tipo === 'aditamento' },
    { name: 'documentos', type: 'textarea', section: 'prova', rows: 4, label: l('Documentos (um por linha)', 'Documents (one per line)'), showIf: (v) => v.tipo === 'juncao' },
    { name: 'factosProva', type: 'text', section: 'prova', label: l('Factos que pretende provar', 'Facts to prove'), placeholder: l('Ex.: que o arguido se encontrava em Inhambane na data dos factos', 'E.g. that the accused was elsewhere'), showIf: (v) => v.tipo === 'juncao' || v.tipo === 'diligencias' },
    { name: 'motivoTardio', type: 'text', section: 'prova', label: l('Porque só agora (opcional)', 'Why only now (optional)'), showIf: (v) => v.tipo === 'juncao' },
    { name: 'diligencias', type: 'textarea', section: 'prova', rows: 4, label: l('Diligências requeridas (uma por linha)', 'Steps requested (one per line)'), placeholder: l('Exame pericial à letra e assinatura do recibo de fls. 23\nRequisição à Vodacom dos registos de chamadas do número …', 'Handwriting examination\nPhone records request'), showIf: (v) => v.tipo === 'diligencias' },
    ...optionalLawyerFields('advogado'),
    localField('documento'),
    dateField('data', 'documento'),
    { name: 'fecho', type: 'select', section: 'documento', width: 'half', label: l('Fecho', 'Closing formula'), options: FECHO_OPTIONS, default: 'Pede deferimento.' },
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: 'info',
        message: l(
          `São admissíveis as provas não proibidas por lei (${cite('ppProva')}). O rol de testemunhas acompanha, em regra, a acusação, a contestação ou o pedido de indemnização; o aditamento depois desse momento depende de despacho e da justificação apresentada. Confirme os prazos do seu processo.`,
          'Any evidence not prohibited by law is admissible. The witness list normally goes with the accusation, defence or damages claim; later additions need the judge’s leave.',
        ),
      },
    ];
    if ((v.tipo === 'rol' || v.tipo === 'aditamento') && testemunhas(v).length === 0) w.push({ level: 'warning', field: 'testemunhas', message: l('Indique pelo menos uma testemunha.', 'Enter at least one witness.') });
    return w;
  },

  personName: (v) => v.parteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v);
    const f = v.parteGenero === 'F';
    const qual = (QUALIDADE[v.qualidade] ?? QUALIDADE.arguido)[f ? 1 : 0];
    const tipo = TITULO[v.tipo] ? v.tipo : 'rol';
    const nome = `**${(str(v.parteNome) || '____________________').toLocaleUpperCase('pt')}**`;
    const tests = testemunhas(v);
    const docs = documentosList(v.documentos);
    const factos = str(v.factosProva).replace(/[.;]$/, '');
    const blocks: Block[] = [
      { type: 'courtHeader', processo: str(v.processoNumero) || '________/______', extra: fase !== 'mp' ? str(v.seccao) || undefined : undefined, addressee: penalAddressee(v, fase) },
    ];
    const intro = (acto: string) => ({
      type: 'paragraph' as const,
      id: 'intro',
      text: `${nome}, ${qual} ${nosAutos(v)}, neles melhor ${f ? 'identificada' : 'identificado'}, vem${viaMandatario(v)} ${acto}`,
      en: 'The party files the following.',
    });
    if (tipo === 'rol' || tipo === 'aditamento') {
      blocks.push(
        intro(tipo === 'rol' ? 'apresentar o seu' : 'requerer o'),
        { type: 'paragraph', id: 'titulo', align: 'center', text: `**${TITULO[tipo]}**`, en: 'LIST OF WITNESSES' },
      );
      if (tipo === 'aditamento') {
        blocks.push({
          type: 'paragraph',
          id: 'motivo',
          text: `${str(v.substituida) ? `em substituição da testemunha ${str(v.substituida)}, ` : ''}${str(v.motivoAditamento) ? `porquanto ${str(v.motivoAditamento).replace(/[.;]$/, '')}, ` : ''}requerendo a V. Ex.ª se digne admitir a inquirição das seguintes testemunhas:`,
          en: 'The party asks the court to admit the following witnesses.',
          keepWithNext: true,
        });
      } else {
        blocks.push({ type: 'paragraph', id: 'motivo', text: 'requerendo a V. Ex.ª a notificação das seguintes testemunhas para comparecerem na audiência:', en: 'and asks that the following witnesses be summoned to the hearing:', keepWithNext: true });
      }
      blocks.push({ type: 'list', style: 'numeric', items: tests.length ? tests.map((t, i) => `${t}${i === tests.length - 1 ? '.' : ';'}`) : ['____________________'] });
    } else if (tipo === 'juncao') {
      blocks.push(
        intro('requerer a'),
        { type: 'paragraph', id: 'titulo', align: 'center', text: `**${TITULO.juncao}**`, en: 'FILING OF DOCUMENTS' },
        {
          type: 'paragraph',
          id: 'juncao',
          text: `aos autos dos documentos que se anexam${factos ? `, destinados a provar ${factos}` : ', por se mostrarem relevantes para a descoberta da verdade'}${str(v.motivoTardio) ? `, não tendo sido possível juntá-los anteriormente porque ${str(v.motivoTardio).replace(/[.;]$/, '')}` : ''}.`,
          en: 'of the attached documents, relevant to the facts stated.',
        },
      );
    } else {
      const dils = artigos(v.diligencias).map((s) => s.replace(/\.$/, ''));
      blocks.push(
        intro('requerer a V. Ex.ª a realização das seguintes'),
        { type: 'paragraph', id: 'titulo', align: 'center', text: '**DILIGÊNCIAS DE PROVA**', en: 'INVESTIGATIVE STEPS' },
        { type: 'list', style: 'alpha', items: dils.length ? dils.map((d, i) => `${d}${i === dils.length - 1 ? '.' : ';'}`) : ['____________________'] },
        {
          type: 'paragraph',
          id: 'fundamento',
          text: `As diligências requeridas são necessárias e pertinentes para a descoberta da verdade${factos ? `, designadamente para provar ${factos}` : ''}, não sendo proibidas por lei.`,
          en: 'The steps requested are relevant and lawful.',
        },
      );
    }
    if (docs.length && tipo === 'juncao') blocks.push(linePara('junta', 'Junta', `${juntaText({ documentos: docs.length })}.`, 'Attached documents.', true));
    blocks.push(
      { type: 'paragraph', id: 'fecho', text: String(v.fecho || 'Pede deferimento.'), en: 'Closing formula.', keepWithNext: true },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [v.viaAdvogado ? lawyerSignature(v) : { role: `${f ? 'A' : 'O'} ${qual.charAt(0).toUpperCase()}${qual.slice(1)}`, name: str(v.parteNome) || undefined }] },
    );
    if (docs.length && tipo === 'juncao') blocks.push({ type: 'annexList', title: 'Documentos juntos', items: docs });
    return keepTail(blocks, 'fecho');
  },
});
