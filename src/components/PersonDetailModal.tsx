import React from 'react';
import { SalesPerson } from '../types';
import { formatLKR } from '../utils/currency';
import { DESIGNATION_LABELS } from '../constants/sales';
import { Award, Pencil, ShoppingBag, Users, X } from 'lucide-react';
import { motion } from 'motion/react';

function MemberStatusBadge({ member }: { member: SalesPerson }) {
  if (member.status === 'ACTIVE') return null;
  return (
    <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 ring-1 ring-amber-200">
      Suspended
    </span>
  );
}

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

type Props = {
  person: SalesPerson;
  onClose: () => void;
  isSuperAdmin: boolean;
  onEdit: () => void;
};

export default function PersonDetailModal({ person, onClose, isSuperAdmin, onEdit }: Props) {
  const inquiryCount = person.inquiries?.length ?? person.history.length;

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
        <div className="bg-gradient-to-br from-blue-700 to-slate-900 text-white p-6 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Award size={12} /> Sales Executive
              </p>
              <h3 className="text-2xl font-bold">{person.name}</h3>
              <MemberStatusBadge member={person} />
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-200">
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/15 text-white">
                  {DESIGNATION_LABELS[person.designation]}
                </span>
                {person.managerName && (
                  <span className="flex items-center gap-1.5">
                    <Users size={14} /> Reports to {person.managerName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <ShoppingBag size={14} /> {inquiryCount} {inquiryCount === 1 ? 'inquiry' : 'inquiries'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 shrink-0">
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-300">{formatLKR(person.totalSales ?? 0)}</p>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total sales</p>
              </div>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>
              )}
              <button type="button" onClick={onClose} className="text-slate-300 hover:text-white p-1">
                <X size={22} />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">All assigned inquiries</p>
          <InquiryList inquiries={person.inquiries} />
        </div>
      </motion.div>
    </motion.div>
  );
}
