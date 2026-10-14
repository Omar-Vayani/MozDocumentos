// Petição inicial no Tribunal do Trabalho: the worker sues the employer to
// challenge a dismissal (impugnação de despedimento) and/or to recover unpaid
// employment credits (salaries, leave, overtime, compensation).

import { addMonths } from "@/lib/format";
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
  courtAddressee,
  courtFields,
  documentosList,
  juntaText,
  linePara,
  moneyExt,
  papel,
  partyDesc,
  partyFields,
  testemunhasList,
} from "./_advocacia";
import {
  optionalLawyerFields,
  partySignature,
  str,
  viaMandatario,
  keepTail,
} from "./_processo-penal";

type Credito = { descricao?: string; valor?: string };

const VICIOS: {
  name: string;
  label: ReturnType<typeof l>;
  text: (v: Values) => string;
}[] = [
  {
    name: "vSemProcesso",
    label: l("Sem processo disciplinar", "No disciplinary procedure"),
    text: (v) =>
      `O despedimento foi decidido sem a instauração de processo disciplinar e sem que ${A(v, "ao Autor", "à Autora")} fosse dada a possibilidade de se defender.`,
  },
  {
    name: "vSemJustaCausa",
    label: l(
      "Sem justa causa (os factos não são verdadeiros ou não são graves)",
      "No just cause",
    ),
    text: (v) =>
      `Os factos invocados ${R(v, "pelo Réu", "pela Ré")} não são verdadeiros nem, de todo o modo, revestem gravidade que torne impossível a manutenção da relação de trabalho, não constituindo justa causa de despedimento ${A(v, "do Autor", "da Autora")}.`,
  },
  {
    name: "vVerbal",
    label: l(
      "Despedimento verbal, sem decisão escrita",
      "Verbal dismissal, no written decision",
    ),
    text: () =>
      "O despedimento foi comunicado verbalmente, sem decisão escrita e fundamentada.",
  },
  {
    name: "vPrescricao",
    label: l(
      "Infracção prescrita ou prazos violados",
      "Offence time-barred or time limits breached",
    ),
    text: () =>
      "O procedimento disciplinar foi instaurado e decidido com violação dos prazos legais de prescrição da infracção e de caducidade.",
  },
  {
    name: "vDiscriminacao",
    label: l(
      "Motivos políticos, sindicais, religiosos ou assédio",
      "Political, union or religious reasons, or harassment",
    ),
    text: (v) =>
      `O verdadeiro motivo do despedimento foi ${str(v.motivoReal) || "discriminatório"}, o que torna o despedimento ilícito.`,
  },
];

const A = (v: Values, m: string, f: string) => papel(v, "autor", m, f);
const R = (v: Values, m: string, f: string) => papel(v, "reu", m, f);

function creditos(v: Values) {
  return (lineItems(v.creditos) as Credito[])
    .map((c) => ({ descricao: str(c.descricao), valor: money(c.valor) }))
    .filter((c) => c.descricao || c.valor != null);
}

const temDesp = (v: Values) => v.tipoAccao !== "creditos";
const temCred = (v: Values) => v.tipoAccao !== "despedimento";

