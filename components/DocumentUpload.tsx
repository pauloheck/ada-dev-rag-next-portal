'use client';

import { useState } from 'react';
import { addTextDocument } from '@/lib/services/api';

export function DocumentUpload() {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await addTextDocument({
        content,
        metadata: {
          source,
          type: 'text'
        }
      });
      setSuccess(`Documento adicionado com sucesso! ID: ${response.document_id}`);
      setContent('');
      setSource('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-4">Adicionar Documento</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-2">
            Fonte do Documento:
          </label>
          <input
            id="source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Ex: manual_produto.txt"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Conteúdo:
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Digite o conteúdo do documento aqui..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 disabled:bg-green-300"
        >
          {loading ? 'Adicionando...' : 'Adicionar Documento'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
    </div>
  );
}
