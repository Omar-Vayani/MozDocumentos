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
