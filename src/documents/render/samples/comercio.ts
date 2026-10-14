// Preview samples for the day-to-day business documents ("comercio").
import { company, contractor, person, type Issuer, type Sample } from './_profiles';

/** A retail shop (electronics and appliances). */
function shop(): Issuer {
  const { profile: p, assets } = company();
  Object.assign(p, {
    id: 'pv-shop',
    firma: 'Electro Sol Comercial, Lda',
    nuit: '400556677',
    nuel: '100778899',
    licenca: 'Alvará comercial n.º 2318/CMCM/2024',
    morada: { rua: 'Avenida 24 de Julho', numero: '845', bairro: 'Polana Cimento', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 21 499 120 · +258 84 499 1200',
    email: 'loja@electrosol.co.mz',
    website: 'www.electrosol.co.mz',
    representanteNome: 'Faizal Abdul Karim',
    representanteCargo: 'Gerente',
    banco: 'Millennium bim',
    nib: '000100000045678901257',
  });
  p.branding.accent = '#1f4e8c';
  return { profile: p, assets };
}

/** An accountant registered with OCAM. */
function accountant(): Issuer {
  const { profile: p, assets } = person();
  Object.assign(p, {
    id: 'pv-accountant',
    nome: 'Sónia Isabel Cossa',
    genero: 'F',
    estadoCivil: 'solteiro',
    docNumero: '110100556677B',
    nuit: '106677889',
    profissao: 'Contabilista Certificada',
    ordemProfissional: 'Ordem dos Contabilistas e Auditores de Moçambique',
    ordemNumero: 'CC-0841',
    morada: { rua: 'Avenida Karl Marx', numero: '1120', bairro: 'Central', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 84 601 2233',
    email: 'sonia.cossa@contas.co.mz',
  });
  return { profile: p, assets };
}

/** An agro-processor that buys from smallholders. */
function agro(): Issuer {
  const { profile: p, assets } = company();
  Object.assign(p, {
    id: 'pv-agro',
    firma: 'Lúrio Agro-Processamento, Lda',
    nuit: '400334455',
    nuel: '100445566',
    licenca: 'Licença industrial n.º 077/DPIC-NPL/2023',
    morada: { rua: 'Estrada Nacional n.º 8', numero: '', bairro: 'Muhala Expansão', cidade: 'Nampula', provincia: 'Nampula' },
    localPadrao: 'Nampula',
    telefones: '+258 26 218 400',
    email: 'compras@lurioagro.co.mz',
    representanteNome: 'Ernesto Muhate',
    representanteCargo: 'Director-Geral',
  });
  return { profile: p, assets };
}

export const SAMPLES: Sample[] = [
  {
    id: 'nota-de-encomenda',
    who: contractor,
    values: {
      ref: 'NE-2026/0147',
      refCotacao: 'COT-2026/389',
      fornecedorNome: 'Ferragens Matola Gare, Lda',
      fornecedorNuit: '400887766',
      fornecedorContacto: '+258 84 311 2200',
      fornecedorMorada: 'Estrada Nacional n.º 4, km 12, Matola Gare, Província de Maputo',
      itens: [
        { descricao: 'Cimento Portland 42,5 N (saco de 50 kg)', unidade: 'saco', quantidade: 320, precoUnitario: '640' },
        { descricao: 'Varão de aço nervurado 12 mm (barra de 12 m)', unidade: 'barra', quantidade: 180, precoUnitario: '1150' },
        { descricao: 'Bloco de cimento 15 × 20 × 40', unidade: 'un.', quantidade: 4000, precoUnitario: '38' },
        { descricao: 'Chapa de zinco IBR 0,47 mm × 3 m', unidade: 'chapa', quantidade: 96, precoUnitario: '1480' },
      ],
      descontoPct: 3,
      ivaRegime: 'acrescido',
      localEntrega: 'estaleiro da obra da Escola Primária de Boane',
      dataEntrega: '2026-10-20',
      pagamento: 'prazo',
      prazoPagamentoDias: 30,
      formaPagamento: 'transferência bancária',
      validadeDias: 7,
      observacoes: 'Entregas nos dias úteis, das 7h30 às 15h00.',
      requisitante: 'Eng.º Paulo Sitoe (Director de Obra)',
      autorizante: 'Ana Maria Machava',
      autorizanteCargo: 'Directora-Geral',
    },
  },
];



SAMPLES.push({
  id: 'ficha-de-cliente',
  who: shop,
  values: {
    ref: 'C-0412',
    clienteNome: 'Supermercado Bom Preço Xai-Xai, Lda',
    clienteNuit: '400772233',
    clienteNuel: '100991122',
    clienteLicenca: 'Alvará n.º 0871/CMXX/2022',
    clienteActividade: 'Comércio a retalho de produtos alimentares e electrodomésticos',
    clienteMorada: 'Avenida Samora Machel, n.º 210, Cidade de Xai-Xai, Gaza',
    clienteTelefone: '+258 84 702 3311',
    clienteEmail: 'geral@bompreco.co.mz',
    contactoNome: 'Dércio Langa (Compras)',
    contactoFacturas: 'contabilidade@bompreco.co.mz',
    representantes: [
      { nome: 'Abdul Rahim Ismail', cargo: 'Sócio-gerente', documento: 'BI 090100223344B', contacto: '+258 84 702 0001' },
      { nome: 'Dércio Langa', cargo: 'Responsável de compras', documento: 'BI 110100778899C', contacto: '+258 86 111 2233' },
    ],
    banco: 'BCI',
    nib: '000800001234567810150',
    limitePedido: '750000',
    prazoPagamentoDias: 30,
    volumeMensal: '400000',
    referencias: 'Merec Industries, Matola (+258 21 720 000)\nCDM Distribuição, Maputo (+258 84 300 1500)',
    fiador: true,
    fiadorNome: 'Abdul Rahim Ismail',
    fiadorDocNumero: '090100223344B',
    fiadorNuit: '101223344',
    fiadorMorada: 'Bairro 2, Rua 7, casa n.º 15, Cidade de Xai-Xai',
    fiadorLimite: '750000',
  },
});

SAMPLES.push({
  id: 'extracto-conta-corrente',
  who: shop,
  values: {
    ref: 'EXT-2026/0388',
    periodoInicio: '2026-09-01',
    periodoFim: '2026-09-30',
    clienteNome: 'Supermercado Bom Preço Xai-Xai, Lda',
    clienteNuit: '400772233',
    clienteCodigo: 'C-0412',
    clienteMorada: 'Avenida Samora Machel, n.º 210, Cidade de Xai-Xai, Gaza',
    clienteAtencao: 'Departamento de Contabilidade',
    saldoAnterior: '184500',
    movimentos: [
      { data: '2026-09-03', tipo: 'recibo', numero: 'RC 2026/0911', descricao: 'Pagamento da FT 2026/1532', vencimento: '', valor: '184500' },
      { data: '2026-09-05', tipo: 'factura', numero: 'FT 2026/1687', descricao: 'Televisores 43"', vencimento: '2026-10-05', valor: '256300' },
      { data: '2026-09-12', tipo: 'notaCredito', numero: 'NC 2026/0044', descricao: 'Devolução de 1 televisor', vencimento: '', valor: '18900' },
      { data: '2026-09-22', tipo: 'factura', numero: 'FT 2026/1791', descricao: 'Ventoinhas e micro-ondas', vencimento: '2026-10-22', valor: '97450' },
    ],
    prazoConferenciaDias: 15,
    mobileMoney: 'M-Pesa 84 499 1200',
    pedirConfirmacao: true,
  },
});

SAMPLES.push({
  id: 'condicoes-gerais-venda',
  who: shop,
  values: {
    ambito: 'ambos',
    clientes: 'consumidores',
    versaoData: '2026-10-01',
    validadeOrcamentoDias: 15,
    precosIva: 'incluido',
    pagamentoModo: 'entrega',
    reservaPropriedade: true,
    entregaRisco: 'entrega',
    garantiaMeses: 12,
    vendaDistancia: true,
    aceitacaoDias: 5,
    contactoReclamacoes: 'apoio@electrosol.co.mz ou +258 84 499 1200',
    linhaAceitacao: true,
  },
});

SAMPLES.push({
  id: 'politica-trocas-devolucoes',
  who: shop,
  values: {
    lojaNome: 'Electro Sol',
    garantiaMeses: 12,
    vendaDistancia: true,
    trocasSemDefeito: true,
    prazoTrocaDias: 7,
    formaTroca: 'produtoVale',
    excluir_software: true,
    excluir_recargas: true,
    contacto: '+258 84 499 1200 · apoio@electrosol.co.mz',
  },
});

SAMPLES.push({
  id: 'certificado-de-garantia',
  who: shop,
  values: {
    ref: 'GA-2026/0153',
    estadoProduto: 'novo',
    produto: 'Frigorífico combinado No Frost 320 L',
    marcaModelo: 'Hisense RB424N4',
    numeroSerie: 'HS424N4-2609-118734',
    dataCompra: '2026-10-12',
    facturaNumero: 'FT 2026/1802',
    clienteNome: 'Graça Mabunda Chissano',
    clienteContacto: '+258 82 456 7788',
    garantiaMeses: 24,
    localAssistencia: 'Avenida 24 de Julho, n.º 845, Maputo · +258 84 499 1200',
  },
});

SAMPLES.push({
  id: 'vale-oferta',
  who: shop,
  values: {
    tipo: 'oferta',
    valor: '2500',
    beneficiario: '',
    numeroInicial: 'VO-2026/0041',
    quantidade: 4,
    dataEmissao: '2026-10-12',
    validade: '2026-12-31',
    locais: 'Electro Sol, Avenida 24 de Julho, Maputo',
    utilizacao: 'parcial',
  },
});

SAMPLES.push({
  id: 'tabela-de-precos',
  who: shop,
  values: {
    titulo: 'Tabela de preços',
    dataVigor: '2026-11-01',
    itens: [
      { seccao: 'Frio', codigo: 'FR-320', descricao: 'Frigorífico combinado No Frost 320 L', unidade: 'un.', preco: '38900' },
      { seccao: 'Frio', codigo: 'AR-200', descricao: 'Arca congeladora horizontal 200 L', unidade: 'un.', preco: '21500' },
      { seccao: 'Imagem e som', codigo: 'TV-43', descricao: 'Televisor LED 43" Smart TV', unidade: 'un.', preco: '27800' },
      { seccao: 'Imagem e som', codigo: 'TV-55', descricao: 'Televisor LED 55" Smart TV 4K', unidade: 'un.', preco: '44900' },
      { seccao: 'Pequenos electrodomésticos', codigo: 'MO-20', descricao: 'Micro-ondas 20 L', unidade: 'un.', preco: '6450' },
      { seccao: 'Pequenos electrodomésticos', codigo: 'VE-16', descricao: 'Ventoinha de pé 16"', unidade: 'un.', preco: '2350' },
      { seccao: 'Energia', codigo: 'SO-1K', descricao: 'Kit solar 1 kW com bateria de lítio', unidade: 'kit', preco: '89500' },
      { seccao: 'Serviços', codigo: 'SV-01', descricao: 'Entrega em Maputo e Matola', unidade: 'entrega', preco: '500' },
      { seccao: 'Serviços', codigo: 'SV-02', descricao: 'Instalação de ar condicionado split até 12 000 BTU', unidade: 'serviço', preco: '4500' },
      { seccao: 'Serviços', codigo: 'SV-03', descricao: 'Diagnóstico técnico ao domicílio', unidade: 'visita', preco: '' },
    ],
    ivaTexto: 'incluido',
    alteracao: true,
    notaExtra: 'Pagamento por M-Pesa, e-Mola, cartão ou transferência. Preços válidos enquanto houver stock',
  },
});

SAMPLES.push({
  id: 'contrato-servicos-contabilidade',
  who: accountant,
  values: {
    clienteTipo: 'empresa',
    clienteEmpresaNome: 'Padaria e Pastelaria Estrela do Índico, Lda',
    clienteEmpresaNuit: '400665544',
    clienteEmpresaNuel: '100556644',
    clienteEmpresaSede: 'Avenida Eduardo Mondlane, n.º 1520, Bairro do Alto Maé, Maputo',
    clienteRepNome: 'Nádia Cristina Macamo',
    clienteRepCargo: 'sócia-gerente',
    serv_salarios: true,
    outrosServicos: 'Apoio no pedido de licenciamento simplificado junto do Balcão de Atendimento Único',
    diaEntregaDocumentos: 5,
    acessoPlataformas: 'credenciais',
    avenca: '12500',
    avencaIva: true,
    diaPagamento: 10,
    honorarioFecho: '35000',
    dataInicio: '2026-11-01',
    duracaoMeses: 12,
    renovacao: true,
    avisoDenunciaDias: 60,
    devolucaoDias: 30,
  },
});

SAMPLES.push({
  id: 'protocolo-entrega-documentos',
  who: accountant,
  values: {
    modo: 'documentos',
    ref: 'PE-2026/0093',
    hora: '10h30',
    referencia: 'documentos contabilísticos de Setembro de 2026',
    entreguePor: 'Nádia Cristina Macamo',
    entreguePorEntidade: 'Padaria e Pastelaria Estrela do Índico, Lda',
    recebidoPor: 'Sónia Isabel Cossa',
    recebidoPorEntidade: 'Contabilista Certificada (OCAM n.º CC-0841)',
    documentos: [
      { descricao: 'Facturas emitidas (cópias)', periodo: 'FT 2026/0611 a 0789', quantidade: 179, original: 'copia', observacoes: '' },
      { descricao: 'Facturas de fornecedores', periodo: 'Setembro de 2026', quantidade: 64, original: 'original', observacoes: 'Inclui EDM e FIPAG' },
      { descricao: 'Extractos bancários BCI e Millennium bim', periodo: 'Setembro de 2026', quantidade: 6, original: 'copia', observacoes: '' },
      { descricao: 'Extracto M-Pesa empresarial', periodo: 'Setembro de 2026', quantidade: 3, original: 'copia', observacoes: '' },
      { descricao: 'Folha de salários e recibos assinados', periodo: 'Setembro de 2026', quantidade: 14, original: 'original', observacoes: '' },
      { descricao: 'Contrato de arrendamento do armazém', periodo: 'Aditamento n.º 2', quantidade: 2, original: 'copia', observacoes: 'Nova renda' },
    ],
  },
});

SAMPLES.push({
  id: 'protocolo-entrega-documentos',
  name: 'protocolo-recepcao-mercadoria',
  who: contractor,
  values: {
    modo: 'mercadoria',
    ref: 'RM-2026/0211',
    hora: '14h15',
    docFiscalTipo: 'guia de remessa',
    docFiscalNumero: 'GR 2026/03321',
    encomendaNumero: 'NE-2026/0147',
    entreguePor: 'Alberto Chilaule (motorista)',
    entreguePorEntidade: 'Ferragens Matola Gare, Lda',
    recebidoPor: 'Fernando Nhaca (encarregado)',
    recebidoPorEntidade: 'Machava & Filhos — Construção, Lda',
    veiculo: 'Camião Isuzu FVR, matrícula AGM 512 MP',
    bens: [
      { descricao: 'Cimento Portland 42,5 N (saco de 50 kg)', qtdDocumento: 320, qtdRecebida: 316, estado: 'parcial', observacoes: '4 sacos rasgados, devolvidos' },
      { descricao: 'Varão de aço nervurado 12 mm', qtdDocumento: 180, qtdRecebida: 180, estado: 'conforme', observacoes: '' },
      { descricao: 'Bloco de cimento 15 × 20 × 40', qtdDocumento: 4000, qtdRecebida: 4000, estado: 'conforme', observacoes: '' },
    ],
  },
});

SAMPLES.push({
  id: 'carta-confirmacao-saldos',
  who: shop,
  values: {
    ref: 'FIN/2027/012',
    data: '2027-01-08',
    tipoTerceiro: 'cliente',
    destinatarioNome: 'Supermercado Bom Preço Xai-Xai, Lda',
    destinatarioMorada: 'Avenida Samora Machel, n.º 210, Cidade de Xai-Xai, Gaza',
    destinatarioAtencao: 'Departamento de Contabilidade',
    dataReferencia: '2026-12-31',
    exercicioFim: '2026-12-31',
    forma: 'positiva',
    saldo: '334850',
    saldoSentido: 'nosso',
    auditorNome: 'Sitoe & Associados — Auditores Certificados, Lda',
    auditorMorada: 'Avenida Kenneth Kaunda, n.º 660, Maputo',
    auditorEmail: 'confirmacoes@sitoeauditores.co.mz',
    prazoRespostaDias: 10,
  },
});

SAMPLES.push({
  id: 'contrato-transporte-mercadorias',
  who: agro,
  values: {
    transportadorTipo: 'empresa',
    transportadorEmpresaNome: 'Transportes Namialo Logística, Lda',
    transportadorEmpresaNuit: '400223311',
    transportadorEmpresaSede: 'Rua dos Continuadores, n.º 88, Cidade de Nampula',
    transportadorRepNome: 'Ivo Momade Assane',
    transportadorRepCargo: 'sócio-gerente',
    transportadorLicenca: '0457/INATTER/2025',
    viaturas: 'Camião Mercedes-Benz Actros 30 t, matrícula AJK 410 NP',
    tipoContrato: 'viagem',
    mercadorias: [
      { descricao: 'Gergelim descascado', embalagem: 'sacos de 50 kg', quantidade: '600 sacos (30 t)', valor: '2850000' },
    ],
    origem: 'Ribáuè (armazém da Expedidora), Província de Nampula',
    destino: 'Porto de Nacala, Terminal de Carga Geral',
    destinatario: 'Cornelder de Moçambique, por conta da Lúrio Agro-Processamento, Lda',
    dataCarga: '2026-10-20',
    prazoEntregaDias: 2,
    cargaPor: 'expedidor',
    precoModo: 'viagem',
    preco: '95000',
    ivaFrete: true,
    combustivelIncluido: true,
    adiantamentoPct: 50,
    prazoPagamentoDias: 7,
    estadiaValor: '8000',
    estadiaHoras: 24,
    seguroMercadorias: true,
    seguroPor: 'transportador',
    foro: 'Tribunal Judicial da Cidade de Nampula',
  },
});

SAMPLES.push({
  id: 'contrato-producao-agricola',
  who: agro,
  values: {
    produtorTipo: 'pessoa',
    produtorNome: 'Armando Muhalia Namuli',
    produtorGenero: 'M',
    produtorEstadoCivil: 'casado',
    produtorNacionalidade: 'moçambicana',
    produtorDocTipo: 'BI',
    produtorDocNumero: '030300456789N',
    produtorNuit: '',
    produtorLocalidade: 'povoado de Namiconha, localidade de Iapala, posto administrativo de Iapala, distrito de Ribáuè',
    produtorContacto: '+258 86 432 1100',
    leituraLingua: true,
    linguaLocal: 'Emakhuwa',
    interpreteNome: 'Celestino Abílio Muhorro',
    cultura: 'gergelim',
    campanha: '2026/2027',
    localMachamba: 'Namiconha, Iapala, distrito de Ribáuè',
    areaHa: 3,
    quantidadeKg: 1800,
    exclusividade: true,
    insumos: true,
    insumosLista: [
      { item: 'Semente certificada de gergelim', quantidade: '15 kg', valor: '2250' },
      { item: 'Insecticida', quantidade: '2 litros', valor: '1800' },
      { item: 'Sacos de ráfia', quantidade: '40 unidades', valor: '1200' },
    ],
    perdaoPct: 50,
    assistencia: true,
    precoModo: 'minimo',
    precoMinimoKg: '85',
    postoCompra: 'Iapala-sede (armazém do Comprador)',
    periodoEntrega: 'Abril e Junho de 2027',
    prazoPagamentoDias: 3,
    formaPagamento: 'M-Pesa',
    clausulaPenalPct: 20,
    foro: 'Tribunal Judicial do Distrito de Ribáuè',
  },
});

SAMPLES.push({
  id: 'recibo-de-pagamento',
  name: 'recibo-de-sinal',
  who: person,
  values: {
    ref: '07/2026',
    recebedorTipo: 'pessoa',
    pagadorNome: 'Luísa Fernanda Macuácua',
    pagadorNuit: '112233445',
    valor: '1300000',
    natureza: 'sinal',
    contratoReferencia: 'contrato-promessa de compra e venda de 12 de Outubro de 2026',
    descricao: 'moradia do tipo 3 sita na Rua das Acácias, n.º 45, Bairro do Triunfo, Maputo',
    formaPagamento: 'transferência bancária',
    referenciaPagamento: 'BCI 2026101200457',
  },
});

SAMPLES.push({
  id: 'orcamento',
  name: 'orcamento-proposta',
  who: shop,
  values: {
    ref: 'PROP-2026/0058',
    validadeDias: 30,
    clienteNome: 'Escola Secundária Josina Machel',
    clienteMorada: 'Avenida Patrice Lumumba, Maputo',
    proposta: true,
    propostaObjecto: 'a manutenção preventiva dos aparelhos de ar condicionado',
    propostaPedido: 'V/ pedido de cotação de 2 de Outubro de 2026',
    propostaAmbito: 'Limpeza de filtros e serpentinas de 24 aparelhos split\nVerificação de gás e pressões\nRelatório técnico por aparelho',
    itens: [
      { descricao: 'Manutenção preventiva de aparelho split', quantidade: 24, unidade: 'un.', precoUnitario: '1800' },
      { descricao: 'Carga de gás R410A (se necessário)', quantidade: 4, unidade: 'un.', precoUnitario: '3500' },
    ],
    iva: true,
    condicoesPagamento: '30 dias após a conclusão, contra factura',
    prazoEntrega: 'cinco dias úteis após a adjudicação',
  },
});
