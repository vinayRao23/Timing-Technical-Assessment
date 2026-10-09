import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';

export default function FollowUpGeneratorModal({
  isOpen,
  onClose,
  application,
  selectedUserId
}) {
  const [tone, setTone] = useState('warm');
  const [goal, setGoal] = useState('Ask about next steps after my first interview');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!application) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': selectedUserId || 'u1'
        },
        body: JSON.stringify({
          applicationId: application.id,
          tone,
          goal
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedMessage(data.message);
      }
    } catch (err) {
      console.error('Failed to generate follow-up:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && application) {
      handleGenerate();
    } else {
      setGeneratedMessage('');
    }
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Light Modal Header Matching Timing Theme */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between text-slate-900">
          <div className="font-bold text-sm">
            Generate Follow-up Message ({application.company})
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Message Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                <option value="warm">Warm & Friendly</option>
                <option value="professional">Formal & Professional</option>
                <option value="concise">Concise & Direct</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Goal / Objective</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Ask about next steps"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            {isGenerating ? 'Generating...' : 'Regenerate Follow-up Message'}
          </button>

          {/* Result Message Box */}
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Generated Draft:</span>
              {generatedMessage && (
                <button
                  onClick={handleCopy}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-700" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              )}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 text-xs leading-relaxed font-sans shadow-inner min-h-[100px]">
              {isGenerating ? (
                <span className="text-slate-400 italic">Crafting personalized message based on application data...</span>
              ) : generatedMessage ? (
                generatedMessage
              ) : (
                <span className="text-slate-400 italic">Click generate above.</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
