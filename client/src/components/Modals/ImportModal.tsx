import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DocumentDetail } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (doc: DocumentDetail) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [docTitle, setDocTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const validateAndReadFile = (selectedFile: File) => {
    setErrorMsg(null);

    // 1. Validate file extension (.txt, .md, .markdown)
    const validExtensions = ['.txt', '.md', '.markdown'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      setErrorMsg('Unsupported file type. Please upload a Markdown (.md) or Plain Text (.txt) file.');
      return;
    }

    // 2. Validate file size (<= 1MB)
    const maxSize = 1024 * 1024; // 1 MB
    if (selectedFile.size > maxSize) {
      setErrorMsg(`File size (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB) exceeds the 1 MB limit.`);
      return;
    }

    // 3. Read file safely as text
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setFile(selectedFile);
      setFileContent(content);

      // Extract default title from filename without extension
      const baseName = selectedFile.name.replace(/\.(txt|md|markdown)$/i, '');
      setDocTitle(baseName || 'Imported Document');
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file contents. Please try again.');
    };

    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndReadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndReadFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileContent) {
      setErrorMsg('Please select a file to import.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.documents.importFile(fileContent, file.name, docTitle.trim());
      if (res.success && res.document) {
        toast.success(`Successfully imported "${res.document.title}"`);
        onClose();
        onImportSuccess(res.document);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Import Document</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload existing Markdown or Plain Text documents
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50'
                : 'border-slate-200 hover:border-brand-300 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.markdown"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            {file ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-800">
                  Click to browse or drag and drop your file here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported formats: <strong>.md</strong>, <strong>.txt</strong> (Max 1 MB)
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Document Title Input */}
          {file && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document title"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{uploading ? 'Importing...' : 'Create & Open Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

