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
} as const;

export async function dashboard(_req: ApiRequest, res: ApiResponse) {
  const [inquiries, customers, salesPersons] = await Promise.all([
    prisma.inquiry.findMany({
      include: inquiryInclude,
      orderBy: { serialNo: "desc" },
    }),
    prisma.customer.count(),
    prisma.salesPerson.findMany({
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
      const data = inquiryDataFromBody(items[i] as Record<string, unknown>);
      if (!data.customerName?.trim()) {
        errors.push({ row: i + 1, message: "Customer name is required" });
        continue;
      }
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
  "SALES_MANAGER",
  "ASSISTANT_SALES_MANAGER",
  "SENIOR_SALES_EXECUTIVE",
  "SALES_EXECUTIVE",
  "JUNIOR_SALES_EXECUTIVE",
] as const;

function parseSalesDesignation(value: unknown) {
  const designation = String(value ?? "SALES_EXECUTIVE").toUpperCase();
  if (SALES_DESIGNATIONS.includes(designation as (typeof SALES_DESIGNATIONS)[number])) {
    return designation as (typeof SALES_DESIGNATIONS)[number];
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

export async function sales(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const [persons, managers] = await Promise.all([
      prisma.salesPerson.findMany({
        include: { inquiries: { orderBy: { serialNo: "desc" } }, manager: true },
        orderBy: { name: "asc" },
      }),
      prisma.salesManager.findMany({ orderBy: { name: "asc" } }),
    ]);

    const mappedPersons = persons.map((p) => mapSalesPerson(p));

    return res.status(200).json({
      persons: mappedPersons,
      managers: managers.map((manager) => {
        const team = persons.filter((p) => p.managerId === manager.id);
        return {
          id: manager.id,
          name: manager.name,
          department: manager.department,
          createdAt: manager.createdAt.toISOString(),
          teamSize: team.length,
          salesPersons: team.map((p) => mapSalesPerson(p, true)),
        };
      }),
    });
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const type = String(body.type ?? "person");

    if (type === "manager") {
      const created = await prisma.salesManager.create({
        data: {
          name: String(body.name ?? ""),
          department: String(body.department ?? ""),
        },
      });
      return res.status(201).json(created);
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
