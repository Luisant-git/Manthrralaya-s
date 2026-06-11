import React from 'react';
import { Search, User, Bell, MessageSquare, LogOut } from 'lucide-react';

export default function Header({
  activeRole,
  currentUser,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onLogout,
  notificationsCount = 3,
  whatsappApiConnected = true
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
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Brand logo */}
      <div className="flex items-center space-x-3">
        <div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-800 font-outfit">
            Manthrralaya<span className="text-emerald-600">{"'s"}</span>
          </span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-lg mx-8">
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

      {/* Right Controls */}
      <div className="flex items-center space-x-6">
        {/* API Connected Status Badge */}
       

        {/* Notifications Icon */}
        <button className="relative text-slate-500 hover:text-emerald-600 transition-colors">
          <Bell className="w-6 h-6" />
          {notificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
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
