import React, { useEffect, useState } from 'react';
import { Inquiry, Customer, SalesPerson } from '../types';
import { formatLKR } from '../utils/currency';
import { emptyInquiryForm, MODE_OF_INQUIRY, ONGOING_TENDER } from '../constants/inquiry';
import { Plus, Search, X, Pencil, Download, Upload } from 'lucide-react';
import { exportInquiriesToExcel, parseInquiriesFromExcel } from '../utils/excel';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

const inputClass =
  'w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm';

const labelClass = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1';

const Orders = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyInquiryForm());
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [inqRes, custRes, salesRes] = await Promise.all([
      apiFetch('/api/inquiries'),
      apiFetch('/api/customers'),
      apiFetch('/api/sales'),
    ]);
    setInquiries(await inqRes.json());
    setCustomers(await custRes.json());
    setSalesPersons((await salesRes.json()).persons ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = inquiries.filter((row) => {
    const q = search.toLowerCase();
    return (
      String(row.serialNo).includes(q) ||
      row.customerName.toLowerCase().includes(q) ||
      (row.projectName ?? '').toLowerCase().includes(q) ||
      (row.quotationNo ?? '').toLowerCase().includes(q) ||
      (row.poNo ?? '').toLowerCase().includes(q) ||
      (row.contactDetails ?? '').toLowerCase().includes(q) ||
      (row.contactPhone ?? '').toLowerCase().includes(q) ||
      (row.contactEmail ?? '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyInquiryForm());
    setShowModal(true);
  };

  const openEdit = (row: Inquiry) => {
    setEditingId(row.id);
    setForm({
      inquiryReceivedDate: row.inquiryReceivedDate ?? '',
      modeOfInquiry: row.modeOfInquiry ?? '',
      customerId: row.customerId,
      customerName: row.customerName,
      contactDetails: row.contactDetails ?? '',
      contactPhone: row.contactPhone ?? '',
      contactEmail: row.contactEmail ?? '',
      projectName: row.projectName ?? '',
      document: row.document ?? '',
      salesPersonId: row.salesPersonId,
      quotationRequiredDate: row.quotationRequiredDate ?? '',
      engineer: row.engineer ?? '',
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
      contactDetails: customer.contact,
      contactPhone: customer.phone,
      contactEmail: customer.email,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return;
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
      const { payloads, skipped } = parseInquiriesFromExcel(buffer, salesPersons);

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
      const errNote = result.errors?.length
        ? ` ${result.errors.length} row(s) had errors.`
        : '';
      setImportMessage(`Imported ${result.created} of ${result.total} records.${skipNote}${errNote}`);
      loadData();
    } catch {
      setImportMessage('Could not read Excel file. Use .xlsx or .xls format.');
    } finally {
      setImporting(false);
    }
  };

  const contactColumns = [
    { key: 'contactDetails', label: 'Contact Person', render: (r: Inquiry) => r.contactDetails ?? '—' },
    { key: 'contactPhone', label: 'Phone', render: (r: Inquiry) => r.contactPhone ?? '—' },
    {
      key: 'contactEmail',
      label: 'Email',
      render: (r: Inquiry) =>
        r.contactEmail ? (
          <a href={`mailto:${r.contactEmail}`} className="text-blue-600 hover:underline" title={r.contactEmail}>
            {r.contactEmail}
          </a>
        ) : (
          '—'
        ),
    },
  ] as const;

  const columnsBeforeContact = [
    { key: 'serialNo', label: 'Serial No', render: (r: Inquiry) => r.serialNo },
    { key: 'inquiryReceivedDate', label: 'Inquiry Received Date', render: (r: Inquiry) => r.inquiryReceivedDate ?? '—' },
    { key: 'modeOfInquiry', label: 'Mode of Inquiry', render: (r: Inquiry) => r.modeOfInquiry ?? '—' },
    { key: 'customerName', label: 'Customer Name', render: (r: Inquiry) => r.customerName },
  ];

  const columnsAfterContact = [
    { key: 'projectName', label: 'Project Name', render: (r: Inquiry) => r.projectName ?? '—' },
    { key: 'document', label: 'Document', render: (r: Inquiry) => r.document ?? '—' },
    { key: 'salesPersonName', label: 'Sales Person', render: (r: Inquiry) => r.salesPersonName ?? '—' },
    { key: 'quotationRequiredDate', label: 'Quotation Required Date', render: (r: Inquiry) => r.quotationRequiredDate ?? '—' },
    { key: 'engineer', label: 'Engineer', render: (r: Inquiry) => r.engineer ?? '—' },
    { key: 'quotationNo', label: 'Quotation No', render: (r: Inquiry) => r.quotationNo ?? '—' },
    { key: 'quotationAmount', label: 'Quotation Amount (LKR)', render: (r: Inquiry) => r.quotationAmount != null ? formatLKR(r.quotationAmount) : '—' },
    { key: 'quotationSubmittedDate', label: 'Quotation Submitted Date', render: (r: Inquiry) => r.quotationSubmittedDate ?? '—' },
    { key: 'ongoingTender', label: 'Ongoing/Tender', render: (r: Inquiry) => r.ongoingTender ?? '—' },
    { key: 'jsbNo', label: 'JSB No', render: (r: Inquiry) => r.jsbNo ?? '—' },
    { key: 'poNo', label: 'PO No', render: (r: Inquiry) => r.poNo ?? '—' },
    { key: 'poReceivedDate', label: 'PO Received Date', render: (r: Inquiry) => r.poReceivedDate ?? '—' },
    { key: 'awardedParty', label: 'Awarded Party', render: (r: Inquiry) => r.awardedParty ?? '—' },
    { key: 'awardedPrice', label: 'Awarded Price (LKR)', render: (r: Inquiry) => r.awardedPrice != null ? formatLKR(r.awardedPrice) : '—' },
    { key: 'remarks', label: 'Remarks', render: (r: Inquiry) => r.remarks ?? '—' },
  ];

  const columns = [...columnsBeforeContact, ...contactColumns, ...columnsAfterContact];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Inquiry Register</h2>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            {inquiries.length} records
          </span>
        </motion.div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={inquiries.length === 0}
            className="px-3 py-2 border border-slate-200 bg-white rounded text-sm font-medium hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> Export Excel
          </button>
          <label className="px-3 py-2 border border-slate-200 bg-white rounded text-sm font-medium hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
            <Upload size={16} />
            {importing ? 'Importing...' : 'Import Excel'}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} disabled={importing} />
          </label>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} /> New Inquiry
          </button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-6 flex-1 flex flex-col min-h-0">
        {importMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-sm px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-800"
          >
            {importMessage}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3"
        >
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search serial, customer, project, quotation or PO..."
            className="flex-1 bg-transparent border-none text-sm outline-none text-slate-700"
          />
        </motion.div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="overflow-auto flex-1"
          >
            <table className="w-max min-w-full text-left text-xs">
              <thead className="bg-slate-900 text-white sticky top-0 z-10">
                <tr>
                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold whitespace-nowrap sticky left-0 bg-slate-900 z-20 align-middle"
                  >
                    Actions
                  </th>
                  {columnsBeforeContact.map((col) => (
                    <th
                      key={col.key}
                      rowSpan={2}
                      className="px-3 py-3 font-semibold whitespace-nowrap border-l border-slate-700 align-middle"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th
                    colSpan={contactColumns.length}
                    className="px-3 py-2 font-semibold whitespace-nowrap border-l border-slate-700 text-center bg-slate-800"
                  >
                    Contact Details
                  </th>
                  {columnsAfterContact.map((col) => (
                    <th
                      key={col.key}
                      rowSpan={2}
                      className="px-3 py-3 font-semibold whitespace-nowrap border-l border-slate-700 align-middle"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {contactColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 font-semibold whitespace-nowrap border-l border-slate-700 bg-slate-800 text-slate-200"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-16 text-center text-slate-400">
                      Loading inquiry register...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-16 text-center text-slate-400">
                      No inquiries yet. Click &quot;New Inquiry&quot; to add the first record.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="hover:bg-blue-50/50"
                    >
                      <td className="px-3 py-2 whitespace-nowrap sticky left-0 bg-white border-r border-slate-100">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-3 py-2 whitespace-nowrap max-w-[220px] truncate border-l border-slate-50">
                          {col.render(row)}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        </div>
      </motion.div>

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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0"
              >
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit Inquiry' : 'New Inquiry'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={22} />
                </button>
              </motion.div>

              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Inquiry details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label className={labelClass}>Inquiry received date</label>
                      <input type="date" className={inputClass} value={form.inquiryReceivedDate ?? ''} onChange={(e) => setForm({ ...form, inquiryReceivedDate: e.target.value })} />
                    </motion.div>
                    <div>
                      <label className={labelClass}>Mode of inquiry</label>
                      <select className={inputClass} value={form.modeOfInquiry ?? ''} onChange={(e) => setForm({ ...form, modeOfInquiry: e.target.value })}>
                        <option value="">Select...</option>
                        {MODE_OF_INQUIRY.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
                      <label className={labelClass}>Category (LV / CMS / MEP)</label>
                      <select className={inputClass} value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value as Inquiry['category'] })}>
                        <option value="LV">LV</option>
                        <option value="CMS">CMS</option>
                        <option value="MEP">MEP</option>
                      </select>
                    </motion.div>
                  </div>
                </motion.section>

                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 border-b pb-2">Customer & project</h4>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Link existing customer (optional)</label>
                      <select
                        className={inputClass}
                        value={form.customerId ?? ''}
                        onChange={(e) => (e.target.value ? onCustomerPick(e.target.value) : setForm({ ...form, customerId: null }))}
                      >
                        <option value="">— Manual entry —</option>
                        {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Customer name *</label>
                      <input required className={inputClass} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-bold text-slate-800 mb-3">Contact details</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Contact person</label>
                          <input
                            className={inputClass}
                            placeholder="Name"
                            value={form.contactDetails ?? ''}
                            onChange={(e) => setForm({ ...form, contactDetails: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Phone number</label>
                          <input
                            type="tel"
                            className={inputClass}
                            placeholder="+94 77 123 4567"
                            value={form.contactPhone ?? ''}
                            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Email address</label>
                          <input
                            type="email"
                            className={inputClass}
                            placeholder="name@company.com"
                            value={form.contactEmail ?? ''}
                            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Project name</label>
                      <input className={inputClass} value={form.projectName ?? ''} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Document (reference / file name)</label>
                      <input className={inputClass} value={form.document ?? ''} onChange={(e) => setForm({ ...form, document: e.target.value })} />
                    </div>
                  </motion.div>
                </motion.section>

                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
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
                      <input className={inputClass} value={form.engineer ?? ''} onChange={(e) => setForm({ ...form, engineer: e.target.value })} />
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
                </motion.section>

                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
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
                </motion.section>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Saving...' : editingId ? 'Update inquiry' : 'Save inquiry'}
                  </button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
