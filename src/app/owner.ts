// Ownership and contact details shown in the app (footer, About, Terms).
// Fill in `contactEmail` to show a contact address on the legal pages.

export const OWNER = {
  name: 'Omar Vayani',
  product: 'Documentos MZ',
  contactEmail: '',
  firstYear: 2026,
};

export function copyrightLine(): string {
  const y = new Date().getFullYear();
  const years = y > OWNER.firstYear ? `${OWNER.firstYear}–${y}` : String(OWNER.firstYear);
  return `© ${years} ${OWNER.name}`;
}
