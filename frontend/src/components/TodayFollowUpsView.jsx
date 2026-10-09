import React from 'react';

export default function TodayFollowUpsView({
  followUps = [],
  selectedUser,
  onSnoozeClick,
  onGenerateClick
}) {
  if (!followUps || followUps.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs flex flex-col items-center justify-center space-y-2">
        <h3 className="font-bold text-slate-900 text-base">All Follow-ups Up to Date</h3>
        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
          {selectedUser 
            ? `No applications are currently due for follow-up today for ${selectedUser.name} (${selectedUser.timezone}).` 
            : 'No applications currently need a follow-up today.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">
            Action Required Today
          </div>
          <h2 className="text-lg font-bold text-slate-900">Follow-ups Due Today</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Applications in applied or interviewing status that have reached their follow-up date based on {selectedUser?.timezone || 'user'} timezone.
          </p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 border border-slate-200">
          {followUps.length} Application{followUps.length > 1 ? 's' : ''} Due
        </div>
      </div>

      {/* Due Follow-up Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {followUps.map((item) => {
          const isOverdue = item.daysOverdue > 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.company}</h3>
                    <div className="text-xs font-semibold text-teal-700">{item.role}</div>
                  </div>
                  <span className="text-[11px] font-semibold uppercase px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-800 border-slate-300">
                    {item.status}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Due Date: <strong className="text-slate-900">{item.dueDate}</strong></span>
                    {isOverdue ? (
                      <span className="font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
                        {item.daysOverdue} day{item.daysOverdue > 1 ? 's' : ''} overdue
                      </span>
                    ) : (
                      <span className="font-bold text-teal-900 bg-teal-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
                        Due Today
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 text-[11px] pt-2 border-t border-slate-200/60 leading-relaxed">
                    <span className="font-bold text-slate-900">Reason: </span>
                    {item.reason}
                  </div>
                </div>
              </div>

              {/* Text-Only Clean Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onGenerateClick(item)}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition"
                >
                  Draft Message
                </button>

                <button
                  onClick={() => onSnoozeClick(item)}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
                >
                  Snooze
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
