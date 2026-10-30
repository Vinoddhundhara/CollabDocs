import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, LogIn, ArrowRight, UserCheck } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, loginAsDemoUser, demoAccounts } = useAuth();
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to CollabDocs</h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Lightweight, rich-text collaborative document editor with role-based access control.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 space-y-6">
          {/* Reviewer 1-Click Fast Login Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Reviewer Quick Sign-In
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Click an account below to sign in instantly with seeded demo credentials:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => loginAsDemoUser(account.email)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: account.avatarColor }}
                    >
                      {account.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                        {account.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{account.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
                Or sign in manually
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

