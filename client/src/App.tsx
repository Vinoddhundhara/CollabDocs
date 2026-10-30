import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { api } from './services/api';
import { DocumentSummary, DocumentDetail, TabFilter } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TipTapEditor } from './components/Editor/TipTapEditor';
import { ShareModal } from './components/Modals/ShareModal';
import { ImportModal } from './components/Modals/ImportModal';
import { RenameModal } from './components/Modals/RenameModal';
import { DeleteConfirmModal } from './components/Modals/DeleteConfirmModal';
import { LoginModal } from './components/Modals/LoginModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading: authLoading, isBackendConnected, checkHealth } = useAuth();
  const toast = useToast();

  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Currently active document detail (if editing)
  const [currentDoc, setCurrentDoc] = useState<DocumentDetail | null>(null);
  const [loadingCurrentDoc, setLoadingCurrentDoc] = useState(false);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetDoc, setShareTargetDoc] = useState<DocumentDetail | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [renameTargetDoc, setRenameTargetDoc] = useState<DocumentSummary | null>(null);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<DocumentSummary | null>(null);

  // Fetch document list
  const loadDocuments = useCallback(async () => {
    if (!user) return;
    setLoadingDocs(true);
    try {
      const res = await api.documents.list();
      if (res.success) {
        setDocuments(res.documents);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, loadDocuments]);

  // Open Document by ID
  const openDocument = useCallback(async (id: string) => {
    setLoadingCurrentDoc(true);
    try {
      const res = await api.documents.get(id);
      if (res.success) {
        setCurrentDoc(res.document);
        window.location.hash = `#/doc/${id}`;
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not open document');
      window.location.hash = '';
    } finally {
      setLoadingCurrentDoc(false);
    }
  }, [toast]);

  // URL Hash routing listener: #/doc/:id
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/doc\/([a-zA-Z0-9_-]+)$/);
      if (match && match[1]) {
        if (!currentDoc || currentDoc.id !== match[1]) {
          openDocument(match[1]);
        }
      } else {
        setCurrentDoc(null);
      }
    };

    if (user && !authLoading) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, authLoading, openDocument, currentDoc]);

  // Create New Document
  const handleCreateNew = async () => {
    try {
      const res = await api.documents.create('Untitled Document');
      if (res.success) {
        toast.success('New document created');
        await loadDocuments();
        setCurrentDoc(res.document);
        window.location.hash = `#/doc/${res.document.id}`;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create document');
    }
  };

  // Close Editor and return to Dashboard
  const handleBackToDashboard = () => {
    setCurrentDoc(null);
    window.location.hash = '';
    loadDocuments();
  };

  // Document Rename Action
  const handleRenameConfirm = async (id: string, newTitle: string) => {
    try {
      const res = await api.documents.update(id, { title: newTitle });
      if (res.success) {
        toast.success('Document renamed');
        if (currentDoc && currentDoc.id === id) {
          setCurrentDoc({ ...currentDoc, title: newTitle });
        }
        await loadDocuments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename document');
    }
  };

  // Document Delete Action
  const handleDeleteConfirm = async (id: string) => {
    try {
      const res = await api.documents.delete(id);
      if (res.success) {
        toast.success('Document deleted');
        if (currentDoc && currentDoc.id === id) {
          handleBackToDashboard();
        }
        await loadDocuments();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    }
  };

  // Open Share modal for a specific document
  const handleOpenShare = async (docSummary?: DocumentSummary) => {
    if (currentDoc) {
      setShareTargetDoc(currentDoc);
      setIsShareModalOpen(true);
      return;
    }

    if (docSummary) {
      try {
        const res = await api.documents.get(docSummary.id);
        if (res.success) {
          setShareTargetDoc(res.document);
          setIsShareModalOpen(true);
        }
      } catch (err: any) {
        toast.error(err.message || 'Could not load share settings');
      }
    }
  };

  // Counts for sidebar tabs
  const totalCounts = {
    all: documents.length,
    owned: documents.filter((d) => d.isOwner).length,
    shared: documents.filter((d) => !d.isOwner).length,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium mt-3">Loading CollabDocs...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Backend Offline / Config Error Notification Banner */}
      {isBackendConnected === false && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Database Warning:</strong> MongoDB is disconnected. Please check that MONGODB_URI is correctly configured in your server environment.
            </span>
          </div>
          <button
            onClick={() => checkHealth()}
            className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 px-2.5 py-1 rounded text-white font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Connection</span>
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onGoHome={handleBackToDashboard}
        documentTitle={currentDoc?.title}
        isEditorPage={Boolean(currentDoc)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Render Editor View if a document is open */}
        {currentDoc ? (
          <TipTapEditor
            document={currentDoc}
            onBack={handleBackToDashboard}
            onDocumentUpdated={(updated) => {
              setCurrentDoc(updated);
              setDocuments((prev) =>
                prev.map((d) =>
                  d.id === updated.id
                    ? { ...d, title: updated.title, updatedAt: updated.updatedAt }
                    : d
                )
              );
            }}
            onOpenShare={() => handleOpenShare()}
          />
        ) : loadingCurrentDoc ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium mt-3">Opening document...</p>
          </div>
        ) : (
          /* Dashboard with Sidebar */
          <>
            <div className="hidden md:block">
              <Sidebar
                currentTab={activeTab}
                onTabChange={setActiveTab}
                onCreateNew={handleCreateNew}
                onOpenImport={() => setIsImportModalOpen(true)}
                recentDocs={documents}
                onOpenDoc={openDocument}
                totalCounts={totalCounts}
              />
            </div>

            <main className="flex-1 overflow-y-auto">
              <Dashboard
                documents={documents}
                loading={loadingDocs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onOpenDoc={openDocument}
                onCreateNew={handleCreateNew}
                onOpenImport={() => setIsImportModalOpen(true)}
                onRenameDoc={(doc) => setRenameTargetDoc(doc)}
                onShareDoc={(doc) => handleOpenShare(doc)}
                onDeleteDoc={(doc) => setDeleteTargetDoc(doc)}
              />
            </main>
          </>
        )}
      </div>

      {/* Modals */}
      <ShareModal
        document={shareTargetDoc}
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTargetDoc(null);
        }}
        onCollaboratorsUpdated={(newCollaborators) => {
          if (currentDoc && shareTargetDoc?.id === currentDoc.id) {
            setCurrentDoc({ ...currentDoc, collaborators: newCollaborators });
          }
          loadDocuments();
        }}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(newDoc) => {
          loadDocuments();
          setCurrentDoc(newDoc);
          window.location.hash = `#/doc/${newDoc.id}`;
        }}
      />

      <RenameModal
        document={renameTargetDoc}
        isOpen={Boolean(renameTargetDoc)}
        onClose={() => setRenameTargetDoc(null)}
        onRename={handleRenameConfirm}
      />

      <DeleteConfirmModal
        document={deleteTargetDoc}
        isOpen={Boolean(deleteTargetDoc)}
        onClose={() => setDeleteTargetDoc(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default App;

