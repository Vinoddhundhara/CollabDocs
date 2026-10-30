export interface User {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
}

export interface DemoAccount extends User {
  demoPassword: string;
}

export interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface Collaborator {
  user: CollaboratorUser;
  role: 'viewer' | 'editor';
}

export interface DocumentSummary {
  id: string;
  title: string;
  owner: CollaboratorUser;
  collaboratorCount: number;
  isOwner: boolean;
  userRole: 'owner' | 'editor' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail {
  id: string;
  title: string;
  content: Record<string, any>;
  owner: CollaboratorUser;
  collaborators: Collaborator[];
  isOwner: boolean;
  userRole: 'owner' | 'editor' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error';
export type TabFilter = 'all' | 'owned' | 'shared';
export type ViewMode = 'grid' | 'list';

