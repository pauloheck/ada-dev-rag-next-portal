const API_BASE_URL = '/api';
const UPLOAD_API_URL = process.env.NEXT_PUBLIC_UPLOAD_API_URL || 'http://localhost:8008';

interface QueryRequest {
  question: string;
}

interface QueryResponse {
  answer: string;
  sources: {
    source: string;
    type: string;
  }[];
}

interface TextDocument {
  content: string;
  metadata: {
    source: string;
    type: string;
  };
}

export interface DocumentContent {
  id: string;
  source: string;
  type: string;
  content_preview: string;
  size?: number;
  uploadedAt?: string;
  description?: string;
  tags?: string[];
}

interface ChatMessageRequest {
  content: string;
  include_context: boolean;
}

interface ChatMessageResponse {
  message: string;
  success: boolean;
}

interface ChatMessage {
  message: string;
  context?: {
    conversation_id?: string;
    user_id?: string;
  };
}

interface ChatResponse {
  response: string;
  sources: {
    source: string;
    relevance: number;
  }[];
  conversation_id: string;
}

export interface ChatHistory {
  conversation_id: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    sources?: {
      source: string;
      relevance: number;
    }[];
  }[];
}

const MAX_RETRIES = 3;
const INITIAL_TIMEOUT = 30000; // 30 segundos
const MAX_TIMEOUT = 300000;    // 5 minutos

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), INITIAL_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      const delay = Math.min(1000 * (MAX_RETRIES - retries + 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function queryDocuments(question: string): Promise<QueryResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/query`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}

export async function getDocuments(source?: string): Promise<DocumentContent[]> {
  try {
    const url = source 
      ? `${API_BASE_URL}/documents?source=${encodeURIComponent(source)}`
      : `${API_BASE_URL}/documents`;

    const response = await fetchWithRetry(url);

    return await response.json();
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
}

export async function addTextDocument(document: TextDocument): Promise<{ success: boolean; document_id: string }> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/documents/text`, {
      method: 'POST',
      body: JSON.stringify(document),
    });

    return await response.json();
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

export interface ImageUploadResponse {
  success: boolean;
  message?: string;
  image_id?: string;
  analysis?: any;
}

const MAX_RETRIES_UPLOAD = 5;
const TIMEOUT_UPLOAD = 600000; // 10 minutos
const STALE_TIMEOUT_UPLOAD = 60000; // 1 minuto sem progresso antes de reiniciar

export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> {
  let retries = 0;

  const attemptUpload = (): Promise<ImageUploadResponse> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProgress = 0;
      let staleProgressTime = 0;
      
      // Monitor de progresso para detectar upload travado
      const progressMonitor = setInterval(() => {
        if (lastProgress === uploadProgress && uploadProgress > 0 && uploadProgress < 100) {
          staleProgressTime += 1000;
          if (staleProgressTime >= STALE_TIMEOUT_UPLOAD) { // 1 minuto sem progresso
            clearInterval(progressMonitor);
            xhr.abort();
            reject(new Error('Upload parece estar travado. Tentando novamente...'));
          }
        } else {
          staleProgressTime = 0;
          lastProgress = uploadProgress;
        }
      }, 1000);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded * 100) / event.total);
          uploadProgress = progress;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        clearInterval(progressMonitor);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Erro ao processar resposta do servidor'));
          }
        } else {
          reject(new Error(`Error: ${xhr.status} - ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        clearInterval(progressMonitor);
        reject(new Error('A conexão foi perdida. Tentando novamente...'));
      });

      xhr.addEventListener('timeout', () => {
        clearInterval(progressMonitor);
        reject(new Error('O upload excedeu 10 minutos. Tentando novamente...'));
      });

      xhr.addEventListener('abort', () => {
        clearInterval(progressMonitor);
        reject(new Error('Upload cancelado. Tentando novamente...'));
      });

      xhr.open('POST', `${UPLOAD_API_URL}/documents/image`, true);
      xhr.timeout = TIMEOUT_UPLOAD;

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

  const uploadWithRetry = async (): Promise<ImageUploadResponse> => {
    try {
      return await attemptUpload();
    } catch (error) {
      if (retries < MAX_RETRIES_UPLOAD) {
        retries++;
        console.log(`Tentativa ${retries} de ${MAX_RETRIES_UPLOAD}`);
        // Espera exponencial entre tentativas (5s, 10s, 20s, 40s, 60s)
        const waitTime = Math.min(Math.pow(2, retries + 1) * 2500, 60000); // máximo 1 minuto
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return uploadWithRetry();
      }
      throw error;
    }
  };

  let uploadProgress = 0;
  
  try {
    return await uploadWithRetry();
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Não foi possível fazer o upload da imagem após várias tentativas. Por favor, tente novamente mais tarde.');
  }
}

export interface BatchImageUploadResponse {
  success: boolean;
  message?: string;
  processed_files: {
    filename: string;
    status: 'success' | 'error';
    message?: string;
    image_id?: string;
  }[];
}

export async function uploadImageBatch(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<BatchImageUploadResponse> {
  try {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let uploadProgress = 0;
      let lastProgress = 0;
      let staleProgressTime = 0;
      let retries = 0;

      const progressMonitor = setInterval(() => {
        if (lastProgress === uploadProgress && uploadProgress > 0 && uploadProgress < 100) {
          staleProgressTime += 1000;
          if (staleProgressTime >= STALE_TIMEOUT_UPLOAD) {
            clearInterval(progressMonitor);
            xhr.abort();
            reject(new Error('Upload em lote parece estar travado. Tentando novamente...'));
          }
        } else {
          staleProgressTime = 0;
          lastProgress = uploadProgress;
        }
      }, 1000);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          uploadProgress = Math.round((event.loaded / event.total) * 100);
          if (onProgress) {
            onProgress(uploadProgress);
          }
        }
      });

      xhr.addEventListener('load', () => {
        clearInterval(progressMonitor);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Erro ao processar resposta do servidor'));
          }
        } else {
          reject(new Error(`Erro no upload: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        clearInterval(progressMonitor);
        reject(new Error('Erro de rede durante o upload'));
      });

      xhr.addEventListener('timeout', () => {
        clearInterval(progressMonitor);
        reject(new Error('Timeout durante o upload'));
      });

      xhr.addEventListener('abort', () => {
        clearInterval(progressMonitor);
        reject(new Error('Upload abortado'));
      });

      xhr.open('POST', `${UPLOAD_API_URL}/images/batch`, true);
      xhr.timeout = TIMEOUT_UPLOAD;

      xhr.send(formData);
    });
  } catch (error) {
    if (retries < MAX_RETRIES_UPLOAD) {
      retries++;
      console.log(`Tentativa ${retries} de ${MAX_RETRIES_UPLOAD}`);
      const waitTime = Math.min(Math.pow(2, retries + 1) * 2500, 60000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return uploadImageBatch(files, onProgress);
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido no upload em lote',
      processed_files: files.map(file => ({
        filename: file.name,
        status: 'error' as const,
        message: 'Falha no upload'
      }))
    };
  }
}

export async function getStats() {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/stats/basic`);

    return await response.json();
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

export async function sendChatMessage(message: string): Promise<ChatMessageResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      body: JSON.stringify({ content: message }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      message: 'Erro ao enviar mensagem. Por favor, tente novamente.',
      success: false
    };
  }
}

export async function getChatHistory(conversationId: string): Promise<ChatHistory> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/chat/history/${conversationId}`);

    return await response.json();
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
}

export async function updateDocumentMetadata(
  id: string,
  metadata: {
    description?: string;
    tags?: string[];
  }
): Promise<DocumentContent> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${id}/metadata`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar metadados do documento');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar metadados:', error);
    throw error;
  }
}
