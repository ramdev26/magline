import type { ApiRequest, ApiResponse } from "../types.js";
import { prisma } from "./prisma.js";
import { OrderCategory, Prisma } from "@prisma/client";
import { inquiryDataFromBody, mapInquiry, toNumber } from "./inquiry-mapper.js";

function parseBody(req: ApiRequest) {
  return (req.body ?? {}) as Record<string, unknown>;
}

const inquiryInclude = {
  customer: true,
  salesPerson: true,
  engineer: true,
} as const;

export async function dashboard(_req: ApiRequest, res: ApiResponse) {
  const [inquiries, customers, salesPersons] = await Promise.all([
    prisma.inquiry.findMany({
      include: inquiryInclude,
      orderBy: { serialNo: "desc" },
    }),
    prisma.customer.count(),
    prisma.salesPerson.findMany({
      where: { status: "ACTIVE" },
      include: { inquiries: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalSales = inquiries.reduce(
    (acc, row) => acc + (toNumber(row.quotationAmount) ?? 0),
    0
  );
  const activeOrders = inquiries.filter((row) => !row.poNo).length;
  const categories: OrderCategory[] = ["LV", "CMS", "MEP"];

  const statsByCategory = categories.map((name) => ({
    name,
    value: inquiries
      .filter((row) => row.category === name)
      .reduce((acc, row) => acc + (toNumber(row.quotationAmount) ?? 0), 0),
  }));

  const recentOrders = inquiries.slice(0, 8).map((row) => ({
    id: row.id,
    serialNo: row.serialNo,
    customerName: row.customerName || row.customer?.name || "",
    projectName: row.projectName,
    amount: toNumber(row.quotationAmount) ?? 0,
    date: row.inquiryReceivedDate?.toISOString().split("T")[0] ?? "",
    ongoingTender: row.ongoingTender,
    category: row.category,
  }));

  const topSalesPersons = salesPersons
    .map((person) => ({
      id: person.id,
      name: person.name,
      designation: person.designation,
      totalSales: person.inquiries.reduce(
        (acc, row) => acc + (toNumber(row.quotationAmount) ?? 0),
        0
      ),
    }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 8);

  res.status(200).json({
    totalSales,
    activeOrders,
    totalCustomers: customers,
    statsByCategory,
    recentOrders,
    topSalesPersons,
  });
}

const CUSTOMER_STATUSES = ["NEW", "OLD", "ACTIVE", "INACTIVE"] as const;

const customerInclude = {
  additionalContacts: { orderBy: { createdAt: "asc" as const } },
  salesPerson: true,
};

function mapCustomerContact(row: { id: string; contact: string; email: string; phone: string }) {
  return { id: row.id, contact: row.contact, email: row.email, phone: row.phone };
}

function parseCustomerStatus(value: unknown) {
  const status = String(value ?? "NEW").toUpperCase();
  if (CUSTOMER_STATUSES.includes(status as (typeof CUSTOMER_STATUSES)[number])) {
    return status as (typeof CUSTOMER_STATUSES)[number];
  }
  return "NEW";
}

function parseAdditionalContacts(body: Record<string, unknown>) {
  const raw = body.additionalContacts;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      contact: String(item.contact ?? ""),
      email: String(item.email ?? ""),
      phone: String(item.phone ?? ""),
    }))
    .filter((item) => item.contact.trim() || item.email.trim() || item.phone.trim());
}

function mapCustomer(row: {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  status: (typeof CUSTOMER_STATUSES)[number];
  salesPersonId: string | null;
  createdAt: Date;
  salesPerson?: { name: string } | null;
  additionalContacts: { id: string; contact: string; email: string; phone: string }[];
}) {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status,
    salesPersonId: row.salesPersonId,
    salesPersonName: row.salesPerson?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    additionalContacts: row.additionalContacts.map(mapCustomerContact),
  };
}

function customerDataFromBody(body: Record<string, unknown>) {
  const additionalContacts = parseAdditionalContacts(body);
  return {
    name: String(body.name ?? ""),
    contact: String(body.contact ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    address: String(body.address ?? ""),
    status: parseCustomerStatus(body.status),
    salesPersonId: body.salesPersonId ? String(body.salesPersonId) : null,
    additionalContacts,
  };
}

export async function customers(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const list = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: customerInclude,
    });
    return res.status(200).json(list.map(mapCustomer));
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const data = customerDataFromBody(body);
    const created = await prisma.customer.create({
      data: {
        name: data.name,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status,
        salesPersonId: data.salesPersonId,
        additionalContacts: data.additionalContacts.length
          ? { create: data.additionalContacts }
          : undefined,
      },
      include: customerInclude,
    });
    return res.status(201).json(mapCustomer(created));
  }

  res.status(405).json({ error: "Method not allowed" });
}

