'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-900/10 blur-[130px] pointer-events-none" />

      <div className="text-center flex flex-col items-center gap-6 max-w-md relative z-10">
        {/* Error icon wrapper */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-black tracking-tight text-white">404</h1>
          <h2 className="text-xl font-bold text-gray-200">Page Not Found</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            The page you are looking for doesn't exist, was moved, or the meeting room code is invalid.
          </p>
        </div>

        <div className="flex gap-4 mt-2 w-full">
          <Button
            variant="outline"
            className="flex-1 h-11 gap-1.5 font-bold"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full h-11 gap-1.5 font-bold">
              <Home className="w-4 h-4" />
              Console Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
