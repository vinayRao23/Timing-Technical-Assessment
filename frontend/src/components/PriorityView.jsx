import React from 'react';

const STATUS_BADGES = {
  saved: 'bg-slate-100 text-slate-700 border-slate-200',
  applied: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
  interviewing: 'bg-teal-50 text-teal-800 border-teal-200 font-semibold',
  offer: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
  rejected: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function PriorityView({ 
  priorityRankings = [], 
  applications = [],
  onStatusChange, 
  onEditApplication, 
  onDeleteApplication,
  onGenerateFollowUp,
  onSnoozeFollowUp,
  onViewDetails
}) {
  if (!priorityRankings || priorityRankings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
        <p className="font-bold text-slate-800 text-base">No Open Applications to Rank</p>
        <p className="text-xs text-slate-400 mt-1">All applications are currently closed or none exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Explanatory Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-teal-700 font-bold text-xs uppercase tracking-wider mb-1">
            Application Priority Hierarchy
          </div>
          <h2 className="text-lg font-bold text-slate-900">Priority Queue</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Ranked from #1 down based on pending offer deadlines, active interview momentum, and overdue follow-up windows.
          </p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
          {priorityRankings.length} Ranked Items
        </div>
      </div>

      {/* Priority Cards List */}
      <div className="space-y-4">
        {priorityRankings.map((item) => {
          const appObj = applications.find(
            (a) => a.company.toLowerCase() === item.company.toLowerCase() && a.role.toLowerCase() === item.role.toLowerCase()
          );

          return (
            <div
              key={`${item.company}-${item.role}-${item.rank}`}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Side: Rank Badge, Company, Role & Rationale */}
              <div className="flex items-start gap-4 flex-1">
                {/* Clean Rank Badge */}
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-900 border border-teal-200/80 flex flex-col items-center justify-center font-bold shrink-0 shadow-xs">
                  <span className="text-[9px] uppercase tracking-wider text-teal-700 font-mono">Rank</span>
                  <span className="text-base leading-none text-teal-950 font-black">#{item.rank}</span>
                </div>

                {/* Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">{item.company}</h3>
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
                      {item.role}
                    </span>
                    <span className={`text-[11px] uppercase px-2.5 py-0.5 rounded-lg border ${STATUS_BADGES[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Priority Rationale Box */}
                  <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5">
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] mb-0.5">Priority Rationale:</span>
                      <span className="text-slate-600 leading-relaxed">{item.reason}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Clean Text-Only Action Buttons */}
              <div className="flex items-center justify-between md:justify-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 flex-wrap">
                {appObj && (
                  <>
                    <button
                      onClick={() => onViewDetails(appObj)}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition"
                      title="View Application Details"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => onGenerateFollowUp(appObj)}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition"
                      title="Generate Follow-up Draft"
                    >
                      Draft Message
                    </button>

                    {['applied', 'interviewing'].includes(appObj.status) && (
                      <button
                        onClick={() => onSnoozeFollowUp(appObj)}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
                        title="Snooze Follow-up"
                      >
                        Snooze
                      </button>
                    )}

                    <select
                      value={appObj.status}
                      onChange={(e) => onStatusChange(appObj.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-2 rounded-xl border cursor-pointer focus:outline-none ${STATUS_BADGES[appObj.status]}`}
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditApplication(appObj)}
                        className="px-2.5 py-2 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition border border-slate-200"
                        title="Edit Application"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteApplication(appObj.id)}
                        className="px-2.5 py-2 hover:bg-slate-100 rounded-xl text-xs font-semibold text-rose-600 transition border border-slate-200"
                        title="Delete Application"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