export async function updateCustomer(req: ApiRequest, res: ApiResponse, id: string) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const data = customerDataFromBody(body);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.customerContact.deleteMany({ where: { customerId: id } });
    return tx.customer.update({
      where: { id },
      data: {
        name: data.name,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status,
        salesPersonId: data.salesPersonId,
        additionalContacts: data.additionalContacts.length
          ? { create: data.additionalContacts }
          : undefined,
      },
      include: customerInclude,
    });
  });

  return res.status(200).json(mapCustomer(updated));
}

type InquiryWriteData = ReturnType<typeof inquiryDataFromBody>;

async function applyCustomerToInquiryData(data: InquiryWriteData) {
  if (!data.customerId) return;
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) return;
  data.customerName = customer.name;
  data.contactDetails = customer.contact || null;
  data.contactPhone = customer.phone || null;
  data.contactEmail = customer.email || null;
}

async function resolveEngineerIdByName(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const engineer = await prisma.engineer.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" }, active: true },
  });
  return engineer?.id ?? null;
}

async function applyEngineerToInquiryData(
  data: InquiryWriteData,
  body: Record<string, unknown>
) {
  if (data.engineerId) {
    const engineer = await prisma.engineer.findFirst({
      where: { id: data.engineerId, active: true },
    });
    if (!engineer) data.engineerId = null;
    return;
  }
  const legacyName = body.engineer ? String(body.engineer) : null;
  data.engineerId = await resolveEngineerIdByName(legacyName);
}

export async function inquiries(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const list = await prisma.inquiry.findMany({
      include: inquiryInclude,
      orderBy: { serialNo: "desc" },
    });
    return res.status(200).json(list.map(mapInquiry));
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const data = inquiryDataFromBody(body);

    if (!data.customerId) {
      return res.status(400).json({ error: "Customer is required" });
    }

    await applyCustomerToInquiryData(data);
    await applyEngineerToInquiryData(data, body);

    const created = await prisma.inquiry.create({
      data,
      include: inquiryInclude,
    });
    return res.status(201).json(mapInquiry(created));
  }

  res.status(405).json({ error: "Method not allowed" });
}

export async function bulkImportInquiries(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const items = body.inquiries;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "inquiries array is required" });
  }

  let created = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const rowBody = items[i] as Record<string, unknown>;
      const data = inquiryDataFromBody(rowBody);
      if (!data.customerName?.trim()) {
        errors.push({ row: i + 1, message: "Customer name is required" });
        continue;
      }
      await applyEngineerToInquiryData(data, rowBody);
      await prisma.inquiry.create({ data });
      created++;
    } catch (err) {
      errors.push({ row: i + 1, message: err instanceof Error ? err.message : "Import failed" });
    }
  }

  return res.status(200).json({ created, errors, total: items.length });
}

export async function updateInquiry(req: ApiRequest, res: ApiResponse, id: string) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const data = inquiryDataFromBody(body);

  if (!data.customerId) {
    return res.status(400).json({ error: "Customer is required" });
  }

  await applyCustomerToInquiryData(data);
  await applyEngineerToInquiryData(data, body);

  const updated = await prisma.inquiry.update({
    where: { id },
    data,
    include: inquiryInclude,
  });

  return res.status(200).json(mapInquiry(updated));
}

/** @deprecated use inquiries */
export const orders = inquiries;

const SALES_DESIGNATIONS = [
  "ASSISTANT_SALES_MANAGER",
  "SENIOR_SALES_EXECUTIVE",
  "SALES_EXECUTIVE",
  "JUNIOR_SALES_EXECUTIVE",
] as const;

