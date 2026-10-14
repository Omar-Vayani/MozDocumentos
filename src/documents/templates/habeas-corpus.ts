// Petição de habeas corpus: the detainee, or anyone on the detainee's behalf,
// asks the court for immediate release from an unlawful arrest or detention.
// Unlawful arrest (detenção) goes to the investigating judge; unlawful
// imprisonment ordered by a judge (prisão) to the higher court.

import {
  defineTemplate,
  type Block,
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
} from "./_advocacia";
import {
  applicantDesc,
  applicantFields,
  deLocal,
  optionalLawyerFields,
  partySignature,
  str,
  viaMandatario,
  keepTail,
} from "./_processo-penal";

const FUNDAMENTOS: Record<string, string> = {
  incompetente: "ter sido efectuada ou ordenada por entidade incompetente",
  facto: "ser motivada por facto pelo qual a lei a não permite",
  prazo:
    "manter-se para além dos prazos fixados pela lei ou por decisão judicial",
  apresentacao:
    "não ter sido o detido apresentado ao juiz no prazo legal, para validação e interrogatório",
};

const SUPERIOR_OPTIONS = [
  {
    value: "tsr",
    label: l("Tribunal Superior de Recurso", "Higher Court of Appeal"),
  },
  { value: "ts", label: l("Tribunal Supremo", "Supreme Court") },
];

const proprio = (v: Values) => v.requerentePapel !== "terceiro";

function addressee(v: Values): string {
  if (v.modalidade === "prisao") {
    if (v.superior === "ts")
      return "Venerando Juiz Conselheiro Presidente do Tribunal Supremo";
    const t = str(v.tribunalSuperior);
    return `Venerando Juiz Desembargador Presidente do Tribunal Superior de Recurso ${t ? deLocal(t) : "de ____________________"}`;
  }
  const t = str(v.tribunal);
  return `Exmo. Senhor Juiz de Instrução Criminal ${t ? deLocal(t) : "do Tribunal Judicial de ____________________"}`;
}

