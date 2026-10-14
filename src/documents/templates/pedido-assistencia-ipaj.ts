// Pedido de assistência jurídica ao IPAJ: a person without means asks the
// Instituto do Patrocínio e Assistência Jurídica for free legal advice or
// representation in a court case (criminal defence, labour, family, land…).

import { defineTemplate, type Block, type Warning } from "../model";
import { cite, dateField, dateLong, l, localField, moneyText } from "./_shared";
import { artigos, documentosList, papel } from "./_advocacia";
import {
  applicantDesc,
  applicantFields,
  str,
  keepTail,
} from "./_processo-penal";

const TIPO_OPTIONS = [
  {
    value: "patrocinio",
    label: l("Patrocínio num processo em tribunal", "Representation in court"),
  },
  {
    value: "defesa",
    label: l(
      "Defesa num processo-crime (sou arguido)",
      "Criminal defence (I am accused)",
    ),
  },
  {
    value: "consulta",
    label: l("Consulta e aconselhamento jurídico", "Legal advice"),
  },
];

const TIPO_TXT: Record<string, string> = {
  patrocinio: "o patrocínio judiciário gratuito",
  defesa: "a nomeação de defensor e o patrocínio gratuito na sua defesa",
  consulta: "a prestação de consulta e assistência jurídica gratuita",
};

