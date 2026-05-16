import { Inquiry, Prisma } from "@prisma/client";

export function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return null;
  return typeof value === "number" ? value : Number(value);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return value.toISOString().split("T")[0];
}

export function mapInquiry(
  row: Inquiry & {
    customer?: { name: string } | null;
    salesPerson?: { name: string } | null;
  }
) {
  return {
    id: row.id,
    serialNo: row.serialNo,
    inquiryReceivedDate: formatDate(row.inquiryReceivedDate),
    modeOfInquiry: row.modeOfInquiry,
    customerId: row.customerId,
    customerName: row.customerName || row.customer?.name || "",
    contactDetails: row.contactDetails,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    projectName: row.projectName,
    document: row.document,
    salesPersonId: row.salesPersonId,
    salesPersonName: row.salesPerson?.name ?? null,
    quotationRequiredDate: formatDate(row.quotationRequiredDate),
    engineer: row.engineer,
    quotationNo: row.quotationNo,
    quotationAmount: toNumber(row.quotationAmount),
    quotationSubmittedDate: formatDate(row.quotationSubmittedDate),
    ongoingTender: row.ongoingTender,
    jsbNo: row.jsbNo,
    poNo: row.poNo,
    poReceivedDate: formatDate(row.poReceivedDate),
    awardedParty: row.awardedParty,
    awardedPrice: toNumber(row.awardedPrice),
    remarks: row.remarks,
    category: row.category,
  };
}

export function parseOptionalDate(value: unknown) {
  if (!value || value === "") return null;
  return new Date(String(value));
}

export function parseOptionalDecimal(value: unknown) {
  if (value === "" || value == null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export function inquiryDataFromBody(body: Record<string, unknown>) {
  return {
    inquiryReceivedDate: parseOptionalDate(body.inquiryReceivedDate),
    modeOfInquiry: body.modeOfInquiry ? String(body.modeOfInquiry) : null,
    customerId: body.customerId ? String(body.customerId) : null,
    customerName: String(body.customerName ?? ""),
    contactDetails: body.contactDetails ? String(body.contactDetails) : null,
    contactPhone: body.contactPhone ? String(body.contactPhone) : null,
    contactEmail: body.contactEmail ? String(body.contactEmail) : null,
    projectName: body.projectName ? String(body.projectName) : null,
    document: body.document ? String(body.document) : null,
    salesPersonId: body.salesPersonId ? String(body.salesPersonId) : null,
    quotationRequiredDate: parseOptionalDate(body.quotationRequiredDate),
    engineer: body.engineer ? String(body.engineer) : null,
    quotationNo: body.quotationNo ? String(body.quotationNo) : null,
    quotationAmount: parseOptionalDecimal(body.quotationAmount),
    quotationSubmittedDate: parseOptionalDate(body.quotationSubmittedDate),
    ongoingTender: body.ongoingTender ? String(body.ongoingTender) : null,
    jsbNo: body.jsbNo ? String(body.jsbNo) : null,
    poNo: body.poNo ? String(body.poNo) : null,
    poReceivedDate: parseOptionalDate(body.poReceivedDate),
    awardedParty: body.awardedParty ? String(body.awardedParty) : null,
    awardedPrice: parseOptionalDecimal(body.awardedPrice),
    remarks: body.remarks ? String(body.remarks) : null,
    category: body.category ? (String(body.category) as "LV" | "CMS" | "MEP") : null,
  };
}
