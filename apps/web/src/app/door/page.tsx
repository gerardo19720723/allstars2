'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { io, Socket } from 'socket.io-client';

interface CapacityData {
  active: number;
  max: number;
  available: number;
}

interface Guest {
  id: string;
  name: string;
  ticketType: string;
  entryTime: string;
}

export default function DoorPage() {
  const [capacity, setCapacity] = useState<CapacityData>({ active: 0, max: 0, available: 0 });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [identifier, setIdentifier] = useState('');

  // 1. Cargar Aforo y Recargar cada 5 segundos
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    const fetchCapacity = async () => {
      try {
        const res = await apiClient.get<CapacityData>('/door/capacity');
        setCapacity(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error cargando aforo', error);
      }
    };

    fetchCapacity(); // Carga inicial
     newSocket.on('capacityUpdated', (data: CapacityData) => {
      console.log('Aforo actualizado:', data);
      setCapacity(data);
    });

    setSocket(newSocket);

    // Limpieza al desmontar
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Registrar Entrada Manual (Fallback si el QR falla)
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return alert('Ingresa un nombre o ID');

    try {
      await apiClient.post('/door/check-in', { identifier });
      alert(`✅ Entrada registrada: ${identifier}`);
      setIdentifier(''); // Limpiar campo
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('❌ DENEGADO: ' + error.response?.data?.message);
      } else {
        alert('Error al procesar entrada');
      }
    }
  };

  // 3. Calcular porcentaje para la barra visual
  const fillPercentage = (capacity.active / capacity.max) * 100;
  const isFull = capacity.available <= 0;
  const isWarning = fillPercentage > 80 && fillPercentage < 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans flex flex-col items-center">
      
      {/* CABECERA */}
      <header className="w-full max-w-md mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-400">🚪 CONTROL DE PUERTA</h1>
        <p className="text-gray-400 text-sm">Gestión de Aforo y Acceso</p>
      </header>

      {/* MEDIDOR DE AFORO */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between mb-2 text-sm font-semibold">
          <span>Aforo Actual: {capacity.active}</span>
          <span>Máximo: {capacity.max}</span>
        </div>
        
        {/* Barra de Progreso */}
        <div className="w-full bg-gray-700 rounded-full h-8 overflow-hidden border-2 border-gray-600">
          <div 
            className={`h-full transition-all duration-500 flex items-center justify-center font-bold text-sm
              ${isFull ? 'bg-red-600' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}
            `}
            style={{ width: `${Math.min(fillPercentage, 100)}%` }}
          >
            {Math.round(fillPercentage)}%
          </div>
        </div>
        
        {isFull && (
          <p className="text-red-400 text-center mt-2 font-bold animate-pulse">
            ¡AFORO LLENO! No permitir más ingresos.
          </p>
        )}
      </div>

      {/* FORMULARIO MANUAL (Fallback) */}
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Registro Manual</h2>
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre / Mesa / ID</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Mesa 5, VIP Juan, ..."
            />
          </div>
          <button
            type="submit"
            disabled={isFull}
            className={`w-full py-3 rounded-lg font-bold text-lg transition ${
              isFull 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            REGISTRAR ENTRADA ✅
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Usar si el escáner QR no funciona.
        </p>
      </div>
    </div>
  );
}