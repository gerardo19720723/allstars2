'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../../../lib/api-client';

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
}

export default function DashboardHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get<Order[]>('/orders');
        const historyOrders = res.data.filter(o => ['SERVED', 'PAID', 'CANCELLED'].includes(o.status));
        historyOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(historyOrders);
      } catch (error) { console.error(error); }
    };
    fetchOrders();
  }, []);

     // 2. Conexión WebSocket (Para ver actualizaciones en tiempo real)
  useEffect(() => {
    // Crear conexión
    const newSocket = io('http://localhost:3000');

    // Escuchar eventos
    newSocket.on('orderUpdated', (updatedOrder: Order) => {
      setOrders((prevOrders) => {
        const existing = prevOrders.find((o) => o.id === updatedOrder.id);
        
        if (existing) {
          // Si la orden cambió a SERVED/PAID/CANCELLED, la agregamos o actualizamos
          if (['SERVED', 'PAID', 'CANCELLED'].includes(updatedOrder.status)) {
            return prevOrders
              .map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          } else {
            // Si vuelve a un estado activo (ej: error humano), la quitamos del historial
            return prevOrders.filter((o) => o.id !== updatedOrder.id);
          }
        } else {
          // Si es nueva y cae en historial, la agregamos
          if (['SERVED', 'PAID', 'CANCELLED'].includes(updatedOrder.status)) {
            return [updatedOrder, ...prevOrders].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          return prevOrders;
        }
      });
    });

    setSocket(newSocket);

    // Función de limpieza al desmontar el componente
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const markAsPaid = async (orderId: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}`, { status: 'PAID' });
    } catch (error) { alert('Error al marcar como pagado'); }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'SERVED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800 font-bold';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Historial de Ventas</h1>
          <p className="text-gray-500">Gestión de cobros</p>
        </div>
      </header>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID / Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.id.slice(-6)}</div>
                    <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.items?.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">${order.total}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {order.status === 'SERVED' && <button onClick={() => markAsPaid(order.id)} className="text-green-600 hover:text-green-900 font-bold bg-green-50 px-3 py-1 rounded border border-green-200">Cobrar 💳</button>}
                    {order.status === 'PAID' && <span className="text-gray-400">Completado ✅</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}