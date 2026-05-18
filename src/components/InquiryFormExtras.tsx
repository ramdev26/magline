import React, { useRef } from 'react';
import { Plus, Paperclip, Trash2 } from 'lucide-react';
import type { InquiryDocument, InquiryFollowUp, InquiryFollowUpStatus, InquiryFormData } from '../types';
import {
  INQUIRY_FOLLOW_UP_LABELS,
  INQUIRY_FOLLOW_UP_STATUSES,
  ONGOING_TENDER,
  emptyFollowUp,
} from '../constants/inquiry';
import type { AssigneeOption } from '../lib/salesAssignee';

const inputClass =
  'w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-2.5 bg-slate-50 text-sm';

const labelClass = 'block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1';

const MAX_FILE_BYTES = 4 * 1024 * 1024;

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type DocumentsProps = {
  documents: InquiryDocument[];
  onChange: (documents: InquiryDocument[]) => void;
};

export function InquiryDocumentsField({ documents, onChange }: DocumentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next = [...documents];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_BYTES) continue;
      const fileData = await readFileAsDataUrl(file);
      next.push({ fileName: file.name, remarks: '', fileData });
    }
    onChange(next);
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <div className="flex items-center justify-between">
        <label className={labelClass}>Documents</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Paperclip size={14} /> Attach files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {documents.length === 0 && (
        <p className="text-xs text-slate-400">No documents attached. You can attach multiple files with remarks.</p>
      )}
      {documents.map((doc, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5">
              <Paperclip size={14} className="text-slate-400 shrink-0" />
              {doc.fileName}
            </p>
            <button
              type="button"
              onClick={() => onChange(documents.filter((_, i) => i !== index))}
              className="text-slate-400 hover:text-red-600 shrink-0"
              aria-label="Remove document"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div>
            <label className={labelClass}>Remark</label>
            <textarea
              className={`${inputClass} min-h-[60px]`}
              placeholder="Notes about this document..."
              value={doc.remarks}
              onChange={(e) =>
                onChange(
                  documents.map((row, i) => (i === index ? { ...row, remarks: e.target.value } : row))
                )
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type AssigneeProps = {
  value: string;
  assigneeGroups: [string, AssigneeOption[]][];
  onChange: (value: string) => void;
};

export function InquiryAssigneeSelect({ value, assigneeGroups, onChange }: AssigneeProps) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Unassigned</option>
      {assigneeGroups.map(([group, options]) => (
        <optgroup key={group} label={group}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

type PoProps = {
  form: InquiryFormData;
  setForm: React.Dispatch<React.SetStateAction<InquiryFormData>>;
  showFollowUp: boolean;
};

export function InquiryPoFollowUpSection({ form, setForm, showFollowUp }: PoProps) {
  const updateFollowUp = (
    index: number,
    field: keyof InquiryFollowUp,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      followUps: prev.followUps.map((row, i) =>
        i === index
          ? { ...row, [field]: field === 'status' ? (value as InquiryFollowUpStatus) : value }
          : row
      ),
    }));
  };

  return (
    <section className="space-y-4">
      <h4 className="text-sm font-bold text-slate-800 border-b pb-2">PO or Follow up</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>PO no</label>
          <input
            className={inputClass}
            value={form.poNo ?? ''}
            onChange={(e) => setForm({ ...form, poNo: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>PO received date</label>
          <input
            type="date"
            className={inputClass}
            value={form.poReceivedDate ?? ''}
            onChange={(e) => setForm({ ...form, poReceivedDate: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>JSB no</label>
          <input
            className={inputClass}
            value={form.jsbNo ?? ''}
            onChange={(e) => setForm({ ...form, jsbNo: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Ongoing / tender</label>
          <select
            className={inputClass}
            value={form.ongoingTender ?? ''}
            onChange={(e) => setForm({ ...form, ongoingTender: e.target.value })}
          >
            <option value="">—</option>
            {ONGOING_TENDER.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Awarded party</label>
          <input
            className={inputClass}
            value={form.awardedParty ?? ''}
            onChange={(e) => setForm({ ...form, awardedParty: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Awarded price (LKR)</label>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.awardedPrice ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                awardedPrice: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelClass}>Remarks</label>
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={form.remarks ?? ''}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </div>
      </div>

      {showFollowUp && (
        <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-bold text-violet-900">Follow up action</h5>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, followUps: [...prev.followUps, emptyFollowUp()] }))}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900 flex items-center gap-1"
            >
              <Plus size={14} /> Add another follow-up
            </button>
          </div>
          {form.followUps.length === 0 && (
            <p className="text-xs text-violet-700/80">No PO number entered — add follow-up updates below.</p>
          )}
          {form.followUps.map((fu, index) => (
            <div key={index} className="rounded-lg border border-violet-100 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-violet-800 uppercase tracking-wider">
                  Follow-up {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      followUps: prev.followUps.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-slate-400 hover:text-red-600"
                  aria-label="Remove follow-up"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Status / update</label>
                  <select
                    className={inputClass}
                    value={fu.status}
                    onChange={(e) => updateFollowUp(index, 'status', e.target.value)}
                  >
                    {INQUIRY_FOLLOW_UP_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {INQUIRY_FOLLOW_UP_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Follow up date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={fu.followUpDate ?? ''}
                    onChange={(e) => updateFollowUp(index, 'followUpDate', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Follow up by</label>
                  <input
                    className={inputClass}
                    placeholder="Name of person following up"
                    value={fu.followUpBy}
                    onChange={(e) => updateFollowUp(index, 'followUpBy', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Remarks</label>
                  <textarea
                    className={`${inputClass} min-h-[70px]`}
                    value={fu.remarks}
                    onChange={(e) => updateFollowUp(index, 'remarks', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          {form.followUps.length === 0 && (
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, followUps: [emptyFollowUp()] }))}
              className="w-full py-2.5 rounded-lg border border-dashed border-violet-300 text-sm font-semibold text-violet-700 hover:bg-violet-50"
            >
              Add follow-up
            </button>
          )}
        </div>
      )}
    </section>
  );
}
