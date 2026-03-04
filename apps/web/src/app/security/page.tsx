'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Incident {
  id: string;
  type: string;
  location: string;
  priority: string;
  status: string;
  createdAt: string;
}

// --- CONFIGURACIÓN DE BOTONES (Personalizable por Dispositivo) ---
// Si este tablet es SOLO para la barra, comenta las líneas de Cocina/Entrada.
const EMERGENCY_PRESETS = [
  { type: 'FIGHT', location: 'Pista', label: 'PELEA', icon: '👊', color: 'bg-red-600' },
  { type: 'FIGHT', location: 'Mesas', label: 'ALTERCADO', icon: '🍻', color: 'bg-orange-600' },
  { type: 'DRUNK', location: 'Barra', label: 'EBRIO', icon: '🍺', color: 'bg-yellow-600' },
  { type: 'DRUNK', location: 'Baño', label: 'COLAPSADO', icon: '🤢', color: 'bg-yellow-600' },
  { type: 'MEDICAL', location: 'Pista', label: 'EMERGENCIA', icon: '🚑', color: 'bg-pink-600' },
  { type: 'THEFT', location: 'Entrada', label: 'ROBO', icon: '💸', color: 'bg-purple-600' },
  { type: 'OTHER', location: 'Estacionamiento', label: 'AUTO ROBO', icon: '🚘', color: 'bg-gray-600' },
  { type: 'OTHER', location: 'Camerinos', label: 'PROBLEMA', icon: '🎤', color: 'bg-blue-600' },
];

export default function SecurityDashboard() {
  const [activeAlerts, setActiveAlerts] = useState<Incident[]>([]);
  const [lastReported, setLastReported] = useState<string | null>(null); // Feedback visual

  const TENANT_ID = 'default-tenant';

  // --- 1. ESCUCHAR ALERTAS EN TIEMPO REAL ---
  useEffect(() => {
    const socket: Socket = io('http://localhost:3000');

    socket.on('security_alert', (newIncident: Incident) => {
      console.log('🚨 [ALERTA RECIBIDA]', newIncident);

       // --- 📳 NUEVO: VIBRACIÓN DEL DISPOSITIVO ---
        if (navigator.vibrate) {
          // Patrón SOS: Vibra 200ms, pausa 100ms, Vibra 200ms
          navigator.vibrate([200, 100, 200]);
        }
      // Sonido de alarma
      new Audio('/alert.mp3').play().catch(() => {}); // Fallback si no hay audio
      
      setActiveAlerts(prev => {
        // Evitar duplicados visuales
        if (!prev.some(i => i.id === newIncident.id)) {
          return [newIncident, ...prev];
        }
        return prev;
      });
    });

    socket.on('security_resolved', ({ id }) => {
      setActiveAlerts(prev => prev.filter(i => i.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- 2. FUNCIÓN DE REPORTE RÁPIDO (UN TOQUE) ---
  const handleQuickReport = async (preset: typeof EMERGENCY_PRESETS[0]) => {
    try {
      // 1. Enviar al backend inmediatamente
      await fetch('http://localhost:3000/security/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID,
        },
        body: JSON.stringify({
          type: preset.type,
          location: preset.location,
          priority: 'HIGH', // Por defecto alta para botones rápidos
          description: `Reporte rápido desde dispositivo móvil.`
        }),
      });

      // 2. Feedback Visual en el botón presionado
      setLastReported(preset.label);
      setTimeout(() => setLastReported(null), 2000); // Resetear feedback a los 2 seg

    } catch (error) {
      alert('Error enviando alerta. Verifica conexión.');
    }
  };

  const handleResolve = async (id: string) => {
    await fetch(`http://localhost:3000/security/resolve/${id}`, { method: 'POST' });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans flex flex-col">
      
      {/* BARRA SUPERIOR: ALERTAS ACTIVAS (TICKER) */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-red-500 mb-2">🛡️ SEGURIDAD</h1>
        <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
              alert('¡Vibración activada!');
            }}
            className="text-[10px] text-gray-500 underline mt-1"
          >
            Probar Vibración
          </button>
        
        {/* Carrusel Horizontal de Alertas Activas */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {activeAlerts.length === 0 ? (
            <div className="text-green-500 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              SISTEMA ESTABLE
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div key={alert.id} className="flex-shrink-0 bg-red-900/50 border border-red-500 rounded-lg p-3 min-w-[200px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-red-400 text-sm">{alert.location}</span>
                  <button onClick={() => handleResolve(alert.id)} className="text-xs bg-black/50 px-2 py-1 rounded hover:bg-green-600">
                    ✅ SOLUCIONAR
                  </button>
                </div>
                <div className="text-white font-bold text-lg">{alert.type}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* GRID DE BOTONES DE PÁNICO (Layout Compacto) */}
      {/* Aumentamos columnas a 3 o 4 para aprovechar el espacio vertical */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 flex-grow">
        {EMERGENCY_PRESETS.map((btn, index) => (
          <button
            key={index}
            onClick={() => handleQuickReport(btn)}
            className={`
              relative flex flex-col items-center justify-center rounded-xl shadow-lg transition-all transform active:scale-95 border-t-4
              ${btn.color} text-white
              ${lastReported === btn.label ? 'ring-2 ring-white scale-105 brightness-125' : 'hover:brightness-110'}
            `}
          >
            {/* 1. ÁREA (Principal - Texto Grande) */}
            <span className="text-xl font-bold text-gray-200 uppercase tracking-widest">
              {btn.location}
            </span>
            
            {/* 2. ÍCONO (Mediano) */}
            <span className="text-3xl my-1 drop-shadow-md">
              {btn.icon}
            </span>
            
            {/* 3. MOTIVO (Pequeño) */}
            <span className="text-sm font-semibold text-gray-100">
              {btn.label}
            </span>

            {/* Indicador de Envío */}
            {lastReported === btn.label && (
              <div className="absolute top-1 right-1 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                OK
              </div>
            )}
          </button>
        ))}
      </div>

      {/* PIE DE PÁGINA: Información de Dispositivo */}
      <div className="mt-4 text-center text-gray-500 text-xs border-t border-gray-800 pt-4">
        <p>Dispositivo Asignado: <span className="text-white font-bold">ZONA GENERAL</span></p>
        <p className="mt-1">Versión 1.0 - AllStars2 Security OS</p>
      </div>
    </div>
  );
}