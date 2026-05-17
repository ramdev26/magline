import React, { useEffect, useState } from 'react';
import { SalesPerson, SalesManager, HeadOfSales, SalesDesignation } from '../types';
import { formatLKR } from '../utils/currency';
import {
  DEFAULT_HEAD_OF_SALES_NAME,
  DESIGNATION_LABELS,
  isActiveMember,
  SALES_DESIGNATIONS,
  SUSPENSION_REASON_LABELS,
} from '../constants/sales';
import {
  Briefcase,
  Award,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  X,
  Users,
  ChevronRight,
  Crown,
  Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import EditSalesMemberModal, { EditSalesTarget } from './EditSalesMemberModal';

type TeamData = {
  persons: SalesPerson[];
  managers: SalesManager[];
  head: HeadOfSales;
};

type AddType = 'manager' | 'person';

const emptyForm = () => ({
  name: '',
  department: '',
  designation: 'SALES_EXECUTIVE' as SalesDesignation,
  managerId: '',
});

function MemberStatusBadge({ member }: { member: SalesPerson | SalesManager }) {
  if (member.status === 'ACTIVE') return null;
  return (
    <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 ring-1 ring-amber-200">
      Suspended
      {member.suspensionReason ? ` · ${SUSPENSION_REASON_LABELS[member.suspensionReason]}` : ''}
    </span>
  );
}

const inputClass =
  'w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none';

const PersonCard: React.FC<{
  person: SalesPerson;
  isSuperAdmin: boolean;
  onEdit?: () => void;
}> = ({ person, isSuperAdmin, onEdit }) => (
  <div
    className={`bg-white p-8 rounded-lg border shadow-sm relative ${
      person.status === 'SUSPENDED' ? 'border-amber-200 opacity-85' : 'border-slate-200'
    }`}
  >
    {isSuperAdmin && onEdit && (
      <button type="button" onClick={onEdit} className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700" title="Edit">
        <Pencil size={16} />
      </button>
    )}
    <div className="flex justify-between items-start mb-4 gap-4 pr-10">
      <div>
        <h4 className="text-xl font-bold text-slate-900 mb-1">{person.name}</h4>
        <MemberStatusBadge member={person} />
        <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          {DESIGNATION_LABELS[person.designation]}
        </span>
        {person.managerName && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Reports to {person.managerName}</p>
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
          <div key={serialNo} className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-100">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <ShoppingBag size={14} className="text-slate-400" /> Inquiry #{serialNo}
            </span>
            <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">Logged</span>
          </div>
        ))
      )}
    </div>
  </div>
);

