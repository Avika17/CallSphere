'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-900/10 blur-[130px] pointer-events-none" />

      <div className="text-center flex flex-col items-center gap-6 max-w-md relative z-10">
        {/* Error icon wrapper */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-200">Something went wrong!</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            An unexpected error occurred during operation. Please try refreshing the workspace component.
          </p>
          {error.message && (
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-xs text-red-400 font-mono mt-2 text-left break-all">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-2 w-full">
          <Button
            variant="outline"
            className="flex-1 h-11 gap-1.5 font-bold"
            onClick={() => reset()}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full h-11 gap-1.5 font-bold">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
