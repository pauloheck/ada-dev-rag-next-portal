'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Tag, Trash2, Plus, Save, X } from 'lucide-react';
import { getDocuments, updateDocumentMetadata } from '@/lib/services/api';

interface Document {
  id: string;
  path: string;
  type: string;
  name: string;
  size: number;
  uploadedAt: Date;
  description?: string;
  tags: string[];
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [editForm, setEditForm] = useState({
    description: '',
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await getDocuments();
        const formattedDocs = response.map(doc => ({
          id: doc.id,
          path: doc.source,
          type: doc.type,
          name: doc.source.split('/').pop() || doc.source,
          size: 0, // TODO: Adicionar tamanho real do arquivo
          uploadedAt: new Date(), // TODO: Adicionar data real de upload
          description: doc.content_preview,
          tags: []
        }));
        setDocuments(formattedDocs);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar documentos');
        setLoading(false);
        console.error('Erro:', err);
      }
    };

    fetchDocuments();
  }, []);

  const handleEdit = (doc: Document) => {
    setEditingId(doc.id);
    setEditForm({
      description: doc.description || '',
      tags: [...doc.tags]
    });
  };

  const handleSave = async (docId: string) => {
    try {
      await updateDocumentMetadata(docId, {
        description: editForm.description,
        tags: editForm.tags
      });

      setDocuments(docs =>
        docs.map(doc =>
          doc.id === docId
            ? {
                ...doc,
                description: editForm.description,
                tags: editForm.tags
              }
            : doc
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error('Erro ao salvar metadados:', error);
      // TODO: Adicionar feedback visual do erro
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleDelete = (docId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== docId));
  };

  if (loading) {
    return <div className="text-center">Carregando documentos...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{doc.name}</h3>
                <Badge variant="outline">{doc.type}</Badge>
              </div>
              
              <p className="text-sm text-gray-500 mt-1">
                {doc.path}
              </p>

              {editingId === doc.id ? (
                <div className="mt-2 space-y-2">
                  <Input
                    value={editForm.description}
                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Adicionar descrição..."
                    className="w-full"
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    {editForm.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                    
                    <div className="flex items-center gap-2">
                      <Input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        placeholder="Nova tag..."
                        className="w-32"
                        onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddTag}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(doc.id)}
                    >
                      <Save size={16} className="mr-2" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {doc.description}
                    </p>
                  )}
                  
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doc.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{formatBytes(doc.size)}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(doc.uploadedAt, {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingId !== doc.id && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(doc)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
