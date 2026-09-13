import React from 'react';
import { Search, User, MessageSquare, LogOut, Menu } from 'lucide-react';

export default function Header({
  activeRole,
  currentUser,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onLogout,
  whatsappApiConnected = true,
  isSidebarOpen,
  setIsSidebarOpen
}) {
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Prefer username when available, then fall back to full name or stored display name.
  const storedEmail = localStorage.getItem('user_email') || '';
  const usernameFromEmail = storedEmail.includes('@') ? storedEmail.split('@')[0] : (typeof currentUser === 'string' && currentUser.includes('@') ? currentUser.split('@')[0] : '');
  const usernameDisplay = currentUser?.username || currentUser?.user?.username || usernameFromEmail || '';
  const fullNameCandidate = currentUser?.fullName || currentUser?.name || localStorage.getItem('user_display_name') || '';
  const displayName = usernameDisplay || fullNameCandidate || (typeof currentUser === 'string' ? currentUser : '');

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-30 shadow-sm gap-4 md:gap-0">
      <div className="flex items-center justify-between">
        {/* Brand logo & Mobile Menu Toggle */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800 font-outfit">
              Manthrralaya<span className="text-emerald-600">{"'s"}</span>
            </span>
          </div>
        </div>

        {/* Right Controls - Mobile (also duplicated below for desktop, using flex ordering/display to manage) */}
        <div className="flex md:hidden items-center space-x-2">
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 border border-emerald-200">
              {getInitials(fullNameCandidate || displayName)}
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1 border border-transparent hover:border-rose-100"
              title="Secure Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg mx-0 md:mx-8 order-last md:order-none">
        <form onSubmit={onSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, ID or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              type="submit"
              className="absolute right-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-medium transition-colors"
            >
              Search
            </button>
          )}
        </form>
      </div>

      {/* Right Controls - Desktop */}
      <div className="hidden md:flex items-center space-x-6">
        {/* Profile Avatar */}
        <div className="flex items-center space-x-2 md:space-x-3 pl-2 md:pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 border border-emerald-200">
            {getInitials(fullNameCandidate || displayName)}
          </div>
          <div className="hidden md:block text-left mr-2">
            <span className="text-sm font-bold text-slate-800 block leading-tight">
              {displayName || 'Staff User'}
            </span>
            <span className="text-xs text-slate-500 block capitalize">{activeRole}</span>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-2 border border-transparent hover:border-rose-100"
            title="Secure Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
