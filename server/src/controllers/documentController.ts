import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Doc, CollaboratorRole } from '../models/Document';
import { User } from '../models/User';
import { markdownToTipTapJson, tipTapJsonToMarkdown } from '../services/markdownService';

// Validation schemas
export const createDocSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200, 'Title too long').optional(),
  content: z.record(z.any()).optional(),
});

export const updateDocSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200, 'Title too long').optional(),
  content: z.record(z.any()).optional(),
});

export const shareDocSchema = z.object({
  email: z.string().email('Please enter a valid collaborator email'),
  role: z.enum(['viewer', 'editor'] as const),
});

export const importDocSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  rawContent: z.string().max(1024 * 1024, 'File exceeds 1MB limit'),
  filename: z.string().optional(),
});

// Helper to determine user role on a document
function getUserDocumentRole(doc: any, userId: string): 'owner' | 'editor' | 'viewer' | null {
  if (doc.owner._id ? doc.owner._id.toString() === userId : doc.owner.toString() === userId) {
    return 'owner';
  }

  const collaborator = doc.collaborators?.find((c: any) => {
    const cUserId = c.user._id ? c.user._id.toString() : c.user.toString();
    return cUserId === userId;
  });

  return collaborator ? collaborator.role : null;
}

/**
 * GET /api/documents
 * List all documents accessible to the current user (owned + shared)
 */
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const filter = req.query.filter as string; // 'owned' | 'shared' | 'all'

    let query: any = {};
    if (filter === 'owned') {
      query = { owner: userId };
    } else if (filter === 'shared') {
      query = { 'collaborators.user': userId };
    } else {
      query = {
        $or: [{ owner: userId }, { 'collaborators.user': userId }],
      };
    }

    const docs = await Doc.find(query)
      .populate('owner', 'name email avatarColor')
      .populate('collaborators.user', 'name email avatarColor')
      .sort({ updatedAt: -1 });

    const formatted = docs.map((d) => {
      const isOwner = (d.owner as any)._id.toString() === userId;
      const userRole = getUserDocumentRole(d, userId);
      return {
        id: d._id.toString(),
        title: d.title,
        owner: {
          id: (d.owner as any)._id.toString(),
          name: (d.owner as any).name,
          email: (d.owner as any).email,
          avatarColor: (d.owner as any).avatarColor,
        },
        collaboratorCount: d.collaborators.length,
        isOwner,
        userRole,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      documents: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch documents',
    });
  }
};

/**
 * POST /api/documents
 * Create a new document
 */
export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, content } = req.body;

    const newDoc = new Doc({
      title: title || 'Untitled Document',
      content: content || {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      owner: userId,
      collaborators: [],
    });

    await newDoc.save();
    await newDoc.populate('owner', 'name email avatarColor');

    res.status(201).json({
      success: true,
      document: {
        id: newDoc._id.toString(),
        title: newDoc.title,
        content: newDoc.content,
        owner: {
          id: (newDoc.owner as any)._id.toString(),
          name: (newDoc.owner as any).name,
          email: (newDoc.owner as any).email,
          avatarColor: (newDoc.owner as any).avatarColor,
        },
        collaborators: [],
        isOwner: true,
        userRole: 'owner',
        createdAt: newDoc.createdAt,
        updatedAt: newDoc.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create document',
    });
  }
};

/**
 * GET /api/documents/:id
 * Fetch single document if user has permission
 */
export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid document ID format' });
      return;
    }

    const doc = await Doc.findById(id)
      .populate('owner', 'name email avatarColor')
      .populate('collaborators.user', 'name email avatarColor');

    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const role = getUserDocumentRole(doc, userId);
    if (!role) {
      res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to view this document.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      document: {
        id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        owner: {
          id: (doc.owner as any)._id.toString(),
          name: (doc.owner as any).name,
          email: (doc.owner as any).email,
          avatarColor: (doc.owner as any).avatarColor,
        },
        collaborators: doc.collaborators.map((c: any) => ({
          user: {
            id: c.user._id.toString(),
            name: c.user.name,
            email: c.user.email,
            avatarColor: c.user.avatarColor,
          },
          role: c.role,
        })),
        isOwner: role === 'owner',
        userRole: role,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch document',
    });
  }
};

/**
 * PATCH /api/documents/:id
 * Update title and/or content. Only owner or editor can perform this.
 */
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid document ID format' });
      return;
    }

    const doc = await Doc.findById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const role = getUserDocumentRole(doc, userId);
    if (!role) {
      res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to access this document.',
      });
      return;
    }

    if (role === 'viewer') {
      res.status(403).json({
        success: false,
        error: 'Permission denied: Viewers cannot edit this document.',
      });
      return;
    }

    // Role is owner or editor
    if (title !== undefined) {
      doc.title = title;
    }
    if (content !== undefined) {
      doc.content = content;
    }

    await doc.save();

    res.status(200).json({
      success: true,
      document: {
        id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update document',
    });
  }
};

/**
 * DELETE /api/documents/:id
 * Delete document. Owner ONLY.
 */
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid document ID format' });
      return;
    }

    const doc = await Doc.findById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (doc.owner.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Permission denied: Only the document owner can delete this document.',
      });
      return;
    }

    await Doc.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete document',
    });
  }
};

/**
 * POST /api/documents/:id/share
 * Add or update collaborator role. Owner ONLY.
 */
