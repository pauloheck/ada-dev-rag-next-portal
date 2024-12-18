'use client';

import { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '@/lib/services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function Chat() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Mantém o foco no input após cada atualização do histórico
    inputRef.current?.focus();
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const userMessage: ChatMessage = {
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, userMessage]);
      setMessage('');
      
      // Mantém o foco no input após limpar a mensagem
      inputRef.current?.focus();
      
      const response = await sendChatMessage(userMessage.content);

      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString()
        };
        
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        setError('Falha ao obter resposta do assistente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
      // Mantém o foco no input após finalizar
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-200px)]">
      <div className="bg-white rounded-t-lg shadow-lg p-4">
        <h2 className="text-xl font-semibold text-gray-800">Chat RAG</h2>
        <p className="text-sm text-gray-600">
          Faça perguntas sobre os documentos carregados no sistema
        </p>
      </div>

      <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
        <div className="space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Envie uma mensagem para começar a conversa
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 animate-pulse">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white rounded-b-lg shadow-lg p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Enviando
              </span>
            ) : (
              'Enviar'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
