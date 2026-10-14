// Denúncia à Inspecção-Geral do Trabalho: a worker, former worker, trade union
// or any person reports breaches of the Labour Law by an employer and asks for
// an inspection. The source of the report is kept confidential by law.

import {
  defineTemplate,
  type Block,
  type Values,
  type Warning,
} from "../model";
import { cite, dateField, dateLong, l, localField } from "./_shared";
import { artigos, documentosList, papel } from "./_advocacia";
import {
  applicantDesc,
  applicantFields,
  endDot,
  str,
  keepTail,
} from "./_processo-penal";

const INFRACCOES: {
  name: string;
  label: ReturnType<typeof l>;
  text: string;
}[] = [
  {
    name: "iSalarios",
    label: l(
      "Salários em atraso ou abaixo do mínimo",
      "Late wages or below minimum",
    ),
    text: "falta de pagamento pontual dos salários ou pagamento abaixo do salário mínimo em vigor",
  },
  {
    name: "iInss",
    label: l(
      "Falta de inscrição ou descontos do INSS não entregues",
      "No social security registration or contributions",
    ),
    text: "falta de inscrição dos trabalhadores no INSS ou falta de entrega das contribuições descontadas nos salários",
  },
  {
    name: "iHoras",
    label: l(
      "Horas extraordinárias não pagas / horário excessivo",
      "Unpaid overtime / excessive hours",
    ),
    text: "prestação de trabalho para além do horário normal sem o pagamento devido e sem o descanso legal",
  },
  {
    name: "iContrato",
    label: l("Trabalho sem contrato escrito", "No written contract"),
    text: "manutenção de trabalhadores sem contrato escrito, quando exigido, ou sem entrega de cópia do contrato",
  },
  {
    name: "iSeguranca",
    label: l(
      "Falta de condições de segurança e higiene",
      "Health and safety breaches",
    ),
    text: "falta de equipamento de protecção individual e de condições de segurança, higiene e saúde no trabalho",
  },
  {
    name: "iFerias",
    label: l(
      "Férias e descanso semanal negados",
      "Leave and weekly rest denied",
    ),
    text: "recusa de concessão de férias e do descanso semanal obrigatório",
  },
  {
    name: "iDespedimentos",
    label: l("Despedimentos sem processo", "Dismissals without procedure"),
    text: "despedimento de trabalhadores sem processo disciplinar nem pagamento das indemnizações devidas",
  },
  {
    name: "iMenores",
    label: l("Trabalho de menores", "Child labour"),
    text: "utilização de trabalho de menores em violação da lei",
  },
  {
    name: "iAssedio",
    label: l("Assédio ou discriminação", "Harassment or discrimination"),
    text: "prática de assédio, discriminação ou violência no local de trabalho",
  },
  {
    name: "iEstrangeiros",
    label: l(
      "Trabalhadores estrangeiros sem autorização",
      "Foreign workers without permit",
    ),
    text: "contratação de trabalhadores estrangeiros sem a autorização ou comunicação exigida",
  },
];

const QUALIDADE_OPTIONS = [
  { value: "trabalhador", label: l("Trabalhador da empresa", "Employee") },
  { value: "ex", label: l("Antigo trabalhador", "Former employee") },
  {
    value: "sindicato",
    label: l("Representante sindical", "Trade union representative"),
  },
  { value: "outro", label: l("Outra pessoa", "Other person") },
];

const QUALIDADE_TXT: Record<string, (v: Values) => string> = {
  trabalhador: (v) =>
    `${papel(v, "denunciante", "trabalhador", "trabalhadora")} ao serviço da empresa adiante identificada`,
  ex: (v) =>
    `${papel(v, "denunciante", "antigo trabalhador", "antiga trabalhadora")} da empresa adiante identificada`,
  sindicato: (v) =>
    `na qualidade de ${str(v.cargoSindical) || "representante sindical"}`,
  outro: () => "",
};