export const shareDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { email, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid document ID format' });
      return;
    }

    const doc = await Doc.findById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (doc.owner.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Permission denied: Only the document owner can manage collaborators.',
      });
      return;
    }

    // Find the target user by email
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: `User with email "${email}" not found. Only registered demo users can currently be invited.`,
      });
      return;
    }

    if (targetUser._id.toString() === userId) {
      res.status(400).json({
        success: false,
        error: 'You are already the owner of this document.',
      });
      return;
    }

    // Check if already in collaborator list
    const existingIndex = doc.collaborators.findIndex(
      (c) => c.user.toString() === targetUser._id.toString()
    );

    if (existingIndex >= 0) {
      doc.collaborators[existingIndex].role = role;
    } else {
      doc.collaborators.push({
        user: targetUser._id as any,
        role,
      });
    }

    await doc.save();
    await doc.populate('collaborators.user', 'name email avatarColor');

    res.status(200).json({
      success: true,
      message: `Document shared with ${targetUser.name} as ${role}`,
      collaborators: doc.collaborators.map((c: any) => ({
        user: {
          id: c.user._id.toString(),
          name: c.user.name,
          email: c.user.email,
          avatarColor: c.user.avatarColor,
        },
        role: c.role,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to share document',
    });
  }
};

/**
 * DELETE /api/documents/:id/share/:collaboratorId
 * Remove a collaborator. Owner ONLY.
 */
export const removeCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(collaboratorId)) {
      res.status(400).json({ success: false, error: 'Invalid ID format' });
      return;
    }

    const doc = await Doc.findById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (doc.owner.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: 'Permission denied: Only the document owner can remove collaborators.',
      });
      return;
    }

    doc.collaborators = doc.collaborators.filter(
      (c) => c.user.toString() !== collaboratorId
    );

    await doc.save();
    await doc.populate('collaborators.user', 'name email avatarColor');

    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully',
      collaborators: doc.collaborators.map((c: any) => ({
        user: {
          id: c.user._id.toString(),
          name: c.user.name,
          email: c.user.email,
          avatarColor: c.user.avatarColor,
        },
        role: c.role,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove collaborator',
    });
  }
};

/**
 * GET /api/documents/:id/shares
 * Get collaborator list. Authorized users only.
 */
export const getDocumentShares = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid document ID format' });
      return;
    }

    const doc = await Doc.findById(id)
      .populate('owner', 'name email avatarColor')
      .populate('collaborators.user', 'name email avatarColor');

    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const role = getUserDocumentRole(doc, userId);
    if (!role) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      owner: {
        id: (doc.owner as any)._id.toString(),
        name: (doc.owner as any).name,
        email: (doc.owner as any).email,
        avatarColor: (doc.owner as any).avatarColor,
      },
      collaborators: doc.collaborators.map((c: any) => ({
        user: {
          id: c.user._id.toString(),
          name: c.user.name,
          email: c.user.email,
          avatarColor: c.user.avatarColor,
        },
        role: c.role,
      })),
      isOwner: role === 'owner',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document shares',
    });
  }
};

/**
 * POST /api/documents/import
 * Import a .txt or .md file content and create a new document.
 */
export const importDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { rawContent, filename, title: requestedTitle } = req.body;

    if (!rawContent && rawContent !== '') {
      res.status(400).json({ success: false, error: 'No content provided for import' });
      return;
    }

    // Default title from filename (strip extension) or fallback
    let docTitle = requestedTitle;
    if (!docTitle && filename) {
      docTitle = filename.replace(/\.(txt|md|markdown)$/i, '');
    }
    if (!docTitle) {
      docTitle = 'Imported Document';
    }

    const tipTapContent = markdownToTipTapJson(rawContent);

    const newDoc = new Doc({
      title: docTitle,
      content: tipTapContent,
      owner: userId,
      collaborators: [],
    });

    await newDoc.save();
    await newDoc.populate('owner', 'name email avatarColor');

    res.status(201).json({
      success: true,
      message: 'Document successfully imported',
      document: {
        id: newDoc._id.toString(),
        title: newDoc.title,
        content: newDoc.content,
        owner: {
          id: (newDoc.owner as any)._id.toString(),
          name: (newDoc.owner as any).name,
          email: (newDoc.owner as any).email,
          avatarColor: (newDoc.owner as any).avatarColor,
        },
        collaborators: [],
        isOwner: true,
        userRole: 'owner',
        createdAt: newDoc.createdAt,
        updatedAt: newDoc.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import document',
    });
  }
};

/**
 * GET /api/documents/:id/export
 * Export document content in markdown, plain text, or JSON.
 */
export const exportDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const format = (req.query.format as string) || 'md';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: 'Invalid document ID format' });
      return;
    }

    const doc = await Doc.findById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    const role = getUserDocumentRole(doc, userId);
    if (!role) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title)}.json"`);
      res.status(200).send(JSON.stringify(doc.content, null, 2));
      return;
    }

    const markdown = tipTapJsonToMarkdown(doc.content);

    if (format === 'txt') {
      // Strip markdown syntax for plain text
      const plainText = markdown.replace(/[*#`_>]/g, '');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title)}.txt"`);
      res.status(200).send(plainText);
      return;
    }

    // Default: markdown
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title)}.md"`);
    res.status(200).send(markdown);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export document',
    });
  }
};