const SALES_SUSPENSION_REASONS = [
  "INACTIVE",
  "RESIGNED",
  "TERMINATED",
  "ON_LEAVE",
  "TRANSFERRED",
  "OTHER",
] as const;

function parseSalesSuspensionReason(value: unknown) {
  const raw = String(value ?? "").toUpperCase();
  if (SALES_SUSPENSION_REASONS.includes(raw as (typeof SALES_SUSPENSION_REASONS)[number])) {
    return raw as (typeof SALES_SUSPENSION_REASONS)[number];
  }
  return null;
}

function mapMemberStatusFields(row: {
  status: "ACTIVE" | "SUSPENDED";
  suspensionReason: (typeof SALES_SUSPENSION_REASONS)[number] | null;
  suspensionNote: string | null;
  suspendedAt: Date | null;
}) {
  return {
    status: row.status,
    suspensionReason: row.suspensionReason,
    suspensionNote: row.suspensionNote,
    suspendedAt: row.suspendedAt?.toISOString() ?? null,
  };
}

function parseSalesDesignation(value: unknown) {
  const raw = String(value ?? "SALES_EXECUTIVE").toUpperCase();
  if (raw === "SALES_MANAGER") return "ASSISTANT_SALES_MANAGER";
  if (SALES_DESIGNATIONS.includes(raw as (typeof SALES_DESIGNATIONS)[number])) {
    return raw as (typeof SALES_DESIGNATIONS)[number];
  }
  return "SALES_EXECUTIVE";
}

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return value.toISOString().split("T")[0];
}

function mapSalesPerson(
  p: {
    id: string;
    name: string;
    designation: (typeof SALES_DESIGNATIONS)[number];
    status: "ACTIVE" | "SUSPENDED";
    suspensionReason: (typeof SALES_SUSPENSION_REASONS)[number] | null;
    suspensionNote: string | null;
    suspendedAt: Date | null;
    managerId: string | null;
    manager?: { name: string } | null;
    inquiries: {
      id: string;
      serialNo: number;
      customerName: string;
      projectName: string | null;
      quotationAmount: Prisma.Decimal | number | null;
      inquiryReceivedDate: Date | null;
    }[];
  },
  includeInquiryDetails = false
) {
  const totalSales = p.inquiries.reduce(
    (acc, row) => acc + (toNumber(row.quotationAmount) ?? 0),
    0
  );

  return {
    id: p.id,
    name: p.name,
    designation: p.designation,
    ...mapMemberStatusFields(p),
    managerId: p.managerId,
    managerName: p.manager?.name ?? null,
    history: p.inquiries.map((o) => String(o.serialNo)),
    totalSales,
    inquiries: includeInquiryDetails
      ? p.inquiries.map((row) => ({
          id: row.id,
          serialNo: row.serialNo,
          customerName: row.customerName,
          projectName: row.projectName,
          quotationAmount: toNumber(row.quotationAmount),
          inquiryReceivedDate: formatDate(row.inquiryReceivedDate),
        }))
      : undefined,
  };
}

function teamSalesTotal(
  persons: { inquiries: { quotationAmount: Prisma.Decimal | number | null }[] }[]
) {
  return persons.reduce(
    (sum, person) =>
      sum +
      person.inquiries.reduce((acc, row) => acc + (toNumber(row.quotationAmount) ?? 0), 0),
    0
  );
}

const DEFAULT_HEAD_OF_SALES_NAME = "Lucky Gamage";
const DEFAULT_HEAD_OF_SALES_DEPARTMENT = "Sales Division";

async function ensureDefaultHeadOfSales() {
  let head = await prisma.headOfSales.findFirst({
    where: { name: DEFAULT_HEAD_OF_SALES_NAME },
  });
  if (!head) {
    head = await prisma.headOfSales.create({
      data: {
        name: DEFAULT_HEAD_OF_SALES_NAME,
        department: DEFAULT_HEAD_OF_SALES_DEPARTMENT,
      },
    });
  }

  await prisma.salesManager.updateMany({
    data: { headOfSalesId: head.id },
  });

  await prisma.headOfSales.deleteMany({
    where: { id: { not: head.id } },
  });

  return head;
}

