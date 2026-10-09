import React from 'react';
import { Plus } from 'lucide-react';

export default function Navbar({
  onOpenAddModal
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-10 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 shadow-md shadow-teal-500/15 flex items-center justify-center text-white">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 9V4" />
              <circle cx="12" cy="3" r="1.5" />
              <path d="M14.5 13.5L19 16" />
              <circle cx="20" cy="17" r="1.5" />
              <path d="M9.5 13.5L5 16" />
              <circle cx="4" cy="17" r="1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Timing</h1>
            <p className="text-xs text-slate-500 font-medium">Job Application & Relationship Assistant</p>
          </div>
        </div>

        {/* Header Right: New Application Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>
    </header>
  );
}