export default defineTemplate({
  id: "denuncia-inspeccao-trabalho",
  family: "carta",
  official: "estado",
  letterhead: false,
  sections: [
    { id: "destino", title: l("A quem se dirige", "Addressee") },
    {
      id: "denunciante",
      title: l("Quem denuncia", "Person reporting"),
      personRole: "trabalhador",
    },
    {
      id: "empresa",
      title: l("Empresa denunciada", "Employer reported"),
      personRole: "outro",
    },
    { id: "infraccoes", title: l("Infracções", "Breaches") },
    { id: "documento", title: l("Local e data", "Place and date") },
  ],
  fields: [
    {
      name: "destino",
      type: "radio",
      section: "destino",
      label: l("Dirigir a", "Address to"),
      default: "provincial",
      options: [
        {
          value: "provincial",
          label: l(
            "Delegação provincial da Inspecção-Geral do Trabalho",
            "Provincial office of the Labour Inspectorate",
          ),
        },
        {
          value: "geral",
          label: l(
            "Inspector-Geral do Trabalho (Maputo)",
            "Inspector-General (Maputo)",
          ),
        },
      ],
    },
    {
      name: "provincia",
      type: "text",
      section: "destino",
      width: "half",
      label: l("Província ou cidade", "Province or city"),
      default: "Cidade de Maputo",
      showIf: (v) => v.destino !== "geral",
    },
    ...applicantFields("denunciante", "denunciante", {
      noEmpresa: true,
      light: false,
    }),
    {
      name: "qualidade",
      type: "select",
      section: "denunciante",
      width: "half",
      label: l("Relação com a empresa", "Relation to the employer"),
      options: QUALIDADE_OPTIONS,
      default: "trabalhador",
    },
    {
      name: "cargoSindical",
      type: "text",
      section: "denunciante",
      width: "half",
      label: l("Cargo sindical", "Union post"),
      placeholder: l(
        "Ex.: Secretário do Comité Sindical do SINTICIM",
        "E.g. union committee secretary",
      ),
      showIf: (v) => v.qualidade === "sindicato",
    },
    {
      name: "sigilo",
      type: "toggle",
      section: "denunciante",
      default: true,
      label: l(
        "Pedir que a identidade fique confidencial",
        "Ask that the identity stay confidential",
      ),
    },
    {
      name: "empresaNome",
      type: "text",
      section: "empresa",
      required: true,
      label: l("Nome da empresa / empregador", "Employer’s name"),
      personKey: "nome",
    },
    {
      name: "empresaLocal",
      type: "text",
      section: "empresa",
      required: true,
      label: l("Local de trabalho (endereço)", "Workplace address"),
      placeholder: l(
        "Ex.: Armazém na Avenida das Indústrias, Machava, Matola",
        "E.g. warehouse address",
      ),
    },
    {
      name: "empresaActividade",
      type: "text",
      section: "empresa",
      width: "half",
      label: l("Actividade (opcional)", "Business (optional)"),
      placeholder: l("Ex.: construção civil", "E.g. construction"),
    },
    {
      name: "empresaTrabalhadores",
      type: "text",
      section: "empresa",
      width: "half",
      label: l(
        "N.º aproximado de trabalhadores (opcional)",
        "Approx. number of workers (optional)",
      ),
    },
    {
      name: "empresaResponsavel",
      type: "text",
      section: "empresa",
      label: l("Responsável (opcional)", "Person in charge (optional)"),
      placeholder: l("Ex.: o gerente, Sr. António Mabunda", "E.g. the manager"),
    },
    ...INFRACCOES.map((x) => ({
      name: x.name,
      type: "toggle" as const,
      section: "infraccoes",
      label: x.label,
    })),
    {
      name: "outraInfraccao",
      type: "text",
      section: "infraccoes",
      label: l("Outra infracção (opcional)", "Other breach (optional)"),
    },
    {
      name: "factos",
      type: "textarea",
      section: "infraccoes",
      rows: 6,
      label: l(
        "Factos concretos (um por linha)",
        "Concrete facts (one per line)",
      ),
      help: l(
        "Desde quando, quantos trabalhadores, valores em atraso, horários. Quanto mais concreto, mais fácil a inspecção.",
        "Since when, how many workers, amounts, hours. The more concrete, the better.",
      ),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "infraccoes",
      rows: 3,
      label: l(
        "Documentos juntos (um por linha, opcional)",
        "Documents attached (optional)",
      ),
      placeholder: l(
        "Cópia do recibo de salário de Agosto\nFotografias do estaleiro",
        "Payslip copy\nPhotos",
      ),
    },
    localField("documento"),
    dateField("data", "documento"),
  ],

  warnings: (v) => {
    const w: Warning[] = [
      {
        level: "info",
        message: l(
          `O trabalhador tem direito a dirigir-se à Inspecção-Geral do Trabalho sempre que se veja prejudicado ou para denunciar actos ilícitos (${cite("ppDireitoInspeccao")}). A fonte da denúncia é estritamente confidencial e o inspector não pode revelar que a visita resulta de denúncia (${cite("ppSigiloDenunciaIgt")}).`,
          "Workers may go to the Labour Inspectorate when harmed or to report unlawful acts. The source is strictly confidential.",
        ),
      },
      {
        level: "info",
        message: l(
          "Entregue em mão na delegação da Inspecção e peça carimbo de entrada na cópia. Para receber salários ou indemnizações, pode também pedir mediação ou ir ao tribunal.",
          "Hand it in at the Inspectorate and get a stamped copy. To recover money you may also request mediation or go to court.",
        ),
      },
    ];
    if (
      !INFRACCOES.some((x) => v[x.name]) &&
      !str(v.outraInfraccao) &&
      !str(v.factos)
    )
      w.push({
        level: "warning",
        field: "factos",
        message: l(
          "Indique as infracções ou descreva os factos.",
          "Select the breaches or describe the facts.",
        ),
      });
    return w;
  },

  personName: (v) => v.empresaNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const prov = str(v.provincia);
    const recipient =
      v.destino === "geral"
        ? [
            "Inspector-Geral do Trabalho",
            "Inspecção-Geral do Trabalho",
            "Maputo",
          ]
        : [
            "Delegado Provincial da Inspecção-Geral do Trabalho",
            prov
              ? /^cidade/i.test(prov)
                ? `Delegação da ${prov}`
                : `Delegação Provincial de ${prov}`
              : "Delegação Provincial de ____________________",
          ];
    const qual = (QUALIDADE_TXT[v.qualidade] ?? QUALIDADE_TXT.outro)(v);
    const empresa = `**${(str(v.empresaNome) || "____________________").toLocaleUpperCase("pt")}**`;
    const empresaDesc = [
      empresa,
      str(v.empresaActividade)
        ? `que se dedica a ${str(v.empresaActividade).replace(/[.;]$/, "")}`
        : "",
      `com local de trabalho em ${str(v.empresaLocal) || "____________________"}`,
      str(v.empresaTrabalhadores)
        ? `com cerca de ${str(v.empresaTrabalhadores)} trabalhadores`
        : "",
      str(v.empresaResponsavel)
        ? `sendo responsável ${str(v.empresaResponsavel).replace(/[.;]$/, "")}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");
    const infr = [
      ...INFRACCOES.filter((x) => v[x.name]).map((x) => x.text),
      ...(str(v.outraInfraccao)
        ? [str(v.outraInfraccao).replace(/[.;]$/, "")]
        : []),
    ];
    const factos = artigos(v.factos);
    const docs = documentosList(v.documentos);
    const blocks: Block[] = [
      { type: "reference", place: ctx.place, date: dateLong(v.data) },
      { type: "recipient", salutation: "Exmo. Senhor", lines: recipient },
      {
        type: "subject",
        text: `Denúncia de infracções à legislação laboral — ${str(v.empresaNome) || "____________________"}`,
      },
      { type: "salutation", text: "Exmo. Senhor," },
      {
        type: "paragraph",
        id: "denunciante",
        text: `${applicantDesc(v, "denunciante", { docBlank: true })}${qual ? `, ${qual}` : ""}, vem apresentar a V. Ex.ª denúncia contra ${empresaDesc}, pelas infracções à legislação laboral a seguir descritas.`,
        en: "The person identified reports the employer for the following breaches of labour law.",
      },
    ];
    if (infr.length) {
      blocks.push(
        {
          type: "paragraph",
          id: "infrIntro",
          text: "Na empresa verificam-se, designadamente:",
          en: "The following breaches occur at the employer:",
          keepWithNext: true,
        },
        {
          type: "list",
          style: "alpha",
          items: infr.map(
            (t, i) =>
              `${t.charAt(0).toUpperCase()}${t.slice(1)}${i === infr.length - 1 ? "." : ";"}`,
          ),
        },
      );
    }
    if (factos.length) {
      blocks.push(
        {
          type: "paragraph",
          id: "factosIntro",
          text: "Em concreto:",
          en: "Specifically:",
          keepWithNext: true,
        },
        { type: "list", style: "numeric", items: factos },
      );
    }
    blocks.push({
      type: "paragraph",
      id: "pedido",
      text: "Nestes termos, requer a V. Ex.ª se digne ordenar a realização de visita de inspecção ao referido local de trabalho, a verificação das infracções denunciadas e a adopção das medidas legais, incluindo o levantamento de auto de notícia e a regularização da situação dos trabalhadores.",
      en: "The person asks for an inspection, verification of the breaches and the legal measures.",
    });
    if (v.sigilo) {
      blocks.push({
        type: "paragraph",
        id: "sigilo",
        text: endDot(
          `Mais requer que a sua identidade seja mantida estritamente confidencial e que não seja revelado ao empregador que a inspecção resulta da presente denúncia, nos termos dos ${cite("ppSigiloDenunciaIgt")}`,
        ),
        en: "The person asks for confidentiality of identity.",
      });
    }
    blocks.push(
      {
        type: "paragraph",
        id: "disponivel",
        text: `${papel(v, "denunciante", "O denunciante", "A denunciante")} mantém-se ao dispor para prestar os esclarecimentos necessários.`,
        en: "The person is available for further information.",
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
            role: papel(v, "denunciante", "O Denunciante", "A Denunciante"),
            name: str(v.denuncianteNome) || undefined,
          },
        ],
      },
    );
    if (docs.length)
      blocks.push({ type: "annexList", title: "Anexos", items: docs });
    return keepTail(blocks, "pedido");
  },
});
