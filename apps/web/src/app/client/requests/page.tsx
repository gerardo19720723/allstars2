'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/api-client';
import { io } from 'socket.io-client';

// Interfaces deben coincidir con lo que devuelve el Backend
interface SongRequest {
  id: string;
  songTitle: string;
  artistName: string;
  isPriority: boolean;
  votes: number;
}

// ID de sesión fijo para conectar con el DJ
const MOCK_SESSION_ID = 'demo-session-id';

export default function ClientRequestsPage() {
  // 1. Estado para la lista de canciones
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedSongs, setVotedSongs] = useState<Set<string>>(new Set());

  // 2. Efecto: Cargar Pedidos y Conexión Socket
  useEffect(() => {
    // A. Cargar datos iniciales
    const fetchRequests = async () => {
      try {
        const res = await apiClient.get<SongRequest[]>(`/dj/queue/${MOCK_SESSION_ID}`);
        setRequests(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error cargando peticiones", error);
        setLoading(false);
      }
    };

    fetchRequests();

    // B. Conexión Socket (Para actualizaciones en tiempo real)
    const socket = io(process.env.NEXT_PUBLIC_API_URL); // <-- corregido puerto

    socket.on('queueUpdated', (updatedRequests: SongRequest[]) => {
      console.log("Actualización recibida:", updatedRequests);
      setRequests(updatedRequests);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

// helper seguro
const getSafeClientId = (): string => {
  if (typeof window === 'undefined') return 'unknown'; // Protección SSR
  
  let id = localStorage.getItem('allstars_client_id');
  if (!id) {
    // Generar ID seguro
    id = 'client-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('allstars_client_id', id);
  }
  return id;
};

const votingIds = useRef(new Set<string>());

const handleVote = async (requestId: string) => {
if (votingIds.current.has(requestId)) {
    console.log("Voto ya en proceso, ignorando segundo clic.");
    return;
  }

  if (votedSongs.has(requestId)) {
    alert('⚠️ Ya votaste por esta canción');
    return;
  }
  votingIds.current.add(requestId);
  console.log(`🟢 [FRONTEND] Enviando voto para: ${requestId}`);

  try {
    // Obtenemos el ID de forma segura
    const userId = getSafeClientId();

    await apiClient.post('/dj/vote', {
      requestId: requestId,
      userId: userId // Enviamos el ID seguro
    });

    setVotedSongs((prev: Set<string>) => new Set([...prev, requestId]));
    
    // Actualización optimista
  //  setRequests((prev: SongRequest[]) =>
  //    prev.map((r) =>
  //      r.id === requestId ? { ...r, votes: r.votes + 1 } : r
  //    )
  //  );

  } catch (error: any) {
    if (error.response?.status === 409) {
      alert('⚠️ Ya votaste por esta canción');
      setVotedSongs((prev: Set<string>) => new Set([...prev, requestId]));
    } else {
      alert('Error al votar. Intenta de nuevo');
    }
  } finally {
     votingIds.current.delete(requestId);
  }
};

  // 4. Crear una petición (Común)
  const handleCreateRequest = async (isPriority: boolean = false) => {
    const songTitle = prompt("Nombre de la canción (ej: Despacito): ") || "Desconocido";
    const artistName = prompt("Artista (ej: Wisin): ") || "Desconocido";

    if (!songTitle) return alert("El nombre es obligatorio");

    try {
      const res = await apiClient.post('/dj/request', {
        songTitle,
        artistName,
        isPriority
      });
      
      alert("¡Pedido enviado al DJ!");
      
      // Opcional: Refrescar para ver la canción en la lista
      // const updatedQueue = await apiClient.get(`/dj/queue/${MOCK_SESSION_ID}`);
      // setRequests(updatedQueue.data);
      
    } catch (error) {
      // Si el backend no responde, usamos la simulación local
      const newRequest: SongRequest = {
        id: `local-${Date.now()}`, // ID falso para que el ID no choque con la BD
        songTitle,
        artistName,
        isPriority,
        votes: 0
      };
      
      // Simular adición inmediata para que se vea reflejado en la interfaz
      setRequests(prev => [...prev, newRequest]);
    }
  };

  // 5. Renderizado
  if (loading) return <div className="text-center mt-20 text-white">Cargando...</div>;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold">🎤 Solicitud de Música</h1>
        <p className="text-gray-400">
          Influye en el ambiente 🌊
        </p>

        {/* LISTA DE PEDIDOS */}
        <div className="space-y-4 mt-8">
          {requests.length === 0 && (
            <div className="text-center text-gray-500 mt-20 italic">
              No hay peticiones. ¡Sé el primero en pedir música! 🎧
            </div>
          )}

          {requests.map((req) => (
            <div key={req.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex justify-between items-center">
              <div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{req.songTitle}</h2>
                  <p className="text-gray-400 text-sm">{req.artistName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">📉 {req.votes} votos</span>
                    {req.isPriority && <span className="text-xs font-bold text-yellow-500">💰 PRIORITY</span>}
                  </div>
                  
                  {/* Botón Votar */}
                  <button
                    onClick={() => handleVote(req.id)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-white font-bold"
                  >
                    👍 Votar
                  </button>
                </div>

                {/* Botón Boost (Opcional) */}
                {!req.isPriority && (
                  <button 
                    onClick={() => handleCreateRequest(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    🚀 Boostear $5 para subir a la cola
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botón Flotante para crear petición (Estilo "App Nativa") */}
        <button 
          onClick={() => handleCreateRequest(false)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(to right, #2563EB)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '1.2rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          }}
        >
          🎵 Pedir Música +
        </button>
      </div>
    </main>
  );
}

