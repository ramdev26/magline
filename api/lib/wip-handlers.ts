import type { ApiRequest, ApiResponse } from "../types.js";
import { prisma } from "./prisma.js";
import {
  OrderCategory,
  Prisma,
  WipDelayReason,
  WipPaymentStatus,
  WipReturnReason,
} from "@prisma/client";

const PAYMENT_STATUSES = [
  "NOT_PAID",
  "PAID_0_10",
  "PAID_10_50",
  "PAID_50_75",
  "PAID_75_99",
  "PAID_FULLY",
  "CREDIT_30_DAYS",
  "FULLY_ON_DELIVERY",
] as const satisfies readonly WipPaymentStatus[];

const DELAY_REASONS = [
  "COLOR_MISMATCHED",
  "COST_ISSUES",
  "ITEM_MISTAKES",
  "FACTORY_PRODUCTION",
] as const satisfies readonly WipDelayReason[];

const RETURN_REASONS = [
  "DAMAGED",
  "WRONG_CHANNEL",
  "PRODUCTION",
] as const satisfies readonly WipReturnReason[];

const CATEGORIES = ["LV", "CMS", "MEP"] as const satisfies readonly OrderCategory[];

const PRODUCTION_STAGES = [
  "PENDING",
  "WELDING",
  "FABRICATION",
  "COLOR_CODE",
  "POWDER_COATING",
  "GALVANIZING",
  "FOAM_FILLING",
  "ELECTRICAL",
  "TO_OUTSOURCE",
] as const;

const DELIVERY_STAGES = [
  "RECEIVING_FROM_OUTSOURCE",
  "ASKED_BY_CLIENT",
  "PLANNED_TO_CLIENT",
  "DELIVERED",
] as const;

function parseBody(req: ApiRequest) {
  return (req.body ?? {}) as Record<string, unknown>;
}

function toNum(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null || value === "") return 0;
  return typeof value === "number" ? value : Number(value);
}

function parseOptionalDate(value: unknown) {
  if (!value || value === "") return null;
  return new Date(String(value));
}

function parseOptionalString(value: unknown) {
  if (value == null) return null;
  const str = String(value).trim();
  return str ? str : null;
}

function parsePaymentStatus(value: unknown): WipPaymentStatus {
  if (typeof value !== "string") return "NOT_PAID";
  const match = PAYMENT_STATUSES.find((status) => status === value);
  return match ?? "NOT_PAID";
}

function parseDelayReason(value: unknown): WipDelayReason | null {
  if (typeof value !== "string" || !value) return null;
  return DELAY_REASONS.find((r) => r === value) ?? null;
}

function parseReturnReason(value: unknown): WipReturnReason | null {
  if (typeof value !== "string" || !value) return null;
  return RETURN_REASONS.find((r) => r === value) ?? null;
}

function parseCategory(value: unknown): OrderCategory | null {
  if (typeof value !== "string" || !value) return null;
  return CATEGORIES.find((c) => c === value) ?? null;
}

function parseStageList(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    if (allowed.includes(item)) set.add(item);
  }
  return Array.from(set);
}

type WipRow = {
  id: string;
  serialNo: number;
  date: Date | null;
  jobNo: string | null;
  poNo: string | null;
  quotationNo: string | null;
  customerId: string | null;
  customer: { name: string } | null;
  customerName: string;
  salesPersonId: string | null;
  salesPerson: { name: string } | null;
  category: OrderCategory | null;
  orderDescription: string;
  unit: string;
  quantity: Prisma.Decimal;
  rate: Prisma.Decimal;
  discount: Prisma.Decimal;
  vatPercent: Prisma.Decimal;
  paymentStatus: WipPaymentStatus;
  productionStages: string[];
  deliveryStages: string[];
  delayReason: WipDelayReason | null;
  delayNote: string | null;
  returnReason: WipReturnReason | null;
  returnNote: string | null;
  notes: string | null;
  createdAt: Date;
};

