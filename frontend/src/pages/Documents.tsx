import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import apiService from '@services/api';
import { sanitizeInput } from '@utils/sanitize';
import type { Document, Pagination } from '../types';

interface DocumentsResponse {
  documents: Document[];
  pagination: Pagination;
}

const Documents = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', shared: false });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDocuments = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError('');
    const response = await apiService.get<DocumentsResponse>(`/documents?page=${page}&limit=10`);
    if (response.success && 'data' in response) {
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
    } else if ('error' in response) {
      setError(response.error.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const openCreateForm = () => {
    setEditingDoc(null);
    setFormData({ title: '', content: '', shared: false });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({ title: doc.title, content: doc.content, shared: doc.shared });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = sanitizeInput(formData.title);
    const content = sanitizeInput(formData.content);

    if (!title || !content) {
      setFormError('Title and content are required.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    const payload = { title, content, shared: formData.shared };

    const response = editingDoc
      ? await apiService.put<Document>(`/documents/${editingDoc.id}`, payload)
      : await apiService.post<Document>('/documents', payload);

    setIsSaving(false);

    if (response.success) {
      setShowForm(false);
      fetchDocuments(pagination.page);
    } else if ('error' in response) {
      setFormError(response.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    const response = await apiService.delete(`/documents/${id}`);
    if (response.success) {
      fetchDocuments(pagination.page);
    } else if ('error' in response) {
      setError(response.error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">SafeConnect Solutions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link to="/monitoring" className="text-gray-700 hover:text-primary-600">
                  Monitoring
                </Link>
              )}
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Documents</h2>
            <button onClick={openCreateForm} className="btn btn-primary">
              New Document
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {showForm && (
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-4">
                {editingDoc ? 'Edit Document' : 'Create Document'}
              </h3>
              {formError && (
                <div className="alert alert-error">
                  <p>{formError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    id="content"
                    className="input"
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="shared"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    checked={formData.shared}
                    onChange={(e) => setFormData((p) => ({ ...p, shared: e.target.checked }))}
                  />
                  <label htmlFor="shared" className="ml-2 text-sm text-gray-700">
                    Share with all users
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingDoc ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600">No documents yet. Create your first document.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="card">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{doc.title}</h3>
                          {doc.shared && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Shared
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1 line-clamp-2">{doc.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {doc.owner ? `${doc.owner.firstName} ${doc.owner.lastName}` : 'Unknown'} -{' '}
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {doc.ownerId === user?.id && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openEditForm(doc)}
                            className="btn btn-secondary text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="btn btn-danger text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => fetchDocuments(p)}
                      className={`px-3 py-1 rounded ${p === pagination.page ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Documents;
