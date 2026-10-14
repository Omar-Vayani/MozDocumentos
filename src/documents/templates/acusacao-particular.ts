// Acusação particular / acusação do assistente: in offences that depend on a
// private accusation (e.g. defamation, insult) the assistant prosecutor files
// the accusation; in other offences the assistant may accuse alongside the
// Ministério Público. Filed through a lawyer.

import { defineTemplate, type Block, type Warning } from "../model";
import {
  cite,
  dateField,
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
  partyDesc,
  partyFields,
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

export default defineTemplate({
  id: "acusacao-particular",
  family: "peca",
  official: (v) => (v.fase === "mp" ? "estado" : "tribunal"),
  letterhead: false,
  sections: [
    { id: "processo", title: l("Processo", "Case") },
    {
      id: "assistente",
      title: l("Assistente", "Assistant prosecutor"),
      personRole: "cliente",
    },
    { id: "arguido", title: l("Arguido", "Accused"), personRole: "outro" },
    { id: "acusacao", title: l("Acusação", "Accusation") },
    { id: "prova", title: l("Prova", "Evidence") },
    { id: "advogado", title: l("Advogado", "Lawyer") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    ...penalCaseFields("processo", {
      fases: ["mp", "instrucao", "julgamento"],
    }),
    ...partyFields("assistente", "assistente", { light: true }),
    ...partyFields("arguido", "arguido").filter(
      (f) => !/(Tipo|Nuel|Representante)$/.test(f.name),
    ),
    {
      name: "tipo",
      type: "radio",
      section: "acusacao",
      label: l("Tipo de acusação", "Type of accusation"),
      default: "particular",
      options: [
        {
          value: "particular",
          label: l(
            "Acusação particular (crime particular: difamação, injúria…)",
            "Private accusation (e.g. defamation)",
          ),
        },
        {
          value: "subordinada",
          label: l(
            "Acusação do assistente em crime público ou semipúblico",
            "Assistant’s accusation in a public or semi-public offence",
          ),
        },
      ],
    },
    {
      name: "crimeNome",
      type: "text",
      section: "acusacao",
      width: "half",
      required: true,
      label: l("Crime", "Offence"),
      placeholder: l("Ex.: difamação", "E.g. defamation"),
    },
    {
      name: "crimeArtigo",
      type: "text",
      section: "acusacao",
      width: "half",
      label: l("Artigo do Código Penal", "Penal Code article"),
      help: l(
        "Escreva como deve aparecer, ex.: «artigo … do Código Penal».",
        "Write it as it should appear.",
      ),
    },
    {
      name: "agravantes",
      type: "text",
      section: "acusacao",
      label: l(
        "Circunstâncias agravantes (opcional)",
        "Aggravating circumstances (optional)",
      ),
      placeholder: l(
        "Ex.: através de meio de comunicação social",
        "E.g. through the media",
      ),
    },
    {
      name: "factos",
      type: "textarea",
      section: "acusacao",
      rows: 8,
      required: true,
      label: l("Factos (um artigo por linha)", "Facts (one article per line)"),
      help: l(
        "Quem, o quê, quando, onde e como: cada facto num artigo. Para difamação e injúria, transcreva as palavras usadas.",
        "Who, what, when, where, how. For defamation, quote the words used.",
      ),
    },
    {
      name: "testemunhas",
      type: "textarea",
      section: "prova",
      rows: 3,
      label: l("Rol de testemunhas", "Witnesses"),
      help: l("Uma por linha: nome, profissão e morada.", "One per line."),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "prova",
      rows: 3,
      label: l("Documentos (um por linha)", "Documents (one per line)"),
      placeholder: l(
        "Exemplar do jornal de 3 de Setembro de 2026\nCaptura de ecrã da publicação no Facebook",
        "Newspaper copy\nScreenshot",
      ),
    },
    {
      name: "indemnizacao",
      type: "toggle",
      section: "prova",
      default: true,
      label: l(
        "Anunciar o pedido de indemnização civil",
        "Announce the civil damages claim",
      ),
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

  warnings: () => {
    const w: Warning[] = [
      {
        level: "warning",
        message: l(
          `Nos crimes particulares, o assistente deduz a acusação no prazo legal depois de notificado pelo Ministério Público; sem acusação, o processo é arquivado (${cite("ppAcusacaoParticular")}). Confirme o prazo.`,
          "In private offences, the assistant prosecutor files the accusation within the legal time limit after notification; otherwise the case is closed.",
        ),
      },
    ];
    return w;
  },

  personName: (v) => v.arguidoNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const fase = faseValue(v);
    const OArg = papel(v, "arguido", "O arguido", "A arguida");
    const oArg = papel(v, "arguido", "o arguido", "a arguida");
    const crime = str(v.crimeNome) || "____________________";
    const artigo = str(v.crimeArtigo);
    const agrav = str(v.agravantes).replace(/[.;]$/, "");
    const factos = artigos(v.factos);
    const direito = [
      `${OArg} agiu de forma livre, deliberada e consciente, bem sabendo que a sua conduta era proibida e punida por lei.`,
      `Com a conduta descrita, ${oArg} ${papel(v, "arguido", "constituiu-se", "constituiu-se")} autor${papel(v, "arguido", "", "a")} material, na forma consumada, de um crime de ${crime}${agrav ? `, agravado por ter sido cometido ${agrav}` : ""}${artigo ? `, previsto e punido pelo ${artigo.replace(/^(o|pelo)\s+/i, "")}` : ""}.`,
    ];
    const testemunhas = testemunhasList(v.testemunhas);
    const docs = documentosList(v.documentos);
    const particular = v.tipo !== "subordinada";
    const blocks: Block[] = [
      {
        type: "courtHeader",
        processo: str(v.processoNumero) || "________/______",
        extra: fase !== "mp" ? str(v.seccao) || undefined : undefined,
        addressee: penalAddressee(v, fase),
      },
      {
        type: "paragraph",
        id: "assistente",
        text: `${partyDesc(v, "assistente")}, assistente ${nosAutos(v)}, ${particular ? `tendo sido ${papel(v, "assistente", "notificado", "notificada")} para o efeito, ` : ""}vem, por intermédio do seu mandatário, deduzir`,
        en: "The assistant prosecutor, through counsel, files a",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: particular ? "**ACUSAÇÃO PARTICULAR**" : "**ACUSAÇÃO**",
        en: "PRIVATE ACCUSATION",
      },
      {
        type: "paragraph",
        id: "contra",
        text: `contra ${partyDesc(v, "arguido", { docBlank: true })}, porquanto:`,
        en: "against the accused, because:",
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
        text: `Nestes termos, deve a presente acusação ser recebida e ${oArg} ${papel(v, "arguido", "submetido", "submetida")} a julgamento, para nele ${papel(v, "arguido", "ser condenado", "ser condenada")} pela prática do referido crime, com as legais consequências.`,
        en: "The accusation should be received and the accused tried and convicted.",
      },
    ];
    if (v.indemnizacao) {
      blocks.push({
        type: "paragraph",
        id: "civil",
        text: `O assistente deduzirá pedido de indemnização civil pelos danos sofridos, nos termos e no prazo legais (${cite("ppIndemnizacaoCivil")}).`.replace(
          "O assistente",
          papel(v, "assistente", "O assistente", "A assistente"),
        ),
        en: "The assistant will file a civil damages claim.",
      });
    }
    if (testemunhas.length) {
      blocks.push(
        {
          type: "paragraph",
          id: "rol",
          text: "**Prova testemunhal:**",
          en: "Witnesses:",
          keepWithNext: true,
        },
        { type: "list", style: "numeric", items: testemunhas },
      );
    }
    blocks.push(
      linePara(
        "junta",
        "Junta",
        `${juntaText({ documentos: docs.length })}.`,
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
        columns: [lawyerSignature(v)],
      },
    );
    if (docs.length)
      blocks.push({
        type: "annexList",
        title: "Prova documental",
        items: docs,
      });
    return keepTail(blocks, "pedido");
  },
});
