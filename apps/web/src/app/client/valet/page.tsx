'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface TicketData {
  id: string;
  ticketCode: string;
  spot: { number: string; level: string };
  createdAt: string;
}

export default function ClientValetPage() {
  // --- ESTADOS ---
  const [code, setCode] = useState(''); // Para entrada manual
  const [ticket, setTicket] = useState<TicketData | null>(null); // Ticket mostrado en pantalla
  const [pushedTicket, setPushedTicket] = useState<TicketData | null>(null); // Ticket recibido por Push (Modal)
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // --- CONFIGURACIÓN ---
  // IMPORTANTE: Este ID debe coincidir con el ID que el Valet selecciona al asignar el cajón
  const MY_ID = 'customer-demo-123'; 
  const TENANT_ID = 'default-tenant';

  useEffect(() => {
  setCurrentTime(new Date());
}, []);

  // --- 1. CONEXIÓN WEBSOCKET (RECIBIR TICKET MÁGICO) ---
   // 1. CONEXIÓN WEBSOCKET
  useEffect(() => {
    console.log('🔌 [FRONTEND] Conectando a Socket.io...');
    const socket: Socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('✅ [FRONTEND] Conectado al Socket Server con ID:', socket.id);
    });

    // Escuchar el evento personalizado solo para mi ID
    const eventName = `ticket:${MY_ID}`;
    console.log(`👂 [FRONTEND] Preparado para escuchar evento: "${eventName}"`);

    socket.on(eventName, (data) => {
      console.log('🎉🎉🎉 [FRONTEND] ¡TICKET RECIBIDO!', data);
      setPushedTicket(data);
      setTicket(data);
    });

     // --- NUEVO: ESCUCHAR AVISO DE ENTREGA DE AUTO ---
    const returnEventName = `ticket_returned:${MY_ID}`;
    socket.on(returnEventName, () => {
      console.log('🚗 [FRONTEND] Auto entregado! Reseteando app...');
      
      // 1. Feedback al usuario
      alert('🚗 ¡Tu vehículo ha sido entregado con éxito!');
      
      // 2. Resetear la app (Volver al inicio)
      handleReset();
    });

    return () => {
      console.log('❌ [FRONTEND] Desconectando...');
      socket.disconnect();
    };
  }, []);

  // --- 2. BÚSQUEDA MANUAL (INGRESO DE 4 DÍGITOS) ---
  useEffect(() => {
    // Si el usuario escribe 4 caracteres, buscamos automáticamente
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
      const res = await fetch('http://localhost:3000/valet/claim', {
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
        // Si el backend dice que no existe
        setError(data.message || 'Código inválido. Intenta de nuevo.');
        setCode(''); // Limpiamos para que reintente
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

    const handleRequestCar = async () => {
    if (!ticket) return;

    try {
      // Feedback visual inmediato
      alert('🔔 Solicitud enviada al Valet. ¡El auto llegará pronto!');
      
      await fetch('http://localhost:3000/valet/request-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({ ticketCode: ticket.ticketCode }),
      });
    } catch (error) {
      alert('Error enviando solicitud. Intente nuevamente.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo mayúsculas, sin espacios
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(val);
  };

  const handleReset = () => {
    setCode('');
    setTicket(null);
    setError('');
    setPushedTicket(null); // También cerramos el modal si está abierto
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
      
      {/* --- MODAL DE NOTIFICACIÓN PUSH (SUPERPUESTO) --- */}
      {pushedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border-2 border-emerald-500 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.4)] transform transition-all scale-100">
            
            {/* Etiqueta de nuevo */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-black font-bold px-6 py-1 rounded-full text-sm shadow-lg animate-bounce">
              NUEVO TICKET
            </div>

            {/* Icono */}
            <div className="mb-6 mt-4">
              <span className="text-7xl inline-block animate-pulse">🎫</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">¡Auto Guardado!</h2>
            <p className="text-gray-400 mb-8">El valet ha asignado tu vehículo.</p>

            {/* Datos del Ticket en el Modal */}
            <div className="bg-black/50 rounded-2xl p-6 mb-6 border border-emerald-500/30">
              <span className="block text-emerald-400 text-xs uppercase tracking-widest mb-1">Cajón</span>
              <div className="text-7xl font-bold text-white mb-2">
                {pushedTicket.spot.number}
              </div>
              <div className="text-gray-400 text-sm">{pushedTicket.spot.level}</div>
            </div>

            <button 
              onClick={() => setPushedTicket(null)}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition-colors"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}

      {/* --- CONTENIDO PRINCIPAL --- */}
      
      {/* CASO 1: Hay ticket activo (Manual o Push) */}
      {ticket ? (
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 z-10">
          <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="mb-6">
              <div className="inline-block p-5 bg-gray-800 rounded-full mb-4">
                <span className="text-5xl">🚗</span>
              </div>
              <h2 className="text-emerald-400 font-bold tracking-widest text-sm uppercase">Tu Ubicación</h2>
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
              <span className="text-gray-400 text-sm">Tiempo Estacionado</span>
              <span className="text-white font-bold text-lg">{getTimeElapsed(ticket.createdAt)}</span>
            </div>

             <div className="flex flex-col gap-3">
      {/* --- NUEVO BOTÓN: SOLICITAR AUTO --- */}
      <button 
        onClick={handleRequestCar}
        className="w-full py-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-600/30 animate-pulse border-2 border-emerald-400"
      >
        🚘 SOLICITAR MI AUTO
      </button>

      {/* --- BOTÓN PEQUEÑO: LIMPIAR (Para buscar otro manual) --- */}
      <button 
        onClick={handleReset}
        className="text-gray-500 text-xs py-2 hover:text-gray-300 underline"
      >
        Buscar otro auto
      </button>
    </div>
          </div>
        </div>
      ) : (
        /* CASO 2: No hay ticket, mostrar input manual */
        <div className="w-full max-w-sm text-center z-10">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">MI AUTO</h1>
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
            
            {!loading && !error && (
              <p className="mt-6 text-xs text-gray-600">
                El ticket se buscará automáticamente.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}