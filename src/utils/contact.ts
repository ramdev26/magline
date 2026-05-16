/** Display contact person, phone, and email together (table / summaries). */
export function formatInquiryContact(row: {
  contactDetails?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}) {
  const parts = [row.contactDetails, row.contactPhone, row.contactEmail].filter(
    (v) => v != null && String(v).trim() !== ''
  );
  return parts.length ? parts.join(' · ') : null;
}
