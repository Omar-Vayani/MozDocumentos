// Legal values for the "advocacia" documents. Keys must not clash with other files.
//
// Sources: Tribunal Supremo, 1.ª Secção Cível, Proc. 93/2022-C (prazo de
// contestação; procuração forense com reconhecimento presencial); Acórdão do
// Conselho Constitucional n.º 11/CC/2020 (alçadas, forma de processo); Lei n.º
// 24/2007 (LOJ) alterada pela Lei n.º 11/2018; Lei n.º 28/2009 (EOAM); Leis n.º
// 24/2019 e 25/2019 (CP e CPP). Anything not read in an official text is
// marked 'confirm' and carries no article number.
import type { LawInfo, LegalEntryDef } from '../types';

const V = '2026-10-13';
const TS_93_2022 = 'https://www.ts.gov.mz/wp-content/uploads/2024/08/Ac-Proc-93-2022-C.pdf';
const CC_11_2020 = 'https://cconstitucional.org.mz/wp-content/uploads/2025/08/ACORDAO-n.11CC.-2020.pdf';

export const LAWS_ADVOCACIA = {
  cpcMz: {
    short: 'Código de Processo Civil',
    cite: 'do Código de Processo Civil',
    title:
      'Código de Processo Civil (Decreto-Lei n.º 44 129, de 28 de Dezembro de 1961), revisto pelo Decreto-Lei n.º 1/2005, de 27 de Dezembro, e pelo Decreto-Lei n.º 1/2009, de 24 de Abril',
  },
  lojMz: {
    short: 'Lei da Organização Judiciária',
    cite: 'da Lei n.º 24/2007, de 20 de Agosto (Lei da Organização Judiciária)',
    title: 'Lei n.º 24/2007, de 20 de Agosto — Lei da Organização Judiciária, alterada pelas Leis n.º 24/2014 e n.º 11/2018, de 3 de Outubro',
    url: 'https://atlascplp.csm.org.pt/assets/docs/Mo%C3%A7ambique%20-%20Lei%20n%C2%BA%2011.2018-altera%C3%A7%C3%A3o%20a%20Lei%20de%20Organiza%C3%A7%C3%A3o%20Judicial.pdf',
  },
  eoam2009: {
    short: 'Estatuto da Ordem dos Advogados',
    cite: 'do Estatuto da Ordem dos Advogados de Moçambique',
    title: 'Estatuto da Ordem dos Advogados de Moçambique, aprovado pela Lei n.º 28/2009, de 29 de Setembro',
    url: 'https://www.dlapiperafrica.com/export/sites/africa/mozambique/insights/legislation-series/mozambican-bar-association/downloads/Lei_28_2009.pdf_2063069299.pdf',
  },
  codigoPenal2019: {
    short: 'Código Penal',
    cite: 'do Código Penal',
    title: 'Código Penal, aprovado pela Lei n.º 24/2019, de 24 de Dezembro (em vigor desde 21 de Junho de 2020)',
    url: 'https://reformar.co.mz/documentos-diversos/lei-24-2019-lei-de-revisao-do-codigo-penal.pdf',
  },
  cpp2019: {
    short: 'Código de Processo Penal',
    cite: 'do Código de Processo Penal',
    title: 'Código de Processo Penal, aprovado pela Lei n.º 25/2019, de 26 de Dezembro, alterado pela Lei n.º 18/2020, de 23 de Dezembro',
    url: 'https://reformar.co.mz/documentos-diversos/lei-25-2019-lei-de-revisao-do-codigo-do-processo-penal.pdf',
  },
  codigoCustasJudiciais: {
    short: 'Código das Custas Judiciais',
    cite: 'do Código das Custas Judiciais',
    title: 'Código das Custas Judiciais (Decreto n.º 43 809, de 20 de Julho de 1961), na redacção do Decreto n.º 67/2014, de 5 de Novembro, e do Decreto n.º 10/2018',
  },
} satisfies Record<string, LawInfo>;

