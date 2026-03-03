'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/api-client';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';

// Interfaces deben coincidir con lo que devuelve el Backend
interface SongRequest {
  id: string;
  songTitle: string;
  artistName: string;
  isPriority: boolean;
  votes: number;
  status: string;
}

// ID de sesión fijo para conectar con el DJ
const MOCK_SESSION_ID = 'demo-session-id';

export default function ClientRequestsPage() {
  // --- 1. ESTADOS (Hooks al principio) ---
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedSongs, setVotedSongs] = useState<Set<string>>(new Set());
  
  // Estados para Batalla de Géneros
  const [battleActive, setBattleActive] = useState(false);
  const [genres, setGenres] = useState<any[]>([]);
  const [votedGenre, setVotedGenre] = useState<string | null>(null);
  const [battleGenres, setBattleGenres] = useState<any[]>([]);

  // Referencia para bloqueo de votos
  const votingIds = useRef(new Set<string>());

   // --- 1. Cargar Géneros y actualizar Referencia ---

  // Creamos una referencia mutable para genres (esto evita que el socket vea datos viejos)
  const genresRef = useRef(genres);

  useEffect(() => {
    // Cargar géneros al montar
    const fetchGenres = async () => {
      try {
        const res = await apiClient.get('/genre/list');
        setGenres(res.data);
        // ACTUALIZAMOS LA REFERENCIA
        genresRef.current = res.data; 
      } catch (error) {
        console.error("Error cargando géneros", error);
      }
    };
    fetchGenres();
  }, []); // Se ejecuta una vez al inicio

  // --- 2. Conexión Socket y Carga Inicial ---

  useEffect(() => {
    // A. Cargar datos iniciales de canciones
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

    // B. Conexión Socket
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

    // Listener para la Cola de Canciones
    socket.on('queueUpdated', (updatedRequests: SongRequest[]) => {
      console.log("Actualización recibida:", updatedRequests);
      setRequests(updatedRequests);
    });

    // Listener para la Batalla de Géneros
    socket.on('battleStarted', (data: any) => {
      console.log("🚨🚨 EVENTO RECIBIDO: battleStarted", data);
      
      // USAMOS LA REFERENCIA (genresRef.current) EN LUGAR DE LA ESTADO (genres)
      const activeGenres = genresRef.current.filter(g => data.genreIds.includes(g.id));
      
      console.log("Géneros filtrados:", activeGenres);

      // ACTIVAR LA BATALLA
      setBattleGenres(activeGenres);
      setBattleActive(true);
      
      alert("¡El DJ ha iniciado una Batalla de Géneros! 🎉");
    });

    socket.on('battleEnded', () => {
      console.log("Batalla terminada");
      setBattleActive(false);
      setVotedGenre(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Dependencies vacías para mantener el socket estable
  
  // --- 3. HELPERS & HANDLERS ---

  const getSafeClientId = (): string => {
    if (typeof window === 'undefined') return 'unknown';
    let id = localStorage.getItem('allstars_client_id');
    if (!id) {
      id = 'client-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('allstars_client_id', id);
    }
    return id;
  };

  const handleVoteGenre = async (genreId: string) => {
    const userId = getSafeClientId();
    try {
      await apiClient.post('/genre/vote', { genreId, userId });
      setVotedGenre(genreId);
      alert("¡Voto registrado! 🗳️");
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert("Ya votaste en esta ronda.");
      } else {
        console.error(error);
        alert("Error al votar.");
      }
    }
  };

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
      const userId = getSafeClientId();
      await apiClient.post('/dj/vote', {
        requestId: requestId,
        userId: userId
      });

      setVotedSongs((prev: Set<string>) => new Set([...prev, requestId]));

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

  const handleCreateRequest = async (isPriority: boolean = false) => {
    const songTitle = prompt("Nombre de la canción (ej: Despacito): ") || "Desconocido";
    const artistName = prompt("Artista (ej: Wisin): ") || "Desconocido";

    if (!songTitle) return alert("El nombre es obligatorio");

    try {
      const res = await apiClient.post('/dj/request', {
        songTitle,
        artistName,
        isPriority,
      });
      alert("¡Pedido enviado al DJ!");
    } catch (error) {
      const newRequest: SongRequest = {
        id: `local-${Date.now()}`,
        songTitle,
        artistName,
        isPriority,
        votes: 0,
        status: 'PENDING'
      };
      setRequests(prev => [...prev, newRequest]);
    }
  };

  // --- 4. RENDERIZADO ---
  if (loading) return <div className="text-center mt-20 text-white">Cargando...</div>;

   return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">🎤 Solicitud de Música</h1>
            <p className="text-gray-400">Influye en el ambiente 🌊</p>
          </div>
          
          {/* BOTÓN IR AL PERFIL */}
          <a 
            href="/client/profile"
            className="bg-yellow-600 hover:bg-yellow-500 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110"
            title="Ver mi Perfil"
          >
            👤
          </a>
        </div> {/* <-- ESTE </div> FALTABA */}
        
        {/* CONTENEDOR PRINCIPAL */}
        <div className="space-y-4 mt-8">
          
          {/* --- VISTA DE BATALLA --- */}
          {battleActive ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-center mb-6 text-pink-500 animate-pulse">
                ⚔️ ¿Que quieres escuchar?
              </h2>
                          <div className="grid grid-cols-1 gap-4">
                {battleGenres.map((g, index) => (
                  // WRAP EN MOTION.DIV CON DELAY
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 20 }} // Empieza invisible y 20px abajo
                    animate={{ opacity: 1, y: 0 }}    // Termina visible y en posición
                    transition={{ delay: index * 0.15, duration: 0.5 }} // Retraso por tarjeta
                  >
                    <button
                      onClick={() => handleVoteGenre(g.id)}
                      disabled={votedGenre === g.id}
                      className={`
                        relative p-8 rounded-xl border-2 text-center transition-all duration-300 transform hover:scale-105 active:scale-95 w-full
                        ${votedGenre === g.id 
                          ? 'bg-pink-600 border-pink-400 text-white opacity-90 cursor-default' 
                          : 'bg-gray-800 border-gray-700 hover:border-pink-500 hover:bg-gray-700'
                        }
                      `}
                    >
                      {votedGenre === g.id && (
                        <motion.div 
                          initial={{ scale: 0 }} // Animación del checkmark
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 text-2xl"
                        >
                          ✅
                        </motion.div>
                      )}
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }} // Animación del emoji
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.15 + 0.1 }}
                        className="text-5xl mb-2"
                      >
                        {g.emoji}
                      </motion.div>
                      <div className="text-2xl font-bold">{g.name}</div>
                      {votedGenre === g.id && (
                        <div className="text-sm mt-2">¡Tu voto! 🗳️</div>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            // --- VISTA NORMAL (LISTA DE CANCIONES) ---
            <>
              {requests.length === 0 && (
                <div className="text-center text-gray-500 mt-20 italic">
                  No hay peticiones. ¡Sé el primero en pedir música! 🎧
                </div>
              )}

              {requests.map((req) => (
                <div 
                  key={req.id} 
                  className={`
                    p-4 rounded-xl border shadow-lg flex justify-between items-center transition-colors duration-300
                    ${req.status === 'PLAYING' 
                      ? 'bg-green-900/40 border-green-500 ring-1 ring-green-500' 
                      : 'bg-gray-800 border-gray-700'
                    }
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {req.status === 'PLAYING' && (
                        <span className="animate-pulse text-xl">🔊</span>
                      )}
                      <h2 className={`text-xl font-bold ${req.status === 'PLAYING' ? 'text-green-100' : 'text-white'}`}>
                        {req.songTitle}
                      </h2>
                    </div>
                    <p className="text-gray-400 text-sm">{req.artistName}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">📉 {req.votes} votos</span>
                      {req.isPriority && <span className="text-xs font-bold text-yellow-500">💰 PRIORITY</span>}
                      
                      {req.status === 'PLAYING' && (
                        <span className="text-xs font-bold text-green-400 border border-green-600 px-2 py-1 rounded bg-green-900/50">
                          REPRODUCIENDO
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleVote(req.id)}
                      className="mt-3 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-white font-bold"
                    >
                      👍 Votar
                    </button>
                  </div>

                  {!req.isPriority && (
                    <button 
                      onClick={() => handleCreateRequest(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      🚀 Boostear $5
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Botón Flotante */}
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
      </div> {/* <-- ESTE </div> CIERRA EL max-w-md mx-auto */}
    </main>
  );
}