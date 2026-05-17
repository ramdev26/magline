import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Plus, Pencil, Trash2, X, Search, Filter, Calendar } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { formatLKR } from '../utils/currency';
import {
  WIP_CATEGORIES,
  WIP_DELAY_REASONS,
  WIP_DELAY_REASON_LABELS,
  WIP_DELIVERY_STAGES,
  WIP_DELIVERY_STAGE_LABELS,
  WIP_PAYMENT_STATUSES,
  WIP_PAYMENT_STATUS_BADGE,
  WIP_PAYMENT_STATUS_LABELS,
  WIP_PRODUCTION_STAGES,
  WIP_PRODUCTION_STAGE_LABELS,
  WIP_RETURN_REASONS,
  WIP_RETURN_REASON_LABELS,
  WIP_SUMMARY_HINT,
  WIP_SUMMARY_META,
  WIP_SUMMARY_ORDER,
  type WipDeliveryStage,
  type WipPaymentStatus,
  type WipProductionStage,
  type WipSummaryStatus,
} from '../constants/wip';
import { computeWipTotals, getWipSummaryStatus } from '../utils/wipStatus';
import { DateRangeFilter } from './DateRangeFilter';
import { defaultDateRangeState, isDateInRange, resolveDateRangeBounds } from '../utils/dateRange';
import type { Customer, SalesPerson, WorkInProgress as WipJob } from '../types';

type WipFormState = {
  date: string;
  jobNo: string;
  poNo: string;
  quotationNo: string;
  customerId: string;
  customerName: string;
  salesPersonId: string;
  category: 'LV' | 'CMS' | 'MEP' | '';
  orderDescription: string;
  unit: string;
  quantity: string;
  rate: string;
  discount: string;
  vatPercent: string;
  paymentStatus: WipPaymentStatus;
  productionStages: WipProductionStage[];
  deliveryStages: WipDeliveryStage[];
  delayReason: string;
  delayNote: string;
  returnReason: string;
  returnNote: string;
  notes: string;
};

const inputClass =
  'w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm';
const labelClass = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function emptyForm(): WipFormState {
  return {
    date: todayIso(),
    jobNo: '',
    poNo: '',
    quotationNo: '',
    customerId: '',
    customerName: '',
    salesPersonId: '',
    category: '',
    orderDescription: '',
    unit: 'Nos',
    quantity: '1',
    rate: '0',
    discount: '0',
    vatPercent: '18',
    paymentStatus: 'NOT_PAID',
    productionStages: [],
    deliveryStages: [],
    delayReason: '',
    delayNote: '',
    returnReason: '',
    returnNote: '',
    notes: '',
  };
}

function jobToForm(row: WipJob): WipFormState {
  return {
    date: row.date ?? '',
    jobNo: row.jobNo ?? '',
    poNo: row.poNo ?? '',
    quotationNo: row.quotationNo ?? '',
    customerId: row.customerId ?? '',
    customerName: row.customerName,
    salesPersonId: row.salesPersonId ?? '',
    category: row.category ?? '',
    orderDescription: row.orderDescription,
    unit: row.unit,
    quantity: String(row.quantity ?? 0),
    rate: String(row.rate ?? 0),
    discount: String(row.discount ?? 0),
    vatPercent: String(row.vatPercent ?? 0),
    paymentStatus: row.paymentStatus,
    productionStages: row.productionStages as WipProductionStage[],
    deliveryStages: row.deliveryStages as WipDeliveryStage[],
    delayReason: row.delayReason ?? '',
    delayNote: row.delayNote ?? '',
    returnReason: row.returnReason ?? '',
    returnNote: row.returnNote ?? '',
    notes: row.notes ?? '',
  };
}

function StageChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border transition-colors ${
        active
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  );
}

