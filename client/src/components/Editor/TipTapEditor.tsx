import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { DocumentDetail, SaveStatus } from '../../types';
import { EditorHeader } from './EditorHeader';
import { EditorToolbar } from './EditorToolbar';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TipTapEditorProps {
  document: DocumentDetail;
  onBack: () => void;
  onDocumentUpdated: (doc: DocumentDetail) => void;
  onOpenShare: () => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  document,
  onBack,
  onDocumentUpdated,
  onOpenShare,
}) => {
  const toast = useToast();
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('saved');
  const isViewer = document.userRole === 'viewer';

  // Refs for autosave debounce & draft preservation
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<Record<string, any> | null>(null);
  const currentDocRef = useRef(document);
  currentDocRef.current = document;

  const saveChanges = useCallback(
    async (contentToSave?: Record<string, any>, titleToSave?: string) => {
      if (isViewer) return;

      const content = contentToSave ?? pendingContentRef.current;
      const title = titleToSave ?? currentDocRef.current.title;

      if (!content && !titleToSave) return;

      setSaveStatus('saving');

      try {
        const payload: { title?: string; content?: Record<string, any> } = {};
        if (content) payload.content = content;
        if (title) payload.title = title;

        const res = await api.documents.update(currentDocRef.current.id, payload);

        if (res.success) {
          pendingContentRef.current = null;
          setSaveStatus('saved');
          onDocumentUpdated({
            ...currentDocRef.current,
            title: res.document.title,
            content: res.document.content,
            updatedAt: res.document.updatedAt,
          });
        }
      } catch (err: any) {
        console.error('Save failed:', err);
        setSaveStatus('error');
        toast.error(err.message || 'Failed to save changes. Your draft is preserved.');
      }
    },
    [isViewer, onDocumentUpdated, toast]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your document here...',
      }),
    ],
    content: document.content || {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editable: !isViewer,
    onUpdate: ({ editor }) => {
      if (isViewer) return;

      const json = editor.getJSON();
      pendingContentRef.current = json;
      setSaveStatus('unsaved');

      // Debounce autosave: 1200ms
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveChanges(json);
      }, 1200);
    },
  });

  // Keep editor editable state synced with role
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isViewer);
    }
  }, [editor, isViewer]);

  // Clean up timer on unmount and flush pending saves if any
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (pendingContentRef.current && !isViewer) {
        // Immediate sync
        api.documents.update(currentDocRef.current.id, {
          content: pendingContentRef.current,
        }).catch((err) => console.error('Unmount save failed:', err));
      }
    };
  }, [isViewer]);

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editor && !isViewer) {
          saveChanges(editor.getJSON());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isViewer, saveChanges]);

  const handleTitleChange = (newTitle: string) => {
    saveChanges(undefined, newTitle);
  };

  const handleManualSave = () => {
    if (editor) {
      saveChanges(editor.getJSON());
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100/70 min-h-[calc(100vh-57px)]">
      {/* Editor Header */}
      <EditorHeader
        document={document}
        saveStatus={saveStatus}
        onBack={onBack}
        onTitleChange={handleTitleChange}
        onManualSave={handleManualSave}
        onOpenShare={onOpenShare}
      />

      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} isViewer={isViewer} />

      {/* Editor Canvas Page */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-10 flex justify-center">
        <div
          className={`w-full max-w-3xl bg-white rounded-xl shadow-xs border border-slate-200/90 p-8 sm:p-14 min-h-[750px] transition-all ${
            isViewer ? 'cursor-default' : 'cursor-text'
          }`}
          onClick={() => {
            if (!isViewer && editor && !editor.isFocused) {
              editor.commands.focus();
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
