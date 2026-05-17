import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inquiry, Customer, SalesPerson, Engineer } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatLKR } from '../utils/currency';
import { emptyInquiryForm, MODE_OF_INQUIRY, ONGOING_TENDER } from '../constants/inquiry';
import {
  getInquiryWorkflowStatus,
  INQUIRY_WORKFLOW_AUTO_HINT,
  INQUIRY_WORKFLOW_META,
  INQUIRY_WORKFLOW_ORDER,
  type InquiryWorkflowStatus,
} from '../utils/inquiryWorkflow';
import {
  Plus,
  Search,
  X,
  Pencil,
  Download,
  Upload,
  LayoutGrid,
  Table2,
  ChevronDown,
  ChevronUp,
  Building2,
  FileText,
  Phone,
  Mail,
  User,
  Calendar,
  Filter,
} from 'lucide-react';
import { exportInquiriesToExcel, parseInquiriesFromExcel } from '../utils/excel';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { DateRangeFilter } from './DateRangeFilter';
import { defaultDateRangeState, isDateInRange, resolveDateRangeBounds } from '../utils/dateRange';

const inputClass =
  'w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm';

const labelClass = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1';

const categoryStyle: Record<string, string> = {
  LV: 'bg-blue-100 text-blue-800 border-blue-200',
  CMS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  MEP: 'bg-amber-100 text-amber-800 border-amber-200',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function inquiryStatus(row: Inquiry, nowMs?: number) {
  const key = getInquiryWorkflowStatus(row, nowMs);
  const meta = INQUIRY_WORKFLOW_META[key];
  return { label: meta.label, className: meta.className };
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 break-words">{value || '—'}</p>
    </div>
  );
}

