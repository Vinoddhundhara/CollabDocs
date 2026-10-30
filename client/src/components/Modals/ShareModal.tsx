import React, { useState, useEffect } from 'react';
import { DocumentDetail, Collaborator } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { X, UserPlus, Trash2, ShieldCheck, Edit3, Eye, AlertCircle } from 'lucide-react';

interface ShareModalProps {
  document: DocumentDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onCollaboratorsUpdated: (newCollaborators: Collaborator[]) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  document,
  isOpen,
  onClose,
  onCollaboratorsUpdated,
}) => {
  const { user, demoAccounts } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [submitting, setSubmitting] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    if (document) {
      setCollaborators(document.collaborators || []);
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const isOwner = document.isOwner;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.documents.share(document.id, email.trim(), role);
      if (res.success) {
        setCollaborators(res.collaborators);
        onCollaboratorsUpdated(res.collaborators);
        toast.success(`Shared with ${email} as ${role}`);
        setEmail('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to share document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (collaboratorId: string, collaboratorName: string) => {
    try {
      const res = await api.documents.removeCollaborator(document.id, collaboratorId);
      if (res.success) {
        setCollaborators(res.collaborators);
        onCollaboratorsUpdated(res.collaborators);
        toast.success(`Removed ${collaboratorName} from collaborators`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove collaborator');
    }
  };

  // Filter demo accounts to show those not yet collaborators and not current user
  const availableDemoAccounts = demoAccounts.filter((acc) => {
    if (acc.email.toLowerCase() === user?.email.toLowerCase()) return false;
    return !collaborators.some((c) => c.user.email.toLowerCase() === acc.email.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Share Document</h3>
            <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">{document.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form to Add Collaborator (Owner only) */}
        {isOwner ? (
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <form onSubmit={handleShare} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Invite Collaborator by Email
              </label>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
                  required
                />

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                  className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700 font-medium"
                >
                  <option value="viewer">Viewer (Read Only)</option>
                  <option value="editor">Editor (Can Edit)</option>
                </select>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Adding...' : 'Invite'}</span>
                </button>
              </div>

              {/* Demo Account Quick Suggestions */}
              {availableDemoAccounts.length > 0 && (
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">Quick invite:</span>
                  {availableDemoAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setEmail(acc.email)}
                      className="px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 hover:border-brand-300 text-slate-600 hover:text-brand-700 transition-colors"
                    >
                      +{acc.name.split(' ')[0]} ({acc.email})
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/70 border-b border-amber-200/50 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Only the document owner can invite new collaborators or change permissions.</span>
          </div>
        )}

        {/* Collaborators List */}
        <div className="p-6 max-h-64 overflow-y-auto space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Who has access
          </p>

          {/* Owner Entry */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: document.owner.avatarColor || '#6366f1' }}
              >
                {document.owner.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {document.owner.name} {document.isOwner && '(You)'}
                </p>
                <p className="text-[11px] text-slate-500">{document.owner.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
              <ShieldCheck className="w-3 h-3 text-brand-600" />
              Owner
            </span>
          </div>

          {/* Collaborators */}
          {collaborators.map((c) => (
            <div key={c.user.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: c.user.avatarColor || '#0284c7' }}
                >
                  {c.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{c.user.name}</p>
                  <p className="text-[11px] text-slate-500">{c.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {c.role === 'editor' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                    <Edit3 className="w-2.5 h-2.5 text-sky-600" />
                    Editor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                    <Eye className="w-2.5 h-2.5 text-amber-600" />
                    Viewer
                  </span>
                )}

                {isOwner && (
                  <button
                    onClick={() => handleRemove(c.user.id, c.user.name)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Remove access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {collaborators.length === 0 && (
            <p className="text-xs text-slate-400 italic py-2">
              No collaborators yet. Only the owner has access.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

