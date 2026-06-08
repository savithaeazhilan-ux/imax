import React from "react";
import { Film, User as UserIcon, LogOut, LayoutDashboard, Calendar, ShieldCheck, Award } from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (view: 'home' | 'movies' | 'schedules' | 'dashboard' | 'admin') => void;
  activeView: 'home' | 'movies' | 'schedules' | 'dashboard' | 'admin';
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Header({
  currentUser,
  onNavigate,
  activeView,
  onOpenAuth,
  onLogout
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass-dark border-b border-white/10">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo Section */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex cursor-pointer items-center space-x-3 group"
          id="hdr-logo-container"
        >
          <div className="flex items-center justify-center rounded-lg bg-[var(--color-imax-blue)] p-1.5 shadow-[0_0_15px_rgba(0,153,255,0.4)] group-hover:scale-105 transition-transform duration-200">
            <Film className="h-5 w-5 text-black stroke-[2.5]" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            IMAX<span className="text-[var(--color-imax-cyan)] font-light">THEATRE</span>
          </span>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1" id="hdr-nav-menu">
          <button
            id="nav-btn-home"
            onClick={() => onNavigate('home')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              activeView === 'home'
                ? 'bg-white/10 text-[var(--color-imax-cyan)] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Home
          </button>
          <button
            id="nav-btn-movies"
            onClick={() => onNavigate('movies')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              activeView === 'movies'
                ? 'bg-white/10 text-[var(--color-imax-cyan)] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Movies
          </button>
          <button
            id="nav-btn-schedules"
            onClick={() => onNavigate('schedules')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              activeView === 'schedules'
                ? 'bg-white/10 text-[var(--color-imax-cyan)] shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Schedules
          </button>
          
          {currentUser && (
            <button
              id="nav-btn-dashboard"
              onClick={() => onNavigate('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                activeView === 'dashboard'
                  ? 'bg-white/10 text-[var(--color-imax-cyan)] shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              My Tickets
            </button>
          )}

          {currentUser?.isAdmin && (
            <button
              id="nav-btn-admin"
              onClick={() => onNavigate('admin')}
              className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-1.5 border border-red-500/30 transition-all duration-200 ${
                activeView === 'admin'
                  ? 'bg-red-500/20 text-red-400 shadow-sm shadow-red-500/10'
                  : 'text-red-400/80 hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Director Panel
            </button>
          )}
        </nav>

        {/* Right Side: Account Controls */}
        <div className="flex items-center space-x-3" id="hdr-auth-controls">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              {/* Rewards Points Pill */}
              <div 
                onClick={() => onNavigate('dashboard')}
                className="hidden sm:flex items-center space-x-1.5 cursor-pointer rounded-full bg-gradient-to-r from-amber-500/10 to-[var(--color-imax-gold)]/20 border border-[var(--color-imax-gold)]/40 px-3 py-1 font-mono hover:brightness-110 active:scale-95 transition-all text-xs text-[var(--color-imax-gold)]"
                title="Your IMAX Rewards Club Balance"
              >
                <Award className="h-3.5 w-3.5" />
                <span className="font-semibold">{currentUser.membershipPoints} PTS</span>
              </div>

              {/* User Dropdown / Nav Button */}
              <button
                id="hdr-user-dashboard-trigger"
                onClick={() => onNavigate('dashboard')}
                className="flex items-center space-x-2 text-sm font-medium text-white hover:text-[var(--color-imax-cyan)] transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700 hover:ring-cyan-500 duration-150">
                  <UserIcon className="h-4 w-4" />
                </div>
                <span className="hidden lg:inline-block max-w-[120px] truncate">{currentUser.name.split(' ')[0]}</span>
              </button>

              {/* Mobile Director Nav Indicator / Shortcut */}
              {currentUser.isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="md:hidden p-1.5 rounded-full text-red-400 hover:bg-red-550/10 transition-colors"
                  title="Director Panel"
                >
                  <ShieldCheck className="h-5 w-5" />
                </button>
              )}

              {/* Logout Button */}
              <button
                id="hdr-logout-btn"
                onClick={onLogout}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Log out of account"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="hdr-login-prompt-btn"
              onClick={onOpenAuth}
              className="flex items-center space-x-2 rounded-full bg-white px-4 py-1.5 text-xs sm:text-sm font-semibold text-black hover:bg-zinc-200 hover:scale-102 active:scale-98 cursor-pointer shadow-md transition-all duration-150"
            >
              <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Connect Profile</span>
            </button>
          )}

          {/* Simple Mobile Menu Trigger (if needed, or fallback for easy exploration since it is simple view layout structure) */}
          <div className="md:hidden flex items-center space-x-1 font-mono text-xs border border-zinc-800 rounded-lg px-2 py-1">
            <button
              onClick={() => onNavigate('movies')}
              className={`px-1 text-zinc-300 ${activeView === 'movies' ? 'text-[var(--color-imax-cyan)] font-bold' : ''}`}
            >
              MOVIES
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => onNavigate('schedules')}
              className={`px-1 text-zinc-300 ${activeView === 'schedules' ? 'text-[var(--color-imax-cyan)] font-bold' : ''}`}
            >
              TIMES
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
