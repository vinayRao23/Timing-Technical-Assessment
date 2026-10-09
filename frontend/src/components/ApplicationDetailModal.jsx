import React from 'react';
import { X } from 'lucide-react';

const STATUS_BADGES = {
  saved: 'bg-slate-100 text-slate-700 border-slate-200',
  applied: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
  interviewing: 'bg-teal-50 text-teal-800 border-teal-200 font-semibold',
  offer: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
  rejected: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  application,
  onStatusChange,
  onEditClick,
  onDeleteClick,
  onSnoozeClick,
  onGenerateClick
}) {
  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 text-slate-900 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-sm">
            Application Details
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Main Info */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{application.company}</h2>
              <div className="text-sm font-semibold text-teal-700 mt-0.5">{application.role}</div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                User: {application.userName} ({application.userTimezone})
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-lg border ${STATUS_BADGES[application.status]}`}>
                {application.status}
              </span>
              <select
                value={application.status}
                onChange={(e) => onStatusChange(application.id, e.target.value)}
                className="text-[11px] font-semibold px-2 py-1 bg-slate-50 border border-slate-300 rounded-md cursor-pointer focus:outline-none"
              >
                <option value="saved">Move to Saved</option>
                <option value="applied">Move to Applied</option>
                <option value="interviewing">Move to Interviewing</option>
                <option value="offer">Move to Offer</option>
                <option value="rejected">Move to Rejected</option>
              </select>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                Last Activity Date
              </div>
              <div className="font-bold text-slate-800 text-xs">
                {application.isInvalidDate ? (
                  <span className="text-rose-600 font-mono">
                    {application.lastActivityDate} (Malformed)
                  </span>
                ) : (
                  application.lastActivityDate || 'Not specified'
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                Follow-up Schedule
              </div>
              <div className="font-bold text-slate-800 text-xs">
                Every {application.followUpAfterDays} days
                {application.followUpDueDate && (
                  <span className="block text-[11px] text-slate-500 font-normal">
                    Due: {application.followUpDueDate} {application.isFollowUpOverdue ? '(Overdue)' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {application.deadline && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 flex items-center justify-between">
              <span className="font-semibold">Offer Response Deadline:</span>
              <span className="font-extrabold font-mono text-xs bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {application.deadline}
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block text-xs">
              Application Notes
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 text-xs leading-relaxed min-h-[60px]">
              {application.notes || <span className="text-slate-400 italic">No notes provided for this application.</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onSnoozeClick(application);
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Snooze
              </button>

              <button
                onClick={() => {
                  onClose();
                  onGenerateClick(application);
                }}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition"
              >
                Draft Message
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEditClick(application);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Edit
              </button>

              <button
                onClick={() => {
                  onClose();
                  onDeleteClick(application.id);
                }}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-rose-700 font-semibold text-xs rounded-xl transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
