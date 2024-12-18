'use client';

import { useState } from 'react';
import { queryDocuments } from '@/lib/services/api';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { Stats } from '@/components/Stats';
import { Chat } from '@/components/Chat';
import { ImageUpload } from '@/components/ImageUpload';
import { BatchImageUpload } from '@/components/BatchImageUpload';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'query' | 'upload' | 'list' | 'stats' | 'chat' | 'batch-upload'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await queryDocuments(question);
      setAnswer(response.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <Chat />;
      case 'batch-upload':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4">Upload em Lote de Imagens</h2>
            <BatchImageUpload />
          </div>
        );
      case 'query':
        return (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4">Fazer Pergunta</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium mb-2">
                  Faça sua pergunta:
                </label>
                <input
                  id="question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite sua pergunta..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {answer && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Resposta:</h3>
                <p>{answer}</p>
              </div>
            )}
          </div>
        );
      case 'upload':
        return <DocumentUpload />;
      case 'list':
        return <DocumentList />;
      case 'stats':
        return <Stats />;
      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'chat'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'query'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Perguntar
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'upload'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveTab('batch-upload')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'batch-upload'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Upload em Lote
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Listar
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'stats'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Estatísticas
          </button>
        </div>
        {renderContent()}
      </div>
    </main>
  );
}