// Declaração médica de doença crónica / de medicação em uso: the doctor states
// that the patient is under follow-up for a chronic condition and needs regular
// medication, for a school, an employer, an insurer or for travelling with the
// medicines (airline, customs, foreign border). The diagnosis is printed only
// with the patient's express consent.

import { defineTemplate, type Block, type Warning } from '../model';
import { cite, dateField, dateLong, g, l, localField, placeDate } from './_shared';
import { clinicianDesc, clinicianFields, clinicianSignature, clinicianWarnings, hivWarning, mentionsHiv, patientFields, patientIdent, senhor } from './_saude';
import { rows, semPonto, str } from './_saude-educacao';

const FIM = [
  { value: 'viagem', label: l('Viajar com os medicamentos', 'Travelling with medicines'), pt: 'ser apresentada às companhias aéreas e às autoridades de fronteira e alfandegárias, para efeitos de transporte da medicação de uso pessoal', en: 'be shown to airlines and border and customs authorities, for carrying personal medication' },
  { value: 'escola', label: l('Escola ou universidade', 'School or university'), pt: 'ser apresentada no estabelecimento de ensino', en: 'be shown to the school' },
  { value: 'trabalho', label: l('Entidade empregadora', 'Employer'), pt: 'ser apresentada à entidade empregadora', en: 'be shown to the employer' },
  { value: 'seguro', label: l('Seguradora', 'Insurer'), pt: 'ser apresentada à seguradora', en: 'be shown to the insurer' },
  { value: 'outro', label: l('Para os devidos efeitos', 'For all due purposes'), pt: '', en: '' },
];

