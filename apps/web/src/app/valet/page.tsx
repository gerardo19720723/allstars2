'use client';

import { useState, useEffect } from 'react';

interface Spot {
  id: string;
  number: string;
  level: string;
  status: 'FREE' | 'OCCUPIED';
  ticket?: {
    id: string;
    ticketCode: string;
    createdAt: string;
  };
}

export default function ValetPremiumPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [currentLevel, setCurrentLevel] = useState('Piso 1');
  const [loading, setLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [viewMode, setViewMode] = useState<'ASSIGN' | 'EXIT'>('ASSIGN'); // Nuevo: Modo del modal

  // Constante para el Tenant (en producción, esto vendría del login)
  const TENANT_ID = 'default-tenant';

  // Cargar Cajones
  useEffect(() => {
    fetchSpots();
  }, [currentLevel]);

  const fetchSpots = async () => {
    try {
      // Llamada a la nueva API que creamos en el backend
      const res = await fetch(`http://localhost:3000/valet/spots/${currentLevel}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      const data = await res.json();
      
      // Ajustamos el formato porque la API devuelve tickets dentro del spot
      const formattedSpots = data.map((s: any) => ({
        id: s.id,
        number: s.number,
        level: s.level,
        status: s.status,
        ticket: s.tickets && s.tickets.length > 0 ? s.tickets[0] : undefined
      }));
      
      setSpots(formattedSpots);
    } catch (error) {
      console.error("Error cargando cajones", error);
    }
  };

  // MANEJO DE CLICKS EN EL GRID
  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
    
    if (spot.status === 'FREE') {
      setViewMode('ASSIGN'); // Modal de Asignación
    } else {
      setViewMode('EXIT');   // Modal de Salida/Impresión
    }
  };

  // ASIGNAR (Verde -> Rojo)
  const confirmAssignment = async () => {
    if (!selectedSpot) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/valet/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({ spotId: selectedSpot.id }),
      });

      if (res.ok) {
        await fetchSpots(); // Recargar Grid
        setSelectedSpot(null);
      }
    } catch (error) {
      alert("Error asignando cajón");
    } finally {
      setLoading(false);
    }
  };

  // REGISTRAR SALIDA (Rojo -> Verde)
  const handleExit = async () => {
    if (!selectedSpot || !selectedSpot.ticket) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/valet/exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({ ticketCode: selectedSpot.ticket.ticketCode }),
      });

      if (res.ok) {
        await fetchSpots(); // Recargar Grid (se pondrá verde)
        setSelectedSpot(null);
      }
    } catch (error) {
      alert("Error en la salida");
    } finally {
      setLoading(false);
    }
  };

  // IMPRIMIR TICKET
  const handlePrint = () => {
    window.print();
  };

  // AMPLIAR PARKING
  const expandParking = async () => {
    try {
      const res = await fetch('http://localhost:3000/valet/add-spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({ level: currentLevel, count: 30 }),
      });
      
      if (res.ok) {
        fetchSpots();
      }
    } catch (error) {
      console.error(error);
    }
  };
   
const hasSpots = spots.length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 font-sans">
      
      {/* --- ESTILOS PARA IMPRESIÓN --- */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-ticket, #printable-ticket * { visibility: visible; }
          #printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 20px;
            text-align: center;
            border: 2px solid black;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100vh;
          }
        }
      `}</style>

      {/* Header */}
      <header className="mb-8 flex justify-between items-end border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-500 tracking-wider">VALET CONTROL</h1>
          <p className="text-gray-400 text-sm mt-1">Gestión Privada • Nivel Premium</p>
        </div>
        
        <div className="flex gap-2">
          {['Piso 1', 'Piso 2', 'VIP'].map(level => (
            <button
              key={level}
              onClick={() => setCurrentLevel(level)}
              className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                currentLevel === level 
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </header>

      {/* Stats */}
      <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg border border-gray-800">
        <div className="text-emerald-400">
          <span className="block text-2xl font-bold">{spots.filter(s => s.status === 'FREE').length}</span>
          <span className="text-xs uppercase tracking-widest text-gray-500">Disponibles</span>
        </div>
        <div className="text-red-500">
          <span className="block text-2xl font-bold">{spots.filter(s => s.status === 'OCCUPIED').length}</span>
          <span className="text-xs uppercase tracking-widest text-gray-500">Ocupados</span>
        </div>
        <button 
          onClick={expandParking}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-lg"
        >
          + AMPLIAR (+30)
        </button>
      </div>

        {/* GRID DE CAJONES O MENSAJE VACÍO */}
  {!hasSpots ? (
    <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl">
      <div className="text-6xl mb-4">🅿️</div>
      <h3 className="text-xl font-bold text-white mb-2">Nivel Vacío</h3>
      <p className="text-gray-400 text-center max-w-sm mb-6">
        No hay cajones configurados en el nivel "{currentLevel}".
        <br/>Utiliza el botón "AMPLIAR" para crearlos.
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3">
      {spots.map((spot) => (
        <button
          key={spot.id}
          onClick={() => handleSpotClick(spot)}
          className={`
            relative aspect-square rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center
            ${spot.status === 'FREE' 
              ? 'bg-gray-900 border-emerald-900 hover:border-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
              : 'bg-red-950 border-red-700 shadow-inner cursor-pointer'
            }
          `}
        >
          <span className="text-xl font-bold">{spot.number}</span>
          
          {spot.status === 'OCCUPIED' && (
            <span className="text-[10px] text-red-400 mt-1 font-mono">
              {spot.ticket?.ticketCode}
            </span>
          )}
        </button>
      ))}
    </div>
  )}

      {/* MODAL ASIGNAR (Verde) */}
      {selectedSpot && viewMode === 'ASSIGN' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-emerald-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Asignar Cajón {selectedSpot.number}</h3>
            <p className="text-gray-400 text-sm mb-6">
              Se generará un ticket digital.
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setSelectedSpot(null)} className="flex-1 py-3 rounded bg-gray-800 text-gray-300 font-semibold hover:bg-gray-700">
                Cancelar
              </button>
              <button onClick={confirmAssignment} disabled={loading} className="flex-1 py-3 rounded bg-emerald-600 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-500 disabled:opacity-50">
                {loading ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SALIDA / IMPRESIÓN (Rojo) */}
      {selectedSpot && viewMode === 'EXIT' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Cajón {selectedSpot.number}</h3>
            
            {/* INFORMACIÓN DEL TICKET */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Código Ticket</p>
              <p className="text-4xl font-mono font-bold text-emerald-400 mb-2">{selectedSpot.ticket?.ticketCode}</p>
              <p className="text-xs text-gray-500">
                Entrada: {new Date(selectedSpot.ticket?.createdAt || '').toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Botón Imprimir */}
              <button onClick={handlePrint} className="w-full py-3 rounded bg-gray-700 text-white font-bold hover:bg-gray-600 border border-gray-600">
                🖨️ Imprimir Ticket
              </button>

              {/* Botón Salida */}
              <button onClick={handleExit} disabled={loading} className="w-full py-3 rounded bg-red-600 text-white font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:bg-red-500 disabled:opacity-50">
                {loading ? 'Procesando...' : '🚗 Registrar Salida'}
              </button>

              <button onClick={() => setSelectedSpot(null)} className="text-gray-500 text-sm py-2 hover:text-gray-300">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESIÓN OCULTA */}
      <div id="printable-ticket">
        <h1 className="text-2xl font-bold mb-4">ALLSTARS VALET</h1>
        <p className="text-lg mb-2">Código:</p>
        <p className="text-6xl font-mono font-bold border-4 border-black p-4 mb-4">{selectedSpot?.ticket?.ticketCode}</p>
        <p className="text-sm mt-4">Fecha: {new Date().toLocaleDateString()}</p>
        <p className="text-sm">Hora: {new Date().toLocaleTimeString()}</p>
        <p className="text-xs mt-8">Guarde este ticket para retirar su vehículo.</p>
      </div>

    </div>
  );
}