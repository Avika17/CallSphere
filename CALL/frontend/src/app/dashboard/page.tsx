'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Plus, Calendar, LogIn, Clipboard, Check, Clock, 
  Settings, Users, Shield, ArrowUpRight, BarChart2, CalendarDays,
  FileText, Activity, Trash2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { getUserHistory } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { generateMeetingCode, formatDate, extractMeetingCode } from '../../lib/utils';

export default function DashboardPage() {
  const { user, token, addMeetingToHistory } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledCode, setScheduledCode] = useState('');

  // Fetch recent meeting history
  const { data: meetings, isLoading, refetch } = useQuery({
    queryKey: ['meetingsHistory', token],
    queryFn: () => getUserHistory(token!),
    enabled: !!token,
  });

  const handleInstantMeeting = async () => {
    const code = generateMeetingCode();
    try {
      if (token) {
        await addMeetingToHistory(code);
      }
      showToast('Meeting room initialized', 'success');
      router.push(`/meeting/${code}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to initialize meeting', 'error');
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      showToast('Please enter a meeting code', 'warning');
      return;
    }
    const cleanCode = extractMeetingCode(joinCode);
    router.push(`/meeting/${cleanCode}`);
  };

  const handleScheduleMeeting = () => {
    const code = generateMeetingCode();
    setScheduledCode(code);
    setShowScheduleModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    showToast('Meeting link copied to clipboard', 'success');
    setTimeout(() => setCopiedLink(''), 3000);
  };

  // Simulated static stats for premium appearance
  const stats = [
    { label: "Total Sessions", value: meetings ? meetings.length : 0, change: "+12% vs last week", icon: BarChart2, color: "text-blue-500 bg-blue-500/10" },
    { label: "Connection Strength", value: "99.8%", change: "P2P WebRTC Signal", icon: Shield, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Active Members", value: meetings && meetings.length > 0 ? "4 Online" : "0 Active", change: "Standard Group", icon: Users, color: "text-indigo-500 bg-indigo-500/10" }
  ];

  // Timeline events for visual context
  const timelineEvents = [
    { title: "Workspace initialized", time: "Just now", type: "system" },
    { title: "Account verified", time: "2 hours ago", type: "auth" },
    { title: "Standard credentials loaded", time: "3 hours ago", type: "security" }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl">
      {/* Welcome & Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0b0f19] to-slate-950 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-30%] w-60 h-60 rounded-full bg-primary/10 blur-[90px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1.5 max-w-xl">
            Start a CallSphere conference, configure scheduled links, or inspect your past session history logs.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#030611] border border-white/10 px-3.5 py-1.5 rounded-2xl text-[11px] font-semibold text-accent w-fit z-10">
          <Shield className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>Secured Signaled Session</span>
        </div>
      </div>

      {/* Analytics / Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</span>
              <span className="text-xl font-extrabold text-white mt-1">{s.value}</span>
              <span className="text-[10px] text-gray-400 mt-1 leading-none font-medium">{s.change}</span>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Area (Actions + Recent meetings) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Quick Actions Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Start Instant */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-gradient-to-tr from-primary to-indigo-600 text-white p-6 rounded-3xl shadow-lg shadow-primary/10 flex flex-col justify-between h-48 relative overflow-hidden group cursor-pointer"
              onClick={handleInstantMeeting}
            >
              <div className="absolute right-[-10%] top-[-10%] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Instant Meeting</h3>
                <p className="text-[11px] text-white/80 mt-1 leading-normal">Start a video conference immediately and get an invitation link.</p>
              </div>
              <div className="flex items-center text-xs font-bold gap-1 mt-2 text-white group-hover:underline">
                Start Call <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Schedule Meeting */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-slate-950/40 border border-white/5 text-card-foreground p-6 rounded-3xl flex flex-col justify-between h-48 hover:border-white/10 transition-all cursor-pointer group"
              onClick={handleScheduleMeeting}
            >
              <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-primary">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Schedule Meeting</h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">Generate a unique meeting room code to schedule a link for later.</p>
              </div>
              <div className="flex items-center text-xs font-bold gap-1 mt-2 text-accent group-hover:underline">
                Create Code <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Join Form Card */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-slate-950/40 border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-48 hover:border-white/10 transition-all"
            >
              <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-accent">
                <LogIn className="w-5 h-5 text-indigo-400" />
              </div>
              <form onSubmit={handleJoinMeeting} className="flex flex-col gap-2.5">
                <input
                  type="text"
                  placeholder="Code (abc-defg-hij)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full text-white placeholder:text-gray-500"
                />
                <Button type="submit" size="sm" className="w-full h-8 text-[11px] font-bold">
                  Join Call
                </Button>
              </form>
            </motion.div>
          </div>

          {/* Recent History table */}
          <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="font-extrabold text-base text-white">Recent Sessions</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard/history')} 
                className="text-xs text-accent hover:underline p-0 h-auto"
              >
                View all logs
              </Button>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-white/5 border border-white/5 rounded-2xl animate-pulse flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                      <div className="flex flex-col gap-1.5">
                        <div className="w-20 h-2.5 bg-white/5 rounded" />
                        <div className="w-32 h-2 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : meetings && meetings.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {meetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting._id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Video className="w-4 h-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block text-gray-200 leading-none">{meeting.meetingCode}</span>
                        <span className="text-[10px] text-gray-500 block mt-1 leading-none">{formatDate(meeting.date)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5"
                        onClick={() => copyToClipboard(`${window.location.origin}/meeting/${meeting.meetingCode}`)}
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 h-8 text-[11px] font-bold rounded-xl border-white/10 hover:border-primary/50"
                        onClick={() => router.push(`/meeting/${meeting.meetingCode}`)}
                      >
                        Rejoin
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <Video className="w-8 h-8 text-gray-600" />
                <h4 className="font-semibold text-xs text-gray-300">No meeting sessions recorded</h4>
                <p className="text-[10px] text-gray-500 max-w-xs leading-normal">
                  Rooms you create or join will be logged here for quick retrieval.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Area (Calendar + Timeline + Quick settings) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Simulated Calendar Widget */}
          <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <CalendarDays className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider">Console Calendar</h3>
            </div>
            {/* Minimal calendar layout representation */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                <span>August 2026</span>
                <span className="text-[10px] text-gray-500">Today</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-500">
                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
                {/* Visual mock days */}
                <span className="text-gray-700">26</span>
                <span className="text-gray-700">27</span>
                <span className="text-gray-700">28</span>
                <span className="text-gray-700">29</span>
                <span className="text-gray-700">30</span>
                <span className="text-gray-700">31</span>
                <span className="text-white bg-primary rounded-lg font-bold p-0.5">1</span>
                <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider">Console Activity</h3>
            </div>
            <div className="flex flex-col gap-4">
              {timelineEvents.map((ev, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-gray-200 font-semibold">{ev.title}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{ev.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device configuration link card */}
          <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-200">Device Preferences</h4>
            <p className="text-[11px] text-gray-500 leading-normal">
              Adjust default camera blocks or mic permissions inside Settings console.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/settings')} 
              className="text-[11px] h-8 mt-1 border-white/10 hover:border-accent/40"
            >
              Configure preferences
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Link Modal Popup */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0f19] border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-5 text-white"
            >
              <div>
                <h3 className="font-extrabold text-lg">Meeting Scheduled!</h3>
                <p className="text-xs text-gray-400 mt-1">Copy and share this invitation code or direct link with your participants.</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Room Code</div>
                <div className="bg-slate-950 border border-white/5 p-3 rounded-xl font-mono text-xs flex items-center justify-between text-accent">
                  <span>{scheduledCode}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(scheduledCode)} className="p-1 h-7 w-7 hover:bg-white/5 rounded-lg">
                    <Clipboard className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Invitation Link</div>
                <div className="bg-slate-950 border border-white/5 p-3 rounded-xl font-mono text-[10px] flex items-center justify-between min-w-0 text-accent">
                  <span className="truncate pr-2">{`${window.location.origin}/meeting/${scheduledCode}`}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/meeting/${scheduledCode}`)} className="p-1 h-7 w-7 hover:bg-white/5 rounded-lg">
                    <Clipboard className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="h-10 text-xs font-bold px-4 border-white/10">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowScheduleModal(false);
                    router.push(`/meeting/${scheduledCode}`);
                  }}
                  className="h-10 text-xs font-bold px-4 shadow-lg shadow-primary/20"
                >
                  Join Room Now
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
