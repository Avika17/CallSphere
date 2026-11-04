'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, History, Settings, X, Shield, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Meeting Console',
      href: '/dashboard',
      icon: Video,
    },
    {
      name: 'Meeting History',
      href: '/dashboard/history',
      icon: History,
    },
    {
      name: 'User Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm transition-all"
        />
      )}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 w-64 border-r border-white/5 bg-[#050814]/90 md:bg-transparent p-4 flex flex-col justify-between transition-transform duration-300 z-50 md:z-auto h-[calc(100vh-4rem)] md:translate-x-0 backdrop-blur-md md:backdrop-blur-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between md:hidden pb-2 border-b border-white/5">
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">Navigation</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded-lg text-gray-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all group border',
                    isActive
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10'
                      : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/5'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-115',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom card info */}
        <div className="p-4.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-accent text-xs font-bold">
            <HelpCircle className="w-4 h-4 text-accent" /> Need help?
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
            Invite colleagues by sharing the unique room code inside the call. Keep it secure and direct.
          </p>
        </div>
      </aside>
    </>
  );
}
