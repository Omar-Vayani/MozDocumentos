// Regulamento interno da escola: organisation, rights and duties of pupils,
// parents and staff, attendance, fees and the disciplinary regime, in articles.
// Disciplinary measures are graduated, preceded by hearing the pupil and the
// parent, and never physical or humiliating.

import { defineTemplate, type Block, type ClauseItem, type Warning } from '../model';
import { cite, dateLong, l } from './_shared';
import { licenca, licenceWarning, NIVEL_OPTIONS, NIVEL_TEXTO, schoolName } from './_educacao';
import { papelCargo, semPonto, str } from './_saude-educacao';

const TELEMOVEL_OPTIONS = [
  { value: 'proibido', label: l('Proibido durante as aulas (guardado e desligado)', 'Not allowed in class (switched off)') },
  { value: 'proibido-total', label: l('Proibido no recinto escolar', 'Not allowed on school grounds') },
  { value: 'pedagogico', label: l('Permitido só para fins pedagógicos, com autorização do professor', 'Teaching use only, with permission') },
];

const int = (x: unknown) => {
  const n = Number(x);
  return str(x) && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export default defineTemplate({
  id: 'regulamento-interno-escola',
  family: 'contrato',
  rubricas: false,
  sections: [
    { id: 'escola', title: l('Escola', 'School') },
    { id: 'funcionamento', title: l('Funcionamento', 'Operation') },
    { id: 'alunos', title: l('Alunos e disciplina', 'Pupils and discipline') },
    { id: 'propinas', title: l('Propinas (ensino privado)', 'Fees (private schools)') },
    { id: 'aprovacao', title: l('Aprovação', 'Approval') },
  ],
  fields: [
    { name: 'niveis', type: 'text', section: 'escola', label: l('Níveis de ensino ministrados', 'Levels taught'), placeholder: l('Ex.: Educação Pré-Escolar, Ensino Primário e Ensino Secundário', 'E.g. pre-school, primary and secondary'), default: 'Ensino Primário e Ensino Secundário' },
    { name: 'nivelPrincipal', type: 'select', section: 'escola', width: 'half', label: l('Nível principal', 'Main level'), options: NIVEL_OPTIONS.slice(0, 5), default: 'secundario' },
    { name: 'privada', type: 'toggle', section: 'escola', default: (c) => c.profile?.kind === 'empresa' && c.profile?.tipoEntidade !== 'publica', label: l('Escola privada (inclui o capítulo das propinas)', 'Private school (includes fees chapter)') },
    { name: 'horario', type: 'text', section: 'funcionamento', label: l('Horário de funcionamento', 'Opening hours'), default: 'de segunda a sexta-feira, das 7h00 às 17h30' },
    { name: 'toleranciaMin', type: 'number', section: 'funcionamento', width: 'half', min: 0, max: 60, default: 10, label: l('Tolerância de atraso (minutos)', 'Lateness tolerance (minutes)') },
    { name: 'uniforme', type: 'toggle', section: 'funcionamento', default: true, label: l('Uso obrigatório de uniforme', 'Uniform required') },
    { name: 'uniformeDescricao', type: 'text', section: 'funcionamento', label: l('Uniforme', 'Uniform'), placeholder: l('Ex.: camisa branca com o emblema, calça ou saia azul-escura e sapatos pretos', 'E.g. white shirt with badge, navy trousers or skirt'), showIf: (v) => Boolean(v.uniforme) },
    { name: 'telemovel', type: 'select', section: 'funcionamento', label: l('Telemóveis', 'Mobile phones'), options: TELEMOVEL_OPTIONS, default: 'proibido' },
    { name: 'recolhaAutorizada', type: 'toggle', section: 'funcionamento', default: true, label: l('Alunos menores só saem com o encarregado ou pessoa autorizada por escrito', 'Minors leave only with the parent or a person authorised in writing') },
    { name: 'faltasLimite', type: 'number', section: 'alunos', width: 'half', min: 0, max: 100, label: l('Limite de faltas injustificadas por disciplina (opcional)', 'Unexcused absence limit per subject (optional)') },
    { name: 'suspensaoMaxDias', type: 'number', section: 'alunos', width: 'half', min: 1, max: 30, default: 3, label: l('Suspensão máxima (dias lectivos)', 'Maximum suspension (school days)') },
    { name: 'diaPagamento', type: 'number', section: 'propinas', width: 'half', min: 1, max: 31, default: 10, label: l('Propinas pagas até ao dia', 'Fees due by day'), showIf: (v) => Boolean(v.privada) },
    { name: 'multaAtraso', type: 'number', section: 'propinas', width: 'half', min: 0, max: 50, label: l('Agravamento por atraso (%) (opcional)', 'Late surcharge (%) (optional)'), showIf: (v) => Boolean(v.privada) },
    { name: 'mesesPropina', type: 'text', section: 'propinas', width: 'half', label: l('Meses de propina', 'Months charged'), default: 'Fevereiro a Novembro', showIf: (v) => Boolean(v.privada) },
    { name: 'aprovadoPor', type: 'text', section: 'aprovacao', width: 'half', label: l('Aprovado por', 'Approved by'), default: 'Conselho de Escola' },
    { name: 'dataAprovacao', type: 'date', section: 'aprovacao', width: 'half', label: l('Data da aprovação', 'Approval date'), default: (c) => c.today },
    { name: 'dataVigor', type: 'date', section: 'aprovacao', width: 'half', label: l('Entrada em vigor', 'In force from') },
    { name: 'assinanteNome', type: 'text', section: 'aprovacao', width: 'half', label: l('Quem assina', 'Signatory'), default: (c) => c.profile?.representanteNome ?? '' },
    { name: 'assinanteCargo', type: 'text', section: 'aprovacao', width: 'half', label: l('Cargo', 'Position'), default: (c) => c.profile?.representanteCargo || 'Director da Escola' },
    { name: 'local', type: 'text', section: 'aprovacao', width: 'half', label: l('Local', 'Place'), default: (c) => c.profile?.localPadrao || c.profile?.morada?.cidade || 'Maputo' },
  ],

  warnings: (v, ctx) => {
    const w: Warning[] = [...licenceWarning(ctx)];
    w.push({
      level: 'info',
      message: l(
        `Leia o regulamento no Conselho de Escola antes de o aprovar e entregue um exemplar a cada encarregado no acto da matrícula (${cite('seRegulamentoInternoEscola')}). Os castigos corporais e humilhantes são proibidos (${cite('seDireitosCrianca')}).`,
        'Discuss the rules in the School Council before approval and give a copy to each parent at enrolment. Corporal and humiliating punishment is prohibited.',
      ),
    });
    if (v.privada) {
      w.push({ level: 'info', message: l(`As propinas e as suas alterações são fixadas anualmente e comunicadas às autoridades de educação (${cite('eduPropinasEnsinoPrivado')}). Não se pode impedir um aluno de fazer provas por dívida (${cite('eduDireitoEducacaoDividas')}).`, 'Fees are set yearly and reported to the education authorities; a pupil may not be barred from tests for debt.') });
    }
    return w;
  },

  personName: () => 'Regulamento interno',
  documentDate: (v) => v.dataAprovacao,

  blocks: (ctx) => {
    const v = ctx.values;
    const escola = schoolName(ctx);
    const alv = licenca(ctx);
    const horas = ctx.legal.value<{ prazoHoras: number }>('eduJustificacaoFaltaAluno').prazoHoras;
    const tol = int(v.toleranciaMin);
    const susp = int(v.suspensaoMaxDias);
    const fl = int(v.faltasLimite);
    const dia = int(v.diaPagamento);
    const multa = int(v.multaAtraso);
    const tel = str(v.telemovel) || 'proibido';
    const nivel = NIVEL_TEXTO[str(v.nivelPrincipal)] ?? 'Ensino Secundário';
    const art = (id: string, heading: string, text: string, en: string, items?: string[]): ClauseItem => ({ id, heading, text, en, items });
    const cap1: ClauseItem[] = [
      art('objecto', 'Objecto e âmbito', `O presente regulamento estabelece as regras de organização e funcionamento da **${escola}**, adiante designada por Escola, e os direitos e deveres dos alunos, encarregados de educação, professores e demais pessoal, aplicando-se a todos quantos se encontrem no recinto escolar ou participem em actividades organizadas pela Escola.`, 'Scope: the rules of the school and the rights and duties of everyone in it.'),
      art('identificacao', 'Identificação', `A Escola ministra ${semPonto(v.niveis) || nivel}${alv ? ` e funciona ao abrigo do ${alv.replace(/^./, (c) => c.toLowerCase())}` : ''}, nos termos da legislação do Sistema Nacional de Educação.`, 'Levels taught and licence.'),
      art('principios', 'Princípios', 'A vida escolar rege-se pelos seguintes princípios:', 'Principles:', [
        'o superior interesse da criança e o respeito pela sua dignidade;',
        'a igualdade e a não discriminação em razão do sexo, raça, etnia, religião, condição social, deficiência ou estado de saúde;',
        'a proibição de castigos corporais, humilhações, assédio e qualquer forma de violência;',
        'a participação dos encarregados de educação e da comunidade na vida da Escola.',
      ]),
    ];
    const cap2: ClauseItem[] = [
      art('orgaos', 'Órgãos', 'São órgãos da Escola:', 'School bodies:', [
        'a Direcção da Escola, que dirige a actividade pedagógica e administrativa;',
        'o Conselho de Escola, com representantes da Direcção, dos professores, do pessoal administrativo, dos encarregados de educação e, quando a idade o permita, dos alunos, que aprova o presente regulamento e acompanha a vida da Escola;',
        'o Conselho Pedagógico, que coordena o ensino e a avaliação;',
        'os Conselhos de Turma e os Directores de Turma.',
      ]),
      art('horario', 'Horário e pontualidade', `A Escola funciona ${semPonto(v.horario) || '____________________'}. ${tol ? `Após ${tol} minutos de tolerância, o atraso é registado como falta de pontualidade, e os atrasos repetidos são comunicados ao encarregado de educação.` : 'Os atrasos são registados e comunicados ao encarregado de educação.'}`, 'Opening hours and lateness.'),
      art('matriculas', 'Matrículas', `A matrícula e a sua renovação fazem-se nos prazos fixados pela Escola, mediante a entrega dos documentos exigidos${v.privada ? ' e a assinatura do contrato de prestação de serviços educativos' : ''}. No acto da matrícula é entregue ao encarregado de educação um exemplar deste regulamento.`, 'Enrolment and renewal; parents receive a copy of these rules.'),
    ];
    const cap3: ClauseItem[] = [
      art('direitos', 'Direitos do aluno', 'O aluno tem direito a:', 'Pupils’ rights:', [
        'receber um ensino de qualidade e ser avaliado com justiça e transparência, conhecendo os critérios de avaliação;',
        'ser tratado com respeito e protegido contra qualquer forma de violência, abuso, assédio ou discriminação;',
        'ser ouvido e apresentar sugestões e reclamações, por si ou através do encarregado de educação;',
        'usar as instalações e os materiais da Escola nos termos das regras aplicáveis;',
        'ser informado das faltas e das medidas que lhe digam respeito.',
      ]),
      art('deveres', 'Deveres do aluno', 'O aluno deve:', 'Pupils’ duties:', [
        'ser assíduo e pontual e trazer o material escolar necessário;',
        'respeitar os colegas, os professores e todo o pessoal da Escola;',
        'cumprir as orientações dos professores e participar nas actividades escolares;',
        'conservar as instalações, o mobiliário e o material da Escola, respondendo o encarregado de educação pelos danos causados com dolo ou negligência;',
        'não trazer para a Escola armas, objectos perigosos, bebidas alcoólicas, tabaco ou outras drogas;',
        'apresentar-se com higiene e, quando exigido, com o uniforme da Escola.',
      ]),
      art('faltas', 'Assiduidade e justificação de faltas', `As faltas são justificadas por escrito pelo encarregado de educação, no prazo de ${horas} horas, junto do Director de Turma ou do professor da turma; passado esse prazo, a falta é considerada injustificada. ${fl ? `Ultrapassado o limite de ${fl} faltas injustificadas a uma disciplina, o encarregado de educação é convocado para definir, com o Director de Turma, medidas de recuperação.` : 'O excesso de faltas injustificadas é comunicado ao encarregado de educação, que é convocado para definir medidas de recuperação.'}`, `Absences are justified in writing by the parent within ${horas} hours; excessive absences lead to a meeting with the parent.`),
    ];
    if (v.uniforme) cap3.push(art('uniforme', 'Uniforme', `O uso do uniforme é obrigatório${str(v.uniformeDescricao) ? `, sendo composto por ${semPonto(v.uniformeDescricao).replace(/^(o|a)\s+/i, '')}` : ''}. A falta do uniforme por motivo económico é comunicada à Direcção, que procura solução com o encarregado de educação, não podendo o aluno ser impedido de assistir às aulas por esse motivo.`, 'Uniform is compulsory; a pupil who cannot afford it is not barred from class.'));
    cap3.push(
      art('telemoveis', 'Telemóveis e equipamentos', tel === 'proibido-total' ? 'Não é permitida a posse de telemóveis e outros equipamentos electrónicos no recinto escolar, salvo autorização da Direcção. Os equipamentos encontrados são entregues ao encarregado de educação.' : tel === 'pedagogico' ? 'Os telemóveis e outros equipamentos electrónicos só podem ser usados nas aulas para fins pedagógicos e com autorização do professor. Fora disso permanecem desligados e guardados.' : 'Durante as aulas, os telemóveis e outros equipamentos electrónicos permanecem desligados e guardados. O equipamento usado indevidamente é retido e entregue ao encarregado de educação.', 'Mobile phone rules.'),
      art('avaliacao', 'Avaliação', 'A avaliação dos alunos segue o Regulamento Geral de Avaliação em vigor para o respectivo nível de ensino. Os critérios e o calendário das provas são dados a conhecer aos alunos e aos encarregados de educação no início de cada período, e as classificações são comunicadas em boletim próprio.', 'Assessment follows the national assessment regulation; criteria and dates are announced; marks are reported.'),
    );
    const cap4: ClauseItem[] = [
      art('encarregados', 'Deveres dos encarregados de educação', 'O encarregado de educação deve:', 'Parents’ duties:', [
        'acompanhar a vida escolar do educando e comparecer às reuniões e convocatórias da Escola;',
        'justificar as faltas nos prazos fixados e manter actualizados os contactos;',
        'informar a Escola sobre doenças, alergias, medicação ou necessidades especiais do educando que exijam cuidados;',
        v.privada ? 'pagar pontualmente a matrícula, as propinas e os demais encargos acordados;' : 'colaborar com a Escola na educação do educando;',
        'respeitar os professores e o pessoal da Escola e resolver as divergências pelos canais próprios.',
      ]),
    ];
    if (v.privada) {
      cap4.push(art('propinas', 'Propinas', `As propinas referentes aos meses de ${semPonto(v.mesesPropina) || '____________________'} são pagas até ao dia ${dia ?? '____'} de cada mês, pelos valores da tabela anual em vigor.${multa ? ` O pagamento depois desse dia tem um agravamento de ${multa} por cento.` : ''} A falta de pagamento é tratada com o encarregado de educação, não podendo o aluno ser impedido de assistir às aulas ou de realizar provas, nem ser exposto perante os colegas, por esse motivo.`, 'Fees are due monthly per the yearly table; arrears are dealt with the parent, never by excluding or exposing the pupil.'));
    }
    const cap5: ClauseItem[] = [
      art('pessoal', 'Deveres dos professores e do pessoal', 'Os professores e o demais pessoal devem ser assíduos e pontuais, preparar as aulas e avaliar com rigor e imparcialidade, tratar os alunos com respeito, abster-se de qualquer castigo corporal, humilhação, assédio ou relação imprópria com alunos, e comunicar à Direcção os casos de suspeita de abuso ou violência contra uma criança.', 'Teachers’ and staff duties, including no corporal punishment and reporting suspected abuse.'),
    ];
    const cap6: ClauseItem[] = [
      art('infraccoes', 'Infracções', 'Constitui infracção disciplinar o comportamento do aluno que viole os deveres previstos neste regulamento, nomeadamente a falta de respeito, a agressão, o bullying, a fraude na avaliação, a danificação de bens e a posse de objectos ou substâncias proibidas.', 'Disciplinary offences.'),
      art('medidas', 'Medidas educativas e disciplinares', 'Conforme a gravidade, podem ser aplicadas as seguintes medidas, sempre com finalidade educativa:', 'Graduated measures:', [
        'advertência oral;',
        'repreensão registada, comunicada ao encarregado de educação;',
        'realização de tarefas de integração na Escola, compatíveis com a idade e sem carácter humilhante;',
        `suspensão da frequência até ${susp ?? '____'} ${susp === 1 ? 'dia lectivo' : 'dias lectivos'}, com plano de actividades;`,
        'transferência de escola, decidida pela Direcção ouvido o Conselho de Escola, apenas nos casos muito graves e assegurando a continuidade dos estudos.',
      ]),
      art('procedimento', 'Procedimento', 'As medidas previstas nas alíneas b) a e) do artigo anterior são precedidas de participação escrita da ocorrência e da audição do aluno e do encarregado de educação. A decisão é escrita e fundamentada e comunicada ao encarregado de educação, que dela pode reclamar para o Conselho de Escola.', 'Written report, hearing of pupil and parent, reasoned written decision, appeal to the School Council.'),
    ];
    const cap7: ClauseItem[] = [
      art('seguranca', 'Entradas, saídas e recolha dos alunos', v.recolhaAutorizada ? 'Os alunos menores só saem da Escola antes do fim das actividades, ou no fim do dia, com o encarregado de educação ou com pessoa por ele autorizada por escrito e identificada. A entrada de visitantes depende de identificação na portaria.' : 'A saída antecipada de alunos depende de autorização do encarregado de educação. A entrada de visitantes depende de identificação na portaria.', 'Pick-up only by the parent or an authorised person; visitors identify themselves.'),
      art('saude', 'Saúde', 'A Escola não administra medicamentos sem prescrição médica e autorização escrita do encarregado de educação. Em caso de doença ou acidente, a Escola presta os primeiros cuidados, contacta de imediato o encarregado de educação e, se necessário, encaminha o aluno para a unidade sanitária mais próxima.', 'Medicines only with prescription and written consent; first aid, parent contacted, referral if needed.'),
      art('protecao', 'Protecção contra a violência', 'Qualquer membro da comunidade escolar que tenha conhecimento de violência, abuso ou bullying contra um aluno comunica-o à Direcção, que toma as medidas de protecção necessárias e, quando a lei o exija, participa às autoridades competentes.', 'Duty to report violence or abuse; the school protects the child and informs the authorities when required.'),
    ];
    const cap8: ClauseItem[] = [
      art('revisao', 'Revisão e casos omissos', 'O presente regulamento pode ser revisto por proposta da Direcção ou do Conselho de Escola. Os casos omissos são resolvidos pela Direcção, ouvido o Conselho de Escola, de acordo com a legislação aplicável.', 'Revision and gaps.'),
      art('vigor', 'Entrada em vigor', `O presente regulamento foi aprovado pelo ${semPonto(v.aprovadoPor) || 'Conselho de Escola'} em ${dateLong(v.dataAprovacao)} e entra em vigor ${str(v.dataVigor) ? `em ${dateLong(v.dataVigor)}` : 'na data da sua aprovação'}.`, 'Approval and entry into force.'),
    ];
    const chapters: [string, ClauseItem[]][] = [
      ['CAPÍTULO I — Disposições gerais', cap1],
      ['CAPÍTULO II — Organização e funcionamento', cap2],
      ['CAPÍTULO III — Alunos', cap3],
      [v.privada ? 'CAPÍTULO IV — Encarregados de educação e propinas' : 'CAPÍTULO IV — Encarregados de educação', cap4],
      ['CAPÍTULO V — Professores e pessoal', cap5],
      ['CAPÍTULO VI — Regime disciplinar', cap6],
      ['CAPÍTULO VII — Segurança e saúde', cap7],
      ['CAPÍTULO VIII — Disposições finais', cap8],
    ];
    const blocks: Block[] = [{ type: 'title', text: 'Regulamento Interno', subtitle: escola }];
    let start = 1;
    for (const [h, items] of chapters) {
      blocks.push({ type: 'heading', text: h, align: 'center' }, { type: 'numberedClauses', style: 'artigo', items, start });
      start += items.length;
    }
    blocks.push({
      type: 'signatures',
      placeDate: `${str(v.local) || ctx.place}, ${dateLong(v.dataAprovacao)}`,
      columns: [{ role: papelCargo(str(v.assinanteCargo) || 'Director da Escola'), name: str(v.assinanteNome) || undefined, image: 'both' }],
    });
    return blocks;
  },
});