export default defineTemplate({
  id: 'declaracao-doenca-cronica',
  family: 'declaracao',
  sections: [
    { id: 'clinico', title: l('Médico', 'Doctor') },
    { id: 'doente', title: l('Doente', 'Patient'), personRole: 'outro' },
    { id: 'situacao', title: l('Situação clínica', 'Clinical situation') },
    { id: 'medicacao', title: l('Medicação e material', 'Medication and supplies') },
    { id: 'documento', title: l('Local e data', 'Place and date') },
  ],
  fields: [
    ...clinicianFields('clinico'),
    ...patientFields(['nome', 'genero', 'dataNascimento', 'idade', 'docTipo', 'docNumero'], 'doente'),
    { name: 'finalidade', type: 'select', section: 'situacao', label: l('Destina-se a', 'For'), options: FIM.map(({ value, label }) => ({ value, label })), default: 'viagem' },
    { name: 'seguidoDesde', type: 'text', section: 'situacao', width: 'half', label: l('Seguido(a) nesta consulta desde (ano)', 'Followed up since (year)'), placeholder: l('Ex.: 2019', 'E.g. 2019') },
    {
      name: 'incluirDiagnostico',
      type: 'toggle',
      section: 'situacao',
      label: l('Indicar a doença (o doente autorizou expressamente)', 'Name the condition (patient expressly agreed)'),
      help: l('Sem esta autorização a declaração fala apenas em "doença crónica".', 'Without consent the declaration says only "chronic condition".'),
    },
    { name: 'diagnostico', type: 'text', section: 'situacao', label: l('Doença', 'Condition'), placeholder: l('Ex.: diabetes mellitus tipo 1', 'E.g. type 1 diabetes'), showIf: (v) => Boolean(v.incluirDiagnostico) },
    { name: 'estavel', type: 'toggle', section: 'situacao', default: true, label: l('Situação clinicamente estável', 'Clinically stable') },
    {
      name: 'recomendacoes',
      type: 'textarea',
      section: 'situacao',
      rows: 2,
      label: l('Necessidades ou recomendações (opcional)', 'Needs or recommendations (optional)'),
      placeholder: l('Ex.: permitir pausas para medir a glicemia e lanchar; acesso à água', 'E.g. allow breaks to check blood sugar and eat'),
    },
    {
      name: 'medicamentos',
      type: 'lines',
      section: 'medicacao',
      label: l('Medicamentos de uso regular', 'Regular medicines'),
      addLabel: l('Adicionar medicamento', 'Add medicine'),
      columns: [
        { name: 'nome', type: 'text', label: l('Medicamento (DCI) e dosagem', 'Medicine (INN) and strength') },
        { name: 'posologia', type: 'text', label: l('Posologia', 'Dosage') },
        { name: 'quantidade', type: 'text', label: l('Quantidade transportada', 'Quantity carried') },
      ],
      default: [],
    },
    { name: 'material', type: 'text', section: 'medicacao', label: l('Material médico (opcional)', 'Medical supplies (optional)'), placeholder: l('Ex.: seringas e agulhas de insulina, glucómetro, tiras-teste', 'E.g. insulin syringes, glucometer') },
    { name: 'viagemPeriodo', type: 'text', section: 'medicacao', label: l('Período da viagem (opcional)', 'Travel period (optional)'), placeholder: l('Ex.: de 2 a 30 de Novembro de 2026', 'E.g. 2–30 November 2026'), showIf: (v) => v.finalidade === 'viagem' },
    localField(),
    dateField(),
  ],

  warnings: (v) => {
    const w: Warning[] = [...clinicianWarnings(v)];
    if (v.incluirDiagnostico && mentionsHiv(v.diagnostico)) w.push(hivWarning('diagnostico'));
    if (mentionsHiv(v.recomendacoes, ...rows(v.medicamentos).map((m) => m.nome))) w.push(hivWarning('medicamentos'));
    if (v.finalidade === 'viagem') {
      w.push({
        level: 'info',
        field: 'medicamentos',
        message: l(
          `Use o nome genérico (DCI) e a quantidade para a duração da viagem. Medicamentos estupefacientes ou psicotrópicos seguem regras próprias e podem precisar de autorização do país de destino (${cite('estupefacientesPrescricao')}).`,
          'Use generic names and the quantity for the trip. Narcotics or psychotropics follow special rules and may need the destination country’s permit.',
        ),
      });
    }
    if (v.finalidade === 'trabalho' && v.incluirDiagnostico) {
      w.push({ level: 'warning', field: 'incluirDiagnostico', message: l(`Ao empregador só se comunica a aptidão para o trabalho (${cite('examesMedicosTrabalho')}).`, 'The employer is told only about fitness for work.') });
    }
    return w;
  },

  personName: (v) => v.doenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const who = clinicianDesc(v);
    const pat = patientIdent(v);
    const doente = g(v.doenteGenero, 'o doente', 'a doente');
    const fim = FIM.find((x) => x.value === v.finalidade) ?? FIM[0];
    const doenca = v.incluirDiagnostico && str(v.diagnostico) ? `**${semPonto(v.diagnostico)}**, doença crónica` : 'uma **doença crónica**';
    const meds = rows(v.medicamentos).filter((m) => str(m.nome));
    const blocks: Block[] = [
      { type: 'title', text: 'Declaração Médica', subtitle: 'Doença crónica e medicação em uso' },
      {
        type: 'paragraph',
        id: 'declara',
        text: `${who.pt}, declara, sob compromisso de honra profissional, que ${senhor(v)} ${pat.pt}, é ${g(v.doenteGenero, 'seguido', 'seguida')} em consulta${str(v.seguidoDesde) ? ` desde ${str(v.seguidoDesde)}` : ''} por ${doenca}, que exige tratamento regular e contínuo${v.estavel ? `, encontrando-se clinicamente estável` : ''}.`,
        en: `${who.en} declares that ${pat.en} is followed up${str(v.seguidoDesde) ? ` since ${v.seguidoDesde}` : ''} for ${v.incluirDiagnostico && v.diagnostico ? v.diagnostico : 'a chronic condition'} requiring regular, continuous treatment${v.estavel ? ', and is clinically stable' : ''}.`,
      },
    ];
    if (meds.length) {
      blocks.push(
        { type: 'paragraph', id: 'medicacao', text: `Para o efeito, ${doente} necessita de ter consigo e de tomar a seguinte medicação, prescrita para uso pessoal:`, en: 'The patient needs to carry and take the following medication, prescribed for personal use:' },
        {
          type: 'table',
          columns: [{ label: 'Medicamento (DCI) e dosagem', width: 45 }, { label: 'Posologia', width: 35 }, { label: 'Quantidade', width: 20 }],
          rows: meds.map((m) => [str(m.nome), str(m.posologia), str(m.quantidade)]),
        },
      );
    }
    if (str(v.material)) {
      blocks.push({ type: 'paragraph', id: 'material', text: `${doente.charAt(0).toUpperCase()}${doente.slice(1)} necessita igualmente do seguinte material médico: ${semPonto(v.material)}.`, en: `The patient also needs: ${v.material}.` });
    }
    if (str(v.recomendacoes)) {
      blocks.push({ type: 'paragraph', id: 'recomendacoes', text: `Recomenda-se: ${semPonto(v.recomendacoes)}.`, en: `Recommended: ${str(v.recomendacoes).replace(/\s+/g, ' ')}.` });
    }
    const viagem = v.finalidade === 'viagem' && str(v.viagemPeriodo) ? `, durante a viagem ${semPonto(v.viagemPeriodo)}` : '';
    blocks.push(
      {
        type: 'paragraph',
        id: 'fecho',
        text: `${fim.pt ? `A presente declaração destina-se a ${fim.pt}${viagem}. ` : ''}Por ser verdade e lhe ter sido solicitado, passa a presente declaração, que assina e autentica com o carimbo em uso.`,
        en: `${fim.en ? `This declaration is to ${fim.en}. ` : ''}Issued at the patient’s request, signed and stamped.`,
        keepWithNext: true,
      },
      { type: 'signatures', placeDate: placeDate(ctx, v.data), columns: [clinicianSignature(ctx)] },
    );
    if (v.finalidade === 'viagem') blocks.push({ type: 'note', text: `Emitida em ${dateLong(v.data)}. Os medicamentos devem ser transportados nas embalagens de origem.`, en: 'Medicines should be carried in their original packaging.' });
    return blocks;
  },
});
