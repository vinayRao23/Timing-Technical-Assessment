import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ApplicationModal({
  isOpen,
  onClose,
  onSave,
  users = [],
  initialData = null
}) {
  const activeUser = users.find(u => u.id === 'u1') || users[0] || { id: 'u1', name: 'Maya', timezone: 'America/New_York' };

  const [formData, setFormData] = useState({
    id: '',
    userId: activeUser.id,
    company: '',
    role: '',
    status: 'saved',
    lastActivityDate: '',
    followUpAfterDays: 7,
    deadline: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        userId: initialData.userId || activeUser.id,
        company: initialData.company || '',
        role: initialData.role || '',
        status: initialData.status || 'saved',
        lastActivityDate: initialData.lastActivityDate || '',
        followUpAfterDays: initialData.followUpAfterDays ?? 7,
        deadline: initialData.deadline || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        id: '',
        userId: activeUser.id,
        company: '',
        role: '',
        status: 'saved',
        lastActivityDate: new Date().toISOString().split('T')[0],
        followUpAfterDays: 7,
        deadline: '',
        notes: ''
      });
    }
  }, [initialData, activeUser.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Light Modal Header Matching Timing Theme */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between text-slate-900">
          <h2 className="text-sm font-bold text-slate-900">
            {initialData ? 'Edit Application' : 'Create New Application'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          {/* Read-only Assigned User */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">User Account</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800">
              {activeUser.name} ({activeUser.timezone})
            </div>
          </div>

          {/* Company & Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Stripe"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Role Title *</label>
              <input
                type="text"
                placeholder="e.g. SWE Intern"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Status & Follow-up Days */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Application Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Follow-Up After (Days)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.followUpAfterDays}
                onChange={(e) => setFormData({ ...formData, followUpAfterDays: parseInt(e.target.value, 10) || 7 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dates: Last Activity & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">
                Last Activity Date
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={formData.lastActivityDate || ''}
                onChange={(e) => setFormData({ ...formData, lastActivityDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Format: YYYY-MM-DD (e.g. 2026-09-25)</span>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">
                Offer/Reply Deadline
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DD (optional)"
                value={formData.deadline || ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Notes & Activity Log
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Spoke with recruiter Dana, completed round 1 tech screen..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition"
            >
              {initialData ? 'Save Changes' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
