// Legal values for the "familia" documents (family, succession, leases, private
// property and everyday private contracts). Keys must be unique across all legal
// files: every new key starts with `fam`.
//
// Civil Code rules are those of the 1966 Code as applied in Mozambique (numbering
// of 1966, given only in the notes). Succession is governed by Lei n.º 23/2019,
// which revoked Book V of the Civil Code. The primary texts could not be read in
// this review, so every new entry is 'confirm' and prints no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-14';

export const LAWS_FAMILIA = {
  famLei23_2019Sucessoes: {
    short: 'Lei das Sucessões',
    cite: 'da Lei das Sucessões',
    title: 'Lei n.º 23/2019, de 23 de Dezembro — Lei das Sucessões (revoga o Livro V do Código Civil)',
  },
  famRegistoAutomovel: {
    short: 'Registo Automóvel',
    cite: 'do regime do registo automóvel',
    title: 'Regime do registo de propriedade automóvel em vigor em Moçambique (Conservatória do Registo Automóvel)',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_FAMILIA = {
  // ------------------------------------------------------------------ Family
  famDivorcioNaoLitigioso: {
    title: { pt: 'Divórcio não litigioso', en: 'Uncontested divorce' },
    summary: {
      pt: 'O divórcio não litigioso (por mútuo consentimento) é requerido pelos dois cônjuges, sem indicar a causa, na Conservatória do Registo Civil da área da residência. O pedido é acompanhado dos acordos sobre o exercício do poder parental dos filhos menores, os alimentos ao cônjuge que deles careça e o destino da casa de morada de família, e da relação dos bens comuns. O conservador verifica se os acordos protegem os filhos e pode sugerir alterações.',
      en: 'An uncontested divorce (by mutual consent) is requested by both spouses, without stating grounds, at the Civil Registry of their area of residence. It is filed with the agreements on parental responsibilities for minor children, maintenance for a spouse in need and the family home, and a list of the joint assets. The registrar checks that the agreements protect the children and may suggest changes.',
    },
    law: 'leiFamilia22_2019',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Fontes secundárias indicam o art. 201 da Lei n.º 22/2019 para o conteúdo dos acordos. Confirme na conservatória se há tempo mínimo de casamento ou de separação e qual o prazo de reflexão.',
      en: 'Secondary sources cite art. 201 of Law 22/2019 for the agreements. Check with the registry whether a minimum length of marriage or separation and a reflection period apply.',
    },
  },
  famAlimentos: {
    title: { pt: 'Obrigação de alimentos', en: 'Maintenance obligation' },
    summary: {
      pt: 'Estão obrigados a prestar alimentos, entre outros, o cônjuge ou ex-cônjuge, os pais aos filhos (também maiores que não tenham completado a formação, na medida em que for razoável) e os filhos aos pais. Os alimentos compreendem o sustento, a habitação, o vestuário, a saúde e a educação, e são fixados em função das necessidades de quem os recebe e das possibilidades de quem os presta. Podem ser alterados quando as circunstâncias mudarem. O direito a alimentos não pode ser renunciado, embora as prestações vencidas possam sê-lo.',
      en: 'Those bound to pay maintenance include a spouse or former spouse, parents towards children (including adult children still in education, where reasonable) and children towards parents. Maintenance covers food, housing, clothing, health and education, and is set by the recipient’s needs and the payer’s means. It can be changed when circumstances change. The right itself cannot be waived, although past instalments can.',
    },
    law: 'leiFamilia22_2019',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Artigos da Lei n.º 22/2019 por confirmar.', en: 'Articles of Law 22/2019 to be confirmed.' },
  },
  famCasaMoradaFamilia: {
    title: { pt: 'Casa de morada de família', en: 'Family home' },
    summary: {
      pt: 'No divórcio, os cônjuges acordam a quem fica a casa de morada de família. Sendo arrendada, o arrendamento pode ser transmitido ou concentrado num deles, o que deve ser comunicado ao senhorio. Sendo própria ou comum, pode ser atribuída a um dos cônjuges até à partilha, com ou sem compensação. Na falta de acordo, decide o tribunal, atendendo às necessidades de cada um e ao interesse dos filhos.',
      en: 'On divorce the spouses agree who keeps the family home. If it is rented, the lease may pass to one of them, and the landlord must be told. If it is owned, it may be assigned to one spouse until the division of property, with or without compensation. Failing agreement the court decides, considering each spouse’s needs and the children’s interest.',
    },
    law: 'leiFamilia22_2019',
    lastVerified: V,
    confidence: 'confirm',
  },
  famRegimeBens: {
    title: { pt: 'Regimes de bens do casamento', en: 'Matrimonial property regimes' },
    summary: {
      pt: 'Na falta de convenção antenupcial, o casamento rege-se pela comunhão de adquiridos: são comuns os bens adquiridos a título oneroso depois do casamento e próprios os que cada cônjuge tinha antes ou recebeu por doação ou herança. Os cônjuges podem convencionar a comunhão geral ou a separação de bens. Na partilha, cada cônjuge recebe a sua meação nos bens comuns.',
      en: 'Without a prenuptial agreement, marriage follows community of acquired property: assets bought after the marriage are joint; assets each spouse had before or received by gift or inheritance are their own. Spouses may agree full community or separate property. On division, each spouse takes half of the joint assets.',
    },
    law: 'leiFamilia22_2019',
    lastVerified: V,
    confidence: 'confirm',
  },
  famEntregaMenor: {
    title: { pt: 'Entrega de menor a terceiro', en: 'Entrusting a child to another person' },
    summary: {
      pt: 'Os pais podem confiar temporariamente o filho menor a um familiar ou a outra pessoa da sua confiança, que fica com os cuidados do dia-a-dia. Esta entrega não transfere o poder parental: os pais continuam responsáveis e podem revogá-la a todo o tempo. A confiança do menor a terceira pessoa com carácter duradouro, a tutela ou a delegação do poder parental exigem decisão do tribunal de menores.',
      en: 'Parents may temporarily entrust a minor child to a relative or another trusted person, who handles day-to-day care. This does not transfer parental authority: the parents remain responsible and may revoke it at any time. Lasting placement with a third person, guardianship or delegation of parental authority require a juvenile court decision.',
    },
    law: 'otmLei8_2008',
    lastVerified: V,
    confidence: 'confirm',
  },
  famTrabalhoMenores: {
    title: { pt: 'Trabalho de menores', en: 'Work by minors' },
    summary: {
      pt: 'O menor com idade mínima de admissão ao emprego só pode celebrar contrato de trabalho com autorização do seu representante legal, e não pode prestar trabalhos que prejudiquem a sua saúde, a sua educação ou o seu desenvolvimento.',
      en: 'A minor above the minimum working age may only sign an employment contract with the legal representative’s authorisation, and may not do work that harms their health, education or development.',
    },
    law: 'lei13_2023',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme a idade mínima e os artigos da Lei n.º 13/2023 sobre menores.', en: 'Confirm the minimum age and the articles of Law 13/2023 on minors.' },
  },

  // ------------------------------------------------------------------ Succession
  famTestamentoFormas: {
    title: { pt: 'Formas de testamento', en: 'Forms of will' },
    summary: {
      pt: 'O testamento é um acto pessoal, unilateral e revogável. As formas comuns são o testamento público, escrito pelo notário no seu livro de notas, e o testamento cerrado, escrito e assinado pelo testador (ou escrito por outra pessoa a seu rogo e assinado por ele) e depois aprovado pelo notário. Um documento particular assinado, sem a intervenção do notário, não vale como testamento público nem cerrado. Podem testar os maiores não interditos.',
      en: 'A will is a personal, unilateral and revocable act. The ordinary forms are the public will, written by the notary in the notarial book, and the closed (sealed) will, written and signed by the testator (or written by another at the testator’s request and signed by the testator) and then approved by the notary. A signed private document without the notary is neither. Adults not under guardianship may make a will.',
    },
    law: 'famLei23_2019Sucessoes',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Fontes secundárias indicam os arts. 185 a 192 da Lei n.º 23/2019 para o testamento cerrado. A lei admite também formas especiais (ológrafo e oral), cujos requisitos devem ser confirmados.',
      en: 'Secondary sources cite arts. 185–192 of Law 23/2019 for the closed will. The law also admits special forms (holograph and oral), whose requirements must be confirmed.',
    },
  },
  famLegitima: {
    title: { pt: 'Legítima e quota disponível', en: 'Reserved share and free share' },
    summary: {
      pt: 'Uma parte da herança (a legítima) está reservada por lei aos herdeiros legitimários — os filhos, o cônjuge e o companheiro da união de facto reconhecida. O testador só pode dispor livremente da parte restante (quota disponível). As disposições que ofendam a legítima são reduzidas.',
      en: 'Part of the estate (the reserved share) is kept by law for the forced heirs — children, spouse and recognised de facto partner. The testator may freely dispose only of the rest (the free share). Gifts by will that encroach on the reserved share are reduced.',
    },
    law: 'famLei23_2019Sucessoes',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Fontes secundárias indicam os arts. 136 e 138 da Lei n.º 23/2019 e uma legítima de três quartos da herança quando concorrem filhos e cônjuge ou companheiro. Confirme no Boletim da República.',
      en: 'Secondary sources cite arts. 136 and 138 of Law 23/2019 and a reserved share of three quarters of the estate when children and a spouse or partner survive. Confirm in the official gazette.',
    },
  },
  famPartilhaHeranca: {
    title: { pt: 'Partilha da herança', en: 'Division of an estate' },
    summary: {
      pt: 'Havendo acordo entre todos os herdeiros maiores e capazes, a partilha pode ser feita extrajudicialmente. A partilha que inclua imóveis ou outros bens sujeitos a registo é feita por escritura pública no notário, precedida da habilitação de herdeiros e do pagamento do imposto sobre sucessões. Havendo herdeiros menores, incapazes ou ausentes, ou falta de acordo, a partilha faz-se por inventário judicial. Até à partilha, a herança é administrada pelo cabeça-de-casal.',
      en: 'If all heirs are adults with capacity and agree, the estate can be divided out of court. A division including real estate or other registrable assets is made by notarial deed, after the declaration of heirs and payment of inheritance tax. With minor, incapable or absent heirs, or no agreement, the division goes through a court inventory. Until then the estate is managed by the administrator (cabeça-de-casal).',
    },
    law: 'famLei23_2019Sucessoes',
    lastVerified: V,
    confidence: 'confirm',
  },
  famPartilhaCasal: {
    title: { pt: 'Partilha dos bens do casal', en: 'Division of a couple’s property' },
    summary: {
      pt: 'Dissolvido o casamento ou a união de facto, os bens comuns são partilhados, recebendo cada um a sua meação, depois de pagas as dívidas comuns. A partilha de bens móveis pode constar de documento particular; a partilha que inclua imóveis ou viaturas exige a forma legal (escritura pública ou documento autenticado) e o registo.',
      en: 'When a marriage or de facto union ends, the joint assets are divided, each taking half after joint debts are paid. Movable property may be divided by private document; a division including real estate or vehicles needs the legal form (notarial deed or authenticated document) and registration.',
    },
    law: 'leiFamilia22_2019',
    lastVerified: V,
    confidence: 'confirm',
  },
  famHabilitacaoHerdeiros: {
    title: { pt: 'Habilitação de herdeiros', en: 'Declaration of heirs' },
    summary: {
      pt: 'Bancos, seguradoras e conservatórias só entregam bens do falecido aos herdeiros que provem essa qualidade por escritura de habilitação de herdeiros (no notário, com declarações do cabeça-de-casal ou de três pessoas idóneas e a certidão de óbito) ou por decisão judicial. Uma declaração particular dos familiares não substitui a habilitação.',
      en: 'Banks, insurers and registries release a deceased person’s assets only to heirs proven by a notarial declaration of heirs (made before a notary, with statements by the estate administrator or three reliable persons and the death certificate) or by a court decision. A private family declaration does not replace it.',
    },
    law: 'codigoNotariado',
    lastVerified: V,
    confidence: 'confirm',
  },
  famCabecaDeCasal: {
    title: { pt: 'Cabeça-de-casal', en: 'Estate administrator' },
    summary: {
      pt: 'A administração da herança, até à sua liquidação e partilha, cabe ao cabeça-de-casal — em regra o cônjuge ou companheiro sobrevivo e, na sua falta, o herdeiro indicado na lei. O cabeça-de-casal administra os bens, cobra créditos e presta contas aos herdeiros.',
      en: 'Until settlement and division, the estate is managed by the administrator — usually the surviving spouse or partner and otherwise the heir named by law — who manages the assets, collects debts and accounts to the heirs.',
    },
    law: 'famLei23_2019Sucessoes',
    lastVerified: V,
    confidence: 'confirm',
  },
  famImpostoSucessoes: {
    title: { pt: 'Imposto sobre sucessões', en: 'Inheritance tax' },
    summary: {
      pt: 'A transmissão de bens por morte está sujeita ao imposto sobre sucessões e doações, salvo isenção. O cabeça-de-casal deve participar o óbito e a relação de bens à Autoridade Tributária no prazo legal, no modelo oficial.',
      en: 'Assets passing on death are subject to inheritance and gift tax unless exempt. The estate administrator must report the death and the list of assets to the Tax Authority within the legal deadline, on the official form.',
    },
    law: 'codigoSucessoesDoacoes',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme o prazo de participação, as taxas e as isenções junto da Autoridade Tributária.', en: 'Confirm the reporting deadline, rates and exemptions with the Tax Authority.' },
  },

  // ------------------------------------------------------------------ Leases
  famDenunciaArrendamento: {
    title: { pt: 'Denúncia e oposição à renovação do arrendamento', en: 'Ending a lease at term' },
    summary: {
      pt: 'O arrendatário pode impedir a renovação do contrato, comunicando-o por escrito ao senhorio com a antecedência legal ou a acordada, se for maior. Nos arrendamentos urbanos, o senhorio não pode opor-se livremente à renovação: só pode denunciar o contrato nos casos previstos na lei (por exemplo, necessidade do imóvel para habitação própria ou obras de ampliação), e essa denúncia é feita por acção judicial. Fora do arrendamento urbano, a oposição à renovação segue a antecedência legal.',
      en: 'The tenant may stop the lease renewing by notifying the landlord in writing with the legal notice or the agreed notice, if longer. In urban leases the landlord cannot freely refuse renewal: termination is allowed only in cases set by law (e.g. needing the property as their own home or to enlarge the building), and is made through a court action. Outside urban leases, notice of non-renewal follows the legal periods.',
    },
    law: 'codigoCivil',
    value: { ate1AnoDias: 30, ate6AnosDias: 60, maisDe6AnosMeses: 6 },
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Corresponde aos arts. 1054.º, 1055.º, 1095.º a 1097.º do Código Civil de 1966 (antecedência: 30 dias para prazos de três meses a um ano, 60 dias de um a seis anos, seis meses para seis anos ou mais). Confirme o texto em vigor e a legislação especial do arrendamento.',
      en: 'Corresponds to arts. 1054, 1055 and 1095–1097 of the 1966 Civil Code (notice: 30 days for terms of three months to one year, 60 days for one to six years, six months for six years or more). Confirm the text in force and the special lease legislation.',
    },
  },
  famDespejoJudicial: {
    title: { pt: 'Despejo só por via judicial', en: 'Eviction only through the courts' },
    summary: {
      pt: 'A resolução do arrendamento por falta de pagamento da renda ou por outra violação do contrato pelo arrendatário tem de ser decretada pelo tribunal, em acção de despejo. O senhorio não pode, por si, mudar fechaduras, retirar bens ou cortar a água ou a energia para forçar a saída do inquilino.',
      en: 'Terminating a lease for non-payment or another breach by the tenant must be ordered by a court in an eviction action. The landlord may not change locks, remove belongings or cut water or power to force the tenant out.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde ao art. 1047.º do Código Civil de 1966.', en: 'Corresponds to art. 1047 of the 1966 Civil Code.' },
  },
  famMoraRenda: {
    title: { pt: 'Mora no pagamento da renda', en: 'Late payment of rent' },
    summary: {
      pt: 'Se o arrendatário se atrasar, o senhorio pode exigir, além das rendas em atraso, uma indemnização igual a metade do que for devido, salvo se pedir a resolução do contrato com base na falta de pagamento. O direito à indemnização e à resolução cessa se o arrendatário pagar as rendas em atraso nos primeiros dias da mora.',
      en: 'If the tenant pays late, the landlord may claim, besides the overdue rent, compensation equal to half of the amount due, unless the landlord seeks termination for non-payment. The right to compensation and termination lapses if the tenant pays the arrears within the first days of default.',
    },
    law: 'codigoCivil',
    value: { indemnizacao: 0.5, purgaDias: 8 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde ao art. 1041.º do Código Civil de 1966 (indemnização de 50%; purga da mora em 8 dias).', en: 'Corresponds to art. 1041 of the 1966 Civil Code (50% compensation; default cured within 8 days).' },
  },
  famObrigacoesLocador: {
    title: { pt: 'Obrigações do senhorio', en: 'Landlord’s obligations' },
    summary: {
      pt: 'O senhorio deve entregar o imóvel e assegurar ao inquilino o seu gozo para o fim a que se destina, fazendo as reparações e obras de conservação necessárias. Se não as fizer depois de interpelado, e havendo urgência, o inquilino pode fazê-las e exigir o reembolso, nos termos da lei.',
      en: 'The landlord must hand over the property and ensure the tenant can use it for the agreed purpose, carrying out necessary repairs and maintenance. If the landlord fails to after being asked, and the matter is urgent, the tenant may do them and claim reimbursement as the law allows.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1031.º e 1036.º do Código Civil de 1966.', en: 'Corresponds to arts. 1031 and 1036 of the 1966 Civil Code.' },
  },
  famActualizacaoRenda: {
    title: { pt: 'Actualização da renda', en: 'Rent increases' },
    summary: {
      pt: 'Não foi encontrado em Moçambique um coeficiente legal anual de actualização das rendas. A renda só pode ser actualizada nos termos previstos no contrato ou por acordo das partes; uma subida que o inquilino não aceite não o obriga durante o prazo em curso.',
      en: 'No statutory annual rent-increase coefficient was found in Mozambique. Rent may only be increased as the contract provides or by agreement; an increase the tenant does not accept does not bind them during the current term.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
  },
  famSublocacao: {
    title: { pt: 'Subarrendamento', en: 'Subletting' },
    summary: {
      pt: 'O inquilino só pode subarrendar com autorização do senhorio, e deve comunicar-lhe o subarrendamento por escrito. A renda do subarrendamento não pode exceder a renda do arrendamento em mais do que a percentagem fixada na lei. O subarrendamento caduca com a extinção do arrendamento.',
      en: 'The tenant may sublet only with the landlord’s authorisation and must notify the landlord in writing. The sublease rent may not exceed the head-lease rent by more than the percentage set by law. The sublease ends when the head lease ends.',
    },
    law: 'codigoCivil',
    value: { acrescimoMax: 0.2 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1038.º, al. f) e g), 1060.º a 1063.º do Código Civil de 1966 (acréscimo máximo de 20%).', en: 'Corresponds to arts. 1038(f)(g) and 1060–1063 of the 1966 Civil Code (maximum 20% mark-up).' },
  },
  famRestituicaoImovel: {
    title: { pt: 'Restituição do imóvel', en: 'Returning the property' },
    summary: {
      pt: 'Findo o contrato, o inquilino restitui o imóvel no estado em que o recebeu, ressalvadas as deteriorações inerentes a uma utilização normal e prudente. Na falta de documento sobre o estado do imóvel na entrega, presume-se que foi entregue em bom estado; por isso convém lavrar um auto de entrega e de vistoria, com fotografias e leituras dos contadores.',
      en: 'At the end the tenant returns the property in the condition received, apart from normal wear. Without a record of the condition at hand-over, the property is presumed to have been delivered in good condition — hence the value of a signed check-in/check-out report with photos and meter readings.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1038.º, al. i), e 1043.º do Código Civil de 1966.', en: 'Corresponds to arts. 1038(i) and 1043 of the 1966 Civil Code.' },
  },

  // ------------------------------------------------------------------ Other contracts
  famFianca: {
    title: { pt: 'Fiança', en: 'Personal guarantee' },
    summary: {
      pt: 'O fiador garante com o seu património a obrigação de outra pessoa. A vontade de prestar fiança deve ser expressamente declarada, pela forma exigida para a obrigação principal. Salvo renúncia ao benefício da excussão, o fiador pode recusar pagar enquanto o credor não tiver executado os bens do devedor. A fiança não pode exceder a dívida principal.',
      en: 'A guarantor backs another person’s obligation with their own assets. The intention must be expressly declared, in the form required for the main obligation. Unless the guarantor waives the benefit of prior enforcement, they may refuse to pay until the creditor has enforced against the debtor’s assets. The guarantee cannot exceed the main debt.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 627.º a 654.º do Código Civil de 1966.', en: 'Corresponds to arts. 627–654 of the 1966 Civil Code.' },
  },
  famCessaoPosicao: {
    title: { pt: 'Cessão da posição contratual', en: 'Assignment of a contract' },
    summary: {
      pt: 'Num contrato com prestações recíprocas, qualquer das partes pode transmitir a terceiro a sua posição contratual, desde que o outro contraente consinta, antes ou depois da cessão. A forma da cessão e as relações entre as partes seguem o tipo de negócio que lhe serve de base. O cedente garante ao cessionário a existência da posição contratual transmitida.',
      en: 'In a contract with mutual obligations, either party may transfer its contractual position to a third party if the other party consents, before or after the assignment. Form and relations follow the underlying transaction. The assignor guarantees that the position exists.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 424.º a 427.º do Código Civil de 1966.', en: 'Corresponds to arts. 424–427 of the 1966 Civil Code.' },
  },
  famDeposito: {
    title: { pt: 'Contrato de depósito', en: 'Deposit (safekeeping) contract' },
    summary: {
      pt: 'Uma parte entrega à outra uma coisa, móvel ou imóvel, para que a guarde e a restitua quando for exigida. O depositário deve guardar a coisa, não a usar sem autorização, avisar o depositante de qualquer perigo e restituí-la com os seus frutos. O depósito presume-se gratuito, salvo se o depositário o fizer por profissão. O depositante pode exigir a restituição a todo o tempo.',
      en: 'One party hands a thing to the other to keep and return on demand. The keeper must look after it, not use it without permission, warn the owner of any danger and return it with its fruits. Deposit is presumed free unless the keeper does it professionally. The owner may demand return at any time.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1185.º a 1206.º do Código Civil de 1966.', en: 'Corresponds to arts. 1185–1206 of the 1966 Civil Code.' },
  },
  famTroca: {
    title: { pt: 'Troca (permuta)', en: 'Exchange (barter)' },
    summary: {
      pt: 'A troca de uma coisa por outra segue, com as necessárias adaptações, as regras da compra e venda: cada parte é considerada vendedora da coisa que entrega e compradora da que recebe. Se as coisas trocadas tiverem valor diferente, a diferença pode ser paga em dinheiro (torna). A troca de imóveis exige a forma da venda de imóveis.',
      en: 'An exchange follows the sale rules, adapted: each party is the seller of what it gives and the buyer of what it receives. A difference in value may be paid in cash. Exchanging real estate requires the form of a property sale.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde ao art. 939.º do Código Civil de 1966.', en: 'Corresponds to art. 939 of the 1966 Civil Code.' },
  },
  famAluguer: {
    title: { pt: 'Aluguer de coisa móvel', en: 'Hire of movable goods' },
    summary: {
      pt: 'A locação de coisa móvel chama-se aluguer. O locatário paga o aluguer, usa a coisa com prudência e para o fim acordado, não a cede a terceiros sem autorização e restitui-a no fim no estado em que a recebeu, salvo o desgaste normal. O locador entrega a coisa em condições de servir e responde pelos seus vícios.',
      en: 'The lease of a movable thing is called hire. The hirer pays, uses the thing carefully for the agreed purpose, does not pass it on without consent and returns it in the condition received, apart from normal wear. The owner delivers it fit for use and answers for its defects.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 1022.º a 1063.º do Código Civil de 1966 (disposições gerais da locação).', en: 'Corresponds to arts. 1022–1063 of the 1966 Civil Code (general lease rules).' },
  },
  famAlteracaoContrato: {
    title: { pt: 'Alteração de contratos', en: 'Amending contracts' },
    summary: {
      pt: 'Os contratos só podem ser modificados por mútuo consentimento ou nos casos previstos na lei. A alteração deve revestir a forma exigida para o contrato inicial (por exemplo, escritura ou assinaturas reconhecidas quando o contrato as exigiu) e deve identificar claramente o contrato e as cláusulas alteradas.',
      en: 'Contracts may be changed only by mutual consent or where the law allows. The amendment must take the form required for the original contract (e.g. a deed or certified signatures where these were needed) and must clearly identify the contract and the clauses changed.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Corresponde aos arts. 221.º e 406.º do Código Civil de 1966.', en: 'Corresponds to arts. 221 and 406 of the 1966 Civil Code.' },
  },
  famVendaViatura: {
    title: { pt: 'Venda de viatura e registo', en: 'Sale of a vehicle and registration' },
    summary: {
      pt: 'A propriedade da viatura transmite-se com o contrato, mas a transmissão só produz efeitos perante terceiros depois de registada na Conservatória do Registo Automóvel. O comprador requer o registo com a declaração de venda assinada pelo vendedor, com as assinaturas reconhecidas, e os documentos da viatura. Até ao registo, o vendedor continua a figurar como proprietário e pode ser notificado por multas e acidentes.',
      en: 'Ownership passes with the contract but is effective against third parties only once registered at the Motor Vehicle Registry. The buyer applies with the sale declaration signed by the seller, with certified signatures, and the vehicle papers. Until then the seller still appears as owner and may receive fines and accident notices.',
    },
    law: 'famRegistoAutomovel',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Confirme o prazo para requerer o registo e os documentos exigidos na Conservatória do Registo Automóvel.', en: 'Confirm the registration deadline and the documents required at the Motor Vehicle Registry.' },
  },
} satisfies Record<string, LegalEntryDef>;