export default function WorkInProgress() {
  const [jobs, setJobs] = useState<WipJob[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WipSummaryStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<WipPaymentStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState(defaultDateRangeState);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WipFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [wipRes, custRes, salesRes] = await Promise.all([
        apiFetch('/api/wip'),
        apiFetch('/api/customers'),
        apiFetch('/api/sales?activeOnly=1'),
      ]);
      setJobs(await wipRes.json());
      setCustomers(await custRes.json());
      setSalesPersons((await salesRes.json()).persons ?? []);
    } catch {
      setError('Failed to load work in progress.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const dateBounds = useMemo(() => resolveDateRangeBounds(dateRange), [dateRange]);

  const inPeriodJobs = useMemo(
    () => jobs.filter((row) => isDateInRange(row.date ?? row.createdAt ?? null, dateBounds)),
    [jobs, dateBounds]
  );

  const stats = useMemo(() => {
    const counts: Record<WipSummaryStatus, number> = {
      in_production: 0,
      awaiting_delivery: 0,
      delivered: 0,
      delayed: 0,
    };
    let totalValue = 0;
    for (const row of inPeriodJobs) {
      counts[getWipSummaryStatus(row)] += 1;
      totalValue += row.total ?? 0;
    }
    return { counts, total: inPeriodJobs.length, totalValue };
  }, [inPeriodJobs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inPeriodJobs.filter((row) => {
      if (statusFilter !== 'all' && getWipSummaryStatus(row) !== statusFilter) return false;
      if (paymentFilter !== 'all' && row.paymentStatus !== paymentFilter) return false;
      if (!q) return true;
      return (
        String(row.serialNo).includes(q) ||
        (row.jobNo ?? '').toLowerCase().includes(q) ||
        (row.poNo ?? '').toLowerCase().includes(q) ||
        (row.quotationNo ?? '').toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        (row.salesPersonName ?? '').toLowerCase().includes(q) ||
        row.orderDescription.toLowerCase().includes(q)
      );
    });
  }, [inPeriodJobs, search, statusFilter, paymentFilter]);

  const formTotals = useMemo(
    () => computeWipTotals({ quantity: form.quantity, rate: form.rate, discount: form.discount, vatPercent: form.vatPercent }),
    [form.quantity, form.rate, form.discount, form.vatPercent]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setShowModal(true);
  };

  const openEdit = (row: WipJob) => {
    setEditingId(row.id);
    setForm(jobToForm(row));
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setError(null);
  };

  const toggleProductionStage = (stage: WipProductionStage) => {
    setForm((prev) => ({
      ...prev,
      productionStages: prev.productionStages.includes(stage)
        ? prev.productionStages.filter((s) => s !== stage)
        : [...prev.productionStages, stage],
    }));
  };

  const toggleDeliveryStage = (stage: WipDeliveryStage) => {
    setForm((prev) => ({
      ...prev,
      deliveryStages: prev.deliveryStages.includes(stage)
        ? prev.deliveryStages.filter((s) => s !== stage)
        : [...prev.deliveryStages, stage],
    }));
  };

  const onCustomerPick = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setForm((prev) => ({
      ...prev,
      customerId,
      customerName: customer?.name ?? prev.customerName,
      salesPersonId: customer?.salesPersonId ?? prev.salesPersonId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      setError('Customer is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      customerId: form.customerId || null,
      salesPersonId: form.salesPersonId || null,
      category: form.category || null,
      quantity: Number(form.quantity) || 0,
      rate: Number(form.rate) || 0,
      discount: Number(form.discount) || 0,
      vatPercent: Number(form.vatPercent) || 0,
      delayReason: form.delayReason || null,
      returnReason: form.returnReason || null,
    };
    const url = editingId ? `/api/wip/${editingId}` : '/api/wip';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      closeModal();
      loadAll();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'Failed to save job.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this job?')) return;
    const res = await apiFetch(`/api/wip/${id}`, { method: 'DELETE' });
    if (res.ok) loadAll();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Work in Progress</h2>
            <p className="text-[11px] text-slate-500">Track jobs through payment, production, and delivery.</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Job
        </button>
      </header>

      <div className="p-6 lg:p-8 flex-1 flex flex-col gap-5 max-w-[1400px] w-full mx-auto">
        {error && !showModal && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            dateFieldLabel="jobs by date"
          />
          <p className="text-xs text-slate-500 mb-2">{WIP_SUMMARY_HINT}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {WIP_SUMMARY_ORDER.map((key) => {
              const meta = WIP_SUMMARY_META[key];
              const active = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(active ? 'all' : key)}
                  className={`rounded-xl border p-4 text-left transition-all ${meta.tone} ${
                    active ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:shadow-sm'
                  }`}
                >
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{meta.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.counts[key]}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search serial, job, PO, quotation, customer, sales person, description..."
                className="flex-1 bg-transparent border-none text-sm outline-none text-slate-700 min-w-0"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-slate-400 hidden sm:block" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as WipPaymentStatus | 'all')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
              >
                <option value="all">All payments</option>
                {WIP_PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{WIP_PAYMENT_STATUS_LABELS[status]}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WipSummaryStatus | 'all')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
              >
                <option value="all">All statuses</option>
                {WIP_SUMMARY_ORDER.map((key) => (
                  <option key={key} value={key}>{WIP_SUMMARY_META[key].label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {inPeriodJobs.length} in period ({jobs.length} total)
            {stats.totalValue > 0 && (
              <> · Total value <span className="font-semibold text-slate-700">{formatLKR(stats.totalValue)}</span></>
            )}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1400px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Job / PO / Quotation</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Sales</th>
                  <th className="px-4 py-3 font-semibold">Cat</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Rate</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Production</th>
                  <th className="px-4 py-3 font-semibold">Delivery</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr><td colSpan={14} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={14} className="px-4 py-12 text-center text-slate-400">
                    {jobs.length === 0 ? 'No jobs yet. Create your first one.' : 'No jobs match your filters.'}
                  </td></tr>
                ) : (
                  filtered.map((row) => {
                    const summary = getWipSummaryStatus(row);
                    const summaryMeta = WIP_SUMMARY_META[summary];
                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-700">#{row.serialNo}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            {row.date ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          <p>Job: <span className="font-semibold text-slate-800">{row.jobNo || '—'}</span></p>
                          <p>PO: {row.poNo || '—'}</p>
                          <p>Qtn: {row.quotationNo || '—'}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{row.customerName}</td>
                        <td className="px-4 py-3 text-slate-600">{row.salesPersonName ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">{row.category ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-700 max-w-[260px]">
                          <p className="truncate" title={row.orderDescription}>{row.orderDescription || '—'}</p>
                          <p className="text-[11px] text-slate-400">{row.unit}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatLKR(row.rate)}</td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-slate-900">{formatLKR(row.total)}</p>
                          {row.vat > 0 && <p className="text-[10px] text-slate-400">+VAT {formatLKR(row.vat)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${WIP_PAYMENT_STATUS_BADGE[row.paymentStatus]}`}>
                            {WIP_PAYMENT_STATUS_LABELS[row.paymentStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {row.productionStages.length === 0 ? (
                              <span className="text-[11px] text-slate-400">—</span>
                            ) : (
                              row.productionStages.map((stage) => (
                                <span key={stage} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                                  {WIP_PRODUCTION_STAGE_LABELS[stage as WipProductionStage] ?? stage}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 max-w-[220px]">
                            <div className="flex flex-wrap gap-1">
                              {row.deliveryStages.length === 0 ? (
                                <span className="text-[11px] text-slate-400">—</span>
                              ) : (
                                row.deliveryStages.map((stage) => (
                                  <span key={stage} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {WIP_DELIVERY_STAGE_LABELS[stage as WipDeliveryStage] ?? stage}
                                  </span>
                                ))
                              )}
                            </div>
                            {row.delayReason && (
                              <span className="text-[10px] font-semibold text-rose-600">
                                Delay: {WIP_DELAY_REASON_LABELS[row.delayReason]}
                              </span>
                            )}
                            {row.returnReason && (
                              <span className="text-[10px] font-semibold text-rose-700">
                                Returned: {WIP_RETURN_REASON_LABELS[row.returnReason]}
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold uppercase mt-0.5 ${
                              summary === 'delayed' ? 'text-rose-600' :
                              summary === 'delivered' ? 'text-emerald-600' :
                              summary === 'awaiting_delivery' ? 'text-amber-600' : 'text-sky-600'
                            }`}>
                              · {summaryMeta.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-50 ml-1"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editingId ? `Edit Job #${jobs.find((j) => j.id === editingId)?.serialNo ?? ''}` : 'New Work in Progress Job'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All amounts in LKR. Totals recalculate automatically.
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-6">
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Order details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Job No.</label>
                      <input type="text" value={form.jobNo} onChange={(e) => setForm({ ...form, jobNo: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>PO No.</label>
                      <input type="text" value={form.poNo} onChange={(e) => setForm({ ...form, poNo: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Quotation No.</label>
                      <input type="text" value={form.quotationNo} onChange={(e) => setForm({ ...form, quotationNo: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Customer</label>
                      <select
                        value={form.customerId}
                        onChange={(e) => onCustomerPick(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select customer...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {!form.customerId && (
                        <input
                          type="text"
                          value={form.customerName}
                          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                          placeholder="Or type customer name"
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Sales Person</label>
                      <select
                        value={form.salesPersonId}
                        onChange={(e) => setForm({ ...form, salesPersonId: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        {salesPersons.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as WipFormState['category'] })}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        {WIP_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Order Description</label>
                      <input type="text" value={form.orderDescription} onChange={(e) => setForm({ ...form, orderDescription: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Amounts</p>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div>
                      <label className={labelClass}>Unit</label>
                      <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <input type="number" min={0} step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Rate</label>
                      <input type="number" min={0} step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Discount</label>
                      <input type="number" min={0} step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>VAT %</label>
                      <input type="number" min={0} max={100} step="0.01" value={form.vatPercent} onChange={(e) => setForm({ ...form, vatPercent: e.target.value })} className={inputClass} />
                    </div>
                    <div className="col-span-2 md:col-span-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
                      <p className="text-base font-bold text-slate-900">{formatLKR(formTotals.total)}</p>
                      <p className="text-[10px] text-slate-500">Amount {formatLKR(formTotals.amount)} · VAT {formatLKR(formTotals.vat)}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Payment</p>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as WipPaymentStatus })}
                    className={`${inputClass} md:max-w-xs`}
                  >
                    {WIP_PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>{WIP_PAYMENT_STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Production stages</p>
                  <div className="flex flex-wrap gap-2">
                    {WIP_PRODUCTION_STAGES.map((stage) => (
                      <StageChip
                        key={stage}
                        active={form.productionStages.includes(stage)}
                        label={WIP_PRODUCTION_STAGE_LABELS[stage]}
                        onClick={() => toggleProductionStage(stage)}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Delivery stages</p>
                  <div className="flex flex-wrap gap-2">
                    {WIP_DELIVERY_STAGES.map((stage) => (
                      <StageChip
                        key={stage}
                        active={form.deliveryStages.includes(stage)}
                        label={WIP_DELIVERY_STAGE_LABELS[stage]}
                        onClick={() => toggleDeliveryStage(stage)}
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Delay & return (optional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Why delayed?</label>
                      <select
                        value={form.delayReason}
                        onChange={(e) => setForm({ ...form, delayReason: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        {WIP_DELAY_REASONS.map((r) => (
                          <option key={r} value={r}>{WIP_DELAY_REASON_LABELS[r]}</option>
                        ))}
                      </select>
                      {form.delayReason && (
                        <input
                          type="text"
                          value={form.delayNote}
                          onChange={(e) => setForm({ ...form, delayNote: e.target.value })}
                          placeholder="Delay note..."
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Returned?</label>
                      <select
                        value={form.returnReason}
                        onChange={(e) => setForm({ ...form, returnReason: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        {WIP_RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>{WIP_RETURN_REASON_LABELS[r]}</option>
                        ))}
                      </select>
                      {form.returnReason && (
                        <input
                          type="text"
                          value={form.returnNote}
                          onChange={(e) => setForm({ ...form, returnNote: e.target.value })}
                          placeholder="Return note..."
                          className={`${inputClass} mt-2`}
                        />
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className={inputClass}
                  />
                </section>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create job'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
