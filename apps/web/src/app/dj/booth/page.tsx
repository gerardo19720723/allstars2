'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { io, Socket } from 'socket.io-client';

interface SongRequest {
  id: string;
  songTitle: string;
  artistName: string;
  status: string;
  votes: number;
  score: number;
  isPriority: boolean;
  playedAt: string;
  songUri: string;
}

// Mock ID para el MVP (En producción viene de la URL o Token)
const MOCK_SESSION_ID = 'demo-session-id'; 

export default function DjBoothPage() {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Inputs del simulador
  const [songInput, setSongInput] = useState('');
  const [artistInput, setArtistInput] = useState('');

  // 1. Cargar Cola al inicio
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await apiClient.get<SongRequest[]>(`/dj/queue/${MOCK_SESSION_ID}`);
        setRequests(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error cargando cola DJ', error);
        setLoading(false);
      }
    };

    fetchQueue();

    // 2. Conexión Socket
    const newSocket = io('http://localhost:3000');

    // Escuchar actualizaciones de la lista
    newSocket.on('queueUpdated', (updatedRequests: SongRequest[]) => {
      setRequests(updatedRequests);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 3. Simulador de Pedidos (Lógica del Formulario)
  const handleSimulateRequest = async (isPriority: boolean) => {
    if (!songInput || !artistInput) return alert('Escribe nombre de canción y artista');

    try {
      await apiClient.post('/dj/request', {
        songTitle: songInput,
        artistName: artistInput,
        isPriority: isPriority 
      });
      
      alert(`✅ ${isPriority ? 'VIP' : 'Normal'} Agregado a la cola`);
      
      // Limpiar campos
      setSongInput('');
      setArtistInput('');
    } catch (error) {
      console.error(error);
      alert('Error al agregar a la cola');
    }
  };

  // 4. Acciones del DJ
 // Línea 79 - Cambiar de /dj-request/ a /dj/request/
const playTrack = async (requestId: string) => {
  apiClient.patch(`/dj/request/${requestId}`, { status: 'PLAYED' })  // <-- CORREGIDO
    .then(() => {
      alert(`🎧 Reproduciendo: ${requests.find(r => r.id === requestId)?.songTitle}`);
    })
    .catch((error) => {
      console.error(error);
      alert('Error al reproducir');
    });
};

// Línea 87 - Cambiar de /dj-session/ a /dj/request/
const skipTrack = async (requestId: string) => {
  try {
    await apiClient.patch(`/dj/request/${requestId}`, { status: 'SKIPPED' });  // <-- CORREGIDO
  } catch (error) {
    alert('Error al saltar');
  }
};

  // 5. Renderizado
  if (loading) return <div className="text-center mt-20 text-white">Cargando Cabina DJ...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-green-500 tracking-wider">DJ BOOTH</h1>
          <p className="text-gray-500 text-sm">Session ID: {MOCK_SESSION_ID}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">MODO LIVE</div>
          <div className="text-green-500 font-bold">● ONLINE</div>
        </div>
      </header>

      {/* LISTA DE REPRODUCCIÓN */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {requests.length === 0 && (
          <div className="text-center text-gray-600 mt-20 italic">
            No hay peticiones en la cola.
          </div>
        )}

        {requests.map((req) => (
          <div 
            key={req.id} 
            className={`p-4 rounded-lg border-2 flex justify-between items-center transition-all
              ${req.status === 'PLAYED' ? 'border-green-600 bg-gray-900 opacity-50' : 'border-gray-800 bg-gray-900 hover:bg-gray-800'}
            `}
          >
            {/* Info Canción */}
            <div className="flex-1">
              <div className="flex items-baseline gap-3">
                <h2 className={`text-xl font-bold ${req.status === 'PLAYED' ? 'text-green-400' : 'text-white'}`}>
                  {req.songTitle}
                </h2>
                {req.isPriority && (
                  <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded font-bold">
                    💰 PRIORITY
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">{req.artistName}</p>
              
              {/* Ranking Score */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Votos: <span className="text-white font-bold">{req.votes}</span></span>
                <span>Score: <span className="text-blue-400 font-bold">{req.score}</span></span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              {req.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => skipTrack(req.id)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold transition"
                  >
                    SKIP
                  </button>
                  <button 
                    onClick={() => playTrack(req.id)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold shadow-[0_0_10px_rgba(34,197,94,0.5)] transition transform hover:scale-105"
                  >
                    PLAY ▶
                  </button>
                </>
              )}
              
              {req.status === 'PLAYED' && (
                <span className="text-green-500 font-bold animate-pulse">PLAYING NOW</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- SIMULADOR (SOLO PARA PRUEBAS) --- */}
      <div className="mt-12 border-t border-gray-800 pt-6">
        <h2 className="text-xl font-bold text-blue-500 mb-4">🎹 Simulador de Pedidos (Solo DJ)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre Canción (Ej: Despacito)"
            value={songInput}
            onChange={(e) => setSongInput(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Artista (Ej: Mora)"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => handleSimulateRequest(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition"
          >
            Simular Normal 📝
          </button>
          <button 
            onClick={() => handleSimulateRequest(true)}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded font-bold transition shadow-lg"
          >
            Simular VIP 💰
          </button>
        </div>
      </div>
    </div>
  );
}