import { Router } from 'express';
import {
  getDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeCollaborator,
  getDocumentShares,
  importDocument,
  exportDocument,
  createDocSchema,
  updateDocSchema,
  shareDocSchema,
  importDocSchema,
} from '../controllers/documentController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

// Protect all document routes
router.use(authenticateToken);

// Document CRUD & Import
router.get('/', getDocuments);
router.post('/', validateBody(createDocSchema), createDocument);
router.post('/import', validateBody(importDocSchema), importDocument);

// Single Document Operations
router.get('/:id', getDocumentById);
router.patch('/:id', validateBody(updateDocSchema), updateDocument);
router.delete('/:id', deleteDocument);

// Document Sharing & Collaboration
router.get('/:id/shares', getDocumentShares);
router.post('/:id/share', validateBody(shareDocSchema), shareDocument);
router.delete('/:id/share/:collaboratorId', removeCollaborator);

// Document Export
router.get('/:id/export', exportDocument);

export default router;

