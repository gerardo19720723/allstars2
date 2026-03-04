'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface TicketData {
  id: string;
  ticketCode: string;
  description: string;
  quantity: number;
  binId: string;
  bin?: { // El backend debe enviar esto
    number: string;
    section: string;
  };
  createdAt: string;
}

export default function ClientCloakroomPage() {
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [pushedTicket, setPushedTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MY_ID = 'customer-demo-123';
  const TENANT_ID = 'default-tenant';

  // --- 1. CONEXIÓN WEBSOCKET (RECIBIR TICKET MÁGICO) ---
  useEffect(() => {
    const socket: Socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('✅ [CLIENT CLOAK] Conectado:', socket.id);
    });

    const eventName = `ticket:${MY_ID}`;
    console.log(`👂 [CLIENT CLOAK] Escuchando: "${eventName}"`);

    socket.on(eventName, (data: TicketData) => {
      console.log('🎉 [CLIENT CLOAK] ¡PRENDA RECIBIDA!', data);
      setPushedTicket(data);
      setTicket(data);
    });

    // --- 2. ESCUCHAR AVISO DE ENTREGA ---
    const returnEventName = `cloakroom_returned:${MY_ID}`;
    socket.on(returnEventName, () => {
      console.log('🧥 [CLIENT CLOAK] Prenda devuelta');
      alert('🧥 ¡Tu prenda ha sido devuelta!');
      handleReset();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- 3. BÚSQUEDA MANUAL (IGUAL QUE VALET) ---
  useEffect(() => {
    if (code.length === 4 && !ticket && !loading) {
      const timer = setTimeout(() => {
        fetchTicket();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [code]);

  const fetchTicket = async () => {
    if (code.length !== 4) return;
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/cloakroom/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({
          customerId: MY_ID,
          ticketCode: code,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(val);
  };

  const handleRequest = async () => {
    if (!ticket) return;
    alert('🔔 Solicitando prenda al personal...');
    try {
      await fetch('http://localhost:3000/cloakroom/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT_ID },
        body: JSON.stringify({ ticketCode: ticket.ticketCode }),
      });
    } catch (error) {
      alert('Error enviando solicitud');
    }
  };

  const handleReset = () => {
    setCode('');
    setTicket(null);
    setError('');
    setPushedTicket(null);
  };

  const getTimeElapsed = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} min`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* MODAL PUSH */}
      {pushedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border-2 border-purple-500 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-black font-bold px-6 py-1 rounded-full text-sm shadow-lg animate-bounce">
              NUEVO TICKET
            </div>
            <div className="mb-6 mt-4">
              <span className="text-7xl inline-block animate-pulse">🧥</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Prenda Guardada!</h2>
            
            <div className="bg-black/50 rounded-2xl p-6 mb-6 border border-purple-500/30">
              <span className="block text-purple-400 text-xs uppercase tracking-widest mb-1">Ubicación</span>
              <div className="text-4xl font-bold text-white mb-2">
                Sección {ticket?.bin?.section || '...'} - Cubículo {ticket?.bin?.number || '...'}
              </div>
              <div className="text-gray-400 text-sm">{ticket?.description}</div>
              <div className="text-purple-300 text-xs mt-1">Cantidad: {ticket?.quantity}</div>
            </div>

            <button onClick={() => setPushedTicket(null)} className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg">
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA ACTIVA */}
      {ticket ? (
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 z-10">
          <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-block p-5 bg-gray-800 rounded-full mb-4">
                <span className="text-5xl">🧥</span>
              </div>
              <h2 className="text-purple-400 font-bold tracking-widest text-sm uppercase">Mi Prenda</h2>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 mb-6 border border-gray-800">
              <span className="block text-gray-500 text-xs uppercase mb-2">Ubicación</span>
              <div className="text-7xl font-bold text-white mb-2">
                {/* Fallback si no viene el objeto bin completo */}
                {ticket.bin ? `${ticket.bin.section} - ${ticket.bin.number}` : 'Cargando...'}
              </div>
              <div className="text-gray-300 mt-2 font-semibold">{ticket.description}</div>
              <div className="text-xs text-gray-500 mt-1">Cant: {ticket.quantity}</div>
            </div>

            <div className="flex justify-between items-center bg-gray-800/50 rounded-xl p-4 mb-8">
              <span className="text-gray-400 text-sm">Tiempo Guardado</span>
              <span className="text-white font-bold text-lg">{getTimeElapsed(ticket.createdAt)}</span>
            </div>

            <button onClick={handleRequest} className="w-full py-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg shadow-lg shadow-purple-600/30 animate-pulse mb-3">
              🚘 SOLICITAR PRENDA
            </button>
          </div>
        </div>
      ) : (
        /* PANTALLA INICIO */
        <div className="w-full max-w-sm text-center z-10">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">MI PRENDA</h1>
          <p className="text-gray-500 text-sm mb-8">
            Ingresa los <span className="text-white font-bold">últimos 4 caracteres</span> de tu ticket
          </p>
          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl">
            <input
              type="text"
              value={code}
              onChange={handleChange}
              autoFocus
              maxLength={4}
              placeholder="____"
              className="w-full bg-black border-2 border-gray-700 text-center text-6xl font-mono font-bold py-6 rounded-xl focus:outline-none focus:border-purple-500 text-white tracking-[0.5em] transition-all uppercase"
            />
            {loading && <div className="mt-6 flex justify-center"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>}
            {error && <p className="mt-6 text-red-500 font-bold text-sm animate-bounce">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}