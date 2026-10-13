// Ownership and contact details shown in the app (footer, About, Terms).
// Fill in `contactEmail` to show a contact address on the legal pages, and
// `website` (domain only, e.g. "documentosmz.co.mz") to print it in the small
// brand line at the foot of generated documents.

export const OWNER = {
  name: 'Omar Vayani',
  product: 'Documentos MZ',
  contactEmail: '',
  website: '',
  firstYear: 2026,
  version: '2.0.0',
};

export function copyrightLine(): string {
  const y = new Date().getFullYear();
  const years = y > OWNER.firstYear ? `${OWNER.firstYear}–${y}` : String(OWNER.firstYear);
  return `© ${years} ${OWNER.name}`;
}
