// Recurso penal: the application lodging the appeal, addressed to the judge
// who decided, followed on a new page by the grounds (motivação) addressed to
// the appeal court, ending with the conclusions and the request.

import {
  defineTemplate,
  type Block,
  type Values,
  type Warning,
} from "../model";
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
  splitLines,
} from "./_shared";
import {
  FECHO_OPTIONS,
  artigos,
  courtAddressee,
  courtFields,
} from "./_advocacia";
import { deLocal, keepTail, nosAutos, str } from "./_processo-penal";

const AD_QUEM_OPTIONS = [
  {
    value: "tsr",
    label: l("Tribunal Superior de Recurso", "Higher Court of Appeal"),
  },
  { value: "ts", label: l("Tribunal Supremo", "Supreme Court") },
  {
    value: "tjp",
    label: l(
      "Tribunal Judicial de Província (recurso de decisão distrital)",
      "Provincial Court (appeal from a district court)",
    ),
  },
];

const DECISAO_OPTIONS = [
  { value: "sentença", label: l("Sentença", "Judgment") },
  { value: "acórdão", label: l("Acórdão", "Judgment of a panel") },
  { value: "despacho", label: l("Despacho", "Order") },
];

const PEDIDO_OPTIONS = [
  { value: "absolvicao", label: l("Absolvição do arguido", "Acquittal") },
  { value: "reducao", label: l("Redução da pena", "Reduced sentence") },
  {
    value: "suspensao",
    label: l("Suspensão da execução da pena", "Suspended sentence"),
  },
  {
    value: "anulacao",
    label: l("Anulação e novo julgamento", "Annulment and retrial"),
  },
  {
    value: "condenacao",
    label: l(
      "Condenação do arguido (recurso do assistente)",
      "Conviction (assistant’s appeal)",
    ),
  },
  {
    value: "revogacao",
    label: l("Revogação do despacho", "Revocation of the order"),
  },
  { value: "outro", label: l("Outro (escrever)", "Other (write it)") },
];

function adQuem(v: Values): { nome: string; vocativo: string } {
  const sede = str(v.adQuemSede);
  if (v.adQuem === "ts")
    return {
      nome: "Tribunal Supremo",
      vocativo: "VENERANDOS JUÍZES CONSELHEIROS DO TRIBUNAL SUPREMO",
    };
  if (v.adQuem === "tjp")
    return {
      nome: `Tribunal Judicial da Província ${sede ? `de ${sede}` : "de ____________"}`,
      vocativo:
        `MERITÍSSIMOS JUÍZES DO TRIBUNAL JUDICIAL DA PROVÍNCIA ${sede ? `DE ${sede.toLocaleUpperCase("pt")}` : ""}`.trim(),
    };
  return {
    nome: `Tribunal Superior de Recurso ${sede ? deLocal(sede) : "de ____________"}`,
    vocativo:
      `VENERANDOS JUÍZES DESEMBARGADORES DO TRIBUNAL SUPERIOR DE RECURSO ${sede ? deLocal(sede).toLocaleUpperCase("pt") : ""}`.trim(),
  };
}

