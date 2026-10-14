// Preview samples for construction, real-estate and condominium documents.
import { company, contractor, person, type Issuer, type Sample } from './_profiles';

/** A consultancy engineer (fiscal, author of reports and fee proposals). */
function engenheiro(): Issuer {
  const { profile: p, assets } = person();
  Object.assign(p, {
    id: 'pv-engenheiro',
    sector: 'construcao',
    nome: 'Carlos Alberto Nhantumbo',
    genero: 'M',
    tituloProfissional: 'Eng.º',
    profissao: 'Engenheiro Civil',
    especialidade: 'Engenheiro Civil',
    ordemProfissional: 'Ordem dos Engenheiros de Moçambique',
    ordemNumero: '2417',
    estadoCivil: 'casado',
    nacionalidade: 'moçambicana',
    docTipo: 'BI',
    docNumero: '110100554433B',
    docEmissao: '2022-03-14',
    docLocal: 'Maputo',
    nuit: '103456789',
    morada: { rua: 'Rua da Resistência', numero: '512', bairro: 'Malhangalene', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 84 610 2030',
    email: 'carlos.nhantumbo@engenharia.co.mz',
  });
  return { profile: p, assets };
}

/** An estate agency. */
function imobiliaria(): Issuer {
  const { profile: p, assets } = company();
  Object.assign(p, {
    id: 'pv-imobiliaria',
    firma: 'Casa Certa — Mediação Imobiliária, Lda',
    nuit: '400556677',
    nuel: '100887766',
    licenca: 'Licença de actividade n.º 1123/BAU/2025',
    morada: { rua: 'Avenida Kenneth Kaunda', numero: '788', bairro: 'Sommerschield', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    email: 'geral@casacerta.co.mz',
    website: 'www.casacerta.co.mz',
    representanteNome: 'Telma Joaquim Sitoe',
    representanteCargo: 'Sócia-Gerente',
  });
  return { profile: p, assets };
}

/** A building's condominium, issued by its administrator. */
function condominio(): Issuer {
  const { profile: p, assets } = company();
  Object.assign(p, {
    id: 'pv-condominio',
    firma: 'Condomínio do Edifício Acácias',
    nuit: '',
    nuel: '',
    inss: '',
    capitalSocial: '',
    website: '',
    morada: { rua: 'Avenida Mao Tse Tung', numero: '1350', bairro: 'Coop', cidade: 'Maputo', provincia: 'Maputo Cidade' },
    telefones: '+258 84 777 1350',
    email: 'condominio.acacias@gmail.com',
    representanteNome: 'Jorge Manuel Cumbe',
    representanteCargo: 'Administrador do Condomínio',
    banco: 'Millennium bim',
    nib: '000100000045678901234',
  });
  delete assets.logo;
  p.branding.logoAssetId = undefined;
  return { profile: p, assets };
}

const obra = {
  obraDesignacao: 'Construção de moradia unifamiliar do tipo 3',
  obraLocal: 'Rua das Mangueiras, talhão n.º 412, Bairro de Intaka, Município da Matola',
  contratoRef: 'Contrato de empreitada n.º 07/2026',
  contratoData: '2026-06-15',
  donoNome: 'Fátima Abdul Ismael',
  empreiteiroNome: 'Machava & Filhos — Construção, Lda',
  empreiteiroAlvara: 'Alvará de Empreiteiro de Obras Públicas n.º 3021, 4.ª Classe',
  empreiteiroRepresentante: 'Eng.º Rui Machava',
  empreiteiroCargo: 'Director Técnico',
  temFiscalizacao: true,
  fiscalNome: 'Eng.º Carlos Alberto Nhantumbo',
  fiscalQualificacao: 'Engenheiro Civil, OrdEM n.º 2417',
  fiscalEntidade: '',
};

export const SAMPLES: Sample[] = [
  {
    id: 'orcamento-de-obra',
    who: contractor,
    values: {
      clienteNome: 'Fátima Abdul Ismael',
      clienteNuit: '120334455',
      clienteContacto: '+258 84 455 6677',
      clienteMorada: 'Avenida Eduardo Mondlane, n.º 1520, 3.º andar, Maputo',
      obraDesignacao: 'Construção de moradia unifamiliar do tipo 3, de rés-do-chão',
      obraLocal: 'Rua das Mangueiras, talhão n.º 412, Bairro de Intaka, Matola',
      projectoReferencia: 'Projecto de arquitectura aprovado e levantamento no local',
      itens: [
        { capitulo: 'Estaleiro e trabalhos preparatórios', descricao: 'Montagem do estaleiro, limpeza do terreno e implantação da obra', unidade: 'vg', quantidade: 1, precoUnitario: '85000' },
        { capitulo: 'Movimento de terras', descricao: 'Escavação para sapatas e vigas de fundação', unidade: 'm³', quantidade: 48, precoUnitario: '950' },
        { capitulo: 'Movimento de terras', descricao: 'Aterro e compactação do caixão', unidade: 'm³', quantidade: 36, precoUnitario: '700' },
        { capitulo: 'Betão e betão armado', descricao: 'Betão de limpeza com 5 cm de espessura', unidade: 'm²', quantidade: 62, precoUnitario: '520' },
        { capitulo: 'Betão e betão armado', descricao: 'Sapatas e vigas de fundação em betão armado C25/30', unidade: 'm³', quantidade: 18.5, precoUnitario: '21500' },
        { capitulo: 'Betão e betão armado', descricao: 'Pilares, vigas e laje de cobertura em betão armado', unidade: 'm³', quantidade: 22, precoUnitario: '24800' },
        { capitulo: 'Alvenarias', descricao: 'Paredes exteriores em blocos de cimento de 20 cm', unidade: 'm²', quantidade: 186, precoUnitario: '1150' },
        { capitulo: 'Alvenarias', descricao: 'Paredes interiores em blocos de cimento de 15 cm', unidade: 'm²', quantidade: 142, precoUnitario: '980' },
        { capitulo: 'Revestimentos e acabamentos', descricao: 'Reboco interior e exterior, areado fino', unidade: 'm²', quantidade: 640, precoUnitario: '420' },
        { capitulo: 'Revestimentos e acabamentos', descricao: 'Pavimento cerâmico 60x60, incluindo betonilha', unidade: 'm²', quantidade: 118, precoUnitario: '1650' },
        { capitulo: 'Instalações eléctricas', descricao: 'Instalação eléctrica completa conforme projecto, com quadro e terra', unidade: 'vg', quantidade: 1, precoUnitario: '145000' },
        { capitulo: 'Instalações hidráulicas e sanitárias', descricao: 'Rede de águas e esgotos, fossa séptica e poço roto', unidade: 'vg', quantidade: 1, precoUnitario: '168000' },
        { capitulo: 'Pinturas', descricao: 'Pintura de paredes com primário e duas demãos de tinta plástica', unidade: 'm²', quantidade: 640, precoUnitario: '210' },
      ],
      ivaRegime: 'acrescido',
      prazoDias: 150,
      adiantamentoPct: 20,
      pagamentoModo: 'fases',
      pagamentoDias: 10,
      revisaoPrecos: true,
      mesesRevisao: 3,
    },
  },
  {
    id: 'auto-de-consignacao-obra',
    who: contractor,
    values: {
      ...obra,
      emitente: 'empreiteiro',
      horaAuto: '09:00',
      local: 'Matola',
      obraLicenca: '318/CMCM/2026',
      valorContrato: '2778606',
      prazoContratual: 150,
      licencaSituacao: 'emitida',
      licencaEntidade: 'Conselho Municipal da Cidade da Matola',
      licencaData: '2026-07-20',
      referencias: 'marcos do talhão, alinhamento da via e cota de soleira indicados na planta de implantação',
      estaleiro: 'O Dono da Obra disponibiliza ponto de água no talhão; a energia é fornecida pelo gerador do Empreiteiro até à ligação à rede da EDM',
    },
  },
  {
    id: 'auto-de-medicao',
    who: contractor,
    values: {
      ...obra,
      emitente: 'empreiteiro',
      numero: 3,
      data: '2026-10-12',
      periodoInicio: '2026-09-12',
      periodoFim: '2026-10-11',
      local: 'Matola',
      valorContrato: '2395350',
      itens: [
        { artigo: '3.2', descricao: 'Sapatas e vigas de fundação em betão armado C25/30', unidade: 'm³', quantContratada: 18.5, precoUnitario: '21500', acumuladoAnterior: 18.5, desteAuto: 0 },
        { artigo: '3.3', descricao: 'Pilares, vigas e laje de cobertura em betão armado', unidade: 'm³', quantContratada: 22, precoUnitario: '24800', acumuladoAnterior: 6, desteAuto: 9.5 },
        { artigo: '4.1', descricao: 'Paredes exteriores em blocos de cimento de 20 cm', unidade: 'm²', quantContratada: 186, precoUnitario: '1150', acumuladoAnterior: 92, desteAuto: 94 },
        { artigo: '4.2', descricao: 'Paredes interiores em blocos de cimento de 15 cm', unidade: 'm²', quantContratada: 142, precoUnitario: '980', acumuladoAnterior: 40, desteAuto: 78 },
        { artigo: '7.1', descricao: 'Rede de águas e esgotos (tubagem embutida)', unidade: 'vg', quantContratada: 1, precoUnitario: '168000', acumuladoAnterior: 0, desteAuto: 0.3 },
      ],
      trabalhosMais: [
        { artigo: 'TM.1', descricao: 'Muro de vedação lateral em blocos de 15 cm', unidade: 'm²', desteAuto: 24, precoUnitario: '950', aprovacaoRef: 'Ordem n.º 1, de 28/09/2026' },
      ],
      amortizacaoPct: 20,
      retencaoPct: 5,
      ivaRegime: 'acrescido',
      pagamentoDias: 10,
      executadoAnterior: '846300',
    },
  },
  {
    id: 'ordem-de-trabalhos-a-mais',
    who: contractor,
    values: {
      ...obra,
      emitente: 'empreiteiro',
      numero: 1,
      data: '2026-09-28',
      local: 'Matola',
      valorContrato: '2395350',
      prazoFimActual: '2027-03-11',
      motivo: 'dono',
      motivoDescricao: 'a Dona da Obra pediu a construção de um muro de vedação lateral e de um alpendre não previstos no projecto',
      itens: [
        { artigo: 'TM.1', descricao: 'Muro de vedação lateral em blocos de 15 cm, rebocado e pintado', unidade: 'm²', quantidade: 48, precoUnitario: '950' },
        { artigo: 'TM.2', descricao: 'Alpendre em estrutura metálica com cobertura em chapa IBR', unidade: 'm²', quantidade: 18, precoUnitario: '4200' },
      ],
      ivaRegime: 'acrescido',
      prorrogacaoDias: 10,
      pagamento: 'autos',
    },
  },
  {
    id: 'auto-de-recepcao-obra',
    who: engenheiro,
    values: {
      ...obra,
      emitente: 'fiscalizacao',
      tipo: 'provisoria',
      data: '2027-03-15',
      horaAuto: '10:00',
      local: 'Matola',
      dataComunicacao: '2027-03-08',
      dataConclusao: '2027-03-08',
      dataFimContratual: '2027-03-21',
      ensaios: 'ensaio da rede de águas sob pressão, teste do quadro eléctrico e da ligação à terra e verificação do funcionamento das portas e janelas',
      semDefeitos: false,
      defeitos: [
        { local: 'Quarto 2', descricao: 'Fissura no reboco junto à janela, a refechar e pintar', prazo: '2027-03-31' },
        { local: 'Casa de banho social', descricao: 'Torneira do lavatório com fuga de água', prazo: '2027-03-22' },
        { local: 'Fachada principal', descricao: 'Manchas de tinta no pavimento exterior', prazo: '2027-03-31' },
      ],
      garantiaMeses: 12,
      retencoes: 'mantêm-se as retenções de garantia efectuadas nos autos de medição até à recepção definitiva',
      elementosEntregues: 'Telas finais de arquitectura e especialidades\nTrês jogos de chaves\nManuais e certificados de garantia do esquentador e da bomba de água',
      valorFinal: '2523550',
      valorPago: '2397372',
    },
  },
];

export const _issuers = { engenheiro, imobiliaria, condominio, person, obra };