function mapHeadRow(
  head: { id: string; name: string; department: string; createdAt: Date },
  mappedManagers: ReturnType<typeof mapManagerRow>[],
  persons: Parameters<typeof mapSalesPerson>[0][]
) {
  const underManagers = mappedManagers.filter((m) => m.headOfSalesId === head.id);
  const activeManagers = underManagers.filter((m) => m.status === "ACTIVE");
  const allTeamPersons = persons.filter((p) =>
    underManagers.some((m) => m.id === p.managerId)
  );
  return {
    id: head.id,
    name: head.name,
    department: head.department,
    createdAt: head.createdAt.toISOString(),
    managerCount: activeManagers.length,
    totalTeamSales: teamSalesTotal(allTeamPersons),
    salesManagers: underManagers,
  };
}

function mapManagerRow(
  manager: {
    id: string;
    name: string;
    department: string;
    status: "ACTIVE" | "SUSPENDED";
    suspensionReason: (typeof SALES_SUSPENSION_REASONS)[number] | null;
    suspensionNote: string | null;
    suspendedAt: Date | null;
    headOfSalesId: string | null;
    createdAt: Date;
    headOfSales?: { name: string } | null;
  },
  persons: Parameters<typeof mapSalesPerson>[0][]
) {
  const team = persons.filter((p) => p.managerId === manager.id);
  const salesPersons = team.map((p) => mapSalesPerson(p, true));
  return {
    id: manager.id,
    name: manager.name,
    department: manager.department,
    ...mapMemberStatusFields(manager),
    headOfSalesId: manager.headOfSalesId,
    headOfSalesName: manager.headOfSales?.name ?? null,
    createdAt: manager.createdAt.toISOString(),
    teamSize: team.length,
    totalTeamSales: teamSalesTotal(team),
    salesPersons,
  };
}

