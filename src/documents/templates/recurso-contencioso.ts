// Petição de recurso contencioso de anulação: a citizen or company asks the
// administrative court to annul (or declare null) an administrative act, or to
// act on a tacit refusal, under the administrative litigation law.

import { addDays } from "@/lib/format";
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
  moneyExt,
  papel,
} from "./_advocacia";
import {
  VICIOS_ADMIN,
  applicantDesc,
  applicantFields,
  optionalLawyerFields,
  partySignature,
  str,
  taAddressee,
  taFields,
  viaMandatario,
  keepTail,
} from "./_processo-penal";

const tacito = (v: Values) => v.tipoActo === "tacito";

export default defineTemplate({
  id: "recurso-contencioso",
  family: "peca",
  official: "tribunal",
  letterhead: false,
  sections: [
    { id: "tribunal", title: l("Tribunal", "Court") },
    {
      id: "recorrente",
      title: l("Recorrente", "Applicant"),
      personRole: "cliente",
    },
    { id: "acto", title: l("Acto recorrido", "Act challenged") },
    { id: "fundamentos", title: l("Factos e vícios", "Facts and grounds") },
    { id: "prova", title: l("Pedido e prova", "Relief and evidence") },
    { id: "advogado", title: l("Advogado", "Lawyer") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    ...taFields("tribunal"),
    ...applicantFields("recorrente", "recorrente"),
    {
      name: "tipoActo",
      type: "radio",
      section: "acto",
      label: l("O que se impugna", "What is challenged"),
      default: "expresso",
      options: [
        {
          value: "expresso",
          label: l("Uma decisão (acto expresso)", "A decision (express act)"),
        },
        {
          value: "tacito",
          label: l(
            "O silêncio da Administração (indeferimento tácito)",
            "Administrative silence (tacit refusal)",
          ),
        },
      ],
    },
    {
      name: "orgao",
      type: "text",
      section: "acto",
      required: true,
      label: l(
        "Órgão autor do acto (entidade recorrida)",
        "Body that issued the act",
      ),
      placeholder: l(
        "Ex.: Presidente do Conselho Municipal da Cidade de Maputo",
        "E.g. Mayor of Maputo",
      ),
    },
    {
      name: "orgaoGenero",
      type: "radio",
      section: "acto",
      width: "half",
      label: l("Género gramatical do órgão", "Grammatical gender of the body"),
      options: [
        { value: "M", label: l("O … (Presidente, Ministro)", "Masculine") },
        { value: "F", label: l("A … (Direcção, Ministra)", "Feminine") },
      ],
      default: "M",
    },
    {
      name: "actoDescricao",
      type: "text",
      section: "acto",
      label: l("O que decidiu", "What it decided"),
      placeholder: l(
        "Ex.: revogou a licença de construção n.º 45/2026 do recorrente",
        "E.g. revoked the building permit",
      ),
      showIf: (v) => !tacito(v),
    },
    {
      name: "actoReferencia",
      type: "text",
      section: "acto",
      width: "half",
      label: l("Referência (despacho, ofício)", "Reference"),
      placeholder: l(
        "Ex.: Despacho n.º 112/GP/2026",
        "E.g. Order no. 112/2026",
      ),
      showIf: (v) => !tacito(v),
    },
    {
      name: "dataActo",
      type: "date",
      section: "acto",
      width: "half",
      label: l("Data do acto", "Date of the act"),
      showIf: (v) => !tacito(v),
    },
    {
      name: "dataNotificacao",
      type: "date",
      section: "acto",
      width: "half",
      label: l("Data da notificação", "Date of notification"),
      showIf: (v) => !tacito(v),
    },
    {
      name: "pedidoOriginal",
      type: "text",
      section: "acto",
      label: l(
        "Pedido feito à Administração",
        "Request made to the administration",
      ),
      placeholder: l(
        "Ex.: requerimento de atribuição de DUAT",
        "E.g. land-use title application",
      ),
      showIf: tacito,
    },
    {
      name: "dataPedidoOriginal",
      type: "date",
      section: "acto",
      width: "half",
      label: l("Data do pedido", "Date of the request"),
      showIf: tacito,
    },
    {
      name: "recursoHierarquico",
      type: "toggle",
      section: "acto",
      label: l(
        "Houve reclamação ou recurso hierárquico antes",
        "A complaint or hierarchical appeal was filed first",
      ),
    },
    {
      name: "nulidade",
      type: "toggle",
      section: "acto",
      label: l(
        "O acto é nulo (pedir declaração de nulidade)",
        "The act is null (ask for a declaration of nullity)",
      ),
      help: l(
        "Ex.: ofende direitos fundamentais, falta absoluta de forma, objecto impossível. Os actos nulos podem ser impugnados a todo o tempo.",
        "E.g. violates fundamental rights. Null acts may be challenged at any time.",
      ),
    },
    {
      name: "contraInteressados",
      type: "text",
      section: "acto",
      label: l(
        "Contra-interessados (opcional)",
        "Interested third parties (optional)",
      ),
      placeholder: l(
        "Ex.: Jorge Mabunda, a quem foi atribuído o terreno, residente em …",
        "E.g. the person who benefits from the act",
      ),
    },
    {
      name: "factos",
      type: "textarea",
      section: "fundamentos",
      rows: 8,
      required: true,
      label: l("Factos (um artigo por linha)", "Facts (one article per line)"),
    },
    ...VICIOS_ADMIN.map((x) => ({
      name: x.name,
      type: "toggle" as const,
      section: "fundamentos",
      label: x.label,
    })),
    {
      name: "direito",
      type: "textarea",
      section: "fundamentos",
      rows: 4,
      label: l(
        "Fundamentos de direito (um artigo por linha)",
        "Legal grounds (one article per line)",
      ),
      help: l("As normas violadas e porquê.", "The rules breached and why."),
    },
    {
      name: "pedidoExtra",
      type: "text",
      section: "prova",
      label: l("Pedido adicional (opcional)", "Additional relief (optional)"),
      placeholder: l(
        "Ex.: a condenação da entidade recorrida a emitir a licença requerida",
        "E.g. order to issue the permit",
      ),
    },
    {
      name: "valorCausa",
      type: "money",
      section: "prova",
      width: "half",
      label: l("Valor (opcional)", "Value (optional)"),
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
      default: "Cópia do acto recorrido e da respectiva notificação",
    },
    {
      name: "testemunhas",
      type: "textarea",
      section: "prova",
      rows: 2,
      label: l("Testemunhas (opcional)", "Witnesses (optional)"),
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

  warnings: (v, ctx) => {
    const p = ctx.legal.value<{ dias: number }>("ppRecursoContencioso");
    const w: Warning[] = [
      {
        level: "warning",
        field: "dataNotificacao",
        message: l(
          `O recurso de actos anuláveis é interposto em ${p.dias} dias (salvo indeferimento tácito); os actos nulos podem ser impugnados a todo o tempo. O recurso não suspende o acto: para o suspender, peça também a suspensão de eficácia (${cite("ppRecursoContencioso")}; confirme a contagem).`,
          `Voidable acts must be challenged within ${p.dias} days; null acts at any time. The appeal does not suspend the act: also request suspension of effects.`,
        ),
      },
      {
        level: "info",
        field: "documentos",
        message: l(
          "Junte cópia do acto recorrido (ou prova do pedido sem resposta, no indeferimento tácito) e da notificação.",
          "Attach a copy of the act (or proof of the unanswered request) and of the notification.",
        ),
      },
    ];
    if (
      !tacito(v) &&
      !v.nulidade &&
      v.dataNotificacao &&
      v.data &&
      addDays(v.dataNotificacao, p.dias) < v.data
    ) {
      w.push({
        level: "error",
        field: "dataNotificacao",
        message: l(
          "O prazo contado da notificação parece ter passado. Confirme se houve suspensão (ex.: recurso hierárquico) ou se o acto é nulo.",
          "The time limit seems to have passed. Check for suspension or nullity.",
        ),
      });
    }
    if (!VICIOS_ADMIN.some((x) => v[x.name]) && !str(v.direito))
      w.push({
        level: "warning",
        field: "direito",
        message: l(
          "Indique os vícios do acto (os fundamentos do recurso).",
          "State the defects of the act.",
        ),
      });
    return w;
  },

  personName: (v) => v.recorrenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const OR = papel(v, "recorrente", "O recorrente", "A recorrente");
    const orgaoF = v.orgaoGenero === "F";
    const orgao = str(v.orgao) || "____________________";
    const oOrgao = `${orgaoF ? "a" : "o"} ${orgao}`;
    const doOrgao = `${orgaoF ? "da" : "do"} ${orgao}`;
    const nulo = Boolean(v.nulidade);
    const objectoRec = tacito(v)
      ? "o indeferimento tácito impugnado"
      : "o acto recorrido";
    const actoTxt = tacito(v)
      ? `o indeferimento tácito do pedido de ${str(v.pedidoOriginal).replace(/^(o |um )?pedido de /i, "") || "____________________"}, apresentado ${v.dataPedidoOriginal ? `em ${dateLong(v.dataPedidoOriginal)} ` : ""}junto ${doOrgao}`
      : `o acto ${doOrgao}${str(v.actoReferencia) ? `, constante do ${str(v.actoReferencia)}` : ""}${v.dataActo ? `, de ${dateLong(v.dataActo)}` : ""}${str(v.actoDescricao) ? `, que ${str(v.actoDescricao).replace(/[.;]$/, "")}` : ""}`;
    const enquadramento = [
      tacito(v)
        ? `${OR} apresentou${v.dataPedidoOriginal ? ` em ${dateLong(v.dataPedidoOriginal)}` : ""} ${str(v.pedidoOriginal) || "o pedido identificado"}, sobre o qual não recaiu decisão no prazo legal, o que lhe permite presumir o seu indeferimento (${cite("indeferimentoTacito")}).`
        : `${OR} foi ${papel(v, "recorrente", "notificado", "notificada")}${v.dataNotificacao ? ` em ${dateLong(v.dataNotificacao)}` : ""} do acto recorrido, que se junta como Documento n.º 1.`,
      ...(v.recursoHierarquico
        ? [
            `${OR} reclamou ou recorreu hierarquicamente do acto, sem que tenha obtido decisão favorável.`,
          ]
        : []),
      `O acto é ${nulo ? "nulo" : "anulável"} e lesa direitos e interesses legalmente protegidos ${papel(v, "recorrente", "do recorrente", "da recorrente")}, que tem, por isso, legitimidade para o presente recurso, interposto em tempo (${cite("ppRecursoContencioso")}).`,
    ];
    const factos = artigos(v.factos);
    const vicios = [
      ...VICIOS_ADMIN.filter((x) => v[x.name]).map((x) =>
        x.text.replace("O recorrente", OR),
      ),
      ...artigos(v.direito),
    ];
    const docs = documentosList(v.documentos);
    const testemunhas = artigos(v.testemunhas).map((s) => s.replace(/\.$/, ""));
    const contra = str(v.contraInteressados).replace(/[.;]$/, "");
    const blocks: Block[] = [
      { type: "courtHeader", addressee: taAddressee(v) },
      {
        type: "paragraph",
        id: "recorrente",
        text: `${applicantDesc(v, "recorrente", { docBlank: true })}, vem${viaMandatario(v)} interpor`,
        en: "The applicant lodges a",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: `**RECURSO CONTENCIOSO DE ${nulo ? "DECLARAÇÃO DE NULIDADE" : "ANULAÇÃO"}**`,
        en: "APPLICATION FOR JUDICIAL REVIEW",
      },
      {
        type: "paragraph",
        id: "objecto",
        text: `de ${actoTxt}, sendo entidade recorrida ${oOrgao}${contra ? ` e contra-interessado ${contra}` : ""}, nos termos e com os fundamentos seguintes:`,
        en: "against the act identified, on the following grounds:",
      },
      {
        type: "articulado",
        sections: [
          {
            heading: "I — Do acto recorrido e da tempestividade",
            items: enquadramento,
          },
          {
            heading: "II — Dos factos",
            items: factos.length ? factos : ["____________________"],
          },
          {
            heading: "III — Dos vícios do acto",
            items: vicios.length ? vicios : ["____________________"],
          },
        ],
      },
      {
        type: "paragraph",
        id: "pedido",
        text: `Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve o presente recurso ser julgado procedente, por provado, e, em consequência, ${nulo ? `declarada a nulidade d${objectoRec}` : `anulado ${objectoRec}`}${str(v.pedidoExtra) ? `, com ${str(v.pedidoExtra).replace(/[.;]$/, "")}` : ""}, com as legais consequências.`,
        en: "The applicant asks the court to annul the act or declare it void.",
      },
      {
        type: "paragraph",
        id: "citacao",
        text: `Requer a citação da entidade recorrida para, querendo, responder e remeter o processo administrativo instrutor${contra ? ", bem como a citação do contra-interessado" : ""}.`,
        en: "The applicant asks that the respondent body be served and file the administrative record.",
      },
    ];
    if (str(v.valorCausa))
      blocks.push(
        linePara("valor", "Valor", `${moneyExt(v.valorCausa)}.`, "Value."),
      );
    blocks.push(
      linePara(
        "junta",
        "Junta",
        `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length })}.`,
        "Attached documents.",
        !testemunhas.length,
      ),
    );
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
          keepWithNext: true,
        },
      );
    }
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
            "recorrente",
            papel(v, "recorrente", "O Recorrente", "A Recorrente"),
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