export default defineTemplate({
  id: "habeas-corpus",
  family: "peca",
  official: "tribunal",
  letterhead: false,
  sections: [
    { id: "tribunal", title: l("Tribunal", "Court") },
    {
      id: "requerente",
      title: l("Quem pede", "Applicant"),
      personRole: "cliente",
    },
    {
      id: "detido",
      title: l("Pessoa detida ou presa", "Person detained"),
      personRole: "outro",
    },
    {
      id: "factos",
      title: l("Detenção e fundamentos", "Detention and grounds"),
    },
    { id: "advogado", title: l("Advogado (opcional)", "Lawyer (optional)") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    {
      name: "modalidade",
      type: "radio",
      section: "tribunal",
      label: l("Situação", "Situation"),
      default: "detencao",
      options: [
        {
          value: "detencao",
          label: l(
            "Detenção ilegal (pela polícia, sem decisão de juiz)",
            "Unlawful arrest (police, no judge’s order)",
          ),
        },
        {
          value: "prisao",
          label: l(
            "Prisão ilegal (prisão preventiva ou pena ordenada por juiz)",
            "Unlawful imprisonment (ordered by a judge)",
          ),
        },
      ],
    },
    {
      name: "tribunal",
      type: "text",
      section: "tribunal",
      label: l("Tribunal", "Court"),
      default: "Tribunal Judicial da Cidade de Maputo",
      showIf: (v) => v.modalidade !== "prisao",
    },
    {
      name: "superior",
      type: "select",
      section: "tribunal",
      width: "half",
      label: l("Tribunal superior", "Higher court"),
      options: SUPERIOR_OPTIONS,
      default: "tsr",
      showIf: (v) => v.modalidade === "prisao",
      help: l(
        "Confirme a competência: depende do tribunal que ordenou a prisão.",
        "Check which court is competent: it depends on the court that ordered the imprisonment.",
      ),
    },
    {
      name: "tribunalSuperior",
      type: "text",
      section: "tribunal",
      width: "half",
      label: l("Sede", "Seat"),
      default: "Maputo",
      showIf: (v) => v.modalidade === "prisao" && v.superior !== "ts",
    },
    {
      name: "processoNumero",
      type: "text",
      section: "tribunal",
      width: "half",
      label: l("Processo n.º (se houver)", "Case no. (if any)"),
    },
    {
      name: "requerentePapel",
      type: "radio",
      section: "requerente",
      label: l("Quem pede", "Who applies"),
      default: "terceiro",
      options: [
        { value: "proprio", label: l("O próprio detido", "The detainee") },
        {
          value: "terceiro",
          label: l(
            "Outra pessoa (familiar, amigo, advogado)",
            "Someone else (relative, friend, lawyer)",
          ),
        },
      ],
    },
    ...applicantFields("requerente", "requerente", { noEmpresa: true }).map(
      (f) => ({
        ...f,
        showIf: (v: Values) => !proprio(v) && (f.showIf ? f.showIf(v) : true),
      }),
    ),
    {
      name: "relacao",
      type: "text",
      section: "requerente",
      width: "half",
      label: l("Relação com o detido (opcional)", "Relationship (optional)"),
      placeholder: l("Ex.: irmão; esposa", "E.g. brother; wife"),
      showIf: (v) => !proprio(v),
    },
    ...partyFields("detido", "detido").filter(
      (f) => !/(Tipo|Nuel|Representante|Nuit)$/.test(f.name),
    ),
    {
      name: "dataDetencao",
      type: "date",
      section: "factos",
      width: "half",
      required: true,
      label: l("Data da detenção", "Date of arrest"),
    },
    {
      name: "horaDetencao",
      type: "text",
      section: "factos",
      width: "half",
      label: l("Hora (opcional)", "Time (optional)"),
      placeholder: l("Ex.: 6h30", "E.g. 6:30"),
    },
    {
      name: "entidade",
      type: "text",
      section: "factos",
      label: l("Quem deteve", "Who arrested"),
      placeholder: l(
        "Ex.: agentes da 7.ª Esquadra da PRM da Cidade de Maputo",
        "E.g. officers of the 7th PRM station",
      ),
    },
    {
      name: "localDetencao",
      type: "text",
      section: "factos",
      label: l("Onde está detido", "Where held"),
      placeholder: l(
        "Ex.: nas celas da 7.ª Esquadra da PRM, Bairro do Aeroporto",
        "E.g. in the cells of the 7th PRM station",
      ),
    },
    {
      name: "motivoInvocado",
      type: "text",
      section: "factos",
      label: l("Motivo invocado (se conhecido)", "Reason given (if known)"),
      placeholder: l(
        "Ex.: suspeita de furto de telemóvel",
        "E.g. suspected phone theft",
      ),
    },
    {
      name: "fundamentos",
      type: "select",
      section: "factos",
      label: l("Fundamento principal", "Main ground"),
      default: "prazo",
      options: [
        {
          value: "incompetente",
          label: l(
            "Ordenada por entidade incompetente",
            "Ordered by an incompetent authority",
          ),
        },
        {
          value: "facto",
          label: l(
            "Por facto que não permite prisão",
            "For a fact that does not allow imprisonment",
          ),
        },
        {
          value: "prazo",
          label: l("Mantida além dos prazos", "Held beyond the time limits"),
        },
        {
          value: "apresentacao",
          label: l(
            "Não presente ao juiz no prazo legal",
            "Not brought before a judge in time",
          ),
        },
      ],
    },
    {
      name: "factos",
      type: "textarea",
      section: "factos",
      rows: 6,
      label: l("Factos (um artigo por linha)", "Facts (one article per line)"),
      help: l(
        "O que aconteceu desde a detenção: se foi ouvido por juiz, se há mandado, há quanto tempo está preso, pedidos já feitos.",
        "What happened since the arrest: whether heard by a judge, any warrant, how long held.",
      ),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "factos",
      rows: 2,
      label: l(
        "Documentos juntos (um por linha, opcional)",
        "Documents attached (optional)",
      ),
    },
    ...optionalLawyerFields("advogado"),
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

  warnings: (_v, ctx) => {
    const h = ctx.legal.value<{ decisaoDias: number }>("ppHabeasCorpus");
    const w: Warning[] = [
      {
        level: "info",
        message: l(
          `O habeas corpus pode ser pedido pelo próprio ou por qualquer cidadão em seu favor e deve ser decidido em ${h.decisaoDias} dias (${cite("ppHabeasCorpus")}). A detenção ilegal é apreciada pelo juiz de instrução; a prisão ilegal pelo tribunal superior. Confirme a competência antes de entregar.`,
          `Habeas corpus may be requested by the detainee or anyone on their behalf and must be decided within ${h.decisaoDias} days. Check which court is competent.`,
        ),
      },
      {
        level: "info",
        message: l(
          "Entregue com urgência na secretaria do tribunal e guarde a cópia com o carimbo de entrada.",
          "File urgently at the court office and keep the stamped copy.",
        ),
      },
    ];
    return w;
  },

  personName: (v) => v.detidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const detF = papel(v, "detido", "M", "F") === "F";
    const prisao = v.modalidade === "prisao";
    const det = prisao
      ? detF
        ? "presa"
        : "preso"
      : detF
        ? "detida"
        : "detido";
    const nomeDet = `**${(str(v.detidoNome) || "____________________").toLocaleUpperCase("pt")}**`;
    const relacao = str(v.relacao);
    const intro = proprio(v)
      ? `${partyDesc(v, "detido", { docBlank: true })}, actualmente ${det}${str(v.localDetencao) ? ` ${/^(n[oa]s?|em)\s/i.test(str(v.localDetencao)) ? "" : "em "}${str(v.localDetencao).replace(/[.;]$/, "")}` : ""}, vem${viaMandatario(v)} requerer, em seu favor, a providência de`
      : `${applicantDesc(v, "requerente", { docBlank: true })}${relacao ? `, ${relacao} ${detF ? "da beneficiária adiante identificada" : "do beneficiário adiante identificado"}` : ""}, vem${viaMandatario(v)} requerer, em favor de ${partyDesc(v, "detido")}, actualmente ${det}${str(v.localDetencao) ? ` ${/^(n[oa]s?|em)\s/i.test(str(v.localDetencao)) ? "" : "em "}${str(v.localDetencao).replace(/[.;]$/, "")}` : ""}, a providência de`;
    const factos = [
      `${nomeDet} foi ${detF ? "detida" : "detido"} no dia ${dateLong(v.dataDetencao)}${str(v.horaDetencao) ? `, cerca das ${str(v.horaDetencao)}` : ""}${str(v.entidade) ? `, por ${str(v.entidade).replace(/[.;]$/, "")}` : ""}.`,
      ...(str(v.motivoInvocado)
        ? [
            `O motivo invocado para a ${prisao ? "prisão" : "detenção"} foi ${str(v.motivoInvocado).replace(/[.;]$/, "")}.`,
          ]
        : []),
      ...artigos(v.factos),
    ];
    const fundamento = FUNDAMENTOS[v.fundamentos] ?? FUNDAMENTOS.prazo;
    const direito = [
      `A ${prisao ? "prisão" : "detenção"} ${detF ? "da beneficiária" : "do beneficiário"} é ilegal, por ${fundamento}.`,
      `A qualquer pessoa ilegalmente presa ou detida é garantido o direito à providência de habeas corpus, a decidir no prazo constitucional (${cite("ppHabeasCorpus")}).`,
    ];
    const docs = documentosList(v.documentos);
    const blocks: Block[] = [
      {
        type: "courtHeader",
        processo: str(v.processoNumero) || undefined,
        addressee: addressee(v).toLocaleUpperCase("pt"),
      },
      {
        type: "paragraph",
        id: "requerente",
        text: intro,
        en: "The applicant requests, on behalf of the person detained, a writ of",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: `**HABEAS CORPUS**\npor ${prisao ? "prisão" : "detenção"} ilegal,`,
        en: "HABEAS CORPUS for unlawful detention,",
      },
      {
        type: "paragraph",
        id: "fundamentos",
        text: "nos termos e com os fundamentos seguintes:",
        en: "on the following grounds:",
      },
      {
        type: "articulado",
        sections: [
          { heading: "I — Dos factos", items: factos },
          { heading: "II — Do direito", items: direito },
        ],
      },
      {
        type: "paragraph",
        id: "pedido",
        text: `Nestes termos, requer a V. Ex.ª se digne, com a urgência que o caso impõe, ordenar a apresentação ${detF ? "da beneficiária" : "do beneficiário"} e a prestação de informação pela entidade à ordem da qual se encontra ${det}, declarar ilegal a ${prisao ? "prisão" : "detenção"} e ordenar a sua imediata libertação.`,
        en: "The applicant asks the court to declare the detention unlawful and order immediate release.",
      },
    ];
    if (docs.length)
      blocks.push(
        linePara(
          "junta",
          "Junta",
          `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length, duplicados: false })}.`,
          "Attached documents.",
          true,
        ),
      );
    blocks.push(
      {
        type: "paragraph",
        id: "fecho",
        text: String(v.fecho || "Pede deferimento."),
        en: "Closing formula.",
        keepWithNext: true,
      },
      {
        type: "signatures",
        placeDate: placeDate(ctx, v.data),
        columns: [
          proprio(v)
            ? partySignature(
                v,
                "detido",
                detF ? "A Requerente" : "O Requerente",
              )
            : partySignature(
                v,
                "requerente",
                papel(v, "requerente", "O Requerente", "A Requerente"),
              ),
        ],
      },
    );
    if (docs.length)
      blocks.push({
        type: "annexList",
        title: "Documentos juntos",
        items: docs,
      });
    return keepTail(blocks, "pedido");
  },
});
