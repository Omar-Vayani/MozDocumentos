// Preview samples for core documents.
import { company, lawyer, publicBody, type Sample } from './_profiles';

const worker = {
  trabalhadorNome: 'Joana Celeste Cossa',
  trabalhadorGenero: 'F',
  trabalhadorCargo: 'Técnica de Contabilidade',
  trabalhadorCategoria: 'Técnica Média',
  trabalhadorDepartamento: 'Finanças',
  trabalhadorDataAdmissao: '2023-03-01',
  trabalhadorSalarioBase: '28500',
  trabalhadorDocTipo: 'BI',
  trabalhadorDocNumero: '110100123456B',
  trabalhadorDocEmissao: '2021-05-10',
  trabalhadorDocLocal: 'Maputo',
  trabalhadorNuit: '123456789',
  trabalhadorInss: '987654321',
  trabalhadorMorada: 'Bairro da Malhangalene, Rua 4, casa 12, Maputo',
  trabalhadorNacionalidade: 'moçambicana',
  trabalhadorEstadoCivil: 'solteiro',
};

export const SAMPLES: Sample[] = [
  {
    id: 'carta-oficial',
    who: company,
    values: {
      tratamento: 'Exmo. Senhor',
      destinatarioNome: 'Eng.º Paulo Sitoe',
      destinatarioCargo: 'Director Nacional de Obras Públicas',
      destinatarioEntidade: 'Ministério das Obras Públicas, Habitação e Recursos Hídricos',
      destinatarioMorada: 'Av. Karl Marx, n.º 606, Maputo',
      assunto: 'Pedido de prorrogação do prazo de execução da empreitada n.º 14/2026',
      corpo:
        'Na sequência do contrato de empreitada celebrado em 3 de Março de 2026, vimos informar V. Ex.ª de que as chuvas intensas registadas entre Janeiro e Março provocaram a interrupção dos trabalhos durante 26 dias úteis.\n\nNestes termos, solicitamos a prorrogação do prazo de execução por 30 dias, até 15 de Dezembro de 2026, mantendo-se inalteradas as demais condições contratuais.\n\nJuntamos o relatório de fiscalização e o registo pluviométrico do período.',
      signatarioNome: 'Ana Maria Machava',
      signatarioCargo: 'Directora-Geral',
      anexos: [{ descricao: 'Relatório de fiscalização' }, { descricao: 'Registo pluviométrico' }],
    },
  },
  {
    id: 'carta-oficial',
    name: 'carta-oficial-publica',
    who: publicBody,
    values: {
      tratamento: 'Exmo. Senhor',
      destinatarioCargo: 'Director Nacional de Saúde Pública',
      destinatarioEntidade: 'Ministério da Saúde',
      destinatarioMorada: 'Av. Eduardo Mondlane, n.º 1008, Maputo',
      assunto: 'Envio do relatório trimestral de vacinação',
      corpo: 'Junto se remete a V. Ex.ª o relatório trimestral de vacinação da Província de Nampula, referente ao período de Julho a Setembro de 2026.\n\nO relatório foi aprovado em reunião do Colectivo de Direcção de 2 de Outubro de 2026.',
      signatarioNome: 'Dr. Felisberto Mucavele',
      signatarioCargo: 'Director Provincial',
    },
  },
  { id: 'contrato-indeterminado', who: company, values: { ...worker, funcoes: 'Registar os documentos contabilísticos\nPreparar as reconciliações bancárias mensais', localTrabalho: 'Sede da empresa, Maputo' } },
  { id: 'declaracao-de-trabalho', who: company, values: { ...worker, finalidade: 'abertura de conta bancária', destinatario: 'Banco Comercial e de Investimentos' } },
  { id: 'recibo-de-salario', who: company, values: { ...worker, periodo: '2026-09', salarioBase: '28500' } },
  { id: 'cartao-de-visita', who: company, values: { telefone: '+258 84 300 0000', email: 'ana@machava.co.mz', website: 'www.machava.co.mz', morada: 'Av. Julius Nyerere, 1234, Maputo' } },
  { id: 'cartao-de-visita', name: 'cartao-de-visita-esquerda', who: lawyer, values: { estilo: 'esquerda', empresa: 'Tembe & Associados — Advogados' } },
  {
    id: 'certificado-de-participacao',
    who: company,
    values: {
      participanteNome: 'Joana Celeste Cossa',
      participanteGenero: 'F',
      titulo: 'Segurança no Trabalho em Obras de Construção Civil',
      modalidade: 'no workshop',
      dataInicio: '2026-10-08',
      dataFim: '2026-10-10',
      cargaHoraria: 16,
      local: 'Maputo',
      assinante2Nome: 'Eng.º Paulo Sitoe',
      assinante2Cargo: 'Formador',
      codigo: 'MF-2026-031',
    },
  },
];
