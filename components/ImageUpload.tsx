'use client';

import { useState, useRef } from 'react';
import { uploadImage } from '@/lib/services/api';

export function ImageUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(`A imagem deve ter no máximo 5MB. Tamanho atual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    // Criar preview com tamanho reduzido
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Reduzir tamanho se necessário
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setPreview(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setRetryCount(0);
    setUploadStatus('Iniciando upload...');

    try {
      const response = await uploadImage(
        file,
        (progress) => {
          setUploadProgress(progress);
          if (progress === 100) {
            setUploadStatus('Processando imagem...');
          } else {
            setUploadStatus('Enviando imagem...');
          }
        }
      );

      if (response.success) {
        setSuccess('Imagem enviada com sucesso!');
        if (response.analysis) {
          setSuccess(prev => `${prev}\n\nAnálise da imagem:\n${JSON.stringify(response.analysis, null, 2)}`);
        }
      } else {
        setError(response.message || 'Erro ao enviar imagem');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao enviar imagem');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setRetryCount(0);
      setUploadStatus('');
    }
  };

  const clearState = () => {
    setPreview(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          loading ? 'border-gray-300 bg-gray-50' : 'border-blue-300 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={loading}
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <button
              onClick={clearState}
              className="text-sm text-red-500 hover:text-red-600"
              disabled={loading}
            >
              Remover imagem
            </button>
          </div>
        ) : (
          <div
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-1 text-sm text-gray-600">
              Clique para selecionar ou arraste uma imagem
            </p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
          </div>
        )}

        {loading && (
          <div className="mt-4 space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              {uploadStatus}
              {retryCount > 0 && ` (Tentativa ${retryCount} de 5)`}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-yellow-600">
                Reconectando ao servidor... Aguarde até 1 minuto.
              </p>
            )}
            {uploadProgress === 100 && (
              <p className="text-xs text-blue-600">
                Aguarde enquanto processamos sua imagem... (pode levar até 10 minutos)
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-md text-sm whitespace-pre-wrap">
            {success}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Requisitos e informações:</p>
        <ul className="list-disc list-inside">
          <li>Formatos aceitos: PNG, JPG, GIF</li>
          <li>Tamanho máximo: 5MB</li>
          <li>Dimensão máxima recomendada: 800x800 pixels</li>
          <li>Tempo limite por tentativa: 10 minutos</li>
          <li>Tentativas automáticas: até 5 vezes</li>
          <li>Tempo entre tentativas: 5s a 60s</li>
          <li>Reinício automático após 1 minuto sem progresso</li>
        </ul>
      </div>
    </div>
  );
}
