import React, { useEffect, useState } from 'react';
import { Customer } from '../types';
import { UserPlus, Search, MoreHorizontal, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';

type ContactFields = { contact: string; email: string; phone: string };

const emptyContact = (): ContactFields => ({ contact: '', email: '', phone: '' });

const emptyForm = () => ({
  name: '',
  address: '',
  contacts: [emptyContact()],
});

const inputClass =
  'w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-3 bg-white text-sm';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = () => {
    setLoading(true);
    apiFetch('/api/customers')
      .then(res => res.json())
      .then(data => {
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
  }, []);

  const matchesContact = (contact: ContactFields, q: string) =>
    contact.contact.toLowerCase().includes(q) ||
    contact.email.toLowerCase().includes(q) ||
    contact.phone.toLowerCase().includes(q);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const extra = c.additionalContacts ?? [];
    return (
      c.name.toLowerCase().includes(q) ||
      matchesContact({ contact: c.contact, email: c.email, phone: c.phone }, q) ||
      extra.some((item) => matchesContact(item, q))
    );
  });

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

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const [primary, ...additional] = form.contacts;
    const res = await apiFetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        address: form.address,
        contact: primary.contact,
        email: primary.email,
        phone: primary.phone,
        additionalContacts: additional,
      }),
    });
    if (res.ok) {
      closeModal();
      loadCustomers();
    } else {
      setError('Could not register customer');
    }
    setSaving(false);
  };

  const contactCount = (customer: Customer) => 1 + (customer.additionalContacts?.length ?? 0);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Customer Registry</h2>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            ACTIVE: {customers.length}
          </span>
        </motion.div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserPlus size={16} /> Register Customer
        </button>
      </header>

      <div className="p-8">
        {error && !showModal && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, contact or email..."
              className="flex-1 bg-transparent border-none text-sm focus:ring-0 text-slate-600 outline-none"
            />
          </motion.div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Contact Person</th>
                <th className="px-6 py-4 font-semibold">Contact Methods</th>
                <th className="px-6 py-4 font-semibold">Address</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No customers found. Register your first customer.</td></tr>
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
                      <div className="text-sm font-semibold text-slate-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{customer.contact || '—'}</motion.div>
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
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{customer.address}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-900 transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <h3 className="text-xl font-bold text-slate-900">Register Customer</h3>
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
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
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
                      <div className="flex items-center justify-between">
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
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Contact person {index === 0 && '*'}
                        </label>
                        <input
                          required={index === 0}
                          className={inputClass}
                          placeholder="Name"
                          value={row.contact}
                          onChange={e => updateContact(index, 'contact', e.target.value)}
                        />
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
                            onChange={e => updateContact(index, 'phone', e.target.value)}
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
                            onChange={e => updateContact(index, 'email', e.target.value)}
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
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Register'}
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
