import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HardHat, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { Engineer } from '../types';

const inputClass =
  'w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm';

const labelClass = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1';

const Engineers = () => {
  const { isSuperAdmin } = useAuth();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const loadEngineers = async () => {
    setLoading(true);
    const res = await apiFetch('/api/engineers/all');
    if (res.ok) setEngineers(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadEngineers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await apiFetch('/api/engineers', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Could not add engineer');
      setSaving(false);
      return;
    }

    setMessage(`Engineer "${data.name}" added.`);
    setName('');
    setShowForm(false);
    loadEngineers();
    setSaving(false);
  };

  const toggleActive = async (engineer: Engineer) => {
    await apiFetch(`/api/engineers/${engineer.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !engineer.active }),
    });
    loadEngineers();
  };

  const activeCount = engineers.filter((e) => e.active).length;

  return (
    <motion.div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Engineers</h2>
          <p className="text-xs text-slate-500">
            Super admin — add engineers for inquiry assignment ({activeCount} active)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMessage(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={16} /> Add engineer
        </button>
      </header>

      <div className="p-8 max-w-3xl">
        {message && (
          <p className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            {message}
          </p>
        )}

        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">New engineer</h3>
            <div className="mb-4">
              <label className={labelClass}>Full name</label>
              <input
                required
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nimal Perera"
              />
            </div>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <motion.div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </motion.form>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <HardHat size={18} />
              <span className="text-sm font-semibold">Engineer list</span>
            </div>
            <button
              type="button"
              onClick={loadEngineers}
              className="text-slate-400 hover:text-slate-600"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-400 italic">Loading...</p>
          ) : engineers.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No engineers yet. Add names to use in inquiry forms.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {engineers.map((engineer) => (
                <li
                  key={engineer.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{engineer.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">
                      {engineer.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(engineer)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                      engineer.active
                        ? 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100'
                        : 'border-green-200 text-green-800 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {engineer.active ? 'Deactivate' : 'Restore'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Engineers;
