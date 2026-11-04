'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../providers/AuthProvider';
import { useToast } from '../../../providers/ToastProvider';
import { getUserHistory } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import { Video, Clipboard, Search, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: meetings, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['meetingsHistoryAll', token],
    queryFn: () => getUserHistory(token!),
    enabled: !!token,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Meeting link copied', 'success');
  };

  const filteredMeetings = meetings
    ? meetings.filter((m) => m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 md:hidden text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-black tracking-tight text-white">Session History</h1>
          </div>
          <p className="text-xs text-gray-400">Review and copy logs of all call sessions created or joined on your account.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="self-start sm:self-center gap-1.5 h-9 border-white/10 hover:border-accent/40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh History Log
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex bg-slate-950/40 border border-white/5 px-4 py-3 rounded-2xl items-center gap-2.5 max-w-md w-full">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by room code (e.g. abc-defg-hij)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-xs text-white focus:outline-none w-full placeholder:text-gray-500"
        />
      </div>

      {/* History log main body */}
      <div className="bg-slate-950/40 border border-white/5 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-white/5 border border-white/5 rounded-xl animate-pulse flex justify-between items-center px-4">
                <div className="w-1/3 h-4 bg-white/5 rounded" />
                <div className="w-1/4 h-3 bg-white/5 rounded" />
                <div className="w-20 h-7 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-rose-500 opacity-80" />
            <h3 className="font-extrabold text-base text-gray-200">Failed to load history</h3>
            <p className="text-xs text-gray-400 max-w-xs">An error occurred while fetching your meeting records from the database.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 mt-1">
              Try Again
            </Button>
          </div>
        ) : filteredMeetings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Room Code</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created At</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Direct Link</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-xs text-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Video className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="font-mono">{meeting.meetingCode}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[11px] text-gray-400">{formatDate(meeting.date)}</td>
                    <td className="p-4 font-mono text-[10px] text-accent max-w-[220px] truncate">
                      {`${window.location.origin}/meeting/${meeting.meetingCode}`}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/meeting/${meeting.meetingCode}`)}
                          className="p-1.5 h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5"
                          title="Copy direct invite link"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/meeting/${meeting.meetingCode}`)}
                          className="px-3 h-8 text-[11px] font-bold rounded-lg border-white/10 hover:border-primary/50"
                        >
                          Rejoin Call
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Video className="w-10 h-10 text-gray-600" />
            <h3 className="font-extrabold text-sm text-gray-300">No logs found</h3>
            <p className="text-[11px] text-gray-500 max-w-xs leading-normal">
              {searchQuery ? 'No calls match your room code search filter.' : 'Your history log is currently empty. Start a call from the console to record sessions.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
