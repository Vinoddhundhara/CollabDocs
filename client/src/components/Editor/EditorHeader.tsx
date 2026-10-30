import React, { useState } from 'react';
import { DocumentDetail, SaveStatus } from '../../types';
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Share2,
  Download,
  Save,
  ShieldCheck,
  Edit3,
  Eye,
  FileCode,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';

interface EditorHeaderProps {
  document: DocumentDetail;
  saveStatus: SaveStatus;
  onBack: () => void;
  onTitleChange: (newTitle: string) => void;
  onManualSave: () => void;
  onOpenShare: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  document,
  saveStatus,
  onBack,
  onTitleChange,
  onManualSave,
  onOpenShare,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(document.title);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput.trim() !== document.title) {
      onTitleChange(titleInput.trim());
    } else {
      setTitleInput(document.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleInput(document.title);
      setIsEditingTitle(false);
    }
  };

  const isViewer = document.userRole === 'viewer';

  const downloadFile = (format: 'md' | 'txt' | 'json') => {
    const url = api.documents.getExportUrl(document.id, format);
    const a = window.document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = `${document.title}.${format}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    setShowExportMenu(false);
  };

  return (
    <header className="sticky top-[57px] z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Back button, Title, Save Status */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Inline Editable Title */}
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {isEditingTitle && !isViewer ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full text-base sm:text-lg font-bold text-slate-900 bg-brand-50/50 border border-brand-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                maxLength={200}
              />
            ) : (
              <h2
                onClick={() => {
                  if (!isViewer) {
                    setTitleInput(document.title);
                    setIsEditingTitle(true);
                  }
                }}
                className={`text-base sm:text-lg font-bold text-slate-900 truncate px-2 py-0.5 rounded-md transition-colors ${
                  !isViewer
                    ? 'hover:bg-slate-100/80 cursor-text'
                    : 'cursor-default'
                }`}
                title={!isViewer ? 'Click to rename' : document.title}
              >
                {document.title}
              </h2>
            )}

            {/* Role Badge */}
            {document.isOwner ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/50 shrink-0">
                <ShieldCheck className="w-3 h-3 text-brand-600" />
                Owner
              </span>
            ) : document.userRole === 'editor' ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/50 shrink-0">
                <Edit3 className="w-3 h-3 text-sky-600" />
                Editor
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 shrink-0">
                <Eye className="w-3 h-3 text-amber-700" />
                Viewer (Read Only)
              </span>
            )}
          </div>

          {/* Save Status Indicator */}
          <div className="shrink-0 flex items-center gap-1.5 text-xs">
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 text-brand-600 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="hidden sm:inline">Unsaved changes</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={onManualSave}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium text-xs transition-colors"
                title="Save failed. Click to retry."
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Retry Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Collaborator Avatars, Share, Export, Manual Save */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Collaborator Avatars */}
          <div className="flex items-center -space-x-1.5 mr-1">
            <div
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
              style={{ backgroundColor: document.owner.avatarColor || '#6366f1' }}
              title={`Owner: ${document.owner.name}`}
            >
              {document.owner.name.charAt(0)}
            </div>
            {document.collaborators?.map((c) => (
              <div
                key={c.user.id}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: c.user.avatarColor || '#0284c7' }}
                title={`${c.user.name} (${c.role})`}
              >
                {c.user.name.charAt(0)}
              </div>
            ))}
          </div>

          {/* Share Button (Owner Only) */}
          {document.isOwner && (
            <button
              onClick={onOpenShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-300 bg-white hover:bg-brand-50/50 text-slate-700 hover:text-brand-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Share</span>
            </button>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowExportMenu(false)}
                ></div>
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Export Format
                  </div>
                  <button
                    onClick={() => downloadFile('md')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    <div>
                      <p className="font-medium">Markdown (.md)</p>
                      <p className="text-[10px] text-slate-400">Headings & formatted lists</p>
                    </div>
                  </button>
                  <button
                    onClick={() => downloadFile('txt')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <p className="font-medium">Plain Text (.txt)</p>
                      <p className="text-[10px] text-slate-400">Raw unformatted text</p>
                    </div>
                  </button>
                  <button
                    onClick={() => downloadFile('json')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <p className="font-medium">TipTap JSON (.json)</p>
                      <p className="text-[10px] text-slate-400">Full structured AST</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Manual Save Button (Only if editor or owner) */}
          {!isViewer && (
            <button
              onClick={onManualSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Save document now (or use Ctrl/Cmd+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

