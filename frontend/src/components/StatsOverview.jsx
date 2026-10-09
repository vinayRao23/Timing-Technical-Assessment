import React from 'react';

export default function StatsOverview({ stats, selectedUser }) {
  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Alert Banners if any overdue follow-ups or invalid dates exist */}
      {(stats.overdueFollowUps > 0 || stats.invalidDatesCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {stats.overdueFollowUps > 0 && (
            <div className="flex-1 bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between text-amber-950 shadow-xs w-full">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300/70 flex items-center justify-center text-amber-900 shrink-0 font-bold text-sm">
                  {stats.overdueFollowUps}
                </div>
                <div>
                  <span className="font-bold text-amber-950 text-sm block">
                    {stats.overdueFollowUps} Follow-up{stats.overdueFollowUps > 1 ? 's' : ''} Overdue
                  </span>
                  <span className="text-amber-800 text-xs mt-0.5 block">
                    Applications in {selectedUser?.name || 'your'} pipeline need follow-up based on {selectedUser?.timezone || 'user'} time.
                  </span>
                </div>
              </div>
            </div>
          )}

          {stats.invalidDatesCount > 0 && (
            <div className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-slate-800 shadow-xs w-full">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 font-bold text-sm">
                  {stats.invalidDatesCount}
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {stats.invalidDatesCount} Invalid Date String Detected
                  </span>
                  <span className="text-slate-600 text-xs mt-0.5 block">
                    Stored safely in database without crashing operations.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Integrated Summary Card (Replaces repetitive 5 1 1 1 1 1 list boxes) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        {/* Left: Total Summary Block */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/80 flex flex-col items-center justify-center font-bold text-teal-900 shadow-xs">
            <span className="text-xl leading-none font-black text-teal-950">{stats.total}</span>
            <span className="text-[9px] uppercase font-mono text-teal-700 tracking-wider">Total</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Application Pipeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">Active career opportunities and follow-up tracking</p>
          </div>
        </div>

        {/* Right: Clean Status Badges Bar */}
        <div className="flex items-center flex-wrap gap-2.5 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium text-slate-700">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Saved</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">{stats.saved}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium text-slate-700">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Applied</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">{stats.applied}</span>
          </div>

          <div className="bg-teal-50/70 border border-teal-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium text-teal-900">
            <span className="text-teal-700 font-bold uppercase text-[10px] tracking-wider">Interviewing</span>
            <span className="font-bold text-teal-950 bg-white px-2 py-0.5 rounded-md border border-teal-200">{stats.interviewing}</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium text-emerald-900">
            <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-wider">Offer</span>
            <span className="font-bold text-emerald-950 bg-white px-2 py-0.5 rounded-md border border-emerald-200">{stats.offer}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium text-slate-500">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Rejected</span>
            <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">{stats.rejected}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
