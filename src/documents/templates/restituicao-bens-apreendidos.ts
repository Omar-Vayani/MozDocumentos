// Requerimento de restituição de bens apreendidos: the owner (accused, victim
// or a third party) asks the Ministério Público or the judge to return items
// seized in a criminal case — vehicle, phone, money, documents — once they are
// no longer needed as evidence.

import {
  defineTemplate,
  type Block,
  type Values,
  type Warning,
} from "../model";
import {
  cite,
  dateField,
  dateLong,
  formatMoney,
  l,
  lineItems,
  localField,
  money,
  placeDate,
} from "./_shared";
import {
  FECHO_OPTIONS,
  artigos,
  documentosList,
  juntaText,
  linePara,
  papel,
} from "./_advocacia";
import {
  applicantDesc,
  applicantFields,
  faseValue,
  nosAutos,
  optionalLawyerFields,
  partySignature,
  penalAddressee,
  penalCaseFields,
  str,
  viaMandatario,
  keepTail,
} from "./_processo-penal";

type Bem = { descricao?: string; identificacao?: string; valor?: string };

function bens(v: Values) {
  return (lineItems(v.bens) as Bem[])
    .map((b) => ({
      descricao: str(b.descricao),
      identificacao: str(b.identificacao),
      valor: money(b.valor),
    }))
    .filter((b) => b.descricao);
}

const QUALIDADE_OPTIONS = [
  { value: "arguido", label: l("Arguido", "Accused") },
  {
    value: "ofendido",
    label: l(
      "Ofendido (os bens foram-me tirados)",
      "Victim (the items were taken from me)",
    ),
  },
  {
    value: "terceiro",
    label: l("Terceiro proprietário (não sou parte)", "Third-party owner"),
  },
];

