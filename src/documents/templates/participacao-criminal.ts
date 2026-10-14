// Participação criminal (denúncia): anyone reports a public crime — one whose
// prosecution does not depend on the victim's complaint — to the Ministério
// Público, a PRM station or SERNIC. Public servants must report crimes they
// learn of in their duties. Distinct from the queixa-crime, which is the
// offended party's complaint for crimes that depend on it.

import {
  defineTemplate,
  type Block,
  type FieldDef,
  type Values,
  type Warning,
} from "../model";
import { cite, dateField, dateLong, l, localField, placeDate } from "./_shared";
import {
  FECHO_OPTIONS,
  artigos,
  documentosList,
  juntaText,
  linePara,
  papel,
  partyDesc,
  partyFields,
  testemunhasList,
} from "./_advocacia";
import {
  applicantDesc,
  applicantFields,
  autoridadeAddressee,
  autoridadeFields,
  endDot,
  noDot,
  optionalLawyerFields,
  partySignature,
  str,
  viaMandatario,
  keepTail,
} from "./_processo-penal";

const QUALIDADE_OPTIONS = [
  {
    value: "testemunha",
    label: l(
      "Vi ou sei dos factos (testemunha)",
      "I saw or know of the facts (witness)",
    ),
  },
  {
    value: "familiar",
    label: l("Familiar da vítima", "Relative of the victim"),
  },
  { value: "vitima", label: l("Sou a vítima", "I am the victim") },
  {
    value: "funcionario",
    label: l(
      "Funcionário público (no exercício de funções)",
      "Public servant (in the course of duties)",
    ),
  },
  {
    value: "entidade",
    label: l(
      "Responsável de uma empresa ou instituição",
      "Officer of a company or institution",
    ),
  },
  { value: "cidadao", label: l("Outro cidadão", "Other citizen") },
];

const QUALIDADE_TXT: Record<string, (v: Values) => string> = {
  testemunha: (v) =>
    `na qualidade de ${papel(v, "participante", "testemunha", "testemunha")} dos factos`,
  familiar: (v) =>
    `na qualidade de ${str(v.parentesco) || "familiar"} da vítima`,
  vitima: (v) =>
    `na qualidade de ${papel(v, "participante", "ofendido", "ofendida")}`,
  funcionario: (v) =>
    `na qualidade de ${str(v.funcionarioCargo) || "____________________"}${str(v.funcionarioEntidade) ? ` ${/^(o|a|os|as)\s/i.test(str(v.funcionarioEntidade)) ? "d" + str(v.funcionarioEntidade) : `de ${str(v.funcionarioEntidade)}`}` : ""}, tendo tomado conhecimento dos factos no exercício das suas funções e em cumprimento do dever legal de denúncia`,
  entidade: () =>
    "tendo tomado conhecimento dos factos no exercício da sua actividade",
  cidadao: () => "",
};

const conhecido = (v: Values) => v.denunciadoConhecido !== "nao";

