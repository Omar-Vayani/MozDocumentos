// Preview samples for the "digital" (technology, media, intellectual property)
// and "turismo" (tourism, transport, agriculture, fisheries, security) documents.
import type { Profile } from '@/lib/storage/types';
import type { RenderAsset } from '../types';
import { company, person, type Issuer, type Sample } from './_profiles';

/** The base company's logo and stamp belong to a construction firm: keep only the signature. */
function ownMarks(p: Profile, assets: Record<string, RenderAsset>): Record<string, RenderAsset> {
  p.branding.logoAssetId = undefined;
  p.branding.stampAssetId = undefined;
  return assets.sig ? { sig: assets.sig } : {};
}

function firm(over: Partial<Profile>, accent: string): Issuer {
  const { profile: p, assets } = company();
  Object.assign(p, over);
  p.branding.accent = accent;
  return { profile: p, assets: ownMarks(p, assets) };
}

/** A software house in Maputo. */
const tech = (): Issuer =>
  firm(
    {
      id: 'pv-tech',
      firma: 'Kanimambo Digital, Lda',
      nuit: '401223344',
      nuel: '101334455',
      morada: { rua: 'Avenida Vladimir Lenine', numero: '1450', bairro: 'Coop', cidade: 'Maputo', provincia: 'Maputo Cidade' },
      telefones: '+258 84 210 3300',
      email: 'geral@kanimambo.co.mz',
      website: 'www.kanimambo.co.mz',
      representanteNome: 'Nelson Tomás Cuamba',
      representanteCargo: 'Director-Geral',
      banco: 'BCI',
      nib: '000800000561234510187',
    },
    '#2b4a8b',
  );

/** A beach lodge in Inhambane. */
export const lodge = (): Issuer =>
  firm(
    {
      id: 'pv-lodge',
      firma: 'Tofo Mar Lodge, Lda',
      nomeComercial: 'Tofo Mar Lodge',
      nuit: '400998877',
      nuel: '100887766',
      licenca: 'Licença de alojamento turístico n.º 041/DPCT-INH/2023',
      morada: { rua: 'Estrada da Praia do Tofo', numero: 's/n', bairro: 'Tofo', cidade: 'Inhambane', provincia: 'Inhambane' },
      localPadrao: 'Inhambane',
      telefones: '+258 84 455 7788 · +258 293 29 010',
      email: 'reservas@tofomar.co.mz',
      website: 'www.tofomar.co.mz',
      representanteNome: 'Luísa Mondlane Sitoe',
      representanteCargo: 'Directora-Geral',
      banco: 'Millennium bim',
      nib: '000100000098765432157',
    },
    '#0e6b73',
  );

/** A car-hire and passenger-transport company in Maputo. */
export const transport = (): Issuer =>
  firm(
    {
      id: 'pv-transport',
      firma: 'Xirico Rent & Transportes, Lda',
      nomeComercial: 'Xirico Rent',
      nuit: '401556677',
      nuel: '101667788',
      licenca: 'Licença de transporte n.º 118/INATRO/2024',
      morada: { rua: 'Avenida de Moçambique', numero: '3120', bairro: 'Bagamoio', cidade: 'Maputo', provincia: 'Maputo Cidade' },
      telefones: '+258 84 700 1122',
      email: 'reservas@xirico.co.mz',
      representanteNome: 'Hélder Jaime Massingue',
      representanteCargo: 'Sócio-Gerente',
      nib: '000300000123456789012',
    },
    '#8a3b12',
  );

/** A private security company. */
export const security = (): Issuer =>
  firm(
    {
      id: 'pv-security',
      firma: 'Guardião Segurança Privada, Lda',
      nuit: '400667788',
      nuel: '100556699',
      licenca: 'Alvará n.º 027/MINT/2022',
      morada: { rua: 'Avenida das FPLM', numero: '2215', bairro: 'Mavalane', cidade: 'Maputo', provincia: 'Maputo Cidade' },
      telefones: '+258 21 470 900 · +258 84 470 9000',
      email: 'comercial@guardiao.co.mz',
      representanteNome: 'Carlos Ernesto Langa',
      representanteCargo: 'Director-Geral',
      nib: '000800004455667710123',
    },
    '#1f3b2d',
  );

/** A farmer in Manica (individual). */
export const farmer = (): Issuer => {
  const { profile: p, assets } = person();
  Object.assign(p, {
    id: 'pv-farmer',
    nome: 'Jorge Manuel Chirindza',
    genero: 'M',
    docNumero: '060100223344M',
    docEmissao: '2021-07-09',
    docLocal: 'Chimoio',
    nuit: '104455667',
    morada: { rua: 'Bairro 7 de Abril', numero: '', bairro: 'Vanduzi-Sede', cidade: 'Vanduzi', provincia: 'Manica' },
    localPadrao: 'Vanduzi',
    telefones: '+258 86 455 1200',
  });
  return { profile: p, assets };
};

