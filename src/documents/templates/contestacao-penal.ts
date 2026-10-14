// Contestação do arguido (defesa em processo penal): after the accusation or
// committal for trial, the defence answers the charges, sets out its version,
// mitigating circumstances and the evidence, with the list of witnesses.

import {
  defineTemplate,
  type Block,
  type SignatureColumn,
  type Values,
  type Warning,
} from "../model";
import {
  GENERO_OPTIONS,
  cite,
  dateField,
  isF,
  l,
  lawyerFields,
  lawyerSignature,
  localField,
  placeDate,
} from "./_shared";
import {
  FECHO_OPTIONS,
  artigos,
  documentosList,
  juntaText,
  linePara,
  papel,
  testemunhasList,
} from "./_advocacia";
import {
  faseValue,
  nosAutos,
  penalAddressee,
  penalCaseFields,
  str,
  keepTail,
} from "./_processo-penal";

const DEFENSOR_OPTIONS = [
  { value: "constituido", label: l("Advogado constituído", "Retained lawyer") },
  {
    value: "nomeado",
    label: l("Defensor nomeado (oficioso)", "Court-appointed counsel"),
  },
  {
    value: "ipaj",
    label: l(
      "Técnico ou assistente jurídico do IPAJ",
      "IPAJ legal aid officer",
    ),
  },
];

function defensorSignature(v: Values): SignatureColumn {
  const base = lawyerSignature(v);
  const f = isF(v.advogadoGenero);
  if (v.defensorTipo === "nomeado")
    return { ...base, role: f ? "A Defensora Nomeada" : "O Defensor Nomeado" };
  if (v.defensorTipo === "ipaj")
    return {
      role: f ? "A Técnica Jurídica do IPAJ" : "O Técnico Jurídico do IPAJ",
      name: str(v.advogadoNome) || undefined,
      detail: str(v.advogadoCarteira)
        ? `Carteira n.º ${str(v.advogadoCarteira)}`
        : undefined,
      image: "signature",
    };
  return base;
}

