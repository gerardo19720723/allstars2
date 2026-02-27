'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../../../lib/api-client';

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    price: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get<Order[]>('/orders');
        const activeOrders = res.data.filter(o => 
          o.status !== 'PAID' && o.status !== 'CANCELLED' && o.status !== 'SERVED'
        );
        setOrders(activeOrders);
      } catch (error) {
        console.error("Error cargando órdenes", error);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('orderUpdated', (updatedOrder: Order) => {
      setOrders((prevOrders) => {
        const existing = prevOrders.find(o => o.id === updatedOrder.id);
        if (existing) {
          if (['PAID', 'SERVED', 'CANCELLED'].includes(updatedOrder.status)) {
            return prevOrders.filter(o => o.id !== updatedOrder.id);
          }
          return prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        } else {
          if (!['PAID', 'SERVED', 'CANCELLED'].includes(updatedOrder.status)) {
            return [...prevOrders, updatedOrder];
          }
          return prevOrders;
        }
      });
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}`, { status: newStatus });
    } catch (error) {
      alert('Error actualizando estado');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-red-100 border-red-500 text-red-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'READY': return 'bg-green-100 border-green-500 text-green-700';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
           <header className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">👨‍🍳 Kitchen Display System (KDS)</h1>
          <p className="text-gray-400">Pedidos Activos en Tiempo Real</p>
        </div>

        <div className="flex gap-3">
          {/* BOTÓN NUEVO PARA PUERTA */}
          <a
            href="/door"
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold transition flex items-center gap-2"
          >
            🚪 Puerta
          </a>

          <a
            href="/dashboard/history"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold transition"
          >
            💰 Historial
          </a>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className={`bg-gray-800 rounded-lg p-6 border-l-4 shadow-lg ${getStatusColor(order.status)}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-gray-400">#{order.id.slice(-6)}</span>
                <h2 className="text-xl font-bold mt-1">Mesa {order.id.slice(0, 4)}</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-black bg-opacity-30">{order.status}</span>
            </div>
            <div className="space-y-2 mb-6">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-300"><span className="font-bold text-white mr-2">{item.quantity}x</span>{item.product?.name}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
              <span className="font-mono text-lg">${order.total}</span>
              {order.status === 'PENDING' && <button onClick={() => updateStatus(order.id, 'IN_PROGRESS')} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold">Cocinar 🔥</button>}
              {order.status === 'IN_PROGRESS' && <button onClick={() => updateStatus(order.id, 'READY')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold">Listo ✅</button>}
              {order.status === 'READY' && <button onClick={() => updateStatus(order.id, 'SERVED')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">Entregar 🛵</button>}
            </div>
          </div>
        ))}
      </div>
      {orders.length === 0 && <div className="text-center text-gray-500 py-20">No hay pedidos activos 🍽️</div>}
    </div>
  );
}