import { Inquiry, InquiryFollowUpStatus, Prisma } from "@prisma/client";
import {
  parseAssignee,
  resolveAssigneeKey,
  resolveAssigneeName,
  resolveAssigneeType,
} from "./assignee.js";

export function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return null;
  return typeof value === "number" ? value : Number(value);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return value.toISOString().split("T")[0];
}

const FOLLOW_UP_STATUSES = [
  "CONSULTANT_REVIEW",
  "DRAWING_CONFIRMATION_SENT",
  "DRAWING_APPROVAL_PENDING",
  "PRICE_NEGOTIATING",
  "PENDING_CONSULTANT_APPROVAL",
  "CHANGES_PROPOSED_BY_MAGLINE",
  "CHANGES_PROPOSED_BY_CLIENT",
  "PENDING_TENDER",
  "TENDER_LOSS",
  "TENDER_WON",
  "OTHER_MATTER",
] as const;

function parseFollowUpStatus(value: unknown): InquiryFollowUpStatus {
  const status = String(value ?? "CONSULTANT_REVIEW").toUpperCase();
  if (FOLLOW_UP_STATUSES.includes(status as (typeof FOLLOW_UP_STATUSES)[number])) {
    return status as InquiryFollowUpStatus;
  }
  return "CONSULTANT_REVIEW";
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

function parseDocuments(body: Record<string, unknown>) {
  const raw = body.documents;
  if (!Array.isArray(raw)) {
    const legacy = body.document ? String(body.document) : "";
    if (legacy.trim()) {
      return [{ fileName: legacy.trim(), remarks: "", fileData: null }];
    }
    return [];
  }
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      fileName: String(item.fileName ?? ""),
      remarks: String(item.remarks ?? ""),
      fileData: item.fileData ? String(item.fileData) : null,
    }))
    .filter((item) => item.fileName.trim() || item.fileData);
}

function parseFollowUps(body: Record<string, unknown>) {
  const raw = body.followUps;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      status: parseFollowUpStatus(item.status),
      remarks: String(item.remarks ?? ""),
      followUpDate: parseOptionalDate(item.followUpDate),
      followUpBy: String(item.followUpBy ?? ""),
    }))
    .filter(
      (item) => item.remarks.trim() || item.followUpBy.trim() || item.followUpDate
    );
}

type InquiryRow = Inquiry & {
  projectRemark?: string | null;
  customer?: { name: string } | null;
  salesPerson?: { name: string } | null;
  salesManager?: { name: string } | null;
  headOfSales?: { name: string } | null;
  engineer?: { name: string } | null;
  documents?: { id: string; fileName: string; remarks: string; fileData: string | null }[];
  followUps?: {
    id: string;
    status: InquiryFollowUpStatus;
    remarks: string;
    followUpDate: Date | null;
    followUpBy: string;
  }[];
};

export function mapInquiry(row: InquiryRow) {
  const assigneeType = resolveAssigneeType(row);
  const assigneeKey = resolveAssigneeKey(row);
  const documents =
    row.documents?.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      remarks: doc.remarks,
      fileData: doc.fileData,
    })) ?? (row.document ? [{ fileName: row.document, remarks: "", fileData: null }] : []);

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
    projectRemark: row.projectRemark,
    document: row.document,
    documents,
    assigneeType,
    assigneeId: assigneeKey ? (assigneeKey.split(":")[1] ?? null) : null,
    salesPersonId: row.salesPersonId,
    salesPersonName: resolveAssigneeName(row),
    quotationRequiredDate: formatDate(row.quotationRequiredDate),
    engineerId: row.engineerId,
    engineer: row.engineer?.name ?? null,
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
    followUps:
      row.followUps?.map((fu) => ({
        id: fu.id,
        status: fu.status,
        remarks: fu.remarks,
        followUpDate: formatDate(fu.followUpDate),
        followUpBy: fu.followUpBy,
      })) ?? [],
    category: row.category,
  };
}

export function inquiryDataFromBody(body: Record<string, unknown>) {
  const assignee = parseAssignee(body);
  const documents = parseDocuments(body);
  const followUps = parseFollowUps(body);
  const legacyDocument = documents[0]?.fileName ?? (body.document ? String(body.document) : null);

  return {
    inquiryReceivedDate: parseOptionalDate(body.inquiryReceivedDate),
    modeOfInquiry: body.modeOfInquiry ? String(body.modeOfInquiry) : null,
    customerId: body.customerId ? String(body.customerId) : null,
    customerName: String(body.customerName ?? ""),
    contactDetails: body.contactDetails ? String(body.contactDetails) : null,
    contactPhone: body.contactPhone ? String(body.contactPhone) : null,
    contactEmail: body.contactEmail ? String(body.contactEmail) : null,
    projectName: body.projectName ? String(body.projectName) : null,
    projectRemark: body.projectRemark ? String(body.projectRemark) : null,
    document: legacyDocument,
    ...assignee,
    quotationRequiredDate: parseOptionalDate(body.quotationRequiredDate),
    engineerId: body.engineerId ? String(body.engineerId) : null,
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
    documents,
    followUps,
  };
}
