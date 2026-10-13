// Preview samples for community-authority documents (bairro, régulo, posto administrativo).
import { community, publicBody, type Sample } from './_profiles';

const assinante = {
  assinanteCargo: 'Secretária do Bairro',
  assinanteGenero: 'F',
  assinanteNome: 'Amélia Joaquim Nhantumbo',
};

export const SAMPLES: Sample[] = [
  {
    id: 'declaracao-de-residencia',
    who: community,
    values: {
      numero: '045',
      unidade: 'Bairro da Malhangalene «A»',
      local: 'Maputo',
      data: '2026-10-12',
      validade: '90',
      cidadaoNome: 'Joana Alberto Cossa',
      cidadaoGenero: 'F',
      cidadaoPai: 'Alberto Cossa',
      cidadaoMae: 'Marta Sitoe',
      cidadaoNascimento: '1994-05-17',
      cidadaoNaturalidade: 'Xai-Xai',
      cidadaoNacionalidade: 'moçambicana',
      cidadaoEstadoCivil: 'solteiro',
      cidadaoDocTipo: 'BI',
      cidadaoDocNumero: '110102345678B',
      cidadaoDocEmissao: '2022-03-10',
      cidadaoDocLocal: 'Maputo',
      cidadaoQuarteirao: '12',
      cidadaoCasa: '34',
      cidadaoRua: 'Rua da Resistência',
      desde: '2018-03',
      finalidade: 'abertura de conta bancária',
      destino: 'ao Banco Comercial e de Investimentos',
      ...assinante,
      confirmaQuarteirao: true,
      chefeQuarteiraoNome: 'Luís Mabunda',
      chefeQuarteiraoNumero: '12',
    },
  },
];

void publicBody;
