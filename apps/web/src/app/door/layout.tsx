import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Door Control - AllStars2",
  description: "Gestión de seguridad y aforo",
};

export default function DoorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Header de Puerta */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <span className="text-2xl">🚪</span>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">DOOR CONTROL</h1>
            <p className="text-xs text-gray-400">Seguridad y Aforo</p>
          </div>
        </div>

        <Link 
          href="/dashboard/orders"
          className="text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded transition"
        >
          ← Volver a Cocina
        </Link>
      </header>

      {/* Contenido */}
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}