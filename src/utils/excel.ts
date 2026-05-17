import * as XLSX from 'xlsx';
import type { Engineer, Inquiry, SalesPerson } from '../types';

/** Column headers matching the Magline inquiry register spreadsheet */
export const EXCEL_HEADERS = [
  'Serial No',
  'Inquiry Received Date',
  'Mode of Inquiry',
  'Customer Name',
  'Contact Person',
  'Phone Number',
  'Email Address',
  'Project Name',
  'Document',
  'Sales Person',
  'Quotation Required Date',
  'Engineer',
  'Quotation No',
  'Quotation Amount',
  'Quotation Submitted Date',
  'Ongoing/Tender',
  'JSB No',
  'PO No',
  'PO Received Date',
  'Awarded Party',
  'Awarded Price',
  'Remarks',
  'Category',
] as const;

const HEADER_ALIASES: Record<string, string> = {
  'serial no': 'Serial No',
  's/n': 'Serial No',
  'sn': 'Serial No',
  'inquiry recived date': 'Inquiry Received Date',
  'inquiry received date': 'Inquiry Received Date',
  'mode of inquiry': 'Mode of Inquiry',
  'customer name': 'Customer Name',
  'contact details': 'Contact Person',
  'contact person': 'Contact Person',
  'phone': 'Phone Number',
  'phone number': 'Phone Number',
  'mobile': 'Phone Number',
  'tel': 'Phone Number',
  'email': 'Email Address',
  'email address': 'Email Address',
  'e-mail': 'Email Address',
  'project name': 'Project Name',
  document: 'Document',
  'sales person': 'Sales Person',
  'quotation required date': 'Quotation Required Date',
  engineer: 'Engineer',
  'quotation no': 'Quotation No',
  'quotation no.': 'Quotation No',
  'quotation amount': 'Quotation Amount',
  'quotation submitted date': 'Quotation Submitted Date',
  'ongoing/tender': 'Ongoing/Tender',
  'ongoing tender': 'Ongoing/Tender',
  'jsb no': 'JSB No',
  'jsb no.': 'JSB No',
  'po no': 'PO No',
  'po no.': 'PO No',
  'po recived date': 'PO Received Date',
  'po received date': 'PO Received Date',
  'awrded party': 'Awarded Party',
  'awarded party': 'Awarded Party',
  'awrded price': 'Awarded Price',
  'awarded price': 'Awarded Price',
  remarks: 'Remarks',
  category: 'Category',
};

function normalizeKey(key: string) {
  return HEADER_ALIASES[key.trim().toLowerCase()] ?? key.trim();
}

function normalizeRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[normalizeKey(key)] = value;
  }
  return out;
}

function cellString(value: unknown) {
  if (value == null || value === '') return '';
  return String(value).trim();
}

function cellNumber(value: unknown) {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
}

function excelDateToIso(value: unknown) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const d = new Date(parsed.y, parsed.m - 1, parsed.d);
      return d.toISOString().split('T')[0];
    }
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return str || null;
}

export function inquiryToExcelRow(row: Inquiry) {
  return {
    'Serial No': row.serialNo,
    'Inquiry Received Date': row.inquiryReceivedDate ?? '',
    'Mode of Inquiry': row.modeOfInquiry ?? '',
    'Customer Name': row.customerName,
    'Contact Person': row.contactDetails ?? '',
    'Phone Number': row.contactPhone ?? '',
    'Email Address': row.contactEmail ?? '',
    'Project Name': row.projectName ?? '',
    Document: row.document ?? '',
    'Sales Person': row.salesPersonName ?? '',
    'Quotation Required Date': row.quotationRequiredDate ?? '',
    Engineer: row.engineer ?? '',
    'Quotation No': row.quotationNo ?? '',
    'Quotation Amount': row.quotationAmount ?? '',
    'Quotation Submitted Date': row.quotationSubmittedDate ?? '',
    'Ongoing/Tender': row.ongoingTender ?? '',
    'JSB No': row.jsbNo ?? '',
    'PO No': row.poNo ?? '',
    'PO Received Date': row.poReceivedDate ?? '',
    'Awarded Party': row.awardedParty ?? '',
    'Awarded Price': row.awardedPrice ?? '',
    Remarks: row.remarks ?? '',
    Category: row.category ?? '',
  };
}

export function rowToInquiryPayload(
  raw: Record<string, unknown>,
  salesPersons: SalesPerson[],
  engineers: Engineer[] = []
) {
  const row = normalizeRow(raw);
  const salesName = cellString(row['Sales Person']);
  const matchedSales = salesPersons.find(
    (p) => p.name.toLowerCase() === salesName.toLowerCase()
  );
  const engineerName = cellString(row['Engineer']);
  const matchedEngineer = engineers.find(
    (e) => e.name.toLowerCase() === engineerName.toLowerCase()
  );

  const customerName = cellString(row['Customer Name']);
  if (!customerName) return null;

  const category = cellString(row['Category']).toUpperCase();
  const validCategory =
    category === 'LV' || category === 'CMS' || category === 'MEP' ? category : 'LV';

  return {
    inquiryReceivedDate: excelDateToIso(row['Inquiry Received Date']),
    modeOfInquiry: cellString(row['Mode of Inquiry']) || null,
    customerName,
    contactDetails:
      cellString(row['Contact Person']) || cellString(row['Contact Details']) || null,
    contactPhone: cellString(row['Phone Number']) || null,
    contactEmail: cellString(row['Email Address']) || null,
    projectName: cellString(row['Project Name']) || null,
    document: cellString(row['Document']) || null,
    salesPersonId: matchedSales?.id ?? null,
    quotationRequiredDate: excelDateToIso(row['Quotation Required Date']),
    engineerId: matchedEngineer?.id ?? null,
    engineer: engineerName || null,
    quotationNo: cellString(row['Quotation No']) || null,
    quotationAmount: cellNumber(row['Quotation Amount']),
    quotationSubmittedDate: excelDateToIso(row['Quotation Submitted Date']),
    ongoingTender: cellString(row['Ongoing/Tender']) || null,
    jsbNo: cellString(row['JSB No']) || null,
    poNo: cellString(row['PO No']) || null,
    poReceivedDate: excelDateToIso(row['PO Received Date']),
    awardedParty: cellString(row['Awarded Party']) || null,
    awardedPrice: cellNumber(row['Awarded Price']),
    remarks: cellString(row['Remarks']) || null,
    category: validCategory,
  };
}

export function exportInquiriesToExcel(inquiries: Inquiry[]) {
  const rows = inquiries.map(inquiryToExcelRow);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...EXCEL_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Inquiries');
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `magline-inquiries-${date}.xlsx`);
}

export function parseInquiriesFromExcel(
  buffer: ArrayBuffer,
  salesPersons: SalesPerson[],
  engineers: Engineer[] = []
) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const payloads: Record<string, unknown>[] = [];
  const skipped: number[] = [];

  json.forEach((raw, index) => {
    const payload = rowToInquiryPayload(raw, salesPersons, engineers);
    if (payload) payloads.push(payload);
    else skipped.push(index + 2);
  });

  return { payloads, skipped };
}
