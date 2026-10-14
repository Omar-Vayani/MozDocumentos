// Requerimento para audiência preliminar: under the 2019 Código de Processo
// Penal, after the accusation (or the closure of the case) the accused or the
// assistant prosecutor may ask the investigating judge for a preliminary
// hearing, which ends with a decision to commit or not to commit for trial —
// the Mozambican equivalent of the Portuguese "abertura de instrução".

import { defineTemplate, type Block, type Warning } from "../model";
import {
  GENERO_OPTIONS,
  cite,
  dateField,
  dateLong,
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
  testemunhasList,
} from "./_advocacia";
import {
  nosAutos,
  penalAddressee,
  penalCaseFields,
  str,
  keepTail,
} from "./_processo-penal";

export default defineTemplate({
  id: "requerimento-audiencia-preliminar",
  family: "peca",
  official: "tribunal",
  letterhead: false,
  sections: [
    { id: "processo", title: l("Tribunal e processo", "Court and case") },
    {
      id: "requerente",
      title: l("Quem requer", "Applicant"),
      personRole: "cliente",
    },
    { id: "fundamentos", title: l("Fundamentos", "Grounds") },
    { id: "prova", title: l("Diligências e prova", "Steps and evidence") },
    { id: "advogado", title: l("Advogado", "Lawyer") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    ...penalCaseFields("processo", { fases: ["instrucao"] }),
    {
      name: "qualidade",
      type: "radio",
      section: "requerente",
      label: l("Quem requer", "Who applies"),
      default: "arguido",
      options: [
        {
          value: "arguido",
          label: l(
            "Arguido (contra a acusação)",
            "Accused (against the accusation)",
          ),
        },
        {
          value: "assistente",
          label: l(
            "Assistente (contra o arquivamento ou a acusação)",
            "Assistant prosecutor (against closure or the accusation)",
          ),
        },
      ],
    },
    {
      name: "requerenteNome",
      type: "text",
      section: "requerente",
      required: true,
      label: l("Nome", "Name"),
      personKey: "nome",
    },
    {
      name: "requerenteGenero",
      type: "radio",
      section: "requerente",
      width: "half",
      label: l("Tratamento", "Form of address"),
      options: GENERO_OPTIONS,
      default: "M",
      personKey: "genero",
    },
    {
      name: "contrarioNome",
      type: "text",
      section: "requerente",
      width: "half",
      label: l(
        "Arguido (se requer o assistente)",
        "Accused (if the assistant applies)",
      ),
      showIf: (v) => v.qualidade === "assistente",
    },
    {
      name: "contrarioGenero",
      type: "radio",
      section: "requerente",
      width: "half",
      label: l("Tratamento", "Form of address"),
      options: GENERO_OPTIONS,
      default: "M",
      showIf: (v) => v.qualidade === "assistente",
    },
    {
      name: "decisao",
      type: "radio",
      section: "fundamentos",
      label: l("Decisão do Ministério Público", "Prosecutor’s decision"),
      default: "acusacao",
      options: [
        { value: "acusacao", label: l("Acusação", "Accusation") },
        {
          value: "arquivamento",
          label: l("Arquivamento", "Closure of the case"),
        },
      ],
    },
    {
      name: "dataNotificacao",
      type: "date",
      section: "fundamentos",
      width: "half",
      label: l("Data da notificação", "Date of notification"),
    },
    {
      name: "crimeNome",
      type: "text",
      section: "fundamentos",
      width: "half",
      label: l("Crime em causa", "Offence"),
      placeholder: l("Ex.: abuso de confiança", "E.g. breach of trust"),
    },
    {
      name: "razoes",
      type: "textarea",
      section: "fundamentos",
      rows: 8,
      required: true,
      label: l(
        "Razões de discordância (um artigo por linha)",
        "Reasons for disagreement (one article per line)",
      ),
      help: l(
        "Factos e razões de direito: o que a acusação ou o arquivamento não considerou, provas em falta, erros de qualificação.",
        "Facts and law: what was overlooked, missing evidence, wrong legal qualification.",
      ),
    },
    {
      name: "diligencias",
      type: "textarea",
      section: "prova",
      rows: 3,
      label: l(
        "Diligências requeridas (uma por linha)",
        "Steps requested (one per line)",
      ),
      placeholder: l(
        "Inquirição das testemunhas abaixo indicadas\nJunção do extracto bancário da conta n.º …",
        "Hearing of the witnesses below\nObtaining the bank statement",
      ),
    },
    {
      name: "testemunhas",
      type: "textarea",
      section: "prova",
      rows: 3,
      label: l("Testemunhas (opcional)", "Witnesses (optional)"),
      help: l("Uma por linha: nome, profissão e morada.", "One per line."),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "prova",
      rows: 2,
      label: l(
        "Documentos juntos (um por linha)",
        "Documents attached (one per line)",
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

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: "info",
        message: l(
          `A audiência preliminar é requerida ao juiz de instrução pelo arguido ou pelo assistente, no prazo legal a contar da notificação da acusação ou do arquivamento; não há audiência preliminar nos processos especiais e a assistência de defensor é obrigatória (${cite("ppAudienciaPreliminar")}). Confirme o prazo antes de apresentar.`,
          "The preliminary hearing is requested from the investigating judge by the accused or the assistant prosecutor within the legal time limit; not available in special proceedings; counsel is mandatory. Confirm the time limit.",
        ),
      },
    ];
    if (v.qualidade === "arguido" && v.decisao === "arquivamento") {
      w.push({
        level: "warning",
        field: "decisao",
        message: l(
          "O arguido requer a audiência preliminar contra a acusação; contra o arquivamento, só o assistente.",
          "The accused applies against an accusation; against a closure, only the assistant prosecutor.",
        ),
      });
    }
    return w;
  },

  personName: (v) => v.requerenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const arg = v.qualidade !== "assistente";
    const f = v.requerenteGenero === "F";
    const qual = arg ? (f ? "arguida" : "arguido") : "assistente";
    const crime = str(v.crimeNome);
    const arquivamento = v.decisao === "arquivamento";
    const cF = v.contrarioGenero === "F";
    const contrario = str(v.contrarioNome)
      ? `**${str(v.contrarioNome).toLocaleUpperCase("pt")}**`
      : cF
        ? "a arguida"
        : "o arguido";
    const decisaoTxt = arquivamento
      ? "do despacho de arquivamento proferido pelo Ministério Público"
      : "da acusação deduzida pelo Ministério Público";
    const intro = [
      `${f ? "A requerente foi notificada" : "O requerente foi notificado"}${v.dataNotificacao ? ` em ${dateLong(v.dataNotificacao)}` : ""} ${decisaoTxt}${crime ? `${arquivamento ? ", relativo a factos susceptíveis de integrar o crime de" : ", que imputa a prática de crime de"} ${crime}` : ""}.`,
      arg
        ? `${f ? "A requerente" : "O requerente"} não se conforma com a acusação, por não corresponder à verdade dos factos nem ao direito aplicável, pelas razões que a seguir se expõem.`
        : `${f ? "A requerente" : "O requerente"} não se conforma com ${arquivamento ? "o arquivamento" : "a acusação, nos termos em que foi deduzida"}, pelas razões que a seguir se expõem.`,
    ];
    const razoes = artigos(v.razoes);
    const diligencias = artigos(v.diligencias).map((s) => s.replace(/\.$/, ""));
    const testemunhas = testemunhasList(v.testemunhas);
    const docs = documentosList(v.documentos);
    const pedido = arg
      ? `Nestes termos, requer a V. Ex.ª se digne declarar aberta a audiência preliminar e, realizadas as diligências requeridas, proferir despacho de não pronúncia ${f ? "da requerente" : "do requerente"}, com as legais consequências.`
      : `Nestes termos, requer a V. Ex.ª se digne declarar aberta a audiência preliminar e, realizadas as diligências requeridas, proferir despacho de pronúncia de ${contrario}${crime ? ` pela prática do crime de ${crime}` : " pelos factos descritos"}, seguindo-se os ulteriores termos até julgamento.`;

    const blocks: Block[] = [
      {
        type: "courtHeader",
        processo: str(v.processoNumero) || "________/______",
        extra: str(v.seccao) || undefined,
        addressee: penalAddressee(v, "instrucao"),
      },
      {
        type: "paragraph",
        id: "requerente",
        text: `**${(str(v.requerenteNome) || "____________________").toLocaleUpperCase("pt")}**, ${qual} ${nosAutos(v)}${!arg ? `, em que é ${cF ? "arguida" : "arguido"} ${contrario}` : ""}, neles melhor ${f ? "identificada" : "identificado"}, vem, por intermédio do seu mandatário, requerer a`,
        en: "The applicant, through counsel, requests the",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: "**ABERTURA DA AUDIÊNCIA PRELIMINAR**,",
        en: "OPENING OF THE PRELIMINARY HEARING,",
      },
      {
        type: "paragraph",
        id: "fundamentos",
        text: "o que faz nos termos e com os fundamentos seguintes:",
        en: "on the following grounds:",
      },
      {
        type: "articulado",
        sections: [
          {
            heading: `I — ${arquivamento ? "Do arquivamento" : "Da acusação"}`,
            items: intro,
          },
          {
            heading: "II — Das razões de discordância",
            items: razoes.length ? razoes : ["____________________"],
          },
        ],
      },
    ];
    if (diligencias.length || testemunhas.length) {
      blocks.push({
        type: "paragraph",
        id: "diligencias",
        text: "Para tanto, requer a realização das seguintes diligências:",
        en: "The following steps are requested:",
        keepWithNext: true,
      });
      blocks.push({
        type: "list",
        style: "alpha",
        items: [
          ...diligencias,
          ...(testemunhas.length
            ? ["Inquirição das testemunhas abaixo indicadas"]
            : []),
        ].map((s, i, a) => `${s}${i === a.length - 1 ? "." : ";"}`),
      });
    }
    blocks.push({
      type: "paragraph",
      id: "pedido",
      text: pedido,
      en: arg
        ? "The applicant asks for a decision not to commit for trial."
        : "The assistant asks that the accused be committed for trial.",
    });
    if (testemunhas.length) {
      blocks.push(
        {
          type: "paragraph",
          id: "rol",
          text: "**Testemunhas:**",
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
        `${juntaText({ procuracao: false, documentos: docs.length, outros: [] })}.`,
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
        title: "Documentos juntos",
        items: docs,
      });
    return keepTail(blocks, "pedido");
  },
});
