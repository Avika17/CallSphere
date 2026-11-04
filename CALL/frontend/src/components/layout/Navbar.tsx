'use client';

import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { LogOut, Sun, Moon, User as UserIcon, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout, theme, toggleTheme } = useAuth();

  return (
    <nav className="h-16 border-b border-border bg-card text-card-foreground px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-secondary rounded-lg md:hidden transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary/20">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent hidden sm:inline-block">
            CallSphere
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2 h-9 w-9 rounded-lg"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-orange-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500" />
          )}
        </Button>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold leading-none">{user.name}</span>
              <span className="text-xs text-muted-foreground mt-0.5">@{user.username}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.name.charAt(0)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-2 h-9 w-9 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