function mapWip(row: WipRow) {
  const quantity = toNum(row.quantity);
  const rate = toNum(row.rate);
  const discount = toNum(row.discount);
  const vatPercent = toNum(row.vatPercent);
  const amount = Math.max(0, quantity * rate - discount);
  const vat = (amount * vatPercent) / 100;
  const total = amount + vat;
  return {
    id: row.id,
    serialNo: row.serialNo,
    date: row.date ? row.date.toISOString().split("T")[0] : null,
    jobNo: row.jobNo,
    poNo: row.poNo,
    quotationNo: row.quotationNo,
    customerId: row.customerId,
    customerName: row.customerName || row.customer?.name || "",
    salesPersonId: row.salesPersonId,
    salesPersonName: row.salesPerson?.name ?? null,
    category: row.category,
    orderDescription: row.orderDescription,
    unit: row.unit,
    quantity,
    rate,
    discount,
    vatPercent,
    amount,
    vat,
    total,
    paymentStatus: row.paymentStatus,
    productionStages: row.productionStages,
    deliveryStages: row.deliveryStages,
    delayReason: row.delayReason,
    delayNote: row.delayNote,
    returnReason: row.returnReason,
    returnNote: row.returnNote,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

function buildWipData(body: Record<string, unknown>) {
  return {
    date: parseOptionalDate(body.date),
    jobNo: parseOptionalString(body.jobNo),
    poNo: parseOptionalString(body.poNo),
    quotationNo: parseOptionalString(body.quotationNo),
    customerId: parseOptionalString(body.customerId),
    customerName: String(body.customerName ?? "").trim(),
    salesPersonId: parseOptionalString(body.salesPersonId),
    category: parseCategory(body.category),
    orderDescription: String(body.orderDescription ?? "").trim(),
    unit: parseOptionalString(body.unit) ?? "Nos",
    quantity: new Prisma.Decimal(Number(body.quantity ?? 0) || 0),
    rate: new Prisma.Decimal(Number(body.rate ?? 0) || 0),
    discount: new Prisma.Decimal(Number(body.discount ?? 0) || 0),
    vatPercent: new Prisma.Decimal(Number(body.vatPercent ?? 0) || 0),
    paymentStatus: parsePaymentStatus(body.paymentStatus),
    productionStages: parseStageList(body.productionStages, PRODUCTION_STAGES),
    deliveryStages: parseStageList(body.deliveryStages, DELIVERY_STAGES),
    delayReason: parseDelayReason(body.delayReason),
    delayNote: parseOptionalString(body.delayNote),
    returnReason: parseReturnReason(body.returnReason),
    returnNote: parseOptionalString(body.returnNote),
    notes: parseOptionalString(body.notes),
  };
}

const wipInclude = {
  customer: true,
  salesPerson: true,
} as const;

export async function listOrCreateWip(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const rows = await prisma.workInProgress.findMany({
      orderBy: { serialNo: "desc" },
      include: wipInclude,
    });
    return res.status(200).json(rows.map(mapWip));
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const data = buildWipData(body);
    if (!data.customerName) {
      return res.status(400).json({ error: "Customer is required" });
    }
    const created = await prisma.workInProgress.create({
      data,
      include: wipInclude,
    });
    return res.status(201).json(mapWip(created));
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export async function updateWip(req: ApiRequest, res: ApiResponse, id: string) {
  if (req.method !== "PATCH" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = parseBody(req);
  const data = buildWipData(body);
  if (!data.customerName) {
    return res.status(400).json({ error: "Customer is required" });
  }
  const updated = await prisma.workInProgress.update({
    where: { id },
    data,
    include: wipInclude,
  });
  return res.status(200).json(mapWip(updated));
}

export async function deleteWip(req: ApiRequest, res: ApiResponse, id: string) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  await prisma.workInProgress.delete({ where: { id } });
  return res.status(200).json({ ok: true });
}
