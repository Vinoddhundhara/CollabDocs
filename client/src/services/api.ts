import { DocumentDetail, DocumentSummary, User, DemoAccount, Collaborator } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('collabdocs_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.error ||
        (data?.issues && data.issues.map((i: any) => i.message).join(', ')) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or offline error
    throw new ApiError(
      error.message || 'Cannot reach the backend server. Please verify the backend is running.',
      0
    );
  }
}

export const api = {
  health: {
    check: async () => {
      return request<{ status: string; database: { connected: boolean; status: string } }>('/api/health');
    },
  },
  auth: {
    login: async (email: string, password: string) => {
      return request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    me: async () => {
      return request<{ success: boolean; user: User }>('/api/auth/me');
    },
    getDemoAccounts: async () => {
      return request<{ success: boolean; accounts: DemoAccount[] }>('/api/auth/demo-accounts');
    },
  },
  documents: {
    list: async (filter?: 'owned' | 'shared' | 'all') => {
      const query = filter ? `?filter=${filter}` : '';
      return request<{ success: boolean; documents: DocumentSummary[] }>(`/api/documents${query}`);
    },
    get: async (id: string) => {
      return request<{ success: boolean; document: DocumentDetail }>(`/api/documents/${id}`);
    },
    create: async (title?: string, content?: Record<string, any>) => {
      return request<{ success: boolean; document: DocumentDetail }>('/api/documents', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
    },
    update: async (id: string, updates: { title?: string; content?: Record<string, any> }) => {
      return request<{ success: boolean; document: { id: string; title: string; content: any; updatedAt: string } }>(
        `/api/documents/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      );
    },
    delete: async (id: string) => {
      return request<{ success: boolean; message: string }>(`/api/documents/${id}`, {
        method: 'DELETE',
      });
    },
    share: async (id: string, email: string, role: 'viewer' | 'editor') => {
      return request<{ success: boolean; message: string; collaborators: Collaborator[] }>(
        `/api/documents/${id}/share`,
        {
          method: 'POST',
          body: JSON.stringify({ email, role }),
        }
      );
    },
    removeCollaborator: async (id: string, collaboratorId: string) => {
      return request<{ success: boolean; message: string; collaborators: Collaborator[] }>(
        `/api/documents/${id}/share/${collaboratorId}`,
        {
          method: 'DELETE',
        }
      );
    },
    getShares: async (id: string) => {
      return request<{ success: boolean; owner: any; collaborators: Collaborator[]; isOwner: boolean }>(
        `/api/documents/${id}/shares`
      );
    },
    importFile: async (rawContent: string, filename?: string, title?: string) => {
      return request<{ success: boolean; message: string; document: DocumentDetail }>(
        '/api/documents/import',
        {
          method: 'POST',
          body: JSON.stringify({ rawContent, filename, title }),
        }
      );
    },
    getExportUrl: (id: string, format: 'md' | 'txt' | 'json') => {
      return `${API_BASE_URL}/api/documents/${id}/export?format=${format}`;
    },
  },
};

