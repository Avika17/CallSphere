'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-900/10 blur-[130px] pointer-events-none" />

      <div className="flex flex-col items-center gap-4 relative z-10">
        {/* Loading Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <span className="text-sm font-semibold text-gray-400 tracking-wide">Loading workspace...</span>
      </div>
    </div>
  );
}
