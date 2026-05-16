import React, { useEffect, useState } from 'react';
import { SalesPerson, SalesManager } from '../types';
import { formatLKR } from '../utils/currency';
import { Briefcase, User, Award, ShieldCheck, ShoppingBag, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';

const SalesTeam = () => {
  const [team, setTeam] = useState<{ persons: SalesPerson[]; managers: SalesManager[] } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', performance: 80, managerId: '' });
  const [addType, setAddType] = useState<'person' | 'manager'>('person');
  const [saving, setSaving] = useState(false);

  const loadTeam = () => {
    apiFetch('/api/sales')
      .then(res => res.json())
      .then(setTeam);
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
          : { type: 'person', name: form.name, performance: form.performance, managerId: form.managerId || null }
      ),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: '', department: '', performance: 80, managerId: '' });
      loadTeam();
    }
    setSaving(false);
  };

  if (!team) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 font-mono text-xs italic">
        Loading sales team...
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900 text-nowrap">Sales Infrastructure</h2>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            TEAM: {team.persons.length + team.managers.length}
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
        >
          <UserPlus size={16} /> Add Member
        </button>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <ShieldCheck size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Leadership & Management</h3>
          </div>
          {team.managers.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-400">
              No managers yet. Add a sales manager to get started.
            </motion.p>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {team.managers.map(manager => (
                <motion.div
                  key={manager.id}
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className="bg-slate-900 text-white p-6 rounded-lg relative overflow-hidden shadow-lg"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sales Manager</p>
                  <h4 className="text-xl font-bold mb-4">{manager.name}</h4>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <Briefcase size={12} />
                    Division: {manager.department}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <Award size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Performance Metrics</h3>
          </div>
          {team.persons.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-400">
              No sales executives yet.
            </motion.p>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {team.persons.map(person => (
                <motion.div
                  key={person.id}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                  className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm"
                >
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-start mb-6">
                    <motion.div>
                      <h4 className="text-xl font-bold text-slate-900 mb-1">{person.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {person.managerName ? `Reports to ${person.managerName}` : 'Senior Sales Executive'}
                      </p>
                    </motion.div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600 tracking-tighter">{person.performance}%</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KPI Score</div>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <p className="text-sm font-semibold text-slate-700 mb-4">
                      Total sales: {formatLKR(person.totalSales ?? 0)}
                    </p>
                  </motion.div>
                  <div className="space-y-3">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      Recent Closures
                    </motion.div>
                    {person.history.length === 0 ? (
                      <p className="text-sm text-slate-400">No orders assigned yet.</p>
                    ) : (
                      person.history.map(orderId => (
                        <motion.div
                          key={orderId}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex justify-between items-center bg-slate-50 p-4 rounded-md border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <ShoppingBag size={14} className="text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">Order {orderId.slice(-8)}</span>
                          </div>
                          <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">Logged</span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-8 max-w-md w-full border border-slate-200 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Team Member</h3>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => setAddType('person')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${addType === 'person' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>Sales Person</button>
                <button type="button" onClick={() => setAddType('manager')} className={`flex-1 py-2 rounded-lg text-sm font-semibold ${addType === 'manager' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>Manager</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Full name" className="w-full border border-slate-200 rounded-lg p-3" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                {addType === 'manager' ? (
                  <input required placeholder="Department / division" className="w-full border border-slate-200 rounded-lg p-3" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                ) : (
                  <>
                    <input type="number" min={0} max={100} placeholder="KPI %" className="w-full border border-slate-200 rounded-lg p-3" value={form.performance} onChange={e => setForm({ ...form, performance: Number(e.target.value) })} />
                    <select className="w-full border border-slate-200 rounded-lg p-3" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
                      <option value="">No manager</option>
                      {team.managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </>
                )}
                <button type="submit" disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SalesTeam;
