import React, { useEffect, useState } from 'react';
import { SalesPerson, SalesManager, SalesDesignation } from '../types';
import { formatLKR } from '../utils/currency';
import { DESIGNATION_LABELS, SALES_DESIGNATIONS } from '../constants/sales';
import { Briefcase, Award, ShieldCheck, ShoppingBag, UserPlus, X, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';

const emptyForm = () => ({
  name: '',
  department: '',
  designation: 'SALES_EXECUTIVE' as SalesDesignation,
  managerId: '',
});

const inputClass =
  'w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none';

const PersonCard: React.FC<{ person: SalesPerson }> = ({ person }) => {
  return (
    <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4 gap-4">
        <div>
          <h4 className="text-xl font-bold text-slate-900 mb-1">{person.name}</h4>
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            {DESIGNATION_LABELS[person.designation]}
          </span>
          {person.managerName && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Reports to {person.managerName}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-slate-900">{formatLKR(person.totalSales ?? 0)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total sales</p>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          Recent inquiries ({person.history.length})
        </p>
        {person.history.length === 0 ? (
          <p className="text-sm text-slate-400">No inquiries assigned yet.</p>
        ) : (
          person.history.slice(0, 5).map((serialNo) => (
            <div
              key={serialNo}
              className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-100"
            >
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <ShoppingBag size={14} className="text-slate-400" />
                Inquiry #{serialNo}
              </span>
              <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">
                Logged
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ManagerDetailModal({
  manager,
  onClose,
}: {
  manager: SalesManager;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col"
      >
        <div className="bg-slate-900 text-white p-6 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sales Manager</p>
              <h3 className="text-2xl font-bold">{manager.name}</h3>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} /> {manager.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {manager.salesPersons?.length ?? 0} team members
                </span>
                {manager.createdAt && (
                  <span className="text-slate-400 text-xs">
                    Since {new Date(manager.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={22} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {(manager.salesPersons?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No sales persons assigned to this manager yet.</p>
          ) : (
            manager.salesPersons?.map((person) => (
              <div key={person.id} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900">{person.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      {DESIGNATION_LABELS[person.designation]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatLKR(person.totalSales ?? 0)}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total sales</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Assigned inquiries ({person.inquiries?.length ?? person.history.length})
                  </p>
                  {(person.inquiries?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-400">No inquiries yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {person.inquiries?.map((inq) => (
                        <div
                          key={inq.id}
                          className="flex flex-wrap items-center justify-between gap-2 border border-slate-100 rounded-md p-3 text-sm"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">#{inq.serialNo}</span>
                            <span className="text-slate-500 mx-2">·</span>
                            <span className="text-slate-700">{inq.customerName}</span>
                            {inq.projectName && (
                              <p className="text-xs text-slate-400 mt-0.5">{inq.projectName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800">
                              {inq.quotationAmount != null ? formatLKR(inq.quotationAmount) : '—'}
                            </p>
                            {inq.inquiryReceivedDate && (
                              <p className="text-[10px] text-slate-400">{inq.inquiryReceivedDate}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

const SalesTeam = () => {
  const [team, setTeam] = useState<{ persons: SalesPerson[]; managers: SalesManager[] } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<SalesManager | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [addType, setAddType] = useState<'person' | 'manager'>('person');
  const [saving, setSaving] = useState(false);

  const loadTeam = () => {
    apiFetch('/api/sales')
      .then((res) => res.json())
      .then((data) => {
        setTeam(data);
        if (selectedManager) {
          const updated = data.managers.find((m: SalesManager) => m.id === selectedManager.id);
          setSelectedManager(updated ?? null);
        }
      });
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch('/api/sales', {
      method: 'POST',
      body: JSON.stringify(
        addType === 'manager'
          ? { type: 'manager', name: form.name, department: form.department }
          : {
              type: 'person',
              name: form.name,
              designation: form.designation,
              managerId: form.managerId || null,
            }
      ),
    });
    if (res.ok) {
      setShowModal(false);
      setForm(emptyForm());
      loadTeam();
    }
    setSaving(false);
  };

  if (!team) {
    return <div className="p-8 text-sm text-slate-400 italic">Loading sales team...</div>;
  }

  const unassigned = team.persons.filter((p) => !p.managerId);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Sales Infrastructure</h2>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            TEAM: {team.persons.length + team.managers.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
        >
          <UserPlus size={16} /> Add Member
        </button>
      </header>

      <div className="p-8 space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <ShieldCheck size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Leadership & Management</h3>
          </div>
          {team.managers.length === 0 ? (
            <p className="text-sm text-slate-400">No managers yet. Add a sales manager to get started.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.managers.map((manager) => (
                <button
                  key={manager.id}
                  type="button"
                  onClick={() => setSelectedManager(manager)}
                  className="bg-slate-900 text-white p-6 rounded-lg shadow-lg text-left hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Manager</p>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-white shrink-0" />
                  </div>
                  <h4 className="text-xl font-bold mb-3 mt-1">{manager.name}</h4>
                  <p className="flex items-center gap-2 text-xs text-slate-300 mb-3">
                    <Briefcase size={12} /> Division: {manager.department}
                  </p>
                  <p className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    <Users size={12} />
                    {manager.teamSize ?? manager.salesPersons?.length ?? 0} assigned sales persons
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <Award size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Sales Team</h3>
          </div>
          {team.persons.length === 0 ? (
            <p className="text-sm text-slate-400">No sales executives yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {team.persons.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          )}
        </section>

        {unassigned.length > 0 && team.managers.length > 0 && (
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Unassigned to a manager</p>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((p) => (
                <span
                  key={p.id}
                  className="text-sm bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-700"
                >
                  {p.name} · {DESIGNATION_LABELS[p.designation]}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {selectedManager && (
          <ManagerDetailModal manager={selectedManager} onClose={() => setSelectedManager(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-8 max-w-md w-full border border-slate-200 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Team Member</h3>
                <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm()); }}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setAddType('person')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold ${addType === 'person' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
                >
                  Sales Person
                </button>
                <button
                  type="button"
                  onClick={() => setAddType('manager')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold ${addType === 'manager' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
                >
                  Manager
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Full name
                  </label>
                  <input
                    required
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                {addType === 'manager' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Department / division
                    </label>
                    <input
                      required
                      className={inputClass}
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Designation
                      </label>
                      <select
                        required
                        className={inputClass}
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value as SalesDesignation })}
                      >
                        {SALES_DESIGNATIONS.map((d) => (
                          <option key={d} value={d}>
                            {DESIGNATION_LABELS[d]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Reports to (manager)
                      </label>
                      <select
                        className={inputClass}
                        value={form.managerId}
                        onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {team.managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Add'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesTeam;
