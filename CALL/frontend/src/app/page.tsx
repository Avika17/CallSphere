'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Shield, Keyboard, Users, ArrowRight, CheckCircle2, 
  MessageSquare, ScreenShare, Sparkles, Zap, Lock, HelpCircle, 
  ChevronDown, Star, Globe, ShieldAlert
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';
import { extractMeetingCode, generateMeetingCode } from '../lib/utils';

export default function LandingPage() {
  const [meetingCode, setMeetingCode] = useState('');
  const { isAuthenticated, addMeetingToHistory, token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) {
      showToast('Please enter a valid meeting code', 'warning');
      return;
    }
    const cleanCode = extractMeetingCode(meetingCode);
    router.push(`/meeting/${cleanCode}`);
  };

  const handleStartInstant = async () => {
    const code = generateMeetingCode();
    try {
      if (token) {
        await addMeetingToHistory(code);
      }
      showToast('Call session initialized', 'success');
      router.push(`/meeting/${code}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to initialize meeting', 'error');
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030611] text-white overflow-hidden relative selection:bg-primary selection:text-white">
      {/* Background glow graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[140px] pointer-events-none" />

      {/* Floating Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="fixed top-0 inset-x-0 h-20 border-b border-white/5 bg-[#030611]/70 backdrop-blur-md z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                CallSphere
              </span>
              <span className="text-[9px] text-gray-500 font-semibold tracking-wider uppercase leading-none">Connect. Collaborate. Create.</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Preview</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => router.push('/dashboard')} className="shadow-lg shadow-primary/20">
                Dashboard
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-semibold hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Button onClick={() => router.push('/auth')} className="shadow-lg shadow-primary/20">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 lg:pt-48 lg:pb-36 max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="lg:col-span-7 flex flex-col gap-6"
          >
            <motion.div 
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-accent text-xs font-semibold w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Next-Gen P2P Video Conferencing
            </motion.div>

            <motion.h1 
              variants={fadeIn}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]"
            >
              Enterprise meetings. <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-text">
                Designed for everyone.
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeIn}
              className="text-gray-400 text-base md:text-lg leading-relaxed max-w-xl"
            >
              CallSphere delivers crystal clear, ultra-low latency peer-to-peer audio/video streaming, rich chat interface, and fluid screen sharing directly in your browser. No downloads required.
            </motion.p>

            {/* Quick Actions (Join or Start) */}
            <motion.div variants={fadeIn} className="mt-4 flex flex-col sm:flex-row gap-4 max-w-xl">
              <form onSubmit={handleJoin} className="flex-1 bg-white/5 border border-white/10 p-2 rounded-2xl flex gap-2 backdrop-blur-md items-center">
                <div className="flex-1 flex items-center px-3 gap-2">
                  <Keyboard className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter room code..."
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="bg-transparent border-none text-white focus:outline-none w-full text-sm placeholder:text-gray-500"
                  />
                </div>
                <Button type="submit" size="sm" className="h-10">
                  Join Room
                </Button>
              </form>
              <div className="flex items-center justify-center">
                <span className="text-xs text-gray-500 font-bold px-2">OR</span>
              </div>
              <Button onClick={handleStartInstant} variant="outline" className="h-14 font-semibold px-6 border-white/10 hover:border-primary/50">
                <Video className="w-4 h-4 mr-2 text-primary" />
                Start Instant Call
              </Button>
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                WebRTC Secured Signals
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-500" />
                No Plugins/Apps Installed
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Discord-style Chat
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Ambient light glow behind mockup */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-3xl blur-2xl" />

            {/* Premium Meeting App Mockup */}
            <div className="w-full aspect-[4/3] rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl overflow-hidden shadow-2xl relative p-4 flex flex-col justify-between animate-float">
              {/* Top bar info */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CallSphere Room: secure-session</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg text-[9px] text-accent">
                  <Users className="w-3 h-3" /> 4 Active
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-2 gap-3 flex-1 mt-3">
                <div className="rounded-2xl bg-[#0b0f19] relative overflow-hidden flex items-center justify-center border border-white/5 group shadow-inner">
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[9px] font-bold">Sarah (Design Lead)</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg text-sm">S</div>
                  <div className="absolute bottom-2 right-2 w-5 h-5 rounded-md bg-[#050814] flex items-center justify-center text-[10px]">🎙️</div>
                </div>
                <div className="rounded-2xl bg-[#0b0f19] relative overflow-hidden flex items-center justify-center border border-white/5 group shadow-inner">
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[9px] font-bold">David (Tech Architect)</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#06b6d4] to-primary flex items-center justify-center font-bold text-white shadow-lg text-sm">D</div>
                  <div className="absolute bottom-2 right-2 w-5 h-5 rounded-md bg-red-500/20 flex items-center justify-center text-[10px] text-red-400 border border-red-500/20">🔇</div>
                </div>
                <div className="rounded-2xl bg-[#0b0f19] relative overflow-hidden flex items-center justify-center border border-white/5 group shadow-inner col-span-2">
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[9px] font-bold">Alex (You) - Screen Share active</div>
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 p-4">
                    <ScreenShare className="w-8 h-8 text-accent animate-pulse mb-1.5" />
                    <span className="text-[10px] text-gray-400">Sharing Figma Workspace...</span>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="h-12 border border-white/10 bg-[#030611]/90 rounded-2xl mt-3 px-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[11px] cursor-pointer">🎙️</div>
                  <div className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[11px] cursor-pointer">📷</div>
                  <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/20 flex items-center justify-center text-[11px] cursor-pointer">🖥️</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs cursor-pointer shadow-lg shadow-red-600/30">📞</div>
                <div className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[11px] cursor-pointer">💬</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature section */}
      <section id="features" className="py-24 border-t border-white/5 bg-[#030611]/60 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase mb-4">
              Premium Capabilities
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Everything you need to collaborate</h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Ditch the clunky enterprise downloads. CallSphere offers streamlined, responsive web meeting spaces with top-tier components.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex flex-col gap-5 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">WebRTC High Fidelity</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connect via direct peer-to-peer streams that automatically scale quality based on network congestion, keeping audio and video fluid.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex flex-col gap-5 hover:border-secondary/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Discord-Style Messaging</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Share files up to 20MB, add emoji reactions, edit/delete messages, write threaded replies, and view typing indicators right inside the call.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex flex-col gap-5 hover:border-accent/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <ScreenShare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Fluid Screen Sharing</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Broadcast your tabs, designs, or entire workspaces in high frame rate with a single toggle, optimized for developers and designers.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex flex-col gap-5 hover:border-indigo-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Secure Signals</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Signaling metadata is securely channeled over WebSockets, keeping your active connections private and direct without intermediaries.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex flex-col gap-5 hover:border-cyan-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Zero Friction Guest Access</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Generate dynamic codes and invite external clients. Guests can join meetings immediately with a display name without creating accounts.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex flex-col gap-5 hover:border-emerald-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Robust Console Dashboard</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Track recent meetings, review history logs, toggle audio/video defaults, copy invites, and manage standard profile settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview / Screenshot showcase section */}
      <section id="preview" className="py-24 bg-[#030611] relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-tr from-slate-950 to-[#0b0f19] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center gap-12">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex-1 flex flex-col gap-6">
              <div className="inline-flex items-center gap-1 bg-accent/15 border border-accent/25 text-accent text-[10px] font-bold uppercase px-3 py-1 rounded-md w-fit">
                Live Simulator
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Interactive Workspace</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Explore the clean layout designed for professional coordination. Move from full video grid focus to an integrated message drawer seamlessly on both desktop and mobile.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Active speaker auto-focus highlights
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Read receipts and message edit indicators
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Mobile optimized sliding drawers
                </div>
              </div>
              <Button onClick={() => router.push('/auth')} className="w-fit mt-2">
                Create Free Room
              </Button>
            </div>

            <div className="flex-1 w-full bg-slate-950 border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-500 font-mono ml-2">callsphere-app.tsx</span>
              </div>
              <div className="h-60 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center relative overflow-hidden">
                {/* Simulated WebRTC stream preview with audio wave animation */}
                <div className="flex flex-col items-center gap-2.5 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-md shadow-primary/20 relative">
                    <span className="absolute -inset-2 rounded-full border border-accent/40 animate-ping opacity-75" />
                    C
                  </div>
                  <h4 className="text-xs font-bold mt-2">Simulated Live Participant Stream</h4>
                  <div className="flex items-center gap-1 mt-1 justify-center">
                    {[1, 2, 3, 4, 5, 4, 3, 2, 4, 6, 2].map((height, i) => (
                      <span 
                        key={i} 
                        className="w-0.5 bg-accent rounded-full animate-pulse" 
                        style={{ 
                          height: `${height * 3}px`, 
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.8s'
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="py-24 border-t border-white/5 bg-[#030611]/60 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase mb-4">
              Pricing Options
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Simple, transparent tiers</h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Start hosting meetings for free or unlock enterprise configurations for teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-[#0b0f19]/70 border border-white/5 p-8 rounded-3xl flex flex-col justify-between relative group hover:border-white/10 transition-all">
              <div>
                <h3 className="text-lg font-bold text-gray-400">Basic / Guest</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-xs text-gray-500 font-bold">/ forever</span>
                </div>
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">Ideal for individuals hosting quick audio/video chats and sharing links instantly.</p>
                <div className="border-t border-white/5 my-6" />
                <ul className="flex flex-col gap-3.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited call length duration</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 10 active connections per call</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Discord-style chat and file uploads</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fluid 1080p Screen Sharing</li>
                </ul>
              </div>
              <Button onClick={() => router.push('/auth')} variant="outline" className="w-full mt-8 h-12">
                Join Free
              </Button>
            </div>

            {/* Pro Tier */}
            <div className="bg-slate-950/70 border border-primary/40 p-8 rounded-3xl flex flex-col justify-between relative group hover:border-primary/60 transition-all shadow-xl shadow-primary/5">
              <div className="absolute top-4 right-4 bg-primary text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Sphere Pro</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black">$12</span>
                  <span className="text-xs text-gray-500 font-bold">/ month</span>
                </div>
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">For professional developers, designers, and scaling remote teams.</p>
                <div className="border-t border-white/5 my-6" />
                <ul className="flex flex-col gap-3.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Everything in Basic Free tier</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Up to 100 active connections per room</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Advanced history logs and statistics</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Call custom styling & logo setups</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Priority server routing signals</li>
                </ul>
              </div>
              <Button onClick={() => router.push('/auth')} className="w-full mt-8 h-12 shadow-lg shadow-primary/20">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="py-24 bg-[#030611] relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-extrabold">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-xs md:text-sm mt-2">Have a question about CallSphere? Find answers below.</p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              {
                q: "Do guests need an account to join a CallSphere call?",
                a: "No, guests do not need to register. You can share your custom meeting code or direct link with anyone. They only need to type a display name in the waiting room to participate instantly."
              },
              {
                q: "Is the video call media encrypted and secure?",
                a: "Yes. CallSphere operates using WebRTC protocols. Your audio/video streams route directly peer-to-peer (P2P) between user browsers. The server only signals matching tokens and handles chat persistence."
              },
              {
                q: "What is the maximum limit for file attachment uploads?",
                a: "You can upload and share file attachments (images, PDFs, documents, logs) directly inside the call chat up to 20MB per file. Attachment history is securely stored per session room."
              },
              {
                q: "How does screen sharing work?",
                a: "CallSphere leverages native browser display APIs. With a single click on the screen share button, you can choose to broadcast a specific chrome tab, window, or your entire screen in high frame rate."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#0b0f19]/60 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/10 transition-colors"
                onClick={() => toggleFaq(idx)}
              >
                <div className="p-5 flex items-center justify-between font-bold text-sm select-none">
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4.5 h-4.5 text-gray-500 transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-white' : ''}`} />
                </div>
                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#030611] text-xs text-gray-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-md text-sm">
              C
            </div>
            <span className="font-extrabold text-sm text-white">CallSphere</span>
          </div>
          <div>
            © 2026 CallSphere. Built with Next.js 15, Socket.IO and WebRTC. All Rights Reserved.
          </div>
          <div className="flex gap-4 font-medium text-gray-600">
            <a href="#" className="hover:text-gray-400">Terms</a>
            <a href="#" className="hover:text-gray-400">Privacy</a>
            <a href="#" className="hover:text-gray-400">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
