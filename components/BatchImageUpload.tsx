'use client';

import { useState, useCallback, useRef } from 'react';
import { uploadImageBatch } from '@/lib/services/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';

interface CustomInputElement extends HTMLInputElement {
  webkitdirectory?: boolean;
  directory?: string;
}

interface DirectoryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory: string;
  mozdirectory: string;
  directory: string;
}

const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp'
];

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

export function BatchImageUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<{
    filename: string;
    status: 'success' | 'error';
    message?: string;
  }[]>([]);

  const isValidImageFile = (file: File): boolean => {
    if (file.type && VALID_IMAGE_TYPES.includes(file.type)) {
      return true;
    }
    const extension = file.name.toLowerCase().split('.').pop();
    return extension ? VALID_IMAGE_EXTENSIONS.includes(`.${extension}`) : false;
  };

  const processFiles = (inputFiles: FileList | null) => {
    if (!inputFiles || inputFiles.length === 0) {
      setError('Nenhum arquivo selecionado');
      return;
    }

    const imageFiles = Array.from(inputFiles).filter(isValidImageFile);

    if (imageFiles.length === 0) {
      setError('Nenhuma imagem válida encontrada. Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, BMP, WebP)');
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...imageFiles]);
    setError(null);
    setResults([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(isValidImageFile);
    
    if (imageFiles.length === 0) {
      setError('Nenhuma imagem válida encontrada. Por favor, arraste apenas arquivos de imagem (JPG, PNG, GIF, BMP, WebP)');
      return;
    }

    setFiles(prevFiles => [...prevFiles, ...imageFiles]);
    setError(null);
    setResults([]);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    if (results && results.length > 0) {
      setResults(prevResults => prevResults.filter((_, i) => i !== index));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Por favor, selecione pelo menos um arquivo');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await uploadImageBatch(files, (progress) => {
        setUploadProgress(progress);
      });

      setResults(response.processed_files);
      
      if (response.success) {
        setFiles([]);
      } else {
        setError('Alguns arquivos não puderam ser processados. Verifique os resultados abaixo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Arraste e solte suas imagens aqui, ou
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={uploading}
            >
              Selecionar Arquivo
            </Button>
            <Button
              onClick={() => folderInputRef.current?.click()}
              variant="outline"
              disabled={uploading}
            >
              Selecionar Pasta
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={VALID_IMAGE_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <input
          ref={folderInputRef}
          type="file"
          onChange={handleFolderSelect}
          className="hidden"
          {...{
            webkitdirectory: '',
            mozdirectory: '',
            directory: '',
          } as DirectoryInputProps}
        />
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative group border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
                <div className="aspect-square mb-2 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                  />
                </div>
                <p className="text-sm text-gray-600 truncate" title={file.name}>
                  {file.name}
                </p>
                {results && results[index] && (
                  <div
                    className={`mt-2 text-xs ${
                      results[index].status === 'success'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {results[index].message}
                  </div>
                )}
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-gray-600 text-center">
                Enviando... {uploadProgress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            className="w-full"
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Enviar Imagens'}
          </Button>
        </div>
      )}
    </div>
  );
}