export async function sales(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const head = await ensureDefaultHeadOfSales();
    const activeOnlyParam = req.query?.activeOnly;
    const activeOnly =
      activeOnlyParam === "1" ||
      activeOnlyParam === "true" ||
      (Array.isArray(activeOnlyParam) &&
        (activeOnlyParam.includes("1") || activeOnlyParam.includes("true")));

    const statusFilter = activeOnly ? { status: "ACTIVE" as const } : {};

    const [persons, managers] = await Promise.all([
      prisma.salesPerson.findMany({
        where: statusFilter,
        include: { inquiries: { orderBy: { serialNo: "desc" } }, manager: true },
        orderBy: { name: "asc" },
      }),
      prisma.salesManager.findMany({
        where: statusFilter,
        include: { headOfSales: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const mappedManagers = managers.map((manager) => mapManagerRow(manager, persons));

    return res.status(200).json({
      persons: persons.map((p) => mapSalesPerson(p, true)),
      managers: mappedManagers,
      head: mapHeadRow(head, mappedManagers, persons),
    });
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const type = String(body.type ?? "person");

    if (type === "head") {
      return res.status(400).json({ error: "Head of Sales is fixed and cannot be added." });
    }

    if (type === "manager") {
      const head = await ensureDefaultHeadOfSales();
      const created = await prisma.salesManager.create({
        data: {
          name: String(body.name ?? ""),
          department: String(body.department ?? ""),
          headOfSalesId: head.id,
        },
        include: { headOfSales: true },
      });
      return res.status(201).json(mapManagerRow(created, []));
    }

    const created = await prisma.salesPerson.create({
      data: {
        name: String(body.name ?? ""),
        designation: parseSalesDesignation(body.designation),
        managerId: body.managerId ? String(body.managerId) : null,
      },
      include: { inquiries: true, manager: true },
    });
    return res.status(201).json(mapSalesPerson(created));
  }

  res.status(405).json({ error: "Method not allowed" });
}

export async function updateSalesManager(req: ApiRequest, res: ApiResponse, id: string) {
  if (req.method !== "PATCH" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const data: {
    name?: string;
    department?: string;
    status?: "ACTIVE" | "SUSPENDED";
    suspensionReason?: (typeof SALES_SUSPENSION_REASONS)[number] | null;
    suspensionNote?: string | null;
    suspendedAt?: Date | null;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return res.status(400).json({ error: "Name is required" });
    data.name = name;
  }
  if (body.department !== undefined) {
    data.department = String(body.department).trim();
  }
  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return res.status(400).json({ error: "Invalid status" });
    }
    data.status = status;
    if (status === "SUSPENDED") {
      const reason = parseSalesSuspensionReason(body.suspensionReason);
      if (!reason) {
        return res.status(400).json({ error: "Suspension reason is required" });
      }
      data.suspensionReason = reason;
      data.suspensionNote = body.suspensionNote ? String(body.suspensionNote).trim() : null;
      data.suspendedAt = new Date();
    } else {
      data.suspensionReason = null;
      data.suspensionNote = null;
      data.suspendedAt = null;
    }
  }

  const head = await ensureDefaultHeadOfSales();
  const updated = await prisma.salesManager.update({
    where: { id },
    data: { ...data, headOfSalesId: head.id },
    include: { headOfSales: true },
  });

  const persons = await prisma.salesPerson.findMany({
    include: { inquiries: { orderBy: { serialNo: "desc" } }, manager: true },
  });

  return res.status(200).json(mapManagerRow(updated, persons));
}

export async function updateSalesPerson(req: ApiRequest, res: ApiResponse, id: string) {
  if (req.method !== "PATCH" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const data: {
    name?: string;
    designation?: (typeof SALES_DESIGNATIONS)[number];
    managerId?: string | null;
    status?: "ACTIVE" | "SUSPENDED";
    suspensionReason?: (typeof SALES_SUSPENSION_REASONS)[number] | null;
    suspensionNote?: string | null;
    suspendedAt?: Date | null;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return res.status(400).json({ error: "Name is required" });
    data.name = name;
  }
  if (body.designation !== undefined) {
    data.designation = parseSalesDesignation(body.designation);
  }
  if (body.managerId !== undefined) {
    data.managerId = body.managerId ? String(body.managerId) : null;
    if (data.managerId) {
      const manager = await prisma.salesManager.findFirst({
        where: { id: data.managerId, status: "ACTIVE" },
      });
      if (!manager) {
        return res.status(400).json({ error: "Selected sales manager is not active" });
      }
    }
  }
  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return res.status(400).json({ error: "Invalid status" });
    }
    data.status = status;
    if (status === "SUSPENDED") {
      const reason = parseSalesSuspensionReason(body.suspensionReason);
      if (!reason) {
        return res.status(400).json({ error: "Suspension reason is required" });
      }
      data.suspensionReason = reason;
      data.suspensionNote = body.suspensionNote ? String(body.suspensionNote).trim() : null;
      data.suspendedAt = new Date();
    } else {
      data.suspensionReason = null;
      data.suspensionNote = null;
      data.suspendedAt = null;
    }
  }

  const updated = await prisma.salesPerson.update({
    where: { id },
    data,
    include: { inquiries: { orderBy: { serialNo: "desc" } }, manager: true },
  });

  return res.status(200).json(mapSalesPerson(updated, true));
}

function mapEngineer(row: { id: string; name: string; active: boolean; createdAt: Date }) {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function engineers(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const list = await prisma.engineer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return res.status(200).json(list.map(mapEngineer));
  }

  res.status(405).json({ error: "Method not allowed" });
}

export async function createEngineer(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const name = String(body.name ?? "").trim();
  if (!name) {
    return res.status(400).json({ error: "Engineer name is required" });
  }

  const existing = await prisma.engineer.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    if (!existing.active) {
      const restored = await prisma.engineer.update({
        where: { id: existing.id },
        data: { active: true, name },
      });
      return res.status(200).json(mapEngineer(restored));
    }
    return res.status(409).json({ error: "An engineer with this name already exists" });
  }

  const created = await prisma.engineer.create({ data: { name } });
  return res.status(201).json(mapEngineer(created));
}

export async function listAllEngineers(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const list = await prisma.engineer.findMany({ orderBy: { name: "asc" } });
  return res.status(200).json(list.map(mapEngineer));
}

export async function updateEngineer(req: ApiRequest, res: ApiResponse, id: string) {
  if (req.method !== "PATCH" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const data: { name?: string; active?: boolean } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return res.status(400).json({ error: "Engineer name cannot be empty" });
    }
    data.name = name;
  }
  if (body.active !== undefined) {
    data.active = Boolean(body.active);
  }

  const updated = await prisma.engineer.update({ where: { id }, data });
  return res.status(200).json(mapEngineer(updated));
}
