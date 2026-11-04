'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { Button } from '../../components/ui/Button';
import { Video, Eye, EyeOff, Sparkles, Check, Shield, Users, ScreenShare } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Validation Schemas
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, loading } = useAuth();
  const { showToast } = useToast();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignupForm,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.username, data.password);
      showToast('Logged in successfully', 'success', 'Welcome back!');
    } catch (error: any) {
      showToast(error.message || 'Incorrect username or password', 'error', 'Login Failed');
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      await register(data.name, data.username, data.password);
      showToast('Account created and logged in', 'success', 'Success!');
    } catch (error: any) {
      showToast(error.message || 'Username might be taken', 'error', 'Registration Failed');
    }
  };

  const toggleTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setShowPassword(false);
    resetLoginForm();
    resetSignupForm();
  };

  return (
    <div className="min-h-screen bg-[#030611] flex text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      {/* Left Column: Splash Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#050814] to-[#0b0f19] border-r border-white/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle grid mask */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        {/* Top brand header */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            CallSphere
          </span>
        </Link>

        {/* Central Graphic / Content */}
        <div className="my-auto flex flex-col gap-8 max-w-lg relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-accent text-xs font-semibold uppercase w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Premium Meeting Console
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Connect. Collaborate. Create.
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Experience the next-generation video conferencing tool. Join dynamic rooms, chat with Discord-style mechanics, and collaborate with your teammates instantly.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-col gap-4 mt-4">
            {[
              { icon: Shield, title: "WebRTC Peer-to-Peer Encryption", desc: "No middle-man server logs. Direct media channels." },
              { icon: Users, title: "Collaborative Classrooms", desc: "Manage members, audio, video toggles, and screen shares." },
              { icon: ScreenShare, title: "Real-time Workspace Sharing", desc: "Showcase mockups, slide decks, or live development screens." }
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary flex-shrink-0">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-200">{f.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-gray-600 relative z-10">
          © 2026 CallSphere. Powered by WebRTC and Socket.IO.
        </div>
      </div>

      {/* Right Column: Auth Forms (Split Screen / Full Screen mobile) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10">
        {/* Brand header for mobile */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-lg shadow-md shadow-primary/20">
            C
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            CallSphere
          </span>
        </Link>

        {/* Glassmorphic Form Card */}
        <div className="w-full max-w-md bg-slate-950/40 border border-white/10 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl relative">
          {/* Tabs header */}
          <div className="flex border-b border-white/5 mb-8 p-1 bg-white/5 rounded-2xl">
            <button
              onClick={() => toggleTab('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-primary text-white shadow-lg shadow-primary/15'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => toggleTab('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-primary text-white shadow-lg shadow-primary/15'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLoginSubmit(onLoginSubmit)}
                className="flex flex-col gap-6"
              >
                <div className="text-center mb-1">
                  <h2 className="text-2xl font-black leading-none">Welcome Back</h2>
                  <p className="text-xs text-gray-400 mt-2">Sign in to manage your meeting configurations.</p>
                </div>

                {/* Username Input with Floating Label style */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-gray-300">Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    disabled={loading}
                    {...registerLogin('username')}
                    className={`h-11 bg-white/5 border px-3 rounded-xl text-xs focus:outline-none transition-all ${
                      loginErrors.username ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {loginErrors.username && (
                    <span className="text-[10px] font-bold text-red-400 mt-1">{loginErrors.username.message}</span>
                  )}
                </div>

                {/* Password Input with Visibility Toggle */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-gray-300">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      disabled={loading}
                      {...registerLogin('password')}
                      className={`h-11 w-full bg-white/5 border pl-3 pr-10 rounded-xl text-xs focus:outline-none transition-all ${
                        loginErrors.password ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <span className="text-[10px] font-bold text-red-400 mt-1">{loginErrors.password.message}</span>
                  )}
                </div>

                <Button type="submit" isLoading={loading} className="w-full h-11 mt-2 shadow-lg shadow-primary/20 font-bold">
                  Sign In
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSignupSubmit(onRegisterSubmit)}
                className="flex flex-col gap-6"
              >
                <div className="text-center mb-1">
                  <h2 className="text-2xl font-black leading-none">Get Started</h2>
                  <p className="text-xs text-gray-400 mt-2">Create a secure console profile to track meetings.</p>
                </div>

                {/* Display Name Input */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-gray-300">Display Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    disabled={loading}
                    {...registerSignup('name')}
                    className={`h-11 bg-white/5 border px-3 rounded-xl text-xs focus:outline-none transition-all ${
                      signupErrors.name ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {signupErrors.name && (
                    <span className="text-[10px] font-bold text-red-400 mt-1">{signupErrors.name.message}</span>
                  )}
                </div>

                {/* Username Input */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-gray-300">Username</label>
                  <input
                    type="text"
                    placeholder="Choose a unique username"
                    disabled={loading}
                    {...registerSignup('username')}
                    className={`h-11 bg-white/5 border px-3 rounded-xl text-xs focus:outline-none transition-all ${
                      signupErrors.username ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  {signupErrors.username && (
                    <span className="text-[10px] font-bold text-red-400 mt-1">{signupErrors.username.message}</span>
                  )}
                </div>

                {/* Password Input with Visibility Toggle */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-gray-300">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Choose a strong password"
                      disabled={loading}
                      {...registerSignup('password')}
                      className={`h-11 w-full bg-white/5 border pl-3 pr-10 rounded-xl text-xs focus:outline-none transition-all ${
                        signupErrors.password ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupErrors.password && (
                    <span className="text-[10px] font-bold text-red-400 mt-1">{signupErrors.password.message}</span>
                  )}
                </div>

                <Button type="submit" isLoading={loading} className="w-full h-11 mt-2 shadow-lg shadow-primary/20 font-bold">
                  Register Account
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
