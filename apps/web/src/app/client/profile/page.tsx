'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { io } from 'socket.io-client';

const getSafeClientId = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  let id = localStorage.getItem('allstars_client_id');
  if (!id) {
    id = 'client-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('allstars_client_id', id);
  }
  return id;
};

// Lista de Recompensas disponibles
const REWARDS = [
  { id: 1, name: 'Shot de Bienvenida', cost: 10, emoji: '🥃' },
  { id: 2, name: 'Cerveza Gratis', cost: 50, emoji: '🍺' },
  { id: 3, name: 'Entrada VIP', cost: 200, emoji: '👑' },
];

export default function ClientProfilePage() {
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Estado para el Modal
  const [redeeming, setRedeeming] = useState(false); // Estado de carga al canjear

  // 2. useEffect corregido
useEffect(() => {
  const fetchProfile = async () => {
    const id = getSafeClientId();
    try {
      const res = await apiClient.get(`/customer/me?id=${id}`);
      setCustomer(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando perfil", error);
      setLoading(false);
    }
  };
  fetchProfile();

  // --- Conexión Socket para Live Updates ---
  const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  const myId = getSafeClientId();

  socket.on('pointsUpdated', (data: any) => {
    // Si el evento es para MI, actualizo mis puntos
    if (data.customerId === myId) {
      console.log("📈 Puntos actualizados en tiempo real:", data.points);
      // CORREGIDO: Agregamos ": any" a prev para satisfacer a TypeScript
      setCustomer((prev: any) => ({ ...prev, points: data.points }));
    }
  });

  return () => {
    socket.disconnect();
  };
}, []);

  // Función para Canjear
  const handleRedeem = async (cost: number, name: string) => {
    setRedeeming(true);
    try {
      const customerId = getSafeClientId();
      const res = await apiClient.post('/customer/redeem', {
        customerId,
        cost,
        rewardName: name
      });
      
      alert(`¡Felicidades! Has canjeado: ${name}`);
      
      // Actualizar puntos localmente
      setCustomer({ ...customer, points: res.data.newPoints });
      setShowModal(false);
    } catch (error: any) {
      alert(error.message || "Error al canjear puntos");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <div className="text-center mt-20 text-white">Cargando Perfil...</div>;
  if (!customer) return <div className="text-center mt-20 text-white">Error al cargar perfil.</div>;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto pt-8">
        
        {/* Header Volver */}
        <div className="mb-6">
          <a href="/client/requests" className="text-gray-400 hover:text-white flex items-center gap-2">
            ← Volver a Música
          </a>
        </div>

        {/* Tarjeta de Perfil VIP */}
        <div className="bg-gradient-to-br from-gray-800 to-black border border-yellow-600 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 opacity-10 blur-3xl rounded-full"></div>

          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-yellow-600 flex items-center justify-center text-4xl font-bold shadow-lg border-4 border-yellow-400">
              {customer.rank ? customer.rank[0] : 'N'}
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-yellow-500 mb-1">{customer.rank || 'NOVATO'}</h2>
            <p className="text-gray-400 text-sm">ID: {customer.id}</p>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 mb-4">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1 text-center">Puntos de Lealtad</div>
            <div className="text-5xl font-mono text-center text-white font-bold">
              {customer.points || 0}
            </div>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${(customer.points % 50) * 2}%` }} 
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-sm font-bold">
              Historial
            </button>
            {/* BOTÓN QUE ABRE EL MODAL */}
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-500 py-3 rounded-lg text-sm font-bold"
            >
              Canjear Puntos
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600 text-xs">
          Sigue pidiendo música y votando para acumular puntos.
        </div>

      </div>

      {/* --- MODAL DE CANJEO (Pop-up) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">🎁 Canjear Puntos</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {REWARDS.map((reward) => (
                <div 
                  key={reward.id}
                  className="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.emoji}</span>
                    <span className="font-bold">{reward.name}</span>
                  </div>
                  <button
                    onClick={() => handleRedeem(reward.cost, reward.name)}
                    disabled={customer.points < reward.cost || redeeming}
                    className={`
                      px-3 py-1 rounded text-sm font-bold
                      ${customer.points < reward.cost 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                      }
                    `}
                  >
                    {reward.cost} pts
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-xs text-center text-gray-500">
              Tus puntos actuales: <span className="text-white font-bold">{customer.points}</span>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