export default defineTemplate({
  id: "recurso-penal",
  family: "peca",
  official: "tribunal",
  letterhead: false,
  sections: [
    { id: "tribunal", title: l("Tribunal e processo", "Court and case") },
    {
      id: "recorrente",
      title: l("Recorrente", "Appellant"),
      personRole: "cliente",
    },
    { id: "decisao", title: l("Decisão recorrida", "Decision appealed") },
    {
      id: "motivacao",
      title: l("Motivação e conclusões", "Grounds and conclusions"),
    },
    { id: "advogado", title: l("Advogado", "Lawyer") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    {
      name: "processoNumero",
      type: "text",
      section: "tribunal",
      width: "half",
      required: true,
      label: l("Processo n.º", "Case no."),
    },
    ...courtFields("tribunal").map((f) =>
      f.name === "seccao"
        ? {
            ...f,
            placeholder: l(
              "Ex.: 5.ª Secção Criminal",
              "E.g. 5th Criminal Section",
            ),
            help: undefined,
          }
        : f,
    ),
    {
      name: "adQuem",
      type: "select",
      section: "tribunal",
      width: "half",
      label: l("Tribunal de recurso", "Appeal court"),
      options: AD_QUEM_OPTIONS,
      default: "tsr",
      help: l(
        "Confirme o tribunal competente segundo o tribunal que decidiu.",
        "Check the competent appeal court.",
      ),
    },
    {
      name: "adQuemSede",
      type: "text",
      section: "tribunal",
      width: "half",
      label: l("Sede", "Seat"),
      default: "Maputo",
      showIf: (v) => v.adQuem !== "ts",
    },
    {
      name: "qualidade",
      type: "radio",
      section: "recorrente",
      label: l("Recorrente é", "Appellant is"),
      default: "arguido",
      options: [
        { value: "arguido", label: l("Arguido", "Accused") },
        { value: "assistente", label: l("Assistente", "Assistant prosecutor") },
        { value: "demandante", label: l("Demandante civil", "Civil claimant") },
      ],
    },
    {
      name: "recorrenteNome",
      type: "text",
      section: "recorrente",
      required: true,
      label: l("Nome", "Name"),
      personKey: "nome",
    },
    {
      name: "recorrenteGenero",
      type: "radio",
      section: "recorrente",
      width: "half",
      label: l("Tratamento", "Form of address"),
      options: GENERO_OPTIONS,
      default: "M",
      personKey: "genero",
    },
    {
      name: "decisao",
      type: "select",
      section: "decisao",
      width: "half",
      label: l("Tipo de decisão", "Type of decision"),
      options: DECISAO_OPTIONS,
      default: "sentença",
    },
    {
      name: "dataDecisao",
      type: "date",
      section: "decisao",
      width: "half",
      label: l("Data da decisão", "Date of decision"),
    },
    {
      name: "dataNotificacao",
      type: "date",
      section: "decisao",
      width: "half",
      label: l(
        "Data da notificação / depósito",
        "Date of notification / deposit",
      ),
    },
    {
      name: "decisaoResumo",
      type: "text",
      section: "decisao",
      label: l("O que decidiu", "What it decided"),
      placeholder: l(
        "Ex.: condenou o arguido na pena de quatro anos de prisão efectiva pelo crime de furto qualificado",
        "E.g. sentenced the accused to four years’ imprisonment",
      ),
    },
    {
      name: "regime",
      type: "text",
      section: "decisao",
      label: l(
        "Subida e efeito do recurso",
        "How the appeal goes up and its effect",
      ),
      default: "sobe imediatamente, nos próprios autos e com efeito suspensivo",
      help: l(
        "Confirme o regime aplicável ao tipo de decisão.",
        "Check the rules for this type of decision.",
      ),
    },
    {
      name: "motivacao",
      type: "textarea",
      section: "motivacao",
      rows: 10,
      required: true,
      label: l(
        "Motivação (um artigo por linha)",
        "Grounds (one article per line)",
      ),
      help: l(
        "Os erros da decisão: de facto (prova mal apreciada), de direito (norma mal aplicada), nulidades, medida da pena.",
        "Errors of fact, of law, nullities, sentencing.",
      ),
    },
    {
      name: "conclusoes",
      type: "textarea",
      section: "motivacao",
      rows: 6,
      required: true,
      label: l("Conclusões (uma por linha)", "Conclusions (one per line)"),
      help: l(
        "Resumo das razões do pedido, com as normas violadas e o sentido em que deviam ser aplicadas. São ordenadas a), b)…",
        "Summary of reasons, rules breached and how they should apply. Lettered a), b)…",
      ),
    },
    {
      name: "pedidoTipo",
      type: "select",
      section: "motivacao",
      label: l("Pedido", "Relief sought"),
      options: PEDIDO_OPTIONS,
      default: "absolvicao",
    },
    {
      name: "pedidoLivre",
      type: "text",
      section: "motivacao",
      label: l("Pedido (escrever)", "Relief (write it)"),
      showIf: (v) => v.pedidoTipo === "outro",
      help: l(
        "Completa «…e, em consequência, …».",
        "Completes “…and accordingly …”.",
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
      label: l("Fecho do requerimento", "Closing formula"),
      options: FECHO_OPTIONS,
      default: "Pede deferimento.",
    },
  ],

  warnings: (v, ctx) => {
    const r = ctx.legal.value<{ processoEspecialDias: number }>("ppRecurso");
    const w: Warning[] = [
      {
        level: "warning",
        field: "dataNotificacao",
        message: l(
          `O prazo de recurso é curto e conta-se da notificação ou do depósito da decisão; em processo especial, o Tribunal Supremo aplicou ${r.processoEspecialDias} dias (${cite("ppRecurso")}). Confirme o prazo do seu processo e apresente o recurso já motivado.`,
          `The appeal deadline is short and runs from notification or deposit of the decision; in special proceedings the Supreme Court applied ${r.processoEspecialDias} days. Confirm and file with grounds.`,
        ),
      },
    ];
    if (!str(v.conclusoes))
      w.push({
        level: "warning",
        field: "conclusoes",
        message: l(
          "A motivação tem de terminar com conclusões: sem elas o recurso pode ser rejeitado.",
          "The grounds must end with conclusions or the appeal may be rejected.",
        ),
      });
    return w;
  },

  personName: (v) => v.recorrenteNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const f = v.recorrenteGenero === "F";
    const qualTxt =
      v.qualidade === "assistente"
        ? "assistente"
        : v.qualidade === "demandante"
          ? "demandante civil"
          : f
            ? "arguida"
            : "arguido";
    const decisao = String(v.decisao || "sentença");
    const decF = decisao !== "acórdão" && decisao !== "despacho";
    const aq = adQuem(v);
    const nome = `**${(str(v.recorrenteNome) || "____________________").toLocaleUpperCase("pt")}**`;
    const resumo = str(v.decisaoResumo).replace(/[.;]$/, "");
    const conclusoes = splitLines(v.conclusoes).map((s) =>
      /[.;]$/.test(s) ? s : `${s};`,
    );
    const recorrente =
      f || v.qualidade === "assistente"
        ? f
          ? "da recorrente"
          : "do recorrente"
        : "do recorrente";
    const pedidos: Record<string, string> = {
      absolvicao: `ser revogada a decisão recorrida e ${f ? "a recorrente absolvida" : "o recorrente absolvido"} do crime por que ${f ? "foi condenada" : "foi condenado"}`,
      reducao: `ser a decisão recorrida alterada, reduzindo-se a pena aplicada ${recorrente} para medida próxima do seu limite mínimo`,
      suspensao: `ser a decisão recorrida alterada, suspendendo-se a execução da pena aplicada ${recorrente}`,
      anulacao:
        "ser anulada a decisão recorrida e ordenada a repetição do julgamento",
      condenacao:
        "ser revogada a decisão recorrida e o arguido condenado pela prática do crime de que vinha acusado",
      revogacao:
        "ser revogado o despacho recorrido e substituído por outro que defira o requerido",
      outro: str(v.pedidoLivre).replace(/[.;]$/, "") || "____________________",
    };
    const pedido = pedidos[v.pedidoTipo] ?? pedidos.absolvicao;
    const assinatura = {
      type: "signatures" as const,
      placeDate: placeDate(ctx, v.data),
      columns: [lawyerSignature(v)],
    };

    const blocks: Block[] = [
      {
        type: "courtHeader",
        processo: str(v.processoNumero) || "________/______",
        extra: str(v.seccao) || undefined,
        addressee: courtAddressee(v),
      },
      {
        type: "paragraph",
        id: "interposicao",
        text: `${nome}, ${qualTxt} ${nosAutos(v)}, neles melhor ${f ? "identificada" : "identificado"}, não se conformando com ${decF ? "a douta" : "o douto"} ${decisao} ${decF ? "proferida" : "proferido"}${v.dataDecisao ? ` em ${dateLong(v.dataDecisao)}` : ""}${resumo ? `, que ${resumo}` : ""}, ${decF ? "dela" : "dele"} vem, por intermédio do seu mandatário, interpor`,
        en: "The appellant, not accepting the decision, lodges an",
      },
      {
        type: "paragraph",
        id: "titulo",
        align: "center",
        text: `**RECURSO**\npara o ${aq.nome},`,
        en: "APPEAL to the appeal court,",
      },
      {
        type: "paragraph",
        id: "regime",
        text: `o qual ${str(v.regime) ? str(v.regime).replace(/[.;]$/, "") : "sobe nos termos legais"}, sendo interposto por quem tem legitimidade e em tempo${v.dataNotificacao ? `, contado da notificação de ${dateLong(v.dataNotificacao)}` : ""}.`,
        en: "Statement of how the appeal goes up, standing and timeliness.",
      },
      {
        type: "paragraph",
        id: "pedidoAdmissao",
        text: `Requer, por isso, a V. Ex.ª se digne admitir o presente recurso, que se apresenta já motivado, ordenando a notificação dos demais sujeitos processuais para responderem, querendo, e a subida dos autos ao ${aq.nome}.`,
        en: "The appellant asks that the appeal be admitted and sent up.",
      },
      {
        type: "paragraph",
        id: "junta",
        text: "**Junta:** motivação e duplicados legais.",
        en: "Attached: grounds and copies.",
      },
      {
        type: "paragraph",
        id: "fecho",
        text: String(v.fecho || "Pede deferimento."),
        en: "Closing formula.",
        keepWithNext: true,
      },
      assinatura,
      { type: "pageBreakHint" },
      {
        type: "paragraph",
        id: "motivTitulo",
        align: "center",
        text: "**MOTIVAÇÃO DO RECURSO**",
        en: "GROUNDS OF APPEAL",
      },
      {
        type: "paragraph",
        id: "motivPartes",
        align: "center",
        text: `Recorrente: ${nome}\nProcesso n.º ${str(v.processoNumero) || "________/______"}`,
        en: "Appellant and case number.",
      },
      {
        type: "paragraph",
        id: "vocativo",
        text: `**${aq.vocativo},**`,
        en: "Your Honours,",
      },
      {
        type: "articulado",
        sections: [
          {
            items: artigos(v.motivacao).length
              ? artigos(v.motivacao)
              : ["____________________"],
          },
        ],
      },
      {
        type: "paragraph",
        id: "conclTitulo",
        align: "center",
        text: "**CONCLUSÕES**",
        en: "CONCLUSIONS",
        keepWithNext: true,
      },
      {
        type: "list",
        style: "alpha",
        items: conclusoes.length ? conclusoes : ["____________________"],
      },
      {
        type: "paragraph",
        id: "pedido",
        text: `Termos em que, e nos melhores de Direito que Vossas Excelências doutamente suprirão, deve o presente recurso ser julgado procedente e, em consequência, ${pedido}, assim se fazendo a costumada **JUSTIÇA**.`,
        en: "The appellant asks the appeal court to allow the appeal and grant the relief sought.",
        keepWithNext: true,
      },
      { ...assinatura },
    ];
    return keepTail(keepTail(blocks, "pedidoAdmissao"), "pedido");
  },
});
