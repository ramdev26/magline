import React, { useEffect, useMemo, useState } from 'react';
import {
  Customer,
  CustomerActivityStatus,
  CustomerLifecycleStatus,
  HeadOfSales,
  SalesManager,
  SalesPerson,
} from '../types';
import { UserPlus, Search, X, Plus, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import {
  CUSTOMER_ACTIVITY_BADGE,
  CUSTOMER_ACTIVITY_LABELS,
  CUSTOMER_LIFECYCLE_BADGE,
  CUSTOMER_LIFECYCLE_LABELS,
  CUSTOMER_STATUS_HINT,
  CUSTOMER_SUMMARY_META,
  CUSTOMER_SUMMARY_STATUSES,
} from '../constants/customers';
import { DateRangeFilter } from './DateRangeFilter';
import { defaultDateRangeState, isDateInRange, resolveDateRangeBounds } from '../utils/dateRange';

type ContactFields = { contact: string; designation: string; email: string; phone: string };

type CustomerForm = {
  name: string;
  address: string;
  contacts: ContactFields[];
  assignee: string;
  lifecycleStatus: CustomerLifecycleStatus;
  activityStatus: CustomerActivityStatus;
};

type AssigneeOption = { value: string; label: string; group: string };

const LIFECYCLE_STATUSES: CustomerLifecycleStatus[] = ['NEW', 'OLD'];
const ACTIVITY_STATUSES: CustomerActivityStatus[] = ['ACTIVE', 'INACTIVE'];

const emptyContact = (): ContactFields => ({ contact: '', designation: '', email: '', phone: '' });

const emptyForm = (): CustomerForm => ({
  name: '',
  address: '',
  contacts: [emptyContact()],
  assignee: '',
  lifecycleStatus: 'NEW',
  activityStatus: 'ACTIVE',
});

const buildAssigneeValue = (customer: Customer): string => {
  if (customer.assigneeType && customer.assigneeId) {
    return `${customer.assigneeType}:${customer.assigneeId}`;
  }
  if (customer.salesPersonId) return `person:${customer.salesPersonId}`;
  return '';
};

const customerToForm = (customer: Customer): CustomerForm => ({
  name: customer.name,
  address: customer.address,
  contacts: [
    {
      contact: customer.contact,
      designation: customer.contactDesignation ?? '',
      email: customer.email,
      phone: customer.phone,
    },
    ...(customer.additionalContacts ?? []).map((row) => ({
      contact: row.contact,
      designation: row.designation ?? '',
      email: row.email,
      phone: row.phone,
    })),
  ],
  assignee: buildAssigneeValue(customer),
  lifecycleStatus: customer.lifecycleStatus ?? 'NEW',
  activityStatus: customer.activityStatus ?? 'ACTIVE',
});

const buildAssigneeOptions = (
  persons: SalesPerson[],
  managers: SalesManager[],
  head: HeadOfSales | null
): AssigneeOption[] => {
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
};

const inputClass =
  'w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-3 bg-white text-sm';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof CUSTOMER_SUMMARY_STATUSES)[number] | 'ALL' | 'OLD'>('ALL');
  const [dateRange, setDateRange] = useState(defaultDateRangeState);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = () => {
    setLoading(true);
    apiFetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load customers');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCustomers();
    apiFetch('/api/sales')
      .then((res) => res.json())
      .then((data) => {
        setAssigneeOptions(
          buildAssigneeOptions(data.persons ?? [], data.managers ?? [], data.head ?? null)
        );
      })
      .catch(() => {});
  }, []);

  const assigneeGroups = useMemo(() => {
    const groups = new Map<string, AssigneeOption[]>();
    for (const option of assigneeOptions) {
      const list = groups.get(option.group) ?? [];
      list.push(option);
      groups.set(option.group, list);
    }
    return [...groups.entries()];
  }, [assigneeOptions]);

  const matchesContact = (contact: ContactFields, q: string) =>
    contact.contact.toLowerCase().includes(q) ||
    contact.designation.toLowerCase().includes(q) ||
    contact.email.toLowerCase().includes(q) ||
    contact.phone.toLowerCase().includes(q);

  const dateBounds = useMemo(() => resolveDateRangeBounds(dateRange), [dateRange]);

  const inPeriodCustomers = useMemo(
    () => customers.filter((c) => isDateInRange(c.createdAt, dateBounds)),
    [customers, dateBounds]
  );

  const filtered = inPeriodCustomers.filter((c) => {
    if (statusFilter === 'NEW' && c.lifecycleStatus !== 'NEW') return false;
    if (statusFilter === 'ACTIVE' && c.activityStatus !== 'ACTIVE') return false;
    if (statusFilter === 'INACTIVE' && c.activityStatus !== 'INACTIVE') return false;
    if (statusFilter === 'OLD' && c.lifecycleStatus !== 'OLD') return false;
    const q = search.toLowerCase();
    const extra = c.additionalContacts ?? [];
    return (
      c.name.toLowerCase().includes(q) ||
      (c.salesPersonName ?? '').toLowerCase().includes(q) ||
      matchesContact(
        {
          contact: c.contact,
          designation: c.contactDesignation ?? '',
          email: c.email,
          phone: c.phone,
        },
        q
      ) ||
      extra.some((item) =>
        matchesContact(
          {
            contact: item.contact,
            designation: item.designation ?? '',
            email: item.email,
            phone: item.phone,
          },
          q
        )
      )
    );
  });

  const statusCounts = useMemo(() => {
    const counts = { NEW: 0, ACTIVE: 0, INACTIVE: 0 };
    for (const c of inPeriodCustomers) {
      if (c.lifecycleStatus === 'NEW') counts.NEW += 1;
      if (c.activityStatus === 'ACTIVE') counts.ACTIVE += 1;
      if (c.activityStatus === 'INACTIVE') counts.INACTIVE += 1;
    }
    return counts;
  }, [inPeriodCustomers]);

  const updateContact = (index: number, field: keyof ContactFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addContact = () => {
    setForm((prev) => ({ ...prev, contacts: [...prev.contacts, emptyContact()] }));
  };

  const removeContact = (index: number) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm(customerToForm(customer));
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  };

  const buildPayload = () => {
    const [primary, ...additional] = form.contacts;
    return {
      name: form.name,
      address: form.address,
      contact: primary.contact,
      contactDesignation: primary.designation,
      email: primary.email,
      phone: primary.phone,
      lifecycleStatus: form.lifecycleStatus,
      activityStatus: form.activityStatus,
      assignee: form.assignee || null,
      additionalContacts: additional,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(buildPayload()),
    });
    if (res.ok) {
      closeModal();
      loadCustomers();
    } else {
      setError(editingId ? 'Could not update customer' : 'Could not register customer');
    }
    setSaving(false);
  };

  const contactCount = (customer: Customer) => 1 + (customer.additionalContacts?.length ?? 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <motion.div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Customer Registry</h2>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            Total: {customers.length}
          </span>
        </motion.div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserPlus size={16} /> Register Customer
        </button>
      </header>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-5">
        {error && !showModal && <p className="text-sm text-red-600">{error}</p>}

        <motion.div>
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            dateFieldLabel="customers registered"
          />
          <p className="text-xs text-slate-500 mb-2">{CUSTOMER_STATUS_HINT}</p>
          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CUSTOMER_SUMMARY_STATUSES.map((key) => {
              const meta = CUSTOMER_SUMMARY_META[key];
              const active = statusFilter === meta.filter;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(active ? 'ALL' : meta.filter)}
                  className={`rounded-xl border p-4 text-left transition-all ${meta.tone} ${
                    active ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:shadow-sm'
                  }`}
                >
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{meta.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{statusCounts[key]}</p>
                </button>
              );
            })}
          </motion.div>
        </motion.div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <motion.div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, contact, designation, sales person..."
              className="flex-1 min-w-[200px] bg-transparent border-none text-sm focus:ring-0 text-slate-600 outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'OLD'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    statusFilter === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {value === 'ALL' ? 'All' : CUSTOMER_LIFECYCLE_LABELS.OLD}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 w-full sm:w-auto sm:ml-auto">
              Showing {filtered.length} of {inPeriodCustomers.length} in period ({customers.length} total)
            </p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[960px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4 font-semibold">Company</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Sales Person</th>
                  <th className="px-6 py-4 font-semibold">Contact Person</th>
                  <th className="px-6 py-4 font-semibold">Contact Methods</th>
                  <th className="px-6 py-4 font-semibold">Address</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No customers found.</td></tr>
                ) : (
                  filtered.map((customer, i) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <motion.div className="text-sm font-semibold text-slate-900">{customer.name}</motion.div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                              CUSTOMER_LIFECYCLE_BADGE[customer.lifecycleStatus ?? 'NEW']
                            }`}
                          >
                            {CUSTOMER_LIFECYCLE_LABELS[customer.lifecycleStatus ?? 'NEW']}
                          </span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                              CUSTOMER_ACTIVITY_BADGE[customer.activityStatus ?? 'ACTIVE']
                            }`}
                          >
                            {CUSTOMER_ACTIVITY_LABELS[customer.activityStatus ?? 'ACTIVE']}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{customer.salesPersonName ?? '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div>{customer.contact || '—'}</div>
                        {customer.contactDesignation && (
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{customer.contactDesignation}</p>
                        )}
                        {contactCount(customer) > 1 && (
                          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                            +{contactCount(customer) - 1} more contact{contactCount(customer) > 2 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{customer.email || '—'}</div>
                        <p className="text-[11px] text-slate-400 font-medium">{customer.phone || '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[180px] truncate" title={customer.address}>
                        {customer.address || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          aria-label="Edit customer"
                        >
                          <Pencil size={17} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="bg-white rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Edit Customer' : 'Register Customer'}
                </h3>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    required
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Customer type
                    </label>
                    <select
                      className={inputClass}
                      value={form.lifecycleStatus}
                      onChange={(e) =>
                        setForm({ ...form, lifecycleStatus: e.target.value as CustomerLifecycleStatus })
                      }
                    >
                      {LIFECYCLE_STATUSES.map((status) => (
                        <option key={status} value={status}>{CUSTOMER_LIFECYCLE_LABELS[status]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Activity status
                    </label>
                    <select
                      className={inputClass}
                      value={form.activityStatus}
                      onChange={(e) =>
                        setForm({ ...form, activityStatus: e.target.value as CustomerActivityStatus })
                      }
                    >
                      {ACTIVITY_STATUSES.map((status) => (
                        <option key={status} value={status}>{CUSTOMER_ACTIVITY_LABELS[status]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Assigned sales person
                  </label>
                  <select
                    className={inputClass}
                    value={form.assignee}
                    onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {assigneeGroups.map(([group, options]) => (
                      <optgroup key={group} label={group}>
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact details</p>
                    <button
                      type="button"
                      onClick={addContact}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add contact
                    </button>
                  </div>

                  {form.contacts.map((row, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3"
                    >
                      <motion.div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {index === 0 ? 'Primary contact' : `Additional contact ${index}`}
                        </p>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                            aria-label="Remove contact"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </motion.div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Contact person {index === 0 && '*'}
                          </label>
                          <input
                            required={index === 0}
                            className={inputClass}
                            placeholder="Name"
                            value={row.contact}
                            onChange={(e) => updateContact(index, 'contact', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Designation
                          </label>
                          <input
                            className={inputClass}
                            placeholder="e.g. Procurement Manager"
                            value={row.designation}
                            onChange={(e) => updateContact(index, 'designation', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            className={inputClass}
                            placeholder="+94 77 123 4567"
                            value={row.phone}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            className={inputClass}
                            placeholder="name@company.com"
                            value={row.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Address
                  </label>
                  <input
                    className={inputClass}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Saving...' : editingId ? 'Save changes' : 'Register'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Customers;