export default defineTemplate({
  id: "peticao-laboral",
  family: "peca",
  official: "tribunal",
  letterhead: false,
  sections: [
    { id: "tribunal", title: l("Tribunal", "Court") },
    {
      id: "autor",
      title: l("Trabalhador (autor)", "Worker (claimant)"),
      personRole: "trabalhador",
    },
    {
      id: "reu",
      title: l("Empregador (réu)", "Employer (defendant)"),
      personRole: "outro",
    },
    { id: "contrato", title: l("Contrato de trabalho", "Employment contract") },
    { id: "despedimento", title: l("Despedimento", "Dismissal") },
    { id: "creditos", title: l("Créditos em dívida", "Amounts owed") },
    { id: "pedido", title: l("Pedido e prova", "Claim and evidence") },
    { id: "advogado", title: l("Advogado (opcional)", "Lawyer (optional)") },
    {
      id: "documento",
      title: l("Local, data e fecho", "Place, date and closing"),
    },
  ],
  fields: [
    ...courtFields("tribunal").map((f) =>
      f.name === "tribunal"
        ? {
            ...f,
            default: "Tribunal do Trabalho da Cidade de Maputo",
            placeholder: l(
              "Ex.: Tribunal do Trabalho da Província de Maputo; Secção Laboral do Tribunal Judicial da Província de Sofala",
              "E.g. Labour Court of Maputo Province",
            ),
            help: l(
              "Onde não houver Tribunal do Trabalho instalado, use a secção laboral do tribunal judicial.",
              "Where there is no labour court, use the labour section of the ordinary court.",
            ),
          }
        : f.name === "seccao"
          ? { ...f, placeholder: l("Ex.: 2.ª Secção", "E.g. 2nd Section") }
          : f,
    ),
    {
      name: "tipoAccao",
      type: "radio",
      section: "tribunal",
      label: l("Tipo de acção", "Type of action"),
      default: "ambos",
      options: [
        {
          value: "despedimento",
          label: l("Impugnação de despedimento", "Unfair dismissal"),
        },
        {
          value: "creditos",
          label: l(
            "Cobrança de créditos laborais",
            "Unpaid employment credits",
          ),
        },
        { value: "ambos", label: l("Despedimento e créditos", "Both") },
      ],
    },
    ...partyFields("autor", "autor").filter(
      (f) => !/(Tipo|Nuel|Representante)$/.test(f.name),
    ),
    ...partyFields("reu", "reu", { light: true, defaultTipo: "empresa" }),
    {
      name: "dataAdmissao",
      type: "date",
      section: "contrato",
      width: "half",
      required: true,
      label: l("Data de admissão", "Start date"),
    },
    {
      name: "categoria",
      type: "text",
      section: "contrato",
      width: "half",
      label: l("Categoria / função", "Job title"),
      placeholder: l("Ex.: motorista de pesados", "E.g. truck driver"),
    },
    {
      name: "salario",
      type: "money",
      section: "contrato",
      width: "half",
      required: true,
      label: l("Salário mensal", "Monthly salary"),
    },
    {
      name: "localTrabalho",
      type: "text",
      section: "contrato",
      width: "half",
      label: l("Local de trabalho", "Workplace"),
    },
    {
      name: "tipoContrato",
      type: "text",
      section: "contrato",
      label: l("Tipo de contrato (opcional)", "Type of contract (optional)"),
      placeholder: l(
        "Ex.: contrato por tempo indeterminado, celebrado por escrito",
        "E.g. open-ended written contract",
      ),
    },
    {
      name: "dataDespedimento",
      type: "date",
      section: "despedimento",
      width: "half",
      label: l("Data do despedimento", "Date of dismissal"),
      showIf: temDesp,
    },
    {
      name: "motivoInvocado",
      type: "text",
      section: "despedimento",
      label: l(
        "Motivo invocado pelo empregador",
        "Reason given by the employer",
      ),
      placeholder: l(
        "Ex.: alegadas faltas injustificadas",
        "E.g. alleged unjustified absences",
      ),
      showIf: temDesp,
    },
    ...VICIOS.map((x) => ({
      name: x.name,
      type: "toggle" as const,
      section: "despedimento",
      label: x.label,
      showIf: temDesp,
      default: x.name === "vSemJustaCausa",
    })),
    {
      name: "motivoReal",
      type: "text",
      section: "despedimento",
      label: l("Motivo real", "Real reason"),
      placeholder: l(
        "Ex.: a filiação do Autor no sindicato",
        "E.g. union membership",
      ),
      showIf: (v) => temDesp(v) && Boolean(v.vDiscriminacao),
    },
    {
      name: "opcao",
      type: "radio",
      section: "despedimento",
      label: l("O trabalhador quer", "The worker wants"),
      default: "reintegracao",
      options: [
        { value: "reintegracao", label: l("Ser reintegrado", "Reinstatement") },
        {
          value: "indemnizacao",
          label: l(
            "Indemnização em vez de reintegração",
            "Compensation instead",
          ),
        },
      ],
      showIf: temDesp,
    },
    {
      name: "indemnizacaoValor",
      type: "money",
      section: "despedimento",
      width: "half",
      label: l(
        "Indemnização pedida (opcional)",
        "Compensation claimed (optional)",
      ),
      showIf: (v) => temDesp(v) && v.opcao === "indemnizacao",
      help: l(
        "Calcule conforme a Lei do Trabalho (dias de salário por ano de antiguidade).",
        "Compute under the Labour Law.",
      ),
    },
    {
      name: "creditos",
      type: "lines",
      section: "creditos",
      label: l("Créditos", "Amounts owed"),
      addLabel: l("Acrescentar crédito", "Add item"),
      columns: [
        {
          name: "descricao",
          type: "text",
          label: l("Descrição", "Description"),
          placeholder: l(
            "Ex.: salários de Junho a Agosto de 2026",
            "E.g. June–August salaries",
          ),
        },
        { name: "valor", type: "money", label: l("Valor", "Amount") },
      ],
      default: [{ descricao: "", valor: "" }],
      showIf: temCred,
    },
    {
      name: "factos",
      type: "textarea",
      section: "pedido",
      rows: 5,
      label: l(
        "Outros factos (um artigo por linha)",
        "Other facts (one article per line)",
      ),
    },
    {
      name: "mediacao",
      type: "radio",
      section: "pedido",
      label: l("Houve mediação laboral?", "Was there labour mediation?"),
      default: "impasse",
      options: [
        {
          value: "impasse",
          label: l(
            "Sim, sem acordo (certidão de impasse)",
            "Yes, no agreement (deadlock certificate)",
          ),
        },
        { value: "nao", label: l("Não", "No") },
      ],
    },
    {
      name: "dataImpasse",
      type: "date",
      section: "pedido",
      width: "half",
      label: l(
        "Data da certidão de impasse",
        "Date of the deadlock certificate",
      ),
      showIf: (v) => v.mediacao === "impasse",
    },
    {
      name: "valorCausa",
      type: "money",
      section: "pedido",
      width: "half",
      label: l("Valor da causa (opcional)", "Value of the case (optional)"),
      help: l(
        "Se vazio, usa a soma dos créditos e da indemnização.",
        "If empty, the sum of the claims is used.",
      ),
    },
    {
      name: "testemunhas",
      type: "textarea",
      section: "pedido",
      rows: 3,
      label: l("Rol de testemunhas (opcional)", "Witnesses (optional)"),
    },
    {
      name: "documentos",
      type: "textarea",
      section: "pedido",
      rows: 3,
      label: l(
        "Documentos juntos (um por linha)",
        "Documents attached (one per line)",
      ),
      placeholder: l(
        "Contrato de trabalho\nCarta de despedimento\nRecibos de salário\nCertidão de impasse",
        "Contract\nDismissal letter\nPayslips\nDeadlock certificate",
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

  computed: (v) => {
    const c = creditos(v);
    const somaCred = temCred(v) ? c.reduce((s, x) => s + (x.valor ?? 0), 0) : 0;
    const ind =
      temDesp(v) && v.opcao === "indemnizacao"
        ? (money(v.indemnizacaoValor) ?? 0)
        : 0;
    const manual = money(v.valorCausa);
    const auto = somaCred + ind;
    return { somaCred, valor: manual ?? (auto > 0 ? auto : null) };
  },

  warnings: (v, ctx) => {
    const w: Warning[] = [];
    const imp = ctx.legal.value<{ meses: number }>("impugnacaoSancao");
    const presc = ctx.legal.value<{ meses: number }>(
      "prescricaoCreditosLaborais",
    );
    const susp = ctx.legal.value<{ dias: number }>("ppSuspensaoDespedimento");
    if (temDesp(v)) {
      w.push({
        level: "warning",
        field: "dataDespedimento",
        message: l(
          `A acção de impugnação do despedimento tem de ser proposta em ${imp.meses} meses a contar do despedimento (${cite("impugnacaoSancao")}). Para pedir já a suspensão do despedimento há ${susp.dias} dias (documento «Suspensão de despedimento»).`,
          `The dismissal must be challenged within ${imp.meses} months. An interim suspension may be requested within ${susp.dias} days.`,
        ),
      });
      if (
        v.dataDespedimento &&
        v.data &&
        addMonths(v.dataDespedimento, imp.meses) < v.data
      ) {
        w.push({
          level: "error",
          field: "dataDespedimento",
          message: l(
            "Já passou o prazo de impugnação contado da data do despedimento. Confirme se houve suspensão do prazo (por exemplo, mediação).",
            "The time limit from the dismissal date has passed. Check whether it was suspended (e.g. mediation).",
          ),
        });
      }
    }
    w.push({
      level: "info",
      message: l(
        `Os créditos laborais prescrevem ${presc.meses} meses após a cessação do contrato; o prazo suspende-se com a mediação, a arbitragem ou a acção (${cite("prescricaoCreditosLaborais")}). A mediação prévia é facultativa (${cite("ppTribunaisTrabalho")}).`,
        `Employment claims lapse ${presc.meses} months after the contract ends; mediation, arbitration or court action suspends the period. Prior mediation is optional.`,
      ),
    });
    if (ctx.computed.valor == null)
      w.push({
        level: "warning",
        field: "valorCausa",
        message: l(
          "Indique o valor da causa ou os créditos pedidos.",
          "Enter the value of the case or the amounts claimed.",
        ),
      });
    return w;
  },

  personName: (v) => v.autorNome,
  documentDate: (v) => v.data,

  blocks: (ctx) => {
    const v = ctx.values;
    const c = creditos(v);
    const despedimento = temDesp(v);
    const OAutor = A(v, "O Autor", "A Autora");
    const oAutor = A(v, "o Autor", "a Autora");
    const contrato = [
      `${OAutor} foi ${A(v, "admitido", "admitida")} ao serviço ${R(v, "do Réu", "da Ré")} em ${dateLong(v.dataAdmissao)}${str(v.tipoContrato) ? `, mediante ${str(v.tipoContrato).replace(/[.;]$/, "")}` : ""}${str(v.categoria) ? `, para exercer as funções de ${str(v.categoria).replace(/[.;]$/, "")}` : ""}${str(v.localTrabalho) ? `, em ${str(v.localTrabalho).replace(/[.;]$/, "")}` : ""}.`,
      `Auferia o salário mensal de ${moneyExt(v.salario)}.`,
      `${OAutor} sempre cumpriu com zelo e assiduidade as suas obrigações profissionais.`,
    ];
    const desp = despedimento
      ? [
          `Em ${dateLong(v.dataDespedimento)}, ${R(v, "o Réu", "a Ré")} pôs termo ao contrato de trabalho ${A(v, "do Autor", "da Autora")}${str(v.motivoInvocado) ? `, invocando ${str(v.motivoInvocado).replace(/[.;]$/, "")}` : ""}.`,
          ...VICIOS.filter((x) => v[x.name]).map((x) => x.text(v)),
        ]
      : [];
    const cred = temCred(v)
      ? c.map(
          (x) =>
            `${R(v, "O Réu", "A Ré")} não pagou ${A(v, "ao Autor", "à Autora")} ${x.descricao ? x.descricao.replace(/[.;]$/, "") : "____________________"}${x.valor != null ? `, no montante de ${formatMoney(x.valor)}` : ""}.`,
        )
      : [];
    const outros = artigos(v.factos);
    const mediacao =
      v.mediacao === "impasse"
        ? [
            `O litígio foi submetido a mediação laboral, que terminou sem acordo, conforme certidão de impasse${v.dataImpasse ? ` de ${dateLong(v.dataImpasse)}` : ""} que se junta.`,
          ]
        : [];
    const direito = [
      ...(despedimento
        ? [
            `O despedimento é ilícito, por ter sido promovido com inobservância das formalidades legais e sem justa causa, assistindo ${A(v, "ao Autor", "à Autora")} o direito de o impugnar (${cite("impugnacaoSancao")}).`,
            v.opcao === "indemnizacao"
              ? `Declarado ilícito o despedimento, ${oAutor} opta pela indemnização em substituição da reintegração, acrescida das remunerações vencidas desde o despedimento, nos limites legais (${cite("indemnizacaoDespedimentoIlicito")}).`
              : `Declarado ilícito o despedimento, ${oAutor} tem direito a ser ${A(v, "reintegrado", "reintegrada")} no seu posto de trabalho e a receber as remunerações vencidas desde o despedimento, nos limites legais, sem prejuízo da antiguidade (${cite("indemnizacaoDespedimentoIlicito")}).`,
          ]
        : []),
      ...(cred.length
        ? [
            `Os créditos reclamados resultam do contrato de trabalho e da sua violação, sendo exigíveis (${cite("prescricaoCreditosLaborais")}).`,
          ]
        : []),
    ];
    const secs: { heading?: string; items: string[] }[] = [
      { heading: "I — Do contrato de trabalho", items: contrato },
    ];
    const ROM = ["II", "III", "IV", "V", "VI"];
    let ri = 0;
    if (desp.length)
      secs.push({ heading: `${ROM[ri++]} — Do despedimento`, items: desp });
    if (cred.length)
      secs.push({
        heading: `${ROM[ri++]} — Dos créditos em dívida`,
        items: cred,
      });
    if (outros.length || mediacao.length)
      secs.push({
        heading: `${ROM[ri++]} — Outros factos`,
        items: [...outros, ...mediacao],
      });
    secs.push({
      heading: `${ROM[ri++]} — Do direito`,
      items: direito.length ? direito : ["____________________"],
    });

    const pedidos = [
      ...(despedimento
        ? [
            `Ser declarado ilícito o despedimento promovido ${R(v, "pelo Réu", "pela Ré")}`,
          ]
        : []),
      ...(despedimento && v.opcao !== "indemnizacao"
        ? [
            `Ser ${R(v, "o Réu condenado", "a Ré condenada")} a reintegrar ${oAutor} no seu posto de trabalho, sem prejuízo da sua antiguidade`,
          ]
        : []),
      ...(despedimento && v.opcao === "indemnizacao"
        ? [
            `Ser ${R(v, "o Réu condenado", "a Ré condenada")} a pagar ${A(v, "ao Autor", "à Autora")} a indemnização por despedimento ilícito${money(v.indemnizacaoValor) != null ? `, no montante de ${moneyExt(v.indemnizacaoValor)}` : ", a liquidar nos termos legais"}`,
          ]
        : []),
      ...(despedimento
        ? [
            `Ser ${R(v, "o Réu condenado", "a Ré condenada")} a pagar as remunerações vencidas desde a data do despedimento, nos limites legais`,
          ]
        : []),
      ...(cred.length
        ? [
            `Ser ${R(v, "o Réu condenado", "a Ré condenada")} a pagar ${A(v, "ao Autor", "à Autora")} os créditos laborais em dívida, no total de ${moneyExt(ctx.computed.somaCred)}`,
          ]
        : []),
      `Ser ${R(v, "o Réu condenado", "a Ré condenada")} no pagamento de juros de mora, à taxa legal, desde o vencimento de cada prestação até integral pagamento, e nas custas`,
    ];
    const docs = documentosList(v.documentos);
    const testemunhas = testemunhasList(v.testemunhas);
    const blocks: Block[] = [
      { type: "courtHeader", addressee: courtAddressee(v) },
      {
        type: "paragraph",
        id: "autor",
        text: `${partyDesc(v, "autor", { docBlank: true })}, adiante ${A(v, "designado", "designada")} por **${A(v, "Autor", "Autora")}**,`,
        en: "Identification of the worker (claimant).",
      },
      {
        type: "paragraph",
        id: "propoe",
        text: `vem${viaMandatario(v)} propor contra`,
        en: "brings against",
      },
      {
        type: "paragraph",
        id: "reu",
        text: `${partyDesc(v, "reu")}, adiante ${R(v, "designado", "designada")} por **${R(v, "Réu", "Ré")}**,`,
        en: "Identification of the employer (defendant).",
      },
      {
        type: "paragraph",
        id: "accao",
        align: "center",
        text: `a presente\n**ACÇÃO DECLARATIVA DE CONDENAÇÃO EMERGENTE DE CONTRATO DE TRABALHO**${despedimento ? "\n**(IMPUGNAÇÃO DE DESPEDIMENTO)**" : ""},`,
        en: "this action arising from an employment contract,",
      },
      {
        type: "paragraph",
        id: "fundamentos",
        text: "o que faz nos termos e com os fundamentos seguintes:",
        en: "on the following grounds:",
      },
      { type: "articulado", sections: secs },
      {
        type: "paragraph",
        id: "pedidoTitulo",
        align: "center",
        text: "**DO PEDIDO**",
        en: "Claim",
        keepWithNext: true,
      },
      {
        type: "paragraph",
        id: "nestesTermos",
        text: "Nestes termos e nos melhores de Direito que V. Ex.ª doutamente suprirá, deve a presente acção ser julgada procedente, por provada, e, em consequência:",
        en: "The action should be upheld and accordingly:",
        keepWithNext: true,
      },
      {
        type: "list",
        style: "alpha",
        items: pedidos.map(
          (p, i) => `${p}${i === pedidos.length - 1 ? "." : ";"}`,
        ),
      },
      {
        type: "paragraph",
        id: "citacao",
        text: `Para tanto, requer a V. Ex.ª se digne ordenar a citação ${R(v, "do Réu", "da Ré")} para contestar, querendo, no prazo e sob a cominação legais, seguindo-se os ulteriores termos até final.`,
        en: "The worker asks the court to order service on the employer.",
      },
      linePara(
        "valor",
        "Valor",
        `${moneyExt(ctx.computed.valor)}.`,
        "Value of the case.",
      ),
      linePara(
        "junta",
        "Junta",
        `${juntaText({ procuracao: Boolean(v.viaAdvogado), documentos: docs.length })}.`,
        "Attached documents.",
        !testemunhas.length,
      ),
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
        columns: [partySignature(v, "autor", OAutor)],
      },
    );
    if (docs.length)
      blocks.push({
        type: "annexList",
        title: "Documentos juntos",
        items: docs,
      });
    return keepTail(blocks, "citacao");
  },
});
