import React from 'react';

const COLUMNS = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
];

export default function KanbanBoard({ 
  applications = [], 
  priorityRankings = [],
  onStatusChange, 
  onEditApplication, 
  onDeleteApplication,
  onViewDetails
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {COLUMNS.map((col) => {
        const colApps = applications.filter((app) => app.status === col.id);

        return (
          <div key={col.id} className="flex flex-col bg-slate-100/70 rounded-2xl p-5 border border-slate-200/90 w-full min-h-[460px]">
            {/* Column Header */}
            <div className="px-4 py-3 rounded-xl border border-slate-200 font-bold text-xs flex items-center justify-between mb-4 bg-white text-slate-800 shadow-xs">
              <span className="uppercase tracking-wider text-xs font-bold text-slate-700">{col.label}</span>
              <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-xs">
                {colApps.length}
              </span>
            </div>

            {/* Column Cards List (Vertical Scroll if cards exceed max height) */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-0.5 max-h-[620px]">
              {colApps.length === 0 ? (
                <div className="h-36 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-medium bg-white/40">
                  No applications
                </div>
              ) : (
                colApps.map((app) => {
                  const priorityItem = priorityRankings.find(
                    (p) => p.company.toLowerCase() === app.company.toLowerCase() && p.role.toLowerCase() === app.role.toLowerCase()
                  );

                  return (
                    <div
                      key={app.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        {/* Company & Rank Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{app.company}</h3>
                            <div className="text-xs font-semibold text-teal-700">{app.role}</div>
                          </div>
                          
                          {priorityItem && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 border border-teal-200 shadow-xs shrink-0">
                              #{priorityItem.rank} Rank
                            </span>
                          )}
                        </div>

                        {/* Metadata Details */}
                        <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                          <div className="text-slate-600">
                            User: <span className="font-semibold text-slate-800">{app.userName}</span>
                          </div>

                          {app.lastActivityDate && (
                            <div className="text-slate-500">
                              Activity: {app.lastActivityDate}
                            </div>
                          )}

                          {app.isFollowUpOverdue && (
                            <div className="text-amber-900 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs inline-block">
                              Overdue ({app.followUpDueDate})
                            </div>
                          )}

                          {app.deadline && (
                            <div className="text-emerald-900 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs inline-block">
                              Deadline: {app.deadline}
                            </div>
                          )}
                        </div>

                        {app.notes && (
                          <div className="text-xs text-slate-600 italic line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                            "{app.notes}"
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Full-Width Move Dropdown & Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <select
                          value={app.status}
                          onChange={(e) => onStatusChange(app.id, e.target.value)}
                          className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer text-slate-700"
                        >
                          <option value="saved">Move to Saved</option>
                          <option value="applied">Move to Applied</option>
                          <option value="interviewing">Move to Interviewing</option>
                          <option value="offer">Move to Offer</option>
                          <option value="rejected">Move to Rejected</option>
                        </select>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewDetails(app)}
                            className="px-3 py-1 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 transition"
                            title="View Details"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => onEditApplication(app)}
                            className="px-3 py-1 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 transition"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            className="px-3 py-1 hover:bg-slate-100 rounded-lg text-xs font-semibold text-rose-600 border border-slate-200 transition"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