export default defineTemplate({
  id: "restituicao-bens-apreendidos",
  family: "peca",
  official: (v) => (v.fase === "mp" ? "estado" : "tribunal"),
  letterhead: false,
  sections: [
    { id: "processo", title: l("Processo", "Case") },
    {
      id: "requerente",
      title: l("Quem pede", "Applicant"),
      personRole: "cliente",
    },
    { id: "bens", title: l("Bens apreendidos", "Seized items") },
    { id: "advogado", title: l("Advogado (opcional)", "Lawyer (optional)") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    ...penalCaseFields("processo"),
    ...applicantFields("requerente", "requerente"),
    {
      name: "qualidade",
      type: "select",
      section: "requerente",
      label: l("Qualidade", "Capacity"),
      options: QUALIDADE_OPTIONS,
      default: "terceiro",
    },
    {
      name: "dataApreensao",
      type: "date",
      section: "bens",
      width: "half",
      label: l("Data da apreensão", "Date of seizure"),
    },
    {
      name: "entidade",
      type: "text",
      section: "bens",
      width: "half",
      label: l("Quem apreendeu (opcional)", "Seized by (optional)"),
      placeholder: l(
        "Ex.: o SERNIC da Cidade de Maputo",
        "E.g. the SERNIC in Maputo",
      ),
    },
    {
      name: "bens",
      type: "lines",
      section: "bens",
      label: l("Bens", "Items"),
      addLabel: l("Acrescentar bem", "Add item"),
      columns: [
        {
          name: "descricao",
          type: "text",
          label: l("Bem", "Item"),
          placeholder: l(
            "Ex.: viatura Toyota Corolla",
            "E.g. Toyota Corolla car",
          ),
        },
        {
          name: "identificacao",
          type: "text",
          label: l("Identificação", "Identification"),
          placeholder: l(
            "Ex.: matrícula AFG 123 MP",
            "E.g. plate number, IMEI",
          ),
        },
        {
          name: "valor",
          type: "money",
          label: l("Valor (opcional)", "Value (optional)"),
        },
      ],
      default: [{ descricao: "", identificacao: "", valor: "" }],
    },
    {
      name: "titulo",
      type: "text",
      section: "bens",
      label: l("Prova da propriedade", "Proof of ownership"),
      placeholder: l(
        "Ex.: livrete e título de propriedade em nome do requerente",
        "E.g. registration in the applicant’s name",
      ),
    },
    {
      name: "fundamentos",
      type: "textarea",
      section: "bens",
      rows: 4,
      label: l(
        "Outros fundamentos (um artigo por linha)",
        "Other grounds (one article per line)",
      ),
      help: l(
        "Ex.: os bens já foram examinados; não têm relação com o crime; são o instrumento de trabalho do requerente.",
        "E.g. already examined; unrelated to the crime; needed for work.",
      ),
    },
    {
      name: "fielDepositario",
      type: "toggle",
      section: "bens",
      label: l(
        "Aceitar ficar como fiel depositário",
        "Offer to hold the items as custodian",
      ),
      help: l(
        "Se o tribunal ainda precisar dos bens, pode entregá-los ao dono como fiel depositário, obrigado a apresentá-los quando pedido.",
        "If still needed, the court may hand them to the owner as custodian.",
      ),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "bens",
      rows: 3,
      label: l(
        "Documentos juntos (um por linha)",
        "Documents attached (one per line)",
      ),
      placeholder: l(
        "Livrete da viatura\nTítulo de propriedade\nAuto de apreensão",
        "Vehicle registration\nTitle\nSeizure record",
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

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: "info",
        message: l(
          `Os objectos apreendidos são restituídos logo que deixem de ser necessários como prova, salvo se puderem ser declarados perdidos a favor do Estado (${cite("ppApreensao")}). Junte prova de que é o dono.`,
          "Seized items are returned once no longer needed as evidence, unless they may be forfeited. Attach proof of ownership.",
        ),
      },
    ];
    if (bens(v).length === 0)
      w.push({
        level: "warning",
        field: "bens",
        message: l(
          "Indique os bens cuja restituição pede.",
          "List the items to be returned.",
        ),
      });
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v);
    const OR = papel(v, "requerente", "O requerente", "A requerente");
    const b = bens(v);
    const qual: Record<string, string> = {
      arguido: papel(v, "requerente", "arguido", "arguida"),
      ofendido: papel(v, "requerente", "ofendido", "ofendida"),
      terceiro: "terceiro interessado",
    };
    const factos = [
      str(v.entidade)
        ? `${v.dataApreensao ? `Em ${dateLong(v.dataApreensao)}, ${str(v.entidade).replace(/[.;]$/, "")}` : `${str(v.entidade).charAt(0).toUpperCase()}${str(v.entidade).slice(1).replace(/[.;]$/, "")}`} apreendeu, no âmbito dos presentes autos, os bens a seguir identificados.`
        : `${v.dataApreensao ? `Em ${dateLong(v.dataApreensao)}, foram` : "Foram"} apreendidos, no âmbito dos presentes autos, os bens a seguir identificados.`,
      `${OR} é ${papel(v, "requerente", "o legítimo proprietário", "a legítima proprietária")} desses bens${str(v.titulo) ? `, como prova ${str(v.titulo).replace(/[.;]$/, "")}` : ""}.`,
      ...(v.qualidade === "terceiro"
        ? [
            `${OR} não é ${papel(v, "requerente", "arguido", "arguida")} nos autos nem teve qualquer intervenção nos factos investigados.`,
          ]
        : []),
      ...(v.qualidade === "ofendido"
        ? [
            `Os bens foram retirados ${papel(v, "requerente", "ao requerente", "à requerente")} pela prática do crime investigado, devendo ser-lhe restituídos.`,
          ]
        : []),
      ...artigos(v.fundamentos),
      "A manutenção da apreensão deixou de ser necessária para efeitos de prova e os bens não são susceptíveis de ser declarados perdidos a favor do Estado.",
    ];
    const docs = documentosList(v.documentos);
    const blocks: Block[] = [
      {
        type: "courtHeader",
        processo: str(v.processoNumero) || "________/______",
        extra: fase !== "mp" ? str(v.seccao) || undefined : undefined,
        addressee: penalAddressee(v, fase),
      },
      {
        type: "paragraph",
        id: "requerente",
        text: `${applicantDesc(v, "requerente")}, ${qual[v.qualidade] ?? qual.terceiro} ${nosAutos(v)}, vem${viaMandatario(v)} requerer a`,
        en: "The applicant requests the",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: "**RESTITUIÇÃO DE BENS APREENDIDOS**,",
        en: "RETURN OF SEIZED PROPERTY,",
      },
      {
        type: "paragraph",
        id: "fundamentos",
        text: "nos termos e com os fundamentos seguintes:",
        en: "on the following grounds:",
      },
      { type: "articulado", sections: [{ items: factos }] },
    ];
    if (b.length) {
      blocks.push({
        type: "table",
        caption: "Bens cuja restituição se requer",
        columns: [
          { label: "Bem", width: 4 },
          { label: "Identificação", width: 4 },
          { label: "Valor", width: 2, align: "right" },
        ],
        rows: b.map((x) => [
          x.descricao,
          x.identificacao || "—",
          x.valor != null ? formatMoney(x.valor) : "—",
        ]),
      });
    }
    blocks.push({
      type: "paragraph",
      id: "pedido",
      text: `Nestes termos, requer a V. Ex.ª se digne ordenar a restituição ${papel(v, "requerente", "ao requerente", "à requerente")} dos bens acima identificados, levantando-se a apreensão${v.fielDepositario ? `, ou, caso ainda sejam necessários ao processo, a sua entrega ${papel(v, "requerente", "ao requerente", "à requerente")} na qualidade de ${papel(v, "requerente", "fiel depositário", "fiel depositária")}, com a obrigação de os apresentar sempre que lhe for ordenado` : ""}.`,
      en: "The applicant asks for the items to be returned (or entrusted to the applicant as custodian).",
    });
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
          partySignature(
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
