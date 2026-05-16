import type { ApiRequest, ApiResponse } from "../types.js";
import { prisma } from "./prisma.js";
import { OrderCategory } from "@prisma/client";
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

  const topSalesPersons = salesPersons.map((person) => ({
    id: person.id,
    name: person.name,
    performance: person.performance,
    totalSales: person.inquiries.reduce(
      (acc, row) => acc + (toNumber(row.quotationAmount) ?? 0),
      0
    ),
  }));

  res.status(200).json({
    totalSales,
    activeOrders,
    totalCustomers: customers,
    statsByCategory,
    recentOrders,
    topSalesPersons,
  });
}

export async function customers(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const list = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
    return res.status(200).json(list);
  }

  if (req.method === "POST") {
    const body = parseBody(req);
    const created = await prisma.customer.create({
      data: {
        name: String(body.name ?? ""),
        contact: String(body.contact ?? ""),
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
        address: String(body.address ?? ""),
      },
    });
    return res.status(201).json(created);
  }

  res.status(405).json({ error: "Method not allowed" });
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

    if (!data.customerName && !data.customerId) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });
      if (customer && !data.customerName) {
        data.customerName = customer.name;
      }
      if (customer) {
        if (!data.contactDetails && customer.contact) {
          data.contactDetails = customer.contact;
        }
        if (!data.contactPhone && customer.phone) {
          data.contactPhone = customer.phone;
        }
        if (!data.contactEmail && customer.email) {
          data.contactEmail = customer.email;
        }
      }
    }

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

  const updated = await prisma.inquiry.update({
    where: { id },
    data,
    include: inquiryInclude,
  });

  return res.status(200).json(mapInquiry(updated));
}

/** @deprecated use inquiries */
export const orders = inquiries;

export async function sales(req: ApiRequest, res: ApiResponse) {
  if (req.method === "GET") {
    const [persons, managers] = await Promise.all([
      prisma.salesPerson.findMany({
        include: { inquiries: true, manager: true },
        orderBy: { name: "asc" },
      }),
      prisma.salesManager.findMany({ orderBy: { name: "asc" } }),
    ]);

    return res.status(200).json({
      persons: persons.map((p) => ({
        id: p.id,
        name: p.name,
        performance: p.performance,
        managerId: p.managerId,
        managerName: p.manager?.name ?? null,
        history: p.inquiries.map((o) => String(o.serialNo)),
        totalSales: p.inquiries.reduce(
          (acc, row) => acc + (toNumber(row.quotationAmount) ?? 0),
          0
        ),
      })),
      managers,
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
        performance: Number(body.performance ?? 0),
        managerId: body.managerId ? String(body.managerId) : null,
      },
    });
    return res.status(201).json(created);
  }

  res.status(405).json({ error: "Method not allowed" });
}
