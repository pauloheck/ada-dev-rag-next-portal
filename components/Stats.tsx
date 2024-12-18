'use client';

import { useEffect, useState } from 'react';
import { getStats } from '@/lib/services/api';

export function Stats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Carregando estatísticas...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-4">Estatísticas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="p-4 border rounded-md bg-white">
            <h3 className="text-sm font-medium text-gray-500 capitalize">
              {key.replace(/_/g, ' ')}
            </h3>
            <p className="mt-1 text-2xl font-semibold">
              {typeof value === 'number' ? value.toLocaleString() : String(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
