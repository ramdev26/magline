import type { HeadOfSales, SalesManager, SalesPerson } from '../types';

export type AssigneeOption = { value: string; label: string; group: string };

export function buildAssigneeOptions(
  persons: SalesPerson[],
  managers: SalesManager[],
  head: HeadOfSales | null
): AssigneeOption[] {
  const options: AssigneeOption[] = [];

  if (head) {
    options.push({
      value: `head:${head.id}`,
      label: `${head.name} (Head of Sales)`,
      group: 'Head of Sales',
    });
  }

  for (const manager of managers) {
    const suspended = manager.status === 'SUSPENDED' ? ' — Suspended' : '';
    options.push({
      value: `manager:${manager.id}`,
      label: `${manager.name} (Sales Manager)${suspended}`,
      group: 'Sales managers',
    });
  }

  for (const person of persons) {
    const suspended = person.status === 'SUSPENDED' ? ' — Suspended' : '';
    options.push({
      value: `person:${person.id}`,
      label: `${person.name} (Sales Executive)${suspended}`,
      group: 'Sales executives',
    });
  }

  return options;
}

export function buildAssigneeValue(row: {
  assigneeType?: 'person' | 'manager' | 'head' | null;
  assigneeId?: string | null;
  salesPersonId?: string | null;
}): string {
  if (row.assigneeType && row.assigneeId) return `${row.assigneeType}:${row.assigneeId}`;
  if (row.salesPersonId) return `person:${row.salesPersonId}`;
  return '';
}
