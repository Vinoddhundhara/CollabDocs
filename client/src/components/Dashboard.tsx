import React, { useState, useMemo } from 'react';
import { DocumentSummary, TabFilter, ViewMode } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  FileText,
  Clock,
  MoreVertical,
  Share2,
  Trash2,
  Edit2,
  Upload,
  Plus,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

interface DashboardProps {
  documents: DocumentSummary[];
  loading: boolean;
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  onOpenDoc: (id: string) => void;
  onCreateNew: () => void;
  onOpenImport: () => void;
  onRenameDoc: (doc: DocumentSummary) => void;
  onShareDoc: (doc: DocumentSummary) => void;
  onDeleteDoc: (doc: DocumentSummary) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  loading,
  activeTab,
  onTabChange,
  onOpenDoc,
  onCreateNew,
  onOpenImport,
  onRenameDoc,
  onShareDoc,
  onDeleteDoc,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [actionMenuDocId, setActionMenuDocId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Tab filter
      if (activeTab === 'owned' && !doc.isOwner) return false;
      if (activeTab === 'shared' && doc.isOwner) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.owner.name.toLowerCase().includes(q) ||
          doc.owner.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, activeTab, searchQuery]);

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
          <ShieldCheck className="w-3 h-3 text-brand-600" />
          Owner
        </span>
      );
    }
    if (role === 'editor') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
          <Edit2 className="w-2.5 h-2.5 text-sky-600" />
          Editor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
        Viewer
      </span>
    );
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header with Greeting & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, collaborate, and manage your rich-text documents with real-time permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import File</span>
          </button>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Controls: Search, Filter Tabs, View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-200/80">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
          <button
            onClick={() => onTabChange('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            All Docs ({documents.length})
          </button>
          <button
            onClick={() => onTabChange('owned')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'owned'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Owned by Me ({documents.filter((d) => d.isOwner).length})
          </button>
          <button
            onClick={() => onTabChange('shared')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'shared'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Shared with Me ({documents.filter((d) => !d.isOwner).length})
          </button>
        </div>

        {/* Search & Layout Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-44 rounded-xl border border-slate-200 bg-white p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-20"></div>
                <div className="h-4 bg-slate-100 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDocs.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {searchQuery ? 'No documents match your search' : 'No documents found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? `No documents found matching "${searchQuery}". Try a different keyword.`
              : activeTab === 'shared'
              ? 'No documents have been shared with you yet. Ask a collaborator to invite your email!'
              : 'Get started by creating your first document or importing an existing Markdown or plain text file.'}
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Document</span>
            </button>
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import .md / .txt</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {!loading && filteredDocs.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onOpenDoc(doc.id)}
              className="group relative bg-white rounded-xl border border-slate-200/90 hover:border-brand-300 shadow-xs hover:shadow-md transition-all duration-150 p-5 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getRoleBadge(doc.userRole, doc.isOwner)}

                    {/* Context Menu Button */}
                    <div
                      className="relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuDocId(actionMenuDocId === doc.id ? null : doc.id);
                      }}
                    >
                      <button
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Document options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuDocId === doc.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuDocId(null);
                            }}
                          ></div>
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuDocId(null);
                                onOpenDoc(doc.id);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>Open</span>
                            </button>

                            {doc.isOwner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuDocId(null);
                                  onRenameDoc(doc);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Rename</span>
                              </button>
                            )}

                            {doc.isOwner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuDocId(null);
                                  onShareDoc(doc);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Share...</span>
                              </button>
                            )}

                            {doc.isOwner && (
                              <div className="border-t border-slate-100 my-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenuDocId(null);
                                    onDeleteDoc(doc);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-2 mt-1">
                  {doc.title}
                </h3>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: doc.owner.avatarColor || '#6366f1' }}
                    title={`Owner: ${doc.owner.name} (${doc.owner.email})`}
                  >
                    {doc.owner.name.charAt(0)}
                  </div>
                  <span className="truncate max-w-[110px]">
                    {doc.isOwner ? 'You' : doc.owner.name.split(' ')[0]}
                  </span>
                  {doc.collaboratorCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-slate-400" title={`${doc.collaboratorCount} collaborator(s)`}>
                      • <Users className="w-2.5 h-2.5" /> {doc.collaboratorCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(doc.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && filteredDocs.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Last Edited</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => onOpenDoc(doc.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-brand-600 transition-colors flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-brand-600 shrink-0" />
                    <span className="truncate max-w-sm">{doc.title}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: doc.owner.avatarColor || '#6366f1' }}
                      >
                        {doc.owner.name.charAt(0)}
                      </div>
                      <span>{doc.isOwner ? 'You (Owner)' : doc.owner.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getRoleBadge(doc.userRole, doc.isOwner)}</td>
                  <td className="py-3 px-4 text-slate-400">{formatRelativeTime(doc.updatedAt)}</td>
                  <td className="py-3 px-4 text-right">
                    <div
                      className="inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {doc.isOwner && (
                        <>
                          <button
                            onClick={() => onShareDoc(doc)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                            title="Share"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRenameDoc(doc)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteDoc(doc)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

