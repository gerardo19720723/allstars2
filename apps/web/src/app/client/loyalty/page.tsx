'use client';

import { useState, useEffect } from 'react';

interface Reward {
  id: number;
  name: string;
  cost: number;
  icon: string;
}

export default function ClientLoyaltyPage() {
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState('Novato');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const MY_ID = 'customer-demo-123';
  const TENANT_ID = 'default-tenant';

  // --- LÓGICA DE RANGO LOCAL (Para evitar errores de importación) ---
  const calculateLocalRank = (pts: number): string => {
    if (pts > 1000) return 'LEGENDARIO';
    if (pts > 500) return 'Platino';
    if (pts > 300) return 'Oro';
    if (pts > 150) return 'Plata';
    if (pts > 50) return 'Bronce';
    return 'Novato';
  };
  // ------------------------------------------------------------

  useEffect(() => {
    fetchProfile();
    fetchRewards();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:3000/loyalty/profile`, {
        headers: { 
          'x-tenant-id': TENANT_ID, 
          'x-customer-id': MY_ID 
        }
      });
      const data = await res.json();
      if (res.ok) {
        setPoints(data.points);
        // Usamos la función local para calcular el rango visual
        setRank(calculateLocalRank(data.points));
      }
    } catch (error) {
      console.error("Error cargando perfil", error);
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await fetch(`http://localhost:3000/loyalty/rewards`);
      const data = await res.json();
      setRewards(data);
    } catch (error) {
      console.error("Error cargando recompensas", error);
    }
  };

  const handleRedeem = async (cost: number, rewardName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/loyalty/redeem`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-tenant-id': TENANT_ID, 
          'x-customer-id': MY_ID 
        },
        body: JSON.stringify({ cost }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setPoints(data.newPoints);
        setRank(calculateLocalRank(data.newPoints)); // Recalcular rango visual
        setMessage(`¡Canje exitoso! Disfruta tu ${rewardName}`);
      } else {
        setMessage(data.message || 'Error al canjear');
      }
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getRankColor = (r: string) => {
    if (r === 'LEGENDARIO') return 'text-purple-400 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
    if (r === 'Platino') return 'text-gray-300 border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.5)]';
    if (r === 'Oro') return 'text-yellow-400 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    if (r === 'Plata') return 'text-slate-400 border-slate-500 shadow-[0_0_10px_rgba(148,163,184,0.5)]';
    return 'text-orange-400 border-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.5)]'; // Bronce
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      {/* HEADER PERFIL */}
      <div className="bg-gradient-to-r from-gray-900 to-black p-6 rounded-2xl border border-gray-800 mb-8 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-1">Tu Rango</h2>
            <div className={`text-3xl font-extrabold uppercase italic ${getRankColor(rank)} border-2 rounded-lg px-4 py-1 inline-block`}>
              {rank}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-1">Puntos</h2>
            <div className="text-4xl font-bold text-white">{points}</div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 text-gray-300">Recompensas Disponibles</h3>
      
      {/* TARJETAS DE RECOMPENSAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rewards.map((reward) => (
          <div 
            key={reward.id} 
            className={`bg-gray-900 p-6 rounded-2xl border border-gray-800 flex justify-between items-center relative overflow-hidden transition-all ${
              points < reward.cost ? 'opacity-50 grayscale' : 'hover:border-emerald-500'
            }`}
          >
            <div className="flex items-center gap-4 z-10">
              <span className="text-4xl">{reward.icon}</span>
              <div>
                <h4 className="font-bold text-lg">{reward.name}</h4>
                <div className="text-emerald-400 font-bold">{reward.cost} Pts</div>
              </div>
            </div>
            
            <button
              onClick={() => handleRedeem(reward.cost, reward.name)}
              disabled={loading || points < reward.cost}
              className={`z-10 px-4 py-3 rounded-xl font-bold transition-all ${
                points >= reward.cost 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {points >= reward.cost ? 'Canjear' : 'Faltan Pts'}
            </button>

            {/* Barra de progreso visual */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min((points / reward.cost) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl border border-gray-600 animate-bounce z-50">
          {message}
        </div>
      )}
    </div>
  );
}