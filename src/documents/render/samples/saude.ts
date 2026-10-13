// Preview samples for health documents.
import { clinic, doctor, type Sample } from './_profiles';

const paciente = {
  doenteNome: 'Joaquim Alberto Mussa',
  doenteGenero: 'M',
  doenteDataNascimento: '1988-03-21',
  doenteDocTipo: 'BI',
  doenteDocNumero: '110102345678B',
};

const clinicoClinica = {
  clinicoNome: 'Armando Cumbe',
  clinicoTitulo: 'Dr.',
  clinicoGenero: 'M',
  clinicoCategoria: 'geral',
  clinicoOrdem: 'Ordem dos Médicos de Moçambique',
  clinicoNumero: '1876',
};

export const SAMPLES: Sample[] = [
  {
    id: 'atestado-medico-doenca',
    who: doctor,
    values: {
      ...paciente,
      dataObservacao: '2026-10-12',
      finalidade: 'trabalho',
      dataInicio: '2026-10-12',
      dataFim: '2026-10-16',
      repouso: true,
      dataRetoma: '2026-10-19',
      recomendacoes: 'evitar esforços físicos intensos durante uma semana',
    },
  },
];
