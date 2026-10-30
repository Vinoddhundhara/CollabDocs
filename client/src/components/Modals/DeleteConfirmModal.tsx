import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { DocumentSummary } from '../../types';

interface DeleteConfirmModalProps {
  document: DocumentSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  document,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !document) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm(document.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-base">Delete Document</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete <strong>"{document.title}"</strong>?
          </p>
          <p className="text-xs text-slate-500 bg-rose-50/60 p-3 rounded-lg border border-rose-100">
            This action is permanent and will remove the document for you and any collaborators you have shared it with.
          </p>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

