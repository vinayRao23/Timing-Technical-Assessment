import React, { useState } from 'react';

const STATUS_BADGES = {
  saved: 'bg-slate-100 text-slate-700 border-slate-200',
  applied: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
  interviewing: 'bg-teal-50 text-teal-800 border-teal-200 font-semibold',
  offer: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
  rejected: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function ListView({ 
  applications = [], 
  onStatusChange, 
  onEditApplication, 
  onDeleteApplication,
  onViewDetails 
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
        <p className="font-semibold text-slate-700">No applications found</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting search filters or adding a new application.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs w-full overflow-hidden">
      <table className="w-full text-left text-xs table-fixed">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
          <tr>
            <th className="px-3 py-3.5 w-[20%]">Company & Role</th>
            <th className="px-3 py-3.5 w-[12%]">User</th>
            <th className="px-3 py-3.5 w-[13%]">Status</th>
            <th className="px-3 py-3.5 w-[11%]">Last Activity</th>
            <th className="px-3 py-3.5 w-[12%]">Follow-up Due</th>
            <th className="px-3 py-3.5 w-[10%]">Deadline</th>
            <th className="px-3 py-3.5 w-[14%]">Notes</th>
            <th className="px-3 py-3.5 w-[8%] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-slate-50/70 transition">
              <td className="px-3 py-4">
                <div className="font-bold text-slate-900 truncate" title={app.company}>{app.company}</div>
                <div className="text-teal-700 font-semibold text-[11px] truncate" title={app.role}>{app.role}</div>
              </td>
              <td className="px-3 py-4">
                <div className="font-medium text-slate-800 truncate">{app.userName}</div>
                <div className="text-[10px] text-slate-400 truncate">{app.userTimezone}</div>
              </td>
              <td className="px-3 py-4">
                <select
                  value={app.status}
                  onChange={(e) => onStatusChange(app.id, e.target.value)}
                  className={`w-full px-1.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer focus:outline-none ${STATUS_BADGES[app.status]}`}
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </td>
              <td className="px-3 py-4">
                {app.isInvalidDate ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-mono text-[9px] font-bold border border-rose-200">
                    {app.lastActivityDate}
                  </span>
                ) : (
                  <span className="font-medium text-[11px]">{app.lastActivityDate || '—'}</span>
                )}
              </td>
              <td className="px-3 py-4">
                {app.isFollowUpOverdue ? (
                  <span className="inline-flex items-center font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-md text-[10px] border border-amber-200">
                    {app.followUpDueDate}
                  </span>
                ) : (
                  <span className="font-medium text-[11px]">{app.followUpDueDate ? `${app.followUpDueDate}` : '—'}</span>
                )}
              </td>
              <td className="px-3 py-4">
                {app.deadline ? (
                  <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                    app.isDeadlineOverdue ? 'bg-slate-100 text-slate-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {app.deadline}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 py-4 text-slate-600 italic leading-relaxed whitespace-normal break-words text-[11px]">
                {app.notes || '—'}
              </td>
              {/* Clean Single Dropdown Menu for Row Actions */}
              <td className="px-3 py-4 text-right">
                <div className="inline-block text-left relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                    className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-200 transition focus:outline-none"
                  >
                    Actions
                  </button>

                  {openMenuId === app.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 text-xs font-sans">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onViewDetails(app);
                          }}
                          className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium transition"
                        >
                          View Details
                        </button>

                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditApplication(app);
                          }}
                          className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium transition"
                        >
                          Edit
                        </button>

                        <div className="border-t border-slate-100 my-0.5" />

                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onDeleteApplication(app.id);
                          }}
                          className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