export const SAMPLES: Sample[] = [
  {
    id: 'contrato-desenvolvimento-software',
    who: tech,
    values: {
      clienteTipo: 'empresa',
      clienteEmpresaNome: 'Farmácia Saúde Total, Lda',
      clienteEmpresaNuit: '400778811',
      clienteEmpresaSede: 'Avenida Eduardo Mondlane, n.º 1820, Maputo',
      clienteRepNome: 'Fátima Ismael Abdula',
      clienteRepCargo: 'Sócia-gerente',
      tipo: 'loja',
      nomeProjecto: 'Loja online Saúde Total',
      especificacao:
        'Catálogo de produtos de venda livre, com pesquisa, categorias e fotografias\nCarrinho de compras e encomenda com entrega ao domicílio na Cidade de Maputo\nPagamento por M-Pesa, e-Mola e cartão bancário\nPainel de gestão para a farmácia actualizar preços e stock\nEnvio automático de confirmação da encomenda por SMS e e-mail\nPáginas de termos e condições, privacidade e contactos',
      tecnologias: 'WooCommerce sobre WordPress, alojamento em servidor do cliente',
      exclusoes: 'produção das fotografias dos produtos\ncustos de alojamento, domínio e comissões dos meios de pagamento',
      dataInicio: '2026-10-19',
      dataEntrega: '2027-01-29',
      fases: [
        { fase: 'Adiantamento, na assinatura', entrega: '2026-10-19', valor: '120000' },
        { fase: 'Aprovação do desenho e do protótipo', entrega: '2026-11-20', valor: '90000' },
        { fase: 'Versão de testes com pagamentos', entrega: '2027-01-08', valor: '90000' },
        { fase: 'Entrega final e formação da equipa', entrega: '2027-01-29', valor: '100000' },
      ],
      iva: 'acrescido',
      pagamentoForma: 'transferência bancária',
      pagamentoDias: 15,
      testesDias: 10,
      respostaDias: 5,
      direitos: 'cliente',
      codigoFonte: true,
      portfolio: true,
      garantiaMeses: 3,
      dadosPessoais: true,
      limiteResponsabilidade: true,
      avisoDias: 30,
    },
  },
];

