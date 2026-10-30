import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, LogOut, Check, ArrowRightLeft, Database } from 'lucide-react';

interface NavbarProps {
  onGoHome?: () => void;
  documentTitle?: string;
  isEditorPage?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome, documentTitle, isEditorPage }) => {
  const { user, demoAccounts, loginAsDemoUser, logout, isBackendConnected } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
            title="CollabDocs Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:shadow transition-all">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-900 tracking-tight text-base group-hover:text-brand-600 transition-colors">
                CollabDocs
              </span>
            </div>
          </button>

          {isEditorPage && documentTitle && (
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span className="text-slate-300">/</span>
              <span className="truncate max-w-xs text-slate-700 font-medium">{documentTitle}</span>
            </div>
          )}
        </div>

        {/* Center: Backend Connectivity Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600">
          <Database className="w-3 h-3 text-slate-400" />
          <span>MongoDB:</span>
          {isBackendConnected === true && (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Atlas Connected
            </span>
          )}
          {isBackendConnected === false && (
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Disconnected
            </span>
          )}
          {isBackendConnected === null && (
            <span className="text-slate-400">Checking...</span>
          )}
        </div>

        {/* Right: Demo User Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                title="Switch demo account to test role permissions"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: user.avatarColor || '#7c3aed' }}
                >
                  {getInitials(user.name)}
                </div>
                <span className="font-semibold text-slate-900 hidden sm:inline">{user.name}</span>
                <span className="text-slate-400 text-[11px] hidden md:inline">({user.email.split('@')[0]})</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Demo Account Switcher Dropdown */}
              {showSwitchMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSwitchMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Reviewer: Switch Demo Account
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Test owner vs viewer/editor permissions:
                      </p>
                    </div>

                    <div className="py-1">
                      {demoAccounts.map((account) => {
                        const isCurrent = user.email === account.email;
                        return (
                          <button
                            key={account.id}
                            onClick={() => {
                              loginAsDemoUser(account.email);
                              setShowSwitchMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors hover:bg-slate-50 ${
                              isCurrent ? 'bg-brand-50/60 font-semibold text-brand-900' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                                style={{ backgroundColor: account.avatarColor }}
                              >
                                {getInitials(account.name)}
                              </div>
                              <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-[10px] text-slate-400">{account.email}</p>
                              </div>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-brand-600" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-100 mt-1 pt-1 px-1">
                      <button
                        onClick={() => {
                          setShowSwitchMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

