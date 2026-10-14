// Pure text helpers for profile details (no react-pdf), shared by letterheads and templates.

import { formatMoney, parseMoney } from '@/lib/format';
import type { Profile } from '@/lib/storage/types';

export function addressLine(p: Profile): string {
  const m = p.morada ?? {};
  const street = [m.rua, m.numero ? `n.º ${m.numero}` : ''].filter(Boolean).join(', ');
  return [street, m.bairro, m.cidade, m.provincia && m.provincia !== m.cidade ? m.provincia : '']
    .filter(Boolean)
    .join(', ') + (p.caixaPostal ? ` · C.P. ${p.caixaPostal}` : '');
}

export function contactsLine(p: Profile): string {
  return [p.telefones ? `Tel. ${p.telefones}` : '', p.email, p.website].filter(Boolean).join(' · ');
}

export function legalLine(p: Profile): string {
  const cap = p.capitalSocial ? parseMoney(p.capitalSocial) : null;
  return [
    p.firma,
    p.nuit ? `NUIT ${p.nuit}` : '',
    p.nuel ? `NUEL ${p.nuel}` : '',
    p.alvara ? `Alvará ${p.alvara}` : '',
    // Licence of a clinic, school, pharmacy, contractor… (community appointment acts are not printed here).
    p.licenca && p.tipoEntidade !== 'comunitaria' ? p.licenca : '',
    cap != null ? `Capital social ${formatMoney(cap)}` : p.capitalSocial ? `Capital social ${p.capitalSocial}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