export default defineTemplate({
  id: "contestacao-penal",
  family: "peca",
  official: "tribunal",
  letterhead: false,
  sections: [
    { id: "processo", title: l("Tribunal e processo", "Court and case") },
    { id: "arguido", title: l("Arguido", "Accused"), personRole: "cliente" },
    { id: "defesa", title: l("Defesa", "Defence") },
    { id: "prova", title: l("Prova", "Evidence") },
    { id: "advogado", title: l("Defensor", "Defence counsel") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    ...penalCaseFields("processo", { fases: ["julgamento"] }),
    {
      name: "arguidoNome",
      type: "text",
      section: "arguido",
      required: true,
      label: l("Nome do arguido", "Name of the accused"),
      personKey: "nome",
    },
    {
      name: "arguidoGenero",
      type: "radio",
      section: "arguido",
      width: "half",
      label: l("Tratamento", "Form of address"),
      options: GENERO_OPTIONS,
      default: "M",
      personKey: "genero",
    },
    {
      name: "peca",
      type: "radio",
      section: "defesa",
      label: l("Notificado de", "Notified of"),
      default: "acusacao",
      options: [
        { value: "acusacao", label: l("Acusação", "Accusation") },
        {
          value: "pronuncia",
          label: l("Despacho de pronúncia", "Committal order"),
        },
      ],
    },
    {
      name: "crimeNome",
      type: "text",
      section: "defesa",
      width: "half",
      label: l("Crime imputado", "Offence charged"),
      placeholder: l("Ex.: furto qualificado", "E.g. aggravated theft"),
    },
    {
      name: "questoesPrevias",
      type: "textarea",
      section: "defesa",
      rows: 3,
      label: l(
        "Questões prévias (opcional, um artigo por linha)",
        "Preliminary issues (optional)",
      ),
      help: l(
        "Nulidades, prescrição, falta de queixa, incompetência.",
        "Nullities, limitation, lack of complaint, jurisdiction.",
      ),
    },
    {
      name: "impugnados",
      type: "text",
      section: "defesa",
      width: "half",
      label: l("Artigos da acusação impugnados", "Articles denied"),
      placeholder: l("Ex.: 3.º a 9.º", "E.g. 3 to 9"),
    },
    {
      name: "aceites",
      type: "text",
      section: "defesa",
      width: "half",
      label: l("Artigos aceites (opcional)", "Articles admitted (optional)"),
      placeholder: l("Ex.: 1.º e 2.º", "E.g. 1 and 2"),
    },
    {
      name: "versao",
      type: "textarea",
      section: "defesa",
      rows: 7,
      required: true,
      label: l(
        "Versão da defesa (um artigo por linha)",
        "Defence version (one article per line)",
      ),
    },
    {
      name: "direito",
      type: "textarea",
      section: "defesa",
      rows: 3,
      label: l(
        "Razões de direito (opcional, um artigo por linha)",
        "Legal arguments (optional)",
      ),
    },
    {
      name: "atenuantes",
      type: "textarea",
      section: "defesa",
      rows: 3,
      label: l(
        "Condições pessoais e atenuantes (opcional)",
        "Personal circumstances and mitigation (optional)",
      ),
      placeholder: l(
        "O arguido é primário e tem bom comportamento anterior.\nÉ pai de três filhos menores, que dependem do seu trabalho.",
        "No previous record.\nFather of three children.",
      ),
    },
    {
      name: "subsidiario",
      type: "toggle",
      section: "defesa",
      default: true,
      label: l(
        "Pedir, em alternativa, pena atenuada ou suspensa",
        "Alternatively ask for a reduced or suspended sentence",
      ),
    },
    {
      name: "testemunhas",
      type: "textarea",
      section: "prova",
      rows: 4,
      label: l("Rol de testemunhas", "Witnesses"),
      help: l(
        "Uma por linha: nome, profissão e morada. Indique quais depõem sobre os factos e quais sobre a personalidade do arguido.",
        "One per line: name, occupation, address.",
      ),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "prova",
      rows: 3,
      label: l(
        "Documentos juntos (um por linha)",
        "Documents attached (one per line)",
      ),
    },
    {
      name: "outrasProvas",
      type: "textarea",
      section: "prova",
      rows: 2,
      label: l(
        "Outras provas requeridas (opcional, uma por linha)",
        "Other evidence requested (optional)",
      ),
      placeholder: l(
        "Exame pericial à assinatura do documento de fls. 12",
        "Expert examination of the signature",
      ),
    },
    {
      name: "defensorTipo",
      type: "select",
      section: "advogado",
      label: l("Quem assina", "Who signs"),
      options: DEFENSOR_OPTIONS,
      default: "constituido",
    },
    ...lawyerFields("advogado"),
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
          `A contestação é apresentada no prazo legal a contar da notificação, com o rol de testemunhas e a indicação das demais provas (${cite("ppDefesaArguido")}). Confirme o prazo e a forma de processo antes de apresentar.`,
          "The defence statement is filed within the legal time limit from notification, with the list of witnesses and other evidence. Confirm the time limit.",
        ),
      },
    ];
    if (!str(v.testemunhas))
      w.push({
        level: "warning",
        field: "testemunhas",
        message: l(
          "Sem rol de testemunhas, o arguido pode perder a oportunidade de as oferecer.",
          "Without a witness list the defence may lose the chance to call witnesses.",
        ),
      });
    return w;
  },

  personName: (v) => v.arguidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v, ["julgamento"]);
    const OA = papel(v, "arguido", "O arguido", "A arguida");
    const oA = papel(v, "arguido", "o arguido", "a arguida");
    const crime = str(v.crimeNome);
    const previas = artigos(v.questoesPrevias);
    const imp = str(v.impugnados);
    const ace = str(v.aceites);
    const peca =
      v.peca === "pronuncia" ? "do despacho de pronúncia" : "da acusação";
    const factos = [
      ...(imp
        ? [
            `${OA} impugna, por não corresponderem à verdade, os factos constantes dos artigos ${imp} ${peca}.`,
          ]
        : [
            `${OA} impugna, por não corresponderem à verdade, os factos que lhe são imputados ${peca}, salvo os expressamente aceites.`,
          ]),
      ...(ace ? [`Aceita apenas o alegado nos artigos ${ace} ${peca}.`] : []),
      ...artigos(v.versao),
    ];
    const direito = artigos(v.direito);
    const atenuantes = artigos(v.atenuantes);
    const secs: { heading?: string; items: string[] }[] = [];
    const roman = ["I", "II", "III", "IV", "V"];
    const add = (h: string, items: string[]) => {
      if (items.length)
        secs.push({ heading: `${roman[secs.length]} — ${h}`, items });
    };
    add("Questões prévias", previas);
    add("Dos factos", factos);
    add("Do direito", direito);
    add(
      `Da personalidade e condições de vida ${papel(v, "arguido", "do arguido", "da arguida")}`,
      atenuantes,
    );

    const pedidos = [
      `Ser ${oA} ${papel(v, "arguido", "absolvido", "absolvida")} do crime${crime ? ` de ${crime}` : ""} de que vem ${papel(v, "arguido", "acusado", "acusada")}, com as legais consequências`,
      ...(v.subsidiario
        ? [
            `Subsidiariamente, caso assim não se entenda, ser-lhe aplicada pena especialmente atenuada, próxima do seu limite mínimo e suspensa na sua execução`,
          ]
        : []),
    ];
    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);
    const outras = artigos(v.outrasProvas).map((s) => s.replace(/\.$/, ""));

    const blocks: Block[] = [
      {
        type: "courtHeader",
        processo: str(v.processoNumero) || "________/______",
        extra: str(v.seccao) || undefined,
        addressee: penalAddressee(v, fase),
      },
      {
        type: "paragraph",
        id: "arguido",
        text: `**${(str(v.arguidoNome) || "____________________").toLocaleUpperCase("pt")}**, ${papel(v, "arguido", "arguido", "arguida")} ${nosAutos(v)}, neles melhor ${papel(v, "arguido", "identificado", "identificada")}, tendo sido ${papel(v, "arguido", "notificado", "notificada")} ${peca}${crime ? ` que lhe imputa a prática de crime de ${crime}` : ""}, vem, por intermédio do seu defensor, apresentar a sua`,
        en: "The accused, having been notified of the charges, files a",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: "**CONTESTAÇÃO**,",
        en: "DEFENCE STATEMENT,",
      },
      {
        type: "paragraph",
        id: "fundamentos",
        text: "o que faz nos termos e com os fundamentos seguintes:",
        en: "on the following grounds:",
      },
      {
        type: "articulado",
        sections: secs.length ? secs : [{ items: ["____________________"] }],
      },
      {
        type: "paragraph",
        id: "pedido",
        text: "Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente contestação ser julgada procedente, por provada, e, em consequência:",
        en: "The defence asks that:",
        keepWithNext: true,
      },
      {
        type: "list",
        style: "alpha",
        items: pedidos.map(
          (p, i) => `${p}${i === pedidos.length - 1 ? "." : ";"}`,
        ),
      },
    ];
    if (testemunhas.length) {
      blocks.push(
        {
          type: "paragraph",
          id: "rol",
          text: "**Rol de testemunhas:**",
          en: "Witnesses:",
          keepWithNext: true,
        },
        { type: "list", style: "numeric", items: testemunhas },
      );
    }
    if (outras.length) {
      blocks.push(
        {
          type: "paragraph",
          id: "outras",
          text: "**Requer ainda:**",
          en: "Also requests:",
          keepWithNext: true,
        },
        { type: "list", style: "bullet", items: outras.map((s) => `${s};`) },
      );
    }
    blocks.push(
      linePara(
        "junta",
        "Junta",
        `${juntaText({ procuracao: v.defensorTipo === "constituido", documentos: docs.length })}.`,
        "Attached documents.",
        true,
      ),
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
        columns: [defensorSignature(v)],
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
