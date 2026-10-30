import React from 'react';
import { TabFilter, DocumentSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { Plus, Upload, Folder, UserCheck, Users, FileText, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  onCreateNew: () => void;
  onOpenImport: () => void;
  recentDocs: DocumentSummary[];
  onOpenDoc: (id: string) => void;
  activeDocId?: string;
  totalCounts: {
    all: number;
    owned: number;
    shared: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onCreateNew,
  onOpenImport,
  recentDocs,
  onOpenDoc,
  activeDocId,
  totalCounts,
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'all' as TabFilter, label: 'All Documents', icon: Folder, count: totalCounts.all },
    { id: 'owned' as TabFilter, label: 'My Documents', icon: UserCheck, count: totalCounts.owned },
    { id: 'shared' as TabFilter, label: 'Shared with Me', icon: Users, count: totalCounts.shared },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col h-[calc(100vh-57px)] sticky top-[57px] shrink-0 select-none">
      {/* Action Buttons */}
      <div className="p-4 space-y-2 border-b border-slate-100">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Document</span>
        </button>

        <button
          onClick={onOpenImport}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          title="Upload .md or .txt file (max 1MB)"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>Import .md / .txt</span>
        </button>
      </div>

      {/* Navigation Filter Links */}
      <div className="p-3">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Workspace
        </p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-brand-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-brand-100 text-brand-700 font-bold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Recent Documents Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-slate-100">
        <div className="flex items-center justify-between px-3 mb-1.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Recent Docs
          </p>
        </div>

        {recentDocs.length === 0 ? (
          <p className="px-3 py-3 text-xs text-slate-400 italic">No recent documents</p>
        ) : (
          <div className="space-y-0.5">
            {recentDocs.slice(0, 6).map((doc) => {
              const isSelected = doc.id === activeDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => onOpenDoc(doc.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors group ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={doc.title}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-brand-600 transition-colors" />
                    <span className="truncate">{doc.title}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User profile footer */}
      {user && (
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
              style={{ backgroundColor: user.avatarColor || '#7c3aed' }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

