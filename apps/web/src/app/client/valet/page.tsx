'use client';

import { useState, useEffect } from 'react';

interface TicketData {
  ticketCode: string; // Código completo (8 chars)
  spot: { number: string; level: string };
  createdAt: string;
}

export default function ClientValetPage() {
  const [code, setCode] = useState(''); // Solo 4 chars
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CUSTOMER_ID = 'customer-demo-123'; 
  const TENANT_ID = 'default-tenant';

  const fetchTicket = async () => {
    if (code.length !== 4) return;
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/valet/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({
          customerId: CUSTOMER_ID,
          ticketCode: code, // Enviamos solo los 4 chars
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTicket(data);
      } else {
        setError(data.message || 'Código inválido');
        setCode('');
      }
    } catch (err) {
      setError('Error de conexión');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-enviar al escribir el 4to carácter
  useEffect(() => {
    if (code.length === 4 && !ticket && !loading) {
      const timer = setTimeout(() => {
        fetchTicket();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Aceptamos solo letras y números
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(val);
  };

  const getTimeElapsed = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} min`;
  };

  const handleReset = () => {
    setCode('');
    setTicket(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      
      {!ticket ? (
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">MI AUTO</h1>
          {/* Texto actualizado para claridad */}
          <p className="text-gray-500 text-sm mb-8">Ingresa los <span className="text-white font-bold">últimos 4 caracteres</span> de tu ticket</p>

          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl">
            <input
              type="text"
              value={code}
              onChange={handleChange}
              autoFocus
              maxLength={4}
              placeholder="____"
              className="w-full bg-black border-2 border-gray-700 text-center text-6xl font-mono font-bold py-6 rounded-xl focus:outline-none focus:border-emerald-500 text-white tracking-[0.5em] transition-all uppercase"
            />

            {loading && (
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {error && (
              <p className="mt-6 text-red-500 font-bold text-sm animate-bounce">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gray-900 border-2 border-emerald-500/50 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <div className="mb-6">
              <div className="inline-block p-5 bg-emerald-500 rounded-full mb-4 shadow-lg shadow-emerald-500/50">
                <span className="text-5xl">🚗</span>
              </div>
              <h2 className="text-emerald-400 font-bold tracking-widest text-sm uppercase">Ubicación</h2>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 mb-6 border border-gray-800">
              <span className="block text-gray-500 text-xs uppercase mb-2">Cajón</span>
              <div className="text-7xl font-bold text-white mb-2">
                {ticket.spot.number}
              </div>
              <span className="inline-block px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                {ticket.spot.level}
              </span>
            </div>

            <div className="flex justify-between items-center bg-gray-800/50 rounded-xl p-4 mb-8">
              <span className="text-gray-400 text-sm">Tiempo</span>
              <span className="text-white font-bold text-lg">{getTimeElapsed(ticket.createdAt)}</span>
            </div>

            <button 
              onClick={handleReset}
              className="w-full py-4 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors"
            >
              Buscar otro auto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}