function InquiryList({ inquiries }: { inquiries: SalesPerson['inquiries'] }) {
  if (!inquiries?.length) return <p className="text-sm text-slate-400">No inquiries yet.</p>;
  return (
    <div className="space-y-2">
      {inquiries.map((inq) => (
        <div
          key={inq.id}
          className="flex flex-wrap items-center justify-between gap-2 border border-slate-100 rounded-md p-3 text-sm"
        >
          <div>
            <span className="font-semibold text-slate-900">#{inq.serialNo}</span>
            <span className="text-slate-500 mx-2">·</span>
            <span className="text-slate-700">{inq.customerName}</span>
            {inq.projectName && <p className="text-xs text-slate-400 mt-0.5">{inq.projectName}</p>}
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
  );
}

function ManagerDetailModal({
  manager,
  onClose,
  isSuperAdmin,
  onEditManager,
  onEditPerson,
}: {
  manager: SalesManager;
  onClose: () => void;
  isSuperAdmin: boolean;
  onEditManager: () => void;
  onEditPerson: (person: SalesPerson) => void;
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
              <MemberStatusBadge member={manager} />
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} /> {manager.department}
                </span>
                {manager.headOfSalesName && (
                  <span className="flex items-center gap-1.5">
                    <Crown size={14} /> Head: {manager.headOfSalesName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {manager.salesPersons?.length ?? 0} sales persons
                </span>
                <span className="text-emerald-300 font-semibold">
                  {formatLKR(manager.totalTeamSales ?? 0)} team sales
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={onEditManager}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  title="Edit manager"
                >
                  <Pencil size={18} />
                </button>
              )}
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                <X size={22} />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {(manager.salesPersons?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No sales persons on this team yet.</p>
          ) : (
            manager.salesPersons?.map((person) => (
              <div key={person.id} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex flex-wrap justify-between gap-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900">{person.name}</h4>
                    <MemberStatusBadge member={person} />
                    <span className="text-[10px] font-bold uppercase text-blue-600 block mt-1">
                      {DESIGNATION_LABELS[person.designation]}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatLKR(person.totalSales ?? 0)}</p>
                    </div>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => onEditPerson(person)}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Assigned inquiries</p>
                  <InquiryList inquiries={person.inquiries} />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


function HeadDetailModal({
  head,
  onOpenManager,
  onClose,
}: {
  head: HeadOfSales;
  onOpenManager: (manager: SalesManager) => void;
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
        <motion.div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Crown size={12} /> Head of Sales
              </p>
              <h3 className="text-2xl font-bold">{head.name}</h3>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} /> {head.department || 'Sales division'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {head.managerCount ?? 0} sales managers
                </span>
                <span className="text-emerald-300 font-semibold">
                  {formatLKR(head.totalTeamSales ?? 0)} division sales
                </span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={22} />
            </button>
          </div>
        </motion.div>
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {(head.salesManagers?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No sales managers assigned yet.</p>
          ) : (
            head.salesManagers?.map((manager) => (
              <button
                key={manager.id}
                type="button"
                onClick={() => onOpenManager(manager)}
                className="w-full text-left rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Sales Manager</p>
                    <h4 className="font-bold text-slate-900 text-lg">{manager.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{manager.department}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 shrink-0 mt-1" />
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                  <span>{manager.teamSize ?? 0} sales persons</span>
                  <span className="font-semibold text-slate-800">{formatLKR(manager.totalTeamSales ?? 0)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

const SalesTeam = () => {
  const { isSuperAdmin } = useAuth();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<SalesManager | null>(null);
  const [selectedHead, setSelectedHead] = useState<HeadOfSales | null>(null);
  const [editTarget, setEditTarget] = useState<EditSalesTarget | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [addType, setAddType] = useState<AddType>('person');
  const [saving, setSaving] = useState(false);

  const loadTeam = () => {
    apiFetch('/api/sales')
      .then((res) => res.json())
      .then((data: TeamData) => {
        setTeam(data);
        if (selectedManager) {
          setSelectedManager(data.managers.find((m) => m.id === selectedManager.id) ?? null);
        }
        if (selectedHead) {
          setSelectedHead(data.head);
        }
      });
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let payload: Record<string, unknown>;
    if (addType === 'manager') {
      payload = {
        type: 'manager',
        name: form.name,
        department: form.department,
      };
    } else {
      payload = {
        type: 'person',
        name: form.name,
        designation: form.designation,
        managerId: form.managerId || null,
      };
    }
    const res = await apiFetch('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
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

  const activeManagers = team.managers.filter(isActiveMember);
  const suspendedManagers = team.managers.filter((m) => !isActiveMember(m));
  const activePersons = team.persons.filter(isActiveMember);
  const suspendedPersons = team.persons.filter((p) => !isActiveMember(p));
  const unassignedPersons = activePersons.filter((p) => !p.managerId);
  const teamTotal = activePersons.length + activeManagers.length + 1;
  const head = team.head;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Sales Infrastructure</h2>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
            TEAM: {teamTotal}
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
            <Crown size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Head of Sales</h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedHead(head)}
            className="w-full max-w-xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-lg shadow-lg text-left hover:from-indigo-900 hover:to-slate-800 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Head of Sales</p>
              <ChevronRight size={16} className="text-indigo-400 group-hover:text-white shrink-0" />
            </div>
            <h4 className="text-xl font-bold mb-3 mt-1">{head.name}</h4>
            <p className="flex items-center gap-2 text-xs text-slate-300 mb-2">
              <Briefcase size={12} /> {head.department}
            </p>
            <p className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
              <Users size={12} /> {head.managerCount ?? 0} sales managers ·{' '}
              {formatLKR(head.totalTeamSales ?? 0)}
            </p>
          </button>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <ShieldCheck size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Sales Managers</h3>
          </div>
          {activeManagers.length === 0 ? (
            <p className="text-sm text-slate-400">No sales managers yet. New managers report to {DEFAULT_HEAD_OF_SALES_NAME}.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeManagers.map((manager) => (
                <div key={manager.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelectedManager(manager)}
                  className="w-full bg-slate-900 text-white p-6 rounded-lg shadow-lg text-left hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Manager</p>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-white shrink-0" />
                  </div>
                  <h4 className="text-xl font-bold mb-2 mt-1 pr-8">{manager.name}</h4>
                  <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Crown size={10} /> {manager.headOfSalesName ?? DEFAULT_HEAD_OF_SALES_NAME}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                    <Briefcase size={12} /> {manager.department}
                  </p>
                  <p className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                    <Users size={12} /> {manager.teamSize ?? 0} sales persons ·{' '}
                    {formatLKR(manager.totalTeamSales ?? 0)}
                  </p>
                </button>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditTarget({ kind: 'manager', member: manager })}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                    title="Edit manager"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <Award size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Sales Executives</h3>
          </div>
          {activePersons.length === 0 ? (
            <p className="text-sm text-slate-400">No sales executives yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {activePersons.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={isSuperAdmin ? () => setEditTarget({ kind: 'person', member: person }) : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {isSuperAdmin && (suspendedManagers.length > 0 || suspendedPersons.length > 0) && (
          <section>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-4">Suspended members</p>
            <div className="flex flex-wrap gap-2">
              {suspendedManagers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEditTarget({ kind: 'manager', member: m })}
                  className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900 hover:bg-amber-100"
                >
                  {m.name}
                  {m.suspensionReason ? ` · ${SUSPENSION_REASON_LABELS[m.suspensionReason]}` : ''}
                </button>
              ))}
              {suspendedPersons.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEditTarget({ kind: 'person', member: p })}
                  className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900 hover:bg-amber-100"
                >
                  {p.name} · {DESIGNATION_LABELS[p.designation]}
                  {p.suspensionReason ? ` · ${SUSPENSION_REASON_LABELS[p.suspensionReason]}` : ''}
                </button>
              ))}
            </div>
          </section>
        )}

        {unassignedPersons.length > 0 && (
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Sales persons not assigned to a manager
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedPersons.map((p) => (
                <span key={p.id} className="text-sm bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-700">
                  {p.name} · {DESIGNATION_LABELS[p.designation]}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {selectedHead && (
          <HeadDetailModal
            head={selectedHead}
            onClose={() => setSelectedHead(null)}
            onOpenManager={(manager) => {
              setSelectedHead(null);
              setSelectedManager(manager);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedManager && (
          <ManagerDetailModal
            manager={selectedManager}
            onClose={() => setSelectedManager(null)}
            isSuperAdmin={isSuperAdmin}
            onEditManager={() => setEditTarget({ kind: 'manager', member: selectedManager })}
            onEditPerson={(person) => setEditTarget({ kind: 'person', member: person })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editTarget && isSuperAdmin && (
          <EditSalesMemberModal
            target={editTarget}
            activeManagers={activeManagers}
            onClose={() => setEditTarget(null)}
            onSaved={loadTeam}
          />
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
              className="bg-white rounded-xl p-8 max-w-md w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Team Member</h3>
                <button type="button" onClick={() => { setShowModal(false); setForm(emptyForm()); }}>
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['manager', 'person'] as AddType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddType(type)}
                    className={`py-2 px-1 rounded-lg text-[11px] font-semibold leading-tight ${
                      addType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type === 'manager' ? 'Sales Manager' : 'Sales Person'}
                  </button>
                ))}
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
                {addType === 'manager' && (
                  <>
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
                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      Reports to <span className="font-semibold text-slate-800">{DEFAULT_HEAD_OF_SALES_NAME}</span>{' '}
                      (Head of Sales)
                    </p>
                  </>
                )}
                {addType === 'person' && (
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
                        Reports to (Sales Manager)
                      </label>
                      <select
                        className={inputClass}
                        value={form.managerId}
                        onChange={(e) => setForm({ ...form, managerId: e.target.value })}
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
