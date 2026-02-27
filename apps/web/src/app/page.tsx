'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';

// --- TIPOS ---
interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // 1. Cargar Categorías
  useEffect(() => {
    apiClient.get<Category[]>('/menu')
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) setOpenCategory(res.data[0].id);
      })
      .catch((err) => {
        console.error('Error:', err);
        alert('Error: Revisa que el Backend esté corriendo');
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Carrito
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  // 3. Hacer Pedido
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const token = localStorage.getItem('allstars_token');
    if (!token) return alert('⚠️ Falta Token (ve a F12 -> Application -> LocalStorage)');

    try {
      const orderPayload = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };
      const response = await apiClient.post('/orders', orderPayload);
      alert(`✅ Pedido Enviado! ID: ${response.data.id}`);
      setCart([]);
    } catch (error) {
      alert('❌ Error al enviar');
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <main className="min-h-screen pb-20 bg-gray-50 font-sans">
      <header className="bg-gray-900 text-white p-6 shadow-md sticky top-0 z-40">
        <h1 className="text-3xl font-bold text-center">🍸 AllStars Menu</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <button
              onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
              className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 transition flex justify-between items-center font-bold text-lg text-gray-800"
            >
              {category.name}
              <span className="text-gray-400 text-sm">{openCategory === category.id ? '▲' : '▼'}</span>
            </button>

            {openCategory === category.id && (
              <div className="p-4 space-y-3">
                {category.products.map((product) => (
                  <div key={product.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-green-600">${product.price}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-md active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex justify-between items-center z-50">
          <div>
            <span className="font-bold text-lg text-gray-900">Total: ${cartTotal.toFixed(2)}</span>
            <span className="text-xs text-gray-500">{cart.length} items</span>
          </div>
          <button onClick={handleCheckout} className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition transform hover:scale-105">
            Ver Pedido
          </button>
        </div>
      )}
    </main>
  );
}