const Orders = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState(defaultDateRangeState);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyInquiryForm());
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  /** Recompute Delay (>24h) counts without a full page reload. */
  const [workflowClock, setWorkflowClock] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setWorkflowClock(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [inqRes, custRes, salesRes, engRes] = await Promise.all([
      apiFetch('/api/inquiries'),
      apiFetch('/api/customers'),
      apiFetch('/api/sales?activeOnly=1'),
      apiFetch('/api/engineers'),
    ]);
    setInquiries(await inqRes.json());
    setCustomers(await custRes.json());
    setSalesPersons((await salesRes.json()).persons ?? []);
    setEngineers(await engRes.json());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const dateBounds = useMemo(() => resolveDateRangeBounds(dateRange), [dateRange]);

  const inPeriodInquiries = useMemo(
    () => inquiries.filter((row) => isDateInRange(row.inquiryReceivedDate, dateBounds)),
    [inquiries, dateBounds]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inPeriodInquiries.filter((row) => {
      const matchesSearch =
        !q ||
        String(row.serialNo).includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        (row.projectName ?? '').toLowerCase().includes(q) ||
        (row.quotationNo ?? '').toLowerCase().includes(q) ||
        (row.poNo ?? '').toLowerCase().includes(q) ||
        (row.contactDetails ?? '').toLowerCase().includes(q) ||
        (row.contactPhone ?? '').toLowerCase().includes(q) ||
        (row.contactEmail ?? '').toLowerCase().includes(q);

      const matchesCategory = categoryFilter === 'all' || row.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = getInquiryWorkflowStatus(row, workflowClock) === statusFilter;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inPeriodInquiries, search, categoryFilter, statusFilter, workflowClock]);

  const stats = useMemo(() => {
    const counts: Record<InquiryWorkflowStatus, number> = {
      in_preparation: 0,
      delay: 0,
      sent: 0,
      po_received: 0,
    };
    for (const row of inPeriodInquiries) {
      counts[getInquiryWorkflowStatus(row, workflowClock)] += 1;
    }
    const totalQuoted = inPeriodInquiries.reduce((sum, r) => sum + (r.quotationAmount ?? 0), 0);
    return { counts, total: inPeriodInquiries.length, totalQuoted };
  }, [inPeriodInquiries, workflowClock]);

  const formWorkflowMeta = useMemo(() => {
    const key = getInquiryWorkflowStatus(
      {
        inquiryReceivedDate: form.inquiryReceivedDate || null,
        quotationSubmittedDate: form.quotationSubmittedDate || null,
        poNo: form.poNo || null,
        poReceivedDate: form.poReceivedDate || null,
      },
      workflowClock
    );
    return INQUIRY_WORKFLOW_META[key];
  }, [form.inquiryReceivedDate, form.quotationSubmittedDate, form.poNo, form.poReceivedDate, workflowClock]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyInquiryForm());
    setShowModal(true);
  };

  const openEdit = (row: Inquiry) => {
    setEditingId(row.id);
    const matchedCustomer =
      row.customerId != null
        ? customers.find((c) => c.id === row.customerId)
        : customers.find((c) => c.name.toLowerCase() === row.customerName.toLowerCase());
    setForm({
      inquiryReceivedDate: row.inquiryReceivedDate ?? '',
      modeOfInquiry: row.modeOfInquiry ?? '',
      customerId: matchedCustomer?.id ?? row.customerId,
      customerName: matchedCustomer?.name ?? row.customerName,
      projectName: row.projectName ?? '',
      document: row.document ?? '',
      salesPersonId: row.salesPersonId,
      quotationRequiredDate: row.quotationRequiredDate ?? '',
      engineerId: row.engineerId,
      quotationNo: row.quotationNo ?? '',
      quotationAmount: row.quotationAmount,
      quotationSubmittedDate: row.quotationSubmittedDate ?? '',
      ongoingTender: row.ongoingTender ?? '',
      jsbNo: row.jsbNo ?? '',
      poNo: row.poNo ?? '',
      poReceivedDate: row.poReceivedDate ?? '',
      awardedParty: row.awardedParty ?? '',
      awardedPrice: row.awardedPrice,
      remarks: row.remarks ?? '',
      category: row.category ?? 'LV',
    });
    setShowModal(true);
  };

  const onCustomerPick = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setForm((prev) => ({
      ...prev,
      customerId,
      customerName: customer.name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) return;
    setSaving(true);

    const payload = {
      ...form,
      salesPersonId: form.salesPersonId || null,
      customerId: form.customerId || null,
      quotationAmount: form.quotationAmount ?? null,
      awardedPrice: form.awardedPrice ?? null,
    };

    const url = editingId ? `/api/inquiries/${editingId}` : '/api/inquiries';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      loadData();
    }
    setSaving(false);
  };

  const handleExport = () => {
    exportInquiriesToExcel(filtered.length ? filtered : inquiries);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    setImportMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const { payloads, skipped } = parseInquiriesFromExcel(buffer, salesPersons, engineers);

      if (payloads.length === 0) {
        setImportMessage('No valid rows found. Check that "Customer Name" column is filled.');
        return;
      }

      const res = await apiFetch('/api/inquiries/import', {
        method: 'POST',
        body: JSON.stringify({ inquiries: payloads }),
      });
      const result = await res.json();

      if (!res.ok) {
        setImportMessage(result.error ?? 'Import failed');
        return;
      }

      const skipNote = skipped.length ? ` Skipped ${skipped.length} empty row(s).` : '';
      const errNote = result.errors?.length ? ` ${result.errors.length} row(s) had errors.` : '';
      setImportMessage(`Imported ${result.created} of ${result.total} records.${skipNote}${errNote}`);
      loadData();
    } catch {
      setImportMessage('Could not read Excel file. Use .xlsx or .xls format.');
    } finally {
      setImporting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderInquiryCard = (row: Inquiry) => {
    const status = inquiryStatus(row, workflowClock);
    const expanded = expandedId === row.id;
    const catClass = categoryStyle[row.category ?? 'LV'] ?? categoryStyle.LV;

    return (
      <motion.article
        key={row.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl border transition-shadow ${
          expanded ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
        }`}
      >
        <div className="p-4 sm:p-5">
          <motion.div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 rounded-lg bg-slate-900 text-white text-sm font-bold">
                #{row.serialNo}
              </span>
              {row.category && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${catClass}`}>
                  {row.category}
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${status.className}`}>
                {status.label}
              </span>
              {row.ongoingTender && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                  {row.ongoingTender}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(row.inquiryReceivedDate)}
              </span>
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                title="Edit inquiry"
              >
                <Pencil size={16} />
              </button>
            </div>
          </motion.div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900 truncate flex items-center gap-2">
                <Building2 size={16} className="text-slate-400 shrink-0" />
                {row.customerName}
              </p>
              {row.projectName && (
                <p className="text-sm text-slate-600 mt-1 truncate pl-6">{row.projectName}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 lg:justify-end lg:text-right">
              {row.quotationNo && (
                <span className="flex items-center gap-1 lg:justify-end">
                  <FileText size={14} className="text-slate-400" />
                  {row.quotationNo}
                </span>
              )}
              {row.quotationAmount != null && (
                <span className="font-semibold text-slate-900">{formatLKR(row.quotationAmount)}</span>
              )}
              {row.salesPersonName && (
                <span className="flex items-center gap-1 lg:justify-end">
                  <User size={14} className="text-slate-400" />
                  {row.salesPersonName}
                </span>
              )}
            </div>
          </div>

          {(row.contactDetails || row.contactPhone || row.contactEmail) && !expanded && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 pl-0.5">
              {row.contactDetails && <span className="flex items-center gap-1"><User size={12} />{row.contactDetails}</span>}
              {row.contactPhone && <span className="flex items-center gap-1"><Phone size={12} />{row.contactPhone}</span>}
              {row.contactEmail && (
                <a href={`mailto:${row.contactEmail}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                  <Mail size={12} />{row.contactEmail}
                </a>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleExpand(row.id)}
            className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide details' : 'Show full details'}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 bg-slate-50/80"
            >
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DetailItem label="Mode of inquiry" value={row.modeOfInquiry} />
                <DetailItem label="Document" value={row.document} />
                <DetailItem label="Contact person" value={row.contactDetails} />
                <DetailItem label="Phone" value={row.contactPhone} />
                <DetailItem label="Email" value={row.contactEmail} />
                <DetailItem label="Engineer" value={row.engineer} />
                <DetailItem label="Quotation required" value={formatDate(row.quotationRequiredDate)} />
                <DetailItem label="Quotation submitted" value={formatDate(row.quotationSubmittedDate)} />
                <DetailItem label="JSB no" value={row.jsbNo} />
                <DetailItem label="PO no" value={row.poNo} />
                <DetailItem label="PO received" value={formatDate(row.poReceivedDate)} />
                <DetailItem label="Awarded party" value={row.awardedParty} />
                <DetailItem
                  label="Awarded price"
                  value={row.awardedPrice != null ? formatLKR(row.awardedPrice) : null}
                />
                <div className="sm:col-span-2 lg:col-span-4">
                  <DetailItem label="Remarks" value={row.remarks} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Inquiry Register</h2>
            <p className="text-sm text-slate-500 mt-0.5">Track inquiries, quotations, and purchase orders</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={inquiries.length === 0}
              className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={16} /> Export
            </button>
            <label className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {importing ? 'Importing...' : 'Import'}
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} disabled={importing} />
            </label>
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} /> New Inquiry
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-8 flex-1 flex flex-col gap-5 max-w-7xl w-full mx-auto">
        {importMessage && (
          <div className="text-sm px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
            {importMessage}
          </div>
        )}

        <div>
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            dateFieldLabel="inquiries received"
          />
          <p className="text-xs text-slate-500 mb-2">{INQUIRY_WORKFLOW_AUTO_HINT}</p>
          <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {INQUIRY_WORKFLOW_ORDER.map((key) => {
            const meta = INQUIRY_WORKFLOW_META[key];
            const active = statusFilter === meta.filter;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(active ? 'all' : meta.filter)}
                className={`rounded-xl border p-4 text-left transition-all ${meta.tone} ${
                  active ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:shadow-sm'
                }`}
              >
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{meta.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.counts[key]}</p>
              </button>
            );
          })}
          </motion.div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, project, serial, quotation, PO, contact..."
                className="flex-1 bg-transparent border-none text-sm outline-none text-slate-700 min-w-0"
              />
            </div>
            <motion.div className="flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-slate-400 hidden sm:block" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
              >
                <option value="all">All categories</option>
                <option value="LV">LV</option>
                <option value="CMS">CMS</option>
                <option value="MEP">MEP</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
              >
                <option value="all">All statuses</option>
                <option value="in_preparation">In Preparation</option>
                <option value="delay">Delay</option>
                <option value="sent">Sent</option>
                <option value="po_received">PO Received</option>
              </select>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 text-sm flex items-center gap-1.5 ${
                    viewMode === 'cards' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid size={16} /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm flex items-center gap-1.5 border-l border-slate-200 ${
                    viewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Table2 size={16} /> Table
                </button>
              </div>
            </motion.div>
          </div>
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {inPeriodInquiries.length} in period ({inquiries.length} total)
            {stats.totalQuoted > 0 && (
              <> · Total quoted value <span className="font-semibold text-slate-700">{formatLKR(stats.totalQuoted)}</span></>
            )}
          </p>
        </div>

        {loading ? (
          <motion.div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading inquiries...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No inquiries found</p>
            <p className="text-sm text-slate-400 mt-1">
              {inquiries.length === 0
                ? 'Create your first inquiry to get started.'
                : 'Try adjusting your search or filters.'}
            </p>
            {inquiries.length === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={16} className="inline mr-1" /> New Inquiry
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="space-y-3">{filtered.map(renderInquiryCard)}</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Cat.</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Quotation</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => {
                    const status = inquiryStatus(row, workflowClock);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.serialNo}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(row.inquiryReceivedDate)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 max-w-[160px] truncate">{row.customerName}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{row.projectName ?? '—'}</td>
                        <td className="px-4 py-3">
                          {row.category && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${categoryStyle[row.category]}`}>
                              {row.category}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px]">
                          <div className="truncate">{row.contactDetails ?? row.contactPhone ?? '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.quotationNo ?? '—'}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {row.quotationAmount != null ? formatLKR(row.quotationAmount) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-4xl max-h-[92vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start gap-4 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Edit Inquiry' : 'New Inquiry'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Auto status:{' '}
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border ${formWorkflowMeta.className}`}>
                      {formWorkflowMeta.label}
                    </span>
                    <span className="text-slate-400"> — updates when you save dates below</span>
                  </p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 shrink-0">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Inquiry details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Inquiry received date</label>
                      <input type="date" className={inputClass} value={form.inquiryReceivedDate ?? ''} onChange={(e) => setForm({ ...form, inquiryReceivedDate: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Mode of inquiry</label>
                      <select className={inputClass} value={form.modeOfInquiry ?? ''} onChange={(e) => setForm({ ...form, modeOfInquiry: e.target.value })}>
                        <option value="">Select...</option>
                        {MODE_OF_INQUIRY.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Category (LV / CMS / MEP)</label>
                      <select className={inputClass} value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value as Inquiry['category'] })}>
                        <option value="LV">LV</option>
                        <option value="CMS">CMS</option>
                        <option value="MEP">MEP</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Customer & project</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Customer *</label>
                      <select
                        required
                        className={inputClass}
                        value={form.customerId ?? ''}
                        onChange={(e) => onCustomerPick(e.target.value)}
                      >
                        <option value="" disabled>Select customer...</option>
                        {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Project name</label>
                      <input className={inputClass} value={form.projectName ?? ''} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Document (reference / file name)</label>
                      <input className={inputClass} value={form.document ?? ''} onChange={(e) => setForm({ ...form, document: e.target.value })} />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Quotation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Sales person</label>
                      <select className={inputClass} value={form.salesPersonId ?? ''} onChange={(e) => setForm({ ...form, salesPersonId: e.target.value || null })}>
                        <option value="">Unassigned</option>
                        {salesPersons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Quotation required date</label>
                      <input type="date" className={inputClass} value={form.quotationRequiredDate ?? ''} onChange={(e) => setForm({ ...form, quotationRequiredDate: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Engineer</label>
                      <select
                        className={inputClass}
                        value={form.engineerId ?? ''}
                        onChange={(e) => setForm({ ...form, engineerId: e.target.value || null })}
                      >
                        <option value="">Select engineer...</option>
                        {engineers.map((eng) => (
                          <option key={eng.id} value={eng.id}>
                            {eng.name}
                          </option>
                        ))}
                      </select>
                      {engineers.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          No engineers in the list yet.
                          {isSuperAdmin ? (
                            <>
                              {' '}
                              <Link to="/engineers" className="font-semibold underline">
                                Add engineers
                              </Link>
                            </>
                          ) : (
                            ' Ask a super admin to add engineers.'
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Quotation no</label>
                      <input className={inputClass} value={form.quotationNo ?? ''} onChange={(e) => setForm({ ...form, quotationNo: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Quotation amount (LKR)</label>
                      <input type="number" min={0} className={inputClass} value={form.quotationAmount ?? ''} onChange={(e) => setForm({ ...form, quotationAmount: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                    <div>
                      <label className={labelClass}>Quotation submitted date</label>
                      <input type="date" className={inputClass} value={form.quotationSubmittedDate ?? ''} onChange={(e) => setForm({ ...form, quotationSubmittedDate: e.target.value })} />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Award & PO</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Ongoing / tender</label>
                      <select className={inputClass} value={form.ongoingTender ?? ''} onChange={(e) => setForm({ ...form, ongoingTender: e.target.value })}>
                        <option value="">—</option>
                        {ONGOING_TENDER.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>JSB no</label>
                      <input className={inputClass} value={form.jsbNo ?? ''} onChange={(e) => setForm({ ...form, jsbNo: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>PO no</label>
                      <input className={inputClass} value={form.poNo ?? ''} onChange={(e) => setForm({ ...form, poNo: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>PO received date</label>
                      <input type="date" className={inputClass} value={form.poReceivedDate ?? ''} onChange={(e) => setForm({ ...form, poReceivedDate: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Awarded party</label>
                      <input className={inputClass} value={form.awardedParty ?? ''} onChange={(e) => setForm({ ...form, awardedParty: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Awarded price (LKR)</label>
                      <input type="number" min={0} className={inputClass} value={form.awardedPrice ?? ''} onChange={(e) => setForm({ ...form, awardedPrice: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelClass}>Remarks</label>
                      <textarea className={`${inputClass} min-h-[80px]`} value={form.remarks ?? ''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                    </div>
                  </div>
                </section>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Saving...' : editingId ? 'Update inquiry' : 'Save inquiry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