export default defineTemplate({
  id: "pedido-assistencia-ipaj",
  family: "carta",
  official: "estado",
  letterhead: false,
  sections: [
    { id: "destino", title: l("Delegação do IPAJ", "IPAJ office") },
    {
      id: "requerente",
      title: l("Requerente", "Applicant"),
      personRole: "cliente",
    },
    { id: "pedido", title: l("O que pede", "Request") },
    { id: "meios", title: l("Situação económica", "Financial situation") },
    { id: "documento", title: l("Local e data", "Place and date") },
  ],
  fields: [
    {
      name: "delegacao",
      type: "text",
      section: "destino",
      label: l("Delegação", "Office"),
      default: "Cidade de Maputo",
      placeholder: l(
        "Ex.: Província de Nampula; Distrito de Chókwè",
        "E.g. Nampula Province",
      ),
    },
    ...applicantFields("requerente", "requerente", { noEmpresa: true }),
    {
      name: "tipo",
      type: "select",
      section: "pedido",
      label: l("Tipo de apoio", "Type of help"),
      options: TIPO_OPTIONS,
      default: "patrocinio",
    },
    {
      name: "materia",
      type: "text",
      section: "pedido",
      required: true,
      label: l("Assunto", "Matter"),
      placeholder: l(
        "Ex.: despedimento sem justa causa pela empresa onde trabalhava",
        "E.g. unfair dismissal",
      ),
    },
    {
      name: "processo",
      type: "text",
      section: "pedido",
      label: l("Processo em tribunal (se houver)", "Court case (if any)"),
      placeholder: l(
        "Ex.: processo n.º 245/2026, 2.ª Secção do Tribunal Judicial do Distrito de KaMpfumo",
        "E.g. case no. 245/2026",
      ),
    },
    {
      name: "parteContraria",
      type: "text",
      section: "pedido",
      label: l("Parte contrária (opcional)", "Other party (optional)"),
    },
    {
      name: "factos",
      type: "textarea",
      section: "pedido",
      rows: 5,
      label: l(
        "Resumo do problema (um ponto por linha)",
        "Summary of the problem (one point per line)",
      ),
    },
    {
      name: "ocupacao",
      type: "text",
      section: "meios",
      width: "half",
      label: l("Ocupação", "Occupation"),
      placeholder: l(
        "Ex.: desempregado; vendedor no mercado",
        "E.g. unemployed; market vendor",
      ),
    },
    {
      name: "rendimento",
      type: "money",
      section: "meios",
      width: "half",
      label: l("Rendimento mensal do agregado", "Monthly household income"),
    },
    {
      name: "agregado",
      type: "text",
      section: "meios",
      width: "half",
      label: l("Pessoas no agregado", "Household members"),
      placeholder: l("Ex.: 5 pessoas (esposa e três filhos)", "E.g. 5 people"),
    },
    {
      name: "declaracaoCarencia",
      type: "toggle",
      section: "meios",
      default: true,
      label: l(
        "Junto declaração de carência (bairro ou posto)",
        "Hardship declaration attached",
      ),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "meios",
      rows: 3,
      label: l(
        "Outros documentos (um por linha)",
        "Other documents (one per line)",
      ),
      placeholder: l(
        "Cópia do BI\nCarta de despedimento",
        "ID copy\nDismissal letter",
      ),
    },
    localField("documento"),
    dateField("data", "documento"),
  ],

  warnings: () => {
    const w: Warning[] = [
      {
        level: "info",
        message: l(
          `O IPAJ presta gratuitamente patrocínio e assistência jurídica a quem não tem meios para pagar um advogado (${cite("ppIpaj")}). Leve o BI, os documentos do caso e prova da situação económica (a declaração de carência pode ser pedida no bairro — documento «Declaração de carência económica»).`,
          "IPAJ provides free legal help to people without means. Bring your ID, the case documents and proof of your situation.",
        ),
      },
      {
        level: "info",
        message: l(
          "Se tem um prazo a correr (contestação, recurso, impugnação de despedimento), diga-o logo e entregue o pedido com urgência.",
          "If a time limit is running, say so and file urgently.",
        ),
      },
    ];
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const OR = papel(v, "requerente", "O requerente", "A requerente");
    const del = str(v.delegacao);
    const factos = artigos(v.factos);
    const docs = [
      ...(v.declaracaoCarencia ? ["Declaração de carência económica"] : []),
      ...documentosList(v.documentos),
    ];
    const meios = [
      str(v.ocupacao) ? `${OR} é ${str(v.ocupacao).replace(/[.;]$/, "")}` : "",
      str(v.rendimento)
        ? `o rendimento mensal do seu agregado familiar é de ${moneyText(v.rendimento)}`
        : "",
      str(v.agregado)
        ? `o agregado é composto por ${str(v.agregado).replace(/[.;]$/, "")}`
        : "",
    ].filter(Boolean);
    const blocks: Block[] = [
      { type: "reference", place: ctx.place, date: dateLong(v.data) },
      {
        type: "recipient",
        salutation: "Exmo. Senhor",
        lines: [
          "Delegado do Instituto do Patrocínio e Assistência Jurídica (IPAJ)",
          del
            ? /^(cidade|prov[ií]ncia)/i.test(del)
              ? `Delegação da ${del}`
              : `Delegação de ${del}`
            : "Delegação de ____________________",
        ],
      },
      {
        type: "subject",
        text: "Pedido de assistência jurídica e patrocínio gratuito",
      },
      { type: "salutation", text: "Exmo. Senhor Delegado," },
      {
        type: "paragraph",
        id: "requerente",
        text: `${applicantDesc(v, "requerente", { docBlank: true })}, vem requerer a V. Ex.ª ${TIPO_TXT[v.tipo] ?? TIPO_TXT.patrocinio}, relativamente a ${str(v.materia).replace(/[.;]$/, "") || "____________________"}${str(v.parteContraria) ? `, em que é parte contrária ${str(v.parteContraria).replace(/[.;]$/, "")}` : ""}${str(v.processo) ? ` (${str(v.processo).replace(/[.;]$/, "")})` : ""}.`,
        en: "The applicant asks IPAJ for free legal help in the matter described.",
      },
    ];
    if (factos.length)
      blocks.push(
        {
          type: "paragraph",
          id: "factosIntro",
          text: "Em síntese:",
          en: "In summary:",
          keepWithNext: true,
        },
        { type: "list", style: "numeric", items: factos },
      );
    blocks.push({
      type: "paragraph",
      id: "meios",
      text: `${OR} não dispõe de meios económicos para suportar os honorários de advogado e as custas do processo${meios.length ? `: ${meios.join("; ")}` : ""}.`,
      en: "The applicant cannot afford a lawyer or court fees.",
    });
    blocks.push(
      {
        type: "paragraph",
        id: "declaracao",
        text: `${OR} declara, sob compromisso de honra, que as informações prestadas são verdadeiras.`,
        en: "The applicant declares the information true.",
      },
      {
        type: "paragraph",
        id: "fecho",
        text: "Pede deferimento.",
        en: "Closing formula.",
        keepWithNext: true,
      },
      {
        type: "signatures",
        columns: [
          {
            role: papel(v, "requerente", "O Requerente", "A Requerente"),
            name: str(v.requerenteNome) || undefined,
          },
        ],
      },
    );
    if (docs.length)
      blocks.push({ type: "annexList", title: "Anexos", items: docs });
    return keepTail(blocks, "meios");
  },
});
