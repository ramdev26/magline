export function parseAssignee(body: Record<string, unknown>) {
  const rawAssignee = body.assignee ? String(body.assignee) : "";
  if (rawAssignee) {
    const [type, id] = rawAssignee.split(":");
    if (type === "person" && id) return { salesPersonId: id, salesManagerId: null, headOfSalesId: null };
    if (type === "manager" && id) return { salesPersonId: null, salesManagerId: id, headOfSalesId: null };
    if (type === "head" && id) return { salesPersonId: null, salesManagerId: null, headOfSalesId: id };
  }

  const legacyPersonId = body.salesPersonId ? String(body.salesPersonId) : null;
  return {
    salesPersonId: legacyPersonId,
    salesManagerId: null,
    headOfSalesId: null,
  };
}

export function resolveAssigneeName(row: {
  salesPerson?: { name: string } | null;
  salesManager?: { name: string } | null;
  headOfSales?: { name: string } | null;
}) {
  return row.salesPerson?.name ?? row.salesManager?.name ?? row.headOfSales?.name ?? null;
}

export function resolveAssigneeType(row: {
  salesPersonId: string | null;
  salesManagerId: string | null;
  headOfSalesId: string | null;
}): "person" | "manager" | "head" | null {
  if (row.salesPersonId) return "person";
  if (row.salesManagerId) return "manager";
  if (row.headOfSalesId) return "head";
  return null;
}

export function resolveAssigneeKey(row: {
  salesPersonId: string | null;
  salesManagerId: string | null;
  headOfSalesId: string | null;
}) {
  if (row.salesPersonId) return `person:${row.salesPersonId}`;
  if (row.salesManagerId) return `manager:${row.salesManagerId}`;
  if (row.headOfSalesId) return `head:${row.headOfSalesId}`;
  return "";
}
