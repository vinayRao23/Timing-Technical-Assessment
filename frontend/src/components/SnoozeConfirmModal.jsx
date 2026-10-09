import React, { useState } from 'react';
import { X, Clock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function SnoozeConfirmModal({
  isOpen,
  onClose,
  application,
  selectedUserId,
  onSuccess
}) {
  const [snoozeDays, setSnoozeDays] = useState(7);
  const [proposal, setProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !application) return null;

  const handleRequestProposal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/assistant/tools/snoozeFollowUp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': selectedUserId || 'u1'
        },
        body: JSON.stringify({
          applicationId: application.id,
          days: Number(snoozeDays) || 7
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create snooze proposal');
      }

      const proposalData = await res.json();
      setProposal(proposalData);
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmProposal = async () => {
    if (!proposal || !proposal.proposalId) return;
    setIsConfirming(true);
    setError(null);
    try {
      const res = await fetch('/assistant/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': selectedUserId || 'u1'
        },
        body: JSON.stringify({
          proposalId: proposal.proposalId
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to confirm proposal');
      }

      const result = await res.json();
      if (onSuccess) {
        onSuccess(result.message || `Follow-up for ${application.company} snoozed successfully.`);
      }
      handleClose();
    } catch (err) {
      console.error('Error confirming proposal:', err);
      setError(err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setProposal(null);
    setError(null);
    setIsLoading(false);
    setIsConfirming(false);
    onClose();
  };

  const action = proposal?.proposedAction;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Light Header */}
        <div className="bg-slate-50 text-slate-900 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Assistant Action: Snooze Follow-up</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!proposal ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{application.company}</div>
                <div className="text-teal-700 font-semibold text-xs">{application.role}</div>
                <div className="text-slate-500 text-[11px]">
                  Current Status: <span className="font-bold uppercase text-slate-700">{application.status}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Snooze Duration (Days)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSnoozeDays(days)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        snoozeDays === days
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{days} Days
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={snoozeDays}
                  onChange={(e) => setSnoozeDays(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="Custom number of days..."
                />
              </div>

              <div className="bg-teal-50 border border-teal-200 text-teal-900 rounded-xl p-3 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Two-Phase Assistant Protocol:</span>
                  Clicking "Propose Snooze" creates an uncommitted proposal. No data will be modified until you confirm.
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestProposal}
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  {isLoading ? 'Creating Proposal...' : 'Propose Snooze'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Proposed Action Ready for User Approval
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {proposal.confirmationPrompt}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Proposal ID:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{proposal.proposalId}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block font-semibold">Current Activity Date</span>
                    <span className="font-bold text-slate-700">{action?.currentLastActivityDate || 'None'}</span>
                  </div>
                  <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-100">
                    <span className="text-teal-700 block font-semibold">Proposed Activity Date</span>
                    <span className="font-bold text-teal-900">{action?.proposedLastActivityDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-1 text-slate-400 text-xs font-semibold">
                  <span>Due: {action?.currentDueDate || 'Overdue'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-500" />
                  <span className="text-teal-700 font-bold">New Due: {action?.proposedNewDueDate}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProposal(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmProposal}
                  disabled={isConfirming}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isConfirming ? 'Applying Change...' : 'Confirm & Execute Snooze'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