export const LEGAL_ADVOCACIA = {
  advPeticaoRequisitos: {
    title: { pt: 'Requisitos da petição inicial', en: 'Contents of a statement of claim' },
    summary: {
      pt: 'Na petição, o autor designa o tribunal, identifica as partes (nomes, residências e, sempre que possível, profissões), indica a forma do processo, expõe os factos e as razões de direito, formula o pedido e declara o valor da causa. A secretaria pode recusar a petição sem valor.',
      en: 'The claimant names the court, identifies the parties (names, residences and, where possible, occupations), states the form of process, sets out the facts and legal grounds, states the claim and declares the value of the case. The court office may refuse a claim with no value.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Numeração do Código de 1961 (art. 467.º) mantida em Moçambique; confirme no texto consolidado.',
      en: '1961 Code numbering (art. 467) kept in Mozambique; confirm in the consolidated text.',
    },
  },
  advFormaProcesso: {
    title: { pt: 'Forma do processo comum', en: 'Form of ordinary civil process' },
    summary: {
      pt: 'Se o valor da causa exceder a alçada do Tribunal Judicial de Província, emprega-se o processo ordinário; se a não exceder, o processo sumário. Acções sobre o estado das pessoas ou interesses imateriais seguem o processo ordinário.',
      en: 'If the value of the case exceeds the jurisdictional limit of the Provincial Court, ordinary process applies; otherwise summary process. Actions on personal status or non-pecuniary interests use ordinary process.',
    },
    law: 'cpcMz',
    article: 'art. 462.º',
    sourceUrl: CC_11_2020,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Redacção do Decreto-Lei n.º 1/2009, citada no Acórdão n.º 11/CC/2020. Não foi confirmado se o processo sumaríssimo subsiste.',
      en: 'Wording of Decree-Law 1/2009, quoted in Constitutional Council ruling 11/CC/2020. Whether summary-summary process survives was not confirmed.',
    },
  },
  advAlcadas: {
    title: { pt: 'Alçadas dos tribunais judiciais (cível)', en: 'Jurisdictional limits of the courts (civil)' },
    summary: {
      pt: 'Em matéria cível, a alçada do Tribunal Judicial de Província é de 50 vezes e a dos Tribunais Judiciais de Distrito de 25 vezes o salário mínimo nacional da Função Pública.',
      en: 'In civil matters, the Provincial Court’s limit is 50 times and the District Courts’ limit 25 times the national public-service minimum wage.',
    },
    law: 'lojMz',
    value: { provincia: 50, distrito: 25, sectorSalario: 'Função pública' },
    sourceUrl: CC_11_2020,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Art. 38 da LOJ, na redacção da Lei n.º 11/2018, lido em extracto do Boletim da República e citado no Acórdão n.º 11/CC/2020. O salário mínimo da Função Pública usado é o da tabela de salários mínimos (Definições).',
      en: 'Wording of Law 11/2018, read in an extract of the Gazette. The public-service minimum wage is taken from the minimum wage table (Settings).',
    },
  },
  advPrazoContestacao: {
    title: { pt: 'Prazo para contestar (processo ordinário)', en: 'Time limit for the defence (ordinary process)' },
    summary: {
      pt: 'Em processo ordinário, o réu pode contestar no prazo de 20 dias a contar da citação. O prazo do processo sumário não foi confirmado.',
      en: 'In ordinary process the defendant may file a defence within 20 days of service. The summary-process period was not confirmed.',
    },
    law: 'cpcMz',
    article: 'art. 486.º, n.º 1,',
    value: { ordinario: 20 },
    sourceUrl: TS_93_2022,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Confirmado pelo Tribunal Supremo (Proc. 93/2022-C). A incompetência relativa deve ser arguida no mesmo prazo. Confirme as regras de contagem (dilação, férias judiciais).',
      en: 'Confirmed by the Supreme Court (case 93/2022-C). Relative lack of jurisdiction must be raised within the same period. Confirm counting rules (extensions, court holidays).',
    },
  },
  advMandatoForense: {
    title: { pt: 'Procuração forense — forma', en: 'Litigation power of attorney — form' },
    summary: {
      pt: 'O mandato judicial pode ser conferido por documento particular assinado pelo mandante com reconhecimento presencial da assinatura perante notário. O Tribunal Supremo considerou válida a procuração forense feita nesses termos.',
      en: 'A litigation mandate may be given by a private document signed by the client, with the signature certified in person by a notary. The Supreme Court held such a power of attorney valid.',
    },
    law: 'cpcMz',
    article: 'art. 35.º, al. a),',
    sourceUrl: TS_93_2022,
    lastVerified: V,
    confidence: 'verified',
    note: {
      pt: 'Conjugado com os arts. 120.º, n.º 1, 153.º e 155.º, n.º 2, do Código do Notariado (Acórdão do TS, Proc. 93/2022-C).',
      en: 'Read with arts. 120(1), 153 and 155(2) of the Notarial Code (Supreme Court, case 93/2022-C).',
    },
  },
  advPoderesEspeciais: {
    title: { pt: 'Poderes especiais do mandatário', en: 'Special powers of the lawyer' },
    summary: {
      pt: 'O advogado só pode confessar a acção, transigir sobre o seu objecto e desistir do pedido ou da instância se a procuração o autorizar expressamente.',
      en: 'The lawyer may only admit the claim, settle it or withdraw the claim or the proceedings if the power of attorney expressly allows it.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 37.º na numeração de 1961; confirme no texto em vigor.', en: 'Art. 37 in the 1961 numbering; confirm in the text in force.' },
  },
  advSubstabelecimento: {
    title: { pt: 'Substabelecimento', en: 'Delegation of powers' },
    summary: {
      pt: 'O procurador só pode fazer-se substituir (substabelecer) se o representado o permitir ou a faculdade resultar do conteúdo da procuração. O substabelecimento com reserva não exclui o substabelecente.',
      en: 'An attorney may only delegate to another if the principal allows it or the power of attorney implies it. Delegation “with reservation” keeps the original attorney’s powers.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 264.º do Código Civil de 1966; confirme.', en: 'Art. 264 of the 1966 Civil Code; confirm.' },
  },
  advQuotaLitis: {
    title: { pt: 'Proibição da quota litis', en: 'Ban on contingency (quota litis) fees' },
    summary: {
      pt: 'É proibido ao advogado celebrar pacto de quota litis e repartir honorários. Não constitui quota litis a fixação prévia dos honorários, ainda que em percentagem, em função do valor da causa.',
      en: 'Lawyers may not agree contingency fees (a share of what is won) or share fees. Fixing the fee in advance, even as a percentage of the value of the case, is not quota litis.',
    },
    law: 'eoam2009',
    sourceUrl: 'https://www.kufunda.net/publicdocs/Estatuto-da-Ordem-de-Advogados-de-Mocambique-actual.pdf',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Numeração lida numa cópia consolidada não oficial.', en: 'Numbering read in an unofficial consolidated copy.' },
  },
  advProvisaoHonorarios: {
    title: { pt: 'Provisão por conta de honorários', en: 'Advance on fees' },
    summary: {
      pt: 'É admissível o ajuste prévio de honorários. O advogado pode exigir, a título de provisão, quantias por conta dos honorários, que não devem exceder metade do total; a falta de pagamento permite-lhe renunciar ao mandato.',
      en: 'Fees may be agreed in advance. The lawyer may ask for an advance on account of fees, not exceeding half of the total; if it is not paid, the lawyer may withdraw.',
    },
    law: 'eoam2009',
    value: 0.5,
    lastVerified: V,
    confidence: 'confirm',
    note: {
      pt: 'Regra lida no texto do Estatuto; número do artigo por confirmar.',
      en: 'Rule read in the Statute’s text; article number to be confirmed.',
    },
  },
  advPrescricaoHonorarios: {
    title: { pt: 'Prescrição presuntiva dos honorários', en: 'Presumptive limitation of professional fees' },
    summary: {
      pt: 'Prescrevem no prazo de dois anos os créditos pelos serviços prestados no exercício de profissões liberais e pelo reembolso das despesas correspondentes.',
      en: 'Claims for services rendered in a liberal profession, and for the related expenses, are presumed paid after two years.',
    },
    law: 'codigoCivil',
    value: 2,
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 317.º, al. c), do Código Civil de 1966; confirme.', en: 'Art. 317(c) of the 1966 Civil Code; confirm.' },
  },
  advPrescricaoOrdinaria: {
    title: { pt: 'Prescrição ordinária', en: 'General limitation period' },
    summary: {
      pt: 'O prazo ordinário de prescrição é de vinte anos. Prescrevem em cinco anos, entre outros, as rendas, os juros e outras prestações periodicamente renováveis.',
      en: 'The general limitation period is twenty years. Rents, interest and other periodic payments lapse after five years.',
    },
    law: 'codigoCivil',
    value: { ordinaria: 20, periodicas: 5 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 309.º e 310.º do Código Civil de 1966; confirme.', en: 'Arts. 309 and 310 of the 1966 Civil Code; confirm.' },
  },
  advTransaccao: {
    title: { pt: 'Transacção', en: 'Settlement' },
    summary: {
      pt: 'Transacção é o contrato pelo qual as partes previnem ou terminam um litígio mediante recíprocas concessões. A transacção extrajudicial consta de documento escrito, ou de escritura pública quando dela possa derivar efeito para o qual a escritura seja exigida.',
      en: 'A settlement is a contract by which the parties prevent or end a dispute through mutual concessions. An out-of-court settlement is made in writing, or by notarial deed when it has effects that require a deed.',
    },
    law: 'codigoCivil',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Arts. 1248.º a 1250.º do Código Civil de 1966; confirme.', en: 'Arts. 1248 to 1250 of the 1966 Civil Code; confirm.' },
  },
  advHomologacaoTransaccao: {
    title: { pt: 'Transacção no processo', en: 'Settlement of a pending case' },
    summary: {
      pt: 'A confissão, a desistência e a transacção podem fazer-se por documento ou por termo no processo; sendo válidas, são homologadas por sentença, que põe fim à causa.',
      en: 'Admission, withdrawal and settlement may be made by document or by a record in the case file; if valid, the court approves them by judgment, which ends the case.',
    },
    law: 'cpcMz',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Art. 300.º na numeração de 1961; confirme.', en: 'Art. 300 in the 1961 numbering; confirm.' },
  },
  advQueixa: {
    title: { pt: 'Queixa (crimes semi-públicos e particulares)', en: 'Criminal complaint (offences requiring a complaint)' },
    summary: {
      pt: 'Quando o procedimento criminal depender de queixa do ofendido ou de outras pessoas, estas devem dar conhecimento do facto ao Ministério Público. A queixa pode ser apresentada pelo titular do direito, por mandatário judicial ou por mandatário munido de poderes especiais.',
      en: 'Where prosecution depends on a complaint, the victim or other entitled persons must report the facts to the Public Prosecutor. The complaint may be filed by the person entitled, by their lawyer or by an attorney with special powers.',
    },
    law: 'cpp2019',
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Texto lido na Lei n.º 25/2019; número do artigo por confirmar.', en: 'Text read in Law 25/2019; article number to be confirmed.' },
  },
  advQueixaCaducidade: {
    title: { pt: 'Extinção do direito de queixa', en: 'Lapse of the right to complain' },
    summary: {
      pt: 'Nos crimes que dependem de queixa, o direito de queixa extingue-se passados 2 anos, se ao crime corresponder pena de prisão de limite máximo superior a 2 anos, e passado 1 ano nos restantes casos.',
      en: 'For offences requiring a complaint, the right to complain lapses after 2 years if the maximum prison term exceeds 2 years, and after 1 year otherwise.',
    },
    law: 'codigoPenal2019',
    value: { penaGrave: 2, restantes: 1 },
    lastVerified: V,
    confidence: 'confirm',
    note: { pt: 'Lido em extracto do texto; artigo e contagem por confirmar.', en: 'Read in an extract of the text; article and counting to be confirmed.' },
  },
  advCustasJudiciais: {
    title: { pt: 'Custas judiciais', en: 'Court fees' },
    summary: {
      pt: 'A taxa de justiça, os preparos e as custas são calculados pela secretaria do tribunal nos termos do Código das Custas Judiciais. O documento não calcula estes valores.',
      en: 'Court fees, advance payments and costs are calculated by the court office under the Court Fees Code. This document does not calculate them.',
    },
    law: 'codigoCustasJudiciais',
    lastVerified: V,
    confidence: 'confirm',
  },
} satisfies Record<string, LegalEntryDef>;
