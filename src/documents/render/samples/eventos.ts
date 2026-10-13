// Preview samples for invitations, notices, certificates, cards and the CV.
import { company, person, type Sample } from './_profiles';

export const SAMPLES: Sample[] = [
  {
    id: 'convite-de-casamento',
    who: person,
    values: {
      noiva: 'Ana Cristina Muchanga',
      noivo: 'Carlos Alberto Nhantumbo',
      quemConvida: 'pais',
      paiNoiva: 'Fernando Muchanga',
      maeNoiva: 'Rosa Muchanga',
      paiNoivo: 'Alberto Nhantumbo',
      paiNoivoFalecido: true,
      maeNoivo: 'Graça Nhantumbo',
      tipoCerimonia: 'religiosa',
      dataEvento: '2026-11-28',
      horaEvento: '11:00',
      localCerimonia: 'Igreja Paroquial de Santo António da Polana',
      enderecoCerimonia: 'Av. Julius Nyerere, Maputo',
      recepcaoTermo: 'copo-d’água',
      localRecepcao: 'Salão Girassol',
      enderecoRecepcao: 'Av. Marginal, Maputo',
      rsvpNome: 'Rosa',
      rsvpTelefone: '+258 84 123 4567',
      rsvpData: '2026-11-10',
      traje: 'Social',
      pessoas: 2,
    },
  },
];