export default defineTemplate({
  id: "participacao-criminal",
  family: "peca",
  official: "estado",
  letterhead: false,
  sections: [
    { id: "destino", title: l("A quem se apresenta", "Where it is filed") },
    {
      id: "participante",
      title: l("Quem participa (denunciante)", "Person reporting"),
      personRole: "cliente",
    },
    { id: "vitima", title: l("Vítima", "Victim") },
    { id: "denunciado", title: l("Suspeito", "Suspect"), personRole: "outro" },
    { id: "factos", title: l("Factos", "Facts") },
    { id: "prova", title: l("Prova e pedidos", "Evidence and requests") },
    { id: "advogado", title: l("Advogado (opcional)", "Lawyer (optional)") },
    { id: "documento", title: l("Local e data", "Place and date") },
  ],
  fields: [
    ...autoridadeFields("destino"),
    ...applicantFields("participante", "participante", {
      defaultTipo: "pessoa",
    }),
    {
      name: "qualidade",
      type: "select",
      section: "participante",
      label: l("Em que qualidade participa", "Capacity"),
      options: QUALIDADE_OPTIONS,
      default: "testemunha",
    },
    {
      name: "parentesco",
      type: "text",
      section: "participante",
      width: "half",
      label: l("Parentesco", "Relationship"),
      placeholder: l("Ex.: mãe; irmão; tio", "E.g. mother; brother"),
      showIf: (v) => v.qualidade === "familiar",
    },
    {
      name: "funcionarioCargo",
      type: "text",
      section: "participante",
      width: "half",
      label: l("Cargo", "Post"),
      placeholder: l(
        "Ex.: Director da Escola Primária de Malhangalene",
        "E.g. School Director",
      ),
      showIf: (v) => v.qualidade === "funcionario",
    },
    {
      name: "funcionarioEntidade",
      type: "text",
      section: "participante",
      width: "half",
      label: l("Serviço ou entidade (opcional)", "Service or body (optional)"),
      showIf: (v) => v.qualidade === "funcionario",
    },
    {
      name: "vitimaNome",
      type: "text",
      section: "vitima",
      label: l("Nome da vítima (se conhecido)", "Victim’s name (if known)"),
      showIf: (v) => v.qualidade !== "vitima",
      help: l(
        "Deixe vazio se a vítima for desconhecida ou se o crime atingir o Estado ou a comunidade (ex.: corrupção, peculato).",
        "Leave empty if unknown or if the crime harms the State or the community.",
      ),
    },
    {
      name: "vitimaDetalhe",
      type: "text",
      section: "vitima",
      label: l(
        "Outros dados da vítima (opcional)",
        "Other details of the victim (optional)",
      ),
      placeholder: l(
        "Ex.: menor de idade, aluna da Escola Primária de Chamanculo",
        "E.g. a child, pupil at the local school",
      ),
      showIf: (v) => v.qualidade !== "vitima",
    },
    {
      name: "denunciadoConhecido",
      type: "radio",
      section: "denunciado",
      label: l("Sabe quem praticou os factos?", "Do you know who did it?"),
      default: "sim",
      options: [
        { value: "sim", label: l("Sim", "Yes") },
        {
          value: "nao",
          label: l("Não (autores desconhecidos)", "No (unknown persons)"),
        },
      ],
    },
    ...partyFields("denunciado", "denunciado", { light: true }).map(
      (f): FieldDef => ({
        ...f,
        required: false,
        showIf: (v: Values) => conhecido(v) && (f.showIf ? f.showIf(v) : true),
      }),
    ),
    {
      name: "denunciadoSinais",
      type: "text",
      section: "denunciado",
      label: l(
        "Sinais que ajudem a identificar (opcional)",
        "Details that help identify (optional)",
      ),
      placeholder: l(
        "Ex.: homem jovem, alto, conduzia uma viatura Toyota Hiace branca, matrícula AAA 123 MC",
        "E.g. physical description, vehicle, plate",
      ),
    },
    {
      name: "dataFactos",
      type: "date",
      section: "factos",
      width: "half",
      label: l("Data dos factos", "Date of the events"),
    },
    {
      name: "horaFactos",
      type: "text",
      section: "factos",
      width: "half",
      label: l("Hora aproximada (opcional)", "Approximate time (optional)"),
      placeholder: l("Ex.: 22h00", "E.g. 22:00"),
    },
    {
      name: "localFactos",
      type: "text",
      section: "factos",
      label: l("Local dos factos", "Place of the events"),
      placeholder: l(
        "Ex.: Rua da Resistência, Bairro de Malhangalene, Maputo",
        "E.g. street and city",
      ),
    },
    {
      name: "factos",
      type: "textarea",
      section: "factos",
      rows: 8,
      required: true,
      label: l(
        "O que aconteceu (um artigo por linha)",
        "What happened (one article per line)",
      ),
      help: l(
        "Descreva por ordem: o que viu ou soube, quem fez o quê, como, e como teve conhecimento. Distinga o que viu do que lhe contaram. Só factos que conhece.",
        "Describe in order what you saw or learnt, who did what, how, and how you came to know. Separate what you saw from what you were told.",
      ),
    },
    {
      name: "crimeNome",
      type: "text",
      section: "factos",
      width: "half",
      label: l("Crime (opcional)", "Offence (optional)"),
      placeholder: l(
        "Ex.: roubo; corrupção; violência doméstica",
        "E.g. robbery; corruption",
      ),
    },
    {
      name: "crimeArtigo",
      type: "text",
      section: "factos",
      width: "half",
      label: l(
        "Artigo do Código Penal (opcional)",
        "Penal Code article (optional)",
      ),
      help: l(
        "Escreva como deve aparecer, ex.: «artigo … do Código Penal».",
        "Write it as it should appear.",
      ),
    },
    {
      name: "testemunhas",
      type: "textarea",
      section: "prova",
      rows: 3,
      label: l("Testemunhas (opcional)", "Witnesses (optional)"),
      help: l(
        "Uma por linha: nome, contacto e morada.",
        "One per line: name, contact and address.",
      ),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "prova",
      rows: 3,
      label: l(
        "Documentos ou objectos entregues (um por linha)",
        "Documents or items handed in (one per line)",
      ),
      placeholder: l(
        "Fotografias do local\nCópia da mensagem recebida",
        "Photos\nCopy of the message",
      ),
    },
    {
      name: "pedirCertificado",
      type: "toggle",
      section: "prova",
      default: true,
      label: l(
        "Pedir certificado do registo da participação",
        "Ask for a certificate that the report was registered",
      ),
    },
    {
      name: "reservaIdentidade",
      type: "toggle",
      section: "prova",
      label: l(
        "Pedir protecção e reserva da identidade",
        "Ask for protection and confidentiality of identity",
      ),
      help: l(
        "Para quem teme represálias. A autoridade decide se aplica medidas de protecção.",
        "For those who fear reprisals. The authority decides on protection measures.",
      ),
    },
    ...optionalLawyerFields(
      "advogado",
      l(
        "O advogado precisa de procuração.",
        "The lawyer needs a power of attorney.",
      ),
    ),
    localField("documento"),
    dateField("data", "documento"),
    {
      name: "fecho",
      type: "select",
      section: "documento",
      width: "half",
      label: l("Fecho", "Closing formula"),
      options: FECHO_OPTIONS,
      default: "Pede deferimento.",
    },
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: "info",
        field: "qualidade",
        message: l(
          "A participação serve para crimes públicos, que o Ministério Público investiga mesmo sem queixa da vítima (ex.: homicídio, roubo, corrupção, peculato, violência doméstica, crimes contra menores). Se é a vítima de um crime que depende de queixa (ex.: injúria, dano), use «Queixa-crime». Na dúvida, apresente: o Ministério Público qualifica os factos.",
          "Use this for public crimes, which the Prosecutor investigates without a complaint. If you are the victim of an offence that requires a complaint, use “Queixa-crime”.",
        ),
      },
      {
        level: "warning",
        message: l(
          `Descreva apenas factos verdadeiros. Acusar alguém de um crime sabendo que é falso é crime de denúncia caluniosa (${cite("ppDenunciaCaluniosa")}).`,
          "Describe only true facts. Knowingly accusing someone falsely is a crime.",
        ),
      },
      {
        level: "info",
        message: l(
          "Entregue o original e guarde uma cópia com o carimbo de entrada. Pode ser chamado a prestar declarações.",
          "Hand in the original and keep a copy with the receipt stamp. You may be called to give a statement.",
        ),
      },
    ];
    if (v.qualidade === "funcionario") {
      w.push({
        level: "info",
        field: "qualidade",
        message: l(
          `Os funcionários são obrigados a denunciar os crimes de que tomem conhecimento no exercício das suas funções (${cite("ppDenuncia")}).`,
          "Public servants must report crimes they learn of in the course of their duties.",
        ),
      });
    }
    if (v.reservaIdentidade) {
      w.push({
        level: "info",
        field: "reservaIdentidade",
        message: l(
          `As medidas de protecção de denunciantes e testemunhas estão previstas na ${cite("ppProtecaoDenunciantes")}; a decisão cabe às autoridades.`,
          "Protection measures for whistleblowers and witnesses exist by law; the authorities decide.",
        ),
      });
    }
    if (!str(v.dataFactos) && !str(v.localFactos)) {
      w.push({
        level: "warning",
        field: "dataFactos",
        message: l(
          "Indique, pelo menos aproximadamente, quando e onde os factos ocorreram.",
          "State, at least roughly, when and where it happened.",
        ),
      });
    }
    return w;
  },

  personName: (v) => v.participanteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const sabe = conhecido(v);
    const oParticipante = papel(
      v,
      "participante",
      "O Participante",
      "A Participante",
    );
    const qualidade = (QUALIDADE_TXT[v.qualidade] ?? QUALIDADE_TXT.cidadao)(v);
    const quando = [
      v.dataFactos ? `no dia ${dateLong(v.dataFactos)}` : "",
      str(v.horaFactos) ? `cerca das ${str(v.horaFactos)}` : "",
      str(v.localFactos) ? `em ${noDot(str(v.localFactos))}` : "",
    ].filter(Boolean);
    const vitimaNome = str(v.vitimaNome);
    const vitimaDet = str(v.vitimaDetalhe);
    const vitima =
      v.qualidade !== "vitima" && (vitimaNome || vitimaDet)
        ? [
            `É vítima dos factos ${vitimaNome ? `**${vitimaNome.toLocaleUpperCase("pt")}**` : "a pessoa adiante referida"}${vitimaDet ? `, ${noDot(vitimaDet)}` : ""}.`,
          ]
        : [];
    const sinais = str(v.denunciadoSinais);
    const factos = [
      ...(quando.length
        ? [
            `Os factos que a seguir se descrevem ocorreram ${quando.join(", ")}.`,
          ]
        : []),
      ...vitima,
      ...artigos(v.factos),
      ...(sinais
        ? [
            `Para a identificação ${sabe ? "do suspeito" : "dos autores"}, ${papel(v, "participante", "o participante", "a participante")} indica os seguintes sinais: ${endDot(sinais)}`,
          ]
        : []),
    ];
    const crime = str(v.crimeNome);
    const artigo = str(v.crimeArtigo);
    const direito = [
      crime
        ? `Os factos descritos são susceptíveis de integrar a prática do crime de ${crime}${artigo ? `, previsto e punido pelo ${artigo.replace(/^(o|pelo)\s+/i, "")}` : ""}, sem prejuízo de outra qualificação que o Ministério Público venha a dar-lhes.`
        : "Os factos descritos são susceptíveis de integrar a prática de crime, cuja qualificação jurídica caberá ao Ministério Público.",
      "Tratando-se de crime cujo procedimento não depende de queixa, compete ao Ministério Público promover o respectivo processo, logo que tenha notícia dele.",
    ];
    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);
    const pedidos = [
      `Se digne mandar registar a presente participação e instaurar o competente processo-crime contra ${sabe ? papel(v, "denunciado", "o denunciado", "a denunciada") : "os autores dos factos"}`,
      `Sejam ordenadas as diligências necessárias à descoberta da verdade${testemunhas.length ? ", designadamente a inquirição das testemunhas abaixo indicadas" : ""}${docs.length ? `${testemunhas.length ? " e" : ", designadamente"} o exame dos documentos e objectos entregues` : ""}`,
      ...(v.pedirCertificado
        ? [
            `Seja passado ${oParticipante === "A Participante" ? "à participante" : "ao participante"} certificado do registo da presente participação`,
          ]
        : []),
      ...(v.reservaIdentidade
        ? [
            `Seja mantida reservada a identidade ${oParticipante === "A Participante" ? "da participante" : "do participante"} e aplicadas as medidas de protecção que se mostrem adequadas, por temer represálias`,
          ]
        : []),
    ];
    const pedidosFmt = pedidos.map(
      (p, i) => `${p}${i === pedidos.length - 1 ? "." : ";"}`,
    );

    const blocks: Block[] = [
      {
        type: "courtHeader",
        addressee: autoridadeAddressee(v).toLocaleUpperCase("pt"),
      },
      {
        type: "paragraph",
        id: "participante",
        text: `${applicantDesc(v, "participante", { docBlank: true })}${qualidade ? `, ${qualidade}` : ""}, vem${viaMandatario(v)} apresentar`,
        en: "The person identified above files a",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: "**PARTICIPAÇÃO CRIMINAL**",
        en: "CRIMINAL REPORT",
      },
      {
        type: "paragraph",
        id: "contra",
        text: sabe
          ? `contra ${partyDesc(v, "denunciado")}, pelos factos e fundamentos seguintes:`
          : "contra desconhecidos, pelos factos e fundamentos seguintes:",
        en: "against the person named (or unknown persons), on the following facts and grounds:",
      },
      {
        type: "articulado",
        sections: [
          {
            heading: "I — Dos factos",
            items: factos.length ? factos : ["____________________"],
          },
          { heading: "II — Do direito", items: direito },
        ],
      },
      {
        type: "paragraph",
        id: "pedido",
        text: "Nestes termos, requer a V. Ex.ª que:",
        en: "The person reporting therefore asks that:",
        keepWithNext: true,
      },
      { type: "list", style: "alpha", items: pedidosFmt },
      {
        type: "paragraph",
        id: "disponibilidade",
        text: `${oParticipante} declara que está disponível para prestar declarações e fornecer outros elementos de que venha a ter conhecimento.`,
        en: "The person reporting is available to give a statement and further information.",
        keepWithNext: !testemunhas.length && !docs.length,
      },
    ];
    if (testemunhas.length) {
      blocks.push(
        {
          type: "paragraph",
          id: "rol",
          text: "**Testemunhas:**",
          en: "Witnesses:",
          keepWithNext: true,
        },
        {
          type: "list",
          style: "numeric",
          items: testemunhas,
          keepWithNext: !docs.length,
        },
      );
    }
    if (docs.length)
      blocks.push(
        linePara(
          "junta",
          "Junta",
          `${juntaText({ documentos: docs.length, duplicados: false })}.`,
          "Attached documents.",
          true,
        ),
      );
    blocks.push({
      type: "paragraph",
      id: "fecho",
      text: String(v.fecho || "Pede deferimento."),
      en: "Closing formula.",
      keepWithNext: true,
    });
    blocks.push({
      type: "signatures",
      placeDate: placeDate(ctx, v.data),
      columns: [partySignature(v, "participante", oParticipante)],
    });
    if (docs.length)
      blocks.push({
        type: "annexList",
        title: "Documentos e objectos entregues",
        items: docs,
      });
    blocks.push({
      type: "box",
      label: "Para uso dos serviços — registo de entrada",
      text: "N.º ______________   Data ____/____/________   Recebido por ______________________________",
      dashed: true,
    });
    return keepTail(blocks, "pedido");
  },
});