/** A photographer and designer (individual). */
const creator = (): Issuer => {
  const { profile: p, assets } = person();
  Object.assign(p, {
    id: 'pv-creator',
    nome: 'Ana Lúcia Sitoe',
    genero: 'F',
    estadoCivil: 'solteiro',
    docNumero: '110102233445F',
    docEmissao: '2023-03-15',
    docLocal: 'Maputo',
    nuit: '107788990',
    morada: { rua: 'Rua de Kassuende', numero: '214', bairro: 'Polana Cimento', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 84 512 7788',
    email: 'ana.sitoe.foto@gmail.com',
  });
  return { profile: p, assets };
};

/** An events company. */
const events = (): Issuer =>
  firm(
    {
      id: 'pv-events',
      firma: 'Xigubo Eventos e Produções, Lda',
      nuit: '400445566',
      nuel: '100334499',
      morada: { rua: 'Avenida Marginal', numero: '4410', bairro: 'Costa do Sol', cidade: 'Maputo', provincia: 'Maputo Cidade' },
      telefones: '+258 84 330 4400',
      email: 'producao@xigubo.co.mz',
      representanteNome: 'Rui Alberto Nhaca',
      representanteCargo: 'Director Executivo',
    },
    '#7a2d6b',
  );

SAMPLES.push(
  {
    id: 'contrato-suporte-informatico',
    who: tech,
    values: {
      clienteTipo: 'empresa',
      clienteEmpresaNome: 'Cossa & Associados — Auditores, Lda',
      clienteEmpresaNuit: '400223311',
      clienteEmpresaSede: 'Avenida 24 de Julho, n.º 2096, 4.º andar, Maputo',
      clienteRepNome: 'Paulo Jorge Cossa',
      clienteRepCargo: 'Sócio-gerente',
      sistemas: '32 computadores portáteis e de secretária, com Windows e Microsoft 365\n1 servidor de ficheiros e cópias de segurança\nRede local, Wi-Fi e firewall da sede\n5 impressoras multifunções',
      canais: 'suporte@kanimambo.co.mz e +258 84 210 3300 (também WhatsApp)',
      exclusoes: 'peças, consumíveis e licenças de software\nnovos projectos e mudanças de instalações',
      mensalidade: '85000',
      horasIncluidas: 30,
      precoHora: '2500',
      deslocacao: '3500',
      duracaoMeses: 12,
    },
  },
  {
    id: 'contrato-licenca-software',
    who: tech,
    values: {
      clienteTipo: 'empresa',
      clienteEmpresaNome: 'Distribuidora Zambeze, Lda',
      clienteEmpresaNuit: '400661122',
      clienteEmpresaSede: 'Rua Major Serpa Pinto, n.º 120, Cidade da Beira',
      clienteRepNome: 'Ismael Abdul Satar',
      clienteRepCargo: 'Director-Geral',
      modelo: 'saas',
      softwareNome: 'Kanimambo Stock',
      versao: 'plano Empresarial',
      descricao: 'gestão de stocks, vendas, facturação e relatórios, com acesso por navegador e telemóvel',
      utilizadores: 15,
      localDados: 'centro de dados em Joanesburgo, África do Sul, com cópia diária em Maputo',
      preco: '42000',
      periodicidade: 'mensal',
    },
  },
  {
    id: 'contrato-alojamento-web',
    who: tech,
    values: {
      clienteTipo: 'empresa',
      clienteEmpresaNome: 'Clínica Dentária Sorriso, Lda',
      clienteEmpresaNuit: '400998811',
      clienteEmpresaSede: 'Avenida Kenneth Kaunda, n.º 780, Maputo',
      clienteRepNome: 'Dra. Neusa Tembe',
      clienteRepCargo: 'Directora Clínica',
      dominio: 'clinicasorriso.co.mz',
      plano: 'Empresarial',
      emailContas: 12,
      espaco: '20 GB de espaço e tráfego ilimitado',
      preco: '36000',
      periodicidade: 'ano',
    },
  },
  {
    id: 'contrato-marketing-digital',
    who: tech,
    values: {
      clienteTipo: 'empresa',
      clienteEmpresaNome: 'Padaria Pão Quente da Matola, Lda',
      clienteEmpresaNuit: '400557733',
      clienteEmpresaSede: 'Avenida das Indústrias, n.º 512, Machava, Matola',
      clienteRepNome: 'Rosa Machel Nhantumbo',
      clienteRepCargo: 'Sócia-gerente',
      plataformas: 'Facebook, Instagram e WhatsApp Business',
      svSeo: false,
      publicacoesMes: 16,
      videosMes: 4,
      investimento: '15000',
      mensalidade: '28000',
      duracaoMeses: 6,
    },
  },
  {
    id: 'contrato-influenciador',
    who: tech,
    values: {
      marcaEmpresaNome: 'Kanimambo Digital, Lda',
      influenciadorNome: 'Shelsia Nhantumbo Bila',
      influenciadorGenero: 'F',
      influenciadorEstadoCivil: 'solteiro',
      influenciadorDocNumero: '110104455667B',
      influenciadorNuit: '109988776',
      influenciadorMorada: 'Bairro da Sommerschield, Rua 1301, n.º 45, Maputo',
      perfis: '@shelsia.bila no Instagram e no TikTok',
      campanha: 'Lançamento da aplicação Kanimambo Pay',
      dataInicio: '2026-11-02',
      dataFim: '2026-11-30',
      entregaveis: [
        { plataforma: 'Instagram', formato: 'Reel com demonstração da aplicação', quantidade: '2', data: '2026-11-10' },
        { plataforma: 'Instagram', formato: 'Stories (sequência de 3)', quantidade: '4', data: '2026-11-25' },
        { plataforma: 'TikTok', formato: 'Vídeo curto', quantidade: '2', data: '2026-11-20' },
      ],
      mensagens: 'Pagar contas e transferir dinheiro em segundos\nSem custos de adesão no primeiro mês',
      cache: '60000',
      iva: 'isento',
      pagamentoForma: 'M-Pesa',
      pagamentoConta: '84 455 6677',
      concorrentes: 'carteiras móveis e aplicações de pagamento',
    },
  },
  {
    id: 'autorizacao-uso-imagem',
    who: events,
    values: {
      titular: 'menor',
      nome: 'Albertina João Mabunda',
      genero: 'F',
      docNumero: '110100998877C',
      contacto: '+258 82 556 1122',
      morada: 'Bairro de Laulane, quarteirão 12, casa n.º 33, Maputo',
      parentesco: 'mae',
      menorNome: 'Kelvin Mabunda',
      menorNascimento: '2014-05-21',
      menorAssina: true,
      contexto: 'gravações do Concurso Infantil de Talentos 2026, a 14 de Novembro de 2026, no Cine-Teatro Gilberto Mendes',
      finalidade: 'divulgação do concurso e da sua próxima edição',
      parceiros: 'os patrocinadores oficiais do concurso, apenas para a mesma finalidade',
      meioTv: true,
      prazoTipo: 'data',
      prazoFim: '2027-12-31',
    },
  },
  {
    id: 'contrato-cessao-direitos-autor',
    who: tech,
    values: {
      modelo: 'encomenda',
      autorNome: 'Ana Lúcia Sitoe',
      autorGenero: 'F',
      autorEstadoCivil: 'solteiro',
      autorDocNumero: '110102233445F',
      autorDocEmissao: '2023-03-15',
      autorDocLocal: 'Maputo',
      autorNuit: '107788990',
      autorMorada: 'Rua de Kassuende, n.º 214, Polana Cimento, Maputo',
      obraTipo: 'grafica',
      obraTitulo: 'Logótipo e manual de identidade visual Kanimambo Pay',
      obraDescricao: 'logótipo, ícone da aplicação, paleta de cores, tipografia e manual de normas gráficas, com três propostas iniciais',
      dataEntrega: '2026-11-15',
      revisoes: 2,
      semCreditos: true,
      valor: '150000',
      iva: 'isento',
      pagamentoForma: 'transferência bancária',
      pagamentoConta: '000800004455667788123',
    },
  },
  {
    id: 'contrato-de-edicao',
    who: creator,
    values: {
      autorNome: 'Ana Lúcia Sitoe',
      editorTipo: 'empresa',
      editorEmpresaNome: 'Edições Índico, Lda',
      editorEmpresaNuit: '400112299',
      editorEmpresaSede: 'Avenida Ahmed Sekou Touré, n.º 1415, Maputo',
      editorRepNome: 'Mia Chirindza',
      editorRepCargo: 'Directora Editorial',
      titulo: 'Moçambique em Luz — Fotografias da Costa',
      genero: 'livro de fotografia com textos',
      paginas: 180,
      tiragem: 1500,
      precoCapa: '2500',
      adiantamento: '50000',
      pagamentoForma: 'transferência bancária',
      pagamentoConta: '000100000056781234157',
    },
  },
  {
    id: 'contrato-actuacao-artistica',
    who: events,
    values: {
      artistaTipo: 'pessoa',
      artistaNome: 'Hélio Jaime Mondlane',
      artistaGenero: 'M',
      artistaEstadoCivil: 'casado',
      artistaDocNumero: '110100667788D',
      artistaNuit: '106655443',
      artistaMorada: 'Bairro do Jardim, Rua 4, n.º 18, Maputo',
      nomeArtistico: 'Hélio Mondlane & Banda Xitende',
      elementos: 7,
      eventoNome: 'Gala de Fim de Ano do Banco Austral',
      eventoLocal: 'Salão Nobre do Hotel Polana, Maputo',
      eventoData: '2026-12-12',
      horaActuacao: '21h30',
      duracaoMin: 90,
      horaEnsaio: '16h00',
      tipoEvento: 'privado',
      cache: '250000',
      iva: 'isento',
      alojamento: false,
      exclusividadeKm: 0,
    },
  },
  {
    id: 'contrato-de-patrocinio',
    who: events,
    values: {
      patrocinadorTipo: 'empresa',
      patrocinadorEmpresaNome: 'Moçambique Celular Telecomunicações, S.A.',
      patrocinadorEmpresaNuit: '400001122',
      patrocinadorEmpresaSede: 'Avenida 25 de Setembro, n.º 1500, Maputo',
      patrocinadorRepNome: 'Teresa Cumbe',
      patrocinadorRepCargo: 'Directora de Marketing',
      tipo: 'evento',
      designacao: 'Festival Marrabenta na Marginal 2027',
      descricao: 'festival de música ao ar livre na Avenida Marginal, Maputo, de 6 a 8 de Fevereiro de 2027, com público esperado de quinze mil pessoas',
      dataInicio: '2026-11-01',
      dataFim: '2027-02-28',
      valor: '1500000',
      prestacoes: 'metade na assinatura do contrato\no restante até 15 de Janeiro de 2027',
      especie: 'acesso à Internet sem fios para o recinto e para a equipa de produção',
      valorEspecie: '120000',
      categoria: 'principal',
      cStand: true,
      convites: 40,
      sector: 'telecomunicações e serviços financeiros móveis',
    },
  },
  {
    id: 'pedido-direito-resposta',
    who: person,
    values: {
      requerenteMorada: 'Rua da Resistência, n.º 512, Malhangalene, Maputo',
      requerenteContacto: '+258 82 123 4567',
      orgaoTipo: 'jornal',
      orgaoNome: '"Semanário da Capital"',
      directorNome: 'Dr. Albino Matsinhe',
      orgaoMorada: 'Avenida Karl Marx, n.º 980, Maputo',
      pecaTitulo: 'Empresário de Malhangalene envolvido em esquema de terrenos',
      pecaData: '2026-10-08',
      pecaLocal: 'edição n.º 1123, página 7',
      factos: 'Afirma-se que fui constituído arguido num processo de venda ilegal de terrenos, o que é falso: não existe qualquer processo contra mim\nAfirma-se que vendi parcelas do bairro de Albasine, quando nunca fui titular nem intermediário de qualquer terreno nesse bairro\nA peça publica a minha fotografia e o meu nome completo sem me ter ouvido',
      textoResposta: 'Na edição de 8 de Outubro, este jornal publicou que eu estaria envolvido num esquema de venda ilegal de terrenos em Albasine. Não é verdade.\nNão sou, nem nunca fui, arguido em qualquer processo. Nunca fui titular, vendedor ou intermediário de terrenos naquele bairro, como o confirma a declaração emitida pela Direcção Municipal de Ordenamento Territorial, que coloco à disposição do jornal.\nLamento que a peça tenha sido publicada sem que eu fosse ouvido. Carlos Alberto Nhantumbo.',
    },
  },
  {
    id: 'notificacao-infracao-direitos-autor',
    who: creator,
    values: {
      motivo: 'obra',
      destNome: 'Hotel Baía Azul, Lda',
      destMorada: 'Avenida da Marginal, n.º 77, Cidade de Pemba · reservas@baiaazul.co.mz',
      obra: 'fotografia "Pôr do sol na Ilha de Moçambique", de minha autoria',
      prova: 'ficheiro original em alta resolução com metadados de 12 de Agosto de 2024 e publicação no meu perfil profissional em 20 de Agosto de 2024',
      usos: 'Imagem de capa da página do hotel no Facebook, desde Setembro de 2026\nFolheto promocional distribuído na feira FACIM 2026\nPágina inicial do sítio www.baiaazul.co.mz, sem qualquer menção do meu nome',
      dataConhecimento: '2026-10-02',
      pedeCredito: true,
      indemnizacao: '45000',
      prazoDias: 8,
    },
  },
  {
    id: 'termos-e-condicoes-website',
    who: tech,
    values: {
      nomeSite: 'Kanimambo Store',
      endereco: 'www.kanimambostore.co.mz',
      tipo: 'loja',
      contacto: 'apoio@kanimambostore.co.mz · +258 84 210 3300',
      zonasEntrega: 'Cidades de Maputo e Matola; restantes províncias por transportadora, com custo indicado no carrinho',
      prazoEntrega: 3,
      custoEntrega: 'gratuito acima de 5 000 MT; nos restantes casos, indicado no carrinho antes do pagamento',
      excluidosDevolucao: 'auscultadores e produtos de higiene abertos, cartões de recarga e software com código revelado',
      conteudosUtilizador: true,
    },
  },
  {
    id: 'politica-de-privacidade',
    who: tech,
    values: {
      nomeServico: 'Kanimambo Store',
      endereco: 'www.kanimambostore.co.mz',
      encarregado: 'Nádia Cuamba, Responsável de Protecção de Dados',
      emailPrivacidade: 'privacidade@kanimambo.co.mz',
      paises: 'África do Sul e Irlanda (alojamento em nuvem e envio de e-mails)',
    },
  },
  {
    id: 'politica-de-cookies',
    who: tech,
    values: {
      nomeSite: 'Kanimambo Store',
      endereco: 'www.kanimambostore.co.mz',
      cPublicidade: true,
      ferramentasPublicidade: 'Meta Pixel',
      lista: [
        { nome: 'session_id', fornecedor: 'Próprio', finalidade: 'Manter a sessão e o carrinho de compras', duracao: 'Sessão' },
        { nome: 'cookie_consent', fornecedor: 'Próprio', finalidade: 'Guardar as suas escolhas sobre cookies', duracao: '12 meses' },
        { nome: '_ga', fornecedor: 'Google', finalidade: 'Contar visitas e páginas vistas', duracao: '2 anos' },
        { nome: '_fbp', fornecedor: 'Meta', finalidade: 'Medir campanhas de publicidade', duracao: '3 meses' },
      ],
    },
  },
);
