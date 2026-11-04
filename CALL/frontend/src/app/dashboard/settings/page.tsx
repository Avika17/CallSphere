'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import { useToast } from '../../../providers/ToastProvider';
import { Button } from '../../../components/ui/Button';
import { User, Shield, Volume2, Video, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, token, theme, toggleTheme } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [micDefaultOn, setMicDefaultOn] = useState(true);
  const [camDefaultOn, setCamDefaultOn] = useState(true);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const micSetting = localStorage.getItem('call_settings_mic') !== 'false';
    const camSetting = localStorage.getItem('call_settings_cam') !== 'false';
    setMicDefaultOn(micSetting);
    setCamDefaultOn(camSetting);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('call_settings_mic', micDefaultOn.toString());
    localStorage.setItem('call_settings_cam', camDefaultOn.toString());
    showToast('Preferences updated successfully', 'success', 'Saved!');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 md:hidden text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Settings & Profile</h1>
          <p className="text-xs text-gray-400 mt-1">Configure your personal preferences, device audio-video blocks, and view authentication details.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-slate-950/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary via-secondary to-accent flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-primary/20">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-none text-white">{user?.name}</h3>
            <span className="text-xs text-gray-500 mt-2 block">@{user?.username}</span>
          </div>
          <div className="w-full border-t border-white/5 pt-4 text-left flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">User Role</span>
              <span className="text-xs font-semibold mt-1 text-gray-300">Standard CallSphere Member</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">API Auth Token</span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono bg-slate-950 px-2 py-1.5 rounded-lg border border-white/5 truncate flex-1 text-accent">
                  {showToken ? token : '••••••••••••••••••••••••'}
                </span>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="text-xs font-bold text-accent hover:underline flex-shrink-0"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Configurations Card */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* General Call Prefs */}
          <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Video className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider">Meeting Defaults</h3>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Default Microphone State</h4>
                <p className="text-xs text-gray-400 mt-0.5">Start video conferences with your microphone enabled.</p>
              </div>
              <button
                onClick={() => setMicDefaultOn(!micDefaultOn)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  micDefaultOn ? 'bg-primary justify-end' : 'bg-white/10 justify-start'
                }`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow" />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Default Camera State</h4>
                <p className="text-xs text-gray-400 mt-0.5">Start video conferences with your camera turned on.</p>
              </div>
              <button
                onClick={() => setCamDefaultOn(!camDefaultOn)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  camDefaultOn ? 'bg-primary justify-end' : 'bg-white/10 justify-start'
                }`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow" />
              </button>
            </div>

            <Button onClick={handleSaveSettings} className="w-fit self-end text-xs h-9 mt-2">
              Save Device Prefs
            </Button>
          </div>

          {/* Theme card */}
          <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Sun className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider">Visual Customization</h3>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Dark / Light Interface</h4>
                <p className="text-xs text-gray-400 mt-0.5">Toggle between a slate light mode or glowing dark mode.</p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="h-9 gap-1.5 border-white/10 hover:border-accent/40 text-xs">
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-orange-400" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-400" />
                    Dark Mode
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
