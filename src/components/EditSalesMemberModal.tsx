import React, { useState } from 'react';
import {
  SalesManager,
  SalesPerson,
  SalesDesignation,
  SalesSuspensionReason,
  SalesTeamStatus,
} from '../types';
import {
  DESIGNATION_LABELS,
  SALES_DESIGNATIONS,
  SUSPENSION_REASONS,
  SUSPENSION_REASON_LABELS,
} from '../constants/sales';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

const inputClass =
  'w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none';

const labelClass = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1';

export type EditSalesTarget =
  | { kind: 'manager'; member: SalesManager }
  | { kind: 'person'; member: SalesPerson };

type Props = {
  target: EditSalesTarget;
  activeManagers: SalesManager[];
  onClose: () => void;
  onSaved: () => void;
};

export default function EditSalesMemberModal({ target, activeManagers, onClose, onSaved }: Props) {
  const isManager = target.kind === 'manager';
  const member = target.member;

  const [name, setName] = useState(member.name);
  const [department, setDepartment] = useState(
    isManager ? (member as SalesManager).department : ''
  );
  const [designation, setDesignation] = useState<SalesDesignation>(
    !isManager ? (member as SalesPerson).designation : 'SALES_EXECUTIVE'
  );
  const [managerId, setManagerId] = useState(
    !isManager ? (member as SalesPerson).managerId ?? '' : ''
  );
  const [status, setStatus] = useState<SalesTeamStatus>(member.status ?? 'ACTIVE');
  const [suspensionReason, setSuspensionReason] = useState<SalesSuspensionReason | ''>(
    member.suspensionReason ?? ''
  );
  const [suspensionNote, setSuspensionNote] = useState(member.suspensionNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      status,
    };

    if (isManager) {
      payload.department = department.trim();
    } else {
      payload.designation = designation;
      payload.managerId = managerId || null;
    }

    if (status === 'SUSPENDED') {
      if (!suspensionReason) {
        setError('Select a suspension reason.');
        setSaving(false);
        return;
      }
      payload.suspensionReason = suspensionReason;
      payload.suspensionNote = suspensionNote.trim() || null;
    }

    const url =
      target.kind === 'manager'
        ? `/api/sales/managers/${member.id}`
        : `/api/sales/persons/${member.id}`;

    const res = await apiFetch(url, { method: 'PATCH', body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Could not save changes');
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isManager ? 'Sales Manager' : 'Sales Executive'}
            </p>
            <h3 className="text-lg font-bold text-slate-900">Edit member</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {isManager ? (
            <div>
              <label className={labelClass}>Department / division</label>
              <input
                required
                className={inputClass}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>Designation</label>
                <select
                  className={inputClass}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value as SalesDesignation)}
                >
                  {SALES_DESIGNATIONS.map((d) => (
                    <option key={d} value={d}>
                      {DESIGNATION_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Reports to (Sales Manager)</label>
                <select
                  className={inputClass}
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {activeManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-slate-100">
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as SalesTeamStatus)}
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {status === 'SUSPENDED' && (
            <>
              <div>
                <label className={labelClass}>Suspension reason *</label>
                <select
                  required
                  className={inputClass}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value as SalesSuspensionReason)}
                >
                  <option value="">Select reason...</option>
                  {SUSPENSION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {SUSPENSION_REASON_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Notes (optional)</label>
                <textarea
                  className={`${inputClass} min-h-[72px] resize-y`}
                  value={suspensionNote}
                  onChange={(e) => setSuspensionNote(e.target.value)}
                  placeholder="Additional details..."
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
